import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import type { EditRecipe, Field, LibraryChoiceView, LibraryView, Mode, Preset } from '../../../shared/teleprompter';
import finishGroupUrl from '../assets/teleprompter/runtime/group-finish-v2.png';
import opticsGroupUrl from '../assets/teleprompter/runtime/group-optics-v2.png';
import stageGroupUrl from '../assets/teleprompter/runtime/group-stage-v2.png';
import { Check, Copy, Heart, ImageSquare, MagnifyingGlass, PencilSimple, Sparkle, X } from './icons';

export interface LibrarySurfaceProps {
  readonly library: LibraryView;
  readonly mode: Mode;
  readonly favoriteIds?: ReadonlySet<string>;
  readonly onFavorite?: (recordId: string, favorited: boolean) => void;
  readonly onApply?: (recordId: string, kind: 'preset' | 'edit-recipe') => void;
  readonly onCopy?: (recordId: string, format: 'expanded' | 'shorthand' | 'original') => Promise<{ readonly copied: boolean }>;
}

type RecordItem = Preset | EditRecipe;

const groupArtForField = (field?: Field): string | undefined => {
  if (field === 'cam' || field === 'angle') return opticsGroupUrl;
  if (field === 'comp' || field === 'light') return stageGroupUrl;
  if (field === 'look' || field === 'mood') return finishGroupUrl;
  return undefined;
};

const artForRecord = (record: RecordItem, choices: ReadonlyMap<string, LibraryChoiceView>): string | undefined => {
  if ('atomIds' in record) {
    const field = record.atomIds.map((atomId) => choices.get(atomId)?.field).find(Boolean);
    return groupArtForField(field);
  }
  return groupArtForField(record.allowedFields[0]);
};

