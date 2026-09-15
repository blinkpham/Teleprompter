# Curator handoff — proposed taxonomy and capped illustration briefs

Date: 2026-09-15
From → To: Library Curator → Teleprompter lead / Illustration owner
Project: Teleprompter
Status: **Proposed/reference-only. No runtime promotion or generation authorization.**

## Outcome

This packet proposes how the legacy shorthands, Gallery techniques, camera directions, and visual directions should be classified before any Illustration Generator work. It preserves the accepted 14-record runtime seed and treats the remaining 101 legacy rows, including Batch 002's four camera candidates, as reference-only.

The proposed taxonomy has one canonical home per record:

| Meaning | Canonical home | Rule |
|---|---|---|
| A named operation or preservation instruction | `edits.*` or a constraint modifier | It changes an existing image or protects a named domain. `lock:` is a modifier, not a visual style. |
| A reusable Gallery workflow | technique recipe over one or more edit/visual records | The technique card is a workflow and display object; it is not a second taxonomy parent. |
| Camera style | `units.optics.camera` or `units.optics.angle` | Split focal cue, subject distance, depth, focus target, elevation, azimuth, and roll. Do not ship an opaque “camera style” atom. |
| Visual direction | `units.stage.*` or `units.finish.*` | Composition and light describe the staged image; look, palette, texture, retouch, treatment, and mood describe the finish. |
| Multi-axis recipe | `presets.*` | A preset is a visible recipe of atoms, not a hidden paragraph or a substitute for an axis. |
| Delivery or author constraint | `units.output` or `units.constraints` | Aspect ratio/resolution and IMPORTANT/AVOID text are not visual examples. |
| Reference-role or markup grammar | reference/authoring contract | These define how references or marked areas are used; they are not image-style atoms. |

## Runtime and artwork boundary

- The accepted runtime boundary is exactly the 14 records in Batch `2026-09-13-001`: nine atoms, one preset, and four edit recipes. No file in this handoff changes that set.
- Batch `2026-09-13-002` remains proposed. Its four candidates (`wide24`, `close`, `closewide24`, `closewide35`) may appear in briefs but must not enter the runtime library, drafts, favorites, or manifest. Its Markdown says proposed/reference-only, but its machine records currently carry `status: active`; that is a promotion hazard to resolve at the lead gate. This handoff does not edit the existing batch.
- Existing Optics, Stage, and Finish rasters remain family identity decoration only. They do not depict focal length, distance, depth, viewpoint, composition, lighting, or look values.
- The six request lines in `AssetRequests-2026-09-15.jsonl` are curator-reviewed proposed briefs for lead acceptance only. `generationAuthorization` is `not-granted`; each requests `gpt-image-2.5-flare` but no route or resolved model has been evidenced.
- Illustration may consume only lead-accepted requests after the exact Flare route is selected and reported. No Sunburst, alternate backend, metered call, asset manifest change, or practical-art claim is authorized by this handoff.

## Proposed taxonomy decisions

### 1. Shorthands

The shorthand token remains a source-facing alias or command spelling. Its canonical record is determined by meaning, not by the old family label.

