# GES Themes

GES supports light and dark mode through token swaps.

## Light Mode

Light mode should feel like civic paper:

- warm/cool page background
- white surfaces
- dark blue-gray text
- muted borders
- restrained semantic accents

## Dark Mode

Dark mode is a night edition, not an inverted light mode.

Principles:

- charcoal page color, not black
- soft off-white text, not pure white
- layered dark surfaces
- elevation through subtle border contrast
- softened semantic colors
- civic blue becomes dusty blue
- evidence green becomes muted sage
- amber becomes muted brass

Implementation:

- Theme script sets `data-ges-theme` and `data-ges-theme-resolved`.
- `src/ges/themes.css` swaps tokens for `html[data-ges-theme-resolved="dark"]`.
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
