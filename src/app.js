import {
  buildCtlSummary,
  buildDistributionChart,
  buildEqualizationPressureIndex,
  buildEtrChart,
  buildIndexedChart,
  initMarketAreaView,
  buildOverviewCharts,
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
  renderPage,
  renderTaxDistrictAuthorities,
  renderViewHeader
} from "./render.js";
import { buildPropertySnapshotModel, withSnapshotModel } from "./snapshot-model.js";

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

  renderPage(data, imageModal, calendar, recordCard, valuationGroups, governingOffice);
  renderTaxDistrictAuthorities(data, taxDistrictAuthorities);
  buildIndexedChart(data);
  buildEqualizationPressureIndex(data, ctlData);
  buildEtrChart(data);
  buildDistributionChart(data, schoolDistrictColors);
  buildOverviewCharts(data, ctlData);
  initMarketAreaView(data, recordCard, padRatioData, valuationGroups);
  buildCtlSummary(data, ctlData);
  initCountyComparison(data, ctlData, recordCard);
  initAssessmentRatioAnalysis(data, ratioData, iaaoStandards);
  initGuidedNavigation(data.snapshotModel);
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

function initGuidedNavigation(snapshotModel) {
  const tabs = document.querySelectorAll("[data-guided-tab]");
  const panels = document.querySelectorAll("[data-guided-panel]");
  const propertyContext = document.getElementById("propertyViewContext");
  const guidedPath = document.querySelector(".guided-path-nav");
  const sectionIds = [...tabs].map(tab => tab.dataset.guidedTab);
  const visitedSteps = new Set();
  const legacyViewMap = {
    property: "your-property",
    market: "market-area",
    county: "county-equalization",
    statewide: "state-context"
  };

  function stepForTarget(target) {
    return document.getElementById(target)?.closest("[data-guided-panel]")?.dataset.guidedPanel;
  }

  function selectStep(selected, options = {}) {
    const { scrollTop = true, markVisited = true } = options;

    if (markVisited && sectionIds.includes(selected)) {
      visitedSteps.add(selected);
    }

    tabs.forEach(item => {
      const active = item.dataset.guidedTab === selected;
      const complete = visitedSteps.has(item.dataset.guidedTab) && !active;
      item.classList.toggle("guided-step-active", active);
      item.classList.toggle("guided-step-complete", complete);
      item.setAttribute("aria-selected", String(active));
    });

    panels.forEach(panel => {
      panel.classList.toggle("hidden", panel.dataset.guidedPanel !== selected);
    });

    propertyContext?.classList.toggle("hidden", selected === "your-property");
    renderViewHeader(selected, snapshotModel);
    window.dispatchEvent(new Event("resize"));

    if (scrollTop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      selectStep(tab.dataset.guidedTab);
    });
  });

  document.querySelectorAll("[data-guided-next]").forEach(button => {
    button.addEventListener("click", () => {
      selectStep(button.dataset.guidedNext);
    });
  });

  document.querySelectorAll("[data-view-link]").forEach(link => {
    link.addEventListener("click", () => {
      const target = document.getElementById(link.dataset.jumpTarget);
      const selected = legacyViewMap[link.dataset.viewLink] ?? stepForTarget(link.dataset.jumpTarget) ?? "your-property";

      selectStep(selected, { scrollTop: false });
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
        selectStep(targetStep, { scrollTop: false });
      }
      history.pushState(null, "", `#${target.id}`);
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.classList.add("jump-target-active");
      window.setTimeout(() => target.classList.remove("jump-target-active"), 1400);
    });
  });

  const hashTarget = window.location.hash?.slice(1);
  const initialStep = hashTarget ? stepForTarget(hashTarget) : sectionIds[0];
  selectStep(initialStep || sectionIds[0], { scrollTop: false });
  initGuidedPathStickiness(guidedPath);
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

  document.querySelectorAll("[data-fpo-link]").forEach(link => {
    link.addEventListener("click", event => event.preventDefault());
  });

  links.forEach(link => {
    link.addEventListener("click", () => {
      const selected = link.dataset.footerTarget;

      links.forEach(item => {
        const active = item.dataset.footerTarget === selected;
        item.classList.toggle("footer-link-active", active);
        item.classList.toggle("text-slate-600", !active);
      });

      panels.forEach(panel => {
        panel.classList.toggle("hidden", panel.dataset.footerPanel !== selected);
      });

      document.getElementById("footerContent")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}
