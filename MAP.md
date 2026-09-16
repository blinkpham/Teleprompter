# MAP — Teleprompter

Goal: Implement the Teleprompter upgrade: dark-only Cue Create/Edit, shortcut spotlight, redesigned library, generated artwork, and structured long-term curation.
Updated: 2026-09-17

## Current checkpoint — Sol-gated visual reset (2026-09-16)

- The native macOS app now has a fixed-window host in `native/TeleprompterNative/Sources/TeleprompterNative/MainWindow.swift` alongside the adaptive spotlight Cue. The fixed host opens with always-visible Cue controls, click-driven Optics/Stage/Finish sheets, a left prompt block, an adaptive-height Apply/Preview column, and Gallery/Tokens navigation; the spotlight remains shortcut-driven and adaptive.
- Parallel native lanes are now present under `native/TeleprompterNative/Sources/TeleprompterNative/`: `Gallery/` provides canonical tag-managed curated and user-added entries with local UserDefaults persistence; `TokenDictionary/` provides browse/search persistence plus typed slash/@ insertion contracts. The main window consumes `GalleryView` and `TokenDictionaryView`, and token selections can insert into the fixed Cue prompt.
- Sol's final review found the main remaining integration gaps: the adaptive spotlight has not yet consumed the shared token dictionary insertion contract, and its full post-overlay behavioral witness remains open. Fixed-window Optics now keeps independent Camera/Lens/Aperture values, fixed Edit has visible multi-operation/pending state, and references retain session-local URLs with numbered `@Image N` mentions.

