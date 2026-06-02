from django.contrib import admin
from .models import SiteConfig, Category, Product, Order, OrderItem


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


admin.site.site_header = 'Prakrithi Naturals Admin'
admin.site.site_title = 'Prakrithi Admin'
admin.site.index_title = 'Store Administration'
