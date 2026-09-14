# Teleprompter asset usage map

Status: read-only local audit · 2026-09-14

This map covers the existing v2 industrial identity packet only. It does not change renderer code, styles, source artwork, the manifest, provenance, or curation records. The four v2 files are family identity assets; none is a record-specific practical example.

## Audit method

- Runtime derivatives are 512×512 PNGs. Masters are 1024×1024 PNGs.
- Visible bounds below use runtime pixels with alpha `> 8/255`. This excludes the 1–8/255 antialias fringe that can otherwise make a transparent object appear to touch the canvas edge. The fringe is recorded as a defect/measurement caveat where present.
- Display footprints assume a square source canvas rendered with `object-fit: contain` inside the prescribed CSS box. Values are approximate CSS pixels after scaling; they are layout guidance, not a new derivative.
- Native behavior was not run by this worker. The final section gives the exact Electron checks for the UI/native owners.

## Manifest and provenance identity

| Asset | Manifest identity | Provenance identity | Runtime path | Master path | Manifest state |
|---|---|---|---|---|---|
| Teleprompter icon v2 | `identity.teleprompter-icon.v2` · `app-icon` · `hasAlpha:false` · `fit:contain` | `generation.identity.teleprompter-icon.v2` | `src/renderer/src/assets/teleprompter/runtime/teleprompter-icon-v2.png` | `src/renderer/src/assets/teleprompter/masters/teleprompter-icon-v2.png` | `approved`; handoff says accepted/integrated |
| Optics group v2 | `identity.group-optics.v2` · `group-object` · `hasAlpha:true` · `fit:contain` | `generation.identity.group-optics.v2` | `src/renderer/src/assets/teleprompter/runtime/group-optics-v2.png` | `src/renderer/src/assets/teleprompter/masters/group-optics-v2.png` | `approved`; handoff says accepted/integrated |
| Stage group v2 | `identity.group-stage.v2` · `group-object` · `hasAlpha:true` · `fit:contain` | `generation.identity.group-stage.v2` | `src/renderer/src/assets/teleprompter/runtime/group-stage-v2.png` | `src/renderer/src/assets/teleprompter/masters/group-stage-v2.png` | `approved`; handoff says accepted/integrated |
| Finish group v2 | `identity.group-finish.v2` · `group-object` · `hasAlpha:true` · `fit:contain` | `generation.identity.group-finish.v2` | `src/renderer/src/assets/teleprompter/runtime/group-finish-v2.png` | `src/renderer/src/assets/teleprompter/masters/group-finish-v2.png` | `approved`; handoff says accepted/integrated |

All v2 manifest entries have `recordIds: []` and `focalPoint: [0.5, 0.5]`. The v2 provenance rows still say `review: "pending"` and include `lead integration not yet performed`, which conflicts with the approved manifest and current artwork handoff. That is a metadata reconciliation item for the lead; this audit does not edit it.

## Contained display guidance

The visual contract calls for a 72×56 art box in the wide main composer, a 40×40 box in the popup overview, and 48×48 contained objects in the 560–759px compact layout. For the 352–559px summary, use a 40×40 art slot inside the 52px-high summary rather than turning the whole summary into an image well.

| Runtime asset | Wide main 72×56: visible footprint | Compact 48×48: visible footprint | Popup 40×40: visible footprint | Integration reading |
|---|---:|---:|---:|---|
| Optics | 44.1×44.2px, box-relative `(14.0, 5.9)–(58.1, 50.1)` | 37.8×37.9px | 31.5×31.6px | Near-square and legible at every prescribed size |
| Stage | 51.4×30.1px, box-relative `(10.8, 13.3)–(62.2, 43.4)` | 44.1×25.8px | 36.7×21.5px | Low horizontal object; preserve its full rails and corners |
| Finish | 49.5×34.2px, box-relative `(11.3, 10.9)–(60.8, 45.2)` | 42.5×29.3px | 35.4×24.5px | Low circular object; keep the separate label region below/alongside it |

Use a real independent art region. Do not place the image behind the option label, let a parent crop the silhouette, add CSS padding to compensate for the source canvas, or wrap the object in another bordered/radial square. The source alpha is already the object boundary. Keep the object fully visible and let the capsule or surface provide the background.

