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

const ARTICLE = {
  canonicalPath: "articles/watch-the-tax-roll-move/",
  legacyQueryValue: "watch-the-tax-roll-move",
  title: "Watch the Tax Roll Move",
  description: "A guided civic experiment showing how assessed values divide a budget, how budgets determine collections, and how levies connect the two.",
  modifiedDate: "2026-07-01",
  displayDate: "July 1, 2026",
  author: "Max Quattromani",
  authorEmail: "max@maxquatrromani.com",
  authorTitle: "Nebraska Certified Assessor",
  readingMinutes: 6,
  wordCount: 1200,
  lengthLabel: "interactive-case-study",
  tags: ["Tax roll", "Equalization", "Levies", "Property tax education"],
  assets: {
    authorImage: "assets/images/articles/max-quattromani-author.jpg",
    heroImage: "assets/images/articles/watch-the-tax-roll-move-hero-16x9.jpg",
    heroImageAlt: "Aerial view of homes, lawns, trees, and a neighborhood street intersection.",
    heroImageCredit: "Photo by Kelly on Pexels.",
    heroImageSource: "https://www.pexels.com/"
  },
  resourcesBlock: {
    title: "Resources and authorities",
    intro: "The experiment is simplified, but the distinction it teaches is the same distinction used in Nebraska property tax administration: values establish the tax base, budgets determine collections, and levies connect the two.",
    groups: [
      {
        heading: "Legal and public administration context",
        items: [
          {
            title: "Nebraska Constitution Article VIII, Section 1",
            type: "legal-authority",
            url: "https://nebraskalegislature.gov/laws/articles.php?article=VIII-1",
            description: "Constitutional foundation for uniform and proportionate taxation."
          },
          {
            title: "Neb. Rev. Stat. 77-112",
            type: "legal-authority",
            url: "https://nebraskalegislature.gov/laws/statutes.php?statute=77-112",
            description: "Definition of actual value for Nebraska property assessment."
          },
          {
            title: "Neb. Rev. Stat. 77-1601",
            type: "legal-authority",
            url: "https://nebraskalegislature.gov/laws/statutes.php?statute=77-1601",
            description: "Levy authority and the connection between tax requests and taxable value."
          }
        ]
      },
      {
        heading: "Companion reading",
        items: [
          {
            title: "How Your Property Value Becomes a Tax Bill",
            type: "companion-guide",
            url: "articles/how-your-property-value-becomes-a-tax-bill/",
            description: "A broader article explaining assessments, equalization, budgets, levies, and tax bills."
          },
          {
            title: "Assessment Up. Protest Denied. Taxes?",
            type: "case-study",
            url: "articles/assessment-up-protest-denied-taxes/",
            description: "A related case study on assessment movement, levy compression, and tax bill outcomes."
          }
        ]
      }
    ]
  }
};

const PROPERTIES = [
  { label: "House 1", value: 100000, color: "#58748a", tone: "Slate" },
  { label: "House 2", value: 100000, color: "#7f8a5b", tone: "Olive" },
  { label: "House 3", value: 100000, color: "#7890a3", tone: "Dusty Blue" },
  { label: "House 4", value: 100000, color: "#a6634f", tone: "Brick" },
  { label: "House 5", value: 100000, color: "#b99a55", tone: "Muted Gold" },
  { label: "House 6", value: 100000, color: "#4d8a88", tone: "Teal" },
  { label: "House 7", value: 100000, color: "#8d8274", tone: "Warm Gray" },
  { label: "House 8", value: 100000, color: "#7f6f92", tone: "Dusty Purple" },
  { label: "House 9", value: 100000, color: "#52606b", tone: "Muted Navy" },
  { label: "House 10", value: 100000, color: "#6f7d6a", tone: "Sage" }
];
const BASE_VALUES = PROPERTIES.map(property => property.value);
const BASE_TOTAL = sum(BASE_VALUES);
const BASE_BUDGET = 10000;
const BUDGET_UP = BASE_BUDGET * 1.03;
const CURRENCY_FORMAT = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const PERCENT_FORMAT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 3, minimumFractionDigits: 3 });
const SHARE_FORMAT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

