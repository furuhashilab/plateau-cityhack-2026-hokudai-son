# AI Handoff

## Last Updated

2026-09-01

## Updated By

Codex (GPT-5)

## Current Phase

Phase 2D — Child-friendly Map-first UI Refactor

## Current Goal

Make the current 3D Maizuru experience understandable to elementary school users by making the map dominant, moving technical details into disclosure controls, and using simple Japanese labels.

## Phase 2D Status

Status: PASS as of 2026-09-01.

Implementation:

- The initial screen is map-first: small `PLATEAU 2025 / 舞鶴の3D都市` badge, one primary water panel, one collapsed Urban Functions panel, and one collapsed advanced panel.
- Empty selected-building inspector is no longer shown.
- FPS, heap, tile counts, DEM toggle, data provenance, and PLATEAU technical details are hidden behind `詳しく見る`.
- The water panel is the primary visible control and starts open with `海の水を上げてみよう`, current water level, inundation toggle, and tide slider.
- Inundation method labels are now child-friendly Japanese:
  - `Sea-connected` -> `海から水が入る場所`
  - `Elevation-only` -> `海より低い場所`
- Urban Functions are collapsed by default as `街の施設を見る`, with compact child-friendly labels:
  - Medical -> `病院`
  - Evacuation -> `避難できる場所`
  - Transport -> `交通`
  - Daily Life -> `くらし`
- Potential impact copy is now `水の影響を受けるかも`; unaffected copy is `だいじょうぶそう`.
- Future facility entry copy is now `未来の病院を置く` etc.
- Placement mode displays `地図をクリックして未来の病院を置いてみよう`.
- Future Facility inspector puts the plain result first:
  - `この場所は水の影響を受けなさそう`
  - `この場所は水の影響を受けるかも`
- Facility and building inspectors now use Japanese labels.
- Road inspector labels were translated but still explicitly avoids access/closure claims.
- Initial camera moved closer and shallower to make the 3D city read less like a flat GIS overview.

Runtime verification:

- Dev server used: `http://127.0.0.1:5173/`
- Chrome remote debugging used on port `9224`.
- 1440x900 initial visible UI area measured about `14.4%`, down from prior audit's about `43.6%` panel area.
- Initial screenshot: `/tmp/plateau-phase2d-final-initial.png`
- Urban panel open screenshot: `/tmp/plateau-phase2d-final-open.png`
- Water slider was immediately visible and updated to `+2.0 m`.
- Urban panel could be expanded; Medical focus worked.
- Future Medical placement guide appeared, placement worked, and the proposed-facility inspector showed the simplified result first.
- Advanced panel revealed DEM/status details when opened.
- Real facility picking verified.
- Building picking verified.
- Road picking verified.
- Road stats remained `48` road features and `1,400` samples.
- Runtime performance observed: FPS ranged about `33-58` during automated interaction with advanced/details open; JS heap about `136-142 MB`; loaded building tile sample about `97 loaded / 0 pending`.

Static verification:

- `git diff --check`: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS

Known limitations:

- Urban Functions panel still becomes tall when opened; acceptable for this pass but should become a smaller bottom sheet or step card later.
- The water panel is much clearer but still occupies the lower center of the city view.
- Terrain map labels and contour lines remain visually strong; further PLATEAU-first polish may need basemap/imagery tuning.
- Non-fatal Cesium internal `DeveloperError` promise noise remains during reload.

## Phase 2C.2 Status

Status: PASS as of 2026-09-01.

Implementation:

- `src/types/futureFacility.ts` defines a single `FutureFacilityScenario`.
- `src/cesium/futureFacilityLayer.ts` renders one distinct scenario marker and label.
- `src/components/SelectedFutureFacilityPanel.tsx` inspects the proposed facility and supports Remove.
- `src/components/UrbanFunctionsControl.tsx` adds `+ Future ...` placement actions and a current/with-proposal comparison for the proposal category.
- `src/components/CesiumViewport.tsx` consumes placement-mode map clicks, samples DEM and sea-connectivity, recalculates future facility impact on tide/method changes, and keeps road/facility/building picking intact in normal mode.
- `src/data/urbanFunctions.ts` exposes `computeScenarioPointImpact()` so real facilities and proposed facilities reuse the same inundation semantics.

Scope:

- Supports one proposed facility at a time.
- Placement actions are available for Medical, Evacuation, Transport, and Daily Life; MVP verification focused on Future Medical.
- Road layer remains visual context only. No route/accessibility claim is made.
- No optimization, best-location recommendation, resilience score, routing, network graph, census aggregation, CSV/XLSX, full-road expansion, or backflow layer was added.

Runtime verification:

- Dev server used: `http://127.0.0.1:5174/`
- Chrome remote debugging used on port `9224`.
- Future Medical placement verified.
- Scenario marker and `Future Medical Facility` label verified through Cesium layer state and selected panel.
- Selected Future Facility panel showed longitude, latitude, ground elevation, scenario tide, method, sea-connected state, potential depth, scenario provenance, and Remove.
- Remove verified; future hook became `null`, panel returned to default selected-building prompt, and comparison disappeared.
- Re-placement verified at a second map location.
- Tide/method verification for placed Future Medical:
  - Elevation-only at `0`, `1`, `1.5`, `2 m` updated future impact and Medical with-proposal counts.
  - Sea-connected at `0`, `1`, `1.5`, `2 m` updated future impact and Medical with-proposal counts.
- A proposal that was currently unaffected incremented Medical with-proposal unaffected count.
- A proposal that was potentially affected incremented total but did not increment unaffected count.
- Urban Function focus still worked; Evacuation focus was verified after placement.
- Real facility picking verified with `文化公園体育館`.
- Building picking verified with a PLATEAU building identifier panel.
- Road picking verified with an OSM road panel.
- Road stats remained `48` road features and `1,400` samples.
- Runtime status observed: Ready, PLATEAU `125 loaded / 0 pending`, FPS about `57-61`, JS heap about `153-235 MB`.

Known runtime notes:

- Reload still reports non-fatal Cesium internal `DeveloperError` promise exceptions; the app remains Ready.
- Chrome emits local keychain/updater/crashpad noise unrelated to app behavior.

## Latest Restoration Status

Status: PASS as of 2026-09-01.

The current worktree keeps the Phase 2B.1 road implementation and restores the missing Phase 2C.1 Urban Function integration without reset/restore/clean/stash/commit/push.

Restored connections:

- `src/app/App.tsx` now owns Urban Function impact state and focused facility category state.
- `UrbanFunctionsControl` receives `summaries`, `focusedCategory`, and `onFocusChange`.
- `src/components/CesiumViewport.tsx` computes and publishes `computeUrbanFunctionImpactState()` from current DEM, sea-connectivity, tide, and inundation method.
- `src/cesium/facilityLayer.ts` supports `setDisplay({ visibility, focusedCategory, affectedFacilityIds })`.
- Facility markers de-emphasize unfocused categories and use stronger styling for potentially affected facilities.
- Dev hook `window.__PLATEAU_URBAN_FUNCTION_SUMMARIES__` is restored.
- Facility picking uses shared `computeFacilityScenarioImpact()` for facility impact values.

Verification after restoration:

- `npm run typecheck`: PASS
- `npm run build`: PASS
- Runtime URL used: `http://127.0.0.1:5174/`
- Chrome remote debugging used on port `9224`.
- Runtime Ready observed with PLATEAU `125 loaded / 0 pending`, FPS `60`, JS heap about `158 MB`.
- Urban Function panel displayed Medical, Evacuation, Transport, Daily Life.
- Runtime summaries reacted to tide `0`, `1`, `1.5`, `2 m` in both Elevation-only and Sea-connected modes.
- Focus verified for Medical, Evacuation, Transport, Daily Life; All mode cleared focus.
- Road stats hook reported `48` road features and `1,400` samples.
- ContextLimits hook reported actual `MAX_VERTEX_TEXTURE_IMAGE_UNITS = 16`, Cesium before `0`, after `16`, patched `true`.
- Facility picking verified with `あいおい橋四方クリニック`.
- Building picking verified with a PLATEAU building identifier panel.
- Road picking verified with Road panel opening for an OSM tertiary road.

Runtime notes:

