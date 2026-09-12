# Part 02: Content conversion and search engine

Owner: Luna content/engine worker. Read [Start Here](</Users/blinblon/Claude/Projects/Image Director/03 Docs/Implementation Plan/00-Start-Here.md>) and the data/engine contracts in [Part 01](</Users/blinblon/Claude/Projects/Image Director/03 Docs/Implementation Plan/01-Architecture-and-Contracts.md>) first.

The task is to convert the existing source into a complete typed catalog and implement a few pure functions around it. The Image Director skill already defines the vocabulary. This app does not need a shorthand parser or an image-generation engine.

## 1. Source precedence and conversion method

| Content being authored | Authority | Conversion |
|---|---|---|
| Gallery full prompts and short forms | The 15 numbered sections in [quick-snippets.md](</Users/blinblon/Claude/Projects/Image Director/image-director/assets/quick-snippets.md>) | Copy the full Expanded/Full snippet body and source short form into typed data. Remove only Markdown presentation syntax. |
| Canonical tokens and production direction | Family lists in [SKILL.md](</Users/blinblon/Claude/Projects/Image Director/image-director/SKILL.md>) | One entry per canonical item; concise meanings can be edited, substantive direction stays faithful. |
| Camera lock and reference patterns | Quick snippets sections 3, 8, and 15 | Add the source forms absent from the main minimal-input list. |
| Preset components | SKILL.md, “Fast professional combinations” | Reference component IDs in order; apply the two explicit camera alias corrections below. |
| Contextual limits | SKILL.md and [prompting-strategy.md](</Users/blinblon/Claude/Projects/Image Director/image-director/references/prompting-strategy.md>) | Add the specific relevant note and preserve conditions in copied expanded directions. |

Do this conversion once, by reading the source and authoring static TypeScript records. A short read-only inventory helper can aid counting, but no Markdown-ingestion pipeline, parser package, watch process, or source-file reader ships in the app. Future content edits are manual updates to these typed records with the source nearby.

Use each source item's actual heading in `sources`. Do not use line numbers as durable identifiers. Do not edit the skill to make it fit the app. Source differences are resolved in the app catalog according to section 4.

## 2. Gallery manifest: exactly 15 techniques

Use this manifest for stable IDs, labels, grouping, order, and source selection. The source recipe number supplies `order`.

| # | ID | Title | Category | Source section / full-prompt source |
|---|---|---|---|---|
| 1 | `surgical-edit` | Surgical edit | local-edits | “1. Surgical edit”, Expanded |
| 2 | `remove-one-thing` | Remove one thing | local-edits | “2. Remove one thing”, Expanded |
| 3 | `multi-reference-composite` | Multi-reference composite | reference-transfers | “3. Multi-reference composite”, Expanded |
| 4 | `style-tone-transfer` | Style & tone transfer | reference-transfers | “4. Style / tone only”, Expanded |
| 5 | `face-identity-transfer` | Face & identity transfer | reference-transfers | “5. Face / identity lock”, Expanded |
| 6 | `pose-transfer` | Pose transfer | reference-transfers | “6. Pose transfer”, Expanded |
| 7 | `perspective-correction` | Perspective correction | camera-framing | “7. Perspective / vanishing point”, Expanded |
| 8 | `camera-lock` | Camera lock | camera-framing | “8. Camera lock”, Expanded |
| 9 | `reframe` | Reframe | camera-framing | “9. Reframe”, Expanded |
| 10 | `clean-environment` | Clean environment | local-edits | “10. Clean environment”, Expanded |
| 11 | `product-fidelity` | Product fidelity | reference-transfers | “11. Brand / product fidelity”, Expanded |
| 12 | `controlled-motion` | Controlled motion | motion | “12. Controlled motion”, Expanded |
| 13 | `quality-restoration` | Quality restoration | finish-quality | “13. HIGH-QUALITY RESTORATION / ANTI-DEGRADATION”, Full snippet |
| 14 | `clean-commercial` | Clean commercial photography | finish-quality | “14. Clean commercial look”, Expanded |
| 15 | `markup-directed-edit` | Markup-directed edit | local-edits | “15. Red markup / coordinate edit”, Expanded |

