import { createGesArticleShell } from "../ges/shell.js?v=20260709-article-lockdown-1";
import { installGesReadingProgress } from "../ges/reading-progress.js?v=20260701-article-polish-4";
import {
  installGuideUtilityLanguage,
  renderArticleEntryPanel,
  renderArticleHero,
  renderResourcesBlock,
  renderSectionHeader,
  renderSourceNote
} from "../ges/article-components.js?v=20260731-assessment-season-12";
import { assessmentSeasonEndsBudgetSeasonBeginsArticle as ARTICLE } from "../content/articles/assessment-season-ends-budget-season-begins.js?v=20260731-assessment-season-12";
import { escapeHtml } from "../utils/html.js?v=20260701-article-polish-4";
import { trackArticleInteraction, trackArticleScrollDepth } from "../visit-analytics.js?v=20260709-central-timestamp-1";

const EDITORIAL_ICON_SPRITE = "assets/icons/editorial/sprite.svg?v=20260626t";
const CURRENCY = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const WHOLE_DOLLARS = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const SECTIONS = ARTICLE.sections;
const BODY_EMPHASIS = ARTICLE.bodyEmphasis ?? [];
const ARTICLE_ID = ARTICLE.id || ARTICLE.legacyQueryValue;
const ARTICLE_DEPTH_MILESTONES = [25, 50, 75, 100];

function normalizedPathname() {
  return window.location.pathname.endsWith("/") ? window.location.pathname : `${window.location.pathname}/`;
}

function absoluteUrl(path = "") {
  return new URL(path, document.baseURI).href;
}

function metadata() {
  return {
    title: ARTICLE.title,
    documentTitle: `${ARTICLE.title} | Guided Parcel Review`,
    description: ARTICLE.description,
    socialDescription: ARTICLE.socialDescription ?? ARTICLE.description,
    canonicalPath: ARTICLE.canonicalPath,
    pageType: "article",
    ogType: "article",
    robots: "index, follow, max-image-preview:large",
    publishedDate: ARTICLE.publishedDate,
    modifiedDate: ARTICLE.modifiedDate,
    section: "Property tax education",
    tags: ARTICLE.tags,
    keywords: ARTICLE.keywords,
    author: ARTICLE.author,
    socialImage: absoluteUrl(ARTICLE.assets.heroImage),
    socialImageAlt: ARTICLE.assets.heroImageAlt
  };
}

export function isAssessmentSeasonEndsBudgetSeasonBeginsRequest(searchParams = new URLSearchParams(window.location.search)) {
  return searchParams.get("article") === ARTICLE.legacyQueryValue
    || normalizedPathname().endsWith(`/${ARTICLE.canonicalPath}`);
}

export async function renderAssessmentSeasonEndsBudgetSeasonBeginsArticle() {
  const shell = createGesArticleShell({
    htmlClasses: ["assessment-season-route"],
    metadata: metadata(),
    routeName: ARTICLE.id
  });
  if (!shell?.coverRegion) return;

  installStructuredArticleData();
  shell.setCover(renderCover());
  const history = await loadHistory();
  shell.setBody(`
    <article class="assessment-season-article editorial-guide tax-article-panel levy-compression-page" data-county-theme="gage" data-ges-reading-progress-target aria-label="${escapeHtml(ARTICLE.title)}">
      ${renderArticleDepthMarkers()}
      ${renderEntryPanel()}
      ${renderTextSection("status", "assessmentSeasonStatus", "ges-opening-section")}
      ${renderRevaluation()}
      ${renderExample(history)}
      ${renderMechanics()}
      ${renderMarket()}
      ${renderBudgetCalendar()}
      ${renderWatchSection()}
      ${renderTextSection("close", "assessmentSeasonClose", "assessment-season-close")}
      ${renderResourcesBlock(ARTICLE.resourcesBlock, { id: "assessmentSeasonResources", references: ARTICLE.references })}
      <span data-ges-reading-progress-end aria-hidden="true"></span>
    </article>
  `);

  installGuideUtilityLanguage(shell.bodyRegion);
  installHeroAudio(shell.bodyRegion);
  installHistoryChartInteractions(shell.bodyRegion);
  installArticleAnalytics(shell.bodyRegion);
  installGesReadingProgress({ root: shell.bodyRegion });
}

