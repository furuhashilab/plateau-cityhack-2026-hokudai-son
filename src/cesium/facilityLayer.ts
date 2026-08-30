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
import type { Facility, FacilityCategoryVisibility } from "../types/facility";

export type FacilityPickId = { kind: "facility"; facilityId: string };

export type FacilityLayer = {
  setVisibility: (visibility: FacilityCategoryVisibility) => void;
  destroy: () => void;
};

export function createFacilityLayer(viewer: Viewer, facilities: Facility[]): FacilityLayer {
  const points = viewer.scene.primitives.add(new PointPrimitiveCollection());
  const labels = viewer.scene.primitives.add(new LabelCollection({ scene: viewer.scene }));
  const colocatedCoordinateKeys = findColocatedCoordinateKeys(facilities);
  const items = facilities.map((facility) => {
    const category = FACILITY_CATEGORIES.find((candidate) => candidate.id === facility.category)!;
    const position = Cartesian3.fromDegrees(facility.longitude, facility.latitude, 3);
    const pixelOffset = colocatedCoordinateKeys.has(coordinateKey(facility))
      ? categoryPixelOffset(facility.category)
      : defaultLabelPixelOffset();
    const point = points.add({
      id: { kind: "facility", facilityId: facility.id } satisfies FacilityPickId,
      position,
      pixelSize: facility.category === "transport" ? 22 : 18,
      color: Color.fromCssColorString(category.color),
      outlineColor: Color.fromCssColorString("#08111d"),
      outlineWidth: 3,
      heightReference: HeightReference.CLAMP_TO_GROUND,
      scaleByDistance: new NearFarScalar(400, 1.35, 5000, 0.72),
      disableDepthTestDistance: Number.POSITIVE_INFINITY
    });
    const label = labels.add({
      id: { kind: "facility", facilityId: facility.id } satisfies FacilityPickId,
      position,
      text: category.symbol,
      font: "700 14px sans-serif",
      fillColor: Color.WHITE,
      outlineColor: Color.fromCssColorString("#08111d"),
      outlineWidth: 2,
      style: LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: VerticalOrigin.CENTER,
      pixelOffset,
      showBackground: true,
      backgroundColor: Color.fromCssColorString("#08111d").withAlpha(0.72),
      backgroundPadding: new Cartesian2(6, 4),
      heightReference: HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      scaleByDistance: new NearFarScalar(400, 1.1, 5000, 0.75)
    });
    return { facility, point, label };
  });

  return {
    setVisibility(visibility) {
      for (const item of items) {
        const visible = visibility[item.facility.category];
        item.point.show = visible;
        item.label.show = visible;
      }
      viewer.scene.requestRender();
    },
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
  return new Cartesian2(0, -24);
}

export function categoryPixelOffset(category: Facility["category"]) {
  switch (category) {
    case "medical":
      return new Cartesian2(-28, -28);
    case "evacuation":
      return new Cartesian2(28, -28);
    case "transport":
      return new Cartesian2(-28, 28);
    case "daily-life":
      return new Cartesian2(28, 28);
  }
}

export function isFacilityPickId(value: unknown): value is FacilityPickId {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<FacilityPickId>;
  return candidate.kind === "facility" && typeof candidate.facilityId === "string";
}
