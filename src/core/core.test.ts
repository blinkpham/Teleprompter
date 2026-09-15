import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { describe, expect, it } from 'vitest';
import type {
  CommandResult,
  CompiledDraftPreview,
  CueSnapshot,
  DraftCommandEnvelope,
  LibraryTextResult,
} from '../shared/teleprompter-types';
import {
  nativeBridgeOperations,
  NATIVE_BRIDGE_MAX_FRAME_BYTES,
  type NativeBridgeOperation,
  type NativeBridgeRequest,
  type NativeBridgeRequestPayloadMap,
  type NativeHelloResponsePayload,
} from '../shared/native-bridge';
import { legacyLibrary } from '../content';
import { encodeJsonLine, JsonLinesDecoder } from './json-lines';
import { runHelper } from './helper';
import { DraftPersistence } from './persistence';
import { createNativeRuntime, type NativeRuntime } from './runtime';

const request = <TOperation extends NativeBridgeOperation>(
  operation: TOperation,
  payload: NativeBridgeRequestPayloadMap[TOperation],
  identity: { readonly clientId: string; readonly helperSessionId: string; readonly requestId: string; readonly surfaceSessionId?: string; readonly commandId?: string },
): NativeBridgeRequest<TOperation> => ({
  protocolVersion: 1,
  kind: 'request',
  clientId: identity.clientId,
  helperSessionId: identity.helperSessionId,
  requestId: identity.requestId,
  ...(identity.surfaceSessionId === undefined ? {} : { surfaceSessionId: identity.surfaceSessionId }),
  ...(identity.commandId === undefined ? {} : { commandId: identity.commandId }),
  operation,
  payload,
});

const hello = (clientId = 'native-client-1', requestId = 'hello-1'): NativeBridgeRequest<'hello'> => request('hello', {
  clientVersion: 'test',
  profileId: 'disposable-test-profile',
  profileKind: 'disposable',
  requestedCapabilities: nativeBridgeOperations,
}, { clientId, helperSessionId: '', requestId });

const bootstrap = async (runtime: NativeRuntime, clientId: string, helperSessionId: string): Promise<CueSnapshot> => {
  const response = await runtime.handle(request('bootstrap', {}, { clientId, helperSessionId, requestId: `bootstrap-${Math.random()}` }));
  expect(response.ok).toBe(true);
  return (response.payload as { readonly snapshot: CueSnapshot }).snapshot;
};

const startRuntime = async (options: Parameters<typeof createNativeRuntime>[0] = {}): Promise<{ readonly runtime: NativeRuntime; readonly clientId: string; readonly helperSessionId: string }> => {
  const runtime = await createNativeRuntime(options);
  const response = await runtime.handle(hello());
  expect(response.ok).toBe(true);
  const payload = response.payload as NativeHelloResponsePayload;
  expect(response.helperSessionId).toBe(payload.helperSessionId);
  return { runtime, clientId: 'native-client-1', helperSessionId: payload.helperSessionId };
};

const commandRequest = (
  envelope: DraftCommandEnvelope,
  helperSessionId: string,
  requestId: string,
): NativeBridgeRequest<'submit-command'> => request('submit-command', { command: envelope }, {
  clientId: envelope.clientId,
  helperSessionId,
  requestId,
  commandId: envelope.commandId,
});

