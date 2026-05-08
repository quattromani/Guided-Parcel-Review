# Property Snapshot Refactor

This is the cleaned SPA version of `Property_Snapshot.html`.

## Structure

- `index.html` contains the page shell and section mount points.
- `data/property-data.json` contains the property, residential, tax, levy, comparable, source, and asset data.
- `data/assessment-calendar.json` controls the Nebraska assessment calendar used by both timeline components, including overlapping active stages.
- `src/app.js` boots the page.
- `src/data-service.js` loads the JSON and exposes small data selectors.
- `src/format.js` keeps formatting and calculation helpers together.
- `src/render.js` renders the page sections.
- `src/charts.js` owns the Chart.js chart configuration.
- `src/modal.js` owns the image modal behavior.
- `src/styles.css` contains small shared CSS fixes and reusable classes.
- `assets/images/` contains the copied local images with relative paths.

## Run Locally

Because the app loads `data/property-data.json`, open it through a local static server rather than directly from `file://`.

```bash
node server.js
```

Then open:

```text
http://localhost:4173/
```

## Publish With GitHub Pages

This project can be hosted as a free static site with GitHub Pages because `index.html` is at the repository root and all scripts, data, styles, and images use relative paths.

Recommended setup:

1. Create a GitHub repository for this folder.
2. Push this project to the repository's `main` branch.
3. In GitHub, open **Settings > Pages**.
4. Set **Source** to **Deploy from a branch**.
5. Set **Branch** to `main` and folder to `/root`.
6. Save. GitHub will publish the site after the first Pages build finishes.

The included `.nojekyll` file tells GitHub Pages to serve the static files directly instead of processing them with Jekyll.
