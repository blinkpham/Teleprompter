# Batch 0 Review — legacy inventory and curation seed

Status: accepted by Lead for the 14-record seed; open coverage remains · 2026-09-13

## Objective

Account for every live legacy row and source technique, preserve original provenance and IDs, record semantic duplication decisions, propose the canonical three-tree taxonomy, and provide a small V2 seed that an engine worker can review without reconstructing intent from prose.

This batch does not change `src/`, generate images, accept content, or copy a third-party prompt corpus.

## Baseline inventory

The live catalog was recounted from `src/content/catalog.ts` and its source modules. It contains exactly 104 Cheatsheet entries and 15 Gallery techniques.

| Source set | Count | Provenance |
|---|---:|---|
| Edit routes | 15 | `teleprompter/SKILL.md` minimal-input vocabulary plus camera lock / HQ source snippets |
| Render and resolution | 5 | `teleprompter/SKILL.md` resolution and render routing |
| Camera | 11 | `teleprompter/SKILL.md` camera / focal-length presets |
| Angles | 10 | `teleprompter/SKILL.md` angle presets |
| Composition | 13 | `teleprompter/SKILL.md` composition presets |
| Lighting | 16 | `teleprompter/SKILL.md` lighting presets |
| Looks | 16 | `teleprompter/SKILL.md` look / production-style presets |
| Depth and focus | 6 | `teleprompter/SKILL.md` depth-of-field / focus presets |
| Reference and markup patterns | 2 | `teleprompter/assets/quick-snippets.md`, sections 3 and 15 |
| Combined presets | 10 | `teleprompter/SKILL.md`, Fast all-in-one presets |
| **Cheatsheet total** | **104** | |
| **Gallery techniques** | **15** | `teleprompter/assets/quick-snippets.md`, numbered sections 1–15 |

The legacy map contains 119 rows: 104 Cheatsheet entries plus 15 techniques. Each row carries the original ID and token/template, a disposition, target IDs when a seed mapping is defensible, and a reason for any pending status.

## Provenance audit

The original sources remain unchanged. Runtime source references in the baseline are represented as local source records in `sources.jsonl`; new V2 expansions are authored separately in `records.json` and never presented as verbatim third-party material.

- `teleprompter/SKILL.md` is the source of the minimal-input vocabulary, camera, angle, composition, lighting, look, depth/focus, render, and ten preset definitions.
- `teleprompter/assets/quick-snippets.md` is the source of the 15 numbered techniques, full edit wording, multi-reference role pattern, camera-lock wording, restoration wording, and marked-area pattern.
- `teleprompter/references/prompting-strategy.md` is a local reference for role-limited references, visible attributes, geometry sensitivity, and pixel-preservation limits.
- The V2 seed uses paraphrase-only external evidence from OpenAI, Adobe, and MeiGen. MeiGen was accessible at its public documentation and prompt pages; individual community prompts/images were not redistributed or treated as proof of a photographic mechanism.

## Duplication audit

The normalized-token scan found zero exact duplicate tokens. Three explicit aliases are preserved: `hq:` → `hq`, `cam:50` → `cam:natural50`, and `cam:85` → `cam:portrait85`. The current preset component sets are all distinct.

The 25 nearest-neighbor decisions are in `duplicates.csv`. The most important unresolved pairs are:

- `camera-wide24` / `camera-closewide24` and `camera-wide35` / `camera-closewide35`: same focal cue with a possible subject-distance distinction; require fixed-scene comparisons.
- `composition-social` / `composition-tight`: copy-safe mobile space versus immediate crop; keep pending evidence.
- `composition-hero` / `composition-widekey`: subject hierarchy versus environmental context; keep separate pending evidence.
- `lighting-hardflash` / `lighting-onflash`: broad hard-flash character versus on-camera placement/falloff; keep pending evidence.
- `look-commercial` / `look-campaign`: polished advertising finish versus art-directed brand-use finish; keep pending visible-cue evidence.
- `preset-commercial` / `preset-cleanblue`: near-neighbor composites; clean-blue palette and depth are not enough for a final merge without a use-facing comparison.
- `route-style` / `route-tone`: overlapping but different scope. The broader route remains reference-only until the lead decides whether it deserves its own recipe.

Same words in different fields remain namespaced. For example, editorial composition, editorial look, and an editorial preset are not aliases.

## Proposed V2 seed

`records.json` contains 14 proposed records: 9 atoms, 1 preset, and 4 edit recipes.

| Record group | Proposed IDs | Why it is ready for review |
|---|---|---|
| Camera atoms | `atom.camera.focal.wide35`, `.natural50`, `.portrait85`, `atom.camera.depth.medium` | Existing source language is specific enough to separate focal cue from depth; physical optics are explicitly cautioned. |
| View/composition/light atoms | `atom.angle.azimuth.three-quarter`, `atom.composition.hierarchy.hero`, `atom.light.key.high-soft` | Each names an observable relationship that can be isolated in a practical example. |
| Finish atoms | `atom.look.base.commercial`, `atom.look.palette.clean-blue` | Finish and palette are separated from camera and key-light behavior. |
| Preset | `preset.directed-studio.commercial` | The legacy six-component combination is flat, inspectable, and has no unexplained residual prose. Its Directed studio placement is proposed, not accepted. |
| Edit recipes | `edit.local.surgical-correction`, `edit.background.object-removal`, `edit.reference-style.tone-transfer`, `edit.quality-restoration` | Existing full snippets supply slots, affected domains, and preservation wording. |

