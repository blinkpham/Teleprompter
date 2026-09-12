# Image Director — ChatGPT / Agent Skill

This bundle turns terse image requests into preservation-first image-generation/edit instructions.

## Fastest use

With the skill available, attach your images and type things like:

- `remove: woman. lock everything else`
- `2=pose; 3=face. lock 1's camera`
- `perspective: desks parallel to subject desk`
- `tone: use 2 only`
- `hq`
- `reframe: 4:5`
- `product: can from 2`
- `clean: no text, posters, or clutter`

The first attached image is treated as the edit target by default. Later images are references only, and only the role you name is transferred.

## ChatGPT availability note

OpenAI's current Help Center says personal Skills in ChatGPT are generally available to eligible Business, Enterprise, Healthcare, and Edu users and depend on workspace settings. If your current ChatGPT account does not show Plugins → Skills, use the included Project Instructions fallback instead, or use the skill in a compatible Codex/API skill workflow.

## Files

- `SKILL.md` — behavior and routing.
- `assets/quick-snippets.md` — copy/paste prompt macros.
- `references/prompting-strategy.md` — rationale based on OpenAI image-prompting guidance.


## Preset shorthand

The revised skill understands compact professional production direction such as:

`preset:commercial 2k`
`cam:closewide24 angle:lowhero light:daybounce look:commercial`
`preset:y2k final`
`cam:portrait85 comp:producthero light:softbox focus:product 2k`

Exact 2K/4K dimensions are used only when the active backend exposes pixel-size controls. In ChatGPT web, `web-hq` means highest available native quality without falsely claiming exact pixels.
