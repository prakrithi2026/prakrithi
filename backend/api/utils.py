import base64
import re
from io import BytesIO

def compress_base64_image(base64_str, max_width=1200, max_height=1200, quality=85):
    """
    Fast base64 image compression.
    If image is already a WebP data URL under 800KB, returns immediately without re-encoding.
    """
    if not base64_str or not isinstance(base64_str, str):
        return base64_str
        
    # If it's a standard URL (http/https or relative path), return as is
    if not base64_str.startswith('data:image/'):
        return base64_str

    # Fast bypass: if it's already WebP and < 800KB, it's already optimized by the frontend
    if base64_str.startswith('data:image/webp;base64,') and len(base64_str) < 800000:
        return base64_str

    # Check if it's a base64 data URL
    match = re.match(r'^data:image/(\w+);base64,(.+)$', base64_str, re.DOTALL)
    if not match:
        return base64_str

    try:
        from PIL import Image
    except Exception:
        return base64_str
        
    img_data_b64 = match.group(2)
    
    try:
        img_bytes = base64.b64decode(img_data_b64)
        img = Image.open(BytesIO(img_bytes))
        width, height = img.size
        
        resized = False
        if width > max_width or height > max_height:
            if width > height:
                new_height = int((height * max_width) / width)
                new_width = max_width
            else:
                new_width = int((width * max_height) / height)
                new_height = max_height
            img = img.resize((new_width, new_height), Image.BICUBIC)
            resized = True
        elif base64_str.startswith('data:image/webp;base64,'):
            return base64_str
        
        output = BytesIO()
        img.save(output, format='WEBP', quality=quality, method=3)
        compressed_bytes = output.getvalue()
        compressed_b64 = base64.b64encode(compressed_bytes).decode('utf-8')
        new_base64_str = f"data:image/webp;base64,{compressed_b64}"
        if resized or len(new_base64_str) < len(base64_str):
            return new_base64_str
        return base64_str
    except Exception:
        return base64_str
