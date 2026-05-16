import { latestKnown, percentChange, previousKnown } from "../calculations/history.js";

function monthName(month) {
  return new Date(2000, month - 1, 1).toLocaleString("en-US", { month: "long" });
}

function calendarMonthDayLabel(parts) {
  if (!parts?.month || !parts?.day) return null;
  return `${monthName(parts.month)} ${parts.day}`;
}

function calendarDateRangeLabel(start, end) {
  const startLabel = calendarMonthDayLabel(start);
  const endLabel = calendarMonthDayLabel(end);

  if (startLabel && endLabel) return `${startLabel} - ${endLabel}`;
  return startLabel ?? endLabel ?? null;
}

function assessmentDateLabel(year) {
  return year ? `January 1, ${year}` : "Not listed";
}

function displayAddress(value) {
  return `${value ?? ""}`
    .split(/\s+/)
    .filter(Boolean)
    .map(part => {
      const ordinal = part.match(/^(\d+)(ST|ND|RD|TH)$/i);
      if (ordinal) return `${ordinal[1]}${ordinal[2].toLowerCase()}`;
      if (part.length <= 2) return part.toUpperCase();
      return `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`;
    })
    .join(" ");
}

function displayMailingAddress(value) {
  return displayMailingAddressLines(value).join(", ");
}

function displayMailingAddressLines(value) {
  return `${value ?? ""}`
    .split(",")
    .map(part => displayAddress(part.trim()))
    .filter(Boolean)
    .reduce((lines, part, index) => {
      if (index === 0) return [part];
      return [lines[0], [...lines.slice(1), part].filter(Boolean).join(", ")];
    }, []);
}

function statusLabel(value) {
  if (!value) return "Unknown";
  return `${value}`.charAt(0).toUpperCase() + `${value}`.slice(1).toLowerCase();
}

function protestWindow(calendar) {
  const protestStage = calendar?.stages?.find(stage => stage.id === "protest");

  return {
    label: calendarDateRangeLabel(protestStage?.start, protestStage?.end) ?? "Not listed",
    sourceLabel: "Protest Window"
  };
}

function breakdownForYear(propertyData, year) {
  return propertyData.assessedValueBreakdown?.find(row => row.year === year) ?? null;
}

function knownBreakdown(propertyData, recordCard, year) {
  const fromHistory = breakdownForYear(propertyData, year);
  const currentCard = recordCard?.currentCardValue?.current;

  if (fromHistory?.total !== null && fromHistory?.total !== undefined) {
    return {
      land: fromHistory.land ?? null,
      improvement: (fromHistory.dwelling ?? 0) + (fromHistory.outbuilding ?? 0),
      total: fromHistory.total
    };
  }

  if (currentCard?.total !== null && currentCard?.total !== undefined) {
    return {
      land: currentCard.landLots ?? null,
      improvement: (currentCard.buildings ?? 0) + (currentCard.improvement ?? 0),
      total: currentCard.total
    };
  }

  return {
    land: null,
    improvement: null,
    total: null
  };
}

export function buildAssessmentNoticeModel(propertyData, recordCard, calendar) {
  const snapshotYear = propertyData.snapshotYear;
  const currentYearRow = propertyData.taxpayerHistory.find(row => row.year === snapshotYear);
  const latestValueRow = latestKnown(propertyData.taxpayerHistory, "assessedValue");
  const previousValueRow = previousKnown(propertyData.taxpayerHistory, latestValueRow?.year, "assessedValue");
  const currentAssessedValue = currentYearRow?.assessedValue ?? null;
  const comparisonValue = latestValueRow?.year === snapshotYear
    ? previousValueRow?.assessedValue ?? null
    : latestValueRow?.assessedValue ?? null;
  const currentBreakdown = breakdownForYear(propertyData, snapshotYear);
  const latestKnownBreakdown = knownBreakdown(propertyData, recordCard, latestValueRow?.year);
  const currentLandValue = currentBreakdown?.land ?? null;
  const currentImprovementValue = currentBreakdown?.dwelling !== null && currentBreakdown?.dwelling !== undefined
    ? (currentBreakdown.dwelling ?? 0) + (currentBreakdown.outbuilding ?? 0)
    : null;
  const deadline = protestWindow(calendar);
  return {
    situsAddress: propertyData.parcel.situsAddress,
    displayAddress: displayAddress(propertyData.parcel.situsAddress),
    displayMailingAddress: displayMailingAddress(propertyData.parcel.mailingAddress),
    displayMailingAddressLines: displayMailingAddressLines(propertyData.parcel.mailingAddress),
    parcelId: propertyData.parcel.parcelId,
    propertyClass: propertyData.classification.propertyClass,
    countyName: propertyData.parcel.countyName,
    taxDistrict: propertyData.parcel.taxDistrict,
    assessmentDateLabel: "Assessment Date",
    assessmentDate: assessmentDateLabel(snapshotYear),
    taxYear: snapshotYear,
    valueStatus: currentYearRow?.status ?? "unknown",
    valueStatusLabel: statusLabel(currentYearRow?.status),
    assessmentLabel: `${snapshotYear} Assessment`,
    assessmentStatusLabel: `${snapshotYear} Assessment: ${statusLabel(currentYearRow?.status)}`,
    currentAssessedValue,
    priorAssessedValue: latestValueRow?.year === snapshotYear
      ? previousValueRow?.assessedValue ?? null
      : latestValueRow?.assessedValue ?? null,
    priorAssessedValueYear: latestValueRow?.year === snapshotYear
      ? previousValueRow?.year ?? null
      : latestValueRow?.year ?? null,
    dollarChange: currentAssessedValue !== null && comparisonValue !== null
      ? currentAssessedValue - comparisonValue
      : null,
    percentChange: percentChange(currentAssessedValue, comparisonValue),
    landValue: currentLandValue,
    improvementValue: currentImprovementValue,
    latestKnownValue: latestValueRow?.assessedValue ?? null,
    latestKnownValueYear: latestValueRow?.year ?? null,
    latestKnownLandValue: latestKnownBreakdown.land,
    latestKnownImprovementValue: latestKnownBreakdown.improvement,
    latestKnownTotalValue: latestKnownBreakdown.total,
    reviewDeadline: deadline.label,
    reviewDeadlineLabel: deadline.sourceLabel,
    source: recordCard?.source?.displayCitation ?? "Property record card",
    statusNote: currentAssessedValue === null
      ? `The ${snapshotYear} assessed value is not listed in this demonstration record. The latest known final value is shown for orientation.`
      : `The ${snapshotYear} assessed value is available in this demonstration record.`
  };
}
