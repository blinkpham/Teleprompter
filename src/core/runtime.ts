import { randomUUID } from 'node:crypto';
import * as engine from '../engine';
import { legacyLibrary } from '../content';
import type {
  BridgeError,
  CommandError,
  CommandResult,
  CompiledDraftPreview,
  CueCommand,
  CueSnapshot,
  DraftChangedEvent,
  DraftCommandEnvelope,
  DraftFieldPath,
  LibraryCopyTextRequest,
  LibraryV2,
  Mode,
  PersistenceStatus,
  ShortcutState,
  TeleprompterBootstrap,
} from '../shared/teleprompter-types';
import {
  isNativeBridgeEnvelope,
  nativeBridgeOperations,
  NATIVE_BRIDGE_PROTOCOL_VERSION,
  type NativeBridgeEvent,
  type NativeBridgeOperation,
  type NativeBridgeRequest,
  type NativeBridgeResponse,
  type NativeCapabilitiesPayload,
  type NativeFlushPayload,
  type NativeFlushResult,
  type NativeHelloPayload,
  type NativeHelloResponsePayload,
  type NativeLibraryTextPayload,
  type NativePreviewPayload,
  type NativeStatusPayload,
  type NativeSubmitCommandPayload,
} from '../shared/native-bridge';
import {
  validateCopyCompiledDraftRequest,
  validateDraftCommand,
  validateLibrary,
} from '../shared/teleprompter-validation';
import {
  DraftStore,
  type CueEngineAdapter,
  type DraftStoreDocument,
} from '../main/draft-store';
import { resolveLibraryText } from './library-text';
import { DraftPersistence, type DraftPersistenceOptions, type PersistenceState } from './persistence';

const HELPER_SHORTCUT: ShortcutState = {
  accelerator: '',
  registered: false,
  error: 'Shortcut registration is owned by the native host.',
};

const supportedNativeOperations: readonly NativeBridgeOperation[] = [...nativeBridgeOperations];

export interface NativeRuntimeOptions {
  readonly library?: LibraryV2;
  readonly appVersion?: string;
  readonly platform?: 'darwin' | 'win32' | 'linux';
  /** Omit this for the explicit disposable, session-only profile. */
  readonly persistencePath?: string;
  readonly persistence?: DraftPersistence;
}

export interface NativeRuntimeFactoryOptions extends Omit<NativeRuntimeOptions, 'persistence'> {
  readonly persistence?: DraftPersistence | DraftPersistenceOptions;
}

const platformFor = (value: NativeRuntimeOptions['platform']): 'darwin' | 'win32' | 'linux' => {
  if (value) return value;
  if (process.platform === 'win32') return 'win32';
  if (process.platform === 'linux') return 'linux';
  return 'darwin';
};

const appVersionFor = (value: string | undefined): string => value ?? process.env.npm_package_version ?? '0.1.0';

const mapEngineIssue = (issue: {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
  readonly recordId?: string;
}): CommandError => {
  const code: CommandError['code'] = issue.code === 'UNKNOWN_AXIS'
    || issue.code === 'UNKNOWN_ATOM'
    || issue.code === 'UNKNOWN_PRESET'
    || issue.code === 'UNKNOWN_RECIPE'
    || issue.code === 'UNKNOWN_TARGET'
    ? 'UNKNOWN_RECORD'
    : issue.code === 'REVISION_CONFLICT'
      ? 'CONFLICT'
      : issue.code === 'STALE_CONTENT'
        ? 'STALE_DRAFT'
        : issue.code === 'INCOMPATIBLE_TARGET' || issue.code === 'INVALID_QUERY'
          ? 'INVALID_INPUT'
          : 'VALIDATION_ERROR';
  return {
    code,
    message: issue.message,
    ...(issue.path === undefined ? {} : { path: issue.path as DraftFieldPath }),
    ...(issue.recordId === undefined ? {} : { recordId: issue.recordId }),
  };
};

