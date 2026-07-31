# Research note: Assessment Season Is Ending. Budget Season Starts Now.

Current through July 31, 2026. This note preserves the article's evidence trail and editorial decisions. It is not intended for public display on the article page.

## Proportional design brief

- **Information problem:** Readers often see a new assessed value before local budgets and levies are complete and understandably treat the percentage value change as a tax-bill forecast. The article must separate those stages without minimizing affordability concerns.
- **Information parts:** 2026 process status; countywide equalization evidence; annual assessment versus six-year inspection; one anonymous annual history; value-budget-levy mechanics; market context; the upcoming public calendar; limited local matters to watch; 2027 transition.
- **Subject and representation:** The subject is an administrative process expressed through records, dates, and relationships. It should be observed and literal where evidence is available, simplified only to explain the sequence. The paired chart uses actual annual data and avoids a dual axis.
- **Audience and access:** Gage County property owners encountering the article once or periodically, commonly from a shared link on a phone. People least likely to seek it are those who assume the assessment notice already determines the bill; the opening and chart address that misconception quickly.
- **Visual qualities:** Calm, documented, local, legible, and nonpartisan. Existing Guided Editorial System typography, civic blue, evidence green, tax red, article shell, source notes, memory anchor, resources block, and responsive table treatment are reused.
- **Precedents reviewed:** Existing repository articles including *How Your Property Value Becomes a Tax Bill*, *Watch the Tax Roll Move*, *Assessment Up. Protest Denied. Taxes?*, and *Before You Walk Into a Property Protest*. Their useful qualities are plainspoken/legal, interactive/relational, candid/empathetic, and practical/evidence-led.
- **Interpretation:** “Seasonal handoff” is the organizing idea: finished assessment work hands the calendar to budgets and levies. The anonymous home is evidence for a limited proposition, not a countywide sample.

## Repository authorities used

- `docs/ges/article-publishing.md` for route, shell, metadata, article-roll, source, and verification conventions.
- `data/counties/gage/assessment-ratio-analysis.json` for 2025 and 2026 Gage County residential ratio statistics.
- `data/counties/gage/pad-ratio-statistics-2026-gage.json` for the 2026 source report, qualified-sale period, and assessment-year alignment.
- `data/standards/iaao-standards.json` for the IAAO residential COD and PRD reference ranges and Nebraska level-of-value range.
- `data/app/legal-references.json` and the stored assessment-calendar datasets for issue spotting and primary-source routing.
- Existing article content, components, styles, static routes, manifest schema, and verification scripts.

## Private property evidence

The supplied Gage County property-record PDF was read, rendered, and visually checked. It shows assessed values of $151,135 for 2024, $165,395 for 2025, and $166,910 for 2026. It also shows 2025 net tax of $2,023.54 and a total levy of 1.586964.

The parcel number was used privately with the repository's Nebraska Taxes Online capture workflow. The identifying raw capture remains in a private, untracked research location and must not be published, linked from the article, or copied into public assets. Public data is normalized in `data/articles/one-beatrice-home-assessment-tax-history.csv`, which contains no owner, address, parcel, geocode, legal description, photograph, or direct parcel link.

Nebraska Taxes Online labels the source pages “TAX YEAR RECORD [year].” The public CSV therefore pairs the total assessed value, net tax, and available total levy printed on the same tax-year record. Payment dates visible in the private source were deliberately excluded from the public dataset because they are unnecessary to the comparison and add identifying specificity. No levy was displayed for 2009 or 2010. The 2026 county record contains an assessed value, but no completed 2026 levy or net tax; both fields remain blank and are described as not yet determined.

## Verified calculations

Selected endpoints use completed tax years 2009 and 2025:

- Assessed value: $165,395 − $98,470 = **$66,925**.
- Assessed-value change: $66,925 ÷ $98,470 = **67.9649%**, displayed as **68.0%**.
- Net tax: $2,023.54 − $1,936.28 = **$87.26**.
- Net-tax change: $87.26 ÷ $1,936.28 = **4.5066%**, displayed as **4.5%**.
- 2026 value change from 2025: $166,910 − $165,395 = **$1,515**, or **0.9160%**. No tax comparison is calculated for 2026.

