from rest_framework import serializers
from .models import SiteConfig, Category, Product, Order, OrderItem, Review, OfferCode, OfferUsage

class SiteConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteConfig
        fields = ['config_data', 'updated_at']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['product', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            'id', 'customer_name', 'customer_email', 'customer_phone',
            'shipping_address', 'payment_method', 'total_amount',
            'offer_code', 'discount_amount', 'status', 'created_at', 'items'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        return order

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = [
            'id', 'customer_name', 'customer_email', 'product', 'product_name',
            'rating', 'title', 'comment', 'media_url', 'media_type', 'admin_reply', 'replied_at', 'created_at'
        ]

class OfferUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfferUsage
        fields = ['id', 'user_email', 'order', 'discount_amount', 'used_at']

class OfferCodeSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    products = serializers.PrimaryKeyRelatedField(many=True, queryset=Product.objects.all(), required=False)
    product_ids = serializers.SerializerMethodField()
    product_names = serializers.SerializerMethodField()
    usages_count = serializers.IntegerField(source='usages.count', read_only=True)
    usages = OfferUsageSerializer(many=True, read_only=True)

    class Meta:
        model = OfferCode
        fields = [
            'id', 'code', 'title', 'description', 'discount_percentage',
            'product', 'product_name', 'products', 'product_ids', 'product_names',
            'min_order_amount', 'is_active',
            'created_at', 'updated_at', 'usages_count', 'usages'
        ]

    def get_product_ids(self, obj):
        return obj.get_target_product_ids()

    def get_product_names(self, obj):
        names = list(obj.products.values_list('name', flat=True))
        if not names and obj.product:
            names = [obj.product.name]
        return names

    def create(self, validated_data):
        products_data = validated_data.pop('products', None)
        instance = super().create(validated_data)
        if products_data is not None:
            instance.products.set(products_data)
            if len(products_data) == 1 and not instance.product:
                instance.product = products_data[0]
                instance.save(update_fields=['product'])
        return instance

    def update(self, instance, validated_data):
        products_data = validated_data.pop('products', None)
        instance = super().update(validated_data)
        if products_data is not None:
            instance.products.set(products_data)
            if len(products_data) == 1:
                instance.product = products_data[0]
            elif len(products_data) > 1 or len(products_data) == 0:
                instance.product = None
            instance.save(update_fields=['product'])
        return instance

    def validate_code(self, value):
        val = value.strip().upper()
        if not val:
            raise serializers.ValidationError("Offer code cannot be blank.")
        instance = self.instance
        if OfferCode.objects.filter(code__iexact=val).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError(f"An offer code '{val}' already exists.")
        return val

    def validate_discount_percentage(self, value):
        if value < 1 or value > 100:
            raise serializers.ValidationError("Discount percentage must be between 1 and 100.")
        return value


