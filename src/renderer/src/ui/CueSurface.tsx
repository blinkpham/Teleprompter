import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { Axis, AxisChoice, CueCommand, CueDraft, Field, LibraryChoiceView, Mode, CopyFormat } from '../../../shared/teleprompter';
import type { CueSurfaceProps } from '../../../shared/ui-types';
import finishGroupUrl from '../assets/teleprompter/runtime/group-finish-v2.png';
import opticsGroupUrl from '../assets/teleprompter/runtime/group-optics-v2.png';
import stageGroupUrl from '../assets/teleprompter/runtime/group-stage-v2.png';
import {
  ArrowsClockwise,
  Check,
  CircleNotch,
  Copy,
  CornersOut,
  DotsThree,
  Funnel,
  MagnifyingGlass,
  Plus,
  Sparkle,
  X,
} from './icons';

export interface CueSurfaceExtraProps extends CueSurfaceProps {
  readonly onModeChange?: (mode: Mode) => void;
  readonly onOpenLibrary?: (recordId: string) => void;
}

type PickerKind = 'group' | 'constraints' | 'output' | 'preset' | 'recipes' | null;
type GroupKey = 'optics' | 'stage' | 'finish';

const GROUP_ART: Readonly<Record<GroupKey, string>> = {
  optics: opticsGroupUrl,
  stage: stageGroupUrl,
  finish: finishGroupUrl,
};

const GROUPS: readonly { key: GroupKey; title: string; fields: readonly Field[]; summary: string }[] = [
  { key: 'optics', title: 'Optics', fields: ['cam', 'angle'], summary: 'Lens, viewpoint, depth and focus' },
  { key: 'stage', title: 'Stage', fields: ['comp', 'light'], summary: 'Composition and light shaping' },
  { key: 'finish', title: 'Finish', fields: ['look', 'mood'], summary: 'Look, treatment and mood' },
];

const FIELD_LABELS: Readonly<Record<Field, string>> = {
  cam: 'Camera', angle: 'Viewpoint', comp: 'Composition', light: 'Lighting', look: 'Look', mood: 'Mood',
  important: 'Important', avoid: 'Avoid', output: 'Output',
};

const groupForField = (field: Field): GroupKey | undefined => GROUPS.find((group) => group.fields.includes(field))?.key;
const artworkForField = (field: Field): string | undefined => {
  const group = groupForField(field);
  return group ? GROUP_ART[group] : undefined;
};
const artworkForChoice = (choice: LibraryChoiceView, fallback: GroupKey = 'optics'): string => artworkForField(choice.field ?? 'cam') ?? GROUP_ART[fallback];
const getChoice = (choices: readonly AxisChoice[], axisId: string): AxisChoice | undefined => choices.find((choice) => choice.axisId === axisId);
const titleCase = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);
const readableChoiceLabel = (value: string): string => {
  const raw = value.includes(':') ? value.slice(value.indexOf(':') + 1) : value;
  const special: Readonly<Record<string, string>> = { '3q': 'Three-quarter', highkey: 'High key', daybounce: 'Day bounce', cleanblue: 'Clean blue', lowhero: 'Low hero' };
  return special[raw] ?? raw.replace(/[-_]/g, ' ').replace(/([a-z])([0-9])/gi, '$1 $2').replace(/\b\w/g, (character) => character.toUpperCase());
};

function labelsForChoice(axis: Axis, draft: CueDraft, choiceMap: ReadonlyMap<string, LibraryChoiceView>): string[] {
  const choice = getChoice(draft.choices, axis.id);
  return choice?.atomIds.map((id) => readableChoiceLabel(choiceMap.get(id)?.label ?? id)) ?? [];
}

function compactSummary(labels: readonly string[]): string {
  if (labels.length === 0) return 'Choose';
  if (labels.length === 1) return labels[0] ?? 'Choose';
  return `${labels[0]} +${labels.length - 1}`;
}

function submit(dispatch: CueSurfaceProps['dispatch'], command: CueCommand): void {
  void dispatch(command);
}

