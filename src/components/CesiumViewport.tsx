import { useEffect, useRef } from "react";
import type { Cesium3DTileset, CustomShader, Viewer } from "cesium";
import { Cartesian3, Matrix4, RequestScheduler } from "cesium";
import { createMaizuruViewer } from "../cesium/createViewer";
import { attachBuildingPicking } from "../cesium/picking";
import { applyContextLimitMinimums, loadPlateauBuildings } from "../cesium/plateauLayer";
import { loadGroundElevationLayer, type GroundElevationLayer } from "../cesium/groundElevationLayer";
import { createInundationLayer, type InundationLayer } from "../cesium/inundationLayer";
import { createBuildingImpactShader } from "../cesium/buildingImpactShader";
import { MAIZURU_CAMERA } from "../data/maizuruPlateau";
import { buildSeaConnectivity, type SeaConnectivity } from "../data/seaConnectivity";
import type { InundationMethod } from "../data/inundation";
import type { BuildingSelection, PlateauTilesetDataset, ViewerStatus } from "../types/plateau";
import { createFacilityLayer, type FacilityLayer } from "../cesium/facilityLayer";
import { WEST_MAIZURU_FACILITIES } from "../data/facilities";
import type { FacilityCategoryVisibility, FacilitySelection } from "../types/facility";
import { createRoadLayer, type RoadLayer, type RoadLayerStats } from "../cesium/roadLayer";
import { WEST_MAIZURU_ROAD_PROOF } from "../data/roads";
import type { RoadSelection } from "../types/road";
import {
  computeUrbanFunctionImpactState,
  type UrbanFunctionImpactState
} from "../data/urbanFunctions";

type Props = {
  dataset: PlateauTilesetDataset;
  onStatusChange: (status: ViewerStatus) => void;
  onBuildingSelect: (selection: BuildingSelection | null) => void;
  onFacilitySelect: (selection: FacilitySelection | null) => void;
  onRoadSelect: (selection: RoadSelection | null) => void;
  onRoadStatsChange: (stats: RoadLayerStats) => void;
  onUrbanFunctionImpactChange: (state: UrbanFunctionImpactState) => void;
  facilityVisibility: FacilityCategoryVisibility;
  focusedFacilityCategory: FacilitySelection["facility"]["category"] | null;
  groundElevationVisible: boolean;
  inundationVisible: boolean;
  tideLevelMeters: number;
  inundationMethod: InundationMethod;
  onGroundElevationStateChange: (state: { loading: boolean; error: string | null }) => void;
};

