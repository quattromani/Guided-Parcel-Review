import { renderComparisonExperiment } from "./comparison-experiment.js";

const SOURCE_LANGUAGE = "Source: GWorks property record PDFs, Nebraska Taxes Online statement captures, and the Residential-3 comparable-candidate ranking generated for 1722 Washington. This experimental view is for review and layout testing only.";

export async function renderWashington1722ComparableSalesExperiment(propertySwitcherContext = {}) {
  return renderComparisonExperiment(propertySwitcherContext, {
    kicker: "Experiment · Comparable Sales Walkthrough",
    title: "How Does 1722 Washington Compare?",
    subtitle: "VG3 Beatrice residential candidate screening and full-record comparison for 1722 Washington.",
    contextKicker: "Guided Comparable Search",
    introTitle: "Start with ranked VG3 record candidates",
    introCopy: "The Residential-3 candidate ranking narrows already downloaded GWorks PDFs to sold Beatrice residential records. The selected properties below are then checked against full record-card facts for dwelling size, age, style, quality, condition, tax district, and sale timing.",
    disclaimer: "This page is not a formal appraisal, not an official comparable sales report, and not a valuation conclusion.",
    cardSectionLabel: "1722 Washington subject and comparable property cards",
    cardSectionKicker: "Ranked Residential-3 Set",
    cardSectionTitle: "Swipe through the selected properties",
    whyMatchesTitle: "The best available matches are small, older Beatrice homes",
    whyMatchesIntro: "The subject is an 840 sq. ft. 1924 one-story home with average quality, good condition, and a detached garage. The selected candidates keep the same Beatrice tax and school district while staying closest on age, size, and style.",
    whyMatchesNote: "1524 Court is the highest script-ranked match because it is nearly identical in size and age, but its sale is older than the preferred review window. 1609 Elk is the cleanest recent high-ranked sale. 1809 Court is retained as a practical alternate with similar era and one-story structure.",
    tableLabel: "1722 Washington subject and comparable sales comp sheet",
    tableKicker: "Comparable Review Sheet",
    tableTitle: "Full Record Comparison",
    fullRecordTitle: "Full Record Comparison",
    fullRecordHelp: "The detailed record comparison below preserves the source information used during the review process. It is provided for transparency and verification, and is intentionally more detailed than the summaries above.",
    sourceText: SOURCE_LANGUAGE,
    showSubjectStory: true,
    showCandidateReview: true,
    refinedComparableReview: true,
    candidateSearchStats: {
      trackerCandidateCount: 4362,
      localPdfCandidateCount: 274,
      eligibleScriptCandidateCount: 60,
      statItems: [
        ["Residential-3 candidates", 4362],
        ["Local PDFs checked", 274],
        ["Eligible ranked candidates", 60],
        ["Selected matches", 3],
        ["Review alternates", 2]
      ]
    },
    properties: [
      {
        recordId: "residential-0011087000",
        role: "subject",
        roleLabel: "Subject Property",
        locationFactors: "Urban Beatrice residential subject property in tax district 157.",
        reasonIncluded: "Subject property anchoring the 1722 Washington comparable review.",
        reviewCaution: "Use as the subject reference only; no comparable sale conclusion is implied."
      },
      {
        recordId: "residential-0012884000",
        role: "comparable",
        roleLabel: "Comparable Sale 1",
        saleDate: "10/25/2022",
        salePrice: 116000,
        locationFactors: "Same Beatrice Residential-3 market context.",
        reasonIncluded: "Highest script-ranked full-record candidate: 832 sq. ft., 1925 construction, one-story style, and same tax/school district.",
        reviewCaution: "Sale is older than the preferred 36-month review window."
      },
      {
        recordId: "residential-0012755000",
        role: "comparable",
        roleLabel: "Comparable Sale 2",
        saleDate: "09/29/2023",
        salePrice: 135000,
        locationFactors: "Same Beatrice Residential-3 market context.",
        reasonIncluded: "Clean high-ranked recent candidate with similar age, small dwelling size, and same tax/school district.",
        reviewCaution: "Style and condition wording differ from the subject, so physical adjustment judgment is still needed."
      },
      {
        recordId: "residential-0013631000",
        role: "comparable",
        roleLabel: "Comparable Sale 3",
        saleDate: "02/27/2023",
        salePrice: 105000,
        locationFactors: "Same Beatrice Residential-3 market context.",
        reasonIncluded: "Useful alternate: 1925 one-story record with average quality/condition and same tax/school district.",
        reviewCaution: "Larger dwelling than the subject; use as support rather than a pure size match."
      }
    ],
    candidatePool: [
      {
        recordId: "residential-0012884000",
        role: "selectedComparable",
        roleLabel: "Comparable Sale 1",
        saleDate: "10/25/2022",
        salePrice: 116000,
        locationFactors: "Same Beatrice Residential-3 market context.",
        reasonIncluded: "Highest script-ranked full-record candidate: 832 sq. ft., 1925 construction, one-story style, and same tax/school district.",
        reviewCaution: "Sale is older than the preferred 36-month review window."
      },
      {
        recordId: "residential-0012755000",
        role: "selectedComparable",
        roleLabel: "Comparable Sale 2",
        saleDate: "09/29/2023",
        salePrice: 135000,
        locationFactors: "Same Beatrice Residential-3 market context.",
        reasonIncluded: "Clean high-ranked recent candidate with similar age, small dwelling size, and same tax/school district.",
        reviewCaution: "Style and condition wording differ from the subject, so physical adjustment judgment is still needed."
      },
      {
        recordId: "residential-0013631000",
        role: "selectedComparable",
        roleLabel: "Comparable Sale 3",
        saleDate: "02/27/2023",
        salePrice: 105000,
        locationFactors: "Same Beatrice Residential-3 market context.",
        reasonIncluded: "Useful alternate: 1925 one-story record with average quality/condition and same tax/school district.",
        reviewCaution: "Larger dwelling than the subject; use as support rather than a pure size match."
      },
      {
        recordId: "residential-0009543000",
        role: "alternateComparable",
        roleLabel: "Flagged Alternate",
        saleDate: "08/14/2023",
        salePrice: 16162.08,
        locationFactors: "Same Beatrice Residential-3 market context.",
        reasonIncluded: "High physical score and same district context.",
        reviewCaution: "Sale price appears atypically low for an ordinary market-sale comp; verify sale validity before relying on it."
      },
      {
        recordId: "residential-0010081000",
        role: "alternateComparable",
        roleLabel: "Flagged Alternate",
        saleDate: "02/28/2024",
        salePrice: 47315,
        locationFactors: "Same Beatrice Residential-3 market context.",
        reasonIncluded: "Similar small one-story profile with same district context.",
        reviewCaution: "Sale price is low relative to assessed context; verify sale validity before relying on it."
      }
    ],
    mipsCandidateReview: [
      {
        address: "1524 Court",
        parcelId: "012884000",
        saleDate: "10/25/2022",
        salePrice: 116000,
        buildingSqFt: 832,
        fullDetailScore: 75,
        note: "Highest full-detail score; very close age and size, but older than the preferred review window."
      },
      {
        address: "1609 Elk",
        parcelId: "012755000",
        saleDate: "09/29/2023",
        salePrice: 135000,
        buildingSqFt: 936,
        fullDetailScore: 71,
        note: "Clean recent high-ranked sale with same tax and school district."
      },
      {
        address: "811 Elk",
        parcelId: "009543000",
        saleDate: "08/14/2023",
        salePrice: 16162.08,
        buildingSqFt: 905,
        fullDetailScore: 70,
        note: "Strong physical score, but sale price needs validity review."
      },
      {
        address: "912 Scott",
        parcelId: "010081000",
        saleDate: "02/28/2024",
        salePrice: 47315,
        buildingSqFt: 1008,
        fullDetailScore: 65,
        note: "Similar small one-story profile, but sale price needs validity review."
      },
      {
        address: "1809 Court",
        parcelId: "013631000",
        saleDate: "02/27/2023",
        salePrice: 105000,
        buildingSqFt: 1048,
        fullDetailScore: 63,
        note: "Useful practical alternate with similar age and one-story structure."
      }
    ]
  });
}
