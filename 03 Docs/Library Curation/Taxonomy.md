# Proposed Library Taxonomy

Status: proposed with Batch `2026-09-13-001` · 2026-09-13

This taxonomy is for Teleprompter's current photographic prompting scope. It gives every record one canonical home while keeping useful search terms visible as facets. It is not a universal ontology of photography.

## Classification rules

- Units answer “which independent visual or constraint direction can I select?” Their path is template field → semantic axis → atom or bundle.
- Presets answer “which multi-axis visual recipe can I apply?” Their path is capture/construction family → visual approach → preset.
- Edits answer “what operation should happen, and what must remain unchanged?” Their path is affected operation/domain → edit recipe.
- A record has exactly one `primaryTaxonId`. Secondary uses are facets or aliases, never a second parent.
- A node's `inclusion`, `exclusion`, and `siblingTieBreaker` are recorded in the node definitions below. If a candidate cannot pass one rule, it remains pending rather than entering `Other`.
- `Other` is a research queue only. It is not a shipped taxonomy node.

## Units tree

| Taxon | Parent | Definition | Include | Exclude / sibling tie-breaker |
|---|---|---|---|---|
| `units.optics` | — | Decisions that change viewpoint, perspective, focus, or camera feel. | Camera, angle, and depth/focus choices. | Composition hierarchy and light belong under Stage. |
| `units.optics.camera` | `units.optics` | Camera cues and subject-distance choices. | Focal cue, distance, depth, and focus axes. | Do not make a whole preset or mood word a camera atom. |
| `units.optics.angle` | `units.optics` | Camera elevation, azimuth, and horizon roll. | Eye, low, high, top-down, profile, three-quarter, and tilt directions. | Foreground layering belongs to composition even when an angle helps produce it. |
| `units.stage` | — | Decisions about arrangement and illumination of the scene. | Composition and lighting. | Camera and finish choices have their own roots. |
| `units.stage.composition` | `units.stage` | How subjects, objects, and space are arranged in the frame. | Hierarchy, placement, crop, and depth staging. | A lighting direction is not composition; a campaign finish is not a composition atom. |
| `units.stage.lighting` | `units.stage` | Direction, softness, contrast, time, and practical sources of illumination. | Key, contrast, time, fill, and accent choices. | Palette and retouch finish belong under Finish. |
| `units.finish` | — | Surface treatment, palette, and emotional temperature. | Look and mood fields. | Physical illumination remains under Stage. |
| `units.finish.look` | `units.finish` | Genre or treatment visible in the final image. | Commercial, editorial, studio, texture, palette, and retouch directions. | Do not use look labels as a substitute for specific camera or light choices. |
| `units.finish.mood` | `units.finish` | Emotional temperature or atmosphere. | Tone choices such as calm, energetic, or restrained when they change the read. | “Premium” alone is not an atom without visible cues. |
| `units.constraints` | — | User-authored keep and avoid directions. | IMPORTANT and AVOID records. | A named edit recipe belongs in Edits. |
| `units.output` | — | Delivery and format requests. | Aspect ratio and resolution cues. | These do not prove a visual style or exact backend dimensions. |

### Unit facets

Every unit may carry `medium`, `subject`, `genre`, `era`, `palette`, `mood`, `audience/use`, and `source terms`. Facets improve search but never change canonical placement.

## Presets tree

The four major families are fixed for the current scope.

| Taxon | Parent | Definition | Include | Exclude / sibling tie-breaker |
|---|---|---|---|---|
| `presets.constructed-composite` | — | The scene visibly depends on compositing, surreal construction, or impossible spatial relationships. | Impossible joins and constructed spatial relationships. | Ordinary retouching alone; when construction defines the image, this family wins. |
| `presets.observational` | — | Documentary, candid, or unposed observation defines the approach. | Unstaged observation and documentary immediacy. | Posed work that only looks casual belongs in a directed family. |
| `presets.directed-location` | — | Deliberate direction in a recognizable real environment is central. | Environmental portraits, lifestyle, street, and location campaigns. | Controlled seamless or built-set scenes belong in Directed studio. |
| `presets.directed-studio` | — | Controlled studio or built-set capture defines the image. | Seamless, softbox, gradient, product, beauty, and constructed studio sets. | It is not a default for unknown provenance; apply the other rules first. |
| `presets.directed-studio.commercial` | `presets.directed-studio` | Polished commercial recipe using a controlled, readable hero setup. | The proposed `preset.directed-studio.commercial`. | A location-led version belongs under Directed location; a white-blue variant remains a separate candidate only if its palette changes the use. |

Preset facets: subject, campaign/editorial/social use, mood, palette, period, retouch, and setting. Minor families must use visible photographic approach consistently; “fashion” and “premium” are facets unless they change the capture approach.

## Edits tree

| Taxon | Definition | Include | Exclude / sibling tie-breaker |
|---|---|---|---|
| `edits.local-correction` | Change one named detail while preserving the surrounding image. | `fix:` and surgical correction. | Removing a whole object belongs to object removal. |
| `edits.object-removal` | Remove a named object, person, or text and rebuild the affected background. | `remove:` and clean-up operations with one target. | Broad environmental simplification needs its own batch. |
| `edits.reference-style-transfer` | Transfer only named visual treatment from a reference. | `tone:` and style-only recipes with explicit role limits. | Face, pose, product, and scene swaps are separate operation families. |
| `edits.quality-restoration` | Restore fidelity without redesign, restyle, or recompose. | `hq` and anti-degradation. | New visual direction or reframe. |
| `edits.reference-composite` | Combine role-limited references into a base scene. | Multi-reference composition, face, pose, and product transfer. | A style-only reference has no identity or object transfer. |
| `edits.geometry` | Correct perspective or marked geometry. | Vanishing-point correction, camera lock, and markup-led placement. | A crop change belongs to reframe. |

Edit facets: reference requirement, masking/markup, preservation sensitivity, subject, output purpose, and affected domains.

## Sibling tie-breakers

- Same word in different fields stays namespaced: `composition.editorial`, `look.editorial`, and an editorial preset are distinct records.
- Same focal cue at different subject distance stays distinct only when the distance changes the visible scale relationship. The `wide24`/`closewide24` and `wide35`/`closewide35` pairs are pending practical proof.
- `hero` means subject hierarchy; `widekey` means environmental context. Retain both until a comparison shows otherwise.
- `social` means fast mobile read with copy-safe space; `tight` means an immediate cropped read. They are not aliases by default.
- `hardflash` describes a broad hard-flash lighting character; `onflash` describes the recognizable on-camera placement and falloff. Keep separate pending examples.
- `commercial` is a finish; `campaign` is a more art-directed brand-use finish. Neither alone determines studio or location placement.
- A preset is one recipe, not a hidden paragraph. If a distinction cannot be represented by atoms, propose a new axis or leave the preset pending.

## Current gaps

The legacy library has no dedicated mood atom, no complete field/axis mapping for the 104 rows, and no accepted V2 adapter. Render words need an output policy. The remaining gaps and affected IDs are enumerated in `batches/2026-09-13-001/coverage.csv` and the nearest-neighbor decisions in `duplicates.csv`.
