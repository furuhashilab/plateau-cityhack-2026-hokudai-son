import type { FacilitySelection } from "../types/facility";

export function SelectedFacilityPanel({ selection }: { selection: FacilitySelection }) {
  const { facility } = selection;
  return (
    <div className="panel selected-panel facility-panel">
      <div className="eyebrow">Selected facility</div>
      <h2>{facility.name}</h2>
      <dl>
        <div><dt>Category</dt><dd>{categoryLabel(facility.category)}</dd></div>
        <div><dt>Type</dt><dd>{facility.facilityType}</dd></div>
        <div><dt>Ground elevation</dt><dd>{formatMeters(selection.groundElevationMeters)}</dd></div>
        <div><dt>Scenario tide</dt><dd>{formatMeters(selection.tideLevelMeters, true)}</dd></div>
        <div><dt>Method</dt><dd>{selection.method === "sea-connected" ? "Sea-connected" : "Elevation-only"}</dd></div>
        {selection.method === "sea-connected" ? (
          <div><dt>Connected to sea</dt><dd>{selection.connectedToSea === null ? "Unknown" : selection.connectedToSea ? "Yes" : "No"}</dd></div>
        ) : null}
        <div><dt>Potential depth</dt><dd>{formatMeters(selection.depthMeters)}</dd></div>
        <div><dt>Status</dt><dd className={`facility-status ${selection.status?.toLowerCase() ?? "unknown"}`}>{selection.status ?? "Unknown"}</dd></div>
        <div><dt>Source</dt><dd><a href={facility.sourceUrl} target="_blank" rel="noreferrer">{facility.source}</a></dd></div>
        <div><dt>Provenance</dt><dd>{facility.provenance}</dd></div>
        <div><dt>PLATEAU building</dt><dd>{facility.plateauBuildingId ? `Linked: ${facility.plateauBuildingId}` : "Unlinked"}</dd></div>
      </dl>
    </div>
  );
}

function categoryLabel(category: string) {
  return ({ medical: "Medical", evacuation: "Evacuation", transport: "Transport", "daily-life": "Daily Life" } as Record<string, string>)[category] ?? category;
}

function formatMeters(value: number | null, includeSign = false) {
  if (value === null) return "Unknown";
  return `${includeSign && value >= 0 ? "+" : ""}${value.toFixed(1)} m`;
}