- Reload still reports non-fatal Cesium `DeveloperError` promise exceptions from Cesium internals; app remains Ready.
- Chrome process also emitted local updater/keychain/crashpad noise unrelated to app behavior.

Current classification:

- Phase 2B.1: retained and functioning.
- Phase 2C.1: restored and functioning.

## Phase 2C.1 Status

Status: PASS as of 2026-08-31.

The current worktree is authoritative. Do not reset, clean, rebuild Phase 2B.1, or commit Phase 2C.1 before user review.

Urban Function summary model:

- `src/data/urbanFunctions.ts` defines `UrbanFunctionSummary` and `UrbanFunctionImpactState`.
- Summaries are derived from the existing 18 real facilities, current tide level, current inundation method, DEM ground elevation, and sea-connectivity thresholds.
- No arbitrary resilience score, weighting model, closure status, or accessibility claim is introduced.
- Per category, the UI reports total facilities, potentially affected facilities, currently unaffected facilities, and affected ratio.

Facility impact calculation reuse:

- `computeFacilityScenarioImpact()` is the shared facility scenario helper.
- Facility picking and Urban Function summaries both use the same helper.
- Flood semantics remain the existing facility/inundation semantics:
  - Elevation-only: depth from `inundationDepth(tide, groundElevation)`.
  - Sea-connected: depth is 0 when the sampled sea-connectivity threshold is not reached.
  - Potentially affected means `depthMeters > 0`.
- The PLATEAU visual `heightOffsetMeters: -36` is not used for facility/urban-function calculations.

UI / focus behavior:

- `src/components/UrbanFunctionsControl.tsx` is now a compact Urban Functions panel.
- It shows Medical, Evacuation, Transport, and Daily Life cards with actual counts.
- Clicking a category sets a separate focus state rather than changing the four visibility toggles.
- The existing facility category checkboxes remain available as visibility controls.
- The `All` button clears focus in one action.
- Focused facilities remain prominent; unfocused visible categories are de-emphasized; potentially affected facilities use stronger orange styling.
- Labels use "potentially affected", not destroyed/closed/unavailable.

Cesium integration:

- `src/cesium/facilityLayer.ts` now supports `setDisplay({ visibility, focusedCategory, affectedFacilityIds })`.
- `src/components/CesiumViewport.tsx` computes Urban Function summaries whenever tide, method, DEM/connectivity, visibility, or focus changes require a display refresh.
- Dev-only summary hook: `window.__PLATEAU_URBAN_FUNCTION_SUMMARIES__`.
- Road impact remains visible and functional as visual context; no road-network accessibility analysis is claimed.
- Verified Facility ↔ PLATEAU building highlighting is retained for verified links only.

Runtime verification:

- Dev server used: `http://127.0.0.1:5174/`
- Browser: Chrome remote debugging on port `9224`.
- All Urban Functions mode verified.
- Category focus verified for Medical, Evacuation, Transport, and Daily Life.
- All mode / clear focus verified.
- Facility picking verified with `あいおい橋四方クリニック`; inspector showed PLATEAU link `Verified`.
- Building picking verified; Selected Building panel opened with PLATEAU identifier.
- Road picking verified at CSS coordinate approximately `(500, 610)`; Road panel opened with road class/source/tide/method/length/traffic-regulation fields.
- Road layer remained present with `48` road features and `1,400` samples.

Tide / method verification:

- Elevation-only:
  - `0.0 m`: Medical `0/6`, Evacuation `0/8`, Transport `0/1`, Daily Life `0/3`
  - `1.0 m`: Medical `2/6`, Evacuation `0/8`, Transport `0/1`, Daily Life `0/3`
  - `1.5 m`: Medical `2/6`, Evacuation `2/8`, Transport `0/1`, Daily Life `0/3`
  - `2.0 m`: Medical `2/6`, Evacuation `4/8`, Transport `0/1`, Daily Life `1/3`
- Sea-connected:
  - `0.0 m`: Medical `0/6`, Evacuation `0/8`, Transport `0/1`, Daily Life `0/3`
  - `1.0 m`: Medical `2/6`, Evacuation `0/8`, Transport `0/1`, Daily Life `0/3`
  - `1.5 m`: Medical `2/6`, Evacuation `2/8`, Transport `0/1`, Daily Life `0/3`
  - `2.0 m`: Medical `2/6`, Evacuation `4/8`, Transport `0/1`, Daily Life `1/3`

Performance / runtime:

- Runtime Ready status after Phase 2C.1 verification: PLATEAU `125 loaded / 0 pending`, FPS `59-60`, JS heap typically about `139-162 MB` after interaction; one immediate reload sample briefly reported `298 MB` before settling.
- Road preprocessing remained about `0.9-1.4 ms`.
- Road tide/style updates remained about `0.5 ms`.
- Urban Function summary computation is trivial for 18 facilities and adds no measurable Cesium processing cost.

Regression verification:

- PLATEAU buildings visible.
- DEM / Ground Elevation control remained available.
- Inundation layer remained visible and tide/method reactive.
- Facility category toggles remained interactive.
- Facility inspector remained usable.
- Verified building highlight behavior remained tied to verified facility links.
- Building inspector remained usable.
- Road layer remained visible/functioning; road picking and road inspector remained usable.
- Tide slider and Elevation-only / Sea-connected switch updated Urban Function counts and road impact without DEM resampling or road geometry rebuild.

Console notes:

- No catastrophic render error was present; app status remained Ready.
- Chrome console still reports non-fatal Cesium `DeveloperError` exceptions from `BillboardTexture`/texture-atlas async handling during dev reload, plus a favicon `404`.
- These do not block Phase 2C.1 behavior and appear separate from the Urban Function summary/focus logic; keep classified as known Cesium dev-runtime noise unless they become user-visible or fatal.

Known limitations:

- Unknown facility DEM/connectivity samples would currently count as not affected because no positive depth can be calculated.
- Urban Function focus is categorical visual exploration, not service-area or network accessibility analysis.
- Road impact remains a small AOI screening layer, not full West Maizuru and not an official traffic-regulation model.
- No facility placement, future city editing, network lines, routing, resilience score, census aggregation, or backflow layer is implemented in Phase 2C.1.

Changed files in Phase 2C.1 worktree:

- `src/data/urbanFunctions.ts`
- `src/components/UrbanFunctionsControl.tsx`
- `src/cesium/facilityLayer.ts`
- `src/cesium/picking.ts`
- `src/components/CesiumViewport.tsx`
- `src/app/App.tsx`
- `src/styles.css`
- `docs/AI_HANDOFF.md`

Static verification:

- `npm run typecheck`: PASS
- `npm run build`: PASS

Recommended next action:

- User review of the Urban Function panel and demo flow.
- Next product phase should continue toward interactive city/urban-function experience, not further road-only expansion.

Previous Phase 2B.1 status retained below for context.

## Phase 2B.1 Status

Status: PASS as of 2026-08-31.

The current worktree is authoritative. Do not reset, clean, or rebuild the Phase 2B.1 implementation from scratch.

Road source:

- Static runtime data: `src/data/roads/westMaizuruRoadProof.json`
- Source: OpenStreetMap, attribution `OpenStreetMap contributors`, ODbL 1.0
- Retrieval date: 2026-08-30
- Runtime does not query Overpass or OpenStreetMap.

AOI:

- South `35.4430`
- West `135.3260`
- North `35.4518`
- East `135.3378`
- Small West Maizuru station / Isazu lowland proof AOI only.

Dataset retained:

- Road features: `48`
- Samples: `1,400`
- Invalid samples: `10`
- Total road length: `6,630.2 m`
- Classes: `primary: 7`, `tertiary: 20`, `unclassified: 21`
- Sampling: approximately 5 m fixed interval along clipped OSM LineStrings, endpoints included.

Domain architecture:

- `src/types/road.ts` defines `RoadDataset`, `RoadFeature`, `RoadSample`, `RoadImpactMetrics`, and `RoadSelection`.
- `src/data/roads.ts` loads the static JSON and computes metrics from precomputed samples.
- Road flood logic is shared with the existing inundation model:
  - Elevation-only: `groundElevation < tide`
  - Sea-connected: `groundElevation < tide && seaConnectionThreshold <= tide`
  - Depth: `max(0, tide - groundElevation)`
