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

const toneClass = {
  blue: "text-blue-700",
  emerald: "text-emerald-700",
  orange: "text-orange-400"
};

export function renderPage(data, imageModal, calendar) {
  renderPageTitle();
  renderHeader(data, imageModal);
  renderHeaderTimeline(calendar);
  renderPropertyDetails(data);
  initReportErrorModal();
  renderSummary(data);
  initJumpLinks();
  renderProcessTimeline(calendar);
  renderHistoryTable(data);
  renderEtrSummary(data);
  renderLevyHistoryTable(data);
  renderLevyTable(data);
  renderComparables(data);
  renderSources(data);
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

function getCurrentStageText(calendar) {
  const activeStages = getActiveStages(calendar);

  if (!activeStages.length) {
    return "Between calendar stages";
  }

  return activeStages.map(stage => stage.label).join(" + ");
}

function renderPageTitle() {
  const title = document.getElementById("pageTitle");

  title.innerHTML = `
    <h1 class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
      Property Value & Tax Snapshot
    </h1>

    <p class="mt-2 text-base text-slate-600">
      Assessment-year property information, taxes, levies, and market context in one unified view.
    </p>
  `;
}

function renderHeader(data, imageModal) {
  const snapshot = getSnapshotHistory(data);
  const latestFinal = getLatestFinalTaxHistory(data);
  const header = document.getElementById("pageHeader");

  header.innerHTML = `
    <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">${data.snapshotYear} Property Snapshot</p>
        <h1 class="mt-1 text-3xl font-bold tracking-tight text-slate-950">${data.parcel.situsAddress}</h1>
        <p class="mt-2 text-base text-slate-600">${data.parcel.accountType} - ${data.parcel.schoolDistrict} - ${data.classification.location}</p>
      </div>

      <div class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:grid-cols-2">
        ${metric("Parcel ID", data.parcel.parcelId)}
        ${metric("Tax District", data.parcel.taxDistrict)}
        ${metric(`${data.snapshotYear} Assessed Value`, formatNullableMoney(snapshot.assessedValue), "blue")}
        ${metric(`${latestFinal.year} Tax Bill`, formatNullableMoney(latestFinal.taxes, true), "emerald")}
      </div>

      <div class="flex items-center justify-center gap-4">
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

function renderHeaderTimeline(calendar) {
  document.getElementById("headerTimeline").innerHTML = `
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="min-w-0">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Nebraska assessment calendar</p>
        <p class="mt-1 text-sm text-slate-600">Current stage: <strong class="text-blue-700">${getCurrentStageText(calendar)}</strong></p>
      </div>

      <div class="relative flex flex-1 items-start justify-between gap-2">
        <div class="absolute left-0 right-0 top-2.5 h-0.5 bg-slate-200"></div>
        ${calendar.stages.map(stage => {
          const active = isStageActive(stage);
          const past = isStagePast(stage);

          return `
            <a href="#tax-cycle" data-jump-target="tax-cycle" class="relative z-10 flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" aria-label="View full ${stage.label} timeline details">
              <span class="h-5 w-5 rounded-full transition ${active ? "bg-blue-600 ring-4 ring-blue-100" : past ? "bg-slate-200 ring-2 ring-slate-300" : "bg-white ring-2 ring-slate-300"}"></span>
              <span class="text-[11px] transition ${active ? "font-bold text-blue-700" : past ? "font-medium text-slate-400" : "font-medium text-slate-500"}">${stage.label}</span>
            </a>
          `;
        }).join("")}
      </div>
    </div>
  `;
}


function metric(label, value, tone = "slate") {
  const color = {
    slate: "bg-slate-50 ring-slate-200 text-slate-500",
    blue: "bg-blue-50 ring-blue-200 text-blue-700",
    emerald: "bg-emerald-50 ring-emerald-200 text-emerald-700"
  }[tone];

  return `
    <div class="rounded-xl p-3 ring-1 ${color}">
      <p>${label}</p>
      <p class="font-semibold text-slate-950">${value}</p>
      ${tone === "blue" ? `<p class="mt-1 text-[11px] font-medium uppercase tracking-wide">Current assessment year</p>` : ""}
      ${tone === "emerald" ? `<p class="mt-1 text-[11px] font-medium uppercase tracking-wide">Most recent finalized taxes</p>` : ""}
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

function renderPropertyDetails(data) {
  const details = [
    ["Owner", data.parcel.owner],
    ["Situs address", data.parcel.situsAddress],
    ["Legal description", data.parcel.legalDescription],
    ["Status", data.classification.status],
    ["Zoning", data.classification.zoning],
    ["Lot size", data.classification.lotSize],
    ["Year built", data.residential.yearBuilt],
    ["Style", data.residential.style],
    ["Building size", `${data.residential.buildingSize.toLocaleString()} sq. ft.`],
    ["Basement size", `${data.residential.basementSize.toLocaleString()} sq. ft.`],
    ["Bedrooms / bathrooms", `${data.residential.bedrooms} / ${data.residential.bathrooms}`],
    ["Quality / condition", `${data.residential.quality} / ${data.residential.condition}`],
    ["Garage", `${data.residential.garage1}; ${data.residential.garage2}`],
    ["Exterior", data.residential.exterior]
  ];

  document.getElementById("propertyDetails").innerHTML = [
    assessedValuesData(data),
    classificationDetails(data),
    propertyNotes(data),
    landInformation(data),
    dwellingData(data),
    details.map(([label, value]) => `
      <div class="details-card">
        <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</dt>
        <dd class="mt-1 text-sm font-medium text-slate-900">${value}</dd>
      </div>
    `).join(""),
    outbuildingData(data),
    reportErrorLink()
  ].join("");
}

function reportErrorLink() {
  return `
    <div class="sm:col-span-2 px-1 pt-1 text-right text-xs text-slate-500">
      <button type="button" data-report-error class="underline decoration-slate-300 underline-offset-4 transition hover:text-slate-700">
        Report an error
      </button>
    </div>
  `;
}

function initReportErrorModal() {
  const modal = document.getElementById("reportErrorModal");
  const trigger = document.querySelector("[data-report-error]");
  const closeButtons = document.querySelectorAll("[data-close-report-error]");

  if (!modal || !trigger) return;

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

  trigger.addEventListener("click", open);
  modal.addEventListener("click", close);
  modal.querySelector("[role='dialog']").addEventListener("click", event => event.stopPropagation());
  closeButtons.forEach(button => button.addEventListener("click", close));

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") close();
  });
}

