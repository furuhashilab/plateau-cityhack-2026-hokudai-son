import fs from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve("dist");
const githubPagesBaseDirectory = "plateau-cityhack-2026-hokudai-son";
const pluginCesiumDirectory = path.join(outDir, githubPagesBaseDirectory, "cesium");
const pagesCesiumDirectory = path.join(outDir, "cesium");

try {
  if (!(await fs.stat(pluginCesiumDirectory)).isDirectory()) {
    throw new Error(`Not a directory: ${pluginCesiumDirectory}`);
  }
  await fs.rm(pagesCesiumDirectory, { recursive: true, force: true });
  await fs.cp(pluginCesiumDirectory, pagesCesiumDirectory, { recursive: true });
  await fs.rm(path.join(outDir, githubPagesBaseDirectory), {
    recursive: true,
    force: true
  });
  console.log("Prepared Cesium static assets for GitHub Pages.");
} catch (error) {
  console.error("Failed to prepare Cesium static assets for GitHub Pages.");
  throw error;
}
