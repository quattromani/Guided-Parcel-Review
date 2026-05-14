import {
  buildCtlSummary,
  buildDistributionChart,
  buildEtrChart,
  buildIndexedChart,
  initMarketAreaView,
  buildOverviewCharts,
  buildTaxBurdenPattern,
  initCountyComparison,
  initAssessmentRatioAnalysis
} from "./charts.js";
import {
  loadAssessmentCalendar,
  loadAssessmentRatioAnalysis,
  loadCertifiedTaxesLevied,
  loadCountyContext,
  loadGoverningOffice,
  loadMarketPositionStatistics,
  loadPropertyData,
  loadPropertyRecordCard,
  loadPadRatioStatistics,
  loadSchoolDistrictColors,
  loadTaxDistrictAuthorities,
  loadValuationGroups,
  loadIaaoStandards
} from "./data-service.js";
import { applyVisualizationPalette } from "./config/visualization-palettes.js";
import { initImageModal } from "./modal.js";
import {
  getCurrentStageText,
  renderPage,
  renderTaxDistrictAuthorities,
  renderViewHeader
} from "./render.js";
import { buildPropertySnapshotModel, withSnapshotModel } from "./snapshot-model.js";
import {
  TAXPAYER_JOURNEY_ROUTES,
  getJourneyRoute,
  getRouteForPanel
} from "./config/taxpayer-journey.js";
import { installCivicJourneyPanels } from "./routes/landing-primer.js";

const footerFormActions = {
  recordConcern: {
    title: "Property record concern",
    cta: "Open record review",
    actionAttribute: "data-report-error"
  },
  homestead: {
    title: "Homestead exemption",
    cta: "Prepare Form 458",
    actionAttribute: "data-prepare-homestead"
  },
  valuationProtest: {
    title: "Review and protest materials",
    cta: "Open review",
    actionAttribute: "data-prepare-form422"
  }
};

