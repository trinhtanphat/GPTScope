import { randomUUID } from 'node:crypto';
import { redactString, redactValue } from './redact.mjs';

const SURFACES = new Set(['chat', 'work', 'codex', 'unknown']);

export function classifySurface(value, text = '') {
  const explicit = String(value ?? '').toLowerCase();
  if (SURFACES.has(explicit)) return explicit;
  const haystack = String(text).toLowerCase();
  if (/\bcodex\b/.test(haystack)) return 'codex';
  if (/\bwork\b/.test(haystack)) return 'work';
  if (/\bchatgpt\b|\bchat\b/.test(haystack)) return 'chat';
  return 'unknown';
}

function extractText(input) {
  for (const key of ['text', 'message', 'content', 'body', 'detail']) {
    if (typeof input?.[key] === 'string') return input[key];
  }
  return '';
}

export function normalizeEvent(input, { source = 'unknown', surface = 'unknown', index = 0 } = {}) {
  const raw = input && typeof input === 'object' ? input : { text: String(input ?? '') };
  const text = redactString(extractText(raw));
  const kind = String(raw.kind ?? raw.type ?? raw.event ?? raw.action ?? 'message');
  const tsCandidate = raw.ts ?? raw.timestamp ?? raw.time ?? raw.created_at ?? raw.createdAt;
  const ts = tsCandidate ? new Date(tsCandidate).toISOString() : new Date(Date.now() + index).toISOString();
  const resolvedSurface = classifySurface(raw.surface ?? surface, text);
  return redactValue({
    id: String(raw.id ?? randomUUID()),
    ts,
    kind,
    source,
    surface: resolvedSurface,
    text,
    payload: raw
  });
}
