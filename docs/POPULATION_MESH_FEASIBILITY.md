# Population Mesh Feasibility Check

## Decision

Status: NOT ADOPTED for the current MVP.

Population mesh remains a good later metric, but it is not included in the
current presentation build. Stage 2 already has two grounded location metrics:

- ground elevation minus the user-selected tide level
- straight-line distance to the existing transport facility category
- 800 m nearby existing facility count as an additional context metric

## Candidate Source

Candidate dataset:

- e-Stat / Statistics Bureau census regional mesh statistics
- 2020 Census population and household mesh tables
- 500 m mesh or 250 m mesh, depending on preprocessing cost

The e-Stat download help lists regional mesh statistics for the 2020 Census,
including population and household tables for 1 km, 500 m, and 250 m mesh units.
The e-Stat API documentation and data pages indicate that API use requires an
application ID.

## Required Architecture

Do not call e-Stat from the browser at runtime.

Acceptable architecture for a later phase:

1. Download the relevant official mesh table outside the browser.
2. Filter to the Maizuru AOI only.
3. Convert mesh codes to center points or small polygons.
4. Keep the output as a small project-local JSON or GeoJSON file.
5. In the browser, sum population for mesh centers within 800 m of a proposed
   facility.

## Adoption Requirements

Adopt only when all are satisfied:

- the source table, year, mesh size, and population field are documented
- the license and attribution wording are documented
- the frontend payload is limited to Maizuru AOI records
- the aggregation method is documented, for example center point within 800 m
- the UI wording says "nearby residents" and does not claim actual service use
- build and browser performance remain acceptable

## Current Reason For Not Adopting

The current MVP needs to prioritize the completed flow:

```text
question -> action -> comparison -> conversation
```

Adding population now would require data acquisition, preprocessing, field
verification, and source documentation that are larger than the remaining MVP
budget. The app therefore avoids an unverified population claim and uses only
the already documented facility and DEM data for the presentation build.
