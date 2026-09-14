import {
  app,
  BrowserWindow,
  clipboard,
  globalShortcut,
  ipcMain,
  Menu,
  nativeTheme,
  protocol,
  screen,
} from 'electron';
import { promises as fs } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as engineModule from '../engine';
import { catalog, legacyLibrary, legacyOriginalFor } from '../content';
import { techniqueIds } from '../content/catalog';
import type {
  Atom,
  BridgeError,
  BridgeResult,
  CommandResult,
  CommandError,
  CompiledDraftPreview,
  CopyResult,
  CueSnapshot,
  CueCommand,
  CueDraft,
  DraftCommandEnvelope,
  DraftFieldPath,
  LibraryChoiceView,
  LibraryCopyTextRequest,
  LibraryTextResult,
  LibraryV2,
  LibraryView,
  Mode,
  PersistenceStatus,
  ShortcutState,
  TeleprompterBootstrap,
  DesktopCommand,
  CompileResult,
} from '../shared/teleprompter-types';
import { validateCopyCompiledDraftRequest, validateDraftCommand, validateLibraryCopyTextRequest, validationErrorToBridgeError, validateGetCompiledDraftRequest, validateLibraryTextRequest } from '../shared/teleprompter-validation';
import {
  DEFAULT_ACCELERATOR,
  DEFAULT_PREFERENCES,
  mergePreferences,
  parsePreferences,
  type PreferencesDocument,
  withShortcutResult,
} from './preferences';
import {
  clampMainBounds,
  MAIN_WINDOW_MINIMUM,
  placeSpotlight,
  resizeSpotlight,
  shouldDismissSpotlightOnBlur,
  SPOTLIGHT_BOUNDS,
  type SpotlightSize,
} from './placement';
import {
  createDraftStoreDocument,
  DraftStore,
  draftChanged,
  parseDraftStore,
  serializeDraftStore,
  writeJsonAtomically,
  type CueEngineAdapter,
  type DraftStoreDocument,
} from './draft-store';
import { isPathInside, isPermittedRendererUrl, rendererContentSecurityPolicy } from './security';

/** Keep the internal profile and protocol stable while visible identity changes. */
app.setPath('userData', join(app.getPath('appData'), 'teleprompter'));
app.setName('Teleprompter');
nativeTheme.themeSource = 'dark';

protocol.registerSchemesAsPrivileged([{
  scheme: 'teleprompter',
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: false },
}]);

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const validTechniqueIds = new Set(techniqueIds);
const allowedSurfaces = new Set(['main', 'spotlight'] as const);
const singleInstance = app.requestSingleInstanceLock();

type Surface = 'main' | 'spotlight';
type RegisteredRenderer = { readonly contents: Electron.WebContents; readonly surface: Surface };
type RuntimeModule = CueEngineAdapter & {
  readonly library?: LibraryV2;
  readonly getLibrary?: () => LibraryV2;
};

type RawEngineModule = {
  readonly applyDraftCommand?: (library: LibraryV2, draft: CueDraft, command: CueCommand, history?: readonly CueDraft[]) => unknown;
  readonly compileCreate?: (library: LibraryV2, draft: CueDraft) => CompileResult;
  readonly compileEdit?: (library: LibraryV2, draft: CueDraft) => CompileResult;
  readonly projectLibrary?: (library: LibraryV2) => LibraryView;
  readonly touchedPathsForCommand?: (library: LibraryV2, draft: CueDraft, command: CueCommand) => readonly DraftFieldPath[];
};

const EMPTY_LIBRARY: LibraryV2 = {
  schemaVersion: 2,
  contentVersion: '2026-09-13.0',
  taxa: [],
  axes: [],
  atoms: [],
  bundles: [],
  presets: [],
  editRecipes: [],
  sources: [],
  cautions: [],
  legacyMap: [],
};

const rawEngineModule = engineModule as unknown as RawEngineModule;
const runtimeModule: RuntimeModule = {
  applyDraftCommand: rawEngineModule.applyDraftCommand
    ? (draft, command, currentLibrary) => {
      const result = rawEngineModule.applyDraftCommand?.(currentLibrary, draft, command, []);
      if (result && typeof result === 'object' && 'ok' in result && result.ok === true && 'value' in result) {
        const value = (result as { value: { draft: CueDraft; touchedPaths: readonly DraftFieldPath[] } }).value;
        return { ok: true, draft: value.draft, touchedPaths: value.touchedPaths };
      }
      const message = result && typeof result === 'object' && 'issue' in result && result.issue && typeof result.issue === 'object' && 'message' in result.issue
        ? String(result.issue.message)
        : 'The Cue command was rejected.';
      return { ok: false, error: { code: 'VALIDATION_ERROR', message } };
    }
    : undefined,
  compileCreate: rawEngineModule.compileCreate
    ? (draft, currentLibrary) => rawEngineModule.compileCreate!(currentLibrary, draft)
    : undefined,
  compileEdit: rawEngineModule.compileEdit
    ? (draft, currentLibrary) => rawEngineModule.compileEdit!(currentLibrary, draft)
    : undefined,
  libraryView: rawEngineModule.projectLibrary,
  getTouchedPaths: rawEngineModule.touchedPathsForCommand
    ? (draft, command, currentLibrary) => rawEngineModule.touchedPathsForCommand!(currentLibrary, draft, command)
    : undefined,
};
const library: LibraryV2 = legacyLibrary ?? EMPTY_LIBRARY;