function disclosure(title, meta, content) {
  return `
    <details class="sm:col-span-2 rounded-xl bg-white ring-1 ring-slate-200">
      <summary class="cursor-pointer list-none rounded-xl bg-slate-50 px-4 py-3 font-semibold text-slate-950">
        <div class="flex items-center justify-between gap-3">
          <span>${title}</span>
          <span class="flex shrink-0 items-center gap-2 text-sm">
            <span class="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">${meta}</span>
            <span class="text-slate-500">Click to expand</span>
          </span>
        </div>
      </summary>
      <div class="table-shell">${content}</div>
    </details>
  `;
}

function classificationDetails(data) {
  return disclosure("Property classification", "6 fields", `
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

  return disclosure("Property notes", meta, `
    <table class="min-w-full divide-y divide-slate-200 text-sm">
      <thead class="bg-slate-50"><tr><th class="px-3 py-2 text-left font-semibold">Date</th><th class="px-3 py-2 text-left font-semibold">Note</th></tr></thead>
      <tbody class="divide-y divide-slate-200">${rows}</tbody>
    </table>
  `);
}

function landInformation(data) {
  const meta = data.landInformation.length === 1 ? "1 land record" : `${data.landInformation.length} land records`;

  return disclosure("Land information", meta, `
    <table class="min-w-full divide-y divide-slate-200 text-sm">
      <thead class="bg-slate-50">
        <tr><th class="px-3 py-2 text-left font-semibold">Lot width (ft)</th><th class="px-3 py-2 text-left font-semibold">Lot depth (ft)</th><th class="px-3 py-2 text-left font-semibold">Description</th><th class="px-3 py-2 text-right font-semibold">Lot size</th></tr>
      </thead>
      <tbody class="divide-y divide-slate-200 [&>tr:nth-child(even)]:bg-slate-50">
        ${data.landInformation.map(row => `
          <tr>
            <td class="px-3 py-2">${row.lotWidthFeet}</td>
            <td class="px-3 py-2">${row.lotDepthFeet}</td>
            <td class="px-3 py-2">${row.description}</td>
            <td class="px-3 py-2 text-right">${row.lotSize}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `);
}

function dwellingData(data) {
  const totalValue = data.dwellingData.reduce((sum, row) => sum + row.value, 0);
  const itemLabel = data.dwellingData.length === 1 ? "item" : "items";

  return disclosure("Dwelling data", `${data.dwellingData.length} ${itemLabel} · ${money.format(totalValue)}`, `
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

  return disclosure("Outbuilding data", meta, `
    <table class="min-w-full divide-y divide-slate-200 text-sm">
      <thead class="bg-slate-50">
        <tr><th class="px-3 py-2 text-left font-semibold">Description</th><th class="px-3 py-2 text-right font-semibold">Units</th><th class="px-3 py-2 text-right font-semibold">Year Built</th><th class="px-3 py-2 text-right font-semibold">Cost</th></tr>
      </thead>
      <tbody class="divide-y divide-slate-200">${rows}</tbody>
    </table>
  `);
}

function renderSummary(data) {
  const snapshot = getSnapshotHistory(data);
  const latestFinal = getLatestFinalTaxHistory(data);
  const previousValue = getPreviousFinalValueHistory(data);
  const first = data.taxpayerHistory[0];
  const finalTaxRows = data.taxpayerHistory.filter(row => row.taxes !== null && row.taxes !== undefined);
  const peakTaxYear = finalTaxRows.reduce((max, row) => row.taxes > max.taxes ? row : max, finalTaxRows[0]);
  const valueChangeFromPrior = previousValue?.assessedValue && snapshot.assessedValue
    ? (snapshot.assessedValue - previousValue.assessedValue) / previousValue.assessedValue
    : null;
  const valueChangeFromBase = first?.assessedValue && snapshot.assessedValue
    ? (snapshot.assessedValue - first.assessedValue) / first.assessedValue
    : null;

  const totalLevy = sumRates(data.latestFinalLevyComponents);
  const schoolShare = data.latestFinalLevyComponents.find(row => row.description === "SCH 15 BEATRICE")?.rate / totalLevy;
  const cityShare = data.latestFinalLevyComponents.find(row => row.description === "BEATRICE CITY")?.rate / totalLevy;
  const countyShare = data.latestFinalLevyComponents.find(row => row.description === "COUNTY GENERAL")?.rate / totalLevy;
  const otherShare = 1 - schoolShare - cityShare - countyShare;

  document.getElementById("summaryText").innerHTML = `
    <div class="focus-card mb-4">
      <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-700">Current assessment status</p>
      <p class="leading-7 text-slate-800">
        For <strong>${snapshot.year}</strong>, this property's assessed value is <strong>${formatNullableMoney(snapshot.assessedValue)}</strong>,
        an increase of <strong>${formatNullablePercent(valueChangeFromPrior)}</strong> from the prior year's value of
        <strong>${formatNullableMoney(previousValue.assessedValue)}</strong>. The tax bill for this year is
        <strong>not finalized yet</strong>; it will depend on later budgets, certified levies, credits, and exemptions.
      </p>
    </div>

    <p>This snapshot separates <strong>current assessed value</strong> from <strong>finalized tax information</strong> so you can see what is known now and what is still pending.</p>
    <p class="mb-4 mt-4 leading-7">Since ${first.year}, assessed value has increased by <strong>${formatNullablePercent(valueChangeFromBase)}</strong>. During the same period, the property's <strong>effective tax rate</strong> declined from <strong>1.98%</strong> to <strong>1.22%</strong>, a reduction of roughly <strong>38%</strong>.</p>
    <p class="mb-4 leading-7">The most recent finalized tax bill was <strong>${formatNullableMoney(latestFinal.taxes, true)}</strong> in ${latestFinal.year}. Taxes peaked at <strong>${formatNullableMoney(peakTaxYear.taxes, true)}</strong> in ${peakTaxYear.year}, then moved lower even while assessed value continued rising.</p>

    <div class="mb-4 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Latest finalized levy distribution</p>
      <ul class="space-y-1 text-sm leading-6">
        <li><strong>Schools:</strong> ${percent.format(schoolShare)}</li>
        <li><strong>City:</strong> ${percent.format(cityShare)}</li>
        <li><strong>County:</strong> ${percent.format(countyShare)}</li>
        <li><strong>Other:</strong> ${percent.format(otherShare)}</li>
      </ul>
    </div>

    <div class="rounded-xl bg-white p-3 ring-1 ring-slate-200">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Jump to details</p>
      <div class="flex flex-wrap gap-2">
        ${[
          ["#tax-cycle", "Tax cycle"],
          ["#value-history", "Value & tax history"],
          ["#indexed-trends", "Indexed trends"],
          ["#etr-trend", "ETR trend"],
          ["#levy-history", "Levy history"],
          ["#tax-distribution", "Tax distribution"],
          ["#comparables", "Comparable sales"]
        ].map(([href, label]) => `<a href="${href}" data-jump-target="${href.slice(1)}" class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400">${label}</a>`).join("")}
      </div>
    </div>
  `;
}

function stageLink(stage, active) {
  if (!active || !stage.link?.url) return "";

  return [
    `<a href="${stage.link.url}" target="_blank" rel="noreferrer" class="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50">`,
    stage.link.label || "Open stage link",
    `</a>`
  ].join("");
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
  document.getElementById("processTimeline").innerHTML = calendar.stages.map((step, index) => {
    const active = isStageActive(step);
    const past = isStagePast(step);

    return `
      <div class="group relative rounded-2xl p-4 ring-1 transition duration-200 ${active ? "z-10 scale-[1.03] bg-blue-50 shadow-md ring-blue-300" : past ? "bg-slate-50/60 opacity-70 ring-slate-200" : "bg-slate-50 ring-slate-200"}" tabindex="0">
        <div class="mb-3 flex items-center gap-2">
          <span class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${active ? "bg-blue-600 text-white" : past ? "bg-slate-200 text-slate-500 ring-1 ring-slate-300" : "bg-white text-slate-600 ring-1 ring-slate-200"}">${index + 1}</span>
          ${active ? `<span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Now</span>` : past ? `<span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">Passed</span>` : ""}
        </div>
        <p class="font-semibold ${past && !active ? "text-slate-500" : "text-slate-950"}">${step.label}</p>
        <p class="mt-1 text-xs font-semibold uppercase tracking-wide ${past && !active ? "text-slate-400" : "text-slate-500"}">${step.timing}</p>
        <p class="mt-2 text-sm leading-6 ${past && !active ? "text-slate-500" : "text-slate-600"}">${step.description}</p>
        ${step.id === "protest" ? `
          <div class="pointer-events-none absolute left-3 right-3 top-full z-20 mt-2 rounded-xl bg-slate-900 px-3 py-2 text-xs leading-5 text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus:opacity-100">
            The Nebraska Form 422 link will appear here during the protest window, June 1 through June 30.
          </div>
        ` : ""}
        ${stageLink(step, active)}
      </div>
    `;
  }).join("");
}

function renderHistoryTable(data) {
  document.getElementById("historyRows").innerHTML = data.taxpayerHistory.slice().reverse().map((row, index) => {
    const etr = calculateEtr(row);
    const isCurrentNotice = row.status === "assessment_notice";

    return `
      <tr class="${isCurrentNotice ? "bg-blue-50/70" : index % 2 === 0 ? "bg-white" : "bg-slate-50"}">
        <td class="px-3 py-2 font-medium">
          <div class="flex items-center gap-2">
            <span>${row.year}</span>
            ${isCurrentNotice ? `<span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Notice</span>` : ""}
          </div>
        </td>
        <td class="px-3 py-2 text-right">${formatNullableMoney(row.assessedValue)}</td>
        <td class="px-3 py-2 text-right">${row.taxes === null ? "Pending" : formatNullableMoney(row.taxes, true)}</td>
        <td class="px-3 py-2 text-right font-medium">${etr === null ? "Pending" : formatNullablePercent(etr)}</td>
      </tr>
    `;
  }).join("");
}

function assessedValuesData(data) {
  const rows = (data.assessedValueBreakdown || []).slice().sort((a, b) => b.year - a.year);
  const currentRow = rows[0];
  const rowLabel = rows.length === 1 ? "year" : "years";

  return disclosure("Assessed values", `${rows.length} ${rowLabel} · ${formatNullableMoney(currentRow?.total)}`, `
    <table class="min-w-full divide-y divide-slate-200 text-sm">
      <thead class="bg-slate-50">
        <tr>
          <th class="px-3 py-2 text-left font-semibold">Year</th>
          <th class="px-3 py-2 text-right font-semibold">Improvements (Dwelling)</th>
          <th class="px-3 py-2 text-right font-semibold">Land</th>
          <th class="px-3 py-2 text-right font-semibold">Outbuilding</th>
          <th class="px-3 py-2 text-right font-semibold">Total</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-200 bg-white">
        ${rows.map((row, index) => `
          <tr class="${index % 2 === 0 ? "bg-white" : "bg-slate-50"}">
            <td class="px-3 py-2 font-medium">${row.year}</td>
            <td class="px-3 py-2 text-right">${formatNullableMoney(row.dwelling)}</td>
            <td class="px-3 py-2 text-right">${formatNullableMoney(row.land)}</td>
            <td class="px-3 py-2 text-right">${formatNullableMoney(row.outbuilding)}</td>
            <td class="px-3 py-2 text-right font-semibold">${formatNullableMoney(row.total)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `);
}

function renderEtrSummary(data) {
  const finalRows = data.taxpayerHistory.filter(row => row.taxes !== null);
  const first = finalRows[0];
  const latest = finalRows.at(-1);
  const firstEtr = calculateEtr(first);
  const latestEtr = calculateEtr(latest);
  const etrReduction = firstEtr && latestEtr ? (firstEtr - latestEtr) / firstEtr : null;
  const valueIncrease = first.assessedValue && latest.assessedValue
    ? (latest.assessedValue - first.assessedValue) / first.assessedValue
    : null;

  document.getElementById("etrSummary").innerHTML = `
    <p class="text-sm leading-7 text-slate-700">
      From ${first.year} to ${latest.year}, this property's effective tax rate declined from
      <strong>${formatNullablePercent(firstEtr)}</strong> to <strong>${formatNullablePercent(latestEtr)}</strong>,
      a reduction of roughly <strong>${Math.round(etrReduction * 100)}%</strong>.
      <br><br>
      During the same period, assessed value increased by roughly <strong>${Math.round(valueIncrease * 100)}%</strong>.
    </p>
  `;
}

function renderLevyHistoryTable(data) {
  const sortedRows = data.districtLevyHistory.slice().sort((a, b) => b.year - a.year);

  document.getElementById("levyHistoryRows").innerHTML = sortedRows.map(row => {
    const priorRow = data.districtLevyHistory.find(item => item.year === row.year - 1);
    let movementHtml = `<span class="text-slate-400">—</span>`;

    if (row.levy !== null && row.levy !== undefined && priorRow?.levy !== null && priorRow?.levy !== undefined) {
      const change = ((row.levy - priorRow.levy) / priorRow.levy) * 100;
      const isDecrease = change < 0;
      const isIncrease = change > 0;
      const arrow = isDecrease ? "↓" : isIncrease ? "↑" : "→";
      const colorClass = isDecrease
        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
        : isIncrease
          ? "bg-rose-50 text-rose-700 ring-rose-200"
          : "bg-slate-50 text-slate-700 ring-slate-200";

      movementHtml = `<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${colorClass}">${arrow} ${Math.abs(change).toFixed(2)}%</span>`;
    }

    return `
      <tr>
        <td class="px-3 py-2 font-medium">${row.year}</td>
        <td class="px-3 py-2 text-center font-medium">${formatNullableLevy(row.levy)}</td>
        <td class="px-3 py-2"><div class="flex items-center justify-center gap-2">${movementHtml}</div></td>
        <td class="px-3 py-2 leading-6 text-slate-600">${buildLevyMovementNote(data, row, priorRow)}</td>
      </tr>
    `;
  }).join("");
}

function buildLevyMovementNote(data, row, priorRow) {
  const valueRow = data.taxpayerHistory.find(item => item.year === row.year);
  const priorValueRow = data.taxpayerHistory.find(item => item.year === row.year - 1);

  if (!valueRow || !priorValueRow) return row.note || "Baseline year for this levy history series.";

  const valueChange = valueRow.assessedValue && priorValueRow.assessedValue
    ? (valueRow.assessedValue - priorValueRow.assessedValue) / priorValueRow.assessedValue
    : null;
  const levyChange = row.levy !== null && row.levy !== undefined && priorRow?.levy !== null && priorRow?.levy !== undefined
    ? (row.levy - priorRow.levy) / priorRow.levy
    : null;
  const taxChange = valueRow.taxes && priorValueRow.taxes
    ? (valueRow.taxes - priorValueRow.taxes) / priorValueRow.taxes
    : null;

  if (row.status === "pending") {
    return `Your ${row.year} value is up ${formatNullablePercent(valueChange)}, but the levy and tax bill are not finalized yet.`;
  }

  if (levyChange === null) {
    return `Your value changed by ${formatNullablePercent(valueChange)}. Levy comparison is not available for this year.`;
  }

  const levyDirection = levyChange < 0 ? "down" : levyChange > 0 ? "up" : "unchanged";

  if (taxChange === null) {
    return `Your value changed by ${formatNullablePercent(valueChange)}, while the levy went ${levyDirection} ${formatNullablePercent(Math.abs(levyChange))}. Tax bill data is not available for this year.`;
  }

  const taxDirection = taxChange < 0 ? "decrease" : taxChange > 0 ? "increase" : "change";
  return `Your value changed by ${formatNullablePercent(valueChange)}, the levy went ${levyDirection} ${formatNullablePercent(Math.abs(levyChange))}, resulting in a ${formatNullablePercent(Math.abs(taxChange))} tax ${taxDirection}.`;
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
    <tr class="border-t-2 border-slate-300 bg-slate-100 font-semibold">
      <td class="px-3 py-3 text-slate-950">Total levy</td>
      <td class="px-3 py-3 text-right text-slate-950">${total.toFixed(8)}</td>
      <td class="px-3 py-3 text-right text-slate-950">100.00%</td>
      <td class="px-3 py-3 text-right text-slate-950">${moneyCents.format(totalTaxPer100k)}</td>
    </tr>
  `;

  document.getElementById("levyRows").innerHTML = dataRows + totalRow;
}

function renderComparables(data) {
  document.getElementById("comparableCards").innerHTML = data.comparables.map(item => {
    const isSubject = item.accent === "subject";

    return `
      <article class="rounded-2xl ${isSubject ? "bg-blue-50 ring-blue-200" : "bg-slate-50 ring-slate-200"} p-4 ring-1">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide ${isSubject ? "text-blue-700" : "text-slate-500"}">${item.type}</p>
        <img src="${item.image}" alt="${item.type} photo" class="h-32 w-full rounded-xl object-cover ring-1 ${isSubject ? "ring-blue-200" : "ring-slate-200"}" />
        <h3 class="mt-3 text-base font-bold text-slate-950">${item.title}</h3>
        <p class="text-sm text-slate-600">${item.subtitle}</p>
        <dl class="mt-4 space-y-2 text-sm">
          ${item.metrics.map(metric => `
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">${metric.label}</dt>
              <dd class="font-semibold ${metric.tone ? toneClass[metric.tone] : "text-slate-900"}">${metric.value}</dd>
            </div>
          `).join("")}
        </dl>
      </article>
    `;
  }).join("");
}

function renderSources(data) {
  document.getElementById("sourceCards").innerHTML = data.sources.map(source => `
    <div class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${source.label}</p>
      <p class="mt-1 font-medium text-slate-900">${source.value}</p>
    </div>
  `).join("");
}
