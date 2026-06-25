# Guided Editorial Design Language v0.1

Guided Editorial Design Language, or GEDL, is the publishing language for long-form civic education in Guided Parcel Review.

It is not a visual style guide. A visual style guide describes how things look. GEDL describes how information behaves.

The purpose of GEDL is to help readers move from uncertainty toward confident action. Every future article should feel like it belongs to the same publication, whether the subject is property protests, levy compression, equalization, agricultural valuation, exemptions, tax credits, appraisal methodology, or Guided Parcel Review itself. That recognition should come from how the article thinks, not from logos or decoration.

The design language should become invisible. Learning should become recognizable.

## I. Philosophy

### Information Reduces Uncertainty

The publication exists because civic information often arrives too late, too dense, or too procedurally. GEDL treats information as a way to reduce uncertainty, not as a container for facts.

An article should answer, in order:

- What is happening?
- Why does it matter?
- What should I look at?
- What can I do next?
- What evidence or source supports that action?

If a reader finishes a section knowing more facts but still not knowing how to proceed, the section has not done its job.

### Readers Are Intelligent

GEDL assumes readers are capable. They are not deficient; they are unfamiliar. The work is to reduce the distance between what the system knows and what a property owner can recognize.

Avoid condescension. Avoid slogans that pretend the topic is simpler than it is. Use plain language, but do not flatten nuance.

### Teach Recognition Before Expertise

Most readers do not need professional fluency. They need enough recognition to know what they are seeing.

For example, a homeowner does not need to become an appraiser before a protest hearing. They need to recognize that today's assessed value is built from available record facts, and that corrected or better-supported information may give the Board something specific to review.

Recognition comes first. Reasoning comes after.

### Reduce Decisions

Every uncontrolled choice increases anxiety. Articles should reduce the number of decisions the reader has to make at once.

Do not ask the reader to decide between ten possible next steps. Give them one focused task, then the next.

### One Cognitive Task At A Time

Each section should ask the reader to do one kind of thinking:

- notice a problem
- understand a rule of thumb
- compare two things
- verify a record
- organize evidence
- make a request

Mixing too many tasks in one section makes the article feel harder than the subject actually is.

### Readers Should Never Wonder What To Do Next

GEDL articles are not passive explainers. They guide. At every transition, the reader should understand why the next idea follows from the previous one.

This does not mean every section needs an instruction. Sometimes the next step is a mental step: "now compare records, not just values."

### Graphics Replace Explanation

A GEDL visual earns its place only if it does one of these jobs:

- replaces 100 to 200 words of explanation
- clarifies a relationship
- gives the reader a structure to remember
- helps the reader perform a task
- reduces the number of decisions required

Never add a graphic because the page needs decoration. Illustrate actions and relationships, not nouns.

### Narrative Earns Trust

Narrative is not filler. It places the reader in a recognizable situation before introducing structure.

The best GEDL openings often begin with observation: what people do, where they get stuck, what pattern appears. Narrative lets the reader discover the problem before the article names it.

### Structure Reduces Anxiety

The reader should feel the floor under them. Repeated editorial structures make difficult topics feel navigable.

When a process strip, comparison card, evidence matrix, or script card appears, the reader should quickly understand what kind of thinking the component is asking for.

### Accuracy Compounds

Accuracy is both an editorial value and a civic value. Better explanations lead to better reader action. Better reader action leads to better records. Better records support better models. Better models support more uniform outcomes.

GEDL should make accuracy easier to produce.

## II. Information Behavior

GEDL is informed by information behavior, adult learning, and cognitive load.

### Uncertainty Is The Starting State

A reader often arrives with stress, partial knowledge, and a question that is too broad:

- "Why did my value go up?"
- "Can I protest this?"
- "Are my taxes going up?"
- "What am I supposed to bring?"

The article should not begin by answering the most technical version of the question. It should first orient the reader.

Recommended movement:

```text
Uncertainty -> recognition -> comparison -> evidence -> action
```

### Recognition Versus Recall

Readers should not have to memorize a framework before using it. GEDL favors visual structures that stay visible and reusable.

Examples:

- A process strip lets the reader recognize where they are in a workflow.
- A comparison card lets the reader recognize stronger and weaker forms of a request.
- An evidence matrix lets the reader recognize the relationship between observation, record issue, and requested correction.

Recognition reduces recall burden.

### Chunking

Long civic topics should be divided into chunks that map to cognitive tasks, not arbitrary word counts.

A chunk may be:

- a narrative passage
- a concept diagram
- a checklist
- a record callout
- an evidence matrix
- a script card

Each chunk should have one job.

### Progressive Disclosure

GEDL articles should not hide essential information behind interaction. Progressive disclosure in articles means sequencing, not collapsing.

Introduce the mental model first. Then introduce examples. Then introduce exceptions.

Do not introduce edge cases before the reader has the base pattern.

### Mental Models

The strongest GEDL components create mental models that transfer to other topics.

Examples:

- "Today's value is built from the information currently available."
- "Find -> Compare -> Document -> Request."
- "Evidence -> Record issue -> Requested correction."

These are not taglines. They are working models.

### Pattern Recognition

Readers should begin to recognize component grammar across articles:

- process strip means workflow
- comparison card means contrast
- concept diagram means mental model
- evidence matrix means observation connected to action
- script card means spoken preparation
- resource card means official external reference

Consistency of thought matters more than consistency of decoration.

### Retrieval Practice

Key ideas should recur in different forms:

- narrative statement
- visual model
- practical example
- checklist or script

This helps the reader retrieve the idea later, including in a hearing, phone call, or meeting.

## III. Editorial Rhythm

GEDL articles should alternate modes of attention.

The ideal rhythm is:

```text
Narrative
Concept
Reference
Application
Reflection
```

### Narrative

Narrative places the reader in a situation. It builds trust and creates context.

Use narrative when the reader needs to understand why the topic matters before learning what to do.

### Concept

Concepts give shape to the problem. They name the mental model.

Examples:

- "The record helps explain how today's value was assembled."
- "The Board needs something it can verify."

### Reference

