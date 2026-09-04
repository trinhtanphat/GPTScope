export function buildTimeline(events = [], report = { findings: [] }) {
  const byEvent = new Map();
  for (const finding of report?.findings ?? []) {
    for (const eventId of finding.eventIds ?? []) {
      if (!byEvent.has(eventId)) byEvent.set(eventId, []);
      byEvent.get(eventId).push(finding);
    }
  }
  return events
    .map((event, index) => ({ event, index }))
    .sort((a, b) => {
      const at = Date.parse(a.event?.ts ?? '');
      const bt = Date.parse(b.event?.ts ?? '');
      const av = Number.isNaN(at) ? Number.MAX_SAFE_INTEGER : at;
      const bv = Number.isNaN(bt) ? Number.MAX_SAFE_INTEGER : bt;
      return av - bv || a.index - b.index;
    })
    .map(({ event }) => {
      const findings = byEvent.get(event.id) ?? [];
      return {
        eventId: event.id,
        ts: event.ts,
        kind: event.kind,
        source: event.source,
        surface: event.surface,
        text: event.text,
        payload: event.payload,
        findingTypes: [...new Set(findings.map((finding) => finding.type))],
        findingLabels: [...new Set(findings.map((finding) => finding.label))],
        skillIds: [...new Set(findings.map((finding) => finding.skillId).filter(Boolean))]
      };
    });
}
