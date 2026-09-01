import { FACILITY_CATEGORIES } from "../data/facilities";
import type { UrbanFunctionSummary } from "../data/urbanFunctions";
import type { FacilityCategory, FacilityCategoryVisibility } from "../types/facility";
import type { CSSProperties } from "react";

type Props = {
  visibility: FacilityCategoryVisibility;
  summaries: UrbanFunctionSummary[];
  focusedCategory: FacilityCategory | null;
  onChange: (visibility: FacilityCategoryVisibility) => void;
  onFocusChange: (category: FacilityCategory | null) => void;
};

export function UrbanFunctionsControl({
  visibility,
  summaries,
  focusedCategory,
  onChange,
  onFocusChange
}: Props) {
  return (
    <div className="panel facility-control urban-functions-panel">
      <div className="urban-functions-heading">
        <div>
          <div className="layer-kind">Urban functions</div>
          <strong>Current availability</strong>
        </div>
        <button
          type="button"
          className="all-functions-button"
          aria-pressed={focusedCategory === null}
          onClick={() => onFocusChange(null)}
        >
          All
        </button>
      </div>
      <div className="urban-function-list">
        {summaries.map((summary) => {
          const active = focusedCategory === summary.category;
          const dimmed = focusedCategory !== null && !active;
          return (
            <button
              type="button"
              key={summary.category}
              className={`urban-function-card${active ? " active" : ""}${dimmed ? " dimmed" : ""}`}
              style={{ "--function-color": summary.color } as CSSProperties}
              onClick={() => onFocusChange(active ? null : summary.category)}
            >
              <span className="facility-symbol" style={{ background: summary.color }}>{summary.symbol}</span>
              <span className="function-name">{summary.label}</span>
              <span className="function-count total">{summary.totalCount} total</span>
              <span className={summary.affectedCount > 0 ? "function-count affected" : "function-count clear"}>
                {summary.affectedCount} potentially affected
              </span>
              <span className="function-count">{summary.unaffectedCount} currently unaffected</span>
            </button>
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
            <span>{category.label}</span>
          </label>
        ))}
      </div>
      <p className="facility-source-note">Municipal open data + official lists + OpenStreetMap</p>
    </div>
  );
}
