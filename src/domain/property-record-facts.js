import { formatNullableMoney } from "../format.js?v=20260701-article-polish-4";
import { displayAddress } from "../utils/address.js?v=20260701-article-polish-4";
import {
  garageRowsFromRecord,
  garageSizeTotal,
  garageSummary
} from "../utils/garage.js?v=20260701-article-polish-4";

export {
  garageRowsFromRecord,
  garageSizeTotal,
  garageSummary
};

export function moneyLabel(value) {
  return value === null || value === undefined ? "Not listed" : formatNullableMoney(value);
}

export function numberLabel(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "Not listed";
  return `${Number(value).toLocaleString("en-US")}${suffix}`;
}

export function percentLabel(value, { signed = true } = {}) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Not listed";

  const sign = signed && value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(2)}%`;
}

export function textLabel(value) {
  return value === null || value === undefined || value === "" ? "Not listed" : `${value}`;
}

export function ratioMoneyLabel(numerator, denominator) {
  if (!numerator || !denominator) return "Not listed";
  return moneyLabel(Math.round(numerator / denominator));
}

export function ratioPercentLabel(numerator, denominator) {
  if (!numerator || !denominator) return "Not listed";
  return percentLabel(numerator / denominator);
}

export function recordValueRow(recordCard, year) {
  return recordCard?.guidedSnapshot?.assessedValueBreakdown?.find(row => row.year === year) ?? null;
}

export function recordValueRowsByYear(recordCard) {
  return Object.fromEntries((recordCard?.guidedSnapshot?.assessedValueBreakdown || []).map(row => [row.year, row]));
}

export function valueChange(values = {}) {
  const current = values.assessed2026;
  const prior = values.assessed2025;

  if (!current || !prior) return null;

  return {
    dollars: current - prior,
    percent: (current - prior) / prior
  };
}

export function recordDisplayAddress(recordCard = {}, fallback = "") {
  return displayAddress(recordCard.guidedSnapshot?.parcel?.situsAddress) || fallback;
}

export function outbuildingLabel(recordCard) {
  const rows = recordCard?.guidedSnapshot?.outbuildingData || [];
  if (!rows.length) return "None listed";

  return rows.map(row => {
    const size = row.units ? `${Number(row.units).toLocaleString("en-US")} sq. ft.` : "";
    const cost = row.cost ? ` (${moneyLabel(row.cost)})` : "";
    return [row.description, size].filter(Boolean).join(", ") + cost;
  }).join("; ");
}

export function featureLabel(recordCard, pattern) {
  const rows = recordCard?.guidedSnapshot?.dwellingData || [];
  const matches = rows.filter(row => pattern.test(`${row.description || ""}`));

  if (!matches.length) return "None listed";

  return matches.map(row => {
    const units = row.units ? `${Number(row.units).toLocaleString("en-US")} sq. ft.` : "";
    const value = row.value ? ` (${moneyLabel(row.value)})` : "";
    return [row.description, units].filter(Boolean).join(", ") + value;
  }).join("; ");
}

export function hasFeature(recordCard, pattern) {
  return (recordCard?.guidedSnapshot?.dwellingData || []).some(row => pattern.test(`${row.description || ""}`));
}

export function siteSizeLabel(recordCard) {
  const classification = recordCard?.guidedSnapshot?.classification || {};
  const parcel = recordCard?.guidedSnapshot?.parcel || {};
  const parts = [
    classification.lotSize,
    parcel.legalDescription ? parcel.legalDescription.replace(/^0\s+\d+\s+\d+\s+/i, "") : null
  ].filter(Boolean);

  return parts.join(" · ") || "Not listed";
}

export function garageSizeFromText(value) {
  return Number(`${value || ""}`.match(/([\d,]+)\s*sq\.?\s*ft/i)?.[1]?.replace(/,/g, "")) || null;
}
