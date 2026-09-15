# Adaptive Cue window: feasibility and host decision

Research input for the reset plan. Checked 2026-09-13 against Electron **44.3.0**, the installed declarations and tagged source, Apple documentation, and Tauri v2 documentation. This host reports macOS **26.4.1**. This investigation read files and documentation; it didn't open, change, or test the native app.

## Recommendation

Keep Electron for the first implementation attempt. Cue can start as a small prompt bar and grow with its content through an app-controlled window-size contract. The current 660×364 / 660×620 restriction comes from Teleprompter's two-size implementation. Its source already creates a transparent, frameless macOS panel and requests animated bounds changes. See [placement.ts](../../../src/main/placement.ts), [main window lifecycle](../../../src/main/index.ts), and [preload bridge](../../../src/preload/index.ts).

**Adaptive geometry is supported in principle; the combined material, shape, input, and motion experience still needs native proof.** Electron's macOS implementation sends `setBounds` to AppKit's animated `setFrame`; that path doesn't depend on enabling manual resizing. Its vibrancy implementation adds an `NSVisualEffectView` sized to the content bounds with behind-window blending. This makes a growing frosted panel a credible starting point, while independent glass shapes require further work. [Electron 44.3.0 native implementation](https://github.com/electron/electron/blob/v44.3.0/shell/browser/native_window_mac.mm)

If Electron fails the specific native checks below, change only the Cue popup host. Start with a small macOS bridge when the missing capability is material or geometry control; move to a Swift `NSPanel` host when focus, layering, or animation requires native ownership. Keep the main app, compiler, library, authoritative draft store, and clipboard semantics.

The supplied Codex, Raycast, and notch references establish desired behavior. This research makes no claim about their internal frameworks.

## What the APIs support, and where they stop

