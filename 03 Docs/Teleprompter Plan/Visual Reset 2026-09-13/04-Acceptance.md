# Acceptance — visual reset

Status at planning delivery: **open**. Two native before images exist; implementation and after evidence have not been produced by this pack.

## Evidence rules

| Level | Proves | Does not prove |
|---|---|---|
| A — Asset | A file exists, has the inspected alpha/geometry, and has its recorded provenance | Correct use, photographic meaning, or native appearance |
| B — Integration | The intended file/control is present in the built native surface | Reference fidelity, clipping-free states at other sizes, or interaction quality |
| C — Visual comparison | Geometry, hierarchy, contrast, and state match the target at a stated native size | Motion, copy, persistence, or shortcut behavior |
| D — Interaction | A described input produced the independently observed native effect | Other input methods, displays, hosts, or untested states |

Use **pass**, **fail**, **partial**, **unwitnessed**, or **blocked** for every case. A fail requires an observed defect. Blocked names the missing dependency. An unwitnessed case has no adequate observation yet. Overall acceptance remains open while a required visual/interaction case fails or is unwitnessed. If practical artwork is blocked, distinguish “renderer geometry accepted” from “complete visual direction accepted”; never silently close the image-example requirement.

## Before/after method

Keep the planner's [main](Evidence/01-native-main-before.jpg) and [Optics](Evidence/02-native-optics-before.jpg) captures unchanged. The comparison report links the corresponding original reference and annotation beside each new native after capture. Do not resize or recolour the evidence image to make it resemble a reference. Additional crops may illustrate a defect, but retain the full native capture and explain the crop.

Record surface URL/build invocation, workspace revision or dirty identity description, screenshot pixel dimensions, observed native bounds and content viewport when available, UI state, mode, and input method. Screenshot pixels alone cannot establish CSS dimensions. Use a disposable draft/profile or an explicitly coordinated test draft; do not erase or restore the user's real draft. Record the user's takeover as a limit and release cursor control immediately.

Capture before/after at the same content width, mode, and representative selected values where practical. If the original draft has changed, use a disposable equivalent and state the difference. No fake after mockups. Store new files in `03 Docs/Teleprompter Execution/Visual Reset 2026-09-13/Native/` and link them from `Native-Comparison.md`.

## Required native matrix

