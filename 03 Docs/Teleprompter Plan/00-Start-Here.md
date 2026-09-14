# Teleprompter — delegation plan

Status: planning handoff · 2026-09-13 · no product changes implemented by this pack.

Teleprompter becomes a dark-only desktop prompt composer. **Cue** opens by default, builds Create and Edit prompts from local snippets, and also opens beside the cursor through a global shortcut. **Library** holds reusable presets and edit recipes; **Tokens** exposes their constituent shorthand. The existing Electron app supplies the starting code and content.

## Authority

This pack records the user's new scope and supersedes conflicting product, UI, and interaction decisions in `03 Docs/Implementation Plan/`, `AGENTS.md`, and `MAP.md`: the old Gallery-first, two-view, read-only, no-prompt-editor, light/system-theme boundary is obsolete for the next implementation. Preserve those historical plan files and the original `teleprompter/` sources. This pack does not authorize implementing anything during the planning turn.

When implementation is dispatched, the lead first updates the root instruction/state pointers to this pack. Keep the workspace directory and legacy data directory in place; the product's display name is **Teleprompter**. Research and image generation happen in worker workflows; the shipped app remains offline and has no model integration.

## Current visual-reset authority

The unresolved presentation work is now governed by [Visual Reset 2026-09-13](<Visual Reset 2026-09-13/00-Start-Here.md>). That nine-document extension supersedes conflicting visual, popup-geometry, and visual-acceptance claims in this original pack and in the earlier execution reset. It preserves the shared engine, draft, clipboard, persistence, and security contracts. Its adaptive popup, compact morphing-card, camera ticker/scrubber, `/preset`, and `@` reference requirements are the only authority for future visual dispatch until replaced by a newer dated brief.

The extension is planning-only: 31 requirement IDs and 30 native acceptance cases are defined, and visual acceptance remains open after a live Electron re-audit found framed appended objects, clipped repeated lens artwork, and duplicated search focus. No implementation change is implied by the plan.

## Read by mission

| Agent | Required reading | Responsibility |
|---|---|---|
| Lead | This index; [audit](01-Current-App-Audit.md); [contracts](02-Cue-and-Library-Contracts.md); [execution](08-Lead-Execution-and-Acceptance.md) | Shared types, root configuration, renderer wiring, acceptance |
| Cue engine | [Contracts](02-Cue-and-Library-Contracts.md); [engine mission](03-Mission-Cue-Engine.md) | Deterministic compiler, selections, presets, content adapter |
| UI and motion | [Contracts](02-Cue-and-Library-Contracts.md); [UI mission](04-Mission-UI-and-Motion.md) | All renderer components, visual system, motion, selectors |
| Desktop | [Contracts](02-Cue-and-Library-Contracts.md); [desktop mission](05-Mission-Desktop.md) | Global shortcut, popup, IPC, drafts, persistence, native rename |
| Illustration | [Artwork mission](06-Mission-Illustration.md); supplied references below | Raster identity, token objects, practical generated examples |
| Library Curator | [Contracts](02-Cue-and-Library-Contracts.md); [curator mission](07-Mission-Library-Curator.md) | Ongoing evidence-led taxonomy, deduplication, atoms and presets |

Each mission starts with a paste-ready dispatch prompt. Workers read their own branch of the pack, report through files, and remain within their assigned paths. The lead owns shared decisions and publication. Start independent lanes together once contracts exist; wait only at actual dependencies.

## Fixed decisions

| Area | Decision |
|---|---|
| App shell | Three icon tabs: Cue, Library, Tokens. No sidebar brand lockup, promotional heading, or repeated lede. Native macOS traffic lights remain. |
| Cue structure | WHAT editor; three parameter tiles; compact constraints/output bar; expandable prompt preview; icon Copy action. Create and Edit retain separate drafts. |
| Parameter groups | **Optics:** camera, distance, depth/focus, angle. **Stage:** composition, lighting. **Finish:** look, mood. |
| Controls | Selected SmoothUI source components; Motion for animation; Radix for overlay semantics; custom slot lists; Phosphor duotone/fill vectors for controls. |
| Materials | Charcoal, brushed silver, frosted polycarbonate, restrained orange internal light. System sans-serif, generous pill controls, shallow relief and inner glows. |
| Prompt engine | Pure local composition of approved text records. No inference, network generation, or executable prompt templates at runtime. |
| Selection | Multi-select across compatible axes; exactly one value on a single-valued axis. Presets unfold into visible atomic selections. |
| Clipboard | Copy text for manual paste. No automatic insertion into the foreground app. |
| Artwork | Generated raster art for objects/identity; practical GPT Image 2.5 examples for photographic settings. UI icons stay vector. |
| Curation | One canonical hierarchy location per record, cross-cutting facets, explicit aliases, evidence, and reversible migrations. No new corpus was researched for this plan. |

## Supplied references

These are copies of the user's attachments, retained so workers do not depend on temporary clipboard paths.

| Reference | Transfer into the product |
|---|---|
| [01 — Fluid composer](References/01-Fluid-Composer.png) | Large-radius input, breathing space, distinct circular utility actions, soft joining surfaces |
| [02 — Camera selector](References/02-Camera-Selector.png) | Centered selection capsule, neighboring choices, image-backed options, edge fades, tactile vertical movement |
| [03 — Parameter composer](References/03-Parameter-Composer.png) | Compact parameter tiles above the main text area; controls grouped around the output action |
| [04 — Industrial materials](References/04-Industrial-Materials.png) | Brushed metal, translucent material, orange-white internal illumination; create an original Teleprompter object |

## Boundaries

This delivery is an audit and a set of plans. It adds no Cue code, installs no UI library, generates no images, and conducts no external prompt-library curation. Runtime model calls, uploads, accounts, sync, video controls, automatic paste, installers, signing, and publication are outside this implementation brief.

The unresolved execution prerequisite is access to an image-generation path that can prove GPT Image 2.5 for practical examples. The artwork mission defines how to resolve it without blocking the engine or UI work. Native acceptance initially targets this macOS host; other operating systems require their own evidence.

**Next step:** give [08 — Lead execution](08-Lead-Execution-and-Acceptance.md) to the lead agent, and [07 — Library Curator](07-Mission-Library-Curator.md) to the long-term curator.
