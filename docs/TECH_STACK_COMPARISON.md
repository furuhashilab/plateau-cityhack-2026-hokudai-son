# Tech Stack Comparison

Research date: 2026-08-26

Evaluation target: a lightweight web app for Maizuru where users view PLATEAU 3D city context, inspect low ground, change arbitrary tide level, see simplified inundation, inspect urban-function network degradation, place future facilities, and compare before/after scores.

Scores: 1 poor, 3 usable with caveats, 5 strong.

| Candidate | PLATEAU | GIS | 3D | Interaction | Performance | Development speed | Network effect | Overall |
| --------- | ------- | --- | -- | ----------- | ----------- | ----------------- | -------------- | ------- |
| CesiumJS | 5 | 5 | 5 | 4 | 4 | 4 | 4 | 5 |
| Three.js | 2 | 2 | 5 | 5 | 2 | 3 | 5 | 3 |
| React Three Fiber | 2 | 2 | 5 | 5 | 2 | 3 | 5 | 3 |
| MapLibre GL JS | 3 | 5 | 3 | 4 | 5 | 5 | 3 | 4 |
| deck.gl | 3 | 4 | 4 | 3 | 4 | 3 | 5 | 4 |
| React + CesiumJS | 5 | 5 | 5 | 4 | 4 | 4 | 4 | 5 |
| MapLibre + deck.gl | 3 | 5 | 4 | 4 | 5 | 3 | 5 | 4 |
| MapLibre + Cesium dual viewer | 5 | 5 | 5 | 4 | 3 | 2 | 4 | 3 |
| Three.js + 3d-tiles-renderer | 4 | 3 | 5 | 5 | 3 | 2 | 5 | 3 |

## CesiumJS

### Strengths

- Natural fit for PLATEAU 3D Tiles, terrain, imagery, camera, geospatial coordinates, and feature picking.
- Proven in PLATEAU official tooling and `city-viewer-demo`.
- Can run as a static site when assets are static and no secrets are embedded.
- Entity/Primitive APIs are adequate for facilities, polylines, water planes, and labels.
- Handles globe-scale coordinate systems so the app does not need to reinvent projection logic.

### Weaknesses

- Styling and custom visual effects are less flexible than raw Three.js.
- React integration needs care. Resium is convenient but can mix React state and Cesium object lifecycle too tightly.
- Some advanced appearance work may require lower-level Cesium Primitive APIs.

### Fit

Best primary renderer for the MVP because the hardest part is not custom visuals; it is reliable, performant PLATEAU/GIS rendering.

## Three.js

### Strengths

- Maximum freedom for game-like placement, glow lines, shaders, particles, water surfaces, and custom UI effects.
- Well suited to small, controlled scenes.
- Facility placement mechanics and network effects are straightforward.

### Weaknesses

- Raw Three.js does not solve geospatial tiling, terrain providers, 3D Tiles metadata, globe coordinates, or PLATEAU integration.
- Previous prototype risk: many independent Mesh objects become too heavy.
- To handle PLATEAU well, it needs extra systems such as `3d-tiles-renderer`, projection handling, BVH raycast acceleration, tile cache cleanup, and custom shader/material management.

### Fit

Useful for isolated visual experiments, but risky as the main city renderer for a short PLATEAU hackathon.

## React Three Fiber

### Strengths

- Makes custom Three.js scenes more declarative in React.
- Good ecosystem for interactive 3D UI, controls, and composition.

### Weaknesses

- It does not remove the GIS/3D Tiles burden.
- React component-per-building or component-per-edge patterns are dangerous for city-scale data.
- Lower-level tile lifecycle, shader, and cache management may fight React abstractions.

### Fit

Not recommended as the primary PLATEAU renderer. Could be used later for a small embedded 3D explanatory widget, not for full Maizuru.

## MapLibre GL JS

### Strengths

- Excellent for 2D GIS, vector tiles, PMTiles, raster DEM, fill layers, line layers, heatmaps, and fill-extrusion buildings.
- Fast static deployment with PMTiles.
- Simple picking and layer styling.
- `flood-watch` demonstrates hazard layer toggles, planning tools, and analytics UX.

### Weaknesses

- 3D is 2.5D. True PLATEAU 3D Tiles and detailed 3D city objects are not as natural.
- Terrain and 3D building integration is less expressive than Cesium for this use case.
- Network glow in 3D can be approximated, but it is more map-layer-like than city-scene-like.

### Fit

Very strong for a 2D/2.5D fallback or attribute/footprint mode. Not the best single renderer for a 3D PLATEAU-first product.

## deck.gl

### Strengths

- Strong GPU rendering for arcs, lines, heatmaps, point clouds, rasters, and large vector layers.
- Works well with MapLibre through `MapboxOverlay`.
- Good fit for network visualization and analytical overlays.

### Weaknesses

- PLATEAU 3D Tiles feature picking can require extra work compared with Cesium.
- Terrain and globe-style city navigation are less native.
- Combining deck.gl, MapLibre, loaders.gl, and React increases integration complexity.

### Fit

Strong analytical overlay engine, but not the best primary stack when PLATEAU 3D Tiles and picking are first-class requirements.

## Hybrid: React + CesiumJS

### Strengths

- React handles UI, panels, score cards, placement toolbar, and state.
- Cesium handles PLATEAU 3D Tiles, terrain, imagery, picking, entities, and camera.
- Keeps one WebGL engine in the MVP.
- Can be deployed statically with Vite/GitHub Pages if data assets are static.

### Weaknesses

- Need a disciplined wrapper boundary so React state changes do not recreate heavy Cesium data sources.
- Custom visual effects may require Cesium primitives rather than simple React components.

### Fit

Recommended architecture for this project.

## Hybrid: MapLibre + deck.gl

### Strengths

- Excellent for static tile delivery, PMTiles, flood polygons, scoring dashboards, heatmaps, and network arcs.
- Likely the best choice if the product were mainly 2D planning.

### Weaknesses

- PLATEAU 3D city and terrain experience becomes less direct.
- Feature-level PLATEAU building picking and metadata handling are more complex than Cesium.

### Fit

Good alternative if 3D PLATEAU is downgraded to 2.5D. Not recommended for the current 3D-first requirement.

## Hybrid: MapLibre + Cesium Dual Viewer

### Strengths

- Mirrors `city-viewer-demo`: use Cesium for 3D Tiles and MapLibre for MVT/PMTiles.
- Very strong for research/demo comparisons and attribute workflows.

### Weaknesses

- Two map engines mean duplicated camera state, duplicated WebGL memory, extra UX complexity, and more testing.
- Harder for a three-person short-term build.

### Fit

Good later enhancement. Avoid in MVP unless there is a clear need for 2D mode.

## Hybrid: Three.js + 3d-tiles-renderer

### Strengths

- Preserves Three.js visual freedom while adding 3D Tiles streaming.
- `plateau-bridge` shows workable patterns with shader coloring, feature IDs, BVH picking, and tile disposal.

### Weaknesses

- Requires expert-level management of geospatial transforms, feature metadata, picking, and memory.
- Easy to reintroduce the previous performance failure if objects are not strictly tile/batch based.

### Fit

Technically viable but too complex for the primary MVP path.

## Decision Matrix Interpretation

Use `React + TypeScript + CesiumJS` as the MVP stack.

Keep MapLibre/PMTiles as a data-format and possible later 2D mode reference, not as a required Phase 1 dependency. Keep deck.gl and Three.js as optional future overlay/visualization tools only after the Cesium MVP is stable.