| Case | Setup and action | Pass conditions | IDs / level |
|---|---|---|---|
| N01 | Main Cue, new Create, wide composer; no directions selected | No brand/page overline; compact mode control; joined composer; all three objects fully visible and names dominant; no Choose/zero counts; real saved output default | R01–R07 / C |
| N02 | Main Cue, existing populated Create draft | Selected checks differ from open state; no raw IDs or dominant value stack; WHAT remains editable/selectable; existing output preserved | R03–R07 / C,D |
| N03 | Hover, press, keyboard-focus, and open each group in turn | Stable hitbox; bounded object motion; one visible focus ring; pressed/open/configured states distinct; full tooltip values accessible; no image clipping | R03,R04,R23,R25 / C,D |
| N04 | Open Optics with current seed; change focal choice; inspect depth and viewpoint | Full image/label separation; no same lens masquerading as three photographic effects; finite list; one-/two-option axes do not fake neighbors; scope correct | R17,R18 / C,D |
| N05 | Open Stage and Finish, include long labels and missing practical image | Same geometry and hierarchy as Optics; every compatible axis reachable; fallback honest; no empty filler cards | R17,R18 / C,D |
| N06 | Focus search, search a hit and no results, clear, use Escape | One focus ring; correct scope; no clipped text; concise no-results state; Escape sequence and focus return correct | R19,R25 / C,D |
| N07 | Leave untouched field empty; select then clear an axis; type custom camera direction | No Leave blank/Choose one UI; clear exists only when relevant; one camera editor; intentional empty survives preset interaction/reopen; custom text appears once | R20 / C,D |
| N08 | Main at minimum supported content width and at 200% text zoom | No navigation overlap/body horizontal scroll; three compact groups or specified narrow strip; Copy reachable; long text does not enter art area | R02–R07,R24 / C,D |
| N09 | Native adaptive quick bar; open parameter overview/picker/preview and return | Measured content-sized surface; visible Copy; no giant stack or empty viewport; same draft; stable launch anchor | R24,R25,R26 / C,D |
| N10 | Library browse, preset detail, Edit recipe detail, then Use in Cue | Visual covers, concise human labels; no repeated headings/counts; obvious primary Use in Cue; correct target/mode; opening detail alone does not mutate | R08–R11 / C,D |
| N11 | Inspect preset's directions, open source disclosure, copy prompt | Human deconstruction; no raw-ID table or implementation lede; custom chevron; Copy belongs to exact prompt block; original source text remains accessible | R11,R12 / C,D |
| N12 | Tokens wide and narrow; search label/shorthand; inspect, use, copy | Category index/grid/inspector layout; no chip cloud or duplicate raw labels/counts; exact expansion readable; actions clear and keyboard reachable | R13–R15 / C,D |
| N13 | Settings open; inspect shortcut; exercise valid change and a returned error in a safe fixture | Real state/control; no implementation banner; error specific; failed change does not claim saved; actual user shortcut preserved after a disposable test | R16 / C,D |
| N14 | Create Preview with at least one atom whose expansion differs from shorthand | Text is readable, no table grid/title/count/footer boilerplate; format visibly changes; copied bytes match the corresponding compiler result | R21,R22 / C,D |
| N15 | Edit Preview with recipe slots, reference role, and preserved domains | BASE/REFERENCES/CHANGES/KEEP reflect existing compiler; no Create-only substitute; rapid mode/format switch cannot reveal another request's late result | R22 / D |
| N16 | New Create, existing blank/custom Create, Edit, and explicit clear; reopen/reload safely | Default applies only to new Create; actual output text agrees with shown values; no overwrite of saved/cleared output; no silent crop request in Edit | R06 / D |
| N17 | Record a short native sequence: mode switch, group open, choice settle, close, preview, Copy | Connected surface motion; sharp stationary text; finite settle; no content jump, drifting hitbox, double focus tree, or pre-acknowledgement Copy check | R23 / D |
| N18 | Repeat key transition/focus sequence with reduced motion | No magnetism, overshoot, travel, or decorative perpetual motion; instant/≤80ms fade; every control still reachable | R23,R25 / C,D |
| N19 | Small native smoke after integration: current supported shortcut/menu open, outside dismissal, native Copy | Previously accepted lifecycle still works on this host; state preserved; actual copied text observed. Limit claim to the input method actually used | R25 / D |
| N20 | Bar → wrapped draft → six-result list → compact parameter → long preview → bar | Actual bounds follow visible content and caps; no fixed 364/620px background; no oscillating resize, clipped last row, or unreachable Copy | R26 / C,D |
| N21 | Rapidly change accessory/width, type during resize, then Escape/hide/reopen | Latest layout wins; old sessions/completions cannot resize or reopen new/hidden Cue; caret and draft remain intact | R26,R27 / D |
| N22 | Inspect connected capsule and detached utility candidates over a harmless other app; click transparent gaps/edges | No rectangular frosted slab or large invisible click catcher; intended recipient receives input once; native fallback used if stock route fails | R27 / C,D |
| N23 | Type with IME, select text, drag a control out of bounds, open/cancel owned file chooser | Stable focus and capture; correct drag cancel/commit; no blur-hide loop; chooser cancellation restores the same draft/context | R27,R31 / D |
| N24 | One, three, many, and multi-select option fixtures; real current seed | One active axis and bounded list; no invented options; no numeric value outside published semantics; scrolling never toggles a value | R28 / C,D |
| N25 | Adaptive surface near display edges; Reduced Motion/Transparency; fullscreen/Space tests where available | Input stays visible; anchor stable; proper opaque/instant fallbacks; record unavailable physical display coverage explicitly | R26,R27 / C,D |
| N26 | `/preset`, category-plus-colon search, `/token`, `/snippet`, and Edit recipe flow | Correct accepted target/action; query replaced at its exact range; literal snippet has no hidden selection; no inactive corpus leakage | R29 / D |
| N27 | Double acceptance, stale field/version, two windows, typing during acknowledgement, Undo, then Copy | One atomic change or explicit conflict; no lost prose or toggled-off duplicate; Undo restores text and semantic state together; copied output agrees | R30 / D |
| N28 | `@` with two similarly named images, explicit numbers/roles, cancelled/local image binding | Selected Image N is exact; local binding/role are distinct from text insertion; chooser does not cause lost input or implicit upload | R31 / C,D |
| N29 | Reopen draft; move original local file; remove/rebind a reference | Labels/numbers persist; missing association remains unbound; no automatic renumbering, number reuse, or wrong-file substitution | R31 / D |
| N30 | Suggestion keyboard/VoiceOver, IME, email/path prose, paste, Escape, remote updates | Accessible active result, preserved native text editing; no unsolicited menu from paste/sync; dismissed trigger stays closed until context changes | R29,R30,R31 / C,D |

Long labels, copy failure, command conflict, and unavailable preview should be exercised in controlled fixtures where possible. A fixture can establish functional edge handling, but its screenshot cannot stand in for native production appearance. A clipboard success callback alone does not prove copied contents; read back through the supported native clipboard path and compare with the intended result.

## Focused implementation validation

Run typecheck and build after integration. Run the existing logic suite once for the changed compiler-read/default/bridge cone and add only tests that protect an actual invariant. In particular, cover read-only preview versus clipboard mutation, stale mode/revision response rejection, exact library expansion versus summary, new-only output defaults, intentional clear, and rejected shortcut/persistence changes. Do not add tests that merely assert class names or hard-code every spacing value.

Preserve the existing compiler tests. Existing all-blank templates remain valid; distinguish new document creation from intentional blank/reset. Check new read/layout/reference endpoints and the compound quick-add command at their actual trust/revision boundaries. Adaptive placement, late resize, trigger ranges, atomic Undo, and local binding recovery now require focused tests because the follow-up changes those behaviors. Unrelated installer/signing/publication work remains outside scope.

Use the Impeccable pass for affected UI/styles as directed by that skill. A clean detector result is supporting evidence only. A native screenshot showing clipped artwork or unreadable labels is still a failure regardless of test/detector counts. Repeat only the affected tests and native cases after a fix.

## Report format

The native report contains one row per case: status, exact state/size, evidence link or witnessed method, mismatch ID, and remaining defect. Add a concise before/reference/after comparison for the group controls, Optics picker, Library detail, Tokens, and Preview. Every screenshot should answer a named requirement.

The lead acceptance record states separately: assets inspected/integrated, chosen popup host, visual cases passed, interaction cases passed, and blocked/unwitnessed cases. Preserve prior shortcut/cursor evidence as historical scope, including its physical-keyboard, collision, second-display, and non-macOS limits. The new adaptive host needs fresh local lifecycle evidence; it does not require unrelated new platforms to be invented or simulated.

The reset closes when the required implemented states satisfy this contract in the native app and the lead has reviewed the comparison evidence. If the user reports a remaining mismatch, reopen that requirement; do not use an earlier “accepted” handoff to dismiss it.
