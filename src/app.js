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
  loadGoverningOffice,
  loadLegalReferences,
  loadMarketPositionStatistics,
  loadPropertyData,
  loadPropertyRecordCard,
  loadPadRatioStatistics,
  loadRealPropertyForms,
  loadSchoolDistrictColors,
  loadTaxDistrictAuthorities,
  loadValuationGroups,
  loadIaaoStandards
} from "./data-service.js";
import { applyChartDefaults, applyVisualizationPalette } from "./config/visualization-palettes.js";
import { initImageModal } from "./modal.js";
import {
  getCurrentStageText,
  renderPage,
  renderViewHeader
} from "./render.js";
import { buildPropertySnapshotModel, withSnapshotModel } from "./snapshot-model.js";
import {
  TAXPAYER_JOURNEY_ROUTES,
  getJourneyRoute,
  getRouteForPanel
} from "./config/taxpayer-journey.js";
import { installCivicJourneyPanels } from "./routes/landing-primer.js";
import { resourceAliases, resourcesByView } from "./content/route-resources.js";
import { renderTaxDistrictAuthorities } from "./views/tax-district-authorities.js";
import { escapeHtml } from "./utils/html.js";

let officialRealPropertyForms = { forms: [], sourceLinks: [], metadata: {} };

async function main() {
  applyVisualizationPalette();
  applyChartDefaults();
  const [propertyData, recordCard, calendar, legalReferences, realPropertyForms, ctlData, ratioData, governingOffice, padRatioData, marketPositionData, schoolDistrictColors, valuationGroups, iaaoStandards] = await Promise.all([
    loadPropertyData(),
    loadPropertyRecordCard(),
    loadAssessmentCalendar(),
    loadLegalReferences(),
    loadRealPropertyForms(),
    loadCertifiedTaxesLevied(),
    loadAssessmentRatioAnalysis(),
    loadGoverningOffice(),
    loadPadRatioStatistics(),
    loadMarketPositionStatistics(),
    loadSchoolDistrictColors(),
    loadValuationGroups(),
    loadIaaoStandards()
  ]);
  officialRealPropertyForms = realPropertyForms;
  const snapshotModel = buildPropertySnapshotModel({
    propertyData,
    recordCard,
    calendar,
    ctlData,
    ratioData,
    padRatioData,
    marketPositionData,
    valuationGroups,
    iaaoStandards
  });
  const data = withSnapshotModel(propertyData, snapshotModel);
  const imageModal = initImageModal(data.assets);

  renderPage(data, imageModal, calendar, recordCard, valuationGroups, governingOffice, {
    ctlData,
    ratioData,
    legalReferences,
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
  buildIndexedChart(data);
  buildTaxBurdenPattern(data);
  buildEtrChart(data);
  buildDistributionChart(data, schoolDistrictColors);
  buildOverviewCharts(data, ctlData);
  initMarketAreaView(data, recordCard, padRatioData, valuationGroups, iaaoStandards, marketPositionData);
  buildCtlSummary(data, ctlData);
  initCountyComparison(data, ctlData, recordCard);
  initAssessmentRatioAnalysis(data, ratioData, iaaoStandards);
  initGuidedNavigation(data, calendar);
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

function initGuidedNavigation(data, calendar) {
  const snapshotModel = data.snapshotModel;
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
  const mobileNavQuery = window.matchMedia("(max-width: 640px)");
  let taxDistrictAuthoritiesPromise;
  let taxDistrictAuthoritiesRendered = false;

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

  function alignActiveGuidedStep({ behavior = "smooth" } = {}) {
    if (!guidedPath || !tabsContainer || !mobileNavQuery.matches) return;

    const activeStep = tabsContainer.querySelector(".guided-step-active");
    if (!activeStep) return;

    const navRect = guidedPath.getBoundingClientRect();
    const activeRect = activeStep.getBoundingClientRect();
    const navStyle = window.getComputedStyle(guidedPath);
    const leftPadding = Number.parseFloat(navStyle.paddingLeft) || 0;
    const left = guidedPath.scrollLeft + activeRect.left - navRect.left - leftPadding;

    guidedPath.scrollTo({
      left: Math.max(0, left),
      behavior
    });
  }

  function queueActiveGuidedStepAlignment(behavior = "smooth") {
    window.requestAnimationFrame(() => alignActiveGuidedStep({ behavior }));
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
    if (selectedPanel === "your-taxes") {
      renderTaxDistrictPanelWhenNeeded();
    }
    window.dispatchEvent(new Event("resize"));
    queueActiveGuidedStepAlignment(scrollTop ? "smooth" : "auto");

    if (scrollTop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    return true;
  }

  function renderTaxDistrictPanelWhenNeeded() {
    if (taxDistrictAuthoritiesRendered) return;
    taxDistrictAuthoritiesRendered = true;

    // The full authority report is the largest local JSON file; load it when the tax context step needs jurisdiction cards.
    taxDistrictAuthoritiesPromise ??= loadTaxDistrictAuthorities();
    taxDistrictAuthoritiesPromise
      .then(taxDistrictAuthorities => renderTaxDistrictAuthorities(data, taxDistrictAuthorities))
      .catch(error => {
        console.error(error);
        renderTaxDistrictAuthorities(data, null);
      });
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
  mobileNavQuery.addEventListener?.("change", () => queueActiveGuidedStepAlignment("auto"));
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
  if (formsTitle) formsTitle.textContent = officialRealPropertyForms.metadata?.title ?? "Official real property forms";
  if (learnTitle) learnTitle.textContent = resources.learnTitle;

  if (faqContent) {
    faqContent.innerHTML = resources.faqs.map(([question, answer]) => `
      <details class="footer-resource-card">
        <summary class="cursor-pointer list-none font-semibold text-slate-700">${escapeHtml(question)}</summary>
        <p class="mt-2 text-sm leading-6 text-slate-600">${escapeHtml(answer)}</p>
      </details>
    `).join("");
  }

  if (formsContent) {
    formsContent.innerHTML = renderOfficialForms();
  }

  if (learnContent) {
    learnContent.innerHTML = resources.learn.map(([term, definition]) => `
      <div class="footer-resource-card">
        <p class="font-semibold text-slate-700">${escapeHtml(term)}</p>
        <p class="mt-1 text-sm leading-6 text-slate-600">${escapeHtml(definition)}</p>
      </div>
    `).join("");
  }
}

function renderOfficialForms() {
  const forms = officialRealPropertyForms.forms || [];
  if (!forms.length) return "";

  return `
    ${forms.map(renderOfficialFormLink).join("")}
    ${renderOfficialFormsSource()}
  `;
}

function renderOfficialFormLink(form) {
  if (!form) return "";

  return `
    <a href="${escapeHtml(form.url)}" target="_blank" rel="noreferrer" class="form-action-button official-form-link">
      <span>
        <span class="form-action-number">${escapeHtml(form.number)}</span>
        <span class="block font-semibold text-slate-700">${escapeHtml(form.title)}</span>
        <span class="mt-1 block text-xs leading-5 text-slate-500">${escapeHtml(form.note)}</span>
      </span>
      <span class="form-action-cta">Open official</span>
    </a>
  `;
}

function renderOfficialFormsSource() {
  const source = officialRealPropertyForms.metadata?.source;
  const sourceLinks = officialRealPropertyForms.sourceLinks || [];
  const verified = formatSourceDate(officialRealPropertyForms.metadata?.verifiedAsOf);

  return `
    <p class="official-forms-source">
      Source: ${escapeHtml(source?.displayCitation || "Nebraska Department of Revenue Property Assessment Division")}${verified ? `, verified ${escapeHtml(verified)}` : ""}.
      ${sourceLinks.map(link => `
        <a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>
      `).join(" | ")}
    </p>
  `;
}

function formatSourceDate(value) {
  const match = `${value ?? ""}`.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value || "";

  const [, year, month, day] = match.map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month - 1, day)));
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
