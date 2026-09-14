# Quick add — slash search and reference mentions

Status: implementation plan added from the user's follow-up. These functions are local authoring shortcuts. Selecting a result must produce the same deterministic change as its existing visible control.

## User flow and command meanings

Typing `/` at a word boundary in WHAT opens a small searchable list at the caret. Typing a category narrows it; a colon or space can separate category and search text. `/preset`, `/preset: commercial`, and `/preset commercial` therefore reach the same accepted preset search. Selecting a result shows its applied effect in Cue and removes only the transient query range.

| Trigger | Search scope | On selection |
|---|---|---|
| `/preset` | Active, compatible accepted presets | Apply the existing preset command; reveal its configured group state |
| `/token` | Active accepted atomic directions, including aliases | Set the matching single-value axis or add the compatible multi-value atom; selecting an already-added atom does not accidentally toggle it off |
| `/edit` | Accepted Edit recipes while in Edit | Add/select the recipe and reveal required slots. In Create, offer “Switch to Edit” first; do not mutate two mode drafts in one hidden action |
| `/snippet` | Exact approved text expansions that can be inserted literally | Insert the selected expansion at the caret in WHAT; no additional hidden axis selection |
| `@` | The current draft's numbered reference slots and local labels | Replace the query with the literal `Image N` for that chosen slot; open its role/details on deliberate inspection |

Bare `/` offers these categories and a few relevant accepted results. Result rows lead with a human title and use a short secondary action label such as “Use preset” or “Insert text.” The visible command form may read `/preset: Commercial`, but never expose internal `preset.*` IDs as its title. `/snippet` and `/preset` have different effects and must remain distinguishable.

These are explicit authoring commands, not general execution or natural-language instructions to an agent. Unknown slash text remains ordinary prose. No action runs just because a matching string was pasted, restored from disk, or received from the other Cue window.

## Menu anatomy and focus

Use one local suggestion surface, normally 320–400px wide, with 8px internal padding and up to six 44px rows. A result can include a 28px accepted thumbnail or family mark, one title, and one secondary line. Long descriptions and practical examples open on inspection rather than increasing every row's height.

Anchor to the caret/trigger range. In the main window, flip and shift within the viewport. In the adaptive popup, include the list in the measured accessory height and align it with the input edge if a true caret anchor would overflow. Keep it visually attached to the editor. Opening suggestions closes the active parameter accessory, preserving selections, so two tall panels never compete for space.

Keyboard focus stays in the editor. Up/Down moves the active result; Enter accepts only when an eligible active result exists; Escape dismisses the list while preserving the literal query. Tab follows normal focus movement and does not silently select the first result. Left/Right and standard editing shortcuts continue editing text. A visible plus/quick-add button offers the same search for users who do not discover `/`.

Announce the result count and active title without rereading the entire list. Use listbox/option semantics and a validated association with the multiline editor; test with VoiceOver. Do not blindly replace textarea semantics with a single-line combobox role. [WAI-ARIA guidance](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)

## Trigger lifecycle

Activate only at the start of the text or after an allowed word boundary, with a collapsed selection, local typing, and no IME composition. A slash in a URL/path and an at-sign inside an email address must not repeatedly open suggestions. Pasted text never triggers commands automatically. Start with short category queries and a 120-character query cap; longer text closes suggestions without deleting anything.

Track the trigger start/end, local text revision, active mode, content version, and current result identity. Moving the caret out of the range, starting a new line, navigating away, or hiding Cue ends the session. Escape marks that trigger range dismissed until the context changes. Receiving a synchronized draft can invalidate a session but cannot open a new one.

Search only the accepted runtime view, plus the current draft's reference view. Current 14-record seed results must be immediate; no network or long debounce is appropriate. Preserve stable ordering for equal matches. For later larger libraries, bound and cancel work before adding any search dependency. A content-version change invalidates results before selection.