Category labels and order are Local edits, Reference transfers, Camera & framing, Finish & quality, and Motion. Counts are respectively 4, 5, 3, 2, and 1. The default Gallery list preserves source recipe order across categories; filtering does not regroup or reorder the survivors.

### Author each record in this order

1. Copy the complete source prompt and source shorthand template, preserving punctuation, reference numbering, placeholders, conditions, and paragraph boundaries.
2. Write the title from the manifest and a single-sentence summary explaining the useful change. Describe the technique, without promising model performance.
3. Link relevant canonical entries, add three to six useful tags, and include a source example only where it teaches a concrete use.
4. Attach the relevant caution IDs and `previewId` matching the technique ID. Validate references and category membership.
5. Compare the resulting full-prompt string with its source body. Only presentation markup and surrounding whitespace may differ.

For the restoration recipe, remove the bold markers around its opening sentence, not the sentence itself. Include the complete long restoration paragraph. The separate “Best practice for exact preservation” material becomes contextual guidance, not an unlabelled addition to the copied source paragraph.

For multi-reference compositing, use the role-assignment template as `shorthandTemplate`, and the pose/face line as `example`. For clean commercial photography, retain the source's free-form `look: ...` line. Do not silently replace it with `look:commercial`, because that would change the source short form.

Gallery linked-entry IDs must resolve as follows. Other useful links are optional only when directly supported by the recipe.

| Technique | Required links |
|---|---|
| surgical-edit | route-fix, route-lock |
| remove-one-thing | route-remove, route-lock |
| multi-reference-composite | pattern-reference-roles, route-swap |
| style-tone-transfer | route-style, route-tone |
| face-identity-transfer | route-face |
| pose-transfer | route-pose |
| perspective-correction | route-perspective |
| camera-lock | route-camera-lock, route-lock |
| reframe | route-reframe |
| clean-environment | route-clean |
| product-fidelity | route-product |
| controlled-motion | route-motion |
| quality-restoration | route-hq |
| clean-commercial | look-commercial, look-cleanblue, lighting-highkey |
| markup-directed-edit | pattern-marked-area, route-fix |

`swap:` and `lock:` remain fully represented in Cheatsheet and as linked routes. They do not need newly invented Gallery recipes.

## 3. Cheatsheet inventory: exactly 104 rows

This inventory specifies coverage without duplicating the skill's full vocabulary in the plan.

| Order | Family ID / label | Expected rows | Source coverage |
|---|---|---:|---|
| 1 | routes / Edit routes | 15 | All 14 minimal-input routes in SKILL.md, plus camera lock from snippet 8 |
| 2 | render / Render & resolution | 5 | draft, final, 2k, 4k, web-hq |
| 3 | camera / Camera | 11 | Every item in “Camera / focal-length presets” |
| 4 | angles / Angles | 10 | Every item in “Angle presets” |
| 5 | composition / Composition | 13 | Every item in “Composition presets” |
| 6 | lighting / Lighting | 16 | Every item in “Lighting presets” |
| 7 | looks / Looks | 16 | Every item in “Look / production-style presets” |
| 8 | depth-focus / Depth & focus | 6 | Three dof entries followed by three focus entries |
| 9 | presets / Combined presets | 10 | Every item in “Fast professional combinations” |
| 10 | reference-patterns / Reference & markup patterns | 2 | Role-assignment pattern from snippet 3; marked-area pattern from snippet 15 |

There are 102 canonical commands/presets and 2 supplemental patterns. Aliases, examples, individual preset components, tags, and headings do not add rows. Counts describe the inspected source at planning time; future intentional source changes require an explicit catalog revision, not silent count drift.

### ID rules

Use prefixes `route-`, `render-`, `camera-`, `angle-`, `composition-`, `lighting-`, `look-`, `dof-`, `focus-`, and `preset-`, followed by the token suffix. For example, `cam:wide35` has ID `camera-wide35`, `comp:producthero` has ID `composition-producthero`, and `light:highkey` has ID `lighting-highkey`.

