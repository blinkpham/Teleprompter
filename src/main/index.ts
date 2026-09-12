import { app, BrowserWindow, clipboard, Menu, ipcMain, nativeTheme, protocol } from 'electron';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Mode, ThemePreference } from '../shared/catalog-types';
import type { DesktopResult, UICommand } from '../shared/desktop-types';
import { techniqueIds } from '../content/catalog';
import { DEFAULT_PREFERENCES, type PreferencesDocument, mergePreferences, validatePreferences } from './preferences';

protocol.registerSchemesAsPrivileged([{
  scheme: 'image-director',
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: false },
}]);

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const validTechniqueIds = new Set(techniqueIds);
let mainWindow: BrowserWindow | null = null;
let preferences = DEFAULT_PREFERENCES;
let persistenceStatus: 'disk' | 'session' = 'disk';
let writeQueue = Promise.resolve();
let handlersRegistered = false;

const preferencesPath = (): string => join(app.getPath('userData'), 'preferences.json');

const registerLocalProtocol = (): void => {
  const rendererRoot = join(__dirname, '../renderer');
  protocol.handle('image-director', async (request) => {
    try {
      if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method Not Allowed', { status: 405 });
      const url = new URL(request.url);
      if (url.host !== 'app' || url.username || url.password || url.port) return new Response('Not Found', { status: 404 });
      const decodedPath = decodeURIComponent(url.pathname);
      if (decodedPath.includes('\\') || decodedPath.split('/').includes('..')) return new Response('Bad Request', { status: 400 });
      const relativePath = decodedPath === '/' || decodedPath === '/index.html' ? 'index.html' : decodedPath.replace(/^\//, '');
      const filePath = join(rendererRoot, relativePath);
      if (!filePath.startsWith(`${rendererRoot}/`)) return new Response('Forbidden', { status: 403 });
      const body = await fs.readFile(filePath);
      const contentType = filePath.endsWith('.html') ? 'text/html; charset=utf-8'
        : filePath.endsWith('.js') ? 'text/javascript; charset=utf-8'
          : filePath.endsWith('.css') ? 'text/css; charset=utf-8'
            : filePath.endsWith('.webp') ? 'image/webp'
              : filePath.endsWith('.svg') ? 'image/svg+xml'
                : filePath.endsWith('.png') ? 'image/png'
                  : filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') ? 'image/jpeg'
                    : 'application/octet-stream';
      return new Response(request.method === 'HEAD' ? null : body, { status: 200, headers: { 'content-type': contentType, 'cache-control': 'no-store' } });
    } catch {
      return new Response('Not Found', { status: 404 });
    }
  });
};

const failure = (code: 'INVALID_INPUT' | 'UNAVAILABLE' | 'CLIPBOARD_FAILED' | 'INTERNAL', message: string): DesktopResult => ({ ok: false, error: { code, message } });

const success = <T extends object>(data: T): DesktopResult<T> => ({ ok: true, ...data });

const isAllowedSender = (event: Electron.IpcMainInvokeEvent): boolean => Boolean(mainWindow && event.sender === mainWindow.webContents && event.senderFrame === mainWindow.webContents.mainFrame);

const queueWrite = (next: PreferencesDocument): Promise<void> => {
  preferences = next;
  const document = JSON.stringify(next, null, 2);
  writeQueue = writeQueue.then(async () => {
    try {
      await fs.mkdir(app.getPath('userData'), { recursive: true });
      const temporaryPath = `${preferencesPath()}.tmp`;
      await fs.writeFile(temporaryPath, document, 'utf8');
      await fs.rename(temporaryPath, preferencesPath());
      persistenceStatus = 'disk';
    } catch {
      persistenceStatus = 'session';
    }
  });
  return writeQueue;
};

const loadPreferences = async (): Promise<void> => {
  try {
    const raw = await fs.readFile(preferencesPath(), 'utf8');
    preferences = validatePreferences(JSON.parse(raw), validTechniqueIds);
  } catch {
    preferences = DEFAULT_PREFERENCES;
  }
};

const sendCommand = (command: UICommand): void => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('ui-command', command);
};

