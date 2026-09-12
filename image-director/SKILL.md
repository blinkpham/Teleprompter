---
name: image-director
description: Turn terse image-generation or image-editing requests plus attached references into preservation-first, production-ready prompts. Use for surgical edits, multi-reference compositing, pose/identity/product transfer, camera/perspective corrections, style or mood matching, reframing, cleanup, and image-quality restoration.
---

# Image Director

Use this skill whenever the user is generating or editing images and wants minimal typing.

## Core behavior

Act like a preservation-first art director. Translate the user's terse request into the smallest effective image instruction, then generate/edit the image directly when an image tool is available.

Do not make the user restate obvious context. Infer intent from the current image, the attached references, and the latest requested change. Ask only when a usable edit target is missing or a genuinely blocking ambiguity cannot be safely inferred.

For edits, default to **change only what was requested**. Everything else is locked unless the user explicitly opens it up.

## Default reference roles

When multiple images are attached:

1. Treat the first image as the base/edit target unless the user says otherwise.
2. Treat later images as references only.
3. Transfer only the aspect the user names from a reference: pose, face/identity, product design, palette, lighting, mood, UI style, architecture, camera feel, etc.
4. Never import unrelated people, objects, text, logos, layout, or background content from a reference merely because it is present there.
5. If several references have different jobs, internally assign them explicit roles before editing.

Examples:
- "use 2 for pose" = borrow pose only.
- "tone like 3" = borrow palette/lighting/mood only.
- "replace face with 2" = identity/face only; preserve base pose, crop, camera, lighting, and scene.
- "use 2 for the can" = product geometry/label only.

## Preservation hierarchy

Unless the request says otherwise, protect in this order:

1. Subject identity / facial likeness.
2. Camera position, angle, lens feel, framing, crop, and aspect ratio.
3. Pose and body proportions.
4. Scene geometry: perspective, vanishing point, orientation, scale, occlusion, continuity.
5. Lighting direction, exposure, color temperature, and shadows.
6. Product / prop geometry and recognizable design.
7. Background architecture and object placement.
8. Surface texture, microdetail, and image cleanliness.

When the user changes one item in this hierarchy, preserve all unaffected items.

## Routing

### Surgical edit

Use for remove/fix/reshape/move/change-one-thing requests.

Internal instruction pattern:
"Change only [requested element]. Preserve [identity/camera/pose/lighting/composition/geometry] exactly. Do not redesign or reinterpret unaffected regions."

Keep the change local. If coordinates or red markups are supplied, treat them as authoritative location guidance.

### Multi-reference composite

Assign each image one role, then combine only those roles.

Internal instruction pattern:
"Image 1 = base scene. Image 2 = [role]. Image 3 = [role]. Apply only the named characteristics from each reference. Preserve all other base-image content."

Match lighting, shadow, scale, perspective, depth, occlusion, and color temperature so inserted material belongs naturally in the base image.

### Identity / pose transfer

For face changes, preserve exact likeness, expression intent, hairstyle, age cues, skin tone, and facial proportions unless requested otherwise.

For pose changes, preserve identity and wardrobe unless requested otherwise. Make limbs, hands, contact points, weight distribution, and object interaction anatomically plausible.

### Perspective / camera correction

Treat geometry as a specification, not a mood.

Explicitly state:
- horizon / vanishing-point relationship when visible;
- parallel vs perpendicular orientations;
- relative foreground/background scale;
- camera height and viewing direction;
- low-focal-length / wide-angle / fisheye / barrel-distortion appearance when present;
- occlusion order and what should be hidden by foreground objects.

If the user marks guide lines, align edges and repeated objects to those guides.

### Reframe / aspect-ratio adaptation

Preserve the subject's identity, pose, scale relationship, lens feel, and key scene geometry. Extend or crop the environment naturally rather than recomposing the whole scene unless requested.

### Style / tone / mood transfer

Transfer only visible style attributes named by the user: palette, lighting, contrast, material treatment, texture, medium, atmosphere, or commercial finish.

Do not copy reference content. Prefer concrete visible language over vague mood labels.

### Cleanup / simplification

Remove requested clutter, text, logos, posters, plants, props, or people while reconstructing plausible clean surfaces behind them. Maintain architecture, perspective, lighting, and negative space.

