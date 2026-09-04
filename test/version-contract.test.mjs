import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('v0.2 version and Tauri pins stay consistent', async () => {
  const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  const tauri = JSON.parse(await readFile(new URL('apps/tauri/src-tauri/tauri.conf.json', root), 'utf8'));
  const cargo = await readFile(new URL('apps/tauri/src-tauri/Cargo.toml', root), 'utf8');
  assert.equal(pkg.version, '0.2.0');
  assert.equal(pkg.devDependencies['@tauri-apps/cli'], '2.11.4');
  assert.equal(tauri.version, '0.2.0');
  assert.equal(tauri.build.frontendDist, '../../../dist/ui');
  assert.match(cargo, /version = "0\.2\.0"/);
  assert.match(cargo, /tauri = "=2\.11\.5"/);
  assert.match(cargo, /tauri-build = "=2\.6\.3"/);
});
