import { escapeHtml } from "../utils/html.js";
import { trackArticleInteraction, trackArticleScrollDepth } from "../visit-analytics.js";

const EDITORIAL_ICON_SPRITE = "assets/icons/editorial/sprite.svg";
const ARTICLE_ID = "protest-paradox";
const ARTICLE_SLUG = "assessment-up-protest-denied-taxes";
const ARTICLE_LEGACY_QUERY_VALUE = "protest-paradox";
const ARTICLE_CANONICAL_PATH = "articles/assessment-up-protest-denied-taxes/";
const ARTICLE_TITLE = "Assessment Up. Protest Denied. Taxes?";
const ARTICLE_SUBTITLE = "A case study showing why property taxes can fall after an assessment increase, and how levy compression changes the tax impact of a valuation notice.";
const ARTICLE_AUTHOR = "Max Quattromani";
const ARTICLE_LOCATION = "Gage County";
const ARTICLE_DISPLAY_DATE = "June 23, 2026";
const ARTICLE_PUBLISHED_DATE = "2026-06-23";
const ARTICLE_MODIFIED_DATE = "2026-06-25";
const ARTICLE_DESCRIPTION = "A Gage County case study showing why property taxes can fall after an assessment increase, and how levy compression changes the tax impact of a valuation notice.";
const ARTICLE_SOCIAL_IMAGE = "assets/images/protest-paradox-share.jpg";
const ARTICLE_HERO_IMAGE_ALT = "Aerial view of rural agricultural land and homes.";
const PRINTABLE_GUIDE_PDF = "assets/guides/assessment-up-protest-denied-taxes.pdf";
const ARTICLE_DEPTH_MILESTONES = [25, 50, 75, 100];
const ARTICLE_KEYWORDS = [
  "property tax levy compression",
  "assessment increase taxes down",
  "Gage County property assessment",
  "property valuation protest",
  "effective tax rate",
  "property tax estimate"
];

const STARTER_VALUES = {
  taxes2025: 1410.22,
  value2025: 220510,
  value2026: 285015,
  valueGrowth: 9.57,
  budgetGrowth: 3
};

const CASE_TIMELINE = [
  "Property owner appeared before the Board of Equalization.",
  "Protest focused on a roughly $10,000 first-acre homesite increase.",
  "Board left valuation unchanged."
];

const LEARNING_POINTS = [
  "Why taxes can fall after an assessment increase",
  "What levy compression actually does",
  "How to estimate the impact of your next notice",
  "Which question matters more than your new value"
];

const FRAMEWORK_STEPS = [
  ["Property Movement", "How much did this property move?", "+4.75%", "The parcel's assessed value moved from $210,510 to $220,510."],
  ["County Movement", "How much did everyone else move?", "Countywide growth", "When many properties increase together, the tax base expands."],
  ["Budget Movement", "How much money did local governments need?", "Budget growth", "Budgets determine how much tax pressure must be collected."]
];

const COMPONENT_CHANGES = [
  ["Land", "$62,690 -> $62,690", "No change"],
  ["Dwelling", "$146,455 -> $210,990", "Major increase"],
  ["Other Improvements", "$11,365 -> $11,335", "Slight decrease"]
];

function normalizedPathname() {
  return window.location.pathname.endsWith("/")
    ? window.location.pathname
    : `${window.location.pathname}/`;
}

function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  const baseUrl = new URL("./", document.baseURI);
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(normalizedPath, baseUrl).href;
}

function setMeta(name, content) {
  if (!content) return;
  let element = document.querySelector(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.append(element);
  }
  element.setAttribute("content", content);
}

function setPropertyMeta(property, content) {
  if (!content) return;
  let element = document.querySelector(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.append(element);
  }
  element.setAttribute("content", content);
}

function setCanonicalLink(url) {
  let element = document.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.append(element);
  }
  element.setAttribute("href", url);
}

function setJsonLd(id, data) {
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement("script");
    element.type = "application/ld+json";
    element.id = id;
    document.head.append(element);
  }
  element.textContent = JSON.stringify(data);
}

