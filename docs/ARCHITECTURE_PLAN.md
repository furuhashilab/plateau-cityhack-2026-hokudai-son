# Architecture Plan

## Repository Status

Local workspace inspection found only operating-policy files and no application checkout:

- `AGENTS.md`
- `RESEARCH_MAC_OPERATING_RULES.md`

The directory is not currently a Git repository. `package.json`, source code, deployment settings, and existing app assets were not present locally. GitHub access to `furuhashilab/plateau-cityhack-2026-hokudai-son` returned `404 Not Found` through the connector and required authentication through `git`.

This plan therefore defines the recommended target architecture. After the actual repository is available locally or through authenticated GitHub access, this document should be checked against the existing framework and adjusted to preserve reusable technical assets.

## Recommended Architecture

Use a client-first web app with a small, explicit simulation domain layer.

Recommended default, if the repository has no conflicting stack:

- Vite
- TypeScript
- React
- CesiumJS as the primary 3D/GIS renderer
- Static deployment through GitHub Pages or another existing static host

Avoid a backend for MVP unless existing data loading or deployment already requires it.

## Responsibility Separation

```text
src/
  app/                 application shell, routing if needed
  cesium/              Cesium viewer setup, lifecycle, camera, picking
  layers/              terrain, buildings, roads, facilities, flood, networks
  simulation/          inundation, scoring, candidate evaluation
  data/                typed loaders and normalized domain data
  state/               app state and scenario state
  ui/                  panels, controls, score cards, legends
  types/               shared TypeScript types
public/
  data/                static lightweight datasets and generated extracts
docs/
  PRODUCT_SPEC.md
  ARCHITECTURE_PLAN.md
  IMPLEMENTATION_PLAN.md
```

Adapt names to the existing repository conventions after checkout.

## 3D Rendering

The scene should render only what supports the core decision flow:

- city context
- low-ground understanding
- inundation overlay
- selected function network
- placed future facilities

Cesium should own the imperative viewer, terrain, imagery, 3D Tiles, and picking lifecycle. React should own UI and high-level app state.

Use lightweight materials first. Shadows, postprocessing, and animated glow should be limited and measurable.

## Terrain

Terrain responsibilities:

- provide visual ground surface
- expose elevation sampling for inundation and candidate scoring
- support elevation-color mode

MVP can use Cesium terrain where available, or a simplified sampled grid if full DEM/PLATEAU terrain is too heavy. Elevation source and preprocessing assumptions must be documented.

## Buildings

Building responsibilities:

- show current urban density and form
- expose footprint or centroid for scoring and network context
- optionally reflect inundation status through color or opacity

Performance approach:

- prefer PLATEAU 3D Tiles and tile streaming for real buildings
- avoid converting all buildings into independent Three.js meshes or Cesium entities
- avoid one expensive material per building
- avoid per-frame building updates when tide level changes can be applied by batched attributes or color buffers

## Roads

Road responsibilities:

- provide visual city structure
- support access scoring and network visualization
- indicate affected routes under inundation conditions

MVP can use simplified polylines. Route availability can be approximated by sampled elevation or proximity to inundated zones.

## Facilities

Facility responsibilities:

- represent existing real or external facilities
- represent user-placed virtual future facilities
- provide type, location, status, and provenance

Facility data should include a provenance field:

```ts
type DataClass = "real" | "external" | "scenario";
```

Never merge scenario facilities into the same display category as confirmed existing facilities.

## Flood Simulation

MVP formula:

```text
inundation depth = max(0, tide level - ground elevation)
```

Responsibilities:

- calculate inundation depth for terrain cells, building points, roads, and facilities
- expose thresholds such as affected/unaffected
- keep model labels visible in UI

This module should not contain scenario claims such as "50 years later" unless backed by a sourced dataset and labeled correctly.

## Scoring

Scoring should be deterministic and explainable. MVP can use weighted heuristics:

- facility availability under inundation
- residential access approximation
- road access approximation
- redundancy from nearby facilities

Each score category should expose:

- current score
- score after user placements
- main reason labels
- affected network edges

The scoring API should support replacement with more advanced methods later.

## Network Visualization

Network visualization is an explanatory layer, not decoration.

Responsibilities:

- render only the selected function network
- connect relevant facilities, residential areas, roads, and shelters
- encode degraded links with color, opacity, pulse, or removal
- update after tide and placement changes

Performance strategy:

- build edges on selection or scenario update, not every frame
- cap maximum visible edges
- use lightweight line geometry
- dispose old geometries when switching categories
- avoid rendering all category networks at once

## Facility Placement

Recommended MVP interaction:

- select facility type in UI
- click ground to place
- show preview marker and evaluation
- allow undo/remove for scenario facilities

Click-to-place is likely more stable than drag-and-drop in a 3D map MVP. Drag-and-drop can be added later if the current stack supports robust raycasting and pointer capture.

## Application State

State should include:

- active view mode
- tide level
- selected function category
- existing datasets and provenance
- scenario facility placements
- computed inundation
- computed scores
- selected or hovered feature

Keep raw data separate from derived simulation outputs.

## UI

Primary UI panels:

- mode switcher
- tide/scenario controls
- function score cards
- selected category explanation
- placement toolbar
- candidate evaluation panel
- data provenance legend

The UI should avoid GIS jargon where possible. Technical caveats should be concise but visible.

## Data Loading

Prefer static, preprocessed data for MVP:

- lightweight JSON for facilities
- compact GeoJSON or custom line data for roads
- simplified building/terrain extracts

Large PLATEAU source files should not be loaded directly in the browser. If required, preprocess them into demo-sized assets and document source/license.

## Deployment

Because the repository could not be inspected, preserve the existing deployment setup after checkout. If none exists, prefer static deployment:

- GitHub Pages for a Vite static app
- no server-side secrets
- relative asset paths configured for repository pages

Do not deploy or enable production infrastructure without explicit approval.

## Performance Strategy

- Target ordinary laptop browsers.
- Limit initial scene extent to a demo area of Maizuru.
- Use low-cost materials and restrained effects.
- Cap renderer pixel ratio.
- Use instancing or merged geometry for repeated/simple objects.
- Generate only selected network edges.
- Avoid per-frame score recalculation.
- Recompute inundation and scores only when tide or placements change.
- Dispose obsolete geometries and textures.
- Validate with browser FPS and visible responsiveness on the expected demo machine.

## Known Conflicts / Unknowns

- The actual repository contents were not accessible during this planning pass.
- Existing code, dependencies, and deployment settings must be inspected before implementation.
- Any existing idea or concept text in the repository must not be used as product requirements.
- Existing technical assets may still be reused after review.