County residential assessment statistics:

| Measure | 2025 | 2026 | Change |
| --- | ---: | ---: | ---: |
| Qualified sales | 606 | 550 | −56 |
| Median ratio / level | 94.45 | 96.44 | +1.99 |
| COD | 24.42 | 17.03 | −7.39 |
| PRD | 1.076889614 | 1.041132424 | −0.03575719 |
| COV | 54.19 | 25.37 | −28.82 |

The article says the county moved materially closer to its principal statistical targets because the median moved near Nebraska's 96% target, COD entered the IAAO 5–20 reference range for rural/small residential jurisdictions, and PRD moved substantially toward 1.00. It also states that PRD remains just above the IAAO 0.98–1.03 range. This is deliberately stronger than “some numbers changed” and narrower than “equalization is complete or perfect.”

## External primary sources consulted

- Gage County Board of Equalization agendas, minutes, and meeting archive, including July 22, 2026 protest disposition records: <https://gagecountyne.gov/county-board/board-meetings/>
- Gage County property valuation protest guidance: <https://gagecountyne.gov/county-assessor/property-valuation-protests/>
- Neb. Rev. Stat. §§ 77-1301, 77-1311.03, 77-1504, and 77-1601: <https://nebraskalegislature.gov/laws/browse-statutes.php?chapter=77>
- Nebraska Department of Revenue Property Assessment Division FAQ: <https://revenue.nebraska.gov/about/frequently-asked-questions/nebraska-property-assessment-faqs>
- Nebraska PAD main calendar, revised June 2026: <https://revenue.nebraska.gov/sites/default/files/doc/pad/calendar/PAD%20MAIN%20CALENDAR%20for%202025.pdf>
- City of Beatrice operating budget and adopted one- and six-year street plan: <https://www.beatrice.ne.gov/governance-administration/budget-and-finances/operating-budget/> and <https://www.beatrice.ne.gov/media/37881>
- Gage County Sheriff's Office law-enforcement center information: <https://gagecountysheriff.us/general-information/>
- Federal Reserve July 2026 Monetary Policy Report housing discussion: <https://www.federalreserve.gov/monetarypolicy/2026-07-mpr-part1.htm>

## Qualified wording and unresolved items

- “Largely complete” recognizes that TERC appeals may follow even though protest hearings and county equalization have concluded.
- Protest results are characterized as varied because official minutes include both value changes and no-change decisions. The article does not infer any owner's satisfaction from the board's disposition.
- The six-year statement applies to systematic inspection and review of every parcel, not to the annual assessment duty and not necessarily to a whole-county reappraisal event.
- The September joint-hearing window is stated conditionally because it applies when the statutory trigger is met. The PAD file name still says “for 2025,” while the document itself was revised in June 2026 and provides 2026 dates; the article notes that labeling issue.
- National mortgage-rate and housing-activity evidence is used only as context for the period, not as proof of a particular local sale or forecast.
- The city street plan establishes planned needs, not a final property-tax increase.
- Law-enforcement center financing remains unsettled. The official project page describes a bond and a targeted sales-tax route as possible approaches; the article does not say either has been selected.
- The final public town hall is listed for Monday, August 10, 2026, at 7:00 p.m. in Southeast Community College's AEC Building, Room 134. The article presents the supplied event details in the established calendar-card pattern and provides a local `.ics` file without inventing an end time.
- No sufficiently concrete new Beatrice Public Schools facility or bond proposal was found in current official material. The article therefore mentions school budgets generally but does not imply a new project.
- The anonymous home illustrates a mechanism. It is explicitly not presented as representative of Beatrice or Gage County.

## Privacy review

Public article content, metadata, dataset, SVG labels, alt text, chart, and social image were checked for the owner name, address, parcel number, geocode, legal description, direct parcel URL, photographs, building sketch, and original social-media wording. None should appear. The source PDF and raw Nebraska Taxes Online capture remain private research evidence.