Reference components give the reader stable facts or structures. They should be easy to scan and useful in print.

Examples:

- scorecards
- record callouts
- resource lists
- evidence matrices

### Application

Application turns the concept into action. It shows what the reader would actually say, compare, photograph, measure, or request.

### Reflection

Reflection explains why the action matters beyond the immediate task. It reconnects the individual task to the civic system.

### Visual Relief

A reader should rarely go more than one screen without encountering a useful visual structure. Visual relief is not decoration; it is pacing.

Good visual relief:

- changes the mode of attention
- makes a relationship visible
- supports scanning
- remains useful when printed

Bad visual relief:

- repeats the surrounding paragraph
- adds icons without meaning
- creates a poster-like tone
- makes the page feel like a slide deck

## IV. Editorial Components

Future articles should be assembled from reusable editorial components rather than invented layouts.

Each component below includes purpose, usage, cognitive role, semantic structure, accessibility, print notes, and an example.

### Article Hero

Purpose: Establish the article title, offer, author context, publication context, cover media, and available reading/listening formats.

Use when: Every standalone article.

Do not use when: The article is embedded inside an interactive task surface.

Typical size: One title block, short deck, and cover media. Article metadata and format options move into the opening section's article-entry panel.

Cognitive role: Orientation.

HTML structure:

```html
<header class="article-hero">
  <div class="article-hero-packet">
    <div class="hero-kicker-row">
      <p class="hero-kicker section-kicker"><span>Guide</span> / Property Protest Prep</p>
    </div>
    <h1 class="hero-title">Before You Walk Into a Property Protest</h1>
    <p class="hero-deck">Short plain-language deck.</p>
  </div>
  <figure class="hero-media">
    <video class="article-hero-video-player" poster="/assets/images/articles/example-16x9.jpg" preload="metadata" playsinline></video>
    <button class="article-hero-video-play" type="button" aria-label="Play the video summary"></button>
    <figcaption class="sr-only">Reader reviewing a printed property record. The video provides a short overview of the article.</figcaption>
  </figure>
</header>
```

Accessibility: One `h1` per article.

Print: Keep with the opening section when possible. The printable PDF should include the same author and location/date stamp. Hide the web print/download CTA inside the printed PDF because it has already served its purpose.

Article entry rule: Publication metadata and format choices belong inside the opening article section, above the first section kicker. The reader should first understand what the guide is, then see the cover media, then enter the article through a compact attribution and format panel. Stack the metadata in reader-order: author, publication date, topical/location tags, reading time, then format choices. Finish the panel with a gentle divider so the first kicker feels like the beginning of the reading experience. Keep utility controls compact and sibling-like: paper/PDF, audio, and similar format options should use matched buttons with clear icons and accessible labels. Audio uses native controls with `preload="none"` unless there is a specific reason to preload metadata.

Tag rule: Tags in the entry panel should be small, muted pills rather than category headlines or filter UI. Use them to name the local or topical context, such as `Gage County`, and allow future articles to add comma-separated conceptual tags without disturbing the author/date/reading-time rhythm.

Reading-time rule: A concise reading-time line belongs inside the article-entry panel, under author/date/tag metadata and above format choices. This keeps the reader's basic decisions together: who prepared it, when/local context, how long it takes, and whether to read, print, or listen. It is a static publication value, not a client-side calculation. Update it during the publication/PDF regeneration pass so the article remains fast, stable, and print-consistent. Mark it up with a `<time>` element and include `wordCount` and `timeRequired` in structured data when available.

Article source artifact rule: Every mature GES article should have a portable source artifact that owns its editorial content and publication metadata. The route or renderer should own component behavior, semantic markup, analytics hooks, and layout assembly; the source artifact should own the title, subtitle, author, date, location, reading-time values, media references, resource links, section kickers, headings, paragraphs, example rows, script lines, and component data. This keeps long-form writing from becoming trapped inside route code and makes future refactors, PDF regeneration, metadata review, and article reuse much easier.

Structured source is preferred for GES articles because the articles are component-driven. Markdown is appropriate for purely narrative essays, but guides with process strips, comparison cards, decision trees, evidence matrices, record callouts, resource cards, audio, video, and print metadata should use a data-plus-prose artifact that can feed reusable components. The renderer may still output ordinary semantic HTML; the source artifact is the editorial manuscript and component brief.

Article entry HTML:

```html
<section class="article-section narrative-opening">
  <div class="editorial-narrow">
    <div class="article-entry-panel">
      <div class="article-entry-meta">
        <p>Prepared by Max Quattromani</p>
        <p>June 25, 2026</p>
        <ul class="article-entry-tags" aria-label="Article tags">
          <li>Gage County</li>
        </ul>
        <p class="article-reading-time" aria-label="Estimated reading time">
          <span>Reading time:</span>
          <time datetime="PT10M">10 min</time>
          <span>(2,070 words)</span>
        </p>
      </div>
      <div class="hero-utility" aria-label="Article format options">
        <a class="hero-utility-button article-print-cta" href="/assets/guides/example.pdf" download>Prefer paper? Download the printable guide.</a>
        <details class="hero-audio">
          <summary class="hero-utility-button article-audio-cta">Prefer audio? Listen to the article.</summary>
          <div class="hero-audio-panel">
            <audio controls preload="none" src="/assets/audio/articles/example.mp3"></audio>
            <a href="/assets/audio/articles/example.mp3" download>Download MP3</a>
          </div>
        </details>
      </div>
    </div>
    <p class="section-kicker">In the Hearing Room</p>
    <h2>The pattern shows up quickly</h2>
  </div>
</section>
```

Metadata rule: Authorship, location, and date should read as metadata, not body copy. Keep these lines visually quiet, roughly 12 to 13 px on screen, with modest line height. Use a location/date stamp when the article is tied to a county, hearing cycle, meeting schedule, or local procedural context. Dates may be updated before publication, but the document should always make its local moment clear.

Hero kicker rule: The hero kicker should be text-first and quiet. Avoid decorative icons in the kicker row. When the article type needs a small visual anchor, underline only the article-type word, such as `Guide`, with a partial underline of the same color and weight family. This creates recognition without adding a decorative object.

