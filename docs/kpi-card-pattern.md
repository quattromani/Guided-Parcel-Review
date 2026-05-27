# Storyline KPI Cards

Use this pattern for compact numeric cards that can carry a small historical signal without becoming a second chart. The first implementation lives in `experiments/vg-aggregate.html`, `experiments/vg-aggregate.css`, and `experiments/vg-aggregate.js`.

## Rules

- Center the label, value, and supporting change text. The card should read as a single metric first.
- Keep the hard line out of the KPI background. Use only a soft area fill when the graph sits behind text.
- Let the background graph use nearly the full card height so the shape can tell a story.
- Use the same data shape and scale as the larger chart when the KPI is a thumbnail of that chart.
- Use semantic hues consistently: value uses green, tax uses red, and ETR uses the primary blue family.
- Keep supporting text neutral when graph color passes behind it.
- Keep one card in the row graph-free when it is a count or coverage metric rather than a trend.
- Do not link unpublished experiment pages from the public navigation until they are intentionally promoted.

## Current Name

Refer to the pattern as **Storyline KPI Cards** in future design notes and implementation work.
