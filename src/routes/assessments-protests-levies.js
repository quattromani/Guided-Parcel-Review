import {
  installGuideUtilityLanguage,
  renderActTransition,
  renderArticleEntryPanel,
  renderArticleTags,
  renderMarginInsight,
  renderMemoryAnchor,
  renderSectionHeader
} from "../ges/article-components.js?v=db3aed6";
import { installGesReadingProgress } from "../ges/reading-progress.js?v=db3aed6";
import { createGesArticleShell } from "../ges/shell.js?v=db3aed6";
import { howYourPropertyValueBecomesATaxBillArticle as articleSource } from "../content/articles/how-your-property-value-becomes-a-tax-bill.js?v=db3aed6";
import { escapeHtml } from "../utils/html.js?v=db3aed6";

const ARTICLE = articleSource;
const ACT = ARTICLE.actOne;
const ARTICLE_CANONICAL_PATH = ARTICLE.canonicalPath;
const ARTICLE_LEGACY_QUERY_VALUE = ARTICLE.legacyQueryValue;

function normalizedPathname() {
  return window.location.pathname.endsWith("/")
    ? window.location.pathname
    : `${window.location.pathname}/`;
}

function absoluteUrl(path = "") {
  return new URL(path, document.baseURI).href;
}

function icon(name) {
  const paths = {
    assessment: "<path d='M4 19V7l8-4 8 4v12'></path><path d='M8 19v-7h8v7'></path><path d='M9 9h6'></path>",
    equalization: "<path d='M12 3v18'></path><path d='M5 7h14'></path><path d='m6 7-3 6h6L6 7Z'></path><path d='m18 7-3 6h6l-3-6Z'></path>",
    taxation: "<path d='M7 3h10v18H7z'></path><path d='M10 7h4'></path><path d='M10 11h4'></path><path d='M10 15h2'></path>",
    role: "<path d='M16 21v-2a4 4 0 0 0-8 0v2'></path><circle cx='12' cy='7' r='4'></circle>",
    notice: "<path d='M7 3h7l3 3v15H7z'></path><path d='M14 3v4h4'></path><path d='M9.5 11h5'></path><path d='M9.5 15h5'></path>"
  };

  return `
    <svg class="editorial-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      ${paths[name] ?? paths.notice}
    </svg>
  `;
}

function metadata() {
  return {
    title: ARTICLE.title,
    documentTitle: `${ARTICLE.title} | Guided Parcel Review`,
    description: ARTICLE.description,
    socialDescription: ARTICLE.description,
    canonicalPath: ARTICLE_CANONICAL_PATH,
    pageType: "article",
    ogType: "article",
    robots: "noindex, follow",
    author: ARTICLE.author,
    modifiedDate: ARTICLE.modifiedDate,
    section: "Property tax education",
    tags: ARTICLE.tags,
    keywords: ARTICLE.keywords,
    socialImage: absoluteUrl(ARTICLE.assets.socialImage),
    socialImageAlt: ARTICLE.assets.heroImageAlt
  };
}

export function isAssessmentsProtestsLeviesRequest(searchParams = new URLSearchParams(window.location.search)) {
  return searchParams.get("article") === ARTICLE_LEGACY_QUERY_VALUE
    || normalizedPathname().endsWith(`/${ARTICLE_CANONICAL_PATH}`);
}

export function renderAssessmentsProtestsLeviesActOne() {
  const shell = createGesArticleShell({
    htmlClasses: ["assessments-protests-levies-shell-route"],
    metadata: metadata(),
    routeName: "assessments-protests-levies"
  });

  if (!shell?.coverRegion) return;

  shell.setCover(renderHero());
  shell.setBody(`
    <article class="editorial-guide tax-article-panel assessment-tax-guide-page ges-act-one-article" data-county-theme="gage" data-ges-reading-progress-target aria-label="${escapeHtml(ARTICLE.title)}">
      ${renderOpeningSection()}
      ${renderNoticeSection()}
      ${renderSystemMapSection()}
      ${renderResponsibilitySection()}
      ${renderSourceNote(ACT.sourceNote)}
      ${renderActTransition(ACT.transition)}
      <span data-ges-reading-progress-end aria-hidden="true"></span>
    </article>
  `);

  installGuideUtilityLanguage(shell.bodyRegion);
  installLaneFocus(shell.bodyRegion);
  installGesReadingProgress({ root: shell.bodyRegion });
}

