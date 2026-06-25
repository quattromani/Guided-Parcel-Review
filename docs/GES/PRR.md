# Guided Editorial System

## Final Pre-Commit Review

The Final Pre-Commit Review is the release checklist for Guided Editorial System articles.

Use it after writing, editorial design, implementation, metadata, accessibility work, print work, and publication packaging are complete. Treat it as the final pre-merge inspection: the article should already be feature-complete, and the review should polish, simplify, verify, and stabilize.

Do not use this checklist as permission to redesign the page, introduce new concepts, or substantially rewrite the article. If a change does not measurably improve the publication, leave it alone.

The objective is to leave the codebase cleaner, more maintainable, and more consistent with GES than when the review began.

## 1. Editorial Polish

Read the article as a homeowner.

Not as a developer.

Not as an assessor.

Look for:

- awkward transitions
- repeated ideas
- unnecessary words
- inconsistent tone
- pacing issues
- typography inconsistencies
- visual rhythm
- readability

Only make changes that improve clarity.

Do not rewrite simply to rewrite.

## 2. GES Consistency

Verify that the article follows the Guided Editorial System.

Check:

- Hero
- Narrative opening
- Section kickers
- Concept diagrams
- Process strip
- Comparison modules
- Evidence modules
- Reference modules
- Script card
- Resource cards
- Closing reflection

Confirm that every component belongs.

Remove anything that no longer earns its place.

## 3. HTML Cleanup

Audit semantic HTML.

Verify:

- single H1
- heading hierarchy
- article
- header
- section
- figure
- figcaption
- aside
- table
- lists
- footer
- ARIA
- landmarks

Remove unnecessary wrappers.

Remove redundant div nesting.

Simplify markup where possible.

## 4. CSS Cleanup

Review CSS for:

- unused rules
- duplicate declarations
- redundant specificity
- magic numbers
- hard-coded spacing
- inconsistent variables

Prefer:

- design tokens
- semantic color variables
- spacing scale
- typography scale

Remove dead CSS.

Consolidate reusable styles.

## 5. Component Review

Ensure reusable components are actually reusable.

Review naming.

Examples:

- `article-hero`
- `hero-meta`
- `hero-action`
- `process-strip`
- `comparison-card`
- `concept-diagram`
- `reference-module`
- `evidence-matrix`
- `record-callout`
- `script-card`
- `resource-card`

Avoid page-specific names.

Think publication-wide.

## 6. Icon Review

Verify:

- consistent icon family
- consistent sizing
- consistent stroke weight
- consistent spacing
- semantic usage

Remove decorative icons.

Icons should only:

- orient
- teach
- reinforce

Never decorate.

## 7. Color Review

Verify semantic color usage.

Core roles:

- Information
- Evidence
- Comparison
- Action
- Reflection

Ensure colors communicate editorial roles rather than decoration.

Reduce any unnecessary color.

Keep the page calm.

## 8. Responsive Review

Review:

- desktop
- tablet
- mobile
- large monitors

Ensure:

- comfortable line length
- good spacing
- cards stack cleanly
- tables remain readable
- no horizontal scrolling
- no awkward wrapping

## 9. Print Review

Perform a print audit.

Verify:

- page breaks
- resource URLs
- table integrity
- card integrity
- heading continuity
- figure placement
- paper friendliness
- grayscale readability

The article should print as cleanly as it reads online.

## 10. Accessibility Review

Verify:

- contrast
- keyboard navigation
- focus order
- ARIA
- alt text
- visible URLs
- screen reader friendliness
- color independence
- accessible tables
- accessible diagrams

## 11. Performance Review

Review:

- image sizes
- SVG optimization
- font loading
- unused assets
- CSS efficiency
- HTML cleanliness

Ensure no unnecessary assets remain.

## 12. Metadata Review

Verify:

- `<title>`
- meta description
- canonical URL
- OpenGraph
- Twitter Card
- JSON-LD
- article metadata
- reading time
- revision date
- author
- publication date
- structured data

Ensure everything reflects the latest revision.

## 13. Internal Linking

Review opportunities for:

- existing related articles
- future companion articles
- Guided Parcel Review
- Levy Compression
- Assessment Basics
- Comparable Sales
- Property Records

Do not force links.

Add only where genuinely useful.

## 14. Asset Audit

Verify:

- optimized images
- optimized SVGs
- unused assets removed
- consistent filenames
- descriptive alt text
- resource organization

Confirm no temporary development assets remain.

## 15. Code Quality

Look for:

- TODO comments
- console logging
- debug code
- temporary classes
- unused variables
- placeholder text
- commented-out code
- development experiments

Remove anything not intended for production.

## 16. Publication Polish

Ask:

- Does this feel like one of our publications?
- Would another GES article naturally resemble this?
- Does it teach calmly?
- Does it reduce uncertainty?
- Does it feel timeless?
- Would I be proud to print this?
- Would I confidently hand this to a homeowner?

If the answer is no, recommend only the smallest changes necessary.

## 17. Git Commit Readiness

Produce a concise release summary.

Suggested format:

```md
## Publication Summary

Article:
Version:
Revision Date:

### Improvements Since Last Revision

-
-
-

### Components Added

-
-
-

### Technical Improvements

-
-
-

### Accessibility Improvements

-
-
-

### GES Improvements

-
-
-

### Outstanding Items

-
-
-

### Commit Recommendation

Ready to Commit
```

Use one of these recommendations:

- Ready to Commit
- Minor Cleanup Recommended
- Hold Commit

## Final Rule

Do not chase perfection.

Polish.

Simplify.

Stabilize.

Respect the work already completed.

The goal is to leave the repository cleaner, more maintainable, and more consistent with the Guided Editorial System than when this review began.

If a change does not measurably improve the publication, leave it alone.

**Commit quality compounds.**
