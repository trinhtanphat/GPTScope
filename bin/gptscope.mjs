#!/usr/bin/env node
import { resolve } from 'node:path';
import { access } from 'node:fs/promises';
import { createWorkspace, createSession, listSessions, readSession, readEvents } from '../src/core/workspace.mjs';
import { importJsonl } from '../src/importers/jsonl.mjs';
import { importTranscript } from '../src/importers/transcript.mjs';
import { inferHarness } from '../src/core/infer.mjs';
import { compareReports } from '../src/core/compare.mjs';
import { exportReport } from '../src/core/export.mjs';

function value(args, name, fallback = undefined) {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback;
}

function positional(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) { i++; continue; }
    out.push(args[i]);
  }
  return out;
}

function workspaceArg(args) {
  return resolve(value(args, '--workspace', process.env.GPTSCOPE_WORKSPACE ?? './gptscope-workspace'));
}

function print(value) {
  process.stdout.write(JSON.stringify(value, null, 2) + '\n');
}

function help() {
  process.stdout.write(`GPTScope v0.1.0\n\n` +
`Clean-room inspector for authorized ChatGPT Desktop evidence.\n\n` +
`Commands:\n` +
`  init [workspace]\n` +
`  session new --workspace DIR --name NAME [--surface chat|work|codex|unknown]\n` +
`  session list --workspace DIR\n` +
`  import jsonl|transcript --workspace DIR --session ID FILE\n` +
`  infer --workspace DIR --session ID\n` +
`  compare --workspace DIR SESSION_A SESSION_B\n` +
`  export --workspace DIR --session ID --out DIR\n` +
`  scan FILE --format jsonl|transcript [--workspace DIR] [--surface SURFACE] [--out DIR]\n` +
`  doctor\n`);
}

async function reportFor(root, id) {
  return inferHarness(await readSession(root, id), await readEvents(root, id));
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  if (!command || command === '--help' || command === '-h' || command === 'help') return help();

  if (command === 'doctor') {
    return print({ ok: true, node: process.version, platform: process.platform, arch: process.arch, cleanRoom: true, surfaces: ['chat', 'work', 'codex', 'unknown'] });
  }

  if (command === 'init') {
    const root = resolve(args[1] ?? './gptscope-workspace');
    await createWorkspace(root);
    return print({ workspace: root, format: 'gptscope-workspace-v1' });
  }

  if (command === 'session') {
    const action = args[1];
    const root = workspaceArg(args.slice(2));
    if (action === 'new') return print(await createSession(root, { name: value(args, '--name', 'session'), surface: value(args, '--surface', 'unknown') }));
    if (action === 'list') return print(await listSessions(root));
    throw new Error(`Unknown session action: ${action}`);
  }

  if (command === 'import') {
    const format = args[1];
    const rest = args.slice(2);
    const root = workspaceArg(rest);
    const sessionId = value(rest, '--session');
    const file = positional(rest).at(-1);
    if (!sessionId || !file) throw new Error('import requires --session ID and FILE');
    await access(resolve(file));
    if (format === 'jsonl') return print(await importJsonl(root, sessionId, resolve(file)));
    if (format === 'transcript') return print(await importTranscript(root, sessionId, resolve(file)));
    throw new Error(`Unknown import format: ${format}`);
  }

  if (command === 'infer') {
    const rest = args.slice(1);
    return print(await reportFor(workspaceArg(rest), value(rest, '--session')));
  }

  if (command === 'compare') {
    const rest = args.slice(1);
    const ids = positional(rest);
    if (ids.length < 2) throw new Error('compare requires SESSION_A SESSION_B');
    const root = workspaceArg(rest);
    return print(compareReports(await reportFor(root, ids[0]), await reportFor(root, ids[1])));
  }

  if (command === 'export') {
    const rest = args.slice(1);
    const root = workspaceArg(rest);
    const sessionId = value(rest, '--session');
    const out = resolve(value(rest, '--out', './gptscope-export'));
    return print(await exportReport(await reportFor(root, sessionId), out));
  }

  if (command === 'scan') {
    const rest = args.slice(1);
    const file = positional(rest)[0];
    if (!file) throw new Error('scan requires FILE');
    const format = value(rest, '--format', 'transcript');
    const root = workspaceArg(rest);
    await createWorkspace(root);
    const session = await createSession(root, { name: value(rest, '--name', 'scan'), surface: value(rest, '--surface', 'unknown') });
    if (format === 'jsonl') await importJsonl(root, session.id, resolve(file));
    else if (format === 'transcript') await importTranscript(root, session.id, resolve(file));
    else throw new Error(`Unknown scan format: ${format}`);
    const report = await reportFor(root, session.id);
    const out = value(rest, '--out');
    if (out) await exportReport(report, resolve(out));
    return print(report);
  }

  const error = new Error(`Unknown command: ${command}`);
  error.exitCode = 2;
  throw error;
}

main().catch((error) => {
  process.stderr.write(`GPTScope error: ${error.message}\n`);
  process.exitCode = error.exitCode ?? 1;
});
