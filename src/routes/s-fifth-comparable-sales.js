import { renderComparisonExperiment } from "./comparison-experiment.js?v=db3aed6";

const SOURCE_LANGUAGE = "Source: MIPS Gage Public Sales map snapshot, GWorks property record PDFs, Nebraska Taxes Online statement data, and selected comparable sales records. This experimental view is for review and layout testing only.";

export async function renderSFifthComparableSalesExperiment(propertySwitcherContext = {}) {
  return renderComparisonExperiment(propertySwitcherContext, {
    kicker: "Experiment · Comparable Sales Walkthrough",
    title: "How Does 1301 S 5th Compare?",
    subtitle: "MIPS recent sales screen, full-record enrichment, and selected equalization comps for 1301 S 5th.",
    contextKicker: "Guided Comparable Search",
    introTitle: "Start with the MIPS sales screen",
    introCopy: "The MIPS public sales map is now the first-pass source for recent usable sales. The selected properties below are then checked against GWorks record details before being used in the equalization walkthrough.",
    disclaimer: "This page is not a formal appraisal, not an official comparable sales report, and not a valuation conclusion.",
    cardSectionLabel: "Subject and comparable property cards",
    cardSectionKicker: "Updated Recent-Sale Set",
    cardSectionTitle: "Swipe through the selected properties",
    whyMatchesTitle: "1608 S 3rd still leads after the MIPS screen",
    whyMatchesIntro: "The map screen is strong for discovery, but the final comparison still needs full-record judgment.",
    whyMatchesNote: "MIPS initially pushes 1211 S 5th to the top because it is the newest same-street one-story sale. After enriching the top MIPS candidates with GWorks PDFs, 1608 S 3rd remains the strongest lead equalization comp: it is a recent 2024 sale, in the same neighborhood, one-story, similar masonry/frame construction, and the larger 2,248 sq. ft. building sold for less than 1301 S 5th.",
    tableLabel: "Subject and comparable sales comp sheet",
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
      localPdfCandidateCount: 267,
      eligibleScriptCandidateCount: 54,
      statItems: [
        ["MIPS visible sales", 937],
        ["MIPS eligible seeds", 721],
        ["PDF records checked", 267],
        ["Full-detail eligible", 54],
        ["Selected matches", 3]
      ]
    },
    properties: [
      {
        recordId: "residential-010496000",
        role: "subject",
        roleLabel: "Subject Property",
        saleDate: "8/25/2020",
        salePrice: 324000,
        locationFactors: "Large lot urban residential subject property for the 1301 S 5th comparable sales experiment.",
        reasonIncluded: "Subject property anchoring the four-property review.",
        reviewCaution: "Use as the subject reference only; no comparable sale conclusion is implied."
      },
      {
        recordId: "residential-0010529000",
        role: "comparable",
        roleLabel: "Comparable Sale 1",
        saleDate: "06/21/2024",
        salePrice: 315000,
        locationFactors: "Large Lot.",
        reasonIncluded: "Lead equalization comp: recent 2024 same-neighborhood sale, similar lot context, one-story style, and similar masonry/frame construction.",
        reviewCaution: "The larger 2,248 sq. ft. building sold for less than 1301 S 5th, strengthening the comparison even though size and condition still require review."
      },
      {
        recordId: "residential-0010502000",
        role: "comparable",
        roleLabel: "Comparable Sale 2",
        saleDate: "10/31/2023",
        salePrice: 349900,
        locationFactors: "Same S 5th corridor.",
        reasonIncluded: "Same-street MIPS sale with a full GWorks record; useful as higher-price support near the subject size range.",
        reviewCaution: "Built in 1980 with Average+ quality and a different site record; useful support, but less clean as an equalization argument than 1608 S 3rd."
      },
      {
        recordId: "residential-0012492000",
        role: "comparable",
        roleLabel: "Comparable Sale 3",
        saleDate: "11/10/2025",
        salePrice: 250000,
        locationFactors: "Same S 5th corridor.",
        reasonIncluded: "Highest MIPS seed candidate because it is a very recent same-street one-story sale.",
        reviewCaution: "Smaller and newer than the subject; strong recent-sale support, but the full-detail score drops after physical-record review."
      }
    ],
    candidatePool: [
      {
        recordId: "residential-0010529000",
        role: "selectedComparable",
        roleLabel: "Comparable Sale 1",
        saleDate: "06/21/2024",
        salePrice: 315000,
        locationFactors: "Large Lot.",
        reasonIncluded: "Lead equalization comp: recent 2024 same-neighborhood sale, similar lot context, one-story style, and similar masonry/frame construction.",
        reviewCaution: "Manual selected comp; the larger 2,248 sq. ft. building sold for less than 1301 S 5th, strengthening the comparison even though size and condition still require review."
      },
      {
        recordId: "residential-0010502000",
        role: "selectedComparable",
        roleLabel: "Comparable Sale 2",
        saleDate: "10/31/2023",
        salePrice: 349900,
        locationFactors: "Same S 5th corridor.",
        reasonIncluded: "Same-street MIPS sale with a full GWorks record; useful as higher-price support near the subject size range.",
        reviewCaution: "Manual selected comp; 1980 construction, Average+ quality, and site differences require judgment."
      },
      {
        recordId: "residential-0012492000",
        role: "selectedComparable",
        roleLabel: "Comparable Sale 3",
        saleDate: "11/10/2025",
        salePrice: 250000,
        locationFactors: "Same S 5th corridor.",
        reasonIncluded: "Highest MIPS seed candidate because it is a very recent same-street one-story sale.",
        reviewCaution: "Manual selected comp; smaller and newer than the subject, so use as recent-sale support rather than the lead value anchor."
      },
      {
        recordId: "residential-0010432000",
        role: "alternateComparable",
        roleLabel: "Strong Alternate",
        saleDate: "12/10/2021",
        salePrice: 325000,
        locationFactors: "Large Lot - Busy Street.",
        reasonIncluded: "Highest full-detail script score, retained as older support after the MIPS update.",
        reviewCaution: "Older sale with large lot, busy street, and machinery building context; useful as support, but less clean than the newer MIPS sales."
      },
      {
        recordId: "residential-0010489000",
        role: "alternateComparable",
        roleLabel: "Strong Alternate",
        saleDate: "10/18/2021",
        salePrice: 360000,
        locationFactors: "Large Lot.",
        reasonIncluded: "Second-highest older full-detail score and still useful for physical comparison context.",
        reviewCaution: "Sale is older than the preferred MIPS window and the large lot/swimming pool context requires review."
      }
    ],
    mipsCandidateReview: [
      {
        address: "1608 S 3rd",
        parcelId: "010529000",
        saleDate: "06/21/2024",
        salePrice: 315000,
        buildingSqFt: 2248,
        mipsSeedScore: 132,
        fullDetailScore: 69,
        note: "Lead equalization candidate after full-record review; larger building sold below the subject's 2020 sale price."
      },
      {
        address: "1300 S 5th",
        parcelId: "010502000",
        saleDate: "10/31/2023",
        salePrice: 349900,
        buildingSqFt: 1940,
        mipsSeedScore: 128,
        fullDetailScore: 62,
        note: "Same-street support with close sale price per square foot; construction year and condition differ."
      },
      {
        address: "1211 S 5th",
        parcelId: "012492000",
        saleDate: "11/10/2025",
        salePrice: 250000,
        buildingSqFt: 1654,
        mipsSeedScore: 144,
        fullDetailScore: 59,
        note: "Best MIPS seed because of recency and street, but smaller/newer physical facts pull it below 1608."
      },
      {
        address: "1209 Janeway",
        parcelId: "011139000",
        saleDate: "10/17/2025",
        salePrice: 255000,
        buildingSqFt: 1534,
        mipsSeedScore: 122,
        fullDetailScore: 55,
        note: "Recent one-story Beatrice sale; not on the S 3rd/S 4th/S 5th corridor."
      },
      {
        address: "1300 S 4th",
        parcelId: "012495000",
        saleDate: "07/23/2024",
        salePrice: 270000,
        buildingSqFt: 1284,
        mipsSeedScore: 137,
        fullDetailScore: 51,
        note: "Strong map match, but much smaller and newer in the GWorks record."
      },
      {
        address: "1900 S 5th",
        parcelId: "010438000",
        saleDate: "07/10/2024",
        salePrice: 280000,
        buildingSqFt: 1434,
        mipsSeedScore: 130,
        fullDetailScore: 48,
        note: "Same-street recent support, but smaller and lower-assessed than the subject."
      },
      {
        address: "1515 S 4th",
        parcelId: "010516000",
        saleDate: "03/08/2024",
        salePrice: 285000,
        buildingSqFt: 1388,
        mipsSeedScore: 127,
        fullDetailScore: 48,
        note: "Masonry construction support, but smaller/newer and not as direct as 1608."
      },
      {
        address: "1201 S 5th",
        parcelId: "012491000",
        saleDate: "10/29/2025",
        salePrice: 300000,
        buildingSqFt: 2374,
        mipsSeedScore: 129,
        fullDetailScore: 46,
        note: "Very recent same-street sale, but MIPS and GWorks show a two-story style."
      },
      {
        address: "1304 S 4th",
        parcelId: "012494000",
        saleDate: "06/20/2025",
        salePrice: 240000,
        buildingSqFt: 1370,
        mipsSeedScore: 121,
        fullDetailScore: 44,
        note: "Recent nearby sale, but split-level style keeps it as review-only support."
      }
    ]
  });
}
