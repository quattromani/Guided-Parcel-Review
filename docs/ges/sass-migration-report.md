# GES Sass Migration Report

Date: 2026-06-27

## Summary

Tailwind CDN usage has been removed from the public host pages and replaced with a project-local Sass design-system source tree. The generated output is `src/ges-system.css`, which is loaded by the main app through `src/styles.css` and by GES routes through the existing `src/ges/tokens.css` compatibility import.

The migration preserves the existing visual language by replacing only the Tailwind utility classes actually found in the project. It does not attempt to recreate Tailwind.

## Files Added

- `scripts/build-scss.mjs`
- `src/ges-system.css`
- `scss/ges.scss`
- `scss/abstracts/*`
- `scss/base/*`
- `scss/layout/*`
- `scss/components/*`
- `scss/pages/*`
- `docs/ges/sass-migration-report.md`

## Files Removed

- No product files were removed.
- Tailwind CDN script references and inline Tailwind configuration blocks were removed from:
  - `index.html`
  - `articles/assessment-up-protest-denied-taxes/index.html`
  - `articles/before-you-walk-into-a-property-protest/index.html`

## Tailwind Utilities Eliminated

- 194 distinct Tailwind utility tokens were inventoried from class attributes and JavaScript templates.
- 0 old Tailwind utility tokens remain in class attributes, `classList` calls, or CSS selectors after migration.
- Behavioral hooks formerly using `hidden`, `flex`, and `overflow-hidden` now use project classes such as `is-hidden`, `display-flex`, and `clip-overflow`.

## Payload Notes

- Before: runtime depended on the external Tailwind CDN plus local project CSS.
- After: Tailwind runtime dependency is 0 bytes; the local generated design-system CSS is 38,391 bytes.
- Current measured CSS entry sizes:
  - `src/ges-system.css`: 38,391 bytes
  - `src/ges/tokens.css`: 225 bytes
  - `src/styles.css`: 338,721 bytes
  - `src/ges/index.css`: 406 bytes

## Duplicates Consolidated

- `src/ges/tokens.css` no longer owns literal token values; it imports generated design-system CSS for compatibility.
- The public root token block in `src/styles.css` now aliases `--ds-*` and `--ges-*` tokens instead of duplicating the same design values.
- Repeated Tailwind class bundles have been replaced with project utility classes sourced from the Sass token layer.

## Remaining Technical Debt

- `src/styles.css` still contains the legacy parcel-review app shell and many component rules. Future work should move stable component styles into `scss/components/` in small, verified passes.
- GES article CSS still includes legacy `tax-*`, `levy-*`, and route-specific selectors because current routes and PDF flows depend on them.
- Chart.js remains CDN-hosted.
- Google Fonts remain externally hosted.

## Future Recommendations

- Move one component family at a time from `src/styles.css` into Sass partials after screenshot comparison.
- Keep generated CSS checked in for static-host portability.
- Add a repeatable visual regression script for desktop, tablet, and mobile before the CSS rebuild continues.
- Define a future county theme contract that overrides only token values, not component selectors.
