import { escapeHtml } from "../utils/html.js";

const DEFAULTS = {
  taxesPaid: "",
  assessed2025: "",
  assessed2025Placeholder: 166624,
  taxesPaidPlaceholder: 2089.46,
  assessed2026: "",
  assessed2026Placeholder: 203170,
  budgetIncrease: 3,
  valueGrowth: 9.57,
  currentEtrOverride: "",
  currentEtrOverridePlaceholder: "1.254"
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const wholeMoneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

function numberFromInput(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(`${value}`.replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMoney(value) {
  if (!Number.isFinite(value)) return "--";
  return moneyFormatter.format(value);
}

function formatSignedMoney(value) {
  if (!Number.isFinite(value)) return "--";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${moneyFormatter.format(value)}`;
}

function formatPercent(value, digits = 3) {
  if (!Number.isFinite(value)) return "--";
  return `${(value * 100).toFixed(digits)}%`;
}

function formatInputPercent(value, digits = 3) {
  if (!Number.isFinite(value)) return "";
  return (value * 100).toFixed(digits);
}

function formatInputMoney(value) {
  if (!Number.isFinite(value)) return "";
  return wholeMoneyFormatter.format(value);
}

function formatFactor(value) {
  if (!Number.isFinite(value)) return "--";
  return value.toFixed(4).replace(/0+$/g, "").replace(/\.$/g, "");
}

function inputField({ id, label, visualLabel, value, helper, placeholder = "", suffix = "", inputMode = "decimal", format = "", step = "", source = "" }) {
  const labelMarkup = visualLabel
    ? `<span aria-hidden="true">${escapeHtml(visualLabel)}</span><span class="levy-sr-only">${escapeHtml(label)}</span>`
    : escapeHtml(label);
  const inputMarkup = `
    <div class="levy-input-shell">
        <input
          id="${escapeHtml(id)}"
          name="${escapeHtml(id)}"
          type="text"
          inputmode="${escapeHtml(inputMode)}"
          value="${escapeHtml(value)}"
          ${placeholder ? `placeholder="${escapeHtml(placeholder)}"` : ""}
          ${format ? `data-format="${escapeHtml(format)}"` : ""}
        />
        ${suffix ? `<span aria-hidden="true">${escapeHtml(suffix)}</span>` : ""}
      </div>
  `;
  if (step || source) {
    return `
      <div class="levy-calculator-field levy-stepped-input-field">
        ${step ? `<span class="levy-input-step-number" aria-hidden="true">${escapeHtml(step)}</span>` : ""}
        <div class="levy-stepped-input-card">
          <label for="${escapeHtml(id)}">${labelMarkup}</label>
          ${source ? `<p>${escapeHtml(source)}</p>` : ""}
          ${inputMarkup}
        </div>
        ${helper ? `<p>${escapeHtml(helper)}</p>` : ""}
      </div>
    `;
  }
  return `
    <div class="levy-calculator-field">
      <label for="${escapeHtml(id)}">${labelMarkup}</label>
      ${inputMarkup}
      ${helper ? `<p>${escapeHtml(helper)}</p>` : ""}
    </div>
  `;
}

function summaryCard(id, label) {
  return `
    <article>
      <p>${escapeHtml(label)}</p>
      <strong data-levy-summary="${escapeHtml(id)}">--</strong>
    </article>
  `;
}

function calculationStep(id, step, title, purpose, formula = "--", substitution = "--", result = "--", secondary = "") {
  return `
    <article class="levy-calculation-step" data-levy-step="${escapeHtml(id)}">
      <div class="levy-step-header">
        <span>${escapeHtml(step)}</span>
        <h3>${escapeHtml(title)}</h3>
      </div>
      <p>${escapeHtml(purpose)}</p>
      <dl>
        <div>
          <dt>Formula</dt>
          <dd data-levy-step-formula="${escapeHtml(id)}">${escapeHtml(formula)}</dd>
        </div>
        <div>
          <dt>Substitution</dt>
          <dd data-levy-step-substitution="${escapeHtml(id)}">${escapeHtml(substitution)}</dd>
        </div>
        <div>
          <dt>Result</dt>
          <dd data-levy-step-result="${escapeHtml(id)}">${escapeHtml(result)}</dd>
        </div>
        ${secondary ? `
          <div>
            <dt>Impact</dt>
            <dd data-levy-step-secondary="${escapeHtml(id)}">${escapeHtml(secondary)}</dd>
          </div>
        ` : ""}
      </dl>
    </article>
  `;
}

function renderOpeningSection() {
  return `
    <section class="tax-article-section tax-story-chapter tax-article-opening levy-article-narrow" aria-labelledby="levyOpeningTitle">
      <header class="tax-article-header">
        <p class="guided-kicker">Opening Question</p>
        <h1 id="levyOpeningTitle">Your Value Went Up. Will Your Taxes Go Up By The Same Amount?</h1>
        <p>Not necessarily. A higher assessment matters, but it is only one part of the property tax equation.</p>
      </header>
      <p>The important comparison is not only how much your value changed. It is how your value changed compared with the overall tax base and the final budget requests from your taxing districts.</p>
    </section>
  `;
}

function renderTeachingExampleSection() {
  return `
    <section class="tax-article-section tax-story-chapter levy-article-narrow levy-teaching-example" aria-labelledby="levyExampleTitle">
      <div>
        <p class="guided-kicker">Simple Teaching Example</p>
        <h2 id="levyExampleTitle">When values rise faster than budgets, the tax rate can move down</h2>
      </div>
      <aside class="tax-article-pullquote tax-article-pullquote-subtle">
        If assessments rise about <strong>10%</strong> and budgets rise about <strong>3%</strong>, the levy rate could decline enough to offset part of that growth.
      </aside>
      <p>This is a plain-language shortcut, not an exact statutory calculation. The actual result depends on final budgets, taxing districts, credits, exemptions, bond levies, TIF, and other property-specific factors.</p>
    </section>
  `;
}

function renderDefaultAssumptionsSection() {
  return `
    <section class="tax-article-section tax-story-chapter levy-assumptions-snapshot levy-article-narrow" aria-labelledby="levyDefaultsTitle">
      <div class="levy-article-copy">
        <p class="guided-kicker">Key Assumptions</p>
        <h2 id="levyDefaultsTitle">The estimator starts with countywide assumptions</h2>
        <p>These defaults are starting points for the calculator. They are assumptions or countywide figures, not final tax rates.</p>
      </div>
      <div class="levy-default-kpis" aria-label="Default assumptions">
        <article>
          <span>Countywide valuation growth</span>
          <strong>9.57%</strong>
          <p>Based on the Gage County-wide growth figure from the 2026 Report & Opinion.</p>
        </article>
        <article>
          <span>Expected budget increase</span>
          <strong>3.00%</strong>
          <p>An assumption/example for budget growth, not a guarantee.</p>
        </article>
        <article>
          <span>Countywide ETR placeholder</span>
          <strong>1.254%</strong>
          <p>The 2025 county-wide average shown only until a parcel-specific ETR can be estimated.</p>
        </article>
      </div>
    </section>
  `;
}

function renderExplainerSection() {
  const items = [
    ["Assessments", "determine each property's share of the tax base."],
    ["Budgets", "decide how much public money must be collected."],
    ["Levies", "turn those budget requests into tax rates."],
    ["Compression", "can reduce the rate when the tax base grows faster than budgets."]
  ];

  return `
    <section class="tax-article-section tax-story-chapter levy-article-narrow" aria-labelledby="levyExplainerTitle">
      <div class="tax-article-two-column levy-explainer-layout">
        <div class="levy-article-copy">
          <p class="guided-kicker">What Is Levy Compression?</p>
          <h2 id="levyExplainerTitle">Levy compression is the rate adjustment that can happen when the tax base grows</h2>
          <p>Assessments distribute value among properties. Budgets determine how much public money must be collected. Levies convert those budget requests into tax rates.</p>
          <p>If the whole tax base grows, the same budget can be funded with a lower rate. If budgets also rise, the final levy depends on the relationship between budget growth and value growth.</p>
        </div>
        <div class="levy-explainer-list" aria-label="Tax relationship summary">
          ${items.map(([term, copy]) => `
            <article>
              <strong>${escapeHtml(term)}</strong>
              <p>${escapeHtml(copy)}</p>
            </article>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderCalculatorSection() {
  return `
    <section class="tax-article-section tax-story-chapter levy-calculator-section levy-wide-panel" aria-labelledby="levyCalculatorTitle">
      <div class="levy-calculator-intro">
        <p class="guided-kicker">Embedded Interactive Estimator</p>
        <h2 id="levyCalculatorTitle">Estimate Your Property Tax Impact</h2>
        <p>Enter your assessed values and taxes paid to see how levy compression could affect your estimated tax bill.</p>
      </div>
      <form class="levy-calculator-form" data-levy-calculator novalidate>
        <section class="levy-primary-input-group" aria-labelledby="levyPrimaryInputsTitle">
          <p class="guided-kicker" id="levyPrimaryInputsTitle">What You'll Need</p>
          <div class="levy-calculator-inputs levy-primary-inputs" aria-label="Primary property inputs">
          ${inputField({
            id: "levyAssessed2026",
            label: "2026 assessed value",
            value: DEFAULTS.assessed2026,
            placeholder: wholeMoneyFormatter.format(DEFAULTS.assessed2026Placeholder),
            format: "money",
            step: "1"
          })}
          ${inputField({
            id: "levyAssessed2025",
            label: "2025 assessed value",
            value: DEFAULTS.assessed2025,
            placeholder: wholeMoneyFormatter.format(DEFAULTS.assessed2025Placeholder),
            format: "money",
            step: "2"
          })}
          ${inputField({
            id: "levyTaxesPaid",
            label: "2025 taxes paid",
            value: DEFAULTS.taxesPaid,
            placeholder: moneyFormatter.format(DEFAULTS.taxesPaidPlaceholder),
            format: "money",
            step: "3"
          })}
          </div>
        </section>
        <section class="levy-assumption-controls" aria-labelledby="levyAssumptionControlsTitle">
          <div class="levy-assumption-controls-header">
            <p class="guided-kicker" id="levyAssumptionControlsTitle">Adjust Assumptions</p>
            <p>Test different budget-growth or countywide-growth scenarios.</p>
          </div>
          <div class="levy-assumption-inputs">
            ${inputField({ id: "levyBudgetIncrease", label: "Expected budget increase", visualLabel: "Budget Growth", value: DEFAULTS.budgetIncrease.toFixed(2), suffix: "%" })}
            ${inputField({ id: "levyValueGrowth", label: "Countywide valuation growth", visualLabel: "County Growth", value: DEFAULTS.valueGrowth.toFixed(2), suffix: "%" })}
          </div>
          ${inputField({
            id: "levyCurrentEtrOverride",
            label: "Current county ETR",
            value: DEFAULTS.currentEtrOverride,
            placeholder: DEFAULTS.currentEtrOverridePlaceholder,
            suffix: "%"
          })}
        </section>
        <section class="levy-primary-results" aria-labelledby="levyPrimaryResultsTitle">
          <div>
            <p class="guided-kicker">Live Estimate</p>
            <h3 id="levyPrimaryResultsTitle">Estimated tax impact</h3>
          </div>
          <div class="levy-primary-results-grid">
            ${summaryCard("taxes2026", "Estimated 2026 Taxes")}
            ${summaryCard("annualChange", "Estimated Annual Change")}
            ${summaryCard("monthlyChange", "Estimated Monthly Impact")}
          </div>
        </section>
        <section class="levy-breakdown-section" aria-labelledby="levyBreakdownTitle">
          <header class="levy-section-heading">
            <span class="guided-kicker">Show The Math</span>
            <h3 id="levyBreakdownTitle">See the calculation flow</h3>
          </header>
          <section class="levy-calculation-flow" aria-labelledby="levyCalculationFlowTitle">
            <div class="levy-calculation-flow-header">
              <p class="guided-kicker" id="levyCalculationFlowTitle">Live Calculation Flow</p>
              <p>Each step updates as the estimator values change.</p>
            </div>
            <div class="levy-calculation-step-grid">
              ${calculationStep("currentEtr", "Step 1", "Current ETR", "Start with the effective rate implied by 2025 taxes and value.", "2025 taxes ÷ 2025 assessed value")}
              ${calculationStep("newEtr", "Step 2", "Adjusted ETR", "Adjust the current rate for the relationship between budget growth and countywide value growth.", "Current ETR × ((1 + budget increase) ÷ (1 + countywide growth))")}
              ${calculationStep("taxes2026", "Step 3", "Estimated Taxes", "Apply the adjusted rate to the 2026 assessed value, then compare it with 2025 taxes.", "2026 assessed value × adjusted ETR", "--", "--", "--")}
            </div>
          </section>
        </section>
      </form>
    </section>
  `;
}

function renderAssumptionsSection() {
  const assumptions = [
    "Final budgets are not yet known.",
    "Levy rates are set after values and budget requests are finalized.",
    "Tax credits may change.",
    "Exemptions may change.",
    "Bond levies may affect the result.",
    "TIF districts may affect certain properties.",
    "Different taxing districts may compress differently.",
    "Your personal result may differ from the countywide estimate."
  ];

  return `
    <section class="tax-article-section tax-story-chapter levy-assumptions-section levy-article-narrow" aria-labelledby="levyAssumptionsTitle">
      <header class="levy-section-heading">
        <span class="guided-kicker">Assumptions And Limits</span>
        <h2 id="levyAssumptionsTitle">This is an estimate, not a tax bill</h2>
      </header>
      <p>This page is designed to show the relationship between value growth, budget growth, levy compression, and estimated taxes. It should not be treated as an official tax calculation.</p>
      <ul>
        ${assumptions.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </section>
  `;
}

function renderClosingSection() {
  return `
    <section class="tax-article-section tax-story-chapter tax-article-closing levy-article-narrow" aria-label="Closing takeaway">
      <p>If your valuation increased sharply, that does not automatically mean your taxes will rise by the same percentage. Levy compression is one mechanism that can reduce the tax rate when property values rise faster than local budgets.</p>
      <p>The important question is not simply how much your value changed, but how your value changed relative to the overall tax base. Because assessments determine each property's share of that tax base, two properties in the same taxing district can experience very different tax changes even when they are subject to the same levies.</p>
      <p class="tax-article-final-source">Sources: Gage County 2026 Report & Opinion countywide valuation growth figure; local budget-growth and ETR assumptions entered by the user.</p>
    </section>
  `;
}

function calculatorValues(form) {
  const taxesPaid = numberFromInput(form.querySelector("#levyTaxesPaid")?.value);
  const assessed2025 = numberFromInput(form.querySelector("#levyAssessed2025")?.value);
  const assessed2026 = numberFromInput(form.querySelector("#levyAssessed2026")?.value);
  const budgetIncrease = numberFromInput(form.querySelector("#levyBudgetIncrease")?.value);
  const valueGrowth = numberFromInput(form.querySelector("#levyValueGrowth")?.value);
  const currentEtrOverride = numberFromInput(form.querySelector("#levyCurrentEtrOverride")?.value);

  return {
    taxesPaid,
    assessed2025,
    assessed2026,
    budgetIncrease: budgetIncrease === null ? null : budgetIncrease / 100,
    valueGrowth: valueGrowth === null ? null : valueGrowth / 100,
    currentEtrOverride: currentEtrOverride === null ? null : currentEtrOverride / 100
  };
}

function setSummary(form, id, value) {
  const target = form.querySelector(`[data-levy-summary="${id}"]`);
  if (target) target.textContent = value;
}

function setCalculationStep(form, id, formula, substitution = "--", result = "--", secondary = "--") {
  const formulaTarget = form.querySelector(`[data-levy-step-formula="${id}"]`);
  const substitutionTarget = form.querySelector(`[data-levy-step-substitution="${id}"]`);
  const resultTarget = form.querySelector(`[data-levy-step-result="${id}"]`);
  const secondaryTarget = form.querySelector(`[data-levy-step-secondary="${id}"]`);
  if (formulaTarget) formulaTarget.textContent = formula;
  if (substitutionTarget) substitutionTarget.textContent = substitution;
  if (resultTarget) resultTarget.textContent = result;
  if (secondaryTarget) secondaryTarget.textContent = secondary;
}

function setDefaultEquations(form) {
  setCalculationStep(form, "currentEtr", "2025 taxes ÷ 2025 assessed value");
  setCalculationStep(form, "newEtr", "Current ETR × ((1 + budget increase) ÷ (1 + countywide growth))");
  setCalculationStep(form, "taxes2026", "2026 assessed value × adjusted ETR");
}

function updateCalculator(form) {
  const values = calculatorValues(form);
  const currentEtr = values.currentEtrOverride || (
    values.taxesPaid && values.assessed2025 ? values.taxesPaid / values.assessed2025 : null
  );
  setDefaultEquations(form);

  const hasRequired = values.taxesPaid
    && values.assessed2025
    && values.assessed2026
    && values.budgetIncrease !== null
    && values.valueGrowth !== null
    && currentEtr;

  if (!hasRequired || values.valueGrowth <= -1) {
    setSummary(form, "taxes2026", "--");
    setSummary(form, "annualChange", "--");
    setSummary(form, "monthlyChange", "--");
    return;
  }

  const growthFactor = (1 + values.budgetIncrease) / (1 + values.valueGrowth);
  const compression = 1 - growthFactor;
  const newEtr = currentEtr * growthFactor;
  const estimatedTaxes = values.assessed2026 * newEtr;
  const annualChange = estimatedTaxes - values.taxesPaid;
  const monthlyChange = annualChange / 12;
  const budgetFactor = 1 + values.budgetIncrease;
  const valueGrowthFactor = 1 + values.valueGrowth;

  setSummary(form, "taxes2026", formatMoney(estimatedTaxes));
  setSummary(form, "annualChange", formatSignedMoney(annualChange));
  setSummary(form, "monthlyChange", formatSignedMoney(monthlyChange));
  setCalculationStep(
    form,
    "currentEtr",
    "2025 taxes ÷ 2025 assessed value",
    `${formatMoney(values.taxesPaid)} ÷ ${formatMoney(values.assessed2025)}`,
    formatPercent(currentEtr)
  );
  setCalculationStep(
    form,
    "compression",
    "1 - ((1 + budget increase) ÷ (1 + countywide growth))",
    `1 - (${formatFactor(budgetFactor)} ÷ ${formatFactor(valueGrowthFactor)})`,
    formatPercent(compression, 2)
  );
  setCalculationStep(
    form,
    "newEtr",
    "Current ETR × ((1 + budget increase) ÷ (1 + countywide growth))",
    `${formatPercent(currentEtr)} × (${formatFactor(budgetFactor)} ÷ ${formatFactor(valueGrowthFactor)})`,
    formatPercent(newEtr),
    `Estimated compression: ${formatPercent(compression, 2)}`
  );
  setCalculationStep(
    form,
    "taxes2026",
    "2026 assessed value × adjusted ETR",
    `${formatMoney(values.assessed2026)} × ${formatPercent(newEtr)}`,
    formatMoney(estimatedTaxes),
    `Annual change: ${formatSignedMoney(annualChange)} · Monthly impact: ${formatSignedMoney(monthlyChange)}`
  );
}

function initLevyCompressionCalculator(root = document) {
  const form = root.querySelector("[data-levy-calculator]");
  if (!form) return;
  const assessed2025Input = form.querySelector("#levyAssessed2025");
  const taxesPaidInput = form.querySelector("#levyTaxesPaid");
  const currentEtrInput = form.querySelector("#levyCurrentEtrOverride");
  const currentEtrLabel = form.querySelector("label[for='levyCurrentEtrOverride']");
  let currentEtrWasEdited = false;
  let parcelInputsStarted = false;

  function syncCurrentEtrLabel() {
    if (!currentEtrLabel) return;
    currentEtrLabel.textContent = parcelInputsStarted || currentEtrWasEdited
      ? "2025 ETR"
      : "Current county ETR";
  }

  function syncCurrentEtrInput() {
    if (!currentEtrInput || currentEtrWasEdited) return;
    const taxesPaid = numberFromInput(taxesPaidInput?.value);
    const assessed2025 = numberFromInput(assessed2025Input?.value);
    currentEtrInput.value = taxesPaid && assessed2025
      ? formatInputPercent(taxesPaid / assessed2025)
      : "";
  }

  function formatInputValue(input) {
    if (input?.dataset.format !== "money") return;
    const value = numberFromInput(input.value);
    input.value = value === null ? "" : formatInputMoney(value);
  }

  form.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      if (input === currentEtrInput) {
        currentEtrWasEdited = true;
      } else {
        parcelInputsStarted = true;
        syncCurrentEtrInput();
      }
      syncCurrentEtrLabel();
      updateCalculator(form);
    });
    input.addEventListener("blur", () => {
      formatInputValue(input);
      if (input !== currentEtrInput) syncCurrentEtrInput();
      syncCurrentEtrLabel();
      updateCalculator(form);
    });
  });
  form.querySelectorAll("[data-format='money']").forEach(formatInputValue);
  syncCurrentEtrInput();
  syncCurrentEtrLabel();
  updateCalculator(form);
}

export function isLevyCompressionPostRequest(searchParams = new URLSearchParams(window.location.search)) {
  return searchParams.get("article") === "levy-compression";
}

export function renderLevyCompressionPost() {
  const pageTitle = document.getElementById("pageTitle");
  const canvas = document.querySelector(".mobile-review-canvas");
  if (!canvas) return;

  document.documentElement.classList.add("article-shell-route", "levy-compression-shell-route");
  document.querySelector(".guide-review-header")?.classList.add("hidden");
  document.querySelectorAll("[data-guided-panel]").forEach(panel => panel.classList.add("hidden"));
  document.querySelector("[data-footer-resource-shell]")?.classList.add("hidden");

  pageTitle.innerHTML = `
    <div class="comp-page-title levy-page-title">
      <p class="guided-kicker">Educational Post</p>
      <h1>Levy Compression</h1>
      <p>Why a higher valuation does not automatically mean your taxes rise by the same percentage.</p>
      <div class="levy-author-byline">
        <p>By Max Quattromani</p>
      </div>
    </div>
  `;

  canvas.innerHTML = `
    <article class="tax-shorthand-page levy-compression-page tax-article-panel" aria-label="Levy compression educational article">
      ${renderOpeningSection()}
      ${renderExplainerSection()}
      ${renderTeachingExampleSection()}
      ${renderDefaultAssumptionsSection()}
      ${renderCalculatorSection()}
      ${renderAssumptionsSection()}
      ${renderClosingSection()}
    </article>
  `;

  initLevyCompressionCalculator(canvas);
}