## Asset records

### Teleprompter icon v2

- Source: `runtime/teleprompter-icon-v2.png`; master: `masters/teleprompter-icon-v2.png`.
- Raster: runtime 512×512 RGB PNG; master 1024×1024 RGB PNG. The full canvas is opaque, so there is no alpha bounding box or transparent canvas padding.
- Background treatment: the charcoal background is baked into the asset. Use it only where a bounded app-identity mark is expected. Do not put it directly on a translucent group capsule or use it as a transparent group object.
- Semantic use: app identity/brand decoration. It is not an Optics, Stage, or Finish selector asset and cannot represent a practical example.
- Defects: none observed in the local raster. The opaque background is the constraint: placing it on a surface without a deliberate icon container will create a visible rectangular matte.
- Suggested display: a small square identity mark, normally 24–32px; preserve `contain` and do not crop the device or its charcoal field.

### Optics group v2

- Source: `runtime/group-optics-v2.png`; master: `masters/group-optics-v2.png`.
- Runtime visible alpha bounds at `alpha > 8/255`: `x=55..457`, `y=54..457`, size `403×404px`; canvas padding is left 55, right 54, top 54, bottom 54px. Master bounds at the same threshold: `x=111..915`, `y=109..915`, size `805×807px`; padding left 111, right 108, top 109, bottom 108px.
- Low-alpha caveat: `alpha > 0` reaches `x=0..458`, `y=54..458` in the runtime derivative because of a very soft fringe. Do not use the nonzero-alpha edge for layout measurement.
- Background treatment: RGBA with transparent canvas and a dark-glass/metal object. Local review shows no painted checkerboard or black matte. Place directly on the Teleprompter dark surface with no extra well, `mix-blend-mode`, or whole-control opacity.
- Semantic use: Optics family decoration for the group trigger, compact overview, opened group header, or a larger decorative focus state. It may identify the Optics family; it does not depict focal length, depth of field, or viewpoint values.
- Defects: no malformed raster or visible matte found. The near-square object is safe at 72×56, 48×48, and 40×40 when contained. Reusing it as every camera/viewpoint option image is a semantic defect, not an asset defect.

### Stage group v2

- Source: `runtime/group-stage-v2.png`; master: `masters/group-stage-v2.png`.
- Runtime visible alpha bounds at `alpha > 8/255`: `x=26..495`, `y=122..396`, size `470×275px`; canvas padding is left 26, right 16, top 122, bottom 115px. Master bounds at the same threshold: `x=53..990`, `y=244..794`, size `938×551px`; padding left 53, right 33, top 244, bottom 229px.
- Low-alpha caveat: `alpha > 0` reaches `x=24..497`, `y=21..481` in the runtime derivative. The thin fringe is not the visible rail/plane boundary and must not drive a crop.
- Background treatment: RGBA with transparent canvas and a shallow brushed-metal frame/frosted plane. Local light/dark review shows no checkerboard or black matte. Use the same dark surface treatment as the other group objects; do not add a card behind it.
- Semantic use: Stage family decoration for the group trigger, compact overview, opened group header, or family focus. It does not represent individual composition or lighting options.
- Defects: the object is intentionally low and wide, with substantial transparent top/bottom padding. At 40×40 its visible silhouette is only about 36.7×21.5px, so it must remain in a separate art region and must not be vertically cropped to make it look taller. Reusing it as every Stage option image is a semantic defect.

### Finish group v2

