# Navara Technical Spike Handoff

## Status

Implementation, local dependency install, typecheck, build, direct CORS check, and sampled B3DM metadata inspection completed. Normal Chrome visual/runtime verification is blocked until the ChatGPT browser extension connection is available.

## Isolation

- Existing `src/`, `public/`, Vite config, Cesium dependencies, and `docs/AI_HANDOFF.md` remain unchanged.
- All spike files live under `experiments/navara-spike/`.

## Packages

- Node: 22.23.2 (unchanged)
- `@navaramap/three`: 0.0.8
- `@navaramap/three-default-plugin`: 0.0.8
- `three`: 0.185.1
- `postprocessing`: 6.39.3
- Consumer packages declare no Node `engines` restriction in npm metadata.

## Intended Checks

Real Maizuru PLATEAU B3DM loading, camera, picking, real Batch Table attributes, public-API per-feature styling, one custom smooth line, GSI DEM API feasibility, height alignment, proxy need, and browser performance.

## CORS Check

- The official Maizuru `tileset.json` and sampled `data426.b3dm` response both returned `Access-Control-Allow-Origin: *` on 2026-08-27.
- The spike therefore uses the official asset URL directly and has no Vite proxy. Normal Chrome remains the final CORS/runtime check.

## Real Maizuru Data Check

- `tileset.json`: HTTP 200, 3D Tiles 1.0, 427 B3DM content URIs.
- Sampled `data426.b3dm`: valid `b3dm` v1, 91,192 bytes, `BATCH_LENGTH: 20`.
- Real Batch Table keys include `gml_id`, `gml:name`, `bldg:usage`, and binary `bldg:measuredHeight`.
- Sample values include `bldg:usage = 工場` and measured heights such as 21.68 m. No mock attributes are used.

## Verification

- Node 22.23.2 local install: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS
- Production output: main JS 9.10 MB / gzip 2.90 MB; Navara runtime/worker/API WASM about 8.29 MB uncompressed in total.
- npm reported one high-severity vulnerability in the installed tree. No automatic audit fix or dependency upgrade was performed.
- Normal Chrome: BLOCKED — browser extension connection unavailable, so rendering, picking, styling, height alignment, FPS, heap, responsiveness, and console remain unverified.

## Technical Debt Found

- `@navaramap/three` 0.0.8 implements public `ThreeView.dispose()` in the published runtime source, but omits it from the generated `dist/index.d.ts`. The spike uses a narrow intersection type at cleanup rather than patching the dependency.