let mainWindow: BrowserWindow | null = null;
let spotlightWindow: BrowserWindow | null = null;
let mainReady = false;
let spotlightReady = false;
let spotlightSize: SpotlightSize = 'compact';
let spotlightAnchor: { x: number; y: number } | null = null;
let spotlightTransitionUntil = 0;
let spotlightBlurTimer: ReturnType<typeof setTimeout> | undefined;
let isQuitting = false;
let handlersRegistered = false;
let protocolRegistered = false;
let permissionHandlerRegistered = false;
let nextClientNumber = 1;
let activeAccelerator: string | null = null;
let preferences = DEFAULT_PREFERENCES;
let persistenceStatus: PersistenceStatus = 'disk';
let preferencesWriteBlocked = false;
let profileRecovery = false;
let preferencesWriteFailed = false;
let draftsWriteFailed = false;
let preferencesQueue = Promise.resolve();
let draftQueue = Promise.resolve();
let draftTimer: ReturnType<typeof setTimeout> | undefined;
let latestDraftWriteSequence = 0;
const renderers = new Map<number, RegisteredRenderer>();
const clientIds = new Map<number, string>();
const rendererOrigin = process.env.ELECTRON_RENDERER_URL ? new URL(process.env.ELECTRON_RENDERER_URL).origin : undefined;
let draftStore = new DraftStore(library, runtimeModule);

const preferencesPath = (): string => join(app.getPath('userData'), 'preferences.json');
const draftsPath = (): string => join(app.getPath('userData'), 'cue-drafts.json');

const refreshPersistenceStatus = (): void => {
  persistenceStatus = profileRecovery ? 'recovery' : (preferencesWriteFailed || draftsWriteFailed ? 'session' : 'disk');
};

const failure = <T extends object = Record<string, never>>(code: BridgeError['code'], message: string): BridgeResult<T> => ({ ok: false, error: { code, message } });
const success = <T extends object>(data: T): BridgeResult<T> => ({ ok: true, ...data });
const commandFailure = (code: CommandError['code'], message: string): CommandResult => ({ ok: false, error: { code, message } });

const legacyPreferences = () => ({
  favoriteTechniqueIds: preferences.favoriteRecordIds.filter((id) => validTechniqueIds.has(id)),
  themePreference: 'dark' as const,
  lastMode: 'gallery' as const,
});

const libraryView = (): LibraryView => {
  if (runtimeModule.libraryView) return runtimeModule.libraryView(library);
  const axes = new Map(library.axes.map((axis) => [axis.id, axis]));
  const toChoice = (record: Atom | LibraryV2['bundles'][number] | LibraryV2['presets'][number] | LibraryV2['editRecipes'][number]): LibraryChoiceView => {
    const axisId = record.kind === 'atom' ? record.axisId : record.kind === 'bundle' ? record.atomIds[0] ? library.atoms.find((atom) => atom.id === record.atomIds[0])?.axisId : undefined : undefined;
    return {
      id: record.id,
      kind: record.kind,
      label: record.label,
      shorthand: record.shorthand,
      summary: record.summary,
      ...(axisId === undefined ? {} : { axisId, field: axes.get(axisId)?.field }),
      order: record.order,
      status: record.status,
      aliases: [...record.aliases],
      cautionIds: [...record.cautionIds],
      ...(record.previewAssetId === undefined ? {} : { previewAssetId: record.previewAssetId }),
    };
  };
  return {
    schemaVersion: 2,
    contentVersion: library.contentVersion,
    taxa: library.taxa,
    axes: library.axes,
    choices: [
      ...library.atoms.map(toChoice),
      ...library.bundles.map(toChoice),
      ...library.presets.map(toChoice),
      ...library.editRecipes.map(toChoice),
    ],
    presets: library.presets,
    editRecipes: library.editRecipes,
    sources: library.sources,
    cautions: library.cautions,
  };
};

const getOrCreateClientId = (contents: Electron.WebContents): string => {
  const existing = clientIds.get(contents.id);
  if (existing) return existing;
  const clientId = `desktop-client-${process.pid}-${nextClientNumber++}`;
  clientIds.set(contents.id, clientId);
  draftStore.registerClient(clientId);
  return clientId;
};

const unregisterRenderer = (contents: Electron.WebContents): void => {
  renderers.delete(contents.id);
  const clientId = clientIds.get(contents.id);
  if (clientId) draftStore.destroyClient(clientId);
  clientIds.delete(contents.id);
};

const registerRenderer = (window: BrowserWindow, surface: Surface): void => {
  const contents = window.webContents;
  renderers.set(contents.id, { contents, surface });
  contents.once('destroyed', () => unregisterRenderer(contents));
  contents.on('will-navigate', (event, url) => {
    if (!isPermittedRendererUrl(url, rendererOrigin)) event.preventDefault();
  });
  contents.on('did-start-navigation', (event, url, _isInPlace, isMainFrame) => {
    if (!isMainFrame || !isPermittedRendererUrl(url, rendererOrigin)) event.preventDefault();
  });
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  contents.on('will-attach-webview', (event) => { event.preventDefault(); });
  contents.on('render-process-gone', (_event, details) => {
    if (details.reason === 'clean-exit' || surface !== 'spotlight' || isQuitting) return;
    spotlightReady = false;
    if (spotlightWindow && !spotlightWindow.isDestroyed()) spotlightWindow.destroy();
    spotlightWindow = null;
    void createSpotlightWindow();
  });
};