function updateMetadata() {
  const canonicalUrl = absoluteUrl(ARTICLE_CANONICAL_PATH);
  const imageUrl = absoluteUrl(ARTICLE_SOCIAL_IMAGE);
  const pdfUrl = absoluteUrl(PRINTABLE_GUIDE_PDF);

  document.title = `${ARTICLE_TITLE} | Guided Parcel Review`;
  setCanonicalLink(canonicalUrl);
  setMeta("description", ARTICLE_DESCRIPTION);
  setMeta("author", ARTICLE_AUTHOR);
  setMeta("keywords", ARTICLE_KEYWORDS.join(", "));
  setMeta("robots", "index, follow, max-image-preview:large");
  setMeta("article:published_time", ARTICLE_PUBLISHED_DATE);
  setMeta("article:modified_time", ARTICLE_MODIFIED_DATE);
  setPropertyMeta("og:type", "article");
  setPropertyMeta("og:site_name", "Guided Parcel Review");
  setPropertyMeta("og:title", ARTICLE_TITLE);
  setPropertyMeta("og:description", ARTICLE_DESCRIPTION);
  setPropertyMeta("og:url", canonicalUrl);
  setPropertyMeta("og:image", imageUrl);
  setPropertyMeta("og:image:width", "1200");
  setPropertyMeta("og:image:height", "630");
  setPropertyMeta("og:image:alt", ARTICLE_HERO_IMAGE_ALT);
  setPropertyMeta("article:published_time", ARTICLE_PUBLISHED_DATE);
  setPropertyMeta("article:modified_time", ARTICLE_MODIFIED_DATE);
  setPropertyMeta("article:author", ARTICLE_AUTHOR);
  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", ARTICLE_TITLE);
  setMeta("twitter:description", ARTICLE_DESCRIPTION);
  setMeta("twitter:image", imageUrl);

  setJsonLd("protest-paradox-jsonld", {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: ARTICLE_TITLE,
        description: ARTICLE_DESCRIPTION,
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: imageUrl,
          contentUrl: imageUrl,
          caption: ARTICLE_HERO_IMAGE_ALT
        },
        datePublished: ARTICLE_PUBLISHED_DATE,
        dateModified: ARTICLE_MODIFIED_DATE,
        inLanguage: "en-US"
      },
      {
        "@type": "Article",
        "@id": `${canonicalUrl}#article`,
        headline: ARTICLE_TITLE,
        alternativeHeadline: ARTICLE_SUBTITLE,
        description: ARTICLE_DESCRIPTION,
        url: canonicalUrl,
        image: imageUrl,
        author: {
          "@type": "Person",
          name: ARTICLE_AUTHOR
        },
        publisher: {
          "@type": "Organization",
          name: "Guided Parcel Review",
          url: window.location.origin
        },
        datePublished: ARTICLE_PUBLISHED_DATE,
        dateModified: ARTICLE_MODIFIED_DATE,
        articleSection: "Property tax education",
        keywords: ARTICLE_KEYWORDS,
        about: [
          "Property tax levy compression",
          "Property valuation protest",
          "Effective tax rate",
          "Gage County property assessments"
        ],
        associatedMedia: {
          "@type": "MediaObject",
          name: "Printable case study PDF",
          contentUrl: pdfUrl,
          encodingFormat: "application/pdf"
        },
        inLanguage: "en-US",
        mainEntityOfPage: {
          "@id": `${canonicalUrl}#webpage`
        }
      }
    ]
  });
}

function editorialIcon(name, className = "") {
  const classes = ["editorial-icon", className].filter(Boolean).join(" ");
  return `
    <svg class="${classes}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <use href="${EDITORIAL_ICON_SPRITE}#icon-${escapeHtml(name)}"></use>
    </svg>
  `;
}

function paragraph(text) {
  return `<p>${escapeHtml(text)}</p>`;
}

function listMarkup(items) {
  return `
    <ul>
      ${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function sectionHeader(kicker, title, id) {
  return `
    <header class="tax-article-header editorial-section-header">
      <p class="guided-kicker">${escapeHtml(kicker)}</p>
      <h2 id="${escapeHtml(id)}">${escapeHtml(title)}</h2>
    </header>
  `;
}

function renderArticleDepthMarkers() {
  return `
    <div class="article-depth-markers" aria-hidden="true">
      ${ARTICLE_DEPTH_MILESTONES.map(depth => `
        <span class="article-depth-marker" data-article-depth-marker="${depth}"></span>
      `).join("")}
    </div>
  `;
}

function money(value, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

function wholeMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function numberFromInput(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(`${value}`.replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPercent(value, digits = 3) {
  if (!Number.isFinite(value)) return "--";
  return `${(value * 100).toFixed(digits)}%`;
}

function formatInputPercent(value, digits = 2) {
  if (!Number.isFinite(value)) return "";
  return `${value.toFixed(digits)}%`;
}

function formatSignedMoney(value) {
  if (!Number.isFinite(value)) return "--";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${money(value)}`;
}

function formatFactor(value) {
  if (!Number.isFinite(value)) return "--";
  return value.toFixed(4).replace(/0+$/g, "").replace(/\.$/g, "");
}

