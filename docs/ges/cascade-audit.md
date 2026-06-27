# GES 1.0 Cascade Audit

Date: 2026-06-27

## What Was Found

The existing implementation had a strong editorial vocabulary but weak cascade boundaries.

Main issues:

- `src/styles.css` combined the parcel-review app shell, experiments, article components, dark-mode patches, and print rules.
- GES components used mixed naming: `article-*`, `ges-*`, `tax-*`, `levy-*`, `protest-*`, and generic component classes.
- Light and dark mode relied partly on component-specific overrides.
- Reusable article helpers were duplicated in the two published article routes.
- Margin Insight used hard-coded red values and route-specific dark overrides.
- Article entry/format controls were repeated route code instead of a shared pattern.
- Print rules were article-specific and should move toward component ownership.
- Existing docs described the desired component grammar more clearly than the runtime cascade.

## Consolidated In GES 1.0

- Added explicit GES runtime module stack under `src/ges/`.
- Added token ownership for color, type, spacing, layout width, radius, border/rule width, focus treatment, elevation, and motion.
- Added base HTML styles for common tags.
- Added layout primitives and density modes.
- Added reusable component rules loaded after legacy article CSS.
- Added theme token swaps in `themes.css`.
- Added print rules in `print.css`.
- Added shared article helper module for section headers, margin insights, article tags, metadata panels, guide format controls, reading-time language, and page creases.
- Changed theme default from mobile-width dark mode to `prefers-color-scheme`.
- Added early theme boot scripts to published article pages.
- Added dynamic GES stylesheet loading for app-rendered article routes.
- Added live pattern library at `/ges/`.
- Added GES documentation set under `docs/ges/`.

## Remaining Compatibility Layer

`src/styles.css` still owns:

- the Guided Parcel Review app shell
- property review cards
- data dashboards
- experiments
- older route-specific article rules
- legacy print rules

GES 1.0 now overrides article behavior through `src/ges/index.css`, but a future cleanup should migrate mature article CSS out of `src/styles.css` after more article routes have adopted the module layer.

## Consolidation Counts

- Shared route helper functions eliminated from duplicated route code: section header, margin insight, article tags, guide utility, article entry panel, guide-length language, page crease.
- New GES CSS modules: 8 plus import index.
- New design bible docs: 9.
- New live pattern library: 1.

## Intentional Technical Debt

- Legacy `tax-*` and `levy-*` class names remain active because both published articles and generated PDFs still reference them.
- Some old `!important` rules remain in `src/styles.css` outside the new GES layer.
- The article print system now has both legacy and GES component-level rules; future PDF regeneration should retire route-specific print blocks once output is visually reverified.
- The original long-form `docs/guided-editorial-design-language.md` remains as historical source material. The canonical 1.0 operational docs are under `docs/ges/`.
