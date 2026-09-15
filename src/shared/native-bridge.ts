import type {
  BridgeError,
  CommandResult,
  CompiledDraftPreview,
  CueSnapshot,
  DraftChangedEvent,
  DraftCommandEnvelope,
  LibraryCopyTextRequest,
  LibraryTextResult,
  Mode,
  PreviewRequest,
  TeleprompterBootstrap,
} from './teleprompter-types';

/** Versioned, newline-delimited transport shared by the native host and local helper. */
export const NATIVE_BRIDGE_PROTOCOL_VERSION = 1 as const;
export const NATIVE_BRIDGE_MAX_FRAME_BYTES = 1_000_000 as const;

export type NativePersistence = 'disk' | 'session' | 'recovery' | 'unavailable' | 'failed';

export type NativeBridgeOperation =
  | 'hello'
  | 'capabilities'
  | 'bootstrap'
  | 'set-active-mode'
  | 'submit-command'
  | 'snapshot'
  | 'exact-preview'
  | 'exact-library-text'
  | 'flush'
  | 'status'
  | 'shutdown';

export type NativeBridgeMessageKind = 'request' | 'response' | 'event';

export interface NativeBridgeIdentity {
  readonly clientId: string;
  /** Empty only on the initial hello request; the helper issues the session ID in its response. */
  readonly helperSessionId: string;
  readonly surfaceSessionId?: string;
}

export interface NativeHelloPayload {
  readonly clientVersion: string;
  readonly profileId: string;
  readonly profileKind: 'disposable';
  readonly requestedCapabilities: readonly NativeBridgeOperation[];
  readonly expectedHelperSessionId?: string;
}

export interface NativeHelloResponsePayload {
  readonly helperSessionId: string;
  readonly acceptedClientId: string;
  readonly profileId: string;
  readonly capabilities: readonly NativeBridgeOperation[];
}

export interface NativeCapabilitiesPayload {
  readonly protocolVersion: typeof NATIVE_BRIDGE_PROTOCOL_VERSION;
  readonly operations: readonly NativeBridgeOperation[];
  readonly contentVersion: string;
  readonly acceptedRecordIds: readonly string[];
  readonly persistence: NativePersistence;
}

export interface NativeSetActiveModePayload {
  readonly mode: Mode;
}

export interface NativeSubmitCommandPayload {
  readonly command: DraftCommandEnvelope;
}

export interface NativePreviewPayload {
  readonly request: PreviewRequest;
}

export interface NativeLibraryTextPayload {
  readonly request: LibraryCopyTextRequest;
}

export interface NativeFlushPayload {
  readonly reason: 'preview' | 'copy' | 'shutdown' | 'user';
  readonly afterSequence: number;
}

export interface NativeFlushResult {
  readonly requestedSequence: number;
  readonly completedSequence: number;
  readonly persistedThroughSequence: number;
  readonly persistence: NativePersistence;
  readonly durable: boolean;
  readonly pendingCommandIds: readonly string[];
}

export interface NativeStatusPayload {
  readonly state: 'ready' | 'busy' | 'degraded' | 'stopped';
  readonly persistence: NativePersistence;
  readonly pendingCommandIds: readonly string[];
  readonly sequence: number;
  readonly persistedThroughSequence: number;
}

export interface NativeShutdownPayload {
  readonly reason: 'user' | 'host-exit' | 'error';
}

export interface NativeShutdownResult {
  readonly accepted: boolean;
  readonly flush: NativeFlushResult;
}

export interface NativeBridgeRequestPayloadMap {
  readonly hello: NativeHelloPayload;
  readonly capabilities: Record<string, never>;
  readonly bootstrap: Record<string, never>;
  readonly 'set-active-mode': NativeSetActiveModePayload;
  readonly 'submit-command': NativeSubmitCommandPayload;
  readonly snapshot: Record<string, never>;
  readonly 'exact-preview': NativePreviewPayload;
  readonly 'exact-library-text': NativeLibraryTextPayload;
  readonly flush: NativeFlushPayload;
  readonly status: Record<string, never>;
  readonly shutdown: NativeShutdownPayload;
}

