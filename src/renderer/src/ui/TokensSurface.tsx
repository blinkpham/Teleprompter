import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import type { Axis, BridgeResult, Field, LibraryChoiceView, LibraryCopyTextRequest, LibraryTextResult, LibraryView } from '../../../shared/teleprompter';
import finishGroupUrl from '../assets/teleprompter/runtime/group-finish-v2.png';
import opticsGroupUrl from '../assets/teleprompter/runtime/group-optics-v2.png';
import stageGroupUrl from '../assets/teleprompter/runtime/group-stage-v2.png';
import { Check, Copy, MagnifyingGlass, PencilSimple, SlidersHorizontal, X } from './icons';

export interface TokensSurfaceProps {
  readonly library: LibraryView;
  readonly onApply?: (choice: LibraryChoiceView) => void;
  readonly onCopy?: (choice: LibraryChoiceView) => Promise<{ readonly copied: boolean }>;
  readonly onReadText?: (request: LibraryCopyTextRequest) => Promise<BridgeResult<LibraryTextResult>>;
}

const fields: readonly { id: Field | 'all'; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'cam', label: 'Camera' }, { id: 'angle', label: 'Viewpoint' }, { id: 'comp', label: 'Composition' }, { id: 'light', label: 'Lighting' }, { id: 'look', label: 'Look' }, { id: 'mood', label: 'Mood' }, { id: 'important', label: 'Important' }, { id: 'avoid', label: 'Avoid' }, { id: 'output', label: 'Output' },
];

const groupArtForField = (field?: Field): string => {
  if (field === 'cam' || field === 'angle') return opticsGroupUrl;
  if (field === 'comp' || field === 'light') return stageGroupUrl;
  return finishGroupUrl;
};

const humanize = (value: string): string => value.replace(/[-_]/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
const readableChoiceLabel = (value: string): string => {
  const raw = value.includes(':') ? value.slice(value.indexOf(':') + 1) : value;
  const special: Readonly<Record<string, string>> = { '3q': 'Three-quarter', highkey: 'High key', cleanblue: 'Clean blue', wide35: 'Wide 35', natural50: 'Natural 50', portrait85: 'Portrait 85' };
  return special[raw] ?? humanize(raw.replace(/([a-z])([0-9])/gi, '$1 $2'));
};

export function TokensSurface({ library, onApply, onCopy, onReadText }: TokensSurfaceProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const [query, setQuery] = useState('');
  const [field, setField] = useState<Field | 'all'>('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const choices = useMemo(() => library.choices.filter((choice) => choice.kind === 'atom' || choice.kind === 'bundle').filter((choice) => field === 'all' || choice.field === field).filter((choice) => {
    const needle = query.trim().toLowerCase();
    return !needle || `${choice.label} ${choice.summary} ${choice.shorthand} ${choice.aliases.join(' ')}`.toLowerCase().includes(needle);
  }).sort((a, b) => a.order - b.order || a.label.localeCompare(b.label)), [field, library.choices, query]);
  const grouped = useMemo(() => {
    const groups = new Map<string, LibraryChoiceView[]>();
    choices.forEach((choice) => { const key = choice.field ?? 'other'; groups.set(key, [...(groups.get(key) ?? []), choice]); });
    return [...groups.entries()];
  }, [choices]);
  const activeChoice = choices.find((choice) => choice.id === activeId);

  useEffect(() => {
    const focusSearch = () => { const input = document.querySelector<HTMLInputElement>('.tp-tokens .tp-search-box input'); input?.focus(); input?.select(); };
    window.addEventListener('teleprompter:focus-search', focusSearch);
    return () => window.removeEventListener('teleprompter:focus-search', focusSearch);
  }, []);

  return <section className="tp-tokens" aria-labelledby="tp-tokens-title"><header className="tp-page-header"><div><h1 id="tp-tokens-title">Tokens</h1></div><span className="tp-results-status" role="status">{choices.length} matching direction{choices.length === 1 ? '' : 's'}</span></header><div className="tp-token-tools"><label className="tp-search-box"><MagnifyingGlass size={17} weight="duotone" /><input value={query} onChange={(event) => setQuery(event.target.value.slice(0, 200))} placeholder="Search labels or shorthand" aria-label="Search tokens" />{query && <button type="button" aria-label="Clear token search" onClick={() => setQuery('')}><X size={15} /></button>}</label><div className="tp-field-chips" role="tablist" aria-label="Token field filter">{fields.map((item) => <button key={item.id} type="button" role="tab" aria-selected={field === item.id} className={field === item.id ? 'is-active' : ''} onClick={() => setField(item.id)}>{item.label}</button>)}</div></div><div className="tp-token-groups">{grouped.map(([group, groupChoices]) => <section className="tp-token-group" key={group}><div className="tp-token-group-heading"><h2>{fieldLabel(group as Field)}</h2><span>{groupChoices.length}</span></div><div className="tp-token-list">{groupChoices.map((choice) => <TokenRow key={choice.id} choice={choice} reducedMotion={reducedMotion} onOpen={() => setActiveId(choice.id)} onApply={() => onApply?.(choice)} onCopy={() => onCopy?.(choice)} />)}</div></section>)}{choices.length === 0 && <div className="tp-library-empty"><SlidersHorizontal size={28} weight="duotone" /><strong>No tokens match this filter.</strong><span>Try a shorthand alias or clear the field chips.</span></div>}</div><AnimatePresence>{activeChoice && <TokenDetail choice={activeChoice} library={library} onClose={() => setActiveId(null)} onApply={() => { onApply?.(activeChoice); setActiveId(null); }} onCopy={() => onCopy?.(activeChoice)} onReadText={onReadText} />}</AnimatePresence></section>;
}

