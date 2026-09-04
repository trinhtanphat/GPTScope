import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEvidenceText } from '../src/shared/adapters.mjs';
import { analyzeEvidence } from '../src/shared/analyze.mjs';
import { buildTimeline } from '../src/shared/timeline.mjs';

test('transcript adapter produces deterministic redacted events and detects codex skill evidence', () => {
  const events = parseEvidenceText('Using openai-docs from SKILL.md\nMCP tool call with token=abcdefghijk\n', {
    format: 'transcript', surface: 'codex', source: 'desktop-drop'
  });
  assert.deepEqual(events.map((event) => event.id), ['e-000001', 'e-000002']);
  assert.ok(events.every((event) => event.surface === 'codex'));
  assert.equal(events[1].text.includes('abcdefghijk'), false);
  const report = analyzeEvidence(events, { surface: 'codex', sessionId: 'desktop' });
  assert.equal(report.surface, 'codex');
  assert.ok(report.findings.some((finding) => finding.type === 'known-skill' && finding.skillId === 'openai-docs'));
});

test('jsonl adapter fails closed with a line-numbered parse error', () => {
  assert.throws(
    () => parseEvidenceText('{"text":"ok"}\n{bad json}\n', { format: 'jsonl' }),
    /Invalid JSONL at line 2:/
  );
});

test('timeline sorts chronologically and links findings to evidence events', () => {
  const events = [
    { id: 'e2', ts: '2026-09-04T00:00:02.000Z', kind: 'message', surface: 'codex', text: 'MCP tool call' },
    { id: 'e1', ts: '2026-09-04T00:00:01.000Z', kind: 'message', surface: 'codex', text: 'Using openai-docs' }
  ];
  const report = analyzeEvidence(events, { surface: 'codex', sessionId: 's1' });
  const rows = buildTimeline(events, report);
  assert.deepEqual(rows.map((row) => row.eventId), ['e1', 'e2']);
  assert.ok(rows[0].findingTypes.includes('known-skill'));
});

test('empty evidence produces an explicit empty report and timeline', () => {
  const report = analyzeEvidence([], { surface: 'unknown', sessionId: 'empty' });
  assert.equal(report.summary.eventCount, 0);
  assert.deepEqual(report.findings, []);
  assert.deepEqual(buildTimeline([], report), []);
});
