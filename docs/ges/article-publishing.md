# GES Article Publishing

GES articles are structured civic explainers, not one-off pages. Future article work should provide content, metadata, hero media, and any article-specific component data; the shared article system owns the masthead, attribution, tools, typography, and reading frame.

## Template Structure

Every article route should use `createGesArticleShell()` and the shared article components in `src/ges/article-components.js`.

Standard order:

1. `renderArticleMasthead()`
2. Hero media inside the masthead
3. `renderArticleEntryPanel()`
4. Opening article section
5. Article body sections and article-specific components
6. Resources, sources, continuation, or closing modules when needed

`renderArticleHero()` remains as a compatibility alias for `renderArticleMasthead()`. New code should use the article names.

## Masthead

The masthead owns:

- `article-kicker`
- `article-title`
- `article-trust-signals`
- `article-standfirst`
- `article-publication-meta`
- `article-hero-media`

Do not add article-specific masthead CSS, alternate title classes, page-specific heading overrides, visible topic chips, or custom metadata rows. The kicker is the visible taxonomy. Keep tags and keywords in metadata for search/SEO, not visible article header UI.

## Metadata

Required article metadata:

- `id`
- `title`
- `subtitle` or `description`
- `canonicalPath`
- `publishedDate` or `publishDate`
- `author`
- `authorEmail`
- `authorTitle`
- `reading.minutes` or `readingTime.minutes`
- `assets.authorImage`
- hero media `src`/`alt`

Optional article metadata:

- `modifiedDate`
- `currentAsOfDate`
- `keywords`
- `categories`
- `tags`
- `resources`
- `references`
- `social`

Publication UI renders only supplied public facts. A second date appears only when `currentAsOfDate` is explicitly provided and differs from the published date:

```text
Published July 8, 2026
Published [publish date] | Current as of [content-current date]
```

Do not update visible article dates for platform changes such as CSS, hero treatment, accessibility, analytics, cache busting, article tools, or layout refinements.

## Reader Count

The trust row format is:

```text
About a 6 minute read | Read by 199 people
```

Rules:

- Read time appears first.
- Reader count appears second.
- No icon, pill, badge, border, or background.
- Counts below 100 are hidden.
- Missing or failed reader-count requests fail silently.
- The separator appears only when both values render.

## Author

Use `renderArticleEntryPanel()` or `renderArticleAuthor()`.

Public display:

```text
Max Quattromani
Certified in Nebraska Property Assessment
```

Do not render dates, reader counts, "By", or assessor-office credential language in the author block.

## Article Tools

Use `renderArticleTools()` through `renderArticleEntryPanel()`.

Current tools:

- Listen
- Print
- Share

Tools are quiet utilities: small type, consistent icons, light border, subdued color, and responsive wrapping. They are not CTAs and should not receive article-specific CSS.

## Typography

Article hierarchy should come from size, spacing, color, line height, and whitespace more than weight.

Locked roles:

- Kicker: small uppercase informational label.
- H1: largest page text and visually dominant.
- Trust row: medium-weight muted slate/blue-gray editorial confidence.
- Standfirst: readable support copy, larger than body, below H1.
- Publication metadata: small and subdued.
- H2: strong section heading, clearly secondary to H1.
- H3: compact subsection heading.
- Body: comfortable editorial rhythm.
- Caption/utility text: small, quiet, and low contrast.

## Article-Specific Components

Calculators, charts, maps, simulations, and explainers may keep their own component styles. They should sit inside the shared article body rhythm and must not redefine the shared masthead, H1, author block, article tools, publication metadata, or baseline body typography.

## Verification

Run:

```bash
npm run check:syntax
npm run test:article-reader-count
npm run verify:articles
```

`verify:articles` checks article rendering across mobile/desktop and light/dark themes, including H1 hierarchy, trust-row reader counts, publication metadata, author credential, absence of visible topic chips, stale author text, and separator cleanup.