The first-party [Tiptap suggestion lifecycle](https://tiptap.dev/docs/editor/api/utilities/suggestion) provides useful precedent for trigger ranges, dismissal, and local-origin filtering. The current textarea can implement this bounded behavior without a new rich-text document schema. Use Tiptap only after a concrete need for protected inline nodes is accepted; do not install an entire editor solely to render a six-row menu.

## Atomic acceptance and draft safety

A preset application and removal of its `/preset…` query must be one acknowledged authoring action. Two unrelated UI dispatches can leave the query behind, lose typed text, or apply a preset after a failed text update. Publish one narrow compound command, tentatively `accept-quick-add`, through the existing revision-checked command envelope.

| Command input | Required check |
|---|---|
| Kind and accepted record ID, or reference image number | Resolve against current authoritative content/reference state; reject inactive, incompatible, missing, or stale targets |
| Query range and exact query text | Match the authoritative WHAT text at that range; never delete text by searching for the first matching substring |
| Expected WHAT and affected field revisions | Union of WHAT and the existing preset/axis/recipe/reference command's touched paths |
| One command ID | Existing acknowledgement/idempotency behavior must prevent double application |

Flush preceding local typing before accepting. Apply the resolved existing command and the exact range replacement within one authoritative store mutation and one Undo entry. For a literal snippet/reference insertion, replace only the range with approved text or `Image N`. There is no arbitrary command array, injected script, or renderer-provided expansion trusted as canonical library text.

Do not remove the query optimistically before acceptance. Keep subsequent typing buffered during the short request, or rebase it from the accepted range using a tested edit mapping; it must not disappear when the response arrives. On conflict, keep the text, adopt the current snapshot through existing conflict handling, and offer a fresh selection. A late result cannot apply to another mode, query, or content version.

Copy waits for in-flight acceptance and local text flush. Success feedback appears only after acknowledgement. Undo reverses the text replacement and semantic change together, using the existing draft history/conflict rules. A multi-value `/token` result is an idempotent add, not the ordinary toggle action that might remove an existing selection.

The engine owner implements the compound operation by reusing current selection/recipe routines; the compiler stays unchanged. The lead publishes the new union member, touched-path rules, validation, and renderer callback. The UI worker must not simulate a transaction by mutating a local draft copy.

## Exact reference images

`@` resolves a **numbered reference slot**, such as `Image 2 · Product · Black bottle`. The existing `ReferenceRole.imageNumber` supplies the exported identity. Keep numbers stable for the life of the draft; display sorting does not renumber them. Selecting the row inserts the explicit text `Image 2`, so Expanded/Shorthand and manual copying remain intelligible in the destination tool.

When no reference exists, the list offers “Add reference.” Open a compact manager to enter its label, number, and role, with an optional local image chooser for a thumbnail. A reference may be named without attaching a local file when the corresponding image already lives in the destination tool. Never imply that a named or thumbnailed image has been delivered there automatically.

Local image binding is a small separate presentation record keyed to draft and image number, with a stable binding ID, human label, and opaque local thumbnail handle. Existing role/number/note records remain the compiler input. The renderer does not receive arbitrary filesystem access or raw paths in compiled text. New bindings default empty for existing drafts; publish their persistence/versioning through the lead rather than inventing a renderer-only cache.

The native file chooser runs only from the user's Add/Choose image action. Accept bounded local raster files, generate a small thumbnail, and keep all processing local. The main process owns file selection, format/size checks, thumbnail storage, and the opaque read handle. Keep the original file unchanged. Reopening a draft restores its label/number even if the original file moved. An unavailable image is clearly unbound; it is never silently replaced by another file with the same name.

In Edit, the chosen role/number/note flows through the existing reference-role command and compiler. In Create, the literal `Image N` appears in WHAT; do not assume the current Create compiler renders a separate reference block. A role can be registered before the mention is inserted. Selecting an existing mention target does not invent or change its role.

Removing a local binding leaves its numbered slot visible as unbound if the prompt still refers to it. Do not recycle or renumber that slot automatically and do not rewrite the user's prose. Rebinding Image 2 is an explicit user action visible in the manager. This avoids silently retargeting text after another reference is removed. Protected rich-text mention chips and automatic reference renumbering are outside this first implementation.

Opening the native file chooser must be treated as an owned modal interaction by Cue's focus coordinator. It may temporarily remove focus without discarding the draft or interpreting the chooser as an outside click. Cancelling returns to the same `@` context; selecting a file returns a binding result before insertion.

## Ownership and acceptance

| Owner | Work |
|---|---|
| Lead | Shared quick-add command/view contracts; compound acknowledgement integration; reference-binding persistence contract; content/version boundaries |
| Engine worker | Compound selection/text operation and meaningful conflict/undo tests; preserve existing compile output |
| UI worker | Trigger session, anchored result list, keyboard/IME behavior, compact reference manager, status and exact text insertion |
| Desktop worker | Local file chooser/thumbnail handle, adaptive accessory sizing, owned-modal focus, persistence/security checks |

Workers are not alone in the codebase. Assign exact files before execution, preserve existing dirty changes, and consume lead-published interfaces. Engine work can proceed after contracts are published; UI and native integration meet at the same suggestion/reference view and callback types.

Verify bare `/`, category/colon queries, accepted/incompatible/missing results, literal `/snippet`, duplicate multi-value insertion, mid-sentence replacement, repeated identical query text, IME, email/path prose, paste, Escape dismissal, remote draft updates, double acceptance, typing during acknowledgement, mode switch, Undo, and Copy. For `@`, verify two similar labels with distinct image numbers, role projection, cancelled image chooser, moved local file, unbound slot, reload, and removal without renumbering.

Cases N26–N30 in [04 — Acceptance](04-Acceptance.md) add native end-to-end evidence. Menu appearance alone does not prove a preset applied, a reference remained exact, or the copied prompt contains the accepted result.