function renderHero() {
  return `
    <header class="article-hero ges-act-one-hero" aria-labelledby="assessmentTaxArticleTitle">
      <div class="article-hero-packet">
        <div class="hero-kicker-row">
          <p class="guided-kicker hero-kicker hero-brand-kicker">
            <span class="hero-kicker-text">
              <span class="hero-kicker-label">Article</span>
              <span class="hero-kicker-divider" aria-hidden="true">/</span>
              <span class="hero-kicker-subject">Assessments, Protests, and Levies</span>
            </span>
          </p>
        </div>
        <h1 id="assessmentTaxArticleTitle" class="hero-title">${escapeHtml(ARTICLE.title)}</h1>
        <p class="hero-deck">${escapeHtml(ARTICLE.subtitle)}</p>
        ${renderArticleTags(ARTICLE.tags)}
      </div>
      <figure class="article-hero-media hero-media ges-act-one-hero__media">
        <img src="${escapeHtml(ARTICLE.assets.heroImage)}" alt="${escapeHtml(ARTICLE.assets.heroImageAlt)}" loading="eager" decoding="async" fetchpriority="high" />
        <div class="ges-hero-notice" aria-hidden="true">
          <p class="ges-hero-notice__eyebrow">Valuation notice</p>
          <p class="ges-hero-notice__value">$285,015</p>
          <p class="ges-hero-notice__status">Value changed. Tax not calculated.</p>
        </div>
        <figcaption class="levy-sr-only">${escapeHtml(ARTICLE.assets.heroImageAlt)} ${escapeHtml(ARTICLE.assets.heroImageCredit)}</figcaption>
      </figure>
    </header>
  `;
}

function renderOpeningSection() {
  return `
    <section class="tax-story-chapter article-section ges-opening-section ges-act-section ges-act-opening" data-tone="information" aria-labelledby="noticeMomentTitle">
      ${renderArticleEntryPanel({
        articleTitle: ARTICLE.title,
        authorImage: ARTICLE.assets.authorImage,
        authorMailto: `mailto:${ARTICLE.authorEmail}`,
        authorName: ARTICLE.author,
        authorTitle: ARTICLE.authorTitle,
        displayDate: ARTICLE.displayDate,
        icon,
        readingMinutes: ARTICLE.reading.minutes,
        wordCount: ARTICLE.reading.wordCount,
        lengthLabel: ARTICLE.reading.lengthLabel
      })}
      ${renderSectionHeader(ACT.kicker, ACT.title, "noticeMomentTitle", {
        companion: "Before the article explains methods, deadlines, or levies, it starts with the question a property owner actually has first.",
        marginInsight: ACT.marginInsights.notice,
        marginInsightPlacement: "first"
      })}
      <p class="ges-act-lede">${escapeHtml(ACT.heroHook)}</p>
      ${renderMemoryAnchor(ACT.memoryAnchor)}
    </section>
  `;
}

function renderNoticeSection() {
  const notice = ACT.notice;

  return `
    <section class="tax-story-chapter article-section ges-act-section" data-tone="information" aria-labelledby="valuationNoticeTitle">
      ${renderSectionHeader("First Question", "What did I just receive?", "valuationNoticeTitle", {
        companion: "A valuation notice tells you the county changed or reported a value. It does not calculate the final tax bill."
      })}
      <figure class="ges-annotated-notice" aria-labelledby="annotatedNoticeTitle">
        <div class="ges-annotated-notice__paper">
          <div class="ges-annotated-notice__masthead">
            <p class="ges-annotated-notice__county">County Assessor</p>
            <h3 id="annotatedNoticeTitle">${escapeHtml(notice.title)}</h3>
            <p>${escapeHtml(notice.subtitle)}</p>
          </div>
          <dl class="ges-annotated-notice__fields">
            ${notice.fields.map((field, index) => `
              <div class="ges-annotated-notice__field" data-highlight="${index === 3 ? "tax" : "value"}">
                <dt>${escapeHtml(field.label)}</dt>
                <dd>${escapeHtml(field.value)}</dd>
                <p>${escapeHtml(field.note)}</p>
              </div>
            `).join("")}
          </dl>
        </div>
        <figcaption>${escapeHtml(notice.caption)}</figcaption>
      </figure>
    </section>
  `;
}

