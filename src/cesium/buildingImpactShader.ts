import {
  CustomShader,
  CustomShaderTranslucencyMode,
  PixelFormat,
  TextureMagnificationFilter,
  TextureMinificationFilter,
  TextureUniform,
  UniformType
} from "cesium";
import type { LoadedGroundElevation } from "../data/groundElevation";
import type { InundationMethod } from "../data/inundation";
import type { SeaConnectivity } from "../data/seaConnectivity";

const ELEVATION_BIAS_METERS = 100;
const CENTIMETERS_PER_METER = 100;
const NO_DATA = 65535;

export function createBuildingImpactShader(
  data: LoadedGroundElevation,
  connectivity: SeaConnectivity,
  tideLevelMeters: number,
  method: InundationMethod
) {
  const texture = encodeElevationAtlas(data, connectivity);
  return new CustomShader({
    translucencyMode: CustomShaderTranslucencyMode.INHERIT,
    uniforms: {
      u_dem: { type: UniformType.SAMPLER_2D, value: texture },
      u_tide: { type: UniformType.FLOAT, value: tideLevelMeters },
      u_seaConnected: { type: UniformType.BOOL, value: method === "sea-connected" },
      u_zoomScale: { type: UniformType.FLOAT, value: 2 ** data.dataset.zoom },
      u_minTileX: { type: UniformType.FLOAT, value: data.dataset.tileRange.minX },
      u_minTileY: { type: UniformType.FLOAT, value: data.dataset.tileRange.minY },
      u_tileSpanX: {
        type: UniformType.FLOAT,
        value: data.dataset.tileRange.maxX - data.dataset.tileRange.minX + 1
      },
      u_tileSpanY: {
        type: UniformType.FLOAT,
        value: data.dataset.tileRange.maxY - data.dataset.tileRange.minY + 1
      }
    },
    fragmentShaderText: `
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        vec3 p = fsInput.attributes.positionWC;
        float longitude = atan(p.y, p.x);
        float geocentricLatitude = atan(p.z, length(p.xy));
        float latitude = atan(tan(geocentricLatitude) / (1.0 - 0.00669437999014));
        float worldX = (longitude / (2.0 * czm_pi) + 0.5) * u_zoomScale;
        float worldY = (1.0 - log(tan(latitude) + 1.0 / cos(latitude)) / czm_pi) * 0.5 * u_zoomScale;
        vec2 uv = vec2(
          (worldX - u_minTileX) / u_tileSpanX,
          1.0 - (worldY - u_minTileY) / u_tileSpanY
        );
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return;
        vec4 encoded = texture(u_dem, uv);
        float code = floor(encoded.r * 255.0 + 0.5) * 256.0 + floor(encoded.g * 255.0 + 0.5);
        if (code >= 65534.5) return;
        float elevation = code / ${CENTIMETERS_PER_METER.toFixed(1)} - ${ELEVATION_BIAS_METERS.toFixed(1)};
        float connectionCode = floor(encoded.b * 255.0 + 0.5) * 256.0 + floor(encoded.a * 255.0 + 0.5);
        float connectionThreshold = connectionCode / ${CENTIMETERS_PER_METER.toFixed(1)} - ${ELEVATION_BIAS_METERS.toFixed(1)};
        if (u_seaConnected && (connectionCode >= 65534.5 || connectionThreshold > u_tide)) return;
        float depth = max(0.0, u_tide - elevation);
        if (depth >= 0.5) {
          material.diffuse = mix(material.diffuse, vec3(0.36, 0.18, 0.72), 0.76);
        } else if (depth > 0.0) {
          material.diffuse = mix(material.diffuse, vec3(0.20, 0.72, 0.92), 0.68);
        }
      }
    `
  });
}

function encodeElevationAtlas(data: LoadedGroundElevation, connectivity: SeaConnectivity) {
  const tileWidth = data.tiles[0]?.width ?? 256;
  const tileHeight = data.tiles[0]?.height ?? 256;
  const spanX = data.dataset.tileRange.maxX - data.dataset.tileRange.minX + 1;
  const spanY = data.dataset.tileRange.maxY - data.dataset.tileRange.minY + 1;
  const width = spanX * tileWidth;
  const height = spanY * tileHeight;
  const rgba = new Uint8Array(width * height * 4);
  for (const tile of data.tiles) {
    const connectionThresholds = connectivity.thresholdsByTile.get(`${tile.x}/${tile.y}`);
    if (!connectionThresholds) throw new Error(`Missing sea-connectivity tile ${tile.x}/${tile.y}`);
    const atlasTileX = tile.x - data.dataset.tileRange.minX;
    const atlasTileY = data.dataset.tileRange.maxY - tile.y;
    for (let y = 0; y < tile.height; y += 1) {
      for (let x = 0; x < tile.width; x += 1) {
        const value = tile.valuesMeters[y * tile.width + x];
        const code = Number.isFinite(value)
          ? Math.max(0, Math.min(NO_DATA - 1, Math.round((value + ELEVATION_BIAS_METERS) * CENTIMETERS_PER_METER)))
          : NO_DATA;
        const threshold = connectionThresholds[y * tile.width + x];
        const thresholdCode = Number.isFinite(threshold)
          ? Math.max(0, Math.min(NO_DATA - 1, Math.round((threshold + ELEVATION_BIAS_METERS) * CENTIMETERS_PER_METER)))
          : NO_DATA;
        const targetY = atlasTileY * tileHeight + (tile.height - 1 - y);
        const target = (targetY * width + atlasTileX * tileWidth + x) * 4;
        rgba[target] = code >> 8;
        rgba[target + 1] = code & 255;
        rgba[target + 2] = thresholdCode >> 8;
        rgba[target + 3] = thresholdCode & 255;
      }
    }
  }
  return new TextureUniform({
    typedArray: rgba,
    width,
    height,
    repeat: false,
    pixelFormat: PixelFormat.RGBA,
    minificationFilter: TextureMinificationFilter.NEAREST,
    magnificationFilter: TextureMagnificationFilter.NEAREST
  });
}
