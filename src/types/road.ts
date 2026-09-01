import type { InundationMethod } from "../data/inundation";

export type RoadSample = {
  longitude: number;
  latitude: number;
  distanceAlongRoadMeters: number;
  groundElevationMeters: number | null;
  seaConnectionThresholdMeters: number | null;
  valid: boolean;
};

export type RoadFeature = {
  id: string;
  sourceId: string;
  name: string | null;
  roadClass: string;
  geometry: {
    type: "LineString";
    coordinates: Array<[longitude: number, latitude: number]>;
  };
  bbox: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
  totalLengthMeters: number;
  provenance: {
    source: string;
    sourceUrl: string;
    attribution: string;
    license: string;
    retrievalDate: string;
    processing: string;
  };
  samples: RoadSample[];
};

export type RoadDataset = {
  id: string;
  label: string;
  source: {
    name: string;
    url: string;
    attribution: string;
    license: string;
    retrievalDate: string;
    retrievalMethod: string;
    overpassUrl: string;
    osmBaseTimestamp: string | null;
  };
  aoi: {
    label: string;
    south: number;
    west: number;
    north: number;
    east: number;
  };
  selectedHighwayClasses: string[];
  excludedHighwayClasses: string[];
  processing: {
    method: string;
    sampleSpacingMeters: number;
    minimumLengthMeters: number;
    maxFeatures: number;
    demSource: string;
    seaConnectivity: string;
  };
  summary: {
    osmWayCount: number;
    roadFeatureCount: number;
    sampleCount: number;
    totalLengthMeters: number;
    invalidSampleCount: number;
    roadClasses: Record<string, number>;
  };
  roads: RoadFeature[];
};

export type RoadImpactMetrics = {
  roadId: string;
  tideLevelMeters: number;
  method: InundationMethod;
  sampleCount: number;
  affectedSampleCount: number;
  minGroundElevationMeters: number | null;
  maxPotentialDepthMeters: number;
  meanPotentialDepthMeters: number;
  affectedLengthMeters: number;
  affectedRatio: number;
};

export type RoadSelection = {
  road: RoadFeature;
  metrics: RoadImpactMetrics;
};
