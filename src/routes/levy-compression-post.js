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

function inputField({ id, label, value, helper, placeholder = "", suffix = "", inputMode = "decimal", format = "" }) {
  return `
    <div class="levy-calculator-field">
      <label for="${escapeHtml(id)}">${escapeHtml(label)}</label>
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
      ${helper ? `<p>${escapeHtml(helper)}</p>` : ""}
    </div>
  `;
}

function kpiCard(id, label, note = "") {
  return `
    <article class="levy-result-card">
      <p>${escapeHtml(label)}</p>
      <strong data-levy-result="${escapeHtml(id)}">--</strong>
      <div class="levy-result-equation" data-levy-equation="${escapeHtml(id)}"></div>
      ${note ? `<span>${escapeHtml(note)}</span>` : ""}
    </article>
  `;
}

function renderOpeningSection() {
  return `
    <section class="tax-article-section tax-story-chapter tax-article-opening" aria-labelledby="levyOpeningTitle">
      <header class="tax-article-header">
        <p class="guided-kicker">Levy Compression</p>
        <h1 id="levyOpeningTitle">Your Value Went Up. Will Your Taxes Go Up By The Same Amount?</h1>
        <p>Probably not dollar-for-dollar. A higher assessment matters, but it is only one part of the property tax equation.</p>
      </header>
      <blockquote>Will my taxes go up as much as my valuation?</blockquote>
      <p>Assessments determine how value is distributed. Budgets determine how much money must be collected. Levies convert those budgets into tax rates.</p>
      <p>When assessed values rise faster than local budgets, the levy rate can fall. That reduction in the levy rate is often called levy compression.</p>
      <aside class="tax-article-pullquote tax-article-pullquote-subtle">
        If assessments rise about <strong>10%</strong> and budgets rise about <strong>3%</strong>, the levy may compress by roughly <strong>7%</strong> to balance the difference.
      </aside>
      <p>That is only a plain-language shortcut. The actual result depends on taxing districts, credits, exemptions, bond levies, TIF, and final budget decisions.</p>
    </section>
  `;
}

function renderDefaultAssumptionsSection() {
  return `
    <section class="tax-article-section tax-story-chapter" aria-labelledby="levyDefaultsTitle">
      <div>
        <p class="guided-kicker">Key Default Assumptions</p>
        <h2 id="levyDefaultsTitle">The calculator starts with countywide assumptions</h2>
      </div>
      <div class="levy-default-kpis" aria-label="Default assumptions">
        <article>
          <span>Countywide valuation growth</span>
          <strong>9.57%</strong>
          <p>Based on the Gage County-wide growth figure from the Report & Opinion.</p>
        </article>
        <article>
          <span>Expected budget increase</span>
          <strong>3.00%</strong>
          <p>An assumption/example for budget growth, not a guarantee.</p>
        </article>
        <article>
          <span>Countywide ETR placeholder</span>
          <strong>1.254%</strong>
          <p>A broad county average shown only until a parcel-specific ETR can be estimated.</p>
        </article>
      </div>
    </section>
  `;
}