function calculate(values) {
  const currentEtr = values.taxes2025 && values.value2025
    ? values.taxes2025 / values.value2025
    : null;
  const growthFactor = values.valueGrowth > -1
    ? (1 + values.budgetGrowth) / (1 + values.valueGrowth)
    : null;
  const adjustedEtr = Number.isFinite(currentEtr) && Number.isFinite(growthFactor)
    ? currentEtr * growthFactor
    : null;
  const estimatedTaxes = Number.isFinite(adjustedEtr) && values.value2026
    ? values.value2026 * adjustedEtr
    : null;
  const sameRateTaxes = Number.isFinite(currentEtr) && values.value2026
    ? values.value2026 * currentEtr
    : null;
  const annualChange = Number.isFinite(estimatedTaxes) && values.taxes2025
    ? estimatedTaxes - values.taxes2025
    : null;
  const sameRateAnnualChange = Number.isFinite(sameRateTaxes) && values.taxes2025
    ? sameRateTaxes - values.taxes2025
    : null;

  return {
    currentEtr,
    adjustedEtr,
    sameRateTaxes,
    sameRateAnnualChange,
    sameRateMonthlyChange: Number.isFinite(sameRateAnnualChange) ? sameRateAnnualChange / 12 : null,
    estimatedTaxes,
    annualChange,
    monthlyChange: Number.isFinite(annualChange) ? annualChange / 12 : null
  };
}

function renderStatCard(label, value, detail = "", outputName = "") {
  return `
    <article>
      <span>${escapeHtml(label)}</span>
      <strong ${outputName ? `data-model-output="${escapeHtml(outputName)}"` : ""}>${escapeHtml(value)}</strong>
      ${detail ? `<p>${escapeHtml(detail)}</p>` : ""}
    </article>
  `;
}

function renderLearningSection() {
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="information" aria-labelledby="learningTitle">
      <figure class="scorecard" aria-labelledby="learningTitle">
        <figcaption id="learningTitle">${editorialIcon("process")}<span>What you'll learn</span></figcaption>
        <div>
          <section>
            <h3>${editorialIcon("perspective")}<span>A case study that becomes a practical framework</span></h3>
            ${listMarkup(LEARNING_POINTS)}
          </section>
          <section>
            <h3>${editorialIcon("request")}<span>The practical question</span></h3>
            <p>Do not stop at the new value. Ask how the property moved compared with the rest of the tax base.</p>
          </section>
        </div>
      </figure>
    </section>
  `;
}

function renderMysterySection() {
  return `
    <section class="tax-article-section tax-story-chapter tax-article-opening levy-wide-panel article-section" data-tone="reflection" aria-labelledby="mysteryTitle">
      <div class="editorial-narrow">
        ${sectionHeader("1. The Mystery", "A value went up. The protest was denied. The tax bill went down.", "mysteryTitle")}
        ${paragraph("That sounds wrong at first. If the Board left the value unchanged, many homeowners would expect the tax bill to rise too.")}
        ${paragraph("This case shows why assessment change and tax change are related, but not identical.")}
      </div>
      <figure class="concept-card concept-diagram" aria-labelledby="timelineTitle">
        <figcaption id="timelineTitle">${editorialIcon("timeline")}<span>What happened in 2025</span></figcaption>
        <div class="protest-paradox-timeline-card">
          <strong>July 21, 2025</strong>
          ${listMarkup(CASE_TIMELINE)}
        </div>
      </figure>
      <figure class="comparison-card" aria-labelledby="valueChangeTitle">
        <figcaption id="valueChangeTitle">${editorialIcon("compare")}<span>The protested value change</span></figcaption>
        <div>
          ${renderStatCard("2024 Value", "$210,510")}
          ${renderStatCard("2025 Value", "$220,510")}
        </div>
        <p class="note-box">Dollar increase: $10,000. Percent increase: 4.75%.</p>
      </figure>
    </section>
  `;
}

function renderTaxResultSection() {
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="comparison" aria-labelledby="taxResultTitle">
      <div class="editorial-narrow">
        ${sectionHeader("2. Why It Seems Wrong", "The 2025 tax bill moved the other direction", "taxResultTitle")}
        ${paragraph("Even though the Board left the valuation unchanged, the property's 2025 taxes did not increase. They decreased.")}
      </div>
      <figure class="scorecard" aria-labelledby="taxKpiTitle">
        <figcaption id="taxKpiTitle">${editorialIcon("market-chart")}<span>Value up, taxes down</span></figcaption>
        <div class="protest-paradox-three-up">
          ${renderStatCard("2024 Net Taxes", "$1,463.40", "$210,510 value")}
          ${renderStatCard("2025 Net Taxes", "$1,410.22", "$220,510 value")}
          ${renderStatCard("Tax Change", "-$53.18", "about -3.6%")}
        </div>
      </figure>
      <div class="editorial-narrow">
        ${paragraph("Many people assume a higher assessment automatically has to mean higher taxes. This property produced a different outcome: while its assessment was up 4.75%, the final tax bill moved the other direction, down about 3.6%.")}
      </div>
    </section>
  `;
}