function installStructuredArticleData() {
  const canonicalUrl = absoluteUrl(ARTICLE.canonicalPath);
  const imageUrl = absoluteUrl(ARTICLE.assets.heroImage);
  const audioUrl = absoluteUrl(ARTICLE.assets.audioRead);
  let script = document.querySelector("#assessment-season-article-jsonld");
  if (!script) {
    script = document.createElement("script");
    script.id = "assessment-season-article-jsonld";
    script.type = "application/ld+json";
    document.head.append(script);
  }
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: ARTICLE.title,
    alternativeHeadline: ARTICLE.subtitle,
    description: ARTICLE.description,
    datePublished: ARTICLE.publishedDate,
    dateModified: ARTICLE.modifiedDate,
    author: { "@type": "Person", name: ARTICLE.author },
    publisher: { "@type": "Organization", name: "Guided Parcel Review", url: absoluteUrl("") },
    image: { "@type": "ImageObject", url: imageUrl, caption: ARTICLE.assets.heroImageAlt },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    articleSection: "Property tax education",
    keywords: ARTICLE.keywords,
    wordCount: ARTICLE.wordCount,
    timeRequired: `PT${ARTICLE.readingMinutes}M`,
    associatedMedia: [
      {
        "@type": "MediaObject",
        name: `Printable edition of ${ARTICLE.title}`,
        contentUrl: absoluteUrl(ARTICLE.assets.printableGuidePdf),
        encodingFormat: "application/pdf"
      },
      {
        "@type": "AudioObject",
        name: `Audio version of ${ARTICLE.title}`,
        description: "A listenable audio version of the assessment-season article.",
        contentUrl: audioUrl,
        encodingFormat: "audio/mp4",
        uploadDate: ARTICLE.publishedDate,
        duration: ARTICLE.assets.audioDuration
      }
    ],
    inLanguage: "en-US"
  });
}

function renderArticleDepthMarkers() {
  return `
    <div class="article-depth-markers" aria-hidden="true">
      ${ARTICLE_DEPTH_MILESTONES.map(depth => `<span class="article-depth-marker" data-article-depth-marker="${depth}"></span>`).join("")}
    </div>`;
}

function renderCover() {
  return renderArticleHero({
    articleSlug: ARTICLE.canonicalPath,
    className: "assessment-season-hero",
    currentAsOfDate: ARTICLE.currentAsOfDate,
    displayDate: ARTICLE.displayDate,
    label: "Assessment Season Wrap-Up",
    mediaHtml: `
      <figure class="article-hero-media hero-media assessment-season-hero__media">
        <img src="${escapeHtml(ARTICLE.assets.heroImage)}" alt="${escapeHtml(ARTICLE.assets.heroImageAlt)}" width="1200" height="630" decoding="async" fetchpriority="high" />
        <figcaption class="levy-sr-only">${escapeHtml(ARTICLE.assets.heroImageCredit)}</figcaption>
      </figure>`,
    publishedDate: ARTICLE.publishedDate,
    readingMinutes: ARTICLE.readingMinutes,
    subject: "Gage County Property Tax",
    subtitle: ARTICLE.subtitle,
    title: ARTICLE.title,
    titleId: "assessmentSeasonTitle"
  });
}

function renderEntryPanel() {
  return renderArticleEntryPanel({
    articleTitle: ARTICLE.title,
    authorImage: ARTICLE.assets.authorImage,
    authorMailto: `mailto:${ARTICLE.authorEmail}?subject=${encodeURIComponent(`Re: ${ARTICLE.title}`)}`,
    authorName: ARTICLE.author,
    authorTitle: ARTICLE.authorTitle,
    audioUrl: ARTICLE.assets.audioRead,
    printableLabel: "Print Version",
    printableUrl: ARTICLE.assets.printableGuidePdf,
    shareDescription: ARTICLE.description,
    shareUrl: ARTICLE.canonicalPath
  });
}

function installHeroAudio(root) {
  const wrapper = root.querySelector("[data-hero-audio]");
  if (!wrapper || wrapper.dataset.heroAudioReady === "true") return;
  wrapper.dataset.heroAudioReady = "true";

  const audio = wrapper.querySelector("[data-hero-audio-player]");
  if (!audio) return;

  let expandTracked = false;
  let playTracked = false;
  let completeTracked = false;

  const trackHeroAudio = (action, details = {}) => {
    trackArticleInteraction(action, {
      articleId: ARTICLE_ID,
      detail: "audio article version",
      placement: "hero",
      ...details
    });
  };

  wrapper.addEventListener("toggle", () => {
    if (!wrapper.open || expandTracked) return;
    expandTracked = true;
    trackHeroAudio("audio_article_expand");
  });

  audio.addEventListener("play", () => {
    if (playTracked) return;
    playTracked = true;
    trackHeroAudio("audio_article_play");
  });

  audio.addEventListener("pause", () => {
    if (audio.ended || audio.currentTime <= 0) return;
    trackHeroAudio("audio_article_pause", {
      currentTime: Math.round(audio.currentTime)
    });
  });

  audio.addEventListener("ended", () => {
    if (completeTracked) return;
    completeTracked = true;
    trackHeroAudio("audio_article_complete");
  });
}

