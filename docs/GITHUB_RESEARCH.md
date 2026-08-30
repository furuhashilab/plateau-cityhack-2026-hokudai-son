# GitHub Research

Research date: 2026-08-26

Scope: OSS implementation research for a new PLATEAU CityHack 2026 web app. This document studies source structure, dependencies, rendering choices, data loading, performance patterns, and licensing. Existing project idea text in this workspace is not used as a requirement source.

## Summary

The strongest pattern for this project is not a pure Three.js scene. It is a GIS-first 3D application that streams preprocessed geospatial assets:

- PLATEAU buildings as 3D Tiles.
- Ground/elevation and simplified flood state as tiled or sampled data.
- Facilities, roads, and scenario placements as small typed vector datasets.
- Network visualization generated only for the selected city-function score.
- Clear provenance metadata beside every dataset.

The most directly useful repositories are:

1. `0xkaz/city-viewer-demo` for lightweight PLATEAU 3D Tiles/MVT/PMTiles browser patterns.
2. `pixelx-jp/plateau-bridge` for performance-aware PLATEAU preprocessing, provenance, and Cesium/deck.gl/Three comparison.
3. `Project-PLATEAU/PLATEAU-GIS-Converter` for CityGML-to-web asset conversion concepts.
4. `Project-PLATEAU/evacuation-simulation-tools` for official Cesium/Resium + 3D flood/evacuation visualization.
5. `bettergovph/flood-watch` for scenario UI, infrastructure placement UX, analytics cards, and PMTiles hazard layers.

## 1. Project-PLATEAU/evacuation-simulation-tools

- Repository: `Project-PLATEAU/evacuation-simulation-tools`
- URL: https://github.com/Project-PLATEAU/evacuation-simulation-tools
- Purpose: Official PLATEAU water-disaster evacuation simulation tool.
- License: MIT.

### Tech Stack

- `viewer/kumamoto3d` is a Create React App style React app.
- Dependencies include `react`, `react-dom`, `react-hook-form`, MUI, `cesium`, `resium`, `craco-cesium`, `chart.js`, `axios`.
- Build scripts use `craco start`, `craco build`, `craco test`.

### Rendering Architecture

- CesiumJS is wrapped by Resium React components.
- Main viewer uses `Viewer`, `Globe`, `ImageryLayer`, `CzmlDataSource`, `GeoJsonDataSource`, and `Cesium3DTileset`.
- Terrain is configured through `CesiumTerrainProvider`; imagery is a URL template tile source.
- Building model is loaded as `/bldg/tileset.json` with `Cesium3DTileset`.
- Flood, moving cars, walking evacuees, traffic lights, shelters, and mini-map data are loaded as CZML/GeoJSON data sources.
- A separate small Cesium viewer is used as a mini-map.

### Data Architecture

- Heavy simulation outputs are precomputed under `public/sim_result/.../*.czml`.
- Flood data appears as scenario/time-controlled CZML and/or tiles under `public/flood/...`.
- PLATEAU buildings are preprocessed to 3D Tiles.
- UI scenario state chooses paths such as `/sim_result/{caseName}/car_min.czml` and `/flood/{scenario}/time_control.czml`.

### Useful Implementation

- Use Cesium time controls and CZML only when temporal animation is central.
- 3D Tiles are the right asset format for PLATEAU building massing.
- Layer toggles for shelters, flood, terrain depth testing, and lighting map well to our MVP.
- Cesium camera bounds and maximum zoom distance are useful for demo stability.
- Separate data layers should be toggled through central scenario state.

### What NOT To Copy

- Do not embed Cesium Ion tokens or any API key in source.
- Do not copy the large static simulation result structure into the MVP.
- Do not put all Cesium, UI, form, data path, and scenario logic into one large component.
- Do not rely on precomputed CZML for every user interaction; our tide slider and placement loop must update interactively.

### Performance Characteristics