- PLATEAU visual `heightOffsetMeters: -36` is not used in road/DEM calculations.

Impact metric implementation:

- `computeRoadImpactMetrics()` calculates valid sample count, affected sample count, minimum ground elevation, maximum/mean potential depth, affected length, and affected ratio.
- `affectedLengthMeters` uses interval-based accumulation: full interval when both adjacent valid samples are affected, half interval when exactly one endpoint is affected, skip invalid intervals.

Cesium road rendering:

- Final architecture: one `GroundPolylinePrimitive` added to `viewer.scene.groundPrimitives`, with one `GeometryInstance` per road and `PolylineColorAppearance` for per-instance color.
- `PolylineCollection` was abandoned because this environment reported `Vertex texture fetch support is required to render polylines`.
- Initial `GroundPolylinePrimitive + PerInstanceColorAppearance` also failed after the vertex-texture patch with `TypeError: Cannot read properties of undefined (reading '_uniforms')`; Cesium expects `PolylineColorAppearance` for GroundPolylinePrimitive per-instance colors.
- Initial colors are baked into `GeometryInstance` attributes because `getGeometryInstanceAttributes()` cannot be called before the primitive first updates.
- Later tide/method changes update per-instance color attributes only. Geometry, DEM sampling, and connectivity are not rebuilt.

ContextLimits investigation:

- Actual Chrome/WebGL `MAX_VERTEX_TEXTURE_IMAGE_UNITS`: `16`
- Cesium `ContextLimits.maximumVertexTextureImageUnits` before compatibility patch: `0`
- Patched value: `16`
- Patch location: `src/cesium/plateauLayer.ts`, extending the existing `applyContextLimitMinimums()` compatibility workaround.
- Patch rule: only applies when Cesium reports `<= 0` and the actual WebGL value read from the viewer's GL context is a positive number. It does not spoof support when real WebGL reports 0.
- Runtime debug report in dev: `window.__PLATEAU_CONTEXT_LIMITS__`.

Picking and inspector:

- Picking priority remains: facility, building, road, empty.
- Road picking supports Cesium primitive pick id plus screen-space nearest-line fallback plus geodetic nearest-line fallback from click position.
- Verified road click at CSS coordinate approximately `(417, 649)` opened Road Inspector.
- Verified facility click for `あいおい橋四方クリニック` still opened Facility Inspector with PLATEAU link `Verified`.
- Verified building click still opened Selected Building panel with a PLATEAU `Identifier`.
- Road Inspector fields verified: Name, Road class, Source, Scenario tide, Method, Minimum elevation, Maximum potential depth, Affected length, Total length, Affected ratio, Traffic regulation `Not automatically determined`.

Tide / method verification:

- Selected road: `unclassified`, total length `128 m`, minimum elevation `0.9 m`.
- Elevation-only:
  - `0.0 m`: depth `0.0 m`, affected length `0 m`, ratio `0%`
  - `1.0 m`: depth `0.1 m`, affected length `45 m`, ratio `35%`
  - `1.5 m`: depth `0.6 m`, affected length `128 m`, ratio `100%`
  - `2.0 m`: depth `1.1 m`, affected length `128 m`, ratio `100%`
- Sea-connected:
  - `0.0 m`: depth `0.0 m`, affected length `0 m`, ratio `0%`
  - `1.0 m`: depth `0.0 m`, affected length `0 m`, ratio `0%`
  - `1.5 m`: depth `0.6 m`, affected length `128 m`, ratio `100%`
  - `2.0 m`: depth `1.1 m`, affected length `128 m`, ratio `100%`

Performance / runtime:

- Dev server used: `http://127.0.0.1:5174/`
- Runtime final Ready status: initial load `0.91 s`, interactive `0.91 s`, PLATEAU `139 loaded / 0 pending`, FPS `60`, JS heap about `156-157 MB`.
- Road layer preprocessing time: about `1.1 ms`.
- Tide/method road style update time: about `0.3-0.6 ms`.
- Road stats dev hook: `window.__PLATEAU_ROAD_STATS__`.

Regression verification:

- PLATEAU buildings visible.
- DEM data loaded; Ground Elevation control enabled and toggle state restored after testing.
- Inundation layer visible and responds to tide/method controls.
- Facilities visible; category toggles remain interactive.
- Facility inspector, building inspector, road inspector, tide slider, and Elevation-only / Sea-connected switch verified.
- No catastrophic Cesium road rendering error after final renderer.
- Known pre-existing Cesium/WebGL framebuffer/texture-atlas warnings from prior phases remain classified as existing technical debt if they appear; no new Phase 2B.1 fatal render error was present in final runtime state.

Known limitations:

- Road data is a small OSM proof subset, not full West Maizuru.
- OSM centerlines are not official municipal road-regulation segments.
- No traffic regulation threshold, closure rule, slow-driving rule, danger label, or automatic regulatory decision is encoded.
- DEM sampling uses nearest DEM cell and sea-connectivity terrain screening; this is not hydraulic/drainage/backflow simulation.
- Dev-only runtime hooks expose `__PLATEAU_CONTEXT_LIMITS__`, `__PLATEAU_ROAD_STATS__`, and `__PLATEAU_VIEWER__` for verification.

Changed files in Phase 2B.1 worktree:

- `src/types/road.ts`
- `src/data/roads.ts`
- `src/data/roads/westMaizuruRoadProof.json`
- `src/components/SelectedRoadPanel.tsx`
- `src/cesium/roadLayer.ts`
- `src/cesium/picking.ts`
- `src/cesium/plateauLayer.ts`
- `src/components/CesiumViewport.tsx`
- `src/app/App.tsx`
- `src/styles.css`
- `scripts/build-road-proof-data.mjs`
- `docs/ROAD_DATA_MANIFEST.md`
- `docs/AI_HANDOFF.md`

Static verification:

- `npm run typecheck`: PASS
- `npm run build`: PASS

Recommended next action:

- Stop extending road-only functionality for now unless a demo-critical bug appears.
- Return to the product direction: Urban Function UI / interactive city experience that connects storm surge, buildings/facilities, roads/access, weakened urban functions, and future facility placement.

Previous Phase 2B research status retained below for context.

## Phase 2B Research Status

Phase 2B research / architecture spike was completed on 2026-08-30 in `/Users/Rito/plateau-cityhack-2026-hokudai-son-git`.

Status:

- PASS
- Research/design only.
- No road layer implementation.
- No dataset download or committed data extract.
- No dependency changes.
- No ContextLimits / framebuffer workaround changes.
- No commit or push.

Deliverable:

- `docs/ROAD_IMPACT_RESEARCH.md`

Main recommendation:

- Use a hybrid approach.
- Use OpenStreetMap-derived centerlines as the Phase 2B analysis geometry because they provide practical centerline ways and `highway` classifications for segment metrics.
- Keep PLATEAU Maizuru 2025 `tran` as official PLATEAU reference/validation data and possible future surface visualization.
- Consider Kyoto/Maizuru road registry data later if machine-readable export and license are confirmed.

PLATEAU road feasibility findings:

- Maizuru PLATEAU city code `26202`, year `2025`, spec `5.0` includes `tran` = traffic road model.
- CityGML `tran`: 82 files, 15,641 features, 44,498,495 bytes, max LOD 2.
- PLATEAU delivery also includes:
  - `26202_tran_lod1`, MVT, z10-16, layer `Road`, file size 9,752,394 bytes.
  - `26202_tran_lod2`, MVT, z10-16, layers `TrafficArea` and `AuxiliaryTrafficArea`, file size 1,194,757 bytes.
- A sample CityGML feature had `tran:Road`, `gml:id`, `gml:name`, `tran:class`, `tran:function`, `uro:RoadStructureAttribute`, and `tran:lod1MultiSurface`.
- Attribute API resolved one sample to `tran:class=道路`, `tran:function=不明`, and section type `土工区間・通常区間`.
- PLATEAU `tran` is official and usable after preprocessing, but weaker for immediate traffic-management analytics because it is surface-geometry oriented and inspected classification is sparse/unknown.

Recommended road impact architecture:

- Preprocess or load clipped AOI road lines.
- Precompute road samples once after DEM/connectivity are available.
- Store per-sample ground elevation and sea-connection threshold.
- On tide/method changes, recompute metrics with numeric comparisons only.
- Do not resample DEM or rebuild road geometry on every slider update.

Recommended sampling:

- Fixed 5 m spacing along road centerlines, always including endpoints.
- If sample count becomes too high, use 10 m for minor roads and 5 m for important classes.
- This matches the current GSI DEM5A nominal resolution and is explainable for CityHack.

Recommended metrics:

- Visualization drivers: maximum potential depth, affected ratio, affected length, road class.
- Inspector/export metrics: min/mean/max elevation, max/mean potential depth, affected length, total length, affected ratio, affected sample count, sample count, tide, method, source/provenance.
- No automatic closure/slow-driving determination without authoritative thresholds.

Rendering recommendation:

- Avoid one React component per road.
- First implementation should use preprocessed static JSON/GeoJSON and Cesium primitive-level batched polylines, likely `PolylineCollection` for the first measurable prototype.
- Consider `GroundPolylinePrimitive` later only if visual ground-following is necessary.
- Keep picking priority from Phase 2A.1 behavior: facility, building, road, empty.

Future compatibility:

- Road model should include provenance, WGS84 geometry, bbox, total length, samples, and scenario-derived metrics for later viewport/rectangle/polygon/census filtering and CSV/XLSX export.
- Census small-area aggregation can use sample-in-polygon approximation first, then line clipping later.
- Backflow-related future work should use only cautious wording such as `Potential Backflow-Susceptible Lowland`; the elevation-only minus sea-connected difference is not actual backflow.
- Most valuable future municipal data: drainage outlet coordinates, outlet elevation, flap gate presence/status, drainage area, culvert/underpass/low-point locations, pump information, and historical road-control points.

Verification:

- Startup Git state was clean on `main`.
- Read-only preflight was performed:
  - `pwd`: `/Users/Rito/plateau-cityhack-2026-hokudai-son-git`
  - `git branch --show-current`: `main`
  - `git status --short`: clean before edits
  - `git diff --stat`: empty before edits
  - `git log --oneline -5`: latest commit `88ba441 Link urban facilities to PLATEAU buildings`
- `/Users/Rito/RESEARCH_MAC_OPERATING_RULES.md` was not visible at that absolute path in the sandbox, but the repository-local `RESEARCH_MAC_OPERATING_RULES.md` was read and followed.
- No runtime browser verification was run because this phase is documentation-only.

Changed files in Phase 2B research:

- `docs/ROAD_IMPACT_RESEARCH.md`
- `docs/AI_HANDOFF.md`

Exact next action:

- Await user review of `docs/ROAD_IMPACT_RESEARCH.md`.
- Do not implement roads until the road source and Phase 2B.1 scope are approved.

Previous Phase 2A.1 status retained below for context.

## Phase 1A Result

PASS — Real Maizuru PLATEAU Viewer PoC is accepted as of 2026-08-26.

## Current Status

Phase 2A.1 was implemented on 2026-08-30 in the GitHub-connected main-branch workspace `/Users/Rito/plateau-cityhack-2026-hokudai-son-git`. The old backup directory `/Users/Rito/Plateau_cityhack_challenge2026` was not modified.

Phase 2A.1 status:

- CONDITIONAL PASS
- Link status model is now explicit: `verified`, `candidate`, `unlinked`.
- Total facilities: 18
- Verified: 12
- Candidate: 5
- Unlinked: 1
- Medical: 6 verified / 0 candidate / 0 unlinked
- Evacuation: 3 verified / 4 candidate / 1 unlinked
- Transport: 0 verified / 1 candidate / 0 unlinked
- Daily Life: 3 verified / 0 candidate / 0 unlinked

Linking architecture:

- Facility records keep their original longitude, latitude, source, provenance, and category.
- Each facility can store `plateauBuildingId`, `plateauLinkStatus`, `plateauLinkMethod`, and `plateauLinkNote`.
- Candidate IDs are allowed but are not treated as confirmed links.
- The data model does not require unique building IDs, so one PLATEAU building can be associated with multiple facility records.
- Verified facility selection searches the current screen neighborhood with `scene.drillPick()`, excludes facility primitives, and highlights only a matching PLATEAU `gml_id`.
- Candidate and unlinked facility selection never highlights a PLATEAU building as confirmed.

Manual verification:

- Runtime metadata investigation used the loaded Maizuru 2025 PLATEAU tiles and top-down camera checks around facility representative coordinates.
- Inspected metadata included `gml_id`, `bldg:usage`, `bldg:measuredHeight`, `uro:BuildingIDAttribute_uro:buildingID`, area fields, and `_xmin/_xmax/_ymin/_ymax`.
- Verified links were not assigned by nearest building, visual appearance, building size, or PLATEAU usage alone.

Priority facility results:

- Medical `あいおい橋四方クリニック`: verified, `bldg_f2bae1b9-d8cf-457c-a401-d0bbd82e4a17`, PLATEAU usage `文教厚生施設`, measured height `8.16 m`, buildingID `26202-bldg-13389`.
- Evacuation `文化公園体育館`: unlinked. Top-down and wider surrounding-pixel search returned no safe PLATEAU building candidate at the representative coordinate.
- Transport `西舞鶴駅・西駅交流センター`: candidate, `bldg_7a483d82-09ca-4df8-8d7e-67b830a1e111`. The co-located representative coordinate picks this feature, but PLATEAU usage is `共同住宅` and the coordinate is an adjacent AOI representative point, so it is not verified as the station/exchange-center building.
- Daily Life `フクヤ 西舞鶴店`: verified, `bldg_2f9d9621-1bc9-4b43-a516-a74d9f57ce97`, PLATEAU usage `商業施設`, measured height `9.91 m`, buildingID `26202-bldg-6886`.

Co-located handling:

- `evac-west-station-center` and `transport-nishi-maizuru` keep the exact same longitude/latitude.
- Both carry the same candidate PLATEAU building ID.
- This is not treated as a data error; the model permits one building to support multiple urban functions.
- Neither is verified because the picked feature and source-coordinate caveat are not sufficient for a confirmed station/exchange-center link.

Runtime verification:

- Dev server: `http://127.0.0.1:5173/`
- Chrome check after final reload: Ready, 127 loaded / 0 pending, 60 FPS, 160 MB UI JS heap.
- Priority facility click checks:
  - Medical: `あいおい橋四方クリニック`, details displayed, PLATEAU link `Verified`, building ID displayed.
  - Evacuation: `文化公園体育館`, details displayed, PLATEAU link `Unlinked`, no building ID.
  - Transport: selected from co-located category offset, details displayed, PLATEAU link `Candidate`, building ID displayed as candidate.
  - Daily Life: `フクヤ 西舞鶴店`, details displayed, PLATEAU link `Verified`, building ID displayed.
- Building highlight: verified `フクヤ 西舞鶴店` selection highlighted the linked PLATEAU building in cyan in the runtime screenshot; candidate transport remained a candidate and was not confirmed-highlighted.
- Ground elevation, tide, sea-connected inundation fields remained visible in facility details.
- PLATEAU building picking was spot-checked during co-located click testing and still opened the selected-building panel.
- Console still reports the known non-blocking Cesium/WebGL `DeveloperError` classified below as existing technical debt; this was not modified.

Static verification:

- `npm run typecheck`: PASS
- `npm run build`: PASS

Changed files in Phase 2A.1:

- `src/types/facility.ts`
- `src/data/facilities/westMaizuruFacilities.json`
- `src/cesium/picking.ts`
- `src/components/SelectedFacilityPanel.tsx`
- `src/styles.css`
- `docs/FACILITY_DATA_MANIFEST.md`
- `docs/AI_HANDOFF.md`

Exact next action:

- Await user review. Next recommended phase is README refresh as a separate task, not scores/networks.

Previous Phase 2A status retained below for context.

Phase 2A final verification/co-location/performance attribution was performed on 2026-08-27. The original label-clamping crash remains fixed, facility primitive collections are confirmed to exist at runtime, all four categories can now be selected from the normal camera, facility details and tide integration work, and Facilities ON/OFF does not explain the previously observed FPS drop. The remaining framebuffer/texture-atlas error was diagnosed separately on fresh tabs and is now treated as existing Cesium technical debt rather than a Phase 2A blocker.