Field-packet rule: For civic process articles, the hero may use a restrained packet or record-jacket treatment: a small document-aware kicker, compact metadata, and a paper/download pathway. Do not default to a left vertical rule. Use whitespace, metadata grouping, and the hero media edge to create the field-packet rhythm. The treatment should make the article feel prepared and document-aware without becoming a legal template, campaign flyer, or dashboard UI.

Hero media rule: When an article has a short orientation video, the hero media region may become a video player instead of a static image. The player should use the article image as a poster, reserve the correct aspect ratio, show a calm play affordance, and avoid autoplay/modal behavior unless a future article has a specific editorial reason. Use a dedicated 16:9 poster crop when the video frame is 16:9 so the resting state fills the frame cleanly.

Image credit rule: If a hero image uses third-party media and the credit is not shown as a visible caption, preserve the credit in machine-readable and inspectable places: image `title`, `data-image-credit`, source metadata, and JSON-LD `ImageObject` credit fields. Hidden crediting should not replace legally required visible attribution when a license requires it.

Print/PDF rule: A paper preference should lead to a real downloadable PDF whenever practical, not merely trigger a browser print dialog. The CTA should be short and plain, such as "Prefer paper? Download the printable guide."

### Narrative Opening

Purpose: Earn trust through observation before explanation.

Use when: The reader needs context, empathy, or a real-world pattern.

Do not use when: The article is a short reference page.

Typical size: 2 to 4 paragraphs plus the first concept visual.

Cognitive role: Situation recognition.

HTML structure:

```html
<section class="article-section narrative-opening" aria-labelledby="opening-title">
  <header>
    <p class="section-kicker">In the Hearing Room</p>
    <h2 id="opening-title">The pattern shows up quickly</h2>
  </header>
  <p>...</p>
  <figure class="concept-diagram">...</figure>
</section>
```

Accessibility: Opening visuals need text, not image-only explanations.

Print: Avoid a page break between the opening setup and the first visual.

### Section Kicker

Purpose: Orient the reader within the learning journey before the heading explains the lesson.

Use when: Major article sections.

Do not use when: It merely labels the subject matter, duplicates the visible heading, or functions as decoration.

Typical size: Short uppercase label.

Cognitive role: Wayfinding. The kicker answers, "Where am I in the journey?" The H2 answers, "What am I learning here?"

HTML structure:

```html
<p class="section-kicker">Verifying the Record</p>
<h2>How does the record shape today's value?</h2>
```

Editorial rule: Prefer descriptive positioning over topic labels. Use the reader's current task, stage of reasoning, phase of preparation, or transition in thinking. For example, use "Finding Good Comparables" instead of "Comparable Properties," "Speaking to the Board" instead of "At the Hearing," and "Gathering Your Materials" instead of "Resources."

Accessibility: Kicker should not replace the heading unless no heading is needed and the section remains labelled.

Print: Must remain legible in grayscale.

### Concept Diagram

Purpose: Teach a mental model quickly.

Use when: A relationship is more important than a detail.

Do not use when: The content is a list of facts with no relationship.

Typical size: 2 to 4 parts.

Cognitive role: Recognition.

HTML structure:

```html
<figure class="concept-diagram" aria-labelledby="concept-title">
  <figcaption id="concept-title">The disconnect</figcaption>
  <div>
    <article>
      <span>Homeowner thinks</span>
      <p>My value is too high.</p>
    </article>
  </div>
</figure>
```

Accessibility: Text must be selectable. Do not encode concepts only as arrows or color.

Print: Use borders, spacing, and labels so meaning survives grayscale printing.

### Process Strip

Purpose: Introduce a workflow.

Use when: The reader needs a compact map of the whole process.

Do not use when: The steps are not sequential.

Typical size: 3 to 5 steps.

Cognitive role: Orientation and memory.

HTML structure:

```html
<ol class="process-strip">
  <li>
    <div class="process-step-heading"><span>Find</span></div>
    <p>2-3 good comparable properties</p>
  </li>
</ol>
```

Accessibility: Use an ordered list when order matters.

Print: Avoid breaking inside the strip. Stack if space is narrow.

### Comparison Card

Purpose: Contrast weak and strong forms of thinking or action.

Use when: The reader needs to distinguish similar but unequal choices.

Do not use when: There is no meaningful contrast.

Typical size: Two columns.

Cognitive role: Discrimination.

HTML structure:

```html
<figure class="comparison-card">
  <figcaption>Sincerity is not the same thing as usable evidence</figcaption>
  <div>
    <section>
      <h3>Hard to act on</h3>
      <ul>...</ul>
    </section>
    <section>
      <h3>Easier to evaluate</h3>
      <ul>...</ul>
    </section>
  </div>
</figure>
```

Accessibility: Do not rely on red/green alone. Use text labels.

Print: Keep both columns together when possible.

### Decision Box

Purpose: Show what kind of evidence moves a decision.

Use when: A governing body, user, or system is deciding between outcomes.

Do not use when: The decision has many procedural exceptions that would make the box misleading.

Typical size: One question plus 2 outcomes. A single nested branch may be added when it clarifies a necessary second test, but avoid turning article diagrams into full procedural flowcharts.

Cognitive role: Decision framing.

HTML structure:

```html
<figure class="decision-panel">
  <figcaption class="decision-panel-label">The Board's practical question</figcaption>
  <p class="decision-question">Is there support for the requested correction?</p>
  <div class="decision-outcomes">...</div>
</figure>
```

Accessibility: Include text for all outcomes.

Print: Include a short note if the box is an educational simplification.

Theme rule: A decision panel may carry a thematic title treatment when the decision frame benefits from it. The theme should come from component-level variables, such as `--decision-theme-bg`, `--decision-theme-ink`, `--decision-theme-highlight`, and `--decision-theme-shadow`, rather than one-off colors. For quasi-judicial decision trees, use a concrete-gray banner with enlarged serif all-caps text and subtle inset letter shadows so the label reads like civic stonework without using gavels, courthouse icons, or legal cliches. Other domains may use other themes only when they reinforce the decision context.