const isAllowedSender = (event: Electron.IpcMainInvokeEvent): boolean => {
  const registration = renderers.get(event.sender.id);
  return Boolean(registration
    && registration.contents === event.sender
    && event.senderFrame === event.sender.mainFrame
    && isPermittedRendererUrl(event.senderFrame.url, rendererOrigin));
};

const senderSurface = (event: Electron.IpcMainInvokeEvent): Surface | null => renderers.get(event.sender.id)?.surface ?? null;

const registerLocalProtocol = (): void => {
  if (protocolRegistered) return;
  protocolRegistered = true;
  const rendererRoot = resolve(join(__dirname, '../renderer'));
  protocol.handle('teleprompter', async (request) => {
    try {
      if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method Not Allowed', { status: 405 });
      const url = new URL(request.url);
      if (url.host !== 'app' || url.username || url.password || url.port) return new Response('Not Found', { status: 404 });
      const decodedPath = decodeURIComponent(url.pathname);
      if (decodedPath.includes('\\') || decodedPath.split('/').includes('..')) return new Response('Bad Request', { status: 400 });
      const relativePath = decodedPath === '/' || decodedPath === '/index.html' ? 'index.html' : decodedPath.replace(/^\//, '');
      const filePath = resolve(rendererRoot, relativePath);
      if (!isPathInside(rendererRoot, filePath) || filePath === rendererRoot) return new Response('Forbidden', { status: 403 });
      const body = await fs.readFile(filePath);
      const extension = extname(filePath).toLowerCase();
      const contentType: Record<string, string> = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.webp': 'image/webp',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
      };
      const headers: Record<string, string> = {
        'content-type': contentType[extension] ?? 'application/octet-stream',
        'cache-control': 'no-store',
      };
      if (extension === '.html') headers['content-security-policy'] = rendererContentSecurityPolicy();
      return new Response(request.method === 'HEAD' ? null : body, { status: 200, headers });
    } catch {
      return new Response('Not Found', { status: 404 });
    }
  });
};

const safeRecoveryPath = async (basePath: string, suffix: string): Promise<string> => {
  const stem = `${basePath}.${suffix}`;
  for (let index = 0; index < 1000; index += 1) {
    const candidate = index === 0 ? stem : `${stem}.${index}`;
    try {
      await fs.access(candidate);
    } catch {
      return candidate;
    }
  }
  return `${stem}.${Date.now()}`;
};

const preserveFile = async (path: string, suffix: string): Promise<string | undefined> => {
  try {
    const target = await safeRecoveryPath(path, suffix);
    await fs.copyFile(path, target);
    return target;
  } catch {
    return undefined;
  }
};

const loadPreferences = async (): Promise<void> => {
  try {
    const raw = await fs.readFile(preferencesPath(), 'utf8');
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      await preserveFile(preferencesPath(), `recovery-${Date.now()}`);
      preferences = DEFAULT_PREFERENCES;
      profileRecovery = true;
      refreshPersistenceStatus();
      return;
    }
    const result = parsePreferences(parsed);
    preferences = result.preferences;
    profileRecovery = result.status === 'recovery';
    refreshPersistenceStatus();
    if (result.disposition === 'future') {
      preferencesWriteBlocked = true;
      return;
    }
    if (result.disposition === 'recovered') {
      await preserveFile(preferencesPath(), `recovery-${Date.now()}`);
      profileRecovery = true;
      refreshPersistenceStatus();
      return;
    }
    if (result.disposition === 'migrated') {
      await preserveFile(preferencesPath(), `v1-backup-${Date.now()}`);
      await persistPreferences();
    }
  } catch (cause) {
    const errorCode = cause && typeof cause === 'object' && 'code' in cause ? (cause as { code?: unknown }).code : undefined;
    if (errorCode !== 'ENOENT') profileRecovery = true;
    refreshPersistenceStatus();
    preferences = DEFAULT_PREFERENCES;
  }
};

const persistPreferences = async (): Promise<void> => {
  if (preferencesWriteBlocked) return;
  const document = JSON.stringify(preferences, null, 2) + '\n';
  preferencesQueue = preferencesQueue.then(async () => {
    try {
      await fs.mkdir(dirname(preferencesPath()), { recursive: true });
      await writeJsonAtomically(preferencesPath(), document);
      preferencesWriteFailed = false;
    } catch {
      preferencesWriteFailed = true;
    }
    refreshPersistenceStatus();
  });
  await preferencesQueue;
};

