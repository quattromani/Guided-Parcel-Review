# Guided Parcel Review Migration Plan

Status: master implementation blueprint  
Date: 2026-06-28  
Scope: planning only; no functional migration in this task

## Executive Summary

Guided Parcel Review currently combines a taxpayer tutorial, parcel workspace, assessment data explorer, reporting surface, article precursor, and internal assessor diagnostic prototype. That was useful during prototyping. It is now too broad for the GES architecture.

The permanent GPR application should become a focused parcel-review workspace. It should help a taxpayer and assessor look at one parcel, confirm the record, understand value and tax movement, capture questions, and produce a concise report or correction packet.

Long-form education moves to GES Articles. Authoritative definitions, statutes, standards, dates, forms, source records, and procedures move to the Knowledge Platform. Reusable calculators and explainers move to Public Tools. Professional diagnostics move to the Internal Workspace. Report generation moves to the Reporting Engine.

## Future Product Definition

GPR should answer:

```text
What do we know about this parcel, what should be checked, and what should the taxpayer take away from the conversation?
```

It should not answer every broad civic education question inline.

## Target Responsibilities

| Responsibility | Future owner | Notes |
| --- | --- | --- |
| Parcel selection and confirmation | GPR | Production version should use stable parcel lookup and source freshness. |
| Property record verification | GPR | Core workflow. Keep as structured review cards and flags. |
| Taxpayer issue capture | GPR | Needs durable persistence and delivery model beyond localStorage. |
| Parcel value and tax movement | GPR | Keep concise charts and tables. |
| Local context summary | GPR | Keep only parcel-relevant context with caveats. |
| Tax district summary | GPR | Keep latest parcel-level summary; full explorer moves to tools. |
| Review signal presentation | GPR with governance | Keep only neutral prompts after policy review. |
| Conversation summary | Reporting Engine | GPR triggers it; Reporting Engine owns generation. |
| Record correction packet | Reporting Engine | Current implementation can seed future packet contract. |
| Tax/equalization education | GES Articles | GPR links to article replacements. |
| Glossary/statutes/standards/source references | Knowledge Platform | Articles and GPR reference object ids. |
| Reusable calculators/explainers | Public Tools | Public tools may be article-embedded. |
| Cohort diagnostics and assessor analysis | Internal Workspace | Authentication boundary required. |

## Migration Matrix

| Current GPR area | Status | Future home | Blocking dependency |
| --- | --- | --- | --- |
| Guided seven-step navigation | KEEP | GPR, simplified | Replacement task flow |
| Start/direct-start orientation | HUMAN REVIEW | GPR plus Articles | Production data/search policy |
| Parcel switcher/typeahead | KEEP | GPR | Parcel lookup contract |
| Property context bar | KEEP | GPR | None |
| Header value/photo/sketch actions | KEEP | GPR | Media/source freshness policy |
| Property details worksheet | KEEP | GPR | Field taxonomy and flag persistence |
| Quality/condition help copy | MOVE TO KNOWLEDGE | Knowledge Platform | Glossary definitions |
| Review flags | KEEP | GPR | Durable storage and report binding |
| Record correction modal | MOVE TO REPORTING ENGINE | Reporting Engine plus GPR trigger | Report packet contract |
| What Changed panel | KEEP | GPR | Short-copy pass after article replacement |
| Value/tax indexed chart | KEEP | GPR | Chart copy extraction |
| Local market/valuation group trend | HUMAN REVIEW | GPR compact summary or Internal Workspace | Public-safe policy |
| Equalization metric cards/charts | MOVE TO ARTICLES | Articles plus Knowledge | Article and knowledge object availability |
| County/state CTL charts | MOVE TO PUBLIC TOOL | Public Tools | Tool route and data-source contract |
| Tax history/table/equation | KEEP | GPR | Reporting Engine parity |
| Levy distribution/authority table | MOVE TO PUBLIC TOOL | Public Tool plus GPR summary | Tax authority object model |
| Review Signals panel | HUMAN REVIEW | GPR and Internal Workspace | Governance thresholds |
| Final Summary panel | KEEP | GPR | Reporting Engine integration |
| Guided Review Summary PDF | MOVE TO REPORTING ENGINE | Reporting Engine | Report schema |
| Supplemental assessor report | MOVE TO INTERNAL WORKSPACE | Internal Workspace and Reporting Engine | Authentication/report boundary |
| Footer FAQs/forms/dates | MOVE TO KNOWLEDGE | Knowledge Platform and Resources Block | Knowledge object ids |
| Source table modal | MOVE TO INTERNAL WORKSPACE | Internal Workspace | Source provenance model |
| Tax shorthand experiment | MOVE TO PUBLIC TOOL | Public Tools | Decide calculator scope |
| Comparable search experiments | MOVE TO INTERNAL WORKSPACE | Internal Workspace | Assessor workflow policy |

## Future GPR Application Structure

Recommended task flow:

1. Select or open parcel.
2. Confirm parcel identity and source freshness.
3. Review property record.
4. Flag possible record issues.
5. Review valuation movement.
6. Review tax movement.
7. Review compact local/equalization context.
8. Capture taxpayer-specific takeaways and questions.
9. Generate conversation summary and correction packet if needed.
10. Provide QR-linked digital copy and related resources.

The page should become shorter, more visual, and more task-oriented. The main surface should feel like a workspace, not a course.

## Design Implications

| Dimension | Current state | Future direction |
| --- | --- | --- |
| Page length | Long instructional path with multiple broad context sections | Shorter task workspace with progressive detail |
| Component hierarchy | Route panels mix data, education, tools, reports | Parcel workflow owns data; Resources Block links education |
| Public navigation | App and article routes share runtime concerns | Public Layout owns articles/tools; GPR owns parcel workspace |
| Internal navigation | Internal utilities are adjacent to public app | Internal Workspace owns assessor tools |
| Article strategy | GPR contains many article candidates | Articles absorb conceptual explanation |
| PDF strategy | PDF mirrors old course sequence | Report becomes conversation record |
| QR strategy | Not yet a first-class report feature | QR links to public-safe parcel summary and resources |
| Search strategy | Local route/search behavior is app-shaped | Search indexes articles, knowledge objects, tools, and parcel resources separately |
| Knowledge strategy | Citations and definitions are scattered | Knowledge Platform owns authoritative reusable objects |
| SQL/React migration | Current static app mixes concerns | Define contracts before rebuilding surfaces |

## Success Criteria

Migration is successful when:

- GPR functions as a parcel-specific review workspace.
- Articles provide education that GPR links to instead of re-teaching inline.
- Knowledge provides authoritative references, terms, dates, forms, standards, and source objects.
- Public Tools provide reusable calculators and explainers.
- Reporting Engine generates polished conversation records and packets.
- Internal Workspace supports assessor workflows.
- Every responsibility has one clear home.
- Public users are not exposed to internal diagnostics.
- Reports are concise, source-aware, and QR-enabled.
- No removed educational content is lost; it is either migrated, linked, archived, or intentionally retired after review.

## Non-Goals For This Plan

- No code movement.
- No content deletion.
- No route changes.
- No PDF rewrite.
- No React rebuild.
- No SQL implementation.
- No source data reshaping.
- No behavior change.

