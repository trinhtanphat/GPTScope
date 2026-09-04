export function compareReports(base, target) {
  const baseTypes = new Set((base.findings ?? []).map((finding) => finding.type));
  const targetTypes = new Set((target.findings ?? []).map((finding) => finding.type));
  return {
    baseSessionId: base.sessionId,
    targetSessionId: target.sessionId,
    baseSurface: base.surface,
    targetSurface: target.surface,
    addedTypes: [...targetTypes].filter((type) => !baseTypes.has(type)).sort(),
    removedTypes: [...baseTypes].filter((type) => !targetTypes.has(type)).sort(),
    sharedTypes: [...targetTypes].filter((type) => baseTypes.has(type)).sort()
  };
}
