# Teleprompter — Agent Guide

## Current planning authority

The user renamed the product Teleprompter and requested a replacement plan for dark-only UI, Cue Create/Edit, a cursor-positioned shortcut popup, generated artwork, and library curation. Read `03 Docs/Teleprompter Plan/00-Start-Here.md` before work on that upgrade; its contracts supersede conflicting v1 scope below. The upgrade is now in implementation: Slice 1 shared contracts are published, while Cue, UI, desktop, artwork, and curation remain bounded worker missions. Keep original sources and the five historical implementation plans intact.

## Current architecture decision — 2026-09-14

The user has explicitly moved the new implementation to a native macOS host, not Electron. Liquid Glass support is a first-class requirement for the native Cue surface. Treat Electron as retained compatibility evidence and a migration seam only until native build/runtime evidence is accepted; do not extend Electron as the final host or delete it before the native seam is proven.

## Implemented v1 baseline

The retained v1 baseline is an offline Electron utility for finding and copying source-faithful image prompts. The new deliverable is a native macOS Teleprompter surface that preserves the offline store/compiler and supports Cue Create/Edit.
Key paths: `AGENTS.md` (project contract) · `MAP.md` (live state) · `03 Docs/Teleprompter Plan/` (current upgrade plan) · `03 Docs/Implementation Plan/` (historical v1 plan)
Updated: 2026-09-13

## Working contract

- Read `MAP.md` before implementation work and update it when a decision or next move changes.
- Preserve `teleprompter/` and the five plan files as source material. Do not edit them to fit the app.
- The implemented v1 app is offline, local, and read-only. The Teleprompter plan adds a local prompt composer; runtime model connections, image generation, uploads, and network requests remain outside the app. Asset generation and research belong to their separately dispatched worker missions.
- Slice 1 publishes the Teleprompter library, draft, command, snapshot, bridge, and renderer-surface contracts in `src/shared/teleprompter.ts`; downstream workers consume these types and validators instead of duplicating semantics.
- Keep native macOS evidence, retained Electron evidence, and browser-preview evidence separate. A browser preview or Electron run never proves Liquid Glass, native clipboard, preferences, menus, or packaged loading for the native target.
- Keep shared contracts in `src/shared/`; do not duplicate catalog semantics in UI or main-process code.
- Prefer the smallest affected dependency cone for validation. Full infrastructure, installers, signing, and deployment are out of scope for v1.
- Preserve unrelated user work. Do not reset, clean, stash, broadly format, or overwrite existing source material.

## Ownership boundaries

- Lead: root configuration, `src/shared/`, renderer orchestration, integration, acceptance.
- Desktop: `src/main/`, `src/preload/`, and preference checks.
- Content/engine: `src/content/`, `src/engine/`, and focused logic checks.
- UI: `src/renderer/src/ui/`, `src/renderer/src/styles/`, and `src/renderer/src/assets/`.

## Verification

Use `npm run typecheck`, `npm run test:logic`, and `npm run build` for the retained compatibility layer. Run the actual native macOS target for Liquid Glass, focus, bounds, clipboard, preferences, menus, and packaged-loading claims. Keep the original source and prompts selectable and copy-safe.

## Routing

- Build and integration: `personal-os:os-build`.
- Visual polish when needed: `impeccable`.
- Debugging a reproduced failure: `diagnosing-bugs`.
