export function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

// Historical rows can contain current-year placeholders; these helpers only select usable values.
export function latestKnown(rows = [], key) {
  return rows
    .filter(row => hasValue(row?.[key]))
    .slice()
    .sort((a, b) => a.year - b.year)
    .at(-1);
}

export function previousKnown(rows = [], year, key) {
  return rows
    .filter(row => row.year < year && hasValue(row?.[key]))
    .slice()
    .sort((a, b) => a.year - b.year)
    .at(-1);
}

export function percentChange(current, previous) {
  if (!hasValue(current) || !hasValue(previous) || Number(previous) === 0) return null;
  return (Number(current) - Number(previous)) / Number(previous);
}

export function getSnapshotHistory(data) {
  return data.taxpayerHistory.find(row => row.year === data.snapshotYear)
    ?? data.taxpayerHistory[data.taxpayerHistory.length - 1];
}

export function getLatestFinalTaxHistory(data) {
  return data.taxpayerHistory
    .filter(row => hasValue(row.taxes))
    .at(-1);
}

export function getPreviousFinalValueHistory(data) {
  const snapshot = getSnapshotHistory(data);

  return data.taxpayerHistory
    .filter(row => row.year < snapshot.year && hasValue(row.assessedValue))
    .at(-1);
}
