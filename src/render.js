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
  getLatestFinalTaxHistory,
  getPreviousFinalValueHistory,
  getSnapshotHistory
} from "./data-service.js";
import {
  buildComparableWorksheetModel,
  buildForm422PrefillModel,
  generateComparableWorksheetPdf,
  generateForm422Pdf,
  generateProtestPacketPdf,
  printPdf
} from "./form422Prefill.js";
import {
  buildForm458PrefillModel,
  generateForm458Pdf
} from "./homesteadPrefill.js";
import {
  buildRecordCorrectionEmailPayload,
  buildRecordCorrectionSubmission,
  generateRecordCorrectionPdf
} from "./recordCorrectionRequest.js";

const discrepancyChoices = [
  ["incorrect", "Incorrect"],
  ["missing", "Missing"],
  ["misclassified", "Misclassified"],
  ["needs-review", "Needs review"],
  ["other", "Other"]
];
const discrepancyChoiceLabels = Object.fromEntries(discrepancyChoices);

const viewHeaderContent = {
  "your-property": {
    eyebrow: "Guided Property Snapshot",
    title: "Your property story, step by step",
    description: "Start with the record, then move through assessment, taxes, districts, market context, county equalization, and review action.",
    imageAlt: "Map of Nebraska highlighting Gage County"
  },
  "your-assessment": {
    eyebrow: "Step 2 · Assessment",
    title: "What changed about the assessed value?",
    description: "Review the assessed value before interpreting the tax bill. Current-year values and finalized tax years are intentionally separated.",
    imageAlt: "Map of Nebraska highlighting the local market area"
  },
  "your-taxes": {
    eyebrow: "Step 3 · Taxes",
    title: "What does this mean for taxes?",
    description: "Connect the finalized tax history, effective tax rate, and tax-pressure context before looking at individual taxing bodies.",
    imageAlt: "Map of Nebraska highlighting Gage County"
  },
  "tax-districts": {
    eyebrow: "Step 4 · Tax districts",
    title: "Who is taxing this property?",
    description: "Separate the tax bill distribution from the list of organizations inside this property’s tax district.",
    imageAlt: "Map of Nebraska"
  },
  "market-area": {
    eyebrow: "Step 5 · Market area",
    title: "How does this compare nearby?",
    description: "The property's local comparison group and state assessment reports provide market context.",
    imageAlt: "Map of Nebraska highlighting the local market area"
  },
  "county-equalization": {
    eyebrow: "Step 6 · County equalization",
    title: "How is the county performing overall?",
    description: "Countywide sales studies and certified-tax trends help explain the assessment environment around the property.",
    imageAlt: "Map of Nebraska highlighting Gage County"
  },
  "state-context": {
    eyebrow: "Step 7 · State context",
    title: "How does the county compare statewide?",
    description: "Statewide CTL baselines provide a broader frame for local value growth, taxes levied, and average tax rates.",
    imageAlt: "Map of Nebraska"
  },
  "review-checklist": {
    eyebrow: "Step 8 · Review",
    title: "Need to review anything?",
    description: "Confirm the record, organize unresolved questions, and keep optional filing resources clearly separated from the main review.",
    imageAlt: "Map of Nebraska highlighting Gage County"
  }
};

export function renderPage(data, imageModal, calendar, recordCard, valuationGroups, governingOffice, summaryContext = {}) {
  renderViewHeader("your-property", data.snapshotModel);
  renderPropertyViewContext(data, recordCard, valuationGroups);
  renderHeader(data, imageModal, recordCard);
  renderAssessmentNoticeSummary(data, recordCard);
  renderComparisonShells(data);
  renderHeaderTimeline(calendar);
  renderPropertyDetails(data, recordCard);
  renderDiscrepancyForm(data, recordCard);
  initReportErrorModal(data, recordCard, governingOffice);
  initProtestPreparationActions(data, recordCard);
  initForm458Modal(data, recordCard);
  renderSummary(data, recordCard, summaryContext);
  renderProcessTimeline(calendar);
  renderHistoryTable(data, recordCard);
  renderPropertyMovementSummary(data);
  renderTaxHistoryTable(data);
  renderLevyTable(data);
  renderSources(data);
}

function renderComparisonShells(data) {
  renderValueTaxHistoryShell();
  renderTaxHistoryShell();
  renderTaxDistributionShell(data);
  renderMarketSalePriceShell();
  renderAssessmentAccuracyShell();
}

function renderValueTaxHistoryShell() {
  const container = document.getElementById("value-tax-history-panel");
  if (!container) return;

  container.innerHTML = `
    <div class="data-split-view grid gap-6 lg:grid-cols-5">
      <article id="value-history" class="lg:col-span-2">
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
          <canvas id="indexedChart"></canvas>
        </div>
      </article>
    </div>
    <p data-property-record-source class="chart-source"></p>
  `;
}

function renderTaxHistoryShell() {
  const container = document.getElementById("tax-history-panel");
  if (!container) return;

  container.className = "data-split-view grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]";
  container.innerHTML = `
    <article id="tax-history" class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 class="text-xl font-bold text-slate-700">How did levy, credits, and net taxes move?</h2>
      <p class="mt-1 text-sm text-slate-600">Finalized statement years show the levy, gross tax, credits, net amount paid, and effective tax rate in one place.</p>
      <div class="mt-4 overflow-x-auto rounded-xl ring-1 ring-slate-200">
        <table class="tax-burden-table min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
          <thead class="tax-burden-table-head">
            <tr>
              <th class="px-2 py-2 text-left font-semibold sm:px-3">Year</th>
              <th class="px-2 py-2 text-right font-semibold sm:px-3">Levy</th>
              <th class="px-2 py-2 text-center font-semibold sm:px-3">Change</th>
              <th class="px-2 py-2 text-right font-semibold sm:px-3">Gross</th>
              <th class="px-2 py-2 text-right font-semibold sm:px-3">Credits</th>
              <th class="px-2 py-2 text-right font-semibold sm:px-3">Net</th>
              <th class="px-2 py-2 text-right font-semibold sm:px-3">ETR</th>
            </tr>
          </thead>
          <tbody id="taxHistoryRows" class="divide-y divide-slate-200"></tbody>
        </table>
      </div>
    </article>

    <article id="etr-trend" class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
	      <h2 class="text-xl font-bold text-slate-700">How much tax was paid for each dollar of value?</h2>
	      <p class="mt-1 text-sm text-slate-600">Effective tax rate compares the final tax bill with assessed value, making years easier to compare.</p>
      <div class="mt-4 h-64 sm:h-72">
        <canvas id="etrChart"></canvas>
      </div>
    </article>
  `;
}

function renderTaxDistributionShell(data) {
  const container = document.getElementById("tax-distribution");
  if (!container) return;

  container.innerHTML = `
    <div class="data-split-view grid gap-6 lg:grid-cols-5">
      <article class="lg:col-span-2">
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
      </article>

      <article class="lg:col-span-3">
        <h2 class="text-xl font-bold text-slate-700">Where does the tax bill go?</h2>
	        <p class="mt-1 text-sm text-slate-600">The most recent finalized tax breakdown shows the taxing bodies listed for this property. The current-year breakdown appears after levies are finalized.</p>
        <div class="mt-4 grid gap-4 md:grid-cols-[minmax(150px,220px)_minmax(0,1fr)] md:items-center">
          <div id="distributionNotes" class="space-y-2 text-sm text-slate-700"></div>
          <div class="h-72 sm:h-80">
            <canvas id="distributionChart"></canvas>
          </div>
        </div>
      </article>
    </div>
	    <p class="chart-source">Source: ${escapeHtml(data.latestFinalTaxYear ?? "Latest finalized")} finalized tax breakdown for this property's tax district.</p>
  `;
}

function renderMarketSalePriceShell() {
  const container = document.getElementById("county-sale-price-bands");
  if (!container) return;

  container.innerHTML = `
    <h2 id="marketSalePriceTitle" class="text-xl font-bold text-slate-700">What makes up the residential sales data?</h2>
	    <p id="marketSalePriceDescription" class="mt-1 text-sm text-slate-600">Sale-price ranges show where qualified sales are concentrated and whether the local study is based mostly on lower-, middle-, or higher-priced properties.</p>
    <div class="data-split-view mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
      <div class="overflow-x-auto rounded-xl ring-1 ring-slate-200">
        <table class="min-w-full divide-y divide-slate-200 text-xs">
          <thead>
            <tr>
              <th class="px-2 py-2 text-left font-semibold">Sale price range</th>
              <th class="px-2 py-2 text-right font-semibold">Sales</th>
              <th class="px-2 py-2 text-right font-semibold">Median</th>
              <th class="px-2 py-2 text-right font-semibold">COD</th>
              <th class="px-2 py-2 text-right font-semibold">PRD</th>
              <th class="px-2 py-2 text-right font-semibold">Avg. sale</th>
            </tr>
          </thead>
          <tbody id="marketSalePriceRows" class="divide-y divide-slate-200 [&>tr:nth-child(even)]:bg-slate-50"></tbody>
        </table>
      </div>
      <div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <p id="marketSalePriceChartTitle" class="text-xs font-semibold uppercase tracking-wide text-slate-500">Sales distribution</p>
        <p id="marketSalePriceChartNote" class="mt-1 text-sm leading-5 text-slate-600">Qualified sales by price band, including empty upper bands.</p>
        <div id="marketSalePriceChartLegend" class="chart-disc-legend mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600"></div>
        <div class="mt-3 h-64">
          <canvas id="marketSalePriceChart"></canvas>
        </div>
      </div>
    </div>
    <p id="marketSalePriceSource" class="chart-source"></p>
  `;
}

