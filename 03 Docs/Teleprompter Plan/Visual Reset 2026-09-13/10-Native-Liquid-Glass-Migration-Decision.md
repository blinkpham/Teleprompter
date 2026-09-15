# Teleprompter — native Liquid Glass migration decision

Date: 2026-09-15. Status: architecture decision; native shell spike implemented locally, runtime acceptance remains open.

## Decision

Teleprompter's target architecture is a native macOS application built with SwiftUI content hosted by AppKit. Electron remains compatibility evidence and a temporary behavioral reference; it is no longer the target host for the product's Cue, Library, Tokens, or native popup experience.

This decision changes the host direction only. It does not claim that a SwiftUI/AppKit target, a native bridge, Liquid Glass surfaces, or native acceptance have been implemented.

### Host split

| Boundary | Native decision | Responsibility |
|---|---|---|
| Application and main window | AppKit application lifecycle and `NSWindow` ownership, with SwiftUI content hosted through `NSHostingView` | Activation, menu commands, persistence lifecycle, window restoration, accessibility, and the main Teleprompter surface |
| Cue popup | AppKit `NSPanel` shell, using a nonactivating panel policy where compatible with text entry | Cursor/display anchoring, Spaces and window level, outside dismissal, keyboard focus, owned-modal chooser state, measured bounds, and hide/reopen cancellation |
| Product surfaces | SwiftUI `Cue`, `Library`, and `Tokens` views | Draft projection, editor state, selectors, preview presentation, `/` and `@` interaction, VoiceOver labels, and reduced-motion behavior |
| Liquid Glass | SwiftUI `glassEffect`/`GlassEffectContainer` for content-owned shapes; AppKit `NSGlassEffectView`/`NSGlassEffectContainerView` only where the native host boundary needs an AppKit-owned glass surface | Shape, grouping, tint, and adaptive material. Content must be placed inside the glass view's documented content boundary; no full-window glass slab |
| Compatibility host | Existing Electron app and bridge | Regression comparison, contract compatibility, and evidence for behavior that the native host has not yet reproduced. It cannot close native acceptance |

The default native route is one AppKit-owned panel with one SwiftUI content tree. Separate native accessory windows are a later exception that requires a new focus and dismissal proof. The panel must not be an oversized transparent click catcher.

## Minimum platform and SDK assumptions

The first native target assumes:

- macOS 26.0 or later at runtime for the Liquid Glass path.
- Xcode 26 or later with the macOS 26 SDK is the preferred native build environment. The current host has Swift 6.3.2 and the macOS 26.5 Command Line Tools SDK; `swift build` is available, while full Xcode and `xcodebuild` are not installed.
- SwiftUI and AppKit available in the same application target; no web view is required for the first native surface.
- A macOS 26 build/runtime witness on a real host before any claim about material, focus, animated bounds, or display placement.

The native MVP has no backward-compatibility promise for macOS versions before 26. If an older deployment target is later required, every Liquid Glass use must be availability-gated and fall back to the same opaque dark geometry; that work is outside this decision and must not be inferred from the Electron build.

Apple's macOS 26 release notes identify the macOS 26 SDK and Xcode 26 as the development baseline. Apple's AppKit guidance describes Liquid Glass as a top-level material, recommends `NSGlassEffectView` with its `contentView`, and recommends `NSGlassEffectContainerView` for nearby glass elements. SwiftUI documents `glassEffect` and `GlassEffectContainer` for the equivalent content-owned route. These sources establish API availability and usage direction, not Teleprompter behavior.

## B01–B05 native acceptance criteria

The existing five grievances remain open blockers. Native acceptance requires fresh captures and a direct runtime witness for each row; Electron screenshots, browser previews, unit tests, and API presence are supporting evidence only.

