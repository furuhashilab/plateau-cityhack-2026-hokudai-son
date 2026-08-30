import { ImageryLayer, Rectangle, SingleTileImageryProvider, Viewer } from "cesium";
import type { LoadedGroundElevation } from "../data/groundElevation";
import { INUNDATION_BANDS, inundationDepth, type InundationMethod } from "../data/inundation";
import type { SeaConnectivity } from "../data/seaConnectivity";

export type InundationLayer = {
  setVisible: (visible: boolean) => void;
  setTideLevel: (meters: number) => void;
  setMethod: (method: InundationMethod) => void;
  destroy: () => void;
};

export function createInundationLayer(
  viewer: Viewer,
  data: LoadedGroundElevation,
  connectivity: SeaConnectivity,
  visible: boolean,
  tideLevelMeters: number,
  method: InundationMethod
): InundationLayer {
  let layers: ImageryLayer[] = [];
  let objectUrls: string[] = [];
  let currentVisible = visible;
  let currentTide = tideLevelMeters;
  let currentMethod = method;
  let frame: number | null = null;
  let revision = 0;
  let destroyed = false;

  const rebuild = async (targetRevision: number) => {
    const nextLayers: ImageryLayer[] = [];
    const nextUrls: string[] = [];
    try {
      for (const tile of data.tiles) {
        const thresholds = connectivity.thresholdsByTile.get(`${tile.x}/${tile.y}`);
        if (!thresholds) throw new Error(`Missing sea-connectivity tile ${tile.x}/${tile.y}`);
        const canvas = colorizeInundation(
          tile.valuesMeters,
          thresholds,
          tile.width,
          tile.height,
          currentTide,
          currentMethod
        );
        const blob = await canvasToBlob(canvas);
        const url = URL.createObjectURL(blob);
        nextUrls.push(url);
        const provider = await SingleTileImageryProvider.fromUrl(url, {
          rectangle: tileRectangle(data.dataset.zoom, tile.x, tile.y)
        });
        const layer = viewer.imageryLayers.addImageryProvider(provider);
        layer.alpha = 0.78;
        layer.show = currentVisible;
        nextLayers.push(layer);
      }
      if (destroyed || targetRevision !== revision) {
        remove(nextLayers, nextUrls);
        return;
      }
      remove(layers, objectUrls);
      layers = nextLayers;
      objectUrls = nextUrls;
      viewer.scene.requestRender();
    } catch (error) {
      remove(nextLayers, nextUrls);
      throw error;
    }
  };

  const scheduleRebuild = () => {
    revision += 1;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = null;
      void rebuild(revision).catch((error) => console.error("[Phase1C] Failed to update inundation raster", error));
    });
  };

  const remove = (targetLayers: ImageryLayer[], urls: string[]) => {
    for (const layer of targetLayers) viewer.imageryLayers.remove(layer, true);
    for (const url of urls) URL.revokeObjectURL(url);
  };

  scheduleRebuild();

  return {
    setVisible(nextVisible) {
      currentVisible = nextVisible;
      for (const layer of layers) layer.show = nextVisible;
      viewer.scene.requestRender();
    },
    setTideLevel(meters) {
      if (meters === currentTide) return;
      currentTide = meters;
      scheduleRebuild();
    },
    setMethod(nextMethod) {
      if (nextMethod === currentMethod) return;
      currentMethod = nextMethod;
      scheduleRebuild();
    },
    destroy() {
      destroyed = true;
      revision += 1;
      if (frame !== null) cancelAnimationFrame(frame);
      remove(layers, objectUrls);
      layers = [];
      objectUrls = [];
    }
  };
}

function colorizeInundation(
  values: Float32Array,
  connectionThresholds: Float32Array,
  width: number,
  height: number,
  tideLevelMeters: number,
  method: InundationMethod
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable for inundation styling");
  const image = context.createImageData(width, height);
  for (let index = 0; index < values.length; index += 1) {
    const elevation = values[index];
    if (
      !Number.isFinite(elevation) ||
      elevation >= tideLevelMeters ||
      (method === "sea-connected" && connectionThresholds[index] > tideLevelMeters)
    ) continue;
    const depth = inundationDepth(tideLevelMeters, elevation);
    const band = depth < 0.5
      ? INUNDATION_BANDS[0]
      : depth < 1
        ? INUNDATION_BANDS[1]
        : INUNDATION_BANDS[2];
    if (!band) continue;
    const rgb = hexToRgb(band.color);
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
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Failed to encode inundation overlay")), "image/png");
  });
}
