import base64
import re
from io import BytesIO

def compress_base64_image(base64_str, max_width=1200, max_height=1200, quality=85):
    """
    If base64_str is a base64 data URL, decodes, resizes if larger than max dimensions,
    re-compresses it as WebP at the given quality, and returns the compressed data URL.
    Otherwise returns base64_str unchanged.
    """
    if not base64_str or not isinstance(base64_str, str):
        return base64_str
        
    # Check if it's a base64 data URL
    match = re.match(r'^data:image/(\w+);base64,(.+)$', base64_str, re.DOTALL)
    if not match:
        return base64_str

    try:
        from PIL import Image
    except Exception:
        # If PIL is unavailable or C-extensions are blocked by OS policy,
        # return base64_str as the frontend already optimizes images to WebP
        return base64_str
        
    img_format = match.group(1).lower()
    img_data_b64 = match.group(2)
    
    # Try decoding
    try:
        img_bytes = base64.b64decode(img_data_b64)
    except Exception:
        return base64_str
        
    # Load image with Pillow
    try:
        img = Image.open(BytesIO(img_bytes))
    except Exception:
        return base64_str
        
    # Check dimensions
    try:
        width, height = img.size
        
        # Calculate new size maintaining aspect ratio
        resized = False
        if width > max_width or height > max_height:
            if width > height:
                new_height = int((height * max_width) / width)
                new_width = max_width
            else:
                new_width = int((width * max_height) / height)
                new_height = max_height
            resample_filter = getattr(getattr(Image, 'Resampling', Image), 'LANCZOS', Image.BICUBIC)
            img = img.resize((new_width, new_height), resample_filter)
            resized = True
        elif img_format == 'webp' and len(base64_str) < 500000:
            # Already high quality WebP within dimensions — avoid generation loss
            return base64_str
        
        # Save image to bytes (using WebP format to preserve transparency and high clarity)
        output = BytesIO()
        img.save(output, format='WEBP', quality=quality, method=6)
        compressed_bytes = output.getvalue()
        compressed_b64 = base64.b64encode(compressed_bytes).decode('utf-8')
        new_base64_str = f"data:image/webp;base64,{compressed_b64}"
        if resized or len(new_base64_str) < len(base64_str):
            return new_base64_str
        return base64_str
    except Exception:
        return base64_str
