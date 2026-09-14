# Adaptive Cue — surface, viewport, and compact selector contract

Status: new implementation scope from the user's follow-up, 2026-09-13. This replaces the earlier reset's requirement to retain two fixed spotlight rectangles and its default three tall selector columns. Existing native results remain regression baselines; they do not prove this new host behavior.

## Product behavior

Cue opens as a small prompt bar beside the launch cursor. It grows only for the editor's contents or one active accessory: parameters, quick-add results, references, or preview. Closing that accessory returns to the measured editor size. There is no page background, empty fixed-height canvas, titlebar-sized spacer, or separate giant modal behind it.

The [supplied fluid composer](../References/01-Fluid-Composer.png) establishes the compact pill, translucent material, and small circular utility controls. The user's Codex-menubar, Raycast, and notch analogies establish the desired continuity and restraint; a still reference does not establish those products' implementation or animation timings.

The initial route is Electron with a measured layout contract. Native material, transparent gaps, and focus receive the bounded spike in [05 — Host research](05-Adaptive-Window-Research.md). If it fails, replace only the popup host through the documented native bridge/NSPanel route. Keep the main app and its local engine/store. A whole-app rewrite or Tauri migration is not the first response to a window-shape problem.

## Surface states and budgets

The following are construction targets and caps, not rigid viewport sizes. Actual height follows content. Usable width/height is clamped to the current display's available area and the accessibility/text-size needs.

| State | Visible content | Starting width and height budget |
|---|---|---|
| Quick bar | Compact mode control, one-line WHAT input, Parameters control, Copy; tooltips name icon actions | Preferred width 540, minimum 360 where the display permits, maximum 640; approximately 64 high |
| Writing | Same editor, growing to its content; no entrance animation on each character | Same width; 1–4 lines, normally 64–144 high, then editor scroll |
| Parameters overview | Three short Optics/Stage/Finish summaries beneath the editor | One 52px row plus 8px gap; no automatic full picker |
| Active parameter | One expanded group card, one active axis, compact choice control | Desired accessory height 160–280; total surface normally ≤420 |
| `/` or `@` results | Query stays at the caret; at most six results with optional 28px thumbnails | List width 300–420; rows 44 high; accessory maximum 296 including padding/header |
| Preview | Exact compiler text, format switch, one Copy control | Width 540–680; text region grows to a cap; total height ≤min(560, available height minus margins) |

At widths too narrow for comfortable inline actions, keep Copy at the trailing edge, collapse mode and secondary actions into a single menu, and allow the editor to take the next line. A 44px target stays 44px. The application may choose a different preferred width when opening Preview, but should not resize horizontally on each keystroke or result-label change.

Copy remains a single primary action in every state. After native acknowledgement, show its brief check then retain the current popup-dismissal behavior; the draft persists. Parameters toggles the overview, and clicking a group expands that card. Collapse controls return to the previous state without clearing fields. The user can invoke `/` directly. Main-window Cue and the popup share data/commands, with a smaller popup resting state.

The main-window composer also becomes denser: group capsules are normally 64px high with 72×56 object boxes; reserve its larger whitespace for writing and preview. A detailed visual inspection can enlarge an accepted example on demand. It is not the default for every axis.

## Compact parameter card

Replace a full-screen group dialog with an anchored expanding card. In the popup it grows within the same primary surface; in the main window it expands under the active group row. Its outline visually belongs to its trigger. It has a short group title, Back/Collapse, and overflow; no generic “Group settings” header.

At rest, each 52px group summary uses a 40px transparent object, a 14px name, and a configured check. The three summaries share available width with 8px gaps. When one expands, the other two remain compact, reachable sibling tabs; they do not each acquire their own expanded panel.

