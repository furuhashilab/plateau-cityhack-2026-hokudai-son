export type ElevationBand = {
  minMeters: number;
  maxMeters: number;
  label: string;
  color: string;
};

export type GroundElevationDataset = {
  id: string;
  label: string;
  source: string;
  sourceUrl: string;
  license: string;
  format: string;
  horizontalCrs: string;
  heightReference: string;
  nominalResolutionMeters: number;
  zoom: number;
  tileRange: { minX: number; maxX: number; minY: number; maxY: number };
  bands: ElevationBand[];
};

export const MAIZURU_GROUND_ELEVATION: GroundElevationDataset = {
  id: "gsi-dem5a-west-maizuru",
  label: "GSI DEM5A — West Maizuru",
  source: "Geospatial Information Authority of Japan (GSI)",
  sourceUrl: "https://maps.gsi.go.jp/development/demtile.html",
  license: "GSI Content Usage Terms",
  format: "GSI elevation PNG tiles (RGB encoded)",
  horizontalCrs: "Web Mercator tile grid / WGS 84 longitude-latitude",
  heightReference: "Orthometric height (elevation above mean sea level), metres",
  nominalResolutionMeters: 5,
  zoom: 15,
  tileRange: { minX: 28701, maxX: 28703, minY: 12927, maxY: 12929 },
  bands: [
    { minMeters: Number.NEGATIVE_INFINITY, maxMeters: 2, label: "Below 2 m", color: "#1769aa" },
    { minMeters: 2, maxMeters: 5, label: "2–5 m", color: "#35b9b1" },
    { minMeters: 5, maxMeters: 10, label: "5–10 m", color: "#f3d35a" },
    { minMeters: 10, maxMeters: Number.POSITIVE_INFINITY, label: "10 m and above", color: "#c96b3b" }
  ]
};

export const PLATEAU_TERRAIN = {
  url: "https://tile.plateauview.mlit.go.jp/terrain",
  source: "PLATEAU | Mapterhorn | Geospatial Information Authority of Japan",
  format: "Cesium quantized-mesh",
  heightReference: "WGS 84 ellipsoid height (orthometric DEM height + geoid height)",
  sourceUrl: "https://docs.plateauview.mlit.go.jp/datasets/terrain/"
};
