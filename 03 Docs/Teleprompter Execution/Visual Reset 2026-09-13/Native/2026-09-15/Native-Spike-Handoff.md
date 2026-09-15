# Native spike handoff — 2026-09-15

Status: build and direct runtime observed; authoritative bridge and full acceptance remain open.

## Source and toolchain

- Project target: `native/TeleprompterNative/`.
- Host: macOS 26.6.2.
- Swift: 6.3.2.
- SDK: macOS 26.5 Command Line Tools SDK; deployment target macOS 26.0.
- Full Xcode and `xcodebuild` are unavailable on this host. The accepted local build command is `swift build -c debug`; packaging uses `Scripts/package-app.sh`.

## Observed commands

| Command | Result | Evidence boundary |
|---|---|---|
| `swift build -c debug` | Pass | SwiftUI/AppKit executable compiled for arm64 macOS 26 |
| `native/TeleprompterNative/Scripts/package-app.sh` | Pass | `.build/TeleprompterNative.app` created and ad-hoc signed |
| Open the packaged `.app` | Pass | Native app launched with bundle identifier `local.teleprompter.native` |

## Direct native observation

The running window was observed as `Teleprompter Cue` in the native app. The accessibility surface exposed:

- `Cue Native • 14 records` and the subject/action/scene editor.
- Optics, Stage, and Finish controls.
- Optics expansion to Focal with `Natural 50` and `50 mm`.
- Text entry of `a person walking through a quiet gallery`.
- Apply advancing the displayed revision from 0 to 1.
- Preview disclosure revealing the fixture preview text.

The surface visibly used the macOS 26 SwiftUI material branch. The source fallback is `.regularMaterial`; it is not yet an explicit opaque Reduce Transparency branch and must not be described as one. This is direct runtime evidence of the current shell and control path; it is not formal Liquid Glass acceptance, because the bridge still returns development fixture data and the accessibility/reduced-transparency matrix is incomplete.

## Acceptance status

| Gate | Status | Reason |
|---|---|---|
| Native build and launch | PASS | Commands and bundle launch observed on the real host |
| Cue editor, Optics, Apply, Preview fixture path | PASS | Direct native observation above |
| Authoritative TypeScript store/compiler bridge | OPEN | `DevelopmentFixtureBridge` remains in use |
| Exact Preview/Copy parity and clipboard read-back | OPEN | No native compiler/helper handover yet |
| UTF-16 ranges, stale revision rejection, independent drafts | OPEN | No JSON-lines adapter acceptance yet |
| B01–B05 visual grievance closure | OPEN | Fresh wide/narrow, focus, settings, and exact-text witnesses remain required |
| N01–N30 native matrix | OPEN | Keyboard, IME, placement, dismissal, accessibility, reduced settings, and display coverage remain incomplete |
| Curator → Illustration gate | OPEN | Curator handoff and exact `gpt-image-2.5-flare` route evidence remain required |

The next implementation dependency is a versioned local JSON-lines helper connected to the existing TypeScript store/compiler. Do not activate assets or claim native acceptance from this fixture witness.
