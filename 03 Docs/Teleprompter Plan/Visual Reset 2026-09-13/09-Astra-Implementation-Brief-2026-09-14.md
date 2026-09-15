# Astra brief — complete the visual reset

Date: 2026-09-14. Scope: implementation planning and dispatch. **Visual acceptance: OPEN.**

The user reports that five main grievances remain unresolved. Treat B01–B05 below as explicit acceptance blockers, even where an earlier handoff says accepted. Complete the adaptive Cue scope alongside them. This brief routes the existing [reset plan](00-Start-Here.md); it does not replace its 31 requirements or 30 native cases.

**Architecture override — 2026-09-15:** the new implementation target is native macOS SwiftUI/AppKit with genuine Liquid Glass. Electron is retained for compatibility comparison only and cannot close native acceptance. The bounded native spike lives under `native/TeleprompterNative/`; its current fixture bridge must be replaced by a versioned local JSON-lines adapter to the authoritative TypeScript store/compiler.

## Objective and reading route

Deliver a compact, image-led composer with a smoothly resizing translucent popup, exact compiler preview, saved new-draft output defaults, real shortcut settings, compact parameter controls, `/` quick add, and `@` reference mentions. Success requires fresh native evidence of the intended appearance and behavior.

Read `AGENTS.md` and `MAP.md`, then this brief, [visual contract](01-Visual-Contract.md), [adaptive Cue](07-Adaptive-Cue-Contract.md), and [quick add](08-Quick-Add-and-References.md). Use [worker missions](03-Worker-Missions.md) for dispatch details and [acceptance](04-Acceptance.md) for N01–N30. Consult [native research](05-Adaptive-Window-Research.md) only for the host decision and [interaction research](06-Compact-Interaction-Research.md) for the chosen controls. The [mismatch log](02-Reaudit-and-Mismatch-Log.md) links the original annotations and September 13 native before images.

Use os-build for implementation and impeccable for the affected UI. Preserve existing dirty work. One lead owns integration, publication, and conclusions; one witness owns the native cursor at a time. This planner has not run a new native session or implemented application changes.

The product and prompting skill are **Teleprompter** throughout new plans, implementation, acceptance copy, and handoffs. The live skill source is `teleprompter/`. The retained renderer surface uses `window.teleprompterLegacy`; the primary Cue bridge remains `window.teleprompter`. Use those current names and verify path existence instead of reconstructing paths from an older product name.

## Five blockers that must remain visible

All five start **OPEN**. Record source progress separately from native acceptance.

| Blocker | Required correction | Closure evidence |
|---|---|---|
| **B01 — Group identity** | Replace generic framed buttons and square image wells with image-led horizontal capsules. Optics, Stage, and Finish have one outer boundary, an independent contained object region, and a dominant group name. Main geometry normally uses a 64px-high capsule and 72×56 object box; popup summaries are 52px high with a 40px object. Keep configured, open, and focus states distinct. | Fresh native main and popup captures at wide/narrow widths, with hover/focus/open states. Compare the annotation and supplied reference with the actual result; every silhouette remains visible. N01–N03, N08–N09. |
| **B02 — Oversized/repeated Optics art** | Remove the same lens as a depiction of focal length, depth, and viewpoint. Use the existing family object for group identity; options use accepted practical art or an honest compact text/vector fallback. One axis expands at a time, with at most one visual focus area. Labels occupy a separate region; no parent clipping or fake neighbors. | Asset audit applied to actual native Optics, Stage, and Finish states; long labels, finite choices, and the smallest supported surface remain legible. Show the full object and list boundary together. N04–N05, N20, N24. |
| **B03 — Double search focus** | Give search one intentional visible focus indicator. Reconcile the input and wrapper focus rules, including the generic CSS cascade, while preserving keyboard visibility. | Native keyboard focus, typing, no-results, clear, and Escape sequence. No second ring appears when focus moves or the card morphs. N06, N18. |
| **B04 — Synthesized preview** | Remove `PreviewPanel`'s assembly from display labels. Render the same compiler output that Copy uses, with draft/revision/format/content-version matching. Flush pending authoring before the request; reject stale responses. Library/Tokens display the exact record text through the shared read resolver. | Create expanded/shorthand and Edit previews agree byte-for-byte with compiler output and independently read-back clipboard text. Exercise rapid mode/format changes and unavailable/error states. N11–N12, N14–N15, N27. |
| **B05 — Decorative output/default settings** | Apply `4:5 aspect ratio; 2K resolution target` once when creating a genuinely new Create document, through persisted `customText.output`. Preserve saved blank/custom drafts, reset/clear, recovery, and Edit. The control reflects stored text. Connect a real shortcut settings dialog to the existing save/error/persistence seam. | New profile creation plus safe reload shows the stored default and matching preview/copy. Existing blanks/custom text and Edit remain intact. Demonstrate settings success and returned failure in disposable fixtures. N13, N16. |

These are acceptance blockers, not requests for more explanatory badges. Do not conceal them under completed test counts or asset integration status.

