# Worker missions

Status: future implementation dispatches. This planning turn ran only a read-only research worker, which wrote file 05. No implementation worker was run. Read contracts 07–08 for the later adaptive-popup and quick-add scope.

All paths are relative to the repository root. Each worker reads AGENTS.md, MAP.md, this reset index, and only the mission-specific references it needs. Existing dirty changes are the starting point. Do not reset, stash, clean, stage unrelated files, or rewrite a sibling worker's work. The lead publishes contracts and final conclusions.

## Ownership and sequence

| Owner | Owned changes | Boundary |
|---|---|---|
| Lead integration | `src/shared/`, `src/renderer/src/app/TeleprompterApp.tsx`; MAP and acceptance | Publish contracts; delegate main/preload to one desktop owner; no concurrent UI/style edits |
| UI and motion | `src/renderer/src/ui/`, `src/renderer/src/styles/`; own handoff | No new content semantics, bridge method, asset generation, or root dependency changes |
| Desktop / engine | Separate exact owners: desktop gets `src/main/`, `src/preload/`; engine gets `src/engine/cue/` | Follow 07–08; do not share files or change compiler meaning. Runtime capacity may queue these lanes |
| Asset integration | Existing `src/renderer/src/assets/teleprompter/` inspection and a new usage-map handoff | Default read-only asset audit. No concurrent renderer/style edits, regeneration, manifest rewrite, or curation promotion |
| Native witness | New native evidence and comparison report | Read-only product review; no code edits, acceptance publication, preference restoration, or competing cursor use |

Use `03 Docs/Teleprompter Execution/Visual Reset 2026-09-13/` for new handoffs and after evidence. Keep old execution reports intact. The UI and asset lanes can run independently after ownership is published. The witness runs after integration, with exclusive native cursor access. Limited runtime capacity is not a reason to create extra tasks; queue bounded missions.

## Mission 0 — lead integration

### Objective

Give the UI exact compiler/library text and real settings/default state without duplicating engine logic or broadening accepted content. The later scope adds the measured native layout protocol in [07](07-Adaptive-Cue-Contract.md) and atomic quick-add/reference bindings in [08](08-Quick-Add-and-References.md). Publish all affected contracts before their workers consume them.

### Preview seam

Current `CueSurfaceProps` includes snapshot, projected library, dispatch, and copy; `LibraryChoiceView` contains a summary but no full atom expansion. The current bridge exposes copy operations but no read-only compilation. Do not call Copy to obtain Preview, reconstruct a library from labels, or import a second divergent content snapshot into UI components.

Add a narrow read method on the existing trusted bridge, tentatively `getCompiledDraft`. Reuse `CopyCompiledDraftRequest` shape: draftId, expectedRevision, format. Return a validated bridge result containing the existing `CompileResult` plus draftId, format, and contentVersion. Call the same Create/Edit compiler used by native Copy against the authoritative store snapshot. Enforce existing sender/frame validation and stale-revision refusal; this read neither changes a draft nor writes the clipboard. Keep current copy semantics and draft schema unchanged.

The renderer orchestration owns request identity, mode/revision/format/content-version matching, and stale response rejection. Publish a renderer-only presentation prop in `src/shared/ui-types.ts` for ready/pending/error preview state. The UI receives text and status, never reimplements compilation. Flush current editor changes before requesting a preview intended to reflect them. While pending, preserve the last valid text only if visibly updating within the same context; never label stale text as the current revision. A late Create response cannot replace an Edit preview.

For Library/Tokens detail, expose exact text through a similarly narrow read path using existing recordId, format, and expectedContentVersion validation. Factor the existing library-copy text resolver so both read and copy use it. This is not a generic resource or execution API. Do not treat `summary` as `expansion`. Keep Original text accessible through existing accepted source boundaries.

Publish final names/types before UI consumes the props. Shared types belong to the lead; the desktop owner implements validated main/preload methods. The UI worker must not patch those files to unblock itself. Preserve CSP, context isolation, sandboxing, allowlists, local protocol, and internal user-data location. Test read-only behavior and stale responses because these protect actual product invariants.

### New Create-output policy

The current accepted seed includes output axes but filters out output atoms. Do not activate adapter-generated candidates or Batch 002 records to make two badges work. The existing `customText.output` is a safe literal-text storage path for the user's requested starting output.

