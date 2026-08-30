# Facility Data Manifest — Phase 2A

Retrieved: 2026-08-27 (JST)

AOI: West Maizuru, matching the Phase 1B DEM tile extent (approximately 135.31860–135.35156 E, 35.44277–35.46962 N). The transport representative point is deliberately kept inside this numeric-analysis AOI.

## Adopted datasets

| Category | Dataset / source | License | Coordinates | Updated / retrieved | AOI records | Format |
|---|---|---|---|---|---:|---|
| Medical | [舞鶴市 医療機関一覧](https://data.bodik.jp/dataset/262021_hospital) | CC BY 4.0 | Included (lat/lon) | dataset metadata 2026-08-04 / retrieved 2026-08-27 | 6 | CSV → curated JSON |
| Evacuation | [舞鶴市 自主避難所、拠点避難所、準拠点避難所、地域避難所](https://www.city.maizuru.kyoto.jp/kurashi/0000002675.html), with coordinates from the municipal [公共施設一覧](https://data.bodik.jp/dataset/262021_public_facility) or OSM where noted | City page terms; public-facility CSV CC BY 4.0; OSM ODbL | Combined by exact facility name; one adjacent representative point is disclosed | page checked 2026-08-27; public CSV metadata 2024-02-09 | 8 | HTML + CSV / OSM → curated JSON |
| Transport | [舞鶴市 西駅交流センター](https://www.city.maizuru.kyoto.jp/0000005712.html), cross-checked with [JR西日本](https://www.jr-odekake.net/eki/top?id=0631604) and [京都丹後鉄道](https://trains.willer.co.jp/station/nishimaizuru/) | Official pages; coordinate from municipal public-facility CSV CC BY 4.0 | Adjacent municipal station-parking coordinate used as an AOI representative point | checked 2026-08-27 | 1 | HTML + CSV → curated JSON |
| Daily Life | [OpenStreetMap](https://www.openstreetmap.org/copyright) supermarket features | ODbL | Included (node/way center) | Overpass retrieval 2026-08-27 | 3 | Overpass JSON → curated JSON |

Total: 18 existing facilities. No scenario or fictional records are included.

## Transformations and manual corrections

- Filtered all sources to the West Maizuru DEM AOI and selected a small, demo-appropriate set.
- Medical names, types, coordinates, municipal IDs and addresses were taken from the municipal CSV. Clinics were limited to four in addition to the two hospitals to avoid marker clutter.
- Evacuation status comes only from the official shelter page. Coordinates were joined by exact name to the municipal public-facility CSV. `西市民プラザ` uses the matching OSM building centroid. `西駅交流センター` uses the adjacent official municipal `西舞鶴駅駐車場` coordinate as a disclosed representative point because the station centroid lies just south of the DEM boundary.
- OSM duplicate node/way representations were deduplicated in favor of named building ways for supermarkets.
- Source labels and record-level provenance remain in the JSON and selected-facility UI. Combined-source records are `manual-curated`; this does not imply that the facility itself is manually invented.

## PLATEAU linking method

Phase 2A.1 adds explicit PLATEAU link state per facility:

- `plateauBuildingId`: `gml_id` for a verified or candidate PLATEAU building, otherwise `null`
- `plateauLinkStatus`: `verified`, `candidate`, or `unlinked`
- `plateauLinkMethod`: short reproducible method label
- `plateauLinkNote`: manual-verification note and important caveats

Manual verification procedure:

1. Open the Cesium app with the official Maizuru 2025 PLATEAU 3D Tiles loaded.
2. Move the camera top-down over each facility representative coordinate.
3. Convert facility longitude/latitude to the Cesium canvas point.
4. Use `scene.drillPick()` at the point and nearby pixels, excluding facility primitives.
5. Inspect PLATEAU feature metadata: `gml_id`, `bldg:usage`, `bldg:measuredHeight`, `uro:BuildingIDAttribute_uro:buildingID`, footprint/area attributes, and `_xmin/_xmax/_ymin/_ymax`.
6. Mark `verified` only when the facility representative coordinate directly picks the feature or is otherwise manually confirmed as the containing feature. Do not infer a facility from building size, appearance, nearest distance, or usage alone.
7. Mark `candidate` when the feature is plausible but not directly confirmed, or when the coordinate/source caveat prevents a safe verified link.
8. Mark `unlinked` when no safe candidate is available.

Phase 2A.1 link counts:

| Category | Verified | Candidate | Unlinked |
|---|---:|---:|---:|
| Medical | 6 | 0 | 0 |
| Evacuation | 3 | 4 | 1 |
| Transport | 0 | 1 | 0 |
| Daily Life | 3 | 0 | 0 |
| Total | 12 | 5 | 1 |

Priority-facility results:

| Facility | Category | Status | PLATEAU building | Notes |
|---|---|---|---|---|
| あいおい橋四方クリニック | Medical | Verified | `bldg_f2bae1b9-d8cf-457c-a401-d0bbd82e4a17` | Official facility coordinate directly picked the PLATEAU feature; usage `文教厚生施設`, measured height `8.16 m`, buildingID `26202-bldg-13389`. |
| 文化公園体育館 | Evacuation | Unlinked | `null` | Top-down and wider surrounding-pixel search returned no PLATEAU building candidate at the representative coordinate. |
| 西舞鶴駅・西駅交流センター | Transport | Candidate | `bldg_7a483d82-09ca-4df8-8d7e-67b830a1e111` | The co-located representative coordinate picks this feature, but PLATEAU usage is `共同住宅` and the coordinate is an adjacent AOI representative point, so it is not verified as the station/exchange-center building. |
| フクヤ 西舞鶴店 | Daily Life | Verified | `bldg_2f9d9621-1bc9-4b43-a516-a74d9f57ce97` | OSM way center directly picked the PLATEAU feature; usage `商業施設`, measured height `9.91 m`, buildingID `26202-bldg-6886`. |

Co-located facilities:

- `evac-west-station-center` and `transport-nishi-maizuru` keep the same longitude/latitude.
- Both records may carry the same candidate `plateauBuildingId`.
- The application does not require PLATEAU building IDs to be unique across facilities; one building can represent multiple urban functions.
- Because the shared station coordinate is only an adjacent representative point and picked a `共同住宅` feature, neither co-located facility is marked `verified`.

Runtime UI behavior:

- Verified facility selection attempts to find the linked `gml_id` in the current screen neighborhood and highlights that PLATEAU feature.
- Candidate and unlinked facility selection never highlights a PLATEAU building as confirmed.
- Facility details display `Verified`, `Candidate`, or `Unlinked`, the building ID when present, and the manual link note.

## Known limitations

- The municipal shelter page has no machine-readable coordinates, so exact-name joining is required.
- The transport point represents the station complex from a nearby official coordinate inside the DEM AOI, not a surveyed entrance.
- OSM completeness and freshness vary; its three daily-life records are not an exhaustive commercial directory.
- Point sampling represents one coordinate and does not evaluate an entire facility footprint.
- PLATEAU building identifiers remain unlinked until a reliable footprint/identifier spatial join or manual verification is completed; this is explicitly visible rather than guessed.
- Facility status is a simplified tide/DEM stress-test result, not an official hazard forecast.