| Concern | Confirmed capability or limit | Consequence for Cue |
|---|---|---|
| Content-sized geometry | `setBounds` accepts size and position; macOS supports animation and a `resized` completion event. [Electron window API](https://www.electronjs.org/docs/latest/api/base-window) | Measure current content, request a bounded size, and wait for native completion where needed. |
| Transparent surfaces | Electron supports frameless transparent windows. Its guide warns about resizing, transparent-area clicks, DevTools changing transparency, and missing native macOS shadows. [Custom window styles](https://www.electronjs.org/docs/latest/tutorial/custom-window-styles) | Keep `resizable: false`; test programmatic resizing on the target host. Use a small, explicit shadow allowance. |
| Desktop blur | CSS blur affects web content, not other apps. [Custom window styles](https://www.electronjs.org/docs/latest/tutorial/custom-window-styles) Native visual-effect views support behind-window blending. [Apple visual effects](https://developer.apple.com/documentation/AppKit/NSVisualEffectView) | CSS opacity can make components translucent; actual desktop frost needs native material. |
| Independent materials | Electron 44.3.0 installs its vibrancy view across the window's content bounds. [Tagged implementation](https://github.com/electron/electron/blob/v44.3.0/shell/browser/native_window_mac.mm) | A transparent CSS gap doesn't establish a hole in the native material. Don't promise separate frosted islands from the stock `vibrancy` option. |
| Pointer regions | `setIgnoreMouseEvents` affects the whole window; `forward` preserves mouse-move delivery. `setShape` is experimental and limited to Windows/Linux. [Electron window API](https://www.electronjs.org/docs/latest/api/base-window) | CSS `pointer-events: none` alone doesn't pass clicks to another app. Avoid a large invisible host around small floating controls. |
| Focus and Spaces | Electron's macOS `panel` adds a nonactivating-panel style and spans Spaces. `setVisibleOnAllWorkspaces` offers fullscreen visibility, with documented process-type side effects. [Electron window API](https://www.electronjs.org/docs/latest/api/base-window) | Retain the working lifecycle until a focused native test justifies changing it. Keyboard entry still needs focus. |
| Accessibility | Electron exposes `nativeTheme.prefersReducedTransparency`; Apple requests opaque backgrounds when reduction is enabled. [Electron nativeTheme](https://www.electronjs.org/docs/latest/api/native-theme), [Apple transparency preference](https://developer.apple.com/documentation/appkit/nsworkspace/accessibilitydisplayshouldreducetransparency) | Offer an opaque dark material with the same geometry. Reduce Motion removes animated resizing and spring travel. |

These constraints rule out a simple oversized transparent window as the finished design. They also rule out treating a browser animation as proof that the macOS window animates correctly.

## Proposed adaptive contract

The following is a product and implementation proposal, not an API guarantee. The lead should publish its exact types once alongside the other shared contracts.

**One primary surface grows from the input.** Empty Cue shows a prompt line and essential actions. Typing wraps the editor within a readable width. Opening `/`, `@`, a parameter picker, or Preview reveals only that accessory. Only the long list or text region scrolls after the display-height cap is reached. A brief Copy success state precedes the existing popup dismissal; the draft persists. The final product contract is [07 — Adaptive Cue](07-Adaptive-Cue-Contract.md).

Use content measurement for height. Width follows content classes with minimum, preferred, and maximum widths so every keystroke doesn't move the edges. These are sizing policies, not two predetermined viewport rectangles. Start the spike with a one-line bar, a three-line draft, a six-result list, a compact parameter control, and a long preview; visual acceptance sets the final width and padding tokens.

Replace `requestSize('compact' | 'expanded')` with a bounded surface-layout request containing a monotonic layout ID, preferred width, measured intrinsic height, active accessory, and transition intent. The renderer proposes dimensions only. The main process verifies the sender and values, clamps to the current display, owns position, and returns applied bounds, available interior height, and layout ID. Existing engine command semantics and draft revision protection remain intact; [08](08-Quick-Add-and-References.md) separately adds the narrow quick-add operation.

Measure an intrinsic inner wrapper after layout and assets settle. Round to device-independent pixels; suppress unchanged sizes and tiny measurement jitter. A native resize must not make a `100vh` wrapper request another larger window. Coalesce requests while an animation runs, let the newest valid layout win, and ignore stale completions. A one-pixel deadband is a starting experiment, not a correctness guarantee.

Capture the launch anchor once per opening. Grow below it when space allows; otherwise grow upward while preserving the input's relationship to the anchor. Clamp only as much as needed near an edge. Don't continually chase the pointer or change sides as the user browses options. Re-evaluate on display changes, and report the available space to the renderer before it chooses overflow behavior.

For a future menubar mode, use the tray item's position as a separate anchor policy. Cursor mode remains the default requested behavior. Both modes use the same draft and accessory model.

### Motion and click ownership

Prototype two strategies in the later native spike: AppKit-driven animated bounds with coordinated interior motion; and a brief resize to the transition's union bounds followed by a renderer morph, then immediate shrink to the final measured bounds. The latter is acceptable only if its temporary transparent regions pass the click tests. A permanently oversized host is rejected.

Start with 160–220 ms expansion and 120–180 ms contraction as design hypotheses. The visual owner sets final timing after native observation. Avoid separate CSS and native springs fighting over the same edge. Don't scale editable text to simulate layout; preserve its caret, selection, and baseline. If precise duration control is needed, AppKit exposes `animationResizeTime` for animated frame changes; Electron's public bounds call only exposes an animation flag. [Apple frame animation](https://developer.apple.com/documentation/appkit/nswindow/setframe(_:display:animate:)), [Electron window API](https://www.electronjs.org/docs/latest/api/base-window)

The visible surface plus a small documented shadow gutter defines the intended pointer footprint. Test whole-window ignore toggling over transparent gutters as a candidate, including moving back into a control, drag-out, trackpad scrolling, and clicking before the next mouse-move event. Treat it as a race-prone mechanism until observed. Native view `hitTest` alone also doesn't establish cross-application click-through; a native fallback must demonstrate the same behavior.

Initially keep suggestions and pickers inside the primary host's measured bounds. If genuinely detached islands become necessary, investigate a small number of tightly bounded auxiliary windows with one focus/dismissal owner. That option adds lifecycle work and needs separate acceptance.

## Native fallback and notch boundaries

| Route | When it earns its cost | Work and limits |
|---|---|---|
| Electron + narrow native bridge | Geometry and typing pass; a shaped material or animation control remains missing | Electron exposes an `NSView*` handle on macOS. A bridge can access the containing native window, but ownership and teardown need explicit design. Native modules add Electron-version/architecture build work. [Window handle](https://www.electronjs.org/docs/latest/api/base-window), [Native modules](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules) |
| Swift `NSPanel` + `WKWebView` popup | Panel lifecycle needs native control and the existing renderer remains reusable | `NSPanel` provides auxiliary-window behavior; its nonactivating style avoids activating the owning app. `WKWebView` hosts local HTML/CSS/JS. The preload bridge needs a typed local adapter. [NSPanel](https://developer.apple.com/documentation/appkit/nspanel), [Nonactivating panel](https://developer.apple.com/documentation/appkit/nswindow/stylemask-swift.struct/nonactivatingpanel), [WKWebView](https://developer.apple.com/documentation/webkit/wkwebview) |
| Swift `NSPanel` + native Cue view | Reusing the web view fails the material, text-input, or animation checks | Keep the engine and store behind a local command/snapshot adapter; implement only the popup UI in AppKit/SwiftUI. This is the larger fallback, not an automatic whole-app rewrite. |
| Tauri migration | Only after a separate product decision to change the whole host | Tauri v2 documents that macOS window transparency needs its private-API flag, with an App Store limitation. It doesn't eliminate this task's native integration questions. [Tauri configuration](https://v2.tauri.app/reference/config/#transparent) |

On macOS 26+, `NSGlassEffectView` supplies native glass and `NSGlassEffectContainerView` combines nearby compatible glass views. Apple places content inside each glass view's `contentView`; an arbitrary glass sibling behind the renderer doesn't receive the same documented guarantees. These APIs offer a real path to merging native surfaces, but they're distinct from Electron's existing vibrancy. Gate them by OS availability and keep `NSVisualEffectView` or opaque material for older systems. [Glass view](https://developer.apple.com/documentation/appkit/nsglasseffectview), [Glass container](https://developer.apple.com/documentation/appkit/nsglasseffectcontainerview), [Apple AppKit implementation guidance](https://developer.apple.com/videos/play/wwdc2025/310/)

Don't treat `WKWebView.underPageBackgroundColor = .clear` as proof of full transparent web-view compositing: Apple's public property describes the background visible beyond page bounds. The reuse spike must verify transparency through the actual document and glass composition on supported systems. Avoid making a private WebKit key the assumed foundation. [Apple property scope](https://developer.apple.com/documentation/webkit/wkwebview/underpagebackgroundcolor)

Borrow the notch apps' expansion rhythm and compact silhouette without requiring the notch. Apple's `NSScreen.safeAreaInsets` (macOS 12+) and auxiliary top-left/right areas describe usable pixels around camera housing. `visibleFrame` excludes the menu bar, Dock, and camera-housing strip and should be read fresh. These are geometry APIs; they don't provide a general macOS Dynamic Island component. [Safe area](https://developer.apple.com/documentation/appkit/nsscreen/safeareainsets), [Auxiliary area](https://developer.apple.com/documentation/appkit/nsscreen/auxiliarytopleftarea-uglc), [Visible frame](https://developer.apple.com/documentation/appkit/nsscreen/visibleframe)

A notch-attached mode should remain a separate optional experiment. Give non-notched Macs and external displays the cursor or menubar surface. Keep text and actions below the unobscured boundary, handle auto-hidden menu bars, and never infer camera-housing width from a hard-coded laptop model.

## Bounded feasibility spike and decision gate

Run this only in the later implementation phase, in an isolated test window with a disposable draft. The desktop owner supplies the host; the UI owner supplies five content states. The lead records the decision. No dependency install, prototype, or native interaction was performed for this research.

1. **Fit and continuity:** exercise bar → wrapped draft → `/` or `@` list → compact parameter picker → preview → bar. Observe at least 20 repeated cycles with DevTools closed. Pass with stable caret/selection, no stale size, no exposed rectangular background, no shadow trail, and no content clipping during or after transitions.
2. **Pointer and keyboard:** place a harmless target app behind the panel. Click every transparent gutter and outside edge; enter and exit controls quickly; drag a scrubber beyond its bounds; test Escape, shortcut reopening, blur, text selection, and IME composition. Pass only if the intended recipient receives input once and the current draft survives.
3. **Displays and Spaces:** test near each screen edge, fullscreen apps, Space changes, menu-bar auto-hide, and mixed-scale displays when available. Missing physical hardware remains unverified. Check bounds after every transition and keep the input visible.
4. **Material and motion:** compare dark/light busy backdrops, reduced transparency, reduced motion, and a long result list. Pass with legible text, predictable scroll regions, immediate typing response, and recorded evidence of smooth native movement on the host.
5. **Choose once:** accept Electron when the required states pass. If stock vibrancy reveals a rectangular slab, try a shaped native-material bridge. If geometry/input/focus still fails after one targeted repair and retest, move the popup to `NSPanel`. If `WKWebView` compositing fails, use a native popup view. Stop each failed route with a recorded reproduction; don't expand into a full application rewrite to hide a popup defect.

The shipped implementation must retain one authoritative local draft store, deterministic compiler output, revision-checked commands, and explicit Copy. A fallback host may change the presentation transport; it must not introduce runtime model calls, uploads, automatic paste, or a second independent draft.
