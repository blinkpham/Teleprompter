# Mission — UI and motion

## Dispatch prompt

> Redesign Teleprompter's renderer using the decisions in this mission. Read AGENTS.md and MAP.md, then the scope override in `03 Docs/Teleprompter Plan/00-Start-Here.md`, the shared contracts, and this mission. Use os-build and impeccable. You own `src/renderer/src/ui/` and `src/renderer/src/styles/`; the illustration worker owns generated asset files, and the lead owns renderer app wiring and root dependencies. You are not alone in the codebase: preserve other workers' edits, use the agreed component interfaces, and request contract changes through the lead. Implement the real Cue, Library, Tokens, overlays, and motion states; do not stop at a static shell. Keep content semantics in the engine. Produce native visual/interaction evidence with the lead. Do not generate replacement hand-drawn SVG illustrations.

## Visual direction

The working surface resembles a compact physical control console: warm charcoal, brushed-silver objects, frosted wells, and a small orange glow inside active controls. Reference 04 supplies materials; references 01–03 supply control geometry and interaction hierarchy. Keep orange within the UI and industrial artwork. A preset's example photograph must retain that preset's actual palette and lighting.

No in-content brand mark, welcome banner, lede, “source-backed” badge, repeated panel description, decorative code font, or unrelated pool photograph. Product identity belongs in the app icon, native title/menu, and a compact About view. Content titles, parameter labels, values, short error messages, and optional explanations remain where they aid a choice.

## Component stack — settled choices

Use React/TypeScript already in the project. The lead installs and locks Motion, Tailwind CSS v4 with its Vite plugin, Radix UI, the small utility dependencies required by selected registry files, and `@phosphor-icons/react`. Use `motion/react`, not an additional animation framework. Bundle styles, fonts, icons, and imagery locally.

SmoothUI is a source registry, so vendor selected components into `ui/vendor/smoothui/`, record their registry URL and retrieval date in a README, retain license notices, and adapt them through Teleprompter wrappers. Inspect each selected file before adding it; its marketing demo is not the product interface.

