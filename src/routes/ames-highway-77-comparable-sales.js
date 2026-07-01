import { renderComparisonExperiment } from "./comparison-experiment.js?v=20260701-article-polish-4";

const SOURCE_LANGUAGE = "Source: MIPS Gage Public Sales map snapshot captured June 2026, GWorks property record PDFs, Nebraska Taxes Online 2025 statement captures, and selected Highway 77 comparable sales records. This experimental view is for review and layout testing only.";

export async function renderAmesHighway77ComparableSalesExperiment(propertySwitcherContext = {}) {
  return renderComparisonExperiment(propertySwitcherContext, {
    kicker: "Experiment · Highway 77 Comparable Sales",
    title: "Gail Ames · 29810 US Hwy 77",
    subtitle: "MIPS sales-map discovery and full-record comparison for the Ames Highway 77 dwelling.",
    contextKicker: "Guided Comparable Search",
    introTitle: "Start with the MIPS sales map, then narrow to dwelling facts",
    introCopy: "The MIPS public sales snapshot is used as the first-pass sale screen. The selected Highway 77 candidates are then checked against GWorks record-card details for dwelling size, construction, style, age, condition, sale price per square foot, and location.",
    disclaimer: "This page is not a formal appraisal, not an official comparable sales report, and not a valuation conclusion.",
    cardSectionLabel: "Ames subject and Highway 77 comparable property cards",
    cardSectionKicker: "MIPS Highway 77 Sale Set",
    cardSectionTitle: "Selected dwelling-focused candidates",
    whyMatchesTitle: "30001 US Hwy 77 is the lead sale after full-record review",
    whyMatchesIntro: "The best candidate is the one that keeps the sale recent, the corridor similar, and the dwelling facts defensible.",
    whyMatchesNote: "30001 US Hwy 77 rises above the other Highway 77 sales because it is a 2025 usable MIPS sale, one-story, same tax district and Beatrice school district, same rural-suburban Highway 77 setting, and within the same broad construction era. 38150 US Hwy 77 is physically close to the Ames dwelling, especially size and masonry exterior, but it sits in a different district and sold at a much higher price per square foot. 44769 US Hwy 77 supports the 1960s one-story price band, while 37156 US Hwy 77 remains a strong alternate because of recency but is materially smaller.",
    tableLabel: "Ames Highway 77 subject and comparable sales comp sheet",
    tableKicker: "Comparable Review Sheet",
    tableTitle: "Full Record Comparison",
    fullRecordTitle: "Full Record Comparison",
    fullRecordHelp: "The detailed record comparison below preserves the source information used during the review process. It is provided for transparency and verification, and is intentionally more detailed than the summaries above.",
    sourceText: SOURCE_LANGUAGE,
    subjectAdjustment: {
      kicker: "Dwelling Comparison Adjustment",
      title: "Pool value is held outside the dwelling match",
      intro: "The Ames record lists a residential swimming pool in dwelling data. For this walkthrough, the pool is disclosed as an adjustment item and excluded from the style, construction, age, and dwelling-price-per-square-foot conversation.",
      statItems: [
        ["Raw 2026 total", "$290,870"],
        ["Pool line item", "$30,300"],
        ["Pool-adjusted total reference", "$260,570"],
        ["Pool-adjusted dwelling reference", "$229,780"],
        ["Pool-adjusted total per dwelling sq. ft.", "$138.01/sf"],
        ["Pool-adjusted dwelling value per sq. ft.", "$121.71/sf"]
      ],
      note: "The selected sale prices per square foot are still sale-price divided by reported dwelling square footage. The pool adjustment is shown so the subject's amenity package does not drive the dwelling-comparison ranking."
    },
    candidateSearchStats: {
      trackerCandidateCount: 942,
      localPdfCandidateCount: 4,
      eligibleScriptCandidateCount: 4,
      statItems: [
        ["MIPS visible sales", 942],
        ["MIPS usable SFR seeds", 705],
        ["US Hwy 77 MIPS sales", 8],
        ["Full records enriched", 4],
        ["Selected matches", 3]
      ]
    },
    properties: [
      {
        recordId: "residential-0005212000",
        role: "subject",
        roleLabel: "Subject Property",
        excludePoolFromComparison: true,
        normalizedPricePerSqFtLabel: "$138.01/sf",
        locationFactors: "0.91-acre rural-suburban Highway 77 site in tax district 119 and Beatrice school district.",
        reasonIncluded: "Subject property anchoring the dwelling-focused review.",
        reviewCaution: "Pool value is disclosed separately and excluded from dwelling-style, age, construction, and sale-price-per-square-foot matching."
      },
      {
        recordId: "residential-0005231000",
        role: "comparable",
        roleLabel: "Comparable Sale 1",
        saleDate: "04/29/2025",
        salePrice: 275000,
        locationFactors: "Same Highway 77 corridor, same tax district 119, same Beatrice school district, and similar rural-suburban/agricultural site context.",
        reasonIncluded: "Lead sale: recent usable MIPS sale with the strongest location/jurisdiction match and a 1966 one-story dwelling.",
        reviewCaution: "Smaller dwelling and vinyl/frame exterior require adjustment against the Ames masonry subject."
      },
      {
        recordId: "residential-0006065000",
        role: "comparable",
        roleLabel: "Comparable Sale 2",
        saleDate: "11/05/2024",
        salePrice: 500000,
        locationFactors: "Highway 77 sale south of the subject, but in a different tax district and Wymore school district.",
        reasonIncluded: "Best physical support: 1,799 sq. ft., one-story, Average+ quality, 1975 construction, and 90% masonry exterior.",
        reviewCaution: "Different jurisdiction/location context and a much higher sale price per square foot keep it from being the lead."
      },
      {
        recordId: "residential-0000292000",
        role: "comparable",
        roleLabel: "Comparable Sale 3",
        saleDate: "03/15/2024",
        salePrice: 305000,
        locationFactors: "Highway 77 sale in Wymore-side rural district context.",
        reasonIncluded: "Useful 1967 one-story support sale in the same broad Highway 77 corridor and a mid-$200/sf sale band.",
        reviewCaution: "Different district, hardboard exterior, smaller dwelling, and farm outbuilding context require judgment."
      }
    ],
    candidatePool: [
      {
        recordId: "residential-0005231000",
        role: "selectedComparable",
        roleLabel: "Comparable Sale 1",
        saleDate: "04/29/2025",
        salePrice: 275000,
        locationFactors: "Same Highway 77 corridor, same tax district 119, same Beatrice school district, and similar rural-suburban/agricultural site context.",
        reasonIncluded: "Lead sale after full-record review: same jurisdiction context, recent sale, one-story, and 1960s construction.",
        reviewCaution: "Smaller dwelling and vinyl/frame exterior require adjustment against the Ames masonry subject."
      },
      {
        recordId: "residential-0006065000",
        role: "selectedComparable",
        roleLabel: "Comparable Sale 2",
        saleDate: "11/05/2024",
        salePrice: 500000,
        locationFactors: "Highway 77 sale south of the subject, but in a different tax district and Wymore school district.",
        reasonIncluded: "Selected physical support because the dwelling size, quality, style, and masonry exterior are closest to the Ames dwelling.",
        reviewCaution: "Different jurisdiction/location context and a much higher sale price per square foot keep it from being the lead."
      },
      {
        recordId: "residential-0000292000",
        role: "selectedComparable",
        roleLabel: "Comparable Sale 3",
        saleDate: "03/15/2024",
        salePrice: 305000,
        locationFactors: "Highway 77 sale in Wymore-side rural district context.",
        reasonIncluded: "Selected support sale for 1960s one-story construction and a closer sale-price band than the high-side physical comp.",
        reviewCaution: "Different district, hardboard exterior, smaller dwelling, and farm outbuilding context require judgment."
      },
      {
        recordId: "residential-0006040000",
        role: "alternateComparable",
        roleLabel: "Strong Alternate",
        saleDate: "01/13/2026",
        salePrice: 225000,
        locationFactors: "Recent Highway 77 sale in Blue Springs/Wymore district context.",
        reasonIncluded: "Strong alternate because it is the newest usable Highway 77 one-story sale in the MIPS snapshot.",
        reviewCaution: "Materially smaller dwelling, metal siding, smaller garage, and different district make it support-only."
      }
    ],
    mipsCandidateReview: [
      {
        address: "30001 US Hwy 77",
        parcelId: "005231000",
        saleDate: "04/29/2025",
        salePrice: 275000,
        buildingSqFt: 1462,
        mipsSeedScore: 141,
        fullDetailScore: 61,
        note: "Lead candidate: same Highway 77/Beatrice district context, recent sale, one-story, and 1966 construction."
      },
      {
        address: "38150 US Hwy 77",
        parcelId: "006065000",
        saleDate: "11/05/2024",
        salePrice: 500000,
        buildingSqFt: 1799,
        mipsSeedScore: 125,
        fullDetailScore: 56,
        note: "Best physical match on dwelling size, quality, and masonry exterior, but high-side price and different district."
      },
      {
        address: "44769 US Hwy 77",
        parcelId: "000292000",
        saleDate: "03/15/2024",
        salePrice: 305000,
        buildingSqFt: 1460,
        mipsSeedScore: 126,
        fullDetailScore: 50,
        note: "Good 1967 one-story support sale; Wymore district and farm outbuilding context reduce directness."
      },
      {
        address: "37156 US Hwy 77",
        parcelId: "006040000",
        saleDate: "01/13/2026",
        salePrice: 225000,
        buildingSqFt: 1224,
        mipsSeedScore: 138,
        fullDetailScore: 43,
        note: "Strong recency alternate; smaller dwelling and different construction keep it below the selected three."
      }
    ]
  });
}
