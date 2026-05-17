# Texas / Hays County Portability Research Card

Research date: 2026-05-17  
Target lead URL: https://www.countyoffice.org/property-record-110-abasolo-ct-dripping-springs-tx-78620-51c/  
Official record reconstructed from: Hays Central Appraisal District and Hays County Tax Assessor-Collector public records.

## Research Status

CountyOffice was usable only as a lead. Direct access to the provided CountyOffice URL returned `403 Forbidden` during this research session, and no CountyOffice facts are treated as authoritative in this card.

The target property was positively matched in official records:

- Hays CAD Quick Ref ID: `R167130`
- Geographic/account ID: `11-0115-000G-01700-4`
- Situs address: `110 ABASOLO CT, DRIPPING SPRINGS, TX 78620`
- Official appraisal record: https://esearch.hayscad.com/Property/View?Id=R167130&year=2026
- Official tax record: https://tax.co.hays.tx.us/Property-Detail/PropertyQuickRefID/R167130
- GIS/map link: https://gis.bisclient.com/hayscad/?find=R167130

## Structured Record

```json
{
  "record_type": "one_off_portability_research_card",
  "jurisdiction": {
    "state": "Texas",
    "county": "Hays County",
    "city_or_situs_area": "Dripping Springs",
    "appraisal_authority": "Hays Central Appraisal District",
    "tax_collector": "Hays County Tax Assessor-Collector"
  },
  "property_identity": {
    "quick_ref_id": "R167130",
    "geographic_id": "11-0115-000G-01700-4",
    "situs_address": "110 ABASOLO CT, DRIPPING SPRINGS, TX 78620",
    "legal_description": "ARROWHEAD RANCH PH 2C, BLOCK G, Lot 17, ACRES 0.296",
    "subdivision": "S0115 - ARROWHEAD RANCH PH 2C",
    "neighborhood_code": "ARROW",
    "property_type": "Real",
    "property_use": null,
    "owner_name_public_official_record": "GLAZENER, BENJAMIN P & MELISSA ALICE",
    "owner_id_hays_cad": "O0121490",
    "percent_ownership": "100.00%"
  },
  "appraisal_value_summary": {
    "2026_hays_cad_status": "Preliminary values; subject to change",
    "2026_market_value": 750330,
    "2026_appraised_value": 750330,
    "2026_assessed_value": 746823,
    "2026_improvement_homesite_value": 617580,
    "2026_land_homesite_value": 132750,
    "2026_homestead_cap_loss": 3507,
    "2026_agricultural_value_loss": 0,
    "2026_ag_use_value": 0,
    "2025_tax_office_market_value": 678930,
    "2025_tax_office_assessed_value": 678930,
    "2025_tax_office_improvement_value": 559450,
    "2025_tax_office_land_value": 119480
  },
  "building_and_land": {
    "state_code": "A",
    "building_type": "Residential",
    "living_area_sqft": 3890,
    "year_built": 2020,
    "improvement_detail": [
      {
        "type": "MA",
        "description": "Main Area",
        "class_cd": "R8",
        "year_built": 2020,
        "sqft": 2639,
        "assessed_value": 396930
      },
      {
        "type": "AGF1",
        "description": "Attached Garage, 40% of Base",
        "class_cd": "R8",
        "year_built": 2020,
        "sqft": 540,
        "assessed_value": 32490
      },
      {
        "type": "MA2",
        "description": "Main Area 2 Floor",
        "class_cd": "R8",
        "year_built": 2020,
        "sqft": 1251,
        "assessed_value": 188160
      },
      {
        "type": "CV",
        "description": "Covered Porch",
        "class_cd": null,
        "year_built": 2020,
        "sqft": 210,
        "assessed_value": 0
      }
    ],
    "land": {
      "type": "A1",
      "description": "A1-Residential (sf, 5 Ac Or Less)",
      "acreage": 0.296,
      "market_value_2026": 132750,
      "productive_value": 0
    },
    "bedrooms": null,
    "bathrooms": null
  },
  "exemptions": {
    "hays_cad_public_note": "For privacy reasons not all exemptions are shown online.",
    "hays_tax_office_2025_displayed_exemptions": [
      "Disabled Veteran (Active)",
      "Homestead (Active 1/1/2022)"
    ]
  },
  "taxing_entities": {
    "hays_cad_2026_taxing_jurisdictions": [
      { "code": "CAD", "name": "APPRAISAL DISTRICT", "market_value": 750330, "taxable_value": 741823 },
      { "code": "CDS", "name": "CITY OF DRIPPING SPRINGS", "market_value": 750330, "taxable_value": 731823 },
      { "code": "ENR", "name": "NORTH HAYS CO ESD #1", "market_value": 750330, "taxable_value": 741823 },
      { "code": "FNW", "name": "HAYS CO FIRE ESD #6", "market_value": 750330, "taxable_value": 741823 },
      { "code": "GHA", "name": "HAYS COUNTY", "market_value": 750330, "taxable_value": 734355 },
      { "code": "RSP", "name": "SPECIAL ROAD", "market_value": 750330, "taxable_value": 731355 },
      { "code": "SDS", "name": "DRIPPING SPRINGS ISD", "market_value": 750330, "taxable_value": 601823 },
      { "code": "TDS2", "name": "TIF #2 - City of Dripping Springs (Arrowhead TIRZ#2)", "market_value": 750330, "taxable_value": 731823 }
    ],
    "hays_tax_office_2025_entities_and_rates": [
      { "code": "CDS", "name": "City of Dripping Springs", "exemptions": "DV, HS", "exemption_amount": 15000, "taxable_value": 663930, "tax_rate_per_100": 0.2267 },
      { "code": "ENR", "name": "North Hays County ESD #1-EMS", "exemptions": "DV", "exemption_amount": 5000, "taxable_value": 673930, "tax_rate_per_100": 0.05 },
      { "code": "FNW", "name": "Hays County ESD #6-FIRE", "exemptions": "DV", "exemption_amount": 5000, "taxable_value": 673930, "tax_rate_per_100": 0.08024 },
      { "code": "GHA", "name": "Hays County", "exemptions": "DV, HS", "exemption_amount": 11789, "taxable_value": 667141, "tax_rate_per_100": 0.3573 },
      { "code": "RSP", "name": "Special Road Dist", "exemptions": "DV, HS", "exemption_amount": 14789, "taxable_value": 664141, "tax_rate_per_100": 0.0426 },
      { "code": "SDS", "name": "Dripping Springs ISD", "exemptions": "DV, HS", "exemption_amount": 145000, "taxable_value": 533930, "tax_rate_per_100": 1.1052 }
    ],
    "total_2025_tax_rate_per_100": 1.86204
  },
  "tax_bill_summary": {
    "current_tax_year_displayed": 2025,
    "current_amount_due": 0,
    "past_years_due": 0,
    "total_due": 0,
    "2025_bill_levy_breakdown": [
      { "entity": "City of Dripping Springs", "total_taxes_due": 1505.13, "date_paid": "2026-01-02", "amount_paid": 1505.13, "balance": 0 },
      { "entity": "Dripping Springs ISD", "total_taxes_due": 5901.00, "date_paid": "2026-01-02", "amount_paid": 5901.00, "balance": 0 },
      { "entity": "Hays County", "total_taxes_due": 2383.70, "date_paid": "2026-01-02", "amount_paid": 2383.70, "balance": 0 },
      { "entity": "Hays County ESD #6-FIRE", "total_taxes_due": 540.76, "date_paid": "2026-01-02", "amount_paid": 540.76, "balance": 0 },
      { "entity": "North Hays County ESD #1-EMS", "total_taxes_due": 336.96, "date_paid": "2026-01-02", "amount_paid": 336.96, "balance": 0 },
      { "entity": "Special Road Dist", "total_taxes_due": 282.92, "date_paid": "2026-01-02", "amount_paid": 282.92, "balance": 0 }
    ],
    "2025_total_taxes_due": 10950.47,
    "payment_history": [
      { "tax_year": 2025, "transaction_date": "2026-01-02", "effective_date": "2025-12-31", "payment_amount": 10950.47, "receipt": "SM-2026-1876674" },
      { "tax_year": 2024, "transaction_date": "2025-01-04", "effective_date": "2024-12-31", "payment_amount": 12857.32, "receipt": "SM-2025-1763035" },
      { "tax_year": 2023, "transaction_date": "2024-01-29", "effective_date": "2024-01-29", "payment_amount": 14616.37, "receipt": "SM-2024-1613625" },
      { "tax_year": 2022, "transaction_date": "2022-12-30", "effective_date": "2022-12-30", "payment_amount": 12901.32, "receipt": "SM-2022-1501937" },
      { "tax_year": 2021, "transaction_date": "2021-12-20", "effective_date": "2021-12-20", "payment_amount": 4870.29, "receipt": "SM-2021-1394782" }
    ]
  },
  "value_history": [
    { "year": 2026, "improvements": 617580, "land_market": 132750, "ag_valuation": 0, "appraised": 750330, "hs_cap_loss": 3507, "assessed": 746823, "source": "Hays CAD preliminary" },
    { "year": 2025, "improvements": 559450, "land_market": 119480, "ag_valuation": 0, "appraised": 678930, "hs_cap_loss": 0, "assessed": 678930, "source": "Hays CAD / Hays Tax Office" },
    { "year": 2024, "improvements": 666970, "land_market": 141600, "ag_valuation": 0, "appraised": 808570, "hs_cap_loss": 0, "assessed": 808570, "source": "Hays CAD / Hays Tax Office" },
    { "year": 2023, "improvements": 762880, "land_market": 106200, "ag_valuation": 0, "appraised": 869080, "hs_cap_loss": 115580, "assessed": 753500, "source": "Hays CAD / Hays Tax Office" },
    { "year": 2022, "improvements": 595000, "land_market": 90000, "ag_valuation": 0, "appraised": 685000, "hs_cap_loss": 0, "assessed": 685000, "source": "Hays CAD / Hays Tax Office" },
    { "year": 2021, "improvements": 181960, "land_market": 61880, "ag_valuation": 0, "appraised": 243840, "hs_cap_loss": 0, "assessed": 243840, "source": "Hays CAD / Hays Tax Office" },
    { "year": 2020, "improvements": 0, "land_market": 56250, "ag_valuation": 0, "appraised": 56250, "hs_cap_loss": 0, "assessed": 56250, "source": "Hays CAD / Hays Tax Office" }
  ],
  "deed_or_sale_history": [
    { "date": "2021-05-18", "type": "SWDVL", "description": "Special Warranty Deed With Vendors Lien", "grantor": "M/I HOMES OF AUSTIN LLC", "grantee": "GLAZENER, BENJAMIN P & MELISSA ALICE", "instrument_number": "21026729" },
    { "date": "2020-09-08", "type": "SWDVL", "description": "Special Warranty Deed With Vendors Lien", "grantor": "TF ARROWHEAD RANCH LP", "grantee": "M/I HOMES OF AUSTIN LLC", "instrument_number": "20039762" },
    { "date": "2018-02-08", "type": "SWD", "description": "Special Warranty Deed", "grantor": "FORESTAR (USA) REAL ESTATE GROUP INC", "grantee": "TF ARROWHEAD RANCH LP", "instrument_number": "18005876" }
  ],
  "appraisal_performance_substitute": {
    "nebraska_style_report_and_opinion_found": false,
    "closest_texas_substitute": "Texas Comptroller Property Value Study / Appraisal District Ratio Study, plus Hays CAD annual reports, mass appraisal reports, and reappraisal plans.",
    "hays_cad_2024_overall_pvs": {
      "median_level_of_appraisal": 1.00,
      "coefficient_of_dispersion": 9.67,
      "price_related_differential": 1.06
    },
    "hays_cad_2024_single_family_category_a": {
      "number_of_ratios": 1278,
      "cad_reported_appraisal_value": 37635397550,
      "median_level_of_appraisal": 1.00,
      "coefficient_of_dispersion": 7.12,
      "percent_ratios_within_10_percent_of_median": 73.63,
      "percent_ratios_within_25_percent_of_median": 97.81,
      "price_related_differential": 1.02
    },
    "notes": [
      "These are appraisal-district/category-level measures, not parcel-specific measures.",
      "2025 Hays CAD annual report reports 2025 PVS as not applicable and notes 2024 PVS as the latest available study year in the report.",
      "Do not treat these PVS measures as proof that this specific parcel is accurately valued; they are context for appraisal uniformity and level."
    ]
  }
}
```

