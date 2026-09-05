import rawPopulationMesh from "./populationMesh500m.json";

export type PopulationMeshCell = {
  meshCode: string;
  latitude: number;
  longitude: number;
  population: number;
};

export type PopulationMeshMetadata = {
  id: string;
  source: string;
  sourceUrl: string;
  termsUrl: string;
  statsId: string;
  table: string;
  surveyYear: number;
  surveyDate: string;
  aggregateUnit: string;
  firstAreaMeshCode: string;
  populationField: string;
  extraction: string;
  cellCount: number;
  totalPopulation: number;
};

export type PopulationMeshDataset = {
  metadata: PopulationMeshMetadata;
  cells: PopulationMeshCell[];
};

const dataset = rawPopulationMesh as PopulationMeshDataset;

export const POPULATION_MESH_METADATA = dataset.metadata;
export const POPULATION_MESH_CELLS = dataset.cells;
