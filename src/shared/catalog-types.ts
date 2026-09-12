export type Mode = 'gallery' | 'cheatsheet';
export type ThemePreference = 'system' | 'light' | 'dark';
export type CategoryId =
  | 'local-edits'
  | 'reference-transfers'
  | 'camera-framing'
  | 'finish-quality'
  | 'motion';
export type FamilyId =
  | 'routes'
  | 'render'
  | 'camera'
  | 'angles'
  | 'composition'
  | 'lighting'
  | 'looks'
  | 'depth-focus'
  | 'presets'
  | 'reference-patterns';
export type CautionId =
  | 'preservation'
  | 'reference-roles'
  | 'camera-cues'
  | 'render-size'
  | 'restoration';

export interface Category {
  readonly id: CategoryId;
  readonly label: string;
  readonly order: number;
}

export interface Family {
  readonly id: FamilyId;
  readonly label: string;
  readonly order: number;
  readonly introCautionIds: readonly CautionId[];
}

export interface SourceRef {
  readonly file: string;
  readonly heading: string;
}

export interface Caution {
  readonly id: CautionId;
  readonly text: string;
}

export interface ResolutionExample {
  readonly renderEntryId: string;
  readonly aspectRatioLabel: string;
  readonly pixelsText: string;
  readonly note?: string;
}

export interface Technique {
  readonly id: string;
  readonly title: string;
  readonly categoryId: CategoryId;
  readonly summary: string;
  readonly prompt: string;
  readonly shorthandTemplate: string;
  readonly shorthandEntryIds: readonly string[];
  readonly tags: readonly string[];
  readonly searchTerms: readonly string[];
  readonly example?: string;
  readonly cautionIds: readonly CautionId[];
  readonly previewId: string;
  readonly order: number;
  readonly sources: readonly SourceRef[];
}

export interface ShorthandEntry {
  readonly id: string;
  readonly kind: 'token' | 'pattern';
  readonly familyId: Exclude<FamilyId, 'presets'>;
  readonly token: string;
  readonly aliases: readonly string[];
  readonly meaning: string;
  readonly direction: string;
  readonly example?: string;
  readonly searchTerms: readonly string[];
  readonly cautionIds: readonly CautionId[];
  readonly order: number;
  readonly sources: readonly SourceRef[];
}

export interface Preset {
  readonly id: string;
  readonly kind: 'preset';
  readonly familyId: 'presets';
  readonly token: string;
  readonly meaning: string;
  readonly componentEntryIds: readonly string[];
  readonly example?: string;
  readonly searchTerms: readonly string[];
  readonly cautionIds: readonly CautionId[];
  readonly order: number;
  readonly sources: readonly SourceRef[];
}

export type CheatsheetEntry = ShorthandEntry | Preset;

export interface Catalog {
  readonly categories: readonly Category[];
  readonly families: readonly Family[];
  readonly cautions: readonly Caution[];
  readonly resolutionExamples: readonly ResolutionExample[];
  readonly techniques: readonly Technique[];
  readonly entries: readonly CheatsheetEntry[];
  readonly techniqueIds: readonly string[];
  readonly techniqueById: Readonly<Record<string, Technique>>;
  readonly entryById: Readonly<Record<string, CheatsheetEntry>>;
  readonly familyById: Readonly<Record<string, Family>>;
}

export interface SearchMatch {
  readonly id: string;
  readonly score: number;
}

export interface SearchResults {
  readonly query: string;
  readonly isEmptyQuery: boolean;
  readonly techniqueMatches: readonly SearchMatch[];
  readonly entryMatches: readonly SearchMatch[];
  readonly techniqueCount: number;
  readonly entryCount: number;
}

export interface SearchIndex {
  readonly catalog: Catalog;
  readonly techniques: Readonly<Record<string, string>>;
  readonly entries: Readonly<Record<string, string>>;
}

export interface ResolvedPreset {
  readonly preset: Preset;
  readonly components: readonly ShorthandEntry[];
  readonly componentsText: string;
  readonly expandedText: string;
  readonly cautionIds: readonly CautionId[];
}