export interface NativeBridgeResponsePayloadMap {
  readonly hello: NativeHelloResponsePayload;
  readonly capabilities: NativeCapabilitiesPayload;
  readonly bootstrap: TeleprompterBootstrap;
  readonly 'set-active-mode': CueSnapshot;
  /** Transport success may carry a domain-level `CommandResult` rejection. */
  readonly 'submit-command': CommandResult;
  readonly snapshot: DraftChangedEvent;
  readonly 'exact-preview': CompiledDraftPreview;
  readonly 'exact-library-text': LibraryTextResult;
  readonly flush: NativeFlushResult;
  readonly status: NativeStatusPayload;
  readonly shutdown: NativeShutdownResult;
}

export interface NativeBridgeRequest<TOperation extends NativeBridgeOperation = NativeBridgeOperation>
  extends NativeBridgeIdentity {
  readonly protocolVersion: typeof NATIVE_BRIDGE_PROTOCOL_VERSION;
  readonly kind: 'request';
  readonly requestId: string;
  readonly commandId?: string;
  readonly operation: TOperation;
  readonly payload: NativeBridgeRequestPayloadMap[TOperation];
}

export interface NativeBridgeResponse<TOperation extends NativeBridgeOperation = NativeBridgeOperation>
  extends NativeBridgeIdentity {
  readonly protocolVersion: typeof NATIVE_BRIDGE_PROTOCOL_VERSION;
  readonly kind: 'response';
  readonly requestId: string;
  readonly commandId?: string;
  readonly operation: TOperation;
  /** Transport success. A successful submit-command can still carry CommandResult.ok === false. */
  readonly ok: boolean;
  readonly payload?: NativeBridgeResponsePayloadMap[TOperation];
  readonly error?: BridgeError;
}

export interface NativeBridgeEvent extends NativeBridgeIdentity {
  readonly protocolVersion: typeof NATIVE_BRIDGE_PROTOCOL_VERSION;
  readonly kind: 'event';
  readonly requestId?: string;
  readonly operation: 'snapshot';
  readonly payload: DraftChangedEvent;
}

export type NativeBridgeEnvelope =
  | NativeBridgeRequest
  | NativeBridgeResponse
  | NativeBridgeEvent;

export interface NativeWireFixture {
  readonly operation: NativeBridgeOperation;
  readonly request: string;
  readonly response: string;
}

export const nativeBridgeOperations: readonly NativeBridgeOperation[] = [
  'hello',
  'capabilities',
  'bootstrap',
  'set-active-mode',
  'submit-command',
  'snapshot',
  'exact-preview',
  'exact-library-text',
  'flush',
  'status',
  'shutdown',
];

export const isNativeBridgeOperation = (value: unknown): value is NativeBridgeOperation =>
  typeof value === 'string' && nativeBridgeOperations.includes(value as NativeBridgeOperation);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const isInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value);

const isPersistence = (value: unknown): value is NativePersistence =>
  ['disk', 'session', 'recovery', 'unavailable', 'failed'].includes(String(value));

const hasValidError = (value: unknown): value is BridgeError =>
  isRecord(value) && isNonEmptyString(value.code) && isNonEmptyString(value.message);

const hasValidCommandResult = (value: unknown): boolean =>
  isRecord(value) && typeof value.ok === 'boolean' && (value.ok || hasValidError(value.error));

const hasValidRequestPayload = (operation: NativeBridgeOperation, value: unknown, requestId: string): boolean => {
  if (!isRecord(value)) return false;
  switch (operation) {
    case 'hello':
      return isNonEmptyString(value.clientVersion)
        && isNonEmptyString(value.profileId)
        && value.profileKind === 'disposable'
        && Array.isArray(value.requestedCapabilities)
        && value.requestedCapabilities.every(isNativeBridgeOperation)
        && (value.expectedHelperSessionId === undefined || isNonEmptyString(value.expectedHelperSessionId));
    case 'capabilities':
    case 'bootstrap':
    case 'snapshot':
    case 'status':
      return Object.keys(value).length === 0;
    case 'set-active-mode':
      return value.mode === 'create' || value.mode === 'edit';
    case 'submit-command': {
      if (!isRecord(value.command) || !isNonEmptyString(value.command.commandId)) return false;
      return isNonEmptyString(value.command.clientId);
    }
    case 'exact-preview':
      return isRecord(value.request)
        && value.request.requestId === requestId
        && (value.request.draftId === 'create' || value.request.draftId === 'edit')
        && isInteger(value.request.expectedRevision)
        && (value.request.format === 'expanded' || value.request.format === 'shorthand')
        && isNonEmptyString(value.request.expectedContentVersion);
    case 'exact-library-text':
      return isRecord(value.request)
        && isNonEmptyString(value.request.recordId)
        && ['expanded', 'shorthand', 'original'].includes(String(value.request.format))
        && isNonEmptyString(value.request.expectedContentVersion);
    case 'flush':
      return ['preview', 'copy', 'shutdown', 'user'].includes(String(value.reason))
        && isInteger(value.afterSequence)
        && value.afterSequence >= 0;
    case 'shutdown':
      return ['user', 'host-exit', 'error'].includes(String(value.reason));
  }
};

