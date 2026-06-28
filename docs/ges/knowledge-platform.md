# GES Knowledge Platform

Status: architecture and inventory report  
Date: 2026-06-28  
Scope: existing Guided Parcel Review knowledge assets and the target GES Knowledge Platform architecture

GES is becoming a structured knowledge platform. It is not an AI, LLM, chatbot, CMS, or document repository. The goal is to make static public, internal, legal, procedural, and educational knowledge fast to navigate, easy to cross-reference, and ready for future search, SQL migration, and AI-assisted retrieval without building those future systems now.

## Executive Finding

Guided Parcel Review already contains a substantial knowledge corpus. The project is not starting from zero.

The strongest existing assets are:

- Source provenance: PAD registry and metric ledger.
- Calendars: PAD main calendar, assessment events, taxpayer action dates.
- Standards: IAAO glossary and ratio-study standards.
- Legal anchors: small statutory reference set and article-level legal references.
- Publications: article manifest, live article routes, article assets, and publication metadata.
- Property data: MIPS record cards, property manifest, county/statewide PAD context.
- Reusable copy: centralized site copy, resource FAQ copy, article resources.
- Governance docs: data architecture, source audit, calculation map, ingestion playbook, article publishing rules.

The missing layer is stable normalized knowledge identity and relationship modeling. GES should evolve the current corpus into a normalized knowledge layer instead of replacing it.

## Operating Principle

Do not treat documents as the knowledge model.

Documents are containers. Knowledge objects are reusable units extracted from, cited to, and related across those containers.

```text
Raw source document
  -> source registry record
  -> extracted observation or text unit
  -> normalized knowledge object
  -> relationship row
  -> search index row
  -> presentation binding
  -> UI rendering
```

No layer should consume a layer below it for a purpose it does not own. The browser can consume app-ready chunks. It should not parse PDFs or perform source extraction at runtime. Presentation should render knowledge and search results; it should not become the source of truth for citations, deadlines, definitions, or legal authority.

## Current Responsibility Layers

| Layer | Existing assets | Current state | Platform treatment |
| --- | --- | --- | --- |
| Raw documents | `research/gworks-pdfs/`, article media, generated PDFs, PAD URLs in source registry | Present but mixed between research, generated output, and source files | Preserve as source evidence or presentation artifacts; do not make raw documents the public data contract |
| Source registry | `data/sources/nebraska-pad-source-registry.json` | Strong normalized source document registry | Reuse as the seed for `source_documents` |
| Extraction ledger | `data/sources/nebraska-pad-metric-ledger.json` | Strong metric-level provenance and verification queue | Reuse as the seed for `source_observations` and correction queues |
| Normalized domain data | `data/statewide/*.json`, `data/counties/*/*.json`, `data/calendars/pad_main_calendar_2025.json`, `data/standards/*.json` | Partly normalized, partly app-shaped | Migrate into typed knowledge objects and metric/event tables |
| App-ready data | `data/app/*.json`, `recordCard.guidedSnapshot`, article manifest | Fast static browser payloads | Keep as presentation/search feed outputs generated from normalized data over time |
| Presentation | `src/routes/`, `src/content/articles/`, `articles/`, GES components | Useful public UI | Keep separate from source authority and normalized object identity |
| Search | Article roll typeahead, route resources, app search-like datasets | Lightweight and local | Generate future search index from knowledge objects plus publication metadata |

## Inventory Summary

The audit found:

- 979 JSON files under `data/`, including 934 MIPS property record-card JSON files.
- 33 documentation files under `docs/`.
- 5 article manifest entries: 2 published and 3 draft.
- 2 live article body sources under `src/content/articles/`.
- 2 live public article routes under `articles/`.
- 222 PAD source documents in the source registry.
- 4,767 PAD metric ledger entries: 4,764 verified, 2 mismatched, and 1 needing manual review.
- 153 PAD main calendar events.
- 72 assessment calendar UI events.
- 10 taxpayer action dates.
- 115 IAAO glossary entries.
- 3 IAAO assessment-level standards and 13 COD standards, plus additional sample size, PRD, and COV guidance.
- 5 real property forms.
- 4 legal reference anchors.
- 3 county data sets with Gage, Lancaster, and Saline county app-ready context.

