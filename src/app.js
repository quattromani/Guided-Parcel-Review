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
  loadPropertySwitcherRecords,
  loadPadRatioStatistics,
  loadRealPropertyForms,
  loadSchoolDistrictColors,
  loadTaxDistrictAuthorities,
  loadValuationGroups,
  loadIaaoStandards,
  loadAssessmentDateEvents,
  PROPERTY_SELECTION_STORAGE_KEY
} from "./data-service.js";
import { applyChartDefaults, applyVisualizationPalette } from "./config/visualization-palettes.js";
import { initImageModal } from "./modal.js";
import {
  renderPage,
  renderStartPage,
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
import { initAssessorsReport } from "./assessors-report.js";
import { initAssessmentDatesPanel } from "./assessment-dates.js";
import { initFirstVisitOrientation, ORIENTATION_STORAGE_KEY } from "./orientation.js";

let officialRealPropertyForms = { forms: [], sourceLinks: [], metadata: {} };

function propertyIdentityKey(value = {}) {
  return `${value.parcelId
    ?? value.propertyId
    ?? value.id
    ?? value.parcel?.parcelId
    ?? value.property?.parcelId
    ?? ""}`.trim();
}

function syncLayoutViewportWidth() {
  document.documentElement.style.setProperty("--layout-viewport-width", `${document.documentElement.clientWidth}px`);
}

syncLayoutViewportWidth();
window.addEventListener("resize", syncLayoutViewportWidth, { passive: true });

async function main() {
  applyVisualizationPalette();
  applyChartDefaults();
  const propertySwitcher = await loadPropertySwitcherRecords();

  if (!propertySwitcher.activePropertyId) {
    const [realPropertyForms, assessmentDateEvents] = await Promise.all([
      loadRealPropertyForms(),
      loadAssessmentDateEvents()
    ]);

    officialRealPropertyForms = realPropertyForms;
    window.__PROPERTY_SWITCHER_CONTEXT__ = propertySwitcher;
    renderStartPage(propertySwitcher);
    renderGuidedResourceContent("your-property");
    initAssessmentDatesPanel(assessmentDateEvents);
    initFooterNavigation();
    initFirstVisitOrientation();
    return;
  }

  const [propertyData, recordCard, calendar, legalReferences, realPropertyForms, ctlData, ratioData, governingOffice, padRatioData, marketPositionData, schoolDistrictColors, valuationGroups, iaaoStandards, assessmentDateEvents] = await Promise.all([
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
    loadIaaoStandards(),
    loadAssessmentDateEvents()
  ]);
  officialRealPropertyForms = realPropertyForms;
  const propertySwitcherContext = { ...propertySwitcher, valuationGroups };
  window.__PROPERTY_SWITCHER_CONTEXT__ = propertySwitcherContext;
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
    iaaoStandards,
    propertySwitcher: propertySwitcherContext
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
  initAssessmentRatioAnalysis(data, ratioData, iaaoStandards, padRatioData, marketPositionData, valuationGroups);
  initGuidedNavigation(data, { propertySwitcher: propertySwitcherContext });
  initAssessmentDatesPanel(assessmentDateEvents);
  initFooterNavigation();
  initAssessorsReport({
    data,
    recordCard,
    valuationGroups,
    context: {
      calendar,
      ctlData,
      ratioData,
      padRatioData,
      marketPositionData,
      iaaoStandards
    },
    loadTaxDistrictAuthorities
  });
}

main().catch(error => {
  console.error(error);
  document.body.innerHTML = `
    <main class="mx-auto max-w-2xl p-6">
      <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-red-200">
        <h1 class="text-xl font-bold text-red-700">Guided Parcel Review could not load</h1>
        <p class="mt-2 text-sm text-slate-700">${error.message}</p>
      </section>
    </main>
  `;
});

function initGuidedNavigation(data, options = {}) {
  const snapshotModel = data.snapshotModel;
  const routeList = snapshotModel?.sections?.length ? snapshotModel.sections : TAXPAYER_JOURNEY_ROUTES;
  const progressRoutes = routeList.filter(route => !route.secondary && route.id !== "landing-primer");
  const tabsContainer = document.getElementById("guidedPathTabs");

  if (tabsContainer) {
    tabsContainer.innerHTML = progressRoutes.map((route, index) => `
      <button type="button" data-guided-tab="${route.id}" class="guided-step" aria-selected="false">
        ${guidedStepMarker(index + 1)}
        <span class="guided-step-label">${route.label}</span>
      </button>
    `).join("");
  }

  const tabs = document.querySelectorAll("[data-guided-tab]");
  const panels = document.querySelectorAll("[data-guided-panel]");
  const propertyContext = document.getElementById("propertyViewContext");
  const guidedPath = document.querySelector(".guide-review-header");
  const guidedPathTrack = document.querySelector(".guided-path-track");
  const guidedProgressStatus = document.querySelector("[data-guided-progress-status]");
  const guidedProgressNext = document.querySelector("[data-guided-progress-next]");
  const primarySectionIds = progressRoutes.map(route => route.id);
  const visitedSteps = new Set();
  const unlockedSteps = new Set([primarySectionIds[0]]);
  const railScrollQuery = window.matchMedia("(max-width: 1299px)");
  const labelsHiddenProgressQuery = window.matchMedia("(max-width: 899px)");
  const finalRouteId = primarySectionIds.at(-1);
  const finalRoutePanelId = progressRoutes.at(-1)?.panelId ?? finalRouteId;
  let activePropertyKey = propertyIdentityKey(data.parcel);
  let taxDistrictAuthoritiesPromise;
  let taxDistrictAuthoritiesRendered = false;
  let currentGuidedRouteId = null;

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

  function isPrimaryRouteId(id) {
    return primarySectionIds.includes(id);
  }

  function progressRouteIdFor(route) {
    return route?.primaryRouteId ?? route?.id ?? null;
  }

  function stepForTarget(target) {
    const panelId = document.getElementById(target)?.closest("[data-guided-panel]")?.dataset.guidedPanel;
    return panelId ? routeIdForPanel(panelId) : null;
  }

  function stepForHashTarget(target) {
    if (!target) return null;
    const route = routeList.find(item => item.id === target || item.panelId === target);
    return route?.id ?? stepForTarget(target);
  }

  function unlockThrough(target) {
    const targetId = routeIdFor(target);
    if (!isPrimaryRouteId(targetId)) return;

    const targetIndex = primarySectionIds.indexOf(targetId);
    primarySectionIds.slice(0, targetIndex + 1).forEach(id => unlockedSteps.add(id));
  }

  function alignActiveGuidedStep({ behavior = "smooth" } = {}) {
    const scrollContainer = guidedPathTrack || guidedPath;

    if (!scrollContainer || !tabsContainer || !railScrollQuery.matches) return;

    const activeStep = tabsContainer.querySelector(".guided-step-active");
    if (!activeStep) return;

    const navRect = scrollContainer.getBoundingClientRect();
    const activeRect = activeStep.getBoundingClientRect();
    const navStyle = window.getComputedStyle(scrollContainer);
    const leftPadding = Number.parseFloat(navStyle.paddingLeft) || 0;
    const left = scrollContainer.scrollLeft + activeRect.left - navRect.left - leftPadding;

    scrollContainer.scrollTo({
      left: Math.max(0, left),
      behavior
    });
  }

  function queueActiveGuidedStepAlignment(behavior = "smooth") {
    window.requestAnimationFrame(() => alignActiveGuidedStep({ behavior }));
  }

  function animateGuidedStep(routeId) {
    if (!routeId || !tabsContainer) return;

    const step = tabsContainer.querySelector(`[data-guided-tab="${routeId}"]`);
    if (!step) return;

    step.classList.remove("guided-step-advanced");
    window.requestAnimationFrame(() => {
      step.classList.add("guided-step-advanced");
      window.setTimeout(() => step.classList.remove("guided-step-advanced"), 360);
    });
  }

  function updateGuidedProgressStatus(currentRouteId) {
    if (!guidedProgressStatus) return;

    currentGuidedRouteId = currentRouteId;
    const currentIndex = primarySectionIds.indexOf(currentRouteId);
    if (currentIndex === -1) {
      guidedProgressStatus.innerHTML = "Start the guided review";
      if (guidedProgressNext) guidedProgressNext.textContent = "";
      return;
    }

    const routeLabel = progressRoutes[currentIndex]?.label || `Step ${currentIndex + 1}`;
    const compactRouteLabel = routeLabel === "What Changed" ? "What Changed?" : routeLabel;
    const statusLabel = labelsHiddenProgressQuery.matches
      ? `${compactRouteLabel} - Step ${currentIndex + 1} of ${primarySectionIds.length}`
      : `step ${currentIndex + 1} of ${primarySectionIds.length}`;
    const nextRouteLabel = progressRoutes[currentIndex + 1]?.label || "";

    guidedProgressStatus.innerHTML = `You're reviewing <strong>${escapeHtml(statusLabel)}</strong>`;
    if (guidedProgressNext) {
      guidedProgressNext.textContent = labelsHiddenProgressQuery.matches && nextRouteLabel
        ? `Next: ${nextRouteLabel}`
        : "";
    }
  }

  function renderGuidedTabs(selected) {
    tabs.forEach(item => {
      const active = item.dataset.guidedTab === selected;
      const tabIsPrimary = isPrimaryRouteId(item.dataset.guidedTab);
      const unlocked = tabIsPrimary ? unlockedSteps.has(item.dataset.guidedTab) : true;
      const terminalComplete = active && item.dataset.guidedTab === finalRouteId && visitedSteps.has(finalRouteId);
      const complete = tabIsPrimary && unlocked && visitedSteps.has(item.dataset.guidedTab) && (!active || terminalComplete);
      const future = tabIsPrimary && !unlocked;
      const marker = item.querySelector(".guided-step-marker");

      item.classList.toggle("guided-step-active", active);
      item.classList.toggle("guided-step-complete", complete);
      item.classList.toggle("guided-step-future", future);
      item.disabled = future;
      item.setAttribute("aria-selected", String(active));
      item.setAttribute("aria-disabled", String(future));
      if (marker) {
        const primaryIndex = primarySectionIds.indexOf(item.dataset.guidedTab);
        marker.textContent = complete ? "✓" : String(primaryIndex + 1);
      }
    });
  }

  function completeFinalStepIfAtPageBottom() {
    if (!finalRouteId || currentGuidedRouteId !== finalRouteId || visitedSteps.has(finalRouteId)) return;

    const panel = document.querySelector(`[data-guided-panel="${finalRoutePanelId}"]`);
    if (!panel || panel.classList.contains("hidden")) return;

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const reachedPanelBottom = panel.getBoundingClientRect().bottom <= viewportHeight + 24;
    if (!reachedPanelBottom) return;

    visitedSteps.add(finalRouteId);
    renderGuidedTabs(finalRouteId);
    animateGuidedStep(finalRouteId);
  }

  function queueFinalStepCompletionCheck() {
    window.requestAnimationFrame(completeFinalStepIfAtPageBottom);
  }

  function resetGuidedReviewForProperty(property = {}) {
    const nextPropertyKey = propertyIdentityKey(property);
    if (nextPropertyKey && nextPropertyKey === activePropertyKey) return;

    activePropertyKey = nextPropertyKey || activePropertyKey;
    visitedSteps.clear();
    unlockedSteps.clear();
    if (primarySectionIds[0]) unlockedSteps.add(primarySectionIds[0]);
    taxDistrictAuthoritiesRendered = false;
    currentGuidedRouteId = null;
    selectStep(primarySectionIds[0], { scrollTop: true, updateHash: true });
  }

  function selectStep(selectedRoute, options = {}) {
    const { scrollTop = true, updateHash = false } = options;
    const route = resolveRoute(selectedRoute) ?? routeList[0];
    const selected = route.id;
    const selectedPanel = route.panelId;
    const progressRouteId = progressRouteIdFor(route);
    const primaryRoute = isPrimaryRouteId(selected);

    if (primaryRoute && !unlockedSteps.has(selected)) {
      return false;
    }

    if (route.secondary && progressRouteId) unlockThrough(progressRouteId);

    renderGuidedTabs(progressRouteId || selected);

    panels.forEach(panel => {
      panel.classList.toggle("hidden", panel.dataset.guidedPanel !== selectedPanel);
    });

    propertyContext?.classList.toggle("hidden", selected === "landing-primer");
    renderViewHeader(selected, snapshotModel, options.propertySwitcher);
    renderGuidedResourceContent(selected);
    if (selectedPanel === "your-taxes") {
      renderTaxDistrictPanelWhenNeeded();
    }
    if (updateHash && window.location.hash !== `#${selected}`) {
      history.pushState(null, "", `#${selected}`);
    }
    updateGuidedProgressStatus(progressRouteId || selected);
    window.dispatchEvent(new Event("resize"));
    queueActiveGuidedStepAlignment(scrollTop ? "smooth" : "auto");
    queueFinalStepCompletionCheck();

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

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      selectStep(tab.dataset.guidedTab, { updateHash: true });
    });
  });

  document.querySelectorAll("[data-guided-next]").forEach(button => {
    button.addEventListener("click", () => {
      const currentPanel = button.closest("[data-guided-panel]")?.dataset.guidedPanel;
      const currentRoute = routeIdForPanel(currentPanel);
      const currentProgressRoute = progressRouteIdFor(resolveRoute(currentRoute));
      const nextRoute = routeIdFor(button.dataset.guidedNext);
      if (currentProgressRoute && isPrimaryRouteId(currentProgressRoute)) visitedSteps.add(currentProgressRoute);
      unlockThrough(nextRoute);
      if (selectStep(nextRoute, { updateHash: true })) {
        animateGuidedStep(currentProgressRoute);
        animateGuidedStep(nextRoute);
      }
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

  function selectStepFromHash() {
    const hashStep = stepForHashTarget(window.location.hash?.slice(1));
    if (!hashStep) return false;
    unlockThrough(hashStep);
    return selectStep(hashStep, { scrollTop: true, updateHash: false });
  }

  const hashTarget = window.location.hash?.slice(1);
  const initialStep = hashTarget ? stepForHashTarget(hashTarget) : routeList[0]?.id;
  unlockThrough(initialStep || primarySectionIds[0]);
  selectStep(initialStep || primarySectionIds[0], { scrollTop: false });
  railScrollQuery.addEventListener?.("change", () => {
    queueActiveGuidedStepAlignment("auto");
  });
  labelsHiddenProgressQuery.addEventListener?.("change", () => updateGuidedProgressStatus(currentGuidedRouteId));
  window.addEventListener("scroll", queueFinalStepCompletionCheck, { passive: true });
  window.addEventListener("resize", queueFinalStepCompletionCheck);
  window.addEventListener("hashchange", selectStepFromHash);
  window.addEventListener("property-snapshot:property-selected", event => {
    resetGuidedReviewForProperty(event.detail?.property ?? event.detail ?? {});
  });
  if (hashTarget && document.getElementById(hashTarget)) {
    window.setTimeout(() => {
      const target = document.getElementById(hashTarget);
      target?.scrollIntoView({ behavior: "auto", block: "start" });
    }, 0);
  }
  initGuidedPathStickiness(guidedPath);
}

function guidedStepMarker(index) {
  return `<span class="guided-step-marker">${index}</span>`;
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

  let stickPoint = 0;

  function measure() {
    guidedPath.classList.remove("guided-path-nav-stuck");
    stickPoint = guidedPath.getBoundingClientRect().top + window.scrollY - 1;
    update();
  }

  function update() {
    const stuck = window.scrollY > stickPoint;
    guidedPath.classList.toggle("guided-path-nav-stuck", stuck);
  }

  measure();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", measure);
}

function initFooterNavigation() {
  const links = document.querySelectorAll("[data-footer-target]");
  const panels = document.querySelectorAll("[data-footer-panel]");
  const footerContent = document.getElementById("footerContent");
  const footerTargets = new Set(Array.from(panels, panel => panel.dataset.footerPanel));
  const resetButton = document.querySelector("[data-reset-property-manifest]");

  document.querySelectorAll("[data-fpo-link]").forEach(link => {
    link.addEventListener("click", event => event.preventDefault());
  });

  links.forEach(link => {
    link.setAttribute("aria-expanded", "false");
    if (link.dataset.footerTarget) {
      link.setAttribute("aria-controls", link.dataset.footerTarget);
    }
  });

  function openFooterPanel(selected, options = {}) {
    const { updateHash = false, scroll = true } = options;
    if (!footerTargets.has(selected)) return false;

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

    if (updateHash && window.location.hash !== `#${selected}`) {
      history.pushState(null, "", `#${selected}`);
    }

    if (scroll) {
      footerContent?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    return true;
  }

  links.forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      openFooterPanel(link.dataset.footerTarget, { updateHash: true });
    });
  });

  function openFooterPanelFromHash() {
    const selected = window.location.hash.slice(1);
    if (selected) openFooterPanel(selected, { scroll: true });
  }

  window.addEventListener("hashchange", openFooterPanelFromHash);
  openFooterPanelFromHash();

  resetButton?.addEventListener("click", () => {
    try {
      window.localStorage?.removeItem(PROPERTY_SELECTION_STORAGE_KEY);
      window.localStorage?.removeItem(ORIENTATION_STORAGE_KEY);
    } catch {
      // Reloading without a property selection still returns to the start flow.
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("property");
    url.searchParams.delete("orientation");
    url.hash = "";

    if (url.toString() === window.location.href) {
      window.location.reload();
    } else {
      window.location.assign(url.toString());
    }
  });
}
