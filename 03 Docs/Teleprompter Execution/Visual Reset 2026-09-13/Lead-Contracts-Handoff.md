# Mission 0 — lead contracts handoff

Date: 2026-09-14  
Scope: shared contracts and renderer orchestration only  
Status: contracts published; native acceptance not claimed

## Delivered

- Added the read-only exact-preview contract: `getCompiledDraft` returns the existing `CompileResult` fields plus `draftId`, `format`, and `contentVersion`. Added the parallel exact Library/Tokens text result without clipboard side effects.
- Added renderer preview identity and presentation states: idle, pending, ready, and error. `TeleprompterApp` owns request IDs and rejects late, wrong-mode, wrong-revision, wrong-format, and wrong-content-version responses.
- Added the measured `requestSurfaceLayout` request/result contract with bounded finite measurements, accessory state, transition intent, applied bounds, interior size, and constrained dimensions. The renderer sends measurements only; it does not send coordinates.
- Added the Create-only literal policy `4:5 aspect ratio; 2K resolution target` through `newDraftDefaults('create')`. Edit, reset, restore, and clear semantics are unchanged because no engine/store activation was made in this mission.
- Added typed settings state and replaced the main-window implementation banner with a real shortcut dialog backed by the existing `setShortcut` bridge. Collision, unavailable-shortcut, persistence, and session-only results remain visible.
- Added quick-add session/result types, the validated `accept-quick-add` envelope, reference-binding snapshots/envelopes, and opaque thumbnail-handle validation. The current `CueCommand` union and compiler were not widened in this lead mission; the engine worker must consume the separate envelope when implementing the atomic operation.

## Owned files changed

- `src/shared/teleprompter-types.ts`
- `src/shared/teleprompter-validation.ts`
- `src/shared/teleprompter-validation.test.ts`
- `src/shared/ui-types.ts`
- `src/renderer/src/app/TeleprompterApp.tsx`

The existing dirty `src/shared/desktop-types.ts` rename and the pre-existing `TeleprompterApp.tsx` Library apply change were preserved. No `src/main/`, `src/preload/`, renderer UI/style/assets/content, or curation files were edited.

## Checks

- `npm run typecheck` — pass.
- `npx vitest run src/shared/teleprompter-validation.test.ts` — pass, 1 file / 7 tests.
- `npm run test:logic` — pass, 8 files / 36 tests.
- `npm run build` — pass, main, preload, and renderer bundles emitted.

## Handoff and blockers

- Desktop/preload must implement and validate `getCompiledDraft`, `getLibraryText`, `requestSurfaceLayout`, and the reference-binding bridge methods while preserving sender/frame checks, context isolation, sandboxing, local-only processing, and the existing user-data boundary.
- The engine/store owner must apply `newDraftDefaults('create')` only when creating a genuinely new Create draft, then implement `accept-quick-add` as one revision-checked mutation and Undo entry without changing compiler meaning or runtime content.
- The UI owner must consume `preview`, `requestPreview`, and `requestSurfaceLayout`, render exact compiler text, and migrate the popup from legacy `requestSize`. The legacy callback remains optional solely for the already-dirty UI/desktop slice and is not evidence for the reset.
- The native witness must verify adaptive bounds, material, focus, dismissal, and the new preview/reference flows in the actual Electron app. This handoff contains no native acceptance claim.

Runtime content remains unchanged at the accepted 14-record boundary. No model, network, upload, filesystem-path exposure, or generated-record path was added.

## Follow-up local implementation — 2026-09-14

The lead consumed the desktop, engine, and UI seams locally while native-host work was paused by the user's 09:00–20:00 restriction.

- `getCompiledDraft` is now registered in main/preload and returns the exact compiler result with draft identity, format, and content version.
- `getLibraryText` is now registered in main/preload and resolves Library/Tokens text without writing to the clipboard; Copy reuses the same resolver.
- New Create drafts and engine resets now receive `4:5 aspect ratio; 2K resolution target`; Edit and restored documents do not receive it automatically.
- Preview now requests and renders the exact compiler text used by Copy, with stale-response handling retained in `TeleprompterApp`.
- Group controls now use image-led horizontal capsules; axis options use an honest neutral fallback instead of repeating family artwork as if it were a record-specific image. Search input focus is reduced to one intentional ring.

Local checks after this follow-up: `npm run typecheck`, `npm run test:logic` (8 files / 37 tests), `npm run build`, `git diff --check`, and the focused Impeccable detector all pass. Electron, Adobe, Astra, browser consultation, native visual acceptance, and GitHub publication were not run in this time window.
