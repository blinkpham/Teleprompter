# MAP — Teleprompter

Goal: Implement the Teleprompter upgrade: dark-only Cue Create/Edit, shortcut spotlight, redesigned library, generated artwork, and structured long-term curation.
Updated: 2026-09-14

## Current execution — integrated offline Cue slice

- `03 Docs/Teleprompter Plan/00-Start-Here.md` routes the audit, shared contracts, five worker missions, and lead acceptance plan.
- `src/shared/teleprompter.ts` is the single import surface for the new LibraryV2, CueDraft, command, snapshot, bridge, and runtime-validation contracts; `src/shared/ui-types.ts` publishes `CueSurfaceProps`.
- `03 Docs/Teleprompter Execution/Lead-Handoff.md`, `Engine-Handoff.md`, `UI-Handoff.md`, and `Desktop-Handoff.md` record the dependency handoffs and focused verification. The renderer now uses the Teleprompter surfaces and the desktop bridge wires the accepted V2 engine/content slice.
- The current-app audit confirmed navigation overflow, a missing detail-sheet click-away action, and a search-focus problem after closing the sheet. The source uses system fonts, not Inter. See `03 Docs/Teleprompter Plan/01-Current-App-Audit.md` for evidence boundaries. The new renderer keeps system sans-serif and adds global Cue search.
- The four user-provided image references are retained under the plan's `References/` folder.

## Current execution — UI quality reset (2026-09-13)

- `03 Docs/Teleprompter Plan/Visual Reset 2026-09-13/00-Start-Here.md` is now the lead authority for the unresolved visual reset and future visual dispatch. It supersedes the earlier UI-quality reset's fixed spotlight geometry and visual-acceptance claims while preserving the accepted engine/shared contracts.
- The revised visual reset contains 9 plan documents, 31 requirement IDs, and 30 native acceptance cases. Visual acceptance is open: the live re-audit found framed appended objects, giant clipped repeated lenses, and a double search-focus ring. No implementation change was made by the planner.
- The revised direction requires an adaptive translucent Raycast/Codex-menubar-style popup, compact morphing parameter cards, camera ticker/slider/scrubber research, `/preset` quick add, and `@` reference mentions. Do not dispatch the earlier rigid two-size or tall-column instructions as final authority.
- A Sol packet was assembled and sent to the existing planning conversation as `/tmp/teleprompter-sol-packet-67RUuR.zip`; the packet contains the current project guidance, renderer/desktop sources, plan missions, retained references, and six local screenshot captures.
- The three bounded implementation lanes are integrated: renderer UI/motion (`src/renderer/src/ui/`, `src/renderer/src/styles/`), native desktop/spotlight (`src/main/`, `src/preload/`), and delegated Illustration assets (`src/renderer/src/assets/teleprompter/`, `03 Docs/Teleprompter Execution/Artwork/`). The lead owns integration and acceptance.
- Sol's packet review confirms the main defect is presentation-layer semantic leakage: human labels should lead, while shorthand and IDs remain secondary or copy-specific.
- The attached Higgsfield reference is the visual direction for the reset: dark, quiet, image-led capsule choices with short labels and selection outlines. The renderer now scopes each group picker, hides empty axes, removes helper summaries from the main group controls, and humanizes primary Library/Tokens labels.
- The Cue group controls now use the integrated Optics, Stage, and Finish artwork as image-led horizontal capsules with short label/value stacks, visible selected outlines, and preserved picker behavior.
- Native bounds/focus changes are integrated. The independent macOS witness accepts the menu-triggered spotlight lifecycle, picker resize, native copy, click-away dismissal, focus restoration, OS-level shortcut delivery/dismissal, and cursor-relative placement at two observed pointer locations after the hide-loop fix. Physical-keyboard, collision, second-display, and non-macOS coverage remain open. The delegated v2 identity packet is accepted and integrated; practical artwork remains blocked by the exact-model route gate.

## Upgrade checks still open

- Local follow-up now wires the exact preview and Library/Tokens read-only seams, scopes the new Create output default, and removes misleading repeated family art from axis options. Native visual acceptance is still open because the user paused host-software use from 09:00–20:00.

