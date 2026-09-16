# Next native wave: truthful actions and focused surfaces

Date: 2026-09-16. Planning baseline: lead commit `3672a33`. Implementation and native acceptance remain separate. This packet supplements [11](11-Astra-Plan-Pack-Update-2026-09-16.md), preserves the original requirement/case IDs, and assigns the next bounded work. It does not report a new Sol review or native run.

## Decisions retained and evidence limits

Retain the latest user-directed hierarchy: Create/Edit is the only header control; one detail slot opens above the group row; prompt-owned compact controls stay 34 points high; the prompt grows through six lines; Apply and Preview share one fixed-width right column. Retain accepted v2 group rasters and native utility glyphs. Several Edit groups may be selected while only one detail panel is open.

The connected/squiggly product contour fix remains closed for its witnessed scope. Preserve non-interactive decorative material and one focus treatment. The later hierarchy observation is a lead witness, not an extension of Sol's earlier CLEAN verdict. B01–B03 remain partial overall, with search-specific B03 still unwitnessed; B04–B05 remain unwitnessed. No full N01–N30 pass is inferred.

| Existing blocker | Keep explicit in the next handoff |
|---|---|
| B01: group identity | Full transparent silhouettes, human group names, distinct configured/open/focus states at supported widths |
| B02: oversized/repeated imagery | One active axis, finite compatible choices, no family lens used as false record-specific evidence, honest compact fallback |
| B03: search focus | One visible focus treatment through search, clear, Escape and reopen; closed contour evidence alone cannot pass this |
| B04: exact text | Native Create/Edit Preview and Copy equality plus exact Library/Tokens text |
| B05: defaults/settings | New-only output default, preserved blanks/custom/recovery/Edit, real settings and truthful save/failure states |

The user's separate request for individually floating controls remains active and is now implemented in the lead dirty slice: `CueView.swift` no longer applies `CueShellSurface` around the whole stack, and `NativePanel.swift` disables the window shadow. Preserve that correction while the remaining native semantics and acceptance work proceeds; do not reclassify the previously witnessed contour defect as open.

Sol's pre-implementation visual gate was **NOT CLEAN** for the previous presentation. The lead then removed the visible root surface, replaced the selector well with compact text-led slots, removed visible axis subtitles and explanatory copy, changed the shared accent to orange, and verified the action column against collapsed, expanded, and long-prompt states. The dated native witness records this as a lead visual observation, not a new Sol post-change acceptance verdict.

Read the [native witness](../../Teleprompter%20Execution/Visual%20Reset%202026-09-13/Native/2026-09-16/Witness.md), [data handover](../../Teleprompter%20Execution/Visual%20Reset%202026-09-13/Native/2026-09-16/Data-Handover-Handoff.md), [Batch 002 decision](../../Library%20Curation/batches/2026-09-13-002/Lead-Review.md), and [model-route evidence](../../Teleprompter%20Execution/Artwork/Model-Route-Evidence.md) before dispatching the corresponding lane.

## Reference observations delegated to Luna

The user requested a Luna description rather than the planner watching the videos. Luna directly inspected both URLs in Codex's in-app browser on 2026-09-16. The planner uses that report; no reference implementation or measured motion curve is inferred.

