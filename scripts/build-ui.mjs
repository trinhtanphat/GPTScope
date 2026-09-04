import { access, copyFile, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist', 'ui');
const files = [
  ['ui/index.html', 'index.html'],
  ['ui/app.mjs', 'app.mjs'],
  ['ui/styles.css', 'styles.css'],
  ['src/shared/known-skills.mjs', 'shared/known-skills.mjs'],
  ['src/shared/adapters.mjs', 'shared/adapters.mjs'],
  ['src/shared/analyze.mjs', 'shared/analyze.mjs'],
  ['src/shared/timeline.mjs', 'shared/timeline.mjs']
];

for (const [source] of files) await access(join(root, source));
await rm(dist, { recursive: true, force: true });
for (const [source, target] of files) {
  const destination = join(dist, target);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(join(root, source), destination);
}
process.stdout.write(JSON.stringify({ ok: true, output: dist, files: files.length }) + '\n');