const makeEngine = (): CueEngineAdapter => ({
  applyDraftCommand: (draft, command, library) => {
    const result = engine.applyDraftCommand(library, draft, command as CueCommand, []);
    if (result.ok) return { ok: true, draft: result.value.draft, touchedPaths: result.value.touchedPaths };
    return { ok: false, error: mapEngineIssue(result.issue) };
  },
  compileCreate: (draft, library) => engine.compileCreate(library, draft),
  compileEdit: (draft, library) => engine.compileEdit(library, draft),
  libraryView: engine.projectLibrary,
  getTouchedPaths: (draft, command, library) => engine.touchedPathsForCommand(library, draft, command as CueCommand),
});

const acceptedRecordIdsFor = (library: LibraryV2): readonly string[] => [
  ...library.atoms,
  ...library.bundles,
  ...library.presets,
  ...library.editRecipes,
].filter((record) => record.status === 'active').map((record) => record.id);

const acceptedRecordBreakdown = (library: LibraryV2): { readonly atoms: number; readonly bundles: number; readonly presets: number; readonly editRecipes: number } => ({
  atoms: library.atoms.filter((record) => record.status === 'active').length,
  bundles: library.bundles.filter((record) => record.status === 'active').length,
  presets: library.presets.filter((record) => record.status === 'active').length,
  editRecipes: library.editRecipes.filter((record) => record.status === 'active').length,
});

const bridgeError = (code: BridgeError['code'], message: string): BridgeError => ({ code, message });

const responseIdentity = (request: NativeBridgeRequest, helperSessionId: string): Record<string, unknown> => ({
  protocolVersion: NATIVE_BRIDGE_PROTOCOL_VERSION,
  kind: 'response',
  clientId: request.clientId,
  helperSessionId,
  requestId: request.requestId,
  ...(request.commandId === undefined ? {} : { commandId: request.commandId }),
  ...(request.surfaceSessionId === undefined ? {} : { surfaceSessionId: request.surfaceSessionId }),
  operation: request.operation,
});

const persistenceSnapshotStatus = (status: PersistenceState['status']): PersistenceStatus => {
  if (status === 'disk') return 'disk';
  if (status === 'recovery') return 'recovery';
  return 'session';
};

const withPersistenceStatus = (result: CommandResult, status: PersistenceStatus): CommandResult => {
  if (result.ok) return {
    ok: true,
    value: { ...result.value, snapshot: { ...result.value.snapshot, persistenceStatus: status } },
  };
  if (!result.snapshot) return result;
  return { ...result, snapshot: { ...result.snapshot, persistenceStatus: status } };
};

const identityFor = (input: unknown): {
  readonly requestId: string;
  readonly clientId: string;
  readonly helperSessionId: string;
  readonly surfaceSessionId?: string;
  readonly operation: NativeBridgeOperation;
} => {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { requestId: 'invalid-request', clientId: 'invalid-client', helperSessionId: '', operation: 'status' };
  }
  const value = input as Record<string, unknown>;
  return {
    requestId: typeof value.requestId === 'string' ? value.requestId : 'invalid-request',
    clientId: typeof value.clientId === 'string' ? value.clientId : 'invalid-client',
    helperSessionId: typeof value.helperSessionId === 'string' ? value.helperSessionId : '',
    ...(typeof value.surfaceSessionId === 'string' ? { surfaceSessionId: value.surfaceSessionId } : {}),
    operation: nativeBridgeOperations.includes(value.operation as NativeBridgeOperation)
      ? value.operation as NativeBridgeOperation
      : 'status',
  };
};

