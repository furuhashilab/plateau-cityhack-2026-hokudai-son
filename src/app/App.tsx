import { useState } from "react";
import { CesiumViewport } from "../components/CesiumViewport";
import { DataBadge } from "../components/DataBadge";
import { SelectedBuildingPanel } from "../components/SelectedBuildingPanel";
import { StatusOverlay } from "../components/StatusOverlay";
import { GroundElevationControl } from "../components/GroundElevationControl";
import { InundationControl } from "../components/InundationControl";
import { DEFAULT_INUNDATION_METHOD, TIDE_LEVEL, type InundationMethod } from "../data/inundation";
import { MAIZURU_PLATEAU_BUILDINGS } from "../data/maizuruPlateau";
import type { BuildingSelection, ViewerStatus } from "../types/plateau";
import { DEFAULT_FACILITY_VISIBILITY } from "../data/facilities";
import type { FacilitySelection } from "../types/facility";
import { UrbanFunctionsControl } from "../components/UrbanFunctionsControl";
import { SelectedFacilityPanel } from "../components/SelectedFacilityPanel";

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
  const [facilityVisibility, setFacilityVisibility] = useState(DEFAULT_FACILITY_VISIBILITY);
  const [groundElevationVisible, setGroundElevationVisible] = useState(false);
  const [inundationVisible, setInundationVisible] = useState(true);
  const [tideLevelMeters, setTideLevelMeters] = useState<number>(TIDE_LEVEL.initialMeters);
  const [inundationMethod, setInundationMethod] = useState<InundationMethod>(DEFAULT_INUNDATION_METHOD);
  const [groundElevationState, setGroundElevationState] = useState<{ loading: boolean; error: string | null }>({
    loading: true,
    error: null
  });

  return (
    <main className="app-shell">
      <CesiumViewport
        dataset={MAIZURU_PLATEAU_BUILDINGS}
        onStatusChange={setStatus}
        onBuildingSelect={setSelectedBuilding}
        onFacilitySelect={setSelectedFacility}
        facilityVisibility={facilityVisibility}
        groundElevationVisible={groundElevationVisible}
        inundationVisible={inundationVisible}
        tideLevelMeters={tideLevelMeters}
        inundationMethod={inundationMethod}
        onGroundElevationStateChange={setGroundElevationState}
      />
      <section className="overlay top-left" aria-label="PLATEAU data source">
        <div className="top-left-stack">
          <DataBadge dataset={MAIZURU_PLATEAU_BUILDINGS} />
          <UrbanFunctionsControl visibility={facilityVisibility} onChange={setFacilityVisibility} />
        </div>
      </section>
      <section className="overlay top-right" aria-label="Viewer status">
        <StatusOverlay status={status} />
      </section>
      <section className="overlay bottom-left" aria-label="Selected building">
        {selectedFacility ? <SelectedFacilityPanel selection={selectedFacility} /> : <SelectedBuildingPanel selection={selectedBuilding} />}
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
          }}
          onTideLevelChange={(meters) => {
            setTideLevelMeters(meters);
            setSelectedBuilding((selection) => selection
              ? updateSelectionInundation(selection, meters, inundationMethod)
              : null);
            setSelectedFacility((selection) => selection ? updateFacilityInundation(selection, meters, inundationMethod) : null);
          }}
        />
      </section>
    </main>
  );
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
