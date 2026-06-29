# GES Workspace

Status: architecture report  
Date: 2026-06-28  
Scope: permanent authenticated assessor workspace

The GES Workspace is the authenticated home screen for the assessor. It is not a public page, not a chart dashboard, and not a replacement for the Knowledge Platform or Search Service.

The Workspace answers one question:

```text
What do I need right now?
```

Everything else launches from here.

## Executive Direction

The permanent Workspace should become the authenticated landing page after successful sign-in. Recommended canonical route:

```text
/workspace/
```

The current `/home/` route is a useful project launch shortcut, but it is not the permanent Workspace. Its existing launch destinations can seed the Workspace launch module, while the permanent version should use the Internal Layout, permission-aware navigation, central Search Service, and Knowledge Platform feeds.

Do not build personalization, analytics, notifications, SQL, or drag-and-drop in the first implementation. Design the Workspace so those features can be added later without rewriting modules.

## Current Assets To Reuse

| Asset | Current role | Workspace treatment |
| --- | --- | --- |
| `src/ges/shell.js` | Owns `createGesInternalShell()` and layout attributes | Workspace should use Internal Layout through this shell |
| `src/ges/internal-permissions.js` | Current permission context based on `gpr_person=max-quattromani` | Use as temporary internal access gate until real authentication exists |
| `src/ges/project-nav.js` | Permission-aware project navigation and tracked link propagation | Reuse as Workspace navigation and route launch source |
| `src/ges/field-kit.js` | Owner-only utility belt with parcel search, share, local notes, inspector | Keep as a utility belt; do not turn it into the Workspace module system |
| `home/index.html` | Current static project launch page | Reuse destination set, not layout or hero treatment |
| `data/app/assessment-calendar-events.json` | 72 assessment calendar events | Seed Today's Agenda and Upcoming Calendar |
| `data/app/nebraska-taxpayer-action-dates.json` | 10 taxpayer-facing action dates | Seed deadline summaries when appropriate |
| `data/app/articles.json` | 5 article records, including 2 published and 3 draft | Seed Draft Articles, Published Articles, Recent Articles, Pinned Articles |
| `data/app/property-manifest.json` | 933 loaded properties | Seed parcel lookup launch and recent parcel item resolution |
| `data/app/legal-references.json` | 4 legal anchors | Seed pinned statutes until Knowledge Platform objects exist |
| `data/standards/iaao-glossary.json` | 115 glossary entries | Seed pinned glossary and recently viewed knowledge |
| `docs/ges/knowledge-platform.md` | Knowledge object architecture | Workspace must consume this model, not duplicate it |
| `docs/ges/article-publishing.md` | Article manifest and draft/public workflow | Workspace should use article status metadata from the manifest |

## Non-Goals

- No public footer.
- No Public Layout.
- No dashboard-first chart wall.
- No standalone Workspace search implementation.
- No duplicate statutes, glossary terms, PAD guidance, articles, or calendar data.
- No analytics implementation.
- No personalization implementation.
- No notifications implementation.
- No task engine implementation.
- No drag-and-drop implementation.
- No SQL implementation.

## Layout Contract

The Workspace uses the Internal Layout.

Required behavior:

- Set `data-ges-layout="internal"`.
- Set `data-ges-page-type="workspace"`.
- Use `createGesInternalShell()` or an app-specific internal shell built on the same contract.
- Mount permission-aware navigation.
- Mount the Field Kit only when the current internal tool permission allows it.
- Never append `[data-ges-public-footer]`.
- Preserve keyboard navigation and logical source order.
- Keep modules semantically separate with headings and landmarks.

Recommended shell regions:

```html
<main data-ges-shell="workspace">
  <section data-ges-workspace-region="summary"></section>
  <section data-ges-workspace-region="primary"></section>
  <aside data-ges-workspace-region="supporting"></aside>
</main>
```

The page shell owns regions and ordering. Modules own their own headings, actions, empty states, and data adapters.

## Workspace Wireframe

### Desktop

```text
Internal header / project navigation / account context
------------------------------------------------------
Workspace title row
  "What needs attention today?"      Global Search
  current date / county / role       Quick action cluster

Primary grid
------------------------------------------------------
| Today's Agenda                    | Pinned Knowledge |
| - due now                         | - statutes       |
| - hearings / meetings             | - PAD guidance   |
| - filing windows                  | - glossary terms |
|-----------------------------------|------------------|
| Upcoming Calendar                 | Recent Activity  |
| - next 7 / 30 days                | - parcels        |
| - protest period                  | - searches       |
| - PAD submissions                 | - knowledge      |
|-----------------------------------|------------------|
| Frequent Tools                    | Articles         |
| - parcel review                   | - drafts         |
| - BOE tracker                     | - published      |
| - forms / reports                 | - pinned         |
------------------------------------------------------
Optional lower band
| Workspace Notes | Future Tasks | Future Notifications |
```

