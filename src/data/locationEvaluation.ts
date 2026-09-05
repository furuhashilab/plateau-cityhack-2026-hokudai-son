import type { ScenarioPointImpact } from "./urbanFunctions";
import type { PopulationImpact } from "./populationImpact";
import type { Facility, FacilityCategory } from "../types/facility";

export type LocationEvaluation = {
  waterClearanceMeters: number | null;
  nearestTransportFacilityMeters: number | null;
  nearestTransportFacilityName: string | null;
  nearbyExistingFacilityCount800m: number;
  nearbyExistingFacilitiesByCategory: Partial<Record<FacilityCategory, number>>;
  populationImpact: PopulationImpact;
};

export type ComparisonScenario = {
  key: string;
  label: string;
  category: FacilityCategory;
  longitude: number;
  latitude: number;
  impact: ScenarioPointImpact;
  evaluation: LocationEvaluation;
};

export function evaluateFutureFacilityLocation({
  longitude,
  latitude,
  impact,
  facilities,
  populationImpact
}: {
  longitude: number;
  latitude: number;
  impact: ScenarioPointImpact;
  facilities: Facility[];
  populationImpact: PopulationImpact;
}): LocationEvaluation {
  const transportFacilities = facilities.filter((facility) => facility.category === "transport");
  const nearestTransport = nearestFacilityDistance(longitude, latitude, transportFacilities);
  const nearby = facilities.filter((facility) =>
    distanceMeters(longitude, latitude, facility.longitude, facility.latitude) <= 800
  );

  return {
    waterClearanceMeters: impact.groundElevationMeters === null
      ? null
      : impact.groundElevationMeters - impact.tideLevelMeters,
    nearestTransportFacilityMeters: nearestTransport?.meters ?? null,
    nearestTransportFacilityName: nearestTransport?.facility.name ?? null,
    nearbyExistingFacilityCount800m: nearby.length,
    nearbyExistingFacilitiesByCategory: nearby.reduce<Partial<Record<FacilityCategory, number>>>((counts, facility) => {
      counts[facility.category] = (counts[facility.category] ?? 0) + 1;
      return counts;
    }, {}),
    populationImpact
  };
}

export function comparisonKeyForLocation(category: FacilityCategory, longitude: number, latitude: number) {
  return `${category}:${longitude.toFixed(6)}:${latitude.toFixed(6)}`;
}

export function upsertComparisonScenario(
  scenarios: ComparisonScenario[],
  scenario: Omit<ComparisonScenario, "label">
): ComparisonScenario[] {
  const existingIndex = scenarios.findIndex((item) => item.key === scenario.key);
  const updated = existingIndex >= 0
    ? scenarios.map((item, index) => index === existingIndex ? { ...scenario, label: item.label } : item)
    : [...scenarios, { ...scenario, label: "" }];
  return relabelComparisonScenarios(updated.slice(-3));
}

function relabelComparisonScenarios(scenarios: ComparisonScenario[]) {
  return scenarios.map((scenario, index) => ({
    ...scenario,
    label: `地点${String.fromCharCode("A".charCodeAt(0) + index)}`
  }));
}

function nearestFacilityDistance(longitude: number, latitude: number, facilities: Facility[]) {
  let nearest: { facility: Facility; meters: number } | null = null;
  for (const facility of facilities) {
    const meters = distanceMeters(longitude, latitude, facility.longitude, facility.latitude);
    if (!nearest || meters < nearest.meters) {
      nearest = { facility, meters };
    }
  }
  return nearest;
}

export function distanceMeters(
  longitudeA: number,
  latitudeA: number,
  longitudeB: number,
  latitudeB: number
) {
  const earthRadiusMeters = 6_371_000;
  const lat1 = toRadians(latitudeA);
  const lat2 = toRadians(latitudeB);
  const deltaLat = toRadians(latitudeB - latitudeA);
  const deltaLon = toRadians(longitudeB - longitudeA);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(degrees: number) {
  return degrees * Math.PI / 180;
}
