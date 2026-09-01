import { useCallback, useState } from "react";
import { CesiumViewport } from "../components/CesiumViewport";
import { DataBadge } from "../components/DataBadge";
import { SelectedBuildingPanel } from "../components/SelectedBuildingPanel";
import { StatusOverlay } from "../components/StatusOverlay";
import { GroundElevationControl } from "../components/GroundElevationControl";
import { InundationControl } from "../components/InundationControl";
import { DEFAULT_INUNDATION_METHOD, TIDE_LEVEL, type InundationMethod } from "../data/inundation";
import { MAIZURU_PLATEAU_BUILDINGS } from "../data/maizuruPlateau";
import type { BuildingSelection, ViewerStatus } from "../types/plateau";
import { DEFAULT_FACILITY_VISIBILITY, WEST_MAIZURU_FACILITIES } from "../data/facilities";
import type { FacilityCategory, FacilitySelection } from "../types/facility";
import { UrbanFunctionsControl } from "../components/UrbanFunctionsControl";
import { SelectedFacilityPanel } from "../components/SelectedFacilityPanel";
import { SelectedRoadPanel } from "../components/SelectedRoadPanel";
import { computeRoadImpactMetrics } from "../data/roads";
import type { RoadSelection } from "../types/road";
import type { RoadLayerStats } from "../cesium/roadLayer";
import {
  computeUrbanFunctionImpactState,
  type UrbanFunctionImpactState
} from "../data/urbanFunctions";

export function App() {
  const [status, setStatus] = useState<ViewerStatus>({
    phase: "initializing",
    message: "Initializing Cesium",
    initialLoadMs: null,
    interactiveMs: null,
    pendingTiles: 0,
    processingTiles: 0,
    loadedTiles: 0,
    fps: null,
    memoryMb: null
  });
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingSelection | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<FacilitySelection | null>(null);
  const [selectedRoad, setSelectedRoad] = useState<RoadSelection | null>(null);
  const [, setRoadStats] = useState<RoadLayerStats | null>(null);
  const [facilityVisibility, setFacilityVisibility] = useState(DEFAULT_FACILITY_VISIBILITY);
  const [focusedFacilityCategory, setFocusedFacilityCategory] = useState<FacilityCategory | null>(null);
  const [urbanFunctionImpact, setUrbanFunctionImpact] = useState<UrbanFunctionImpactState>(
    computeUrbanFunctionImpactState(WEST_MAIZURU_FACILITIES, null, null, TIDE_LEVEL.initialMeters, DEFAULT_INUNDATION_METHOD)
  );
  const [groundElevationVisible, setGroundElevationVisible] = useState(false);
  const [inundationVisible, setInundationVisible] = useState(true);
  const [tideLevelMeters, setTideLevelMeters] = useState<number>(TIDE_LEVEL.initialMeters);
  const [inundationMethod, setInundationMethod] = useState<InundationMethod>(DEFAULT_INUNDATION_METHOD);
  const [groundElevationState, setGroundElevationState] = useState<{ loading: boolean; error: string | null }>({
    loading: true,
    error: null
  });
  const handleBuildingSelect = useCallback((selection: BuildingSelection | null) => {
    setSelectedBuilding(selection);
    if (selection) {
      setSelectedFacility(null);
      setSelectedRoad(null);
    }
  }, []);
  const handleFacilitySelect = useCallback((selection: FacilitySelection | null) => {
    setSelectedFacility(selection);
    if (selection) {
      setSelectedBuilding(null);
      setSelectedRoad(null);
    }
  }, []);
  const handleRoadSelect = useCallback((selection: RoadSelection | null) => {
    setSelectedRoad(selection);
    if (selection) {
      setSelectedBuilding(null);
      setSelectedFacility(null);
    }
  }, []);

  return (
    <main className="app-shell">
      <CesiumViewport
        dataset={MAIZURU_PLATEAU_BUILDINGS}
        onStatusChange={setStatus}
        onBuildingSelect={handleBuildingSelect}
        onFacilitySelect={handleFacilitySelect}
        onRoadSelect={handleRoadSelect}
        onRoadStatsChange={setRoadStats}
        onUrbanFunctionImpactChange={setUrbanFunctionImpact}
        facilityVisibility={facilityVisibility}
        focusedFacilityCategory={focusedFacilityCategory}
        groundElevationVisible={groundElevationVisible}
        inundationVisible={inundationVisible}
        tideLevelMeters={tideLevelMeters}
        inundationMethod={inundationMethod}
        onGroundElevationStateChange={setGroundElevationState}
      />
      <section className="overlay top-left" aria-label="PLATEAU data source">
        <div className="top-left-stack">
          <DataBadge dataset={MAIZURU_PLATEAU_BUILDINGS} />
          <UrbanFunctionsControl
            visibility={facilityVisibility}
            summaries={urbanFunctionImpact.summaries}
            focusedCategory={focusedFacilityCategory}
            onChange={setFacilityVisibility}
            onFocusChange={setFocusedFacilityCategory}
          />
        </div>
      </section>
      <section className="overlay top-right" aria-label="Viewer status">
        <StatusOverlay status={status} />
      </section>
      <section className="overlay bottom-left" aria-label="Selected feature">
        {selectedFacility
          ? <SelectedFacilityPanel selection={selectedFacility} />
          : selectedRoad
            ? <SelectedRoadPanel selection={selectedRoad} />
            : <SelectedBuildingPanel selection={selectedBuilding} />}
      </section>
      <section className="overlay bottom-right layer-controls" aria-label="Elevation and inundation controls">
        <GroundElevationControl
          enabled={groundElevationVisible}
          loading={groundElevationState.loading}
          error={groundElevationState.error}
          onChange={setGroundElevationVisible}
        />
        <InundationControl
          enabled={inundationVisible}
          tideLevelMeters={tideLevelMeters}
          loading={groundElevationState.loading}
          error={groundElevationState.error}
          method={inundationMethod}
          onEnabledChange={setInundationVisible}
          onMethodChange={(method) => {
            setInundationMethod(method);
            setSelectedBuilding((selection) => selection ? updateSelectionInundation(
              selection,
              tideLevelMeters,
              method
            ) : null);
            setSelectedFacility((selection) => selection ? updateFacilityInundation(selection, tideLevelMeters, method) : null);
            setSelectedRoad((selection) => selection ? updateRoadInundation(selection, tideLevelMeters, method) : null);
          }}
          onTideLevelChange={(meters) => {
            setTideLevelMeters(meters);
            setSelectedBuilding((selection) => selection
              ? updateSelectionInundation(selection, meters, inundationMethod)
              : null);
            setSelectedFacility((selection) => selection ? updateFacilityInundation(selection, meters, inundationMethod) : null);
            setSelectedRoad((selection) => selection ? updateRoadInundation(selection, meters, inundationMethod) : null);
          }}
        />
      </section>
    </main>
  );
}

