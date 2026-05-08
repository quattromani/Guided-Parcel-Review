async function loadJson(path, label) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Unable to load ${label}: ${response.status}`);
  }

  return response.json();
}

export function loadPropertyData() {
  return loadJson("data/property-data.json", "property data");
}

export function loadAssessmentCalendar() {
  return loadJson("data/assessment-calendar.json", "assessment calendar");
}

export function getSnapshotHistory(data) {
  return data.taxpayerHistory.find(row => row.year === data.snapshotYear)
    ?? data.taxpayerHistory[data.taxpayerHistory.length - 1];
}

export function getLatestFinalTaxHistory(data) {
  return data.taxpayerHistory
    .filter(row => row.taxes !== null && row.taxes !== undefined)
    .at(-1);
}

export function getPreviousFinalValueHistory(data) {
  const snapshot = getSnapshotHistory(data);

  return data.taxpayerHistory
    .filter(row => row.year < snapshot.year && row.assessedValue !== null && row.assessedValue !== undefined)
    .at(-1);
}
