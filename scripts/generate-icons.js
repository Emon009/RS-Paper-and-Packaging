import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// CRC32 table
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
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; ihdrData[9] = 6;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset]     = Math.round(Math.max(0, Math.min(255, r)));
      rawData[pxOffset + 1] = Math.round(Math.max(0, Math.min(255, g)));
      rawData[pxOffset + 2] = Math.round(Math.max(0, Math.min(255, b)));
      rawData[pxOffset + 3] = Math.round(Math.max(0, Math.min(255, a)));
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// ─────────────────────────────────────────────
//  Lerp and clamp helpers
// ─────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ─────────────────────────────────────────────
//  Draw a single horizontal paper roll:
//  cylinder body + left ellipse end + core hole
//  All values in normalized [0..1] space.
//
//  Returns [r,g,b,a] or null if not inside roll.
// ─────────────────────────────────────────────
function sampleRoll(px, py, cx, cy, halfW, halfH, brightness = 1.0) {
  // cylinder body rect  (centre = (cx, cy), half-dims = (halfW, halfH))
  const inBody = (px > cx - halfW && px < cx + halfW &&
                  py > cy - halfH && py < cy + halfH);

  // end-face ellipse on the LEFT side (cx - halfW, cy)
  const ex = cx - halfW;
  const ey = cy;
  const faceRx = halfH * 0.78;   // slightly squished
  const faceRy = halfH;
  const faceDistSq = Math.pow((px - ex) / faceRx, 2) + Math.pow((py - ey) / faceRy, 2);
  const inFace = faceDistSq <= 1.0;

  // core hole inside face
  const coreRx = faceRx * 0.32;
  const coreRy = faceRy * 0.32;
  const coreDistSq = Math.pow((px - ex) / coreRx, 2) + Math.pow((py - ey) / coreRy, 2);
  const inCore = coreDistSq <= 1.0;

  if (!inBody && !inFace) return null;

  // ── body shading: light from top-right, paper white-grey
  if (inBody && !inFace) {
    const shade = clamp((px - (cx - halfW)) / (halfW * 2), 0, 1);
    const yShade = clamp(1 - Math.abs((py - cy) / halfH), 0, 1);
    const base = lerp(168, 252, shade) * brightness;
    const highlight = base + yShade * 18 * brightness;
    return [highlight, highlight, highlight + 4, 255];
  }

  // ── end-face of roll (ellipse)
  if (inFace) {
    if (inCore) {
      // innermost hole – dark
      const depth = Math.sqrt(coreDistSq);
      const c = lerp(35, 55, depth);
      return [c, c + 5, c + 10, 255];
    }
    // concentric ring lines on face (spiral paper)
    const faceDist = Math.sqrt(faceDistSq);
    const ringPulse = Math.sin(faceDist * 18) * 0.5 + 0.5;
    const base = lerp(185, 248, 1 - faceDist);
    const val = base - ringPulse * 14 * brightness;
    return [val * brightness, val * brightness, val * brightness + 6, 255];
  }

  return null;
}