| Source family / examples | Proposed classification | Current boundary |
|---|---|---|
| `fix:`, `remove:`, `swap:`, `face:`, `pose:`, `product:` | `edits.local-correction`, `edits.object-removal`, or `edits.reference-composite` | Preserve role limits and affected domains; do not turn reference roles into style labels. |
| `style:`, `tone:` | `edits.reference-style-transfer` | Keep `style:` broader than `tone:` until the scope decision is accepted; neither may copy identity, objects, logos, or layout. |
| `perspective:`, `camera lock:`, marked-area pattern | `perspective:` → `edits.geometry`; `camera lock:` → preservation constraint; marked areas → authoring/constraint layer | Geometry edits retain subject and camera boundaries unless the request explicitly changes them. The actual operation family wins for markup-directed removal, recolour, or replacement. |
| `reframe:` | Proposed `edits.reframe` recipe | It changes output ratio/crop while preserving scale and camera feel; do not bury it in `composition.tight`. |
| `clean:` | Proposed `edits.environment-cleanup` recipe | Broader than one-object removal; architecture and negative space are preservation criteria. |
| `motion:` | Mode-aware route: Edit → proposed `edits.motion-treatment`; Create → proposed `look.treatment.motion` | Directional blur/afterimage is a treatment operation, not a lighting or camera atom. |
| `hq` / `hq:` | Accepted seed `edit.quality-restoration` | Restoration preserves content and layout; `2k`/`4k` remain output targets, not restoration styles. |
| `lock:` | Constraint modifier | It can attach to another operation and should not appear as a selectable look. |
| `draft`, `final`, `2k`, `4k`, `web-hq` | `units.output` | They describe delivery intent. They do not prove pixels, backend size, or visual quality. |
| `1=base; 2=[role]...` | Reference-role authoring contract | It assigns source roles before compilation; it is not a preset or a visual atom. |

### 2. Techniques

Techniques remain Gallery workflows. The existing `categoryId` is a browse grouping, not the canonical taxonomy. The proposed semantic mapping is:

| Technique | Proposed home | Record shape |
|---|---|---|
| Surgical edit | `edits.local-correction` | One named change plus preservation domains |
| Remove one thing | `edits.object-removal` | One target plus reconstructed background |
| Multi-reference composite | `edits.reference-composite` | Base reference plus role-limited references |
| Style & tone transfer | `edits.reference-style-transfer` | Named finish attributes only |
| Face & identity transfer | `edits.reference-composite` | Identity role with pose/camera/scene preservation |
| Pose transfer | `edits.reference-composite` | Pose role with joint/contact success criteria |
| Perspective correction | `edits.geometry` | Marked geometry and vanishing-point correction |
| Camera lock | Preservation constraint attached to another operation | It is a guardrail, not a geometry record by itself. |
| Reframe | Proposed `edits.reframe` | Output ratio/crop change with preserved scene relationships |
| Clean environment | Proposed `edits.environment-cleanup` | Multi-target cleanup with architecture preservation |
| Product fidelity | `edits.reference-composite` | Product role with geometry, branding, scale, and lighting checks |
| Controlled motion | Mode-aware: Edit `edits.motion-treatment`; Create `look.treatment.motion` | The technique card chooses the route from the task mode. |
| Quality restoration | Accepted seed `edits.quality-restoration` | Fidelity repair only |
| Clean commercial photography | Proposed finish bundle | Decompose into high-key light, clean-blue palette, and commercial finish before promotion |
| Markup-directed edit | Authoring/constraint layer over the actual operation family | Marked region is authoritative; unmarked regions remain protected. A removal, recolour, or product replacement stays in its operation family. |

The technique may reference several atoms, but it has one primary operation family. It must not create a second parent for a record already in Units, Finish, or Presets.

### 3. Camera styles

“Camera style” is a user-facing grouping label only. The selectable semantics are separate axes:

| Axis | Include | Exclude | Proposed examples |
|---|---|---|---|
| `camera.focal` | Focal-perspective appearance and field-of-view cue | Physical-lens guarantee, subject distance, crop, focus target | Accepted `wide35`, `natural50`, `portrait85`; proposed `wide24`; `wide18`, `wide28`, `tele135` remain reference-only |
| `camera.distance` | Near/far camera position shown by near-feature versus background scale | Crop, digital zoom, depth, focus, measured distance | Proposed `close`; Batch 002 bundles preserve `closewide24`/`closewide35` |
| `camera.depth` | Depth-of-field/readability direction | Focus target or focal length | Accepted `medium`; `deep` and `shallow` remain reference-only |
| `camera.focus` | Priority sharpness target | Depth-of-field promise or subject distance | `product`, `face`, and `scene` remain reference-only |
| `angle.elevation` | Eye, high, low, top-down, worm viewpoint | Subject hierarchy or crop | Proposed family; no new runtime records |
| `angle.azimuth` | Front, three-quarter, profile, over-shoulder relationship | Foreground depth when it is the actual composition choice | Accepted `three-quarter`; others remain reference-only |
| `angle.roll` | Dutch/tilted horizon | Accidental crookedness or perspective correction | Proposed family; `dutch` remains reference-only |
| Proposed `camera.distortion` | Fisheye/barrel geometry as an explicit effect | Ordinary wide-angle field of view | `fisheye` remains reference-only until a distortion axis is accepted |
| Reference-only macro/detail bundle | Keep `macro100` outside the axis taxonomy for now | It combines scale, working distance, focal/compression, and often shallow depth; later decide between a deconstructible bundle and a workflow/preset | `macro100` remains reference-only pending that decision |

