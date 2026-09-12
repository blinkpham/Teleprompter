import { contextBridge, ipcRenderer } from 'electron';
import type { ImageDirectorBridge, UICommand } from '../shared/desktop-types';

const bridge: ImageDirectorBridge = {
  getBootstrap: () => ipcRenderer.invoke('get-bootstrap'),
  copyText: (request) => ipcRenderer.invoke('copy-text', request),
  setFavorite: (request) => ipcRenderer.invoke('set-favorite', request),
  setThemePreference: (request) => ipcRenderer.invoke('set-theme-preference', request),
  setLastMode: (request) => ipcRenderer.invoke('set-last-mode', request),
  onCommand: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, command: UICommand) => callback(command);
    ipcRenderer.on('ui-command', listener);
    return () => ipcRenderer.removeListener('ui-command', listener);
  },
};

contextBridge.exposeInMainWorld('imageDirector', bridge);