Outcome palette rule: Decision nodes may use a small semantic palette when the color helps scanning: supported/yes, caution/no, and reserved stop/red. The colors should be component-level variables, not borrowed directly from unrelated article tone colors. Keep the saturation restrained enough for civic material, but strong enough that the decision path reads immediately. Never rely on color alone; each node must remain text-labeled.

Nested branch rule: Use a second-level branch only when it protects the reader from an important misunderstanding. In a protest guide, the second-level test may show that evidence for a correction is not enough by itself; the requested correction should also preserve uniform and proportionate treatment. Keep nested labels short, and do not add more than one nested level without moving the topic into a separate article or tool.

### Reference Module

Purpose: Provide stable facts the reader may revisit.

Use when: The reader needs a compact reference list, scorecard, or criteria set.

Do not use when: The content is narrative.

Typical size: One card or two-column module.

Cognitive role: External memory.

HTML structure:

```html
<figure class="reference-module scorecard">
  <figcaption>Comparable property scorecard</figcaption>
  ...
</figure>
```

Accessibility: Prefer lists or definition lists over visual-only layouts.

Print: Avoid page breaks inside criteria groups.

### Evidence Matrix

Purpose: Connect observation to record issue to requested action.

Use when: The reader needs to understand how evidence becomes a request.

Do not use when: The relationship is not action-oriented.

Typical size: 4 to 8 rows.

Cognitive role: Transfer from facts to action.

HTML structure:

```html
<figure class="evidence-matrix">
  <figcaption>Evidence -> Record issue -> Requested correction</figcaption>
  <ol class="evidence-path-list">
    <li>
      <section>
        <h3>What you noticed</h3>
        <p>Photos show sealed fireplace</p>
      </section>
      <section>
        <h3>What the record says</h3>
        <p>record lists functional fireplace</p>
      </section>
      <section>
        <h3>What to ask for</h3>
        <p>request fireplace correction</p>
      </section>
    </li>
  </ol>
</figure>
```

Accessibility: Preserve the sequence in DOM order. Use text headings for each step.

Print: Keep each row together when possible.

### Record Callout

Purpose: Show where evidence begins in a record.

Use when: The reader needs to inspect fields, facts, or source rows.

Do not use when: Real data is required but unavailable.

Typical size: Mock or real record card with labelled fields.

Cognitive role: Attention targeting.

HTML structure:

```html
<figure class="record-callout">
  <figcaption>A simplified record card</figcaption>
  <dl>
    <div>
      <dt>Living area</dt>
      <dd>Compare this</dd>
    </div>
  </dl>
</figure>
```

Accessibility: Use `dl` when pairing fields with actions or meanings.

Print: Avoid faint highlight-only treatments.

### Example Card

Purpose: Show a realistic user discovery.

Use when: A concept needs a concrete, human example.

Do not use when: The example is generic or decorative.

Typical size: One short scenario.

Cognitive role: Transfer.

HTML structure:

```html
<aside class="example-card">
  <p>"My record lists the basement as finished. Only half of it is."</p>
</aside>
```

Accessibility: Use text. Avoid image-only examples.

Print: Keep with the concept it explains.

### Checklist

Purpose: Help the reader evaluate completeness.

Use when: Items can be checked independently.

Do not use when: The items are sequential steps. Use a process strip instead.

Typical size: 4 to 10 items.

Cognitive role: Verification.

HTML structure:

```html
<ul class="checklist">
  <li>Location</li>
  <li>Style</li>
</ul>
```

Accessibility: Use a real list.

Print: Avoid checkbox styles that disappear in grayscale.

### Script Card

Purpose: Prepare a reader for conversation.

Use when: The reader must speak, file, ask, or explain.

Do not use when: The script would imply guaranteed results or legal advice.

Typical size: 3 to 5 fill-in lines.

Cognitive role: Rehearsal.

HTML structure:

```html
<figure class="script-card">
  <figcaption>What to say at the hearing</figcaption>
  <blockquote>
    <p>The property record shows ______.</p>
  </blockquote>
</figure>
```

Accessibility: Text must be selectable.

Print: Should look useful as a physical reference.

### Resource Card

Purpose: Connect the reader to official tools or source material.

Use when: The resource is necessary or strongly useful.

Do not use when: The link is merely "learn more."

Typical size: Button label, short description, visible URL elsewhere nearby.

Cognitive role: Action support.

HTML structure:

```html
<article class="resource-card">
  <a href="...">Official form</a>
  <p>Short description.</p>
</article>
<div class="print-url">
  <span>Official form</span>
  <code>https://...</code>
</div>
```

Accessibility: Link text must be meaningful.

Print: Full URL must be visible.

### Schedule Card

Purpose: Present relevant meeting dates, times, and locations without making the reader hunt for procedural next steps.

Use when: A dated public meeting, hearing, filing window, or deadline materially affects the reader's next action.

Do not use when: Dates are speculative, stale, or merely interesting background.

Typical size: One short heading, location line, and 1 to 4 dated rows.

Cognitive role: Time orientation.

HTML structure:

```html
<aside class="meeting-schedule-card" aria-labelledby="schedule-title">
  <h3 id="schedule-title">The next scheduled property protest hearings are:</h3>
  <p>Gage County Courthouse, Board of Supervisors Room, 612 Grant Street...</p>
  <ul>
    <li>
      <a href="/assets/calendar/example.ics" download>
        <span>Monday, July 6, 2026</span>
        <strong>1:00 p.m.</strong>
        <em>Add to calendar</em>
      </a>
    </li>
  </ul>
</aside>
```

Accessibility: Calendar links must contain the date and time in visible text. Calendar files should include a useful title, location, and description.

Print: Hide "Add to calendar" or other click-only action labels. Keep the date, time, meeting room, and full location visible. Printed schedules should read as information, not inactive controls.

### Key Principle

Purpose: Preserve the sentence the reader should remember.

Use when: The article has an idea that frames the whole topic.

Do not use when: The sentence is decorative or motivational.

Typical size: One sentence or two linked sentences.

Cognitive role: Memory anchor.

