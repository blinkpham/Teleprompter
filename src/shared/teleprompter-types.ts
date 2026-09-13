/**
 * Shared contracts for the Teleprompter upgrade.
 *
 * These types are deliberately independent of Electron, React, filesystem
 * state, and the legacy Image Director catalog. The engine owns semantics;
 * desktop owns revisions and persistence; renderers consume projections.
 */

export type Mode = 'create' | 'edit';
export type View = 'cue' | 'library' | 'tokens';
export type Field = 'cam' | 'angle' | 'comp' | 'light' | 'look' | 'mood'
  | 'important' | 'avoid' | 'output';
export type Domain = 'identity' | 'pose' | 'wardrobe' | 'camera' | 'composition'
  | 'background' | 'lighting' | 'style' | 'color' | 'detail' | 'output';
export type Id = string;
export type SourceId = string;

export type PersistenceStatus = 'disk' | 'session' | 'recovery';
export type CopyFormat = 'expanded' | 'shorthand';
export type RecordCopyFormat = CopyFormat | 'original';

export interface Taxon {
  readonly id: Id;
  readonly tree: 'units' | 'presets' | 'edits';
  readonly parentId?: Id;
  readonly label: string;
  readonly definition: string;
  readonly inclusion: string;
  readonly exclusion: string;
  readonly order: number;
}

export interface Axis {
  readonly id: Id;
  readonly field: Field;
  readonly label: string;
  readonly cardinality: 'one' | 'many';
  readonly domain: Domain;
  readonly order: number;
}

export interface CommonRecord {
  readonly id: Id;
  readonly label: string;
  readonly shorthand: string;
  readonly aliases: readonly string[];
  readonly summary: string;
  readonly primaryTaxonId: Id;
  readonly facets: Readonly<Record<string, readonly string[]>>;
  readonly sourceIds: readonly SourceId[];
  readonly cautionIds: readonly Id[];
  readonly order: number;
  readonly status: 'active' | 'deprecated';
  readonly replacedBy?: Id;
  readonly previewAssetId?: Id;
}

export interface Atom extends CommonRecord {
  readonly kind: 'atom';
  readonly axisId: Id;
  readonly expansion: string;
  readonly excludes: readonly Id[];
  readonly requires: readonly Id[];
  readonly applicability: readonly Mode[];
}

export interface Bundle extends CommonRecord {
  readonly kind: 'bundle';
  readonly atomIds: readonly Id[];
}

export interface Preset extends CommonRecord {
  readonly kind: 'preset';
  readonly atomIds: readonly Id[];
  readonly scopeAxisIds: readonly Id[];
  readonly applicability: readonly Mode[];
}

export interface EditRecipe extends CommonRecord {
  readonly kind: 'edit-recipe';
  readonly operation: string;
  readonly affectedDomains: readonly Domain[];
  readonly requiredPreservedDomains: readonly Domain[];
  readonly slotKeys: readonly string[];
  readonly segments: readonly ({ readonly text: string } | { readonly slot: string; readonly placeholder: string })[];
  readonly allowedFields: readonly Field[];
  readonly excludesRecipeIds: readonly Id[];
}

export interface Source {
  readonly id: SourceId;
  readonly kind: 'local' | 'web' | 'user' | 'curator';
  readonly title: string;
  readonly locator: string;
  readonly author?: string;
  readonly accessedOn?: string;
  readonly basis: 'source-description' | 'source-prompt' | 'user-source' | 'curator-composition';
  readonly evidenceNote: string;
  readonly reuse: 'paraphrase-only' | 'permission-recorded' | 'user-provided' | 'original';
}

export interface Caution {
  readonly id: Id;
  readonly text: string;
}

export interface LegacyMapEntry {
  readonly oldId: string;
  readonly oldToken: string;
  readonly disposition: 'retained' | 'alias' | 'split' | 'deprecated' | 'reference-only';
  readonly targetIds: readonly Id[];
  readonly reason: string;
}

export interface LibraryV2 {
  readonly schemaVersion: 2;
  readonly contentVersion: string;
  readonly taxa: readonly Taxon[];
  readonly axes: readonly Axis[];
  readonly atoms: readonly Atom[];
  readonly bundles: readonly Bundle[];
  readonly presets: readonly Preset[];
  readonly editRecipes: readonly EditRecipe[];
  readonly sources: readonly Source[];
  readonly cautions: readonly Caution[];
  readonly legacyMap: readonly LegacyMapEntry[];
}

export interface AxisChoice {
  readonly axisId: Id;
  readonly atomIds: readonly Id[];
  readonly source: 'manual' | 'preset';
  readonly presetId?: Id;
  readonly pinnedBlank: boolean;
}

