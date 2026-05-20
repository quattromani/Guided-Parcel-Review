function propertyRecordSourceYear(recordCard) {
  if (!recordCard?.source?.printedAt) return null;

  const printedAt = new Date(recordCard.source.printedAt);
  return Number.isNaN(printedAt.getTime()) ? null : printedAt.getFullYear();
}

export function propertyRecordSourceText(data, recordCard) {
  const sourceYear = propertyRecordSourceYear(recordCard);
  const sourceName = recordCard?.source?.displayCitation || "MIPS Property Record Card";
  const yearPrefix = sourceYear ? `${sourceYear} ` : "";

  return `Source: ${yearPrefix}${sourceName}, ID ${data.parcel.parcelId}.`;
}
