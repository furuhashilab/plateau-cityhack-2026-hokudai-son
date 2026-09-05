import rawFacilities from "./facilities/westMaizuruFacilities.json";
import { facilityCategoryLabel } from "./facilityLabels";
import type { Facility, FacilityCategory, FacilityCategoryVisibility } from "../types/facility";

export const FACILITY_CATEGORIES: Array<{ id: FacilityCategory; label: string; symbol: string; color: string }> = [
  { id: "medical", label: facilityCategoryLabel("medical").shortName, symbol: "+", color: "#fb7185" },
  { id: "evacuation", label: facilityCategoryLabel("evacuation").shortName, symbol: "E", color: "#fbbf24" },
  { id: "transport", label: facilityCategoryLabel("transport").shortName, symbol: "T", color: "#60a5fa" },
  { id: "daily-life", label: facilityCategoryLabel("daily-life").shortName, symbol: "D", color: "#4ade80" }
];

export const DEFAULT_FACILITY_VISIBILITY: FacilityCategoryVisibility = {
  medical: true,
  evacuation: true,
  transport: true,
  "daily-life": true
};

export const WEST_MAIZURU_FACILITIES = rawFacilities as Facility[];

export function facilityById(id: string) {
  return WEST_MAIZURU_FACILITIES.find((facility) => facility.id === id) ?? null;
}
