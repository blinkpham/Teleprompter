# Compact controls and motion — research and decisions

Checked 2026-09-13. Research covers first-party component documentation, public registry source, Motion, Tiptap, and WAI-ARIA guidance. No component was installed and no demo animation was passed off as a native Cue test. Product dimensions and adaptations below are design decisions.

## Pattern findings

| Pattern | Primary-source finding | Teleprompter decision |
|---|---|---|
| Expandable cards | SmoothUI animates selected-card expansion and offers keyboard entry. Its registry includes its own card semantics and Lucide dependency. [Docs](https://smoothui.dev/docs/components/expandable-cards), [registry source](https://smoothui.dev/r/expandable-cards.json) | Use a compact parameter summary that expands in place. Keep a real disclosure button separate from controls inside it, use `aria-expanded`, and retain Phosphor. Do not wrap nested inputs inside a giant button or copy its demo content. |
| Morphing surface | The source transitions a dock/form in place with Motion and reduced-motion handling, but includes feedback-form, orb, and button dependencies. [Docs](https://smoothui.dev/docs/components/morph-surface), [source](https://smoothui.dev/r/morph-surface.json) | Adapt one shape owner for bar → accessory → bar. Remove feedback/orb/submission logic. Keep editor focus and draft mounted through the transition. |
| Camera-style draggable ticker | Exposure Slider exposes step/range and draggable ticks. The inspected source uses global pointer move/up listeners; no keyboard/ARIA implementation was found in that file. [Docs](https://smoothui.dev/docs/components/exposure-slider), [source](https://smoothui.dev/r/exposure-slider.json) | Borrow the moving tick scale and fixed centre marker. Supply keyboard, pointer cancellation, disabled/reduced-motion behavior, and numeric input separately. Never ship the demo unchanged. |
| Scrubber | The registry uses pointer capture, arrow/Home/End handling, slider values, and reduced-motion behavior. [Docs](https://smoothui.dev/docs/components/scrubber), [source](https://smoothui.dev/r/scrubber.json) | Better mechanical starting point for an actual numeric parameter. Use a 44px hit area with a small visual ruler, not a large decorative card. |
| Context menu | SmoothUI's wrapper imports an existing UI context-menu primitive and supplies motion. Radix documents keyboard/focus/submenu behavior. [SmoothUI source](https://smoothui.dev/r/context-menu.json), [Radix](https://www.radix-ui.com/primitives/docs/components/context-menu) | Use for secondary actions on the current group/record: clear, reset, inspect, copy. The same menu opens from a visible ellipsis button. Essential selection stays in a listbox, not a menu. |
| Dynamic Island | SmoothUI's component supplies state-dependent pill expansion and status presentation. It is a web component, not a macOS notch/window API. [Docs](https://smoothui.dev/docs/components/dynamic-island) | Borrow continuity, compact resting state, and brief success feedback. Do not import notifications, timers, media controls, or a permanent notch widget. Native geometry is a separate host responsibility. |
| Inline suggestions | Tiptap provides configurable trigger matching, result rendering, placement, and dismissal; its Mention extension supports multiple trigger types. [Suggestion](https://tiptap.dev/docs/editor/api/utilities/suggestion), [Mention](https://tiptap.dev/docs/editor/extensions/nodes/mention) | Use the interaction contract for `/` and `@`. Start with the existing plain-text editor and a small local suggestion controller; a rich-text editor is justified only if protected inline mention chips later become required. |

A component's “accessible” description is not product evidence. For example, a nominal camera preset must not acquire a numeric slider role merely because a ticker looks appealing. WAI-ARIA distinguishes numeric sliders, discrete listboxes, command menus, and editable suggestions; select the semantics that match the data. [Slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/), [Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/), [Menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)

## Which control to use

The old selector spends space on parallel tall columns, repeated large artwork, empty axis wells, and repeated custom fields. The new selector has one active axis, one useful visual focus, and an option control chosen by cardinality and data type.

| Accepted choices / data | Compact control | Space budget |
|---|---|---|
| None | A field-level custom input; no empty option stage | One 44px editor |
| One | One selectable value or toggle with its meaning on inspection | One 44–56px row |
| Two to four nominal values | Small segmented choices or a finite snap rail; inspect one choice at a time | 44–72px options plus an optional 72px art area |
| Five to twelve nominal values | Finite horizontal rail plus “All options” searchable list | Rail at most 96px; list at most six 44px rows |
| More than twelve values | Searchable list with bounded scroll; one preview of the highlighted result | Six visible rows; no full-height columns |
| Numeric value with explicit units, limits, and step in the accepted contract | Fixed-centre ticker/scrubber plus direct numeric entry | 44px control, 20px label/value line |
| Multiple compatible values | Compact checkbox list or two-column choices, with selected summary | Six visible rows; scrolling does not toggle |

The current three focal cues remain discrete approved records. They are not permission to invent all focal lengths between 35 and 85. A ruler may label only the three accepted stops; equal spacing represents option order, not a claim of linear optical distance. Exposure, strength, aperture, and other continuous sliders remain unavailable until their units/ranges and compiler meaning are published. No decorative slider may change a number that never reaches the prompt.

Keep imagery substantial in the single focus area and brief in option rows. A group object may identify the family once. Only a record-specific accepted example may depict its effect. This preserves visual emphasis without multiplying 144px image capsules down several columns. Practical-art gaps remain explicitly open.

## Motion that helps this layout

Motion's `layout`/`layoutId` can join visual states, but its layout animations use transforms and may distort children. The docs also state that layout animations are blocked during horizontal window resize. Coordinate native bounds separately; do not assume an automatic layout spring will animate the operating-system window. Use position-only/content fades or explicit inner geometry where needed to preserve text. [Motion layout documentation](https://motion.dev/docs/react-layout-animations)

Use a responsive, restrained character: a quick 100ms feedback duration, 180ms standard surface change, and 240ms large accessory transition. Start entrances with `cubic-bezier(.2,0,0,1)` and shorter 120–160ms exits. A highly damped spring is appropriate for deliberate ticker release, with no endless inertia or whole-panel bounce. Final values require native observation.

The primary layer is the surface edge or selected value. A subtle shadow/rim change supplies depth; material opacity settles with that same transition and becomes still. No ambient looping effect is necessary. Reduced Motion and Reduced Transparency override ornamental motion/material rules: instant geometry or ≤80ms content fade, opaque readable surfaces, unchanged functions.

One source of truth owns each edge. When the operating system animates panel bounds, the renderer adapts its content without a second competing size spring. When the renderer performs a morph inside temporary union bounds, the host must shrink promptly and pass the transparent-gap input checks in [05 — Native research](05-Adaptive-Window-Research.md). A large invisible permanent window is unacceptable.

## Suggestion behavior worth adopting

Keep text focus in the editor while arrows move the active suggestion. Enter accepts deliberately; Escape dismisses without deleting prose. Preserve browser/OS text-editing keys and IME composition. Provide an accessible result list and active-option announcement, then test the actual multiline editor with VoiceOver rather than assigning a combobox role blindly. [WAI-ARIA combobox guidance](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)

Open suggestions only for local user input at a valid trigger range. Remote draft synchronization must not pop the menu in the other window. An Escape-dismissed query stays dismissed until the trigger context changes. Tiptap documents both origin-sensitive suggestions and dismissal state, which are useful precedents even when retaining the textarea. [Suggestion lifecycle](https://tiptap.dev/docs/editor/api/utilities/suggestion)

Use first-party component source as a starting point, keep source/license attribution, and remove demo-only dependencies. The implementation contract follows in [07 — Adaptive Cue](07-Adaptive-Cue-Contract.md) and [08 — Quick add and references](08-Quick-Add-and-References.md).