### Authored defaults

The seed's record labels and axis placements are curator-authored decisions based on the source descriptions. The six-atom commercial preset combination is inherited from the local source and its Directed studio placement is a proposed classification. The synthetic subjects, cobalt object, pale courtyard/studio, 4:3 aspect ratio, and other fixed-scene details in `asset-requests.jsonl` are illustration scaffolding, not catalog semantics.

### Example review strings

Create example, with a synthetic subject and the commercial preset unfolded in canonical axis order:

```text
WHAT: an adult presenting a small cobalt product case.
CAM: Use a classic advertising/social environmental portrait cue with energetic, natural, versatile perspective. Keep the subject clear while the background is softened but still legible.
ANGLE: Use a clean 3/4 view for people, products, desks, or interiors.
COMP: Make the subject dominant with a clear hierarchy, strong silhouette, and advertising key-visual readability.
LIGHT: Use a large soft source, bright exposure, clean whites, open shadows, and polished commercial finish.
LOOK: Use polished professional advertising photography with crisp but natural detail, controlled lighting, clean surfaces, and clear hierarchy.
```

Edit example shape for `edit.local.surgical-correction`:

```text
BASE: Use image 1 as the base.
CHANGES: Change only [the named detail].
KEEP: identity, pose, wardrobe, camera, composition, background, lighting, style, and color. Preserve unaffected objects and regions.
```

These are inspection examples for the lead/engine worker. They do not replace compiler output or silently interpret free WHAT text.

## Research notes

- OpenAI's current image-prompting guide supports the proposed separation: define subject/composition/style/constraints; treat camera specifications as appearance cues; assign roles to references; separate changes from preservation constraints; iterate one change at a time; and inspect the complete output. See [OpenAI Image prompting](https://developers.openai.com/api/docs/guides/image-prompting).
- OpenAI's current Flare model page confirms that `gpt-image-2.5-flare` is a selectable image-generation/editing model with image input/output and configurable quality. See [GPT-Image-2.5 Flare](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare).
- Adobe's focal-length guide supports keeping focal cues observable rather than promising physical simulation: shorter focal lengths give a wider angle of view and longer focal lengths a narrower one. Adobe's perspective guide supports checking foreground, middle ground, background, focal point, and vantage point when composing. See [focal length](https://www.adobe.com/creativecloud/photography/discover/focal-length.html) and [perspective photography](https://www.adobe.com/creativecloud/photography/technique/perspective.html).
- MeiGen's public gallery documentation exposes photography/product categories, prompt inspection, model badges, and creator attribution. Its public prompt page recommends explicit subject, environment, camera, lighting, style, and one-variable iteration. These pages were discovery references only; no prompt text, images, author identity, or engagement data was copied into the catalog. See [MeiGen gallery docs](https://docs.meigen.ai/en/features/gallery) and [MeiGen prompt library](https://meigen.co/prompts).

## Artwork handoff

Six explicit requests are in `asset-requests.jsonl` for the three core visual axes, one palette direction, and the commercial preset. They are review-ready, not approved generation jobs. In accordance with the user override, every practical request records `requestedModel: gpt-image-2.5-flare`; the earlier Sunburst wording in the illustration mission is superseded for this lane. No image-generation call was made and no model was silently substituted.

The fixed variables are written before any creative art direction: subject, scene, camera, composition, light, palette, aspect ratio, and required/avoid cues. The illustrator must still record the resolved model, actual dimensions, prompt, and comparison review before an asset can be approved.

## Validation and limits

Structural validation performed after authoring:

- JSON parses for `batch.json`, `records.json`, `taxa.json`, `axes.json`, `cautions.json`, `changes.json`, and `legacy-map.json`.
- JSONL parses for `sources.jsonl` and `asset-requests.jsonl`.
- Counts: 119 legacy-map rows, 14 proposed records, 26 axes, 22 taxa, 14 changes, 19 sources, and 6 asset requests.
- All seed `primaryTaxonId`, `axisId`, `sourceIds`, `cautionIds`, preset atom IDs, preset scope axes, edit exclusions, and asset-request source IDs resolve within this batch.
- All legacy-map retained/alias target IDs resolve to a proposed record; unresolved rows have explicit `reference-only` dispositions and empty target arrays.

This is a curation-batch check, not a substitute for the lead's V2 runtime validator. The lead still needs to audit private draft/favorite references, validate contract import behavior, and accept or revise the seed before any application content changes.

## Review boundary

Sol consultation was attempted through ChatGPT Web, but Core could not mount the local project. This batch therefore contains no claim that Sol reviewed these files.

## Decision requested

Accept or revise the seed mappings, then choose one follow-up batch. The recommended next batch is camera distance and focal-perspective comparisons because it addresses the two closest current duplicate pairs and affects the largest number of future practical examples.