export function CueSurface({ surface, snapshot, library, dispatch, copy, preview, requestPreview, requestSize, dismiss, onModeChange, onOpenLibrary }: CueSurfaceExtraProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const draft = snapshot.drafts[snapshot.activeMode];
  const [picker, setPicker] = useState<PickerKind>(null);
  const [pickerField, setPickerField] = useState<Field | 'all'>('all');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [customDraft, setCustomDraft] = useState<Partial<Record<Field, string>>>(draft.customText);
  const [what, setWhat] = useState(draft.what);
  const whatRef = useRef<HTMLTextAreaElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const copyResetRef = useRef<number | undefined>(undefined);

  const choiceMap = useMemo(() => new Map(library.choices.map((choice) => [choice.id, choice])), [library.choices]);
  const axesById = useMemo(() => new Map(library.axes.map((axis) => [axis.id, axis])), [library.axes]);
  const activeChoices = useMemo(() => library.choices.filter((choice) => choice.status === 'active'), [library.choices]);
  const selectedLabels = useMemo(() => new Set(draft.choices.flatMap((choice) => choice.atomIds)), [draft.choices]);

  useEffect(() => {
    if (whatRef.current?.matches(':focus')) return;
    setWhat(draft.what);
  }, [draft.what]);

  useEffect(() => {
    setCustomDraft(draft.customText);
  }, [draft.customText]);

  useEffect(() => () => {
    if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
    if (copyResetRef.current !== undefined) window.clearTimeout(copyResetRef.current);
  }, []);

  useEffect(() => {
    if (picker || previewOpen) requestSize?.('expanded');
    else requestSize?.('compact');
  }, [picker, previewOpen, requestSize]);

  useEffect(() => {
    if (!previewOpen || !requestPreview) return;
    void requestPreview({
      draftId: draft.id,
      expectedRevision: draft.revision,
      format: draft.outputFormat,
      expectedContentVersion: library.contentVersion,
    });
  }, [draft.id, draft.outputFormat, draft.revision, library.contentVersion, previewOpen, requestPreview]);

  useEffect(() => {
    if (surface !== 'spotlight' && !picker && !previewOpen) return undefined;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.isComposing) return;
      if (event.key !== 'Escape') return;
      if (search) {
        setSearch('');
        event.preventDefault();
        return;
      }
      setPicker(null);
      setPreviewOpen(false);
      event.preventDefault();
      if (surface === 'spotlight' && !picker && !previewOpen) {
        dismiss?.();
        return;
      }
      window.setTimeout(() => openerRef.current?.focus(), reducedMotion ? 0 : 180);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dismiss, picker, previewOpen, search, reducedMotion, surface]);

  useEffect(() => {
    const focusSearch = () => {
      setPreviewOpen(false);
      setSearch('');
      setPicker('group');
    };
    window.addEventListener('teleprompter:focus-search', focusSearch);
    return () => window.removeEventListener('teleprompter:focus-search', focusSearch);
  }, []);

  const updateWhat = (value: string, immediate = false) => {
    setWhat(value);
    if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
    const command = () => submit(dispatch, { type: 'set-what', text: value });
    if (immediate) command();
    else timerRef.current = window.setTimeout(command, 120);
  };

  const updateCustom = (field: Field, value: string, immediate = false) => {
    setCustomDraft((previous) => ({ ...previous, [field]: value }));
    if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
    const command = () => submit(dispatch, { type: 'set-custom-text', field, text: value });
    if (immediate) command();
    else timerRef.current = window.setTimeout(command, 120);
  };

  const closeOverlay = () => {
    setPicker(null);
    setPreviewOpen(false);
    window.setTimeout(() => openerRef.current?.focus(), reducedMotion ? 0 : 180);
  };

  const copyDraft = async (format: CopyFormat = draft.outputFormat) => {
    if (copying) return;
    setCopying(true);
    setCopyError(null);
    if (what !== draft.what) {
      const result = await dispatch({ type: 'set-what', text: what });
      if (!result.ok) {
        setCopying(false);
        setCopyError(result.error.message);
        return;
      }
    }
    for (const [field, value] of Object.entries(customDraft)) {
      if ((draft.customText[field as Field] ?? '') === (value ?? '')) continue;
      const result = await dispatch({ type: 'set-custom-text', field: field as Field, text: value ?? '' });
      if (!result.ok) {
        setCopying(false);
        setCopyError(result.error.message);
        return;
      }
    }
    const result = await copy(format);
    setCopying(false);
    if (!result.copied) {
      setCopyError('Copy was not acknowledged. Try again.');
      return;
    }
    setCopied(true);
    if (copyResetRef.current !== undefined) window.clearTimeout(copyResetRef.current);
    copyResetRef.current = window.setTimeout(() => setCopied(false), 1400);
    if (surface === 'spotlight') window.setTimeout(() => dismiss?.(), 180);
  };

  const openPicker = (kind: PickerKind, opener: HTMLButtonElement, field: Field | 'all' = 'all') => {
    openerRef.current = opener;
    setSearch('');
    setPickerField(field);
    setPicker(kind);
    setPreviewOpen(false);
  };

  const handleMode = (mode: Mode) => {
    if (mode === snapshot.activeMode) return;
    updateWhat(what, true);
    onModeChange?.(mode);
  };

  const fieldAxes = (fields: readonly Field[]) => library.axes.filter((axis) => fields.includes(axis.field)).sort((a, b) => a.order - b.order);

  return (
    <section className={surface === 'spotlight' ? 'tp-cue tp-cue--spotlight' : 'tp-cue'} aria-labelledby="tp-cue-title">
      <div className="tp-cue-header">
        <div>
          <h1 id="tp-cue-title">Build a cue</h1>
        </div>
        <div className="tp-header-actions">
          <button type="button" className="tp-icon-button" aria-label="Reset current draft" data-tooltip="Reset draft" onClick={() => submit(dispatch, { type: 'reset-draft' })}><ArrowsClockwise size={19} weight="duotone" /></button>
          {surface === 'spotlight' && <button type="button" className="tp-icon-button" aria-label="Hide Cue" data-tooltip="Hide Cue" onClick={dismiss}><X size={19} weight="duotone" /></button>}
        </div>
      </div>

      <div className="tp-mode-row" role="tablist" aria-label="Cue mode">
        {(['create', 'edit'] as Mode[]).map((mode) => <button key={mode} type="button" role="tab" aria-selected={snapshot.activeMode === mode} className={snapshot.activeMode === mode ? 'tp-mode-tab is-active' : 'tp-mode-tab'} onClick={() => handleMode(mode)}>{titleCase(mode)}</button>)}
        <button type="button" className="tp-preset-trigger" aria-haspopup="dialog" aria-expanded={picker === 'preset'} onClick={(event) => openPicker('preset', event.currentTarget)}><Sparkle size={16} weight="duotone" />{draft.activePresetId ? readableChoiceLabel(choiceMap.get(draft.activePresetId)?.label ?? 'Preset') : 'Preset'}<DotsThree size={17} weight="bold" /></button>
      </div>

      {snapshot.activeMode === 'edit' && <EditRecipeBar draft={draft} library={library} choiceMap={choiceMap} dispatch={dispatch} onOpen={(event) => openPicker('recipes', event.currentTarget)} />}

      <LayoutGroup id={`tp-cue-${surface}`}>
        <div className="tp-parameter-grid">
          {GROUPS.map((group) => <ParameterTile key={group.key} group={group} axes={fieldAxes(group.fields)} draft={draft} choiceMap={choiceMap} onOpen={(event) => openPicker('group', event.currentTarget, group.fields[0])} />)}
        </div>
        <motion.div className="tp-composer-surface" layout transition={{ type: 'spring', stiffness: 330, damping: 30, mass: 1 }}>
          <div className="tp-composer-glow" aria-hidden="true" />
          <label className="tp-what-label" htmlFor={`tp-what-${surface}`}>What <span>Subject, action, scene</span></label>
          <textarea ref={whatRef} id={`tp-what-${surface}`} className="tp-what-input" value={what} onChange={(event) => updateWhat(event.target.value.slice(0, 10000))} onBlur={() => updateWhat(what, true)} rows={2} placeholder={snapshot.activeMode === 'edit' ? 'Describe any other changes' : 'Describe the subject, action, and scene'} />
          {snapshot.activeMode === 'edit' && <EditSlots draft={draft} library={library} choiceMap={choiceMap} dispatch={dispatch} />}
        </motion.div>
      </LayoutGroup>

      <div className="tp-cue-controls">
        <div className="tp-control-cluster">
          <button type="button" className="tp-pill-control" aria-haspopup="dialog" aria-expanded={picker === 'constraints'} onClick={(event) => openPicker('constraints', event.currentTarget, 'important')}><Plus size={16} weight="bold" /><span>Important</span><small>{countFieldAtoms(draft, library.axes, 'important')}</small></button>
          <button type="button" className="tp-pill-control" aria-haspopup="dialog" aria-expanded={picker === 'constraints'} onClick={(event) => openPicker('constraints', event.currentTarget, 'avoid')}><Funnel size={16} weight="duotone" /><span>Avoid</span><small>{countFieldAtoms(draft, library.axes, 'avoid')}</small></button>
          <button type="button" className="tp-pill-control" aria-haspopup="dialog" aria-expanded={picker === 'output'} onClick={(event) => openPicker('output', event.currentTarget)}><span>Output</span><small>{outputSummary(draft, library, choiceMap)}</small></button>
        </div>
        <div className="tp-action-cluster">
          <button type="button" className="tp-secondary-action" aria-expanded={previewOpen} onClick={() => { setPreviewOpen((open) => !open); setPicker(null); }}>{previewOpen ? 'Close preview' : 'Preview'}<CornersIcon /></button>
          <button type="button" className="tp-primary-action" disabled={copying} onClick={() => void copyDraft()}>{copying ? <CircleNotch className="tp-spin" size={19} /> : copied ? <Check size={19} weight="bold" /> : <Copy size={19} weight="duotone" />}<span>{copied ? 'Copied' : 'Copy'}</span></button>
        </div>
      </div>
      {copyError && <p className="tp-inline-error" role="alert">{copyError}</p>}

      <AnimatePresence initial={false}>
        {(picker || previewOpen) && <OverlayLayer reducedMotion={reducedMotion} onClose={closeOverlay}>
          {picker && <PickerPanel kind={picker} initialField={pickerField} search={search} setSearch={setSearch} draft={draft} library={library} choiceMap={choiceMap} activeChoices={activeChoices} selectedIds={selectedLabels} dispatch={dispatch} onClose={closeOverlay} onOpenLibrary={onOpenLibrary} />}
          {previewOpen && <PreviewPanel draft={draft} preview={preview} onChooseFormat={(format) => submit(dispatch, { type: 'choose-format', format })} onCopy={(format) => void copyDraft(format)} copying={copying} copied={copied} />}
        </OverlayLayer>}
      </AnimatePresence>
    </section>
  );
}

