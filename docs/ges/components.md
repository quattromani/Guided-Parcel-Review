# GES Components

Each component must have a purpose, responsibilities, dependencies, variants, accessibility notes, mobile behavior, print behavior, and a future evolution note.

## Article Cover

Purpose: introduce the guide calmly.

Responsibilities: kicker, title, subtitle/dek, tags, hero media, optional play overlay.

Use when: standalone GES guide or article.

Do not use when: the guide is embedded inside an app workflow.

Accessibility: one `h1`; media has useful alt text or caption; play button is labelled.

Mobile: cover stacks; brand mark remains visible; long kicker text can hide.

Print: preserve title/dek/tags; hide interactive media controls.

Future: migrate `article-hero` and `guide-hero` to one preferred class after legacy route names are retired.

## Author / Metadata Block

Purpose: identify author, credential, date, and reading format options.

Dependencies: article source artifact should provide author, image, credential, date, reading minutes, word count, formats.

Use when: every standalone article.

Do not use when: the surrounding product shell already owns identity.

Accessibility: author link text is meaningful; avatar is decorative unless editorially necessary.

Email affordance: when the author name is a `mailto:` link, include the small circular mail icon inside the same link after the name. Keep the icon decorative with `aria-hidden="true"` so the accessible link name remains the author.

Print: keep author/date; hide click-only controls.

## Available Formats Controls

Purpose: present printable guide, audio version, and future format choices.

Use when: maintained alternate formats exist.

Do not use when: the link would be stale or unavailable.

Accessibility: links/buttons have visible labels and focus states.

Mobile: controls wrap inside a compact segmented row.

Print: hide dead controls; preserve visible URLs where useful.

## Reading Progress

Purpose: provide a calm, persistent sense of progress through the editorial body of a long-form GES page.

Behavior: mount one fixed `ges-reading-progress` element at the top of the viewport and mark the measured body with `data-ges-reading-progress-target`. Add `data-ges-reading-progress-end` at the end of the actual article text when the article element also contains share controls, related articles, resources, comments, or source appendices. The component should not measure the hero, navigation, public footer, resource appendix, or future comments.

Animation philosophy: movement follows scroll position directly through `requestAnimationFrame`. The filled line scales on the X axis and the marker moves with `translate3d`; there is no bounce, elastic easing, or decorative animation.

Color usage: the completed portion and marker use `--ges-reading-progress-accent`, which defaults to the GES Hyper Blue value through `--ges-color-hyper-blue` when available. The remaining baseline uses muted GES border color. Keep the subtle glow tied to the same accent and avoid expanding the component beyond a thin editorial cue.

Accessibility: the indicator is decorative and `aria-hidden`. It has no focusable controls, no announced percentage, and no screen-reader interruption. Respect `prefers-reduced-motion`; reduced-motion users receive direct state updates without compositor hints.

Performance considerations: cache article geometry and recompute on resize, visual viewport resize, load, and target resize. Scroll handling must stay passive and be throttled through `requestAnimationFrame`. Use transforms rather than width/left changes so long articles remain smooth.

Future usage guidance: use this for articles, guides, explainers, campaign platform pages, legal references, and tutorials. Prefer explicit target/end markers over hard-coded route classes. If an article body is split across multiple containers, wrap the measurable editorial body in a lightweight target container instead of broadening the component to the whole page.

## Public Footer

Purpose: provide stable public navigation and publication metadata for every public-facing GES layout.

Behavior: render one `[data-ges-public-footer]` through `ensureGesPublicFooter()` as part of Public Layout inheritance. The footer belongs after the primary public content and after related content or Resources Block sections. Do not place footer markup manually into route files.

Links: include About, FAQ, Contact, and Administrative. The Administrative route owns Privacy Policy, Terms of Use, Accessibility Statement, Legal Notices, Copyright, Source/Data Notices, and future administrative sections.

Metadata: show copyright, Guided Editorial System identity, and deployment version. Reserve future slots for source code, release notes, county attribution, open-source attribution, data/source provenance, and accessibility contact without displaying empty UI.

