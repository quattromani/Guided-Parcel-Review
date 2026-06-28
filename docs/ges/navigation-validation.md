# GES Navigation Validation Report

Status: audit and migration report  
Date: 2026-06-28  
Scope: Phase 03 navigation architecture

## Summary

The navigation audit found that GES already has the major pieces needed for registry-driven navigation, but current navigation is still scattered across static HTML, route modules, public layout helpers, GPR workflow code, internal project navigation, article components, and experiment pages.

No existing navigation behavior was changed.

A dormant adapter was added at:

```text
src/ges/navigation-adapter.js
```

The adapter consumes the Application Registry and prepares navigation items for future layout-level orchestration. It is not wired into any live route, header, footer, or menu.

## Navigation Surfaces Inventoried

| Surface | Current file(s) | Current owner | Intended future owner |
| --- | --- | --- | --- |
| GPR guided tabs | `index.html`, `src/app.js`, `src/config/taxpayer-journey.js`, `data/app/site-copy.json` | Guided Parcel Review | GPR workflow config |
| GPR next buttons | `index.html`, `src/app.js` | Guided Parcel Review | GPR workflow config |
| GPR footer/resource panels | `index.html`, `src/app.js`, `data/app/site-copy.json`, `src/content/route-resources.js` | Guided Parcel Review | Resources, FAQ, Knowledge, and GPR context |
| Public footer | `src/ges/public-layout.js` | Public Layout hardcoded list | Public Layout consuming Application Registry |
| Global header | `src/ges/global-header.js` | GES header module | Layout-level shell |
| Home icon dropdown | `src/ges/project-nav.js` | Hardcoded internal sections | Internal Layout consuming Application Registry |
| Permission-key logic | `src/ges/internal-permissions.js`, `src/ges/project-nav.js` | Query-param permission | Registry-aware permission context, then real auth |
| Utility belt | `src/ges/field-kit.js`, `src/ges/field-kit.css` | Field Kit | Future Action Registry or internal layout action model |
| Article roll search/filter/sort | `src/routes/article-roll.js`, `data/app/articles.json` | Article Roll | Article manifest plus Search Architecture |
| Article entry utilities | `src/ges/article-components.js`, article manifest | Article components | Article system and Reporting Engine |
| Resources Block | `src/ges/article-components.js`, article content modules | Article components | Related-content service |
| Public page section nav | `src/routes/public-pages.js` | Public page route module | Page content metadata |
| Home launch cards | `home/index.html` | Static launch page | Application Registry grouped navigation |
| Start page cards | `src/routes/start-page.js` | GPR/start route | Application Registry plus GPR entry state |
| Experiment index | `src/routes/experiments-index.js`, `experiments/index.html` | Experiments | Registry experimental entries |
| Pattern library nav | `ges/index.html` | Style Guide | Style Guide app-owned local nav |
| BOE Tracker app nav/actions | `boe-tracker/index.html` | BOE Tracker | Internal Workspace or BOE app config |
| Static article/public wrappers | `articles/*`, `about/`, `faq/`, `contact/`, `administrative/` | Static wrappers plus route modules | Route wrappers consuming shared layout |
| 404 recovery navigation | Planned | None | Minimal Layout |
| Search result navigation | Planned | None | Search Architecture |
| Calendar navigation | Planned | None | Calendar app |
| PDF/report navigation | Report modules and print behavior | Report modules | Reporting Engine |

## Duplicate Navigation Report

| Duplicate | Current locations | Risk | Recommendation |
| --- | --- | --- | --- |
| Public footer destinations | `src/ges/public-layout.js`, `home/index.html`, `src/routes/public-pages.js`, static public directories | Footer and launch page can drift | Replace Public Footer first with registry footer items. |
| Internal project links | `src/ges/project-nav.js`, `home/index.html`, `src/routes/experiments-index.js`, `experiments/index.html` | Internal and experimental links drift quickly | Use registry internal groups after footer migration. |
| Guided route labels | `index.html`, `src/config/taxpayer-journey.js`, `data/app/site-copy.json` | Initial HTML and runtime tabs can disagree | Keep app-owned, but remove initial duplicate HTML during GPR simplification. |
| GPR resources | `data/app/site-copy.json`, `src/content/route-resources.js`, GPR footer panels | FAQ/forms/resources can disagree with future Knowledge/Resources | Move durable material to Resources and Knowledge inventories. |
| Public pages | Static directories and `src/routes/public-pages.js` | Route wrappers and route module can diverge | Keep wrappers thin; registry owns page family and clean paths. |
| Article routes | `articles/*/index.html`, `data/app/articles.json`, legacy `index.html?article=...` routes | Legacy and canonical article paths can drift | Article manifest remains source; registry only identifies the article family. |
| Experiments | Query-string experiment routes and static `experiments/*.html` | Prototype links appear stable | Mark experimental/permission-key and route through internal nav later. |
| BOE Tracker links | `src/ges/project-nav.js`, `home/index.html`, `src/routes/start-page.js`, direct `boe-tracker/` | Internal app is discoverable from public-ish surfaces | Move to permission-aware internal navigation and guard route later. |

