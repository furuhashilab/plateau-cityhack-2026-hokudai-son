import type { InundationMethod } from "../data/inundation";

export type DataProvenance =
  | "official-municipal"
  | "official-prefectural"
  | "official-national"
  | "openstreetmap"
  | "manual-curated"
  | "scenario";

export type FacilityCategory = "medical" | "evacuation" | "transport" | "daily-life";

export type Facility = {
  id: string;
  kind: "existing";
  name: string;
  category: FacilityCategory;
  facilityType: string;
  longitude: number;
  latitude: number;
  source: string;
  sourceUrl: string;
  provenance: Exclude<DataProvenance, "scenario">;
  plateauBuildingId: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export type FacilitySelection = {
  facility: Facility;
  groundElevationMeters: number | null;
  tideLevelMeters: number;
  depthMeters: number | null;
  status: "Safe" | "Shallow" | "Significant" | "Deep" | null;
  method: InundationMethod;
  connectionThresholdMeters: number | null;
  connectedToSea: boolean | null;
};

export type FacilityCategoryVisibility = Record<FacilityCategory, boolean>;
