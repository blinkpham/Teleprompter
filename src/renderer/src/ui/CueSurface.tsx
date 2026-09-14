import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { Axis, AxisChoice, CopyFormat, CueCommand, CueDraft, Field, LibraryChoiceView, Mode } from '../../../shared/teleprompter';
import type { CueSurfaceProps } from '../../../shared/ui-types';
import { CREATE_OUTPUT_DEFAULT_TEXT } from '../../../shared/teleprompter';
import finishGroupUrl from '../assets/teleprompter/runtime/group-finish-v2.png';
import opticsGroupUrl from '../assets/teleprompter/runtime/group-optics-v2.png';
import stageGroupUrl from '../assets/teleprompter/runtime/group-stage-v2.png';
import { createCueLayoutRequest, cueAccessory, cueTransition, type CuePickerKind } from './cue-layout';
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
  SlidersHorizontal,
  Sparkle,
  Sun,
  X,
} from './icons';

export interface CueSurfaceExtraProps extends CueSurfaceProps {
  readonly onModeChange?: (mode: Mode) => void;
  readonly onOpenLibrary?: (recordId: string) => void;
}

type GroupKey = 'optics' | 'stage' | 'finish';

const GROUPS: readonly { readonly key: GroupKey; readonly title: string; readonly fields: readonly Field[] }[] = [
  { key: 'optics', title: 'Optics', fields: ['cam', 'angle'] },
  { key: 'stage', title: 'Stage', fields: ['comp', 'light'] },
  { key: 'finish', title: 'Finish', fields: ['look', 'mood'] },
];

const GROUP_ART: Readonly<Record<GroupKey, string>> = {
  optics: opticsGroupUrl,
  stage: stageGroupUrl,
  finish: finishGroupUrl,
};

const FIELD_LABELS: Readonly<Record<Field, string>> = {
  cam: 'Camera', angle: 'Viewpoint', comp: 'Composition', light: 'Lighting', look: 'Look', mood: 'Mood',
  important: 'Important', avoid: 'Avoid', output: 'Output',
};

const groupForField = (field: Field): GroupKey | undefined => GROUPS.find((group) => group.fields.includes(field))?.key;
const getChoice = (choices: readonly AxisChoice[], axisId: string): AxisChoice | undefined => choices.find((choice) => choice.axisId === axisId);
const titleCase = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);
const readableChoiceLabel = (value: string): string => {
  const raw = value.includes(':') ? value.slice(value.indexOf(':') + 1) : value;
  const special: Readonly<Record<string, string>> = {
    '3q': 'Three-quarter',
    highkey: 'High key',
    daybounce: 'Day bounce',
    cleanblue: 'Clean blue',
    lowhero: 'Low hero',
    wide35: 'Wide 35',
    natural50: 'Natural 50',
    portrait85: 'Portrait 85',
  };
  return special[raw] ?? raw.replace(/[-_]/g, ' ').replace(/([a-z])([0-9])/gi, '$1 $2').replace(/\b\w/g, (character) => character.toUpperCase());
};

function labelsForChoice(axis: Axis, draft: CueDraft, choiceMap: ReadonlyMap<string, LibraryChoiceView>): string[] {
  const choice = getChoice(draft.choices, axis.id);
  return choice?.atomIds.map((id) => readableChoiceLabel(choiceMap.get(id)?.label ?? id)) ?? [];
}

function groupSelection(group: typeof GROUPS[number], draft: CueDraft, library: CueSurfaceProps['library'], choiceMap: ReadonlyMap<string, LibraryChoiceView>): string[] {
  const axes = library.axes.filter((axis) => group.fields.includes(axis.field)).sort((a, b) => a.order - b.order);
  return axes.flatMap((axis) => labelsForChoice(axis, draft, choiceMap)).concat(
    group.fields.flatMap((field) => draft.customText[field]?.trim() ? [draft.customText[field]!.trim()] : []),
  );
}

function compactSummary(labels: readonly string[]): string {
  if (labels.length === 0) return 'Choose';
  if (labels.length === 1) return labels[0] ?? 'Choose';
  return `${labels[0]} +${labels.length - 1}`;
}

function submit(dispatch: CueSurfaceProps['dispatch'], command: CueCommand): void {
  void dispatch(command);
}