When a genuinely new Create draft is created, initialise that field to `4:5 aspect ratio; 2K resolution target` using one lead-owned product-default policy. Keep the engine's general empty-draft/blank-template semantics intact. Apply the policy to new document creation or an explicit future New Cue action, never in a render effect or a hydration loop. Parsing/restoring a saved document must not opportunistically fill its empty output. Failed/partial file recovery must not substitute defaults into the user's existing draft.

Reset and clear retain their current intentional-blank behavior; do not continuously restore defaults. Edit retains its authored output and does not acquire a crop request. This scope is deliberate because applying an output ratio in Edit can interact with preservation semantics.

The UI may recognize the exact default literal for its `4:5 · 2K` control, but arbitrary saved output must remain literal and visible in a Custom text state. Selecting or editing the starting output uses the existing `set-custom-text` command and output field revision. Do not store an independent pair of unsynchronized renderer values. For this reset, offer the starting 4:5/2K request, custom text, and clearing; additional fixed choices await accepted content or a separately published product decision. Clearly distinguish a prompt resolution target from an actual generated-file size.

### Settings seam

Wire a real dialog to `snapshot.shortcut` and existing `setShortcut`. The UI collects a shortcut, sends it once through the existing bridge, and renders the returned state/error. Preserve collision and persistence error handling. Remove only the implementation banner; do not invent a new settings persistence layer or expose unavailable settings.

### Lead completion checks

1. Preview and native copy use the same compiler/record-text resolver; no display reconstruction remains.
2. New Create output persists once; existing blanks, custom output, Edit drafts, and intentional clear survive reload unchanged.
3. Runtime remains at 14 accepted records; no new image/model/network path enters the app.
4. Current dirty desktop work is preserved, and affected bridge/security/preview checks pass.

## Mission 1 — UI and motion

### Dispatch prompt

> Implement visual contract 01 plus the later adaptive/quick-add contracts 07–08 in `03 Docs/Teleprompter Plan/Visual Reset 2026-09-13/`. Read the mismatch log first. Use os-build and impeccable. You own only `src/renderer/src/ui/`, `src/renderer/src/styles/`, and your handoff. You are not alone in the codebase: preserve dirty implementation, consume lead-published props, and do not edit shared contracts, app orchestration, main/preload, assets, or content. Build the compact bar/accessories, single-boundary groups, contained imagery, natural blanks, Library/Tokens, exact preview, and inline search/reference manager. Coordinate native cursor use through the lead. Return implemented surfaces and evidence against R01–R31; a mockup or detector result is insufficient.

### Build order

1. Consolidate the affected Cue/style rules so the reset replaces old anatomy rather than adding a third overriding CSS block. Establish type, spacing, targets, focus, and group capsule states first.
2. Implement compact picker geometry, field-level custom input, finite intentional selection, and coordinated adaptive motion under 07. Preserve commands/conflict responses; supply five host-spike fixtures to the desktop owner.
3. Rebuild Library/Tokens/detail and wire the real settings UI to lead-provided callbacks. Keep copy beside exact text and Use in Cue as the primary apply action.
4. Integrate preview/default state and 08's quick-add/reference callbacks, verify responsive/reduced-motion paths, and remove obsolete scaffolding.

The image box and label box must be real independent layout regions. Source-only declarations such as `object-fit:contain` are insufficient if a parent clips the image. Check each v2 object's visible silhouette at actual button size. Do not fill unused axis panels with decorative objects or duplicate the only accepted option.

Deliver `UI-Handoff.md` in the new execution folder: owned files, implemented mismatch IDs, exact known gaps, checks run, and the native cases needing witness. It may say “ready for witness,” never “visually accepted” based only on implementation.

## Mission 2 — asset integration audit

### Dispatch prompt

> Audit the existing Teleprompter v2 group objects for the reset's prescribed geometry. Read the visual contract's group and option anatomy and current artwork handoff. You own a new `Asset-Usage-Map.md` in `03 Docs/Teleprompter Execution/Visual Reset 2026-09-13/`. You are not alone in the codebase: do not modify renderer/styles, source artwork, manifests, or curation records while other owners work. Inspect alpha bounds, canvas padding, edge quality, and the visible silhouette at wide and compact sizes. Map each existing object to Optics, Stage, Finish, or family decoration; identify records lacking a genuine practical example. Do not regenerate images or promote proposed curation requests. Return exact display-box/crop guidance and native checks for the UI owner.