function renderExplainerSection() {
  const items = [
    ["Assessments", "decide how the tax base is divided among properties."],
    ["Budgets", "decide how much public money must be collected."],
    ["Levies", "turn those budget requests into tax rates."],
    ["Compression", "can reduce the rate when the tax base grows faster than budgets."]
  ];

  return `
    <section class="tax-article-section tax-story-chapter" aria-labelledby="levyExplainerTitle">
      <div class="tax-article-two-column">
        <div>
          <p class="guided-kicker">What Is Levy Compression?</p>
          <h2 id="levyExplainerTitle">A rising value does not automatically create the same percent tax increase</h2>
          <p>If the whole tax base grows, the same budget can be funded with a lower rate. If budgets also rise, the final levy depends on the relationship between budget growth and value growth.</p>
          <p>The important comparison is not only how much your value changed. It is how your value changed compared with the overall tax base and final budget requests.</p>
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
    <section class="tax-article-section tax-story-chapter levy-calculator-section" aria-labelledby="levyCalculatorTitle">
      <div>
        <p class="guided-kicker">Interactive Calculator</p>
        <h2 id="levyCalculatorTitle">Estimate a future ETR and tax bill</h2>
        <p>To use this calculator, gather three numbers: your 2025 assessed value, your 2025 net taxes paid after credits and exemptions, and your 2026 assessed value.</p>
      </div>
      <form class="levy-calculator-form" data-levy-calculator novalidate>
        <div class="levy-calculator-inputs">
          ${inputField({
            id: "levyAssessed2025",
            label: "2025 assessed value",
            value: DEFAULTS.assessed2025,
            placeholder: wholeMoneyFormatter.format(DEFAULTS.assessed2025Placeholder),
            format: "money"
          })}
          ${inputField({
            id: "levyTaxesPaid",
            label: "2025 taxes paid",
            value: DEFAULTS.taxesPaid,
            placeholder: moneyFormatter.format(DEFAULTS.taxesPaidPlaceholder),
            format: "money"
          })}
          ${inputField({
            id: "levyCurrentEtrOverride",
            label: "Estimated current ETR",
            value: DEFAULTS.currentEtrOverride,
            placeholder: DEFAULTS.currentEtrOverridePlaceholder,
            suffix: "%"
          })}
          ${inputField({
            id: "levyAssessed2026",
            label: "2026 assessed value",
            value: DEFAULTS.assessed2026,
            placeholder: wholeMoneyFormatter.format(DEFAULTS.assessed2026Placeholder),
            format: "money"
          })}
          ${inputField({ id: "levyBudgetIncrease", label: "Expected budget increase", value: DEFAULTS.budgetIncrease.toFixed(2), suffix: "%" })}
          ${inputField({ id: "levyValueGrowth", label: "Countywide valuation growth", value: DEFAULTS.valueGrowth.toFixed(2), suffix: "%" })}
        </div>
        <p class="levy-calculator-status" data-levy-status aria-live="polite"></p>
        <div class="levy-result-grid" aria-label="Estimated tax results">
          ${kpiCard("currentEtr", "Current ETR")}
          ${kpiCard("compression", "Estimated Levy Compression")}
          ${kpiCard("newEtr", "Estimated New ETR")}
          ${kpiCard("taxes2026", "Estimated 2026 Taxes")}
          ${kpiCard("annualChange", "Estimated Annual Change")}
          ${kpiCard("monthlyChange", "Estimated Monthly Change")}
        </div>
        <section class="levy-full-equation" aria-labelledby="levyFullEquationTitle">
          <p id="levyFullEquationTitle">Interactive Math Equation</p>
          <div data-levy-full-equation></div>
        </section>
      </form>
    </section>
  `;
}

function renderMathWalkthroughSection() {
  return `
    <section class="tax-article-section tax-story-chapter" aria-labelledby="levyMathTitle">
      <div>
        <p class="guided-kicker">Teaching Math</p>
        <h2 id="levyMathTitle">The formula separates budget growth from value growth</h2>
      </div>
      <div class="tax-prediction-math-card levy-math-card">
        <div>
          <span>Current ETR</span>
          <strong>1.254%</strong>
        </div>
        <div>
          <span>Budget Increase</span>
          <strong>3%</strong>
        </div>
        <div>
          <span>Countywide Value Growth</span>
          <strong>9.57%</strong>
        </div>
        <div class="tax-prediction-equation-line">
          <span>Levy Compression</span>
          <strong>1 - (1.03 / 1.0957) = 6.00%</strong>
        </div>
        <footer>
          <span>Preferred calculator formula</span>
          <strong>New ETR = 1.254% x (1.03 / 1.0957) = 1.179%</strong>
          <em>The calculator uses the entered countywide growth and budget-growth assumptions.</em>
        </footer>
      </div>
      <div class="tax-estimate-block levy-simplified-block">
        <div>
          <span>Simplified teaching example</span>
          <strong>1.254% x 1.03 x 0.94</strong>
        </div>
        <div class="tax-estimate-equation">
          <span>New ETR</span>
          <strong>1.214999% ≈ 1.215%</strong>
        </div>
      </div>
      <p>The simplified example uses a rounded 6% compression assumption. The calculator uses the actual entered countywide growth and budget-growth assumptions, which produce a different compression estimate when countywide growth is 9.57%.</p>
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
    <section class="tax-article-section tax-story-chapter levy-assumptions-section" aria-labelledby="levyAssumptionsTitle">
      <div>
        <p class="guided-kicker">Assumptions And Limits</p>
        <h2 id="levyAssumptionsTitle">This is an estimate, not a tax bill</h2>
      </div>
      <p>This page is designed to teach the relationship between value growth, budget growth, levy compression, and estimated taxes. It should not be treated as an official tax calculation.</p>
      <ul>
        ${assumptions.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </section>
  `;
}

