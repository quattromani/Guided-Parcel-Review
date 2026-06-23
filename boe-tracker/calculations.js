export function parseCurrency(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(/[$,\s]/g, ""));
  return Number.isFinite(number) ? number : null;
}

export function formatCurrency(value) {
  if (!Number.isFinite(value)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatPercent(value) {
  if (!Number.isFinite(value)) return "";
  return `${value.toFixed(1)}%`;
}

export function calculateReductionAmount(currentValue, comparisonValue) {
  const current = parseCurrency(currentValue);
  const comparison = parseCurrency(comparisonValue);
  if (!Number.isFinite(current) || !Number.isFinite(comparison)) return null;
  return Math.max(0, current - comparison);
}

export function calculateReductionPercent(currentValue, comparisonValue) {
  const current = parseCurrency(currentValue);
  if (!current) return null;
  const amount = calculateReductionAmount(currentValue, comparisonValue);
  if (!Number.isFinite(amount)) return null;
  return amount / current * 100;
}

export function calculateDurationMinutes(startTime, endTime) {
  if (!startTime || !endTime) return null;
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  if (![startHour, startMinute, endHour, endMinute].every(Number.isFinite)) return null;

  const start = startHour * 60 + startMinute;
  let end = endHour * 60 + endMinute;
  if (end < start) end += 24 * 60;
  return end - start;
}

export function enrichRecordCalculations(record = {}) {
  const requestedReductionAmount = calculateReductionAmount(record.currentAssessedValue, record.ownerRequestedValue);
  const requestedReductionPercent = calculateReductionPercent(record.currentAssessedValue, record.ownerRequestedValue);
  const grantedReductionAmount = calculateReductionAmount(record.currentAssessedValue, record.finalBOEValue);
  const grantedReductionPercent = calculateReductionPercent(record.currentAssessedValue, record.finalBOEValue);
  const hearingDurationMinutes = calculateDurationMinutes(record.hearingStartTime, record.hearingEndTime);

  return {
    ...record,
    requestedReductionAmount,
    requestedReductionPercent,
    grantedReductionAmount,
    grantedReductionPercent,
    hearingDurationMinutes
  };
}

export function meaningfulRecordFields(record = {}) {
  const ignored = new Set([
    "recordId",
    "sessionId",
    "sequenceNumber",
    "createdAt",
    "updatedAt",
    "synced",
    "syncStatus",
    "syncError",
    "requestedReductionAmount",
    "requestedReductionPercent",
    "grantedReductionAmount",
    "grantedReductionPercent",
    "hearingDurationMinutes"
  ]);

  return Object.entries(record).filter(([key, value]) => {
    if (ignored.has(key)) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "boolean") return value;
    return value !== null && value !== undefined && `${value}`.trim() !== "";
  });
}

export function completionStatus(record = {}) {
  if (record.outcome || record.finalBOEValue) return "complete";
  return meaningfulRecordFields(record).length ? "progress" : "empty";
}

export function summarizeSession(session = {}, records = []) {
  const enriched = records.map(enrichRecordCalculations);
  const byOutcome = countBy(enriched, "outcome");
  const basisCounts = countArrayValues(enriched, "protestBasis");
  const evidenceCounts = countArrayValues(enriched, "evidencePresented");
  const durations = enriched.map(record => record.hearingDurationMinutes).filter(Number.isFinite);
  const requestedPercents = enriched.map(record => record.requestedReductionPercent).filter(Number.isFinite);
  const grantedPercents = enriched.map(record => record.grantedReductionPercent).filter(Number.isFinite);
  const statuses = enriched.map(completionStatus);

  return {
    sessionId: session.sessionId,
    total: enriched.length,
    pending: byOutcome.Pending || 0,
    denied: byOutcome.Denied || 0,
    approved: byOutcome.Approved || 0,
    modified: byOutcome.Modified || 0,
    withdrawn: byOutcome.Withdrawn || 0,
    tabled: byOutcome.Tabled || 0,
    continued: byOutcome.Continued || 0,
    empty: statuses.filter(status => status === "empty").length,
    inProgress: statuses.filter(status => status === "progress").length,
    completed: statuses.filter(status => status === "complete").length,
    remaining: statuses.filter(status => status !== "complete").length,
    completionPercent: enriched.length ? Math.round(statuses.filter(status => status === "complete").length / enriched.length * 100) : 0,
    totalRequestedReduction: sum(enriched, "requestedReductionAmount"),
    totalGrantedReduction: sum(enriched, "grantedReductionAmount"),
    averageRequestedReductionPercent: average(requestedPercents),
    averageGrantedReductionPercent: average(grantedPercents),
    mostCommonProtestBasis: mostCommon(basisCounts),
    mostCommonEvidenceType: mostCommon(evidenceCounts),
    mostCommonOutcome: mostCommon(byOutcome),
    followUps: enriched.filter(record => record.followUpFlag).length,
    averageHearingDuration: average(durations),
    unsynced: enriched.filter(record => !record.synced).length
  };
}

function sum(records, key) {
  return records.reduce((total, record) => total + (Number.isFinite(record[key]) ? record[key] : 0), 0);
}

function average(values) {
  if (!values.length) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function countBy(records, key) {
  return records.reduce((counts, record) => {
    const value = record[key] || "Unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function countArrayValues(records, key) {
  return records.reduce((counts, record) => {
    (record[key] || []).forEach(value => {
      counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
  }, {});
}

function mostCommon(counts = {}) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}
