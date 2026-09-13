# Cue and library contracts

Version: proposed contract 2 · owner: implementation lead.

This is the common semantic contract for the engine, desktop, UI, and curator. The lead materializes it in `src/shared/` before concurrent implementation. Source data stays in `src/content/`; the renderer does not invent token meanings or conflicts.

## Product model

| Term | Meaning |
|---|---|
| Atom | One independently selectable visual or constraint direction on one semantic axis |
| Bundle | A shorthand that expands to two or more atoms; for example a lens-plus-distance shorthand |
| Preset | A one-click visual recipe spanning several axes and resolving entirely to atoms |
| Edit recipe | A named edit operation with parameter slots, affected domains, and deterministic instructions |
| Alias | An alternate spelling pointing to the same record; not another visible entry |
| Draft | Structured choices and free text for Create or Edit; the compiled prompt is derived |
| Field | A template section, such as CAM; contains one or more axes |
| Axis | One decision within a field, such as focal length or horizon roll |

The UI groups fields into Optics (CAM, ANGLE), Stage (COMP, LIGHT), and Finish (LOOK, MOOD). IMPORTANT, AVOID, OUTPUT, and the WHAT editor remain directly accessible. Depth and focus live within Optics and compile under CAM, so the existing depth/focus library remains usable.

## Shared types

Translate the following to exported TypeScript and runtime validators. IDs are stable lowercase namespaced strings; labels are editable independently. JSON uses UTF-8, arrays retain specified order, optional properties are omitted, and missing required properties are errors. Examples in this pack illustrate contracts; they are not researched catalog additions.

```ts
type Mode = 'create' | 'edit';
type View = 'cue' | 'library' | 'tokens';
type Field = 'cam' | 'angle' | 'comp' | 'light' | 'look' | 'mood'
  | 'important' | 'avoid' | 'output';
type Domain = 'identity' | 'pose' | 'wardrobe' | 'camera' | 'composition'
  | 'background' | 'lighting' | 'style' | 'color' | 'detail' | 'output';
type Id = string;
type SourceId = string;

interface Taxon {
  id: Id;
  tree: 'units' | 'presets' | 'edits';
  parentId?: Id;
  label: string;
  definition: string;
  inclusion: string;
  exclusion: string;
  order: number;
}
interface Axis {
  id: Id;
  field: Field;
  label: string;
  cardinality: 'one' | 'many';
  domain: Domain;
  order: number;
}
interface CommonRecord {
  id: Id;
  label: string;
  shorthand: string;
  aliases: string[];
  summary: string;
  primaryTaxonId: Id; // one leaf, exactly one canonical path
  facets: Record<string, string[]>;
  sourceIds: SourceId[];
  cautionIds: Id[];
  order: number;
  status: 'active' | 'deprecated';
  replacedBy?: Id; // optional when deprecated; migrations account for users
  previewAssetId?: Id;
}
interface Atom extends CommonRecord {
  kind: 'atom';
  axisId: Id;
  expansion: string; // standalone direction, no label or terminal semicolon
  excludes: Id[]; // atom IDs; validator makes the relationship symmetric
  requires: Id[]; // atom IDs, satisfied explicitly; never auto-inserted
  applicability: Mode[];
}
interface Bundle extends CommonRecord {
  kind: 'bundle';
  atomIds: Id[]; // only atoms; no nested bundle or preset
}
interface Preset extends CommonRecord {
  kind: 'preset';
  atomIds: Id[]; // fully deconstructible; no opaque residual prompt
  scopeAxisIds: Id[]; // exactly axes represented by atomIds
  applicability: Mode[];
}
interface EditRecipe extends CommonRecord {
  kind: 'edit-recipe';
  operation: string;
  affectedDomains: Domain[];
  requiredPreservedDomains: Domain[]; // hard invariants, e.g. Camera lock
  slotKeys: string[];
  segments: ({ text: string } | { slot: string; placeholder: string })[];
  allowedFields: Field[];
  excludesRecipeIds: Id[];
}
interface Source {
  id: SourceId;
  kind: 'local' | 'web' | 'user' | 'curator';
  title: string;
  locator: string; // local file+heading, exact URL, or authored batch path
  author?: string;
  accessedOn?: string; // YYYY-MM-DD
  basis: 'source-description' | 'source-prompt' | 'user-source'
    | 'curator-composition';
  evidenceNote: string; // paraphrase; distinguish observation from inference
  reuse: 'paraphrase-only' | 'permission-recorded' | 'user-provided' | 'original';
}
interface LibraryV2 {
  schemaVersion: 2;
  contentVersion: string; // YYYY-MM-DD.N
  taxa: Taxon[];
  axes: Axis[];
  atoms: Atom[];
  bundles: Bundle[];
  presets: Preset[];
  editRecipes: EditRecipe[];
  sources: Source[];
  cautions: { id: Id; text: string }[];
  legacyMap: {
    oldId: string;
    oldToken: string;
    disposition: 'retained' | 'alias' | 'split' | 'deprecated' | 'reference-only';
    targetIds: Id[];
    reason: string;
  }[];
}
```

