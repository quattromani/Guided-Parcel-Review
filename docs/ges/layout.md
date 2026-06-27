# GES Layout

GES layout should make the reader feel oriented, not impressed.

## Widths

- `ges-reading`: prose and narrow explanatory sections.
- `ges-wide`: components that need comparison or scanning.
- `ges-cover-width`: article cover and full article rhythm.
- `ges-full-bleed`: rare immersive media or tools.

Default behavior:

- prose stays narrow
- diagrams and matrices may go wide
- source URLs use available width in print
- margin insights sit beside section headers only when width allows

## Density Modes

Density modes adjust rhythm:

- Compact: reference-heavy pages, short explainers, dense tools.
- Standard: normal articles and guides.
- Immersive: slower narrative field guides or media-led stories.

Density must not introduce new visual variants. It only changes spacing and card padding.

## Layout Primitives

- `ges-stack`: vertical rhythm.
- `ges-cluster`: wrapping inline actions.
- `ges-grid`: repeatable grid.
- `ges-section-lead`: section header/prose plus optional margin insight.

Use primitives before writing local layout CSS.

## Page Composition

GES does not use page-sized or article-sized macro templates as a substitute for components.

Allowed:

- semantic shells that provide landmarks
- route composition that orders known components
- small helpers that render one reusable component
- layout primitives that arrange children without changing their meaning

Avoid:

- one-shot article templates
- page templates that duplicate component markup
- wrapper templates that restyle children by context
- component behavior that depends on a specific page shell

The page owns order. Components own behavior.

## Shell API

Dynamic editorial routes should use `src/ges/shell.js` to resolve the shared shell contract:

```html
<main data-ges-shell="article">
  <section data-ges-shell-region="cover"></section>
  <div data-ges-shell-region="body"></div>
</main>
```

The API prepares the shell and exposes `setCover()` and `setBody()` for already-rendered component HTML. It does not render a cover, article, source block, continuation module, or any other component.

## Mobile Behavior

- Stack components before introducing horizontal scroll.
- Keep labels attached to values.
- Preserve DOM order.
- Let text wrap.
- Avoid wide tables unless wrapped in `ges-table-scroll`.

## Print Behavior

Print uses portrait Letter by default. Components should use `break-inside: avoid` where splitting would damage meaning.

Screen-only controls disappear in print. Substance remains: dates, source citations, visible URLs, tables, and diagrams.