## Human Review Card

### 1. Property Identity

The target property is identifiable in official records as Hays CAD Quick Ref ID `R167130`, account/geographic ID `11-0115-000G-01700-4`. The official situs address is `110 ABASOLO CT, DRIPPING SPRINGS, TX 78620`. The legal description is `ARROWHEAD RANCH PH 2C, BLOCK G, Lot 17, ACRES 0.296`.

The official records display the owner as `GLAZENER, BENJAMIN P & MELISSA ALICE`, 100% ownership. Because this is a public official-record display, it is included here; downstream demos should consider whether to mask owner names by default.

### 2. Location And Jurisdiction

- County: Hays County, Texas
- Appraisal authority: Hays Central Appraisal District
- Tax collector: Hays County Tax Assessor-Collector
- Municipality/tax context: City of Dripping Springs; Dripping Springs ISD; Hays County; North Hays County ESD #1; Hays County ESD #6; Special Road District; TIF #2 appears in the 2026 Hays CAD taxing-jurisdiction view.
- GIS/map: https://gis.bisclient.com/hayscad/?find=R167130

### 3. Appraisal / Value Summary

2026 Hays CAD values are explicitly marked preliminary and subject to change:

| Field | 2026 Hays CAD |
| --- | ---: |
| Improvement homesite value | $617,580 |
| Land homesite value | $132,750 |
| Market value | $750,330 |
| Appraised value | $750,330 |
| HS cap loss | $3,507 |
| Assessed value | $746,823 |