function renderEditorialText(text = "") {
  return BODY_EMPHASIS.reduce((html, rule) => {
    const escapedPhrase = escapeHtml(rule.phrase);
    if (!html.includes(escapedPhrase)) return html;
    const tag = rule.tag === "em" ? "em" : "strong";
    return html.replace(escapedPhrase, `<${tag}>${escapedPhrase}</${tag}>`);
  }, escapeHtml(text));
}

function paragraphs(items = []) {
  return items.map(text => `<p class="prose">${renderEditorialText(text)}</p>`).join("");
}

function editorialIcon(name, className = "") {
  const classes = ["editorial-icon", className].filter(Boolean).join(" ");
  return `
    <svg class="${classes}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <use href="${EDITORIAL_ICON_SPRITE}#icon-${escapeHtml(name)}"></use>
    </svg>`;
}

function renderTextSection(key, id, extraClass) {
  const section = SECTIONS[key];
  return `
    <section class="tax-article-section tax-story-chapter article-section ${escapeHtml(extraClass)}" aria-labelledby="${escapeHtml(id)}">
      <div class="editorial-narrow ges-section-lead">
        ${renderSectionHeader(section.kicker, section.title, id)}
        ${paragraphs(section.paragraphs)}
      </div>
    </section>`;
}

function renderWatchSection() {
  const section = SECTIONS.watch;
  const event = section.event;
  return `
    <section class="tax-article-section tax-story-chapter article-section" aria-labelledby="assessmentSeasonWatch">
      <div class="editorial-narrow ges-section-lead">
        ${renderSectionHeader(section.kicker, section.title, "assessmentSeasonWatch")}
        ${paragraphs(section.paragraphs)}
      </div>
      <aside class="meeting-schedule-card assessment-town-hall-card" aria-labelledby="assessmentTownHallTitle">
        <h3 id="assessmentTownHallTitle">${editorialIcon("timeline")}<span>${escapeHtml(event.title)}</span></h3>
        <p class="assessment-town-hall-card__location">
          <strong>${escapeHtml(event.locationName)}</strong>
          <span>${escapeHtml(event.locationRoom)}</span>
          <span>${escapeHtml(event.address)}</span>
        </p>
        <ul>
          <li>
            <a href="${escapeHtml(event.calendarUrl)}" download aria-label="Add ${escapeHtml(event.dateLabel)} at ${escapeHtml(event.timeLabel)} Central Time to calendar" data-article-action="calendar_download" data-article-label="${escapeHtml(event.dateLabel)}">
              <span>${escapeHtml(event.dateLabel)}</span>
              <strong><time datetime="${escapeHtml(event.dateTime)}">${escapeHtml(event.timeLabel)}</time></strong>
              <em>Add to calendar</em>
              <code class="print-calendar-url">${escapeHtml(event.calendarUrl)}</code>
            </a>
          </li>
        </ul>
        <p class="important-inline-note">${escapeHtml(event.note)}</p>
      </aside>
      <div class="editorial-narrow">
        <p class="prose assessment-continuity-bridge">${renderEditorialText(section.closeBridge)}</p>
      </div>
    </section>`;
}

function renderRevaluation() {
  const section = SECTIONS.revaluation;
  return `
    <section class="tax-article-section tax-story-chapter article-section" aria-labelledby="assessmentSeasonRevaluation">
      <div class="editorial-narrow ges-section-lead">
        ${renderSectionHeader(section.kicker, section.title, "assessmentSeasonRevaluation")}
        ${paragraphs(section.paragraphs)}
        <details class="assessment-technical-note">
          <summary>Technical equalization detail</summary>
          <p>${escapeHtml(section.technicalDetail)}</p>
          <p><a href="${escapeHtml(ARTICLE.references.padReports)}">View Nebraska Property Assessment Division reports and opinions</a></p>
        </details>
        <aside class="article-caution-note article-guidance-note assessment-legal-note" aria-labelledby="assessmentLegalNoteTitle">
          <span class="article-guidance-icon" aria-hidden="true">§</span>
          <div>
            <p class="assessment-legal-note__title" id="assessmentLegalNoteTitle">${escapeHtml(section.legalNote.title)}</p>
            <p>${escapeHtml(section.legalNote.text)}</p>
            <p class="assessment-legal-note__sources"><a href="${escapeHtml(ARTICLE.references.statute771301)}">Neb. Rev. Stat. § 77-1301</a><span aria-hidden="true">·</span><a href="${escapeHtml(ARTICLE.references.statute77131103)}">Neb. Rev. Stat. § 77-1311.03</a></p>
          </div>
        </aside>
        <p class="prose assessment-continuity-bridge">${renderEditorialText(section.bridge)}</p>
      </div>
    </section>`;
}