function countFieldAtoms(draft: CueDraft, axes: readonly Axis[], field: Field): number {
  const ids = new Set(axes.filter((axis) => axis.field === field).map((axis) => axis.id));
  return draft.choices.filter((choice) => ids.has(choice.axisId)).reduce((total, choice) => total + choice.atomIds.length, 0);
}

function outputSummary(draft: CueDraft, library: CueSurfaceProps['library'], choiceMap: ReadonlyMap<string, LibraryChoiceView>): string {
  const outputAxes = library.axes.filter((axis) => axis.field === 'output');
  const values = outputAxes.flatMap((axis) => labelsForChoice(axis, draft, choiceMap));
  return values.length > 0 ? values.join(' · ') : 'Choose';
}

function CornersIcon() {
  return <CornersOut size={16} weight="duotone" aria-hidden="true" />;
}

function ParameterTile({ group, axes, draft, choiceMap, onOpen }: { readonly group: typeof GROUPS[number]; readonly axes: readonly Axis[]; readonly draft: CueDraft; readonly choiceMap: ReadonlyMap<string, LibraryChoiceView>; readonly onOpen: (event: import('react').MouseEvent<HTMLButtonElement>) => void }) {
  const values = axes.flatMap((axis) => labelsForChoice(axis, draft, choiceMap));
  return <motion.button type="button" className={values.length > 0 ? 'tp-parameter-tile has-selection' : 'tp-parameter-tile'} layoutId={`tp-tile-${group.key}`} onClick={onOpen} aria-haspopup="dialog" aria-label={`Choose ${group.title}${values.length > 0 ? `, ${compactSummary(values)}` : ''}`}><span className={`tp-tile-object tp-tile-object--${group.key}`} aria-hidden="true"><img src={GROUP_ART[group.key]} alt="" /><span /></span><span className="tp-tile-copy"><strong>{group.title}</strong><span>{compactSummary(values)}</span></span><CornersIcon /></motion.button>;
}

