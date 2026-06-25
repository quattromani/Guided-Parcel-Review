# Transitional Publication Readiness Review: Assessment Up. Protest Denied. Taxes?

Review date: June 25, 2026
Review pass: GES transitional PRR v1.0, shared-route migration addendum
Article status: Permanent shared GES article route with printable PDF
Recommendation: Ready for Publication

## Executive Summary

The Protest Paradox article is ready for publication. It gives readers a clear civic lesson: a higher assessment does not automatically produce a higher tax bill, because the final tax impact depends on a property's movement relative to the tax base and local budget decisions.

This PRR made four publication-readiness improvements:

- Replaced excerpt-style social metadata with stable article title and description metadata.
- Added article author/date metadata and JSON-LD structured data.
- Removed unused transitional CSS from earlier drafts and promoted the closing section heading to a clean H2.
- Migrated the permanent article into the same app-rendered GES article shell, outline pattern, and shared class system used by "Before You Walk Into a Property Protest."

Shared-route addendum: the article now has a permanent app-rendered route and printable PDF package. The old experiment page remains available as a working copy but canonicalizes to the permanent URL.

## Article Identity

Title: Assessment Up. Protest Denied. Taxes?
Canonical URL: `https://quattromani.github.io/Guided-Parcel-Review/articles/assessment-up-protest-denied-taxes/`
Current path: `articles/assessment-up-protest-denied-taxes/`
Legacy working copy: `experiments/the-protest-paradox.html`
Author: Max Quattromani
Publication date: June 23, 2026
Revision date: June 25, 2026
Primary audience: Gage County property owners trying to understand assessment notices, protests, levy compression, and tax-bill impact
Primary format: Case study with embedded calculator

## Editorial Quality Review

Editorial score: 8.9/10

Strengths:

- The headline is memorable and accurately frames the paradox.
- The opening case is specific enough to teach without becoming procedural clutter.
- The article separates valuation movement from tax movement in plain language.
- The "share" framing gives readers a durable mental model.
- The calculator turns the case study into a practical reader exercise.
- The tone stays calm and non-adversarial toward the Board of Equalization, assessors, and local governments.

Watch items:

- The story references a specific parcel and local context, so source freshness matters.
- The calculator is helpful but should continue to be tested after any print-CSS change.

Refinements completed:

- Cleaned social and search metadata so previews use the article title instead of an excerpt.
- Added structured article metadata.
- Improved heading hierarchy for the closing reflection.
- Rebuilt the published route through `src/routes/protest-paradox.js` so the HTML outline and visual classes match the new shared GES article system.

## GES Compliance

GES compliance: 94/100

Components present:

- Article hero
- Learning preview
- Narrative case opening
- Timeline card
- Value-change comparison card
- Tax KPI grid
- Core concept callout
- Three-part explanatory framework
- Levy compression concept module
- Transition card
- Component-change bars
- Interactive estimate calculator
- Calculation explanation
- Better-question callout
- Closing reflection
- Sources footer

Legacy notes:

- The legacy experiment page remains available for comparison, but its canonical metadata now points to the permanent route.
- The permanent route uses the same shell classes, card language, section structure, and article instrumentation pattern as the current GES protest guide.

## Semantic HTML And Accessibility

Status: Pass for publication.

Verified:

- One H1.
- Section headings resolve cleanly.
- No missing `aria-labelledby` references.
- Calculator inputs have visible labels.
- Calculator results use `aria-live="polite"`.
- Important article content is selectable HTML.
- Color reinforces concepts but is not the only explanation.

Change made:

- Promoted "One Final Thought" from H3 to H2 to keep the closing section aligned with surrounding article sections.

Follow-up:

- Keep the print-specific calculator fallback rules in sync with any future calculator markup changes.
- Consider a visually hidden explanatory note for the calculator model if user testing shows the assumption fields need more screen-reader context.

## Performance And Code Quality

Status: Good.

Verified:

- `src/routes/protest-paradox.js` and `src/app.js` pass syntax checks.
- Browser console had no warnings or errors during local verification.
- Social image exists at 1200 x 630.
- Calculator edits update outputs as expected.
- Desktop and mobile rendered without horizontal overflow.

Code improvements completed:

- Removed 344 lines of unused transitional CSS selectors.
- Confirmed no remaining references to the removed dead CSS classes.
- Preserved live layout and calculator behavior after cleanup.
- Added narrowly scoped shared-route CSS for the case calculator and route-specific grids while reusing the GES article shell, packets, cards, markers, and print system.

## Search, Metadata, And Structured Data

Status: Implemented for publication.

Implemented:

- Stable `<title>`.
- Concise meta description.
- Canonical URL on the permanent route.
- OpenGraph title and description.
- Twitter title and description.
- 1200 x 630 social image metadata.
- Author metadata.
- Published and modified dates.
- Article JSON-LD.

