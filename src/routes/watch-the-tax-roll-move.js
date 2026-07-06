import { createGesArticleShell } from "../ges/shell.js?v=20260701-article-polish-4";
import { installGesReadingProgress } from "../ges/reading-progress.js?v=20260701-article-polish-4";
import {
  installGuideUtilityLanguage,
  renderArticleEntryPanel,
  renderArticleHero,
  renderMarginInsight,
  renderResourcesBlock,
  renderSectionHeader as sectionHeader
} from "../ges/article-components.js?v=20260701-article-polish-4";
import { escapeHtml } from "../utils/html.js?v=20260701-article-polish-4";

import {
  taxRollBudgetTransition as BUDGET_TRANSITION,
  taxRollExperimentDefaults,
  taxRollLessons as LESSONS,
  taxRollProperties as PROPERTIES,
  watchTheTaxRollMoveArticle as ARTICLE
} from "../content/articles/watch-the-tax-roll-move.js?v=20260701-article-polish-4";

const BASE_VALUES = PROPERTIES.map(property => property.value);
const BASE_TOTAL = sum(BASE_VALUES);
const BASE_BUDGET = taxRollExperimentDefaults.baseBudget;
const CURRENCY_FORMAT = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const PERCENT_FORMAT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 3, minimumFractionDigits: 3 });
const SHARE_FORMAT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const ARTICLE_SECTIONS = ARTICLE.sections ?? {};

function normalizedPathname() {
  return window.location.pathname.endsWith("/")
    ? window.location.pathname
    : `${window.location.pathname}/`;
}

function absoluteUrl(path = "") {
  return new URL(path, document.baseURI).href;
}

function metadata() {
  return {
    title: ARTICLE.title,
    documentTitle: `${ARTICLE.title} | Guided Parcel Review`,
    description: ARTICLE.description,
    socialDescription: ARTICLE.description,
    canonicalPath: ARTICLE.canonicalPath,
    pageType: "article",
    ogType: "article",
    robots: "noindex, follow",
    modifiedDate: ARTICLE.modifiedDate,
    section: "Property tax education",
    tags: ARTICLE.tags,
    keywords: ["tax roll", "property tax levy", "relative assessment", "levy compression", "property tax education"],
    author: ARTICLE.author,
    socialImage: absoluteUrl(ARTICLE.assets.heroImage),
    socialImageAlt: ARTICLE.assets.heroImageAlt
  };
}

export function isWatchTheTaxRollMoveRequest(searchParams = new URLSearchParams(window.location.search)) {
  return searchParams.get("article") === ARTICLE.legacyQueryValue
    || normalizedPathname().endsWith(`/${ARTICLE.canonicalPath}`);
}

export function renderWatchTheTaxRollMoveArticle() {
  const shell = createGesArticleShell({
    htmlClasses: ["watch-tax-roll-route"],
    metadata: metadata(),
    routeName: "watch-the-tax-roll-move"
  });

  if (!shell?.coverRegion) return;

  shell.setCover(renderCover());
  shell.setBody(`
    <article class="tax-shorthand-page levy-compression-page editorial-guide tax-article-panel tax-roll-article" data-county-theme="gage" data-ges-reading-progress-target aria-label="${escapeHtml(ARTICLE.title)}">
      ${renderEntryPanel()}
      <section class="tax-roll-intro tax-article-section tax-story-chapter tax-article-opening levy-wide-panel article-section ges-opening-section" data-tone="reflection" aria-labelledby="taxRollIntroTitle">
        <div class="editorial-narrow ges-section-lead">
          ${sectionHeader(ARTICLE_SECTIONS.intro?.kicker ?? "", ARTICLE_SECTIONS.intro?.title ?? "", "taxRollIntroTitle")}
          ${paragraphs(ARTICLE_SECTIONS.intro?.paragraphs)}
        </div>
      </section>
      ${renderExperiment()}
      ${renderFinalThought()}
      ${renderArticleResources()}
      <span data-ges-reading-progress-end aria-hidden="true"></span>
    </article>
  `);

  installTaxRollExperiment(shell.bodyRegion);
  installGuideUtilityLanguage(shell.bodyRegion);
  installGesReadingProgress({ root: shell.bodyRegion });
}

function renderCover() {
  return renderArticleHero({
    className: "tax-roll-hero",
    label: "Interactive Article",
    mediaHtml: `
      <figure class="article-hero-media hero-media tax-roll-hero__media">
        <img src="${escapeHtml(ARTICLE.assets.heroImage)}" alt="${escapeHtml(ARTICLE.assets.heroImageAlt)}" loading="eager" decoding="async" fetchpriority="high" />
        <figcaption>${escapeHtml(ARTICLE.assets.heroImageAlt)} ${escapeHtml(ARTICLE.assets.heroImageCredit)}</figcaption>
      </figure>
    `,
    subject: "Property Tax Education",
    subtitle: ARTICLE.description,
    tags: ARTICLE.tags,
    title: ARTICLE.title,
    titleId: "watchTaxRollTitle"
  });
}

