# Team Handoff Map

This document names the handoff surfaces for teams that may inherit, integrate, audit, or extend the current static prototype. It reflects the repo's current shape: static JSON, browser-rendered views, lightweight data-contract checks, and no production backend.

The goal is not to freeze the final architecture. The goal is to make the current boundaries explicit enough that future backend, data, QA, design, accessibility, security, and implementation work has a legitimate starting point.

## Current System Shape

```text
static JSON files -> data-service loader -> app/domain models -> charts/renderers/reports -> static browser UI
```

Important current boundaries:

- Demo inventory and shared data wiring: `data/app/property-manifest.json`
- Property records: `data/property-records/mips/*-record-card.json`
- County/state reference data: `data/counties/` and `data/statewide/`
- App boot/data loading: `src/data-service.js` and `src/app.js`
- App-ready model assembly: `src/domain/property-snapshot.js`
- Rendering and guided routes: `src/render.js`, `src/routes/`, `src/config/taxpayer-journey.js`
- Charts and county/equalization context: `src/charts.js`, `src/charts/`
- Reports: `src/reports/`, `src/assessors-report.js`
- Lightweight contract checks: `scripts/validate-data-contracts.js`
- Schema placeholders: `docs/data-contracts/`

## Handoff Status

| Area | Current status | Placeholder to mature later |
| --- | --- | --- |
| Data contracts | Lightweight schema and smoke validation exist. | Replace or extend with full JSON Schema/Zod/OpenAPI validation. |
| Backend/API | No backend; static JSON is the API stand-in. | Define endpoints that emit the same app-ready contracts. |
| Database | No database schema. | Map normalized parcel, tax, levy, CTL, ratio, source, and user-submission tables to app contracts. |
| ETL/source refresh | Manual/static source data. | Define extraction, reconciliation, lineage, and refresh cadence. |
| Frontend | Static app shell with component-ish modules and CSS conventions. | Extract reusable components if moving into a framework. |
| QA | Manual smoke checks and data-contract script. | Add fixture matrix, browser coverage, regression assertions, and accessibility checks. |
| Design/UX | Implemented responsive and judgment-neutral rules in CSS/content. | Convert recurring patterns into design-system tokens/components. |
| Accessibility | Semantic landmarks, modal roles, and keyboard basics exist. | Formal audit for focus order, chart alternatives, SR copy, contrast, and Safari/iOS behavior. |
| Content/legal | Neutral orientation copy and source disclaimers exist. | Formal policy/legal review of taxpayer guidance, deadlines, and non-advice language. |
| DevOps | Static hosting model works. | Add production build/deploy, cache strategy, API env config, monitoring. |
| Security/privacy | No production submissions or auth. | Review PII, correction-request delivery, logs, retention, external links, and CSP. |
| Support/implementation | Sample-data workflow is understandable but manual. | Add operator playbooks for adding counties, updating annual data, and troubleshooting charts. |

## Backend/API Team

Backend developers should treat the current JSON files as fixture responses. The first production API does not need to match file paths, but it should emit equivalent app-ready shapes until the frontend is intentionally refactored.

Primary contracts to preserve:

- Manifest-like property inventory for demo/search/selection.
- A selected parcel record containing `guidedSnapshot`.
- County/state CTL rows with `year`, `countyName`, `totalValue`, `taxesLevied`, and `averageTaxRate`.
- Ratio/equalization datasets keyed by county, class, year, and metric.
- Tax district authority and levy component rows.
- Source/provenance metadata sufficient for visible citations.

Placeholder endpoint map:

```text
GET /api/properties
GET /api/properties/:propertyId
GET /api/counties/:countySlug/context
GET /api/counties/:countySlug/ctl
GET /api/counties/:countySlug/ratio-analysis
GET /api/counties/:countySlug/tax-districts/:taxDistrict
GET /api/statewide/ctl
GET /api/reference/calendar
GET /api/reference/forms
POST /api/record-correction-requests
```

Open decisions:

- Whether the backend returns raw vendor records, app-ready snapshots, or both.
- Whether source/provenance is bundled with each response or requested separately.
- How to represent pending current-year values and not-yet-final tax bills.
- How user-submitted correction requests are delivered, stored, and audited.

## Database / Data Modeling Team

The database should not mirror the current JSON files one-to-one. The JSON is optimized for a static frontend demo. A database should normalize durable entities, then project app-ready responses through the backend/API layer.

Candidate entity groups:

- Parcel identity and situs/mailing addresses.
- Ownership and classification history.
- Assessment-year value breakdowns.
- Tax-statement years, credits, payments, and final/net tax amounts.
- Levy authorities, tax districts, levy rates, and district membership.
- CTL county/state yearly facts.
- Ratio-study county/class/year metrics.
- Market/valuation group statistics.
- Source documents, extraction ledger rows, and reconciliation notes.
- User record-correction submissions.

Modeling placeholders:

- Stable primary keys for parcel, county, tax district, authority, source document, and yearly metric rows.
- Clear distinction between `assessmentYear`, `taxYear`, `reportYear`, and `statementYear`.
- Unit columns or typed numeric columns where source units can differ.
- Audit tables for source imports and manual reconciliations.

## Data / ETL Team

The app should continue to distinguish source values from derived/app-ready values. ETL should preserve enough lineage to explain every visible figure.

Current source anchors:

- `data/sources/nebraska-pad-source-registry.json`
- `data/sources/nebraska-pad-metric-ledger.json`
- `docs/source-provenance-audit.md`
- `docs/data-dictionary.md`