## Knowledge Inventory

| Asset | Path | Current shape | Readiness | Future role |
| --- | --- | --- | --- | --- |
| Article manifest | `data/app/articles.json` | Metadata-driven publication manifest with taxonomy, status flags, routes, hero images, reading time, categories, tags, keywords, resources, glossary/statute/legal references | Presentation-ready and already close to canonical publication metadata | Seed `publication` objects and search fields |
| Published article routes | `articles/` and `src/content/articles/` | Two live article pages and two article body modules | Presentation-ready | Keep article bodies separate from publication metadata; extract referenced concepts/legal anchors into knowledge objects |
| Article assets | `assets/guides/`, `assets/images/articles/`, `assets/audio/articles/`, `assets/videos/articles/` | Hero images, author image, printable guides, audio, video | Presentation-ready | Store as publication resources, not source authority |
| Article publishing docs | `docs/ges/article-publishing.md` | Manifest, public/internal, draft workflow, card rules | Governance-ready | Keep as publication workflow bible |
| PAD source registry | `data/sources/nebraska-pad-source-registry.json` | 222 source document records with source family, jurisdiction, URLs, year fields, confidence, review flags | Normalized and audit-ready | Seed `source_documents` |
| PAD metric ledger | `data/sources/nebraska-pad-metric-ledger.json` | 4,767 metric observations with source page, table, row/column labels, extraction method, confidence, verification status, mismatch details | Normalized and audit-ready | Seed `source_observations`, metric facts, and review queue |
| Statewide CTL data | `data/statewide/certified-taxes-levied.json`, `data/statewide/county-ctl-comparisons.json`, `data/statewide/statewide-ctl-summary.json` | County/year and statewide value, tax, and average rate records | Mostly normalized | Convert into metric objects or fact rows linked to PAD source documents |
| Statewide ratio data | `data/statewide/pad-ratio-statistics-by-county.json` | County/class assessment statistics for PAD Reports and Opinions | Mostly normalized | Convert into assessment statistic facts linked to source documents and IAAO standards |
| Assessment ranges | `data/statewide/county-assessment-ranges.json` | Nebraska acceptable range context | App-ready | Convert into `assessment_rule` objects with statutory authority |
| PAD main calendar | `data/calendars/pad_main_calendar_2025.json` | 153 events with due date, duty, authority, responsible party, tags, phase, source, indexes | Good normalized source-style calendar | Seed `deadline`, `calendar_event`, and `procedure` objects |
| Assessment calendar events | `data/app/assessment-calendar-events.json` | 72 2026 UI-facing events with plain-English text, phase, audience, priority, source label, source URL, recurrence, notes | Presentation-ready; some items explicitly carry verification pending notes | Keep as generated public/internal calendar feed; backfill from normalized calendar objects |
| Taxpayer action dates | `data/app/nebraska-taxpayer-action-dates.json` | 10 taxpayer-facing deadline/action summaries derived from calendar events | Presentation-ready | Keep as generated public action feed |
| IAAO glossary | `data/standards/iaao-glossary.json` | 115 term/definition entries with aliases and seeAlso | Partly normalized | Convert terms to `definition` objects with stable ids, source citations, and relationship rows |
| IAAO standards | `data/standards/iaao-standards.json` | Ratio-study ranges, sample-size guidance, PRD/COV/COD context | Partly normalized and app-ready | Convert into `best_practice`, `assessment_rule`, and `standard` objects |
| Legal anchors | `data/app/legal-references.json` | 4 Nebraska statute anchors with labels, titles, URLs, and usage tags | Useful but not comprehensive | Seed `statute` objects; expand to constitutional provisions, admin rules, case law later |
| Real property forms | `data/app/real-property-forms.json` | 5 PAD forms plus source links | App-ready | Convert forms to `form_resource` or `procedure_resource` objects linked to deadlines and procedures |
| Central site copy | `data/app/site-copy.json` | Structured app copy for navigation, pages, modals, resources, forms, and request text | Presentation-ready | Keep as presentation copy; extract only stable FAQs/procedural concepts into knowledge objects |
| Route resource fallbacks | `src/content/route-resources.js` | FAQ and form fallback copy by guided route | Useful but duplicated with `site-copy` | Keep as runtime fallback; long term generate from app copy or knowledge resource objects |
| Property manifest | `data/app/property-manifest.json` | 933 listed properties with shared data pointers | App-ready manifest | Keep as app manifest; reconcile with 934 record-card files |
| MIPS record cards | `data/property-records/mips/` | 934 source/app-ready record cards: 605 residential, 180 agricultural, 149 commercial | Mixed raw vendor data and guided snapshots | Split over time into source record, normalized property facts, and app-ready snapshot |
| County context | `data/counties/{gage,lancaster,saline}/` | Ratio analysis, market position, PAD ratio stats, tax district authorities, valuation groups, office context, colors | App-ready with source objects | Convert reusable concepts to `county_context`, `market_area`, `tax_authority`, `assessment_statistic`, and `procedure` objects |
| Calculation map | `docs/calculation-map.md` | Traceable derived-value map | Governance-ready | Keep as calculation/source discipline policy |
| Data architecture | `data/README.md` | Current target of `source -> normalized -> app-ready` | Governance-ready | Adopt as the platform layer model |
| Data dictionary | `docs/data-dictionary.md` | Practical contracts for manifest, record cards, guided snapshot, county/state references, naming rules | Governance-ready | Keep as data contract reference during migration |
| Source provenance audit | `docs/source-provenance-audit.md` | PAD discovery, schemas, verification results, mismatches, extraction methods, year discipline | Governance-ready | Keep as source authority and audit baseline |
| Record ingestion playbook | `docs/record-ingestion-playbook.md` | GWorks/NTO ingestion workflow and quality gate | Operational-ready | Keep as ingestion pattern; do not treat browser automation as runtime architecture |
| Content extraction inventory | `docs/content-extraction-inventory.md` | Site copy extraction, duplicated copy notes, editor recommendations | Governance-ready | Use for presentation-copy cleanup and FAQ extraction |
| Research assets | `research/` | Comparable rankings, GWorks PDFs, NTO/site evidence captures, generated reports | Raw/research | Preserve as source/research archive; only normalized, cited findings become knowledge |
| Existing scripts | `scripts/` | Ingestion, capture, validation, ranking, PDF generation, test helpers | Operational tooling | Keep outside runtime; future ingestion jobs can reuse patterns |

