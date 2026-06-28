# GPR Content Migration Inventory

Status: planning inventory  
Date: 2026-06-28

This inventory identifies significant instructional copy that should move out of Guided Parcel Review and into GES Articles, Knowledge Platform objects, Resources Blocks, or Public Tools.

Complexity scale:

- Low: mostly copy extraction and light editing.
- Medium: needs diagrams, citations, or reusable resources.
- High: needs legal/policy review, data visualization, or multiple knowledge objects.

## Article Handoff Inventory

| Current location | Suggested destination | Reason for moving | Future article title | Priority | Complexity | Suggested visualizations | Resources Block candidates | Related glossary entries | Related statutes | Related knowledge objects |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `index.html` guided intro and `site-copy.json` start/direct-start text | GES Article plus GPR intro rewrite | Current app intro teaches the whole civic path before the user starts | How Guided Parcel Review Fits Into Assessment Review | Medium | Low | GPR as workspace diagram | About GES, FAQ, parcel search help | parcel, assessment, public record | None direct | publication, faq_entry |
| Property Record transition and handoff copy | Article | Explains why record facts matter generally | How to Read Your Property Record Before Questioning Value | High | Medium | Record-card checklist, field map | County property search, correction form, FAQ | parcel ID, situs, legal description, quality, condition, improvement | Procedure statutes may be linked after review | definition, procedure, form_resource |
| Quality, condition, dwelling, land, improvement help copy | Knowledge Platform with article support | Field meanings are reusable definitions, not GPR-only text | What Property Record Fields Mean | High | Medium | Annotated record card | Glossary, record correction packet | quality, condition, dwelling, land, outbuilding, depreciation | None direct | glossary_term, definition |
| Record correction modal intro and category explanations | Knowledge procedure plus article | The process should be reusable outside one parcel | Preparing for a Property Record Correction Conversation | High | Medium | Conversation checklist, correction packet flow | Correction PDF, assessor contact, public forms | record correction, factual review, property characteristic | Needs procedure citation review | procedure, form_resource, faq_entry |
| What Changed route question/description/handoff | Article | General concept of value movement belongs in education layer | Why Your Assessed Value Changed | High | Medium | Prior/current value waterfall | Property record article, market area article | assessed value, market value, improvement value, land value | Neb. Rev. Stat. 77-112, 77-201, 77-1301 as applicable after citation review | definition, statute, procedure |
| Assessment notice summary explanatory copy | Article and Knowledge | General notice interpretation can help all readers | How to Read a Valuation Notice | Medium | Medium | Valuation notice breakdown | PAD forms, protest guide, calendar | valuation notice, assessment date, land value, improvement value | Notice/protest statutes after review | procedure, deadline, form_resource |
| Value/tax history explanatory copy | Article | Teaches why value and taxes do not move together | Why Assessed Value and Property Taxes Do Not Move Together | High | Medium | Value line vs tax line chart | Tax calculator, levy explorer, FAQ | assessed value, net tax, gross tax, effective tax rate | Tax levy statutes after review | formula, calculation, faq_entry |
| Tax Context transition and equation explanation | Article plus Public Tool | General tax-bill math is reusable | How Assessed Value Becomes a Property Tax Bill | High | Medium | Assessed value x levy = gross tax - credits = net tax | Tax shorthand calculator, tax district explorer | levy, gross tax, credit, net tax, tax district | Taxing authority and levy statutes after review | formula, calculation, definition |
| Tax district authority and levy-distribution copy | Public Tool plus Knowledge | Full levy exploration is not specific to one parcel | How Tax Districts and Levies Shape a Tax Bill | High | High | Levy share treemap, authority table | Tax district explorer, CTL source | tax district, taxing authority, levy, school district | Needs levy authority citation review | tax_authority, source_document, metric_fact |
| Tax bill pattern/equalization pressure explanation | Article | Teaches broader tax-base interaction | Why a Lower Levy Does Not Always Mean a Lower Bill | Medium | Medium | Tax base/levy/net bill scenario chart | CTL explorer, levy article | levy, tax base, net tax, tax credit | Needs citation review | formula, research_finding |
| Market Area transition and sample group explanation | Article or internal guidance | General valuation group explanation should not live in parcel workflow | What a Valuation Group Can and Cannot Tell You | High | High | Valuation group sample chart, peer-context diagram | Market article, comparable review article | valuation group, market area, qualified sale, median ratio | None direct unless tied to equalization statutes | county_context, metric_fact, source_document |
| Local market quick-read caveats | Knowledge plus article | Needs careful public-safe wording | Using Local Market Context Without Overreading It | High | High | One sale vs group evidence diagram | Protest guide, valuation group article | qualified sale, sale ratio, market evidence | Protest/equalization citation review | policy, faq_entry, research_finding |
| County Equalization intro | Article | Broad abstract/sales-study teaching is not transaction-specific | Nebraska Equalization in Plain Language | High | High | Equalization process timeline | PAD Reports and Opinions, IAAO standards | equalization, assessment abstract, qualified sale | Neb. Rev. Stat. 77-5023, 77-5027 | statute, standard, procedure, source_document |
| COD/PRD/COV/LOV metric explanations | Article plus Knowledge | Definitions and standards are reusable objects | Understanding COD, PRD, COV, and Level of Value | High | High | Metric cards, band chart, worked examples | IAAO standards, PAD R&O | COD, PRD, COV, level of value, median ratio | 77-5023, 77-5027 | standard, assessment_rule, definition |
| Assessment accuracy unified chart explanation | Public Tool | Interactive metric exploration belongs outside parcel workflow | Equalization Metrics Explorer | Medium | High | Normalized metric band chart | PAD R&O source registry, IAAO standards | COD, PRD, COV, LOV | 77-5023, 77-5027 | metric_fact, standard, source_document |
| State Context route copy | Article/Public Tool | Countywide comparison is broad civic context | How Countywide CTL Trends Provide Context | Medium | High | County/state CTL comparison chart | CTL data source, county comparison tool | CTL, taxable value, average rate, countywide tax | Citation review needed | metric_fact, source_document, research_finding |
| Compare Counties explanatory copy | Public Tool | This is a reusable statewide explorer | Nebraska County CTL Comparison Explorer | Medium | High | County selector, indexed value/tax/rate charts | CTL source, source notes | CTL, average levy/rate, tax base | Citation review needed | metric_fact, source_document |
| Review Signals transition and explanation | Article plus policy knowledge | Signals need clear limits and governance | What Review Signals Mean and What They Do Not Mean | High | High | Signal provenance diagram | GPR, correction packet, FAQ | review signal, threshold, source freshness | None direct unless tied to official process | policy, procedure, faq_entry |
| Final Summary explanatory text | GPR microcopy plus article links | Summary should become action-oriented | What To Do After Reviewing Your Parcel | Medium | Medium | Decision path/checklist | Record correction, protest guide, assessor contact | correction, protest, BOE, appeal | Protest statutes after review | procedure, deadline, form_resource |
| Footer route FAQs | Knowledge FAQ objects | FAQs are reusable across articles, tools, and search | Multiple FAQ entries, not one article | High | Medium | None required | Resources Block by route | assessed value, market area, equalization, tax context | Varies | faq_entry |
| Important calendar dates modal | Knowledge Platform | Dates are authoritative reusable objects | Assessment Calendar and Taxpayer Deadlines | High | High | Calendar timeline | PAD calendar, taxpayer action dates | assessment date, protest window, BOE | Calendar statutes and PAD authority | deadline, calendar_event, procedure |
| Public page about/FAQ language that still says GPR walks through one property in a sequence | Article/public page copy refresh | Public positioning should reflect new GES/GPR split | About Guided Editorial System and Parcel Review | Medium | Low | None required | About, FAQ, article roll | GES, GPR | None direct | publication, faq_entry |