The existing Batch 002 rule remains: `cam:closewide24` and `cam:closewide35` are flat focal-plus-distance bundles, not aliases. Their visible distinction requires a fixed-scene comparison with subject identity, pose, camera height, light, scene geometry, output canvas, and product held constant. Distance-driven framing, near-feature scale, and background-scale changes are observable consequences and must not be prohibited by requiring identical final subject scale or crop. The matrix is practical comparison evidence, not proof of physical lens obedience; promotion requires repeatable near-feature/background-scale differences across reruns.

### 4. Visual directions

Visual directions are split by what visibly changes:

| Domain | Axes | Examples / boundary |
|---|---|---|
| Stage → Composition | `composition.hierarchy`, `placement`, `crop`, `depth` | `hero`, `social`, `centered`, `negative`, `foreground`, and `tight` must be tested as hierarchy/placement/crop/depth cues, not merged by shared marketing words. `composition.depth` means foreground–midground–background staging, not depth of field. |
| Stage → Lighting | `light.key`, `contrast`, `time`, `fill`, `accent` | `highkey`, `softbox`, `window`, `hardflash`, `onflash`, `rim`, and `neon` separate source, contrast, time, fill, and accent. Hard flash and on-camera flash remain distinct pending practical evidence. `camera.depth` means depth-of-field/readability and stays separate from `composition.depth`. |
| Finish → Look | `look.base`, `palette`, `texture`, `retouched`, `treatment` | Accepted seed `commercial` and `cleanblue` stay separate. `campaign`, `editorial`, `studio`, `fashion`, `luxury`, and `cinematic` remain reference-only until their visible cues are isolated. |
| Finish → Mood | `mood.tone` | Mood may be a facet or many-valued direction when it changes the read; “premium” alone is not a record. |
| Preset | capture approach + explicit atoms | `preset:commercial` is a deconstructible Directed studio candidate; `preset:cleanblue` stays separate only if its use-facing palette changes the recipe. |

Same words remain namespaced: composition `editorial`, look `editorial`, and preset `editorial` are not aliases. `social` is a mobile-read/use direction; `tight` is a crop direction. `hero` is hierarchy; `widekey` is environmental context.

## Proposed request cap

The six briefs are intentionally narrow and use distinct practical scenes or controlled comparisons. None uses the repeated Optics/Stage/Finish family rasters as evidence.

| Request | What it teaches | Runtime status |
|---|---|---|
| `asset-request.curator-2026-09-15.camera-2x2` | Focal cue × physical distance, using one fixed courtyard scene | Revise before acceptance; Batch 002 proposed records, reference-only |
| `asset-request.curator-2026-09-15.angle-three-quarter` | Front/side relationship at fixed eye height | Fit as proposed; uses accepted `atom.angle.azimuth.three-quarter` |
| `asset-request.curator-2026-09-15.composition-hero` | One dominant subject and subordinate environment | Minor tightening: remove campaign language; uses accepted `atom.composition.hierarchy.hero` |
| `asset-request.curator-2026-09-15.light-high-soft` | Bright exposure, open shadows, and soft key behavior | Fit with qualification: accepted compound seed, not pure `light.key` decomposition |
| `asset-request.curator-2026-09-15.palette-clean-blue` | White-blue palette separated from light direction | Revise before acceptance: lock neutral white balance; uses accepted `atom.look.palette.clean-blue` |
| `asset-request.curator-2026-09-15.preset-commercial` | The six-part commercial seed as a deconstructible recipe | Fit as proposed; uses accepted `preset.directed-studio.commercial` |

