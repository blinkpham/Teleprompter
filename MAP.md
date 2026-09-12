# MAP — Image Director

Goal: Build the planned offline Electron prompt library and shorthand reference from the existing `image-director` skill.
Updated: 2026-09-12

## Known

- The five files in `03 Docs/Implementation Plan/` are the implementation authority.
- `image-director/SKILL.md`, `image-director/assets/quick-snippets.md`, and `image-director/references/prompting-strategy.md` are source material and remain unchanged.
- The product boundary is fixed: Gallery, Cheatsheet, local search, native copy, favorites, appearance, and small persisted preferences.
- The stack is fixed: Electron + React + TypeScript + electron-vite, with context isolation and sandboxing enabled.
- The implementation is integrated: 15 source-backed Gallery techniques, 104 Cheatsheet rows, deterministic search, aliases, preset resolution, favorites, appearance, native copy, persisted preferences, and an offline local photo credit are wired into Electron.
- Native built-preview checks passed for the actual `image-director://app/index.html` app: Gallery 15, Cheatsheet 104, theme switching, `⌘K` search focus, alias search (`cam:50` → `cam:natural50` + `preset:editorial` in Cheatsheet), token copy, full-prompt copy, dialog Escape/focus return, favorite persistence, and local photo loading.
- Focused verification passes: `npm run typecheck`, `npm run test:logic` (3 files, 7 tests), `npm run build`, `git diff --check`, and the planned impeccable detector pass.
- No Git repository or application scaffold existed before this setup; the scaffold was committed as `e7f0400` and the integrated implementation is ready for the final commit.

## Unknown — open

- Native behavior on Windows/Linux is unverified; the documented fallbacks are present but need those hosts for direct proof.
- Installer packaging, signing, and deployment remain out of scope for v1.

## Watchlist

- Electron and electron-vite versions are resolved from the registry at Slice A and should not drift while worker paths are active.
- Compact-width dialog behavior has not been separately exercised; the full-prompt dialog is verified at the current native window size.
- Preference write failures must remain visibly session-only; never present them as durable saves.

## Next

1. Commit the integrated implementation after this acceptance pass.
2. If v1 continues, run native checks on Windows/Linux and package only when installer distribution is in scope.
