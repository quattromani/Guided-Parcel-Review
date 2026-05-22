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

## Duplicate Semantic Copy Identified

These repeats were identified during validation and left unchanged so this pass does not silently rewrite wording:

- Route questions/descriptions repeated as view-header titles/descriptions:
  - "Are assessments checked for level and consistency?"
  - "Equalization checks whether assessments meet required levels and are applied consistently."
  - "How does the county compare statewide?"
  - "Use statewide CTL data as broader context."
  - "Check whether the source facts line up."
- Reused image alt text:
  - "Map of Nebraska highlighting Gage County"
  - "Map of Nebraska highlighting the local market area"
- Reused source note:
  - "Source: 2019-2025 Nebraska Certificates of Taxes Levied (CTL)."
- Footer resource defaults duplicated with active route resources:
  - "Property record FAQs"
  - "Property record forms"
- Display label reused in two contexts:
  - "Legal description"

## Editor Recommendations Held For Review

- `pages.your-taxes.countyBaseline.intro`: an editor suggested changing "broader value base" to "broader tax base." Hold for internal policy/legal terminology review before changing tax-base framing.
- `footer.panels.privacy.notes.2`: an editor suggested changing "This site should not sell personal information" to "This site does not intend to sell personal information." Hold for legal/privacy review before changing prototype privacy language.

## Validation Notes

- `src/content/site-copy.js` now fails open. If `data/app/site-copy.json` cannot be fetched or parsed, the app keeps booting with built-in fallback copy.
- `src/routes/start-page.js` includes complete fallback content to avoid visible `undefined` text when centralized copy is unavailable.
- The copy file has no numeric JSON values. Numeric strings are limited to document title/year, step numbers, section numbering, repeated CTL source years, and explanatory "Nebraska = 100" copy.
- The copy file is still acceptable as one file for this static prototype because it is route/page/component grouped and under 600 lines. If county/vendor overrides grow, split by stable top-level groups rather than by renderer file.