const registerHandlers = (): void => {
  if (handlersRegistered) return;
  handlersRegistered = true;
  ipcMain.handle('get-bootstrap', (event) => {
    if (!isAllowedSender(event)) return failure('UNAVAILABLE', 'The desktop window is unavailable.');
    return success({ preferences, platform: process.platform as 'darwin' | 'win32' | 'linux', appVersion: app.getVersion(), persistenceStatus });
  });
  ipcMain.handle('copy-text', (event, request: unknown) => {
    if (!isAllowedSender(event)) return failure('UNAVAILABLE', 'The desktop window is unavailable.');
    if (!request || typeof request !== 'object' || typeof (request as { text?: unknown }).text !== 'string') return failure('INVALID_INPUT', 'Copy text must be a string.');
    const text = (request as { text: string }).text;
    if (text.length === 0 || Buffer.byteLength(text, 'utf8') > 64 * 1024) return failure('INVALID_INPUT', 'Copy text must be between 1 and 64 KiB.');
    try {
      clipboard.writeText(text);
      return success({});
    } catch {
      return failure('CLIPBOARD_FAILED', "Couldn't copy the text.");
    }
  });
  ipcMain.handle('set-favorite', async (event, request: unknown) => {
    if (!isAllowedSender(event)) return failure('UNAVAILABLE', 'The desktop window is unavailable.');
    if (!request || typeof request !== 'object') return failure('INVALID_INPUT', 'Favorite request is invalid.');
    const { techniqueId, favorited } = request as { techniqueId?: unknown; favorited?: unknown };
    if (typeof techniqueId !== 'string' || !validTechniqueIds.has(techniqueId) || typeof favorited !== 'boolean') return failure('INVALID_INPUT', 'Favorite request is invalid.');
    const favoriteTechniqueIds = favorited
      ? [...new Set([...preferences.favoriteTechniqueIds, techniqueId])]
      : preferences.favoriteTechniqueIds.filter((id) => id !== techniqueId);
    await queueWrite(mergePreferences(preferences, { favoriteTechniqueIds }));
    return success({ techniqueId, favorited, persistenceStatus });
  });
  ipcMain.handle('set-theme-preference', async (event, request: unknown) => {
    if (!isAllowedSender(event)) return failure('UNAVAILABLE', 'The desktop window is unavailable.');
    const themePreference = request && typeof request === 'object' ? (request as { themePreference?: unknown }).themePreference : undefined;
    if (themePreference !== 'system' && themePreference !== 'light' && themePreference !== 'dark') return failure('INVALID_INPUT', 'Theme preference is invalid.');
    nativeTheme.themeSource = themePreference;
    await queueWrite(mergePreferences(preferences, { themePreference }));
    return success({ themePreference, persistenceStatus });
  });
  ipcMain.handle('set-last-mode', async (event, request: unknown) => {
    if (!isAllowedSender(event)) return failure('UNAVAILABLE', 'The desktop window is unavailable.');
    const mode = request && typeof request === 'object' ? (request as { mode?: unknown }).mode : undefined;
    if (mode !== 'gallery' && mode !== 'cheatsheet') return failure('INVALID_INPUT', 'Mode is invalid.');
    await queueWrite(mergePreferences(preferences, { lastMode: mode as Mode }));
    return success({ lastMode: mode as Mode, persistenceStatus });
  });
};

const createMenu = (): void => {
  const template: Electron.MenuItemConstructorOptions[] = [
    { role: 'appMenu' },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { label: 'Search', accelerator: 'CommandOrControl+K', click: () => sendCommand('focus-search') },
        { label: 'Gallery', accelerator: 'CommandOrControl+1', click: () => sendCommand('show-gallery') },
        { label: 'Cheatsheet', accelerator: 'CommandOrControl+2', click: () => sendCommand('show-cheatsheet') },
      ],
    },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: preferences.window.width,
    height: preferences.window.height,
    minWidth: 640,
    minHeight: 600,
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#101c20' : '#f4f7f6',
    title: 'Image Director',
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      webviewTag: false,
    },
  });
  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('closed', () => { mainWindow = null; });
  const rendererUrl = process.env.ELECTRON_RENDERER_URL;
  if (rendererUrl) {
    void mainWindow.loadURL(rendererUrl);
  } else {
    void mainWindow.loadURL('image-director://app/index.html');
  }
};

void app.whenReady().then(async () => {
  app.setName('Image Director');
  await loadPreferences();
  nativeTheme.themeSource = preferences.themePreference;
  registerLocalProtocol();
  registerHandlers();
  createMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow?.show();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