The Hays County Tax Office currently displays tax-year 2025 values:

| Field | 2025 Hays Tax Office |
| --- | ---: |
| Improvement homesite value | $559,450 |
| Land homesite value | $119,480 |
| Total market value | $678,930 |
| Total appraised value | $678,930 |
| Total assessed value | $678,930 |

### 4. Building / Land Characteristics

Hays CAD displays the property as residential, state code `A`, with living area of `3,890 sqft`, year built `2020`, and total 2026 improvement value of `$617,580`.

Improvement components:

| Type | Description | Class | Year | Sqft | Value |
| --- | --- | --- | ---: | ---: | ---: |
| MA | Main Area | R8 | 2020 | 2,639 | $396,930 |
| AGF1 | Attached Garage, 40% of Base | R8 | 2020 | 540 | $32,490 |
| MA2 | Main Area 2 Floor | R8 | 2020 | 1,251 | $188,160 |
| CV | Covered Porch |  | 2020 | 210 | $0 |

Land line:

| Type | Description | Acres | 2026 Market Value |
| --- | --- | ---: | ---: |
| A1 | Residential, single-family, 5 acres or less | 0.296 | $132,750 |

Bedrooms and bathrooms were not found in the official Hays CAD or Hays Tax Office records reviewed.

### 5. Taxing Entities / Tax Context

