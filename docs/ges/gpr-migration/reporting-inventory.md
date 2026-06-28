# GPR Reporting Inventory

Status: planning inventory  
Date: 2026-06-28

The future Reporting Engine should own PDF generation, printable summaries, correction request packets, conversation summaries, assessor reports, board reports, and QR-enabled reports.

Current GPR should become a report consumer and workflow trigger, not the long-term report renderer.

## Current Reporting Responsibilities

| Current responsibility | Current location | Current behavior | Future owner | Status |
| --- | --- | --- | --- | --- |
| Guided review summary PDF | `src/reports/property-report.js` | Browser-generated PDF using current parcel data and course-like journey pages | Reporting Engine | MOVE TO REPORTING ENGINE |
| PDF drawing primitives | `src/reports/pdf-report-kit.js` | Shared pdf-lib loader, pages, text, charts, tables, download helpers | Reporting Engine | MOVE TO REPORTING ENGINE |
| Property report data model | `src/reports/property-report.js` | Builds identity, characteristics, value, market, tax, metrics, signals, history | Reporting Engine schema | MOVE TO REPORTING ENGINE |
| Record correction request packet | `src/recordCorrectionRequest.js` | Generates property record correction PDF from form data | Reporting Engine packet type | MOVE TO REPORTING ENGINE |
| Correction email payload | `src/recordCorrectionRequest.js` and `src/render.js` | Creates attachment metadata and mail-like payload | Reporting Engine or delivery service | HUMAN REVIEW |
| Correction PDF download fallback | `src/render.js` | Downloads generated correction PDF when delivery is not configured | Reporting Engine plus GPR fallback | MOVE TO REPORTING ENGINE |
| Supplemental assessor report | `src/assessors-report.js` | Generates internal-style property review report with cost, equalization, tax, and signal sections | Internal Workspace plus Reporting Engine | MOVE TO INTERNAL WORKSPACE |
| Report error modal shell | `index.html`, `src/render.js` | Modal frame for record correction form | GPR trigger; Reporting Engine packet generation | MOVE TO REPORTING ENGINE |
| Final summary download action | `src/routes/landing-primer.js` | Adds report download behavior to final summary panel | GPR report trigger | KEEP |
| Report file naming | `propertyReportFilename`, `assessorsReportFilename`, correction filename | Creates parcel-id based filenames | Reporting Engine naming policy | MOVE TO REPORTING ENGINE |
| Source/citation footers | Report modules | Writes source lists in PDF footer/body | Knowledge-backed citation layer | MOVE TO KNOWLEDGE |

## Report Types To Define

| Future report type | Audience | Trigger | Contents | QR | Owner |
| --- | --- | --- | --- | --- | --- |
| Parcel conversation summary | Public taxpayer and assessor | GPR final summary | Parcel identity, reviewed fields, flags, value/tax movement, questions, resources | Yes | Reporting Engine |
| Property record correction packet | Public taxpayer and assessor | GPR record correction form | Parcel identity, correction categories, narrative, contact preference, assessor routing | Optional | Reporting Engine |
| Public parcel summary | Public | Shared URL/QR | Public-safe parcel facts, value/tax summary, source freshness, related resources | Yes | Reporting Engine and GPR |
| Assessor supplemental review report | Internal assessor | Internal Workspace | Record fields, cost model, equalization context, tax context, review signals, working conclusion | Optional/internal | Reporting Engine |
| Board packet | Internal/board workflow | Internal Workspace | Exhibits, parcel summary, taxpayer claims, assessor response, source attachments | Optional/internal | Reporting Engine |
| Printable resource handout | Public | Article/Public Tool | Article summary, glossary links, official resources | Yes | Reporting Engine or Article publishing |

## Current Guided Review Summary PDF Assessment

Current strengths:

- Already has a coherent parcel identity model.
- Captures property record, value movement, local context, tax context, and review signals.
- Uses reusable PDF primitives.
- Produces a portable artifact without a server.

Current issues:

- Mirrors the old seven-step teaching journey.
- Prints broad education that should move to articles.
- Does not clearly distinguish public record facts from taxpayer notes.
- Does not include a QR-linked digital copy.
- Does not use canonical Knowledge Platform object ids for citations.
- Uses browser-side report generation as application logic.

Future report should keep:

- Parcel identity.
- Address, owner/public record fields, parcel id, class, tax district.
- Property record fields reviewed.
- Flagged fields and taxpayer notes.
- Prior/current value movement.
- Tax history and latest statement shorthand.
- Compact local/equalization context.
- Source freshness and generated date.
- Related resource links.

Future report should remove or link instead:

- Long equalization explanations.
- Long tax/levy education.
- Countywide CTL teaching charts.
- Course transition text.
- Legal/procedural explanations better owned by articles or knowledge objects.

## Current Record Correction Packet Assessment

Current strengths:

- Already transactional.
- Separates sender, parcel summary, selected categories, narrative, acknowledgement, and assessor routing.
- Can become a strong Reporting Engine packet type.

Future changes:

- Define a stable correction packet schema.
- Bind selected review flags into packet categories.
- Decide whether delivery is download-only, email, workflow queue, or all three.
- Remove mock submission behavior from public success state.
- Add source/date statement.
- Add QR to public-safe parcel summary if approved.

## Current Supplemental Assessor Report Assessment

Current strengths:

- More professionally diagnostic than public GPR.
- Includes data-quality scan, cost-model evidence, equalization alignment, tax context, and working conclusion.
- Good seed for future assessor report and board packet.

Future placement:

- Launch from Internal Workspace.
- Generate through Reporting Engine.
- Use authenticated permission boundary.
- Pull citations from Knowledge Platform.
- Keep cost model, signal thresholds, and working conclusions out of default public GPR.

## Reporting Engine Dependencies

Reporting Engine should not be implemented until these contracts exist:

1. Parcel summary schema.
2. Review flag schema.
3. Correction packet schema.
4. Report citation/source schema.
5. QR/public-summary privacy policy.
6. Public/internal audience rules.
7. Report type registry.
8. Asset/media attachment policy.

## Report Migration Success Criteria

- GPR triggers reports but does not own report rendering logic.
- Reports use one canonical report schema per report type.
- Public reports are concise and action-oriented.
- Teaching content is linked, not printed.
- Generated PDFs include source freshness, generated date, and resource links.
- QR codes resolve to public-safe digital copies or resource bundles.
- Internal reports are inaccessible from public GPR.

