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
} from "./charts.js?v=20260701-article-polish-4";
import {
  loadAssessmentCalendar,
  loadAssessmentRatioAnalysis,
  loadCertifiedTaxesLevied,
  loadCountyContext,
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
  loadTaxpayerActionDates,
  loadValuationGroupSampleRecords,
  loadValuationGroups,
  loadIaaoStandards,
  loadAssessmentDateEvents,
  PROPERTY_SELECTION_STORAGE_KEY,
  acceptDirectPropertyRequest,
  hasDirectPropertyRequest
} from "./data-service.js?v=20260701-article-polish-4";
import { applyChartDefaults, applyVisualizationPalette } from "./config/visualization-palettes.js?v=20260701-article-polish-4";
import { initImageModal } from "./modal.js?v=20260701-article-polish-4";
import {
  renderPage,
  renderStartPage,
  renderViewHeader
} from "./render.js?v=20260701-article-polish-4";
import { initGesFieldKit } from "./ges/field-kit.js?v=20260701-article-polish-4";
import { initGlobalHeader } from "./ges/global-header.js?v=20260701-article-polish-4";
import { buildPropertySnapshotModel, withSnapshotModel } from "./snapshot-model.js?v=20260701-article-polish-4";
import {
  getTaxpayerJourneyRoutes,
  getJourneyRoute,
  getRouteForPanel
} from "./config/taxpayer-journey.js?v=20260701-article-polish-4";
import { installCivicJourneyPanels } from "./routes/landing-primer.js?v=20260701-article-polish-4";
import { resourceAliases, resourcesByView } from "./content/route-resources.js?v=20260701-article-polish-4";
import { copy, copyObject, copyTemplate, loadSiteCopy } from "./content/site-copy.js?v=20260701-article-polish-4";
import { renderTaxDistrictAuthorities } from "./views/tax-district-authorities.js?v=20260701-article-polish-4";
import { escapeHtml } from "./utils/html.js?v=20260701-article-polish-4";
import { initAssessorsReport } from "./assessors-report.js?v=20260701-article-polish-4";
import { initAssessmentDatesPanel } from "./assessment-dates.js?v=20260701-article-polish-4";
import { initFirstVisitOrientation, ORIENTATION_STORAGE_KEY } from "./orientation.js?v=20260701-article-polish-4";
import {
  isExperimentIndexRequest,
  renderExperimentsIndex
} from "./routes/experiments-index.js?v=20260701-article-polish-4";
import { renderAmesHighway77ComparableSalesExperiment } from "./routes/ames-highway-77-comparable-sales.js?v=20260701-article-polish-4";
import { renderBeekmanCountryClubComparableSalesExperiment } from "./routes/beekman-country-club-comparable-sales.js?v=20260701-article-polish-4";
import { renderGrantNeighborCompExperiment } from "./routes/grant-neighbor-comps.js?v=20260701-article-polish-4";
import {
  isLevyCompressionPostRequest,
  renderLevyCompressionPost
} from "./routes/levy-compression-post.js?v=20260701-article-polish-4";
import {
  isProtestEvidenceGuideRequest,
  renderProtestEvidenceGuide
} from "./routes/protest-evidence-guide.js?v=20260701-article-polish-4";
import {
  isProtestParadoxRequest,
  renderProtestParadox
} from "./routes/protest-paradox.js?v=20260701-article-polish-4";
import {
  isAssessmentsProtestsLeviesRequest,
  renderAssessmentsProtestsLeviesArticle
} from "./routes/assessments-protests-levies.js?v=20260701-article-polish-4";
import {
  isArticleRollRequest,
  renderArticleRoll
} from "./routes/article-roll.js?v=20260701-article-polish-4";
import {
  isGesPublicPageRequest,
  renderGesPublicPage
} from "./routes/public-pages.js?v=20260701-article-polish-4";
import { renderPropertyInviteIndex } from "./routes/property-invite-index.js?v=20260701-article-polish-4";
import { renderSFifthComparableSalesExperiment } from "./routes/s-fifth-comparable-sales.js?v=20260701-article-polish-4";
import { renderTaxShorthandExperiment } from "./routes/tax-shorthand-experiment.js?v=20260701-article-polish-4";
import { renderWashington1722ComparableSalesExperiment } from "./routes/washington-1722-comparable-sales.js?v=20260701-article-polish-4";
import {
  continueDevelopmentFeatureSampleStart,
  developmentFeatureSampleStartPropertyId
} from "./development-feature.js?v=20260701-article-polish-4";
import {
  configureStepTracking,
  initVisitAnalytics,
  propertyAnalyticsContext,
  trackDirectStartAcknowledged,
  trackDirectStartView,
  trackArticleView,
  trackFormOpen,
  trackParcelView,
  trackResourceClick,
  trackStepView
} from "./visit-analytics.js?v=20260701-article-polish-4";

let officialRealPropertyForms = { forms: [], sourceLinks: [], metadata: {} };
let importantCalendarDates = { dates: [], metadata: {} };
const GAGE_APPROXIMATE_TOTAL_PROPERTY_COUNT = 18222;

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

