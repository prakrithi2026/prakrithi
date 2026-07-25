import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Category, Product, SiteConfig

config_data = {
  "theme": {
    "primaryColor": "#00472A",
    "secondaryColor": "#F5F5DC",
    "accentColor": "#BDD681",
    "backgroundColor": "#fdfdfd",
    "textColor": "#333333",
    "headingColor": "#012B28",
    "fontFamily": "'Jost', 'Poppins', sans-serif",
    "borderRadius": "12px",
    "cardShadow": "0 2px 12px rgba(0,0,0,0.08)"
  },
  "announcement": {
    "enabled": True,
    "text": "Extra Rs.250 OFF on your 1st Order on all orders above Rs.999 Use Code : PR 999",
    "bgColor": "#00472A",
    "textColor": "#FFFFFF"
  },
  "navbar": {
    "logo": "",
    "logoSize": 125,
    "brandName": "Prakrithi",
    "brandSubtitle": "NATURALS",
    "bgColor": "#FFFFFF",
    "textColor": "#012B28",
    "items": [
      { "id": "products", "label": "Our products", "href": "#", "hasDropdown": True, "dropdownItems": [
        { "label": "Best Sellers", "href": "#" },
        { "label": "New Arrivals", "href": "#" },
        { "label": "Kerala Spices", "href": "#" },
        { "label": "Snacks", "href": "#" },
        { "label": "Honey", "href": "#" }
      ]},
      { "id": "sale", "label": "Sale On", "href": "#", "badge": "10% OFF", "badgeColor": "#BDD681", "badgeTextColor": "#012B28" },
      { "id": "new", "label": "New arrivals", "href": "#", "badge": "Trending ⚡", "badgeColor": "#00472A", "badgeTextColor": "#FFFFFF" },
      { "id": "best", "label": "Best Sellers", "href": "#" },
      { "id": "account", "label": "My Account & More", "href": "#", "hasDropdown": True, "dropdownItems": [
        { "label": "My Orders", "href": "#" },
        { "label": "Wishlist", "href": "#" },
        { "label": "Track Order", "href": "#" },
        { "label": "Contact Us", "href": "#" }
      ]}
    ]
  },
  "hero": {
    "enabled": True,
    "bgImage": "",
    "bgColor": "#2E7D32",
    "overlayOpacity": 0.3,
    "tagline": "100% Natural | Premium Quality",
    "title": "Kerala Spices",
    "subtitle": "Get 25% OFF On your 1st order.",
    "ctaText": "Use Code : PR25",
    "ctaLink": "#",
    "ctaBgColor": "#00472A",
    "ctaTextColor": "#FFFFFF",
    "textAlign": "left",
    "showProductImages": True,
    "productImages": [
      { "id": 1, "emoji": "🌿", "label": "Kerala\nSpices", "image": "" },
      { "id": 2, "emoji": "🌶️", "label": "Black\nPepper", "image": "" }
    ]
  },
  "sections": [
    { "id": "shopByProduct", "label": "Shop by Product", "enabled": True, "order": 0 },
    { "id": "delivery", "label": "Delivery Process", "enabled": True, "order": 1 },
    { "id": "shopByConcern", "label": "Shop by Concern", "enabled": True, "order": 2 },
    { "id": "press", "label": "Press / Media", "enabled": True, "order": 3 },
    { "id": "reviews", "label": "Reviews & Ratings", "enabled": True, "order": 4 }
  ],
  "delivery": {
    "title": "How we deliver",
    "subtitle": "fresh natural products",
    "tcNote": "*T&C Apply.",
    "steps": [
      { "icon": "bag", "label": "ORDER" },
      { "icon": "seedling", "label": "SOURCE" },
      { "icon": "check", "label": "INSPECT" },
      { "icon": "box", "label": "PACKING" },
      { "icon": "truck", "label": "SHIPPING" },
      { "icon": "location", "label": "DELIVER" }
    ]
  },
  "press": {
    "bgColor": "#BDD681",
    "logos": [
      { "name": "മാതൃഭൂമി", "style": "malayalam" },
      { "name": "YOURSTORY", "style": "yourstory" },
      { "name": "INDIA TODAY", "style": "indiatoday" },
      { "name": "mint", "style": "mint" },
      { "name": "THE HINDU", "style": "thehindu" }
    ]
  },
  "reviewsSection": {
    "familyCount": "1000+",
    "googleRating": 4.9,
    "totalReviews": 1183
  },
  "footer": {
    "brandName": "Prakrithi Origins",
    "trademark": True,
    "aboutText": "Founded In 2024, Prakrithi Pure Organics brings you the pure essence of nature from the lush hills of Idukki and wayanad, kerala. We're dedicated to offering authentic, Natural products crafted with care — Straight from nature's heart to your home.",
    "columns": [
      {
        "title": "Shop For",
        "links": [
          { "label": "Kerala Spices", "href": "#" },
          { "label": "Blended Spice", "href": "#" },
          { "label": "Essential Oils", "href": "#" },
          { "label": "Ayurveda", "href": "#" },
          { "label": "Grains", "href": "#" },
          { "label": "Dry Fruits", "href": "#" },
          { "label": "Honey", "href": "#" },
          { "label": "All Products", "href": "#" }
        ]
      }
    ],
    "contact": {
      "phone": "+91 8606282501",
      "email": "info@prakrithi.in",
      "orderEmail": "sale.prakrithi@gmail.com"
    },
    "address": "13i DD Sunset Island Apartment Complex Vypin, Munapam Road, Schoolmuttam, Kochi, Kerala 682511",
    "socialLinks": {
      "facebook": "#",
      "twitter": "#",
      "instagram": "#",
      "whatsapp": "#"
    },
    "copyright": "© 2026, Prakrithi Naturals"
  }
}

