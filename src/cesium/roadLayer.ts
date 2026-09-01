import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  ColorGeometryInstanceAttribute,
  GeometryInstance,
  GroundPolylineGeometry,
  GroundPolylinePrimitive,
  Math as CesiumMath,
  PolylineColorAppearance,
  Viewer
} from "cesium";
import { computeRoadImpactMetrics, roadById } from "../data/roads";
import type { InundationMethod } from "../data/inundation";
import type { RoadFeature, RoadSelection } from "../types/road";

export type RoadPickId = { kind: "road"; roadId: string };

export type RoadLayerStats = {
  roadFeatureCount: number;
  sampleCount: number;
  preprocessingMs: number;
  lastUpdateMs: number;
};

export type RoadLayer = {
  setScenario: (tideLevelMeters: number, method: InundationMethod) => RoadLayerStats;
  selectionForRoadId: (roadId: string) => RoadSelection | null;
  stats: () => RoadLayerStats;
  destroy: () => void;
};

export function createRoadLayer(
  viewer: Viewer,
  roads: RoadFeature[],
  tideLevelMeters: number,
  method: InundationMethod
): RoadLayer {
  const startedAt = performance.now();

  // Pre-compute initial metrics so the GeometryInstance carries the correct
  // opening color — GroundPolylinePrimitive.getGeometryInstanceAttributes
  // throws until after the first scene update, so we cannot apply colors in
  // an immediate applyScenario() call.
  const initialMetrics = roads.map((road) =>
    computeRoadImpactMetrics(road, tideLevelMeters, method)
  );

  const primitive = viewer.scene.groundPrimitives.add(new GroundPolylinePrimitive({
    geometryInstances: roads.map((road, i) => new GeometryInstance({
      id: roadPickId(road.id),
      geometry: new GroundPolylineGeometry({
        positions: Cartesian3.fromDegreesArray(road.geometry.coordinates.flat()),
        width: 4
      }),
      attributes: {
        color: ColorGeometryInstanceAttribute.fromColor(
          colorForMetrics(initialMetrics[i].maxPotentialDepthMeters, initialMetrics[i].affectedRatio)
        )
      }
    })),
    appearance: new PolylineColorAppearance({
      translucent: true
    })
  }));

  const state = {
    tideLevelMeters,
    method,
    lastUpdateMs: 0
  };
  let currentStats: RoadLayerStats = {
    roadFeatureCount: roads.length,
    sampleCount: roads.reduce((sum, road) => sum + road.samples.length, 0),
    preprocessingMs: performance.now() - startedAt,
    lastUpdateMs: 0
  };

  const applyScenario = () => {
    const updateStartedAt = performance.now();
    for (const road of roads) {
      const metrics = computeRoadImpactMetrics(road, state.tideLevelMeters, state.method);
      let attributes;
      try {
        attributes = primitive.getGeometryInstanceAttributes(roadPickId(road.id));
      } catch {
        // Primitive not yet updated by the scene — skip; colors are already
        // set correctly from the initial GeometryInstance attributes.
        continue;
      }
      if (!attributes) continue;
      attributes.color = ColorGeometryInstanceAttribute.toValue(
        colorForMetrics(metrics.maxPotentialDepthMeters, metrics.affectedRatio)
      );
    }
    state.lastUpdateMs = performance.now() - updateStartedAt;
    currentStats = { ...currentStats, lastUpdateMs: state.lastUpdateMs };
    viewer.scene.requestRender();
    return currentStats;
  };

  // No immediate applyScenario() call — initial colors baked into GeometryInstances above.

  return {
    setScenario(nextTideLevelMeters, nextMethod) {
      if (nextTideLevelMeters === state.tideLevelMeters && nextMethod === state.method) return currentStats;
      state.tideLevelMeters = nextTideLevelMeters;
      state.method = nextMethod;
      return applyScenario();
    },
    selectionForRoadId(roadId) {
      const road = roadById(roadId);
      return road ? { road, metrics: computeRoadImpactMetrics(road, state.tideLevelMeters, state.method) } : null;
    },
    stats() {
      return currentStats;
    },
    destroy() {
      viewer.scene.groundPrimitives.remove(primitive);
    }
  };
}

export function isRoadPickId(value: unknown): value is RoadPickId {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RoadPickId>;
  return candidate.kind === "road" && typeof candidate.roadId === "string";
}

export function roadPickIdFromPickedObject(picked: unknown): RoadPickId | null {
  const candidate = picked as { id?: unknown; primitive?: { id?: unknown } } | null | undefined;
  if (isRoadPickString(candidate?.id)) return roadPickIdFromString(candidate.id);
  if (isRoadPickString(candidate?.primitive?.id)) return roadPickIdFromString(candidate.primitive.id);
  if (isRoadPickId(candidate?.id)) return candidate.id;
  if (isRoadPickId(candidate?.primitive?.id)) return candidate.primitive.id;
  return null;
}

