import { MAIZURU_GROUND_ELEVATION } from "../data/maizuruGroundElevation";

type Props = {
  enabled: boolean;
  loading: boolean;
  error: string | null;
  onChange: (enabled: boolean) => void;
};

export function GroundElevationControl({ enabled, loading, error, onChange }: Props) {
  return (
    <div className="panel elevation-panel">
      <div className="layer-kind">Base / terrain view</div>
      <label className="elevation-toggle">
        <span>
          <strong>Ground Elevation</strong>
          <small>{loading ? "Loading official elevation data…" : "Show low and high ground"}</small>
        </span>
        <input
          type="checkbox"
          checked={enabled}
          disabled={loading || error !== null}
          onChange={(event) => onChange(event.target.checked)}
        />
      </label>
      {enabled ? (
        <div className="elevation-legend" aria-label="Ground elevation legend">
          {MAIZURU_GROUND_ELEVATION.bands.map((band) => (
            <div key={band.label}>
              <span className="legend-swatch" style={{ backgroundColor: band.color }} />
              <span>{band.label}</span>
            </div>
          ))}
          <p>Elevation above mean sea level. Blue areas are lower.</p>
        </div>
      ) : null}
      {error ? <p className="elevation-error">Elevation unavailable: {error}</p> : null}
      <details>
        <summary>Data provenance</summary>
        <p>
          Color/data: {MAIZURU_GROUND_ELEVATION.label}, {MAIZURU_GROUND_ELEVATION.nominalResolutionMeters} m,
          {` ${MAIZURU_GROUND_ELEVATION.source}. `}
          Displayed as a lightweight raster on the Cesium ellipsoid surface. The decoded orthometric elevations remain available for future flood calculations.
        </p>
      </details>
    </div>
  );
}
