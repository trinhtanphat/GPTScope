const DEFINITIONS = [
  ['skill', 'Skill loading/reference observed', /\bskills?\b|SKILL\.md/i],
  ['instruction', 'Instruction loading/reference observed', /\binstructions?\b|\bsystem prompt\b|\bdeveloper prompt\b|AGENTS\.md|CLAUDE\.md|SKILL\.md/i],
  ['tool', 'Tool orchestration observed', /\btools?\/list\b|\btool(?:_| |-)?call\b|\bfunction(?:_| |-)?call\b|\btool\b/i],
  ['mcp', 'MCP activity observed', /\bMCP\b|\btools\/list\b/i],
  ['context', 'Context/resume/compaction marker observed', /\bcontext\b|\bcompaction\b|\bcompact(?:ed|ion)?\b|\bresume\b|\bmemory\b|\bhistory\b/i],
  ['permission', 'Permission/approval gate observed', /\bpermission\b|\bapproval\b|\bauthoriz(?:e|ed|ation)\b|\bconsent\b|\bforbidden\b|\bdenied\b/i]
];

function pickSurface(session, events) {
  if (['chat', 'work', 'codex'].includes(session?.surface)) return session.surface;
  const counts = { chat: 0, work: 0, codex: 0 };
  for (const event of events) if (event.surface in counts) counts[event.surface]++;
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return ranked[0]?.[1] > 0 ? ranked[0][0] : 'unknown';
}

export function inferHarness(session, events) {
  const findings = [];
  for (const [type, label, pattern] of DEFINITIONS) {
    const eventIds = [];
    for (const event of events) {
      const haystack = `${event.kind ?? ''}\n${event.text ?? ''}\n${JSON.stringify(event.payload ?? {})}`;
      if (pattern.test(haystack)) eventIds.push(event.id);
    }
    if (eventIds.length) {
      findings.push({ type, label, confidence: eventIds.length > 1 ? 0.95 : 0.9, eventIds });
    }
  }
  return {
    sessionId: session.id,
    surface: pickSurface(session, events),
    summary: {
      eventCount: events.length,
      findingCount: findings.length,
      findingTypes: findings.map((finding) => finding.type),
      toolEventCount: events.filter((event) => /tool|function/i.test(event.kind ?? '')).length
    },
    findings
  };
}
