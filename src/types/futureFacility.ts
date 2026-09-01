import type { ScenarioPointImpact } from "../data/urbanFunctions";
import type { FacilityCategory } from "./facility";

export type FutureFacilityScenario = {
  id: "future-facility";
  kind: "scenario";
  category: FacilityCategory;
  name: string;
  facilityType: string;
  longitude: number;
  latitude: number;
  impact: ScenarioPointImpact;
};