Use `route-camera-lock` for `camera lock:`. The two pattern IDs are `pattern-reference-roles` and `pattern-marked-area`. Pattern copy payloads are the complete source templates, including bracketed slots. Do not display a shortened token and accidentally copy that shortened label.

Within each family retain source order. For depth/focus, depth entries precede focus entries. Within Edit routes use the minimal-input order, placing camera lock immediately after perspective. The canonical hq row remains in the source position after motion and before lock.

### Meanings, expansions, and examples

`meaning` is the short description visible in the collapsed row. `direction` gives the full underlying direction. For route entries with only a terse source definition, derive direction from the corresponding Routing paragraph and associated source recipe; do not invent new capabilities.

All command families must be searchable by their displayed family label as well as their tokens. Add family search synonyms `lens` for Camera, `angle` for Angles, `composition` for Composition, `light` for Lighting, and `depth of field` for Depth & focus. Keep these as index metadata rather than artificial repeated prose.

Examples are optional for obvious single tokens. Use source examples for stacked directions and reference roles. An authored example must be labelled as an example, use existing tokens only, and avoid a simultaneous lock/change contradiction. Do not copy the source's reference-sensitive example combinations into a context that claims they always override a base image.

## 4. Source inconsistencies resolved

| Source situation | Canonical app decision | Copy and search behavior |
|---|---|---|
| The route list uses `hq:`; README and examples also use bare `hq` | Display the command as `hq`; keep `hq:` as its alias | Copy token returns `hq`. Both searches find the same row. Gallery restoration still copies its complete source shorthand template. |
| `preset:editorial` uses `cam:50`, while the camera list defines `cam:natural50` | Canonical component ID is `camera-natural50`; `cam:50` is an alias | Copy components emits `cam:natural50`; search accepts both forms. |
| `preset:fashion` uses `cam:85`, while the camera list defines `cam:portrait85` | Canonical component ID is `camera-portrait85`; `cam:85` is an alias | Copy components emits `cam:portrait85`; search accepts both forms. |
| Camera lock appears in snippets rather than the minimal route list | Include one route row `camera lock:` | It is a real source command; do not merge it into generic lock. |
| The clean-commercial recipe uses free-form `look:` wording | Retain it as a Gallery template/example | It does not create a seventeenth named look token. |
| Source examples include free-form role assignments and lock phrases | Treat them as examples of the existing language | Do not infer a formal parser or create a row for every variation. |

These are compatibility mappings in the application. The source files stay untouched. Aliases must map to one canonical record; no alias may shadow another canonical token.

## 5. Source semantics and copy-safe limits

### Fixed notes

Use the following note text as the app's concise contextual copy. Notes are not global warnings and do not appear as repeated banners across every row.

| Caution ID | User-facing text | Where it appears |
|---|---|---|
| preservation | “Prompting can request preservation, but it cannot guarantee identical pixels. Use a local mask or composite the edited area when unchanged pixels must stay exact.” | Surgical, removal, cleanup, camera-lock, markup, and restoration detail sheets |
| reference-roles | “Use the first image as the base unless you specify otherwise. Give each reference one role and transfer only that role. Existing reference constraints take priority over preset defaults.” | Composite, style/tone, identity, pose, product detail; relevant route expansions; every expanded preset |
| camera-cues | “Focal-length names describe a visual look. They do not guarantee a physically simulated lens or camera.” | Camera family introduction; expanded/copied camera direction; camera-related detail where relevant |
| render-size | “Exact dimensions depend on the image backend. If it does not expose pixel controls, 2k and 4k are quality targets. Check the returned image before claiming its size.” | Render family introduction and the expanded 2k/4k/web-hq entries |
| restoration | “Restore the same image's quality. Keep identity, content, framing, geometry, and lighting; do not redesign or invent detail.” | hq row expansion and restoration detail |

Use the exact source direction where it is already complete. Add a concise condition to copied camera/render/preset expansions when needed so the copied text retains the meaning of the above note. Do not append every caution to every copied action; raw tokens and source Gallery prompts remain their specified exact payloads.

### Preservation rules for authoring

Keep changes local to the requested element. An identity transfer preserves base pose, camera, scene, and lighting; a pose transfer preserves identity and wardrobe. Product transfer preserves recognizable package geometry and design. Tone/style transfers named visual qualities without importing reference people, objects, logos, or layout.

