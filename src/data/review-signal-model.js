import { hasValue, latestKnown, percentChange, previousKnown } from "../calculations/history.js";

function signal(id, tone, title, summary, detail) {
  return { id, tone, title, summary, detail };
}

export function buildReviewSignalModel(propertyData, recordCard) {
  const signals = [];
  const latestValue = latestKnown(propertyData.taxpayerHistory, "assessedValue");
  const previousValue = previousKnown(propertyData.taxpayerHistory, latestValue?.year, "assessedValue");
  const latestChange = percentChange(latestValue?.assessedValue, previousValue?.assessedValue);
  const currentYear = propertyData.taxpayerHistory.find(row => row.year === propertyData.snapshotYear);
  const residential = propertyData.residential ?? {};
  const requiredRecordFields = [
    ["situs address", propertyData.parcel?.situsAddress],
    ["property class", propertyData.classification?.propertyClass],
    ["year built", residential.yearBuilt],
    ["building size", residential.buildingSize],
    ["quality / condition", [residential.quality, residential.condition].filter(Boolean).join(" / ")],
    ["land size", propertyData.classification?.lotSize]
  ];
  const missingFields = requiredRecordFields
    .filter(([, value]) => !hasValue(value))
    .map(([label]) => label);

  if (currentYear?.assessedValue === null || currentYear?.assessedValue === undefined) {
    signals.push(signal(
      "current-year-pending",
      "informational",
      "Current assessment year is pending",
      `${propertyData.snapshotYear} value data is not listed in the current static property history.`,
      "Use the latest known final value for orientation, and confirm current-year values with official county records when they are published."
    ));
  }

  if (missingFields.length) {
    signals.push(signal(
      "record-missing-fields",
      "review",
      "Some property record fields may need confirmation",
      `Missing or incomplete fields: ${missingFields.join(", ")}.`,
      "Incomplete record details do not prove an assessment issue, but they may warrant a factual record review."
    ));
  }

  if (latestChange !== null && Math.abs(latestChange) >= 0.15) {
    signals.push(signal(
      "material-value-movement",
      "review",
      "Recent value movement may warrant review",
      `The latest known assessed value changed by ${(latestChange * 100).toFixed(1)}% from ${previousValue.year} to ${latestValue.year}.`,
      "A larger movement can be explainable, but it is worth comparing against property facts, land/building splits, and local market context."
    ));
  }

  if (!recordCard?.currentCardValue?.current) {
    signals.push(signal(
      "notice-breakdown-unavailable",
      "review",
      "Detailed notice value breakdown is not fully available",
      "The current record card value breakdown could not be read from the loaded record-card data.",
      "This may simply reflect source-data limits. Confirm land, building, and improvement values against the official record if needed."
    ));
  }

  if (!signals.some(item => item.tone === "review")) {
    signals.push(signal(
      "no-obvious-discrepancy",
      "steady",
      "No obvious record discrepancy identified",
      "The core property identity and residential characteristics needed for initial orientation are present.",
      "This does not certify the assessment. It means the loaded data does not immediately point to a factual record issue."
    ));
  }

  return {
    posture: signals.some(item => item.tone === "review") ? "review-helpful" : "generally-consistent",
    signals
  };
}