## Hardcoded Navigation Report

| File | Hardcoded behavior | Future treatment |
| --- | --- | --- |
| `src/ges/public-layout.js` | `GES_PUBLIC_FOOTER_LINKS` | Replace with registry footer items. |
| `src/ges/project-nav.js` | `INTERNAL_PROJECT_NAV_SECTIONS` and grouped links | Replace with registry internal navigation model. |
| `home/index.html` | Launch cards and secondary links | Replace with grouped registry launcher. |
| `src/routes/start-page.js` | Start cards and BOE Tracker link | Replace platform links with registry items; keep GPR start state local. |
| `src/routes/experiments-index.js` | Experiment link list | Replace with registry entries where status is `experimental`. |
| `experiments/index.html` | Static experiment link list | Retire or convert to generated/developer index. |
| `index.html` | Initial GPR tabs and footer panel links | Simplify after GPR migration; keep current runtime stable for now. |
| `src/app.js` | Route branching, footer behavior, guided nav behavior | Router and layout migration later; do not fold GPR workflow into global nav. |
| `src/routes/public-pages.js` | Public page copy and section nav | Keep page-local section nav; registry owns page discoverability. |
| `ges/index.html` | Pattern library section anchors | Keep app-local; registry owns discoverability. |
| `boe-tracker/index.html` | BOE app controls, views, export/import actions | Keep app-owned until Internal Workspace migration. |

## Navigation Classification

| Surface | Type | Registry-driven? | Needs additional metadata? | Permission/layout notes |
| --- | --- | --- | --- | --- |
| Public footer | Footer Navigation | Yes | No for first pass | Public Layout only |
| Home launch cards | Primary Navigation / Quick Actions | Yes | Maybe grouping and badge metadata | Public plus permission-key links must separate |
| Home icon dropdown | Internal Navigation | Yes | Yes, for active patterns and nested groups | Permission-key now; auth later |
| Utility belt | Utility Belt / Quick Actions | Partially | Yes, but likely Action Registry | Internal and developer only |
| GPR step tabs | Context Navigation | No | GPR workflow metadata only | Legacy app and future GPR app |
| GPR resources | Related Content / Footer Navigation | Partially | Knowledge/resource object relationships | Public GPR context |
| Article roll filters | Search Navigation | No | Search facets and article manifest | Public/internal article visibility |
| Article utilities | Article Navigation | Partially | Report/download metadata | Public article context |
| Resources Block | Related Content | Partially | Recommendation relationships | Public articles/resources |
| Public page sections | Secondary Navigation | No | Page section metadata | Public Layout |
| Experiment index | Developer Navigation | Yes | Experimental grouping and developer visibility | Internal/developer |
| Pattern library nav | Developer Navigation | No | Local section metadata only | Permission-key/developer |
| BOE Tracker app nav | Workspace Navigation | No | Workspace module config | Internal only |
| 404 recovery links | Recovery Navigation | Yes | Recovery destinations | Minimal Layout |
| Search results | Search Navigation | Partially | Search index and result type metadata | Public/internal search scopes |
| PDF/report nav | Printable/PDF Navigation | No | Report template config | Reporting Engine only |

## Registry Integration Opportunities

Low-risk first integrations:

1. Public Footer can read verified registry footer items after planned apps and page-family placeholders are filtered out.
2. Home launch page can render grouped registry cards without changing application behavior.
3. A developer-only registry navigation preview can compare current hardcoded nav with registry output.
4. Experiments index can read experimental registry entries after route metadata is complete.

Higher-risk integrations:

1. Home icon dropdown because it currently propagates tracking query params and supports nested drawer behavior.
2. Permission-key navigation because direct routes are still accessible and not fully guarded.
3. GPR footer/resources because it mixes app help, FAQ, forms, public pages, and educational content.
4. BOE Tracker links because the app has internal data expectations but direct public reachability.
5. Utility belt because it is action-oriented, not application-oriented.

## Registry Metadata Gap Report

| Gap | Why it matters | Add now? |
| --- | --- | --- |
| Active route matching | Needed for active states in registry-driven header/menu | No |
| Nested child links | Needed for internal drawer groups with examples, article children, or experiment variants | No |
| Developer-only visibility | Needed to distinguish assessor/internal from developer tools | No |
| Route param propagation | Needed for `gpr_person` and future tenant/session params | No |
| Responsive priority | Needed for mobile collapse ordering | No |
| External link handling | Needed for future external references or downloads | No |
| Recovery destinations | Needed for 404/minimal layout | No |
| Layout-specific target overrides | Needed when `primary/footer/internal` booleans are too broad | No |
| Navigation badge metadata | Needed for draft/experimental/planned labels | No |
| Utility action metadata | Needed for Field Kit and micro-actions | Use future Action Registry |