function EditRecipeBar({ draft, library, choiceMap, dispatch, onOpen }: { readonly draft: CueDraft; readonly library: CueSurfaceProps['library']; readonly choiceMap: ReadonlyMap<string, LibraryChoiceView>; readonly dispatch: CueSurfaceProps['dispatch']; readonly onOpen: (event: import('react').MouseEvent<HTMLButtonElement>) => void }) {
  return <div className="tp-edit-bar"><div className="tp-edit-bar-heading"><span>Change operations</span><small>{draft.edits.length ? `${draft.edits.length} selected` : 'Choose what changes'}</small></div><div className="tp-chip-row">{draft.edits.map((edit) => <button key={edit.recipeId} type="button" className="tp-chip is-selected" onClick={() => submit(dispatch, { type: 'remove-recipe', recipeId: edit.recipeId })}>{choiceMap.get(edit.recipeId)?.label ?? library.editRecipes.find((recipe) => recipe.id === edit.recipeId)?.label ?? edit.recipeId}<X size={14} weight="bold" /></button>)}<button type="button" className="tp-add-chip" onClick={onOpen} disabled={library.editRecipes.length === 0}><Plus size={15} weight="bold" />Add operation</button></div></div>;
}

function EditSlots({ draft, library, choiceMap, dispatch }: { readonly draft: CueDraft; readonly library: CueSurfaceProps['library']; readonly choiceMap: ReadonlyMap<string, LibraryChoiceView>; readonly dispatch: CueSurfaceProps['dispatch'] }) {
  const recipes = new Map(library.editRecipes.map((recipe) => [recipe.id, recipe]));
  return <div className="tp-slot-stack">{draft.edits.map((edit) => { const recipe = recipes.get(edit.recipeId); if (!recipe) return null; return <div className="tp-slot-row" key={edit.recipeId}><span>{choiceMap.get(edit.recipeId)?.label ?? recipe.label}</span>{recipe.slotKeys.map((slot) => <label key={slot}><small>{titleCase(slot.replace(/[-_]/g, ' '))}</small><input value={edit.slots[slot] ?? ''} placeholder={`Enter ${slot.replace(/[-_]/g, ' ')}`} onChange={(event) => submit(dispatch, { type: 'set-recipe-slot', recipeId: edit.recipeId, slot, value: event.target.value })} /></label>)}</div>; })}</div>;
}

