import { calculateEtr, sumRates } from "./format.js";

const guidedSections = [
  {
    id: "your-property",
    eyebrow: "Start here",
    label: "Your Property",
    question: "What changed about this property?",
    title: "Start with the property record",
    description: "Confirm the basic facts first. Values and taxes only make sense after the property story is clear."
  },
  {
    id: "your-assessment",
    eyebrow: "Value",
    label: "Your Assessment",
    question: "What changed about the assessed value?",
    title: "Understand the assessment before the tax bill",
    description: "This separates current assessment information from finalized tax years so pending pieces are not treated as final."
  },
  {
    id: "your-taxes",
    eyebrow: "Tax impact",
    label: "Your Taxes",
    question: "What does this mean for taxes?",
    title: "Connect value, levy, and tax burden",
    description: "The tax bill is the result of assessed value, budgets, levies, exemptions, and credits. This step shows the finalized history."
  },
  {
    id: "tax-districts",
    eyebrow: "Taxing entities",
    label: "Your Tax Districts",
    question: "Who is taxing this property?",
    title: "See the organizations in the tax district",
    description: "Taxes levied and tax district details sit near each other, but answer different questions: where the bill goes and who is in the district."
  },
  {
    id: "market-area",
    eyebrow: "Nearby market",
    label: "Your Market",
    question: "How does this compare nearby?",
    title: "Compare the local valuation group",
    description: "Market-area context uses PAD Reports and Opinions data rather than placeholder comparable-property cards."
  },
  {
    id: "county-equalization",
    eyebrow: "County system",
    label: "The County",
    question: "How is the county performing overall?",
    title: "Review countywide assessment quality",
    description: "County equalization measures show whether appraisals are generally close to market value and reasonably uniform."
  },
  {
    id: "state-context",
    eyebrow: "State baseline",
    label: "The State",
    question: "How does the county compare statewide?",
    title: "Place the property in Nebraska context",
    description: "Statewide CTL trends give a broader baseline for value growth, taxes levied, and average tax-rate movement."
  },
  {
    id: "review-checklist",
    eyebrow: "Action",
    label: "Review",
    question: "What should I check before I protest?",
    title: "Turn the story into a review checklist",
    description: "Use this final step to confirm the record, note unresolved questions, and understand the calendar before taking action."
  }
];

function latestKnown(rows, key) {
  return rows
    .filter(row => row[key] !== null && row[key] !== undefined)
    .slice()
    .sort((a, b) => a.year - b.year)
    .at(-1);
}

function previousKnown(rows, year, key) {
  return rows
    .filter(row => row.year < year && row[key] !== null && row[key] !== undefined)
    .slice()
    .sort((a, b) => a.year - b.year)
    .at(-1);
}

function percentChange(current, previous) {
  if (!current || !previous) return null;
  return (current - previous) / previous;
}

function normalizeProperty(propertyData, recordCard) {
  return {
    parcelId: propertyData.parcel.parcelId,
    owner: propertyData.parcel.owner,
    situsAddress: propertyData.parcel.situsAddress,
    countyName: propertyData.parcel.countyName,
    taxDistrict: propertyData.parcel.taxDistrict,
    schoolDistrict: propertyData.parcel.schoolDistrict,
    propertyClass: propertyData.classification.propertyClass,
    location: propertyData.classification.location,
    valuationGroup: recordCard?.locationModel?.valuationGroup ?? null,
    recordSource: recordCard?.source?.displayCitation ?? "MIPS property record card"
  };
}

function deriveAssessment(propertyData, recordCard) {
  const snapshot = propertyData.taxpayerHistory.find(row => row.year === propertyData.snapshotYear)
    ?? propertyData.taxpayerHistory.at(-1);
  const latestValue = latestKnown(propertyData.taxpayerHistory, "assessedValue");
  const priorValue = previousKnown(propertyData.taxpayerHistory, latestValue?.year, "assessedValue");

  return {
    snapshotYear: propertyData.snapshotYear,
    latestKnownValueYear: latestValue?.year ?? null,
    latestKnownValue: latestValue?.assessedValue ?? null,
    previousKnownValue: priorValue?.assessedValue ?? null,
    valueChangeFromPrevious: percentChange(latestValue?.assessedValue, priorValue?.assessedValue),
    currentYearStatus: snapshot?.status ?? "unknown",
    noticeValues: recordCard?.currentCardValue ?? null
  };
}

function deriveTaxes(propertyData) {
  const latestTax = latestKnown(propertyData.taxpayerHistory, "taxes");
  const previousTax = previousKnown(propertyData.taxpayerHistory, latestTax?.year, "taxes");
  const latestEtr = calculateEtr(latestTax);

  return {
    latestFinalTaxYear: propertyData.latestFinalTaxYear,
    latestFinalTax: latestTax?.taxes ?? null,
    previousFinalTax: previousTax?.taxes ?? null,
    taxChangeFromPrevious: percentChange(latestTax?.taxes, previousTax?.taxes),
    latestEffectiveTaxRate: latestEtr,
    latestFinalLevy: sumRates(propertyData.latestFinalLevyComponents)
  };
}

function deriveDistrict(propertyData, taxDistrictAuthorities) {
  const district = taxDistrictAuthorities?.districts?.find(item =>
    String(item.taxDistrict) === String(propertyData.parcel.taxDistrict)
  );

  return {
    taxDistrict: propertyData.parcel.taxDistrict,
    districtDescription: district?.districtDescription ?? null,
    districtReportLabel: district?.districtLabel ?? null,
    authorityCount: district?.authorityCount ?? propertyData.latestFinalLevyComponents.length,
    districtLevy: district?.districtLevy ?? sumRates(propertyData.latestFinalLevyComponents),
    authorities: district?.authorities ?? propertyData.latestFinalLevyComponents
  };
}

function buildViewModels(propertyData, recordCard, taxDistrictAuthorities) {
  return {
    property: normalizeProperty(propertyData, recordCard),
    assessment: deriveAssessment(propertyData, recordCard),
    taxes: deriveTaxes(propertyData),
    district: deriveDistrict(propertyData, taxDistrictAuthorities)
  };
}

export function buildPropertySnapshotModel({
  propertyData,
  recordCard,
  calendar,
  ctlData,
  ratioData,
  countyContext,
  padRatioData,
  taxDistrictAuthorities,
  valuationGroups,
  iaaoStandards
}) {
  return {
    pipeline: "raw JSON -> normalized property snapshot model -> derived metrics -> view-specific data objects -> UI sections",
    sections: guidedSections,
    rawSources: {
      propertyRecord: recordCard?.source?.displayCitation ?? "MIPS property record card",
      ctlYears: ctlData?.statewide?.map(row => row.year) ?? [],
      ratioYears: ratioData?.classes?.[0]?.records?.map(row => row.year) ?? [],
      calendar: calendar?.sourceTitle ?? "PAD calendar",
      countyContext: countyContext?.source?.title ?? "County context",
      marketArea: padRatioData?.source?.title ?? "PAD Reports and Opinions"
    },
    viewModels: buildViewModels(propertyData, recordCard, taxDistrictAuthorities),
    staticReference: {
      calendar,
      valuationGroups,
      iaaoStandards
    }
  };
}

export function withSnapshotModel(propertyData, snapshotModel) {
  return {
    ...propertyData,
    snapshotModel
  };
}
