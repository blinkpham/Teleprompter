# Quick Image Prompt Snippets

These are intentionally short. In a skill-enabled chat, the first-line shorthand is usually enough.

## 1. Surgical edit

`fix: [exact thing]. Lock everything else.`

Expanded:
> Change only [thing]. Preserve the subject identity, pose, camera, framing, lens feel, perspective, lighting, colors, scene layout, and all unaffected objects. Keep the edit local and reconstruct surrounding pixels naturally. Do not redesign or reinterpret anything else.

## 2. Remove one thing

`remove: [object/person/text]. Lock everything else.`

Expanded:
> Remove only [target] and plausibly reconstruct what should be behind it. Preserve all people, pose, camera angle, crop, lens distortion, lighting, perspective, architecture, and object positions. Do not add anything new.

## 3. Multi-reference composite

`1=base; 2=[role]; 3=[role]. [change].`

Example:
`1=base; 2=pose; 3=face. Put 1's subject in 2's pose with 3's face. Lock camera + scene.`

Expanded:
> Image 1 is the base scene. Image 2 is reference only for [role]. Image 3 is reference only for [role]. Transfer only those named traits; do not import unrelated content from the references. Preserve Image 1's camera, framing, lens feel, lighting, environment, perspective, scale, occlusion, and all other scene content.

## 4. Style / tone only

`tone: match image 2 only; keep image 1 content + geometry.`

Expanded:
> Use Image 2 only for palette, lighting, contrast, material treatment, and overall visual mood. Keep Image 1's subject, pose, composition, camera, scene geometry, objects, and content unchanged. Do not copy text or objects from Image 2.

## 5. Face / identity lock

`face: use 2. Keep 1's pose/camera/light.`

Expanded:
> Replace only the face/identity using Image 2. Preserve Image 1's exact pose, head orientation, body proportions, wardrobe, crop, camera, lens feel, lighting direction, shadows, and background. Match the new face naturally to the existing perspective and light; keep the likeness faithful.

## 6. Pose transfer

`pose: use 2. Keep 1's face + scene.`

Expanded:
> Change only the subject's pose to match Image 2. Preserve Image 1's identity, facial features, hairstyle, clothing, scene, camera, crop, lens distortion, lighting, and color. Resolve joints, hands, contact points, and weight distribution naturally.

## 7. Perspective / vanishing point

`perspective: [what should align]. Use marked guides. Lock subject.`

Expanded:
> Correct only the scene geometry. Align [edges/desks/people/objects] to the same vanishing-point system and make repeated objects parallel in world space. Preserve camera position, lens feel, main subject, pose, lighting, crop, and styling. Keep foreground/background scale and occlusion physically coherent.

## 8. Camera lock

`camera lock: same angle, crop, focal feel + barrel distortion. [change].`

Expanded:
> Preserve the existing camera position, height, viewing direction, framing, crop, wide-angle/low-focal-length appearance, barrel/fisheye distortion, and perspective. Apply only [change]. Do not normalize the lens or recenter the composition.

## 9. Reframe

`reframe: 4:5. Keep subject scale + camera feel.`

Expanded:
> Adapt to [aspect ratio] while preserving the subject's identity, pose, relative scale, camera angle, lens feel, and key scene geometry. Extend/crop the environment naturally. Do not redesign the scene.

## 10. Clean environment

`clean: remove [clutter/text/people]. Keep architecture.`

Expanded:
> Simplify the environment by removing [items]. Preserve architecture, perspective, lighting, clean negative space, and the main subject. Reconstruct simple plausible surfaces. Do not add replacement decor, text, logos, or busy texture.

## 11. Brand / product fidelity

`product: match image 2 exactly; integrate into image 1.`

Expanded:
> Use Image 2 only as the product reference. Preserve its recognizable silhouette, proportions, package geometry, label placement, brand marks, and dominant colors. Integrate it into Image 1 with correct perspective, scale, grip/contact, lighting, reflections, and shadows. Preserve everything else in Image 1.

## 12. Controlled motion

`motion: light afterimages along [path]; face stays clean.`

Expanded:
> Add subtle, swift afterimages and directional motion blur only along [motion path]. Keep the primary face, eyes, hands, and body readable and anatomically coherent. No grain, whole-frame blur, duplicated anatomy, face smearing, or noisy trails.

## 13. HIGH-QUALITY RESTORATION / ANTI-DEGRADATION

Shortest:
`hq: restoration only. No redesign.`

Full snippet:
> **Quality-restoration pass only. Do not redesign, restyle, recompose, or change content.** Preserve the current image's exact subject identity, facial likeness, pose, camera angle, framing, lens distortion, perspective, object geometry, architecture, lighting direction, exposure, color balance, and scene layout. Remove electronic noise, coarse grain, compression-like artifacts, AI smearing, muddy textures, doubled edges, malformed microdetails, and accumulated generative degradation. Restore clean natural edges, coherent fine detail, smooth clean surfaces, accurate anatomy, and realistic material definition. Keep detail restrained and photographic: no oversharpening halos, HDR look, plastic skin, invented texture, extra objects, extra text, or altered branding. The result should look like a cleaner, higher-fidelity version of the same image, not a new interpretation.

