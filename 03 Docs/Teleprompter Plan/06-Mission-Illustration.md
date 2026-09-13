# Mission — generated illustration and examples

## Dispatch prompt

> Produce the raster artwork for Teleprompter after this mission is dispatched. Read this mission and the four supplied references under `03 Docs/Teleprompter Plan/References/`; use the image-generation skill for generation and editing. You own `src/renderer/src/assets/teleprompter/` and `03 Docs/Teleprompter Execution/Artwork/`. You are not alone in the codebase: preserve UI, engine, and other workers' changes. The lead approves asset IDs/requests and integrates them; you do not edit application code or curate new prompt semantics. Generate original industrial UI objects and accurate practical photo examples as separate series. Follow the manifest, model-verification, comparison, and acceptance rules below. Deliver selected images, provenance, a contact sheet, and a short handoff. This document is a future worker brief; no images were generated in the planning turn.

## Two visual series

**Industrial UI objects** use reference 04's materials: C4D/Blender-style product rendering, anodized brushed aluminum with fine circular machining, frosted translucent polycarbonate, orange-to-white internal light, controlled cinematic studio highlights, and realistic contact shadows. Borrow the material language, not the recognizable franchise objects. Teleprompter's original identity is a compact optical prompt device: an inclined frosted display held inside a circular machined lens housing, with a small warm light below the glass. Its silhouette must read without letters.

**Practical examples** show what an actual setting or preset requests: camera distance/perspective, viewpoint, composition, light, palette, finish, or an image edit. Generate photographic content using GPT Image 2.5. Do not apply the silver/orange UI style to these examples unless the catalog entry specifically calls for it. A photograph of a lens is not evidence of that lens's visual effect; the object and its effect are separate assets.

Button icons come from the UI worker's Phosphor vector library. Do not render copy/close/settings/navigation icons, typography, fake UI, or hand-drawn SVG substitutes. The app icon is a raster identity asset and is distinct from in-app control icons.

## Model and tool requirement

The user has overridden the earlier model choice: use `gpt-image-2.5-flare` for practical examples, prioritizing faster mass generation. Recheck exact availability and record the resolved model at execution time. Do not silently substitute another backend. [GPT Image 2.5 Flare](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare)

The imagegen tool exposed during planning has no model-selection argument. Therefore a call to that tool alone does not prove GPT Image 2.5. Read the installed skill and current tool metadata. Use an available path that explicitly selects or reports the required model for practical work. Record requested and resolved model separately. A model name written inside the image prompt is not backend selection.

If the built-in route cannot prove the model, use a supported exact-model route only when its credentials and metered use are already authorized. Otherwise mark the practical series `blocked-model-verification`, finish permitted industrial work, and give the lead a precise access request. Do not silently downgrade or label an unknown backend as 2.5. The UI and engine can progress using stable asset IDs and text-only missing-image states. Do not ask the user to paste API keys into chat.

## Output waves

The lead derives the final request list from accepted catalog IDs. Generate separate calls per final asset or controlled edit; a contact sheet is a review artifact, never the source of final cropped assets. Work in batches of at most 12 requested outputs so rejected art does not propagate through the library.

| Wave | Required outputs | Exit criterion |
|---|---|---|
| A — style proof | App icon and three group objects: Optics, Stage, Finish; one controlled practical comparison pair | Original silhouette, shared materials, small-size legibility, and model-proven practical pair accepted by lead |
| B — initial coverage | Nine lens objects for distinct current focal/optic choices (18, 24, 28, 35, 50, 85, 135, macro100, fisheye); close-wide bundles reuse their focal object. Practical comparison pairs for camera, angle, composition, light, look, and one edit use case (12 images total, including the Wave A pair) | Each pair isolates and visibly demonstrates the requested change; no mislabeled example |
| C — presets and edit detail | One practical example for each active baseline preset (currently ten, adjusted to the accepted mapping); before/after pairs for three priority edit recipes: local correction, background simplification, and style/light transfer. Reuse earlier outputs only when semantics match exactly | Every shipped preset card has a correct example; three edit demonstrations have a valid base/result relationship |
| Ongoing | Curator-issued AssetRequest batches for new records and remaining token/recipe examples | Each accepted request updates manifest/provenance; uncaptured effects remain explicitly unillustrated |

