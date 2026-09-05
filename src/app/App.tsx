import { useCallback, useEffect, useState } from "react";
import { CesiumViewport } from "../components/CesiumViewport";
import { DataBadge } from "../components/DataBadge";
import { IntroOverlay } from "../components/IntroOverlay";
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
import { SelectedFutureFacilityPanel } from "../components/SelectedFutureFacilityPanel";
import {
  ProblemPromptCard,
  type ProblemPrompt
} from "../components/ProblemPromptCard";
import { FutureFacilityComparison } from "../components/FutureFacilityComparison";
import { computeRoadImpactMetrics } from "../data/roads";
import type { RoadSelection } from "../types/road";
import type { RoadLayerStats } from "../cesium/roadLayer";
import {
  computeUrbanFunctionImpactState,
  type UrbanFunctionImpactState
} from "../data/urbanFunctions";
import type { FutureFacilityScenario } from "../types/futureFacility";
import { facilityCategoryLabel } from "../data/facilityLabels";
import {
  comparisonKeyForLocation,
  upsertComparisonScenario,
  type ComparisonScenario
} from "../data/locationEvaluation";

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
  const [futureFacilitySelected, setFutureFacilitySelected] = useState(false);
  const [, setRoadStats] = useState<RoadLayerStats | null>(null);
  const [facilityVisibility, setFacilityVisibility] = useState(DEFAULT_FACILITY_VISIBILITY);
  const [focusedFacilityCategory, setFocusedFacilityCategory] = useState<FacilityCategory | null>(null);
  const [placementCategory, setPlacementCategory] = useState<FacilityCategory | null>(null);
  const [futureFacility, setFutureFacility] = useState<FutureFacilityScenario | null>(null);
  const [comparisonScenarios, setComparisonScenarios] = useState<ComparisonScenario[]>([]);
  const [urbanFunctionImpact, setUrbanFunctionImpact] = useState<UrbanFunctionImpactState>(
    computeUrbanFunctionImpactState(WEST_MAIZURU_FACILITIES, null, null, TIDE_LEVEL.initialMeters, DEFAULT_INUNDATION_METHOD)
  );
  const [introDismissed, setIntroDismissed] = useState(false);
  const [activeProblemPrompt, setActiveProblemPrompt] = useState<ProblemPrompt | null>(null);
  const [dismissedProblemCategories, setDismissedProblemCategories] = useState<Set<FacilityCategory>>(() => new Set());
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
      setFutureFacilitySelected(false);
    }
  }, []);
  const handleFacilitySelect = useCallback((selection: FacilitySelection | null) => {
    setSelectedFacility(selection);
    if (selection) {
      setSelectedBuilding(null);
      setSelectedRoad(null);
      setFutureFacilitySelected(false);
    }
  }, []);
  const handleRoadSelect = useCallback((selection: RoadSelection | null) => {
    setSelectedRoad(selection);
    if (selection) {
      setSelectedBuilding(null);
      setSelectedFacility(null);
      setFutureFacilitySelected(false);
    }
  }, []);
  const handleFutureFacilityChange = useCallback((facility: FutureFacilityScenario | null) => {
    setFutureFacility(facility);
    if (facility) {
      setComparisonScenarios((scenarios) => upsertComparisonScenario(scenarios, {
        key: comparisonKeyForLocation(facility.category, facility.longitude, facility.latitude),
        category: facility.category,
        longitude: facility.longitude,
        latitude: facility.latitude,
        impact: facility.impact,
        evaluation: facility.evaluation
      }));
    }
    if (facility) {
      setPlacementCategory(null);
    } else {
      setFutureFacilitySelected(false);
    }
  }, []);
  const handleFutureFacilitySelect = useCallback((facility: FutureFacilityScenario | null) => {
    setFutureFacilitySelected(facility !== null);
    if (facility) {
      setSelectedBuilding(null);
      setSelectedFacility(null);
      setSelectedRoad(null);
    }
  }, []);
  const handleBeginPlacement = useCallback((category: FacilityCategory) => {
    setFocusedFacilityCategory(category);
    setPlacementCategory(category);
    setActiveProblemPrompt(null);
    setSelectedBuilding(null);
    setSelectedFacility(null);
    setSelectedRoad(null);
    setFutureFacilitySelected(false);
  }, []);
  const handleReplaceFutureFacility = useCallback(() => {
    if (!futureFacility) return;
    setFocusedFacilityCategory(futureFacility.category);
    setPlacementCategory(futureFacility.category);
    setActiveProblemPrompt(null);
    setSelectedBuilding(null);
    setSelectedFacility(null);
    setSelectedRoad(null);
    setFutureFacilitySelected(true);
  }, [futureFacility]);
  const handleRemoveFutureFacility = useCallback(() => {
    if (!futureFacility) return;
    const key = comparisonKeyForLocation(futureFacility.category, futureFacility.longitude, futureFacility.latitude);
    setFutureFacility(null);
    setFutureFacilitySelected(false);
    setPlacementCategory(null);
    setComparisonScenarios((scenarios) => scenarios.filter((scenario) => scenario.key !== key));
  }, [futureFacility]);
  const handleResetComparisonScenarios = useCallback(() => {
    setFutureFacility(null);
    setFutureFacilitySelected(false);
    setPlacementCategory(null);
    setComparisonScenarios([]);
  }, []);
  const handleDismissProblemPrompt = useCallback(() => {
    // Dismiss all currently-affected categories so the prompt doesn't cascade
    setDismissedProblemCategories((prev) => {
      const next = new Set(prev);
      for (const s of urbanFunctionImpact.summaries) {
        if (s.affectedCount > 0) next.add(s.category);
      }
      return next;
    });
    setActiveProblemPrompt(null);
  }, [urbanFunctionImpact.summaries]);
  const handleProblemPromptPlacement = useCallback((category: FacilityCategory) => {
    setDismissedProblemCategories((prev) => {
      const next = new Set(prev);
      for (const s of urbanFunctionImpact.summaries) {
        if (s.affectedCount > 0) next.add(s.category);
      }
      return next;
    });
    setActiveProblemPrompt(null);
    handleBeginPlacement(category);
  }, [handleBeginPlacement, urbanFunctionImpact.summaries]);

  // Keep active prompt data up-to-date as water level changes
  useEffect(() => {
    setActiveProblemPrompt((current) => {
      if (!current) return null;
      const updated = urbanFunctionImpact.summaries.find((s) => s.category === current.category);
      if (!updated) return current;
      if (updated.affectedCount === current.affectedCount &&
          updated.populationImpact.affectedPopulation === current.affectedPopulation) return current;
      return {
        category: updated.category,
        affectedCount: updated.affectedCount,
        totalCount: updated.totalCount,
        affectedPopulation: updated.populationImpact.affectedPopulation
      };
    });
  }, [urbanFunctionImpact.summaries]);

  // Fire new prompt when a non-dismissed category becomes affected; un-dismiss safe categories
  useEffect(() => {
    // Un-dismiss categories that have recovered (affectedCount back to 0)
    setDismissedProblemCategories((prev) => {
      const recovered = new Set(
        urbanFunctionImpact.summaries.filter((s) => s.affectedCount === 0).map((s) => s.category)
      );
      const next = new Set([...prev].filter((c) => !recovered.has(c)));
      return next.size !== prev.size ? next : prev;
    });

    if (!introDismissed) return;

    // Only fire a new prompt when none is currently showing
    setActiveProblemPrompt((current) => {
      if (current) return current;
      const candidate = urbanFunctionImpact.summaries
        .filter((s) => s.affectedCount > 0 && !dismissedProblemCategories.has(s.category))
        .sort((a, b) => problemPriority(a.category) - problemPriority(b.category))[0];
      if (!candidate) return null;
      return {
        category: candidate.category,
        affectedCount: candidate.affectedCount,
        totalCount: candidate.totalCount,
        affectedPopulation: candidate.populationImpact.affectedPopulation
      };
    });
  }, [dismissedProblemCategories, introDismissed, urbanFunctionImpact.summaries]);

  return (
    <main className={`app-shell${placementCategory ? " placement-active" : ""}`}>
      <CesiumViewport
        dataset={MAIZURU_PLATEAU_BUILDINGS}
        onStatusChange={setStatus}
        onBuildingSelect={handleBuildingSelect}
        onFacilitySelect={handleFacilitySelect}
        onRoadSelect={handleRoadSelect}
        onRoadStatsChange={setRoadStats}
        onUrbanFunctionImpactChange={setUrbanFunctionImpact}
        onFutureFacilityChange={handleFutureFacilityChange}
        onFutureFacilitySelect={handleFutureFacilitySelect}
        facilityVisibility={facilityVisibility}
        focusedFacilityCategory={focusedFacilityCategory}
        placementCategory={placementCategory}
        futureFacility={futureFacility}
        groundElevationVisible={groundElevationVisible}
        inundationVisible={inundationVisible}
        tideLevelMeters={tideLevelMeters}
        inundationMethod={inundationMethod}
        onGroundElevationStateChange={setGroundElevationState}
      />
      {introDismissed ? (
        <>
          <section className="overlay top-left" aria-label="PLATEAU data source">
            <DataBadge dataset={MAIZURU_PLATEAU_BUILDINGS} />
          </section>
          <section className="overlay top-right" aria-label="Advanced details">
            <details className="panel advanced-panel">
              <summary className="section-summary">
                <span>詳しく見る</span>
                <strong>データ・地形・性能</strong>
              </summary>
              <GroundElevationControl
                enabled={groundElevationVisible}
                loading={groundElevationState.loading}
                error={groundElevationState.error}
                onChange={setGroundElevationVisible}
              />
              <StatusOverlay status={status} />
            </details>
          </section>
          <section className="overlay bottom-left" aria-label="Selected feature">
            {selectedFacility || selectedRoad || selectedBuilding || (futureFacilitySelected && futureFacility) ? (
              selectedFacility
              ? <SelectedFacilityPanel selection={selectedFacility} />
              : futureFacilitySelected && futureFacility
                ? <SelectedFutureFacilityPanel
                    facility={futureFacility}
                    onReplace={handleReplaceFutureFacility}
                    onRemove={handleRemoveFutureFacility}
                  />
                : selectedRoad
                ? <SelectedRoadPanel selection={selectedRoad} />
                : <SelectedBuildingPanel selection={selectedBuilding} />
            ) : null}
          </section>
          <section className="overlay bottom-center primary-controls" aria-label="Water controls">
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
          <section className="overlay right-middle" aria-label="Urban functions">
            <UrbanFunctionsControl
              visibility={facilityVisibility}
              summaries={urbanFunctionImpact.summaries}
              focusedCategory={focusedFacilityCategory}
              placementCategory={placementCategory}
              futureFacility={futureFacility}
              onChange={setFacilityVisibility}
              onFocusChange={setFocusedFacilityCategory}
              onBeginPlacement={handleBeginPlacement}
              onCancelPlacement={() => setPlacementCategory(null)}
              onRemoveFutureFacility={handleRemoveFutureFacility}
            />
          </section>
          <section className="overlay comparison-overlay" aria-label="Future facility comparison area">
            <FutureFacilityComparison
              scenarios={comparisonScenarios}
              onResetAll={handleResetComparisonScenarios}
            />
          </section>
          {activeProblemPrompt ? (
            <section className="overlay prompt-overlay" aria-label="Problem prompt">
              <ProblemPromptCard
                prompt={activeProblemPrompt}
                onStartPlacement={handleProblemPromptPlacement}
                onDismiss={handleDismissProblemPrompt}
              />
            </section>
          ) : null}
          {placementCategory ? (
            <div className="placement-guide">
              地図をクリックして未来の{placementLabel(placementCategory)}を置こう
            </div>
          ) : null}
        </>
      ) : null}
      {!introDismissed ? <IntroOverlay onStart={() => setIntroDismissed(true)} /> : null}
    </main>
  );
}

function placementLabel(category: FacilityCategory) {
  return facilityCategoryLabel(category).futureName;
}

function problemPriority(category: FacilityCategory) {
  return ({
    "daily-life": 0,
    medical: 1,
    evacuation: 2,
    transport: 3
  } satisfies Record<FacilityCategory, number>)[category];
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