function renderExample(history) {
  return `
    <section class="tax-article-section tax-story-chapter article-section assessment-season-example" aria-labelledby="assessmentSeasonExample">
      <div class="editorial-narrow ges-section-lead">
        ${renderSectionHeader(SECTIONS.example.kicker, SECTIONS.example.title, "assessmentSeasonExample")}
        ${paragraphs(SECTIONS.example.beforeChart)}
      </div>
      <div class="assessment-season-chart-shell">
        ${renderHistoryChart(history)}
        ${renderEndpointCards(history)}
        ${renderCurrentAssessmentNote(history)}
        ${renderHistoryTable(history)}
        ${renderSourceNote({
          label: "Record alignment",
          title: "Nebraska Taxes Online labels each statement by tax year.",
          subtitle: "The chart pairs the value and net tax printed on the same tax-year statement. Payment dates may fall in a later calendar year.",
          url: ARTICLE.references.nto
        })}
      </div>
      <div class="editorial-narrow">
        ${paragraphs(SECTIONS.example.empathy)}
        <aside class="guided-transition assessment-season-guided-transition" aria-label="Key transition">
          <p>${escapeHtml(SECTIONS.example.transition)}</p>
        </aside>
      </div>
    </section>`;
}

function renderCurrentAssessmentNote(rows) {
  const current = rows.find(row => row.assessmentYear === 2026);
  return `<p class="assessment-current-note"><strong>2026:</strong> Assessed value is ${WHOLE_DOLLARS.format(current.assessedValue)}. ${escapeHtml(SECTIONS.example.currentNote)}</p>`;
}

function renderEndpointCards(rows) {
  const start = rows.find(row => row.assessmentYear === 2009);
  const end = rows.find(row => row.assessmentYear === 2025);
  const valueDelta = end.assessedValue - start.assessedValue;
  const taxDelta = end.netTax - start.netTax;
  const valuePercent = (valueDelta / start.assessedValue) * 100;
  const taxPercent = (taxDelta / start.netTax) * 100;

  return `
    <div class="assessment-endpoints" aria-label="Verified changes from tax year 2009 through tax year 2025">
      <article class="assessment-endpoint-card assessment-endpoint-card--value">
        <p>Assessed value</p>
        <div class="assessment-endpoint-card__range">
          <span><small>2009</small><strong>${WHOLE_DOLLARS.format(start.assessedValue)}</strong></span>
          <span class="assessment-endpoint-card__arrow" aria-hidden="true">→</span>
          <span><small>2025</small><strong>${WHOLE_DOLLARS.format(end.assessedValue)}</strong></span>
        </div>
      </article>
      <article class="assessment-endpoint-card assessment-endpoint-card--value" aria-label="Assessed value increased ${valuePercent.toFixed(1)} percent, or ${WHOLE_DOLLARS.format(valueDelta)}">
        <p>Assessed value change</p>
        <div class="assessment-endpoint-card__metrics">
          <div><span>Percentage</span><strong>+${valuePercent.toFixed(1)}%</strong></div>
          <div><span>Dollar change</span><strong>+${WHOLE_DOLLARS.format(valueDelta)}</strong></div>
        </div>
      </article>
      <article class="assessment-endpoint-card assessment-endpoint-card--tax">
        <p>Net taxes</p>
        <div class="assessment-endpoint-card__range">
          <span><small>2009</small><strong>${CURRENCY.format(start.netTax)}</strong></span>
          <span class="assessment-endpoint-card__arrow" aria-hidden="true">→</span>
          <span><small>2025</small><strong>${CURRENCY.format(end.netTax)}</strong></span>
        </div>
      </article>
      <article class="assessment-endpoint-card assessment-endpoint-card--tax" aria-label="Net taxes increased ${taxPercent.toFixed(1)} percent, or ${CURRENCY.format(taxDelta)}">
        <p>Net-tax change</p>
        <div class="assessment-endpoint-card__metrics">
          <div><span>Percentage</span><strong>+${taxPercent.toFixed(1)}%</strong></div>
          <div><span>Dollar change</span><strong>+${CURRENCY.format(taxDelta)}</strong></div>
        </div>
      </article>
    </div>`;
}

function smoothLinePath(points, tension = 0.45) {
  if (!points.length) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;

  return points.slice(0, -1).reduce((path, point, index) => {
    const previous = points[index - 1] ?? point;
    const next = points[index + 1];
    const following = points[index + 2] ?? next;
    const controlOne = {
      x: point.x + ((next.x - previous.x) / 6) * tension,
      y: point.y + ((next.y - previous.y) / 6) * tension
    };
    const controlTwo = {
      x: next.x - ((following.x - point.x) / 6) * tension,
      y: next.y - ((following.y - point.y) / 6) * tension
    };
    return `${path} C${controlOne.x.toFixed(1)},${controlOne.y.toFixed(1)} ${controlTwo.x.toFixed(1)},${controlTwo.y.toFixed(1)} ${next.x.toFixed(1)},${next.y.toFixed(1)}`;
  }, `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`);
}

