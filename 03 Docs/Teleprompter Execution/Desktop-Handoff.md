# Teleprompter desktop handoff

Status: desktop implementation complete; macOS native acceptance covers the spotlight lifecycle, OS-level shortcut delivery, and cursor-relative placement. Physical-keyboard and non-macOS behavior remain unverified. Updated 2026-09-13.

## Owned surface

This lane owns:

- `src/main/index.ts`
- `src/main/preferences.ts` and its tests
- `src/main/placement.ts` and its tests
- `src/main/draft-store.ts` and its tests
- `src/main/security.ts` and its tests
- `src/preload/index.ts`

## Implemented

- Added one main window and a reusable hidden spotlight window. The spotlight is configured as a frameless, transparent, focusable macOS panel with floating level and taskbar exclusion.
- Registered `CommandOrControl+Shift+Space` after `ready`, retained the last working accelerator when a replacement is unavailable, exposed registration state, and added the native `View → Show Cue` fallback.
- Added cursor/work-area placement and one-step compact/expanded resizing. Placement uses Electron DIP coordinates, supports negative-coordinate displays, clamps to work-area margins, and uses a narrow-display fallback.
- Added main-owned revisioned Create/Edit drafts, bounded per-client acknowledgement caching, conflict responses, undo snapshots, debounced atomic persistence, and bounded quit flushing.
- Added schema-2 preference migration with non-overwriting v1 backups, corrupt-file recovery naming, future-schema recovery status, dark-only startup, and persisted normal window bounds.
- Added a narrow context-isolated preload bridge for bootstrap, draft commands, subscriptions, exact clipboard copy, favorites, shortcut settings, native show/hide, and spotlight size requests. The legacy `teleprompter` bridge remains available for `teleprompter://app` compatibility.
- Added renderer sender/frame validation, navigation and window-open denial, webview denial, local asset path containment, explicit MIME mapping, and a strict local CSP.
- Set the visible native identity to Teleprompter while preserving the existing internal profile directory and `teleprompter://app` scheme.
- Guarded the native hide broadcast so the spotlight renderer cannot recursively invoke `hideSpotlight()` after the panel is already hidden. This keeps Escape/click-away dismissal bounded and allows the reusable panel to reopen.

## Verification

| Check | Result |
|---|---|
| `npm run test:logic` | 8 files, 33 tests passed |
| `npm run typecheck` | passed for node and web projects |
| `npm run build` | passed; Electron main, preload, and renderer bundles built |
| `git diff --check` | passed |
| Host | macOS 26.4.1, build 25E253 |
| Electron | 44.3.0 |
| Node / npm | 26.7.0 / 11.19.0 |

Pure coverage includes negative-coordinate and narrow-work-area placement, bounds clamping, v1 preference migration, future-schema recovery, draft serialization, ordered edits, stale same-field conflict handling, duplicate command acknowledgement, undo, sender URL checks, asset containment, and CSP policy.

## Native observations

The development Electron app was inspected on the macOS host against `localhost:5173/?surface=main`.

- The native window title displayed `Teleprompter`.
- The main renderer exposed the dark Cue surface with Cue, Library, Tokens, Search, and Settings navigation, plus Create/Edit controls.
- The native View menu exposed `Show Cue`, `Cue`, `Library`, `Tokens`, and `Search`.
- Accessibility inspection reported the renderer URL as `localhost:5173/?surface=main`. Its HTML-content label still said `Teleprompter`, which is a remaining document-metadata identity mismatch despite the native window title being renamed.
- The existing profile directory remained `/Users/blinblon/Library/Application Support/teleprompter`.
- The existing v1 preferences were preserved in a non-overwriting backup. The resulting v2 `preferences.json` retained favorite `surgical-edit` and the 1280×900 bounds, set the default shortcut as registered, and removed `themePreference` and `lastMode`. The current profile also contains `cue-drafts.json` with separate Create and Edit drafts.

The post-fix native witness used the actual Electron app through CUA on macOS 26.4.1 (build 25E253), Electron 44.3.0, Node 26.7.0, and npm 11.19.0.

- `View → Show Cue` opened a separate `Teleprompter Cue` window whose accessibility tree reported `localhost:5173/?surface=spotlight`; its screenshot showed the dark compact Cue panel.
- The spotlight WHAT editor accepted `native spotlight witness`, and the accessibility tree reported that exact value while the spotlight surface was active.
- Opening the preset picker changed the native surface to `Choose a preset` with a search field and `Choose Commercial`; the screenshot showed a bounded expanded panel. Escape returned it to the compact spotlight surface.
- Escape dismissed the compact spotlight and a second `View → Show Cue` invocation reopened it after the lifecycle fix.
- Selecting Commercial and pressing Copy returned to the main window. `pbpaste` matched the displayed compiled prompt, beginning `WHAT:\nnative spotlight witness` and containing the expected CAM, ANGLE, COMP, LIGHT, LOOK, MOOD, IMPORTANT, AVOID, and OUTPUT fields.
- Clicking the TextEdit document outside the spotlight hid the panel from the foreground screen. TextEdit remained focused and accepted `focus-restored after-spotlight`, proving normal keyboard focus returned to the preceding app.

## Lead follow-up observer evidence

