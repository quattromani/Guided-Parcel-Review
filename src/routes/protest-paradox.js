import { escapeHtml } from "../utils/html.js?v=befd9ce";
import {
  installGuideUtilityLanguage,
  renderArticleEntryPanel as renderGesArticleEntryPanel,
  renderArticleTags as renderGesArticleTags,
  renderContinuationModule,
  renderResourcesBlock as renderGesResourcesBlock,
  renderSectionHeader as sectionHeader,
  renderSourceNote
} from "../ges/article-components.js?v=befd9ce";
import { createGesArticleShell } from "../ges/shell.js?v=befd9ce";
import {
  installGesReadingProgress,
  renderGesReadingProgressEndMarker
} from "../ges/reading-progress.js?v=befd9ce";
import { assessmentUpProtestDeniedTaxesArticle as articleSource } from "../content/articles/assessment-up-protest-denied-taxes.js?v=befd9ce";
import { trackArticleInteraction, trackArticleScrollDepth } from "../visit-analytics.js?v=befd9ce";

const EDITORIAL_ICON_SPRITE = "assets/icons/editorial/sprite.svg";
const ARTICLE_SECTIONS = articleSource.sections;
const ARTICLE_ID = articleSource.id;
const ARTICLE_SLUG = articleSource.slug;
const ARTICLE_LEGACY_QUERY_VALUE = articleSource.legacyQueryValue;
const ARTICLE_CANONICAL_PATH = articleSource.canonicalPath;
const ARTICLE_TITLE = articleSource.title;
const ARTICLE_SUBTITLE = articleSource.subtitle;
const ARTICLE_AUTHOR = articleSource.author;
const ARTICLE_AUTHOR_EMAIL = articleSource.authorEmail;
const ARTICLE_AUTHOR_TITLE = articleSource.authorTitle;
const ARTICLE_AUTHOR_IMAGE = articleSource.assets.authorImage;
const ARTICLE_LOCATION = articleSource.location;
const ARTICLE_TAGS = articleSource.tags ?? [ARTICLE_LOCATION].filter(Boolean);
const ARTICLE_DISPLAY_DATE = articleSource.displayDate;
const ARTICLE_PUBLISHED_DATE = articleSource.publishedDate;
const ARTICLE_MODIFIED_DATE = articleSource.modifiedDate;
const ARTICLE_DESCRIPTION = articleSource.description;
const ARTICLE_SOCIAL_IMAGE = articleSource.assets.socialImage;
const ARTICLE_HERO_IMAGE_ALT = articleSource.assets.heroImageAlt;
const ARTICLE_WORD_COUNT = articleSource.reading.wordCount;
const ARTICLE_READING_TIME_MINUTES = articleSource.reading.minutes;
const ARTICLE_READING_TIME = `PT${ARTICLE_READING_TIME_MINUTES}M`;
const ARTICLE_LENGTH_LABEL = articleSource.reading.lengthLabel ?? "field-note";
const PRINTABLE_GUIDE_PDF = articleSource.assets.printableGuidePdf;
const ARTICLE_DEPTH_MILESTONES = [25, 50, 75, 100];
const ARTICLE_KEYWORDS = articleSource.keywords;
const ARTICLE_REFERENCES = articleSource.references ?? {};
const ARTICLE_RESOURCES_BLOCK = articleSource.resourcesBlock ?? articleSource.sourcesUsed;
const ARTICLE_SOURCE_NOTES = articleSource.sourceNotes ?? {};
const CASE_TIMELINE = articleSource.timeline;
const LEARNING_POINTS = articleSource.learningPoints;
const FRAMEWORK_STEPS = articleSource.frameworkSteps;
const COMPONENT_CHANGES = articleSource.componentChanges;
const CALCULATOR_INPUTS = articleSource.calculatorInputs;
const ARTICLE_AUTHOR_MAILTO = `mailto:${ARTICLE_AUTHOR_EMAIL}?subject=${encodeURIComponent(`Re: ${ARTICLE_TITLE}`)}`;

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
  const authorImageUrl = absoluteUrl(ARTICLE_AUTHOR_IMAGE);

  document.title = `${ARTICLE_TITLE} | Guided Parcel Review`;
  setCanonicalLink(canonicalUrl);
  setMeta("description", ARTICLE_DESCRIPTION);
  setMeta("author", ARTICLE_AUTHOR);
  setMeta("keywords", ARTICLE_KEYWORDS.join(", "));
  setMeta("article:word_count", String(ARTICLE_WORD_COUNT));
  setMeta("article:reading_time", ARTICLE_READING_TIME);
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
          name: ARTICLE_AUTHOR,
          image: authorImageUrl
        },
        publisher: {
          "@type": "Organization",
          name: "Guided Parcel Review",
          url: window.location.origin
        },
        datePublished: ARTICLE_PUBLISHED_DATE,
        dateModified: ARTICLE_MODIFIED_DATE,
        wordCount: ARTICLE_WORD_COUNT,
        timeRequired: ARTICLE_READING_TIME,
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
  return `<p class="prose">${escapeHtml(text)}</p>`;
}

