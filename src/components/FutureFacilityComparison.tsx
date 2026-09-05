import { facilityCategoryLabel } from "../data/facilityLabels";
import type { ComparisonScenario } from "../data/locationEvaluation";
import { formatDistance, formatPeople, formatSignedMeters } from "./FutureFacilityResultCard";

export function FutureFacilityComparison({
  scenarios,
  onResetAll
}: {
  scenarios: ComparisonScenario[];
  onResetAll: () => void;
}) {
  if (scenarios.length === 0) return null;

  return (
    <section className="panel comparison-panel" aria-label="Future facility comparison">
      <div className="comparison-topline">場所をくらべる</div>
      <div className="comparison-grid">
        {scenarios.map((scenario) => (
          <article key={scenario.key} className="comparison-item">
            <h2>{scenario.label}</h2>
            <p>{facilityCategoryLabel(scenario.category).futureName}</p>
            <dl>
              <div>
                <dt>改善人数</dt>
                <dd>約{formatPeople(scenario.evaluation.populationImpact.newlyCoveredPopulation)}人</dd>
              </div>
              <div>
                <dt>配置後</dt>
                <dd>約{formatPeople(scenario.evaluation.populationImpact.remainingAffectedPopulation)}人</dd>
              </div>
              <div>
                <dt>水位との差</dt>
                <dd>{formatSignedMeters(scenario.evaluation.waterClearanceMeters)}</dd>
              </div>
              <div>
                <dt>駅・移動</dt>
                <dd>{formatDistance(scenario.evaluation.nearestTransportFacilityMeters)}</dd>
              </div>
              <div>
                <dt>近くの施設</dt>
                <dd>{scenario.evaluation.nearbyExistingFacilityCount800m}か所</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <p className="comparison-question">
        {scenarios.length >= 2
          ? "どちらの場所がいいと思う？ 改善人数だけじゃなく、水位との差や駅の近さも見て、自分の考えを話してみよう。"
          : "次は別の場所にも置いて、数字の違いを見てみよう。"}
      </p>
      <button type="button" className="reset-comparison-button" onClick={onResetAll}>
        候補を全部リセット
      </button>
    </section>
  );
}
