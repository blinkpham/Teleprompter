# Batch 002 Review — camera distance and focal-perspective comparisons

Status: curator-reviewed; proposed and needs evidence before lead acceptance · 2026-09-14

## Objective

Separate the focal cue from subject distance in the two closest legacy camera pairs, preserve the old close-wide shorthand as a decomposable bundle, and prepare matched practical comparison requests. This batch does not change application source, the accepted 14-record runtime seed, the 101 legacy reference-only rows, or artwork files.

## Live baseline and scope

The live catalog was recounted from `src/content/catalog.ts` and its source modules: 104 Cheatsheet entries and 15 Gallery techniques. Batch 0 remains the complete 119-row legacy map. The accepted runtime boundary remains the 14-record seed from Batch `2026-09-13-001`; this batch adds four proposed records for review only.

Affected legacy IDs are exactly `camera-wide24`, `camera-closewide24`, `camera-wide35`, and `camera-closewide35`. The other 101 legacy rows are not remapped here and remain reference-only or previously accepted according to Batch 0.

## Curator decision and gate

The semantic model is curator-accepted as a review packet, not as runtime content:

- `cam:wide24` is a focal atom under `camera.focal`.
- `cam:close` is a separate subject-distance atom under `camera.distance`; it is a requested spatial cue, not a measured distance, crop, zoom, or focus target.
- `cam:closewide24` and `cam:closewide35` remain flat focal-plus-distance bundles so their shorthand meaning survives decomposition.
- `cam:wide35` remains the accepted Batch 001 focal atom and is reused as the neutral 35mm comparison cell; this batch does not alter it.

The four Batch 002 candidate records remain `reference-only` in the live app because the batch is still proposed. The legacy strings remain recoverable through Batch 001's complete map plus this batch's four-row proposed delta. No adapter-generated candidate or proposed record may be activated from this packet.

The packet is **ready for lead review, blocked for Illustration**. Illustration can consume the curator-accepted briefs only after the lead accepts the batch and the exact `gpt-image-2.5-flare` route is selected and evidenced. The official model page is availability evidence, not workspace route proof; the current built-in image route does not expose a selectable or resolved model ID.

## Authored decisions

The legacy source describes `cam:wide24` as an energetic 24mm environmental advertising cue and `cam:closewide24` as a physically close 24mm-class cue with exaggerated near hands/products. It similarly distinguishes `cam:wide35` from `cam:closewide35` by a close, dimensional commercial-portrait qualifier. The cleanest V2 representation is:

```text
cam:wide24       -> atom.camera.focal.wide24
cam:close        -> atom.camera.distance.close
cam:closewide24  -> bundle.camera.closewide24 = wide24 + close
cam:wide35       -> accepted atom.camera.focal.wide35
cam:closewide35  -> bundle.camera.closewide35 = wide35 + close
```

The 24mm and 35mm records remain distinct because their intended focal cues differ: the 24mm direction is expected to show a wider field and stronger near/far scale separation, while the 35mm direction is expected to remain environmental with less exaggeration. The close distance is a separate axis because proximity changes the relative scale of near features and background; it is not the same decision as crop, focus target, or depth of field.

The new shorthand `cam:close` is composable and intentionally plain. It is not an alias for `comp:tight`, `focus:*`, or a guarantee of a measured physical distance. The two old close-wide strings remain visible as bundles so existing users can recover the same combined intent without memorizing the decomposition.

## Sources and evidence boundary

The local source records the legacy meanings and already carries the visual-cue limitation. Adobe's focal-length guidance separates focal length from the amount of scene captured and the apparent relationship between objects; its shot guide separately discusses distance-based framing. Adobe's perspective guide describes physical perspective as a function of distance and recommends checking foreground, middle ground, background, focal point, and vantage point. Canon's manufacturer guide contrasts wider spatial perspective with longer-lens compression. Adobe's depth-of-field guide lists camera-subject distance as a factor affecting the sharpness zone, which supports keeping distance separate from focus and depth axes.

These sources support the taxonomy and the proposed visible tests. They do not prove that an image-generation backend will obey a focal or distance phrase. The source ledger records exact URLs, authors, access date, paraphrased evidence, and paraphrase-only reuse.

## Candidate records

| Record | Role | Status | Canonical placement |
|---|---|---|---|
| `atom.camera.focal.wide24` | New focal cue for the plain `wide24` legacy record. | curator-accepted candidate; reference-only until lead acceptance and comparison evidence | Units → Optics → Camera; `camera.focal` |
| `atom.camera.distance.close` | New independently selectable near-camera cue. | curator-accepted candidate; reference-only until lead acceptance and comparison evidence | Units → Optics → Camera; `camera.distance` |
| `bundle.camera.closewide24` | Decomposes the close-wide 24 legacy string. | curator-accepted candidate; reference-only until lead acceptance and comparison evidence | Units → Optics → Camera; flat bundle |
| `bundle.camera.closewide35` | Decomposes the close-wide 35 legacy string. | curator-accepted candidate; reference-only until lead acceptance and comparison evidence | Units → Optics → Camera; flat bundle |