Focus query:

why did my property taxes go down after my assessment went up

Supporting search phrases:

- assessment went up taxes went down
- property tax levy compression
- how property assessments affect tax bills
- property valuation protest denied tax bill decreased
- Gage County property tax assessment increase

Featured snippet opportunities:

- "Can taxes go down after an assessment increase?"
- "What is levy compression?"
- "How do I estimate the tax impact of a new valuation notice?"

## Analytics Readiness

Status: Implemented at a useful level.

Existing instrumentation:

- Article view.
- Scroll depth.
- Section reach.
- Calculator field start.
- Calculator field completion.
- Calculator exercise completion.

Recommended future events:

- `share_article`
- `print_article`
- `copy_link`
- `related_article`
- `download_pdf`

## Social Publishing Package

OpenGraph title:

Assessment Up. Protest Denied. Taxes?

OpenGraph description:

A Gage County case study showing why property taxes can fall after an assessment increase, and how levy compression changes the tax impact of a valuation notice.

Facebook primary:

A property owner protested a valuation increase. The Board left the value unchanged. The next tax bill went down anyway.

That sounds contradictory until you look at the part most people miss: property taxes are about share. This case study walks through how levy compression can reduce the rate even when one property's assessment rises.

Facebook short:

Assessment up. Protest denied. Tax bill down. This case study explains how levy compression can make that possible.

Facebook discussion question:

When you receive a new valuation notice, do you look first at the value change or at how your property moved compared with the rest of the tax base?

LinkedIn:

This case study is a useful reminder that assessed value and final tax impact are connected, but not identical. A property can increase in value while its tax bill falls if the broader tax base grows faster than the budget. The practical lesson for taxpayers is to ask not only "What is my new value?" but "How did my property move compared with everyone else?"

Bluesky / Threads / X:

Assessment up. Protest denied. Tax bill down.

It sounds impossible until you remember that property taxes are about share. This case study explains how levy compression can change the tax impact of a valuation notice.

Suggested hashtags:

#PropertyTax #Assessment #LocalGovernment #GageCounty #CivicData

Social image:

Use `assets/images/protest-paradox-share.jpg` at 1200 x 630. Crop is already share-sized.

## Knowledge Graph

Key concepts:

- Assessment increase
- Board of Equalization protest
- Tax base
- Levy compression
- Effective tax rate
- Relative movement
- Budget growth
- Countywide value growth
- Tax impact estimate

Definitions:

- Levy compression: The downward movement of a tax rate when the taxable base grows faster than the amount of tax pressure that must be collected.
- Relative movement: A property's value change compared with the movement of the broader tax base.
- Effective tax rate: Net taxes divided by assessed value.

Referenced agencies and sources:

- Gage County Board of Equalization
- Gage County Assessor
- Nebraska Taxes Online
- Nebraska Property Assessment Division Report and Opinion

Referenced datasets:

- Gage County property record card for parcel `004817000`
- Nebraska Taxes Online records for parcel `0004817000`
- 2026 Gage County Report and Opinion

Related articles:

- `articles/before-you-walk-into-a-property-protest/`

Future companion articles:

- A plain-language levy compression explainer.
- A valuation notice worksheet.
- A budget-to-tax-bill explainer for local taxing authorities.

Reusable components:

- Value-change card.
- Tax KPI grid.
- Three-part share framework.
- Levy compression callout.
- Interactive tax-impact calculator.

## Verification Log

Local URL tested:

`http://127.0.0.1:4176/articles/assessment-up-protest-denied-taxes/`

Checks completed:

- Browser metadata audit.
- JSON-LD parse check.
- Heading hierarchy check.
- Missing ARIA reference check.
- Shared GES shell/class audit.
- Desktop horizontal overflow check.
- Mobile 390 x 844 overflow check.
- Calculator edit check using `$300,000` as a replacement value.
- JavaScript syntax check.
- Share image dimension check.
- Printable PDF generation.
- PDF render inspection from PNG pages.

Results:

- H1 count: 1.
- Missing `aria-labelledby` references: 0.
- Console warnings/errors: 0.
- Shared article shell: present.
- Shared hero/cards: present.
- Desktop horizontal overflow: none.
- Mobile horizontal overflow: none.
- Calculator updated estimated taxes, annual change, and tax math correctly.
- Share image dimensions: 1200 x 630.
- PDF: `assets/guides/assessment-up-protest-denied-taxes.pdf`, 9 pages, Letter size, visually checked after render.

## Outstanding Items

- Reconfirm source values and local context before wider public promotion.
- Consider moving metadata and JSON-LD generation into a shared article route utility after one more GES article uses the pattern.

## Commit Recommendation

Ready to Commit.

The article is ready for publication. Do not hold for a broad redesign. Remaining items are incremental system improvements, not blockers for this PRR pass.
