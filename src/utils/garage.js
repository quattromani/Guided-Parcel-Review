import { formatNullableMoney } from "../format.js?v=db3aed6";

function money(value) {
  return value === null || value === undefined ? null : formatNullableMoney(value);
}

function rowLabel(row = {}) {
  const units = row.units ? `${Number(row.units).toLocaleString("en-US")} sq. ft.` : null;
  const value = money(row.cost ?? row.value ?? row.rcnld);
  return [row.description, units, value ? `${value} value` : null].filter(Boolean).join(", ");
}

export function garageRowsFromRecord(recordCard = {}) {
  const attached = (recordCard.garageCostLines || [])
    .filter(row => row?.description)
    .map(row => ({
      description: row.description,
      units: row.units,
      value: row.value ?? row.rcnld,
      source: row.source || "garage cost line"
    }));

  const detached = (recordCard.guidedSnapshot?.outbuildingData || recordCard.outbuildingData || [])
    .filter(row => /garage/i.test(`${row.description || ""}`))
    .map(row => ({
      description: row.description,
      units: row.units,
      value: row.cost ?? row.value ?? row.rcnld,
      source: "outbuilding row"
    }));

  return [...attached, ...detached];
}

export function garageSummary(recordCard = {}, emptyLabel = "No garage records listed") {
  const rows = garageRowsFromRecord(recordCard);
  if (!rows.length) return emptyLabel;
  return rows.map(rowLabel).join("; ");
}

export function garageSizeTotal(recordCard = {}) {
  return garageRowsFromRecord(recordCard).reduce((sum, row) => sum + (Number(row.units) || 0), 0);
}