function loadedPropertyCoverageTokens(propertySwitcher = {}) {
  const loadedPropertyCount = propertySwitcher.records?.length ?? propertySwitcher.manifest?.properties?.length ?? 0;
  const countyPropertyCount = GAGE_APPROXIMATE_TOTAL_PROPERTY_COUNT;
  const coveragePercent = countyPropertyCount && loadedPropertyCount
    ? `${Math.round(loadedPropertyCount / countyPropertyCount * 100)}%`
    : "5%";

  return {
    loadedPropertyCount: loadedPropertyCount.toLocaleString(),
    coveragePercent
  };
}

syncLayoutViewportWidth();
window.addEventListener("resize", syncLayoutViewportWidth, { passive: true });
initGlobalHeader();
initGesFieldKit();

function refreshVisualizationTheme() {
  applyVisualizationPalette();
  applyChartDefaults();

  const chartInstances = window.Chart?.instances ? Object.values(window.Chart.instances) : [];
  chartInstances.forEach(chart => {
    if (typeof chart?.update === "function") chart.update("none");
  });
}

window.addEventListener("ges:themechange", refreshVisualizationTheme);

async function main() {
  await loadSiteCopy();
  applyDocumentCopy();
  refreshVisualizationTheme();
  const searchParams = new URLSearchParams(window.location.search);

  if (isArticleRollRequest()) {
    await renderArticleRoll();
    return;
  }

  if (isGesPublicPageRequest()) {
    renderGesPublicPage();
    return;
  }

  if (isAssessmentsProtestsLeviesRequest(searchParams)) {
    setFooterResourcesVisible(false);
    renderAssessmentsProtestsLeviesArticle();
    trackArticleView({
      contentType: "article",
      articleId: "how-your-property-value-becomes-a-tax-bill",
      articleTitle: "How Your Property Value Becomes a Tax Bill",
      county: "nebraska"
    });
    return;
  }

  const propertySwitcher = await loadPropertySwitcherRecords();
  const developmentFeaturePropertyId = developmentFeatureSampleStartPropertyId(propertySwitcher.manifest);
  const directPropertyRequest = hasDirectPropertyRequest(propertySwitcher.manifest);
  const pendingDirectProperty = propertySwitcher.pendingDirectProperty;
  const experimentView = searchParams.get("experiment");

  if (isLevyCompressionPostRequest(searchParams)) {
    window.__PROPERTY_SWITCHER_CONTEXT__ = propertySwitcher;
    setFooterResourcesVisible(false);
    renderLevyCompressionPost();
    trackArticleView({
      contentType: "article",
      articleId: "levy-compression",
      articleTitle: "Your Assessment Went Up. Does That Mean Your Tax Bill Will Go Up Just as Much?",
      county: "gage"
    });
    return;
  }

  if (isProtestEvidenceGuideRequest(searchParams)) {
    window.__PROPERTY_SWITCHER_CONTEXT__ = propertySwitcher;
    setFooterResourcesVisible(false);
    renderProtestEvidenceGuide();
    trackArticleView({
      contentType: "article",
      articleId: "protest-evidence-guide",
      articleTitle: "Before You Walk Into a Property Protest",
      county: "gage"
    });
    return;
  }

  if (isProtestParadoxRequest(searchParams)) {
    window.__PROPERTY_SWITCHER_CONTEXT__ = propertySwitcher;
    setFooterResourcesVisible(false);
    renderProtestParadox();
    trackArticleView({
      contentType: "case-study",
      articleId: "protest-paradox",
      articleTitle: "Assessment Up. Protest Denied. Taxes?",
      county: "gage",
      parcelId: "004817000"
    });
    return;
  }

  if (isExperimentIndexRequest(searchParams)) {
    window.__PROPERTY_SWITCHER_CONTEXT__ = propertySwitcher;
    setFooterResourcesVisible(false);
    renderExperimentsIndex();
    return;
  }

  if (experimentView === "grant-neighbor-comps") {
    window.__PROPERTY_SWITCHER_CONTEXT__ = propertySwitcher;
    setFooterResourcesVisible(false);
    await renderGrantNeighborCompExperiment(propertySwitcher);
    return;
  }

  if (experimentView === "1301-s-5th-comps") {
    window.__PROPERTY_SWITCHER_CONTEXT__ = propertySwitcher;
    setFooterResourcesVisible(false);
    await renderSFifthComparableSalesExperiment(propertySwitcher);
    return;
  }

  if (experimentView === "ames-highway-77-comps") {
    window.__PROPERTY_SWITCHER_CONTEXT__ = propertySwitcher;
    setFooterResourcesVisible(false);
    await renderAmesHighway77ComparableSalesExperiment(propertySwitcher);
    return;
  }

  if (experimentView === "beekman-country-club-comps") {
    window.__PROPERTY_SWITCHER_CONTEXT__ = propertySwitcher;
    setFooterResourcesVisible(false);
    await renderBeekmanCountryClubComparableSalesExperiment(propertySwitcher);
    return;
  }

  if (experimentView === "1722-washington-comps") {
    window.__PROPERTY_SWITCHER_CONTEXT__ = propertySwitcher;
    setFooterResourcesVisible(false);
    await renderWashington1722ComparableSalesExperiment(propertySwitcher);
    return;
  }

  if (experimentView === "tax-shorthand") {
    setFooterResourcesVisible(false);
    if (!propertySwitcher.activePropertyId) {
      window.__PROPERTY_SWITCHER_CONTEXT__ = propertySwitcher;
      renderTaxShorthandExperiment(propertySwitcher);
      return;
    }

    const [propertyData, recordCard, calendar, valuationGroups, taxDistrictAuthorities, countyContext] = await Promise.all([
      loadPropertyData(),
      loadPropertyRecordCard(),
      loadAssessmentCalendar(),
      loadValuationGroups(),
      loadTaxDistrictAuthorities(),
      loadCountyContext()
    ]);
    const propertySwitcherContext = { ...propertySwitcher, valuationGroups };
    window.__PROPERTY_SWITCHER_CONTEXT__ = propertySwitcherContext;
    const snapshotModel = buildPropertySnapshotModel({
      propertyData,
      recordCard,
      calendar,
      taxDistrictAuthorities,
      valuationGroups
    });
    const data = withSnapshotModel(propertyData, snapshotModel);
    renderTaxShorthandExperiment(propertySwitcherContext, {
      data,
      recordCard,
      snapshotModel,
      countyContext
    });
    return;
  }

  if (experimentView === "property-invite-index") {
    window.__PROPERTY_SWITCHER_CONTEXT__ = propertySwitcher;
    setFooterResourcesVisible(false);
    renderPropertyInviteIndex(propertySwitcher);
    return;
  }

  if (!propertySwitcher.activePropertyId) {
    const [realPropertyForms, assessmentDateEvents, taxpayerActionDates] = await Promise.all([
      loadRealPropertyForms(),
      loadAssessmentDateEvents(),
      loadTaxpayerActionDates()
    ]);

    officialRealPropertyForms = realPropertyForms;
    importantCalendarDates = taxpayerActionDates;
    window.__PROPERTY_SWITCHER_CONTEXT__ = propertySwitcher;
    renderStartPage(propertySwitcher);
    if (pendingDirectProperty) trackDirectStartView(pendingDirectProperty);
    setFooterResourcesVisible(false);
    renderGuidedResourceContent("your-property");
    initAssessmentDatesPanel(assessmentDateEvents);
    initFooterNavigation();
    initFirstVisitOrientation(pendingDirectProperty
      ? {
        force: true,
        primaryButtonLabel: copy("orientation.directPrimaryButtonLabel", "View Property"),
        propertySelectionCopy: copyTemplate(
          "orientation.directPropertySelectionCopy",
          { propertyLabel: escapeHtml(directPropertyDisplayName(pendingDirectProperty)) },
          "This direct link will open {propertyLabel}. Confirm the notice below, then continue to the guided property view."
        ),
        coverageCopy: copyTemplate(
          "orientation.coverageCopy",
          loadedPropertyCoverageTokens(propertySwitcher),
          "This project currently contains {loadedPropertyCount} loaded properties, representing about {coveragePercent} of Gage County parcels. It is not a complete property listing. It contains only static records manually pulled from public sources, so many county properties will not appear in search."
        ),
        onAccepted: () => continueDirectPropertyStart(pendingDirectProperty.id)
      }
      : developmentFeaturePropertyId
      ? {
        force: true,
        primaryButtonLabel: copy("orientation.samplePrimaryButtonLabel", "Start Sample Review"),
        coverageCopy: copyTemplate(
          "orientation.coverageCopy",
          loadedPropertyCoverageTokens(propertySwitcher),
          "This project currently contains {loadedPropertyCount} loaded properties, representing about {coveragePercent} of Gage County parcels. It is not a complete property listing. It contains only static records manually pulled from public sources, so many county properties will not appear in search."
        ),
        onAccepted: () => continueDevelopmentFeatureSampleStart(
          developmentFeaturePropertyId,
          PROPERTY_SELECTION_STORAGE_KEY
        )
      }
      : {
        primaryButtonLabel: copy("orientation.samplePrimaryButtonLabel", "Start Property Search"),
        propertySelectionCopy: copyTemplate(
          "orientation.searchPropertySelectionCopy",
          loadedPropertyCoverageTokens(propertySwitcher),
          "Start by searching for a property by situs address in the search field at the top of the page. If the record is loaded, selecting it opens the guided review."
        ),
        coverageCopy: copyTemplate(
          "orientation.coverageCopy",
          loadedPropertyCoverageTokens(propertySwitcher),
          "This project currently contains {loadedPropertyCount} loaded properties, representing about {coveragePercent} of Gage County parcels. It is not a complete property listing. It contains only static records manually pulled from public sources, so many county properties will not appear in search."
        )
      });
    return;
  }

  const [propertyData, recordCard, calendar, legalReferences, realPropertyForms, ctlData, ratioData, governingOffice, padRatioData, marketPositionData, schoolDistrictColors, valuationGroups, iaaoStandards, assessmentDateEvents, taxpayerActionDates, valuationGroupSampleRecords] = await Promise.all([
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
    loadAssessmentDateEvents(),
    loadTaxpayerActionDates(),
    loadValuationGroupSampleRecords()
  ]);
  officialRealPropertyForms = realPropertyForms;
  importantCalendarDates = taxpayerActionDates;
  setFooterResourcesVisible(true);
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
  const analyticsContext = propertyAnalyticsContext(data, propertySwitcherContext);
  initVisitAnalytics(analyticsContext);
  trackParcelView(analyticsContext);
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
  buildDistributionChart(data, schoolDistrictColors, recordCard);
  buildOverviewCharts(data, ctlData);
  initMarketAreaView(data, recordCard, padRatioData, valuationGroups, iaaoStandards, marketPositionData, valuationGroupSampleRecords);
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
  if (!directPropertyRequest) {
    initFirstVisitOrientation({
      primaryButtonLabel: copy("orientation.continuePrimaryButtonLabel", "Continue to Property Record"),
      propertySelectionCopy: copy("orientation.propertySelectionCopy", "A property review is already loaded. Continue to the Property Record, then move through the guided steps."),
      coverageCopy: copyTemplate(
        "orientation.coverageCopy",
        loadedPropertyCoverageTokens(propertySwitcherContext),
        "This project currently contains {loadedPropertyCount} loaded properties, representing about {coveragePercent} of Gage County parcels. It is not a complete property listing. It contains only static records manually pulled from public sources, so many county properties will not appear in search."
      ),
      onAccepted: () => {}
    });
  }
}

