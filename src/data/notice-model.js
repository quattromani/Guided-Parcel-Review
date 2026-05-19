import { latestKnown, percentChange, previousKnown } from "../calculations/history.js";
import {
  displayAddress,
  displayMailingAddress,
  displayMailingAddressLines
} from "../utils/address.js";

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

function titleCaseStatus(value) {
  if (!value) return "Unknown";
  return `${value}`
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, character => character.toUpperCase());
}

function hasValue(value) {
  return value !== null && value !== undefined;
}

function assessmentValueStatus(row) {
  if (!row || !hasValue(row.assessedValue)) {
    return {
      status: "unavailable",
      label: "Assessment value unavailable"
    };
  }

  if (row.status === "pending") {
    return {
      status: "pending",
      label: "Assessment value pending"
    };
  }

  if (row.status === "assessment_notice") {
    return {
      status: "assessment-notice",
      label: "Assessment notice value"
    };
  }

  return {
    status: "value-listed",
    label: "Assessment value listed"
  };
}

function taxStatementStatus(propertyData, year) {
  const statement = propertyData.taxStatements?.find(row => row.taxYear === year);

  if (!statement) {
    return {
      status: "not-loaded",
      label: "Tax statement not loaded",
      finalityLabel: "Tax statement not loaded",
      paymentLabel: "Payment status unavailable",
      balanceDue: null,
      statement: null
    };
  }

  const balanceDue = hasValue(statement.taxDue) ? Number(statement.taxDue) : null;
  const totalPaid = hasValue(statement.totalPaid) ? Number(statement.totalPaid) : null;
  const netTax = hasValue(statement.netAmountDue) ? Number(statement.netAmountDue) : Number(statement.totalTaxesDue);
  let paymentLabel = "Payment status unavailable";

  if (balanceDue !== null && balanceDue <= 0) {
    paymentLabel = "Paid in full";
  } else if (totalPaid > 0 && balanceDue > 0) {
    paymentLabel = "Partially paid";
  } else if (balanceDue > 0) {
    paymentLabel = "Balance due";
  }

  return {
    status: "statement-loaded",
    label: "Tax statement loaded",
    finalityLabel: "Tax statement loaded",
    paymentLabel,
    balanceDue,
    netTax: Number.isFinite(netTax) ? netTax : null,
    totalPaid,
    statement
  };
}

function reviewWindow(calendar) {
  const reviewStage = calendar?.stages?.find(stage => stage.id === "review-window" || stage.id === "review");

  return {
    label: calendarDateRangeLabel(reviewStage?.start, reviewStage?.end) ?? "Not listed",
    sourceLabel: "Review Window"
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
  const deadline = reviewWindow(calendar);
  const assessmentStatus = assessmentValueStatus(currentYearRow);
  const statementStatus = taxStatementStatus(propertyData, snapshotYear);

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
    valueStatus: assessmentStatus.status,
    valueStatusLabel: assessmentStatus.label,
    assessmentLabel: `${snapshotYear} Assessment`,
    assessmentStatusLabel: `${snapshotYear} Assessment: ${assessmentStatus.label}`,
    sourceStatusLabel: titleCaseStatus(currentYearRow?.status),
    taxStatementStatusLabel: statementStatus.finalityLabel,
    paymentStatusLabel: statementStatus.paymentLabel,
    paymentBalanceDue: statementStatus.balanceDue,
    latestStatementNetTax: statementStatus.netTax,
    latestStatementTotalPaid: statementStatus.totalPaid,
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
    source: recordCard?.source?.displayCitation ?? "Property record card"
  };
}
