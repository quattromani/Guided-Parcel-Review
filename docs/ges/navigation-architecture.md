# GES Navigation Architecture

Status: architecture baseline  
Date: 2026-06-28  
Scope: Phase 03 platform architecture

GES navigation is becoming a consumer of the Application Registry. Navigation should no longer define the platform. It should ask the platform registry what can be shown for the current user, layout, and context, then render that answer.

This document does not redesign navigation, rewrite routing, or change current behavior. It defines the target architecture and records the safe adapter introduced for future work.

## Philosophy

Navigation should not know which applications exist, where they route, who can see them, or which layout they use.

The Application Registry should know those things.

Navigation should ask:

```text
What applications should I display for this user, in this layout, in this context?
```

The navigation layer is an orchestration layer. It renders registry declarations, layout decisions, and application-specific context links. It does not become a second registry.

## Canonical Files

| File | Role |
| --- | --- |
| `data/app/application-registry.json` | Canonical application and module registry. |
| `src/ges/application-registry.js` | Registry loader and audience/search/navigation filters. |
| `src/ges/navigation-adapter.js` | Dormant navigation adapter that converts registry entries into navigation models. |
| `docs/ges/navigation-architecture.md` | Target navigation architecture. |
| `docs/ges/navigation-validation.md` | Audit findings, duplicate reports, risk notes, and migration order. |
| `docs/ges/application-registry.md` | Registry schema and platform philosophy. |
| `docs/ges/layout.md` | Layout ownership rules that navigation must respect. |

## Current Navigation Inventory

| Navigation surface | Current location | Current source of truth | Future source of truth | Classification | Risk |
| --- | --- | --- | --- | --- | --- |
| Public application navigation | Scattered across launch pages, article roll, and footer | Hardcoded links and route files | Application Registry `navigation.primary` plus layout context | Primary Navigation | Medium |
| Public footer navigation | `src/ges/public-layout.js` | `GES_PUBLIC_FOOTER_LINKS` | Application Registry `footer.public` and `navigation.footer` | Footer Navigation | Low |
| Global header and home icon menu | `src/ges/global-header.js`, `src/ges/project-nav.js` | `INTERNAL_PROJECT_NAV_SECTIONS` | Application Registry internal navigation model | Internal Navigation | Medium |
| Permission-key project menu | `src/ges/project-nav.js`, `src/ges/internal-permissions.js` | Query-param permission plus hardcoded link groups | Application Registry visibility plus permission context | Internal Navigation | High |
| Guided Parcel Review step tabs | `index.html`, `src/app.js`, `src/config/taxpayer-journey.js`, `data/app/site-copy.json` | GPR journey routes and site copy | GPR application workflow config, not global registry | Context Navigation | Medium |
| Guided Parcel Review next actions | `index.html`, `src/app.js` | `data-guided-next`, route state, journey config | GPR workflow state | Quick Actions | Medium |
| Guided Parcel Review footer/resource links | `index.html`, `src/app.js`, `data/app/site-copy.json`, `src/content/route-resources.js` | GPR footer panels and route resource data | Resources, FAQ, Knowledge, and GPR context links | Footer Navigation / Related Content | High |
| Article roll filters and search | `src/routes/article-roll.js`, `data/app/articles.json` | Article manifest and local route logic | Article manifest plus Search Architecture | Search Navigation | Medium |
| Article utility links | `src/ges/article-components.js`, article manifest | Article metadata | Article manifest, Reporting Engine, Resources Block | Article Navigation | Low |
| Resources Block | `src/ges/article-components.js`, article content modules | Article component data | Related content service backed by registry, search, and knowledge relationships | Related Content | Medium |
| Public page local section nav | `src/routes/public-pages.js` | Page-specific section data | Page content metadata | Secondary Navigation | Low |
| Home launch cards | `home/index.html` | Hardcoded card groups | Application Registry grouped navigation | Primary Navigation / Quick Actions | Medium |
| Experiment index navigation | `src/routes/experiments-index.js`, `experiments/index.html` | Hardcoded experiment links | Registry entries with experimental status | Developer Navigation | Medium |
| Pattern library local nav | `ges/index.html` | Static section anchors | Style Guide app-owned local navigation | Developer Navigation | Low |
| BOE Tracker navigation and actions | `boe-tracker/index.html` | App-local controls | Internal Workspace or BOE app config | Workspace Navigation / Quick Actions | High |
| Sticky utility belt | `src/ges/field-kit.js`, `src/ges/field-kit.css` | Hardcoded utility actions and permission check | Future Action Registry plus internal layout context | Utility Belt | Medium |
| 404 recovery links | Planned | Not implemented | Minimal Layout recovery navigation using registry and search | Recovery Navigation | Medium |
| Search result navigation | Planned | Not implemented | Search index result metadata plus registry app context | Search Navigation | Medium |
| Calendar navigation | Planned | Not implemented | Calendar app config plus registry route metadata | Context Navigation | Medium |
| PDF/report navigation | Current report modules and browser print | Report-specific behavior | Reporting Engine layout and report template config | Printable/PDF Navigation | High |

