/**
 * Auto-compresses an image file in the browser using HTML5 Canvas.
 * Resizes large images (e.g., 4000x3000 phone camera shots) to a lightweight avatar
 * and compresses JPEG/WebP quality to achieve ~20-50KB file sizes.
 *
 * @param {File|Blob} file - The uploaded image file
 * @param {Object} options - Compression options
 * @returns {Promise<{ dataUrl: string, width: number, height: number, originalSize: number, compressedSize: number }>}
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 400,
    maxHeight = 400,
    quality = 0.75,
    format = 'image/jpeg'
  } = options;

  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file');
  }

  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context could not be created'));
          return;
        }

        // Draw image with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed data URL
        const dataUrl = canvas.toDataURL(format, quality);

        // Calculate approximate compressed size from base64 length
        const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
        const compressedSize = Math.round((base64Length * 3) / 4);

        resolve({
          dataUrl,
          width,
          height,
          originalSize,
          compressedSize
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes to readable size (KB/MB)
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
