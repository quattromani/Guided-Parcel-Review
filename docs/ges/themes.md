# GES Themes

GES supports light and dark mode through token swaps. Dark mode is not an inversion of light mode. It is a parallel color system with softened chroma, layered surfaces, and separate elevation rules.

## Light Mode

Light mode should feel like civic paper:

- warm/cool page background
- white surfaces
- dark blue-gray text
- muted borders
- restrained semantic accents

## Dark Mode

Dark mode is a night edition, not an inverted light mode. Colors that feel calm on paper can become too hot, too flat, or too harsh on dark surfaces. Accent chroma should soften as perceived lightness drops.

Principles:

- charcoal page color, not black
- soft off-white text, not pure white
- layered dark surfaces
- elevation through subtle border contrast
- softened semantic colors
- civic blue becomes dusty blue
- evidence green becomes muted sage
- amber becomes muted brass
- red becomes a restrained clay red, not a glowing alert
- focus rings remain visible without becoming neon

## Dark Surface Ladder

Dark mode uses a surface ladder so cards, panels, controls, and modals do not collapse into one flat plane.

- Page background: `--ges-color-page`
- Warm page alternate: `--ges-color-page-warm`
- Inset panels: `--ges-color-surface-inset`
- Muted panels: `--ges-color-surface-muted`
- Main cards: `--ges-color-surface`
- Elevated cards: `--ges-color-surface-elevated`
- Raised controls: `--ges-color-surface-raised`
- Floating controls and navigation: `--ges-color-surface-floating`

Use the lowest surface that provides enough separation. Do not solve dark-mode hierarchy by adding heavy black shadows.

## Dark Elevation

Light-mode shadows do not translate directly to dark mode.

Dark elevation should use:

- slight surface lightening
- quiet borders
- restrained black shadow
- a small top highlight only when it clarifies a raised control

Avoid broad glows. Glow is reserved for tiny progress or focus cues and should use low alpha.

## Dark Accent Recalibration

Accent colors must preserve meaning while losing the electric quality that appears on dark backgrounds.

- Link/civic blue uses dusty blue-green.
- Hyper Blue remains recognizable but is softened for reading progress.
- Evidence/success green shifts toward sage.
- Warning amber shifts toward brass.
- Error red shifts toward clay.
- Process blue shifts toward muted periwinkle.

Do not reuse light-mode soft fills in dark mode. Soft fills should be dark tinted surfaces, not pale cards placed on a dark page.

## Dark Typography

Dark text roles:

- Primary text uses `--ges-color-text`; it is off-white, not pure white.
- Secondary text uses `--ges-color-text-secondary`; it should carry body-supporting copy without glare.
- Muted text uses `--ges-color-text-muted`; reserve it for captions, metadata, and low-emphasis labels.
- Links use `--ges-color-link`; hover/focus may use `--ges-color-link-hover`.
- Eyebrows and captions should be readable, but quieter than headings.

Avoid text shadows and glowing white type.

## Dark Borders And Dividers

Dark borders should be visible but quiet.

- Use `--ges-color-border-subtle` for internal card rules and component boundaries.
- Use `--ges-color-border-strong` for controls, active states, and high-density UI.
- Do not use bright rules to create hierarchy. If a border feels like it slices the page apart, lower its alpha or use a neighboring surface instead.

## Dark Charts

Charts use a separate visualization palette.

- Chart labels use muted off-white text, not body primary white.
- Gridlines use low-alpha muted gray.
- Tooltips use raised dark surfaces and quiet borders.
- Series colors are softer versions of civic, evidence, warning, danger, and process colors.
- Semantic meaning must stay stable across modes: value remains green, tax remains red, equalization remains civic blue, warning remains amber.
- Do not rely on color alone; legends, labels, and captions remain required.

Implementation:

- Theme script sets `data-ges-theme` and `data-ges-theme-resolved`.
- `src/ges/themes.css` swaps tokens for `html[data-ges-theme-resolved="dark"]`.
- `src/config/visualization-palettes.js` provides the matching dark visualization palette for Chart.js and custom charts.
- Component internals should not need dark-mode patches.

## Preference Behavior

Without a manual choice, GES follows `prefers-color-scheme`.

When a reader chooses light or dark, the choice is stored under:

```text
ges-theme-preference
```

## Print

Print resolves to light. Theme toggles and interactive controls are hidden.

## Anti-Collision Rule

If a dark-mode fix targets a component class directly, first ask whether the problem belongs in tokens. Component-specific dark rules require a clear exception.
