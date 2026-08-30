import type { BuildingSelection } from "../types/plateau";

type Props = {
  selection: BuildingSelection | null;
};

const DISPLAY_FIELDS: Array<[keyof BuildingSelection["fields"], string]> = [
  ["identifier", "Identifier"],
  ["name", "Name"],
  ["usage", "Usage"],
  ["measuredHeight", "Measured height"]
];

export function SelectedBuildingPanel({ selection }: Props) {
  return (
    <div className="panel selected-panel">
      <div className="eyebrow">Selected building</div>
      {!selection ? (
        <p className="muted">Click a PLATEAU building to inspect available attributes.</p>
      ) : (
        <>
          <dl>
            {DISPLAY_FIELDS.map(([key, label]) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{selection.fields[key] ?? "Unknown"}</dd>
              </div>
            ))}
            <div>
              <dt>Ground elevation</dt>
              <dd>{formatMeters(selection.inundation.groundElevationMeters)}</dd>
            </div>
            <div>
              <dt>Scenario tide</dt>
              <dd>{formatMeters(selection.inundation.tideLevelMeters, true)}</dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd>{selection.inundation.method === "sea-connected" ? "Sea-connected" : "Elevation-only"}</dd>
            </div>
            {selection.inundation.method === "sea-connected" ? (
              <div>
                <dt>Connected to sea</dt>
                <dd>{selection.inundation.connectedToSea === null ? "Unknown" : selection.inundation.connectedToSea ? "Yes" : "No"}</dd>
              </div>
            ) : null}
            <div>
              <dt>Potential depth</dt>
              <dd>{formatMeters(selection.inundation.depthMeters)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{selection.inundation.status ?? "Unknown"}</dd>
            </div>
          </dl>
          <details>
            <summary>Available properties ({selection.availablePropertyIds.length})</summary>
            <p>{selection.availablePropertyIds.length > 0 ? selection.availablePropertyIds.join(", ") : "Unknown"}</p>
          </details>
        </>
      )}
    </div>
  );
}

function formatMeters(value: number | null, includeSign = false) {
  if (value === null) return "Unknown";
  return `${includeSign && value >= 0 ? "+" : ""}${value.toFixed(1)} m`;
}