Public/internal rule: public pages inherit the footer. Internal assessor workspaces, private permission-key tools, internal reports, authenticated utility surfaces, and administrative workspaces do not.

Accessibility: render as a `footer` landmark with a labelled navigation region. Links use descriptive text, visible focus states, and normal keyboard behavior. The footer should not announce dynamic status or add interactive controls unless a future component explicitly owns that behavior.

Print: hide the public footer in browser print. Printable and PDF layouts carry their own print-appropriate metadata and citations.

## About Page

Purpose: establish trust in Guided Parcel Review and GES for public readers, future counties, assessors, organizations, and contributors.

Behavior: render through Public Layout only. The About route supplies metadata, hero copy, local section navigation, and content sections; Public Layout supplies landmarks, footer behavior, metadata plumbing, and public/internal visibility.

Source language: reuse project-source language before writing new copy. Current canonical sources include the README, existing `site-copy.json` About panel, GES design bible, and published article metadata. Do not invent campaign biography or resume material.

Sections: Mission, About the Author, Why GES Exists, Project Philosophy, Open Source, and Future Vision. Keep each section concise and informational.

Tone: professional, transparent, and human. Avoid campaign language, endorsement language, persuasion, slogans, or oversized personal narrative.

Accessibility: use one `h1`, section-level `h2` headings, descriptive anchor text, keyboard-accessible section navigation, and semantic article/section structure.

Print: preserve the substantive page content. Hide local section navigation through the existing public-layout print rule.

## Mission Page

Purpose: explain why GES exists and what public understanding it is meant to improve.

Behavior: future mission-focused pages should use Public Layout and the same informational-page rhythm as About. They may expand on assessment, equalization, taxes, Nebraska law, public transparency, and process literacy, but should not become marketing pages.

Writing standard: mission copy should explain practical reader outcomes: what a person can understand, verify, ask, or do next. It should not promise outcomes, replace official determinations, or flatten the complexity of public assessment work.

## Public Author Profile

Purpose: identify the responsible author without turning public informational pages into resumes.

Use when: the author's identity or credential materially supports trust in the page.

Current pattern: use `ges-public-author-profile` inside a normal public page section. The existing author image may be decorative with empty `alt` text when the adjacent prose names the author.

Content: keep biography concise. State sourced credentials, project role, relevant technical/public-administration focus, and commitment to clarity and transparency. Avoid unsupported biography, campaign material, endorsements, and personal persuasion.

Mobile: keep the profile compact. The image should remain secondary to the prose and should not create a new visual language.

## Public Informational Pages

Purpose: provide stable public pages such as About, FAQ, Contact, Administrative, future mission pages, resource pages, glossary pages, and recovery pages.

Behavior: use layout-first inheritance. Pages provide metadata, page type, hero copy, local section navigation when helpful, and content. Public Layout provides structure, navigation/footer behavior, metadata handling, and print relationship.

Styling: use `ges-public-page`, `ges-public-page__body`, `ges-public-page__section`, `ges-public-section-nav`, and small documented variants. Do not create custom layout shells for individual informational pages.

Accessibility: preserve landmarks, logical heading hierarchy, focus states, descriptive links, and source order. Section navigation is optional but should remain usable on mobile when present.

Future guidance: promote placeholder public routes into permanent pages one at a time. Reuse existing project copy first, then add carefully scoped editorial text only where the source material leaves a real gap.

## Project Navigation Utility

Purpose: unlock a compact project table of contents from the Guided Parcel Review house mark during Max review sessions.

Triggering parameter: enabled only when the current URL contains `gpr_person=max-quattromani`. That parameter name and value come from the existing tracking URL pattern. Do not rename it, replace it, or add a second internal-mode parameter.

Link organization: group destinations by type, such as Parcel Review, Articles, Explainers and Calculators, Experiments, and Design System and Patterns. Use sliding drawers so the menu stays compact as the project grows.

