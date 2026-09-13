import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  BridgeResult,
  CommandResult,
  CopyFormat,
  CopyResult,
  CueCommand,
  CueSnapshot,
  DraftFieldPath,
  DraftCommandEnvelope,
  LibraryChoiceView,
  Mode,
  View,
} from '../../../shared/teleprompter';
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

const pathsForCommand = (command: CueCommand, state: AppState): readonly DraftFieldPath[] => {
  switch (command.type) {
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

  const adoptSnapshot = useCallback((snapshot: CueSnapshot) => {
    const mode = activeModeRef.current;
    const adopted = { ...snapshot, activeMode: mode };
    snapshotRef.current = adopted;
    setState((current) => current ? { ...current, snapshot: adopted } : current);
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
    if (surface === 'spotlight') void window.teleprompterDesktop?.requestSize(size);
  }, [surface]);

  if (!state) {
    return <main className="tp-loading" role="status"><div className="tp-loading-mark">✦</div><p>{feedback ?? 'Loading local library…'}</p></main>;
  }

  const snapshot = { ...state.snapshot, activeMode };
  const cue = <CueSurface
    surface={surface}
    snapshot={snapshot}
    library={state.library}
    dispatch={dispatch}
    copy={copy}
    requestSize={surface === 'spotlight' ? requestSize : undefined}
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
    onSettings={() => setFeedback('Settings are intentionally compact in this slice. The Cue shortcut can be changed through the desktop bridge.')}
  >
    {feedback && <p className="tp-feedback" role="status">{feedback}</p>}
    {view === 'cue' && cue}
    {view === 'library' && <LibrarySurface library={state.library} mode={activeMode} favoriteIds={favoriteIds} onFavorite={(recordId, favorited) => void setFavorite(recordId, favorited)} onApply={(recordId, kind) => applyChoice({ id: recordId, kind, label: recordId, shorthand: recordId, summary: '', order: 0, status: 'active', aliases: [], cautionIds: [] })} onCopy={(recordId, format) => copyLibraryText(recordId, format)} />}
    {view === 'tokens' && <TokensSurface library={state.library} onApply={applyChoice} onCopy={(choice) => copyLibraryText(choice.id, 'expanded')} />}
  </TeleprompterShell>;
}
