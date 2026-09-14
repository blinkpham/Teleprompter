import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type {
  BridgeResult,
  ChooseReferenceImageResult,
  CommandResult,
  CopyFormat,
  CopyResult,
  CueCommand,
  CueSnapshot,
  DraftFieldPath,
  DraftCommandEnvelope,
  LibraryChoiceView,
  LibraryCopyTextRequest,
  LibraryTextResult,
  PreviewIntent,
  PreviewRequest,
  Mode,
  SettingsState,
  SurfaceLayoutRequest,
  SurfaceLayoutResult,
  ReferenceBinding,
  ReferenceBindingsSnapshot,
  ReferenceThumbnailResult,
  View,
} from '../../../shared/teleprompter';
import type { PreviewPresentation } from '../../../shared/ui-types';
import type { ReferenceSurfaceProps } from '../../../shared/ui-types';
import { CueSurface } from '../ui/CueSurface';
import { LibrarySurface } from '../ui/LibrarySurface';
import { TeleprompterShell } from '../ui/TeleprompterShell';
import { TokensSurface } from '../ui/TokensSurface';

type Surface = 'main' | 'spotlight';

interface AppState {
  readonly snapshot: CueSnapshot;
  readonly library: import('../../../shared/teleprompter').LibraryView;
  readonly platform: 'darwin' | 'win32' | 'linux';
  readonly appVersion: string;
}

const surfaceFromLocation = (): Surface => new URLSearchParams(window.location.search).get('surface') === 'spotlight' ? 'spotlight' : 'main';

