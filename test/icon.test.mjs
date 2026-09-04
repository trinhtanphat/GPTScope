import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';

const iconUrl = new URL('../assets/gptscope-icon.png', import.meta.url);

function readChunks(buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(buffer.subarray(0, 8).equals(signature), 'icon must have a valid PNG signature');
  const chunks = [];
  for (let offset = 8; offset < buffer.length;) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += 12 + length;
    if (type === 'IEND') break;
  }
  return chunks;
}

test('Tauri source icon is a decodable 512x512 RGBA PNG', async () => {
  const buffer = await readFile(iconUrl);
  const chunks = readChunks(buffer);
  const ihdr = chunks.find((chunk) => chunk.type === 'IHDR')?.data;
  assert.ok(ihdr, 'missing IHDR');
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  assert.equal(width, 512);
  assert.equal(height, 512);
  assert.equal(ihdr[8], 8, 'expected 8-bit channels');
  assert.equal(ihdr[9], 6, 'expected RGBA color type');
  const compressed = Buffer.concat(chunks.filter((chunk) => chunk.type === 'IDAT').map((chunk) => chunk.data));
  const decoded = inflateSync(compressed);
  const rowBytes = width * 4;
  assert.equal(decoded.length, height * (rowBytes + 1));
  for (let row = 0; row < height; row++) {
    const filter = decoded[row * (rowBytes + 1)];
    assert.ok(filter >= 0 && filter <= 4, `row ${row} has invalid PNG filter ${filter}`);
  }
});