## Existing Legal And Standards Coverage

Current explicit legal/authority references include:

- Nebraska Constitution Article VIII, Section 1 in article resources.
- Nebraska statutes 77-112, 77-201, 77-1301, 77-1303, 77-1311, 77-1501, 77-1502, 77-1504, 77-5013, 77-5023, and 77-5027 across article modules and legal anchors.
- Title 350, Chapter 10 in article resources.
- 2026 Reports and Opinions of the Property Tax Administrator for Gage County.
- PAD main calendar and PAD monthly assessor reminders.
- IAAO Standard on Ratio Studies glossary and standards context.
- IAAO appraisal/course references in article resources.

Current gaps:

- Nebraska Constitution is referenced but not normalized.
- Nebraska Revised Statutes are only selectively anchored.
- Nebraska administrative code is referenced but not normalized.
- Nebraska case law was not found as a normalized corpus.
- Robert's Rules of Order was not found as a current corpus.
- PAD Reports and Opinions are strongly represented as source documents and metrics, but their textual findings are not yet objectized.
- IAAO glossary and standards are useful but need stable ids, source-page citations, and object relationships.

## Readiness Classification

### Already Normalized

- `data/sources/nebraska-pad-source-registry.json`
- `data/sources/nebraska-pad-metric-ledger.json`
- `data/statewide/county-ctl-comparisons.json`
- `data/statewide/statewide-ctl-summary.json`
- `data/statewide/pad-ratio-statistics-by-county.json`
- `data/calendars/pad_main_calendar_2025.json`
- Article manifest publication metadata in `data/app/articles.json`

