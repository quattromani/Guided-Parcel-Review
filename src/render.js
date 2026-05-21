import {
  calculateEtr,
  formatNullableLevy,
  formatNullableMoney,
  formatNullablePercent,
  latestTaxDistributionRows,
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
import { propertyRecordSourceText, taxHistorySourceText } from "./domain/source-labels.js";
import {
  getClassMarketStats,
  getParcelMarketClass,
  getParcelMarketGroupId
} from "./market-stats.js";
import { renderStartPage as renderStartPageRoute } from "./routes/start-page.js";
import { displayAddress } from "./utils/address.js";
import { displayValue, formatSquareFeet, hasDisplayValue } from "./utils/display.js";
import { escapeHtml } from "./utils/html.js";

const recordReviewStatuses = [
  ["looks-correct", "Looks correct"],
  ["may-need-review", "May need review"]
];
const percentOneDecimal = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});
const recordReviewStatusLabels = Object.fromEntries(recordReviewStatuses);
const recordReviewCategories = [
  {
    id: "ownership-mailing-details",
    title: "Ownership & mailing details",
    description: "Names, addresses, parcel identifiers, and other administrative details tied to the property record.",
    examples: ["Owner name", "Mailing address", "Situs address", "Parcel ID", "Legal description", "Tax district"]
  },
  {
    id: "land-site-details",
    title: "Land & site details",
    description: "Land size, site characteristics, zoning, and classification details that describe the parcel itself.",
    examples: ["Acreage", "Lot or site size", "Zoning", "Land classification", "Valuation group", "Location group"]
  },
  {
    id: "dwelling-main-structure",
    title: "Dwelling / main structure",
    description: "The main building details shown on the record, including size, age, layout, quality, and major systems.",
    examples: ["Year built", "Style", "Square footage", "Basement", "Bedrooms and bathrooms", "Heating/cooling"]
  },
  {
    id: "garages-attached-improvements",
    title: "Garages & attached improvements",
    description: "Attached or closely related improvements that may be listed separately from the main structure.",
    examples: ["Garages", "Carports", "Porches", "Patios", "Attached additions"]
  },
  {
    id: "outbuildings-farm-ag-structures",
    title: "Outbuildings & farm/ag structures",
    description: "Detached buildings and agricultural structures that may appear as separate improvement records.",
    examples: ["Sheds", "Barns", "Bins", "Utility buildings", "Detached structures", "Farm improvements"]
  },
  {
    id: "other-record-details",
    title: "Other record details",
    description: "Anything unusual or important that does not fit neatly into the other review areas.",
    examples: ["Miscellaneous notes", "Unusual details", "Classification concerns", "Other record questions"]
  }
];

const legacyRecordReviewCategorySlugPatterns = [
  ["ownership-mailing-details", /^(parcel-id|owner|situs-address|tax-district|legal-description)$/],
  ["land-site-details", /^(status|zoning|lot-size|location|property-class|neighborhood|location-group|valuation-group|land-\d+-description|land-\d+-dimensions)$/],
  ["dwelling-main-structure", /^(year-built|style|building-size|basement-size|bedrooms-bathrooms|quality-condition|exterior|heating-cooling|plumbing-fixtures|minimum-finish|part-finish)$/],
  ["garages-attached-improvements", /^(garage|garage-\d+|additional-feature-\d+)$/],
  ["outbuildings-farm-ag-structures", /^(outbuilding-records|outbuilding-\d+)$/],
  ["other-record-details", /^(property-note-\d+-date|property-note-\d+|property-notes)$/]
];

export function renderStartPage(propertySwitcherContext = {}) {
  renderStartPageRoute(propertySwitcherContext, renderViewHeader);
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
  initRecordDisclosureBehavior();
  initExpandableTables();
  renderDiscrepancyForm(data, recordCard);
  initReportErrorModal(data, recordCard, governingOffice);
  renderHistoryTable(data);
  renderPropertyMovementSummary(data);
  renderTaxHistoryTable(data);
  renderLevyTable(data);
  renderSources(data);
}

function initRecordDisclosureBehavior() {
  if (document.documentElement.dataset.recordDisclosureBehavior === "true") return;

  document.documentElement.dataset.recordDisclosureBehavior = "true";
  document.addEventListener("toggle", event => {
    const disclosure = event.target.closest?.(".record-disclosure");
    if (!disclosure?.open) return;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const summary = disclosure.querySelector(".record-disclosure-toggle");
        if (!summary) return;

        const headerBottom = document.querySelector(".guide-review-header")?.getBoundingClientRect().bottom ?? 0;
        const targetTop = Math.max(headerBottom + 10, 12);
        const summaryTop = summary.getBoundingClientRect().top;

        if (summaryTop < targetTop) {
          window.scrollBy({
            top: summaryTop - targetTop,
            behavior: "smooth"
          });
        }
      });
    });
  }, true);
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

  sourceNote.textContent = "";
}

function renderValueTaxHistoryShell() {
  const container = document.getElementById("value-tax-history-panel");
  if (!container) return;

  container.innerHTML = `
    <div class="value-tax-history-split grid gap-4 lg:grid-cols-2">
      <article id="value-history" class="value-tax-history-card">
        <div class="mobile-support-content value-history-content">
            <h2 class="text-xl font-bold text-slate-700">Value and tax history</h2>
            <p class="mt-1 text-sm text-slate-600">
                Compare assessed value, net tax, and effective tax rate (ETR) by year.
                Gross tax starts with value and levy.
                Credits reduce gross tax to net tax.
                ETR compares net tax back to assessed value.
                Payment balances stay separate from tax statement amounts.
            </p>
            <div class="mt-4 overflow-x-auto rounded-xl ring-1 ring-slate-200">
              <table class="value-tax-history-table min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr>
                    <th class="px-3 py-2 text-left font-semibold">Year</th>
                    <th class="px-3 py-2 text-right font-semibold">Assessed Value</th>
                    <th class="px-3 py-2 text-right font-semibold">Net Tax</th>
                    <th class="px-3 py-2 text-right font-semibold">ETR</th>
                  </tr>
                </thead>
                <tbody id="historyRows" class="divide-y divide-slate-200 bg-white"></tbody>
              </table>
            </div>
            <p id="historyFootnote" class="mt-2 hidden text-xs leading-5 text-slate-500"></p>
        </div>
      </article>

      <article id="indexed-trends" class="value-tax-history-card">
        <div>
          <div>
            <h2 class="text-xl font-bold text-slate-700">How are this property’s value and taxes moving together?</h2>
              <p id="indexedTrendsIntro" class="text-sm text-slate-600">Compare how assessed value and net taxes moved after levy changes and credits are applied.</p>
          </div>
        </div>
        <div class="indexed-trends-chart mt-4">
          <span id="indexedPendingBadge" class="indexed-pending-badge hidden">Pending</span>
          <canvas id="indexedChart"></canvas>
        </div>
        <div id="indexedChartLegend" class="chart-disc-legend mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-600"></div>
      </article>
    </div>
    <p data-tax-history-source class="chart-source"></p>
  `;
  initMobileSupportDisclosureCharts(container);
}