function fieldLabel(field: Field): string {
  return fields.find((item) => item.id === field)?.label ?? field.charAt(0).toUpperCase() + field.slice(1);
}

function TokenRow({ choice, reducedMotion, onOpen, onApply, onCopy }: { readonly choice: LibraryChoiceView; readonly reducedMotion: boolean; readonly onOpen: () => void; readonly onApply: () => void; readonly onCopy: () => void }) {
  const label = readableChoiceLabel(choice.label);
  return <motion.div className="tp-token-row" initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? .08 : .16 }}><button type="button" className="tp-token-main" onClick={onOpen}><span className="tp-token-mark" aria-hidden="true"><img src={groupArtForField(choice.field)} alt="" /></span><span><strong>{label}</strong></span></button><button type="button" className="tp-small-icon" aria-label={`Apply ${label}`} data-tooltip={`Apply ${label}`} onClick={onApply}><PencilSimple size={17} weight="duotone" /></button><button type="button" className="tp-small-icon" aria-label={`Copy ${label}`} data-tooltip={`Copy ${label}`} onClick={() => void onCopy()}><Copy size={17} weight="duotone" /></button></motion.div>;
}

function TokenDetail({ choice, library, onClose, onApply, onCopy, onReadText }: { readonly choice: LibraryChoiceView; readonly library: LibraryView; readonly onClose: () => void; readonly onApply: () => void; readonly onCopy: () => void; readonly onReadText?: TokensSurfaceProps['onReadText'] }) {
  const axis = library.axes.find((item) => item.id === choice.axisId);
  const [exactText, setExactText] = useState<string | null>(null);
  const [exactError, setExactError] = useState<string | null>(null);
  const sourceTitles = library.sources.filter((source) => choice.cautionIds.includes(source.id)).map((source) => source.title);
  useEffect(() => {
    let active = true;
    setExactText(null);
    setExactError(null);
    if (!onReadText) return () => { active = false; };
    void onReadText({ recordId: choice.id, format: 'expanded', expectedContentVersion: library.contentVersion }).then((result) => {
      if (!active) return;
      if (result.ok) setExactText(result.text); else setExactError(result.error.message);
    });
    return () => { active = false; };
  }, [choice.id, library.contentVersion, onReadText]);
  return <motion.div className="tp-sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><motion.aside className="tp-detail-sheet tp-token-detail" role="dialog" aria-modal="true" aria-labelledby="tp-token-detail-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 330, damping: 30 }}><header className="tp-detail-header"><div><h2 id="tp-token-detail-title">{choice.label}</h2><p>{choice.summary}</p><span className="tp-detail-shorthand">{humanize(choice.kind)} · {fieldLabel(choice.field ?? 'output')}</span></div><button type="button" className="tp-icon-button" aria-label="Close token detail" onClick={onClose}><X size={19} weight="bold" /></button></header><div className="tp-detail-scroll"><div className="tp-detail-actions"><button type="button" className="tp-primary-action" onClick={onApply}><Check size={18} weight="bold" />Apply</button><button type="button" className="tp-secondary-action" onClick={() => void onCopy()}><Copy size={17} weight="duotone" />Copy</button></div><section className="tp-detail-section"><h3>Readable direction</h3><div className="tp-copy-block">{exactError ? exactError : exactText ?? 'Loading exact compiler text…'}</div><dl className="tp-token-meta"><div><dt>Shorthand</dt><dd>{choice.shorthand}</dd></div><div><dt>Axis</dt><dd>{axis?.label ?? 'Mapped field'}</dd></div><div><dt>Aliases</dt><dd>{choice.aliases.length ? choice.aliases.join(', ') : 'None recorded'}</dd></div></dl></section><details className="tp-disclosure"><summary>Source and caution notes</summary><p>{sourceTitles.length ? sourceTitles.join(' · ') : 'Source references remain available in the accepted library record.'}</p>{choice.cautionIds.map((id) => <p key={id}>{library.cautions.find((caution) => caution.id === id)?.text ?? id}</p>)}</details><details className="tp-disclosure"><summary>Example image</summary><p className="tp-detail-note">{choice.previewAssetId ? `Asset ${choice.previewAssetId} is available to the renderer.` : 'No example image is attached to this token yet.'}</p></details></div></motion.aside></motion.div>;
}
