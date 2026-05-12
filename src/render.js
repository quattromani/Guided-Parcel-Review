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
  getSnapshotHistory
} from "./data-service.js";
import {
  buildForm422PrefillModel,
  downloadPdf,
  generateForm422Pdf
} from "./form422Prefill.js";

const discrepancyChoices = [
  ["confirmed", "Confirmed"],
  ["incorrect", "Incorrect"],
  ["unsure", "?"]
];

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
    description: "Use the property’s valuation group and PAD Reports and Opinions data for local market context.",
    imageAlt: "Map of Nebraska highlighting the local market area"
  },
  "county-equalization": {
    eyebrow: "Step 6 · County equalization",
    title: "How is the county performing overall?",
    description: "Countywide ratio measures and certified-tax trends help explain the assessment system around the property.",
    imageAlt: "Map of Nebraska highlighting Gage County"
  },
  "state-context": {
    eyebrow: "Step 7 · State context",
    title: "How does the county compare statewide?",
    description: "Statewide CTL baselines provide a broader frame for local value growth, taxes levied, and average tax rates.",
    imageAlt: "Map of Nebraska"
  },
  "review-checklist": {
    eyebrow: "Step 8 · Review checklist",
    title: "What should I check before I protest?",
    description: "Bring the property record, assessment, tax history, market context, and calendar into a practical review list.",
    imageAlt: "Map of Nebraska highlighting Gage County"
  }
};

export function renderPage(data, imageModal, calendar, recordCard, valuationGroups) {
  renderViewHeader("your-property", data.snapshotModel);
  renderPropertyViewContext(data, recordCard, valuationGroups);
  renderHeader(data, imageModal, recordCard);
  renderAssessmentNoticeSummary(data, recordCard);
  renderHeaderTimeline(calendar);
  renderPropertyDetails(data, recordCard);
  renderDiscrepancyForm(data, recordCard);
  initReportErrorModal(data);
  initForm422Modal(data, recordCard);
  renderSummary(data);
  renderProcessTimeline(calendar);
  renderHistoryTable(data);
  renderPropertyMovementSummary(data);
  renderEtrSummary(data);
  renderLevyHistoryTable(data);
  renderLevyTable(data);
  renderSources(data);
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

function getCurrentStageText(calendar) {
  const activeStages = getActiveStages(calendar);

  if (!activeStages.length) {
    return "Between calendar stages";
  }

  return activeStages.map(stage => stage.label).join(" + ");
}

export function renderViewHeader(view = "your-property", snapshotModel) {
  const section = snapshotModel?.sections?.find(item => item.id === view);
  const content = section
    ? {
      eyebrow: section.eyebrow,
      title: section.question,
      description: section.description,
      imageAlt: viewHeaderContent[view]?.imageAlt ?? "Map of Nebraska"
    }
    : viewHeaderContent[view] || viewHeaderContent["your-property"];
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

  const rows = data.assessedValueBreakdown || [];
  const current = rows.find(row => row.year === data.snapshotYear) ?? rows[0] ?? {};
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
    ...dwellingRows.map((row, index) => [
      `Additional feature ${index + 1}`,
      [
        row.description,
        row.units !== null && row.units !== undefined ? `Units: ${row.units}` : null,
        row.value !== null && row.value !== undefined ? `Value: ${money.format(row.value)}` : null
      ].filter(Boolean).join(" • "),
      "Additional dwelling features"
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
  const triggers = document.querySelectorAll("[data-report-error]");
  const closeButtons = document.querySelectorAll("[data-close-report-error]");

  if (!modal || !triggers.length) return;

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

  triggers.forEach(trigger => trigger.addEventListener("click", open));
  modal.addEventListener("click", close);
  modal.querySelector("[role='dialog']").addEventListener("click", event => event.stopPropagation());
  closeButtons.forEach(button => button.addEventListener("click", close));

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") close();
  });
}

function initForm422Modal(data, recordCard) {
  const modal = document.getElementById("form422Modal");
  const triggers = document.querySelectorAll("[data-prepare-form422]");
  const closeButtons = document.querySelectorAll("[data-close-form422]");
  const generateButton = document.querySelector("[data-generate-form422]");
  const fieldContainer = document.getElementById("form422ConfirmationFields");
  const status = document.getElementById("form422Status");

  if (!modal || !triggers.length || !fieldContainer || !generateButton) return;

  const model = buildForm422PrefillModel(data, recordCard);

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
      status.textContent = "Generating Form 422...";
      status.className = "mt-4 text-sm font-semibold text-slate-600";
    }
    generateButton.disabled = true;
    generateButton.classList.add("opacity-60");

    try {
      const bytes = await generateForm422Pdf(model);
      downloadPdf(bytes, model.fileName);
      if (status) {
        status.textContent = "Form 422 PDF generated. Review the downloaded form before filing.";
        status.className = "mt-4 text-sm font-semibold text-emerald-700";
      }
    } catch (error) {
      console.error(error);
      if (status) {
        status.textContent = error.message || "Form 422 could not be generated.";
        status.className = "mt-4 text-sm font-semibold text-red-700";
      }
    } finally {
      generateButton.disabled = false;
      generateButton.classList.remove("opacity-60");
    }
  }

  triggers.forEach(trigger => trigger.addEventListener("click", open));
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
  const previousValue = getPreviousFinalValueHistory(data);
  const first = data.taxpayerHistory[0];
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
          ["#assessment-notice", "Assessment notice"],
          ["#indexed-trends", "Value and tax movement"],
          ["#etr-trend", "Tax rate trend"],
          ["#tax-distribution", "Tax distribution"],
          ["#market-overview", "Market area"],
          ["#assessment-accuracy", "County equalization"],
          ["#review-checklist-card", "Review checklist"]
        ].map(([href, label]) => `<a href="${href}" data-jump-target="${href.slice(1)}" class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400">${label}</a>`).join("")}
      </div>
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