- Good: Cesium streams 3D Tiles and CZML efficiently compared with thousands of independent meshes.
- Risk: CZML datasets in the repo are very large, and loading multiple animated sources can be too heavy for general laptop demos.
- Risk: React/Resium components can re-render awkwardly if Cesium object creation is not isolated.

### Relevance

High. It proves official PLATEAU + Cesium + flood/evacuation visualization is practical. For our project, use the Cesium/3D Tiles/layer-toggle lessons, not the heavy precomputed evacuation data pipeline.

## 2. Project-PLATEAU/PLATEAU-GIS-Converter

- Repository: `Project-PLATEAU/PLATEAU-GIS-Converter`
- URL: https://github.com/Project-PLATEAU/PLATEAU-GIS-Converter
- Purpose: Convert PLATEAU CityGML into GIS/web-friendly outputs.
- License: MIT.

### Tech Stack

- Rust workspace centered on `nusamai`.
- Desktop app uses SvelteKit, Tauri, TypeScript, Vite, Tailwind, MapLibre.
- Important sinks include 3D Tiles, MVT, PMTiles, glTF, GeoJSON, GeoPackage, and FlatGeobuf-like GIS outputs.

### Rendering Architecture

- This is primarily preprocessing software, not our runtime renderer.
- The Svelte/Tauri app uses MapLibre for preview/UI, but the key value is the converter pipeline.

### Data Architecture

- CityGML is transformed through configurable pipeline stages.
- 3D Tiles sink supports zoom ranges, tiling, texture downsampling, gzip, LOD selection, geometry slicing, and tile writing.
- MVT sink uses lowest LOD, min/max heights, tiled geometry slicing, Hilbert tile IDs, compressed tile output, and dot-notation properties.
- Separate transformers handle projection, flattening, LOD filtering, and geometry merging.

### Useful Implementation

- Convert Maizuru PLATEAU CityGML before runtime. Do not load raw CityGML in the browser.
- Prepare at least two representations:
  - 3D Tiles for visual 3D buildings.
  - MVT/PMTiles/GeoJSON-like attributes for lightweight querying, footprints, and scoring.
- Pick LOD deliberately. MVP should start with the lowest acceptable LOD for broad city structure, then improve selected areas if needed.
- Keep a manifest describing source year, conversion options, coverage, and provenance.

### What NOT To Copy

- Do not pull the whole converter into the web app.
- Do not make the hackathon app depend on a local desktop/Tauri preprocessing tool at runtime.
- Do not introduce Rust/Tauri unless a later preprocessing phase explicitly needs it.

### Performance Characteristics

- Strong performance approach: tile slicing, geometry grouping, LOD filtering, texture limits, and web-native output formats.
- Conversion cost is acceptable outside the web app, but the resulting 3D Tiles can still be large.

### Relevance

Very high for data preparation. It defines how PLATEAU source data should be reduced into browser-scale assets.

## 3. Project-PLATEAU/GeoJSON-DataAPI-for-Building-Volume

- Repository: `Project-PLATEAU/GeoJSON-DataAPI-for-Building-Volume`
- URL: https://github.com/Project-PLATEAU/GeoJSON-DataAPI-for-Building-Volume
- Purpose: Expose PLATEAU-derived building volume/attribute data through GeoJSON API endpoints.
- License: Apache-2.0.

### Tech Stack

- Node.js, Express, PostgreSQL/PostGIS.
- Dependencies include `express`, `pg`, and `body-parser`.
- API endpoints include `/geojson/pick-by-point`, `/geojson/clip-by-rect`, `/geojson/clip-by-rect-with-trim`, `/geojson/clip-by-polygon-with-trim`, and `/elevationTiles`.

### Rendering Architecture

- Not a renderer. It is an API layer for spatial query and attribute delivery.

### Data Architecture

- PostGIS SQL functions return GeoJSON FeatureCollections.
- Request contracts are coordinate/bbox/polygon based.
- `types` array lets callers request specific data categories.
- Separate elevation tile endpoint suggests a clean boundary between terrain data and vector/building data.

