# Maizuru Navara Technical Spike

Independent experiment for evaluating Navara 0.0.8 against the known-good Cesium application. Nothing in the existing application is imported or modified.

## Run

```bash
npm install
npm run dev
```

The spike loads the official PLATEAU asset URL directly. On 2026-08-27 both `tileset.json` and B3DM responses advertised `Access-Control-Allow-Origin: *`; normal Chrome verification is still required before treating the direct route as proven for the demo.

The custom cyan line and yellow points are manually defined scenario visualization, not official PLATEAU data.
