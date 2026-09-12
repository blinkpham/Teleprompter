import type { Preset, ShorthandEntry, SourceRef } from '../shared/catalog-types';

const skillFile = 'image-director/SKILL.md';
const snippetFile = 'image-director/assets/quick-snippets.md';
const routeSource = '## Minimal-input vocabulary';

type EntrySpec = Omit<ShorthandEntry, 'id' | 'kind' | 'familyId' | 'order' | 'sources'> & { id: string; familyId: Exclude<ShorthandEntry['familyId'], 'presets'>; order: number; sourceHeading?: string; sourceFile?: string };

const token = (spec: EntrySpec): ShorthandEntry => ({
  id: spec.id,
  kind: 'token',
  familyId: spec.familyId,
  token: spec.token,
  aliases: spec.aliases,
  meaning: spec.meaning,
  direction: spec.direction,
  ...(spec.example ? { example: spec.example } : {}),
  searchTerms: spec.searchTerms,
  cautionIds: spec.cautionIds,
  order: spec.order,
  sources: [{ file: spec.sourceFile ?? skillFile, heading: spec.sourceHeading ?? routeSource }],
});

const route = (spec: Omit<EntrySpec, 'familyId'>): EntrySpec => ({ ...spec, familyId: 'routes' });

export const routeEntries: readonly ShorthandEntry[] = [
  token(route({ id: 'route-fix', token: 'fix:', aliases: [], meaning: 'Correct one named detail locally.', direction: 'Change only [requested element]. Preserve identity, camera, pose, lighting, composition, and geometry exactly. Do not redesign or reinterpret unaffected regions.', searchTerms: ['surgical edit', 'local correction', 'repair'], cautionIds: ['preservation'], order: 1 })),
  token(route({ id: 'route-remove', token: 'remove:', aliases: [], meaning: 'Remove a named item and rebuild its background.', direction: 'Remove the requested object, person, or text and reconstruct a plausible clean surface behind it. Preserve everything else in the scene.', searchTerms: ['delete', 'cleanup', 'reconstruct'], cautionIds: ['preservation'], order: 2 })),
  token(route({ id: 'route-swap', token: 'swap:', aliases: [], meaning: 'Replace one element using a named reference.', direction: 'Replace only the named element using the supplied reference. Preserve the base image camera, scene, lighting, scale, and all unrelated content.', searchTerms: ['replace', 'reference transfer'], cautionIds: ['reference-roles'], order: 3 })),
  token(route({ id: 'route-pose', token: 'pose:', aliases: [], meaning: 'Transfer pose while preserving identity and wardrobe.', direction: 'Change only the subject\'s pose. Preserve identity, facial features, hairstyle, clothing, scene, camera, crop, lens distortion, lighting, and color. Resolve joints, hands, contact points, and weight distribution naturally.', searchTerms: ['pose transfer', 'body position', 'anatomy'], cautionIds: ['reference-roles'], order: 4 })),
  token(route({ id: 'route-face', token: 'face:', aliases: [], meaning: 'Transfer face or identity into the base scene.', direction: 'Replace only the face or identity from the reference. Preserve the base pose, head orientation, body proportions, wardrobe, crop, camera, lens feel, lighting, shadows, and background.', searchTerms: ['identity', 'likeness', 'facial features'], cautionIds: ['reference-roles'], order: 5 })),
  token(route({ id: 'route-product', token: 'product:', aliases: [], meaning: 'Match a product reference and integrate it into the base.', direction: 'Preserve the reference product silhouette, proportions, packaging geometry, label placement, brand marks, and dominant colors. Integrate it with correct perspective, scale, contact, lighting, reflections, and shadows.', searchTerms: ['brand', 'package', 'product fidelity'], cautionIds: ['reference-roles'], order: 6 })),
  token(route({ id: 'route-style', token: 'style:', aliases: [], meaning: 'Transfer named visible style attributes only.', direction: 'Transfer only the requested palette, lighting, contrast, material treatment, texture, medium, atmosphere, or commercial finish. Do not copy reference people, objects, logos, or layout.', searchTerms: ['visual style', 'material treatment', 'finish'], cautionIds: ['reference-roles'], order: 7 })),
  token(route({ id: 'route-tone', token: 'tone:', aliases: [], meaning: 'Transfer palette, lighting, or mood from a reference.', direction: 'Use the reference only for palette, lighting, contrast, material treatment, and overall visual mood. Keep the base subject, pose, composition, camera, geometry, objects, and content unchanged.', searchTerms: ['palette', 'mood', 'lighting'], cautionIds: ['reference-roles'], order: 8 })),
  token(route({ id: 'route-perspective', token: 'perspective:', aliases: [], meaning: 'Correct vanishing points, scale, and world-space alignment.', direction: 'Correct only scene geometry. State the horizon and vanishing-point relationship, parallel and perpendicular orientations, foreground/background scale, camera height, viewing direction, lens feel, and occlusion order. Align marked guides when supplied.', searchTerms: ['vanishing point', 'geometry', 'alignment'], cautionIds: ['preservation', 'camera-cues'], order: 9 })),
  token({ id: 'route-camera-lock', familyId: 'routes', token: 'camera lock:', aliases: [], meaning: 'Preserve angle, crop, lens feel, and distortion.', direction: 'Preserve the existing camera position, height, viewing direction, framing, crop, wide-angle/low-focal-length appearance, barrel/fisheye distortion, and perspective. Apply only [change]. Do not normalize the lens or recenter the composition.', searchTerms: ['camera lock', 'barrel distortion', 'do not recenter'], cautionIds: ['preservation', 'camera-cues'], order: 10, sourceFile: snippetFile, sourceHeading: '## 8. Camera lock' }),
  token(route({ id: 'route-reframe', token: 'reframe:', aliases: [], meaning: 'Change aspect ratio or crop while preserving scene relationships.', direction: 'Adapt to [aspect ratio] while preserving identity, pose, relative scale, camera angle, lens feel, and key scene geometry. Extend or crop the environment naturally rather than redesigning the scene.', searchTerms: ['aspect ratio', 'crop', 'composition'], cautionIds: ['preservation', 'camera-cues'], order: 11 })),
  token(route({ id: 'route-clean', token: 'clean:', aliases: [], meaning: 'Simplify an environment while keeping its architecture.', direction: 'Remove requested clutter, text, logos, posters, plants, props, or people while reconstructing plausible clean surfaces. Maintain architecture, perspective, lighting, and negative space.', searchTerms: ['simplify', 'clutter', 'architecture'], cautionIds: ['preservation'], order: 12 })),
  token(route({ id: 'route-motion', token: 'motion:', aliases: [], meaning: 'Add controlled motion cues along a named path.', direction: 'Keep the primary face and body readable. Put motion blur only along the intended path; avoid grain, face smearing, anatomy duplication, and whole-frame blur.', searchTerms: ['afterimage', 'motion blur', 'movement'], cautionIds: ['preservation'], order: 13 })),
  token({ id: 'route-hq', familyId: 'routes', token: 'hq', aliases: ['hq:'], meaning: 'Request quality restoration without a new interpretation.', direction: 'Quality-restoration pass only. Do not redesign, restyle, recompose, or change content. Remove noise, grain, compression artifacts, smearing, muddy textures, doubled edges, and accumulated degradation while preserving the same image.', searchTerms: ['restoration', 'quality', 'anti-degradation', 'oversharpening'], cautionIds: ['preservation', 'restoration', 'render-size'], order: 14, sourceFile: snippetFile, sourceHeading: '## 13. HIGH-QUALITY RESTORATION / ANTI-DEGRADATION' }),
  token(route({ id: 'route-lock', token: 'lock:', aliases: [], meaning: 'Preserve everything except the named change.', direction: 'Preserve the subject identity, pose, camera, framing, lens feel, perspective, lighting, colors, scene layout, and all unaffected objects. Apply only the named change.', searchTerms: ['preserve', 'unchanged', 'constraint'], cautionIds: ['preservation'], order: 15 })),
];