function editorialIcon(name) {
  const paths = {
    audio: "<path d='M5 9v6h4l5 4V5L9 9H5Z'></path><path d='M17 9.5a4 4 0 0 1 0 5'></path>",
    document: "<path d='M7 3h7l4 4v14H7z'></path><path d='M14 3v5h5'></path><path d='M9.5 12h5'></path><path d='M9.5 16h5'></path>"
  };

  return `
    <svg class="editorial-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      ${paths[name] ?? paths.document}
    </svg>
  `;
}

function paragraph(text) {
  return text ? `<p class="prose">${escapeHtml(text)}</p>` : "";
}

function paragraphs(items = []) {
  return items.map(paragraph).join("");
}

function renderEntryPanel() {
  return renderArticleEntryPanel({
    articleTitle: ARTICLE.title,
    authorImage: ARTICLE.assets.authorImage,
    authorMailto: `mailto:${ARTICLE.authorEmail}?subject=${encodeURIComponent(`Re: ${ARTICLE.title}`)}`,
    authorName: ARTICLE.author,
    authorTitle: ARTICLE.authorTitle,
    displayDate: ARTICLE.displayDate,
    icon: editorialIcon,
    printableLabel: "Print Version",
    printableUrl: ARTICLE.assets.printableGuidePdf,
    readingMinutes: ARTICLE.readingMinutes,
    wordCount: ARTICLE.wordCount,
    lengthLabel: ARTICLE.lengthLabel
  });
}

function renderArticleResources() {
  return renderResourcesBlock(ARTICLE.resourcesBlock, {
    id: "watchTaxRollResources",
    headingLevel: 2
  });
}

function renderExperiment() {
  const baseline = calculate(BASE_VALUES, BASE_BUDGET);
  const controlGroup = ARTICLE_SECTIONS.controlGroup ?? {};
  const currentTotals = ARTICLE_SECTIONS.currentTotals ?? {};
  const totalsLabels = currentTotals.labels ?? {};
  return `
    <section class="tax-roll-experiment" aria-label="Guided tax roll experiment">
      <section class="tax-roll-neighborhood tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="information" aria-labelledby="taxRollNeighborhoodTitle">
        ${sectionHeader(controlGroup.kicker ?? "", controlGroup.title ?? "", "taxRollNeighborhoodTitle")}
        ${paragraph(controlGroup.intro)}
        ${renderControlNeighborhood()}
        ${renderBaselineTable(baseline)}
      </section>
      <div class="tax-roll-baseline-shell" data-tax-roll-baseline-shell>
        <div class="tax-roll-baseline-intro">
          <p class="guided-kicker">${escapeHtml(currentTotals.kicker ?? "Current Totals")}</p>
          ${paragraph(currentTotals.description)}
        </div>
        <dl class="tax-roll-baseline" aria-label="Current experiment totals">
          <div><dt>${escapeHtml(totalsLabels.totalValue ?? "Total Value")}</dt><dd data-kpi-value="totalValue">${displayCompactMoney(baseline.total)}</dd></div>
          <div><dt>${escapeHtml(totalsLabels.budget ?? "Budget")}</dt><dd data-kpi-value="budgetValue">${displayCompactMoney(BASE_BUDGET)}</dd></div>
          <div class="tax-roll-baseline__hero">
            <dt>${escapeHtml(totalsLabels.levy ?? "Levy")}</dt>
            <dd class="tax-roll-levy-metric">
              <span class="tax-roll-levy-direction" data-levy-direction aria-label="Levy direction">–</span>
              <span class="tax-roll-levy-number" data-kpi-value="levyRate">${formatCompactLevy(baseline.levy)}</span>
            </dd>
          </div>
        </dl>
      </div>

      ${renderLessons()}

      <section class="tax-roll-final tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="reflection" aria-label="Final takeaway">
        ${renderFinalPie()}
        ${paragraph(ARTICLE_SECTIONS.experimentTakeaway?.text)}
      </section>
    </section>
  `;
}

function renderLessons() {
  return LESSONS.map(lesson => {
    const budgetTransition = lesson.id === "everyone-down"
      ? renderBudgetTransition()
      : "";
    return `${renderLesson(lesson)}${budgetTransition}`;
  }).join("");
}

function renderFinalThought() {
  const finalThought = ARTICLE_SECTIONS.finalThought ?? {};
  return `
    <section class="tax-roll-final-thought tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="reflection" aria-labelledby="taxRollFinalThoughtTitle">
      <h2 id="taxRollFinalThoughtTitle">${escapeHtml(finalThought.title ?? "")}</h2>
      ${paragraphs(finalThought.paragraphsBeforeQuestion)}
      <aside class="tax-roll-final-transition guided-transition" aria-label="Final thought transition">
        <p>"${escapeHtml(finalThought.question ?? "")}"</p>
      </aside>
      ${paragraphs(finalThought.paragraphsAfterQuestion)}
    </section>
  `;
}

