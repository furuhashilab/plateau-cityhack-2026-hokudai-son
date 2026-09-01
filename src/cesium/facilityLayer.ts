import {
  Cartesian2,
  Cartesian3,
  Color,
  HeightReference,
  LabelCollection,
  LabelStyle,
  NearFarScalar,
  PointPrimitiveCollection,
  Viewer,
  VerticalOrigin
} from "cesium";
import { FACILITY_CATEGORIES } from "../data/facilities";
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

export function createFacilityLayer(viewer: Viewer, facilities: Facility[]): FacilityLayer {
  const points = viewer.scene.primitives.add(new PointPrimitiveCollection());
  const labels = viewer.scene.primitives.add(new LabelCollection({ scene: viewer.scene }));
  const colocatedCoordinateKeys = findColocatedCoordinateKeys(facilities);
  const items = facilities.map((facility) => {
    const category = FACILITY_CATEGORIES.find((candidate) => candidate.id === facility.category)!;
    const position = Cartesian3.fromDegrees(facility.longitude, facility.latitude, 14);
    const pixelOffset = colocatedCoordinateKeys.has(coordinateKey(facility))
      ? categoryPixelOffset(facility.category)
      : defaultLabelPixelOffset();
    const point = points.add({
      id: { kind: "facility", facilityId: facility.id } satisfies FacilityPickId,
      position,
      pixelSize: baseMarkerSize(facility.category),
      color: Color.fromCssColorString(category.color).withAlpha(0.96),
      outlineColor: Color.fromCssColorString("#08111d"),
      outlineWidth: 5,
      heightReference: HeightReference.CLAMP_TO_GROUND,
      scaleByDistance: new NearFarScalar(300, 1.75, 4000, 0.95),
      disableDepthTestDistance: Number.POSITIVE_INFINITY
    });
    const label = labels.add({
      id: { kind: "facility", facilityId: facility.id } satisfies FacilityPickId,
      position,
      text: markerLabel(facility.category),
      font: "900 14px sans-serif",
      fillColor: Color.fromCssColorString("#08111d"),
      outlineColor: Color.WHITE,
      outlineWidth: 2,
      style: LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: VerticalOrigin.CENTER,
      pixelOffset,
      showBackground: true,
      backgroundColor: Color.fromCssColorString(category.color).withAlpha(0.92),
      backgroundPadding: new Cartesian2(9, 6),
      heightReference: HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      scaleByDistance: new NearFarScalar(300, 1.22, 4000, 0.86)
    });
    return { facility, point, label };
  });

  const setDisplay: FacilityLayer["setDisplay"] = ({ visibility, focusedCategory, affectedFacilityIds }) => {
    for (const item of items) {
      const visible = visibility[item.facility.category];
      item.point.show = visible;
      item.label.show = visible;
      if (!visible) continue;

      const category = FACILITY_CATEGORIES.find((candidate) => candidate.id === item.facility.category)!;
      const focused = focusedCategory === null || focusedCategory === item.facility.category;
      const affected = affectedFacilityIds.has(item.facility.id);
      const baseColor = affected ? Color.fromCssColorString("#fb923c") : Color.fromCssColorString(category.color);
      const alpha = focused ? 1 : 0.34;

      item.point.color = baseColor.withAlpha(alpha);
      item.point.outlineColor = affected
        ? Color.fromCssColorString("#7c2d12").withAlpha(focused ? 1 : 0.5)
        : Color.fromCssColorString("#08111d").withAlpha(focused ? 1 : 0.5);
      item.point.outlineWidth = focused ? affected ? 7 : 6 : 3;
      item.point.pixelSize = baseMarkerSize(item.facility.category) + (focused ? 5 : -4) + (affected ? 5 : 0);
      item.label.fillColor = affected
        ? Color.WHITE.withAlpha(focused ? 1 : 0.72)
        : focused
          ? Color.fromCssColorString("#08111d")
          : Color.fromCssColorString("#08111d").withAlpha(0.72);
      item.label.outlineColor = affected
        ? Color.fromCssColorString("#08111d").withAlpha(focused ? 1 : 0.55)
        : Color.WHITE.withAlpha(focused ? 1 : 0.55);
      item.label.scale = focused ? 1.14 : 0.92;
      item.label.backgroundColor = (affected
        ? Color.fromCssColorString("#7c2d12")
        : Color.fromCssColorString(category.color)).withAlpha(focused ? 0.92 : 0.36);
    }
    viewer.scene.requestRender();
  };

  return {
    setVisibility(visibility) {
      setDisplay({ visibility, focusedCategory: null, affectedFacilityIds: new Set() });
    },
    setDisplay,
    destroy() {
      viewer.scene.primitives.remove(points);
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
  return new Cartesian2(0, -34);
}

export function categoryPixelOffset(category: Facility["category"]) {
  switch (category) {
    case "medical":
      return new Cartesian2(-36, -36);
    case "evacuation":
      return new Cartesian2(36, -36);
    case "transport":
      return new Cartesian2(-36, 28);
    case "daily-life":
      return new Cartesian2(36, 28);
  }
}

function baseMarkerSize(category: Facility["category"]) {
  return category === "transport" ? 33 : 30;
}

function markerLabel(category: FacilityCategory) {
  return ({
    medical: "病院",
    evacuation: "避難",
    transport: "交通",
    "daily-life": "くらし"
  } satisfies Record<FacilityCategory, string>)[category];
}

export function isFacilityPickId(value: unknown): value is FacilityPickId {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<FacilityPickId>;
  return candidate.kind === "facility" && typeof candidate.facilityId === "string";
}