const humanize = (value: string): string => value.replace(/[-_]/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
const readableRecordLabel = (value: string): string => humanize(value.includes(':') ? value.slice(value.indexOf(':') + 1) : value);

export function LibrarySurface({ library, mode, favoriteIds = new Set(), onFavorite, onApply, onCopy }: LibrarySurfaceProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const [kind, setKind] = useState<'presets' | 'edits'>('presets');
  const [query, setQuery] = useState('');
  const [taxonomy, setTaxonomy] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const choices = useMemo(() => new Map(library.choices.map((choice) => [choice.id, choice])), [library.choices]);
  const records = kind === 'presets' ? library.presets : library.editRecipes;
  const taxons = library.taxa.filter((taxon) => taxon.tree === (kind === 'presets' ? 'presets' : 'edits') && !library.taxa.some((child) => child.parentId === taxon.id));
  const filtered = records.filter((record) => {
    const haystack = `${record.label} ${record.summary} ${record.shorthand} ${record.aliases.join(' ')}`.toLowerCase();
    return (!query.trim() || haystack.includes(query.trim().toLowerCase())) && (taxonomy === 'all' || record.primaryTaxonId === taxonomy) && (!favoritesOnly || favoriteIds.has(record.id));
  });
  const activeRecord = records.find((record) => record.id === activeId);

  useEffect(() => {
    const focusSearch = () => { const input = document.querySelector<HTMLInputElement>('.tp-library .tp-search-box input'); input?.focus(); input?.select(); };
    window.addEventListener('teleprompter:focus-search', focusSearch);
    return () => window.removeEventListener('teleprompter:focus-search', focusSearch);
  }, []);

  return <section className="tp-library" aria-labelledby="tp-library-title"><header className="tp-page-header"><div><h1 id="tp-library-title">Library</h1></div><span className="tp-results-status" role="status">{filtered.length} {kind === 'presets' ? 'presets' : 'edits'} shown</span></header><div className="tp-library-tools"><div className="tp-segment" role="tablist" aria-label="Library type"><button type="button" role="tab" aria-selected={kind === 'presets'} className={kind === 'presets' ? 'is-active' : ''} onClick={() => { setKind('presets'); setTaxonomy('all'); setActiveId(null); }}><Sparkle size={15} weight={kind === 'presets' ? 'fill' : 'duotone'} />Presets</button><button type="button" role="tab" aria-selected={kind === 'edits'} className={kind === 'edits' ? 'is-active' : ''} onClick={() => { setKind('edits'); setTaxonomy('all'); setActiveId(null); }}><PencilSimple size={15} weight={kind === 'edits' ? 'fill' : 'duotone'} />Edits</button></div><label className="tp-search-box"><MagnifyingGlass size={17} weight="duotone" /><input value={query} onChange={(event) => setQuery(event.target.value.slice(0, 200))} placeholder={`Search ${kind}`} aria-label={`Search ${kind}`} />{query && <button type="button" aria-label="Clear library search" onClick={() => setQuery('')}><X size={15} /></button>}</label><label className="tp-select-control"><span className="sr-only">Taxonomy</span><select value={taxonomy} onChange={(event) => setTaxonomy(event.target.value)}><option value="all">All families</option>{taxons.map((taxon) => <option key={taxon.id} value={taxon.id}>{taxon.label}</option>)}</select></label><button type="button" className={favoritesOnly ? 'tp-filter-button is-active' : 'tp-filter-button'} aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly((value) => !value)}><Heart size={16} weight={favoritesOnly ? 'fill' : 'duotone'} />Favorites</button></div><div className="tp-library-grid">{filtered.map((record) => <LibraryCard key={record.id} record={record} kind={kind === 'presets' ? 'preset' : 'edit-recipe'} artUrl={artForRecord(record, choices)} isFavorite={favoriteIds.has(record.id)} reducedMotion={reducedMotion} onOpen={() => setActiveId(record.id)} onApply={() => onApply?.(record.id, kind === 'presets' ? 'preset' : 'edit-recipe')} onFavorite={() => onFavorite?.(record.id, !favoriteIds.has(record.id))} />)}{filtered.length === 0 && <div className="tp-library-empty"><ImageSquare size={28} weight="duotone" /><strong>No {kind} match this search.</strong><span>Clear the filter or try a taxonomy term.</span></div>}</div><AnimatePresence>{activeRecord && <LibraryDetail record={activeRecord} kind={kind === 'presets' ? 'preset' : 'edit-recipe'} library={library} mode={mode} choiceMap={choices} artUrl={artForRecord(activeRecord, choices)} onClose={() => setActiveId(null)} onApply={() => { onApply?.(activeRecord.id, kind === 'presets' ? 'preset' : 'edit-recipe'); setActiveId(null); }} onCopy={onCopy} />}</AnimatePresence></section>;
}

function LibraryCard({ record, kind, artUrl, isFavorite, reducedMotion, onOpen, onApply, onFavorite }: { readonly record: RecordItem; readonly kind: 'preset' | 'edit-recipe'; readonly artUrl?: string; readonly isFavorite: boolean; readonly reducedMotion: boolean; readonly onOpen: () => void; readonly onApply: () => void; readonly onFavorite: () => void }) {
  const atomCount = 'atomIds' in record ? record.atomIds.length : record.slotKeys.length;
  const label = readableRecordLabel(record.label);
  return <motion.article className="tp-library-card" initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? .08 : .18 }}><button type="button" className="tp-card-art" aria-label={`Open ${label} details`} onClick={onOpen}><span className="tp-card-image" aria-hidden="true">{artUrl ? <img src={artUrl} alt="" /> : <Sparkle size={26} weight="duotone" />}</span><span className="tp-card-label">{label}</span></button><div className="tp-card-actions"><span className="tp-card-kind">{kind === 'preset' ? `${atomCount} directions` : `${atomCount} slots`}</span><button type="button" className={isFavorite ? 'tp-small-icon is-favorite' : 'tp-small-icon'} aria-label={`${isFavorite ? 'Remove' : 'Add'} ${label} ${isFavorite ? 'from' : 'to'} favorites`} aria-pressed={isFavorite} onClick={onFavorite}><Heart size={17} weight={isFavorite ? 'fill' : 'duotone'} /></button><button type="button" className="tp-small-icon" aria-label={`Apply ${label}`} data-tooltip={`Apply ${label}`} onClick={onApply}><Check size={17} weight="bold" /></button></div></motion.article>;
}