const hasValidResponsePayload = (operation: NativeBridgeOperation, value: unknown): boolean => {
  if (!isRecord(value)) return false;
  switch (operation) {
    case 'hello':
      return isNonEmptyString(value.helperSessionId)
        && isNonEmptyString(value.acceptedClientId)
        && isNonEmptyString(value.profileId)
        && Array.isArray(value.capabilities)
        && value.capabilities.every(isNativeBridgeOperation);
    case 'capabilities':
      return value.protocolVersion === NATIVE_BRIDGE_PROTOCOL_VERSION
        && isNonEmptyString(value.contentVersion)
        && Array.isArray(value.operations)
        && value.operations.every(isNativeBridgeOperation)
        && Array.isArray(value.acceptedRecordIds)
        && value.acceptedRecordIds.every(isNonEmptyString)
        && isPersistence(value.persistence);
    case 'submit-command':
      return hasValidCommandResult(value);
    case 'flush':
      return isInteger(value.requestedSequence)
        && isInteger(value.completedSequence)
        && isInteger(value.persistedThroughSequence)
        && isPersistence(value.persistence)
        && typeof value.durable === 'boolean'
        && Array.isArray(value.pendingCommandIds)
        && value.pendingCommandIds.every(isNonEmptyString);
    case 'status':
      return ['ready', 'busy', 'degraded', 'stopped'].includes(String(value.state))
        && isPersistence(value.persistence)
        && isInteger(value.sequence)
        && isInteger(value.persistedThroughSequence)
        && Array.isArray(value.pendingCommandIds)
        && value.pendingCommandIds.every(isNonEmptyString);
    case 'shutdown':
      return typeof value.accepted === 'boolean' && hasValidResponsePayload('flush', value.flush);
    case 'exact-preview':
      return (value.draftId === 'create' || value.draftId === 'edit')
        && isNonEmptyString(value.contentVersion)
        && (value.format === 'expanded' || value.format === 'shorthand')
        && isNonEmptyString(value.text)
        && isInteger(value.revision);
    case 'exact-library-text':
      return isNonEmptyString(value.recordId)
        && isNonEmptyString(value.contentVersion)
        && ['expanded', 'shorthand', 'original'].includes(String(value.format))
        && typeof value.text === 'string';
    case 'bootstrap':
      return isRecord(value.snapshot) && isRecord(value.library) && isNonEmptyString(value.appVersion);
    case 'set-active-mode':
      return isRecord(value.drafts) && (value.activeMode === 'create' || value.activeMode === 'edit');
    case 'snapshot':
      return isRecord(value.snapshot);
  }
};

