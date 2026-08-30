# Reference Architecture

Research date: 2026-08-26

This architecture combines the best patterns found in PLATEAU official tools, `city-viewer-demo`, `plateau-bridge`, and flood/infrastructure planning apps. It assumes a new app built from zero and does not depend on existing local app code.

## Architecture Goals

- Render actual Maizuru PLATEAU 3D city context without loading raw CityGML in the browser.
- Make a non-specialist planning loop: low ground -> tide -> function loss -> place future facility -> score/network improvement.
- Keep runtime lightweight enough for ordinary laptop browser demos.
- Keep real, external, inferred, and scenario data separate.
- Avoid backend and paid infrastructure for MVP.

## Recommended Runtime Stack

- React for app shell, UI panels, score cards, and state.
- TypeScript for typed domain data and deterministic scoring.
- Vite for static frontend build.
- CesiumJS as the primary 3D/GIS renderer.
- Static data assets under `public/data` for MVP.

Do not add MapLibre/deck.gl/Three.js in Phase 1 unless a PoC proves Cesium cannot satisfy a specific requirement.

## High-Level Modules

```text
src/
  app/
    App.tsx
    layout/
  cesium/
    createViewer.ts
    viewerLifecycle.ts
    cameraPresets.ts
    picking.ts
  layers/
    PlateauBuildingsLayer.ts
    TerrainLayer.ts
    RoadLayer.ts
    FacilityLayer.ts
    FloodLayer.ts
    NetworkLayer.ts
    PlacementPreviewLayer.ts
  data/
    manifest.ts
    loadPlateau.ts
    loadTerrain.ts
    loadFacilities.ts
    loadRoads.ts
    schemas.ts
  domain/
    inundation.ts
    scoring.ts
    network.ts
    placement.ts
    provenance.ts
  state/
    useAppState.ts
    scenarioStore.ts
  ui/
    ModeSwitcher.tsx
    TideControl.tsx
    ScorePanel.tsx
    FacilityToolbar.tsx
    CandidateEvaluation.tsx
    DataProvenanceLegend.tsx
    SelectedFeaturePanel.tsx
public/
  data/
    manifest.json
    maizuru/
      plateau-buildings/tileset.json
      terrain/
      roads.pmtiles or roads.geojson
      facilities.json
      networks.json
      elevation-samples.bin or elevation-grid.json
docs/
```

Names can change during implementation, but the responsibility boundaries should stay.

## Data Preparation Architecture

### Source Classes

Every dataset must have one of:

- `official_plateau`
- `official_public`
- `external_open`
- `manual_curated`
- `inferred`
- `scenario_virtual`

The UI can group these into the user-facing classes:

- Real data
- External acquired data
- Virtual/scenario data

### Manifest

Every deployable data bundle should include a `manifest.json`:

```json
{
  "area": "maizuru",
  "generated_at": "YYYY-MM-DD",
  "datasets": [
    {
      "id": "plateau_buildings",
      "class": "official_plateau",
      "source": "PLATEAU",
      "year": null,
      "license": null,
      "format": "3dtiles",
      "url": "maizuru/plateau-buildings/tileset.json",
      "coverage_note": "To be filled during data preparation"
    }
  ],
  "model_notes": [
    "Inundation is a simplified tide minus ground elevation model, not a hydrodynamic simulation."
  ]
}
```

### Preprocessing Outputs

Preferred outputs:

- Buildings: 3D Tiles for Cesium rendering.
- Building attributes: compact JSON/Arrow/Parquet-derived static table keyed by building ID or tile feature ID.
- Terrain/elevation: Cesium terrain when available, or a sampled elevation grid for MVP logic.
- Roads: GeoJSON/PMTiles/MVT with road IDs and elevation samples or derived risk state.
- Facilities: small JSON with type, coordinates, data class, source, and confidence.
- Networks: generated JSON of key facility-to-area/facility-to-road edges, capped for display.

## Cesium Runtime Boundary

React should not directly own every Cesium object. Use a thin imperative boundary:

- `createViewer(container, options)` creates the viewer once.
- Layer modules receive the viewer and stable data references.
- UI state changes call explicit methods such as:
  - `setViewMode(mode)`
  - `setTideLevel(meters)`
  - `setSelectedFunction(category)`
  - `setScenarioFacilities(facilities)`
  - `dispose()`

This avoids re-creating 3D Tiles or thousands of entities on normal React renders.

## Rendering Layers

### TerrainLayer

Responsibilities:

- Initialize terrain provider or fallback ellipsoid/grid.
- Provide elevation sampling adapter for domain logic.
- Expose low-ground coloring or draped raster/primitive if available.

MVP fallback:

- A small sampled elevation grid used for inundation and candidate scoring.
- Terrain visual can start with Cesium terrain or a lightweight ground overlay.

### PlateauBuildingsLayer

Responsibilities:

- Load PLATEAU buildings as 3D Tiles.
- Apply mode-specific Cesium styling:
  - normal city view
  - ground/elevation emphasis if metadata supports it
  - inundation affected/unaffected style if joined data exists
  - selected/highlighted feature style
- Support picking and curated metadata panel.

Do not create one React component or one Entity per building.

### RoadLayer

Responsibilities:

- Render roads as lightweight polylines or vector tiles.
- Provide access graph or road proximity data for scoring.
- Mark affected route segments based on simplified inundation state.

MVP road impact can use sampled segment midpoints or coarse grid overlap.