Phase 2A final status:

- PASS with Known Technical Debt
- Core facility rendering, four-category picking, details, inundation integration, and performance attribution are verified.
- Remaining issue is a non-blocking Cesium/WebGL framebuffer/texture-atlas DeveloperError in console.

Framebuffer diagnostics:

- Exact error: `The number of color attachments exceeds the number supported.`
- Stack: `Framebuffer` -> `TextureAtlas._copyFromTexture` -> `TextureAtlas._resize` -> `TextureAtlas._processImageQueue` -> `TextureAtlas.update` -> `Scene.render` -> `CesiumWidget.render`
- First occurrence timing: fresh load, about `454-524 ms` after navigation, before any camera move or picking, and before the post-load layer-toggle actions in the matrix runs.
- Layer isolation matrix on fresh tabs:
  - `PLATEAU only`: reproduced, first rejection at `454.4 ms`, 21 rejections
  - `+ Ground`: reproduced, first rejection at `507.9 ms`, 21 rejections
  - `+ Inundation`: reproduced, first rejection at `523.7 ms`, 21 rejections
  - `+ Facilities`: reproduced, first rejection at `518.8 ms`, 21 rejections
  - `All`: reproduced, first rejection at `512.8 ms`, 21 rejections
- Picking relation: none. The error appears before picking and can be reproduced without any click.
- Facility relation: related as a trigger path because the stack is in `LabelCollection` / `TextureAtlas`, but the root cause is not in the facility implementation itself.
- WebGL capability check in the same Chrome context:
  - Browser WebGL `MAX_COLOR_ATTACHMENTS = 8`
  - Browser WebGL `MAX_DRAW_BUFFERS = 8`
  - Browser WebGL `MAX_TEXTURE_SIZE = 16384`
  - Browser WebGL `MAX_RENDERBUFFER_SIZE = 16384`
  - Cesium `ContextLimits` still reported mismatched/low internal values (`_maximumColorAttachments: 0`, `_maximumDrawBuffers: 0`, `_maximumTextureSize: 1024`, `_maximumRenderbufferSize: 16`), which is consistent with existing Cesium context-limit debt rather than a browser capability problem.
- Normal Chrome vs CDP: no separate non-debug Chrome surface was available in this workspace, so the reproduced evidence is from the CDP-controlled Chrome instance only.
- Classification: `B` Existing Cesium technical debt.

Latest Phase 2A verification:

- Runtime primitive existence: `18` PointPrimitives and `18` Labels.
- Transport verification: PASS. `transport-nishi-maizuru` / `西舞鶴駅・西駅交流センター` is selectable from the normal camera after co-located label offset and screen-space picking fallback.
- Daily Life verification: PASS. `daily-fukuya` / `フクヤ 西舞鶴店` is selectable from the normal camera.
- Four-category click result:
  - Medical: PASS, `あいおい橋四方クリニック`
  - Evacuation: PASS, `文化公園体育館`
  - Transport: PASS, `西舞鶴駅・西駅交流センター`
  - Daily Life: PASS, `フクヤ 西舞鶴店`
- Facility details verified for selected facilities: name, category, type, ground elevation, scenario tide, inundation method, connected-to-sea state, potential depth, status, source, provenance, and PLATEAU building `Unlinked`.
- Inundation integration verified beyond Medical using `daily-fukuya`:
  - 0.0 m: connected to sea `No`, depth `0.0 m`, status `Safe`
  - 1.0 m: connected to sea `No`, depth `0.0 m`, status `Safe`
  - 2.0 m: connected to sea `Yes`, depth `0.5 m`, status `Shallow`
- Co-location groups: one exact coordinate match.
  - `evac-west-station-center` / `西駅交流センター` / Evacuation
  - `transport-nishi-maizuru` / `西舞鶴駅・西駅交流センター` / Transport
  - Coordinate difference: `0.000 m`; longitude/latitude are unchanged.
- DrillPick/co-location finding: at the co-located projected point, PLATEAU building features can be returned ahead of facility primitives or facility primitives can be absent from the pick result. Relying only on the first facility in `drillPick()` would make a co-located category hard to select.
- Overlap solution: only screen-space visual/picking separation was added. Geographic longitude/latitude and DEM/PLATEAU data were not changed.
  - Co-located labels use deterministic category offsets: Medical upper-left, Evacuation upper-right, Transport lower-left, Daily Life lower-right.
  - Non-co-located labels use a small upward screen-space offset and background for readability.
  - Picking now first prefers real `drillPick()` facility ids, then falls back to nearest visible facility marker/label screen position within a small radius before using the PLATEAU building path.
- Facilities ON/OFF performance A/B with same camera and Ground/Inundation OFF:
  - Facilities ON: `60 FPS`, UI heap `170 MB`, PLATEAU `139 loaded / 0 pending`
  - Facilities OFF: `60 FPS`, UI heap `161 MB`, PLATEAU `139 loaded / 0 pending`
  - After ten category-toggle changes and ~30 s wait: `60 FPS`, UI heap `186 MB`, CDP memory `175 MB`
  - Interpretation: the facility layer is not the main cause of the earlier `32-35 FPS` reading. The earlier regression was likely measurement/camera/load-state related rather than 18 facility primitives.
- Initial camera assessment: the AOI `lookAt` camera shows West Maizuru and keeps most facility points in view while retaining PLATEAU context. It is acceptable for Phase 2A; no further camera change was made in this pass.
- Framebuffer warning attribution: unresolved separate issue. Fresh-tab instrumentation captured unhandled rejections with message `The number of color attachments exceeds the number supported.` Stack path: Cesium `Framebuffer` / `TextureAtlas._copyFromTexture` / `TextureAtlas._resize` / `LabelCollection` texture processing. Facilities ON/OFF did not change FPS, but the warning occurs while labels/texture atlas are present. This was not fixed in this pass because the user requested no ContextLimits workaround changes.
- Console: original `Height reference is not supported without a scene` crash is resolved. Remaining console issue is the framebuffer/texture-atlas DeveloperError plus occasional `favicon.ico` 404.
- Static verification after final changes:
  - `npm run typecheck`: PASS
  - `npm run build`: PASS
- Changed files in this pass:
  - `src/cesium/facilityLayer.ts`
  - `src/cesium/picking.ts`
  - `src/components/CesiumViewport.tsx`
  - `docs/AI_HANDOFF.md`

Root cause fixed:

- `src/cesium/facilityLayer.ts` created `new LabelCollection()` without a Cesium scene.
- The facility labels use `heightReference: HeightReference.CLAMP_TO_GROUND`.
- Cesium's `LabelCollection` documentation and type definition state that `options.scene` must be passed for labels using height reference or globe depth testing.
- Runtime error before the fix: `DeveloperError: Height reference is not supported without a scene.`

Exact fix:

- `src/cesium/facilityLayer.ts`: changed label collection creation to `new LabelCollection({ scene: viewer.scene })`.
- `src/components/CesiumViewport.tsx`: changed initial camera setup to look at the West Maizuru AOI center with the existing `MAIZURU_CAMERA.initialOffset`, instead of placing the camera at `fallbackDestination` and leaving most facility positions projected outside the viewport.
- `src/cesium/facilityLayer.ts`: changed facility point/label `disableDepthTestDistance` to `Number.POSITIVE_INFINITY` so ground-clamped facility annotations are not fully hidden by terrain/building depth in the dense urban view.
- `src/cesium/facilityLayer.ts`: increased point sizes from `12/15` to `18/22` px, label font from `11px` to `14px`, and added label background/offset for the small 18-record facility layer.
- `src/cesium/picking.ts`: changed picking to call `scene.drillPick(click.position, 8)` and prefer the first facility pick id before falling back to the top pick/building path, so overlapping PLATEAU buildings do not always win when a facility marker is under the cursor.
- No dependency changes.
- No architecture rewrite.
- No PLATEAU `heightOffsetMeters: -36` reuse for facilities, DEM, inundation, or clamping.

Changed files:

- `src/cesium/facilityLayer.ts`
- `src/cesium/picking.ts`
- `src/components/CesiumViewport.tsx`
- `docs/AI_HANDOFF.md`

Static verification after fix:

- `npm run typecheck`: PASS
- `npm run build`: PASS

Runtime verification after fix, normal Chrome via CDP at `http://127.0.0.1:5182/`:

- React root no longer empty: PASS
- Cesium canvas generated: PASS (`1200 × 1017`)
- Original `Height reference is not supported without a scene` DeveloperError: RESOLVED
- Urban Functions panel displayed: PASS
- Facility category counts displayed: PASS (`Medical 6`, `Evacuation 8`, `Transport 1`, `Daily Life 3`; total 18)
- Category toggles independently change checked state and restore: PASS
- Runtime primitive existence during temporary debug instrumentation: PASS
  - `PointPrimitiveCollection`: present in `scene.primitives`, length `18`
  - `LabelCollection`: present in `scene.primitives`, length `18`
  - `Cesium3DTileset`: present
  - sampled point/label properties: `show: true`, alpha `1`, finite Cartesian positions, point size nonzero, label scale `1`, label `heightReference: CLAMP_TO_GROUND`
- Position validation: sample facility coordinates converted to finite Cartesian3 positions. With the old camera, sampled facilities projected far outside the canvas, e.g. `medical-maizuru-red-cross` at approximately `(1483, 2867)` on a `1200 × 1017` canvas. With the AOI lookAt camera, 17 of 18 facility points projected inside the canvas.
- Temporary camera-to-facility check: PASS. When camera was moved to `medical-maizuru-red-cross`, `drillPick` at its projected coordinate returned the facility `PointPrimitive` first and the PLATEAU tileset feature behind it second.
- PLATEAU buildings displayed: PASS by screenshot/runtime status
- PLATEAU building picking: PASS; a building click opened the selected-building panel with identifier `bldg_721c37e5-aacd-4c5d-a499-67eb2003195e`, usage `官公庁施設`, measured height `9.98`
- Facility picking after final fixes:
  - Medical: PASS, `あいおい橋四方クリニック`; panel showed category, type, ground elevation `0.9 m`, tide, method, sea-connected state, depth, status, source, provenance, and PLATEAU `Unlinked`
  - Evacuation: PASS, `文化公園体育館`; panel showed category, type, ground elevation `30.0 m`, tide, method, sea-connected state, depth, status, source, provenance, and PLATEAU `Unlinked`
  - Transport: PASS, `西舞鶴駅・西駅交流センター`; co-located with `evac-west-station-center`, selectable after deterministic label offset and screen-space picking fallback.
  - Daily Life: PASS, `フクヤ 西舞鶴店`; selectable from normal camera after label readability/fallback adjustment.
- Tide integration after final fixes:
  - Medical facility `あいおい橋四方クリニック` at 0.0 m: connected to sea `No`, depth `0.0 m`, status `Safe`
  - at 1.0 m: connected to sea `Yes`, depth `0.1 m`, status `Shallow`
  - at 2.0 m: connected to sea `Yes`, depth `1.1 m`, status `Deep`
- PLATEAU load status: initial verification `139 loaded / 0 pending`; after camera smoke check `142 loaded / 0 pending`
- FPS: final A/B run reported `60` with Facilities ON and `60` with Facilities OFF under the same camera with Ground/Inundation OFF.
- JS heap shown in UI: Facilities ON `170 MB`, Facilities OFF `161 MB`, after ten category toggle changes and a wait `186 MB`.
- Network resources observed in final run: 140 PLATEAU proxy resources, 139 `.b3dm`, 9 DEM tiles
- Layer coexistence toggles: PASS at DOM/state level for Facilities only, Ground + Facilities, Inundation + Facilities, Ground + Inundation + Facilities; no crash
- Camera zoom/drag smoke check: PASS; root remained mounted and canvas remained present

Remaining Phase 2A limitations:

- Marker/label visibility is acceptable for Phase 2A after label background and screen-space offset, but it is not final visual design.
- Transport overlaps an evacuation facility at the same representative coordinate; this is handled by deterministic screen-space label offsets and screen-space picking fallback, without changing longitude/latitude.
- WebGL warning investigation:
  - The warnings/errors appeared at page load in CDP-controlled Chrome.
  - The app remained mounted, PLATEAU loaded, and four-category facility picking worked.
  - Fresh-tab instrumentation captured `The number of color attachments exceeds the number supported.` from Cesium `Framebuffer` / `TextureAtlas` processing.
  - Facilities ON/OFF did not affect FPS, so this remains a separate non-blocking issue for a later ContextLimits/Cesium texture-atlas investigation.
  - Existing `ContextLimits` workaround was read only; it was not modified.
- `favicon.ico` 404 and React DevTools development notice also appeared; these are non-blocking for the app behavior.

Phase 2A final status after this pass:

- PASS with Known Technical Debt for Phase 2A acceptance. Core facility rendering, four-category picking, details, toggles, inundation integration, and performance attribution are verified.
- The known technical debt is the separate non-blocking Cesium/WebGL framebuffer/texture-atlas DeveloperError in console.
- Next recommended work, if needed, is to address the framebuffer warning only if a clean-console demo is required. Do not proceed to PLATEAU building linking, scores, networks, service areas, future facility placement, or Navara migration.

Phase 2A result:

- 18 real existing-facility records in a renderer-independent JSON/domain model:
  - Medical: 6 (Maizuru City medical-institution CSV, CC BY 4.0)
  - Evacuation: 8 (official Maizuru shelter list joined to municipal public-facility or disclosed OSM coordinates)
  - Transport: 1 (Nishi-Maizuru Station / West Station Exchange Center official information)
  - Daily Life: 3 (named OSM supermarket ways, ODbL)
- Lightweight Cesium `PointPrimitiveCollection` + `LabelCollection`; no React component per marker and no new dependency.
- Category toggles for all four categories; symbol plus color encoding.
- Facility marker picking shows name, category/type, DEM ground elevation, tide, active inundation method, sea connectivity, potential depth, four-state status, source link, provenance, and linked/unlinked PLATEAU state.
- Facility inundation reuses the loaded GSI DEM sampler and Phase 1C.1 sea-connection threshold field. No alternative hazard model was introduced.
- No score, weights, networks, service areas, placement tools, or scenario records.
- `docs/FACILITY_DATA_MANIFEST.md` records sources, licenses, retrieval dates, transformations, coordinate joins, limitations, and PLATEAU-linking policy.
- PLATEAU IDs remain explicitly `Unlinked`: Chrome-based identifier verification was unavailable and no building use was inferred from appearance. Important-facility linking remains the one incomplete acceptance item.
- Verification: `npm run typecheck` PASS; `npm run build` PASS; Vite dev server responds at `http://127.0.0.1:5183/`.
- Normal Chrome marker/toggle/click/FPS/heap/console verification remains pending. Chrome browser control reported the required extension as not installed.

Affected-cell comparison completed against the live nine-tile DEM (491,743 finite ground cells; strict `groundElevation < tideLevel`, matching the renderer):

- 0.5 m: Elevation-only 1,216 (0.2473%); Sea-connected 1,032 (0.2099%); excluded difference 184 (0.0374% of valid cells, 15.13% of Elevation-only affected cells)
- 1.0 m: Elevation-only 31,389 (6.3832%); Sea-connected 30,137 (6.1286%); excluded difference 1,252 (0.2546%, 3.99% of Elevation-only)
- 1.5 m: Elevation-only 70,241 (14.2841%); Sea-connected 68,137 (13.8562%); excluded difference 2,104 (0.4279%, 3.00% of Elevation-only)
- 2.0 m: Elevation-only 93,062 (18.9249%); Sea-connected 88,419 (17.9807%); excluded difference 4,643 (0.9442%, 4.99% of Elevation-only)

Temporary Difference Mask verification:

- A temporary magenta mask displayed cells affected in Elevation-only but excluded in Sea-connected; the instrumentation and mask were removed afterward, leaving the UI/model unchanged.
- At 2.0 m, 4,601 of 4,643 excluded cells (99.1%) were in z15 DEM tile `28702/12929`.
- That tile spans approximately 135.32959–135.34058 E, 35.44277–35.45172 N.
- The focused mask showed a concentrated linear inland low area around the urban corridor north of Shin-Aioi Bridge (`新相生橋`), rather than broad removal along the open coast.
- Verification snapshot: PLATEAU Ready, 83 loaded / 0 pending, 60 FPS, 96 MB JS heap, no console warnings/errors.

