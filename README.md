# GPTScope

GPTScope is a standalone **clean-room inspector for authorized ChatGPT Desktop evidence**. It helps you normalize transcripts or JSONL event streams, redact secrets before persistence, infer visible harness/orchestration patterns, compare sessions, and export an implementation-neutral report.

GPTScope is inspired by the same evidence-first philosophy as HarnessScope, but targets ChatGPT surfaces such as **Chat**, **Work**, and **Codex**.

## What GPTScope can detect

From evidence you are authorized to inspect, GPTScope can flag visible markers for:

- skill references / `SKILL.md` loading;
- instruction or prompt-file references;
- tool and function-call orchestration;
- MCP / `tools/list` activity;
- context, history, memory, resume, and compaction markers;
- permission / approval gates;
- Chat, Work, or Codex surface hints.

Findings include supporting event IDs and confidence. GPTScope does **not** invent hidden prompt text, token counts, proprietary implementation details, or source code that is not present in the evidence.

## Clean-room boundary

Use GPTScope only on artifacts, applications, logs, and environments you own or are authorized to inspect.

GPTScope does **not** bypass authentication, scrape process memory, extract passwords/API keys/cookies/bearer tokens, defeat TLS/security controls, decompile protected proprietary binaries, or disable vendor protections.

## Requirements

- Node.js **22+**
- Windows, macOS, or Linux
- No third-party runtime dependencies

## Quick start

```bash
node bin/gptscope.mjs doctor
node bin/gptscope.mjs init ./lab
node bin/gptscope.mjs session new --workspace ./lab --name chatgpt-codex --surface codex
```

The session command prints an ID. Import authorized evidence:

```bash
node bin/gptscope.mjs import transcript --workspace ./lab --session <SESSION_ID> ./capture/transcript.txt
node bin/gptscope.mjs import jsonl --workspace ./lab --session <SESSION_ID> ./capture/events.jsonl
```

Infer and export:

```bash
node bin/gptscope.mjs infer --workspace ./lab --session <SESSION_ID>
node bin/gptscope.mjs export --workspace ./lab --session <SESSION_ID> --out ./lab-report
```

One-command scan:

```bash
node bin/gptscope.mjs scan ./capture/transcript.txt --format transcript --surface codex --workspace ./lab --out ./lab-report
```

Compare two sessions:

```bash
node bin/gptscope.mjs compare --workspace ./lab <SESSION_A> <SESSION_B>
```

## Workspace format

```text
lab/
├─ workspace.json
└─ sessions/
   └─ s-.../
      ├─ session.json
      └─ events.jsonl
```

All imported strings and nested payloads are redacted before events are appended to `events.jsonl`.

## Development

```bash
npm test
node bin/gptscope.mjs doctor
```

CI runs the test suite on Ubuntu, Windows, and macOS with Node 22.

## Roadmap

V0.1 deliberately focuses on the portable evidence core and CLI. Native desktop capture UI, richer ChatGPT export adapters, and signed Windows/macOS packaging belong in later versions and must preserve the same clean-room boundary.

## License

Apache-2.0 for GPTScope-owned code.