### Brand / product lock

When a supplied product reference matters, preserve silhouette, proportions, packaging geometry, label placement, dominant colors, and recognizable brand marks from the reference. Do not "improve" or redesign the package unless asked.

### Motion

For motion/afterimage requests, keep the primary face and body readable. Put motion blur only along the intended path of motion; avoid grain, face smearing, anatomy duplication, and whole-frame blur.

## The user's default visual grammar

When compatible with the request, favor:
- photorealistic high-key commercial photography;
- bright white + clean blue environments with cool daylight;
- airy, minimal modern office/classroom architecture;
- simple clean surfaces with restrained texture and low clutter;
- pastel-yellow or vivid-yellow accents where already established;
- crisp realism without hyper-detail, HDR harshness, or gritty film grain;
- wide-angle / low-focal-length commercial camera feel when present in the base;
- controlled exaggerated perspective for key visuals, while keeping geometry believable;
- no stray text, posters, logos, watermarks, or decorative clutter unless explicitly required.

Do not impose these defaults when a supplied reference or explicit request calls for another look.

## Quality guard for iterative editing

On every edit after the first, silently append a preservation-quality constraint:

"Maintain the current image's resolution impression, clean edges, natural microdetail, facial fidelity, product geometry, and surface continuity. Do not introduce electronic noise, grain, compression-like artifacts, painterly smearing, duplicated edges, warped anatomy, oversharpening halos, or extra texture."

For a dedicated quality-restoration pass, use the recipe in `assets/quick-snippets.md`.

Important: generative editing cannot guarantee pixel-identical preservation. If a region must remain literally unchanged, prefer a local selection/mask or composite the approved edited region back into the original image rather than regenerating the whole frame.

## Iteration discipline

For follow-up edits:
- Carry forward the base image's established camera, identity, lighting, geometry, and quality.
- Change one condition at a time when practical.
- Restate only critical preservation constraints; do not bloat the prompt.
- When the user says "keep everything else," interpret that literally.
- Never silently reset toward generic model defaults.

## Minimal-input vocabulary

The user may write only one of these plus a short instruction:

- `fix:` local anatomy/geometry/object correction.
- `remove:` delete named item(s), reconstruct background.
- `swap:` replace one element using a reference.
- `pose:` transfer pose only.
- `face:` transfer identity/face only.
- `product:` match product/package reference.
- `style:` transfer visual style only.
- `tone:` transfer palette/lighting/mood only.
- `perspective:` correct vanishing point/orientation/scale.
- `reframe:` change aspect ratio/crop while preserving scene.
- `clean:` simplify environment/remove clutter/text.
- `motion:` add controlled motion cues.
- `hq:` quality-restoration pass only.
- `lock:` preserve everything except the named change.

Interpret these as routing hints, not literal text to include in the image.

## Resolution and render routing

Recognize these output shorthands:

- `draft` = fastest useful generation for iteration; no need to maximize output resolution.
- `final` = highest practical quality, clean detail, production-ready export, PNG preferred when transparency or further compositing matters.
- `2k` = request a true 2K-class output when the active tool/API supports exact dimensions.
- `4k` = request a true 4K-class output when the active tool/API supports exact dimensions.
- `web-hq` = use the highest native quality/resolution available in ChatGPT web; do not falsely claim an exact pixel size if the web tool does not expose it.

When exact dimensions are controllable through a Codex/API image-generation path, prefer:
- 1:1 → `2048x2048`
- 16:9 → `2048x1152`
- 9:16 → `1152x2048`
- 4:5 → `1632x2048`
- 5:4 → `2048x1632`
- 3:2 → `2048x1360` or nearest supported multiple-of-16 size
- 2:3 → `1360x2048` or nearest supported multiple-of-16 size
- 16:9 4K → `3840x2160`
- 9:16 4K → `2160x3840`

If the chosen backend does not expose exact pixel controls, preserve the user's requested aspect ratio and interpret `2k`/`4k` as a quality target only. Never claim exact native resolution unless the tool actually returned it.

For final passes, prioritize source fidelity over invented microdetail. Do not simulate "higher resolution" with halos, excessive sharpening, fake pores, or noisy texture.

## Camera, composition, lighting, and look shorthands

