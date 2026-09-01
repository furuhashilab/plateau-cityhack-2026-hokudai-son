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

type WebGLContextLike = Pick<WebGLRenderingContext, "getParameter"> & {
  ALIASED_LINE_WIDTH_RANGE: number;
  ALIASED_POINT_SIZE_RANGE: number;
  MAX_COLOR_ATTACHMENTS?: number;
  MAX_CUBE_MAP_TEXTURE_SIZE: number;
  MAX_DRAW_BUFFERS?: number;
  MAX_RENDERBUFFER_SIZE: number;
  MAX_TEXTURE_SIZE: number;
  MAX_VERTEX_TEXTURE_IMAGE_UNITS: number;
};

export type ContextLimitMinimumsReport = {
  actualMaximumVertexTextureImageUnits: number | null;
  cesiumMaximumVertexTextureImageUnitsBefore: number;
  cesiumMaximumVertexTextureImageUnitsAfter: number;
  patchedMaximumVertexTextureImageUnits: boolean;
};

export function applyContextLimitMinimums(gl?: WebGLContextLike): ContextLimitMinimumsReport {
  const mutableContextLimits = ContextLimits as unknown as {
    maximumCubeMapSize: number;
    maximumTextureSize: number;
    maximumRenderbufferSize: number;
    maximumDrawBuffers: number;
    maximumColorAttachments: number;
    maximumVertexTextureImageUnits: number;
    minimumAliasedLineWidth: number;
    maximumAliasedLineWidth: number;
    minimumAliasedPointSize: number;
    maximumAliasedPointSize: number;
    _maximumCubeMapSize: number;
    _maximumTextureSize: number;
    _maximumRenderbufferSize: number;
    _maximumDrawBuffers: number;
    _maximumColorAttachments: number;
    _maximumVertexTextureImageUnits: number;
    _minimumAliasedLineWidth: number;
    _maximumAliasedLineWidth: number;
    _minimumAliasedPointSize: number;
    _maximumAliasedPointSize: number;
  };
  const cesiumMaximumVertexTextureImageUnitsBefore = mutableContextLimits.maximumVertexTextureImageUnits;
  let actualMaximumVertexTextureImageUnits: number | null = null;
  let patchedMaximumVertexTextureImageUnits = false;

  // Some remote/headless Chrome sessions report zero WebGL limits before Cesium initializes models.
  // Cesium later uses these values to size line render states and feature textures.
  const actualMaximumCubeMapSize = readGlNumber(gl, gl?.MAX_CUBE_MAP_TEXTURE_SIZE);
  const actualMaximumTextureSize = readGlNumber(gl, gl?.MAX_TEXTURE_SIZE);
  const actualMaximumRenderbufferSize = readGlNumber(gl, gl?.MAX_RENDERBUFFER_SIZE);
  const actualMaximumDrawBuffers = readGlNumber(gl, gl?.MAX_DRAW_BUFFERS);
  const actualMaximumColorAttachments = readGlNumber(gl, gl?.MAX_COLOR_ATTACHMENTS);

  if (
    mutableContextLimits.maximumCubeMapSize <= 0 ||
    mutableContextLimits.maximumCubeMapSize < 1024 ||
    (actualMaximumCubeMapSize !== null && actualMaximumCubeMapSize > mutableContextLimits.maximumCubeMapSize)
  ) {
    mutableContextLimits._maximumCubeMapSize = actualMaximumCubeMapSize ?? 1024;
  }
  if (
    mutableContextLimits.maximumTextureSize <= 0 ||
    mutableContextLimits.maximumTextureSize < 1024 ||
    (actualMaximumTextureSize !== null && actualMaximumTextureSize > mutableContextLimits.maximumTextureSize)
  ) {
    // Phase 1C uses one 768 px DEM lookup texture to classify buildings in a
    // single shader pass. This fallback is only used when the browser reports 0.
    mutableContextLimits._maximumTextureSize = actualMaximumTextureSize ?? 1024;
  }
  if (
    mutableContextLimits.maximumRenderbufferSize <= 0 ||
    mutableContextLimits.maximumRenderbufferSize < 1024 ||
    (actualMaximumRenderbufferSize !== null && actualMaximumRenderbufferSize > mutableContextLimits.maximumRenderbufferSize)
  ) {
    mutableContextLimits._maximumRenderbufferSize = actualMaximumRenderbufferSize ?? 1024;
  }
  if (
    mutableContextLimits.maximumDrawBuffers <= 0 ||
    (actualMaximumDrawBuffers !== null && actualMaximumDrawBuffers > mutableContextLimits.maximumDrawBuffers)
  ) {
    mutableContextLimits._maximumDrawBuffers = actualMaximumDrawBuffers ?? 1;
  }
  if (
    mutableContextLimits.maximumColorAttachments <= 0 ||
    (actualMaximumColorAttachments !== null && actualMaximumColorAttachments > mutableContextLimits.maximumColorAttachments)
  ) {
    mutableContextLimits._maximumColorAttachments = actualMaximumColorAttachments ?? 1;
  }
  if (mutableContextLimits.maximumVertexTextureImageUnits <= 0 && gl) {
    actualMaximumVertexTextureImageUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
    if (typeof actualMaximumVertexTextureImageUnits === "number" && actualMaximumVertexTextureImageUnits > 0) {
      mutableContextLimits._maximumVertexTextureImageUnits = actualMaximumVertexTextureImageUnits;
      patchedMaximumVertexTextureImageUnits = true;
    }
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

  return {
    actualMaximumVertexTextureImageUnits,
    cesiumMaximumVertexTextureImageUnitsBefore,
    cesiumMaximumVertexTextureImageUnitsAfter: mutableContextLimits.maximumVertexTextureImageUnits,
    patchedMaximumVertexTextureImageUnits
  };
}

function readGlNumber(gl: WebGLContextLike | undefined, parameter: number | undefined) {
  if (!gl || parameter === undefined) return null;
  const value = gl.getParameter(parameter);
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}