HTML structure:

```html
<aside class="key-principle">
  <p>Accuracy compounds.</p>
</aside>
```

Accessibility: Do not hide the text in CSS images.

Print: Keep with surrounding explanation unless it is the final line.

### Closing Reflection

Purpose: Return the reader from action to civic meaning.

Use when: The article should connect individual action to system accuracy.

Do not use when: The page is purely procedural.

Typical size: 2 to 4 paragraphs.

Cognitive role: Meaning and completion.

HTML structure:

```html
<section class="article-section closing-reflection">
  <h2>A protest can improve the record</h2>
  <p>...</p>
</section>
```

Accessibility: End with real text, not a visual-only flourish.

Print: Do not add anything after the final intended line.

## V. Editorial Grammar

These rules govern every component and article.

1. Every visual teaches.
2. Every component answers one question.
3. Every paragraph earns its place.
4. Every graphic replaces explanation.
5. Never decorate.
6. Illustrate verbs rather than nouns.
7. Reduce uncertainty before introducing complexity.
8. Move from recognition toward reasoning.
9. One visual should replace approximately 100 to 200 words when possible.
10. Avoid graphics that merely repeat nearby text.
11. Keep official procedure distinct from educational simplification.
12. Prefer durable patterns over clever one-offs.
13. Use section kickers for reader position, not topic labels.
14. Treat publication metadata as context, not decoration.
15. Preserve printable usefulness even when screen affordances disappear.
16. If a click-only control does not make sense on paper, hide it in print and preserve the underlying information.
17. Keep hero kickers text-first. Use a partial underline for article-type emphasis before reaching for icons.
18. Let themed components carry meaning through restrained tokens, not decoration.
19. Use video as a calm orientation layer only when it reduces uncertainty before the reader enters the article.

## VI. HTML5 Architecture

GEDL uses semantic HTML so articles can survive years of development.

### Canonical Document Structure

```html
<article class="editorial-guide">
  <header class="article-hero">...</header>
  <section class="article-section narrative-opening">...</section>
  <section class="article-section">...</section>
  <section class="article-section resource-section">...</section>
  <section class="article-section closing-reflection">...</section>
</article>
```

### Elements

Use `article` for the complete standalone piece.

Use `header` for hero and section introductions.

Use `section` for major article units with headings.

Use `aside` for related but secondary notes, key principles, and editor notes.

Use `figure` for self-contained explanatory visuals, diagrams, matrices, and callouts.

Use `figcaption` to name the purpose of a figure.

Use `blockquote` for scripts, quoted statements, or model language.

Use `table` only for actual tabular data. Do not use tables simply to create columns.

Use `dl` for paired terms and definitions or fields and meanings.

Use `nav` only when it is truly navigational.

Use `footer` for article metadata, source notes, or publication notes when needed.

Use compact metadata blocks for author, location, and date when the article is local, time-sensitive, or tied to a public process. Metadata may live in the hero when it helps orient the reader before the first section. Keep it semantically simple and visually quiet.

### Heading Hierarchy

Every article gets one `h1`.

Major article sections use `h2`.

Component titles inside a section may use `h3` only when genuinely subordinate.

Do not skip heading levels for styling.

### Naming Conventions

Prefer reusable component names:

- `article-hero`
- `hero-media`
- `article-hero-video`
- `article-entry-panel`
- `article-entry-meta`
- `article-reading-time`
- `hero-utility`
- `hero-audio`
- `hero-audio-panel`
- `article-section`
- `section-kicker`
- `concept-diagram`
- `decision-panel`
- `process-strip`
- `comparison-card`
- `reference-module`
- `evidence-matrix`
- `record-callout`
- `script-card`
- `resource-card`
- `key-principle`
- `editor-note`
- `print-url`
- `article-meta`
- `article-print-cta`
- `article-audio-cta`
- `meeting-schedule-card`

Avoid names that only make sense in one article unless the component truly cannot be reused.

### Article Source Artifacts

Use `src/content/articles/` or an equivalent content directory for article source artifacts. A GES source artifact should be readable as the article's editorial brief: it should expose publication metadata, assets, resource links, structured component data, and section copy without requiring someone to inspect the route renderer.

Recommended source responsibilities:

- article identity: `id`, canonical slug/path, title, subtitle, author, date, location
- publishing metadata: description, keywords, publication date, revision date, reading time, word count
- media: hero image, video, audio, credits, captions, transcript
- resources: labels, URLs, descriptions, icons, analytics actions
- component data: process steps, comparison lists, decision-tree labels, matrix rows, schedule dates
- section copy: kickers, headings, paragraphs, pull quotes, notes, CTAs, related links

Renderer responsibilities stay separate:

- semantic HTML
- class names and reusable component composition
- accessibility attributes
- analytics instrumentation
- print behavior
- client-side behavior such as video, audio, sharing, or calendar downloads

This separation is now part of GES cleanup work. When refactoring an older article such as the Property Protest Paradox piece, first create or update its source artifact, then migrate the visual treatment. That prevents legacy prose from staying embedded in a one-off route after the page looks modern.

## VII. CSS Philosophy

GEDL CSS should support a scalable editorial system.

### Design Tokens

Use tokens for:

- color roles
- border colors
- spacing scale
- type scale
- surface radius
- shadows
- max-widths

Do not hard-code arbitrary values when a reusable scale can express the decision.

### Spacing Scale

Spacing should communicate structure.

Small spacing groups related items. Larger spacing separates cognitive tasks.

Avoid using whitespace only for beauty. Whitespace is a comprehension tool.

### Typography Scale

Use type scale to express hierarchy, not excitement.

Headings should orient. Body text should sustain reading. Labels should support scanning.

### Maximum Text Width

Long prose should remain narrow enough to read comfortably. Visual components may be wider when width improves comprehension.

Default pattern:

- prose: narrow
- figure/card/process: wider when useful
- resource URLs: full available width

### Responsive Philosophy

Design mobile-first, but do not force every component into the same stack.

On mobile:

- stack cards
- preserve sequence
- avoid horizontal scrolling
- keep URLs visible
- keep labels attached to values

