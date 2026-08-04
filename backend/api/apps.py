from django.apps import AppConfig
import threading
import time

def run_db_image_optimization():
    # Wait a few seconds for the database and server to initialize
    time.sleep(5)
    try:
        from django.db import connection
        if "api_product" in connection.introspection.table_names() and "api_siteconfig" in connection.introspection.table_names():
            from api.models import Product, SiteConfig
            from api.utils import compress_base64_image
            import json
            import os
            
            # Check if there are any JPEG base64 strings in the database
            has_jpeg = False
            for p in Product.objects.all():
                if p.image and p.image.startswith("data:image/jpeg;base64,"):
                    has_jpeg = True
                    break
            
            if not has_jpeg:
                config_obj = SiteConfig.objects.first()
                if config_obj:
                    config = config_obj.config_data
                    if 'navbar' in config and config['navbar'].get('logo', '').startswith("data:image/jpeg;base64,"):
                        has_jpeg = True
                    elif 'hero' in config and config['hero'].get('bgImage', '').startswith("data:image/jpeg;base64,"):
                        has_jpeg = True
                    elif 'reviewsSection' in config and config['reviewsSection'].get('image', '').startswith("data:image/jpeg;base64,"):
                        has_jpeg = True
            
            # If JPEG images are found, we restore the original transparent ones from datadump.json and convert to WebP
            if has_jpeg and os.path.exists("datadump.json"):
                print("Found JPEG images in remote database. Restoring original transparent WebP images from datadump.json...")
                with open("datadump.json", "r", encoding="utf-8") as f:
                    data = json.load(f)
                
                # Restore Products
                for obj in data:
                    if obj.get('model') == 'api.product':
                        pk = obj.get('pk')
                        fields = obj.get('fields')
                        original_image = fields.get('image', '')
                        if original_image and original_image.startswith('data:image/'):
                            try:
                                product = Product.objects.get(id=pk)
                                product.image = compress_base64_image(original_image, max_width=600, max_height=600, quality=75)
                                product.save()
                            except Product.DoesNotExist:
                                pass
                
                # Restore SiteConfig
                for obj in data:
                    if obj.get('model') == 'api.siteconfig':
                        pk = obj.get('pk')
                        fields = obj.get('fields')
                        original_config = fields.get('config_data', {})
                        if original_config:
                            config = original_config
                            # logo
                            if 'navbar' in config and 'logo' in config['navbar']:
                                logo = config['navbar']['logo']
                                if logo and logo.startswith("data:image/"):
                                    config['navbar']['logo'] = compress_base64_image(logo, max_width=300, max_height=300, quality=80)
                            # hero background
                            if 'hero' in config and 'bgImage' in config['hero']:
                                bg = config['hero']['bgImage']
                                if bg and bg.startswith("data:image/"):
                                    config['hero']['bgImage'] = compress_base64_image(bg, max_width=1200, max_height=1200, quality=70)
                            # hero productImages
                            if 'hero' in config and 'productImages' in config['hero']:
                                for item in config['hero']['productImages']:
                                    if 'image' in item and item['image'].startswith("data:image/"):
                                        item['image'] = compress_base64_image(item['image'], max_width=600, max_height=600, quality=75)
                            # delivery steps
                            if 'delivery' in config and 'steps' in config['delivery']:
                                for step in config['delivery']['steps']:
                                    if 'image' in step and step['image'].startswith("data:image/"):
                                        step['image'] = compress_base64_image(step['image'], max_width=200, max_height=200, quality=85)
                            # press logos
                            if 'press' in config and 'logos' in config['press']:
                                for logo in config['press']['logos']:
                                    if 'image' in logo and logo['image'].startswith("data:image/"):
                                        logo['image'] = compress_base64_image(logo['image'], max_width=300, max_height=300, quality=85)
                            # reviews image
                            if 'reviewsSection' in config and 'image' in config['reviewsSection']:
                                img = config['reviewsSection']['image']
                                if img and img.startswith("data:image/"):
                                    config['reviewsSection']['image'] = compress_base64_image(img, max_width=600, max_height=600, quality=75)
                            # story image
                            if 'ourStory' in config and 'image' in config['ourStory']:
                                img = config['ourStory']['image']
                                if img and img.startswith("data:image/"):
                                    config['ourStory']['image'] = compress_base64_image(img, max_width=800, max_height=800, quality=75)
                            # sections
                            if 'sections' in config:
                                for sec in config['sections']:
                                    if 'bgImage' in sec and sec['bgImage'].startswith("data:image/"):
                                        sec['bgImage'] = compress_base64_image(sec['bgImage'], max_width=1000, max_height=1000, quality=70)
                                        
                            try:
                                site_config = SiteConfig.objects.get(id=pk)
                                site_config.config_data = config
                                site_config.save()
                            except SiteConfig.DoesNotExist:
                                pass
                print("Database auto-restore and WebP optimization completed successfully.")
            else:
                # Normal check/optimization logic for new or unoptimized images
                print("Auto-optimizing database images in background...")
                
                # Optimize Products
                for p in Product.objects.all():
                    if p.image and p.image.startswith("data:image/"):
                        # If it's a huge unoptimized PNG/WebP, compress it
                        if len(p.image) > 30000:
                            optimized = compress_base64_image(p.image, max_width=600, max_height=600, quality=75)
                            if len(optimized) < len(p.image):
                                p.image = optimized
                                p.save()
                                
                # Optimize SiteConfig
                config_obj = SiteConfig.objects.first()
                if config_obj:
                    config = config_obj.config_data
                    changed = False
                    
                    # logo
                    if 'navbar' in config and 'logo' in config['navbar']:
                        logo = config['navbar']['logo']
                        if logo and logo.startswith("data:image/") and len(logo) > 20000:
                            optimized = compress_base64_image(logo, max_width=300, max_height=300, quality=80)
                            if len(optimized) < len(logo):
                                config['navbar']['logo'] = optimized
                                changed = True
                    # background
                    if 'hero' in config and 'bgImage' in config['hero']:
                        bg = config['hero']['bgImage']
                        if bg and bg.startswith("data:image/") and len(bg) > 60000:
                            optimized = compress_base64_image(bg, max_width=1200, max_height=1200, quality=70)
                            if len(optimized) < len(bg):
                                config['hero']['bgImage'] = optimized
                                changed = True
                    # hero productImages
                    if 'hero' in config and 'productImages' in config['hero']:
                        for item in config['hero']['productImages']:
                            img = item.get('image', '')
                            if img and img.startswith("data:image/") and len(img) > 30000:
                                optimized = compress_base64_image(img, max_width=600, max_height=600, quality=75)
                                if len(optimized) < len(img):
                                    item['image'] = optimized
                                    changed = True
                    # delivery steps
                    if 'delivery' in config and 'steps' in config['delivery']:
                        for step in config['delivery']['steps']:
                            img = step.get('image', '')
                            if img and img.startswith("data:image/") and len(img) > 15000:
                                optimized = compress_base64_image(img, max_width=200, max_height=200, quality=85)
                                if len(optimized) < len(img):
                                    step['image'] = optimized
                                    changed = True
                    # press logos
                    if 'press' in config and 'logos' in config['press']:
                        for logo in config['press']['logos']:
                            img = logo.get('image', '')
                            if img and img.startswith("data:image/") and len(img) > 15000:
                                optimized = compress_base64_image(img, max_width=300, max_height=300, quality=85)
                                if len(optimized) < len(img):
                                    logo['image'] = optimized
                                    changed = True
                    # reviews image
                    if 'reviewsSection' in config and 'image' in config['reviewsSection']:
                        img = config['reviewsSection']['image']
                        if img and img.startswith("data:image/") and len(img) > 30000:
                            optimized = compress_base64_image(img, max_width=600, max_height=600, quality=75)
                            if len(optimized) < len(img):
                                config['reviewsSection']['image'] = optimized
                                changed = True
                    # story image
                    if 'ourStory' in config and 'image' in config['ourStory']:
                        img = config['ourStory']['image']
                        if img and img.startswith("data:image/") and len(img) > 40000:
                            optimized = compress_base64_image(img, max_width=800, max_height=800, quality=75)
                            if len(optimized) < len(img):
                                config['ourStory']['image'] = optimized
                                changed = True
                    # sections
                    if 'sections' in config:
                        for sec in config['sections']:
                            img = sec.get('bgImage', '')
                            if img and img.startswith("data:image/") and len(img) > 40000:
                                optimized = compress_base64_image(img, max_width=1000, max_height=1000, quality=70)
                                if len(optimized) < len(img):
                                    sec['bgImage'] = optimized
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
