import { contextBridge, ipcRenderer } from 'electron';
import type { LegacyTeleprompterBridge, UICommand } from '../shared/desktop-types';
import type {
  BridgeResult,
  ChooseReferenceImageRequest,
  ChooseReferenceImageResult,
  CompiledDraftPreview,
  CommandResult,
  CopyCompiledDraftRequest,
  CopyResult,
  CueSnapshot,
  DesktopCommand,
  DraftChangedEvent,
  DraftCommandEnvelope,
  LibraryCopyTextRequest,
  LibraryTextResult,
  ReferenceBindingEnvelope,
  ReferenceBindingsRequest,
  ReferenceBindingsSnapshot,
  ReferenceThumbnailRequest,
  ReferenceThumbnailResult,
  SurfaceLayoutRequest,
  SurfaceLayoutResult,
  TeleprompterBootstrap,
  TeleprompterBridge,
  TeleprompterDesktopBridge,
} from '../shared/teleprompter-types';

type BootstrapWithClient = TeleprompterBootstrap & { readonly clientId?: string };
let assignedClientId: string | undefined;

const teleprompter: TeleprompterBridge = {
  getBootstrap: async () => {
    const result = await ipcRenderer.invoke('get-bootstrap') as BridgeResult<BootstrapWithClient>;
    if (result.ok && result.clientId) assignedClientId = result.clientId;
    return result;
  },
  submitDraftCommand: (request: DraftCommandEnvelope): Promise<CommandResult> => ipcRenderer.invoke('submit-draft-command', {
    ...request,
    ...(assignedClientId === undefined ? {} : { clientId: assignedClientId }),
  }),
  onDraftChanged: (callback: (event: DraftChangedEvent) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, event: DraftChangedEvent) => callback(event);
    ipcRenderer.on('teleprompter:draft-changed', listener);
    return () => ipcRenderer.removeListener('teleprompter:draft-changed', listener);
  },
  copyCompiledDraft: (request: CopyCompiledDraftRequest) => ipcRenderer.invoke('copy-compiled-draft', request),
  copyLibraryText: (request: LibraryCopyTextRequest) => ipcRenderer.invoke('copy-library-text', request),
  getCompiledDraft: (request: CopyCompiledDraftRequest): Promise<BridgeResult<CompiledDraftPreview>> => ipcRenderer.invoke('get-compiled-draft', request),
  getLibraryText: (request: LibraryCopyTextRequest): Promise<BridgeResult<LibraryTextResult>> => ipcRenderer.invoke('get-library-text', request),
  getReferenceBindings: (request: ReferenceBindingsRequest): Promise<BridgeResult<ReferenceBindingsSnapshot>> => ipcRenderer.invoke('get-reference-bindings', request),
  setReferenceBinding: (request: ReferenceBindingEnvelope): Promise<BridgeResult<ReferenceBindingsSnapshot>> => ipcRenderer.invoke('set-reference-binding', request),
  chooseReferenceImage: (request: ChooseReferenceImageRequest): Promise<BridgeResult<ChooseReferenceImageResult>> => ipcRenderer.invoke('choose-reference-image', request),
  getReferenceThumbnail: (request: ReferenceThumbnailRequest): Promise<BridgeResult<ReferenceThumbnailResult>> => ipcRenderer.invoke('get-reference-thumbnail', request),
  setFavorite: (request) => ipcRenderer.invoke('set-favorite', request),
  setShortcut: (request) => ipcRenderer.invoke('set-shortcut', request),
  showMain: () => ipcRenderer.invoke('show-main'),
  hideSpotlight: () => ipcRenderer.invoke('hide-spotlight'),
  onCommand: (callback: (command: DesktopCommand) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, command: DesktopCommand) => callback(command);
    ipcRenderer.on('teleprompter:command', listener);
    return () => ipcRenderer.removeListener('teleprompter:command', listener);
  },
};

const legacy: LegacyTeleprompterBridge = {
  getBootstrap: () => ipcRenderer.invoke('get-bootstrap'),
  copyText: (request) => ipcRenderer.invoke('copy-text', request),
  setFavorite: (request) => ipcRenderer.invoke('set-favorite', request),
  setThemePreference: (request) => ipcRenderer.invoke('set-theme-preference', request),
  setLastMode: (request) => ipcRenderer.invoke('set-last-mode', request),
  onCommand: (callback: (command: UICommand) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, command: UICommand) => callback(command);
    ipcRenderer.on('ui-command', listener);
    return () => ipcRenderer.removeListener('ui-command', listener);
  },
};

contextBridge.exposeInMainWorld('teleprompter', teleprompter);
contextBridge.exposeInMainWorld('teleprompterLegacy', legacy);

// The renderer surface contract intentionally keeps size state enumerated.
const teleprompterDesktop: TeleprompterDesktopBridge = {
  requestSurfaceLayout: (request: SurfaceLayoutRequest): Promise<BridgeResult<SurfaceLayoutResult>> => ipcRenderer.invoke('request-surface-layout', request),
  requestSize: (size: 'compact' | 'expanded'): Promise<BridgeResult<{ readonly size: 'compact' | 'expanded' }>> => ipcRenderer.invoke('set-spotlight-size', { size }),
};

contextBridge.exposeInMainWorld('teleprompterDesktop', teleprompterDesktop);
