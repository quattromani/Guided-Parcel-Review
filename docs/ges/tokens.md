# GES Tokens

Tokens are the first layer of the cascade. Component CSS should consume tokens, not hard-coded values.

## Color Roles

- Page background: `--ges-color-page`
- Surface background: `--ges-color-surface`
- Elevated surface: `--ges-color-surface-elevated`
- Muted surface: `--ges-color-surface-muted`
- Text primary: `--ges-color-text`
- Text secondary: `--ges-color-text-secondary`
- Text muted: `--ges-color-text-muted`
- Border subtle: `--ges-color-border-subtle`
- Border strong: `--ges-color-border-strong`
- Civic blue: `--ges-color-civic-blue`
- Evidence green: `--ges-color-evidence-green`
- Caution amber: `--ges-color-caution-amber`
- Process blue: `--ges-color-process-blue`
- Link color: `--ges-color-link`
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
- Borders and rules: `--ges-border-width`, `--ges-border-width-strong`, `--ges-border-width-accent`, `--ges-rule-width`, `--ges-rule-width-strong`, `--ges-print-rule-width`
- Focus ring: `--ges-focus-ring-width`, `--ges-focus-ring-offset`
- Shadows: `--ges-shadow-surface`, `--ges-shadow-card`, `--ges-shadow-media`
- Motion: `--ges-motion-duration`, `--ges-motion-duration-slow`, `--ges-motion-ease`

Reduced motion disables practical animation duration globally in the GES base layer.