function filledLinePath(points, baseline) {
  const line = smoothLinePath(points);
  const first = points[0];
  const last = points.at(-1);
  return `${line} L${last.x.toFixed(1)},${baseline} L${first.x.toFixed(1)},${baseline} Z`;
}

function renderHistoryChart(rows) {
  const x = year => 78 + ((year - 2009) / 17) * 802;
  const yValue = value => 218 - ((value - 90000) / 80000) * 138;
  const yTax = value => 478 - ((value - 1700) / 750) * 138;
  const valuePoints = rows.map(row => ({ x: x(row.assessmentYear), y: yValue(row.assessedValue) }));
  const taxRows = rows.filter(row => Number.isFinite(row.netTax));
  const taxPoints = taxRows.map(row => ({ x: x(row.assessmentYear), y: yTax(row.netTax) }));
  const valuePath = smoothLinePath(valuePoints);
  const taxPath = smoothLinePath(taxPoints);
  const ticks = [2009, 2013, 2017, 2021, 2025, 2026];
  const grid = ticks.map(year => `
    <line x1="${x(year)}" y1="76" x2="${x(year)}" y2="226"></line>
    <line x1="${x(year)}" y1="336" x2="${x(year)}" y2="486"></line>
    <text x="${x(year)}" y="528" text-anchor="middle">${year}</text>`).join("");
  const valueGuides = [100000, 130000, 160000].map(value => `<line x1="78" y1="${yValue(value)}" x2="880" y2="${yValue(value)}"></line>`).join("");
  const taxGuides = [1800, 2100, 2400].map(value => `<line x1="78" y1="${yTax(value)}" x2="880" y2="${yTax(value)}"></line>`).join("");
  const yearPoints = rows.map(row => {
    const pointX = x(row.assessmentYear);
    const valueY = yValue(row.assessedValue);
    const hasTax = Number.isFinite(row.netTax);
    const taxY = hasTax ? yTax(row.netTax) : null;
    const tooltipLeft = pointX < 170 ? pointX + 10 : pointX > 790 ? pointX - 180 : pointX - 85;
    const tooltipTop = valueY < 145 ? valueY + 14 : valueY - 74;
    const taxLabel = hasTax ? `Net tax ${CURRENCY.format(row.netTax)}` : "Net tax pending";
    const ariaLabel = `${row.assessmentYear}: assessed value ${WHOLE_DOLLARS.format(row.assessedValue)}; ${hasTax ? `net taxes ${CURRENCY.format(row.netTax)}` : "net tax not yet determined"}`;
    return `
      <g class="assessment-history-chart__year-point" tabindex="0" role="img" aria-label="${escapeHtml(ariaLabel)}">
        <rect class="assessment-history-chart__hit-area" x="${pointX - 22}" y="72" width="44" height="418"></rect>
        <line class="assessment-history-chart__focus-line" x1="${pointX}" y1="76" x2="${pointX}" y2="486"></line>
        <circle class="assessment-history-chart__dot assessment-history-chart__dot--value" cx="${pointX}" cy="${valueY}" r="4.5"></circle>
        ${hasTax ? `<circle class="assessment-history-chart__dot assessment-history-chart__dot--tax" cx="${pointX}" cy="${taxY}" r="4.5"></circle>` : ""}
        <g class="assessment-history-chart__tooltip" transform="translate(${tooltipLeft.toFixed(1)} ${tooltipTop.toFixed(1)})" aria-hidden="true">
          <rect width="170" height="64" rx="9"></rect>
          <text class="assessment-history-chart__tooltip-year" x="10" y="18">${row.assessmentYear}</text>
          <text x="10" y="38">Value ${WHOLE_DOLLARS.format(row.assessedValue)}</text>
          <text x="10" y="55">${escapeHtml(taxLabel)}</text>
        </g>
      </g>`;
  }).join("");

  return `
    <figure class="assessment-history-figure" aria-labelledby="assessmentHistoryTitle assessmentHistoryCaption">
      <div class="assessment-history-figure__heading">
        <p class="guided-kicker">Verified annual history</p>
        <h3 id="assessmentHistoryTitle">One Beatrice Home: <span class="assessment-history-figure__title-break">Assessed Value and Net Taxes Since 2009</span></h3>
      </div>
      <div class="assessment-history-legend" aria-label="Chart legend and interaction instructions">
        <span><i class="assessment-history-legend__swatch assessment-history-legend__swatch--value" aria-hidden="true"></i>Assessed value</span>
        <span><i class="assessment-history-legend__swatch assessment-history-legend__swatch--tax" aria-hidden="true"></i>Net taxes</span>
        <span class="assessment-history-legend__hint">Hover, tap, or focus a year to read its values.</span>
      </div>
      <div class="assessment-history-scroll" tabindex="0" role="region" aria-label="Scrollable two-panel historical chart">
        <svg class="assessment-history-chart" viewBox="0 0 940 550" role="img" aria-labelledby="assessmentChartTitle assessmentChartDesc">
          <title id="assessmentChartTitle">Assessed value above and net taxes below, 2009 through 2026</title>
          <desc id="assessmentChartDesc">The home's assessed value rose from 98,470 dollars in 2009 to 165,395 dollars in 2025 and 166,910 dollars in 2026. Net taxes rose from 1,936 dollars and 28 cents in 2009 to 2,023 dollars and 54 cents in 2025. The 2026 net tax is not yet determined.</desc>
          <defs>
            <linearGradient id="assessmentValueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgb(var(--ges-color-evidence-green))" stop-opacity="0.32"></stop>
              <stop offset="100%" stop-color="rgb(var(--ges-color-evidence-green))" stop-opacity="0.03"></stop>
            </linearGradient>
            <linearGradient id="assessmentTaxFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgb(var(--ges-color-error))" stop-opacity="0.28"></stop>
              <stop offset="100%" stop-color="rgb(var(--ges-color-error))" stop-opacity="0.03"></stop>
            </linearGradient>
          </defs>
          <g class="assessment-history-chart__panels">
            <rect x="58" y="42" width="842" height="198" rx="18"></rect>
            <rect x="58" y="302" width="842" height="198" rx="18"></rect>
          </g>
          <g class="assessment-history-chart__grid">${grid}</g>
          <g class="assessment-history-chart__horizontal-guides">${valueGuides}${taxGuides}</g>
          <text class="assessment-history-chart__panel-title" x="78" y="68">Assessed value</text>
          <text class="assessment-history-chart__panel-title" x="78" y="328">Net taxes</text>
          <path class="assessment-history-chart__area assessment-history-chart__area--value" d="${filledLinePath(valuePoints, 226)}"></path>
          <path class="assessment-history-chart__area assessment-history-chart__area--tax" d="${filledLinePath(taxPoints, 486)}"></path>
          <path class="assessment-history-chart__value" d="${valuePath}"></path>
          <path class="assessment-history-chart__tax" d="${taxPath}"></path>
          <g class="assessment-history-chart__points">${yearPoints}</g>
          <g class="assessment-history-chart__pending-marker" aria-hidden="true">
            <line x1="${x(2026)}" y1="338" x2="${x(2026)}" y2="486"></line>
            <text x="880" y="328" text-anchor="end">2026 net tax pending</text>
          </g>
          <g class="assessment-history-chart__callout">
            <text x="84" y="${yValue(98470) - 12}">$98,470</text>
            <text x="${x(2025)}" y="${yValue(165395) - 12}" text-anchor="middle">$165,395</text>
            <text x="84" y="${yTax(1936.28) - 12}">$1,936.28</text>
            <text x="${x(2025)}" y="${yTax(2023.54) - 12}" text-anchor="middle">$2,023.54</text>
          </g>
        </svg>
      </div>
      <figcaption id="assessmentHistoryCaption">Annual assessed values and net taxes from aligned tax-year records, shown on two panels with a shared year axis.</figcaption>
    </figure>`;
}

