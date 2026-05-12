import {
  buildCtlSummary,
  buildDistributionChart,
  buildEqualizationPressureIndex,
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
  loadPropertyManifest,
  loadPropertyData,
  loadPropertyRecordCard,
  loadPadRatioStatistics,
  loadSchoolDistrictColors,
  loadTaxDistrictAuthorities,
  loadValuationGroups,
  loadIaaoStandards,
  getActivePropertyId,
  setActivePropertyId
} from "./data-service.js";
import { initImageModal } from "./modal.js";
import { renderPage, renderViewHeader } from "./render.js";

async function main() {
  const manifest = await loadPropertyManifest();
  const [data, recordCard, calendar, ctlData, ratioData, countyContext, padRatioData, schoolDistrictColors, taxDistrictAuthorities, valuationGroups, iaaoStandards] = await Promise.all([
    loadPropertyData(),
    loadPropertyRecordCard(),
    loadAssessmentCalendar(),
    loadCertifiedTaxesLevied(),
    loadAssessmentRatioAnalysis(),
    loadCountyContext(),
    loadPadRatioStatistics(),
    loadSchoolDistrictColors(),
    loadTaxDistrictAuthorities(),
    loadValuationGroups(),
    loadIaaoStandards()
  ]);
  const imageModal = initImageModal(data.assets);

  initAdminStateTestControl(manifest);
  renderPage(data, imageModal, calendar, recordCard);
  buildIndexedChart(data);
  buildEqualizationPressureIndex(data, ctlData);
  buildEtrChart(data);
  buildDistributionChart(data, schoolDistrictColors);
  buildOverviewCharts(data, ctlData);
  initMarketAreaView(data, recordCard, padRatioData, valuationGroups);
  buildCtlSummary(data, ctlData);
  initCountyComparison(data, ctlData);
  initAssessmentRatioAnalysis(data, ratioData, iaaoStandards);
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

function initAdminStateTestControl(manifest) {
  const container = document.getElementById("adminStateTestControl");
  if (!container || !manifest?.testingSwitcher?.enabled) return;

  const activePropertyId = getActivePropertyId(manifest);

  container.innerHTML = `
    <div class="rounded-xl border border-dashed border-slate-500 bg-slate-700 px-4 py-3 text-white shadow-sm">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="min-w-0">
          <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">Admin state test control · Proof of concept only</p>
          <p class="mt-1 text-sm text-slate-300">Local sample-property switcher. Not production UI, not taxpayer-facing, and not a certified state.</p>
        </div>
        <label class="flex shrink-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-300 sm:min-w-72">
          Active fixture
          <select id="adminPropertyFixtureSelect" class="rounded-lg border-0 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-slate-700 ring-1 ring-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-300">
            ${manifest.properties.map(property => `
              <option value="${property.id}" ${property.id === activePropertyId ? "selected" : ""}>
                ${property.label} · ${property.propertyClass}
              </option>
            `).join("")}
          </select>
        </label>
      </div>
    </div>
  `;

  container.querySelector("#adminPropertyFixtureSelect")?.addEventListener("change", event => {
    setActivePropertyId(event.target.value);
    window.location.reload();
  });
}

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
