import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// CRC32 calculation table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createPng(width, height, pixelFn) {
  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // no interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Icon Drawing Function
function renderAppIcon(x, y, w, h, isMaskable = false) {
  // Coordinates normalized -1 to 1
  const scale = isMaskable ? 0.75 : 0.88;
  const nx = ((x / w) * 2 - 1) / scale;
  const ny = ((y / h) * 2 - 1) / scale;

  // Background radial gradient
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Rounded rectangle check for icon container (radius ~ 0.3)
  const rRect = 0.88;
  const cornerR = 0.35;
  const dx = Math.max(0, Math.abs(nx) - (rRect - cornerR));
  const dy = Math.max(0, Math.abs(ny) - (rRect - cornerR));
  const cornerDist = Math.sqrt(dx * dx + dy * dy);
  const inContainer = (cornerDist <= cornerR);

  if (!isMaskable && !inContainer) {
    // Transparent outside rounded corner for standard icon
    return [0, 0, 0, 0];
  }

  // Base background: Dark navy slate #0f172a to #1e293b
  let r = Math.round(15 + 15 * (1 - dist * 0.5));
  let g = Math.round(23 + 20 * (1 - dist * 0.5));
  let b = Math.round(42 + 25 * (1 - dist * 0.5));
  let a = 255;

  // Add subtle emerald gradient glow in center
  if (dist < 0.85) {
    const glow = Math.pow(1 - dist / 0.85, 2);
    r = Math.round(r * (1 - glow * 0.4) + 16 * glow);
    g = Math.round(g * (1 - glow * 0.4) + 185 * glow);
    b = Math.round(b * (1 - glow * 0.4) + 129 * glow);
  }

  // Border ring of container
  if (!isMaskable && cornerDist > cornerR - 0.04 && cornerDist <= cornerR) {
    return [16, 185, 129, 230]; // Emerald border
  }

  // Draw stylized "R" and "S" letterforms or Paper Rolls
  // Paper roll emblem in center:
  // Center is around (0, -0.05)
  const cy = ny + 0.05;
  const cx = nx;

  // Outer paper roll cylinder shape
  const rollDist = Math.sqrt(cx * cx * 1.4 + cy * cy * 2.2);
  if (rollDist < 0.45 && rollDist > 0.38) {
    return [52, 211, 153, 255]; // Light emerald ring
  }
  if (rollDist <= 0.38 && rollDist > 0.15) {
    // Paper roll body
    const shade = (cx + 0.3) / 0.6;
    return [
      Math.round(5 + 20 * shade),
      Math.round(150 + 70 * shade),
      Math.round(105 + 50 * shade),
      255
    ];
  }
  if (rollDist <= 0.15 && rollDist > 0.08) {
    // Core of paper roll
    return [245, 158, 11, 255]; // Amber core accent
  }
  if (rollDist <= 0.08) {
    return [15, 23, 42, 255]; // Hole
  }

  // Horizontal paper sheet line accents below roll (ny from 0.45 to 0.65)
  if (ny > 0.42 && ny < 0.49 && Math.abs(nx) < 0.55) {
    return [248, 250, 252, 240]; // White accent bar
  }
  if (ny > 0.54 && ny < 0.60 && Math.abs(nx) < 0.45) {
    return [52, 211, 153, 220]; // Emerald accent bar
  }

  return [r, g, b, a];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons...');
const icon192 = createPng(192, 192, (x, y, w, h) => renderAppIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);

const icon512 = createPng(512, 512, (x, y, w, h) => renderAppIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);

const iconMaskable = createPng(512, 512, (x, y, w, h) => renderAppIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'icon-maskable.png'), iconMaskable);

const appleTouchIcon = createPng(180, 180, (x, y, w, h) => renderAppIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchIcon);

console.log('Icons generated successfully in public/');
