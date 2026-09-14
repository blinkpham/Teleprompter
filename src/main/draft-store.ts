import { promises as fs } from 'node:fs';
import type {
  CommandAcknowledgement,
  CommandConflict,
  CommandError,
  CommandResult,
  CompileResult,
  CueCommand,
  CueDraft,
  CueSnapshot,
  DraftChangedEvent,
  DraftCommandEnvelope,
  DraftFieldPath,
  LibraryV2,
  LibraryView,
  Mode,
  PersistenceStatus,
  ShortcutState,
} from '../shared/teleprompter-types';
import { newDraftDefaults } from '../shared/teleprompter-types';
import { validateCueDraft, validateDraftCommand } from '../shared/teleprompter-validation';

export interface EngineApplySuccess {
  readonly ok: true;
  readonly draft: CueDraft;
  readonly touchedPaths?: readonly DraftFieldPath[];
}

export interface CueEngineAdapter {
  readonly applyDraftCommand?: (draft: CueDraft, command: CueCommand, library: LibraryV2) => EngineApplySuccess | { readonly ok: false; readonly error: CommandError };
  readonly compileCreate?: (draft: CueDraft, library: LibraryV2) => CompileResult;
  readonly compileEdit?: (draft: CueDraft, library: LibraryV2) => CompileResult;
  readonly libraryView?: (library: LibraryV2) => LibraryView;
  readonly getTouchedPaths?: (draft: CueDraft, command: CueCommand, library: LibraryV2) => readonly DraftFieldPath[];
}

export interface DraftStoreDocument {
  readonly schemaVersion: 1;
  readonly libraryVersion: string;
  readonly drafts: Readonly<Record<Mode, CueDraft>>;
  readonly fieldRevisions: Readonly<Record<Mode, Readonly<Record<string, number>>>>;
  readonly sequence: number;
}

export interface DraftStoreLoadResult {
  readonly document: DraftStoreDocument;
  readonly status: 'loaded' | 'recovered' | 'future';
}

interface UndoState {
  readonly draft: CueDraft;
  readonly revisions: Readonly<Record<string, number>>;
}

const MODES: readonly Mode[] = ['create', 'edit'];
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isNonNegativeInteger = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0;
const clone = <T>(value: T): T => structuredClone(value);

export const createEmptyDraft = (id: Mode, libraryVersion: string): CueDraft => ({
  schemaVersion: 1,
  id,
  revision: 0,
  libraryVersion,
  what: '',
  choices: [],
  customText: newDraftDefaults(id).customText,
  edits: [],
  references: [],
  manualUnlocks: [],
  outputFormat: 'expanded',
});

const createFieldRevisions = (library: LibraryV2): Record<string, number> => {
  const revisions: Record<string, number> = {
    draft: 0,
    what: 0,
    references: 0,
    manualUnlocks: 0,
    preset: 0,
    format: 0,
  };
  library.axes.forEach((axis) => { revisions[`axis:${axis.id}`] = 0; });
  library.editRecipes.forEach((recipe) => { revisions[`recipe:${recipe.id}`] = 0; });
  for (const field of ['cam', 'angle', 'comp', 'light', 'look', 'mood', 'important', 'avoid', 'output']) revisions[`custom:${field}`] = 0;
  return revisions;
};

export const createDraftStoreDocument = (library: LibraryV2): DraftStoreDocument => ({
  schemaVersion: 1,
  libraryVersion: library.contentVersion,
  drafts: {
    create: createEmptyDraft('create', library.contentVersion),
    edit: createEmptyDraft('edit', library.contentVersion),
  },
  fieldRevisions: {
    create: createFieldRevisions(library),
    edit: createFieldRevisions(library),
  },
  sequence: 0,
});

const validRevisions = (value: unknown): value is Record<string, number> => isRecord(value)
  && Object.keys(value).every((key) => key.length > 0 && isNonNegativeInteger(value[key]));

/** Parse without rewriting. The caller decides how to preserve corrupt/future files. */
export const parseDraftStore = (input: unknown, library: LibraryV2): DraftStoreLoadResult => {
  const fallback = createDraftStoreDocument(library);
  if (!isRecord(input)) return { document: fallback, status: 'recovered' };
  if (input.schemaVersion !== 1) {
    return { document: fallback, status: typeof input.schemaVersion === 'number' && input.schemaVersion > 1 ? 'future' : 'recovered' };
  }
  const drafts = input.drafts;
  const fieldRevisions = input.fieldRevisions;
  if (!isRecord(drafts) || !isRecord(fieldRevisions) || typeof input.libraryVersion !== 'string' || !isNonNegativeInteger(input.sequence)) {
    return { document: fallback, status: 'recovered' };
  }
  if (!MODES.every((mode) => validateCueDraft(drafts[mode]).ok && validRevisions(fieldRevisions[mode]))) {
    return { document: fallback, status: 'recovered' };
  }
  return {
    document: {
      schemaVersion: 1,
      libraryVersion: input.libraryVersion,
      drafts: { create: drafts.create as CueDraft, edit: drafts.edit as CueDraft },
      fieldRevisions: { create: fieldRevisions.create as Record<string, number>, edit: fieldRevisions.edit as Record<string, number> },
      sequence: input.sequence,
    },
    status: 'loaded',
  };
};