An image may satisfy two requests only when both record mappings are accurate; record that reuse. Other tokens/recipes may remain text-only in this release. Do not fill empty slots with unrelated art or label a material hero as a setting demonstration. Do not buy credits or start an unapproved metered batch.

## Asset specifications

| Kind | Master | Runtime derivative | Composition |
|---|---|---|---|
| App icon | 1024×1024 PNG, opaque square master | PNG sizes for development; platform icon source set for later packaging | One original object, centered, dark field, safe interior margin; no baked macOS outer squircle or wordmark |
| Group object | 1024×1024 RGBA PNG | 256/512px lossless WebP or PNG with real alpha | Shared camera/light rig, object occupies about 70% of frame, soft contact shadow |
| Lens object | 1024×1024 RGBA PNG | 256/512px alpha derivative | Consistent angle, scale, glass highlights and material; visual distinction where physically meaningful |
| Practical example | Prefer 1536px or larger long edge at a supported native model size | 512px card and 1024px detail WebP/JPEG, sRGB | Usually 4:3 for comparison pairs; preserve full image where crop matters; record actual dimensions |
| Edit pair | Base plus derived edited image at matching dimensions | Paired 512/1024px derivatives | Same coordinate frame where preservation is claimed; no independent regeneration presented as an edit |

If the model does not support a requested size, generate at its supported native size and record the actual result. Do not report upscaled pixels as native generation. Verify alpha at the edges over both light and dark backgrounds; a checkerboard painted into an image is not transparency. Use the image-generation skill for visual editing. Deterministic export resizing/format conversion can use ordinary image tools if permitted by that skill; it must not invent or repaint content.

Use `contain` for whole-object previews and camera/composition comparisons. Preset card crops may use an explicit focal point but detail shows the full image. Keep masters and selected runtime derivatives; store rejected candidates in the artwork working folder, outside the runtime bundle. Target a 25MB initial runtime artwork budget with lazy loading and thumbnail derivatives; if quality cannot fit, report actual sizes and let the lead choose a revised budget.

## Prompt recipes

Industrial starting brief:

```text
Create an original [Teleprompter optical prompt device / group object / lens object].
Object: [specific silhouette and functional parts].
Material: anodized brushed aluminum with subtle micro-circular grain; frosted
translucent polycarbonate; internal orange-to-white illumination.
Lighting: restrained product-studio key, soft rim, controlled specular highlights,
realistic contact shadow. Hyper-real product rendering with C4D/Blender quality.
Composition: isolated three-quarter object, centered, consistent scale, generous
negative space, no text, no logo, no recognizable fictional character.
Background: [true transparency for objects / deep charcoal for the app icon].
Match the supplied reference's material behavior; use the approved original icon
as a material/style reference for subsequent objects.
```

Practical comparison starting brief:

```text
Create a photographic comparison for [record ID and exact expansion].
Base scene: [ordinary subject, setting, wardrobe/product, action, palette].
Keep fixed: [all decisions except the controlled variable].
Change only: [one named visual parameter, or the declared multi-atom preset].
Visible success: [specific perspective, shadow, framing, or finish cue].
Avoid: text overlays, UI, camera diagrams, gratuitous orange/chrome treatment.
Use the supplied base image for the controlled edit. Preserve everything outside
the declared change as closely as possible. Return the actual image, not a collage.
```

The engine supplies the exact atom expansions for preset prompts. Build the generation prompt from those atoms plus a fixed subject/scene; record the extra subject/scene scaffolding separately. A whole-preset example can intentionally change several axes. A single-axis comparison should vary only one axis; acknowledge unavoidable generation drift during review instead of calling it controlled evidence without inspection.

