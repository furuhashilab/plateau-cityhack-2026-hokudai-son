import {
  Cesium3DTileFeature,
  Cartographic,
  Cartesian2,
  Cartesian3,
  Color,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Viewer
} from "cesium";
import type { BuildingSelection } from "../types/plateau";
import type { LoadedGroundElevation } from "../data/groundElevation";
import type { InundationMethod } from "../data/inundation";
import type { SeaConnectivity } from "../data/seaConnectivity";
import { facilityById, WEST_MAIZURU_FACILITIES } from "../data/facilities";
import { categoryPixelOffset, defaultLabelPixelOffset, isFacilityPickId } from "./facilityLayer";
import type { Facility, FacilityCategoryVisibility, FacilitySelection } from "../types/facility";

type MutableFeature = Cesium3DTileFeature & {
  color?: Color;
};

const FIELD_CANDIDATES = {
  identifier: ["identifier", "gml_id", "gml:id", "id", "building_uid", "uid"],
  name: ["name", "bldg:name", "uro:buildingName", "buildingName"],
  usage: ["usage", "bldg:usage", "uro:buildingUsage", "buildingUsage", "class"],
  measuredHeight: ["measuredHeight", "bldg:measuredHeight", "height", "render_height"]
} as const;

export function attachBuildingPicking(
  viewer: Viewer,
  onBuildingSelect: (selection: BuildingSelection | null) => void,
  getGroundElevation: () => LoadedGroundElevation | null,
  getSeaConnectivity: () => SeaConnectivity | null,
  getTideLevelMeters: () => number,
  getInundationMethod: () => InundationMethod,
  getFacilityVisibility: () => FacilityCategoryVisibility,
  onFacilitySelect: (selection: FacilitySelection | null) => void
) {
  const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
  let highlighted: MutableFeature | null = null;
  let previousColor: Color | null = null;

  handler.setInputAction((click: ScreenSpaceEventHandler.PositionedEvent) => {
    const pickedObjects = viewer.scene.drillPick(click.position, 8);
    const facilityPick = pickedObjects.find((candidate) =>
      isFacilityPickId((candidate as { id?: unknown }).id)
    );
    const picked = facilityPick ?? pickedObjects[0] ?? viewer.scene.pick(click.position);
    const pickedId = (picked as { id?: unknown } | undefined)?.id;
    if (isFacilityPickId(pickedId)) {
      clearHighlight();
      onBuildingSelect(null);
      selectFacilityById(pickedId.facilityId);
      viewer.scene.requestRender();
      return;
    }
    const nearbyFacility = pickNearbyFacility(viewer, click.position, getFacilityVisibility());
    if (nearbyFacility) {
      clearHighlight();
      onBuildingSelect(null);
      selectFacility(nearbyFacility);
      viewer.scene.requestRender();
      return;
    }
    if (!(picked instanceof Cesium3DTileFeature)) {
      clearHighlight();
      onBuildingSelect(null);
      onFacilitySelect(null);
      viewer.scene.requestRender();
      return;
    }

    clearHighlight();
    onFacilitySelect(null);
    highlighted = picked as MutableFeature;
    previousColor = Color.clone(highlighted.color ?? Color.WHITE);
    highlighted.color = Color.fromCssColorString("#facc15").withAlpha(0.88);

    const ray = viewer.camera.getPickRay(click.position);
    const cartesian = viewer.scene.pickPosition(click.position)
      ?? (ray ? viewer.scene.globe.pick(ray, viewer.scene) : undefined);
    const cartographic = cartesian ? Cartographic.fromCartesian(cartesian) : null;
    const groundElevationMeters = cartographic
      ? getGroundElevation()?.sampleMeters(
          cartographic.longitude * 180 / Math.PI,
          cartographic.latitude * 180 / Math.PI
        ) ?? null
      : null;
    const tideLevelMeters = getTideLevelMeters();
    const method = getInundationMethod();
    const longitudeDegrees = cartographic ? cartographic.longitude * 180 / Math.PI : null;
    const latitudeDegrees = cartographic ? cartographic.latitude * 180 / Math.PI : null;
    const connectionThresholdMeters = longitudeDegrees === null || latitudeDegrees === null
      ? null
      : getSeaConnectivity()?.sampleConnectionThresholdMeters(longitudeDegrees, latitudeDegrees) ?? null;
    const connectedToSea = connectionThresholdMeters === null
      ? null
      : connectionThresholdMeters <= tideLevelMeters;
    const depthMeters = groundElevationMeters === null
      ? null
      : method === "sea-connected" && connectedToSea !== true
        ? 0
        : Math.max(0, tideLevelMeters - groundElevationMeters);

    const availablePropertyIds = safePropertyIds(picked);
    onBuildingSelect({
      fields: {
        identifier: readFirstProperty(picked, FIELD_CANDIDATES.identifier),
        name: readFirstProperty(picked, FIELD_CANDIDATES.name),
        usage: readFirstProperty(picked, FIELD_CANDIDATES.usage),
        measuredHeight: readFirstProperty(picked, FIELD_CANDIDATES.measuredHeight)
      },
      inundation: {
        groundElevationMeters,
        tideLevelMeters,
        depthMeters,
        method,
        connectionThresholdMeters,
        connectedToSea,
        status: depthMeters === null
          ? null
          : depthMeters === 0
            ? "Safe"
            : depthMeters < 0.5
              ? "Shallow impact"
              : "Significant impact"
      },
      availablePropertyIds
    });
    viewer.scene.requestRender();
  }, ScreenSpaceEventType.LEFT_CLICK);

  function clearHighlight() {
    if (highlighted && previousColor) {
      highlighted.color = previousColor;
    }
    highlighted = null;
    previousColor = null;
  }

  function selectFacilityById(facilityId: string) {
    const facility = facilityById(facilityId);
    if (!facility) {
      onFacilitySelect(null);
      return;
    }
    selectFacility(facility);
  }

  function selectFacility(facility: Facility) {
    const groundElevationMeters = getGroundElevation()?.sampleMeters(facility.longitude, facility.latitude) ?? null;
    const tideLevelMeters = getTideLevelMeters();
    const method = getInundationMethod();
    const connectionThresholdMeters = getSeaConnectivity()?.sampleConnectionThresholdMeters(
      facility.longitude,
      facility.latitude
    ) ?? null;
    const connectedToSea = connectionThresholdMeters === null ? null : connectionThresholdMeters <= tideLevelMeters;
    const depthMeters = groundElevationMeters === null
      ? null
      : method === "sea-connected" && connectedToSea !== true
        ? 0
        : Math.max(0, tideLevelMeters - groundElevationMeters);
    onFacilitySelect({
      facility,
      groundElevationMeters,
      tideLevelMeters,
      depthMeters,
      method,
      connectionThresholdMeters,
      connectedToSea,
      status: facilityStatus(depthMeters)
    });
  }

  return () => {
    clearHighlight();
    handler.destroy();
  };
}

