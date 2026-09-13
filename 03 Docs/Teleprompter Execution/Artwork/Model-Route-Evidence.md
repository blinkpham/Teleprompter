# GPT Image 2.5 Flare route evidence

Status: `blocked-model-verification` · 2026-09-13 · Asia/Ho_Chi_Minh

## Gate result

The six curator-accepted Batch 001 practical requests remain blocked. No practical image, comparison pair, preset example, or edit pair was generated in this attempt.

Requested model: `gpt-image-2.5-flare`

Resolved model: `unknown` — no generation was authorized or attempted without exact route evidence.

## Evidence

- Official availability: OpenAI's [GPT-Image-2.5 Flare model page](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare) identifies `gpt-image-2.5-flare` and says it can be selected directly through the Image API or the Responses API image-generation tool. This confirms model availability, not access for this workspace.
- Built-in route: the available `image_gen` tool exposes prompt/reference inputs only. It has no model selector and does not return a resolved model ID. Its existing industrial identity outputs therefore cannot prove Flare.
- API/CLI route: no `openai` CLI was found, no top-level `openai` npm package is installed, and no `OPENAI_API_KEY` is visible in the local environment. Secret values were not read or recorded.
- Authorization: no already-authorized, model-selectable, metered client route was available to this worker.

## Smallest authorized next action

Provide an already-authorized local API/client route that explicitly sends `model: "gpt-image-2.5-flare"` and returns the requested and resolved model IDs in sanitized evidence. Then rerun only the six accepted requests in `03 Docs/Library Curation/batches/2026-09-13-001/asset-requests.jsonl`; keep every new manifest entry pending until full-size and runtime-size review.

No alternate backend, unknown output, or Batch 002 request may be substituted for this gate.
