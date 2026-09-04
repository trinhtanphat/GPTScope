import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createWorkspace, createSession, readEvents } from '../src/core/workspace.mjs';
import { importJsonl } from '../src/importers/jsonl.mjs';
import { importTranscript } from '../src/importers/transcript.mjs';

test('imports JSONL and transcript into a redacted normalized session', async () => {
  const root = await mkdtemp(join(tmpdir(), 'gptscope-'));
  await createWorkspace(root);
  const session = await createSession(root, { name: 'demo', surface: 'codex' });
  const jsonl = join(root, 'input.jsonl');
  await writeFile(jsonl, JSON.stringify({ type: 'tool_call', text: 'Authorization: Bearer abcdefghijklmnopqrstuvwxyz' }) + '\n');
  await importJsonl(root, session.id, jsonl);
  const transcript = join(root, 'chat.txt');
  await writeFile(transcript, 'Load skill planning\nRun MCP tool\n');
  await importTranscript(root, session.id, transcript);
  const events = await readEvents(root, session.id);
  assert.equal(events.length, 3);
  assert.equal(events[0].kind, 'tool_call');
  assert.doesNotMatch(JSON.stringify(events), /abcdefghijklmnopqrstuvwxyz/);
});

test('malformed JSONL fails with a line-numbered error', async () => {
  const root = await mkdtemp(join(tmpdir(), 'gptscope-'));
  await createWorkspace(root);
  const session = await createSession(root, { name: 'bad' });
  const file = join(root, 'bad.jsonl');
  await writeFile(file, '{not-json}\n');
  await assert.rejects(() => importJsonl(root, session.id, file), /line 1/i);
});
