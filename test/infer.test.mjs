import test from 'node:test';
import assert from 'node:assert/strict';
import { inferHarness } from '../src/core/infer.mjs';

test('infers evidence-backed ChatGPT orchestration markers deterministically', () => {
  const events = [
    { id: 'e1', ts: '2026-09-04T00:00:00.000Z', kind: 'message', surface: 'codex', text: 'Using openai-docs from .system/openai-docs/SKILL.md' },
    { id: 'e2', ts: '2026-09-04T00:00:01.000Z', kind: 'tool_call', surface: 'codex', text: 'MCP tools/list then function call' },
    { id: 'e3', ts: '2026-09-04T00:00:02.000Z', kind: 'message', surface: 'codex', text: 'Permission approval required before resume after context compaction' }
  ];
  const result = inferHarness({ id: 's1', surface: 'codex' }, events);
  const types = new Set(result.findings.map((f) => f.type));
  assert.equal(result.surface, 'codex');
  for (const type of ['skill', 'instruction', 'tool', 'mcp', 'context', 'permission']) assert.ok(types.has(type), type);
  const known = result.findings.find((finding) => finding.type === 'known-skill' && finding.skillId === 'openai-docs');
  assert.ok(known);
  assert.deepEqual(known.eventIds, ['e1']);
  assert.deepEqual(result, inferHarness({ id: 's1', surface: 'codex' }, events));
});
