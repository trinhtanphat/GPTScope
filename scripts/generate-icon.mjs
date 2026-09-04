import { deflateSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WIDTH = 512;
const HEIGHT = 512;
const root = fileURLToPath(new URL('../', import.meta.url));
const defaultOutput = resolve(root, 'assets', 'gptscope-icon.png');

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type, 'ascii');
  const out = Buffer.allocUnsafe(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  name.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return out;
}

function pixel(x, y) {
  const dx = x - 255.5;
  const dy = y - 255.5;
  const radius = Math.hypot(dx, dy);
  const ring = radius > 118 && radius < 151;
  const cross = (Math.abs(dx) < 14 && Math.abs(dy) < 91) || (Math.abs(dy) < 14 && Math.abs(dx) < 91);
  const dot = radius < 34;
  if (ring || cross || dot) return [233, 238, 247, 255];
  const glow = Math.max(0, 1 - radius / 360);
  return [Math.round(9 + 18 * glow), Math.round(13 + 28 * glow), Math.round(22 + 55 * glow), 255];
}

export function buildIconPng() {
  const stride = WIDTH * 4 + 1;
  const raw = Buffer.alloc(stride * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    const row = y * stride;
    raw[row] = 0;
    for (let x = 0; x < WIDTH; x++) {
      const offset = row + 1 + x * 4;
      const rgba = pixel(x, y);
      raw[offset] = rgba[0];
      raw[offset + 1] = rgba[1];
      raw[offset + 2] = rgba[2];
      raw[offset + 3] = rgba[3];
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

export async function generateIcon(output = defaultOutput) {
  await mkdir(dirname(output), { recursive: true });
  const png = buildIconPng();
  await writeFile(output, png);
  return { output, bytes: png.length, width: WIDTH, height: HEIGHT };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await generateIcon(process.argv[2] ? resolve(process.argv[2]) : defaultOutput);
  process.stdout.write(JSON.stringify(result) + '\n');
}
