import { readFile } from 'node:fs/promises';
import { normalizeEvent } from '../core/events.mjs';
import { appendEvents, readSession } from '../core/workspace.mjs';

export async function importTranscript(root, sessionId, file) {
  const session = await readSession(root, sessionId);
  const text = await readFile(file, 'utf8');
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const events = lines.map((line, index) => normalizeEvent({ kind: 'message', text: line }, { source: 'transcript', surface: session.surface, index }));
  await appendEvents(root, sessionId, events);
  return { imported: events.length };
}