Choose neutral subjects suited to the effect: a person with clear background planes for focal perspective; a simple product for composition/light; a material-rich interior for palette; an obvious removable background object for edits. Use synthetic subjects without claiming a real person's endorsement. Avoid logos and readable text that distract from the parameter being illustrated.

## Manifest contract

Write `src/renderer/src/assets/teleprompter/manifest.json` as:

```json
{
  "schemaVersion": 1,
  "assets": [
    {
      "id": "example.angle.eye.v1",
      "kind": "practical-example",
      "recordIds": ["angle:eye"],
      "path": "examples/angle-eye-v1-512.webp",
      "detailPath": "examples/angle-eye-v1-1024.webp",
      "masterPath": "masters/angle-eye-v1.png",
      "width": 1024,
      "height": 768,
      "hasAlpha": false,
      "fit": "contain",
      "focalPoint": [0.5, 0.5],
      "alt": "Subject photographed from eye level.",
      "comparisonSetId": "angle-level-v1",
      "comparisonRole": "base",
      "provenanceId": "generation.angle.eye.v1",
      "status": "approved"
    }
  ]
}
```

Allowed `kind`: `app-icon`, `group-object`, `token-object`, `practical-example`, `edit-before`, `edit-after`. `comparisonRole` is `base`, `variant`, or omitted. Comparison fields and detailPath are optional; group/app objects can have empty recordIds. Width/height describe the detail asset when present, otherwise path. Paths are relative to the asset root, never absolute or remote; masterPath may be relocated outside runtime bundling if the lead's asset pipeline excludes masters. Runtime code imports only approved derivatives.

The example above defines shape, not an existing generated asset. Resolve actual record IDs from the accepted V2 catalog rather than assuming the illustrative ID has been shipped.

Write one JSONL provenance row per generation in `03 Docs/Teleprompter Execution/Artwork/provenance.jsonl`:

```json
{"id":"generation.angle.eye.v1","assetId":"example.angle.eye.v1","createdAt":"ISO timestamp","tool":"actual tool/path","requestedModel":"gpt-image-2.5-flare","resolvedModel":"actual returned model or unknown","modelEvidence":"response metadata or verified invocation record","promptFile":"prompts/angle-eye-v1.md","referenceAssetIds":[],"referencePaths":[],"controlledVariable":"angle.elevation","fixedVariables":["subject","scene","camera.focal","lighting"],"nativeDimensions":[1024,768],"postprocess":["resize derivative","encode webp"],"review":"pending","issues":[]}
```

Record model evidence without credentials or raw secret-bearing logs. Every approved asset has a saved prompt, actual output dimensions, accessible alt text, and a reviewed mapping to its record. For illustrative concepts rather than factual device models, describe the object as a stylized visualization rather than falsely naming a commercial lens.

## AssetRequest from the curator

```json
{"requestId":"asset-request.batch-001.01","recordIds":["accepted-record-id"],"kind":"practical-example","intent":"The visible change this image should teach","controlledVariable":"axis ID or preset","fixedScene":"brief","requiredCues":["observable cue"],"avoidCues":["misleading cue"],"pairWithAssetId":null,"priority":"p0","sourceIds":["source-id"]}
```

The lead accepts requests before generation. The illustrator can flag a request that cannot be shown faithfully with a single image and propose a before/after pair. Only the curator/lead changes the underlying record meaning.

## Acceptance and handoff

Inspect every image at runtime size and full size. Reject visibly wrong camera perspective, mislabeled light direction, phantom objects, malformed anatomy, unreadable small silhouettes, false alpha, contaminated palettes, or inconsistent comparison scenes. Verify generated file format, dimensions, and that every manifest path resolves. Use contact sheets to compare the family, then inspect selected assets individually.

Deliver `03 Docs/Teleprompter Execution/Artwork/Artwork-Handoff.md`, contact sheets, the manifest/provenance records, prompts, and selected files. Separate approved, pending, and blocked assets. State exact coverage by record ID, requested/resolved models, total derivative bytes, rejected problems, and the next batch. “Generated” alone does not mean “accurate illustration of this setting.”
