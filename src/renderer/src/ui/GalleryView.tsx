import { Heart, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import type { Category, CategoryId, Technique } from '../../../shared/catalog-types';
import poolPhotoUrl from '../assets/pool-photo.webp';
import { CopyButton, type CopyOutcome } from './CopyButton';
import { PreviewDiagram } from './PreviewDiagram';
import { TechniqueCard } from './TechniqueCard';

interface GalleryViewProps {
  readonly techniques: readonly Technique[];
  readonly categories: readonly Category[];
  readonly category: CategoryId | 'all';
  readonly favoritesOnly: boolean;
  readonly favoriteIds: ReadonlySet<string>;
  readonly pendingFavoriteIds: ReadonlySet<string>;
  readonly hasQuery: boolean;
  readonly feature: Technique | undefined;
  readonly shownCount: number;
  readonly copy: (payload: string) => Promise<CopyOutcome>;
  readonly onCategoryChange: (category: CategoryId | 'all') => void;
  readonly onFavoritesChange: (enabled: boolean) => void;
  readonly onFeatureChange: (technique: Technique) => void;
  readonly onOpen: (technique: Technique) => void;
  readonly onFavorite: (technique: Technique) => void;
}

export function GalleryView({ techniques, categories, category, favoritesOnly, favoriteIds, pendingFavoriteIds, hasQuery, feature, shownCount, copy, onCategoryChange, onFavoritesChange, onFeatureChange, onOpen, onFavorite }: GalleryViewProps) {
  const showFeature = !hasQuery && category === 'all' && !favoritesOnly && Boolean(feature);
  const featureChoices = useMemo(() => techniques.filter((technique) => ['surgical-edit', 'multi-reference-composite', 'quality-restoration'].includes(technique.id)), [techniques]);

  return <section className="gallery-view" aria-label="Prompt gallery">
    {showFeature && feature && <article className="feature-card">
      <div className="feature-photo" aria-hidden="true"><img src={poolPhotoUrl} alt="" /><PreviewDiagram technique={feature} /></div>
      <div className="feature-scrim" />
      <div className="feature-copy"><p className="feature-category">{categories.find((item) => item.id === feature.categoryId)?.label}</p><h2>{feature.title}</h2><p>{feature.summary}</p><div className="feature-actions"><button type="button" className="feature-primary" onClick={() => onOpen(feature)}>View prompt</button><CopyButton payload={feature.prompt} actionLabel="Copy prompt" copy={copy} /></div></div>
      <div className="feature-tray" aria-label="Featured techniques">{featureChoices.map((choice) => <button key={choice.id} type="button" aria-label={`Feature ${choice.title}`} aria-pressed={choice.id === feature.id} className={choice.id === feature.id ? 'feature-thumb selected' : 'feature-thumb'} onClick={() => onFeatureChange(choice)}><PreviewDiagram technique={choice} compact /></button>)}</div>
    </article>}
    <div className="gallery-toolbar">
      <div className="toolbar-left"><label className="select-wrap"><span className="sr-only">Category</span><select value={category} onChange={(event) => onCategoryChange(event.target.value as CategoryId | 'all')}><option value="all">All categories</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><button type="button" className={favoritesOnly ? 'filter-button selected' : 'filter-button'} aria-pressed={favoritesOnly} onClick={() => onFavoritesChange(!favoritesOnly)}><Heart size={16} fill={favoritesOnly ? 'currentColor' : 'none'} /> Favorites</button></div>
      <span className="shown-count">{shownCount} shown</span>
    </div>
    {techniques.length > 0 ? <div className="technique-grid">{techniques.map((technique) => <TechniqueCard key={technique.id} technique={technique} categoryLabel={categories.find((item) => item.id === technique.categoryId)?.label ?? ''} isFavorite={favoriteIds.has(technique.id)} isPending={pendingFavoriteIds.has(technique.id)} copy={copy} onOpen={onOpen} onFavorite={onFavorite} />)}</div> : <EmptyGallery favoritesOnly={favoritesOnly} hasQuery={hasQuery} />}
  </section>;
}

function EmptyGallery({ favoritesOnly, hasQuery }: { readonly favoritesOnly: boolean; readonly hasQuery: boolean }) {
  return <div className="empty-state"><Sparkles size={22} /><h2>{favoritesOnly ? 'No favorites yet' : hasQuery ? 'No prompts match' : 'No prompts in this filter'}</h2><p>{favoritesOnly ? 'Save a technique with the heart button to build a short list.' : 'Try a broader search or choose another category.'}</p></div>;
}
