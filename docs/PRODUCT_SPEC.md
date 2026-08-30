# Product Spec

## Problem

Maizuru has a constrained urban area between the sea and mountains. Future storm surge risk may further reduce usable land and weaken access to key urban functions.

The product must help non-specialists understand where low-lying areas are, how a simple storm-surge condition can affect city functions, and where future facilities could be placed to keep the city working.

This is not a high-precision hydrodynamic simulator. The MVP uses a simple inundation model:

```text
inundation depth = max(0, tide level - ground elevation)
```

The UI must clearly label this as a simplified model and must not present scenario values as confirmed predictions.

## Target Users

- General residents
- Children and students
- Municipal staff without urban planning or GIS expertise

The app should be understandable within a few minutes of interaction.

## Product Concept

A lightweight browser-based 3D city simulator for Maizuru where users can:

- inspect the current city structure through CesiumJS and PLATEAU 3D Tiles
- reveal low-elevation areas
- change tide level or scenario settings
- see how medical, evacuation, transport, and daily-life functions degrade
- select a function score and see the related city network glow in 3D
- place future facilities and compare before/after city resilience

The central experience is:

```text
storm surge risk -> city function degradation -> future facility placement -> visible improvement
```

## Core User Journey

1. View Current Maizuru
   - Show terrain, buildings, roads, and key facilities in a 3D scene.
   - Keep the first view simple and readable.

2. Understand Low Ground
   - Provide a ground-elevation display mode.
   - Use an intuitive low-to-high color gradient.
   - Let users understand vulnerable lowlands before enabling tide changes.

3. Change Tide Level
   - Let users adjust an arbitrary tide level or choose clearly labeled scenarios.
   - Calculate simplified inundation depth from tide level and ground elevation.
   - Display explanatory copy such as "simple inundation model" and "tide level - ground elevation".

4. See Urban Function Impact
   - Show function scores, not only flooded building counts.
   - MVP score categories:
     - Medical
     - Evacuation
     - Transport
     - Daily life
   - Allow a total score, but keep category breakdown visible.

5. Inspect Network Loss
   - When a score category is selected, show only the related facility and route network.
   - Use glowing lines or lightweight highlighted edges.
   - Change color, opacity, pulse strength, or visibility when facilities or routes are affected.
   - Use the network as an explanation for why a score changed.

6. Place Future Facilities
   - Let users place new candidate facilities on the 3D map.
   - MVP facility types:
     - Hospital or clinic
     - Evacuation shelter
     - Daily-life facility such as supermarket
     - Disaster or power hub
   - Treat these as future scenario data, not existing real facilities.

7. Compare Before and After
   - Show score changes such as `63 -> 86`.
   - Reconnect or brighten relevant network lines when a placement improves access.

## Functional Requirements

- 3D scene for Maizuru city context, using CesiumJS as the primary renderer.
- Layer or mode switching for normal view, ground elevation, inundation, and selected function network.
- Tide level control with arbitrary values and scenario labels.
- Simplified inundation calculation from ground elevation.
- Function score calculation with category breakdown.
- Selectable score categories that drive network visualization.
- Facility placement interaction by click-to-place or another stable method.
- Candidate-site evaluation with at least simplified indicators:
  - storm surge safety
  - residential access
  - road access
  - relationship to related facilities
- Before/after score display after placement.
- Clear data provenance display for real, externally acquired, and virtual/scenario data.

## Non-Functional Requirements

- Runs as a lightweight web app on ordinary laptop browsers.
- Avoid unlimited independent meshes and expensive materials.
- Keep draw calls, object counts, line counts, and memory use bounded.
- Defer or simplify non-selected network edges.
- Cap device pixel ratio when needed.
- Avoid unnecessary dependencies and large assets.
- Keep implementation reproducible.
- Do not embed API keys or secrets.
- Do not present simulated or inferred values as official PLATEAU data.

## MVP

- Single Maizuru-focused 3D scene.
- PLATEAU 3D Tiles for building visualization where available.
- Lightweight terrain/building/road representation, using web-friendly preprocessed assets.
- Elevation color mode.
- Tide slider with simple inundation overlay.
- Four function score cards.
- One selected network layer at a time.
- Click-to-place future facility candidates.
- Simplified candidate evaluation.
- Before/after score comparison.
- Data classification legend.

## Nice-To-Have

- Multiple named stress-test scenarios.
- More facility types.
- Better routing or accessibility calculations.
- Time-based animation of tide rise.
- Exportable scenario snapshot.
- Guided tutorial mode for children and first-time users.
- LOD, 3D Tiles, and tile streaming for larger PLATEAU datasets.
- Accessibility improvements such as color-blind safe palettes and narration.

## Out Of Scope

- Full hydrodynamic storm surge simulation.
- Confirmed future sea-level or storm-surge prediction values without sourced evidence.
- Real-time emergency operation support.
- Official disaster-risk certification.
- Editing existing real facilities as if they can be freely moved.
- Production infrastructure deployment without explicit approval.
- Large dependency or architecture changes before technical review.

## Data Classification

### A. Real Data

Examples:

- PLATEAU 3D city model
- Public DEM or elevation data
- Public road data

Real data must preserve source and license notes where practical.

### B. Externally Acquired Data

Examples:

- Medical facilities
- Evacuation shelters
- Shops and daily-life facilities
- Public facilities

These sources must be documented separately from PLATEAU. Unverified freshness or completeness must be disclosed.

### C. Virtual / Scenario Data

Examples:

- Future facility candidates
- New hospital or shelter scenarios
- Virtual infrastructure
- Simplified scoring weights

Scenario data must be labeled as virtual and must not be displayed as real data.

## Success Criteria

- A first-time user can explain that low ground plus higher tide level can reduce city functions.
- A user can select a function score and visually understand which connections are weakened.
- A user can place a future facility and see a clear before/after improvement or tradeoff.
- The app remains interactive on an ordinary laptop browser during demo operation.
- The UI clearly separates real data, external data, and virtual/scenario data.
- The app does not make unsupported claims about official PLATEAU attributes or future predictions.
