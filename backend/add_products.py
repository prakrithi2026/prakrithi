import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Category, Product

# Ensure categories exist
spices_cat, _ = Category.objects.get_or_create(category_id='spices', defaults={'label': 'Spices'})
snacks_cat, _ = Category.objects.get_or_create(category_id='snacks', defaults={'label': 'Snacks'})
pantry_cat, _ = Category.objects.get_or_create(category_id='pantry', defaults={'label': 'Pantry'})

new_products = [
    {
        "id": 101,
        "name": "Organic Turmeric Powder",
        "description": "Pure, unadulterated turmeric powder rich in curcumin. Sourced directly from our organic farms.",
        "price": Decimal("150.00"),
        "salePrice": Decimal("120.00"),
        "image": "",
        "category": spices_cat,
        "tags": ["organic", "best-seller"],
        "badge": "Sale",
        "badgeColor": "#BDD681",
        "badgeTextColor": "#012B28",
        "rating": Decimal("4.8"),
        "reviews": 45,
        "couponNote": "*Extra 10% off on checkout"
    },
    {
        "id": 102,
        "name": "Kerala Banana Chips (Salted)",
        "description": "Authentic thin and crispy banana chips fried in pure coconut oil.",
        "price": Decimal("180.00"),
        "salePrice": None,
        "image": "",
        "category": snacks_cat,
        "tags": ["crunchy", "new-arrival"],
        "badge": "New",
        "badgeColor": "#00472A",
        "badgeTextColor": "#FFFFFF",
        "rating": Decimal("4.9"),
        "reviews": 112,
        "couponNote": None
    },
    {
        "id": 103,
        "name": "Cold-Pressed Coconut Oil",
        "description": "100% pure, wood-pressed coconut oil. Ideal for cooking, hair, and skin.",
        "price": Decimal("350.00"),
        "salePrice": Decimal("320.00"),
        "image": "",
        "category": pantry_cat,
        "tags": ["essential", "best-seller"],
        "badge": "Best Seller",
        "badgeColor": "#00472A",
        "badgeTextColor": "#FFFFFF",
        "rating": Decimal("5.0"),
        "reviews": 230,
        "couponNote": None
    },
    {
        "id": 104,
        "name": "Premium Whole Cloves",
        "description": "Handpicked, highly aromatic cloves from the hills of Idukki.",
        "price": Decimal("400.00"),
        "salePrice": None,
        "image": "",
        "category": spices_cat,
        "tags": ["premium"],
        "badge": "",
        "badgeColor": "",
        "badgeTextColor": "",
        "rating": Decimal("4.7"),
        "reviews": 89,
        "couponNote": None
    }
]

for prod in new_products:
    Product.objects.update_or_create(
        id=prod["id"],
        defaults=prod
    )

print("4 new products uploaded successfully!")
