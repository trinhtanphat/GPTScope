const SECRET_KEYS = new Set([
  'authorization', 'proxyauthorization', 'cookie', 'setcookie', 'password',
  'passwd', 'secret', 'clientsecret', 'token', 'accesstoken', 'refreshtoken',
  'apikey', 'xapikey'
]);

function normalizedKey(key) {
  return String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function redactString(input) {
  return String(input)
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
