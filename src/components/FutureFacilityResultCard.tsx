import { facilityCategoryLabel } from "../data/facilityLabels";
import type { FutureFacilityScenario } from "../types/futureFacility";

export function FutureFacilityResultCard({ facility }: { facility: FutureFacilityScenario }) {
  const label = facilityCategoryLabel(facility.category);
  const population = facility.evaluation.populationImpact;
  return (
    <section className="future-result-card" aria-label="Future facility location result">
      <div className="result-card-title">この場所の特徴</div>
      <h3>新しい{label.futureName}</h3>
      <dl>
        <div>
          <dt>影響人口</dt>
          <dd>約{formatPeople(population.affectedPopulation)}人</dd>
        </div>
        <div>
          <dt>新しくカバー</dt>
          <dd>約{formatPeople(population.newlyCoveredPopulation)}人</dd>
        </div>
        <div>
          <dt>配置後</dt>
          <dd>約{formatPeople(population.remainingAffectedPopulation)}人</dd>
        </div>
        <div>
          <dt>設定水位との差</dt>
          <dd>{formatSignedMeters(facility.evaluation.waterClearanceMeters)}</dd>
        </div>
        <div>
          <dt>駅・移動まで</dt>
          <dd>{formatDistance(facility.evaluation.nearestTransportFacilityMeters)}</dd>
        </div>
        <div>
          <dt>800m以内の施設</dt>
          <dd>{facility.evaluation.nearbyExistingFacilityCount800m}か所</dd>
        </div>
      </dl>
      <p>
        改善人数、水位との差、駅までの近さを見て、どの場所がよいか考えよう。
      </p>
    </section>
  );
}

export function formatSignedMeters(value: number | null) {
  if (value === null) return "まだ調べられません";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)} m`;
}

export function formatDistance(value: number | null) {
  if (value === null) return "まだ調べられません";
  if (value >= 1000) return `約${(value / 1000).toFixed(1)} km`;
  return `約${Math.round(value / 10) * 10} m`;
}

export function formatPeople(value: number) {
  return value.toLocaleString("ja-JP");
}
