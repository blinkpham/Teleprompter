# Visual contract

Status: implementation targets, not observed results. Dimensions are CSS pixels / Electron DIP unless identified as screenshot pixels. The later [adaptive contract](07-Adaptive-Cue-Contract.md) owns popup geometry and compact selectors; [quick add](08-Quick-Add-and-References.md) owns inline search. Use container width, text zoom, and native scaling.

## 1. Direction and reference translation

Use the [fluid composer](../References/01-Fluid-Composer.png) for the joined input/action surface, [parameter composer](../References/03-Parameter-Composer.png) for compact controls around one editor, [camera selector](../References/02-Camera-Selector.png) for object-above-label capsules and finite neighboring choices, and [industrial materials](../References/04-Industrial-Materials.png) for the objects' metal, frost, and restrained orange illumination. The supplied material reference does not require a large orange interface glow.

The governing hierarchy is **object → group name → action/state**. Within the WHAT area, the user's text leads. Remove repeated page titles, promotional overlines, card descriptions that merely list the group's fields, technical badges, default zero counts, and control hints that duplicate visible affordances. Keep accessible names and semantic headings visually hidden where navigation requires them.

### Surface and type tokens

| Token | Target |
|---|---|
| Canvas / composer / control / well | `#101214` / `#17191B` / `#212326` / `#121416` |
| Primary / secondary text | `#F4F2EE` / `#B7BABD`; smaller text must meet 4.5:1 on its final surface |
| Accent | `#FF8B45` for Copy and bounded feedback; group artwork retains its baked orange light |
| Idle edge / configured edge / open edge | White 10% / white 28% with a check / solid warm-white 2px; the first two edges are decorative, not sole state indicators |
| Depth | One 1px top inner rim, a subdued bottom edge, `0 6px 14px #0004`; at most a 2–4% luminance change across the control face |
| Type | Existing system sans-serif; 15/20 group names, 16/24 WHAT, 14/21 body, 13/18 secondary, 18/24 dialog title; weights 400/500/600 |
| Radius | Composer 28; group capsules 999; search 20; small utility buttons circular; large overlays 30 |
| Spacing | 4, 8, 12, 16, 20, 24, 32; prefer removal of content before shrinking targets |

Do not use all-caps micro-labels for Optics/Stage/Finish or raw IDs as display titles. A selected value must not be larger or bolder than its group name. Keep prompt text in the same font; typography may soften template labels without changing the copied text.

