# Mission — Cue engine

## Dispatch prompt

> Implement the deterministic Cue engine for Teleprompter. Read AGENTS.md and MAP.md, then `03 Docs/Teleprompter Plan/00-Start-Here.md` for the explicit scope update, `02-Cue-and-Library-Contracts.md`, and this mission. You own `src/engine/`, `src/content/`, and their focused tests. You are not alone in the codebase: preserve other workers' edits and adapt to the shared contracts supplied by the lead. Do not change shared types, renderer files, desktop code, root configuration, or original `teleprompter/` source files. Deliver a working pure engine, an explicit legacy adapter, and focused proof of prompt composition. Ask the lead to resolve a shared-contract change; continue independent engine work. Do not conduct the long-term Internet curation mission or add runtime model calls.

## Outcome

A user can build a complete or partly blank Create/Edit template by choosing library entries. Presets unfold into editable choices, conflicting options cannot silently coexist, and every copyable output is reproducible from a structured draft. The main window and popup call the same functions.

## Work sequence

1. Adapt the existing catalog with stable mappings; preserve original payloads and source references. Finish when every legacy row/technique is accounted for and the adapter validates.
2. Implement axes, choices, bundles, preset provenance, commands, and conflict results. Finish when single- and multi-axis behavior passes the contract examples.
3. Implement Create and Edit compilation, placeholders, explicit reference roles, and preservation-domain subtraction. Finish when exact-text fixtures pass.
4. Expose a UI-ready choice/search projection and integrate the first accepted curator batch, if available. Finish when renderer consumers require no family-specific hardcoded option lists.
5. Deliver the engine report and unresolved semantic mappings. Finish when the lead can reproduce the focused checks and import the module without React or Electron.

## Module boundaries

| File/module | Responsibility |
|---|---|
| `src/content/legacy-adapter.ts` | Pure mapping from the existing catalog to V2 records; original text remains available |
| `src/content/library/` | Bundled accepted V2 data, sources, migration maps; no generated image bytes |
| `src/engine/cue/validate.ts` | Cross-record and draft validation with actionable record/field IDs |
| `src/engine/cue/selection.ts` | Selection expansion, cardinality, conflict explanation, preset application |
| `src/engine/cue/commands.ts` | Immutable draft reducer and touched-field calculation for revisions/undo |
| `src/engine/cue/compile.ts` | Exact Create/Edit serializers and placeholder/caution results |
| `src/engine/cue/choices.ts` | Searchable groups and summaries for fields, preset breakdown, compatibility |

These are responsibility boundaries, not a demand for a file per small function. Keep a module together when that makes its contract simpler. Existing search helpers can remain where useful; avoid maintaining separate legacy and V2 search semantics indefinitely.

## Legacy adaptation

Use `src/content/catalog.ts`, `shorthand.ts`, `techniques.ts`, and the original skill documents as provenance. The 104 rows comprise routes, render terms, camera, angles, composition, lighting, looks, depth/focus, presets, and reference patterns. Do not treat all rows as interchangeable option chips.

Map direct directions into atoms. Map combined shorthand such as close-wide camera directions into a bundle when it contains distinct decisions. Map old presets to flat atom IDs. Map route instructions to edit recipes and reference patterns to reference/markup recipes or preserved reference-only text. A ambiguous row stays in the audit queue rather than acquiring an invented expansion.

Initial Cue support must include all existing camera, angle, composition, lighting, look, depth/focus, and preset choices that can be mapped faithfully. Extend only the product-required gaps: mood choices supplied by the user; IMPORTANT/AVOID constraint choices supplied by the user; requested ratio/resolution options; and necessary edit slots. Mark these as user-source or curator-composition records. External research belongs to the curator.

Keep namespaced search. The bare alias `50` can find natural50 in the CAM selector; a global search result must show its field. The word “editorial” can legitimately name a composition, a look, and a full preset. Match them separately with their semantic labels; do not deduplicate by text alone.

## Selection and command behavior

Resolve a candidate command without mutating the existing draft. Return either a valid next draft plus touched paths, or a structured choice/error. Compound commands must be atomic: a bundle cannot apply half its atoms and fail on the rest. State history stores the previous affected values, not arbitrary reverse text edits.

The UI may show a pending conflict, but the committed draft remains valid. Preset application follows the shared provenance policy exactly. Clearing an axis can intentionally pin its blank. Resetting an axis removes that pin; make these distinct commands so a later preset cannot erase the user's choice to leave a blank.

Unknown IDs in old drafts remain in a recovery list with their last known label and prior source version. Block compilation of unresolved selections and expose Remove/Replace actions. Do not silently resolve by a similar label or omit the selection.

Edit-domain rules are data-driven. The compiler knows field-to-domain mapping and subtracts affected domains; it must not use keyword matching in a recipe's prose. IMPORTANT/AVOID do not unlock domains. Visual custom text does unlock the domains represented by its field; show those effects in Edit's Keep section before copy.

Extract preservation clauses while adapting legacy prompts, so CHANGES cannot retain a second, contradictory lock list. Validate requiredPreservedDomains against the final union of changes, including choices/custom text and manual unlocks. An unstructured Edit template uses the contract's KEEP placeholder instead of inferring the user's intent from free prose.

## Text fixtures

Fixture atoms may use simple synthetic directions to verify mechanics; label them test fixtures and keep them outside shipped content. For example:

```text
CAM:
24mm wide-angle perspective; close camera-to-subject distance

ANGLE:
eye-level viewpoint; three-quarter view; tilted horizon
```

Given fixture atoms in the corresponding axes, output must match that order regardless of click order. Selecting an 85mm fixture afterward replaces only focal length, retaining close distance and the three angle axes. Adding literal custom text appends it without paraphrase.

For a blank draft, match the complete Create template in the contract byte-for-byte, using LF line endings and a final newline. For an Edit fixture selecting change-camera and simplify-background, assert that KEEP contains identity/pose/wardrobe, omits camera/background, and that both CHANGES instructions survive. Add a second fixture with style/light transfer and verify the affected locks are removed.

## Focused verification

| Invariant | Evidence |
|---|---|
| Legacy fidelity | Every old ID mapped; old copy payloads unchanged; known aliases still resolve |
| Determinism | Same draft/library/format gives identical text; click order does not alter canonical order |
| Compatible multi-select | Different axes coexist; same-axis values replace; explicit cross-axis exclusions return a choice |
| Preset transparency | Every preset expands entirely to atoms; manual override/pinned blank survives; Reset to preset and Undo restore exact selections |
| Blank handling | Empty WHAT/fields/recipe slots are copyable placeholders; no `undefined`, stray separators, or invented wording |
| Edit preservation | Combined edit domains and manual unlocks are subtracted; camera-lock conflict is caught; missing reference stays a placeholder |
| Failure containment | Missing references, cycles, bad schemas, unsatisfied requirements, and oversized text surface errors; no silent filtering |
| Shared use | Engine imports successfully without browser/Electron globals; output projection suffices for both Cue surfaces |

Run the changed engine tests and typecheck. The lead owns whole-app build/native acceptance. Do not add pixel snapshots or tests mirroring trivial getters.

## Handoff

Write `03 Docs/Teleprompter Execution/Engine-Handoff.md` with changed modules, contract version, acceptance cases and commands/results, unresolved legacy mappings, and one next integration action. Keep semantic research gaps in a compact table for the curator. A passing compiler does not prove native clipboard, popup behavior, or visual quality.
