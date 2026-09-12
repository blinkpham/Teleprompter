import { useEffect, useMemo, useState } from 'react';
import { Search, Copy, Check, Images, ListFilter } from 'lucide-react';
import { catalog } from '../../../content/catalog';
import { buildSearchIndex, searchCatalog } from '../../../engine';
import type { Mode } from '../../../shared/catalog-types';
import type { BootstrapData, DesktopResult } from '../../../shared/desktop-types';

const index = buildSearchIndex(catalog);

export function App() {
  const [mode, setMode] = useState<Mode>('gallery');
  const [query, setQuery] = useState('');
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const technique = catalog.techniques[0];
  const results = useMemo(() => searchCatalog(index, query), [query]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const result = await window.imageDirector?.getBootstrap();
      if (active && result?.ok) {
        setBootstrap(result);
        setMode(result.preferences.lastMode);
      }
    };
    void load();
    const unsubscribe = window.imageDirector?.onCommand((command) => {
      if (command === 'show-gallery') setMode('gallery');
      if (command === 'show-cheatsheet') setMode('cheatsheet');
      if (command === 'focus-search') document.querySelector<HTMLInputElement>('#search')?.focus();
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const copyPrompt = async () => {
    if (!technique) return;
    setCopied(false);
    setCopyMessage('');
    const result: DesktopResult = window.imageDirector
      ? await window.imageDirector.copyText({ text: technique.prompt })
      : { ok: false, error: { code: 'UNAVAILABLE', message: 'Open the desktop app to use native copy.' } };
    if (result.ok) {
      setCopied(true);
      setCopyMessage('Copied through the desktop clipboard.');
      window.setTimeout(() => setCopied(false), 1600);
    } else {
      setCopyMessage(result.error.message);
    }
  };

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    void window.imageDirector?.setLastMode({ mode: nextMode });
  };

  return (
    <main className="app-shell">
      <aside className="rail" aria-label="Primary navigation">
        <div className="brand-mark" aria-label="Image Director">ID</div>
        <div className="mode-tabs" role="tablist" aria-label="View mode">
          <button className={mode === 'gallery' ? 'mode-tab selected' : 'mode-tab'} role="tab" aria-selected={mode === 'gallery'} onClick={() => changeMode('gallery')}>
            <Images size={20} />
            <span>Gallery</span>
          </button>
          <button className={mode === 'cheatsheet' ? 'mode-tab selected' : 'mode-tab'} role="tab" aria-selected={mode === 'cheatsheet'} onClick={() => changeMode('cheatsheet')}>
            <ListFilter size={20} />
            <span>Cheatsheet</span>
          </button>
        </div>
        <div className="rail-note">Offline<br />prompt library</div>
      </aside>

      <section className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Image Director</p>
            <h1>{mode === 'gallery' ? 'Gallery' : 'Cheatsheet'}</h1>
            <p className="subheading">{mode === 'gallery' ? 'Reusable prompts for precise image edits.' : 'Production shorthand, meanings, and source direction.'}</p>
          </div>
          <label className="search-field" htmlFor="search">
            <Search size={17} aria-hidden="true" />
            <input id="search" value={query} onChange={(event) => setQuery(event.target.value.slice(0, 200))} placeholder="Search prompts and shorthand" />
            {query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}>×</button>}
          </label>
        </header>

        <div className="content-area">
          <div className="status-row" aria-live="polite">
            <span>{query ? `${results.techniqueCount} Gallery · ${results.entryCount} Cheatsheet matches` : 'Slice A seed catalog'}</span>
            {bootstrap && <span className="persistence-status">Preferences: {bootstrap.preferences.themePreference} · {bootstrap.persistenceStatus}</span>}
          </div>

          {mode === 'gallery' ? (
            <article className="seed-card">
              <div className="seed-preview" aria-hidden="true"><span>Diagram</span><div className="target-corner" /></div>
              <div className="seed-copy">
                <p className="eyebrow">{technique?.categoryId.replace('-', ' ')}</p>
                <h2>{technique?.title}</h2>
                <p className="summary">{technique?.summary}</p>
                <div className="prompt-block">
                  <p className="prompt-label">Full prompt</p>
                  <p className="prompt-text">{technique?.prompt}</p>
                </div>
                <div className="action-row">
                  <button className="primary-button" type="button" onClick={() => void copyPrompt()}>{copied ? <Check size={17} /> : <Copy size={17} />} {copied ? 'Copied' : 'Copy prompt'}</button>
                  <code>{technique?.shorthandTemplate}</code>
                </div>
                <p className={copyMessage ? 'copy-message visible' : 'copy-message'}>{copyMessage}</p>
              </div>
            </article>
          ) : (
            <article className="cheatsheet-seed">
              <p className="eyebrow">Reference row</p>
              <div className="token-row"><code>fix:</code><span>Make one precise local correction.</span><button type="button" onClick={() => void copyText('fix:')}><Copy size={16} /> Copy token</button></div>
              <div className="token-row"><code>hq</code><span>Request a quality-restoration pass.</span><button type="button" onClick={() => void copyText('hq')}><Copy size={16} /> Copy token</button></div>
              <div className="token-row"><code>cam:wide35</code><span>Use a versatile environmental advertising feel.</span><button type="button" onClick={() => void copyText('cam:wide35')}><Copy size={16} /> Copy token</button></div>
            </article>
          )}
        </div>
      </section>
    </main>
  );

  async function copyText(text: string) {
    const result: DesktopResult = window.imageDirector
      ? await window.imageDirector.copyText({ text })
      : { ok: false, error: { code: 'UNAVAILABLE', message: 'Open the desktop app to use native copy.' } };
    setCopyMessage(result.ok ? `Copied “${text}”.` : result.error.message);
  }
}