- Source: `runtime/group-finish-v2.png`; master: `masters/group-finish-v2.png`.
- Runtime visible alpha bounds at `alpha > 8/255`: `x=30..482`, `y=100..412`, size `453×313px`; canvas padding is left 30, right 29, top 100, bottom 99px. Master bounds at the same threshold: `x=59..964`, `y=199..825`, size `906×627px`; padding left 59, right 59, top 199, bottom 198px.
- Low-alpha caveat: `alpha > 0` reaches `x=0..485`, `y=21..511` in the runtime derivative. The edge pixels outside the visible silhouette are a very soft fringe; use the thresholded bounds above.
- Background treatment: RGBA with transparent canvas and a low brushed-metal puck/dark-glass surface. Local light/dark review shows no painted checkerboard or black matte. Let the Teleprompter surface show through; do not add a radial well or blend mode.
- Semantic use: Finish family decoration for the group trigger, compact overview, opened group header, or family focus. It does not represent individual look or mood choices.
- Defects: the object is intentionally low-profile and carries more vertical transparent padding than its visible height suggests. At 40×40 its visible silhouette is about 35.4×24.5px. Keep the label outside the art region; never overlay text on the puck or crop its rim. Reusing it for every Finish option is a semantic defect.

## Current source usage and required correction

The manifest is not imported by the renderer. Runtime identity currently comes from direct v2 PNG imports:

| Current source | Current use | Audit result |
|---|---|---|
| `src/renderer/src/ui/CueSurface.tsx:5-7,30-52` | Imports all three group objects and maps them to Optics/Stage/Finish. | Correct family mapping for group triggers. The fallback helpers also assign group art to choices without record-specific artwork. |
| `src/renderer/src/ui/CueSurface.tsx:292` | `ParameterTile` renders a group object inside `.tp-tile-object`. | Current reset CSS uses a 72×72 bordered/radial image well. Replace with the prescribed 72×56 independent art box; keep the outer control as the only boundary. |
| `src/renderer/src/ui/CueSurface.tsx:326,349` | Preset/recipe cards and every axis option render a group object. | Do not use family art as a focal-length/depth/viewpoint/composition/lighting/look/mood thumbnail. Use the short label plus a neutral vector mark or an accepted record-specific asset. |
| `src/renderer/src/ui/LibrarySurface.tsx:4-32,66,80` | Chooses group art from the first record field/allowed field for cards and detail. | Valid only as an explicitly labelled family fallback. It is not an accepted practical cover or record example; current `recordIds: []` confirms that. |
| `src/renderer/src/ui/TokensSurface.tsx:4-23,63` | Renders group art in every token row, with Finish as the fallback for unmapped fields. | Use as a small family mark only, not as an example image. The current 52×52 mark is larger than the compact reference-desk mark and should not imply record-specific imagery. |
| `src/renderer/src/styles/global.css:586-589,615-628,636-640,658-659` | Defines the current square tile, full-card art, and absolute picker art behavior. | The picker image layer can sit behind labels and be clipped by `.tp-slot`; that is the observed CSS crop/semantic integration defect, not a malformed v2 PNG. |

## UI/native checks for the owners

These checks were not executed by this read-only asset worker. They are the bounded checks needed after the UI and desktop lanes integrate the map.

1. In the native Electron main Cue at the wide layout, verify all three group objects in independent 72×56 art boxes. Capture Optics, Stage, and Finish with their full visible silhouette, including the Stage rails and Finish rim. There must be one control boundary, no inner square/radial well, and no label over the pixels.
2. In the native compact layouts, verify 48×48 objects at 560–759px and a 40×40 object slot inside the 52px summary at 352–559px. Confirm Stage and Finish remain legible without vertical crop or forced square-card geometry. Verify the 40×40 popup overview separately.
3. Open the native Optics picker and inspect Camera, Viewpoint, and any depth/focus axis. Family art may appear in the group overview/header, but it must not repeat as the visual depiction of each option. Confirm the option label region is independent, the selected outline is visible, and the search control has one focus ring.
4. Inspect native Library and Tokens. Family art may serve as an honest family fallback/mark only. No card or inspector may describe these assets as a practical example, available image, comparison pair, or generated output.
5. Repeat the above with reduced motion and at the narrowest supported width. A browser preview, build output, or still contact sheet can confirm file presence and local composition only; it cannot close native bounds, focus, clipping, or popup behavior.

## Practical-art boundary

The v2 files came through the built-in generation route with no selectable or returned model ID. They make no exact-model claim. No practical image, comparison pair, preset example, or edit pair is evidenced here. Keep the six accepted practical requests blocked on exact route verification, and keep proposed Batch 002 records out of runtime use.