function LibraryDetail({ record, kind, library, mode, choiceMap, artUrl, onClose, onApply, onCopy }: { readonly record: RecordItem; readonly kind: 'preset' | 'edit-recipe'; readonly library: LibraryView; readonly mode: Mode; readonly choiceMap: ReadonlyMap<string, LibraryChoiceView>; readonly artUrl?: string; readonly onClose: () => void; readonly onApply: () => void; readonly onCopy?: LibrarySurfaceProps['onCopy'] }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const isPreset = kind === 'preset';
  const preset = isPreset ? record as Preset : undefined;
  const recipe = !isPreset ? record as EditRecipe : undefined;
  const sourceTitles = record.sourceIds.map((id) => library.sources.find((source) => source.id === id)?.title ?? id);
  const copyRecord = async () => {
    if (!onCopy) return;
    const result = await onCopy(record.id, 'expanded');
    if (result.copied) { setCopyState('copied'); window.setTimeout(() => setCopyState('idle'), 1400); }
  };
  return <motion.div className="tp-sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><motion.aside className="tp-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="tp-detail-title" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ type: 'spring', stiffness: 330, damping: 30 }}><header className="tp-detail-header"><div><h2 id="tp-detail-title">{record.label}</h2><p>{record.summary}</p><span className="tp-detail-shorthand">{isPreset ? 'Preset' : 'Edit recipe'} · {humanize(mode)}</span></div><button type="button" className="tp-icon-button" aria-label="Close detail" onClick={onClose}><X size={19} weight="bold" /></button></header><div className="tp-detail-scroll"><div className="tp-detail-art"><span className="tp-detail-image" aria-hidden="true">{artUrl ? <img src={artUrl} alt="" /> : <Sparkle size={34} weight="duotone" />}</span><span>{isPreset ? 'Exact direction breakdown' : 'Structured operation slots'}</span></div><div className="tp-detail-actions"><button type="button" className="tp-primary-action" onClick={onApply}><Check size={18} weight="bold" />Apply</button><button type="button" className="tp-secondary-action" onClick={() => void copyRecord()}>{copyState === 'copied' ? <Check size={17} weight="bold" /> : <Copy size={17} weight="duotone" />}{copyState === 'copied' ? 'Copied' : 'Copy'}</button></div>{preset && <section className="tp-detail-section"><h3>Directions</h3><div className="tp-breakdown-list">{preset.atomIds.map((atomId) => <div key={atomId}><strong>{choiceMap.get(atomId)?.label ?? atomId}</strong><span>{choiceMap.get(atomId)?.shorthand ?? 'Mapped direction'}</span></div>)}</div><p className="tp-detail-note">Applying this preset unfolds these directions. Manual axis changes stay manual; Reset to preset is explicit.</p></section>}{recipe && <section className="tp-detail-section"><h3>Slots</h3><div className="tp-breakdown-list">{recipe.slotKeys.map((slot) => <div key={slot}><strong>{humanize(slot)}</strong><span>Blank values remain valid placeholders.</span></div>)}</div><p className="tp-detail-note">Affected areas: {recipe.affectedDomains.map(humanize).join(', ') || 'None listed'}. Required preservation: {recipe.requiredPreservedDomains.map(humanize).join(', ') || 'None listed'}.</p></section>}<section className="tp-detail-section"><h3>Readable direction</h3><div className="tp-copy-block">{isPreset ? preset?.atomIds.map((id) => choiceMap.get(id)?.label ?? id).join('; ') : recipe?.segments.map((segment) => 'text' in segment ? segment.text : `[${segment.placeholder}]`).join(' ')}</div></section><details className="tp-disclosure"><summary>Sources and cautions</summary><p>{sourceTitles.length ? sourceTitles.join(' · ') : 'No source note attached.'}</p>{record.cautionIds.map((id) => <p key={id}>{library.cautions.find((caution) => caution.id === id)?.text ?? id}</p>)}</details><details className="tp-disclosure"><summary>Original</summary><p className="tp-detail-note">The legacy identifier remains available through Tokens for source-faithful copy.</p></details></div></motion.aside></motion.div>;
}
