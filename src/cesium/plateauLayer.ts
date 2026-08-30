import {
  Cartesian3,
  Cartographic,
  Cesium3DTileStyle,
  Cesium3DTileset,
  Matrix4,
  ShadowMode,
  Viewer
} from "cesium";
import ContextLimits from "@cesium/engine/Source/Renderer/ContextLimits.js";
import type { PlateauTilesetDataset } from "../types/plateau";

type PlateauLoadCallbacks = {
  onReady: () => void;
  onTileLoad: () => void;
  onLoadProgress: (pendingTiles: number, processingTiles: number) => void;
};

export async function loadPlateauBuildings(
  viewer: Viewer,
  dataset: PlateauTilesetDataset,
  callbacks: PlateauLoadCallbacks
) {
  applyContextLimitMinimums();

  const tileset = await Cesium3DTileset.fromUrl(dataset.tilesetUrl, {
    maximumScreenSpaceError: 24,
    cacheBytes: 128 * 1024 * 1024,
    maximumCacheOverflowBytes: 64 * 1024 * 1024,
    environmentMapOptions: {
      enabled: false,
      mipmapLevels: 1
    }
  });

  applyTilesetHeightOffset(tileset, dataset.heightOffsetMeters);

  tileset.style = new Cesium3DTileStyle({
    color: "color('#d9dde3', 0.94)"
  });
  tileset.shadows = ShadowMode.DISABLED;

  tileset.tileLoad.addEventListener(() => {
    callbacks.onTileLoad();
    viewer.scene.requestRender();
  });

  tileset.tileFailed.addEventListener((error: unknown) => {
    const details = error as { url?: string; message?: string };
    console.error("[Phase1A] tileFailed", details.url ?? "Unknown URL", details.message ?? String(error));
  });

  tileset.loadProgress.addEventListener((pendingRequests: number, processingTiles: number) => {
    callbacks.onLoadProgress(pendingRequests, processingTiles);
    if (pendingRequests === 0 && processingTiles === 0) {
      callbacks.onReady();
    }
    viewer.scene.requestRender();
  });

  return tileset;
}

function applyTilesetHeightOffset(tileset: Cesium3DTileset, heightOffsetMeters = 0) {
  if (heightOffsetMeters === 0) return;

  const cartographic = Cartographic.fromCartesian(tileset.boundingSphere.center);
  const surface = Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0);
  const offset = Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    heightOffsetMeters
  );
  const translation = Cartesian3.subtract(offset, surface, new Cartesian3());
  tileset.modelMatrix = Matrix4.fromTranslation(translation);
}

function applyContextLimitMinimums() {
  const mutableContextLimits = ContextLimits as unknown as {
    maximumCubeMapSize: number;
    maximumTextureSize: number;
    maximumRenderbufferSize: number;
    minimumAliasedLineWidth: number;
    maximumAliasedLineWidth: number;
    minimumAliasedPointSize: number;
    maximumAliasedPointSize: number;
    _maximumCubeMapSize: number;
    _maximumTextureSize: number;
    _maximumRenderbufferSize: number;
    _minimumAliasedLineWidth: number;
    _maximumAliasedLineWidth: number;
    _minimumAliasedPointSize: number;
    _maximumAliasedPointSize: number;
  };

  // Some remote/headless Chrome sessions report zero WebGL limits before Cesium initializes models.
  // Cesium later uses these values to size line render states and feature textures.
  if (mutableContextLimits.maximumCubeMapSize <= 0) {
    mutableContextLimits._maximumCubeMapSize = 16;
  }
  if (mutableContextLimits.maximumTextureSize <= 0) {
    // Phase 1C uses one 768 px DEM lookup texture to classify buildings in a
    // single shader pass. This fallback is only used when the browser reports 0.
    mutableContextLimits._maximumTextureSize = 1024;
  }
  if (mutableContextLimits.maximumRenderbufferSize <= 0) {
    mutableContextLimits._maximumRenderbufferSize = 16;
  }
  if (
    mutableContextLimits.minimumAliasedLineWidth <= 0 ||
    mutableContextLimits.maximumAliasedLineWidth < 1
  ) {
    mutableContextLimits._minimumAliasedLineWidth = 1;
    mutableContextLimits._maximumAliasedLineWidth = 1;
  }
  if (
    mutableContextLimits.minimumAliasedPointSize <= 0 ||
    mutableContextLimits.maximumAliasedPointSize < 1
  ) {
    mutableContextLimits._minimumAliasedPointSize = 1;
    mutableContextLimits._maximumAliasedPointSize = 1;
  }
}