function renderFrameworkSection() {
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="information" aria-labelledby="frameworkTitle">
      <div class="editorial-narrow">
        ${sectionHeader("3. The Missing Rule", "Property taxes follow relative movement", "frameworkTitle")}
        ${paragraph("The tax bill is not a direct translation of the valuation notice. The notice changes the starting point. The bill depends on what happened around that property too.")}
      </div>
      <aside class="guided-transition protest-guide-takeaway pull-quote">
        <p>A higher assessment usually means a property is carrying a larger share of the tax base. But a share only matters in context.</p>
      </aside>
      <ol class="process-strip" aria-label="Three-part tax impact framework">
        ${FRAMEWORK_STEPS.map(([label, title, value, detail], index) => `
          <li>
            <div class="process-step-heading">
              ${editorialIcon(index === 0 ? "property-record" : index === 1 ? "equalization" : "hearing-board")}
              <span>${escapeHtml(label)}</span>
            </div>
            <h3>${escapeHtml(title)}</h3>
            <strong>${escapeHtml(value)}</strong>
            <p>${escapeHtml(detail)}</p>
          </li>
        `).join("")}
      </ol>
    </section>
  `;
}

function renderCompressionSection() {
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="reflection" aria-labelledby="compressionTitle">
      <div class="editorial-narrow">
        ${sectionHeader("4. What Levy Compression Means", "The rate can fall when the base grows faster than the budget", "compressionTitle")}
      </div>
      <figure class="concept-card concept-diagram" aria-labelledby="pieTitle">
        <figcaption id="pieTitle">${editorialIcon("market-chart")}<span>Fixed pie vs. growing pie</span></figcaption>
        <article>
          <p>Think of the tax levy as a pie. If the pie, meaning the budget, stays the same size but the table, meaning the tax base, gets much larger, each person's slice can get smaller.</p>
          <p>When many properties rise together, the tax rate does not always need to rise with them. If the tax base grows faster than the budget, tax rates can compress downward.</p>
        </article>
      </figure>
      <figure class="scorecard" aria-labelledby="revisitedTitle">
        <figcaption id="revisitedTitle">${editorialIcon("verification")}<span>Case study revisited</span></figcaption>
        <div class="protest-paradox-three-up">
          ${renderStatCard("Property Movement", "+4.75%", "The assessment increased.")}
          ${renderStatCard("Effective Rate", "0.695% -> 0.640%", "The net effective tax rate moved down.")}
          ${renderStatCard("Tax Movement", "-$53.18", "The tax bill decreased about 3.6%.")}
        </div>
      </figure>
    </section>
  `;
}