function renderFinalPie() {
  const slices = [
    { color: PROPERTIES[0].color, path: "M50 50 L50 0 A50 50 0 0 1 79.4 9.6 Z" },
    { color: PROPERTIES[1].color, path: "M50 50 L79.4 9.6 A50 50 0 0 1 98.4 62.4 Z" },
    { color: PROPERTIES[2].color, path: "M50 50 L98.4 62.4 A50 50 0 0 1 68.4 96.5 Z" },
    { color: PROPERTIES[3].color, path: "M50 50 L68.4 96.5 A50 50 0 0 1 20.6 90.4 Z" },
    { color: PROPERTIES[4].color, path: "M50 50 L20.6 90.4 A50 50 0 0 1 1.6 37.6 Z" },
    { color: PROPERTIES[5].color, path: "M50 50 L1.6 37.6 A50 50 0 0 1 50 0 Z" }
  ];

  return `
    <svg class="tax-roll-final-pie" viewBox="0 0 100 100" role="img" aria-label="Small pie chart showing slightly different shares of the same tax base">
      ${slices.map(slice => `<path d="${slice.path}" fill="${escapeHtml(slice.color)}"></path>`).join("")}
      <circle cx="50" cy="50" r="49" fill="none" stroke="#000" stroke-width="2"></circle>
    </svg>
  `;
}

function renderControlNeighborhood() {
  return `
    <figure class="tax-roll-control-neighborhood" aria-label="Ten-home control neighborhood">
      <div class="tax-roll-control-neighborhood__grid">
        ${PROPERTIES.map(property => `
          <span class="tax-roll-control-home" style="--property-color: ${escapeHtml(property.color)};" aria-label="${escapeHtml(property.label)}, $100,000">
            <span class="tax-roll-control-home__icon" aria-hidden="true">${renderControlHouseIcon()}</span>
            <span class="tax-roll-control-home__label">${escapeHtml(property.label.replace(/^House\s+/i, ""))}</span>
            <span class="tax-roll-control-home__value">$100,000</span>
          </span>
        `).join("")}
      </div>
    </figure>
  `;
}

