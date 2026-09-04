import test from 'node:test';
import assert from 'node:assert/strict';
import { redactValue } from '../src/core/redact.mjs';

test('redacts secret keys and bearer/token-shaped strings recursively', () => {
  const value = redactValue({
    authorization: 'Bearer abcdefghijklmnopqrstuvwxyz',
    nested: { apiKey: 'sk-proj-abcdefghijklmnopqrstuvwxyz', note: 'token=supersecret123456789' },
    safe: 'hello'
  });
  assert.equal(value.authorization, '[REDACTED]');
  assert.equal(value.nested.apiKey, '[REDACTED]');
  assert.match(value.nested.note, /\[REDACTED\]/);
  assert.equal(value.safe, 'hello');
});