categories = [
  { "id": "all", "label": "All" },
  { "id": "spices", "label": "Spices" },
  { "id": "snacks", "label": "Snacks" },
  { "id": "honey", "label": "Honey" },
  { "id": "whole-grains", "label": "Whole Grains" }
]

products = [
  {
    "id": 1,
    "name": "Organic Cardamom",
    "description": "From our organic farms to your kitchen.",
    "price": 200,
    "salePrice": None,
    "image": "",
    "category": "spices",
    "tags": ["new-arrival"],
    "badge": "New",
    "badgeColor": "#00472A",
    "rating": 4.9,
    "reviews": 28,
    "variants": [],
    "couponNote": None
  },
  {
    "id": 2,
    "name": "Organic Cardamom",
    "description": "From our organic farms to your kitchen.",
    "price": 200,
    "salePrice": 180,
    "image": "",
    "category": "spices",
    "tags": ["on-sale"],
    "badge": "Sale 10% Off",
    "badgeColor": "#BDD681",
    "badgeTextColor": "#012B28",
    "rating": 4.9,
    "reviews": 28,
    "variants": [],
    "couponNote": "*Best Price ₹180 with coupon"
  }
]

# Create or Update Config
SiteConfig.objects.update_or_create(id=1, defaults={"config_data": config_data})

# Create or Update Categories
for cat in categories:
    Category.objects.update_or_create(category_id=cat["id"], defaults={"label": cat["label"]})

# Create or Update Products
for prod in products:
    category_obj = Category.objects.filter(category_id=prod["category"]).first()
    Product.objects.update_or_create(
        id=prod["id"],
        defaults={
            "name": prod["name"],
            "description": prod["description"],
            "price": Decimal(str(prod["price"])),
            "salePrice": Decimal(str(prod["salePrice"])) if prod["salePrice"] else None,
            "image": prod["image"],
            "category": category_obj,
            "tags": prod["tags"],
            "variants": prod["variants"],
            "badge": prod.get("badge"),
            "badgeColor": prod.get("badgeColor"),
            "badgeTextColor": prod.get("badgeTextColor"),
            "rating": Decimal(str(prod["rating"])),
            "reviews": prod["reviews"],
            "couponNote": prod.get("couponNote")
        }
    )

print("Database populated successfully!")