const familySource = (heading: string): SourceRef => ({ file: skillFile, heading });
const presetSource = '## Fast all-in-one presets';

const familyToken = (familyId: Exclude<ShorthandEntry['familyId'], 'routes'>, id: string, tokenValue: string, meaning: string, direction: string, order: number, searchTerms: readonly string[], cautionIds: ShorthandEntry['cautionIds'] = ['camera-cues'], aliases: readonly string[] = [], sourceHeading: string): ShorthandEntry => ({
  id,
  kind: 'token',
  familyId,
  token: tokenValue,
  aliases,
  meaning,
  direction,
  searchTerms,
  cautionIds,
  order,
  sources: [familySource(sourceHeading)],
});

const renderSource = '## Resolution and render routing';
export const renderEntries: readonly ShorthandEntry[] = [
  familyToken('render', 'render-draft', 'draft', 'Fastest useful generation for iteration.', 'Use the fastest useful generation for iteration; do not maximize output resolution yet.', 1, ['iteration', 'fast'], ['render-size'], [], renderSource),
  familyToken('render', 'render-final', 'final', 'Highest practical quality for a production-ready export.', 'Use the highest practical quality with clean detail and production-ready export. PNG is preferred when transparency or further compositing matters.', 2, ['production', 'export', 'png'], ['render-size'], [], renderSource),
  familyToken('render', 'render-2k', '2k', 'Request 2K-class output when exact size controls exist.', 'Request a true 2K-class output when the active tool or API supports exact dimensions. If it does not expose pixel controls, treat 2k as a quality target only.', 3, ['2048', 'pixel size', 'quality target'], ['render-size'], [], renderSource),
  familyToken('render', 'render-4k', '4k', 'Request 4K-class output when exact size controls exist.', 'Request a true 4K-class output when the active tool or API supports exact dimensions. If it does not expose pixel controls, treat 4k as a quality target only.', 4, ['3840', 'pixel size', 'quality target'], ['render-size'], [], renderSource),
  familyToken('render', 'render-web-hq', 'web-hq', 'Use the highest native quality available in ChatGPT web.', 'Use the highest native quality or resolution available in ChatGPT web without falsely claiming an exact pixel size.', 5, ['chatgpt web', 'native resolution'], ['render-size'], [], renderSource),
];