### Useful Implementation

- Model spatial selection/query APIs explicitly even if MVP uses static files.
- Separate geometry rendering assets from query/attribute assets.
- Keep building-level IDs stable enough to join visual 3D Tiles, attribute tables, facilities, and scoring.

### What NOT To Copy

- Do not add a backend/PostGIS requirement for the MVP unless static delivery becomes impossible.
- Do not make every score calculation require network round trips.

### Performance Characteristics

- Backend spatial index is appropriate for large, mutable, or multi-city querying.
- For static GitHub Pages, a backend is a deployment complexity risk.

### Relevance

Medium-high. The API shape is useful, but MVP should first use precomputed static indices.

## 4. Project-PLATEAU/PLATEAU-Builder

- Repository: `Project-PLATEAU/PLATEAU-Builder`
- URL: https://github.com/Project-PLATEAU/PLATEAU-Builder
- Purpose: Desktop tool for editing/inspecting PLATEAU data.
- License: MIT.

### Tech Stack

- Java/Gradle/JavaFX desktop application.
- Modules include core, GUI, validation, and city object editing tools.

### Rendering Architecture

- Desktop-oriented 3D feature selection and editing, not a web runtime pattern.

### Data Architecture

- Focuses on CityGML feature hierarchy, attribute editing, geometry editing, filtering, validation, and basemap visualization.

### Useful Implementation

- Selection UX: click a 3D feature, show curated attributes, avoid overwhelming raw CityGML structure.
- Editing UX: separate selection, transform/placement, attribute panel, and validation status.
- Preserve provenance and distinguish edited/scenario objects from source objects.

### What NOT To Copy

- Do not adopt JavaFX/desktop architecture for this browser MVP.
- Do not expose raw CityGML complexity to non-specialist users.

### Performance Characteristics

- Not directly comparable to browser rendering.

### Relevance

Medium. Useful for interaction and attribute-editing concepts, not for web implementation.

## 5. 0xkaz/city-viewer-demo

- Repository: `0xkaz/city-viewer-demo`
- URL: https://github.com/0xkaz/city-viewer-demo
- Purpose: Lightweight browser demo for PLATEAU 3D Tiles and MVT footprints with self-hosted PMTiles basemap.
- License: package metadata says MIT; GitHub license detection was inconclusive. Review `LICENSE` before code reuse.

### Tech Stack

- Minimal static HTML/JavaScript.
- No package dependencies in `package.json`; scripts use Python static server and Node syntax checks.
- Runtime CDN libraries: CesiumJS, MapLibre GL JS, PMTiles.
- Cloudflare/Wrangler config exists for static hosting.

### Rendering Architecture

- Dual-view pattern:
  - Cesium for PLATEAU 3D Tiles.
  - MapLibre for MVT footprints and fill extrusions.
- Viewers are lazily started when their tab is activated.
- Cesium loads `Cesium3DTileset.fromUrl(...)` and uses `scene.pick` plus `Cesium3DTileFeature.getProperty`.
- MapLibre registers `pmtiles://`, resolves `tile.json`, adds vector sources, fill layers, and fill-extrusion layers.

### Data Architecture

- `src/config.js` centralizes layer URLs, credits, notes, basemap settings, and property names.
- MVT height conversion is performed with an expression using a configured height property such as `height_mm`.
- A helper script derives a building-only tileset from a combined tileset, preserving transforms and bounding volume.

### Useful Implementation

- Config-driven data source registry with explicit credits/provenance.
- Lazy initialize heavy map engines.
- Cesium for 3D Tiles, MapLibre for light vector attribute interaction is a proven hybrid.
- Custom metadata panel should show known fields first, and only then unknown raw attributes.
- Avoid Cesium Ion dependency by using tokenless basemaps where possible.

### What NOT To Copy

