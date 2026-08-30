# Phase 2B Road Impact Research

Last updated: 2026-08-30

Status: PASS for research / architecture spike. Do not treat this document as an implementation record.

## 1. Municipality Requirement

Maizuru City reported a practical storm-surge operation need: even when pedestrian evacuation may still be possible, vehicle traffic through shallow water can cause vehicle corrosion, waves from vehicles, water pushed toward nearby houses, and the need for road closure or slow-driving controls.

Phase 2B should therefore not be framed as "show flooded roads." The target use case is:

```text
selected tide scenario
-> potentially affected road segments
-> municipal staff inspection / traffic-management candidates
```

No official traffic regulation thresholds are currently available. The UI and exports must avoid terms such as `closed`, `dangerous`, or `impassable` unless an authoritative rule is later provided. Recommended wording:

- Potential Road Impact
- Road Impact Candidate
- Traffic Management Candidate
- Potentially Affected Road
- Traffic regulation: Not automatically determined
- Municipal review may be required

## 2. Current Implementation Summary

The current mainline app uses Vite, React, TypeScript, and CesiumJS.

Existing relevant modules:

- `src/data/maizuruGroundElevation.ts`: defines the West Maizuru GSI DEM5A dataset, z15 tile range `x=28701..28703`, `y=12927..12929`, nominal 5 m resolution.
- `src/data/groundElevation.ts`: fetches and decodes GSI DEM5A PNG elevation tiles into `Float32Array` values and exposes `sampleMeters(lon, lat)`.
- `src/data/inundation.ts`: defines tide range, inundation method, bands, and `inundationDepth(tide - ground)`.
- `src/data/seaConnectivity.ts`: builds a per-DEM-cell sea connection threshold from boundary-connected DEM NoData sea cells using 4-neighbor propagation.
- `src/cesium/inundationLayer.ts`: rebuilds a small raster overlay when tide or method changes.
- `src/cesium/groundElevationLayer.ts`: renders the DEM elevation overlay as imagery layers.
- `src/components/CesiumViewport.tsx`: owns Cesium layer lifecycle, keeps DEM/connectivity outside React, updates inundation layer and building shader on tide/method change.

The current DEM AOI bounds are approximately:

- west: `135.318603515625`
- east: `135.3515625`
- south: `35.442770925857666`
- north: `35.469617971202005`

The important architecture pattern to reuse is:

```text
load DEM once
build sea-connectivity thresholds once
precompute feature samples once
tide changes -> numeric comparisons only
rendering changes -> style update only
```

## 3. Road Dataset Comparison

