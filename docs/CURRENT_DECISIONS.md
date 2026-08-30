# Current Decisions

## Product Goal

Build a lightweight browser-based 3D urban simulator for Maizuru City for PLATEAU CityHack 2026.

The product is for citizens, children, and municipal staff without GIS expertise. The core value is not only seeing inundation risk, but testing where future urban facilities could be placed to maintain city functions.

## Core UX

Final product flow:

1. View current Maizuru in 3D.
2. Understand low ground.
3. Change tide level.
4. See simplified inundation possibility.
5. See city-function scores.
6. Select a score and inspect related city network links.
7. Place future facilities.
8. Compare before/after score and network recovery.

## Current Stack

Current implementation direction:

- Vite
- React
- TypeScript
- CesiumJS

React owns UI state and panels.

Cesium owns:

- viewer lifecycle
- camera
- terrain/imagery
- PLATEAU 3D Tiles
- picking
- Cesium primitives/entities

Do not manage large Cesium object collections as React components.

## Data Policy

Always distinguish:

- official PLATEAU data
- other official/public data
- external open data
- manually curated data
- inferred data
- virtual/scenario data

Never present mock, inferred, or scenario data as official PLATEAU data.

If a field is missing, show `Unknown` instead of inventing a value.

The current PoC uses official Maizuru City PLATEAU 2025 building 3D Tiles from Project PLATEAU / MLIT.

## Performance Policy

Use web-friendly geospatial formats:

- 3D Tiles for PLATEAU buildings
- MVT/PMTiles/GeoJSON only when appropriate
- small JSON for app metadata and future scenario data

Avoid:

- raw CityGML in browser
- one Mesh per building
- one React component per building
- unnecessary shadows
- postprocessing by default
- always-on large network layers
- per-frame score recalculation

Measure:

- initial load time
- time until interaction
- tile loading status
- FPS where possible
- approximate memory where available

## Current Phase

Phase 1B: Ground Elevation / Lowland Visualization.

Phase 1B decisions:

- use GSI DEM5A PNG tiles as official orthometric ground-elevation data
- limit runtime data to a nine-tile West Maizuru z15 AOI
- keep decoded elevation values outside React for future flood-depth reuse
- render elevation as a small raster overlay, not Cesium Entities or React cells
- keep the ellipsoid globe and retain `heightOffsetMeters: -36` only as the Phase 1A visual workaround
- do not interpret `-36 m` as a measured geoid height or apply it to DEM/flood calculations
- see `docs/PHASE1B_ELEVATION_INVESTIGATION.md` for candidate comparison and height-reference details

Allowed:

- minimal app shell
- Cesium viewport
- official Maizuru PLATEAU 2025 building 3D Tiles
- initial Maizuru AOI camera
- building click/picking
- selected building attribute panel
- data provenance label
- loading/performance status

## Do Not Do

In Phase 1A, do not implement:

- tide slider
- flood simulation
- flood polygon
- resilience score
- medical score
- network lines
- glowing effects
- facility placement
- drag and drop
- scenario system
- final dashboard
- report generation

Also do not:

- commit
- push
- create PR
- use sudo
- use brew
- install global dependencies
- download full CityGML or large PLATEAU datasets without approval
- embed API keys or secrets

## Next Milestone

Pass Phase 1A by proving:

- React + TypeScript + Vite + Cesium app builds.
- Real Maizuru PLATEAU 2025 buildings render.
- Initial camera starts in Maizuru.
- Camera controls work.
- Building click returns available attributes or `Unknown`.
- Data source is visible.
- Console has no major errors.
- Performance is acceptable enough to continue.