## Header image generation record

The built-in OpenAI image-generation mode produced one image. It was mechanically resized from its generated 1731×909 dimensions to the required 1200×630 Open Graph size without changing the composition.

Final prompt:

> Use case: infographic-diagram. Asset type: 1200 × 630 website article hero and Open Graph image. Create a polished anonymous civic editorial illustration about the handoff from property assessment season to public budget and levy season in Gage County, Nebraska. Show a completed assessment file on the left. From it, two clearly separate flowing paths—assessed value and net taxes—move independently toward a public budget ledger, hearing calendar, and levy document on the right. Use a sophisticated flat editorial illustration with subtle printmaking texture, a wide balanced composition, generous safe margins, calm civic blue, evidence green, warm tax-red, cream paper, and charcoal ink. Distinguish the paths by both color and pattern. Include no words, numbers, labels, logos, seals, letterforms, owner, person, address, parcel number, geocode, legal description, map pin, property photograph, building sketch, campaign imagery, political symbols, dollar-bill imagery, gavel, courthouse cliché, or watermark. Make the assessment file visibly complete while the budget documents suggest the next active stage.

## Verification record

- All 17 Nebraska Taxes Online tax-year records from 2009 through 2025 were machine-checked against the public CSV for assessed value and net tax; all displayed levies from 2011 through 2025 were also checked. The 2026 row was checked against the supplied county property record.
- Endpoint calculations were independently recomputed after normalization: assessed value +$66,925 / +67.9649%; net tax +$87.26 / +4.5066%.
- `npm test` passed, including syntax, data contracts, reader-count, document-library, and analytics-timestamp checks.
- `npm run verify:article-roll` passed after its brittle position/count assertions were generalized for the new newest article and additional levy-related search result.
- The article-page verifier completed all canonical and legacy checks for this article in mobile/desktop and light/dark modes with no article-specific failure, no document-level horizontal overflow, three source notes, and no console or page errors. The overall command still reports an unrelated existing failure in the prior protest-evidence guide's past-hearing state.
- The global-header verifier reaches an unrelated existing BOE tracker sticky-column assertion. The new article's global header, theme controls, hero, and shell were visually present in both the in-app preview and article-page captures.
- The canonical page, anonymous CSV download, hero/OG image, article card, two internal companion links, and 18-row chart table were loaded from the local server. The preview remains available at `http://127.0.0.1:4239/articles/assessment-season-ends-budget-season-begins/` while this workspace session is active.

## Second-pass editorial refactor

Completed after publication in response to a focused voice, length, and repetition review.

- The article's pre-refactor metadata recorded 1,274 words and a seven-minute reading time. The revised prose model contains 892 words, excluding source notes, citations, the expandable annual table, technical detail, section headings, visual labels, and resources: a 30.0% reduction. Reading time remains five minutes.
- Exact equalization statistics remain in an expandable technical note. The narrative now states only the supported conclusion: the residential roll moved in the right statistical direction without implying perfection.
- The annual-assessment and six-year inspection distinction is isolated in a factual legal note citing Neb. Rev. Stat. §§ 77-1301 and 77-1311.03.
- The supplied property record lists the home in average condition and does not identify a major addition or new-construction event. The article therefore uses the qualified wording “no major addition or new construction identified in the current record.” Historical owner blocks changed during the available record period, so the article deliberately does not characterize the home as held by one longtime owner.
- Public wording omits the construction decade, building size, ownership history, and other details that are unnecessary to the illustration and could make the property easier to identify.
- National market context and the author's local outlook are separated. The Federal Reserve source note supports only the national context; a distinct “My opinion—not a forecast” callout contains the local interpretation.

### Repetition audit