Link propagation: dropdown links are passed through `appendTrackingParam()`, which preserves the active first-party tracking context for internal project page URLs. The helper appends missing tracking fields with `?` or `&` as appropriate, preserves hash fragments, and does not duplicate existing parameters. It skips external URLs, `mailto:`, `tel:`, downloaded assets, PDFs, images, and other non-page resources.

Public/private behavior: public visitors do not get the dropdown and the house mark remains normal static branding. The UI does not use visible "admin," "private," or "internal" language.

Accessibility: the enhanced house mark becomes a real `button` with `aria-expanded` and `aria-controls`. Each drawer heading is also a real button with `aria-expanded` and `aria-controls`; collapsed drawer links are removed from the tab order. The menu is a non-modal navigation region, remains keyboard reachable, closes on Escape, closes on outside click, and does not trap focus.

Navigation toggle: the trigger uses the Civic House mark as its closed state and a quiet close mark as its open state. Do not replace the mark with a hamburger or route-specific icon. The close state is built inside the same trigger so the icon communicates "dismiss" and "return to content" while preserving the project identity.

Closed state: show the Civic House mark at normal scale and opacity. The button label is "Open Guided Parcel Review project navigation" and `aria-expanded` is `false`.

Open state: collapse and fade the house mark while two short strokes resolve into a close mark. The button label is "Close Guided Parcel Review project navigation" and `aria-expanded` is `true`.

Animation timing: use transform and opacity only, approximately 190ms, with the GES ease-in-out token. The motion should feel deliberate and editorial: no bounce, spring, elastic easing, or decorative flourish. Repeated taps must be able to interrupt the transition without leaving mixed visual states.

Reduced-motion behavior: under `prefers-reduced-motion: reduce`, keep the same states but shorten transitions to an effectively immediate change.

Markup: use `ges-project-nav`, `ges-project-nav__trigger`, `ges-project-nav__menu`, `ges-project-nav__section`, `ges-project-nav__drawer-trigger`, `ges-project-nav__drawer-panel`, and `ges-project-nav__link`.

Future links: add project destinations in `INTERNAL_PROJECT_NAV_SECTIONS` in `src/ges/project-nav.js`. Use internal page URLs only. Do not add PDFs, images, downloads, email links, phone links, or external URLs unless the propagation rules are intentionally changed.

## Field Kit Utility Belt

Purpose: provide Max-only productivity tools while testing, demonstrating, sharing, and developing Guided Parcel Review. This is a field kit, not a public toolbar.

Permission behavior: mounted only when the current URL contains `gpr_person=max-quattromani`. Project navigation and Field Kit permissions are intentionally separate in `src/ges/internal-permissions.js`: `INTERNAL_MENU_PERSON_SLUGS` can grow for trusted menu users, but `hasInternalToolPermission()` remains owner-only.

Public/private behavior: public visitors do not receive the Field Kit markup, styles, controls, local notes UI, parcel search launcher, share utility, or component inspector. Avoid visible "admin," "private," or "internal" labels.

Available utilities:

- Parcel Search: searches loaded parcel records by owner name, owner last name after background hydration, property address, and parcel identifiers. Selecting a result opens the existing property view with `property` and `view=property` while preserving the active tracking query.
- Share / Tracked Link: exposes the current URL for copy or native share. It preserves the current article, parcel query, hash, and tracking identity already present in the address bar.
- Quick Notes: a local scratchpad autosaved to `localStorage` under `guidedParcelReview.internalFieldKit.notes.v1`. Notes stay on the device and are not sent to analytics.
- Component Inspector: toggles subtle outlines and badges for major GES components such as Article Cover, Margin Insight, Decision Tree, Evidence Translation Matrix, Process Strip, Resource Panel, Practical Note, Continuation Module, and Authority Citation.

Visual treatment: use `ges-field-kit`, `ges-field-kit__button`, `ges-field-kit__panel`, and `ges-field-kit__tooltip`. The belt is a bottom-centered smoke-glass capsule with slightly more opaque circular glass icon buttons, gentle elevation, and no text labels by default.

