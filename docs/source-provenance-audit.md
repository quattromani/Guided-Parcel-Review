# Nebraska PAD Source Provenance Audit

Generated: 2026-05-14  
Scope: Nebraska Department of Revenue Property Assessment Division source registry, metric extraction ledger, and app-ready static JSON for Property Snapshot.

## Source Discovery Report

Official PAD pages used:

- Statewide Equalization: https://revenue.nebraska.gov/PAD/research-statistical-reports/statewide-equalization
- 2026 Reports and Opinions: https://revenue.nebraska.gov/PAD/2026-reports-and-opinions-property-tax-administrator
- Valuation, Taxes Levied, and Tax Rate Data: https://revenue.nebraska.gov/PAD/research-statistical-reports/valuation-taxes-levied-and-tax-rate-data
- Average Tax Rates by County: https://revenue.nebraska.gov/PAD/research-statistical-reports/average-tax-rates-county
- PAD Annual Reports: https://revenue.nebraska.gov/PAD/research-statistical-reports/annual-reports
- PAD Calendars: https://revenue.nebraska.gov/PAD/legal-information/pad-calendars
- PAD Forms: https://revenue.nebraska.gov/about/forms/pad-forms
- Consolidated Tax Districts and Rates: https://revenue.nebraska.gov/PAD/research-statistical-reports/consolidated-tax-districts-and-rates-county-reports

Created files:

- `data/sources/nebraska-pad-source-registry.json`
- `data/sources/nebraska-pad-metric-ledger.json`
- `data/statewide/statewide-ctl-summary.json`
- `data/statewide/county-ctl-comparisons.json`
- `data/statewide/pad-ratio-statistics-by-county.json`
- `data/statewide/county-assessment-ranges.json`

What was discovered and recorded:

- 93 official 2026 county Reports and Opinions PDFs.
- 93 official 2026 county valuation-history workbook links from the R&O index.
- 2019-2025 Gage County R&O PDFs needed to support existing historical Gage assessment-ratio context.
- 2019-2025 official PAD average-tax-rate PDFs used to verify CTL county comparisons.
- Current PAD valuation/taxes levied workbooks, including 2000-2025 average rates and 2024-2025 value/tax comparison workbooks.
- 2019-2025 PAD annual report full-book PDFs.
- 2025 PAD main assessment calendar.
- PAD forms and official index pages as HTML provenance anchors.

## Proposed JSON Schema

`nebraska-pad-source-registry.json`

- `schemaVersion`
- `generatedAt`
- `scope`
- `officialPublisher`
- `sourceFamilies`
- `sourceDocuments[]`
- `sourceDocuments[].documentId`
- `sourceDocuments[].title`
- `sourceDocuments[].year`
- `sourceDocuments[].sourceFamily`
- `sourceDocuments[].containsSourceFamilies`
- `sourceDocuments[].jurisdictionLevel`
- `sourceDocuments[].countyName`
- `sourceDocuments[].countyNumber`
- `sourceDocuments[].officialLandingPageUrl`
- `sourceDocuments[].directDocumentUrl`
- `sourceDocuments[].fileType`
- `sourceDocuments[].retrievedAt`
- `sourceDocuments[].verifiedAt`
- `sourceDocuments[].reportYear`
- `sourceDocuments[].taxYear`
- `sourceDocuments[].assessmentYear`
- `sourceDocuments[].statementYear`
- `sourceDocuments[].stableUrlConfidence`
- `sourceDocuments[].notes`
- `sourceDocuments[].needsManualReview`

`nebraska-pad-metric-ledger.json`

- `schemaVersion`
- `generatedAt`
- `scope`
- `metricCount`
- `metrics[]`
- `metrics[].metricId`
- `metrics[].metricName`
- `metrics[].sourceValue`
- `metrics[].value`
- `metrics[].normalizedValue`
- `metrics[].unit`
- `metrics[].year`
- `metrics[].yearType`
- `metrics[].jurisdictionLevel`
- `metrics[].countyName`
- `metrics[].countyNumber`
- `metrics[].propertyClass`
- `metrics[].sourceDocumentId`
- `metrics[].sourcePage`
- `metrics[].tableTitle`
- `metrics[].rowLabel`
- `metrics[].columnLabel`
- `metrics[].extractionMethod`
- `metrics[].confidence`
- `metrics[].verificationStatus`
- `metrics[].comparedAgainstProjectPath`
- `metrics[].existingProjectValue`
- `metrics[].difference`
- `metrics[].normalizationRule`
- `metrics[].notes`
- `mismatchSummary[]`

## Verification Results

Verified:

- `data/statewide/certified-taxes-levied.json` was checked against official PAD average-tax-rate PDFs for 2019-2025.
- All 651 county-year rows matched for:
  - total property value
  - total property taxes levied
  - average tax rate
- The ledger records 1,953 verified county CTL metric comparisons.
- Statewide CTL totals were extracted for 2019-2025 and written to `data/statewide/statewide-ctl-summary.json`.
- 2026 R&O county/class ratio rows were extracted from official county R&O PDFs where the PDF text layer was reliable.
- 279 of 279 county/class R&O `_____ALL_____` rows were extracted or manually verified into `data/statewide/pad-ratio-statistics-by-county.json`.
- Gage 2026 residential, commercial, and agricultural countywide ratio statistics were verified against the official 2026 Gage R&O PDF.

Could not be fully verified automatically:

