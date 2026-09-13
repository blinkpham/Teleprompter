# Artwork handoff

Status: partial acceptance · 2026-09-13

## Accepted industrial identity set

The built-in image generation route produced and visually reviewed four industrial assets: one opaque Teleprompter icon and three transparent group objects for Optics, Stage, and Finish. The icon is a new optical prompt-device silhouette; the group objects share machined aluminum, frosted polycarbonate, and restrained orange-to-white light.

| Asset | Runtime | Master | Mapping | Review |
|---|---|---|---|---|
| `identity.teleprompter-icon.v1` | `runtime/teleprompter-icon-v1.png` | `masters/teleprompter-icon-v1.png` | app identity | approved |
| `identity.group-optics.v1` | `runtime/group-optics-v1.png` | `masters/group-optics-v1.png` | Optics group | approved |
| `identity.group-stage.v1` | `runtime/group-stage-v1.png` | `masters/group-stage-v1.png` | Stage group | approved |
| `identity.group-finish.v1` | `runtime/group-finish-v1.png` | `masters/group-finish-v1.png` | Finish group | approved |

All masters are 1024×1024 PNGs. Runtime derivatives are 512×512 PNGs. The three group derivatives report RGBA pixel format and are requested with true transparency; the app icon is an opaque square. The manifest and one provenance row per generation are adjacent to this handoff. A contact sheet is included for family review.

## Practical series gate

The accepted curator batch contains six practical requests, all requesting `gpt-image-2.5-flare`. The currently exposed built-in image tool does not expose a model selector or resolved-model metadata, and no local API credential is available for an exact Image API call. Therefore no practical image is generated or labeled as Flare in this batch. This is `blocked-model-verification`, not a backend downgrade.

The documented exact route is OpenAI's Image API or Responses image-generation tool with model `gpt-image-2.5-flare`. Once an authorized exact-model route is available, start with the six accepted requests in `03 Docs/Library Curation/batches/2026-09-13-001/asset-requests.jsonl`, at most 12 outputs per wave, and record requested/resolved model evidence per asset.

## Review limits

The built-in route did not return generation metadata that can prove a model ID. Industrial assets are accepted as identity art only; they are not evidence for the practical-example model requirement. Practical photography, comparison pairs, presets, edit pairs, app wiring, or semantic record changes are not claimed here.
