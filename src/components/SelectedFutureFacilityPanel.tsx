import type { FutureFacilityScenario } from "../types/futureFacility";

export function SelectedFutureFacilityPanel({
  facility,
  onRemove
}: {
  facility: FutureFacilityScenario;
  onRemove: () => void;
}) {
  const affected = (facility.impact.depthMeters ?? 0) > 0;
  const statusClass = facility.impact.depthMeters === null ? "unknown" : affected ? "affected" : "safe";

  return (
    <div className="panel selected-panel future-facility-panel">
      <div className="eyebrow">未来の施設</div>
      <h2>未来の{categoryLabel(facility.category)}</h2>
      <p className={`future-result ${statusClass}`}>
        {affected ? "この場所は水の影響を受けるかも" : facility.impact.depthMeters === null ? "この場所はまだ調べられません" : "この場所は水の影響を受けなさそう"}
      </p>
      <dl>
        <div><dt>地面の高さ</dt><dd>{formatMeters(facility.impact.groundElevationMeters)}</dd></div>
        <div><dt>海の水位</dt><dd>{formatMeters(facility.impact.tideLevelMeters, true)}</dd></div>
        <div><dt>水の深さ</dt><dd>{formatMeters(facility.impact.depthMeters)}</dd></div>
        <div><dt>見方</dt><dd>{facility.impact.method === "sea-connected" ? "海から水が入る場所" : "海より低い場所"}</dd></div>
        {facility.impact.method === "sea-connected" ? (
          <div><dt>海とつながる</dt><dd>{facility.impact.connectedToSea === null ? "わからない" : facility.impact.connectedToSea ? "はい" : "いいえ"}</dd></div>
        ) : null}
      </dl>
      <details className="soft-details">
        <summary>詳しく見る</summary>
        <dl>
          <div><dt>種類</dt><dd>{facility.facilityType}</dd></div>
          <div><dt>経度</dt><dd>{facility.longitude.toFixed(6)}</dd></div>
          <div><dt>緯度</dt><dd>{facility.latitude.toFixed(6)}</dd></div>
          <div><dt>データ</dt><dd>未来に置いた施設</dd></div>
        </dl>
      </details>
      <button type="button" className="remove-future-button" onClick={onRemove}>消す</button>
    </div>
  );
}

function categoryLabel(category: string) {
  return ({ medical: "病院", evacuation: "避難できる場所", transport: "交通", "daily-life": "くらし" } as Record<string, string>)[category] ?? category;
}

function formatMeters(value: number | null, includeSign = false) {
  if (value === null) return "まだ調べられません";
  return `${includeSign && value >= 0 ? "+" : ""}${value.toFixed(1)} m`;
}