| Candidate | Geometry | Coverage | Classification / attributes | License | Format / access | Size | Suitability |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PLATEAU Maizuru 2025 `tran` CityGML | `tran:Road` surfaces; sampled file used `tran:lod1MultiSurface`; LOD2 includes traffic areas | Maizuru city urbanized area. Maizuru page states roads are maintained for city-planning area / urbanized area. | `gml:id`, `gml:name`, `tran:class`, `tran:function`, `uro:RoadStructureAttribute`. Sample attribute API returned `tran:class=道路`, `tran:function=不明`, section type `土工区間・通常区間`. | PLATEAU open license family / site policy; preserve exact source metadata. | CityGML via PLATEAU API; MVT delivery exists. Browser direct raw CityGML is not appropriate. | CityGML `tran`: 82 files, 15,641 features, 44,498,495 bytes. | Strong provenance and alignment with PLATEAU story. Weak road hierarchy attributes in sample. Needs preprocessing to centerlines or simplified road surfaces. |
| PLATEAU Maizuru 2025 `tran` MVT LOD1 | MVT layer `Road`; likely generalized road geometry for display | Same PLATEAU road coverage | TileJSON `fields` is empty, so attribute reliability is limited from TileJSON alone. | PLATEAU attribution in TileJSON. | MVT tiles z10-16. Cesium does not support MVT natively without extra library; current app has no MVT dependency. | Catalog file size 9,752,394 bytes. | Good for visual reference, less good for analysis unless decoded/preprocessed. |
| PLATEAU Maizuru 2025 `tran` MVT LOD2 | MVT layers `TrafficArea`, `AuxiliaryTrafficArea` | Same PLATEAU road coverage | TileJSON `fields` is empty. LOD2 is smaller but surface-area focused. | PLATEAU attribution in TileJSON. | MVT tiles z10-16. | Catalog file size 1,194,757 bytes. | Useful for road-surface visualization; not ideal as road segment network without preprocessing. |
| OpenStreetMap | Mostly road centerline ways with vertices | West Maizuru coverage expected; update quality depends on contributors | `highway`, `name`, `ref`, `bridge`, `tunnel`, `layer`, `oneway`, `surface`, etc. Strong practical road class vocabulary. | ODbL; attribution and share-alike obligations apply to derived databases. | Overpass API for bbox, or reproducible extract from Geofabrik PBF/GPKG. Browser should load a preprocessed AOI GeoJSON/JSON, not live Overpass. | AOI extract likely small after clipping; full Kansai PBF/GPKG is hundreds of MB. | Best analysis geometry for Phase 2B prototype because centerlines and road classes are directly available. License obligations must be documented. |
| GSI Fundamental Geospatial Data / Electronic National Base Map | Road edge / road centerline depending product | National | High positional authority, but less convenient road management semantics for this app; login or GIS workflow may be required for some downloads. | GSI Content Usage Terms / survey-law considerations depending dataset. | Download service, viewer/GIS conversion; not browser-native. | Varies by product and extract. | Good authoritative fallback, but heavier procurement/processing and less direct for quick CityHack implementation. |
| National Land Numerical Information `N01` road data | Road lines | National; old road dataset baseline | Road type and route name fields, but dataset is old (1995 basis in current old listing). | National Land Numerical Information terms. | GML / Shapefile downloads | Kyoto GML old road file is small, but temporal fitness is poor. | Not recommended for current municipal review candidates. |
| Kyoto Prefecture / municipal GIS road data | Road-route lines, route number layers, road registry maps | Kyoto prefecture roads and Maizuru municipal road registry map are available through Kyoto integrated GIS / Maizuru site | Prefectural road categories are available; Maizuru recognized municipal-route network map may expose city-road names in the web GIS. Machine-readable export for Maizuru city-road layer is not yet verified. | Kyoto open data or municipal GIS terms; must verify per layer. | Kyoto open data provides shapefiles for national roads, major local roads, general prefectural roads, toll roads, route numbers. Maizuru road-register map is web GIS, not confirmed as open downloadable vector data. | Kyoto road shapefiles are small, hundreds of KB to about 2 MB per layer. | Useful supplement for official route names / road administrator classes. Not complete for local streets unless Maizuru city-road data can be exported with clear terms. |

## 4. PLATEAU Road Feasibility

Confirmed facts from PLATEAU API on 2026-08-30:

- Maizuru city code `26202`, year `2025`, spec `5.0`.
- CityGML feature types include `tran` = traffic road model.
- `tran` CityGML has 82 files, 15,641 features, total 44,498,495 bytes, max LOD 2.
- Dataset delivery includes:
  - `26202_tran_lod1`, MVT, z10-16, layer `Road`, file size 9,752,394 bytes.
  - `26202_tran_lod2`, MVT, z10-16, layers `TrafficArea` and `AuxiliaryTrafficArea`, file size 1,194,757 bytes.
- The current app only loads PLATEAU buildings from `bldg_3dtiles_lod1`. No road source is currently configured.

Sample CityGML inspection of `53351225_tran_6697_op.gml` showed:

- Features are `tran:Road` with stable `gml:id` values such as `tran_e1c6d815-d2ae-4174-a5d2-9fb39037d90a`.
- The geometry inspected is a `gml:MultiSurface` under `tran:lod1MultiSurface`, not a road centerline.
- A sample road had `gml:name=高野由里引土線`.
- Attribute API returned `tran:class=道路`, `tran:function=不明`, and `uro:sectionType=土工区間・通常区間`.

Assessment:

PLATEAU road data is usable as an official source but is not the easiest primary source for Phase 2B analytics. The main issues are road-surface geometry, sparse or unknown functional classification in the inspected sample, and lack of native Cesium MVT support in the current dependency set. It should not be loaded as raw CityGML in the browser.

## 5. Recommended Road Source

Recommendation: D. Hybrid approach.

Use OpenStreetMap-derived centerlines as the Phase 2B analysis geometry, with PLATEAU `tran` retained as the official-road-data reference and later validation/supplement.

Reasoning:

- OSM provides road centerlines and practical `highway` classes that map well to municipal inspection prioritization without inventing regulation rules.
- Road impact metrics need lengths and segment-level aggregation; centerlines are simpler and cheaper than PLATEAU road-surface polygons.
- PLATEAU `tran` should still be documented and optionally used later to validate coverage or display official road surfaces because it is Maizuru 2025 official PLATEAU data.
- Kyoto/Maizuru road registry data can later improve names and administrator classes if machine-readable access and license are confirmed.

Fallback if OSM licensing is judged undesirable:

Use PLATEAU `tran` CityGML as source, preprocess road surfaces into centerline-like representative lines or use polygon-edge sampling. This is more work and yields weaker road classes, but keeps the demo entirely within official PLATEAU/public-government data.

## 6. Road Geometry Architecture

Do not create one React component per road.

Recommended static domain model after preprocessing:

```ts
type RoadSource = "openstreetmap" | "plateau-tran" | "kyoto-gis" | "maizuru-gis";

type RoadFeature = {
  roadId: string;
  source: RoadSource;
  sourceFeatureId: string;
  sourceUrl: string;
  license: string;
  retrievalDate: string;
  processingMethod: string;
  name: string | null;
  roadClass: string | null;
  geometry: {
    type: "LineString";
    coordinates: Array<[longitude: number, latitude: number]>;
  };
  totalLengthMeters: number;
  samples: RoadSample[];
};

type RoadSample = {
  distanceMeters: number;
  longitude: number;
  latitude: number;
  groundElevationMeters: number | null;
  connectionThresholdMeters: number | null;
};

type RoadImpactMetrics = {
  roadId: string;
  tideLevelMeters: number;
  method: "elevation-only" | "sea-connected";
  minGroundElevationMeters: number | null;
  maxGroundElevationMeters: number | null;
  meanGroundElevationMeters: number | null;
  maxPotentialDepthMeters: number | null;
  meanPotentialDepthMeters: number | null;
  affectedLengthMeters: number;
  totalLengthMeters: number;
  affectedRatio: number;
  affectedSampleCount: number;
  sampleCount: number;
};
```

Keep raw provenance fields on every road record. Derived metrics should not overwrite source attributes.

## 7. DEM Sampling Strategy

Candidate evaluation:

- Endpoints only: too fragile. It misses sagging or low points in the middle of a road.
- Existing vertices only: better, but depends on source digitization density and may miss long straight low sections.
- Fixed interval sampling: best default for CityHack. Easy to explain, deterministic, and aligns with DEM resolution.
- Raster-cell intersection: more precise for line length by DEM cell, but more implementation complexity.
- Adaptive sampling: useful later around elevation transitions, but unnecessary for first road-impact prototype.

Recommended default:

- Precompute samples every 5 m along road centerlines.
- Always include endpoints.
- If performance or dataset size is too high, use 10 m spacing for minor roads and 5 m for primary/secondary/tertiary roads.

Why:

- Current DEM nominal resolution is 5 m.
- Sampling denser than 5 m gives a false sense of precision because the DEM value is nearest-cell sampled today.
- 5 m samples are still cheap for a West Maizuru AOI.

Implementation detail:

- Sample `groundElevation.sampleMeters(lon, lat)` once during road data preparation or app load.
- Also sample `seaConnectivity.sampleConnectionThresholdMeters(lon, lat)` once after connectivity is built.
- For sea-connected impact, a sample is potentially affected only when:

```text
groundElevation < tideLevel
AND connectionThreshold <= tideLevel
```

- For elevation-only impact:

```text
groundElevation < tideLevel
```

Depth remains:

```text
max(0, tideLevel - groundElevation)
```

## 8. Reuse Of Inundation Logic