const loadDrafts = async (): Promise<void> => {
  try {
    const raw = await fs.readFile(draftsPath(), 'utf8');
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      await preserveFile(draftsPath(), `recovery-${Date.now()}`);
      draftStore = new DraftStore(library, runtimeModule);
      profileRecovery = true;
      refreshPersistenceStatus();
      return;
    }
    const loaded = parseDraftStore(parsed, library);
    if (loaded.status !== 'loaded') {
      if (loaded.status === 'future') preferencesWriteBlocked = true;
      await preserveFile(draftsPath(), `${loaded.status}-${Date.now()}`);
      draftStore = new DraftStore(library, runtimeModule);
      profileRecovery = true;
      refreshPersistenceStatus();
      return;
    }
    draftStore = new DraftStore(library, runtimeModule, loaded.document);
  } catch (cause) {
    const errorCode = cause && typeof cause === 'object' && 'code' in cause ? (cause as { code?: unknown }).code : undefined;
    if (errorCode !== 'ENOENT') profileRecovery = true;
    refreshPersistenceStatus();
    draftStore = new DraftStore(library, runtimeModule);
  }
};

const broadcastDraftChanged = (sourceClientId?: string): void => {
  const event = draftChanged(draftStore.getSnapshot(preferences.shortcut, persistenceStatus), sourceClientId);
  for (const { contents } of renderers.values()) {
    if (!contents.isDestroyed()) contents.send('teleprompter:draft-changed', event);
  }
};

const persistDrafts = async (): Promise<void> => {
  if (draftTimer) {
    clearTimeout(draftTimer);
    draftTimer = undefined;
  }
  const document = serializeDraftStore(draftStore.toDocument());
  const sequence = draftStore.getSnapshot(preferences.shortcut, persistenceStatus).sequence;
  latestDraftWriteSequence = sequence;
  draftQueue = draftQueue.then(async () => {
    try {
      await fs.mkdir(dirname(draftsPath()), { recursive: true });
      await writeJsonAtomically(draftsPath(), document);
      if (latestDraftWriteSequence === draftStore.getSnapshot(preferences.shortcut, persistenceStatus).sequence) {
        draftsWriteFailed = false;
      } else {
        draftsWriteFailed = true;
      }
    } catch {
      draftsWriteFailed = true;
    }
    refreshPersistenceStatus();
    broadcastDraftChanged();
  });
  await draftQueue;
};

const scheduleDraftPersistence = (): void => {
  if (draftTimer) clearTimeout(draftTimer);
  draftTimer = setTimeout(() => { void persistDrafts(); }, 300);
};

const sendLegacyCommand = (command: 'focus-search' | 'show-gallery' | 'show-cheatsheet'): void => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('ui-command', command);
};

const sendDesktopCommand = (command: DesktopCommand): void => {
  for (const { contents } of renderers.values()) {
    if (!contents.isDestroyed()) contents.send('teleprompter:command', command);
  }
};

const clearSpotlightBlurTimer = (): void => {
  if (spotlightBlurTimer) clearTimeout(spotlightBlurTimer);
  spotlightBlurTimer = undefined;
};

const scheduleSpotlightBlurDismissal = (): void => {
  clearSpotlightBlurTimer();
  const check = (): void => {
    spotlightBlurTimer = undefined;
    if (!spotlightWindow || spotlightWindow.isDestroyed()) return;
    const now = Date.now();
    if (now < spotlightTransitionUntil) {
      spotlightBlurTimer = setTimeout(check, spotlightTransitionUntil - now);
      return;
    }
    if (shouldDismissSpotlightOnBlur({
      visible: spotlightWindow.isVisible(),
      focused: spotlightWindow.isFocused(),
      transitionUntil: spotlightTransitionUntil,
    }, now)) hideSpotlight('blur');
  };
  spotlightBlurTimer = setTimeout(check, 0);
};

const showMain = (): void => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    void createMainWindow();
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
};

const setSpotlightBounds = (size: SpotlightSize): void => {
  if (!spotlightWindow || spotlightWindow.isDestroyed() || !spotlightAnchor) return;
  const workArea = screen.getDisplayNearestPoint(spotlightAnchor).workArea;
  const bounds = resizeSpotlight(spotlightAnchor, workArea, size);
  spotlightWindow.setBounds(bounds, true);
};

const reflowVisibleSpotlight = (): void => {
  if (!spotlightWindow || spotlightWindow.isDestroyed() || !spotlightWindow.isVisible() || !spotlightAnchor) return;
  const workArea = screen.getDisplayNearestPoint(spotlightAnchor).workArea;
  spotlightWindow.setBounds(resizeSpotlight(spotlightAnchor, workArea, spotlightSize), true);
};

const hideSpotlight = (reason: 'shortcut' | 'blur' | 'menu' = 'menu'): void => {
  clearSpotlightBlurTimer();
  if (!spotlightWindow || spotlightWindow.isDestroyed()) return;
  const wasVisible = spotlightWindow.isVisible();
  spotlightWindow.hide();
  spotlightAnchor = null;
  spotlightSize = 'compact';
  if (wasVisible) sendDesktopCommand({ type: 'hide-spotlight', reason });
};

const showSpotlight = (): void => {
  if (!spotlightWindow || spotlightWindow.isDestroyed() || !spotlightReady) return;
  const point = screen.getCursorScreenPoint();
  const workArea = screen.getDisplayNearestPoint(point).workArea;
  spotlightAnchor = point;
  spotlightSize = 'compact';
  spotlightWindow.setBounds(placeSpotlight(point, workArea, spotlightSize), true);
  spotlightWindow.show();
  spotlightWindow.focus();
  sendDesktopCommand({ type: 'show-cue', reason: 'shortcut' });
};

