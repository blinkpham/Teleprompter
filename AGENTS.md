# Image Director — Agent Guide

Image Director is an offline Electron utility for finding and copying source-faithful image prompts. The main deliverable is a working desktop app with Gallery and Cheatsheet modes.
Key paths: `AGENTS.md` (project contract) · `MAP.md` (live state) · `MEMORY.md` (memory index) · `03 Docs/Implementation Plan/` (implementation authority)
Updated: 2026-09-12

## Working contract

- Read `MAP.md` before implementation work and update it when a decision or next move changes.
- Preserve `image-director/` and the five plan files as source material. Do not edit them to fit the app.
- The app is offline, local, and read-only: no model connection, image generation, prompt editor, uploads, or runtime network requests.
- Keep native Electron evidence separate from browser-preview evidence. A browser preview never proves native clipboard, preferences, menus, or packaged loading.
- Keep shared contracts in `src/shared/`; do not duplicate catalog semantics in UI or main-process code.
- Prefer the smallest affected dependency cone for validation. Full infrastructure, installers, signing, and deployment are out of scope for v1.
- Preserve unrelated user work. Do not reset, clean, stash, broadly format, or overwrite existing source material.

## Ownership boundaries

- Lead: root configuration, `src/shared/`, renderer orchestration, integration, acceptance.
- Desktop: `src/main/`, `src/preload/`, and preference checks.
- Content/engine: `src/content/`, `src/engine/`, and focused logic checks.
- UI: `src/renderer/src/ui/`, `src/renderer/src/styles/`, and `src/renderer/src/assets/`.

## Verification

Use `npm run typecheck`, `npm run test:logic`, and `npm run build` for focused local checks. Run the actual Electron app for native behavior. Keep the original source and prompts selectable and copy-safe.

## Routing

- Build and integration: `personal-os:os-build`.
- Visual polish when needed: `impeccable`.
- Debugging a reproduced failure: `diagnosing-bugs`.
