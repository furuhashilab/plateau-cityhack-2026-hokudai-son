# Presentation Demo Scenario

Target length: 5-10 minutes.

## Flow

1. Open the app and show the intro.
2. Press `まちを見てみる`.
3. Point out that the scene is real Maizuru PLATEAU 2025 building data.
4. Raise the assumed tide level to around `+2.0 m`.
5. Read the prompt for affected supermarket access.
6. Press `新しい買い物場所を考える`.
7. Click one candidate location in the 3D city.
8. Read the location result:
   - setting tide clearance
   - straight-line distance to the station / mobility facility
   - existing facilities within 800 m
9. Press `別の場所に置いてみる`.
10. Click a second candidate location.
11. Compare `地点A` and `地点B`.
12. Ask: `どちらの場所がいいと思う？どうして？`

## Data Explanation

- PLATEAU: real Maizuru City 2025 3D building model from Project PLATEAU / MLIT.
- Visual terrain: Cesium's default ellipsoid globe with a rendering-only PLATEAU building height offset for stable demo alignment.
- Elevation calculation: GSI DEM5A orthometric ground elevation, limited to the West Maizuru AOI.
- Water level: user-selected hypothetical scenario, not an official forecast.
- Inundation display: simplified calculation using the selected water level, DEM elevation, and sea-connectivity method.
- Facilities: curated existing facility points from municipal/open data sources documented in `docs/FACILITY_DATA_MANIFEST.md`.
- Future facility: virtual scenario data created by the user's click.
- Population: not included in this MVP; see `docs/POPULATION_MESH_FEASIBILITY.md`.

## Speaking Note

The app does not decide the correct location. It gives children a few grounded
numbers so they can explain why one place might be better than another.
