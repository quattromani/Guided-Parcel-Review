# Refactoring Older Articles Into GES

Use this guide when converting older article designs into GES 1.0.

## Migration Workflow

1. Identify the article type: guide, explainer, case study, field note, resource, or tool.
2. Preserve the core message and useful prose.
3. Extract metadata, assets, resources, component data, and section copy into `src/content/articles/`.
4. Map ordinary markup to base elements before adding component classes.
5. Replace one-off cards with standard GES components.
6. Replace custom colors with tokens.
7. Replace repeated labels with component structure.
8. Remove decorative-only elements.
9. Use Margin Insight only where it improves orientation.
10. Verify mobile behavior.
11. Verify print behavior.
12. Confirm dark-mode compatibility.
13. Run CSS and JS sanitation checks.

Do not solve migration by creating a larger article template that contains duplicate versions of existing components. Refactor toward smaller reusable components and route-level composition.

For dynamic routes, use `createGesArticleShell()` to prepare landmarks and named regions. Then mount the article cover and body content from component renderers. Do not move component rendering into the shell helper.

## Mapping Old Patterns

- Hero/title block -> Article Cover.
- Byline/date/read time -> Author / Metadata Block.
- One-off callout -> Practical Note, Margin Insight, or plain prose.
- Side-by-side opinion cards -> Comparison Card.
- Long procedural list -> Process Strip or checklist.
- Evidence examples -> Evidence Translation Matrix.
- Official links -> Resource Panel.
- Footer next step -> Continuation Module before sources.
- Loud citation card -> Authority / Source Citation.

## Editorial Review Checklist

- Hierarchy: title, section headings, component headings, metadata.
- Rhythm: no dense components without quiet space.
- Accessibility: headings, labels, focus, contrast, source order.
- Light theme: readable and restrained.
- Dark theme: night edition, not inverted app shell.
- Print: useful as a handout.
- Component consistency: no local behavior overrides.
- Typography: no centered body copy, no viewport-based font scaling.
- Source treatment: citations support trust without interrupting reading.
- Mobile scanability: labels stay attached to values.
- Margin Insight necessity: each one earns its place.
- Narrative flow: sections answer one cognitive task at a time.
- Decorative element removal: delete anything that only adds variety.
- CTA clarity: one next step should dominate.
- Source/citation clarity: sources remain inspectable and printable.

## Anti-Patterns

Avoid:

- centered body text
- decorative gradients
- decorative drop shadows
- multiple accent colors in one component
- nested cards
- cards inside cards inside cards
- more than one competing call to action
- summary bullets that replace reading
- icons without semantic purpose
- unnecessary labels
- arbitrary spacing
- hard-coded colors
- page-specific component overrides
- article-sized templates that duplicate component responsibilities
- dark-mode patches that should be token changes
- components that exist only to decorate

## Sanitation Checklist

For every file, selector, token, component, and asset, ask:

```text
Who uses this?
```

Remove:

- unused CSS selectors
- dead utility classes
- duplicate component styles
- deprecated variants
- temporary compatibility rules
- hard-coded values replaced by tokens
- duplicate tokens
- orphaned variables
- unused helper classes
- experimental components no longer referenced
- dead JavaScript
- unused imports
- empty wrappers
- old comments describing behavior that no longer exists
- obsolete print rules
- deprecated documentation

Do not preserve code just in case. Git is the archive.
