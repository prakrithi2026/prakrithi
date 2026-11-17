from django.contrib import admin
from .models import SiteConfig, Category, Product, Order, OrderItem, Review, OfferCode, OfferUsage


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'price')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer_name', 'customer_email', 'total_amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('customer_name', 'customer_email', 'customer_phone')
    list_editable = ('status',)
    readonly_fields = ('created_at',)
    inlines = [OrderItemInline]
    ordering = ('-created_at',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'price', 'salePrice', 'rating', 'reviews')
    list_filter = ('category',)
    search_fields = ('name', 'description')
    list_editable = ('price', 'salePrice')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('category_id', 'label')
    search_fields = ('category_id', 'label')


@admin.register(SiteConfig)
class SiteConfigAdmin(admin.ModelAdmin):
    list_display = ('id', 'updated_at')
    readonly_fields = ('updated_at',)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer_name', 'rating', 'product_name', 'created_at', 'replied_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('customer_name', 'customer_email', 'comment', 'admin_reply')
    readonly_fields = ('created_at', 'replied_at')


@admin.register(OfferCode)
class OfferCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_percentage', 'product', 'min_order_amount', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('code', 'title', 'description')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(OfferUsage)
class OfferUsageAdmin(admin.ModelAdmin):
    list_display = ('offer', 'user_email', 'order', 'discount_amount', 'used_at')
    list_filter = ('used_at',)
    search_fields = ('user_email', 'offer__code')
    readonly_fields = ('used_at',)


admin.site.site_header = 'Prakrithi Naturals Admin'
admin.site.site_title = 'Prakrithi Admin'
admin.site.index_title = 'Store Administration'

