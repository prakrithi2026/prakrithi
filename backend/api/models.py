from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth.models import User
from django.utils import timezone

class SiteConfig(models.Model):
    # We will use a singleton pattern, where id=1 is the active config.
    # This stores theme, navbar, footer, sections, etc.
    config_data = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Site Configuration (Last updated: {self.updated_at})"

    def save(self, *args, **kwargs):
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
    images = models.JSONField(default=list, blank=True)
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
        if self.images is None:
            self.images = []
        elif not isinstance(self.images, list):
            self.images = [self.images]

        if not self.images and self.image:
            self.images = [self.image]
        elif self.images and not self.image:
            self.image = self.images[0]
        elif self.images and self.image and self.image not in self.images:
            self.images.insert(0, self.image)

        if self.images:
            compressed_list = []
            for img in self.images:
                if img and isinstance(img, str) and img.startswith('data:image/') and not img.startswith('data:image/webp;base64,') and not img.startswith('data:image/svg+xml'):
                    try:
                        from .utils import compress_base64_image
                        img = compress_base64_image(img, max_width=800, max_height=800, quality=80)
                    except Exception:
                        pass
                compressed_list.append(img)
            self.images = compressed_list
            if self.images:
                self.image = self.images[0]

        if self.image and isinstance(self.image, str) and self.image.startswith('data:image/') and not self.image.startswith('data:image/webp;base64,') and not self.image.startswith('data:image/svg+xml'):
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


class PasswordResetCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_codes')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def is_valid(self):
        return not self.is_used and timezone.now() <= self.expires_at

    def __str__(self):
        return f"Reset code for {self.user.email} ({self.code})"


class Review(models.Model):
    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField(blank=True, null=True)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='product_reviews')
    product_name = models.CharField(max_length=255, blank=True, null=True)
    rating = models.PositiveSmallIntegerField(default=5)
    title = models.CharField(max_length=255, blank=True, null=True)
    comment = models.TextField()
    media_url = models.TextField(blank=True, null=True)
    media_type = models.CharField(max_length=20, blank=True, null=True)
    admin_reply = models.TextField(blank=True, null=True)
    replied_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Review by {self.customer_name} ({self.rating}★)"
