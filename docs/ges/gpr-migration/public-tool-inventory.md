# GPR Public Tool Inventory

Status: planning inventory  
Date: 2026-06-28

This inventory identifies reusable utilities currently embedded in GPR or adjacent experiment routes. These should not remain buried inside one parcel walkthrough if they answer general public questions.

## Public Tool Candidates

| Tool candidate | Current location | Current responsibility | Recommended future | Public tool type | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Tax statement shorthand calculator | `src/render.js`, `src/routes/tax-shorthand-experiment.js` | Shows assessed value, levy, gross tax, credits, and net tax math | Standalone calculator plus GPR embed | Public calculator | MOVE TO PUBLIC TOOL | Needs generic inputs and source/caveat language. |
| Levy distribution explorer | `src/render.js`, `src/views/tax-district-authorities.js` | Shows levy components and shares for selected parcel tax district | Standalone tax district/levy explorer | Public explorer | MOVE TO PUBLIC TOOL | GPR keeps compact latest district summary. |
| Tax district authority visualization | `src/views/tax-district-authorities.js` | Summarizes district, authorities, total levy, largest authority | Public tax district lookup | Public explorer | MOVE TO PUBLIC TOOL | Needs `tax_authority` knowledge objects. |
| Equalization metric explainer | `src/charts.js`, `src/render.js`, `src/metric-signals.js` | Explains COD, PRD, COV, LOV and bands | Article-embedded explainer or public tool | Article-embedded tool | MOVE TO PUBLIC TOOL | Needs IAAO/PAD citations and legal review. |
| Assessment accuracy chart | `src/charts.js` | Normalizes assessment metrics into comparable bands | Public equalization metric viewer | Public explorer | MOVE TO PUBLIC TOOL | Should not imply parcel-specific correctness. |
| County comparison CTL explorer | `index.html`, `src/charts.js` | Compares Gage County to selected counties | Standalone statewide CTL explorer | Public data explorer | MOVE TO PUBLIC TOOL | Needs source registry and date policy. |
| Statewide value/tax/rate indexed charts | `src/charts.js` | Shows county/state CTL movement | Public CTL trend viewer | Public data explorer | MOVE TO PUBLIC TOOL | Article can embed snapshots. |
| Assessment timeline/deadline viewer | `src/assessment-dates.js`, `data/app/assessment-calendar-events.json` | Shows important dates and taxpayer action dates | Public calendar/resource finder | Public tool | MOVE TO PUBLIC TOOL | Source should be Knowledge Platform deadlines. |
| Resource/form finder | `site-copy.json`, `real-property-forms.json`, footer resources | Lists forms and route resources | Public resource finder | Public utility | MOVE TO PUBLIC TOOL | Could be part of Knowledge search. |
| Market area explainer | `src/charts.js`, market area panel | Shows local group movement and sample statistics | Article embed only unless policy approves full tool | Article-embedded tool | HUMAN REVIEW | Public release risks overinterpretation. |
| Comparable walkthrough | `src/routes/comparison-experiment.js` | Explains comparison/equalization through example properties | Internal by default; article screenshots possible | Internal tool or article support | MOVE TO INTERNAL WORKSPACE | Do not expose scoring as public decision aid without review. |

## Tool Extraction Rules

Before a public tool is extracted:

1. Define the question the tool answers.
2. Define inputs and outputs.
3. Define source objects and citation display.
4. Define public caveats.
5. Define whether the tool can be embedded in articles.
6. Define whether GPR consumes the same tool in compact form.
7. Add accessibility and print expectations.
8. Add manual test scenarios.

## Recommended Standalone Tool Routes

Candidate permanent routes:

| Route | Tool |
| --- | --- |
| `/tools/property-tax-calculator/` | Tax statement shorthand calculator |
| `/tools/tax-district-explorer/` | Levy and tax district explorer |
| `/tools/equalization-metrics/` | COD/PRD/COV/LOV explainer |
| `/tools/county-ctl-comparison/` | County CTL comparison |
| `/resources/calendar/` | Assessment timeline and deadlines |
| `/resources/forms/` | Forms and filing resources |

Route names are planning placeholders only.

## Public Tool Success Criteria

- Tool logic is not duplicated between articles and GPR.
- GPR embeds or links to compact tool outputs.
- Public tools use Knowledge Platform citations.
- Public tools avoid giving legal, valuation, or protest advice.
- Each tool has clear empty/error/source-freshness states.
- Each tool can be indexed by future search.