## Current source snapshot: continue the work already started

Read-only inspection on September 14 found partial implementation in the dirty checkout. Recheck these exact files at dispatch because other owners are active.

| Location | Observed progress and remaining connection |
|---|---|
| `src/shared/teleprompter-types.ts`, `src/shared/ui-types.ts` | Draft types now exist for preview, measured layout, quick add, reference bindings, settings, and `newDraftDefaults`. Several bridge methods remain optional; `AcceptQuickAddCommand` is explicitly separate from the live command route. Types alone do not establish validated or callable behavior. |
| `src/renderer/src/app/TeleprompterApp.tsx` | Preview request/state handling, a measured-layout callback, and a shortcut settings dialog have been added. Preserve and integrate this work; do not dispatch a second implementation of it. Native behavior remains to be witnessed. |
| `src/renderer/src/ui/CueSurface.tsx` | The inspected component still requests compact/expanded sizes, assembles preview sections from labels, and derives output display from selected atoms. It does not yet consume the new preview/layout props. This is the principal UI integration gap. |
| `src/main/index.ts`, `src/preload/index.ts`, `src/main/draft-store.ts` | The inspected main/preload still expose the existing copy route without the new read/layout endpoints. New documents remain blank; `parseDraftStore` also calls the document factory for recovery. Separate new creation from recovery before applying defaults. |
| [Asset usage map](../../Teleprompter%20Execution/Visual%20Reset%202026-09-13/Asset-Usage-Map.md) | A September 14 read-only audit already supplies alpha bounds and display guidance. The three v2 objects are family identity assets. It attributes the observed option crop/repetition to integration, not malformed source rasters. Consume this map rather than repeating the audit. |

The September 13 native before captures remain historical evidence. No fresh native after comparison was produced for this brief. Prior mission descriptions of “current” source refer to their initial audit; the snapshot above records the later partial work without accepting it.

## Mission 0 — finish and publish the typed contracts first

The lead reviews the existing additions in `src/shared/teleprompter-types.ts`, `src/shared/teleprompter-validation.ts`, `src/shared/ui-types.ts`, and their `src/shared/teleprompter.ts` exports. Publish one short contract-status table in the execution handoff: final type/method, validator, producer, consumer, focused check, ready or pending. Extend the existing definitions; do not duplicate them inside workers.

| Contract | Decision required before consumption |
|---|---|
| Exact text and settings/defaults | Final read request/result identity and error handling; same compiler/text resolver as Copy; renderer pending/stale handling. One new-document policy, with restore/recovery/reset excluded. Keep existing shortcut persistence and error semantics. |
| Adaptive surface | Validated session/layout IDs, finite DIP measurements, accessory caps, and applied bounds/interior response. Main owns screen selection and anchoring. The reset path uses measured layout; an unavailable method reports a bounded unsupported state rather than silently counting two-size behavior as complete. |
| Atomic quick add | Connect `accept-quick-add` to the real envelope, command union, validation, and dispatch path. Validate accepted IDs, exact query range/text, content version, and every touched field revision. Text replacement plus semantic selection is one mutation and one Undo entry. Specify acknowledgement/conflict and buffered typing behavior. |
| Reference bindings | Define the callable local binding/list/chooser/thumbnail path and persistence/version rules. Preserve stable Image N numbers, use opaque handles, and distinguish role metadata from mention insertion. An owned chooser cannot trigger outside-dismissal. No upload or file path enters compiled text. |

UI anatomy and asset integration can advance while a contract is pending. Dependent authoring/native integration begins when its contract is ready. Root dependencies and any native transport changes require the lead's integration decision; workers do not invent competing APIs.

## Disjoint ownership and dependencies

All paths below are repository-relative. Each worker is **not alone in the codebase** and must preserve other owners' changes. Reconcile existing dirty ownership before dispatch; never reset, clean, stash, broadly format, or overwrite source material.

| Mission | Exact ownership | Dependency and handoff |
|---|---|---|
| Lead | `src/shared/`; `src/renderer/src/app/TeleprompterApp.tsx`; root configuration; `MAP.md`; top-level plan pointer and execution acceptance | Own Mission 0, reconciliation of the existing settings dialog, final integration, and acceptance. Keep orchestration here; transfer a presentational component to UI only through an explicit serial handoff. |
| UI / motion | `src/renderer/src/ui/`; `src/renderer/src/styles/` | Own B01–B03, preview/output presentation, compact controls, editor suggestions, and measured fixtures. Consume lead contracts and the existing asset map. Write `UI-Handoff.md`. |
| Assets | Default read-only access to `src/renderer/src/assets/teleprompter/`; ownership of `Asset-Usage-Map.md` | Existing audit is ready. Answer only new integration questions. No renderer/style edits, regeneration, manifest/provenance rewrite, or content promotion in this mission. Any necessary derivative gets a separate exact-path assignment. |
| Desktop | `src/main/`; `src/preload/`; focused tests within those paths | Implement validated reads, new-only defaults, measured native layout, local bindings, and focus/lifecycle behavior. Pair with UI fixtures for the host spike. Write `Desktop-Handoff.md` and `Host-Decision.md`. |
| Engine | `src/engine/cue/`; focused tests within that directory | After Mission 0, implement atomic quick add through existing selection/preset/recipe semantics. Keep compiler meaning and content acceptance unchanged. Write `Engine-Handoff.md`. |
| Native witness | `Native/` evidence and `Native-Comparison.md` only | Runs after an integrated build with exclusive cursor access. No code, asset, preference cleanup, or final acceptance edits. Reports N01–N30 and B01–B05 separately. |

