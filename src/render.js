import {
  calculateEtr,
  formatNullableLevy,
  formatNullableMoney,
  formatNullablePercent,
  money,
  moneyCents,
  percent,
  sumRates
} from "./format.js";
import {
  getPreviousFinalValueHistory,
  getSnapshotHistory,
  sortHistoryDescending
} from "./calculations/history.js";
import {
  buildRecordCorrectionEmailPayload,
  buildRecordCorrectionSubmission,
  generateRecordCorrectionPdf
} from "./recordCorrectionRequest.js";
import { viewHeaderContent } from "./content/view-headers.js";
import { PROPERTY_SELECTION_STORAGE_KEY } from "./data-service.js";
import { propertyRecordSourceText } from "./domain/source-labels.js";
import {
  getClassMarketStats,
  getParcelMarketClass,
  getParcelMarketGroupId
} from "./market-stats.js";
import { displayAddress } from "./utils/address.js";
import { escapeHtml } from "./utils/html.js";

const discrepancyChoices = [
  ["incorrect", "Incorrect"],
  ["missing", "Missing"],
  ["misclassified", "Misclassified"],
  ["needs-review", "Needs review"],
  ["other", "Other"]
];
const discrepancyChoiceLabels = Object.fromEntries(discrepancyChoices);

export function renderStartPage(propertySwitcherContext = {}) {
  renderViewHeader("start", null, propertySwitcherContext);

  document.getElementById("propertyViewContext")?.classList.add("hidden");
  document.querySelector(".guide-review-header")?.classList.add("hidden");
  document.querySelectorAll("[data-guided-panel]").forEach(panel => {
    panel.classList.add("hidden");
  });

  const canvas = document.querySelector(".mobile-review-canvas");
  if (!canvas) return;

  let start = document.getElementById("guidedStartState");
  if (!start) {
    start = document.createElement("section");
    start.id = "guidedStartState";
    canvas.prepend(start);
  }

  start.className = "guided-start-state";
  start.innerHTML = `
    <article class="guided-start-card" aria-labelledby="guidedStartTitle">
      <div class="guided-start-copy">
        <p class="guided-kicker">Ready when you choose a record</p>
        <h2 id="guidedStartTitle">Select a Sample Property to Begin</h2>
        <p>Choose a residential, agricultural, or commercial sample parcel from the property switcher in the header to start the Guided Parcel Review.</p>
      </div>

      <div class="guided-start-callout" aria-label="Where to begin">
        <p class="guided-start-callout-label">Start here</p>
        <p>Use the property switcher above. After you select a sample parcel, this page will load the record, value history, tax context, charts, and guided review steps.</p>
      </div>

      <div class="guided-start-grid" aria-label="What the review covers">
        <section>
          <h3>Value and assessment history</h3>
          <p>See how the sample property's assessed value has moved and which years are still pending or finalized.</p>
        </section>
        <section>
          <h3>Tax impact</h3>
          <p>Connect value movement with levy, credits, effective tax rate, and the latest available tax bill context.</p>
        </section>
        <section>
          <h3>Parcel context</h3>
          <p>Review parcel facts, classification, land details, valuation groups, and practical items to verify.</p>
        </section>
      </div>

      <p class="guided-start-disclaimer">This prototype uses pre-loaded sample records for demonstration, stress testing, and smoke testing. Official records, valuations, and tax determinations remain with the appropriate county offices.</p>
    </article>
  `;
}

function legalReferenceById(legalReferences, id) {
  return (legalReferences?.references || []).find(reference => reference.id === id) ?? null;
}

function statuteNumber(value) {
  return `${value ?? ""}`.match(/\b\d{2}-\d+(?:\.\d+)?\b/)?.[0] ?? "";
}

function legalReferenceForAuthority(legalReferences, authority) {
  const statute = statuteNumber(authority);
  if (!statute) return null;

  return (legalReferences?.references || []).find(reference =>
    statuteNumber(reference.label) === statute
  ) ?? null;
}

function legalReferenceLink(reference, label = reference?.label) {
  if (!reference) return escapeHtml(label);

  const text = label || reference.label;
  const title = reference.title ? ` title="${escapeHtml(reference.title)}"` : "";

  if (!reference.url) {
    return `<span class="legal-reference"${title}>${escapeHtml(text)}</span>`;
  }

  return `<a class="legal-reference" href="${escapeHtml(reference.url)}" target="_blank" rel="noreferrer"${title}>${escapeHtml(text)}</a>`;
}

function legalReferenceHtml(legalReferences, id, fallbackLabel = id) {
  const reference = legalReferenceById(legalReferences, id);

  return legalReferenceLink(reference, reference?.label || fallbackLabel);
}

function legalAuthorityListHtml(authorities, legalReferences) {
  return (authorities || []).map(authority => {
    const reference = legalReferenceForAuthority(legalReferences, authority);

    return legalReferenceLink(reference, authority);
  }).join(", ");
}

export function renderPage(data, imageModal, calendar, recordCard, valuationGroups, governingOffice, summaryContext = {}) {
  document.getElementById("guidedStartState")?.classList.add("hidden");
  document.querySelector(".guide-review-header")?.classList.remove("hidden");
  renderViewHeader("your-property", data.snapshotModel, summaryContext.propertySwitcher);
  renderPropertyViewContext(data, recordCard, valuationGroups);
  renderHeader(data, imageModal, recordCard, valuationGroups);
  renderAssessmentNoticeSummary(data, recordCard);
  renderComparisonShells(data, recordCard, summaryContext);
  renderPropertyDetails(data, recordCard);
  renderDiscrepancyForm(data, recordCard);
  initReportErrorModal(data, recordCard, governingOffice);
  renderSummary(data, recordCard, summaryContext);
  renderHistoryTable(data, recordCard);
  renderPropertyMovementSummary(data);
  renderTaxHistoryTable(data);
  renderLevyTable(data);
  renderSources(data);
}

function renderComparisonShells(data, recordCard, summaryContext = {}) {
  renderValueTaxHistoryShell();
  renderTaxHistoryShell();
  renderTaxDistributionShell(data);
  renderAssessmentAccuracyShell(summaryContext);
  renderAssessmentSnapshotSource(data, recordCard);
}

function renderAssessmentSnapshotSource(data, recordCard) {
  const sourceNote = document.querySelector("[data-assessment-snapshot-source]");
  if (!sourceNote) return;

  sourceNote.textContent = propertyRecordSourceText(data, recordCard);
}

function renderValueTaxHistoryShell() {
  const container = document.getElementById("value-tax-history-panel");
  if (!container) return;
  const historyOpen = mobileSupportOpenAttribute();

  container.innerHTML = `
    <div class="data-split-view grid gap-6 lg:grid-cols-5">
      <article id="value-history" class="lg:col-span-2">
        <details class="mobile-support-disclosure" data-mobile-support${historyOpen}>
          <summary class="mobile-support-toggle">
            <span>See yearly values and taxes</span>
            <span class="mobile-support-chevron" aria-hidden="true"></span>
          </summary>
          <div class="mobile-support-content">
            <h2 class="text-xl font-bold text-slate-700">Value and tax history</h2>
            <p class="mt-1 text-sm text-slate-600">
                Current values and prior final tax bills are kept together here so timing is clear.
                Effective tax rate (ETR) compares final taxes paid with assessed value after levy, credits, and exemptions are reflected in the bill.
            </p>
            <div class="mt-4 overflow-x-auto rounded-xl ring-1 ring-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr>
                    <th class="px-3 py-2 text-left font-semibold">Year</th>
                    <th class="px-3 py-2 text-right font-semibold">Assessed Value</th>
                    <th class="px-3 py-2 text-right font-semibold">Taxes Paid</th>
                    <th class="px-3 py-2 text-right font-semibold">ETR</th>
                  </tr>
                </thead>
                <tbody id="historyRows" class="divide-y divide-slate-200 bg-white"></tbody>
              </table>
            </div>
          </div>
        </details>
      </article>

      <article id="indexed-trends" class="lg:col-span-3">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-700">How are this property’s value and taxes moving together?</h2>
              <p class="text-sm text-slate-600">Assessed value and taxes begin from the same baseline so their changes can be compared side by side. Tax bills are included only after they are finalized.</p>
          </div>
          <p id="baseYearNote" class="text-xs font-medium text-slate-500"></p>
        </div>
        <div id="indexedChartLegend" class="chart-disc-legend mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-600"></div>
        <div class="indexed-trends-chart mt-4">
          <span id="indexedPendingBadge" class="indexed-pending-badge hidden">Pending</span>
          <canvas id="indexedChart"></canvas>
        </div>
      </article>
    </div>
    <p data-property-record-source class="chart-source"></p>
  `;
  initMobileSupportDisclosureCharts(container);
}

function renderTaxHistoryShell() {
  const container = document.getElementById("tax-history-panel");
  if (!container) return;

  container.className = "tax-history-pair grid gap-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]";
  container.innerHTML = `
    <article id="tax-history" class="tax-history-detail-panel">
      <h2 class="text-xl font-bold text-slate-700">How did levy, credits, and net taxes move?</h2>
      <p class="mt-1 text-sm text-slate-600">After equalization frames the value base, finalized statement years show how levy, credits, exemptions, and district boundaries become the final bill.</p>
      <div class="mt-4 overflow-x-auto rounded-xl ring-1 ring-slate-200">
        <table class="tax-burden-table min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
          <thead class="tax-burden-table-head">
            <tr>
              <th class="px-2 py-2 text-left font-semibold sm:px-3">Year</th>
              <th class="px-2 py-2 text-right font-semibold sm:px-3">Levy</th>
              <th class="tax-history-change-column px-2 py-2 text-center font-semibold sm:px-3">Change</th>
              <th class="px-2 py-2 text-right font-semibold sm:px-3">Gross</th>
              <th class="px-2 py-2 text-right font-semibold sm:px-3">Credits</th>
              <th class="px-2 py-2 text-right font-semibold sm:px-3">Net</th>
              <th class="px-2 py-2 text-right font-semibold sm:px-3">ETR</th>
            </tr>
          </thead>
          <tbody id="taxHistoryRows" class="divide-y divide-slate-200"></tbody>
        </table>
      </div>
      <p id="taxHistorySourceNote" class="mt-2 text-xs leading-5 text-slate-500"></p>
    </article>

    <article id="etr-trend" class="tax-history-rate-panel">
        <h2 class="text-xl font-bold text-slate-700">How much tax was paid for each dollar of value?</h2>
        <p class="mt-1 text-sm text-slate-600">Effective tax rate compares the final tax bill with assessed value, making years easier to compare.</p>
      <div class="mt-4 h-64 sm:h-72">
        <canvas id="etrChart"></canvas>
      </div>
    </article>
  `;
  initMobileSupportDisclosureCharts(container);
}

function renderTaxDistributionShell(data) {
  const container = document.getElementById("tax-distribution");
  if (!container) return;
  const levyTableOpen = mobileSupportOpenAttribute();

  container.innerHTML = `
    <div class="data-split-view grid gap-6 lg:grid-cols-5">
      <article class="lg:col-span-3">
        <h2 class="text-xl font-bold text-slate-700">Where does the tax bill go?</h2>
          <p class="mt-1 text-sm text-slate-600">The most recent finalized tax breakdown shows the taxing bodies listed for this property. Dollar amounts allocate the latest net bill by each group’s levy share.</p>
        <div class="tax-distribution-visual-grid mt-4 grid gap-4 md:items-center">
          <div id="distributionNotes" class="space-y-2 text-sm text-slate-700"></div>
          <div class="distribution-chart-shell h-72 sm:h-80">
            <canvas id="distributionChart"></canvas>
          </div>
        </div>
      </article>

      <article class="lg:col-span-2">
        <details class="mobile-support-disclosure" data-mobile-support${levyTableOpen}>
          <summary class="mobile-support-toggle">
            <span>See full levy table</span>
            <span class="mobile-support-chevron" aria-hidden="true"></span>
          </summary>
          <div class="mobile-support-content">
            <h2 class="text-xl font-bold text-slate-700">Which taxing bodies are included?</h2>
            <p class="mt-1 text-sm text-slate-600">2025 is the latest completed levy breakdown. The 2026 tax bill depends on finalized budgets, levies, credits, and exemptions.</p>
            <div class="mt-4 overflow-x-auto rounded-xl ring-1 ring-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr>
                    <th class="px-3 py-2 text-left font-semibold">Taxing body</th>
                    <th class="px-3 py-2 text-right font-semibold">Rate</th>
                    <th class="px-3 py-2 text-right font-semibold">Share</th>
                    <th class="px-3 py-2 text-right font-semibold">Per $100k</th>
                  </tr>
                </thead>
                <tbody id="levyRows" class="divide-y divide-slate-200 [&>tr:nth-child(even)]:bg-slate-50"></tbody>
              </table>
            </div>
          </div>
        </details>
      </article>
    </div>
  `;
}