### Tablet

```text
Header
Search
Today's Agenda
Upcoming Calendar
Pinned Knowledge
Recent Activity
Frequent Tools
Articles
Notes
```

### Mobile

```text
Header
Search
Today
Next deadlines
Pinned
Recent parcels
Tools
Articles
Notes
```

Mobile behavior should stack modules in attention order. Do not require horizontal scrolling or dense chart cards.

## Module Philosophy

A Workspace module is a focused answer surface, not a page inside a page.

Every module should:

- Answer one operational question.
- Render from a registered data provider.
- Have a stable module id.
- Have a short title and optional compact description.
- Expose one primary action at most.
- Use existing GES card, list, cluster, stack, and typography patterns.
- Support empty, loading, error, and permission-limited states.
- Degrade gracefully when a future service is absent.

Modules should not:

- Own global search.
- Store authoritative knowledge.
- Create their own citation system.
- Implement analytics.
- Implement task logic.
- Implement drag-and-drop.
- Hide critical deadlines behind tabs.
- Use decorative charts when a date, list, or link is clearer.

## Suggested Modules

| Module | Question answered | Initial data source | Future data source |
| --- | --- | --- | --- |
| `today-agenda` | What requires attention today? | Calendar events filtered by date, audience, priority | Workflow service and normalized deadlines |
| `upcoming-calendar` | What is coming soon? | `assessment-calendar-events.json`, PAD main calendar | Knowledge Platform calendar objects |
| `workflow-attention` | Which process is active right now? | Calendar phase and current date | Workflow rules and county-specific SOPs |
| `frequent-tools` | What do I open most often? | Static registered tool list | Personalization usage signals |
| `recent-parcels` | Which parcels was I just reviewing? | Local recent parcel ids resolved through property manifest | Authenticated recent activity |
| `recent-searches` | What did I just search? | Future local search history | Central Search Service activity feed |
| `recent-knowledge` | What knowledge did I recently view? | Future local object ids | Knowledge Platform activity feed |
| `pinned-knowledge` | What have I pinned for fast access? | Future local pin ids | User profile pin list |
| `pinned-articles` | Which articles matter to this user? | Article manifest plus future pin ids | Publication metadata and user pins |
| `pinned-statutes` | Which statutes are close at hand? | Legal anchors plus future pin ids | Knowledge Platform statute objects |
| `pinned-pad-guidance` | Which PAD guidance is close at hand? | Source registry references | Knowledge Platform source/document objects |
| `draft-articles` | What publication work is still draft? | `data/app/articles.json` internal view | Publication workflow service |
| `published-articles` | What has recently gone live? | `data/app/articles.json` | Publication metadata feed |
| `workspace-notes` | What local notes do I need nearby? | Field Kit local notes pattern | User-owned notes service |
| `future-tasks` | What assigned tasks exist? | Empty state only | Task service |
| `future-notifications` | What changed that I should know? | Empty state only | Notification service |
| `future-reports` | What reports are ready or pending? | Static launch links | Report queue service |

## Attention Order

The default Workspace order should be based on urgency, not organizational taxonomy.

Recommended default order:

1. Search and quick launch.
2. Today's Agenda.
3. Upcoming Calendar.
4. Workflow Attention.
5. Pinned Knowledge.
6. Recent Parcels and Recent Activity.
7. Frequent Tools.
8. Articles.
9. Notes.
10. Future tasks, notifications, and reports.

The Workspace should avoid a large hero. It should show a compact title row, current context, search, and the first work module within the first viewport.

## Workflow Awareness

The Workspace should eventually understand civic and assessment cycles.

Initial workflow states can be inferred from calendar phase, date windows, and audience:

- Protest period.
- Sales review.
- Board of Equalization meetings.
- Abstract filing.
- Assessment date.
- Valuation-change notice season.
- County Board deadlines.
- PAD submission windows.
- Taxing authority certification period.

Future workflow objects should come from the Knowledge Platform and workflow rules, not hardcoded Workspace copy.

Recommended workflow item shape:

