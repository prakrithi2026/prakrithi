import base64
import re
from io import BytesIO
from PIL import Image

def compress_base64_image(base64_str, max_width=800, max_height=800, quality=75):
    """
    If base64_str is a base64 data URL, decodes, resizes if larger than max dimensions,
    re-compresses it as a JPEG at the given quality, and returns the compressed data URL.
    Otherwise returns base64_str unchanged.
    """
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
    except Exception:
        return base64_str
        
    # Load image with Pillow
    try:
        img = Image.open(BytesIO(img_bytes))
    except Exception:
        return base64_str
        
    # Check dimensions
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
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        resized = True
    
    # Save image to bytes (using WebP format to preserve transparency)
    output = BytesIO()
    try:
        img.save(output, format='WEBP', quality=quality)
        compressed_bytes = output.getvalue()
        compressed_b64 = base64.b64encode(compressed_bytes).decode('utf-8')
        return f"data:image/webp;base64,{compressed_b64}"
    except Exception:
        return base64_str
