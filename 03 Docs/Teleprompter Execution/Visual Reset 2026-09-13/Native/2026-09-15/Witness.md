# Teleprompter native witness — 2026-09-15

Status: **native fixture witnessed — acceptance partial**.

This is a fresh direct witness of the current SwiftUI/AppKit spike. It does not claim native compiler/store parity, adaptive shortcut behavior, full B01–B05 closure, or full N01–N30 acceptance. The fixture bridge is explicitly development-only.

## Scope and authority

- Target: `native/TeleprompterNative/` from this checkout.
- Allowed writes: this dated handoff directory and generated build/screenshot artifacts under it or the package's existing `.build/` directory.
- Preserved: all source files, plan files, MAP.md, and unrelated dirty work.
- Direct native evidence only: CUA accessibility observations, native screenshots, CoreGraphics window bounds, and process identity.
- Not used as native proof: Electron, browser preview, TypeScript tests, API presence alone, or a registered/menu-only affordance.

## Run identity

Witness date: 2026-09-15, Asia/Ho_Chi_Minh (UTC+07:00).

| Field | Recorded value |
|---|---|
| Checkout | native witness worktree (recorded separately from this checkout) |
| Git identity | detached `HEAD`, `6fcfec3` |
| Dirty state before witness | Modified: `03 Docs/Teleprompter Plan/Visual Reset 2026-09-13/{00-Start-Here.md,05-Adaptive-Window-Research.md,09-Astra-Implementation-Brief-2026-09-14.md,10-Native-Liquid-Glass-Migration-Decision.md}`; untracked `native/` already present |
| Host | macOS 26.6.2, build 25G83, arm64 |
| Swift | Apple Swift 6.3.2, swift-driver 1.148.6 |
| Developer directory | `/Library/Developer/CommandLineTools` |
| macOS SDK | `xcrun --sdk macosx --show-sdk-version` → 26.5; path `/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk` |
| Xcode | `xcodebuild -version` unavailable because only Command Line Tools are selected |
| Native screen observed | frame `(0,0,1512,982)`, visible frame `(0,75,1512,874)`, backing scale 2.0 |

The first build attempt failed only because the package cache contained a module compiled from another checkout path. `swift package clean` cleared the package's generated cache; the second build completed without a source or manifest edit.

## Build, package, and launch evidence

Commands were run from the native witness worktree's `native/TeleprompterNative` directory unless stated otherwise.

1. `swift build -c debug` — first attempt failed with a stale `SwiftShims.pcm` path pointing at a different checkout.
2. `swift package clean` — cleared only this package's generated `.build/` cache.
3. `swift build -c debug` — **pass**, `Build complete!`.
4. `swift build -c debug` — **pass**, incremental confirmation, `Build complete! (0.20s)`.
5. `./Scripts/package-app.sh` — **pass**; produced the native witness worktree's `.build/TeleprompterNative.app` with an ad hoc signature.
6. `open -n '.build/TeleprompterNative.app'` — launched the exact recorded bundle at `2026-09-15T14:02:55Z` as PID `90291`.

Bundle identity:

- `CFBundleDisplayName`: `Teleprompter`
- `CFBundleIdentifier`: `local.teleprompter.native`
- executable: `TeleprompterNative`, Mach-O arm64
- minimum system: macOS 26.0
- code signature: `adhoc`, no Team ID
- executable SHA-256 at capture: `db5073d2b1b9aaf16af3f2ca0760c19897640f296b968726c5ed26b87ee605a9`

An older debug executable was simultaneously present as PID `67979` (`./.build/arm64-apple-macosx/debug/TeleprompterNative`) and produced a duplicate-looking panel in the first full-screen capture. It was terminated at `2026-09-15T14:07:16Z`; the clean packaged witness continued with PID `90291`. The ambiguous capture is retained as `03-native-preview-fullscreen.png` but is not used as acceptance evidence.

The packaged PID `90291` was terminated at `2026-09-15T14:10:54Z`. Reopen command:

`open -n '.build/TeleprompterNative.app'`

This reopened the same bundle at `2026-09-15T14:11:02Z` as PID `4545`. CUA showed one `Teleprompter Cue` panel, empty WHAT, `Native • 14 records`, and `rev 0`. CoreGraphics measured the reopened window as `x=446, y=105, width=620, height=234`.

## Direct native observations

### Cue, text, and Optics

