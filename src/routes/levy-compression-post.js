import { escapeHtml } from "../utils/html.js?v=db3aed6";
import { loadPropertyManifest } from "../data-service.js?v=db3aed6";
import { createGesArticleShell } from "../ges/shell.js?v=db3aed6";

const ARTICLE_AUTHOR_IMAGE = "assets/images/articles/max-quattromani-author.jpg";

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

function normalizePropertyLookup(value) {
  return `${value ?? ""}`.replace(/[^a-z0-9]/gi, "").toLowerCase();
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
        <p class="guided-kicker">Short Answer</p>
        <h2 id="levyOpeningTitle">Usually, no.</h2>
        <p class="prose">A higher assessment matters, but it is only one part of the property-tax equation.</p>
      </header>
      <p class="prose">Your final tax bill depends on three things:</p>
      <ol class="levy-basic-list">
        <li>How much your property value changed.</li>
        <li>How much other property values changed.</li>
        <li>How much local governments need to collect.</li>
      </ol>
      <p class="prose">The important comparison is not just how much your value went up. It is how your increase compares with the rest of the county.</p>
    </section>
  `;
}

function renderTeachingExampleSection() {
  return `
    <section class="tax-article-section tax-story-chapter levy-article-narrow levy-teaching-example" aria-labelledby="levyExampleTitle">
      <div>
        <p class="guided-kicker">Why Taxes Do Not Always Rise With Assessments</p>
        <h2 id="levyExampleTitle">When values rise faster than budgets, tax rates can move down</h2>
      </div>
      <p class="prose">If property values rise faster than local budgets, the tax rate can adjust downward. That rate adjustment is called levy compression.</p>
      <aside class="tax-article-pullquote tax-article-pullquote-subtle">
        If assessments rise about <strong>10%</strong> and budgets rise about <strong>3%</strong>, the levy may compress by about <strong>7%</strong> to balance the difference.
      </aside>
      <p class="prose">This is a teaching shortcut, not an official tax calculation. Your actual bill depends on your taxing districts, exemptions, credits, bond levies, TIF districts, and final budgets.</p>
    </section>
  `;
}

function renderDefaultAssumptionsSection() {
  return `
    <section class="tax-article-section tax-story-chapter levy-assumptions-snapshot levy-article-narrow" aria-labelledby="levyDefaultsTitle">
      <div class="levy-article-copy">
        <p class="guided-kicker">Default Assumptions</p>
        <h2 id="levyDefaultsTitle">The calculator starts with countywide estimates</h2>
        <p class="prose">Most homeowners can leave these alone. They are starting points, not final tax rates.</p>
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
          <span>Effective tax rate placeholder</span>
          <strong>1.254%</strong>
          <p>The 2025 county-wide average shown only until a parcel-specific effective tax rate can be estimated.</p>
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
          <p class="guided-kicker">Plain-Language Terms</p>
          <h2 id="levyExplainerTitle">A few words explain most of the tax math</h2>
          <p class="prose">Assessments distribute value among properties. Budgets determine how much public money must be collected. Levies convert those budget requests into tax rates.</p>
          <p class="prose">If the whole tax base grows, the same budget can be funded with a lower rate. If budgets also rise, the final levy depends on the relationship between budget growth and value growth.</p>
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
        <p class="guided-kicker">Estimate Your Own Result</p>
        <h2 id="levyCalculatorTitle">Enter your numbers to see a rough estimate</h2>
        <p class="prose">This is not a tax bill. It is a quick way to see how assessment changes, countywide value growth, and budget growth can work together.</p>
      </div>
      <form class="levy-calculator-form" data-levy-calculator novalidate>
        <section class="levy-primary-input-group" aria-labelledby="levyPrimaryInputsTitle">
          <p class="guided-kicker" id="levyPrimaryInputsTitle">Start With These Three Numbers</p>
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
            <p class="guided-kicker" id="levyAssumptionControlsTitle">Optional Assumptions</p>
            <p>Most homeowners can leave these alone. The default values use countywide estimates.</p>
          </div>
          <div class="levy-assumption-inputs">
            ${inputField({ id: "levyBudgetIncrease", label: "Budget growth", value: DEFAULTS.budgetIncrease.toFixed(2), suffix: "%" })}
            ${inputField({ id: "levyValueGrowth", label: "Countywide value growth", value: DEFAULTS.valueGrowth.toFixed(2), suffix: "%" })}
          </div>
          ${inputField({
            id: "levyCurrentEtrOverride",
            label: "Effective tax rate",
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
              ${calculationStep("currentEtr", "Step 1", "Current effective tax rate", "Start with the rate implied by 2025 taxes and value.", "2025 taxes ÷ 2025 assessed value")}
              ${calculationStep("newEtr", "Step 2", "Adjusted effective tax rate", "Adjust the current rate for budget growth and countywide value growth.", "Current rate × ((1 + budget growth) ÷ (1 + countywide growth))")}
              ${calculationStep("taxes2026", "Step 3", "Estimated taxes", "Apply the adjusted rate to the 2026 assessed value, then compare it with 2025 taxes.", "2026 assessed value × adjusted rate", "--", "--", "--")}
            </div>
          </section>
        </section>
      </form>
    </section>
  `;
}

function renderScenarioSection() {
  const scenarios = [
    {
      title: "Scenario A",
      facts: ["Your value rises 10%.", "County values rise 10%.", "Budgets rise 3%."],
      result: "Your taxes may rise only slightly."
    },
    {
      title: "Scenario B",
      facts: ["Your value rises 20%.", "County values rise 10%.", "Budgets rise 3%."],
      result: "Your taxes may rise more than average."
    },
    {
      title: "Scenario C",
      facts: ["Your value rises 5%.", "County values rise 10%.", "Budgets rise 3%."],
      result: "Your taxes may rise less than average, or decrease."
    }
  ];

  return `
    <section class="tax-article-section tax-story-chapter levy-scenario-section levy-wide-panel" aria-labelledby="levyScenarioTitle">
      <div class="levy-article-copy">
        <p class="guided-kicker">Three Simple Scenarios</p>
        <h2 id="levyScenarioTitle">Your change matters most when compared with everyone else's change</h2>
      </div>
      <div class="levy-scenario-grid">
        ${scenarios.map(scenario => `
          <article>
            <span>${escapeHtml(scenario.title)}</span>
            <ul>
              ${scenario.facts.map(fact => `<li>${escapeHtml(fact)}</li>`).join("")}
            </ul>
            <p><strong>Result:</strong> ${escapeHtml(scenario.result)}</p>
          </article>
        `).join("")}
      </div>
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
      <p class="prose">This page is designed to show the relationship between value growth, budget growth, levy compression, and estimated taxes. It should not be treated as an official tax calculation.</p>
      <ul>
        ${assumptions.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </section>
  `;
}

function renderClosingSection() {
  return `
    <section class="tax-article-section tax-story-chapter tax-article-closing levy-article-narrow" aria-label="Closing takeaway">
      <p class="guided-kicker">The One Thing To Remember</p>
      <h2>If your assessment rises 20%, your taxes do not automatically rise 20%.</h2>
      <p class="prose">Your final bill depends on countywide value growth, local government budgets, exemptions, credits, bond levies, TIF districts, and your specific taxing districts.</p>
      <p class="prose">Because assessments determine each property's share of the tax base, two properties in the same taxing district can experience very different tax changes even when they are subject to the same levies.</p>
      <p class="tax-article-final-source">Sources: Gage County 2026 Report & Opinion countywide valuation growth figure; local budget-growth and effective-tax-rate assumptions entered by the user.</p>
    </section>
  `;
}

function calculatorValues(form) {
  const taxesPaid = numberFromInput(form.querySelector("#levyTaxesPaid")?.value) ?? DEFAULTS.taxesPaidPlaceholder;
  const assessed2025 = numberFromInput(form.querySelector("#levyAssessed2025")?.value) ?? DEFAULTS.assessed2025Placeholder;
  const assessed2026 = numberFromInput(form.querySelector("#levyAssessed2026")?.value) ?? DEFAULTS.assessed2026Placeholder;
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

function getLevyPropertyRequest() {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  return params.get("parcel")
    ?? params.get("pid")
    ?? params.get("record")
    ?? params.get("recordCard")
    ?? params.get("property");
}

function getRecordCardLookupTokens(property = {}) {
  const pathParts = `${property.recordCardPath ?? ""}`.split("/");
  const fileName = pathParts[pathParts.length - 1] ?? "";
  const recordCardId = fileName.replace(/-record-card\.json$/i, "").replace(/^(residential|commercial|agricultural)-/i, "");

  return [
    property.id,
    property.parcelId,
    property.recordCardPath,
    fileName,
    recordCardId
  ].map(normalizePropertyLookup).filter(Boolean);
}

function findLevyPropertyEntry(manifest, requestedValue) {
  const requestedKey = normalizePropertyLookup(requestedValue);
  if (!requestedKey) return null;

  return (manifest.properties ?? []).find(property => {
    const tokens = getRecordCardLookupTokens(property);
    return tokens.some(token => token === requestedKey || token.endsWith(requestedKey));
  }) ?? null;
}

function findYearValue(rows, year, keys = []) {
  const row = Array.isArray(rows) ? rows.find(item => item?.year === year || item?.taxYear === year) : null;
  if (!row) return null;

  for (const key of keys) {
    const value = row[key];
    if (Number.isFinite(value)) return value;
  }

  return null;
}

function getLevyPrefillValues(recordCard) {
  const snapshot = recordCard?.guidedSnapshot ?? {};
  const assessed2026 = findYearValue(snapshot.taxpayerHistory, 2026, ["assessedValue"])
    ?? findYearValue(snapshot.assessedValueBreakdown, 2026, ["total"]);
  const assessed2025 = findYearValue(snapshot.taxpayerHistory, 2025, ["assessedValue"])
    ?? findYearValue(snapshot.assessedValueBreakdown, 2025, ["total"]);
  const taxesPaid = findYearValue(snapshot.taxStatements, 2025, ["netAmountDue", "totalTaxesDue"])
    ?? findYearValue(snapshot.taxpayerHistory, 2025, ["taxes"]);

  return {
    assessed2026,
    assessed2025,
    taxesPaid
  };
}

function getLevyPrefillAddress(property, recordCard) {
  return `${property?.situsAddress ?? recordCard?.guidedSnapshot?.parcel?.situsAddress ?? ""}`.trim();
}

function setInputValue(input, value, formatter = value => `${value}`) {
  if (!input || !Number.isFinite(value)) return;
  input.value = formatter(value);
}

function applyLevyPrefill(form, values, address = "") {
  setInputValue(form.querySelector("#levyAssessed2026"), values.assessed2026, wholeMoneyFormatter.format);
  setInputValue(form.querySelector("#levyAssessed2025"), values.assessed2025, wholeMoneyFormatter.format);
  setInputValue(form.querySelector("#levyTaxesPaid"), values.taxesPaid, moneyFormatter.format);

  const title = form.closest(".levy-calculator-section")?.querySelector("#levyCalculatorTitle");
  if (title && address) title.textContent = `See a rough estimate for ${address}`;

  form.querySelector("#levyAssessed2025")?.dispatchEvent(new Event("input", { bubbles: true }));
}

async function hydrateLevyCalculatorFromUrl(form) {
  const requestedValue = getLevyPropertyRequest();
  if (!requestedValue) return;

  try {
    const manifest = await loadPropertyManifest();
    const property = findLevyPropertyEntry(manifest, requestedValue);
    if (!property?.recordCardPath) return;

    const response = await fetch(property.recordCardPath);
    if (!response.ok) return;

    const recordCard = await response.json();
    applyLevyPrefill(form, getLevyPrefillValues(recordCard), getLevyPrefillAddress(property, recordCard));
  } catch (error) {
    console.warn("Unable to prefill levy compression estimator from the requested property.", error);
  }
}

function setSummary(form, id, value) {
  const target = form.querySelector(`[data-levy-summary="${id}"]`);
  if (target) target.textContent = value;
}

function setTextWithLineBreaks(target, value) {
  if (!target) return;
  const text = String(value);
  if (!text.includes("\n")) {
    target.textContent = text;
    return;
  }

  target.replaceChildren(
    ...text.split("\n").map(line => {
      const span = document.createElement("span");
      span.textContent = line;
      return span;
    })
  );
}

function setCalculationStep(form, id, formula, substitution = "--", result = "--", secondary = "--") {
  const formulaTarget = form.querySelector(`[data-levy-step-formula="${id}"]`);
  const substitutionTarget = form.querySelector(`[data-levy-step-substitution="${id}"]`);
  const resultTarget = form.querySelector(`[data-levy-step-result="${id}"]`);
  const secondaryTarget = form.querySelector(`[data-levy-step-secondary="${id}"]`);
  if (formulaTarget) formulaTarget.textContent = formula;
  if (substitutionTarget) substitutionTarget.textContent = substitution;
  if (resultTarget) resultTarget.textContent = result;
  setTextWithLineBreaks(secondaryTarget, secondary);
}

function setDefaultEquations(form) {
  setCalculationStep(form, "currentEtr", "2025 taxes ÷ 2025 assessed value");
  setCalculationStep(form, "newEtr", "Current rate × ((1 + budget growth) ÷ (1 + countywide growth))");
  setCalculationStep(form, "taxes2026", "2026 assessed value × adjusted rate");
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
    "Current rate × ((1 + budget growth) ÷ (1 + countywide growth))",
    `${formatPercent(currentEtr)} × (${formatFactor(budgetFactor)} ÷ ${formatFactor(valueGrowthFactor)})`,
    formatPercent(newEtr),
    `Estimated compression: ${formatPercent(compression, 2)}`
  );
  setCalculationStep(
    form,
    "taxes2026",
    "2026 assessed value × adjusted rate",
    `${formatMoney(values.assessed2026)} × ${formatPercent(newEtr)}`,
    formatMoney(estimatedTaxes),
    `Yearly: ${formatSignedMoney(annualChange)}\nMonthly: ${formatSignedMoney(monthlyChange)}`
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
      ? "2025 effective tax rate"
      : "Effective tax rate";
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
  hydrateLevyCalculatorFromUrl(form);
}

export function isLevyCompressionPostRequest(searchParams = new URLSearchParams(window.location.search)) {
  return searchParams.get("article") === "levy-compression";
}

export function renderLevyCompressionPost() {
  const shell = createGesArticleShell({
    htmlClasses: ["levy-compression-shell-route"],
    routeName: "levy-compression"
  });
  if (!shell?.coverRegion) return;
  const pageTitle = shell.coverRegion;
  const canvas = shell.bodyRegion;

  shell.setCover(`
    <div class="comp-page-title levy-page-title">
      <p class="guided-kicker">Educational Post</p>
      <h1>Your Assessment Went Up. Does That Mean Your Tax Bill Will Go Up Just as Much?</h1>
      <p class="prose">A plain-language guide for homeowners worried about rising valuations.</p>
      <div class="levy-author-byline">
        <div class="article-author-attribution">
          <img class="article-author-photo" src="${ARTICLE_AUTHOR_IMAGE}" alt="" loading="lazy" decoding="async" />
          <p>By Max Quattromani</p>
        </div>
      </div>
    </div>
  `);

  shell.setBody(`
    <article class="tax-shorthand-page levy-compression-page tax-article-panel" aria-label="Levy compression educational article">
      ${renderOpeningSection()}
      ${renderTeachingExampleSection()}
      ${renderCalculatorSection()}
      ${renderScenarioSection()}
      ${renderExplainerSection()}
      ${renderDefaultAssumptionsSection()}
      ${renderAssumptionsSection()}
      ${renderClosingSection()}
    </article>
  `);

  initLevyCompressionCalculator(canvas);
}
