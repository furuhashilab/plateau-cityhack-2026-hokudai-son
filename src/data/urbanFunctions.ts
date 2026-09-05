import { FACILITY_CATEGORIES } from "./facilities";
import { inundationDepth, type InundationMethod } from "./inundation";
import { computeCategoryPopulationImpact, type PopulationImpact } from "./populationImpact";
import type { LoadedGroundElevation } from "./groundElevation";
import type { SeaConnectivity } from "./seaConnectivity";
import type { Facility, FacilityCategory, FacilitySelection } from "../types/facility";
import type { FutureFacilityScenario } from "../types/futureFacility";

export type UrbanFunctionSummary = {
  category: FacilityCategory;
  label: string;
  symbol: string;
  color: string;
  totalCount: number;
  affectedCount: number;
  unaffectedCount: number;
  affectedRatio: number;
  populationImpact: PopulationImpact;
};

export type UrbanFunctionImpactState = {
  summaries: UrbanFunctionSummary[];
  affectedFacilityIds: Set<string>;
};

export type ScenarioPointImpact = Omit<FacilitySelection, "facility">;

export function computeFacilityScenarioImpact(
  facility: Facility,
  groundElevation: LoadedGroundElevation | null,
  seaConnectivity: SeaConnectivity | null,
  tideLevelMeters: number,
  method: InundationMethod
): ScenarioPointImpact {
  return computeScenarioPointImpact(
    facility.longitude,
    facility.latitude,
    groundElevation,
    seaConnectivity,
    tideLevelMeters,
    method
  );
}

export function computeScenarioPointImpact(
  longitude: number,
  latitude: number,
  groundElevation: LoadedGroundElevation | null,
  seaConnectivity: SeaConnectivity | null,
  tideLevelMeters: number,
  method: InundationMethod
): ScenarioPointImpact {
  const groundElevationMeters = groundElevation?.sampleMeters(longitude, latitude) ?? null;
  const connectionThresholdMeters = seaConnectivity?.sampleConnectionThresholdMeters(
    longitude,
    latitude
  ) ?? null;
  const connectedToSea = connectionThresholdMeters === null ? null : connectionThresholdMeters <= tideLevelMeters;
  const depthMeters = groundElevationMeters === null
    ? null
    : method === "sea-connected" && connectedToSea !== true
      ? 0
      : inundationDepth(tideLevelMeters, groundElevationMeters);

  return {
    groundElevationMeters,
    tideLevelMeters,
    depthMeters,
    method,
    connectionThresholdMeters,
    connectedToSea,
    status: facilityStatus(depthMeters)
  };
}

export function urbanFunctionSummaryWithProposal(
  summary: UrbanFunctionSummary,
  futureFacility: FutureFacilityScenario | null
) {
  const includesProposal = futureFacility?.category === summary.category;
  const proposalAffected = includesProposal && (futureFacility.impact.depthMeters ?? 0) > 0;
  const proposalUnaffected = includesProposal && futureFacility.impact.depthMeters === 0;

  return {
    totalCount: summary.totalCount + (includesProposal ? 1 : 0),
    affectedCount: summary.affectedCount + (proposalAffected ? 1 : 0),
    unaffectedCount: summary.unaffectedCount + (proposalUnaffected ? 1 : 0)
  };
}

export function computeUrbanFunctionImpactState(
  facilities: Facility[],
  groundElevation: LoadedGroundElevation | null,
  seaConnectivity: SeaConnectivity | null,
  tideLevelMeters: number,
  method: InundationMethod
): UrbanFunctionImpactState {
  const affectedFacilityIds = new Set<string>();
  const impactedFacilities = facilities.map((facility) => {
    const impact = computeFacilityScenarioImpact(facility, groundElevation, seaConnectivity, tideLevelMeters, method);
    if ((impact.depthMeters ?? 0) > 0) {
      affectedFacilityIds.add(facility.id);
    }
    return { facility, impact };
  });

  return {
    affectedFacilityIds,
    summaries: FACILITY_CATEGORIES.map((category) => {
      const categoryFacilities = impactedFacilities.filter((item) => item.facility.category === category.id);
      const affectedCount = categoryFacilities.filter((item) => (item.impact.depthMeters ?? 0) > 0).length;
      const totalCount = categoryFacilities.length;
      return {
        category: category.id,
        label: category.label,
        symbol: category.symbol,
        color: category.color,
        totalCount,
        affectedCount,
        unaffectedCount: totalCount - affectedCount,
        affectedRatio: totalCount > 0 ? affectedCount / totalCount : 0,
        populationImpact: computeCategoryPopulationImpact({
          category: category.id,
          facilities,
          affectedFacilityIds
        })
      };
    })
  };
}

function facilityStatus(depthMeters: number | null): FacilitySelection["status"] {
  if (depthMeters === null) return null;
  if (depthMeters === 0) return "Safe";
  if (depthMeters < 0.5) return "Shallow";
  if (depthMeters < 1) return "Significant";
  return "Deep";
}
