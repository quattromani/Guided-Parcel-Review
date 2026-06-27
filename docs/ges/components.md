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

Mobile: collapses into the reading column.

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