function renderHistoryTable(rows) {
  return `
    <details class="assessment-history-table">
      <summary>View the verified annual figures</summary>
      <div class="assessment-history-table__scroll">
        <table>
          <caption>Annual values, net taxes, and available total levies</caption>
          <thead><tr><th scope="col">Tax year</th><th scope="col">Assessed value</th><th scope="col">Net taxes</th><th scope="col">Total levy</th></tr></thead>
          <tbody>${rows.map(row => `<tr><th scope="row">${row.assessmentYear}</th><td>${WHOLE_DOLLARS.format(row.assessedValue)}</td><td>${Number.isFinite(row.netTax) ? CURRENCY.format(row.netTax) : "Not yet determined"}</td><td>${Number.isFinite(row.levy) ? row.levy.toFixed(6) : "Not displayed"}</td></tr>`).join("")}</tbody>
        </table>
      </div>
      <p><a href="${escapeHtml(ARTICLE.assets.dataset)}" download data-article-action="dataset_download" data-article-label="Anonymous annual assessment and tax history CSV">Download the anonymous CSV dataset</a></p>
    </details>`;
}

function installHistoryChartInteractions(root) {
  const chart = root.querySelector(".assessment-history-chart");
  const points = [...root.querySelectorAll(".assessment-history-chart__year-point")];
  if (!chart || !points.length) return;

  const clearPinnedPoint = exception => {
    points.forEach(point => {
      if (point !== exception) point.classList.remove("is-active");
    });
  };

  points.forEach(point => {
    point.addEventListener("click", event => {
      event.stopPropagation();
      const shouldOpen = !point.classList.contains("is-active");
      clearPinnedPoint(point);
      point.classList.toggle("is-active", shouldOpen);
      if (shouldOpen) {
        point.focus({ preventScroll: true });
        const year = point.getAttribute("aria-label")?.match(/^\d{4}/)?.[0] || "";
        trackArticleInteraction("history_chart_year_open", {
          articleId: ARTICLE_ID,
          detail: year ? `tax_year_${year}` : "tax_year",
          placement: "historical_chart"
        });
      }
    });
    point.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      point.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  });

  root.addEventListener("click", event => {
    if (!chart.contains(event.target)) clearPinnedPoint();
  });
}