For 2025, the Tax Office displays these taxing entities, exemption codes, taxable values, and adopted rates per $100:

| Code | Entity | Exemptions | Exemption Amount | Taxable Value | Rate / $100 |
| --- | --- | --- | ---: | ---: | ---: |
| CDS | City of Dripping Springs | DV, HS | $15,000 | $663,930 | 0.2267 |
| ENR | North Hays County ESD #1-EMS | DV | $5,000 | $673,930 | 0.0500 |
| FNW | Hays County ESD #6-FIRE | DV | $5,000 | $673,930 | 0.08024 |
| GHA | Hays County | DV, HS | $11,789 | $667,141 | 0.3573 |
| RSP | Special Road Dist | DV, HS | $14,789 | $664,141 | 0.0426 |
| SDS | Dripping Springs ISD | DV, HS | $145,000 | $533,930 | 1.1052 |
| Total |  |  |  |  | 1.86204 |

2025 levy/payment breakdown:

| Entity | Taxes Due | Date Paid | Amount Paid | Balance |
| --- | ---: | --- | ---: | ---: |
| City of Dripping Springs | $1,505.13 | 2026-01-02 | $1,505.13 | $0.00 |
| Dripping Springs ISD | $5,901.00 | 2026-01-02 | $5,901.00 | $0.00 |
| Hays County | $2,383.70 | 2026-01-02 | $2,383.70 | $0.00 |
| Hays County ESD #6-FIRE | $540.76 | 2026-01-02 | $540.76 | $0.00 |
| North Hays County ESD #1-EMS | $336.96 | 2026-01-02 | $336.96 | $0.00 |
| Special Road Dist | $282.92 | 2026-01-02 | $282.92 | $0.00 |
| Total | $10,950.47 |  | $10,950.47 | $0.00 |

### 6. Value And Tax History

Official Hays CAD roll value history:

| Year | Improvements | Land Market | Appraised | HS Cap Loss | Assessed |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 2026 | $617,580 | $132,750 | $750,330 | $3,507 | $746,823 |
| 2025 | $559,450 | $119,480 | $678,930 | $0 | $678,930 |
| 2024 | $666,970 | $141,600 | $808,570 | $0 | $808,570 |
| 2023 | $762,880 | $106,200 | $869,080 | $115,580 | $753,500 |
| 2022 | $595,000 | $90,000 | $685,000 | $0 | $685,000 |
| 2021 | $181,960 | $61,880 | $243,840 | $0 | $243,840 |
| 2020 | $0 | $56,250 | $56,250 | $0 | $56,250 |

Hays County Tax Office payment history:

| Tax Year | Transaction Date | Effective Date | Payment Amount | Receipt |
| ---: | --- | --- | ---: | --- |
| 2025 | 2026-01-02 | 2025-12-31 | $10,950.47 | SM-2026-1876674 |
| 2024 | 2025-01-04 | 2024-12-31 | $12,857.32 | SM-2025-1763035 |
| 2023 | 2024-01-29 | 2024-01-29 | $14,616.37 | SM-2024-1613625 |
| 2022 | 2022-12-30 | 2022-12-30 | $12,901.32 | SM-2022-1501937 |
| 2021 | 2021-12-20 | 2021-12-20 | $4,870.29 | SM-2021-1394782 |

Note: The Tax Office bill-detail section currently shows a 2023 bill total of `$11,439.97`, while payment history shows a 2023 payment of `$14,616.37`. This discrepancy should be manually reviewed before using the 2023 bill total in a demo narrative.

### 7. Exemptions

The Hays CAD property page does not list all exemptions and displays the note: `For privacy reasons not all exemptions are shown online.`

The Hays County Tax Office displays these active exemptions for tax year 2025:

- Disabled Veteran (Active)
- Homestead (Active 1/1/2022)

The Tax Office entity table also shows `DV` and `HS` exemption codes with different exemption amounts by taxing entity.

### 8. Sale / Deed History

| Date | Type | Description | Grantor | Grantee | Instrument |
| --- | --- | --- | --- | --- | --- |
| 2021-05-18 | SWDVL | Special Warranty Deed With Vendors Lien | M/I HOMES OF AUSTIN LLC | GLAZENER, BENJAMIN P & MELISSA ALICE | 21026729 |
| 2020-09-08 | SWDVL | Special Warranty Deed With Vendors Lien | TF ARROWHEAD RANCH LP | M/I HOMES OF AUSTIN LLC | 20039762 |
| 2018-02-08 | SWD | Special Warranty Deed | FORESTAR (USA) REAL ESTATE GROUP INC | TF ARROWHEAD RANCH LP | 18005876 |

The Hays County Clerk Records Division is the official public-records office for recorded instruments, including deeds. Full deed images/details were not pulled for this one-off card because Hays CAD and the Tax Office already displayed enough deed history for identification.

### 9. Report And Opinion / Appraisal Performance Substitute

I did not find a Nebraska-style parcel-linked `Report and Opinion` for Hays County.

The closest defensible Texas substitutes are:

- Texas Comptroller Property Value Study / Appraisal District Ratio Study
- Hays CAD annual reports
- Hays CAD mass appraisal reports
- Hays CAD reappraisal plans
- Tax Office / Truth in Taxation rate and levy information by taxing unit

The official Texas Comptroller 2024 Appraisal District Ratio Study for `105-Hays` reports:

| Scope | Ratios | Median Level | COD | Within 10% | Within 25% | PRD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A. Single-family residences | 1,278 | 1.00 | 7.12 | 73.63% | 97.81% | 1.02 |
| Overall | 1,736 | 1.00 | 9.67 | 68.15% | 92.86% | 1.06 |

Hays CAD's 2025 Annual Report also summarizes the latest available PVS performance as 2024 median level `1`, COD `9.67`, and PRD `1.06`; 2025 is marked N/A and the next Hays CAD performance study is expected in 2026.

These metrics are not parcel-specific. They are useful context for mass-appraisal reliability and uniformity, not proof that `R167130` is individually correct or incorrect.

### 10. Missing Fields / Unavailable Data

- CountyOffice page contents: blocked from this session by `403 Forbidden`.
- Official bedrooms/bathrooms: not found in Hays CAD or Hays Tax Office public displays.
- Interior condition or photos: not available from official appraisal/tax records reviewed.
- Parcel-specific comparable sales or protest evidence package: not publicly exposed in the reviewed official property record.
- Parcel-specific COD, PRD, or level of value: not available and should not be invented.
- Final 2026 tax amount: unavailable because 2026 values are preliminary and tax rates are not shown as adopted in the Hays CAD 2026 property page.
- Full deed documents/images: likely available through Hays County Clerk public-record workflows, but not needed to reconstruct this card.
- 2023 tax discrepancy: payment history amount and current bill-detail total differ; manual review needed.

