# Property Snapshot

A static taxpayer-facing prototype for reviewing a property record, assessment movement, value detail, equalization, tax context, review signals, and official reference resources in a guided plain-English flow.

The current branch, `codex/civic-orientation-refactor`, treats the app as a civic orientation tool rather than a generic data dashboard. The goal is to help someone understand what record was used, what changed, how value connects to taxes, and whether anything deserves closer review without requiring assessment-ratio expertise.

## Experience Model

The active guided path is defined in `src/config/taxpayer-journey.js`:

1. Start
2. Property Record
3. What Changed
4. Value Detail
5. Equalization
6. Tax Context
7. Review Signals
8. Summary

The main path is deliberately sequential. It starts with the property identity and source record, then introduces value movement, local market context, equalization as the fairness layer, tax context, neutral review signals, and a summary. Official forms live as outbound footer references so filing materials do not become the product's endpoint.

## Design Principles

- Keep the language neutral: use "this property" or "the property" rather than implying ownership.
- Lead with human-readable record facts before technical statistics.
- Use calm civic visual language: light surfaces, restrained slate/blue color, soft status treatment, and no gamified scoring.
- Let key numbers resolve the page, but avoid making every number feel equally important.
- Keep tables consistent: slate headers establish context, softer gray totals resolve the table, and internal cells stay quiet.
- Prefer scannable rows and disclosure sections over large explanatory text blocks.
- Use technical terms only when the surrounding visual or copy gives enough context.

## Data Architecture

The active property is configured in `data/app/property-manifest.json`.

The prototype now uses one loaded property source:

- `data/property-records/mips/residential-010496000-record-card.json`

That file contains the MIPS-derived property record facts and the guided snapshot context that was previously split across lighter sample-property data. The older `data/properties/residential-property-data.json` path has been removed so the app does not compete between two property-record sources.

Shared datasets remain separate from the property record:

- `data/counties/gage/assessment-ratio-analysis.json`
- `data/counties/gage/county-context.json`
- `data/counties/gage/market-position-statistics-2026-gage.json`
- `data/counties/gage/pad-ratio-statistics-2026-gage.json`
- `data/counties/gage/tax-district-authorities-2025.json`
- `data/counties/gage/valuation-groups.json`
- `data/statewide/certified-taxes-levied.json`
- `data/statewide/statewide-ctl-summary.json`
- `data/statewide/county-ctl-comparisons.json`
- `data/statewide/pad-ratio-statistics-by-county.json`
- `data/statewide/county-assessment-ranges.json`
- `data/calendars/pad_main_calendar_2025.json`
- `data/standards/iaao-standards.json`
- `data/standards/iaao-glossary.json`

## Source Registry And Provenance

Nebraska Department of Revenue Property Assessment Division source provenance is tracked separately from the app-ready data. The frontend should consume static JSON only; it should not fetch, scrape, or parse PAD PDFs at runtime.

- `data/sources/nebraska-pad-source-registry.json` records official PAD source documents, landing pages, direct document URLs, year types, jurisdiction, publisher, confidence, and manual-review flags.
- `data/sources/nebraska-pad-metric-ledger.json` records extracted or verified metrics with page/table/row/column provenance, extraction method, confidence, verification status, and any comparison against existing project JSON.
- `docs/source-provenance-audit.md` summarizes official source discovery, schema decisions, verification results, mismatches, extraction reliability, and remaining review items.

The current source registry covers statewide CTL context, all 93 Nebraska counties for 2026 Reports and Opinions class-level ratio statistics, Gage historical R&O support, annual PAD reports, assessment calendar references, PAD forms, and official PAD index pages. Mismatches are recorded in the ledger and audit doc rather than silently applied to existing project data.

## Market Area System

The Market Area / Value Detail work now uses a class-aware market-position system instead of grouped bar-chart comparisons.

