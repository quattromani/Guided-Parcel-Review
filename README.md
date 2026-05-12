# Property Snapshot

A static prototype for explaining a property assessment, tax bill, tax district, market area, and county/state context in a guided taxpayer-facing flow.

This branch, `guided-snapshot-refactor`, reshapes the experience from a multi-section dashboard into a plain-English path through the property story. The intended audience is a normal taxpayer who needs clear sequencing before deeper data.

## Guided Experience

The interface is organized around an eight-step horizontal path:

1. Your Property
2. Your Assessment
3. Your Taxes
4. Your Tax Districts
5. Your Market
6. The County
7. The State
8. Review

Each step is structured to answer one primary question, show the most relevant data first, and provide a clear next action. Deeper details remain available, but they are sequenced after the taxpayer has enough context to understand why they matter.

## Current Branch Goals

- Make the prototype feel like a taxpayer explanation system, not a generic data dashboard.
- Use verified MIPS residential property record data as the active property source.
- Remove incomplete agricultural and commercial sample-property UI paths.
- Support future testing by adding additional real property record card JSON files.
- Centralize derived property metrics and section-specific view data.
- Standardize chart and indicator colors through a reusable visualization palette.
- Keep static calendars, standards, glossaries, and reference data isolated from property-specific data.

## Data Pipeline

The intended data flow is:

```text
raw JSON -> normalized property snapshot model -> derived metrics -> view-specific data objects -> UI sections
```

Key modules:

- `src/data-service.js` loads the configured JSON sources.
- `src/snapshot-model.js` normalizes property data and derives view models.
- `src/render.js` renders taxpayer-facing sections and guided copy.
- `src/charts.js` prepares chart datasets and Chart.js configuration.
- `src/config/visualization-palettes.js` defines semantic visualization colors.

## Data Sources

The branch currently uses:

- MIPS residential property record card JSON.
- Historical certified taxes levied data.
- PAD Reports and Opinions / ratio statistics data.
- Tax district authority data.
- Valuation group data.
- Static PAD calendar data.
- Static IAAO standards and glossary references.
- Stable application copy and navigation configuration.

The active property is configured in `data/app/property-manifest.json`.

## Repository Structure

- `index.html` defines the static page shell and section mount points.
- `src/` contains application logic, rendering, charts, formatting, modal behavior, and theme configuration.
- `data/app/` contains app-level configuration such as navigation, copy, and the property manifest.
- `data/properties/` contains the active property snapshot data.
- `data/property-records/mips/` contains MIPS property record card JSON.
- `data/counties/` contains county-level reports, ratio statistics, valuation groups, school colors, and tax district authority data.
- `data/statewide/` contains statewide and county comparison datasets.
- `data/calendars/` contains static assessment calendar data.
- `data/standards/` contains static reference standards and glossary data.
- `assets/images/` contains local images used by the prototype.

## Run Locally

The app loads JSON files, so run it through a local static server instead of opening `index.html` directly.

```bash
node server.js
```

Then open:

```text
http://localhost:4173/
```

## Development Notes

- Keep new property testing data real and record-card based.
- Do not reintroduce incomplete sample agricultural or commercial property switchers.
- Prefer semantic palette roles over hardcoded chart colors.
- Keep taxpayer-facing language plain, sequential, and question-based.
- Preserve the compact context header for non-property views and the fuller notice-style property header on the first step.

## Deployment

This is a static site and can be served by GitHub Pages or any static host. The repository includes `.nojekyll` so GitHub Pages serves the files directly.
