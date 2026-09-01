import rawRoadProof from "./roads/westMaizuruRoadProof.json";
import { inundationDepth, type InundationMethod } from "./inundation";
import type { RoadDataset, RoadFeature, RoadImpactMetrics, RoadSample } from "../types/road";

export const WEST_MAIZURU_ROAD_PROOF = rawRoadProof as unknown as RoadDataset;

export function roadById(id: string) {
  return WEST_MAIZURU_ROAD_PROOF.roads.find((road) => road.id === id) ?? null;
}

export function computeRoadImpactMetrics(
  road: RoadFeature,
  tideLevelMeters: number,
  method: InundationMethod
): RoadImpactMetrics {
  const validSamples = road.samples.filter((sample) => sample.valid && sample.groundElevationMeters !== null);
  const affected = new Set<number>();
  let minGroundElevationMeters: number | null = null;
  let maxPotentialDepthMeters = 0;
  let depthSum = 0;

  validSamples.forEach((sample, validIndex) => {
    const groundElevationMeters = sample.groundElevationMeters;
    if (groundElevationMeters === null) return;
    minGroundElevationMeters = minGroundElevationMeters === null
      ? groundElevationMeters
      : Math.min(minGroundElevationMeters, groundElevationMeters);
    if (isRoadSampleAffected(sample, tideLevelMeters, method)) {
      const depth = inundationDepth(tideLevelMeters, groundElevationMeters);
      affected.add(validIndex);
      maxPotentialDepthMeters = Math.max(maxPotentialDepthMeters, depth);
      depthSum += depth;
    }
  });

  const affectedLengthMeters = intervalAffectedLength(road.samples, tideLevelMeters, method);
  const affectedSampleCount = affected.size;
  return {
    roadId: road.id,
    tideLevelMeters,
    method,
    sampleCount: validSamples.length,
    affectedSampleCount,
    minGroundElevationMeters,
    maxPotentialDepthMeters,
    meanPotentialDepthMeters: affectedSampleCount > 0 ? depthSum / affectedSampleCount : 0,
    affectedLengthMeters,
    affectedRatio: road.totalLengthMeters > 0 ? affectedLengthMeters / road.totalLengthMeters : 0
  };
}

export function isRoadSampleAffected(
  sample: RoadSample,
  tideLevelMeters: number,
  method: InundationMethod
) {
  if (!sample.valid || sample.groundElevationMeters === null) return false;
  if (sample.groundElevationMeters >= tideLevelMeters) return false;
  return method === "elevation-only" ||
    (sample.seaConnectionThresholdMeters !== null && sample.seaConnectionThresholdMeters <= tideLevelMeters);
}

function intervalAffectedLength(
  samples: RoadSample[],
  tideLevelMeters: number,
  method: InundationMethod
) {
  let length = 0;
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    if (
      !previous.valid ||
      !current.valid ||
      previous.groundElevationMeters === null ||
      current.groundElevationMeters === null
    ) {
      continue;
    }
    const intervalLength = Math.max(0, current.distanceAlongRoadMeters - previous.distanceAlongRoadMeters);
    const previousAffected = isRoadSampleAffected(previous, tideLevelMeters, method);
    const currentAffected = isRoadSampleAffected(current, tideLevelMeters, method);
    if (previousAffected && currentAffected) {
      length += intervalLength;
    } else if (previousAffected || currentAffected) {
      length += intervalLength / 2;
    }
  }
  return length;
}