- The native panel exposed `Cue`, `Native • 14 records`, a settable WHAT field, Optics/Stage/Finish buttons, Preview, Apply, revision text, and a Preview disclosure.
- ASCII input was directly observed in the WHAT field: `moc ban camera - cafe studio` followed by ` + shot`.
- In-field selection of `camera` and replacement with `camera rig` was directly observed through the native accessibility value.
- Attempts to inject the planned em dash/emoji string were not treated as reliable evidence; the native AX value did not confirm the intended Unicode result. IME and physical-keyboard composition remain unwitnessed.
- Clicking Optics changed its native label from `Choose` to `Focal` and exposed one `Focal` row: `Natural 50`, `50 mm`.
- Tab focus moved to Optics and a single blue focus outline was visible around that control in a live CUA screenshot; that transient focus capture was not saved as a separate file.
- No Stage or Finish picker opened; no multi-axis choice or real selection mutation was available.

### Apply and Preview

- Initial revision: `rev 0`.
- First Apply visibly changed the label to `rev 1`.
- A second Apply with the resulting revision visibly reset the fixture label to `rev 0`; this is fixture behavior and is not evidence of stale-safe native commands.
- A later text edit and Apply visibly returned the label to `rev 1`.
- Preview disclosure expanded to a visible scroll area with:

  ```text
  WHAT:
  [subject + action + scene]

  CAM:
  [camera / lens / depth / focus]
  ```

- The Preview text remained the fixture placeholder after the WHAT and Optics state were changed. This directly demonstrates presentation-only fixture output, not exact compiler output.

### Bounds, lifecycle, and material

- CoreGraphics observed the packaged window at `x=1049, y=151, width=620, height=400` while Optics and Preview were open, then at `x=1049, y=151, width=620, height=233` after both were closed.
- On the clean reopen, the same bundle initially appeared at `x=446, y=105, width=620, height=234`.
- The panel remained visible when Claude/Zen was brought forward. Outside-click dismissal and previous-app focus restoration were therefore not observed; `hidesOnDeactivate = false` is consistent with this result.
- Escape did not close Optics or the panel in the exercised state.
- The native panel visibly responded to a bright, varied background with translucency. This supports a **partial material witness** on macOS 26, but the screenshot cannot independently distinguish `glassEffect` from `regularMaterial`; genuine Liquid Glass is not marked passed.
- Reduced Transparency, Reduced Motion, VoiceOver, second display, fullscreen/Space, collision handling, and edge-placement fixtures were not exercised.

## Evidence files

All screenshots are full-screen captures at 3024×1964 pixels unless noted.

| File | What it records | Use |
|---|---|---|
| [03-native-preview-fullscreen.png](03-native-preview-fullscreen.png) | First Preview capture with two overlapping Teleprompter-looking processes | Identity ambiguity only; excluded from acceptance |
| [04-native-single-instance-preview.png](04-native-single-instance-preview.png) | One exact packaged PID over Claude, Optics/Preview open | Native fixture presentation and preview limitation |
| [05-native-background-focus.png](05-native-background-focus.png) | Panel remained visible after another app was foregrounded | Deactivation/outside-dismissal limitation |
| [06-native-over-finder.png](06-native-over-finder.png) | Panel over a bright, varied Zen/Google Sheets background | Background-responsive translucency; not a standalone Liquid Glass proof |
| [07-native-main-final.png](07-native-main-final.png) | Collapsed main Cue with typed WHAT and Optics closed | Main geometry and generic capsule observation |
| [08-native-reopen-empty.png](08-native-reopen-empty.png) | Exact bundle after clean reopen, empty fixture state | Reopen identity and reset behavior |

## B01–B05 ledger

| ID | Status | Direct evidence | Limit / mismatch |
|---|---|---|---|
| B01 | **fail** | `07-native-main-final.png` shows three bounded horizontal capsules with dominant group names. | The visible controls are generic gray pills with blank circular placeholders, not image-led object capsules with the required object treatment. Wide/narrow, hover, pressed, and popup states were not covered. |
| B02 | **partial** | Optics opened to one bounded Focal row, `Natural 50 / 50 mm`; no repeated lens art appeared. | Only one hard-coded axis/choice is present. Stage/Finish, finite production options, long labels, narrow height, and full visual fallback behavior remain unwitnessed. |
| B03 | **partial** | Tab focus visibly produced one blue outline around Optics; AX focus was directly observed. | Full search/focus transition coverage is absent. Clicking Optics left AX focus on WHAT in one sequence, and there is no search surface to exercise. |
| B04 | **fail** | Preview was directly visible after changing WHAT and Optics. | Preview remained the static fixture placeholder and no native Copy/read-back path exists; exact compiler parity and stale-result rejection are not present. |
| B05 | **unwitnessed** | The native menu exposes Settings, but no settings surface or persistence seam was exercised. | New-only default, blank/custom recovery, Edit, clear, reload, shortcut registration, and persistence/error truthfulness remain unwitnessed. |

No B case is fully passed by this witness.

## N01–N30 ledger