| Reference | Luna's direct observations | Evidence limit and design consequence |
|---|---|---|
| [DeskMinder](https://deskminder.appps.od.ua/videos/demo.webm) | Playback succeeded. Observed states: a small floating `+`; an expanded translucent horizontal pill with a separate close circle, check, duration/time and utility control; a task-entry state; separate `+` and duration circles; return to one `+`. Desktop wallpaper and menu bar remained visible, without an enclosing app window | Supports independently bounded floating surfaces and changing horizontal composition. Native video-control interaction crashed the browser tab, so trigger behavior, overshoot and settling are unverified |
| [Liquora](https://framerusercontent.com/assets/MwbZoEj5zMiUfRWYdnnnJ49raQY.mp4) | One reliable frame showed a frosted rounded media panel over a blurred city desktop, with album art, track/artist text, elapsed/remaining time and playback utilities | Playback controls crashed the tab. No reliable transition sequence or timing was obtained. Do not claim this clip proves component-only geometry or a particular spring |

The elastic motion target comes from the user's explicit direction. DeskMinder provides observed support for the floating-surface topology; Liquora remains a limited appearance reference until playback can be inspected reliably.

## Screen jobs and visible affordances

| User job | Show | Reveal only on intent | Completion behavior |
|---|---|---|---|
| Write or revise a prompt | Create/Edit switch, group names/art, prompt, labelled Apply, smaller Preview action | Existing hover/focus affordances; compact output/reference controls inside the prompt bar | Prompt stays editable and grows through six lines, then scrolls internally |
| Set a direction | One upward detail panel for the activated group | Real compatible axes, current choices, bounded search, custom direction input | Selection uses the authoritative command; opening a panel alone does not select a direction |
| Review the result | On-demand exact Preview with format selection and Copy | Longer compiler text within a capped, scrollable detail surface | Copy uses that exact result; close returns to the preserved authoring context |
| Set output or references | Value-only output menus and Add Reference in the prompt bar | Compact menu or owned reference detail/chooser | Stored state drives values; cancellation preserves the draft and caret |
| Recover from a problem | One short actionable error at the affected action | Retry or recovery details only when needed | Preserve typed text; never show Applied, Copied, or Saved before the respective operation succeeds |

Preview starts closed. Do not restore a permanent disclosure header, summary of the compiled prompt, or group-setting subtitles on the resting composer. Keep the latest upward-slot interaction; reserve a dedicated focused detail surface for content that cannot fit its caps. A detail surface must not hide the user's writing context unnecessarily.

Apply commits the pending authoring operation through the helper. Its success means acknowledged draft change, not image generation, automatic paste, clipboard success, or confirmed disk persistence. Copy belongs beside the exact Preview result. Preview must flush or explicitly resolve pending authoring before requesting compilation; it must not quietly show the last applied text as though it includes current typing.

Remove remaining `Composition` under `Stage`, `Look` under `Finish`, and the extra axis subtitle under Optics. Axis labels belong inside the active detail panel. Remove `selectable`, `development fixture choice`, `UI hook`, `Future hooks`, and implementation explanations from ordinary product UI and accessibility hints. Missing capabilities get a concise unavailable state, not fabricated choices or a silent inert action. Technical diagnostics stay in developer evidence.

Use a single shared dark material/color system and restrained shared accent. Keep family artwork color inside the image; Stage and Finish do not acquire separate purple/orange interface tint systems. SF Symbols provide utility meaning, while custom control shapes, spacing, pressed states, and transitions provide the product's visual character.

## First dependency: authoritative native authoring

The helper exists; do not rebuild it. Extend the native adapter to consume the already-published domain contracts and full snapshots. The inspected Swift adapter still hard-codes Create, derives WHAT's expected field revision from the draft revision, and returns the previous bootstrap on failure. `CueView` then sets its Applied check unconditionally. These are implementation dependencies, not merely missing screenshots.

Publish the smallest native view model with active draft ID, draft text, field revisions, content version, command result, pending authoring state, and exact preview identity. Keep process I/O off the UI thread and serialize mutations. Preserve edits typed while an acknowledgement is in flight; failed or stale acknowledgement must not replace the current buffer. Helper loss produces unavailable/degraded state. Development fixtures remain an explicit test mode and cannot substitute for a failed production bridge.

| Native intent | Authoritative boundary | Required decision |
|---|---|---|
| Create/Edit switch | Existing mode command and independent `CueSnapshot.drafts` | Load the matching draft/buffer; switching to Edit never sends a Create mutation |
| Apply prose | Existing `set-what` envelope | Use `expectedFieldRevisions.what`; retain command identity on a same-session uncertain retry; show success only for an accepted `CommandResult` |
| Choose a real direction | Existing axis/atom/recipe/custom-text commands | Derive choices from the accepted library; obtain every touched field revision from the snapshot |
| Multiple Edit groups | View organization plus explicitly selected compatible Edit commands | A group name alone has no compiler meaning. Keep opening, checked group state, and real selected edits distinct. Reuse existing Edit recipes/custom fields where they express the requested operation; publish any necessary narrow extension before enabling an unsupported operation |
| Ratio/Resolution | Persisted `customText.output` | Read the new-Create default once. Never overwrite blank/custom/recovered/Edit output from hard-coded menu state. For arbitrary existing text, show a truthful custom value and require an explicit output edit before replacement |
| Preview/Copy | `CompiledDraftPreview` plus native clipboard result | Match draft ID, revision, format, and content version. Preserve expanded/shorthand and Create/Edit compiler behavior; add no label-based synthesis |

First vertical proof: type prose, apply a real accepted direction, edit prose again, Apply, Preview, Copy. The intervening direction mutation must separate draft revision from WHAT field revision so a fresh-empty-draft-only test cannot hide the adapter error. Repeat in Edit with an existing accepted recipe and confirm that Create remains unchanged. UI-only Edit group selection must not claim compiled operations until its mapping exists.

Native Copy preserves the existing text-size/validation policy and writes only the confirmed compiler text. Read back through the native clipboard and compare complete bytes, including Unicode and the last character. No automatic paste. Any unsupported required behavior stays explicitly pending rather than being replaced with a fixture pass.

## Native surface and motion completion

Keep the corrected upward panel slot, prompt-owned small menus, and fixed action-column width. Measure actual native bounds as well as SwiftUI intrinsic layout. `NativePanel.swift` still starts with a fixed 620 by 520 rectangle; wrapped text fitting within that rectangle is not full content-sized window proof.

The product root is clear. Material, tint, contact shadow, and opaque accessibility fallback belong to the visible prompt field, group controls, action controls, and the currently open detail surface. Do not reinstate interactive enclosing glass. Keep one material coordinator and one focus owner; rendering several visible regions does not require independent semantic controls to merge into a plate. If separate tightly bounded panels are necessary to prove transparent-gap input, the host owner must coordinate them as one surface lifecycle and test focus/owned-chooser behavior before adoption.

Use the current spring response `0.34` and damping `0.76` as a starting implementation value, not a measured description of either reference video. Press compression near `0.975` can rebound into a short, bounded settle. Make opening/closing feel elastic through the surface edge and illustration response; never scale editable text or add a second bounce to the caret. Preserve already-started velocity when reversing an interrupted transition. No animation restarts per keystroke or perpetual idle pulsing.

Panel expansion uses the upper slot while the prompt/group anchor stays stable where screen space permits. Near the screen edge, clamp once and cap/scroll detail content; do not chase the pointer or move buttons out from under a press. Ratio/Resolution menus do not trigger whole-composer reflow. Reduced Motion removes translation/scale/overshoot and uses immediate layout plus at most an 80 ms fade. Reduced Transparency makes each visible component opaque without adding a root background.

Acceptance needs a recorded native open, reverse-mid-flight, close, typing, and menu sequence. Observe frame bounds and input delivery over a harmless underlying app. Source spring constants, screenshot translucency, and AX presence do not prove motion quality, click-through, or Liquid Glass branch identity. For material identity record the executed native branch, OS/SDK/package identity, and preference state alongside direct appearance evidence; keep diagnostic instrumentation outside user-facing copy.

## Disjoint ownership

Paths are repository-relative. Existing mission owners continue; the runtime determines concurrency. Every worker preserves others' edits and requests an explicit transfer before writing outside its paths.

| Owner | Write scope | Dependency and deliverable |
|---|---|---|
| Lead | `src/shared/`, root helper/build configuration, native `Package.swift`, `Scripts/`, `AppBundle/`, `TeleprompterNativeApp.swift`, `src/main/` integration, canonical MAP/acceptance | Publish native model/command mappings; reconcile the evidence ledger; own runtime packaging, shared writer coordination, migration decisions, integration and final conclusions |
| Native bridge | `native/TeleprompterNative/Sources/TeleprompterNative/BridgeContract.swift` and assigned `Runtime/` files | Consume shared contracts. Deliver full snapshot/error semantics, mode-safe commands, asynchronous transport and native clipboard service; no Cue view or core compiler edits |
| Core/persistence | `src/core/` and focused tests | Reuse current compiler/store. Fix only proven runtime/persistence gaps; coordinate Electron lease adoption through lead-owned `src/main/` rather than broad extraction |
| Native UI/host | `CueView.swift`, `Views/`, `NativePanel.swift` | One owner avoids geometry/focus collisions. Copy/material refinements can begin independently; command wiring waits for the native model. Preserve the contour fix and current hierarchy |
| Witness | A fresh dated evidence subfolder and its handoff only | Runs integrated packaged app with one cursor owner and explicit profile. Records observations; cannot change code, clean user data, or close lead acceptance |

Curator separately owns a new versioned proposal folder only; the lead retains private impact-audit and import decisions. Illustration has no active generation mission. No worker changes the accepted seed, asset manifests, or original Batch 002 evidence as a side effect of native work.

## Execution and acceptance order

1. **Reconcile evidence and publish native semantics.** Use [04-Acceptance.md](04-Acceptance.md) as the authoritative N-case dictionary. The dated witness currently assigns several IDs different meanings, such as N16 to clipboard rather than defaults and N20–N22 to slash/mention rather than adaptive bounds/input. Preserve historical observations; publish a corrected mapping with exact original definitions. Track the closed contour subcase separately from B03 search focus. Publish the model and Edit/output mappings before dependent wiring.
2. **Prove real authoring and exact output.** Complete the vertical proof above, then native Create/Edit, expanded/shorthand, two-client conflict, late preview, failed Apply, Unicode, and clipboard readback checks. Cover N14–N15 and affected N27 conditions; finish the exact Library/Tokens resolver/display obligations of N10–N12 before closing B04. A clipboard service or old handover smoke alone is insufficient.
3. **Prove preservation and surface behavior.** Use disposable profiles and a temporary durable copy. Cover N13 settings success/error, N16 new/blank/custom/cleared/recovered defaults, restart, failed write, future-schema protection, and backup/restore. In the same integrated build, run affected N01–N09 and N17–N25: one/six-line text, long labels, finite choices, 20 open/close cycles, interrupted resize, transparent gaps, search/focus, reduced settings, chooser, shortcuts, outside-click, display edges and fullscreen. Complete N26–N30 slash/reference/Undo/IME/VoiceOver cases as their native capabilities land. Record unavailable physical hardware coverage explicitly.
4. **Revise Batch 002 independently.** Produce a new proposal; apply the semantic, namespace, import, and impact gates below. Do not delay native authoring on this lane or promote records to make the current UI appear populated.
5. **Review and close only witnessed subcases.** Lead requests one bounded Sol review through the existing project conversation/Core, followed by targeted fixes and at most one re-review. Source review does not replace runtime evidence. Run only affected checks after a repair; preserve the passing 79-test/build checkpoint as historical evidence, not a substitute for new changed-code verification. Illustration remains parked until its separate route and authorization gates pass.

The current durable lock coordinates helpers only. Before any canonical-profile write, retained Electron must honor the same exclusion, and the inventory/backup/compatible-restore decision must include preferences, reference bindings, and thumbnails. Those stores are inventory-only in the current handover. Never describe them as migrated. Never remove a lock or overwrite a live profile to make a witness proceed.

Node is still resolved externally. The next witness may use the documented explicit Node path, labelled as such. Self-contained packaging remains open until a pinned runtime is bundled or an explicit dependency policy is adopted and tested. Helper absence must present unavailable state rather than silently enable a fixture. These limits do not require installer/signing/distribution work beyond the existing native package.

## Batch 002 revision gate

Keep Batch 002 immutable and `REVISE / KEEP PROPOSED / REFERENCE-ONLY`. Use a new versioned proposal, such as Batch 003, after checking that its identifier is unused. Incorporate the [lead review](../../Library%20Curation/batches/2026-09-13-002/Lead-Review.md), not only its validator results.

| Problem | Required revision and proof |
|---|---|
| Focal/distance overlap | Focal owns field of view/environmental coverage and the focal cue. Distance owns viewpoint-driven relative scale. Preserve overlapping legacy wording as attributed source evidence rather than assigning the same effect to both normalized axes |
| Contradictory comparisons | Focal comparison keeps viewpoint fixed and permits image size/framing to change. Distance comparison keeps focal cue fixed and permits image size/framing to change as viewpoint moves. Hold identity, scene geometry, pose, light, aspect ratio and camera orientation consistent. Rewrite all five requests and every 2×2 cell together |
| Registry mismatch | Use actual `taxon.*`/`axis.*` IDs or one tested deterministic translation. Validate the complete current library plus candidates against the live adapter version; a batch-local pass is insufficient |
| Proposal import hazard | `CommonRecord.status: active` remains schema-valid. Enforce acceptance at the batch envelope/import boundary; tests must reject a proposed envelope even when all contained records are active. Confirm the shipped 14 IDs/content are unchanged |
| Missing impact evidence | Lead audits private drafts/favorites locally and publishes only a sanitized impact summary. Prove stable accepted wide35 semantics, complete affected legacy mappings, deterministic flat-bundle reconstruction, and no silent loss. Do not infer zero impact from empty placeholder arrays |

Acceptance to produce comparison evidence is separate from runtime promotion. The lead can accept exact revised request IDs for an authorized comparison while candidate records remain proposed; visual review and migration/import approval are later gates. This avoids requiring runtime promotion before evidence needed to decide promotion exists.

## Exact illustration-route decision

Keep practical generation **blocked**. The reviewed built-in tool provides no selectable/resolved model identity for `gpt-image-2.5-flare`; do not treat requesting its name in a prompt as route evidence. The historical route report does not prove that no other route can ever exist.

The route decision requires an authorized client that explicitly selects the exact model and produces attributable request/model evidence. Record provider/endpoint, requested model, resolved model or authoritative routing evidence, timestamp/request ID, accepted AssetRequest IDs, and generation authorization, with no credentials. Read-only capability discovery can proceed; a metered test is not implicitly authorized by a proposed request packet.

When route, briefs, and generation authorization all pass, generate only the accepted request IDs, review comparisons at full and native display size, and keep manifests pending until visual acceptance. Unknown-model outputs, alternate backends, and proposed taxonomy do not satisfy this gate. Existing accepted v2 identity assets remain usable with their recorded unknown-model provenance; they do not become Flare examples retroactively.

## Stops and reporting

Stop the affected action on wrong-draft mutation, false success, stale output, pending-text loss, clipboard mismatch, competing writers, unsafe restore, inaccessible controls, invisible click interception, an ownership collision, or an unknown illustration model. Preserve work and continue independent safe lanes. Do not repeat a blocked native interaction against ambiguous app processes.

Each handoff records changed paths, source/package identity, supported operation, focused verification, direct native evidence, and remaining cases. Lead keeps observed, source-only, partial, unwitnessed, and blocked outcomes distinct. This packet authorizes planning and bounded implementation dispatch through the lead; it records no new runtime pass.

Next action: lead publishes the native snapshot/result/command mapping and assigns the bridge and UI/host owners, with the first witness scoped to correct draft selection and Apply → Preview → Copy equality.