A read-only CoreGraphics observer sampled the screen pointer and onscreen windows at roughly 100ms intervals without focusing Terminal, Electron, TextEdit, or the spotlight. With TextEdit focused, application menus closed, and the pointer held at the recorded screen position `(754.9, 517.2)`, both CUA `Command+Shift+Space` and `Super+Shift+Space` attempts produced no onscreen `Teleprompter Cue` window during the observation window. This corroborates the failed physical shortcut witness; it does not prove that registration is inactive.

In a separate run, a System Events menu activation with the pointer unchanged produced a visible `Teleprompter Cue` window. The observer recorded the panel settling at approximately `(424, 480, 660, 364)` while the pointer remained `(754.9, 517.2)`, after transient bounds during the native transition. This is useful placement-path evidence, but it is not shortcut evidence and does not satisfy the required second independent pointer location.

The preview process used for this pass was stopped after inspection. No installer, signing, automatic paste, or runtime model connection was added.

## Native limits and failure cases

The first global-shortcut attempt used CUA's Command/Super forms from TextEdit; the passive observer saw no separate spotlight witness. That negative result is scoped to that CUA path. A later macOS System Events key-event witness delivered the configured accelerator and is recorded below. No shortcut-conflict status was observable.

The current native witness does not establish second-display/full-screen behavior, shortcut collision handling, or cross-window draft editing. The spotlight panel focus, blur/click-away dismissal, Escape dismissal, picker resize, native clipboard copy, focus restoration, OS-level shortcut dismissal, and cursor-relative placement were directly observed.

Sol/Core was unavailable in this worker context; no Sol review of local files is claimed.

The code paths and pure tests exist for those cases, but they require a native witness that can select and inspect the separate spotlight panel. The main window's native identity and the unchanged compatibility profile were observed; they do not substitute for spotlight proof.

## Next integration action

Lead: consume the macOS key-event and placement evidence below. Retain the menu fallback and bounded hide-loop fix; keep physical-keyboard, collision, and non-macOS coverage outside the accepted evidence boundary.

## Independent native recheck — 2026-09-13 11:11 +0700

The clean development run used `/Users/blinblon/Claude/Projects/Teleprompter` with `npm run dev`, the actual Electron window, and CUA on macOS 26.4.1 (build 25E253), Electron 44.3.0, Node 26.7.0, and npm 11.19.0. The app loaded at `localhost:5173/?surface=main`; the native profile remained `/Users/blinblon/Library/Application Support/teleprompter`.

- **Other-app shortcut attempt:** TextEdit was the safe native target. Its existing document value remained `focus-restored after-spotlight`. With the TextEdit text area focused, CUA sent `super+shift+space`, `cmd+shift+space`, and `command+shift+space`; no separate spotlight witness appeared, and TextEdit's value remained unchanged. The persisted registered flag therefore remains insufficient to accept global delivery.
- **Chosen pointer attempt:** The pointer was parked at CUA coordinate `[600, 600]` on an inert area of the native main Cue window. CUA keyboard menu access (`ctrl+F2` / `alt+v`) did not expose the View menu, so the successful fallback invocation necessarily used the native `View → Show Cue` mouse menu path, which moves the pointer to the menu. The resulting native window was `Teleprompter Cue` with `localhost:5173/?surface=spotlight`; its accessibility tree and screenshot showed the separate dark spotlight surface. CUA exposed neither native screen-origin bounds nor a separate bounds API, so this run cannot prove cursor-relative placement at `[600, 600]`.
- **Cleanup:** TextEdit was clicked back into its existing text area; the document value was still `focus-restored after-spotlight`. The development Electron process was stopped after capture.

### Recheck conclusion

This run strengthens the negative result for the real global shortcut and confirms the menu fallback can still open the reusable spotlight. It does not upgrade either the global shortcut or independently inspectable cursor placement to accepted. No source code or non-owned file was changed; Sol/Core was not available in this worker context.

## Independent macOS key-event and placement witness — 2026-09-13 11:28 +0700

This witness supersedes the CUA-only shortcut and placement limitation for macOS behavior. The actual development Electron app was running from the lead checkout. TextEdit was the preceding focused app, and a passive Swift CoreGraphics/AppKit observer sampled `NSEvent.mouseLocation` plus onscreen Electron window bounds without focusing or moving the spotlight.

- A macOS System Events key event, `key code 49 using {command down, shift down}`, opened `Teleprompter Cue` at `localhost:5173/?surface=spotlight` while TextEdit was focused. This is OS-level key-event evidence; it does not claim a hardware-keyboard test.
- With the pointer moved through a CoreGraphics event to screen coordinate `(600, 500)`, the passive observer reported `(600, 482)` and the settled spotlight bounds were `X=270, Y=516, Width=660, Height=364`.
- After dismissing, the pointer was moved independently to `(1100, 200)`; the observer reported `(1100, 782)` and the settled spotlight bounds were `X=770, Y=216, Width=660, Height=364`.
- With the second spotlight open, the same macOS key event produced `cueWindows=0`, directly confirming shortcut dismissal. The first run also reopened the panel after the same lifecycle, so delivery and dismissal were both observed.

The two stable bounds changed with the two pointer locations while the observer remained passive. This accepts cursor-relative placement on the tested macOS display; it does not claim second-display or non-macOS coverage.
