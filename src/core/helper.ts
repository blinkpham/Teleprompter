import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { JsonLinesDecoder, encodeJsonLine } from './json-lines';
import { createNativeRuntime, type NativeRuntime } from './runtime';

export interface HelperOptions {
  /** Omit for an explicit disposable, session-only profile. */
  readonly persistencePath?: string;
  readonly runtime?: NativeRuntime;
  readonly input?: NodeJS.ReadableStream;
  readonly output?: NodeJS.WritableStream;
  readonly errorOutput?: NodeJS.WritableStream;
}

const isWritable = (value: NodeJS.WritableStream): value is NodeJS.WritableStream & { write: (chunk: string) => boolean } => typeof value.write === 'function';

const transportFailure = (runtime: NativeRuntime, message: string): Record<string, unknown> => ({
  protocolVersion: 1,
  kind: 'response',
  requestId: `transport-${Date.now()}`,
  clientId: 'transport',
  helperSessionId: runtime.sessionId,
  operation: 'status',
  ok: false,
  error: { code: 'INVALID_INPUT', message },
});

/** Run the local helper over stdin/stdout only; no listener or network port is opened. */
export const runHelper = async (options: HelperOptions = {}): Promise<void> => {
  const runtime = options.runtime ?? await createNativeRuntime({ persistencePath: options.persistencePath });
  const input = options.input ?? process.stdin;
  const output = options.output ?? process.stdout;
  const errorOutput = options.errorOutput ?? process.stderr;
  const decoder = new JsonLinesDecoder();
  let queue = Promise.resolve();
  let stopReading = false;
  let resolveCompletion: () => void = () => undefined;
  const completed = new Promise<void>((resolve) => { resolveCompletion = resolve; });

  const write = (value: unknown): void => {
    if (isWritable(output)) output.write(encodeJsonLine(value));
  };
  const report = (message: string): void => {
    if (isWritable(errorOutput)) errorOutput.write(`${message}\n`);
  };
  const enqueue = (events: readonly ReturnType<JsonLinesDecoder['push']>[number][]): void => {
    if (events.length === 0) return;
    queue = queue.then(async () => {
      for (const event of events) {
        if (event.kind === 'error') {
          write(transportFailure(runtime, event.message));
          continue;
        }
        if (event.value === undefined) continue;
        try {
          write(await runtime.handle(event.value));
          for (const pendingEvent of runtime.drainEvents()) write(pendingEvent);
          if (runtime.isClosed) {
            stopReading = true;
            if (typeof input.pause === 'function') input.pause();
            if (isWritable(output) && 'end' in output && typeof output.end === 'function') output.end();
            resolveCompletion();
            break;
          }
        } catch (cause) {
          report(cause instanceof Error ? cause.message : String(cause));
          write(transportFailure(runtime, 'The helper could not process the request.'));
        }
      }
    });
  };

  input.on('data', (chunk: Buffer | string) => {
    if (stopReading) return;
    enqueue(decoder.push(typeof chunk === 'string' ? chunk : new Uint8Array(chunk)));
  });
  input.on('error', (cause: unknown) => {
    stopReading = true;
    report(cause instanceof Error ? cause.message : String(cause));
    queue = queue.then(() => {
      if (isWritable(output) && 'end' in output && typeof output.end === 'function') output.end();
    });
    resolveCompletion();
  });
  input.on('end', () => {
    enqueue(decoder.end());
    queue = queue.then(() => {
      if (isWritable(output) && 'end' in output && typeof output.end === 'function') output.end();
    });
    resolveCompletion();
  });
  await completed;
  await queue;
};

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  void runHelper().catch((cause) => {
    process.stderr.write(`${cause instanceof Error ? cause.message : String(cause)}\n`);
    process.exitCode = 1;
  });
}
