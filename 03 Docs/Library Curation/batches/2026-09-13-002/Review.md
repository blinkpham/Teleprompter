# Batch 002 Review — camera distance and focal-perspective comparisons

Status: proposed for Lead review · 2026-09-13

## Objective

Separate the focal cue from subject distance in the two closest legacy camera pairs, preserve the old close-wide shorthand as a decomposable bundle, and prepare matched practical comparison requests. This batch does not change application source, the accepted 14-record runtime seed, the 101 legacy reference-only rows, or artwork files.

## Live baseline and scope

The live catalog was recounted from `src/content/catalog.ts` and its source modules: 104 Cheatsheet entries and 15 Gallery techniques. Batch 0 remains the complete 119-row legacy map. The accepted runtime boundary remains the 14-record seed from Batch `2026-09-13-001`; this batch adds four proposed records for review only.

Affected legacy IDs are exactly `camera-wide24`, `camera-closewide24`, `camera-wide35`, and `camera-closewide35`. The other 101 legacy rows are not remapped here and remain reference-only or previously accepted according to Batch 0.

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
| `atom.camera.focal.wide24` | New focal cue for the plain `wide24` legacy record. | accepted-ready for lead review; practical proof pending | Units → Optics → Camera; `camera.focal` |
| `atom.camera.distance.close` | New independently selectable near-camera cue. | accepted-ready for lead review; practical proof pending | Units → Optics → Camera; `camera.distance` |
| `bundle.camera.closewide24` | Decomposes the close-wide 24 legacy string. | accepted-ready for lead review; comparison pending | Units → Optics → Camera; flat bundle |
| `bundle.camera.closewide35` | Decomposes the close-wide 35 legacy string. | accepted-ready for lead review; comparison pending | Units → Optics → Camera; flat bundle |

No new axis or taxonomy node is needed. Existing `camera.focal` and `camera.distance` axes already provide the contract surface. One caution, `camera-distance`, is added to keep the measured-distance and backend-fidelity boundary visible.

## Duplicate and migration decisions

The two close-wide pairs are `retain-as-atom-plus-bundle`, not aliases, because the close qualifier is an independently adjustable distance direction. `camera-wide24` and `camera-wide35` remain focal atoms; their close-wide partners map to bundles rather than silently losing the distance intent. The new focal comparison and close-distance comparison remain pending practical evidence in `duplicates.csv`.

The four-row `legacy-map.json` is scoped to the affected IDs. Batch 0 remains the recovery map for all 119 legacy rows. No draft or favorite IDs are available to the curator; every change therefore sets `impactAuditRequired:true` and leaves affected ID arrays empty for the lead's local audit.

## AssetRequests

Four requests are included only because the record meanings and taxonomy placement are decided enough to state a controlled visual test. They are not generation authorization. Each request names its controlled variable, fixed scene, required cues, avoid cues, source IDs, and requested model. The first compares 24mm-class against 35mm-class at a neutral distance; the next two hold focal cue constant while testing close distance; the last holds close distance constant while comparing focal cues. The requests support the focal-vs-distance shorthand decision and do not introduce a new style, look, or preset.

No other asset requests are authorized in this batch. In particular, no requests are issued yet for 18mm, 28mm, 135mm, macro, fisheye, depth/focus, or adjacent composition duplicates. The illustrator must consume only requests that the lead explicitly accepts from this file.

## Validation

The batch files were checked for:

- valid JSON, JSONL, and CSV parsing;
- unique record, source, and caution IDs within the batch;
- all record source/caution/axis/taxon references resolving against Batch 0 or this batch;
- bundle atom IDs resolving to atoms only, with no nested bundle or preset;
- `camera.focal` and `camera.distance` cardinalities matching the accepted axis registry;
- exactly four affected legacy IDs, with the full 119-row recovery map still supplied by Batch 0;
- exactly four comparison AssetRequests using only record and source IDs that resolve;
- preservation of the accepted 14-record seed and untouched application files.

This is a structural curation check, not proof of visual backend behavior. Lead acceptance still needs the practical comparison review and local draft/favorite impact audit.

## Open decisions and next action

1. Lead decides whether `atom.camera.distance.close` is useful as a general camera-distance choice after reviewing the matched comparisons.
2. Lead decides whether the two bundles remain visibly distinct from their plain focal atoms and from each other in the target generation path.
3. If accepted, the illustrator may consume only the four lead-approved requests and must report actual model evidence and visual review. If revised, keep the legacy close-wide rows reference-only and publish a new bounded batch.

## Consultation boundary

The existing Sol/Core in-app conversation returned a bounded review. It confirmed that the `camera.focal` / `camera.distance` split and the two flat bundle mappings are the sound candidate model, while advising that both close-wide distinctions remain pending until fixed-scene comparisons show repeatable near-feature scale differences without crop, camera-height, pose, lighting, or composition drift. It also called the 24mm pair especially ambiguous because the plain `wide24` source already names foreground/background scale. This batch records that review as consultation evidence; the lead still owns acceptance and no runtime content is changed here.
