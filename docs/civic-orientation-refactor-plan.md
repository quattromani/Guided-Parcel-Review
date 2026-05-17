# Civic Orientation Refactor Plan

Branch: `codex/civic-orientation-refactor`

Purpose: evolve the current working Property Snapshot prototype into a taxpayer-first civic orientation and comprehension system. This is a refactor of existing systems, not a disconnected rebuild.

## Product Principle

The application should help a property owner understand their own parcel with calm, procedural confidence. The primary journey should move from orientation to understanding before asking the user to decide whether anything deserves closer review.

Primary experience model:

```text
Confusion -> orientation
Uncertainty -> understanding
Stress -> procedural confidence
```

Information behavior model:

```text
Orient -> Observe -> Decide -> Act
```

The interface should answer three questions on every major view:

- Why am I seeing this?
- What matters here?
- What should I do next?

## 1. Project Folder Structure

Current structure is compact and static-site friendly. Keep that advantage, but separate shell, routes, data modeling, charts, content, and optional tools so the primary taxpayer journey stays easy to reason about.

Proposed target structure:

```text
.
├── index.html
├── server.js
├── docs/
│   └── civic-orientation-refactor-plan.md
├── src/
│   ├── app.js
│   ├── data/
│   │   ├── data-service.js
│   │   ├── snapshot-model.js
│   │   ├── notice-model.js
│   │   └── review-signal-model.js
│   ├── routes/
│   │   ├── landing-primer.js
│   │   ├── property-record.js
│   │   ├── what-changed.js
│   │   ├── valuation-detail.js
│   │   ├── tax-context.js
│   │   ├── review-signals.js
│   │   └── final-summary.js
│   ├── components/
│   │   ├── assessment-notice.js
│   │   ├── orientation-primer.js
│   │   ├── next-step.js
│   │   ├── trust-note.js
│   │   ├── disclosure.js
│   │   ├── source-note.js
│   │   ├── property-facts.js
│   │   └── metric-card.js
│   ├── charts/
│   │   ├── chart-theme.js
│   │   ├── value-history-chart.js
│   │   ├── tax-context-chart.js
│   │   ├── distribution-chart.js
│   │   ├── market-context-chart.js
│   │   └── chart-helpers.js
│   ├── resources/
│   │   ├── learn-more.js
│   │   ├── methodology.js
│   │   ├── advanced-context.js
│   │   └── forms.js
│   ├── services/
│   │   ├── pdf-service.js
│   │   └── storage-service.js
│   ├── config/
│   │   ├── navigation.js
│   │   ├── view-copy.js
│   │   └── visualization-palettes.js
│   ├── modal.js
│   ├── format.js
│   └── styles.css
├── data/
│   ├── app/
│   ├── properties/
│   ├── property-records/
│   ├── counties/
│   ├── statewide/
│   ├── calendars/
│   └── standards/
└── assets/
    ├── forms/
    ├── images/
    └── vendor/
```

Refactor target: do not move every file at once. First create route/component boundaries while preserving current imports, then migrate modules in small steps.

## 2. Branch-Aware Refactor Strategy

Current source branch was `guided-snapshot-refactor`; redesign work now lives on `codex/civic-orientation-refactor`.

Strategy:

- Preserve the current prototype as behavioral reference.
- Keep the current static app runnable during every phase.
- Avoid editing the existing dirty `README.md` unless that change is explicitly adopted.
- Prefer additive architecture first: introduce route contracts and component wrappers before deleting existing sections.
- Move existing features into primary or secondary lanes based on taxpayer comprehension, not implementation convenience.
- Keep current parcel JSON, record-card JSON, calendar, tax district, ratio, valuation group, CTL, IAAO, image, and PDF assets available throughout.
- Use visual regression screenshots during implementation because layout and cognitive pacing are product-critical.

## 3. Existing Component Inventory

Working systems currently present:

- Static app shell: `index.html`, `server.js`.
- App orchestration: `src/app.js`.
- Data loading and manifest routing: `src/data-service.js`.
- Normalized snapshot model: `src/snapshot-model.js`.
- Large taxpayer rendering module: `src/render.js`.
- Chart system using Chart.js: `src/charts.js`.
- Civic visualization palette: `src/config/visualization-palettes.js`.
- Formatting helpers: `src/format.js`.
- Image modal and property photo/sketch viewer: `src/modal.js`.
- Record correction request workflow: `src/recordCorrectionRequest.js`.
- Official real property form references: `data/app/real-property-forms.json`.
- Guided path navigation and section locking in `src/app.js`.
- Footer resource layer with FAQs, forms, and learn content in `src/app.js`.
- Static configuration: `data/app/property-manifest.json`, `data/app/navigation.json`, `data/app/view-copy.json`.
- MIPS record cards and guided parcel context: `data/property-records/mips/*-record-card.json`, with demo inventory in `data/app/property-manifest.json`.
- County/state/reference data: `data/counties/`, `data/statewide/`, `data/calendars/`, `data/standards/`.