function directPropertyDisplayName(property = {}) {
  return property.situsAddress
    ? `${property.situsAddress} (${property.propertyClass || "property"})`
    : property.label || property.id || "this property";
}

function continueDirectPropertyStart(propertyId) {
  const pendingProperty = window.__PROPERTY_SWITCHER_CONTEXT__?.pendingDirectProperty;
  if (pendingProperty) trackDirectStartAcknowledged(pendingProperty);
  acceptDirectPropertyRequest(propertyId);

  const url = new URL(window.location.href);
  url.searchParams.set("property", propertyId);
  url.searchParams.set("view", "property");
  url.hash = "";
  window.location.assign(url.toString());
}

main().catch(error => {
  console.error(error);
  document.body.innerHTML = `
    <main class="center-x measure-2xl pad-6">
      <section class="review-card">
        <h1 class="type-xl weight-bold text-danger">${copy("site.loadErrorTitle", "Guided Parcel Review could not load")}</h1>
        <p class="space-top-2 type-sm text-primary">${error.message}</p>
      </section>
    </main>
  `;
});

function applyDocumentCopy() {
  document.title = copy("site.documentTitle", document.title);
  document.querySelector("meta[name='description']")?.setAttribute("content", copy("site.description", ""));
  renderStaticContent();
}