## Navigation Types

GES navigation should use explicit types so implementation responsibilities stay clear.

| Type | Purpose | Future owner |
| --- | --- | --- |
| Primary Navigation | Known public destinations and major public applications | Public Layout using registry primary items |
| Secondary Navigation | Page-local section movement | Page or content module |
| Context Navigation | App-local workflow steps, tabs, or modes | Owning application |
| Article Navigation | Article entry tools, article-local links, print/audio/download affordances | Article system and Reporting Engine |
| Footer Navigation | Public resource, administrative, and support destinations | Public Layout using registry footer items |
| Internal Navigation | Authenticated or permission-key application switching | Internal Layout using registry internal items |
| Workspace Navigation | Internal workflow views and queues | Internal Workspace |
| Utility Belt | Cross-cutting internal utilities and action buttons | Future Action Registry or internal layout |
| Quick Actions | Contextual commands such as export, copy link, create packet, or reset | Owning application or Action Registry |
| Breadcrumbs | Location trace within a content hierarchy | Layout plus route/content metadata |
| Related Content | Articles, resources, glossary, statutes, tools, and see-also links | Future related-content service |
| Recovery Navigation | 404, unavailable, and access-denied options | Minimal Layout |
| Search Navigation | Search result filters, result types, and facets | Search Architecture |
| Developer Navigation | Pattern library, experiments, diagnostics | Internal/developer layout |

## Registry Integration

The registry currently supports the core navigation fields:

- `navigation.primary`
- `navigation.footer`
- `navigation.internal`
- `navigation.utilityBelt`
- `navigation.order`
- `navigation.group`
- `navigation.label`
- `visibility`
- `audience`
- `permissions`
- `layout`
- `route`
- `status`

The new `src/ges/navigation-adapter.js` translates registry entries into navigation items and grouped navigation models. It is intentionally dormant. No current header, footer, route, or menu uses it yet.

The adapter provides:

- navigation target constants
- navigation type constants
- layout-to-navigation target mapping
- canonical href extraction from registry route metadata
- registry-to-navigation item conversion
- item grouping and ordering
- optional lifecycle status filtering
- layout navigation models for future layout orchestration

## Layout-Aware Navigation

Navigation should be selected by layout, not by scattered page conditionals.

| Layout | Navigation behavior |
| --- | --- |
| Public Layout | May render primary navigation and public footer navigation from registry entries visible to public users. |
| Internal Layout | May render internal navigation and utility actions from permission-aware registry/action metadata. |
| Printable Layout | Should suppress interactive navigation and keep only substance, citations, resource URLs, and optional QR links. |
| PDF Layout | Should not render screen navigation. Report structure is owned by the Reporting Engine. |
| Minimal Layout | Should render recovery navigation only when useful. |
| Legacy App | Transitional. GPR keeps its own workflow navigation until simplified. |
| Standalone | Transitional. Home, BOE Tracker, pattern library, and static experiments should migrate later. |