const commandId = (): string => globalThis.crypto?.randomUUID?.() ?? `command-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const settingsFromSnapshot = (snapshot: CueSnapshot, saveState: SettingsState['saveState'] = 'idle', error?: string): SettingsState => ({
  shortcut: snapshot.shortcut,
  persistenceStatus: snapshot.persistenceStatus,
  saveState,
  ...(error ? { error } : {}),
});

const unavailableBridgeError = <T extends object>(message: string): BridgeResult<T> => ({
  ok: false,
  error: { code: 'UNAVAILABLE', message },
});

const pathsForCommand = (command: CueCommand, state: AppState): readonly DraftFieldPath[] => {
  switch (command.type) {
    case 'accept-quick-add': {
      const draft = state.snapshot.drafts[state.snapshot.activeMode];
      const target = command.acceptance.target;
      if (target.kind === 'reference' || target.kind === 'snippet') return ['what'];
      if (target.kind === 'token') {
        const atom = state.library.choices.find((choice) => choice.kind === 'atom' && choice.id === target.recordId);
        return ['what', ...(atom?.axisId ? [`axis:${atom.axisId}` as DraftFieldPath] : [])];
      }
      if (target.kind === 'edit') return ['what', `recipe:${target.recordId}`];
      const preset = state.library.presets.find((item) => item.id === target.recordId);
      const previousPresetAxes = draft.choices.filter((choice) => choice.source === 'preset' && choice.presetId === draft.activePresetId).map((choice) => choice.axisId);
      return ['what', 'preset', ...[...new Set([...(preset?.scopeAxisIds ?? []), ...previousPresetAxes])].map((axisId) => `axis:${axisId}` as DraftFieldPath)];
    }
    case 'set-what': return ['what'];
    case 'set-custom-text': return [`custom:${command.field}`];
    case 'set-axis':
    case 'clear-axis':
    case 'toggle-atom': return [`axis:${command.axisId}`, 'preset'];
    case 'apply-preset':
    case 'reset-to-preset': {
      const draft = state.snapshot.drafts[state.snapshot.activeMode];
      const preset = state.library.presets.find((item) => item.id === command.presetId);
      const previousPresetAxes = draft.choices.filter((choice) => choice.source === 'preset' && choice.presetId === draft.activePresetId).map((choice) => choice.axisId);
      return ['preset', ...[...new Set([...(preset?.scopeAxisIds ?? []), ...previousPresetAxes])].map((axisId) => `axis:${axisId}` as DraftFieldPath)];
    }
    case 'select-recipe':
    case 'remove-recipe':
    case 'set-recipe-slot': return [`recipe:${command.recipeId}`];
    case 'set-reference-roles': return ['references'];
    case 'set-manual-unlocks': return ['manualUnlocks'];
    case 'choose-format': return ['format'];
    case 'reset-draft':
    case 'undo-draft': return ['draft'];
  }
};

export function TeleprompterApp() {
  const surface = useMemo(surfaceFromLocation, []);
  const [state, setState] = useState<AppState | null>(null);
  const [activeMode, setActiveMode] = useState<Mode>('create');
  const activeModeRef = useRef<Mode>('create');
  const snapshotRef = useRef<CueSnapshot | null>(null);
  const [view, setView] = useState<View>('cue');
  const [favoriteIds, setFavoriteIds] = useState<ReadonlySet<string>>(new Set());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewPresentation>({ status: 'idle' });
  const previewRequestSequence = useRef(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutDraft, setShortcutDraft] = useState('');
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [referenceBindings, setReferenceBindings] = useState<ReferenceBindingsSnapshot | null>(null);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [referenceError, setReferenceError] = useState<string | undefined>(undefined);
  const referenceRequestSequence = useRef(0);

  const adoptSnapshot = useCallback((snapshot: CueSnapshot) => {
    previewRequestSequence.current += 1;
    setPreview({ status: 'idle' });
    const mode = activeModeRef.current;
    const adopted = { ...snapshot, activeMode: mode };
    snapshotRef.current = adopted;
    setState((current) => current ? { ...current, snapshot: adopted } : current);
    setSettings((current) => current ? { ...current, shortcut: adopted.shortcut, persistenceStatus: adopted.persistenceStatus } : current);
  }, []);

  useEffect(() => {
    let mounted = true;
    const bridge = window.teleprompter;
    if (!bridge) {
      setFeedback('Open the desktop app to use the local Cue engine.');
      return () => { mounted = false; };
    }
    void bridge.getBootstrap().then((result) => {
      if (!mounted) return;
      if (!result.ok) {
        setFeedback(result.error.message);
        return;
      }
      activeModeRef.current = result.snapshot.activeMode;
      setActiveMode(result.snapshot.activeMode);
      snapshotRef.current = result.snapshot;
      setState({
        snapshot: result.snapshot,
        library: result.library,
        platform: result.platform,
        appVersion: result.appVersion,
      });
      setSettings(settingsFromSnapshot(result.snapshot));
      setShortcutDraft(result.snapshot.shortcut.accelerator);
    });
    const unsubscribeDraft = bridge.onDraftChanged((event) => {
      if (mounted) adoptSnapshot(event.snapshot);
    });
    const unsubscribeCommand = bridge.onCommand((command) => {
      if (!mounted) return;
      if (command.type === 'navigate') setView(command.view);
      if (command.type === 'focus-search') {
        setView(command.view);
        window.dispatchEvent(new CustomEvent('teleprompter:focus-search'));
      }
      if (command.type === 'hide-spotlight' && surface === 'spotlight') void bridge.hideSpotlight();
      if (command.type === 'show-cue' && surface === 'main') setView('cue');
    });
    return () => {
      mounted = false;
      unsubscribeDraft();
      unsubscribeCommand();
    };
  }, [adoptSnapshot, surface]);

  const dispatch = useCallback(async (command: CueCommand): Promise<CommandResult> => {
    const currentSnapshot = snapshotRef.current;
    if (!state || !currentSnapshot || !window.teleprompter) return { ok: false, error: { code: 'UNAVAILABLE', message: 'The desktop bridge is unavailable.' } };
    const draftId = activeModeRef.current;
    const revisions = currentSnapshot.fieldRevisions[draftId];
    const expectedFieldRevisions = Object.fromEntries(pathsForCommand(command, state).map((path) => [path, revisions[path] ?? 0]));
    const envelope: DraftCommandEnvelope = {
      commandId: commandId(),
      clientId: '',
      draftId,
      expectedFieldRevisions,
      command,
    };
    const result = await window.teleprompter.submitDraftCommand(envelope);
    if (result.ok) {
      adoptSnapshot(result.value.snapshot);
      setFeedback(null);
    } else {
      if (result.snapshot) adoptSnapshot(result.snapshot);
      setFeedback(result.error.message);
    }
    return result;
  }, [adoptSnapshot, state]);

  const requestPreview = useCallback(async (intent: PreviewIntent): Promise<void> => {
    const request: PreviewRequest = { ...intent, requestId: commandId() };
    const sequence = ++previewRequestSequence.current;
    setPreview({ status: 'pending', request });
    const bridge = window.teleprompter;
    if (!bridge?.getCompiledDraft) {
      setPreview({ status: 'error', request, error: { code: 'UNAVAILABLE', message: 'Exact preview is not available until the desktop read bridge is loaded.' } });
      return;
    }
    if (state && request.expectedContentVersion !== state.library.contentVersion) {
      setPreview({ status: 'error', request, error: { code: 'STALE_DRAFT', message: 'The library changed. Refresh the preview before continuing.' } });
      return;
    }
    const result = await bridge.getCompiledDraft({
      draftId: request.draftId,
      expectedRevision: request.expectedRevision,
      format: request.format,
    });
    if (sequence !== previewRequestSequence.current) return;
    if (!result.ok) {
      setPreview({ status: 'error', request, error: result.error });
      return;
    }
    const currentSnapshot = snapshotRef.current;
    const currentDraft = currentSnapshot?.drafts[request.draftId];
    if (result.draftId !== request.draftId
      || result.format !== request.format
      || result.contentVersion !== request.expectedContentVersion
      || result.revision !== request.expectedRevision
      || currentDraft?.revision !== request.expectedRevision
      || activeModeRef.current !== request.draftId) {
      setPreview({ status: 'error', request, error: { code: 'STALE_DRAFT', message: 'This preview was superseded by a newer draft state.' } });
      return;
    }
    setPreview({
      status: 'ready',
      request,
      identity: {
        requestId: request.requestId,
        draftId: result.draftId,
        revision: result.revision,
        format: result.format,
        contentVersion: result.contentVersion,
      },
      result,
    });
  }, [state]);

  const copy = useCallback(async (format: CopyFormat): Promise<CopyResult> => {
    const currentSnapshot = snapshotRef.current;
    if (!currentSnapshot || !window.teleprompter) return { copied: false, format, bytes: 0 };
    const result = await window.teleprompter.copyCompiledDraft({
      draftId: activeModeRef.current,
      expectedRevision: currentSnapshot.drafts[activeModeRef.current].revision,
      format,
    });
    if (!result.ok) {
      setFeedback(result.error.message);
      return { copied: false, format, bytes: 0 };
    }
    setFeedback(null);
    return result;
  }, [state]);

  const copyLibraryText = useCallback(async (recordId: string, format: 'expanded' | 'shorthand' | 'original'): Promise<CopyResult> => {
    if (!state || !window.teleprompter) return { copied: false, format, bytes: 0 };
    const result = await window.teleprompter.copyLibraryText({ recordId, format, expectedContentVersion: state.library.contentVersion });
    if (!result.ok) {
      setFeedback(result.error.message);
      return { copied: false, format, bytes: 0 };
    }
    setFeedback(null);
    return result;
  }, [state]);

  const readLibraryText = useCallback((request: LibraryCopyTextRequest): Promise<BridgeResult<LibraryTextResult>> => {
    if (!window.teleprompter?.getLibraryText) return Promise.resolve(unavailableBridgeError<LibraryTextResult>('Exact library text is unavailable until the desktop read bridge is loaded.'));
    return window.teleprompter.getLibraryText(request);
  }, []);

  const changeMode = useCallback((mode: Mode) => {
    activeModeRef.current = mode;
    setActiveMode(mode);
    setState((current) => current ? { ...current, snapshot: { ...current.snapshot, activeMode: mode } } : current);
  }, []);

  const setFavorite = useCallback(async (recordId: string, favorited: boolean) => {
    if (!window.teleprompter) return;
    const result = await window.teleprompter.setFavorite({ recordId, favorited });
    if (!result.ok) {
      setFeedback(result.error.message);
      return;
    }
    setFavoriteIds((previous) => {
      const next = new Set(previous);
      if (favorited) next.add(recordId); else next.delete(recordId);
      return next;
    });
    setFeedback(null);
  }, []);

  const requestSurfaceLayout = useCallback((request: SurfaceLayoutRequest): Promise<BridgeResult<SurfaceLayoutResult>> => {
    if (surface !== 'spotlight' || !window.teleprompterDesktop?.requestSurfaceLayout) {
      return Promise.resolve(unavailableBridgeError<SurfaceLayoutResult>('Measured surface layout is not available on this desktop bridge.'));
    }
    return window.teleprompterDesktop.requestSurfaceLayout(request);
  }, [surface]);

  const refreshReferences = useCallback(async (mode: Mode = activeModeRef.current): Promise<void> => {
    const requestSequence = ++referenceRequestSequence.current;
    const bridge = window.teleprompter;
    const currentSnapshot = snapshotRef.current;
    const revision = currentSnapshot?.drafts[mode].revision;
    if (!bridge?.getReferenceBindings || revision === undefined) {
      setReferenceBindings(null);
      setReferenceError('Local reference management is unavailable until the desktop bridge is loaded.');
      return;
    }
    setReferenceLoading(true);
    const result = await bridge.getReferenceBindings({ draftId: mode, expectedDraftRevision: revision });
    if (requestSequence !== referenceRequestSequence.current) return;
    setReferenceLoading(false);
    if (!result.ok) {
      setReferenceError(result.error.message);
      return;
    }
    setReferenceError(undefined);
    setReferenceBindings(result);
  }, []);

  const upsertReferenceBinding = useCallback(async (binding: ReferenceBinding): Promise<BridgeResult<ReferenceBindingsSnapshot>> => {
    const bridge = window.teleprompter;
    const current = referenceBindings;
    if (!bridge?.setReferenceBinding || !current || current.draftId !== binding.draftId) return unavailableBridgeError<ReferenceBindingsSnapshot>('Reference bindings are unavailable until the manager is refreshed.');
    const result = await bridge.setReferenceBinding({ draftId: binding.draftId, expectedVersion: current.version, operation: 'upsert', binding });
    if (result.ok) {
      referenceRequestSequence.current += 1;
      setReferenceBindings(result);
      setReferenceError(undefined);
    } else {
      setReferenceError(result.error.message);
      if (result.error.code === 'CONFLICT') void refreshReferences(binding.draftId);
    }
    return result;
  }, [refreshReferences, referenceBindings]);

  const removeReferenceBinding = useCallback(async (binding: Pick<ReferenceBinding, 'bindingId' | 'imageNumber' | 'draftId'>): Promise<BridgeResult<ReferenceBindingsSnapshot>> => {
    const bridge = window.teleprompter;
    const current = referenceBindings;
    if (!bridge?.setReferenceBinding || !current || current.draftId !== binding.draftId) return unavailableBridgeError<ReferenceBindingsSnapshot>('Reference bindings are unavailable until the manager is refreshed.');
    const result = await bridge.setReferenceBinding({ draftId: binding.draftId, expectedVersion: current.version, operation: 'remove', bindingId: binding.bindingId, imageNumber: binding.imageNumber });
    if (result.ok) {
      referenceRequestSequence.current += 1;
      setReferenceBindings(result);
      setReferenceError(undefined);
    } else {
      setReferenceError(result.error.message);
      if (result.error.code === 'CONFLICT') void refreshReferences(binding.draftId);
    }
    return result;
  }, [refreshReferences, referenceBindings]);

  const chooseReferenceImage = useCallback(async (imageNumber: number): Promise<BridgeResult<ChooseReferenceImageResult>> => {
    const bridge = window.teleprompter;
    if (!bridge?.chooseReferenceImage) return unavailableBridgeError<ChooseReferenceImageResult>('The native image chooser is unavailable in this session.');
    return bridge.chooseReferenceImage({ draftId: activeModeRef.current, imageNumber });
  }, []);

  const getReferenceThumbnail = useCallback(async (thumbnailHandle: string): Promise<BridgeResult<ReferenceThumbnailResult>> => {
    const bridge = window.teleprompter;
    if (!bridge?.getReferenceThumbnail) return unavailableBridgeError<ReferenceThumbnailResult>('Local reference thumbnails are unavailable in this session.');
    return bridge.getReferenceThumbnail({ thumbnailHandle });
  }, []);

  useEffect(() => {
    if (!state) return;
    void refreshReferences(activeMode);
  }, [activeMode, refreshReferences, state?.snapshot.drafts[activeMode].revision]);

  const openSettings = useCallback(() => {
    const currentSnapshot = snapshotRef.current;
    if (currentSnapshot) {
      setShortcutDraft(currentSnapshot.shortcut.accelerator);
      setSettings((current) => current ?? settingsFromSnapshot(currentSnapshot));
    }
    setSettingsOpen(true);
  }, []);

  const saveShortcut = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!window.teleprompter || !settings) return;
    setSettings((current) => current ? { ...current, saveState: 'saving', error: undefined } : current);
    const result = await window.teleprompter.setShortcut({ accelerator: shortcutDraft });
    if (!result.ok) {
      setSettings((current) => current ? { ...current, saveState: 'error', error: result.error.message } : current);
      return;
    }
    const currentSnapshot = snapshotRef.current;
    if (currentSnapshot) adoptSnapshot({ ...currentSnapshot, shortcut: result.shortcut, persistenceStatus: result.persistenceStatus });
    setSettings({
      shortcut: result.shortcut,
      persistenceStatus: result.persistenceStatus,
      saveState: result.shortcut.error ? 'error' : 'saved',
      ...(result.shortcut.error ? { error: result.shortcut.error } : {}),
    });
  }, [adoptSnapshot, settings, shortcutDraft]);

  const applyChoice = useCallback((choice: LibraryChoiceView) => {
    if (choice.kind === 'preset') {
      void dispatch({ type: 'apply-preset', presetId: choice.id });
      setView('cue');
      return;
    }
    if (choice.kind === 'edit-recipe') {
      void dispatch({ type: 'select-recipe', recipeId: choice.id });
      setView('cue');
      return;
    }
    if (!choice.axisId) return;
    const axis = state?.library.axes.find((item) => item.id === choice.axisId);
    void dispatch(axis?.cardinality === 'many'
      ? { type: 'toggle-atom', axisId: choice.axisId, atomId: choice.id }
      : { type: 'set-axis', axisId: choice.axisId, atomIds: [choice.id] });
    setView('cue');
  }, [dispatch, state]);

  const requestSize = useCallback((size: 'compact' | 'expanded') => {
    if (surface === 'spotlight') void window.teleprompterDesktop?.requestSize?.(size);
  }, [surface]);

  if (!state) {
    return <main className="tp-loading" role="status"><div className="tp-loading-mark">✦</div><p>{feedback ?? 'Loading local library…'}</p></main>;
  }

  const snapshot = { ...state.snapshot, activeMode };
  const referenceSurface: ReferenceSurfaceProps = {
    snapshot: referenceBindings,
    loading: referenceLoading,
    ...(referenceError ? { error: referenceError } : {}),
    refresh: () => refreshReferences(activeModeRef.current),
    upsert: upsertReferenceBinding,
    remove: removeReferenceBinding,
    chooseImage: chooseReferenceImage,
    getThumbnail: getReferenceThumbnail,
  };
  const cue = <CueSurface
    surface={surface}
    snapshot={snapshot}
    library={state.library}
    dispatch={dispatch}
    copy={copy}
    preview={preview}
    requestPreview={requestPreview}
    requestSurfaceLayout={surface === 'spotlight' ? requestSurfaceLayout : undefined}
    requestSize={surface === 'spotlight' ? requestSize : undefined}
    references={referenceSurface}
    dismiss={surface === 'spotlight' ? () => void window.teleprompter?.hideSpotlight() : undefined}
    onModeChange={changeMode}
    onOpenLibrary={() => setView('library')}
  />;

  if (surface === 'spotlight') return <div className="tp-spotlight-root">{cue}</div>;

  return <TeleprompterShell
    view={view}
    persistenceStatus={snapshot.persistenceStatus}
    onViewChange={setView}
    onSearch={() => window.dispatchEvent(new CustomEvent('teleprompter:focus-search'))}
    onSettings={openSettings}
  >
    {feedback && <p className="tp-feedback" role="status">{feedback}</p>}
    {view === 'cue' && cue}
    {view === 'library' && <LibrarySurface library={state.library} mode={activeMode} favoriteIds={favoriteIds} onFavorite={(recordId, favorited) => void setFavorite(recordId, favorited)} onApply={(recordId, kind) => {
      const record = kind === 'preset'
        ? state.library.presets.find((item) => item.id === recordId)
        : state.library.editRecipes.find((item) => item.id === recordId);
      if (!record) return;
      applyChoice({
        id: record.id,
        kind: record.kind,
        label: record.label,
        shorthand: record.shorthand,
        summary: record.summary,
        order: record.order,
        status: record.status,
        aliases: record.aliases,
        cautionIds: record.cautionIds,
        previewAssetId: record.previewAssetId,
      });
    }} onCopy={(recordId, format) => copyLibraryText(recordId, format)} onReadText={readLibraryText} />}
    {view === 'tokens' && <TokensSurface library={state.library} onApply={applyChoice} onCopy={(choice) => copyLibraryText(choice.id, 'expanded')} onReadText={readLibraryText} />}
    {settings && settingsOpen && <SettingsDialog settings={settings} shortcutDraft={shortcutDraft} onShortcutChange={setShortcutDraft} onSubmit={saveShortcut} onClose={() => setSettingsOpen(false)} />}
  </TeleprompterShell>;
}

function SettingsDialog({ settings, shortcutDraft, onShortcutChange, onSubmit, onClose }: {
  readonly settings: SettingsState;
  readonly shortcutDraft: string;
  readonly onShortcutChange: (value: string) => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onClose: () => void;
}) {
  return <dialog open className="tp-settings-dialog" aria-labelledby="tp-settings-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <form method="dialog" onSubmit={onSubmit}>
      <header>
        <div><p className="tp-eyebrow">Teleprompter</p><h2 id="tp-settings-title">Settings</h2></div>
        <button type="button" className="tp-icon-button" aria-label="Close settings" onClick={onClose}>×</button>
      </header>
      <label htmlFor="tp-shortcut-input">Cue shortcut</label>
      <input id="tp-shortcut-input" value={shortcutDraft} onChange={(event) => onShortcutChange(event.target.value)} disabled={settings.saveState === 'saving'} autoFocus />
      <p className="tp-settings-help">Use View → Show Cue if the shortcut is unavailable.</p>
      {settings.shortcut.error && <p className="tp-inline-error" role="alert">{settings.shortcut.error}</p>}
      {settings.error && <p className="tp-inline-error" role="alert">{settings.error}</p>}
      <p className="tp-save-status" role="status">{settings.persistenceStatus === 'disk' ? 'Saved on this device.' : settings.persistenceStatus === 'session' ? 'Session only.' : 'Recovered for this session.'}</p>
      <footer>
        <button type="button" className="tp-secondary-action" onClick={onClose}>Cancel</button>
        <button type="submit" className="tp-primary-action" disabled={settings.saveState === 'saving'}>{settings.saveState === 'saving' ? 'Saving…' : settings.saveState === 'saved' ? 'Saved' : 'Save shortcut'}</button>
      </footer>
    </form>
  </dialog>;
}