function renderAssessmentAccuracyShell(summaryContext = {}) {
  const container = document.getElementById("assessment-accuracy-body");
  if (!container) return;
  const supportOpen = mobileSupportOpenAttribute();
  const ratioCitation = summaryContext.ratioData?.source?.displayCitation || "2019-2026 Gage County PAD Reports and Opinions";
  const iaaoCitation = summaryContext.iaaoStandards?.metadata?.source?.displayCitation || "IAAO Standard on Ratio Studies";
  const rangeAuthority = legalReferenceHtml(summaryContext.legalReferences, "neb-rev-stat-77-5023", "§ 77-5023");
  const reportsAuthority = legalReferenceHtml(summaryContext.legalReferences, "neb-rev-stat-77-5027", "§ 77-5027");

  container.innerHTML = `
    <section class="mt-5 border-t border-slate-200 pt-5" aria-labelledby="assessmentBandCardsTitle">
      <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Class band checks</p>
          <h3 id="assessmentBandCardsTitle" class="text-lg font-bold text-slate-700">Where does each measure stand now?</h3>
        </div>
        <p class="max-w-2xl text-sm leading-6 text-slate-600">COD, PRD, and COV are ratio-study statistics. Level of value is the class median ratio range. Current status stays first, with each measure's band history carried inside the same card.</p>
      </div>
      <div id="assessmentClassFilter" class="mt-4 inline-flex rounded-xl bg-slate-100 p-1 text-sm font-semibold ring-1 ring-slate-200" aria-label="Assessment class filter"></div>
      <div id="assessmentAccuracySummary" class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4"></div>
    </section>

    <section class="mt-5 border-t border-slate-200 pt-5" aria-labelledby="assessmentUnifiedViewTitle">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Reported values and unified view</p>
      <h3 id="assessmentUnifiedViewTitle" class="mt-1 text-lg font-bold text-slate-700">How do the raw measures come together?</h3>
      <p class="mt-1 max-w-4xl text-sm leading-6 text-slate-600">The table keeps the reported values by year. The chart normalizes COD, PRD, and COV to their own bands so their movement can be compared without mixing raw scales.</p>
    </section>
    <section class="data-split-view related-panel-section equalization-unified-section grid gap-6 lg:grid-cols-5">
      <article class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 lg:col-span-3">
          <h3 class="text-lg font-bold text-slate-700">How do the statistical measures come together?</h3>
          <p id="assessmentAccuracyConvergenceNote" class="mt-1 text-sm text-slate-600">COD, PRD, and COV are normalized to their own bands so their relative movement can be read together.</p>
        <div id="assessmentAccuracyLegend" class="assessment-line-legend mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600"></div>
        <div class="mt-4 h-80">
          <canvas id="assessmentAccuracyChart"></canvas>
        </div>
      </article>
      <details class="mobile-support-disclosure equalization-support-disclosure equalization-year-table-panel rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 lg:col-span-2" data-mobile-support${supportOpen}>
        <summary class="mobile-support-toggle">
          <span>See reported values table</span>
          <span class="mobile-support-chevron" aria-hidden="true"></span>
        </summary>
        <div class="mobile-support-content">
          <h3 class="text-lg font-bold text-slate-700">What changed by year?</h3>
          <p class="mt-1 text-sm text-slate-600">Latest years appear first so recent county sales-study results are easy to compare with prior years.</p>
          <div class="mt-4 overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
            <table class="min-w-full divide-y divide-slate-200 text-sm equalization-support-table">
              <thead class="sticky top-0">
                <tr>
                  <th class="px-3 py-2 text-left font-semibold">Year</th>
                  <th class="px-3 py-2 text-right font-semibold">Sales</th>
                  <th class="px-3 py-2 text-right font-semibold">COD</th>
                  <th class="px-3 py-2 text-right font-semibold">PRD</th>
                  <th class="px-3 py-2 text-right font-semibold">COV</th>
                  <th class="px-3 py-2 text-right font-semibold">LOV</th>
                </tr>
              </thead>
              <tbody id="assessmentMeasureRows" class="divide-y divide-slate-200 [&>tr:nth-child(even)]:bg-slate-50"></tbody>
            </table>
          </div>
        </div>
      </details>
    </section>

    <details class="mobile-support-disclosure equalization-support-disclosure equalization-local-section related-panel-section" data-mobile-support${supportOpen}>
      <summary class="mobile-support-toggle">
        <span>See local market position</span>
        <span class="mobile-support-chevron" aria-hidden="true"></span>
      </summary>
      <div class="mobile-support-content" aria-labelledby="equalizationLocalPositionTitle">
      <div class="equalization-local-heading flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Local starting point</p>
          <h3 id="equalizationLocalPositionTitle" class="text-lg font-bold text-slate-700">Start with the local group</h3>
          <p class="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Equalization reads outward from the property record into its valuation group or market area, then into the class and countywide study. Choose the local group first, then compare how it sits against the broader county pattern.</p>
        </div>
        <label class="equalization-area-control min-w-72 text-sm font-semibold text-slate-700">
          Want to see another area?
          <select id="equalizationMarketAreaSelect" data-market-area-select class="market-area-select mt-2 w-full rounded-xl px-3 py-2 text-sm font-semibold shadow-sm focus:outline-none"></select>
        </label>
      </div>
      <section class="related-panel-section grid gap-6 lg:grid-cols-5">
        <section id="market-position-panel" class="lg:col-span-3">
          <h4 class="text-xl font-bold text-slate-700">Compare it with nearby groups</h4>
          <p id="marketPositionHelper" class="mt-1 text-sm text-slate-600">Each dot represents a valuation group or market area. The selected dot shows the local group you chose; the shaded center shows the expected range and broader county pattern.</p>
          <div id="marketPositionLegend" class="chart-disc-legend mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600"></div>
          <div class="mt-4 h-80">
            <canvas id="marketPositionScatter" role="img" tabindex="0" aria-describedby="marketScatterSummary"></canvas>
          </div>
          <div class="mt-4 border-t border-slate-200 pt-4">
            <p class="guided-kicker">Market area summary</p>
            <p id="marketNarrative" class="mt-1 text-sm leading-6 text-slate-700"></p>
          </div>
          <p id="marketScatterSummary" class="mt-4 text-sm leading-6 text-slate-600"></p>
        </section>
        <section id="market-price-context" class="lg:col-span-2">
          <h4 class="text-xl font-bold text-slate-700">What prices are represented?</h4>
          <p class="mt-1 text-sm text-slate-600">Average sale price and assessed value show the price context behind the highlighted group.</p>
          <div id="marketPriceSummary" class="mt-4 grid gap-3 text-sm"></div>
        </section>
      </section>
      <p id="marketPositionSource" class="chart-source"></p>
      </div>
    </details>

    <details class="mobile-support-disclosure equalization-support-disclosure equalization-sales-section related-panel-section" data-mobile-support${supportOpen}>
      <summary class="mobile-support-toggle">
        <span>See class sales makeup</span>
        <span class="mobile-support-chevron" aria-hidden="true"></span>
      </summary>
      <div class="mobile-support-content" aria-labelledby="equalizationSalePriceTitle">
      <h3 id="equalizationSalePriceTitle" class="text-lg font-bold text-slate-700">What makes up the class sales data?</h3>
      <p id="equalizationSalePriceDescription" class="mt-1 max-w-4xl text-sm leading-6 text-slate-600">Sale-price ranges show where qualified sales are concentrated and whether the class study is based mostly on lower-, middle-, or higher-priced properties.</p>
      <div class="data-split-view mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
        <div class="overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
          <table class="min-w-full divide-y divide-slate-200 text-xs equalization-support-table equalization-sales-table">
            <thead>
              <tr>
                <th id="equalizationSalePriceRangeHeader" class="px-2 py-2 text-left font-semibold">
                  <span class="sales-range-label-full">Sale price range</span>
                  <span class="sales-range-label-compact">Price band</span>
                </th>
                <th class="px-2 py-2 text-right font-semibold">Sales</th>
                <th class="px-2 py-2 text-right font-semibold">Median</th>
                <th class="px-2 py-2 text-right font-semibold">COD</th>
                <th class="px-2 py-2 text-right font-semibold">PRD</th>
                <th class="px-2 py-2 text-right font-semibold">Avg. sale</th>
              </tr>
            </thead>
            <tbody id="equalizationSalePriceRows" class="divide-y divide-slate-200 [&>tr:nth-child(even)]:bg-slate-50"></tbody>
          </table>
        </div>
        <div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p id="equalizationSalePriceChartTitle" class="text-xs font-semibold uppercase tracking-wide text-slate-500">Sales distribution</p>
          <p id="equalizationSalePriceChartNote" class="mt-1 text-sm leading-5 text-slate-600">Qualified sales by price band, including empty upper bands.</p>
          <div id="equalizationSalePriceChartLegend" class="chart-disc-legend mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600"></div>
          <div class="mt-3 h-64">
            <canvas id="equalizationSalePriceChart"></canvas>
          </div>
        </div>
      </div>
      <p id="equalizationSalePriceSource" class="chart-source"></p>
      </div>
    </details>
    <p id="assessmentAccuracySourceNote" class="chart-source">
      Source: ${escapeHtml(ratioCitation)}; ${escapeHtml(iaaoCitation)}. Authority context: ${rangeAuthority}, ${reportsAuthority}.
    </p>
  `;
  initMobileSupportDisclosureCharts(container);
}

function mobileSupportOpenAttribute() {
  return typeof window !== "undefined" && window.matchMedia?.("(min-width: 768px)").matches ? " open" : "";
}

function initMobileSupportDisclosureCharts(root = document) {
  root.querySelectorAll("details[data-mobile-support]").forEach(detail => {
    if (detail.dataset.chartResizeBound === "true") return;
    detail.dataset.chartResizeBound = "true";
    detail.addEventListener("toggle", () => {
      if (!detail.open) return;
      window.requestAnimationFrame(() => {
        detail.querySelectorAll("canvas").forEach(canvas => {
          window.Chart?.getChart(canvas)?.resize();
        });
      });
    });
  });
}

export function renderPropertyViewContext(data, recordCard, valuationGroups) {
  const context = document.getElementById("propertyViewContext");
  if (!context) return;
  const valuationGroup = propertyValuationGroupLabel(data, recordCard, valuationGroups);
  const propertyClass = data.classification.propertyClass || data.parcel.accountType;
  const situsAddress = displayAddress(data.parcel.situsAddress);

  context.innerHTML = `
    <div class="property-context-bar" data-property-context-bar aria-label="Subject property">
      <p class="property-context-line">
        <span class="property-context-situs">${escapeHtml(situsAddress)}</span>
        <span class="property-context-separator property-context-desktop" aria-hidden="true">·</span>
        <span class="property-context-meta property-context-desktop">${propertyClass}</span>
        <span class="property-context-separator property-context-desktop" aria-hidden="true">·</span>
        <span class="property-context-meta property-context-desktop">${data.classification.location}</span>
        <span class="property-context-separator" aria-hidden="true">·</span>
        <span class="property-context-meta">${valuationGroup}</span>
      </p>
    </div>
  `;
}

function propertyValuationGroupLabel(data, recordCard, valuationGroups) {
  const valuationGroupId = `${recordCard?.locationModel?.valuationGroup ?? ""}`.match(/\d+/)?.[0];
  const propertyClass = data.classification.propertyClass;
  const match = (valuationGroups?.valuationGroups || []).find(group =>
    String(group.valuationGroup) === String(valuationGroupId)
    && group.class === propertyClass
  );

  if (recordCard?.locationModel?.valuationGroup) {
    return formatValuationGroupLabel(recordCard.locationModel.valuationGroup);
  }

  if (match?.description) {
    return `VG ${match.valuationGroup} - ${match.description}`;
  }

  return "Valuation group not listed";
}

function formatValuationGroupLabel(value) {
  const label = `${value ?? ""}`.trim();
  if (!label) return "Valuation group not listed";
  if (/^(?:vg|valuation group|market area)\b/i.test(label)) return label;

  return label.replace(/^(\d+)\s*[-–]\s*/, "VG $1 - ");
}

function landingPrimerTitleHtml(noticeAddress) {
  return `
    <span class="page-title-nowrap">You are looking at</span>
    <span class="page-title-situs">${escapeHtml(noticeAddress)}.</span>
  `;
}

export function renderViewHeader(view = "your-property", snapshotModel, propertySwitcher = null) {
  const switcherContext = propertySwitcher ?? window.__PROPERTY_SWITCHER_CONTEXT__ ?? null;
  const section = snapshotModel?.sections?.find(item => item.id === view);
  const noticeAddress = snapshotModel?.viewModels?.notice?.displayAddress
    || snapshotModel?.viewModels?.notice?.situsAddress;
  const hasLandingAddressTitle = view === "landing-primer" && noticeAddress;
  const content = section
    ? {
      eyebrow: section.eyebrow,
      title: hasLandingAddressTitle
        ? `You are looking at ${noticeAddress}.`
        : section.question,
      description: section.description,
      imageAlt: viewHeaderContent[view]?.imageAlt ?? "Map of Nebraska"
    }
    : viewHeaderContent[view] || viewHeaderContent["your-property"];
  const title = document.getElementById("pageTitle");
  const titleHtml = hasLandingAddressTitle ? landingPrimerTitleHtml(noticeAddress) : escapeHtml(content.title);

  title.innerHTML = `
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">
          ${content.eyebrow}
        </p>

        <h1 class="mt-1 text-4xl font-bold tracking-tight text-slate-700">
          ${titleHtml}
        </h1>

        <p class="mt-2 max-w-3xl text-base text-slate-600">
          ${content.description}
        </p>
      </div>

      <div class="page-title-utility">
        <img
          src="assets/images/gage-county-map.png"
          alt="${content.imageAlt}"
          class="hidden h-20 w-auto shrink-0 opacity-80 sm:block grayscale"
        />
        ${propertySwitcherMarkup(switcherContext, snapshotModel)}
      </div>
    </div>
  `;

  initPropertySwitcher(title);
}

function propertySwitcherMarkup(propertySwitcher, snapshotModel) {
  const groups = propertySwitcherOptionGroups(propertySwitcher, snapshotModel);
  const hasOptions = groups.some(group => group.options.length);
  const hasActiveProperty = Boolean(propertySwitcher?.activePropertyId);

  if (!hasOptions) return disabledParcelLookupMarkup();

  return `
    <div class="parcel-lookup-placeholder ${hasActiveProperty ? "" : "property-switcher-empty"}" data-property-switcher-shell>
      <label class="parcel-lookup-label" for="propertySwitcher">${hasActiveProperty ? "Looking for another property?" : "Select a sample property"}</label>
      <select
        id="propertySwitcher"
        class="parcel-lookup-shell property-switcher-select"
        data-property-switcher
        aria-label="Switch property record"
      >
        ${hasActiveProperty ? "" : `<option value="" selected>Choose a sample property...</option>`}
        ${groups.map(group => `
          <optgroup label="${escapeHtml(group.label)}">
            ${group.options.map(option => `
              <option value="${escapeHtml(option.id)}"${option.selected ? " selected" : ""}>${escapeHtml(option.label)}</option>
            `).join("")}
          </optgroup>
        `).join("")}
      </select>
    </div>
  `;
}

function propertySwitcherOptionGroups(propertySwitcher, snapshotModel) {
  const groups = new Map([
    ["Residential Samples", []],
    ["Agricultural Samples", []],
    ["Commercial Samples", []],
    ["Mixed / Special Use Samples", []]
  ]);
  const options = propertySwitcherOptions(propertySwitcher, snapshotModel);

  options.forEach(option => {
    const groupLabel = switcherGroupLabel(option.propertyClass);
    groups.get(groupLabel).push(option);
  });

  return [...groups.entries()]
    .map(([label, groupOptions]) => ({ label, options: groupOptions }))
    .filter(group => group.options.length);
}

