# Curator Batch 0 — Lead acceptance

Date: 2026-09-13
Batch: `2026-09-13-001`
Base: `legacy-5e21875`

## Decision

Accept the batch for import planning with a deliberately limited scope:

- 14 V2 records are accepted: 9 atoms, 1 preset, and 4 edit recipes.
- The 119-row legacy inventory and migration map are accepted as evidence.
- 101 legacy rows remain `reference-only`; they are not silently promoted into the shipped library.
- Six practical AssetRequests are accepted as illustration briefs, not as permission to claim generated or approved images.
- The batch remains immutable evidence. Later coverage and any revision use a new batch.

## Local impact audit

The current v1 preference file contains one favorite, `surgical-edit`. It maps to `edit.local.surgical-correction` with the original meaning preserved. No v1 draft store was present, so there are no draft IDs to migrate from the current application state. Future Cue drafts must use the shared revision and migration validators before importing additional records.

## Open decisions

Camera close-wide pairs, social-versus-tight composition, hard-flash versus on-camera flash, commercial-versus-campaign finish, render/output terms, and `route-style` versus `route-tone` remain open and are not represented as accepted V2 atoms. The next recommended curation batch is camera distance and focal-perspective comparison.

## Evidence

- `03 Docs/Library Curation/batches/2026-09-13-001/Review.md`
- `03 Docs/Library Curation/batches/2026-09-13-001/legacy-map.json`
- `03 Docs/Library Curation/batches/2026-09-13-001/asset-requests.jsonl`
- `/Users/blinblon/Library/Application Support/image-director/preferences.json`