const toggleSpotlight = (reason: 'shortcut' | 'menu' = 'shortcut'): void => {
  const now = Date.now();
  if (now < spotlightTransitionUntil) return;
  spotlightTransitionUntil = now + 250;
  if (!spotlightWindow || spotlightWindow.isDestroyed() || !spotlightReady) return;
  if (!spotlightWindow.isVisible()) {
    showSpotlight();
  } else if (spotlightWindow.isFocused()) {
    hideSpotlight(reason);
  } else {
    showSpotlight();
  }
};

const registerShortcut = (accelerator: string): boolean => {
  try {
    if (globalShortcut.isRegistered(accelerator)) return true;
    return globalShortcut.register(accelerator, () => toggleSpotlight('shortcut'));
  } catch {
    return false;
  }
};

const registerInitialShortcut = (): void => {
  const candidate = preferences.lastWorkingAccelerator ?? preferences.shortcut.accelerator ?? DEFAULT_ACCELERATOR;
  if (registerShortcut(candidate)) {
    activeAccelerator = candidate;
    const isStoredCandidate = candidate === preferences.shortcut.accelerator;
    preferences = withShortcutResult(preferences, {
      accelerator: preferences.shortcut.accelerator,
      registered: isStoredCandidate,
      ...(isStoredCandidate ? {} : { error: 'The saved shortcut was unavailable; the last working shortcut is active.' }),
    });
  } else {
    activeAccelerator = null;
    preferences = withShortcutResult(preferences, {
      accelerator: preferences.shortcut.accelerator,
      registered: false,
      error: 'This shortcut is unavailable. Use View → Show Cue instead.',
    });
  }
};

const isValidAcceleratorText = (value: unknown): value is string => typeof value === 'string'
  && value.trim().length > 0
  && value.trim().length <= 120
  && /^[A-Za-z0-9+()\-_,. ]+$/.test(value.trim());

const setShortcut = async (accelerator: string): Promise<BridgeResult<{ shortcut: ShortcutState; persistenceStatus: PersistenceStatus }>> => {
  const candidate = accelerator.trim();
  if (!isValidAcceleratorText(candidate)) return failure('INVALID_INPUT', 'Enter a valid keyboard shortcut.');
  if (candidate === activeAccelerator) {
    const shortcut = { accelerator: candidate, registered: true } as const;
    preferences = withShortcutResult(preferences, shortcut);
    await persistPreferences();
    return success({ shortcut, persistenceStatus });
  }
  const previous = activeAccelerator;
  if (!registerShortcut(candidate)) {
    const shortcut = { accelerator: candidate, registered: false, error: 'Shortcut is already in use or unavailable. The previous working shortcut remains active.' } as const;
    preferences = withShortcutResult(preferences, shortcut);
    await persistPreferences();
    return success({ shortcut, persistenceStatus });
  }
  if (previous && previous !== candidate) globalShortcut.unregister(previous);
  activeAccelerator = candidate;
  const shortcut = { accelerator: candidate, registered: true } as const;
  preferences = withShortcutResult(preferences, shortcut);
  await persistPreferences();
  return success({ shortcut, persistenceStatus });
};

const copyText = (text: string): BridgeResult<CopyResult> => {
  if (text.length === 0 || Buffer.byteLength(text, 'utf8') > 64 * 1024) return failure('INVALID_INPUT', 'Copy text must be between 1 and 64 KiB.');
  try {
    clipboard.writeText(text);
    return success({ copied: true, format: 'expanded', bytes: Buffer.byteLength(text, 'utf8') });
  } catch {
    return failure('CLIPBOARD_FAILED', "Couldn't copy the text.");
  }
};

const recordForId = (recordId: string): LibraryV2['atoms'][number] | LibraryV2['bundles'][number] | LibraryV2['presets'][number] | LibraryV2['editRecipes'][number] | undefined => [
  ...library.atoms,
  ...library.bundles,
  ...library.presets,
  ...library.editRecipes,
].find((record) => record.id === recordId);

const recordText = (request: LibraryCopyTextRequest): BridgeResult<LibraryTextResult> => {
  if (request.expectedContentVersion !== library.contentVersion) return failure('STALE_DRAFT', 'The library changed. Refresh before copying.');
  const record = recordForId(request.recordId);
  if (!record) return failure('INVALID_INPUT', 'That library record is unavailable.');
  if (request.format === 'original') {
    const originals = library.legacyMap.flatMap((mapping) => {
      if (!mapping.targetIds.includes(request.recordId)) return [];
      const oldId = mapping.oldId.startsWith('technique-') ? mapping.oldId.slice('technique-'.length) : mapping.oldId;
      const kind = mapping.oldId.startsWith('technique-') ? 'technique' as const : 'entry' as const;
      return legacyOriginalFor(catalog, oldId, kind);
    });
    const original = originals[0];
    const originalText = original?.prompt ?? original?.direction ?? original?.meaning ?? original?.token;
    if (!originalText) return failure('UNAVAILABLE', 'The original legacy text is not available for this record.');
    return success({ recordId: request.recordId, format: request.format, contentVersion: library.contentVersion, text: originalText });
  }
  let text = record.shorthand;
  if (request.format === 'expanded') {
    if (record.kind === 'atom') text = record.expansion;
    else if (record.kind === 'bundle' || record.kind === 'preset') text = record.atomIds.map((id) => library.atoms.find((atom) => atom.id === id)?.expansion).filter((value): value is string => Boolean(value)).join('; ');
    else text = record.segments.map((segment) => 'text' in segment ? segment.text : segment.placeholder).join('');
  }
  return success({ recordId: request.recordId, format: request.format, contentVersion: library.contentVersion, text });
};