export const serializeDraftStore = (document: DraftStoreDocument): string => `${JSON.stringify(document, null, 2)}\n`;

export const writeJsonAtomically = async (filePath: string, document: string): Promise<void> => {
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, document, 'utf8');
  await fs.rename(temporaryPath, filePath);
};

const pathFor = (draft: CueDraft, command: CueCommand, library: LibraryV2): DraftFieldPath[] => {
  switch (command.type) {
    case 'set-what': return ['what'];
    case 'set-custom-text': return [`custom:${command.field}`, 'preset'];
    case 'set-axis': case 'clear-axis': case 'toggle-atom': return [`axis:${command.axisId}`, 'preset'];
    case 'apply-preset': case 'reset-to-preset': {
      const presetAxes = library.presets.find((preset) => preset.id === command.presetId)?.scopeAxisIds ?? [];
      const oldPresetAxes = draft.choices.filter((choice) => choice.source === 'preset' && choice.presetId === draft.activePresetId).map((choice) => choice.axisId);
      return ['preset', ...[...new Set([...presetAxes, ...oldPresetAxes])].map((axisId) => `axis:${axisId}` as DraftFieldPath)];
    }
    case 'select-recipe': case 'remove-recipe': case 'set-recipe-slot': return [`recipe:${command.recipeId}`];
    case 'set-reference-roles': return ['references'];
    case 'set-manual-unlocks': return ['manualUnlocks'];
    case 'choose-format': return ['format'];
    case 'reset-draft': case 'undo-draft': return ['draft'];
  }
};

const error = (code: CommandError['code'], message: string, extras: Partial<CommandError> = {}): CommandError => ({ code, message, ...extras });

export class DraftStore {
  private readonly library: LibraryV2;
  private readonly engine: CueEngineAdapter;
  private drafts: Record<Mode, CueDraft>;
  private fieldRevisions: Record<Mode, Record<string, number>>;
  private sequence: number;
  private activeMode: Mode = 'create';
  private readonly undo = new Map<Mode, UndoState>();
  private readonly acknowledgements = new Map<string, Map<string, CommandResult>>();

  public constructor(library: LibraryV2, engine: CueEngineAdapter, document?: DraftStoreDocument) {
    this.library = library;
    this.engine = engine;
    const initial = document ?? createDraftStoreDocument(library);
    this.drafts = { create: clone(initial.drafts.create), edit: clone(initial.drafts.edit) };
    this.fieldRevisions = { create: { ...initial.fieldRevisions.create }, edit: { ...initial.fieldRevisions.edit } };
    this.sequence = initial.sequence;
    for (const mode of MODES) {
      const defaults = createFieldRevisions(library);
      this.fieldRevisions[mode] = { ...defaults, ...this.fieldRevisions[mode] };
      this.drafts[mode] = { ...this.drafts[mode], libraryVersion: library.contentVersion };
    }
  }

  public setActiveMode(mode: Mode): void { this.activeMode = mode; }

  public getSnapshot(shortcut: ShortcutState, persistenceStatus: PersistenceStatus): CueSnapshot {
    return {
      drafts: { create: clone(this.drafts.create), edit: clone(this.drafts.edit) },
      fieldRevisions: { create: { ...this.fieldRevisions.create }, edit: { ...this.fieldRevisions.edit } },
      activeMode: this.activeMode,
      sequence: this.sequence,
      shortcut,
      persistenceStatus,
    };
  }

  public toDocument(): DraftStoreDocument {
    return {
      schemaVersion: 1,
      libraryVersion: this.library.contentVersion,
      drafts: { create: clone(this.drafts.create), edit: clone(this.drafts.edit) },
      fieldRevisions: { create: { ...this.fieldRevisions.create }, edit: { ...this.fieldRevisions.edit } },
      sequence: this.sequence,
    };
  }

  public registerClient(clientId: string): void {
    if (!this.acknowledgements.has(clientId)) this.acknowledgements.set(clientId, new Map());
  }

  public destroyClient(clientId: string): void { this.acknowledgements.delete(clientId); }

  public getTouchedPaths(envelope: DraftCommandEnvelope): readonly DraftFieldPath[] {
    const draft = this.drafts[envelope.draftId];
    const fromEngine = this.engine.getTouchedPaths?.(draft, envelope.command, this.library);
    return [...new Set(fromEngine ?? pathFor(draft, envelope.command, this.library))];
  }