Phase 1C.1 changes:

- Ground Elevation and Simplified Inundation are independent toggles and can be enabled together.
- UI groups them as `Base / terrain view` and `Hazard overlay`.
- When both are enabled, Ground Elevation alpha is reduced from 0.68 to 0.40; inundation remains visually dominant at 0.78.
- Inundation Method radio options:
  - `Elevation-only`: all finite DEM cells below tide level
  - `Sea-connected` (default): only cells whose precomputed sea-connection threshold is at or below tide level
- Sea source definition: DEM NoData cells connected to the nine-tile AOI boundary. Low elevation alone is never treated as sea.
- Connectivity uses 4-neighbor adjacency to avoid diagonal one-cell leakage.
- Preprocessing architecture:
  1. a reusable `Uint8Array` + `Int32Array` queue extracts boundary-connected NoData sea water;
  2. shoreline land cells become seeds;
  3. an indexed typed-array minimax priority flood calculates the minimum terrain threshold required to connect each land cell to those seeds;
  4. per-tile `Float32Array` thresholds are reused by the raster, building shader, and picking.
- The threshold field represents all possible tide-level flood fills, so a slider or method change does not rerun graph traversal.
- Building DEM texture now packs ground elevation in RG and sea-connection threshold in BA. One boolean shader uniform switches methods; the tileset is not rebuilt.
- Picking adds `Method` and, for Sea-connected mode, `Connected to sea`. Sea-connected depth is zero when the representative cell is disconnected.
- `heightOffsetMeters: -36` remains rendering-only and is not used by either method.
- No new dependency.

Connectivity correctness tests using a synthetic DEM:

- Case A, sea-continuous low ground: connected at 1 m — PASS
- Case B, a 0 m inland basin behind a 3 m ridge: Elevation-only inundated at 1 m, Sea-connected excluded — PASS
- Case C, the same basin: disconnected at 2 m and connected at 3 m — PASS

Synthetic 768 × 768 (589,824-cell) preprocessing benchmark:

- boundary NoData mask: 3.0 ms
- connection-threshold priority flood: 48.5 ms
- total: 51.5 ms
- JS heap reported by the Node test: 4 MB (this is an isolated algorithm benchmark, not browser heap)

Phase 1C baseline retained:

- Tide Level slider: 0.0–5.0 m, 0.1 m step, 0.0 m initial value
- explicit `Scenario · User-defined stress test` wording
- simplified depth formula: `max(0, tide level - DEM ground elevation)`
- the PLATEAU `heightOffsetMeters: -36` rendering workaround is not passed into or used by inundation calculations
- independent Ground Elevation and Simplified Inundation layers; both can remain enabled
- depth raster regenerated from the existing nine `Float32Array` DEM tiles via Canvas/ImageData; no per-cell React components, Cesium Entities, or primitives
- depth bands: shallow `0 < depth < 0.5 m`, medium `0.5 <= depth < 1.0 m`, deep `>= 1.0 m`
- building impact: one 768 × 768 DEM lookup texture and one Cesium CustomShader, updated by a tide uniform without rebuilding the tileset
- building states: Safe `depth = 0`, Shallow impact `0 < depth < 0.5 m`, Significant impact `depth >= 0.5 m`
- building representative-point value uses the picked building surface longitude/latitude (with globe-ray fallback) and `sampleMeters(lon, lat)`; outside the DEM AOI or on failure remains `Unknown`
- selected-building panel adds ground elevation, scenario tide, simplified potential depth, and status
- provenance/method copy states that this is an elevation-based stress test, not an official storm-surge map, and lists major omitted hydraulic processes
- no new dependencies

Final browser snapshot (warm-cache, in-app Chromium, 0.0 m scenario):

- PLATEAU Ready
- FPS: 60
- JS heap: 93 MB after settling
- initial PLATEAU ready event: 0.46 s
- 83 observed tile-load events / 0 pending
- console warning/error: none
- Vite error overlay: none
- tide UI + inundation legend + toggles: PASS
- building picking + Phase 1C fields: PASS; confirmed `Unknown` for a picked representative point outside the nine-tile DEM AOI

Additional 2.0 m verification:

- inundation raster visibly appeared over low ground and changed from the 0.0 m view
- PLATEAU remained 83 loaded / 0 pending
- FPS remained 60
- JS heap returned to 90 MB after settling
- console warning/error: none

Phase 1B inputs retained:

- official GSI DEM5A elevation PNG tiles, nine-tile z15 West Maizuru AOI
- client-side RGB decode into reusable `Float32Array` elevation grids
- `sampleMeters(longitude, latitude)` numeric API outside React
- Ground Elevation ON/OFF control
- four-class legend derived from measured AOI distribution
- provenance and height-reference copy in UI and investigation document
- nine Cesium imagery layers; no elevation Entities or React cells
- Phase 1A ellipsoid globe retained
- `heightOffsetMeters: -36` retained only as an explicit visual workaround; not used as DEM correction
- no new dependencies

Final browser snapshot (warm-cache, in-app Chromium):

- PLATEAU Ready
- FPS: 60
- JS heap: 91 MB
- initial PLATEAU ready event: 0.48 s
- 83 observed tile-load events / 0 pending (event count is cache/view dependent, not inventory)
- console warning/error: none
- elevation ON/OFF + legend: PASS
- building picking + attributes: PASS

Detailed research and height-reference decision:

- `docs/PHASE1B_ELEVATION_INVESTIGATION.md`

Known Good State confirmed by user in normal Chrome:

- PLATEAU `.b3dm` requests appear in Network via `/plateau-proxy/data/*.b3dm`.
- Tile loading reached `93 loaded / 0 pending`.
- Buildings started appearing.
- Height alignment is visually acceptable after `heightOffsetMeters: -36`.
- Console has no major errors; only the React DevTools development notice appears.
- Building picking works and opens the attribute panel.
- Attribute panel shows available fields including `name`, `usage`, `hight`, and `identifier`.
- Missing attribute values display as `Unknown`.
- Performance after buildings loaded is acceptable for Phase 1A:
  - FPS: 60-61 reported by user
  - JS heap: `usedJSHeapSize` 106112475 bytes, about 101 MB
  - JS heap total: 118008215 bytes, about 113 MB
- `window.__plateauDebug.stats()` from the diagnostic build showed:
  - `tilesLoaded: true`
  - `numberOfCommands: 45`
  - `numberOfTilesWithContentReady: 93`
  - `numberOfLoadedTilesTotal: 93`
  - `numberOfFeaturesLoaded: 4303`
  - `numberOfTrianglesSelected: 39154`
  - `geometryByteLength: 7017723`

Verification after cleanup:

- `npm run typecheck`: PASS
- `npm run build`: PASS
- `npm run typecheck` after height-offset change: PASS
- `npm run build` after height-offset change: PASS
- `npm run typecheck` during Phase 1A.5 stabilization: PASS
- `npm run build` during Phase 1A.5 stabilization: PASS
- `npm run typecheck` after Phase 1B implementation: PASS
- `npm run build` after Phase 1B implementation: PASS

Process checkpoint:

- Port 5180: no current listener.
- Port 5181: `node` PID 47108, cwd `/Users/Rito/Plateau_cityhack_challenge2026`; confirmed as this project's old Vite-related process.
- Port 5182: `node` PID 52616, cwd `/Users/Rito/Plateau_cityhack_challenge2026`; active working dev server.

Repository note:

- `/Users/Rito/Plateau_cityhack_challenge2026` currently has no `.git` directory in this environment. `git branch --show-current`, `git status`, and `git diff --stat` fail with "not a git repository".

## Current Implementation

Key PLATEAU data path:

- `vite.config.ts`: Vite dev proxy routes `/plateau-proxy/*` to the official PLATEAU CDN path for Maizuru 2025 building 3D Tiles.
- `src/data/maizuruPlateau.ts`: `tilesetUrl` is `/plateau-proxy/tileset.json`.
- `src/data/maizuruPlateau.ts`: `heightOffsetMeters` is `-36` for visual geoid/terrain alignment.
- `src/data/maizuruGroundElevation.ts`: official DEM metadata, AOI, and legend bands.
- `src/data/groundElevation.ts`: GSI PNG decode and reusable numeric elevation sampling.
- `src/cesium/groundElevationLayer.ts`: lightweight raster generation and Cesium imagery lifecycle.
- `src/components/GroundElevationControl.tsx`: toggle, legend, loading/error state, and provenance.
- `src/components/DataBadge.tsx`: displays the active height offset so the visual correction is not hidden.
- `src/data/inundation.ts`: tide range, depth thresholds, and the simplified depth function.
- `src/cesium/inundationLayer.ts`: nine imagery-layer inundation raster lifecycle with animation-frame coalescing and stale-update disposal.
- `src/cesium/buildingImpactShader.ts`: packed DEM atlas and GPU building-impact classification.
- `src/components/InundationControl.tsx`: scenario wording, tide slider, toggle, legend, and method/provenance disclosure.
- `src/cesium/picking.ts`: picked-position DEM sampling for Phase 1C building details.

Technical Debt / Stabilization Workarounds:

- `src/components/CesiumViewport.tsx`: applies `RequestScheduler.throttleRequests = false` once.
  - Reason: in the observed remote Chrome + SSH tunnel setup, PLATEAU tile requests stayed in Cesium `ISSUED` state and did not become active XHRs until scheduler throttling was disabled.
- `src/cesium/plateauLayer.ts`: applies dataset-level tileset height offset through `tileset.modelMatrix`.
  - Current Maizuru setting: `heightOffsetMeters: -36`.
  - Reason: visual geoid/terrain alignment adjustment because the current Phase 1A viewer uses an ellipsoid globe with GSI imagery rather than a matched DEM terrain surface.
  - Phase 1B re-evaluation: retain while the visual surface remains the zero-height ellipsoid; do not use this offset in DEM values or flood calculations. Remove it if matched ellipsoid-height terrain is enabled and verified.
  - The official PLATEAU attributes are not modified; this is a rendering transform only.
- `src/cesium/plateauLayer.ts`: applies minimum guards for Cesium `ContextLimits`.
  - Reason: this environment reported zero WebGL limits, causing:
    - `renderState.lineWidth is out of range`
    - `DeveloperError: Expected width to be greater than 0, actual value was 0` in `BatchTexture.update`
  - Guarded values: cube map size, texture size, renderbuffer size, line width range, point size range.
- `src/main.tsx`: React StrictMode remains removed for Phase 1A browser debugging stability.
- `src/cesium/plateauLayer.ts`: zero-reported maximum texture-size fallback is now 1024 instead of 64.
  - Reason: Phase 1C's bounded 768 × 768 DEM lookup texture otherwise stops rendering in the affected WebGL environment.
  - This only changes the fallback used when the browser reports zero; normal reported GPU limits remain untouched.

Cleanup completed:

- Removed noisy `[Phase1A] tileLoad`, `loadProgress`, `tileVisible`, tileset-created, primitive-added, and RequestScheduler update probe logs.
- Removed default `window.__plateauDebug` exposure.
- Kept only actionable error logging for PLATEAU tile failures.

## Important Caveats

- The Vite proxy is dev-server only. `vite build` output alone will not provide `/plateau-proxy`; a production deployment needs a separate proxy or hosted tile strategy.
- `ContextLimits` import uses Cesium private/internal module path:
  - `@cesium/engine/Source/Renderer/ContextLimits.js`
  - Keep this only as a Phase 1A compatibility workaround unless a cleaner Cesium/browser fix is found.
- `RequestScheduler.throttleRequests = false` is broad. It fixed this setup, but may increase concurrent tile requests. Revisit before a performance-sensitive demo build.

## Dev Server / Access

Known working local URL on the Pink Mac:

```bash
http://127.0.0.1:5182/
```

MacBook Air must keep the SSH tunnel open:

```bash
ssh -N -L 5182:127.0.0.1:5182 Rito@pinkimac.tailff9841.ts.net
```

Then open:

```bash
http://127.0.0.1:5182/
```

## Phase 1C Changed Files

- `src/app/App.tsx`
- `src/components/CesiumViewport.tsx`
- `src/components/InundationControl.tsx` (new)
- `src/components/SelectedBuildingPanel.tsx`
- `src/cesium/buildingImpactShader.ts` (new)
- `src/cesium/inundationLayer.ts` (new)
- `src/cesium/picking.ts`
- `src/cesium/plateauLayer.ts`
- `src/data/inundation.ts` (new)
- `src/styles.css`
- `src/types/plateau.ts`
- `docs/AI_HANDOFF.md`

## Phase 1C.1 Changed Files

- `src/app/App.tsx`
- `src/components/CesiumViewport.tsx`
- `src/components/GroundElevationControl.tsx`
- `src/components/InundationControl.tsx`
- `src/components/SelectedBuildingPanel.tsx`
- `src/cesium/buildingImpactShader.ts`
- `src/cesium/groundElevationLayer.ts`
- `src/cesium/inundationLayer.ts`
- `src/cesium/picking.ts`
- `src/data/inundation.ts`
- `src/data/seaConnectivity.ts` (new)
- `src/styles.css`
- `src/types/plateau.ts`
- `docs/AI_HANDOFF.md`

## Phase 1C.1 Known Limitations

- Boundary-connected DEM NoData is used as a lightweight water mask. NoData caused by missing elevation coverage and connected to the AOI boundary could be classified as sea; replace this seed source with an authoritative coastline/water mask in a later data-hardening phase.
- Four-neighbor connectivity intentionally prevents diagonal leakage but can exclude a physically meaningful diagonal connection narrower than one DEM cell.
- Connectivity is static elevation-barrier connectivity only. It does not model culverts, drainage, gates, pumps, waves, overtopping, levee failure, velocity, or time-dependent propagation.
- Normal Chrome / CDP verification was available only through the CDP-controlled Chrome session in this Codex turn; no separate non-debug browser surface was available.

## Phase 1C.1 Status / Exact Next Action

- Status: PASS with Known Technical Debt. Core viewer/inundation behavior is verified; the remaining WebGL framebuffer warning is a separate non-blocking issue.
- Open `http://127.0.0.1:5182/` in normal Chrome and verify all four layer combinations.
- At the same nonzero tide level, switch Elevation-only → Sea-connected and confirm at least one isolated inland low area disappears while sea-continuous low ground remains.
- Click buildings in both included and excluded areas and confirm the building color and picking method/depth/connection fields agree with the ground overlay.
- Drag the slider through 0–5 m and record steady FPS, settled and peak JS heap, PLATEAU pending count, responsiveness, and console errors.
- Do not start urban-function scores, networks, or facility placement until this check passes.

## Phase 1C Known Limitations

- This remains an elevation-only potential map. It deliberately does not resolve sea connectivity or isolated depressions.
- Building status is representative-point based, not a footprint-wide scientific assessment.
- The building shader derives geodetic lookup coordinates from world position and samples the same bounded DEM atlas; visual status should be spot-checked on the presentation Mac at several tide values.
- Automated browser control could verify a fixed 2.0 m scenario and the 0.0 m final state, but could not reliably drag the native range input. Manual continuous-drag feel remains the exact next browser check.
- The in-app Chromium JS heap briefly rose during reload/raster creation and settled to 90–93 MB; presentation-machine profiling should use the settled value and also watch drag-time peaks.

## Phase 1C Status / Previous Checkpoint

- Exact next action: in normal Chrome on the presentation machine, drag the tide slider continuously through 0–5 m and verify raster continuity, building color transitions around 0.5 m, picking of a building inside the DEM AOI, FPS, heap peak, and console.
- If that manual check passes, Phase 1C can be accepted as PASS and the next scoped phase can be selected.
- Do not begin score, network, or facility-placement work until Phase 1C is accepted.

## Do Not Do Yet

- Do not add scores, network links, facility placement, drainage, pumps, or hydrodynamic simulation as part of Phase 1C.1.
- Do not remove the PLATEAU proxy unless direct browser access to the PLATEAU CDN is proven reliable.
- Do not remove the Cesium workarounds until normal Chrome still loads buildings without them.
- Do not install dependencies, use sudo/brew, commit, push, deploy, or change system/SSH/Tailscale settings without explicit approval.
