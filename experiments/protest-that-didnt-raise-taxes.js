const articleAnalyticsContext = {
  allowExperimentAnalytics: true,
  articleId: "protest-paradox",
  articleTitle: "Assessment Up. Protest Denied. Taxes Down.",
  contentType: "case-study",
  county: "gage",
  parcelId: "004817000",
  propertyClass: "Agricultural"
};

let trackArticleInteractionEvent = () => {};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const wholeMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

async function initArticleAnalytics() {
  if (window.location.protocol === "file:") return;

  try {
    const analytics = await import("../src/visit-analytics.js");
    trackArticleInteractionEvent = analytics.trackArticleInteraction;
    analytics.trackArticleView(articleAnalyticsContext);
  } catch {
    // Analytics should never interrupt the case study or calculator.
  }
}

function numberFromInput(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(`${value}`.replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPercent(value, digits = 3) {
  if (!Number.isFinite(value)) return "--";
  return `${(value * 100).toFixed(digits)}%`;
}

function formatInputPercent(value, digits = 2) {
  if (!Number.isFinite(value)) return "";
  return `${value.toFixed(digits)}%`;
}

function formatCalculatorInput(input) {
  const value = numberFromInput(input.value);
  if (value === null) {
    input.value = "";
    return;
  }

  if (input.dataset.format === "money-cents") {
    input.value = money.format(value);
    return;
  }

  if (input.dataset.format === "money-whole") {
    input.value = wholeMoney.format(value);
    return;
  }

  if (input.dataset.format === "percent") {
    input.value = formatInputPercent(value);
  }
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

function formatAndUpdateInput(input) {
  formatCalculatorInput(input);
  updateCalculator();
}

function trackScrollDepth() {
  const thresholds = [25, 50, 75, 90, 100];
  const reached = new Set();
  let ticking = false;

  const measure = () => {
    ticking = false;

    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    const viewportBottom = window.scrollY + window.innerHeight;
    const scrollableHeight = Math.max(1, documentHeight - window.innerHeight);
    const depth = Math.min(100, Math.round(((viewportBottom - window.innerHeight) / scrollableHeight) * 100));

    thresholds.forEach(threshold => {
      if (depth >= threshold && !reached.has(threshold)) {
        reached.add(threshold);
        trackArticleInteractionEvent("scroll_depth", {
          scrollDepthPercent: threshold
        });
      }
    });
  };

  const requestMeasure = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(measure);
  };

  window.addEventListener("scroll", requestMeasure, { passive: true });
  window.addEventListener("resize", requestMeasure);
  requestMeasure();
}

function trackSectionReach() {
  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const section = entry.target;
      trackArticleInteractionEvent("section_reached", {
        section: section.getAttribute("aria-labelledby") || section.querySelector(".kicker")?.textContent?.trim() || ""
      });
      observer.unobserve(section);
    });
  }, {
    rootMargin: "0px 0px -45% 0px",
    threshold: 0.2
  });

  document.querySelectorAll(".case-article > .chapter").forEach(section => {
    observer.observe(section);
  });
}

function trackCalculatorUse() {
  let calculatorFocused = false;
  let inputTimer = null;

  document.querySelectorAll("[data-calc-input]").forEach(input => {
    input.addEventListener("focus", () => {
      if (calculatorFocused) return;
      calculatorFocused = true;
      trackArticleInteractionEvent("calculator_focus", {
        field: input.dataset.calcInput || ""
      });
    });

    input.addEventListener("input", () => {
      window.clearTimeout(inputTimer);
      inputTimer = window.setTimeout(() => {
        const values = readValues();
        const result = calculate(values);
        trackArticleInteractionEvent("calculator_change", {
          field: input.dataset.calcInput || "",
          value2025: values.value2025,
          value2026: values.value2026,
          valueGrowthPercent: Number.isFinite(values.valueGrowth) ? Math.round(values.valueGrowth * 10000) / 100 : null,
          budgetGrowthPercent: Number.isFinite(values.budgetGrowth) ? Math.round(values.budgetGrowth * 10000) / 100 : null,
          estimatedAnnualChange: Number.isFinite(result.annualChange) ? Math.round(result.annualChange) : null
        });
      }, 1200);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initArticleAnalytics();
  trackScrollDepth();
  trackSectionReach();
  trackCalculatorUse();

  document.querySelectorAll("[data-calc-input]").forEach(input => {
    input.addEventListener("input", updateCalculator);
    input.addEventListener("change", () => {
      formatAndUpdateInput(input);
    });
    input.addEventListener("blur", () => {
      formatAndUpdateInput(input);
    });
    input.addEventListener("focusout", () => {
      formatAndUpdateInput(input);
    });
    input.addEventListener("keydown", event => {
      if (event.key !== "Enter") return;
      formatAndUpdateInput(input);
      input.blur();
    });
  });
  updateCalculator();
});
