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
    <div className="panel water-panel">
      <div className="water-heading">
        <span>海の水を上げてみよう</span>
        <strong>+{props.tideLevelMeters.toFixed(1)} m</strong>
      </div>
      <label className="elevation-toggle">
        <span>
          <strong>水が来るか見る</strong>
          <small>ためしの水位です。予報ではありません。</small>
        </span>
        <input
          type="checkbox"
          checked={props.enabled}
          disabled={props.loading || props.error !== null}
          onChange={(event) => props.onEnabledChange(event.target.checked)}
        />
      </label>
      <label className="tide-control">
        <span>今の水位</span>
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
      {props.error ? <p className="elevation-error">Inundation unavailable: {props.error}</p> : null}
      <details className="soft-details">
        <summary>詳しい水の見方</summary>
        <fieldset className="method-control">
          <legend>水の広がり方</legend>
          <label>
            <input
              type="radio"
              name="inundation-method"
              checked={props.method === "sea-connected"}
              onChange={() => props.onMethodChange("sea-connected")}
            />
            <span><strong>海から水が入る場所</strong><small>海とつながる低い場所だけを見ます。</small></span>
          </label>
          <label>
            <input
              type="radio"
              name="inundation-method"
              checked={props.method === "elevation-only"}
              onChange={() => props.onMethodChange("elevation-only")}
            />
            <span><strong>海より低い場所</strong><small>水位より低い地面をぜんぶ見ます。</small></span>
          </label>
        </fieldset>
        {props.enabled ? (
          <div className="elevation-legend" aria-label="水の深さの凡例">
            {INUNDATION_BANDS.map((band) => (
              <div key={band.label}>
                <span className="legend-swatch" style={{ backgroundColor: band.color }} />
                <span>{band.label}</span>
              </div>
            ))}
          </div>
        ) : null}
        <p>
          地面の高さはGSI DEM5Aを使っています。水の深さは「水位 - 地面の高さ」で計算します。
          これは公式の高潮予報ではなく、街を考えるためのシナリオです。
        </p>
      </details>
    </div>
  );
}