const LESSONS = [
  {
    id: "everyone-up",
    number: "Question",
    title: "If everyone's assessment goes up, do everyone's taxes go up too?",
    question: "Every home's assessed value rises by 10%. The budget does not change.",
    intro: "What do you think will happen?",
    prediction: "The levy should adjust, but the burden should not redistribute.",
    action: "See the Answer",
    values: () => BASE_VALUES.map(value => value * 1.1),
    budget: BASE_BUDGET,
    result: "Not necessarily.",
    observation: "Almost nothing changes. Every home's assessed value increased. The levy compressed enough that nearly every tax bill stayed about the same.",
    why: "Because every property increased by the same percentage. No property became a larger share of the county's tax base. Instead, the levy adjusted.",
    remember: "Equal movement changes the levy. Unequal movement changes the burden."
  },
  {
    id: "everyone-down",
    number: "Question",
    title: "If everyone's assessment goes down, do taxes automatically go down?",
    question: "Every home's assessed value falls by 10%.",
    intro: "The budget stays exactly the same.",
    prediction: "The levy should adjust upward because the budget stayed the same.",
    action: "See the Answer",
    values: () => BASE_VALUES.map(value => value * 0.9),
    budget: BASE_BUDGET,
    result: "Again, very little changes.",
    observation: "Every home's assessed value fell. The levy expanded. Tax bills remained surprisingly similar.",
    why: "The county still needs to collect the same amount of money. When every property falls together, the levy simply adjusts upward.",
    remember: "Lower assessments alone do not guarantee lower taxes."
  },
  {
    id: "house-four-faster",
    number: "Question",
    title: "What happens if one house appreciates much faster than the others?",
    question: "One home rises by 30%.",
    intro: "The remaining homes rise by 10%. The budget increases by 3%.",
    prediction: "That home should carry more because its share of the tax base grows.",
    action: "See the Answer",
    values: () => BASE_VALUES.map((value, index) => value * (index === 3 ? 1.3 : 1.1)),
    budget: BUDGET_UP,
    result: "One property now carries more.",
    observation: "Only one property moved dramatically faster than the neighborhood. Its share of the county tax base increased.",
    why: "Because property taxes are based on relative movement. That home now represents a larger percentage of the county's total value.",
    remember: "Higher taxes usually come from becoming a larger share of the tax base, not simply from having a higher assessment."
  },
  {
    id: "two-speeds",
    number: "Question",
    title: "What happens when one part of town appreciates faster than another?",
    question: "Half the neighborhood rises 10%.",
    intro: "Half rises 5%. Budget rises 3%.",
    prediction: "The faster-moving half should pick up a larger share of the budget.",
    action: "See the Answer",
    values: () => BASE_VALUES.map((value, index) => value * (index < 5 ? 1.1 : 1.05)),
    budget: BUDGET_UP,
    result: "The burden begins to separate.",
    observation: "Properties that appreciated faster began carrying a larger portion of the budget.",
    why: "Different neighborhoods can experience different market conditions. Relative movement, not identical movement, creates redistribution.",
    remember: "Assessment differences redistribute responsibility."
  },
  {
    id: "mixed-year",
    number: "Question",
    title: "What does a real reassessment year usually look like?",
    question: "Some homes rise 2%. Others 5%. Others 9%.",
    intro: "Others 14%. Others 20%. Budget rises 3%.",
    prediction: "Homes that rise faster should gain share. Slower homes should lose share.",
    action: "See the Answer",
    values: () => BASE_VALUES.map((value, index) => value * [1.02, 1.05, 1.09, 1.14, 1.2, 1.2, 1.05, 1.09, 1.14, 1.2][index]),
    budget: BUDGET_UP,
    result: "Now the whole system is working together.",
    observation: "Every property followed its own path. The budget rose by 3%. The levy adjusted. Each property's share shifted differently.",
    why: "This resembles an actual reassessment cycle. No two neighborhoods move exactly alike.",
    remember: "Real tax bills are determined by how your property changed compared with everyone else's."
  }
];

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
      <style>${styles()}</style>
      <section class="tax-roll-intro tax-article-section tax-story-chapter tax-article-opening levy-wide-panel article-section ges-opening-section" data-tone="reflection" aria-labelledby="taxRollIntroTitle">
        <div class="editorial-narrow ges-section-lead">
          ${renderEntryPanel()}
          ${sectionHeader("Opening", "This is not a calculator.", "taxRollIntroTitle")}
          <p class="prose">Once the protest window closes, county officials finish reviewing valuation changes through the equalization process. After equalization is complete, those final assessed values become the county's tax roll.</p>
          <p class="prose">Those values do not determine how much money local government will collect. Instead, they determine how the tax burden is divided once local governments complete their budgeting process and levy rates are calculated.</p>
          <p class="prose">This guided experiment begins with a simple control group, then changes one pattern at a time so the relationships are easier to see.</p>
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

