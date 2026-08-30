import { INUNDATION_BANDS, TIDE_LEVEL, type InundationMethod } from "../data/inundation";

type Props = {
  enabled: boolean;
  tideLevelMeters: number;
  loading: boolean;
  error: string | null;
  method: InundationMethod;
  onEnabledChange: (enabled: boolean) => void;
  onTideLevelChange: (meters: number) => void;
  onMethodChange: (method: InundationMethod) => void;
};

export function InundationControl(props: Props) {
  return (
    <div className="panel inundation-panel">
      <div className="layer-kind">Hazard overlay</div>
      <div className="scenario-label">Scenario · User-defined stress test</div>
      <label className="elevation-toggle">
        <span>
          <strong>Simplified Inundation</strong>
          <small>Elevation-based potential, not a forecast</small>
        </span>
        <input
          type="checkbox"
          checked={props.enabled}
          disabled={props.loading || props.error !== null}
          onChange={(event) => props.onEnabledChange(event.target.checked)}
        />
      </label>
      <fieldset className="method-control">
        <legend>Method</legend>
        <label>
          <input
            type="radio"
            name="inundation-method"
            checked={props.method === "elevation-only"}
            onChange={() => props.onMethodChange("elevation-only")}
          />
          <span><strong>Elevation-only</strong><small>All ground below the tide level.</small></span>
        </label>
        <label>
          <input
            type="radio"
            name="inundation-method"
            checked={props.method === "sea-connected"}
            onChange={() => props.onMethodChange("sea-connected")}
          />
          <span><strong>Sea-connected</strong><small>Only low ground continuously connected to the sea.</small></span>
        </label>
      </fieldset>
      <label className="tide-control">
        <span>Tide Level</span>
        <strong>Current scenario: +{props.tideLevelMeters.toFixed(1)} m</strong>
        <input
          type="range"
          min={TIDE_LEVEL.minMeters}
          max={TIDE_LEVEL.maxMeters}
          step={TIDE_LEVEL.stepMeters}
          value={props.tideLevelMeters}
          onChange={(event) => props.onTideLevelChange(Number(event.target.value))}
        />
        <span className="range-labels"><span>0.0 m</span><span>5.0 m</span></span>
      </label>
      {props.enabled ? (
        <div className="elevation-legend" aria-label="Potential inundation depth legend">
          {INUNDATION_BANDS.map((band) => (
            <div key={band.label}>
              <span className="legend-swatch" style={{ backgroundColor: band.color }} />
              <span>{band.label}</span>
            </div>
          ))}
        </div>
      ) : null}
      {props.error ? <p className="elevation-error">Inundation unavailable: {props.error}</p> : null}
      <details>
        <summary>Method & provenance</summary>
        <p>
          Ground elevation: GSI DEM5A. Elevation-only highlights all lower ground. Sea-connected
          uses AOI-boundary-connected DEM NoData as a sea mask and 4-neighbor terrain connectivity.
          Depth = tide level − ground elevation for included cells. This is not a hydraulic simulation
          or official storm-surge map; drainage, gates, pumps, waves, velocity, levees, and time are omitted.
        </p>
      </details>
    </div>
  );
}
