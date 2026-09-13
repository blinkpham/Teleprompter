# Teleprompter desktop handoff

Status: desktop implementation complete; macOS native acceptance partial. Updated 2026-09-13.

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
- Added a narrow context-isolated preload bridge for bootstrap, draft commands, subscriptions, exact clipboard copy, favorites, shortcut settings, native show/hide, and spotlight size requests. The legacy `imageDirector` bridge remains available for `image-director://app` compatibility.
- Added renderer sender/frame validation, navigation and window-open denial, webview denial, local asset path containment, explicit MIME mapping, and a strict local CSP.
- Set the visible native identity to Teleprompter while preserving the existing internal profile directory and `image-director://app` scheme.

## Verification

| Check | Result |
|---|---|
| `npm run test:logic` | 8 files, 30 tests passed |
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
- Accessibility inspection reported the renderer URL as `localhost:5173/?surface=main`. Its HTML-content label still said `Image Director`, which is a remaining document-metadata identity mismatch despite the native window title being renamed.
- The existing profile directory remained `/Users/blinblon/Library/Application Support/image-director`.
- The existing v1 preferences were preserved in a non-overwriting backup. The resulting v2 `preferences.json` retained favorite `surgical-edit` and the 1280×900 bounds, set the default shortcut as registered, and removed `themePreference` and `lastMode`. The current profile also contains `cue-drafts.json` with separate Create and Edit drafts.

The preview process used for this pass was stopped after inspection. No installer, signing, automatic paste, or runtime model connection was added.

## Native limits and failure cases

The spotlight did not become separately inspectable in the available CUA view after the native menu and shortcut actions. This is a truthful refusal to claim the following as proven: visible cursor placement, spotlight surface rendering, panel focus, blur dismissal, Escape/shortcut dismissal, exact native clipboard flow, copy acknowledgement timing, expanded picker resizing, second-display/full-screen behavior, typing return to another app, shortcut collision handling, or cross-window draft editing.

The code paths and pure tests exist for those cases, but they require a native witness that can select and inspect the separate spotlight panel. The main window's native identity and the unchanged compatibility profile were observed; they do not substitute for spotlight proof.

## Next integration action

Lead: repeat the macOS acceptance matrix with separate spotlight-window inspection, then record the shortcut, focus, cursor placement, resize, clipboard, and relaunch results before calling the desktop lane accepted.