export interface RecipeChoice {
  readonly recipeId: Id;
  readonly slots: Readonly<Record<string, string>>;
}

export interface ReferenceRole {
  readonly imageNumber: number;
  readonly role: 'base' | 'identity' | 'pose' | 'product' | 'style' | 'palette'
    | 'lighting' | 'background' | 'geometry' | 'custom';
  readonly note: string;
}

export interface CueDraft {
  readonly schemaVersion: 1;
  readonly id: Mode;
  readonly revision: number;
  readonly libraryVersion: string;
  readonly what: string;
  readonly choices: readonly AxisChoice[];
  readonly customText: Partial<Record<Field, string>>;
  readonly activePresetId?: Id;
  readonly edits: readonly RecipeChoice[];
  readonly references: readonly ReferenceRole[];
  readonly manualUnlocks: readonly Domain[];
  readonly outputFormat: CopyFormat;
}

export interface CompileError {
  readonly code: string;
  readonly field?: Field;
  readonly recordId?: Id;
  readonly message: string;
}

export interface CompilePlaceholder {
  readonly key: string;
  readonly label: string;
}

export interface CompileResult {
  readonly text: string;
  readonly revision: number;
  readonly placeholders: readonly CompilePlaceholder[];
  readonly cautions: readonly Id[];
  readonly errors: readonly CompileError[];
  readonly atomsUsed: readonly Id[];
  readonly unlockedDomains: readonly Domain[];
}

export type DraftFieldPath = 'draft' | 'what' | 'references' | 'manualUnlocks' | 'preset' | 'format'
  | `axis:${Id}`
  | `custom:${Field}`
  | `recipe:${Id}`;

export type ExpectedFieldRevisions = Partial<Readonly<Record<DraftFieldPath, number>>>;

export type CueCommand =
  | { readonly type: 'set-what'; readonly text: string }
  | { readonly type: 'set-custom-text'; readonly field: Field; readonly text: string }
  | { readonly type: 'set-axis'; readonly axisId: Id; readonly atomIds: readonly Id[]; readonly pinnedBlank?: boolean }
  | { readonly type: 'clear-axis'; readonly axisId: Id; readonly pinBlank: boolean }
  | { readonly type: 'toggle-atom'; readonly axisId: Id; readonly atomId: Id }
  | { readonly type: 'apply-preset'; readonly presetId: Id }
  | { readonly type: 'reset-to-preset'; readonly presetId: Id }
  | { readonly type: 'select-recipe'; readonly recipeId: Id }
  | { readonly type: 'remove-recipe'; readonly recipeId: Id }
  | { readonly type: 'set-recipe-slot'; readonly recipeId: Id; readonly slot: string; readonly value: string }
  | { readonly type: 'set-reference-roles'; readonly references: readonly ReferenceRole[] }
  | { readonly type: 'set-manual-unlocks'; readonly domains: readonly Domain[] }
  | { readonly type: 'choose-format'; readonly format: CopyFormat }
  | { readonly type: 'reset-draft' }
  | { readonly type: 'undo-draft' };

export interface DraftCommandEnvelope {
  readonly commandId: string;
  readonly clientId: string;
  readonly draftId: Mode;
  readonly expectedFieldRevisions: ExpectedFieldRevisions;
  readonly command: CueCommand;
}

export interface CommandConflict {
  readonly path: DraftFieldPath;
  readonly currentRevision: number;
  readonly message: string;
}

export type CommandErrorCode = 'INVALID_INPUT' | 'UNKNOWN_RECORD' | 'VALIDATION_ERROR'
  | 'CONFLICT' | 'STALE_DRAFT' | 'UNAVAILABLE' | 'INTERNAL';

export interface CommandError {
  readonly code: CommandErrorCode;
  readonly message: string;
  readonly path?: DraftFieldPath;
  readonly field?: Field;
  readonly recordId?: Id;
  readonly conflicts?: readonly CommandConflict[];
}

export interface ShortcutState {
  readonly accelerator: string;
  readonly registered: boolean;
  readonly error?: string;
}

export interface CueSnapshot {
  readonly drafts: Readonly<Record<Mode, CueDraft>>;
  readonly fieldRevisions: Readonly<Record<Mode, Readonly<Record<string, number>>>>;
  readonly activeMode: Mode;
  readonly sequence: number;
  readonly shortcut: ShortcutState;
  readonly persistenceStatus: PersistenceStatus;
}

export interface CommandAcknowledgement {
  readonly commandId: string;
  readonly snapshot: CueSnapshot;
  readonly touchedPaths: readonly DraftFieldPath[];
}