function OverlayLayer({ children, reducedMotion, onClose }: { readonly children: ReactNode; readonly reducedMotion: boolean; readonly onClose: () => void }) {
  return <motion.div className="tp-overlay-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0.08 : 0.16 }} onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><motion.div className="tp-overlay-surface" initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: .99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: .99 }} transition={{ type: reducedMotion ? 'tween' : 'spring', stiffness: 420, damping: 34 }}>{children}</motion.div></motion.div>;
}

function PickerPanel({ kind, initialField = 'all', search, setSearch, draft, library, choiceMap, activeChoices, selectedIds, dispatch, onClose, onOpenLibrary }: { readonly kind: Exclude<PickerKind, null>; readonly initialField?: Field | 'all'; readonly search: string; readonly setSearch: (value: string) => void; readonly draft: CueDraft; readonly library: CueSurfaceProps['library']; readonly choiceMap: ReadonlyMap<string, LibraryChoiceView>; readonly activeChoices: readonly LibraryChoiceView[]; readonly selectedIds: ReadonlySet<string>; readonly dispatch: CueSurfaceProps['dispatch']; readonly onClose: () => void; readonly onOpenLibrary?: (recordId: string) => void }) {
  const scopedGroup = kind === 'group' && initialField !== 'all' ? groupForField(initialField) : undefined;
  const [selectedField, setSelectedField] = useState<Field | 'all'>(kind === 'group' ? 'all' : initialField);
  const mode = draft.id;
  const title = kind === 'preset' ? 'Choose a preset' : kind === 'recipes' ? 'Choose an edit operation' : kind === 'output' ? 'Output format' : kind === 'constraints' ? 'Important and avoid' : scopedGroup ? GROUPS.find((group) => group.key === scopedGroup)?.title ?? 'Choose a direction' : 'Choose a direction';
  const axes = kind === 'group' ? library.axes.filter((axis) => ['cam', 'angle', 'comp', 'light', 'look', 'mood'].includes(axis.field)).filter((axis) => !scopedGroup || groupForField(axis.field) === scopedGroup) : kind === 'constraints' ? library.axes.filter((axis) => axis.field === 'important' || axis.field === 'avoid') : kind === 'output' ? library.axes.filter((axis) => axis.field === 'output') : [];
  const filtered = activeChoices.filter((choice) => {
    if (kind === 'preset') return choice.kind === 'preset';
    if (kind === 'recipes') return choice.kind === 'edit-recipe';
    if (kind === 'group' || kind === 'constraints' || kind === 'output') return choice.axisId !== undefined && axes.some((axis) => axis.id === choice.axisId) && (selectedField === 'all' || choice.field === selectedField);
    return false;
  }).filter((choice) => `${choice.label} ${choice.summary} ${choice.shorthand} ${choice.aliases.join(' ')}`.toLowerCase().includes(search.trim().toLowerCase()));
  const groupedAxes = axes.filter((axis) => selectedField === 'all' || axis.field === selectedField).filter((axis) => filtered.some((choice) => choice.axisId === axis.id) || Boolean(draft.customText[axis.field]?.trim()));
  const showCards = kind === 'preset' || kind === 'recipes';
  return <div className="tp-picker" role="dialog" aria-modal="true" aria-labelledby="tp-picker-title">
    <header className="tp-picker-header"><h2 id="tp-picker-title">{title}</h2><button type="button" className="tp-icon-button" aria-label="Close picker" onClick={onClose}><X size={19} weight="bold" /></button></header>
    <label className="tp-search-box"><MagnifyingGlass size={17} weight="duotone" /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value.slice(0, 200))} placeholder="Search every option" aria-label="Search options" />{search && <button type="button" aria-label="Clear option search" onClick={() => setSearch('')}><X size={15} /></button>}</label>
    {(kind === 'group' || kind === 'constraints') && <div className="tp-field-tabs" role="tablist" aria-label="Picker fields"><button type="button" role="tab" aria-selected={selectedField === 'all'} className={selectedField === 'all' ? 'is-active' : ''} onClick={() => setSelectedField('all')}>All</button>{[...new Set(axes.map((axis) => axis.field))].map((field) => <button key={field} type="button" role="tab" aria-selected={selectedField === field} className={selectedField === field ? 'is-active' : ''} onClick={() => setSelectedField(field)}>{FIELD_LABELS[field]}</button>)}</div>}
    {showCards ? <div className="tp-choice-grid">{filtered.map((choice) => <button key={choice.id} type="button" className="tp-choice-card" aria-label={`Choose ${readableChoiceLabel(choice.label)}`} onClick={() => { submit(dispatch, choice.kind === 'preset' ? { type: 'apply-preset', presetId: choice.id } : { type: 'select-recipe', recipeId: choice.id }); onClose(); }}><span className="tp-choice-art" aria-hidden="true"><img src={artworkForChoice(choice, kind === 'recipes' ? 'finish' : 'optics')} alt="" /></span><span className="tp-choice-label">{readableChoiceLabel(choice.label)}</span></button>)}{filtered.length === 0 && <EmptySearch search={search} />}</div> : <div className="tp-axis-grid">{groupedAxes.map((axis) => <AxisSlot key={axis.id} axis={axis} draft={draft} choices={filtered.filter((choice) => choice.axisId === axis.id)} choiceMap={choiceMap} selectedIds={selectedIds} dispatch={dispatch} mode={mode} />)}{groupedAxes.length === 0 && <EmptySearch search={search} />}</div>}
    {onOpenLibrary && <button type="button" className="tp-picker-footer-link" onClick={() => onOpenLibrary(filtered[0]?.id ?? '')}>Open full Library</button>}
  </div>;
}