### Presentation-Ready

- Article roll metadata and live article routes.
- `data/app/assessment-calendar-events.json`
- `data/app/nebraska-taxpayer-action-dates.json`
- `data/app/site-copy.json`
- `data/app/real-property-forms.json`
- County and statewide JSON consumed by current views.
- Printable article guides and article media.

### Raw Or Research

- GWorks PDFs and generated record PDFs under `research/gworks-pdfs/`.
- Site evidence captures and zipped research evidence under `research/`.
- Source parcel-id text files under `data/sources/`.
- MIPS record-card `source` sections.

### Mixed And Needing Separation

- MIPS record cards contain raw source fields, normalized-like fields, and `guidedSnapshot` app-ready payloads in the same file.
- County JSON combines source notes, normalized metric values, and app presentation needs.
- `site-copy` and route resource fallback copy overlap.
- Article modules include resource/legal maps that partly duplicate manifest references and legal anchors.

### Archive Or Cleanup Candidates

- `.DS_Store` files in `data/`, `data/counties/`, `data/property-records/`, `data/property-records/mips/`, `research/`, and `research/gworks-pdfs/`.
- Generated article PDFs, audio, and video should be treated as presentation artifacts, not knowledge sources.
- Temporary capture screenshots and page exports in `research/` should remain in research/archive unless converted into cited source observations.

## Duplication And Drift Risks

| Risk | Where it appears | Recommendation |
| --- | --- | --- |
| Article legal references drift | `data/app/articles.json`, `src/content/articles/*`, `data/app/legal-references.json` | Create canonical knowledge ids for statutes, admin rules, constitutional provisions, and source documents; article metadata should reference ids |
| Calendar duplication | `pad_main_calendar_2025.json`, `assessment-calendar-events.json`, `nebraska-taxpayer-action-dates.json` | Treat PAD main calendar as source-derived normalized calendar; generate UI calendars and taxpayer action dates from normalized objects |
| Site copy duplication | `data/app/site-copy.json`, `src/content/route-resources.js` | Keep fallback copy for resilience, but make `site-copy` the public presentation source |
| Metric/source label repetition | Chart/render modules and JSON source objects | Move source citations to source document ids and citation objects |
| Property manifest mismatch | 933 manifest entries vs 934 record-card files | Reconcile manifest coverage or mark unused fixture intentionally |
| Mixed record-card responsibilities | `data/property-records/mips/*` | Split raw vendor record, normalized property facts, and app-ready snapshot in future migration |
| Standards without stable ids | IAAO glossary/standards | Add ids, citation fields, and relationships before broad search integration |

## Knowledge Taxonomy

The platform should support these object types as stable, typed records:

| Type | Purpose | Current seed assets |
| --- | --- | --- |
| `statute` | Nebraska Revised Statutes sections | Legal anchors, article references |
| `constitutional_provision` | Nebraska Constitution provisions | Article resources |
| `administrative_rule` | Title 350 and future regulations | Article resources |
| `case_law` | Nebraska case law | Future corpus |
| `definition` | Glossary term or legal definition | IAAO glossary, statutes later |
| `glossary_term` | Public-facing term lookup | IAAO glossary, site copy concepts |
| `standard` | Formal standard, range, benchmark, professional rule | IAAO standards |
| `best_practice` | Recommended assessment/procedural practice | IAAO standards and future guidance |
| `procedure` | Human process or agency workflow | PAD calendar duties, forms, article guides |
| `deadline` | Required date or filing window | PAD main calendar, assessment events, taxpayer action dates |
| `calendar_event` | Dated event with audience and recurrence | PAD main calendar, assessment events |
| `formula` | Named calculation | Calculation map, tax/rate formulas |
| `calculation` | Applied numeric result or method | Metric ledger, chart calculations |
| `assessment_rule` | Valuation/level/uniformity requirement | Assessment ranges, statutes, standards |
| `equalization_rule` | County/state equalization rule | PAD R&O data, statute anchors |
| `exception` | Exception to a rule/deadline/procedure | Future legal/procedural corpus |
| `publication` | Article, report, guide, opinion, training material | Article manifest, PAD R&O registry |
| `research_finding` | Interpreted finding from research/source data | Metric ledger, research rankings |
| `policy` | Internal or county policy | Future county/internal docs |
| `opinion` | PAD report/opinion or future legal opinion | PAD source registry |
| `faq_entry` | Reusable question/answer | Site copy and route resources |
| `training_module` | Training content object | Future training materials |
| `form_resource` | Official form or filing resource | PAD forms JSON |
| `source_document` | Registry record for original source | PAD source registry, future documents |
| `metric_fact` | Audited numeric observation | PAD metric ledger, county/state metrics |
| `county_context` | County-specific office, district, or procedure context | County JSON |
| `tax_authority` | Taxing authority/district object | Tax district authority files |
| `property_record_fixture` | Demo or research property record | MIPS record-card data |

