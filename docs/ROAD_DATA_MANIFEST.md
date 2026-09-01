# Road Data Manifest

## Phase

Phase 2B.1 — Road Data Proof / Small AOI

## Dataset

- Derived file: `src/data/roads/westMaizuruRoadProof.json`
- Source: OpenStreetMap
- Attribution: OpenStreetMap contributors
- License: Open Data Commons Open Database License (ODbL) 1.0
- Source URL: https://www.openstreetmap.org/copyright
- Retrieval date: 2026-08-30
- Retrieval method: one-time Overpass API AOI query, then static local preprocessing.
- Runtime dependency: none. The browser app does not query Overpass or OpenStreetMap at runtime.
- OSM base timestamp: 2026-08-30T07:12:37Z

## AOI

Small West Maizuru proof AOI around the Nishi-Maizuru station / Isazu lowland area:

- South: 35.4430
- West: 135.3260
- North: 35.4518
- East: 135.3378

This AOI is intentionally small for Phase 2B.1. It is not a full West Maizuru road ingestion.

## Highway Classes

Selected OSM `highway` classes:

- `primary`
- `secondary`
- `tertiary`
- `unclassified`
- `residential`
- `service`

These classes were selected because they can represent vehicle traffic corridors relevant to municipal storm-surge traffic management review.

Excluded pedestrian and non-road classes:

- `footway`
- `path`
- `cycleway`
- `steps`
- `pedestrian`

Additional preprocessing exclusions:

- `motor_vehicle=no`
- `service=parking_aisle`
- `service=driveway`
- segments shorter than 40 m after AOI clipping

The final proof subset contains only the longest filtered features, capped at 48 roads. In this AOI the retained classes are `primary`, `tertiary`, and `unclassified`.

## Processing

The preprocessing script is `scripts/build-road-proof-data.mjs`.

Processing steps:

1. Read one-time OSM Overpass JSON from `/tmp/west-maizuru-road-proof-osm.json` or fetch it when explicitly run without `OSM_JSON_PATH`.
2. Clip OSM way geometries to the AOI bbox.
3. Filter to vehicle-relevant roads and remove short/private driveway-like segments.
4. Sample each retained LineString at approximately 5 m spacing, always including endpoints.
5. Attach GSI DEM5A ground elevation to each sample.
6. Attach a sea-connection threshold to each sample using the same conceptual method as `src/data/seaConnectivity.ts`.
7. Write a static road domain JSON file for runtime use.

DEM / connectivity inputs:

- DEM source: GSI DEM5A text tiles.
- DEM tile range: same z15 tile range used by the app DEM AOI.
- Sea connectivity: boundary-connected DEM NoData sea mask with 4-neighbor minimum-threshold propagation.
- Invalid samples: DEM NoData or outside available DEM cells are marked `valid: false`.

No `heightOffsetMeters: -36` workaround is used.

## Output Summary

- OSM ways read from AOI query: 225
- Retained road features: 48
- Road samples: 1,400
- Invalid samples: 10
- Total retained road length: 6,630.2 m
- Retained classes:
  - `primary`: 7
  - `tertiary`: 20
  - `unclassified`: 21

## Runtime Use

The runtime app loads `westMaizuruRoadProof.json` as static domain data.

Scenario-dependent values are not stored in the static dataset. Tide and inundation method changes compute road impact metrics from existing sample elevations and sea-connection thresholds by numeric comparison only.

## Limitations

- OpenStreetMap is not an official municipal road-regulation dataset.
- This proof subset is small and intentionally not complete for West Maizuru.
- OSM way segmentation may not match municipal road segment definitions.
- Centerlines approximate road corridors; carriageway width and lane count are not modeled.
- DEM sampling uses nearest DEM cell, not road-surface survey elevations.
- Sea-connection thresholds are terrain-surface screening values, not drainage or backflow simulation.
- No traffic regulation threshold, closure rule, danger label, or automatic regulatory decision is encoded.
