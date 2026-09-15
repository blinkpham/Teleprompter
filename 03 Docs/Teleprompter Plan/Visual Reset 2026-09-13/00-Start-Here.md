# Teleprompter — visual reset

Date: 2026-09-13. Status: implementation plan; visual acceptance remains open.

Replace the current presentation with a compact, tactile prompt composer and image-led selectors. Resolve the user's five annotated critiques across Cue, Library, Tokens, pickers, and preview. The follow-up adds a translucent popup that grows with its content, compact camera-style controls, `/` quick add, and `@` reference mentions. Preserve the working compiler, accepted content, persistence, and native copy semantics while extending their authoring and window contracts.

This delivery contains plans and audit evidence only. No application source, generated artwork, curation record, or shared schema was changed by this reset pack.

## Authority and scope

The user's latest annotations supersede conflicting presentation instructions in the original [UI mission](../04-Mission-UI-and-Motion.md), including its visible “Leave blank” controls, placeholder counts, preview footnotes, always-empty output policy, and chip-based axis navigation. The later adaptive-popup request also supersedes the earlier reset's two fixed native sizes and tall parallel selector columns. [07 — Adaptive Cue](07-Adaptive-Cue-Contract.md) and [08 — Quick add](08-Quick-Add-and-References.md) own those new contracts. Original selection/compilation semantics remain the foundation; layout, compound authoring, local reference-binding, and new-draft defaults are explicit extensions. Existing “accepted” handoffs remain historical evidence and do not close this reset.

The lead owns publication into MAP.md, the top-level plan index, and the execution acceptance record. This planning lane writes only this folder because those files and the renderer contain concurrent work. Implementation has since started; [09 — Astra brief](09-Astra-Implementation-Brief-2026-09-14.md) records the September 14 source snapshot, remaining contract connections, and five explicit acceptance blockers. Publication and dispatch remain with the lead.

| Read | Purpose |
|---|---|
| [01 — Visual contract](01-Visual-Contract.md) | Geometry, materials, states, motion, responsive layouts, product copy |
| [02 — Reaudit and mismatch log](02-Reaudit-and-Mismatch-Log.md) | What is still wrong, what improved, and what has not been witnessed |
| [03 — Worker missions](03-Worker-Missions.md) | Ownership, dependencies, exact dispatch prompts, integration exceptions |
| [04 — Acceptance](04-Acceptance.md) | Native before/after cases and evidence required to close each requirement |
| [05 — Native host research](05-Adaptive-Window-Research.md) | Native macOS/AppKit host, Liquid Glass feasibility, transparent/input limits, and retained compatibility evidence |
| [06 — Compact interaction research](06-Compact-Interaction-Research.md) | Expandable cards, morphs, camera tickers, scrubbers, context menus, suggestions |
| [07 — Adaptive Cue](07-Adaptive-Cue-Contract.md) | Measured popup sizes, compact selectors, motion coordination, host mission |
| [08 — Quick add and references](08-Quick-Add-and-References.md) | `/preset`, `/snippet`, `@`, atomic acceptance, local image bindings |
| [09 — Astra implementation brief](09-Astra-Implementation-Brief-2026-09-14.md) | Current partial work, five open blockers, disjoint ownership, dispatch and re-audit |

## Decisions the implementation must retain

| Boundary | Requirement |
|---|---|
| Runtime | Offline Electron app; no model calls, uploads, accounts, or automatic paste |
| Engine and drafts | Reuse Create/Edit compilers and selection routines; extend commands narrowly for atomic quick add. Keep conflicts, independent drafts, overrides, and intentional blanks |
| Content | 14 accepted runtime records, including 9 atoms; 101 legacy rows remain reference-only. Never infer runtime acceptance from adapter candidates or a proposed curation packet |
| Desktop | Keep prior shortcut/copy/dismissal/placement evidence as a regression baseline. Replace two-size requests with measured layout; verify new native shape, material, focus, and bounds behavior |
| Artwork | Existing v2 group objects may be reused. Practical examples require an evidenced route for exact model `gpt-image-2.5-flare`; proposed Batch 002 records and comparison requests remain unavailable until lead acceptance |

Output defaults, exact preview, atomic quick add, reference bindings, and adaptive bounds need lead-published contracts. A UI worker must not imitate them with unsynchronized display state. [Mission 0](03-Worker-Missions.md#mission-0--lead-integration) and files 07–08 define the affected work. No new corpus acceptance or compiler semantic rewrite is required.

## What makes this reset different in the product

The popup begins as a small prompt bar. Its parameter row or result list appears only when needed, and native bounds follow visible content. A compact parameter card expands one axis with a ruler, rail, small choices, or searchable list. One visual focus preserves the artwork emphasis. Descriptions appear on demand. Empty fields require no extra action.

Library gives each preset a visual cover and a clear “Use in Cue” action. Copy belongs beside the exact prompt it copies. Tokens becomes a compact reference desk with a category index, a grid of terms, and one readable inspector. Preview displays the compiler's actual result, with a format switch and one Copy icon.

## Dispatch order

1. Lead reconciles current dirty ownership and the partial contracts listed in 09, then completes and publishes the preview/default, layout, quick-add, and reference-binding contracts.
2. Native host and UI owners run the bounded SwiftUI/AppKit spike; asset audit and engine quick-add work proceed independently where contracts are ready.
3. Owners implement and integrate the native surface, then run the smallest affected checks. Electron remains a compatibility comparison only.
4. Native witness captures the 30 acceptance cases; the lead resolves failures and records practical-art or hardware limits separately.

The native-host spike is necessary because the window contract changes. It does not justify unrelated platform/installer work. Do not regenerate objects merely because their current CSS crops them badly.

## Lead dispatch prompt

> Implement `03 Docs/Teleprompter Plan/Visual Reset 2026-09-13/`. Read AGENTS.md and MAP.md, then this index, Mission 0, and contracts 07–08. Treat the five annotations and native main/Optics evidence as open requirements. Use os-build and impeccable. Publish the typed seams, run the bounded native macOS host spike from `native/TeleprompterNative/`, and preserve Electron only as compatibility evidence. Implement compact selectors, exact compiler preview, new Create-output defaults, `/` quick add, and `@` reference bindings while preserving accepted content and compiler meaning. Delegate the bounded missions with one UI/style owner and one native cursor owner at a time. You are not alone in the codebase: preserve all existing dirty work. Publish this pointer in MAP.md and obtain the native evidence in 04. Report partial or blocked criteria honestly; assets, screenshots, and tests prove different layers.

Next action: use 09 as the lead's current implementation brief, with the contracts and missions linked here.
