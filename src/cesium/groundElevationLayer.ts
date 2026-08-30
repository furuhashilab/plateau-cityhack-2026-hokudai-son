import {
  ImageryLayer,
  Rectangle,
  SingleTileImageryProvider,
  Viewer
} from "cesium";
import { colorForElevation, loadGroundElevation, type LoadedGroundElevation } from "../data/groundElevation";
import { MAIZURU_GROUND_ELEVATION } from "../data/maizuruGroundElevation";

export type GroundElevationLayer = {
  data: LoadedGroundElevation;
  setVisible: (visible: boolean) => void;
  setAlpha: (alpha: number) => void;
  destroy: () => void;
};

export async function loadGroundElevationLayer(
  viewer: Viewer,
  visible: boolean,
  signal?: AbortSignal
): Promise<GroundElevationLayer> {
  const data = await loadGroundElevation(MAIZURU_GROUND_ELEVATION, signal);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const objectUrls: string[] = [];
  const layers: ImageryLayer[] = [];
  for (const tile of data.tiles) {
    const canvas = colorizeTile(tile.valuesMeters, tile.width, tile.height);
    const blob = await canvasToBlob(canvas);
    const objectUrl = URL.createObjectURL(blob);
    objectUrls.push(objectUrl);
    const provider = await SingleTileImageryProvider.fromUrl(objectUrl, {
      rectangle: tileRectangle(data.dataset.zoom, tile.x, tile.y)
    });
    const layer = viewer.imageryLayers.addImageryProvider(provider);
    layer.alpha = 0.68;
    layer.show = visible;
    layers.push(layer);
  }
  viewer.scene.requestRender();

  return {
    data,
    setVisible(nextVisible) {
      for (const layer of layers) layer.show = nextVisible;
      viewer.scene.requestRender();
    },
    setAlpha(alpha) {
      for (const layer of layers) layer.alpha = alpha;
      viewer.scene.requestRender();
    },
    destroy() {
      for (const layer of layers) viewer.imageryLayers.remove(layer, true);
      for (const url of objectUrls) URL.revokeObjectURL(url);
    }
  };
}

function colorizeTile(values: Float32Array, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable for elevation styling");
  const image = context.createImageData(width, height);
  for (let index = 0; index < values.length; index += 1) {
    const color = colorForElevation(values[index], MAIZURU_GROUND_ELEVATION.bands);
    if (!color) continue;
    const rgb = hexToRgb(color);
    const target = index * 4;
    image.data[target] = rgb[0];
    image.data[target + 1] = rgb[1];
    image.data[target + 2] = rgb[2];
    image.data[target + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

function tileRectangle(zoom: number, x: number, y: number) {
  const scale = 2 ** zoom;
  const west = x / scale * 360 - 180;
  const east = (x + 1) / scale * 360 - 180;
  const north = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / scale))) * 180 / Math.PI;
  const south = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / scale))) * 180 / Math.PI;
  return Rectangle.fromDegrees(west, south, east, north);
}

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Failed to encode elevation overlay")), "image/png");
  });
}
