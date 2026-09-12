# Prompting Strategy Reference

Source basis: OpenAI Image Prompting guide, checked 2026-09-12:
https://developers.openai.com/api/docs/guides/image-prompting

## Rules incorporated into this skill

1. Define the intended result, composition, aspect ratio, and placement constraints.
2. For edits, separate the requested change from what must remain unchanged.
3. Give each reference image an explicit role.
4. Describe visible attributes such as lighting, materials, colors, framing, and texture instead of relying only on abstract mood words.
5. Specify pose/action and object interaction concretely.
6. Iterate deliberately, preferably one change at a time, while restating critical preservation constraints.
7. For sketch/markup-to-render work, preserve layout, proportions, and perspective and explicitly forbid unrequested additions.
8. For object removal, name the object and preserve the surrounding person, pose, lighting, and composition.
9. Repeated generative edits can drift. If a region must be pixel-identical, composite the approved edited region into the original instead of relying on prompting alone.

## Personalized implications

The user's prompts are unusually geometry-sensitive. The skill therefore promotes camera, perspective, vanishing-point relationships, parallel/perpendicular orientation, scale, and occlusion into first-class constraints.

The user's style references are usually *partial references*, not invitations to copy the whole image. The skill therefore defaults to role-limited transfer.

The user's typical visual finish is clean commercial photorealism rather than gritty realism: high-key, bright white/blue, cool daylight, minimal surfaces, low clutter, controlled wide-angle distortion, and low/no grain.

The user's iterative workflow often accumulates model artifacts. The skill therefore carries a lightweight anti-degradation guard on every follow-up edit and offers a dedicated `hq:` restoration route.
