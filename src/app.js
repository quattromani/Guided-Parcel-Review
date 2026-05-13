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
      ["Why did my value change?", "Value can change because of updated property facts, market movement, depreciation, new construction, or comparable sales."],
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
      ["What does effective tax rate show?", "It divides taxes by value so tax burden can be compared across years."],
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
      ["What are levy components?", "They are the separate taxing-body rates that combine into the property tax district levy."]
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
      ["Market area", "A valuation grouping used to compare properties with similar market behavior."],
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
      ["Can countywide measures prove my parcel value is wrong?", "Not by themselves. They are context; parcel facts and comparable evidence still matter."]
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
      ["What does PAD do?", "Nebraska Property Assessment Division data helps frame statewide assessment oversight and comparison."],
      ["How do Reports and Opinions help?", "They summarize assessment-ratio and county review information used for statewide context."],
      ["What is statewide equalization?", "It is the state-level role of reviewing whether county assessments meet required standards."],
      ["Are credits decided on this page?", "No. This page explains context. Official credits and tax calculations are applied through the tax process."]
    ],
    forms: ["homestead", "valuationProtest"],
    learn: [
      ["PAD", "Nebraska's Property Assessment Division."],
      ["Abstract", "A county summary of assessed property values reported for review."],
      ["Reports and Opinions", "State assessment reports that summarize ratio and equalization findings."],
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
      ["Is the worksheet required to print Form 422?", "No. The worksheet is an educational preparation tool. Form 422 remains directly printable from the review view."],
      ["How can I keep a copy?", "Use the packet print action for the worksheet and prepared Form 422 together, or print either document independently."]
    ],
    forms: ["recordConcern", "homestead", "valuationProtest"],
    learn: [
      ["Preparation packet", "A printable packet that combines the comparable worksheet and prepared Form 422."],
      ["Record concern", "A factual review request about property record details."],
      ["Comparable property", "A property reviewed because its public-record facts may help explain assessment differences."],
      ["Protest window", "The formal period for filing a valuation protest."]
    ]
  }
};

async function main() {
  applyVisualizationPalette();
  const [propertyData, recordCard, calendar, ctlData, ratioData, countyContext, governingOffice, padRatioData, schoolDistrictColors, taxDistrictAuthorities, valuationGroups, iaaoStandards] = await Promise.all([
    loadPropertyData(),
    loadPropertyRecordCard(),
    loadAssessmentCalendar(),
    loadCertifiedTaxesLevied(),
    loadAssessmentRatioAnalysis(),
    loadCountyContext(),
    loadGoverningOffice(),
    loadPadRatioStatistics(),
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
    iaaoStandards
  });
  renderTaxDistrictAuthorities(data, taxDistrictAuthorities);
  buildIndexedChart(data);
  buildTaxBurdenPattern(data);
  buildEtrChart(data);
  buildDistributionChart(data, schoolDistrictColors);
  buildOverviewCharts(data, ctlData);
  initMarketAreaView(data, recordCard, padRatioData, valuationGroups);
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
  const tabs = document.querySelectorAll("[data-guided-tab]");
  const panels = document.querySelectorAll("[data-guided-panel]");
  const propertyContext = document.getElementById("propertyViewContext");
  const guidedPath = document.querySelector(".guided-path-nav");
  const stageSync = document.querySelector("[data-guided-current-stage]");
  const sectionIds = [...tabs].map(tab => tab.dataset.guidedTab);
  const visitedSteps = new Set();
  const unlockedSteps = new Set([sectionIds[0]]);
  const legacyViewMap = {
    property: "your-property",
    market: "market-area",
    county: "county-equalization",
    statewide: "state-context"
  };

  function stepForTarget(target) {
    return document.getElementById(target)?.closest("[data-guided-panel]")?.dataset.guidedPanel;
  }

  function unlockThrough(target) {
    const targetIndex = sectionIds.indexOf(target);
    if (targetIndex < 0) return;

    sectionIds.slice(0, targetIndex + 1).forEach(id => unlockedSteps.add(id));
  }

  function markPreviousVisited(target) {
    const targetIndex = sectionIds.indexOf(target);
    if (targetIndex <= 0) return;

    sectionIds.slice(0, targetIndex).forEach(id => visitedSteps.add(id));
  }

  function selectStep(selected, options = {}) {
    const { scrollTop = true, markVisited = true } = options;

    if (!unlockedSteps.has(selected)) {
      return false;
    }

    if (markVisited && sectionIds.includes(selected)) {
      visitedSteps.add(selected);
    }

    tabs.forEach((item, index) => {
      const active = item.dataset.guidedTab === selected;
      const unlocked = unlockedSteps.has(item.dataset.guidedTab);
      const complete = unlocked && visitedSteps.has(item.dataset.guidedTab) && !active;
      const future = !unlocked;
      const marker = item.querySelector("span");

      item.classList.toggle("guided-step-active", active);
      item.classList.toggle("guided-step-complete", complete);
      item.classList.toggle("guided-step-future", future);
      item.disabled = future;
      item.setAttribute("aria-selected", String(active));
      item.setAttribute("aria-disabled", String(future));
      if (marker) marker.textContent = complete ? "✓" : String(index + 1);
    });

    panels.forEach(panel => {
      panel.classList.toggle("hidden", panel.dataset.guidedPanel !== selected);
    });

    propertyContext?.classList.toggle("hidden", selected === "your-property");
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
    const calendarContext = document.createElement("span");
    const calendarLabel = document.createElement("span");
    const calendarValue = document.createElement("strong");

    propertyStage.className = "guided-stage-property";
    propertyContextLabel.textContent = "Property:";
    propertyContextValue.textContent = propertyLabel;
    propertyStage.append(propertyContextLabel, propertyContextValue);

    calendarContext.className = "guided-stage-calendar";
    calendarLabel.textContent = "Calendar stage:";
    calendarValue.textContent = getCurrentStageText(calendar);
    calendarContext.append(calendarLabel, calendarValue);

    stageSync.replaceChildren(propertyStage, calendarContext);
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      selectStep(tab.dataset.guidedTab);
    });
  });

  document.querySelectorAll("[data-guided-next]").forEach(button => {
    button.addEventListener("click", () => {
      const current = button.closest("[data-guided-panel]")?.dataset.guidedPanel;
      if (current) visitedSteps.add(current);
      unlockThrough(button.dataset.guidedNext);
      selectStep(button.dataset.guidedNext);
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
    const selected = event.detail?.step;
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
  const initialStep = hashTarget ? stepForTarget(hashTarget) : sectionIds[0];
  unlockThrough(initialStep || sectionIds[0]);
  markPreviousVisited(initialStep || sectionIds[0]);
  selectStep(initialStep || sectionIds[0], { scrollTop: false });
  if (hashTarget) {
    window.setTimeout(() => {
      const target = document.getElementById(hashTarget);
      target?.scrollIntoView({ behavior: "auto", block: "start" });
    }, 0);
  }
  initGuidedPathStickiness(guidedPath);
}

function renderGuidedResourceContent(viewKey) {
  const resources = resourcesByView[viewKey] ?? resourcesByView["your-property"];
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

  let stickPoint = 0;

  function measure() {
    guidedPath.classList.remove("guided-path-nav-stuck");
    stickPoint = guidedPath.getBoundingClientRect().top + window.scrollY - 1;
    update();
  }

  function update() {
    guidedPath.classList.toggle("guided-path-nav-stuck", window.scrollY > stickPoint);
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