Object type names should remain stable, lowercase, and SQL-friendly. Display labels belong in presentation metadata, not in type ids.

## Relationship Vocabulary

Knowledge should relate, not merely link.

Required relationship types:

- `defines`
- `references`
- `implements`
- `requires`
- `depends_on`
- `explains`
- `supports`
- `contradicts`
- `overrides`
- `supersedes`
- `exception_to`
- `example_of`
- `see_also`
- `related_procedure`
- `related_statute`
- `related_calendar_event`

Additional platform relationship types:

- `derived_from`
- `cites_source_document`
- `cites_source_observation`
- `appears_in_publication`
- `uses_form`
- `has_deadline`
- `has_authority`
- `has_definition`
- `has_metric`
- `has_jurisdiction`
- `has_audience`
- `has_visibility`
- `replaces`
- `needs_review`

Relationship rows should carry their own metadata. A relationship can be verified, inferred, provisional, public, internal, current, superseded, or review-needed independently of either object.

## Relationship Diagram

```text
SourceDocument
  | cites / contains
  v
SourceObservation
  | derives
  v
KnowledgeObject
  | defines / requires / explains / supersedes / see_also
  v
KnowledgeRelationship
  | feeds
  v
SearchIndexEntry
  | powers
  v
PresentationBinding
  | renders
  v
Article roll, glossary, calendar, article resources, internal queues, future public library
```

Example:

```text
Neb. Rev. Stat. 77-1502
  defines -> property valuation protest filing requirements
  requires -> Form 422 protest procedure
  related_calendar_event -> June protest filing window
  appears_in_publication -> Before You Walk Into a Property Protest
```

## Normalized Schema

The static JSON form should be SQL-shaped from the start. Avoid deep nesting for anything that will need filtering, permissions, search, or joins.

### Knowledge Object

Recommended row shape:

```json
{
  "id": "neb-rev-stat-77-1502",
  "type": "statute",
  "title": "Board; protests; form; report; notification",
  "shortTitle": "Neb. Rev. Stat. 77-1502",
  "summary": "Sets the valuation protest form and notification framework.",
  "body": null,
  "status": "current",
  "visibility": "public",
  "authorityLevel": "statute",
  "authority": "Nebraska Legislature",
  "jurisdiction": "Nebraska",
  "effectiveDate": null,
  "supersededDate": null,
  "sourceDocumentId": "ne-leg-statute-77-1502",
  "confidence": "high",
  "reviewStatus": "verified",
  "createdAt": "2026-06-28",
  "updatedAt": "2026-06-28"
}
```

### SQL-Compatible Tables

