import { readFile } from 'node:fs/promises';
import { normalizeEvent } from '../core/events.mjs';
import { appendEvents, readSession } from '../core/workspace.mjs';

export async function importJsonl(root, sessionId, file) {
  const session = await readSession(root, sessionId);
  const text = await readFile(file, 'utf8');
  const parsed = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    try {
      parsed.push(JSON.parse(line));
    } catch (error) {
      throw new Error(`Malformed JSONL at line ${i + 1}: ${error.message}`);
    }
  }
  const events = parsed.map((item, index) => normalizeEvent(item, { source: 'jsonl', surface: session.surface, index }));
  await appendEvents(root, sessionId, events);
  return { imported: events.length };
}
