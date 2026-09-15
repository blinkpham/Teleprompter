import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { promises as fs } from 'node:fs';
import type { FileHandle } from 'node:fs/promises';
import { basename, dirname, isAbsolute } from 'node:path';
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
  readonly profile: 'disposable' | 'durable';
  readonly configured: boolean;
  readonly writer: 'held' | 'not-applicable' | 'unavailable';
  readonly sequence: number;
  readonly flushedSequence: number;
  readonly recoveryBackup?: RecoveryBackup;
  readonly error?: string;
}

export interface DraftPersistenceOptions {
  /** The profile is explicit at the helper boundary; a path implies durable for compatibility. */
  readonly profile?: 'disposable' | 'durable';
  /** Required for the durable profile. Omit for the explicit disposable, session-only profile. */
  readonly path?: string;
  readonly write?: (path: string, document: string) => Promise<void>;
}

export interface RecoveryBackup {
  readonly path: string;
  readonly manifestPath: string;
  readonly reason: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly manifestWritten: boolean;
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

const errorCode = (cause: unknown): string | undefined => (
  cause && typeof cause === 'object' && 'code' in cause
    ? String((cause as { readonly code?: unknown }).code)
    : undefined
);

const recoveryError = (reason: string, backup?: RecoveryBackup): string => backup?.manifestWritten
  ? `${reason} The original file was preserved as a verified recovery backup.`
  : backup
    ? `${reason} The original file was copied, but its checksum manifest could not be written.`
    : `${reason} The original file could not be copied for recovery.`;

export class DraftPersistence {
  private readonly path?: string;
  private readonly profile: 'disposable' | 'durable';
  private readonly lockPath?: string;
  private readonly write: (path: string, document: string) => Promise<void>;
  private lockHandle?: FileHandle;
  private state: PersistenceState;

  public constructor(options: DraftPersistenceOptions = {}) {
    this.profile = options.profile ?? (options.path ? 'durable' : 'disposable');
    if (this.profile === 'durable' && (!options.path || !isAbsolute(options.path))) {
      throw new Error('Durable persistence requires an absolute draft-store path.');
    }
    if (this.profile === 'disposable' && options.path !== undefined) {
      throw new Error('The disposable profile cannot be given a persistence path.');
    }
    this.path = options.path;
    this.lockPath = this.path ? `${this.path}.lock` : undefined;
    this.write = options.write ?? (async (path, document) => {
      await fs.mkdir(dirname(path), { recursive: true });
      await writeJsonAtomically(path, document);
    });
    this.state = {
      status: this.profile === 'durable' ? 'disk' : 'session',
      profile: this.profile,
      configured: this.profile === 'durable',
      writer: this.profile === 'durable' ? 'unavailable' : 'not-applicable',
      sequence: 0,
      flushedSequence: 0,
      ...(this.profile === 'disposable' ? { error: 'The helper is using an explicit disposable profile.' } : {}),
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
        profile: 'disposable',
        configured: false,
        writer: 'not-applicable',
        sequence: document.sequence,
        flushedSequence: document.sequence,
        error: 'The helper is using an explicit disposable profile.',
      };
      return { document, state: this.state };
    }

    if (!(await this.acquireWriter())) {
      const document = createDraftStoreDocument(library, false);
      this.state = {
        ...this.state,
        sequence: document.sequence,
        flushedSequence: document.sequence,
      };
      return { document, state: this.state };
    }

    let rawBytes: Buffer;
    try {
      rawBytes = await fs.readFile(this.path);
    } catch (cause) {
      if (isMissingFile(cause)) {
        const document = createDraftStoreDocument(library, true);
        this.state = {
          status: 'disk',
          profile: 'durable',
          configured: true,
          writer: 'held',
          sequence: document.sequence,
          flushedSequence: document.sequence,
        };
        return { document, state: this.state };
      }
      const document = createDraftStoreDocument(library, false);
      this.state = {
        ...this.state,
        status: 'recovery',
        sequence: document.sequence,
        flushedSequence: document.sequence,
        error: `Couldn't read the draft store. The helper remains in recovery mode: ${errorText(cause)}`,
      };
      return { document, state: this.state };
    }