Current view inventory:

- `your-property`: parcel identity, record details, photos, notice summary, record review.
- `your-assessment`: notice values, value movement, value/tax history, indexed chart.
- `your-taxes`: levy history, ETR, tax burden, levy authorities, and distribution.
- `market-area`: valuation group and PAD ratio/sales context.
- `county-equalization`: COD/PRD/COV/LOV and county comparison context.
- `state-context`: county/state CTL comparison.
- `review-checklist`: neutral review signals, unresolved questions, and summary handoff.

## 4. Reusable Component and Refactor Map

Primary journey reuse:

| Existing system | Preserve as | Change needed |
| --- | --- | --- |
| `valuationNoticeSummary` in `src/render.js` | NOV-like assessment snapshot component | Add explicit notice fields: assessment date, tax year, review deadline, current/prior values, dollar change, percent change, land, improvement. Support pending/null values calmly. |
| `renderPropertyDetails` | Property record route content | Split into identity, structure, land, valuation record, and source components. Reduce first-screen density. |
| `renderPropertyMovementSummary` and history table | What Changed route | Keep one dominant takeaway per chart/table. Add plain-language interpretation before technical rows. |
| `buildIndexedChart`, `buildTaxBurdenPattern`, `buildEtrChart` | Focused Observe charts | Simplify visible chart count. Keep data tables adjacent or available through disclosure. |
| `initMarketAreaView` | Valuation Detail or Advanced Context | Lead with concepts, then terminology. Default to secondary unless needed for "what may be driving value." |
| `renderTaxDistrictAuthorities`, `buildDistributionChart` | Tax Context resource | Keep in tax context, but make district detail secondary after the "value to taxes" explanation. |
| `initAssessmentRatioAnalysis`, county/state charts | Advanced Context/Methodology | Move off mainline route. Provide as optional system context. |
| Calendar normalization | Timeline/trust layer | Use only where it supports current-stage context or source grounding. |
| `recordCorrectionRequest.js` | Optional factual record review | Keep as neutral "request factual record review," not protest-adjacent escalation. |
| `data/app/real-property-forms.json` | Forms/resources | Link to official state forms only; do not prefill, print, submit, or store filings. |
| `resourcesByView` | Resource layer | Convert to route-specific Learn More, Advanced Context, Forms, and Methodology drawers. |

Likely removals from primary path:

- County equalization dashboard as a required mainline step.
- Statewide CTL comparison as a required mainline step.
- Form 422 packet as the terminal destination.
- Generated side-by-side evidence tools and prefilled protest or homestead forms.
- Dense multi-chart clusters that do not answer the route's primary question.

## 5. Route and View Architecture

Target primary route order:

```text
0. Landing / Primer
1. Orient / Property Record
2. Observe / What Changed
3. Observe / Valuation Detail
4. Check / Equalization
5. Understand / Tax Context
6. Decide / Review Signals
7. Final Review / Summary
```

Route contracts:

- Landing / Primer
  - Primary question: "You are looking at your property."
  - Required content: NOV-like assessment snapshot, parcel identity, current/prior value, land/improvement split, assessment date, tax year, review deadline if available, and "What you can do here."
  - Next step: "Review the property record."

- Property Record
  - Primary question: "Does the county record describe my property correctly?"
  - Content: parcel identity, situs, owner, legal, class, dwelling facts, land, structures, photos, record-card interpretation, source note.
  - Decision language: factual verification only.

- What Changed
  - Primary question: "What changed?"
  - Content: current/prior value change, land vs improvement movement, historical value movement, one plain chart, one value history table.
  - Decision language: "worth reviewing more closely" rather than "wrong."

- Valuation Detail
  - Primary question: "What may be driving the value?"
  - Content: cost approach, market group, valuation group, sales ratio context, terminology after concept explanation.
  - Mainline display: limited. Advanced panels hold deeper PAD and ratio-study material.

- Equalization
  - Primary question: "Is the value base being checked for fairness?"
  - Content: required level, uniformity, COD, PRD, and class-aware standards as taxpayer-facing context.
  - Language: "fairness check between value and tax," not a parcel outcome or levy-control tool.