const compileDraftResult = (mode: Mode, expectedRevision: number, format: 'expanded' | 'shorthand'): BridgeResult<CompileResult> => {
  const snapshot = draftStore.getSnapshot(preferences.shortcut, persistenceStatus);
  const draft = snapshot.drafts[mode];
  if (draft.revision !== expectedRevision) return failure('STALE_DRAFT', 'The draft changed. Refresh before copying.');
  const compile = mode === 'create' ? runtimeModule.compileCreate : runtimeModule.compileEdit;
  if (!compile) return failure('UNAVAILABLE', 'The Cue engine is not loaded.');
  let result;
  try {
    result = compile({ ...draft, outputFormat: format }, library);
  } catch {
    return failure('INTERNAL', 'The prompt could not be compiled.');
  }
  if (result.revision !== expectedRevision) return failure('STALE_DRAFT', 'The draft changed while it was compiling.');
  if (result.errors.length > 0) return failure('INVALID_INPUT', result.errors.map((item) => item.message).join(' '));
  return success(result);
};

const compileDraft = (mode: Mode, expectedRevision: number, format: 'expanded' | 'shorthand'): BridgeResult<CopyResult> => {
  const compiled = compileDraftResult(mode, expectedRevision, format);
  if (!compiled.ok) return compiled;
  const text = compiled.text;
  const copied = copyText(text);
  return copied.ok ? { ...copied, format, revision: expectedRevision } : copied;
};

const getCompiledDraft = (mode: Mode, expectedRevision: number, format: 'expanded' | 'shorthand'): BridgeResult<CompiledDraftPreview> => {
  const compiled = compileDraftResult(mode, expectedRevision, format);
  if (!compiled.ok) return compiled;
  return success({ ...compiled, draftId: mode, format, contentVersion: library.contentVersion });
};

const copyRecord = (request: LibraryCopyTextRequest): BridgeResult<CopyResult> => {
  const resolved = recordText(request);
  if (!resolved.ok) return resolved;
  const copied = copyText(resolved.text);
  return copied.ok ? { ...copied, format: request.format } : copied;
};

const createMainWindow = async (): Promise<void> => {
  if (mainWindow && !mainWindow.isDestroyed()) return;
  const point = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(point);
  const restored = clampMainBounds(preferences.window, display.workArea);
  const { isMaximized: restoreMaximized, ...restoredBounds } = restored;
  mainWindow = new BrowserWindow({
    ...restoredBounds,
    minWidth: Math.min(MAIN_WINDOW_MINIMUM.width, display.workArea.width),
    minHeight: Math.min(MAIN_WINDOW_MINIMUM.height, display.workArea.height),
    show: false,
    backgroundColor: '#101112',
    title: 'Teleprompter',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      webviewTag: false,
      backgroundThrottling: true,
    },
  });
  registerRenderer(mainWindow, 'main');
  mainWindow.on('page-title-updated', (event) => { event.preventDefault(); mainWindow?.setTitle('Teleprompter'); });
  mainWindow.once('ready-to-show', () => {
    mainReady = true;
    if (restoreMaximized && mainWindow && !mainWindow.isMaximized()) mainWindow.maximize();
    mainWindow?.show();
  });
  const saveBounds = (): void => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    preferences = mergePreferences(preferences, {
      window: { ...mainWindow.getNormalBounds(), isMaximized: mainWindow.isMaximized() },
    });
    void persistPreferences();
  };
  let boundsTimer: ReturnType<typeof setTimeout> | undefined;
  const scheduleBoundsSave = (): void => {
    if (boundsTimer) clearTimeout(boundsTimer);
    boundsTimer = setTimeout(saveBounds, 300);
  };
  mainWindow.on('move', scheduleBoundsSave);
  mainWindow.on('resize', scheduleBoundsSave);
  mainWindow.on('maximize', saveBounds);
  mainWindow.on('unmaximize', scheduleBoundsSave);
  mainWindow.on('close', () => {
    if (boundsTimer) clearTimeout(boundsTimer);
    boundsTimer = undefined;
    saveBounds();
  });
  mainWindow.on('closed', () => { mainReady = false; mainWindow = null; });
  const url = process.env.ELECTRON_RENDERER_URL ? (() => { const value = new URL(process.env.ELECTRON_RENDERER_URL); value.searchParams.set('surface', 'main'); return value.toString(); })() : 'teleprompter://app/index.html?surface=main';
  await mainWindow.loadURL(url);
};

