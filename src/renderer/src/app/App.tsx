import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { catalog } from '../../../content/catalog';
import { buildSearchIndex, groupCheatsheetResults, resolvePreset, searchCatalog, selectGalleryResults } from '../../../engine';
import type { CategoryId, FamilyId, Mode, ThemePreference, Technique } from '../../../shared/catalog-types';
import type { BootstrapData, DesktopResult, PersistenceStatus, Platform } from '../../../shared/desktop-types';
import { AppShell } from '../ui/AppShell';
import { CheatsheetView } from '../ui/CheatsheetView';
import { type CopyOutcome } from '../ui/CopyButton';
import { GalleryView } from '../ui/GalleryView';
import { TechniqueSheet } from '../ui/TechniqueSheet';

const searchIndex = buildSearchIndex(catalog);

interface AppState {
  readonly mode: Mode;
  readonly query: string;
  readonly galleryCategory: CategoryId | 'all';
  readonly favoritesOnly: boolean;
  readonly cheatsheetFamily: FamilyId | 'all';
  readonly activeTechniqueId?: string;
  readonly featuredTechniqueId: string;
}

const initialState: AppState = {
  mode: 'gallery',
  query: '',
  galleryCategory: 'all',
  favoritesOnly: false,
  cheatsheetFamily: 'all',
  featuredTechniqueId: 'surgical-edit',
};

