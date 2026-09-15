# Native data handover — 2026-09-16

## Result

The native helper now has an explicit launch-time persistence boundary:

- `disposable` has no path, never reads or writes the canonical store, and reports session-only state.
- `durable` requires an absolute path. The native host resolves the existing `~/Library/Application Support/teleprompter/cue-drafts.json` path privately and passes it to the helper over the child environment.
- A durable helper acquires `${draft-store}.lock` with exclusive create before reading or writing. A second helper gets deterministic `unavailable`/degraded state; stale locks are not silently stolen.
- Invalid and future-schema bytes remain untouched. Recovery makes a UUID-suffixed, non-overwriting backup plus a SHA-256 manifest. Restore requires the lease, a verified compatible manifest, and a missing target; existing targets are refused.
- Clean durable startup/shutdown is a no-op, and recovery/future-schema state is write-blocked until an explicit restore or migration decision; a quit cannot replace the source with the blank recovery document.
- Shutdown and inherited-pipe end release the lease. Failed writes preserve the accepted in-memory mutation and report non-durable/degraded state.

The native bridge consumes interleaved authoritative snapshot events before accepting the next response. This fixes the observed Apply → Preview identity mismatch. Node resolution now checks `TELEPROMPTER_NODE_PATH`, standard macOS locations, and inherited `PATH`. Packaging is anchored to the native Swift package and fails when the helper is absent; Node remains an explicit runtime dependency and is not claimed as bundled.

## Existing data inventory

The current canonical directory contains `cue-drafts.json`, `preferences.json`, `reference-bindings.json`, `reference-thumbnails/`, and Electron cache/session artifacts. The draft store was observed at schema 1, sequence 32, Create revision 12, and Edit revision 20. This slice transfers only `cue-drafts.json`; preferences, reference bindings, thumbnails, and cache artifacts remain inventory-only until native consumers and a migration decision exist.

## Changed files

- `src/core/persistence.ts` — profiles, lease, recovery backup/manifest, guarded restore, release.
- `src/core/helper.ts` — environment/profile resolution and stream-end release.
- `src/core/runtime.ts` — unavailable writer is degraded; shutdown releases the lease.
- `src/core/core.test.ts` — profile, restart, recovery, restore, writer, and failure coverage.
- `native/TeleprompterNative/Sources/TeleprompterNative/BridgeContract.swift` — private profile/path handover, PATH Node lookup, and event draining.
- `native/TeleprompterNative/Sources/TeleprompterNative/TeleprompterNativeApp.swift` — explicit fixture-fallback warning.
- `native/TeleprompterNative/Scripts/package-app.sh` — helper-required packaging and package-root anchoring.

## Verification

- `npm run typecheck:helper` — pass.
- `npm run test:helper` — pass, 12 tests.
- `npm run helper:build` — pass; `out/helper/teleprompter-helper.js` emitted.
- `swift build --package-path native/TeleprompterNative -c debug` — pass.
- `./native/TeleprompterNative/Scripts/package-app.sh` — pass; helper bundled.
- Packaged native AX smoke — pass: Apply followed by Preview returned the entered `WHAT` text through the helper after the queued snapshot event was consumed. The existing CueView fixture footer remains outside this mission and is not parity evidence.
- Direct native durable startup/clean quit against a temporary copy of the canonical draft — pass; SHA-256 was unchanged and the writer lock was released. No real user data was written.

## Remaining native gates and limitations

- A read-only native durable startup witness and an explicit migration decision are still required before authorizing writes to the real canonical store.
- Native clipboard read-back, Liquid Glass/reduced-transparency behavior, keyboard/focus/bounds coverage, restart persistence, and the full compiler parity matrix remain open native gates.
- The lock coordinates helpers only. Retained Electron persistence does not yet honor it, so this is not absolute cross-host exclusion.
- A crashed process can leave a lock file; automatic lock stealing is intentionally absent. Recovery/restore is explicit and bounded.
- Node is located at runtime rather than bundled. Missing helper or Node resolution logs an explicit fixture warning; the fixture must not be used as durable/compiler parity evidence.
