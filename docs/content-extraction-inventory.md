# Content Extraction Inventory

This inventory tracks the user-facing copy reviewed during the centralized-copy pass.

## Extracted To `data/app/site-copy.json`

- Site metadata: document title, description, and load-error heading.
- Guided navigation: step labels, progress template, continue labels, and next-step button labels.
- Route metadata: guided-step eyebrow, label, question, title, description, panel id, and secondary-route metadata.
- View headers: top-page eyebrow, title, description, and image alt text.
- Start page: intro, callout, cards, coverage labels, and demo disclaimer.
- Static guided page sections in `index.html`: transition copy, handoff copy, property-details intro, decision checks, assessment headings, market context headings, tax-context headings, county/state comparison headings, footer panels, and modal headings.
- Footer resources: FAQ titles, form titles, footer panel labels, policy text, site-link labels, and route aliases.
- Modal shell copy: assessment dates, record correction, source table, and image gallery controls.
- Record correction request choices: review statuses, category titles, category descriptions, and category examples.
- Record correction/download request text: PDF title, PDF section headings, field labels, empty states, email subject/body shell, acknowledgment, and contact-method labels.

## Kept As Data Or Domain Content

- Property record values, addresses, owners, parcel ids, districts, legal descriptions, photos, and record-card source strings.
- Tax statement values, levy values, credits, effective tax rates, history rows, and tax-district authority names.
- Market, PAD, CTL, IAAO, ratio-study, and county statistics data.
- Official form titles, deadline labels, legal references, and source citations already stored in structured data files under `data/app`, `data/statewide`, `data/counties`, or `data/standards`.

## Still Hardcoded Intentionally

- Formatting units and very small generated fragments, such as `year`, `years`, `item`, `items`, `Pending`, `Notice`, symbols, punctuation, and chart operators. These are tied to table formatting or grammar around dynamic values.
- Developer-facing errors and internal pipeline labels where text is not public UI copy.
- Some generated narrative templates in chart/report modules. They combine statistical values, class names, and thresholds and need a second, lower-risk template pass so calculations and chart behavior stay unchanged.
