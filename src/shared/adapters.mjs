const SURFACES = new Set(['chat', 'work', 'codex', 'unknown']);
const SECRET_KEYS = new Set([
  'authorization', 'proxyauthorization', 'cookie', 'setcookie', 'password',
  'passwd', 'secret', 'clientsecret', 'token', 'accesstoken', 'refreshtoken',
  'apikey', 'xapikey'
]);

function normalizedKey(key) {
  return String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function redactString(input) {
  return String(input ?? '')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{12,}\b/gi, 'Bearer [REDACTED]')
    .replace(/\bsk-(?:proj-)?[A-Za-z0-9_-]{12,}\b/g, '[REDACTED]')
    .replace(/\b(token|api[_-]?key|secret|password)\s*[:=]\s*[^\s,;]{8,}/gi, '$1=[REDACTED]');
}

export function redactValue(value) {
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = SECRET_KEYS.has(normalizedKey(key)) ? '[REDACTED]' : redactValue(child);
    }
    return out;
  }
  return value;
}

export function classifySurface(value, text = '') {
  const explicit = String(value ?? '').toLowerCase();
  if (SURFACES.has(explicit) && explicit !== 'unknown') return explicit;
  const haystack = String(text).toLowerCase();
  if (/\bcodex\b/.test(haystack)) return 'codex';
  if (/\bwork\b/.test(haystack)) return 'work';
  if (/\bchatgpt\b|\bchat\b/.test(haystack)) return 'chat';
  return SURFACES.has(explicit) ? explicit : 'unknown';
}

function extractText(input) {
  if (typeof input === 'string') return input;
  for (const key of ['text', 'message', 'content', 'body', 'detail']) {
    if (typeof input?.[key] === 'string') return input[key];
  }
  return '';
}

function timestamp(value, index) {
  if (value != null && value !== '') {
    const time = Date.parse(value);
    if (!Number.isNaN(time)) return new Date(time).toISOString();
  }
  return new Date(index).toISOString();
}

function normalizeRecord(input, { source, surface, index }) {
  const raw = input && typeof input === 'object' ? input : { text: String(input ?? '') };
  const text = redactString(extractText(raw));
  const kind = String(raw.kind ?? raw.type ?? raw.event ?? raw.action ?? 'message');
  const ts = timestamp(raw.ts ?? raw.timestamp ?? raw.time ?? raw.created_at ?? raw.createdAt, index);
  return {
    id: String(raw.id ?? `e-${String(index + 1).padStart(6, '0')}`),
    ts,
    kind,
    source,
    surface: classifySurface(raw.surface ?? surface, text),
    text,
    payload: redactValue(raw)
  };
}

function parseJsonl(text) {
  const records = [];
  const lines = String(text).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    try {
      records.push(JSON.parse(lines[i]));
    } catch (error) {
      throw new Error(`Invalid JSONL at line ${i + 1}: ${error.message}`);
    }
  }
  return records;
}

function parseJson(text) {
  let value;
  try {
    value = JSON.parse(String(text));
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.events)) return value.events;
  return value == null ? [] : [value];
}

export function parseEvidenceText(text, { format = 'transcript', surface = 'unknown', source = 'desktop' } = {}) {
  const normalizedFormat = String(format).toLowerCase();
  let records;
  if (normalizedFormat === 'transcript' || normalizedFormat === 'txt') {
    records = String(text).split(/\r?\n/).filter((line) => line.trim()).map((line) => ({ kind: 'message', text: line }));
  } else if (normalizedFormat === 'jsonl') {
    records = parseJsonl(text);
  } else if (normalizedFormat === 'json') {
    records = parseJson(text);
  } else {
    throw new Error(`Unsupported evidence format: ${format}`);
  }
  return records.map((record, index) => normalizeRecord(record, { source, surface, index }));
}
