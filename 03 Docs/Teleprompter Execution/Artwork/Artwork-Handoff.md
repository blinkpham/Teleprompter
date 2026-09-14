# Artwork handoff

Status: v2 identity packet accepted and integrated · 2026-09-13

## v2 industrial identity candidates

This lane generated a tighter futuristic/minimal family for the Teleprompter identity. The lead visually accepted the v2 family against the contact sheet and alpha check, then switched the renderer's group imports to the v2 runtime derivatives. The v1 assets remain versioned and available for rollback.

The picker north star is the supplied dark, quiet chooser at `/var/folders/gb/zp01z3q92956vwjbn79879480000gn/T/codex-clipboard-9b8bb16a-0f3c-4523-84b0-bf809655f250.png`: the illustrations carry the meaning, labels stay short and human, and the asset itself contains no shorthand, helper copy, CTA, nested-card treatment, or decorative orb/glow UI. The restrained amber light in these renders is part of the industrial material language, not interface chrome.

| Asset ID | Runtime | Master | Mapping | Status |
|---|---|---|---|---|
| `identity.teleprompter-icon.v2` | `src/renderer/src/assets/teleprompter/runtime/teleprompter-icon-v2.png` | `src/renderer/src/assets/teleprompter/masters/teleprompter-icon-v2.png` | app identity | accepted and integrated |
| `identity.group-optics.v2` | `src/renderer/src/assets/teleprompter/runtime/group-optics-v2.png` | `src/renderer/src/assets/teleprompter/masters/group-optics-v2.png` | Optics group | accepted and integrated |
| `identity.group-stage.v2` | `src/renderer/src/assets/teleprompter/runtime/group-stage-v2.png` | `src/renderer/src/assets/teleprompter/masters/group-stage-v2.png` | Stage group | accepted and integrated |
| `identity.group-finish.v2` | `src/renderer/src/assets/teleprompter/runtime/group-finish-v2.png` | `src/renderer/src/assets/teleprompter/masters/group-finish-v2.png` | Finish group | accepted and integrated |

All v2 masters are 1024×1024 PNGs. Runtime derivatives are 512×512 PNGs. The icon is opaque RGB; the three group objects are RGBA with verified transparency. `alpha-check-v2.png` shows each group object over both light and dark backgrounds; no painted checkerboard or black matte is present. `contact-sheet-v2.png` shows the family at a shared review scale.

## Provenance and prompts

- Manifest: `src/renderer/src/assets/teleprompter/manifest.json`
- Provenance: `03 Docs/Teleprompter Execution/Artwork/provenance.jsonl`
- Prompts: `03 Docs/Teleprompter Execution/Artwork/prompts/teleprompter-icon-v2.md`, `group-optics-v2.md`, `group-stage-v2.md`, `group-finish-v2.md`
- Review sheets: `03 Docs/Teleprompter Execution/Artwork/contact-sheet-v2.png`, `alpha-check-v2.png`
- Visual reference: `/var/folders/gb/zp01z3q92956vwjbn79879480000gn/T/codex-clipboard-9b8bb16a-0f3c-4523-84b0-bf809655f250.png`

The built-in image-generation route was used for all four industrial renders. Its response exposed an output path and dimensions but no selectable or returned model ID. The requested model is therefore `unknown-built-in-route`, the resolved model is `unknown`, and these assets make no GPT Image 2.5 Flare claim.

## Practical series gate

The six accepted practical requests remain `blocked-model-verification`. The exact `gpt-image-2.5-flare` route is not selectable or evidencable through the built-in tool, and no authorized exact-model API route was available. No practical image, comparison pair, preset example, or edit pair was generated or labeled as Flare. The sanitized route check is recorded in `03 Docs/Teleprompter Execution/Artwork/Model-Route-Evidence.md`.

## Lead integration

The lead promoted all four v2 manifest entries after visual acceptance and switched the renderer group imports in the integration lane. Practical photographic examples remain a separate exact-model gate.