function renderEntryPanel() {
  return renderArticleEntryPanel({
    articleTitle: ARTICLE.title,
    authorImage: ARTICLE.assets.authorImage,
    authorMailto: `mailto:${ARTICLE.authorEmail}?subject=${encodeURIComponent(`Re: ${ARTICLE.title}`)}`,
    authorName: ARTICLE.author,
    authorTitle: ARTICLE.authorTitle,
    displayDate: ARTICLE.displayDate,
    icon: editorialIcon,
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
  return `
    <section class="tax-roll-experiment" aria-label="Guided tax roll experiment">
      <section class="tax-roll-neighborhood tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="information" aria-labelledby="taxRollNeighborhoodTitle">
        ${sectionHeader("The Control Group", "Start with ten identical homes.", "taxRollNeighborhoodTitle")}
        <p class="prose">To make the relationships easier to see, we'll begin with ten identical homes in one tax district, so they all share the same levy rate. Real properties often sit in different overlapping districts, but the core principle remains the same: values divide the tax base, budgets set collections, and levies connect the two.</p>
        <div class="tax-roll-homes" aria-label="Static ten-home neighborhood">
          ${PROPERTIES.map(renderProperty).join("")}
        </div>
      </section>
      <div class="tax-roll-baseline-shell" data-tax-roll-baseline-shell>
        <dl class="tax-roll-baseline" aria-label="Current experiment totals">
          <div><dt>Total Value</dt><dd data-kpi-value="totalValue">${displayCompactMoney(baseline.total)}</dd></div>
          <div><dt>Budget</dt><dd data-kpi-value="budgetValue">${displayCompactMoney(BASE_BUDGET)}</dd></div>
          <div class="tax-roll-baseline__hero"><dt>Levy</dt><dd data-kpi-value="levyRate">${formatCompactLevy(baseline.levy)}</dd></div>
          <div><dt>House 1 Tax</dt><dd data-kpi-value="sampleTax">${displayCompactMoney(baseline.taxes[0])}</dd></div>
        </dl>
      </div>

      ${LESSONS.slice(0, 2).map(renderLesson).join("")}
      ${renderBridge()}
      ${LESSONS.slice(2).map(renderLesson).join("")}

      <section class="tax-roll-final tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="reflection" aria-label="Final takeaway">
        ${renderFinalPie()}
        <p class="prose">Assessments determine each property's share of the tax base. Budgets determine how much money local government must collect. The levy connects those two ideas. Understanding property taxes begins with understanding that sequence.</p>
      </section>
    </section>
  `;
}

function renderFinalThought() {
  return `
    <section class="tax-roll-final-thought tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="reflection" aria-labelledby="taxRollFinalThoughtTitle">
      <h2 id="taxRollFinalThoughtTitle">One final thought.</h2>
      <p class="prose">If you've made it this far, you've probably noticed something surprising.</p>
      <p class="prose">Very little in this article was actually about individual homes.</p>
      <p class="prose">It was about relationships.</p>
      <p class="prose">A property's assessment matters because it determines that property's share of the county's tax base. But a tax bill isn't calculated in isolation. It reflects how your property changed relative to every other property around it, how much local government decided it needed to collect, and the levy required to connect those two pieces.</p>
      <p class="prose">That's why two neighbors can receive similar assessment notices and different tax bills. It's why large assessment increases don't always produce equally large tax increases. And it's why modest assessment increases sometimes do.</p>
      <p class="prose">The system is easier to understand once you stop asking, "What happened to my house?" and begin asking, "How did my house move compared with everyone else's?"</p>
      <p class="prose">That's the question this article was designed to answer.</p>
      <p class="prose">Because in property taxation, assessments determine how the tax base is shared.</p>
      <p class="prose">Budgets determine how much money must be collected.</p>
      <p class="prose">The levy connects the two.</p>
      <p class="prose">Understand that sequence, and the rest begins to make sense.</p>
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

function renderProperty(property, index) {
  const scale = houseScale(property.value);
  return `
    <article class="tax-roll-property" style="--property-color: ${escapeHtml(property.color)}; --house-scale: ${scale};">
      <svg class="tax-roll-house" viewBox="0 0 120 116" aria-hidden="true" focusable="false">
        <path class="tax-roll-house__shadow" d="M20 104c12 7 68 7 80 0 5-3 5-7 0-10-12-7-68-7-80 0-5 3-5 7 0 10Z"></path>
        <path class="tax-roll-house__roof" d="M18 54 60 18l42 36H88v42H32V54H18Z"></path>
        <path class="tax-roll-house__front" d="M36 55h48v42H36z"></path>
        <path class="tax-roll-house__foundation" d="M34 97h52"></path>
        <path class="tax-roll-house__door" d="M54 70h13v27H54z"></path>
        <path class="tax-roll-house__window" d="M72 66h10v10H72zM41 66h10v10H41z"></path>
      </svg>
      <p><span class="tax-roll-chip" aria-hidden="true"></span>${escapeHtml(property.label)}</p>
      <strong>${displayMoney(property.value)}</strong>
    </article>
  `;
}

function renderLesson(lesson) {
  return `
    <section class="tax-roll-lesson tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="information" data-lesson="${escapeHtml(lesson.id)}" aria-labelledby="${escapeHtml(lesson.id)}Title">
      <div class="tax-roll-lesson-grid">
        ${sectionHeader(lesson.number, lesson.title, `${lesson.id}Title`)}
        <div class="tax-roll-scenario-copy">
          <p class="tax-roll-question prose">${escapeHtml(lesson.question)}</p>
          <p class="tax-roll-lesson-intro prose">${escapeHtml(lesson.intro)}</p>
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
          ${renderMarginInsight({ label: "Prediction", text: lesson.prediction }, { placement: "inline" })}
          <div class="tax-roll-explanation" data-result-explanation="${escapeHtml(lesson.id)}" hidden>
            <section class="tax-roll-explanation-block">
              <h3>Observation</h3>
              <p class="prose" data-result-observation></p>
            </section>
            <section class="tax-roll-explanation-block">
              <h3>Why?</h3>
              <p class="prose" data-result-why></p>
            </section>
            <section class="tax-roll-explanation-block tax-roll-explanation-block--remember">
              <h3>Remember</h3>
              <p class="prose" data-result-remember></p>
            </section>
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
            <div class="tax-roll-table-wrap" data-result-table-wrap>${renderPendingResultTable()}</div>
            <h3 class="tax-roll-result-title" hidden></h3>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderBridge() {
  return `
    <aside class="tax-roll-bridge guided-transition" aria-label="Guided transition">
      <p>So what actually matters?</p>
      <p>The first two questions revealed the rule.</p>
      <p>When every property moves together, very little shifts.</p>
      <p>Now we'll change one property relative to the others.</p>
      <p>That's where the tax burden begins to move.</p>
    </aside>
  `;
}

function installTaxRollExperiment(root) {
  const baseline = calculate(BASE_VALUES, BASE_BUDGET);
  const metricElements = Object.fromEntries([...root.querySelectorAll("[data-kpi-value]")].map(element => [element.dataset.kpiValue, element]));
  installBaselineRibbon(root);
  let previous = {
    totalValue: baseline.total,
    budgetValue: BASE_BUDGET,
    levyRate: baseline.levy,
    sampleTax: baseline.taxes[0]
  };

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
        levyRate: scenario.levy,
        sampleTax: scenario.taxes[0]
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

function toggleMobileResultTable(button) {
  const shell = button.closest("[data-result-shell]");
  const isOpen = shell?.classList.toggle("is-table-open");
  button.setAttribute("aria-expanded", String(Boolean(isOpen)));
}

function installBaselineRibbon(root) {
  const shell = root.querySelector("[data-tax-roll-baseline-shell]");
  const ribbon = shell?.querySelector(".tax-roll-baseline");
  const experiment = root.querySelector(".tax-roll-experiment");
  if (!shell || !ribbon || !experiment) return;

  const update = () => {
    const top = Number.parseFloat(getComputedStyle(ribbon).top) || 0;
    const shellRect = shell.getBoundingClientRect();
    const experimentRect = experiment.getBoundingClientRect();
    const ribbonHeight = ribbon.offsetHeight;
    const shouldStick = shellRect.top <= top && experimentRect.bottom > top + ribbonHeight + 16;

    shell.style.minHeight = `${ribbonHeight}px`;
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
  const table = root.querySelector(`[data-result-shell="${lesson.id}"] .tax-roll-table-wrap`);
  const shell = root.querySelector(`[data-result-shell="${lesson.id}"]`);
  const section = root.querySelector(`[data-lesson="${lesson.id}"]`);
  const shouldShowHeading = window.matchMedia("(min-width: 760px)").matches;
  const target = shouldShowHeading ? section : shell || table;
  if (!target) return;
  const ribbon = root.querySelector(".tax-roll-baseline");
  const ribbonRect = ribbon?.getBoundingClientRect();
  const ribbonBottom = ribbonRect ? Math.max(0, ribbonRect.bottom) : 0;
  const offset = ribbonBottom + (shouldShowHeading ? 18 : 14);
  const top = window.scrollY + target.getBoundingClientRect().top - offset;
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  window.scrollTo({ top: Math.max(0, top), behavior });
}

function renderLessonResult(root, lesson, scenario, baseline) {
  const shell = root.querySelector(`[data-result-shell="${lesson.id}"]`);
  const explanation = root.querySelector(`[data-result-explanation="${lesson.id}"]`);
  if (!shell) return;
  const title = shell.querySelector(".tax-roll-result-title");
  shell.classList.remove("tax-roll-result-shell--pending");
  if (title) {
    title.hidden = false;
    title.textContent = lesson.result;
  }
  shell.querySelector(".tax-roll-table-wrap").innerHTML = renderResultTable(scenario, baseline);
  if (explanation) {
    explanation.hidden = false;
    explanation.querySelector("[data-result-observation]").textContent = lesson.observation;
    explanation.querySelector("[data-result-why]").textContent = lesson.why;
    explanation.querySelector("[data-result-remember]").textContent = lesson.remember;
  }
  requestAnimationFrame(() => {
    shell.classList.add("is-visible");
    explanation?.classList.add("is-visible");
  });
}

function renderResultTable(scenario, baseline) {
  return `
    <table class="tax-roll-result-table">
      <thead>
        <tr>
          <th scope="col">House</th>
          <th scope="col">Assessment</th>
          <th scope="col">Share of Tax Base</th>
          <th scope="col">Tax</th>
          <th scope="col">Tax Change</th>
        </tr>
      </thead>
      <tbody>
        ${PROPERTIES.map((property, index) => {
          const taxDelta = scenario.taxes[index] - baseline.taxes[index];
          const shareDelta = scenario.shares[index] - baseline.shares[index];
          return `
            <tr style="--property-color: ${escapeHtml(property.color)};">
              <th scope="row"><span class="tax-roll-chip" aria-hidden="true"></span>${escapeHtml(property.label)}</th>
              <td data-label="Assessment">${displayMoney(scenario.values[index])}</td>
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

function renderPendingResultTable() {
  return `
    <table class="tax-roll-result-table tax-roll-result-table--pending" aria-label="Question result table waiting to be revealed">
      <thead>
        <tr>
          <th scope="col">House</th>
          <th scope="col">Assessment</th>
          <th scope="col">Share of Tax Base</th>
          <th scope="col">Tax</th>
          <th scope="col">Tax Change</th>
        </tr>
      </thead>
      <tbody>
        ${PROPERTIES.map(property => `
          <tr style="--property-color: ${escapeHtml(property.color)};">
            <th scope="row"><span class="tax-roll-chip" aria-hidden="true"></span>${escapeHtml(property.label)}</th>
            <td data-label="Assessment" aria-label="Assessment pending">-</td>
            <td data-label="Share" aria-label="Share of tax base pending">-</td>
            <td data-label="Tax" aria-label="Tax pending">-</td>
            <td data-label="Change" aria-label="Tax change pending">-</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function updateMetrics(elements, previous, scenario, budget) {
  animateText(elements.totalValue, previous.totalValue, scenario.total, displayCompactMoney);
  animateText(elements.budgetValue, previous.budgetValue, budget, displayCompactMoney);
  animateText(elements.levyRate, previous.levyRate, scenario.levy, formatCompactLevy);
  animateText(elements.sampleTax, previous.sampleTax, scenario.taxes[0], displayCompactMoney);
  pulseMetricText(elements.totalValue, previous.totalValue, scenario.total);
  pulseMetricText(elements.budgetValue, previous.budgetValue, budget);
  pulseMetricText(elements.levyRate, previous.levyRate, scenario.levy);
  pulseMetricText(elements.sampleTax, previous.sampleTax, scenario.taxes[0]);
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
  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: rounded >= 100000 ? 1 : 0,
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

function formatDelta(value) {
  const rounded = roundDollar(value);
  if (rounded === 0) return "$0";
  return `${rounded > 0 ? "+" : "-"}${displayMoney(Math.abs(rounded))}`;
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

function houseScale(value) {
  return "1";
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

function styles() {
  return `
    .watch-tax-roll-route .ges-public-main {
      max-width: min(1120px, calc(100vw - 24px));
    }

    .tax-roll-article {
      --tax-roll-reading-shell-width: min(100%, var(--ges-width-reading, 46rem));
    }

    .tax-roll-intro,
    .tax-roll-neighborhood,
    .tax-roll-lesson,
    .tax-roll-final {
      margin: 0 auto;
      max-width: 780px;
    }

    .tax-roll-neighborhood {
      max-width: 1040px;
      width: 100%;
    }

    .tax-roll-lesson {
      max-width: 1040px;
      width: 100%;
    }

    .tax-roll-neighborhood > .tax-article-header,
    .tax-roll-neighborhood > p {
      max-width: 780px;
    }

    .tax-roll-intro {
      padding-bottom: clamp(28px, 8vw, 58px);
    }

    .tax-roll-intro .ges-section-lead > p.prose,
    .tax-roll-neighborhood > p.prose,
    .tax-roll-scenario-copy > p.prose,
    .tax-roll-explanation-block p.prose {
      margin: 1rem 0 0;
      max-width: 68ch;
    }

    .tax-roll-experiment {
      margin: 0 auto;
      max-width: 1040px;
    }

    html.watch-tax-roll-route,
    html.watch-tax-roll-route body {
      overflow-x: clip;
      overflow-y: visible;
    }

    .tax-roll-article {
      overflow: visible;
    }

    .tax-roll-neighborhood,
    .tax-roll-lesson,
    .tax-roll-final {
      border-top: 1px solid rgba(36, 59, 68, 0.11);
      padding: clamp(36px, 10vw, 82px) 0;
    }

    .tax-roll-neighborhood {
      padding-bottom: clamp(24px, 6vw, 44px);
    }

    .tax-roll-bridge + .tax-roll-lesson {
      border-top-color: rgba(36, 59, 68, 0.16);
      margin-top: clamp(24px, 5vw, 42px);
    }

    .tax-roll-baseline-shell {
      margin: clamp(12px, 3vw, 24px) 0 clamp(18px, 5vw, 36px);
    }

    .tax-roll-baseline {
      --tax-roll-sticky-top: calc(var(--gpr-global-header-height, 3.35rem) + 0.35rem);
      backdrop-filter: blur(18px);
      background: rgb(var(--ges-color-page) / 0.94);
      border-block: 1px solid rgba(36, 59, 68, 0.13);
      box-shadow: 0 0.5rem 1.2rem rgba(36, 59, 68, 0.05);
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0;
      margin: 0;
      position: sticky;
      top: var(--tax-roll-sticky-top);
      z-index: 30;
    }

    .tax-roll-baseline-shell.is-fixed .tax-roll-baseline {
      border-radius: 0 0 8px 8px;
      box-shadow: 0 0.72rem 1.4rem rgba(36, 59, 68, 0.12);
      inline-size: var(--tax-roll-sticky-width);
      inset-block-start: var(--tax-roll-sticky-top);
      inset-inline-start: var(--tax-roll-sticky-left);
      position: fixed;
      z-index: 80;
    }

    .tax-roll-baseline div {
      display: grid;
      gap: 0.16rem;
      min-width: 0;
      padding: 0.52rem 0.72rem 0.58rem;
    }

    .tax-roll-baseline div:not(:last-child) {
      border-right: 1px solid rgba(36, 59, 68, 0.1);
    }

    .tax-roll-baseline dt {
      color: var(--ges-color-text-muted, #5b6670);
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: clamp(0.5rem, 1.5vw, 0.64rem);
      font-weight: 750;
      letter-spacing: 0;
      line-height: 1.05;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .tax-roll-baseline dd {
      color: #243b44;
      font-family: "IBM Plex Sans", system-ui, sans-serif;
      font-size: clamp(0.95rem, 4.6vw, 1.32rem);
      font-weight: 850;
      letter-spacing: 0;
      line-height: 1;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tax-roll-baseline__hero {
      background: rgba(47, 115, 163, 0.07);
    }

    .tax-roll-baseline__hero dd {
      color: #1f5578;
      font-size: clamp(1.12rem, 5.5vw, 1.6rem);
    }

    .tax-roll-baseline dd.is-pulsing {
      animation: taxRollMetricTextPulse 520ms ease;
      transform-origin: left center;
      will-change: transform;
    }

    @keyframes taxRollMetricTextPulse {
      0%,
      100% {
        transform: scale(1);
      }

      42% {
        transform: scale(1.08);
      }
    }

    .tax-roll-homes {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin-top: clamp(22px, 7vw, 42px);
    }

    .tax-roll-property {
      background: rgba(255, 255, 255, 0.75);
      border: 1px solid rgba(36, 59, 68, 0.08);
      border-radius: 8px;
      display: grid;
      gap: 8px;
      min-height: 182px;
      padding: 12px 10px;
      text-align: center;
    }

    .tax-roll-house {
      display: block;
      height: 78px;
      margin: 0 auto;
      overflow: visible;
      transform: scale(var(--house-scale));
      transform-origin: 50% 100%;
      width: 78px;
    }

    .tax-roll-house__shadow {
      fill: rgba(30, 41, 48, 0.16);
    }

    .tax-roll-house__roof,
    .tax-roll-house__foundation {
      fill: var(--property-color);
      stroke: var(--property-color);
    }

    .tax-roll-house__front {
      fill: color-mix(in srgb, var(--property-color) 12%, #f4f5f3);
      stroke: rgba(36, 59, 68, 0.12);
      stroke-width: 1;
    }

    .tax-roll-house__foundation {
      fill: none;
      stroke-linecap: round;
      stroke-width: 3;
    }

    .tax-roll-house__door {
      fill: #f3d6a1;
    }

    .tax-roll-house__window {
      fill: #eef7f2;
      opacity: 0.92;
    }

    .tax-roll-property p,
    .tax-roll-property strong {
      margin: 0;
    }

    .tax-roll-property p {
      align-items: center;
      color: var(--ges-color-text-muted, #5b6670);
      display: inline-flex;
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 0.68rem;
      font-weight: 850;
      gap: 6px;
      justify-content: center;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    .tax-roll-property strong {
      color: #243b44;
      font-family: "IBM Plex Sans", system-ui, sans-serif;
      font-size: 1rem;
      font-weight: 850;
    }

    .tax-roll-chip {
      background: var(--property-color);
      border-radius: 999px;
      display: inline-block;
      height: 0.72rem;
      width: 0.72rem;
    }

    .tax-roll-lesson-grid {
      display: grid;
      gap: clamp(28px, 7vw, 40px);
    }

    .tax-roll-lesson-grid > .tax-article-header {
      max-width: 780px;
    }

    .tax-roll-scenario-copy {
      max-width: 780px;
    }

    .tax-roll-scenario-copy > p.prose,
    .levy-compression-page .tax-roll-scenario-copy > p.prose,
    .levy-compression-page .tax-roll-scenario-copy > p.prose + p.prose {
      font-family: "IBM Plex Sans", system-ui, sans-serif;
      text-indent: 0;
    }

    .tax-roll-reveal {
      align-items: center;
      background: #243b44;
      border: 0;
      border-radius: 999px;
      color: #fff;
      cursor: pointer;
      display: inline-flex;
      font-family: "IBM Plex Sans", system-ui, sans-serif;
      font-size: 0.98rem;
      font-weight: 800;
      gap: 0.52rem;
      justify-content: center;
      letter-spacing: 0;
      margin-top: clamp(18px, 5vw, 28px);
      padding: 0.78rem 1.05rem;
      transition: background-color 180ms ease, transform 180ms ease;
      width: auto;
    }

    .tax-roll-reveal:hover {
      transform: translateY(-1px);
    }

    .tax-roll-reveal.is-active {
      background: #2f73a3;
    }

    .tax-roll-reveal:disabled {
      cursor: wait;
      opacity: 0.86;
    }

    .tax-roll-reveal.is-loading {
      transform: translateY(0);
    }

    .tax-roll-reveal__icon {
      display: inline-grid;
      height: 1rem;
      place-items: center;
      position: relative;
      width: 1rem;
    }

    .tax-roll-reveal__icon-state {
      grid-area: 1 / 1;
      height: 1rem;
      transition: opacity 180ms ease, transform 180ms ease;
      width: 1rem;
    }

    .tax-roll-reveal__icon-state path {
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2.4;
    }

    .tax-roll-reveal__icon-state--chevron {
      opacity: 1;
      transform: rotate(90deg) scale(1);
    }

    .tax-roll-reveal__icon-state--check {
      opacity: 0;
      transform: translateX(-0.18rem) scale(0.72);
    }

    .tax-roll-reveal.is-active .tax-roll-reveal__icon-state--chevron {
      opacity: 0;
      transform: rotate(90deg) translateX(0.18rem) scale(0.72);
    }

    .tax-roll-reveal.is-active .tax-roll-reveal__icon-state--check {
      opacity: 1;
      transform: translateX(0) scale(1);
    }

    .tax-roll-result-column {
      margin-top: clamp(24px, 6vw, 38px);
    }

    .tax-roll-scenario-copy > .ges-margin-insight {
      inset: auto;
      margin-top: clamp(16px, 4vw, 24px);
      position: relative;
      width: min(100%, 18rem);
    }

    .tax-roll-result-shell {
      opacity: 1;
      transform: translateY(0);
      transition: opacity 280ms ease, transform 280ms ease;
    }

    .tax-roll-result-shell--pending {
      opacity: 0.74;
    }

    .tax-roll-result-shell.is-visible {
      opacity: 1;
      transform: translateY(0);
    }

    .tax-roll-result-shell .tax-roll-result-title {
      color: rgb(var(--ges-color-text));
      font-family: var(--levy-heading-font);
      font-size: var(--ges-type-xl);
      font-weight: 650;
      line-height: var(--ges-line-tight);
      margin: clamp(0.9rem, 2vw, 1.15rem) 0 0;
    }

    .tax-roll-table-toggle {
      align-items: center;
      appearance: none;
      background: rgba(36, 59, 68, 0.06);
      border: 1px solid rgba(36, 59, 68, 0.12);
      border-radius: 8px;
      color: rgb(var(--ges-color-text));
      cursor: pointer;
      display: inline-flex;
      font-family: var(--ges-font-heading, "Poppins", system-ui, sans-serif);
      font-size: 0.92rem;
      font-weight: 780;
      gap: 0.5rem;
      justify-content: space-between;
      line-height: 1.2;
      padding: 0.72rem 0.82rem;
      width: 100%;
    }

    .tax-roll-table-toggle svg {
      flex: 0 0 auto;
      height: 1rem;
      transition: transform 180ms ease;
      width: 1rem;
    }

    .tax-roll-table-toggle path {
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2.3;
    }

    .tax-roll-result-shell.is-table-open .tax-roll-table-toggle svg {
      transform: rotate(180deg);
    }

    .tax-roll-table-wrap {
      margin: 0;
      padding: 0 0 0.5rem;
    }

    .tax-roll-result-table {
      color: var(--ges-color-text, #1f2933);
      display: grid;
      font-family: "IBM Plex Sans", system-ui, sans-serif;
      font-size: 0.9rem;
      width: 100%;
    }

    .tax-roll-result-table thead {
      display: none;
    }

    .tax-roll-result-table--pending {
      color: rgb(var(--ges-color-text-muted, 91 102 112));
    }

    .tax-roll-result-table tbody {
      display: grid;
      gap: 10px;
    }

    .tax-roll-result-table tr {
      background: rgba(255, 255, 255, 0.58);
      border: 1px solid rgba(36, 59, 68, 0.09);
      border-radius: 8px;
      display: grid;
      gap: 8px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      padding: 0.82rem;
    }

    .tax-roll-result-table--pending tr {
      background: rgba(36, 59, 68, 0.035);
      border-color: rgba(36, 59, 68, 0.07);
    }

    .tax-roll-result-table tbody th {
      align-items: center;
      display: flex;
      gap: 8px;
      font-weight: 850;
      grid-column: 1 / -1;
      min-width: 0;
      text-align: left;
    }

    .tax-roll-result-table td {
      align-items: start;
      display: grid;
      gap: 0.22rem;
      min-width: 0;
      text-align: left;
    }

    .tax-roll-result-table--pending td {
      color: rgba(91, 102, 112, 0.72);
      font-weight: 800;
    }

    .tax-roll-result-table--pending tbody th {
      color: rgba(36, 59, 68, 0.78);
    }

    .tax-roll-result-table td::before {
      color: var(--ges-color-text-muted, #5b6670);
      content: attr(data-label);
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 0.64rem;
      font-weight: 850;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    .tax-roll-heat,
    .tax-roll-share {
      font-weight: 850;
    }

    .tax-roll-share {
      padding: 0.3rem 0.48rem;
    }

    .tax-roll-heat {
      padding: 0.3rem 0.48rem;
    }

    .tax-roll-heat--green {
      background: rgba(86, 125, 96, 0.18);
      color: #3f6d48;
    }

    .tax-roll-heat--soft-green,
    .tax-roll-share--down {
      background: rgba(86, 125, 96, 0.11);
      color: #4f7957;
    }

    .tax-roll-heat--amber {
      background: rgba(185, 154, 85, 0.16);
      color: #8d6729;
    }

    .tax-roll-heat--red,
    .tax-roll-share--up {
      background: rgba(166, 99, 79, 0.16);
      color: #8b4937;
    }

    .tax-roll-share--soft-up {
      background: rgba(185, 154, 85, 0.13);
      color: #8d6729;
    }

    .tax-roll-share--soft-down {
      background: rgba(86, 125, 96, 0.1);
      color: #4f7957;
    }

    .tax-roll-heat--neutral {
      background: rgba(36, 59, 68, 0.07);
      color: #52606b;
    }

    .tax-roll-explanation {
      display: grid;
      gap: clamp(16px, 4vw, 24px);
      margin-top: clamp(18px, 5vw, 28px);
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 280ms ease, transform 280ms ease;
    }

    .tax-roll-explanation.is-visible {
      opacity: 1;
      transform: translateY(0);
    }

    .tax-roll-explanation-block {
      border-top: 1px solid rgba(36, 59, 68, 0.1);
      padding-top: 0.92rem;
    }

    .tax-roll-explanation-block h3 {
      color: rgb(var(--ges-color-civic-blue));
      font-family: var(--ges-font-heading);
      font-size: var(--ges-type-xs);
      font-weight: var(--ges-weight-heavy);
      letter-spacing: var(--ges-letter-kicker);
      margin: 0;
      text-transform: uppercase;
    }

    .tax-roll-explanation-block p {
      margin-top: 0.42rem;
    }

    .tax-roll-explanation-block--remember p {
      color: rgb(var(--ges-color-text));
      font-family: var(--ges-font-heading);
      font-weight: var(--ges-weight-bold);
      line-height: 1.42;
    }

    .tax-roll-final {
      display: grid;
      align-items: center;
      border-top: 0;
      gap: clamp(18px, 4vw, 28px);
      grid-template-columns: 100px minmax(0, 1fr);
      justify-items: start;
      max-width: var(--tax-roll-reading-shell-width);
      padding-bottom: clamp(34px, 6vw, 58px);
      width: var(--tax-roll-reading-shell-width);
    }

    .tax-roll-experiment > .tax-roll-final.tax-story-chapter::before {
      background:
        linear-gradient(
          180deg,
          rgb(var(--ges-color-border-strong) / 0.48) 0 var(--ges-rule-width),
          rgb(var(--ges-color-highlight) / 0.74) var(--ges-rule-width) var(--ges-rule-width-strong)
        );
      box-shadow:
        0 calc(-1 * var(--ges-rule-width)) 0 rgb(var(--ges-color-highlight) / 0.18),
        0 var(--ges-rule-width) 0 rgb(var(--ges-color-shadow) / 0.035);
      content: "";
      display: block;
      grid-column: 1 / -1;
      height: var(--ges-rule-width-strong);
      inline-size: 100%;
      justify-self: stretch;
      margin: 0;
    }

    .tax-roll-final-pie {
      display: block;
      grid-column: 1;
      grid-row: 2;
      height: 100px;
      inline-size: 100px;
      max-inline-size: none;
      min-inline-size: 100px;
      overflow: visible;
      width: 100px;
    }

    .tax-roll-final-pie path {
      opacity: 0.88;
      stroke: rgba(245, 247, 248, 0.88);
      stroke-linejoin: round;
      stroke-width: 1;
    }

    .tax-roll-final p.prose {
      grid-column: 2;
      grid-row: 2;
      margin: 0;
    }

    .tax-roll-final-thought {
      border-top: 1px solid rgba(36, 59, 68, 0.12);
      margin: clamp(18px, 4vw, 34px) auto 0;
      max-width: var(--tax-roll-reading-shell-width);
      padding: clamp(28px, 5vw, 44px) 0 clamp(22px, 4vw, 34px);
      width: var(--tax-roll-reading-shell-width);
    }

    .tax-roll-final-thought h2 {
      color: rgb(var(--ges-color-text));
      font-family: var(--ges-font-heading);
      font-size: clamp(1.65rem, 4vw, 2.35rem);
      font-weight: var(--ges-weight-heavy);
      letter-spacing: 0;
      line-height: 1.05;
      margin: 0;
    }

    .tax-roll-final-thought p.prose {
      margin: 0.9rem 0 0;
      max-width: 62ch;
    }

    .tax-roll-article .ges-resources-block {
      margin-top: clamp(16px, 3vw, 22px);
      padding-top: clamp(16px, 3vw, 22px);
    }

    @media (max-width: 759px) {
      .tax-roll-result-shell:not(.is-table-open) .tax-roll-table-wrap {
        display: none;
      }

      .tax-roll-result-shell.is-table-open .tax-roll-table-wrap {
        display: block;
        margin-top: 0.85rem;
      }
    }

    @media (max-width: 640px) {
      .tax-roll-final {
        align-items: start;
        gap: 0.85rem;
        grid-template-columns: 60px minmax(0, 1fr);
      }

      .tax-roll-final-pie {
        grid-column: 1;
        height: 60px;
        inline-size: 60px;
        min-inline-size: 60px;
        width: 60px;
      }

      .tax-roll-final p.prose {
        grid-column: 2;
      }
    }

    @media (min-width: 760px) {
      .watch-tax-roll-route .ges-public-main {
        max-width: min(1120px, calc(100vw - 48px));
      }

      .tax-roll-table-toggle {
        display: none;
      }

      .tax-roll-intro,
      .tax-roll-neighborhood,
      .tax-roll-lesson {
        margin-left: 0;
      }

      .tax-roll-baseline {
        grid-template-columns: minmax(0, 1fr) minmax(0, 0.82fr) minmax(0, 0.9fr) minmax(0, 0.82fr);
      }

      .tax-roll-baseline__hero {
        padding-left: 0.7rem;
      }

      .tax-roll-homes {
        grid-template-columns: repeat(5, minmax(0, 1fr));
      }

      .tax-roll-lesson-grid {
        align-items: stretch;
        grid-template-columns: minmax(280px, 0.8fr) minmax(0, 1.2fr);
      }

      .tax-roll-lesson-grid > .tax-article-header {
        grid-column: 1 / -1;
        max-width: min(100%, 43rem);
      }

      .tax-roll-result-column {
        border-left: 1px solid rgba(36, 59, 68, 0.13);
        margin-top: 0.2rem;
        padding-left: clamp(22px, 3vw, 32px);
      }

      .tax-roll-reveal__icon-state--chevron {
        transform: translateX(0) scale(1);
      }

      .tax-roll-reveal.is-active .tax-roll-reveal__icon-state--chevron {
        transform: translateX(0.18rem) scale(0.72);
      }

      .tax-roll-result-table {
        border-collapse: collapse;
        display: table;
      }

      .tax-roll-result-table thead {
        display: table-header-group;
      }

      .tax-roll-result-table tbody {
        display: table-row-group;
      }

      .tax-roll-result-table tr {
        background: transparent;
        border: 0;
        border-radius: 0;
        display: table-row;
        padding: 0;
      }

      .tax-roll-result-table th,
      .tax-roll-result-table td {
        border-bottom: 1px solid rgba(36, 59, 68, 0.1);
        display: table-cell;
        padding: 0.48rem 0.62rem;
        text-align: right;
        white-space: normal;
      }

      .tax-roll-result-table th:first-child,
      .tax-roll-result-table td:first-child {
        text-align: left;
      }

      .tax-roll-result-table thead th {
        background: #243b44;
        color: #ffffff;
        font-family: var(--ges-font-heading, "Poppins", system-ui, sans-serif);
        font-size: 0.62rem;
        font-weight: 850;
        letter-spacing: 0;
        line-height: 1;
        padding-block: 0.62rem 0.42rem;
        text-transform: uppercase;
        vertical-align: bottom;
      }

      .tax-roll-result-table--pending thead th {
        background: rgba(36, 59, 68, 0.12);
        color: rgba(36, 59, 68, 0.58);
      }

      .tax-roll-result-table tbody th {
        display: table-cell;
        font-weight: 850;
        min-width: 8.5rem;
      }

      .tax-roll-result-table tbody th .tax-roll-chip {
        margin-right: 8px;
      }

      .tax-roll-result-table td::before {
        content: none;
      }

      .tax-roll-share {
        border-radius: 0;
        display: table-cell;
        min-width: 0;
        padding: 0.48rem 0.62rem;
      }

      .tax-roll-heat {
        border-radius: 0;
        display: table-cell;
        min-width: 0;
        padding: 0.48rem 0.62rem;
      }
    }
  `;
}