function propertySwitcherOptions(propertySwitcher, snapshotModel) {
  const records = propertySwitcher?.records || [];
  const activePropertyId = propertySwitcher?.activePropertyId;
  const valuationGroups = snapshotModel?.valuationGroups ?? propertySwitcher?.valuationGroups;

  return records
    .filter(item => item.property?.id && item.recordCard)
    .map(item => {
      const recordCard = item.recordCard;
      const data = recordCard.guidedSnapshot || {};
      const situs = item.property.situsAddress || data.parcel?.situsAddress || "";
      const situsNumber = firstSitusNumber(situs) || situs || item.property.parcelId;
      const propertyClass = switcherClassLabel(item.property.propertyClass || data.classification?.propertyClass || data.parcel?.accountType);
      const valuationGroup = propertyValuationGroupLabel(data, recordCard, valuationGroups);

      return {
        id: item.property.id,
        propertyClass,
        selected: item.property.id === activePropertyId,
        label: `${situsNumber} • ${valuationGroup} • ${propertyClass}`
      };
    });
}

function switcherGroupLabel(value) {
  const normalized = `${value ?? ""}`.trim().toLowerCase();

  if (normalized.includes("res")) return "Residential Samples";
  if (normalized.includes("ag") || normalized.includes("farm")) return "Agricultural Samples";
  if (normalized.includes("comm")) return "Commercial Samples";

  return "Mixed / Special Use Samples";
}

function firstSitusNumber(value) {
  const token = `${value ?? ""}`.match(/\d+/)?.[0] ?? "";
  const stripped = token.replace(/^0+(?=\d)/, "");

  return stripped || token;
}

function switcherClassLabel(value) {
  const normalized = `${value ?? ""}`.trim().toLowerCase();

  if (normalized.includes("ag") || normalized.includes("farm")) return "Farm/Ag";
  if (normalized.includes("comm")) return "Commercial";
  if (normalized.includes("res")) return "Residential";

  return value || "Property";
}

function disabledParcelLookupMarkup() {
  return `
    <div class="parcel-lookup-placeholder" data-parcel-lookup>
      <p class="parcel-lookup-label">Looking for another property?</p>
      <button
        type="button"
        class="parcel-lookup-shell"
        data-parcel-lookup-trigger
        aria-disabled="true"
        aria-expanded="false"
        aria-controls="parcelLookupPopover"
        aria-label="Looking for another property? Search by address, parcel ID, or owner name"
      >
        <span class="parcel-lookup-input" title="Address, parcel ID, or owner name">Address, parcel ID, or owner name</span>
        <span class="parcel-lookup-action" aria-hidden="true">Search</span>
      </button>
      <div id="parcelLookupPopover" class="parcel-lookup-popover" data-parcel-lookup-popover hidden>
        Property lookup will be available when this site is connected to a parcel API or assessment database.
      </div>
    </div>
  `;
}

function initPropertySwitcher(root) {
  const switcher = root.querySelector("[data-property-switcher]");
  if (switcher) {
    switcher.addEventListener("change", () => {
      switchPropertyRecord(switcher.value);
    });
    return;
  }

  const lookup = root.querySelector("[data-parcel-lookup]");
  const trigger = root.querySelector("[data-parcel-lookup-trigger]");
  const popover = root.querySelector("[data-parcel-lookup-popover]");

  if (!lookup || !trigger || !popover) return;

  function handleDocumentClick(event) {
    if (!lookup.contains(event.target)) {
      setOpen(false);
    }
  }

  function setOpen(open) {
    popover.hidden = !open;
    trigger.setAttribute("aria-expanded", String(open));
    document[open ? "addEventListener" : "removeEventListener"]("click", handleDocumentClick);
  }

  trigger.addEventListener("click", event => {
    event.stopPropagation();
    setOpen(popover.hidden);
  });

  trigger.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      setOpen(false);
      trigger.blur();
    }
  });

}

function switchPropertyRecord(propertyId) {
  if (!propertyId) return;

  try {
    window.localStorage?.setItem(PROPERTY_SELECTION_STORAGE_KEY, propertyId);
  } catch {
    // The query string remains the source of truth if storage is unavailable.
  }

  const url = new URL(window.location.href);
  url.searchParams.set("property", propertyId);
  url.hash = "";
  window.location.assign(url.toString());
}

function renderHeader(data, imageModal, recordCard, valuationGroups) {
  const header = document.getElementById("pageHeader");

  header.innerHTML = `
    <div class="property-record-overview">
      <div class="property-record-value-table" aria-label="Prior and current value breakdown">
        ${valuationNoticeSummary(data, recordCard)}
      </div>
      <div class="property-record-media" aria-label="Property images">
        ${imageButton(data.assets.photo, "Property Photos", "Photos")}
        ${imageButton(data.assets.sketch, "Property Sketch", "Sketch")}
      </div>
    </div>
  `;

  header.querySelectorAll("[data-image-src]").forEach(button => {
    button.addEventListener("click", () => {
      imageModal.open(button.dataset.imageSrc, button.dataset.imageCaption);
    });
  });
}

function renderAssessmentNoticeSummary(data, recordCard) {
  const container = document.getElementById("assessmentNoticeSummary");
  if (!container) return;

  container.innerHTML = valuationNoticeSummary(data, recordCard);
}

function valuationNoticeSummary(data, recordCard) {
  const values = valuationNoticeValues(data, recordCard);

  return `
    <div class="valuation-notice-card">
      <div class="overflow-hidden rounded-lg ring-1 ring-slate-200">
        <div class="valuation-notice-row valuation-notice-header">
          <p>Value breakdown</p>
          <p>${values.prior.year}</p>
          <p>${values.current.year}</p>
        </div>
        ${valuationNoticeRow("Land value", values.prior.land, values.current.land)}
        ${valuationNoticeRow("Building value", values.prior.building, values.current.building)}
        ${valuationNoticeRow("Other improvements", values.prior.improvement, values.current.improvement)}
        ${valuationNoticeRow("Total value", values.prior.total, values.current.total, true)}
      </div>
    </div>
  `;
}

function valuationNoticeValues(data, recordCard) {
  const rows = (data.assessedValueBreakdown || [])
    .filter(row => row?.year)
    .slice()
    .sort((a, b) => b.year - a.year);
  const snapshotBreakdown = rows.find(row =>
    row.year === data.snapshotYear
    && row.total !== null
    && row.total !== undefined
  );

  if (snapshotBreakdown) {
    const prior = rows.find(row =>
      row.year < snapshotBreakdown.year
      && row.total !== null
      && row.total !== undefined
    ) ?? {};

    return {
      prior: {
        year: prior.year,
        building: prior.dwelling,
        improvement: prior.outbuilding,
        land: prior.land,
        total: prior.total
      },
      current: {
        year: snapshotBreakdown.year,
        building: snapshotBreakdown.dwelling,
        improvement: snapshotBreakdown.outbuilding,
        land: snapshotBreakdown.land,
        total: snapshotBreakdown.total
      }
    };
  }

  if (recordCard?.currentCardValue?.previous && recordCard?.currentCardValue?.current) {
    const noticeYear = data.snapshotYear ?? data.latestFinalTaxYear;

    return {
      prior: {
        year: noticeYear - 1,
        building: recordCard.currentCardValue.previous.buildings,
        improvement: recordCard.currentCardValue.previous.improvement,
        land: recordCard.currentCardValue.previous.landLots,
        total: recordCard.currentCardValue.previous.total
      },
      current: {
        year: noticeYear,
        building: recordCard.currentCardValue.current.buildings,
        improvement: recordCard.currentCardValue.current.improvement,
        land: recordCard.currentCardValue.current.landLots,
        total: recordCard.currentCardValue.current.total
      }
    };
  }

  const current = rows[0] ?? {};
  const prior = rows.find(row => row.year < current.year && row.total !== null && row.total !== undefined)
    ?? rows.find(row => row.total !== null && row.total !== undefined)
    ?? {};

  return {
    prior: {
      year: prior.year,
      building: prior.dwelling,
      improvement: 0,
      land: prior.land,
      total: prior.total
    },
    current: {
      year: current.year,
      building: current.dwelling,
      improvement: 0,
      land: current.land,
      total: current.total
    }
  };
}

function valuationNoticeRow(label, priorValue, currentValue, emphasized = false) {
  return `
    <div class="valuation-notice-row ${emphasized ? "valuation-notice-row-total" : ""}">
      <p>${label}</p>
      <p class="text-right">${formatNullableMoney(priorValue)}</p>
      <p class="text-right">${formatNullableMoney(currentValue)}</p>
    </div>
  `;
}

function imageButton(src, caption, label) {
  if (!src) {
    return `
      <div class="flex h-28 w-44 items-center justify-center rounded-2xl bg-slate-100 px-3 text-center text-xs font-medium text-slate-500 ring-1 ring-slate-200">
        ${label} unavailable
      </div>
    `;
  }

  return `
    <button type="button" data-image-src="${src}" data-image-caption="${caption}" class="group relative overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200 transition hover:ring-slate-300">
      <img src="${src}" alt="${caption}" class="h-28 w-44 object-cover transition duration-200 group-hover:scale-105" />
      <div class="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1">
        <p class="text-xs font-medium text-white">${label}</p>
      </div>
    </button>
  `;
}

function renderPropertyDetails(data, recordCard) {
  const situsAddress = displayAddress(data.parcel.situsAddress);
  const identityDetails = [
    ["Parcel ID", data.parcel.parcelId],
    ["Tax district", data.parcel.taxDistrict],
    ["Owner", data.parcel.owner],
    ["Situs address", situsAddress],
    ["Mailing address", mailingAddressHtml(data.parcel.mailingAddress)],
    ["Legal description", data.parcel.legalDescription],
    {
      layout: "pair",
      className: "details-card-compact",
      items: [
        ["Status", data.classification.status],
        ["Zoning", data.classification.zoning]
      ]
    },
    ["Lot size", data.classification.lotSize]
  ];
  const physicalDetails = physicalDetailsForProperty(data);

  const compactDetailLabels = new Set([
    "Parcel ID",
    "Tax district",
    "Status",
    "Zoning",
    "Status / zoning",
    "Year built",
    "Style",
    "Building size",
    "Basement size",
    "Bedrooms / bathrooms",
    "Quality / condition"
  ]);

  const renderDetailCard = detail => {
    if (detail?.layout === "pair") {
      return `
        <div class="details-card ${detail.className || "details-card-full"} metric-pair-card">
          ${detail.items.map(([label, value]) => `
            <div>
              <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</dt>
              <dd class="mt-1 text-sm font-medium text-slate-700">${displayValue(value)}</dd>
            </div>
          `).join("")}
        </div>
      `;
    }

    const [label, value] = detail;

    return `
      <div class="details-card ${compactDetailLabels.has(label) ? "details-card-compact" : "details-card-full"}">
        <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</dt>
        <dd class="mt-1 text-sm font-medium text-slate-700">${displayValue(value)}</dd>
      </div>
    `;
  };

  const renderCards = details => details.map(renderDetailCard).join("");

  document.getElementById("propertyDetails").innerHTML = [
    renderCards(identityDetails),
    renderCards(physicalDetails),
    technicalCostModel(recordCard, data),
    sourceExtractDetails(recordCard),
    classificationDetails(data),
    landInformation(data, recordCard),
    propertyNotes(data),
    propertyValueTaxHistory(data, recordCard),
    ownershipHistory(recordCard),
    recordCardSource(recordCard),
    reportErrorLink(data, recordCard)
  ].join("");
}

function mailingAddressHtml(value) {
  const parts = `${value ?? ""}`
    .split(",")
    .map(line => displayAddress(line.trim()))
    .filter(Boolean);

  const lines = parts.length > 1
    ? [parts[0], parts.slice(1).join(", ")]
    : parts;

  if (!lines.length) return value;

  return lines.map((line, index) => `
    <span class="details-card-address-line ${index > 0 ? "details-card-address-locality" : ""}">${escapeHtml(line)}</span>
  `).join("");
}

function reportErrorLink(data, recordCard) {
  return `
    <div class="sm:col-span-2 px-1 pt-1 text-xs text-slate-500">
      <p>${escapeHtml(propertyRecordSourceText(data, recordCard))}</p>
    </div>
  `;
}