Within the card, use a 36px text axis strip, one optional 72–88px visual focus area, the selected control from [06 — Pattern decision table](06-Compact-Interaction-Research.md#which-control-to-use), and one 44px field-level custom editor when requested. Custom directions may collapse behind an “Add direction” row while empty. Its expanded placeholder remains “Add custom directions, or leave blank.” Clearing a populated axis still preserves intentional blank semantics.

Only the active axis is expanded. Other axes show a compact human value or an empty state without a count. Six rows is a ceiling: subtract header, tabs, and controls from the available card height and show fewer rows when needed. An opened custom editor replaces the decorative focus area if both would exceed the budget. Long lists scroll; they do not grow the panel to fit every item. Search covers all accepted choices in the group and identifies the axis. Selecting a result switches that axis and commits its command.

### Ticker and rail mechanics

For discrete cues such as the currently accepted focal records, show labelled finite stops with a fixed centre marker. Dragging changes the highlighted stop; release commits once through the engine. Direct click and Enter commit. Arrow keys move highlight; Escape cancels an uncommitted drag/highlight and leaves the prior acknowledged value. No intermediate unknown focal lengths are emitted.

For a future genuinely numeric axis, the shared control descriptor must first define units, minimum, maximum, step, formatter, and command mapping. Then a small numeric value can be scrubbed horizontally, with a direct text-entry alternative. Camera-style ticks give feedback; they do not establish missing semantics. Do not add exposure/strength/aperture controls solely to fill the design.

Pointer capture belongs to the control after drag activation. Use a small movement threshold before treating a click as drag; retain click on a value. Vertical trackpad scrolling in a result list scrolls that list and does not change a numeric value merely because the cursor crosses a ruler. Handle pointer cancel, lost capture, focus loss, hide, and unmount. Stop inertia at the actual bounds. Multi-select always uses explicit toggles rather than an exclusive ruler.

## Transparent components and native footprint

Set the spotlight document/root background to clear. Visible material belongs to the actual capsule/card/action shapes; do not put a full-viewport charcoal block behind them. Keep typography opaque and readable, and reserve an opaque fallback for Reduced Transparency or unsuitable backdrops.

Start the host spike with a connected capsule, then test the reference's detached utility circles. Stock Electron can display translucent CSS shapes, but stock vibrancy covers the native content rectangle. Independent native frost therefore needs a demonstrated shaped-material solution or a small number of tightly bounded native surfaces. A CSS transparent region alone does not establish desktop click-through. These constraints are documented in [05 — Native research](05-Adaptive-Window-Research.md#what-the-apis-support-and-where-they-stop).

The intended interaction footprint is the visible surface plus a documented shadow gutter of at most 6px. There must be no large invisible rectangle catching clicks. A gap between detached components should send input to the underlying app. If the stock route cannot do this reliably, use the native fallback for those shapes; do not accept a click-stealing workaround or silently present a rectangular frosted slab as complete.

Keep one owner for focus, dismissal, and visibility even if the fallback uses multiple native windows. Moving focus into a related accessory must not trigger the primary window's outside-dismissal path. Closing the group closes its accessories; hiding Cue cancels pending layout work and hides every owned surface.

## Lead-owned adaptive layout protocol

Retire `requestSize('compact' | 'expanded')` from the new popup path. Publish a typed `requestSurfaceLayout` contract; final names belong in `src/shared/`, not duplicated UI/main declarations.

| Request field | Purpose |
|---|---|
| `surfaceSessionId` and increasing `layoutId` | Reject requests/completions from an old opening or older layout |
| `preferredWidth` and `intrinsicHeight` in DIP | Measured content request, always finite and bounded |
| `accessory` | One of none/parameters/suggestions/references/preview; helps apply the correct cap |
| `transition` | Immediate/expand/collapse; an intent, not arbitrary renderer animation code |

The main process validates the registered renderer and request; owns screen choice, anchor, position, size caps, and native timing; and returns the applied bounds, interior size, constrained dimensions, session ID, and layout ID. The renderer receives the available interior height and scrolls the appropriate region when constrained. It cannot provide arbitrary screen coordinates or create windows.

Measure the intrinsic content wrapper, not a `100vh` ancestor and not the animated transform bounds. Use explicit image dimensions so late image decoding does not unexpectedly grow the host. Round consistently to DIP. Suppress unchanged values and approximately 1px jitter. Coalesce rapid updates and reject stale completions. A display resize may reduce the cap; content reflow must converge rather than feed a resize loop.

Capture the cursor anchor once when opening. Choose growth direction using available space; retain that direction until closing unless a display change makes it impossible. Keep the input edge stable near screen boundaries, expanding upward when required. Width changes preserve the bar's chosen alignment. Never chase the live pointer while typing, dragging, or scrolling.

A menu-bar entry can reuse the same surface with a tray-item anchor. A literal notch-attached mode remains optional; borrow its morphing behavior now without requiring special hardware or covering system menu items. Native safe-area handling and non-notched fallback are specified in the research file.

## Animation and interruption

Use one native/renderer coordinator. Start with 160–220ms expansion and 120–160ms collapse. Show keyboard focus and accept input immediately; animation must not create a delay before typing. Keep the editable text mounted and unscaled. A small opacity/position change may accompany the surface, but do not stagger individual rows or characters.

Two host strategies are candidates for the spike: animate native bounds and adapt the inner content, or briefly allocate the old/new union rectangle, morph the visible shape inside it, then shrink to the final size. The latter must pass the temporary-footprint tests. No permanent giant host. Motion's automatic layout animation cannot be the sole plan during horizontal native resizing; [06 — Motion findings](06-Compact-Interaction-Research.md#motion-that-helps-this-layout) explains the limitation.

If a new state arrives while resizing, the latest valid state wins. Escape/copy/hide invalidates unfinished layout requests. A resize completion cannot reopen a hidden panel, return focus to a destroyed control, or display stale suggestion results. During drag, keep a stable coordinate frame or rebase from the current anchor explicitly; do not turn window motion into a changed parameter value.

Reduced Motion uses immediate native bounds and instant or ≤80ms content fade. Reduced Transparency uses opaque dark material. These paths retain the same layout and selection behavior.

## Implementation mission and acceptance

Assign one desktop owner to `src/main/`, `src/preload/`, and related placement/layout tests. The lead owns published shared types; the existing UI owner supplies measured wrappers and visual states. They are not alone in the codebase and must coordinate dirty main/preload changes before editing. The asset lane remains separate.

Run the isolated host spike before committing to a native addon or new popup host. Its five fixtures are a one-line bar, wrapped draft, six-result list, compact parameter card, and long preview. Capture native expansion/collapse, actual applied bounds, pointer behavior, caret/IME stability, screen-edge clamping, Reduced Motion, and Reduced Transparency. Keep DevTools closed for final transparency captures.

If stock Electron passes, integrate its measured contract. If it fails a native requirement after one targeted repair, follow the narrow fallback decision in 05. No fallback may create another authoritative draft store or change compiler meaning. Native transport adapters need the same sender, revision, and local-only boundaries as Electron's existing bridge.

The updated cases N20–N25 in [04 — Acceptance](04-Acceptance.md) are required before adaptive Cue can be marked complete.
