import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compareReports } from '../src/core/compare.mjs';
import { exportReport } from '../src/core/export.mjs';

test('compares finding sets and exports JSON plus Markdown', async () => {
  const a = { sessionId: 'a', surface: 'chat', summary: {}, findings: [{ type: 'tool', label: 'Tool orchestration observed', confidence: 0.9, eventIds: ['e1'] }] };
  const b = { sessionId: 'b', surface: 'codex', summary: {}, findings: [{ type: 'tool', label: 'Tool orchestration observed', confidence: 0.9, eventIds: ['e2'] }, { type: 'mcp', label: 'MCP activity observed', confidence: 0.9, eventIds: ['e3'] }] };
  const diff = compareReports(a, b);
  assert.deepEqual(diff.addedTypes, ['mcp']);
  assert.deepEqual(diff.removedTypes, []);
  const out = await mkdtemp(join(tmpdir(), 'gptscope-export-'));
  const files = await exportReport(b, out);
  assert.match(await readFile(files.markdown, 'utf8'), /MCP activity observed/);
  assert.equal(JSON.parse(await readFile(files.json, 'utf8')).sessionId, 'b');
});
