# GPR Knowledge Inventory

Status: planning inventory  
Date: 2026-06-28

The Knowledge Platform should own reusable definitions, statutes, standards, procedures, deadlines, source records, forms, formulas, calculations, and FAQs.

GPR should reference these objects. It should not be the authoritative source for them.

## Knowledge Object Inventory

| Object type | Suggested title | Current source location | Relationships | Citation needs | Cross references | Public/Internal | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| glossary_term | Parcel ID | Property record worksheet | parcel, property record, source record | County/vendor source definition | Property Record article | Public | MOVE TO KNOWLEDGE |
| glossary_term | Situs Address | Property record worksheet | parcel, address, record confirmation | County/vendor source definition | Property Record article | Public | MOVE TO KNOWLEDGE |
| glossary_term | Legal Description | Property record worksheet | parcel, deed/land record | County/vendor/legal source | Property Record article | Public | MOVE TO KNOWLEDGE |
| glossary_term | Assessed Value | Value panels, articles | valuation notice, market value, tax calculation | Statutory definition review | Value Changed article | Public | MOVE TO KNOWLEDGE |
| glossary_term | Market Value | Value/equalization copy | assessed value, sale evidence | Nebraska statutory citation | Protest guide, valuation article | Public | MOVE TO KNOWLEDGE |
| glossary_term | Taxable Value | Tax panels | assessed value, exemptions, levy | Citation review | Tax bill article | Public | MOVE TO KNOWLEDGE |
| glossary_term | Gross Tax | Tax equation | levy, assessed value, credits | Source/formula citation | Tax calculator | Public | MOVE TO KNOWLEDGE |
| glossary_term | Net Tax | Tax history | gross tax, credits, amount due | Tax statement source | Tax calculator | Public | MOVE TO KNOWLEDGE |
| glossary_term | Effective Tax Rate | Value/tax history | net tax, assessed value | Formula citation | Tax context article | Public | MOVE TO KNOWLEDGE |
| glossary_term | Levy | Tax equation, levy tables | taxing authority, tax district | Statutory/process citation | Tax district explorer | Public | MOVE TO KNOWLEDGE |
| glossary_term | Tax District | Property record and tax authority views | taxing authority, parcel, levy | County tax authority source | Tax district explorer | Public | MOVE TO KNOWLEDGE |
| glossary_term | Taxing Authority | Levy distribution | levy component, school district | County/CTL source | Tax district explorer | Public | MOVE TO KNOWLEDGE |
| glossary_term | Valuation Group | Market area panel | market area, cohort, ratio study | County methodology source if available | Valuation group article | Public/Internal | MOVE TO KNOWLEDGE |
| glossary_term | Market Area | Market area panel | valuation group, qualified sale | County/PAD source | Valuation group article | Public/Internal | MOVE TO KNOWLEDGE |
| glossary_term | Qualified Sale | Equalization and market copy | ratio study, sale price, median ratio | PAD/IAAO citation | Equalization article | Public | MOVE TO KNOWLEDGE |
| glossary_term | Median Ratio | Equalization charts | level of value, sales ratio | IAAO/PAD citation | Equalization metrics tool | Public | MOVE TO KNOWLEDGE |
| glossary_term | COD | Equalization metrics | uniformity, ratio study | IAAO citation | Equalization metrics article | Public | MOVE TO KNOWLEDGE |
| glossary_term | PRD | Equalization metrics | vertical equity, ratio study | IAAO citation | Equalization metrics article | Public | MOVE TO KNOWLEDGE |
| glossary_term | COV | Equalization metrics | dispersion, ratio study | IAAO citation | Equalization metrics article | Public | MOVE TO KNOWLEDGE |
| glossary_term | Level of Value | Equalization metrics | assessment range, median ratio | Statute/PAD citation | Equalization article | Public | MOVE TO KNOWLEDGE |
| statute | Neb. Rev. Stat. 77-5023 | Equalization source note/legal anchors | assessment ranges, equalization rule | Full statutory citation and URL | Equalization article/tool | Public | MOVE TO KNOWLEDGE |
| statute | Neb. Rev. Stat. 77-5027 | Equalization source note/legal anchors | PAD reports/opinions | Full statutory citation and URL | Equalization article/tool | Public | MOVE TO KNOWLEDGE |
| statute | Protest filing statutes | Protest guide/date resources | protest period, BOE procedure | Full statutory citation and URL | Protest article, calendar | Public | MOVE TO KNOWLEDGE |
| standard | IAAO Standard on Ratio Studies | `data/standards/iaao-standards.json` | COD, PRD, COV, sample size | Standard title, edition, URL/page | Equalization metrics article | Public | MOVE TO KNOWLEDGE |
| source_document | PAD Reports and Opinions | PAD source registry and article refs | county, year, metric facts | Source URL, year, county, page refs | Equalization article/tool | Public | MOVE TO KNOWLEDGE |
| metric_fact | County ratio statistics | `data/statewide/pad-ratio-statistics-by-county.json` | source document, class, year, metric | PAD R&O citation | Equalization metrics tool | Public | MOVE TO KNOWLEDGE |
| metric_fact | CTL county/year facts | `data/statewide/*ctl*.json` | county, year, valuation, taxes, rate | CTL source citation | CTL explorer | Public | MOVE TO KNOWLEDGE |
| deadline | Assessment date | Calendar data and article resources | procedure, statute, audience | PAD/statute citation | Assessment calendar | Public | MOVE TO KNOWLEDGE |
| deadline | Valuation protest window | Calendar/taxpayer action dates | protest procedure, form | Statute/PAD citation | Protest guide | Public | MOVE TO KNOWLEDGE |
| calendar_event | BOE hearing/decision dates | Calendar data | procedure, audience | Citation review | Workspace calendar | Public/Internal | MOVE TO KNOWLEDGE |
| form_resource | Property valuation protest form | Real property forms/articles | protest procedure, deadline | Official form URL | Protest guide/resources | Public | MOVE TO KNOWLEDGE |
| form_resource | Record correction/contact request | GPR correction form | correction procedure, parcel review | County procedure review | GPR/report packet | Public | MOVE TO KNOWLEDGE |
| procedure | Property record correction | Correction modal/PDF | form, assessor contact, parcel facts | County policy review | Correction article | Public | MOVE TO KNOWLEDGE |
| procedure | Property valuation protest | Protest article/resources | form, deadline, BOE | Legal/procedure review | Protest guide/calendar | Public | MOVE TO KNOWLEDGE |
| formula | Property tax shorthand | Tax equation | assessed value, levy, credits, net tax | Formula/source note | Tax calculator | Public | MOVE TO KNOWLEDGE |
| formula | Effective tax rate | Value/tax history | net tax, assessed value | Formula/source note | Tax article | Public | MOVE TO KNOWLEDGE |
| faq_entry | Is assessed value the same as market value? | Footer resources/route resources | assessed value, market value | Citation review | Property record/value articles | Public | MOVE TO KNOWLEDGE |
| faq_entry | Can countywide measures prove my parcel value is wrong? | Footer resources | equalization, parcel evidence | Policy/legal review | Equalization article | Public | MOVE TO KNOWLEDGE |
| policy | Review signal thresholds | Review signal model/metric signals | signal, threshold, report, audience | Internal approval | GPR and assessor diagnostics | Internal | HUMAN REVIEW |
| source_document | Property record card source | MIPS record-card files | parcel facts, source extract | Vendor/source citation | GPR source freshness | Public/Internal | MOVE TO KNOWLEDGE |
| source_document | Tax statement source | Property/tax data | tax history, statement facts | County treasurer/source citation | Tax summary/report | Public/Internal | MOVE TO KNOWLEDGE |

## Relationship Model Needed For GPR

Minimum relationships:

```text
parcel_summary -> source_document
parcel_summary -> tax_authority
parcel_summary -> valuation_group
review_flag -> property_record_field
review_flag -> correction_packet
report -> parcel_summary
report -> source_document
report -> publication
article -> glossary_term
article -> statute
article -> source_document
public_tool -> formula
public_tool -> metric_fact
deadline -> statute
procedure -> form_resource
```

## Citation Requirements

Before GPR relies on knowledge objects in public UI:

1. Each statute has stable title, URL, jurisdiction, and review date.
2. Each standard has source name, edition/version where available, and URL or source note.
3. Each PAD source has year, county/class context, document URL, and metric page/table if available.
4. Each calendar/deadline object has authority and recurrence/update rules.
5. Each formula has field definitions and source/freshness notes.
6. Each public knowledge object has plain-language summary and exact citation.

## Knowledge Migration Success Criteria

- GPR uses object ids for definitions, resources, citations, dates, and procedures.
- Articles and tools reference the same objects.
- Search can index the objects independently from GPR.
- Source notes are not duplicated in chart/report/render modules.
- Public/internal visibility is declared per object.

