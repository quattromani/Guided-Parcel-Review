# GES Application Registry Validation Report

Status: validation report  
Date: 2026-06-28  
Scope: Application Registry implementation baseline

## Summary

The GES Application Registry has been introduced as a canonical JSON registry with a read-only helper module and documentation.

No current router, navigation, footer, search, layout, permission, or user-facing behavior was changed.

## Applications And Modules Inventoried

| Application/module | Current representation | Registry id | Status |
| --- | --- | --- | --- |
| Guided Parcel Review | `index.html`, `src/app.js`, `src/render.js`, guided journey config | `guided-parcel-review` | active |
| Project Home | `home/index.html` | `home-launch-page` | active |
| Article Roll | `articles/`, `src/routes/article-roll.js`, `data/app/articles.json` | `article-roll` | active |
| Articles | `data/app/articles.json`, `articles/*`, `src/content/articles/*`, legacy query routes | `articles` | active |
| Public Pages | `src/routes/public-pages.js`, static `about/`, `faq/`, `contact/`, `administrative/` directories | `public-pages` | active |
| About GES | `about/`, `src/routes/public-pages.js` | `about-ges` | active |
| FAQ | `faq/`, `src/routes/public-pages.js`, GPR footer/route FAQ data | `faq` | draft |
| Contact | `contact/`, `src/routes/public-pages.js` | `contact` | draft |
| Administrative Page | `administrative/`, `src/routes/public-pages.js` | `administrative` | active |
| 404 / Minimal Pages | planned | `minimal-pages` | planned |
| Resources | GPR footer resources, `site-copy.json`, `route-resources.js`, forms/date data | `resources` | planned |
| Knowledge Platform | `docs/ges/knowledge-platform.md`, legal/standards/source/calendar data | `knowledge-platform` | planned |
| Glossary | `data/standards/iaao-glossary.json`, future knowledge objects | `glossary` | planned |
| Calendar | `assessment-dates.js`, assessment events, taxpayer action dates, PAD calendar | `calendar` | planned |
| Search | Article roll search, parcel switcher search, future global search | `search` | planned |
| Public Tools | planned extraction from GPR and experiments | `public-tools` | planned |
| Property Tax Calculator | levy compression calculator, tax shorthand experiment | `property-tax-calculator` | experimental |
| Tax District Explorer | GPR tax district authorities and levy distribution | `tax-district-explorer` | planned |
| Equalization Metrics Explorer | GPR equalization charts and metric signal logic | `equalization-metrics-tool` | planned |
| County CTL Comparison | GPR state context/county comparison charts | `county-ctl-comparison-tool` | planned |
| Reporting Engine | current browser PDF modules and future report service | `reporting-engine` | planned |
| PDF Generation | `src/reports/pdf-report-kit.js`, report modules, pdf-lib | `pdf-generation` | active |
| QR Generation | article compatibility flags and future report/public-summary QR | `qr-generation` | planned |
| Assessor Workspace | `docs/ges/workspace.md` | `assessor-workspace` | planned |
| Internal Dashboard | planned internal dashboard family | `internal-dashboard` | planned |
| BOE Tracker | `boe-tracker/` standalone app | `boe-tracker` | experimental |
| Experiments | `src/routes/experiments-index.js`, `experiments/` static pages | `experiments` | experimental |
| Property Invite Index | `src/routes/property-invite-index.js` | `property-invite-index` | experimental |
| Comparable Review Experiments | comparison and comparable-candidate route modules | `comparable-review-experiments` | experimental |
| Valuation Group Labs | `experiments/valuation-group-overview.html`, `experiments/vg-aggregate.html` | `valuation-group-labs` | experimental |
| Style Guide / Pattern Library | `ges/index.html`, GES docs and components | `style-guide-pattern-library` | active |
| Public Layout | `src/ges/public-layout.js`, `src/ges/shell.js` | `ges-public-layout` | active |
| Future County Deployment Tools | planned tenant/county deployment tooling | `county-deployment-tools` | planned |

## Registry Schema Created

Schema file:

```text
docs/data-contracts/application-registry.schema.json
```

Canonical registry:

```text
data/app/application-registry.json
```

Helper module:

```text
src/ges/application-registry.js
```

The helper currently supports:

- loading the registry
- listing applications
- finding applications by id or slug
- filtering by audience/visibility context
- filtering for navigation targets
- filtering for search participation
- filtering by type
- filtering by status

## Registry Entries Added

The initial registry contains 33 entries.

Status breakdown:

| Status | Count |
| --- | ---: |
| active | 10 |
| draft | 2 |
| experimental | 6 |
| planned | 15 |

Primary categories:

- Parcel Review
- Platform
- Public Resources
- Public Pages
- Knowledge
- Public Tools
- Reporting
- Internal
- Experiments
- Design System
- County Deployment

## Current Hardcoded Structure Found

