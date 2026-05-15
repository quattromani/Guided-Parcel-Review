# Data Architecture

The current prototype keeps real, inspectable static JSON in place so a vendor/product reviewer can see every assumption. The long-term target is a three-layer data model:

```text
source -> normalized -> app-ready
```

## Current Runtime Layer

The browser currently consumes:

- `data/app/property-manifest.json`
- `data/property-records/mips/residential-010496000-record-card.json`
- `data/counties/gage/*.json`
- `data/statewide/*.json`
- `data/calendars/*.json`
- `data/standards/*.json`

Large optional context should stay behind route/action boundaries. The full tax-district authority report is loaded when the Tax Context step opens; the property record already carries the smaller final levy breakdown needed for the main chart and levy table.

## Target Source Layer

Future `data/source/` files should preserve raw source provenance, extracted rows, and source-document references. Large audit/provenance files should not be eagerly loaded by the browser.

## Target Normalized Layer

Future `data/normalized/` files should be database-shaped rows such as:

- `ctl_by_county_year.ndjson`
- `ratio_by_county_year_class.ndjson`
- `tax_district_authorities.ndjson`
- `property_record_cards.ndjson`

## Target App-Ready Layer

Future `data/app-ready/` files should be small browser chunks, split by county/year/class where useful and indexed by manifest files.

The active app should optimize for taxpayer comprehension and fast static delivery; normalized/source files should optimize for validation, audit, and vendor ingestion.
