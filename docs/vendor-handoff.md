# Vendor Handoff

This prototype is intended to demonstrate a taxpayer-facing communication layer that can sit beside an existing CAMA or property-record system. It should be read as a product-adjacent front end, not as a replacement for official assessment, tax, filing, or payment systems.

## Integration Goal

A vendor should be able to provide a canonical property record, county/state reference datasets, and optional source/provenance metadata. The app should then build the guided taxpayer story:

```text
raw vendor record -> canonical property record -> derived metrics -> route view models -> guided UI
```

That boundary is the most important handoff contract in the repo. The current demo uses one GWorks MIPS-derived property record at:

```text
data/property-records/mips/residential-010496000-record-card.json
```

## What A Vendor Must Provide

The target vendor adapter should map roughly these groups of fields:

- Parcel identity: parcel id, map/geocode ids, situs address, mailing address, owner, legal description.
- Classification: property class, status, location, zoning, tax district, school district.
- Residential/commercial/ag facts: area, year built, quality, condition, rooms, garages, land, outbuildings, notes.
- Valuation: current and prior values, land/improvement split, value history, model/reconciliation notes.
- Tax context: finalized statement years, gross tax, credits, net amount due, levy history, taxing bodies.
- Source metadata: source system, report/card type, printed/generated date, confidence or reconciliation notes.

The app should not require the vendor to provide UI copy, chart-ready arrays, or taxpayer-facing conclusions. Those belong in the app-ready layer and view models.

## Current Handoff Gaps

- The active record currently combines raw MIPS-style record data and `guidedSnapshot` app-ready data.
- JSON contracts are documented here and in schemas, but not yet enforced by a full JSON Schema validator.
- Calculations exist in shared helpers and view modules; they should continue moving into `src/calculations/`.
- Some secondary panels remain in the app shell even when they are not primary guided steps.

## Recommended Adapter Boundary

```text
src/adapters/mips/
  record-card.js            # current adapter boundary for the demo record card
  field-map.json            # vendor-facing field mapping and notes

src/domain/
  property-record.js        # future canonical raw record contract
  property-snapshot.js      # current app-normalized property snapshot
  source-labels.js          # shared source/citation display labels

src/calculations/
  assessment.js
  tax.js
  market.js
  ratio-signals.js
```

## What Should Remain Static

For prototype handoff, static JSON is a feature. It lets vendor/product reviewers inspect every assumption without needing database credentials. The app should keep static, app-ready JSON for demos while preserving a path to normalized database ingestion.

Browser delivery should still respect product boundaries: primary guided-route data can load at startup, while secondary reports such as full tax-district authority listings should load only when the relevant tax-context step opens.

## What Should Become Runtime Later

- Active parcel lookup.
- Vendor API adapter.
- Current-year assessment and tax statement retrieval.
- User-specific record correction delivery.
- Admin/source refresh workflows.

None of those are required for the current handoff prototype.