function renderApplySection() {
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="action" aria-labelledby="applyTitle">
      <div class="editorial-narrow">
        ${sectionHeader("Part 2 - Apply The Framework", "Ready to apply this yourself?", "applyTitle")}
        ${paragraph("Everything above explained one parcel. Everything below uses the same framework to evaluate a different notice.")}
        ${paragraph("If you have your own notice nearby, this is where the framework becomes useful.")}
      </div>
      <aside class="guided-transition protest-guide-takeaway pull-quote">
        <p>Last year's discussion focused on a roughly $10,000 homesite increase. This year's increase is much larger and comes almost entirely from the dwelling.</p>
      </aside>
      <figure class="comparison-card" aria-labelledby="noticeChangeTitle">
        <figcaption id="noticeChangeTitle">${editorialIcon("compare")}<span>The next valuation notice</span></figcaption>
        <div>
          ${renderStatCard("2025 Value", "$220,510")}
          ${renderStatCard("2026 Value", "$285,015")}
        </div>
        <p class="note-box">Dollar increase: $64,505. Percent increase: 29.25%.</p>
      </figure>
      <figure class="scorecard" aria-labelledby="componentChangeTitle">
        <figcaption id="componentChangeTitle">${editorialIcon("measurement")}<span>Where the increase occurred</span></figcaption>
        <div class="protest-paradox-three-up">
          ${COMPONENT_CHANGES.map(([label, value, detail]) => renderStatCard(label, value, detail)).join("")}
        </div>
      </figure>
    </section>
  `;
}

function renderCalculatorInput(name, label, helper, value, format, editable = false) {
  return `
    <label class="${editable ? "starter-value" : "model-assumption"}">
      ${escapeHtml(label)}
      <small>${escapeHtml(helper)}</small>
      <input data-calc-input="${escapeHtml(name)}" ${editable ? `data-default-value="${escapeHtml(value)}"` : ""} data-format="${escapeHtml(format)}" inputmode="decimal" value="${escapeHtml(value)}" />
    </label>
  `;
}

function renderCalculatorSection() {
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section protest-guide-panel protest-paradox-calculator-section" data-tone="action" aria-labelledby="calculatorTitle">
      <div class="editorial-narrow">
        ${sectionHeader("7. Apply The Framework", "Estimate your tax impact", "calculatorTitle")}
        ${paragraph("Start with your own numbers. The case-study values are loaded as starter values.")}
      </div>
      <section class="concept-card protest-paradox-calculator" aria-labelledby="calculatorFormTitle">
        <figcaption id="calculatorFormTitle">${editorialIcon("resources")}<span>Your numbers</span></figcaption>
        <form class="case-calculator" data-case-calculator aria-label="Inputs for estimating tax impact">
          ${renderCalculatorInput("taxes2025", "Last year's tax bill", "Editable field - case-study starter", "$1,410.22", "money-cents", true)}
          ${renderCalculatorInput("value2025", "Last year's value", "Editable field - case-study starter", "$220,510", "money-whole", true)}
          ${renderCalculatorInput("value2026", "This year's value", "Editable field - case-study starter", "$285,015", "money-whole", true)}
          ${renderCalculatorInput("valueGrowth", "2026 countywide value growth", "Observed county input", "9.57%", "percent")}
          ${renderCalculatorInput("budgetGrowth", "Estimated budget growth", "Planning assumption", "3.00%", "percent")}
        </form>
        <div class="protest-paradox-result-grid calculator-results" aria-live="polite">
          ${renderStatCard("Estimated taxes", "$1,713.45", "", "estimatedTaxes")}
          ${renderStatCard("Annual change", "+$303.23", "", "annualChange")}
          ${renderStatCard("Monthly equivalent", "+$25.27", "", "monthlyChange")}
        </div>
      </section>
      <figure class="comparison-card" aria-labelledby="sameRateTitle">
        <figcaption id="sameRateTitle">${editorialIcon("market-chart")}<span>What if rates never changed?</span></figcaption>
        <p>This is often the first calculation taxpayers make. If the 2025 net effective tax rate stayed the same, the 2026 value would produce a larger increase before any levy compression.</p>
        <div class="protest-paradox-three-up">
          ${renderStatCard("Same-rate taxes", "$1,822.75", "", "sameRateTaxes")}
          ${renderStatCard("Annual change", "+$412.53", "", "sameRateAnnualChange")}
          ${renderStatCard("Monthly equivalent", "+$34.38", "", "sameRateMonthlyChange")}
        </div>
        <p class="note-box">Baseline only - not the likely outcome.</p>
      </figure>
      <figure class="scorecard" aria-labelledby="realWorldTitle">
        <figcaption id="realWorldTitle">${editorialIcon("equalization")}<span>What usually happens in the real world?</span></figcaption>
        <p>Most properties moved too. The tax base expanded. If countywide value growth outpaces budget growth, levy rates often compress.</p>
        <div class="protest-paradox-four-up">
          ${renderStatCard("2025 net ETR", "0.640%", "", "currentEtr")}
          ${renderStatCard("Budget growth", "3.00%", "", "budgetGrowth")}
          ${renderStatCard("2026 countywide growth", "9.57%", "", "valueGrowth")}
          ${renderStatCard("Estimated adjusted rate", "0.601%", "", "adjustedEtr")}
        </div>
        <p class="note-box" data-model-output="adjustedEtrMath">0.640% x (1.03 / 1.0957) = 0.601%</p>
      </figure>
      <figure class="scorecard" aria-labelledby="rangeTitle">
        <figcaption id="rangeTitle">${editorialIcon("verification")}<span>What is the most likely range?</span></figcaption>
        <p>After the baseline is adjusted for county movement and budget movement, the likely outcome is much smaller than the value increase alone might suggest.</p>
        <div class="protest-paradox-three-up">
          ${renderStatCard("Estimated Range", "$250-$350", "annually")}
          ${renderStatCard("Center Estimate", "About $300", "annually")}
          ${renderStatCard("Monthly Equivalent", "$20-$30", "about $25/month at center")}
        </div>
      </figure>
      <aside class="guided-transition protest-guide-takeaway pull-quote">
        <p>Most taxpayers begin with a valuation notice. Most elected officials begin with a budget. The tax bill is produced somewhere in the middle.</p>
      </aside>
      <figure class="evidence-matrix" aria-labelledby="calculationDetailTitle">
        <figcaption id="calculationDetailTitle">${editorialIcon("document")}<span>How the estimate was built</span></figcaption>
        <ol class="evidence-path-list">
          <li>
            <section><h3>Step 1</h3><p>Find current tax pressure.</p><p data-model-output="currentEtrMath">$1,410.22 / $220,510 = 0.640%</p></section>
            <section><h3>Step 2</h3><p>Adjust for levy compression.</p><p data-model-output="adjustedEtrMath">0.640% x (1.03 / 1.0957) = 0.601%</p></section>
            <section><h3>Step 3</h3><p>Apply the adjusted rate.</p><p data-model-output="taxMath">$285,015 x 0.601% = $1,713.45</p></section>
          </li>
        </ol>
      </figure>
      <p class="note-box">This is not a precise tax bill prediction. It is a directional estimate based on historical levy behavior, countywide value growth, and reasonable budget assumptions.</p>
    </section>
  `;
}

