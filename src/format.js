export const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

export const moneyCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

export const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function formatNullableMoney(value, cents = false) {
  if (value === null || value === undefined) return "—";
  return cents ? moneyCents.format(value) : money.format(value);
}

export function formatNullablePercent(value) {
  if (value === null || value === undefined) return "—";
  return percent.format(value);
}

export function formatNullableLevy(value) {
  if (value === null || value === undefined) return "—";
  return value.toFixed(6);
}

export { calculateEtr, groupLevy, sumRates } from "./calculations/tax.js";
