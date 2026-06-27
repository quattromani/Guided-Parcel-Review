# GES Changelog

## 1.0.0 - 2026-06-27

GES 1.0 establishes the reusable civic editorial design system baseline.

### Breaking Changes

- GES runtime styles now live in `src/ges/` instead of being treated as article patches inside the legacy app stylesheet.
- Editorial routes should load `src/ges/index.css`.
- Theme default now follows `prefers-color-scheme`; mobile width no longer forces dark mode.
- New article work should use `docs/ges/` as the operational design bible.

### New

- Token system for colors, typography, spacing, layout widths, radii, border/rule widths, focus treatment, elevation, and motion.
- Base HTML element styling.
- Typography roles for cover title, narrative title, component heading, kicker, companion, body, caption, metadata, utility, and citation text.
- Layout primitives and density modes.
- Component rules for Article Cover, Metadata Block, Format Controls, Section Header, Margin Insight, Process Strip, Decision Tree, Evidence Matrix, Comparison Grid, Practical Note, Authority Citation, Resource Panel, Continuation Module, Tables, Media, Tags, Buttons, Forms, Theme Toggle, and Print.
- Dark theme as a tokenized night edition.
- Print support in `src/ges/print.css`.
- Shared article markup helpers in `src/ges/article-components.js`.
- Dynamic article stylesheet loader in `src/ges/loader.js`.
- Shell API in `src/ges/shell.js` for semantic shell resolution, route classes, app-chrome hiding, and named region mounting.
- Live pattern library at `/ges/`.
- Design bible docs under `docs/ges/`.

### Deprecated

- Treating `src/styles.css` as the home for new GES article component rules.
- Adding article-specific dark-mode component patches when a token swap would solve the issue.
- New `tax-*` or `levy-*` names for reusable editorial components.
- Loud citation cards for routine authority/source notes.

### Removed / Consolidated

- Duplicated article route implementations for section headers, margin insights, article tags, guide utility markup, article entry panels, guide-length language, and page crease markup.
- Mobile-width theme default.

### Migration Notes

For older articles:

1. Load `src/ges/index.css`.
2. Move article content into `src/content/articles/` where practical.
3. Replace local component markup with helpers from `src/ges/article-components.js`.
4. Replace raw colors and spacing with GES tokens.
5. Verify dark, mobile, and print behavior.

### Known Remaining Technical Debt

- Mature article CSS still coexists with legacy app/experiment CSS in `src/styles.css`.
- Legacy `tax-*` and `levy-*` class names remain until generated PDFs and older routes are migrated.
- Existing PDFs should be regenerated after the next print-specific verification pass.