The adapter keeps original text, source locators, IDs, and legacy copy payloads available in Tokens detail. A record awaiting a defensible split remains searchable as reference-only and cannot be misrepresented as a valid Cue atom. Every one of the existing 104 rows and 15 techniques receives an explicit mapping. No broad deletion or forced semantic merge is part of the adapter.

## Axis and multi-selection rules

The initial registry below defines the decisions to support. The engine worker maps existing records onto it; the curator can propose additional axes with migration and UI impact notes. A new axis is a contract change accepted by the lead.

| Field | Single-valued axes | Multi-valued axes |
|---|---|---|
| CAM | `camera.focal`, `camera.distance`, `camera.depth`, `camera.focus` | None initially |
| ANGLE | `angle.elevation`, `angle.azimuth`, `angle.roll` | None initially |
| COMP | `composition.hierarchy`, `composition.placement`, `composition.crop` | `composition.depth` |
| LIGHT | `light.key`, `light.contrast`, `light.time` | `light.fill`, `light.accent` |
| LOOK | `look.base`, `look.palette`, `look.texture`, `look.retouched` | `look.treatment` |
| MOOD | None | `mood.tone` |
| IMPORTANT | None | `constraint.keep` |
| AVOID | None | `constraint.avoid` |
| OUTPUT | `output.ratio`, `output.resolution` | None |

A field can therefore contain several choices without requesting two lenses or contradictory angles. Eye-level + three-quarter + Dutch can coexist because elevation, azimuth, and roll differ. 24mm and 85mm on the same focal axis replace one another. Depth staging can combine foreground and layered composition if neither record excludes the other.

Selecting an atom on a single-valued axis replaces its previous value. On a many-valued axis it toggles membership. Bundle selection expands all atoms as one undoable operation. Conflicts spanning different axes or explicit exclusions produce a pending choice showing the two conflicting labels and “Replace” / “Keep current”; no invalid intermediate draft is committed. A missing `requires` dependency is shown as a required choice; it is not inserted silently. Free text is never semantically interpreted: structural validation cannot claim that arbitrary prose is consistent.

Preset and bundle validation reject missing atom IDs, conflicts, duplicate one-valued axes, and incompatible mode applicability. The UI must not render invalid records as selectable.

Bundles stay within one template field and belong to the primary axis represented by their first atom. A combination spanning fields is a preset. Bundle applicability is the intersection of its atoms' supported modes. Preset arrays are ordered for authorship/provenance; compilation still uses canonical axis/atom order.

## Draft schema and provenance

```ts
interface AxisChoice {
  axisId: Id;
  atomIds: Id[];
  source: 'manual' | 'preset';
  presetId?: Id;
  pinnedBlank: boolean; // intentional empty axis survives preset application
}
interface RecipeChoice {
  recipeId: Id;
  slots: Record<string, string>; // empty values are valid placeholders
}
interface ReferenceRole {
  imageNumber: number; // 1..20; unique, user-controlled
  role: 'base' | 'identity' | 'pose' | 'product' | 'style' | 'palette'
    | 'lighting' | 'background' | 'geometry' | 'custom';
  note: string;
}
interface CueDraft {
  schemaVersion: 1;
  id: 'create' | 'edit';
  revision: number;
  libraryVersion: string;
  what: string;
  choices: AxisChoice[];
  customText: Partial<Record<Field, string>>;
  activePresetId?: Id;
  edits: RecipeChoice[]; // edit draft only; create draft has []
  references: ReferenceRole[]; // edit only
  manualUnlocks: Domain[]; // edit only; restoration of a lock is explicit
  outputFormat: 'expanded' | 'shorthand';
}
interface CompileResult {
  text: string;
  revision: number;
  placeholders: { key: string; label: string }[];
  cautions: Id[];
  errors: { code: string; field?: Field; recordId?: Id; message: string }[];
  atomsUsed: Id[];
  unlockedDomains: Domain[];
}
```

