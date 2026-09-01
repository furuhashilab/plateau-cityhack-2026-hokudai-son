import type { RoadSelection } from "../types/road";

export function SelectedRoadPanel({ selection }: { selection: RoadSelection }) {
  const { road, metrics } = selection;
  return (
    <div className="panel selected-panel road-panel">
      <div className="eyebrow">道路</div>
      <h2>{road.name ?? "名前なし"}</h2>
      <dl>
        <div><dt>名前</dt><dd>{road.name ?? "名前なし"}</dd></div>
        <div><dt>道路の種類</dt><dd>{road.roadClass}</dd></div>
        <div><dt>出どころ</dt><dd><a href={road.provenance.sourceUrl} target="_blank" rel="noreferrer">{road.provenance.source}</a></dd></div>
        <div><dt>海の水位</dt><dd>{formatMeters(metrics.tideLevelMeters, true)}</dd></div>
        <div><dt>見方</dt><dd>{metrics.method === "sea-connected" ? "海から水が入る場所" : "海より低い場所"}</dd></div>
        <div><dt>一番低い所</dt><dd>{formatMeters(metrics.minGroundElevationMeters)}</dd></div>
        <div><dt>深くなる所</dt><dd>{formatMeters(metrics.maxPotentialDepthMeters)}</dd></div>
        <div><dt>影響がある長さ</dt><dd>{formatLength(metrics.affectedLengthMeters)}</dd></div>
        <div><dt>全体の長さ</dt><dd>{formatLength(road.totalLengthMeters)}</dd></div>
        <div><dt>割合</dt><dd>{`${Math.round(metrics.affectedRatio * 100)}%`}</dd></div>
        <div><dt>交通規制</dt><dd>自動では決めていません</dd></div>
      </dl>
      <p className="road-note">道路は見える情報です。施設まで行けるかはまだ判定していません。</p>
    </div>
  );
}

function formatMeters(value: number | null, includeSign = false) {
  if (value === null) return "わからない";
  return `${includeSign && value >= 0 ? "+" : ""}${value.toFixed(1)} m`;
}

function formatLength(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(2)} km` : `${value.toFixed(0)} m`;
}