### FacilityLayer

Responsibilities:

- Render existing facilities and scenario facilities distinctly.
- Keep markers cheap: billboards, point primitives, or batched entities.
- Expose picked facility details and provenance.

Facility types for MVP:

- medical
- evacuation
- daily_life
- disaster_power

### FloodLayer

Responsibilities:

- Render simplified inundation possibility.
- Update when tide level changes.
- Make the formula visible in UI, not hidden in code.

MVP options:

- A draped polygon/primitive grid generated from elevation samples.
- Low-opacity blue material where `max(0, tide - ground) > threshold`.
- Building/facility/road status derived from the same grid.

Do not implement high-cost fluid simulation in browser.

### NetworkLayer

Responsibilities:

- Render only the selected function category.
- Use a capped set of important edges.
- Encode active/degraded/broken links.
- Update after tide or scenario placements.

Implementation options in Cesium:

- `PolylineCollection` or Entity polylines for small edge counts.
- Glow material if performance allows.
- Simple color/opacity/width changes before postprocessing.

Performance rule:

- Network edge count should be capped by category, e.g. 50 to 200 visible lines for MVP.
- Old geometry must be removed or reused when switching category.

### PlacementPreviewLayer

Responsibilities:

- Convert screen click to globe/terrain position.
- Show current candidate marker.
- Evaluate candidate immediately.
- Commit candidate facility only after user action or clear click-to-place state.

MVP should use click-to-place, not drag-and-drop, because 3D map drag/drop can conflict with camera controls.

## Domain Modules

### Inundation

Core formula:

```ts
depth = Math.max(0, tideLevelM - groundElevationM)
```

Outputs:

- affected cells
- affected facilities
- affected road segments
- affected building IDs or counts
- safe/affected/unknown classification

### Scoring

Each category returns:

- `before`
- `after`
- `delta`
- `reasons`
- `networkEdges`

Recommended MVP categories:

- medical
- evacuation
- transport
- daily_life

Scoring should be deterministic, explainable, and cheap. It should run only when tide level, active datasets, or scenario placements change.

### Network

Build network edges from:

- facility-to-residential cluster
- facility-to-shelter
- facility-to-road
- facility-to-facility redundancy

Each edge has:

- category
- source ID
- target ID
- points
- status: `active`, `degraded`, `broken`, `unknown`
- reason
- source data class

### Placement

Candidate evaluation dimensions:

- storm surge safety
- residential access
- road access
- relation to other facilities
- total score

Important behavior:

- High ground alone must not always win.
- A high, isolated location can score poorly on access.

## UI Architecture

### Main Workflow

1. Current city mode.
2. Ground elevation mode.
3. Tide/inundation mode.
4. Function score mode.
5. Network explanation mode.
6. Facility placement mode.
7. Before/after comparison.

### Panels

- Mode switcher: current/elevation/inundation/functions/placement.
- Tide control: arbitrary meter value and clearly labeled scenario presets.
- Score panel: category cards and total score.
- Network detail: selected category, edge status summary, why score changed.
- Facility toolbar: type selection and click-to-place state.
- Candidate evaluation: safety/access/road/relation/total.
- Data provenance legend: real/external/scenario/inferred/unknown.

## Performance Strategy

Borrowed patterns:

- From PLATEAU-GIS-Converter: preprocess, tile, filter LOD, limit textures.
- From city-viewer-demo: config-driven layers, lazy initialization, 3D Tiles + vector side data.
- From plateau-bridge: side tables, provenance manifest, tile-level cache, do not treat unknown as safe.
- From flood-watch: PMTiles/vector layers and scenario features as single data sources.
- From Three.js examples: cap pixel ratio, use instancing, dispose obsolete objects.

MVP requirements:

- One primary WebGL engine.
- No raw CityGML in browser.
- No per-building Mesh/Entity/React component.
- No always-on all-category networks.
- No high-cost shadow/postprocessing by default.
- Recompute scoring only on state changes.
- Keep demo area bounded if full Maizuru is too heavy.

## Deployment Strategy

MVP target:

- Static build.
- GitHub Pages compatible.
- Relative asset paths.
- No server secrets.
- No paid infrastructure.

Data hosting:

- Small JSON/GeoJSON can live in `public/data`.
- Large 3D Tiles may need Git LFS or external static object storage later, but that decision is outside this Research Phase.
- If using official streaming URLs, maintain a fallback plan because service terms/availability may change.

## Testing Strategy For Later Phases

Minimum verification when implementation starts:

- Typecheck/build.
- Browser smoke test.
- Cesium viewer initializes without Ion token errors.
- PLATEAU 3D Tiles load or fallback scene appears.
- Tide slider updates flood layer without recreating buildings.
- Facility placement updates score and network.
- Data provenance legend is visible.
- No console errors during the primary demo path.

## Existing Docs Re-Evaluation Notes

The existing provisional docs are aligned on product intent, but they currently lean too much toward a custom Three.js/R3F implementation. Based on this research, they should be updated later to:

- Recommend CesiumJS as the primary renderer.
- Move Three.js/R3F to optional/future use.
- Add explicit preprocessing/data-manifest architecture.
- Add 3D Tiles, MVT/PMTiles, side-table, and provenance patterns.
- Add a first PoC focused on Cesium + one PLATEAU 3D Tiles source + one scenario network layer.
- Remove language that assumes an existing app repository or existing frontend stack.