- Residential and commercial groups use the Nebraska other-real-property ratio range of 92-100.
- Agricultural market areas use the agricultural/horticultural range of 69-75.
- The primary visualization is a Median Ratio vs. COD scatterplot.
- The selected local group is highlighted; other groups remain muted; countywide context is shown as a reference.
- The expected range appears as a shaded field, with subtle target-field geometry to help users understand clustering and drift without turning the chart into a scorecard.
- Price context is summarized as KPI cards rather than forced into the primary chart.

The market-position source data lives in:

- `data/counties/gage/market-position-statistics-2026-gage.json`

Reusable helpers live in:

- `src/market-stats.js`
- `src/charts.js`

## Key Modules

- `src/app.js` loads data, initializes the guided journey, and wires page behavior.
- `src/data-service.js` loads the manifest, active MIPS record card, guided snapshot context, county data, standards, and shared app configuration.
- `src/snapshot-model.js` normalizes property data and derives view models.
- `src/render.js` renders the taxpayer-facing record, assessment, tax, review, and resource sections.
- `src/charts.js` builds charts, market-position visuals, and county/state context displays.
- `src/metric-signals.js` centralizes neutral signal language for assessment metrics.
- `src/recordCorrectionRequest.js` prepares the property-record correction request PDF.
- `src/config/taxpayer-journey.js` defines the current guided route labels and sequencing.

## Repository Structure

- `index.html` defines the static page shell and section mount points.
- `src/` contains application logic, rendering, charts, formatting, modal behavior, and journey configuration.
- `data/app/` contains application configuration and the active property manifest.
- `data/property-records/mips/` contains the active MIPS property record card and guided snapshot context.
- `data/counties/` contains county-level reports, ratio statistics, market-position data, valuation groups, school colors, and tax district authority data.
- `data/statewide/` contains statewide and county comparison datasets.
- `data/sources/` contains the official-source registry and metric extraction ledger.
- `data/calendars/` contains static assessment calendar data.
- `data/standards/` contains static IAAO standards and glossary references.
- `docs/` contains project planning and source-provenance audit notes.
- `assets/images/` contains local property images and sketches used by the prototype.

## Run Locally

The app loads local JSON files, so run it through the included static server instead of opening `index.html` directly.

```bash
node server.js
```

Then open:

```text
http://localhost:4173/
```

The `PORT` environment variable can be used to serve on another port.

## Development Notes

- Keep new property test records real and record-card based.
- Do not reintroduce incomplete sample agricultural or commercial property switchers.
- Preserve the MIPS record card as the single active property source unless the manifest is intentionally expanded.
- Keep county, state, standards, glossary, calendar, and market-statistics data separate from the property record.
- Prefer reusable data helpers over embedding report statistics directly inside components.
- Keep taxpayer-facing copy plain, neutral, and sequential.
- When adding statistics, pair the number with a short human explanation or place it where the visual context can carry the meaning.

## Validation

Useful local checks:

```bash
node --check src/render.js
node --check src/charts.js
git diff --check
node -e "JSON.parse(require('fs').readFileSync('data/app/property-manifest.json','utf8')); console.log('manifest json ok')"
node -e "JSON.parse(require('fs').readFileSync('data/property-records/mips/residential-010496000-record-card.json','utf8')); console.log('record card json ok')"
node -e "for (const file of ['data/sources/nebraska-pad-source-registry.json','data/sources/nebraska-pad-metric-ledger.json','data/statewide/statewide-ctl-summary.json','data/statewide/county-ctl-comparisons.json','data/statewide/pad-ratio-statistics-by-county.json','data/statewide/county-assessment-ranges.json']) JSON.parse(require('fs').readFileSync(file,'utf8')); console.log('pad provenance json ok')"
```

After frontend changes, reload `http://localhost:4173/` and spot-check the affected step in the browser.

## Deployment

This is a static site and can be served by GitHub Pages or any static host. The repository includes `.nojekyll` so GitHub Pages serves the files directly.
