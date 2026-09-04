import { analyzeEvidence } from '../shared/analyze.mjs';

export function inferHarness(session, events) {
  return analyzeEvidence(events, { sessionId: session.id, surface: session?.surface ?? 'unknown' });
}