function renderAssessmentAccuracyShell() {
  const container = document.getElementById("assessment-accuracy-body");
  if (!container) return;

  container.innerHTML = `
    <div id="assessmentAccuracySummary" class="mt-5 grid gap-3 md:grid-cols-4"></div>
    <section class="data-split-view mt-5 grid gap-6 lg:grid-cols-5">
      <article class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 lg:col-span-2">
        <h3 class="text-lg font-bold text-slate-700">What changed by year?</h3>
	        <p class="mt-1 text-sm text-slate-600">Latest years appear first so recent county sales-study results are easy to compare with prior years.</p>
        <div class="mt-4 overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
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
        <div class="mt-4 rounded-xl bg-white p-3 text-xs leading-5 text-slate-600 ring-1 ring-slate-200">
          <p class="font-semibold text-slate-700">How to read the chart</p>
          <p class="mt-1">
            COD, PRD, and COV use different scales, so the chart converts each measure to its own standard band. The shaded area is the preferred range. Each line shows whether that measure is moving into the band, out of it, or moving differently from the others.
          </p>
        </div>
      </article>
      <article class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 lg:col-span-3">
	        <h3 class="text-lg font-bold text-slate-700">Are the county measures inside the preferred range?</h3>
	        <p class="mt-1 text-sm text-slate-600">Each line is compared with its own preferred range. The shaded band marks the range for the selected property class.</p>
        <div class="mt-4 h-80">
          <canvas id="assessmentAccuracyChart"></canvas>
        </div>
        <div id="assessmentAccuracyNotes" class="mt-4 grid gap-2 text-xs leading-5 text-slate-600 sm:grid-cols-3"></div>
      </article>
    </section>
  `;
}

export function renderPropertyViewContext(data, recordCard, valuationGroups) {
  const context = document.getElementById("propertyViewContext");
  if (!context) return;
  const marketArea = propertyMarketAreaLabel(data, recordCard, valuationGroups);

  context.innerHTML = `
    <div class="property-context-bar mb-4">
      <div class="min-w-0">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${data.snapshotYear} Property Snapshot</p>
        <p class="mt-0.5 truncate text-xl font-bold tracking-tight text-slate-700">${data.parcel.situsAddress}</p>
      </div>
      <p class="min-w-0 text-sm font-medium text-slate-600">
        <span class="text-slate-700">${data.parcel.accountType} Property</span>
        <span class="text-slate-400">•</span>
        ${marketArea}
        <span class="text-slate-400">•</span>
        ${data.classification.location}
      </p>
    </div>
  `;
}

function propertyMarketAreaLabel(data, recordCard, valuationGroups) {
  const valuationGroupId = `${recordCard?.locationModel?.valuationGroup ?? ""}`.match(/\d+/)?.[0];
  const propertyClass = data.classification.propertyClass;
  const match = (valuationGroups?.valuationGroups || []).find(group =>
    String(group.valuationGroup) === String(valuationGroupId)
    && group.class === propertyClass
  );

  if (match?.description) {
    return `${match.description} · VG ${match.valuationGroup}`;
  }

  return recordCard?.locationModel?.valuationGroup || "Market area not listed";
}

function getTodayToken() {
  const today = new Date();
  return (today.getMonth() + 1) * 100 + today.getDate();
}

function stageToken(datePart) {
  return datePart.month * 100 + datePart.day;
}

function isStageActive(stage, todayToken = getTodayToken()) {
  return todayToken >= stageToken(stage.start) && todayToken <= stageToken(stage.end);
}

function isStagePast(stage, todayToken = getTodayToken()) {
  return todayToken > stageToken(stage.end);
}

function getActiveStages(calendar) {
  return calendar.stages.filter(stage => isStageActive(stage));
}

export function getCurrentStageText(calendar) {
  const activeStages = getActiveStages(calendar);

  if (!activeStages.length) {
    return "Between calendar stages";
  }

  return activeStages.map(stage => stage.label).join(" + ");
}

export function renderViewHeader(view = "your-property", snapshotModel) {
  const section = snapshotModel?.sections?.find(item => item.id === view);
  const noticeAddress = snapshotModel?.viewModels?.notice?.displayAddress
    || snapshotModel?.viewModels?.notice?.situsAddress;
  const showLookupPlaceholder = view === "landing-primer";
  const content = section
    ? {
      eyebrow: section.eyebrow,
      title: view === "landing-primer" && noticeAddress
        ? `You are looking at ${noticeAddress}.`
        : section.question,
      description: section.description,
      imageAlt: viewHeaderContent[view]?.imageAlt ?? "Map of Nebraska"
    }
    : viewHeaderContent[view] || viewHeaderContent["your-property"];
  const title = document.getElementById("pageTitle");

  title.innerHTML = `
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">
          ${content.eyebrow}
        </p>

        <h1 class="mt-1 text-4xl font-bold tracking-tight text-slate-700">
          ${content.title}
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
        ${showLookupPlaceholder ? disabledParcelLookupMarkup() : ""}
      </div>
    </div>
  `;

  initDisabledParcelLookup(title);
}

function disabledParcelLookupMarkup() {
  return `
    <div class="parcel-lookup-placeholder" data-parcel-lookup>
      <p class="parcel-lookup-label">Find another property</p>
      <button
        type="button"
        class="parcel-lookup-shell"
        data-parcel-lookup-trigger
        aria-disabled="true"
        aria-expanded="false"
        aria-controls="parcelLookupPopover"
      >
        <span class="parcel-lookup-input">Address, parcel ID, or owner name</span>
        <span class="parcel-lookup-action" aria-hidden="true">Search</span>
      </button>
      <div id="parcelLookupPopover" class="parcel-lookup-popover" data-parcel-lookup-popover hidden>
	        Search is not available in this demonstration. To review another property, use official county lookup tools.
      </div>
    </div>
  `;
}