- **One property cannot represent the county:** primary location is the empathetic bridge after the chart.
- **Assessed value does not independently determine taxes:** primary location is the guided transition; the next section reinforces it once by calling assessment one input.
- **Assessment, budgets, levies, and the final bill:** primary location is the four-stage process visual.
- **2026 levy and tax are unavailable:** stated in the 2026 current-value note and marked on the chart for accessibility; the expandable table carries the same status as data, not narrative.
- **Market outlook is uncertain:** primary location is the labeled opinion callout; the ending echoes the uncertainty without restating the forecast.
- **Countywide revaluation is complete:** established near the opening and used once more to frame the conclusion.

### Second-pass verification

- Rechecked all 17 completed Nebraska Taxes Online records against the anonymous CSV. Values, net taxes, and every displayed levy matched; the 2026 row still contains value only.
- Recomputed the selected endpoints: assessed value increased $66,925, or 67.9649%; net tax increased $87.26, or 4.5066%. Display rounding remains 68.0% and 4.5%.
- Rechecked the residential equalization summary against the stored 2025 and 2026 statistics. The direction stated in the narrative is supported by the median, COD, and PRD movement retained in the technical note.
- Completed a public-output privacy scan for the owner, address, parcel identifiers, legal-description fragments, and statement number; no matches were found.
- `npm test` passed. The article-roll verifier passed, including the newest article card, search, internal view, and 390-pixel responsive layout.
- The article-page verifier found no failure or warning for this article in canonical or legacy form, mobile or desktop, light or dark. The full-suite command continues to report the pre-existing past-hearing-state failure in the separate protest-evidence guide.
- Focused screenshots of the legal note, four endpoint cards, guided transition, four-stage tax process, opinion callout, budget timeline, and “What I’ll be watching” panel were visually reviewed at 390 and 1280 pixels. Both viewports had zero page-level horizontal overflow.
- The global-header workflow reached its pre-existing BOE tracker sticky-column assertion. No article-specific header or shell failure was reported by the article-page verifier.

### Historical-chart refinement

- The two annual series now use restrained smoothed paths with separate translucent area fills. The underlying points and source values are unchanged; smoothing affects only the line drawn between annual observations.
- Each year is represented by one focusable chart group. Hovering, tapping, or keyboard-focusing a year reveals a compact label containing both its assessed value and net tax, or the explicit pending-tax status for 2026. The expandable annual table remains the noninteractive data presentation.
- The chart legend and interaction instruction are aligned above the plotting area. The 2026 pending label and dashed marker are aligned to the 2026 year column rather than floating over an earlier tax point.
- The visible endpoint callouts now use the completed comparison year, 2025, for both assessed value and net taxes. Each label is centered directly above its 2025 point; the separate 2026 pending marker and current-value note preserve the newer assessment without implying a completed tax comparison.
- Focused light- and dark-mode review confirmed readable lines, fills, labels, and tooltips. Mobile and desktop captures retained zero page-level horizontal overflow.

### Removed property-specific forecast

- The home's 2026 assessed value increased from $165,395 to $166,910: $1,515, or 0.9160%. The stored 2026 Gage County Report and Opinion countywide valuation-growth figure is 9.57%. Those calculations remain in this private research record but are no longer compared in the public narrative.
- The paragraph predicting a neutral or somewhat lower eventual net tax was removed in full. No prediction about this home's 2026 tax remains outside—or inside—the market-opinion callout.
- The article retains only a follow-through commitment to revisit the anonymous home after the final levy and tax figures become available.

### Body-text emphasis pass

- A structured `bodyEmphasis` layer now carries the article's selective inline emphasis without embedding presentation markup in the authoritative prose strings.
- Bold identifies findings, decision points, and limiting principles that should survive a fast scan. Italics mark turns in thought, qualifications, and cadence that help the reader hear the intended delivery.
- The continuity edit leaves 12 bold phrases and seven italic phrases across the narrative. It does not alter the verified figures, citations, legal note, technical detail, chart labels, source notes, or resource descriptions.
- The previously requested underline remains reserved for the sentence distinguishing national market context from a Gage County forecast, so underline, bold, and italics retain distinct jobs.

### Final continuity edit