const resourcesByView = {
  "landing-primer": {
    faqTitle: "Getting oriented FAQs",
    formTitle: "Optional resources",
    learnTitle: "Assessment basics",
    faqs: [
      ["What should I do first?", "Confirm that you are looking at the right property, then review the record before interpreting values or taxes."],
      ["Is this telling me to protest?", "No. The primary goal is orientation and understanding. Filing steps remain optional resources."],
      ["Why are some current-year values pending?", "Assessment-year information can appear before final tax bills or complete current-year values are available."],
      ["What if the question is only about the tax bill?", "Use the Tax Context step after reviewing the property and value movement basics."]
    ],
    forms: ["recordConcern", "homestead"],
    learn: [
      ["Assessment year", "The year for which the property value is being reviewed."],
      ["Assessed value", "The value used as the basis for property taxation."],
      ["Prior value", "The most recent earlier value available for comparison."],
      ["Review deadline", "A procedural date that should be confirmed with official sources before any filing."]
    ]
  },
  "your-property": {
    faqTitle: "Property record FAQs",
    formTitle: "Property record forms",
    learnTitle: "Property record terms",
    faqs: [
      ["What should I check first?", "Start with ownership, situs address, legal description, dwelling facts, improvements, condition, and photos. Factual record issues can affect later value review."],
      ["Do bedrooms, bathrooms, condition, and square footage matter?", "Yes. Those characteristics help describe the property and can influence the assessment model."],
      ["What if a photo or property characteristic looks outdated?", "Use the record review request to describe what appears inaccurate, incomplete, or misclassified."],
      ["Is a record concern the same as a valuation protest?", "No. A record concern asks for factual review. A formal valuation protest is a separate filing process."]
    ],
    forms: ["recordConcern", "homestead", "valuationProtest"],
    learn: [
      ["Parcel", "A specific piece of property identified for assessment and tax administration."],
      ["Situs address", "The physical location address associated with the property."],
      ["Legal description", "The formal land description used in property records."],
      ["Property record card", "The assessor record that summarizes parcel facts, land, buildings, and value details."]
    ]
  },
  "your-assessment": {
    faqTitle: "Assessment FAQs",
    formTitle: "Assessment forms",
    learnTitle: "Assessment terms",
    faqs: [
      ["Is assessed value the same as market value?", "For most residential real property, assessed value is intended to reflect market value as of the assessment date."],
      ["Why are land and improvement values separated?", "Separating land from buildings helps show which part of the property model changed."],
      ["Why did the value change?", "Value can change because of updated property facts, market movement, depreciation, new construction, or comparable sales."],
      ["How do comparable sales matter?", "Comparable sales help test whether the assessment is reasonable for similar properties in the market."]
    ],
    forms: ["recordConcern", "valuationProtest"],
    learn: [
      ["Assessed value", "The value used as the property basis for taxation."],
      ["Land value", "The assessed portion attributed to the site itself."],
      ["Improvement value", "The assessed portion attributed to buildings and other improvements."],
      ["Mass appraisal", "A method of valuing many properties with common data, models, and market evidence."]
    ]
  },
  "your-taxes": {
    faqTitle: "Tax FAQs",
    formTitle: "Tax and exemption forms",
    learnTitle: "Tax terms",
    faqs: [
      ["What is the difference between gross tax and net taxes paid?", "Gross tax starts from value and levy. Net taxes paid reflects applicable credits and adjustments."],
      ["Why do value and taxes not always move together?", "Taxes also depend on budgets, levies, exemptions, credits, and tax district changes."],
      ["What does effective tax rate show?", "It divides final taxes by assessed value so different years can be compared more clearly."],
      ["Where do credits fit?", "Credits reduce the final amount due after the tax calculation is applied."]
    ],
    forms: ["homestead"],
    learn: [
      ["Levy", "The tax rate applied by taxing entities to taxable value."],
      ["Gross tax", "The tax amount before credits or similar reductions."],
      ["Tax credit", "A reduction applied to the calculated tax bill."],
      ["Effective tax rate", "Net taxes divided by assessed value for comparison across years."]
    ]
  },
  "tax-districts": {
    faqTitle: "Tax district FAQs",
    formTitle: "Tax district forms",
    learnTitle: "Tax district terms",
    faqs: [
      ["Why are several taxing entities listed?", "A parcel can sit inside overlapping jurisdictions, such as a school district, city, county, and special districts."],
      ["Why can a nearby parcel have a different tax bill?", "District boundaries can change which entities and levy rates apply, even for close neighbors."],
      ["Why is the school district important?", "School levies are often a major part of the total levy and can vary by district."],
      ["Which taxing bodies are included?", "The tax district is made up of separate school, county, city, and other public bodies whose rates combine into the total levy."]
    ],
    forms: ["recordConcern"],
    learn: [
      ["Taxing district", "The combination of taxing entities that apply to a parcel."],
      ["Levy authority", "An entity authorized to levy property tax."],
      ["School district", "The public school jurisdiction assigned to the parcel."],
      ["Consolidated levy", "The combined levy rate from the applicable taxing entities."]
    ]
  },
  "market-area": {
    faqTitle: "Market area FAQs",
    formTitle: "Market review forms",
    learnTitle: "Market terms",
    faqs: [
      ["What is a market area?", "It is a group of properties reviewed together because they share market or valuation characteristics."],
      ["Are comparable sales exact matches?", "Usually no. They are market evidence selected because they are reasonably similar and useful for comparison."],
      ["What do local sales trends show?", "They help explain whether values are moving with nearby market evidence."],
      ["What is a ratio study?", "It compares assessed values with sale prices to test assessment level and uniformity."]
    ],
    forms: ["valuationProtest"],
    learn: [
      ["Market area", "A local comparison group used to review properties with similar market behavior."],
      ["Comparable sale", "A sale used as evidence because it is similar enough to inform value."],
      ["Sales ratio", "Assessed value divided by sale price."],
      ["Valuation group", "A grouping used to organize assessment analysis and market review."]
    ]
  },
  "county-equalization": {
    faqTitle: "County equalization FAQs",
    formTitle: "County review forms",
    learnTitle: "County terms",
    faqs: [
      ["Why look at countywide trends?", "Countywide data shows the assessment system around the parcel, not just one property."],
      ["What is equalization?", "Equalization is the process of keeping assessments at required levels and reasonably uniform."],
      ["What do COD and PRD measure?", "COD describes assessment uniformity. PRD helps flag whether high- and low-value properties are treated consistently."],
      ["Can countywide measures prove the parcel value is wrong?", "Not by themselves. They are context; parcel facts and comparable evidence still matter."]
    ],
    forms: ["valuationProtest"],
    learn: [
      ["Equalization", "Review intended to keep assessed values consistent with required assessment standards."],
      ["COD", "Coefficient of dispersion, a measure of assessment uniformity."],
      ["PRD", "Price-related differential, a measure used to review value-related assessment patterns."],
      ["Level of value", "How assessed values compare with market value overall."]
    ]
  },
  "state-context": {
    faqTitle: "State context FAQs",
    formTitle: "State-related forms",
    learnTitle: "State context terms",
    faqs: [
      ["What does the Property Assessment Division do?", "Nebraska's Property Assessment Division helps frame statewide assessment oversight and comparison."],
      ["How do state assessment reports help?", "They summarize county sales studies and equalization information used for statewide context."],
      ["What is statewide equalization?", "It is the state-level role of reviewing whether county assessments meet required standards."],
      ["Are credits decided here?", "No. Official credits and tax calculations are applied through the tax process."]
    ],
    forms: ["homestead", "valuationProtest"],
    learn: [
      ["Property Assessment Division", "The state office that helps oversee property assessment standards in Nebraska."],
      ["Abstract", "A county summary of assessed property values reported for review."],
      ["State assessment reports", "Reports that summarize county sales studies and equalization findings."],
      ["Statewide equalization", "State review of assessment levels across counties."]
    ]
  },
  "review-checklist": {
    faqTitle: "Review FAQs",
    formTitle: "Review resources",
    learnTitle: "Review terms",
    faqs: [
      ["What should I review first?", "Start with the property record: square footage, year built, basement, garage, outbuildings, condition, lot size, property class, value history, and tax history."],
      ["Why use a comparable worksheet?", "It helps organize basic public-record information side-by-side so differences are easier to see before any filing decision is made."],
      ["Is the worksheet required to print Form 422?", "No. The worksheet is an optional preparation tool. Form 422 remains directly printable from the review view."],
      ["How can I keep a copy?", "Use the packet print action for the worksheet and prepared Form 422 together, or print either document independently."]
    ],
    forms: ["recordConcern", "homestead", "valuationProtest"],
    learn: [
      ["Preparation packet", "A printable packet that combines the comparable worksheet and prepared Form 422."],
      ["Record concern", "A factual review request about property record details."],
      ["Comparable property", "A property reviewed because its public-record facts may help explain assessment differences."],
      ["Protest window", "The formal period for filing a valuation protest."]
    ]
  },
  "resources": {
    faqTitle: "Resource FAQs",
    formTitle: "Resource forms",
    learnTitle: "Resource terms",
    faqs: [
      ["What is in Resources?", "The Resources tab keeps the assessment calendar, comparable worksheet, and optional protest preparation materials separate from the main review path."],
      ["Does opening Resources mean I should file something?", "No. These are reference and preparation materials. Use them only if they help answer a specific question."],
      ["Why is the calendar first?", "Calendar context helps explain what stage the assessment process is in before worksheet or filing materials appear."],
      ["Can the worksheet change the assessed value?", "No. It is an organization tool and does not guarantee a change or outcome."]
    ],
    forms: ["recordConcern", "valuationProtest", "homestead"],
    learn: [
      ["Assessment calendar", "The sequence of dates for assessment, protest, review, budgets, levies, and final tax bills."],
      ["Comparable worksheet", "An organizer for side-by-side public-record property facts."],
      ["Form 422", "Nebraska's property valuation protest form."],
      ["Preparation packet", "A printable packet that can combine the worksheet and prepared Form 422."]
    ]
  }
};

