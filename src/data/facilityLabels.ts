import type { FacilityCategory } from "../types/facility";

export type FacilityCategoryUiLabel = {
  shortName: string;
  markerName: string;
  futureName: string;
  existingGroupName: string;
  problemSubject: string;
  problemQuestion: string;
  placementCta: string;
};

export const FACILITY_CATEGORY_LABELS: Record<FacilityCategory, FacilityCategoryUiLabel> = {
  medical: {
    shortName: "病院・医院",
    markerName: "病院",
    futureName: "病院",
    existingGroupName: "病院や医院",
    problemSubject: "病院や医院",
    problemQuestion: "体の調子が悪い人は、どこに行けばよいでしょう？",
    placementCta: "新しい病院を考える"
  },
  evacuation: {
    shortName: "にげる場所",
    markerName: "避難",
    futureName: "にげる場所",
    existingGroupName: "にげる場所",
    problemSubject: "にげる場所",
    problemQuestion: "水が来たとき、この地域の人たちはどこへ向かうとよいでしょう？",
    placementCta: "新しいにげる場所を考える"
  },
  transport: {
    shortName: "駅・移動",
    markerName: "駅",
    futureName: "駅・移動",
    existingGroupName: "駅や移動の場所",
    problemSubject: "駅や移動の場所",
    problemQuestion: "移動しにくくなる人たちは、どんな場所に集まれるとよいでしょう？",
    placementCta: "新しい駅・移動の場所を考える"
  },
  "daily-life": {
    shortName: "スーパー",
    markerName: "買物",
    futureName: "スーパー",
    existingGroupName: "スーパー",
    problemSubject: "買い物できる場所",
    problemQuestion: "この地域の人たちは、どこで買い物すればよいでしょう？",
    placementCta: "新しい買い物場所を考える"
  }
};

export function facilityCategoryLabel(category: FacilityCategory) {
  return FACILITY_CATEGORY_LABELS[category];
}