function renderBaselineTable(baseline) {
  const controlGroup = ARTICLE_SECTIONS.controlGroup ?? {};
  return `
    <section class="tax-roll-control-table" aria-labelledby="taxRollControlTableTitle">
      <div class="tax-roll-control-table__intro">
        <p class="guided-kicker">${escapeHtml(controlGroup.snapshotKicker ?? "System Snapshot")}</p>
        <h3 id="taxRollControlTableTitle">${escapeHtml(controlGroup.snapshotTitle ?? "Control group baseline")}</h3>
      </div>
      <div class="tax-roll-table-wrap">
        <table class="tax-roll-result-table tax-roll-result-table--baseline">
          <colgroup>
            <col class="tax-roll-result-col--house" />
            <col class="tax-roll-baseline-col--assessment" />
            <col class="tax-roll-baseline-col--share" />
            <col class="tax-roll-baseline-col--tax" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">House</th>
              <th scope="col">Assessment</th>
              <th scope="col">Share of Tax Base</th>
              <th scope="col">Tax</th>
            </tr>
          </thead>
          <tbody>
            ${PROPERTIES.map((property, index) => `
              <tr style="--property-color: ${escapeHtml(property.color)}; --row-order: ${index};">
                <th scope="row">${renderTableHouseIdentity(property)}</th>
                <td data-label="Assessment">${displayMoney(baseline.values[index])}</td>
                <td data-label="Share">${SHARE_FORMAT.format(baseline.shares[index] * 100)}%</td>
                <td data-label="Tax">${displayMoney(baseline.taxes[index])}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <p class="tax-roll-control-table__note">${escapeHtml(controlGroup.snapshotNote ?? "")}</p>
    </section>
  `;
}

function renderControlHouseIcon() {
  return `
    <svg viewBox="0 0 20 18" aria-hidden="true" focusable="false">
      <path d="M2.4 8.6 10 2.4l7.6 6.2h-2v7H4.4v-7h-2Z"></path>
      <path d="M7.7 10.2h4.6v5.4H7.7z"></path>
    </svg>
  `;
}

function renderLesson(lesson) {
  const hasBridge = Boolean(lesson.bridge);
  return `
    <section class="tax-roll-lesson ${hasBridge ? "tax-roll-lesson--with-bridge" : ""} tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="information" data-lesson="${escapeHtml(lesson.id)}" aria-labelledby="${escapeHtml(lesson.id)}Title">
      ${sectionHeader(lesson.number, lesson.title, `${lesson.id}Title`)}
      ${renderExperimentSetup(lesson.setup)}
      <div class="tax-roll-experiment-card" data-experiment-card="${escapeHtml(lesson.id)}">
        <div class="tax-roll-lesson-grid">
        <div class="tax-roll-scenario-copy">
          ${renderMarginInsight({ label: "Prediction", text: lesson.prediction }, { placement: "inline" })}
          <button type="button" class="tax-roll-reveal" data-run-lesson="${escapeHtml(lesson.id)}">
            <span data-reveal-label>${escapeHtml(lesson.action)}</span>
            <span class="tax-roll-reveal__icon" aria-hidden="true">
              <svg class="tax-roll-reveal__icon-state tax-roll-reveal__icon-state--chevron" viewBox="0 0 20 20" focusable="false">
                <path d="M7.5 4.5 13 10l-5.5 5.5"></path>
              </svg>
              <svg class="tax-roll-reveal__icon-state tax-roll-reveal__icon-state--check" viewBox="0 0 20 20" focusable="false">
                <path d="m4.5 10.5 3.4 3.4 7.6-8.2"></path>
              </svg>
            </span>
          </button>
          <div class="tax-roll-answer" data-result-answer="${escapeHtml(lesson.id)}" hidden>
            <p class="tax-roll-answer-kicker section-kicker">Answer</p>
            <h3 class="tax-roll-result-title"></h3>
          </div>
        </div>
        <div class="tax-roll-result-column">
          <div class="tax-roll-result-shell tax-roll-result-shell--pending" data-result-shell="${escapeHtml(lesson.id)}" aria-live="polite">
            <button type="button" class="tax-roll-table-toggle" data-toggle-result-table aria-expanded="false">
              <span>See Results Table</span>
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path d="M5 7.5 10 12.5l5-5"></path>
              </svg>
            </button>
            <div class="tax-roll-mobile-outcome" data-mobile-outcome hidden></div>
            <div class="tax-roll-table-wrap" data-result-table-wrap>${renderPendingResultTable()}</div>
          </div>
        </div>
        <div class="tax-roll-explanation" data-result-explanation="${escapeHtml(lesson.id)}" hidden>
          <section class="tax-roll-explanation-block">
            <h3>
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path d="M3.2 14.4h13.6"></path>
                <path d="M4.2 12.1l3.1-3.2 2.8 2.4 4.6-5"></path>
                <path d="M11.9 6.3h2.8v2.8"></path>
              </svg>
              <span>Observation</span>
            </h3>
            <p class="prose" data-result-observation></p>
          </section>
          <section class="tax-roll-explanation-block">
            <h3>
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path d="M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"></path>
                <path d="M8.15 7.9A2 2 0 0 1 10.1 6.4c1.15 0 2.05.75 2.05 1.82 0 1.7-2.15 1.55-2.15 3.35"></path>
                <path d="M10 14h.01"></path>
              </svg>
              <span>Why?</span>
            </h3>
            <p class="prose" data-result-why></p>
          </section>
          <section class="tax-roll-explanation-block tax-roll-explanation-block--remember">
            <h3>
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path d="M10 2.5a5.8 5.8 0 0 0-3.35 10.54c.58.42.85.9.85 1.46v.25h5v-.25c0-.56.27-1.04.85-1.46A5.8 5.8 0 0 0 10 2.5Z"></path>
                <path d="M7.7 16.2h4.6M8.25 18h3.5"></path>
              </svg>
              <span>Key Idea</span>
            </h3>
            <p class="prose" data-result-remember></p>
          </section>
        </div>
        </div>
      </div>
      ${hasBridge ? renderLessonBridge(lesson.bridge, lesson.id) : ""}
    </section>
  `;
}

function renderExperimentSetup(rows) {
  const assessmentRows = rows.filter(([label]) => !/budget/i.test(label));
  const budgetRows = rows.filter(([label]) => /budget/i.test(label));
  return `
    <div class="tax-roll-experiment-setup" aria-label="Experiment setup">
      <p>Given</p>
      <div class="tax-roll-experiment-setup__conditions">
        <dl class="tax-roll-experiment-setup__group tax-roll-experiment-setup__group--assessment" aria-label="Assessment conditions">
          <dt>Assessment</dt>
          <dd>
            ${assessmentRows.map(([label, value]) => `
              <span>${assessmentRows.length > 1 ? `<span>${escapeHtml(label)}</span>` : ""}<strong>${renderSetupValue(value)}</strong></span>
            `).join("")}
          </dd>
        </dl>
        <dl class="tax-roll-experiment-setup__group tax-roll-experiment-setup__group--budget" aria-label="Budget condition">
          <dt>Budget</dt>
          <dd>
            ${budgetRows.map(([, value]) => `
              <span><strong>${renderSetupValue(value)}</strong></span>
            `).join("")}
          </dd>
        </dl>
      </div>
    </div>
  `;
}

function renderSetupValue(value) {
  const normalized = String(value).trim();
  if (/^no change$/i.test(normalized)) {
    return '<span class="tax-roll-setup-arrow" aria-hidden="true">↔</span><span>No change</span>';
  }
  if (/^[+-]/.test(normalized)) {
    return normalized.split(",").map(part => {
      const item = part.trim();
      const arrow = item.startsWith("-") ? "↓" : "↑";
      return `<span><span class="tax-roll-setup-arrow" aria-hidden="true">${arrow}</span><span>${escapeHtml(item.replace(/^[+-]/, ""))}</span></span>`;
    }).join("");
  }
  return escapeHtml(normalized);
}

function renderLessonBridge(bridge, lessonId) {
  return `
    <aside class="tax-roll-lesson-bridge" data-lesson-bridge="${escapeHtml(lessonId)}" aria-label="Experiment transition" hidden>
      <span class="tax-roll-lesson-bridge__icon" aria-hidden="true">${bridgeIcon(bridge.icon)}</span>
      <span class="tax-roll-lesson-bridge__copy">
        <strong>${escapeHtml(bridge.title)}</strong>
        <span>${escapeHtml(bridge.text)}</span>
      </span>
    </aside>
  `;
}

function renderBudgetTransition() {
  return `
    <aside class="tax-roll-budget-transition guided-transition" aria-label="Budget transition">
      <p>${escapeHtml(BUDGET_TRANSITION)}</p>
    </aside>
    <hr class="tax-roll-budget-transition-rule" aria-hidden="true">
  `;
}

function bridgeIcon(name) {
  const paths = {
    balance: "<path d='M10 3v14'></path><path d='M4 7h12'></path><path d='M6 7 3.5 12h5L6 7Z'></path><path d='m14 7-2.5 5h5L14 7Z'></path><path d='M7 17h6'></path>",
    compass: "<path d='M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z'></path><path d='m13.2 6.8-1.7 4.7-4.7 1.7 1.7-4.7 4.7-1.7Z'></path>",
    map: "<path d='M3 6.5 7.5 4l5 2.5L17 4v9.5L12.5 16l-5-2.5L3 16V6.5Z'></path><path d='M7.5 4v9.5'></path><path d='M12.5 6.5V16'></path>",
    cycle: "<path d='M15.5 6.5A6.5 6.5 0 0 0 4 8'></path><path d='M4 4v4h4'></path><path d='M4.5 13.5A6.5 6.5 0 0 0 16 12'></path><path d='M16 16v-4h-4'></path>"
  };

  return `
    <svg viewBox="0 0 20 20" focusable="false">
      ${paths[name] ?? paths.compass}
    </svg>
  `;
}

function installTaxRollExperiment(root) {
  const baseline = calculate(BASE_VALUES, BASE_BUDGET);
  const metricElements = Object.fromEntries([...root.querySelectorAll("[data-kpi-value]")].map(element => [element.dataset.kpiValue, element]));
  installBaselineRibbon(root);
  let previous = {
    totalValue: baseline.total,
    budgetValue: BASE_BUDGET,
    levyRate: baseline.levy
  };

  if (shouldRevealForPrint()) {
    LESSONS.forEach(lesson => {
      const scenario = calculate(lesson.values().map(roundDollar), lesson.budget);
      renderLessonResult(root, lesson, scenario, baseline);
      const button = root.querySelector(`[data-run-lesson="${lesson.id}"]`);
      const label = button?.querySelector("[data-reveal-label]");
      button?.classList.add("is-active");
      button?.setAttribute("aria-disabled", "true");
      if (label) label.textContent = "Answer Revealed";
    });
  }

  root.addEventListener("click", event => {
    const tableToggle = event.target.closest("[data-toggle-result-table]");
    if (tableToggle && root.contains(tableToggle)) {
      toggleMobileResultTable(tableToggle);
      return;
    }

    const button = event.target.closest("[data-run-lesson]");
    if (!button || !root.contains(button)) return;
    const lesson = LESSONS.find(item => item.id === button.dataset.runLesson);
    if (!lesson) return;
    const scenario = calculate(lesson.values().map(roundDollar), lesson.budget);
    button.disabled = true;
    button.classList.add("is-loading");
    window.setTimeout(() => {
      renderLessonResult(root, lesson, scenario, baseline);
      updateMetrics(metricElements, previous, scenario, lesson.budget);
      previous = {
        totalValue: scenario.total,
        budgetValue: lesson.budget,
        levyRate: scenario.levy
      };
      const label = button.querySelector("[data-reveal-label]");
      if (label) label.textContent = "Answer Revealed";
      button.disabled = false;
      button.classList.remove("is-loading");
      requestAnimationFrame(() => scrollResultTableIntoView(root, lesson));
    }, 180);
    button.classList.add("is-active");
  });
}

function shouldRevealForPrint() {
  const params = new URLSearchParams(window.location.search);
  return params.has("print") || params.has("pdf");
}

function toggleMobileResultTable(button) {
  const shell = button.closest("[data-result-shell]");
  const isOpen = shell?.classList.toggle("is-table-open");
  button.setAttribute("aria-expanded", String(Boolean(isOpen)));
}

function installBaselineRibbon(root) {
  const shell = root.querySelector("[data-tax-roll-baseline-shell]");
  const ribbon = shell?.querySelector(".tax-roll-baseline");
  const intro = shell?.querySelector(".tax-roll-baseline-intro");
  const experiment = root.querySelector(".tax-roll-experiment");
  if (!shell || !ribbon || !experiment) return;

  const update = () => {
    const top = Number.parseFloat(getComputedStyle(ribbon).top) || 0;
    const shellRect = shell.getBoundingClientRect();
    const introStyles = intro ? getComputedStyle(intro) : null;
    const introMarginBottom = introStyles ? Number.parseFloat(introStyles.marginBottom) || 0 : 0;
    const introOffset = intro ? intro.offsetHeight + introMarginBottom : 0;
    const ribbonNaturalTop = shellRect.top + introOffset;
    const experimentRect = experiment.getBoundingClientRect();
    const ribbonHeight = ribbon.offsetHeight;
    const shouldStick = ribbonNaturalTop <= top && experimentRect.bottom > top + ribbonHeight + 16;

    shell.style.minHeight = `${introOffset + ribbonHeight}px`;
    if (shouldStick) {
      shell.classList.add("is-fixed");
      ribbon.style.setProperty("--tax-roll-sticky-left", `${shellRect.left}px`);
      ribbon.style.setProperty("--tax-roll-sticky-width", `${shellRect.width}px`);
    } else {
      shell.classList.remove("is-fixed");
      ribbon.style.removeProperty("--tax-roll-sticky-left");
      ribbon.style.removeProperty("--tax-roll-sticky-width");
    }
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

function scrollResultTableIntoView(root, lesson) {
  const baselineShell = root.querySelector("[data-tax-roll-baseline-shell]");
  if (!baselineShell?.classList.contains("is-fixed")) return;

  const section = root.querySelector(`[data-lesson="${lesson.id}"]`);
  const target = section?.querySelector(".tax-article-header .guided-kicker")
    || section?.querySelector(".tax-article-header h2")
    || section;
  const ribbon = baselineShell.querySelector(".tax-roll-baseline");
  const ribbonRect = ribbon?.getBoundingClientRect();
  if (!target || !ribbonRect) return;

  const gap = window.matchMedia("(min-width: 760px)").matches ? 16 : 12;
  const targetTop = target.getBoundingClientRect().top;
  const desiredTop = Math.max(0, ribbonRect.bottom) + gap;
  const top = window.scrollY + targetTop - desiredTop;
  if (Math.abs(targetTop - desiredTop) < 4) return;

  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  window.scrollTo({ top: Math.max(0, top), behavior });
}

function renderLessonResult(root, lesson, scenario, baseline) {
  const shell = root.querySelector(`[data-result-shell="${lesson.id}"]`);
  const explanation = root.querySelector(`[data-result-explanation="${lesson.id}"]`);
  const answer = root.querySelector(`[data-result-answer="${lesson.id}"]`);
  const card = root.querySelector(`[data-experiment-card="${lesson.id}"]`);
  const bridge = root.querySelector(`[data-lesson-bridge="${lesson.id}"]`);
  if (!shell) return;
  const title = answer?.querySelector(".tax-roll-result-title");
  shell.classList.remove("tax-roll-result-shell--pending");
  if (title) {
    title.textContent = lesson.result;
  }
  if (answer) answer.hidden = false;
  shell.querySelector(".tax-roll-table-wrap").innerHTML = renderResultTable(scenario, baseline);
  const mobileOutcome = shell.querySelector("[data-mobile-outcome]");
  if (mobileOutcome) {
    mobileOutcome.hidden = false;
    mobileOutcome.innerHTML = renderMobileOutcomeList(scenario, baseline);
  }
  if (explanation) {
    explanation.hidden = false;
    explanation.querySelector("[data-result-observation]").textContent = lesson.observation;
    explanation.querySelector("[data-result-why]").textContent = lesson.why;
    explanation.querySelector("[data-result-remember]").textContent = lesson.remember;
  }
  requestAnimationFrame(() => {
    card?.classList.add("is-revealed");
    answer?.classList.add("is-visible");
    shell.classList.add("is-visible");
    explanation?.classList.add("is-visible");
    if (bridge) {
      bridge.hidden = false;
      requestAnimationFrame(() => bridge.classList.add("is-visible"));
    }
  });
}

function renderResultTable(scenario, baseline) {
  const rows = PROPERTIES
    .map((property, index) => ({ property, index, share: scenario.shares[index] }))
    .sort((a, b) => (b.share - a.share) || (a.index - b.index));
  return `
    <table class="tax-roll-result-table">
      <colgroup>
        <col class="tax-roll-result-col--house" />
        <col class="tax-roll-result-col--assessment" />
        <col class="tax-roll-result-col--delta" />
        <col class="tax-roll-result-col--share" />
        <col class="tax-roll-result-col--tax" />
        <col class="tax-roll-result-col--tax-change" />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">House</th>
          <th scope="col">Assessment</th>
          <th scope="col"><span aria-label="Assessment change">&Delta;</span></th>
          <th scope="col">Share of Tax Base</th>
          <th scope="col">Tax</th>
          <th scope="col">Tax Change</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(({ property, index }, order) => {
          const taxDelta = scenario.taxes[index] - baseline.taxes[index];
          const shareDelta = scenario.shares[index] - baseline.shares[index];
          const valueDelta = baseline.values[index] > 0 ? (scenario.values[index] - baseline.values[index]) / baseline.values[index] : 0;
          return `
            <tr style="--property-color: ${escapeHtml(property.color)}; --row-order: ${order};">
              <th scope="row">${renderTableHouseIdentity(property)}</th>
              <td data-label="Assessment">${displayMoney(scenario.values[index])}</td>
              <td data-label="Value Change" class="tax-roll-assessment-change ${assessmentChangeClass(valueDelta)}">${renderAssessmentDelta(valueDelta)}</td>
              <td data-label="Share" class="${shareClass(shareDelta)}">${SHARE_FORMAT.format(scenario.shares[index] * 100)}%</td>
              <td data-label="Tax" class="${deltaClass(taxDelta)}">${displayMoney(scenario.taxes[index])}</td>
              <td data-label="Change" class="${deltaClass(taxDelta)}">${formatDelta(taxDelta)}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

function resultRowsByTaxChange(scenario, baseline) {
  return PROPERTIES
    .map((property, index) => {
      const taxDelta = scenario.taxes[index] - baseline.taxes[index];
      const shareDelta = scenario.shares[index] - baseline.shares[index];
      const valueDelta = baseline.values[index] > 0 ? (scenario.values[index] - baseline.values[index]) / baseline.values[index] : 0;
      return { property, index, taxDelta, shareDelta, valueDelta };
    })
    .sort((a, b) => (b.taxDelta - a.taxDelta) || (a.index - b.index));
}

function renderMobileOutcomeList(scenario, baseline) {
  const rows = resultRowsByTaxChange(scenario, baseline);
  return `
    <section class="tax-roll-mobile-outcome-card" aria-label="Where the burden moved">
      <h3>Where the burden moved</h3>
      <table class="tax-roll-mobile-outcome-table">
        <colgroup>
          <col class="tax-roll-mobile-col--house" />
          <col class="tax-roll-mobile-col--assessment" />
          <col class="tax-roll-mobile-col--tax" />
          <col class="tax-roll-mobile-col--change" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">House</th>
            <th scope="col">Assessment</th>
            <th scope="col">Tax</th>
            <th scope="col">Change</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(({ property, index, taxDelta }, order) => `
            <tr style="--property-color: ${escapeHtml(property.color)}; --row-order: ${order};">
              <th scope="row">
                <span class="tax-roll-mobile-row__identity">
                  ${renderMobileHouseIcon(property)}
                  <span>${escapeHtml(property.label.replace(/^House\s+/i, ""))}</span>
                </span>
              </th>
              <td>${displayMoney(scenario.values[index])}</td>
              <td>${displayMoney(scenario.taxes[index])}</td>
              <td class="${deltaClass(taxDelta)}">${formatDelta(taxDelta)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
  `;
}

function renderPendingResultTable() {
  return `
    <table class="tax-roll-result-table tax-roll-result-table--pending" aria-label="Question result table waiting to be revealed">
      <colgroup>
        <col class="tax-roll-result-col--house" />
        <col class="tax-roll-result-col--assessment" />
        <col class="tax-roll-result-col--delta" />
        <col class="tax-roll-result-col--share" />
        <col class="tax-roll-result-col--tax" />
        <col class="tax-roll-result-col--tax-change" />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">House</th>
          <th scope="col">Assessment</th>
          <th scope="col"><span aria-label="Assessment change">&Delta;</span></th>
          <th scope="col">Share of Tax Base</th>
          <th scope="col">Tax</th>
          <th scope="col">Tax Change</th>
        </tr>
      </thead>
      <tbody>
        ${PROPERTIES.map(property => `
          <tr style="--property-color: ${escapeHtml(property.color)};">
            <th scope="row">${renderTableHouseIdentity(property)}</th>
            <td data-label="Assessment" aria-label="Assessment pending">-</td>
            <td data-label="Value Change" aria-label="Assessment change pending">-</td>
            <td data-label="Share" aria-label="Share of tax base pending">-</td>
            <td data-label="Tax" aria-label="Tax pending">-</td>
            <td data-label="Change" aria-label="Tax change pending">-</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderMobileHouseIcon(property) {
  return `
    <svg class="tax-roll-mobile-house" viewBox="0 0 20 18" aria-hidden="true" focusable="false">
      <path class="tax-roll-table-house__roof" d="M2.5 8.4 10 2l7.5 6.4h-2.2v7.1H4.7V8.4H2.5Z"></path>
      <path class="tax-roll-table-house__door" d="M8.45 10.35h3.1v5.15h-3.1Z"></path>
    </svg>
  `;
}

function renderTableHouseIdentity(property) {
  const houseNumber = property.label.replace(/^House\s+/i, "");
  return `
    <span class="tax-roll-table-house" aria-label="${escapeHtml(property.label)}">
      <svg viewBox="0 0 20 18" aria-hidden="true" focusable="false">
        <path class="tax-roll-table-house__roof" d="M2.5 8.4 10 2l7.5 6.4h-2.2v7.1H4.7V8.4H2.5Z"></path>
        <path class="tax-roll-table-house__door" d="M8.45 10.35h3.1v5.15h-3.1Z"></path>
      </svg>
      <span aria-hidden="true">${escapeHtml(houseNumber)}</span>
    </span>
  `;
}

function updateMetrics(elements, previous, scenario, budget) {
  animateText(elements.totalValue, previous.totalValue, scenario.total, displayCompactMoney);
  animateText(elements.budgetValue, previous.budgetValue, budget, displayCompactMoney);
  animateText(elements.levyRate, previous.levyRate, scenario.levy, formatCompactLevy);
  updateLevyDirection(elements.levyRate, previous.levyRate, scenario.levy);
  pulseMetricText(elements.totalValue, previous.totalValue, scenario.total);
  pulseMetricText(elements.budgetValue, previous.budgetValue, budget);
  pulseMetricText(elements.levyRate, previous.levyRate, scenario.levy);
}

function updateLevyDirection(element, from, to) {
  const direction = element?.closest(".tax-roll-baseline__hero")?.querySelector("[data-levy-direction]");
  if (!direction) return;
  const delta = Number(to) - Number(from);
  direction.classList.remove("is-up", "is-down", "is-flat", "is-pulsing");
  if (Math.abs(delta) < 0.000001) {
    direction.textContent = "–";
    direction.setAttribute("aria-label", "Levy unchanged");
    direction.classList.add("is-flat");
    return;
  }
  direction.textContent = delta > 0 ? "↑" : "↓";
  direction.setAttribute("aria-label", delta > 0 ? "Levy increased" : "Levy decreased");
  direction.classList.add(delta > 0 ? "is-up" : "is-down");
  void direction.offsetWidth;
  direction.classList.add("is-pulsing");
}

function pulseMetricText(element, from, to) {
  if (!element || Math.abs(Number(to) - Number(from)) < 0.000001) return;
  element.classList.remove("is-pulsing");
  void element.offsetWidth;
  element.classList.add("is-pulsing");
}

function calculate(values, budget) {
  const scenarioTotal = sum(values);
  const levy = scenarioTotal > 0 ? budget / scenarioTotal : 0;
  return {
    budget,
    levy,
    shares: values.map(value => scenarioTotal > 0 ? value / scenarioTotal : 0),
    taxes: values.map(value => value * levy),
    total: scenarioTotal,
    values
  };
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function roundDollar(value) {
  return Math.round(Number.isFinite(value) ? value : 0);
}

function displayMoney(value) {
  return CURRENCY_FORMAT.format(roundDollar(value));
}

function compactNumber(value) {
  const rounded = roundDollar(Math.abs(value));
  const hasPartialThousands = rounded >= 1000 && rounded < 100000 && rounded % 1000 !== 0;
  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: rounded >= 100000 || hasPartialThousands ? 1 : 0,
    minimumFractionDigits: 0
  });

  if (rounded >= 1000000) return `${formatter.format(rounded / 1000000)}M`;
  if (rounded >= 1000) return `${formatter.format(rounded / 1000)}k`;
  return formatter.format(rounded);
}

function displayCompactMoney(value) {
  const prefix = Number(value) < 0 ? "-$" : "$";
  return `${prefix}${compactNumber(value)}`;
}

function formatLevy(value) {
  return `${PERCENT_FORMAT.format(value * 100)}%`;
}

function formatCompactLevy(value) {
  const percent = value * 100;
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(percent);
  return `${formatted}%`;
}

function formatShare(value) {
  return `${SHARE_FORMAT.format(value * 100)}%`;
}

function formatDelta(value) {
  const rounded = roundDollar(value);
  if (rounded === 0) return "$0";
  return `${rounded > 0 ? "+" : "-"}${displayMoney(Math.abs(rounded))}`;
}

function formatPercentChange(value) {
  const absolute = Math.abs(value * 100);
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: absolute < 10 && absolute % 1 !== 0 ? 1 : 0,
    minimumFractionDigits: 0
  }).format(absolute);
  return `${formatted}%`;
}

function assessmentChangeClass(value) {
  if (value > 0.0001) return "tax-roll-assessment-change--up";
  if (value < -0.0001) return "tax-roll-assessment-change--down";
  return "tax-roll-assessment-change--flat";
}

function renderAssessmentDelta(value) {
  if (Math.abs(value) < 0.0001) return `<span class="tax-roll-assessment-change__flat">0%</span>`;
  const isUp = value > 0;
  const direction = isUp ? "Up" : "Down";
  return `
    <span class="tax-roll-assessment-change__content" aria-label="${direction} ${formatPercentChange(value)}">
      <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <path d="${isUp ? "M6 2.2 10 6.2H7.4v3.6H4.6V6.2H2Z" : "M6 9.8 2 5.8h2.6V2.2h2.8v3.6H10Z"}"></path>
      </svg>
      <span>${formatPercentChange(value)}</span>
    </span>
  `;
}

function deltaClass(value) {
  if (value > 75) return "tax-roll-heat tax-roll-heat--red";
  if (value > 10) return "tax-roll-heat tax-roll-heat--amber";
  if (value < -75) return "tax-roll-heat tax-roll-heat--green";
  if (value < -10) return "tax-roll-heat tax-roll-heat--soft-green";
  return "tax-roll-heat tax-roll-heat--neutral";
}

function shareClass(value) {
  if (value > 0.015) return "tax-roll-share tax-roll-share--up";
  if (value > 0.0025) return "tax-roll-share tax-roll-share--soft-up";
  if (value < -0.015) return "tax-roll-share tax-roll-share--down";
  if (value < -0.0025) return "tax-roll-share tax-roll-share--soft-down";
  return "tax-roll-share";
}

function animateText(element, from, to, formatter) {
  if (!element) return;
  const start = performance.now();
  const duration = 620;
  const delta = to - from;

  function step(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = formatter(from + delta * eased);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}