Do not create a separate road flood model.

Road impact should use the same:

- GSI DEM5A elevation values.
- Selected tide level.
- `inundationDepth(tideLevelMeters, groundElevationMeters)`.
- `InundationMethod`.
- Sea-connected threshold logic from `SeaConnectivity`.

The road module should be a consumer of the existing elevation/connectivity data:

```text
RoadFeature.samples
-> per sample elevation / connection threshold
-> selected tide and method
-> sample depth
-> aggregate RoadImpactMetrics
-> update Cesium road style and inspector
```

This keeps buildings, facilities, raster inundation, and roads behaviorally consistent.

## 9. Road Impact Metrics

Recommended metrics for visualization:

- `maxPotentialDepthMeters`: strongest simple visual driver; answers "where is the worst point on this segment?"
- `affectedRatio`: distinguishes a short low spot from a long affected section.
- `affectedLengthMeters`: useful for municipal workload and export.
- `roadClass`: optional priority grouping, not a regulation threshold.

Recommended metrics for inspector/export:

- `minGroundElevationMeters`
- `meanGroundElevationMeters`
- `maxPotentialDepthMeters`
- `meanPotentialDepthMeters` over affected samples and/or all samples, clearly named.
- `affectedLengthMeters`
- `totalLengthMeters`
- `affectedRatio`
- `affectedSampleCount`
- `sampleCount`
- `method`
- `tideLevelMeters`

Do not calculate or display automatic `closure` / `slow driving` labels in Phase 2B.

## 10. Cesium Rendering Recommendation

Options:

- `GeoJsonDataSource`: simplest, easy properties/picking, but may produce many entities and be slower for frequent style changes.
- `PolylineCollection`: lightweight for many lines, supports per-polyline material/color, simpler than entities, but ground clamping is limited.
- `GroundPolylinePrimitive`: better terrain draping, primitive-based, but picking and per-feature style updates require more care.
- Custom primitive geometry: maximum performance, highest complexity.
- MVT imagery provider: possible for PLATEAU MVT display, but adds dependency and is weaker for analysis/picking.

Recommended first implementation:

- Preprocessed AOI road lines as static JSON or GeoJSON.
- Render with Cesium primitive-level batching, likely `PolylineCollection` for the first measurable prototype.
- Keep a `Map<roadId, polyline>` or packed index table for style updates.
- Use a separate highlighted selected-road primitive or update selected road width/color.
- Avoid React components for individual roads.

If ground following is visually unacceptable:

- Move to `GroundPolylinePrimitive` after measuring cost.
- Keep analysis samples 2D/DEM-based; visual ground clamping should not change metrics.

Styling update strategy:

- Precompute metrics for the current tide on slider changes.
- Update only road material/color/width buckets.
- Bucket colors rather than generating unique material objects per road where possible.

## 11. Road Styling Concept

Visual wording and semantics:

- Neutral road: subdued gray/white.
- Potentially affected: yellow/orange highlight.
- Higher potential depth or affected ratio: stronger color / wider line / higher opacity.
- Selected road: cyan or white outline/highlight.

Avoid:

- `Closed`
- `Dangerous`
- `Impassable`
- `Safe for vehicles`

Legend example:

- No potential impact in selected method
- Potential road impact candidate
- Higher potential depth candidate
- Municipal review required

## 12. Picking / Inspector Design

Road Inspector fields:

```text
Road Segment

Source: OpenStreetMap / PLATEAU / Kyoto GIS / Maizuru GIS
Source feature ID: ...
Road name: ...
Road class: ...
Scenario tide: +1.5 m
Inundation method: Sea-connected
Minimum elevation: ...
Maximum potential depth: ...
Mean potential depth: ...
Affected length: ...
Affected ratio: ...
Traffic regulation: Not automatically determined
Note: Municipal review may be required.
```

Picking approach:

- For `GeoJsonDataSource`, use entity picking as a quick prototype only.
- For primitive collections, attach `roadId` through primitive metadata where possible, or maintain screen-space fallback for selected polylines.
- Keep road picking separate from building/facility picking order. Facility and building selection already share `drillPick`; roads should be added with explicit priority rules to avoid breaking Phase 2A.1 behavior.

