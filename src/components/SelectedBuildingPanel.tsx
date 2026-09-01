import type { BuildingSelection } from "../types/plateau";

type Props = {
  selection: BuildingSelection | null;
};

const DISPLAY_FIELDS: Array<[keyof BuildingSelection["fields"], string]> = [
  ["identifier", "建物ID"],
  ["name", "名前"],
  ["usage", "使い方"],
  ["measuredHeight", "高さ"]
];

export function SelectedBuildingPanel({ selection }: Props) {
  return (
    <div className="panel selected-panel">
      <div className="eyebrow">選んだ建物</div>
      {!selection ? (
        <p className="muted">建物をクリックすると情報を見られます。</p>
      ) : (
        <>
          <dl>
            {DISPLAY_FIELDS.map(([key, label]) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{selection.fields[key] ?? "わからない"}</dd>
              </div>
            ))}
            <div>
              <dt>地面の高さ</dt>
              <dd>{formatMeters(selection.inundation.groundElevationMeters)}</dd>
            </div>
            <div>
              <dt>海の水位</dt>
              <dd>{formatMeters(selection.inundation.tideLevelMeters, true)}</dd>
            </div>
            <div>
              <dt>見方</dt>
              <dd>{selection.inundation.method === "sea-connected" ? "海から水が入る場所" : "海より低い場所"}</dd>
            </div>
            {selection.inundation.method === "sea-connected" ? (
              <div>
                <dt>海とつながる</dt>
                <dd>{selection.inundation.connectedToSea === null ? "わからない" : selection.inundation.connectedToSea ? "はい" : "いいえ"}</dd>
              </div>
            ) : null}
            <div>
              <dt>水の深さ</dt>
              <dd>{formatMeters(selection.inundation.depthMeters)}</dd>
            </div>
            <div>
              <dt>状態</dt>
              <dd>{selection.inundation.depthMeters === null ? "わからない" : selection.inundation.depthMeters > 0 ? "水の影響を受けるかも" : "水の影響を受けなさそう"}</dd>
            </div>
          </dl>
          <details>
            <summary>詳しい属性 ({selection.availablePropertyIds.length})</summary>
            <p>{selection.availablePropertyIds.length > 0 ? selection.availablePropertyIds.join(", ") : "わからない"}</p>
          </details>
        </>
      )}
    </div>
  );
}

function formatMeters(value: number | null, includeSign = false) {
  if (value === null) return "わからない";
  return `${includeSign && value >= 0 ? "+" : ""}${value.toFixed(1)} m`;
}
