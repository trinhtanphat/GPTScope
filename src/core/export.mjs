import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

function markdown(report) {
  const lines = [
    '# GPTScope Harness Report', '',
    `- Session: \`${report.sessionId}\``,
    `- Surface: \`${report.surface}\``,
    `- Events: ${report.summary?.eventCount ?? 'unknown'}`,
    `- Findings: ${(report.findings ?? []).length}`,
    '', '## Findings', ''
  ];
  if (!(report.findings ?? []).length) lines.push('No evidence-backed orchestration markers were detected.');
  for (const finding of report.findings ?? []) {
    lines.push(`### ${finding.label}`, '', `- Type: \`${finding.type}\``, `- Confidence: ${finding.confidence}`, `- Evidence events: ${finding.eventIds.map((id) => `\`${id}\``).join(', ')}`, '');
  }
  lines.push('## Boundary', '', 'This report contains evidence-backed inference from authorized artifacts. It does not claim access to hidden prompts, proprietary source code, credentials, process memory, or undisclosed internal state.', '');
  return lines.join('\n');
}

export async function exportReport(report, outDir) {
  await mkdir(outDir, { recursive: true });
  const json = join(outDir, 'report.json');
  const md = join(outDir, 'report.md');
  await writeFile(json, JSON.stringify(report, null, 2) + '\n');
  await writeFile(md, markdown(report));
  return { json, markdown: md };
}