function formSafeId(value) {
  return `${value}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "Not listed";
  return value;
}

function formatSquareFeet(value) {
  return value === null || value === undefined ? "Not listed" : `${Number(value).toLocaleString()} sq. ft.`;
}

function hasDetailedRecordCard(recordCard) {
  return Boolean(recordCard?.parcelIdentifiers);
}

function physicalDetailsForProperty(data) {
  if (data.commercial?.buildingDatasheet?.length || data.classification.propertyClass === "Commercial") {
    return [
      ["Primary occupancy", data.commercial?.primaryOccupancy],
      {
        layout: "pair",
        className: "details-card-compact",
        items: [
          ["Year built", data.commercial?.yearBuilt],
          ["Construction", data.commercial?.constructionType]
        ]
      },
      ["Building size", formatSquareFeet(data.commercial?.buildingSize)],
      ["Perimeter", data.commercial?.perimeter ? `${data.commercial.perimeter} ft.` : null],
      ["Land use", data.commercial?.landUse],
      ["Quality / condition", [data.commercial?.quality, data.commercial?.condition].filter(Boolean).join(" / ")],
      ["Heating / cooling", data.commercial?.heatingCooling]
    ];
  }

  return [
    {
      layout: "pair",
      className: "details-card-compact",
      items: [
        ["Year built", data.residential?.yearBuilt],
        ["Style", data.residential?.style]
      ]
    },
    {
      layout: "pair",
      className: "details-card-compact",
      items: [
        ["Building size", formatSquareFeet(data.residential?.buildingSize)],
        ["Basement size", formatSquareFeet(data.residential?.basementSize)]
      ]
    },
    ["Bedrooms / bathrooms", [data.residential?.bedrooms, data.residential?.bathrooms].every(value => value !== null && value !== undefined) ? `${data.residential.bedrooms} / ${data.residential.bathrooms}` : null],
    ["Quality / condition", [data.residential?.quality, data.residential?.condition].filter(Boolean).join(" / ")],
    ["Garage", [data.residential?.garage1, data.residential?.garage2].filter(Boolean).join("; ")],
    ["Exterior", data.residential?.exterior]
  ];
}

function discrepancyRows(data, recordCard) {
  const detailedRecordCard = hasDetailedRecordCard(recordCard);
  const residential = data.residential || {};
  const landRows = data.landInformation || [];
  const additionalFeatureRows = data.dwellingData || [];
  const outbuildingRows = data.outbuildingData || [];
  const noteRows = data.propertyNotes || [];
  const garageLines = recordCard?.garageCostLines || [];
  const landDimensions = row => [
    row.widthFeet !== null && row.widthFeet !== undefined ? `Width: ${row.widthFeet} ft.` : null,
    row.depthFeet !== null && row.depthFeet !== undefined ? `Depth: ${row.depthFeet} ft.` : null,
    row.squareFeet !== null && row.squareFeet !== undefined ? `Area: ${Number(row.squareFeet).toLocaleString()} sq. ft.` : null,
    row.acres !== null && row.acres !== undefined ? `Area: ${Number(row.acres).toLocaleString()} ac.` : null,
    row.value !== null && row.value !== undefined ? `Value: ${formatNullableMoney(row.value)}` : null
  ].filter(Boolean).join(" • ");
  const rows = [
    ["Parcel ID", data.parcel.parcelId, "Property facts"],
    ["Owner", data.parcel.owner, "Property facts"],
    ["Situs address", displayAddress(data.parcel.situsAddress), "Property facts"],
    ["Tax district", data.parcel.taxDistrict, "Property facts"],
    ["Legal description", data.parcel.legalDescription, "Property facts"],
    ["Status", data.classification.status, "Property facts"],
    ["Zoning", data.classification.zoning, "Property facts"],
    ["Lot size", data.classification.lotSize, "Property facts"],
    ["Year built", residential.yearBuilt, "Dwelling facts"],
    ["Style", residential.style, "Dwelling facts"],
    ["Building size", formatSquareFeet(residential.buildingSize), "Dwelling facts"],
    ["Basement size", formatSquareFeet(residential.basementSize), "Dwelling facts"],
    ["Bedrooms / bathrooms", [residential.bedrooms, residential.bathrooms].every(value => value !== null && value !== undefined) ? `${residential.bedrooms} / ${residential.bathrooms}` : null, "Dwelling facts"],
    ["Quality / condition", [residential.quality, residential.condition].filter(Boolean).join(" / "), "Dwelling facts"],
    ["Garage", [residential.garage1, residential.garage2].filter(Boolean).join("; "), "Dwelling facts"],
    ["Exterior", residential.exterior, "Dwelling facts"],
    ["Heating / cooling", residential.heatingCooling, "Dwelling facts"],
    ["Plumbing fixtures", residential.plumbingFixtures, "Dwelling facts"],
    ["Minimum finish", formatSquareFeet(residential.minFinish), "Dwelling facts"],
    ["Part finish", formatSquareFeet(residential.partFinish), "Dwelling facts"],
    ...garageLines.map((row, index) => [
      `Garage ${index + 1}`,
      [
        row.description,
        row.units
      ].filter(Boolean).join(" • "),
      "Detailed valuation components"
    ]),
    ...additionalFeatureRows.map((row, index) => [
      `Additional feature ${index + 1}`,
      [
        row.description,
        row.units !== null && row.units !== undefined ? `Units: ${row.units}` : null
      ].filter(Boolean).join(" • "),
      "Detailed valuation components"
    ]),
    ...(outbuildingRows.length
      ? outbuildingRows.map((row, index) => [
        `Outbuilding ${index + 1}`,
        [
          row.description,
          row.units,
          row.yearBuilt ? `Built: ${row.yearBuilt}` : null
        ].filter(Boolean).join(" • "),
        "Detailed valuation components"
      ])
      : [["Outbuilding records", "No outbuilding records listed for this property.", "Detailed valuation components"]]),
    ["Location", data.classification.location, "Classification"],
    ["Property class", data.classification.propertyClass, "Classification"],
    ...(detailedRecordCard && recordCard?.locationModel ? [
      ["Neighborhood", recordCard.locationModel.neighborhood, "Classification"],
      ["Location group", recordCard.locationModel.locationGroup, "Classification"],
      ["Valuation group", recordCard.locationModel.valuationGroup, "Classification"]
    ] : []),
    ...landRows.flatMap((row, index) => [
      [`Land ${index + 1} description`, row.description, "Land information"],
      [`Land ${index + 1} dimensions`, landDimensions(row), "Land information"]
    ]),
    ...(noteRows.length
      ? noteRows.flatMap((row, index) => [
        [`Property note ${index + 1} date`, row.date, "Property notes"],
        [`Property note ${index + 1}`, row.note, "Property notes"]
      ])
      : [["Property notes", "No public property notes listed.", "Property notes"]])
  ];

  return rows.map(([label, value, section], index) => ({
    id: `item-${index}-${formSafeId(label)}`,
    label,
    value: displayValue(value),
    section
  }));
}

function discrepancyChoiceCells(row) {
  return discrepancyChoices.map(([value, label]) => {
    const inputId = `${row.id}-${value}`;

    return `
      <td class="px-2 py-2 text-center">
        <input
          id="${inputId}"
          name="${row.id}"
          type="radio"
          value="${value}"
          class="h-4 w-4 border-slate-300 text-slate-700 focus:ring-slate-500"
          aria-label="${escapeHtml(`${row.label}: ${label}`)}"
        />
      </td>
    `;
  }).join("");
}

function renderDiscrepancyForm(data, recordCard) {
  const container = document.getElementById("reportErrorFormContent");
  if (!container) return;

  const rows = discrepancyRows(data, recordCard);

  container.innerHTML = `
    <form id="propertyDiscrepancyForm" class="space-y-5">
      <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        ${[
          ["Parcel ID", data.parcel.parcelId],
          ["Situs address", displayAddress(data.parcel.situsAddress)],
          ["Owner", data.parcel.owner],
          ["Tax district", data.parcel.taxDistrict],
          ["Mailing address", displayAddress(data.parcel.mailingAddress)],
          ["Legal description", data.parcel.legalDescription],
          ["Property class", data.classification.propertyClass],
          ["County", `${data.parcel.countyName} County`]
        ].map(([label, value]) => `
          <div class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</p>
            <p class="mt-1 text-sm font-semibold leading-5 text-slate-700">${escapeHtml(value)}</p>
          </div>
        `).join("")}
      </section>

      <section>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-700">Review property record details</h3>
            <p class="mt-1 text-sm leading-6 text-slate-600">
              Mark only the items that appear inaccurate, incomplete, misclassified, or in need of factual review.
            </p>
          </div>
          <p id="discrepancyDraftStatus" class="text-xs font-medium text-slate-500" aria-live="polite"></p>
        </div>

        <div class="mt-3 max-h-[42vh] overflow-auto rounded-xl ring-1 ring-slate-200">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="sticky top-0 z-10 bg-slate-50">
              <tr>
                <th class="w-44 px-3 py-2 text-left font-semibold">Section</th>
                <th class="px-3 py-2 text-left font-semibold">Record item</th>
                <th class="px-3 py-2 text-left font-semibold">Current record</th>
                ${discrepancyChoices.map(([, label]) => `
                  <th class="w-24 px-2 py-2 text-center font-semibold">${escapeHtml(label)}</th>
                `).join("")}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 bg-white">
              ${rows.map((row, index) => `
                <tr class="${index % 2 === 0 ? "bg-white" : "bg-slate-50"}">
                  <td class="px-3 py-2 align-top text-xs font-semibold uppercase tracking-wide text-slate-500">${escapeHtml(row.section)}</td>
                  <td class="px-3 py-2 align-top font-medium text-slate-700">${escapeHtml(row.label)}</td>
                  <td class="px-3 py-2 align-top text-slate-700">${escapeHtml(row.value)}</td>
                  ${discrepancyChoiceCells(row)}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>

      <div id="discrepancyValidationErrors" class="hidden rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-700 ring-1 ring-red-200" role="alert" aria-live="assertive"></div>

      <section class="grid items-start gap-4 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <label for="discrepancyComments" class="text-sm font-semibold text-slate-700">Comments or correction narrative</label>
          <textarea id="discrepancyComments" name="comments" rows="5" class="mt-2 w-full rounded-xl border-0 bg-slate-50 p-3 text-sm leading-6 text-slate-700 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="Describe what appears incorrect and what the record should show."></textarea>
        </div>

        <div class="space-y-3">
          <div>
            <label for="discrepancySenderName" class="text-sm font-semibold text-slate-700">Your name</label>
            <input id="discrepancySenderName" name="senderName" type="text" class="mt-2 w-full rounded-xl border-0 bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="Your name" />
          </div>

          <fieldset class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
            <legend class="text-sm font-semibold text-slate-700">Preferred contact method</legend>
            <div class="mt-2 space-y-2 text-sm text-slate-700">
              ${[
                ["office", "In-office visit"],
                ["email", "Email"],
                ["phone", "Phone call"]
              ].map(([value, label]) => `
                <label class="flex items-center gap-2">
                  <input type="radio" name="contactMethod" value="${value}" class="h-4 w-4 border-slate-300 text-slate-700 focus:ring-slate-500" />
                  <span>${label}</span>
                </label>
              `).join("")}
            </div>
          </fieldset>

          <div>
            <label for="discrepancyEmail" class="text-sm font-semibold text-slate-700">Email</label>
            <input id="discrepancyEmail" name="email" type="email" class="mt-2 w-full rounded-xl border-0 bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="name@example.com" />
          </div>

          <div>
            <label for="discrepancyPhone" class="text-sm font-semibold text-slate-700">Phone</label>
            <input id="discrepancyPhone" name="phone" type="tel" class="mt-2 w-full rounded-xl border-0 bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="(555) 555-5555" />
          </div>
        </div>
      </section>

      <section id="discrepancyDeliveryNotice" class="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900 ring-1 ring-amber-200">
          This demonstration prepares a printable correction request and keeps your draft in this browser. It does not send email to the Assessor's Office.
      </section>

      <div class="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p id="discrepancySubmitStatus" class="text-sm font-medium text-slate-600" aria-live="polite"></p>
        <div class="flex justify-end gap-2">
          <button type="button" data-clear-discrepancy-draft class="rounded-full px-4 py-2 text-sm font-semibold text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50">
            Clear draft
          </button>
          <button type="button" data-close-report-error class="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50">
            Save draft and close
          </button>
          <button type="submit" class="rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
            Submit correction request
          </button>
        </div>
      </div>
    </form>
  `;
}

function initDiscrepancySubmission(data, recordCard, governingOffice) {
  const form = document.getElementById("propertyDiscrepancyForm");
  const status = document.getElementById("discrepancyDraftStatus");
  const submitStatus = document.getElementById("discrepancySubmitStatus");
  const validationErrors = document.getElementById("discrepancyValidationErrors");
  const clearButton = document.querySelector("[data-clear-discrepancy-draft]");
  if (!form) return;

  const draftKey = `property-discrepancy-draft:${data.parcel.parcelId}`;
  const rows = discrepancyRows(data, recordCard);

  function collectDraft() {
    const draft = {};
    const formData = new FormData(form);
    formData.forEach((value, key) => {
      draft[key] = value;
    });
    return draft;
  }

  function collectFormValues() {
    const formData = new FormData(form);

    return {
      comments: String(formData.get("comments") || "").trim(),
      senderName: String(formData.get("senderName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      contactMethod: String(formData.get("contactMethod") || "").trim()
    };
  }

  function selectedItems() {
    const formData = new FormData(form);

    return rows
      .map(row => {
        const issueType = formData.get(row.id);
        if (!issueType) return null;

        return {
          section: row.section,
          label: row.label,
          value: row.value,
          issueType,
          issueLabel: discrepancyChoiceLabels[issueType] || String(issueType)
        };
      })
      .filter(Boolean);
  }

  function setValidationMessages(messages) {
    if (!validationErrors) return;
    if (!messages.length) {
      validationErrors.classList.add("hidden");
      validationErrors.innerHTML = "";
      form.removeAttribute("aria-invalid");
      return;
    }

    validationErrors.classList.remove("hidden");
    validationErrors.innerHTML = `
      <p class="font-semibold">Please review the correction request before submitting.</p>
      <ul class="mt-1 list-disc space-y-1 pl-5">
        ${messages.map(message => `<li>${escapeHtml(message)}</li>`).join("")}
      </ul>
    `;
    form.setAttribute("aria-invalid", "true");
    validationErrors.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function validate(values, items) {
    const messages = [];

    if (!items.length && !values.comments) {
      messages.push("Select at least one record item for review or describe the correction in the narrative.");
    }

    if (!values.contactMethod) {
      messages.push("Choose a preferred contact method.");
    }

    if (!values.email) {
      messages.push("Enter an email address so a copy of the request can be sent to you.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      messages.push("Enter a valid email address.");
    }

    if (values.contactMethod === "phone" && !values.phone) {
      messages.push("Enter a phone number for phone-call follow-up.");
    }

    return messages;
  }

  function saveDraft() {
    localStorage.setItem(draftKey, JSON.stringify(collectDraft()));
    if (status) status.textContent = "Draft saved";
  }

  function restoreDraft() {
    const rawDraft = localStorage.getItem(draftKey);
    if (!rawDraft) return;

    try {
      const draft = JSON.parse(rawDraft);
      Object.entries(draft).forEach(([key, value]) => {
        const field = form.elements[key];
        if (!field) return;

        if (field instanceof RadioNodeList) {
          field.value = value;
        } else {
          field.value = value;
        }
      });
      if (status) status.textContent = "Draft restored";
    } catch {
      localStorage.removeItem(draftKey);
    }
  }

  restoreDraft();

  form.addEventListener("input", saveDraft);
  form.addEventListener("change", saveDraft);
  clearButton?.addEventListener("click", () => {
    localStorage.removeItem(draftKey);
    form.reset();
    if (status) status.textContent = "Draft cleared";
    if (submitStatus) {
      submitStatus.textContent = "";
      submitStatus.className = "text-sm font-medium text-slate-600";
    }
    setValidationMessages([]);
  });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    saveDraft();
    setValidationMessages([]);

    const values = collectFormValues();
    const items = selectedItems();
    const messages = validate(values, items);

    if (messages.length) {
      setValidationMessages(messages);
      if (submitStatus) {
        submitStatus.textContent = "Correction request needs a little more information before it can be prepared.";
        submitStatus.className = "text-sm font-semibold text-red-700";
      }
      return;
    }

    if (submitStatus) {
      submitStatus.textContent = "Preparing correction request PDF and email payload...";
      submitStatus.className = "text-sm font-semibold text-slate-600";
    }

    try {
      const submission = buildRecordCorrectionSubmission({
        data,
        rows,
        formValues: values,
        selectedItems: items,
        governingOffice
      });
      const pdfBytes = await generateRecordCorrectionPdf(submission);
      const emailPayload = buildRecordCorrectionEmailPayload(submission, pdfBytes);
      const delivery = await deliverRecordCorrectionEmail(emailPayload, pdfBytes);

      if (submitStatus) {
        if (delivery.delivered) {
          submitStatus.textContent = "The property record correction request has been sent to the Assessor's Office. A copy has also been sent to the email provided.";
          submitStatus.className = "text-sm font-semibold text-emerald-700";
          localStorage.removeItem(draftKey);
        } else {
          downloadGeneratedPdf(pdfBytes, emailPayload.attachment.fileName);
          submitStatus.textContent = `Correction-request PDF downloaded for review. This demonstration does not send email to ${emailPayload.to}, so your draft remains available in this browser.`;
          submitStatus.className = "text-sm font-semibold text-amber-800";
        }
      }
    } catch (error) {
      console.error("Property record correction request submission failed", error);
      if (submitStatus) {
        submitStatus.textContent = `Correction request could not be prepared: ${error.message}`;
        submitStatus.className = "text-sm font-semibold text-red-700";
      }
    }
  });
}

function downloadGeneratedPdf(bytes, fileName) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function deliverRecordCorrectionEmail(emailPayload, pdfBytes) {
  const service = window.propertyCorrectionEmailService;

  if (!service?.send) {
    return { delivered: false, developmentMode: true };
  }

  await service.send({
    ...emailPayload,
    attachment: {
      ...emailPayload.attachment,
      bytes: pdfBytes
    }
  });

  return { delivered: true, developmentMode: false };
}

function initReportErrorModal(data, recordCard, governingOffice) {
  const modal = document.getElementById("reportErrorModal");
  const closeButtons = document.querySelectorAll("[data-close-report-error]");

  if (!modal) return;

  initDiscrepancySubmission(data, recordCard, governingOffice);

  function close() {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
  }

  function open() {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
  }

  document.addEventListener("click", event => {
    const trigger = event.target.closest?.("[data-report-error]");
    if (!trigger) return;

    event.preventDefault();
    open();
  });
  modal.addEventListener("click", close);
  modal.querySelector("[role='dialog']").addEventListener("click", event => event.stopPropagation());
  closeButtons.forEach(button => button.addEventListener("click", close));

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") close();
  });
}

function disclosure(title, meta, content) {
  return `
    <details class="record-disclosure sm:col-span-2 rounded-xl">
      <summary class="record-disclosure-toggle cursor-pointer list-none rounded-xl px-4 py-3 font-semibold">
        <div class="record-disclosure-summary">
          <span class="record-disclosure-summary-copy">
            <span class="record-disclosure-title">${title}</span>
            <span class="record-disclosure-meta rounded-full px-2 py-0.5 text-xs font-semibold">${meta}</span>
          </span>
          <span class="record-disclosure-chevron-shell" aria-hidden="true">
            <span class="record-disclosure-chevron"></span>
          </span>
        </div>
      </summary>
      <div class="table-shell">${content}</div>
    </details>
  `;
}

function recordCardSource(recordCard) {
  if (!recordCard) return "";

  if (!hasDetailedRecordCard(recordCard)) {
    return disclosure("What source record is this based on?", recordCard.recordStatus || "Pending", `
      <div class="bg-slate-50 p-3 text-sm leading-6 text-slate-600">
        <p class="font-semibold text-slate-700">${escapeHtml(recordCard.source || "Source record pending")}</p>
          <p class="mt-1">${escapeHtml(recordCard.notes || "Detailed record-card fields are not available in this guide.")}</p>
      </div>
    `);
  }

  const printed = new Date(recordCard.source.printedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });

  const reviewRows = recordCard.reviewHistory?.length
    ? `
      <section class="border-t border-slate-200">
        <div class="flex items-center justify-between gap-3 bg-slate-50 px-3 py-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Record review history</p>
          <p class="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">${recordCard.reviewHistory.length} events</p>
        </div>
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-white">
            <tr>
              <th class="px-3 py-2 text-left font-semibold">Date</th>
              <th class="px-3 py-2 text-left font-semibold">Action</th>
              <th class="px-3 py-2 text-left font-semibold">Initials</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 [&>tr:nth-child(even)]:bg-slate-50">
            ${recordCard.reviewHistory.map(row => `
              <tr>
                <td class="px-3 py-2 font-medium">${row.date}</td>
                <td class="px-3 py-2">${escapeHtml(row.action)}</td>
                <td class="px-3 py-2">${escapeHtml(row.initials)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </section>
    `
    : "";

  return disclosure("What source record is this based on?", recordCard.source.system, `
    <table class="min-w-full divide-y divide-slate-200 text-sm">
      <tbody class="divide-y divide-slate-200 [&>tr:nth-child(even)]:bg-slate-50">
        ${[
          ["Source system", recordCard.source.system],
          ["Report", recordCard.source.reportName],
          ["Record type", recordCard.source.recordType],
          ["Printed", printed],
          ["Card / perm", recordCard.parcelIdentifiers.cardFilePerm],
          ["Cadastral ID", recordCard.parcelIdentifiers.cadastralId],
            ["State property class code", recordCard.parcelIdentifiers.padClassCode],
          ["Appraiser ID", recordCard.parcelIdentifiers.appraiserId]
        ].map(([label, value], index) => `
          <tr>
            <td class="px-3 py-2 font-semibold text-slate-700">${label}</td>
            <td class="px-3 py-2">${escapeHtml(value)}</td>
            ${index % 2 === 0 ? "" : ""}
          </tr>
        `).join("")}
      </tbody>
    </table>
      <p class="border-t border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500">This summary is based on the property data available in this prototype. Official county records should be used to confirm parcel details, values, filing requirements, and deadlines.</p>
    ${reviewRows}
  `);
}

function ownershipHistory(recordCard) {
  if (!recordCard?.ownershipHistory?.length) return "";

  return disclosure("What sale and ownership history is on record?", `${recordCard.ownershipHistory.length} transfers`, `
    <table class="min-w-full divide-y divide-slate-200 text-sm">
      <thead class="bg-slate-50">
        <tr>
          <th class="px-3 py-2 text-left font-semibold">Sale date</th>
          <th class="px-3 py-2 text-left font-semibold">Book / page</th>
          <th class="px-3 py-2 text-left font-semibold">Owner</th>
          <th class="px-3 py-2 text-right font-semibold">Amount</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-200 [&>tr:nth-child(even)]:bg-slate-50">
        ${recordCard.ownershipHistory.map(row => `
          <tr>
            <td class="px-3 py-2 font-medium">${row.saleDate}</td>
            <td class="px-3 py-2">${row.book} / ${row.page}</td>
            <td class="px-3 py-2">${escapeHtml(row.owner)}</td>
            <td class="px-3 py-2 text-right">${formatNullableMoney(row.amount)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `);
}

function recordCardValuationHistory(recordCard) {
  if (!recordCard?.valuationHistory?.length) return "";

  const rows = sortHistoryDescending(recordCard.valuationHistory)
    .filter(row => row.year >= 2019 && row.year <= 2026);

  return disclosure("What values and taxes appear on the record card?", `${rows.length} years`, `
    <table class="min-w-full divide-y divide-slate-200 text-sm">
      <thead class="bg-slate-50">
        <tr>
          <th class="px-3 py-2 text-left font-semibold">Year</th>
          <th class="px-3 py-2 text-right font-semibold">Building</th>
          <th class="px-3 py-2 text-right font-semibold">Other</th>
          <th class="px-3 py-2 text-right font-semibold">Land</th>
          <th class="px-3 py-2 text-right font-semibold">Taxable</th>
          <th class="px-3 py-2 text-right font-semibold">Total tax</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-200 [&>tr:nth-child(even)]:bg-slate-50">
        ${rows.map(row => `
          <tr>
            <td class="px-3 py-2 font-medium">${row.year}</td>
            <td class="px-3 py-2 text-right">${formatNullableMoney(row.building)}</td>
            <td class="px-3 py-2 text-right">${formatNullableMoney(row.other)}</td>
            <td class="px-3 py-2 text-right">${formatNullableMoney(row.land)}</td>
            <td class="px-3 py-2 text-right font-semibold">${formatNullableMoney(row.taxable)}</td>
            <td class="px-3 py-2 text-right">${formatNullableMoney(row.totalTax, true)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `);
}

function propertyValueTaxHistory(data, recordCard) {
  const valueByYear = new Map((data.assessedValueBreakdown || []).map(row => [row.year, row]));
  const taxByYear = new Map((data.taxpayerHistory || []).map(row => [row.year, row]));
  const statementByYear = new Map(finalizedTaxStatements(data).map(statement => [statement.taxYear, statement]));
  const recordByYear = new Map((recordCard?.valuationHistory || []).map(row => [row.year, row]));
  const years = [...new Set([
    ...valueByYear.keys(),
    ...taxByYear.keys(),
    ...statementByYear.keys(),
    ...recordByYear.keys()
  ])].sort((a, b) => b - a);

  if (!years.length) return "";

  const rows = years.map(year => {
    const valueRow = valueByYear.get(year);
    const taxRow = taxByYear.get(year);
    const statement = statementByYear.get(year);
    const recordRow = recordByYear.get(year);
    const totalAssessed = valueRow?.total ?? taxRow?.assessedValue ?? statement?.assessedValue ?? recordRow?.total ?? null;

    return {
      year,
      totalAssessed,
      land: valueRow?.land ?? recordRow?.land ?? null,
      dwelling: valueRow?.dwelling ?? recordRow?.building ?? null,
      outbuilding: valueRow?.outbuilding ?? recordRow?.other ?? null,
      taxableValue: statement?.assessedValue ?? recordRow?.taxable ?? totalAssessed,
      netTax: statement?.netAmountDue ?? statement?.totalTaxesDue ?? taxRow?.taxes ?? recordRow?.totalTax ?? null,
      totalPaid: statement?.totalPaid ?? null,
      taxDue: statement?.taxDue ?? null
    };
  });
  const latestKnownRow = rows.find(row => row.totalAssessed !== null && row.totalAssessed !== undefined);
  const taxRowCount = rows.filter(row => row.netTax !== null && row.netTax !== undefined).length;
  const rowLabel = taxRowCount === 1 ? "tax year" : "tax years";

  return disclosure(
    "What is the property’s value and tax history?",
    `${taxRowCount} ${rowLabel} · latest known ${formatNullableMoney(latestKnownRow?.totalAssessed)}`,
    `
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-3 py-2 text-left font-semibold">Year</th>
            <th class="px-3 py-2 text-right font-semibold">Total assessed</th>
            <th class="px-3 py-2 text-right font-semibold">Land</th>
            <th class="px-3 py-2 text-right font-semibold">Dwelling / improvements</th>
            <th class="px-3 py-2 text-right font-semibold">Outbuilding</th>
            <th class="px-3 py-2 text-right font-semibold">Taxable value</th>
            <th class="px-3 py-2 text-right font-semibold">Net tax</th>
            <th class="px-3 py-2 text-right font-semibold">Paid</th>
            <th class="px-3 py-2 text-right font-semibold">Balance</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-slate-200 bg-white">
          ${rows.map((row, index) => `
              <tr class="${index % 2 === 0 ? "bg-white" : "bg-slate-50"}">
                <td class="px-3 py-2 font-medium">${row.year}</td>
                <td class="px-3 py-2 text-right font-semibold">${formatNullableMoney(row.totalAssessed)}</td>
                <td class="px-3 py-2 text-right">${formatNullableMoney(row.land)}</td>
                <td class="px-3 py-2 text-right">${formatNullableMoney(row.dwelling)}</td>
                <td class="px-3 py-2 text-right">${formatNullableMoney(row.outbuilding)}</td>
                <td class="px-3 py-2 text-right">${formatNullableMoney(row.taxableValue)}</td>
                <td class="px-3 py-2 text-right">${formatNullableMoney(row.netTax, true)}</td>
                <td class="px-3 py-2 text-right">${formatNullableMoney(row.totalPaid, true)}</td>
                <td class="px-3 py-2 text-right">${formatNullableMoney(row.taxDue, true)}</td>
              </tr>
          `).join("")}
        </tbody>
      </table>
      <p class="border-t border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500">
        Value components come from the assessment source where available. Net tax, payment, and balance columns come from tax statements where available, so older tax-only years intentionally leave assessor-value detail blank.
      </p>
    `
  );
}

function classificationDetails(data) {
  return disclosure("How is this property classified?", "6 fields", `
    <table class="min-w-full divide-y divide-slate-200 text-sm">
      <tbody class="divide-y divide-slate-200 [&>tr:nth-child(even)]:bg-slate-50">
        <tr>
          <td class="px-3 py-2 font-semibold text-slate-700">Status</td>
          <td class="px-3 py-2">${data.classification.status}</td>
          <td class="border-l border-slate-200 px-3 py-2 font-semibold text-slate-700">Location</td>
          <td class="px-3 py-2">${data.classification.location}</td>
        </tr>
        <tr>
          <td class="px-3 py-2 font-semibold text-slate-700">Property class</td>
          <td class="px-3 py-2">${data.classification.propertyClass}</td>
          <td class="border-l border-slate-200 px-3 py-2 font-semibold text-slate-700">City size</td>
          <td class="px-3 py-2">${data.classification.citySize}</td>
        </tr>
        <tr>
          <td class="px-3 py-2 font-semibold text-slate-700">Zoning</td>
          <td class="px-3 py-2">${data.classification.zoning}</td>
          <td class="border-l border-slate-200 px-3 py-2 font-semibold text-slate-700">Lot size</td>
          <td class="px-3 py-2">${data.classification.lotSize}</td>
        </tr>
      </tbody>
    </table>
  `);
}

function propertyNotes(data) {
  const rows = data.propertyNotes.length
    ? data.propertyNotes.map(row => `<tr><td class="px-3 py-2">${row.date}</td><td class="px-3 py-2">${row.note}</td></tr>`).join("")
    : `<tr><td class="px-3 py-3 text-slate-500" colspan="2">No public property notes listed.</td></tr>`;
  const meta = data.propertyNotes.length === 1 ? "1 note" : `${data.propertyNotes.length} notes`;

  return disclosure("Are there notes or special conditions?", meta, `
    <table class="min-w-full divide-y divide-slate-200 text-sm">
      <thead class="bg-slate-50"><tr><th class="px-3 py-2 text-left font-semibold">Date</th><th class="px-3 py-2 text-left font-semibold">Note</th></tr></thead>
      <tbody class="divide-y divide-slate-200">${rows}</tbody>
    </table>
  `);
}

function landInformation(data, recordCard) {
  const rows = data.landInformation || [];
  const meta = rows.length === 1 ? "1 land record" : `${rows.length} land records`;
  const landModel = recordCard?.landModel;
  const locationModel = recordCard?.locationModel;

  const rowSquareFeet = row => {
    if (row.squareFeet !== null && row.squareFeet !== undefined) return Number(row.squareFeet) || 0;
    if (row.acres !== null && row.acres !== undefined) return (Number(row.acres) || 0) * 43560;
    return 0;
  };

  const totalSquareFeet = rows.reduce(
    (sum, row) => sum + rowSquareFeet(row),
    0
  );

  const totalAcres = totalSquareFeet / 43560;
  const areaLabel = row => {
    if (row.acres !== null && row.acres !== undefined) return `${Number(row.acres).toLocaleString()} ac.`;
    if (row.squareFeet !== null && row.squareFeet !== undefined) return `${Number(row.squareFeet).toLocaleString()} sq. ft.`;
    return "Area not listed";
  };

  return disclosure("How is the land described?", meta, `
    ${landModel && locationModel ? `
      <div class="grid gap-3 border-b border-slate-200 bg-slate-50 p-3 text-sm md:grid-cols-3">
        ${[
          ["Neighborhood", locationModel.neighborhood],
          ["Valuation group", locationModel.valuationGroup],
          ["Model / method", `${locationModel.model} / ${locationModel.method}`],
          ["Land model", landModel.description],
          ["Model lot size", landModel.lotSize ? `${Number(landModel.lotSize).toLocaleString()} sq. ft.` : null],
          ["Recorded lot value", formatNullableMoney(landModel.recordedLotValue)]
        ].map(([label, value]) => `
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</p>
            <p class="mt-1 font-semibold text-slate-700">${escapeHtml(value)}</p>
          </div>
        `).join("")}
      </div>
    ` : ""}
    <table class="min-w-full divide-y divide-slate-200 text-sm">
      <thead class="bg-slate-50">
        <tr>
          <th class="px-3 py-2 text-left font-semibold">Description</th>
          <th class="px-3 py-2 text-right font-semibold">Width</th>
          <th class="px-3 py-2 text-right font-semibold">Depth</th>
          <th class="px-3 py-2 text-right font-semibold">Area</th>
        </tr>
      </thead>

      <tbody class="divide-y divide-slate-200 [&>tr:nth-child(even)]:bg-slate-50">
        ${rows.map(row => `
          <tr>
            <td class="px-3 py-2 font-medium">${row.description}</td>
            <td class="px-3 py-2 text-right">${row.widthFeet !== null && row.widthFeet !== undefined ? `${row.widthFeet} ft.` : "—"}</td>
            <td class="px-3 py-2 text-right">${row.depthFeet !== null && row.depthFeet !== undefined ? `${row.depthFeet} ft.` : "—"}</td>
            <td class="px-3 py-2 text-right">${areaLabel(row)}</td>
          </tr>
        `).join("")}

        <tr class="table-total-row font-semibold">
          <td class="px-3 py-3">Total land area</td>
          <td class="px-3 py-3 text-right">—</td>
          <td class="px-3 py-3 text-right">—</td>
          <td class="px-3 py-3 text-right">
            ${totalSquareFeet.toLocaleString()} sq. ft. · ${totalAcres.toFixed(2)} ac.
          </td>
        </tr>
      </tbody>
    </table>
    ${landModel?.cutoffSchedule?.length ? `
      <div class="border-t border-slate-200 bg-white p-3">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Land cutoff schedule</p>
        <div class="grid gap-2 sm:grid-cols-3">
          ${landModel.cutoffSchedule.map(row => `
            <div class="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Cutoff ${Number(row.cutoff).toLocaleString()}</p>
              <p class="mt-1 font-semibold text-slate-700">${row.value.toFixed(3)}</p>
            </div>
          `).join("")}
        </div>
      </div>
    ` : ""}
  `);
}

function hasMarshallSwiftCostDetail(cost) {
  return Boolean(
    cost
    && cost.available !== false
    && cost.adjustments
    && cost.adjustedCost !== null
    && cost.adjustedCost !== undefined
    && cost.rcnld !== null
    && cost.rcnld !== undefined
  );
}

function sourceExtractDetails(recordCard) {
  const sections = recordCard?.sourceExtract?.sections || [];
  if (!sections.length) return "";

  const meta = sections.length === 1 ? "1 source table" : `${sections.length} source tables`;
  const cellValue = value => value === null || value === undefined || value === "" ? "—" : escapeHtml(value);

  return disclosure("What details were available from the source export?", meta, `
    <div class="bg-slate-50 p-3 text-sm leading-6 text-slate-600">
      ${escapeHtml(recordCard.sourceExtract.note || "These are the structured facts visible in the source export. Fields not included by the source are left unavailable rather than inferred.")}
    </div>
    <div class="grid gap-4 border-t border-slate-200 p-3">
      ${sections.map(section => `
        <section>
          <div class="mb-2 flex items-center justify-between gap-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${escapeHtml(section.title)}</p>
            ${section.summary ? `<p class="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">${escapeHtml(section.summary)}</p>` : ""}
          </div>
          <div class="table-clip ring-1 ring-slate-200">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50">
                <tr>${section.columns.map(column => `<th class="px-3 py-2 text-left font-semibold">${escapeHtml(column)}</th>`).join("")}</tr>
              </thead>
              <tbody class="divide-y divide-slate-200 bg-white [&>tr:nth-child(even)]:bg-slate-50">
                ${section.rows.map(row => `
                  <tr>${row.map(value => `<td class="px-3 py-2">${cellValue(value)}</td>`).join("")}</tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </section>
      `).join("")}
    </div>
  `);
}

function technicalCostModel(recordCard, data) {
  if (!hasMarshallSwiftCostDetail(recordCard?.costApproach)) return "";

  const cost = recordCard.costApproach;
  const noticeValues = valuationNoticeValues(data, recordCard).current;
  const assessedRows = (data.assessedValueBreakdown || [])
    .filter(row => row.total !== null && row.total !== undefined)
    .slice()
    .sort((a, b) => b.year - a.year);
  const currentValue = assessedRows[0];
  const garageLines = recordCard.garageCostLines || [];
  const miscLines = recordCard.miscImprovements || [];
  const outbuildingRows = data.outbuildingData || [];
  const landRows = data.landInformation || [];
  const dwellingModelValue = Number(cost.rcnld) || 0;
  const depreciationAmount = Number(cost.depreciation?.amount) || 0;
  const physicalDepreciation = cost.depreciation?.physicalPercent;
  const garageTotal = garageLines.reduce((sum, row) => sum + row.rcnld, 0);
  const miscTotal = miscLines.reduce((sum, row) => sum + row.value, 0);
  const landValue = noticeValues.land ?? currentValue?.land ?? 0;
  const buildingValue = noticeValues.building ?? currentValue?.dwelling ?? recordCard.propertyValuation?.buildings ?? 0;
  const otherImprovementValue = noticeValues.improvement ?? recordCard.propertyValuation?.improvement ?? 0;
  const outbuildingValue = currentValue?.outbuilding ?? 0;
  const totalValue = noticeValues.total ?? currentValue?.total ?? landValue + buildingValue + otherImprovementValue;
  const residentialInfo = recordCard.residentialInformation || {};
  const reconciliation = recordCard.valuationReconciliation || {};
  const modeledComponentTotal = dwellingModelValue + garageTotal + miscTotal + outbuildingValue + landValue;
  const reconciliationAdjustment = Number.isFinite(reconciliation.modelToFinalReconciliation)
    ? reconciliation.modelToFinalReconciliation
    : totalValue - modeledComponentTotal;
  const showReconciliationAdjustment = Math.abs(reconciliationAdjustment) >= 1;
  const formatSignedMoney = value => {
    if (value === null || value === undefined) return "—";
    if (value === 0) return formatNullableMoney(value);
    return `${value > 0 ? "+" : "-"}${formatNullableMoney(Math.abs(value))}`;
  };
  const depreciationText = depreciationAmount
    ? `${formatSignedMoney(-depreciationAmount)}${physicalDepreciation ? ` (${physicalDepreciation}% physical)` : ""}`
    : physicalDepreciation ? `${physicalDepreciation}% physical` : "—";
  const landAreaLabel = row => {
    if (!row?.squareFeet) return "Area not listed";
    const squareFeet = Number(row.squareFeet);
    return `${squareFeet.toLocaleString()} sq. ft.`;
  };
  const rollupRows = [
    { label: "Dwelling model after depreciation", value: dwellingModelValue },
    ...(garageTotal ? [{ label: "Garages", value: garageTotal }] : []),
    ...(miscTotal ? [{ label: "Miscellaneous improvements", value: miscTotal }] : []),
    ...(outbuildingValue ? [{ label: "Outbuildings", value: outbuildingValue }] : []),
    ...(showReconciliationAdjustment ? [{
      label: "Recorded improvement adjustment",
      value: reconciliationAdjustment,
      displayValue: reconciliationAdjustment < 0
        ? `-${formatNullableMoney(Math.abs(reconciliationAdjustment))}`
        : formatNullableMoney(reconciliationAdjustment)
    }] : []),
    { label: "Land value", value: landValue }
  ];
  const valueStack = [
    ["Land value", landValue],
    ["Building and site improvements", buildingValue],
    ...(otherImprovementValue ? [["Other improvements", otherImprovementValue]] : [])
  ];

  return disclosure("What makes up this property's assessed value?", `Latest known total ${formatNullableMoney(totalValue)}`, `
    <div class="bg-slate-50 p-3 text-sm leading-6 text-slate-600">
      Land and improvements are valued separately. Land is analyzed as if vacant; structures and site improvements are modeled independently.
    </div>
    <div class="border-t border-slate-200 p-3">
      <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Assessed value composition</p>
      <p class="mb-3 text-sm leading-6 text-slate-600">This shows the land and improvement values that add up to the assessed value.</p>
      <div class="overflow-hidden rounded-xl ring-1 ring-slate-200">
        <div class="bg-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Land</div>
        <div class="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-200 bg-white px-3 py-2 text-sm">
          <p class="font-medium text-slate-700">${valueStack[0][0]}</p>
          <p class="font-semibold text-slate-700">${formatNullableMoney(valueStack[0][1])}</p>
        </div>
        <div class="bg-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Improvements</div>
        ${valueStack.map(([label, value], index) => `
          ${index === 0 ? "" : `
          <div class="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-200 px-3 py-2 text-sm ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}">
            <p class="font-medium text-slate-700">${label}</p>
            <p class="font-semibold text-slate-700">${formatNullableMoney(value)}</p>
          </div>
          `}
        `).join("")}
        <div class="grid grid-cols-[1fr_auto] items-center gap-3 bg-slate-700 px-3 py-3 text-sm text-white">
          <p class="font-semibold">Total assessed value</p>
          <p class="text-base font-bold">${formatNullableMoney(totalValue)}</p>
        </div>
      </div>
    </div>
    <details class="border-t border-slate-200 bg-white">
      <summary class="valuation-detail-toggle flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-semibold">
        <span class="flex min-w-0 items-center gap-2">
          <span class="valuation-detail-chevron" aria-hidden="true"></span>
          <span class="truncate">View cost model and valuation components</span>
        </span>
        <span class="hidden text-xs font-semibold sm:inline">Detailed model</span>
      </summary>
      <div class="grid gap-4 border-t border-slate-200 p-3">
        <section class="dwelling-model-panel">
          <div class="dwelling-model-heading">
            <p>Marshall & Swift dwelling model</p>
            <p class="component-subtotal-pill">Subtotal ${formatNullableMoney(dwellingModelValue)}</p>
          </div>
          <div class="dwelling-model-list">
            <section class="dwelling-model-group">
              <p class="dwelling-model-group-title">Structure model</p>
              <div class="dwelling-model-rows">
                ${[
                  ["Residential type", residentialInfo.type],
                  ["Quality", residentialInfo.quality],
                  ["Condition", residentialInfo.condition],
                  ["Base / total area", residentialInfo.baseTotalArea],
                  ["Year / effective age", cost.yearEffectiveAge]
                ].map(([label, value]) => `
                  <div class="dwelling-model-row">
                    <p>${label}</p>
                    <p>${escapeHtml(value)}</p>
                  </div>
                `).join("")}
              </div>
            </section>
            <section class="dwelling-model-group">
              <p class="dwelling-model-group-title">Costing</p>
              <div class="dwelling-model-rows">
                ${[
                  ["Base cost", moneyCents.format(cost.baseCost)],
                  ["Adjusted cost", cost.adjustedCost.toFixed(3)],
                  ["RCN", formatNullableMoney(cost.rcn)],
                  ["Depreciation adjustment", depreciationText],
                  ["RCNLD", formatNullableMoney(dwellingModelValue)],
                  ["Cost per sq. ft.", moneyCents.format(cost.costPerSquareFoot)]
                ].map(([label, value]) => `
                  <div class="dwelling-model-row">
                    <p>${label}</p>
                    <p>${escapeHtml(value)}</p>
                  </div>
                `).join("")}
              </div>
            </section>
            <section class="dwelling-model-group">
              <p class="dwelling-model-group-title">Systems</p>
              <div class="dwelling-model-rows">
                <div class="dwelling-model-row">
                  <p>Heating / cooling</p>
                  <p>${escapeHtml(residentialInfo.heatingCooling)}</p>
                </div>
              </div>
            </section>
            <section class="dwelling-model-group">
              <p class="dwelling-model-group-title">Cost adjustments</p>
              <div class="dwelling-model-rows dwelling-model-adjustments">
                ${[
                  ["Roofing", cost.adjustments.roofing],
                  ["Subfloor", cost.adjustments.subfloor],
                  ["Heat / cool", cost.adjustments.heatCool],
                  ["Plumbing", cost.adjustments.plumbing],
                  ["Basement", cost.adjustments.basement]
                ].map(([label, value]) => `
                  <div class="dwelling-model-row">
                    <p>${label}</p>
                    <p>${Number(value).toFixed(2)}</p>
                  </div>
                `).join("")}
              </div>
            </section>
          </div>
        </section>
        <section>
          <div class="mb-2 flex items-center justify-between gap-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Garages</p>
            <p class="component-subtotal-pill rounded-full px-2 py-1 text-xs font-semibold">Subtotal ${formatNullableMoney(garageTotal)}</p>
          </div>
          <div class="table-clip ring-1 ring-slate-200">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50"><tr><th class="px-3 py-2 text-left font-semibold">Description</th><th class="px-3 py-2 text-right font-semibold">Units</th><th class="px-3 py-2 text-right font-semibold">Value</th></tr></thead>
              <tbody class="divide-y divide-slate-200 bg-white [&>tr:nth-child(even)]:bg-slate-50">
                ${garageLines.map(row => `
                  <tr>
                    <td class="px-3 py-2">${row.description}</td>
                    <td class="px-3 py-2 text-right">${row.units}</td>
                    <td class="px-3 py-2 text-right">${formatNullableMoney(row.rcnld)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <div class="mb-2 flex items-center justify-between gap-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Miscellaneous improvements</p>
            <p class="component-subtotal-pill rounded-full px-2 py-1 text-xs font-semibold">Subtotal ${formatNullableMoney(miscTotal)}</p>
          </div>
          <div class="table-clip ring-1 ring-slate-200">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50"><tr><th class="px-3 py-2 text-left font-semibold">Item</th><th class="px-3 py-2 text-right font-semibold">Units</th><th class="px-3 py-2 text-right font-semibold">Value</th></tr></thead>
              <tbody class="divide-y divide-slate-200 bg-white [&>tr:nth-child(even)]:bg-slate-50">
                ${miscLines.map(row => `
                  <tr>
                    <td class="px-3 py-2">${row.description}</td>
                    <td class="px-3 py-2 text-right">${Number(row.units).toLocaleString()}</td>
                    <td class="px-3 py-2 text-right">${formatNullableMoney(row.value)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </section>
        ${outbuildingRows.length ? `
          <section>
            <div class="mb-2 flex items-center justify-between gap-3">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Outbuildings</p>
              <p class="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">${outbuildingRows.length === 1 ? "1 record" : `${outbuildingRows.length} records`}</p>
            </div>
            <div class="table-clip ring-1 ring-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50"><tr><th class="px-3 py-2 text-left font-semibold">Description</th><th class="px-3 py-2 text-right font-semibold">Units</th><th class="px-3 py-2 text-right font-semibold">Year Built</th><th class="px-3 py-2 text-right font-semibold">Cost</th></tr></thead>
                <tbody class="divide-y divide-slate-200 bg-white">
                  ${outbuildingRows.map(row => `
                    <tr>
                      <td class="px-3 py-2">${row.description}</td>
                      <td class="px-3 py-2 text-right">${row.units}</td>
                      <td class="px-3 py-2 text-right">${row.yearBuilt}</td>
                      <td class="px-3 py-2 text-right">${row.cost}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </section>
        ` : ""}
        <section>
          <div class="mb-2 flex items-center justify-between gap-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Land added back in</p>
            <p class="component-subtotal-pill rounded-full px-2 py-1 text-xs font-semibold">Subtotal ${formatNullableMoney(landValue)}</p>
          </div>
          <div class="table-clip ring-1 ring-slate-200">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50"><tr><th class="px-3 py-2 text-left font-semibold">Description</th><th class="px-3 py-2 text-right font-semibold">Record detail</th></tr></thead>
              <tbody class="divide-y divide-slate-200 bg-white [&>tr:nth-child(even)]:bg-slate-50">
                ${landRows.length ? landRows.map(row => `
                  <tr>
                    <td class="px-3 py-2">${row.description}</td>
                    <td class="px-3 py-2 text-right">${landAreaLabel(row)}</td>
                  </tr>
                `).join("") : `
                  <tr>
                    <td class="px-3 py-2">Land value</td>
                    <td class="px-3 py-2 text-right">${formatNullableMoney(landValue)}</td>
                  </tr>
                `}
                <tr class="font-semibold">
                  <td class="px-3 py-3">Total land value</td>
                  <td class="px-3 py-3 text-right">${formatNullableMoney(landValue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <div class="assessment-rollup-summary">
          <div class="assessment-rollup-copy">
            <p>Component rollup</p>
            <p>Improvement values are reconciled to the recorded building/site improvement total, then land is added to reach the assessed value.</p>
          </div>
          <div class="assessment-rollup-table">
            ${rollupRows.map(row => `
              <div class="assessment-rollup-row">
                <div class="assessment-rollup-label">
                  <p>${row.label}</p>
                  ${row.note ? `<p>${row.note}</p>` : ""}
                </div>
                <p>${row.displayValue ?? formatNullableMoney(row.value)}</p>
              </div>
            `).join("")}
            <div class="assessment-rollup-row assessment-rollup-total">
              <p>Total assessed value</p>
              <p>${formatNullableMoney(totalValue)}</p>
            </div>
          </div>
        </div>
      </div>
    </details>
  `);
}

function dwellingData(data) {
  const totalValue = data.dwellingData.reduce((sum, row) => sum + row.value, 0);
  const itemLabel = data.dwellingData.length === 1 ? "item" : "items";

  return disclosure("What additional features contribute to value?", `${data.dwellingData.length} ${itemLabel} · ${money.format(totalValue)}`, `
    <table class="min-w-full divide-y divide-slate-200 text-sm">
      <thead class="bg-slate-50">
        <tr><th class="px-3 py-2 text-left font-semibold">Description</th><th class="px-3 py-2 text-right font-semibold">Units</th><th class="px-3 py-2 text-right font-semibold">Value</th></tr>
      </thead>
      <tbody class="divide-y divide-slate-200 [&>tr:nth-child(even)]:bg-slate-50">
        ${data.dwellingData.map(row => `
          <tr>
            <td class="px-3 py-2">${row.description}</td>
            <td class="px-3 py-2 text-right">${row.units}</td>
            <td class="px-3 py-2 text-right">${money.format(row.value)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `);
}

function outbuildingData(data) {
  const rows = data.outbuildingData.length
    ? data.outbuildingData.map(row => `<tr><td class="px-3 py-2">${row.description}</td><td class="px-3 py-2 text-right">${row.units}</td><td class="px-3 py-2 text-right">${row.yearBuilt}</td><td class="px-3 py-2 text-right">${row.cost}</td></tr>`).join("")
    : `<tr><td class="px-3 py-3 text-slate-500" colspan="4">No outbuilding records listed for this property.</td></tr>`;
  const meta = data.outbuildingData.length
    ? data.outbuildingData.length === 1 ? "1 outbuilding" : `${data.outbuildingData.length} outbuildings`
    : "No records";

  return disclosure("What additional structures are included?", meta, `
    <table class="min-w-full divide-y divide-slate-200 text-sm">
      <thead class="bg-slate-50">
        <tr><th class="px-3 py-2 text-left font-semibold">Description</th><th class="px-3 py-2 text-right font-semibold">Units</th><th class="px-3 py-2 text-right font-semibold">Year Built</th><th class="px-3 py-2 text-right font-semibold">Cost</th></tr>
      </thead>
      <tbody class="divide-y divide-slate-200">${rows}</tbody>
    </table>
  `);
}

function formatRatioPercent(value) {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toFixed(2)}%`;
}

function marketClassNoun(classKey) {
  if (classKey === "commercial") return "commercial";
  if (classKey === "agricultural") return "agricultural";
  return "residential";
}

function marketGroupKind(classKey) {
  return classKey === "agricultural" ? "market area" : "valuation group";
}

function selectedSummaryMarket(data, recordCard, summaryContext = {}) {
  const classKey = getParcelMarketClass(data);
  const classStats = getClassMarketStats(summaryContext.marketPositionData, classKey);
  const groupId = getParcelMarketGroupId(recordCard, classStats?.classKey ?? classKey);
  const selectedMarket = classStats?.groups?.find(group => String(group.id) === String(groupId));

  if (selectedMarket) {
    return {
      classKey: classStats.classKey,
      selectedMarket
    };
  }

  if (classKey === "residential") {
    const selectedLegacyMarket = summaryContext.padRatioData?.valuationGroups?.find(group => String(group.group) === String(groupId));

    if (selectedLegacyMarket) {
      return {
        classKey,
        selectedMarket: selectedLegacyMarket
      };
    }
  }

  return null;
}

function localMarketQuickReadLine(selectedMarket, context = {}) {
  const count = Number(selectedMarket?.count) || 0;
  const saleNoun = count === 1 ? "sale" : "sales";
  const ratio = formatRatioPercent(selectedMarket?.median);
  const classNoun = marketClassNoun(context.classKey);
  const groupKind = marketGroupKind(context.classKey);
  const studyLabel = `this ${classNoun} ${groupKind}`;

  if (count === 1) {
    return `
      There was <strong>1 qualified ${classNoun} sale</strong> in ${studyLabel}.
      That sale was assessed at <strong>${ratio}</strong> of sale price, so it is a context clue rather than a broad market pattern.
    `;
  }

  if (count < 5) {
    return `
      There were <strong>${count.toLocaleString()} qualified ${classNoun} ${saleNoun}</strong> in ${studyLabel}.
      The median result was <strong>${ratio}</strong> of sale price, but a sample this small can move a lot from one sale to the next.
    `;
  }

  if (count < 10) {
    return `
      There were <strong>${count.toLocaleString()} qualified ${classNoun} sales</strong> in ${studyLabel}.
      The middle sale was assessed at <strong>${ratio}</strong> of sale price, so this should be read as limited context.
    `;
  }

  if (count < 25) {
    return `
      There were <strong>${count.toLocaleString()} qualified ${classNoun} sales</strong> in ${studyLabel}.
      The middle sale was assessed at <strong>${ratio}</strong> of sale price, based on a modest local sample.
    `;
  }

  return `
    There were <strong>${count.toLocaleString()} qualified ${classNoun} sales</strong> in ${studyLabel}.
    The middle sale was assessed at <strong>${ratio}</strong> of sale price, based on a strong local sample.
  `;
}

function renderSummary(data, recordCard, summaryContext = {}) {
  const snapshot = getSnapshotHistory(data);
  const previousValue = getPreviousFinalValueHistory(data);
  const valueChangeFromPrior = previousValue?.assessedValue && snapshot.assessedValue
    ? (snapshot.assessedValue - previousValue.assessedValue) / previousValue.assessedValue
    : null;
  const marketSummary = selectedSummaryMarket(data, recordCard, summaryContext);
  const currentValueLine = snapshot.assessedValue === null || snapshot.assessedValue === undefined
    ? `
      For <strong>${snapshot.year}</strong>, the assessed value has <strong>not been published yet</strong>.
      The latest finalized value is <strong>${formatNullableMoney(previousValue?.assessedValue)}</strong>
      for <strong>${previousValue?.year ?? "the prior year"}</strong>.
    `
    : `
      For <strong>${snapshot.year}</strong>, the assessed value is <strong>${formatNullableMoney(snapshot.assessedValue)}</strong>,
      <strong>${formatNullablePercent(valueChangeFromPrior)}</strong> from the prior finalized value.
    `;
  const taxTimingLine = `
    The <strong>${snapshot.year}</strong> tax bill is <strong>not final</strong>. Later budgets, certified levies,
    credits, and exemptions still have to be applied.
  `;
  const marketLine = marketSummary ? localMarketQuickReadLine(marketSummary.selectedMarket, marketSummary) : `
    Local market context is available later in the guide, after the property facts and tax district are confirmed.
  `;
  const recordCheckLine = `
    Check the property record: owner, address, land, building size, class, condition, rooms, garage,
    improvements, and notes.
  `;
  const summaryRows = [
    ["Current value", currentValueLine],
    ["Tax timing", taxTimingLine],
    ["Local market", marketLine],
    ["First check", recordCheckLine]
  ];

  document.getElementById("summaryText").innerHTML = `
    <p class="quick-read-intro">Detailed history, taxes, and county context come in the next steps.</p>
    <div class="quick-read-list" role="list">
      ${summaryRows.map(([label, body]) => `
        <div class="quick-read-item" role="listitem">
          <p class="quick-read-label">${escapeHtml(label)}</p>
          <p>${body}</p>
        </div>
      `).join("")}
    </div>
  `;
}

function initJumpLinks() {
  document.querySelectorAll("[data-jump-target]").forEach(link => {
    link.addEventListener("click", event => {
      const target = document.getElementById(link.dataset.jumpTarget);
      if (!target) return;

      event.preventDefault();
      history.pushState(null, "", link.getAttribute("href"));
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.classList.add("jump-target-active");
      window.setTimeout(() => target.classList.remove("jump-target-active"), 1400);
    });
  });
}

function renderHistoryTable(data, recordCard) {
  const rows = sortHistoryDescending(data.taxpayerHistory);

  document.getElementById("historyRows").innerHTML = rows.map((row, index) => {
    const etr = calculateEtr(row);
    const isCurrentNotice = row.status === "assessment_notice";
    const isPending = row.status === "pending";

    return `
      <tr class="${isCurrentNotice || isPending ? "pending-data-row" : index % 2 === 0 ? "bg-white" : "bg-slate-50"}">
        <td class="px-3 py-2 font-medium">
          <div class="flex items-center gap-2">
            <span>${row.year}</span>
            ${isCurrentNotice ? `<span class="notice-status-pill">Notice</span>` : ""}
            ${isPending ? `<span class="pending-status-pill">Pending</span>` : ""}
          </div>
        </td>
        <td class="px-3 py-2 text-right">${formatNullableMoney(row.assessedValue)}</td>
        <td class="px-3 py-2 text-right">${row.taxes === null ? "Pending" : formatNullableMoney(row.taxes, true)}</td>
        <td class="px-3 py-2 text-right font-medium">${etr === null ? "Pending" : formatNullablePercent(etr)}</td>
      </tr>
    `;
  }).join("");

  document.querySelectorAll("[data-property-record-source]").forEach(element => {
    element.textContent = propertyRecordSourceText(data, recordCard);
  });
}

function annualizedChange(startValue, endValue, years) {
  if (!startValue || !endValue || !years) return null;
  return Math.pow(endValue / startValue, 1 / years) - 1;
}

function signedPercent(value) {
  if (value === null || value === undefined) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${percent.format(value)}`;
}

function signedPoints(value) {
  if (value === null || value === undefined) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${(value * 100).toFixed(2)} pts`;
}

function percentChangeBetween(previous, current) {
  if (!previous || !current) return null;
  return (current - previous) / previous;
}

function movementCard([label, value, note, range]) {
  const status = /finalized/i.test(range) ? "Finalized" : "";

  return `
    <div class="movement-card">
      <div class="movement-card-header">
        <p>${label}</p>
        <p>${status}</p>
      </div>
      <div class="movement-card-body">
        <p>${value}</p>
        <p>${note}</p>
      </div>
    </div>
  `;
}

function renderPropertyMovementSummary(data) {
  const container = document.getElementById("propertyMovementSummary");
  if (!container) return;

  const valueRows = data.taxpayerHistory
    .filter(row => row.assessedValue !== null && row.assessedValue !== undefined)
    .sort((a, b) => a.year - b.year);
  const taxRows = data.taxpayerHistory
    .filter(row => row.taxes !== null && row.taxes !== undefined)
    .sort((a, b) => a.year - b.year);
  const etrRows = taxRows
    .map(row => ({ ...row, etr: calculateEtr(row) }))
    .filter(row => row.etr !== null && row.etr !== undefined);

  const firstValue = valueRows[0];
  const lastValue = valueRows.at(-1);
  const firstTax = taxRows[0];
  const lastTax = taxRows.at(-1);
  const firstEtr = etrRows[0];
  const lastEtr = etrRows.at(-1);
  const previousValue = valueRows.at(-2);
  const previousTax = taxRows.at(-2);
  const previousEtr = etrRows.at(-2);

  const valueYears = lastValue.year - firstValue.year;
  const taxYears = lastTax.year - firstTax.year;
  const etrYears = lastEtr.year - firstEtr.year;

  const valueChange = (lastValue.assessedValue / firstValue.assessedValue) - 1;
  const taxChange = (lastTax.taxes / firstTax.taxes) - 1;
  const etrChange = lastEtr.etr - firstEtr.etr;

  const recentCards = [
    [
      "Assessed value",
      signedPercent(percentChangeBetween(previousValue?.assessedValue, lastValue?.assessedValue)),
      `${formatNullableMoney(previousValue?.assessedValue)} to ${formatNullableMoney(lastValue?.assessedValue)}`,
      previousValue && lastValue ? `${previousValue.year}-${lastValue.year}` : "Recent available years"
    ],
    [
      "Taxes paid",
      signedPercent(percentChangeBetween(previousTax?.taxes, lastTax?.taxes)),
      `${formatNullableMoney(previousTax?.taxes, true)} to ${formatNullableMoney(lastTax?.taxes, true)}`,
      previousTax && lastTax ? `${previousTax.year}-${lastTax.year} finalized` : "Recent finalized years"
    ],
    [
      "Effective tax rate",
      `${formatNullablePercent(previousEtr?.etr)} to ${formatNullablePercent(lastEtr?.etr)}`,
      `${signedPoints(previousEtr && lastEtr ? lastEtr.etr - previousEtr.etr : null)} from prior year`,
      previousEtr && lastEtr ? `${previousEtr.year}-${lastEtr.year} finalized` : "Recent finalized years"
    ]
  ];

  const historicalCards = [
    [
      "Value increase",
      signedPercent(valueChange),
      `${signedPercent(annualizedChange(firstValue.assessedValue, lastValue.assessedValue, valueYears))} average per year`,
      `${firstValue.year}-${lastValue.year}`
    ],
    [
      "Tax growth",
      signedPercent(taxChange),
      `${signedPercent(annualizedChange(firstTax.taxes, lastTax.taxes, taxYears))} average per year`,
      `${firstTax.year}-${lastTax.year} finalized`
    ],
    [
      "ETR movement",
      `${formatNullablePercent(firstEtr.etr)} to ${formatNullablePercent(lastEtr.etr)}`,
      `${signedPoints(etrChange / etrYears)} average per year`,
      `${firstEtr.year}-${lastEtr.year} finalized`
    ]
  ];

  container.innerHTML = `
    <section>
      <div class="movement-section-heading">
        <p>Recent movement</p>
        <p>${previousValue?.year && lastValue?.year ? `${previousValue.year}-${lastValue.year}` : "Recent available years"}</p>
      </div>
      <div class="mt-2 grid gap-3 2xl:grid-cols-3">
        ${recentCards.map(movementCard).join("")}
      </div>
    </section>
    <section class="border-t border-slate-200 pt-4">
      <div class="movement-section-heading">
        <p>Property history</p>
        <p>${firstValue.year}-${lastValue.year}</p>
      </div>
      <div class="mt-2 grid gap-3 2xl:grid-cols-3">
        ${historicalCards.map(movementCard).join("")}
      </div>
    </section>
  `;
}

function assessedValuesData(data) {
  const rows = (data.assessedValueBreakdown || [])
    .slice()
    .sort((a, b) => b.year - a.year);

  const currentRow = rows[0];
  const rowLabel = rows.length === 1 ? "year" : "years";

  return disclosure(
    "What makes up this property’s assessed value?",
    `${rows.length} ${rowLabel} · ${formatNullableMoney(currentRow?.total)}`,
    `
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-3 py-2 text-left font-semibold">Year</th>
            <th class="px-3 py-2 text-right font-semibold">Total</th>
            <th class="px-3 py-2 text-right font-semibold">Land</th>
            <th class="px-3 py-2 text-right font-semibold">Dwelling / Improvements</th>
            <th class="px-3 py-2 text-right font-semibold">Outbuilding</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-slate-200 bg-white">
          ${rows.map((row, index) => `
            <tr class="${index % 2 === 0 ? "bg-white" : "bg-slate-50"}">
              <td class="px-3 py-2 font-medium">${row.year}</td>

              <td class="px-3 py-2 text-right font-semibold">
                ${formatNullableMoney(row.total)}
              </td>

              <td class="px-3 py-2 text-right">
                ${formatNullableMoney(row.land)}
              </td>

              <td class="px-3 py-2 text-right">
                ${formatNullableMoney(row.dwelling)}
              </td>

              <td class="px-3 py-2 text-right">
                ${formatNullableMoney(row.outbuilding)}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `
  );
}

function renderTaxHistoryTable(data) {
  const container = document.getElementById("taxHistoryRows");
  if (!container) return;

  const levyRows = (data.districtLevyHistory || []).slice();
  const levyByYear = new Map(levyRows.map(row => [row.year, row]));
  const statements = finalizedTaxStatements(data);
  const statementsByYear = new Map(statements.map(statement => [statement.taxYear, statement]));
  const years = [...new Set([
    ...levyRows.map(row => row.year),
    ...statements.map(statement => statement.taxYear)
  ])].sort((a, b) => b - a);
  const displayLevyByYear = new Map(years.map(year => [
    year,
    taxHistoryDisplayLevyRow(levyByYear.get(year), statementsByYear.get(year))
  ]));

  container.innerHTML = years.map(year => {
    const levyRow = displayLevyByYear.get(year);
    const priorLevyRow = displayLevyByYear.get(year - 1);
    const statement = statementsByYear.get(year);
    const netTaxes = statement?.netAmountDue ?? statement?.totalTaxesDue ?? null;
    const effectiveTaxRate = statement && statement.assessedValue && netTaxes
      ? netTaxes / statement.assessedValue
      : statement?.derived?.netEffectiveTaxRate ?? null;
    const heatColor = statementBurdenHeatColor(netTaxes, statements);
    const pendingClass = levyRow?.status === "pending" ? "pending-data-row" : "";
    const rowStyle = heatColor === "transparent" ? "" : ` style="background-color: ${heatColor};"`;

    return `
      <tr class="${pendingClass}"${rowStyle}>
        <th scope="row" class="px-2 py-2 text-left font-semibold text-slate-700 sm:px-3">${year}</th>
        <td class="px-2 py-2 text-right font-medium sm:px-3">${taxHistoryLevyDisplay(levyRow)}</td>
        <td class="tax-history-change-column px-2 py-2 text-center sm:px-3">${levyMovementPill(levyRow, priorLevyRow)}</td>
        <td class="px-2 py-2 text-right sm:px-3">${formatNullableMoney(statement?.grossTaxAmount, true)}</td>
        <td class="px-2 py-2 text-right sm:px-3">${statement ? formatNullableMoney(statementTotalCredits(statement), true) : "—"}</td>
        <td class="px-2 py-2 text-right font-semibold text-slate-700 sm:px-3">${formatNullableMoney(netTaxes, true)}</td>
        <td class="px-2 py-2 text-right font-semibold text-slate-700 sm:px-3">${formatNullablePercent(effectiveTaxRate)}</td>
      </tr>
    `;
  }).join("");

  const inferredRows = years
    .map(year => displayLevyByYear.get(year))
    .filter(row => row?.status === "inferred" || row?.status === "statement-derived");
  const sourceNote = document.getElementById("taxHistorySourceNote");
  if (sourceNote) {
    const notes = [
      "Source: loaded property tax statements and record-card tax history; the tax-bill pattern chart uses the same statement years."
    ];

    if (inferredRows.length) {
      notes.push("† Calculated from available statement columns and taxable value where the standalone tax-rate line was not available.");
    }

    sourceNote.textContent = notes.join(" ");
  }
}

function taxHistoryLevyDisplay(row) {
  const value = formatNullableLevy(row?.levy);
  if (!row || (row.status !== "inferred" && row.status !== "statement-derived")) return value;

  const note = row.note || "Calculated from available statement columns and taxable value.";
  return `
    <span class="tax-history-levy-value" title="${escapeHtml(note)}" aria-label="${escapeHtml(`${value}, calculated`)}">${value}<sup class="tax-history-levy-marker" aria-hidden="true">†</sup></span>
  `;
}

function statementGrossLevy(statement) {
  if (!statement) return null;
  if (statement.derived?.grossLevyRate !== null && statement.derived?.grossLevyRate !== undefined) {
    return statement.derived.grossLevyRate * 100;
  }

  if (statement.grossTaxAmount && statement.assessedValue) {
    return (statement.grossTaxAmount / statement.assessedValue) * 100;
  }

  return null;
}

function taxHistoryDisplayLevyRow(levyRow, statement) {
  const statementLevy = statementGrossLevy(statement);
  if (statementLevy === null || statementLevy === undefined) return levyRow;

  if (!levyRow?.levy) {
    return {
      ...(levyRow ?? { year: statement.taxYear }),
      levy: statementLevy,
      status: "statement-derived",
      note: "Derived from the tax statement gross tax and assessed value."
    };
  }

  const grossFromDistrictLevy = statement.assessedValue
    ? statement.assessedValue * (levyRow.levy / 100)
    : null;
  const reconcilesToStatement = grossFromDistrictLevy !== null
    && Math.abs(grossFromDistrictLevy - statement.grossTaxAmount) <= 0.05;

  if (reconcilesToStatement) return levyRow;

  return {
    ...levyRow,
    levy: statementLevy,
    status: "statement-derived",
    note: "Derived from the tax statement gross tax and assessed value because the district levy history did not reconcile to the statement."
  };
}

function finalizedTaxStatements(data) {
  return (data.taxStatements || [])
    .slice()
    .sort((a, b) => b.taxYear - a.taxYear)
    .filter(statement => statement.netAmountDue !== null && statement.netAmountDue !== undefined);
}

function levyMovementPill(row, priorRow) {
  if (!row || row.levy === null || row.levy === undefined || priorRow?.levy === null || priorRow?.levy === undefined) {
    return `<span class="text-slate-400">—</span>`;
  }

  const change = ((row.levy - priorRow.levy) / priorRow.levy) * 100;
  const isDecrease = change < 0;
  const isIncrease = change > 0;
  const arrow = isDecrease ? "↓" : isIncrease ? "↑" : "→";
  const colorClass = isDecrease
    ? "movement-pill-decrease"
    : isIncrease
      ? "movement-pill-increase"
      : "movement-pill-flat";

  return `<span class="movement-pill ${colorClass}">${arrow} ${Math.abs(change).toFixed(2)}%</span>`;
}

function statementTotalCredits(statement) {
  if (statement.derived?.totalCreditAmount !== null && statement.derived?.totalCreditAmount !== undefined) {
    return Math.abs(statement.derived.totalCreditAmount);
  }

  return Math.abs(Object.values(statement.credits || {}).reduce((sum, credit) => sum + (credit?.amount || 0), 0));
}

function statementBurdenHeatColor(netTaxes, statements) {
  const values = statements
    .map(statement => statement.netAmountDue ?? statement.totalTaxesDue)
    .filter(value => value !== null && value !== undefined);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  if (!range || netTaxes === null || netTaxes === undefined) {
    return "transparent";
  }

  const intensity = (netTaxes - min) / range;
  const hue = 145 - (intensity * 140);
  const alpha = 0.04 + (intensity * 0.09);
  return `hsla(${hue.toFixed(0)}, 62%, 42%, ${alpha.toFixed(3)})`;
}

function renderLevyTable(data) {
  const total = sumRates(data.latestFinalLevyComponents);
  const taxableValuePer100k = 100000;
  const sortedRows = data.latestFinalLevyComponents.slice().sort((a, b) => b.rate - a.rate);

  const dataRows = sortedRows.map(row => {
    const share = row.rate / total;
    const taxPer100k = taxableValuePer100k * (row.rate / 100);

    return `
      <tr>
        <td class="px-3 py-2 font-medium">${row.description}</td>
        <td class="px-3 py-2 text-right">${row.rate.toFixed(8)}</td>
        <td class="px-3 py-2 text-right">${percent.format(share)}</td>
        <td class="px-3 py-2 text-right">${moneyCents.format(taxPer100k)}</td>
      </tr>
    `;
  }).join("");

  const totalTaxPer100k = taxableValuePer100k * (total / 100);
  const totalRow = `
    <tr class="table-total-row font-semibold">
      <td class="px-3 py-3">Total levy</td>
      <td class="px-3 py-3 text-right">${total.toFixed(8)}</td>
      <td class="px-3 py-3 text-right">100.00%</td>
      <td class="px-3 py-3 text-right">${moneyCents.format(totalTaxPer100k)}</td>
    </tr>
  `;

  document.getElementById("levyRows").innerHTML = dataRows + totalRow;
}

function renderSources(data) {
  const container = document.getElementById("sourceCards");
  if (!container) return;

  container.innerHTML = data.sources.map(source => `
    <div class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${source.label}</p>
      <p class="mt-1 font-medium text-slate-700">${source.value}</p>
    </div>
  `).join("");
}
