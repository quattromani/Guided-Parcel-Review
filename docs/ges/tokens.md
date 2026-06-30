# GES Tokens

Tokens are the first layer of the cascade. Component CSS should consume tokens, not hard-coded values.

The canonical token source is the Sass tree:

- `scss/abstracts/_colors.scss`
- `scss/abstracts/_typography.scss`
- `scss/abstracts/_spacing.scss`
- `scss/abstracts/_breakpoints.scss`
- `scss/abstracts/_elevation.scss`
- `scss/abstracts/_opacity.scss`
- `scss/abstracts/_animation.scss`
- `scss/abstracts/_zindex.scss`
- `scss/abstracts/_tokens.scss`

`scripts/build-scss.mjs` generates `src/ges-system.css`, and `src/ges/tokens.css` remains only as a compatibility import. The style guide and pattern library must read the same custom properties as the public site.

## Color Roles

- Page background: `--ges-color-page`
- Surface background: `--ges-color-surface`
- Elevated surface: `--ges-color-surface-elevated`
- Muted surface: `--ges-color-surface-muted`
- Raised surface: `--ges-color-surface-raised`
- Inset surface: `--ges-color-surface-inset`
- Floating surface: `--ges-color-surface-floating`
- Text primary: `--ges-color-text`
- Text secondary: `--ges-color-text-secondary`
- Text muted: `--ges-color-text-muted`
- Border subtle: `--ges-color-border-subtle`
- Border strong: `--ges-color-border-strong`
- Civic blue: `--ges-color-civic-blue`
- Hyper Blue: `--ges-color-hyper-blue`
- Evidence green: `--ges-color-evidence-green`
- Caution amber: `--ges-color-caution-amber`
- Process blue: `--ges-color-process-blue`
- Link color: `--ges-color-link`
- Link hover: `--ges-color-link-hover`
- Focus ring: `--ges-color-focus`
- Selection color: `--ges-color-selection`
- Success state: `--ges-color-success`
- Caution state: `--ges-color-caution`
- Neutral state: `--ges-color-neutral`
- Informational state: `--ges-color-info`

Semantic article roles are exposed through compatibility aliases:

- `--color-information`
- `--color-evidence`
- `--color-comparison`
- `--color-action`
- `--color-reflection`

Use these roles to describe information behavior, not decoration.

County and app-shell compatibility aliases such as `--county-color-*`, `--surface-*`, `--semantic-*`, and `--accent-*` should point back to `--ds-*` or `--ges-*` tokens. Do not add new literal values to `src/styles.css`.

## Typography

- Body font: `--ges-font-body`
- Heading font: `--ges-font-heading`
- UI font: `--ges-font-ui`
- Mono font: `--ges-font-mono`
- Type scale: `--ges-type-2xs` through `--ges-type-4xl`
- Line height: `--ges-line-tight`, `--ges-line-heading`, `--ges-line-copy`, `--ges-line-compact`
- Letter spacing: `--ges-letter-kicker`, `--ges-letter-label`
- Weights: `--ges-weight-regular`, `--ges-weight-medium`, `--ges-weight-semibold`, `--ges-weight-bold`, `--ges-weight-heavy`

## Spacing

Use `--ges-space-*` for local relationships and section/card tokens for rhythm:

- Fluid gutters: `--ges-gutter`
- Section spacing: `--ges-section-space-*`
- Component spacing: `--ges-component-space-*`
- Card padding: `--ges-card-padding-*`

Density modes:

- `data-density="compact"`
- `data-density="standard"`
- `data-density="immersive"`

Density changes rhythm. It must not change component meaning.

## Layout

- Reading width: `--ges-width-reading`
- Wide component width: `--ges-width-wide`
- Cover width: `--ges-width-cover`
- Full bleed width: `--ges-width-full-bleed`
- Margin insight width: `--ges-width-margin-insight`
- Minimum viewport guard: `--ges-min-viewport`
- Breakpoints: `--ges-breakpoint-sm` through `--ges-breakpoint-xl`

## Shape, Borders, Elevation, Motion

- Radius: `--ges-radius-xs`, `--ges-radius-sm`, `--ges-radius-md`, `--ges-radius-lg`, `--ges-radius-pill`, `--ges-radius-media`
- Pill geometry: `--ges-pill-font-size`, `--ges-pill-line-height`, `--ges-pill-min-block-size`, `--ges-pill-padding-block`, `--ges-pill-padding-inline`, `--ges-pill-row-gap`, `--ges-pill-letter-spacing`
- Inner-card geometry: `--ges-inner-card-radius`, `--ges-inner-card-gap`, `--ges-inner-card-padding`, `--ges-inner-tile-min-block-size`, `--ges-inner-tile-padding-block`, `--ges-inner-tile-padding-inline`
- Borders and rules: `--ges-border-width`, `--ges-border-width-strong`, `--ges-border-width-accent`, `--ges-rule-width`, `--ges-rule-width-strong`, `--ges-print-rule-width`
- Focus ring: `--ges-focus-ring-width`, `--ges-focus-ring-offset`
- Shadows: `--ges-shadow-surface`, `--ges-shadow-card`, `--ges-shadow-media`, `--ges-shadow-icon-lift`

`--ges-shadow-icon-lift` is reserved for small circular body/content icon containers. It should read as a slight lift from paper, not a card, button, or floating control.
- Motion: `--ges-motion-duration`, `--ges-motion-duration-slow`, `--ges-motion-ease`

Reduced motion disables practical animation duration globally in the GES base layer.

## Utility Policy

GES includes a narrow project utility layer for the former Tailwind utilities actually used by the project. Utility classes should stay semantic enough to read in markup, such as `is-hidden`, `visually-hidden`, `display-grid`, `pad-block-2`, `surface-muted`, `text-primary`, and `mq-lg-grid-cols-12`.

Do not reintroduce Tailwind class names, Tailwind CDN config, or broad framework-style utility generation. If a pattern repeats, prefer a component class over another utility.
