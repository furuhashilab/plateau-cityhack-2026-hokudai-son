import { FACILITY_CATEGORIES } from "../data/facilities";
import { urbanFunctionSummaryWithProposal, type UrbanFunctionSummary } from "../data/urbanFunctions";
import type { FacilityCategory, FacilityCategoryVisibility } from "../types/facility";
import type { CSSProperties } from "react";
import type { FutureFacilityScenario } from "../types/futureFacility";

type Props = {
  visibility: FacilityCategoryVisibility;
  summaries: UrbanFunctionSummary[];
  focusedCategory: FacilityCategory | null;
  placementCategory: FacilityCategory | null;
  futureFacility: FutureFacilityScenario | null;
  onChange: (visibility: FacilityCategoryVisibility) => void;
  onFocusChange: (category: FacilityCategory | null) => void;
  onBeginPlacement: (category: FacilityCategory) => void;
  onCancelPlacement: () => void;
};

export function UrbanFunctionsControl({
  visibility,
  summaries,
  focusedCategory,
  placementCategory,
  futureFacility,
  onChange,
  onFocusChange,
  onBeginPlacement,
  onCancelPlacement
}: Props) {
  return (
    <details className="panel facility-control urban-functions-panel">
      <summary className="section-summary">
        <span>街の施設を見る</span>
        <strong>{summaryHeadline(summaries)}</strong>
      </summary>
      <div className="urban-functions-heading">
        <button
          type="button"
          className="all-functions-button"
          aria-pressed={focusedCategory === null}
          onClick={() => onFocusChange(null)}
        >
          全部見る
        </button>
      </div>
      <div className="urban-function-list">
        {summaries.map((summary) => {
          const active = focusedCategory === summary.category;
          const dimmed = focusedCategory !== null && !active;
          const proposed = urbanFunctionSummaryWithProposal(summary, futureFacility);
          const hasProposal = futureFacility?.category === summary.category;
          const placing = placementCategory === summary.category;
          return (
            <div
              key={summary.category}
              className={`urban-function-card${active ? " active" : ""}${dimmed ? " dimmed" : ""}`}
              style={{ "--function-color": summary.color } as CSSProperties}
            >
              <button
                type="button"
                className="function-focus-button"
                onClick={() => onFocusChange(active ? null : summary.category)}
              >
                <span className="facility-symbol" style={{ background: summary.color }}>{summary.symbol}</span>
                <span className="function-name">{childLabel(summary.category)}</span>
                <span className="function-count total">{summary.totalCount}こ</span>
                <span className={summary.affectedCount > 0 ? "function-count affected" : "function-count clear"}>
                  {impactLabel(summary.affectedCount)}
                </span>
                <span className="function-count">{summary.unaffectedCount}こ だいじょうぶそう</span>
              </button>
              {hasProposal ? (
                <div className="proposal-comparison">
                  <span>今ある施設</span>
                  <strong>{summary.totalCount}このうち {summary.unaffectedCount}こ だいじょうぶそう</strong>
                  <span>未来に置いた施設</span>
                  <strong>{futureFacilityStatus(futureFacility)}</strong>
                  <span>未来案を足すと</span>
                  <strong>{proposed.totalCount}このうち {proposed.unaffectedCount}こ だいじょうぶそう</strong>
                </div>
              ) : null}
              <div className="future-action-row">
                <button
                  type="button"
                  className="future-add-button"
                  aria-pressed={placing}
                  onClick={() => placing ? onCancelPlacement() : onBeginPlacement(summary.category)}
                >
                  {placing ? "やめる" : `未来の${childLabel(summary.category)}を置く`}
                </button>
                {placing ? <span>地図をクリック</span> : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="facility-toggles compact">
        {FACILITY_CATEGORIES.map((category) => (
          <label key={category.id}>
            <input
              type="checkbox"
              checked={visibility[category.id]}
              onChange={(event) => onChange({ ...visibility, [category.id]: event.target.checked })}
            />
            <span className="facility-symbol" style={{ background: category.color }}>{category.symbol}</span>
            <span>{childLabel(category.id)}</span>
          </label>
        ))}
      </div>
      <p className="facility-source-note">実在する施設データをもとに表示しています。</p>
    </details>
  );
}

function childLabel(category: FacilityCategory) {
  return ({
    medical: "病院",
    evacuation: "避難できる場所",
    transport: "交通",
    "daily-life": "くらし"
  } satisfies Record<FacilityCategory, string>)[category];
}

function affectedTotal(summaries: UrbanFunctionSummary[]) {
  return summaries.reduce((sum, summary) => sum + summary.affectedCount, 0);
}

function summaryHeadline(summaries: UrbanFunctionSummary[]) {
  const affected = affectedTotal(summaries);
  return affected > 0 ? `${affected}こ 水の影響を受けるかも` : "水の影響は見つかっていません";
}

function impactLabel(affectedCount: number) {
  return affectedCount > 0 ? `${affectedCount}こ 水の影響を受けるかも` : "水の影響は見つかっていません";
}

function futureFacilityStatus(futureFacility: FutureFacilityScenario | null) {
  if (!futureFacility) return "まだ置いていません";
  if (futureFacility.impact.depthMeters === null) return "まだ調べられません";
  return futureFacility.impact.depthMeters > 0
    ? "1こ 水の影響を受けるかも"
    : "1こ だいじょうぶそう";
}
