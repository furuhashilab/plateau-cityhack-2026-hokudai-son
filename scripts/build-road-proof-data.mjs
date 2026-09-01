import { mkdir, readFile, writeFile } from "node:fs/promises";

const OUT_PATH = new URL("../src/data/roads/westMaizuruRoadProof.json", import.meta.url);
const RETRIEVAL_DATE = "2026-08-30";
const SAMPLE_SPACING_METERS = 5;
const MIN_LENGTH_METERS = 40;
const MAX_FEATURES = 48;
const AOI = {
  label: "West Maizuru station / Isazu lowland proof AOI",
  south: 35.443,
  west: 135.326,
  north: 35.4518,
  east: 135.3378
};
const SELECTED_HIGHWAY_CLASSES = [
  "primary",
  "secondary",
  "tertiary",
  "unclassified",
  "residential",
  "service"
];
const DEM = {
  zoom: 15,
  minX: 28701,
  maxX: 28703,
  minY: 12927,
  maxY: 12929
};

const osmQuery = `
[out:json][timeout:25];
way["highway"~"^(${SELECTED_HIGHWAY_CLASSES.join("|")})$"](${AOI.south},${AOI.west},${AOI.north},${AOI.east});
out tags geom;
`.trim();

const osmUrls = [
  `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(osmQuery)}`,
  `https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(osmQuery)}`,
  `https://overpass.openstreetmap.ru/api/interpreter?data=${encodeURIComponent(osmQuery)}`
];