function installArticleAnalytics(root) {
  const article = root.querySelector(".assessment-season-article");
  if (!article || article.dataset.analyticsReady === "true") return;
  article.dataset.analyticsReady = "true";

  article.addEventListener("click", event => {
    const actionElement = event.target.closest?.("[data-article-action]");
    if (actionElement && article.contains(actionElement)) {
      trackArticleInteraction(actionElement.dataset.articleAction, {
        articleId: ARTICLE_ID,
        detail: actionElement.dataset.articleLabel || actionElement.textContent?.trim() || actionElement.getAttribute("href") || "",
        targetUrl: actionElement.getAttribute("href") || "",
        placement: analyticsPlacement(actionElement)
      });
      return;
    }

    const sourceLink = event.target.closest?.(".article-source-note a[href], .assessment-legal-note a[href]");
    if (sourceLink && article.contains(sourceLink)) {
      trackArticleInteraction("source_click", {
        articleId: ARTICLE_ID,
        detail: sourceLink.textContent?.trim() || sourceLink.getAttribute("href") || "",
        targetUrl: sourceLink.getAttribute("href") || "",
        placement: analyticsPlacement(sourceLink)
      });
      return;
    }

    const resourceLink = event.target.closest?.(".ges-resources-block a[href]");
    if (resourceLink && article.contains(resourceLink)) {
      trackArticleInteraction("resource_click", {
        articleId: ARTICLE_ID,
        detail: resourceLink.textContent?.trim() || resourceLink.getAttribute("href") || "",
        targetUrl: resourceLink.getAttribute("href") || "",
        placement: "references"
      });
    }
  }, { capture: true });

  article.querySelectorAll("details.assessment-technical-note, details.assessment-history-table").forEach(details => {
    details.addEventListener("toggle", () => {
      const isHistoryTable = details.classList.contains("assessment-history-table");
      trackArticleInteraction(isHistoryTable ? "history_table_toggle" : "equalization_note_toggle", {
        articleId: ARTICLE_ID,
        detail: details.open ? "opened" : "closed",
        placement: isHistoryTable ? "historical_data" : "equalization"
      });
    });
  });

  installArticleDepthTracking(article);
}

function analyticsPlacement(element) {
  if (element.closest(".article-tools")) return "article_tools";
  if (element.closest(".assessment-town-hall-card")) return "local_matters";
  if (element.closest(".assessment-history-table")) return "historical_data";
  if (element.closest(".assessment-legal-note")) return "legal_note";
  if (element.closest(".article-source-note")) return "source_note";
  if (element.closest(".ges-resources-block")) return "references";
  return "article_body";
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
        if (entry.isIntersecting) reportDepth(entry.target.dataset.articleDepthMarker, "marker");
      });
    }, { root: null, threshold: 0, rootMargin: "0px 0px -1px 0px" });
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

function calculateArticleScrollDepth(article) {
  const rect = article.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const articleHeight = Math.max(1, article.scrollHeight || rect.height || 1);
  const viewedDistance = Math.min(articleHeight, Math.max(0, viewportHeight - rect.top));
  return Math.max(0, Math.min(100, Math.round((viewedDistance / articleHeight) * 100)));
}