Best practice for exact preservation:
- Use the smallest selectable/masked area that actually needs repair.
- If an approved region must remain literally pixel-identical, keep the original pixels and composite only the repaired region back into the original. A generative whole-image pass cannot guarantee pixel identity.

## 14. Clean commercial look

`look: high-key clean commercial; white-blue daylight; minimal surfaces; no grain.`

Expanded:
> Photorealistic high-key commercial photography. Bright white and clean blue environment, cool natural daylight, airy minimal architecture, simple smooth surfaces, restrained texture, crisp believable detail, polished but not over-retouched. No film grain, electronic noise, dirty texture, heavy HDR, moody cinematic grading, or visual clutter.

## 15. Red markup / coordinate edit

`marked area only: [change]. Treat red guide as geometry.`

Expanded:
> Apply the requested change only in the marked/identified region. Treat the red line/coordinate as authoritative placement or geometry guidance. Preserve all unmarked regions, including camera, identity, lighting, composition, perspective, and surrounding objects.

# Camera / Lighting / Production Presets

Use these by stacking tokens:

`cam:wide35 angle:3q comp:hero light:highkey look:commercial 2k`

## Fast all-in-one presets

- `preset:commercial` — polished commercial advertising photo; 35mm-class environmental feel, clean 3/4 hero composition, high-key soft light.
- `preset:social-ad` — energetic close-wide mobile-ad framing; strong depth, bright bounced daylight, clean fast read.
- `preset:editorial` — magazine-style asymmetry, visual tension, directional soft light.
- `preset:fashion` — flattering compression, sculpted pose, beauty/fashion light, confident crop.
- `preset:y2k` — punchy wide framing, direct on-camera flash, playful early-2000s editorial energy.
- `preset:lifestyle` — natural environmental portrait, candid interaction, window/daylight feel.
- `preset:product` — product-first studio composition, controlled softbox lighting and reflections.
- `preset:cleanblue` — bright white/blue high-key commercial environment, cool daylight, deep scene readability.
- `preset:dynamic` — close 24mm-class perspective, low hero angle, foreground depth, energetic commercial feel.
- `preset:luxury` — restrained 85mm-class compression, elegant negative space, controlled studio gradient.

## Camera

`cam:ultrawide18`
`cam:wide24`
`cam:wide28`
`cam:wide35`
`cam:natural50`
`cam:portrait85`
`cam:tele135`
`cam:macro100`
`cam:fisheye`
`cam:closewide24`
`cam:closewide35`

## Angles

`angle:eye`
`angle:lowhero`
`angle:high`
`angle:topdown`
`angle:worm`
`angle:dutch`
`angle:3q`
`angle:profile`
`angle:front`
`angle:over-shoulder`

## Composition

`comp:hero`
`comp:social`
`comp:editorial`
`comp:fashion`
`comp:lifestyle`
`comp:producthero`
`comp:centered`
`comp:thirds`
`comp:negative`
`comp:foreground`
`comp:layered`
`comp:widekey`
`comp:tight`

## Lighting

`light:highkey`
`light:softbox`
`light:clamshell`
`light:beautydish`
`light:window`
`light:daybounce`
`light:hardsun`
`light:hardflash`
`light:onflash`
`light:rim`
`light:backlit`
`light:gradient`
`light:split`
`light:neon`
`light:overcast`
`light:golden`

## Looks

`look:commercial`
`look:campaign`
`look:editorial`
`look:lifestyle`
`look:fashion`
`look:beauty`
`look:y2k`
`look:street`
`look:studio`
`look:luxury`
`look:cleanblue`
`look:tech`
`look:foodad`
`look:sport`
`look:ugc-polished`
`look:cinematic`

## Depth / focus

`dof:deep`
`dof:medium`
`dof:shallow`
`focus:product`
`focus:face`
`focus:scene`

# Resolution / Render

`draft` — iteration render
`final` — highest practical quality / production-ready
`2k` — exact 2K-class output when backend supports explicit dimensions
`4k` — exact 4K-class output when backend supports explicit dimensions
`web-hq` — highest native ChatGPT-web quality without claiming an unsupported exact pixel size

Typical exact Codex/API mappings:
- 1:1 → 2048×2048
- 16:9 → 2048×1152
- 9:16 → 1152×2048
- 4:5 → 1632×2048
- 5:4 → 2048×1632
- 16:9 4K → 3840×2160
- 9:16 4K → 2160×3840

# Example one-liners

`fix: hand anatomy. lock face + camera. preset:commercial 2k`

`1=base; 2=pose; 3=face. preset:cleanblue final`

`reframe:4:5 cam:closewide24 angle:lowhero light:daybounce look:commercial`

`product: can from 2. comp:producthero light:softbox focus:product 2k`

`tone: use 2 only. keep 1 content. look:y2k light:onflash`

`perspective: desks parallel to subject desk. cam:wide35 dof:deep lock subject`

`hq final`