Preserve camera, framing, scene geometry, identity, and lighting unless the request changes them. A generic visual preset does not silently reopen all those choices. `hq` repairs accumulated degradation; it is not an enhancement route that adds new texture or content.

The app does not automatically append the skill's iterative-edit quality guard: it has no editing session or knowledge of whether a prompt is a follow-up. That rule remains part of the skill-enabled workflow. The restoration recipe and relevant directions already expose the content the library needs.

### Resolution examples

Include a small expandable “Source dimension examples” section inside the Render & resolution group. Transcribe the full source's suggested mappings, including 3:2 and 2:3 from SKILL.md. Label the column “Source suggested pixels”, not “Guaranteed output”. Some source suggestions approximate the labelled aspect ratio; say so once under the table. Preserve the source's nearest-supported-size condition.

This is reference text, not a dimension calculator or a live backend-capability detector. It is searchable through the render entries. Copy token still copies only `2k`, `4k`, or the selected render token. Do not add a resolution dropdown to the global app header.

## 6. Preset resolution

`resolvePreset` looks up the preset, resolves its component IDs, and returns three useful representations plus relevant notes.

| Representation | Construction | UI use |
|---|---|---|
| Components | The canonical component records, in source order | Each component's token and meaning in expanded preset rows |
| `componentsText` | Canonical component tokens joined with exactly one space | Copy components |
| `expandedText` | One direction per component, in source order, separated by newline; then the reference-priority sentence | Copy expanded direction |
| Caution IDs | Preset caution IDs plus component caution IDs, deduplicated in first-seen order | Contextual notes in disclosure |

The final sentence of expanded preset direction is: “Apply these directions only where they are compatible with the supplied references; preserve all stronger reference constraints unless an override is explicitly requested.”

A component expansion begins with its family label and a colon, followed by its complete direction. Rendering its individual token is separate. Resolve aliases during data conversion, not on every render. Presets cannot contain presets, so there is no recursive expansion graph or cycle resolution at runtime.

The editorial and fashion preset camera corrections must be visible in Copy components. Every other preset retains source component order and identity. Do not add omitted fields: the product preset, for example, need not gain an angle or a depth token merely to look uniform.

## 7. Search algorithm

### Index construction

Build one in-memory index when the bundled catalog loads. Index each technique and each of the 104 Cheatsheet entries once. Derive preset text before indexing. Maintain separate search buckets so a prompt-body match does not outrank a precise token match.

| Bucket | Gallery contents | Cheatsheet contents |
|---|---|---|
| Token | linked canonical tokens and aliases, shorthand template | canonical token, aliases, component tokens/aliases for presets |
| Title | title | meaning |
| Label | category label, tags, explicit searchTerms | family label, explicit searchTerms |
| Summary | summary | concise meaning plus component meanings for presets |
| Body | full prompt, example, relevant caution text | direction or resolved expansion, example, relevant caution text, source dimension examples where applicable |

Do not index local source filenames, arbitrary metadata IDs, or prose from the skill outside the relevant record. A query about a real restriction, such as “pixel” or “reference”, should find the entries where that restriction matters.

### Normalization

Create an exact-search representation and a loose-search representation. Both use Unicode NFKC normalization, lowercase, trimmed ends, and collapsed whitespace. Normalize whitespace around colons for the exact representation, so `cam: wide35` and `cam:wide35` behave consistently. Preserve meaningful token punctuation in that representation.

For the loose representation, replace punctuation/separators with spaces, then collapse whitespace. Split the normalized query into distinct nonempty terms. Ignore punctuation-only queries as empty queries. Treat repeated terms once. Do not implement stemming, typo correction, quoted-phrase syntax, operators, or regular-expression queries.

The field enforces a 200-character maximum and the engine also bounds its input. Trimming affects matching only; do not replace the text currently being typed in the input. Honor IME composition before updating results.

### Matching and scoring

An item qualifies when every loose query term occurs as a substring in at least one of its indexed buckets. The terms may occur in different buckets. A term that matches a token alias qualifies exactly as if it matched its canonical token. Empty query returns all records in source order with score zero.

