import type {
  BridgeError,
  Mode,
  ReferenceBinding,
  ReferenceBindingEnvelope,
  ReferenceBindingsSnapshot,
} from '../shared/teleprompter-types';

export interface ReferenceBindingDraftDocument {
  readonly version: number;
  readonly bindings: readonly ReferenceBinding[];
}

export interface ReferenceBindingsDocument {
  readonly schemaVersion: 1;
  readonly drafts: Readonly<Record<Mode, ReferenceBindingDraftDocument>>;
}

export type ReferenceBindingsLoadStatus = 'loaded' | 'recovered' | 'future';

export type ReferenceBindingsResult =
  | { readonly ok: true; readonly snapshot: ReferenceBindingsSnapshot }
  | { readonly ok: false; readonly error: BridgeError };

const MODES: readonly Mode[] = ['create', 'edit'];
const clone = <T>(value: T): T => structuredClone(value);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isMode = (value: unknown): value is Mode => MODES.includes(value as Mode);
const isNonNegativeInteger = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0;
const isOpaqueHandle = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9._:-]{1,512}$/.test(value);

const isBinding = (value: unknown, mode: Mode): value is ReferenceBinding => {
  if (!isRecord(value)) return false;
  return typeof value.bindingId === 'string'
    && value.bindingId.trim().length > 0
    && value.bindingId.length <= 128
    && value.draftId === mode
    && typeof value.imageNumber === 'number'
    && Number.isInteger(value.imageNumber)
    && value.imageNumber >= 1
    && value.imageNumber <= 20
    && typeof value.label === 'string'
    && value.label.trim().length > 0
    && value.label.length <= 200
    && (value.thumbnailHandle === undefined || isOpaqueHandle(value.thumbnailHandle));
};

const emptyDraft = (): ReferenceBindingDraftDocument => ({ version: 0, bindings: [] });

export const createReferenceBindingsDocument = (): ReferenceBindingsDocument => ({
  schemaVersion: 1,
  drafts: { create: emptyDraft(), edit: emptyDraft() },
});

export const parseReferenceBindings = (input: unknown): { readonly document: ReferenceBindingsDocument; readonly status: ReferenceBindingsLoadStatus } => {
  const fallback = createReferenceBindingsDocument();
  if (!isRecord(input) || input.schemaVersion !== 1 || !isRecord(input.drafts)) {
    return { document: fallback, status: isRecord(input) && typeof input.schemaVersion === 'number' && input.schemaVersion > 1 ? 'future' : 'recovered' };
  }
  const drafts = {} as Record<Mode, ReferenceBindingDraftDocument>;
  for (const mode of MODES) {
    const candidate = input.drafts[mode];
    if (!isRecord(candidate) || !isNonNegativeInteger(candidate.version) || !Array.isArray(candidate.bindings)) {
      return { document: fallback, status: 'recovered' };
    }
    const bindings = candidate.bindings.filter((binding): binding is ReferenceBinding => isBinding(binding, mode));
    if (bindings.length !== candidate.bindings.length || new Set(bindings.map((binding) => binding.bindingId)).size !== bindings.length || new Set(bindings.map((binding) => binding.imageNumber)).size !== bindings.length) {
      return { document: fallback, status: 'recovered' };
    }
    drafts[mode] = { version: candidate.version, bindings: clone(bindings) };
  }
  return { document: { schemaVersion: 1, drafts }, status: 'loaded' };
};

const error = (code: BridgeError['code'], message: string): ReferenceBindingsResult => ({ ok: false, error: { code, message } });

export class ReferenceBindingStore {
  private readonly drafts: Record<Mode, ReferenceBindingDraftDocument>;

  public constructor(document: ReferenceBindingsDocument = createReferenceBindingsDocument()) {
    this.drafts = {
      create: { version: document.drafts.create.version, bindings: clone(document.drafts.create.bindings) },
      edit: { version: document.drafts.edit.version, bindings: clone(document.drafts.edit.bindings) },
    };
  }

  public toDocument(): ReferenceBindingsDocument {
    return {
      schemaVersion: 1,
      drafts: { create: clone(this.drafts.create), edit: clone(this.drafts.edit) },
    };
  }

  public list(draftId: Mode, expectedDraftRevision: number, currentDraftRevision: number): ReferenceBindingsResult {
    if (expectedDraftRevision !== currentDraftRevision) return error('STALE_DRAFT', 'The draft changed. Refresh its references before reading bindings.');
    return { ok: true, snapshot: this.snapshot(draftId) };
  }

  public apply(envelope: ReferenceBindingEnvelope): ReferenceBindingsResult {
    const current = this.drafts[envelope.draftId];
    if (envelope.expectedVersion !== current.version) return error('CONFLICT', 'The reference bindings changed in another window. Refresh before editing.');
    if (envelope.operation === 'upsert') {
      const binding = clone(envelope.binding);
      const bindings = current.bindings.filter((candidate) => candidate.bindingId !== binding.bindingId && candidate.imageNumber !== binding.imageNumber);
      bindings.push(binding);
      bindings.sort((left, right) => left.imageNumber - right.imageNumber || left.bindingId.localeCompare(right.bindingId));
      this.drafts[envelope.draftId] = { version: current.version + 1, bindings };
      return { ok: true, snapshot: this.snapshot(envelope.draftId) };
    }
    const existing = current.bindings.find((candidate) => candidate.bindingId === envelope.bindingId && candidate.imageNumber === envelope.imageNumber);
    if (!existing) return error('INVALID_INPUT', 'That reference binding is no longer available. Refresh before removing it.');
    this.drafts[envelope.draftId] = {
      version: current.version + 1,
      bindings: current.bindings.filter((candidate) => candidate.bindingId !== envelope.bindingId),
    };
    return { ok: true, snapshot: this.snapshot(envelope.draftId) };
  }

  private snapshot(draftId: Mode): ReferenceBindingsSnapshot {
    return { draftId, version: this.drafts[draftId].version, bindings: clone(this.drafts[draftId].bindings) };
  }
}