function renderProcessTimeline(calendar) {
  const currentStage = document.querySelector("[data-current-stage]");
  const sourceNote = document.querySelector("[data-calendar-source]");
  const timeline = document.getElementById("processTimeline");

  if (currentStage) {
    currentStage.textContent = `Current stage: ${getCurrentStageText(calendar)}`;
  }

  if (sourceNote) {
    sourceNote.textContent = `Source: 2025 Nebraska PAD Main Property Assessment and Taxation Calendar${calendar.sourceRevision ? `, ${calendar.sourceRevision.toLowerCase()}` : ""}. Filing dates follow the PAD legal-date rule for weekends and legal holidays.`;
  }

  if (!timeline) return;

  timeline.innerHTML = calendar.stages.map((step, index) => {
    const active = isStageActive(step);
    const past = isStagePast(step);
    const hasDetail = step.sourceEvents?.length || step.id === "protest";

    return `
      <div class="group relative flex h-full flex-col rounded-2xl p-4 ring-1 transition duration-200 ${active ? "z-10 scale-[1.03] bg-blue-50 shadow-md ring-blue-300" : past ? "bg-slate-50/60 opacity-70 ring-slate-200" : "bg-slate-50 ring-slate-200"}" tabindex="0">
        <div class="mb-3 flex items-center gap-2">
          <span class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${active ? "bg-blue-600 text-white" : past ? "bg-slate-200 text-slate-500 ring-1 ring-slate-300" : "bg-white text-slate-600 ring-1 ring-slate-200"}">${index + 1}</span>
          ${active ? `<span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Now</span>` : past ? `<span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">Passed</span>` : ""}
        </div>
        <p class="font-semibold ${past && !active ? "text-slate-500" : "text-slate-700"}">${escapeHtml(step.label)}</p>
        <p class="mt-1 text-xs font-semibold uppercase tracking-wide ${past && !active ? "text-slate-400" : "text-slate-500"}">${escapeHtml(step.timing)}</p>
        <p class="mt-2 flex-1 text-sm leading-6 ${past && !active ? "text-slate-500" : "text-slate-600"}">${escapeHtml(step.description)}</p>
        ${hasDetail ? `
          <div class="mt-auto border-t border-slate-200 pt-3 text-center">
            <button type="button" data-calendar-stage="${escapeHtml(step.id)}" class="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400">
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
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">PAD milestones</p>
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
      <div class="mt-4 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-slate-700 ring-1 ring-blue-200">
        <p>After reviewing the record and supporting context, you can prepare the official Form 422 with available property information filled in. Requested valuation, reasons, signature, and filing responsibility remain with the filer.</p>
        <button type="button" data-calendar-prepare-form422 class="mt-3 inline-flex rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
          Prepare Form 422
        </button>
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
    content.querySelector("[data-calendar-prepare-form422]")?.addEventListener("click", () => {
      close();
      document.querySelector("#review-checklist-card [data-prepare-form422]")?.click();
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
      note: district ? "Matched by parcel tax district." : "Using latest levy components."
    },
    {
      label: "Total levy",
      value: formatNullableLevy(district?.districtLevy ?? total),
      note: "Sum of district authorities."
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
  document.getElementById("sourceCards").innerHTML = data.sources.map(source => `
    <div class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${source.label}</p>
      <p class="mt-1 font-medium text-slate-700">${source.value}</p>
    </div>
  `).join("");
}
