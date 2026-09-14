# Teleprompter UI quality reset — execution plan

Status: implementation in parallel lanes

## Decision

Reset the presentation layer without reopening the accepted engine, LibraryV2, draft, clipboard, or persistence contracts. Internal identifiers remain stable for search, compilation, and copy, but user-facing surfaces lead with human labels and visual meaning.

## Evidence

- Annotated captures: `03 Docs/Teleprompter Plan/References/` plus the local screenshot packet assembled in `Sol-UI-Quality-Packet-2026-09-13.md`.
- Current audit and mission constraints: `03 Docs/Teleprompter Plan/01-Current-App-Audit.md` and `04-Mission-UI-and-Motion.md`.
- Native bounds/security constraints: `05-Mission-Desktop.md` and `src/main/placement.ts`.
- Sol reviewed the attached packet after the original path-access refusal. Its confirmed direction: presentation-layer reset; preserve engine and desktop contracts; treat `5e21875` as the packet’s reported clean baseline, not independently verified Git state.

## Acceptance checks

1. No internal ID is a primary heading, card title, selected-value label, or CTA. Example: `cam:natural50` displays as “Natural 50 mm”; shorthand is secondary or explicitly requested.
2. Cue, picker, Library, Tokens, and preview use system sans-serif, visual-first rows/cards, purposeful icons, readable hierarchy, and distinct Expanded versus Shorthand output.
3. The main window is a stable desktop workspace with deliberate compact states. Body/root do not become a continuously reflowing webpage; inner surfaces own scrolling.
4. The spotlight has transparent native margins, cursor-positioned/clamped bounds, reliable compact/expanded resizing, focus restoration, and truthful native evidence separate from browser evidence.
5. Motion clarifies state changes, stays within hitboxes, and becomes instant/short-fade under reduced motion.
6. Illustration assets are produced, documented, and integrated only through the delegated asset lane; unavailable model provenance remains explicitly blocked.

## Parallel workstreams

| Lane | Owner | Write scope | Dependency |
| --- | --- | --- | --- |
| UI semantics and motion | UI worker | `src/renderer/src/ui/`, `src/renderer/src/styles/` | Existing shared contracts and asset manifest |
| Native desktop | Desktop worker | `src/main/`, `src/preload/`, main tests | Existing renderer surface query and placement contracts |
| Illustration | Illustration worker | `src/renderer/src/assets/teleprompter/`, `03 Docs/Teleprompter Execution/Artwork/` | No UI dependency; integration only after provenance review |
| Lead integration | Lead | `src/renderer/src/app/`, `src/shared/`, root config, acceptance docs | Reconcile worker outputs, run focused checks, native verification |

## Dependency order

1. Workers implement disjoint slices against the current contracts.
2. Lead reviews changed files and reconciles any contract or import drift.
3. Lead runs `npm run typecheck`, `npm run test:logic`, `npm run build`, and `git diff --check`.
4. Lead starts the actual Electron app and records main-window and spotlight witnesses separately from browser previews.
5. Lead accepts only asset files with provenance and keeps model-gated claims marked as such.

## Risks and unresolved decisions

- The packet did not contain `.git`; live Git status remains a local-only fact.
- The exact route/model for practical Illustration assets must be evidenced before claiming model compliance.
- The default output ratio/resolution values need to remain truthful to the compiler; the UI may improve the empty state without inventing defaults.
- Native global-shortcut delivery and spotlight blur/focus still require an independent witness; menu registration alone is insufficient.
- Compact-width breakpoints must be named and tested in the native app rather than inferred from CSS alone.
