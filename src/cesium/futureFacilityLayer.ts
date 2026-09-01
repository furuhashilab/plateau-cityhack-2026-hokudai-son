import {
  BillboardCollection,
  Cartesian2,
  Cartesian3,
  Color,
  ColorMaterialProperty,
  HeightReference,
  LabelCollection,
  LabelStyle,
  NearFarScalar,
  Viewer,
  VerticalOrigin
} from "cesium";
import { FACILITY_CATEGORIES } from "../data/facilities";
import type { FutureFacilityScenario } from "../types/futureFacility";

export type FutureFacilityPickId = { kind: "future-facility"; id: FutureFacilityScenario["id"] };

export type FutureFacilityLayer = {
  setFacility: (facility: FutureFacilityScenario | null) => void;
  destroy: () => void;
};

/** String IDs used for the entity objects so picking.ts can detect them. */
export const FUTURE_FACILITY_ENTITY_IDS = ["future-facility-building", "future-facility-ring"] as const;

// Category → [width, depth, fullHeight] in metres
const BUILDING_DIMS: Record<string, [number, number, number]> = {
  medical: [22, 18, 20],
  evacuation: [28, 22, 16],
  transport: [24, 12, 12],
  "daily-life": [26, 20, 14]
};

export function createFutureFacilityLayer(viewer: Viewer): FutureFacilityLayer {
  const billboards = viewer.scene.primitives.add(new BillboardCollection({ scene: viewer.scene }));
  const labels = viewer.scene.primitives.add(new LabelCollection({ scene: viewer.scene }));
  let buildingEntity: ReturnType<Viewer["entities"]["add"]> | null = null;
  let ringEntity: ReturnType<Viewer["entities"]["add"]> | null = null;

  function clearAll() {
    billboards.removeAll();
    labels.removeAll();
    // Always clear by id in case the closure reference is stale (e.g. after HMR)
    for (const id of FUTURE_FACILITY_ENTITY_IDS) {
      const existing = viewer.entities.getById(id);
      if (existing) viewer.entities.remove(existing);
    }
    buildingEntity = null;
    ringEntity = null;
  }

  return {
    setFacility(facility) {
      clearAll();
      if (!facility) {
        viewer.scene.requestRender();
        return;
      }

      const category = FACILITY_CATEGORIES.find((c) => c.id === facility.category)!;
      const affected = (facility.impact.depthMeters ?? 0) > 0;
      const accentHex = affected ? "#f97316" : "#22d3ee";
      const accentColor = Color.fromCssColorString(accentHex);

      const [bw, bd, bh] = BUILDING_DIMS[facility.category] ?? [20, 20, 15];
      const { longitude: lon, latitude: lat } = facility;

      buildingEntity = viewer.entities.add({
        id: "future-facility-building",
        position: Cartesian3.fromDegrees(lon, lat, bh / 2),
        box: {
          dimensions: new Cartesian3(bw, bd, bh),
          material: new ColorMaterialProperty(accentColor.withAlpha(0.52)),
          outline: true,
          outlineColor: Color.WHITE.withAlpha(0.9),
          heightReference: HeightReference.RELATIVE_TO_GROUND
        }
      });

      ringEntity = viewer.entities.add({
        id: "future-facility-ring",
        position: Cartesian3.fromDegrees(lon, lat, 0),
        ellipse: {
          semiMajorAxis: bw * 0.72,
          semiMinorAxis: bd * 0.72,
          height: 0,
          material: new ColorMaterialProperty(accentColor.withAlpha(0.18)),
          heightReference: HeightReference.CLAMP_TO_GROUND
        }
      });

      const pinCanvas = buildFuturePin(category.symbol, accentHex, category.color);
      const pinPos = Cartesian3.fromDegrees(lon, lat, bh + 2);

      billboards.add({
        id: futureFacilityPickId(),
        position: pinPos,
        image: pinCanvas,
        verticalOrigin: VerticalOrigin.BOTTOM,
        heightReference: HeightReference.RELATIVE_TO_GROUND,
        scaleByDistance: new NearFarScalar(200, 1.5, 5000, 0.72),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        color: Color.WHITE
      });

      billboards.add({
        id: futureFacilityPickId(),
        position: pinPos,
        image: buildCategoryDot(category.color),
        verticalOrigin: VerticalOrigin.BOTTOM,
        pixelOffset: new Cartesian2(0, -38),
        heightReference: HeightReference.RELATIVE_TO_GROUND,
        scaleByDistance: new NearFarScalar(200, 1.5, 5000, 0.72),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        color: Color.WHITE
      });

      const statusText = facility.impact.depthMeters === null
        ? "まだ調べられません"
        : affected ? "水の影響かも" : "だいじょうぶそう";

      labels.add({
        id: futureFacilityPickId(),
        position: pinPos,
        text: `★ 未来の${futureCategoryLabel(facility.category)}\n${statusText}`,
        font: "900 13px sans-serif",
        fillColor: Color.WHITE,
        outlineColor: Color.fromCssColorString("#08111d"),
        outlineWidth: 3,
        style: LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: VerticalOrigin.BOTTOM,
        pixelOffset: new Cartesian2(0, -64),
        showBackground: true,
        backgroundColor: Color.fromCssColorString(affected ? "#9a3412" : "#0e7490").withAlpha(0.96),
        backgroundPadding: new Cartesian2(10, 6),
        heightReference: HeightReference.RELATIVE_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new NearFarScalar(200, 1.1, 5000, 0.8)
      });

      viewer.scene.requestRender();
    },
    destroy() {
      clearAll();
      viewer.scene.primitives.remove(billboards);
      viewer.scene.primitives.remove(labels);
    }
  };
}

export function isFutureFacilityPickId(value: unknown): value is FutureFacilityPickId {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<FutureFacilityPickId>;
  return candidate.kind === "future-facility" && candidate.id === "future-facility";
}

function futureFacilityPickId(): FutureFacilityPickId {
  return { kind: "future-facility", id: "future-facility" };
}

function futureCategoryLabel(category: FutureFacilityScenario["category"]) {
  return ({
    medical: "病院",
    evacuation: "避難できる場所",
    transport: "交通",
    "daily-life": "くらし"
  } satisfies Record<FutureFacilityScenario["category"], string>)[category];
}

function buildCategoryDot(colorHex: string): HTMLCanvasElement {
  const size = 14;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1.5, 0, Math.PI * 2);
  ctx.fillStyle = colorHex;
  ctx.fill();
  ctx.strokeStyle = "#08111d";
  ctx.lineWidth = 2;
  ctx.stroke();
  return canvas;
}

function buildFuturePin(symbol: string, accentHex: string, categoryHex: string): HTMLCanvasElement {
  const width = 54;
  const height = 66;
  const radius = 19;
  const cx = width / 2;
  const cy = 24;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.shadowColor = accentHex;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(cx, height - 5);
  ctx.lineTo(cx - 18, cy + 10);
  ctx.arc(cx, cy, radius, Math.PI * 0.82, Math.PI * 2.18);
  ctx.closePath();
  ctx.fillStyle = accentHex;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fillStyle = "#08111d";
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 17px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(symbol, cx, cy + 1);

  ctx.beginPath();
  ctx.arc(width - 12, 12, 6, 0, Math.PI * 2);
  ctx.fillStyle = categoryHex;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#08111d";
  ctx.stroke();

  return canvas;
}
