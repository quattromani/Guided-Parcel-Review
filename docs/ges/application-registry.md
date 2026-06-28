# GES Application Registry

Status: architecture and implementation baseline  
Date: 2026-06-28  
Scope: Phase 03 platform architecture

GES is no longer one website or one application. It is a platform composed of public pages, articles, parcel review workflows, public tools, knowledge systems, internal workspaces, reporting systems, experiments, design-system surfaces, and future county-deployable modules.

The Application Registry is the canonical source of truth for those surfaces.

## Philosophy

GES should be registry-first.

Applications declare who they are. The platform decides how to display, route, search, secure, group, and migrate them.

Future GES applications should be added by registration and implementation binding, not by editing scattered navigation arrays, route switches, footer links, permission checks, search adapters, and layout selectors.

## Canonical Files

| File | Role |
| --- | --- |
| `data/app/application-registry.json` | Canonical registry data. |
| `src/ges/application-registry.js` | Read-only loader and filter helpers for future navigation/search/layout integration. |
| `docs/data-contracts/application-registry.schema.json` | JSON Schema contract for the registry shape. |
| `docs/ges/application-registry.md` | Architecture and operating rules. |
| `docs/ges/application-registry-validation.md` | Audit, validation report, and migration concerns. |

## Schema Summary

Every application entry declares:

| Field | Purpose |
| --- | --- |
| `id` | Stable registry id. Use kebab-case. |
| `slug` | Human/router-facing slug. |
| `title` | Full display title. |
| `shortTitle` | Compact label. |
| `description` | Plain-language purpose. |
| `type` | Application type such as `tool`, `workspace`, `articleCollection`, or `parcelReview`. |
| `status` | Lifecycle status. |
| `audience` | Intended audiences. |
| `visibility` | Display/security visibility. |
| `layout` | Current and target layout ownership. |
| `route` | Canonical and current route representations. |
| `entryPoint` | Current module, static page, manifest, or planned implementation. |
| `icon` | Semantic icon id. |
| `category` | High-level grouping. |
| `tags` | Search/discovery tags. |
| `searchable` | Search participation declaration. |
| `navigation` | Primary/footer/internal/utility-belt navigation intent. |
| `footer` | Footer participation intent. |
| `permissions` | Auth and permission assumptions. |
| `dataSources` | Current or planned data sources. |
| `dependencies` | Required applications/modules/services. |
| `relatedApplications` | Related registry ids. |
| `metadata` | App-specific structured notes. |
| `version` | Registry/application version marker. |
| `owner` | Responsible platform area. |
| `sourceDocs` | Documentation and source references. |
| `futureSQLMetadata` | Future database migration hints. |
| `futureTenantConfig` | Future county/tenant override hints. |

## Application Types

Initial supported types:

- `publicPage`
- `pageFamily`
- `articleCollection`
- `article`
- `tool`
- `calculator`
- `calendar`
- `knowledgeBase`
- `glossary`
- `resourceHub`
- `parcelReview`
- `workspace`
- `dashboard`
- `reporting`
- `pdfGenerator`
- `qrGenerator`
- `search`
- `adminPage`
- `styleGuide`
- `experiment`
- `internalTool`
- `integration`
- `deployment`
- `future`

Types describe the application role. They do not imply visibility by themselves.

## Status Model

The registry uses lifecycle status to prevent prototypes from being mistaken for stable product:

| Status | Meaning |
| --- | --- |
| `active` | Currently available and intended to keep working. |
| `draft` | Route or content exists but is not mature. |
| `experimental` | Prototype or lab surface; not stable product. |
| `planned` | Architecture accepted, implementation not complete. |
| `deprecated` | Still present but scheduled for replacement. |
| `archived` | Historical or retained for reference only. |

Internal access is modeled through `audience`, `visibility`, and `permissions`, not as a status.

## Visibility Rules

Supported visibility values:

- `public`
- `internal`
- `authenticated`
- `permissionKey`
- `countyAdmin`
- `tenantSpecific`
- `hidden`

Rules:

1. Public users can see only entries with `visibility` containing `public`.
2. Internal navigation can include `internal`, `permissionKey`, `authenticated`, `countyAdmin`, and `tenantSpecific` entries when the current context allows.
3. `hidden` entries are support modules or integrations. They can be resolved by id but should not appear in navigation.
4. Current permission-key behavior is query-param based. The registry prepares for real authentication without implementing it.
5. Tenant-specific visibility is a future declaration only.

## Layout Integration

Each application declares:

```json
"layout": {
  "current": "legacyApp",
  "target": "public"
}
```

Supported layouts:

- `public`
- `internal`
- `printable`
- `pdf`
- `minimal`
- `legacyApp`
- `standalone`
- `future`

`legacyApp` and `standalone` are transitional values. They document current reality without forcing an immediate rebuild.

Future layout selection should resolve from the registry first, then call the appropriate shell helper:

| Registry layout | Current shell owner |
| --- | --- |
| `public` | `createGesPublicShell()` / Public Layout |
| `internal` | `createGesInternalShell()` / Internal Layout |
| `printable` | Future printable shell |
| `pdf` | Reporting Engine / PDF layout |
| `minimal` | Future minimal shell |
| `legacyApp` | Current GPR app shell |
| `standalone` | Static standalone page |

## Navigation Integration

Navigation should eventually be registry-driven.

Each entry declares:

- `navigation.primary`
- `navigation.footer`
- `navigation.internal`
- `navigation.utilityBelt`
- `navigation.order`
- `navigation.group`
- `navigation.label`
- optional `navigation.description`

Current duplicated owners:

- Public footer links live in `src/ges/public-layout.js`.
- Internal project nav links live in `src/ges/project-nav.js`.
- Home launch links live in `home/index.html`.
- GPR step navigation lives in `src/config/taxpayer-journey.js` and `data/app/site-copy.json`.

Future migration should replace those hardcoded lists gradually, not in this task.

## Search Integration

The registry does not replace the search index. It describes whether an application participates in search.

Each entry declares:

```json
"searchable": {
  "enabled": true,
  "scope": "public",
  "public": true,
  "internal": true,
  "indexSource": "data/app/articles.json"
}
```

Recommended behavior:

- Articles, FAQ, glossary, knowledge, calendar, resources, and public tools should be searchable.
- Guided Parcel Review should be limited to public parcel summaries.
- Internal dashboards, BOE records, source inspection, and reports should be internal-only or not indexed.
- Reporting Engine should not expose generated report contents to public search by default.
- Style Guide and experiments should be internal/developer search only.

## Permission Model Assumptions

The registry prepares for these contexts:

- public user
- permission-key user
- authenticated assessor
- county admin
- future tenant user
- developer/internal owner

Current implementation uses `gpr_person=max-quattromani` for internal menu/tool access. The registry records that as a transitional permission mechanism; it does not implement real auth.

Do not infer security from navigation visibility. Internal routes still need route-level protection before production.

## County And Tenant Preparation

Registry entries include `futureTenantConfig` for future county deployments.

Future tenant config should support:

- county-specific enabled/disabled apps
- county-specific public tools
- county-specific branding
- county-specific data sources
- county-specific internal apps
- county-specific source/citation objects
- county-specific visibility

This task does not implement multi-tenancy. It only keeps the registry shape compatible with it.

## Future SQL And React Migration

The JSON registry is intentionally SQL-shaped.

Likely future tables:

- `ges_applications`
- `application_routes`
- `application_navigation`
- `application_permissions`
- `application_data_sources`
- `application_dependencies`
- `tenant_applications`
- `search_documents`
- `knowledge_objects`
- `reports`

React or future native GES modules should consume registry records through an adapter rather than importing scattered constants.

## Migration Rule

The registry may be introduced before it controls behavior.

Recommended sequence:

1. Keep current hardcoded routing/navigation working.
2. Register every application and major module.
3. Add validation and documentation.
4. Drive internal navigation from the registry.
5. Drive public footer navigation from the registry.
6. Use registry metadata for layout selection.
7. Use registry metadata for search participation.
8. Use registry metadata for permission-aware visibility.
9. Move route ownership to registry-aware router during native rebuild.

