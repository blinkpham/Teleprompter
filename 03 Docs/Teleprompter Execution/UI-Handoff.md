# Teleprompter UI handoff

Status: renderer surface primitives and lead integration complete; native acceptance remains bounded by the project gate. Updated 2026-09-13.

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

The Cue group controls now use the approved v2 Optics, Stage, and Finish raster assets as image-led horizontal capsules with short label/value stacks and selected outlines. Practical example art remains separately model-gated; no model claim is made here.

## Focused checks

| Check | Result |
|---|---|
| `npm run typecheck` | passed after the image-led capsule refinement |
| `npm run test:logic` | passed; 8 files, 33 tests |
| `npm run build` | passed; Electron main, preload, and renderer bundles built with v2 group assets |
| `node /Users/blinblon/.codex/skills/impeccable/scripts/detect.mjs --json src/renderer/src/ui/CueSurface.tsx src/renderer/src/styles/global.css` | passed with `[]` |

## Remaining evidence

- Native Electron evidence is still required for the remaining global-shortcut and independently chosen cursor-location gates; the menu fallback, picker resize, clipboard acknowledgement, click-away, and focus return are accepted separately.
- Practical example artwork remains blocked until an authorized route can explicitly select or report GPT Image 2.5 Flare.

Next action: lead keeps the 14-record runtime boundary and the two remaining native/artwork gates explicit while finishing acceptance.
