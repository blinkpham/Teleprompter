# Batch 002 Lead Review — 2026-09-16

## Decision

**REVISE — KEEP PROPOSED / REFERENCE-ONLY.** Do not promote Batch 002 into the live LibraryV2 seed or release its illustration requests. The decomposition is promising, but the packet has unresolved semantic, request-design, and runtime-import blockers.

This review is lead-facing evidence only. It does not accept records, authorize generation, or change the accepted runtime boundary.

## Evidence reviewed

- `STATE.md`, `INDEX.md`, `Taxonomy.md`, the Teleprompter authority, and the curator and illustration missions.
- Accepted Batch 001, the Batch 002 packet (`batch.json`, `records.json`, `changes.json`, `legacy-map.json`, `comparison-2x2.json`, `asset-requests.jsonl`, `sources.jsonl`, `duplicates.csv`, and `coverage.csv`).
- `src/shared/teleprompter-types.ts`, `src/shared/teleprompter-validation.ts`, `src/content/legacy-adapter.ts`, and the catalog-integrity expectations.

The live recount matches the recorded baseline: 104 Cheatsheet entries and 15 Gallery techniques. Batch 002 contains four candidate records, five asset requests, and four 2x2 cells; it does not change the accepted 14-record runtime seed.

## Checks run

- `validateLibrary` passed for the assembled Batch 001 + Batch 002 candidate set, with no dangling source, caution, atom, request, or legacy links.
- The same validator passed after normalizing the candidate IDs to the live registry namespace. This confirms internal shape/link validity, not runtime importability.
- Direct registry comparison found three raw batch IDs that do not match the adapter: `units.optics.camera`, `camera.focal`, and `camera.distance` versus `taxon.units.optics.camera`, `axis.camera.focal`, and `axis.camera.distance`.
- Batch 001 has 119 legacy-map rows; Batch 002 maps exactly its four affected legacy IDs, with no missing replacements. The packet still needs the lead-owned private draft/favorite impact audit.
- Both CSV files have balanced quoting, eight-column headers, and no bad-width rows.
- `npm run typecheck`, `npm run test:logic`, and `npm run build` could not run because this checkout has no installed dependencies (`tsc`, `vitest`, and `electron-vite` are unavailable).

## Findings

### Blocking before acceptance

1. **Focal and distance are not yet MECE.** `atom.camera.focal.wide24` assigns pronounced foreground/background scale to focal length, while `atom.camera.distance.close` assigns nearby-feature/background scale to camera position. Those are overlapping observable meanings. Keep focal responsible for field of view, environmental coverage, and the 24mm-class cue. Keep distance responsible for viewpoint-driven relative scale. Preserve the stronger foreground/background wording as source evidence or a legacy qualifier, not as the normalized focal definition.

2. **All five practical requests and the 2x2 encode contradictory controls.** The focal request `.01` holds crop and final subject size constant while changing focal length; `.04` repeats the same problem at close distance and also asks focal length to own near/far scale. Requests `.02` and `.03` move the camera while holding final subject scale constant and forbidding crop-only compensation. `.05` and the matrix repeat the conflict. Rewrite the request set together:

   - Focal comparisons hold camera position/viewpoint fixed and let field of view, image size, and framing change naturally; judge wider versus narrower coverage.
   - Distance comparisons hold focal length fixed and move the viewpoint; let subject image size and framing change naturally; judge near-feature versus background relative scale.
   - Across both comparisons, hold identity, pose, prop, scene geometry, camera height/orientation, aiming target, lighting, aspect ratio, and the intended scene constant.

3. **Raw candidate IDs are not import-safe against the current adapter.** The shared validator checks relational consistency but does not require the `taxon.*` and `axis.*` prefixes. Normalize the revised packet to the live IDs, or document and test one deterministic lead-owned translation step before import. A batch-local validator pass alone is insufficient evidence.

4. **The proposal lifecycle needs an import guard.** The four records use `status: active`, which is valid because `CommonRecord.status` only permits `active | deprecated`; changing that to `proposed` would create a contract violation. The integration path must nevertheless prevent a batch whose envelope is `proposed` from entering live LibraryV2, drafts, or favorites. Confirm this guard before acceptance.

### Required lead audit

5. **Migration shape is complete, but impact is not proven.** The four legacy mappings cover the delta, and the flat bundles recover the intended focal-plus-distance combinations. `affectedDraftIds` and `affectedFavoriteIds` are empty, while every change marks `impactAuditRequired: true`; the lead must inspect the real draft/favorite stores and verify no silent loss. Confirm that wide35 remains unchanged and that both close-wide bundles recover exactly from their two atoms.

6. **Illustration is structurally prepared, not generation-ready.** Request IDs, source links, fixed-scene fields, and the requested `gpt-image-2.5-flare` model are present. That does not prove the route exists, authorize generation, or prove an exact optical setting. Keep illustration blocked until the controls are rewritten, the lead accepts the request IDs, and the direct Flare route/model evidence is captured.

## What passes

- Four candidates stay within the curator mission cap and use the intended single parent.
- The proposed `wide24` + `close` atom decomposition and flat `closewide24` / `closewide35` bundles are a workable direction after the semantic rewrite.
- Provenance distinguishes source descriptions, web paraphrase support, and curator-authored mapping; the packet does not by itself prove backend obedience or exact EXIF values.
- JSON, JSONL, CSV shape, link integrity, and internal shared-validator checks pass for the assembled proposal.

## Exact next gate

1. Produce a versioned revision, preferably a new Batch 003 or equivalent proposal, without editing the immutable Batch 002 evidence. Correct the live ID namespace, focal/distance meanings, all five asset requests, and the 2x2 controls.
2. Lead-assemble the complete live library plus the revised candidates at adapter content version `2026-09-13.2`; run `validateLibrary` and focused compiler/import checks against the actual registry.
3. Complete the private draft/favorite impact audit and confirm deterministic legacy recovery, unchanged wide35, and exact flat-bundle reconstruction.
4. Decide the 2x2 only after the revised fixed/variable rules pass. Keep the batch out of runtime until the batch envelope is explicitly changed to `accepted` by the lead.
5. If accepted, let illustration consume only the exact accepted request IDs after direct `gpt-image-2.5-flare` route evidence. Otherwise keep the requests reference-only and revise again.

## Sol consultation

- **Pre-review:** Sol advised one primary axis per candidate, focal-versus-distance separation, source/authored distinction, complete legacy tracing, and fixed-scene cells with one controlled variable.
- **Post-review:** Sol confirmed the focal/distance overlap and identified the request contradiction as affecting all five requests, not only the matrix. Sol also confirmed that active record status is contract-valid, while the proposed batch still requires an import guard, and supplied the acceptance gate above.

## Limitations

This review has no generated visual examples, native-runtime evidence, direct Flare route evidence, or access to the private draft/favorite stores. Package-level scripts remain unrun because dependencies are absent.

## Files changed

- Added this review only. Existing Batch 002 evidence, `STATE.md`, `INDEX.md`, runtime content, native app files, and artwork were not changed.