On desktop:

- use two-column layouts only when comparison or scanning improves
- avoid overly wide prose
- keep visual density calm

### Print Philosophy

Print is a first-class medium. Do not rely on hover, animation, or hidden links.

Every article should remain usable as a PDF or printed handout.

Default to portrait Letter output for civic guides unless the whole artifact is intentionally a worksheet, map, or table that requires landscape. Landscape can solve wide components, but it often makes a guide feel like a slide deck and prints awkwardly beside ordinary paperwork. Prefer portrait with print-specific component overrides that preserve the most important relationships.

When possible, provide a static downloadable PDF generated from the article's print stylesheet. The online article may include a short CTA to that PDF. The PDF should be regenerated whenever content, metadata, resource links, calendar dates, or print CSS changes.

The printed/PDF version may differ from the screen version in affordances, not substance. Hide interactive-only controls such as "Add to calendar" labels or "Download" calls to action when they become dead text on paper. Preserve the information underneath: dates, times, locations, visible URLs, source notes, and instructions.

### Iconography and Color

GEDL uses icons and color as editorial orientation, not decoration.

Selected icon source: Lucide Icons, MIT licensed. The first controlled vocabulary is stored locally in `/assets/icons/editorial/` as optimized SVG files, with `/assets/icons/editorial/sprite.svg` used for consistent rendering in article components. Preserve source attribution in project documentation when the vocabulary expands.

Icon vocabulary:

- `observe.svg` — observe or inspect
- `compare.svg` — compare, contrast, or test similarity
- `document.svg` — document, form, or written material
- `request.svg` — requested correction or formal ask
- `property-record.svg` — property record card or record fact
- `evidence.svg` — evidence, proof, or supporting documentation
- `measurement.svg` — measured physical fact
- `comparable-property.svg` — comparable home or property
- `parcel-map.svg` — parcel map, GIS, or location lookup
- `hearing-board.svg` — hearing, board, or formal meeting
- `resources.svg` — resource folder or gathered materials
- `timeline.svg` — date, schedule, or sequence over time
- `process.svg` — multi-step process
- `market-chart.svg` — sales, market movement, or charted comparison
- `equalization.svg` — equalization, balance, or uniform treatment
- `verification.svg` — verification, accuracy, or record check
- `perspective.svg` — reflection, broader view, or stepping back

Standard icon sizes:

```css
:root {
  --icon-xs: 16px;
  --icon-sm: 20px;
  --icon-md: 28px;
  --icon-lg: 40px;
  --icon-xl: 56px;
}
```

Default article icons should usually be `--icon-sm` or `--icon-md`. Use `--icon-lg` sparingly for signature process components. Avoid `--icon-xl` unless an article has a deliberate chapter emblem.

Usage rules:

- Icons are chapter markers, not decoration.
- Icons orient the reader in the journey.
- Icons should reinforce section identity, process steps, resource/action cards, or reusable article components.
- Do not place icons on every paragraph.
- Do not use icons as bullets unless the icon improves comprehension.
- Do not use icons to make the page friendlier.
- If removing an icon leaves the article equally understandable, remove the icon.

Correct use:

```html
<ol class="process-strip">
  <li>
    <div class="process-step-heading">
      <svg class="editorial-icon" aria-hidden="true"><use href="/assets/icons/editorial/sprite.svg#icon-compare"></use></svg>
      <span>Compare</span>
    </div>
    <p>the property records</p>
  </li>
</ol>
```

Incorrect use:

```html
<p><svg class="editorial-icon">...</svg> This paragraph feels more approachable with an icon.</p>
```

Color roles:

```css
:root {
  --color-information: ...;
  --color-evidence: ...;
  --color-comparison: ...;
  --color-action: ...;
  --color-reflection: ...;

  --color-information-soft: ...;
  --color-evidence-soft: ...;
  --color-comparison-soft: ...;
  --color-action-soft: ...;
  --color-reflection-soft: ...;
}
```

Meaning:

- Information: neutral framing, decisions, process orientation
- Evidence: records, proof, documentation, verification
- Comparison: comparable properties, side-by-side evaluation, difference finding
- Action: resources, requests, scripts, forms, next steps
- Reflection: narrative observation, transitions, closing perspective

Color should appear as small accents, soft fills, borders, icon color, or restrained labels. It should not make the article feel like a dashboard. Avoid bright signal colors that imply danger, success, failure, alarm, or partisanship.

Accessibility and print:

- Do not rely on color alone. Pair color with labels, headings, structure, or icons.
- Decorative icons should be `aria-hidden="true"`.
- Meaningful icons must be paired with visible text or an accessible label.
- SVG text should not carry essential meaning; keep important text selectable in HTML.
- Icons must remain legible in grayscale.
- Resource URLs must remain visible independent of icon or color treatment.
- Avoid hover-only icon meaning.

### County Website Compatibility Layer

GES may be published beside, within, or in support of an official county website. In those cases the article should still feel like a Guided Editorial System guide, but it should not visually fight the host civic environment.

The Gage County compatibility layer was derived from the public county website at:

- `https://gagecountyne.gov/`
- `https://gagecountyne.gov/county-assessor/`
- `https://gagecountyne.gov/county-assessor/property-valuation-protests/`
- `https://gagecountyne.gov/county-assessor/disclaimer-and-terms-of-service-assessors-online/`

Extracted county patterns:

- Palette: muted teal `#567577`, light civic blue `#6dabc4`, warm concrete `#dcd3ce`, soft white-gray `#f6f6f6`, cool gray `#adb6be`, black text `#111111`, and white `#ffffff`.
- Typography: Astra/WordPress system UI stack for body and UI; occasional `Acme` display treatment for outline buttons; `Poppins` in event/list modules; `Dancing Script` for the site title only.
- Buttons: rounded 30px pill buttons for primary actions, plus a secondary outline/accent-button pattern with a strong left edge and compact 10px/20px padding.
- Cards/modules: restrained white or near-white surfaces, light borders, modest radius, soft shadows, and simple civic hierarchy.
- Spacing: WordPress block rhythm around 24px, with preset steps near `.44rem`, `.67rem`, `1rem`, `1.5rem`, `2.25rem`, and `3.38rem`.
- Navigation and quick links: practical labels, dropdown arrows, compact action cards, and strong "find the thing" orientation.