- Narrative length moved from 892 to 990 words: 98 additional words, or 11.0%, while remaining within the article's 800–1,000-word target and five-minute reading-time treatment.
- Six section-boundary bridges now make the scale and time changes explicit: opening to equalization; countywide measures to one home; tax mechanics to market context; market outlook to current-year budgets; general budget questions to local matters; and current financing decisions to the 2027 assessment cycle.
- The guided assessment-to-tax statement now leads directly into the tax-mechanics section. The removed property-specific forecast no longer interrupts that question-and-answer sequence.
- The budget source note appears before the local-matters bridge, leaving the bridge adjacent to the heading it introduces. The legal note, market source note, opinion callout, timeline, town-hall card, and sources retain their established roles.

### Pre-publication analytics and metadata pass

- The existing central article-view event remains registered in `src/app.js`, with `articleId` `assessment-season-ends-budget-season-begins`, the published title, content type `article`, and county `gage`. The shared visit layer also records campaign parameters, Facebook click identifiers, referrer context, viewport class, elapsed time, and Facebook in-app-browser context when present.
- Article-level analytics now record 25%, 50%, 75%, and 100% reading milestones plus final depth on page exit. Interaction events cover the share tool, author contact, technical equalization note, historical chart-year exploration, annual-table expansion, anonymous CSV download, inline source links, administrative-reference links, and town-hall calendar download.
- The metadata description is 152 characters and the social description is 159 characters. The canonical content record, article manifest, static HTML, Open Graph fields, Twitter fields, and Article structured data now use the same authoritative wording for their respective roles.
- Static social metadata now includes site name, locale, article author and section, article tags, PNG image type, and social-image alt text. Article structured data includes the subtitle, author, publisher, image description, canonical page, keywords, word count, reading time, and language.
- `scripts/test-assessment-season-publication.mjs` protects the description alignment, structured data, and analytics wiring from publication drift.

### Printable edition

- The repository's established Chromium article-to-PDF generator now includes this article as a default target. Its output is `assets/guides/assessment-season-ends-budget-season-begins.pdf`, and the article's tools panel links to that stable asset.
- The paper edition expands the technical equalization note and verified annual-history table because a printed reader cannot operate disclosure controls. The visual chart, endpoint cards, legal note, tax-process strip, market-opinion distinction, budget timeline, town-hall information, ending, and complete administrative references remain intact.
- Print-specific rules fit the chart to letter width, remove screen-only interaction instructions, keep comparison cards and callouts together, start the budget section on a clean page, and reserve readable space for long source labels and URLs.
- The final PDF is 10 letter-size pages. All 10 pages were rendered to PNG and visually inspected. The final pass found no clipped text, overlaps, empty pages, missing sections, broken chart labels, or unreadable source entries.
- PDF text extraction confirmed the legal note, 18-row annual table, 2026 pending-tax status, opinion label, town-hall card, conclusion, and sources. A public-output scan found no parcel number, geocode, legal description, trustee name, or other private record identifier.

### Audio edition

- The supplied audio overview is retained as the article publication asset at `assets/audio/articles/assessment-season-ends-budget-season-begins-audio.m4a`. The repository copy is byte-for-byte identical to the supplied source file.
- Media inspection reports a 15-minute, 19-second stereo AAC recording at 44.1 kHz and approximately 256 kbps. Canonical article data and the article manifest record the duration as `PT15M19S`.
- The entry panel uses the established native, no-preload audio treatment with an M4A download link. Analytics record audio-panel expansion, first play, pauses with elapsed time, completion, and file download.
- Article structured data identifies the recording as an `AudioObject` with `audio/mp4` encoding, a stable content URL, publication date, and duration. The print edition remains separately identified as an associated media object.

### Post-publication opening edit

- Removed the opening sentence “We made it through another assessment season.” because it repeated the section heading verbatim. The section now begins directly with the completed protest and equalization work.
- Narrative metadata moved from 990 to 983 words. The five-minute reading-time treatment remains appropriate, and the printable edition was regenerated from the updated canonical article.
