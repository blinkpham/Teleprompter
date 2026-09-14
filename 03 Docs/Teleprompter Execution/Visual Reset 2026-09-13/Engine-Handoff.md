# Engine handoff — atomic quick add

Date: 2026-09-14
Owner: Engine worker
Scope: `src/engine/cue/` and focused engine tests only

## Done

The Cue engine now accepts `accept-quick-add` through the existing command seam. The compound operation validates the loaded content version, exact `expectedWhat`, exact `[start,end)` query text, active target identity, mode compatibility, and envelope field revisions when an authoritative revision map is supplied.

One accepted operation returns one draft mutation with one revision increment and deterministic touched paths. The existing draft-store integration can therefore create one undo entry for the whole WHAT replacement plus semantic action.

Supported actions:

- `preset`: reuses `applyPreset` and reports `what`, `preset`, scoped axes, and prior preset axes.
- `token`: reuses axis selection; multi-value axes add idempotently instead of toggling an existing atom off.
- `edit`: reuses the extracted `selectRecipe` routine and is rejected outside Edit.
- `snippet`: inserts an approved atom expansion literally without changing choices. A static, slot-free edit recipe is also accepted as a literal expansion.
- `reference`: inserts `Image N` into WHAT only. Create accepts bounded numbered slots; Edit requires the numbered role to already exist.

Stale content, stale WHAT/range, missing or incompatible targets, and revision conflicts return a rejected result without changing the input draft.

## Engine API

`src/engine/cue/quick-add.ts` exports:

- `applyQuickAddCommand(library, draft, AcceptQuickAddCommand | QuickAddAcceptance | QuickAddCommandEnvelope, options?)`
- `applyQuickAddEnvelope(library, draft, envelope, currentFieldRevisions?)`
- `applyAcceptQuickAdd` alias
- `touchedPathsForQuickAddCommand(...)`

`src/engine/cue/commands.ts` now treats `AcceptQuickAddCommand` as an `EngineCueCommand`, so `applyDraftCommand` and `touchedPathsForCommand` route it through the same engine path. `src/engine/index.ts` was intentionally not edited; the lead should export the new quick-add functions there if the desktop adapter needs direct access.

## Evidence

- `npm run test:logic`: 9 files, 43 tests passed.
- `npm run typecheck`: passed for node and web projects.
- `npm run build`: passed; Electron main, preload, and renderer bundles emitted.
- `git diff --check`: passed.

Focused regression coverage is in `src/engine/cue/quick-add.test.ts` and covers preset, token, Edit recipe, literal snippet, reference, duplicate token acceptance, stale content, exact-range drift, rapid re-acceptance, and revision conflict rejection.

## Lead integration

The shared validator and `DraftStore` still keep `QuickAddCommandEnvelope` outside the live `CueCommand` union. The lead must publish the union/validation and dispatch the envelope to `applyQuickAddEnvelope` (or pass the accepted command through `applyDraftCommand` after shared integration). The store must check the returned touched-path union before mutation, persist the accepted draft once, and place the pre-mutation draft in its single undo slot.

No renderer, main, preload, shared contract, catalog, MAP, or acceptance files were changed by this worker.