- Tax Context
  - Primary question: "How do values connect to taxes?"
  - Content: value base, levy, exemptions/credits, effective tax rate, tax district summary, timeline for final tax bills.
  - Mainline display: education first, table/chart second.

- Review Signals
  - Primary question: "Is there anything worth reviewing more closely?"
  - Content: neutral signals: missing data, unusual movement, incomplete record, materially different context, no obvious discrepancies.
  - Language: "may warrant review," "appears generally consistent," "informational only."

- Final Review / Summary
  - Primary question: "What did I learn, and what are optional next steps?"
  - Content: reviewed facts, value movement, equalization context, tax context, review signals, source confidence, optional official resources.
  - Terminal feeling: informed, not pushed.

Route state should be hash-compatible at first, then can be promoted later to a real router if the app moves into a framework.

## 6. Shared Layout Architecture

Shared page pattern:

```text
Route header
Short orientation primer
Notice/context strip
Primary answer block
Supporting facts
Progressive disclosure area
Trust/source note
Next-step transition
Optional resource rail/drawer
```

Shared components:

- `AssessmentNoticeSummary`: legally familiar summary surface.
- `OrientationPrimer`: short "how to read this page" block.
- `WhatMatters`: two or three bullets max.
- `DecisionCheck`: neutral interpretive checkpoint.
- `NextStep`: route transition.
- `TrustNote`: source, pending status, official-record boundary.
- `DisclosureSection`: Learn More, Technical Detail, Methodology.
- `SourceNote`: source citation and freshness.
- `ChartWithExplanation`: chart, single takeaway, table fallback.

The page shell should avoid nested cards. Use full-width sections with constrained inner content, and reserve cards for repeated facts, tables, modals, and focused tools.

## 7. Mobile-First Design Strategy

The design must serve stressed users on phones first.

Mobile strategy:

- Make the NOV-like snapshot readable without horizontal scrolling.
- Use semantic paired label/value rows for compact assessment notice data under 640px; keep explanation-heavy value/status rows full-width.
- Keep navigation as a compact stepper or "current step + menu" control, not a long horizontal path.
- Keep one main question visible near the top of each view.
- Avoid chart-first mobile pages. Present takeaway text before canvas visuals.
- Provide table alternatives with short visible rows and disclosures for expanded data.
- Use touch targets of at least 44px.
- Keep line length short and type sizes stable. Do not scale fonts with viewport width.
- Prefer route-level progressive disclosure over dense accordions inside dense cards.

Implementation approach:

- Define layout primitives before restyling every section.
- Add mobile snapshot and chart screenshots as verification checkpoints.
- Use CSS grid/flex constraints for all fixed-format values, notice rows, tabs, and chart shells.

## 8. Progressive Disclosure Strategy

Progressive disclosure lanes:

- Mainline: necessary to answer the route's primary question.
- Learn More: plain-language concepts and definitions.
- Advanced Context: market area, county/state analytics, detailed ratio studies.
- Methodology: source and calculation explanation.
- Forms and Resources: official outbound forms and plain-language references.

Disclosure rules:

- Introduce concepts before terminology.
- Define technical terms at first contact.
- Hide system-level analytics until the user has property-level orientation.
- Keep protest filing as an official outbound reference, not an in-product preparation workflow.
- Avoid turning "more data" into a visual reward.
- Every disclosure label should describe user value, not internal data type.
- TODO: Consider progressive disclosure for official forms on mobile: show the top three most relevant forms first, then reveal the full official-forms list with a "Show all forms" control. Treat this as interaction refinement, not a filing workflow.
- TODO: Explore an assessment glossary as a non-mainline reference surface for plain-English terms. Prefer a static non-nav glossary page/view with clear "return to where you were" behavior over a dense modal if the glossary grows beyond a short route-level list.
- TODO: Refine the Learn footer on mobile with voluntary disclosure: use drawer/chevron guidance or a "See more terms" pattern so only the first few relevant definitions are visible by default, while preserving a path to the fuller glossary/reference view.
- TODO: Define analytics before launch. Use one Google tag or Google Tag Manager path, make consent/public-sector privacy decisions explicit, and track guided route/hash changes as virtual page views or events so single-page navigation, footer policy panels, assessment-date opens, and outbound official-form clicks are measurable without double-counting.
- TODO: After mobile, tablet, and desktop views are locked, sweep for visually identical or near-identical components and consolidate their markup/CSS where practical. Prioritize shared metric cards, voluntary disclosure controls, drawers, chart containers, and section headers; keep legitimate page-specific exceptions only when the content model requires them.
- TODO: After layout lock, clean and compress CSS/Sass where possible so repeated mobile overrides and one-off component rules are folded into reusable primitives without changing the approved visual behavior.

