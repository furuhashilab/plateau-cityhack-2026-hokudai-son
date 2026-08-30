export type ViewerPhase = "initializing" | "loading" | "interactive" | "error";

export type ViewerStatus = {
  phase: ViewerPhase;
  message: string;
  initialLoadMs: number | null;
  interactiveMs: number | null;
  pendingTiles: number;
  processingTiles: number;
  loadedTiles: number;
  fps: number | null;
  memoryMb: number | null;
};

export type PlateauTilesetDataset = {
  id: string;
  label: string;
  city: string;
  year: number;
  source: string;
  format: string;
  aoiLabel: string;
  tilesetUrl: string;
  sourceUrl: string;
  heightOffsetMeters?: number;
  heightOffsetReason?: string;
};

export type BuildingSelection = {
  fields: {
    identifier: string | null;
    name: string | null;
    usage: string | null;
    measuredHeight: string | null;
  };
  inundation: {
    groundElevationMeters: number | null;
    tideLevelMeters: number;
    depthMeters: number | null;
    status: "Safe" | "Shallow impact" | "Significant impact" | null;
    method: "elevation-only" | "sea-connected";
    connectionThresholdMeters: number | null;
    connectedToSea: boolean | null;
  };
  availablePropertyIds: string[];
};
