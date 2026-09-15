import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { dirname, isAbsolute } from 'node:path';
import type { LibraryV2 } from '../shared/teleprompter-types';
import type { NativePersistence } from '../shared/native-bridge';
import {
  createDraftStoreDocument,
  parseDraftStore,
  serializeDraftStore,
  writeJsonAtomically,
  type DraftStoreDocument,
} from '../main/draft-store';

export interface PersistenceState {
  readonly status: NativePersistence;
  readonly configured: boolean;
  readonly sequence: number;
  readonly flushedSequence: number;
  readonly error?: string;
}

export interface DraftPersistenceOptions {
  /** Omit for the explicit disposable, session-only profile. */
  readonly path?: string;
  readonly write?: (path: string, document: string) => Promise<void>;
}

export interface DraftLoadResult {
  readonly document: DraftStoreDocument;
  readonly state: PersistenceState;
}

const errorText = (cause: unknown): string => {
  if (cause instanceof Error && cause.message) return cause.message;
  if (typeof cause === 'string') return cause;
  return 'Unknown persistence error.';
};

const isMissingFile = (cause: unknown): boolean => Boolean(
  cause && typeof cause === 'object' && 'code' in cause && (cause as { readonly code?: unknown }).code === 'ENOENT',
);

export class DraftPersistence {
  private readonly path?: string;
  private readonly write: (path: string, document: string) => Promise<void>;
  private state: PersistenceState;

  public constructor(options: DraftPersistenceOptions = {}) {
    this.path = options.path;
    this.write = options.write ?? (async (path, document) => {
      await fs.mkdir(dirname(path), { recursive: true });
      await writeJsonAtomically(path, document);
    });
    this.state = {
      status: options.path ? 'disk' : 'session',
      configured: Boolean(options.path),
      sequence: 0,
      flushedSequence: 0,
      ...(options.path ? {} : { error: 'The helper is using an explicit disposable profile.' }),
    };
  }

  public getState(sequence: number): PersistenceState {
    this.state = { ...this.state, sequence };
    return this.state;
  }

  public async load(library: LibraryV2): Promise<DraftLoadResult> {
    if (!this.path) {
      const document = createDraftStoreDocument(library, true);
      this.state = {
        status: 'session',
        configured: false,
        sequence: document.sequence,
        flushedSequence: document.sequence,
        error: 'The helper is using an explicit disposable profile.',
      };
      return { document, state: this.state };
    }

    let raw: string;
    try {
      raw = await fs.readFile(this.path, 'utf8');
    } catch (cause) {
      if (isMissingFile(cause)) {
        const document = createDraftStoreDocument(library, true);
        this.state = { status: 'disk', configured: true, sequence: document.sequence, flushedSequence: document.sequence };
        return { document, state: this.state };
      }
      const document = createDraftStoreDocument(library, false);
      this.state = {
        status: 'recovery',
        configured: true,
        sequence: document.sequence,
        flushedSequence: document.sequence,
        error: `Couldn't read the draft store: ${errorText(cause)}`,
      };
      return { document, state: this.state };
    }

    try {
      const loaded = parseDraftStore(JSON.parse(raw) as unknown, library);
      if (loaded.status === 'loaded') {
        this.state = { status: 'disk', configured: true, sequence: loaded.document.sequence, flushedSequence: loaded.document.sequence };
        return { document: loaded.document, state: this.state };
      }
      await this.preserveRecoveryFile(loaded.status);
      this.state = {
        status: 'recovery',
        configured: true,
        sequence: loaded.document.sequence,
        flushedSequence: loaded.document.sequence,
        error: loaded.status === 'future'
          ? 'The draft store is from a newer version.'
          : 'The draft store was recovered into a blank profile.',
      };
      return { document: loaded.document, state: this.state };
    } catch (cause) {
      const document = createDraftStoreDocument(library, false);
      await this.preserveRecoveryFile('recovery');
      this.state = {
        status: 'recovery',
        configured: true,
        sequence: document.sequence,
        flushedSequence: document.sequence,
        error: `Couldn't parse the draft store: ${errorText(cause)}`,
      };
      return { document, state: this.state };
    }
  }

  public async flush(document: DraftStoreDocument): Promise<PersistenceState> {
    if (!this.path) {
      this.state = {
        ...this.state,
        status: 'session',
        configured: false,
        sequence: document.sequence,
        // A session flush completes the in-memory operation but is not durable.
        flushedSequence: this.state.flushedSequence,
      };
      return this.state;
    }
    try {
      await this.write(this.path, serializeDraftStore(document));
      this.state = {
        status: 'disk',
        configured: true,
        sequence: document.sequence,
        flushedSequence: document.sequence,
      };
    } catch (cause) {
      this.state = {
        ...this.state,
        status: 'failed',
        configured: true,
        sequence: document.sequence,
        error: `Couldn't persist the draft store: ${errorText(cause)}`,
      };
    }
    return this.state;
  }

  private async preserveRecoveryFile(reason: string): Promise<void> {
    if (!this.path || !isAbsolute(this.path)) return;
    const recoveryPath = `${this.path}.${reason}-${Date.now()}-${randomUUID()}`;
    try {
      // Keep the source file intact while preserving a non-overwriting recovery copy.
      await fs.copyFile(this.path, recoveryPath);
    } catch {
      // Recovery status remains truthful even if the backup cannot be made.
    }
  }
}