const createSpotlightWindow = async (): Promise<void> => {
  if (spotlightWindow && !spotlightWindow.isDestroyed()) return;
  spotlightWindow = new BrowserWindow({
    ...SPOTLIGHT_BOUNDS.compact,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    focusable: true,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    ...(process.platform === 'darwin' ? { type: 'panel' as const, level: 'floating' as const } : {}),
    backgroundColor: '#00000000',
    title: 'Teleprompter Cue',
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      webviewTag: false,
      backgroundThrottling: true,
    },
  });
  registerRenderer(spotlightWindow, 'spotlight');
  spotlightWindow.on('page-title-updated', (event) => { event.preventDefault(); spotlightWindow?.setTitle('Teleprompter Cue'); });
  if (process.platform === 'darwin') spotlightWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  spotlightWindow.on('focus', clearSpotlightBlurTimer);
  spotlightWindow.on('blur', scheduleSpotlightBlurDismissal);
  spotlightWindow.on('closed', () => {
    clearSpotlightBlurTimer();
    spotlightReady = false;
    spotlightWindow = null;
  });
  spotlightWindow.once('ready-to-show', () => { spotlightReady = true; });
  spotlightWindow.webContents.once('did-finish-load', () => { spotlightReady = true; });
  const url = process.env.ELECTRON_RENDERER_URL ? (() => { const value = new URL(process.env.ELECTRON_RENDERER_URL); value.searchParams.set('surface', 'spotlight'); return value.toString(); })() : 'teleprompter://app/index.html?surface=spotlight';
  await spotlightWindow.loadURL(url);
  // loadURL resolves after the document has loaded even when transparent
  // windows do not emit ready-to-show on a particular compositor.
  spotlightReady = true;
};

const registerHandlers = (): void => {
  if (handlersRegistered) return;
  handlersRegistered = true;
  ipcMain.handle('get-bootstrap', (event) => {
    if (!isAllowedSender(event)) return failure('UNAVAILABLE', 'The desktop window is unavailable.');
    const clientId = getOrCreateClientId(event.sender);
    const snapshot = draftStore.getSnapshot(preferences.shortcut, persistenceStatus);
    const bootstrap: TeleprompterBootstrap & { readonly clientId: string; readonly preferences: ReturnType<typeof legacyPreferences> } = {
      snapshot,
      library: libraryView(),
      platform: process.platform as 'darwin' | 'win32' | 'linux',
      appVersion: app.getVersion(),
      clientId,
      preferences: legacyPreferences(),
    };
    return success(bootstrap);
  });
  ipcMain.handle('submit-draft-command', (event, request: unknown): CommandResult => {
    if (!isAllowedSender(event)) return commandFailure('UNAVAILABLE', 'The desktop window is unavailable.');
    const validated = validateDraftCommand(request);
    if (!validated.ok) return commandFailure('INVALID_INPUT', validationErrorToBridgeError(validated.errors).message);
    const clientId = getOrCreateClientId(event.sender);
    if (validated.value.clientId !== clientId) return commandFailure('INVALID_INPUT', 'The command client identity is invalid.');
    const result = draftStore.apply(validated.value, preferences.shortcut, persistenceStatus);
    if (result.ok) {
      scheduleDraftPersistence();
      broadcastDraftChanged(clientId);
    }
    return result;
  });
  ipcMain.handle('copy-compiled-draft', (event, request: unknown): BridgeResult<CopyResult> => {
    if (!isAllowedSender(event)) return failure('UNAVAILABLE', 'The desktop window is unavailable.');
    const validated = validateCopyCompiledDraftRequest(request);
    if (!validated.ok) return failure('INVALID_INPUT', validationErrorToBridgeError(validated.errors).message);
    return compileDraft(validated.value.draftId, validated.value.expectedRevision, validated.value.format);
  });
  ipcMain.handle('get-compiled-draft', (event, request: unknown): BridgeResult<CompiledDraftPreview> => {
    if (!isAllowedSender(event)) return failure('UNAVAILABLE', 'The desktop window is unavailable.');
    const validated = validateGetCompiledDraftRequest(request);
    if (!validated.ok) return failure('INVALID_INPUT', validationErrorToBridgeError(validated.errors).message);
    return getCompiledDraft(validated.value.draftId, validated.value.expectedRevision, validated.value.format);
  });
  ipcMain.handle('copy-library-text', (event, request: unknown): BridgeResult<CopyResult> => {
    if (!isAllowedSender(event)) return failure('UNAVAILABLE', 'The desktop window is unavailable.');
    const validated = validateLibraryCopyTextRequest(request);
    if (!validated.ok) return failure('INVALID_INPUT', validationErrorToBridgeError(validated.errors).message);
    return copyRecord(validated.value);
  });
  ipcMain.handle('get-library-text', (event, request: unknown): BridgeResult<LibraryTextResult> => {
    if (!isAllowedSender(event)) return failure('UNAVAILABLE', 'The desktop window is unavailable.');
    const validated = validateLibraryTextRequest(request);
    if (!validated.ok) return failure('INVALID_INPUT', validationErrorToBridgeError(validated.errors).message);
    return recordText(validated.value);
  });
  ipcMain.handle('set-favorite', async (event, request: unknown) => {
    if (!isAllowedSender(event) || !request || typeof request !== 'object') return failure('UNAVAILABLE', 'The desktop window is unavailable.');
    const candidate = request as Record<string, unknown>;
    const recordId = typeof candidate.recordId === 'string' ? candidate.recordId : candidate.techniqueId;
    const favorited = candidate.favorited;
    if (typeof recordId !== 'string' || typeof favorited !== 'boolean' || (!recordForId(recordId) && !validTechniqueIds.has(recordId))) return failure('INVALID_INPUT', 'Favorite request is invalid.');
    const favoriteRecordIds = favorited ? [...new Set([...preferences.favoriteRecordIds, recordId])] : preferences.favoriteRecordIds.filter((id) => id !== recordId);
    preferences = mergePreferences(preferences, { favoriteRecordIds });
    await persistPreferences();
    return success({ recordId, techniqueId: recordId, favorited, persistenceStatus });
  });
  ipcMain.handle('set-shortcut', async (event, request: unknown) => {
    if (!isAllowedSender(event) || !request || typeof request !== 'object' || typeof (request as { accelerator?: unknown }).accelerator !== 'string') return failure('INVALID_INPUT', 'Shortcut request is invalid.');
    return setShortcut((request as { accelerator: string }).accelerator);
  });
  ipcMain.handle('set-spotlight-size', (event, request: unknown): BridgeResult<{ readonly size: SpotlightSize }> => {
    if (!isAllowedSender(event) || senderSurface(event) !== 'spotlight') return failure('UNAVAILABLE', 'The spotlight window is unavailable.');
    const size = request && typeof request === 'object' ? (request as { size?: unknown }).size : undefined;
    if (size !== 'compact' && size !== 'expanded') return failure('INVALID_INPUT', 'Spotlight size is invalid.');
    if (spotlightSize !== size) {
      spotlightSize = size;
      setSpotlightBounds(size);
    }
    return success({ size });
  });
  ipcMain.handle('show-main', (event) => {
    if (!isAllowedSender(event)) return failure('UNAVAILABLE', 'The desktop window is unavailable.');
    showMain();
    return success({});
  });
  ipcMain.handle('hide-spotlight', (event) => {
    if (!isAllowedSender(event) || senderSurface(event) !== 'spotlight') return failure('UNAVAILABLE', 'The spotlight window is unavailable.');
    hideSpotlight('menu');
    return success({});
  });
  ipcMain.handle('copy-text', (event, request: unknown) => {
    if (!isAllowedSender(event)) return failure('UNAVAILABLE', 'The desktop window is unavailable.');
    if (!request || typeof request !== 'object' || typeof (request as { text?: unknown }).text !== 'string') return failure('INVALID_INPUT', 'Copy text must be a string.');
    return copyText((request as { text: string }).text);
  });
  ipcMain.handle('set-theme-preference', (event) => {
    if (!isAllowedSender(event)) return failure('UNAVAILABLE', 'The desktop window is unavailable.');
    nativeTheme.themeSource = 'dark';
    return failure('INVALID_INPUT', 'Teleprompter uses a dark-only appearance.');
  });
  ipcMain.handle('set-last-mode', (event, request: unknown) => {
    if (!isAllowedSender(event)) return failure('UNAVAILABLE', 'The desktop window is unavailable.');
    const mode = request && typeof request === 'object' ? (request as { mode?: unknown }).mode : undefined;
    if (mode !== 'gallery' && mode !== 'cheatsheet') return failure('INVALID_INPUT', 'Mode is invalid.');
    return success({ lastMode: mode });
  });
};