Use the existing `motion/react` and centralized Phosphor icons. Preserve existing licenses and source attribution for adopted SmoothUI components. The original [component adaptation choices](../04-Mission-UI-and-Motion.md#component-stack--settled-choices) remain relevant; installing another animation framework or copying demo UI is unnecessary. Implement the described behavior even if the chosen source component needs substantial adaptation.

## 2. Shell and Cue anatomy

Keep the existing three-destination dock and native traffic-light area. Dock targets are 48×48; secondary settings/search targets are 44×44. Use one active capsule with a stable icon center, a tooltip on hover/focus, and an accessible destination name. No brand lockup in the content area. Cue opens directly into its controls; “Build a cue” and “Compose locally” disappear.

The main workspace is at most 960px wide, with 24px external gutters and a 900px maximum composer. Align its start with the dock's content grid. A compact 176×40 Create/Edit segment sits above the composer, beside a content-width preset control. Its background wraps its two segments rather than spanning the whole page. The active thumb moves beneath stationary text. Use one 44px overflow button for reset/undo actions; remove the lonely reset square above the page.

### Composer structure

| Band | Geometry and content |
|---|---|
| Groups | Main window: three 220–252×64 capsules with 12px gaps, starting 12px inside the composer. Popup: reveal the compact 52px overview only when requested, per 07 |
| WHAT | Same composer foundation, 12px gap below groups; 16px internal text padding; min 96px and max 240px at wide size, then internal text scroll. Placeholder “Describe the subject, action, and scene…”; accessible label “What” |
| Footer | One 44–48px row inside the foundation. Important, Avoid, compact output selector, flexible space, Preview icon, Copy icon. 8px gaps; no separate full-width toolbar card |
| Preview | Expands the same foundation beneath the editor; the shared Copy control moves into the preview footer so only one primary Copy is visible |

Hide the browser textarea resize handle. Grow the textarea from its content measurement, without moving the caret or stealing scroll during typing. Do not add a visible WHAT heading plus a second line that repeats its placeholder. Keep normal text selection and IME input.

Important/Avoid use short text with a leading vector icon; show a small count only when something is present. Preview is a 44px circular icon button with tooltip “Preview prompt.” Copy is a 52×44 orange capsule with one 20px icon and accessible name “Copy prompt.” Success replaces the icon with a check only after native acknowledgement. Text-and-icon buttons always put the icon first; disclosure chevrons remain trailing.

### Optics / Stage / Finish capsule anatomy

Each is a single button with one continuous capsule boundary. In the main window, the v2 transparent object sits directly on the surface in a 72×56 box; the popup overview uses a 40px box. Size by visible alpha bounds with `object-fit:contain`. The full silhouette and a small contact shadow remain visible. No nested square, radial well, raster border, or second app-icon container. Reserve larger imagery for an opened visual focus or inspection.

Place the title to the right with an 8px gap, 15px/500 or 600, normal case. At rest show only Optics, Stage, or Finish. A 14px vector check at the far end indicates configured state. Remove “Choose,” the `+n` value stack, field descriptions, and the always-visible expand icon. The whole object/name surface is the trigger. On hover or keyboard focus, a tooltip shows the full selected human labels, or a short field list when empty. Long tooltip content wraps at 280px; the capsule geometry never changes with content length.

| State | Visible treatment | Semantics |
|---|---|---|
| Empty | Quiet edge, full-colour object, group name | Button, accessible name includes group; no check |
| Configured | Stronger edge and check; title/object stay in place | `aria-describedby` names chosen directions; all three groups can be configured together |
| Hover | Inner light changes subtly; object follows pointer at most 2px | Stable hitbox; no selection occurs |
| Press | Inner layer recesses 1px and scales to .985 | Commit only on valid activation; pointer cancel restores state |
| Open | Continuous warm-white 2px outline; object remains legible during transition | `aria-expanded=true`, `aria-haspopup=dialog`; open is distinct from configured |
| Keyboard focus | Independent 2px focus ring, 3px dark separation | Focus visible even when already open/configured; no duplicate inner input ring |

These are group triggers, not radio choices. Avoid `aria-pressed` as a proxy for draft content. Disabled controls need a reason available to assistive technology; lack of a practical image does not disable a valid text choice.

## 3. Picker anatomy and blank behavior

The picker is a compact expanding card attached to its group, normally 360–520px wide. Its 44px header contains the short group name, overflow, and collapse control. Remove “Cue controls,” “Group settings,” and redundant introductions. Search uses one 44px recessed pill and one wrapper focus ring. Bound the active accessory height as specified in 07.

Navigation uses short text tabs on a shared baseline with a moving underline. Expand one axis at a time, including at wide widths; other axes remain reachable through compact summaries/tabs. No chip cloud or empty filler cards. One field-level custom direction editor serves related axes and remains reachable even when the field has no accepted options.

Optics groups camera and viewpoint fields; Stage groups composition and lighting; Finish groups look and mood. Obtain axis names, ordering, cardinality, and entries from the accepted registry. Current seed cardinality is small: a field with one accepted option gets one option, not a simulated carousel of repeated records.

### Option geometry

Use one 72–88px visual focus area where it helps, with art and label in separate boxes. Select the option control by cardinality: one row for one option, compact segments/rail for a few, and a searchable list of at most six visible 44px rows for many. Numeric tickers require published numeric semantics. [06 — Control table](06-Compact-Interaction-Research.md#which-control-to-use) defines the choice. Do not repeat 144px image capsules down tall columns.

A finite rail may show neighboring values, with artwork faded independently of legible text. First/last stops expose their real boundary; one or two options never acquire invented neighbors. Programmatic centering does not commit. Keep label, state marker, and image in independent layout regions so no clipping or overlap returns.

Use record-specific accepted artwork when available. Group artwork identifies a family; repeating the same lens for focal length, depth of field, and azimuth is not an acceptable depiction of those choices. Without record-specific imagery, render a compact label and a small appropriate library vector mark with the same selection geometry. Keep the practical-art criterion open. Do not use unrelated photos, clones of the industrial group object, or text claiming an asset is “available to the renderer.”

Hover/focus reveals a short meaning tooltip; a click on an explicit inspect action can expose longer cautions. Keep required choices and explanations reachable without hover. Do not leave large descriptive paragraphs in every option.

### Selection and custom text

| Action | Required result |
|---|---|
| Open an untouched field | It remains empty. No “Leave blank,” “Choose one,” empty-count badge, or default selection is introduced |
| Select a single-value option | Existing `set-axis` command commits it; keyboard highlight alone does not commit |
| Toggle a multi-value option | Existing `toggle-atom` command commits; selected marks and tray update after acknowledgement |
| Clear a selected axis | A 44px hit target containing a small X appears by that axis's selected summary; invoke `clear-axis` with `pinBlank:true`, preserving deliberate blank semantics |
| Add custom direction | One editor per `Field`, using existing `set-custom-text`; never duplicate the same camera buffer beneath both focal length and depth of field |

The custom input's placeholder is “Add custom directions, or leave blank.” It has an accessible name identifying the field. No repeated visible “Custom” label is necessary. Empty custom text needs no clear button; a nonempty field can use an X labelled “Clear custom camera direction,” etc. Its text is literal and remains separate from selected atoms. Clearing it must not clear compatible selections.

Single-value keyboard rules: arrows change highlight, Enter commits, Home/End jump, and Escape cancels uncommitted interaction before closing. Pointer click or intentional drag release commits. Ordinary list scrolling and programmatic centering do not change selections. Multi-value controls toggle explicitly. Preserve text editing/IME; Copy waits for pending acceptance. Ticker mechanics follow 07.

Preserve existing outside-click and Escape semantics, including clear-search before close. Restore focus to the opener after closing. A drag that began inside does not dismiss the picker when released outside. Shortcut-driven navigation carries its own focus destination and bypasses opener restoration. Native spotlight blur remains the desktop owner's responsibility.

## 4. Responsive layouts

Replace the old 660×364/660×620 spotlight policy with measured content sizing in [07](07-Adaptive-Cue-Contract.md). The popup normally opens near 540×64 and grows to its active accessory, within display caps. Read actual native/content bounds; do not retain a hidden full-height background or stack three large control rows.

| Usable composer/container width | Layout |
|---|---|
| 760px and above | Main composer: three 220–252×64 capsules, readable editor, joined footer |
| 560–759px | Three equal 56px-high capsules, 8px gaps, contained 48px objects |
| 352–559px | Three short 52px-high summaries when overview is open; small objects and labels, no vertical 104px cards; actions may use a second row |
| Below 352px, including high text zoom | One keyboard-accessible horizontal group strip with visible overflow affordance, automatic focus reveal, and no body horizontal scroll; editor/footer remain full width |

The popup's initial prompt row holds essential actions. Parameters, suggestions, references, and preview are mutually exclusive accessories that increase intrinsic height. At a display cap, scroll the active list/text region above a stable Copy control. The native host/fallback owns window topology; renderer components do not create windows.

Library drops from three cover columns to two below 850px and one below 560px. Tokens drops its inspector into a sheet below 900px and collapses the category rail to a single “Category” popover below 640px. These modes preserve search, inspect, Use in Cue, and Copy.

## 5. Library, detail, and Tokens

Library starts with one compact Presets/Edits segment, search, and a filter icon. Remove visible “Library,” “Reusable directions,” record-count badges, and explanatory banners. Keep result counts in an assistive status region; a visible count can appear only in a search response where it aids the user.

Cards use a 4:3 cover, 16px title area, 12px padding, and 20px radius. The cover shows an accepted example for that record. Without one, use a quiet field of material colour with a small family mark, not an oversized pretend example. Under the cover show the human title and only a differentiating phrase that adds information. Favorite is a 44px icon target at the cover corner. Card click opens detail; it never applies a preset.

Detail is a 440–520px sheet at wide widths, full-width below 640px. Its header contains the human title, a prominent “Use in Cue” button, and Close. This is the only primary action; it applies the record through the existing route and brings the resulting Cue into view. Copy sits as an icon at the top-right of the exact prompt block. There is no ambiguous adjacent “Apply / Copy” action row and no lede explaining the distinction.

Replace the raw atom-ID table with grouped direction specimens: a small group mark, human field label, and selected human values. Each specimen can inspect its meaning. Technical shorthand belongs in the prompt's Shorthand view or a source disclosure. Remove “Exact atomic breakdown,” preset-detail overlines, direction counts, and the paragraph explaining manual overrides. Keep the override behavior itself. Sources/cautions use a library chevron with appropriate expanded state; remove the OS triangle while preserving keyboard semantics.

### Tokens as a reference desk

Use three coordinated regions at wide size: a 144px unboxed category index, a flexible term grid with columns no narrower than 180px, and a 300px inspector when a term is opened. One search field spans the grid above it. Categories are ordinary short text links with one selected rail marker, not a cloud of chips. The grid uses open spacing with a subtle baseline divider between groups, rather than a stack of full-width rounded row buttons.

Each term specimen is 92–112px high, with a small 24px family mark, a 16px human label, and one useful meaning line. Shorthand appears on inspection, not alongside a duplicate raw ID. Clicking the specimen opens the inspector. Its utility actions appear consistently at the inspector's footer: “Use in Cue” and Copy beside the exact selected expansion/shorthand. Do not use a pencil icon to mean Apply. Never hide the only action behind hover.

The inspector shows the actual approved expansion, then a format control, a practical example if accepted, and a source disclosure. Summary text is not automatically the full expansion. Missing examples produce a compact empty image state only when the user opens that section. No asset IDs, taxonomy IDs, aliases counts, or implementation status messages leak into normal browsing.

Settings opens a real compact dialog using the existing shortcut state and `setShortcut` bridge. Show the current shortcut, allow a change, and show a specific collision/validation/persistence error when returned. Do not show the banner about “this slice” or the “desktop bridge.” Keep appearance dark-only. Do not invent nonfunctional settings rows. The lead owns wiring; the UI worker owns the dialog presentation.

## 6. Preview and output defaults

Preview renders the exact `CompileResult.text` for the acknowledged mode, revision, content version, and selected format. Use 15/23 sans-serif with preserved whitespace and soft section spacing, without table cell borders, a code editor skin, or fixed narrow label columns. Styling may wrap known template headings, but visible/copyable text must retain the compiler's characters and order.

Remove “Acknowledged draft,” “Prompt preview,” placeholder counts, “Selectable text,” and the Readable/Compact subtitles. Keep the accessible dialog/region name. The top line contains only the Expanded/Shorthand segment and collapse control; one Copy icon sits in the footer. Errors appear only when actionable. Rapid format or draft changes must not display a late result from another revision/mode.

For an atom with different expansion and shorthand, switching format must visibly change the text and copy the corresponding version. Fully blank or literal-only prompts may legitimately be identical; do not invent differences. Verify both Create and Edit, including Edit's BASE, REFERENCES, CHANGES, and KEEP sections.

New Create drafts receive the concrete starting output request **4:5 aspect ratio; 2K resolution target**. This is a requested prompt direction, not a claim that the offline app generates images or enforces dimensions. Show one compact joined value control, `4:5 · 2K`, with a trailing chevron. Opening it presents the actual saved output text and supported choices. The initial fixed values can be changed or cleared; a cleared draft stays blank.

Existing saved drafts, including intentionally empty output, are untouched. Edit does not silently impose a crop or output size on a source image; its existing output remains as authored, with the compact Output action when empty. The user's default example is adopted for new Create drafts. Adding structured output records, inferring an arbitrary custom output string into two chips, or migrating existing drafts is outside this reset. [Mission 0](03-Worker-Missions.md#mission-0--lead-integration) defines the bounded storage policy.

## 7. Motion and accessibility

| Interaction | Target and constraints |
|---|---|
| Mode/dock switch | Shared indicator spring 420/34, mass .8; stationary text/icon; no page-content entrance cascade |
| Group hover | Pointer-follow object only, at most 2px per axis; 120–160ms settle; no moving hitbox or canvas-wide spotlight |
| Group to picker | Matching layout identity for one decorative surface in the same LayoutGroup; 220–280ms expansion, spring around 380/34. Text fades 80–120ms and never stretches |
| Picker option settle | 160–220ms finite settle after intentional movement; no auto-spin, endless wrap, or duplicate items |
| Preview expansion | Continuous foundation growth, 220–280ms; preserve caret, scroll, and sharp text |
| Close / copy feedback | 140–180ms close followed by focus return; Copy check appears after acknowledgement and resets after 1400ms |
| Reduced motion | No pointer-follow, overshoot, slot travel, or joining blob. Instant change or opacity at most 80ms; pause motion while hidden |

A layout ID on the trigger alone is insufficient. Pair the decorative trigger/picker surface and keep semantic controls separate during the transition so only one active focus trap and one accessible control tree exist. Native spotlight expansion must obey the same rule; cross-window shared-element motion is not possible and is not required.

Use 44px minimum interactive targets, visible keyboard focus, 4.5:1 normal-text contrast, and 3:1 state indicators. Keep decorative artwork hidden from the accessibility tree when the nearby label names it. Tooltips appear on focus as well as hover; essential meaning remains reachable in the inspector. Respect reduced transparency with opaque surfaces. Do not apply opacity to a whole control to fade its art. Long labels wrap or ellipsize with full accessible text and a tooltip; no text enters the image box.

The implementation passes only after the native comparisons and motion witness in [04 — Acceptance](04-Acceptance.md). These numbers guide construction; they are not evidence of achieved quality.