- Do not adopt dual engines unless the MVP truly needs both. It adds event/state synchronization work.
- Do not rely on CDN libraries for the final hackathon app if reproducible build is required.
- Do not copy license-unclear code until license file is reviewed.

### Performance Characteristics

- Strong: lazy loading, tile-based 3D, vector tiles for attribute layer, no bundler overhead in the demo.
- Strong: one configuration source for layer visibility and attribution.
- Potential issue: running Cesium and MapLibre side by side can double WebGL resource cost if both stay mounted.

### Relevance

Very high. It is the closest browser implementation pattern for lightweight PLATEAU viewing.

## 6. pixelx-jp/plateau-bridge

- Repository: `pixelx-jp/plateau-bridge`
- URL: https://github.com/pixelx-jp/plateau-bridge
- Purpose: Build queryable, hazard-aware PLATEAU building bundles with 3D Tiles, PMTiles, FlatGeobuf, GeoParquet, and browser examples.
- License: MIT.

### Tech Stack

- Python preprocessing package.
- Browser examples use:
  - Cesium + Vite + TypeScript + `vite-plugin-cesium` + Apache Arrow.
  - deck.gl + MapLibre + loaders.gl 3D Tiles + Apache Arrow.
  - Three.js + `3d-tiles-renderer` + `three-mesh-bvh` + Apache Arrow.

### Rendering Architecture

- Cesium example:
  - Loads `tileset.json` directly.
  - Disables default Ion imagery/terrain.
  - Applies `Cesium3DTileStyle` for height-coded coloring.
  - Uses Cesium feature picking for curated popups.
  - Fetches per-tile Arrow side tables through `tile_index.json`.
- deck.gl example:
  - Uses `Tile3DLayer` and `Tiles3DLoader`.
  - Good GPU layer composition with MapLibre.
  - Per-feature picking requires extra work; the example notes feature ID limitations.
- Three.js example:
  - Uses `3d-tiles-renderer` for streaming.
  - Uses shader material over `_FEATURE_ID_0`.
  - Uses `three-mesh-bvh` for raycast acceleration.
  - Disposes BVH and cached style entries when tiles unload.

### Data Architecture

- Produces `buildings.parquet`, `buildings.pmtiles`, `3dtiles/`, `style/` Arrow tables, `tile_index.json`, and `manifest.json`.
- Explicitly separates visual 3D tiles from side-channel attribute/style tables.
- Uses provenance and coverage semantics to avoid claiming unknown hazard data as safe.

### Useful Implementation

- Adopt the side-table concept: visual tiles should be lean; rich attributes and scores can be stored in compact per-tile or global tables.
- Maintain a data manifest with source, coverage, confidence, and known gaps.
- Treat `covered=false` or missing data as unknown, not safe.
- If using Three.js for PLATEAU tiles later, BVH, shader-level coloring, and tile unload cleanup are mandatory.
- Cesium is the least complex path for direct 3D Tiles, terrain, camera, and picking.

### What NOT To Copy

- Do not copy the entire preprocessing pipeline into the MVP.
- Do not adopt deck.gl `Tile3DLayer` for PLATEAU building picking unless we budget time for feature-ID/picking work.
- Do not set renderer pixel ratio directly to full device DPR for heavy city scenes.

### Performance Characteristics

- Strong measured evidence:
  - Tiled 3D output can become very large, so geographic scope must be constrained.
  - Spatial join performance depends heavily on using centroid/representative-point approximations instead of full polygon intersection for large hazard polygons.
  - Columnar side tables support fast aggregation and lookup.
  - Three.js path needs explicit cache and BVH disposal on tile unload.

### Relevance

Very high. It provides the most useful comparison of CesiumJS vs deck.gl vs Three.js for PLATEAU-like data.

## 7. bettergovph/flood-watch

- Repository: `bettergovph/flood-watch`
- URL: https://github.com/bettergovph/flood-watch
- Purpose: Flood hazard and infrastructure planning web app.
- License: MIT.

