# Record Ingestion Playbook

Use this workflow when adding a new parcel from a GWorks PDF and Nebraska Taxes Online (NTO) details.

## Goal

Produce one app-ready record card:

```text
data/property-records/mips/{class}-{parcel-id}-record-card.json
```

Then add it to:

```text
data/app/property-manifest.json
```

The record card should preserve the GWorks PDF facts and add NTO statement history, assessed valuation components, credits, payments, balances, and levy distribution for the 2019-current cycle.

## Fast Start

Run:

```sh
node scripts/ingest-record.js /path/to/013103000.pdf --update-manifest
```

This runs the full standard pipeline:

- Parse the GWorks PDF.
- Capture 2019-current Nebraska Taxes Online statement details.
- Generate the draft record-card JSON.
- Add or update the manifest entry.

If the source documents do not expose a valuation group, pass the known local group explicitly:

```sh
node scripts/ingest-record.js /path/to/013103000.pdf --valuation-group "VG 3 - Beatrice & Beatrice Subs" --market-area "Beatrice & Beatrice Subs" --update-manifest
```

For planning/debugging, run:

```sh
node scripts/prepare-record-ingestion.js /path/to/013103000.pdf
```

The preparation script prints:

- Parsed PDF facts.
- Suggested record-card filename and manifest id.
- The property-class template and reference fixture to follow.
- NTO URL candidates to try, including the common Gage County 9-digit-to-10-digit left-padding variant.
- Any fields that need manual confirmation.

## Source Order

1. GWorks PDF
   - Parcel identity.
   - Owner, situs, mailing address, legal description.
   - Current/prior assessed values.
   - Current levy components shown in the PDF.
   - Classification, land, residential/ag/commercial facts.
   - Dwelling/outbuilding/improvement rows.

2. Nebraska Taxes Online
   - Statement history for 2019-current.
   - Assessed value components by year.
   - Gross tax, credits, net amount due.
   - Paid amount, balance due, due date.
   - Year-specific tax district levy distribution.

3. Do not infer missing Marshall & Swift cost-model details.
   - Leave unavailable cost-source, base-cost, adjustment, depreciation, and RCNLD fields as unavailable/null.

## NTO Lookup

For Gage County, start with:

```text
https://nebraskataxesonline.us/County/3/Property/{parcel}/Type/1/TaxYear/2025
```

Try the candidate parcel ids printed by the script. For 9-digit GWorks parcel ids, NTO commonly requires a left-padded 10-digit form. Example: GWorks `013103000` resolves in NTO as `0013103000`.

If every candidate returns `Record Not Found`, stop and document that the parcel needs manual NTO resolution before final record-card generation.

## Build Steps

1. Run the full ingestion script:

```sh
node scripts/ingest-record.js /path/to/parcel.pdf --update-manifest
```

For manual step-by-step ingestion:

1. Run the PDF preparation script.
2. Open the strongest NTO candidate.
3. Capture the NTO statement history:

```sh
node scripts/capture-nto-statements.js {nto-parcel-id}
```

This writes a structured capture file under:

```text
research/nto-captures/
```

4. For each available year from 2019-current:
   - Open statement details.
   - Capture assessed value, gross tax, credits, net amount due, paid, balance, due date, and statement number.
   - Capture assessed valuation components.
5. Capture the latest available tax distribution.
6. Generate the record card by following the class template in `docs/record-card-class-templates.md`.
7. Add the manifest entry.
8. Run:

```sh
node --check src/app.js
node --check src/data-service.js
node scripts/validate-data-contracts.js
```

9. Open the direct property URL:

```text
http://localhost:4173/?property={parcel-id}#property-record
```

Confirm it bypasses the start page and lands on Property Record.

## Quality Gate

Before committing, verify:

- Manifest `parcelId`, `taxDistrict`, and `recordCardPath` match the record card.
- `guidedSnapshot.taxpayerHistory` includes `snapshotYear`.
- `taxStatements` line up with `taxpayerHistory`.
- `assessedValueBreakdown` line up with NTO assessed valuation components.
- `latestFinalLevyComponents` total matches the latest final levy shown by NTO/PDF.
- Source notes distinguish GWorks PDF facts from NTO statement details.
