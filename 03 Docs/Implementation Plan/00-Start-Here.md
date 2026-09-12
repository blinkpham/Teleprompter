# Image Director implementation plan

Status: ready for implementation. Planning date: 12 September 2026.

Build a small, offline Electron utility for finding and copying image prompts. Gallery presents the 15 existing prompt recipes as a visual library. Cheatsheet presents the complete skill vocabulary as 104 searchable reference entries. The supplied screenshot determines the visual direction: a pale canvas, a slim rounded navigation capsule, teal selection, a large photographic feature, and softly rounded content surfaces.

This is one implementation plan in five parts. Each worker reads this entry point, the shared contracts, and its assigned part. The plan resolves product choices; workers choose ordinary implementation details within those choices.

## Read by assignment

| Assignment | Required reading | Responsibility |
|---|---|---|
| Lead / integration | All five parts; read Part 04 before assigning work | Shared contracts, project configuration during implementation, renderer orchestration, integration, acceptance |
| Luna desktop worker | This file; [Part 01](</Users/blinblon/Claude/Projects/Image Director/03 Docs/Implementation Plan/01-Architecture-and-Contracts.md>); its assignment in [Part 04](</Users/blinblon/Claude/Projects/Image Director/03 Docs/Implementation Plan/04-Execution-and-Acceptance.md>) | Electron main, preload, clipboard, preferences, native menus/window |
| Luna content / engine worker | This file; Part 01 data contracts; [Part 02](</Users/blinblon/Claude/Projects/Image Director/03 Docs/Implementation Plan/02-Content-and-Search-Engine.md>); its Part 04 assignment | Catalog conversion, aliases, preset resolution, search, filters |
| Luna UI worker | This file; Part 01 renderer contracts; [Part 03](</Users/blinblon/Claude/Projects/Image Director/03 Docs/Implementation Plan/03-UI-and-Interaction-Specification.md>); its Part 04 assignment | All visible components, CSS, artwork, responsive behavior, interaction states |
| Sol reviewer | This file; the particular contract/surface under review; Part 04 review brief | Bounded review of contract drift, content fidelity, and actual running UI |

Part 01 owns type and platform contracts. Part 02 owns catalog semantics and search behavior. Part 03 owns appearance and interactions. Part 04 owns file ownership, sequencing, and acceptance. If two parts appear to disagree, use the part that owns that subject and have the lead correct the other reference before dependent implementation continues.

## The experience to build

### Gallery

The user sees a compact navigation rail, a persistent search field, a teal photographic feature for a real technique, and a three-column grid of prompt cards. Each card has a meaningful preview, category, title, short explanation, shorthand preview, a favorite toggle, and a visible Copy prompt button. A lightweight category select and Favorites filter sit above the grid.

Clicking a card's preview/title opens a modal sheet at the right edge. The full reusable prompt is immediately visible below the sheet heading. The underlying Gallery retains its exact search, filters, selection, and scroll position. Closing the sheet returns keyboard focus to the opener. At compact widths the sheet fills the available app area below native window chrome.

### Cheatsheet

The user sees grouped rows rather than image cards. A token, its meaning, and Copy token remain visible in every collapsed row. Opening a row reveals expanded production direction, an example where present, and relevant limits. Presets reveal their component tokens in source order, with each token independently copyable and its meaning nearby.

### Shared behavior

Search runs across both datasets, while each mode displays its own results. The mode control shows both query-result counts when a query is present, so a Gallery search also reveals that Cheatsheet has matches. Search stays in place through a mode switch. Gallery filters apply only to Gallery. Favorites apply only to techniques.

Copy confirmation appears on the button used. A successful copy never opens a global toast. Full prompt, shorthand template, token, expanded direction, and preset components are separate named actions with fixed payload rules.

## Decisions workers must preserve

