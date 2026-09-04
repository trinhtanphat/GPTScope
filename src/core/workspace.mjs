import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile, appendFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { redactValue } from './redact.mjs';

const WORKSPACE_FILE = 'workspace.json';

export async function createWorkspace(root) {
  await mkdir(join(root, 'sessions'), { recursive: true });
  const file = join(root, WORKSPACE_FILE);
  try {
    await stat(file);
  } catch {
    await writeFile(file, JSON.stringify({ format: 'gptscope-workspace-v1', createdAt: new Date().toISOString() }, null, 2) + '\n');
  }
  return root;
}

export async function assertWorkspace(root) {
  try {
    const meta = JSON.parse(await readFile(join(root, WORKSPACE_FILE), 'utf8'));
    if (meta.format !== 'gptscope-workspace-v1') throw new Error('unsupported workspace format');
    return meta;
  } catch (error) {
    throw new Error(`Not a GPTScope workspace: ${root} (${error.message})`);
  }
}

function sessionDir(root, id) {
  return join(root, 'sessions', id);
}

export async function createSession(root, { name = 'session', surface = 'unknown' } = {}) {
  await assertWorkspace(root);
  const id = `s-${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`;
  const session = redactValue({ id, name, surface, createdAt: new Date().toISOString() });
  const dir = sessionDir(root, id);
  await mkdir(dir, { recursive: false });
  await writeFile(join(dir, 'session.json'), JSON.stringify(session, null, 2) + '\n');
  await writeFile(join(dir, 'events.jsonl'), '');
  return session;
}

export async function readSession(root, id) {
  await assertWorkspace(root);
  try {
    return JSON.parse(await readFile(join(sessionDir(root, id), 'session.json'), 'utf8'));
  } catch (error) {
    throw new Error(`Session not found: ${id} (${error.message})`);
  }
}

export async function listSessions(root) {
  await assertWorkspace(root);
  const entries = await readdir(join(root, 'sessions'), { withFileTypes: true });
  const sessions = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try { sessions.push(await readSession(root, entry.name)); } catch {}
  }
  return sessions.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function appendEvents(root, sessionId, events) {
  await readSession(root, sessionId);
  if (!Array.isArray(events) || events.length === 0) return 0;
  const redacted = events.map(redactValue);
  const text = redacted.map((event) => JSON.stringify(event)).join('\n') + '\n';
  await appendFile(join(sessionDir(root, sessionId), 'events.jsonl'), text);
  return redacted.length;
}

export async function readEvents(root, sessionId) {
  await readSession(root, sessionId);
  const text = await readFile(join(sessionDir(root, sessionId), 'events.jsonl'), 'utf8');
  if (!text.trim()) return [];
  return text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}