Accessibility: the belt is a toolbar of real buttons with accessible labels. Panel triggers use `aria-expanded` and `aria-controls`; the inspector uses `aria-pressed`. Panels are non-modal, keyboard reachable, close on Escape, close on outside click, and do not trap focus. Focus states must remain visible.

Theme and mobile behavior: the component uses GES surface, border, text, focus, spacing, radius, motion, and shadow tokens with fallbacks. It supports light and dark themes and remains in the bottom thumb zone on mobile without widening the viewport.

Adding tools: add a new tool descriptor, panel markup if needed, and initialization handler in `src/ges/field-kit.js`; add only component-specific styles in `src/ges/field-kit.css`. Keep new tools behind `hasInternalToolPermission()` unless the permission model is deliberately changed.

## Section Header

Purpose: introduce a cognitive task.

Use when: every major article section.

Do not use when: the label duplicates the heading.

Accessibility: preserve heading hierarchy.

Mobile/print: optional Margin Insight follows the heading in source order.

## Margin Insight

Purpose: short orientation cue for skimmers.

Use when: a long or important section benefits from a quick handle.

Do not use when: it repeats the heading, replaces reading, or adds visual variety only.

Rules: usually 6-14 words; no bullets; no hype; no "remember this!" language.

Accessibility: meaningful supplemental text remains exposed.

Placement: Margin Insights may sit in the right margin at the top of a section, stack directly below a section heading, or appear below body content. When a section with a Margin Insight follows prior body content, the design system adds a decorative full-width two-line paper-fold crease above the section, before the heading and insight row.

First section exception: do not use the after-content crease on the first section's Margin Insight. There is no preceding body content to separate, so the crease adds noise. Opening sections should keep `ges-opening-section` or use `ges-margin-insight--first` when a manual state is needed.

Authoring: prefer the shared `renderMarginInsight()` / `renderSectionHeader()` helpers. Future article data may set `placement: "after-content"` on a Margin Insight when it is intentionally placed after prose instead of inside a section header.

Mobile: collapses into the reading column. The after-content crease remains decorative and should not create a second reading path.

Print: simple rule and text only.

## Process Strip

Purpose: show a short workflow.

Markup: ordered list.

Use when: steps are sequential.

Do not use when: items are independent checks.

Mobile: stack vertically and preserve order.

Print: keep strip intact when possible.

## Decision Tree

Purpose: frame a practical question and simple branches.

Use when: a binary decision reduces uncertainty.

Do not use when: exceptions require a full flowchart.

Accessibility: text labels carry meaning; color and shape support only.

Print: include simplification note if needed.

## Evidence Translation Matrix

Purpose: translate evidence into an actionable request.

Structure: Evidence, Record, Request.

Use when: readers need repeated examples of turning observation into action.

Do not use when: rows are unrelated facts.

Accessibility: header teaches the sequence once; each row remains DOM ordered.

Mobile: row cells stack in order.

Print: keep rows together.

## Comparison Card / Grid

Purpose: contrast weak and strong choices.

Use when: reader needs discrimination.

Do not use when: there is no meaningful contrast.

Accessibility: labels, not color alone.

Print: keep paired sides together.

## Practical Note

Variants: informational, caution, calibration, procedural.

Purpose: clarify a local rule or avoid a common misstep.

Use when: the note changes how the reader should proceed.

Do not use when: ordinary prose works.

Icon rule: semantic only. Use calibration/sliders for overcorrection cautions.

## Body Icon Circles

Purpose: give small circular editorial icons enough lift to remain legible in the restrained paper/document visual language.

Use when: an icon circle appears inside article, guide, educational, experiment, or tool body content as a callout icon, caution/guidance marker, decision disclaimer marker, or circular section/step marker.

Do not use when: the circle is a button, navigation icon, footer utility, home/logo treatment, social icon, form control, chart marker, unrelated SVG, badge-only label, or large illustration container.

Token: use `--ges-shadow-icon-lift` through `.ges-body-icon-circle` or the established component selectors. Do not create local shadow values for individual articles.