export class NativeRuntime {
  private readonly library: LibraryV2;
  private readonly persistence: DraftPersistence;
  private readonly appVersion: string;
  private readonly platform: 'darwin' | 'win32' | 'linux';
  private readonly helperSessionId = randomUUID();
  private readonly acceptedRecordIds: readonly string[];
  private readonly store: DraftStore;
  private readonly seenRequestIds = new Set<string>();
  private readonly seenCommandIds = new Set<string>();
  private readonly pendingEvents: NativeBridgeEvent[] = [];
  private boundClientId: string | undefined;
  private handshaken = false;
  private closed = false;
  private requestQueue: Promise<void> = Promise.resolve();

  public constructor(
    library: LibraryV2,
    persistence: DraftPersistence,
    document: DraftStoreDocument,
    options: Pick<NativeRuntimeOptions, 'appVersion' | 'platform'> = {},
  ) {
    const libraryValidation = validateLibrary(library);
    if (!libraryValidation.ok) throw new Error(libraryValidation.errors.map((error) => `${error.path}: ${error.message}`).join(' '));
    this.library = library;
    this.persistence = persistence;
    this.appVersion = appVersionFor(options.appVersion);
    this.platform = platformFor(options.platform);
    this.acceptedRecordIds = acceptedRecordIdsFor(library);
    this.store = new DraftStore(library, makeEngine(), document);
  }

  public get sessionId(): string { return this.helperSessionId; }

  public get isClosed(): boolean { return this.closed; }

  /** Serialize direct callers as well as the JSON-lines helper. */
  public handle(input: unknown): Promise<NativeBridgeResponse> {
    let resolveResponse: (response: NativeBridgeResponse) => void = () => undefined;
    let rejectResponse: (cause: unknown) => void = () => undefined;
    const response = new Promise<NativeBridgeResponse>((resolve, reject) => {
      resolveResponse = resolve;
      rejectResponse = reject;
    });
    this.requestQueue = this.requestQueue
      .then(async () => {
        try {
          resolveResponse(await this.handleSerialized(input));
        } catch (cause) {
          rejectResponse(cause);
        }
      })
      .catch(() => undefined);
    return response;
  }

  public drainEvents(): readonly NativeBridgeEvent[] {
    return this.pendingEvents.splice(0, this.pendingEvents.length);
  }

  public getStatus(): NativeStatusPayload {
    const persistence = this.persistenceState();
    return {
      state: this.closed ? 'stopped' : persistence.status === 'failed' || persistence.status === 'recovery' || persistence.status === 'unavailable' ? 'degraded' : 'ready',
      persistence: persistence.status,
      pendingCommandIds: [],
      sequence: persistence.sequence,
      persistedThroughSequence: persistence.flushedSequence,
    };
  }

  private async handleSerialized(input: unknown): Promise<NativeBridgeResponse> {
    const identity = identityFor(input);
    if (!isNativeBridgeEnvelope(input) || input.kind !== 'request') {
      return this.failure(identity, 'INVALID_INPUT', 'The native bridge request envelope is invalid.');
    }
    const request = input as NativeBridgeRequest;
    if (this.closed) return this.failure(request, 'UNAVAILABLE', 'The helper has already shut down.');
    if (this.seenRequestIds.has(request.requestId)) return this.failure(request, 'CONFLICT', 'The request ID was already answered. Retry with a new request ID.');
    this.seenRequestIds.add(request.requestId);
    while (this.seenRequestIds.size > 1024) {
      const oldest = this.seenRequestIds.values().next().value;
      if (oldest === undefined) break;
      this.seenRequestIds.delete(oldest);
    }

    if (request.operation === 'hello') return this.handleHello(request as NativeBridgeRequest<'hello'>);
    if (!this.handshaken) return this.failure(request, 'UNAVAILABLE', 'Send hello before using the helper.');
    if (request.clientId !== this.boundClientId) return this.failure(request, 'CONFLICT', 'The client identity does not match the active helper session.');
    if (request.helperSessionId !== this.helperSessionId) return this.failure(request, 'CONFLICT', request.helperSessionId ? 'The helper session ID is stale.' : 'The helper session ID is required after hello.');

    switch (request.operation) {
      case 'capabilities': return this.success(request, this.capabilitiesPayload());
      case 'bootstrap': return this.success(request, this.bootstrapPayload());
      case 'set-active-mode': {
        const typedRequest = request as NativeBridgeRequest<'set-active-mode'>;
        this.store.setActiveMode(typedRequest.payload.mode);
        return this.success(request, this.snapshot());
      }
      case 'submit-command': return this.submitCommand(request as NativeBridgeRequest<'submit-command'>);
      case 'snapshot': return this.success(request, { snapshot: this.snapshot() });
      case 'exact-preview': return this.exactPreview(request as NativeBridgeRequest<'exact-preview'>);
      case 'exact-library-text': return this.exactLibraryText(request as NativeBridgeRequest<'exact-library-text'>);
      case 'flush': return this.flush(request as NativeBridgeRequest<'flush'>);
      case 'status': return this.success(request, this.getStatus());
      case 'shutdown': return this.shutdown(request as NativeBridgeRequest<'shutdown'>);
    }
  }

