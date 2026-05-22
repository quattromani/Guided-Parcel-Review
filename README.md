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

After UI changes, run the app locally and spot-check the affected guided steps in the browser. Shell or breakpoint work should also follow `docs/style-shell-contract.md` and check desktop, tablet landscape, tablet portrait, and phone widths.

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

Shared app, copy, and reference data stays separate from the property record:

- `data/app/site-copy.json` for centralized public-facing app copy: guided route labels, page/section copy, modal text, footer resources, record-review categories, and record-correction report/email text.
- `data/app/` for legal references, PAD forms, assessment calendar events, and the property manifest.
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
- `src/render.js`, `src/routes/`, and `src/views/` render the property record, guided route panels, footer resources, property switcher, correction-request surface, start page, and view-specific sections.
- `src/charts.js` and `src/charts/` build Chart.js visualizations, tax-distribution treemaps, market-position views, county comparison displays, and equalization context.
- `src/styles.css` owns the shell surface contract (`review-card`, `review-card-muted`, `review-note`), radius rules, guided rail behavior, and breakpoint layout decisions. See `docs/style-shell-contract.md`.
- `src/reports/` builds the downloadable property report PDF; `src/assessors-report.js` builds the supplemental assessor print view.
- `src/content/site-copy.js` loads centralized copy from `data/app/site-copy.json`; `src/config/taxpayer-journey.js` and `src/content/` provide fallbacks and route/resource accessors.

## Editing Site Copy

Centralized public-facing app copy lives in `data/app/site-copy.json`. The file is organized by stable top-level groups: `site`, `navigation`, `routes`, `viewHeaders`, `pages`, `footer`, `modals`, `resourcesByView`, `recordReview`, and `recordCorrectionRequest`. Within `pages`, copy is grouped by route or panel, then by section or component.

The app loads that file through `src/content/site-copy.js` before route, page, modal, footer, or report rendering. If the JSON cannot be fetched or parsed, the app falls back to built-in literals so the static site does not render blank UI. When changing foundational shell copy, update both `data/app/site-copy.json` and any fallback literal in the module that uses the key, especially for start page, route metadata, footer resources, modal labels, and record-correction report text.

Do not move dynamic values into copy files. Property values, parcel facts, tax amounts, levy/rate figures, chart data, calculation inputs, thresholds, ratio-study measures, CTL data, IAAO/statistical standards, deadlines, forms, legal references, and source citations should stay in their structured data files unless the item is purely a display label or surrounding explanatory text. Use `docs/content-extraction-inventory.md` before moving generated narrative text; some chart/report sentences intentionally remain in code because they combine copy with calculations and statistical context.

## Handoff Notes

- `docs/team-handoff.md` maps the current repo shape to likely backend, database, data/ETL, frontend, QA, design, accessibility, policy, DevOps, security, and support handoff needs.
- `docs/content-extraction-inventory.md` records which public-facing strings moved into `data/app/site-copy.json`, which values remain data-driven, and which generated fragments are intentionally still in code.
- `docs/style-shell-contract.md` records the current visual shell rules for surfaces, radii, guided rails, footer behavior, and breakpoint smoke checks.
- Treat `data/app/property-manifest.json` as the demo inventory and shared-data wiring point. Add new sample records there only when the referenced static JSON is complete enough to pass validation.
- Keep property-specific facts in record cards and county/state/reference facts in their shared datasets. Avoid embedding report statistics directly in components.
- Preserve the selected-property flow: query string first, then stored selection. The Start page is intentional for first-run demos.
- Keep large optional datasets behind route/action boundaries. For example, full tax-district authority data loads when the Tax Context step needs it.
- Keep taxpayer-facing copy neutral and sequential. The app should orient users, not imply ownership, predict protest outcomes, or replace official determinations.
- Edit public-facing app language in `data/app/site-copy.json` first. Keep property values, tax figures, statistics, deadlines, forms, and legal/source records in their structured data files unless the value is purely a display label.
- PDF/report flows are demonstration outputs. Email delivery for correction requests requires a future `window.propertyCorrectionEmailService` integration.

## Known Limitations

- The app is static and demo-data driven; it is not connected to a live CAMA, tax, GIS, payment, or filing system.
- Sample records combine source-shaped data and app-ready `guidedSnapshot` data. A production integration should separate raw vendor records, normalized records, and app-ready view models more clearly.
- JSON contracts are lightweight smoke checks, not a full schema-validation pipeline.
- Browser CDNs are used for Tailwind and Chart.js in the prototype shell.
- Source/provenance ledgers document official PAD references, but source refresh and extraction workflows are manual.

## Deployment

The project is a static site and can be served by GitHub Pages or any static host. The repository includes `.nojekyll` so GitHub Pages serves files directly.
