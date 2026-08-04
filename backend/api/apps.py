from django.apps import AppConfig
import threading
import time

def run_db_image_optimization():
    # Wait a few seconds for the database and server to initialize
    time.sleep(5)
    try:
        from django.db import connection
        if "api_product" in connection.introspection.table_names() and "api_siteconfig" in connection.introspection.table_names():
            print("Auto-optimizing database images in background...")
            from api.models import Product, SiteConfig
            from api.utils import compress_base64_image
            
            # Optimize Products
            for p in Product.objects.all():
                if p.image and p.image.startswith("data:image/"):
                    # Check length - if it's large, compress it
                    if len(p.image) > 30000:  # ~30KB
                        optimized = compress_base64_image(p.image, max_width=600, max_height=600, quality=75)
                        if len(optimized) < len(p.image):
                            p.image = optimized
                            p.save()
                            
            # Optimize SiteConfig
            config_obj = SiteConfig.objects.first()
            if config_obj:
                config = config_obj.config_data
                changed = False
                
                # Navbar logo
                if 'navbar' in config and 'logo' in config['navbar']:
                    logo = config['navbar']['logo']
                    if logo and logo.startswith("data:image/") and len(logo) > 20000:
                        optimized = compress_base64_image(logo, max_width=300, max_height=300, quality=80)
                        if len(optimized) < len(logo):
                            config['navbar']['logo'] = optimized
                            changed = True
                            
                # Hero background
                if 'hero' in config and 'bgImage' in config['hero']:
                    bg = config['hero']['bgImage']
                    if bg and bg.startswith("data:image/") and len(bg) > 60000:
                        optimized = compress_base64_image(bg, max_width=1200, max_height=1200, quality=70)
                        if len(optimized) < len(bg):
                            config['hero']['bgImage'] = optimized
                            changed = True
                            
                # Hero product images
                if 'hero' in config and 'productImages' in config['hero']:
                    for item in config['hero']['productImages']:
                        img = item.get('image', '')
                        if img and img.startswith("data:image/") and len(img) > 30000:
                            optimized = compress_base64_image(img, max_width=600, max_height=600, quality=75)
                            if len(optimized) < len(img):
                                item['image'] = optimized
                                changed = True
                                
                # Delivery steps
                if 'delivery' in config and 'steps' in config['delivery']:
                    for step in config['delivery']['steps']:
                        img = step.get('image', '')
                        if img and img.startswith("data:image/") and len(img) > 15000:
                            optimized = compress_base64_image(img, max_width=200, max_height=200, quality=85)
                            if len(optimized) < len(img):
                                step['image'] = optimized
                                changed = True
                                
                # Press logos
                if 'press' in config and 'logos' in config['press']:
                    for logo in config['press']['logos']:
                        img = logo.get('image', '')
                        if img and img.startswith("data:image/") and len(img) > 15000:
                            optimized = compress_base64_image(img, max_width=300, max_height=300, quality=85)
                            if len(optimized) < len(img):
                                logo['image'] = optimized
                                changed = True
                                
                # Reviews image
                if 'reviewsSection' in config and 'image' in config['reviewsSection']:
                    img = config['reviewsSection']['image']
                    if img and img.startswith("data:image/") and len(img) > 30000:
                        optimized = compress_base64_image(img, max_width=600, max_height=600, quality=75)
                        if len(optimized) < len(img):
                            config['reviewsSection']['image'] = optimized
                            changed = True
                            
                # Our Story image
                if 'ourStory' in config and 'image' in config['ourStory']:
                    img = config['ourStory']['image']
                    if img and img.startswith("data:image/") and len(img) > 40000:
                        optimized = compress_base64_image(img, max_width=800, max_height=800, quality=75)
                        if len(optimized) < len(img):
                            config['ourStory']['image'] = optimized
                            changed = True
                            
                if changed:
                    config_obj.config_data = config
                    config_obj.save()
            print("Database image auto-optimization completed successfully.")
    except Exception as e:
        print(f"Error in background image auto-optimization: {e}")

class ApiConfig(AppConfig):
    name = 'api'

    def ready(self):
        # Start background optimization task
        threading.Thread(target=run_db_image_optimization, daemon=True).start()