ETL placeholders:

- Source acquisition method and official URL.
- Extraction date and source publication date.
- Transformation rules for each metric.
- Validation rules and acceptable null/pending states.
- Reconciliation notes when source-card values differ from final assessed values.
- Annual refresh checklist for CTL, ratio-study, calendar, forms, and tax district authority data.

## Frontend Team

The frontend is currently plain HTML/CSS/JS with modular renderers. If it moves into a framework, preserve the route and data boundaries before changing visual behavior.

Stable frontend concepts:

- Guided route order: `src/config/taxpayer-journey.js`
- Static shell and route mount points: `index.html`
- Main rendering: `src/render.js`
- Route-specific rendering: `src/routes/`
- Chart rendering: `src/charts.js`
- Shared formatting/display helpers: `src/format.js`, `src/utils/`
- Design tokens and responsive rules: `src/styles.css`

Frontend placeholders:

- Component inventory for cards, tables, modals, charts, route headers, and next-step controls.
- Framework migration plan if React/Vue/Svelte/etc. is introduced.
- Chart/table alternative text strategy.
- Regression screenshots for mobile, tablet portrait, tablet landscape, and desktop.

## QA / Testing Team

Current validation is intentionally light. QA should build from the existing data-contract script and browser smoke checks.

Minimum fixture matrix:

- Residential, commercial, and agricultural sample records.
- Pending current-year assessed value.
- Finalized tax year present and absent.
- Missing/zero value breakdown fields.
- County CTL rows with added future years.
- Tax district with many authorities.
- Mobile Safari and tablet portrait layouts.

Suggested checks:

- Run `node scripts/validate-data-contracts.js`.
- Run `node --check` across JS files.
- Verify route navigation and URL hashes.
- Verify charts render nonblank and use the expected year range.
- Verify modals open/close by click, keyboard, and touch.
- Verify downloadable reports generate without runtime errors.

## Design / UX Team

The product language should remain neutral, explanatory, and sequential. The interface should help users understand what they are seeing without implying a filing recommendation or a good/bad judgment.

Current design rules worth preserving:

- Completed step rail uses green; active step uses blue.
- Value/tax/equalization cards avoid judgment-color backgrounds unless the meaning is explicitly neutral.
- Dense operational screens should stay organized and scannable, not landing-page-like.
- Mobile/tablet portrait layouts may stack charts and tables to preserve comprehension.
- Bottom next-step CTAs are forward navigation, not outcome recommendations.

Design placeholders:

- Token inventory for color, type, spacing, elevation, and chart palettes.
- Component states for hover, active, focus, disabled, loading, and pending data.
- Responsive breakpoint spec tied to tested devices/viewports.

## Accessibility Team

The app has basic semantic structure, but it has not had a formal accessibility audit.

Audit targets:

- Guided stepper keyboard behavior and screen-reader labels.
- Modal focus management, especially on iOS Safari.
- Chart alternatives for users who cannot perceive visual charts.
- Table headings and row/column relationships.
- Color contrast for muted text, badges, and chart legends.
- Motion/animation behavior under reduced-motion settings.
- Form controls in the property switcher and correction-request surfaces.

Accessibility placeholders:

- Define text equivalents for each chart's main takeaway.
- Add automated checks with axe or equivalent.
- Add manual SR pass notes for Safari/iOS and desktop browsers.

## Content / Policy / Legal Review

The app explains public assessment and tax concepts. Content reviewers should verify that copy is accurate, neutral, and appropriately scoped.

Review areas:

- Disclaimers around official records controlling.
- Deadline and calendar language.
- Protest, filing, and record-correction wording.
- Tax payment/status language.
- Equalization and review-signal explanations.
- Source citations and publication-year references.

Policy placeholders:

- Approved terminology list.
- Jurisdiction-specific copy overrides.
- Required legal/source disclaimers.
- Process for annual review of dates, forms, and official links.

## DevOps / Deployment Team

The app is currently static and deployable to GitHub Pages or any static host. There is no build step.

Current assumptions:

- Static files are served directly.
- `server.js` is only a local development helper.
- CDN scripts provide Tailwind and Chart.js.
- JSON files are browser-readable assets.

Deployment placeholders:

- Cache-busting strategy for JSON and CSS/JS.
- CDN dependency policy or vendoring plan.
- Environment-specific API base URL if a backend is introduced.
- Error logging and uptime checks.
- Branch/release policy for public demo updates.

## Security / Privacy Team

The current app does not authenticate users and does not submit data to a production service. That changes if correction requests, parcel searches, or user accounts become real.

Security placeholders:

- PII classification for owner, mailing address, parcel search, and correction-request data.
- Retention and deletion policy for submissions.
- Log redaction requirements.
- CSP and external-link policy.
- Abuse/spam handling for public forms.
- Email/service integration review for `window.propertyCorrectionEmailService`.

## Support / Implementation Team

Implementation teams need operating notes as much as code contracts.

Future playbooks:

- Add a sample property.
- Add a county.
- Refresh CTL data for a new year.
- Refresh ratio-study data for a new report year.
- Update tax district authorities.
- Validate source citations.
- Troubleshoot missing charts, broken images, and stale range text.

Until those playbooks exist, start with:

- `README.md`
- `data/README.md`
- `docs/data-dictionary.md`
- `docs/vendor-handoff.md`
- `scripts/validate-data-contracts.js`