- Sol reviewed the latest visual objections before implementation and returned **NOT CLEAN** for the previous native pass. The required correction was: remove the enclosing Cue surface, use compact upward slot rows without repeated headings or axis subtitles, keep family rasters only in the collapsed group controls, use one restrained orange accent family, and let the action column follow the left block's intrinsic height.
- The native pass now removes the root `CueShellSurface` and window shadow; the transparent `NSPanel` shows individually bounded controls only. Expanded Optics/Stage/Finish content is a compact slot row with one value label or a minimal dash state, not a background well or explanatory panel copy.
- Visible `Focal`, `Composition`, and `Look` subtitles are gone. Orange owns active mode, open/selected slots, Apply, and expansion emphasis; accepted generated rasters retain their original identity colors.
- Direct packaged-app inspection shows the clear default state, compact upward Optics slot, minimal Stage unavailable state, and dynamic action-column height matching both the expanded selector and a four-line prompt. The latest pass is visually improved and directly observed; a post-change Sol verdict is still separate from this lead witness.
- Follow-up visual correction now gives each mode control, image-led group button, selector slot, prompt field, compact menu, reference/mention hook, and Preview action an individually legible adaptive surface. The root remains clear and the selector row remains free of an enclosing panel; direct inspection confirms the previously floating-text appearance is closed for the observed light-mode package.
- Active diagnosis requirement: each individually bounded control must retain genuine Liquid Glass characteristics without relying on a shared backdrop—material depth, light response, edge treatment, and native translucency—not merely a flat semi-transparent fill. Do not implement the next visual pass until the user finishes recording grievances from the open package.
- Recorded grievance: the current clear `NSPanel` has no Liquid Glass material or blur, so desktop content remains fully visible behind the composer and competes with the prompt. The next surface must restore a restrained blurred/translucent legibility layer without reintroducing an opaque rectangular frame, a selector well, or a connected button contour; component-level glass and the root legibility layer are separate responsibilities.
- Recorded grievance: an expanded Optics/Stage/Finish panel must stretch across the full width of the left composer block and show the complete choice set as a thumbnail-driven grid or Higgsfield-style slot selector, with the visual information and labels needed to choose confidently. It must remain above the three group buttons without displacing the prompt/action column.
- Recorded interaction requirement: the detail panel must not remain persistently open after the triggering hover state ends. Keep it open while the pointer/focus is inside the control or panel, and dismiss it on click-away or Escape; clicking elsewhere in the composer must not leave a stale panel behind. The linked [Higgsfield generator](https://higgsfield.ai/generate) is a reference for the full-width, image-led selector treatment, not a source of implementation instructions.
- Recorded motion requirement: the prompt text field is the stable anchor. When the cursor leaves the prompt bar, every other control—Create/Edit, Ratio/Resolution, Optics/Stage/Finish, Apply, and Preview—must compact and blob-morph into the prompt bar; when the cursor returns, they re-emerge with coordinated, dynamic spring motion. Keyboard focus must keep the focused control visible. The motion should feel bouncy and intentional, with one shared choreography rather than separate unrelated animations, and Reduced Motion must remove travel/overshoot while preserving the state change.
- Latest implementation correction: adaptive Cue now keeps the prompt as the normal-flow anchor and renders the mode/configuration stack as an upward overlay; the O/S/F trigger row does not move when its panel opens, and the right action column bottom-aligns to the prompt while using deterministic panel heights to avoid hover/layout feedback jitter.
- O/S/F group controls are hover triggers only and are not selectable states. A group becomes configured only after a real option is chosen; Edit multi-select state is carried by chosen option cards rather than by the O/S/F buttons themselves. The redundant panel close icon was removed because hover departure, click-away, and Escape are the dismissal paths.
- Selector anatomy is now group-specific: Optics is a three-slot Camera/Lens/Aperture control, while Stage and Finish use larger 4-column style grids that can scale to a growing library. Existing generated family artwork remains reserved for semantic imagery; utility glyphs remain SF Symbols.
- The native floating Cue controller now has a local Control-C visibility toggle and hides on click-away from the floating window. The shortcut is local to the Cue app so it does not hijack ordinary copy in unrelated applications; a global hotkey remains a separate integration decision for the main app shell.
- Three bounded native lanes are running in parallel in separate sessions: fixed-window app/Cue shell, gallery/library, and token dictionary. Their outputs must be reviewed and integrated by the lead; they must not edit the adaptive Cue or native bridge contracts.

- The latest user correction is implemented in `native/TeleprompterNative/Sources/TeleprompterNative/CueView.swift`: the mode switch is now the only header control; no visible Cue title or brand remains.
- Detailed Optics/Stage/Finish panels now open above the three group buttons with a spring transition. The prompt bar and right action column keep their placement while the panel is open; the AppKit/window edge is not used as a product control border.
- Ratio, Resolution, Add Reference, `/`, and `@` now live inside one adaptive prompt bar. Ratio and Resolution are value-only compact menus (`4:5`, `2K`), all compact controls share a 34-point control height, and the prompt grows from one through six lines without clipping.
- Apply and Preview are a fixed-width right column: Apply is the tall primary action and Preview is the icon-only secondary action below it. The group title cards keep one row height and the accepted v2 generated Optics, Stage, and Finish rasters; utility actions remain native SF Symbols.
- Edit mode now exposes multi-selectable group operations in the native UI while retaining the Create layout. One detail panel can be open at a time, and selection state remains visible for multiple chosen operations. The bridge still only publishes the existing `set-what` command; Edit operation compilation remains an explicitly open contract seam.
- Direct packaged-app observations verified the collapsed default, upward Optics and Stage panels, Edit multi-select state, value menus, and a long wrapped prompt. Focused checks pass: `npm run typecheck`, `npm run test:logic` (79 tests), `npm run build`, `swift build -c debug`, and native packaging. This is a lead witness for the layout correction, not a new Sol verdict.

## Prior checkpoint — native Cue hierarchy correction (2026-09-16)

- The latest user correction is implemented in `native/TeleprompterNative/Sources/TeleprompterNative/CueView.swift`: the mode switch is now the only header control; no visible Cue title or brand remains.
- Detailed Optics/Stage/Finish panels now open above the three group buttons with a spring transition. The prompt bar and right action column keep their placement while the panel is open; the AppKit/window edge is not used as a product control border.
- Ratio, Resolution, Add Reference, `/`, and `@` now live inside one adaptive prompt bar. Ratio and Resolution are value-only compact menus (`4:5`, `2K`), all compact controls share a 34-point control height, and the prompt grows from one through six lines without clipping.
- Apply and Preview are a fixed-width right column: Apply is the tall primary action and Preview is the icon-only secondary action below it. The group title cards keep one row height and the accepted v2 generated Optics, Stage, and Finish rasters; utility actions remain native SF Symbols.
- Edit mode now exposes multi-selectable group operations in the native UI while retaining the Create layout. One detail panel can be open at a time, and selection state remains visible for multiple chosen operations. The bridge still only publishes the existing `set-what` command; Edit operation compilation remains an explicitly open contract seam.
- Direct packaged-app observations verified the collapsed default, upward Optics and Stage panels, Edit multi-select state, value menus, and a long wrapped prompt. Focused checks pass: `npm run typecheck`, `npm run test:logic` (79 tests), `npm run build`, `swift build -c debug`, and native packaging. This is a lead witness for the layout correction, not a new Sol verdict.

## Prior checkpoint — final Sol parity review and image-led native Cue (2026-09-16)

- Final Sol post-witness review is **CLEAN for the bounded Cue parity fix**. The reported connected/squiggly button contour is closed at the product-control level: the decorative enclosing glass owner is no longer interactive, the group controls keep one consistent treatment, and the thin remaining perimeter is classified as the AppKit window edge rather than a connected button outline.
- The native packaged Cue now visibly uses the accepted premium v2 generated family artwork for Optics, Stage, and Finish. Utility actions remain native SF Symbols. The assets are loaded explicitly from the signed app bundle and are copied into `Contents/Resources`; the live collapsed and in-flow panel captures are in `03 Docs/Teleprompter Execution/Visual Reset 2026-09-13/Native/2026-09-16/`.
- Adaptive hierarchy is implemented: controls collapse by default, reveal on hover/focus, panels insert in flow, the prompt grows with wrapped text, Apply is the large primary icon action, Preview is the smaller secondary action, and Ratio/Resolution/Add Reference remain available. Sol still leaves responsive edge cases, Reduced Motion/Transparency, and full motion proof open.
- Lead commit `9bd7e24` integrates native asset packaging, explicit raster loading, the bounded contour fix, and the native witness. Lead commit `69a45c7` records the curator's Batch 002 decision: **REVISE / KEEP PROPOSED / REFERENCE-ONLY**. The exact Flare route remains unavailable/evidenceless; no practical record-specific artwork is activated.
- Lead checks pass: `npm run typecheck`, `npm run test:logic` (79 tests), `npm run build`, `swift build -c debug`, native packaging, codesign verification, `git diff --check`, and the focused Impeccable detector (`[]`). Remaining native ceilings are B01–B03 partial, B04–B05 unwitnessed, and no full N01–N30 passes.

## Prior checkpoint — native Cue redesign and handover hardening (2026-09-16)

- The latest user correction is implemented in native `CueView.swift`: the default state is collapsed, configuration controls reveal on hover/focus, selection panels insert in-flow instead of hiding the prompt/actions, the prompt wraps and grows, Apply is a large icon-only primary action, Preview is a smaller icon-only action below it, and Ratio/Resolution/Add Reference controls are present.
- The old native witness is retained only as baseline evidence and is explicitly superseded by the 2026-09-16 design correction. The new packaged binary was directly observed with a clean material, collapsed default, in-flow Optics/Stage panels, prompt wrapping, selectable Preview, and preserved `cue-*` accessibility identifiers. Lead commit: `703c54a` (worker source: `c06694e`).
- The authoritative TypeScript helper is now hardened with explicit disposable/durable profiles, exclusive writer leases, checksum recovery backups, guarded restore, safe shutdown, and interleaved event handling for native Apply → Preview. Lead commit: `370b5a6` (worker source: `2f1bc03`).
- Lead verification passes: `npm run typecheck`, `npm run test:logic` (16 files, 79 tests), `npm run build`, `swift build -c debug`, native packaging with the helper bundled, `git diff --check`, and the Impeccable detector (`[]`). The public remote remains `https://github.com/blinkpham/Teleprompter`. Astra has not been messaged during this unfinished implementation cycle.
- Remaining native evidence ceilings are Reduced Transparency, VoiceOver/physical-keyboard breadth, clipboard/compiler parity, and formal Liquid Glass acceptance. The UI worker also recorded these as unwitnessed rather than claiming them complete.

## Historical checkpoint — initial native macOS/Liquid Glass route (superseded 2026-09-16)

- User decision on 2026-09-14: the new Teleprompter implementation moves to a native macOS host/surface, not Electron. Liquid Glass is a first-class requirement. Electron remains compatibility evidence and a migration seam only; no Electron deletion or whole-app rewrite is accepted before a buildable native seam and direct runtime evidence exist.
- The existing offline store/compiler, shared contracts, 14-record runtime boundary, exact `gpt-image-2.5-flare` gate, Curator-before-Illustration order, and all five grievance blockers B01–B05 remain in force.
- Native implementation worker missions are dispatched for a bounded SwiftUI/AppKit Cue spike and a documentation-only Liquid Glass architecture decision. Their worktrees remain isolated until the lead reviews changed files, official Apple source evidence, and native build/runtime results.
- The bounded native shell lives under `native/TeleprompterNative/`. `swift build -c debug` and the ad-hoc app package succeed on the installed macOS 26 toolchain; the initial direct runtime observation verified the Cue editor, Optics → Focal expansion, typing, Apply revision change, and Preview disclosure. That old floating-button anatomy is superseded by the 2026-09-16 redesign; the `DevelopmentFixtureBridge` remains explicitly not compiler/store parity.
- Astra was updated in its owner session with this checkpoint and the unresolved B01–B05 grievance bundle. The next native gate is the real versioned JSON-lines helper to the authoritative TypeScript store/compiler, followed by data handover and native acceptance; do not close Liquid Glass or grievance acceptance from the fixture witness.

## Current execution — 2026-09-14 post-worker checkpoint

- Lead integration commits `8e5d3d6`, `6834f3d`, and `674e1df` add engine-owned atomic quick add, measured spotlight layout requests, exact Preview and Library/Tokens read paths, Create-only default handling, compact image-led Cue controls, caret-safe slash/@ suggestions, the Teleprompter skill package metadata/icon, and the local reference lifecycle. Worker commit `ad381db` was reviewed as an independent input; its projection/test improvements were incorporated selectively without replacing the lead's native focus fixes.
- Sol/Core's fresh read-only review found four remaining contract/runtime risks: recovery construction can still re-enter new-document defaults unless the loader preserves the parsed blank fallback; quick-add acknowledgement must serialize editing so it cannot overwrite in-flight typing; the @ reference manager/chooser/thumbnail lifecycle is still missing; and configured-state styling plus B01 geometry need native confirmation.
- The recovery loader and quick-add acknowledgement guard are fixed. The lead now owns a visible Reference manager with native chooser, opaque local thumbnail handles, cancellation focus return, role/note controls in Edit, and missing-thumbnail error handling. It remains outside the accepted 14-record runtime boundary and does not expose filesystem paths.
- Curator Batch 002 is integrated as proposed/reference-only and is ready for lead review. Illustration remains blocked until lead acceptance and direct `gpt-image-2.5-flare` route evidence; no artwork is activated from the batch.
- Native witness: `03 Docs/Teleprompter Execution/Visual Reset 2026-09-13/Native/2026-09-14/Witness.md`. Electron visibly loads the dark Cue, one-axis Optics picker/search, the References manager, native image chooser, persisted thumbnail row, Edit role controls, and @Image 1 suggestions. Native quick-add keyboard acceptance remains open pending a direct clean witness; adaptive placement, clipboard read-back, and the full B01–B05/N01–N30 matrix remain open.

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

- Local follow-up now wires the exact preview and Library/Tokens read-only seams, scopes the new Create output default, adds atomic quick add and measured layout, and removes misleading repeated family art from axis options. Native visual acceptance remains open; the latest witness is recorded separately.

- The default global shortcut is accepted on this macOS host through an OS-level System Events key-event witness; the configurable menu fallback remains available, while hardware-keyboard delivery and collision handling are unverified.
- Native panel focus/Space behavior and physical display coverage require implementation-time tests.
- Practical artwork needs an authorized route that can select or report GPT Image 2.5 Flare; generic image generation availability alone does not prove the model. No practical artwork was added in this slice.
- Semantic duplicates and expanded taxonomy remain the Library Curator's mission; the accepted runtime boundary is the 14-record V2 seed and 101 legacy rows remain reference-only.
- The independent 11:11 native recheck was limited by CUA injection and bounds visibility. A later passive CoreGraphics/AppKit observer plus macOS System Events key-event witness captured two stable pointer-relative spotlight placements and shortcut dismissal. Main-window identity, renderer loading, menu registration, and placement-test counts remain supporting evidence only; physical-keyboard, collision, second-display, and non-macOS cases are still unverified.

## Current verification — UI quality reset

- `npm run typecheck` passes.
- `npm run test:logic` passes: 14 files, 63 tests.
- `npm run build` passes and emits the renderer with the accepted v2 Optics, Stage, and Finish assets.
- `git diff --check` passes. The focused quick-add tests pass; native behavior remains separate from these local checks.
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

1. Publish the completed native hierarchy correction and send Astra one informed continuation message; do not send progress announcements or partial-result updates.
2. Revise Batch 002 as a new proposal with MECE focal/distance semantics, live IDs, an import guard, corrected fixed/variable controls, and the required draft/favorite impact audit.
3. Continue only the remaining native witnesses: Apply → Preview/compiler/clipboard parity, persistence/defaults/settings, Reduced Motion/Transparency, adaptive edge/display behavior, search/focus, and VoiceOver/IME.
4. Keep practical illustration blocked until the exact `gpt-image-2.5-flare` route is explicitly selectable/evidenced and the revised curator requests are accepted; do not substitute generic icons or unknown-model outputs.
5. Preserve the 14-record runtime boundary and publish only reviewed commits to the public Teleprompter remote.
