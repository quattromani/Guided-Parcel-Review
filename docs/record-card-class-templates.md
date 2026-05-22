# Record Card Class Templates

Use these templates when converting a GWorks PDF plus Nebraska Taxes Online (NTO) details into an app-ready record card. The goal is not to create three unrelated schemas. The goal is one shared record-card contract with class-specific evidence buckets.

## Shared Core

Every class should include these record-card areas:

- `source`
- `guidedSnapshot`
- `guidedSnapshot.parcel`
- `guidedSnapshot.classification`
- `guidedSnapshot.taxpayerHistory`
- `guidedSnapshot.taxStatements`
- `guidedSnapshot.districtLevyHistory`
- `guidedSnapshot.assessedValueBreakdown`
- `guidedSnapshot.latestFinalLevyComponents`
- `guidedSnapshot.landInformation`
- `guidedSnapshot.sources`
- `guidedSnapshot.sourcePolicy`
- `parcelIdentifiers`
- `locationModel`
- `landModel`
- `currentCardValue`
- `ownershipHistory`
- `valuationHistory`
- `propertyValuation`
- `valuationReconciliation`
- `reviewHistory`
- `costApproach`
- `sourceExtract`

Use `null`, empty arrays, or explicit unavailable notes for fields the source documents do not support. Do not infer Marshall & Swift cost-model detail from high-level PDF summaries.

## Residential

Reference fixture:

```text
data/property-records/mips/residential-010496000-record-card.json
```

Required PDF evidence:

- Parcel identity, owner, situs, mailing address, legal description, district, school district, and classification.
- Residential datasheet: year built, style, quality, condition, exterior, room/plumbing counts, basement, building size, heating/cooling, and garage.
- Dwelling data, garage cost lines, and miscellaneous improvements.
- Current and prior assessed value components.

Required NTO evidence:

- 2019-current REAL statement detail.
- Gross tax, school/non-ag/homestead credits, net tax, paid amount, and balance due.
- Assessed valuation components by year.
- Latest tax distribution levy components.

Fast capture:

```sh
node scripts/capture-nto-statements.js {nto-parcel-id}
```

Class-specific record-card focus:

- `guidedSnapshot.residential`
- `residentialInformation`
- `garageCostLines`
- `miscImprovements`
- `guidedSnapshot.dwellingData`

## Agricultural

Reference fixture:

```text
data/property-records/mips/agricultural-001902000-record-card.json
```

Required PDF evidence:

- Parcel identity, owner, situs, mailing address, legal description, district, school district, and classification.
- Agricultural land rows, acres, land class/productivity information, and location model.
- Residential dwelling facts when the agricultural parcel includes a residence.
- Outbuildings, improvements, and current/prior assessed value components.

Required NTO evidence:

- 2019-current REAL statement detail.
- Gross tax, school/non-ag/ag-land/homestead credits, net tax, paid amount, and balance due.
- Land, dwelling, outbuilding, and total assessed components by year.
- Latest tax distribution levy components.

Fast capture:

```sh
node scripts/capture-nto-statements.js {nto-parcel-id}
```

Class-specific record-card focus:

- `guidedSnapshot.landInformation`
- `landModel`
- `guidedSnapshot.residential` when present
- `guidedSnapshot.outbuildingData`
- Ag-land credit fields in `guidedSnapshot.taxStatements`

## Commercial

Reference fixture:

```text
data/property-records/mips/commercial-010635030-record-card.json
```

Required PDF evidence:

- Parcel identity, owner, situs, mailing address, legal description, district, school district, and classification.
- Commercial datasheets: occupancy, building size, year built, perimeter, construction, quality, and condition when available.
- TIF or multiple-statement context when present.
- Current and prior assessed value components.

Required NTO evidence:

- 2019-current REAL, TIF, or combined statement detail.
- Gross tax, credits, net tax, paid amount, and balance due by component.
- Assessed valuation components by year.
- Latest tax distribution levy components for each applicable district.

Fast capture:

```sh
node scripts/capture-nto-statements.js {nto-parcel-id}
```

Class-specific record-card focus:

- `guidedSnapshot.commercial`
- `statementComponents` inside `guidedSnapshot.taxStatements` when NTO splits REAL/TIF
- Commercial-friendly fallback values in `guidedSnapshot.residential`
- Source notes explaining unavailable cost-model fields
