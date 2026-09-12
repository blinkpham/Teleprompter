# Decisions

- 2026-09-12: Start from the plan's Slice A and keep the original `image-director/` skill untouched.
- 2026-09-12: Use exact pinned registry versions resolved at scaffold time; dependency drift is out of scope while implementation lanes are active.
- 2026-09-12: Slice A native proof used Electron 44.3.0 with the system clipboard; browser-only copy is not used as a fallback.