- 14 of 279 2026 county/class R&O rows required manual review because the PDF text layer did not safely expose the all-row; all 14 are now manually verified in the ledger.
- The 2024 average-rate direct PDF is an official Nebraska DOR PDF and was verified by download, but it was not listed on the current average-tax-rate index page. It is marked `needsManualReview`.
- Some older Gage R&O direct PDFs were verified, but current older PAD index pages no longer expose every county link in discoverable HTML. These are marked with medium stable URL confidence.
- Detailed Gage valuation-group, sale-price-band, and market-area tables were not fully rebuilt. The new ledger verifies countywide and class-level stats, and leaves detailed table expansion for a later targeted pass.

2026 R&O county/class rows needing manual review:

None remain.

## Mismatches And Review Items

No CTL mismatches were found against the existing statewide county comparison JSON.

Gage County historical R&O review items:

- 2023 residential total sales price: official Gage R&O Commission Summary shows `119,085,281`; project value is `119,185,281`. This was not changed.
- 2024 residential total sales price: official Gage R&O Commission Summary shows `114,513,431`; project value is `114,513,341`. This was not changed.
- 2019 residential source ambiguity: the Gage Commission Summary shows 622 sales and median 94.96, while R&O Statistics all-row pages show 621 sales and median 95.03. The existing project value aligns with the Commission Summary. This needs an explicit source-choice decision before any correction.

Recommendations:

- Use the metric ledger mismatch entries as the correction queue.
- Do not overwrite the existing Gage historical workbook-derived values until the governing source table is chosen.
- All 2026 R&O class rows have been parsed or manually verified; preserve manual extraction notes for audited rows.

## Extraction Methods

Reliable:

- CTL average-tax-rate PDFs: `pdfText` extraction was reliable for all 2019-2025 county rows and state totals.
- 2026 R&O county/class all-rows: `pdfText` extraction was reliable for 265 class rows after validation against expected table structure.
- Buffalo residential, Dodge residential, Douglas residential, Douglas agricultural, Fillmore commercial, Kearney commercial, Kearney agricultural, Lancaster residential, Lancaster agricultural, Lincoln residential, Madison residential, Sarpy residential, Sarpy agricultural, and Wheeler agricultural were manually verified from the official 2026 county R&O PDFs and added to the app-ready data/ledger.
- Douglas agricultural was verified from the `Comparable Sales Statistics with LCG values` table; app-ready values preserve the table-row precision rather than the rounded header values.
- Lancaster agricultural was verified from the `Comparable Sales Statistics with LCG values` table; app-ready values preserve the table-row precision rather than the rounded header values.
- Sarpy agricultural was verified from the `Comparable Sales Statistics with LCG values` table; app-ready values preserve the table-row precision rather than the rounded header values.
- Kearney commercial and agricultural were verified from the official 2026 Kearney R&O PDF, but the appendix tables are labeled `PAD 2025 R&O Statistics (Using 2025 Values)`. Those rows keep `reportYear: 2026` for the containing source document and `assessmentYear: 2025` for the table values.

Less reliable:

- Some R&O PDFs split numeric tokens in the text layer, especially PRD or maximum ratio values such as `1 12.08`. Repaired rows are kept in the app-ready file with medium confidence and detailed provenance in the ledger.
- Detailed embedded Form 45 pages are present in county R&O appendices but are visually dense and not suitable for broad automated PDF-text extraction without a separate table-focused pass.
- County tax district authority reports are represented in the project from a local Gage County assessor report, not from a PAD statewide source. This pass did not build extended levy district histories.

## Year Discipline

The new files preserve year-type distinctions:

- CTL files use `taxYear`.
- Reports and Opinions ratio files use `assessmentYear` and `reportYear`.
- Annual reports use `reportYear`.
- Calendar documents use `statementYear`.
- Assessment ranges are recorded for app use with `assessmentYear` context.

Normalization rules:

- Average tax rate is stored as a decimal rate in app-ready CTL files, matching the existing project convention.
- R&O median, mean, weighted mean, min, max, and PRD values remain in source whole-percent scale in app-ready files.
- The metric ledger records `normalizedValue` for ratio/PRD values where useful by dividing source whole-percent values by 100.

## Frontend Consumption Notes

The frontend should continue to use static JSON. It should not fetch, download, or parse PAD PDFs at runtime.

Recommended future data access:

- Statewide trend cards/charts: `data/statewide/statewide-ctl-summary.json`
- County CTL comparisons: `data/statewide/county-ctl-comparisons.json`
- County R&O ratio comparisons: `data/statewide/pad-ratio-statistics-by-county.json`
- Source citations/audit UI: `data/sources/nebraska-pad-source-registry.json`
- Deep provenance/reconciliation views: `data/sources/nebraska-pad-metric-ledger.json`
- Assessment acceptable ranges: `data/statewide/county-assessment-ranges.json`

No frontend components were changed in this pass.

## Final Test

1. Can every major statewide/county comparison number be traced to an official source?

Yes for the scoped statewide and county comparison files. CTL statewide and county comparison values are fully traced and verified for 2019-2025. 2026 R&O county/class ratio values are traced for all counties, with all 279 parsed or manually verified and no remaining row-level manual review items.

2. Can a human reproduce the source path from the registry?

Yes. Registry entries include both official landing pages and direct document URLs. Some older Gage R&O links have medium stable URL confidence because current index pages no longer expose all county links.

3. Are year types clearly distinguished?

Yes. The registry and ledger distinguish `taxYear`, `assessmentYear`, `reportYear`, and `statementYear`.

4. Are mismatches flagged instead of silently corrected?

Yes. No existing data was overwritten. Gage historical mismatches and source ambiguity are recorded in `mismatchSummary`.

5. Is the frontend still insulated from live PDF parsing?

Yes. All new files are static JSON or documentation. No frontend fetch/parsing behavior was changed.
