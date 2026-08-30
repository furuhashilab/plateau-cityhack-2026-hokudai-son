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

Phase 2A records include an explicit nullable `plateauBuildingId`. No identifier is filled unless the external POI-to-building match can be manually verified against the loaded PLATEAU feature. The current curated set is therefore displayed as `Unlinked`; no building use is inferred from 3D appearance. Marker selection still identifies the facility and samples the same DEM/connectivity fields used by building impact.

## Known limitations

- The municipal shelter page has no machine-readable coordinates, so exact-name joining is required.
- The transport point represents the station complex from a nearby official coordinate inside the DEM AOI, not a surveyed entrance.
- OSM completeness and freshness vary; its three daily-life records are not an exhaustive commercial directory.
- Point sampling represents one coordinate and does not evaluate an entire facility footprint.
- PLATEAU building identifiers remain unlinked until a reliable footprint/identifier spatial join or manual verification is completed; this is explicitly visible rather than guessed.
- Facility status is a simplified tide/DEM stress-test result, not an official hazard forecast.