export type CommandResult =
  | { readonly ok: true; readonly value: CommandAcknowledgement }
  | { readonly ok: false; readonly error: CommandError; readonly snapshot?: CueSnapshot };

export interface LibraryChoiceView {
  readonly id: Id;
  readonly kind: Atom['kind'] | Bundle['kind'] | Preset['kind'] | EditRecipe['kind'];
  readonly label: string;
  readonly shorthand: string;
  readonly summary: string;
  readonly field?: Field;
  readonly axisId?: Id;
  readonly order: number;
  readonly status: CommonRecord['status'];
  readonly aliases: readonly string[];
  readonly cautionIds: readonly Id[];
  readonly previewAssetId?: Id;
}

export interface LibraryView {
  readonly schemaVersion: 2;
  readonly contentVersion: string;
  readonly taxa: readonly Taxon[];
  readonly axes: readonly Axis[];
  readonly choices: readonly LibraryChoiceView[];
  readonly presets: readonly Preset[];
  readonly editRecipes: readonly EditRecipe[];
  readonly sources: readonly Source[];
  readonly cautions: readonly Caution[];
}

export interface TeleprompterBootstrap {
  readonly snapshot: CueSnapshot;
  readonly library: LibraryView;
  readonly platform: 'darwin' | 'win32' | 'linux';
  readonly appVersion: string;
}

export interface DraftChangedEvent {
  readonly snapshot: CueSnapshot;
  readonly sourceClientId?: string;
}

export interface CopyCompiledDraftRequest {
  readonly draftId: Mode;
  readonly expectedRevision: number;
  readonly format: CopyFormat;
}

export interface LibraryCopyTextRequest {
  readonly recordId: Id;
  readonly format: RecordCopyFormat;
  readonly expectedContentVersion: string;
}

export interface CopyResult {
  readonly copied: boolean;
  readonly format: CopyFormat | RecordCopyFormat;
  readonly revision?: number;
  readonly bytes: number;
}

export type BridgeErrorCode = 'INVALID_INPUT' | 'UNAVAILABLE' | 'CONFLICT'
  | 'STALE_DRAFT' | 'CLIPBOARD_FAILED' | 'PERSISTENCE_FAILED' | 'INTERNAL';

export interface BridgeError {
  readonly code: BridgeErrorCode;
  readonly message: string;
}

export type BridgeResult<T extends object = Record<string, never>> =
  | ({ readonly ok: true } & T)
  | { readonly ok: false; readonly error: BridgeError };

export interface TeleprompterBridge {
  readonly getBootstrap: () => Promise<BridgeResult<TeleprompterBootstrap>>;
  readonly submitDraftCommand: (request: DraftCommandEnvelope) => Promise<CommandResult>;
  readonly onDraftChanged: (callback: (event: DraftChangedEvent) => void) => () => void;
  readonly copyCompiledDraft: (request: CopyCompiledDraftRequest) => Promise<BridgeResult<CopyResult>>;
  readonly copyLibraryText: (request: LibraryCopyTextRequest) => Promise<BridgeResult<CopyResult>>;
  readonly setFavorite: (request: { readonly recordId: Id; readonly favorited: boolean }) => Promise<BridgeResult<{ readonly recordId: Id; readonly favorited: boolean; readonly persistenceStatus: PersistenceStatus }>>;
  readonly setShortcut: (request: { readonly accelerator: string }) => Promise<BridgeResult<{ readonly shortcut: ShortcutState; readonly persistenceStatus: PersistenceStatus }>>;
  readonly showMain: () => Promise<BridgeResult>;
  readonly hideSpotlight: () => Promise<BridgeResult>;
  readonly onCommand: (callback: (command: DesktopCommand) => void) => () => void;
}

export interface TeleprompterDesktopBridge {
  readonly requestSize: (size: 'compact' | 'expanded') => Promise<BridgeResult<{ readonly size: 'compact' | 'expanded' }>>;
}

export type DesktopCommand =
  | { readonly type: 'show-cue'; readonly reason: 'shortcut' | 'menu' | 'activation' }
  | { readonly type: 'hide-spotlight'; readonly reason: 'shortcut' | 'blur' | 'menu' }
  | { readonly type: 'focus-search'; readonly view: View }
  | { readonly type: 'navigate'; readonly view: View }
  | { readonly type: 'copy-draft'; readonly draftId: Mode };

declare global {
  interface Window {
    readonly teleprompter?: TeleprompterBridge;
    readonly teleprompterDesktop?: TeleprompterDesktopBridge;
  }
}
