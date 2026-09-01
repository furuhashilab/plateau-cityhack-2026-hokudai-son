import { MAIZURU_GROUND_ELEVATION } from "../data/maizuruGroundElevation";

type Props = {
  enabled: boolean;
  loading: boolean;
  error: string | null;
  onChange: (enabled: boolean) => void;
};

export function GroundElevationControl({ enabled, loading, error, onChange }: Props) {
  return (
    <div className="advanced-block elevation-panel">
      <div className="layer-kind">地形</div>
      <label className="elevation-toggle">
        <span>
          <strong>地面の高さを見る</strong>
          <small>{loading ? "高さデータを読み込み中" : "低い場所と高い場所を色で見る"}</small>
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
      {error ? <p className="elevation-error">地面の高さを表示できません: {error}</p> : null}
      <details className="soft-details">
        <summary>データの出どころ</summary>
        <p>
          色とデータ: {MAIZURU_GROUND_ELEVATION.label}, {MAIZURU_GROUND_ELEVATION.nominalResolutionMeters} m,
          {` ${MAIZURU_GROUND_ELEVATION.source}. `}
          Cesium上に軽い画像として表示しています。
        </p>
      </details>
    </div>
  );
}