const cameraSource = '### Camera / focal-length presets';
export const cameraEntries: readonly ShorthandEntry[] = [
  familyToken('camera', 'camera-ultrawide18', 'cam:ultrawide18', 'Dramatic 18mm-class spatial expansion.', 'Use a dramatic 18mm-class full-frame visual cue with strong spatial expansion; use carefully around faces.', 1, ['18mm', 'wide'], ['camera-cues'], [], cameraSource),
  familyToken('camera', 'camera-wide24', 'cam:wide24', 'Energetic 24mm environmental advertising feel.', 'Use an energetic 24mm environmental advertising visual cue with pronounced foreground/background scale.', 2, ['24mm', 'advertising'], ['camera-cues'], [], cameraSource),
  familyToken('camera', 'camera-wide28', 'cam:wide28', 'Wide commercial/editorial environmental portrait.', 'Use a wide commercial/editorial environmental portrait cue that is dynamic but less distorted than 24mm.', 3, ['28mm', 'portrait'], ['camera-cues'], [], cameraSource),
  familyToken('camera', 'camera-wide35', 'cam:wide35', 'Classic versatile advertising/social environmental portrait.', 'Use a classic advertising/social environmental portrait cue with energetic, natural, versatile perspective.', 4, ['35mm', 'advertising', 'social'], ['camera-cues'], [], cameraSource),
  familyToken('camera', 'camera-natural50', 'cam:natural50', 'Balanced perspective for polished realism.', 'Use a balanced perspective cue for polished commercial/editorial realism.', 5, ['50mm', 'natural'], ['camera-cues'], ['cam:50'], cameraSource),
  familyToken('camera', 'camera-portrait85', 'cam:portrait85', 'Flattering compression with clean background separation.', 'Use a compressed, flattering portrait/product-with-person cue with cleaner background separation.', 6, ['85mm', 'portrait', 'compression'], ['camera-cues'], ['cam:85'], cameraSource),
  familyToken('camera', 'camera-tele135', 'cam:tele135', 'Strong compression for graphic layered distance.', 'Use strong compression and graphic layering for a distant candid/editorial feel.', 7, ['135mm', 'telephoto', 'compression'], ['camera-cues'], [], cameraSource),
  familyToken('camera', 'camera-macro100', 'cam:macro100', 'Close product or beauty detail.', 'Use a close product/beauty detail cue with controlled compression and shallow depth when appropriate.', 8, ['100mm', 'macro', 'detail'], ['camera-cues'], [], cameraSource),
  familyToken('camera', 'camera-fisheye', 'cam:fisheye', 'Intentional curved action or youth-culture perspective.', 'Use intentional fisheye/barrel-distorted action or youth-culture perspective; preserve curved geometry.', 9, ['fisheye', 'barrel', 'curved'], ['camera-cues'], [], cameraSource),
  familyToken('camera', 'camera-closewide24', 'cam:closewide24', 'Physically close 24mm-class social-ad energy.', 'Use a physically close 24mm-class cue with exaggerated foreground hands/products and energetic social-ad perspective.', 10, ['close wide', '24mm', 'social ad'], ['camera-cues'], [], cameraSource),
  familyToken('camera', 'camera-closewide35', 'cam:closewide35', 'Close 35mm-class dimensional commercial portrait.', 'Use a close 35mm-class commercial portrait cue that is dimensional but less extreme than 24mm.', 11, ['close wide', '35mm', 'commercial portrait'], ['camera-cues'], [], cameraSource),
];

