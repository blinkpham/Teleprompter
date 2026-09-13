import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import type { EditRecipe, LibraryChoiceView, LibraryView, Mode, Preset } from '../../../shared/teleprompter';
import { Check, Copy, Heart, ImageSquare, MagnifyingGlass, Sparkle, X } from './icons';

export interface LibrarySurfaceProps {
  readonly library: LibraryView;
  readonly mode: Mode;
  readonly favoriteIds?: ReadonlySet<string>;
  readonly onFavorite?: (recordId: string, favorited: boolean) => void;
  readonly onApply?: (recordId: string, kind: 'preset' | 'edit-recipe') => void;
  readonly onCopy?: (recordId: string, format: 'expanded' | 'shorthand' | 'original') => Promise<{ readonly copied: boolean }>;
}

type RecordItem = Preset | EditRecipe;

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
    const choice = choices.get(record.id);
    const haystack = `${record.label} ${record.summary} ${record.shorthand} ${record.aliases.join(' ')}`.toLowerCase();
    return (!query.trim() || haystack.includes(query.trim().toLowerCase())) && (taxonomy === 'all' || record.primaryTaxonId === taxonomy) && (!favoritesOnly || favoriteIds.has(record.id));
  });
  const activeRecord = records.find((record) => record.id === activeId);

  useEffect(() => {
    const focusSearch = () => { const input = document.querySelector<HTMLInputElement>('.tp-library .tp-search-box input'); input?.focus(); input?.select(); };
    window.addEventListener('teleprompter:focus-search', focusSearch);
    return () => window.removeEventListener('teleprompter:focus-search', focusSearch);
  }, []);

  return <section className="tp-library" aria-labelledby="tp-library-title"><header className="tp-page-header"><div><p className="tp-eyebrow">Reusable directions</p><h1 id="tp-library-title">Library</h1></div><span className="tp-results-status" role="status">{filtered.length} shown · {library.contentVersion}</span></header><div className="tp-library-tools"><div className="tp-segment" role="tablist" aria-label="Library type"><button type="button" role="tab" aria-selected={kind === 'presets'} className={kind === 'presets' ? 'is-active' : ''} onClick={() => { setKind('presets'); setTaxonomy('all'); setActiveId(null); }}>Presets</button><button type="button" role="tab" aria-selected={kind === 'edits'} className={kind === 'edits' ? 'is-active' : ''} onClick={() => { setKind('edits'); setTaxonomy('all'); setActiveId(null); }}>Edits</button></div><label className="tp-search-box"><MagnifyingGlass size={17} weight="duotone" /><input value={query} onChange={(event) => setQuery(event.target.value.slice(0, 200))} placeholder={`Search ${kind}`} aria-label={`Search ${kind}`} />{query && <button type="button" aria-label="Clear library search" onClick={() => setQuery('')}><X size={15} /></button>}</label><label className="tp-select-control"><span className="sr-only">Taxonomy</span><select value={taxonomy} onChange={(event) => setTaxonomy(event.target.value)}><option value="all">All families</option>{taxons.map((taxon) => <option key={taxon.id} value={taxon.id}>{taxon.label}</option>)}</select></label><button type="button" className={favoritesOnly ? 'tp-filter-button is-active' : 'tp-filter-button'} aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly((value) => !value)}><Heart size={16} weight={favoritesOnly ? 'fill' : 'duotone'} />Favorites</button></div><div className="tp-library-grid">{filtered.map((record) => <LibraryCard key={record.id} record={record} kind={kind === 'presets' ? 'preset' : 'edit-recipe'} choice={choices.get(record.id)} isFavorite={favoriteIds.has(record.id)} reducedMotion={reducedMotion} onOpen={() => setActiveId(record.id)} onApply={() => onApply?.(record.id, kind === 'presets' ? 'preset' : 'edit-recipe')} onFavorite={() => onFavorite?.(record.id, !favoriteIds.has(record.id))} />)}{filtered.length === 0 && <div className="tp-library-empty"><ImageSquare size={28} weight="duotone" /><strong>No {kind} match this search.</strong><span>Clear the filter or try a taxonomy term.</span></div>}</div><AnimatePresence>{activeRecord && <LibraryDetail record={activeRecord} kind={kind === 'presets' ? 'preset' : 'edit-recipe'} library={library} mode={mode} choiceMap={choices} onClose={() => setActiveId(null)} onApply={() => { onApply?.(activeRecord.id, kind === 'presets' ? 'preset' : 'edit-recipe'); setActiveId(null); }} onCopy={onCopy} />}</AnimatePresence></section>;
}

