# Teleprompter

Teleprompter is a local Electron utility for finding and copying image prompts. It turns the existing `teleprompter` skill into two usable surfaces:

- Gallery — source-backed prompt recipes with previews, favorites, and full-prompt copy.
- Cheatsheet — searchable shorthand commands, production direction, and preset components.

The implementation plan lives in [`03 Docs/Implementation Plan/00-Start-Here.md`](03%20Docs/Implementation%20Plan/00-Start-Here.md). The original skill under `teleprompter/` is preserved as the content source.

## Development

```sh
npm install
npm run dev
```

Focused checks:

```sh
npm run typecheck
npm run test:logic
npm run build
```