function renderMechanics() {
  const section = SECTIONS.mechanics;
  return `
    <section class="tax-article-section tax-story-chapter article-section" aria-labelledby="assessmentSeasonMechanics">
      <div class="editorial-narrow ges-section-lead">
        ${renderSectionHeader(section.kicker, section.title, "assessmentSeasonMechanics")}
        <p class="prose">${renderEditorialText(section.intro)}</p>
        <ol class="process-strip assessment-tax-process" aria-label="Four stages from assessment to final tax bill">
          ${section.stages.map(stage => `
            <li>
              <div class="process-step-heading"><span>${escapeHtml(stage.title)}</span></div>
              <p>${escapeHtml(stage.text)}</p>
            </li>`).join("")}
        </ol>
        <p class="assessment-tax-process__footer">${escapeHtml(section.footer)}</p>
        <p class="prose">${renderEditorialText(section.closing)}</p>
        <p class="prose assessment-continuity-bridge">${renderEditorialText(section.bridge)}</p>
      </div>
    </section>`;
}

function renderMarket() {
  const section = SECTIONS.market;
  return `
    <section class="tax-article-section tax-story-chapter article-section" aria-labelledby="assessmentSeasonMarket">
      <div class="editorial-narrow ges-section-lead">
        ${renderSectionHeader(section.kicker, section.title, "assessmentSeasonMarket")}
        <p class="prose">${renderEditorialText(section.context)} <span class="assessment-market-context-qualifier">${renderEditorialText(section.contextQualifier)}</span></p>
        ${renderSourceNote({
          label: "Market context",
          title: "Federal Reserve Monetary Policy Report, July 2026",
          subtitle: "Used for national housing-activity and mortgage-rate context only; it is not treated as a forecast for Gage County assessments.",
          url: ARTICLE.references.federalReserveHousing
        })}
        <aside class="ges-key-idea assessment-opinion-callout" aria-labelledby="assessmentOpinionTitle">
          <p class="ges-key-idea__label" id="assessmentOpinionTitle">${escapeHtml(section.opinionTitle)}</p>
          ${section.opinion.map((text, index) => `<p${index === 0 ? " class=\"assessment-opinion-callout__lead\"" : ""}>${index === 0 ? `<strong>${escapeHtml("This is my opinion:")}</strong> ${renderEditorialText(text.replace(/^This is my opinion:\s*/, ""))}` : renderEditorialText(text)}</p>`).join("")}
        </aside>
        <p class="prose assessment-continuity-bridge">${renderEditorialText(section.budgetBridge)}</p>
      </div>
    </section>`;
}

function renderBudgetCalendar() {
  const section = SECTIONS.budget;
  return `
    <section class="tax-article-section tax-story-chapter article-section assessment-season-budget-section" aria-labelledby="assessmentSeasonBudget">
      <div class="editorial-narrow ges-section-lead">
        ${renderSectionHeader(section.kicker, section.title, "assessmentSeasonBudget")}
        <p class="prose">${renderEditorialText(section.intro)}</p>
      </div>
      <ol class="assessment-budget-timeline" aria-label="2026 Nebraska budget and levy calendar">
        <li><time datetime="2026-09-14/2026-09-23">Sept. 14–23</time><span>Joint public-hearing window when the statutory trigger applies</span></li>
        <li><time datetime="2026-09-30">Sept. 30</time><span>Budget filing deadline</span></li>
        <li><time datetime="2026-10-15">Oct. 15</time><span>Property-tax request information due to county officials</span></li>
        <li><time datetime="2026-10-20">Oct. 20</time><span>County board levy-setting deadline</span></li>
      </ol>
      <div class="editorial-narrow">
        <aside class="assessment-watch-panel" aria-labelledby="assessmentWatchingTitle">
          <p class="guided-kicker">Budget review</p>
          <h3 id="assessmentWatchingTitle">What I’ll be watching</h3>
          <ul>
            ${section.watching.map(item => `<li><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.text)}</span></li>`).join("")}
          </ul>
        </aside>
        <p class="prose">${renderEditorialText(section.followUp)}</p>
        ${renderSourceNote({
          label: "Official calendar",
          title: "Nebraska Department of Revenue Property Assessment Division main calendar",
          subtitle: "The posted calendar is labeled for 2025 but was revised in June 2026 and includes the 2026 deadlines cited here.",
          url: ARTICLE.references.padCalendar
        })}
        <p class="prose assessment-continuity-bridge">${renderEditorialText(section.localBridge)}</p>
      </div>
    </section>`;
}

async function loadHistory() {
  const response = await fetch(ARTICLE.assets.dataset);
  if (!response.ok) throw new Error(`Unable to load article history (${response.status})`);
  const lines = (await response.text()).trim().split(/\r?\n/);
  return lines.slice(1).map(line => {
    const [assessmentYear, , assessedValue, netTax, levy] = line.split(",");
    return {
      assessmentYear: Number(assessmentYear),
      assessedValue: Number(assessedValue),
      netTax: netTax ? Number(netTax) : null,
      levy: levy ? Number(levy) : null
    };
  });
}
