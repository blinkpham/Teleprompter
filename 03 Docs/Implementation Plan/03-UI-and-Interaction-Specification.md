# Part 03: UI, artwork, and interaction specification

Owner: Luna UI worker. Read [Start Here](</Users/blinblon/Claude/Projects/Teleprompter/03 Docs/Implementation Plan/00-Start-Here.md>) and the renderer/component contracts in [Part 01](</Users/blinblon/Claude/Projects/Teleprompter/03 Docs/Implementation Plan/01-Architecture-and-Contracts.md>) first. Use the manifest in [Part 02](</Users/blinblon/Claude/Projects/Teleprompter/03 Docs/Implementation Plan/02-Content-and-Search-Engine.md>) for content identity and copy rules.

The UI is a visual prompt library with a compact reference mode. Implement the dimensions and relationships below before adding any decorative interpretation. The useful task is finding and copying the right instruction.

## 1. Visual authority

Reference: [the user's supplied image](</var/folders/gb/zp01z3q92956vwjbn79879480000gn/T/codex-clipboard-35642560-3509-42ac-9013-bac9d972b73e.png>). The following written specification remains usable if the temporary attachment path later expires.

The reference places an almost-white application canvas inside a light gray surround. A narrow left column contains a tall rounded navigation capsule with a teal active item. The main area starts with a wide photograph, generously curved corners, white overlaid text, and a small translucent thumbnail tray. Below it, pale rounded surfaces carry dark, bold headings and quieter secondary copy. Photography supplies most of the color; the interface stays calm.

Preserve those relationships. Use the photograph and a rounded mode capsule as the strongest recognisable elements. Apply the reference's large curves to the hero, Gallery cards, and detail sheet; use smaller radii on working controls. The app window itself uses native OS treatment, so there is no fake desktop background or another giant rounded box inside the native frame.

Do not transplant the reference's travel identity, greetings, itinerary widgets, chat assistant, avatar, logout button, or destination copy. Use the Teleprompter recipes as the content. No decorative AI orb is required.

### Fixed visual decisions

| Element | Decision |
|---|---|
| Identity | Text “Teleprompter”; a small four-corner crop-frame mark, not a travel logo |
| Main palette | Near-white canvas, cool pale surfaces, restrained teal accent, dark neutral text |
| Typography | Native system sans; system monospace only for tokens and short templates |
| Large surfaces | 28–32 px corner radii; few visible dividers; no heavy card shadow |
| Image character | Turquoise photographic hero plus precise instructional preview diagrams |
| Layout rhythm | Wide image, quiet controls, repeated image-led cards; dense horizontal rows in Cheatsheet |
| Signature interaction | The prompt sheet slides from the right while the Gallery stays spatially unchanged |

## 2. Color, type, spacing, and surface tokens

Create these named custom properties in one global token file. Components use semantic variables rather than copying hex values.

| Token | Light | Dark | Use |
|---|---|---|---|
| canvas | `#FCFEFD` | `#111819` | Main app background |
| surface | `#F0F5F4` | `#1A2426` | Gallery cards and row groups |
| surface-raised | `#FFFFFF` | `#223033` | Fields, sheet, expanded areas |
| surface-hover | `#E6EFED` | `#2A393C` | Hover on neutral controls |
| rail | `#E4ECEA` | `#203033` | Mode capsule background |
| text-primary | `#142022` | `#F0F6F5` | Titles and main reading text |
| text-secondary | `#526367` | `#B7C7C8` | Summaries and explanations |
| text-muted | `#637579` | `#9AADB0` | Supporting labels; still readable |
| accent | `#0D7F88` | `#68D2D4` | Selected mode, primary action, focus |
| on-accent | `#FFFFFF` | `#102326` | Text/icons inside accent fill |
| accent-hover | `#0A6F78` | `#85DFE0` | Primary-action hover |
| accent-soft | `#DFEFEF` | `#203D41` | Token surfaces and subtle selection |
| accent-text | `#126B73` | `#A4ECEC` | Token text on accent-soft |
| border-subtle | `#DDE7E4` | `#344548` | Decorative separation |
| border-control | `#7B8E92` | `#748D92` | Boundaries that identify an input/control |
| error | `#AC3838` | `#FFB0A8` | Local failure text/icon |

Treat these as the starting specification, then correct any failing contrast pair during live visual verification. Body text and control labels need at least 4.5:1 contrast; focus indicators and meaningful graphic boundaries need at least 3:1 against adjacent colors. Decorative borders may remain softer because they carry no sole meaning.

Dark appearance changes the surface variables and diagram palette, while retaining the teal photography. Do not invert photographs. Keep the same dimensions, weights, and hierarchy across themes.

### Type hierarchy

| Role | Size / line height | Weight | Additional rule |
|---|---|---|---|
| App identity | 15 / 19 px | 700 | Two lines in wide rail; one line in compact header |
| Main mode heading | 26 / 32 px | 700 | Slightly tight tracking, around -0.02em |
| Hero title | 32 / 36 px | 700 | White; max two lines |
| Sheet title | 24 / 30 px | 700 | Wrap naturally |
| Card title | 18 / 23 px | 700 | Full title visible; no ellipsis |
| Group title | 18 / 24 px | 700 | Cheatsheet family headings |
| Body / full prompt | 14 / 21 px | 400 | System sans for sustained reading |
| Secondary summary | 13 / 19 px | 400 | Full source summary visible |
| Control label | 13 / 18 px | 600 | Copy, filters, navigation |
| Metadata label | 11 / 15 px | 600 | Category and small supporting labels |
| Token | 12 / 18 px | 500 | System monospace; wrap without changing copied characters |

Font stacks use `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, and `system-ui` before a generic sans-serif fallback. Monospace uses `ui-monospace`, `SFMono-Regular`, `Consolas`, and generic monospace. These refer to installed system fonts; do not download Apple font files.

Use spacing steps 4, 8, 12, 16, 20, 24, and 32 px. Use 8 px radius for small token surfaces, 12 px for normal buttons/fields, 20 px for preview artwork, 28 px for cards, and 32 px for the hero/sheet. The mode capsule alone uses a fully rounded radius. Shadows are reserved for the sheet and small popovers; resting Gallery cards have no shadow.

## 3. Global layout and native chrome

All dimensions refer to renderer CSS pixels. Let W be renderer viewport width and C be the actual usable main-content width after frame/rail padding. The native titlebar reserve is 44 px on macOS and 0 px with the normal Windows/Linux frame, as specified in Part 01.

The app occupies the viewport. The rail and global header remain in place. Below the header, one scroll container owns the active mode's content. The document body does not become a second scroll container. The modal sheet has its own body scroller when open.

### Wide layout: W ≥ 900

The frame has 20 px left padding, 28 px right padding, a 104 px rail column, a 24 px gap, and a flexible workspace. Therefore C = W − 176 before any maximum-width cap. Cap the workspace at 1440 px on very large windows; extra width becomes calm space to its right. Do not add a fourth Gallery column.

The rail displays identity near the top, the two-option mode capsule beneath it with 32 px separation, and Appearance at the bottom. Keep the mode capsule in a predictable place rather than vertically centering it according to the number of cards. Its outer width is 80 px, padding 4 px, and internal gap 4 px. Each mode option is 72 × 64 px, with a 22 px icon and an 11 px label below it.

The workspace header is 64 px high. The current mode heading and one short explanatory line sit on the left; search sits on the right at 320–440 px wide. Use a 24 px gap between these columns and allow the heading area to shrink before shrinking search below 260 px.

### Compact shell: W < 900

Remove the left rail column. Use 24 px side padding from W = 720–899 and 16 px below 720. Display a compact identity/Appearance row, 36 px high, followed by a 44 px control row with the horizontal mode control and flexible search separated by 12 px. The mode control occupies 216 px; search consumes the remaining space and stays at least 220 px at the normal 640 px minimum viewport.

The mode heading moves to the start of the content scroller and uses 22 / 28 px. Omit its explanatory line below 720 px. If the actual available width falls below the supported minimum due to display constraints or zoom, place search on its own following row; never shrink control text or introduce horizontal scrolling.

The horizontal mode control retains the same two buttons and accessible names. Icon and label sit side by side. It is not a second separately managed navigation component.

### Wireframes

Wide Gallery, resting state:

```text
Native titlebar / traffic lights
┌──────────┬──────────────────────────────────────────────────┐
│ Image    │ Gallery                         Search everything │
│ Director │ Reusable prompts for precise image edits.         │
│          ├──────────────────────────────────────────────────┤
│ Gallery  │ Photographic feature: actual technique            │
│ Cheatsheet│ View prompt   Copy prompt          3 thumbnails  │
│          ├──────────────────────────────────────────────────┤
│          │ All categories  Favorites                 15 shown│
│          │ [preview]       [preview]         [preview]       │
│          │ Title           Title             Title           │
│          │ Short direction Short direction   Short direction │
│          │ token / Copy    token / Copy      token / Copy    │
│Appearance│ ...remaining cards in this same scrolling area... │
└──────────┴──────────────────────────────────────────────────┘
```

Compact Gallery with detail open:

```text
Native titlebar
┌─────────────────────────────────────────────────────────────┐
│ Category                                     Favorite  Close│
│ Technique title                                             │
│ Short explanation                                           │
├─────────────────────────────────────────────────────────────┤
│ Full prompt                                                 │
│ Complete selectable prompt; vertically scrolling body        │
│ Shorthand / Copy shorthand                                  │
│ Example / relevant note / related tokens                     │
├─────────────────────────────────────────────────────────────┤
│                                                Copy prompt  │
└─────────────────────────────────────────────────────────────┘
```

These show topology, not decorative ASCII elements to recreate.

## 4. Global mode control, search, and Appearance

### Mode control

Gallery uses the Images icon; Cheatsheet uses ListFilter. A selected option has accent fill and on-accent text/icon. Unselected options use text-primary on the rail surface. Selected state remains obvious without color through its filled shape and accessible selected state.

Implement tab semantics: one tablist, tabs with `aria-selected`, and one associated active tabpanel. The selected tab is the single tab stop inside the control. Arrow Up/Down moves and activates the wide vertical tabs; Left/Right does so in compact orientation. Home/End chooses the first/last option. Keyboard arrows act only while the mode control itself has focus.

When the engine reports an effective nonempty query, show the query-only result count beside each mode label. Counts do not become a dashboard metric. With an empty or punctuation-only query, omit them. The active view separately shows its post-filter count. The search input's clear button still follows the actual raw text value.

### Search

Use a real search input with an accessible label “Search prompts and shorthand” and visible placeholder “Search prompts and shorthand”. Leading Search icon is 16 px. A clear button appears only when there is text. Show a small platform-appropriate ⌘K or Ctrl K hint only while empty and wide enough; removing the hint must not resize the input.

The input is 40 px high, surface-raised, with a 12 px radius. Focus uses a 2 px accent outline with 2 px offset. The input always stays accessible when its mode has zero results. Updating results does not steal input focus.

Honor IME composition: show the text being composed, but apply search after composition completes. Punctuation-only queries behave as empty in the engine. Announce the settled result counts through one polite live region after 250 ms without typing; the visual results update immediately. Do not announce every keystroke or animate each result card.

Esc with search focused clears a nonempty query. If already empty, Esc blurs it and focuses the active mode heading. Cmd/Ctrl+K is delivered by the native menu, closes any sheet/popover, then focuses the input and selects its existing text.

### Appearance

The rail's bottom control uses SunMoon, accessible name “Appearance”, and a visible small label in wide mode. In compact mode it is a 36 px icon button at the identity row's right edge. Use a native auto popover containing a labelled radio group: System, Light, Dark.

The popover is 240 px wide with 16 px padding and a 20 px radius. Wide position: beside the lower rail. Compact position: below the Appearance button, inset 16–24 px from the right. Tab order follows the radio group normally; Escape and outside activation dismiss the popover and return focus appropriately. Give the selected value an explicit radio indicator.

A small credits disclosure in this popover states “Photo: Komet Flicker / Pexels” and the application version. Keep source URLs in bundled asset credits for maintenance. No external link-opening capability is needed in v1.

If preferences are session-only, show a dot/error indicator on Appearance and the text “Changes are saved for this session only.” inside the popover. When a favorite first encounters this condition, its local supporting status also says “Saved for this session.” This must not be represented as durable success. Clear the indicator only after a main-process result confirms a disk save.

## 5. Gallery feature and grid

### Feature visibility and composition

Show the feature only when Gallery has no effective search query, category is All, Favorites is off, and C ≥ 640. It is supplementary access to existing techniques. Hide it in focused search/filter states and the one-column compact layout, with no empty space left behind.

Its height is 224 px for C = 960–1199, 264 px for C ≥ 1200, and 200 px for C = 640–959. Width is C; radius is 32 px. Use the bundled pool photograph with cover cropping and centered positioning. A dark teal scrim under the text maintains contrast; it is a readability treatment, not a free-standing decorative gradient.

The left content inset is 28 px. Show the category label, the actual technique title, its summary in at most two lines, and two controls: View prompt and Copy prompt. View prompt opens the same sheet as the corresponding card. Copy prompt uses that technique's source prompt. Keep controls at least 36 px high and text at least 13 px.

The three featured IDs are `surgical-edit`, `multi-reference-composite`, and `quality-restoration`, in that order. Default to surgical-edit. A small tray at the lower right contains their three 52 × 40 px preview thumbnails, 8 px gaps, and 8 px padding. It uses a dark translucent surface and 16 px radius. The selected thumbnail has a 2 px white border; accessible labels name the technique, with `aria-pressed` on the selected button.

Selecting a thumbnail changes feature title, summary, actions, and selected-thumbnail state without opening detail. The main pool photograph stays constant; no additional floating preview is needed. There is no automatic rotation, timer, autoplay, or horizontal scrolling. At C < 800, use a 26 / 30 px feature title, reduce the content inset to 20 px, and omit the supplementary summary. Put the thumbnail tray above the bottom action row at the far right; title/category text occupies only the left 60%, leaving the controls clear.

Do not paste a full prompt into the feature. This surface helps recognition and reaches the same source-backed detail as the grid.

### Gallery toolbar

Place the toolbar 24 px below the feature, or directly below the mode heading when the feature is absent. Height is at least 36 px. Left: native select labelled Category with options All categories plus the five source categories. Next: a Favorites toggle with Heart icon and visible label. Right: “N shown” in muted text.

Use 12 px gaps. At the narrowest widths allow the count to move to a second line. The controls stay visible at the top of the scroll content with a solid canvas background as the cards scroll. Do not make the large feature sticky.

### Grid geometry

Base the grid on its container width, not the outer native window width. Use a CSS container query or one shared measured-width hook, not separate inconsistent checks per card.

| Usable grid width C | Columns | Gap | Card implication |
|---|---:|---:|---|
| C ≥ 960 | 3 | 20 px | Approximately 307 px minimum card width |
| 640 ≤ C < 960 | 2 | 20 px | Approximately 310 px minimum card width |
| C < 640 | 1 | 16 px | Full-width card; preview height is capped at 180 px |

At W = 1280 with the wide shell, C = 1104 and three cards are about 355 px wide. At W = 1024, C = 848 and two cards are 414 px wide. At W = 640, C = 608 and the layout has one column. Do not accidentally produce three columns at 1024 by using an unconstrained auto-fit minimum.

The top of the grid is 16 px below the toolbar. Keep source order left-to-right and then top-to-bottom. Use a normal grid, not masonry, so keyboard and visual order agree. Cards in the same row stretch to equal height, with their footer aligned by flexible content space.

## 6. Technique cards

Each card is an article on the surface color, radius 28 px, with 12 px outer preview inset and 20 px text inset. The preview is 3:2 at multi-column widths, radius 20 px. In the single-column layout its maximum height is 180 px and the diagram scales to fit on the same neutral ground.

Below the preview place category, title, summary, then footer. The category is a plain small label, not another colored pill. Put 8 px between category and title, 6 px between title and summary, and at least 16 px before the footer. Show one canonical linked token or “Reference roles”/“Marked area” as a short preview, with the full source shorthand available in the sheet.

The footer contains the shorthand preview at left and a visible Copy prompt button at right. Give the copy button at least 112 px width so “Copied” does not change card layout. At a constrained width let the footer become two rows. Never hide copy until hover.

Favorite is a 32 × 32 px button over the preview's top-right inset with a solid raised background. Its accessible name changes from “Add [title] to favorites” to “Remove [title] from favorites”. Use a filled Heart for favored state and `aria-pressed`; color alone is insufficient. Do not add favorite support to every shorthand row.

### Click and keyboard structure

The preview/title/summary area is one explicit Open button with accessible name “Open [title]”. Favorite and Copy prompt are sibling buttons, not nested inside it. The decorative preview is not separately focusable. Clicking copy/favorite never opens the sheet.

Tab order within each card is Open, Favorite, Copy prompt. Enter/Space activates the focused control. The card's text remains readable without hovering; the full prompt in the sheet is selectable. This read-only application does not make catalog prose contenteditable.

### Card states

| State | Appearance/behavior |
|---|---|
| Rest | Pale surface, no elevation, complete visible title and summary |
| Hover on Open | Slightly darker surface or subtle outline; no image zoom, tilt, or moving shadow |
| Pressed | Surface darkens slightly; no more than 1 px local movement if used |
| Focus-visible | 2 px accent outline with 2 px offset around the focused action; no focus clipping by overflow |
| Favorite pending | Heart is optimistically filled/unfilled; that technique's favorite controls are temporarily disabled until the response |
| Copy pending/success/error | The local button states in section 10 |

When removing the last visible favorite in Favorites-only mode, let the item disappear after the preference result and move focus to the next surviving card's corresponding control, or the empty-state heading if none survives. Do not leave focus on a detached element. Outside Favorites-only mode, toggling favorite does not change list order or scroll.

## 7. Artwork that workers can reproduce

### Hero photograph

Bundle a local copy of [Turquoise Water in Pool by Komet Flicker, Pexels photo 20774773](https://www.pexels.com/photo/turquoise-water-in-pool-20774773/). The page supplies the free-download asset. The photograph is a decorative turquoise-water surface; it is not an app-generated result or a demonstration of a prompt. Pexels permits downloading and using these photos in an app under its stated license. [Pexels license](https://www.pexels.com/license/)

During UI implementation, obtain it through the provider's normal download surface, inspect it, and save an optimized local WebP with a target width of 2200 px and target size below 650 KiB. Preserve a one-record credit containing title, photographer, source URL, license URL, and retrieval date in `src/renderer/src/assets/credits.md`. No stock-photo API or runtime image URL is needed.

If that specific photograph is no longer available, use [Swimming Pool Water Reflecting Trees and Tiles, Pexels photo 20329466](https://www.pexels.com/photo/swimming-pool-water-reflecting-trees-and-tiles-20329466/) by Louis PHDC with the same treatment and updated credit. If both sources are unavailable, continue functional UI work with the fixed teal surface but report the missing photographic plate as a visual acceptance issue. Do not pay for or generate substitute assets without authorization.

The user's reference screenshot is style evidence, not a photograph to crop into the finished app.

### Preview diagrams

Create 15 local SVG instructional diagrams, one for each preview ID. These diagrams are deliberate content illustrations, not placeholders for nonexistent before/after photos. Use a consistent 600 × 400 viewBox, a pale blue-gray ground, white scene surfaces, dark teal strokes, restrained coral change markers, and minimal soft shading. Keep labels legible at a 300 px card width; do not render body text into artwork.

Every diagram shows the requested operation with a fixed camera/scene where applicable. Place a small “Diagram” label beside the preview in the detail's supporting area. Do not label a synthesized or schematic picture “Actual result”, “Before”, or “After”. The feature photograph can have empty alt text because it is decorative; instructional diagrams have short useful alt descriptions.

| Preview ID | Exact composition to draw | Change to emphasize |
|---|---|---|
| surgical-edit | A clean tabletop scene with a rectangular product and a small coral selection around one damaged corner | One highlighted corner is corrected; surrounding frame remains aligned |
| remove-one-thing | Two matching architectural panels; left contains one coral circular object, right has the same clean background with a dotted target outline | Remove one object and continue the background surface |
| multi-reference-composite | Large base-scene frame marked 1, two smaller reference frames marked 2 and 3, thin arrows entering separate highlighted aspects of the base | Explicit source roles, with no wholesale reference swap |
| style-tone-transfer | Identical simple room geometry in two panels; a three-swatch teal/coral/cream palette links the panels | Color/light changes while objects stay in the same positions |
| face-identity-transfer | Two neutral head-and-shoulder silhouettes; a small oval face region is transferred into an otherwise unchanged base silhouette | Only the face region changes; avoid a decorative celebrity portrait |
| pose-transfer | One consistent figure silhouette in two poses on the same floor line; identical head/clothing color and fixed scene edges | Body pose changes while identity and surroundings persist |
| perspective-correction | Three rectangular desks/boxes recede toward one clearly marked vanishing point; coral guides identify the corrected edge | Coherent parallel edges and shared vanishing point |
| camera-lock | A scene inside a fixed crop frame, with fixed horizon and corner brackets; a small internal object alone is highlighted | Camera/framing stay fixed during a local change |
| reframe | One unchanged subject silhouette inside nested landscape and portrait crop outlines | New boundaries and environment extension, same subject scale |
| clean-environment | Identical minimal room outlines; small coral clutter marks disappear while doors/walls/floor lines align | Fewer objects without architectural redesign |
| product-fidelity | A package reference and the same package held in a base scene; matched silhouette, label block, and color bands | Product geometry/design transfer, with no invented brand name |
| controlled-motion | One crisp primary figure with two low-opacity trails behind a moving arm/object along one short path | Readable primary anatomy and localized motion |
| quality-restoration | Same landscape/product diagram in two panels; a small region of irregular noise marks becomes clean line/detail | Restoration of existing structure without adding scene content |
| clean-commercial | Bright white/blue set, one product/figure, a broad soft-light indication, open clean shadows | Airy commercial finish and low clutter |
| markup-directed-edit | A scene with a coral guide line/selection and one object edge aligned to it; all outer scene boundaries fixed | The marked region controls placement/geometry |

Keep actual SVG text to numeric reference markers and at most two short words per diagram. At the 600 px viewBox width, use at least 24 px for labels and 4 px for meaningful strokes so they remain readable at roughly half-scale. Use HTML labels for longer explanation. The UI asset map keys exactly match the manifest IDs, and missing keys fail catalog/UI integration rather than showing a generic sparkle icon.

A dark variant may be implemented by substituting the fixed diagram palette or separate dark SVG files. Preserve white product surfaces where needed; do not darken all objects until the operation becomes unreadable. No image generation or photorealistic face work is required to finish the diagrams.

## 8. Technique detail sheet

### Geometry

Use a native modal `dialog`, opened with `showModal`, positioned at the right of the viewport. The modal background becomes inert while open. A native dialog provides the relevant modal semantics and platform focus behavior. [MDN dialog reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)

At W ≥ 720, sheet width is 480 px, capped at viewport width minus 24 px. Inset 12 px from the right and bottom, and 12 px below the native-titlebar reserve. Use radius 32 px and a restrained shadow around 0 16 px 56 px with 18% black in light mode. Backdrop is a 14% neutral-dark tint; no whole-window blur is required.

At W < 720, fill the app viewport below native titlebar reserve: width 100%, right/bottom inset 0, radius 0. The same dialog content remains mounted while resizing across 720. Use CSS to change geometry rather than replacing the dialog or clearing state.

The sheet has three regions: fixed header, flexible scrolling body, and fixed action footer. The header has 24 px padding; the body has 24 px horizontal padding; the footer has 16–20 px padding and a subtle upper divider. The body uses `min-height: 0` so its long prompt scrolls instead of pushing the footer outside the sheet.

### Content order

1. Header: category, Favorite, Close; full title and short summary below. No large image before the prompt.
2. Body opening: label “Full prompt”, followed immediately by the complete prompt in a pale reading surface with 16 px padding and 16 px radius.
3. Shorthand section: complete source template, Copy shorthand, and a useful example when supplied.
4. Supporting section: relevant preservation/reference/resolution notes, linked canonical tokens, and the small labelled diagram.
5. Footer: primary Copy prompt button, aligned right at wide sizes and full width below 720.

If the prompt contains square-bracket placeholders, show “Replace bracketed text after pasting.” directly beneath its reading surface. Do not add fields or automatically fill slots. Plain prompt text uses pre-wrap and overflow-wrap so every line is selectable and no horizontal scroll is needed.

The first body viewport must contain actual prompt text. The user should not need to expand an accordion to see the prompt. A long restoration prompt may need vertical scrolling, but its Copy prompt action stays visible throughout.

Linked tokens are individually labelled copy controls; their exact token is the payload. Show at most the real source-linked set from the catalog, in wrapping rows. Do not introduce a second modal to explain a linked token inside this sheet. The full Cheatsheet remains available after closing it.

### Opening, dismissal, and focus

Capture the triggering control before opening. After the dialog is shown, focus its title heading with a temporary negative tabindex, so assistive technology announces the technique. Tab stays within the native modal's focusable controls. The dialog itself does not need an added tabindex.

Close through its Close button, Esc, or a complete pointer down/up on the backdrop. Do not close when a text-selection drag starts inside the prompt and ends outside. When an IME composition is active, Esc belongs to composition handling first.

On ordinary dismissal, restore focus to the exact opener if it still exists. Otherwise focus the next visible card or Gallery heading. A command that intentionally moves to search or another mode skips opener restoration and focuses that requested destination after closure. Ensure an exit animation cannot later steal focus back from search.

The background list retains its width, scroll offset, filters, and query. Opening detail must not change the number of grid columns, scroll the selected card to the top, or reset the active category. An overlay is the chosen browsing-context mechanism; no docked inspector variant is needed.

## 9. Cheatsheet layout and interaction

### Page structure

Under the common header, place a small introduction: “Copy a token, or open it for the full direction.” Below it, show a native family select labelled Family and a result count. The family select offers All families plus the ten fixed families. Use the same control styling as Gallery Category.

At C ≥ 960, add a 176 px family index to the left of the reference list with a 24 px gap. This is in-page navigation, not another app-mode rail. At narrower widths omit that index and rely on the visible family select. The main list always remains one readable list, rather than newspaper columns.

With All families selected, render every matching family in fixed order. Selecting a family filters the list to that family and resets its scroller to the top. Clicking a family-index item while All is selected scrolls to that family heading without changing the filter. When a specific family is selected, the index shows that family as selected and offers an explicit “All families” action.

Index labels show query-filtered family counts and omit/disable zero-match anchors. Sticky positioning stays below the common header. Group anchors have sufficient scroll-margin so the group title is never hidden behind the sticky controls. Scrolling does not rewrite filters or queries.

### Family groups

Each group uses a surface background with radius 24 px, 20 px heading padding, and 1 px subtle dividers between rows. Give families 24 px vertical separation. A group heading has an 18 px title, a small row count, and one source-limit sentence where applicable. Avoid another pill around each token meaning.

The Render group contains its dimension examples disclosure. Camera contains its focal-length note. These do not become permanently expanded notices above unrelated groups.

### Collapsed rows

At list width ≥ 600, use a token column around 190 px, a flexible meaning column, a 104 px Copy token control, and a 32 px disclosure control. Include 12 px gaps and 16 px side padding. Allow token column width to shrink to 160 px before the meaning becomes too narrow.

Below 600 px list width, put the token and disclosure on the first line. The meaning occupies the next line, followed by Copy token aligned to the start or end of that same lower region if it fits. Rows grow naturally; do not use a fixed 48 px height that cuts off long tokens or patterns. The usual wide row is approximately 60–72 px high.

Token text is selectable. Copy token is a separate explicit button. The chevron has an accessible name “Show direction for [token]” and `aria-expanded`. Clicking the meaning also toggles disclosure through a semantic button. Neither of these targets includes the copy button as a descendant.

Long strings such as `angle:over-shoulder` wrap without inserted zero-width characters; the source token still copies exactly. The two reference patterns may need multiple token lines. The UI must not claim that a shortened preview is the actual token.

### Expanded rows

Render the complete direction below the row, inset 16–20 px, with 14 / 21 px body text. Follow it with Copy expanded direction, then an example and contextual note if present. Expanded content is immediately adjacent to its row; there is no separate Cheatsheet modal.

More than one row may stay expanded. Disclosure state is keyed by ID and preserved while changing mode or filters during the current window session. Rows excluded by a filter are hidden; their expansion preference may be retained in memory. On a new launch all rows start collapsed.

### Presets

The default action is Copy token, returning only `preset:...`. Expanded presets show their description and all component rows in source order. Each component displays its token, a short meaning, and a small copy button. Provide two clearly labelled group actions: Copy components and Copy expanded direction.

Copy components returns the canonical token line from the engine. Copy expanded direction returns the engine's full production directions plus reference-priority sentence. The UI does not assemble those strings independently. Component tokens use the corrected natural50/portrait85 forms specified in Part 02.

Keep presets in a normal group rather than converting them into colorful dashboard cards. Their extra detail supplies the teaching value.

## 10. Copy action specification

| Location / visible label | Exact payload |
|---|---|
| Gallery card, feature, sheet: Copy prompt | Technique.prompt only |
| Technique sheet: Copy shorthand | Technique.shorthandTemplate only |
| Cheatsheet token row: Copy token | Canonical ShorthandEntry.token only |
| Reference pattern row: Copy pattern | Full canonical pattern template only |
| Preset collapsed row: Copy token | Preset.token only |
| Expanded preset: Copy components | Engine componentsText only |
| Entry/preset: Copy expanded direction | Complete entry.direction or engine expandedText |
| Linked/component token button | That canonical component token only |

Use one shared CopyButton behavior, with a unique local state per mounted button. It receives an exact payload, action label, and async callback. Copy does not mutate the catalog or store text in preferences.

| State | Label/icon | Timing / behavior |
|---|---|---|
| Idle | Specific action label + Copy icon | Normal button |
| Pending | “Copying…” | Disable only this action until the promise settles; no global loading state |
| Success | “Copied” + Check icon | Show for 1400 ms after confirmed native success; keep the same width |
| Error | Button says “Retry”; nearby supporting status says “Couldn't copy” with alert icon | Preserve the button width; status may wrap below it. Remain until retry or context/payload changes; text stays selectable. |
| Repeat after success | Fresh copy, then restart confirmation timer | It is an ordinary new user copy; do not suppress it |

Capture the payload at click time. Use a request sequence to ignore an older completion after a newer request or after the button's payload changes. Clear timers on unmount. Ignore an old success when a feature switch has repurposed the same button for another technique.

Every copy control has a specific accessible name, such as “Copy prompt: Surgical edit”. A nearby polite status or one shared polite announcer confirms “Prompt copied” or “Token copied” once. Do not announce both the button label transition and a separate duplicate status. Icon-only component-copy buttons have labels naming the token.

## 11. Empty, startup, and error states

| State | Exact or intended copy | Controls / layout |
|---|---|---|
| Startup | “Opening Teleprompter…” only if initialization is visibly delayed | Show the themed shell; no marketing onboarding or artificial spinner delay |
| Search has no matches anywhere | “No matches for ‘[query]’.” / “Try a technique, token, or word from a prompt.” | Clear search; keep mode control and search visible |
| Gallery filters hide all query matches | “No techniques match these filters.” | Reset filters; if other mode has matches, show “View N Cheatsheet matches” |
| Favorites-only with no saved techniques | “Your favorites will appear here.” / “Use the heart on a technique to save it.” | Show all techniques |
| Cheatsheet selected family has no matches | “No matches in [family].” | Show all families; preserve query |
| Image load failure | Preserve layout with the diagram's pale ground and an explicit unavailable preview label | Prompt/copy remain usable; missing final assets are a visual defect to fix |
| Native copy failure | Local “Couldn't copy” and Retry | No full-page error, no fabricated success |
| Preferences session-only | “Changes are saved for this session only.” | Appearance indicator and local first affected save status; catalog remains usable |

Empty states use a small relevant icon, one heading, one sentence, and one or two actions. They are centered within a modest 240–320 px high area; avoid a giant blank dashboard illustration.

Show all techniques turns off Favorites and resets Gallery category to All while preserving search. Clear search changes only query. Reset filters clears only mode-specific filters. These labels must reflect their actual state changes.

## 12. Keyboard, focus, and accessibility

| Input | Effect |
|---|---|
| Cmd/Ctrl+K | Close overlay, focus search, select query |
| Cmd/Ctrl+1 | Gallery, same state transition as mode tab |
| Cmd/Ctrl+2 | Cheatsheet, same state transition as mode tab |
| Esc | Native popover or sheet first; otherwise clear focused search; otherwise no global reset |
| Tab / Shift+Tab | Predictable document order; remain in the modal while it is open |
| Enter / Space | Activate the focused native button/disclosure |
| Mode-control arrow keys | Move/activate only inside that tablist, respecting orientation |
| Cmd/Ctrl+C | Native copy of selected text; never intercept to copy the whole prompt unexpectedly |

Use landmarks for navigation and main content, labelled search, proper headings, and real buttons/selects/radios. Announce selected and expanded states. All interactive targets are at least 32 × 32 px, with 36–40 px preferred for frequent actions. Focus indicators must remain visible against both themes and must not be clipped by rounded preview containers.

Native window drag regions must not overlap input, cards, text-selection surfaces, tabs, or modal controls. Prevent accidental browser drag navigation from images/links; the app has no file-drop feature. Do not register unlabelled global letter shortcuts that interfere with typing.

Respect 200% zoom by allowing headers/controls to wrap, cards to become one column, and full prompt text to reflow. Forced-colors mode keeps native outlines and selected-state indicators. Avoid a fixed-height text region inside an already scrolling prompt body.

## 13. Motion and resizing

| Transition | Timing | Property / limit |
|---|---:|---|
| Neutral hover/press | 100 ms | Background/border color only |
| Mode selected state | 140 ms | Selected surface/color; no bouncing spring |
| Gallery/Cheatsheet change | 100 ms fade-in | New panel appears at its saved scroll; no sequential exit wait or slide across the window |
| Detail open | 180 ms | Translate X from 16 px to 0 plus opacity; backdrop fades |
| Detail close | 140 ms | Reverse the short movement; restore focus only after close |
| Inline disclosure | 120 ms opacity | Reveal natural-height content; avoid measuring/animating every row's height |
| Copy confirmation | 100 ms | Icon/text fade; preserve button width |
| Query/filter changes | Immediate | No card-by-card entrance animation or animated reordering |

Use one standard easing curve equivalent to `cubic-bezier(.2,.8,.2,1)`. No infinite animation, hover parallax, auto-scrolling, decorative shimmer, or animated gradients. Resizing uses immediate layout changes, not transitions on width, grid-template-columns, or font-size.

With `prefers-reduced-motion: reduce`, remove translations, panel fades, smooth scrolling, and disclosure motion. State and focus changes remain immediate. Copy still shows a static 1400 ms confirmation. Native dialog close must not wait for a nonexistent transition event; use a reduced-motion immediate path and a bounded fallback for the normal path.

Apply one themed CSS translucency treatment to the feature thumbnail tray and, optionally, the Appearance popover. If backdrop-filter is unsupported, replace it with an opaque surface of equivalent contrast. Reading surfaces and prompt text never depend on blurred content behind them.

## 14. UI completion conditions

At 1280 × 900 the visual hierarchy reads as identity/navigation, photographic feature, quiet filter row, and three real technique cards. At 1024 width the Gallery has two columns. At 640 × 600 it has one column with reachable search, mode switch, category/favorite controls, and copy. No content requires horizontal scrolling.

The detail sheet opens without changing the underlying grid, exposes real prompt text immediately, and returns focus/scroll correctly when dismissed. Cheatsheet remains denser than Gallery while full directions and preset components are easily reachable. The long restoration prompt, long reference pattern, and longest camera token remain legible in both themes.

Inspect the actual Electron UI with the reference beside it. Correct concrete differences in palette, hierarchy, spacing, rounding, typography, and control usability. Functional content and copy take priority over another round of decorative polish. The final live-app gate is in [Part 04](</Users/blinblon/Claude/Projects/Teleprompter/03 Docs/Implementation Plan/04-Execution-and-Acceptance.md>).