describe('native helper runtime', () => {
  it('publishes the exact 14-record projection and binds one client/session', async () => {
    const { runtime, clientId, helperSessionId } = await startRuntime();
    const capabilities = await runtime.handle(request('capabilities', {}, { clientId, helperSessionId, requestId: 'capabilities-1' }));
    expect(capabilities.ok).toBe(true);
    expect((capabilities.payload as { acceptedRecordIds: readonly string[] }).acceptedRecordIds).toHaveLength(14);
    expect((capabilities.payload as { operations: readonly string[] }).operations).toEqual(nativeBridgeOperations);

    const boot = await runtime.handle(request('bootstrap', {}, { clientId, helperSessionId, requestId: 'bootstrap-1' }));
    expect(boot.ok).toBe(true);
    const snapshot = (boot.payload as { snapshot: CueSnapshot }).snapshot;
    expect((boot.payload as { library: { choices: readonly unknown[] } }).library.choices).toHaveLength(14);
    expect(snapshot.drafts.create.customText.output).toBe('4:5 aspect ratio; 2K resolution target');

    const stale = await runtime.handle(request('status', {}, { clientId, helperSessionId: 'stale-session', requestId: 'stale-1' }));
    expect(stale.ok).toBe(false);
    expect(stale.error?.code).toBe('CONFLICT');

    const secondClient = await runtime.handle(hello('native-client-2', 'hello-2'));
    expect(secondClient.ok).toBe(false);
    expect(secondClient.error?.code).toBe('CONFLICT');

    const duplicate = await runtime.handle(request('status', {}, { clientId, helperSessionId, requestId: 'bootstrap-1' }));
    expect(duplicate.ok).toBe(false);
    expect(duplicate.error?.code).toBe('CONFLICT');
    expect(runtime.getStatus().sequence).toBe(0);
  });

  it('keeps transport success separate from domain conflicts and emits one authoritative event', async () => {
    const { runtime, clientId, helperSessionId } = await startRuntime();
    const initial = await bootstrap(runtime, clientId, helperSessionId);
    const first: DraftCommandEnvelope = {
      commandId: 'command-1',
      clientId,
      draftId: 'create',
      expectedFieldRevisions: { what: initial.fieldRevisions.create.what },
      command: { type: 'set-what', text: 'a quiet gallery' },
    };
    const accepted = await runtime.handle(commandRequest(first, helperSessionId, 'request-command-1'));
    expect(accepted.ok).toBe(true);
    expect((accepted.payload as CommandResult).ok).toBe(true);
    expect(runtime.drainEvents()).toHaveLength(1);

    const conflict: DraftCommandEnvelope = { ...first, commandId: 'command-conflict', command: { type: 'set-what', text: 'stale text' } };
    const rejected = await runtime.handle(commandRequest(conflict, helperSessionId, 'request-command-conflict'));
    expect(rejected.ok).toBe(true);
    const domain = rejected.payload as CommandResult;
    expect(domain.ok).toBe(false);
    if (!domain.ok) expect(domain.error.code).toBe('CONFLICT');
    expect(runtime.drainEvents()).toHaveLength(0);
    expect(runtime.getStatus().sequence).toBe(1);
  });

  it('deduplicates command IDs without deduplicating request IDs into a second mutation', async () => {
    const { runtime, clientId, helperSessionId } = await startRuntime();
    const initial = await bootstrap(runtime, clientId, helperSessionId);
    const first: DraftCommandEnvelope = {
      commandId: 'command-idempotent',
      clientId,
      draftId: 'create',
      expectedFieldRevisions: { what: initial.fieldRevisions.create.what },
      command: { type: 'set-what', text: 'first text' },
    };
    const firstResponse = await runtime.handle(commandRequest(first, helperSessionId, 'request-first'));
    expect(firstResponse.ok).toBe(true);
    runtime.drainEvents();
    const duplicateResponse = await runtime.handle(commandRequest({ ...first, command: { type: 'set-what', text: 'different text' } }, helperSessionId, 'request-second'));
    expect(duplicateResponse.ok).toBe(true);
    expect((duplicateResponse.payload as CommandResult).ok).toBe(true);
    expect(runtime.drainEvents()).toHaveLength(0);
    expect(runtime.getStatus().sequence).toBe(1);
    expect((await bootstrap(runtime, clientId, helperSessionId)).drafts.create.what).toBe('first text');
  });

  it('returns exact Create and Edit compiler output and rejects stale revisions/content', async () => {
    const { runtime, clientId, helperSessionId } = await startRuntime();
    const initial = await bootstrap(runtime, clientId, helperSessionId);
    const createCommand: DraftCommandEnvelope = {
      commandId: 'create-what', clientId, draftId: 'create',
      expectedFieldRevisions: { what: initial.fieldRevisions.create.what },
      command: { type: 'set-what', text: 'a quiet gallery' },
    };
    await runtime.handle(commandRequest(createCommand, helperSessionId, 'create-what-request'));
    runtime.drainEvents();
    const afterCreate = await bootstrap(runtime, clientId, helperSessionId);
    const createPreview = await runtime.handle(request('exact-preview', {
      request: {
        requestId: 'create-preview-request',
        draftId: 'create',
        expectedRevision: afterCreate.drafts.create.revision,
        format: 'expanded',
        expectedContentVersion: legacyLibrary.contentVersion,
      },
    }, { clientId, helperSessionId, requestId: 'create-preview-request', surfaceSessionId: 'surface-create' }));
    expect(createPreview.ok).toBe(true);
    const createPayload = createPreview.payload as CompiledDraftPreview;
    expect(createPayload.text).toContain('WHAT:\na quiet gallery');
    expect(createPayload.text).toContain('OUTPUT:\n4:5 aspect ratio; 2K resolution target');
    expect(createPayload.draftId).toBe('create');

    const recipe = legacyLibrary.editRecipes[0]!;
    const editCommand: DraftCommandEnvelope = {
      commandId: 'edit-recipe', clientId, draftId: 'edit',
      expectedFieldRevisions: { [`recipe:${recipe.id}`]: afterCreate.fieldRevisions.edit[`recipe:${recipe.id}`] },
      command: { type: 'select-recipe', recipeId: recipe.id },
    };
    const editAccepted = await runtime.handle(commandRequest(editCommand, helperSessionId, 'edit-recipe-request'));
    expect(editAccepted.ok).toBe(true);
    runtime.drainEvents();
    const afterRecipe = await bootstrap(runtime, clientId, helperSessionId);
    const editPreview = await runtime.handle(request('exact-preview', {
      request: {
        requestId: 'edit-preview-request', draftId: 'edit', expectedRevision: afterRecipe.drafts.edit.revision,
        format: 'shorthand', expectedContentVersion: legacyLibrary.contentVersion,
      },
    }, { clientId, helperSessionId, requestId: 'edit-preview-request' }));
    expect(editPreview.ok).toBe(true);
    const editPayload = editPreview.payload as CompiledDraftPreview;
    expect(editPayload.text).toContain('BASE:\nUse image 1 as the base.');
    expect(editPayload.draftId).toBe('edit');
    expect(editPayload.format).toBe('shorthand');

    const staleRevision = await runtime.handle(request('exact-preview', {
      request: {
        requestId: 'stale-preview-request', draftId: 'create', expectedRevision: 0,
        format: 'expanded', expectedContentVersion: legacyLibrary.contentVersion,
      },
    }, { clientId, helperSessionId, requestId: 'stale-preview-request' }));
    expect(staleRevision.ok).toBe(false);
    expect(staleRevision.error?.code).toBe('STALE_DRAFT');
    const staleContent = await runtime.handle(request('exact-preview', {
      request: {
        requestId: 'stale-content-request', draftId: 'create', expectedRevision: afterCreate.drafts.create.revision,
        format: 'expanded', expectedContentVersion: '1900-01-01.1',
      },
    }, { clientId, helperSessionId, requestId: 'stale-content-request' }));
    expect(staleContent.ok).toBe(false);
    expect(staleContent.error?.code).toBe('STALE_DRAFT');
  });

  it('preserves emoji and combining-mark UTF-16 quick-add ranges', async () => {
    const { runtime, clientId, helperSessionId } = await startRuntime();
    const initial = await bootstrap(runtime, clientId, helperSessionId);
    const what = 'e\u0301 😀 /cam';
    const setWhat: DraftCommandEnvelope = {
      commandId: 'what-emoji', clientId, draftId: 'create',
      expectedFieldRevisions: { what: initial.fieldRevisions.create.what },
      command: { type: 'set-what', text: what },
    };
    await runtime.handle(commandRequest(setWhat, helperSessionId, 'what-emoji-request'));
    runtime.drainEvents();
    const after = await bootstrap(runtime, clientId, helperSessionId);
    const start = what.lastIndexOf('/cam');
    const acceptance: DraftCommandEnvelope = {
      commandId: 'quick-add-emoji', clientId, draftId: 'create',
      expectedFieldRevisions: {
        what: after.fieldRevisions.create.what,
        'axis:axis.camera.focal': after.fieldRevisions.create['axis:axis.camera.focal'],
        preset: after.fieldRevisions.create.preset,
      },
      command: {
        type: 'accept-quick-add',
        acceptance: {
          target: { kind: 'token', recordId: 'atom.camera.focal.natural50' },
          queryRange: { start, end: start + '/cam'.length },
          queryText: '/cam', expectedWhat: what, expectedContentVersion: legacyLibrary.contentVersion,
        },
      },
    };
    const response = await runtime.handle(commandRequest(acceptance, helperSessionId, 'quick-add-emoji-request'));
    expect(response.ok).toBe(true);
    const result = response.payload as CommandResult;
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.snapshot.drafts.create.what).toBe('e\u0301 😀 ');
  });

  it('resolves exact library text and rejects a stale content version', async () => {
    const { runtime, clientId, helperSessionId } = await startRuntime();
    const atom = legacyLibrary.atoms.find((candidate) => candidate.id === 'atom.camera.focal.natural50')!;
    const expanded = await runtime.handle(request('exact-library-text', {
      request: { recordId: atom.id, format: 'expanded', expectedContentVersion: legacyLibrary.contentVersion },
    }, { clientId, helperSessionId, requestId: 'library-expanded' }));
    expect(expanded.ok).toBe(true);
    expect((expanded.payload as LibraryTextResult).text).toBe(atom.expansion);
    const shorthand = await runtime.handle(request('exact-library-text', {
      request: { recordId: atom.id, format: 'shorthand', expectedContentVersion: legacyLibrary.contentVersion },
    }, { clientId, helperSessionId, requestId: 'library-shorthand' }));
    expect(shorthand.ok).toBe(true);
    expect((shorthand.payload as LibraryTextResult).text).toBe(atom.shorthand);
    const stale = await runtime.handle(request('exact-library-text', {
      request: { recordId: atom.id, format: 'expanded', expectedContentVersion: '1900-01-01.1' },
    }, { clientId, helperSessionId, requestId: 'library-stale' }));
    expect(stale.ok).toBe(false);
    expect(stale.error?.code).toBe('STALE_DRAFT');
  });
});