| Table | Purpose |
| --- | --- |
| `knowledge_objects` | One row per reusable object |
| `knowledge_object_aliases` | Alternate labels, acronyms, statute number variants, common names |
| `knowledge_object_keywords` | Search terms and controlled keywords |
| `knowledge_object_categories` | Category assignments |
| `knowledge_object_tags` | Flexible tags |
| `source_documents` | Raw source/document registry |
| `source_observations` | Extracted metric, passage, table row, or finding from a source document |
| `knowledge_object_sources` | Object-to-source citations with page/table/section anchors |
| `knowledge_relationships` | Typed object-to-object relationships |
| `knowledge_citations` | Display-ready citations normalized apart from body text |
| `knowledge_revisions` | Revision history and supersession notes |
| `knowledge_permissions` | Future public/internal/role visibility mapping |
| `knowledge_search_entries` | Generated lightweight search documents |
| `presentation_bindings` | Routes/cards/tooltips/resources that render a knowledge object |
| `publication_metadata` | Article/report/guide metadata, seeded from article manifest |
| `publication_resources` | Printable guides, audio, video, QR, and resource indicators |

### Search Entry

Search should be generated from normalized objects and publications:

```json
{
  "objectId": "neb-rev-stat-77-1502",
  "type": "statute",
  "title": "Board; protests; form; report; notification",
  "shortTitle": "77-1502",
  "summary": "Valuation protest form and notification framework.",
  "keywords": ["protest", "Form 422", "county board of equalization"],
  "aliases": ["section 77-1502", "Neb. Rev. Stat. 77-1502"],
  "categories": ["Legal", "Protests", "Equalization"],
  "tags": ["Board of Equalization", "Property Protest"],
  "citations": ["Neb. Rev. Stat. 77-1502"],
  "relationships": ["related_calendar_event:protest-filing-window"],
  "visibility": "public"
}
```

### Future AI Fields

Do not implement AI now. Reserve compatibility fields without depending on them:

- `ragEligible`
- `embeddingText`
- `embeddingVersion`
- `contextPriority`
- `contextWindowHint`
- `aiUseNotes`
- `aiExclusionReason`

These fields should remain optional and generated. They should not become authoring requirements for normal content entry.

## Public And Internal Visibility

Every knowledge object should be permission-ready even while the app remains static.

Recommended visibility values:

- `public`
- `internal`
- `restricted`
- `draft`
- `archived`

Recommended status values:

- `current`
- `draft`
- `review_needed`
- `verified`
- `superseded`
- `archived`

Public search and public article resources should only receive objects with public visibility and non-draft status. Internal views can show draft, review-needed, and restricted records when the permission context allows it.

## Search Philosophy

GES search should be lightweight, fast, and metadata-driven. The first implementation should stay static and client-side for bounded views. Broader platform search can later move to SQL or a generated search index.

Knowledge objects should be searchable by:

- Title and short title.
- Keyword.
- Alias.
- Category.
- Tag.
- Statute number.
- Constitutional article/section.
- Administrative code chapter.
- Definition term.
- Authority.
- Jurisdiction.
- Calendar date or phase.
- Source citation.
- Relationship type.
- Publication reference.
- Future semantic fields.

Search indexes should be generated artifacts. Authors should not hand-maintain duplicate search strings when the strings can be derived from object fields, citations, aliases, relationships, and publication metadata.

## Migration Strategy

### Phase 0: Inventory Lock

Keep this report as the baseline inventory. Do not start by moving content.

Deliverables:

- Current asset map.
- Known duplication list.
- Current readiness classification.
- Initial taxonomy and schema.

### Phase 1: Source Identity

Promote existing source registry concepts into a common source-document shape.

Start with:

- PAD source registry.
- Legal reference anchors.
- IAAO standards/glossary source metadata.
- Article source/resource references.
- Research source captures that are still needed.

Do not download or scrape new documents in this phase.

### Phase 2: Object Identity

Add stable ids to existing normalized assets without changing public behavior.

Good first candidates:

- IAAO glossary entries.
- Legal anchors.
- PAD main calendar duties.
- Article reference arrays.
- PAD forms.

### Phase 3: Relationship Mapping

Create relationships between existing objects:

- Glossary terms `see_also` glossary terms.
- Statutes `related_calendar_event` deadlines.
- Forms `uses_form` procedures/deadlines.
- Articles `appears_in_publication` statutes, glossary terms, forms, and source documents.
- IAAO standards `explains` ratio metrics.
- Metric facts `cites_source_observation` ledger rows.

### Phase 4: Generated Search Index

Generate a static search index from knowledge objects and publication metadata.

The article roll should continue to use `data/app/articles.json` until publication metadata is either generated from or synchronized with the knowledge platform.

### Phase 5: Presentation Feeds

Generate app-ready feeds:

- Article resources.
- Glossary pages/tooltips.
- Calendar views.
- Legal reference panels.
- Internal review queues.
- Future county procedure pages.

### Phase 6: SQL Migration

Move SQL-shaped JSON rows into relational tables when product needs justify it.

The migration should be straightforward if object rows, relationships, citations, permissions, and search entries remain separate now.

## Future Ingestion Workflow

Future documents may be PDFs, Google Docs, Word files, Markdown, HTML, scanned documents, research papers, legislation, meeting minutes, policy manuals, or county documents.

The workflow should be:

```text
1. Register source document.
2. Preserve raw file or canonical URL.
3. Extract candidate text, table rows, metrics, dates, citations, and definitions.
4. Store source observations with confidence and extraction method.
5. Create or update candidate knowledge objects.
6. Attach citations and source anchors.
7. Add relationship rows.
8. Human-review legal/procedural/citation-sensitive records.
9. Generate search index entries.
10. Generate app-ready presentation feeds.
```

Rules:

- Never let document headings dictate object types.
- Never overwrite existing values silently.
- Preserve source value and normalized value separately when units differ.
- Record extraction method and confidence.
- Prefer source registry ids over repeated URLs.
- Keep public and internal visibility separate from object type.

## Style Bible

### Knowledge Philosophy

Knowledge is reusable and independent of its original container. The same statute can support a calendar deadline, article resource, protest guide, FAQ answer, and internal procedure without being duplicated.

### Source-Of-Truth Philosophy

Source documents prove where something came from. Knowledge objects describe what GES knows. Presentation feeds describe how GES shows that knowledge. These are different responsibilities.

### Normalization Philosophy

Normalize aggressively at identity and relationship boundaries:

- One object id per concept, rule, deadline, statute, form, definition, or publication.
- Many aliases per object.
- Many citations per object.
- Many relationships per object.
- Many presentation bindings per object.

Do not normalize prose into unreadability. Long explanatory body text can stay in `body`, but authority, dates, visibility, citations, categories, tags, and relationships should be structured.

### Migration Philosophy

Migration should enrich existing GPR assets. It should not rebuild usable calendars, glossaries, standards, or source ledgers. Every migration phase should preserve public behavior until a generated feed replaces an app-ready file.

### SQL Compatibility

Avoid nested arrays for data that will need joins, filtering, or permissions. Arrays are acceptable in small static manifests during transition, but platform-ready exports should flatten aliases, tags, categories, citations, relationships, source links, and search entries into separate row sets.

### Future AI Compatibility

Prepare for embeddings, RAG, semantic search, and context windows, but do not build them now. The best AI preparation is boring: stable object ids, clean citations, source confidence, clear visibility, relationship rows, and concise summaries.

### Search Philosophy

Search should feel alive because objects are well described and well related, not because the UI guesses. Typeahead should combine titles, aliases, keywords, citations, categories, tags, excerpts, and relationship labels.

### Public Workflow

Public knowledge must be:

- Published or verified.
- Publicly visible.
- Source-backed when legal, procedural, statistical, or deadline-sensitive.
- Rendered from generated presentation feeds or current app-ready JSON.

### Internal Workflow

Internal knowledge may be:

- Draft.
- Review-needed.
- Restricted.
- Citation-incomplete.
- Linked to correction queues, source mismatches, or future publish queues.

Internal views should show status and review reasons. Public views should never expose draft or restricted records.

## Assets To Reuse First