function paragraphs(items = []) {
  return items.map(paragraph).join("");
}

function listMarkup(items) {
  return `
    <ul>
      ${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
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
    <article class="ges-stat-card">
      <span class="ges-stat-card__label">${escapeHtml(label)}</span>
      <strong class="ges-stat-card__value" ${outputName ? `data-model-output="${escapeHtml(outputName)}"` : ""}>${escapeHtml(value)}</strong>
      ${detail ? `<p>${escapeHtml(detail)}</p>` : ""}
    </article>
  `;
}

function renderArticleTags() {
  return renderGesArticleTags(ARTICLE_TAGS);
}

function renderArticleEntryPanel() {
  return renderGesArticleEntryPanel({
    articleTitle: ARTICLE_TITLE,
    authorImage: ARTICLE_AUTHOR_IMAGE,
    authorMailto: ARTICLE_AUTHOR_MAILTO,
    authorName: ARTICLE_AUTHOR,
    authorTitle: ARTICLE_AUTHOR_TITLE,
    displayDate: ARTICLE_DISPLAY_DATE,
    icon: editorialIcon,
    printableLabel: "Print Version",
    printableUrl: PRINTABLE_GUIDE_PDF,
    readingMinutes: ARTICLE_READING_TIME_MINUTES,
    wordCount: ARTICLE_WORD_COUNT,
    lengthLabel: ARTICLE_LENGTH_LABEL
  });
}

function renderLearningSection() {
  const section = ARTICLE_SECTIONS.learning;

  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section ges-opening-section" data-tone="information" aria-labelledby="learningTitle">
      <div class="editorial-narrow ges-section-lead">
        ${renderArticleEntryPanel()}
        ${sectionHeader(section.kicker, section.title, "learningTitle", section)}
      </div>
      <figure class="scorecard" aria-labelledby="learningCardTitle">
        <figcaption id="learningCardTitle">${editorialIcon("process")}<span>What you'll learn</span></figcaption>
        <div>
          <section>
            <h3>${editorialIcon("perspective")}<span>A case study that becomes a practical framework</span></h3>
            ${listMarkup(LEARNING_POINTS)}
          </section>
          <section>
            <h3>${editorialIcon("request")}<span>The practical question</span></h3>
            <p>${escapeHtml(section.practicalQuestion)}</p>
          </section>
        </div>
      </figure>
    </section>
  `;
}

function renderMysterySection() {
  const section = ARTICLE_SECTIONS.mystery;

  return `
    <section class="tax-article-section tax-story-chapter tax-article-opening levy-wide-panel article-section" data-tone="reflection" aria-labelledby="mysteryTitle">
      <div class="editorial-narrow ges-section-lead">
        ${sectionHeader(section.kicker, section.title, "mysteryTitle", section)}
        ${paragraphs(section.paragraphs)}
      </div>
      <figure class="concept-card concept-diagram ges-case-timeline" aria-labelledby="timelineTitle">
        <figcaption id="timelineTitle">${editorialIcon("timeline")}<span>What happened in 2025</span></figcaption>
        <div class="protest-paradox-timeline-card">
          <strong>${escapeHtml(CASE_TIMELINE.date)}</strong>
          ${listMarkup(CASE_TIMELINE.items)}
        </div>
      </figure>
      <figure class="comparison-card" aria-labelledby="valueChangeTitle">
        <figcaption id="valueChangeTitle">${editorialIcon("compare")}<span>The protested value change</span></figcaption>
        <div>
          ${renderStatCard("2024 Value", "$210,510")}
          ${renderStatCard("2025 Value", "$220,510")}
        </div>
        <p class="note-box">${escapeHtml(section.valueChangeNote)}</p>
      </figure>
      ${renderSourceNote(ARTICLE_SOURCE_NOTES.mystery)}
    </section>
  `;
}

function renderTaxResultSection() {
  const section = ARTICLE_SECTIONS.taxResult;

  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="comparison" aria-labelledby="taxResultTitle">
      <div class="editorial-narrow ges-section-lead">
        ${sectionHeader(section.kicker, section.title, "taxResultTitle", section)}
        ${paragraph(section.intro)}
      </div>
      <figure class="scorecard" aria-labelledby="taxKpiTitle">
        <figcaption id="taxKpiTitle">${editorialIcon("market-chart")}<span>Value up, taxes down</span></figcaption>
        <div class="protest-paradox-three-up ges-stat-grid">
          ${renderStatCard("2024 Net Taxes", "$1,463.40", "$210,510 value")}
          ${renderStatCard("2025 Net Taxes", "$1,410.22", "$220,510 value")}
          ${renderStatCard("Tax Change", "-$53.18", "about -3.6%")}
        </div>
      </figure>
      <div class="editorial-narrow">
        ${paragraph(section.closing)}
        ${renderSourceNote(ARTICLE_SOURCE_NOTES.taxResult)}
      </div>
    </section>
  `;
}

