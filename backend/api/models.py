from django.db import models
from django.core.validators import MinValueValidator

class SiteConfig(models.Model):
    # We will use a singleton pattern, where id=1 is the active config.
    # This stores theme, navbar, footer, sections, etc.
    config_data = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Site Configuration (Last updated: {self.updated_at})"

    def save(self, *args, **kwargs):
        if self.config_data:
            try:
                from .utils import compress_base64_image
                config = self.config_data
                
                # 1. Navbar logo
                if 'navbar' in config and 'logo' in config['navbar']:
                    config['navbar']['logo'] = compress_base64_image(config['navbar']['logo'], max_width=400, max_height=400, quality=85)
                    
                # 2. Hero background (High-res 2560x1440 support)
                if 'hero' in config and 'bgImage' in config['hero']:
                    config['hero']['bgImage'] = compress_base64_image(config['hero']['bgImage'], max_width=2560, max_height=1440, quality=90)
                    
                # 2b. Hero slideshow images (Desktop / Laptop View) (High-res 2560x1440 at 90% quality)
                if 'hero' in config and 'images' in config['hero'] and isinstance(config['hero']['images'], list):
                    config['hero']['images'] = [
                        compress_base64_image(img, max_width=2560, max_height=1440, quality=90) if img else img
                        for img in config['hero']['images']
                    ]

                # 2c. Hero slideshow images (Mobile View) (High-res 1080x1920 at 90% quality)
                if 'hero' in config and 'mobileImages' in config['hero'] and isinstance(config['hero']['mobileImages'], list):
                    config['hero']['mobileImages'] = [
                        compress_base64_image(img, max_width=1080, max_height=1920, quality=90) if img else img
                        for img in config['hero']['mobileImages']
                    ]
                    
                # 3. Hero product images
                if 'hero' in config and 'productImages' in config['hero'] and isinstance(config['hero']['productImages'], list):
                    for item in config['hero']['productImages']:
                        if isinstance(item, dict) and 'image' in item:
                            item['image'] = compress_base64_image(item['image'], max_width=600, max_height=600, quality=80)
                            
                # 4. Delivery step images
                if 'delivery' in config and 'steps' in config['delivery'] and isinstance(config['delivery']['steps'], list):
                    for step in config['delivery']['steps']:
                        if isinstance(step, dict) and 'image' in step:
                            step['image'] = compress_base64_image(step['image'], max_width=120, max_height=120, quality=85)
                            
                # 5. Press logo images
                if 'press' in config and 'logos' in config['press'] and isinstance(config['press']['logos'], list):
                    for logo in config['press']['logos']:
                        if isinstance(logo, dict) and 'image' in logo:
                            logo['image'] = compress_base64_image(logo['image'], max_width=300, max_height=300, quality=85)
                            
                # 6. Reviews section image
                if 'reviewsSection' in config and 'image' in config['reviewsSection']:
                    config['reviewsSection']['image'] = compress_base64_image(config['reviewsSection']['image'], max_width=800, max_height=800, quality=80)
                    
                # 7. Our Story image
                if 'ourStory' in config and 'image' in config['ourStory']:
                    config['ourStory']['image'] = compress_base64_image(config['ourStory']['image'], max_width=1200, max_height=1200, quality=85)

                # 8. Sections backgrounds
                if 'sections' in config and isinstance(config['sections'], list):
                    for sec in config['sections']:
                        if isinstance(sec, dict) and 'bgImage' in sec:
                            sec['bgImage'] = compress_base64_image(sec['bgImage'], max_width=1600, max_height=1600, quality=85)
                            
                self.config_data = config
            except Exception:
                pass
        super().save(*args, **kwargs)

class Category(models.Model):
    category_id = models.CharField(max_length=50, unique=True, primary_key=True)
    label = models.CharField(max_length=100)

    def __str__(self):
        return self.label

class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    salePrice = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    image = models.TextField(blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    
    # Store arrays as JSON
    tags = models.JSONField(default=list, blank=True)
    variants = models.JSONField(default=list, blank=True)
    
    badge = models.CharField(max_length=50, blank=True, null=True)
    badgeColor = models.CharField(max_length=20, blank=True, null=True)
    badgeTextColor = models.CharField(max_length=20, blank=True, null=True)
    
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    reviews = models.IntegerField(default=0)
    couponNote = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.image:
            try:
                from .utils import compress_base64_image
                self.image = compress_base64_image(self.image, max_width=800, max_height=800, quality=80)
            except Exception:
                pass
        super().save(*args, **kwargs)

class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled')
    )
    
    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20)
    shipping_address = models.TextField()
    payment_method = models.CharField(max_length=50, default='cod')
    
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} - {self.customer_name}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    price = models.DecimalField(max_digits=10, decimal_places=2) # Price at time of purchase

    def __str__(self):
        return f"{self.quantity} x {self.product.name if self.product else 'Deleted Product'}"
