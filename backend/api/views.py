from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, action
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
import razorpay
from .models import SiteConfig, Category, Product, Order
from .serializers import SiteConfigSerializer, CategorySerializer, ProductSerializer, OrderSerializer


class LoginView(APIView):
    """
    POST /api/auth/login/
    Body: { "email": "...", "password": "..." }
    Returns: { "token": "...", "name": "...", "email": "..." }
    """
    def post(self, request):
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'detail': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Django's auth uses username; look up by email
        try:
            user_obj = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {'detail': 'No account found with this email.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        user = authenticate(request, username=user_obj.username, password=password)
        if user is None:
            return Response(
                {'detail': 'Incorrect password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Simple session-less token (username:id, base64 encoded)
        import base64
        raw = f"{user.username}:{user.id}"
        token = base64.b64encode(raw.encode()).decode()

        return Response({
            'token': token,
            'name': user.get_full_name() or user.username,
            'email': user.email,
        })


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Body: { "name": "...", "email": "...", "password": "..." }
    """
    def post(self, request):
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'detail': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email__iexact=email).exists():
            return Response(
                {'detail': 'An account with this email already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Use email as username (truncate to 150 chars Django limit)
        username = email.split('@')[0][:30]
        # Ensure username is unique
        base = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}{counter}"
            counter += 1

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )
        if name:
            parts = name.strip().split(' ', 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''
            user.save()

        import base64
        raw = f"{user.username}:{user.id}"
        token = base64.b64encode(raw.encode()).decode()

        return Response({
            'token': token,
            'name': user.get_full_name() or user.username,
            'email': user.email,
        }, status=status.HTTP_201_CREATED)

def deep_merge(base, update):
    if not isinstance(base, dict) or not isinstance(update, dict):
        return update
    result = dict(base)
    for key, value in update.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result

class SiteConfigView(APIView):
    def get(self, request):
        try:
            config, created = SiteConfig.objects.get_or_create(id=1)
            serializer = SiteConfigSerializer(config)
            config_data = serializer.data.get('config_data') or {}
            response = Response(config_data)
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            return response
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request):
        try:
            from django.db import transaction

            data = request.data.copy()
            products = data.pop('products', None)
            categories = data.pop('categories', None)
            
            # Ensure hero.bgImage stays in sync with hero.images if hero.images is provided
            if 'hero' in data and isinstance(data['hero'], dict):
                hero_images = data['hero'].get('images')
                if isinstance(hero_images, list):
                    if len(hero_images) == 0:
                        data['hero']['bgImage'] = ''
                    else:
                        data['hero']['bgImage'] = hero_images[0]

            with transaction.atomic():
                config, created = SiteConfig.objects.get_or_create(id=1)
                merged_config = deep_merge(config.config_data or {}, data)
                config.config_data = merged_config
                config.save()
                
                # Sync Categories efficiently
                if categories is not None and isinstance(categories, list) and len(categories) > 0:
                    existing_cats = {c.category_id: c for c in Category.objects.all()}
                    for cat in categories:
                        if isinstance(cat, dict) and cat.get('id'):
                            cat_id = cat.get('id')
                            cat_label = cat.get('label', '')
                            existing_cat = existing_cats.get(cat_id)
                            if existing_cat:
                                if existing_cat.label != cat_label:
                                    existing_cat.label = cat_label
                                    existing_cat.save(update_fields=['label'])
                            else:
                                Category.objects.create(category_id=cat_id, label=cat_label)
                    
                # Sync Products efficiently
                if products is not None and isinstance(products, list) and len(products) > 0:
                    category_map = {c.category_id: c for c in Category.objects.all()}
                    existing_ids = [p['id'] for p in products if isinstance(p, dict) and 'id' in p and p['id']]
                    if existing_ids:
                        Product.objects.exclude(id__in=existing_ids).delete()
                    
                    existing_prods = {p.id: p for p in Product.objects.filter(id__in=existing_ids)}
                    
                    for prod in products:
                        if not isinstance(prod, dict):
                            continue
                        cat_id = prod.get('category')
                        category_obj = category_map.get(cat_id) if cat_id else None
                        
                        price_val = prod.get('price')
                        try:
                            price_num = float(price_val) if price_val not in (None, '') else 0.0
                        except (ValueError, TypeError):
                            price_num = 0.0

                        sale_price_val = prod.get('salePrice')
                        try:
                            sale_price_num = float(sale_price_val) if sale_price_val not in (None, '') else None
                        except (ValueError, TypeError):
                            sale_price_num = None

                        rating_val = prod.get('rating')
                        try:
                            rating_num = float(rating_val) if rating_val not in (None, '') else 0.0
                        except (ValueError, TypeError):
                            rating_num = 0.0

                        reviews_val = prod.get('reviews')
                        try:
                            reviews_num = int(reviews_val) if reviews_val not in (None, '') else 0
                        except (ValueError, TypeError):
                            reviews_num = 0

                        prod_id = prod.get('id')
                        name = prod.get('name', '')
                        description = prod.get('description', '')
                        image = prod.get('image', '')
                        tags = prod.get('tags', []) if isinstance(prod.get('tags'), list) else []
                        variants = prod.get('variants', []) if isinstance(prod.get('variants'), list) else []
                        badge = prod.get('badge') or None
                        badgeColor = prod.get('badgeColor') or None
                        badgeTextColor = prod.get('badgeTextColor') or None
                        couponNote = prod.get('couponNote') or None

                        existing = existing_prods.get(prod_id) if prod_id else None
                        if existing:
                            changed = (
                                existing.name != name or
                                existing.description != description or
                                float(existing.price) != price_num or
                                (existing.salePrice is not None and float(existing.salePrice) != sale_price_num) or
                                (existing.salePrice is None and sale_price_num is not None) or
                                existing.image != image or
                                existing.category_id != (category_obj.category_id if category_obj else None) or
                                existing.tags != tags or
                                existing.variants != variants or
                                existing.badge != badge or
                                existing.badgeColor != badgeColor or
                                existing.badgeTextColor != badgeTextColor or
                                float(existing.rating) != rating_num or
                                existing.reviews != reviews_num or
                                existing.couponNote != couponNote
                            )
                            if changed:
                                existing.name = name
                                existing.description = description
                                existing.price = price_num
                                existing.salePrice = sale_price_num
                                existing.image = image
                                existing.category = category_obj
                                existing.tags = tags
                                existing.variants = variants
                                existing.badge = badge
                                existing.badgeColor = badgeColor
                                existing.badgeTextColor = badgeTextColor
                                existing.rating = rating_num
                                existing.reviews = reviews_num
                                existing.couponNote = couponNote
                                existing.save()
                        else:
                            Product.objects.create(
                                id=prod_id if prod_id else None,
                                name=name,
                                description=description,
                                price=price_num,
                                salePrice=sale_price_num,
                                image=image,
                                category=category_obj,
                                tags=tags,
                                variants=variants,
                                badge=badge,
                                badgeColor=badgeColor,
                                badgeTextColor=badgeTextColor,
                                rating=rating_num,
                                reviews=reviews_num,
                                couponNote=couponNote
                            )
                    
            return Response({"status": "success", "message": "Configuration updated"})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"status": "error", "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def list(self, request, *args, **kwargs):
        try:
            response = super().list(request, *args, **kwargs)
            response['Cache-Control'] = 'public, max-age=60, stale-while-revalidate=300'
            return response
        except Exception as e:
            return Response([], status=status.HTTP_200_OK)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def list(self, request, *args, **kwargs):
        try:
            response = super().list(request, *args, **kwargs)
            response['Cache-Control'] = 'public, max-age=60, stale-while-revalidate=300'
            return response
        except Exception as e:
            return Response([], status=status.HTTP_200_OK)

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def create(self, request, *args, **kwargs):
        # 1. Save your internal Order first
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        # Check if Razorpay is needed
        payment_method = request.data.get('payment_method', 'cod')
        
        if payment_method in ['upi', 'credit_card']:
            amount_in_paise = int(order.total_amount * 100)
            if settings.RAZORPAY_KEY_ID.startswith('rzp_test_dummy'):
                return Response({
                    'order': serializer.data,
                    'razorpay_order_id': f"order_dummy_{order.id}",
                    'razorpay_key': settings.RAZORPAY_KEY_ID,
                    'amount': amount_in_paise
                })
            
            try:
                client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
                razorpay_order = client.order.create({
                    "amount": amount_in_paise,
                    "currency": "INR",
                    "receipt": f"order_rcptid_{order.id}"
                })
                
                return Response({
                    'order': serializer.data,
                    'razorpay_order_id': razorpay_order['id'],
                    'razorpay_key': settings.RAZORPAY_KEY_ID,
                    'amount': amount_in_paise
                })
            except Exception as e:
                # Fallback to standard response if Razorpay errors (e.g. invalid keys)
                print(f"Razorpay error: {e}")

        return Response({
            'order': serializer.data
        })

    @action(detail=False, methods=['post'])
    def verify_payment(self, request):
        order_id = request.data.get('order_id')
        if settings.RAZORPAY_KEY_ID.startswith('rzp_test_dummy'):
            if order_id:
                try:
                    order = Order.objects.get(id=order_id)
                    order.status = 'processing'
                    order.save()
                except Order.DoesNotExist:
                    pass
            return Response({'status': 'Payment Verified (Demo)'})
            
        try:
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            payment_id = request.data.get('razorpay_payment_id')
            razorpay_order_id = request.data.get('razorpay_order_id')
            signature = request.data.get('razorpay_signature')

            # Verify the signature
            client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': payment_id,
                'razorpay_signature': signature
            })
            
            # If successful, you can mark your database order as 'Paid'
            if order_id:
                try:
                    order = Order.objects.get(id=order_id)
                    order.status = 'processing'
                    order.save()
                except Order.DoesNotExist:
                    pass
            
            return Response({'status': 'Payment Verified'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class OrderTrackView(APIView):
    """
    POST /api/orders/track/
    Body: { "email": "customer@example.com" }
    Returns all orders for that email address with items.
    """
    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        orders = Order.objects.filter(
            customer_email__iexact=email
        ).prefetch_related('items').order_by('-created_at')
        
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