const resourceAliases = {
  "property-record": "your-property",
  "what-changed": "your-assessment",
  "valuation-detail": "market-area",
  "tax-context": "your-taxes",
  "review-signals": "review-checklist",
  "final-summary": "review-checklist"
};

async function main() {
  applyVisualizationPalette();
  const [propertyData, recordCard, calendar, ctlData, ratioData, countyContext, governingOffice, padRatioData, marketPositionData, schoolDistrictColors, taxDistrictAuthorities, valuationGroups, iaaoStandards] = await Promise.all([
    loadPropertyData(),
    loadPropertyRecordCard(),
    loadAssessmentCalendar(),
    loadCertifiedTaxesLevied(),
    loadAssessmentRatioAnalysis(),
    loadCountyContext(),
    loadGoverningOffice(),
    loadPadRatioStatistics(),
    loadMarketPositionStatistics(),
    loadSchoolDistrictColors(),
    loadTaxDistrictAuthorities(),
    loadValuationGroups(),
    loadIaaoStandards()
  ]);
  const snapshotModel = buildPropertySnapshotModel({
    propertyData,
    recordCard,
    calendar,
    ctlData,
    ratioData,
    countyContext,
    padRatioData,
    marketPositionData,
    taxDistrictAuthorities,
    valuationGroups,
    iaaoStandards
  });
  const data = withSnapshotModel(propertyData, snapshotModel);
  const imageModal = initImageModal(data.assets);

  renderPage(data, imageModal, calendar, recordCard, valuationGroups, governingOffice, {
    ctlData,
    ratioData,
    padRatioData,
    marketPositionData,
    iaaoStandards
  });
  installCivicJourneyPanels(data, {
    recordCard,
    ctlData,
    ratioData,
    padRatioData,
    marketPositionData,
    iaaoStandards
  });
  renderTaxDistrictAuthorities(data, taxDistrictAuthorities);
  buildIndexedChart(data);
  buildTaxBurdenPattern(data);
  buildEtrChart(data);
  buildDistributionChart(data, schoolDistrictColors);
  buildOverviewCharts(data, ctlData);
  initMarketAreaView(data, recordCard, padRatioData, valuationGroups, iaaoStandards, marketPositionData);
  buildCtlSummary(data, ctlData);
  initCountyComparison(data, ctlData, recordCard);
  initAssessmentRatioAnalysis(data, ratioData, iaaoStandards);
  initGuidedNavigation(data.snapshotModel, calendar);
  initFooterNavigation();
}

