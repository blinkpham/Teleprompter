import type { Technique } from './catalog-types';

export type CopyText = (payload: string) => Promise<{ readonly ok: boolean; readonly message?: string }>;

export interface CopyButtonProps {
  readonly payload: string;
  readonly actionLabel: string;
  readonly successLabel: string;
  readonly copy: CopyText;
}

export interface TechniqueCardProps {
  readonly technique: Technique;
  readonly isFavorite: boolean;
  readonly isPending: boolean;
  readonly onOpen: (technique: Technique) => void;
  readonly onFavorite: (technique: Technique) => void;
  readonly onCopy: (technique: Technique) => void;
}
