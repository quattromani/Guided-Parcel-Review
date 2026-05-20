# Style Shell Contract

This document captures the current visual contract for the guided review shell. It is meant to keep future edits from recreating the earlier pile of one-off breakpoint and utility overrides.

## Core Surfaces

Use semantic shell classes for recurring surfaces instead of repeating Tailwind utility bundles in `index.html`, `src/render.js`, or chart renderers.

| Class | Purpose | Default shape |
| --- | --- | --- |
| `review-card` | Primary white route/card surface. | White background, 0.5rem radius, light ring/shadow, 1.25rem padding. |
| `review-card-muted` | Secondary inset surface inside a primary card. | Slate-50 background, 0.5rem radius, inset ring, 1rem padding. |
| `review-card-spacious` | Larger top-level surface, currently the property snapshot header. | Same as `review-card`, 1.5rem padding. |
| `review-note` | Compact legal/source/form note surface. | Slate-50 background, 0.5rem radius, inset ring, 0.75rem padding. |
| `review-note-compact` | Denser note variant for small legend/detail rows. | Same as `review-note`, 0.5rem vertical padding. |

Do not add new `rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200` or `rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200` fragments. Add or extend a semantic class when a new repeated surface appears. Tailwind CDN is configured in `index.html` so `rounded-lg`, `rounded-xl`, and `rounded-2xl` resolve to the same 0.5rem container radius.

## Radius Rules

- Framed content surfaces use the 0.5rem container radius.
- Buttons, pills, step markers, segmented controls, and circular controls keep their pill/circle radius.
- Full-width rails are allowed to go square. The property identity bar and the guided path rail are square below desktop where they stretch edge-to-edge.
- Sticky/full-width rails use the subtle two-pixel dark/light live edge for separation instead of a drop shadow.

## Layout Shell

- `body`, `main`, and the footer stay on the light slate background at every breakpoint.
- `main` is the scrollable document content; the footer is normal DOM flow, not fixed under the page.
- The property identity bar keeps the brand-ink background. It is contained on desktop and stretches full width below desktop.
- The guided path rail is contained on desktop and full width below desktop.
- Guided panel cards retain internal gutters at every breakpoint. Below desktop, panel cards use the tighter 1rem padding contract.
- The footer resource card should share the same max-width/padding frame as `main`.
- The calendar reference collapses below desktop into the `See important dates` disclosure, with `See Full Calendar` nested inside that disclosure.

## Data And Rendering Boundaries

- `index.html` should define only the static shell, panel mount points, and semantic shell classes.
- `src/render.js`, `src/routes/`, and `src/views/` may render app-specific content, but should use shell classes for surfaces.
- `src/charts.js` and `src/charts/` should emit chart/table markup and use `review-card-muted` or `review-note` for repeated inset cards.
- Calculation and formatting decisions stay in `src/calculations/`, `src/domain/`, `src/format.js`, and `src/utils/`; renderers should not duplicate math.
- Empty, null, undefined, or no-value source sections should stay out of the DOM unless they explain a meaningful absence.

## Horizontal Tables

Wide tables may require local horizontal scroll. At tablet and desktop sizes, any table that cannot naturally fit should expose the table expansion affordance rather than forcing the page itself wider.

## Breakpoint Smoke Checks

Before handoff after shell work, spot-check:

- Desktop around 1300-1600px.
- Tablet landscape around 1024px.
- Tablet portrait around 768-900px.
- Phone around 375-430px.

At each breakpoint, confirm the page background stays light, the identity rail and guided rail follow the contained/full-width rules, route cards keep gutters, the footer is regular scroll content, and no table expands the document width.
