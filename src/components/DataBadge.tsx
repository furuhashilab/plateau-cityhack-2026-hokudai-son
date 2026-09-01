import type { PlateauTilesetDataset } from "../types/plateau";

type Props = {
  dataset: PlateauTilesetDataset;
};

export function DataBadge({ dataset }: Props) {
  return (
    <details className="plateau-badge">
      <summary>
        <span>PLATEAU 2025</span>
        <strong>舞鶴の3D都市</strong>
      </summary>
      <dl>
        <div>
          <dt>データ</dt>
          <dd>{dataset.label}</dd>
        </div>
        <div>
          <dt>出どころ</dt>
          <dd>{dataset.source}</dd>
        </div>
        <div>
          <dt>形式</dt>
          <dd>{dataset.format}</dd>
        </div>
        <div>
          <dt>範囲</dt>
          <dd>{dataset.aoiLabel}</dd>
        </div>
        {dataset.heightOffsetMeters !== undefined ? (
          <div>
            <dt>高さ補正</dt>
            <dd>
              {dataset.heightOffsetMeters}m
              {dataset.heightOffsetReason ? ` (${dataset.heightOffsetReason})` : null}
            </dd>
          </div>
        ) : null}
      </dl>
    </details>
  );
}
