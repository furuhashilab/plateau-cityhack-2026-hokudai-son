# Implementation Plan

## Phase 0: Repository Intake

### Purpose

Make the real repository available and establish the technical baseline without changing implementation behavior.

### Implementation

- Clone or otherwise provide authenticated access to `furuhashilab/plateau-cityhack-2026-hokudai-son`.
- Run read-only checks:
  - `pwd`
  - `git branch --show-current`
  - `git status`
  - `git diff --stat`
- Inspect:
  - directory structure
  - `package.json` and lockfiles
  - framework and build tooling
  - 3D libraries
  - deployment configuration
  - data/assets size and provenance
  - existing technical modules that can be reused
- Ignore existing idea/concept documents as requirement sources.

### Completion Criteria

- Repository is available locally as a Git checkout.
- Current stack and deployment path are summarized.
- Reusable technical assets and conflicts are listed.

### Verification

- Read-only command outputs are recorded in the work summary.
- No files are modified in this phase unless explicitly requested.

### Dependency For Next Phase

Phase 1 depends on knowing the actual framework and build commands.

## Phase 1A: Real Maizuru PLATEAU Viewer PoC

### Purpose

Validate the first technical gate: real Maizuru PLATEAU building data can be displayed through CesiumJS and individual buildings can be selected for available attributes.

### Implementation

- Create a minimal Vite + React + TypeScript + CesiumJS app.
- Load official Maizuru City PLATEAU 2025 building 3D Tiles.
- Use a small initial AOI camera view such as West Maizuru or East Maizuru.
- Add only minimal overlays:
  - data/source label
  - loading/performance status
  - selected building attributes
- Implement Cesium feature picking.
- Do not implement tide, flood, scoring, network visualization, or facility placement.

### Completion Criteria

- App starts locally.
- Cesium initializes without an embedded token.
- Real Maizuru PLATEAU buildings render.
- Camera starts on the PoC AOI.
- User can click a building and see available PLATEAU attributes or `Unknown`.
- Basic performance metrics are visible.

### Verification

- Run typecheck/build.
- Start local browser app.
- Confirm camera interaction, building click, console status, and initial loading time.

### Dependency For Next Phase

Phase 1B depends on confirming the 3D Tiles source, picking behavior, and baseline viewer performance.

## Phase 1B: App Skeleton And Data Provenance UI

### Purpose

Create a stable app shell for the simulator without heavy data or advanced simulation.

### Implementation

- Preserve the existing framework if present.
- Add or adapt the main layout:
  - 3D viewport area
  - mode controls
  - tide/scenario panel placeholder
  - score panel placeholder
  - data provenance legend
- Define shared types for:
  - data provenance
  - facility
  - score category
  - scenario state
- Add small fixture data for development if no real data is already available, clearly labeled as scenario or placeholder.

### Completion Criteria

- App starts locally.
- UI clearly separates real, external, and scenario data.
- No simulated data is labeled as PLATEAU real data.

### Verification

- Run the smallest existing build/type/lint command.
- Start the local app and confirm the shell renders.

### Dependency For Next Phase

Phase 2 needs a stable viewport and state model.

## Phase 2: Lightweight 3D City Context

### Purpose

Show a readable 3D Maizuru context using existing or preprocessed technical assets.

### Implementation

- Add terrain layer.
- Add building layer.
- Add road layer.
- Add facility markers.
- Keep geometry and materials lightweight.
- Add camera defaults suitable for demo operation.

### Completion Criteria

- User can recognize a city structure in 3D.
- Layers can be toggled or restyled by mode state.
- Scene remains responsive on ordinary laptop settings.

### Verification

- Browser renders without obvious console errors.
- Basic interaction works.
- Record approximate FPS or interaction responsiveness where practical.

### Dependency For Next Phase

Phase 3 depends on terrain elevation sampling or a usable elevation grid.

## Phase 3: Elevation And Simple Inundation

### Purpose

Let users understand low ground and test arbitrary tide levels.

### Implementation

