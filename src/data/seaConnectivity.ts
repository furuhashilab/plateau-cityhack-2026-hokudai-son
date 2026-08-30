import type { GroundElevationTile, LoadedGroundElevation } from "./groundElevation";

export type SeaConnectivity = {
  seedMethod: "boundary-connected DEM NoData";
  neighborMode: 4;
  seaWaterCellCount: number;
  shorelineSeedCellCount: number;
  thresholdsByTile: Map<string, Float32Array>;
  sampleConnectionThresholdMeters: (longitudeDegrees: number, latitudeDegrees: number) => number | null;
  isConnectedAt: (longitudeDegrees: number, latitudeDegrees: number, tideLevelMeters: number) => boolean | null;
};

export function buildSeaConnectivity(data: LoadedGroundElevation): SeaConnectivity {
  const tileWidth = data.tiles[0]?.width ?? 256;
  const tileHeight = data.tiles[0]?.height ?? 256;
  const spanX = data.dataset.tileRange.maxX - data.dataset.tileRange.minX + 1;
  const spanY = data.dataset.tileRange.maxY - data.dataset.tileRange.minY + 1;
  const width = spanX * tileWidth;
  const height = spanY * tileHeight;
  const size = width * height;
  const elevations = new Float32Array(size);
  elevations.fill(Number.NaN);

  for (const tile of data.tiles) {
    const tileColumn = tile.x - data.dataset.tileRange.minX;
    const tileRow = tile.y - data.dataset.tileRange.minY;
    for (let y = 0; y < tile.height; y += 1) {
      const sourceStart = y * tile.width;
      const targetStart = (tileRow * tileHeight + y) * width + tileColumn * tileWidth;
      elevations.set(tile.valuesMeters.subarray(sourceStart, sourceStart + tile.width), targetStart);
    }
  }

  const seaWater = findBoundaryConnectedNoData(elevations, width, height);
  const { thresholds, shorelineSeedCellCount } = computeConnectionThresholds(elevations, seaWater, width, height);
  const thresholdsByTile = new Map<string, Float32Array>();
  for (const tile of data.tiles) {
    const tileThresholds = new Float32Array(tile.width * tile.height);
    const tileColumn = tile.x - data.dataset.tileRange.minX;
    const tileRow = tile.y - data.dataset.tileRange.minY;
    for (let y = 0; y < tile.height; y += 1) {
      const sourceStart = (tileRow * tileHeight + y) * width + tileColumn * tileWidth;
      tileThresholds.set(thresholds.subarray(sourceStart, sourceStart + tile.width), y * tile.width);
    }
    thresholdsByTile.set(tileKey(tile), tileThresholds);
  }

  const sampleConnectionThresholdMeters = (longitudeDegrees: number, latitudeDegrees: number) => {
    const sample = locateSample(data, longitudeDegrees, latitudeDegrees);
    if (!sample) return null;
    const tileThresholds = thresholdsByTile.get(tileKey(sample.tile));
    if (!tileThresholds) return null;
    const threshold = tileThresholds[sample.pixelY * sample.tile.width + sample.pixelX];
    return Number.isFinite(threshold) ? threshold : null;
  };

  let seaWaterCellCount = 0;
  for (const value of seaWater) seaWaterCellCount += value;
  return {
    seedMethod: "boundary-connected DEM NoData",
    neighborMode: 4,
    seaWaterCellCount,
    shorelineSeedCellCount,
    thresholdsByTile,
    sampleConnectionThresholdMeters,
    isConnectedAt(longitudeDegrees, latitudeDegrees, tideLevelMeters) {
      const threshold = sampleConnectionThresholdMeters(longitudeDegrees, latitudeDegrees);
      return threshold === null ? null : threshold <= tideLevelMeters;
    }
  };
}

export function findBoundaryConnectedNoData(values: Float32Array, width: number, height: number) {
  const mask = new Uint8Array(values.length);
  const queue = new Int32Array(values.length);
  let head = 0;
  let tail = 0;
  const enqueue = (index: number) => {
    if (mask[index] || Number.isFinite(values[index])) return;
    mask[index] = 1;
    queue[tail++] = index;
  };
  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }
  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    if (x > 0) enqueue(index - 1);
    if (x + 1 < width) enqueue(index + 1);
    if (index >= width) enqueue(index - width);
    if (index + width < values.length) enqueue(index + width);
  }
  return mask;
}

