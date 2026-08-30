import type { ElevationBand, GroundElevationDataset } from "./maizuruGroundElevation";

export type GroundElevationTile = {
  x: number;
  y: number;
  width: number;
  height: number;
  valuesMeters: Float32Array;
};

export type LoadedGroundElevation = {
  dataset: GroundElevationDataset;
  tiles: GroundElevationTile[];
  sampleMeters: (longitudeDegrees: number, latitudeDegrees: number) => number | null;
};

const NO_DATA_RGB = 0x800000;

export async function loadGroundElevation(
  dataset: GroundElevationDataset,
  signal?: AbortSignal
): Promise<LoadedGroundElevation> {
  const tiles = await Promise.all(tileCoordinates(dataset).map(async ({ x, y }) => {
    const response = await fetch(gsiTileUrl(dataset, x, y), { signal });
    if (!response.ok) throw new Error(`GSI DEM tile ${x}/${y}: HTTP ${response.status}`);
    const bitmap = await createImageBitmap(await response.blob());
    try {
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("2D canvas is unavailable for DEM decoding");
      context.drawImage(bitmap, 0, 0);
      const rgba = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
      return {
        x,
        y,
        width: bitmap.width,
        height: bitmap.height,
        valuesMeters: decodeGsiElevationPixels(rgba)
      };
    } finally {
      bitmap.close();
    }
  }));

  const byCoordinate = new Map(tiles.map((tile) => [`${tile.x}/${tile.y}`, tile]));
  return {
    dataset,
    tiles,
    sampleMeters(longitudeDegrees, latitudeDegrees) {
      return sampleNearest(byCoordinate, dataset.zoom, longitudeDegrees, latitudeDegrees);
    }
  };
}

export function decodeGsiElevationPixels(rgba: Uint8ClampedArray): Float32Array {
  const values = new Float32Array(rgba.length / 4);
  for (let source = 0, target = 0; source < rgba.length; source += 4, target += 1) {
    const encoded = rgba[source] * 65536 + rgba[source + 1] * 256 + rgba[source + 2];
    values[target] = encoded === NO_DATA_RGB
      ? Number.NaN
      : (encoded < 0x800000 ? encoded : encoded - 0x1000000) * 0.01;
  }
  return values;
}

export function colorForElevation(valueMeters: number, bands: ElevationBand[]): string | null {
  if (!Number.isFinite(valueMeters)) return null;
  return bands.find((band) => valueMeters >= band.minMeters && valueMeters < band.maxMeters)?.color ?? null;
}

function tileCoordinates(dataset: GroundElevationDataset) {
  const coordinates: Array<{ x: number; y: number }> = [];
  for (let x = dataset.tileRange.minX; x <= dataset.tileRange.maxX; x += 1) {
    for (let y = dataset.tileRange.minY; y <= dataset.tileRange.maxY; y += 1) coordinates.push({ x, y });
  }
  return coordinates;
}

function gsiTileUrl(dataset: GroundElevationDataset, x: number, y: number) {
  return `https://cyberjapandata.gsi.go.jp/xyz/dem5a_png/${dataset.zoom}/${x}/${y}.png`;
}

function sampleNearest(
  tiles: Map<string, GroundElevationTile>,
  zoom: number,
  longitudeDegrees: number,
  latitudeDegrees: number
) {
  const scale = 2 ** zoom;
  const worldX = ((longitudeDegrees + 180) / 360) * scale;
  const latitudeRadians = latitudeDegrees * Math.PI / 180;
  const worldY = (1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2 * scale;
  const tileX = Math.floor(worldX);
  const tileY = Math.floor(worldY);
  const tile = tiles.get(`${tileX}/${tileY}`);
  if (!tile) return null;
  const pixelX = Math.min(tile.width - 1, Math.max(0, Math.floor((worldX - tileX) * tile.width)));
  const pixelY = Math.min(tile.height - 1, Math.max(0, Math.floor((worldY - tileY) * tile.height)));
  const value = tile.valuesMeters[pixelY * tile.width + pixelX];
  return Number.isFinite(value) ? value : null;
}
