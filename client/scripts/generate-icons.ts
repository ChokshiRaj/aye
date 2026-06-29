// @ts-ignore
import { createCanvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.resolve(__dirname, '../public/icons');
const publicDir = path.resolve(__dirname, '../public');

// Create icons directory if not exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons
sizes.forEach((size) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background - Slate 900 (#0f172a)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, size, size);

  // Logo Red Box (#dc2626) in the center (scaled with size)
  const boxSize = size * 0.6;
  const boxOffset = (size - boxSize) / 2;
  const radius = size * 0.12;

  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.roundRect(boxOffset, boxOffset, boxSize, boxSize, radius);
  ctx.fill();

  // White "A" inside the red box
  ctx.fillStyle = '#ffffff';
  ctx.font = `black ${Math.floor(size * 0.35)}px "Inter", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', size / 2, size / 2);

  const buffer = canvas.toBuffer('image/png');
  const filename = `icon-${size}.png`;
  fs.writeFileSync(path.join(iconsDir, filename), buffer);
  console.log(`Generated: public/icons/${filename}`);
});

// Also generate apple-touch-icon.png in public/
const canvasApple = createCanvas(180, 180);
const ctxApple = canvasApple.getContext('2d');
ctxApple.fillStyle = '#0f172a';
ctxApple.fillRect(0, 0, 180, 180);
const boxSizeApple = 180 * 0.6;
const boxOffsetApple = (180 - boxSizeApple) / 2;
ctxApple.fillStyle = '#dc2626';
ctxApple.beginPath();
ctxApple.roundRect(boxOffsetApple, boxOffsetApple, boxSizeApple, boxSizeApple, 180 * 0.12);
ctxApple.fill();
ctxApple.fillStyle = '#ffffff';
ctxApple.font = `black ${Math.floor(180 * 0.35)}px "Inter", sans-serif`;
ctxApple.textAlign = 'center';
ctxApple.textBaseline = 'middle';
ctxApple.fillText('A', 90, 90);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), canvasApple.toBuffer('image/png'));
console.log('Generated: public/apple-touch-icon.png');
