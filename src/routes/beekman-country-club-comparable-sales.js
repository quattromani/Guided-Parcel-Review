import { renderComparisonExperiment } from "./comparison-experiment.js";

const SOURCE_LANGUAGE = "Source: MIPS Gage Public Sales map snapshot captured June 2026, GWorks property record PDFs, Nebraska Taxes Online 2025 statement captures, and selected Country Club Estates comparable sales records. This experimental view is for review and layout testing only.";

export async function renderBeekmanCountryClubComparableSalesExperiment(propertySwitcherContext = {}) {
  return renderComparisonExperiment(propertySwitcherContext, {
    kicker: "Experiment · Country Club Comparable Sales",
    title: "Beekman · 1417 Country Club Ln",
    subtitle: "MIPS sales-map discovery and full-record comparison for the Beekman Country Club Estates dwelling.",
    contextKicker: "Guided Comparable Search",
    introTitle: "Start with the Country Club-area MIPS sales",
    introCopy: "The MIPS public sales snapshot is used as the first-pass sale screen. The selected candidates are then checked against GWorks record-card details for dwelling size, style, age, construction, condition, sale price per square foot, and Country Club Estates location.",
    disclaimer: "This page is not a formal appraisal, not an official comparable sales report, and not a valuation conclusion.",
    cardSectionLabel: "Beekman subject and Country Club comparable property cards",
    cardSectionKicker: "MIPS Country Club Sale Set",
    cardSectionTitle: "Selected dwelling-focused candidates",
    whyMatchesTitle: "1411 Country Club leads the neighborhood sale set",
    whyMatchesIntro: "The best available candidate keeps the sale recent and the location nearly identical, even when the dwelling style and size require adjustment.",
    whyMatchesNote: "1411 Country Club is the lead sale because it is next door to the subject, in the same Country Club Estates subdivision, the same tax district and school district, and sold in October 2025. 113 Regency is retained as a style-oriented support sale because it is a two-story Country Club Estates record, while 1612 Country Club adds same-corridor sale support. The one-story sales are materially smaller than the 2,661 sq. ft. Beekman dwelling, so the normalized sale price per square foot is central to the comparison.",
    tableLabel: "Beekman Country Club subject and comparable sales comp sheet",
    tableKicker: "Comparable Review Sheet",
    tableTitle: "Full Record Comparison",
    fullRecordTitle: "Full Record Comparison",
    fullRecordHelp: "The detailed record comparison below preserves the source information used during the review process. It is provided for transparency and verification, and is intentionally more detailed than the summaries above.",
    sourceText: SOURCE_LANGUAGE,
    candidateSearchStats: {
      trackerCandidateCount: 942,
      localPdfCandidateCount: 6,
      eligibleScriptCandidateCount: 6,
      statItems: [
        ["MIPS visible sales", 942],
        ["MIPS usable SFR seeds", 705],
        ["Country Club-area sales enriched", 6],
        ["Full records enriched", 6],
        ["Selected matches", 3]
      ]
    },
    properties: [
      {
        recordId: "residential-0010818000",
        role: "subject",
        roleLabel: "Subject Property",
        normalizedPricePerSqFtLabel: "$160.74/sf",
        locationFactors: "Country Club Estates subject in tax district 157 and Beatrice school district.",
        reasonIncluded: "Subject property anchoring the dwelling-focused review.",
        reviewCaution: "No subject sale price is listed; normalized $/sf uses 2026 assessed total divided by reported dwelling square footage."
      },
      {
        recordId: "residential-0010817000",
        role: "comparable",
        roleLabel: "Comparable Sale 1",
        saleDate: "10/21/2025",
        salePrice: 385000,
        locationFactors: "Next-door Country Club Estates sale; same tax district 157 and Beatrice school district.",
        reasonIncluded: "Lead neighborhood comp: newest same-street sale with same 1980 construction year and strong jurisdiction match.",
        reviewCaution: "One-story and 1,580 sq. ft.; materially smaller than the Beekman mixed two-story/1.5-story dwelling."
      },
      {
        recordId: "residential-0010845000",
        role: "comparable",
        roleLabel: "Comparable Sale 2",
        saleDate: "06/26/2025",
        salePrice: 290000,
        locationFactors: "Country Club Estates 1st Add / Regency support sale; same tax district and school district.",
        reasonIncluded: "Style support: two-story record with masonry-heavy exterior and a recent MIPS sale.",
        reviewCaution: "Different street, newer 1995 construction, lower quality/condition, and smaller dwelling size require adjustment."
      },
      {
        recordId: "residential-0010858000",
        role: "comparable",
        roleLabel: "Comparable Sale 3",
        saleDate: "08/26/2024",
        salePrice: 333900,
        locationFactors: "Country Club Lane sale in the same district and school district.",
        reasonIncluded: "Same-corridor Country Club sale with recent market support and similar subdivision context.",
        reviewCaution: "One-story, smaller, newer, and Average/Average compared with the subject's Good/Good condition."
      }
    ],
    candidatePool: [
      {
        recordId: "residential-0010817000",
        role: "selectedComparable",
        roleLabel: "Comparable Sale 1",
        saleDate: "10/21/2025",
        salePrice: 385000,
        locationFactors: "Next-door Country Club Estates sale; same tax district 157 and Beatrice school district.",
        reasonIncluded: "Lead sale after full-record review: same street, same subdivision, same 1980 construction year, and very recent sale.",
        reviewCaution: "One-story and 1,580 sq. ft.; materially smaller than the Beekman dwelling."
      },
      {
        recordId: "residential-0010845000",
        role: "selectedComparable",
        roleLabel: "Comparable Sale 2",
        saleDate: "06/26/2025",
        salePrice: 290000,
        locationFactors: "Country Club Estates 1st Add / Regency support sale; same tax district and school district.",
        reasonIncluded: "Selected style support because it is the best recent two-story Country Club Estates sale in the enriched set.",
        reviewCaution: "Different street, newer construction, lower quality/condition, and smaller dwelling size require adjustment."
      },
      {
        recordId: "residential-0010858000",
        role: "selectedComparable",
        roleLabel: "Comparable Sale 3",
        saleDate: "08/26/2024",
        salePrice: 333900,
        locationFactors: "Country Club Lane sale in the same district and school district.",
        reasonIncluded: "Selected same-corridor support sale with recent market evidence and a usable Country Club record.",
        reviewCaution: "One-story, smaller, newer, and Average/Average compared with the subject's Good/Good condition."
      },
      {
        recordId: "residential-0010801000",
        role: "alternateComparable",
        roleLabel: "Strong Alternate",
        saleDate: "11/26/2025",
        salePrice: 395000,
        locationFactors: "Country Club Estates sale on S 14th Circle; same tax district and school district.",
        reasonIncluded: "Strong alternate because it is a larger 2,112 sq. ft. recent sale in the same subdivision.",
        reviewCaution: "One-story style and Average condition keep it behind the style-oriented selected support sale."
      },
      {
        recordId: "residential-0010874000",
        role: "alternateComparable",
        roleLabel: "Strong Alternate",
        saleDate: "09/24/2025",
        salePrice: 368000,
        locationFactors: "Country Club Estates sale on S 16th Circle; same tax district and school district.",
        reasonIncluded: "Recent subdivision sale with Good condition and 100% masonry exterior.",
        reviewCaution: "One-story and materially smaller than the subject."
      },
      {
        recordId: "residential-0010863000",
        role: "alternateComparable",
        roleLabel: "Review Alternate",
        saleDate: "04/01/2024",
        salePrice: 282000,
        locationFactors: "Country Club Lane sale in the same district and school district.",
        reasonIncluded: "Same-street support sale retained in the review table.",
        reviewCaution: "No extracted card photo and a much smaller one-story dwelling make it weaker for the first screenshot set."
      }
    ],
    mipsCandidateReview: [
      {
        address: "1411 Country Club Ln",
        parcelId: "010817000",
        saleDate: "10/21/2025",
        salePrice: 385000,
        buildingSqFt: 1580,
        mipsSeedScore: 104,
        fullDetailScore: 66,
        note: "Lead sale: next door, same subdivision, same tax/school district, same 1980 year built, and recent sale."
      },
      {
        address: "113 Regency",
        parcelId: "010845000",
        saleDate: "06/26/2025",
        salePrice: 290000,
        buildingSqFt: 1836,
        mipsSeedScore: 102,
        fullDetailScore: 60,
        note: "Best style support because it is a recent two-story Country Club Estates sale."
      },
      {
        address: "1612 Country Club Ln",
        parcelId: "010858000",
        saleDate: "08/26/2024",
        salePrice: 333900,
        buildingSqFt: 1614,
        mipsSeedScore: 99,
        fullDetailScore: 54,
        note: "Same Country Club corridor; smaller one-story dwelling and Average/Average condition require adjustment."
      },
      {
        address: "1512 Country Club Ln",
        parcelId: "010863000",
        saleDate: "04/01/2024",
        salePrice: 282000,
        buildingSqFt: 1374,
        mipsSeedScore: 94,
        fullDetailScore: 54,
        note: "Same-street support, but no extracted card photo and a materially smaller one-story dwelling."
      },
      {
        address: "1714 S 14th Circle Dr",
        parcelId: "010801000",
        saleDate: "11/26/2025",
        salePrice: 395000,
        buildingSqFt: 2112,
        mipsSeedScore: 97,
        fullDetailScore: 52,
        note: "Larger recent subdivision sale; one-story style keeps it as alternate support."
      },
      {
        address: "1807 S 16th Circle Dr",
        parcelId: "010874000",
        saleDate: "09/24/2025",
        salePrice: 368000,
        buildingSqFt: 1595,
        mipsSeedScore: 97,
        fullDetailScore: 52,
        note: "Recent subdivision sale with Good condition and masonry exterior, but smaller one-story design."
      }
    ]
  });
}