function renderSystemMapSection() {
  const map = ACT.systemMap;

  return `
    <section class="tax-story-chapter article-section ges-act-section" data-tone="comparison" aria-labelledby="systemMapTitle">
      ${renderSectionHeader("System Map", map.title, "systemMapTitle", {
        companion: map.intro
      })}
      <ol class="ges-three-lane-map" aria-label="Assessment, equalization, and taxation process lanes" data-active-lane="assessment">
        ${map.lanes.map((lane, index) => `
          <li class="ges-three-lane-map__lane" data-lane="${escapeHtml(lane.tone)}" style="--lane-index: ${index};">
            <div class="ges-three-lane-map__icon">${icon(lane.tone)}</div>
            <div class="ges-three-lane-map__body">
              <p class="ges-three-lane-map__step">Lane ${index + 1}</p>
              <h3>${escapeHtml(lane.title)}</h3>
              <p>${escapeHtml(lane.question)}</p>
            </div>
            <dl class="ges-three-lane-map__result">
              <div>
                <dt>Handled by</dt>
                <dd>${escapeHtml(lane.owner)}</dd>
              </div>
              <div>
                <dt>Produces</dt>
                <dd>${escapeHtml(lane.output)}</dd>
              </div>
            </dl>
          </li>
        `).join("")}
      </ol>
    </section>
  `;
}

function renderResponsibilitySection() {
  const roles = ACT.roles;

  return `
    <section class="tax-story-chapter article-section ges-act-section" data-tone="action" aria-labelledby="responsibilityTitle">
      ${renderSectionHeader("Responsibility", roles.title, "responsibilityTitle", {
        companion: roles.intro,
        marginInsight: ACT.marginInsights.roles
      })}
      <div class="ges-role-diagram" aria-label="Property assessment responsibility guide">
        ${roles.items.map((role) => `
          <article class="ges-role-card">
            <div class="ges-role-card__header">
              <span class="ges-role-card__icon" aria-hidden="true">${icon("role")}</span>
              <div>
                <p class="ges-role-card__lane">${escapeHtml(role.lane)}</p>
                <h3>${escapeHtml(role.title)}</h3>
              </div>
            </div>
            <dl class="ges-role-card__questions">
              <div>
                <dt>Ask here</dt>
                <dd>${escapeHtml(role.ask)}</dd>
              </div>
              <div>
                <dt>Not here</dt>
                <dd>${escapeHtml(role.not)}</dd>
              </div>
            </dl>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderSourceNote(note = {}) {
  if (!note.text) return "";

  const links = Array.isArray(note.links) ? note.links : [];

  return `
    <aside class="article-source-note ges-act-source-note" aria-label="${escapeHtml(note.label ?? "Source note")}">
      <p>
        <span>${escapeHtml(note.text)}</span>
        ${links.map(link => {
          const href = ARTICLE.references[link.urlKey] ?? link.href ?? "";
          if (!href) return "";
          return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`;
        }).join(" ")}
      </p>
    </aside>
  `;
}

function installLaneFocus(root = document) {
  const map = root.querySelector(".ges-three-lane-map");
  if (!map) return;

  map.querySelectorAll("[data-lane]").forEach(lane => {
    const setActive = () => {
      map.dataset.activeLane = lane.dataset.lane ?? "";
    };
    lane.addEventListener("mouseenter", setActive);
    lane.addEventListener("focusin", setActive);
  });
}
