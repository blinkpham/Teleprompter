# Desktop lane handoff — adaptive surface and local references

Date: 2026-09-14. Owner: desktop/adaptive layout lane. Native Electron acceptance remains open; this worker did not launch Electron.

## Implemented

- Added the validated `request-surface-layout` IPC path and preload bridge. Requests are finite, bounded DIP measurements; the main process owns anchoring, accessory-specific caps, work-area clamping, native timing, applied bounds, and interior-size reporting.
- Added surface session and increasing layout-ID tracking. Hidden surfaces invalidate pending layout work; mismatched sessions and older layout IDs return honest `CONFLICT`/`UNAVAILABLE` errors. The legacy `requestSize('compact' | 'expanded')` bridge remains only as a compatibility fallback.
- Added adaptive placement logic for `none`, `parameters`, `suggestions`, `references`, and `preview` caps, including cursor-relative growth direction, negative-display coordinates, and display reflow.
- Corrected draft creation boundaries: a genuinely new Create document receives `4:5 aspect ratio; 2K resolution target`; reset, valid restore, corrupt/future recovery, intentional blanks, custom output text, and Edit remain unchanged.
- Added a versioned local reference-binding store with list/upsert/remove IPC methods, stable image-number slots, opaque thumbnail handles only, draft-revision checks on reads, binding-version conflict checks, atomic persistence, and recovery preservation. No chooser, upload, raw path, or compiled-text rewrite was added.

## Changed files

- `src/main/index.ts`
- `src/main/placement.ts`
- `src/main/reference-bindings.ts`
- `src/main/draft-store.ts`
- `src/preload/index.ts`
- `src/engine/cue/selection.ts`
- `src/engine/cue/commands.ts`
- Focused tests in `src/main/`, plus the reset expectation in `src/engine/cue/engine.test.ts`

## Evidence

| Check | Result |
|---|---|
| `npm run typecheck` | Passed for node and web projects |
| `npm run test:logic` | 9 files, 45 tests passed |
| Focused desktop/contract tests | Passed: placement, bindings, draft recovery, engine reset, shared validation |
| `npm run build` | Passed: main, preload, and renderer bundles built |
| `git diff --check` | Passed |
| Electron launch | Not run by this worker |

## Lead integration checks

1. Consume `window.teleprompterDesktop.requestSurfaceLayout` from the reset renderer path and stop using `requestSize` for adaptive states.
2. Provide a renderer-generated session ID per opening and monotonically increasing layout IDs; cancel pending calls on hide and ignore stale responses.
3. Add the reference manager's chooser/thumbnail producer only through the existing opaque-handle seam. Keep the current binding store as the authority for list/upsert/remove and preserve numbered slots on removal.
4. Run the native host spike and fresh N20–N30 evidence. This handoff proves source and pure logic only, not native shape, focus, transparency, or file-chooser behavior.

