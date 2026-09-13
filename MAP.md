# MAP — Teleprompter

Goal: Implement the Teleprompter upgrade: dark-only Cue Create/Edit, shortcut spotlight, redesigned library, generated artwork, and structured long-term curation.
Updated: 2026-09-13

## Current execution — integrated offline Cue slice

- `03 Docs/Teleprompter Plan/00-Start-Here.md` routes the audit, shared contracts, five worker missions, and lead acceptance plan.
- `src/shared/teleprompter.ts` is the single import surface for the new LibraryV2, CueDraft, command, snapshot, bridge, and runtime-validation contracts; `src/shared/ui-types.ts` publishes `CueSurfaceProps`.
- `03 Docs/Teleprompter Execution/Lead-Handoff.md`, `Engine-Handoff.md`, `UI-Handoff.md`, and `Desktop-Handoff.md` record the dependency handoffs and focused verification. The renderer now uses the Teleprompter surfaces and the desktop bridge wires the accepted V2 engine/content slice.
- The current-app audit confirmed navigation overflow, a missing detail-sheet click-away action, and a search-focus problem after closing the sheet. The source uses system fonts, not Inter. See `03 Docs/Teleprompter Plan/01-Current-App-Audit.md` for evidence boundaries. The new renderer keeps system sans-serif and adds global Cue search.
- The four user-provided image references are retained under the plan's `References/` folder.

## Upgrade checks still open

- The default global shortcut must be tested for availability on this machine; the desktop mission defines a configurable fallback.
- Native panel focus/Space behavior and physical display coverage require implementation-time tests.
- Practical artwork needs an authorized route that can select or report GPT Image 2.5 Flare; generic image generation availability alone does not prove the model. No practical artwork was added in this slice.
- Semantic duplicates and expanded taxonomy remain the Library Curator's mission; the accepted runtime boundary is the 14-record V2 seed and 101 legacy rows remain reference-only.
- A separate native spotlight witness is still missing. Main-window native identity, renderer loading, menu registration, and code paths do not prove cursor placement, panel focus, blur dismissal, resize, or shortcut behavior.

## Implemented v1 baseline

- The five files in `03 Docs/Implementation Plan/` describe the historical v1 implementation. The Teleprompter plan supersedes conflicting next-phase decisions.
- `image-director/SKILL.md`, `image-director/assets/quick-snippets.md`, and `image-director/references/prompting-strategy.md` are source material and remain unchanged.
- The implemented v1 scope is preserved in the legacy renderer components; the visible app now defaults to the Teleprompter Cue, Library, and Tokens surfaces.
- The stack is fixed: Electron + React + TypeScript + electron-vite, with context isolation and sandboxing enabled.
- The implementation is integrated: 15 source-backed Gallery techniques, 104 Cheatsheet rows, deterministic search, aliases, preset resolution, favorites, appearance, native copy, persisted preferences, and an offline local photo credit are wired into Electron.
- Native built-preview acceptance now covers Teleprompter identity, Create/Edit Cue, accepted `cam:natural50` selection, `cam:50` Cue search, Library preset expansion, Tokens (9 accepted directions), and compiled prompt copy acknowledged through the native clipboard bridge. `pbpaste` confirmed the copied WHAT/CAM/ANGLE content.
- Native menu acceptance now opened a separate `Teleprompter Cue` spotlight surface at `localhost:5173/?surface=spotlight`; the dark renderer was visible and blur dismissal was observed. The global shortcut delivery still lacks a separate witness, so registration is not treated as behavior proof.
- Artwork Wave A industrial identity is integrated as four manifest-backed raster assets (icon plus Optics, Stage, and Finish group objects). Practical examples remain model-gated until an exact `gpt-image-2.5-flare` route can be selected and evidenced.
- Focused verification passes: `npm run typecheck`, `npm run test:logic` (8 files, 30 tests), `npm run build`, `git diff --check`, and the impeccable detector (`[]`).
- The scaffold was committed as `e7f0400`; the integrated implementation was committed as `5e21875` and was the clean baseline for the 2026-09-13 audit.

## Unknown — open

- Native behavior on Windows/Linux is unverified; the documented fallbacks are present but need those hosts for direct proof.
- Installer packaging, signing, and deployment remain out of scope for v1.

## Watchlist

- Electron and electron-vite versions are resolved from the registry at Slice A and should not drift while worker paths are active.
- Compact-width dialog behavior has not been separately exercised; the full-prompt dialog is verified at the current native window size.
- Preference write failures must remain visibly session-only; never present them as durable saves.

## Next

1. Obtain an independent global-shortcut witness and stable bounds/resize evidence for the spotlight; retain the menu fallback as accepted behavior.
2. Keep practical illustration blocked until the exact GPT Image 2.5 Flare route is explicitly evidenced; then consume only the six curator-accepted AssetRequests.
3. Preserve the 14-record runtime boundary while later curation resolves the 101 reference-only legacy rows.
