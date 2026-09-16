# Native Cue witness — 2026-09-16

## Current Sol-gated visual reset witness

Sol reviewed the latest visual objections before this implementation pass and returned **NOT CLEAN** for the previous native presentation. The required correction was to remove the enclosing Cue surface, use compact upward slot rows instead of a selector well, remove repeated axis headings/subtitles, use one restrained orange accent family, and make the action column track the left block's intrinsic height.

The packaged app was then rebuilt and visually inspected in these states:

- Clear default: the transparent `NSPanel` shows individually bounded controls only; the root `CueShellSurface` and window shadow are gone.
- Optics open: a compact `Natural 50` slot appears above the group row. It has one value label and selected state; no repeated `Focal` heading or development copy is visible.
- Stage open: the unavailable state is reduced to a minimal dash slot rather than an explanatory panel.
- Long prompt: a four-line prompt increases the left block and the orange Apply/Preview column follows the same height.
- Color/focus: orange owns Create, open/selected slots, Apply, and the expansion treatment. The system blue focus ring is disabled for the product buttons; the prompt caret remains native text-editing feedback.
- Generated art: the accepted Optics/Stage/Finish rasters remain only in the collapsed family controls; no family raster is repeated as option-specific Natural 50 art.

This is a lead visual witness after Sol's design gate, not a new Sol post-change acceptance verdict. It supports the requested visual direction at the observed native window size. Edit-operation compilation, exact Apply → Preview → Copy parity, persistence, Reduced Motion/Transparency, VoiceOver/IME, physical keyboard, edge/display behavior, and formal Liquid Glass branch identity remain open.

## Current lead correction witness — hierarchy and adaptive behavior

This is a direct packaged-app observation after the user’s latest layout correction. It supersedes the prior visual ordering described below while preserving the earlier asset and contour evidence.

Package observed:

`native/TeleprompterNative/.build/TeleprompterNative.app`

Observed states:

- Default Create state: the only header control is the Create/Edit switch; no visible Cue title or brand appears. Optics, Stage, and Finish remain equal-row image-led controls using the accepted v2 generated rasters.
- Open Optics state: the Focal selection panel appears above the three group buttons. The prompt bar and the fixed-width Apply/Preview column remain aligned below/alongside it; the group row is not pushed underneath the prompt.
- Open Stage state: the Composition panel replaces the Optics panel in the same upward slot. The previous Optics edit selection remains selected when Stage is selected in Edit mode.
- Edit state: Optics and Stage can both remain selected while only one detail panel is open. The selection is exposed through AX as `selected edit operation`.
- Prompt bar: Ratio (`4:5`), Resolution (`2K`), icon-only Add Reference, `/`, and `@` are inside one rounded bar. Ratio and Resolution open compact menus without inserting a full composer panel. The compact controls are equal-height, and no explanatory Ratio/Resolution labels are visible.
- Long prompt: a long multi-clause value wrapped to four lines inside the bar without clipping the compact controls or changing the action-column width.
- Action column: Apply and Preview share one fixed column width. Apply is the tall primary action; Preview is icon-only and sits beneath it.

This is a lead implementation witness, not a new Sol review. It proves the requested layout and adaptive behavior at the observed native window size; it does not prove Edit-operation compilation, compiler/clipboard parity, persistence, Reduced Motion/Transparency, VoiceOver/IME, physical keyboard behavior, edge/display adaptation, or genuine Liquid Glass branch identity.

Focused checks for this correction passed:

- `npm run typecheck`
- `npm run test:logic` — 16 files, 79 tests
- `npm run build`
- `swift build --package-path native/TeleprompterNative -c debug`
- `native/TeleprompterNative/Scripts/package-app.sh`

## Outcome

The bounded native parity fix is implemented and packaged. Live evidence shows the three accepted v2 Cue identity assets in the native controls and their corresponding in-flow panels. The bounded parity result is **CLEAN / partial**: Sol's final post-witness review accepted the contour and image-led parity fix, while the broader native acceptance matrix remains partial or unwitnessed.

No full B01–B05 pass is claimed. This witness does not close compiler/clipboard equality, persistence, reduced-transparency or reduced-motion behavior, search, VoiceOver/IME, physical hardware keyboard, adaptive edge cases, or the remaining native acceptance matrix.

## Scope and bounded source fix

The reviewed package is:

`native/TeleprompterNative/.build/TeleprompterNative.app`

The starting lead HEAD was `c7e5d26`. The later parent-authorized parity fix changed only the native Cue/package seam and this dated evidence folder:

