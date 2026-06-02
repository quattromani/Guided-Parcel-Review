import { renderComparisonExperiment } from "./comparison-experiment.js";

const SOURCE_LANGUAGE = "Source: GWorks property record PDFs, Nebraska Taxes Online statement data, and manually selected comparable sales records. This experimental view is for review and layout testing only.";

export async function renderSFifthComparableSalesExperiment(propertySwitcherContext = {}) {
  return renderComparisonExperiment(propertySwitcherContext, {
    kicker: "Experiment · Comparable Sales Layout",
    title: "1301 S 5th Comparable Sales Experiment",
    subtitle: "An experimental review of nearby sold properties selected using public record characteristics and comparable-sale screening criteria.",
    contextKicker: "Manual Comps · Early Equalization Review",
    introTitle: "Experimental review, not a valuation conclusion",
    introCopy: "Start with the subject story, then review selected nearby sales, the ranking summary, remaining cautions, and the detailed record table only when needed.",
    disclaimer: "This experiment does not determine market value. It helps identify which nearby sold properties appear most similar to the subject property and highlights where adjustments or additional review may be necessary.",
    cardSectionLabel: "Subject and comparable property cards",
    cardSectionKicker: "Selected Comparable Cards",
    cardSectionTitle: "Subject property and selected nearby sales",
    tableLabel: "Subject and comparable sales comp sheet",
    tableKicker: "Comparable Review Sheet",
    tableTitle: "Full Record Comparison",
    fullRecordTitle: "Full Record Comparison",
    fullRecordHelp: "This section preserves the underlying record details used in the review. It is intentionally more detailed and is best used after reviewing the summaries above.",
    sourceText: SOURCE_LANGUAGE,
    showSubjectStory: true,
    showCandidateReview: true,
    refinedComparableReview: true,
    candidateSearchStats: {
      trackerCandidateCount: 4362,
      localPdfCandidateCount: 257,
      eligibleScriptCandidateCount: 44
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
        recordId: "residential-0010432000",
        role: "comparable",
        roleLabel: "Comparable Sale 1",
        saleDate: "12/10/2021",
        salePrice: 325000,
        locationFactors: "Large Lot - Busy Street.",
        reasonIncluded: "Uploaded GWorks comparable record selected for side-by-side review.",
        reviewCaution: "Sale data comes from the GWorks sales information table; large lot, busy street, and machinery building context require review."
      },
      {
        recordId: "residential-0010489000",
        role: "comparable",
        roleLabel: "Comparable Sale 2",
        saleDate: "10/18/2021",
        salePrice: 360000,
        locationFactors: "Large Lot.",
        reasonIncluded: "Uploaded GWorks comparable record selected for side-by-side review.",
        reviewCaution: "Sale data comes from the GWorks sales information table; large lot and swimming pool context require review."
      },
      {
        recordId: "residential-0010528000",
        role: "comparable",
        roleLabel: "Comparable Sale 3",
        saleDate: "10/31/2022",
        salePrice: 331000,
        locationFactors: "Large Lot.",
        reasonIncluded: "Uploaded GWorks comparable record selected for side-by-side review.",
        reviewCaution: "Sale data comes from the GWorks sales information table; large lot context requires review."
      }
    ],
    candidatePool: [
      {
        recordId: "residential-0010432000",
        role: "selectedComparable",
        roleLabel: "Comparable Sale 1",
        saleDate: "12/10/2021",
        salePrice: 325000,
        locationFactors: "Large Lot - Busy Street.",
        reasonIncluded: "Uploaded GWorks comparable record selected for side-by-side review.",
        reviewCaution: "Manual selected comp; large lot, busy street, and machinery building context require review."
      },
      {
        recordId: "residential-0010489000",
        role: "selectedComparable",
        roleLabel: "Comparable Sale 2",
        saleDate: "10/18/2021",
        salePrice: 360000,
        locationFactors: "Large Lot.",
        reasonIncluded: "Uploaded GWorks comparable record selected for side-by-side review.",
        reviewCaution: "Manual selected comp; large lot and swimming pool context require review."
      },
      {
        recordId: "residential-0010528000",
        role: "selectedComparable",
        roleLabel: "Comparable Sale 3",
        saleDate: "10/31/2022",
        salePrice: 331000,
        locationFactors: "Large Lot.",
        reasonIncluded: "Uploaded GWorks comparable record selected for side-by-side review.",
        reviewCaution: "Manual selected comp; large lot context requires review."
      },
      {
        role: "candidate",
        roleLabel: "Next Ranked Candidate",
        address: "01522 HIGH",
        parcelId: "012769000",
        propertyClass: "Residential",
        accountType: "Residential",
        taxDistrict: "157",
        schoolDistrict: "SCH 15 BEATRICE, 34-0015",
        location: "Urban",
        zoning: "Single Family",
        lotSizeClass: "20,001 sq. ft. - .99 ac.",
        saleDate: "08/26/2022",
        salePrice: 243100,
        buildingSqFt: 1598,
        structure: {
          buildingSize: 1598,
          yearBuilt: 1958,
          style: "100% One Story"
        },
        condition: {
          quality: "Average",
          condition: "Average"
        },
        reasonIncluded: "Next eligible VG3 residential candidate from the ranking helper.",
        reviewCaution: "Shown as a research lead only; full local record card has not been loaded into this experiment."
      },
      {
        role: "candidate",
        roleLabel: "Next Ranked Candidate",
        address: "00911 DORSEY",
        parcelId: "011312000",
        propertyClass: "Residential",
        accountType: "Residential",
        taxDistrict: "157",
        schoolDistrict: "SCH 15 BEATRICE, 34-0015",
        location: "Urban",
        zoning: "Single Family",
        lotSizeClass: "20,001 sq. ft. - .99 ac.",
        saleDate: "05/26/2023",
        salePrice: 225000,
        buildingSqFt: 1478,
        structure: {
          buildingSize: 1478,
          yearBuilt: 1964,
          style: "100% One Story"
        },
        condition: {
          quality: "Average",
          condition: "Good"
        },
        reasonIncluded: "Next eligible VG3 residential candidate from the ranking helper.",
        reviewCaution: "Shown as a research lead only; full local record card has not been loaded into this experiment."
      },
      {
        role: "candidate",
        roleLabel: "Next Ranked Candidate",
        address: "00420 N 10TH",
        parcelId: "009284000",
        propertyClass: "Residential",
        accountType: "Residential",
        taxDistrict: "157",
        schoolDistrict: "SCH 15 BEATRICE, 34-0015",
        location: "Urban",
        zoning: "Single Family",
        lotSizeClass: "20,001 sq. ft. - .99 ac.",
        saleDate: "10/01/2021",
        salePrice: 183000,
        buildingSqFt: 1384,
        structure: {
          buildingSize: 1384,
          yearBuilt: 1952,
          style: "100% One Story"
        },
        condition: {
          quality: "Average",
          condition: "Average"
        },
        reasonIncluded: "Next eligible VG3 residential candidate from the ranking helper.",
        reviewCaution: "Shown as a research lead only; full local record card has not been loaded into this experiment."
      }
    ]
  });
}
