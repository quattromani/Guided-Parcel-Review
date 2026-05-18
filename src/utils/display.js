import { hasValue } from "../calculations/history.js";

const integer = new Intl.NumberFormat("en-US");

export function hasDisplayValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return hasValue(value);
}

export function displayValue(value, { fallback = "Not listed" } = {}) {
  if (!hasDisplayValue(value)) return fallback;
  if (typeof value === "number") return Number.isInteger(value) ? value.toLocaleString() : String(value);

  return String(value);
}

export function formatSquareFeet(value, { fallback = "Not listed" } = {}) {
  if (!hasDisplayValue(value)) return fallback;
  return `${integer.format(Number(value))} sq. ft.`;
}

export function compactParts(parts, separator = "; ") {
  return parts.filter(Boolean).join(separator);
}

export function fileSafe(value, fallback = "property") {
  return `${value ?? fallback}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