function LibraryCard({ record, kind, choice, isFavorite, reducedMotion, onOpen, onApply, onFavorite }: { readonly record: RecordItem; readonly kind: 'preset' | 'edit-recipe'; readonly choice?: LibraryChoiceView; readonly isFavorite: boolean; readonly reducedMotion: boolean; readonly onOpen: () => void; readonly onApply: () => void; readonly onFavorite: () => void }) {
  const atomCount = 'atomIds' in record ? record.atomIds.length : record.slotKeys.length;
  return <motion.article className="tp-library-card" initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? .08 : .18 }}><button type="button" className="tp-card-art" aria-label={`Open ${record.label} details`} onClick={onOpen}><span className="tp-art-orb" aria-hidden="true"><Sparkle size={26} weight="duotone" /></span><span className="tp-card-kind">{kind === 'preset' ? 'Visual preset' : 'Edit recipe'}</span></button><div className="tp-library-card-body"><div className="tp-card-title-row"><div><h2>{record.label}</h2><p>{choice?.summary ?? record.summary}</p></div><button type="button" className={isFavorite ? 'tp-small-icon is-favorite' : 'tp-small-icon'} aria-label={`${isFavorite ? 'Remove' : 'Add'} ${record.label} ${isFavorite ? 'from' : 'to'} favorites`} aria-pressed={isFavorite} onClick={onFavorite}><Heart size={17} weight={isFavorite ? 'fill' : 'duotone'} /></button></div><div className="tp-library-card-footer"><span>{atomCount} {kind === 'preset' ? 'directions' : 'slots'}</span><button type="button" className="tp-apply-button" aria-label={`Apply ${record.label}`} onClick={onApply}><Check size={16} weight="bold" />Apply</button></div></div></motion.article>;
}

function LibraryDetail({ record, kind, library, mode, choiceMap, onClose, onApply, onCopy }: { readonly record: RecordItem; readonly kind: 'preset' | 'edit-recipe'; readonly library: LibraryView; readonly mode: Mode; readonly choiceMap: ReadonlyMap<string, LibraryChoiceView>; readonly onClose: () => void; readonly onApply: () => void; readonly onCopy?: LibrarySurfaceProps['onCopy'] }) {
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
  return <motion.div className="tp-sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><motion.aside className="tp-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="tp-detail-title" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ type: 'spring', stiffness: 330, damping: 30 }}><header className="tp-detail-header"><div><p className="tp-eyebrow">{isPreset ? 'Preset detail' : 'Edit detail'} · {mode}</p><h2 id="tp-detail-title">{record.label}</h2><p>{record.summary}</p></div><button type="button" className="tp-icon-button" aria-label="Close detail" onClick={onClose}><X size={19} weight="bold" /></button></header><div className="tp-detail-scroll"><div className="tp-detail-art"><span className="tp-art-orb" aria-hidden="true"><Sparkle size={34} weight="duotone" /></span><span>{isPreset ? 'Exact atomic breakdown' : 'Structured operation slots'}</span></div><div className="tp-detail-actions"><button type="button" className="tp-primary-action" onClick={onApply}><Check size={18} weight="bold" />Apply</button><button type="button" className="tp-secondary-action" onClick={() => void copyRecord()}>{copyState === 'copied' ? <Check size={17} weight="bold" /> : <Copy size={17} weight="duotone" />}{copyState === 'copied' ? 'Copied' : 'Copy'}</button></div>{preset && <section className="tp-detail-section"><h3>Atoms</h3><div className="tp-breakdown-list">{preset.atomIds.map((atomId) => <div key={atomId}><strong>{choiceMap.get(atomId)?.label ?? atomId}</strong><span>{choiceMap.get(atomId)?.shorthand ?? 'Mapped atom'}</span></div>)}</div><p className="tp-detail-note">Applying this preset unfolds these directions. Manual axis changes stay manual; Reset to preset is explicit.</p></section>}{recipe && <section className="tp-detail-section"><h3>Slots</h3><div className="tp-breakdown-list">{recipe.slotKeys.map((slot) => <div key={slot}><strong>{slot.replace(/[-_]/g, ' ')}</strong><span>Blank values remain valid placeholders.</span></div>)}</div><p className="tp-detail-note">Affected domains: {recipe.affectedDomains.join(', ')}. Required preservation: {recipe.requiredPreservedDomains.join(', ') || 'none'}.</p></section>}<section className="tp-detail-section"><h3>Copyable direction</h3><pre className="tp-copy-block">{isPreset ? preset?.atomIds.map((id) => choiceMap.get(id)?.label ?? id).join('; ') : recipe?.segments.map((segment) => 'text' in segment ? segment.text : `[${segment.placeholder}]`).join(' ')}</pre></section><details className="tp-disclosure"><summary>Sources and cautions</summary><p>{sourceTitles.length ? sourceTitles.join(' · ') : 'No source note attached.'}</p>{record.cautionIds.map((id) => <p key={id}>{library.cautions.find((caution) => caution.id === id)?.text ?? id}</p>)}</details><details className="tp-disclosure"><summary>Original</summary><p className="tp-detail-note">The legacy identifier remains available through Tokens for source-faithful copy.</p></details></div></motion.aside></motion.div>;
}
