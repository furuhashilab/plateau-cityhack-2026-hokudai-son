import type { ViewerStatus } from "../types/plateau";

type Props = {
  status: ViewerStatus;
};

export function StatusOverlay({ status }: Props) {
  return (
    <div className="advanced-block status-panel">
      <div className="status-line">
        <span className={`status-dot ${status.phase}`} />
        <strong>{status.message === "Ready" ? "準備できました" : status.message}</strong>
      </div>
      <dl>
        <div>
          <dt>読み込み</dt>
          <dd>{formatMs(status.initialLoadMs)}</dd>
        </div>
        <div>
          <dt>操作可能</dt>
          <dd>{formatMs(status.interactiveMs)}</dd>
        </div>
        <div>
          <dt>建物</dt>
          <dd>{status.loadedTiles} 読み込み / {status.pendingTiles} 待ち</dd>
        </div>
        <div>
          <dt>FPS</dt>
          <dd>{status.fps ?? "Unknown"}</dd>
        </div>
        <div>
          <dt>JS heap</dt>
          <dd>{status.memoryMb == null ? "Unknown" : `${status.memoryMb} MB`}</dd>
        </div>
      </dl>
    </div>
  );
}

function formatMs(value: number | null) {
  return value == null ? "計測中" : `${(value / 1000).toFixed(2)} s`;
}
