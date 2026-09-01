import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";

const GITHUB_PAGES_BASE = "/plateau-cityhack-2026-hokudai-son/";
const PLATEAU_ORIGIN = "https://assets.cms.plateau.reearth.io";
const PLATEAU_PATH = "/assets/d8/2ee0df-f584-42c2-a4c0-afcec6860b47/26202_maizuru-shi_city_2025_citygml_1_op_bldg_3dtiles_lod1";

export default defineConfig({
  base: GITHUB_PAGES_BASE,
  plugins: [react(), cesium()],
  build: {
    chunkSizeWarningLimit: 1600
  },
  server: {
    proxy: {
      "/plateau-proxy": {
        target: PLATEAU_ORIGIN,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/plateau-proxy/, PLATEAU_PATH),
      }
    }
  }
});