  private handleHello(request: NativeBridgeRequest<'hello'>): NativeBridgeResponse<'hello'> {
    const payload = request.payload as NativeHelloPayload;
    if (payload.expectedHelperSessionId !== undefined && payload.expectedHelperSessionId !== this.helperSessionId) {
      return this.failure(request, 'CONFLICT', 'The expected helper session ID is stale.') as NativeBridgeResponse<'hello'>;
    }
    if (this.boundClientId !== undefined && this.boundClientId !== request.clientId) {
      return this.failure(request, 'CONFLICT', 'This helper session is already bound to another client.') as NativeBridgeResponse<'hello'>;
    }
    this.boundClientId = request.clientId;
    this.handshaken = true;
    const capabilities: NativeBridgeOperation[] = [...new Set<NativeBridgeOperation>([
      'hello',
      ...payload.requestedCapabilities.filter((operation) => operation !== 'hello'),
    ])];
    const result: NativeHelloResponsePayload = {
      helperSessionId: this.helperSessionId,
      acceptedClientId: request.clientId,
      profileId: payload.profileId,
      capabilities,
    };
    return this.success(request, result) as NativeBridgeResponse<'hello'>;
  }

  private capabilitiesPayload(): NativeCapabilitiesPayload {
    return {
      protocolVersion: NATIVE_BRIDGE_PROTOCOL_VERSION,
      operations: supportedNativeOperations,
      contentVersion: this.library.contentVersion,
      acceptedRecordIds: this.acceptedRecordIds,
      persistence: this.persistenceState().status,
    };
  }

  private bootstrapPayload(): TeleprompterBootstrap {
    return {
      snapshot: this.snapshot(),
      library: engine.projectLibrary(this.library),
      platform: this.platform,
      appVersion: this.appVersion,
    };
  }

  private snapshot(): CueSnapshot {
    return this.store.getSnapshot(HELPER_SHORTCUT, persistenceSnapshotStatus(this.persistenceState().status));
  }

  private async submitCommand(request: NativeBridgeRequest<'submit-command'>): Promise<NativeBridgeResponse<'submit-command'>> {
    const payload = request.payload as NativeSubmitCommandPayload;
    const command = payload.command;
    if (command.clientId !== request.clientId) return this.failure(request, 'CONFLICT', 'The command client identity must match the transport client.') as NativeBridgeResponse<'submit-command'>;

    const validated = validateDraftCommand(command);
    if (!validated.ok) {
      const invalid: CommandResult = {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: validated.errors.map((error) => `${error.path}: ${error.message}`).join(' '),
        },
      };
      return this.success(request, invalid) as NativeBridgeResponse<'submit-command'>;
    }