  public apply(envelope: DraftCommandEnvelope, shortcut: ShortcutState, persistenceStatus: PersistenceStatus): CommandResult {
    const prior = this.acknowledgements.get(envelope.clientId)?.get(envelope.commandId);
    if (prior) return prior;
    this.registerClient(envelope.clientId);
    const validated = validateDraftCommand(envelope);
    if (!validated.ok) {
      const result: CommandResult = { ok: false, error: error('INVALID_INPUT', validated.errors.map((item) => `${item.path}: ${item.message}`).join(' ')) };
      this.remember(envelope.clientId, envelope.commandId, result);
      return result;
    }
    const command = validated.value;
    const touchedPaths = this.getTouchedPaths(command);
    const currentRevisions = this.fieldRevisions[command.draftId];
    const conflicts: CommandConflict[] = [];
    for (const path of touchedPaths) {
      const expected = command.expectedFieldRevisions[path];
      const current = currentRevisions[path] ?? 0;
      if (expected === undefined) {
        conflicts.push({ path, currentRevision: current, message: `Expected revision for ${path} is required.` });
      } else if (expected !== current) {
        conflicts.push({ path, currentRevision: current, message: `The ${path} value changed in another window.` });
      }
    }
    if (conflicts.length > 0) {
      const result: CommandResult = {
        ok: false,
        error: error('CONFLICT', 'This field changed in another window.', { conflicts }),
        snapshot: this.getSnapshot(shortcut, persistenceStatus),
      };
      this.remember(command.clientId, command.commandId, result);
      return result;
    }

    const current = this.drafts[command.draftId];
    const previous: UndoState = { draft: clone(current), revisions: { ...currentRevisions } };
    let next: CueDraft;
    let paths = touchedPaths;
    if (command.command.type === 'undo-draft') {
      const undo = this.undo.get(command.draftId);
      if (!undo) {
        const acknowledgement = { ok: true as const, value: this.acknowledge(command.commandId, [], shortcut, persistenceStatus) };
        this.remember(command.clientId, command.commandId, acknowledgement);
        return acknowledgement;
      }
      next = { ...clone(undo.draft), revision: current.revision + 1, libraryVersion: this.library.contentVersion };
      paths = ['draft'];
      this.fieldRevisions[command.draftId] = { ...undo.revisions };
    } else {
      if (!this.engine.applyDraftCommand) {
        const result: CommandResult = { ok: false, error: error('UNAVAILABLE', 'The Cue engine is not loaded.') };
        this.remember(command.clientId, command.commandId, result);
        return result;
      }
      let applied: EngineApplySuccess | { readonly ok: false; readonly error: CommandError };
      try {
        applied = this.engine.applyDraftCommand(current, command.command, this.library);
      } catch {
        const result: CommandResult = { ok: false, error: error('INTERNAL', 'The Cue command could not be applied.') };
        this.remember(command.clientId, command.commandId, result);
        return result;
      }
      if (!applied.ok) {
        const result: CommandResult = { ok: false, error: applied.error, snapshot: this.getSnapshot(shortcut, persistenceStatus) };
        this.remember(command.clientId, command.commandId, result);
        return result;
      }
      next = { ...clone(applied.draft), revision: current.revision + 1, libraryVersion: this.library.contentVersion };
      paths = [...new Set(applied.touchedPaths ?? touchedPaths)];
      if (command.command.type === 'reset-draft') paths = ['draft'];
    }
    this.undo.set(command.draftId, previous);
    this.drafts[command.draftId] = next;
    const revisions = this.fieldRevisions[command.draftId];
    for (const path of paths) revisions[path] = (revisions[path] ?? 0) + 1;
    this.sequence += 1;
    const acknowledgement = { ok: true as const, value: this.acknowledge(command.commandId, paths, shortcut, persistenceStatus) };
    this.remember(command.clientId, command.commandId, acknowledgement);
    return acknowledgement;
  }

  private acknowledge(commandId: string, touchedPaths: readonly DraftFieldPath[], shortcut: ShortcutState, persistenceStatus: PersistenceStatus): CommandAcknowledgement {
    return { commandId, snapshot: this.getSnapshot(shortcut, persistenceStatus), touchedPaths };
  }

  private remember(clientId: string, commandId: string, result: CommandResult): void {
    const cache = this.acknowledgements.get(clientId) ?? new Map<string, CommandResult>();
    cache.set(commandId, result);
    while (cache.size > 256) {
      const oldest = cache.keys().next().value;
      if (oldest === undefined) break;
      cache.delete(oldest);
    }
    this.acknowledgements.set(clientId, cache);
  }
}

export const draftChanged = (snapshot: CueSnapshot, sourceClientId?: string): DraftChangedEvent => ({
  snapshot,
  ...(sourceClientId === undefined ? {} : { sourceClientId }),
});
