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
import type { FutureFacilityScenario } from "../types/futureFacility";

export type FutureFacilityPickId = { kind: "future-facility"; id: FutureFacilityScenario["id"] };

export type FutureFacilityLayer = {
  setFacility: (facility: FutureFacilityScenario | null) => void;
  destroy: () => void;
};

export function createFutureFacilityLayer(viewer: Viewer): FutureFacilityLayer {
  const points = viewer.scene.primitives.add(new PointPrimitiveCollection());
  const labels = viewer.scene.primitives.add(new LabelCollection({ scene: viewer.scene }));
  let label: ReturnType<LabelCollection["add"]> | null = null;
  let entity: ReturnType<Viewer["entities"]["add"]> | null = null;

  return {
    setFacility(facility) {
      points.removeAll();
      labels.removeAll();
      if (entity) {
        viewer.entities.remove(entity);
      }
      label = null;
      entity = null;

      if (!facility) {
        viewer.scene.requestRender();
        return;
      }

      const category = FACILITY_CATEGORIES.find((candidate) => candidate.id === facility.category)!;
      const position = Cartesian3.fromDegrees(facility.longitude, facility.latitude, 16);
      const affected = (facility.impact.depthMeters ?? 0) > 0;
      const statusColor = affected ? "#fb923c" : "#22d3ee";

      entity = viewer.entities.add({
        id: "future-facility-visual",
        position,
        ellipse: {
          semiMajorAxis: 20,
          semiMinorAxis: 20,
          material: Color.fromCssColorString(statusColor).withAlpha(0.28),
          outline: true,
          outlineColor: Color.WHITE.withAlpha(0.9),
          outlineWidth: 2,
          heightReference: HeightReference.CLAMP_TO_GROUND
        }
      });

      points.add({
        id: futureFacilityPickId(),
        position,
        pixelSize: 64,
        color: Color.fromCssColorString(statusColor).withAlpha(0.26),
        outlineColor: Color.WHITE.withAlpha(0.92),
        outlineWidth: 5,
        heightReference: HeightReference.CLAMP_TO_GROUND,
        scaleByDistance: new NearFarScalar(400, 1.75, 5000, 0.98),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      });
      points.add({
        id: futureFacilityPickId(),
        position,
        pixelSize: 38,
        color: Color.fromCssColorString(statusColor).withAlpha(0.98),
        outlineColor: Color.fromCssColorString(affected ? "#fff7ed" : "#ecfeff"),
        outlineWidth: 9,
        heightReference: HeightReference.CLAMP_TO_GROUND,
        scaleByDistance: new NearFarScalar(400, 1.58, 5000, 0.9),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      });
      points.add({
        id: futureFacilityPickId(),
        position,
        pixelSize: 16,
        color: Color.fromCssColorString(category.color).withAlpha(1),
        outlineColor: Color.fromCssColorString("#08111d"),
        outlineWidth: 3,
        heightReference: HeightReference.CLAMP_TO_GROUND,
        scaleByDistance: new NearFarScalar(400, 1.58, 5000, 0.9),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      });
      label = labels.add({
        id: futureFacilityPickId(),
        position,
        text: `未来の${futureCategoryLabel(facility.category)}`,
        font: "900 14px sans-serif",
        fillColor: Color.WHITE,
        outlineColor: Color.fromCssColorString("#08111d"),
        outlineWidth: 3,
        style: LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: VerticalOrigin.BOTTOM,
        pixelOffset: new Cartesian2(0, -34),
        showBackground: true,
        backgroundColor: Color.fromCssColorString(affected ? "#9a3412" : "#0e7490").withAlpha(0.94),
        backgroundPadding: new Cartesian2(10, 6),
        heightReference: HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new NearFarScalar(400, 1.18, 5000, 0.82)
      });
      viewer.scene.requestRender();
    },
    destroy() {
      if (entity) {
        viewer.entities.remove(entity);
      }
      viewer.scene.primitives.remove(points);
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
