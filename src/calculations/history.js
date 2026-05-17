export function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

export function sortHistoryAscending(rows = [], key = "year") {
  return rows
    .slice()
    .sort((a, b) => Number(a?.[key] ?? 0) - Number(b?.[key] ?? 0));
}

export function sortHistoryDescending(rows = [], key = "year") {
  return rows
    .slice()
    .sort((a, b) => Number(b?.[key] ?? 0) - Number(a?.[key] ?? 0));
}

// Historical rows can contain current-year placeholders; these helpers only select usable values.
export function latestKnown(rows = [], key) {
  return sortHistoryAscending(rows)
    .filter(row => hasValue(row?.[key]))
    .at(-1);
}

export function previousKnown(rows = [], year, key) {
  return sortHistoryAscending(rows)
    .filter(row => row.year < year && hasValue(row?.[key]))
    .at(-1);
}

export function percentChange(current, previous) {
  if (!hasValue(current) || !hasValue(previous) || Number(previous) === 0) return null;
  return (Number(current) - Number(previous)) / Number(previous);
}

export function getSnapshotHistory(data) {
  return data.taxpayerHistory.find(row => row.year === data.snapshotYear)
    ?? sortHistoryAscending(data.taxpayerHistory).at(-1);
}

export function getLatestFinalTaxHistory(data) {
  return sortHistoryAscending(data.taxpayerHistory)
    .filter(row => hasValue(row.taxes))
    .at(-1);
}

export function getPreviousFinalValueHistory(data) {
  const snapshot = getSnapshotHistory(data);

  return sortHistoryAscending(data.taxpayerHistory)
    .filter(row => row.year < snapshot.year && hasValue(row.assessedValue))
    .at(-1);
}
