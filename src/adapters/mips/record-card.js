import { sortHistoryAscending } from "../../calculations/history.js";

function sortByYear(rows, key = "year") {
  return Array.isArray(rows) ? sortHistoryAscending(rows, key) : rows;
}

export function guidedSnapshotFromMipsRecordCard(recordCard) {
  if (!recordCard?.guidedSnapshot) {
    throw new Error("The active MIPS property record card is missing guided snapshot context.");
  }

  return {
    ...recordCard.guidedSnapshot,
    taxpayerHistory: sortByYear(recordCard.guidedSnapshot.taxpayerHistory),
    taxStatements: sortByYear(recordCard.guidedSnapshot.taxStatements, "taxYear"),
    districtLevyHistory: sortByYear(recordCard.guidedSnapshot.districtLevyHistory),
    assessedValueBreakdown: sortByYear(recordCard.guidedSnapshot.assessedValueBreakdown)
  };
}
