# Teleprompter UI handoff

Status: renderer surface primitives complete; lead integration and native acceptance remain. Updated 2026-09-13.

## Owned files

- `src/renderer/src/ui/CueSurface.tsx` — shared Create/Edit Cue surface, composer, output controls, editable recipe slots, picker/listbox overlay, selectable preview, copy feedback, and reduced-motion states.
- `src/renderer/src/ui/LibrarySurface.tsx` — Presets/Edits browsing, search, taxonomy/favorite filters, image-led cards, apply/favorite actions, and detail sheet.
- `src/renderer/src/ui/TokensSurface.tsx` — canonical atom/bundle search, field filters, grouped rows, apply/copy actions, and detail sheet.
- `src/renderer/src/ui/TeleprompterShell.tsx` — dark icon dock, shared layout indicator, responsive navigation, persistence status, and view transitions.
- `src/renderer/src/ui/icons.tsx` — centralized Phosphor vector imports.
- `src/renderer/src/styles/global.css` — namespaced charcoal/silver/orange system, focus/selection/scrollbar treatment, responsive layouts, overlay surfaces, and motion fallbacks.

## Contract use

The renderer consumes `CueSurfaceProps`, `CueSnapshot`, `LibraryView`, `CueCommand`, and `CopyResult` from the published shared barrel. It does not access Electron, IPC, files, or raw catalog semantics. Option lists are projected from `library.axes` and `library.choices`; the UI does not invent field-specific records.

## Implemented interaction coverage

- Create/Edit tabs, preset selection, searchable group selectors, single-axis replacement, many-axis toggles, leave-blank, custom text, and editable Edit recipe slots.
- WHAT uses a local buffer with 120ms debounced semantic updates and an immediate blur flush.
- Expanded/Shorthand preview, placeholder count, selectable prompt sections, one shared Copy action, success morph, copy failure message, and spotlight dismissal callback.
- Controlled overlay stack with click-away, nested Escape search clearing, focus return, compact bottom-sheet layout, and `requestSize('expanded' | 'compact')` integration.
- Picker listbox semantics, keyboard Home/End/Arrow navigation, no wraparound, explicit selected marks, multi-select state, and search access for off-screen choices.
- Library detail sheets preserve draft state until Apply; Tokens detail exposes shorthand, aliases, axis, source/caution disclosures, and asset availability.
- Motion targets use Motion shared layout/spring transitions; reduced motion removes travel/overshoot and limits fades.

## Visual direction and attribution

The surface follows the approved Teleprompter direction: `#101112` canvas, charcoal raised surfaces, recessed wells, brushed-silver material cues, warm orange active light, system sans-serif, 44px minimum controls, and 48px dock targets. Geometry and interaction hierarchy were adapted from the retained references in `03 Docs/Teleprompter Plan/References/01-Fluid-Composer.png` through `04-Industrial-Materials.png`. The component choices follow the settled SmoothUI references in `04-Mission-UI-and-Motion.md`; no remote assets or runtime network calls were added.

The current group/card art is a non-content CSS material placeholder. It intentionally avoids broken images and hand-drawn SVG illustrations while the illustration worker supplies approved raster assets and the lead wires their manifest.

## Focused checks

| Check | Result |
|---|---|
| `npm run typecheck` | passed after the Motion/Phosphor dependency install |
| `npm run build` | passed; Electron main, preload, and renderer bundles built |
| `node /Users/blinblon/.codex/skills/impeccable/scripts/detect.mjs --json src/renderer/src/ui src/renderer/src/styles/global.css` | passed with `[]` |

## Remaining evidence

- These components are not yet wired into the lead's renderer app state, engine compiler, or desktop bridge in this lane.
- Native Electron evidence is still required for main/spotlight sizing, shortcut behavior, clipboard acknowledgement, cross-window draft sync, and focus return.
- Approved raster artwork is still required for parameter tiles and library examples; the UI keeps missing assets explicit.

Next action: lead wires `TeleprompterShell`, `CueSurface`, `LibrarySurface`, and `TokensSurface` to the shared engine/desktop projections, then drives the native Cue and spotlight acceptance flows.