export function findNearestRoadId(
  viewer: Viewer,
  roads: RoadFeature[],
  position: Cartesian2,
  maxDistancePixels = 10
) {
  let nearest: { roadId: string; distanceSquared: number } | null = null;
  for (const road of roads) {
    for (let index = 1; index < road.geometry.coordinates.length; index += 1) {
      const a = screenPosition(viewer, road.geometry.coordinates[index - 1]);
      const b = screenPosition(viewer, road.geometry.coordinates[index]);
      if (!a || !b) continue;
      const distanceSquared = distanceToSegmentSquared(position, a, b);
      if (
        distanceSquared <= maxDistancePixels * maxDistancePixels &&
        (!nearest || distanceSquared < nearest.distanceSquared)
      ) {
        nearest = { roadId: road.id, distanceSquared };
      }
    }
  }
  return nearest?.roadId ?? null;
}

export function findNearestRoadIdFromClickPosition(
  viewer: Viewer,
  roads: RoadFeature[],
  position: Cartesian2,
  maxDistanceMeters = 14
) {
  const cartesian = viewer.camera.pickEllipsoid(position, viewer.scene.globe.ellipsoid);
  if (!cartesian) return null;
  const cartographic = Cartographic.fromCartesian(cartesian);
  const longitude = CesiumMath.toDegrees(cartographic.longitude);
  const latitude = CesiumMath.toDegrees(cartographic.latitude);
  let nearest: { roadId: string; distanceMeters: number } | null = null;
  for (const road of roads) {
    if (!coordinateInExpandedBbox(longitude, latitude, road.bbox, maxDistanceMeters)) continue;
    for (let index = 1; index < road.geometry.coordinates.length; index += 1) {
      const distanceMeters = distanceToGeographicSegmentMeters(
        longitude,
        latitude,
        road.geometry.coordinates[index - 1],
        road.geometry.coordinates[index]
      );
      if (distanceMeters <= maxDistanceMeters && (!nearest || distanceMeters < nearest.distanceMeters)) {
        nearest = { roadId: road.id, distanceMeters };
      }
    }
  }
  return nearest?.roadId ?? null;
}

function roadPickId(roadId: string) {
  return `road:${roadId}`;
}

function isRoadPickString(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("road:");
}

function roadPickIdFromString(value: string): RoadPickId {
  return { kind: "road", roadId: value.slice("road:".length) };
}

function colorForMetrics(maxDepthMeters: number, affectedRatio: number) {
  if (affectedRatio <= 0 || maxDepthMeters <= 0) {
    return Color.fromCssColorString("#d7dee8").withAlpha(0.58);
  }
  if (maxDepthMeters >= 1 || affectedRatio >= 0.65) {
    return Color.fromCssColorString("#f97316").withAlpha(0.96);
  }
  if (maxDepthMeters >= 0.5 || affectedRatio >= 0.35) {
    return Color.fromCssColorString("#facc15").withAlpha(0.92);
  }
  return Color.fromCssColorString("#fde68a").withAlpha(0.9);
}

function screenPosition(viewer: Viewer, coordinate: [number, number]) {
  return viewer.scene.cartesianToCanvasCoordinates(Cartesian3.fromDegrees(coordinate[0], coordinate[1], 4));
}

function distanceToSegmentSquared(point: Cartesian2, a: Cartesian2, b: Cartesian2) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Cartesian2.distanceSquared(point, a);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  const projection = new Cartesian2(a.x + t * dx, a.y + t * dy);
  return Cartesian2.distanceSquared(point, projection);
}

function coordinateInExpandedBbox(
  longitude: number,
  latitude: number,
  bbox: RoadFeature["bbox"],
  expansionMeters: number
) {
  const latExpansion = expansionMeters / 111_320;
  const lonExpansion = expansionMeters / (111_320 * Math.max(0.2, Math.cos(CesiumMath.toRadians(latitude))));
  return longitude >= bbox.west - lonExpansion &&
    longitude <= bbox.east + lonExpansion &&
    latitude >= bbox.south - latExpansion &&
    latitude <= bbox.north + latExpansion;
}

function distanceToGeographicSegmentMeters(
  longitude: number,
  latitude: number,
  a: [number, number],
  b: [number, number]
) {
  const metersPerDegreeLatitude = 111_320;
  const metersPerDegreeLongitude = metersPerDegreeLatitude * Math.cos(CesiumMath.toRadians(latitude));
  const point = { x: 0, y: 0 };
  const start = {
    x: (a[0] - longitude) * metersPerDegreeLongitude,
    y: (a[1] - latitude) * metersPerDegreeLatitude
  };
  const end = {
    x: (b[0] - longitude) * metersPerDegreeLongitude,
    y: (b[1] - latitude) * metersPerDegreeLatitude
  };
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(start.x - point.x, start.y - point.y);
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return Math.hypot(start.x + t * dx, start.y + t * dy);
}