## Visibility Model

Navigation must never expose applications the current user should not discover.

Supported contexts:

- public
- authenticated
- permission-key
- assessor
- county administrator
- developer
- future tenant-specific visibility

Rules:

1. Public users see public applications and resources only.
2. Permission-key users may see additional project navigation explicitly allowed by registry visibility and permissions.
3. Assessor and county administrator users may see workspace, reporting, diagnostics, and internal tools after real auth exists.
4. Developer navigation remains hidden from public users.
5. Tenant-specific visibility is future-only and should be modeled as overrides, not hardcoded route checks.

## Context-Aware Navigation

Context-aware navigation is not always registry-owned.

| Context | Navigation rule |
| --- | --- |
| Public article | Public Layout plus article-local utility and related content. |
| Article Roll | Public Layout plus article search/filter controls. |
| Guided Parcel Review | App-owned parcel review workflow navigation. |
| Parcel Review Session | App-owned parcel stepper, parcel-specific actions, report generation, and resources. |
| Internal Workspace | Internal Layout plus workspace-owned queues, panels, and pinned modules. |
| Knowledge | Public or internal layout plus knowledge object relationships. |
| Calendar | Calendar app-owned view controls, registry-owned app discoverability. |
| Reporting | Reporting Engine owns report flow; registry owns discoverability and permissions. |
| Search | Search owns result filters and facets; registry owns which apps participate. |
| 404 | Minimal Layout owns recovery navigation. |
| Experiments | Developer/internal navigation, not public primary navigation. |
| Developer mode | Internal/developer layout only. |

## Home Icon Menu

The authenticated Home icon dropdown should become a registry consumer.

Current behavior:

- The menu is built from `INTERNAL_PROJECT_NAV_SECTIONS` in `src/ges/project-nav.js`.
- It supports open/close state, drawer expansion, Escape close, outside-click close, link-click close, accessible labels, and query-param propagation.
- Permission-key state is currently supplied by `src/ges/internal-permissions.js`.

Target behavior:

- Generate menu groups from registry entries where `navigation.internal` is true and the current visibility context allows the entry.
- Preserve permission-key behavior until real authentication replaces it.
- Preserve current open/close animation, reduced-motion behavior, keyboard behavior, and labels.
- Add registry metadata only when needed, rather than duplicating labels in `project-nav.js`.

Likely registry gaps:

- internal drawer grouping beyond a single `navigation.group`
- active route matching patterns
- nested child links for article examples, experiments, or report templates
- developer-only visibility
- route-parameter propagation rules

## Utility Belt

The sticky utility belt is not a normal application menu. It is a collection of micro-actions.

Current actions:

| Action | Current location | Future scope |
| --- | --- | --- |
| Parcel search | `src/ges/field-kit.js` | Internal Workspace and GPR context, not global public navigation |
| Share tracked link | `src/ges/field-kit.js` | Internal/global utility, with public share handled separately by articles/tools |
| Quick notes | `src/ges/field-kit.js` | Internal Workspace only |
| Component inspector | `src/ges/field-kit.js` | Developer-only |

Recommendation: do not force utility actions into the Application Registry. Use a future Action Registry when the action surface grows.

The Action Registry should describe:

- action id
- label
- icon
- description
- layout scope
- application scope
- visibility
- permission requirement
- keyboard behavior
- panel/dialog behavior
- print/PDF exclusion

Do not implement the Action Registry until at least two layouts need shared action orchestration.

## Related Content

Related content should become a shared content recommendation layer, not ad hoc navigation.

Participating sources:

- Application Registry for major application/tool destinations
- Article manifest for article relationships
- Knowledge objects for glossary, statutes, procedural references, and citations
- Search index for discoverable resource matching
- Resources Block for curated reader support

Examples:

- Related Articles
- Resources Block
- Future See Also
- glossary references
- statute references
- tool suggestions
- public calendar references