Adopted GES tokens:

```css
:root {
  --county-color-primary: 86 117 119;
  --county-color-secondary: 109 171 196;
  --county-color-accent: 220 211 206;
  --county-color-background: 246 246 246;
  --county-color-surface: 255 255 255;
  --county-color-border: 173 182 190;
  --county-color-link: var(--county-color-primary);
  --county-color-button: var(--county-color-secondary);
  --county-color-button-text: 17 17 17;

  --ges-color-information: var(--county-color-primary);
  --ges-color-evidence: ...;
  --ges-color-comparison: ...;
  --ges-color-action: ...;
  --ges-color-reflection: ...;
}
```

Implementation rule:

- County compatibility is an opt-in layer, not a replacement for GES. Use `data-county-theme="gage"` on an editorial article when the article is county-facing or meant to live beside county resources.
- County tokens should influence surfaces, borders, links, buttons, utility actions, section accents, and civic document cues.
- GES semantic roles still control information behavior: information, evidence, comparison, action, and reflection remain teaching roles, not color names.

Typography compromise:

The county site's system UI stack works well for navigation and forms. GES keeps its long-form editorial pairing of readable serif body text and clear sans-serif headings because the articles are longer than most county web pages. County compatibility should harmonize through metadata, buttons, surfaces, and spacing before changing the reading face.

Rejected patterns:

- Do not import the county site's full WordPress/Astra layout into GES.
- Do not use the county logo or exact branding unless the article is officially adopted into the county site.
- Do not use `Acme` for long-form body text. It may inspire short display treatments only when a component benefits from a civic/document feel.
- Do not rely on the accessibility-widget blue as a brand color; it is a widget control color, not the county visual system.
- Do not copy campaign-like hero imagery, dark gradients, or decorative civic cliches.

Accessibility and print:

- County-compatible colors must pass contrast in their actual component pairings.
- Light civic blue should usually carry dark text, not white text.
- Visible URLs remain mandatory for resource cards and printed handouts.
- Cards, figures, tables, schedule blocks, and resource modules should keep `break-inside: avoid`.
- Color cannot be the only signifier; labels, headings, borders, and structure must carry meaning in grayscale.

Future guidance:

Use the compatibility layer when a guide is about local county procedure, county records, county meetings, county resources, or a county-specific filing deadline. Do not use it for every GES article automatically. The layer should help the reader feel, "this belongs near the county record system," while still recognizing the publication's educational voice.

## VIII. Accessibility

Accessibility is editorial quality.

### Semantic Structure

Use semantic HTML first. It helps assistive technology and makes the document easier to maintain.

### Keyboard Navigation

Links and buttons must be focusable, meaningful, and visible.

### Visible URLs

Any resource needed for action must include a visible URL near the link.

### Grayscale Printing

Do not communicate meaning with color alone. Use labels, borders, headings, and structure.

### Alt Text And Diagrams

If a graphic is an image, provide useful alt text. Prefer HTML/CSS diagrams where the text remains selectable.

### Readable Typography

Do not shrink explanatory text below comfortable reading size. Use dense text only for secondary labels or URL references.

### Accessible Tables

Use tables for real tabular data only. Include headers. On mobile, preserve labels when stacking.

### Accessible Diagrams

Diagrams must be understandable from their text content and DOM order. Do not trap meaning in background images.

## IX. Print System

Assume every article may be printed.

### Page Breaks

Use:

```css
break-inside: avoid;
page-break-inside: avoid;
```

for cards, evidence rows, script cards, resource modules, and compact figures.

### Component Integrity

Avoid separating a figure caption from its figure. Avoid splitting a script card across pages.

### Visible Resource URLs

Resource links must show the complete URL. The printed article should not depend on clickable links.

### Print Typography

Maintain readable type size. Reduce shadows and preserve border contrast.

### Tables And Matrices

Keep row groups together when possible. If a table becomes unreadable in print, use evidence-path cards instead.

### PDF Friendliness

Avoid layouts that depend on browser-only affordances. The PDF should preserve sequence, labels, and source URLs.

Generated PDFs should be visually verified as rendered pages before publication. At minimum, inspect the cover/opening page, the densest explanatory visual, the resources page, any schedule or deadline page, and the closing page. Page count is not a quality target by itself, but a print guide should feel intentional rather than like a web page spilled onto paper.

## X. Refactoring Framework

GEDL should make legacy article refactors repeatable.

### Audit Checklist

For each legacy article, evaluate:

- Narrative: Does the article begin with a recognizable situation or problem?
- Structure: Does each section answer one question?
- Visual rhythm: Does the reader encounter useful visual relief early and regularly?
- Cognitive load: Are too many ideas introduced at once?
- Redundant prose: Does text explain what a visual could show faster?
- Missing mental models: Does the reader have a durable way to think about the topic?
- Missing graphics: Would a concept diagram, process strip, comparison card, or evidence matrix reduce uncertainty?
- Component opportunities: Which GEDL components fit naturally?
- Accessibility: Are headings, links, tables, and diagrams semantic and usable?
- Print behavior: Would the article work as a printed handout?
- Publication context: Does the article need author, location, date, or update context?
- Paper pathway: Should the article provide a static downloadable PDF?
- Screen-only affordances: Do any buttons, hover states, calendar actions, or downloads become confusing when printed?
- Source artifact: Does the article have a portable source artifact that owns the editorial copy, metadata, media references, and component data?

### Migration Workflow

1. Preserve the core message.
2. Extract the article into a source artifact before visual migration when the content is still embedded in route code.
3. Identify the reader's starting uncertainty.
4. Rewrite the section sequence as questions.
5. Mark paragraphs that repeat, over-explain, or introduce multiple tasks.
6. Replace explanation with visuals where the relationship can be shown faster.
7. Add a process strip only if there is a real workflow.
8. Convert contrasts into comparison cards.
9. Convert action relationships into evidence matrices or checklists.
10. Move official links into resource cards with visible URLs.
11. Add print-safe rules for new components.
12. Add or update article metadata when local context, publication timing, or public procedures matter.
13. If the article is likely to be printed, generate or regenerate the static PDF.
14. Verify with mobile, desktop, and rendered print/PDF checks.
15. Re-read for tone: calm, practical, non-adversarial, and authored.