function updateRoadInundation(
  selection: RoadSelection,
  tideLevelMeters: number,
  method: InundationMethod
): RoadSelection {
  return {
    road: selection.road,
    metrics: computeRoadImpactMetrics(selection.road, tideLevelMeters, method)
  };
}

function updateFacilityInundation(
  selection: FacilitySelection,
  tideLevelMeters: number,
  method: InundationMethod
): FacilitySelection {
  const threshold = selection.connectionThresholdMeters;
  const connectedToSea = threshold === null ? null : threshold <= tideLevelMeters;
  const depthMeters = selection.groundElevationMeters === null
    ? null
    : method === "sea-connected" && connectedToSea !== true
      ? 0
      : Math.max(0, tideLevelMeters - selection.groundElevationMeters);
  return {
    ...selection,
    tideLevelMeters,
    method,
    connectedToSea,
    depthMeters,
    status: depthMeters === null ? null : depthMeters === 0 ? "Safe" : depthMeters < 0.5 ? "Shallow" : depthMeters < 1 ? "Significant" : "Deep"
  };
}

function updateSelectionInundation(
  selection: BuildingSelection,
  tideLevelMeters: number,
  method: InundationMethod
): BuildingSelection {
  const ground = selection.inundation.groundElevationMeters;
  const threshold = selection.inundation.connectionThresholdMeters;
  const connectedToSea = threshold === null ? null : threshold <= tideLevelMeters;
  const depthMeters = ground === null
    ? null
    : method === "sea-connected" && connectedToSea !== true
      ? 0
      : Math.max(0, tideLevelMeters - ground);
  return {
    ...selection,
    inundation: {
      ...selection.inundation,
      tideLevelMeters,
      method,
      connectedToSea,
      depthMeters,
      status: depthMeters === null
        ? null
        : depthMeters === 0
          ? "Safe"
          : depthMeters < 0.5
            ? "Shallow impact"
            : "Significant impact"
    }
  };
}