function renderTaxHistoryShell() {
  const container = document.getElementById("tax-history-panel");
  if (!container) return;

  container.className = "tax-history-pair review-card grid gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(320px,1fr)]";
  container.innerHTML = `
    <div id="taxEquationWaterfall" class="tax-equation-waterfall lg:col-span-2" aria-label="Tax statement calculation"></div>

    <article id="tax-history" class="tax-history-detail-panel">
      <h2 class="sr-only">Levy, credits, and net tax history</h2>
      <div class="overflow-x-auto rounded-xl ring-1 ring-slate-200">
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
      <h2 class="sr-only">Effective tax rate trend</h2>
      <div class="h-64 sm:h-72">
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
    <div class="data-split-view tax-distribution-split-view grid gap-6 lg:grid-cols-2">
      <article>
        <div class="levy-treemap-panel" aria-labelledby="distributionChartTitle">
          <div class="levy-treemap-heading">
            <h2 id="distributionChartTitle" class="text-xl font-bold text-slate-700">How is the tax bill distributed?</h2>
            <p class="mt-1 text-sm text-slate-600">The chart shows which taxing bodies receive shares of the latest tax bill after credits are applied.</p>
          </div>
          <div id="distributionTreemap" class="levy-treemap-shell"></div>
        </div>
      </article>

      <article class="tax-levy-table-panel">
        <details class="mobile-support-disclosure" data-mobile-support${levyTableOpen}>
          <summary class="mobile-support-toggle">
            <span>See full levy table</span>
            <span class="mobile-support-chevron" aria-hidden="true"></span>
          </summary>
          <div class="mobile-support-content">
            <h2 class="text-xl font-bold text-slate-700">Which taxing bodies are included?</h2>
            <p class="mt-1 text-sm text-slate-600">2025 is the latest completed levy breakdown. Levy share is shown before statement credits. The 2026 tax bill still depends on final budgets, levies, credits, and exemptions.</p>
            <div class="mt-4 overflow-x-auto rounded-xl ring-1 ring-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr>
                    <th class="px-3 py-2 text-left font-semibold">Taxing body</th>
                    <th class="px-3 py-2 text-right font-semibold">Rate</th>
                    <th class="px-3 py-2 text-right font-semibold">Levy share</th>
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
  const latestRatioYear = summaryContext.ratioData?.source?.yearRange?.end
    ?? Math.max(...(summaryContext.ratioData?.classes || [])
      .flatMap(item => (item.records || []).map(row => row.year))
      .filter(Boolean));
  const assessmentBandTitle = Number.isFinite(latestRatioYear)
    ? `Where does each measure stand in ${latestRatioYear}?`
    : "Where does each measure stand?";

  const salesMakeup = `
    <h3 id="equalizationSalePriceTitle" class="text-lg font-bold text-slate-700">What makes up the class sales data?</h3>
    <p id="equalizationSalePriceDescription" class="mt-1 max-w-4xl text-sm leading-6 text-slate-600">These numbers come from recent qualified sales in this class. The price ranges show whether most sales were lower-priced, middle-priced, or higher-priced properties.</p>
    <div class="data-split-view equalization-sales-split-view mt-4 grid gap-4 lg:grid-cols-2">
      <div class="equalization-sales-table-scroll overflow-auto rounded-xl bg-white ring-1 ring-slate-200">
        <table class="min-w-full divide-y divide-slate-200 text-xs equalization-support-table equalization-sales-table">
          <colgroup>
            <col class="equalization-sales-label-col" />
            <col class="equalization-sales-count-col" />
            <col class="equalization-sales-ratio-col" />
            <col class="equalization-sales-ratio-col" />
            <col class="equalization-sales-ratio-col" />
            <col class="equalization-sales-money-col" />
          </colgroup>
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
      <div class="equalization-sales-chart-panel review-card-muted">
        <p id="equalizationSalePriceChartTitle" class="text-xs font-semibold uppercase tracking-wide text-slate-500">Sales distribution</p>
        <p id="equalizationSalePriceChartNote" class="mt-1 text-sm leading-5 text-slate-600">Recent qualified sales grouped by price band. Empty upper bands are shown when no sales were reported there.</p>
        <div id="equalizationSalePriceChartLegend" class="chart-disc-legend mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600"></div>
        <div class="equalization-sales-chart-frame mt-3">
          <canvas id="equalizationSalePriceChart"></canvas>
        </div>
      </div>
    </div>
    <p id="equalizationSalePriceSource" class="chart-source"></p>
  `;
  const localPosition = `
    <section class="market-local-split grid gap-6 lg:grid-cols-5">
      <div class="market-position-support lg:col-span-3">
        <article id="market-position-panel" class="review-card-muted">
          <div class="market-position-heading">
            <h4 class="text-xl font-bold text-slate-700">Compare it with nearby groups</h4>
            <span id="marketAreaContextPill" class="equalization-context-pill" aria-live="polite"></span>
          </div>
          <div id="marketPositionLegend" class="chart-disc-legend mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600"></div>
          <div class="mt-4 h-80">
            <canvas id="marketPositionScatter" role="img" tabindex="0" aria-describedby="marketScatterSummary"></canvas>
          </div>
        </article>
        <p id="marketScatterSummary" class="sr-only"></p>
      </div>
      <section class="market-reading-context lg:col-span-2">
        <article class="market-compare-summary" aria-labelledby="marketCompareSummaryTitle">
          <h4 id="marketCompareSummaryTitle">Compare summary</h4>
          <div id="marketNarrative" class="market-compare-table-shell"></div>
        </article>
      </section>
    </section>
    <p id="marketPositionSource" class="chart-source"></p>
  `;
  const unifiedView = `
    <section class="data-split-view equalization-unified-section grid gap-6 lg:grid-cols-5">
      <div class="equalization-chart-support lg:col-span-3">
        <article class="review-card-muted">
          <div class="equalization-chart-heading">
            <h3 class="text-lg font-bold text-slate-700">How do the assessment measures come together?</h3>
            <span id="assessmentClassContextPill" class="equalization-context-pill" aria-live="polite"></span>
          </div>
          <div id="assessmentAccuracyLegend" class="assessment-line-legend mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600"></div>
          <div class="mt-4 h-80">
            <canvas id="assessmentAccuracyChart"></canvas>
          </div>
        </article>
        <p id="assessmentAccuracyConvergenceNote" class="equalization-unified-note mt-3 text-sm text-slate-600">COD, PRD, COV, and level of value use different scales. This view puts each measure into its own band so the trends can be compared together.</p>
      </div>
      <article class="equalization-year-table-panel review-card-muted lg:col-span-2">
        <details class="mobile-support-disclosure equalization-support-disclosure" data-mobile-support${supportOpen}>
          <summary class="mobile-support-toggle">
            <span>See reported values table</span>
            <span class="mobile-support-chevron" aria-hidden="true"></span>
          </summary>
          <div class="mobile-support-content">
            <h3 class="text-lg font-bold text-slate-700">What changed by year?</h3>
            <p class="mt-1 text-sm text-slate-600">The latest years appear first. This makes recent county sales-study results easier to compare with prior years.</p>
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
      </article>
    </section>
    <p id="assessmentAccuracySourceNote" class="chart-source">
      Source: ${escapeHtml(ratioCitation)}; ${escapeHtml(iaaoCitation)}. Authority context: ${rangeAuthority}, ${reportsAuthority}.
    </p>
  `;

  container.innerHTML = `
    <section aria-labelledby="assessmentBandCardsTitle">
      <div class="assessment-band-header">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Class band checks</p>
          <h3 id="assessmentBandCardsTitle" class="text-lg font-bold text-slate-700">${assessmentBandTitle}</h3>
        </div>
        <div id="assessmentClassFilter" class="inline-flex rounded-xl bg-slate-100 p-1 text-sm font-semibold ring-1 ring-slate-200" aria-label="Assessment class filter"></div>
      </div>
      <div id="assessmentAccuracySummary" class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4"></div>
    </section>
  `;
  const assessmentUnified = document.getElementById("assessment-accuracy-unified");
  if (assessmentUnified) {
    assessmentUnified.innerHTML = unifiedView;
  }
  const marketLocalPosition = document.getElementById("market-local-position");
  if (marketLocalPosition) {
    marketLocalPosition.innerHTML = localPosition;
  }
  const marketSalesMakeup = document.getElementById("market-sales-makeup");
  if (marketSalesMakeup) {
    marketSalesMakeup.innerHTML = salesMakeup;
  }
  initMobileSupportDisclosureCharts(container);
  if (assessmentUnified) initMobileSupportDisclosureCharts(assessmentUnified);
  if (marketLocalPosition) initMobileSupportDisclosureCharts(marketLocalPosition);
  if (marketSalesMakeup) initMobileSupportDisclosureCharts(marketSalesMakeup);
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

export function renderViewHeader(view = "your-property", snapshotModel, propertySwitcher = null) {
  const switcherContext = propertySwitcher ?? window.__PROPERTY_SWITCHER_CONTEXT__ ?? null;
  const section = snapshotModel?.sections?.find(item => item.id === view);
  const content = section
    ? {
      eyebrow: section.eyebrow,
      title: section.question,
      description: section.description
    }
    : viewHeaderContent[view] || viewHeaderContent["your-property"];
  const title = document.getElementById("pageTitle");
  const titleHtml = escapeHtml(content.title);

  title.innerHTML = `
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
      <label class="parcel-lookup-label" for="propertySwitcher">${hasActiveProperty ? "Switch sample property" : "Select a sample property"}</label>
      <select
        id="propertySwitcher"
        class="parcel-lookup-shell property-switcher-select"
        data-property-switcher
        aria-label="Switch property record"
      >
        ${hasActiveProperty ? "" : `<option value="" selected>Choose a sample property...</option>`}
        ${groups.map(group => group.type === "heading" ? `
          <option value="" disabled>${escapeHtml(group.label)}</option>
        ` : `
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
    ["Saline County sample", []],
    ["Residential Samples", []],
    ["Agricultural Samples", []],
    ["Commercial / Industrial Samples", []],
    ["Mixed / Special Use Samples", []]
  ]);
  const options = propertySwitcherOptions(propertySwitcher, snapshotModel);

  options.forEach(option => {
    const groupLabel = switcherGroupLabel(option.propertyClass, option.county);
    if (!groups.has(groupLabel)) groups.set(groupLabel, []);
    groups.get(groupLabel).push(option);
  });

  const optionGroups = [...groups.entries()]
    .map(([label, groupOptions]) => ({ label, options: groupOptions }))
    .filter(group => group.options.length);
  const countySampleGroups = optionGroups.filter(group => group.label.endsWith("County sample"));
  const gageGroups = optionGroups.filter(group => !group.label.endsWith("County sample"));

  return [
    ...countySampleGroups,
    ...(gageGroups.length ? [{ type: "heading", label: "Gage sample properties", options: [] }] : []),
    ...gageGroups
  ];
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
        county: item.property.county,
        propertyClass,
        selected: item.property.id === activePropertyId,
        label: `${situsNumber} • ${valuationGroup} • ${propertyClass}`
      };
    });
}

function switcherGroupLabel(value, county) {
  const normalizedCounty = `${county ?? ""}`.trim().toLowerCase();
  if (normalizedCounty === "saline") return "Saline County sample";
  if (normalizedCounty === "lancaster") return "Lancaster County sample";

  const normalized = `${value ?? ""}`.trim().toLowerCase();

  if (normalized.includes("res")) return "Residential Samples";
  if (normalized.includes("ag") || normalized.includes("farm")) return "Agricultural Samples";
  if (normalized.includes("comm") || normalized.includes("industrial")) return "Commercial / Industrial Samples";

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
  if (normalized.includes("industrial")) return "Industrial";
  if (normalized.includes("res")) return "Residential";

  return value || "Property";
}

function disabledParcelLookupMarkup() {
  return `
    <div class="parcel-lookup-placeholder" data-parcel-lookup>
      <p class="parcel-lookup-label">Sample property selector</p>
      <button
        type="button"
        class="parcel-lookup-shell"
        data-parcel-lookup-trigger
        aria-disabled="true"
        aria-expanded="false"
        aria-controls="parcelLookupPopover"
        aria-label="Sample property inventory is not connected to live parcel search"
      >
        <span class="parcel-lookup-input" title="Sample inventory only">Sample inventory only</span>
        <span class="parcel-lookup-action" aria-hidden="true">Demo</span>
      </button>
      <div id="parcelLookupPopover" class="parcel-lookup-popover" data-parcel-lookup-popover hidden>
        This prototype uses pre-loaded sample records. Live parcel lookup will be available only after a parcel API or assessment database is connected.
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
        <p class="chart-source">${propertyRecordSourceText(data, recordCard)}</p>
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
      <div class="property-media-placeholder" aria-label="${caption} not available">
        <p>${label}</p>
        <span>Not available</span>
      </div>
    `;
  }

  return `
    <button type="button" data-image-src="${src}" data-image-caption="${caption}" class="group relative overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200 transition hover:ring-slate-300">
      <img src="${src}" alt="${caption}" class="h-28 w-44 object-cover transition duration-200 group-hover:scale-105" />
      <div class="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1">
        <p class="text-xs font-medium text-white">${label}</p>
      </div>
    </button>
  `;
}

function renderPropertyDetails(data, recordCard) {
  const situsAddress = displayAddress(data.parcel.situsAddress);
  const siteDetails = [
    ["Parcel ID", data.parcel.parcelId],
    ["Situs address", situsAddress],
    ["Legal description", data.parcel.legalDescription],
    ["Owner", data.parcel.owner],
    ["Mailing address", mailingAddressHtml(data.parcel.mailingAddress)],
    ["Tax district", data.parcel.taxDistrict],
    ["Zoning", data.classification.zoning],
    ["Lot size", data.classification.lotSize]
  ];
  const improvementDetails = [
    ["Status", data.classification.status],
    ...physicalDetailsForProperty(data)
  ];

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
  const detailRowCount = Math.max(siteDetails.length, improvementDetails.length);

  const drawers = [
    costSourceLimitation(recordCard),
    technicalCostModel(recordCard, data),
    sourceExtractDetails(data, recordCard),
    classificationDetails(data),
    landInformation(data, recordCard),
    propertyNotes(data),
    ownershipHistory(recordCard),
    recordCardSource(recordCard)
  ].filter(Boolean).join("");

  document.getElementById("propertyDetails").innerHTML = `
    <div class="property-details-card-grid" style="--property-details-row-count: ${detailRowCount};">
      <div class="property-details-column" aria-label="Parcel and site details">
        ${renderCards(siteDetails)}
      </div>
      <div class="property-details-column" aria-label="Improvement details">
        ${renderCards(improvementDetails)}
      </div>
    </div>
    ${drawers ? `<div class="property-details-drawer-stack">${drawers}</div>` : ""}
  `;

  const sourceNote = document.getElementById("propertyDetailsSourceNote");
  if (sourceNote) {
    sourceNote.textContent = propertyRecordSourceText(data, recordCard);
  }
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

function formSafeId(value) {
  return `${value}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function hasDetailedRecordCard(recordCard) {
  return Boolean(recordCard?.parcelIdentifiers);
}

function physicalDetailsForProperty(data) {
  if (data.commercial?.buildingDatasheet?.length || data.classification.propertyClass === "Commercial") {
    return [
      ["Primary occupancy", data.commercial?.primaryOccupancy],
      ["Year built", formatYearBuilt(data.commercial?.yearBuilt)],
      ["Construction", data.commercial?.constructionType],
      ["Building size", formatSquareFeet(data.commercial?.buildingSize)],
      ["Perimeter", data.commercial?.perimeter ? `${data.commercial.perimeter} ft.` : null],
      ["Land use", data.commercial?.landUse],
      ["Quality / condition", [data.commercial?.quality, data.commercial?.condition].filter(Boolean).join(" / ")],
      ["Heating / cooling", data.commercial?.heatingCooling]
    ];
  }

  return [
    ["Year built", formatYearBuilt(data.residential?.yearBuilt)],
    ["Style", data.residential?.style],
    ["Building size", formatSquareFeet(data.residential?.buildingSize)],
    ["Basement size", formatSquareFeet(data.residential?.basementSize)],
    ["Bedrooms / bathrooms", [data.residential?.bedrooms, data.residential?.bathrooms].every(value => value !== null && value !== undefined) ? `${data.residential.bedrooms} / ${data.residential.bathrooms}` : null],
    ["Quality / condition", [data.residential?.quality, data.residential?.condition].filter(Boolean).join(" / ")],
    ["Garage", [data.residential?.garage1, data.residential?.garage2].filter(Boolean).join("; ")],
    ["Exterior", data.residential?.exterior]
  ];
}

function formatYearBuilt(value) {
  if (!hasDisplayValue(value)) return null;
  return String(value);
}

function reviewCategoryCards() {
  return recordReviewCategories.map(category => {
    const groupName = `category-${category.id}`;
    const examplesId = `${groupName}-examples`;

    return `
      <fieldset class="review-card">
        <legend class="text-base font-bold text-slate-700">${escapeHtml(category.title)}</legend>
        <p class="mt-2 text-sm leading-6 text-slate-600">${escapeHtml(category.description)}</p>
        <p id="${examplesId}" class="mt-2 text-xs leading-5 text-slate-500">
          ${category.examples.map(example => escapeHtml(example)).join(", ")}
        </p>
        <div class="mt-4 grid gap-2 sm:grid-cols-2" role="presentation">
          ${recordReviewStatuses.map(([value, label]) => {
            const inputId = `${groupName}-${value}`;
            return `
              <label
                data-category-choice
                class="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-white hover:ring-slate-300 focus-within:ring-2 focus-within:ring-slate-400"
                for="${inputId}"
              >
                <input
                  id="${inputId}"
                  name="${groupName}"
                  type="radio"
                  value="${value}"
                  class="sr-only"
                  aria-describedby="${examplesId}"
                />
                <span data-choice-indicator class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white" aria-hidden="true">
                  <span class="h-2.5 w-2.5 rounded-full bg-transparent"></span>
                </span>
                <span>${escapeHtml(label)}</span>
              </label>
            `;
          }).join("")}
        </div>
      </fieldset>
    `;
  }).join("");
}

function legacyCategoryIdFromDraftKey(key) {
  const slug = String(key).replace(/^item-\d+-/, "");
  const match = legacyRecordReviewCategorySlugPatterns.find(([, pattern]) => pattern.test(slug));

  return match?.[0] || null;
}

function renderDiscrepancyForm(data, recordCard) {
  const container = document.getElementById("reportErrorFormContent");
  if (!container) return;

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
          <div class="review-note">
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
              You do not need to verify every technical field. Start with the major areas below.
            </p>
          </div>
          <p id="discrepancyDraftStatus" class="text-xs font-medium text-slate-500" aria-live="polite"></p>
        </div>

        <div class="mt-3 grid gap-3" aria-label="Property record review categories">
          ${reviewCategoryCards()}
        </div>
      </section>

      <div id="discrepancyValidationErrors" class="hidden rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-700 ring-1 ring-red-200" role="alert" aria-live="assertive"></div>

      <section class="grid items-start gap-4 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <label for="discrepancyComments" class="text-sm font-semibold text-slate-700">Comments or correction narrative</label>
          <textarea id="discrepancyComments" name="comments" rows="5" class="mt-2 w-full rounded-xl border-0 bg-slate-50 p-3 text-sm leading-6 text-slate-700 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="Add any specific details you want the Assessor's Office to review."></textarea>
        </div>

        <div class="space-y-3">
          <div>
            <label for="discrepancySenderName" class="text-sm font-semibold text-slate-700">Your name</label>
            <input id="discrepancySenderName" name="senderName" type="text" class="mt-2 w-full rounded-xl border-0 bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="Your name" />
          </div>

          <fieldset class="review-note">
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
        <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" data-clear-discrepancy-draft class="w-full rounded-full px-4 py-2 text-sm font-semibold text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50 sm:w-auto">
            Clear draft
          </button>
          <button type="button" data-close-report-error class="w-full rounded-full px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 sm:w-auto">
            Save draft and close
          </button>
          <button type="submit" class="w-full rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 sm:w-auto">
            Prepare correction request PDF
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

  function collectDraft() {
    const draft = { draftVersion: "category-review-v1" };
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

  function selectedCategories() {
    const formData = new FormData(form);

    return recordReviewCategories
      .map(category => {
        const status = formData.get(`category-${category.id}`);
        if (!status) return null;

        return {
          id: category.id,
          title: category.title,
          description: category.description,
          examples: category.examples,
          status,
          statusLabel: recordReviewStatusLabels[status] || String(status)
        };
      })
      .filter(Boolean);
  }

  function reviewCategories(categories) {
    return categories.filter(category => category.status === "may-need-review");
  }

  function updateCategoryOptionStates() {
    form.querySelectorAll("[data-category-choice]").forEach(label => {
      const input = label.querySelector("input[type='radio']");
      const dot = label.querySelector("[data-choice-indicator] span");
      const selected = Boolean(input?.checked);

      label.classList.toggle("bg-white", selected);
      label.classList.toggle("ring-slate-500", selected);
      label.classList.toggle("shadow-sm", selected);
      label.classList.toggle("text-slate-900", selected);
      label.classList.toggle("bg-slate-50", !selected);
      if (dot) {
        dot.classList.toggle("bg-slate-700", selected);
        dot.classList.toggle("bg-transparent", !selected);
      }
    });
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

  function validate(values, categoriesNeedingReview) {
    const messages = [];

    if (!categoriesNeedingReview.length && !values.comments) {
      messages.push("Mark at least one category as May need review or describe the request in the comments.");
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
      let migratedLegacySelections = false;
      Object.entries(draft).forEach(([key, value]) => {
        const field = form.elements[key];
        if (!field) {
          const categoryId = legacyCategoryIdFromDraftKey(key);
          if (categoryId && value) {
            const migratedField = form.elements[`category-${categoryId}`];
            if (migratedField instanceof RadioNodeList && !migratedField.value) {
              migratedField.value = "may-need-review";
              migratedLegacySelections = true;
            }
          }
          return;
        }

        if (field instanceof RadioNodeList) {
          field.value = value;
        } else {
          field.value = value;
        }
      });
      updateCategoryOptionStates();
      if (migratedLegacySelections) {
        saveDraft();
        if (status) status.textContent = "Draft restored in the new category format";
        return;
      }
      if (status) status.textContent = "Draft restored";
    } catch {
      localStorage.removeItem(draftKey);
    }
  }

  restoreDraft();
  updateCategoryOptionStates();

  form.addEventListener("input", saveDraft);
  form.addEventListener("change", () => {
    updateCategoryOptionStates();
    saveDraft();
  });
  clearButton?.addEventListener("click", () => {
    localStorage.removeItem(draftKey);
    form.reset();
    updateCategoryOptionStates();
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
    const categories = selectedCategories();
    const categoriesNeedingReview = reviewCategories(categories);
    const messages = validate(values, categoriesNeedingReview);

    if (messages.length) {
      setValidationMessages(messages);
      if (submitStatus) {
        submitStatus.textContent = "Correction request needs a little more information before it can be prepared.";
        submitStatus.className = "text-sm font-semibold text-red-700";
      }
      return;
    }

    if (submitStatus) {
      submitStatus.textContent = "Preparing correction request PDF...";
      submitStatus.className = "text-sm font-semibold text-slate-600";
    }

    try {
      const submission = buildRecordCorrectionSubmission({
        data,
        formValues: values,
        selectedCategories: categories,
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

function initExpandableTables() {
  const modal = document.getElementById("sourceTableModal");
  const modalTitle = document.getElementById("sourceTableModalTitle");
  const modalContent = document.getElementById("sourceTableModalContent");
  if (!modal || !modalTitle || !modalContent || modal.dataset.initialized === "true") return;

  const closeButtons = modal.querySelectorAll("[data-close-source-table]");
  let tableId = 0;
  let scheduled = false;

  function tableWrappers() {
    return Array.from(document.querySelectorAll(".table-shell, .table-clip, .overflow-x-auto"))
      .filter(wrapper => wrapper.querySelector(":scope > table"))
      .filter(wrapper => !wrapper.closest("#sourceTableModal"));
  }

  function tableTitle(wrapper) {
    return wrapper.closest(".source-extract-section")
      ?.querySelector(".source-extract-section-header p")
      ?.textContent
      ?.trim()
      || wrapper.closest(".record-disclosure")
        ?.querySelector(".record-disclosure-title")
        ?.textContent
        ?.trim()
      || wrapper.closest("[aria-labelledby]")
        ?.querySelector("h2, h3, [id]")
        ?.textContent
        ?.trim()
      || "Table";
  }

  function tableIsExpandable(wrapper) {
    if (!window.matchMedia("(min-width: 640px)").matches) return false;
    if (wrapper.offsetParent === null) return false;

    return wrapper.scrollWidth > wrapper.clientWidth + 2;
  }

  function ensureTableId(wrapper) {
    if (!wrapper.dataset.expandableTableId) {
      tableId += 1;
      wrapper.dataset.expandableTableId = `expandable-table-${tableId}`;
    }

    return wrapper.dataset.expandableTableId;
  }

  function removeExpandButton(wrapper) {
    const existing = document.querySelector(`[data-table-expand="${wrapper.dataset.expandableTableId}"]`);
    existing?.closest(".table-expand-toolbar")?.remove();
    existing?.remove();
  }

  function placeExpandButton(wrapper) {
    const id = ensureTableId(wrapper);
    if (document.querySelector(`[data-table-expand="${id}"]`)) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "table-expand-button";
    button.dataset.tableExpand = id;
    button.textContent = "Expand table";

    const sourceActions = wrapper.closest(".source-extract-section")
      ?.querySelector(".source-extract-section-actions");

    if (sourceActions) {
      sourceActions.append(button);
      return;
    }

    const toolbar = document.createElement("div");
    toolbar.className = "table-expand-toolbar";
    toolbar.append(button);
    wrapper.before(toolbar);
  }

  function refreshTableExpandButtons() {
    tableWrappers().forEach(wrapper => {
      if (tableIsExpandable(wrapper)) {
        placeExpandButton(wrapper);
      } else {
        removeExpandButton(wrapper);
      }
    });
  }

  function requestRefresh() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      refreshTableExpandButtons();
    });
  }

  function close() {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    modal.setAttribute("aria-hidden", "true");
    modalContent.innerHTML = "";
    document.body.classList.remove("overflow-hidden");
  }

  function open(wrapper) {
    const table = wrapper.cloneNode(true);
    if (!table) return;

    modalTitle.textContent = tableTitle(wrapper);
    table.querySelectorAll("[data-table-expand]").forEach(button => button.remove());
    table.classList.add("expanded-table-clip");
    modalContent.innerHTML = "";
    modalContent.append(table);
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("overflow-hidden");
  }

  document.addEventListener("click", event => {
    const trigger = event.target.closest?.("[data-table-expand]");
    if (!trigger) return;

    const wrapper = document.querySelector(`[data-expandable-table-id="${trigger.dataset.tableExpand}"]`);
    if (!wrapper) return;

    event.preventDefault();
    open(wrapper);
  });

  modal.addEventListener("click", close);
  modal.querySelector("[role='dialog']").addEventListener("click", event => event.stopPropagation());
  closeButtons.forEach(button => button.addEventListener("click", close));

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) close();
  });

  modal.dataset.initialized = "true";
  refreshTableExpandButtons();
  window.addEventListener("resize", requestRefresh);
  document.addEventListener("toggle", requestRefresh, true);
  document.addEventListener("click", () => window.setTimeout(refreshTableExpandButtons, 0));
}

function disclosure(title, meta, content) {
  return `
    <details class="record-disclosure rounded-xl">
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
    : `
      <section class="border-t border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-600">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Record review history</p>
        <p class="mt-1">No review-history rows were available in the loaded source export.</p>
      </section>
    `;

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
      <p class="border-t border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500">This summary is based on the property data available in this prototype. Official county records should be used to confirm parcel details and values.</p>
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
            <th class="px-3 py-2 text-right font-semibold">Land</th>
            <th class="px-3 py-2 text-right font-semibold">Dwelling</th>
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
  if (!data.propertyNotes.length) return "";

  const rows = data.propertyNotes.map(row => `<tr><td class="px-3 py-2">${row.date}</td><td class="px-3 py-2">${row.note}</td></tr>`).join("");
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

  const compactDisplayParts = parts => parts
    .filter(hasDisplayValue)
    .map(part => `${part}`)
    .join(" / ");

  const renderOptionalInfoCards = items => items
    .filter(item => hasDisplayValue(item.value))
    .map(item => `
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${escapeHtml(item.label)}</p>
        <p class="mt-1 font-semibold text-slate-700">${escapeHtml(item.display ?? item.value)}</p>
      </div>
    `).join("");

  const landModelCards = landModel && locationModel
    ? renderOptionalInfoCards([
      { label: "Neighborhood", value: locationModel.neighborhood },
      { label: "Valuation group", value: locationModel.valuationGroup },
      {
        label: "Model / method",
        value: compactDisplayParts([locationModel.model, locationModel.method])
      },
      { label: "Land model", value: landModel.description },
      {
        label: "Model lot size",
        value: landModel.lotSize,
        display: `${Number(landModel.lotSize).toLocaleString()} sq. ft.`
      },
      {
        label: "Recorded lot value",
        value: landModel.recordedLotValue,
        display: formatNullableMoney(landModel.recordedLotValue)
      }
    ])
    : "";

  return disclosure("How is the land described?", meta, `
    ${agriculturalProductivityModel(data, rows, recordCard)}
    ${landModelCards ? `
      <div class="grid gap-3 border-b border-slate-200 bg-slate-50 p-3 text-sm md:grid-cols-3">
        ${landModelCards}
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
            <div class="review-note">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Cutoff ${Number(row.cutoff).toLocaleString()}</p>
              <p class="mt-1 font-semibold text-slate-700">${row.value.toFixed(3)}</p>
            </div>
          `).join("")}
        </div>
      </div>
    ` : ""}
  `);
}

function agriculturalProductivityModel(data, rows, recordCard) {
  if (data.classification?.propertyClass !== "Agricultural") return "";

  const categoryForRow = row => {
    const description = String(row.description || "").toUpperCase();
    if (description.includes("IRR")) return "Irrigated";
    if (description.includes("DRY")) return "Dryland";
    if (description.includes("GRAS")) return "Grassland";
    if (description.includes("WASTE")) return "Waste";
    if (description.includes("HOME") || description.includes("HMSI")) return "Home site";
    if (description.includes("BLDG")) return "Building site";
    if (description.includes("ROAD")) return "Road";
    return "Other";
  };
  const grouped = rows.reduce((acc, row) => {
    const key = categoryForRow(row);
    const value = Number(row.value || 0);
    const acres = Number(row.acres || 0);
    if (!acc[key]) acc[key] = { acres: 0, value: 0, count: 0 };
    acc[key].acres += acres;
    acc[key].value += value;
    acc[key].count += 1;
    return acc;
  }, {});
  const entries = Object.entries(grouped).filter(([, row]) => row.count);
  const totalValue = entries.reduce((sum, [, row]) => sum + row.value, 0);

  return `
    <div class="ag-productivity-model">
      <div>
        <p class="guided-kicker">Agricultural productivity model</p>
        <h3>Land rows are read by use and productivity class.</h3>
        <p>For agricultural parcels, the land table is a central valuation input: row descriptions identify use or capability group, acres, and the value assigned to that productivity category. Nebraska agricultural land is generally assessed at 75% of its agricultural or horticultural value basis.</p>
      </div>
      <div class="ag-productivity-grid">
        ${entries.map(([label, row]) => `
          <section>
            <p>${escapeHtml(label)}</p>
            <strong>${formatNullableMoney(row.value)}</strong>
            <span>${row.acres.toFixed(row.acres >= 10 ? 1 : 2)} ac.${totalValue ? ` · ${percent.format(row.value / totalValue)} of land value` : ""}</span>
          </section>
        `).join("")}
      </div>
      <p class="ag-productivity-source">Source values: ${escapeHtml(recordCard?.source?.displayCitation || "loaded property record")}.</p>
    </div>
  `;
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

function costSourceLimitation(recordCard) {
  if (hasMarshallSwiftCostDetail(recordCard?.costApproach)) return "";
  return "";
}

function sourceExtractDetails(data, recordCard) {
  const sections = combineStatementHistorySections(recordCard?.sourceExtract?.sections || [])
    .filter(section => !isRepeatedSourceExtractSection(section));
  if (!sections.length) return "";

  const meta = sections.length === 1 ? "1 source table" : `${sections.length} source tables`;
  const cellValue = value => value === null || value === undefined || value === "" ? "—" : escapeHtml(value);

  return disclosure("What details were available from the source export?", meta, `
    <div class="bg-slate-50 p-3 text-sm leading-6 text-slate-600">
      ${escapeHtml(recordCard.sourceExtract.note || "These are the structured facts visible in the source export. Fields not included by the source are left unavailable rather than inferred.")}
    </div>
    <div class="grid gap-4 border-t border-slate-200 p-3">
      ${sections.map(section => sourceExtractSection(section, data, recordCard, cellValue)).join("")}
    </div>
  `);
}

function sourceExtractSection(section, data, recordCard, cellValue) {
  return `
    <section class="source-extract-section">
      <div class="source-extract-section-header">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${escapeHtml(section.title)}</p>
        <div class="source-extract-section-actions">
          ${section.summary ? `<p class="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">${escapeHtml(sourceSectionSummary(section.summary))}</p>` : ""}
        </div>
      </div>
      ${sourceExtractTable(section, data, recordCard, cellValue)}
    </section>
  `;
}

function sourceExtractTable(section, data, recordCard, cellValue) {
  return `
    <div class="table-clip source-table-clip ring-1 ring-slate-200">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50">
          <tr>${section.columns.map(column => `<th class="px-3 py-2 text-left font-semibold">${escapeHtml(column)}</th>`).join("")}</tr>
        </thead>
        <tbody class="divide-y divide-slate-200 bg-white [&>tr:nth-child(even)]:bg-slate-50">
          ${sourceSectionRows(section, data, recordCard).map(row => `
            <tr>${row.map(value => `<td class="px-3 py-2">${cellValue(value)}</td>`).join("")}</tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function combineStatementHistorySections(sections = []) {
  const statementSection = sections.find(isNtoStatementHistorySection);
  const assessedSection = sections.find(isFullAssessedValuesSection);
  const ntoValuationSection = sections.find(isNtoValuationSection);
  const valuationSection = assessedSection || ntoValuationSection;
  if (!valuationSection || !statementSection) return sections;

  let combinedUsed = false;

  return sections
    .map(section => {
      if (section === valuationSection || isNtoValuationSection(section) || isNtoStatementHistorySection(section)) {
        if (combinedUsed) return null;
        combinedUsed = true;
        return combinedStatementHistorySection(valuationSection, statementSection);
      }

      return section;
    })
    .filter(Boolean);
}

function isNtoValuationSection(section = {}) {
  return `${section.title || ""}`.toLowerCase().includes("nebraska taxes online assessed valuations");
}

function isNtoStatementHistorySection(section = {}) {
  return `${section.title || ""}`.toLowerCase().includes("nebraska taxes online statement history");
}

function isFullAssessedValuesSection(section = {}) {
  return `${section.title || ""}`.trim().toLowerCase() === "assessed values";
}

function combinedStatementHistorySection(valuationSection, statementSection) {
  const valuationByStatement = new Map();
  const valuationByYear = new Map();

  (valuationSection.rows || []).forEach(row => {
    const year = sourceCell(valuationSection, row, "Year");
    const statement = sourceCell(valuationSection, row, "Statement");

    if (year) valuationByYear.set(year, row);
    if (year && statement) valuationByStatement.set([year, statement].join("|"), row);
  });

  const valuationColumns = combinedValuationColumns(valuationSection);
  const rows = (statementSection.rows || []).map(statementRow => {
    const year = sourceCell(statementSection, statementRow, "Year");
    const statement = sourceCell(statementSection, statementRow, "Statement");
    const valuationRow = valuationByStatement.get([year, statement].join("|")) || valuationByYear.get(year) || [];

    return [
      year,
      statement,
      ...statementTypeCell(statementSection, statementRow),
      ...valuationColumns.map(column => sourceCell(valuationSection, valuationRow, column.source)),
      sourceCell(statementSection, statementRow, "Gross tax"),
      sourceCell(statementSection, statementRow, "Credits"),
      sourceCell(statementSection, statementRow, "Net tax"),
      sourceCell(statementSection, statementRow, "Total paid"),
      sourceCell(statementSection, statementRow, "Tax due")
    ];
  });

  return {
    type: "combined-statement-history",
    title: "Tax & Value History",
    summary: sourceYearRange(rows),
    columns: [
      "Year",
      "Statement",
      ...statementTypeHeader(statementSection),
      ...valuationColumns.map(column => column.label),
      "Gross tax",
      "Credits",
      "Net tax",
      "Total paid",
      "Tax due"
    ],
    rows
  };
}

function statementTypeHeader(section = {}) {
  return sourceColumnIndex(section, "Type") >= 0 ? ["Type"] : [];
}

function statementTypeCell(section, row) {
  return sourceColumnIndex(section, "Type") >= 0 ? [sourceCell(section, row, "Type")] : [];
}

function combinedValuationColumns(section = {}) {
  const columns = section.columns || [];
  const candidates = [
    ["Land", "Land"],
    ["Dwelling", "Dwelling"],
    ["Building", "Building"],
    ["Outbuilding", "Outbuilding"],
    ["Other", "Other"],
    ["Gross value", "Gross value"],
    ["Total", "Gross value"]
  ];

  return candidates
    .filter(([source]) => columns.some(column => column.toLowerCase() === source.toLowerCase()))
    .map(([source, label]) => ({ source, label }))
    .filter((column, index, all) => all.findIndex(item => item.label === column.label) === index);
}

function sourceCell(section, row, label) {
  const index = sourceColumnIndex(section, label);
  return index >= 0 ? row?.[index] : "";
}

function sourceColumnIndex(section, label) {
  return (section.columns || []).findIndex(column => column.toLowerCase() === label.toLowerCase());
}

function sourceYearRange(rows = []) {
  const years = rows
    .map(row => Number(row?.[0]))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  if (!years.length) return "";
  return years[0] === years.at(-1) ? `${years[0]}` : `${years[0]}-${years.at(-1)}`;
}

function sourceSectionRows(section = {}, data, recordCard) {
  const rows = section.rows || [];
  if (isTaxDistributionSection(section)) return taxDistributionSourceRows(data, recordCard);
  if (!isResidentialDatasheetSection(section)) return rows;

  return rows
    .filter(row => hasDisplayValue(row?.[1]))
    .map((row, index) => ({ row, index, order: residentialDatasheetRowOrder(row?.[0]) }))
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map(item => item.row);
}

function isTaxDistributionSection(section = {}) {
  return `${section.title || ""}`.toLowerCase().includes("tax distribution");
}

function taxDistributionSourceRows(data, recordCard) {
  const rows = latestTaxDistributionRows(data, recordCard);
  if (!rows.length) return [];

  return rows.map(row => [
    row.authority,
    formatNullableLevy(row.rate),
    formatNullableMoney(row.amount, true),
    percentOneDecimal.format(row.share)
  ]);
}

function isResidentialDatasheetSection(section = {}) {
  return `${section.title || ""}`.toLowerCase().includes("residential datasheet");
}

function residentialDatasheetRowOrder(label) {
  const normalized = `${label || ""}`.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  if (normalized === "zoning") return 10;
  if (normalized === "year built") return 20;
  if (normalized === "style") return 30;
  if (normalized === "building size") return 40;
  if (normalized === "basement size") return 50;
  if (normalized === "min finish" || normalized === "minimum finish") return 60;
  if (normalized === "part finish" || normalized === "partial finish") return 70;
  if (normalized === "bedrooms") return 80;
  if (normalized === "bathrooms") return 90;
  if (normalized === "plumbing fixtures") return 100;
  if (normalized === "heating cooling" || normalized === "heating and cooling") return 110;
  if (normalized === "exterior") return 120;
  if (/^garage \d+( size)?$/.test(normalized)) {
    const [, number = "0", sizeSuffix = ""] = normalized.match(/^garage (\d+)( size)?$/) || [];
    return 130 + (Number(number) * 2) + (sizeSuffix ? 1 : 0);
  }
  if (normalized === "quality") return 180;
  if (normalized === "condition") return 190;

  return 160;
}

function sourceSectionSummary(value) {
  const summary = `${value || ""}`;
  const yearRange = summary.match(/^\d{4}[-–]\d{4}/)?.[0];
  if (yearRange) return yearRange;

  const rowCount = summary.match(/^(\d+)\s+.+\s+rows?\b/i)?.[1];
  if (rowCount) return rowCount;

  return summary.replace(/\s+land value\b/i, "");
}

function isRepeatedSourceExtractSection(section) {
  const title = `${section?.title || ""}`.toLowerCase();

  return title.includes("gworks") && (
    title.includes("assessed value")
    || title.includes("tax levy")
  )
    || isEmptySalesInformationSection(section);
}

function isEmptySalesInformationSection(section = {}) {
  const title = `${section.title || ""}`.toLowerCase();
  if (!title.includes("sales information")) return false;

  const summary = `${section.summary || ""}`.toLowerCase();
  const rows = section.rows || [];
  const rowText = rows.flat().filter(hasDisplayValue).join(" ").toLowerCase();

  return !rows.length
    || summary.includes("no sales")
    || rowText.includes("no previous sales information");
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

function ratioClassKeyForParcel(data, ratioData) {
  const classKey = getParcelMarketClass(data);
  const ratioKey = classKey === "agricultural" ? "agFarm" : classKey;

  if (ratioData?.classes?.some(item => item.key === ratioKey)) return ratioKey;

  return ratioData?.classes?.[0]?.key ?? ratioKey;
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
      <span class="summary-tax-line">There was <strong>1 qualified ${classNoun} sale</strong> in ${studyLabel}.</span>
      <span class="summary-tax-line">That sale was assessed at <strong>${ratio}</strong> of sale price. One sale is a clue, not a broad market pattern.</span>
    `;
  }

  if (count < 5) {
    return `
      <span class="summary-tax-line">There were <strong>${count.toLocaleString()} qualified ${classNoun} ${saleNoun}</strong> in ${studyLabel}.</span>
      <span class="summary-tax-line">The median result was <strong>${ratio}</strong> of sale price. A sample this small can change a lot from one sale to the next.</span>
    `;
  }

  if (count < 10) {
    return `
      <span class="summary-tax-line">There were <strong>${count.toLocaleString()} qualified ${classNoun} sales</strong> in ${studyLabel}.</span>
      <span class="summary-tax-line">The middle sale was assessed at <strong>${ratio}</strong> of sale price. Read this as limited context.</span>
    `;
  }

  if (count < 25) {
    return `
      <span class="summary-tax-line">There were <strong>${count.toLocaleString()} qualified ${classNoun} sales</strong> in ${studyLabel}.</span>
      <span class="summary-tax-line">The middle sale was assessed at <strong>${ratio}</strong> of sale price. The local sample is modest.</span>
    `;
  }

  return `
    <span class="summary-tax-line">There were <strong>${count.toLocaleString()} qualified ${classNoun} sales</strong> in ${studyLabel}.</span>
    <span class="summary-tax-line">The middle sale was assessed at <strong>${ratio}</strong> of sale price. The local sample is strong.</span>
  `;
}

function taxesQuickReadLine(data) {
  const taxRows = (data.taxpayerHistory || [])
    .filter(row => row.taxes !== null && row.taxes !== undefined)
    .sort((a, b) => a.year - b.year);

  if (taxRows.length < 2) {
    return "Loaded tax history is limited for this sample.";
  }

  const firstTax = taxRows[0];
  const previousTax = taxRows.at(-2);
  const latestTax = taxRows.at(-1);
  const etrRows = taxRows
    .map(row => ({ ...row, etr: calculateEtr(row) }))
    .filter(row => row.etr !== null && row.etr !== undefined);
  const firstEtr = etrRows[0];
  const latestEtr = etrRows.at(-1);
  const recentTaxChange = percentChangeBetween(previousTax?.taxes, latestTax?.taxes);
  const historyTaxChange = percentChangeBetween(firstTax?.taxes, latestTax?.taxes);
  const etrLine = firstEtr && latestEtr
    ? `<span class="summary-tax-line"><strong>ETR:</strong> moved from <strong>${formatNullablePercent(firstEtr.etr)}</strong> to <strong>${formatNullablePercent(latestEtr.etr)}</strong>.</span>`
    : "";
  const recentTaxLine = isZeroToZero(previousTax?.taxes, latestTax?.taxes)
    ? `net tax remained <strong>${formatNullableMoney(latestTax?.taxes, true)}</strong>`
    : `net tax moved <strong>${signedPercent(recentTaxChange)}</strong>
    from <strong>${formatNullableMoney(previousTax?.taxes, true)}</strong> to <strong>${formatNullableMoney(latestTax?.taxes, true)}</strong>`;
  const historyTaxLine = isZeroToZero(firstTax?.taxes, latestTax?.taxes)
    ? `loaded tax years show <strong>${formatNullableMoney(latestTax?.taxes, true)} net tax</strong>`
    : `net tax changed <strong>${signedPercent(historyTaxChange)}</strong>
    from <strong>${firstTax.year}</strong> to <strong>${latestTax.year}</strong>`;

  return `
    <span class="summary-tax-line"><strong>Recent movement:</strong> ${recentTaxLine}.</span>
    <span class="summary-tax-line"><strong>Movement history:</strong> ${historyTaxLine}.</span>
    ${etrLine}
  `;
}

function countyQuickReadLine(data, summaryContext = {}) {
  const ratioData = summaryContext.ratioData;
  const ratioKey = ratioClassKeyForParcel(data, ratioData);
  const selectedClass = ratioData?.classes?.find(item => item.key === ratioKey);
  const latest = (selectedClass?.records || [])
    .filter(row => row.levelOfValue !== null && row.levelOfValue !== undefined)
    .sort((a, b) => a.year - b.year)
    .at(-1);

  if (!selectedClass || !latest) {
    return "County equalization context is unavailable for this sample.";
  }

  return `
    <span class="summary-tax-line"><strong>${latest.year} ${selectedClass.label}</strong> county study:</span>
    <span class="summary-tax-line">Level of value (LOV): <strong>${formatRatioPercent(latest.levelOfValue)}</strong></span>
    <span class="summary-tax-line">COD: <strong>${Number(latest.cod).toFixed(2)}</strong></span>
    <span class="summary-tax-line">PRD: <strong>${Number(latest.prd).toFixed(3)}</strong></span>
  `;
}

export function quickReadSummaryMarkup(data, recordCard, summaryContext = {}) {
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
      <strong>${signedPercent(valueChangeFromPrior)}</strong> from the prior finalized value.
    `;
  const taxesLine = taxesQuickReadLine(data);
  const countyLine = countyQuickReadLine(data, summaryContext);
  const marketLine = marketSummary ? localMarketQuickReadLine(marketSummary.selectedMarket, marketSummary) : `
    Local market context is available later in the guide, after the property facts and tax district are confirmed.
  `;
  const summaryRows = [
    ["Current value", currentValueLine],
    ["Local market", marketLine],
    ["Taxes", taxesLine],
    ["County", countyLine]
  ];

  return `
    <div class="summary-quick-read-list" role="list">
      ${summaryRows.map(([label, body]) => `
        <div class="quick-read-item summary-quick-read-item" role="listitem">
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

function renderHistoryTable(data) {
  const rows = sortHistoryDescending(data.taxpayerHistory);
  const heatRanges = {
    assessedValue: historyHeatRange(rows, row => row.assessedValue),
    taxes: historyHeatRange(rows, row => row.taxes),
    etr: historyHeatRange(rows, row => calculateEtr(row))
  };

  document.getElementById("historyRows").innerHTML = rows.map((row, index) => {
    const etr = calculateEtr(row);
    const isCurrentNotice = row.status === "assessment_notice";
    const isPending = row.status === "pending";
    const assessedHeat = historyHeatStyle(row.assessedValue, heatRanges.assessedValue, "--semantic-value");
    const taxesHeat = historyHeatStyle(row.taxes, heatRanges.taxes, "--semantic-tax");
    const etrHeat = historyHeatStyle(etr, heatRanges.etr, "--semantic-etr");
    const note = `${row.note ?? ""}`.trim();

    return `
      <tr class="${isCurrentNotice || isPending ? "pending-data-row" : index % 2 === 0 ? "bg-white" : "bg-slate-50"}">
        <td class="px-3 py-2 font-medium">
          <div class="flex items-center gap-2">
            <span>${row.year}${note ? `<sup class="history-note-marker" title="${escapeHtml(note)}" aria-label="${escapeHtml(`Note: ${note}`)}">*</sup>` : ""}</span>
            ${isCurrentNotice ? `<span class="notice-status-pill">Notice</span>` : ""}
            ${isPending ? `<span class="pending-status-pill">Pending</span>` : ""}
          </div>
        </td>
        <td class="history-heat-cell px-3 py-2 text-right"${assessedHeat}>${formatNullableMoney(row.assessedValue)}</td>
        <td class="history-heat-cell px-3 py-2 text-right"${taxesHeat}>${row.taxes === null ? "Pending" : formatNullableMoney(row.taxes, true)}</td>
        <td class="history-heat-cell px-3 py-2 text-right font-medium"${etrHeat}>${etr === null ? "Pending" : formatNullablePercent(etr)}</td>
      </tr>
    `;
  }).join("");

  const footnote = document.getElementById("historyFootnote");
  if (footnote) {
    const notes = [...new Set(rows.map(row => `${row.note ?? ""}`.trim()).filter(Boolean))];
    footnote.classList.toggle("hidden", !notes.length);
    footnote.textContent = notes.length ? `* ${notes.join(" ")}` : "";
  }

  document.querySelectorAll("[data-tax-history-source]").forEach(element => {
    element.textContent = taxHistorySourceText(data);
  });
}

function historyHeatRange(rows, valueForRow) {
  const values = rows
    .map(valueForRow)
    .filter(value => Number.isFinite(value));

  if (values.length === 0) return null;

  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

function historyHeatStyle(value, range, colorVariable) {
  if (!range || !Number.isFinite(value)) return "";

  const spread = range.max - range.min;
  const intensity = spread === 0 ? 0.55 : (value - range.min) / spread;
  const bounded = Math.min(1, Math.max(0, intensity));
  const alpha = 0.08 + (bounded * 0.28);
  const stop = 18 + (bounded * 74);

  return ` style="--history-heat-color: var(${colorVariable}); --history-heat-alpha: ${alpha.toFixed(3)}; --history-heat-stop: ${Math.round(stop)}%;"`;
}

function annualizedChange(startValue, endValue, years) {
  if (!Number.isFinite(startValue) || !Number.isFinite(endValue) || !years) return null;
  if (startValue === 0) return endValue === 0 ? 0 : null;
  if (endValue < 0 || startValue < 0) return null;
  return Math.pow(endValue / startValue, 1 / years) - 1;
}

function signedPercent(value) {
  if (!Number.isFinite(value)) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${percent.format(value)}`;
}

function signedPoints(value) {
  if (!Number.isFinite(value)) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${(value * 100).toFixed(2)} pts`;
}

function percentChangeBetween(previous, current) {
  if (!Number.isFinite(previous) || !Number.isFinite(current)) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / previous;
}

function isZeroToZero(previous, current) {
  return Number.isFinite(previous) && Number.isFinite(current) && previous === 0 && current === 0;
}

function taxMovementValue(previous, current) {
  return isZeroToZero(previous, current) ? "No net tax" : signedPercent(percentChangeBetween(previous, current));
}

function taxAnnualNote(firstTax, lastTax, years) {
  if (!firstTax || !lastTax) return "Loaded tax years unavailable";
  if (isZeroToZero(firstTax.taxes, lastTax.taxes)) return "No net tax in loaded years";
  return `${signedPercent(annualizedChange(firstTax.taxes, lastTax.taxes, years))} average per year`;
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

  const valueYears = firstValue && lastValue ? lastValue.year - firstValue.year : null;
  const taxYears = firstTax && lastTax ? lastTax.year - firstTax.year : null;
  const etrYears = firstEtr && lastEtr ? lastEtr.year - firstEtr.year : null;

  const valueChange = percentChangeBetween(firstValue?.assessedValue, lastValue?.assessedValue);
  const taxChange = percentChangeBetween(firstTax?.taxes, lastTax?.taxes);
  const etrChange = firstEtr && lastEtr ? lastEtr.etr - firstEtr.etr : null;

  const recentCards = [
    [
      "Assessed value",
      signedPercent(percentChangeBetween(previousValue?.assessedValue, lastValue?.assessedValue)),
      `${formatNullableMoney(previousValue?.assessedValue)} to ${formatNullableMoney(lastValue?.assessedValue)}`,
      previousValue && lastValue ? `${previousValue.year}-${lastValue.year}` : "Recent available years"
    ],
    [
      "Net taxes",
      taxMovementValue(previousTax?.taxes, lastTax?.taxes),
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
      taxMovementValue(firstTax?.taxes, lastTax?.taxes),
      taxAnnualNote(firstTax, lastTax, taxYears),
      firstTax && lastTax ? `${firstTax.year}-${lastTax.year} finalized` : "Loaded tax years"
    ],
    [
      "ETR movement",
      `${formatNullablePercent(firstEtr?.etr)} to ${formatNullablePercent(lastEtr?.etr)}`,
      `${signedPoints(etrYears ? etrChange / etrYears : null)} average / year`,
      firstEtr && lastEtr ? `${firstEtr.year}-${lastEtr.year} finalized` : "Loaded tax years"
    ]
  ];

  container.innerHTML = `
    <div class="movement-summary-grid">
      <section class="movement-summary-section">
        <div class="movement-section-heading">
          <p>Recent movement</p>
          <p>${previousValue?.year && lastValue?.year ? `${previousValue.year}-${lastValue.year}` : "Recent available years"}</p>
        </div>
        <div class="mt-2 grid gap-3">
          ${recentCards.map(movementCard).join("")}
        </div>
      </section>
      <section class="movement-summary-section">
        <div class="movement-section-heading">
          <p>Movement history</p>
          <p>${firstValue.year}-${lastValue.year}</p>
        </div>
        <div class="mt-2 grid gap-3">
          ${historicalCards.map(movementCard).join("")}
        </div>
      </section>
    </div>
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

  container.innerHTML = years.map((year, index) => {
    const levyRow = displayLevyByYear.get(year);
    const priorLevyRow = displayLevyByYear.get(year - 1);
    const statement = statementsByYear.get(year);
    const netTaxes = statement?.netAmountDue ?? statement?.totalTaxesDue ?? null;
    const effectiveTaxRate = statement && statement.assessedValue && netTaxes
      ? netTaxes / statement.assessedValue
      : statement?.derived?.netEffectiveTaxRate ?? null;
    const rowClass = levyRow?.status === "pending" ? "pending-data-row" : index % 2 === 0 ? "bg-white" : "bg-slate-50";

    return `
      <tr class="${rowClass}">
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

  renderTaxEquationWaterfall(data, displayLevyByYear);
}

function renderTaxEquationWaterfall(data, displayLevyByYear) {
  const container = document.getElementById("taxEquationWaterfall");
  if (!container) return;

  const statement = finalizedTaxStatements(data)[0];
  if (!statement) {
    container.innerHTML = "";
    return;
  }

  const levy = displayLevyByYear?.get(statement.taxYear)?.levy ?? statementGrossLevy(statement);
  const gross = statement.grossTaxAmount ?? (statement.assessedValue && levy ? statement.assessedValue * (levy / 100) : null);
  const credits = statementTotalCredits(statement);
  const net = statement.netAmountDue ?? statement.totalTaxesDue ?? null;
  const steps = [
    ["Assessed value", formatNullableMoney(statement.assessedValue), statement.taxYear],
    ["Levy", formatNullableLevy(levy), "gross rate"],
    ["Gross tax", formatNullableMoney(gross, true), "before credits"],
    ["Credits", credits !== null ? formatNullableMoney(credits, true) : "—", "reductions"],
    ["Net tax", formatNullableMoney(net, true), "statement amount"]
  ];
  const operators = ["×", "=", "−", "="];

  container.innerHTML = `
    <div class="tax-equation-heading">
      <h3>${statement.taxYear} tax statement shorthand</h3>
    </div>
    <div class="tax-equation-steps">
      ${steps.map(([label, value, note], index) => `
        ${index > 0 ? `<span class="tax-equation-operator" aria-hidden="true">${operators[index - 1]}</span>` : ""}
        <section class="${index === steps.length - 1 ? "tax-equation-step-total" : ""}">
          <p>${escapeHtml(label)}</p>
          <strong>${escapeHtml(value)}</strong>
          <span>${escapeHtml(String(note))}</span>
        </section>
      `).join("")}
    </div>
  `;
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
  if (statement.grossTaxAmount === null || statement.grossTaxAmount === undefined) return levyRow;

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

  if (!statement.credits) return null;

  return Math.abs(Object.values(statement.credits || {}).reduce((sum, credit) => sum + (credit?.amount || 0), 0));
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
        <td class="whitespace-nowrap px-3 py-2 text-right">${formatNullableLevy(row.rate)}</td>
        <td class="whitespace-nowrap px-3 py-2 text-right">${percent.format(share)}</td>
        <td class="whitespace-nowrap px-3 py-2 text-right">${moneyCents.format(taxPer100k)}</td>
      </tr>
    `;
  }).join("");

  const totalTaxPer100k = taxableValuePer100k * (total / 100);
  const totalRow = `
    <tr class="table-total-row font-semibold">
      <td class="px-3 py-3">Total levy</td>
      <td class="whitespace-nowrap px-3 py-3 text-right">${formatNullableLevy(total)}</td>
      <td class="whitespace-nowrap px-3 py-3 text-right">100.00%</td>
      <td class="whitespace-nowrap px-3 py-3 text-right">${moneyCents.format(totalTaxPer100k)}</td>
    </tr>
  `;

  document.getElementById("levyRows").innerHTML = dataRows + totalRow;
}

function renderSources(data) {
  const container = document.getElementById("sourceCards");
  if (!container) return;

  container.innerHTML = data.sources.map(source => `
    <div class="review-note">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${source.label}</p>
      <p class="mt-1 font-medium text-slate-700">${source.value}</p>
    </div>
  `).join("");
}
