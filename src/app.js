import {
  buildCtlSummary,
  buildDistributionChart,
  buildEtrChart,
  buildIndexedChart,
  initMarketAreaView,
  buildOverviewCharts,
  initCountyComparison,
  initAssessmentRatioAnalysis,
  initDemographicsView
} from "./charts.js";
import {
  loadAssessmentCalendar,
  loadAssessmentRatioAnalysis,
  loadCertifiedTaxesLevied,
  loadCountyContext,
  loadPropertyData,
  loadPropertyRecordCard,
  loadPadRatioStatistics,
  loadValuationGroups
} from "./data-service.js";
import { initImageModal } from "./modal.js";
import { renderPage, renderViewHeader } from "./render.js";

async function main() {
  const [data, recordCard, calendar, ctlData, ratioData, countyContext, padRatioData, valuationGroups] = await Promise.all([
    loadPropertyData(),
    loadPropertyRecordCard(),
    loadAssessmentCalendar(),
    loadCertifiedTaxesLevied(),
    loadAssessmentRatioAnalysis(),
    loadCountyContext(),
    loadPadRatioStatistics(),
    loadValuationGroups()
  ]);
  const imageModal = initImageModal(data.assets);

  renderPage(data, imageModal, calendar, recordCard);
  buildIndexedChart(data);
  buildEtrChart(data);
  buildDistributionChart(data);
  buildOverviewCharts(data, ctlData);
  initMarketAreaView(data, recordCard, padRatioData, valuationGroups);
  buildCtlSummary(data, ctlData);
  initCountyComparison(data, ctlData);
  initAssessmentRatioAnalysis(data, ratioData);
  initDemographicsView(countyContext);
  initViewNavigation();
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

function initViewNavigation() {
  const tabs = document.querySelectorAll("[data-view-tab]");
  const panels = document.querySelectorAll("[data-view-panel]");

  function selectView(selected, options = {}) {
    const { scrollTop = true } = options;

    tabs.forEach(item => {
      const active = item.dataset.viewTab === selected;
      item.classList.toggle("view-tab-active", active);
      item.classList.toggle("text-slate-600", !active);
      item.setAttribute("aria-selected", String(active));
    });

    panels.forEach(panel => {
      panel.classList.toggle("hidden", panel.dataset.viewPanel !== selected);
    });

    renderViewHeader(selected);
    window.dispatchEvent(new Event("resize"));

    if (scrollTop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      selectView(tab.dataset.viewTab);
    });
  });

  document.querySelectorAll("[data-view-link]").forEach(link => {
    link.addEventListener("click", () => {
      const target = document.getElementById(link.dataset.jumpTarget);

      selectView(link.dataset.viewLink, { scrollTop: false });
      if (!target) return;

      history.pushState(null, "", `#${target.id}`);
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.classList.add("jump-target-active");
      window.setTimeout(() => target.classList.remove("jump-target-active"), 1400);
    });
  });
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