Example:

- Prefer: "Why land and building values are separate"
- Avoid: "Cost approach technical detail"

## 9. Trust and Reassurance Architecture

Trust must be continuous, not a single disclaimer.

Trust patterns:

- Always show which property the user is viewing.
- Distinguish pending current-year values from finalized tax years.
- Place source notes near interpreted data.
- Use neutral uncertainty language.
- Explain jurisdiction boundaries: assessor value vs tax levy vs treasurer bill.
- Clarify when content is informational and when official sources control.
- Use procedural dates and deadlines calmly, without alarmist copy.
- Normalize non-escalation outcomes such as "no obvious discrepancies identified."

Required trust components:

- `PendingStatusPill`: marks pending vs final values.
- `OfficialSourceNote`: cites MIPS, PAD, CTL, county data, or official form.
- `JurisdictionBoundaryNote`: explains who controls value, levy, tax bill, exemptions, and filing.
- `NoFindingState`: explicitly tells the user when the system has not found a concerning signal.

## 10. Information Scent and Navigation Architecture

Navigation should signal where the user is, why the step exists, and what comes next.

Primary navigation labels:

- Start
- Property Record
- What Changed
- Value Detail
- Equalization
- Tax Context
- Review Signals
- Summary

Each route should expose:

- Current step.
- Primary question.
- One-sentence purpose.
- Next step.
- Optional resource links.

Avoid:

- A long dashboard-style tab strip on mobile.
- Labels like "The County" or "The State" as required mainline steps.
- Navigation that implies protest is the natural destination.

Recommended nav behavior:

- Desktop: calm horizontal stepper with completed/current/upcoming states.
- Mobile: current step header with a menu of all steps.
- Hash links remain supported for direct section access.
- Legacy hash aliases map to new routes during transition.

## 11. Accessibility Strategy

Accessibility is product-critical because the audience includes older, stressed, and low-technical-literacy users.

Requirements:

- Preserve semantic landmarks: `main`, `nav`, `section`, `article`, `footer`.
- One logical `h1` per route state.
- Ensure all modals have focus trap, close button, escape handling, and focus return.
- Keyboard-operable stepper, disclosures, charts, and forms.
- Visible focus states across all controls.
- Color contrast checked for every palette role.
- Chart data available as text/table.
- Avoid color-only status communication.
- Avoid motion except small, optional focus/transition cues.
- Use plain language for buttons and form labels.
- Use `aria-live` only for status updates that matter.
- Keep source and uncertainty language close to the data it qualifies.

Implementation note: the current app already uses semantic sections, accessible modal roles in places, focus styles, and chart-adjacent tables. Preserve and formalize those patterns.

## 12. Data Dependency Map

Current data sources and main uses:

| Source | Current file | Primary use | Refactor use |
| --- | --- | --- | --- |
| App manifest | `data/app/property-manifest.json` | Active property and shared data paths | Keep. Extend for notice metadata and route config if needed. |
| Navigation config | `data/app/navigation.json` | Guided path labels | Replace with new route definitions. Keep JSON-driven nav. |
| View copy | `data/app/view-copy.json` | Section titles/descriptions | Expand into route primers, what-matters copy, next-step copy. |
| MIPS record cards and guided parcel context | `data/property-records/mips/*-record-card.json` | Parcel, classification, class-specific details, history, tax statements, assets, current/prior card values, location model, ownership, garage cost lines, and guided snapshot data | Keep as sample property sources listed by the manifest. Normalize through `notice-model` and `property-record` view model. |
| PAD calendar | `data/calendars/pad_main_calendar_2025.json` | Assessment stages and protest calendar | Keep. Surface as timeline/trust layer. |
| Tax district authorities | `data/counties/gage/tax-district-authorities-2025.json` | Levy authority breakdown | Keep for Tax Context secondary detail. |
| CTL statewide/county data | `data/statewide/certified-taxes-levied.json` | County/state comparisons | Move mostly to Advanced Context. |
| PAD ratio statistics | `data/counties/gage/pad-ratio-statistics-2026-gage.json` | Market area, ratio and sales bands | Use selectively in Valuation Detail, with deeper detail in Advanced Context. |
| Assessment ratio analysis | `data/counties/gage/assessment-ratio-analysis.json` | COD/PRD/COV/LOV charts | Advanced Context/Methodology. |
| Valuation groups | `data/counties/gage/valuation-groups.json` | Market/valuation group labels | Keep in Valuation Detail. |
| County context | `data/counties/gage/county-context.json` | Demographics/context charts | Off-path unless a future resource needs it. |
| IAAO standards/glossary | `data/standards/*.json` | Standards and definitions | Learn More and Methodology. |
| Official real property forms | `data/app/real-property-forms.json` | Outbound links to state source forms | Footer reference layer only; no prefill or filing workflow. |
| Images | `assets/images/*.jpg`, map PNG | Property photos, sketch, map | Keep for Property Record. Reduce decorative map reliance. |