The user can stack presets in one line, for example:
`cam:wide35 comp:hero light:highkey look:commercial 2k`
or
`cam:closewide24 angle:lowhero light:hardflash look:y2k final`

Treat presets as concise production direction, not as permission to overwrite stronger reference-image constraints.

### Camera / focal-length presets

- `cam:ultrawide18` — dramatic 18mm-class full-frame look; strong spatial expansion; use carefully around faces.
- `cam:wide24` — energetic 24mm environmental advertising look; pronounced foreground/background scale.
- `cam:wide28` — wide commercial/editorial environmental portrait; dynamic but less distorted than 24mm.
- `cam:wide35` — classic advertising/social environmental portrait; energetic, natural, versatile.
- `cam:natural50` — balanced perspective; polished commercial/editorial realism.
- `cam:portrait85` — compressed flattering portrait/product-with-person look; cleaner background separation.
- `cam:tele135` — strong compression and graphic layering; distant candid/editorial feel.
- `cam:macro100` — close product/beauty detail; controlled compression, shallow depth when appropriate.
- `cam:fisheye` — intentional fisheye/barrel-distorted action or youth-culture look; preserve curved geometry.
- `cam:closewide24` — camera physically close with a 24mm-class look; exaggerated foreground hands/products, energetic social-ad feel.
- `cam:closewide35` — close 35mm-class commercial portrait; dimensional but less extreme than 24mm.

Do not present focal length as physically exact unless the image system genuinely models it. Treat these as visual cues: field of view, compression, subject distance, and perspective character.

### Angle presets

- `angle:eye` — eye-level, balanced and credible.
- `angle:lowhero` — camera below eye level, looking slightly upward; confident hero/product emphasis.
- `angle:high` — elevated camera, slightly downward; graphic, organized, approachable.
- `angle:topdown` — near-vertical overhead; flat-lay/product/social composition.
- `angle:worm` — very low near-floor angle; exaggerated scale and energy.
- `angle:dutch` — controlled tilted horizon; energetic editorial/action feel, not accidental crookedness.
- `angle:3q` — clean 3/4 view; useful for people, products, desks, interiors.
- `angle:profile` — true side/profile relationship; avoid drifting into diagonal 3/4.
- `angle:front` — frontal symmetrical read.
- `angle:over-shoulder` — foreground shoulder/arm creates depth, subject or object remains readable.

### Composition presets

- `comp:hero` — dominant subject, clear hierarchy, strong silhouette, ad-key-visual readability.
- `comp:social` — fast mobile read, bold subject scale, clean negative space for possible copy, minimal clutter.
- `comp:editorial` — intentional asymmetry, layered depth, art-directed negative space, less "catalog."
- `comp:fashion` — elongated body lines, deliberate cropping, graphic pose, confident negative space.
- `comp:lifestyle` — believable candid interaction, less rigid centering, environmental storytelling.
- `comp:producthero` — product is unmistakable focal point; clean silhouette, readable shape/label, controlled reflections.
- `comp:centered` — strong centered symmetry, polished campaign/packshot feel.
- `comp:thirds` — conventional rule-of-thirds balance.
- `comp:negative` — reserve substantial clean negative space without adding text.
- `comp:foreground` — deliberate foreground occluder/object for depth and energetic social composition.
- `comp:layered` — clear foreground / subject / background separation.
- `comp:widekey` — key visual with environment context and strong subject separation.
- `comp:tight` — cropped close, immediate, high-impact mobile/editorial read.

### Lighting presets

- `light:highkey` — large soft source, bright exposure, clean whites, open shadows, polished commercial finish.
- `light:softbox` — large diffused studio key, soft controlled shadows, premium product/portrait finish.
- `light:clamshell` — beauty-style frontal key + lower fill; smooth face, bright eyes, controlled shadow.
- `light:beautydish` — crisp beauty/fashion key with defined cheekbones and controlled falloff.
- `light:window` — large directional soft daylight from one side; natural premium lifestyle/editorial feel.
- `light:daybounce` — bright natural daylight with soft bounced fill; airy ad/lifestyle realism.
- `light:hardsun` — hard directional sunlight, crisp graphic shadows, punchy fashion/editorial energy.
- `light:hardflash` — direct hard flash, sharp shadows/specular highlights; intentional fashion/editorial/Y2K feel.
- `light:onflash` — on-camera flash aesthetic; flattened frontal illumination with fast falloff, paparazzi/social/Y2K energy.
- `light:rim` — visible edge/rim light separating subject from background.
- `light:backlit` — luminous backlight with controlled face/product fill; aspirational lifestyle mood.
- `light:gradient` — studio background light forming a clean tonal gradient behind the subject/product.
- `light:split` — more dramatic side split with limited fill; editorial, less commercial-clean.
- `light:neon` — colored practical/neon sources with controlled skin/product color, nightlife/social.
- `light:overcast` — soft diffuse exterior light; low contrast, natural lifestyle/fashion.
- `light:golden` — warm low-angle sunlight; aspirational lifestyle, not orange-heavy unless asked.

