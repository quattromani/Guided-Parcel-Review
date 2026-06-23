const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function numberFromInput(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(`${value}`.replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPercent(value, digits = 3) {
  if (!Number.isFinite(value)) return "--";
  return `${(value * 100).toFixed(digits)}%`;
}

function formatSignedMoney(value) {
  if (!Number.isFinite(value)) return "--";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${money.format(value)}`;
}

function formatFactor(value) {
  if (!Number.isFinite(value)) return "--";
  return value.toFixed(4).replace(/0+$/g, "").replace(/\.$/g, "");
}

function calculate(values) {
  const currentEtr = values.taxes2025 && values.value2025
    ? values.taxes2025 / values.value2025
    : null;
  const growthFactor = values.valueGrowth > -1
    ? (1 + values.budgetGrowth) / (1 + values.valueGrowth)
    : null;
  const adjustedEtr = Number.isFinite(currentEtr) && Number.isFinite(growthFactor)
    ? currentEtr * growthFactor
    : null;
  const estimatedTaxes = Number.isFinite(adjustedEtr) && values.value2026
    ? values.value2026 * adjustedEtr
    : null;
  const sameRateTaxes = Number.isFinite(currentEtr) && values.value2026
    ? values.value2026 * currentEtr
    : null;
  const annualChange = Number.isFinite(estimatedTaxes) && values.taxes2025
    ? estimatedTaxes - values.taxes2025
    : null;
  const sameRateAnnualChange = Number.isFinite(sameRateTaxes) && values.taxes2025
    ? sameRateTaxes - values.taxes2025
    : null;

  return {
    currentEtr,
    growthFactor,
    adjustedEtr,
    sameRateTaxes,
    sameRateAnnualChange,
    sameRateMonthlyChange: Number.isFinite(sameRateAnnualChange) ? sameRateAnnualChange / 12 : null,
    estimatedTaxes,
    annualChange,
    monthlyChange: Number.isFinite(annualChange) ? annualChange / 12 : null
  };
}

function setOutput(name, value) {
  document.querySelectorAll(`[data-model-output="${name}"]`).forEach(element => {
    element.textContent = value;
  });
}

function readValues() {
  const input = key => document.querySelector(`[data-calc-input="${key}"]`)?.value;
  return {
    taxes2025: numberFromInput(input("taxes2025")),
    value2025: numberFromInput(input("value2025")),
    value2026: numberFromInput(input("value2026")),
    valueGrowth: (numberFromInput(input("valueGrowth")) ?? 0) / 100,
    budgetGrowth: (numberFromInput(input("budgetGrowth")) ?? 0) / 100
  };
}

function updateCalculator() {
  const values = readValues();
  const result = calculate(values);
  const budgetFactor = 1 + values.budgetGrowth;
  const valueFactor = 1 + values.valueGrowth;

  setOutput("currentEtr", formatPercent(result.currentEtr));
  setOutput("valueGrowth", formatPercent(values.valueGrowth, 2));
  setOutput("budgetGrowth", formatPercent(values.budgetGrowth, 2));
  setOutput("adjustedEtr", formatPercent(result.adjustedEtr));
  setOutput("sameRateTaxes", money.format(result.sameRateTaxes || 0));
  setOutput("sameRateAnnualChange", formatSignedMoney(result.sameRateAnnualChange));
  setOutput("sameRateMonthlyChange", formatSignedMoney(result.sameRateMonthlyChange));
  setOutput("estimatedTaxes", money.format(result.estimatedTaxes || 0));
  setOutput("annualChange", formatSignedMoney(result.annualChange));
  setOutput("monthlyChange", formatSignedMoney(result.monthlyChange));

  setOutput(
    "currentEtrMath",
    `${money.format(values.taxes2025 || 0)} ÷ ${money.format(values.value2025 || 0)} = ${formatPercent(result.currentEtr)}`
  );
  setOutput(
    "adjustedEtrMath",
    `${formatPercent(result.currentEtr)} × (${formatFactor(budgetFactor)} ÷ ${formatFactor(valueFactor)}) = ${formatPercent(result.adjustedEtr)}`
  );
  setOutput(
    "taxMath",
    `${money.format(values.value2026 || 0)} × ${formatPercent(result.adjustedEtr)} = ${money.format(result.estimatedTaxes || 0)}`
  );
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-calc-input]").forEach(input => {
    input.addEventListener("input", updateCalculator);
    input.addEventListener("change", updateCalculator);
  });
  updateCalculator();
});