function initDisabledParcelLookup(root) {
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

function renderHeader(data, imageModal, recordCard) {
  const header = document.getElementById("pageHeader");

  header.innerHTML = `
    <div class="property-hero-header">
      <div class="property-hero-identity">
        <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">${data.snapshotYear} Property Snapshot</p>
        <h2 class="mt-1 text-3xl font-bold tracking-tight text-slate-700">${data.parcel.situsAddress}</h2>
        <p class="mt-2 text-base text-slate-600">
          <span class="font-medium text-slate-700">
            ${data.parcel.accountType} Property
          </span>
          <span class="text-slate-400">•</span>
          School District ${data.parcel.schoolDistrict.replace("SCH ", "")}
          <span class="text-slate-400">•</span>
          ${data.classification.location}
        </p>      
      </div>

      <div class="property-hero-notice">
        ${valuationNoticeSummary(data, recordCard)}
      </div>

      <div class="property-hero-media">
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
          <p>Notice value breakdown</p>
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
    const noticeYear = data.latestFinalTaxYear ?? data.snapshotYear;

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

function renderHeaderTimeline(calendar) {
  document.getElementById("headerTimeline").innerHTML = `
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="min-w-0">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Property tax timeline</p>
        <p class="mt-1 text-sm text-slate-600">Current stage: <strong class="timeline-current-stage">${getCurrentStageText(calendar)}</strong></p>
      </div>

      <div class="relative flex flex-1 items-start justify-between gap-2">
        <div class="absolute left-0 right-0 top-2.5 h-0.5 bg-slate-200"></div>
        ${calendar.stages.map(stage => {
          const active = isStageActive(stage);
          const past = isStagePast(stage);
          const state = active ? "active" : past ? "past" : "future";

          return `
            <a href="#tax-cycle" data-jump-target="tax-cycle" class="timeline-sync-link relative z-10 flex min-w-0 flex-1 flex-col items-center gap-1 text-center" aria-label="View full ${stage.label} timeline details">
              <span class="timeline-sync-dot timeline-sync-dot-${state}"></span>
              <span class="timeline-sync-label timeline-sync-label-${state}">${stage.label}</span>
            </a>
          `;
        }).join("")}
      </div>
    </div>
  `;
}


function imageButton(src, caption, label) {
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
  const identityDetails = [
    ["Parcel ID", data.parcel.parcelId],
    ["Owner", data.parcel.owner],
    ["Situs address", data.parcel.situsAddress],
    ["Tax district", data.parcel.taxDistrict],
    ["Legal description", data.parcel.legalDescription],
    ["Status", data.classification.status],
    ["Zoning", data.classification.zoning],
    ["Lot size", data.classification.lotSize]
  ];
  const physicalDetails = physicalDetailsForProperty(data);

  const renderCards = details => details.map(([label, value]) => `
    <div class="details-card">
      <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</dt>
      <dd class="mt-1 text-sm font-medium text-slate-700">${displayValue(value)}</dd>
    </div>
  `).join("");

  document.getElementById("propertyDetails").innerHTML = [
    renderCards(identityDetails),
    renderCards(physicalDetails),
    technicalCostModel(recordCard, data),
    classificationDetails(data),
    landInformation(data, recordCard),
    propertyNotes(data),
    propertyValueTaxHistory(data, recordCard),
    ownershipHistory(recordCard),
    recordCardSource(recordCard),
    reportErrorLink(data, recordCard)
  ].join("");
}

function propertyRecordSourceYear(recordCard) {
  if (!recordCard?.source?.printedAt) return null;

  const printedAt = new Date(recordCard.source.printedAt);
  return Number.isNaN(printedAt.getTime()) ? null : printedAt.getFullYear();
}

function propertyRecordSourceText(data, recordCard) {
  const sourceYear = propertyRecordSourceYear(recordCard);
  const sourceName = recordCard?.source?.displayCitation || "MIPS Property Record Card";
  const yearPrefix = sourceYear ? `${sourceYear} ` : "";

  return `Source: ${yearPrefix}${sourceName}, Parcel ID ${data.parcel.parcelId}.`;
}

function reportErrorLink(data, recordCard) {
  return `
    <div class="sm:col-span-2 px-1 pt-1 text-xs text-slate-500">
      <p>${escapeHtml(propertyRecordSourceText(data, recordCard))}</p>
    </div>
  `;
}

function escapeHtml(value) {
  return `${value ?? ""}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
  return Boolean(recordCard?.parcelIdentifiers && recordCard?.locationModel);
}

function physicalDetailsForProperty(data) {
  if (data.commercial?.buildingDatasheet?.length || data.classification.propertyClass === "Commercial") {
    return [
      ["Primary occupancy", data.commercial?.primaryOccupancy],
      ["Year built", data.commercial?.yearBuilt],
      ["Building size", formatSquareFeet(data.commercial?.buildingSize)],
      ["Perimeter", data.commercial?.perimeter ? `${data.commercial.perimeter} ft.` : null],
      ["Land use", data.commercial?.landUse],
      ["Construction", data.commercial?.constructionType],
      ["Quality / condition", [data.commercial?.quality, data.commercial?.condition].filter(Boolean).join(" / ")],
      ["Heating / cooling", data.commercial?.heatingCooling]
    ];
  }

  return [
    ["Year built", data.residential?.yearBuilt],
    ["Style", data.residential?.style],
    ["Building size", formatSquareFeet(data.residential?.buildingSize)],
    ["Basement size", formatSquareFeet(data.residential?.basementSize)],
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
    row.squareFeet !== null && row.squareFeet !== undefined ? `Area: ${Number(row.squareFeet).toLocaleString()} sq. ft.` : null
  ].filter(Boolean).join(" • ");
  const rows = [
    ["Parcel ID", data.parcel.parcelId, "Property facts"],
    ["Owner", data.parcel.owner, "Property facts"],
    ["Situs address", data.parcel.situsAddress, "Property facts"],
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
    ...(detailedRecordCard ? [
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
          ["Situs address", data.parcel.situsAddress],
          ["Owner", data.parcel.owner],
          ["Tax district", data.parcel.taxDistrict],
          ["Mailing address", data.parcel.mailingAddress],
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

      console.info("Property record correction request ready for delivery", {
        emailDeliveryConfigured: delivery.delivered,
        developmentMode: delivery.developmentMode,
        submission,
        emailPayload,
        pdf: {
          generated: true,
          byteLength: pdfBytes.length,
          fileName: emailPayload.attachment.fileName
        }
      });

      if (submitStatus) {
        if (delivery.delivered) {
          submitStatus.textContent = "Your property record correction request has been sent to the Assessor's Office. A copy has also been sent to your email for your records.";
          submitStatus.className = "text-sm font-semibold text-emerald-700";
          localStorage.removeItem(draftKey);
        } else {
	          submitStatus.textContent = `Correction-request PDF prepared for ${emailPayload.to}. This demonstration does not send email, so no message was sent and your draft remains available in this browser.`;
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

function navigateToProtestPreparation(targetSelector = "#protest-preparation") {
  document.dispatchEvent(new CustomEvent("property-snapshot:select-guided-step", {
    detail: {
      step: "resources",
      target: targetSelector
    }
  }));

  window.setTimeout(() => {
    const target = document.querySelector(targetSelector);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.classList.add("jump-target-active");
    window.setTimeout(() => target.classList.remove("jump-target-active"), 1400);
  }, 0);
}

const comparableResearchChecklistFields = [
  ["Location / neighborhood / market area", "Location / market area"],
  ["Most recent sale, if available", "Most recent sale"],
  ["Living area / square footage", "Living area / square footage"],
  ["Style or property type", "Style or property type"],
  ["Year built / age", "Year built / age"],
  ["Basement: yes/no/finished/unfinished", "Basement"],
  ["Garage: attached/detached/none", "Garage"],
  ["Outbuildings or major improvements", "Outbuildings or major improvements"],
  ["Lot size", "Lot size"],
  ["General condition, if apparent", "Quality / condition"]
];

function worksheetRowValue(model, label) {
  return model.rows.find(row => row.label === label)?.subject || "Not listed";
}

function renderComparableResearchChecklist(model) {
  const container = document.getElementById("comparableResearchChecklist");
  if (!container || !model) return;

  container.innerHTML = `
    <div class="comparable-checklist-header" aria-hidden="true">
      <span></span>
      <span>Research item</span>
      <span>Subject property</span>
    </div>
    ${comparableResearchChecklistFields.map(([label, sourceLabel]) => `
      <label class="comparable-checklist-item">
        <input type="checkbox" class="comparable-checklist-check" aria-label="Reviewed ${escapeHtml(label)}">
        <span class="comparable-checklist-label">${escapeHtml(label)}</span>
        <span class="comparable-checklist-reference">${escapeHtml(worksheetRowValue(model, sourceLabel))}</span>
      </label>
    `).join("")}
  `;
}

function worksheetEntryId(rowIndex, comparableIndex) {
  return `worksheet-row-${rowIndex}-comparable-${comparableIndex}`;
}

function worksheetEntryKey(rowIndex, comparableIndex) {
  return `${rowIndex}:${comparableIndex}`;
}

function worksheetStorageKey(model) {
  return `propertySnapshot:comparableWorksheet:${model.parcelId}:${model.snapshotYear}`;
}

function readWorksheetDraft(model) {
  try {
    return JSON.parse(window.sessionStorage.getItem(worksheetStorageKey(model)) || "{}");
  } catch {
    return {};
  }
}

function writeWorksheetDraft(model, values) {
  try {
    window.sessionStorage.setItem(worksheetStorageKey(model), JSON.stringify(values));
  } catch {
    // Session storage is a convenience only; worksheet inputs still print from the page.
  }
}

function collectWorksheetEntries(container) {
  return Object.fromEntries(
    [...container.querySelectorAll("[data-worksheet-entry]")]
      .map(input => [input.dataset.worksheetKey, input.value.trim()])
      .filter(([, value]) => value)
  );
}

function worksheetModelWithEntries(model, entries) {
  return {
    ...model,
    rows: model.rows.map((row, rowIndex) => ({
      ...row,
      comparables: [0, 1, 2].map(comparableIndex => entries[worksheetEntryKey(rowIndex, comparableIndex)] || "")
    }))
  };
}

function initWorksheetDraftStorage(container, model) {
  const draft = readWorksheetDraft(model);
  const inputs = [...container.querySelectorAll("[data-worksheet-entry]")];

  inputs.forEach(input => {
    input.value = draft[input.dataset.worksheetKey] || "";
  });

  container.addEventListener("input", event => {
    if (!event.target.matches("[data-worksheet-entry]")) return;
    writeWorksheetDraft(model, collectWorksheetEntries(container));
  });
}

function worksheetCell(row, { subject = false, rowIndex = 0, comparableIndex = 0 } = {}) {
  if (subject) {
    return `<td class="worksheet-subject-cell">${escapeHtml(row.subject || "Not listed")}</td>`;
  }

  const id = worksheetEntryId(rowIndex, comparableIndex);
  const key = worksheetEntryKey(rowIndex, comparableIndex);
  const isNotes = row.label === "Notes";

  return `
    <td class="worksheet-blank-cell${isNotes ? " worksheet-notes-cell" : ""}">
      <label class="sr-only" for="${id}">Comparable ${comparableIndex + 1} ${escapeHtml(row.label)}</label>
      <textarea
        id="${id}"
        class="worksheet-entry-input${isNotes ? " worksheet-notes-input" : ""}"
        data-worksheet-entry
        data-worksheet-key="${key}"
        rows="${isNotes ? 3 : 1}"
        placeholder="${isNotes ? "Notes" : "Enter value"}"
      ></textarea>
    </td>
  `;
}

function renderComparableWorksheet(model) {
  const container = document.getElementById("comparableWorksheet");
  if (!container || !model) return;

  container.innerHTML = `
    <div class="comparable-worksheet-shell" role="region" aria-label="Comparable value worksheet">
      <table class="comparable-worksheet-table">
        <thead>
          <tr>
            <th scope="col">Review field</th>
            ${model.columns.map(column => `<th scope="col">${escapeHtml(column)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${model.rows.map((row, rowIndex) => `
            <tr>
              <th scope="row">${escapeHtml(row.label)}</th>
              ${worksheetCell(row, { subject: true })}
              ${worksheetCell(row, { rowIndex, comparableIndex: 0 })}
              ${worksheetCell(row, { rowIndex, comparableIndex: 1 })}
              ${worksheetCell(row, { rowIndex, comparableIndex: 2 })}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  initWorksheetDraftStorage(container, model);
}

function initProtestPreparationActions(data, recordCard) {
  const fieldContainer = document.getElementById("form422ConfirmationFields");
  const status = document.getElementById("protestPreparationStatus");

  const formModel = buildForm422PrefillModel(data, recordCard);
  const worksheetModel = buildComparableWorksheetModel(data, recordCard);
  const printPacketButtons = [...document.querySelectorAll("[data-print-protest-packet]")];
  const printWorksheetButtons = [...document.querySelectorAll("[data-print-comparable-worksheet]")];
  const printFormButtons = [...document.querySelectorAll("[data-print-form422]")];

  renderComparableResearchChecklist(worksheetModel);
  renderComparableWorksheet(worksheetModel);

  function currentWorksheetModel() {
    const worksheetContainer = document.getElementById("comparableWorksheet");
    return worksheetContainer
      ? worksheetModelWithEntries(worksheetModel, collectWorksheetEntries(worksheetContainer))
      : worksheetModel;
  }

  if (fieldContainer) {
    fieldContainer.innerHTML = formModel.confirmationFields.map(([label, value]) => `
      <div class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${escapeHtml(label)}</p>
        <p class="mt-1 text-sm font-semibold leading-5 text-slate-700">${escapeHtml(value || "Not available")}</p>
      </div>
    `).join("");
  }

  function setStatus(message, tone = "neutral") {
    if (!status) return;
    status.textContent = message;
    status.className = `mt-4 text-sm font-semibold ${
      tone === "success" ? "text-emerald-700" : tone === "error" ? "text-red-700" : "text-slate-600"
    }`;
  }

  function setBusy(buttons, busy) {
    buttons.forEach(button => {
      button.disabled = busy;
      button.classList.toggle("opacity-60", busy);
    });
  }

  async function printPreparedDocument({ buttons, pending, success, errorMessage, documentLabel, generateBytes, fileName }) {
    setStatus(pending);
    setBusy(buttons, true);

    try {
      const bytes = await generateBytes();
      await printPdf(bytes, fileName, documentLabel);
      setStatus(success, "success");
    } catch (error) {
      console.error(error);
      setStatus(error.message || errorMessage, "error");
    } finally {
      setBusy(buttons, false);
    }
  }

  document.addEventListener("click", event => {
    const packetTrigger = event.target.closest?.("[data-print-protest-packet]");
    if (packetTrigger) {
      event.preventDefault();
      printPreparedDocument({
        buttons: printPacketButtons,
        pending: "Preparing the protest preparation packet for printing...",
        success: "Print dialog opened for the protest preparation packet.",
        errorMessage: "The protest preparation packet could not be generated.",
        documentLabel: "protest preparation packet",
        fileName: worksheetModel.packetFileName,
        generateBytes: () => generateProtestPacketPdf(formModel, currentWorksheetModel())
      });
      return;
    }

    const worksheetTrigger = event.target.closest?.("[data-print-comparable-worksheet]");
    if (worksheetTrigger) {
      event.preventDefault();
      const mode = worksheetTrigger.dataset.printComparableWorksheet;
      const isBlank = mode === "blank";
      printPreparedDocument({
        buttons: printWorksheetButtons,
        pending: isBlank ? "Preparing a blank comparable value worksheet for printing..." : "Preparing the filled comparable value worksheet for printing...",
        success: isBlank ? "Print dialog opened for the blank comparable value worksheet." : "Print dialog opened for the filled comparable value worksheet.",
        errorMessage: "The comparable value worksheet could not be generated.",
        documentLabel: "comparable value worksheet",
        fileName: worksheetModel.fileName,
        generateBytes: () => generateComparableWorksheetPdf(isBlank ? worksheetModel : currentWorksheetModel())
      });
      return;
    }

    const formTrigger = event.target.closest?.("[data-print-form422]");
    if (formTrigger) {
      event.preventDefault();
      printPreparedDocument({
        buttons: printFormButtons,
        pending: "Preparing Form 422 for printing...",
        success: "Print dialog opened. Review the form carefully before filing.",
        errorMessage: "Form 422 could not be generated.",
        documentLabel: "Form 422",
        fileName: formModel.fileName,
        generateBytes: () => generateForm422Pdf(formModel)
      });
      return;
    }

    const preparationTrigger = event.target.closest?.("[data-prepare-form422]");
    if (!preparationTrigger) return;

    event.preventDefault();
    navigateToProtestPreparation("#form422-section");
  });
}

function initForm458Modal(data, recordCard) {
  const modal = document.getElementById("form458Modal");
  const closeButtons = document.querySelectorAll("[data-close-form458]");
  const generateButton = document.querySelector("[data-generate-form458]");
  const fieldContainer = document.getElementById("form458ConfirmationFields");
  const status = document.getElementById("form458Status");

  if (!modal || !fieldContainer || !generateButton) return;

  const model = buildForm458PrefillModel(data, recordCard);

  fieldContainer.innerHTML = model.confirmationFields.map(([label, value]) => `
    <div class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${escapeHtml(label)}</p>
      <p class="mt-1 text-sm font-semibold leading-5 text-slate-700">${escapeHtml(value || "Not available")}</p>
    </div>
  `).join("");

  function close() {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
    if (status) {
      status.textContent = "";
      status.className = "mt-4 text-sm font-medium text-slate-600";
    }
  }

  function open() {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
  }

  async function generate() {
    if (status) {
      status.textContent = "Preparing Form 458 for printing...";
      status.className = "mt-4 text-sm font-semibold text-slate-600";
    }
    generateButton.disabled = true;
    generateButton.classList.add("opacity-60");

    try {
      const bytes = await generateForm458Pdf(model);
      await printPdf(bytes, model.fileName);
      if (status) {
        status.textContent = "Print dialog opened. Review the form carefully before filing.";
        status.className = "mt-4 text-sm font-semibold text-emerald-700";
      }
    } catch (error) {
      console.error(error);
      if (status) {
        status.textContent = error.message || "Form 458 could not be generated.";
        status.className = "mt-4 text-sm font-semibold text-red-700";
      }
    } finally {
      generateButton.disabled = false;
      generateButton.classList.remove("opacity-60");
    }
  }

  document.addEventListener("click", event => {
    const trigger = event.target.closest?.("[data-prepare-homestead]");
    if (!trigger) return;

    event.preventDefault();
    open();
  });
  modal.addEventListener("click", close);
  modal.querySelector("[role='dialog']").addEventListener("click", event => event.stopPropagation());
  closeButtons.forEach(button => button.addEventListener("click", close));
  generateButton.addEventListener("click", generate);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") close();
  });
}

function disclosure(title, meta, content) {
  return `
    <details class="sm:col-span-2 rounded-xl bg-white ring-1 ring-slate-200">
      <summary class="cursor-pointer list-none rounded-xl bg-slate-50 px-4 py-3 font-semibold text-slate-700">
        <div class="flex items-center justify-between gap-3">
          <span>${title}</span>
          <span class="flex shrink-0 items-center gap-2 text-sm">
            <span class="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">${meta}</span>
            <span class="disclosure-action text-slate-500">
              <span data-disclosure-closed>Click to expand</span>
              <span data-disclosure-open>Click to close</span>
            </span>
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
	        <p class="mt-1">${escapeHtml(recordCard.notes || "Detailed record-card fields are not available in this demonstration record.")}</p>
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

  const rows = recordCard.valuationHistory.filter(row => row.year >= 2019 && row.year <= 2026);

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
  const valueRows = (data.assessedValueBreakdown || [])
    .slice()
    .filter(row => row.year >= 2019 && row.year <= 2026)
    .sort((a, b) => b.year - a.year);

  if (!valueRows.length) return "";

  const taxByYear = new Map((data.taxpayerHistory || []).map(row => [row.year, row]));
  const recordByYear = new Map((recordCard?.valuationHistory || []).map(row => [row.year, row]));
  const latestKnownRow = valueRows.find(row => row.total !== null && row.total !== undefined);
  const rowLabel = valueRows.length === 1 ? "year" : "years";

  return disclosure(
    "What is the property’s value and tax history?",
    `${valueRows.length} ${rowLabel} · latest known ${formatNullableMoney(latestKnownRow?.total)}`,
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
            <th class="px-3 py-2 text-right font-semibold">Taxes paid</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-slate-200 bg-white">
          ${valueRows.map((row, index) => {
            const recordRow = recordByYear.get(row.year);
            const taxRow = taxByYear.get(row.year);
            const taxableValue = row.total === null || row.total === undefined ? null : recordRow?.taxable ?? row.total;
            const taxesPaid = taxRow?.taxes ?? recordRow?.totalTax;

            return `
              <tr class="${index % 2 === 0 ? "bg-white" : "bg-slate-50"}">
                <td class="px-3 py-2 font-medium">${row.year}</td>
                <td class="px-3 py-2 text-right font-semibold">${formatNullableMoney(row.total)}</td>
                <td class="px-3 py-2 text-right">${formatNullableMoney(row.land)}</td>
                <td class="px-3 py-2 text-right">${formatNullableMoney(row.dwelling)}</td>
                <td class="px-3 py-2 text-right">${formatNullableMoney(row.outbuilding)}</td>
                <td class="px-3 py-2 text-right">${formatNullableMoney(taxableValue)}</td>
                <td class="px-3 py-2 text-right">${taxesPaid === null || taxesPaid === undefined ? "Pending" : formatNullableMoney(taxesPaid, true)}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
      <p class="border-t border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500">
        Value components come from the assessment model. Taxable value and taxes use the record-card history where available, with finalized tax history filling the current guided view.
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

  const totalSquareFeet = rows.reduce(
    (sum, row) => sum + (Number(row.squareFeet) || 0),
    0
  );

  const totalAcres = totalSquareFeet / 43560;

  return disclosure("How is the land described?", meta, `
    ${landModel && locationModel ? `
      <div class="grid gap-3 border-b border-slate-200 bg-slate-50 p-3 text-sm md:grid-cols-3">
        ${[
          ["Neighborhood", locationModel.neighborhood],
          ["Valuation group", locationModel.valuationGroup],
          ["Model / method", `${locationModel.model} / ${locationModel.method}`],
          ["Land model", landModel.description],
          ["Model lot size", `${Number(landModel.lotSize).toLocaleString()} sq. ft.`],
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
            <td class="px-3 py-2 text-right">${row.widthFeet} ft.</td>
            <td class="px-3 py-2 text-right">${row.depthFeet} ft.</td>
            <td class="px-3 py-2 text-right">${Number(row.squareFeet).toLocaleString()} sq. ft.</td>
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

function technicalCostModel(recordCard, data) {
  if (!recordCard?.costApproach) return "";

  const cost = recordCard.costApproach;
  const noticeValues = valuationNoticeValues(data, recordCard).current;
  const assessedRows = (data.assessedValueBreakdown || [])
    .filter(row => row.total !== null && row.total !== undefined)
    .slice()
    .sort((a, b) => b.year - a.year);
  const currentValue = assessedRows[0];
  const garageLines = recordCard.garageCostLines || [];
  const miscLines = recordCard.miscImprovements || [];
  const garageTotal = garageLines.reduce((sum, row) => sum + row.rcnld, 0);
  const miscTotal = miscLines.reduce((sum, row) => sum + row.value, 0);
  const landValue = noticeValues.land ?? currentValue?.land ?? 0;
  const buildingValue = noticeValues.building ?? currentValue?.dwelling ?? recordCard.propertyValuation?.buildings ?? 0;
  const otherImprovementValue = noticeValues.improvement ?? recordCard.propertyValuation?.improvement ?? 0;
  const outbuildingValue = currentValue?.outbuilding ?? 0;
  const totalValue = noticeValues.total ?? currentValue?.total ?? landValue + buildingValue + otherImprovementValue;
  const residentialInfo = recordCard.residentialInformation || {};
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
        <section class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <div class="mb-3 flex items-center justify-between gap-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Marshall & Swift dwelling model</p>
            <p class="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">Subtotal ${formatNullableMoney(cost.rcnld)}</p>
          </div>
          <div class="grid gap-4 text-sm">
            <div class="grid gap-3 lg:grid-cols-3">
            <section>
              <p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Structure model</p>
              <div class="grid gap-3">
                ${[
                  ["Residential type", residentialInfo.type],
                  ["Quality", residentialInfo.quality],
                  ["Condition", residentialInfo.condition],
                  ["Base / total area", residentialInfo.baseTotalArea],
                  ["Year / effective age", cost.yearEffectiveAge]
                ].map(([label, value]) => `
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</p>
                    <p class="mt-1 font-semibold text-slate-700">${escapeHtml(value)}</p>
                  </div>
                `).join("")}
              </div>
            </section>
            <section>
              <p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Costing</p>
              <div class="grid gap-3">
                ${[
                  ["Base cost", moneyCents.format(cost.baseCost)],
                  ["Adjusted cost", cost.adjustedCost.toFixed(3)],
                  ["RCN", formatNullableMoney(cost.rcn)],
                  ["Depreciation", `${cost.depreciation.physicalPercent}% physical`],
                  ["RCNLD", formatNullableMoney(cost.rcnld)],
                  ["Cost per sq. ft.", moneyCents.format(cost.costPerSquareFoot)]
                ].map(([label, value]) => `
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</p>
                    <p class="mt-1 font-semibold text-slate-700">${escapeHtml(value)}</p>
                  </div>
                `).join("")}
              </div>
            </section>
            <section>
              <p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Systems</p>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Heating / cooling</p>
                <p class="mt-1 font-semibold text-slate-700">${escapeHtml(residentialInfo.heatingCooling)}</p>
              </div>
            </section>
            </div>
            <section class="border-t border-slate-200 pt-3">
              <p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cost adjustments</p>
              <div class="adjustment-card-grid">
                ${[
                  ["Roofing", cost.adjustments.roofing],
                  ["Subfloor", cost.adjustments.subfloor],
                  ["Heat / cool", cost.adjustments.heatCool],
                  ["Plumbing", cost.adjustments.plumbing],
                  ["Basement", cost.adjustments.basement]
                ].map(([label, value]) => `
                  <div class="adjustment-card">
                    <p class="adjustment-card-label">${label}</p>
                    <p class="adjustment-card-value">${Number(value).toFixed(2)}</p>
                  </div>
                `).join("")}
              </div>
            </section>
          </div>
        </section>
        <section>
          <div class="mb-2 flex items-center justify-between gap-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Garages</p>
            <p class="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">Subtotal ${formatNullableMoney(garageTotal)}</p>
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
            <p class="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">Subtotal ${formatNullableMoney(miscTotal)}</p>
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
        <section>
          <div class="mb-2 flex items-center justify-between gap-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Outbuildings</p>
            <p class="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">${data.outbuildingData.length ? `${data.outbuildingData.length} records` : "No records"}</p>
          </div>
          <div class="table-clip ring-1 ring-slate-200">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50"><tr><th class="px-3 py-2 text-left font-semibold">Description</th><th class="px-3 py-2 text-right font-semibold">Units</th><th class="px-3 py-2 text-right font-semibold">Year Built</th><th class="px-3 py-2 text-right font-semibold">Cost</th></tr></thead>
              <tbody class="divide-y divide-slate-200 bg-white">
                ${data.outbuildingData.length ? data.outbuildingData.map(row => `
                  <tr>
                    <td class="px-3 py-2">${row.description}</td>
                    <td class="px-3 py-2 text-right">${row.units}</td>
                    <td class="px-3 py-2 text-right">${row.yearBuilt}</td>
                    <td class="px-3 py-2 text-right">${row.cost}</td>
                  </tr>
                `).join("") : `<tr><td class="px-3 py-3 text-slate-500" colspan="4">No outbuilding records listed for this property.</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>
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

function summaryPercentChange(current, previous) {
  if (!current || !previous) return null;
  return (current - previous) / previous;
}

function summaryAnnualizedChange(current, previous, years) {
  if (!current || !previous || !years || years <= 0) return null;
  return Math.pow(current / previous, 1 / years) - 1;
}

function annualizedChangeText(value) {
  if (value === null || value === undefined) return "not available";
  const direction = value < 0 ? "down" : "up";
  return `${direction} about ${formatNullablePercent(Math.abs(value))} per year`;
}

function getSummaryDefaultClass(data, ratioData) {
  const rawClass = `${data.classification?.propertyClass ?? data.parcel?.accountType ?? ""}`.toLowerCase();

  if (rawClass.includes("ag") || rawClass.includes("farm")) return "agFarm";
  if (rawClass.includes("comm")) return "commercial";
  if (rawClass.includes("res")) return "residential";

  return ratioData?.classes?.[0]?.key ?? "residential";
}

function getSummaryLovTarget(classKey) {
  return classKey === "agFarm" ? 75 : 100;
}

function extractSummaryValuationGroupId(recordCard) {
  return `${recordCard?.locationModel?.valuationGroup ?? ""}`.match(/\d+/)?.[0] ?? null;
}

const summaryAssessmentStandardKeys = {
  residential: "residential-improved-rural",
  agFarm: "other-vacant-rural",
  commercial: "income-producing-rural"
};

function getSummaryAssessmentBandConfig(classKey, iaaoStandards) {
  const standardKey = summaryAssessmentStandardKeys[classKey] ?? summaryAssessmentStandardKeys.residential;
  const codStandard = iaaoStandards?.codStandards?.find(item => item.key === standardKey)
    ?? iaaoStandards?.codStandards?.find(item => item.key === summaryAssessmentStandardKeys.residential);

  return {
    cod: codStandard?.codRange ?? { min: 5, max: 20 },
    prd: iaaoStandards?.prdStandards?.acceptableRange ?? { min: 0.98, max: 1.03 },
    cov: codStandard?.estimatedCovRange ?? { min: 6.25, max: 25 }
  };
}

function summaryRangeStatus(value, range, { tolerance = 0 } = {}) {
  if (value === null || value === undefined || !range) return "not available";
  const width = Math.max(Math.abs(range.max - range.min), 0.01);
  const edgeTolerance = Math.max(tolerance, width * 0.25);

  if (value < range.min) {
    const distance = range.min - value;
    return distance <= edgeTolerance ? "slightly below the standard band" : "below the standard band";
  }

  if (value > range.max) {
    const distance = value - range.max;
    return distance <= edgeTolerance ? "slightly above the standard band" : "above the standard band";
  }

  const lowerDistance = value - range.min;
  const upperDistance = range.max - value;
  if (lowerDistance <= edgeTolerance) return "near the lower edge of the standard band";
  if (upperDistance <= edgeTolerance) return "near the upper edge of the standard band";

  return "inside the standard band";
}

function summaryPrdStatus(value, range) {
  if (value === null || value === undefined || !range) return "not available";

  const edgeTolerance = 0.02;
  if (value < range.min) {
    return range.min - value <= edgeTolerance ? "near the lower edge of the standard band" : "below the standard band";
  }

  if (value > range.max) {
    return value - range.max <= edgeTolerance ? "near the upper edge of the standard band" : "above the standard band";
  }

  if (value - range.min <= edgeTolerance) return "near the lower edge of the standard band";
  if (range.max - value <= edgeTolerance) return "near the upper edge of the standard band";

  return "inside the standard band";
}

function summaryLevelStatus(value, target) {
  if (value === null || value === undefined || target === null || target === undefined) return "not available";
  const distance = value - target;
  if (Math.abs(distance) <= 5) return "near the target level";
  return distance > 0 ? "above the target level" : "below the target level";
}

function formatRatioPercent(value) {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toFixed(2)}%`;
}

function normalizePrd(value) {
  if (value === null || value === undefined) return null;
  return value > 10 ? value / 100 : value;
}

function formatPrd(value) {
  const normalized = normalizePrd(value);
  return normalized === null ? "—" : normalized.toFixed(3);
}

function sampleStrength(count) {
  if (!count) return "no usable sales sample";
  if (count >= 100) return "a large qualified-sales sample";
  if (count >= 30) return "a usable qualified-sales sample";
  if (count >= 15) return "a limited qualified-sales sample";
  return "a thin qualified-sales sample";
}

function countyDisplayNameFromData(data) {
  const name = `${data.parcel?.countyName ?? ""}`.trim().toLowerCase().replace(/\b\w/g, character => character.toUpperCase());
  return name ? `${name} County` : "the county";
}

function summaryCtlRows(ctlData, countyName) {
  const requested = `${countyName ?? ""}`.trim().toUpperCase();
  const countyRows = (ctlData?.counties || [])
    .filter(row => row.countyName === requested)
    .sort((a, b) => a.year - b.year);
  const statewideRows = (ctlData?.statewide || []).slice().sort((a, b) => a.year - b.year);

  return { countyRows, statewideRows };
}

function renderSummary(data, recordCard, summaryContext = {}) {
  const snapshot = getSnapshotHistory(data);
  const previousValue = getPreviousFinalValueHistory(data);
  const latestTax = getLatestFinalTaxHistory(data);
  const first = data.taxpayerHistory[0];
  const valueChangeFromPrior = previousValue?.assessedValue && snapshot.assessedValue
    ? (snapshot.assessedValue - previousValue.assessedValue) / previousValue.assessedValue
    : null;
  const valueChangeFromBase = first?.assessedValue && snapshot.assessedValue
    ? (snapshot.assessedValue - first.assessedValue) / first.assessedValue
    : null;
  const finalizedValueChangeFromBase = first?.assessedValue && previousValue?.assessedValue
    ? (previousValue.assessedValue - first.assessedValue) / first.assessedValue
    : null;
  const taxChangeFromBase = first?.taxes && latestTax?.taxes
    ? summaryPercentChange(latestTax.taxes, first.taxes)
    : null;
  const historyYearSpan = latestTax?.year && first?.year ? latestTax.year - first.year : null;
  const annualValueChange = summaryAnnualizedChange(previousValue?.assessedValue, first?.assessedValue, historyYearSpan);
  const annualTaxChange = summaryAnnualizedChange(latestTax?.taxes, first?.taxes, historyYearSpan);
  const firstEtr = calculateEtr(first);
  const latestEtr = calculateEtr(latestTax);
  const etrDecline = firstEtr && latestEtr
    ? Math.abs((latestEtr - firstEtr) / firstEtr)
    : null;

  const totalLevy = sumRates(data.latestFinalLevyComponents);
  const levyShare = description => {
    if (!totalLevy) return null;
    return (data.latestFinalLevyComponents.find(row => row.description === description)?.rate || 0) / totalLevy;
  };
  const schoolShare = levyShare("SCH 15 BEATRICE");
  const cityShare = levyShare("BEATRICE CITY");
  const countyShare = levyShare("COUNTY GENERAL");
  const otherShare = schoolShare === null || cityShare === null || countyShare === null
    ? null
    : Math.max(0, 1 - schoolShare - cityShare - countyShare);
  const majorLevyDescriptions = new Set(["SCH 15 BEATRICE", "BEATRICE CITY", "COUNTY GENERAL"]);
  const otherLevyGroups = [...new Set(data.latestFinalLevyComponents
    .filter(row => !majorLevyDescriptions.has(row.description))
    .map(row => row.group?.toLowerCase())
    .filter(Boolean))];
  const otherLevyText = otherLevyGroups.length
    ? otherLevyGroups.join(", ").replace(/, ([^,]*)$/, ", and $1")
    : "smaller authorities";
  const countyLabel = countyDisplayNameFromData(data);
  const { ctlData, ratioData, padRatioData, iaaoStandards } = summaryContext;
  const selectedClassKey = getSummaryDefaultClass(data, ratioData);
  const selectedClass = ratioData?.classes?.find(item => item.key === selectedClassKey) ?? ratioData?.classes?.[0];
  const latestCountyRatio = selectedClass?.records?.at(-1);
  const assessmentBands = getSummaryAssessmentBandConfig(selectedClass?.key ?? selectedClassKey, iaaoStandards);
  const countyTarget = getSummaryLovTarget(selectedClass?.key ?? selectedClassKey);
  const marketGroupId = extractSummaryValuationGroupId(recordCard);
  const selectedMarket = padRatioData?.valuationGroups?.find(group => String(group.group) === String(marketGroupId));
  const marketLabel = selectedMarket?.label || data.snapshotModel?.viewModels?.property?.valuationGroup || "the local valuation group";
  const { countyRows, statewideRows } = summaryCtlRows(ctlData, data.parcel.countyName);
  const countyCtlFirst = countyRows[0];
  const countyCtlLatest = countyRows.at(-1);
  const statewideCtlFirst = statewideRows[0];
  const statewideCtlLatest = statewideRows.at(-1);
  const countyValueGrowth = summaryPercentChange(countyCtlLatest?.totalValue, countyCtlFirst?.totalValue);
  const countyTaxGrowth = summaryPercentChange(countyCtlLatest?.taxesLevied, countyCtlFirst?.taxesLevied);
  const statewideValueGrowth = summaryPercentChange(statewideCtlLatest?.totalValue, statewideCtlFirst?.totalValue);
  const statewideTaxGrowth = summaryPercentChange(statewideCtlLatest?.taxesLevied, statewideCtlFirst?.taxesLevied);
  const currentAssessmentCopy = snapshot.assessedValue === null || snapshot.assessedValue === undefined
    ? `
      For <strong>${snapshot.year}</strong>, this property's assessed value has <strong>not been published yet</strong>.
      The latest finalized assessed value is <strong>${formatNullableMoney(previousValue.assessedValue)}</strong> for
      <strong>${previousValue.year}</strong>. The ${snapshot.year} tax bill is also <strong>not finalized yet</strong>;
      it will depend on later values, budgets, certified levies, credits, and exemptions.
    `
    : `
      For <strong>${snapshot.year}</strong>, this property's assessed value is <strong>${formatNullableMoney(snapshot.assessedValue)}</strong>,
      an increase of <strong>${formatNullablePercent(valueChangeFromPrior)}</strong> from the prior year's value of
      <strong>${formatNullableMoney(previousValue.assessedValue)}</strong>. The tax bill for this year is
      <strong>not finalized yet</strong>; it will depend on later budgets, certified levies, credits, and exemptions.
    `;

  const historyParagraph = `
    From <strong>${first.year}</strong> through <strong>${latestTax?.year}</strong>, this parcel's final assessed value moved from
    <strong>${formatNullableMoney(first.assessedValue)}</strong> to <strong>${formatNullableMoney(previousValue.assessedValue)}</strong>,
    up <strong>${formatNullablePercent(finalizedValueChangeFromBase)}</strong>. Net taxes moved from
    <strong>${formatNullableMoney(first.taxes, true)}</strong> to <strong>${formatNullableMoney(latestTax?.taxes, true)}</strong>,
    up <strong>${formatNullablePercent(taxChangeFromBase)}</strong>, while the effective tax rate moved from
    <strong>${formatNullablePercent(firstEtr)}</strong> to <strong>${formatNullablePercent(latestEtr)}</strong>.
  `;
  const levyParagraph = `
    In the latest final levy, about <strong>${formatNullablePercent(schoolShare)}</strong> of the tax dollars go to schools,
    <strong>${formatNullablePercent(cityShare)}</strong> to the city, and <strong>${formatNullablePercent(countyShare)}</strong>
    to the county. The remaining <strong>${formatNullablePercent(otherShare)}</strong> is distributed across ${escapeHtml(otherLevyText)}.
  `;
  const marketParagraph = selectedMarket ? `
    The local market read starts with <strong>${escapeHtml(marketLabel)}</strong>, which has
    <strong>${selectedMarket.count.toLocaleString()} qualified sales</strong>, ${sampleStrength(selectedMarket.count)}.
    The middle sale in that sample was assessed at <strong>${formatRatioPercent(selectedMarket.median)}</strong> of sale price
    (${summaryLevelStatus(selectedMarket.median, 100)}). Uniformity is <strong>${formatRatioPercent(selectedMarket.cod)}</strong>
    (${summaryRangeStatus(selectedMarket.cod, assessmentBands.cod)}), and price-level fairness is <strong>${formatPrd(selectedMarket.prd)}</strong>
    (${summaryPrdStatus(normalizePrd(selectedMarket.prd), assessmentBands.prd)}).
	    Together, these figures place the property in market context, but they are not a decision about this property by themselves.
  ` : `
	    The closest available local comparison group and sale-price bands offer context, not a final decision about this property.
  `;
  const countyStudyClass = selectedClass?.label?.toLowerCase() || "property";
  const countyParagraph = latestCountyRatio ? `
    The latest <strong>${escapeHtml(countyStudyClass)}</strong> sales study for <strong>${escapeHtml(countyLabel)}</strong> has
    <strong>${latestCountyRatio.sales.toLocaleString()} sales</strong>. The middle sale was assessed at
    <strong>${formatRatioPercent(latestCountyRatio.levelOfValue)}</strong> of sale price (${summaryLevelStatus(latestCountyRatio.levelOfValue, countyTarget)}).
    Uniformity is <strong>${formatRatioPercent(latestCountyRatio.cod)}</strong> (${summaryRangeStatus(latestCountyRatio.cod, assessmentBands.cod)}),
    price-level fairness is <strong>${formatPrd(latestCountyRatio.prd)}</strong> (${summaryPrdStatus(latestCountyRatio.prd, assessmentBands.prd)}),
    and reliability spread is <strong>${formatRatioPercent(latestCountyRatio.cov)}</strong>
    (${summaryRangeStatus(latestCountyRatio.cov, assessmentBands.cov, { tolerance: 0.5 })}).
  ` : `
	    County sales-study context appears later in the page. It helps explain the assessment environment, but it does not decide this parcel by itself.
  `;
  const stateParagraph = countyCtlLatest && statewideCtlLatest ? `
    On the state baseline, ${escapeHtml(countyLabel)}'s latest CTL average tax rate is
    <strong>${formatNullablePercent(countyCtlLatest.averageTaxRate)}</strong> versus Nebraska's
    <strong>${formatNullablePercent(statewideCtlLatest.averageTaxRate)}</strong>, so the county rate is below the statewide average.
    Since <strong>${countyCtlFirst.year}</strong>, county certified value is up <strong>${formatNullablePercent(countyValueGrowth)}</strong>
    and taxes levied are up <strong>${formatNullablePercent(countyTaxGrowth)}</strong>; statewide, value is up
    <strong>${formatNullablePercent(statewideValueGrowth)}</strong> and taxes levied are up <strong>${formatNullablePercent(statewideTaxGrowth)}</strong>.
  ` : `
    Statewide CTL context is available deeper in the page to compare county value growth, taxes levied, and average tax rates against Nebraska.
  `;
  const annualizedParagraph = `
    For this parcel, the available <strong>${first.year}-${latestTax?.year}</strong> record works out to assessed value
    <strong>${annualizedChangeText(annualValueChange)}</strong> and net taxes <strong>${annualizedChangeText(annualTaxChange)}</strong>.
    More detail is available in the value and tax timeline in the next step.
  `;

  document.getElementById("summaryText").innerHTML = `
    <p class="mb-4 text-sm leading-6 text-slate-600">
      A plain-language read of the property record, value movement, tax context, and market signals available in the current records.
    </p>

    <div class="focus-card mb-4">
      <p class="pending-status-heading mb-1 text-xs font-semibold uppercase tracking-wide">Current status</p>
      <p class="leading-7 text-slate-700">
        ${currentAssessmentCopy}
      </p>
    </div>

    <div class="express-summary-story">
      <p>${historyParagraph}</p>
      <p>${levyParagraph}</p>
      <p>${marketParagraph}</p>
      <p>${countyParagraph}</p>
      <p>${stateParagraph}</p>
      <p>${annualizedParagraph}</p>
    </div>

    <p class="summary-inline-next">
      If something in the property details appears inaccurate or incomplete, you may want to open a record review request.
    </p>
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

function renderProcessTimeline(calendar) {
  const currentStage = document.querySelector("[data-current-stage]");
  const sourceNote = document.querySelector("[data-calendar-source]");
  const timeline = document.getElementById("processTimeline");

  if (currentStage) {
    currentStage.textContent = `Current stage: ${getCurrentStageText(calendar)}`;
  }

  if (sourceNote) {
    sourceNote.textContent = `Source: 2025 Nebraska Property Assessment Division Main Property Assessment and Taxation Calendar${calendar.sourceRevision ? `, ${calendar.sourceRevision}` : ""}. Filing dates follow the Nebraska legal-date rule for weekends and legal holidays.`;
  }

  if (!timeline) return;

  timeline.innerHTML = calendar.stages.map((step, index) => {
    const active = isStageActive(step);
    const past = isStagePast(step);
    const hasDetail = step.sourceEvents?.length || step.id === "protest";
    const cardState = active ? "timeline-stage-card-active" : past ? "timeline-stage-card-past" : "";
    const markerState = active ? "active" : past ? "past" : "future";

    return `
      <div class="timeline-stage-card ${cardState} group relative flex h-full flex-col rounded-2xl p-4 transition duration-200 ${active ? "z-10 scale-[1.03]" : ""}" tabindex="0">
        <div class="mb-3 flex items-center gap-2">
          <span class="timeline-stage-marker timeline-stage-marker-${markerState}">${index + 1}</span>
          ${active ? `<span class="current-stage-pill">Now</span>` : past ? `<span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">Passed</span>` : ""}
        </div>
        <p class="font-semibold ${past && !active ? "text-slate-500" : "text-slate-700"}">${escapeHtml(step.label)}</p>
        <p class="mt-1 text-xs font-semibold uppercase tracking-wide ${past && !active ? "text-slate-400" : "text-slate-500"}">${escapeHtml(step.timing)}</p>
        <p class="mt-2 flex-1 text-sm leading-6 ${past && !active ? "text-slate-500" : "text-slate-600"}">${escapeHtml(step.description)}</p>
        ${hasDetail ? `
          <div class="mt-auto border-t border-slate-200 pt-3 text-center">
            <button type="button" data-calendar-stage="${escapeHtml(step.id)}" class="secondary-link-button">
              Learn More
            </button>
          </div>
        ` : ""}
      </div>
    `;
  }).join("");

  initCalendarStageModal(calendar);
}

function calendarStageDetailHtml(stage) {
  const sourceEvents = stage.id === "protest"
    ? (stage.sourceEvents || []).slice().sort((a, b) => {
      const priority = event => /deadline.*file|file.*valuation protest/i.test(event.duty) ? 1 : /hearing|review|deciding/i.test(event.duty) ? 2 : 0;
      return priority(a) - priority(b);
    })
    : stage.sourceEvents || [];

  return `
    <div class="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p class="text-sm leading-6 text-slate-600">${escapeHtml(stage.description)}</p>
    </div>
    ${sourceEvents.length ? `
      <div class="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Calendar milestones</p>
        <ul class="mt-3 space-y-3 text-sm leading-6 text-slate-600">
          ${sourceEvents.map(event => `
            <li class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <span class="block font-semibold text-slate-700">${escapeHtml(event.timing)}</span>
              <span>${escapeHtml(event.duty)}</span>
              ${event.authority?.length ? `<span class="mt-1 block text-xs text-slate-500">${escapeHtml(event.authority.join(", "))}</span>` : ""}
            </li>
          `).join("")}
        </ul>
      </div>
    ` : ""}
    ${stage.id === "protest" ? `
      <div class="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 ring-1 ring-slate-200">
        <p>The Resources tab brings calendar context, basic comparable-property organization, the worksheet, and the prepared Form 422 into one optional reference area. Requested valuation, reasons, signature, and filing responsibility remain with the filer.</p>
        <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" data-calendar-review-record class="inline-flex justify-center rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
            Open Resources
          </button>
          <button type="button" data-calendar-prepare-form422 class="inline-flex justify-center rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
            Go to Form 422
          </button>
        </div>
      </div>
    ` : ""}
  `;
}

function initCalendarStageModal(calendar) {
  const modal = document.getElementById("calendarStageModal");
  const title = document.getElementById("calendarStageTitle");
  const timing = document.getElementById("calendarStageTiming");
  const content = document.getElementById("calendarStageModalContent");
  const closeButtons = document.querySelectorAll("[data-close-calendar-stage]");

  if (!modal || !title || !timing || !content) return;

  function close() {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
  }

  function open(stage) {
    title.textContent = stage.label;
    timing.textContent = stage.timing;
    content.innerHTML = calendarStageDetailHtml(stage);
    content.querySelector("[data-calendar-review-record]")?.addEventListener("click", () => {
      close();
      navigateToProtestPreparation("#protest-preparation");
    });
    content.querySelector("[data-calendar-prepare-form422]")?.addEventListener("click", () => {
      close();
      navigateToProtestPreparation("#form422-section");
    });
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
  }

  document.querySelectorAll("[data-calendar-stage]").forEach(button => {
    button.addEventListener("click", () => {
      const stage = calendar.stages.find(item => item.id === button.dataset.calendarStage);
      if (stage) open(stage);
    });
  });

  modal.addEventListener("click", close);
  modal.querySelector("[role='dialog']").addEventListener("click", event => event.stopPropagation());
  closeButtons.forEach(button => button.addEventListener("click", close));

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") close();
  });
}

function renderHistoryTable(data, recordCard) {
  document.getElementById("historyRows").innerHTML = data.taxpayerHistory.slice().reverse().map((row, index) => {
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
  return `
    <div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</p>
      <p class="mt-1 text-lg font-bold text-slate-700">${value}</p>
      <p class="mt-1 text-sm font-medium text-slate-600">${note}</p>
      <p class="mt-1 text-xs leading-5 text-slate-500">${range}</p>
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
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent movement</p>
      <div class="mt-2 grid gap-3 md:grid-cols-3">
        ${recentCards.map(movementCard).join("")}
      </div>
    </section>
    <section class="border-t border-slate-200 pt-4">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Your property historically</p>
      <p class="mt-1 text-xs leading-5 text-slate-500">Longer-range movement from ${firstValue.year}-${lastValue.year}. Tax and ETR movement use finalized tax years only.</p>
      <div class="mt-2 grid gap-3 md:grid-cols-3">
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

  container.innerHTML = years.map(year => {
    const levyRow = levyByYear.get(year);
    const priorLevyRow = levyByYear.get(year - 1);
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
        <td class="px-2 py-2 text-right font-medium sm:px-3">${formatNullableLevy(levyRow?.levy)}</td>
        <td class="px-2 py-2 text-center sm:px-3">${levyMovementPill(levyRow, priorLevyRow)}</td>
        <td class="px-2 py-2 text-right sm:px-3">${formatNullableMoney(statement?.grossTaxAmount, true)}</td>
        <td class="px-2 py-2 text-right sm:px-3">${statement ? formatNullableMoney(statementTotalCredits(statement), true) : "—"}</td>
        <td class="px-2 py-2 text-right font-semibold text-slate-700 sm:px-3">${formatNullableMoney(netTaxes, true)}</td>
        <td class="px-2 py-2 text-right font-semibold text-slate-700 sm:px-3">${formatNullablePercent(effectiveTaxRate)}</td>
      </tr>
    `;
  }).join("");
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

export function renderTaxDistrictAuthorities(data, taxDistrictAuthorities) {
  const summary = document.getElementById("taxDistrictAuthoritySummary");
  if (!summary) return;

  const district = taxDistrictAuthorities?.districts?.find(item =>
    String(item.taxDistrict) === String(data.parcel.taxDistrict)
  );
  const authorities = district?.authorities ?? data.latestFinalLevyComponents.map(row => ({
    description: row.description,
    category: row.group,
    levy: row.rate
  }));
  const total = authorities.reduce((sum, row) => sum + row.levy, 0);
  const districtDescription = district?.districtDescription ?? null;
  const districtDescriptionNote = districtDescription
    ? `Report label: ${districtDescription}`
    : "No district description found in the authority report.";

  summary.innerHTML = [
    {
      label: "Tax district",
      value: data.parcel.taxDistrict,
      note: districtDescriptionNote
    },
    {
      label: "Authorities",
      value: authorities.length,
	      note: district ? "Matched to this parcel's tax district." : "Using the most recent finalized tax breakdown."
    },
    {
      label: "Total levy",
      value: formatNullableLevy(district?.districtLevy ?? total),
	      note: "Combined rate for the listed taxing bodies."
    },
    {
      label: "Source year",
      value: taxDistrictAuthorities?.source?.taxYear ?? data.latestFinalTaxYear,
      note: "District Authority Report."
    }
  ].map(card => `
    <div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${escapeHtml(card.label)}</p>
      <p class="mt-1 text-lg font-bold text-slate-700">${escapeHtml(card.value)}</p>
      <p class="mt-1 text-xs leading-5 text-slate-500">${escapeHtml(card.note)}</p>
    </div>
  `).join("");

  const source = document.getElementById("taxDistrictAuthoritySource");
  if (source) {
    source.textContent = taxDistrictAuthorities?.source
      ? `Source: ${taxDistrictAuthorities.source.title}, printed ${new Date(taxDistrictAuthorities.source.printedAt).toLocaleDateString("en-US")}.`
      : propertyRecordSourceText(data);
  }
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