1. PAD source registry as `source_documents`.
2. PAD metric ledger as `source_observations`.
3. IAAO glossary as `definition` and `glossary_term` objects.
4. PAD main calendar as `deadline`, `calendar_event`, and `procedure` objects.
5. Legal references as initial `statute` objects.
6. Article manifest as `publication` metadata.
7. Real property forms as `form_resource` objects.
8. Statewide/county PAD data as metric facts linked to source observations.
9. Site copy/resource FAQs as candidate `faq_entry` objects only where the answer is stable and reusable.

## Assets Needing Normalization

- IAAO glossary entries need ids, source anchors, source version, citation fields, and relationship rows.
- IAAO standards need ids, authority/source citations, property-class context, and rule relationships.
- PAD main calendar events need stable platform ids, recurrence normalization, deadline/procedure split, and authority object references.
- Legal references need full object rows and canonical citation metadata.
- Article references need object ids instead of display strings.
- County metric files need consistent source-document ids and fact-row shapes.
- Tax district authority files need authority ids and relationships to counties, districts, levies, and tax years.
- MIPS record cards need a future split between raw source, normalized facts, and app-ready guided snapshots.

## Assets Needing Citation Work

- Article references to Title 350, IAAO guidance, and constitutional/statutory provisions.
- Calendar events whose source notes say 2026 verification is pending.
- IAAO glossary terms where page, section, or source-version anchors are not present.
- IAAO standards where range interpretation depends on context.
- County historical Gage mismatches identified in the PAD source provenance audit.
- Route FAQ answers that make procedural claims and should cite statutes, PAD guidance, forms, or internal policy before becoming public knowledge objects.

## Technical Debt

- The platform has the `source -> normalized -> app-ready` principle documented, but current files still mix those responsibilities in places.
- Article body modules still carry resource/legal metadata that should eventually point to canonical object ids.
- The public app imports app-ready data directly, which is fine now, but normalized rows and generated feeds are not yet formalized.
- Some source labels and citation strings are still assembled in render/chart code.
- The property manifest and record-card count should be reconciled.
- `.DS_Store` files are present in tracked data/research paths.
- Static JSON naming is inconsistent because older app-ready files predate the PAD registry/ledger conventions.

## Validation Against Task Requirements

| Requirement | Result |
| --- | --- |
| Audit existing assets before designing new structures | Complete; this report is based on current data, docs, article, source, standards, calendar, research, and script assets |
| Do not duplicate existing GPR knowledge | The architecture reuses current source registry, metric ledger, calendars, glossary, standards, article manifest, forms, and app-ready data |
| Treat GPR as source corpus | Confirmed; GES becomes normalization and relationship layer on top of GPR assets |
| Design reusable knowledge objects | Taxonomy and normalized object schema documented |
| Support relationships | Relationship vocabulary and row strategy documented |
| Keep document structure separate from knowledge structure | Responsibility layers and ingestion workflow documented |
| Integrate with search architecture | Lightweight generated search entry shape documented |
| Prepare for public/internal permissions | Visibility and status fields documented |
| Prepare for SQL | Table map and normalization rules documented |
| Prepare for future AI without implementing AI | Optional future AI fields documented |
| Produce migration strategy | Six-phase migration strategy documented |
| Produce ingestion workflow | Source-to-presentation workflow documented |
| Produce style bible | Knowledge Platform style bible documented |

## Recommendations

1. Do not create a new `knowledge/` data directory until object ids and source identity rules are accepted.
2. Start migration with stable ids for IAAO glossary, legal references, PAD main calendar events, and article references.
3. Generate a small `knowledge_search_entries` prototype from those assets before touching property record data.
4. Keep article publishing on `data/app/articles.json` until publication metadata can be generated or synchronized safely.
5. Treat PAD source registry and metric ledger as the platform's provenance backbone.
6. Keep property record normalization as a later migration because it has the largest blast radius.
7. Resolve the property manifest vs record-card count mismatch before using the property corpus as a platform-wide fixture index.
8. Build internal review queues from existing `verificationStatus`, `needsManualReview`, `confidence`, and `mismatchSummary` fields before adding new workflow concepts.