Write new handoffs under `03 Docs/Teleprompter Execution/Visual Reset 2026-09-13/`. Date every report and use a fresh `Native/2026-09-14/` subfolder for September 14 captures, or the actual later capture date. Preserve older evidence. Queue missions within available runtime capacity; disjoint ownership does not require simultaneous agents.

## Adaptive host and compact interaction decisions

Start with the native macOS spike. Use the five UI fixtures—one-line bar, wrapped WHAT, six-result list, compact parameter card, and long preview—inside an AppKit `NSPanel` with SwiftUI content. Test actual bounds, transparent-gap input, caret/IME stability, interruption, display-edge anchoring, and Reduced Motion/Transparency before accepting the native route. Use the bounded repetitions and fallback criteria in file 05. The installed Swift 6.3.2/macOS 26.5 SDK can be used for the first command-line build; full Xcode and `xcodebuild` are currently unavailable and must be recorded as a limitation.

The target rests near 540×64 DIP and grows with measured content. Visible material belongs to the capsule/card/action shapes. No permanent oversized host, fixed tall background, pointer chasing, or invisible click-catching gaps. Coordinate native bounds and renderer motion through one owner; keep editable text mounted and unscaled. Defaults are 160–220ms expansion and 120–160ms collapse, with immediate or ≤80ms fade under Reduced Motion. A supplied still reference establishes shape and hierarchy, not demonstrated motion.

Use the native `NSPanel` route as the primary host and keep the existing Electron app only as a compatibility comparison. Prove genuine Liquid Glass and its opaque Reduced Transparency fallback; a CSS/WebView transparency result is insufficient. Keep one authoritative store/compiler behind the versioned local adapter. The lead assigns exact native paths before implementation. A whole-app framework migration beyond the bounded native surface is outside this reset. Literal notch attachment remains optional and must have a non-notched fallback.

Pick controls by accepted option semantics: short rows/segments, a finite camera-style ticker for ordered discrete cues, explicit toggles for multi-select, and a bounded searchable list for many choices. Numeric scrubbers require published units/range/step; artwork does not create numeric semantics. Drag highlights, release commits once, Escape cancels, and keyboard/direct entry remain usable. Expand only one axis, cap suggestions at six 44px rows, and scroll within available height. Context menus contain secondary actions; they do not hide the primary selection path.

`/preset`, `/token`, `/edit`, and `/snippet` search the accepted compatible corpus. Snippets insert literal approved text; other commands use their declared semantic action. `@` chooses the exact numbered reference with an optional local thumbnail. Preserve caret focus and text on cancel/conflict. IME, paste, email/path prose, and remote updates must not spuriously open suggestions. File 08 owns the full trigger, atomic acceptance, and persistence rules.

## Re-audit and completion

1. Record current ownership and finish Mission 0. Dispatch the independent lanes with only their relevant contracts; retain the existing asset audit and partial lead implementation.
2. Integrate the host spike and affected UI/engine/desktop work. Run `npm run typecheck`, `npm run test:logic`, and `npm run build` for the changed dependency cone; repeat only affected checks after a fix.
3. Capture fresh native main, Optics, search focus, preview, output/settings, and adaptive states. Record build invocation/dirty source identity, mode, draft fixture, native/content bounds when available, screenshot dimensions, and input method. Compare original reference, September 13 before, and new after without modifying evidence images.
4. Maintain two ledgers: N01–N30 case results and B01–B05 visual blocker closure. Use pass/fail/partial/unwitnessed/blocked with linked evidence. Motion needs a recording or described live witness; clipboard contents and persistence need actual observations. Browser output and technical test counts cannot close visual approval.
5. Return each defect to its owner and recheck its affected cases. The lead closes visual acceptance only after reviewing fresh native comparisons that resolve all five blockers and the required reset states. User-reported remaining mismatches reopen acceptance. Unavailable hardware or practical art stays explicit, with no fabricated pass.

Retain offline operation, independent Create/Edit drafts, source-faithful compilation, intentional blanks, and the existing 14 accepted runtime records. Proposed Batch 002 content remains inactive; practical artwork still requires an evidenced exact `gpt-image-2.5-flare` route. Preserve `teleprompter/` source material, historical plans, and saved user data while consuming the lead's current Teleprompter naming and storage configuration.

Next action: lead reconciles Mission 0 against the current dirty contracts and dispatches the first ready missions using this brief.
