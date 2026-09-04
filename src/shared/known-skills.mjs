export const KNOWN_SKILLS = Object.freeze([
  Object.freeze({
    id: 'openai-docs',
    displayName: 'OpenAI Docs',
    vendor: 'OpenAI',
    source: 'https://github.com/openai/skills/tree/main/skills/.curated/openai-docs',
    signatures: Object.freeze([
      /\bopenai-docs\b/i,
      /(?:\.system|\.curated)[\\/]openai-docs[\\/]SKILL\.md/i
    ])
  })
]);

function eventText(event) {
  return `${event?.kind ?? ''}\n${event?.text ?? ''}\n${JSON.stringify(event?.payload ?? {})}`;
}

export function matchKnownSkills(events = []) {
  const matches = [];
  for (const skill of KNOWN_SKILLS) {
    const eventIds = [];
    for (const event of events) {
      const haystack = eventText(event);
      if (!skill.signatures.some((pattern) => pattern.test(haystack))) continue;
      const id = String(event?.id ?? '');
      if (id && !eventIds.includes(id)) eventIds.push(id);
    }
    if (!eventIds.length) continue;
    matches.push({
      id: skill.id,
      displayName: skill.displayName,
      vendor: skill.vendor,
      source: skill.source,
      confidence: eventIds.length > 1 ? 0.99 : 0.97,
      eventIds
    });
  }
  return matches;
}
