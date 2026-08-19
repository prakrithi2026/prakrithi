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

class SiteConfigView(APIView):
    def get(self, request):
        config, created = SiteConfig.objects.get_or_create(id=1)
        serializer = SiteConfigSerializer(config)
        response = Response(serializer.data['config_data'])
        response['Cache-Control'] = 'public, max-age=60, stale-while-revalidate=300'
        return response

    def put(self, request):
        data = request.data.copy()
        products = data.pop('products', [])
        categories = data.pop('categories', [])
        
        config, created = SiteConfig.objects.get_or_create(id=1)
        config.config_data = data
        config.save()
        
        # Sync Categories
        for cat in categories:
            Category.objects.update_or_create(
                category_id=cat.get('id'),
                defaults={'label': cat.get('label')}
            )
            
        # Sync Products
        existing_ids = [p['id'] for p in products if 'id' in p and p['id']]
        Product.objects.exclude(id__in=existing_ids).delete()
        
        for prod in products:
            cat_id = prod.get('category')
            category_obj = Category.objects.filter(category_id=cat_id).first() if cat_id else None
            
            Product.objects.update_or_create(
                id=prod.get('id'),
                defaults={
                    'name': prod.get('name', ''),
                    'description': prod.get('description', ''),
                    'price': prod.get('price') or 0,
                    'salePrice': prod.get('salePrice'),
                    'image': prod.get('image', ''),
                    'category': category_obj,
                    'tags': prod.get('tags', []),
                    'variants': prod.get('variants', []),
                    'badge': prod.get('badge'),
                    'badgeColor': prod.get('badgeColor'),
                    'badgeTextColor': prod.get('badgeTextColor'),
                    'rating': prod.get('rating') or 0,
                    'reviews': prod.get('reviews') or 0,
                    'couponNote': prod.get('couponNote')
                }
            )
            
        return Response({"status": "success", "message": "Configuration updated"})

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response['Cache-Control'] = 'public, max-age=60, stale-while-revalidate=300'
        return response

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response['Cache-Control'] = 'public, max-age=60, stale-while-revalidate=300'
        return response

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
