import { POPULATION_MESH_CELLS, POPULATION_MESH_METADATA, type PopulationMeshCell } from "./populationMesh";
import { distanceMeters } from "./locationEvaluation";
import type { Facility, FacilityCategory } from "../types/facility";

export const POPULATION_SERVICE_RADIUS_METERS = 800;

export type PopulationImpact = {
  affectedPopulation: number;
  newlyCoveredPopulation: number;
  remainingAffectedPopulation: number;
  affectedMeshCodes: string[];
  coveredMeshCodes: string[];
  serviceRadiusMeters: number;
  source: string;
  sourceUrl: string;
  surveyYear: number;
  note: string;
};

type FutureCoverageCandidate = {
  category: FacilityCategory;
  longitude: number;
  latitude: number;
  impact: {
    depthMeters: number | null;
  };
} | null;

/**
 * 影響人口の定義:
 *   水害前に対象カテゴリの施設圏内（800m以内）にいた人口のうち、
 *   水害後に安全な（影響を受けていない）既存施設の圏外になった人口。
 *
 * 改善人口の定義:
 *   上記影響人口のうち、新しい未来施設のサービス圏（800m以内）に入る人口。
 *   二重計上しないため、影響人口のサブセットのみを対象とする。
 */
export function computeCategoryPopulationImpact({
  category,
  facilities,
  affectedFacilityIds,
  futureFacility = null
}: {
  category: FacilityCategory;
  facilities: Facility[];
  affectedFacilityIds: Set<string>;
  futureFacility?: FutureCoverageCandidate;
}): PopulationImpact {
  const categoryFacilities = facilities.filter((f) => f.category === category);

  // 安全な既存施設（現水位で影響を受けていない施設）
  const safeFacilities = categoryFacilities.filter((f) => !affectedFacilityIds.has(f.id));

  // 水害前: 対象カテゴリの施設いずれかから800m以内のメッシュ
  const allServedCells = cellsNearFacilities(categoryFacilities);

  // 影響メッシュ: 「水害前に圏内」かつ「水害後は安全施設の圏外」
  const affectedCells = safeFacilities.length === 0
    ? allServedCells
    : allServedCells.filter((cell) =>
      !safeFacilities.some((fac) =>
        distanceMeters(fac.longitude, fac.latitude, cell.longitude, cell.latitude)
          <= POPULATION_SERVICE_RADIUS_METERS
      )
    );

  // 未来施設がある場合: 影響メッシュのうち未来施設の圏内に入るものが改善対象
  const futureCanCover = futureFacility !== null
    && futureFacility.category === category
    && futureFacility.impact.depthMeters === 0;

  const coveredCells = futureCanCover
    ? affectedCells.filter((cell) =>
      distanceMeters(futureFacility.longitude, futureFacility.latitude, cell.longitude, cell.latitude)
        <= POPULATION_SERVICE_RADIUS_METERS
    )
    : [];

  const affectedPopulation = sumPopulation(affectedCells);
  const newlyCoveredPopulation = sumPopulation(coveredCells);

  return {
    affectedPopulation,
    newlyCoveredPopulation,
    remainingAffectedPopulation: Math.max(0, affectedPopulation - newlyCoveredPopulation),
    affectedMeshCodes: affectedCells.map((cell) => cell.meshCode),
    coveredMeshCodes: coveredCells.map((cell) => cell.meshCode),
    serviceRadiusMeters: POPULATION_SERVICE_RADIUS_METERS,
    source: POPULATION_MESH_METADATA.source,
    sourceUrl: POPULATION_MESH_METADATA.sourceUrl,
    surveyYear: POPULATION_MESH_METADATA.surveyYear,
    note: "2020年国勢調査500mメッシュ人口を、施設800m圏で集計した推計です。安全な既存施設でカバーされている人口は含みません。実利用者数ではありません。"
  };
}

function cellsNearFacilities(facilities: Facility[]): PopulationMeshCell[] {
  if (facilities.length === 0) return [];
  return POPULATION_MESH_CELLS.filter((cell) =>
    facilities.some((facility) =>
      distanceMeters(facility.longitude, facility.latitude, cell.longitude, cell.latitude)
        <= POPULATION_SERVICE_RADIUS_METERS
    )
  );
}

function sumPopulation(cells: PopulationMeshCell[]) {
  return cells.reduce((sum, cell) => sum + cell.population, 0);
}
