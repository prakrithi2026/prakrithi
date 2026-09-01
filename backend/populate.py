import os
import json
import django
from decimal import Decimal
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Category, Product, SiteConfig

BASE_DIR = Path(__file__).resolve().parent
json_path = BASE_DIR / 'default_config.json'

if json_path.exists():
    with open(json_path, 'r', encoding='utf-8') as f:
        full_data = json.load(f)
else:
    full_data = {}

products_data = full_data.pop('products', [])
categories_data = full_data.pop('categories', [
    {"id": "all", "label": "All"},
    {"id": "spices", "label": "Spices"},
    {"id": "snacks", "label": "Snacks"},
    {"id": "honey", "label": "Honey"},
    {"id": "whole-grains", "label": "Whole Grains"},
])

# 1. Seed / Update Categories
print("Seeding/updating Categories...")
for cat in categories_data:
    Category.objects.update_or_create(
        category_id=cat["id"],
        defaults={"label": cat["label"]}
    )

# 2. Seed / Update SiteConfig
config_obj = SiteConfig.objects.filter(id=1).first()
if not config_obj:
    print("Creating initial SiteConfig with full images...")
    SiteConfig.objects.create(id=1, config_data=full_data)
else:
    # If existing SiteConfig is missing logo, delivery images, press images, etc., merge and restore them
    existing = config_obj.config_data or {}
    
    # Restore navbar logo if empty
    if not existing.get('navbar', {}).get('logo') and full_data.get('navbar', {}).get('logo'):
        existing.setdefault('navbar', {})['logo'] = full_data['navbar']['logo']
        
    # Restore delivery step images if empty
    if full_data.get('delivery', {}).get('steps'):
        existing_steps = existing.get('delivery', {}).get('steps', [])
        for i, default_step in enumerate(full_data['delivery']['steps']):
            if i < len(existing_steps):
                if not existing_steps[i].get('image') and default_step.get('image'):
                    existing_steps[i]['image'] = default_step['image']
            else:
                existing_steps.append(default_step)
        existing.setdefault('delivery', {})['steps'] = existing_steps
        
    # Restore press logos if empty
    if full_data.get('press', {}).get('logos'):
        existing_logos = existing.get('press', {}).get('logos', [])
        for i, default_logo in enumerate(full_data['press']['logos']):
            if i < len(existing_logos):
                if not existing_logos[i].get('image') and default_logo.get('image'):
                    existing_logos[i]['image'] = default_logo['image']
            else:
                existing_logos.append(default_logo)
        existing.setdefault('press', {})['logos'] = existing_logos
        
    # Restore reviews image if empty
    if not existing.get('reviewsSection', {}).get('image') and full_data.get('reviewsSection', {}).get('image'):
        existing.setdefault('reviewsSection', {})['image'] = full_data['reviewsSection']['image']
        
    config_obj.config_data = existing
    config_obj.save()
    print("SiteConfig updated with complete images.")

# 3. Seed / Update Products
print(f"Seeding/updating {len(products_data)} Products...")
for prod in products_data:
    cat_id = prod.get("category")
    category_obj = Category.objects.filter(category_id=cat_id).first() if cat_id else None
    
    price_val = prod.get("price")
    try:
        price_dec = Decimal(str(price_val)) if price_val not in (None, "") else Decimal("0.00")
    except Exception:
        price_dec = Decimal("0.00")
        
    sale_val = prod.get("salePrice")
    try:
        sale_dec = Decimal(str(sale_val)) if sale_val not in (None, "") else None
    except Exception:
        sale_dec = None
        
    rating_val = prod.get("rating")
    try:
        rating_dec = Decimal(str(rating_val)) if rating_val not in (None, "") else Decimal("0.0")
    except Exception:
        rating_dec = Decimal("0.0")
        
    reviews_val = prod.get("reviews")
    try:
        reviews_int = int(reviews_val) if reviews_val not in (None, "") else 0
    except Exception:
        reviews_int = 0
        
    prod_id = prod.get("id")
    defaults = {
        "name": prod.get("name", ""),
        "description": prod.get("description", ""),
        "price": price_dec,
        "salePrice": sale_dec,
        "image": prod.get("image", ""),
        "category": category_obj,
        "tags": prod.get("tags", []),
        "variants": prod.get("variants", []),
        "badge": prod.get("badge") or None,
        "badgeColor": prod.get("badgeColor") or None,
        "badgeTextColor": prod.get("badgeTextColor") or None,
        "rating": rating_dec,
        "reviews": reviews_int,
        "couponNote": prod.get("couponNote") or None,
    }
    
    Product.objects.update_or_create(
        id=prod_id,
        defaults=defaults
    )

print("Database population and image restoration completed successfully!")