async function main() {
  const [osm, demTiles] = await Promise.all([
    loadOsm(),
    loadDemTiles()
  ]);
  const connectivity = buildSeaConnectivity(demTiles);
  const roads = buildRoads(osm, demTiles, connectivity);

  const payload = {
    id: "west-maizuru-road-proof-osm-2026-08-30",
    label: "West Maizuru Road Proof AOI",
    source: {
      name: "OpenStreetMap",
      url: "https://www.openstreetmap.org/copyright",
      attribution: "OpenStreetMap contributors",
      license: "Open Data Commons Open Database License (ODbL) 1.0",
      retrievalDate: RETRIEVAL_DATE,
      retrievalMethod: "Overpass API one-time AOI query; runtime app loads this static derived JSON only.",
      overpassUrl: osmUrls[0],
      osmBaseTimestamp: osm.osm3s?.timestamp_osm_base ?? null
    },
    aoi: AOI,
    selectedHighwayClasses: SELECTED_HIGHWAY_CLASSES,
    excludedHighwayClasses: ["footway", "path", "cycleway", "steps", "pedestrian"],
    processing: {
      method: "OSM ways clipped to AOI bbox, short/non-vehicle/parking aisle/driveway segments excluded, sampled every approximately 5 m including endpoints, GSI DEM5A z15 nearest-cell elevation and derived sea-connection threshold attached.",
      sampleSpacingMeters: SAMPLE_SPACING_METERS,
      minimumLengthMeters: MIN_LENGTH_METERS,
      maxFeatures: MAX_FEATURES,
      demSource: "GSI DEM5A text tiles, same z15 tile range as the app DEM AOI.",
      seaConnectivity: "Boundary-connected DEM NoData sea mask with 4-neighbor minimum-threshold propagation, matching src/data/seaConnectivity.ts."
    },
    summary: {
      osmWayCount: osm.elements?.filter((element) => element.type === "way").length ?? 0,
      roadFeatureCount: roads.length,
      sampleCount: roads.reduce((sum, road) => sum + road.samples.length, 0),
      totalLengthMeters: round(roads.reduce((sum, road) => sum + road.totalLengthMeters, 0), 1),
      invalidSampleCount: roads.reduce((sum, road) => sum + road.samples.filter((sample) => !sample.valid).length, 0),
      roadClasses: countBy(roads, (road) => road.roadClass)
    },
    roads
  };

  await mkdir(new URL("../src/data/roads/", import.meta.url), { recursive: true });
  await writeFile(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(JSON.stringify(payload.summary, null, 2));
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

async function loadOsm() {
  if (process.env.OSM_JSON_PATH) {
    return JSON.parse(await readFile(process.env.OSM_JSON_PATH, "utf8"));
  }
  return fetchFirstJson(osmUrls);
}

async function fetchFirstJson(urls) {
  const errors = [];
  for (const url of urls) {
    try {
      return await fetchJson(url);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  throw new Error(`All OSM fetch attempts failed: ${errors.join(" | ")}`);
}

async function loadDemTiles() {
  const tiles = [];
  for (let x = DEM.minX; x <= DEM.maxX; x += 1) {
    for (let y = DEM.minY; y <= DEM.maxY; y += 1) {
      const url = `https://cyberjapandata.gsi.go.jp/xyz/dem5a/${DEM.zoom}/${x}/${y}.txt`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      const text = await response.text();
      const values = new Float32Array(256 * 256);
      const tokens = text.trim().split(/[\n,]/);
      for (let index = 0; index < values.length; index += 1) {
        const token = tokens[index];
        values[index] = token && token !== "e" ? Number(token) : Number.NaN;
      }
      tiles.push({ x, y, width: 256, height: 256, values });
    }
  }
  return tiles;
}

function buildRoads(osm, demTiles, connectivity) {
  const ways = (osm.elements ?? [])
    .filter((element) => element.type === "way" && Array.isArray(element.geometry))
    .filter((way) => SELECTED_HIGHWAY_CLASSES.includes(way.tags?.highway))
    .filter((way) => way.tags?.motor_vehicle !== "no")
    .filter((way) => way.tags?.service !== "parking_aisle")
    .filter((way) => way.tags?.service !== "driveway");

  const features = [];
  for (const way of ways) {
    const parts = clipWayToAoi(way.geometry.map((point) => [point.lon, point.lat]));
    parts.forEach((coordinates, partIndex) => {
      const totalLengthMeters = lineLengthMeters(coordinates);
      if (totalLengthMeters < MIN_LENGTH_METERS) return;
      const samples = sampleLine(coordinates, SAMPLE_SPACING_METERS).map((sample) => {
        const groundElevationMeters = sampleDem(demTiles, sample.longitude, sample.latitude);
        const seaConnectionThresholdMeters = sampleThreshold(connectivity, sample.longitude, sample.latitude);
        const valid = groundElevationMeters !== null && seaConnectionThresholdMeters !== null;
        return {
          longitude: round(sample.longitude, 7),
          latitude: round(sample.latitude, 7),
          distanceAlongRoadMeters: round(sample.distanceAlongRoadMeters, 1),
          groundElevationMeters: groundElevationMeters === null ? null : round(groundElevationMeters, 2),
          seaConnectionThresholdMeters: seaConnectionThresholdMeters === null ? null : round(seaConnectionThresholdMeters, 2),
          valid
        };
      });
      features.push({
        id: `osm-way-${way.id}${parts.length > 1 ? `-${partIndex + 1}` : ""}`,
        sourceId: `way/${way.id}`,
        name: way.tags?.name ?? way.tags?.ref ?? null,
        roadClass: way.tags.highway,
        geometry: {
          type: "LineString",
          coordinates: coordinates.map(([longitude, latitude]) => [round(longitude, 7), round(latitude, 7)])
        },
        bbox: bbox(coordinates),
        totalLengthMeters: round(totalLengthMeters, 1),
        provenance: {
          source: "OpenStreetMap",
          sourceUrl: `https://www.openstreetmap.org/way/${way.id}`,
          attribution: "OpenStreetMap contributors",
          license: "ODbL 1.0",
          retrievalDate: RETRIEVAL_DATE,
          processing: "Clipped to Phase 2B.1 proof AOI and sampled against GSI DEM5A / sea-connectivity thresholds."
        },
        samples
      });
    });
  }

  return features
    .sort((a, b) => classRank(a.roadClass) - classRank(b.roadClass) || b.totalLengthMeters - a.totalLengthMeters)
    .slice(0, MAX_FEATURES);
}

function clipWayToAoi(coordinates) {
  const parts = [];
  let current = [];
  for (let index = 1; index < coordinates.length; index += 1) {
    const clipped = clipSegment(coordinates[index - 1], coordinates[index]);
    if (!clipped) {
      if (current.length > 1) parts.push(dedupeConsecutive(current));
      current = [];
      continue;
    }
    const [start, end] = clipped;
    if (current.length === 0) {
      current.push(start, end);
    } else if (sameCoordinate(current[current.length - 1], start)) {
      current.push(end);
    } else {
      if (current.length > 1) parts.push(dedupeConsecutive(current));
      current = [start, end];
    }
  }
  if (current.length > 1) parts.push(dedupeConsecutive(current));
  return parts.filter((part) => part.length > 1);
}

function clipSegment(a, b) {
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const checks = [
    [-dx, a[0] - AOI.west],
    [dx, AOI.east - a[0]],
    [-dy, a[1] - AOI.south],
    [dy, AOI.north - a[1]]
  ];
  for (const [p, q] of checks) {
    if (p === 0 && q < 0) return null;
    if (p === 0) continue;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return null;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return null;
      if (r < t1) t1 = r;
    }
  }
  return [
    [a[0] + t0 * dx, a[1] + t0 * dy],
    [a[0] + t1 * dx, a[1] + t1 * dy]
  ];
}

function sampleLine(coordinates, spacingMeters) {
  const totalLength = lineLengthMeters(coordinates);
  const distances = [];
  for (let distance = 0; distance < totalLength; distance += spacingMeters) distances.push(distance);
  if (distances.length === 0 || distances[distances.length - 1] !== totalLength) distances.push(totalLength);
  return distances.map((distanceAlongRoadMeters) => {
    const [longitude, latitude] = interpolateLine(coordinates, distanceAlongRoadMeters);
    return { longitude, latitude, distanceAlongRoadMeters };
  });
}

function interpolateLine(coordinates, targetDistanceMeters) {
  let covered = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    const start = coordinates[index - 1];
    const end = coordinates[index];
    const segmentLength = distanceMeters(start, end);
    if (covered + segmentLength >= targetDistanceMeters) {
      const ratio = segmentLength === 0 ? 0 : (targetDistanceMeters - covered) / segmentLength;
      return [
        start[0] + (end[0] - start[0]) * ratio,
        start[1] + (end[1] - start[1]) * ratio
      ];
    }
    covered += segmentLength;
  }
  return coordinates[coordinates.length - 1];
}

function lineLengthMeters(coordinates) {
  let length = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    length += distanceMeters(coordinates[index - 1], coordinates[index]);
  }
  return length;
}

function distanceMeters(a, b) {
  const radius = 6371000;
  const dLat = toRadians(b[1] - a[1]);
  const dLon = toRadians(b[0] - a[0]);
  const lat1 = toRadians(a[1]);
  const lat2 = toRadians(b[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
}

function sampleDem(tiles, longitude, latitude) {
  const sample = locateTile(longitude, latitude);
  const tile = tiles.find((candidate) => candidate.x === sample.tileX && candidate.y === sample.tileY);
  if (!tile) return null;
  const value = tile.values[sample.pixelY * tile.width + sample.pixelX];
  return Number.isFinite(value) ? value : null;
}

function buildSeaConnectivity(tiles) {
  const tileWidth = 256;
  const tileHeight = 256;
  const spanX = DEM.maxX - DEM.minX + 1;
  const spanY = DEM.maxY - DEM.minY + 1;
  const width = spanX * tileWidth;
  const height = spanY * tileHeight;
  const elevations = new Float32Array(width * height);
  elevations.fill(Number.NaN);
  for (const tile of tiles) {
    const tileColumn = tile.x - DEM.minX;
    const tileRow = tile.y - DEM.minY;
    for (let y = 0; y < tile.height; y += 1) {
      const sourceStart = y * tile.width;
      const targetStart = (tileRow * tileHeight + y) * width + tileColumn * tileWidth;
      elevations.set(tile.values.subarray(sourceStart, sourceStart + tile.width), targetStart);
    }
  }
  const seaWater = findBoundaryConnectedNoData(elevations, width, height);
  const thresholds = computeConnectionThresholds(elevations, seaWater, width, height);
  return { thresholds, width, tileWidth, tileHeight };
}

function findBoundaryConnectedNoData(values, width, height) {
  const mask = new Uint8Array(values.length);
  const queue = new Int32Array(values.length);
  let head = 0;
  let tail = 0;
  const enqueue = (index) => {
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

function computeConnectionThresholds(elevations, seaWater, width) {
  const thresholds = new Float32Array(elevations.length);
  thresholds.fill(Number.POSITIVE_INFINITY);
  const heap = new IndexedMinHeap(thresholds);
  const seedLand = (index) => {
    const elevation = elevations[index];
    if (!Number.isFinite(elevation) || elevation >= thresholds[index]) return;
    thresholds[index] = elevation;
    heap.insertOrDecrease(index);
  };
  for (let index = 0; index < seaWater.length; index += 1) {
    if (!seaWater[index]) continue;
    const x = index % width;
    if (x > 0) seedLand(index - 1);
    if (x + 1 < width) seedLand(index + 1);
    if (index >= width) seedLand(index - width);
    if (index + width < elevations.length) seedLand(index + width);
  }
  const relax = (fromCost, index) => {
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
  return thresholds;
}

function sampleThreshold(connectivity, longitude, latitude) {
  const sample = locateTile(longitude, latitude);
  if (sample.tileX < DEM.minX || sample.tileX > DEM.maxX || sample.tileY < DEM.minY || sample.tileY > DEM.maxY) {
    return null;
  }
  const globalX = (sample.tileX - DEM.minX) * connectivity.tileWidth + sample.pixelX;
  const globalY = (sample.tileY - DEM.minY) * connectivity.tileHeight + sample.pixelY;
  const value = connectivity.thresholds[globalY * connectivity.width + globalX];
  return Number.isFinite(value) ? value : null;
}

function locateTile(longitude, latitude) {
  const scale = 2 ** DEM.zoom;
  const worldX = ((longitude + 180) / 360) * scale;
  const latitudeRadians = toRadians(latitude);
  const worldY = (1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2 * scale;
  const tileX = Math.floor(worldX);
  const tileY = Math.floor(worldY);
  return {
    tileX,
    tileY,
    pixelX: Math.min(255, Math.max(0, Math.floor((worldX - tileX) * 256))),
    pixelY: Math.min(255, Math.max(0, Math.floor((worldY - tileY) * 256)))
  };
}

class IndexedMinHeap {
  constructor(costs) {
    this.costs = costs;
    this.indices = new Int32Array(costs.length);
    this.positions = new Int32Array(costs.length);
    this.positions.fill(-1);
    this.size = 0;
  }

  insertOrDecrease(index) {
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

  bubbleUp(start) {
    let position = start;
    while (position > 0) {
      const parent = (position - 1) >> 1;
      if (this.costs[this.indices[parent]] <= this.costs[this.indices[position]]) break;
      this.swap(parent, position);
      position = parent;
    }
  }

  bubbleDown(start) {
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

  swap(a, b) {
    const first = this.indices[a];
    const second = this.indices[b];
    this.indices[a] = second;
    this.indices[b] = first;
    this.positions[first] = b;
    this.positions[second] = a;
  }
}

function bbox(coordinates) {
  return {
    west: round(Math.min(...coordinates.map(([longitude]) => longitude)), 7),
    south: round(Math.min(...coordinates.map(([, latitude]) => latitude)), 7),
    east: round(Math.max(...coordinates.map(([longitude]) => longitude)), 7),
    north: round(Math.max(...coordinates.map(([, latitude]) => latitude)), 7)
  };
}

function countBy(items, getter) {
  return items.reduce((counts, item) => {
    const key = getter(item) ?? "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function classRank(roadClass) {
  return {
    primary: 1,
    secondary: 2,
    tertiary: 3,
    unclassified: 4,
    residential: 5,
    service: 6
  }[roadClass] ?? 99;
}

function dedupeConsecutive(coordinates) {
  const result = [];
  for (const coordinate of coordinates) {
    if (!result.length || !sameCoordinate(result[result.length - 1], coordinate)) result.push(coordinate);
  }
  return result;
}

function sameCoordinate(a, b) {
  return Math.abs(a[0] - b[0]) < 1e-10 && Math.abs(a[1] - b[1]) < 1e-10;
}

function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

function round(value, digits) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

await main();
