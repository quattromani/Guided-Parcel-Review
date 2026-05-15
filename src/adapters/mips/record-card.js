export function guidedSnapshotFromMipsRecordCard(recordCard) {
  if (!recordCard?.guidedSnapshot) {
    throw new Error("The active MIPS property record card is missing guided snapshot context.");
  }

  return recordCard.guidedSnapshot;
}