| Blocker | Native acceptance criterion | Required witness |
|---|---|---|
| **B01 — Group identity** | In the main Cue and native popup, Optics, Stage, and Finish are image-led horizontal capsules with one clear outer boundary, one contained object region, and a dominant human group name. Configured, open, hover, pressed, keyboard-focus, and empty states are visibly distinct. No square wells, generic framed buttons, raw IDs, or clipped silhouettes. | macOS 26 screenshots at wide and narrow supported widths plus live keyboard-focus/open-state observation. Record native window and content bounds. |
| **B02 — Oversized/repeated Optics art** | The native Optics picker uses the family object only for group identity. Focal length, depth, and viewpoint do not reuse one lens image as three false depictions. Each option has a separate label region, accepted finite choices, and a full visible object or honest compact text/vector fallback. Only one axis expands at a time. | Native picker inspection with long labels, one-/two-option axes, many options, and constrained height. Record whether scroll stays inside the list and whether the visual focus area remains singular. |
| **B03 — Double search focus** | Search has one intentional visible focus indicator across typing, no-results, clear, Escape, picker morph, and popup reopen. Focus ownership remains with the intended SwiftUI control; the AppKit panel does not add a competing ring. | Physical keyboard or equivalent direct native input, accessibility tree inspection, and a short focus-transition recording or timestamped witness. |
| **B04 — Synthesized preview** | Preview displays the exact `CompiledDraftPreview` returned by the authoritative compiler for the same draft ID, revision, format, and content version used by Copy. Create and Edit preserve their different compiler structures. Library and Tokens read exact record text through the shared resolver. A stale request cannot replace a newer result. | Native Create and Edit previews with expanded/shorthand changes, rapid format/mode changes, and clipboard read-back compared byte-for-byte with the preview result. |
| **B05 — Decorative output/default settings** | A genuinely new Create draft receives `4:5 aspect ratio; 2K resolution target` once through persisted `customText.output`. Existing blank/custom drafts, Edit, reset, recovery, explicit clear, and reload preserve their own values. The native settings surface edits the real shortcut seam and reports rejected persistence/registration without claiming success. | Fresh native profile plus reload, existing fixture drafts, explicit clear, and disposable shortcut success/error fixtures. Record the actual preferences path and persistence status. |

These criteria extend the existing N01–N30 matrix. They do not close any N case by themselves.

## Native lifecycle, panel, input, and focus boundaries

### Panel and geometry

The native panel captures its launch anchor once per opening. The AppKit owner selects the display, chooses growth direction, clamps to the display's usable frame, and keeps the input edge stable while the surface expands. SwiftUI reports measured content and accessory state; it does not provide arbitrary screen coordinates or create windows.

The native layout request preserves the existing shared fields and meaning:

```text
surfaceSessionId
layoutId
preferredWidth
intrinsicHeight
accessory = none | parameters | suggestions | references | preview
transition = immediate | expand | collapse
```

The native result returns applied bounds, interior size, constrained dimensions, session ID, and layout ID. The host rejects an old session or layout, coalesces newer requests, and cancels pending work when Cue hides, loses ownership, or is destroyed. A native resize completion cannot reopen a hidden panel or restore focus to a destroyed control.

The visual footprint is the visible capsule/card/action surface plus a documented shadow gutter of at most 6 DIP. Transparent gaps must not catch clicks. If AppKit cannot prove that behavior for the chosen panel configuration, the design must use fewer connected surfaces or a bounded native hit-test route; it must not keep a large invisible window as a workaround.

### Input and focus

AppKit owns panel activation, key-window/key-view routing, outside dismissal, Escape, global shortcut delivery, and the owned file chooser lifecycle. SwiftUI owns the editor selection, caret, IME composition, listbox active result, and control-level focus state.

The native coordinator must:

- keep the editor mounted and usable during bounds animation;
- preserve draft text and selection when a picker, `/`, `@`, preview, or chooser opens;
- keep the chooser from being mistaken for an outside click;
- return focus to the same `@` context after chooser cancellation;
- buffer or rebase typing while an atomic quick-add acknowledgement is in flight;
- invalidate old suggestion, preview, and layout requests on mode change, hide, conflict, or content-version change;
- send one accepted command and one Undo entry for a compound quick-add operation.

Native focus evidence must include the actual input method used. A menu item or a registered shortcut alone is not proof of keyboard delivery. A browser focus ring or an accessibility tree without visible native behavior is not proof of B03.

### Material and accessibility fallback

Liquid Glass is restricted to top-level functional surfaces: the Cue capsule, active compact card, primary actions, and tightly grouped adjacent controls. It is not a page background, a decorative wrapper around every row, or a substitute for hierarchy.

When `accessibilityDisplayShouldReduceTransparency` is enabled, the native host uses an opaque dark material with the same bounds, padding, contrast, hit targets, and focus behavior. When Reduce Motion is enabled, native bounds changes are immediate and content fades are instant or no longer than 80 ms. Neither setting changes compiler output or selection semantics.

If a Liquid Glass API is unavailable or fails a direct runtime check, the fallback is an opaque dark AppKit/SwiftUI surface. A CSS/WebView transparency result, an Electron vibrancy option, or a rendered mockup cannot be used as evidence for native Liquid Glass.

## Bridge to the existing offline store and compiler

The native layer does not create a second draft store or reimplement compiler semantics. `src/shared/teleprompter.ts` remains the contract vocabulary and validation source for the local runtime adapter. A native Swift adapter may initially call a bundled local helper containing the existing TypeScript store/compiler, but that helper must be local, offline, revision-checked, and replaceable without changing the SwiftUI surface contract. The transport is an implementation detail; the records and results below are the product boundary.

