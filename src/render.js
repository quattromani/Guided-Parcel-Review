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

const discrepancyChoices = [
  ["confirmed", "Confirmed"],
  ["incorrect", "Incorrect"],
  ["unsure", "?"]
];

const viewHeaderContent = {
  property: {
    eyebrow: "Gage County, Nebraska",
    title: "Property Value & Tax Snapshot",
    description: "Assessment-year property information, taxes, levies, and market context in one unified view.",
    imageAlt: "Map of Nebraska highlighting Gage County"
  },
  market: {
    eyebrow: "Beatrice Market Area",
    title: "Market Area Value & Tax View",
    description: "Neighborhood and tax-district context for comparing property value movement, tax movement, and effective tax rate trends.",
    imageAlt: "Map of Nebraska highlighting the local market area"
  },
  county: {
    eyebrow: "Gage County, Nebraska",
    title: "County Value & Tax View",
    description: "Countywide value, levy, and effective tax rate context for comparing local movement against broader assessment patterns.",
    imageAlt: "Map of Nebraska highlighting Gage County"
  },
  statewide: {
    eyebrow: "Nebraska Statewide Context",
    title: "Statewide Value & Tax View",
    description: "A statewide comparison frame for understanding whether local value and tax movement appears typical or unusual.",
    imageAlt: "Map of Nebraska"
  },
  demographics: {
    eyebrow: "Gage County, Nebraska",
    title: "Demographics & County Profile",
    description: "Population, housing, economy, and valuation-base context for understanding the county behind the assessment data.",
    imageAlt: "Map of Nebraska highlighting Gage County"
  }
};