export function computeConnectionThresholds(
  elevations: Float32Array,
  seaWater: Uint8Array,
  width: number,
  height: number
) {
  const thresholds = new Float32Array(elevations.length);
  thresholds.fill(Number.POSITIVE_INFINITY);
  const heap = new IndexedMinHeap(thresholds);
  let shorelineSeedCellCount = 0;

  const seedLand = (index: number) => {
    const elevation = elevations[index];
    if (!Number.isFinite(elevation) || elevation >= thresholds[index]) return;
    thresholds[index] = elevation;
    heap.insertOrDecrease(index);
    shorelineSeedCellCount += 1;
  };
  for (let index = 0; index < seaWater.length; index += 1) {
    if (!seaWater[index]) continue;
    const x = index % width;
    if (x > 0) seedLand(index - 1);
    if (x + 1 < width) seedLand(index + 1);
    if (index >= width) seedLand(index - width);
    if (index + width < elevations.length) seedLand(index + width);
  }

  const relax = (fromCost: number, index: number) => {
    const elevation = elevations[index];
    if (!Number.isFinite(elevation)) return;
    const candidate = Math.max(fromCost, elevation);
    if (candidate >= thresholds[index]) return;
    thresholds[index] = candidate;
    heap.insertOrDecrease(index);
  };
  while (heap.size > 0) {
    const index = heap.pop();
    const cost = thresholds[index];
    const x = index % width;
    if (x > 0) relax(cost, index - 1);
    if (x + 1 < width) relax(cost, index + 1);
    if (index >= width) relax(cost, index - width);
    if (index + width < elevations.length) relax(cost, index + width);
  }
  return { thresholds, shorelineSeedCellCount };
}

class IndexedMinHeap {
  private readonly indices: Int32Array;
  private readonly positions: Int32Array;
  size = 0;

  constructor(private readonly costs: Float32Array) {
    this.indices = new Int32Array(costs.length);
    this.positions = new Int32Array(costs.length);
    this.positions.fill(-1);
  }

  insertOrDecrease(index: number) {
    const existing = this.positions[index];
    if (existing === -2) return;
    if (existing >= 0) {
      this.bubbleUp(existing);
      return;
    }
    const position = this.size++;
    this.indices[position] = index;
    this.positions[index] = position;
    this.bubbleUp(position);
  }

  pop() {
    const result = this.indices[0];
    this.size -= 1;
    this.positions[result] = -2;
    if (this.size > 0) {
      const replacement = this.indices[this.size];
      this.indices[0] = replacement;
      this.positions[replacement] = 0;
      this.bubbleDown(0);
    }
    return result;
  }

  private bubbleUp(start: number) {
    let position = start;
    while (position > 0) {
      const parent = (position - 1) >> 1;
      if (this.costs[this.indices[parent]] <= this.costs[this.indices[position]]) break;
      this.swap(parent, position);
      position = parent;
    }
  }

  private bubbleDown(start: number) {
    let position = start;
    while (true) {
      const left = position * 2 + 1;
      if (left >= this.size) return;
      const right = left + 1;
      const smallest = right < this.size && this.costs[this.indices[right]] < this.costs[this.indices[left]]
        ? right
        : left;
      if (this.costs[this.indices[position]] <= this.costs[this.indices[smallest]]) return;
      this.swap(position, smallest);
      position = smallest;
    }
  }

  private swap(a: number, b: number) {
    const first = this.indices[a];
    const second = this.indices[b];
    this.indices[a] = second;
    this.indices[b] = first;
    this.positions[first] = b;
    this.positions[second] = a;
  }
}

function locateSample(data: LoadedGroundElevation, longitudeDegrees: number, latitudeDegrees: number) {
  const scale = 2 ** data.dataset.zoom;
  const worldX = ((longitudeDegrees + 180) / 360) * scale;
  const latitudeRadians = latitudeDegrees * Math.PI / 180;
  const worldY = (1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2 * scale;
  const tileX = Math.floor(worldX);
  const tileY = Math.floor(worldY);
  const tile = data.tiles.find((candidate) => candidate.x === tileX && candidate.y === tileY);
  if (!tile) return null;
  return {
    tile,
    pixelX: Math.min(tile.width - 1, Math.max(0, Math.floor((worldX - tileX) * tile.width))),
    pixelY: Math.min(tile.height - 1, Math.max(0, Math.floor((worldY - tileY) * tile.height)))
  };
}

function tileKey(tile: Pick<GroundElevationTile, "x" | "y">) {
  return `${tile.x}/${tile.y}`;
}
