import type { RoadSelection } from "../types/road";

export function SelectedRoadPanel({ selection }: { selection: RoadSelection }) {
  const { road, metrics } = selection;
  return (
    <div className="panel selected-panel road-panel">
      <div className="eyebrow">Road</div>
      <h2>{road.name ?? "Unknown"}</h2>
      <dl>
        <div><dt>Name</dt><dd>{road.name ?? "Unknown"}</dd></div>
        <div><dt>Road class</dt><dd>{road.roadClass}</dd></div>
        <div><dt>Source</dt><dd><a href={road.provenance.sourceUrl} target="_blank" rel="noreferrer">{road.provenance.source}</a></dd></div>
        <div><dt>Scenario tide</dt><dd>{formatMeters(metrics.tideLevelMeters, true)}</dd></div>
        <div><dt>Method</dt><dd>{metrics.method === "sea-connected" ? "Sea-connected" : "Elevation-only"}</dd></div>
        <div><dt>Minimum elevation</dt><dd>{formatMeters(metrics.minGroundElevationMeters)}</dd></div>
        <div><dt>Maximum potential depth</dt><dd>{formatMeters(metrics.maxPotentialDepthMeters)}</dd></div>
        <div><dt>Affected length</dt><dd>{formatLength(metrics.affectedLengthMeters)}</dd></div>
        <div><dt>Total length</dt><dd>{formatLength(road.totalLengthMeters)}</dd></div>
        <div><dt>Affected ratio</dt><dd>{`${Math.round(metrics.affectedRatio * 100)}%`}</dd></div>
        <div><dt>Traffic regulation</dt><dd>Not automatically determined</dd></div>
      </dl>
      <p className="road-note">Road impact potential only. Municipal review may be required.</p>
    </div>
  );
}

function formatMeters(value: number | null, includeSign = false) {
  if (value === null) return "Unknown";
  return `${includeSign && value >= 0 ? "+" : ""}${value.toFixed(1)} m`;
}

function formatLength(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(2)} km` : `${value.toFixed(0)} m`;
}
