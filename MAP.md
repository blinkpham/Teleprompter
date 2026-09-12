# MAP — Image Director

Goal: Build the planned offline Electron prompt library and shorthand reference from the existing `image-director` skill.
Updated: 2026-09-12

## Known

- The five files in `03 Docs/Implementation Plan/` are the implementation authority.
- `image-director/SKILL.md`, `image-director/assets/quick-snippets.md`, and `image-director/references/prompting-strategy.md` are source material and remain unchanged.
- The product boundary is fixed: Gallery, Cheatsheet, local search, native copy, favorites, appearance, and small persisted preferences.
- The stack is fixed: Electron + React + TypeScript + electron-vite, with context isolation and sandboxing enabled.
- Slice A is implemented: one real source recipe renders in Electron and copies through the main-process clipboard; the system clipboard and in-app feedback were verified.
- No Git repository or application scaffold existed before this setup.

## Unknown — open

- The exact local asset treatment for the reference photograph remains unresolved → inspect availability and bundle a local credit-backed asset during the UI workstream.
- The final 15-technique and 104-row catalog conversion still needs to be implemented → convert from the unchanged source files and validate with the engine checks.
- Native behavior on Windows/Linux is unverified → implement the documented fallbacks and label those hosts unverified until run there.

## Watchlist

- Electron and electron-vite versions are resolved from the registry at Slice A and should not drift while worker paths are active.
- Long prompts and compact-width dialog behavior may expose layout defects once the complete catalog replaces the seed.
- Preference write failures must remain visibly session-only; never present them as durable saves.

## Next

1. Implement Slice B2: convert the 15 source recipes and 104 reference rows into the typed catalog, then finish deterministic search and preset resolution checks.