Current recommendation: do not expand the schema until one migration task requires each field.

## Permission Visibility Audit

| Area | Current state | Risk | Recommendation |
| --- | --- | --- | --- |
| Public footer | Public links only | Low | Registry-driven footer should filter to public visibility. |
| Home icon dropdown | Internal sections are hardcoded | Medium | Generate from registry and current permission context later. |
| BOE Tracker | Direct route and hardcoded links exist | High | Add route guard in a later internal workspace task. |
| Experiments | Direct routes and duplicated indexes exist | Medium | Keep experimental and permission-key in registry; avoid public nav. |
| Pattern library | Direct `ges/` route exists | Medium | Keep permission-key/developer classification; decide whether public pattern library is intentional. |
| Utility belt | Requires internal tool permission | Medium | Preserve query-param behavior until auth replacement. |
| Article drafts | Article roll uses internal permission for draft metadata | Medium | Keep article manifest as source; registry only declares article app visibility. |
| GPR public workflow | Public by design | Low | Do not expose internal diagnostics or local notes through public search/reporting. |
| Reports/PDFs | Current report generation is app-local | High | Reporting Engine must separate public summary, internal notes, and QR visibility. |

## Layout And Context Recommendations

| Layout/context | Recommendation |
| --- | --- |
| Public Layout | Own primary and footer navigation. Start with footer migration. |
| Internal Layout | Own Home icon dropdown, internal app switcher, workspace nav, and utility actions. |
| Printable Layout | Hide interactive navigation. Keep citations, visible URLs, and QR links. |
| PDF Layout | Do not reuse screen navigation. Use report template structure. |
| Minimal Layout | Add recovery links to home, articles, search, contact, or GPR depending on route context. |
| Guided Parcel Review | Keep workflow tabs app-owned. Move education/resources out through GPR migration phases. |
| Article Roll | Keep filters/search local until Search Architecture owns global search. |
| Knowledge | Navigation should use object relationships, not only app registry. |
| Workspace | Use internal module config for queues/panels; registry owns app discoverability. |

## Utility Belt Scope Recommendation

| Utility | Belongs globally? | Future placement |
| --- | --- | --- |
| Parcel search | No | Internal Workspace and GPR review context |
| Share tracked link | Maybe for internal users | Internal Layout action |
| Quick notes | No | Internal Workspace |
| Component inspector | No | Developer mode only |

The Application Registry should not become a registry for every button. Create a small Action Registry only when multiple layouts need shared action rendering.

## Home Icon Dropdown Recommendation

The Home icon dropdown should be the first internal navigation consumer after Public Footer migration.

Migration requirements:

1. Preserve current `gpr_person` permission-key behavior.
2. Preserve query-param propagation.
3. Preserve accessible button labels, `aria-expanded`, `aria-controls`, Escape close, outside click close, and link close.
4. Preserve reduced-motion behavior and responsive menu width.
5. Add registry metadata for grouping and active route patterns only when needed.
6. Keep app-specific links out of global groups unless they are registered applications or modules.

## Related Content Recommendation

Related content should become a shared recommendation service after Knowledge and Search mature.

Inputs:

- Application Registry for major apps and public tools
- Article manifest for article links
- Knowledge objects for glossary, statute, PAD, IAAO, calendar, and procedure relationships
- Search index for discoverability
- Curated Resources Block entries for editorial judgment

Do not implement recommendation logic in navigation files.

## Navigation Vs Search

Navigation should answer:

- Where is the Articles app?
- Where is Guided Parcel Review?
- Where are Public Tools?
- Where is the Internal Workspace?
- Where can I recover from a 404?

Search should answer:

- Which article explains levy compression?
- Which glossary term defines equalization?
- Which statute or PAD reference applies?
- Which parcel summary is public?
- Which internal report, queue, or record matches this assessor query?

## Responsiveness Audit

Areas to keep under test during migration:

- global fixed header plus sticky GPR review header
- global header body padding and BOE sticky columns
- project-nav dropdown width at narrow screens
- utility belt bottom placement and safe-area insets
- GPR footer/resource panels on mobile
- article roll filter buttons and typeahead
- public page section navigation wrapping
- standalone experiment pages with no shared way home

Known current strengths:

- project nav has focus-visible styling and reduced-motion handling
- field kit uses safe-area-aware bottom placement
- print styles hide the field kit and project nav

Known current gaps:

- navigation is duplicated across mobile and desktop contexts by file rather than by model
- standalone pages can feel stranded
- internal and public navigation are mixed in launch surfaces
- GPR app chrome still owns public footer-like responsibilities