For qualifying items calculate the following score. Add only the highest applicable whole-query bonus, then add the highest bucket score for each distinct query term.

| Whole-query match | Bonus |
|---|---:|
| Entire exact normalized query equals a canonical token or an alias | 1000 |
| Entire loose query equals the entire normalized title/meaning | 700 |
| Entire loose query occurs contiguously in the title/meaning | 450 |
| Entire query occurs contiguously in a token or shorthand template | 350 |
| None of the above | 0 |

| Best bucket containing one query term | Per-term score |
|---|---:|
| Token | 80 |
| Title | 60 |
| Label | 40 |
| Summary | 20 |
| Body | 5 |

For Gallery, sort by score descending, then recipe order ascending. For Cheatsheet, preserve family order and sort matching entries within each family by score descending, then source order ascending. An exact camera token match therefore leads the Camera group even if other families contain it as a preset component.

One string may live in more than one bucket; count its best term match only, not all duplicates. Aliases never produce duplicate records. A preset matching through one of its components returns the preset row once.

### Search and filter precedence

Run query matching first for both datasets. Those unfiltered counts are the numbers shown on the mode selector. In Gallery, apply the selected category, then favoritesOnly; these filters are an intersection. In Cheatsheet, apply the selected family after query matching. The UI's “N shown” count reflects the active mode's final displayed list.

Category and Favorites selections survive switching away and back. They never suppress Cheatsheet matches. The Cheatsheet family selection likewise never suppresses Gallery matches. Clearing the query preserves mode-specific filters. “Reset filters” resets only the current mode's filters. “Clear search” clears only the query.

If no records survive, the engine returns an empty array with valid query counts. It does not select an arbitrary first item, reset filters, or alter the query.

### Concrete expected cases

| Input/action | Required behavior |
|---|---|
| Empty query, all filters | 15 Gallery results and 104 Cheatsheet rows |
| `CAM: WIDE35` | Finds the canonical camera row despite case/spacing; finds presets and linked content containing that token |
| `cam:50` | Finds camera-natural50 and the editorial preset; no duplicate `cam:50` row |
| `cam:85` | Finds camera-portrait85 and relevant presets; copied canonical component lines use portrait85 |
| `hq:` or `hq` | Finds the same restoration route and Gallery restoration technique; Cheatsheet copy yields `hq` |
| `camera lock` | Finds the separate camera-lock technique and route; generic lock may also match but does not replace them |
| `oversharpening` | Finds Quality restoration through full prompt text even if the word is absent from its title |
| `highkey commercial` | Matches records where both terms occur, including relevant preset components; no query DSL required |
| A unique nonsense string | Both query counts zero; no results; input remains usable |
| Category = Motion; query = a restoration-only phrase | Gallery can show zero while Cheatsheet shows its own query matches |
| Favorites-only with no favorites | Empty favorites state, not an app error |

## 8. Integrity checks and delivery

The integrity check verifies unique IDs, canonical tokens and aliases; expected family coverage; valid category/source/link references; nonempty prompt/template/direction strings; and valid preset components. It also checks that each previewId equals its technique ID. The lead separately verifies that the UI asset map resolves those IDs; the pure engine does not import UI artwork. Errors identify the offending item and field. A total of 104 alone must not hide a duplicate replacing an omitted token.

Use the source headings to compare exact token membership in each family. Check the two alias substitutions and hq canonicalization explicitly. Compare Gallery prompt bodies with the 15 source Expanded/Full snippet bodies after only the specified markup normalization. Run this comparison during implementation verification; no runtime Markdown reader is added.

Focused engine checks cover cross-field AND matching, exact-token rank, stable ordering, aliases, category/favorite intersection, and preset component construction. A handful of representative cases is enough. Do not build a broad UI test suite or a performance harness for 119 records.

The worker delivers complete catalog exports, pure engine exports, and the focused logic checks. UI artwork is not this worker's responsibility. The catalog references the preview IDs, and the UI worker supplies the matching assets.

Completion means every source item is reachable through the app's data model, all copied strings have a defined payload, and no content or engine behavior requires another product decision.
