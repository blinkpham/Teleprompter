# Current app audit

Audited 2026-09-13 against commit `5e21875`, starting with a clean tracked tree. Evidence combines targeted source inspection and the actual Electron built preview at `image-director://app/index.html`. `npm run preview` rebuilt its generated output before launch. No implementation code was edited.

## Decision

Keep the Electron foundation, deterministic catalog/search, native clipboard boundary, and source provenance. Replace the renderer's layout and visual components, introduce a Cue domain model, and strengthen the desktop boundary for two windows. A new visual skin alone would retain the overlay and state problems.

## Confirmed findings

| Priority | Finding and evidence | Consequence | Owner |
|---|---|---|---|
| P1 | The 80px navigation capsule contains labels plus counts; the native Gallery screenshot shows the Cheatsheet label/count exceeding the intended pill area. [CSS](../../src/renderer/src/styles/global.css) lines 61–66; [AppShell](../../src/renderer/src/ui/AppShell.tsx) lines 79–82. | The main navigation cannot contain its own content. Replace with a measured icon dock. | UI |
| P1 | Clicking the exposed backdrop of the open Surgical edit sheet left it open in native accessibility state. The dialog has cancel/close handlers but no outside-pointer handler. [TechniqueSheet](../../src/renderer/src/ui/TechniqueSheet.tsx) line 31. | Click-away dismissal is missing from the detail sheet. Appearance already has an outside-pointer handler; the failure is not universal. | UI |
| P1 | From that sheet, ⌘K removed the detail content but accessibility focus returned to View prompt, not Search. [App](../../src/renderer/src/app/App.tsx) lines 93–96 request focus before the dialog closes; line 162 later restores the opener. | Competing focus actions break the search shortcut. One overlay/focus coordinator must handle close destinations. | UI + lead |
| P1 | Sheet content puts a large instructional SVG ahead of the full prompt. In the native image it dominates the panel and pushes prompt text toward the bottom. [TechniqueSheet](../../src/renderer/src/ui/TechniqueSheet.tsx) line 34. | A copying utility makes users scroll past decoration. Prompt and Apply actions need priority; examples become secondary. | UI |
| P2 | Main headings, ledes, panel kickers, second headings, and descriptions repeat. Native Gallery shows all of them. [AppShell](../../src/renderer/src/ui/AppShell.tsx) lines 49, 63–66; [App](../../src/renderer/src/app/App.tsx) lines 155, 159. | Excess hierarchy consumes the working area. Remove this chrome in the redesign. | UI |
| P2 | Category and Family use native `select` popups behind a styled wrapper; CSS line 114 supplies a Unicode chevron. | Controls do not follow the requested custom component system. Replace with styled semantic popovers/listboxes and vector icons. | UI |
| P2 | The only declared animation found is the pending-copy spinner (`.spin`, CSS lines 140–141). No normal screen/overlay/selection transition declarations were found. | The user's lack-of-motion complaint is substantially correct; “zero animation” would be too absolute. | UI |
| P2 | UI uses Lucide outline icons and hand-authored PreviewDiagram SVGs; one decorative pool photograph backs unrelated techniques. | The representation does not convey the actual lens, composition, or edit result and misses the requested materials. | UI + illustration |
| P2 | Shorthand and family counts are explicitly monospaced; token code elements also inherit code styling. | Typography adds a coding-tool tone. Render ordinary UI and prompt text in system sans; preserve selectable text. | UI |

**Font correction:** no Inter dependency, import, or font declaration was found. CSS line 19 already requests `-apple-system`, `BlinkMacSystemFont`, Segoe UI, and system-ui. The redesign should retain a system font while correcting weights, density, and unnecessary monospace.

## Source-backed risks for the new scope

These are code findings, not newly demonstrated runtime failures.

| Area | Evidence | Required response |
|---|---|---|
| Viewport containment | `.app-shell` uses `min-height:100vh`, while its intended scroller has no bounded ancestor height. CSS lines 47–58, 71–81. | Use a fixed viewport grid with `min-height:0`; give each view its own scroll container. Verify narrow/short windows. |
| System appearance | AppShell deletes `data-theme` for system mode; CSS defaults to light and has no `prefers-color-scheme` dark branch. | Remove appearance modes entirely; force dark in renderer and native theme. |
| Copy lifecycle | [CopyButton](../../src/renderer/src/ui/CopyButton.tsx) lines 28–39 has no rejected-promise catch, request identity, or payload-change reset. Old success timers are not cleared on repeat. | Tie success/error to the actual request and payload; clear timers; handle bridge failure. |
| Shortcut state | Menu mode commands dispatch directly while click navigation also persists lastMode; App lines 98–99 vs. 111–115. | Centralize commands. New launches always open Cue, so legacy lastMode is no longer authoritative. |
| Desktop identity | [Main](../../src/main/index.ts) line 182 sets Image Director after ready; this host's preferences live under `Application Support/image-director`. | Rename visible identity while explicitly preserving the existing data directory. |
| Two-window IPC | Main line 57 authorizes only one webContents/top frame. | Register known windows, validate frame URL and message payload, and expose narrow methods to both surfaces. |
| Navigation containment | No window-open denial, will-navigate guard, or permission-denial handlers found in main. Renderer dev URL is accepted from the environment without a loopback check. | Close these boundaries before a second window and externally researched content are introduced. |
| Durability | Preferences use a serialized temp-write/rename path; failed writes become session-only. Load failures silently default. Schema version is not rejected by the validator; close-time flush and bounds updates are absent. | Preserve the useful writer pattern; add version-aware migration, recovery copy, bounded shutdown flush, and bounds persistence. |
| Catalog semantics | The catalog has 104 rows, including 10 presets, but only coarse families. `resolvePreset` filters unresolved components instead of surfacing an error. | Adapt the legacy catalog to explicit axes; never silently omit missing preset atoms. The curator owns semantic duplication decisions. |

## What was verified in this audit

The actual app launched after the preview build. Native inspection established the Gallery's layout, visible SVG-heavy detail panel, click-away behavior, and the ⌘K focus result. Accessibility inspection exposed Gallery 15 and Cheatsheet 104 with their current content. Later screenshot capture continued to show the prior Gallery frame while accessibility state changed to Cheatsheet; this audit therefore does not claim a fresh visual inspection of the full Cheatsheet screen.

The Impeccable code detector returned `[]`. Its static findings do not overrule the observed layout and interaction defects. This pass did not repeat the worker's seven logic tests, clipboard/favorites tests, compact-window tests, or cross-platform tests. Prior passes recorded in MAP remain historical evidence.

The audit-owned preview process was stopped. Gallery was restored after navigation. Existing source, favorites, original prompt material, and historical plans were preserved.

## Acceptance implication

The redesign is accepted through native behavior and observed motion, including clicking away and moving focus, rather than a static screenshot or a clean detector result. The lead's [acceptance matrix](08-Lead-Execution-and-Acceptance.md) specifies the small set of complete flows that must pass.
