import { getActiveContext, importSessionBundle, loadState } from "./storage.js?v=db3aed6";

const csvColumns = [
  "sessionId",
  "meetingDate",
  "meetingNumber",
  "recordId",
  "sequenceNumber",
  "parcelId",
  "address",
  "ownerName",
  "propertyClass",
  "currentAssessedValue",
  "ownerRequestedValue",
  "requestedReductionAmount",
  "requestedReductionPercent",
  "refereeRecommendedValue",
  "finalBOEValue",
  "grantedReductionAmount",
  "grantedReductionPercent",
  "protestBasis",
  "evidencePresented",
  "outcome",
  "refereeAlignment",
  "hearingStartTime",
  "hearingEndTime",
  "hearingDurationMinutes",
  "quickObservationTags",
  "freeformNotes",
  "followUpFlag",
  "synced",
  "syncStatus",
  "createdAt",
  "updatedAt"
];

export function exportActiveSessionJson() {
  const { activeSession, records } = getActiveContext();
  if (!activeSession) return;
  downloadJson(`boe-session-${activeSession.meetingDate || activeSession.sessionId}.json`, {
    exportedAt: new Date().toISOString(),
    session: activeSession,
    records
  });
}

export function exportAllJson() {
  downloadJson("boe-tracker-all-data.json", {
    exportedAt: new Date().toISOString(),
    ...loadState()
  });
}

export function exportActiveSessionCsv() {
  const { activeSession, records } = getActiveContext();
  if (!activeSession) return;
  const rows = records.map(record => flattenRecord(activeSession, record));
  downloadText(
    `boe-session-${activeSession.meetingDate || activeSession.sessionId}.csv`,
    toCsv(rows),
    "text/csv"
  );
}

export function importJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(importSessionBundle(JSON.parse(reader.result)));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function flattenRecord(session, record) {
  return csvColumns.reduce((row, column) => {
    const value = record[column] ?? session[column] ?? "";
    row[column] = Array.isArray(value) ? value.join("; ") : value;
    return row;
  }, {});
}

function toCsv(rows) {
  return [
    csvColumns.join(","),
    ...rows.map(row => csvColumns.map(column => csvEscape(row[column])).join(","))
  ].join("\n");
}

function csvEscape(value) {
  const text = `${value ?? ""}`;
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function downloadJson(filename, data) {
  downloadText(filename, JSON.stringify(data, null, 2), "application/json");
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