// ─────────────────────────────────────────────
//  Main icon renderer — stacked paper rolls
//  matching the pyramid from the photo:
//    top:    1 roll  (centred)
//    mid:    2 rolls
//    bottom: 3 rolls
// ─────────────────────────────────────────────
function renderPaperRollIcon(px, py, W, H, isMaskable = false) {
  // Normalize to [0..1]
  const nx = px / W;
  const ny = py / H;

  // ── rounded-rect container mask (standard icon)
  const cornerR = 0.22;
  const edgeInset = 0.06;
  const dxM = Math.max(0, Math.abs(nx - 0.5) - (0.5 - edgeInset - cornerR));
  const dyM = Math.max(0, Math.abs(ny - 0.5) - (0.5 - edgeInset - cornerR));
  const cornerDist = Math.sqrt(dxM * dxM + dyM * dyM);
  const inContainer = cornerDist <= cornerR;

  if (!isMaskable && !inContainer) return [0, 0, 0, 0];

  // ── Background dark navy gradient
  const distFromCentre = Math.sqrt(Math.pow(nx - 0.5, 2) + Math.pow(ny - 0.5, 2));
  const bgLight = 1 - distFromCentre * 0.65;
  let r = lerp(10, 22, bgLight);
  let g = lerp(18, 36, bgLight);
  let b = lerp(36, 60, bgLight);
  let a = 255;

  // Subtle teal glow in upper-centre
  const glowD = Math.sqrt(Math.pow(nx - 0.5, 2) + Math.pow(ny - 0.35, 2));
  if (glowD < 0.35) {
    const gi = Math.pow(1 - glowD / 0.35, 2) * 0.18;
    r = lerp(r, 20, gi); g = lerp(g, 160, gi); b = lerp(b, 110, gi);
  }

  // ─────────────── Roll definitions ───────────────
  // Layout is centred in [0..1] space.
  // roll half-width (hW) and half-height (hH) tuned so 3 rolls fit.
  // With margins: total roll width ≈ 0.27, height ≈ 0.14
  const hW = 0.135;   // half of body length along X
  const hH = 0.072;   // half-height of cylinder

  const rowGap = hH * 2 + 0.012;   // vertical step per stacked layer
  const colGap = hW * 2 + 0.015;   // horizontal step between rolls in same row

  // Y positions of row centres (bottom at 0.72, stacking upward)
  const yB = 0.69;           // bottom row
  const yM = yB - rowGap;    // middle row
  const yT = yM - rowGap;    // top row

  // X positions per row
  const xLeft   = 0.5 - colGap;
  const xCentre = 0.5;
  const xRight  = 0.5 + colGap;
  const xML     = 0.5 - colGap * 0.5;
  const xMR     = 0.5 + colGap * 0.5;

  // Define all 6 rolls: [cx, cy, brightnessMultiplier]
  // Render back-to-front so later rolls paint over earlier ones
  const rolls = [
    // Bottom row (3)
    [xLeft,   yB, 0.90],
    [xCentre, yB, 0.95],
    [xRight,  yB, 0.85],
    // Middle row (2)
    [xML, yM, 0.96],
    [xMR, yM, 0.92],
    // Top roll (1)
    [xCentre, yT, 1.00],
  ];

  // Sample each roll
  for (const [cx, cy, bright] of rolls) {
    const hit = sampleRoll(nx, ny, cx, cy, hW, hH, bright);
    if (hit) {
      [r, g, b, a] = hit;
      // cast a slight shadow / overlap tint from roll above
      // (darkened at the very top edge of roll body where next roll rests)
      const topEdge = cy - hH;
      if (ny > topEdge - 0.008 && ny < topEdge + 0.008) {
        r = r * 0.82; g = g * 0.82; b = b * 0.82;
      }
    }
  }

  // ── Ground shadow ellipse beneath bottom row
  const sEx = nx - 0.5;
  const sEy = ny - (yB + hH + 0.032);
  const shadowD = Math.sqrt(Math.pow(sEx / 0.42, 2) + Math.pow(sEy / 0.022, 2));
  if (shadowD <= 1.0 && a < 200) {
    const si = Math.pow(1 - shadowD, 1.5) * 0.55;
    r = r * (1 - si); g = g * (1 - si); b = b * (1 - si); a = 255;
  }

  // ── Emerald pill branding at bottom (RS label)
  const pillCy = 0.875;
  const pillH  = 0.058;
  const pillW  = 0.22;
  const inPill = Math.abs(nx - 0.5) <= pillW - pillH / 2 && Math.abs(ny - pillCy) <= pillH;
  const pillCapL = Math.sqrt(Math.pow(nx - (0.5 - pillW + pillH), 2) + Math.pow(ny - pillCy, 2));
  const pillCapR = Math.sqrt(Math.pow(nx - (0.5 + pillW - pillH), 2) + Math.pow(ny - pillCy, 2));
  const inPillCaps = pillCapL <= pillH || pillCapR <= pillH;

  if ((inPill || inPillCaps) && inContainer) {
    const gradT = (nx - (0.5 - pillW)) / (pillW * 2);
    r = lerp(16, 5, gradT);
    g = lerp(185, 150, gradT);
    b = lerp(129, 105, gradT);
    a = 255;

    // White "RS" letters inside pill (simple block pixel font approximation)
    const lx = (nx - 0.5) / pillW;   // -1..+1 across pill
    const ly = (ny - pillCy) / pillH; // -1..+1 top-bottom

    // "R" glyph  occupies lx ~ -0.60 to -0.08
    const inR = (lx > -0.62 && lx < -0.08 && Math.abs(ly) < 0.75);
    // "S" glyph  occupies lx ~  0.08 to  0.60
    const inS = (lx >  0.06 && lx <  0.62 && Math.abs(ly) < 0.75);
    if (inR || inS) {
      r = 255; g = 255; b = 255; a = 255;
    }
  }

  // ── Thin emerald underline bar below pill
  const barCy = 0.944;
  const barH  = 0.010;
  const barW  = 0.24;
  if (Math.abs(nx - 0.5) < barW && Math.abs(ny - barCy) < barH && inContainer) {
    r = 16; g = 185; b = 129; a = 200;
  }

  return [r, g, b, a];
}

// ─────────────── Write all icons ───────────────
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

console.log('🎨 Generating paper-roll PWA icons...');

const icon192 = createPng(192, 192, (x, y, w, h) => renderPaperRollIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);
console.log('  ✓ icon-192.png');

const icon512 = createPng(512, 512, (x, y, w, h) => renderPaperRollIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);
console.log('  ✓ icon-512.png');

const iconMaskable = createPng(512, 512, (x, y, w, h) => renderPaperRollIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'icon-maskable.png'), iconMaskable);
console.log('  ✓ icon-maskable.png');

const apple = createPng(180, 180, (x, y, w, h) => renderPaperRollIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), apple);
console.log('  ✓ apple-touch-icon.png');

console.log('✅ All paper-roll icons generated in public/');
