# GES Public Layout Architecture - Phase 02 Report

Date: June 28, 2026

## Files Changed

- `src/ges/public-layout.js`
- `src/ges/public-layout.css`
- `src/ges/shell.js`
- `src/ges/index.css`
- `src/routes/public-pages.js`
- `src/app.js`
- `src/ges/project-nav.js`
- `src/styles.css`
- `about/index.html`
- `faq/index.html`
- `contact/index.html`
- `administrative/index.html`
- `docs/ges/layout.md`
- `docs/ges/components.md`
- `docs/ges/README.md`
- `docs/publication-reports/ges-public-layout-phase-02.md`

## Layout Structures Created Or Modified

Created the canonical Public Layout support in `src/ges/public-layout.js`.

Prepared layout constants for:

- Public Layout
- Internal Layout
- Printable Layout
- PDF Layout
- Minimal Layout

Extended `src/ges/shell.js` with:

- `createGesPublicShell()`
- `createGesInternalShell()`
- Public Layout inheritance through `createGesArticleShell()`

Public Layout now sets document-level layout attributes:

- `data-ges-layout="public"`
- `data-ges-page-type`
- `data-ges-route`

## Footer Component

Created `ensureGesPublicFooter()` and `renderGesPublicFooter()`.

The public footer includes:

- About
- FAQ
- Contact
- Administrative
- Copyright
- Guided Editorial System identity
- Deployment version

Reserved future footer slots:

- Source code
- Release notes
- County attribution
- Open-source attribution
- Data/source provenance
- Accessibility contact

## Existing Content Reused

Reused existing Guided Parcel Review footer-panel content from `data/app/site-copy.json` for:

- About summary
- Terms of Use
- Privacy Policy
- Accessibility Statement
- Contact/support guidance

No new privacy, terms, or accessibility legal content was invented.

## Placeholder Routes Added

Static route wrappers were added for:

- `/about/`
- `/faq/`
- `/contact/`
- `/administrative/`

These wrappers provide static clean URLs only. They do not duplicate layout/footer markup. Runtime content and footer behavior are inherited from the centralized public route renderer.

The Administrative route includes anchor sections for:

- Privacy Policy
- Terms of Use
- Accessibility Statement
- Legal Notices
- Copyright
- Source/Data Notices

## Public/Internal Visibility Logic

Public pages inherit the public footer through `createGesPublicShell()` and `createGesArticleShell()`.

Internal or non-public routes do not receive `[data-ges-public-footer]`.

The legacy app footer remains separate from the GES Public Footer. Article routes still hide the legacy app footer, but now allow `[data-ges-public-footer]`.

Hash-only administrative anchors are preserved by `appendTrackingParam()` so tracking propagation does not rewrite local section navigation.

## Metadata Handling

Added `applyGesPublicMetadata()` for centralized public metadata support:

- title
- description
- canonical URL/path
- social title
- social description
- social image
- author
- published date
- modified date
- page type
- keywords/tags/categories

The placeholder public routes use the shared metadata helper. Existing mature article routes retain route-specific structured data and can migrate common metadata into this helper in later cleanup.

## Validation

Passed:

- `node --check src/ges/public-layout.js`
- `node --check src/ges/shell.js`
- `node --check src/routes/public-pages.js`
- `node --check src/app.js`
- `node --check src/ges/project-nav.js`
- `node --check /private/tmp/verify-ges-public-layout.mjs`
- `/private/tmp/verify-ges-public-layout.mjs`
- `scripts/test-internal-project-nav.mjs http://127.0.0.1:4203 /private/tmp/gpr-internal-nav-public-layout`
- Hash-only anchor smoke check for `appendTrackingParam("#privacy-policy")`
- `git diff --check`
- Runtime Tailwind dependency search for host/source paths

The public layout verifier checked desktop and mobile for:

- Public pages inherit Public Layout.
- Article pages inherit Public Layout.
- Internal/non-public routes do not receive the public footer.
- Exactly one public footer appears where expected.
- Footer links route to clean placeholder routes.
- Administrative local section navigation exists.
- Metadata and canonical links are present.
- Footer follows `main`.
- Reading Progress remains on article routes.
- Resources Blocks remain before the public footer.
- No horizontal overflow.

Note: the broad existing `scripts/verify-global-header.mjs` currently fails on a BOE sticky-column assertion unrelated to this public layout change. The focused public layout verifier and internal project navigation verifier passed.

## Remaining Work

- Write full About page content.
- Write full FAQ page content and decide which guided-step FAQs should be promoted.
- Write full Contact page content and final channel guidance.
- Complete legal review for Privacy Policy, Terms of Use, Accessibility Statement, Legal Notices, Copyright, and Source/Data Notices.
- Add optional future footer slots only when real content exists.
- Migrate mature article metadata helpers into `applyGesPublicMetadata()` when route-specific JSON-LD can be preserved cleanly.
- Add future public layout variants for search results, 404, calendar, glossary, QR-linked parcel summaries, and public tools as those pages are built.