Data gaps to address:

- Explicit assessment date.
- Explicit notice date.
- Explicit review/protest deadline by tax year and jurisdiction.
- Clear current notice value when snapshot year is pending.
- Confidence/freshness metadata for each derived value.
- Review signal input model separating facts, calculations, and interpretation.

## 13. Backend Portability Considerations

The app is currently a static JSON application. Preserve this portability while preparing for backend integration.

Portability contracts:

- Keep `data-service` as the only source-loading boundary.
- Keep normalized view models independent from fetch paths.
- Avoid direct JSON path assumptions inside route components.
- Use model contracts such as `notice`, `propertyRecord`, `valueHistory`, `taxContext`, `reviewSignals`, and `resources`.
- Keep PDF generation behind a service boundary so it can later move server-side.
- Treat any future client draft tools as replaceable storage and outside the core orientation layer.
- Keep official-source URLs and source metadata in data/config, not hardcoded inside renderers.
- Support multiple parcels by manifest entry before introducing search.

Future backend-friendly model:

```text
API/raw records -> adapter -> normalized snapshot model -> route view models -> UI
```

Candidate backend adapters:

- Static JSON adapter, current.
- County record API adapter.
- Uploaded record-card parser adapter.
- Server-side parcel snapshot endpoint.
- Form/PDF generation endpoint.

## 14. Refactor Roadmap

Roadmap order:

1. Freeze current behavior with baseline screenshots and smoke checks.
2. Create route manifest for the new seven-step journey.
3. Extract the assessment notice snapshot into a reusable component.
4. Add `notice-model` and normalize current/prior/land/improvement/change/deadline fields.
5. Split `render.js` into route modules around the target journey.
6. Move market/county/state/protest tools into secondary resource modules.
7. Replace guided path navigation with civic journey navigation.
8. Convert page primers into route-level orientation, what-matters, and next-step copy.
9. Simplify visible charts to one primary question per route.
10. Add review signal model and neutral signal language.
11. Build final summary route.
12. Restyle around calmer public-institution design primitives.
13. Improve mobile stepper, notice summary, tables, and chart fallbacks.
14. Run accessibility and visual QA.
15. Update README after implementation direction stabilizes.

## 15. Implementation Phases

Phase 0: Foundation and inventory

- Done in this document.
- Branch created: `codex/civic-orientation-refactor`.
- Existing systems inventoried.
- Primary vs secondary journey decisions documented.

Phase 1: Route and model contracts

- Add route config for Start, Property Record, What Changed, Value Detail, Equalization, Tax Context, Review Signals, Summary.
- Create `notice-model` and `review-signal-model`.
- Keep current UI intact while new models are testable in console/smoke checks.

Phase 2: Landing / Primer

- Replace the first impression with a NOV-like assessment snapshot.
- Add "What you can do here" orientation layer.
- Preserve property photo/sketch access without making it the top cognitive load.

Phase 3: Mainline taxpayer journey

- Split current views into route modules.
- Build Property Record, What Changed, Valuation Detail, Equalization, Tax Context, Review Signals, and Summary around one primary question each.
- Keep charts but reduce simultaneous visual density.

Phase 4: Secondary resources

- Move county equalization, state context, advanced market context, official forms, methodology, and glossary into optional resource areas.
- Keep protest filing references neutral and off-path.

Phase 5: Visual system and accessibility

- Replace dashboard/card-heavy styling with civic layout primitives.
- Tighten mobile view states.
- Verify focus, keyboard, screen-reader structure, contrast, chart fallbacks, and reduced cognitive load.

Phase 6: QA and documentation

- Run local smoke checks through `node server.js`.
- Use browser screenshots at desktop and mobile widths.
- Validate JSON loading and model derivations.
- Update README with the new architecture after implementation is stable.

## Primary Implementation Decision

The next code pass should not start by redesigning colors or rewriting charts. It should start by creating the new information architecture and data contracts while preserving current working functionality. Once the route skeleton and notice model exist, visual simplification can happen safely without losing existing civic assessment tooling.
