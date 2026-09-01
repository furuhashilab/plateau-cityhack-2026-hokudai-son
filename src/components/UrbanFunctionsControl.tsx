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
  const activeSummary = summaries.find(s => s.category === focusedCategory) ?? null;
  const placing = activeSummary ? placementCategory === activeSummary.category : false;
  const hasProposal = activeSummary ? futureFacility?.category === activeSummary.category : false;
  const proposed = activeSummary ? urbanFunctionSummaryWithProposal(activeSummary, futureFacility) : null;
  const futureActionLabel = activeSummary
    ? `未来の${childLabel(activeSummary.category)}を${futureFacility ? "置き直す" : "置く"}`
    : "";

  return (
    <details className="panel urban-functions-panel">
      <summary className="section-summary">
        <span>街の施設を見る</span>
        <strong>{summaryHeadline(summaries)}</strong>
      </summary>

      {/* 2×2 compact chip grid — always visible when panel open */}
      <div className="category-chips">
        {summaries.map((summary) => {
          const active = focusedCategory === summary.category;
          const dimmed = focusedCategory !== null && !active;
          return (
            <button
              key={summary.category}
              type="button"
              className={`category-chip${active ? " active" : ""}${dimmed ? " dimmed" : ""}`}
              style={{ "--chip-color": summary.color } as CSSProperties}
              onClick={() => onFocusChange(active ? null : summary.category)}
            >
              <span className="chip-symbol" style={{ background: summary.color }}>{summary.symbol}</span>
              <span className="chip-name">{childLabel(summary.category)}</span>
              <span className="chip-total">{summary.totalCount}こ</span>
              <span className={summary.affectedCount > 0 ? "chip-impact affected" : "chip-impact clear"}>
                {summary.affectedCount > 0 ? `${summary.affectedCount}こ 影響あり` : "安全"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail drawer — only when a category is focused */}
      {activeSummary ? (
        <div className="active-category-detail">
          {/* Always show current state */}
          <div className="current-state-row">
            <span>今ある施設</span>
            <strong>
              {activeSummary.totalCount}こ /{" "}
              {activeSummary.unaffectedCount}こ だいじょうぶそう
            </strong>
          </div>

          {/* Future comparison — only when future facility is placed for this category */}
          {hasProposal && proposed ? (
            <div className="proposal-comparison">
              <span>未来に置いた施設</span>
              <strong>{futureFacilityStatus(futureFacility)}</strong>
              <span>未来案を足すと</span>
              <strong>
                {proposed.totalCount}このうち {proposed.unaffectedCount}こ だいじょうぶそう
              </strong>
            </div>
          ) : null}

          <div className="future-action-row">
            <button
              type="button"
              className="future-add-button"
              aria-pressed={placing}
              onClick={() => placing ? onCancelPlacement() : onBeginPlacement(activeSummary.category)}
            >
              {placing ? "やめる" : futureActionLabel}
            </button>
            {placing ? <span>地図をクリック</span> : null}
          </div>
        </div>
      ) : null}

      {/* Visibility toggles — collapsed by default to keep panel compact */}
      <details className="visibility-details">
        <summary className="visibility-summary">表示する施設の種類</summary>
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
      </details>
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
  return summaries.reduce((sum, s) => sum + s.affectedCount, 0);
}

function summaryHeadline(summaries: UrbanFunctionSummary[]) {
  const affected = affectedTotal(summaries);
  return affected > 0 ? `${affected}こ 水の影響を受けるかも` : "水の影響は見つかっていません";
}

function futureFacilityStatus(futureFacility: FutureFacilityScenario | null) {
  if (!futureFacility) return "まだ置いていません";
  if (futureFacility.impact.depthMeters === null) return "まだ調べられません";
  return futureFacility.impact.depthMeters > 0
    ? "1こ 水の影響を受けるかも"
    : "1こ だいじょうぶそう";
}
