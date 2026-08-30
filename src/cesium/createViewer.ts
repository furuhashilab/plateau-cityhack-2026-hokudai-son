import {
  Color,
  Credit,
  UrlTemplateImageryProvider,
  Viewer
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

export function createMaizuruViewer(container: HTMLElement) {
  const creditContainer = document.createElement("div");
  creditContainer.className = "cesium-credit-container";

  const viewer = new Viewer(container, {
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: true,
    timeline: false,
    navigationHelpButton: false,
    shadows: false,
    requestRenderMode: false,
    creditContainer,
    baseLayer: false
  });

  viewer.imageryLayers.addImageryProvider(
    new UrlTemplateImageryProvider({
      url: "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
      credit: new Credit("Base map: GSI Maps")
    })
  );

  viewer.scene.backgroundColor = Color.fromCssColorString("#0b1118");
  viewer.scene.globe.depthTestAgainstTerrain = false;
  viewer.scene.globe.enableLighting = false;
  viewer.scene.fog.enabled = false;
  if (viewer.scene.skyAtmosphere) {
    viewer.scene.skyAtmosphere.show = false;
  }
  viewer.scene.requestRender();

  return {
    viewer,
    destroy: () => {
      if (!viewer.isDestroyed()) {
        viewer.destroy();
      }
    }
  };
}