main().catch(error => {
  console.error(error);
  document.body.innerHTML = `
    <main class="mx-auto max-w-2xl p-6">
      <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-red-200">
        <h1 class="text-xl font-bold text-red-700">Property snapshot could not load</h1>
        <p class="mt-2 text-sm text-slate-700">${error.message}</p>
      </section>
    </main>
  `;
});

function initGuidedNavigation(snapshotModel, calendar) {
  const routeList = snapshotModel?.sections?.length ? snapshotModel.sections : TAXPAYER_JOURNEY_ROUTES;
  const tabsContainer = document.getElementById("guidedPathTabs");

  if (tabsContainer) {
    tabsContainer.innerHTML = routeList.map((route, index) => `
      <button type="button" data-guided-tab="${route.id}" class="guided-step ${route.secondary ? "guided-step-secondary" : ""} ${index === 0 ? "guided-step-active" : ""}" aria-selected="${index === 0 ? "true" : "false"}">
        ${guidedStepMarker(route, index)}${route.label}
      </button>
    `).join("");
  }

  const tabs = document.querySelectorAll("[data-guided-tab]");
  const panels = document.querySelectorAll("[data-guided-panel]");
  const propertyContext = document.getElementById("propertyViewContext");
  const guidedPath = document.querySelector(".guided-path-nav");
  const stageSync = document.querySelector("[data-guided-current-stage]");
  const primarySectionIds = routeList.filter(route => !route.secondary).map(route => route.id);
  const visitedSteps = new Set();
  const unlockedSteps = new Set([primarySectionIds[0]]);
  const legacyViewMap = {
    property: "property-record",
    market: "valuation-detail",
    county: "county-equalization",
    statewide: "state-context"
  };

  function resolveRoute(value) {
    if (!value) return null;

    const configured = getJourneyRoute(value) || routeList.find(route =>
      route.id === value || route.panelId === value
    );

    if (configured) return configured;

    if (document.querySelector(`[data-guided-panel="${value}"]`)) {
      return {
        id: value,
        panelId: value,
        label: value
      };
    }

    return routeList[0];
  }

  function routeIdFor(value) {
    return value ? resolveRoute(value)?.id : null;
  }

  function routeIdForPanel(panelId) {
    return getRouteForPanel(panelId)?.id ?? panelId;
  }

  function routeForId(id) {
    return routeList.find(route => route.id === id);
  }

  function isPrimaryRouteId(id) {
    return primarySectionIds.includes(id);
  }

  function stepForTarget(target) {
    const panelId = document.getElementById(target)?.closest("[data-guided-panel]")?.dataset.guidedPanel;
    return panelId ? routeIdForPanel(panelId) : null;
  }

  function unlockThrough(target) {
    const targetId = routeIdFor(target);
    if (!isPrimaryRouteId(targetId)) return;

    const targetIndex = primarySectionIds.indexOf(targetId);
    primarySectionIds.slice(0, targetIndex + 1).forEach(id => unlockedSteps.add(id));
  }

  function markPreviousVisited(target) {
    const targetId = routeIdFor(target);
    const targetIndex = primarySectionIds.indexOf(targetId);
    if (targetIndex <= 0) return;

    primarySectionIds.slice(0, targetIndex).forEach(id => visitedSteps.add(id));
  }

  function selectStep(selectedRoute, options = {}) {
    const { scrollTop = true, markVisited = true } = options;
    const route = resolveRoute(selectedRoute) ?? routeList[0];
    const selected = route.id;
    const selectedPanel = route.panelId;
    const primaryRoute = isPrimaryRouteId(selected);

    if (primaryRoute && !unlockedSteps.has(selected)) {
      return false;
    }

    if (markVisited && primaryRoute) {
      visitedSteps.add(selected);
    }

    tabs.forEach((item, index) => {
      const active = item.dataset.guidedTab === selected;
      const tabRoute = routeForId(item.dataset.guidedTab);
      const tabIsPrimary = isPrimaryRouteId(item.dataset.guidedTab);
      const unlocked = tabIsPrimary ? unlockedSteps.has(item.dataset.guidedTab) : true;
      const complete = tabIsPrimary && unlocked && visitedSteps.has(item.dataset.guidedTab) && !active;
      const future = tabIsPrimary && !unlocked;
      const marker = item.querySelector("span");

      item.classList.toggle("guided-step-active", active);
      item.classList.toggle("guided-step-complete", complete);
      item.classList.toggle("guided-step-future", future);
      item.disabled = future;
      item.setAttribute("aria-selected", String(active));
      item.setAttribute("aria-disabled", String(future));
      if (marker && tabRoute?.icon !== "stacked-papers") {
        const primaryIndex = primarySectionIds.indexOf(item.dataset.guidedTab);
        marker.textContent = complete ? "✓" : primaryIndex === 0 ? "0" : String(primaryIndex);
      }
    });

    panels.forEach(panel => {
      panel.classList.toggle("hidden", panel.dataset.guidedPanel !== selectedPanel);
    });

    propertyContext?.classList.toggle("hidden", selected === "landing-primer" || selectedPanel === "your-property");
    renderViewHeader(selected, snapshotModel);
    renderGuidedResourceContent(selected);
    window.dispatchEvent(new Event("resize"));

    if (scrollTop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    return true;
  }

  if (stageSync && calendar) {
    const propertyLabel = snapshotModel?.viewModels?.property?.situsAddress
      || snapshotModel?.viewModels?.property?.countyName
      || "Property snapshot";
    const propertyStage = document.createElement("span");
    const propertyContextLabel = document.createElement("span");
    const propertyContextValue = document.createElement("strong");
    const notice = snapshotModel?.viewModels?.notice;
    const assessmentContext = document.createElement("span");
    const assessmentLabel = document.createElement("span");
    const assessmentStatus = document.createElement("span");

    propertyStage.className = "guided-stage-property";
    propertyContextLabel.textContent = "Property:";
    propertyContextValue.textContent = propertyLabel;
    propertyStage.append(propertyContextLabel, propertyContextValue);

    assessmentContext.className = "guided-stage-assessment";
    assessmentContext.setAttribute("aria-label", `${notice?.assessmentLabel ?? "Assessment"} status ${notice?.valueStatusLabel ?? getCurrentStageText(calendar)}`);
    assessmentLabel.textContent = `${notice?.assessmentLabel ?? "Assessment"}:`;
    assessmentStatus.className = "notice-status-pill notice-status-pill-pending";
    assessmentStatus.textContent = notice?.valueStatusLabel ?? getCurrentStageText(calendar);
    assessmentContext.append(assessmentLabel, assessmentStatus);

    stageSync.replaceChildren(propertyStage, assessmentContext);
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      selectStep(tab.dataset.guidedTab);
    });
  });

  document.querySelectorAll("[data-guided-next]").forEach(button => {
    button.addEventListener("click", () => {
      const currentPanel = button.closest("[data-guided-panel]")?.dataset.guidedPanel;
      const currentRoute = routeIdForPanel(currentPanel);
      const nextRoute = routeIdFor(button.dataset.guidedNext);
      if (currentRoute && isPrimaryRouteId(currentRoute)) visitedSteps.add(currentRoute);
      unlockThrough(nextRoute);
      selectStep(nextRoute);
    });
  });

  document.querySelectorAll("[data-view-link]").forEach(link => {
    link.addEventListener("click", () => {
      const target = document.getElementById(link.dataset.jumpTarget);
      const selected = legacyViewMap[link.dataset.viewLink] ?? stepForTarget(link.dataset.jumpTarget) ?? "your-property";

      if (!selectStep(selected, { scrollTop: false })) return;
      if (!target) return;

      history.pushState(null, "", `#${target.id}`);
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.classList.add("jump-target-active");
      window.setTimeout(() => target.classList.remove("jump-target-active"), 1400);
    });
  });

  document.querySelectorAll("[data-jump-target]").forEach(link => {
    link.addEventListener("click", event => {
      const target = document.getElementById(link.dataset.jumpTarget);
      if (!target) return;

      event.preventDefault();
      const targetStep = stepForTarget(link.dataset.jumpTarget);
      if (targetStep) {
        if (!selectStep(targetStep, { scrollTop: false })) return;
      }
      history.pushState(null, "", `#${target.id}`);
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.classList.add("jump-target-active");
      window.setTimeout(() => target.classList.remove("jump-target-active"), 1400);
    });
  });

  document.addEventListener("property-snapshot:select-guided-step", event => {
    const selected = routeIdFor(event.detail?.step);
    const targetSelector = event.detail?.target;

    if (selected) {
      unlockThrough(selected);
      markPreviousVisited(selected);
      if (!selectStep(selected, { scrollTop: false })) return;
    }

    if (!targetSelector) return;
    const target = document.querySelector(targetSelector);
    if (!target) return;

    if (target.id) history.pushState(null, "", `#${target.id}`);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.classList.add("jump-target-active");
    window.setTimeout(() => target.classList.remove("jump-target-active"), 1400);
  });

  const hashTarget = window.location.hash?.slice(1);
  const initialStep = hashTarget ? stepForTarget(hashTarget) : primarySectionIds[0];
  unlockThrough(initialStep || primarySectionIds[0]);
  markPreviousVisited(initialStep || primarySectionIds[0]);
  selectStep(initialStep || primarySectionIds[0], { scrollTop: false });
  if (hashTarget) {
    window.setTimeout(() => {
      const target = document.getElementById(hashTarget);
      target?.scrollIntoView({ behavior: "auto", block: "start" });
    }, 0);
  }
  initGuidedPathStickiness(guidedPath);
}

