# PLATEAU CityHack Challenge 2026

A team project for **PLATEAU CityHack Challenge 2026**, held from
**August 22 to September 5, 2026**.

## Team

A three-person team from the **Furuhashi Lab Drone Club**.

| Role | Name |
| --- | --- |
| Team Leader | Rito |
| Member | Aki |
| Member | Tomoya |

---

## Project Overview

This project explores how **3D city models can help people understand
urban resilience and make better decisions about the future of their city**.

Our current prototype focuses on **Maizuru City, Kyoto Prefecture**.

Maizuru has limited usable urban land between the sea and surrounding
mountains, and coastal lowlands may be affected by storm surge and flooding.

Rather than building only a flood visualization tool, we are exploring:

> **How should important urban functions be placed so that the city can
> continue to function under future coastal flood risk?**

---

## Current Prototype

The application combines:

- **Project PLATEAU 3D city models**
- **GSI DEM5A elevation data**
- Ground elevation visualization
- User-defined tide level scenarios
- Simplified inundation potential
- Sea-connected inundation analysis
- Existing urban facilities
- Facility-level flood impact visualization

Users can explore Maizuru in 3D, raise the assumed tide level, and observe
how low-lying areas, buildings, and urban facilities may be affected.

---

## Urban Functions

The current prototype includes real facilities in four categories:

- Medical
- Evacuation
- Transport
- Daily Life

Facility information can be inspected together with:

- Ground elevation
- Scenario tide level
- Potential inundation depth
- Sea connectivity
- Current impact status
- Data provenance

---

## Inundation Model

This application does **not** provide an official flood forecast or a
full hydrodynamic simulation.

The simplified model currently supports two approaches.

### Elevation-only

Highlights all ground below the selected tide level.

### Sea-connected

Highlights low-lying ground only when it is topographically connected
to the sea at the selected tide level.

The sea-connected model uses a precomputed connectivity threshold based
on a 4-neighbor priority-flood approach over the DEM grid.

The model does not currently account for:

- Drainage networks
- Culverts
- Pumps
- Flap gates
- Waves
- Flow velocity
- Levee failure
- Time-dependent flood propagation

These limitations are intentionally exposed rather than presented as
high-fidelity flood prediction.

---

## Technology

- Vite
- React
- TypeScript
- CesiumJS
- Project PLATEAU 3D Tiles
- GSI DEM5A

A separate technical spike is also being conducted with **Navara** to
evaluate its suitability for future interactive 3D visualization.

CesiumJS remains the main implementation for the CityHack prototype.

---

## Current Development Status

### Completed

- [x] PLATEAU 3D building visualization
- [x] Building picking and attributes
- [x] Ground elevation visualization
- [x] Tide-level scenario control
- [x] Simplified inundation visualization
- [x] Sea-connected inundation model
- [x] Building impact visualization
- [x] Urban facility dataset integration
- [x] Facility category filtering
- [x] Facility impact inspection

### Next

- [ ] Link facilities to PLATEAU buildings
- [ ] Evaluate urban-function impacts
- [ ] Visualize relationships between urban functions
- [ ] Add future facility placement scenarios
- [ ] Compare current and future urban resilience

---

## Data Sources

The prototype currently uses data including:

- **Project PLATEAU** — Maizuru City 3D city models
- **Geospatial Information Authority of Japan (GSI)** — DEM5A elevation data
- Publicly available facility datasets and manually verified open data
- **PLATEAU-Terrain** — visual terrain alignment for Cesium

Detailed facility data provenance and limitations are documented in:

`docs/FACILITY_DATA_MANIFEST.md`

The presentation demo scenario and data classification notes are documented in:

`docs/DEMO_SCENARIO.md`

Population mesh feasibility is documented in:

`docs/POPULATION_MESH_FEASIBILITY.md`

---

## Project Direction

The final experience aims to move beyond:

> “Where will flooding occur?”

toward:

> **“If usable urban land decreases, how should Maizuru reorganize its
> important urban functions?”**

The long-term interaction concept is:

```text
Explore the current city
        ↓
Raise the tide level
        ↓
Observe affected urban functions
        ↓
Understand lost connections
        ↓
Place future facilities
        ↓
Compare urban resilience before and after
