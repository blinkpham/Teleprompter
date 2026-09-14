import type { Technique } from './catalog-types';
import type {
  BridgeError,
  BridgeResult,
  ChooseReferenceImageResult,
  CommandResult,
  CopyFormat,
  CopyResult,
  CueCommand,
  CueSnapshot,
  LibraryView,
  PreviewIntent,
  PreviewRequest,
  ReferenceBinding,
  ReferenceBindingsSnapshot,
  ReferenceThumbnailResult,
  SurfaceLayoutRequest,
  SurfaceLayoutResult,
} from './teleprompter-types';

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
  readonly preview?: PreviewPresentation;
  readonly requestPreview?: (request: PreviewIntent) => Promise<void>;
  readonly requestSurfaceLayout?: (request: SurfaceLayoutRequest) => Promise<BridgeResult<SurfaceLayoutResult>>;
  readonly requestSize?: (size: 'compact' | 'expanded') => void;
  readonly references?: ReferenceSurfaceProps;
  readonly dismiss?: () => void;
}

export interface ReferenceSurfaceProps {
  readonly snapshot: ReferenceBindingsSnapshot | null;
  readonly loading: boolean;
  readonly error?: string;
  readonly refresh: () => Promise<void>;
  readonly upsert: (binding: ReferenceBinding) => Promise<BridgeResult<ReferenceBindingsSnapshot>>;
  readonly remove: (binding: Pick<ReferenceBinding, 'bindingId' | 'imageNumber' | 'draftId'>) => Promise<BridgeResult<ReferenceBindingsSnapshot>>;
  readonly chooseImage: (imageNumber: number) => Promise<BridgeResult<ChooseReferenceImageResult>>;
  readonly getThumbnail: (thumbnailHandle: string) => Promise<BridgeResult<ReferenceThumbnailResult>>;
}

export interface PreviewIdentity {
  readonly requestId: string;
  readonly draftId: PreviewRequest['draftId'];
  readonly revision: number;
  readonly format: CopyFormat;
  readonly contentVersion: string;
}

export type PreviewPresentation =
  | { readonly status: 'idle' }
  | { readonly status: 'pending'; readonly request: PreviewRequest }
  | { readonly status: 'ready'; readonly request: PreviewRequest; readonly identity: PreviewIdentity; readonly result: import('./teleprompter-types').CompiledDraftPreview }
  | { readonly status: 'error'; readonly request: PreviewRequest; readonly error: BridgeError };