There is one Create draft and one Edit draft, shared across both windows. Save structured data, not an editable copy of the compiled output. Preview is selectable read-only text; free wording belongs in WHAT, recipe slots, or each field's “Custom” area. Switching modes, tabs, windows, or dismissing an overlay preserves all draft fields. Reset affects the current mode only, with a one-step Undo that survives popup dismissal for the running session.

WHAT is a single subject/action/scene text area. Its empty value is valid. Each field allows choices plus literal custom text appended after their expansions. Empty fields are valid template slots. Custom text preserves internal line breaks and punctuation; trim only surrounding whitespace at compilation. It is displayed as text, never evaluated or rendered as HTML.

Applying a preset clears values owned by the previous preset, then supplies its atom defaults wherever there is no manual value or pinned blank. Manual choices and custom prose remain. A new preset may thus become “Customized”; its detail shows each applied or skipped atom. Only one preset is active at a time. “Reset to preset” is an explicit undoable command that replaces manual selections and pinned blanks on that preset's axes; it preserves WHAT, free text, reference roles, and unrelated axes. A manual change promotes the whole affected axis to manual ownership. This prevents partial multi-select defaults from unexpectedly reappearing.

## Deterministic Create output

Always emit these ten sections, in this order, with one blank line between sections. The default is Expanded. Copy Shorthand is a secondary action for users whose destination understands the local shorthand.

```text
WHAT:
[subject + action + scene]

CAM:
[camera / lens / depth / focus]

ANGLE:
[camera angle]

COMP:
[composition]

LIGHT:
[lighting]

LOOK:
[look]

MOOD:
[mood]

IMPORTANT:
[important details]

AVOID:
[things to avoid]

OUTPUT:
[aspect ratio] [resolution]
```

For populated fields: expand bundles/presets to atoms; order by field, axis.order, then atom.order and ID; deduplicate by atom ID; join expansions with `; `; append custom prose as a final segment. No synonyms, inferred modifiers, automatic quality boosters, or rewritten user text. Render OUTPUT as its canonical ratio and resolution labels, followed by any custom output text. Missing ratio and missing resolution each retain their own placeholder. Shorthand uses the atoms' canonical shorthand in the same order, without reconstructing an arbitrary preset token after manual changes.

Examples `50` and `85` resolve through aliases to the existing natural50 and portrait85 meanings. Offer the entire valid mapped library for every field, not just the examples in the request. The initial output options include 4:5, 16:9, 1:1, 21:9 and 1k, 2k, 4k; these are requested output targets. They do not prove that the destination model supports a ratio or returns an exact pixel count. Keep the short capability note in OUTPUT's expanded help, outside the copied text.

No fields are preselected on first use. Copying the completely blank template is allowed. A nearby quiet placeholder count can be expanded to jump to missing fields; it never blocks Copy. Structural errors, unresolved IDs, or a clipboard payload above 64 KiB do block Copy with the offending field identified.

## Deterministic Edit output

Edit is a multi-operation builder. The initial recipe coverage is: local correction; remove/simplify background; replace character/identity; transfer pose; replace object/product; change camera/angle; reframe/composition; transfer style/palette/lighting; restore detail; multi-reference composite; and markup-directed edit. The engine maps the existing techniques into these families without inventing new claims. Each can retain subrecipes where its lock semantics differ.

Emit BASE, REFERENCES, CHANGES, KEEP, IMPORTANT, AVOID, OUTPUT in that order. BASE defaults to `Use image 1 as the base.` REFERENCES contains numbered roles when present, otherwise `[reference roles, if needed]`. CHANGES contains selected recipes in stable catalog order with numbered instructions; unfilled slots produce their named placeholders. If no recipe is selected, emit `[describe the changes]`. Any selected field is appended beneath CHANGES under its template label; empty inactive fields are omitted, while an active recipe's needed blank slots remain visible. WHAT in Edit supplies an additional free-text change line.

Define the preserved-domain baseline as identity, pose, wardrobe, camera, composition, background, lighting, style, color, and detail. Unlock the union of domains affected by selected recipes, nonempty visual field choices/custom text, and manualUnlocks. Output ratio changes unlock composition; output resolution alone does not. KEEP lists only the remaining baseline domains and adds `Preserve unaffected objects and regions.` If none remain, emit only that sentence. Never emit “keep everything unchanged” alongside a named change.

