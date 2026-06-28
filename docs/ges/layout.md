# GES Layout

GES layout should make the reader feel oriented, not impressed.

GES uses a layout-first architecture. Pages supply metadata, page type, and content. Layouts supply structure, navigation, footer behavior, metadata handling, and shared public experience.

## Layout Taxonomy

Public Layout: used for public-facing articles, guides, tools, calculators, search results, QR-linked public summaries, public calendar pages, glossary pages, resource pages, and similar publication surfaces. Expected structure: global header, reading progress when applicable, optional hero, primary content, optional margin insights, optional related content, optional resources block, public footer, and copyright/version metadata.

Internal Layout: used for authenticated assessor-facing workspaces and private tools. Expected structure: header, permission-aware navigation, utility belt when permitted, dashboard or workspace content, and internal navigation. It does not receive the public footer unless a future route explicitly opts into a public export mode.

Printable Layout: used for browser-print-friendly pages. Expected structure: title context, primary content, resources or citations where applicable, and minimal branding. Interactive UI, sticky navigation, public footer navigation, and the utility belt should be hidden in print.

PDF Layout: used for generated PDFs and report exports. Expected structure: report header, body sections, charts or visual summaries, resources or citations where applicable, QR code support when available, and print-optimized metadata. PDF layout is generated separately from screen layout, even when it shares source content.

Minimal Layout: used for 404, maintenance, loading, standalone confirmation, and other special-purpose pages. Expected structure: minimal brand/header, focused content, recovery/search action where applicable, and a simple public footer only when appropriate.

## Layout Selection

Layout selection is centralized in `src/ges/shell.js`. Public routes should use `createGesPublicShell()` or a specialized public helper such as `createGesArticleShell()`. Internal workspaces should use app-specific or future `createGesInternalShell()` flows and must not append `[data-ges-public-footer]`.

`src/ges/public-layout.js` owns public layout attributes, central metadata application, and the reusable public footer. The layout sets `data-ges-layout="public"` on the document element, records page type through `data-ges-page-type`, and appends one `[data-ges-public-footer]` instance.

Static route wrappers may exist only to support clean static URLs. They should contain named shell regions and the app bootstrap, not duplicated page structure or footer markup.

## Widths

- `ges-reading`: prose and narrow explanatory sections.
- `ges-wide`: components that need comparison or scanning.
- `ges-cover-width`: article cover and full article rhythm.
- `ges-full-bleed`: rare immersive media or tools.

Default behavior:

- prose stays narrow
- diagrams and matrices may go wide
- source URLs use available width in print
- margin insights sit beside section headers only when width allows

## Density Modes

Density modes adjust rhythm:

- Compact: reference-heavy pages, short explainers, dense tools.
- Standard: normal articles and guides.
- Immersive: slower narrative field guides or media-led stories.

Density must not introduce new visual variants. It only changes spacing and card padding.

## Layout Primitives

- `ges-stack`: vertical rhythm.
- `ges-cluster`: wrapping inline actions.
- `ges-grid`: repeatable grid.
- `ges-section-lead`: section header/prose plus optional margin insight.

Use primitives before writing local layout CSS.

## Page Composition

GES does not use page-sized or article-sized macro templates as a substitute for components.

Allowed:

- semantic shells that provide landmarks
- route composition that orders known components
- small helpers that render one reusable component
- layout primitives that arrange children without changing their meaning

Avoid:

- one-shot article templates
- page templates that duplicate component markup
- wrapper templates that restyle children by context
- component behavior that depends on a specific page shell

The page owns order. Components own behavior.

## Shell API

Dynamic editorial routes should use `src/ges/shell.js` to resolve the shared shell contract:

```html
<main data-ges-shell="article">
  <section data-ges-shell-region="cover"></section>
  <div data-ges-shell-region="body"></div>
</main>
```

The API prepares the shell and exposes `setCover()` and `setBody()` for already-rendered component HTML. It does not render a cover, article, source block, continuation module, or any other component.

Public page shell wrappers use the same contract:

```html
<main data-ges-shell="minimal">
  <section data-ges-shell-region="cover"></section>
  <div data-ges-shell-region="body"></div>
</main>
```

The route renderer supplies metadata and content. The layout supplies the header relationship, public footer, metadata plumbing, and public/internal visibility behavior.

## Public Footer

The canonical public footer is rendered by `ensureGesPublicFooter()` from `src/ges/public-layout.js`. It contains About, FAQ, Contact, and Administrative links, plus copyright, GES identity, and deployment version metadata. It also reserves hidden future slots for source code, release notes, county attribution, open-source attribution, data provenance, and accessibility contact.

Do not paste public footer markup into individual pages. Public pages inherit it through Public Layout. Internal authenticated workspaces and assessor tools do not receive it.

## Administrative Route

`/administrative/` is the single public route for Privacy Policy, Terms of Use, Accessibility Statement, Legal Notices, Copyright, Source/Data Notices, and future administrative sections. Do not create separate privacy, terms, or accessibility routes unless the publication architecture is deliberately changed.

The current route reuses existing Guided Parcel Review footer-panel language where it already exists and leaves future-only sections as placeholders. It includes local section navigation with anchors and an accessible heading hierarchy.

## Public Routes

Phase 02 prepares clean public routes:

- `/about/`
- `/faq/`
- `/contact/`
- `/administrative/`

About, FAQ, and Contact are placeholders unless existing project copy is safe to reuse. Full content belongs in later editorial tasks. The wrappers exist for static routing; the layout and footer are inherited.

## Metadata

Public Layout metadata is applied through `applyGesPublicMetadata()`. A public page can provide title, description, canonical path or URL, social title, social description, social image, author, published date, modified date, page type, keywords, tags, and categories.

Do not scatter equivalent metadata helpers across new routes. Mature article routes may keep existing route-specific JSON-LD while migrating common meta tags into the shared metadata helper.

## Public vs Internal Visibility

Public footer and public administrative navigation appear on public-facing layouts: articles, guides, public tools, calculators, public search results, 404 or recovery pages, QR-linked public summaries, public calendars, glossary pages, and resource pages.

They do not appear in internal assessor dashboards, internal parcel lookup, administrative workspaces, authenticated GES tools, private permission-key utilities, internal reports, or assessor-only calendars/work queues. This rule is enforced by layout selection rather than route-specific footer conditionals.

## Future Page Pattern

For a new public page:

1. Add or select a static route wrapper only if the host needs a clean path.
2. Add a route definition with metadata, page type, and content source.
3. Render through `createGesPublicShell()` or a specialized public shell helper.
4. Mount page content into shell regions.
5. Let Public Layout provide metadata handling and footer behavior.

For an internal tool:

1. Use the internal app/workspace shell.
2. Keep permission-aware navigation and utility-belt behavior in the internal layout.
3. Do not append the public footer.
4. Add an explicit public export/print path if the content needs public presentation.

## Mobile Behavior

- Stack components before introducing horizontal scroll.
- Keep labels attached to values.
- Preserve DOM order.
- Let text wrap.
- Avoid wide tables unless wrapped in `ges-table-scroll`.

## Print Behavior

Print uses portrait Letter by default. Components should use `break-inside: avoid` where splitting would damage meaning.

Screen-only controls disappear in print. Substance remains: dates, source citations, visible URLs, tables, and diagrams.
