import type { ViewerStatus } from "../types/plateau";

type Props = {
  status: ViewerStatus;
};

export function StatusOverlay({ status }: Props) {
  return (
    <div className="panel status-panel">
      <div className="status-line">
        <span className={`status-dot ${status.phase}`} />
        <strong>{status.message}</strong>
      </div>
      <dl>
        <div>
          <dt>Initial load</dt>
          <dd>{formatMs(status.initialLoadMs)}</dd>
        </div>
        <div>
          <dt>Interactive</dt>
          <dd>{formatMs(status.interactiveMs)}</dd>
        </div>
        <div>
          <dt>Tiles</dt>
          <dd>{status.loadedTiles} loaded / {status.pendingTiles} pending</dd>
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
  return value == null ? "Measuring" : `${(value / 1000).toFixed(2)} s`;
}
