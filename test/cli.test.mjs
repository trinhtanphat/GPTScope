import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const cli = new URL('../bin/gptscope.mjs', import.meta.url).pathname;
const run = (args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });

test('CLI supports init, session, import, infer and export smoke flow', async () => {
  const root = await mkdtemp(join(tmpdir(), 'gptscope-cli-'));
  const workspace = join(root, 'workspace');
  assert.equal(run(['init', workspace]).status, 0);
  const created = run(['session', 'new', '--workspace', workspace, '--name', 'smoke', '--surface', 'work']);
  assert.equal(created.status, 0, created.stderr);
  const sessionId = JSON.parse(created.stdout).id;
  const transcript = join(root, 'input.txt');
  await writeFile(transcript, 'Using SKILL.md instructions\nMCP tool call\n');
  assert.equal(run(['import', 'transcript', '--workspace', workspace, '--session', sessionId, transcript]).status, 0);
  const inferred = run(['infer', '--workspace', workspace, '--session', sessionId]);
  assert.equal(inferred.status, 0, inferred.stderr);
  assert.ok(JSON.parse(inferred.stdout).findings.length >= 3);
  const out = join(root, 'out');
  assert.equal(run(['export', '--workspace', workspace, '--session', sessionId, '--out', out]).status, 0);
  await access(join(out, 'report.md'));
  await access(join(out, 'report.json'));
});
