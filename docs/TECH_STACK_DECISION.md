# Tech Stack Decision

Research date: 2026-08-26

## Decision

Use:

```text
React + TypeScript + Vite + CesiumJS
```

as the primary stack for the PLATEAU CityHack 2026 MVP.

Data should be preprocessed into static browser-friendly assets:

```text
PLATEAU CityGML -> 3D Tiles for buildings
DEM/elevation -> Cesium terrain or sampled elevation grid
roads/facilities/networks -> GeoJSON/PMTiles/MVT-style static assets
attributes/scores/provenance -> JSON or compact side tables
```

Do not use Three.js/R3F as the main city renderer for the MVP.

## Why This Stack

### 1. PLATEAU Fit

PLATEAU official tools and tutorials repeatedly point toward Cesium/3D Tiles for browser 3D city visualization. `evacuation-simulation-tools`, `plateau-streaming-tutorial`, `city-viewer-demo`, and `plateau-bridge` all support the same conclusion: Cesium is the shortest reliable path from PLATEAU 3D Tiles to an interactive browser scene.

### 2. GIS Basics Are Built In

Cesium handles geospatial camera, globe coordinates, terrain, imagery, 3D Tiles, picking, and layer management. With Three.js/R3F, we would need to build or integrate those layers ourselves.

### 3. Better Match For Hackathon Risk

The main risks are data size, geospatial correctness, and rendering performance. Cesium reduces all three compared with a custom Three.js city scene.

### 4. Enough Interaction For MVP

Cesium can support:

- building picking
- facility markers
- click-to-place
- polylines/network lines
- style changes on tide/scenario update
- flood overlays
- camera presets

The network glow may be simpler than a custom Three.js shader at first, but it is sufficient for the MVP and safer for performance.

### 5. Static Deployment Is Still Possible

With Vite and static data assets, the app can target GitHub Pages or similar static hosting. No backend or secrets are required for the initial MVP.

## Accepted Tradeoffs

- Custom visual effects are less flexible than Three.js.
- Some Cesium primitives/materials are imperative and need careful lifecycle management.
- If future UX requires a rich game-like editor, Three.js/deck.gl overlays may be reconsidered.
- Large PLATEAU data still requires preprocessing and data-size control.

## Rejected Alternatives

### Three.js

Rejected as the primary renderer.

Reason:

- It does not natively solve PLATEAU 3D Tiles, terrain, GIS coordinates, or feature metadata.
- The previous prototype already hit the failure mode of too many independent meshes.
- `plateau-bridge` shows Three.js can work only with `3d-tiles-renderer`, custom shaders, BVH raycasting, and explicit tile cache disposal. That is too much baseline complexity for the MVP.

Use later only for small isolated visual modules or if Cesium cannot deliver a required effect.

### React Three Fiber

Rejected as the primary renderer.

Reason:

- It improves React composition for Three.js, but not PLATEAU/GIS/data streaming.
- It can encourage component-per-object patterns, which are dangerous for city-scale rendering.
- Tile lifecycle and large geometry management still require low-level imperative control.

### MapLibre GL JS

Rejected as the only renderer.

Reason:

- Excellent for 2D/2.5D vector tiles, PMTiles, and flood overlays.
- Not the best match for true PLATEAU 3D Tiles plus terrain plus 3D city interaction.

Keep as a future 2D overview/analysis mode candidate.

### deck.gl

Rejected as the primary renderer.

Reason:

- Strong for GPU line/arc/heatmap/network visualization.
- PLATEAU 3D Tiles feature picking and metadata are more involved than Cesium.
- It works best as an analytical overlay engine, not as the simplest PLATEAU city viewer.

Keep as a future overlay candidate if network visualization exceeds Cesium's line capabilities.

### MapLibre + deck.gl

Rejected for MVP primary stack.

Reason:

- Good for a planning dashboard.
- We need a 3D PLATEAU-first simulator.
- Combining MapLibre/deck.gl would still leave true 3D PLATEAU/terrain gaps.

### MapLibre + Cesium Dual Viewer

Rejected for MVP initial implementation.

Reason:

- `city-viewer-demo` proves this is useful, but running two map engines increases state synchronization, memory, and testing cost.
- The first PoC should validate one engine before introducing a second.

Potential later use:

- Add MapLibre only if a 2D footprint/PMTiles view becomes essential.

## Implementation Consequences

### Project Setup Later

When implementation is approved, initialize a local frontend only after confirming:

- repository state
- package manager choice
- dependency version strategy
- GitHub Pages or other static deployment target

Likely dependencies:

- `react`
- `react-dom`
- `typescript`
- `vite`
- `cesium`
- `vite-plugin-cesium`
- UI/icon dependencies only if needed

Do not use `latest` version ranges.

### Rendering Boundary

React owns:

- panels
- mode controls
- tide/scenario state
- score cards
- candidate evaluation

Cesium owns:

- viewer
- terrain
- 3D Tiles
- data sources
- primitives/entities
- picking
- camera

Application code bridges them through explicit methods, not by re-creating Cesium objects during normal React renders.

### Data Boundary

Runtime should load:

- manifest
- PLATEAU 3D Tiles URL
- elevation samples
- roads/facilities
- network seed data

Runtime should not load:

- raw CityGML
- raw large DEM
- large unbounded hazard polygons
- generated simulation archives

## First PoC Recommendation

Next phase should build the smallest possible proof:

1. React/Vite app shell.
2. Cesium viewer with no Ion token dependency.
3. One PLATEAU 3D Tiles layer or a small placeholder tileset if real Maizuru tiles are not yet prepared.
4. Static facility JSON with provenance labels.
5. Tide slider that updates a lightweight flood overlay from a small elevation grid.
6. One score category, e.g. medical.
7. One selected network layer rendered as capped Cesium polylines.
8. Click-to-place one virtual future facility and show before/after score.

This PoC proves the core causal loop before investing in full data preparation.