function renderFrameworkSection() {
  const section = ARTICLE_SECTIONS.framework;

  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="information" aria-labelledby="frameworkTitle">
      <div class="editorial-narrow ges-section-lead">
        ${sectionHeader(section.kicker, section.title, "frameworkTitle", section)}
        ${paragraph(section.intro)}
      </div>
      <aside class="guided-transition protest-guide-takeaway pull-quote">
        <p>${escapeHtml(section.pullQuote)}</p>
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
  const section = ARTICLE_SECTIONS.compression;

  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="reflection" aria-labelledby="compressionTitle">
      <div class="editorial-narrow">
        ${sectionHeader(section.kicker, section.title, "compressionTitle", section)}
      </div>
      <figure class="concept-card concept-diagram" aria-labelledby="pieTitle">
        <figcaption id="pieTitle">${editorialIcon("market-chart")}<span>Fixed pie vs. growing pie</span></figcaption>
        <article>
          ${paragraphs(section.paragraphs)}
        </article>
      </figure>
      <figure class="scorecard" aria-labelledby="revisitedTitle">
        <figcaption id="revisitedTitle">${editorialIcon("verification")}<span>Case study revisited</span></figcaption>
        <div class="protest-paradox-three-up ges-stat-grid">
          ${renderStatCard("Property Movement", "+4.75%", "The assessment increased.")}
          ${renderStatCard("Effective Rate", "0.695% -> 0.640%", "The net effective tax rate moved down.")}
          ${renderStatCard("Tax Movement", "-$53.18", "The tax bill decreased about 3.6%.")}
        </div>
      </figure>
    </section>
  `;
}

function renderApplySection() {
  const section = ARTICLE_SECTIONS.apply;

  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="action" aria-labelledby="applyTitle">
      <div class="editorial-narrow ges-section-lead">
        ${sectionHeader(section.kicker, section.title, "applyTitle", section)}
        ${paragraphs(section.paragraphs)}
      </div>
      <aside class="guided-transition protest-guide-takeaway pull-quote">
        <p>${escapeHtml(section.pullQuote)}</p>
      </aside>
      <figure class="comparison-card" aria-labelledby="noticeChangeTitle">
        <figcaption id="noticeChangeTitle">${editorialIcon("compare")}<span>The next valuation notice</span></figcaption>
        <div>
          ${renderStatCard("2025 Value", "$220,510")}
          ${renderStatCard("2026 Value", "$285,015")}
        </div>
        <p class="note-box">${escapeHtml(section.noticeChangeNote)}</p>
      </figure>
      <figure class="scorecard" aria-labelledby="componentChangeTitle">
        <figcaption id="componentChangeTitle">${editorialIcon("measurement")}<span>Where the increase occurred</span></figcaption>
        <div class="protest-paradox-three-up ges-stat-grid">
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
  const section = ARTICLE_SECTIONS.calculator;

  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section protest-guide-panel protest-paradox-calculator-section" data-tone="action" aria-labelledby="calculatorTitle">
      <div class="editorial-narrow ges-section-lead">
        ${sectionHeader(section.kicker, section.title, "calculatorTitle", section)}
        ${paragraph(section.intro)}
      </div>
      <figure class="concept-card protest-paradox-calculator ges-tax-impact-calculator" aria-labelledby="calculatorFormTitle">
        <figcaption id="calculatorFormTitle">${editorialIcon("resources")}<span>Your numbers</span></figcaption>
        <form class="case-calculator ges-tax-impact-calculator__form" data-case-calculator aria-label="Inputs for estimating tax impact">
          ${CALCULATOR_INPUTS.map(([name, label, helper, value, format, editable]) => renderCalculatorInput(name, label, helper, value, format, editable)).join("")}
        </form>
        <div class="protest-paradox-result-grid calculator-results ges-stat-grid ges-tax-impact-calculator__results" aria-live="polite">
          ${renderStatCard("Estimated taxes", "$1,713.45", "", "estimatedTaxes")}
          ${renderStatCard("Annual change", "+$303.23", "", "annualChange")}
          ${renderStatCard("Monthly equivalent", "+$25.27", "", "monthlyChange")}
        </div>
      </figure>
      <figure class="comparison-card" aria-labelledby="sameRateTitle">
        <figcaption id="sameRateTitle">${editorialIcon("market-chart")}<span>What if rates never changed?</span></figcaption>
        <p>${escapeHtml(section.sameRateIntro)}</p>
        <div class="protest-paradox-three-up ges-stat-grid">
          ${renderStatCard("Same-rate taxes", "$1,822.75", "", "sameRateTaxes")}
          ${renderStatCard("Annual change", "+$412.53", "", "sameRateAnnualChange")}
          ${renderStatCard("Monthly equivalent", "+$34.38", "", "sameRateMonthlyChange")}
        </div>
        <p class="note-box">${escapeHtml(section.sameRateNote)}</p>
      </figure>
      <figure class="scorecard" aria-labelledby="realWorldTitle">
        <figcaption id="realWorldTitle">${editorialIcon("equalization")}<span>What usually happens in the real world?</span></figcaption>
        <p>${escapeHtml(section.realWorldIntro)}</p>
        <div class="protest-paradox-four-up ges-stat-grid">
          ${renderStatCard("2025 net ETR", "0.640%", "", "currentEtr")}
          ${renderStatCard("Budget growth", "3.00%", "", "budgetGrowth")}
          ${renderStatCard("2026 countywide growth", "9.57%", "", "valueGrowth")}
          ${renderStatCard("Estimated adjusted rate", "0.601%", "", "adjustedEtr")}
        </div>
        <p class="note-box" data-model-output="adjustedEtrMath">0.640% x (1.03 / 1.0957) = 0.601%</p>
      </figure>
      <figure class="scorecard" aria-labelledby="rangeTitle">
        <figcaption id="rangeTitle">${editorialIcon("verification")}<span>What is the most likely range?</span></figcaption>
        <p>${escapeHtml(section.rangeIntro)}</p>
        <div class="protest-paradox-three-up ges-stat-grid">
          ${renderStatCard("Estimated Range", "$250-$350", "annually")}
          ${renderStatCard("Center Estimate", "About $300", "annually")}
          ${renderStatCard("Monthly Equivalent", "$20-$30", "about $25/month at center")}
        </div>
      </figure>
      ${renderSourceNote(ARTICLE_SOURCE_NOTES.calculator)}
      <aside class="guided-transition protest-guide-takeaway pull-quote">
        <p>${escapeHtml(section.pullQuote)}</p>
      </aside>
      <figure class="evidence-matrix" aria-labelledby="calculationDetailTitle">
        <figcaption id="calculationDetailTitle">${editorialIcon("document")}<span>How the estimate was built</span></figcaption>
        <ol class="evidence-path-list">
          <li>
            <section><h3>Step 1</h3><p>Find current tax pressure.</p><p class="evidence-formula" data-model-output="currentEtrMath">$1,410.22 / $220,510 = 0.640%</p></section>
            <section><h3>Step 2</h3><p>Adjust for levy compression.</p><p class="evidence-formula" data-model-output="adjustedEtrMath">0.640% x (1.03 / 1.0957) = 0.601%</p></section>
            <section><h3>Step 3</h3><p>Apply the adjusted rate.</p><p class="evidence-formula" data-model-output="taxMath">$285,015 x 0.601% = $1,713.45</p></section>
          </li>
        </ol>
      </figure>
      <p class="note-box">${escapeHtml(section.disclaimer)}</p>
    </section>
  `;
}

