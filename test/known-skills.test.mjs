import test from 'node:test';
import assert from 'node:assert/strict';
import { matchKnownSkills } from '../src/shared/known-skills.mjs';

test('recognizes official openai-docs skill from strong public signatures', () => {
  const events = [
    { id: 'e1', text: 'Use openai-docs for official docs lookup.' },
    { id: 'e2', text: 'file: /tmp/skills/.system/openai-docs/SKILL.md' },
    { id: 'e3', text: 'skills/.curated/openai-docs/SKILL.md' }
  ];
  const matches = matchKnownSkills(events);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].id, 'openai-docs');
  assert.equal(matches[0].displayName, 'OpenAI Docs');
  assert.equal(matches[0].vendor, 'OpenAI');
  assert.equal(matches[0].confidence, 0.99);
  assert.deepEqual(matches[0].eventIds, ['e1', 'e2', 'e3']);
  assert.match(matches[0].source, /github\.com\/openai\/skills/);
});

test('does not label generic OpenAI documentation text as openai-docs', () => {
  const matches = matchKnownSkills([{ id: 'e1', text: 'Read the OpenAI documentation for the API.' }]);
  assert.deepEqual(matches, []);
});