The registry should identify applications that can be suggested. It should not compute recommendations.

## Navigation Vs Search

Navigation is for known destinations and major platform structure.

Search is for specific information inside applications.

| Navigation should handle | Search should handle |
| --- | --- |
| Articles app | Specific article |
| Public Tools app | Specific calculator or explainer |
| Knowledge app | Specific statute, PAD reference, glossary term, or object |
| Guided Parcel Review app | Specific parcel lookup or public parcel summary |
| Internal Workspace | Internal records, queues, provenance, and diagnostics |
| Calendar app | Specific event or date |
| Reporting app | Report templates, not generated private content |

## Responsiveness Requirements

Navigation migration must preserve:

- desktop, tablet, mobile, portrait, and landscape behavior
- readable wrapping labels
- reliable way home from every public and internal context
- no mobile-only stranded pages
- no duplicate mobile menus competing with global header
- safe-area-aware sticky elements
- utility belt avoidance of bottom controls
- print suppression for interactive navigation

Known current pressure points:

- fixed global header plus sticky guided review header
- bottom fixed utility belt on mobile
- GPR footer/resource panels versus public footer behavior
- standalone pages without shared layout navigation
- experiment routes with inconsistent return paths

## Accessibility Requirements

All registry-driven navigation must preserve or improve:

- semantic `nav` landmarks with useful labels
- keyboard navigation
- visible focus states
- `aria-expanded` and `aria-controls` on disclosure controls
- Escape-to-close behavior for menus and panels
- outside-click behavior where already established
- focus order that matches visual order
- screen-reader labels for icon-only controls
- reduced-motion support
- no focus traps unless a surface is truly modal

The Home icon dropdown and utility belt already contain important accessibility behavior. Future registry wiring must keep that behavior intact.

## Registry Metadata Gaps

The current Application Registry is enough to prepare navigation but not enough to replace every current navigation surface.

Recommended future fields:

| Field | Purpose |
| --- | --- |
| `navigation.activePatterns` | Route and hash patterns used for active states. |
| `navigation.contexts` | Layout or app contexts where an item should appear. |
| `navigation.children` | Nested navigation items when the child is not a full application. |
| `navigation.responsivePriority` | Collapse/order hints for mobile. |
| `navigation.recovery` | Recovery destination hints for 404/minimal layout. |
| `navigation.propagateParams` | Query params that should follow internal links. |
| `navigation.developer` | Developer-only discoverability separate from internal user visibility. |
| `navigation.external` | External URL, target, and rel handling. |
| `navigation.badge` | Draft, experimental, internal, or planned labels. |
| `navigation.layoutTargets` | More precise layout participation when primary/footer/internal is not enough. |

Do not add these fields until a migration step uses them.

## Future Implementation Order

1. Keep current navigation behavior frozen while inventory is verified.
2. Use `src/ges/navigation-adapter.js` in a nonvisual validation report or dev-only preview.
3. Replace Public Footer links with registry-driven footer items.
4. Replace Home launch cards with registry grouped navigation.
5. Replace Home icon dropdown groups with registry internal navigation, preserving permission-key behavior.
6. Add active route pattern metadata only after internal navigation is registry-driven.
7. Separate GPR workflow navigation from public resources and article links.
8. Move utility belt actions to a small Action Registry if repeated across layouts.
9. Add route guards for permission-key/internal applications.
10. Use registry layout metadata in the future native GES/React routing layer.

## Success Criteria

Navigation migration is successful when:

- applications are added to navigation by registry entry, not by editing scattered arrays
- public users cannot discover internal applications through navigation
- internal users see the right workspace and tool links for their permission context
- public layout, internal layout, printable layout, PDF layout, and minimal layout each select appropriate navigation automatically
- GPR workflow navigation remains app-owned and parcel-specific
- article and knowledge relationships remain content-owned, not global nav-owned
- utility actions are not confused with application navigation
- every navigation surface has one clear owner
