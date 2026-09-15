# Teleprompter native host spike

This is the first native macOS seam for the Teleprompter Cue surface.

- AppKit owns the `NSPanel` lifecycle, activation, key-window eligibility, screen anchor, and visible bounds.
- SwiftUI owns the Cue editor, one bounded Optics surface, preview disclosure, and accessibility labels.
- macOS 26 uses SwiftUI Liquid Glass through `glassEffect`; the modifier has an opaque material fallback for older availability paths.
- `NativeRuntimeBridge` is the only native/runtime boundary. `DevelopmentFixtureBridge` is intentionally a fixture and does not claim compiler/store parity.

The next seam replaces the fixture with a versioned local JSON-lines adapter to the existing TypeScript store/compiler. It must preserve the 14-record runtime boundary, revision checks, exact preview/copy semantics, and local-only behavior.
