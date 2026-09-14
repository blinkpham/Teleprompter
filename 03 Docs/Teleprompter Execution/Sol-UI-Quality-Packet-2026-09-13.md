# Sol packet — Teleprompter UI quality reset

## Request

Review the attached project packet and annotated UI references, then return a planning-only `ORCHESTRATE` graph for the Teleprompter quality reset. Do not edit implementation files.

## Objective

Plan a bounded upgrade for the dark-only Electron UI covering:

- stronger type hierarchy and calmer information density;
- human-readable labels instead of raw internal IDs or technical shorthand in primary copy;
- clearer snippet/prompt presentation without code-font styling;
- coherent component and icon semantics;
- a fixed main-window viewport with intentional compact states rather than a web-page-like fluid layout;
- transparent native spotlight framing with correct bounds and focus behavior;
- smoother, restrained motion with reduced-motion behavior;
- explicit separation between UI work and delegated Illustration assets.

## Constraints

- Preserve product truth and the shared Teleprompter contracts.
- Keep the app dark-only and offline/local.
- Do not invent generated artwork in the UI lane; artwork belongs to the Illustration worker.
- Keep native Electron evidence separate from browser-preview evidence.
- Do not rewrite the historical source material or the five historical implementation plans.
- The packet is a snapshot for review; the local project remains authoritative for implementation.

## Required response

Return a file-specific plan with:

1. objective and acceptance checks;
2. disjoint workstreams and ownership;
3. likely files and dependency order;
4. risks and unresolved product decisions;
5. focused verification, including native spotlight evidence;
6. a clear boundary for the Illustration worker.

## Evidence note

The earlier request could not be inspected from Sol because the macOS project path and screenshots were not mounted in that session. This packet supplies the missing evidence directly.

## Packet map

- `project/` — current contracts, live state, plan missions, renderer, desktop, preload, shared types, and engine entry points.
- `references/` — the four retained Teleprompter visual references plus the recent annotated screenshot captures available in the local temp clipboard.
- `packet-manifest.txt` — exact file list and generation timestamp.