    const duplicateCommand = this.seenCommandIds.has(command.commandId);
    if (!duplicateCommand) this.seenCommandIds.add(command.commandId);
    const result = this.store.apply(command, HELPER_SHORTCUT, persistenceSnapshotStatus(this.persistenceState().status));
    if (!result.ok || duplicateCommand) {
      return this.success(request, withPersistenceStatus(result, persistenceSnapshotStatus(this.persistenceState().status))) as NativeBridgeResponse<'submit-command'>;
    }

    const persisted = await this.persistence.flush(this.store.toDocument());
    const commandResult = withPersistenceStatus(result, persistenceSnapshotStatus(persisted.status));
    if (commandResult.ok) {
      this.pendingEvents.push(this.snapshotEvent(commandResult.value.snapshot));
    }
    return this.success(request, commandResult) as NativeBridgeResponse<'submit-command'>;
  }

  private async exactPreview(request: NativeBridgeRequest<'exact-preview'>): Promise<NativeBridgeResponse<'exact-preview'>> {
    const payload = request.payload as NativePreviewPayload;
    const previewRequest = payload.request;
    const validated = validateCopyCompiledDraftRequest({
      draftId: previewRequest.draftId,
      expectedRevision: previewRequest.expectedRevision,
      format: previewRequest.format,
    });
    if (!validated.ok) return this.failure(request, 'INVALID_INPUT', validated.errors.map((error) => `${error.path}: ${error.message}`).join(' ')) as NativeBridgeResponse<'exact-preview'>;
    if (previewRequest.expectedContentVersion !== this.library.contentVersion) return this.failure(request, 'STALE_DRAFT', 'The library changed. Refresh before previewing.') as NativeBridgeResponse<'exact-preview'>;

    const current = this.snapshot().drafts[previewRequest.draftId];
    if (current.revision !== previewRequest.expectedRevision) return this.failure(request, 'STALE_DRAFT', 'The draft changed. Refresh before previewing.') as NativeBridgeResponse<'exact-preview'>;
    const compile = previewRequest.draftId === 'create' ? engine.compileCreate : engine.compileEdit;
    let result;
    try {
      result = compile(this.library, { ...current, outputFormat: previewRequest.format });
    } catch {
      return this.failure(request, 'INTERNAL', 'The prompt could not be compiled.') as NativeBridgeResponse<'exact-preview'>;
    }
    if (result.revision !== previewRequest.expectedRevision) return this.failure(request, 'STALE_DRAFT', 'The draft changed while it was compiling.') as NativeBridgeResponse<'exact-preview'>;
    if (result.errors.length > 0) return this.failure(request, 'INVALID_INPUT', result.errors.map((error) => error.message).join(' ')) as NativeBridgeResponse<'exact-preview'>;
    const preview: CompiledDraftPreview = {
      ...result,
      draftId: previewRequest.draftId,
      format: previewRequest.format,
      contentVersion: this.library.contentVersion,
    };
    return this.success(request, preview) as NativeBridgeResponse<'exact-preview'>;
  }

  private exactLibraryText(request: NativeBridgeRequest<'exact-library-text'>): NativeBridgeResponse<'exact-library-text'> {
    const payload = request.payload as NativeLibraryTextPayload;
    const resolved = resolveLibraryText(this.library, payload.request as LibraryCopyTextRequest);
    if (!resolved.ok) {
      const code: BridgeError['code'] = resolved.error.code === 'STALE_DRAFT' ? 'STALE_DRAFT' : resolved.error.code === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'INVALID_INPUT';
      return this.failure(request, code, resolved.error.message) as NativeBridgeResponse<'exact-library-text'>;
    }
    return this.success(request, resolved.value) as NativeBridgeResponse<'exact-library-text'>;
  }

  private async flush(request: NativeBridgeRequest<'flush'>): Promise<NativeBridgeResponse<'flush'>> {
    const payload = request.payload as NativeFlushPayload;
    const state = await this.persistence.flush(this.store.toDocument());
    return this.success(request, this.flushResult(payload.afterSequence, state)) as NativeBridgeResponse<'flush'>;
  }

  private async shutdown(request: NativeBridgeRequest<'shutdown'>): Promise<NativeBridgeResponse<'shutdown'>> {
    await this.persistence.flush(this.store.toDocument());
    await this.persistence.release();
    this.closed = true;
    const payload: NativeFlushResult = this.flushResult(this.store.toDocument().sequence, this.persistenceState());
    return this.success(request, { accepted: true, flush: payload }) as NativeBridgeResponse<'shutdown'>;
  }

  private flushResult(requestedSequence: number, state: PersistenceState): NativeFlushResult {
    return {
      requestedSequence,
      completedSequence: state.sequence,
      persistedThroughSequence: state.flushedSequence,
      persistence: state.status,
      durable: state.status === 'disk' && state.flushedSequence >= requestedSequence,
      pendingCommandIds: [],
    };
  }

  private persistenceState(): PersistenceState {
    return this.persistence.getState(this.store.toDocument().sequence);
  }

  public async release(): Promise<void> {
    await this.persistence.release();
  }

  private snapshotEvent(snapshot: CueSnapshot): NativeBridgeEvent {
    const event: DraftChangedEvent = { snapshot, sourceClientId: this.boundClientId };
    return {
      protocolVersion: NATIVE_BRIDGE_PROTOCOL_VERSION,
      kind: 'event',
      clientId: this.boundClientId ?? 'unknown-client',
      helperSessionId: this.helperSessionId,
      operation: 'snapshot',
      payload: event,
    };
  }

  private success(request: NativeBridgeRequest, payload: unknown): NativeBridgeResponse {
    return { ...responseIdentity(request, this.helperSessionId), ok: true, payload } as NativeBridgeResponse;
  }

  private failure(
    identity: NativeBridgeRequest | ReturnType<typeof identityFor>,
    code: BridgeError['code'],
    message: string,
  ): NativeBridgeResponse {
    const base = 'kind' in identity && identity.kind === 'request'
      ? responseIdentity(identity, this.helperSessionId)
      : {
          protocolVersion: NATIVE_BRIDGE_PROTOCOL_VERSION,
          kind: 'response',
          clientId: identity.clientId,
          helperSessionId: this.helperSessionId,
          requestId: identity.requestId,
          ...(identity.surfaceSessionId === undefined ? {} : { surfaceSessionId: identity.surfaceSessionId }),
          operation: identity.operation,
        };
    return { ...base, ok: false, error: bridgeError(code, message) } as NativeBridgeResponse;
  }
}