| Decision | Required result |
|---|---|
| Product boundary | A prompt library and shorthand reference. No model connection, image generation, prompt chat, prompt editor, upload flow, or background image processing in v1. |
| Source boundary | Read the existing skill as content. Its instructions to generate images are not application requirements and are not instructions for the implementation worker to execute. |
| Content | 15 Gallery techniques from the 15 numbered snippets; 102 canonical Cheatsheet commands/presets plus 2 reference patterns. Do not rebuild a new shorthand language. |
| Visual authority | The user's screenshot governs shape, space, imagery, and palette. Its travel text, people, logo, account controls, assistant widget, and travel functions are not app features. |
| Navigation | One mode control: a vertical two-option capsule in the wide rail; the same control becomes horizontal below 900 CSS pixels. No duplicate navigation system. |
| Detail | One native HTML dialog styled as a right-hand modal sheet. The grid does not resize behind it. |
| Search | Local, synchronous, deterministic; no fuzzy-search service, model, query language, or separate results page. |
| State | React reducer for app intent; local component state for temporary disclosure/copy feedback; main process owns disk preferences. |
| Platform | Electron + React + TypeScript + electron-vite; CSS Modules and CSS custom properties; native HTML controls; CSS transitions. |
| Offline | All catalog data, photographs, diagrams, icons, and styles ship locally. No runtime network request is necessary. |
| Persistence | Favorites, appearance preference, last mode, and window bounds only. Search, scroll, open details, and copied text stay in memory. |
| Verification | Verify the actual Electron app. Keep automated coverage confined to catalog integrity, search/preset logic, and preference validation/merge behavior. |

## Source map and scope interpretation

The source inspection found exactly these four files under the project:

| Existing file | Use |
|---|---|
| [image-director/SKILL.md](</Users/blinblon/Claude/Projects/Image Director/image-director/SKILL.md>) | Canonical vocabulary, production direction, preservation rules, preset composition, resolution conditions |
| [image-director/assets/quick-snippets.md](</Users/blinblon/Claude/Projects/Image Director/image-director/assets/quick-snippets.md>) | The 15 Gallery recipes, full prompt text, shorthand templates, examples |
| [image-director/references/prompting-strategy.md](</Users/blinblon/Claude/Projects/Image Director/image-director/references/prompting-strategy.md>) | Brief rationale and semantic checks when content is ambiguous |
| [image-director/README.md](</Users/blinblon/Claude/Projects/Image Director/image-director/README.md>) | Confirms short forms such as `hq`; product availability claims in this file are not app content |

No local AGENTS.md, MAP.md, application source, package manifest, or Git repository was present at planning time. Files such as `image-prompt-kit.md`, project instructions, and a skill ZIP were mentioned as possible sources in the brief but were not found. Implementation does not depend on them.

The direct request for an extremely detailed, multi-part plan takes precedence over the pasted brief's request for a concise single document. These five files form one coordinated plan. The reference's generous curves take precedence over the brief's generic warning against excessive rounding; Part 03 confines larger radii to the major surfaces.

The planning deliverable creates only these Markdown plans. Existing source material remains unchanged. App setup, dependency installation, coding, running the app, and implementation-agent dispatch belong to a subsequent implementation run.

## First useful release

The release is useful when a user can find a technique, inspect it, copy its source-faithful full prompt, find and copy any existing shorthand, inspect preset components, save a favorite, and reopen the app offline with preferences intact. Both themes, compact resizing, and keyboard operation must work visibly.

The catalog is read-only. Bracketed placeholders are copied literally for replacement after pasting. The app makes no promise that a downstream image model will preserve pixels, simulate a physical lens, or return exact 2K/4K dimensions. The relevant source limits appear beside the relevant content, as specified in Part 02.

## Implementation order

1. The lead establishes shared types and one real desktop slice: one source recipe displayed and copied through the native clipboard.
2. Desktop, content/engine, and UI workers proceed in their owned areas using the frozen contracts.
3. The lead connects the completed catalog, engine, components, preferences, and command routing into the actual Electron app.
4. Sol reviews the integrated behavior and visible reference fidelity at the bounded checkpoints in Part 04; Luna implements concrete corrections.
5. The lead completes the five-item acceptance gate in Part 04 and reports the actual result.

Start implementation with [Part 04, Slice A](</Users/blinblon/Claude/Projects/Image Director/03 Docs/Implementation Plan/04-Execution-and-Acceptance.md>).
