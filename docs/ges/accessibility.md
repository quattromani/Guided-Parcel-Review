# GES Accessibility

Accessibility is editorial quality.

## Requirements

- WCAG AA contrast for body text and controls.
- Visible focus states.
- Keyboard-operable controls.
- Logical source order.
- Reduced-motion support.
- Useful alt text for images.
- Decorative icons use `aria-hidden="true"`.
- Meaningful icons are paired with visible text or labels.
- No information is conveyed by color alone.

## Headings

Use one `h1` per article. Major sections use `h2`. Component headings inside a section may use `h3`.

Do not skip levels for styling.

## Links And Buttons

Links navigate. Buttons act.

Use meaningful link text. Avoid "click here."

Icon-only buttons need accessible labels and visible focus.

## Diagrams

Diagrams should be built from selectable text whenever possible.

Decision trees, process strips, comparison grids, and evidence matrices must make sense in DOM order.

## Tables

Use real tables for tabular data only. Include headers. Preserve headers and labels on mobile/print.

## Forms

Label every input. Required, error, and success states must use text, not color alone.

## Print And PDFs

Printed articles must preserve:

- title and metadata
- source citations
- useful diagrams
- resource URLs
- dates and locations

Hide controls that become dead text on paper.