const angleSource = '### Angle presets';
export const angleEntries: readonly ShorthandEntry[] = [
  familyToken('angles', 'angle-eye', 'angle:eye', 'Balanced eye-level viewpoint.', 'Use an eye-level, balanced, credible viewpoint.', 1, ['eye level', 'credible'], [], [], angleSource),
  familyToken('angles', 'angle-lowhero', 'angle:lowhero', 'Confident low hero viewpoint.', 'Place the camera below eye level, looking slightly upward for confident hero or product emphasis.', 2, ['low angle', 'hero'], ['camera-cues'], [], angleSource),
  familyToken('angles', 'angle-high', 'angle:high', 'Elevated, graphic, approachable viewpoint.', 'Use an elevated camera looking slightly downward for a graphic, organized, approachable view.', 3, ['high angle', 'elevated'], ['camera-cues'], [], angleSource),
  familyToken('angles', 'angle-topdown', 'angle:topdown', 'Near-vertical overhead view.', 'Use a near-vertical overhead view for flat-lay, product, or social composition.', 4, ['overhead', 'flat lay'], ['camera-cues'], [], angleSource),
  familyToken('angles', 'angle-worm', 'angle:worm', 'Very low near-floor scale exaggeration.', 'Use a very low near-floor angle for exaggerated scale and energy.', 5, ['worm eye', 'floor'], ['camera-cues'], [], angleSource),
  familyToken('angles', 'angle-dutch', 'angle:dutch', 'Controlled tilted editorial horizon.', 'Use a controlled tilted horizon for energetic editorial or action feel, not accidental crookedness.', 6, ['tilt', 'horizon', 'editorial'], [], [], angleSource),
  familyToken('angles', 'angle-3q', 'angle:3q', 'Clean three-quarter relationship.', 'Use a clean 3/4 view for people, products, desks, or interiors.', 7, ['three quarter', 'three-quarter'], [], [], angleSource),
  familyToken('angles', 'angle-profile', 'angle:profile', 'True side/profile relationship.', 'Use a true side/profile relationship; avoid drifting into a diagonal 3/4 view.', 8, ['side view', 'side'], [], [], angleSource),
  familyToken('angles', 'angle-front', 'angle:front', 'Frontal symmetrical relationship.', 'Use a frontal symmetrical view.', 9, ['frontal', 'symmetry'], [], [], angleSource),
  familyToken('angles', 'angle-over-shoulder', 'angle:over-shoulder', 'Foreground shoulder or arm creates depth.', 'Use a foreground shoulder or arm to create depth while keeping the subject or object readable.', 10, ['ots', 'foreground'], [], [], angleSource),
];

