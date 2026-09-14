import type { Mode, ThemePreference } from './catalog-types';

export type Platform = 'darwin' | 'win32' | 'linux';
export type PersistenceStatus = 'disk' | 'session';
export type UICommand = 'focus-search' | 'show-gallery' | 'show-cheatsheet';

export interface Preferences {
  readonly favoriteTechniqueIds: readonly string[];
  readonly themePreference: ThemePreference;
  readonly lastMode: Mode;
}

export interface WindowBounds {
  readonly width: number;
  readonly height: number;
  readonly x?: number;
  readonly y?: number;
  readonly isMaximized?: boolean;
}

export interface BootstrapData {
  readonly preferences: Preferences;
  readonly platform: Platform;
  readonly appVersion: string;
  readonly persistenceStatus: PersistenceStatus;
}

export interface DesktopError {
  readonly code: 'INVALID_INPUT' | 'UNAVAILABLE' | 'CLIPBOARD_FAILED' | 'INTERNAL';
  readonly message: string;
}

export type DesktopResult<T extends object = Record<string, never>> =
  | ({ readonly ok: true } & T)
  | { readonly ok: false; readonly error: DesktopError };

export interface LegacyTeleprompterBridge {
  readonly getBootstrap: () => Promise<DesktopResult<BootstrapData>>;
  readonly copyText: (request: { readonly text: string }) => Promise<DesktopResult>;
  readonly setFavorite: (request: { readonly techniqueId: string; readonly favorited: boolean }) => Promise<DesktopResult<{ readonly techniqueId: string; readonly favorited: boolean; readonly persistenceStatus: PersistenceStatus }>>;
  readonly setThemePreference: (request: { readonly themePreference: ThemePreference }) => Promise<DesktopResult<{ readonly themePreference: ThemePreference; readonly persistenceStatus: PersistenceStatus }>>;
  readonly setLastMode: (request: { readonly mode: Mode }) => Promise<DesktopResult<{ readonly lastMode: Mode; readonly persistenceStatus: PersistenceStatus }>>;
  readonly onCommand: (callback: (command: UICommand) => void) => () => void;
}

declare global {
  interface Window {
    readonly teleprompterLegacy?: LegacyTeleprompterBridge;
  }
}
