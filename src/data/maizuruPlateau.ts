import {
  Cartesian3,
  HeadingPitchRange,
  Math as CesiumMath
} from "cesium";
import type { PlateauTilesetDataset } from "../types/plateau";

export const MAIZURU_PLATEAU_BUILDINGS: PlateauTilesetDataset = {
  id: "maizuru-2025-bldg-lod1-texture",
  label: "PLATEAU 2025 Maizuru City buildings",
  city: "Maizuru City",
  year: 2025,
  source: "Project PLATEAU / MLIT",
  format: "3D Tiles, building model, LOD1 texture",
  aoiLabel: "West Maizuru initial view",
  tilesetUrl: "/plateau-proxy/tileset.json",
  sourceUrl: "https://api.plateauview.mlit.go.jp/datacatalog/plateau-datasets",
  heightOffsetMeters: -36,
  heightOffsetReason: "Retained visual alignment for the ellipsoid surface; not a DEM correction"
};

export const MAIZURU_CAMERA = {
  initialOffset: new HeadingPitchRange(
    CesiumMath.toRadians(52),
    CesiumMath.toRadians(-26),
    1250
  ),
  fallbackDestination: Cartesian3.fromDegrees(135.3337, 35.4498, 1250),
  fallbackOrientation: {
    heading: CesiumMath.toRadians(52),
    pitch: CesiumMath.toRadians(-28),
    roll: 0
  }
};
