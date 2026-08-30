# PLATEAU CityHack Challenge 2026 — Agent Instructions

> Project-specific instructions for coding agents operating in:
>
> `/Users/Rito/Plateau_cityhack_challenge2026`

Before doing any work, also read:

`/Users/Rito/RESEARCH_MAC_OPERATING_RULES.md`

The Research Mac rules are mandatory and take precedence for machine/environment safety.

## 1. Workspace

Primary workspace:

`/Users/Rito/Plateau_cityhack_challenge2026`

Do not modify files outside this project unless explicitly approved.

Before editing:

```bash
pwd
git branch --show-current
git status
git diff --stat
```

Preserve all existing uncommitted and untracked work.

## 2. Git Safety

Do not:

- `git reset --hard`
- `git clean -fd`
- force push
- discard another person's work
- push unless explicitly requested

Avoid unrelated changes.

If the repository uses team branches/PRs, preserve the existing branch workflow.

## 3. Environment

Do not modify system runtimes or system packages.

Do not use:

- `sudo`
- `brew`
- global `pip install`
- `npm install -g`
- system-wide runtime upgrades

### Python

If Python is required:

- check for an existing project virtual environment first
- otherwise create/use a project-local `.venv`
- do not modify system Python

### Node.js

Use the existing user-managed Node/NVM environment.

Do not upgrade Node unless explicitly approved.

If a required dependency is missing, explain it before installing anything.

## 4. Project Scope

This repository is for PLATEAU CityHack Challenge 2026.

Prioritize:

- a working demo
- browser performance
- clear user interaction
- meaningful use of PLATEAU / 3D city data
- reproducible implementation
- minimal unnecessary complexity

Do not introduce unrelated features or large refactors without approval.

## 5. 3D / Browser Performance

This project may perform browser-based 3D rendering and simulation.

Performance-sensitive work should consider:

- object count
- draw calls
- LOD
- zoom/distance-based visibility
- culling
- physics workload
- Cesium/WebGL rendering cost
- memory usage
- lower-spec presentation machines

Do not assume the research Mac's GPU performance matches presentation hardware.

When changing rendering or simulation logic:

1. Inspect the current implementation.
2. Identify the likely bottleneck.
3. Make the smallest measurable change.
4. Compare before/after performance where practical.

Avoid rendering or simulating every object at full fidelity when distance/zoom/LOD can safely reduce workload.

## 6. PLATEAU / External Data

Keep a clear separation between:

- official PLATEAU data
- external open data
- manually added data
- simulated data
- inferred data

Do not present simulated or inferred data as an official PLATEAU attribute.

Do not silently change data provenance assumptions.

If adding external data, record its source/license where appropriate.

## 7. Assets / Licensing

Do not copy identifiable proprietary 3D assets, specific products, copyrighted textures, or restricted source material without permission.

For generated/custom assets:

- prefer generic urban assets
- avoid reproducing a specific commercial product or real-world proprietary asset
- preserve attribution/license requirements for external assets
- report licensing uncertainty before use

Do not silently download or add web assets.

## 8. Read Before Write

Before editing:

1. Read the relevant project documentation.
2. Inspect only the necessary source files.
3. Summarize the current implementation.
4. Identify the minimum files requiring change.
5. State the proposed change.
6. Proceed only within the approved scope.

Do not perform broad repository exploration without a clear reason.

## 9. Dependency Policy

Do not automatically install or upgrade dependencies.

Warnings that a package is outdated do not grant permission to upgrade it.

If a dependency is genuinely required:

1. Explain why.
2. State the exact dependency/version strategy.
3. State which files will change.
4. Confirm it is project-local.
5. Wait for approval if it materially changes the environment.

## 10. Testing / Verification

After implementation, run the smallest relevant verification first.

Depending on the stack, verify:

- build succeeds
- lint/typecheck succeeds
- relevant tests pass
- browser app starts
- 3D scene renders
- no obvious console errors
- no major performance regression

Do not fix unrelated warnings by upgrading dependencies.

## 11. Destructive / Infrastructure Boundaries

Do not:

- delete large portions of the repo
- rewrite Git history
- deploy production infrastructure
- enable billing
- modify SSH/Tailscale
- modify machine-level configuration

without explicit approval.

## 12. STOP Conditions

STOP and ask before:

- system-wide installation
- `sudo` / `brew`
- modifying files outside `/Users/Rito`
- modifying SSH/Tailscale
- paid infrastructure
- production deployment
- destructive deletion
- major dependency upgrades
- uncertain licensing
- architecture changes outside the requested task
- conflicts between this file and `/Users/Rito/RESEARCH_MAC_OPERATING_RULES.md`

## 13. AI Handoff Rules

At the start of every session, read in order:

1. `docs/CURRENT_DECISIONS.md` — stable project decisions
2. `docs/AI_HANDOFF.md` — current work state (if it exists)

Verify that `AI_HANDOFF.md` matches the actual source files before proceeding.

At the end of every session, update `docs/AI_HANDOFF.md` to reflect the current state before stopping. Use the template defined in the handoff file itself. Do not stop work without updating the handoff.

If usage limit is approaching:
- At ~20% remaining: finish current checkpoint, then update handoff. Do not start new work.
- At ~10% remaining: only update handoff and run typecheck/build. No new debugging.

## 14. Codex Startup Routine

When using Codex from the research Mac, begin by reading:

1. `/Users/Rito/RESEARCH_MAC_OPERATING_RULES.md`
2. `/Users/Rito/Plateau_cityhack_challenge2026/AGENTS.md`

Then perform a read-only pre-flight:

```bash
pwd
git branch --show-current
git status
git diff --stat
```

Do not modify anything until the current workspace state and task scope have been summarized.