## Copy Sources To Preserve Before Extraction

| Source | Treatment |
| --- | --- |
| `data/app/site-copy.json` | Primary presentation-copy source for current GPR. Extract teaching copy into article drafts and knowledge object backlog. |
| `src/content/route-resources.js` | Duplicative fallback FAQ/form copy. Use to cross-check `site-copy.json`; do not make it canonical. |
| `index.html` static panel prose | Legacy embedded educational copy. Extract into article handoff before simplifying panels. |
| `src/render.js` generated narrative templates | Some copy is tied to calculations. Extract only after tests or visual parity checks exist. |
| `src/charts.js` chart helper text | Many metric definitions and interpretation labels should become knowledge-backed copy. |
| `src/reports/property-report.js` report transitions | Remove from future report after article replacements exist. |
| `src/assessment-dates.js` date explainer copy | Convert to Knowledge Platform calendar/procedure objects. |

## Resources Block Candidates

Common Resources Block entries for article replacements:

- Related GPR parcel workspace link.
- Property record correction packet.
- County assessor property search.
- PAD Reports and Opinions.
- IAAO Standard on Ratio Studies.
- Nebraska assessment calendar.
- Real property valuation protest form.
- Glossary terms.
- Relevant statutes.
- Public tax calculator.
- Tax district explorer.
- County CTL explorer.
- Protest preparation guide.

## Migration Requirements

Before educational copy is removed from GPR:

1. Destination article or knowledge object exists.
2. GPR has a contextual link to the destination.
3. Resources Block entries are defined.
4. Citation needs are marked.
5. Human review is complete for legal/procedural text.
6. Public/private boundaries are confirmed.