export function renderPage(data, imageModal, calendar, recordCard) {
  renderViewHeader("property");
  renderHeader(data, imageModal);
  renderHeaderTimeline(calendar);
  renderPropertyDetails(data, recordCard);
  renderDiscrepancyForm(data, recordCard);
  initReportErrorModal(data);
  renderSummary(data);
  initJumpLinks();
  renderProcessTimeline(calendar);
  renderHistoryTable(data);
  renderPropertyMovementSummary(data);
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

export function renderViewHeader(view = "property") {
  const content = viewHeaderContent[view] || viewHeaderContent.property;
  const title = document.getElementById("pageTitle");

  title.innerHTML = `
    <div class="flex items-start justify-between gap-4">
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

      <img
        src="assets/images/gage-county-map.png"
        alt="${content.imageAlt}"
        class="hidden h-20 w-auto shrink-0 opacity-80 sm:block grayscale"
      />
    </div>
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

      <div class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:grid-cols-2">
        ${metric("Parcel ID", data.parcel.parcelId)}
        ${metric("Tax District", data.parcel.taxDistrict)}
        ${metric(`${data.snapshotYear} Assessed Value`, snapshot.assessedValue === null || snapshot.assessedValue === undefined ? "Pending" : formatNullableMoney(snapshot.assessedValue), "blue")}
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
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Property tax timeline</p>
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
      <p class="font-semibold text-slate-700">${value}</p>
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

function renderPropertyDetails(data, recordCard) {
  const identityDetails = [
    ["Owner", data.parcel.owner],
    ["Situs address", data.parcel.situsAddress],
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
    recordReviewHistory(recordCard),
    reportErrorLink(data)
  ].join("");
}

function propertyRecordSourceText(data) {
  return `Source: MIPS Property Record Card, Parcel ID ${data.parcel.parcelId}.`;
}

function reportErrorLink(data) {
  return `
    <div class="sm:col-span-2 flex flex-col gap-2 px-1 pt-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <p>${escapeHtml(propertyRecordSourceText(data))}</p>
      <button type="button" data-report-error class="underline decoration-slate-300 underline-offset-4 transition hover:text-slate-700">
        Report an error
      </button>
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
  const dwellingRows = data.dwellingData || [];
  const outbuildingRows = data.outbuildingData || [];
  const noteRows = data.propertyNotes || [];
  const rows = [
    ["Parcel ID", data.parcel.parcelId, "Submission information"],
    ["Map number", data.parcel.mapNumber, "Submission information"],
    ["State geocode", data.parcel.stateGeoCode, "Submission information"],
    ["Owner", data.parcel.owner, "Submission information"],
    ["Mailing address", data.parcel.mailingAddress, "Submission information"],
    ["Situs address", data.parcel.situsAddress, "Submission information"],
    ["County", `${data.parcel.countyName} County`, "Submission information"],
    ["Tax district", data.parcel.taxDistrict, "Submission information"],
    ["School district", data.parcel.schoolDistrict, "Submission information"],
    ["Account type", data.parcel.accountType, "Submission information"],
    ["Legal description", data.parcel.legalDescription, "Submission information"],
    ...(detailedRecordCard ? [
      ["Card / perm", recordCard.parcelIdentifiers.cardFilePerm, "Record card identifiers"],
      ["Cadastral ID", recordCard.parcelIdentifiers.cadastralId, "Record card identifiers"],
      ["PAD class code", recordCard.parcelIdentifiers.padClassCode, "Record card identifiers"],
      ["Appraiser ID", recordCard.parcelIdentifiers.appraiserId, "Record card identifiers"],
      ["County area", recordCard.locationModel.countyArea, "Location model"],
      ["Neighborhood", recordCard.locationModel.neighborhood, "Location model"],
      ["Location group", recordCard.locationModel.locationGroup, "Location model"],
      ["Valuation group", recordCard.locationModel.valuationGroup, "Location model"],
      ["Land model / method", `${recordCard.locationModel.model} / ${recordCard.locationModel.method}`, "Location model"]
    ] : []),
    ["Status", data.classification.status, "Classification"],
    ["Location", data.classification.location, "Classification"],
    ["Property class", data.classification.propertyClass, "Classification"],
    ["City size", data.classification.citySize, "Classification"],
    ["Zoning", data.classification.zoning, "Classification"],
    ["Lot size", data.classification.lotSize, "Classification"],
    ...(detailedRecordCard && recordCard.residentialInformation ? [
      ["Record-card condition", recordCard.residentialInformation.condition, "Record-card dwelling information"],
      ["Record-card quality", recordCard.residentialInformation.quality, "Record-card dwelling information"],
      ["Record-card exterior wall", recordCard.residentialInformation.exteriorWall, "Record-card dwelling information"],
      ["Record-card bed / bath", recordCard.residentialInformation.bedBathroom, "Record-card dwelling information"],
      ["Record-card roof cover", recordCard.residentialInformation.roofCover, "Record-card dwelling information"],
      ["Record-card basement area", recordCard.residentialInformation.basementArea, "Record-card dwelling information"],
      ["Last record action", `${recordCard.reviewHistory[0].date} ${recordCard.reviewHistory[0].action} ${recordCard.reviewHistory[0].initials}`, "Record review history"]
    ] : []),
    ...landRows.flatMap((row, index) => [
      [`Land ${index + 1} description`, row.description, "Land information"],
      [`Land ${index + 1} width`, `${row.widthFeet} ft.`, "Land information"],
      [`Land ${index + 1} depth`, `${row.depthFeet} ft.`, "Land information"],
      [`Land ${index + 1} area`, `${Number(row.squareFeet).toLocaleString()} sq. ft.`, "Land information"]
    ]),
    ["Year built", residential.yearBuilt, "Dwelling information"],
    ["Style", residential.style, "Dwelling information"],
    ["Building size", formatSquareFeet(residential.buildingSize), "Dwelling information"],
    ["Basement size", formatSquareFeet(residential.basementSize), "Dwelling information"],
    ["Bedrooms", residential.bedrooms, "Dwelling information"],
    ["Bathrooms", residential.bathrooms, "Dwelling information"],
    ["Plumbing fixtures", residential.plumbingFixtures, "Dwelling information"],
    ["Quality", residential.quality, "Dwelling information"],
    ["Condition", residential.condition, "Dwelling information"],
    ["Exterior", residential.exterior, "Dwelling information"],
    ["Heating / cooling", residential.heatingCooling, "Dwelling information"],
    ["Garage 1", residential.garage1, "Dwelling information"],
    ["Garage 2", residential.garage2, "Dwelling information"],
    ["Minimum finish", formatSquareFeet(residential.minFinish), "Dwelling information"],
    ["Part finish", formatSquareFeet(residential.partFinish), "Dwelling information"],
    ...dwellingRows.flatMap((row, index) => [
      [`Additional feature ${index + 1}`, row.description, "Additional dwelling features"],
      [`Additional feature ${index + 1} units`, row.units, "Additional dwelling features"],
      [`Additional feature ${index + 1} value`, money.format(row.value), "Additional dwelling features"]
    ]),
    ...(outbuildingRows.length
      ? outbuildingRows.flatMap((row, index) => [
        [`Outbuilding ${index + 1}`, row.description, "Outbuilding information"],
        [`Outbuilding ${index + 1} units`, row.units, "Outbuilding information"],
        [`Outbuilding ${index + 1} year built`, row.yearBuilt, "Outbuilding information"],
        [`Outbuilding ${index + 1} cost`, row.cost, "Outbuilding information"]
      ])
      : [["Outbuilding records", "No outbuilding records listed for this property.", "Outbuilding information"]]),
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
          class="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
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
              Mark every item you can verify. Use ? when you are not sure whether the record is correct.
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
                <th class="w-24 px-2 py-2 text-center font-semibold">Confirmed</th>
                <th class="w-24 px-2 py-2 text-center font-semibold">Incorrect</th>
                <th class="w-16 px-2 py-2 text-center font-semibold">?</th>
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

      <section class="grid gap-4 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <label for="discrepancyComments" class="text-sm font-semibold text-slate-700">Comments or correction narrative</label>
          <textarea id="discrepancyComments" name="comments" rows="5" class="mt-2 w-full rounded-xl border-0 bg-slate-50 p-3 text-sm leading-6 text-slate-700 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Describe what appears incorrect and what the record should show."></textarea>
        </div>

        <div class="space-y-3">
          <fieldset class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
            <legend class="text-sm font-semibold text-slate-700">Preferred contact method</legend>
            <div class="mt-2 space-y-2 text-sm text-slate-700">
              ${[
                ["office", "In-office visit"],
                ["email", "Email"],
                ["phone", "Phone call"]
              ].map(([value, label]) => `
                <label class="flex items-center gap-2">
                  <input type="radio" name="contactMethod" value="${value}" class="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span>${label}</span>
                </label>
              `).join("")}
            </div>
          </fieldset>

          <div>
            <label for="discrepancyEmail" class="text-sm font-semibold text-slate-700">Email</label>
            <input id="discrepancyEmail" name="email" type="email" class="mt-2 w-full rounded-xl border-0 bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="name@example.com" />
          </div>

          <div>
            <label for="discrepancyPhone" class="text-sm font-semibold text-slate-700">Phone</label>
            <input id="discrepancyPhone" name="phone" type="tel" class="mt-2 w-full rounded-xl border-0 bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="(555) 555-5555" />
          </div>
        </div>
      </section>

      <section class="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600 ring-1 ring-slate-200">
        This prototype does not submit information yet. The submit button currently validates the workflow, captures a draft payload in the browser console, and shows a confirmation message for placement.
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

function initDiscrepancyDraft(data) {
  const form = document.getElementById("propertyDiscrepancyForm");
  const status = document.getElementById("discrepancyDraftStatus");
  const submitStatus = document.getElementById("discrepancySubmitStatus");
  const clearButton = document.querySelector("[data-clear-discrepancy-draft]");
  if (!form) return;

  const draftKey = `property-discrepancy-draft:${data.parcel.parcelId}`;

  function collectDraft() {
    const draft = {};
    const formData = new FormData(form);
    formData.forEach((value, key) => {
      draft[key] = value;
    });
    return draft;
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
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    saveDraft();
    const payload = {
      parcelId: data.parcel.parcelId,
      situsAddress: data.parcel.situsAddress,
      owner: data.parcel.owner,
      submittedAt: new Date().toISOString(),
      draft: collectDraft()
    };
    console.info("Property discrepancy request payload", payload);
    if (submitStatus) {
      submitStatus.textContent = "Correction request captured for prototype review. No information has been submitted.";
      submitStatus.className = "text-sm font-semibold text-emerald-700";
    }
  });
}

function initReportErrorModal(data) {
  const modal = document.getElementById("reportErrorModal");
  const trigger = document.querySelector("[data-report-error]");
  const closeButtons = document.querySelectorAll("[data-close-report-error]");

  if (!modal || !trigger) return;

  initDiscrepancyDraft(data);

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
      <summary class="cursor-pointer list-none rounded-xl bg-slate-50 px-4 py-3 font-semibold text-slate-700">
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

function recordCardSource(recordCard) {
  if (!recordCard) return "";

  if (!hasDetailedRecordCard(recordCard)) {
    return disclosure("What source record is this based on?", recordCard.recordStatus || "Pending", `
      <div class="bg-slate-50 p-3 text-sm leading-6 text-slate-600">
        <p class="font-semibold text-slate-700">${escapeHtml(recordCard.source || "Source record pending")}</p>
        <p class="mt-1">${escapeHtml(recordCard.notes || "Detailed record-card fields are not available for this sample fixture.")}</p>
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
          ["PAD class code", recordCard.parcelIdentifiers.padClassCode],
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
    <p class="border-t border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500">${escapeHtml(recordCard.source.notes)}</p>
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
        Value components come from the assessment model. Taxable value and taxes use the record-card history where available, with finalized tax history filling current dashboard years.
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

function recordReviewHistory(recordCard) {
  if (!recordCard?.reviewHistory?.length) return "";

  return disclosure("When was this record last reviewed?", `${recordCard.reviewHistory.length} events`, `
    <table class="min-w-full divide-y divide-slate-200 text-sm">
      <thead class="bg-slate-50">
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
            <td class="px-3 py-2">${row.action}</td>
            <td class="px-3 py-2">${row.initials}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `);
}

function technicalCostModel(recordCard, data) {
  if (!recordCard?.costApproach) return "";

  const cost = recordCard.costApproach;
  const assessedRows = (data.assessedValueBreakdown || [])
    .filter(row => row.total !== null && row.total !== undefined)
    .slice()
    .sort((a, b) => b.year - a.year);
  const currentValue = assessedRows[0];
  const garageLines = recordCard.garageCostLines || [];
  const miscLines = recordCard.miscImprovements || [];
  const garageTotal = garageLines.reduce((sum, row) => sum + row.rcnld, 0);
  const miscTotal = miscLines.reduce((sum, row) => sum + row.value, 0);
  const landValue = currentValue?.land ?? 0;
  const outbuildingValue = currentValue?.outbuilding ?? 0;
  const totalValue = currentValue?.total ?? cost.rcnld + landValue;
  const modeledDetailSubtotal = landValue + cost.rcnld + garageTotal + miscTotal + outbuildingValue;
  const reconciliation = recordCard.valuationReconciliation || {};
  const postProtestAdjustment = reconciliation.postProtestAdjustment ?? totalValue - modeledDetailSubtotal;
  const hasPostProtestAdjustment = Math.abs(postProtestAdjustment) > 0;
  const residentialInfo = recordCard.residentialInformation || {};
  const valueStack = [
    ["Land", landValue],
    ["Marshall & Swift dwelling model", cost.rcnld],
    ["Garages", garageTotal],
    ["Miscellaneous improvements", miscTotal],
    ["Outbuildings", outbuildingValue],
    ...(hasPostProtestAdjustment ? [["Post-protest adj.", postProtestAdjustment]] : [])
  ];

  return disclosure("How was this property’s improvement value modeled?", `Latest known total ${formatNullableMoney(totalValue)}`, `
    <div class="grid gap-3 bg-slate-50 p-3 text-sm md:grid-cols-4">
      ${[
        ["Year / effective age", cost.yearEffectiveAge],
        ["Adjusted cost", cost.adjustedCost.toFixed(3)],
        ["RCN", formatNullableMoney(cost.rcn)],
        ["RCNLD", formatNullableMoney(cost.rcnld)],
        ["Cost per sq. ft.", moneyCents.format(cost.costPerSquareFoot)],
        ["Depreciation", `${cost.depreciation.physicalPercent}% physical`],
        ["Garage value", formatNullableMoney(garageTotal)],
        ["Misc. improvements", formatNullableMoney(miscTotal)],
        ["Detail subtotal", formatNullableMoney(modeledDetailSubtotal)],
        ["Post-protest adj.", hasPostProtestAdjustment ? formatNullableMoney(postProtestAdjustment) : "$0"]
      ].map(([label, value]) => `
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</p>
          <p class="mt-1 font-semibold text-slate-700">${escapeHtml(value)}</p>
        </div>
        `).join("")}
    </div>
    <div class="border-t border-slate-200 p-3">
      <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">How the assessed value adds up</p>
      <div class="overflow-hidden rounded-xl ring-1 ring-slate-200">
        ${valueStack.map(([label, value], index) => `
          <div class="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-200 px-3 py-2 text-sm ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}">
            <p class="font-medium text-slate-700">${label}</p>
            <p class="font-semibold text-slate-700">${formatNullableMoney(value)}</p>
          </div>
        `).join("")}
        <div class="grid grid-cols-[1fr_auto] items-center gap-3 bg-slate-700 px-3 py-3 text-sm text-white">
          <p class="font-semibold">Total assessed value</p>
          <p class="text-base font-bold">${formatNullableMoney(totalValue)}</p>
        </div>
      </div>
      ${reconciliation.note ? `
        <p class="mt-3 text-xs leading-5 text-slate-500">${escapeHtml(reconciliation.note)}</p>
      ` : ""}
    </div>
    <details class="border-t border-slate-200 bg-white">
      <summary class="valuation-detail-toggle flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-semibold">
        <span class="flex min-w-0 items-center gap-2">
          <span class="valuation-detail-chevron" aria-hidden="true"></span>
          <span class="truncate">View exploded valuation detail</span>
        </span>
        <span class="hidden text-xs font-semibold sm:inline">Component drill-down</span>
      </summary>
      <div class="grid gap-4 border-t border-slate-200 p-3">
        <section class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <div class="mb-3 flex items-center justify-between gap-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Marshall & Swift dwelling model</p>
            <p class="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">Subtotal ${formatNullableMoney(cost.rcnld)}</p>
          </div>
          <div class="grid gap-3 text-sm md:grid-cols-3">
            ${[
              ["Residential type", residentialInfo.type],
              ["Quality", residentialInfo.quality],
              ["Condition", residentialInfo.condition],
              ["Base / total area", residentialInfo.baseTotalArea],
              ["Year / effective age", cost.yearEffectiveAge],
              ["Base cost", moneyCents.format(cost.baseCost)],
              ["Adjusted cost", cost.adjustedCost.toFixed(3)],
              ["RCN", formatNullableMoney(cost.rcn)],
              ["Depreciation", `${cost.depreciation.physicalPercent}% physical`],
              ["RCNLD", formatNullableMoney(cost.rcnld)],
              ["Cost per sq. ft.", moneyCents.format(cost.costPerSquareFoot)],
              ["Heating / cooling", residentialInfo.heatingCooling]
            ].map(([label, value]) => `
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</p>
                <p class="mt-1 font-semibold text-slate-700">${escapeHtml(value)}</p>
              </div>
            `).join("")}
          </div>
          <div class="mt-3 grid gap-2 text-sm sm:grid-cols-5">
            ${[
              ["Roofing", cost.adjustments.roofing],
              ["Subfloor", cost.adjustments.subfloor],
              ["Heat / cool", cost.adjustments.heatCool],
              ["Plumbing", cost.adjustments.plumbing],
              ["Basement", cost.adjustments.basement]
            ].map(([label, value]) => `
              <div class="rounded-lg bg-white p-2 ring-1 ring-slate-200">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">${label} adj.</p>
                <p class="mt-1 font-semibold text-slate-700">${Number(value).toFixed(2)}</p>
              </div>
            `).join("")}
          </div>
        </section>
        <section>
          <div class="mb-2 flex items-center justify-between gap-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Garages</p>
            <p class="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">Subtotal ${formatNullableMoney(garageTotal)}</p>
          </div>
          <table class="min-w-full divide-y divide-slate-200 rounded-xl text-sm ring-1 ring-slate-200">
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
        </section>
        <section>
          <div class="mb-2 flex items-center justify-between gap-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Miscellaneous improvements</p>
            <p class="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">Subtotal ${formatNullableMoney(miscTotal)}</p>
          </div>
          <table class="min-w-full divide-y divide-slate-200 rounded-xl text-sm ring-1 ring-slate-200">
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
        </section>
        ${hasPostProtestAdjustment ? `
          <section class="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
            <div class="mb-2 flex items-center justify-between gap-3">
              <p class="text-xs font-semibold uppercase tracking-wide text-amber-800">Reconciliation</p>
              <p class="rounded-full bg-white px-2 py-1 text-xs font-semibold text-amber-800">Post-protest adj. ${formatNullableMoney(postProtestAdjustment)}</p>
            </div>
            <div class="grid gap-3 text-sm md:grid-cols-3">
              ${[
                ["MIPS pre-protest total", reconciliation.initialMipsTotal ? formatNullableMoney(reconciliation.initialMipsTotal) : null],
                ["Modeled detail subtotal", formatNullableMoney(modeledDetailSubtotal)],
                ["Final assessed total", formatNullableMoney(totalValue)]
              ].map(([label, value]) => `
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-amber-800">${label}</p>
                  <p class="mt-1 font-semibold text-slate-800">${escapeHtml(value)}</p>
                </div>
              `).join("")}
            </div>
            ${reconciliation.source ? `<p class="mt-3 text-xs leading-5 text-amber-900">${escapeHtml(reconciliation.source)}</p>` : ""}
          </section>
        ` : ""}
        <section>
          <div class="mb-2 flex items-center justify-between gap-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Outbuildings</p>
            <p class="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">${data.outbuildingData.length ? `${data.outbuildingData.length} records` : "No records"}</p>
          </div>
          <table class="min-w-full divide-y divide-slate-200 rounded-xl text-sm ring-1 ring-slate-200">
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

  document.getElementById("summaryText").innerHTML = `
    <div class="focus-card mb-4">
      <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-700">Current assessment status</p>
      <p class="leading-7 text-slate-700">
        ${currentAssessmentCopy}
      </p>
    </div>

    <p>This snapshot separates <strong>current assessed value</strong> from <strong>finalized tax information</strong> so you can see what is known now and what is still pending.</p>
    <p class="mb-4 mt-4 leading-7">From ${first.year} through ${previousValue.year}, assessed value increased by <strong>${formatNullablePercent((previousValue.assessedValue - first.assessedValue) / first.assessedValue)}</strong>. During the same period, the property's <strong>effective tax rate</strong> declined from <strong>1.96%</strong> to <strong>1.22%</strong>, a reduction of roughly <strong>38%</strong>.</p>
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
          ["#levy-history", "Levy history"],
          ["#tax-distribution", "Tax distribution"],
          ["#etr-trend", "ETR trend"],
          ["#comparables", "Nearby sales"]
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
  const currentStage = document.querySelector("[data-current-stage]");
  const sourceNote = document.querySelector("[data-calendar-source]");

  if (currentStage) {
    currentStage.textContent = `Current stage: ${getCurrentStageText(calendar)}`;
  }

  if (sourceNote) {
    sourceNote.textContent = `Source: 2025 Nebraska PAD Main Property Assessment and Taxation Calendar${calendar.sourceRevision ? `, ${calendar.sourceRevision.toLowerCase()}` : ""}. Filing dates follow the PAD legal-date rule for weekends and legal holidays.`;
  }

  document.getElementById("processTimeline").innerHTML = calendar.stages.map((step, index) => {
    const active = isStageActive(step);
    const past = isStagePast(step);

    return `
      <div class="group relative rounded-2xl p-4 ring-1 transition duration-200 ${active ? "z-10 scale-[1.03] bg-blue-50 shadow-md ring-blue-300" : past ? "bg-slate-50/60 opacity-70 ring-slate-200" : "bg-slate-50 ring-slate-200"}" tabindex="0">
        <div class="mb-3 flex items-center gap-2">
          <span class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${active ? "bg-blue-600 text-white" : past ? "bg-slate-200 text-slate-500 ring-1 ring-slate-300" : "bg-white text-slate-600 ring-1 ring-slate-200"}">${index + 1}</span>
          ${active ? `<span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Now</span>` : past ? `<span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">Passed</span>` : ""}
        </div>
        <p class="font-semibold ${past && !active ? "text-slate-500" : "text-slate-700"}">${step.label}</p>
        <p class="mt-1 text-xs font-semibold uppercase tracking-wide ${past && !active ? "text-slate-400" : "text-slate-500"}">${step.timing}</p>
        <p class="mt-2 text-sm leading-6 ${past && !active ? "text-slate-500" : "text-slate-600"}">${step.description}</p>
        ${step.sourceEvents?.length || step.id === "protest" ? `
          <details class="mt-3 border-t border-slate-200 pt-3">
            <summary class="cursor-pointer list-none text-xs font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4">
              More information
            </summary>
            ${step.sourceEvents?.length ? `
              <div class="mt-3">
                <p class="text-[11px] font-semibold uppercase tracking-wide ${past && !active ? "text-slate-400" : "text-slate-500"}">PAD milestones</p>
                <ul class="mt-2 space-y-2 text-xs leading-5 ${past && !active ? "text-slate-500" : "text-slate-600"}">
                  ${step.sourceEvents.map(event => `
                    <li>
                      <span class="font-semibold text-slate-700">${event.timing}:</span>
                      ${event.duty}
                      ${event.authority?.length ? `<span class="block text-[11px] text-slate-500">${event.authority.join(", ")}</span>` : ""}
                    </li>
                  `).join("")}
                </ul>
              </div>
            ` : ""}
            ${step.id === "protest" ? `
              <p class="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-xs leading-5 text-slate-600 ring-1 ring-slate-200">
                The Nebraska Form 422 link appears during the protest window, June 1 through June 30.
              </p>
              ${stageLink(step, active)}
            ` : ""}
          </details>
        ` : ""}
      </div>
    `;
  }).join("");
}

function renderHistoryTable(data) {
  document.getElementById("historyRows").innerHTML = data.taxpayerHistory.slice().reverse().map((row, index) => {
    const etr = calculateEtr(row);
    const isCurrentNotice = row.status === "assessment_notice";
    const isPending = row.status === "pending";

    return `
      <tr class="${isCurrentNotice || isPending ? "bg-blue-50/70" : index % 2 === 0 ? "bg-white" : "bg-slate-50"}">
        <td class="px-3 py-2 font-medium">
          <div class="flex items-center gap-2">
            <span>${row.year}</span>
            ${isCurrentNotice ? `<span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Notice</span>` : ""}
            ${isPending ? `<span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Pending</span>` : ""}
          </div>
        </td>
        <td class="px-3 py-2 text-right">${formatNullableMoney(row.assessedValue)}</td>
        <td class="px-3 py-2 text-right">${row.taxes === null ? "Pending" : formatNullableMoney(row.taxes, true)}</td>
        <td class="px-3 py-2 text-right font-medium">${etr === null ? "Pending" : formatNullablePercent(etr)}</td>
      </tr>
    `;
  }).join("");

  document.querySelectorAll("[data-property-record-source]").forEach(element => {
    element.textContent = propertyRecordSourceText(data);
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

  const valueYears = lastValue.year - firstValue.year;
  const taxYears = lastTax.year - firstTax.year;
  const etrYears = lastEtr.year - firstEtr.year;

  const valueChange = (lastValue.assessedValue / firstValue.assessedValue) - 1;
  const taxChange = (lastTax.taxes / firstTax.taxes) - 1;
  const etrChange = lastEtr.etr - firstEtr.etr;

  const cards = [
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

  container.innerHTML = cards.map(([label, value, note, range]) => `
    <div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</p>
      <p class="mt-1 text-lg font-bold text-slate-700">${value}</p>
      <p class="mt-1 text-sm font-medium text-slate-600">${note}</p>
      <p class="mt-1 text-xs leading-5 text-slate-500">${range}</p>
    </div>
  `).join("");
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

function renderEtrSummary(data) {
  document.getElementById("etrSummary").innerHTML = `
    <p class="text-sm leading-7 text-slate-700">
      Effective tax rate helps show the relationship between assessed value and the final tax bill.
      When assessed values rise faster than the budgets they support, the levy generally has to move
      down because the same budget need is being spread across more taxable value.
      <br><br>
      That does not mean every tax bill goes down. If value increases are modest, values and taxes may
      still move in the same direction. Larger value increases make the levy adjustment more visible,
      especially when budget growth is smaller than the growth in assessed value.
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
    if (valueChange === null) {
      return `Your ${row.year} property value, levy, and tax bill are not available yet.`;
    }

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
    <tr class="table-total-row font-semibold">
      <td class="px-3 py-3">Total levy</td>
      <td class="px-3 py-3 text-right">${total.toFixed(8)}</td>
      <td class="px-3 py-3 text-right">100.00%</td>
      <td class="px-3 py-3 text-right">${moneyCents.format(totalTaxPer100k)}</td>
    </tr>
  `;

  document.getElementById("levyRows").innerHTML = dataRows + totalRow;
}

function renderComparables(data) {
  renderComparableValueScale(data);

  document.getElementById("comparableCards").innerHTML = data.comparables.map(item => {
    const isSubject = item.accent === "subject";

    return `
      <article class="rounded-2xl ${isSubject ? "bg-blue-50 ring-blue-200" : "bg-slate-50 ring-slate-200"} p-4 ring-1">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide ${isSubject ? "text-blue-700" : "text-slate-500"}">${item.type}</p>
        <img src="${item.image}" alt="${item.type} photo" class="h-32 w-full rounded-xl object-cover ring-1 ${isSubject ? "ring-blue-200" : "ring-slate-200"}" />
        <h3 class="mt-3 text-base font-bold text-slate-700">${item.title}</h3>
        <p class="text-sm text-slate-600">${item.subtitle}</p>
        <dl class="mt-4 space-y-2 text-sm">
          ${item.metrics.map(metric => `
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">${metric.label}</dt>
              <dd class="font-semibold ${metric.tone ? toneClass[metric.tone] : "text-slate-700"}">${metric.value ?? "Pending"}</dd>
            </div>
          `).join("")}
        </dl>
      </article>
    `;
  }).join("");
}

function parseMoneyValue(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;

  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function roundScale(value, direction) {
  const step = 25000;
  const method = direction === "down"
    ? Math.floor
    : direction === "nearest"
      ? Math.round
      : Math.ceil;

  return method(value / step) * step;
}

function getMetricValue(comparable, labels) {
  const metric = comparable.metrics.find(item => labels.includes(item.label));

  return parseMoneyValue(metric?.value);
}

function getSubjectComparableValue(data) {
  const snapshot = getSnapshotHistory(data);
  const currentValue = snapshot?.assessedValue ?? null;

  if (currentValue !== null && currentValue !== undefined) {
    return {
      value: currentValue,
      label: `${snapshot.year} assessed value`,
      pending: false
    };
  }

  const latestFinal = data.taxpayerHistory
    .filter(row => row.assessedValue !== null && row.assessedValue !== undefined)
    .sort((a, b) => a.year - b.year)
    .at(-1);

  return {
    value: latestFinal?.assessedValue ?? null,
    label: latestFinal ? `${latestFinal.year} assessed value` : "Assessed value",
    pending: true
  };
}

function markerPosition(value, min, max) {
  if (value === null || value === undefined || max <= min) return 0;

  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

function renderComparableValueScale(data) {
  const container = document.getElementById("comparableValueScale");
  if (!container) return;

  const subject = data.comparables.find(item => item.accent === "subject");
  const comps = data.comparables
    .filter(item => item.accent !== "subject")
    .map((item, index) => ({
      id: index + 1,
      title: item.title,
      value: getMetricValue(item, ["Sale price", "Assessed value"])
    }))
    .filter(item => item.value !== null && item.value !== undefined);
  const subjectValue = getSubjectComparableValue(data);
  const points = [
    ...(subjectValue.value !== null && subjectValue.value !== undefined ? [{
      id: "S",
      title: subject?.title || "This property",
      value: subjectValue.value,
      type: "subject"
    }] : []),
    ...comps.map(item => ({ ...item, type: "comp" }))
  ];

  if (points.length < 2) {
    container.innerHTML = "";
    return;
  }

  const rawMin = Math.min(...points.map(item => item.value));
  const rawMax = Math.max(...points.map(item => item.value));
  const range = rawMax - rawMin || rawMax * 0.1;
  const min = Math.max(0, roundScale(rawMin - range * 0.12, "down"));
  const max = roundScale(rawMax + range * 0.12, "up");
  const mid = roundScale((min + max) / 2, "nearest");

  container.innerHTML = `
    <section class="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200" aria-labelledby="comparativeValueTitle">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id="comparativeValueTitle" class="text-lg font-bold text-slate-700">How does this property compare by value?</h3>
          <p class="mt-1 text-sm leading-6 text-slate-600">
            The subject marker uses ${subjectValue.pending ? "the latest finalized assessed value while the current year is pending" : "the current assessed value"}.
            Nearby markers use listed comparable sale prices.
          </p>
        </div>
        <span class="self-start rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
          ${subjectValue.label}
        </span>
      </div>

      <div class="relative mt-8 px-3 pb-14 pt-8">
        <div class="absolute left-3 right-3 top-12 h-1 rounded-full bg-slate-300"></div>
        ${points.map(point => {
          const left = markerPosition(point.value, min, max);
          const isSubject = point.type === "subject";
          return `
            <div class="absolute top-7 -translate-x-1/2" style="left: ${left}%">
              <div class="flex flex-col items-center gap-1">
                <span class="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shadow-sm ring-2 ring-white ${isSubject ? "bg-slate-700 text-white" : "bg-blue-700 text-white"}">
                  ${point.id}
                </span>
                <span class="hidden max-w-28 text-center text-xs font-semibold leading-4 text-slate-600 sm:block">
                  ${formatNullableMoney(point.value)}
                </span>
              </div>
            </div>
          `;
        }).join("")}
        <div class="absolute inset-x-3 bottom-0 flex justify-between text-lg font-bold text-slate-500 sm:text-2xl">
          <span>${formatNullableMoney(min)}</span>
          <span>${formatNullableMoney(mid)}</span>
          <span>${formatNullableMoney(max)}</span>
        </div>
      </div>

      <div class="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
        ${points.map(point => `
          <div class="flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${point.type === "subject" ? "bg-slate-700 text-white" : "bg-blue-700 text-white"}">${point.id}</span>
            <span class="min-w-0">
              <span class="block truncate font-semibold text-slate-700">${point.title}</span>
              <span class="block">${formatNullableMoney(point.value)}</span>
            </span>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderSources(data) {
  document.getElementById("sourceCards").innerHTML = data.sources.map(source => `
    <div class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${source.label}</p>
      <p class="mt-1 font-medium text-slate-700">${source.value}</p>
    </div>
  `).join("");
}