function AxisSlot({ axis, draft, choices, choiceMap, selectedIds, dispatch, mode }: { readonly axis: Axis; readonly draft: CueDraft; readonly choices: readonly LibraryChoiceView[]; readonly choiceMap: ReadonlyMap<string, LibraryChoiceView>; readonly selectedIds: ReadonlySet<string>; readonly dispatch: CueSurfaceProps['dispatch']; readonly mode: Mode }) {
  const current = getChoice(draft.choices, axis.id);
  const selected = new Set(current?.atomIds ?? []);
  const orderedChoices = [...choices].sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
  const moveSelection = (index: number) => {
    const choice = orderedChoices[index];
    if (!choice?.id) return;
    if (axis.cardinality === 'many') submit(dispatch, { type: 'toggle-atom', axisId: axis.id, atomId: choice.id });
    else submit(dispatch, { type: 'set-axis', axisId: axis.id, atomIds: [choice.id], pinnedBlank: false });
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.nativeEvent.isComposing) return;
    const currentIndex = Math.max(0, orderedChoices.findIndex((choice) => selected.has(choice.id)));
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { event.preventDefault(); moveSelection(Math.min(currentIndex + 1, orderedChoices.length - 1)); }
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); moveSelection(Math.max(currentIndex - 1, 0)); }
    if (event.key === 'Home') { event.preventDefault(); moveSelection(0); }
    if (event.key === 'End') { event.preventDefault(); moveSelection(orderedChoices.length - 1); }
  };
  return <section className="tp-axis-column"><div className="tp-axis-heading"><div><strong>{axis.label}</strong><small>{axis.cardinality === 'many' ? 'Select any' : 'Choose one'}</small></div>{selected.size > 0 && <span>{selected.size}</span>}</div><div className="tp-slot-list" role="listbox" tabIndex={0} aria-label={axis.label} aria-multiselectable={axis.cardinality === 'many'} onKeyDown={handleKeyDown}>{orderedChoices.map((choice) => { const isSelected = selected.has(choice.id); return <button key={choice.id} type="button" role="option" aria-selected={isSelected} className={isSelected ? 'tp-slot is-selected' : 'tp-slot'} onClick={() => moveSelection(orderedChoices.indexOf(choice))}><span className="tp-slot-thumb" aria-hidden="true"><span /></span><span className="tp-slot-label">{readableChoiceLabel(choice.label)}</span>{isSelected && <Check size={17} weight="bold" />}</button>; })}{orderedChoices.length === 0 && <EmptySearch search="" />}</div><label className="tp-custom-field"><span>Custom</span><input value={draft.customText[axis.field] ?? ''} placeholder="Add literal text" onChange={(event) => submit(dispatch, { type: 'set-custom-text', field: axis.field, text: event.target.value })} /></label><button type="button" className="tp-leave-blank" onClick={() => submit(dispatch, { type: 'clear-axis', axisId: axis.id, pinBlank: true })}>Leave blank</button></section>;
}

