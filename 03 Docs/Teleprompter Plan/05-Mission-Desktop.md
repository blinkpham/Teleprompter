# Mission — desktop and spotlight

## Dispatch prompt

> Implement Teleprompter's native desktop behavior. Read AGENTS.md and MAP.md, the scope update in `03 Docs/Teleprompter Plan/00-Start-Here.md`, the shared contracts, and this mission. You own `src/main/`, `src/preload/`, and desktop-focused tests. You are not alone in the codebase: preserve other workers' edits and consume the lead's shared types and engine worker's pure functions. The lead owns root metadata and renderer orchestration; the UI worker owns the popup's content. Deliver the real global shortcut and cursor-positioned Electron panel, shared durable drafts, exact native copy, and safe visible rename. Verify native behavior on macOS. Do not add model APIs, automatic paste, global input monitoring, installers, or publication.

## Architecture

Use one Electron main process and two renderer surfaces: the normal workspace and a reusable hidden spotlight window. Both load the same local renderer bundle with a validated surface parameter; both consume the same bundled library and main-owned state. A tiny window registry maps each permitted webContents to its surface role. Do not infer role from an arbitrary renderer message.

Keep `contextIsolation:true`, `sandbox:true`, `nodeIntegration:false`, `webSecurity:true`, and `webviewTag:false`. Keep background throttling enabled. Main owns preferences, revision arbitration, clipboard, shortcut registration, and cursor/display placement. Renderer owns local focus, hover, scrolling, and in-progress field buffers. The pure engine owns all token and prompt semantics.

Extract only useful responsibilities from the current main file: window creation, spotlight placement, draft store, preference migration, IPC registration, and the local asset protocol. No generic service framework is needed.

## Shortcut and window lifecycle