function pickNearbyFacility(
  viewer: Viewer,
  clickPosition: Cartesian2,
  visibility: FacilityCategoryVisibility
) {
  let nearest: { facility: Facility; distanceSquared: number } | null = null;
  for (const facility of WEST_MAIZURU_FACILITIES) {
    if (!visibility[facility.category]) continue;
    const position = Cartesian3.fromDegrees(facility.longitude, facility.latitude, 3);
    const baseScreenPosition = viewer.scene.cartesianToCanvasCoordinates(position);
    if (!baseScreenPosition) continue;
    const candidates = [
      baseScreenPosition,
      Cartesian2.add(baseScreenPosition, defaultLabelPixelOffset(), new Cartesian2()),
      Cartesian2.add(baseScreenPosition, categoryPixelOffset(facility.category), new Cartesian2())
    ];
    for (const candidate of candidates) {
      const distanceSquared = Cartesian2.distanceSquared(candidate, clickPosition);
      if (distanceSquared <= 28 * 28 && (!nearest || distanceSquared < nearest.distanceSquared)) {
        nearest = { facility, distanceSquared };
      }
    }
  }
  return nearest?.facility ?? null;
}

function facilityStatus(depthMeters: number | null): FacilitySelection["status"] {
  if (depthMeters === null) return null;
  if (depthMeters === 0) return "Safe";
  if (depthMeters < 0.5) return "Shallow";
  if (depthMeters < 1) return "Significant";
  return "Deep";
}

function safePropertyIds(feature: Cesium3DTileFeature): string[] {
  try {
    return feature.getPropertyIds().sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function readFirstProperty(feature: Cesium3DTileFeature, keys: readonly string[]): string | null {
  for (const key of keys) {
    try {
      const value = feature.getProperty(key);
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return String(value);
      }
    } catch {
      // Some 3D Tiles metadata paths can throw for unsupported property shapes.
    }
  }
  return null;
}