function PreviewPanel({ draft, preview, onChooseFormat, onCopy, copying, copied }: { readonly draft: CueDraft; readonly preview?: CueSurfaceProps['preview']; readonly onChooseFormat: (format: CopyFormat) => void; readonly onCopy: (format: CopyFormat) => void; readonly copying: boolean; readonly copied: boolean }) {
  const format = preview?.status === 'ready' ? preview.result.format : draft.outputFormat;
  const isReady = preview?.status === 'ready';
  const placeholderCount = isReady ? preview.result.placeholders.length : 0;
  const status = preview?.status === 'pending'
    ? 'Compiling the exact Cue output…'
    : preview?.status === 'error'
      ? preview.error.message
      : undefined;
  return <div className="tp-preview" aria-label="Prompt preview"><header className="tp-preview-header"><h2>Prompt preview</h2><div className="tp-preview-tools"><span>{isReady ? `${placeholderCount} placeholder${placeholderCount === 1 ? '' : 's'}` : status ?? 'Exact compiler output'}</span><div className="tp-segment" role="radiogroup" aria-label="Preview format">{(['expanded', 'shorthand'] as CopyFormat[]).map((value) => <button key={value} type="button" role="radio" aria-checked={format === value} className={format === value ? 'is-active' : ''} onClick={() => onChooseFormat(value)}><span>{titleCase(value)}</span><small>{value === 'expanded' ? 'Readable' : 'Compact'}</small></button>)}</div></div></header>{preview?.status === 'error' && <p className="tp-inline-error" role="alert">{preview.error.message}</p>}{isReady ? <pre className="tp-preview-copy-text" tabIndex={0}>{preview.result.text}</pre> : <div className="tp-preview-empty">{status ?? 'Open Preview to request the exact compiled text.'}</div>}<div className="tp-preview-footer"><small>Selectable text · exact output used by Copy</small><button type="button" className="tp-primary-action" disabled={copying || !isReady} onClick={() => onCopy(format)}>{copied ? <Check size={18} weight="bold" /> : <Copy size={18} weight="duotone" />}<span>{copied ? 'Copied' : 'Copy preview'}</span></button></div></div>;
}

function EmptySearch({ search }: { readonly search: string }) {
  return <div className="tp-empty-search"><MagnifyingGlass size={20} weight="duotone" /><strong>{search ? `No matches for “${search}”` : 'No mapped options yet'}</strong><span>Try another term or add literal Custom text.</span></div>;
}
