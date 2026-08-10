import os
import django
import json
import base64
import re
from io import BytesIO

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from PIL import Image
from api.models import Product, SiteConfig

def compress_to_webp(base64_str, max_width=800, max_height=800, quality=75):
    if not base64_str or not isinstance(base64_str, str):
        return base64_str
        
    # Check if it's a base64 data URL
    match = re.match(r'^data:image/(\w+);base64,(.+)$', base64_str, re.DOTALL)
    if not match:
        return base64_str
        
    img_data_b64 = match.group(2)
    
    # Try decoding
    try:
        img_bytes = base64.b64decode(img_data_b64)
    except Exception as e:
        print(f"Failed to decode base64: {e}")
        return base64_str
        
    # Load image with Pillow
    try:
        img = Image.open(BytesIO(img_bytes))
    except Exception as e:
        print(f"Failed to open image with PIL: {e}")
        return base64_str
        
    original_size = len(base64_str)
    
    # Check dimensions
    width, height = img.size
    
    # Calculate new size maintaining aspect ratio
    if width > max_width or height > max_height:
        if width > height:
            new_height = int((height * max_width) / width)
            new_width = max_width
        else:
            new_width = int((width * max_height) / height)
            new_height = max_height
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    # Save image to bytes as WEBP to preserve transparency
    output = BytesIO()
    try:
        img.save(output, format='WEBP', quality=quality)
        compressed_bytes = output.getvalue()
        compressed_b64 = base64.b64encode(compressed_bytes).decode('utf-8')
        new_base64_str = f"data:image/webp;base64,{compressed_b64}"
        print(f"Compressed: {width}x{height} -> {img.width}x{img.height}. Size: {original_size} -> {len(new_base64_str)} chars")
        return new_base64_str
    except Exception as e:
        print(f"Failed to compress to WebP: {e}")
        return base64_str

def restore_from_dump():
    dump_path = 'datadump.json'
    if not os.path.exists(dump_path):
        print(f"Error: {dump_path} not found.")
        return
        
    print(f"Loading data from {dump_path}...")
    with open(dump_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    print("=== Restoring and Compressing Products to WebP ===")
    for obj in data:
        if obj.get('model') == 'api.product':
            pk = obj.get('pk')
            fields = obj.get('fields')
            original_image = fields.get('image', '')
            
            if original_image and original_image.startswith('data:image/'):
                print(f"Restoring Product {pk}: {fields.get('name')}")
                webp_image = compress_to_webp(original_image, max_width=600, max_height=600, quality=75)
                
                try:
                    product = Product.objects.get(id=pk)
                    product.image = webp_image
                    product.save()
                    print(f"Updated Product {pk} in database.")
                except Product.DoesNotExist:
                    print(f"Product {pk} not found in database. Skipping.")
                print("-" * 20)
                
    print("=== Restoring and Compressing SiteConfig to WebP ===")
    for obj in data:
        if obj.get('model') == 'api.siteconfig':
            pk = obj.get('pk')
            fields = obj.get('fields')
            original_config = fields.get('config_data', {})
            
            if original_config:
                print(f"Restoring SiteConfig {pk}")
                config = original_config
                
                # Navbar logo
                if 'navbar' in config and 'logo' in config['navbar']:
                    logo = config['navbar']['logo']
                    if logo and logo.startswith("data:image/"):
                        print("Optimizing Logo")
                        config['navbar']['logo'] = compress_to_webp(logo, max_width=300, max_height=300, quality=80)
                        
                # Hero bg
                if 'hero' in config and 'bgImage' in config['hero']:
                    bg = config['hero']['bgImage']
                    if bg and bg.startswith("data:image/"):
                        print("Optimizing Hero Background")
                        config['hero']['bgImage'] = compress_to_webp(bg, max_width=1200, max_height=1200, quality=70)
                        
                # Hero slideshow images
                if 'hero' in config and 'images' in config['hero'] and isinstance(config['hero']['images'], list):
                    new_images = []
                    for idx, img in enumerate(config['hero']['images']):
                        if img and img.startswith("data:image/"):
                            print(f"Optimizing Hero Slideshow Image {idx + 1}")
                            new_images.append(compress_to_webp(img, max_width=1200, max_height=1200, quality=70))
                        else:
                            new_images.append(img)
                    config['hero']['images'] = new_images
                        
                # Hero product images
                if 'hero' in config and 'productImages' in config['hero']:
                    for item in config['hero']['productImages']:
                        img = item.get('image', '')
                        if img and img.startswith("data:image/"):
                            print(f"Optimizing Hero Product Image: {item.get('label')}")
                            item['image'] = compress_to_webp(img, max_width=600, max_height=600, quality=75)
                            
                # Delivery steps
                if 'delivery' in config and 'steps' in config['delivery']:
                    for idx, step in enumerate(config['delivery']['steps']):
                        img = step.get('image', '')
                        if img and img.startswith("data:image/"):
                            print(f"Optimizing Delivery Step {idx + 1}")
                            step['image'] = compress_to_webp(img, max_width=200, max_height=200, quality=85)
                            
                # Press logos
                if 'press' in config and 'logos' in config['press']:
                    for idx, logo in enumerate(config['press']['logos']):
                        img = logo.get('image', '')
                        if img and img.startswith("data:image/"):
                            print(f"Optimizing Press Logo {ascii(logo.get('name'))}")
                            logo['image'] = compress_to_webp(img, max_width=300, max_height=300, quality=85)
                            
                # Reviews image
                if 'reviewsSection' in config and 'image' in config['reviewsSection']:
                    img = config['reviewsSection']['image']
                    if img and img.startswith("data:image/"):
                        print("Optimizing Reviews Section Image")
                        config['reviewsSection']['image'] = compress_to_webp(img, max_width=600, max_height=600, quality=75)
                        
                # Our Story image
                if 'ourStory' in config and 'image' in config['ourStory']:
                    img = config['ourStory']['image']
                    if img and img.startswith("data:image/"):
                        print("Optimizing Our Story Image")
                        config['ourStory']['image'] = compress_to_webp(img, max_width=800, max_height=800, quality=75)
                        
                # Sections bg
                if 'sections' in config:
                    for sec in config['sections']:
                        img = sec.get('bgImage', '')
                        if img and img.startswith("data:image/"):
                            print(f"Optimizing Section Background for {sec.get('id')}")
                            sec['bgImage'] = compress_to_webp(img, max_width=1000, max_height=1000, quality=70)
                            
                try:
                    site_config = SiteConfig.objects.get(id=pk)
                    site_config.config_data = config
                    site_config.save()
                    print(f"Updated SiteConfig {pk} in database.")
                except SiteConfig.DoesNotExist:
                    print(f"SiteConfig {pk} not found in database. Skipping.")
                print("-" * 20)

if __name__ == '__main__':
    restore_from_dump()
    print("Restore and WebP compression completed!")
