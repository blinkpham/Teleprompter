# Teleprompter acceptance

Updated: 2026-09-13

## Evidence matrix

| Flow | Result | Evidence |
|---|---|---|
| Native identity and dark Cue | accepted | Electron window title `Teleprompter`; native renderer URL `localhost:5173/?surface=main`; CUA screenshot and accessibility tree showed dark Cue, Create/Edit, three parameter tiles, WHAT editor, Preview, and Copy. |
| Create/Edit separation | accepted | Native accessibility tree exposed Create and Edit tabs; existing focused checks cover separate draft IDs and revisioned dispatch. |
| Library and Tokens navigation | accepted | Native main-window tree exposed Cue, Library, Tokens, Search, and Settings; prior focused acceptance covered Library preset apply and 9 accepted Tokens directions. |
| Native compiled copy | accepted | Prior native run copied the compiled WHAT/CAM/ANGLE text; `pbpaste` matched the expected fields. |
| Native spotlight fallback | accepted | Native `View → Show Cue` opened a separate `Teleprompter Cue` window with renderer URL `localhost:5173/?surface=spotlight`; the rendered dark Cue was visible, the Preview control expanded the native panel, and Escape dismissed it after the overlay closed. |
| Global shortcut | unproven | `preferences.json` reports `CommandOrControl+Shift+Space` registered, but a CUA `super+shift+space` delivery did not produce a separate spotlight witness. Registration state is not treated as behavior proof. |
| Spotlight cursor placement and stable bounds | unproven | The separate panel appeared and expanded through the native path, but this run did not obtain stable inspectable bounds or a second independent shortcut witness. Do not infer cursor placement from placement unit tests or menu registration. |
| Industrial identity artwork | accepted | Four assets are present in the manifest: app icon plus Optics, Stage, and Finish group objects. Masters are 1024×1024; runtime derivatives are 512×512. Group outputs report RGBA pixel format and were visually reviewed in the contact sheet. |
| Practical examples | blocked-model-verification | Six curator-approved requests explicitly require `gpt-image-2.5-flare`. The built-in image route exposed no model selector or returned model metadata, and no local API credential is available for the exact Image API route. No practical image is labeled as Flare. |
| Focused local checks | accepted | `npm run typecheck`; `npm run test:logic` (8 files, 30 tests); `npm run build`; and `git diff --check` passed after the asset imports and manifest integration. |

## Native witness details

The native fallback witness was performed against Electron 44.3.0 on macOS. The `View` menu exposed `Show Cue`; selecting it opened the separate frameless panel and the CUA accessibility tree reported `Teleprompter Cue` at `localhost:5173/?surface=spotlight`. The captured panel showed the expected dark Cue surface. Moving inspection focus back to the main app caused the panel to disappear, consistent with the blur-dismiss path.

After the asset integration, the live native main window displayed the Optics, Stage, and Finish tiles with their generated industrial images. The bundle build resolved all three imported PNGs into renderer assets.

The global shortcut remains a limitation despite the persisted registered flag. A menu path and direct Escape dismissal are accepted, but they do not upgrade the shortcut result to accepted.

## Artwork gate

The OpenAI model catalogue documents `gpt-image-2.5-flare` as an exact Image API / Responses image-generation model. The current built-in image tool cannot prove that backend selection, so the industrial identity set is accepted separately and the six practical requests remain queued under `blocked-model-verification`. See `Artwork/Artwork-Handoff.md`.