| Case | Status | Evidence / remaining gap |
|---|---|---|
| N01 | **partial** | Native Create-like Cue and empty/configured fixture states visible; no real saved output default or final group identity. |
| N02 | **partial** | WHAT was populated and remained editable; no existing saved Create draft. |
| N03 | **partial** | Optics open/close and Tab focus observed; hover, pressed, all groups, and tooltip states absent. |
| N04 | **partial** | One Optics → Focal path observed; full accepted Optics semantics and choice mutation absent. |
| N05 | **unwitnessed** | Stage/Finish surfaces are not implemented in the fixture. |
| N06 | **unwitnessed** | No search control. |
| N07 | **unwitnessed** | No clear/custom-camera workflow. |
| N08 | **unwitnessed** | Minimum width and 200% text zoom not exercised. |
| N09 | **unwitnessed** | Native panel and content-height change are supporting evidence only; no adaptive quick bar or measured layout request path. |
| N10 | **unwitnessed** | Library absent. |
| N11 | **unwitnessed** | Library detail/source disclosure absent. |
| N12 | **unwitnessed** | Tokens absent. |
| N13 | **unwitnessed** | Settings and shortcut configuration absent. |
| N14 | **partial** | Preview disclosure and readable fixture text observed; no compiler/Copy equality. |
| N15 | **unwitnessed** | Edit mode and recipe slots absent. |
| N16 | **unwitnessed** | New-versus-recovered draft/default semantics absent. |
| N17 | **partial** | Direct sequence of Optics open, Apply, Preview, close observed; motion/settle recording absent. |
| N18 | **unwitnessed** | Reduced Motion preference not exercised. |
| N19 | **unwitnessed** | Exact bundle launch, panel state, reopen, and disclosure lifecycle are supporting evidence only; the required shortcut/menu opening, outside dismissal, and native Copy smoke were not completed. |
| N20 | **unwitnessed** | No adaptive list/preview sizing path. |
| N21 | **unwitnessed** | No late layout arbitration or typing-during-resize path. |
| N22 | **unwitnessed** | No transparent-gap/click-through test. |
| N23 | **partial** | Native selection/replacement observed; IME, drag bounds, and chooser cancellation absent. |
| N24 | **partial** | One visible Focal option observed; cardinality fixtures and scrolling absent. |
| N25 | **unwitnessed** | One screen, normal bounds, and varied-background translucency are supporting evidence only; adaptive edge placement, reduced settings, fullscreen/Space, and second display were not exercised. |
| N26 | **unwitnessed** | Slash commands and quick add absent. |
| N27 | **unwitnessed** | Atomic command conflict, Undo, and two-window behavior absent. |
| N28 | **unwitnessed** | Reference mentions and local binding absent. |
| N29 | **unwitnessed** | Reference persistence/rebind absent. |
| N30 | **unwitnessed** | VoiceOver, IME, suggestion keyboard behavior, paste, and remote-update behavior absent. |

## Sol consultation and independent review

Sol was consulted in the existing [Plan Native Cue Spike](https://chatgpt.com/c/6aa810b2-16b4-83ec-986c-e7871c9bba88) task using GPT-5.6 Sol Light.

Sol's independent acceptance plan required:

- record checkout identity, dirty state, host/toolchain, exact executable, PID, and commands;
- treat `swift build` as compilation-only and use only the existing package/app route;
- directly exercise only implemented Cue, Optics/Focal, Apply, Preview, lifecycle, bounds, and material behavior;
- mark shortcut, adaptive sizing, outside dismissal, compiler/store transport, persistence, Library/Tokens, and reference cases unwitnessed;
- treat Liquid Glass as partial only when macOS 26, native process identity, and visibly background-responsive material are all observed, while API presence alone remains insufficient;
- stop on source/manifest edits, uncertain executable identity, unexpected worktree changes, unsafe preference/draft mutation, or an uncertain background process.

Sol's stated honest outcome was: **build blocked**, **launch blocked**, or **native fixture witnessed — acceptance partial**. This run meets the third outcome, with the B/N statuses above.

Sol review of this handoff: **reviewed 2026-09-15**. Sol confirmed that all B statuses are conservative, including B01/B04 as fails. Sol corrected N09, N19, and N25 from partial to unwitnessed because the observed height changes, ordinary launch/reopen, normal-screen bounds, and translucency do not satisfy those cases' required setups. N24 partial remains borderline but defensible only as a narrow one-option fragment. Sol found no other material evidence omission.

## Cleanup and final file boundary

The reopened PID `4545` was the exact packaged bundle and was terminated at `2026-09-15T14:14:13Z` after the final screenshot/identity check. A path-scoped process check returned no remaining process from this checkout. A later global scan saw an unrelated Teleprompter process under sibling worktree `6591`; it was not touched.

The handoff directory contains only this report and the six evidence captures listed above. The native source tree and its generated `.build/` artifacts remain uncommitted user/worker material outside this evidence handoff.