### Tech Stack

- Vite, React, TypeScript, Tailwind, MapLibre GL JS, PMTiles, Cesium dependencies, lucide icons.
- Cloudflare Worker backend with Postgres access for infrastructure projects.
- Deploy scripts target Cloudflare/Wrangler.
- `package.json` uses many `latest` versions, which is poor for reproducibility.

### Rendering Architecture

- Main app centers on a MapLibre map.
- PMTiles protocol is registered once.
- Hazard vector layers are rendered as fill layers with color ramps.
- Buildings are rendered as MapLibre `fill-extrusion`.
- Infrastructure projects are GeoJSON sources with heatmap, circle, line, and polygon layers.
- Click-to-place mitigation tools generate Point, LineString, or Polygon scenario features.

### Data Architecture

- Static PMTiles hazard dataset.
- Live/dynamic project and funding data from worker endpoints, filtered by viewport bbox.
- Scenario mitigation projects are held in React state and converted to GeoJSON.
- Funding heatmap uses double-buffered sources for transitions.

### Useful Implementation

- Scenario cards, score/analytics panels, and infrastructure placement UX are directly relevant.
- Store placed facilities as scenario features and re-render a single source, not many objects.
- Use bbox-aware data loading for any future backend.
- Use MapLibre expressions for lightweight color/opacity changes.

### What NOT To Copy

- Do not put most application logic in one very large `App.tsx`.
- Do not use unconstrained `latest` dependency versions.
- Do not add Cloudflare/Postgres until the MVP needs dynamic data.
- Do not hard-code scenario claims as predictions.

### Performance Characteristics

- Strong: PMTiles, vector-tile hazard layers, MapLibre GPU layers, bbox filtering.
- Good for 2D/2.5D planning dashboards.
- Weaker for true PLATEAU 3D Tiles and terrain-based building picking than Cesium.

### Relevance

High for UX and vector overlay strategy; medium as a rendering base for our 3D-first app.

## 8. kilsedar/urban-geo-big-data-3d

- Repository: `kilsedar/urban-geo-big-data-3d`
- URL: https://github.com/kilsedar/urban-geo-big-data-3d
- Purpose: Urban geospatial digital twin portal for visualization, querying, and processing of multidimensional vector/raster data.
- License: GPL-3.0.

### Tech Stack

- Older JavaScript web GIS stack.
- NASA WebWorldWind, CesiumJS, 3DCityDB Web Map Client, GeoServer WMS/WFS/WMTS, Plotly.

### Rendering Architecture

- Multiple virtual globes for different applications.
- 3D city visualization via 3DCityDB/Cesium.
- Flood simulation over CityGML city context.
- Raster time-series visualization via WMS/WMTS and Cesium timeline.

### Data Architecture

- Server-backed geospatial architecture with GeoServer and database-driven 3DCityDB.
- Raster and vector layers are served through standard OGC services.

### Useful Implementation

- Shows mature digital-twin separation: city model, hazard layer, deformation layer, mobility layer, and query/processing services.
- Confirms flood visualization on 3D city context is a known pattern.

### What NOT To Copy

- Do not reuse GPL code in this project without a deliberate license decision.
- Do not adopt old WebWorldWind or 3DCityDB server stack for a short static MVP.

### Performance Characteristics

- Server-side OGC services reduce browser-side raw data load.
- Stack is too heavy for a small hackathon team and static deployment.

### Relevance

Medium. Useful as architectural precedent, not an implementation base.

## 9. opengeos/maplibre-gl-raster

- Repository: `opengeos/maplibre-gl-raster`
- URL: https://github.com/opengeos/maplibre-gl-raster
- Purpose: MapLibre plugin for visualizing local/remote GeoTIFF and COG raster data.
- License: MIT.

### Tech Stack

- TypeScript library.
- MapLibre, deck.gl, luma.gl, COG/GeoTIFF tooling, optional WASM tiler, optional React wrapper.

