import type { Technique } from './catalog-types';
import type { CommandResult, CopyFormat, CopyResult, CueCommand, CueSnapshot, LibraryView } from './teleprompter-types';

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

export interface CueSurfaceProps {
  readonly surface: 'main' | 'spotlight';
  readonly snapshot: CueSnapshot;
  readonly library: LibraryView;
  readonly dispatch: (command: CueCommand) => Promise<CommandResult>;
  readonly copy: (format: CopyFormat) => Promise<CopyResult>;
  readonly requestSize?: (size: 'compact' | 'expanded') => void;
  readonly dismiss?: () => void;
}