export const createNativeRuntime = async (options: NativeRuntimeFactoryOptions = {}): Promise<NativeRuntime> => {
  const library = options.library ?? legacyLibrary;
  const libraryValidation = validateLibrary(library);
  if (!libraryValidation.ok) throw new Error(libraryValidation.errors.map((error) => `${error.path}: ${error.message}`).join(' '));
  const breakdown = acceptedRecordBreakdown(library);
  const total = Object.values(breakdown).reduce((sum, count) => sum + count, 0);
  if (total !== 14 || breakdown.atoms !== 9 || breakdown.bundles !== 0 || breakdown.presets !== 1 || breakdown.editRecipes !== 4) {
    throw new Error(`The helper requires the accepted 14-record projection; received ${breakdown.atoms}/${breakdown.bundles}/${breakdown.presets}/${breakdown.editRecipes}.`);
  }

  const persistence = options.persistence instanceof DraftPersistence
    ? options.persistence
    : new DraftPersistence({
        path: options.persistencePath ?? (options.persistence as DraftPersistenceOptions | undefined)?.path,
        write: (options.persistence as DraftPersistenceOptions | undefined)?.write,
      });
  const loaded = await persistence.load(library);
  return new NativeRuntime(library, persistence, loaded.document, options);
};

export type { NativeBridgeResponse };
