# GES Resources Block Audit

Date: 2026-06-28

## Scope

Audited public article routes:

- `/?article=levy-compression`
- `/?article=protest-evidence-guide`
- `/articles/before-you-walk-into-a-property-protest/`
- `/?article=protest-paradox`
- `/articles/assessment-up-protest-denied-taxes/`

Audited design-system documentation:

- `/ges/`

## Result

All current public article pages now render one reusable `ges-resources-block` after article closing content and after any related/continuation offering.

The block is generated through `renderResourcesBlock()` in `src/ges/article-components.js`; no article received a manually pasted static bibliography.

## Article Sources Included

### Levy Compression

Resources Block added.

Included sources:

- 2026 Reports and Opinions of the Property Tax Administrator - Gage County.
- User-entered budget growth and effective tax-rate assumptions.

Human review:

- The model-input entry is intentionally unlinked because it describes reader-entered assumptions, not an external authority.

### Before You Walk Into a Property Protest

Resources Block added by migrating and expanding the existing bottom `sourcesUsed` data.

Included sources:

- Nebraska Constitution, Article VIII, section 1.
- Nebraska Revised Statutes, Chapter 77.
- Title 350, Nebraska Administrative Code, Chapter 10.
- IAAO Course 101, Fundamentals of Real Property Appraisal.
- Nebraska Property Assessment Division Reports & Opinions.
- Gage County GIS / Property Record Lookup.
- Gage County Sales Comparison Map.
- Nebraska Property Valuation Protest Form 422.

Human review:

- The IAAO Course 101 entry remains unlinked because the article data did not contain a durable source URL.
- The PAD Reports & Opinions entry remains unlinked in this article because the prior source data identified it as assessment-practice context without a specific document URL.

### Assessment Up. Protest Denied. Taxes?

Resources Block added.

Included sources:

- Gage County property record card for parcel 004817000.
- Nebraska Taxes Online tax-year records for parcel 0004817000.
- 2026 Reports and Opinions of the Property Tax Administrator - Gage County.
- 2026 Reports and Opinions index.

Human review:

- The parcel-specific Gage County record entry links to the public property-record lookup, not a permanent parcel-specific URL.
- The Nebraska Taxes Online entry is unlinked because no durable parcel-specific public URL is stored in the project.

## Articles With No Obvious Resources

None among current public article routes.

## Experiments, Guides, And Educational Pages

The component is now available to articles, guides, experiments, public tools, generated summaries, and HTML-driven printable views through the shared GES article component module.

No experiment route was given a new Resources Block in this pass because the task scope was public article pages and no experiment had a current article-level resource appendix to migrate.

## PDF Wiring

Browser print preserves the Resources Block and exposes resource URLs for linked entries.

Generated article PDF assets were not regenerated in this pass. Future PDF/report work should wire `renderResourcesBlock()` into any HTML-to-PDF article generation flow. Lower-level canvas/PDF drawing in `src/reports/pdf-report-kit.js` remains separate and would require a dedicated renderer if those reports need the same source appendix.

## Validation

Rendered audit used headless Chrome against desktop, tablet, and mobile viewport sizes.

Checks performed:

- exactly one Resources Block on each public article route
- semantic heading present
- expected minimum resource entries present
- Resources Block appears after article closing content
- Resources Block appears after related/continuation content where present
- Resources Block appears before the public footer
- no vague link text such as "click here"
- external links include `noopener noreferrer`

Result: no failures.