- `CueView.swift` loads `group-optics-v2.png`, `group-stage-v2.png`, and `group-finish-v2.png` with an explicit `NSImage` path, preserving transparent object bounds and utility SF Symbols.
- The enclosing `CueShellSurface` retains one glass material owner but no longer marks decorative enclosing geometry interactive.
- `Package.swift` processes the native `Resources` directory.
- `package-app.sh` copies the three assets into `Contents/Resources` and requires the generated resource bundle.

`MAP.md`, the source catalog, the v1 Electron layer, and unrelated worktrees were not changed.

## Sol review record

The pre-witness Sol review required exact package identity, disposable persistence, helper-child proof, direct AX/bounds evidence, conservative status vocabulary, and no claim that normal translucency proves genuine Liquid Glass. Its explicit visual verdict was **NOT CLEAN**: competing interactive glass, nested rounded surfaces, and the macOS focus ring were diagnosed as the likely source of the connected/squiggly contour. The requested smallest direction was one material owner, clean group hit regions, one focus treatment, the accepted v2 rasters for Optics/Stage/Finish, compact collapsed controls, and truthful unavailable states.

The post-witness review was submitted after the fix with the final package identity, screenshots, AX sequence, and window-bound classification. Sol returned **CLEAN for the bounded Cue parity fix**. Sol accepted the separated contours, compact image-led controls, one focus treatment, utility SF Symbols, and the host-edge classification. Sol also kept B01–B03 partial and B04–B05 unwitnessed, with no full N01–N30 passes.

## Runtime identity and safety

- Host: macOS 26.6.2, build 25G83, arm64; Swift 6.3.2; SDK 26.5; developer directory `/Library/Developer/CommandLineTools`.
- Bundle ID: `local.teleprompter.native`; display name: `Teleprompter`; minimum macOS: 26.0.
- Launch: `TELEPROMPTER_NODE_PATH=/Users/blinblon/.hermes/node/bin/node TELEPROMPTER_PERSISTENCE_PROFILE=disposable` followed by the exact packaged executable.
- Live proof: app PID `84314`; helper child PID `84316`; child command resolved to the packaged `Contents/Resources/teleprompter-helper.js`.
- Disposable profile had no persistence path. The canonical draft checksum stayed `adcf8a11cc3d728e08aff77d1f9e13f040f33914a490f01bc5b6802d19ebc9e6` before and after the run.
- Only the c657 app/helper were stopped. Sibling Image Director processes and canonical data were left untouched.

Current packaged hashes:

| Item | SHA-256 |
| --- | --- |
| Native executable | `fb183c84b6323749539d6043bea5f657802fd0398fabe06e7412e572637a316f` |
| Packaged helper | `ffb64a3784f7c187c559ea66da9858e8ee09d6bae2cc76561c477ecd16662cc1` |
| `group-optics-v2.png` | `4398b257def406bd9781d8340adbb22e9e0ba7a6e882ca47c302f2bc45c41165` |
| `group-stage-v2.png` | `6f70a228b350447f989e8217bdeb798287adbd76964907d998e5ee0468e45c0e` |
| `group-finish-v2.png` | `b0a629ce4d492e30efbcab0594bc7f4c7acb1a89414a8088f49d89c65ab5b6f5` |

## Build and package checks

- Initial `npm run typecheck:helper` failed because this isolated worktree had no `node_modules` (`tsc: command not found`).
- `npm ci --ignore-scripts` installed 113 packages with 0 reported vulnerabilities in this worktree.
- `npm run typecheck:helper`: PASS.
- `npm run helper:build`: PASS; helper emitted to `out/helper/teleprompter-helper.js`.
- `swift build --package-path native/TeleprompterNative -c debug`: PASS.
- `native/TeleprompterNative/Scripts/package-app.sh`: PASS.
- `codesign --verify --deep --strict`: PASS.
- `git diff --check`: PASS.

## Visual and interaction evidence

Evidence files in this folder:

- `02-native-cue-image-led-window.png` — collapsed native Cue with all three v2 assets visibly present.
- `03-native-optics-open-window.png` — in-flow Focal panel with the Optics asset and separate rounded group controls.
- `04-native-stage-open-window.png` — Stage asset and truthful `No mapped choices in this fixture.` panel.
- `05-native-finish-open-window.png` — Finish asset and the same truthful unavailable state.

The window-only Optics capture was `x=446,y=105,w=620,h=488`, alpha `1.0`, layer `3`. The thin rectangular perimeter appears at the AppKit window capture boundary; the rounded group surfaces are separate and do not form a connected button outline. It is classified here as the host/window capture edge, not a product contour. This classification does not claim that every OS screenshot artifact is absent from every capture mode.