| Native adapter operation | Existing contract | Required behavior |
|---|---|---|
| Bootstrap | `TeleprompterBootstrap` | Load the accepted library projection, both independent drafts, shortcut state, platform identity, app version, and persistence status. Preserve the Teleprompter visible name. |
| Draft mutation | `DraftCommandEnvelope` → `CommandResult` | Validate client identity, field revisions, content version, command semantics, idempotency, conflicts, and one-step Undo exactly as the current store does. `accept-quick-add` remains a compound operation. |
| Draft events | `DraftChangedEvent` | Push authoritative snapshots to all native surfaces after accepted mutations; never open suggestions or overwrite local text merely because a remote event arrived. |
| Exact preview | `PreviewRequest` → `CompiledDraftPreview` | Read-only compile through the same `compileCreate`/`compileEdit` semantics used by Copy. Match draft ID, revision, format, and library content version; reject stale results. |
| Native copy | `CopyCompiledDraftRequest` → `CopyResult` | Compile first, write only after validation, return the acknowledged format/revision, and let native acceptance read back the clipboard. No automatic paste. |
| Library/Tokens text | `LibraryCopyTextRequest` → `LibraryTextResult` or `CopyResult` | Resolve exact accepted record text, including original-source handling where declared; never assemble summary labels in SwiftUI. |
| Reference bindings | `ReferenceBindingsRequest`, `ReferenceBindingEnvelope`, chooser and opaque thumbnail requests | Keep role metadata separate from local presentation bindings. Preserve Image N numbers, never send raw paths into compiled text, and keep chooser cancellation/failure bounded. |
| Adaptive surface | `SurfaceLayoutRequest` → `SurfaceLayoutResult` | Retain session/layout monotonicity, accessory caps, applied native bounds, interior size, and constrained-state reporting. The native host owns screen coordinates. |
| Settings and persistence | existing shortcut/persistence results | Return registered/unregistered and disk/session/recovery states honestly. A failed write or shortcut registration is never rendered as saved. |

The adapter must preserve the existing local-only constraints: no model calls, network requests, uploads, accounts, or automatic paste. Any native IPC must validate message shape and sender/session identity at the boundary, and must not expose filesystem access to the SwiftUI content view.

The canonical user-data location remains the existing project path required by the working contract, including the established preferences file and related local stores. The current source explicitly selects the Teleprompter user-data directory. The native handover gate is inventory, backup, compatible restore, and exclusive writing; do not silently move or duplicate user data. Resolve it with a separately witnessed migration decision before the native runtime writes real data.

## Content and naming boundaries

- The product is named **Teleprompter** in the native app, menus, panel titles, settings, and user-facing copy. Historical identifiers may remain as compatibility keys only when a migration requires them; they must never appear in user-facing text or new filenames.
- The accepted runtime boundary remains exactly 14 records, including the accepted atom set. The 101 legacy rows remain reference-only until a curator decision changes their status. Adapter candidates, screenshots, or proposed packets do not promote records.
- Practical artwork remains blocked until a route explicitly selects or reports the exact model `gpt-image-2.5-flare`. Generic image-generation availability is not evidence of that gate.
- Curator acceptance precedes Illustration work: only the six curator-accepted `AssetRequest` records may reach illustration, and no generated artwork is activated from a proposed batch.
- The native host may render existing accepted v2 group identity assets, but artwork coverage, model identity, and visual acceptance remain separate records.

## Bounded migration sequence and evidence gates

Each stage is a stop/go gate. A passing local build or browser preview never closes the corresponding native gate.

