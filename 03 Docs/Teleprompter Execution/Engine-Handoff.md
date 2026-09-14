# Teleprompter — Cue engine handoff

Status: engine slice complete · 2026-09-13

## Delivered

The pure Cue engine consumes the V2 contracts from `src/shared/teleprompter.ts` and has no Electron, React, filesystem, clock, random, or network dependency.

Changed modules:

- `src/content/legacy-adapter.ts` — source-backed legacy adapter, accepted-seed gate, full original-payload recovery records, and the 119-row legacy map.
- `src/content/index.ts` — exports the validated `legacyLibrary` and adapter helpers.
- `src/engine/cue/validate.ts` — engine-facing validation helpers.
- `src/engine/cue/selection.ts` — immutable axis selection, cardinality, requires/exclusion checks, preset provenance, pinned blanks, and draft creation.
- `src/engine/cue/commands.ts` — immutable semantic reducer, recipe slots, references, manual unlocks, format, reset/undo, and touched paths.
- `src/engine/cue/compile.ts` — deterministic Create/Edit serializers, placeholders, cautions, and preservation-domain subtraction.
- `src/engine/cue/choices.ts` — namespaced choice projection, field/axis filtering, search, and `LibraryView` projection.
- `src/engine/index.ts` — public engine exports.
- `src/engine/cue/engine.test.ts` — focused adapter, selection, compiler, command, and projection fixtures.

Contract/content versions: V2 contract; bundled content `2026-09-13.2`.

## Accepted content boundary

The lead-approved curator seed is normalized into runtime content only when it validates:

- 9 atoms: `wide35`, `natural50`, `portrait85`, `three-quarter`, `hero`, `high-key soft`, `medium depth`, `commercial`, and `clean-blue`.
- 1 preset: `preset.directed-studio.commercial`.
- 4 recipes: surgical correction, object removal, tone transfer, and quality restoration.
- 0 bundles in the accepted seed.

The source catalog remains intact: 104 Cheatsheet rows plus 15 Gallery techniques. All 119 originals are recoverable through `legacyOriginalsFor`; the `legacyMap` retains every row, with 101 explicitly `reference-only` rows and no silent filtering. Original source payload objects remain attached to recovery records.

## Acceptance fixtures

| Case | Result |
|---|---|
| Accepted seed validation | `validateLibrary(legacyLibrary)` passes; 9/1/4/0 runtime counts match the acceptance boundary. |
| Legacy coverage | 119 original rows preserved; 101 reference-only; 14 accepted entry mappings plus 4 accepted technique mappings. |
| Blank Create | Exact ten-section template with LF endings and final newline; no errors and copyable placeholders. |
| Preset provenance | Commercial preset unfolds into atoms; a manual `natural50` choice replaces only its focal axis and survives compilation. |
| Determinism | Selection order does not change canonical compiled text; choices sort by axis order, atom order, then ID. |
| Edit preservation | Surgical correction emits its empty slot and keeps identity, pose, wardrobe, camera, composition, background, lighting, style, and color. |
| Choice/search projection | `cam:50` resolves to `atom.camera.focal.natural50`; field and mode filters remain namespaced. |
| Immutable command | `set-axis` leaves the input draft unchanged and returns `axis:axis.camera.focal` plus `preset` as touched paths. |

## Verification

- `npm run test:logic` — passed, 8 files / 33 tests.
- `npm run typecheck` — passed for node and web projects.
- Focused engine/content/shared `tsc --noEmit` invocation — passed.
- `git diff --check` on the owned tracked files — passed.
- Native Electron behavior, clipboard, popup focus, shortcut registration, and packaged loading — not tested in this mission.

## Unresolved mappings

The following 101 rows remain searchable only through legacy recovery until a later curation batch is accepted:

| Area | Pending decision |
|---|---|
| Camera | Close-wide variants need accepted distance/focal comparisons; ultrawide, wide24/28, tele135, macro, and fisheye remain reference-only. |
| Angles | Elevation, profile/front/over-shoulder, and Dutch-roll mappings need fixed-scene evidence. |
| Composition | Social versus tight crop, editorial placement, product hierarchy, negative space, foreground, layered depth, and widekey remain pending. |
| Lighting | Softbox, clamshell, beauty dish, window, bounce, hard sun/flash, rim, backlight, gradient, split, neon, overcast, and golden mappings remain pending. |
| Looks/depth | Non-commercial looks, palette/treatment/texture/retouch distinctions, and deep/shallow/focus targets remain pending. |
| Edits | Broader `route-style`, reference swaps, pose/face/product transfer, perspective, camera lock, reframe, cleanup, motion, markup, and other technique rows remain reference-only. |
| Output/constraints | Ratio, resolution, mood, IMPORTANT, and AVOID atoms are contract-ready but outside the accepted 14-record runtime seed. Blank compiler placeholders remain honest. |

The broader `route-style` and narrower accepted `route-tone` remain separate; no alias was invented. Practical artwork and GPT Image 2.5 Flare evidence are outside this lane.

## Next integration action

Lead should wire `legacyLibrary` → `createDraft` → `applyDraftCommand` → `compileCreate` into the shared Cue surface, then run the first native Create/copy acceptance pass against the acknowledged draft revision.
