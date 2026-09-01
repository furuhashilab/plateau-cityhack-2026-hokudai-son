import {
  Cartesian3,
  HeadingPitchRange,
  Math as CesiumMath
} from "cesium";
import type { PlateauTilesetDataset } from "../types/plateau";

const MAIZURU_PLATEAU_TILESET_BASE_URL =
  "https://assets.cms.plateau.reearth.io/assets/d8/2ee0df-f584-42c2-a4c0-afcec6860b47/26202_maizuru-shi_city_2025_citygml_1_op_bldg_3dtiles_lod1";

export const MAIZURU_PLATEAU_BUILDINGS: PlateauTilesetDataset = {
  id: "maizuru-2025-bldg-lod1-texture",
  label: "PLATEAU 2025 Maizuru City buildings",
  city: "Maizuru City",
  year: 2025,
  source: "Project PLATEAU / MLIT",
  format: "3D Tiles, building model, LOD1 texture",
  aoiLabel: "West Maizuru initial view",
  tilesetUrl: import.meta.env.DEV
    ? "/plateau-proxy/tileset.json"
    : `${MAIZURU_PLATEAU_TILESET_BASE_URL}/tileset.json`,
  sourceUrl: "https://api.plateauview.mlit.go.jp/datacatalog/plateau-datasets",
  heightOffsetMeters: -36,
  heightOffsetReason: "Retained visual alignment for the ellipsoid surface; not a DEM correction"
};

export const MAIZURU_CAMERA = {
  initialOffset: new HeadingPitchRange(
    CesiumMath.toRadians(48),
    CesiumMath.toRadians(-22),
    960
  ),
  fallbackDestination: Cartesian3.fromDegrees(135.3337, 35.4498, 960),
  fallbackOrientation: {
    heading: CesiumMath.toRadians(48),
    pitch: CesiumMath.toRadians(-24),
    roll: 0
  }
};