    const raw = rawBytes.toString('utf8');
    try {
      const loaded = parseDraftStore(JSON.parse(raw) as unknown, library);
      if (loaded.status === 'loaded') {
        this.state = {
          status: 'disk',
          profile: 'durable',
          configured: true,
          writer: 'held',
          sequence: loaded.document.sequence,
          flushedSequence: loaded.document.sequence,
        };
        return { document: loaded.document, state: this.state };
      }
      const backup = await this.preserveRecoveryFile(loaded.status, rawBytes);
      this.state = {
        ...this.state,
        status: 'recovery',
        sequence: loaded.document.sequence,
        flushedSequence: loaded.document.sequence,
        error: loaded.status === 'future'
          ? recoveryError('The draft store is from a newer version.', backup)
          : recoveryError('The draft store was recovered into a blank profile.', backup),
        ...(backup === undefined ? {} : { recoveryBackup: backup }),
      };
      return { document: loaded.document, state: this.state };
    } catch (cause) {
      const document = createDraftStoreDocument(library, false);
      const backup = await this.preserveRecoveryFile('recovery', rawBytes);
      this.state = {
        ...this.state,
        status: 'recovery',
        sequence: document.sequence,
        flushedSequence: document.sequence,
        error: recoveryError(`Couldn't parse the draft store: ${errorText(cause)}`, backup),
        ...(backup === undefined ? {} : { recoveryBackup: backup }),
      };
      return { document, state: this.state };
    }
  }

  public async flush(document: DraftStoreDocument): Promise<PersistenceState> {
    if (!this.path) {
      this.state = {
        ...this.state,
        status: 'session',
        profile: 'disposable',
        configured: false,
        writer: 'not-applicable',
        sequence: document.sequence,
        // A session flush completes the in-memory operation but is not durable.
        flushedSequence: this.state.flushedSequence,
      };
      return this.state;
    }
    if (!this.lockHandle) {
      this.state = {
        ...this.state,
        status: this.state.status === 'failed' ? 'failed' : 'unavailable',
        profile: 'durable',
        configured: true,
        writer: 'unavailable',
        sequence: document.sequence,
        error: this.state.error ?? 'The durable draft store has no writer lease.',
      };
      return this.state;
    }
    // A clean launch/quit must not rewrite an existing document. Recovery is
    // also write-blocked until an explicit restore/migration decision.
    if (document.sequence <= this.state.flushedSequence || this.state.status === 'recovery') {
      this.state = { ...this.state, sequence: document.sequence };
      return this.state;
    }
    try {
      await this.write(this.path, serializeDraftStore(document));
      this.state = {
        status: 'disk',
        profile: 'durable',
        configured: true,
        writer: 'held',
        sequence: document.sequence,
        flushedSequence: document.sequence,
      };
    } catch (cause) {
      this.state = {
        ...this.state,
        profile: 'durable',
        status: 'failed',
        configured: true,
        writer: 'held',
        sequence: document.sequence,
        error: `Couldn't persist the draft store: ${errorText(cause)}`,
      };
    }
    return this.state;
  }

