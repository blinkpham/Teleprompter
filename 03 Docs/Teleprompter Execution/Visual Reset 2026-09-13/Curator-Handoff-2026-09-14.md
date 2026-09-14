# Curator handoff — Batch 002

Date: 2026-09-14
From → To: Library Curator → Teleprompter lead / Illustration owner
Project: Teleprompter

## Outcome

**Ready for lead review; blocked for Illustration.** The camera semantics and migration packet are curator-accepted. The live app remains unchanged: the four new Batch 002 records are proposed and reference-only until lead acceptance, matched evidence, and the local draft/favorite impact audit complete.

## Decision

| Legacy shorthand | Proposed V2 meaning | Gate |
|---|---|---|
| `cam:wide24` | `atom.camera.focal.wide24` | Candidate; remains reference-only pending 2×2 evidence |
| `cam:closewide24` | `bundle.camera.closewide24 = atom.camera.focal.wide24 + atom.camera.distance.close` | Candidate; remains reference-only pending 2×2 evidence |
| `cam:wide35` | Existing accepted `atom.camera.focal.wide35` | Reused from Batch 001; not changed here |
| `cam:closewide35` | `bundle.camera.closewide35 = atom.camera.focal.wide35 + atom.camera.distance.close` | Candidate; remains reference-only pending 2×2 evidence |

`cam:close` is a composable subject-distance cue. It does not mean tight crop, digital zoom, shallow depth of field, focus target, measured camera distance, or physical lens simulation. The bundle preserves the original close-wide shorthand while exposing its independent focal and distance decisions.

## Curator-accepted illustration briefs

The five request lines in [asset-requests.jsonl](../../Library%20Curation/batches/2026-09-13-002/asset-requests.jsonl) are review-ready briefs, not permission to generate:

1. 24mm-class versus accepted 35mm-class at neutral distance.
2. 24mm-class neutral versus close distance.
3. 35mm-class neutral versus close distance.
4. 24mm-class close versus 35mm-class close.
5. The primary fixed-scene 2×2 matrix in [comparison-2x2.json](../../Library%20Curation/batches/2026-09-13-002/comparison-2x2.json).

The matrix fixes one synthetic subject, cobalt product case, pale concrete courtyard, eye-height camera, neutral wardrobe, soft daylight, 4:3 landscape, pose, crop intent, subject scale, and background geometry. Rows are focal cue; columns are distance cue. Any crop, subject-scale, camera-height, pose, lighting, or scene change invalidates the comparison as evidence.

## Source and provenance mapping

| Candidate | Local meaning source | Technical corroboration | Authored/provenance boundary |
|---|---|---|---|
| `wide24` | `local.skill.camera` | `web.adobe.focal-length`, `web.adobe.camera-shots`, `web.canon.perspective`, `web.openai.image-prompting` | 24mm-class and the visible environmental effect are source-backed cues; backend obedience is unproven |
| `close` | `local.skill.camera` | `web.adobe.perspective`, `web.adobe.depth-of-field`, `web.canon.perspective`, `web.openai.image-prompting` | Separate distance axis and `cam:close` shorthand are curator-authored decomposition; no measured-distance claim |
| `closewide24` / `closewide35` | `local.skill.camera` | Focal-length, shot-distance, perspective, and prompt-structure sources above | Flat bundle mapping preserves legacy meaning; relative 24/35 and close/neutral appearance require fixed-scene evidence |
| Flare gate | Base source `web.openai.flare` plus [Model-Route-Evidence.md](../Artwork/Model-Route-Evidence.md) | Official availability is not local route proof | Requested model is `gpt-image-2.5-flare`; resolved model remains unknown until an authorized route reports it |

All source rows are paraphrase-only or original curator reasoning. No third-party prompt corpus or image was copied.

## Excluded from this handoff

- No runtime content, renderer asset, asset manifest, compiler semantics, preset, edit recipe, or shared contract change.
- No activation of adapter-generated candidates or any of the 101 legacy reference-only rows.
- No promotion of `close` into an alias for crop, focus, depth, or output.
- No image generation, alternate backend, metered call, or claim that the existing built-in route is Flare.
- No private draft/favorite inspection; lead-owned impact audit remains required.

## Verification

- Parsed all batch JSON and JSONL files, including the 2×2 matrix.
- Checked record IDs, source IDs, caution IDs, axes, bundle atom links, request record links, and legacy targets against Batch 001 plus Batch 002.
- Confirmed the four affected legacy IDs remain recoverable through Batch 001's complete legacy map and Batch 002's proposed delta.
- Confirmed the accepted 14-record seed and application sources are untouched.
- Structural checks do not prove generated-image fidelity or model routing.

## Next action

Lead reads [Review.md](../../Library%20Curation/batches/2026-09-13-002/Review.md), runs the shared-contract/import check and draft/favorite impact audit, then either accepts the proposed batch for the 2×2 review or keeps all four new records reference-only. Illustration proceeds only after that acceptance and explicit exact-model Flare route evidence.
