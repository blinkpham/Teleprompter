# Library Curation State

Status: accepted seed with open coverage · 2026-09-13

## Current checkpoint

- Accepted V2 content version: `legacy-5e21875 + batch 2026-09-13-001` for the 14-record seed only. The remaining 101 legacy rows remain reference-only until covered by later batches.
- Active batch: `2026-09-13-001` — complete legacy inventory, duplication audit, and a small accepted-ready seed for review.
- Product source: Teleprompter contracts in `03 Docs/Teleprompter Plan/`.
- Ownership: this folder only. No application source, original prompt source, or generated artwork was changed.

## Recounted baseline

The live catalog was loaded from `src/content/catalog.ts` and recounts to 104 Cheatsheet entries and 15 Gallery techniques.

| Family | Rows |
|---|---:|
| Edit routes | 15 |
| Render and resolution | 5 |
| Camera | 11 |
| Angles | 10 |
| Composition | 13 |
| Lighting | 16 |
| Looks | 16 |
| Depth and focus | 6 |
| Reference and markup patterns | 2 |
| Combined presets | 10 |
| **Total** | **104** |

## Completed

1. Preserved the 104 live IDs, token text, aliases, source file, source heading, and order in the Batch 0 legacy map.
2. Preserved the 15 numbered technique IDs, shorthand templates, and quick-snippet headings in the same map.
3. Compared normalized tokens, aliases, component sets, and nearest semantic neighbors. No exact normalized token duplicates were found; three explicit aliases are retained.
4. Proposed separate Units, Presets, and Edits trees with field/axis placement and cross-cutting facets in `Taxonomy.md`.
5. Added a small V2 seed: nine atoms, one commercial preset, and four edit recipes whose meanings are directly traceable to existing source text. These are proposed records, not accepted content.
6. Issued six practical-example requests for the seed records. Practical imagery is reserved for an authorized GPT Image 2.5 Flare route; no image was generated here.
7. Logged current public research and access limits in the batch source ledger. MeiGen was used as a discovery reference only; no third-party prompt corpus or images were copied.

## Unresolved decisions

- The remaining 101 legacy rows are explicitly `reference-only` and require field/axis or edit-recipe decomposition before they can become selectable V2 records. The affected groups are listed in `batches/2026-09-13-001/coverage.csv`.
- `composition-social` versus `composition-tight`, `look-commercial` versus `look-campaign`, `lighting-hardflash` versus `lighting-onflash`, and `preset-commercial` versus `preset-cleanblue` need practical comparisons before final merge/retain decisions.
- `route-style` is broader than `route-tone`; keep both legacy strings until the edit-recipe scope decision is accepted.
- Render terms (`draft`, `final`, `2k`, `4k`, `web-hq`) need an OUTPUT contract decision because they are delivery requests, not visual axes.
- A lead must audit draft/favorite references locally before accepting any migration. The curator cannot inspect private user state.
- Practical examples are request-ready but not generated or approved. Record the requested/resolved model separately when the illustrator runs the authorized route.
- Sol consultation was attempted through ChatGPT Web, but Core could not mount this local project; no Sol review of these files is claimed.

## Next concrete task

Lead has accepted the seed and dispatched Illustration from the six AssetRequests. The next curation batch remains camera distance plus focal-perspective comparisons because it resolves the closest duplicate pairs (`camera-wide24`/`camera-closewide24` and `camera-wide35`/`camera-closewide35`).
