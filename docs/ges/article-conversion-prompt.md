# GES Article Conversion Prompt

Use this prompt to turn an existing source document into a Guided Editorial System article planning package.

This prompt does not ask for HTML, route code, or production markup. It asks for the editorial rebuild plan that should come before implementation.

## When To Use

Use this when a source document is already available and the goal is to rebuild it as a modern GES guide, explainer, case study, or civic learning article.

Do not use it when the task is only to migrate existing article markup into GES components. For that work, use `refactor-guide.md`.

## Required Inputs

- Source document or transcript.
- Intended jurisdiction, county, or statewide scope.
- Intended reader, if different from the default intelligent non-expert public reader.
- Known companion GES articles or tools, if any.
- Any legal/source constraints that are not already clear from the document.

If the source document is missing, ask for it before producing the article plan.

## Reusable Prompt

```text
Guided Editorial System (GES) Article Conversion

Your task is not to convert this document into HTML.

Your task is to rebuild it as a modern Guided Editorial System (GES) article.

Treat the attached source document as the authoritative source material. Preserve its factual accuracy, educational intent, and legal correctness, but completely rethink how the information is presented to the reader.

Overall Philosophy

GES articles are not white papers.

They are guided learning experiences.

The reader should never feel like they are reading a government publication or textbook. Instead, every section should answer the next logical question a curious reader would naturally ask.

Information should unfold progressively.

The article should teach, not lecture.

Whenever possible:

- Replace paragraphs with diagrams.
- Replace explanations with visual workflows.
- Replace repetition with progressive disclosure.
- Reduce cognitive load.
- Let graphics do as much teaching as prose.

Preserve

Preserve:

- All factual accuracy.
- Legal accuracy.
- Jurisdiction-specific terminology.
- Technical correctness.
- Neutral educational tone.
- Existing conclusions, unless clarity can be improved without changing meaning.

Do not simplify by removing important information.

Simplify by improving organization, sequencing, visual explanation, and reader orientation.

Rewrite Philosophy

Do not organize around how government works.

Organize around what question the reader has next.

Each section should answer exactly one major question.

Examples:

- What is an assessment?
- Who decides this?
- Why January 1?
- What does equalization actually mean?
- How do values become taxes?
- What happens if I disagree?

Article Structure

Redesign the source into approximately 15 to 25 guided sections.

Each section should include:

- A conversational heading.
- One guiding question.
- Short prose recommendation.
- Supporting visual.
- Margin insight, when appropriate.
- Source attribution recommendation, when the section makes a legal, procedural, statistical, or technical claim.

Avoid large uninterrupted walls of text.

Hero Section

Create:

- Category tags.
- Article subtitle.
- Reading time estimate.
- Author block recommendation.
- Hero image recommendation.
- Introductory hook.

Begin with a relatable reader scenario whenever appropriate.

Visual Design

Aggressively reduce reading through graphics.

Whenever information can be shown visually, prefer that over paragraphs.

Suggested visual types include:

- Process diagrams.
- Timelines.
- Flowcharts.
- Before/after comparisons.
- Decision trees.
- Callout cards.
- Comparison tables.
- Icon grids.
- Step sequences.
- Relationship diagrams.
- Interactive cards.
- Infographics.

Do not decorate the page for variety alone.

Each visual should replace reading, clarify a relationship, help the reader perform a task, or reduce uncertainty.

For every proposed graphic include:

- Graphic title.
- Purpose.
- Layout recommendation.
- Data required.
- Optional animation or interaction ideas.
- Source or verification dependency, if any.

Margin Insights

Look for opportunities to create concise educational callouts.

Examples:

- January 1 is the valuation date, not the inspection date.
- Equalization compares many properties. A protest reviews one.
- Budgets determine revenue. Levies determine distribution.

Margin insights should reinforce important concepts without interrupting the narrative. Keep them concise, specific, and useful for skimming.

Key Idea Panels

Whenever the article reaches an especially important concept, create a Key Idea block.

Examples:

- Assessment is not the same thing as taxes.
- Property value -> budget -> levy.
- Land + improvements = total assessed value.
- Accuracy compounds.

Cognitive Flow

Every section should naturally lead into the next.

Avoid abrupt topic changes.

The reader should never wonder: Why are we talking about this now?

Transitions should feel inevitable.

Visual Rhythm

Alternate presentation styles.

Example rhythm:

Question
Graphic
Short explanation
Margin insight
Interactive card
Next question

The article should never become visually repetitive.

Cross-Link Opportunities

Identify opportunities to link to other Guided Editorial System articles, tools, or case studies.

Examples:

- Property Protest Guide.
- Levy Compression article.
- Guided Parcel Review.
- Assessment case studies.
- Property record guide.
- Comparable-property guide.
- Board of Equalization guide.

Use Continue Exploring cards where appropriate.

Sources

Where legal, procedural, statistical, or technical claims are made, add tasteful source attribution recommendations.

Prefer high-value primary or authoritative sources:

- Nebraska Constitution, when constitutional assessment or taxation principles are involved.
- Nebraska Revised Statutes, when statutory duties, deadlines, definitions, valuation dates, protests, or appeals are involved.
- Nebraska Title 350 regulations, when assessment administration or Property Assessment Division rules are involved.
- Nebraska Property Assessment Division material, calendars, reports, and guidance.
- IAAO standards, especially for mass appraisal, ratio studies, uniformity, and technical appraisal concepts.
- County Reports and Opinions, when county-level assessment performance or equalization findings are discussed.
- Official county forms, public record pages, or local procedures, when local action steps are included.

Do not over-cite. GES uses sparse, high-value citations.

Each citation should strengthen confidence without overwhelming the reader.

Do not invent citations. If a claim needs verification beyond the source document, mark it as "citation needed" and name the likely authority to verify.

Reader Experience

Assume the audience is:

- Intelligent.
- Curious.
- Not an assessor.
- Easily overwhelmed by government terminology.

The goal is that someone with no prior knowledge could finish the article and genuinely understand the subject.

Required Deliverables

Produce the following planning package:

1. A completely reorganized article outline.
2. Section-by-section rewrite recommendations.
3. Every proposed graphic with description, purpose, layout, data required, and optional interaction ideas.
4. Every proposed margin insight.
5. Suggested Key Idea panels.
6. Source attribution recommendations.
7. Cross-link opportunities into the broader GES ecosystem.
8. Content that should be removed, condensed, expanded, or split into its own future article.

Output Format

Use this structure:

1. Editorial Diagnosis
   - What the source currently does.
   - What the GES article should help the reader understand.
   - The main reorganization principle.

2. Hero Package
   - Working title.
   - Subtitle.
   - Category tags.
   - Reading time.
   - Author block recommendation.
   - Hero image recommendation.
   - Introductory hook.

3. Guided Article Outline
   Provide a table with one row per section:
   - Section number.
   - Conversational heading.
   - Guiding question.
   - Reader need answered.
   - Proposed visual.
   - Margin insight.
   - Source note.

4. Section-By-Section Rewrite Recommendations
   For each section include:
   - Purpose.
   - What to preserve from the source.
   - What to rewrite or resequence.
   - Suggested prose direction.
   - Transition into the next section.

5. Graphics Plan
   For each graphic include:
   - Graphic title.
   - Purpose.
   - Layout recommendation.
   - Data required.
   - Optional animation or interaction.
   - Source or verification dependency.

6. Margin Insights
   List every proposed margin insight and the section where it belongs.

7. Key Idea Panels
   List every Key Idea panel, its section placement, and the concept it should lock in.

8. Source Attribution Map
   Recommend sparse, high-value citations by section. Include "citation needed" where verification is required.

9. Continue Exploring
   Recommend cross-link cards into other GES articles, tools, case studies, glossary entries, or Guided Parcel Review workflows.

10. Content Disposition
   Identify source content that should be:
   - Kept.
   - Condensed.
   - Expanded.
   - Moved into a graphic.
   - Split into a future article.
   - Removed only if redundant or non-essential.

11. Implementation Notes
   Note useful GES components, possible article data fields, visual assets needed, and any legal or editorial review risks before production.

Remember:

Do not merely modernize the document.

Rebuild it as though it were being written today as part of the Guided Editorial System.
```

## Review Checklist

Before accepting a conversion plan, confirm:

- The new article sequence follows reader questions, not agency structure.
- Every section has one clear cognitive task.
- The plan preserves all important source claims.
- Legal and technical claims either have recommended citations or are flagged for verification.
- Graphics replace explanation rather than decorate it.
- Margin insights are concise and non-repetitive.
- Key Idea panels reinforce durable mental models.
- Cross-links create a natural next reading path.
- Content disposition does not remove important information for the sake of brevity.