## Source Links

- Hays CAD official site: https://hayscad.com/
- Hays CAD public property search: https://esearch.hayscad.com/
- Hays CAD official property record for `R167130`: https://esearch.hayscad.com/Property/View?Id=R167130&year=2026
- Hays CAD GIS/map link for `R167130`: https://gis.bisclient.com/hayscad/?find=R167130
- Hays County Tax Office official property record for `R167130`: https://tax.co.hays.tx.us/Property-Detail/PropertyQuickRefID/R167130
- Hays County Tax Information page: https://www.hayscountytx.gov/tax-information
- Hays CAD Reports and Plans: https://hayscad.com/reports-and-plans/
- Hays CAD 2025 Annual Report: https://hayscad.com/wp-content/uploads/2025/12/2025-ANNUAL-REPORT.pdf
- Hays CAD 2025-2026 Reappraisal Plan: https://hayscad.com/wp-content/uploads/2024/09/4.-2025_2026-REAPPRAISAL-PLAN-WITH-BOTH-ADDENDUMS_signed.pdf
- Texas Comptroller 2024 Appraisal District Ratio Study, 105-Hays: https://comptroller.texas.gov/auto-data/PT2/ratio-study/2024/1050000001A.php
- Hays County Clerk Records Division: https://www.hayscountytx.gov/county-clerk/records-division

## Portability Notes For Guided Parcel Review

### What Worked

This property can support a credible Guided Parcel Review demo. Public official data was sufficient to reconstruct the core record-card identity, jurisdiction, values, tax entities, exemptions, building area/year, land size, value history, tax payment history, deed history, and map link.

### What Would Need To Change

The current Nebraska/MIPS-shaped assumptions would need a Texas adapter rather than direct schema reuse:

- ID model: Texas uses Hays CAD Quick Ref ID plus geographic/account ID, not a Nebraska parcel ID pattern.
- Authority split: appraisal and tax collection are clearly separated between CAD and Tax Assessor-Collector.
- Values: Texas distinguishes market/appraised/assessed values, homestead cap loss, circuit-breaker cap loss, and productivity/ag use values.
- Exemptions: exemption codes and amounts vary by taxing entity; the same parcel can have different taxable values by unit.
- Tax rates: rates are per $100 taxable value and are adopted by taxing units; Hays CAD's property page may show `0.000000` for preliminary years.
- Jurisdictions: TIF/TIRZ and special districts can appear as contextual jurisdictions even where tax bills show a smaller set of levying entities.
- Appraisal performance: replace Nebraska-style Report and Opinion with Texas Comptroller PVS/ratio-study metrics and CAD annual/mass appraisal reports.
- Source provenance: every field should carry source family and tax year because 2026 CAD, 2025 tax office, and historical roll values can all coexist.
- Privacy: owner names and exemptions are displayed in official sources but should be configurable/maskable for demos.

### Data Source Pattern To Generalize Texas

For Texas properties, a general adapter should likely follow this source order:

1. County appraisal district property search for parcel identity, ownership, legal description, values, characteristics, land, roll history, deed history, and GIS link.
2. County tax assessor-collector portal for adopted tax-year values, exemptions by taxing unit, tax rates, levy breakdown, statements, balances, and payment history.
3. County clerk official public records for deed verification when deed history needs source-document support.
4. Texas Comptroller PVS/Appraisal District Ratio Study for appraisal-level context: median level, COD, PRD, and category-level ratio performance.
5. Appraisal district annual reports, mass appraisal reports, reappraisal plans, and Truth in Taxation data for local methodology and tax-rate context.

### Feasibility Answer

Yes, the Guided Parcel Review data model can be rebuilt for this out-of-state property using public sources, but not as a one-to-one Nebraska clone. The property-level card is feasible; the main gaps are parcel-specific appraisal-performance narratives, bedrooms/bathrooms, official interior/property-condition detail, and a Nebraska-style Report and Opinion. The defensible Texas substitute is a combination of official parcel records, tax-office levy records, and Comptroller/CAD mass-appraisal performance reports.