function renderStaticContent() {
  // Static shell copy appears in index.html containers before route-specific rendering fills data views.
  const setText = (selector, path, fallback = "") => {
    const element = document.querySelector(selector);
    if (element) element.textContent = copy(path, fallback);
  };
  const setHtml = (selector, path, fallback = "") => {
    const element = document.querySelector(selector);
    if (element) element.innerHTML = copy(path, fallback);
  };
  const setAttr = (selector, attr, path, fallback = "") => {
    const element = document.querySelector(selector);
    if (element) element.setAttribute(attr, copy(path, fallback));
  };

  setAttr(".guided-path-nav", "aria-label", "navigation.ariaLabel", "Guided parcel review path");
  setHtml("[data-guided-progress-status]", "navigation.initialProgress", "You're reviewing <strong>Property Record</strong>");
  setText(".property-details-panel h2", "pages.your-property.propertyDetails.title", "Verify property information");
  setText(".property-details-panel > p", "pages.your-property.propertyDetails.description", "These property details shape the value and tax views ahead. If an item looks incorrect or does not match your property, select the circle on that card or row to mark it for review.");
  setText("[data-report-error]", "pages.your-property.decisionCheck.button", "Open record review");
  setText(".ooda-decision-card .guided-kicker", "pages.your-property.decisionCheck.kicker", "Decision check");
  setText(".ooda-decision-card h2", "pages.your-property.decisionCheck.title", "Does the record look right?");
  setText(".ooda-decision-card > p", "pages.your-property.decisionCheck.body", "Review these facts against what you know about the property. Follow up if the owner, address, land size, class, condition, rooms, garage, improvements, or sketch appears inaccurate or incomplete.");

  setText("#assessment-notice h2", "pages.your-assessment.notice.title", "Prior & Current Assessments");
  setText("#assessment-notice article > p", "pages.your-assessment.notice.description", "Review land, building, other improvements, and total value before connecting those numbers to taxes.");
  setText("#tax-district-authorities h2", "pages.your-taxes.taxDistrictTitle", "Tax district and levy distribution");
  setText("[data-guided-panel='your-taxes'] .guided-transition:first-child p", "pages.your-taxes.transitions.intro", "Start with the tax district and levy mix. The chart shows where the latest gross levy is allocated before the history view.");
  setText("[data-tax-transition='history']", "pages.your-taxes.transitions.history", "Next, read the completed statement years. The table tracks levy, credits, net tax, and effective tax rate; the chart shows the rate pattern.");
  setText("[data-tax-transition='calculation']", "pages.your-taxes.transitions.calculation", "Then break out the latest statement math. This shorthand shows how assessed value and levy become gross tax, then how credits reduce it to net tax.");
  setText("[data-tax-transition='pattern']", "pages.your-taxes.transitions.pattern", "After the statement math, isolate the net-tax pattern. This view shows where the bill peaked and how the latest statement compares with the period average.");
  setText("#equalization-pressure h2", "pages.your-taxes.taxPatternTitle", "Tax bill pattern");
  setText("#equalization-pressure .mt-2", "pages.your-taxes.taxPatternNote", "Dashed line: period average. Points use statement net tax after credits.");
  setText("#county-summary h2", "pages.your-taxes.countyBaseline.title", "Countywide baseline");
  setText("#countyCtlSummaryIntro", "pages.your-taxes.countyBaseline.intro", "Certified values and taxes levied show the broader value base and the public obligations distributed across it before the parcel-level tax step.");
  setText("#county-indexed h2", "pages.your-taxes.countyBaseline.valueTitle", "How are county values and taxes moving?");
  setText("#countyIndexedRangeNote", "pages.your-taxes.countyBaseline.valueDescription", "Values and taxes are indexed to the same starting point so their movement can be compared over time.");
  setText("#county-etr h2", "pages.your-taxes.countyBaseline.rateTitle", "How do county taxes compare with value?");
  setText("#county-etr p", "pages.your-taxes.countyBaseline.rateDescription", "The countywide effective tax rate divides taxes levied by certified value, giving a broad tax-rate baseline.");
  document.querySelectorAll("#county-summary > .chart-source, #county-comparison > .chart-source").forEach(element => {
    element.textContent = copy("pages.your-taxes.countyBaseline.source", "Source: 2019-2025 Nebraska Certificates of Taxes Levied (CTL).");
  });
  setText("#stateContextPromptTitle", "pages.your-taxes.advancedContext.title", "Want a broader comparison?");
  setText(".advanced-context-card p:not([id])", "pages.your-taxes.advancedContext.body", "View this county with statewide CTL patterns and other Nebraska counties without leaving the main review path.");
  setText(".advanced-context-button", "pages.your-taxes.advancedContext.button", "Compare Counties");

  setText("#market-price-context h3", "pages.market-area.priceContext.title", "What prices are represented?");
  setText("#marketPriceContextNote", "pages.market-area.priceContext.description", "Average sale price, average assessed value, and level of value show price context for the selected group.");

  setText("#countyComparisonTitle", "pages.state-context.comparison.title", "How does this county compare?");
  setText("#countyComparisonRangeIntro", "pages.state-context.comparison.description", "This comparison uses the assessment-year range shown in the charts below. It starts with a simple baseline: Nebraska equals 100. A county above 100 has a higher average tax rate than the statewide average; below 100 has a lower rate. Certified values, taxes levied, and average tax rates provide additional context.");
  setText("#county-comparison .guided-kicker", "pages.state-context.comparison.decisionKicker", "Decision check");
  setText("#county-comparison .ooda-inline-note h3", "pages.state-context.comparison.decisionTitle", "Does the county stand out?");
  setText("#county-comparison .ooda-inline-note p:last-child", "pages.state-context.comparison.decisionBody", "The Nebraska = 100 comparison, value growth, tax growth, and average rate movement show whether the local pattern is unusual or broadly typical.");

  setText("[data-footer-resource-shell] h2", "footer.resourceShell.title", "Resources and policies");
  setText("[data-footer-resource-shell] h2 + p", "footer.resourceShell.description", "Need help with what you just reviewed? Find focused answers and forms.");
  setAttr(".footer-site-nav", "aria-label", "footer.siteLinksAriaLabel", "Site links");
  setAttr("[data-reset-property-manifest]", "aria-label", "footer.resetPropertySelection", "Reset property selection");
  setAttr("[data-reset-property-manifest]", "title", "footer.resetPropertySelection", "Reset property selection");

  setText("#assessmentDatesPanel .assessment-dates-dialog-bar .uppercase", "modals.assessmentDates.kicker", "Assessment year reference");
  setText("#assessmentDatesPanel .assessment-dates-dialog-bar .mt-1", "modals.assessmentDates.description", "Nebraska assessment process dates.");
  setAttr("[data-close-assessment-dates]", "aria-label", "modals.assessmentDates.closeLabel", "Close assessment dates");
  setText("#reportErrorModal .app-modal-header .uppercase", "modals.recordCorrection.kicker", "Property record correction request");
  setText("#reportErrorTitle", "modals.recordCorrection.title", "Report a property record discrepancy");
  setText("#reportErrorTitle + p", "modals.recordCorrection.description", "Use this form to request factual record review when parcel, land, dwelling, improvement, or other property details appear inaccurate, incomplete, or misclassified.");
  setAttr("[data-close-report-error]", "aria-label", "modals.recordCorrection.closeLabel", "Close property record correction form");
  setText("#sourceTableModal .app-modal-header .uppercase", "modals.sourceTable.kicker", "Source table");
  setText("#sourceTableModalTitle", "modals.sourceTable.title", "Statement history");
  setAttr("[data-close-source-table]", "aria-label", "modals.sourceTable.closeLabel", "Close expanded source table");
  setAttr("#closeImageModal", "aria-label", "modals.image.closeLabel", "Close expanded image");
  setAttr("#previousImage", "aria-label", "modals.image.previousLabel", "Previous property image");
  setAttr("#nextImage", "aria-label", "modals.image.nextLabel", "Next property image");

  renderFooterPanelCopy();
}