type Action =
  | { readonly type: 'mode'; readonly mode: Mode }
  | { readonly type: 'query'; readonly query: string }
  | { readonly type: 'gallery-category'; readonly category: CategoryId | 'all' }
  | { readonly type: 'favorites-only'; readonly enabled: boolean }
  | { readonly type: 'cheatsheet-family'; readonly family: FamilyId | 'all' }
  | { readonly type: 'open-technique'; readonly id: string }
  | { readonly type: 'close-technique' }
  | { readonly type: 'feature'; readonly id: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'mode': return { ...state, mode: action.mode, activeTechniqueId: undefined };
    case 'query': return { ...state, query: action.query, activeTechniqueId: undefined };
    case 'gallery-category': return { ...state, galleryCategory: action.category, activeTechniqueId: undefined };
    case 'favorites-only': return { ...state, favoritesOnly: action.enabled, activeTechniqueId: undefined };
    case 'cheatsheet-family': return { ...state, cheatsheetFamily: action.family };
    case 'open-technique': return { ...state, activeTechniqueId: action.id };
    case 'close-technique': return { ...state, activeTechniqueId: undefined };
    case 'feature': return { ...state, featuredTechniqueId: action.id };
    default: return state;
  }
}

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null);
  const [platform, setPlatform] = useState<Platform>('darwin');
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>('disk');
  const [favoriteIds, setFavoriteIds] = useState<ReadonlySet<string>>(new Set());
  const [acknowledgedFavoriteIds, setAcknowledgedFavoriteIds] = useState<ReadonlySet<string>>(new Set());
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<ReadonlySet<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const results = useMemo(() => searchCatalog(searchIndex, state.query), [state.query]);
  const galleryIds = useMemo(() => selectGalleryResults(results, catalog, state.galleryCategory, state.favoritesOnly, acknowledgedFavoriteIds), [results, state.galleryCategory, state.favoritesOnly, acknowledgedFavoriteIds]);
  const galleryTechniques = useMemo(() => galleryIds.map((id) => catalog.techniqueById[id]).filter((technique): technique is Technique => Boolean(technique)), [galleryIds]);
  const groups = useMemo(() => groupCheatsheetResults(results, catalog, state.cheatsheetFamily), [results, state.cheatsheetFamily]);
  const activeTechnique = state.activeTechniqueId ? catalog.techniqueById[state.activeTechniqueId] : undefined;
  const feature = catalog.techniqueById[state.featuredTechniqueId];
  const linkedEntries = activeTechnique?.shorthandEntryIds.map((id) => catalog.entryById[id]).filter((entry): entry is (typeof catalog.entries)[number] => Boolean(entry)) ?? [];
  const activeCautions = activeTechnique?.cautionIds.map((id) => catalog.cautions.find((caution) => caution.id === id)).filter((caution): caution is (typeof catalog.cautions)[number] => Boolean(caution)) ?? [];

  useEffect(() => {
    let active = true;
    const load = async () => {
      const result = await window.imageDirector?.getBootstrap();
      if (!active || !result?.ok) return;
      setBootstrap(result);
      setPlatform(result.platform);
      setThemePreference(result.preferences.themePreference);
      setPersistenceStatus(result.persistenceStatus);
      const restored = new Set(result.preferences.favoriteTechniqueIds);
      setFavoriteIds(restored);
      setAcknowledgedFavoriteIds(restored);
      dispatch({ type: 'mode', mode: result.preferences.lastMode });
    };
    void load();
    const unsubscribe = window.imageDirector?.onCommand((command) => {
      if (command === 'focus-search') {
        dispatch({ type: 'close-technique' });
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (command === 'show-gallery') dispatch({ type: 'mode', mode: 'gallery' });
      if (command === 'show-cheatsheet') dispatch({ type: 'mode', mode: 'cheatsheet' });
    });
    return () => { active = false; unsubscribe?.(); };
  }, []);

  const copy = useCallback(async (payload: string): Promise<CopyOutcome> => {
    const result: DesktopResult = window.imageDirector
      ? await window.imageDirector.copyText({ text: payload })
      : { ok: false, error: { code: 'UNAVAILABLE', message: 'Open the desktop app to use native copy.' } };
    return result.ok ? { ok: true } : { ok: false, message: result.error.message };
  }, []);

  const changeMode = (mode: Mode) => {
    dispatch({ type: 'mode', mode });
    void window.imageDirector?.setLastMode({ mode }).then((result) => {
      if (result?.ok) setPersistenceStatus(result.persistenceStatus);
    });
  };

  const changeTheme = (theme: ThemePreference) => {
    const previous = themePreference;
    setThemePreference(theme);
    void window.imageDirector?.setThemePreference({ themePreference: theme }).then((result) => {
      if (result?.ok) setPersistenceStatus(result.persistenceStatus);
      else setThemePreference(previous);
    });
  };

  const toggleFavorite = (technique: Technique) => {
    if (pendingFavoriteIds.has(technique.id)) return;
    const favorited = !favoriteIds.has(technique.id);
    setFavoriteIds((previous) => {
      const next = new Set(previous);
      if (favorited) next.add(technique.id); else next.delete(technique.id);
      return next;
    });
    setPendingFavoriteIds((previous) => new Set(previous).add(technique.id));
    const request = window.imageDirector?.setFavorite({ techniqueId: technique.id, favorited });
    if (!request) {
      setPendingFavoriteIds((previous) => { const next = new Set(previous); next.delete(technique.id); return next; });
      setFavoriteIds((previous) => { const next = new Set(previous); if (favorited) next.delete(technique.id); else next.add(technique.id); return next; });
      return;
    }
    void request.then((result) => {
      setPendingFavoriteIds((previous) => { const next = new Set(previous); next.delete(technique.id); return next; });
      if (result.ok) {
        setAcknowledgedFavoriteIds((previous) => { const next = new Set(previous); if (result.favorited) next.add(technique.id); else next.delete(technique.id); return next; });
        setPersistenceStatus(result.persistenceStatus);
      } else {
        setFavoriteIds((previous) => { const next = new Set(previous); if (favorited) next.delete(technique.id); else next.add(technique.id); return next; });
      }
    });
  };

  return <AppShell platform={platform} mode={state.mode} query={state.query} queryCounts={{ gallery: results.techniqueCount, cheatsheet: results.entryCount }} themePreference={themePreference} persistenceStatus={persistenceStatus} appVersion={bootstrap?.appVersion ?? '0.1.0'} searchRef={searchRef} onModeChange={changeMode} onQueryChange={(query) => dispatch({ type: 'query', query })} onThemeChange={changeTheme}>
    <div className="mode-panel" hidden={state.mode !== 'gallery'}>
      <div className="panel-intro"><div><p className="panel-kicker">Source-backed recipes</p><h2>Find a precise change</h2></div><p className="panel-description">Open a technique for the full prompt, linked shorthand, and preservation notes.</p></div>
      <GalleryView techniques={galleryTechniques} categories={catalog.categories} category={state.galleryCategory} favoritesOnly={state.favoritesOnly} favoriteIds={favoriteIds} pendingFavoriteIds={pendingFavoriteIds} hasQuery={!results.isEmptyQuery} feature={feature} shownCount={galleryTechniques.length} copy={copy} onCategoryChange={(category) => dispatch({ type: 'gallery-category', category })} onFavoritesChange={(enabled) => dispatch({ type: 'favorites-only', enabled })} onFeatureChange={(technique) => dispatch({ type: 'feature', id: technique.id })} onOpen={(technique) => { openerRef.current = document.activeElement instanceof HTMLButtonElement ? document.activeElement : null; dispatch({ type: 'open-technique', id: technique.id }); }} onFavorite={toggleFavorite} />
    </div>
    <div className="mode-panel" hidden={state.mode !== 'cheatsheet'}>
      <div className="panel-intro"><div><p className="panel-kicker">104 source-derived rows</p><h2>Keep the shorthand close</h2></div><p className="panel-description">Search a token, inspect its direction, and copy exactly the form the source defines.</p></div>
      <CheatsheetView groups={groups} families={catalog.families} entriesById={catalog.entryById} cautions={catalog.cautions} resolutionExamples={catalog.resolutionExamples} activeFamily={state.cheatsheetFamily} shownCount={groups.reduce((total, group) => total + group.entryIds.length, 0)} copy={copy} resolvePreset={(id) => resolvePreset(id, catalog)} onFamilyChange={(family) => dispatch({ type: 'cheatsheet-family', family })} />
    </div>
    <TechniqueSheet technique={activeTechnique} linkedEntries={linkedEntries} cautions={activeCautions} isFavorite={activeTechnique ? favoriteIds.has(activeTechnique.id) : false} copy={copy} onClose={() => { dispatch({ type: 'close-technique' }); window.setTimeout(() => openerRef.current?.focus(), 0); }} onFavorite={toggleFavorite} />
  </AppShell>;
}
