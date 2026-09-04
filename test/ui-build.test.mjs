import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootUrl = new URL('../', import.meta.url);
const root = fileURLToPath(rootUrl);
const buildScript = fileURLToPath(new URL('../scripts/build-ui.mjs', import.meta.url));
const distUrl = new URL('../dist/ui/', import.meta.url);

test('UI build emits only local static assets and shared analysis modules', async () => {
  await rm(distUrl, { recursive: true, force: true });
  const result = spawnSync(process.execPath, [buildScript], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  for (const relative of [
    'index.html', 'app.mjs', 'styles.css',
    'shared/known-skills.mjs', 'shared/adapters.mjs',
    'shared/analyze.mjs', 'shared/timeline.mjs'
  ]) await access(new URL(relative, distUrl));
  const html = await readFile(new URL('index.html', distUrl), 'utf8');
  const app = await readFile(new URL('app.mjs', distUrl), 'utf8');
  assert.doesNotMatch(html, /<script[^>]+src=["']https?:\/\//i);
  assert.doesNotMatch(html, /<link[^>]+href=["']https?:\/\//i);
  assert.doesNotMatch(app, /__TAURI__|__TAURI_INTERNALS__/);
  assert.match(app, /MAX_FILE_BYTES|16 \* 1024 \* 1024/);
});
