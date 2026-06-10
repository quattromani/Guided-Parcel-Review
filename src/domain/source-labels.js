function propertyRecordSourceYear(recordCard) {
  if (!recordCard?.source?.printedAt) return null;

  const printedAt = new Date(recordCard.source.printedAt);
  return Number.isNaN(printedAt.getTime()) ? null : printedAt.getFullYear();
}

function propertyRecordPrintedText(recordCard) {
  if (!recordCard?.source?.printedAt) return "";

  const printedAt = new Date(recordCard.source.printedAt);
  if (Number.isNaN(printedAt.getTime())) return "";

  return printedAt.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function propertyRecordSourceText(data, recordCard) {
  const sourceYear = propertyRecordSourceYear(recordCard);
  const sourceObject = recordCard?.source && typeof recordCard.source === "object" ? recordCard.source : null;
  const sourceName = sourceObject?.displayCitation || sourceObject?.system || recordCard?.source || "MIPS Property Record Card";
  const yearPrefix = sourceYear ? `${sourceYear} ` : "";
  const parcelId = data?.parcel?.parcelId || recordCard?.parcelIdentifiers?.parcelId || "loaded parcel";
  const sourceDetails = [
    sourceObject?.system,
    sourceObject?.reportName,
    sourceObject?.recordType
  ].filter(Boolean);
  const printedText = propertyRecordPrintedText(recordCard);
  const reviewHistoryCount = recordCard?.reviewHistory?.length || 0;
  const details = [];

  if (sourceDetails.length) {
    details.push(`Source record: ${sourceDetails.join(", ")}.`);
  }

  if (printedText) {
    details.push(`Printed ${printedText}.`);
  }

  if (reviewHistoryCount) {
    details.push(`Loaded record includes ${reviewHistoryCount} review-history ${reviewHistoryCount === 1 ? "event" : "events"}.`);
  }

  return [`Source: ${yearPrefix}${sourceName}, ID ${parcelId}.`, ...details].join(" ");
}

export function taxHistorySourceText(data) {
  return `Source: Nebraska Taxes Online statement history, ID ${data.parcel.parcelId}.`;
}