/** Strict structural check for one decoded envelope; domain validators run after this boundary. */
export const isNativeBridgeEnvelope = (value: unknown): value is NativeBridgeEnvelope => {
  if (!isRecord(value)) return false;
  if (value.protocolVersion !== NATIVE_BRIDGE_PROTOCOL_VERSION) return false;
  if (!['request', 'response', 'event'].includes(String(value.kind))) return false;
  if (!isNativeBridgeOperation(value.operation)) return false;
  if (!isNonEmptyString(value.clientId)) return false;
  if (typeof value.helperSessionId !== 'string') return false;
  if (value.kind !== 'request' && !isNonEmptyString(value.helperSessionId)) return false;
  if (value.kind === 'request' && value.operation !== 'hello' && !isNonEmptyString(value.helperSessionId)) return false;
  if (value.surfaceSessionId !== undefined && !isNonEmptyString(value.surfaceSessionId)) return false;
  if (value.kind !== 'event' && !isNonEmptyString(value.requestId)) return false;
  if (value.kind === 'request') {
    if (value.commandId !== undefined && !isNonEmptyString(value.commandId)) return false;
    if (value.operation === 'hello' && value.helperSessionId !== '') return false;
    if (!hasValidRequestPayload(value.operation, value.payload, String(value.requestId))) return false;
    if (value.operation === 'submit-command') {
      const command = (value.payload as NativeSubmitCommandPayload).command;
      if (value.commandId !== undefined && value.commandId !== command.commandId) return false;
      if (command.clientId !== value.clientId) return false;
    }
    return true;
  }
  if (value.kind === 'event') {
    return value.operation === 'snapshot' && isRecord(value.payload) && isRecord(value.payload.snapshot);
  }
  if (value.commandId !== undefined && !isNonEmptyString(value.commandId)) return false;
  if (typeof value.ok !== 'boolean') return false;
  if (value.ok) {
    if (value.error !== undefined || value.payload === undefined) return false;
    return hasValidResponsePayload(value.operation, value.payload);
  }
  return value.payload === undefined && hasValidError(value.error);
};

export class NativeBridgeFrameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NativeBridgeFrameError';
  }
}

/** Enforces the byte cap and single-line UTF-8 framing before JSON parsing. */
export const decodeNativeBridgeFrame = (frame: Uint8Array): NativeBridgeEnvelope => {
  if (frame.byteLength > NATIVE_BRIDGE_MAX_FRAME_BYTES) {
    throw new NativeBridgeFrameError('Native bridge frame exceeds the byte limit.');
  }
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(frame);
  } catch {
    throw new NativeBridgeFrameError('Native bridge frame is not valid UTF-8.');
  }
  const line = text.endsWith('\n') ? text.slice(0, -1) : text;
  if (line.includes('\n') || line.includes('\r')) throw new NativeBridgeFrameError('Native bridge frame contains multiple lines.');
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    throw new NativeBridgeFrameError('Native bridge frame is not valid JSON.');
  }
  if (!isNativeBridgeEnvelope(value)) throw new NativeBridgeFrameError('Native bridge envelope failed validation.');
  return value;
};

/** Concrete golden frames used by Swift and Node transport tests. */
export const nativeBridgeGoldenFixtures: readonly NativeWireFixture[] = [
  {
    operation: 'hello',
    request: '{"protocolVersion":1,"kind":"request","clientId":"native-client-1","helperSessionId":"","requestId":"req-hello-1","operation":"hello","payload":{"clientVersion":"native-dev","profileId":"disposable-native-1","profileKind":"disposable","requestedCapabilities":["bootstrap","exact-preview","shutdown"]}}\n',
    response: '{"protocolVersion":1,"kind":"response","clientId":"native-client-1","helperSessionId":"helper-session-1","requestId":"req-hello-1","operation":"hello","ok":true,"payload":{"helperSessionId":"helper-session-1","acceptedClientId":"native-client-1","profileId":"disposable-native-1","capabilities":["hello","bootstrap","exact-preview","shutdown"]}}\n',
  },
  {
    operation: 'exact-preview',
    request: '{"protocolVersion":1,"kind":"request","clientId":"native-client-1","helperSessionId":"helper-session-1","surfaceSessionId":"surface-1","requestId":"req-preview-1","operation":"exact-preview","payload":{"request":{"requestId":"req-preview-1","draftId":"create","expectedRevision":2,"format":"expanded","expectedContentVersion":"2026-09-13.1"}}}\n',
    response: '{"protocolVersion":1,"kind":"response","clientId":"native-client-1","helperSessionId":"helper-session-1","surfaceSessionId":"surface-1","requestId":"req-preview-1","operation":"exact-preview","ok":true,"payload":{"draftId":"create","format":"expanded","contentVersion":"2026-09-13.1","text":"WHAT: a quiet gallery\\n","revision":2,"placeholders":[],"cautions":[],"errors":[],"atomsUsed":[],"unlockedDomains":[]}}\n',
  },
];