With no structured recipe, visual selection, or manual unlock, emit KEEP as `[what to preserve]`; arbitrary WHAT prose is not enough to infer its locks. Once a structured edit exists, use the derived baseline above and let the user inspect/unlock further domains. If an unlocked domain intersects any selected recipe's requiredPreservedDomains, return a conflict requiring removal of the lock recipe or the change. This also catches a camera choice or custom CAM text combined with Camera lock, not just two named recipes.

Legacy full prompts often embed preservation clauses. Adapt their positive change instructions into recipe segments and centralize their default domain locks in KEEP; do not concatenate the old full prompts into CHANGES. Retain operation-specific limits and qualifiers that are still compatible. Model a genuinely required preserved domain explicitly. Original full prompts remain available through the legacy copy view.

Reference roles are text instructions for images the user supplies in the destination tool. Teleprompter stores no reference image files. At most one reference has role base; its number drives BASE. Unspecified base is image 1. Other numbered roles can coexist, but conflicting sources for the same single-target role require a target qualifier in `note`. Missing role descriptions remain placeholders. A recipe using a reference that has no entered number emits `[reference image number]`; it never invents an image.

For “change camera + simplify background,” KEEP must omit camera and background while retaining identity and pose unless another selected instruction changes them. “Camera lock” and “change camera” are an explicit recipe conflict. A lighting transfer must unlock lighting. Reference role assignment alone does not unlock a domain; a transfer operation does.

Preset application in Edit uses the same provenance rules, but only applies axes allowed by the selected recipes. Incompatible defaults are reported as skipped and remain visible in the preset breakdown. It never enables a new edit operation implicitly. Switching to Create keeps its own draft intact.

## Compiler and bridge boundary

Engine exports: `validateLibrary`, `adaptLegacyCatalog`, `listChoices`, `resolveSelection`, `applyPreset`, `applyDraftCommand`, `compileCreate`, `compileEdit`, and `searchLibrary`. They are pure functions without Electron, React, file access, clocks, random IDs, or network use. A command supplies its ID and revision context from the desktop layer.

The lead defines the `window.teleprompter` bridge and its runtime-validated command union. It exposes `getBootstrap`, `submitDraftCommand`, `onDraftChanged`, `copyCompiledDraft`, `copyLibraryText`, `setFavorite`, `setShortcut`, `showMain`, `hideSpotlight`, and `onCommand`, with unsubscribe functions for subscriptions. No generic `send`, arbitrary channel, filesystem path, shell, or executable template is exposed.

Commands are semantic: set WHAT; set field custom text; set/clear an axis; toggle an atom; apply/reset preset; select/remove recipe; set recipe slot; set reference roles; set manual unlocks; choose format; reset/undo draft. IPC includes `{commandId, clientId, draftId, expectedFieldRevisions, command}`. Main serializes commands and owns authoritative revisions. `expectedFieldRevisions` uses stable paths such as `what`, `axis:<id>`, `custom:<field>`, `recipe:<id>`, `references`, and `preset`; the engine derives the complete touched-path set for compound commands. Reset and undo require the full draft revision.

Disjoint-field edits can rebase. Stale writes to the same field return `CONFLICT` with the latest snapshot; they never overwrite it. Renderer buffers preserve rejected local text and present “Keep my text” / “Use current”; retrying Keep uses the new revision as an explicit command. Per-client commands remain ordered; duplicate command IDs return their prior acknowledgement. See the desktop mission for buffering and copy consistency.

Clipboard compilation occurs in main against the acknowledged draft revision. `copyCompiledDraft` takes draft ID, expected revision, and format, then compiles and writes that exact result. A stale copy request returns `STALE_DRAFT`; the renderer synchronizes before retrying. This ensures the main Cue and popup produce identical text.

## Library delivery contract

Curator deliveries are candidate `LibraryV2` records plus sources, a complete changed-ID mapping, and reasoning. They are not imported directly at runtime. The lead accepts a validated batch into bundled content. The app never fetches or hot-loads arbitrary JSON from the Internet. Asset references are stable manifest IDs, not remote URLs.

Validation must establish unique IDs; collision-free canonical shorthand/aliases within namespace; valid one-parent taxonomies; no cycles; one canonical leaf per record; valid atom/axis/source/asset references; legal mode use; satisfiable dependencies; deterministic expansion; and no silent loss of existing mapped content. Deprecated records remain resolvable for drafts/favorites until their explicit migration is accepted.
