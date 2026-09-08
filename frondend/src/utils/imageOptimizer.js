/**
 * High-performance image compression and optimization utility for Prakrithi.
 * Resizes and converts raster images to lightweight WebP data URLs.
 * Preserves vector SVG images as clean, scalable SVG data URLs.
 */

export const COMPRESSION_PRESETS = {
  product: { maxWidth: 600, maxHeight: 600, quality: 0.75 },
  hero: { maxWidth: 2560, maxHeight: 1440, quality: 0.90 },
  heroMobile: { maxWidth: 1080, maxHeight: 1920, quality: 0.90 },
  logo: { maxWidth: 400, maxHeight: 400, quality: 0.85 },
  icon: { maxWidth: 120, maxHeight: 120, quality: 0.85 },
  section: { maxWidth: 1200, maxHeight: 1200, quality: 0.75 },
  general: { maxWidth: 800, maxHeight: 800, quality: 0.75 },
};

/**
 * Helper to encode UTF-8 string to Base64 across browser and Node.js environments
 */
function utf8ToBase64(str) {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    try {
      return window.btoa(unescape(encodeURIComponent(str)));
    } catch {
      return window.btoa(str);
    }
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64');
  }
  return '';
}

/**
 * Helper to decode Base64 to UTF-8 string across browser and Node.js environments
 */
function base64ToUtf8(b64) {
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    try {
      return decodeURIComponent(escape(window.atob(b64)));
    } catch {
      return window.atob(b64);
    }
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64, 'base64').toString('utf-8');
  }
  return '';
}

/**
 * Checks whether a value represents SVG code, an SVG data URL, or an .svg URL.
 * Handles raw <svg>, XML declarations (<?xml ...>), comments (<!-- ... -->), and DOCTYPE.
 * @param {string} value
 * @returns {boolean}
 */
export function isSvg(value) {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.startsWith('data:image/svg+xml') || /\.svg(\?.*)?$/i.test(trimmed)) {
    return true;
  }
  return /<svg[\s\S]*<\/svg>/i.test(trimmed);
}

/**
 * Converts raw SVG code into a valid, standard SVG Data URL for use in <img> tags and CSS.
 * Ensures the required xmlns attribute is present.
 * Uses Base64 encoding for 100% universal browser and CSS url() compatibility.
 * @param {string} svgString
 * @returns {string} Standard data:image/svg+xml;base64,... or data:image/svg+xml;utf8,...
 */
export function svgToDataUrl(svgString) {
  if (!svgString || typeof svgString !== 'string') return '';
  let cleanSvg = svgString.trim();

  // If already an SVG data URL or standard URL, return as is
  if (cleanSvg.startsWith('data:image/svg+xml') || cleanSvg.startsWith('http://') || cleanSvg.startsWith('https://') || cleanSvg.startsWith('/')) {
    return cleanSvg;
  }

  // Ensure xmlns is present on <svg> tag for standalone <img> rendering
  if (!cleanSvg.includes('xmlns=')) {
    cleanSvg = cleanSvg.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  try {
    const b64 = utf8ToBase64(cleanSvg);
    if (b64) {
      return `data:image/svg+xml;base64,${b64}`;
    }
  } catch {
    // Fallback to URL-encoded UTF-8
  }

  return `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
}

/**
 * Extracts raw SVG markup from an SVG data URL (base64 or utf-8) or raw SVG code.
 * Returns empty string if not an SVG.
 * @param {string} value
 * @returns {string} Raw SVG markup (e.g. <svg ...>...</svg>)
 */
export function extractSvgCode(value) {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();

  // Raw SVG markup
  if (/<svg[\s\S]*<\/svg>/i.test(trimmed) && !trimmed.startsWith('data:')) {
    return trimmed;
  }

  // SVG Data URL
  if (trimmed.startsWith('data:image/svg+xml')) {
    if (trimmed.includes(';base64,')) {
      try {
        const b64 = trimmed.split(';base64,')[1];
        return base64ToUtf8(b64);
      } catch {
        return '';
      }
    }
    const commaIndex = trimmed.indexOf(',');
    if (commaIndex !== -1) {
      try {
        return decodeURIComponent(trimmed.slice(commaIndex + 1));
      } catch {
        return trimmed.slice(commaIndex + 1);
      }
    }
  }

  return '';
}

/**
 * Normalizes an image string input. If user pasted raw SVG code (including <?xml...),
 * converts it into a valid SVG data URL so it renders in <img> tags without breaking.
 * @param {string} value
 * @returns {string}
 */
export function normalizeImageInput(value) {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (isSvg(trimmed) && !trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
    return svgToDataUrl(trimmed);
  }
  return trimmed;
}

/**
 * Resizes and compresses an image file before upload.
 * If the file is an SVG, reads it directly as vector code and preserves it.
 * If raster (PNG/JPG/WEBP), compresses to WebP using HTML5 Canvas.
 * @param {File} file The original image file
 * @param {number} maxWidth Maximum width of the output image
 * @param {number} maxHeight Maximum height of the output image
 * @param {number} quality Compression quality (0.0 to 1.0)
 * @returns {Promise<string>} Resolves with the data URL
 */
export function compressImage(file, maxWidth = 500, maxHeight = 500, quality = 0.65) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided.'));
      return;
    }

    const isSvgFile = file.type === 'image/svg+xml' || file.name?.toLowerCase().endsWith('.svg');

    // SVG File: preserve as vector SVG without lossy canvas rasterization
    if (isSvgFile) {
      if (typeof file.text === 'function') {
        file.text()
          .then((svgText) => resolve(svgToDataUrl(svgText)))
          .catch((err) => {
            const reader = new FileReader();
            reader.onload = () => resolve(svgToDataUrl(reader.result));
            reader.onerror = () => reject(err);
            reader.readAsText(file);
          });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(svgToDataUrl(reader.result));
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
      return;
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error('Invalid file type. Only images (SVG, PNG, JPG, WEBP) are supported.'));
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) {
        reject(new Error('Could not get 2D canvas context'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Export as compressed WebP
      try {
        const webpUrl = canvas.toDataURL('image/webp', quality);
        if (webpUrl.startsWith('data:image/webp')) {
          resolve(webpUrl);
          return;
        }
      } catch {
        // Fallback if browser canvas WebP export throws
      }

      // Fallback to JPEG if WebP unsupported
      const jpegUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(jpegUrl);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}

/**
 * Compresses an image file using a named preset.
 * @param {File} file The original image file
 * @param {'product' | 'hero' | 'logo' | 'icon' | 'section' | 'general'} presetName
 * @returns {Promise<string>}
 */
export function compressImagePreset(file, presetName = 'general') {
  const preset = COMPRESSION_PRESETS[presetName] || COMPRESSION_PRESETS.general;
  return compressImage(file, preset.maxWidth, preset.maxHeight, preset.quality);
}
