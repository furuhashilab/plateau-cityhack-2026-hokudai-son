import type { FacilitySelection } from "../types/facility";

export function SelectedFacilityPanel({ selection }: { selection: FacilitySelection }) {
  const { facility } = selection;
  return (
    <div className="panel selected-panel facility-panel">
      <div className="eyebrow">選んだ施設</div>
      <h2>{facility.name}</h2>
      <dl>
        <div><dt>種類</dt><dd>{categoryLabel(facility.category)}</dd></div>
        <div><dt>施設</dt><dd>{facility.facilityType}</dd></div>
        <div><dt>地面の高さ</dt><dd>{formatMeters(selection.groundElevationMeters)}</dd></div>
        <div><dt>海の水位</dt><dd>{formatMeters(selection.tideLevelMeters, true)}</dd></div>
        <div><dt>見方</dt><dd>{selection.method === "sea-connected" ? "海から水が入る場所" : "海より低い場所"}</dd></div>
        {selection.method === "sea-connected" ? (
          <div><dt>海とつながる</dt><dd>{selection.connectedToSea === null ? "わからない" : selection.connectedToSea ? "はい" : "いいえ"}</dd></div>
        ) : null}
        <div><dt>水の深さ</dt><dd>{formatMeters(selection.depthMeters)}</dd></div>
        <div><dt>状態</dt><dd className={`facility-status ${selection.status?.toLowerCase() ?? "unknown"}`}>{selection.depthMeters === null ? "わからない" : selection.depthMeters > 0 ? "水の影響を受けるかも" : "水の影響を受けなさそう"}</dd></div>
        <div><dt>出どころ</dt><dd><a href={facility.sourceUrl} target="_blank" rel="noreferrer">{facility.source}</a></dd></div>
        <div><dt>データ</dt><dd>{facility.provenance}</dd></div>
        <div>
          <dt>PLATEAU</dt>
          <dd className={`plateau-link-status ${facility.plateauLinkStatus}`}>{plateauLinkLabel(facility.plateauLinkStatus)}</dd>
        </div>
        {facility.plateauBuildingId ? (
          <div>
            <dt>建物ID</dt>
            <dd>{facility.plateauBuildingId}</dd>
          </div>
        ) : null}
        {facility.plateauLinkNote ? (
          <div>
            <dt>メモ</dt>
            <dd>{facility.plateauLinkNote}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function categoryLabel(category: string) {
  return ({ medical: "病院", evacuation: "避難できる場所", transport: "交通", "daily-life": "くらし" } as Record<string, string>)[category] ?? category;
}

function formatMeters(value: number | null, includeSign = false) {
  if (value === null) return "わからない";
  return `${includeSign && value >= 0 ? "+" : ""}${value.toFixed(1)} m`;
}

function plateauLinkLabel(status: string) {
  return ({ verified: "確認済み", candidate: "候補", unlinked: "未確認" } as Record<string, string>)[status] ?? "わからない";
}
