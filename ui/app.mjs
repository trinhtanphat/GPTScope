import { parseEvidenceText } from './shared/adapters.mjs';
import { analyzeEvidence } from './shared/analyze.mjs';
import { buildTimeline } from './shared/timeline.mjs';

export const MAX_FILE_BYTES = 16 * 1024 * 1024;
const SUPPORTED = new Map([
  ['.txt', 'transcript'],
  ['.jsonl', 'jsonl'],
  ['.json', 'json']
]);

const $ = (id) => document.getElementById(id);
const refs = {
  input: $('file-input'),
  drop: $('drop-zone'),
  surface: $('surface'),
  status: $('status'),
  timeline: $('timeline'),
  findings: $('findings'),
  inspector: $('inspector'),
  metricSurface: $('metric-surface'),
  metricEvents: $('metric-events'),
  metricFindings: $('metric-findings'),
  metricSkills: $('metric-skills')
};

function extension(name) {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

function setStatus(message, tone = 'neutral') {
  refs.status.textContent = message;
  refs.status.dataset.tone = tone;
}

function clear(node) {
  while (node.firstChild) node.firstChild.remove();
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function renderReport(events, report) {
  const timeline = buildTimeline(events, report);
  const knownSkills = report.findings.filter((finding) => finding.type === 'known-skill');
  refs.metricSurface.textContent = report.surface;
  refs.metricEvents.textContent = String(report.summary.eventCount);
  refs.metricFindings.textContent = String(report.summary.findingCount);
  refs.metricSkills.textContent = String(knownSkills.length);

  clear(refs.timeline);
  if (!timeline.length) refs.timeline.append(element('li', 'empty', 'The evidence file contains no events.'));
  for (const row of timeline) {
    const item = element('li', 'timeline-row');
    const button = element('button', 'timeline-button');
    button.type = 'button';
    const meta = element('span', 'timeline-meta', `${row.kind} · ${row.surface} · ${row.ts}`);
    const body = element('span', 'timeline-text', row.text || '(no text payload)');
    button.append(meta, body);
    if (row.skillIds.length) button.append(element('span', 'badge skill-badge', row.skillIds.join(', ')));
    if (row.findingTypes.length) button.append(element('span', 'badge', `${row.findingTypes.length} finding type${row.findingTypes.length === 1 ? '' : 's'}`));
    button.addEventListener('click', () => {
      refs.inspector.textContent = JSON.stringify({ ...row, findings: report.findings.filter((finding) => finding.eventIds.includes(row.eventId)) }, null, 2);
    });
    item.append(button);
    refs.timeline.append(item);
  }

  clear(refs.findings);
  if (!report.findings.length) refs.findings.append(element('p', 'empty', 'No evidence-backed orchestration markers were detected.'));
  for (const finding of report.findings) {
    const card = element('article', 'finding');
    const heading = element('div', 'finding-title');
    heading.append(element('strong', '', finding.displayName ?? finding.label));
    if (finding.skillId) heading.append(element('span', 'badge skill-badge', finding.skillId));
    card.append(heading);
    card.append(element('p', '', `${finding.label} · confidence ${finding.confidence}`));
    card.append(element('code', '', `evidence: ${finding.eventIds.join(', ')}`));
    refs.findings.append(card);
  }
}

async function analyzeFile(file) {
  const format = SUPPORTED.get(extension(file.name));
  if (!format) throw new Error('Unsupported evidence file. Use .txt, .jsonl, or .json.');
  if (file.size > MAX_FILE_BYTES) throw new Error('Evidence file exceeds the 16 MiB desktop limit.');
  const text = await file.text();
  const surface = refs.surface.value;
  const events = parseEvidenceText(text, { format, surface, source: `desktop:${file.name}` });
  const report = analyzeEvidence(events, { surface, sessionId: `desktop:${file.name}` });
  renderReport(events, report);
  refs.inspector.textContent = JSON.stringify({ file: file.name, size: file.size, surface: report.surface, summary: report.summary }, null, 2);
  setStatus(`Loaded ${file.name}: ${report.summary.eventCount} events, ${report.summary.findingCount} findings.`, 'ok');
}

async function handleFiles(files) {
  const file = files?.[0];
  if (!file) return;
  setStatus(`Analyzing ${file.name}…`);
  try {
    await analyzeFile(file);
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

refs.input.addEventListener('change', () => handleFiles(refs.input.files));
refs.drop.addEventListener('dragover', (event) => { event.preventDefault(); refs.drop.dataset.drag = 'true'; });
refs.drop.addEventListener('dragleave', () => { delete refs.drop.dataset.drag; });
refs.drop.addEventListener('drop', (event) => {
  event.preventDefault();
  delete refs.drop.dataset.drag;
  handleFiles(event.dataTransfer.files);
});
refs.drop.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    refs.input.click();
  }
});