| Product control | Source and adaptation |
|---|---|
| Main icon dock and Create/Edit switch | [Animated Tabs](https://smoothui.dev/docs/components/animated-tabs), using its controlled state and shared moving pill; proper roving focus and vertical orientation in the dock |
| Copy and primary actions | [Magnetic Button](https://smoothui.dev/docs/components/magnetic-button); cap displacement and keep the hit target stationary |
| WHAT composer | [AI Prompt Input](https://smoothui.dev/docs/components/ai-prompt-input); retain measured growth, remove chat submission/upload/model state, expose a textarea and Copy action |
| Detail/picker overlays | [Dialog](https://smoothui.dev/docs/components/dialog), with Radix focus trap, dismissal, and controlled open state |
| Slot-selection feel | [Scrubber](https://smoothui.dev/docs/components/scrubber) for pointer/keyboard mechanics; build discrete option lists with listbox semantics rather than exposing focal length as a fake numeric slider |
| Joining/expanding surfaces | [Morph Surface](https://smoothui.dev/docs/components/morph-surface) as a motion reference; extract the shape transition into a controlled surface, not the demo's hardcoded chat state |

Registry inspection on 2026-09-13 found Motion dependencies for these components, Radix in Dialog, and demo dependencies in Morph Surface. [Gooey Popover](https://smoothui.dev/docs/components/gooey-popover) uses GSAP; do not import it as a second animation runtime. Reproduce the joining-surface treatment using Motion geometry and a decorative background layer. This is an explicit adaptation decision, not a claim that every SmoothUI component is production-ready for Cue.

Use [Phosphor React](https://github.com/phosphor-icons/react) duotone by default and fill for selected/pressed states. Centralize imports in `ui/icons.tsx` and check exports against the installed version. Suggested concepts: terminal/composer for Cue, stacked images for Library, sliders for Tokens, copy, close, undo, settings, favorite, expand, and search. All buttons use library SVG icons; no Unicode chevrons, emoji action icons, or raster control icons. Keyboard glyphs such as ⌘ remain text in shortcut hints.

## Design tokens

These are implementation starting values. Adjust only to correct observed contrast, clipping, or material fidelity; keep the system coherent.

| Token | Value / use |
|---|---|
| Canvas / surface / raised / well | `#101112` / `#1B1D1F` / `#27292C` / `#141618` |
| Text / secondary / muted | `#F4F2EE` / `#B8B9BC` / `#92969C` |
| Accent / warm light / dark ink | `#FF8B45` / `#FFE3CE` / `#21130C` |
| Border / top inner rim | white at 9% / white at 14% |
| Font | `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`; no remote font and no Inter |
| Type sizes | 13px compact values, 14px body, 16px WHAT, 20px overlay title; weights 400/500/600 |
| Spacing scale | 4, 8, 12, 16, 20, 24, 32px; never shrink hit targets to fit |
| Radii | 999px action pills; 28px composer; 24px parameter tiles; 32px large overlay |
| Hit targets | 44×44px minimum; 48px main dock buttons; Copy 56×48px |
| Depth | Raised: inner top hairline plus `0 10px 28px #0005`; recessed: `inset 0 2px 6px #0006`; active: small orange inner bloom |

Use plain system text for prompt previews, section labels, counts, and shorthand. Uppercase template labels belong inside the generated prompt; selector labels use ordinary title case. Prompt wrapping must preserve text and selections. Tooltips and status labels are not monospaced.

Contrast must be measured on the composited surface: 4.5:1 for normal text and 3:1 for large text/control boundaries. A faint metal edge can be decorative, but selected/focused controls need an independent clear state. Keyboard focus uses a 2px warm-white ring with dark separation, not glow alone. In reduced transparency/high contrast conditions, replace frosted translucency with opaque surfaces.

## Main shell

Use a bounded window grid: `html, body, #root` fill the viewport; body does not scroll. A 52px top strip reserves native traffic lights and dragging space; interactive regions are no-drag. Below it, the 72px rail and active content fill the remaining height with `min-width:0; min-height:0`.

The rail contains one 64px-wide capsule with three 48px icon tabs, 8px vertical gaps, and 8px padding. It contains no text labels or counts. Hover/focus tooltips read Cue, Library, Tokens and show their shortcuts. Settings sits at the rail's foot. Center the dock vertically within the available region; keep it visible even when content scrolls. At widths below 760px, move navigation into a horizontal top capsule with equal contained targets.

The content region has 24px padding at normal widths and 16px at compact widths. Cue centers at a maximum 1040px width; Library and Tokens can use the available area. Each view retains its own query, filters, and scroll position for the current session. A hidden view is inert and absent from the accessibility tree. The visible view has one visually hidden h1 for orientation, without a duplicate visible heading.

## Cue layout and complete flow

The default viewport shows a compact Create/Edit segment and a searchable preset selector above one composer. The preset selector displays the chosen preset or “Preset”; its detail reveals the constituent atoms and skipped manual overrides. It is a choice control and therefore displays a value. Utility/action buttons are icon-only, with immediate keyboard labels and hover tooltips.

The composer has three parameter tiles—Optics, Stage, Finish—above WHAT. Each tile includes a 48–64px raster group object, its short label, and up to two lines summarizing chosen values. The empty state reads “Choose”; two or more selected values collapse to a concise summary plus `+N`. Full values are available on focus/open. Do not squeeze labels until they overflow.

WHAT is a true textarea that grows from two to six lines, then scrolls internally. In Edit its placeholder changes to “Describe any other changes”; the selected edit use cases appear as removable chips above it. Do not add attachments, model selectors, duration, audio, generation progress, or fake inference indicators from the reference screenshot.

The lower row contains IMPORTANT and AVOID triggers, OUTPUT ratio/resolution value pills, preview, Undo, and the Copy icon action. At compact widths it wraps into deliberate rows; Copy remains reachable without horizontal scrolling. Important/Avoid open custom multi-select popovers with library choices and free text. Ratio and resolution use small custom listboxes. Every template field is accessible within one group/popup; no field is available only in the preview.

Preview opens below the composer, using the same surface expansion, as selectable read-only text with template labels. Provide Expanded/Shorthand format choices, a placeholder count, and one Copy control; do not duplicate copy actions in the same view. Outside the expanded preview, the composer Copy action remains the single primary action. The shared control can move between those locations rather than appearing twice.

First use has no preselected preset, visual direction, or output dimensions. Copy still works and produces the blank template. “Custom” for each field adds literal text; “Leave blank” intentionally pins the empty choice. Clear/reset is undoable. Escape and outside click preserve committed draft values.

## Parameter selectors

Open a controlled dialog from the major tile. It has a short group title, close icon, reset-group action in an overflow menu, and a three-column stage at wide widths. Use a dark recessed well for each column and a bright rim around the selected oval. Each column shows a centered option plus adjacent choices faded toward the top and bottom. Place the fade mask on the scroll content, not its header, focus ring, or scrollbar.

| Group | Columns/panels |
|---|---|
| Optics | Lens; Viewpoint; Depth & focus. Viewpoint exposes elevation, azimuth, and roll as short sub-tabs; Depth & focus exposes its two independent axes. Distance is a small value control beside Lens. |
| Stage | Composition; Key light; Light shaping. Composition separates hierarchy/placement/crop/depth with sub-tabs. Light shaping includes contrast/time/fill/accent axes. |
| Finish | Base look; Treatment & palette; Mood. Treatment includes texture/retouch; multi-select values appear in a persistent selection tray. |

These are views onto the shared axis registry, not separate data stores. The UI obtains labels, entries, cardinality, and compatibility from the engine. All library options remain discoverable through a local search at the top of the picker, including off-screen options.

Single-valued axes use a **finite vertical slot list** with CSS scroll snap and a controlled highlighted item. Never wrap from last to first or auto-spin. Wheel/drag moves the highlight; pointer release or 100ms scroll settle commits once. Arrow keys move the highlight; Enter commits; Home/End jump. While the user is actively scrolling, Copy waits for the final committed selection rather than copying an intermediate highlight. Choosing a visible neighbor by click commits directly.

Multi-valued axes use the same image-backed option tiles with an explicit selected mark and a compact selected tray. Scrolling changes focus only; Space/Enter/click toggles. Expose listbox/option semantics with `aria-multiselectable` where appropriate. A scrubber illustration is decorative; never map every item to a slider role. Keep search keyboard access available for large lists and reduced-motion mode.

At widths under 640px, show one column at a time with a segmented axis selector; preserve the selected tray. In the spotlight's smaller canvas, the picker replaces the composer's body within the same native window. It does not spawn another BrowserWindow. Back returns to the draft with selections preserved. The large main-window picker is at most 960px wide and `viewport height - 96px` tall, with internal scrolling.

Changes commit immediately after an intentional option action. Closing by outside click, Escape, or Back preserves them. Reset-group is scoped to that group's axes and has Undo. Cross-axis conflicts use the engine's Replace/Keep choice; card styling must not silently resolve them.

## Edit interaction

Edit adds a searchable, multi-select use-case chooser. Selected use cases expand only their needed parameter slots. Use ordinary editable fields with clear labels such as Target, New identity, Reference image, or Region; blank values stay valid. Show reference roles in a compact numbered list with explicit base selection. This is a text-role editor, not a file uploader.

Keep is an expandable row of preserved-domain chips derived from the compiler. If a selection unlocks camera, background, or another domain, the visible Keep list changes immediately. A user may manually unlock an additional domain. Attempting to relock a domain still affected by a recipe points to that recipe; it cannot create a contradictory keep instruction. Removed recipes restore derived locks unless the user explicitly unlocked those domains.

Before any structured edit is chosen, Keep remains an editable-later placeholder in the compiled template. Its optional help explains that free prose is not analyzed and that structured operations or manual unlocks control preservation. Keep this explanation behind the disclosure rather than adding another permanent lede.

Library Apply must route an edit recipe into Edit and a visual preset into the current compatible mode. Opening detail never changes a draft. The Apply icon has an accessible label containing the item name. If Edit has no compatible operation, the preset breakdown states which operation is needed; do not silently switch modes or enable edits.

## Library and Tokens

Library contains a small Presets/Edits segment, search, taxonomy filter, and favorite filter. Use image-led cards with one title, one short differentiating description, an Apply icon, and a favorite icon. Photo examples depict the record; industrial heroes may introduce a family in an expanded detail, but do not replace evidence of photographic effects. Avoid an always-present hero banner.

Detail opens as an accessible sheet. Lead with title, Apply, selected atoms or edit slots, then the copyable prompt; show the practical example next. Source/caution information is a disclosure. Presets display their exact deconstruction and manual-override behavior. Original legacy snippets remain selectable/copyable under “Original”.

Tokens uses the canonical major/minor hierarchy, with search and field chips. Each row shows a label, concise meaning, and Apply/Copy utility icons. A token's technical shorthand is secondary, in the same sans-serif family. Reveal the full expansion, aliases, source, image example, and compatible axes on inspection. Content counts belong in a results status, never in the navigation dock.

## Overlay and focus contract

Use one controlled overlay stack per renderer. A picker, tooltip, nested listbox, and detail sheet must agree on inside/outside boundaries. Pointer-down on a trigger followed by pointer-up must not open and immediately close the same overlay. A drag originating inside a slot list must not dismiss its parent when released outside.

Escape first clears an active picker search when nonempty; then closes the innermost popup; then returns to Cue; then hides the spotlight if no overlay is open. Outside pointer closes the highest relevant overlay and preserves selections. Desktop blur hides the spotlight through the desktop worker. A blur from internal renderer focus movement is not a native-window dismissal signal.

On close, return focus to the opening control if it still exists. Navigation commands carry a destination: ⌘K closes overlays and focuses local search after the close completes, bypassing opener restoration; Cue's ⌘K opens preset/token search. ⌘1/2/3 choose Cue/Library/Tokens. ⌘Enter copies the acknowledged draft. Never let a background global listener capture IME composition or ordinary textarea editing keys.

## Motion specification

| Transition | Implementation target |
|---|---|
| Dock / mode indicator | Shared layout capsule, spring stiffness 420 / damping 34 / mass 0.8; icon color changes over 120ms |
| View changes | 180ms opacity and 6px shared-axis movement; mount one active view without remounting its draft state |
| Composer expansion | Layout spring 330 / 30 / 1; continuous rounded silhouette; animate the background separately so text does not stretch |
| Parameter tile to picker | Matching layout IDs within the same renderer; 240–320ms surface expansion, children fade in after 60ms |
| Slot movement | 160–220ms spring settle; finite list; selection rim moves, text remains sharp |
| Hover | Stable hitbox; inner content moves at most 3px; cursor-positioned radial highlight fades over 140ms |
| Press / Copy success | Scale 0.97 while pressed; Copy morphs to a check after native acknowledgement; reset after 1400ms |
| Closing | 140–180ms fade/shape retreat; focus restoration follows completion |

These are target settings, not evidence that motion was tested. Measure and tune in the native app. Avoid perpetual animation, spinning decorative objects, delayed typing, bouncing text, cursor replacement, and moving whole controls out from under the pointer. Cursor follow applies only while hovering an eligible control; the popup does not chase the cursor after opening.

For the gooey join, animate two rounded background lobes into one connected surface; any blur/filter applies only to that decorative background. A small inline SVG filter is acceptable as a rendering effect, never as a hand-drawn content illustration. Keep controls and their text in an unfiltered layer. Reduced motion disables magnetic displacement, elastic overshoot, slot travel, and blob merging; use instant state changes or an opacity fade of at most 100ms. Hidden windows pause all animations.

## Verification and handoff

Demonstrate the complete Create and Edit flows at normal size and the smallest supported main window; exercise the popup's compact layout with the desktop worker. Inspect all field selectors, long labels, all selected chips, missing images, empty search, invalid record, copy failure, and draft conflict states. Check keyboard-only access, click-away, nested Escape, focus return, and reduced motion. Do not infer animation quality from source code or a still image.

Record before/after stills plus a short native recording of opening Cue, expanding a group, moving a slot, selecting multiple choices, closing by click-away, and copying. Store `03 Docs/Teleprompter Execution/UI-Handoff.md` with source attribution, adapted components, observed dimensions, tested states, and remaining issues. The lead accepts the integrated result.