const compositionSource = '### Composition presets';
export const compositionEntries: readonly ShorthandEntry[] = [
  familyToken('composition', 'composition-hero', 'comp:hero', 'Dominant subject with campaign hierarchy.', 'Make the subject dominant with a clear hierarchy, strong silhouette, and advertising key-visual readability.', 1, ['hero', 'key visual'], [], [], compositionSource),
  familyToken('composition', 'composition-social', 'comp:social', 'Fast mobile read with clean negative space.', 'Use bold subject scale, clean negative space for possible copy, and minimal clutter for a fast mobile read.', 2, ['mobile', 'social ad'], [], [], compositionSource),
  familyToken('composition', 'composition-editorial', 'comp:editorial', 'Intentional asymmetry and layered depth.', 'Use intentional asymmetry, layered depth, and art-directed negative space with less catalog regularity.', 3, ['magazine', 'asymmetry'], [], [], compositionSource),
  familyToken('composition', 'composition-fashion', 'comp:fashion', 'Graphic fashion crop and body lines.', 'Use elongated body lines, deliberate cropping, a graphic pose, and confident negative space.', 4, ['fashion', 'crop'], [], [], compositionSource),
  familyToken('composition', 'composition-lifestyle', 'comp:lifestyle', 'Believable candid environmental interaction.', 'Use believable candid interaction, less rigid centering, and environmental storytelling.', 5, ['candid', 'environment'], [], [], compositionSource),
  familyToken('composition', 'composition-producthero', 'comp:producthero', 'Product-first hero hierarchy.', 'Make the product unmistakable as the focal point with clean silhouette, readable shape/label, and controlled reflections.', 6, ['product', 'packshot'], [], [], compositionSource),
  familyToken('composition', 'composition-centered', 'comp:centered', 'Polished centered symmetry.', 'Use strong centered symmetry for a polished campaign or packshot feel.', 7, ['symmetry', 'center'], [], [], compositionSource),
  familyToken('composition', 'composition-thirds', 'comp:thirds', 'Conventional rule-of-thirds balance.', 'Use conventional rule-of-thirds balance.', 8, ['rule of thirds', 'balance'], [], [], compositionSource),
  familyToken('composition', 'composition-negative', 'comp:negative', 'Substantial clean negative space.', 'Reserve substantial clean negative space without adding text.', 9, ['space', 'copy space'], [], [], compositionSource),
  familyToken('composition', 'composition-foreground', 'comp:foreground', 'Deliberate foreground occlusion for depth.', 'Use a deliberate foreground occluder or object for depth and energetic social composition.', 10, ['occluder', 'depth'], [], [], compositionSource),
  familyToken('composition', 'composition-layered', 'comp:layered', 'Clear foreground, subject, and background separation.', 'Create clear foreground, subject, and background separation.', 11, ['layers', 'separation'], [], [], compositionSource),
  familyToken('composition', 'composition-widekey', 'comp:widekey', 'Wide key visual with environmental context.', 'Use a key visual with environment context and strong subject separation.', 12, ['environmental key visual'], [], [], compositionSource),
  familyToken('composition', 'composition-tight', 'comp:tight', 'Immediate cropped high-impact read.', 'Use a cropped close, immediate, high-impact mobile or editorial read.', 13, ['close crop', 'impact'], [], [], compositionSource),
];

const lightingSource = '### Lighting presets';
export const lightingEntries: readonly ShorthandEntry[] = [
  familyToken('lighting', 'lighting-highkey', 'light:highkey', 'Bright polished commercial softness.', 'Use a large soft source, bright exposure, clean whites, open shadows, and polished commercial finish.', 1, ['high key', 'bright'], [], [], lightingSource),
  familyToken('lighting', 'lighting-softbox', 'light:softbox', 'Large diffused studio key.', 'Use a large diffused studio key with soft controlled shadows for premium product or portrait finish.', 2, ['studio', 'diffused'], [], [], lightingSource),
  familyToken('lighting', 'lighting-clamshell', 'light:clamshell', 'Beauty-style frontal key and lower fill.', 'Use a beauty-style frontal key with lower fill for smooth face, bright eyes, and controlled shadow.', 3, ['beauty', 'frontal'], [], [], lightingSource),
  familyToken('lighting', 'lighting-beautydish', 'light:beautydish', 'Crisp beauty/fashion key.', 'Use a crisp beauty/fashion key with defined cheekbones and controlled falloff.', 4, ['beauty', 'fashion'], [], [], lightingSource),
  familyToken('lighting', 'lighting-window', 'light:window', 'Directional soft daylight.', 'Use large directional soft daylight from one side for natural premium lifestyle/editorial feel.', 5, ['daylight', 'soft side light'], [], [], lightingSource),
  familyToken('lighting', 'lighting-daybounce', 'light:daybounce', 'Bright daylight with bounced fill.', 'Use bright natural daylight with soft bounced fill for airy advertising or lifestyle realism.', 6, ['daylight', 'bounce'], [], [], lightingSource),
  familyToken('lighting', 'lighting-hardsun', 'light:hardsun', 'Punchy graphic sunlight.', 'Use hard directional sunlight with crisp graphic shadows for fashion/editorial energy.', 7, ['sun', 'hard light'], [], [], lightingSource),
  familyToken('lighting', 'lighting-hardflash', 'light:hardflash', 'Direct flash with sharp shadows.', 'Use direct hard flash with sharp shadows and specular highlights for intentional fashion/editorial/Y2K feel.', 8, ['flash', 'specular'], [], [], lightingSource),
  familyToken('lighting', 'lighting-onflash', 'light:onflash', 'Flattened on-camera flash aesthetic.', 'Use on-camera flash with flattened frontal illumination, fast falloff, and paparazzi/social/Y2K energy.', 9, ['flash', 'paparazzi'], [], [], lightingSource),
  familyToken('lighting', 'lighting-rim', 'light:rim', 'Edge light for subject separation.', 'Use visible edge or rim light to separate the subject from the background.', 10, ['edge light', 'separation'], [], [], lightingSource),
  familyToken('lighting', 'lighting-backlit', 'light:backlit', 'Luminous backlight with controlled fill.', 'Use luminous backlight with controlled face or product fill for aspirational lifestyle mood.', 11, ['backlight', 'luminous'], [], [], lightingSource),
  familyToken('lighting', 'lighting-gradient', 'light:gradient', 'Clean studio background gradient.', 'Use studio background light to form a clean tonal gradient behind the subject or product.', 12, ['background', 'gradient'], [], [], lightingSource),
  familyToken('lighting', 'lighting-split', 'light:split', 'Dramatic side split with limited fill.', 'Use dramatic side split with limited fill for editorial, less commercial-clean treatment.', 13, ['side light', 'dramatic'], [], [], lightingSource),
  familyToken('lighting', 'lighting-neon', 'light:neon', 'Controlled colored practical sources.', 'Use colored practical or neon sources with controlled skin or product color for nightlife/social feel.', 14, ['colored light', 'nightlife'], [], [], lightingSource),
  familyToken('lighting', 'lighting-overcast', 'light:overcast', 'Soft diffuse exterior light.', 'Use soft diffuse exterior light with low contrast for natural lifestyle or fashion.', 15, ['diffuse', 'exterior'], [], [], lightingSource),
  familyToken('lighting', 'lighting-golden', 'light:golden', 'Warm low-angle sunlight.', 'Use warm low-angle sunlight for aspirational lifestyle; avoid orange-heavy treatment unless asked.', 16, ['golden hour', 'sunlight'], [], [], lightingSource),
];