Accessibility: the shadow is decorative. Existing labels, alt text, hidden text, or aria labels carry meaning. Interactive icon circles must keep focus styles stronger than the passive lift.

Mobile/print: sizes do not change. Browser print may suppress decorative shadows with the existing print reset.

## Authority / Source Citation

Purpose: support trust without interrupting reading.

Use when: a claim or process needs provenance.

Do not use when: source treatment becomes a loud container.

Link treatment: legal/source-note links get the quiet hanging link marker at the left edge of the text measure. Use `.ges-edge-link` when a main-reading link needs the same treatment outside a source note. Do not apply that marker inside Resource Panel collections; resource cards and resource URL lists keep their existing card/bullet treatments.

Print: preserve citations and visible URLs where useful.

## Resource Panel

Purpose: gather official links, forms, maps, and supporting documents.

Use when: the reader may need to act.

Do not use for loose extra reading.

Print: show complete URLs.

## Resources Block

Purpose: provide a consolidated source appendix for a public article, guide, experiment, tool, generated summary, printable view, or future PDF.

Use when: public content relies on authorities, references, forms, statutes, reports, official pages, research, or internal explainers that readers may reasonably want to inspect after reading.

Placement: after the article body and after any Continuation Module or related-article offering, before the public footer. This preserves the reading journey: finish the article, choose the next reading path, then inspect sources.

Content: keep it sparse and useful. Include meaningful authorities and reader resources already cited or relied upon by the article. Good entries include Nebraska statutes, constitutional provisions, PAD pages, PAD calendars, county forms, county record pages, IAAO standards, research papers, reports, PDFs, internal explainers, and related articles when they are true source material.

Do not include: every possible related link, speculative sources, generic search destinations, marketing links, decorative references, or a duplicate of every inline citation.

Difference from inline citations: inline `article-source-note` citations support a local claim without interrupting reading. The Resources Block consolidates the important authorities and resources at the end for review, printing, and future reuse.

Authoring: configure with `renderResourcesBlock()` from `src/ges/article-components.js`. Resource entries may provide `title`, `source` or `publisher`, `description`, `url` or `urlKey`, `type`, `citationLabel`, `jurisdiction`, `lastReviewedDate`, and `note`. The renderer also understands the older `label` / `urlKey` citation shape while routes migrate.

Accessibility: render as a semantic section with a proper heading. Link text must describe the resource; do not use "click here." The visible type label is editorial metadata, not the accessible name.

Print/PDF: browser print preserves the block and exposes resource URLs. Generated PDFs can call the same renderer for HTML-to-PDF flows; low-level PDF drawing remains a separate wiring task for report generators that do not consume article HTML.

## Continuation Module

Purpose: preserve the next step in the reading journey.

Use when: one next article or action belongs before sources.

Do not bury under citations.

Print: can remain if the next step is useful; otherwise keep source appendix clean.

## Tables

Use real tables for real tabular data.

Variants: standard, compact, citation/source.

Mobile: wrap in `ges-table-scroll` when stacking would damage meaning.

Print: preserve headers; avoid tiny unreadable type.

## Media Block

Purpose: image/video with caption, poster, play button, and aspect-ratio reservation.

Use when: media clarifies the subject.

Do not use generic atmospheric media.

Accessibility: alt text/captions; controls keyboard-operable.

Print: hide interactive video controls; preserve media context if useful.

## Tags / Pills

Purpose: quiet topic or utility labels.

Do not over-color or turn tags into navigation unless they actually navigate.

## Buttons / Links

Use text links for navigation in prose. Use pill buttons for clear commands. Use icon buttons only when the icon is familiar or labelled.

## Forms

Inputs, selects, textareas, checkboxes, radios, toggles, required, error, and success states are styled in the base/component layer.

No information should be conveyed by color alone.

## Theme Toggle

Purpose: page display preference.

Behavior: respects `prefers-color-scheme` until the user chooses light or dark. Stores manual choice in `localStorage`.

Print: hidden; output resolves to light.
