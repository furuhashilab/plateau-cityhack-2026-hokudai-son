import type { PlateauTilesetDataset } from "../types/plateau";

type Props = {
  dataset: PlateauTilesetDataset;
};

export function DataBadge({ dataset }: Props) {
  return (
    <div className="panel data-badge">
      <div className="eyebrow">Maizuru City</div>
      <h1>PLATEAU 2025</h1>
      <dl>
        <div>
          <dt>Data</dt>
          <dd>{dataset.label}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{dataset.source}</dd>
        </div>
        <div>
          <dt>Format</dt>
          <dd>{dataset.format}</dd>
        </div>
        <div>
          <dt>AOI</dt>
          <dd>{dataset.aoiLabel}</dd>
        </div>
        {dataset.heightOffsetMeters !== undefined ? (
          <div>
            <dt>Height offset</dt>
            <dd>
              {dataset.heightOffsetMeters}m
              {dataset.heightOffsetReason ? ` (${dataset.heightOffsetReason})` : null}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