const looksSource = '### Look / production-style presets';
export const lookEntries: readonly ShorthandEntry[] = [
  familyToken('looks', 'look-commercial', 'look:commercial', 'Polished professional advertising finish.', 'Use polished professional advertising photography with crisp but natural detail, controlled lighting, clean surfaces, and clear hierarchy.', 1, ['advertising', 'polished'], [], [], looksSource),
  familyToken('looks', 'look-campaign', 'look:campaign', 'Premium brand-campaign finish.', 'Use confident art direction, refined styling, and strong graphic read for a premium brand campaign.', 2, ['brand', 'premium'], [], [], looksSource),
  familyToken('looks', 'look-editorial', 'look:editorial', 'Magazine attitude and visual narrative.', 'Use magazine/editorial photography with more attitude, asymmetry, crop tension, and visual narrative.', 3, ['magazine', 'asymmetry'], [], [], looksSource),
  familyToken('looks', 'look-lifestyle', 'look:lifestyle', 'Natural aspirational candidness.', 'Use natural aspirational candidness with believable interaction and environment, less staged.', 4, ['candid', 'aspirational'], [], [], looksSource),
  familyToken('looks', 'look-fashion', 'look:fashion', 'Styling-led fashion campaign direction.', 'Use fashion-campaign/editorial direction with sculpted pose, confident cropping, and styling-led image.', 5, ['fashion', 'styling'], [], [], looksSource),
  familyToken('looks', 'look-beauty', 'look:beauty', 'Precise face and material detail.', 'Prioritize skin or product detail, flattering face light, precise makeup or material texture, and clean retouching.', 6, ['skin', 'retouching'], [], [], looksSource),
  familyToken('looks', 'look-y2k', 'look:y2k', 'Punchy early-2000s youth/editorial energy.', 'Use early-2000s youth/editorial energy with direct flash or glossy studio light, punchy framing, and playful futurism; avoid automatically adding text, chrome graphics, or clutter.', 7, ['2000s', 'flash', 'youth'], [], [], looksSource),
  familyToken('looks', 'look-street', 'look:street', 'Energetic grounded environmental portrait.', 'Use energetic environmental portrait direction with candid immediacy and grounded texture without unnecessary grit.', 8, ['street', 'candid'], [], [], looksSource),
  familyToken('looks', 'look-studio', 'look:studio', 'Controlled seamless environment.', 'Use a controlled seamless or studio environment with deliberate light shaping and minimal distractions.', 9, ['seamless', 'controlled'], [], [], looksSource),
  familyToken('looks', 'look-luxury', 'look:luxury', 'Restrained premium materials and space.', 'Use restrained premium materials, elegant lighting, low clutter, and intentional negative space.', 10, ['premium', 'elegant'], [], [], looksSource),
  familyToken('looks', 'look-cleanblue', 'look:cleanblue', 'Bright white and clean blue modernity.', 'Use bright white and clean blue, cool daylight, minimal modern architecture, and smooth surfaces.', 11, ['white blue', 'modern'], [], [], looksSource),
  familyToken('looks', 'look-tech', 'look:tech', 'Precise modern materials and highlights.', 'Use precise modern lighting, cool neutral palette, clean materials, controlled highlights, and no generic sci-fi clutter.', 12, ['technology', 'modern'], [], [], looksSource),
  familyToken('looks', 'look-foodad', 'look:foodad', 'Appetizing directional product treatment.', 'Use appetizing directional light, clean specular control, fresh surfaces, and readable product hierarchy.', 13, ['food', 'product'], [], [], looksSource),
  familyToken('looks', 'look-sport', 'look:sport', 'Energetic action with crisp separation.', 'Use energetic pose, crisp action, controlled contrast, dimensional light, and strong subject separation.', 14, ['action', 'athletic'], [], [], looksSource),
  familyToken('looks', 'look-ugc-polished', 'look:ugc-polished', 'Social-native immediacy with polished exposure.', 'Use believable handheld or casual framing with professional exposure, focus, and color.', 15, ['social', 'handheld'], [], [], looksSource),
  familyToken('looks', 'look-cinematic', 'look:cinematic', 'Filmic contrast when explicitly requested.', 'Use filmic contrast and motivated light only when explicitly desired; do not apply by default.', 16, ['film', 'contrast'], [], [], looksSource),
];