export function CueSurface({ surface, snapshot, library, dispatch, copy, preview, requestPreview, requestSurfaceLayout, dismiss, onModeChange, onOpenLibrary }: CueSurfaceExtraProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const draft = snapshot.drafts[snapshot.activeMode];
  const [picker, setPicker] = useState<CuePickerKind>(null);
  const [pickerField, setPickerField] = useState<Field | 'all'>('all');
  const [parametersOpen, setParametersOpen] = useState(surface !== 'spotlight');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [what, setWhat] = useState(draft.what);
  const surfaceRef = useRef<HTMLElement | null>(null);
  const whatRef = useRef<HTMLTextAreaElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const copyResetRef = useRef<number | undefined>(undefined);
  const pendingAuthoringRef = useRef<Promise<import('../../../shared/teleprompter').CommandResult>[]>([]);
  const sessionIdRef = useRef(`cue-${surface}-${Math.random().toString(36).slice(2, 10)}`);
  const layoutIdRef = useRef(0);
  const previousHeightRef = useRef<number | undefined>(undefined);
  const lastLayoutRef = useRef<string | undefined>(undefined);

  const choiceMap = useMemo(() => new Map(library.choices.map((choice) => [choice.id, choice])), [library.choices]);
  const activeChoices = useMemo(() => library.choices.filter((choice) => choice.status === 'active'), [library.choices]);

  useEffect(() => {
    if (whatRef.current?.matches(':focus')) return;
    setWhat(draft.what);
  }, [draft.what]);

  useEffect(() => {
    const element = whatRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(Math.max(element.scrollHeight, 96), 240)}px`;
  }, [what]);

  useEffect(() => () => {
    if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
    if (copyResetRef.current !== undefined) window.clearTimeout(copyResetRef.current);
  }, []);

  const trackDispatch = useCallback((command: CueCommand): Promise<import('../../../shared/teleprompter').CommandResult> => {
    const pending = dispatch(command);
    pendingAuthoringRef.current = [...pendingAuthoringRef.current, pending];
    const remove = () => {
      pendingAuthoringRef.current = pendingAuthoringRef.current.filter((item) => item !== pending);
    };
    pending.then(remove, remove);
    return pending;
  }, [dispatch]);

  const flushAuthoring = useCallback(async (): Promise<boolean> => {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    const pending = [...pendingAuthoringRef.current];
    if (pending.length > 0) {
      const results = await Promise.all(pending);
      const failure = results.find((result) => !result.ok);
      if (failure && !failure.ok) {
        setCopyError(failure.error.message);
        return false;
      }
    }
    if (what !== draft.what) {
      const result = await trackDispatch({ type: 'set-what', text: what });
      if (!result.ok) {
        setCopyError(result.error.message);
        return false;
      }
    }
    return true;
  }, [draft.what, trackDispatch, what]);

  const measureSurface = useCallback(() => {
    if (surface !== 'spotlight' || !requestSurfaceLayout) return;
    const element = surfaceRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const width = Math.max(rect.width, element.scrollWidth);
    const height = Math.max(rect.height, element.scrollHeight);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;
    const accessory = cueAccessory(picker, previewOpen);
    const measuredWidth = Math.round(width);
    const measuredHeight = Math.round(height);
    const signature = `${measuredWidth}:${measuredHeight}:${accessory}`;
    if (lastLayoutRef.current === signature) return;
    lastLayoutRef.current = signature;
    const request = createCueLayoutRequest(
      sessionIdRef.current,
      ++layoutIdRef.current,
      { width, height },
      accessory,
      cueTransition(previousHeightRef.current, height),
    );
    previousHeightRef.current = height;
    void requestSurfaceLayout(request).catch(() => undefined);
  }, [picker, previewOpen, requestSurfaceLayout, surface]);

  useEffect(() => {
    if (surface !== 'spotlight' || !requestSurfaceLayout) return undefined;
    const element = surfaceRef.current;
    if (!element) return undefined;
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measureSurface);
    observer?.observe(element);
    measureSurface();
    return () => observer?.disconnect();
  }, [draft.revision, measureSurface, parametersOpen, requestSurfaceLayout, surface, what.length]);

  useEffect(() => {
    if (!picker && !previewOpen) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      if (surfaceRef.current?.contains(event.target as Node)) return;
      closeAccessory();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [picker, previewOpen]);

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
    if (surface !== 'spotlight' && !picker && !previewOpen && !parametersOpen) return undefined;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.isComposing || event.key !== 'Escape') return;
      if (search) {
        setSearch('');
        event.preventDefault();
        return;
      }
      const hadAccessory = Boolean(picker || previewOpen || parametersOpen);
      setPicker(null);
      setPreviewOpen(false);
      setParametersOpen(surface !== 'spotlight');
      event.preventDefault();
      if (surface === 'spotlight' && !hadAccessory) {
        dismiss?.();
        return;
      }
      window.setTimeout(() => openerRef.current?.focus(), reducedMotion ? 0 : 160);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dismiss, parametersOpen, picker, previewOpen, reducedMotion, search, surface]);

  useEffect(() => {
    const focusSearch = () => {
      setPreviewOpen(false);
      setParametersOpen(true);
      setSearch('');
      setPicker('group');
    };
    window.addEventListener('teleprompter:focus-search', focusSearch);
    return () => window.removeEventListener('teleprompter:focus-search', focusSearch);
  }, []);

  const updateWhat = (value: string, immediate = false) => {
    setWhat(value);
    if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
    if (immediate) {
      timerRef.current = undefined;
      void trackDispatch({ type: 'set-what', text: value });
    } else {
      timerRef.current = window.setTimeout(() => {
        timerRef.current = undefined;
        void trackDispatch({ type: 'set-what', text: value });
      }, 120);
    }
  };

  const closeAccessory = () => {
    setPicker(null);
    setPreviewOpen(false);
    setParametersOpen(surface !== 'spotlight');
    window.setTimeout(() => openerRef.current?.focus(), reducedMotion ? 0 : 160);
  };

  const copyDraft = async (format: CopyFormat = draft.outputFormat) => {
    if (copying) return;
    setCopying(true);
    setCopyError(null);
    if (!(await flushAuthoring())) {
      setCopying(false);
      return;
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

  const openPicker = (kind: CuePickerKind, opener: HTMLButtonElement, field: Field | 'all' = 'all') => {
    openerRef.current = opener;
    setSearch('');
    setPickerField(field);
    setParametersOpen(true);
    setPreviewOpen(false);
    setPicker(kind);
  };

  const togglePreview = async () => {
    if (previewOpen) {
      closeAccessory();
      return;
    }
    if (!(await flushAuthoring())) return;
    setPicker(null);
    setParametersOpen(false);
    setPreviewOpen(true);
  };

  const handleMode = async (mode: Mode) => {
    if (mode === snapshot.activeMode) return;
    if (!(await flushAuthoring())) return;
    onModeChange?.(mode);
  };

  const fieldAxes = (fields: readonly Field[]) => library.axes.filter((axis) => fields.includes(axis.field)).sort((a, b) => a.order - b.order);
  const showParameterOverview = surface !== 'spotlight' || parametersOpen;

  return (
    <section ref={surfaceRef} className={surface === 'spotlight' ? 'tp-cue tp-cue--spotlight' : 'tp-cue'} aria-labelledby="tp-cue-title">
      <div className="tp-cue-header">
        <h1 id="tp-cue-title" className="sr-only">Build a cue</h1>
        <div className="tp-header-actions">
          <button type="button" className="tp-icon-button" aria-label="Reset current draft" data-tooltip="Reset draft" onClick={() => submit(trackDispatch, { type: 'reset-draft' })}><ArrowsClockwise size={19} weight="duotone" /></button>
          {surface === 'spotlight' && <button type="button" className="tp-icon-button" aria-label="Hide Cue" data-tooltip="Hide Cue" onClick={dismiss}><X size={19} weight="duotone" /></button>}
        </div>
      </div>

      <div className="tp-mode-row" role="tablist" aria-label="Cue mode">
        {(['create', 'edit'] as Mode[]).map((mode) => <button key={mode} type="button" role="tab" aria-selected={snapshot.activeMode === mode} className={snapshot.activeMode === mode ? 'tp-mode-tab is-active' : 'tp-mode-tab'} onClick={() => void handleMode(mode)}>{titleCase(mode)}</button>)}
        <button type="button" className="tp-preset-trigger" aria-haspopup="dialog" aria-expanded={picker === 'preset'} onClick={(event) => openPicker('preset', event.currentTarget)}><Sparkle size={16} weight="duotone" />{draft.activePresetId ? readableChoiceLabel(choiceMap.get(draft.activePresetId)?.label ?? 'Preset') : 'Preset'}<DotsThree size={17} weight="bold" /></button>
      </div>

      {snapshot.activeMode === 'edit' && <EditRecipeBar draft={draft} library={library} choiceMap={choiceMap} dispatch={trackDispatch} onOpen={(event) => openPicker('recipes', event.currentTarget)} />}

      <LayoutGroup id={`tp-cue-${surface}`}>
        {showParameterOverview && <motion.div className="tp-parameter-grid" layout transition={{ type: 'spring', stiffness: 380, damping: 34 }}>
          {GROUPS.map((group) => <ParameterTile key={group.key} group={group} draft={draft} library={library} choiceMap={choiceMap} isOpen={picker === 'group' && groupForField(pickerField) === group.key} onOpen={(event) => openPicker('group', event.currentTarget, group.fields[0])} />)}
        </motion.div>}
        <motion.div className="tp-composer-surface" layout transition={{ type: 'spring', stiffness: 330, damping: 30, mass: 1 }}>
          <div className="tp-composer-glow" aria-hidden="true" />
          <label className="tp-what-label" htmlFor={`tp-what-${surface}`}>What</label>
          <textarea ref={whatRef} id={`tp-what-${surface}`} className="tp-what-input" value={what} onChange={(event) => updateWhat(event.target.value.slice(0, 10000))} onBlur={() => updateWhat(what, true)} rows={2} placeholder={snapshot.activeMode === 'edit' ? 'Describe any other changes…' : 'Describe the subject, action, and scene…'} />
          {snapshot.activeMode === 'edit' && <EditSlots draft={draft} library={library} choiceMap={choiceMap} dispatch={trackDispatch} />}
        </motion.div>
      </LayoutGroup>

      <AnimatePresence initial={false} mode="wait">
        {picker && <AccessoryLayer key={`picker-${picker}-${pickerField}`} reducedMotion={reducedMotion}><PickerPanel kind={picker} initialField={pickerField} search={search} setSearch={setSearch} draft={draft} library={library} choiceMap={choiceMap} activeChoices={activeChoices} dispatch={trackDispatch} onClose={closeAccessory} onOpenLibrary={onOpenLibrary} /></AccessoryLayer>}
        {previewOpen && <AccessoryLayer key="preview" reducedMotion={reducedMotion}><PreviewPanel draft={draft} preview={preview} onChooseFormat={(format) => submit(trackDispatch, { type: 'choose-format', format })} onCopy={(format) => void copyDraft(format)} onClose={closeAccessory} copying={copying} copied={copied} /></AccessoryLayer>}
      </AnimatePresence>

      <div className="tp-cue-controls">
        <div className="tp-control-cluster">
          {surface === 'spotlight' && !previewOpen && <button type="button" className="tp-pill-control tp-parameters-trigger" aria-expanded={parametersOpen} onClick={() => setParametersOpen((open) => !open)}><SlidersHorizontal size={16} weight="duotone" /><span>{parametersOpen ? 'Hide parameters' : 'Parameters'}</span></button>}
          {(() => { const count = countFieldAtoms(draft, library.axes, 'important'); return <button type="button" className="tp-pill-control" aria-haspopup="dialog" aria-expanded={picker === 'constraints' && pickerField === 'important'} onClick={(event) => openPicker('constraints', event.currentTarget, 'important')}><Plus size={16} weight="bold" /><span>Important</span>{count > 0 && <small>{count}</small>}</button>; })()}
          {(() => { const count = countFieldAtoms(draft, library.axes, 'avoid'); return <button type="button" className="tp-pill-control" aria-haspopup="dialog" aria-expanded={picker === 'constraints' && pickerField === 'avoid'} onClick={(event) => openPicker('constraints', event.currentTarget, 'avoid')}><Funnel size={16} weight="duotone" /><span>Avoid</span>{count > 0 && <small>{count}</small>}</button>; })()}
          <button type="button" className="tp-pill-control tp-output-control" aria-haspopup="dialog" aria-expanded={picker === 'output'} onClick={(event) => openPicker('output', event.currentTarget)}><span>Output</span><small>{outputSummary(draft, library, choiceMap)}</small></button>
        </div>
        <div className="tp-action-cluster">
          <button type="button" className="tp-secondary-action tp-preview-action" aria-label={previewOpen ? 'Close preview' : 'Preview prompt'} aria-expanded={previewOpen} data-tooltip={previewOpen ? 'Close preview' : 'Preview prompt'} onClick={() => void togglePreview()}>{previewOpen ? <X size={18} weight="bold" /> : <CornersOut size={18} weight="duotone" />}</button>
          {!previewOpen && <button type="button" className="tp-primary-action tp-copy-action" aria-label="Copy prompt" disabled={copying} onClick={() => void copyDraft()}>{copying ? <CircleNotch className="tp-spin" size={19} /> : copied ? <Check size={19} weight="bold" /> : <Copy size={19} weight="duotone" />}</button>}
        </div>
      </div>
      {copyError && <p className="tp-inline-error" role="alert">{copyError}</p>}
    </section>
  );
}

function countFieldAtoms(draft: CueDraft, axes: readonly Axis[], field: Field): number {
  const ids = new Set(axes.filter((axis) => axis.field === field).map((axis) => axis.id));
  return draft.choices.filter((choice) => ids.has(choice.axisId)).reduce((total, choice) => total + choice.atomIds.length, 0);
}

function outputSummary(draft: CueDraft, library: CueSurfaceProps['library'], choiceMap: ReadonlyMap<string, LibraryChoiceView>): string {
  const custom = draft.customText.output?.trim();
  if (custom === CREATE_OUTPUT_DEFAULT_TEXT) return '4:5 · 2K';
  if (custom) return custom;
  const values = library.axes.filter((axis) => axis.field === 'output').flatMap((axis) => labelsForChoice(axis, draft, choiceMap));
  return values.length > 0 ? values.join(' · ') : 'Output';
}

function ParameterTile({ group, draft, library, choiceMap, isOpen, onOpen }: { readonly group: typeof GROUPS[number]; readonly draft: CueDraft; readonly library: CueSurfaceProps['library']; readonly choiceMap: ReadonlyMap<string, LibraryChoiceView>; readonly isOpen: boolean; readonly onOpen: (event: import('react').MouseEvent<HTMLButtonElement>) => void }) {
  const values = groupSelection(group, draft, library, choiceMap);
  const description = values.length > 0 ? `${group.title}: ${values.join(', ')}` : `${group.title}: ${group.fields.map((field) => FIELD_LABELS[field]).join(', ')}`;
  const descriptionId = `tp-${group.key}-description`;
  return <motion.button type="button" className={`tp-parameter-tile${values.length > 0 ? ' is-configured' : ''}${isOpen ? ' is-open' : ''}`} layoutId={`tp-tile-${group.key}`} onClick={onOpen} aria-haspopup="dialog" aria-expanded={isOpen} aria-describedby={descriptionId} aria-label={`Choose ${group.title}`} data-tooltip={description} title={description}>
    <span className={`tp-tile-object tp-tile-object--${group.key}`} aria-hidden="true"><img src={GROUP_ART[group.key]} alt="" /></span>
    <span className="tp-tile-copy"><strong>{group.title}</strong></span>
    {values.length > 0 && <Check className="tp-configured-check" size={16} weight="bold" aria-hidden="true" />}
    <span id={descriptionId} className="sr-only">{description}</span>
  </motion.button>;
}

function EditRecipeBar({ draft, library, choiceMap, dispatch, onOpen }: { readonly draft: CueDraft; readonly library: CueSurfaceProps['library']; readonly choiceMap: ReadonlyMap<string, LibraryChoiceView>; readonly dispatch: CueSurfaceProps['dispatch']; readonly onOpen: (event: import('react').MouseEvent<HTMLButtonElement>) => void }) {
  return <div className="tp-edit-bar"><div className="tp-edit-bar-heading"><span>Change operations</span><small>{draft.edits.length ? `${draft.edits.length} selected` : 'Choose an operation'}</small></div><div className="tp-chip-row">{draft.edits.map((edit) => <button key={edit.recipeId} type="button" className="tp-chip is-selected" onClick={() => submit(dispatch, { type: 'remove-recipe', recipeId: edit.recipeId })}>{choiceMap.get(edit.recipeId)?.label ?? library.editRecipes.find((recipe) => recipe.id === edit.recipeId)?.label ?? edit.recipeId}<X size={14} weight="bold" /></button>)}<button type="button" className="tp-add-chip" onClick={onOpen} disabled={library.editRecipes.length === 0}><Plus size={15} weight="bold" />Add operation</button></div></div>;
}

function EditSlots({ draft, library, choiceMap, dispatch }: { readonly draft: CueDraft; readonly library: CueSurfaceProps['library']; readonly choiceMap: ReadonlyMap<string, LibraryChoiceView>; readonly dispatch: CueSurfaceProps['dispatch'] }) {
  const recipes = new Map(library.editRecipes.map((recipe) => [recipe.id, recipe]));
  return <div className="tp-slot-stack">{draft.edits.map((edit) => { const recipe = recipes.get(edit.recipeId); if (!recipe) return null; return <div className="tp-slot-row" key={edit.recipeId}><span>{choiceMap.get(edit.recipeId)?.label ?? recipe.label}</span>{recipe.slotKeys.map((slot) => <label key={slot}><small>{titleCase(slot.replace(/[-_]/g, ' '))}</small><input value={edit.slots[slot] ?? ''} placeholder={`Enter ${slot.replace(/[-_]/g, ' ')}`} onChange={(event) => submit(dispatch, { type: 'set-recipe-slot', recipeId: edit.recipeId, slot, value: event.target.value })} /></label>)}</div>; })}</div>;
}

function AccessoryLayer({ children, reducedMotion }: { readonly children: ReactNode; readonly reducedMotion: boolean }) {
  return <motion.div className="tp-accessory" initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }} transition={{ duration: reducedMotion ? .08 : .18, ease: [0.2, 0, 0, 1] }}>{children}</motion.div>;
}

function PickerPanel({ kind, initialField = 'all', search, setSearch, draft, library, choiceMap, activeChoices, dispatch, onClose, onOpenLibrary }: { readonly kind: Exclude<CuePickerKind, null>; readonly initialField?: Field | 'all'; readonly search: string; readonly setSearch: (value: string) => void; readonly draft: CueDraft; readonly library: CueSurfaceProps['library']; readonly choiceMap: ReadonlyMap<string, LibraryChoiceView>; readonly activeChoices: readonly LibraryChoiceView[]; readonly dispatch: CueSurfaceProps['dispatch']; readonly onClose: () => void; readonly onOpenLibrary?: (recordId: string) => void }) {
  const scopedGroup = kind === 'group' && initialField !== 'all' ? groupForField(initialField) : undefined;
  const axes = kind === 'group' ? library.axes.filter((axis) => ['cam', 'angle', 'comp', 'light', 'look', 'mood'].includes(axis.field)).filter((axis) => !scopedGroup || groupForField(axis.field) === scopedGroup).sort((a, b) => a.order - b.order)
    : kind === 'constraints' ? library.axes.filter((axis) => axis.field === 'important' || axis.field === 'avoid').sort((a, b) => a.order - b.order)
      : kind === 'output' ? library.axes.filter((axis) => axis.field === 'output').sort((a, b) => a.order - b.order) : [];
  const defaultField = initialField !== 'all' ? initialField : axes[0]?.field ?? 'all';
  const [selectedField, setSelectedField] = useState<Field | 'all'>(defaultField);

  useEffect(() => setSelectedField(defaultField), [defaultField]);

  const title = kind === 'preset' ? 'Presets' : kind === 'recipes' ? 'Edit operations' : kind === 'output' ? 'Output' : kind === 'constraints' ? 'Constraints' : GROUPS.find((group) => group.key === scopedGroup)?.title ?? 'Parameters';
  const filtered = activeChoices.filter((choice) => {
    if (kind === 'preset') return choice.kind === 'preset';
    if (kind === 'recipes') return choice.kind === 'edit-recipe';
    return choice.axisId !== undefined && axes.some((axis) => axis.id === choice.axisId) && (selectedField === 'all' || choice.field === selectedField);
  }).filter((choice) => `${choice.label} ${choice.summary} ${choice.shorthand} ${choice.aliases.join(' ')}`.toLowerCase().includes(search.trim().toLowerCase()));
  const activeAxis = axes.find((axis) => axis.field === selectedField) ?? axes[0];
  const axisChoices = activeAxis ? filtered.filter((choice) => choice.axisId === activeAxis.id) : [];
  const showCards = kind === 'preset' || kind === 'recipes';
  const group = scopedGroup ? GROUPS.find((item) => item.key === scopedGroup) : undefined;

  return <section className="tp-picker" role="dialog" aria-modal="false" aria-labelledby="tp-picker-title">
    <header className="tp-picker-header"><div><h2 id="tp-picker-title">{title}</h2>{group && <span className="tp-picker-context">{group.fields.map((field) => FIELD_LABELS[field]).join(' · ')}</span>}</div><button type="button" className="tp-icon-button" aria-label={`Close ${title}`} data-tooltip="Close" onClick={onClose}><X size={19} weight="bold" /></button></header>
    <label className="tp-search-box"><MagnifyingGlass size={17} weight="duotone" aria-hidden="true" /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value.slice(0, 200))} placeholder="Search options" aria-label={`Search ${title}`} />{search && <button type="button" aria-label="Clear option search" onClick={() => setSearch('')}><X size={15} /></button>}</label>
    {group && <div className="tp-picker-focus" aria-hidden="true"><span className="tp-picker-focus-art"><img src={GROUP_ART[group.key]} alt="" /></span><span><strong>{group.title}</strong><small>{activeAxis?.label ?? 'Parameters'}</small></span></div>}
    {(kind === 'group' || kind === 'constraints') && <div className="tp-axis-tabs" role="tablist" aria-label={`${title} fields`}>{axes.map((axis) => <button key={axis.id} type="button" role="tab" aria-selected={selectedField === axis.field} className={selectedField === axis.field ? 'is-active' : ''} onClick={() => setSelectedField(axis.field)}>{axis.label}</button>)}</div>}
    {showCards ? <div className="tp-choice-grid">{filtered.map((choice) => <button key={choice.id} type="button" className="tp-choice-card" aria-label={`Choose ${readableChoiceLabel(choice.label)}`} onClick={() => { submit(dispatch, choice.kind === 'preset' ? { type: 'apply-preset', presetId: choice.id } : { type: 'select-recipe', recipeId: choice.id }); onClose(); }}><span className="tp-choice-glyph" aria-hidden="true"><FieldGlyph field={choice.field} /></span><span className="tp-choice-label">{readableChoiceLabel(choice.label)}</span><small>{choice.summary}</small></button>)}{filtered.length === 0 && <EmptySearch search={search} />}</div> : activeAxis ? <AxisSlot axis={activeAxis} draft={draft} choices={axisChoices} dispatch={dispatch} /> : <EmptySearch search={search} />}
    {onOpenLibrary && filtered[0] && <button type="button" className="tp-picker-footer-link" onClick={() => onOpenLibrary(filtered[0]!.id)}>Open full Library</button>}
  </section>;
}

function FieldGlyph({ field }: { readonly field?: Field }) {
  if (field === 'light') return <Sun size={22} weight="duotone" />;
  if (field === 'comp') return <CornersOut size={22} weight="duotone" />;
  if (field === 'look' || field === 'mood') return <Sparkle size={22} weight="duotone" />;
  return <MagnifyingGlass size={22} weight="duotone" />;
}

function AxisSlot({ axis, draft, choices, dispatch }: { readonly axis: Axis; readonly draft: CueDraft; readonly choices: readonly LibraryChoiceView[]; readonly dispatch: CueSurfaceProps['dispatch'] }) {
  const current = getChoice(draft.choices, axis.id);
  const selected = new Set(current?.atomIds ?? []);
  const orderedChoices = [...choices].sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
  const [highlightedId, setHighlightedId] = useState<string | null>(current?.atomIds[0] ?? orderedChoices[0]?.id ?? null);
  const customRef = useRef<HTMLInputElement>(null);
  const [customValue, setCustomValue] = useState(draft.customText[axis.field] ?? '');

  useEffect(() => {
    setHighlightedId(current?.atomIds[0] ?? orderedChoices[0]?.id ?? null);
  }, [axis.id, current?.atomIds, orderedChoices]);
  useEffect(() => {
    if (document.activeElement !== customRef.current) setCustomValue(draft.customText[axis.field] ?? '');
  }, [axis.field, draft.customText]);

  const highlightedIndex = Math.max(0, orderedChoices.findIndex((choice) => choice.id === highlightedId));
  const moveHighlight = (index: number) => {
    const choice = orderedChoices[Math.max(0, Math.min(index, orderedChoices.length - 1))];
    if (choice) setHighlightedId(choice.id);
  };
  const commit = (choice: LibraryChoiceView) => {
    if (axis.cardinality === 'many') submit(dispatch, { type: 'toggle-atom', axisId: axis.id, atomId: choice.id });
    else submit(dispatch, { type: 'set-axis', axisId: axis.id, atomIds: [choice.id], pinnedBlank: false });
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { event.preventDefault(); moveHighlight(highlightedIndex + 1); }
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); moveHighlight(highlightedIndex - 1); }
    else if (event.key === 'Home') { event.preventDefault(); moveHighlight(0); }
    else if (event.key === 'End') { event.preventDefault(); moveHighlight(orderedChoices.length - 1); }
    else if (event.key === 'Enter' && highlightedId) { event.preventDefault(); const choice = orderedChoices.find((item) => item.id === highlightedId); if (choice) commit(choice); }
  };
  const clearAxis = () => submit(dispatch, { type: 'clear-axis', axisId: axis.id, pinBlank: true });

  return <section className="tp-axis-panel"><header className="tp-axis-heading"><div><strong>{axis.label}</strong><small>{axis.cardinality === 'many' ? 'Select any' : 'Choose one'}</small></div>{(selected.size > 0 || customValue.trim()) && <button type="button" className="tp-axis-clear" aria-label={`Clear ${axis.label}`} data-tooltip={`Clear ${axis.label}`} onClick={clearAxis}><X size={15} weight="bold" /></button>}</header><div className="tp-slot-list" role="listbox" tabIndex={0} aria-label={axis.label} aria-multiselectable={axis.cardinality === 'many'} aria-activedescendant={highlightedId ? `tp-option-${highlightedId}` : undefined} onKeyDown={handleKeyDown}>{orderedChoices.map((choice) => { const isSelected = selected.has(choice.id); const isHighlighted = highlightedId === choice.id; return <button id={`tp-option-${choice.id}`} key={choice.id} type="button" role="option" aria-selected={isSelected} className={`tp-slot${isSelected ? ' is-selected' : ''}${isHighlighted ? ' is-highlighted' : ''}`} title={choice.summary} onMouseEnter={() => setHighlightedId(choice.id)} onClick={() => commit(choice)}><span className="tp-slot-thumb" aria-hidden="true"><FieldGlyph field={choice.field} /></span><span className="tp-slot-copy"><strong>{readableChoiceLabel(choice.label)}</strong><small>{choice.summary}</small></span>{isSelected && <Check size={17} weight="bold" aria-hidden="true" />}</button>; })}{orderedChoices.length === 0 && <EmptySearch search="" />}</div><label className="tp-custom-field"><span className="sr-only">Custom {FIELD_LABELS[axis.field]}</span><span className="tp-custom-input"><input ref={customRef} value={customValue} aria-label={`Custom ${FIELD_LABELS[axis.field]}`} placeholder="Add custom directions, or leave blank" onChange={(event) => { const value = event.target.value; setCustomValue(value); void dispatch({ type: 'set-custom-text', field: axis.field, text: value }); }} />{customValue && <button type="button" aria-label={`Clear custom ${FIELD_LABELS[axis.field]}`} onClick={() => { setCustomValue(''); void dispatch({ type: 'set-custom-text', field: axis.field, text: '' }); }}><X size={15} weight="bold" /></button>}</span></label></section>;
}

function PreviewPanel({ draft, preview, onChooseFormat, onCopy, onClose, copying, copied }: { readonly draft: CueDraft; readonly preview?: CueSurfaceProps['preview']; readonly onChooseFormat: (format: CopyFormat) => void; readonly onCopy: (format: CopyFormat) => void; readonly onClose: () => void; readonly copying: boolean; readonly copied: boolean }) {
  const format = preview?.status === 'ready' ? preview.result.format : draft.outputFormat;
  const isReady = preview?.status === 'ready';
  const status = preview?.status === 'pending' ? 'Updating preview…' : preview?.status === 'error' ? preview.error.message : 'Open Preview to compile the exact output.';
  return <section className="tp-preview" role="dialog" aria-modal="false" aria-labelledby="tp-preview-title"><header className="tp-preview-header"><h2 id="tp-preview-title" className="sr-only">Prompt preview</h2><div className="tp-preview-tools"><div className="tp-segment" role="radiogroup" aria-label="Preview format">{(['expanded', 'shorthand'] as CopyFormat[]).map((value) => <button key={value} type="button" role="radio" aria-checked={format === value} className={format === value ? 'is-active' : ''} onClick={() => onChooseFormat(value)}>{titleCase(value)}</button>)}</div><button type="button" className="tp-icon-button" aria-label="Close preview" data-tooltip="Close preview" onClick={onClose}><X size={18} weight="bold" /></button></div></header>{preview?.status === 'error' && <p className="tp-inline-error" role="alert">{preview.error.message}</p>}{isReady ? <pre className="tp-preview-copy-text" tabIndex={0}>{preview.result.text}</pre> : <div className="tp-preview-empty" role="status">{status}</div>}<footer className="tp-preview-footer"><span className="sr-only">The visible text is the exact compiler output used by Copy.</span><button type="button" className="tp-primary-action tp-copy-action" aria-label="Copy preview" disabled={copying || !isReady} onClick={() => onCopy(format)}>{copied ? <Check size={18} weight="bold" /> : <Copy size={18} weight="duotone" />}</button></footer></section>;
}

function EmptySearch({ search }: { readonly search: string }) {
  return <div className="tp-empty-search"><MagnifyingGlass size={20} weight="duotone" /><strong>{search ? `No matches for “${search}”` : 'No mapped options yet'}</strong><span>Try another term or add literal custom text.</span></div>;
}