Suggested priority:

1. Facility marker/label
2. PLATEAU building
3. Road line
4. Empty selection

This preserves the current facility/building workflow. Add a road-mode override later if roads are hard to pick under buildings.

## 13. Performance Estimate

Current PLATEAU/GSI baseline:

- About 60 FPS.
- PLATEAU pending: 0.
- Existing non-blocking Cesium ContextLimits / framebuffer issue remains technical debt and should not be modified in Phase 2B.

Estimated West Maizuru road counts:

- PLATEAU `tran` full city: 15,641 features.
- PLATEAU third-mesh files overlapping the current West Maizuru DEM AOI are likely in the low thousands of features before filtering.
- OSM clipped to the DEM AOI is expected to be several hundred to about 1,500 ways/segments depending splitting and inclusion of service paths.

Sample count estimate:

- If clipped road length is 60-120 km:
  - 5 m spacing: about 12,000-24,000 samples.
  - 10 m spacing: about 6,000-12,000 samples.

Memory:

- Store sample lon/lat/elevation/threshold/distance as numbers: roughly 40-80 bytes/sample in JS object form, too wasteful but still acceptable at this scale.
- Prefer packed arrays or compact per-road sample arrays if sample count exceeds ~25,000.
- A compact AOI road JSON should be a few MB or less if geometry is simplified.

Preprocessing/app-load cost:

- DEM already loads 9 tiles.
- Connectivity already builds once over 9 * 256 * 256 cells.
- Road sample precompute can be done after DEM/connectivity load; 20,000 nearest-cell samples should be cheap.

Per tide update:

- O(sampleCount) numeric comparisons.
- No DEM fetch.
- No connectivity recomputation.
- No geometry rebuild.
- Style updates only for roads whose bucket changes.

Rendering:

- Several hundred to low-thousand polylines is reasonable if managed outside React.
- Avoid labels on every road by default.
- Add labels only for selected road or high-priority roads if needed.

## 14. Export Compatibility

Road records should be area-filterable and exportable later.

Design implications:

- Keep geometry in WGS84 lon/lat.
- Keep `totalLengthMeters` and sampled distances.
- Store source/provenance on each road.
- Store derived metrics separately by scenario/method.
- Include a bounding box per road for fast viewport/rectangle filtering.
- Later polygon filtering can use line clipping or sample-in-polygon approximation.

CSV/XLSX export columns can include:

- roadId
- source
- sourceFeatureId
- name
- roadClass
- tideLevelMeters
- method
- minGroundElevationMeters
- maxPotentialDepthMeters
- affectedLengthMeters
- totalLengthMeters
- affectedRatio
- trafficRegulation = `Not automatically determined`
- provenance

## 15. Census Small-Area Compatibility

The road architecture can support census small-area aggregation later if each road can be spatially intersected or sampled against small-area polygons.

Future aggregation options:

- Fast approximation: assign each road sample to a census small area, then sum sample-interval lengths.
- More precise: clip line segments to census polygons in preprocessing.

Future output:

```text
census small area
affected building count
affected facility count
affected road length
affected road ratio
```

No census data should be added in Phase 2B.

## 16. Backflow-Screening Feasibility

Current difference:

```text
elevation-only affected
MINUS
sea-connected affected
= low ground below tide that is not surface-connected to sea in the current DEM model
```

This must not be called actual backflow.

Feasible future label:

- Potential Backflow-Susceptible Lowland

Road layer usefulness:

- Low road corridors can identify where below-tide but non-surface-connected lowlands intersect transport corridors.
- Combining this with coastal proximity, river proximity, local depressions, and drainage outlet data could produce a screening layer for municipal review.

Limitations:

- The current sea-connected model does not model pipes, culverts, drains, flap gates, pumps, overtopping dynamics, rainfall, sewer capacity, or transient hydraulics.
- A non-surface-connected low road is not evidence of backflow.

Do not implement backflow scoring in Phase 2B.

## 17. Future Municipality Data

Most valuable minimum data for improving future backflow/traffic-management screening:

