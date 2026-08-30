export const TIDE_LEVEL = {
  minMeters: 0,
  maxMeters: 5,
  stepMeters: 0.1,
  initialMeters: 0
} as const;

export type InundationMethod = "elevation-only" | "sea-connected";

export const DEFAULT_INUNDATION_METHOD: InundationMethod = "sea-connected";

export const INUNDATION_BANDS = [
  { minMeters: 0, maxMeters: 0.5, label: "Shallow: below 0.5 m", color: "#55d7ff" },
  { minMeters: 0.5, maxMeters: 1, label: "Medium: 0.5–1.0 m", color: "#1687d9" },
  { minMeters: 1, maxMeters: Number.POSITIVE_INFINITY, label: "Deep: 1.0 m and above", color: "#5b3fc0" }
] as const;

export function inundationDepth(tideLevelMeters: number, groundElevationMeters: number) {
  return Math.max(0, tideLevelMeters - groundElevationMeters);
}