export function CesiumViewport({
  dataset,
  onStatusChange,
  onBuildingSelect,
  onFacilitySelect,
  onRoadSelect,
  onRoadStatsChange,
  onUrbanFunctionImpactChange,
  facilityVisibility,
  focusedFacilityCategory,
  groundElevationVisible,
  inundationVisible,
  tideLevelMeters,
  inundationMethod,
  onGroundElevationStateChange
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const elevationLayerRef = useRef<GroundElevationLayer | null>(null);
  const inundationLayerRef = useRef<InundationLayer | null>(null);
  const tilesetRef = useRef<Cesium3DTileset | null>(null);
  const buildingShaderRef = useRef<CustomShader | null>(null);
  const connectivityRef = useRef<SeaConnectivity | null>(null);
  const facilityLayerRef = useRef<FacilityLayer | null>(null);
  const roadLayerRef = useRef<RoadLayer | null>(null);
  const elevationVisibleRef = useRef(groundElevationVisible);
  const inundationVisibleRef = useRef(inundationVisible);
  const tideLevelRef = useRef(tideLevelMeters);
  const inundationMethodRef = useRef(inundationMethod);
  const facilityVisibilityRef = useRef(facilityVisibility);
  const focusedFacilityCategoryRef = useRef(focusedFacilityCategory);
  const urbanFunctionImpactRef = useRef<UrbanFunctionImpactState>(
    computeUrbanFunctionImpactState(WEST_MAIZURU_FACILITIES, null, null, tideLevelMeters, inundationMethod)
  );

  useEffect(() => {
    facilityVisibilityRef.current = facilityVisibility;
    updateFacilityDisplay();
  }, [facilityVisibility]);

  useEffect(() => {
    focusedFacilityCategoryRef.current = focusedFacilityCategory;
    updateFacilityDisplay();
  }, [focusedFacilityCategory]);

  useEffect(() => {
    elevationVisibleRef.current = groundElevationVisible;
    elevationLayerRef.current?.setVisible(groundElevationVisible);
    elevationLayerRef.current?.setAlpha(groundElevationVisible && inundationVisibleRef.current ? 0.4 : 0.68);
  }, [groundElevationVisible]);

  useEffect(() => {
    inundationVisibleRef.current = inundationVisible;
    inundationLayerRef.current?.setVisible(inundationVisible);
    elevationLayerRef.current?.setAlpha(inundationVisible && elevationVisibleRef.current ? 0.4 : 0.68);
  }, [inundationVisible]);

  useEffect(() => {
    tideLevelRef.current = tideLevelMeters;
    inundationLayerRef.current?.setTideLevel(tideLevelMeters);
    buildingShaderRef.current?.setUniform("u_tide", tideLevelMeters);
    const roadStats = roadLayerRef.current?.setScenario(tideLevelMeters, inundationMethodRef.current);
    if (roadStats) {
      publishRoadStats(roadStats);
      onRoadStatsChange(roadStats);
    }
    publishUrbanFunctionImpact();
  }, [tideLevelMeters]);

  useEffect(() => {
    inundationMethodRef.current = inundationMethod;
    inundationLayerRef.current?.setMethod(inundationMethod);
    buildingShaderRef.current?.setUniform("u_seaConnected", inundationMethod === "sea-connected");
    const roadStats = roadLayerRef.current?.setScenario(tideLevelRef.current, inundationMethod);
    if (roadStats) {
      publishRoadStats(roadStats);
      onRoadStatsChange(roadStats);
    }
    publishUrbanFunctionImpact();
  }, [inundationMethod]);

  useEffect(() => {
    if (!hostRef.current) return;

    let disposed = false;
    const elevationAbortController = new AbortController();
    const startedAt = performance.now();
    const { viewer, destroy } = createMaizuruViewer(hostRef.current);
    if (import.meta.env.DEV) {
      (window as unknown as { __PLATEAU_VIEWER__?: Viewer }).__PLATEAU_VIEWER__ = viewer;
    }
    const contextLimitsReport = applyContextLimitMinimums(
      ((viewer.scene as unknown as { context?: { _gl?: WebGLRenderingContext } }).context)?._gl
    );
    if (import.meta.env.DEV) {
      (window as unknown as {
        __PLATEAU_CONTEXT_LIMITS__?: typeof contextLimitsReport;
      }).__PLATEAU_CONTEXT_LIMITS__ = contextLimitsReport;
    }
    applyRequestSchedulerWorkaround();
    const detachPicking = attachBuildingPicking(
      viewer,
      onBuildingSelect,
      () => elevationLayerRef.current?.data ?? null,
      () => connectivityRef.current,
      () => tideLevelRef.current,
      () => inundationMethodRef.current,
      () => facilityVisibilityRef.current,
      onFacilitySelect,
      (roadId) => roadLayerRef.current?.selectionForRoadId(roadId) ?? null,
      onRoadSelect
    );
    onUrbanFunctionImpactChange(urbanFunctionImpactRef.current);
    publishUrbanFunctionImpactDev(urbanFunctionImpactRef.current);
    facilityLayerRef.current = createFacilityLayer(viewer, WEST_MAIZURU_FACILITIES);
    updateFacilityDisplay();
    roadLayerRef.current = createRoadLayer(
      viewer,
      WEST_MAIZURU_ROAD_PROOF.roads,
      tideLevelRef.current,
      inundationMethodRef.current
    );
    publishRoadStats(roadLayerRef.current.stats());
    onRoadStatsChange(roadLayerRef.current.stats());

    const applyBuildingImpact = () => {
      const tileset = tilesetRef.current;
      const elevation = elevationLayerRef.current?.data;
      const connectivity = connectivityRef.current;
      if (!tileset || !elevation || !connectivity || buildingShaderRef.current) return;
      const shader = createBuildingImpactShader(
        elevation,
        connectivity,
        tideLevelRef.current,
        inundationMethodRef.current
      );
      buildingShaderRef.current = shader;
      tileset.customShader = shader;
      viewer.scene.requestRender();
    };
    viewer.camera.lookAt(
      Cartesian3.fromDegrees(135.3337, 35.4498, 0),
      MAIZURU_CAMERA.initialOffset
    );
    viewer.camera.lookAtTransform(Matrix4.IDENTITY);

    onStatusChange({
      phase: "loading",
      message: "Loading Maizuru PLATEAU 3D Tiles",
      initialLoadMs: null,
      interactiveMs: null,
      pendingTiles: 0,
      processingTiles: 0,
      loadedTiles: 0,
      fps: null,
      memoryMb: readMemoryMb()
    });

    const status: ViewerStatus = {
      phase: "loading",
      message: "Loading Maizuru PLATEAU 3D Tiles",
      initialLoadMs: null,
      interactiveMs: null,
      pendingTiles: 0,
      processingTiles: 0,
      loadedTiles: 0,
      fps: null,
      memoryMb: readMemoryMb()
    };

    const removeFpsProbe = startFpsProbe(viewer, (fps) => {
      status.fps = fps;
      status.memoryMb = readMemoryMb();
      onStatusChange({ ...status });
    });

    onGroundElevationStateChange({ loading: true, error: null });
    void loadGroundElevationLayer(viewer, elevationVisibleRef.current, elevationAbortController.signal)
      .then((layer) => {
        if (disposed) {
          layer.destroy();
          return;
        }
        elevationLayerRef.current = layer;
        layer.setVisible(elevationVisibleRef.current);
        layer.setAlpha(elevationVisibleRef.current && inundationVisibleRef.current ? 0.4 : 0.68);
        const connectivity = buildSeaConnectivity(layer.data);
        connectivityRef.current = connectivity;
        inundationLayerRef.current = createInundationLayer(
          viewer,
          layer.data,
          connectivity,
          inundationVisibleRef.current,
          tideLevelRef.current,
          inundationMethodRef.current
        );
        publishUrbanFunctionImpact();
        applyBuildingImpact();
        onGroundElevationStateChange({ loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (disposed || (error instanceof DOMException && error.name === "AbortError")) return;
        console.error("[Phase1B] Failed to load ground elevation", error);
        onGroundElevationStateChange({
          loading: false,
          error: error instanceof Error ? error.message : "Failed to load elevation data"
        });
      });

    void loadPlateauBuildings(viewer, dataset, {
      onReady: () => {
        if (disposed) return;
        status.phase = "interactive";
        status.message = "Ready";
        status.initialLoadMs = Math.round(performance.now() - startedAt);
        status.interactiveMs = status.initialLoadMs;
        status.memoryMb = readMemoryMb();
        onStatusChange({ ...status });
      },
      onTileLoad: () => {
        status.loadedTiles += 1;
        onStatusChange({ ...status });
      },
      onLoadProgress: (pendingTiles, processingTiles) => {
        status.pendingTiles = pendingTiles;
        status.processingTiles = processingTiles;
        status.message =
          pendingTiles + processingTiles > 0
            ? `Loading tiles: ${pendingTiles} pending / ${processingTiles} processing`
            : status.phase === "interactive"
              ? "Ready"
              : status.message;
        onStatusChange({ ...status });
      }
    }).then((tileset) => {
      if (disposed) return;
      tilesetRef.current = tileset;
      viewer.scene.primitives.add(tileset);
      applyBuildingImpact();
      void MAIZURU_CAMERA.initialOffset;
      viewer.scene.requestRender();
    }).catch((error: unknown) => {
      if (disposed) return;
      console.error("[Phase1A] Failed to load PLATEAU buildings", error);
      status.phase = "error";
      status.message = error instanceof Error ? error.message : "Failed to load PLATEAU tiles";
      status.memoryMb = readMemoryMb();
      onStatusChange({ ...status });
    });

    return () => {
      disposed = true;
      elevationAbortController.abort();
      elevationLayerRef.current?.destroy();
      elevationLayerRef.current = null;
      inundationLayerRef.current?.destroy();
      inundationLayerRef.current = null;
      tilesetRef.current = null;
      buildingShaderRef.current = null;
      connectivityRef.current = null;
      facilityLayerRef.current?.destroy();
      facilityLayerRef.current = null;
      roadLayerRef.current?.destroy();
      roadLayerRef.current = null;
      if (import.meta.env.DEV) {
        delete (window as unknown as {
          __PLATEAU_CONTEXT_LIMITS__?: typeof contextLimitsReport;
          __PLATEAU_VIEWER__?: Viewer;
        }).__PLATEAU_CONTEXT_LIMITS__;
        delete (window as unknown as {
          __PLATEAU_CONTEXT_LIMITS__?: typeof contextLimitsReport;
          __PLATEAU_VIEWER__?: Viewer;
        }).__PLATEAU_VIEWER__;
      }
      removeFpsProbe();
      detachPicking();
      destroy();
    };
  }, [
    dataset,
    onBuildingSelect,
    onFacilitySelect,
    onGroundElevationStateChange,
    onRoadSelect,
    onRoadStatsChange,
    onUrbanFunctionImpactChange,
    onStatusChange
  ]);

  return <div ref={hostRef} className="cesium-host" />;

  function publishUrbanFunctionImpact() {
    const impact = computeUrbanFunctionImpactState(
      WEST_MAIZURU_FACILITIES,
      elevationLayerRef.current?.data ?? null,
      connectivityRef.current,
      tideLevelRef.current,
      inundationMethodRef.current
    );
    urbanFunctionImpactRef.current = impact;
    onUrbanFunctionImpactChange(impact);
    publishUrbanFunctionImpactDev(impact);
    updateFacilityDisplay();
  }

  function updateFacilityDisplay() {
    facilityLayerRef.current?.setDisplay({
      visibility: facilityVisibilityRef.current,
      focusedCategory: focusedFacilityCategoryRef.current,
      affectedFacilityIds: urbanFunctionImpactRef.current.affectedFacilityIds
    });
  }
}

function publishRoadStats(stats: RoadLayerStats) {
  if (!import.meta.env.DEV) return;
  (window as unknown as {
    __PLATEAU_ROAD_STATS__?: RoadLayerStats;
  }).__PLATEAU_ROAD_STATS__ = stats;
}

function publishUrbanFunctionImpactDev(state: UrbanFunctionImpactState) {
  if (!import.meta.env.DEV) return;
  (window as unknown as {
    __PLATEAU_URBAN_FUNCTION_SUMMARIES__?: UrbanFunctionImpactState["summaries"];
  }).__PLATEAU_URBAN_FUNCTION_SUMMARIES__ = state.summaries;
}

function startFpsProbe(viewer: Viewer, onFps: (fps: number) => void) {
  let frames = 0;
  let last = performance.now();
  const listener = () => {
    frames += 1;
    const now = performance.now();
    if (now - last >= 1000) {
      onFps(Math.round((frames * 1000) / (now - last)));
      frames = 0;
      last = now;
    }
  };
  viewer.scene.postRender.addEventListener(listener);
  return () => viewer.scene.postRender.removeEventListener(listener);
}

function readMemoryMb(): number | null {
  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  return memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : null;
}

function applyRequestSchedulerWorkaround() {
  const scheduler = RequestScheduler as unknown as {
    __plateauWorkaroundApplied?: boolean;
    throttleRequests?: boolean;
  };

  if (scheduler.__plateauWorkaroundApplied) {
    return;
  }

  scheduler.__plateauWorkaroundApplied = true;

  // In the current remote Chrome + SSH tunnel setup, Cesium leaves PLATEAU b3dm
  // requests in ISSUED state unless scheduler throttling is disabled.
  scheduler.throttleRequests = false;
}