| Concern | Current owner | Registry impact |
| --- | --- | --- |
| Main route branching | `src/app.js` | Registry can describe routes now; router migration later. |
| Public footer links | `src/ges/public-layout.js` | Footer can later read entries where `footer.public` is true. |
| Internal project nav | `src/ges/project-nav.js` | Internal nav can later read entries where `navigation.internal` is true. |
| Home launch links | `home/index.html` | Home page can later use registry grouped navigation. |
| Article search | `src/routes/article-roll.js`, `data/app/articles.json` | Registry marks article search source but does not replace index. |
| Parcel search | `src/render.js`, `data/app/property-manifest.json` | Registry marks GPR search as limited/public-summary only. |
| Guided route tabs | `src/config/taxpayer-journey.js`, `data/app/site-copy.json` | These remain GPR-internal workflow, not platform app registry. |
| Layout selection | `src/ges/shell.js`, route modules, static pages | Registry records current/target layout; selection remains unchanged. |
| Permissions | `src/ges/internal-permissions.js` | Registry records assumptions but does not implement auth. |
| Public page routing | `src/routes/public-pages.js` plus static directories | Registry records duplicate representations for cleanup later. |
| Reporting | `src/reports/*.js`, `src/recordCorrectionRequest.js`, `src/assessors-report.js` | Registry creates Reporting Engine target. |
| Experiments | `src/routes/*experiment*.js`, `experiments/` | Registry marks experimental visibility and internal future placement. |

## Unresolved Apps Or Modules

| Item | Reason unresolved | Recommendation |
| --- | --- | --- |
| Individual article records | Already owned by `data/app/articles.json` | Keep article records in the article manifest until publication objects move to SQL/Knowledge. |
| Individual knowledge objects | Not implemented as object registry yet | Keep in Knowledge Platform inventory until object ids exist. |
| Individual report templates | Reporting Engine not implemented | Add report-template registry after report schemas exist. |
| Individual public tools beyond initial extraction candidates | Tool routes do not exist yet | Add entries as each tool gets a real implementation plan. |
| 404 page | No current implementation found | Implement through Minimal Layout later. |
| Search service | Current search is local and fragmented | Build after Knowledge objects and registry participation are stable. |
| County admin console | Not implemented | Keep covered by `county-deployment-tools` for now. |

## Duplicate Navigation Or Route Concerns

- `about/`, `faq/`, `contact/`, and `administrative/` exist as static directories and are also routed through `src/routes/public-pages.js`.
- Article routes exist as static `articles/*/index.html` paths and legacy `index.html?article=...` routes.
- Experiments exist through both `index.html?experiment=...` and static `experiments/*.html` pages.
- Public footer links are hardcoded independently from home page links and internal project nav links.
- BOE Tracker is linked from internal navigation but is directly reachable by URL.

## Public/Internal Visibility Concerns

| Concern | Risk | Registry recommendation |
| --- | --- | --- |
| BOE Tracker direct route | Internal local-first records could be treated as public because route is accessible | Marked `permissionKey`; add route guard in a later task. |
| Experiments direct routes | Prototype tools may be mistaken for stable products | Marked `experimental` and `permissionKey`. |
| Pattern Library public URL | Developer surface may appear public | Marked `permissionKey`; keep accessible only intentionally later. |
| GPR review signals | Public users may read prompts as official conclusions | Marked human-governed through GPR migration docs; registry keeps search limited. |
| Generated reports | Could expose private notes/contact details if indexed or QR-linked incorrectly | Reporting Engine marked non-searchable; QR has privacy review metadata. |

## Search Participation Recommendations

| Application family | Search recommendation |
| --- | --- |
| Articles | Public and internal search through article manifest. |
| FAQ | Public search after FAQ entries are promoted to knowledge objects. |
| Glossary | Public search after stable glossary ids exist. |
| Knowledge Platform | Public/internal search by object visibility. |
| Calendar | Public/internal search by event visibility and audience. |
| Public Tools | Public search by tool metadata, not transient run results. |
| Guided Parcel Review | Limited to public parcel summaries only. |
| BOE Tracker | Internal search only; never public. |
| Reporting Engine | Do not publicly index generated reports by default. |
| Style Guide and Experiments | Internal/developer search only. |

## Layout Participation Recommendations

| Layout | Registry-driven future |
| --- | --- |
| Public Layout | Articles, public pages, resources, public tools, glossary, knowledge. |
| Internal Layout | Workspace, dashboard, BOE Tracker, internal diagnostics, developer tools. |
| Printable Layout | Public handouts, article print views, QR resource pages. |
| PDF Layout | Reporting Engine output only. |
| Minimal Layout | 404, unavailable, recovery, low-chrome states. |
| Legacy App | Transitional GPR and embedded experiment routes only. |
| Standalone | Temporary for home, BOE, pattern library, and static experiment pages until migrated. |

## Future Migration Recommendations

1. Keep `data/app/application-registry.json` as the source of truth.
2. Add a small validation script once registry use expands.
3. Use registry entries to generate internal project navigation first.
4. Use registry entries to generate public footer links next.
5. Convert home launch cards to registry-driven grouped navigation.
6. Add route guards for entries with `visibility` of `permissionKey`, `authenticated`, or `countyAdmin`.
7. Use registry layout metadata during native GES/React rebuild.
8. Use `searchable` metadata to seed the future search index.
9. Add tenant override config only after base registry behavior is stable.

## Recommended Next Engineering Task

Create a nonfunctional registry audit page or CLI report that reads `data/app/application-registry.json` and prints:

- public nav candidates
- footer candidates
- internal nav candidates
- searchable apps
- internal-only apps that currently have direct public routes
- planned apps without implementation
- entries with duplicate current routes

That task should still avoid replacing router or navigation behavior.