function renderClosingSection() {
  const lesson = ARTICLE_SECTIONS.lesson;
  const closing = ARTICLE_SECTIONS.closing;

  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="reflection" aria-labelledby="lessonTitle">
      <div class="editorial-narrow">
        ${sectionHeader(lesson.kicker, lesson.title, "lessonTitle", lesson)}
      </div>
      <figure class="decision-panel" aria-labelledby="betterQuestionTitle">
        <figcaption id="betterQuestionTitle">${editorialIcon("perspective")}<span>Use this on your next notice</span></figcaption>
        <p class="decision-question">${escapeHtml(lesson.question)}</p>
        <p class="note-box decision-answer"><strong>A better question is:</strong> ${escapeHtml(lesson.betterQuestion)}</p>
      </figure>
    </section>
    <section class="tax-article-section tax-story-chapter tax-article-closing levy-article-narrow article-section" data-tone="reflection" aria-labelledby="finalThoughtTitle">
      ${sectionHeader(closing.kicker, closing.title, "finalThoughtTitle", closing)}
      ${paragraphs(closing.paragraphs)}
      ${renderSourceNote(ARTICLE_SOURCE_NOTES.closing)}
      ${renderGesReadingProgressEndMarker()}
      <aside class="article-share-footer" aria-labelledby="shareArticleTitle">
        <p id="shareArticleTitle">${escapeHtml(closing.sharePrompt)}</p>
        <button type="button" data-article-share data-article-action="share_article" data-article-label="${ARTICLE_TITLE}">${escapeHtml(closing.shareButton)}</button>
        <span data-share-status role="status" aria-live="polite"></span>
      </aside>
      ${renderContinuationModule(closing.continuation, {
        action: "related_article",
        className: "related-article-coda",
        id: "relatedEvidenceGuideTitle",
        titleTag: "p"
      })}
    </section>
  `;
}

function renderArticleResourcesBlock() {
  return renderGesResourcesBlock(ARTICLE_RESOURCES_BLOCK, {
    id: "protestParadoxResources",
    references: ARTICLE_REFERENCES
  });
}

export function isProtestParadoxRequest(searchParams = new URLSearchParams(window.location.search)) {
  return searchParams.get("article") === ARTICLE_LEGACY_QUERY_VALUE
    || searchParams.get("article") === ARTICLE_SLUG
    || normalizedPathname().endsWith(`/${ARTICLE_CANONICAL_PATH}`);
}

export function renderProtestParadox() {
  const shell = createGesArticleShell({
    htmlClasses: ["levy-compression-shell-route"],
    routeName: "protest-paradox"
  });
  if (!shell?.coverRegion) return;
  const canvas = shell.bodyRegion;

  updateMetadata();

  shell.setCover(`
    <header class="comp-page-title levy-page-title article-hero" aria-labelledby="protestParadoxTitle">
      <div class="article-hero-packet">
        <div class="hero-kicker-row">
          <p class="guided-kicker hero-kicker hero-brand-kicker">
            <span class="hero-kicker-text">
              <span class="hero-kicker-label">Article</span>
              <span class="hero-kicker-divider" aria-hidden="true">/</span>
              <span class="hero-kicker-subject">Levy Compression</span>
            </span>
          </p>
        </div>
        <h1 id="protestParadoxTitle" class="hero-title">${ARTICLE_TITLE}</h1>
        <p class="hero-deck">${ARTICLE_SUBTITLE}</p>
        ${renderArticleTags()}
      </div>
      <figure class="article-hero-media hero-media">
        <img src="${escapeHtml(ARTICLE_SOCIAL_IMAGE)}" alt="${escapeHtml(ARTICLE_HERO_IMAGE_ALT)}" loading="eager" decoding="async" />
      </figure>
    </header>
  `);

  shell.setBody(`
    <article class="tax-shorthand-page levy-compression-page protest-evidence-guide-page protest-paradox-page editorial-guide tax-article-panel" data-county-theme="gage" data-ges-reading-progress-target aria-label="Assessment increase and levy compression case study">
      ${renderArticleDepthMarkers()}
      ${renderLearningSection()}
      ${renderMysterySection()}
      ${renderTaxResultSection()}
      ${renderFrameworkSection()}
      ${renderCompressionSection()}
      ${renderApplySection()}
      ${renderCalculatorSection()}
      ${renderClosingSection()}
      ${renderArticleResourcesBlock()}
    </article>
  `);

  installCalculator(canvas);
  installGuideUtilityLanguage(canvas);
  installArticleAnalytics(canvas);
  installGesReadingProgress({ root: canvas });
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
  const shareText = `${ARTICLE_TITLE}\n\n${ARTICLE_DESCRIPTION}\n\n${shareUrl}`;
  const shareData = {
    text: shareText
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      if (status) status.textContent = "Shared.";
      trackArticleInteraction("share_article", {
        articleId: ARTICLE_ID,
        detail: ARTICLE_TITLE,
        targetUrl: shareUrl
      });
      return;
    }

    await copyTextToClipboard(shareText);
    if (status) status.textContent = "Share text copied with the link.";
    trackArticleInteraction("copy_link", {
      articleId: ARTICLE_ID,
      detail: ARTICLE_TITLE,
      targetUrl: shareUrl
    });
  } catch (error) {
    if (error?.name === "AbortError") return;
    if (status) status.textContent = "Copy this page URL from your browser.";
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
