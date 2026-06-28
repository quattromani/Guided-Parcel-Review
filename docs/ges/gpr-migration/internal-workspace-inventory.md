# GPR Internal Workspace Inventory

Status: planning inventory  
Date: 2026-06-28

The Internal Workspace is the authenticated assessor home for operational tools. It should absorb GPR functionality that is useful to professionals but too diagnostic, sensitive, or workflow-specific for the public parcel review surface.

## Internal Candidates

| Feature | Current location | Current responsibility | Recommended destination | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Supplemental assessor report | `src/assessors-report.js` | Generates internal-style review report | Internal Workspace plus Reporting Engine | MOVE TO INTERNAL WORKSPACE | Strong seed for assessor report module. |
| Cost model evidence | `src/assessors-report.js`, `src/render.js` technical cost model helpers | Shows RCN, RCNLD, depreciation, adjustments, cost inputs | Parcel Dashboard | MOVE TO INTERNAL WORKSPACE | Public default view should not expose technical model as teaching content. |
| Data-quality scan | `src/assessors-report.js` | Flags missing or suspicious record fields | Parcel Dashboard | MOVE TO INTERNAL WORKSPACE | Public can see neutral field flags; advanced scan belongs internal. |
| Equalization alignment rows | `src/assessors-report.js`, `src/metric-signals.js` | Compares local and county metrics to standards | Assessment Diagnostics | MOVE TO INTERNAL WORKSPACE | Requires governance and standards binding. |
| Advanced review signal thresholds | `src/data/review-signal-model.js`, `src/metric-signals.js` | Threshold-based prompts | Internal diagnostics, with public subset after review | HUMAN REVIEW | Public wording must avoid official conclusions. |
| Valuation group diagnostics | `src/charts.js`, market data, valuation group records | Shows group statistics and sampled movement | Parcel Dashboard / Valuation Diagnostics | MOVE TO INTERNAL WORKSPACE | Public may receive compact, caveated context only. |
| Cohort filtering | Experiment/comparison route patterns | Finds and compares related records | Future SQL/React system | MOVE TO INTERNAL WORKSPACE | Needs data service, not static browser payload. |
| Comparable candidate review | `src/routes/comparable-candidate-review.js` | Scores comparable candidates and cautions | Parcel Dashboard / Board Prep | MOVE TO INTERNAL WORKSPACE | Must not become public evidence engine without review. |
| Comparison experiment | `src/routes/comparison-experiment.js` | Walks through subject/comparable table and equalization concept | Board Prep or training | MOVE TO INTERNAL WORKSPACE | Some teaching copy may become article material. |
| Source table modal | `src/render.js` | Opens raw source data tables | Source Provenance module | MOVE TO INTERNAL WORKSPACE | Public can see citations, not raw diagnostic tables by default. |
| Source extract details | `src/render.js` legacy helpers | Displays raw export/source sections | Source Provenance module | MOVE TO INTERNAL WORKSPACE | Also candidate for cleanup if unused. |
| Technical cost model helper | `src/render.js` | Builds cost-model rollups | Parcel Dashboard | MOVE TO INTERNAL WORKSPACE | Confirm whether active before moving. |
| Board/referee-style aids | Assessor report and experiment language | Supports official review posture | Board Preparation module | MOVE TO INTERNAL WORKSPACE | Requires procedure and report packet design. |
| BOE Protest Tracker references | Start page/internal nav references | Launches or mentions tracker | Workspace frequent tools | MOVE TO INTERNAL WORKSPACE | Public GPR should not promote internal tracker as default flow. |
| Field Kit notes | `src/ges/field-kit.js` | Owner-only notes | Workspace notes seed | MOVE TO INTERNAL WORKSPACE | Keep local-only until user profile service exists. |
| Project navigation destinations | `src/ges/project-nav.js` | Owner/internal route launcher | Workspace navigation seed | MOVE TO INTERNAL WORKSPACE | Should not be public app navigation. |

## Internal Module Mapping

| Future internal module | Candidate inputs from GPR |
| --- | --- |
| Parcel Dashboard | property context, record card, value history, tax history, photos/sketches |
| Assessment Diagnostics | metric signals, ratio statistics, local market stats, standards |
| Valuation Group Review | valuation group sample records, market position data, cohort charts |
| Source Provenance | source table modal, source registry, metric ledger, record-card source fields |
| Board Preparation | assessor report, comparable review, protest/correction packets |
| Reporting Queue | guided summary, correction packet, assessor report, future board report |
| Knowledge Search | statutes, standards, procedures, glossary, PAD source records |
| Calendar | assessment dates, BOE windows, protest periods, PAD deadlines |

## Internal Boundary Rules

- Public GPR may show facts, taxpayer flags, and neutral context.
- Internal Workspace may show diagnostic thresholds, source inspection, cost model details, working conclusions, and professional report preparation.
- Public reports must not expose internal notes, internal conclusions, or private workflow state.
- Internal reports must be generated only behind an internal permission boundary.
- Any shared component must receive an explicit audience mode.

## Human Review Items

- Whether review signals can ever be public beyond neutral prompts.
- Whether valuation group context can be public without creating implied appeal advice.
- Which source/provenance details are public records and which are internal workflow aids.
- Whether comparable scoring should be used in board preparation, training, or not at all.
- Which report conclusions can be generated automatically and which require assessor-authored text.

