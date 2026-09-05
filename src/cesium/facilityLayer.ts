import {
  BillboardCollection,
  Cartesian2,
  Cartesian3,
  Color,
  HeightReference,
  LabelCollection,
  LabelStyle,
  NearFarScalar,
  Viewer,
  VerticalOrigin
} from "cesium";
import { FACILITY_CATEGORIES } from "../data/facilities";
import { facilityCategoryLabel } from "../data/facilityLabels";
import type { Facility, FacilityCategory, FacilityCategoryVisibility } from "../types/facility";

export type FacilityPickId = { kind: "facility"; facilityId: string };

export type FacilityLayer = {
  setVisibility: (visibility: FacilityCategoryVisibility) => void;
  setDisplay: (display: {
    visibility: FacilityCategoryVisibility;
    focusedCategory: FacilityCategory | null;
    affectedFacilityIds: Set<string>;
  }) => void;
  destroy: () => void;
};

const PIN_SIZE = 52;
const DEPTH_TEST_ALWAYS_ON = 0;

function buildNormalPin(symbol: string, colorHex: string): HTMLCanvasElement {
  return drawPinCanvas(symbol, colorHex, PIN_SIZE, false);
}

function buildAffectedPin(normalCanvas: HTMLCanvasElement, colorHex: string): HTMLCanvasElement {
  const pad = 7;
  const canvas = document.createElement("canvas");
  canvas.width = normalCanvas.width + pad * 2;
  canvas.height = normalCanvas.height + pad * 2;
  const ctx = canvas.getContext("2d")!;

  // Orange glow ring behind the category pin
  ctx.shadowColor = "#f97316";
  ctx.shadowBlur = pad + 3;
  ctx.drawImage(normalCanvas, pad, pad);
  ctx.shadowBlur = 0;

  // Orange ring circle
  const pinBodyRadius = normalCanvas.width * 0.42;
  const cx = canvas.width / 2;
  const cy = normalCanvas.height * 0.38 + pad;
  ctx.beginPath();
  ctx.arc(cx, cy, pinBodyRadius + 4, 0, Math.PI * 2);
  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Category pin on top
  ctx.drawImage(normalCanvas, pad, pad);

  // Small warning dot at bottom-right of pin body
  ctx.beginPath();
  ctx.arc(cx + pinBodyRadius - 2, cy - pinBodyRadius + 2, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#fbbf24";
  ctx.fill();
  ctx.strokeStyle = "#08111d";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  return canvas;
}

function drawPinCanvas(symbol: string, colorHex: string, size: number, affected: boolean): HTMLCanvasElement {
  const width = size;
  const height = Math.round(size * 1.22);
  const radius = size * 0.36;
  const cx = width / 2;
  const cy = radius + 5;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  if (affected) {
    ctx.shadowColor = "#f97316";
    ctx.shadowBlur = 8;
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI * 0.86, Math.PI * 2.14);
  ctx.lineTo(cx, height - 5);
  ctx.closePath();
  ctx.fillStyle = colorHex;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = affected ? 4 : 3;
  ctx.strokeStyle = affected ? "#f97316" : "#08111d";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.fill();

  ctx.fillStyle = "#08111d";
  ctx.font = `900 ${Math.round(size * 0.33)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(symbol, cx, cy + 1);

  return canvas;
}

type PinImages = {
  normal: HTMLCanvasElement;
  affected: HTMLCanvasElement;
};

function buildCategoryPins(): Map<FacilityCategory, PinImages> {
  const map = new Map<FacilityCategory, PinImages>();
  for (const cat of FACILITY_CATEGORIES) {
    const normal = buildNormalPin(cat.symbol, cat.color);
    const affected = buildAffectedPin(normal, cat.color);
    map.set(cat.id, { normal, affected });
  }
  return map;
}

export function createFacilityLayer(viewer: Viewer, facilities: Facility[]): FacilityLayer {
  const pinImages = buildCategoryPins();
  const billboards = viewer.scene.primitives.add(new BillboardCollection({ scene: viewer.scene }));
  const labels = viewer.scene.primitives.add(new LabelCollection({ scene: viewer.scene }));
  const colocatedCoordinateKeys = findColocatedCoordinateKeys(facilities);

  const items = facilities.map((facility) => {
    const category = FACILITY_CATEGORIES.find((c) => c.id === facility.category)!;
    const pins = pinImages.get(facility.category)!;
    const position = Cartesian3.fromDegrees(facility.longitude, facility.latitude, 0);
    const hasColocated = colocatedCoordinateKeys.has(coordinateKey(facility));
    const labelOffset = hasColocated
      ? categoryPixelOffset(facility.category)
      : defaultLabelPixelOffset();

    const billboard = billboards.add({
      id: { kind: "facility", facilityId: facility.id } satisfies FacilityPickId,
      position,
      image: pins.normal,
      verticalOrigin: VerticalOrigin.BOTTOM,
      heightReference: HeightReference.CLAMP_TO_GROUND,
      scaleByDistance: new NearFarScalar(150, 1.6, 5000, 0.65),
      disableDepthTestDistance: DEPTH_TEST_ALWAYS_ON,
      color: Color.WHITE
    });

    const label = labels.add({
      id: { kind: "facility", facilityId: facility.id } satisfies FacilityPickId,
      position,
      text: markerLabel(facility.category),
      font: "900 13px sans-serif",
      fillColor: Color.fromCssColorString("#08111d"),
      outlineColor: Color.WHITE,
      outlineWidth: 3,
      style: LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: VerticalOrigin.CENTER,
      pixelOffset: labelOffset,
      showBackground: true,
      backgroundColor: Color.fromCssColorString(category.color).withAlpha(0.93),
      backgroundPadding: new Cartesian2(9, 6),
      heightReference: HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: DEPTH_TEST_ALWAYS_ON,
      scaleByDistance: new NearFarScalar(150, 1.2, 5000, 0.75),
      show: false
    });

    return { facility, billboard, label, pins };
  });

  const setDisplay: FacilityLayer["setDisplay"] = ({ visibility, focusedCategory, affectedFacilityIds }) => {
    for (const item of items) {
      const visible = visibility[item.facility.category];
      item.billboard.show = visible;
      item.label.show = false;
      if (!visible) continue;

      const category = FACILITY_CATEGORIES.find((c) => c.id === item.facility.category)!;
      const focused = focusedCategory === null || focusedCategory === item.facility.category;
      const affected = affectedFacilityIds.has(item.facility.id);

      // Pin image: affected uses orange-ring canvas, normal uses plain canvas
      item.billboard.image = affected ? item.pins.affected : item.pins.normal;

      // Alpha: dimmed when another category is focused
      item.billboard.color = Color.WHITE.withAlpha(focused ? 1.0 : 0.28);

      // Scale boost for focused category
      item.billboard.scale = focusedCategory !== null && focused ? 1.15 : 1.0;

      // Label only for focused category
      if (focused && focusedCategory !== null) {
        item.label.show = true;
        item.label.fillColor = affected ? Color.WHITE : Color.fromCssColorString("#08111d");
        item.label.backgroundColor = (affected
          ? Color.fromCssColorString("#7c2d12")
          : Color.fromCssColorString(category.color)).withAlpha(0.94);
        item.label.outlineColor = affected
          ? Color.fromCssColorString("#08111d")
          : Color.WHITE;
      }
    }
    viewer.scene.requestRender();
  };

  return {
    setVisibility(visibility) {
      setDisplay({ visibility, focusedCategory: null, affectedFacilityIds: new Set() });
    },
    setDisplay,
    destroy() {
      viewer.scene.primitives.remove(billboards);
      viewer.scene.primitives.remove(labels);
    }
  };
}

function findColocatedCoordinateKeys(facilities: Facility[]) {
  const counts = new Map<string, number>();
  for (const facility of facilities) {
    const key = coordinateKey(facility);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return new Set([...counts].filter(([, count]) => count > 1).map(([key]) => key));
}

function coordinateKey(facility: Facility) {
  return `${facility.longitude.toFixed(7)},${facility.latitude.toFixed(7)}`;
}

export function defaultLabelPixelOffset() {
  return new Cartesian2(0, -60);
}

export function categoryPixelOffset(category: Facility["category"]) {
  switch (category) {
    case "medical":
      return new Cartesian2(-42, -60);
    case "evacuation":
      return new Cartesian2(42, -60);
    case "transport":
      return new Cartesian2(-42, -60);
    case "daily-life":
      return new Cartesian2(42, -60);
  }
}

function markerLabel(category: FacilityCategory) {
  return facilityCategoryLabel(category).markerName;
}

export function isFacilityPickId(value: unknown): value is FacilityPickId {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<FacilityPickId>;
  return candidate.kind === "facility" && typeof candidate.facilityId === "string";
}
