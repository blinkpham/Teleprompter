# Native Witness — 2026-09-14

Status: partial native witness. The actual Electron app loaded from the local development server. This record does not treat typecheck, tests, build output, browser output, or Sol review as native proof.

## Observed

- Main window opened with visible title `Teleprompter`, dark-only surface, Cue/Library/Tokens/Search/Settings navigation, and Create/Edit tabs.
- A genuinely new Create surface initially exposed `Output 4:5 · 2K`, matching the new-document default.
- Reset was invoked. After the asynchronous draft update settled, the native Output label read `Output`, which is consistent with reset excluding the Create-only default; the first immediate post-click AX snapshot was unchanged, so this remains partial until repeated with a timestamped witness.
- Optics opened as a native accessory with a single active axis at a time: Focal cue was visible while Elevation, Subject distance, Azimuth, Depth of field, Horizon roll, and Focus target were available as tabs.
- Optics search accepted `zzzz-no-match` and rendered `No mapped options yet`; clearing the search returned the mapped choices and restored focus to the app content.
- Typing `/preset` produced a native Quick add suggestions list with one Commercial result and `Use preset` action text.

## Not closed

- Quick-add keyboard acceptance was not accepted in this witness. Return/Tab interaction left the query path in an incorrect `/preset/preset` state, so N27/N30 remain open pending a focused native retest and likely keyboard-target correction.
- The @ reference manager, chooser, thumbnail lifecycle, missing-file state, and cancel-to-context behavior were not yet present in the native witness.
- Native B01 geometry, B03 single-focus-ring sequence, adaptive placement/size arbitration, Preview clipboard read-back, settings persistence, shortcut delivery, and N01–N30 remain unwitnessed.

## Environment

- Command: `npm run dev`
- Renderer URL: `http://localhost:5173/?surface=main`
- Application: Electron 44.3.0
- Evidence source: current-turn CUA accessibility snapshots from the Electron window.