1. Drainage outlet coordinates.
2. Outlet invert/elevation or approximate outlet height.
3. Flap gate presence and operating status, if known.
4. Drainage area or catchment served by each outlet.
5. Culvert/underpass locations and road low-point locations.
6. Pump station coordinates, pump capacity class, and service area.
7. Known historical road-control points during storm surge events.

Even partial data helps:

- Outlet point only: proximity screening.
- Outlet + elevation: tide exceedance screening.
- Outlet + flap gate: separates likely protected vs unprotected backflow pathways.
- Outlet + drainage area: identifies which roads/facilities could be affected together.
- Historical control points: calibrates visualization and helps avoid arbitrary thresholds.

## 18. Known Limitations

- No official vehicle regulation thresholds are available.
- GSI DEM5A nearest-cell sampling can miss curb, crown, side ditch, and underpass details.
- DEM and tide datum alignment must remain carefully documented; do not reuse the PLATEAU building visual height offset.
- PLATEAU `tran` inspected attributes did not provide useful road hierarchy beyond generic road class and unknown function.
- OSM classification is practical but community-maintained and subject to ODbL obligations.
- Kyoto/Maizuru GIS road registry data may be useful but machine-readable access for municipal city-road routes is not confirmed.
- Cesium MVT support would require an additional library if using PLATEAU MVT directly, which should not be added without approval.
- This design identifies candidates for review, not legal traffic-control decisions.

## 19. Proposed Implementation Phases

Phase 2B.1: Data-source proof

- Choose OSM primary or PLATEAU-primary fallback.
- Produce a tiny clipped West Maizuru road extract.
- Record source URL, license, retrieval date, and processing method.
- Do not yet add UI thresholds.

Phase 2B.2: Road domain and sampling

- Add typed road domain model.
- Load AOI road extract.
- Precompute 5 m samples against existing DEM/connectivity.
- Compute impact metrics for current tide/method.

Phase 2B.3: Cesium road layer

- Add imperative road layer using batched polylines.
- Add tide/method style updates.
- Add road picking and inspector without disturbing existing facility/building priority.

Phase 2B.4: Performance and copy hardening

- Measure FPS and heap with roads on/off.
- Confirm no PLATEAU pending regression.
- Ensure all wording says candidate / potential impact.

Phase 2B.5: Export and aggregation preparation

- Add bbox/sample metadata for area filtering.
- Defer actual CSV/XLSX and census-area implementation to future phases.

## 20. Research Sources

- PLATEAU CityGML API docs: https://docs.plateauview.mlit.go.jp/datasets/citygml/
- PLATEAU 3D Tiles / MVT docs: https://docs.plateauview.mlit.go.jp/datasets/3d-tiles/
- PLATEAU data catalog API queried on 2026-08-30:
  - `https://api.plateauview.mlit.go.jp/datacatalog/citygml/26202`
  - `https://api.plateauview.mlit.go.jp/datacatalog/plateau-datasets`
  - `https://api.plateauview.mlit.go.jp/datacatalog/mvt/26202-tran-lod1-2025/tilejson.json`
  - `https://api.plateauview.mlit.go.jp/datacatalog/mvt/26202-tran-lod2-2025/tilejson.json`
- Maizuru PLATEAU page: https://www.city.maizuru.kyoto.jp/kurashi/0000015169.html
- OpenStreetMap copyright/license: https://www.openstreetmap.org/copyright
- Geofabrik download/license notes: https://www.geofabrik.de/data/download.html
- GSI Fundamental Geospatial Data site: https://web2.gsi.go.jp/kiban/index.html
- GSI Electronic National Base Map overview: https://www.gsi.go.jp/kibanjoho/mapinfo_what.html
- Kyoto integrated GIS open data list: https://g-kyoto.gis.pref.kyoto.lg.jp/g-kyoto/OpenData
- Maizuru road-register / recognized route map page: https://www.city.maizuru.kyoto.jp/0000010885.html
- National Land Numerical Information old road dataset reference: https://nlftp.mlit.go.jp/ksj/gmlold/datalist/gmlold_KsjTmplt-N01.html
