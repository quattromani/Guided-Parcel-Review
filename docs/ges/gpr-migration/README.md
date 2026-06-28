# Guided Parcel Review Migration

Status: permanent migration planning area  
Date: 2026-06-28  
Phase: Phase 03 - Application Architecture  
Task: 03.05 - Guided Parcel Review Migration Planning

This folder is the implementation blueprint for migrating Guided Parcel Review from a prototype teaching walkthrough into a native GES parcel-review application.

No code, content, data, routes, styles, or behavior are moved by these documents. They define ownership, sequencing, risk, and success criteria for future implementation tasks.

## Product Direction

Guided Parcel Review becomes the parcel-specific transaction layer of GES.

It should be:

- a personalized parcel workspace
- a taxpayer conversation aid
- a parcel-specific review tool
- a record-checking workflow
- a visual explanation aid
- a printable summary generator
- a PDF/report generator
- a QR-linked public parcel summary
- a bridge between taxpayer questions and assessor data

It should not remain a long-form education course. Education moves to GES Articles, Knowledge Platform objects, public tools, related resources, and legal/reference pages.

## Documentation Map

- `migration-plan.md`: master product and architecture plan.
- `component-inventory.md`: current GPR component inventory and future ownership.
- `content-migration.md`: instructional copy inventory and article handoff plan.
- `reporting-inventory.md`: PDF, printable, correction, conversation, assessor, board, and QR reporting responsibilities.
- `public-tool-inventory.md`: reusable utilities embedded in GPR that may become standalone public tools.
- `internal-workspace-inventory.md`: assessor-facing functionality that belongs behind an internal workspace boundary.
- `knowledge-inventory.md`: glossary, statute, standard, source, calendar, form, and procedure objects to create.
- `implementation-phases.md`: phases, dependency graph, risk analysis, technical debt, validation, and recommended first engineering task.

## Source Audit Scope

The inventories are based on the current static GPR implementation, including:

- `index.html`
- `src/app.js`
- `src/render.js`
- `src/config/taxpayer-journey.js`
- `data/app/site-copy.json`
- `src/content/route-resources.js`
- `src/routes/landing-primer.js`
- `src/reports/property-report.js`
- `src/reports/pdf-report-kit.js`
- `src/recordCorrectionRequest.js`
- `src/assessors-report.js`
- `src/review-flags.js`
- `src/data/review-signal-model.js`
- `src/metric-signals.js`
- `src/charts.js`
- `src/views/tax-district-authorities.js`
- `src/routes/tax-shorthand-experiment.js`
- `src/routes/comparison-experiment.js`
- `src/routes/comparable-candidate-review.js`

## Ownership Rule

Every GPR responsibility should eventually have one clear home:

| Responsibility | Future home |
| --- | --- |
| Parcel-specific review workflow | Guided Parcel Review |
| Teaching and civic explanation | GES Articles |
| Definitions, statutes, standards, citations, dates, forms, and source authority | Knowledge Platform |
| Reusable calculators and explainers | Public Tools |
| PDFs, printable packets, conversation records, QR reports, assessor reports, board reports | Reporting Engine |
| Cohort diagnostics, source inspection, advanced signals, meeting support | Internal Workspace |

## Migration Rule

Future implementation should extract and redirect before it removes.

1. Preserve current GPR behavior.
2. Create destination homes.
3. Add links or replacement surfaces.
4. Move responsibility.
5. Verify parity.
6. Remove obsolete prototype scaffolding only after human review.