function renderFooterPanelCopy() {
  const panels = copyObject("footer.panels", {});
  Object.entries(panels).forEach(([id, panelCopy]) => {
    const panel = document.querySelector(`[data-footer-panel="${id}"]`);
    if (!panel) return;

    const kicker = panel.querySelector(".uppercase");
    const title = panel.querySelector("h3");
    if (kicker && panelCopy.kicker) kicker.textContent = panelCopy.kicker;
    if (title && panelCopy.title) title.textContent = panelCopy.title;

    if (Array.isArray(panelCopy.notes)) {
      const notes = panel.querySelectorAll(".review-note");
      panelCopy.notes.forEach((note, index) => {
        if (notes[index]) notes[index].textContent = note;
      });
    } else if (panelCopy.body) {
      const body = panel.querySelector("p:not(.uppercase)");
      if (body) body.textContent = panelCopy.body;
    }
  });
}

function initGuidedNavigation(data, options = {}) {
  const snapshotModel = data.snapshotModel;
  const routeList = snapshotModel?.sections?.length ? snapshotModel.sections : getTaxpayerJourneyRoutes();
  const progressRoutes = routeList.filter(route => !route.secondary);
  configureStepTracking(routeList);
  const tabsContainer = document.getElementById("guidedPathTabs");

  if (tabsContainer) {
    tabsContainer.innerHTML = progressRoutes.map((route, index) => `
      <button type="button" data-guided-tab="${route.id}" class="guided-step" aria-label="Step ${index + 1}: ${escapeHtml(route.label)}" aria-selected="false">
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
    if (target === "start") return primarySectionIds[0];
    const normalizedTarget = target === "summary" ? "final-summary" : target;

    const route = routeList.find(item => item.id === normalizedTarget || item.panelId === normalizedTarget);
    return route?.id ?? stepForTarget(normalizedTarget);
  }

  function unlockThrough(target) {
    const targetId = routeIdFor(target);
    if (!isPrimaryRouteId(targetId)) return;

    const targetIndex = primarySectionIds.indexOf(targetId);
    primarySectionIds.slice(0, targetIndex + 1).forEach(id => unlockedSteps.add(id));
  }

  function rememberCompletedBefore(target) {
    const targetId = routeIdFor(target);
    if (!isPrimaryRouteId(targetId)) return;

    const targetIndex = primarySectionIds.indexOf(targetId);
    primarySectionIds.slice(0, targetIndex).forEach(id => visitedSteps.add(id));
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
      guidedProgressStatus.textContent = copy("navigation.startProgress", "Start the guided review");
      if (guidedProgressNext) guidedProgressNext.textContent = "";
      return;
    }

    const routeLabel = progressRoutes[currentIndex]?.label || `Step ${currentIndex + 1}`;
    const compactRouteLabel = routeLabel === "What Changed" ? "What Changed?" : routeLabel;
    const nextRouteLabel = progressRoutes[currentIndex + 1]?.label || "";

    guidedProgressStatus.innerHTML = copyTemplate(
      "navigation.progressTemplate",
      { label: escapeHtml(compactRouteLabel) },
      `You're reviewing <strong>${escapeHtml(compactRouteLabel)}</strong>`
    );
    if (guidedProgressNext) {
      guidedProgressNext.textContent = labelsHiddenProgressQuery.matches && nextRouteLabel
        ? copyTemplate("navigation.nextTemplate", { label: nextRouteLabel }, `Next: ${nextRouteLabel}`)
        : "";
    }
  }

  function renderGuidedTabs(selected) {
    const selectedIndex = primarySectionIds.indexOf(selected);

    tabs.forEach(item => {
      const active = item.dataset.guidedTab === selected;
      const tabIsPrimary = isPrimaryRouteId(item.dataset.guidedTab);
      const primaryIndex = primarySectionIds.indexOf(item.dataset.guidedTab);
      const unlocked = tabIsPrimary ? unlockedSteps.has(item.dataset.guidedTab) : true;
      const terminalComplete = active && item.dataset.guidedTab === finalRouteId && visitedSteps.has(finalRouteId);
      const completedBefore = tabIsPrimary && (visitedSteps.has(item.dataset.guidedTab)
        || (selectedIndex !== -1 && primaryIndex < selectedIndex));
      const complete = (!active && completedBefore) || terminalComplete;
      const future = tabIsPrimary && selectedIndex !== -1 && primaryIndex > selectedIndex && !complete;
      const marker = item.querySelector(".guided-step-marker");

      item.classList.toggle("guided-step-active", active);
      item.classList.toggle("guided-step-complete", complete);
      item.classList.toggle("guided-step-future", future);
      item.disabled = tabIsPrimary && !unlocked;
      item.setAttribute("aria-label", `Step ${primaryIndex + 1}: ${progressRoutes[primaryIndex]?.label || "Guided review"}`);
      item.setAttribute("aria-selected", String(active));
      item.setAttribute("aria-disabled", String(tabIsPrimary && !unlocked));
      if (active) {
        item.setAttribute("aria-current", "step");
      } else {
        item.removeAttribute("aria-current");
      }
      if (marker) {
        marker.textContent = complete ? "✓" : String(primaryIndex + 1);
      }
    });
  }

  function completeFinalStepIfAtPageBottom() {
    if (!finalRouteId || currentGuidedRouteId !== finalRouteId || visitedSteps.has(finalRouteId)) return;

    const panel = document.querySelector(`[data-guided-panel="${finalRoutePanelId}"]`);
    if (!panel || panel.classList.contains("is-hidden")) return;

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
    const previousProgressRouteId = currentGuidedRouteId;

    if (primaryRoute && !unlockedSteps.has(selected)) {
      return false;
    }

    if (route.secondary && progressRouteId) unlockThrough(progressRouteId);
    rememberCompletedBefore(progressRouteId);
    if (previousProgressRouteId && previousProgressRouteId !== progressRouteId && isPrimaryRouteId(previousProgressRouteId)) {
      visitedSteps.add(previousProgressRouteId);
    }

    renderGuidedTabs(progressRouteId || selected);

    panels.forEach(panel => {
      panel.classList.toggle("is-hidden", panel.dataset.guidedPanel !== selectedPanel);
    });

    propertyContext?.classList.remove("is-hidden");
    renderViewHeader(selected, snapshotModel, options.propertySwitcher);
    renderGuidedResourceContent(selected);
    if (selectedPanel === "your-taxes") {
      renderTaxDistrictPanelWhenNeeded();
    }
    if (updateHash && window.location.hash !== `#${selected}`) {
      history.pushState(null, "", `#${selected}`);
    }
    updateGuidedProgressStatus(progressRouteId || selected);
    trackStepView(progressRouteId || selected);
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

  document.addEventListener("click", event => {
    const button = event.target instanceof Element ? event.target.closest("[data-guided-next]") : null;
    if (!button) return;
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

  document.querySelectorAll("[data-report-error]").forEach(button => {
    button.addEventListener("click", () => trackFormOpen("record-correction-request"));
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
    const hashTarget = window.location.hash?.slice(1);
    const hashStep = stepForHashTarget(hashTarget);
    if (!hashStep) return false;
    unlockThrough(hashStep);
    const selected = selectStep(hashStep, { scrollTop: !document.getElementById(hashTarget), updateHash: false });
    if (selected && hashTarget && document.getElementById(hashTarget)) {
      window.setTimeout(() => {
        document.getElementById(hashTarget)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
    return selected;
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
  const aliases = resourceAliases();
  const resourcesCopy = resourcesByView();
  const resourceKey = aliases[viewKey] ?? viewKey;
  const resources = resourcesCopy[resourceKey] ?? resourcesCopy["your-property"];
  const datesContent = document.getElementById("importantCalendarDates");
  const faqTitle = document.getElementById("footerFaqTitle");
  const formsTitle = document.getElementById("footerFormsTitle");
  const faqContent = document.getElementById("footerFaqContent");
  const formsContent = document.getElementById("footerFormsContent");

  if (datesContent) datesContent.innerHTML = renderImportantCalendarDates(resourceKey);
  if (faqTitle) faqTitle.textContent = resources.faqTitle;
  if (formsTitle) formsTitle.textContent = officialRealPropertyForms.metadata?.title ?? "Official real property forms";

  if (faqContent) {
    faqContent.innerHTML = resources.faqs.map(([question, answer]) => `
      <details class="footer-resource-card">
        <summary class="cursor-pointer list-none weight-semibold text-primary">${escapeHtml(question)}</summary>
        <p class="space-top-2 type-sm line-6 text-secondary">${escapeHtml(answer)}</p>
      </details>
    `).join("");
  }

  if (formsContent) {
    formsContent.innerHTML = renderOfficialForms();
  }
}

function importantDatesForView(viewKey) {
  return (importantCalendarDates.dates || [])
    .map(date => ({
      ...date,
      priority: Number(date.routePriority?.[viewKey])
    }))
    .filter(date => Number.isFinite(date.priority))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 4);
}

function renderImportantCalendarDates(viewKey) {
  const dates = importantDatesForView(viewKey);
  const title = importantCalendarDates.metadata?.title ?? "Important Calendar Dates";
  const disclaimer = importantCalendarDates.metadata?.disclaimer
    ?? "Selected dates are shown for orientation only. Official county and state instructions control.";
  const fullCalendarButton = `
    <button type="button" class="important-calendar-action" data-assessment-dates-open aria-controls="assessmentDatesPanel">
      See Full Calendar
    </button>
  `;

  if (!dates.length) {
    return `
      <div class="important-calendar-desktop">
        <div class="important-calendar-header">
          <div>
            <p class="guided-kicker">Calendar reference</p>
            <h3 id="importantCalendarDatesTitle">${escapeHtml(title)}</h3>
          </div>
          ${fullCalendarButton}
        </div>
        <p class="important-calendar-empty">No selected dates are mapped to this step yet.</p>
      </div>
      <details class="important-calendar-mobile">
        <summary>See important dates</summary>
        <div class="important-calendar-mobile-panel">
          <p class="important-calendar-empty">No selected dates are mapped to this step yet.</p>
          ${fullCalendarButton}
        </div>
      </details>
    `;
  }

  const dateList = `
    <div class="important-calendar-list" role="list" aria-labelledby="importantCalendarDatesTitle">
      ${dates.map(renderImportantCalendarDate).join("")}
    </div>
  `;

  return `
    <div class="important-calendar-desktop">
      <div class="important-calendar-header">
        <div>
          <p class="guided-kicker">Calendar reference</p>
          <h3 id="importantCalendarDatesTitle">${escapeHtml(title)}</h3>
          <p>${escapeHtml(disclaimer)}</p>
        </div>
        ${fullCalendarButton}
      </div>
      ${dateList}
    </div>
    <details class="important-calendar-mobile">
      <summary>See important dates</summary>
      <div class="important-calendar-mobile-panel">
        <div>
          <p class="guided-kicker">Calendar reference</p>
          <h3 id="importantCalendarDatesTitleMobile">${escapeHtml(title)}</h3>
          <p>${escapeHtml(disclaimer)}</p>
        </div>
        ${dateList.replace("importantCalendarDatesTitle", "importantCalendarDatesTitleMobile")}
        ${fullCalendarButton}
      </div>
    </details>
  `;
}

function renderImportantCalendarDate(date) {
  return `
    <article class="important-calendar-item" role="listitem">
      <div>
        <p class="important-calendar-date">${escapeHtml(date.dateLabel)}</p>
        <h4>${escapeHtml(date.title)}</h4>
      </div>
      <p>${escapeHtml(date.taxpayerAction)}</p>
    </article>
  `;
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
        <span class="display-block weight-semibold text-primary">${escapeHtml(form.title)}</span>
        <span class="space-top-1 display-block type-xs line-5 text-muted">${escapeHtml(form.note)}</span>
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

function setFooterResourcesVisible(visible) {
  const shell = document.querySelector("[data-footer-resource-shell]");
  if (!shell) return;

  shell.classList.toggle("is-hidden", !visible);
  shell.classList.toggle("footer-resource-shell-nav-only", !visible);
  shell.querySelectorAll("[data-step-footer-resources]").forEach(element => {
    element.classList.toggle("is-hidden", !visible);
  });
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

  let scheduled = false;

  function update() {
    const stuck = guidedPath.getBoundingClientRect().top <= 0;
    guidedPath.classList.toggle("guided-path-nav-stuck", stuck);
  }

  function requestUpdate() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      update();
    });
  }

  function measure() {
    update();
  }

  measure();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", measure);
}

function initFooterNavigation() {
  const links = document.querySelectorAll("[data-footer-target]");
  const panels = document.querySelectorAll("[data-footer-panel]");
  const footerContent = document.getElementById("footerContent");
  const footerResourceShell = document.querySelector("[data-footer-resource-shell]");
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

    footerResourceShell?.classList.remove("is-hidden");
    footerContent?.classList.remove("is-hidden");

    links.forEach(item => {
      const active = item.dataset.footerTarget === selected;
      item.classList.toggle("footer-link-active", active);
      item.classList.toggle("text-secondary", !active);
      item.setAttribute("aria-expanded", String(active));
    });

    panels.forEach(panel => {
      panel.classList.toggle("is-hidden", panel.dataset.footerPanel !== selected);
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
      trackResourceClick(link.dataset.footerTarget || link.textContent?.trim() || "footer-resource");
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
    url.searchParams.delete("developmentFeature");
    url.searchParams.delete("view");
    url.hash = "";

    if (url.toString() === window.location.href) {
      window.location.reload();
    } else {
      window.location.assign(url.toString());
    }
  });
}
