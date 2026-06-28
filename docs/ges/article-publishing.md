# GES Article Publishing

GES articles are organized as a structured knowledge library, not a blog.

The canonical public entry point is `/articles/`. It renders from `data/app/articles.json` and uses the Public Layout.

## Article Roll

Purpose: list every published GES article in newest-first order for public readers while allowing internal users to see draft metadata and publishing status.

Behavior:

- Public view shows only articles where `published` is `true` and `draft` is `false`.
- Internal view is enabled by the existing `gpr_person=max-quattromani` permission context.
- Internal view shows published and draft entries, publication status, draft source notes, and sort controls.
- Reading Progress does not mount on the roll. Individual article routes own Reading Progress.
- Article cards use `ges-component-card`, `article-entry-tags`, Public Layout spacing, and GES typography.

## Publishing Metadata

The manifest is the publishing source for roll rendering.

Current manifest path:

```text
data/app/articles.json
```

Recommended article fields:

- `id`
- `title`
- `subtitle`
- `slug`
- `legacySlug`
- `published`
- `draft`
- `featured`
- `publishDate`
- `modifiedDate`
- `displayDate`
- `route.canonicalPath`
- `route.legacyQueryValue`
- `hero.src`
- `hero.alt`
- `excerpt`
- `author`
- `readingTime.minutes`
- `readingTime.wordCount`
- `categories`
- `tags`
- `keywords`
- `compatibility.readingProgress`
- `compatibility.qr`
- `resources`
- `references.glossaryReferences`
- `references.statuteReferences`
- `references.legalReferences`
- `social`

The route renderer should assemble cards from metadata. Article body source files may still contain legacy metadata during transition, but new roll behavior should read from the manifest.

## Draft Workflow

Draft article metadata may be entered before a public article route exists.

Draft rules:

- Set `draft` to `true`.
- Set `published` to `false`.
- Use a reserved `route.canonicalPath` only when a route is planned.
- Add `route.sourceNote` when metadata comes from a planning document or publication readiness review.
- Keep `compatibility.qr` false until the public route is live.
- Use the shared draft hero only when no real hero exists.

Drafts must never appear publicly.

## Public Workflow

To publish an article into the public roll:

1. Create or verify the article route.
2. Add a manifest entry with `published: true` and `draft: false`.
3. Provide a real hero image and descriptive `alt`.
4. Add title, subtitle, excerpt, author, dates, categories, tags, keywords, reading time, route path, and resource indicators.
5. Verify `/articles/` shows the article newest-first without internal status UI.
6. Verify the article route still owns Reading Progress.

## Internal Workflow

Internal users can open:

```text
/articles/?gpr_person=max-quattromani
```

Internal view supports sorting by:

- Publication date
- Published
- Draft
- Recently modified
- Alphabetical

Future internal additions may include edit links, analytics summaries, and publish queue states. Do not add editing or CMS behavior to the roll.

## Article Cards

Each card should include:

- Hero image
- Title
- Optional subtitle
- Excerpt
- Publication date
- Optional modified date
- Author
- Estimated reading time
- Categories
- Tags
- Reading Progress compatibility
- QR compatibility
- Optional resources indicator
- Internal-only publication status

Accessibility:

- Render each card as a semantic `article`.
- Use one card heading for the article title.
- Keep image `alt` text descriptive unless the image is decorative.
- Preserve keyboard focus on search, filters, sort, suggestions, and article links.
- Keep source order as image, metadata, title, summary, facts, taxonomy.

Search:

- Search is client-side and lightweight.
- The search index is built from title, subtitle, excerpt, author, categories, tags, keywords, glossary references, statute references, and legal references.
- Typeahead suggestions come from the same metadata fields.

Filtering:

- Category filters are driven by `taxonomy.categories`.
- Future categories should be added to the manifest taxonomy before route code changes are considered.
