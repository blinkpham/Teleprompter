import { Images, ListFilter, Search, SunMoon, X } from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Mode, ThemePreference } from '../../../shared/catalog-types';
import type { PersistenceStatus, Platform } from '../../../shared/desktop-types';

interface AppShellProps {
  readonly platform: Platform;
  readonly mode: Mode;
  readonly query: string;
  readonly queryCounts: { readonly gallery: number; readonly cheatsheet: number };
  readonly themePreference: ThemePreference;
  readonly persistenceStatus: PersistenceStatus;
  readonly appVersion: string;
  readonly searchRef: RefObject<HTMLInputElement | null>;
  readonly onModeChange: (mode: Mode) => void;
  readonly onQueryChange: (query: string) => void;
  readonly onThemeChange: (theme: ThemePreference) => void;
  readonly children: React.ReactNode;
}

export function AppShell({ platform, mode, query, queryCounts, themePreference, persistenceStatus, appVersion, searchRef, onModeChange, onQueryChange, onThemeChange, children }: AppShellProps) {
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const appearanceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (themePreference === 'system') delete root.dataset.theme;
    else root.dataset.theme = themePreference;
  }, [themePreference]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (appearanceOpen && appearanceRef.current && !appearanceRef.current.contains(event.target as Node)) setAppearanceOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [appearanceOpen]);

  const moveMode = (direction: 'previous' | 'next' | 'first' | 'last') => {
    const modes: Mode[] = ['gallery', 'cheatsheet'];
    const index = modes.indexOf(mode);
    const next = direction === 'first' ? 0 : direction === 'last' ? modes.length - 1 : direction === 'next' ? Math.min(index + 1, modes.length - 1) : Math.max(index - 1, 0);
    onModeChange(modes[next] ?? mode);
  };

  return (
    <main className="app-shell" data-platform={platform}>
      <aside className="rail" aria-label="Primary navigation">
        <div className="brand-lockup"><div className="brand-mark">ID</div><span>Image<br />Director</span></div>
        <ModeControl mode={mode} counts={queryCounts} onModeChange={onModeChange} onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { event.preventDefault(); moveMode('next'); }
          if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); moveMode('previous'); }
          if (event.key === 'Home') { event.preventDefault(); moveMode('first'); }
          if (event.key === 'End') { event.preventDefault(); moveMode('last'); }
        }} />
        <div className="appearance-wrap" ref={appearanceRef}>
          <button type="button" className="appearance-button" aria-expanded={appearanceOpen} aria-haspopup="dialog" onClick={() => setAppearanceOpen((open) => !open)}><SunMoon size={18} /><span>Appearance</span>{persistenceStatus === 'session' && <i aria-label="Session-only changes" />}</button>
          {appearanceOpen && <AppearancePopover themePreference={themePreference} persistenceStatus={persistenceStatus} appVersion={appVersion} onThemeChange={onThemeChange} onClose={() => setAppearanceOpen(false)} />}
        </div>
      </aside>
      <section className="workspace">
        <header className="workspace-header">
          <div className="heading-group">
            <h1>{mode === 'gallery' ? 'Gallery' : 'Cheatsheet'}</h1>
            <p>{mode === 'gallery' ? 'Reusable prompts for precise image edits.' : 'Production shorthand, meanings, and source direction.'}</p>
          </div>
          <label className="search-field" htmlFor="search">
            <Search size={17} aria-hidden="true" />
            <input ref={searchRef} id="search" value={query} onChange={(event) => onQueryChange(event.target.value.slice(0, 200))} placeholder="Search prompts and shorthand" aria-label="Search prompts and shorthand" />
            {query ? <button type="button" aria-label="Clear search" onClick={() => onQueryChange('')}><X size={16} /></button> : <span className="shortcut-hint">{platform === 'darwin' ? '⌘K' : 'Ctrl K'}</span>}
          </label>
        </header>
        <div className="content-scroll" aria-live="off">{children}</div>
      </section>
    </main>
  );
}

function ModeControl({ mode, counts, onModeChange, onKeyDown }: { readonly mode: Mode; readonly counts: { readonly gallery: number; readonly cheatsheet: number }; readonly onModeChange: (mode: Mode) => void; readonly onKeyDown: (event: React.KeyboardEvent) => void }) {
  return <div className="mode-control" role="tablist" aria-label="View mode" onKeyDown={onKeyDown}>
    <button type="button" role="tab" tabIndex={mode === 'gallery' ? 0 : -1} aria-selected={mode === 'gallery'} className={mode === 'gallery' ? 'mode-tab selected' : 'mode-tab'} onClick={() => onModeChange('gallery')}><Images size={20} /><span>Gallery{counts.gallery > 0 && <small>{counts.gallery}</small>}</span></button>
    <button type="button" role="tab" tabIndex={mode === 'cheatsheet' ? 0 : -1} aria-selected={mode === 'cheatsheet'} className={mode === 'cheatsheet' ? 'mode-tab selected' : 'mode-tab'} onClick={() => onModeChange('cheatsheet')}><ListFilter size={20} /><span>Cheatsheet{counts.cheatsheet > 0 && <small>{counts.cheatsheet}</small>}</span></button>
  </div>;
}

function AppearancePopover({ themePreference, persistenceStatus, appVersion, onThemeChange, onClose }: { readonly themePreference: ThemePreference; readonly persistenceStatus: PersistenceStatus; readonly appVersion: string; readonly onThemeChange: (theme: ThemePreference) => void; readonly onClose: () => void }) {
  return <div className="appearance-popover" role="dialog" aria-label="Appearance settings">
    <div className="popover-heading"><strong>Appearance</strong><button type="button" aria-label="Close appearance" onClick={onClose}><X size={15} /></button></div>
    <fieldset><legend className="sr-only">Theme</legend>{(['system', 'light', 'dark'] as ThemePreference[]).map((theme) => <label key={theme} className="radio-row"><input type="radio" name="theme" checked={themePreference === theme} onChange={() => onThemeChange(theme)} /><span>{theme.charAt(0).toUpperCase() + theme.slice(1)}</span></label>)}</fieldset>
    <p className="popover-credit">Photo: Komet Flicker / Pexels<br />Teleprompter {appVersion}</p>
    {persistenceStatus === 'session' && <p className="session-warning">Changes are saved for this session only.</p>}
  </div>;
}
