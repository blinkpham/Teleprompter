import { ChevronDown, ChevronRight, Copy, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Caution, CheatsheetEntry, Family, FamilyId, ResolutionExample, ResolvedPreset, ShorthandEntry } from '../../../shared/catalog-types';
import { CopyButton, type CopyOutcome } from './CopyButton';

interface CheatsheetViewProps {
  readonly groups: readonly { readonly familyId: FamilyId; readonly entryIds: readonly string[]; readonly scores: Readonly<Record<string, number>> }[];
  readonly families: readonly Family[];
  readonly entriesById: Readonly<Record<string, CheatsheetEntry>>;
  readonly cautions: readonly Caution[];
  readonly resolutionExamples: readonly ResolutionExample[];
  readonly activeFamily: FamilyId | 'all';
  readonly shownCount: number;
  readonly copy: (payload: string) => Promise<CopyOutcome>;
  readonly resolvePreset: (id: string) => ResolvedPreset | undefined;
  readonly onFamilyChange: (family: FamilyId | 'all') => void;
}

export function CheatsheetView({ groups, families, entriesById, cautions, resolutionExamples, activeFamily, shownCount, copy, resolvePreset, onFamilyChange }: CheatsheetViewProps) {
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(new Set());
  const groupedIds = useMemo(() => new Set(groups.flatMap((group) => group.entryIds)), [groups]);
  return <section className="cheatsheet-view" aria-label="Prompt shorthand cheatsheet">
    <div className="cheatsheet-toolbar"><label className="select-wrap"><span className="sr-only">Family</span><select value={activeFamily} onChange={(event) => onFamilyChange(event.target.value as FamilyId | 'all')}><option value="all">All families</option>{families.map((family) => <option key={family.id} value={family.id}>{family.label}</option>)}</select></label><span className="shown-count">{shownCount} shown</span></div>
    {groups.length > 0 ? groups.map((group) => { const family = families.find((item) => item.id === group.familyId); return <section className="family-group" key={group.familyId}><header className="family-heading"><div><h2>{family?.label}</h2><p>{family?.introCautionIds.map((id) => cautions.find((caution) => caution.id === id)?.text).filter(Boolean).join(' ')}</p></div><span>{group.entryIds.length}</span></header><div className="entry-list">{group.entryIds.map((id) => { const entry = entriesById[id]; if (!entry) return null; const open = openIds.has(id); const toggle = () => setOpenIds((previous) => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; }); return <EntryRow key={id} entry={entry} open={open} onToggle={toggle} copy={copy} preset={entry.kind === 'preset' ? resolvePreset(entry.id) : undefined} cautions={cautions} resolutionExamples={resolutionExamples.filter((example) => example.renderEntryId === id)} />; })}</div></section>; }) : <div className="empty-state"><FileText size={22} /><h2>No shorthand matches</h2><p>Try a token, family name, or production direction.</p></div>}
    {activeFamily === 'all' && groups.some((group) => group.familyId === 'render') && <p className="source-disclaimer">Source suggested pixels are reference examples, not guaranteed output.</p>}
  </section>;
}

function EntryRow({ entry, open, onToggle, copy, preset, cautions, resolutionExamples }: { readonly entry: CheatsheetEntry; readonly open: boolean; readonly onToggle: () => void; readonly copy: (payload: string) => Promise<CopyOutcome>; readonly preset?: ResolvedPreset; readonly cautions: readonly Caution[]; readonly resolutionExamples: readonly ResolutionExample[] }) {
  const token = entry.token;
  return <article className={`entry-row ${open ? 'is-open' : ''}`}><div className="entry-summary"><button type="button" className="entry-toggle" aria-expanded={open} onClick={onToggle}>{open ? <ChevronDown size={17} /> : <ChevronRight size={17} />}<code>{token}</code></button><p>{entry.meaning}</p><CopyButton payload={token} actionLabel="Copy token" copy={copy} /></div>{open && <div className="entry-detail">{entry.kind === 'preset' && preset ? <PresetDetail preset={preset} copy={copy} /> : <TokenDetail entry={entry as ShorthandEntry} copy={copy} cautions={cautions} resolutionExamples={resolutionExamples} />}</div>}</article>;
}

function TokenDetail({ entry, copy, cautions, resolutionExamples }: { readonly entry: ShorthandEntry; readonly copy: (payload: string) => Promise<CopyOutcome>; readonly cautions: readonly Caution[]; readonly resolutionExamples: readonly ResolutionExample[] }) {
  return <div className="detail-grid"><div><h4>Production direction</h4><p>{entry.direction}</p>{entry.example && <><h4>Example</h4><p>{entry.example}</p></>}</div><div>{entry.cautionIds.length > 0 && <div className="mini-notes">{entry.cautionIds.map((id) => <p key={id}>{cautions.find((caution) => caution.id === id)?.text}</p>)}</div>}{resolutionExamples.length > 0 && <div className="resolution-table"><h4>Source dimension examples</h4>{resolutionExamples.map((example) => <div key={`${example.aspectRatioLabel}-${example.pixelsText}`}><span>{example.aspectRatioLabel}</span><code>{example.pixelsText}</code></div>)}</div>}<CopyButton payload={entry.direction} actionLabel="Copy direction" copy={copy} /></div></div>;
}

function PresetDetail({ preset, copy }: { readonly preset: ResolvedPreset; readonly copy: (payload: string) => Promise<CopyOutcome> }) {
  return <div className="preset-detail"><div className="preset-actions"><CopyButton payload={preset.componentsText} actionLabel="Copy components" copy={copy} /><CopyButton payload={preset.expandedText} actionLabel="Copy expanded direction" copy={copy} /></div><div className="component-list">{preset.components.map((component) => <div key={component.id} className="component-row"><code>{component.token}</code><span>{component.meaning}</span><CopyButton payload={component.token} actionLabel="Copy" copy={copy} /></div>)}</div><p className="preset-note">Apply these directions only where they are compatible with the supplied references; preserve all stronger reference constraints unless an override is explicitly requested.</p></div>;
}
