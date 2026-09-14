# Teleprompter acceptance

Updated: 2026-09-13

## Current visual authority

Future visual implementation and acceptance must follow [Visual Reset 2026-09-13](<../Teleprompter Plan/Visual Reset 2026-09-13/00-Start-Here.md>). It contains 31 requirement IDs and 30 native acceptance cases and supersedes the earlier visual-reset geometry and visual-acceptance claims. Technical engine, desktop lifecycle, shortcut, and cursor evidence remain separate.

## Evidence matrix

| Flow | Result | Evidence |
|---|---|---|
| Native identity and dark Cue | accepted | Electron window title `Teleprompter`; native renderer URL `localhost:5173/?surface=main`; CUA screenshot and accessibility tree showed dark Cue, Create/Edit, three parameter tiles, WHAT editor, Preview, and Copy. |
| Image-led Cue group controls | open — visual reset required | The latest live Electron re-audit found the controls still read as framed generic buttons with square image wells. The Optics picker clips oversized repeated lens artwork, and the visual comparison does not yet meet the Higgsfield direction. The v2 assets remain available; asset integration is not visual acceptance. |
| Create/Edit separation | accepted | Native accessibility tree exposed Create and Edit tabs; existing focused checks cover separate draft IDs and revisioned dispatch. |
| Library and Tokens navigation | accepted | Native main-window tree exposed Cue, Library, Tokens, Search, and Settings; prior focused acceptance covered Library preset apply and 9 accepted Tokens directions. |
| Native compiled copy | accepted | Prior native run copied the compiled WHAT/CAM/ANGLE text; `pbpaste` matched the expected fields. |
| Native spotlight fallback | accepted | Native `View → Show Cue` opened a separate `Teleprompter Cue` window with renderer URL `localhost:5173/?surface=spotlight`; the rendered dark Cue was visible, the Preview control expanded the native panel, and Escape dismissed it after the overlay closed. |
| Spotlight lifecycle, resize, clipboard, and focus restoration | accepted | The post-fix native witness opened and reopened the reusable panel, expanded the preset picker, returned to compact on Escape, copied the compiled prompt through `pbpaste`, dismissed by click-away, and returned typing focus to TextEdit. |
| Global shortcut | accepted on macOS OS-level key event | With TextEdit focused, macOS System Events `key code 49 using {command down, shift down}` opened the separate spotlight; the same event dismissed it while open. The earlier CUA Command/Super attempts remain a negative result for that injection path, not for the native OS event path. Hardware-keyboard delivery and conflict handling remain unverified. |
| Spotlight cursor placement and stable bounds | accepted on tested macOS display | A passive CoreGraphics/AppKit observer captured two independently moved pointer locations and settled spotlight bounds: `(600,482)` → `(270,516,660,364)` and `(1100,782)` → `(770,216,660,364)`. This accepts cursor-relative placement on the tested display; second-display, full-screen, and non-macOS coverage remain unverified. |
| Industrial identity artwork | accepted | Four assets are present in the manifest: app icon plus Optics, Stage, and Finish group objects. Masters are 1024×1024; runtime derivatives are 512×512. Group outputs report RGBA pixel format and were visually reviewed in the contact sheet. |
| Practical examples | blocked-model-verification | Six curator-approved requests explicitly require `gpt-image-2.5-flare`. The built-in image route exposed no model selector or returned model metadata, and no local API credential is available for the exact Image API route. No practical image is labeled as Flare. |
| Focused local checks | accepted | `npm run typecheck`; `npm run test:logic` (8 files, 33 tests); `npm run build`; and `git diff --check` passed after the spotlight fix and asset integration. |

## Native witness details

The independent 11:11 recheck sent `super+shift+space`, `cmd+shift+space`, and `command+shift+space` from a focused TextEdit document without producing a separate spotlight. It also parked the pointer at CUA `[600, 600]`, but the only successful fallback in that CUA-only run was the mouse-driven `View → Show Cue` path. A later passive CoreGraphics/AppKit observer plus macOS System Events key-event witness captured two stable pointer-relative spotlight placements and shortcut dismissal, upgrading the macOS shortcut and placement rows above while preserving the CUA-path limitation.

The native witness was performed against Electron 44.3.0 on macOS 26.4.1 through CUA. The `View` menu exposed `Show Cue`; selecting it opened the separate frameless panel and the CUA accessibility tree reported `Teleprompter Cue` at `localhost:5173/?surface=spotlight`. The captured panel showed the expected dark Cue surface. The WHAT editor accepted `native spotlight witness`; the preset picker expanded to a bounded `Choose a preset` surface and returned to compact on Escape. A second menu invocation reopened the panel after Escape, confirming the hide-loop fix. Copy returned to the main window and `pbpaste` matched the compiled prompt. Clicking TextEdit outside the panel dismissed it, and typing remained in TextEdit, confirming focus restoration.

After the asset integration, the live native main window displayed the Optics, Stage, and Finish tiles with their generated industrial images. The bundle build resolved all three imported PNGs into renderer assets.

The earlier CUA Command/Super attempts remain a limitation of that automation path. The macOS OS-level key-event witness accepted shortcut delivery and dismissal, and the passive two-location observer accepted cursor-relative placement on the tested display. Physical-keyboard delivery, shortcut collision handling, and other platforms remain outside the evidence.

## Artwork gate

The OpenAI model catalogue documents `gpt-image-2.5-flare` as an exact Image API / Responses image-generation model. The current built-in image tool cannot prove that backend selection, and this workspace has no authorized model-selectable route, so the industrial identity set is accepted separately and the six practical requests remain queued under `blocked-model-verification`. See `Artwork/Artwork-Handoff.md` and `Artwork/Model-Route-Evidence.md`.
