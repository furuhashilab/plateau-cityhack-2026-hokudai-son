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
import { findNearestRoadId, findNearestRoadIdFromClickPosition, roadPickIdFromPickedObject } from "./roadLayer";
import { WEST_MAIZURU_ROAD_PROOF } from "../data/roads";
import type { RoadSelection } from "../types/road";
import { computeFacilityScenarioImpact } from "../data/urbanFunctions";
import type { FacilityCategory } from "../types/facility";
import { isFutureFacilityPickId, FUTURE_FACILITY_ENTITY_IDS } from "./futureFacilityLayer";
import type { FutureFacilityScenario } from "../types/futureFacility";

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
  onFacilitySelect: (selection: FacilitySelection | null) => void,
  getRoadSelection: (roadId: string) => RoadSelection | null,
  onRoadSelect: (selection: RoadSelection | null) => void,
  getPlacementCategory: () => FacilityCategory | null,
  onFutureFacilityPlace: (placement: { category: FacilityCategory; longitude: number; latitude: number }) => void,
  getFutureFacility: () => FutureFacilityScenario | null,
  onFutureFacilitySelect: (facility: FutureFacilityScenario | null) => void
) {
  const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
  let highlighted: MutableFeature | null = null;
  let previousColor: Color | null = null;

  handler.setInputAction((click: ScreenSpaceEventHandler.PositionedEvent) => {
    const placementCategory = getPlacementCategory();
    if (placementCategory) {
      const cartographic = cartographicFromClick(viewer, click.position);
      if (cartographic) {
        clearHighlight();
        onBuildingSelect(null);
        onFacilitySelect(null);
        onRoadSelect(null);
        onFutureFacilitySelect(null);
        onFutureFacilityPlace({
          category: placementCategory,
          longitude: cartographic.longitude * 180 / Math.PI,
          latitude: cartographic.latitude * 180 / Math.PI
        });
        viewer.scene.requestRender();
      }
      return;
    }

    const pickedObjects = viewer.scene.drillPick(click.position, 8);
    const futurePick = pickedObjects.find((candidate) => {
      const id = (candidate as { id?: unknown }).id;
      if (isFutureFacilityPickId(id)) return true;
      // Entity picks: id is the Entity object; check its string id
      if (id && typeof id === "object") {
        const entityId = (id as { id?: string }).id;
        return typeof entityId === "string" && (FUTURE_FACILITY_ENTITY_IDS as readonly string[]).includes(entityId);
      }
      return false;
    });
    const facilityPick = pickedObjects.find((candidate) =>
      isFacilityPickId((candidate as { id?: unknown }).id)
    );
    const buildingPick = pickedObjects.find((candidate) => candidate instanceof Cesium3DTileFeature);
    const roadPick = pickedObjects.find((candidate) => roadPickIdFromPickedObject(candidate));
    const picked = futurePick ?? facilityPick ?? buildingPick ?? roadPick ?? pickedObjects[0] ?? viewer.scene.pick(click.position);
    const pickedId = (picked as { id?: unknown } | undefined)?.id;
    const isFuturePick = (() => {
      if (isFutureFacilityPickId(pickedId)) return true;
      if (pickedId && typeof pickedId === "object") {
        const entityId = (pickedId as { id?: string }).id;
        return typeof entityId === "string" && (FUTURE_FACILITY_ENTITY_IDS as readonly string[]).includes(entityId);
      }
      return false;
    })();
    if (isFuturePick) {
      clearHighlight();
      onBuildingSelect(null);
      onFacilitySelect(null);
      onRoadSelect(null);
      onFutureFacilitySelect(getFutureFacility());
      viewer.scene.requestRender();
      return;
    }
    if (isFacilityPickId(pickedId)) {
      clearHighlight();
      onBuildingSelect(null);
      onRoadSelect(null);
      onFutureFacilitySelect(null);
      selectFacilityById(pickedId.facilityId);
      viewer.scene.requestRender();
      return;
    }
    const nearbyFacility = pickNearbyFacility(viewer, click.position, getFacilityVisibility());
    if (nearbyFacility) {
      clearHighlight();
      onBuildingSelect(null);
      onRoadSelect(null);
      onFutureFacilitySelect(null);
      selectFacility(nearbyFacility);
      viewer.scene.requestRender();
      return;
    }
    const roadPickId = roadPickIdFromPickedObject(picked);
    const nearbyRoadId = roadPickId?.roadId ??
      findNearestRoadId(viewer, WEST_MAIZURU_ROAD_PROOF.roads, click.position) ??
      findNearestRoadIdFromClickPosition(viewer, WEST_MAIZURU_ROAD_PROOF.roads, click.position);
    if (nearbyRoadId && !buildingPick) {
      clearHighlight();
      onBuildingSelect(null);
      onFacilitySelect(null);
      onFutureFacilitySelect(null);
      onRoadSelect(getRoadSelection(nearbyRoadId));
      viewer.scene.requestRender();
      return;
    }
    if (!(picked instanceof Cesium3DTileFeature)) {
      clearHighlight();
      onBuildingSelect(null);
      onFacilitySelect(null);
      onRoadSelect(null);
      onFutureFacilitySelect(null);
      viewer.scene.requestRender();
      return;
    }

    clearHighlight();
    onFacilitySelect(null);
    onRoadSelect(null);
    onFutureFacilitySelect(null);
    highlighted = picked as MutableFeature;
    previousColor = Color.clone(highlighted.color ?? Color.WHITE);
    highlighted.color = Color.fromCssColorString("#facc15").withAlpha(0.88);

    const cartographic = cartographicFromClick(viewer, click.position);
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
    const linkedFeature = findVerifiedFacilityBuildingFeature(viewer, facility);
    if (linkedFeature) {
      highlighted = linkedFeature;
      previousColor = Color.clone(highlighted.color ?? Color.WHITE);
      highlighted.color = Color.fromCssColorString("#22d3ee").withAlpha(0.9);
    }
    onFacilitySelect({
      facility,
      ...computeFacilityScenarioImpact(
        facility,
        getGroundElevation(),
        getSeaConnectivity(),
        getTideLevelMeters(),
        getInundationMethod()
      )
    });
  }

  return () => {
    clearHighlight();
    handler.destroy();
  };
}

function cartographicFromClick(viewer: Viewer, position: Cartesian2) {
  const ray = viewer.camera.getPickRay(position);
  // globe.pick: CPU-side ray–terrain intersection, works without depthTestAgainstTerrain.
  // pickEllipsoid: always hits the WGS84 surface, safe fallback.
  // pickPosition: GPU depth buffer read, accurate for 3D tile buildings but unreliable
  //   on bare terrain when depthTestAgainstTerrain=false.
  const cartesian = (ray ? viewer.scene.globe.pick(ray, viewer.scene) : undefined)
    ?? viewer.camera.pickEllipsoid(position, viewer.scene.globe.ellipsoid)
    ?? viewer.scene.pickPosition(position);
  return cartesian ? Cartographic.fromCartesian(cartesian) : null;
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

function findVerifiedFacilityBuildingFeature(viewer: Viewer, facility: Facility): MutableFeature | null {
  if (facility.plateauLinkStatus !== "verified" || !facility.plateauBuildingId) return null;

  const baseScreenPosition = viewer.scene.cartesianToCanvasCoordinates(
    Cartesian3.fromDegrees(facility.longitude, facility.latitude, 3)
  );
  if (!baseScreenPosition) return null;

  const positions = [baseScreenPosition];
  for (let dx = -36; dx <= 36; dx += 6) {
    for (let dy = -36; dy <= 36; dy += 6) {
      if (dx === 0 && dy === 0) continue;
      positions.push(Cartesian2.add(baseScreenPosition, new Cartesian2(dx, dy), new Cartesian2()));
    }
  }

  for (const position of positions) {
    const pickedObjects = viewer.scene.drillPick(position, 12);
    for (const candidate of pickedObjects) {
      if (!(candidate instanceof Cesium3DTileFeature)) continue;
      if (readFirstProperty(candidate, FIELD_CANDIDATES.identifier) === facility.plateauBuildingId) {
        return candidate as MutableFeature;
      }
    }
  }

  return null;
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