function guidedStepMarker(route, index) {
  if (route.icon === "stacked-papers") {
    return `
      <span class="guided-step-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M8 7.5h9.5a1.5 1.5 0 0 1 1.5 1.5v9.5a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5V9A1.5 1.5 0 0 1 8 7.5Z"></path>
          <path d="M4.5 15.5V5.5A1.5 1.5 0 0 1 6 4h10"></path>
          <path d="M6.5 17.5H4A1.5 1.5 0 0 1 2.5 16V7"></path>
        </svg>
      </span>
    `;
  }

  return `<span>${index === 0 ? "0" : index}</span>`;
}

function renderGuidedResourceContent(viewKey) {
  const resourceKey = resourceAliases[viewKey] ?? viewKey;
  const resources = resourcesByView[resourceKey] ?? resourcesByView["your-property"];
  const faqTitle = document.getElementById("footerFaqTitle");
  const formsTitle = document.getElementById("footerFormsTitle");
  const learnTitle = document.getElementById("footerLearnTitle");
  const faqContent = document.getElementById("footerFaqContent");
  const formsContent = document.getElementById("footerFormsContent");
  const learnContent = document.getElementById("footerLearnContent");

  if (faqTitle) faqTitle.textContent = resources.faqTitle;
  if (formsTitle) formsTitle.textContent = resources.formTitle;
  if (learnTitle) learnTitle.textContent = resources.learnTitle;

  if (faqContent) {
    faqContent.innerHTML = resources.faqs.map(([question, answer]) => `
      <details class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <summary class="cursor-pointer list-none font-semibold text-slate-700">${escapeHtml(question)}</summary>
        <p class="mt-2 text-sm leading-6 text-slate-600">${escapeHtml(answer)}</p>
      </details>
    `).join("");
  }

  if (formsContent) {
    formsContent.innerHTML = resources.forms.map(formKey => renderFooterFormAction(footerFormActions[formKey])).join("");
  }

  if (learnContent) {
    learnContent.innerHTML = resources.learn.map(([term, definition]) => `
      <div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <p class="font-semibold text-slate-700">${escapeHtml(term)}</p>
        <p class="mt-1 text-sm leading-6 text-slate-600">${escapeHtml(definition)}</p>
      </div>
    `).join("");
  }
}