  /** Restore only a verified, compatible backup into a missing target. No overwrite is implicit. */
  public async restoreFromBackup(library: LibraryV2, backupPath: string): Promise<PersistenceState> {
    if (!this.path || !this.lockHandle) {
      this.state = {
        ...this.state,
        status: this.path ? 'unavailable' : 'session',
        writer: this.path ? 'unavailable' : 'not-applicable',
        error: this.path ? 'Restore requires the durable writer lease.' : 'A disposable profile cannot restore a backup.',
      };
      return this.state;
    }
    if (!isAbsolute(backupPath) || backupPath === this.path) {
      this.state = { ...this.state, status: 'failed', writer: 'held', error: 'Restore requires a separate absolute backup path.' };
      return this.state;
    }
    try {
      await fs.access(this.path);
      this.state = { ...this.state, status: 'failed', writer: 'held', error: 'Restore refused because the target already exists.' };
      return this.state;
    } catch (cause) {
      if (!isMissingFile(cause)) {
        this.state = { ...this.state, status: 'failed', writer: 'held', error: `Restore could not inspect the target: ${errorText(cause)}` };
        return this.state;
      }
    }
    try {
      const manifestPath = `${backupPath}.manifest.json`;
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')) as Record<string, unknown>;
      const source = await fs.readFile(backupPath);
      const sha256 = createHash('sha256').update(source).digest('hex');
      if (manifest.schemaVersion !== 1
        || manifest.sourceFile !== basename(this.path)
        || manifest.bytes !== source.byteLength
        || manifest.sha256 !== sha256) {
        throw new Error('The backup checksum manifest does not match the backup bytes.');
      }
      const loaded = parseDraftStore(JSON.parse(source.toString('utf8')) as unknown, library);
      if (loaded.status !== 'loaded') throw new Error('The backup is not compatible with the current draft-store schema.');
      await this.write(this.path, source.toString('utf8'));
      this.state = {
        status: 'disk',
        profile: 'durable',
        configured: true,
        writer: 'held',
        sequence: loaded.document.sequence,
        flushedSequence: loaded.document.sequence,
        recoveryBackup: {
          path: backupPath,
          manifestPath,
          reason: typeof manifest.reason === 'string' ? manifest.reason : 'restore',
          bytes: source.byteLength,
          sha256,
          manifestWritten: true,
        },
      };
    } catch (cause) {
      this.state = {
        ...this.state,
        status: 'failed',
        profile: 'durable',
        configured: true,
        writer: 'held',
        error: `Restore refused: ${errorText(cause)}`,
      };
    }
    return this.state;
  }

  /** Release the exclusive writer lease; the helper calls this on shutdown or stream end. */
  public async release(): Promise<void> {
    const handle = this.lockHandle;
    this.lockHandle = undefined;
    if (!handle || !this.lockPath) return;
    try {
      await handle.close();
    } finally {
      try {
        await fs.unlink(this.lockPath);
      } catch (cause) {
        if (errorCode(cause) !== 'ENOENT') {
          this.state = { ...this.state, status: 'failed', writer: 'unavailable', error: `Couldn't release the durable writer lease: ${errorText(cause)}` };
        }
      }
    }
  }

  private async acquireWriter(): Promise<boolean> {
    if (!this.path || !this.lockPath) return true;
    try {
      await fs.mkdir(dirname(this.path), { recursive: true });
      const handle = await fs.open(this.lockPath, 'wx');
      this.lockHandle = handle;
      try {
        await handle.writeFile(JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }) + '\n', 'utf8');
      } catch (cause) {
        await handle.close();
        this.lockHandle = undefined;
        await fs.unlink(this.lockPath).catch(() => undefined);
        throw cause;
      }
      this.state = { ...this.state, status: 'disk', profile: 'durable', configured: true, writer: 'held', error: undefined };
      return true;
    } catch (cause) {
      const alreadyOwned = errorCode(cause) === 'EEXIST';
      this.state = {
        ...this.state,
        status: alreadyOwned ? 'unavailable' : 'failed',
        profile: 'durable',
        configured: true,
        writer: 'unavailable',
        error: alreadyOwned
          ? 'The durable draft store is already owned by another helper.'
          : `Couldn't acquire the durable writer lease: ${errorText(cause)}`,
      };
      return false;
    }
  }

  private async preserveRecoveryFile(reason: string, source: Uint8Array): Promise<RecoveryBackup | undefined> {
    if (!this.path || !isAbsolute(this.path)) return undefined;
    const recoveryPath = `${this.path}.${reason}-${Date.now()}-${randomUUID()}.backup.json`;
    const manifestPath = `${recoveryPath}.manifest.json`;
    const bytes = source.byteLength;
    const sha256 = createHash('sha256').update(source).digest('hex');
    try {
      // Keep the source file intact while preserving a non-overwriting recovery copy.
      await fs.copyFile(this.path, recoveryPath, constants.COPYFILE_EXCL);
    } catch {
      return undefined;
    }
    try {
      await fs.writeFile(manifestPath, `${JSON.stringify({
        schemaVersion: 1,
        sourceFile: basename(this.path),
        reason,
        bytes,
        sha256,
      }, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
      return { path: recoveryPath, manifestPath, reason, bytes, sha256, manifestWritten: true };
    } catch {
      return { path: recoveryPath, manifestPath, reason, bytes, sha256, manifestWritten: false };
    }
  }
}
