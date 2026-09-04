# GPTScope

GPTScope is a standalone **clean-room inspector for authorized ChatGPT Desktop and Codex evidence**. It normalizes user-supplied transcripts or JSON/JSONL event streams, redacts common secrets, infers visible harness/orchestration patterns, recognizes evidence for known public skills, renders a deterministic timeline, compares sessions, and exports implementation-neutral reports.

GPTScope does **not** claim access to OpenAI's hidden prompts, private server state, proprietary source code, undisclosed token counts, or internal skills that are not evidenced in the supplied artifacts.

## v0.2.0 — Desktop + known skill recognition

GPTScope v0.2.0 adds a native Tauri desktop surface for Windows and macOS while keeping the portable Node.js CLI/workspace contract from v0.1.

Highlights:

- native Tauri desktop shell for Windows and macOS;
- drag/drop or file-picker import for `.txt`, `.jsonl`, and `.json` evidence;
- local-only in-memory analysis with a 16 MiB desktop input bound;
- deterministic chronological timeline with finding-to-event links;
- summary, finding cards, and redacted event inspector;
- Chat / Work / Codex surface hints;
- evidence-backed recognition of the official public **`openai-docs`** skill;
- Windows-safe CLI regression coverage;
- Node CI on Ubuntu, Windows, and macOS plus native Tauri build gates.

## `openai-docs` recognition

`openai-docs` is a public OpenAI skill in the `openai/skills` repository. GPTScope recognizes strong evidence such as the literal skill id or paths like:

```text
.system/openai-docs/SKILL.md
.curated/openai-docs/SKILL.md
```

Public source:

```text
https://github.com/openai/skills/tree/main/skills/.curated/openai-docs
```

Recognition is additive to the generic `skill` finding. A missing match is **not** treated as proof that no skill was used, and GPTScope never invents unnamed/private skills.

## Public vs non-public OpenAI surfaces

GPTScope deliberately separates evidence that OpenAI has published from behavior that remains implementation-private:

| Surface | Public status | GPTScope treatment |
| --- | --- | --- |
| `openai-docs` and other published `SKILL.md` packages | Public source/evidence | May be recognized by strong signatures |
| Codex CLI/core repository and public tests | Public source/evidence | May be used as reference evidence |
| Published Codex/ChatGPT developer documentation and MCP schemas | Public documentation | May be cited or matched when present in supplied evidence |
| ChatGPT Desktop orchestration/harness implementation | No complete public source is assumed | Never reconstructed as fact from absence or guesswork |
| Hidden prompts, private routing, server-side state, undisclosed skills | Non-public unless separately evidenced by an official publication | Never claimed or extracted |

A public component does not imply that the entire ChatGPT Desktop harness is public. GPTScope records observable behavior and labels inference instead of treating public Codex pieces as a dump of the proprietary desktop orchestrator.

## Clean-room boundary

Use GPTScope only on artifacts, applications, logs, and environments you own or are authorized to inspect.

GPTScope intentionally does **not**:

- bypass authentication or authorization;
- dump another process's memory;
- extract passwords, cookies, API keys, bearer tokens, or session credentials;
- intercept or defeat TLS/security controls;
- decompile protected proprietary binaries;
- silently monitor ChatGPT Desktop files or processes.

Desktop evidence is read only after the user explicitly chooses or drops a file. The renderer does not expose unrestricted Tauri filesystem or shell APIs.

## Requirements

Portable CLI/core:

- Node.js **22+**
- Windows, macOS, or Linux

Native desktop builds:

- Node.js 22
- Rust **1.98.1**
- Tauri CLI **2.11.4**
- Tauri crate **2.11.5**
- Windows x64 or macOS build host for native bundles

## Desktop development

Install the locked Node dependency and launch the Tauri app:

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run tauri:dev
```

Build native packages:

```bash
npm run tauri:win   # Windows x64: NSIS + MSI
npm run tauri:mac   # macOS universal: DMG + app
```

The v0.2 packages are intentionally **unsigned**. Windows SmartScreen or macOS Gatekeeper may therefore show an unknown-publisher warning. Verify the release provenance before opening an unsigned package; GPTScope does not require disabling platform security controls.

## CLI quick start

```bash
node bin/gptscope.mjs doctor
node bin/gptscope.mjs init ./lab
node bin/gptscope.mjs session new --workspace ./lab --name chatgpt-codex --surface codex
```

Import authorized evidence:

```bash
node bin/gptscope.mjs import transcript --workspace ./lab --session <SESSION_ID> ./capture/transcript.txt
node bin/gptscope.mjs import jsonl --workspace ./lab --session <SESSION_ID> ./capture/events.jsonl
```

Infer, compare, and export:

```bash
node bin/gptscope.mjs infer --workspace ./lab --session <SESSION_ID>
node bin/gptscope.mjs compare --workspace ./lab <SESSION_A> <SESSION_B>
node bin/gptscope.mjs export --workspace ./lab --session <SESSION_ID> --out ./lab-report
```

One-command scan:

```bash
node bin/gptscope.mjs scan ./capture/transcript.txt --format transcript --surface codex --workspace ./lab --out ./lab-report
```

## Detection model

From evidence you are authorized to inspect, GPTScope can flag visible markers for:

- generic skill / `SKILL.md` references;
- recognized public skill identities such as `openai-docs`;
- instruction or prompt-file references;
- tool/function-call orchestration;
- MCP / `tools/list` activity;
- context, history, memory, resume, and compaction markers;
- permission / approval gates;
- Chat, Work, or Codex surface hints.

Findings include supporting event IDs and confidence values. Inference stays bounded to observable evidence.

## Development verification

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run ui:build
npm run doctor
```

CI runs the Node suite on Ubuntu, Windows, and macOS, then packages the unsigned native Tauri app on Windows and macOS. `main` and the `v0.2.0` release are intended to move only from an exact verified head.

## Repository layout

```text
apps/tauri/src-tauri/   native Tauri shell and bundle config
bin/                    portable CLI
src/core/               workspace, CLI inference adapter, compare/export
src/importers/          file-backed transcript and JSONL importers
src/shared/             browser-safe adapters, analysis, known skills, timeline
ui/                     static desktop renderer source
scripts/                deterministic UI build
test/                   contract and regression tests
```

## License

Apache-2.0 for GPTScope-owned code. No OpenAI proprietary application source or private assets are included.
