import { Heart } from 'lucide-react';
import type { Technique } from '../../../shared/catalog-types';
import { CopyButton, type CopyOutcome } from './CopyButton';
import { PreviewDiagram } from './PreviewDiagram';

interface TechniqueCardProps {
  readonly technique: Technique;
  readonly categoryLabel: string;
  readonly isFavorite: boolean;
  readonly isPending: boolean;
  readonly copy: (payload: string) => Promise<CopyOutcome>;
  readonly onOpen: (technique: Technique) => void;
  readonly onFavorite: (technique: Technique) => void;
}

export function TechniqueCard({ technique, categoryLabel, isFavorite, isPending, copy, onOpen, onFavorite }: TechniqueCardProps) {
  return (
    <article className="technique-card">
      <div className="card-media">
        <button type="button" className="card-open" onClick={() => onOpen(technique)} aria-label={`Open ${technique.title}`}>
          <PreviewDiagram technique={technique} compact />
          <span className="card-open-text">Open prompt</span>
        </button>
        <button type="button" className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`} onClick={() => onFavorite(technique)} disabled={isPending} aria-pressed={isFavorite} aria-label={`${isFavorite ? 'Remove' : 'Add'} ${technique.title} to favorites`}>
          <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="card-body">
        <p className="card-category">{categoryLabel}</p>
        <h3>{technique.title}</h3>
        <p className="card-summary">{technique.summary}</p>
        <div className="card-footer">
          <code>{technique.shorthandTemplate}</code>
          <CopyButton payload={technique.prompt} actionLabel="Copy prompt" copy={copy} />
        </div>
      </div>
    </article>
  );
}