### Rendering Architecture

- Provides MapLibre control with deck.gl GPU raster pipeline.
- Supports COG loading via HTTP range requests, colormaps, histograms, nodata filtering, pixel inspector, and layer controls.

### Data Architecture

- Reads raster sources directly from CORS-enabled URLs.
- Supports remote COG, local GeoTIFF, VRT, MosaicJSON, STAC FeatureCollection, WASM tiler, or TiTiler.

### Useful Implementation

- Good reference for DEM/COG color ramps, pixel inspection, layer opacity, and colormap UI.
- If later using MapLibre for 2D analysis mode, COG-based DEM visualization could be useful.

### What NOT To Copy

- Do not add this dependency in Phase 1. It pulls in deck.gl/luma/COG stack and is not needed for a Cesium-first MVP.

### Performance Characteristics

- Strong for raster overlays; GPU parameter changes avoid refetching tiles.
- Less relevant if Cesium terrain/3D Tiles is the primary renderer.

### Relevance

Medium. Useful for future raster/elevation inspection, not MVP core.

## 10. raphaeltorquat0/map-3d-deck

- Repository: `raphaeltorquat0/map-3d-deck`
- URL: https://github.com/raphaeltorquat0/map-3d-deck
- Purpose: Framework-agnostic multi-level 3D maps with deck.gl + MapLibre.
- License: MIT.

### Tech Stack

- TypeScript library.
- deck.gl, MapLibre, luma.gl, tsup, Vite, Vitest.

### Rendering Architecture

- Wraps MapLibre map and deck.gl `MapboxOverlay`.
- Maintains layer registry, popup controller, legend controller, view state, and elevation range.
- Uses deck.gl layers interleaved with the basemap.

### Data Architecture

- Designed around GeoJSON/vector layer abstractions rather than PLATEAU 3D Tiles.

### Useful Implementation

- Good abstraction shape for layer registry, popup controller, legend controller, and view state callbacks.
- deck.gl is strong for networks, heatmaps, arcs, and extruded polygons.

### What NOT To Copy

- Do not add optional telemetry.
- Do not use this library as a base unless deck.gl becomes the main renderer.

### Performance Characteristics

- Good for GPU vector layers and repeated layer updates.
- Less natural for PLATEAU 3D Tiles/terrain than Cesium.

### Relevance

Medium. Useful for layer-controller design and possible 2D/2.5D fallback.

## 11. ym2540/GIS_FloodSimulation

- Repository: `ym2540/GIS_FloodSimulation`
- URL: https://github.com/ym2540/GIS_FloodSimulation
- Purpose: High-speed GIS-based coastal flood simulation research implementation.
- License: BSD-3-Clause.

### Tech Stack

- Jupyter/Python research workflow.
- Simulation methodology rather than web app.

### Rendering Architecture

- Not a browser renderer.

### Data Architecture

- GIS raster/vector analysis workflow for coastal flood modeling.

### Useful Implementation

- Useful future reference if the MVP grows beyond the simple `tide - ground elevation` model.
- Confirms that high-quality flood modeling belongs in preprocessing or a specialist module, not an ad hoc UI loop.

### What NOT To Copy

- Do not mix research-grade flood simulation into MVP UI without validation and source explanation.

### Performance Characteristics

- Suitable for offline computation, not browser interaction.

### Relevance

Low-medium for MVP; useful for future model upgrade.

## 12. VincentChoi33/address-to-digital-twin-mvp

- Repository: `VincentChoi33/address-to-digital-twin-mvp`
- URL: https://github.com/VincentChoi33/address-to-digital-twin-mvp
- Purpose: Address-to-digital-twin preview MVP with terrain, buildings, roads, water preview, provenance, and validation artifacts.
- License: MIT.

### Tech Stack

- Vite, TypeScript, Three.js, Vitest.
- Includes Python scripts for validation/export workflows.

