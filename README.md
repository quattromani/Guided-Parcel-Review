# Guided Parcel Review

Guided Parcel Review is a static, taxpayer-facing prototype for a guided parcel review. It helps a user choose a sample property, confirm the property record, understand assessment movement, review value and equalization context, connect value to taxes, identify neutral review signals, and download a concise reference report.

The app is currently positioned as a civic orientation and handoff prototype, not an official assessment, filing, tax-payment, or parcel-lookup system. It uses real-looking static sample data so product reviewers, county staff, and vendors can inspect the assumptions without needing database credentials.

## Run Locally

The app loads local JSON files, so serve it through the included static server instead of opening `index.html` directly.

```bash
node server.js
```

Then open:

```text
http://localhost:4173/
```

Set `PORT` to use another local port:

```bash
PORT=4174 node server.js
```

There is no package manager setup, bundler, or npm script layer in the current prototype. Runtime dependencies are browser CDNs plus vendored static assets where needed.

## Validation

Useful local checks before handoff or branching:

```bash
for file in server.js scripts/*.js src/**/*.js src/*.js; do node --check "$file" || exit 1; done
node scripts/validate-data-contracts.js
git diff --check
rg -n "/Users/|/private/tmp|<<<<<<<|>>>>>>>|debugger" src index.html docs data scripts server.js
```

After UI changes, run the app locally and spot-check the affected guided steps in the browser.

## Experience Model

The guided route sequence lives in `src/config/taxpayer-journey.js`:

1. Start
2. Property Record
3. What Changed
4. Value Detail
5. Equalization
6. Tax Context
7. Review Signals
8. Summary

The default first-run experience is the Start view. A user selects a sample parcel from the header property switcher. The selected property is stored in local storage and reflected in the `property` query parameter, so refresh and direct links such as `/?property=residential-011312000#tax-context` are stable.

## Current Data Model

Sample properties are listed in `data/app/property-manifest.json`. Available records currently live under `data/property-records/mips/` and include residential, agricultural, and commercial GWorks/MIPS-derived samples. Each record card contains source-shaped property data plus a `guidedSnapshot` object used by the current app-ready view models.

Shared app and reference data stays separate from the property record:

- `data/app/` for navigation, copy, legal references, PAD forms, assessment calendar events, and the property manifest.
- `data/counties/gage/` for county ratio, market-position, valuation-group, governing-office, school-color, and tax-district authority data.
- `data/statewide/` for statewide and county comparison datasets.
- `data/calendars/` for static PAD calendar data.
- `data/standards/` for IAAO standards and glossary references.
- `data/sources/` for source registry and metric ledger audit data.

The frontend should consume static app-ready JSON only. It should not scrape PAD PDFs or external property websites at runtime.

## Practical Architecture

- `index.html` defines the static shell, guided-panel mount points, CDN scripts, and stylesheet.
- `server.js` is a tiny local static server for JSON-backed browser testing.
- `src/app.js` boots the app, loads shared datasets, initializes charts, guided navigation, footer resources, reports, and lazy tax-district rendering.
- `src/data-service.js` loads the manifest, selected property record, county/state datasets, standards, forms, and calendar data.
- `src/adapters/mips/` maps the current MIPS/GWorks record-card handoff shape into the guided snapshot model.
- `src/domain/`, `src/data/`, and `src/calculations/` contain normalization, view-model, review-signal, history, and tax helpers that should stay independent of DOM rendering where practical.
- `src/render.js`, `src/routes/`, and `src/views/` render the property record, guided route panels, footer resources, property switcher, correction-request surface, and view-specific sections.
- `src/charts.js` and `src/charts/` build Chart.js visualizations, market-position views, county comparison displays, and equalization context.
- `src/reports/` builds the downloadable property report PDF; `src/assessors-report.js` builds the supplemental assessor print view.
- `src/config/taxpayer-journey.js` and `src/content/` own guided-route labels, sequencing, and route-specific supporting resources.

## Handoff Notes

- Treat `data/app/property-manifest.json` as the demo inventory and shared-data wiring point. Add new sample records there only when the referenced static JSON is complete enough to pass validation.
- Keep property-specific facts in record cards and county/state/reference facts in their shared datasets. Avoid embedding report statistics directly in components.
- Preserve the selected-property flow: query string first, then stored selection. The Start page is intentional for first-run demos.
- Keep large optional datasets behind route/action boundaries. For example, full tax-district authority data loads when the Tax Context step needs it.
- Keep taxpayer-facing copy neutral and sequential. The app should orient users, not imply ownership, predict protest outcomes, or replace official determinations.
- PDF/report flows are demonstration outputs. Email delivery for correction requests requires a future `window.propertyCorrectionEmailService` integration.

## Known Limitations

- The app is static and demo-data driven; it is not connected to a live CAMA, tax, GIS, payment, or filing system.
- Sample records combine source-shaped data and app-ready `guidedSnapshot` data. A production integration should separate raw vendor records, normalized records, and app-ready view models more clearly.
- JSON contracts are lightweight smoke checks, not a full schema-validation pipeline.
- Browser CDNs are used for Tailwind and Chart.js in the prototype shell.
- Source/provenance ledgers document official PAD references, but source refresh and extraction workflows are manual.

## Deployment

The project is a static site and can be served by GitHub Pages or any static host. The repository includes `.nojekyll` so GitHub Pages serves files directly.