describe('native helper persistence and stream', () => {
  it('reports durable disk flushes and does not replay the disposable profile after restart', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'teleprompter-helper-'));
    const path = join(directory, 'draft-store.json');
    try {
      const first = await startRuntime({ persistencePath: path });
      const initial = await bootstrap(first.runtime, first.clientId, first.helperSessionId);
      const command: DraftCommandEnvelope = {
        commandId: 'durable-command', clientId: first.clientId, draftId: 'create',
        expectedFieldRevisions: { what: initial.fieldRevisions.create.what },
        command: { type: 'set-what', text: 'durable text' },
      };
      await first.runtime.handle(commandRequest(command, first.helperSessionId, 'durable-request'));
      first.runtime.drainEvents();
      const flushed = await first.runtime.handle(request('flush', { reason: 'user', afterSequence: 1 }, { clientId: first.clientId, helperSessionId: first.helperSessionId, requestId: 'durable-flush' }));
      expect(flushed.ok).toBe(true);
      const flush = flushed.payload as { persistedThroughSequence: number; durable: boolean; persistence: string };
      expect(flush).toMatchObject({ persistedThroughSequence: 1, durable: true, persistence: 'disk' });
      expect(JSON.parse(await readFile(path, 'utf8')).drafts.create.what).toBe('durable text');

      const restarted = await startRuntime({ persistencePath: path });
      expect((await bootstrap(restarted.runtime, restarted.clientId, restarted.helperSessionId)).drafts.create.what).toBe('durable text');
      const disposable = await startRuntime();
      expect((await bootstrap(disposable.runtime, disposable.clientId, disposable.helperSessionId)).drafts.create.what).toBe('');
      const sessionFlush = await disposable.runtime.handle(request('flush', { reason: 'user', afterSequence: 0 }, { clientId: disposable.clientId, helperSessionId: disposable.helperSessionId, requestId: 'session-flush' }));
      expect(sessionFlush.ok).toBe(true);
      expect(sessionFlush.payload).toMatchObject({ persistence: 'session', durable: false, persistedThroughSequence: 0 });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('keeps an accepted mutation visible when the explicit disk write fails', async () => {
    const persistence = new DraftPersistence({
      path: join(tmpdir(), 'teleprompter-helper-write-failure.json'),
      write: async () => { throw new Error('write blocked'); },
    });
    const { runtime, clientId, helperSessionId } = await startRuntime({ persistence });
    const initial = await bootstrap(runtime, clientId, helperSessionId);
    const command: DraftCommandEnvelope = {
      commandId: 'failed-disk-command', clientId, draftId: 'create',
      expectedFieldRevisions: { what: initial.fieldRevisions.create.what },
      command: { type: 'set-what', text: 'accepted in memory' },
    };
    const response = await runtime.handle(commandRequest(command, helperSessionId, 'failed-disk-request'));
    expect(response.ok).toBe(true);
    const result = response.payload as CommandResult;
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.snapshot.persistenceStatus).toBe('session');
    runtime.drainEvents();
    const flush = await runtime.handle(request('flush', { reason: 'user', afterSequence: 1 }, { clientId, helperSessionId, requestId: 'failed-disk-flush' }));
    expect(flush.ok).toBe(true);
    expect(flush.payload).toMatchObject({ persistence: 'failed', durable: false, persistedThroughSequence: 0 });
    expect(runtime.getStatus().state).toBe('degraded');
  });

  it('handles split UTF-8, coalesced frames, malformed lines, byte limits, and clean helper exit', async () => {
    const runtime = await createNativeRuntime();
    const decoder = new JsonLinesDecoder();
    const wire = encodeJsonLine(hello()) + encodeJsonLine({ ...hello('native-client-1', 'hello-2'), helperSessionId: 'invalid' });
    const bytes = new TextEncoder().encode(wire);
    const events = [] as ReturnType<JsonLinesDecoder['push']>[number][];
    for (let index = 0; index < bytes.byteLength; index += 1) events.push(...decoder.push(bytes.slice(index, index + 1)));
    expect(events.filter((event) => event.kind === 'message')).toHaveLength(2);

    const oversized = decoder.push(new TextEncoder().encode('x'.repeat(NATIVE_BRIDGE_MAX_FRAME_BYTES + 1)));
    expect(oversized[0]).toMatchObject({ kind: 'error' });
    expect(decoder.push('\n')).toHaveLength(0);
    expect(decoder.push('{"ok":true}\n')[0]).toMatchObject({ kind: 'message' });
    expect(decoder.push('{"unterminated":')).toHaveLength(0);
    expect(decoder.end()[0]).toMatchObject({ kind: 'error', message: /unterminated/ });
    expect(decoder.push('{"bad":}\n')[0]).toMatchObject({ kind: 'error', message: /malformed/ });

    const input = new PassThrough();
    const output = new PassThrough();
    const errorOutput = new PassThrough();
    const outputChunks: Buffer[] = [];
    const errorChunks: Buffer[] = [];
    output.on('data', (chunk: Buffer) => outputChunks.push(chunk));
    errorOutput.on('data', (chunk: Buffer) => errorChunks.push(chunk));
    const running = runHelper({ runtime, input, output, errorOutput });
    const helloFrame = hello();
    input.end(encodeJsonLine(helloFrame) + encodeJsonLine(request('shutdown', { reason: 'user' }, {
      clientId: 'native-client-1', helperSessionId: runtime.sessionId, requestId: 'shutdown-1',
    })));
    await running;
    const frames = Buffer.concat(outputChunks).toString('utf8').trim().split('\n').map((line) => JSON.parse(line) as Record<string, unknown>);
    expect(frames.map((frame) => frame.operation)).toEqual(['hello', 'shutdown']);
    expect(errorChunks).toHaveLength(0);
    expect(output.writableEnded).toBe(true);
  });
});