Default shortcut: `CommandOrControl+Shift+Space`. Register after app ready; provide an editable recorder in Settings and a native View → Show Cue menu fallback. Registration failure must remain visible beside the stored shortcut. Preserve the last working binding while validating a replacement; do not claim a saved binding is active until registration succeeds. Ignore key-repeat toggles during a 250ms opening/closing transition. Unregister on quit. Electron documents that registration can fail when another app owns the accelerator. [GlobalShortcut](https://www.electronjs.org/docs/latest/api/global-shortcut)

Shortcut behavior: hidden → open near the current cursor; visible and focused → hide; visible but unfocused → reposition and focus it. The app must be running; no login launch or background daemon is added. Closing the main window on macOS leaves the process and shortcut available. Quit actually quits and flushes state. The dock/menu can reopen the main window, always showing Cue on a fresh process launch.

Create the spotlight as a frameless, transparent, focusable, non-resizable macOS `panel`, hidden initially, with no parent/modal relationship to the main window, `skipTaskbar:true`, and a floating always-on-top level. Use native panel behavior that can receive typing without bringing the main workspace forward. It should appear in the current Space; test full-screen Spaces explicitly. Limit any `setVisibleOnAllWorkspaces` behavior to this panel and verify it does not move the user's workspace. The main window uses `hiddenInset` titlebar styling with native traffic lights and a reserved drag strip. [Window options](https://www.electronjs.org/docs/latest/api/structures/base-window-options)

Show only after preload/bootstrap and initial content are ready, with no white flash. Warm-open target is under 150ms on the development host; record the observation rather than inventing a benchmark. Pause renderer animation while hidden. Unexpected renderer failure can recreate this owned window from the last main snapshot; it must not erase the drafts or leave duplicate shortcuts/listeners.

## Cursor placement and adaptive bounds

Use `screen.getCursorScreenPoint()` and `screen.getDisplayNearestPoint(point).workArea` after ready. Electron returns cursor coordinates in device-independent pixels; do not multiply them by the display scale factor. Re-read the work area on each invocation and display change. [Screen API](https://www.electronjs.org/docs/latest/api/screen)

Initial content bounds target 660×364 DIP, reduced to fit the display's work area minus a 16px margin on every edge. Minimum usable layout width is 400 DIP; on an unusually narrow work area use all available width and the UI's one-column layout. Center horizontally on the cursor. Prefer top = cursor.y + 16; if it will not fit below, put it above the cursor; then clamp both coordinates to the work area, including negative-coordinate monitors. Keep the anchor fixed until the popup closes—no continuous cursor tracking.

Expanded picker/preview height targets up to 620 DIP, capped by the same work area. The renderer requests only an enumerated size state (`compact`, `expanded`) through its authorized surface channel, never arbitrary coordinates. Main changes native bounds once on a size-state transition and preserves the nearest available anchor edge. Motion animates the interior shape; do not issue native resize calls on every animation frame. Resize cannot make a focused input or Copy button leave the visible work area.

Keep popovers and selector portals inside the popup's window. The expanded picker replaces the composer body with Back navigation when space is constrained. Transparent padding inside the native window closes the popup on a pointer press; clicks beyond the window cause normal native blur, without a screen-sized invisible capture layer. No global mouse hook, Accessibility permission, or screenshot capture is needed for cursor positioning.

## Dismissal and focus

Native blur hides the spotlight and retains drafts. Delay blur handling to the next task and confirm the window is still unfocused, so a brief show/focus transition cannot immediately hide it. A renderer overlay is part of the same window and does not suspend blur dismissal. Reset dialogs and file pickers are unnecessary in this flow.

Escape is handled by the renderer's nested-overlay policy; its final action requests hide. Successful Copy shows a brief check, then hides the spotlight after approximately 180ms. The main Cue stays open after copying. Copy failure keeps the popup open with a readable error. Hiding must return keyboard use to the preceding app through normal panel behavior; verify by typing into an audit-owned text field in a separate app after dismissal. Do not synthesize a paste, read the target document, or claim focus restoration from a screenshot. If the panel implementation fails this test, resolve the native focus behavior before acceptance; no silent switch to automation of other apps.

## Draft synchronization

Main stores both drafts and per-field revisions, plus a monotonic snapshot sequence. Every client gets a main-assigned client ID and subscribes once. Commands are validated and serialized; compound commands use the engine's complete touched-path set. Keep a bounded cache of the latest 256 command acknowledgements per live client for idempotent retries; clear it when the client is destroyed.

Renderer typing is immediate in its local buffer. Debounce IPC text updates by at most 150ms; flush on blur, mode change, hiding, and Copy. Selection commands send immediately. Each client sends its own commands in order. Acknowledgements rebase later commands from that same client; remote snapshots merge only into fields without an unsent local buffer. Do not replace a textarea value or selection range on each broadcast.

Same-field conflicts preserve both the current authoritative value and the local buffer until the user resolves them. Disjoint fields rebase automatically. A “Keep my text” retry explicitly uses the current field revision; “Use current” replaces the local buffer. Multiple windows editing two different fields must not cause a conflict banner.

Before `copyCompiledDraft`, flush the client queue, await acknowledgement, and ensure preview and requested revision agree. Main compiles at that revision and writes the text. A stale request must not copy an earlier draft or falsely report success. Ordinary bridge rejection becomes an error result or caught failure; never leave Copy permanently pending. UI request identities prevent an older success state from appearing on a changed payload.

## Persistence and rename

Keep the existing `appData/image-director` userData location explicitly, set before ready and before renaming the app. This host's current preferences were observed there during the audit. Do not move or merge profile directories merely to change a display name. The directory is an internal compatibility detail; all visible labels become Teleprompter.

The lead changes package name/description/title metadata and renderer bridge callers. Desktop changes `app.setName`, native menus, window titles, and About metadata. Keep the internal `image-director://app` scheme for this release and treat it as a local compatibility identifier; all user-visible naming uses Teleprompter. A later protocol change has no product benefit in this task.

Preferences schema 2 stores favorite IDs, shortcut choice/status, and main-window bounds. It no longer honors themePreference or lastMode for launch behavior. Set dark before showing either window. Create/Edit drafts live in a separate `cue-drafts.json` document containing a store schema version, both draft documents, field revisions, and library version. Pending IME text and hover/picker highlight are renderer state, not persisted prompts.

Before first upgrading a valid schema-1 preference file, write a non-overwriting migration backup; retain favorites and valid bounds. For corrupt data, preserve the unreadable file under a unique recovery name before creating defaults. For an unknown future version, leave it untouched and operate with an explicit recovery/session status. Avoid silently rewriting unknown fields into an older schema.

Write serialized snapshots through a temporary file and atomic rename, coalescing draft disk writes to the latest state within 300ms. IPC acknowledgement identifies memory acceptance; report durability separately. After disk success, broadcast `persistence:'disk'` for that saved sequence. A failed write retains the latest memory state, marks it session-only, and retries on the next change or explicit Retry. Never display an older successful save as proof that newer edits are durable.

Before orderly quit, flush pending renderer buffers and the latest disk snapshot with a bounded timeout. If disk writing fails, show a focused recovery action with selectable/copyable drafts before an explicit Quit anyway; do not erase recovery data. Abrupt process termination can lose unflushed keystrokes, so do not promise crash-proof persistence.

Debounce main-window move/resize persistence, save normal bounds separately from maximized state, and clamp restored bounds to a present display. Default main content size is 1180×820, minimum 720×560, reduced to the available work area when necessary. Popup bounds are recomputed from the cursor and are not restored from a prior monitor.

## Local security and asset loading

Validate IPC senders against the registered webContents, their top frame, and the exact permitted local URL. Development may use only the configured loopback origin in development mode. Deny new windows, unexpected navigation, subframes, and permission requests. Validate all request payloads and reject unknown fields/operations. Request a single-instance lock before opening stores/windows.

Serve only known renderer assets through the local protocol using platform-correct path containment and an explicit MIME mapping, including raster assets. Never accept filesystem paths from the renderer. Production CSP restricts scripts, images, fonts, and connections to bundled resources; no external scripts or `unsafe-eval`. Motion needs dynamic style attributes, so permit the necessary local inline styles while keeping script policy strict. Document this distinction rather than weakening the entire CSP.

Library content and drafts render as plain text. The runtime does not open source URLs automatically or fetch missing assets. An external source link, if implemented later, requires an explicit user action and an allowlisted URL-opening method; it is not part of this bridge.

## Native acceptance

| Case | Expected result |
|---|---|
| Other app focused; shortcut pressed | Only Cue appears near the cursor, accepts typing, and does not raise the main workspace |
| Cursor at each corner; second display; differing scale | Bounds fit the current work area, without double DPI conversion or clipping |
| Open picker near screen edge | Window grows once, remains bounded, and Back restores compact layout |
| Click elsewhere / Escape / shortcut again | Popup hides; draft survives; preceding app can receive typing |
| Shortcut occupied / new invalid binding | Visible failure and menu fallback; previous valid binding retained |
| Rapid typing then Copy | Clipboard equals the displayed acknowledged prompt; no missing final character |
| Main and popup edits | Disjoint edits merge; same-field stale edit is recoverable; older events cannot overwrite newer text |
| Relaunch after rename | Cue opens; both drafts/favorites remain; old theme/last-view settings do not change dark/Cue defaults |
| Simulated persistence or IPC failure | Session-only/error state is truthful; no false Saved/Copied state; recovery retains text |
| Quit/reopen and hidden residency | One instance, no duplicate listeners/shortcut, bounded flush, paused hidden animations |

Use pure tests for placement with synthetic negative-coordinate/DPI work areas and store conflict/migration behavior. Use the actual Electron app for global shortcuts, focus, native clipboard, and persistence. Windows/Linux support is not established by this macOS pass; document unavailable display configurations instead of claiming them tested.

Deliver `03 Docs/Teleprompter Execution/Desktop-Handoff.md` with observed native flows, OS/Electron version, profile migration result, failure cases, and one next integration action. No installer/signing work is required.