The four pairwise Batch 002 diagnostics and the earlier Batch 001 focal brief remain supporting source material; they are not added to this capped consumption list. If the lead accepts a different subset, the lead must record the exact request IDs rather than treating this table as generation permission.

## Open decisions for lead

1. Accept or revise the proposed `camera.distortion`, `edits.reframe`, `edits.environment-cleanup`, and `edits.motion-treatment` extensions before any runtime contract work; separately decide whether `macro100` becomes a deconstructible bundle or a workflow/preset.
2. Review the fixed-scene camera matrix before deciding whether `camera.distance.close` and the two close-wide bundles are distinct enough to promote.
3. Resolve the pending nearest-neighbor pairs: `social`/`tight`, `hero`/`widekey`, `hardflash`/`onflash`, `commercial`/`campaign`, and `preset:commercial`/`preset:cleanblue`.
4. Audit private drafts and favorites before any migration; the curator has not inspected that state.
5. Keep the exact Flare route gate and Curator-before-Illustration order visible in the acceptance record.

## Sol review — 2026-09-15

Sol reviewed the dated handoff and six request lines through ChatGPT Web / Chat on Steroids Core. The taxonomy is directionally sound, but the packet needs the revisions recorded here before lead acceptance or Illustration work:

- Camera 2×2: remove the incompatible fixed-distance/fixed-subject-scale/crop combination; permit distance-driven framing and scale consequences, define comparison tolerances, and treat reruns as practical evidence rather than physical-lens proof.
- Batch 002: the prose is proposed, but `records.json` currently marks its four records `active`; the lead must enforce a machine-readable non-importable proposed state before promotion. No existing batch file was edited here.
- Preservation and markup: `perspective:` is geometry; `camera lock:` is a preservation constraint; generic markup is an authoring/constraint layer; the underlying removal, recolour, or replacement keeps its actual operation family.
- Macro and motion: keep `macro100` reference-only pending a bundle-versus-workflow decision; split motion into Edit `edits.motion-treatment` and Create `look.treatment.motion` routes.
- Accepted compound directions: `high-soft` remains a valid 14-record seed but does not prove a pure `light.key` decomposition. `clean-blue` must hold neutral white balance and express blue through materials, surfaces, wardrobe, or architecture.
- Naming guard: `camera.depth` means depth-of-field/readability; `composition.depth` means foreground–midground–background staging.

The request verdicts are: camera 2×2 revise; angle three-quarter fit; composition hero fit with campaign-language tightening; high-soft fit with compound-direction qualification; clean-blue revise; preset commercial fit. All six still remain proposed/reference-only and unauthorized for generation.

## Verification and consultation

- Read `AGENTS.md`, `MAP.md`, the visual-reset authority, worker missions, Astra brief, asset usage map, current curator handoff, Batch 001, Batch 002, `teleprompter/SKILL.md`, `teleprompter/README.md`, `src/content/shorthand.ts`, `src/content/techniques.ts`, and `src/content/catalog.ts`.
- Counted the accepted seed at 14 records and preserved its boundary. No application source, manifest, renderer asset, plan file, or existing curation batch was edited.
- The six new request lines are structurally paired with the source records and include fixed scenes, controlled variables, required cues, avoid cues, source IDs, requested model, and explicit non-authorization.
- Fresh Sol review completed on 2026-09-15. The review confirmed six request lines, the 14-record runtime boundary, the `gpt-image-2.5-flare` request on every line, and `generationAuthorization: not-granted`. Core initially reported a project-root mount restriction, then reviewed the available handoff, request, repository-status, and batch evidence; no runtime or asset action was requested or taken.
