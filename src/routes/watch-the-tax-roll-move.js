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
  description: "A guided civic lesson showing how assessed values divide a budget, how budgets determine collections, and how levies connect the two.",
  modifiedDate: "2026-07-02",
  displayDate: "July 2, 2026",
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
            title: "Assessment Up. Protest Denied. Taxes?",
            type: "case-study",
            url: "articles/assessment-up-protest-denied-taxes/",
            description: "A related case study on assessment movement, levy compression, and tax bill outcomes."
          },
          {
            title: "Before You Walk Into a Property Protest",
            type: "companion-guide",
            url: "https://quattromani.github.io/Guided-Parcel-Review/articles/before-you-walk-into-a-property-protest/",
            description: "A practical guide for reviewing your notice, organizing evidence, and preparing for a property protest."
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
    number: "Experiment 1",
    title: "If everyone's assessment goes up, do everyone's taxes go up too?",
    setup: [
      ["All homes", "+10%"],
      ["Budget", "No change"]
    ],
    prediction: "The levy should adjust, but the burden should not redistribute.",
    action: "See the Answer",
    values: () => BASE_VALUES.map(value => value * 1.1),
    budget: BASE_BUDGET,
    result: "Not necessarily.",
    observation: "Almost nothing changes. Every home's assessed value increased. The levy compressed enough that nearly every tax bill stayed about the same.",
    why: "Because every property increased by the same percentage. No property became a larger share of the county's tax base. Instead, the levy adjusted.",
    remember: "Equal movement changes the levy. Unequal movement changes the burden.",
    bridge: {
      icon: "balance",
      title: "Everyone moved together.",
      text: "That kept the tax burden in the same shape. Now reverse the direction and test the opening theory directly: do lower assessments, by themselves, change the result?"
    }
  },
  {
    id: "everyone-down",
    number: "Experiment 2",
    title: "If everyone's assessment goes down, would taxes go down?",
    setup: [
      ["All homes", "-10%"],
      ["Budget", "No change"]
    ],
    prediction: "The levy should adjust upward because the budget stayed the same.",
    action: "See the Answer",
    values: () => BASE_VALUES.map(value => value * 0.9),
    budget: BASE_BUDGET,
    result: "Again, very little changes.",
    observation: "Every home's assessed value fell. The levy expanded. Tax bills remained surprisingly similar.",
    why: "The county still needs to collect the same amount of money. When every property falls together, the levy simply adjusts upward.",
    remember: "Lower assessments alone do not guarantee lower taxes.",
    bridge: {
      icon: "compass",
      title: "So what actually matters?",
      text: "The original hypothesis did not hold. Lowering or raising every assessment together did not redistribute the tax burden. The levy absorbed that change."
    }
  },
  {
    id: "house-four-faster",
    number: "Experiment 3",
    title: "What happens if one house appreciates much faster than the others?",
    setup: [
      ["One home", "+30%"],
      ["Remaining homes", "+10%"],
      ["Budget", "+3%"]
    ],
    prediction: "That home should carry more because its share of the tax base grows.",
    action: "See the Answer",
    values: () => BASE_VALUES.map((value, index) => value * (index === 3 ? 1.3 : 1.1)),
    budget: BUDGET_UP,
    result: "One property now carries more.",
    observation: "Only one property moved dramatically faster than the neighborhood. Its share of the county tax base increased.",
    why: "Because property taxes are based on relative movement. That home now represents a larger percentage of the county's total value.",
    remember: "Higher taxes usually come from becoming a larger share of the tax base, not simply from having a higher assessment.",
    bridge: {
      icon: "map",
      title: "One house is easy to follow.",
      text: "This is the point where the opening question begins to answer itself. A neighborhood is where the pattern starts to feel more like real life."
    }
  },
  {
    id: "two-speeds",
    number: "Experiment 4",
    title: "What happens when one part of town appreciates faster than another?",
    setup: [
      ["Faster half", "+10%"],
      ["Slower half", "+5%"],
      ["Budget", "+3%"]
    ],
    prediction: "The faster-moving half should pick up a larger share of the budget.",
    action: "See the Answer",
    values: () => BASE_VALUES.map((value, index) => value * (index < 5 ? 1.1 : 1.05)),
    budget: BUDGET_UP,
    result: "The burden begins to separate.",
    observation: "Properties that appreciated faster began carrying a larger portion of the budget.",
    why: "Different neighborhoods can experience different market conditions. Relative movement, not identical movement, creates redistribution.",
    remember: "Assessment differences redistribute responsibility.",
    bridge: {
      icon: "cycle",
      title: "Now the pattern is less tidy.",
      text: "Real reassessment years rarely move in two clean groups. Some values rise more, some rise less, and the budget may change at the same time."
    }
  },
  {
    id: "mixed-year",
    number: "Experiment 5",
    title: "What is a more likely reassessment pattern?",
    setup: [
      ["Homes vary", "+2%, +5%, +9%, +14%, +20%"],
      ["Budget", "+3%"]
    ],
    prediction: "Homes that rise faster should gain share. Slower homes should lose share.",
    action: "See the Answer",
    values: () => BASE_VALUES.map((value, index) => value * [1.02, 1.05, 1.09, 1.14, 1.2, 1.2, 1.05, 1.09, 1.14, 1.2][index]),
    budget: BUDGET_UP,
    result: "Now the whole system is working together.",
    observation: "Every property followed its own path. The budget rose by 3%. The levy adjusted. Each property's share shifted differently.",
    why: "Mixed movement is common because no two parts of the tax base move exactly alike.",
    remember: "Tax bills are determined by how your property changed compared with everyone else's."
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
      ${renderEntryPanel()}
      <section class="tax-roll-intro tax-article-section tax-story-chapter tax-article-opening levy-wide-panel article-section ges-opening-section" data-tone="reflection" aria-labelledby="taxRollIntroTitle">
        <div class="editorial-narrow ges-section-lead">
          ${sectionHeader("", "Let's run an experiment.", "taxRollIntroTitle")}
          <p class="prose">Every good one begins with a question that can be tested.</p>
          <p class="prose">This one starts with a familiar assumption: if assessments went down instead of up, taxes should go down too.</p>
          <p class="prose">That sounds reasonable. If every property owner in a county received a 10% reduction in assessed value, most people would expect the tax bill to move in the same direction.</p>
          <p class="prose">But what if it did not?</p>
          <p class="prose">What if lowering every assessment mostly changed the levy instead?</p>
          <p class="prose">Rather than argue from intuition, we can simplify the system until each relationship is visible.</p>
          <p class="prose">We'll begin with ten identical homes, one fixed budget, and one levy rate. Then we'll change only one variable at a time and watch what happens.</p>
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
        <p class="prose">To make the relationships easier to see, we'll begin with ten identical homes. Every house is worth $100,000, creating a county tax base of $1 million. With a $10,000 budget, each home initially contributes the same amount.</p>
        ${renderControlNeighborhood()}
        ${renderBaselineTable(baseline)}
      </section>
      <div class="tax-roll-baseline-shell" data-tax-roll-baseline-shell>
        <div class="tax-roll-baseline-intro">
          <p class="guided-kicker">Current Totals</p>
          <p class="prose">These three numbers stay visible as each experiment changes the roll, the budget, or the relationship between properties.</p>
        </div>
        <dl class="tax-roll-baseline" aria-label="Current experiment totals">
          <div><dt>Total Value</dt><dd data-kpi-value="totalValue">${displayCompactMoney(baseline.total)}</dd></div>
          <div><dt>Budget</dt><dd data-kpi-value="budgetValue">${displayCompactMoney(BASE_BUDGET)}</dd></div>
          <div class="tax-roll-baseline__hero">
            <dt>Levy</dt>
            <dd class="tax-roll-levy-metric">
              <span class="tax-roll-levy-direction" data-levy-direction aria-label="Levy direction">–</span>
              <span class="tax-roll-levy-number" data-kpi-value="levyRate">${formatCompactLevy(baseline.levy)}</span>
            </dd>
          </div>
        </dl>
      </div>

      ${LESSONS.map(renderLesson).join("")}

      <section class="tax-roll-final tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="reflection" aria-label="Final takeaway">
        ${renderFinalPie()}
        <p class="prose">Assessments determine each property's share of the tax base. Budgets determine how much money local government must collect. The levy connects those two ideas.</p>
      </section>
    </section>
  `;
}

function renderFinalThought() {
  return `
    <section class="tax-roll-final-thought tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="reflection" aria-labelledby="taxRollFinalThoughtTitle">
      <h2 id="taxRollFinalThoughtTitle">One final thought.</h2>
      <p class="prose">This article began with a simple question: what would happen if assessments went down instead of up? At first, the answer seems obvious. Lower assessments should mean lower taxes.</p>
      <p class="prose">But after watching the tax roll move one step at a time, the system becomes easier to see. When every home moved together, very little changed. The levy adjusted. When one property moved differently than its neighbors, the tax burden shifted.</p>
      <p class="prose">That distinction explains why two homeowners in the same taxing district can experience very different tax bills, even when both receive a valuation increase.</p>
      <p class="prose">By the final experiment, the neighborhood behaved more like a real county. Assessments reflected actual differences between properties, the levy did not have to compensate for an oversimplified tax base, and the burden spread according to each property's position.</p>
      <p class="prose">As you leave this article, try replacing one question with another. Instead of asking, "How much did my assessment go up?" ask:</p>
      <aside class="tax-roll-final-transition guided-transition" aria-label="Final thought transition">
        <p>"How did my property move compared with everyone else's?"</p>
      </aside>
      <p class="prose">That's the question the property tax system is really answering. Assessment is not designed to raise taxes by itself. Its job is to position the tax base before the budget is applied.</p>
      <p class="prose">Assessments determine each property's share of the tax base. Budgets determine how much money must be collected. The levy connects the two.</p>
      <p class="prose">The better the tax base reflects reality, the more naturally the rest of the system can do its job. Accuracy compounds.</p>
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
  return `
    <section class="tax-roll-control-table" aria-labelledby="taxRollControlTableTitle">
      <div class="tax-roll-control-table__intro">
        <p class="guided-kicker">System Snapshot</p>
        <h3 id="taxRollControlTableTitle">Control group baseline</h3>
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
      <p class="tax-roll-control-table__note">These values establish the control group for every experiment that follows. Each home begins with the same value, carries the same share of the tax base, and pays the same amount toward the budget. Everything below changes only one variable at a time.</p>
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

function styles() {
  return `
    .watch-tax-roll-route .ges-public-main {
      max-width: min(1120px, calc(100vw - 24px));
    }

    .tax-roll-article {
      --tax-roll-reading-shell-width: min(100%, var(--ges-width-reading, 46rem));
    }

    .tax-roll-sr-only {
      clip: rect(0 0 0 0);
      clip-path: inset(50%);
      height: 1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px;
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
      margin: 0;
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
      padding: clamp(44px, 10vw, 72px) 0;
    }

    .tax-roll-neighborhood {
      padding-bottom: clamp(24px, 6vw, 44px);
    }

    .tax-roll-lesson-bridge {
      align-items: center;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(47, 115, 163, 0.24);
      border-radius: 16px;
      box-shadow: 0 0.85rem 2.2rem rgba(36, 59, 68, 0.055);
      color: rgb(var(--ges-color-text));
      column-gap: clamp(14px, 3vw, 20px);
      display: grid;
      font-family: var(--ges-font-heading);
      grid-template-columns: auto minmax(0, 1fr);
      line-height: 1.42;
      margin: clamp(22px, 4vw, 34px) auto 0;
      max-width: min(100%, 42rem);
      opacity: 0;
      padding: clamp(16px, 3vw, 22px);
      position: relative;
      transform: translateY(8px);
      transition: opacity 320ms ease, transform 320ms ease;
    }

    .tax-roll-lesson-bridge[hidden] {
      display: none;
    }

    .tax-roll-lesson-bridge.is-visible {
      opacity: 1;
      transform: translateY(0);
    }

    .tax-roll-lesson-bridge::before,
    .tax-roll-lesson-bridge::after {
      background: rgba(47, 115, 163, 0.28);
      content: "";
      display: block;
      inline-size: 1px;
      left: 50%;
      position: absolute;
      transform: translateX(-50%);
    }

    .tax-roll-lesson-bridge::before {
      block-size: calc(clamp(22px, 4vw, 34px) + 2px);
      bottom: 100%;
    }

    .tax-roll-lesson-bridge::after {
      block-size: clamp(30px, 6vw, 56px);
      top: 100%;
    }

    .tax-roll-lesson-bridge__icon {
      align-items: center;
      background: #2f73a3;
      border-radius: 999px;
      color: #fff;
      display: inline-flex;
      height: clamp(2.45rem, 5vw, 3rem);
      justify-content: center;
      width: clamp(2.45rem, 5vw, 3rem);
    }

    .tax-roll-lesson-bridge__icon svg {
      display: block;
      height: 1.25rem;
      width: 1.25rem;
    }

    .tax-roll-lesson-bridge__icon path {
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 1.8;
    }

    .tax-roll-lesson-bridge__copy {
      display: grid;
      gap: 0.24rem;
    }

    .tax-roll-lesson-bridge__copy strong,
    .tax-roll-lesson-bridge__copy span {
      margin: 0;
    }

    .tax-roll-lesson-bridge__copy strong {
      color: #245c92;
      font-size: clamp(0.98rem, 2vw, 1.08rem);
      font-weight: var(--ges-weight-heavy);
    }

    .tax-roll-lesson-bridge__copy span {
      color: var(--ges-color-text-muted, #5b6670);
      font-family: "IBM Plex Sans", system-ui, sans-serif;
      font-size: clamp(0.93rem, 1.7vw, 1rem);
      font-weight: 650;
    }

    .tax-roll-lesson > .tax-article-header {
      max-width: 780px;
    }

    .tax-roll-experiment-setup {
      align-items: center;
      background: rgb(var(--ges-color-page) / 0.96);
      border: 1px solid rgba(36, 59, 68, 0.11);
      border-radius: 999px;
      box-shadow: 0 0.45rem 1.1rem rgba(36, 59, 68, 0.045);
      column-gap: 0.7rem;
      display: flex;
      margin: clamp(16px, 3vw, 22px) auto -0.55rem;
      max-width: min(100%, 42rem);
      padding: 0.48rem 0.72rem;
      position: relative;
      width: fit-content;
      z-index: 2;
    }

    .tax-roll-experiment-setup p,
    .tax-roll-experiment-setup dt,
    .tax-roll-experiment-setup dd {
      margin: 0;
    }

    .tax-roll-experiment-setup p {
      align-items: center;
      align-self: stretch;
      background: rgba(116, 143, 95, 0.15);
      border-radius: 999px 0 0 999px;
      border-right: 1px solid rgba(36, 59, 68, 0.14);
      color: rgb(var(--ges-color-text));
      display: inline-flex;
      font-family: var(--ges-font-heading);
      font-size: 0.68rem;
      font-weight: var(--ges-weight-heavy);
      letter-spacing: 0.08em;
      line-height: 1;
      margin: -0.48rem 0 -0.48rem -0.72rem;
      padding: 0 0.82rem;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .tax-roll-experiment-setup__conditions {
      align-items: stretch;
      display: grid;
      grid-template-columns: minmax(0, auto) minmax(0, auto);
      min-width: 0;
    }

    .tax-roll-experiment-setup__group {
      align-items: center;
      display: grid;
      gap: 0.45rem;
      grid-template-columns: auto minmax(0, 1fr);
      min-width: 0;
      padding-inline: 0.72rem;
    }

    .tax-roll-experiment-setup__group + .tax-roll-experiment-setup__group {
      border-left: 1px solid rgba(36, 59, 68, 0.15);
    }

    .tax-roll-experiment-setup dt {
      align-self: center;
      color: var(--ges-color-text-muted, #5b6670);
      font-family: var(--ges-font-heading, "Poppins", system-ui, sans-serif);
      font-size: 0.7rem;
      font-weight: 820;
      letter-spacing: 0;
      line-height: 1.1;
    }

    .tax-roll-experiment-setup dd {
      color: rgb(var(--ges-color-text));
      font-family: var(--ges-font-heading, "Poppins", system-ui, sans-serif);
      font-size: 0.78rem;
      font-weight: 850;
      line-height: 1.05;
    }

    .tax-roll-experiment-setup dd,
    .tax-roll-experiment-setup dd > span,
    .tax-roll-experiment-setup dd strong {
      align-items: center;
      display: inline-flex;
      gap: 0.3rem;
      min-width: 0;
    }

    .tax-roll-experiment-setup dd {
      flex-wrap: wrap;
      row-gap: 0.2rem;
    }

    .tax-roll-experiment-setup__group--assessment dd {
      align-items: start;
      display: grid;
      gap: 0.18rem;
    }

    .tax-roll-experiment-setup__group--assessment dd > span {
      justify-content: space-between;
    }

    .tax-roll-experiment-setup dd > span > span:first-child {
      color: var(--ges-color-text-muted, #5b6670);
      font-weight: 740;
      white-space: nowrap;
    }

    .tax-roll-experiment-setup dd strong {
      color: rgb(var(--ges-color-text));
      font-weight: 900;
      white-space: nowrap;
    }

    .tax-roll-setup-arrow {
      color: rgb(var(--ges-color-civic-blue));
      font-size: 0.9em;
      line-height: 1;
    }

    .tax-roll-experiment-card {
      background: #fff;
      border: 1px solid rgba(36, 59, 68, 0.1);
      border-radius: 16px;
      box-shadow: 0 1rem 2.6rem rgba(36, 59, 68, 0.075);
      margin-top: 0;
      padding: clamp(18px, 4vw, 32px);
      transition: box-shadow 280ms ease, transform 280ms ease;
    }

    .tax-roll-experiment-card.is-revealed {
      box-shadow: 0 1.1rem 2.8rem rgba(36, 59, 68, 0.09);
    }

    .tax-roll-baseline-shell {
      margin: clamp(18px, 5vw, 36px) 0 clamp(22px, 5vw, 40px);
    }

    .tax-roll-baseline-intro {
      margin: 0 0 clamp(14px, 3vw, 22px);
      max-width: 46rem;
    }

    .tax-roll-baseline-intro .guided-kicker {
      margin: 0 0 0.45rem;
    }

    .tax-roll-baseline-intro .prose {
      color: rgb(var(--ges-color-text-muted));
      font-size: 1rem;
      line-height: 1.58;
      margin: 0;
      max-width: 66ch;
      text-indent: 0;
    }

    .tax-roll-baseline {
      --tax-roll-sticky-top: calc(var(--gpr-global-header-height, 3.35rem) + 0.35rem);
      backdrop-filter: blur(18px);
      background: rgb(var(--ges-color-page) / 0.94);
      border: 1px solid rgba(36, 59, 68, 0.12);
      border-radius: 12px;
      box-shadow: 0 0.7rem 1.8rem rgba(36, 59, 68, 0.06);
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 0.82fr) minmax(0, 1.08fr);
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

    .tax-roll-baseline-shell.is-fixed .tax-roll-baseline div {
      padding-block: 0.42rem 0.48rem;
    }

    .tax-roll-baseline-shell.is-fixed .tax-roll-baseline dt {
      font-size: clamp(0.48rem, 1.35vw, 0.58rem);
    }

    .tax-roll-baseline-shell.is-fixed .tax-roll-baseline dd {
      font-size: clamp(0.92rem, 4vw, 1.18rem);
    }

    .tax-roll-baseline-shell.is-fixed .tax-roll-baseline__hero dd {
      font-size: clamp(1.08rem, 4.8vw, 1.42rem);
    }

    .tax-roll-baseline div {
      display: grid;
      gap: 0.16rem;
      min-width: 0;
      padding: 0.62rem 0.86rem 0.68rem;
      position: relative;
    }

    .tax-roll-baseline div:not(:last-child) {
      border-right: 1px solid rgba(36, 59, 68, 0.1);
    }

    .tax-roll-baseline div:nth-child(1)::after,
    .tax-roll-baseline div:nth-child(2)::after {
      background: linear-gradient(90deg, rgba(47, 115, 163, 0.18), rgba(47, 115, 163, 0));
      block-size: 1px;
      bottom: 0.42rem;
      content: "";
      inline-size: 36%;
      opacity: 0.7;
      position: absolute;
      right: 0.65rem;
    }

    .tax-roll-baseline__hero::after {
      background: rgba(47, 115, 163, 0.18);
      block-size: 54%;
      bottom: -1px;
      content: "";
      inline-size: 1px;
      left: 50%;
      position: absolute;
      transform: translateX(-50%);
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
      background: linear-gradient(180deg, rgba(47, 115, 163, 0.12), rgba(47, 115, 163, 0.065));
      box-shadow: inset 0 3px 0 rgba(47, 115, 163, 0.42);
    }

    .tax-roll-baseline__hero dd {
      color: #1f5578;
      font-size: clamp(1.12rem, 5.5vw, 1.6rem);
    }

    .tax-roll-levy-metric {
      align-items: center;
      display: grid;
      gap: 0.35rem;
      grid-template-columns: minmax(0, 0.72fr) minmax(0, 1fr);
      min-width: 0;
    }

    .tax-roll-levy-direction,
    .tax-roll-levy-number {
      display: inline-block;
      min-width: 0;
    }

    .tax-roll-levy-direction {
      color: rgba(36, 59, 68, 0.52);
      font-weight: 900;
      text-align: center;
    }

    .tax-roll-levy-direction.is-up {
      color: #956a20;
    }

    .tax-roll-levy-direction.is-down {
      color: #4f8061;
    }

    .tax-roll-levy-number {
      overflow: visible;
      text-align: right;
    }

    .tax-roll-baseline dd.is-pulsing {
      animation: taxRollMetricTextPulse 520ms ease;
      transform-origin: left center;
      will-change: transform;
    }

    .tax-roll-levy-direction.is-pulsing {
      animation: taxRollMetricTextPulse 520ms ease;
      transform-origin: center;
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

    .tax-roll-control-neighborhood {
      margin: clamp(22px, 5vw, 36px) auto 0;
      max-width: 736px;
      width: min(100%, 736px);
    }

    .tax-roll-control-neighborhood__grid {
      background: linear-gradient(180deg, rgba(218, 231, 210, 0.72), rgba(203, 222, 194, 0.54));
      border: 1px solid rgba(87, 122, 79, 0.14);
      border-radius: 12px;
      display: grid;
      gap: clamp(0.48rem, 1.8vw, 0.82rem);
      grid-template-columns: repeat(5, minmax(0, 1fr));
      padding: clamp(0.72rem, 2vw, 1rem);
    }

    .tax-roll-control-home {
      align-items: center;
      display: grid;
      gap: 0.18rem;
      justify-items: center;
      min-width: 0;
      padding: 0.12rem 0;
      text-align: center;
    }

    .tax-roll-control-home__icon {
      align-items: center;
      display: inline-grid;
      min-height: clamp(2.2rem, 7vw, 3.15rem);
      place-items: center;
    }

    .tax-roll-control-home__icon svg {
      display: block;
      fill: var(--property-color);
      height: clamp(2.08rem, 6.5vw, 3rem);
      opacity: 0.94;
      width: clamp(2.22rem, 6.9vw, 3.15rem);
    }

    .tax-roll-control-home__icon svg path + path {
      fill: color-mix(in srgb, var(--property-color) 18%, #fff);
      stroke: rgba(36, 59, 68, 0.16);
      stroke-width: 0.5;
    }

    .tax-roll-control-home__label,
    .tax-roll-control-home__value {
      color: rgb(var(--ges-color-text));
      display: block;
      font-family: var(--ges-font-heading, "Poppins", system-ui, sans-serif);
      line-height: 1;
      min-width: 0;
    }

    .tax-roll-control-home__label {
      font-size: clamp(0.66rem, 2vw, 0.74rem);
      font-weight: 850;
    }

    .tax-roll-control-home__value {
      color: var(--ges-color-text-muted, #5b6670);
      font-size: clamp(0.56rem, 1.8vw, 0.64rem);
      font-weight: 780;
      white-space: nowrap;
    }

    .tax-roll-control-table {
      margin: clamp(22px, 5vw, 34px) auto 0;
      max-width: 736px;
      width: min(100%, 736px);
    }

    .tax-roll-control-table__intro {
      margin: 0 0 clamp(0.72rem, 2vw, 1rem);
    }

    .tax-roll-control-table__intro .guided-kicker {
      margin: 0 0 0.35rem;
    }

    .tax-roll-control-table__intro h3 {
      color: rgb(var(--ges-color-text));
      font-family: var(--ges-font-heading, "Poppins", system-ui, sans-serif);
      font-size: clamp(1.2rem, 3vw, 1.48rem);
      font-weight: 850;
      letter-spacing: 0;
      line-height: 1.12;
      margin: 0;
    }

    .tax-roll-result-table--baseline tr {
      animation: none;
    }

    .tax-roll-result-table--baseline td {
      font-weight: 800;
    }

    .tax-roll-control-table__note {
      color: rgb(var(--ges-color-text-muted));
      font-size: clamp(0.94rem, 2vw, 1rem);
      line-height: 1.56;
      margin: clamp(0.82rem, 2vw, 1rem) 0 0;
      max-width: 68ch;
      text-indent: 0;
    }

    .tax-roll-lesson-grid {
      display: grid;
      gap: clamp(24px, 6vw, 36px);
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
      margin-top: clamp(18px, 5vw, 26px);
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
      margin-top: 0;
    }

    .tax-roll-scenario-copy > .ges-margin-insight {
      inset: auto;
      margin-top: 0;
      position: relative;
      transform: translateY(0);
      transition: opacity 260ms ease, transform 260ms ease;
      width: min(100%, 18rem);
    }

    .tax-roll-experiment-card.is-revealed .tax-roll-scenario-copy > .ges-margin-insight {
      transform: translateY(-2px);
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

    .tax-roll-answer {
      margin-top: clamp(18px, 5vw, 28px);
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 280ms ease, transform 280ms ease;
    }

    .tax-roll-answer.is-visible {
      opacity: 1;
      transform: translateY(0);
    }

    .tax-roll-answer-kicker {
      margin: clamp(0.9rem, 2vw, 1.15rem) 0 0.28rem;
    }

    .tax-roll-answer .tax-roll-result-title {
      color: rgb(var(--ges-color-text));
      font-family: var(--levy-heading-font);
      font-size: var(--ges-type-xl);
      font-weight: 650;
      line-height: var(--ges-line-tight);
      margin: 0;
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

    .tax-roll-mobile-outcome {
      display: none;
    }

    .tax-roll-mobile-outcome-card {
      display: grid;
      gap: 0.62rem;
    }

    .tax-roll-mobile-outcome-card h3 {
      color: rgb(var(--ges-color-text));
      font-family: var(--ges-font-heading, "Poppins", system-ui, sans-serif);
      font-size: 1rem;
      font-weight: 850;
      letter-spacing: 0;
      line-height: 1.15;
      margin: 0;
    }

    .tax-roll-mobile-outcome-table {
      border: 1px solid rgba(36, 59, 68, 0.13);
      border-collapse: collapse;
      border-spacing: 0;
      color: rgb(var(--ges-color-text));
      font-family: var(--ges-font-heading, "Poppins", system-ui, sans-serif);
      font-variant-numeric: tabular-nums;
      inline-size: 100%;
      table-layout: fixed;
    }

    .tax-roll-mobile-col--house {
      inline-size: 18%;
    }

    .tax-roll-mobile-col--assessment {
      inline-size: 31%;
    }

    .tax-roll-mobile-col--tax {
      inline-size: 24%;
    }

    .tax-roll-mobile-col--change {
      inline-size: 27%;
    }

    .tax-roll-mobile-outcome-table th,
    .tax-roll-mobile-outcome-table td {
      border: 1px solid rgba(36, 59, 68, 0.11);
      line-height: 1.12;
      padding: 0.4rem 0.42rem;
      vertical-align: middle;
    }

    .tax-roll-mobile-outcome-table thead th {
      background: rgba(36, 59, 68, 0.08);
      color: var(--ges-color-text-muted, #5b6670);
      font-size: 0.58rem;
      font-weight: 850;
      letter-spacing: 0;
      text-align: right;
      text-transform: uppercase;
    }

    .tax-roll-mobile-outcome-table thead th:first-child {
      text-align: left;
    }

    .tax-roll-mobile-outcome-table tbody tr {
      animation: taxRollRowReveal 520ms ease both;
      animation-delay: calc(var(--row-order, 0) * 24ms);
    }

    .tax-roll-mobile-outcome-table tbody th,
    .tax-roll-mobile-outcome-table tbody td {
      font-size: clamp(0.78rem, 3.65vw, 0.9rem);
      font-weight: 820;
    }

    .tax-roll-mobile-outcome-table tbody th {
      text-align: left;
      width: 18%;
    }

    .tax-roll-mobile-outcome-table tbody td {
      text-align: right;
      white-space: nowrap;
    }

    .tax-roll-mobile-outcome-table .tax-roll-heat {
      border-radius: 0;
      display: table-cell;
      padding: 0.4rem 0.42rem;
    }

    .tax-roll-mobile-row__identity {
      align-items: center;
      display: inline-flex;
      gap: 0.32rem;
      min-width: 0;
    }

    .tax-roll-mobile-row__identity span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tax-roll-mobile-house {
      display: block;
      flex: 0 0 auto;
      height: 0.95rem;
      width: 1rem;
    }

    @keyframes taxRollMobileDetailReveal {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
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

    .tax-roll-result-table colgroup {
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
      animation: taxRollRowReveal 520ms ease both;
      animation-delay: calc(var(--row-order, 0) * 28ms);
      background: rgba(255, 255, 255, 0.58);
      border: 1px solid rgba(36, 59, 68, 0.09);
      border-radius: 8px;
      display: grid;
      gap: 8px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      padding: 0.82rem;
    }

    .tax-roll-result-table--pending tr {
      animation: none;
    }

    @keyframes taxRollRowReveal {
      from {
        opacity: 0.58;
        transform: translateY(5px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
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

    .tax-roll-table-house {
      align-items: center;
      display: inline-flex;
      gap: 0.36rem;
      min-width: 0;
    }

    .tax-roll-table-house svg {
      display: block;
      flex: 0 0 auto;
      height: 1.2rem;
      width: 1.28rem;
    }

    .tax-roll-table-house__roof {
      fill: var(--property-color);
      stroke: color-mix(in srgb, var(--property-color) 76%, #243b44);
      stroke-linejoin: round;
      stroke-width: 0.8;
    }

    .tax-roll-table-house__door {
      fill: #f3d6a1;
      opacity: 0.9;
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

    .tax-roll-assessment-change {
      color: #52606b;
      font-weight: 850;
    }

    .tax-roll-assessment-change__content {
      align-items: center;
      display: inline-flex;
      gap: 0.36rem;
      white-space: nowrap;
    }

    .tax-roll-assessment-change svg {
      display: block;
      flex: 0 0 auto;
      height: 1.2rem;
      width: 1.2rem;
    }

    .tax-roll-assessment-change path {
      fill: currentColor;
    }

    .tax-roll-assessment-change--up {
      color: #8d6729;
    }

    .tax-roll-assessment-change--down {
      color: #4f7957;
    }

    .tax-roll-assessment-change--flat {
      color: #52606b;
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

    .tax-roll-result-table--baseline {
      border-collapse: collapse;
      display: table;
      table-layout: fixed;
    }

    .tax-roll-result-table--baseline thead {
      display: table-header-group;
    }

    .tax-roll-result-table--baseline colgroup {
      display: table-column-group;
    }

    .tax-roll-result-table--baseline col {
      display: table-column;
    }

    .tax-roll-result-table--baseline tbody {
      display: table-row-group;
    }

    .tax-roll-result-table--baseline tr {
      background: transparent;
      border: 0;
      border-radius: 0;
      display: table-row;
      padding: 0;
    }

    .tax-roll-result-table--baseline th,
    .tax-roll-result-table--baseline td {
      border-bottom: 1px solid rgba(36, 59, 68, 0.1);
      display: table-cell;
      padding: 0.46rem 0.44rem;
      text-align: right;
      white-space: normal;
    }

    .tax-roll-result-table--baseline th:first-child,
    .tax-roll-result-table--baseline td:first-child {
      text-align: left;
    }

    .tax-roll-result-table--baseline thead th {
      background: #243b44;
      color: #ffffff;
      font-family: var(--ges-font-heading, "Poppins", system-ui, sans-serif);
      font-size: clamp(0.5rem, 1.8vw, 0.62rem);
      font-weight: 850;
      letter-spacing: 0;
      line-height: 1;
      padding-block: 0.58rem 0.4rem;
      text-transform: uppercase;
      vertical-align: bottom;
    }

    .tax-roll-result-table--baseline tbody th {
      display: table-cell;
      font-weight: 850;
      min-width: 0;
    }

    .tax-roll-result-table--baseline td::before {
      content: none;
    }

    .tax-roll-result-table--baseline .tax-roll-table-house {
      gap: 0.24rem;
    }

    .tax-roll-result-table--baseline .tax-roll-table-house svg {
      height: 1rem;
      width: 1.08rem;
    }

    .tax-roll-result-table--baseline .tax-roll-result-col--house {
      width: 16%;
    }

    .tax-roll-result-table--baseline .tax-roll-baseline-col--assessment {
      width: 31%;
    }

    .tax-roll-result-table--baseline .tax-roll-baseline-col--share {
      width: 27%;
    }

    .tax-roll-result-table--baseline .tax-roll-baseline-col--tax {
      width: 26%;
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
      min-width: 0;
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
      opacity: 0;
      padding-top: 0.92rem;
      transform: translateY(6px);
    }

    .tax-roll-explanation.is-visible .tax-roll-explanation-block {
      animation: taxRollExplanationReveal 460ms ease both;
    }

    .tax-roll-explanation.is-visible .tax-roll-explanation-block:nth-child(2) {
      animation-delay: 90ms;
    }

    .tax-roll-explanation.is-visible .tax-roll-explanation-block:nth-child(3) {
      animation-delay: 180ms;
    }

    @keyframes taxRollExplanationReveal {
      from {
        opacity: 0;
        transform: translateY(6px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .tax-roll-explanation-block h3 {
      align-items: center;
      color: rgb(var(--ges-color-civic-blue));
      display: inline-flex;
      font-family: var(--ges-font-heading);
      font-size: var(--ges-type-xs);
      font-weight: var(--ges-weight-heavy);
      gap: 0.38rem;
      letter-spacing: var(--ges-letter-kicker);
      margin: 0;
      text-transform: uppercase;
    }

    .tax-roll-explanation-block h3 svg {
      display: block;
      height: 0.92rem;
      width: 0.92rem;
    }

    .tax-roll-explanation-block h3 svg path {
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 1.8;
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
      column-gap: clamp(24px, 4vw, 36px);
      row-gap: clamp(18px, 4vw, 28px);
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
      border-top: 0;
      gap: 0;
      margin: clamp(30px, 5vw, 48px) auto 0;
      max-width: var(--tax-roll-reading-shell-width);
      padding: clamp(30px, 5vw, 48px) 0 clamp(22px, 4vw, 34px);
      position: relative;
      width: var(--tax-roll-reading-shell-width);
    }

    .tax-roll-final-thought::before {
      background: linear-gradient(to bottom, rgba(36, 59, 68, 0.18), rgba(255, 255, 255, 0.82));
      block-size: 2px;
      content: "";
      inline-size: 100%;
      inset: 0 auto auto 0;
      position: absolute;
    }

    .tax-roll-final-thought h2 {
      color: rgb(var(--ges-color-text));
      font-family: var(--ges-font-heading);
      font-size: clamp(1.65rem, 4vw, 2.35rem);
      font-weight: var(--ges-weight-heavy);
      letter-spacing: 0;
      line-height: 1.05;
      margin: 0 0 clamp(1rem, 2vw, 1.25rem);
    }

    .tax-roll-final-thought p.prose {
      margin: 0;
      max-width: 62ch;
    }

    .tax-roll-final-thought p.prose + p.prose {
      margin-top: 0.85rem;
    }

    .tax-roll-final-transition {
      margin: clamp(1.1rem, 3vw, 1.45rem) auto;
      max-width: 62ch;
    }

    .tax-roll-final-transition + p.prose {
      margin-top: clamp(1rem, 2vw, 1.2rem);
    }

    @media (max-width: 759px) {
      .tax-roll-baseline {
        grid-template-columns: minmax(0, 0.9fr) minmax(0, 0.88fr) minmax(0, 1.22fr);
      }

      .tax-roll-baseline div {
        padding-inline: 0.62rem;
      }

      .tax-roll-baseline__hero {
        padding-inline: 0.52rem 0.64rem;
      }

      .tax-roll-baseline__hero dd,
      .tax-roll-baseline-shell.is-fixed .tax-roll-baseline__hero dd {
        font-size: clamp(1.02rem, 5vw, 1.34rem);
      }

      .tax-roll-levy-metric {
        gap: 0.22rem;
        grid-template-columns: minmax(1.15rem, 0.44fr) minmax(3.1rem, 1fr);
      }

      .tax-roll-experiment-setup {
        align-items: stretch;
        border-radius: 14px;
        display: grid;
        gap: 0.46rem;
        margin: clamp(14px, 5vw, 20px) auto -0.45rem;
        padding: 0.58rem 0.68rem;
        width: min(100%, 24rem);
      }

      .tax-roll-experiment-setup p {
        border-radius: 13px 13px 0 0;
        border-right: 0;
        border-bottom: 1px solid rgba(36, 59, 68, 0.12);
        margin: -0.58rem -0.68rem 0;
        min-height: 2rem;
        padding: 0 0.68rem;
      }

      .tax-roll-experiment-setup__conditions {
        gap: 0.36rem;
        grid-template-columns: 1fr;
      }

      .tax-roll-experiment-setup__group {
        gap: 0.5rem;
        grid-template-columns: minmax(5.8rem, auto) minmax(0, 1fr);
        padding-inline: 0;
      }

      .tax-roll-experiment-setup__group + .tax-roll-experiment-setup__group {
        border-left: 0;
        border-top: 1px solid rgba(36, 59, 68, 0.11);
        padding-top: 0.36rem;
      }

      .tax-roll-experiment-card:not(.is-revealed) {
        height: auto;
        min-height: 0;
        padding-bottom: clamp(18px, 5vw, 24px);
      }

      .tax-roll-experiment-card:not(.is-revealed) .tax-roll-lesson-grid {
        align-items: start;
        gap: 0;
        grid-auto-rows: max-content;
        min-height: 0;
      }

      .tax-roll-experiment-card:not(.is-revealed) .tax-roll-scenario-copy {
        display: grid;
        gap: 1.35rem;
        min-height: 0;
      }

      .tax-roll-experiment-card:not(.is-revealed) .tax-roll-result-column {
        display: none;
      }

      .tax-roll-experiment-card:not(.is-revealed) .tax-roll-explanation {
        display: none;
      }

      .tax-roll-experiment-card.is-revealed .tax-roll-result-column {
        display: block;
      }

      .tax-roll-result-shell--pending {
        display: none;
      }

      .tax-roll-table-toggle,
      .tax-roll-experiment-card .tax-roll-table-wrap {
        display: none !important;
      }

      .tax-roll-mobile-outcome:not([hidden]) {
        display: block;
      }
    }

    @media (max-width: 640px) {
      .tax-roll-final {
        align-items: start;
        column-gap: 1rem;
        row-gap: 0.85rem;
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
        grid-template-columns: minmax(0, 1fr) minmax(0, 0.82fr) minmax(0, 1.08fr);
      }

      .tax-roll-baseline__hero {
        padding-left: 0.7rem;
      }

      .tax-roll-lesson-grid {
        align-items: stretch;
        column-gap: clamp(28px, 7vw, 40px);
        row-gap: 0;
        grid-template-columns: minmax(280px, 0.8fr) minmax(0, 1.2fr);
      }

      .tax-roll-lesson-grid > .tax-article-header {
        grid-column: 1 / -1;
        max-width: min(100%, 43rem);
      }

      .tax-roll-scenario-copy {
        grid-column: 1;
        grid-row: 1;
      }

      .tax-roll-result-column {
        border-left: 1px solid rgba(36, 59, 68, 0.13);
        grid-column: 2;
        grid-row: 1 / span 2;
        margin-top: 0.2rem;
        padding-left: clamp(22px, 3vw, 32px);
      }

      .tax-roll-explanation {
        grid-column: 1;
        grid-row: 2;
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
        table-layout: fixed;
      }

      .tax-roll-result-col--house {
        width: 13%;
      }

      .tax-roll-result-col--assessment {
        width: 17%;
      }

      .tax-roll-result-col--delta {
        width: 12%;
      }

      .tax-roll-result-col--share {
        width: 24%;
      }

      .tax-roll-result-col--tax,
      .tax-roll-result-col--tax-change {
        width: 16%;
      }

      .tax-roll-baseline-col--assessment,
      .tax-roll-baseline-col--share,
      .tax-roll-baseline-col--tax {
        width: 29%;
      }

      .tax-roll-result-table thead {
        display: table-header-group;
      }

      .tax-roll-result-table colgroup {
        display: table-column-group;
      }

      .tax-roll-result-table col {
        display: table-column;
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
        background: rgba(36, 59, 68, 0.78);
        color: rgba(255, 255, 255, 0.9);
      }

      .tax-roll-result-table tbody th {
        display: table-cell;
        font-weight: 850;
        min-width: 0;
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
