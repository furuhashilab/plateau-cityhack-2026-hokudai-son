import { useEffect, useRef, useState } from "react";
import ThreeView, { Color, type FeatureInfo } from "@navaramap/three";
import {
  DefaultPlugin,
  type DefaultDescriptions,
} from "@navaramap/three-default-plugin";

type Status = "initializing" | "ready" | "error";

type PickedProperties = Record<string, unknown>;

const PLATEAU_TILESET =
  "https://assets.cms.plateau.reearth.io/assets/d8/2ee0df-f584-42c2-a4c0-afcec6860b47/26202_maizuru-shi_city_2025_citygml_1_op_bldg_3dtiles_lod1/tileset.json";

const readAttribute = (
  properties: PickedProperties | undefined,
  ...keys: string[]
): unknown => {
  if (!properties) return "Unknown";
  for (const key of keys) {
    const value = properties[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "Unknown";
};

export function App() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("initializing");
  const [message, setMessage] = useState("Initializing Navara WASM and renderer…");
  const [picked, setPicked] = useState<PickedProperties>();

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    let disposed = false;
    const startedAt = performance.now();
    const view = new ThreeView<DefaultDescriptions>({
      container,
      picking: true,
      animation: true,
      debug: true,
      backgroundColor: new Color().setHex(0x07121c),
    });
    const plugin = new DefaultPlugin();
    view.addPlugin(plugin);

    void (async () => {
      try {
        await view.init();
        if (disposed) return;

        const imagery = view.addSource({
          type: "raster-tile",
          url: "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
          minZoom: 2,
          maxZoom: 18,
        });
        view.addLayer({ type: "raster", source: imagery });

        const plateauSource = view.addSource({
          type: "3d-tiles",
          url: PLATEAU_TILESET,
        });
        const plateauLayer = view.addLayer({
          type: "3d-tiles",
          source: plateauSource,
          model: { color: new Color().setHex(0xffffff) },
        });

        let selectedFeatureId: unknown;
        const selectedColor = new Color().setHex(0xff3b7a);
        const normalColor = new Color().setHex(0xffffff);

        view.on("pick", (info) => {
          const properties = info?.properties as PickedProperties | undefined;
          selectedFeatureId = readAttribute(properties, "gml_id", "identifier", "id");
          setPicked(properties);
          plateauLayer.forceUpdate();
        });

        plateauLayer.on("featureUpdated", ({ evaluator }) => {
          evaluator.evaluate(
            ({ properties }: FeatureInfo) => {
              const featureId = readAttribute(
                properties,
                "gml_id",
                "identifier",
                "id",
              );
              const selected = selectedFeatureId !== undefined && featureId === selectedFeatureId;
              return {
                color: selected ? selectedColor : normalColor,
                opacity: selected ? 0.82 : 1,
                show: true,
              };
            },
            { filters: ["gml_id", "identifier", "id"] },
          );
        });

        view.addMesh({
          smoothLines: {
            points: [
              { lng: 135.3298, lat: 35.4481, height: 40 },
              { lng: 135.3337, lat: 35.4498, height: 80 },
              { lng: 135.3373, lat: 35.4473, height: 40 },
            ],
            lineWidth: 5,
            color: 0x00e5ff,
            tension: 0.35,
            segments: 24,
            showPoints: true,
            pointSize: 7,
            pointColor: 0xffd166,
          },
        });

        view.setCamera({
          lng: 135.3337,
          lat: 35.4498,
          height: 1700,
          heading: 30,
          pitch: -35,
          roll: 0,
        });

        view.attribution?.add([
          {
            attribution: "Project PLATEAU / MLIT — Maizuru City 2025 building 3D Tiles",
            attributionUrl: "https://www.mlit.go.jp/plateau/",
          },
          {
            attribution: "GSI seamless aerial imagery",
            attributionUrl: "https://maps.gsi.go.jp/development/ichiran.html",
          },
        ]);

        const elapsed = ((performance.now() - startedAt) / 1000).toFixed(2);
        setMessage(`Navara initialized and layers registered in ${elapsed} s`);
        setStatus("ready");

        Object.assign(window, {
          __navaraSpike: {
            view,
            plateauLayer,
            startedAt,
          },
        });
      } catch (error) {
        console.error("Navara spike initialization failed", error);
        setMessage(error instanceof Error ? error.message : String(error));
        setStatus("error");
      }
    })();

    return () => {
      disposed = true;
      // Navara 0.0.8 ships this public runtime method in src/index.ts, but its
      // generated dist/index.d.ts accidentally omits the declaration.
      (view as ThreeView<DefaultDescriptions> & { dispose: () => void }).dispose();
    };
  }, []);

  return (
    <main>
      <div ref={mapRef} className="map" />
      <aside className="panel">
        <p className={`status status-${status}`}>{status.toUpperCase()}</p>
        <h1>Maizuru · Navara Spike</h1>
        <p>{message}</p>
        <p className="hint">Drag to rotate/pan, scroll to zoom, click a PLATEAU building to inspect and recolor it.</p>
        <dl>
          <dt>Identifier</dt>
          <dd>{String(readAttribute(picked, "gml_id", "identifier", "id"))}</dd>
          <dt>Name</dt>
          <dd>{String(readAttribute(picked, "gml:name", "name"))}</dd>
          <dt>Usage</dt>
          <dd>{String(readAttribute(picked, "bldg:usage", "usage"))}</dd>
          <dt>Measured height</dt>
          <dd>{String(readAttribute(picked, "bldg:measuredHeight", "measuredHeight", "measured_height", "hight", "height"))}</dd>
        </dl>
        <p className="provenance">Official PLATEAU 2025 Maizuru building 3D Tiles. The cyan line and yellow points are a manually defined spike visualization, not PLATEAU data.</p>
      </aside>
    </main>
  );
}

declare global {
  interface Window {
    __navaraSpike?: Record<string, unknown>;
  }
}
