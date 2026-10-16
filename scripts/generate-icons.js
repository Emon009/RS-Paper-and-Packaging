import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(
  'C:/Users/HP 840 G3/.gemini/antigravity/brain/19b54c37-c86e-40f4-b24d-9105ea9bf773/.user_uploaded/media_1792142424571_618f7d82.jpg'
);
const OUT = path.resolve('public');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const icons = [
  { file: 'icon-512.png',        size: 512 },
  { file: 'icon-192.png',        size: 192 },
  { file: 'icon-maskable.png',   size: 512 },
  { file: 'apple-touch-icon.png',size: 180 },
  { file: 'favicon-32.png',      size: 32  },
];

console.log('🎨 Generating icons from uploaded image...');

for (const { file, size } of icons) {
  await sharp(SRC)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png({ quality: 95, compressionLevel: 8 })
    .toFile(path.join(OUT, file));
  console.log(`  ✓ ${file}  (${size}×${size})`);
}

// Also copy as icon.png (used in manifest / index.html)
await sharp(SRC)
  .resize(512, 512, { fit: 'cover', position: 'centre' })
  .png({ quality: 95 })
  .toFile(path.join(OUT, 'icon.png'));
console.log('  ✓ icon.png  (512×512)');

console.log('\n✅ All icons generated in public/');
