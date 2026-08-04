import os
import django
import base64
import re
from io import BytesIO

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from PIL import Image
from api.models import Product, SiteConfig

def compress_base64_image(base64_str, max_width=800, max_height=800, quality=75):
    if not base64_str or not isinstance(base64_str, str):
        return base64_str
        
    # Check if it's a base64 data URL
    match = re.match(r'^data:image/(\w+);base64,(.+)$', base64_str, re.DOTALL)
    if not match:
        return base64_str
        
    img_format = match.group(1)
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
    print(f"Original dimension: {width}x{height}, size: {original_size} chars")
    
    # Calculate new size maintaining aspect ratio
    if width > max_width or height > max_height:
        if width > height:
            new_height = int((height * max_width) / width)
            new_width = max_width
        else:
            new_width = int((width * max_height) / height)
            new_height = max_height
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        print(f"Resized to {new_width}x{new_height}")
    
    # Save image to bytes (using WebP format to preserve transparency)
    output = BytesIO()
    try:
        img.save(output, format='WEBP', quality=quality)
        compressed_bytes = output.getvalue()
        compressed_b64 = base64.b64encode(compressed_bytes).decode('utf-8')
        new_base64_str = f"data:image/webp;base64,{compressed_b64}"
        print(f"Compressed size: {len(new_base64_str)} chars (Saved: {(original_size - len(new_base64_str)) / original_size * 100:.1f}%)")
        return new_base64_str
    except Exception as e:
        print(f"Failed to compress/save image: {e}")
        return base64_str

def optimize_products():
    print("=== Optimizing Products ===")
    products = Product.objects.all()
    for p in products:
        if p.image and p.image.startswith("data:image/"):
            print(f"Optimizing Product {p.id}: {p.name}")
            optimized_img = compress_base64_image(p.image, max_width=600, max_height=600, quality=75)
            if optimized_img != p.image:
                p.image = optimized_img
                p.save()
                print(f"Saved Product {p.id}")
            print("-" * 20)

def optimize_site_config():
    print("=== Optimizing SiteConfig ===")
    config_obj = SiteConfig.objects.first()
    if not config_obj:
        print("No SiteConfig found.")
        return
        
    config = config_obj.config_data
    changed = False
    
    # 1. Navbar logo
    if 'navbar' in config and 'logo' in config['navbar']:
        logo = config['navbar']['logo']
        if logo and logo.startswith("data:image/"):
            print("Optimizing Navbar Logo")
            optimized = compress_base64_image(logo, max_width=300, max_height=300, quality=80)
            if optimized != logo:
                config['navbar']['logo'] = optimized
                changed = True
                print("Logo updated")
                
    # 2. Hero background
    if 'hero' in config and 'bgImage' in config['hero']:
        bg = config['hero']['bgImage']
        if bg and bg.startswith("data:image/"):
            print("Optimizing Hero Background")
            optimized = compress_base64_image(bg, max_width=1200, max_height=1200, quality=70)
            if optimized != bg:
                config['hero']['bgImage'] = optimized
                changed = True
                print("Hero BG updated")
                
    # 3. Hero product images
    if 'hero' in config and 'productImages' in config['hero']:
        for item in config['hero']['productImages']:
            img = item.get('image', '')
            if img and img.startswith("data:image/"):
                print(f"Optimizing Hero Product Image: {item.get('label')}")
                optimized = compress_base64_image(img, max_width=600, max_height=600, quality=75)
                if optimized != img:
                    item['image'] = optimized
                    changed = True
                    print(f"Hero product image {item.get('id')} updated")
                    
    # 4. Delivery step images
    if 'delivery' in config and 'steps' in config['delivery']:
        for idx, step in enumerate(config['delivery']['steps']):
            img = step.get('image', '')
            if img and img.startswith("data:image/"):
                print(f"Optimizing Delivery Step {idx + 1}")
                optimized = compress_base64_image(img, max_width=200, max_height=200, quality=85)
                if optimized != img:
                    step['image'] = optimized
                    changed = True
                    print(f"Delivery step {idx + 1} updated")
                    
    # 5. Press logo images
    if 'press' in config and 'logos' in config['press']:
        for idx, logo in enumerate(config['press']['logos']):
            img = logo.get('image', '')
            if img and img.startswith("data:image/"):
                print(f"Optimizing Press Logo {logo.get('name')}")
                optimized = compress_base64_image(img, max_width=300, max_height=300, quality=85)
                if optimized != img:
                    logo['image'] = optimized
                    changed = True
                    print(f"Press logo {logo.get('name')} updated")
                    
    # 6. Reviews section image
    if 'reviewsSection' in config and 'image' in config['reviewsSection']:
        img = config['reviewsSection']['image']
        if img and img.startswith("data:image/"):
            print("Optimizing Reviews Section Image")
            optimized = compress_base64_image(img, max_width=600, max_height=600, quality=75)
            if optimized != img:
                config['reviewsSection']['image'] = optimized
                changed = True
                print("Reviews image updated")
                
    # 7. Our Story image
    if 'ourStory' in config and 'image' in config['ourStory']:
        img = config['ourStory']['image']
        if img and img.startswith("data:image/"):
            print("Optimizing Our Story Image")
            optimized = compress_base64_image(img, max_width=800, max_height=800, quality=75)
            if optimized != img:
                config['ourStory']['image'] = optimized
                changed = True
                print("Our Story image updated")

    # 8. Sections (background images if any)
    if 'sections' in config:
        for idx, sec in enumerate(config['sections']):
            img = sec.get('bgImage', '')
            if img and img.startswith("data:image/"):
                print(f"Optimizing Section Background for {sec.get('id')}")
                optimized = compress_base64_image(img, max_width=1000, max_height=1000, quality=70)
                if optimized != img:
                    sec['bgImage'] = optimized
                    changed = True
                    print(f"Section {sec.get('id')} updated")
                    
    if changed:
        config_obj.config_data = config
        config_obj.save()
        print("SiteConfig saved successfully.")
    else:
        print("No changes needed for SiteConfig.")

if __name__ == "__main__":
    optimize_products()
    optimize_site_config()
    print("Optimization completed!")