- The default global shortcut is accepted on this macOS host through an OS-level System Events key-event witness; the configurable menu fallback remains available, while hardware-keyboard delivery and collision handling are unverified.
- Native panel focus/Space behavior and physical display coverage require implementation-time tests.
- Practical artwork needs an authorized route that can select or report GPT Image 2.5 Flare; generic image generation availability alone does not prove the model. No practical artwork was added in this slice.
- Semantic duplicates and expanded taxonomy remain the Library Curator's mission; the accepted runtime boundary is the 14-record V2 seed and 101 legacy rows remain reference-only.
- The independent 11:11 native recheck was limited by CUA injection and bounds visibility. A later passive CoreGraphics/AppKit observer plus macOS System Events key-event witness captured two stable pointer-relative spotlight placements and shortcut dismissal. Main-window identity, renderer loading, menu registration, and placement-test counts remain supporting evidence only; physical-keyboard, collision, second-display, and non-macOS cases are still unverified.

## Current verification — UI quality reset

- `npm run typecheck` passes.
- `npm run test:logic` passes: 8 files, 33 tests.
- `npm run build` passes and emits the renderer with the accepted v2 Optics, Stage, and Finish assets.
- `git diff --check` passes; the focused Impeccable detector returns `[]` for the Cue surface and global styles.
- Earlier native inspection recorded image-led Cue group controls, a scoped Optics chooser, Library, and Tokens surfaces, but the latest planner re-audit contradicts visual acceptance: the controls still read as framed generic buttons, the Optics picker clips repeated artwork, and focus treatment is duplicated. Native desktop focused checks reported 15/15 placement tests passing; technical native acceptance remains separate from visual acceptance.

## Implemented v1 baseline

- The five files in `03 Docs/Implementation Plan/` describe the historical v1 implementation. The Teleprompter plan supersedes conflicting next-phase decisions.
- `teleprompter/SKILL.md`, `teleprompter/assets/quick-snippets.md`, and `teleprompter/references/prompting-strategy.md` are source material and remain unchanged.
- The implemented v1 scope is preserved in the legacy renderer components; the visible app now defaults to the Teleprompter Cue, Library, and Tokens surfaces.
- The stack is fixed: Electron + React + TypeScript + electron-vite, with context isolation and sandboxing enabled.
- The implementation is integrated: 15 source-backed Gallery techniques, 104 Cheatsheet rows, deterministic search, aliases, preset resolution, favorites, appearance, native copy, persisted preferences, and an offline local photo credit are wired into Electron.
- Native built-preview acceptance now covers Teleprompter identity, Create/Edit Cue, accepted `cam:natural50` selection, `cam:50` Cue search, Library preset expansion, Tokens (9 accepted directions), and compiled prompt copy acknowledged through the native clipboard bridge. `pbpaste` confirmed the copied WHAT/CAM/ANGLE content.
- Native menu acceptance now opened a separate `Teleprompter Cue` spotlight surface at `localhost:5173/?surface=spotlight`; the dark renderer was visible, Preview expanded the native panel, and Escape dismissed it after the overlay closed. The global shortcut delivery still lacks a separate witness, so registration is not treated as behavior proof.
- Artwork Wave A industrial identity is integrated as four manifest-backed raster assets (icon plus Optics, Stage, and Finish group objects). Practical examples remain model-gated until an exact `gpt-image-2.5-flare` route can be selected and evidenced.
- Focused verification passes: `npm run typecheck`, `npm run test:logic` (8 files, 33 tests), `npm run build`, `git diff --check`, and the impeccable detector (`[]`).
- The scaffold was committed as `e7f0400`; the integrated implementation was committed as `5e21875` and was the clean baseline for the 2026-09-13 audit.

## Unknown — open

- Native behavior on Windows/Linux is unverified; the documented fallbacks are present but need those hosts for direct proof.
- Installer packaging, signing, and deployment remain out of scope for v1.

## Watchlist

- Electron and electron-vite versions are resolved from the registry at Slice A and should not drift while worker paths are active.
- Compact-width dialog behavior has not been separately exercised; the full-prompt dialog is verified at the current native window size.
- Preference write failures must remain visibly session-only; never present them as durable saves.

## Next

1. Retain the accepted macOS shortcut/cursor evidence, menu fallback, and verified lifecycle; leave physical-keyboard, collision, second-display, and non-macOS coverage explicitly unverified.
2. Dispatch future visual work only from `03 Docs/Teleprompter Plan/Visual Reset 2026-09-13/00-Start-Here.md` after lead review; keep its 31 requirements and 30 native cases open until the real Electron comparison passes.
3. Keep practical illustration blocked until the exact GPT Image 2.5 Flare route is explicitly evidenced; then consume only the six curator-accepted AssetRequests.
4. Preserve the 14-record runtime boundary while later curation resolves the 101 reference-only legacy rows.
5. After the restricted window, run the actual Electron comparison for the updated capsules, exact preview, adaptive surface, focus treatment, and shortcut/reference seams; only then close native acceptance gaps.