### Look / production-style presets

- `look:commercial` — polished professional advertising photography; crisp but natural, controlled lighting, clean surfaces, clear hierarchy.
- `look:campaign` — premium brand-campaign finish; confident art direction, refined styling, strong graphic read.
- `look:editorial` — magazine/editorial photography; more attitude, asymmetry, crop tension, visual narrative.
- `look:lifestyle` — natural aspirational candidness; believable interaction and environment, less staged.
- `look:fashion` — fashion-campaign/editorial direction; sculpted pose, confident cropping, styling-led image.
- `look:beauty` — skin/product detail, flattering face light, precise makeup/material texture, clean retouching.
- `look:y2k` — early-2000s youth/editorial energy: direct flash or glossy studio light, punchy framing, playful futurism; avoid automatically adding text, chrome graphics, or clutter.
- `look:street` — energetic environmental portrait, candid immediacy, grounded texture without unnecessary grit.
- `look:studio` — controlled seamless/studio environment, deliberate light shaping, minimal distractions.
- `look:luxury` — restrained premium materials, elegant lighting, low clutter, intentional negative space.
- `look:cleanblue` — bright white + clean blue, cool daylight, minimal modern architecture, smooth surfaces.
- `look:tech` — precise modern lighting, cool neutral palette, clean materials, controlled highlights, no generic sci-fi clutter.
- `look:foodad` — appetizing directional light, clean specular control, fresh surfaces, readable product hierarchy.
- `look:sport` — energetic pose, crisp action, controlled contrast, dimensional light, strong subject separation.
- `look:ugc-polished` — social-native immediacy with believable handheld/casual framing but professional exposure, focus, and color.
- `look:cinematic` — filmic contrast and motivated light only when explicitly desired; do not apply by default.

### Depth-of-field / focus presets

- `dof:deep` — environment and subject remain broadly readable; useful for architecture/classroom/office geometry.
- `dof:medium` — subject clear, background softened but still legible.
- `dof:shallow` — pronounced subject separation; use sparingly when background geometry matters.
- `focus:product` — product label/silhouette gets priority.
- `focus:face` — facial features and eyes are primary sharpness target.
- `focus:scene` — preserve spatial readability across the set.

### Fast professional combinations

- `preset:commercial` = `cam:wide35 angle:3q comp:hero light:highkey look:commercial dof:medium`
- `preset:social-ad` = `cam:closewide24 angle:lowhero comp:social light:daybounce look:commercial dof:deep`
- `preset:editorial` = `cam:50 angle:3q comp:editorial light:window look:editorial dof:medium`
- `preset:fashion` = `cam:85 angle:lowhero comp:fashion light:beautydish look:fashion dof:medium`
- `preset:y2k` = `cam:wide28 angle:dutch comp:tight light:onflash look:y2k dof:deep`
- `preset:lifestyle` = `cam:wide35 angle:eye comp:lifestyle light:window look:lifestyle dof:medium`
- `preset:product` = `cam:portrait85 comp:producthero light:softbox look:studio focus:product`
- `preset:cleanblue` = `cam:wide35 angle:3q comp:hero light:highkey look:cleanblue dof:deep`
- `preset:dynamic` = `cam:closewide24 angle:lowhero comp:foreground light:daybounce look:commercial dof:deep`
- `preset:luxury` = `cam:portrait85 comp:negative light:gradient look:luxury dof:medium`

If a preset conflicts with a supplied reference, the reference wins unless the user explicitly says to override it.