```json
{
  "id": "workflow-protest-period-2026",
  "type": "workflow_window",
  "title": "Property valuation protest period",
  "status": "active",
  "startDate": "2026-06-01",
  "endDate": "2026-06-30",
  "audience": ["assessor", "boe"],
  "priority": "high",
  "sourceObjectIds": ["deadline-protest-filing-window", "neb-rev-stat-77-1502"],
  "primaryAction": {
    "label": "Open protest resources",
    "href": "articles/before-you-walk-into-a-property-protest/"
  }
}
```

The Workspace may render this object, but it should not author the underlying legal deadline or procedure.

## Pinning Architecture

Pinning should be object-based, not URL-based.

Users should eventually be able to pin:

- Articles.
- Statutes.
- Calendar events.
- Glossary entries.
- Procedures.
- Reports.
- Research.
- Tools.
- Parcels.

Recommended pin row:

```json
{
  "id": "pin-01",
  "userId": "user-max-quattromani",
  "objectType": "statute",
  "objectId": "neb-rev-stat-77-1502",
  "labelOverride": null,
  "workspaceModule": "pinned-knowledge",
  "sortOrder": 10,
  "createdAt": "2026-06-28T00:00:00-05:00"
}
```

During the static prototype stage, pins may be represented as local fixture data. Do not add a database or account profile store until authentication and persistence requirements are real.

## Smart Behavior Without Analytics

The Workspace should be ready for usage awareness, but it should not implement analytics now.

Future usage signals should be event-shaped and first-party:

```json
{
  "id": "activity-01",
  "userId": "user-max-quattromani",
  "eventType": "viewed_object",
  "objectType": "statute",
  "objectId": "neb-rev-stat-77-1502",
  "occurredAt": "2026-06-28T09:30:00-05:00",
  "source": "workspace"
}
```

Allowed future signals:

- Frequently viewed statutes.
- Frequently viewed glossary terms.
- Frequently viewed parcels.
- Recently used reports.
- Recent searches.
- Recent calendar activity.

Boundary:

- Do not use public visit analytics as Workspace personalization.
- Do not infer private workflow from public URL tracking parameters.
- Do not store private facts in URLs.
- Keep local-only prototype signals separate from production account data.

## Search Integration

The Workspace consumes the central GES Search Service.

Workspace search responsibilities:

- Provide placement and focus behavior.
- Pass query text and filters to Search.
- Render results returned by Search.
- Route selected results to the correct object or tool.

Workspace search must not:

- Build its own object index.
- Duplicate Knowledge Platform metadata.
- Maintain separate typeahead data.
- Own statute, glossary, article, parcel, or calendar search logic.

Until the Search Service exists, the Workspace architecture may specify a search slot with a disabled or placeholder state. Do not create a one-off Workspace search implementation.

## Knowledge Integration

The Workspace consumes the Knowledge Platform.

The Workspace can display:

- Pinned knowledge objects.
- Recently viewed knowledge objects.
- Deadline objects.
- Procedure objects.
- Statute objects.
- Glossary objects.
- PAD guidance/source document objects.
- Publication objects.

The Workspace must not:

- Duplicate knowledge object content.
- Create separate statute records.
- Create separate glossary records.
- Store PAD guidance text as module copy.
- Store workflow authority outside the Knowledge Platform.

## Module Registration Strategy

Modules should be registered centrally so the Workspace can render, reorder, hide, or personalize modules later without rewriting the page.

Recommended static registry shape:

```json
{
  "id": "today-agenda",
  "title": "Today's Agenda",
  "description": "Current deadlines, hearings, filing windows, and work periods.",
  "region": "primary",
  "defaultOrder": 10,
  "minRole": "assessor",
  "visibility": "internal",
  "dataProvider": "calendar.today",
  "component": "workspace-agenda-module",
  "supportsPinning": false,
  "supportsPersonalOrder": true,
  "emptyState": "No dated items require attention today."
}
```

Recommended registry fields:

- `id`
- `title`
- `description`
- `region`
- `defaultOrder`
- `minRole`
- `visibility`
- `dataProvider`
- `component`
- `supportsPinning`
- `supportsPersonalOrder`
- `supportsDismissal`
- `emptyState`
- `errorState`
- `maxItems`
- `sourceSystem`

Module registration should be separate from user preferences. The registry says what can exist. A future user profile says what this user wants visible or prioritized.

## Future Personalization Strategy

Personalization should begin with explicit user choices before inferred behavior.

Recommended progression:

1. Static default Workspace.
2. Explicit pins.
3. Explicit hidden modules.
4. Explicit module order by registered module id.
5. Recent activity.
6. Frequently used tools and objects.
7. Role/county-specific workflow recommendations.

Recommended future preference shape:

```json
{
  "userId": "user-max-quattromani",
  "workspaceVersion": 1,
  "moduleOrder": ["today-agenda", "upcoming-calendar", "pinned-knowledge", "recent-parcels"],
  "hiddenModules": ["future-notifications"],
  "compactModules": ["published-articles"],
  "pinnedObjectIds": ["article-protest-evidence-guide", "neb-rev-stat-77-1502"]
}
```

Do not implement this storage yet.

## Visual Style Bible

### Workspace Philosophy

The Workspace is operational, quiet, and fast. It should feel like a professional desk with the right files already open, not a command center trying to impress the user.

### Module Philosophy

Modules are small work surfaces. They should use existing GES component cards, list rows, buttons, tags, and typography. They should avoid custom card systems and avoid chart-forward dashboard styling.

### Pinning

Pinned items are commitments by the user. They deserve stable placement and predictable labels. A pinned item should open immediately or reveal one obvious next action.

### Workflow

Workflow modules should surface timing and required attention. They should not attempt to decide outcomes or replace legal/procedural authority.

### Future Personalization

Personalization should reduce friction. It should never make the Workspace unpredictable. Defaults must remain useful when no user history exists.

### Density

The default density should be compact enough for repeated daily use. Use short headings, one-line metadata, and small action clusters. Avoid oversized hero treatment.

### Color

Use color sparingly for state, priority, and category hints. Do not create a traffic-light dashboard or a field of bright KPI panels.

### Accessibility

Every module should have a heading. Lists should be real lists. Actions should be real buttons or links. Search should be keyboard-first. Empty states and updates should be readable by assistive technology where state changes occur.

## Future Data Flow

```text
Authentication
  -> user / role / county context
  -> workspace module registry
  -> user preferences and pins
  -> Knowledge Platform objects
  -> Search Service results
  -> Calendar / workflow feeds
  -> Workspace modules
```

The Workspace is the orchestrator of presentation, not the owner of those systems.

## Technical Debt

- The current `/home/` page is a public/static shortcut with a custom hero and local CSS; it is not yet an Internal Layout route.
- `createGesInternalShell()` exists, but there is not yet a permanent internal workspace shell implementation.
- Project navigation currently lists destinations manually in `INTERNAL_PROJECT_NAV_SECTIONS`; future Workspace tools should be registered once and shared with navigation where possible.
- Field Kit local notes exist, but they are device-local utility notes, not authenticated Workspace notes.
- Current internal access is based on query-string context, not real authentication.
- Central Search Service does not exist yet.
- Knowledge Platform object files do not exist yet; current modules must consume existing app-ready JSON until normalized feeds are generated.
- Recent activity, pins, module order, and frequency counts do not have persistence yet.
- The current article manifest has draft/published metadata, but no publication workflow service.
- Calendar data exists in multiple app-ready shapes and should eventually be generated from normalized Knowledge Platform calendar/deadline objects.

## Validation Against Task Requirements

| Requirement | Result |
| --- | --- |
| Authenticated assessor home screen | Defined as `/workspace/` using Internal Layout after future authentication |
| Not public | Public Layout and public footer explicitly forbidden |
| Not chart dashboard | Module philosophy rejects KPI/chart-heavy treatment |
| Current work and deadlines | Today's Agenda, Upcoming Calendar, Workflow Attention defined |
| Recent and frequent activity | Recent parcels, searches, knowledge, tools, reports defined as future-ready modules |
| Pinning | Object-based pin architecture documented |
| Movable modules | Central module registry and future user order documented without drag-and-drop |
| Search | Workspace consumes central Search Service only |
| Knowledge | Workspace consumes Knowledge Platform only |
| Responsive behavior | Desktop, tablet, and mobile wireframes documented |
| Style bible | Workspace philosophy, modules, pinning, workflow, personalization, density, color, accessibility documented |
| No analytics/personalization/notifications implementation | Architecture reserves future shapes only |
| Technical debt | Current route, shell, auth, search, knowledge, and persistence gaps documented |

## First Implementation Recommendation

Build the first runtime Workspace only after the module registry and Internal Layout shell are accepted.

The first implementation should include:

1. Static Internal Layout Workspace route.
2. Central module registry file.
3. Today's Agenda from existing calendar events.
4. Upcoming Calendar from existing calendar events.
5. Frequent Tools from the current project navigation destination list.
6. Draft and Published Articles from `data/app/articles.json`.
7. Placeholder Search slot that clearly depends on the future Search Service.
8. Placeholder Pinned Knowledge slot that clearly depends on future pin storage and Knowledge Platform object ids.

Do not include personalization, notifications, analytics, or drag-and-drop in the first runtime pass.