## Accessibility Audit

Preserve these current behaviors:

- Home icon dropdown uses button controls, `aria-expanded`, `aria-controls`, and `aria-haspopup`.
- Project nav drawers expose expanded/collapsed state.
- Project nav closes on Escape, outside click, and link click.
- Field Kit buttons have accessible labels and tooltip labels.
- Field Kit panels close on Escape and outside click.
- Parcel search uses combobox/listbox roles and keyboard handling.
- Print hides interactive internal navigation.
- Reduced-motion media queries suppress nonessential movement.

Future checks:

- each rendered nav needs a semantic `nav` landmark and label
- focus order should follow DOM order
- active state needs both visual and semantic affordance
- icon-only controls need stable accessible names
- non-modal menus should not trap focus
- modal report/export dialogs should trap focus only when they are modal

## Technical Debt

| Debt | Impact | Migration path |
| --- | --- | --- |
| Navigation arrays live in multiple files | Labels/routes drift | Registry adapter and staged replacement |
| GPR owns education, resources, footer panels, and workflow tabs | Product responsibility is unclear | Follow GPR migration plan |
| Internal project nav is hardcoded | New apps require code edits | Generate from registry internal items |
| Public footer is hardcoded | New public pages require code edits | Generate from registry footer items |
| Experiments have duplicate indexes | Prototype surfaces look official | Registry experimental/dev visibility |
| Utility belt mixes global and app-specific actions | Hard to reason about visibility | Future Action Registry |
| Permission-key direct routes are not true auth | Internal tools can be URL-discoverable | Later route guards and auth model |
| Search, related content, and navigation overlap | Users may see inconsistent recommendations | Separate responsibilities by architecture |
| Static wrappers and runtime routes duplicate public pages | Route drift | Keep wrappers thin and registry-described |

## Implementation Roadmap

Phase N1: Freeze and validate navigation inventory  
Keep current navigation behavior unchanged. Use this report as the baseline.

Phase N2: Add developer-only registry navigation preview  
Read `data/app/application-registry.json` and render public/footer/internal candidates for verification. Do not expose publicly.

Phase N3: Public Footer migration  
Replace `GES_PUBLIC_FOOTER_LINKS` with registry footer items filtered to public visibility.

Phase N4: Home launch migration  
Render launch cards from grouped registry items. Keep special GPR launch affordances app-owned.

Phase N5: Internal Home icon dropdown migration  
Generate internal groups from registry entries. Preserve permission-key propagation and drawer behavior.

Phase N6: Experiment/developer navigation cleanup  
Use registry experimental entries for experiment index and developer surfaces.

Phase N7: GPR navigation simplification  
Keep GPR workflow tabs app-owned while moving education/resources to Articles, Knowledge, Resources, and Public Tools.

Phase N8: Utility action architecture  
Create Action Registry only if utility actions need to appear across more than one layout.

Phase N9: Permission and route guard hardening  
Add guards for permission-key, authenticated, county admin, and future tenant contexts.

Phase N10: Native GES/React migration  
Use registry route, layout, visibility, search, and navigation metadata as configuration for the future router.

## Dependency Graph

```text
Application Registry
  -> Navigation Adapter
    -> Developer Registry Navigation Preview
      -> Public Footer Migration
        -> Home Launch Migration
          -> Internal Home Icon Dropdown Migration
            -> Permission Guard Hardening
              -> Native GES/React Router Migration

GPR Migration Plan
  -> Article/Knowledge/Resources Extraction
    -> GPR Navigation Simplification
      -> Reporting Engine Integration

Knowledge Platform
  -> Search Architecture
    -> Related Content Service
      -> Article/Tool/Knowledge Recommendations

Internal Workspace Plan
  -> Utility Scope Decisions
    -> Optional Action Registry
      -> Internal Utility Belt Migration
```

## Validation Performed

- Audited current navigation owners across app shell, public layout, GPR, article routes, public page routes, experiments, home page, BOE Tracker, pattern library, and Field Kit.
- Added a dormant registry navigation adapter.
- Verified the adapter can produce public layout navigation buckets from `data/app/application-registry.json`.
- Confirmed the current registry footer candidates include planned apps and a page-family placeholder, so a developer preview/filter step should precede any live footer migration.
- No existing route, nav menu, footer, utility belt, GPR workflow, article route, or permission behavior was changed.

## Recommended First Engineering Task

Create a developer-only registry navigation preview that prints or renders:

- public primary navigation candidates
- public footer candidates
- internal navigation candidates for public, permission-key, and future internal contexts
- hidden/internal apps with direct public routes
- registry entries missing canonical paths
- registry entries marked navigation-visible but missing labels or groups

This should happen before replacing any live navigation surface.
