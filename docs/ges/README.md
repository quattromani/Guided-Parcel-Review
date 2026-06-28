# Guided Editorial System 1.0

GES is the civic editorial design system for Guided Parcel Review articles, guides, explainers, tools, and publication support pages.

Mission: reduce cognitive friction without reducing intellectual depth.

Every component should teach, orient, reassure, clarify, verify, or help the reader act. If a rule or component does not do one of those jobs, remove it or revise it.

## Runtime Structure

- `scss/ges.scss` is the canonical Sass entry point for GES design-system source.
- `scss/abstracts/` owns live design tokens for color, type, spacing, breakpoints, elevation, opacity, motion, and z-index.
- `scss/base/`, `scss/layout/`, `scss/components/`, and `scss/pages/` own project-local CSS source. These files should not recreate framework utilities.
- `scripts/build-scss.mjs` compiles the Sass source into `src/ges-system.css` without requiring a package-manager dependency.
- `src/ges-system.css` is checked in so the static site remains portable to GitHub Pages and minimal third-party host pages.
- `src/ges/index.css` imports the GES runtime cascade.
- `src/ges/tokens.css` is a compatibility shim that imports `src/ges-system.css`.
- `src/ges/base.css` owns intentional HTML defaults.
- `src/ges/typography.css` owns text roles.
- `src/ges/layout.css` owns layout primitives and density.
- `src/ges/public-layout.css` owns Public Layout and Public Footer styling.
- `src/ges/utilities.css` owns narrow reusable helpers.
- `src/ges/components.css` owns editorial components.
- `src/ges/themes.css` owns light/dark token swaps.
- `src/ges/print.css` owns printed handout behavior.
- `src/ges/shell.js` owns semantic shell resolution and route-region mounting.
- `src/ges/public-layout.js` owns public layout metadata and footer rendering.
- `src/ges/article-components.js` owns reusable article markup helpers.
- `ges/index.html` is the live pattern library.

The older `src/styles.css` still owns much of the non-editorial parcel-review app shell, but its public root tokens now alias the Sass token layer. GES loads as an explicit layer for editorial routes and the pattern library.

## Cascade Ownership

1. Tokens define values.
2. Generated design-system CSS exposes those values and the project utility vocabulary.
3. Base styles define ordinary HTML.
4. Typography defines reading hierarchy.
5. Layout primitives define reusable structure.
6. Components define reusable editorial objects.
7. Variants modify components intentionally.
8. Article composition arranges components.
9. Theme files swap token values.
10. Print rules preserve substance while removing dead controls.

Tailwind is not part of the runtime cascade. If a future view needs a repeated visual pattern, add a semantic component class or a narrow project utility sourced from the Sass tokens.

## Composition Rule

GES pages and articles are assembled from base HTML, layout primitives, and reusable components. Do not create duplicative page-sized or article-sized templates that restyle or re-own component behavior.

A page shell may provide semantic landmarks such as `header`, `main`, `article`, and `footer`. It should not become a second component system. If a pattern is reusable, make it a component. If a component needs a variant, document the variant. If an article only needs sequencing, compose the existing pieces directly.

The shell API in `src/ges/shell.js` may:

- resolve `main`, cover, and body regions
- apply route-level classes
- hide non-editorial app chrome
- mount already-rendered component HTML into named regions

It must not:

- render a full article
- duplicate component markup
- restyle children by page context
- decide editorial sequence

## Live Library

Open:

```text
/ges/
```

Local server:

```bash
node server.js
```

Then visit:

```text
http://localhost:4173/ges/
```

Rebuild design-system CSS after editing Sass:

```bash
node scripts/build-scss.mjs
```

## Core Principles

- Calm over clever.
- Information before decoration.
- Typography and spacing create hierarchy before color.
- White space is active.
- Repetition reinforces structure.
- Components should disappear into the reading experience.
- Prefer deletion over accommodation.
- Readers should never feel lost.

## Documentation Map

- `tokens.md`: design tokens and semantic roles.
- `typography.md`: text hierarchy and editorial rhythm.
- `layout.md`: widths, density, and composition.
- `components.md`: component lifecycle and markup.
- `themes.md`: light, dark, and print behavior.
- `accessibility.md`: accessibility requirements.
- `refactor-guide.md`: migration workflow, review checklist, and anti-patterns.
- `cascade-audit.md`: GES 1.0 cascade cleanup report.
- `changelog.md`: version history and migration notes.