The usage map lists asset path, manifest identity, visible alpha bounds, recommended contained box, background treatment, supported semantic use, and any observed defect. Distinguish a CSS crop problem from a malformed raster. Preserve master files. If a new derivative is actually necessary, return a specific proposed derivative and let the lead assign the asset owner; do not silently overwrite.

Existing industrial group artwork may satisfy group identity after correct integration. It cannot satisfy focal-distance comparisons or show a photographic effect. Exact `gpt-image-2.5-flare` access remains the practical-art gate. Generic image generation availability or a model documentation page is not route proof. The later illustration mission consumes only lead-accepted AssetRequests; Batch 002 remains proposed.

Deliver the usage map without waiting for the UI. Missing practical images are a bounded dependency, not a reason to stop correct layout work or fabricate evidence.

## Mission 3 — native comparison witness

### Dispatch prompt

> Review the integrated reset in the actual Electron app using `04-Acceptance.md`. You own only the new native screenshots, motion evidence, and `Native-Comparison.md` under the reset execution folder. You are not alone in the codebase: do not edit code, change curation status, or publish final acceptance. Obtain exclusive native cursor use from the lead. Record observed build/surface identity, native/content dimensions when available, state, input method, and result for each case. Compare against the original references and five annotations, preserving the planner's before files. Mark pass, fail, partial, unwitnessed, or blocked with specific evidence. Stop native input if the user takes control; preserve their draft. Verify compiler-preview/copy equality and a small native lifecycle smoke without turning this into a rerun of unrelated desktop work.

A native screenshot proves appearance at that state and size. It does not prove animation, clipboard, shortcut delivery, or disk persistence. A browser preview may accelerate debugging but cannot close native criteria. If a native recording route is unavailable, report the live witnessed motion sequence with its method and limitation; do not claim source springs or stills prove fluidity.

Deliver failures to the lead with the affected requirement and the smallest reproducible state. The lead returns each failure to its owner, then asks only for the affected recheck. Do not rerun the entire suite after a label or spacing correction.

## Mission 4 — adaptive desktop and local reference bindings

> Implement the desktop responsibilities in `07-Adaptive-Cue-Contract.md`, the read-only text/settings seams in Mission 0, and local reference-binding support in 08. You own `src/main/`, `src/preload/`, and focused desktop tests, after reconciling the existing desktop owner's dirty work. You are not alone in the codebase: the lead owns shared contracts and the UI owner supplies measured wrappers/fixtures. First run the bounded Electron adaptive-host spike with those five fixtures. Publish a native evidence decision before adopting an addon or alternate host. Keep one draft/store/compiler and preserve security, local-only processing, clipboard, and user-data boundaries. Then integrate measured sizing, owned-modal focus, validated local thumbnail handles, and the selected host route. Report exact failures and use the narrow fallback sequence in 05; do not rewrite the main app.

## Mission 5 — atomic quick-add operation

> Implement the engine responsibilities in `08-Quick-Add-and-References.md` after the lead publishes the typed quick-add command. You own `src/engine/cue/` and focused quick-add tests. You are not alone in the codebase: do not edit shared types, content acceptance, renderer, or main/preload; coordinate any existing engine work. Reuse current preset, axis, recipe, and reference semantics. Resolve accepted IDs server-side, validate the exact WHAT range and touched-field revisions, and return one mutation/Undo entry for text replacement plus semantic selection. Keep duplicate multi-value additions idempotent. Test stale range/version, acknowledgement, double acceptance, conflict, and Undo. Do not rewrite the compiler or promote proposed library records.

## Failure handling and completion ownership

| Event | Continue with | Do not do |
|---|---|---|
| Preview prop not yet published | UI anatomy and other independent surfaces | Rebuild compiler or call Copy for preview |
| Practical art gate blocked | Correct family controls, text fallbacks, usage map | Substitute a model or relabel a generic lens as proof |
| Shared dirty file changed concurrently | Compare the current diff and coordinate the exact owned hunk | Reset/revert another owner's changes |
| Native user activity or inaccessible capture | Source fixes and explicit unwitnessed cases | Continue clicking blindly, restore user preferences, fabricate a pass |
| Checks pass but visual comparison fails | Correct the specific visible defect | Mark the reset complete using prior handoff language |

Only the lead updates the plan pointer, MAP state, and final acceptance. Preserve prior technical evidence with its original scope and date; the adaptive host requires new evidence. Desktop and engine dispatch details follow in 07–08; they extend this ownership table rather than creating competing owners.