function renderClosingSection() {
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="reflection" aria-labelledby="lessonTitle">
      <div class="editorial-narrow">
        ${sectionHeader("8. The Bigger Lesson", "The question that changes everything", "lessonTitle")}
      </div>
      <figure class="decision-panel" aria-labelledby="betterQuestionTitle">
        <figcaption id="betterQuestionTitle">${editorialIcon("perspective")}<span>Use this on your next notice</span></figcaption>
        <p class="decision-question">Most homeowners ask: What is my new value?</p>
        <p class="note-box"><strong>A better question is:</strong> How did my property move compared with everyone else?</p>
      </figure>
    </section>
    <section class="tax-article-section tax-story-chapter tax-article-closing levy-article-narrow article-section" data-tone="reflection" aria-labelledby="finalThoughtTitle">
      ${sectionHeader("One Final Thought", "Accuracy compounds", "finalThoughtTitle")}
      ${paragraph("Fairness begins with accurate and consistent treatment. Sometimes a property is measured incorrectly, classified incorrectly, or positioned differently than comparable properties. When that happens, a review process helps ensure that each property carries its appropriate share of the tax burden.")}
      ${paragraph("In this case, the protest focused on a $10,000 increase to the property's first-acre homesite value. Similar adjustments were applied broadly to comparable properties throughout the county based on market studies used to establish site values. Because many similar properties moved together, the adjustment had relatively little effect on the property's position within the larger tax base.")}
      ${paragraph("A protest or equalization review focuses on how a property compares with its peers. The tax bill that follows reflects something larger: how that property moved relative to other properties, how the overall tax base changed, and how much local governments decide to collect.")}
      ${paragraph("Sometimes a review results in an adjustment. Sometimes it confirms that a property was already positioned appropriately within the broader tax base. Both outcomes have value. One corrects the record. The other confirms it.")}
      ${paragraph("The valuation process helps determine where a property fits within the system. The tax bill reflects how that system moves as a whole. Both questions matter.")}
      <p class="tax-article-final-source">Sources: Gage County property record card for parcel 004817000, generated June 23, 2026; Nebraska Taxes Online tax-year records for parcel 0004817000; 2026 Gage County Report and Opinion (R&amp;O).</p>
      <aside class="article-share-footer" aria-labelledby="shareArticleTitle">
        <p id="shareArticleTitle">Know someone trying to make sense of a valuation notice and a tax bill moving in different directions?</p>
        <button type="button" data-article-share data-article-action="share_article" data-article-label="${ARTICLE_TITLE}">Share this case study</button>
        <span data-share-status role="status" aria-live="polite"></span>
      </aside>
      <aside class="related-article-coda" aria-labelledby="relatedEvidenceGuideTitle">
        <hr />
        <p id="relatedEvidenceGuideTitle">Need to prepare for the hearing side of the process?</p>
        <a href="articles/before-you-walk-into-a-property-protest/" data-article-action="related_article" data-article-label="Before You Walk Into a Property Protest">Read the companion guide: <span>Before You Walk Into a Property Protest</span></a>
      </aside>
    </section>
  `;
}

export function isProtestParadoxRequest(searchParams = new URLSearchParams(window.location.search)) {
  return searchParams.get("article") === ARTICLE_LEGACY_QUERY_VALUE
    || searchParams.get("article") === ARTICLE_SLUG
    || normalizedPathname().endsWith(`/${ARTICLE_CANONICAL_PATH}`);
}

export function renderProtestParadox() {
  const pageTitle = document.getElementById("pageTitle");
  const canvas = document.querySelector(".mobile-review-canvas");
  if (!canvas) return;

  updateMetadata();
  document.documentElement.classList.add("article-shell-route", "levy-compression-shell-route");
  document.querySelector(".guide-review-header")?.classList.add("hidden");
  document.querySelectorAll("[data-guided-panel]").forEach(panel => panel.classList.add("hidden"));
  document.querySelector("[data-footer-resource-shell]")?.classList.add("hidden");

  pageTitle.innerHTML = `
    <header class="comp-page-title levy-page-title article-hero" aria-labelledby="protestParadoxTitle">
      <div class="article-hero-packet">
        <div class="hero-kicker-row">
          ${editorialIcon("market-chart", "editorial-icon-sm hero-kicker-icon")}
          <p class="guided-kicker hero-kicker">Case Study / Levy Compression</p>
        </div>
        <h1 id="protestParadoxTitle" class="hero-title">${ARTICLE_TITLE}</h1>
        <p class="hero-deck">${ARTICLE_SUBTITLE}</p>
        <div class="hero-meta" aria-label="Article information">
          <p>Prepared by ${ARTICLE_AUTHOR}</p>
          <p>${ARTICLE_DISPLAY_DATE} · ${ARTICLE_LOCATION}</p>
        </div>
        <div class="hero-action">
          <a class="article-print-cta" href="${PRINTABLE_GUIDE_PDF}" download data-article-action="download_pdf" data-article-label="Printable case study PDF">Prefer paper? Download the printable case study.</a>
        </div>
      </div>
      <figure class="article-hero-media hero-media">
        <img src="${escapeHtml(ARTICLE_SOCIAL_IMAGE)}" alt="${escapeHtml(ARTICLE_HERO_IMAGE_ALT)}" loading="eager" decoding="async" />
      </figure>
    </header>
  `;

  canvas.innerHTML = `
    <article class="tax-shorthand-page levy-compression-page protest-evidence-guide-page protest-paradox-page editorial-guide tax-article-panel" aria-label="Assessment increase and levy compression case study">
      ${renderArticleDepthMarkers()}
      ${renderLearningSection()}
      ${renderMysterySection()}
      ${renderTaxResultSection()}
      ${renderFrameworkSection()}
      ${renderCompressionSection()}
      ${renderApplySection()}
      ${renderCalculatorSection()}
      ${renderClosingSection()}
    </article>
  `;

  installCalculator(canvas);
  installArticleAnalytics(canvas);
}

function readValues(root = document) {
  const input = key => root.querySelector(`[data-calc-input="${key}"]`)?.value;
  return {
    taxes2025: numberFromInput(input("taxes2025")),
    value2025: numberFromInput(input("value2025")),
    value2026: numberFromInput(input("value2026")),
    valueGrowth: (numberFromInput(input("valueGrowth")) ?? 0) / 100,
    budgetGrowth: (numberFromInput(input("budgetGrowth")) ?? 0) / 100
  };
}

function setOutput(root, name, value) {
  root.querySelectorAll(`[data-model-output="${name}"]`).forEach(element => {
    element.textContent = value;
  });
}

function formatCalculatorInput(input, root) {
  if (input.dataset.defaultValue && input.value.trim() === "") {
    input.value = input.dataset.defaultValue;
  }

  const value = numberFromInput(input.value);
  if (value === null) {
    input.value = "";
    return;
  }

  if (input.dataset.format === "money-cents") input.value = money(value);
  if (input.dataset.format === "money-whole") input.value = wholeMoney(value);
  if (input.dataset.format === "percent") input.value = formatInputPercent(value);
  updateCalculator(root);
}

function updateCalculator(root = document) {
  const values = readValues(root);
  const result = calculate(values);
  const budgetFactor = 1 + values.budgetGrowth;
  const valueFactor = 1 + values.valueGrowth;

  setOutput(root, "currentEtr", formatPercent(result.currentEtr));
  setOutput(root, "valueGrowth", formatPercent(values.valueGrowth, 2));
  setOutput(root, "budgetGrowth", formatPercent(values.budgetGrowth, 2));
  setOutput(root, "adjustedEtr", formatPercent(result.adjustedEtr));
  setOutput(root, "sameRateTaxes", money(result.sameRateTaxes || 0));
  setOutput(root, "sameRateAnnualChange", formatSignedMoney(result.sameRateAnnualChange));
  setOutput(root, "sameRateMonthlyChange", formatSignedMoney(result.sameRateMonthlyChange));
  setOutput(root, "estimatedTaxes", money(result.estimatedTaxes || 0));
  setOutput(root, "annualChange", formatSignedMoney(result.annualChange));
  setOutput(root, "monthlyChange", formatSignedMoney(result.monthlyChange));
  setOutput(root, "currentEtrMath", `${money(values.taxes2025 || 0)} / ${wholeMoney(values.value2025 || 0)} = ${formatPercent(result.currentEtr)}`);
  setOutput(root, "adjustedEtrMath", `${formatPercent(result.currentEtr)} x (${formatFactor(budgetFactor)} / ${formatFactor(valueFactor)}) = ${formatPercent(result.adjustedEtr)}`);
  setOutput(root, "taxMath", `${wholeMoney(values.value2026 || 0)} x ${formatPercent(result.adjustedEtr)} = ${money(result.estimatedTaxes || 0)}`);
}

function installCalculator(root) {
  root.querySelectorAll("[data-calc-input]").forEach(input => {
    input.addEventListener("focus", () => {
      if (!input.dataset.defaultValue || input.value !== input.dataset.defaultValue) return;
      input.value = "";
      updateCalculator(root);
    });
    input.addEventListener("input", () => updateCalculator(root));
    input.addEventListener("change", () => formatCalculatorInput(input, root));
    input.addEventListener("blur", () => formatCalculatorInput(input, root));
    input.addEventListener("keydown", event => {
      if (event.key !== "Enter") return;
      formatCalculatorInput(input, root);
      input.blur();
    });
    formatCalculatorInput(input, root);
  });
  updateCalculator(root);
}

function installArticleAnalytics(canvas) {
  const article = canvas.querySelector(".protest-paradox-page");
  if (!article || article.dataset.analyticsReady === "true") return;
  article.dataset.analyticsReady = "true";

  article.addEventListener("click", event => {
    const link = event.target.closest("[data-article-action]");
    if (!link) return;
    if (link.matches("[data-article-share]")) {
      event.preventDefault();
      shareArticle(link);
      return;
    }
    trackArticleInteraction(link.dataset.articleAction, {
      articleId: ARTICLE_ID,
      detail: link.dataset.articleLabel || link.textContent?.trim() || link.getAttribute("href") || "",
      targetUrl: link.getAttribute("href") || ""
    });
  });

  installArticleDepthTracking(article);
}

async function shareArticle(button) {
  const shareUrl = absoluteUrl(ARTICLE_CANONICAL_PATH);
  const status = button.closest(".article-share-footer")?.querySelector("[data-share-status]");
  const shareData = {
    title: ARTICLE_TITLE,
    text: ARTICLE_DESCRIPTION,
    url: shareUrl
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      status.textContent = "Shared.";
      trackArticleInteraction("share_article", {
        articleId: ARTICLE_ID,
        detail: ARTICLE_TITLE,
        targetUrl: shareUrl
      });
      return;
    }

    await copyTextToClipboard(shareUrl);
    status.textContent = "Link copied.";
    trackArticleInteraction("copy_link", {
      articleId: ARTICLE_ID,
      detail: ARTICLE_TITLE,
      targetUrl: shareUrl
    });
  } catch (error) {
    if (error?.name === "AbortError") return;
    status.textContent = "Copy this page URL from your browser.";
  }
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.inset = "0 auto auto 0";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function calculateArticleScrollDepth(article) {
  const rect = article.getBoundingClientRect();
  const articleTop = window.scrollY + rect.top;
  const articleHeight = Math.max(1, article.offsetHeight - window.innerHeight);
  const progressed = window.scrollY + window.innerHeight - articleTop;
  return Math.max(0, Math.min(100, Math.round(progressed / articleHeight * 100)));
}

function installArticleDepthTracking(article) {
  const markers = Array.from(article.querySelectorAll("[data-article-depth-marker]"));
  const reached = new Set();
  let maxScrollPercent = calculateArticleScrollDepth(article);
  let finalReported = false;
  let ticking = false;

  const reportDepth = (depth, source = "marker") => {
    const scrollPercent = Math.max(0, Math.min(100, Number(depth) || 0));
    if (reached.has(scrollPercent)) return;
    reached.add(scrollPercent);
    maxScrollPercent = Math.max(maxScrollPercent, scrollPercent);
    trackArticleScrollDepth({
      articleId: ARTICLE_ID,
      detail: scrollPercent === 100 ? "scroll_complete" : `scroll_${scrollPercent}`,
      scrollPercent,
      maxScrollPercent,
      reachedBottom: scrollPercent === 100,
      source
    });
  };

  const measureDepth = () => {
    ticking = false;
    maxScrollPercent = Math.max(maxScrollPercent, calculateArticleScrollDepth(article));
    ARTICLE_DEPTH_MILESTONES.forEach(depth => {
      if (maxScrollPercent >= depth) reportDepth(depth, "calculated");
    });
  };

  const requestMeasureDepth = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(measureDepth);
  };

  const reportFinalDepth = () => {
    if (finalReported) return;
    finalReported = true;
    maxScrollPercent = Math.max(maxScrollPercent, calculateArticleScrollDepth(article));
    trackArticleScrollDepth({
      articleId: ARTICLE_ID,
      detail: "scroll_final",
      maxScrollPercent,
      reachedBottom: maxScrollPercent >= 100,
      source: "final"
    });
  };

  if ("IntersectionObserver" in window && markers.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        reportDepth(entry.target.dataset.articleDepthMarker, "marker");
      });
    }, {
      root: null,
      rootMargin: "0px 0px -35% 0px",
      threshold: 0
    });
    markers.forEach(marker => observer.observe(marker));
  }

  window.addEventListener("scroll", requestMeasureDepth, { passive: true });
  window.addEventListener("resize", requestMeasureDepth);
  window.addEventListener("pagehide", reportFinalDepth);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") reportFinalDepth();
  });
  requestMeasureDepth();
}