const createMenu = (): void => {
  const template: Electron.MenuItemConstructorOptions[] = [
    { role: 'appMenu' },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { label: 'Show Cue', click: () => toggleSpotlight('menu') },
        { label: 'Cue', accelerator: 'CommandOrControl+1', click: () => { sendDesktopCommand({ type: 'navigate', view: 'cue' }); sendLegacyCommand('show-gallery'); showMain(); } },
        { label: 'Library', accelerator: 'CommandOrControl+2', click: () => { sendDesktopCommand({ type: 'navigate', view: 'library' }); sendLegacyCommand('show-gallery'); showMain(); } },
        { label: 'Tokens', accelerator: 'CommandOrControl+3', click: () => { sendDesktopCommand({ type: 'navigate', view: 'tokens' }); sendLegacyCommand('show-cheatsheet'); showMain(); } },
        { type: 'separator' },
        { label: 'Search', accelerator: 'CommandOrControl+K', click: () => { sendDesktopCommand({ type: 'focus-search', view: 'cue' }); sendLegacyCommand('focus-search'); showMain(); } },
      ],
    },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

if (!singleInstance) {
  app.quit();
} else {
  app.on('second-instance', () => showMain());
  app.on('before-quit', (event) => {
    if (isQuitting) return;
    isQuitting = true;
    event.preventDefault();
    globalShortcut.unregisterAll();
    void Promise.race([
      Promise.all([persistPreferences(), persistDrafts()]),
      new Promise<void>((resolvePromise) => setTimeout(resolvePromise, 1000)),
    ]).finally(() => app.exit(0));
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('activate', () => { if (!mainWindow || mainWindow.isDestroyed()) void createMainWindow(); else showMain(); });
  app.whenReady().then(async () => {
    nativeTheme.themeSource = 'dark';
    await loadPreferences();
    await loadDrafts();
    registerLocalProtocol();
    registerHandlers();
    createMenu();
    registerInitialShortcut();
    await createMainWindow();
    await createSpotlightWindow();
    screen.on('display-added', reflowVisibleSpotlight);
    screen.on('display-removed', reflowVisibleSpotlight);
    screen.on('display-metrics-changed', reflowVisibleSpotlight);
    if (!permissionHandlerRegistered) {
      permissionHandlerRegistered = true;
      const defaultSession = (await import('electron')).session.defaultSession;
      defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    }
  });
}
