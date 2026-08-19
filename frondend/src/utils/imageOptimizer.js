/**
 * High-performance image compression and optimization utility for Prakrithi.
 * Resizes and converts images to lightweight WebP data URLs before saving.
 */

export const COMPRESSION_PRESETS = {
  product: { maxWidth: 600, maxHeight: 600, quality: 0.75 },
  hero: { maxWidth: 2560, maxHeight: 1440, quality: 0.90 },
  logo: { maxWidth: 400, maxHeight: 400, quality: 0.85 },
  icon: { maxWidth: 120, maxHeight: 120, quality: 0.85 },
  section: { maxWidth: 1200, maxHeight: 1200, quality: 0.75 },
  general: { maxWidth: 800, maxHeight: 800, quality: 0.75 },
};

/**
 * Resizes and compresses an image file before upload.
 * @param {File} file The original image file
 * @param {number} maxWidth Maximum width of the output image
 * @param {number} maxHeight Maximum height of the output image
 * @param {number} quality Compression quality (0.0 to 1.0)
 * @returns {Promise<string>} Resolves with the compressed base64 data URL
 */
export function compressImage(file, maxWidth = 500, maxHeight = 500, quality = 0.65) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Invalid file type. Only images are supported.'));
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
      } catch (e) {
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