- Add ground-elevation display mode.
- Add tide level control.
- Implement:

```text
inundation depth = max(0, tide level - ground elevation)
```

- Add inundation overlay for terrain, buildings, roads, or sampled cells.
- Add visible UI wording: "simple inundation model" and "tide level - ground elevation".

### Completion Criteria

- Low-to-high ground is visually understandable.
- Raising tide level visibly increases affected areas.
- The model is not presented as a forecast.

### Verification

- Test several tide values.
- Confirm zero-depth areas remain unaffected.
- Confirm explanatory labels are visible.

### Dependency For Next Phase

Phase 4 needs affected/unaffected status for facilities and roads.

## Phase 4: Urban Function Scores

### Purpose

Move from physical flooding to city-function impact.

### Implementation

- Add scoring categories:
  - medical
  - evacuation
  - transport
  - daily life
- Implement deterministic MVP scoring heuristics.
- Show current score and reason summary per category.
- Recompute scores only when tide level or scenario placements change.

### Completion Criteria

- Score cards change as tide level changes.
- Users can see category breakdown.
- Each score has explainable reasons.

### Verification

- Check score values at low, medium, and high tide settings.
- Confirm no per-frame score recalculation is needed.

### Dependency For Next Phase

Phase 5 depends on score categories and affected relationship data.

## Phase 5: Network Visualization

### Purpose

Explain why function scores changed through selected glowing city networks.

### Implementation

- Add selected score category state.
- Generate network edges only for the selected category.
- Connect relevant facilities, residential areas, roads, and shelters.
- Encode affected links with color, opacity, pulse strength, or visibility.
- Cap edge count for performance.

### Completion Criteria

- Selecting "medical" or another category changes the highlighted network.
- Degraded connections are visually distinct.
- Network changes align with score reasons.

### Verification

- Switch categories repeatedly and confirm old geometries are disposed or reused safely.
- Confirm scene remains responsive with network enabled.

### Dependency For Next Phase

Phase 6 needs network and score systems to reflect new placements.

## Phase 6: Future Facility Placement

### Purpose

Let users test where future facilities should be placed.

### Implementation

- Add facility type selector.
- Add click-to-place interaction on terrain.
- Store placements as scenario data.
- Add remove or undo for placed facilities.
- Render placed facilities distinctly from real/external facilities.

### Completion Criteria

- User can place and remove future facilities.
- Scenario facilities affect scores.
- Provenance remains clear.

### Verification

- Place each MVP facility type.
- Confirm state updates and no real data is overwritten.

### Dependency For Next Phase

Phase 7 depends on placements being represented in scoring.

## Phase 7: Candidate Evaluation And Before/After

### Purpose

Make facility placement a planning tradeoff instead of "put everything on high ground".

### Implementation

- Add candidate evaluation metrics:
  - storm surge safety
  - residential access
  - road access
  - relationship to other facilities
- Show per-metric labels and a total score.
- Show before/after city function scores such as `63 -> 86`.
- Brighten or reconnect network lines when placement improves function.

### Completion Criteria

- Different placement locations produce different tradeoffs.
- Before/after scores are visible.
- Network feedback explains the improvement.

### Verification

- Compare at least two candidate locations.
- Confirm high ground with poor access does not always win.

### Dependency For Next Phase

Phase 8 depends on a complete MVP loop.

## Phase 8: Demo Hardening

### Purpose

Make the MVP reliable for presentation.

### Implementation

- Optimize draw calls, materials, and line rendering where measurements indicate bottlenecks.
- Add loading and error states.
- Tighten copy for non-specialist users.
- Validate data classification and source notes.
- Check responsive layout.

### Completion Criteria

- Core demo flow works end-to-end.
- App is understandable without GIS expertise.
- No unsupported prediction or data-provenance claims remain.

### Verification

- Build succeeds.
- Local browser smoke test passes.
- No obvious console errors.
- Demo flow can be completed repeatedly.

### Dependency For Next Phase

Later phases can add richer data, better routing, scenario export, or deployment only after MVP is stable.