1. **Freeze the contract and data boundary.** Publish the native adapter mapping above, confirm the 14-record library projection, confirm the canonical data path, and assign ownership of any new Swift/Xcode paths. Gate: no duplicate compiler/store contract and no unresolved data-path decision. Blocker: current Electron path mismatch until resolved.
2. **Build the native shell spike.** The bounded target now lives at `native/TeleprompterNative/` with AppKit lifecycle, one `NSPanel`, one SwiftUI content view, a native editor, one Optics → Focal surface, Liquid Glass availability, and an opaque fallback. Gate: `swift build -c debug` succeeds with the installed macOS 26 SDK and the built executable launches on the real macOS 26 host. Full `xcodebuild` remains a separate tooling limitation, not the only acceptable build gate.
3. **Prove the panel boundary.** Exercise quick bar, wrapped text, six-result list, compact parameter card, long preview, hide/reopen, Escape, outside dismissal, IME, chooser cancellation, Reduced Motion, Reduced Transparency, and two pointer locations. Gate: fresh native evidence for actual bounds, focus, hit footprint, and cancellation; no rectangular glass slab or stale resize. Blocker: any failed click-through, text-input, or lifecycle case sends the route back to a smaller connected surface or a targeted AppKit repair.
4. **Connect the authoritative runtime.** Wire bootstrap, draft commands, snapshots, exact preview, copy, library text, references, and settings through the local adapter. Gate: native preview and clipboard read-back agree with the existing compiler for Create and Edit; quick-add is atomic and stale-safe; persistence status is observable. Blocker: any second store, stale result, raw-path exposure, or compiler divergence.
5. **Implement B01–B03 and Liquid Glass.** Apply SwiftUI/AppKit material only to the accepted functional shapes, then prove the opaque accessibility fallback. Gate: fresh native B01–B03 captures and direct focus/material witnesses at macOS 26. Blocker: API availability without visual/runtime proof, double focus, repeated artwork, or invisible hit regions.
6. **Implement B04–B05 and native settings.** Consume the exact preview/default/settings seams without changing compiler meaning. Gate: new-only default, existing blank/custom recovery, explicit clear, shortcut success/error, and clipboard read-back all pass in disposable native fixtures. Blocker: synthesized preview, default leakage into recovery/Edit, or false saved state.
7. **Finish Library, Tokens, references, and acceptance.** Run the relevant N10–N16 and N26–N30 cases, then the full B01–B05 comparison. Gate: lead reviews fresh native evidence and records pass/fail/partial/unwitnessed/blocked separately. Blocker: any user-reported mismatch, unavailable physical coverage, or unverified VoiceOver/input path remains open.
8. **Retain Electron as compatibility evidence.** Run Electron only to compare contract outputs and preserve the existing offline behavior while the native target is built. Gate: no Electron result is copied into the native acceptance ledger, and no Electron-only implementation decision reopens the target architecture without a new decision record.

Installer packaging, signing, distribution, Windows/Linux support, Tauri migration, a notch-only mode, practical illustration, and corpus expansion are outside this bounded migration.

## Explicit open blockers

1. The native SwiftUI/AppKit target builds from `native/TeleprompterNative/`, and the packaged app has direct AX evidence; formal Liquid Glass material/runtime acceptance remains open.
2. Native data handover still needs inventory, backup, compatible restore, and exclusive-writer evidence before real user-data writes.
3. The versioned local adapter and helper lifecycle are implemented and smoke-tested; native compiler/clipboard parity and restart persistence remain acceptance-open.
4. Native B01–B05, N20–N30, reduced-transparency behavior, VoiceOver, physical keyboard delivery, collision handling, and second-display coverage remain unwitnessed.
5. Exact `gpt-image-2.5-flare` route evidence and curator-before-Illustration acceptance remain required before practical artwork is activated.

## Official Apple sources

Checked 2026-09-14. Only official Apple Developer documentation and Apple Developer videos were used for the current Liquid Glass, SwiftUI, AppKit, panel, accessibility, and macOS SDK statements.

- [macOS Tahoe 26 Release Notes](https://developer.apple.com/documentation/macos-release-notes/macos-26-release-notes) — macOS 26 SDK and Xcode 26 baseline; macOS 26 window-size animation note.
- [Build an AppKit app with the new design — WWDC25](https://developer.apple.com/videos/play/wwdc2025/310/) — AppKit Liquid Glass design intent, `NSGlassEffectView`, `NSGlassEffectContainerView`, control sizing, and top-level usage guidance.
- [NSGlassEffectView](https://developer.apple.com/documentation/appkit/nsglasseffectview) — AppKit glass surface API.
- [NSGlassEffectContainerView](https://developer.apple.com/documentation/appkit/nsglasseffectcontainerview) — AppKit grouping API for nearby glass surfaces.
- [SwiftUI `glassEffect(_:in:)`](<https://developer.apple.com/documentation/swiftui/view/glasseffect(_:in:)>) — SwiftUI content-anchored Liquid Glass modifier.
- [SwiftUI `GlassEffectContainer`](https://developer.apple.com/documentation/swiftui/glasseffectcontainer) — SwiftUI grouping container for multiple glass effects.
- [NSPanel](https://developer.apple.com/documentation/appkit/nspanel) — AppKit auxiliary panel host.
- [NSWindow.StyleMask.nonactivatingPanel](https://developer.apple.com/documentation/appkit/nswindow/stylemask-swift.struct/nonactivatingpanel) — nonactivating panel style mask.
- [NSWindow `setFrame(_:display:animate:)`](<https://developer.apple.com/documentation/appkit/nswindow/setframe(_:display:animate:)>) — native frame movement and animation seam.
- [NSWorkspace `accessibilityDisplayShouldReduceTransparency`](https://developer.apple.com/documentation/appkit/nsworkspace/accessibilitydisplayshouldreducetransparency) — reduced-transparency preference boundary.
- [NSScreen `visibleFrame`](https://developer.apple.com/documentation/appkit/nsscreen/visibleframe) — usable display frame for placement decisions.