AX identifiers remained stable for `cue-group-optics`, `cue-group-stage`, `cue-group-finish`, `cue-ratio`, `cue-resolution`, `cue-add-reference`, `cue-what`, `cue-apply`, `cue-slash-hook`, `cue-mention-hook`, and `cue-preview-action`.

CUA-delivered keyboard sequence: Tab cycled Optics → Stage → Finish → Ratio → Resolution → Add Reference → Prompt → Apply → Slash commands → Reference mentions → Preview → Optics. Space opened Optics; Escape closed it and returned focus to Prompt. Return on focused Optics had no effect. These are accessibility-event observations, not proof of physical hardware keyboard behavior.

The current witness stopped before rerunning Apply → Preview after the parity fix. The helper child was live, but exact compiler output, native clipboard equality, and preview rendering remain unverified in this witness.

## Acceptance matrix

| Case | Status | Witness ceiling |
| --- | --- | --- |
| N01 | partial | Native Cue image-led wide state witnessed; full default/output parity not witnessed. |
| N02 | partial | Prompt editing is present; durable saved-draft behavior not witnessed. |
| N03 | partial | Image-led group controls, focus, and Space path witnessed; hover, tooltip, and full press behavior not closed. |
| N04 | partial | Optics Focal row and v2 asset witnessed; fixture cardinality and full choice behavior not closed. |
| N05 | partial | Stage/Finish image panels and truthful unavailable state witnessed. |
| N06 | unwitnessed | Search surface not exercised. |
| N07 | unwitnessed | Search results behavior not exercised. |
| N08 | unwitnessed | Search keyboard behavior not exercised. |
| N09 | unwitnessed | Search empty/error behavior not exercised. |
| N10 | unwitnessed | Library/filter behavior not exercised. |
| N11 | unwitnessed | Library selection behavior not exercised. |
| N12 | unwitnessed | Library persistence behavior not exercised. |
| N13 | unwitnessed | Library copy/record behavior not exercised. |
| N14 | unwitnessed | Exact Apply → Preview compiler and clipboard equality not rerun after the fix. |
| N15 | unwitnessed | Preview surface details not exercised. |
| N16 | unwitnessed | Copy confirmation/native clipboard behavior not exercised. |
| N17 | partial | Group open, in-flow panel, close, and focus return observed; complete native sequence and motion not recorded. |
| N18 | unwitnessed | Reduced Motion was not toggled. |
| N19 | unwitnessed | Shortcut, outside-click, and native-copy paths not closed. |
| N20 | unwitnessed | Cursor-positioned slash popup not exercised. |
| N21 | unwitnessed | Mention popup not exercised. |
| N22 | unwitnessed | Popup filtering/selection not exercised. |
| N23 | partial | Prompt edit/select and focus return were observed; IME, drag, and chooser paths were not. |
| N24 | unwitnessed | Natural 50 row is a read-only fixture; persistence and editing were not closed. |
| N25 | unwitnessed | Adaptive edge, reduced transparency, and fullscreen/display behavior were not exercised. |
| N26 | unwitnessed | VoiceOver behavior not exercised. |
| N27 | unwitnessed | Physical keyboard behavior not proven. |
| N28 | unwitnessed | IME behavior not exercised. |
| N29 | unwitnessed | Accessibility announcements/focus narration not exercised. |
| N30 | unwitnessed | Full VoiceOver and IME acceptance case not exercised. |

| Gate | Status | Witness ceiling |
| --- | --- | --- |
| B01 | partial | Image-led equal-slot controls and no connected contour were observed; all hover/pressed/narrow states are not closed. |
| B02 | partial | v2 assets are not repeated as generic icons; complete record/cardinality proof is not available. |
| B03 | unwitnessed | No search surface was exercised, so the one-focus-ring result cannot close this gate. |
| B04 | unwitnessed | No fresh post-fix Apply → Preview exact compiler/clipboard witness. |
| B05 | unwitnessed | Disposable profile only; defaults, durable persistence, settings, and reload were not exercised. |

Remaining ceilings include reduced transparency, reduced motion, full Liquid Glass branch identity, VoiceOver/IME, physical hardware keyboard, clipboard/compiler parity, durable persistence, search and popup behavior, shortcut collision, outside click, edge/second-display/fullscreen layout, and complete native acceptance. Normal rounded translucency is recorded as visible native material only; it is not a formal genuine-Liquid-Glass pass.

## Files and commit scope

The commit contains the bounded native source/package fix, the three copied accepted v2 assets, and the dated PNG evidence plus this handoff. Generated `node_modules`, `out`, and `.build` artifacts remain ignored and are not committed. No `MAP.md` update was made by this worker.