function renderClosingSection() {
  return `
    <section class="tax-article-section tax-story-chapter tax-article-closing" aria-label="Closing takeaway">
      <p>If your valuation increased sharply, that does not automatically mean your taxes will rise by the same percentage. Levy compression is the mechanism that can reduce the tax rate when values rise faster than budgets. The important question is not just how much your value changed, but how your value changed compared with the overall tax base and final budget requests.</p>
      <p class="tax-article-final-source">Sources: Gage County Report & Opinion countywide valuation growth figure; local budget-growth and ETR assumptions entered by the user.</p>
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

function setResult(form, id, value) {
  const target = form.querySelector(`[data-levy-result="${id}"]`);
  if (target) target.textContent = value;
}

function setEquation(form, id, value) {
  const target = form.querySelector(`[data-levy-equation="${id}"]`);
  if (target) target.textContent = value;
}

function setFullEquation(form, value) {
  const target = form.querySelector("[data-levy-full-equation]");
  if (target) target.textContent = value;
}

function setDefaultEquations(form) {
  setEquation(form, "currentEtr", "Current ETR = 2025 taxes paid / 2025 assessed value");
  setEquation(form, "compression", "Compression = 1 - ((1 + budget increase) / (1 + countywide growth))");
  setEquation(form, "newEtr", "New ETR = current ETR x ((1 + budget increase) / (1 + countywide growth))");
  setEquation(form, "taxes2026", "2026 taxes = 2026 assessed value x estimated new ETR");
  setEquation(form, "annualChange", "Annual change = estimated 2026 taxes - 2025 taxes paid");
  setEquation(form, "monthlyChange", "Monthly change = annual change / 12");
  setFullEquation(
    form,
    "Current ETR = 2025 taxes / 2025 value; new ETR = current ETR x ((1 + budget increase) / (1 + countywide growth)); 2026 taxes = 2026 value x new ETR; monthly change = (2026 taxes - 2025 taxes) / 12."
  );
}

function updateCalculator(form) {
  const status = form.querySelector("[data-levy-status]");
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
    setResult(form, "currentEtr", "--");
    setResult(form, "compression", "--");
    setResult(form, "newEtr", "--");
    setResult(form, "taxes2026", "--");
    setResult(form, "annualChange", "--");
    setResult(form, "monthlyChange", "--");
    if (status) status.textContent = "Enter positive tax and value amounts to estimate a future tax bill.";
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

  setResult(form, "currentEtr", formatPercent(currentEtr));
  setResult(form, "compression", formatPercent(compression, 2));
  setResult(form, "newEtr", formatPercent(newEtr));
  setResult(form, "taxes2026", formatMoney(estimatedTaxes));
  setResult(form, "annualChange", formatSignedMoney(annualChange));
  setResult(form, "monthlyChange", formatSignedMoney(monthlyChange));
  setEquation(form, "currentEtr", `${formatMoney(values.taxesPaid)} / ${formatMoney(values.assessed2025)} = ${formatPercent(currentEtr)}`);
  setEquation(form, "compression", `1 - (${formatFactor(budgetFactor)} / ${formatFactor(valueGrowthFactor)}) = ${formatPercent(compression, 2)}`);
  setEquation(form, "newEtr", `${formatPercent(currentEtr)} x (${formatFactor(budgetFactor)} / ${formatFactor(valueGrowthFactor)}) = ${formatPercent(newEtr)}`);
  setEquation(form, "taxes2026", `${formatMoney(values.assessed2026)} x ${formatPercent(newEtr)} = ${formatMoney(estimatedTaxes)}`);
  setEquation(form, "annualChange", `${formatMoney(estimatedTaxes)} - ${formatMoney(values.taxesPaid)} = ${formatSignedMoney(annualChange)}`);
  setEquation(form, "monthlyChange", `${formatSignedMoney(annualChange)} / 12 = ${formatSignedMoney(monthlyChange)}`);
  setFullEquation(
    form,
    `${formatMoney(values.taxesPaid)} / ${formatMoney(values.assessed2025)} = ${formatPercent(currentEtr)} current ETR; ` +
      `${formatPercent(currentEtr)} x (${formatFactor(budgetFactor)} / ${formatFactor(valueGrowthFactor)}) = ${formatPercent(newEtr)} new ETR; ` +
      `${formatMoney(values.assessed2026)} x ${formatPercent(newEtr)} = ${formatMoney(estimatedTaxes)} estimated 2026 taxes; ` +
      `(${formatMoney(estimatedTaxes)} - ${formatMoney(values.taxesPaid)}) / 12 = ${formatSignedMoney(monthlyChange)} estimated monthly change.`
  );
  if (status) {
    status.textContent = `Using a ${(values.budgetIncrease * 100).toFixed(2)}% budget increase and ${(values.valueGrowth * 100).toFixed(2)}% countywide value growth.`;
  }
}

function initLevyCompressionCalculator(root = document) {
  const form = root.querySelector("[data-levy-calculator]");
  if (!form) return;
  const assessed2025Input = form.querySelector("#levyAssessed2025");
  const taxesPaidInput = form.querySelector("#levyTaxesPaid");
  const currentEtrInput = form.querySelector("#levyCurrentEtrOverride");
  let currentEtrWasEdited = false;

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
        syncCurrentEtrInput();
      }
      updateCalculator(form);
    });
    input.addEventListener("blur", () => {
      formatInputValue(input);
      if (input !== currentEtrInput) syncCurrentEtrInput();
      updateCalculator(form);
    });
  });
  form.querySelectorAll("[data-format='money']").forEach(formatInputValue);
  syncCurrentEtrInput();
  updateCalculator(form);
}

export function isLevyCompressionPostRequest(searchParams = new URLSearchParams(window.location.search)) {
  return searchParams.get("article") === "levy-compression";
}

export function renderLevyCompressionPost() {
  const pageTitle = document.getElementById("pageTitle");
  const canvas = document.querySelector(".mobile-review-canvas");
  if (!canvas) return;

  document.querySelector(".guide-review-header")?.classList.add("hidden");
  document.querySelectorAll("[data-guided-panel]").forEach(panel => panel.classList.add("hidden"));
  document.querySelector("[data-footer-resource-shell]")?.classList.add("hidden");

  pageTitle.innerHTML = `
    <div class="comp-page-title">
      <p class="guided-kicker">Educational Post</p>
      <h1>Levy Compression</h1>
      <p>Plain-language tax math for rising valuations.</p>
    </div>
  `;

  canvas.innerHTML = `
    <article class="tax-shorthand-page levy-compression-page tax-article-panel" aria-label="Levy compression educational article">
      ${renderOpeningSection()}
      ${renderDefaultAssumptionsSection()}
      ${renderExplainerSection()}
      ${renderCalculatorSection()}
      ${renderMathWalkthroughSection()}
      ${renderAssumptionsSection()}
      ${renderClosingSection()}
    </article>
  `;

  initLevyCompressionCalculator(canvas);
}