### Rendering Architecture

- Plain Three.js scene class with `WebGLRenderer`, `OrbitControls`, terrain mesh, building group, water solver/surface, rain effect, instanced drain markers, and explicit dispose methods.
- Caps renderer pixel ratio with `Math.min(window.devicePixelRatio, 2)`.
- Uses typed scene modules for terrain, buildings, water, sky, rain, and viewer.

### Data Architecture

- Uses a typed `TwinProject` model and sample manifests.
- Separates source manifest, twin JSON, preview HTML, QA reports, and generated artifacts.

### Useful Implementation

- Good module separation for a custom Three.js scene.
- Good reminder to cap pixel ratio, use instancing for repeated markers, dispose objects, and keep sample provenance.
- Useful if we build a small non-GIS PoC of facility placement mechanics.

### What NOT To Copy

- Do not use custom Three.js as the main PLATEAU renderer unless 3D Tiles streaming/picking/performance are already solved.
- Do not bring in complex NVIDIA/Omniverse workflows.

### Performance Characteristics

- Good local-scene practices: pixel ratio cap, instancing, explicit disposal.
- Not proven for full city-scale PLATEAU 3D Tiles unless combined with a tile renderer.

### Relevance

Medium. Useful for Three.js discipline and scenario/provenance structure; not the primary stack recommendation.

## 13. Project-PLATEAU/plateau-streaming-tutorial

- Repository: `Project-PLATEAU/plateau-streaming-tutorial`
- URL: https://github.com/Project-PLATEAU/plateau-streaming-tutorial
- Purpose: Official PLATEAU streaming service tutorial.
- License: GitHub license metadata not confirmed during this pass. Treat as documentation reference, not reusable code.

### Tech Stack

- Documentation/tutorial repository.
- Covers PLATEAU CityGML, PLATEAU 3D Tiles/MVT, PLATEAU Terrain, PLATEAU Ortho, and PLATEAU MCP.

### Rendering Architecture

- The README states PLATEAU VIEW uses Cesium and Re:Earth.
- It points to 3D Tiles/MVT, Terrain, and Ortho streaming patterns.

### Data Architecture

- Streaming service exposes PLATEAU datasets as web delivery assets.
- Notes that PLATEAU Terrain is Cesium-oriented, while MapLibre/Mapbox terrain requires Terrain-RGB conversion.

### Useful Implementation

- Use official streaming documentation to locate correct PLATEAU 3D Tiles/MVT/Terrain/Ortho sources.
- If direct official streaming is unstable or not suitable for final demo, preprocess and self-host the small Maizuru subset.

### What NOT To Copy

- Do not rely on deprecated tutorial paths without checking current official docs.
- Do not treat the trial streaming service as guaranteed production infrastructure.

### Performance Characteristics

- Streaming assets solve raw-data loading, but service availability and URL stability must be verified before demo.

### Relevance

High as source discovery and official data-use guidance.

## Cross-Repository Patterns

### Patterns To Adopt

- Use 3D Tiles for PLATEAU buildings.
- Use MVT/PMTiles/GeoJSON/Arrow side tables for attributes and scores.
- Preprocess heavy geospatial data; keep the browser as viewer + lightweight simulator.
- Initialize heavy renderers lazily and dispose data sources explicitly.
- Render only selected network category.
- Keep score calculations deterministic and explainable.
- Store provenance and coverage metadata in a manifest.
- Treat unknown data separately from safe/zero-risk data.
- Use bbox/viewport filtering if any backend is introduced.

### Patterns To Avoid

- Loading raw CityGML in the browser.
- Thousands of independent Three.js Mesh objects for city buildings.
- Per-building React components.
- Always-on glow networks for every category.
- Runtime hydrodynamic simulation in the MVP.
- Unpinned `latest` dependencies.
- Embedded API tokens.
- Static claims such as "50 years later +X m" without sourced support.
- Copying GPL or license-unclear code.