No new axis or taxonomy node is needed. Existing `camera.focal` and `camera.distance` axes already provide the contract surface. One caution, `camera-distance`, is added to keep the measured-distance and backend-fidelity boundary visible.

## Duplicate and migration decisions

The two close-wide pairs are `retain-as-atom-plus-bundle`, not aliases, because the close qualifier is an independently adjustable distance direction. `camera-wide24` and `camera-wide35` remain focal atoms; their close-wide partners map to bundles rather than silently losing the distance intent. The new focal comparison and close-distance comparison remain pending practical evidence in `duplicates.csv`.

The four-row `legacy-map.json` is scoped to the affected IDs. Batch 0 remains the recovery map for all 119 legacy rows. No draft or favorite IDs are available to the curator; every change therefore sets `impactAuditRequired:true` and leaves affected ID arrays empty for the lead's local audit.

## AssetRequests

Five requests are curator-accepted as illustration briefs only because the record meanings and taxonomy placement are decided enough to state controlled visual tests. They are not generation authorization. Each request names its controlled variable, fixed scene, required cues, avoid cues, source IDs, and requested model. The first four are focused pairwise diagnostics. `asset-request.batch-002.2x2` is the primary fixed-scene matrix: 24mm-class versus 35mm-class on rows, neutral versus close distance on columns. Its machine-readable matrix is in `comparison-2x2.json`.

The 2×2 matrix must be evaluated as one controlled scene, not as four unrelated examples. A result that changes crop, subject scale, camera height, pose, lighting, or courtyard geometry cannot close the distinction even if its labels look correct.

No other asset requests are included in this batch. In particular, no requests are issued for 18mm, 28mm, 135mm, macro, fisheye, depth/focus, or adjacent composition duplicates. The illustrator must consume only requests that the lead explicitly accepts from this file and the matrix companion.

## Exclusions

- No Batch 002 record is added to the 14-record runtime boundary.
- No legacy prompt text, shorthand, technique, style, or preset is rewritten; the four affected IDs remain recoverable through the proposed map chain.
- `close` is not an alias for `comp:tight`, `focus:*`, `camera.depth`, or a guaranteed physical lens/camera measurement.
- No new taxonomy node, output policy, preset, edit recipe, renderer asset, manifest entry, compiler behavior, or application source is part of this batch.
- No practical image was generated, no metered route was used, and no unknown backend may be labeled Flare.
- No private draft/favorite state was inspected; the lead must perform the local impact audit before migration acceptance.

## Validation

The batch files were checked for:

- valid JSON, JSONL, and CSV parsing;
- unique record, source, and caution IDs within the batch;
- all record source/caution/axis/taxon references resolving against Batch 0 or this batch;
- bundle atom IDs resolving to atoms only, with no nested bundle or preset;
- `camera.focal` and `camera.distance` cardinalities matching the accepted axis registry;
- exactly four affected legacy IDs, with the full 119-row recovery map still supplied by Batch 0;
- five comparison AssetRequests using only record and source IDs that resolve, plus a matching fixed-scene `comparison-2x2.json` matrix;
- preservation of the accepted 14-record seed and untouched application files.

This is a structural curation check, not proof of visual backend behavior. Lead acceptance still needs the practical comparison review and local draft/favorite impact audit.

## Open decisions and next action

1. Lead decides whether `atom.camera.distance.close` is useful as a general camera-distance choice after reviewing the 2×2 matrix.
2. Lead decides whether the two bundles remain visibly distinct from their plain focal atoms and from each other in the target generation path.
3. Lead audits local draft/favorite references and accepts or revises the proposed four-row migration delta.
4. If accepted and the exact Flare route is evidenced, Illustration may consume only the lead-approved request lines and matrix. If either gate fails, keep the four new candidates reference-only and publish a new bounded batch or route request.

## Consultation boundary

The existing Sol/Core in-app conversation returned a bounded review. It confirmed that the `camera.focal` / `camera.distance` split and the two flat bundle mappings are the sound candidate model, while advising that both close-wide distinctions remain pending until fixed-scene comparisons show repeatable near-feature scale differences without crop, camera-height, pose, lighting, or composition drift. It also called the 24mm pair especially ambiguous because the plain `wide24` source already names foreground/background scale. This batch records that review as consultation evidence; the lead still owns acceptance and no runtime content is changed here.
