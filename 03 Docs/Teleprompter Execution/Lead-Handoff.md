# Teleprompter — lead handoff

Status: Slice 1 shared contract slice complete · 2026-09-13

## Published contract

- `src/shared/teleprompter-types.ts` defines LibraryV2 records, axes, fields, domains, drafts, reference roles, compile results, semantic commands, revision paths, snapshots, library projections, and the Teleprompter bridge.
- `src/shared/teleprompter-validation.ts` validates LibraryV2 cross-record references and taxonomy shape, CueDraft structure and library compatibility, semantic command envelopes, copy requests, and bridge-facing input errors.
- `src/shared/teleprompter.ts` is the barrel import for the new contract surface.
- `src/shared/ui-types.ts` publishes `CueSurfaceProps` for both the main and spotlight renderers. The dispatch and copy functions stay semantic; UI code does not receive raw IPC or filesystem access.

The legacy `catalog-types.ts`, content, renderer, main process, and historical plan files remain unchanged by this slice. The existing v1 app therefore remains the running product until the downstream workers integrate the new surface.

## Dependency handoff

- Cue engine: import the types and validators from `src/shared/teleprompter.ts`; keep the pure adapter/compiler in `src/content/` and `src/engine/`.
- UI/motion: consume `CueSurfaceProps`, `CueSnapshot`, and `LibraryView`; request contract changes through the lead rather than creating field-specific option semantics.
- Desktop: implement `TeleprompterBridge` and validate all IPC payloads before state mutation; main owns revisions, persistence, clipboard, and window identity.
- Illustration and curator: produce manifest/candidate outputs for lead acceptance; neither changes the shared contract directly.

## Decisions

- Practical image-generation work uses GPT Image 2.5 Flare as the requested route. Exact model access still requires execution evidence; generic image generation is not proof.
- No UI dependencies, runtime model connection, network request, native shortcut, popup, or artwork was added in Slice 1.
- The existing `image-director://app` local protocol and v1 catalog remain compatibility source material until an integration slice changes them.

## Focused verification

| Check | Result |
|---|---|
| `npm run test:logic` | 4 files, 11 tests passed |
| `npm run typecheck` | passed for node and web projects |
| `npm run build` | Electron main, preload, and renderer bundles built |
| Runtime contract coverage | valid LibraryV2/draft/command/copy requests accepted; broken references, unknown operations, invalid revision paths, and invalid copy revisions rejected |

## Next integration action

Dispatch the Cue engine, UI/motion, and desktop missions against this published surface, then integrate the first offline Create path and re-run only its affected tests before native acceptance.