const depthSource = '### Depth-of-field / focus presets';
export const depthFocusEntries: readonly ShorthandEntry[] = [
  familyToken('depth-focus', 'dof-deep', 'dof:deep', 'Keep environment and subject broadly readable.', 'Keep environment and subject broadly readable; useful for architecture, classroom, or office geometry.', 1, ['depth of field', 'environment'], [], [], depthSource),
  familyToken('depth-focus', 'dof-medium', 'dof:medium', 'Keep subject clear with a legible softened background.', 'Keep the subject clear while the background is softened but still legible.', 2, ['depth of field', 'background'], [], [], depthSource),
  familyToken('depth-focus', 'dof-shallow', 'dof:shallow', 'Create pronounced subject separation.', 'Create pronounced subject separation; use sparingly when background geometry matters.', 3, ['depth of field', 'separation'], [], [], depthSource),
  familyToken('depth-focus', 'focus-product', 'focus:product', 'Prioritize product label and silhouette.', 'Give the product label and silhouette priority.', 4, ['sharpness', 'product'], [], [], depthSource),
  familyToken('depth-focus', 'focus-face', 'focus:face', 'Prioritize facial features and eyes.', 'Make facial features and eyes the primary sharpness target.', 5, ['sharpness', 'face'], [], [], depthSource),
  familyToken('depth-focus', 'focus-scene', 'focus:scene', 'Preserve spatial readability across the set.', 'Preserve spatial readability across the set.', 6, ['sharpness', 'environment'], [], [], depthSource),
];

export const patternEntries: readonly ShorthandEntry[] = [
  {
    id: 'pattern-reference-roles',
    kind: 'pattern',
    familyId: 'reference-patterns',
    token: '1=base; 2=[role]; 3=[role]. [change].',
    aliases: [],
    meaning: 'Assign each reference one role before combining traits.',
    direction: 'Image 1 is the base scene. Image 2 is reference only for [role]. Image 3 is reference only for [role]. Transfer only those named traits; do not import unrelated content from the references. Preserve Image 1\'s camera, framing, lens feel, lighting, environment, perspective, scale, occlusion, and all other scene content.',
    example: '1=base; 2=pose; 3=face. Put 1\'s subject in 2\'s pose with 3\'s face. Lock camera + scene.',
    searchTerms: ['base scene', 'roles', 'multi-reference', 'composite'],
    cautionIds: ['reference-roles'],
    order: 1,
    sources: [{ file: snippetFile, heading: '## 3. Multi-reference composite' }],
  },
  {
    id: 'pattern-marked-area',
    kind: 'pattern',
    familyId: 'reference-patterns',
    token: 'marked area only: [change]. Treat red guide as geometry.',
    aliases: [],
    meaning: 'Use a marked region as authoritative edit geometry.',
    direction: 'Apply the requested change only in the marked or identified region. Treat the red line or coordinate as authoritative placement or geometry guidance. Preserve all unmarked regions, including camera, identity, lighting, composition, perspective, and surrounding objects.',
    searchTerms: ['red guide', 'coordinates', 'marked region', 'geometry'],
    cautionIds: ['preservation'],
    order: 2,
    sources: [{ file: snippetFile, heading: '## 15. Red markup / coordinate edit' }],
  },
];