function renderFooterFormAction(form) {
  if (!form) return "";

  return `
    <button type="button" ${form.actionAttribute} class="form-action-button">
      <span class="font-semibold text-slate-700">${escapeHtml(form.title)}</span>
      <span class="form-action-cta">${escapeHtml(form.cta)}</span>
    </button>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function initGuidedPathStickiness(guidedPath) {
  if (!guidedPath) return;

  const noticeStatus = document.querySelector(".civic-notice-heading .notice-status-group");
  let stickPoint = 0;

  function measure() {
    guidedPath.classList.remove("guided-path-nav-stuck");
    stickPoint = guidedPath.getBoundingClientRect().top + window.scrollY - 1;
    update();
  }

  function update() {
    const stuck = window.scrollY > stickPoint;
    guidedPath.classList.toggle("guided-path-nav-stuck", stuck);

    if (!noticeStatus) return;

    const navBottom = guidedPath.getBoundingClientRect().bottom;
    const statusBottom = noticeStatus.getBoundingClientRect().bottom;
    guidedPath.classList.toggle("guided-path-nav-show-assessment", stuck && statusBottom <= navBottom);
  }

  measure();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", measure);
}

function initFooterNavigation() {
  const links = document.querySelectorAll("[data-footer-target]");
  const panels = document.querySelectorAll("[data-footer-panel]");
  const footerContent = document.getElementById("footerContent");

  document.querySelectorAll("[data-fpo-link]").forEach(link => {
    link.addEventListener("click", event => event.preventDefault());
  });

  links.forEach(link => link.setAttribute("aria-expanded", "false"));

  links.forEach(link => {
    link.addEventListener("click", () => {
      const selected = link.dataset.footerTarget;
      footerContent?.classList.remove("hidden");

      links.forEach(item => {
        const active = item.dataset.footerTarget === selected;
        item.classList.toggle("footer-link-active", active);
        item.classList.toggle("text-slate-600", !active);
        item.setAttribute("aria-expanded", String(active));
      });

      panels.forEach(panel => {
        panel.classList.toggle("hidden", panel.dataset.footerPanel !== selected);
      });

      footerContent?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}