### What Not To Do

Do not rewrite the article just to match a new structure.

Do not add visuals that do not reduce cognitive load.

Do not turn the article into a presentation deck.

Do not remove nuance to make the page feel shorter.

The goal is transformation without losing the article's core message.

## XI. Guided Parcel Review Migration

GEDL may eventually reshape the interactive Guided Parcel Review experience.

### Components That Naturally Map Into The App

- process strips for staged review
- comparison cards for "hard to act on / easier to verify" distinctions
- record callouts for property record review
- evidence matrices for correction workflows
- resource cards for official forms and sources
- script cards for contact or hearing preparation
- concept diagrams for tax and valuation mental models

### Article-Specific Components

Some components should remain primarily editorial:

- long narrative openings
- closing reflections
- extended field-guide scorecards
- print-first script cards

### Shared Components

The app and articles can share:

- section kickers
- review cards
- note boxes
- record callouts
- resource cards
- evidence matrix logic
- visible URL treatment for printable outputs

### One Educational Ecosystem

The app and articles should not feel like separate design systems. They can differ in interaction, but they should share the same editorial grammar:

```text
Orient -> observe -> compare -> decide -> act
```

The app can use interaction. Articles should not require it. But both should reduce uncertainty in the same way.

## XII. Future Governance

Every new component, article, or redesign decision should be tested against these questions:

- Does this reduce uncertainty?
- Does this replace explanation?
- Does this help readers act?
- Does this fit the editorial language?
- Does this become reusable?
- Does it preserve accessibility?
- Does it preserve print quality?
- Does it reduce cognitive load?
- Does it respect the reader's intelligence?
- Does it preserve accuracy?

If the answer is no, the decision probably does not belong.

## XIII. Publication Readiness Review

Every finished article must receive a Guided Editorial System Publication Readiness Review, or PRR, before publication.

The PRR is the final stage of the system. Writing is complete. Editorial design is complete. Development is complete. This is not another editing pass. It is the publishing equivalent of pre-flight inspection.

Nothing should be rewritten unless it materially improves the reader's understanding, accessibility, discoverability, measurability, maintainability, or long-term usefulness.

### Optimization Order

Optimize in this order:

1. Readers
2. Publishers
3. Search engines
4. Machines

If an optimization benefits search while harming the reader, reject it. If an optimization benefits readers, it will usually benefit search naturally.

### Review Order

Review in this order:

1. Editorial quality
2. Guided Editorial System compliance
3. Semantic HTML
4. Accessibility
5. Performance
6. Search intent
7. Structured data
8. Machine readability
9. Print behavior
10. Social publishing
11. Analytics
12. Internal knowledge graph
13. Legacy refactoring
14. Publication assets created
15. Executive publication recommendation

### Publication Package

Each reviewed article should produce a publication report stored with the project documentation. The report replaces spreadsheet-only tracking and should include:

- article identity, canonical URL, slug, author, dates, and version
- editorial strengths, weaknesses, refinements, and score
- GES component compliance and legacy-pattern notes
- semantic HTML and accessibility findings
- performance, responsive, print, and PDF findings
- search intent, metadata, structured data, and social preview recommendations
- social publishing copy for the major channels the publication uses
- analytics event recommendations and implemented instrumentation notes
- article lifecycle and review interval
- knowledge graph terms, definitions, agencies, forms, datasets, processes, companion articles, and reusable components
- publication assets created by the article
- final recommendation

### Analytics Expectations

Article analytics should measure useful reader actions without turning the article into an app.

Recommended event vocabulary:

- `article_open`
- `scroll_25`
- `scroll_50`
- `scroll_75`
- `scroll_complete`
- `resource_click`
- `gis_click`
- `sales_map_click`
- `form422_click`
- `download_pdf`
- `share_article`
- `print_article`
- `copy_link`
- `external_link`
- `related_article`

Instrument only the events that answer real editorial or publication questions. Avoid noisy analytics that do not help the publication improve.

For long-form articles, prefer CSS-bound article depth markers over generic document scroll math. Place invisible, non-printing markers at meaningful article-depth thresholds such as 25, 50, 75, and 100 percent, then record both milestone events and a final maximum depth event on exit. This answers the publication question directly: did the reader reach the bottom, and if not, how far did they get?

### Social Publishing Package

A PRR should include publication-ready social copy so publishing requires no additional creative work. Generate:

- Facebook primary introduction, alternative introduction, short version, pinned comment, follow-up comment, discussion question, recommended day/time, and audience framing
- LinkedIn professional introduction and executive summary
- Bluesky, Threads, and X copy
- thread version for X when appropriate
- OpenGraph title and description
- social image brief, crop guidance, and suggested pull quote
- 3 to 5 non-spammy hashtags

Social copy should preserve the article's voice. Do not manufacture urgency, outrage, or partisan framing.

### Knowledge Graph Expectations

Each PRR should extract:

- key concepts
- definitions
- referenced statutes
- referenced forms
- referenced agencies
- referenced publications
- referenced datasets
- related articles
- future companion articles
- glossary entries
- reusable diagrams
- reusable components

The publication should become easier to maintain and expand after each article.

### Publication Recommendation

Use one of three outcomes:

- Ready to Publish
- Minor Revisions Recommended
- Hold for Revision

The article is ready only when reader clarity, accessibility, print usefulness, discoverability, measurability, and maintainability are all acceptable.

GEDL is not documentation for decoration. It is the constitution for an educational publishing platform.

Someone unfamiliar with the project should be able to read this document and understand:

- the philosophy
- the architecture
- the component grammar
- how to build a new article
- how to refactor an old one
- how to expand the system responsibly

Most importantly, they should understand why every design decision exists, not merely how it looks.
