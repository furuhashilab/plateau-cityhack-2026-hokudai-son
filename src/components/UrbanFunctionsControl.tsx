import { FACILITY_CATEGORIES, WEST_MAIZURU_FACILITIES } from "../data/facilities";
import type { FacilityCategoryVisibility } from "../types/facility";

type Props = {
  visibility: FacilityCategoryVisibility;
  onChange: (visibility: FacilityCategoryVisibility) => void;
};

export function UrbanFunctionsControl({ visibility, onChange }: Props) {
  return (
    <div className="panel facility-control">
      <div className="layer-kind">Urban functions</div>
      <div className="facility-toggles">
        {FACILITY_CATEGORIES.map((category) => {
          const count = WEST_MAIZURU_FACILITIES.filter((facility) => facility.category === category.id).length;
          return (
            <label key={category.id}>
              <input
                type="checkbox"
                checked={visibility[category.id]}
                onChange={(event) => onChange({ ...visibility, [category.id]: event.target.checked })}
              />
              <span className="facility-symbol" style={{ background: category.color }}>{category.symbol}</span>
              <span>{category.label} <small>({count})</small></span>
            </label>
          );
        })}
      </div>
      <p className="facility-source-note">Municipal open data + official lists + OpenStreetMap</p>
    </div>
  );
}