const preset = (id: string, tokenValue: string, meaning: string, componentEntryIds: readonly string[], order: number, searchTerms: readonly string[], example?: string): Preset => ({
  id,
  kind: 'preset',
  familyId: 'presets',
  token: tokenValue,
  meaning,
  componentEntryIds,
  ...(example ? { example } : {}),
  searchTerms,
  cautionIds: ['reference-roles'],
  order,
  sources: [{ file: skillFile, heading: presetSource }],
});

export const presetEntries: readonly Preset[] = [
  preset('preset-commercial', 'preset:commercial', 'Polished commercial advertising combination.', ['camera-wide35', 'angle-3q', 'composition-hero', 'lighting-highkey', 'look-commercial', 'dof-medium'], 1, ['advertising', 'polished', 'hero']),
  preset('preset-social-ad', 'preset:social-ad', 'Energetic mobile-ad combination with close perspective.', ['camera-closewide24', 'angle-lowhero', 'composition-social', 'lighting-daybounce', 'look-commercial', 'dof-deep'], 2, ['mobile', 'social', 'energetic']),
  preset('preset-editorial', 'preset:editorial', 'Magazine-style asymmetric editorial combination.', ['camera-natural50', 'angle-3q', 'composition-editorial', 'lighting-window', 'look-editorial', 'dof-medium'], 3, ['magazine', 'asymmetry'], 'cam:natural50 angle:3q comp:editorial light:window look:editorial dof:medium'),
  preset('preset-fashion', 'preset:fashion', 'Flattering fashion/editorial combination.', ['camera-portrait85', 'angle-lowhero', 'composition-fashion', 'lighting-beautydish', 'look-fashion', 'dof-medium'], 4, ['fashion', 'portrait', 'beauty'], 'cam:portrait85 angle:lowhero comp:fashion light:beautydish look:fashion dof:medium'),
  preset('preset-y2k', 'preset:y2k', 'Punchy early-2000s editorial combination.', ['camera-wide28', 'angle-dutch', 'composition-tight', 'lighting-onflash', 'look-y2k', 'dof-deep'], 5, ['2000s', 'flash', 'youth']),
  preset('preset-lifestyle', 'preset:lifestyle', 'Natural aspirational lifestyle combination.', ['camera-wide35', 'angle-eye', 'composition-lifestyle', 'lighting-window', 'look-lifestyle', 'dof-medium'], 6, ['candid', 'lifestyle']),
  preset('preset-product', 'preset:product', 'Product-first studio combination.', ['camera-portrait85', 'composition-producthero', 'lighting-softbox', 'look-studio', 'focus-product'], 7, ['packshot', 'product', 'studio']),
  preset('preset-cleanblue', 'preset:cleanblue', 'Bright white-blue commercial combination.', ['camera-wide35', 'angle-3q', 'composition-hero', 'lighting-highkey', 'look-cleanblue', 'dof-deep'], 8, ['white blue', 'clean', 'commercial']),
  preset('preset-dynamic', 'preset:dynamic', 'Energetic foreground-depth combination.', ['camera-closewide24', 'angle-lowhero', 'composition-foreground', 'lighting-daybounce', 'look-commercial', 'dof-deep'], 9, ['dynamic', 'foreground', 'energy']),
  preset('preset-luxury', 'preset:luxury', 'Restrained premium negative-space combination.', ['camera-portrait85', 'composition-negative', 'lighting-gradient', 'look-luxury', 'dof-medium'], 10, ['premium', 'negative space', 'elegant']),
];

export const shorthandEntries: readonly ShorthandEntry[] = [
  ...routeEntries,
  ...renderEntries,
  ...cameraEntries,
  ...angleEntries,
  ...compositionEntries,
  ...lightingEntries,
  ...lookEntries,
  ...depthFocusEntries,
  ...patternEntries,
];

export const entries: readonly (ShorthandEntry | Preset)[] = [...shorthandEntries, ...presetEntries];
