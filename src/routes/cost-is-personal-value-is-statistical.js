import { createGesArticleShell } from "../ges/shell.js?v=20260701-article-polish-4";
import { installGesReadingProgress } from "../ges/reading-progress.js?v=20260701-article-polish-4";
import {
  installGuideUtilityLanguage,
  renderArticleEntryPanel,
  renderArticleHero,
  renderArticleNote,
  renderContinueExploring,
  renderKeyIdea,
  renderResourcesBlock,
  renderSectionHeader as sectionHeader,
  renderSourceNote
} from "../ges/article-components.js?v=20260709-masthead-2";
import { escapeHtml } from "../utils/html.js?v=20260701-article-polish-4";
import { trackArticleInteraction, trackArticleScrollDepth } from "../visit-analytics.js?v=20260709-central-timestamp-1";
import { costPersonalValueStatisticalArticle as ARTICLE } from "../content/articles/cost-is-personal-value-is-statistical.js?v=20260701-article-polish-4";

const ARTICLE_ID = ARTICLE.id;
const ARTICLE_DEPTH_MILESTONES = [25, 50, 75, 100];

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
    robots: "noindex, nofollow, noarchive",
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

export function isCostPersonalValueStatisticalRequest(searchParams = new URLSearchParams(window.location.search)) {
  return searchParams.get("article") === ARTICLE.legacyQueryValue
    || normalizedPathname().endsWith(`/${ARTICLE.canonicalPath}`);
}

export function renderCostPersonalValueStatisticalArticle() {
  const shell = createGesArticleShell({
    htmlClasses: ["cost-value-route"],
    metadata: metadata(),
    routeName: "cost-personal-value-statistical"
  });

  if (!shell?.coverRegion) return;

  shell.setCover(renderCover());
  shell.setBody(`
    <article class="tax-shorthand-page levy-compression-page editorial-guide tax-article-panel cost-value-article" data-county-theme="gage" data-ges-reading-progress-target aria-label="${escapeHtml(ARTICLE.title)}">
      ${renderArticleDepthMarkers()}
      ${renderEntryPanel()}
      ${ARTICLE.sections.map(renderSection).join("")}
      ${renderKeyTakeaways()}
      ${renderContinueExploring(ARTICLE.related, { references: ARTICLE.references, id: "costValueRelated" })}
      ${renderResourcesBlock(ARTICLE.resourcesBlock, { id: "costValueResources", references: ARTICLE.references })}
      <span data-ges-reading-progress-end aria-hidden="true"></span>
    </article>
  `);

  installArticleAnalytics(shell.bodyRegion);
  installGuideUtilityLanguage(shell.bodyRegion);
  installGesReadingProgress({ root: shell.bodyRegion });
}

function renderCover() {
  return renderArticleHero({
    articleSlug: ARTICLE.canonicalPath,
    className: "cost-value-hero",
    displayDate: ARTICLE.displayDate,
    label: "Assessment Explainer",
    mediaHtml: `
      <figure class="article-hero-media hero-media">
        <img
          src="${escapeHtml(ARTICLE.assets.heroImage)}"
          alt="${escapeHtml(ARTICLE.assets.heroImageAlt)}"
          loading="eager"
          decoding="async"
          title="${escapeHtml(ARTICLE.assets.heroImageCredit)}"
        />
        <figcaption class="levy-sr-only">${escapeHtml(ARTICLE.assets.heroImageAlt)} ${escapeHtml(ARTICLE.assets.heroImageCredit)}</figcaption>
      </figure>
    `,
    publishedDate: ARTICLE.publishedDate,
    readingMinutes: ARTICLE.readingMinutes,
    subject: "Property Tax Education",
    subtitle: ARTICLE.subtitle,
    tags: ARTICLE.tags,
    title: ARTICLE.title,
    titleId: "costValueArticleTitle",
    updatedDate: ARTICLE.modifiedDate
  });
}

function editorialIcon(name) {
  const paths = {
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
    icon: editorialIcon,
    shareDescription: ARTICLE.description,
    shareUrl: ARTICLE.canonicalPath,
    tags: ARTICLE.tags
  });
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

function paragraph(text = "") {
  return text ? `<p class="prose">${escapeHtml(text)}</p>` : "";
}

function paragraphs(items = []) {
  return items.map(paragraph).join("");
}

function renderSection(section = {}) {
  const sourceNote = ARTICLE.sourceNotes?.[section.sourceNote];

  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section ges-opening-section" data-tone="reflection" aria-labelledby="${escapeHtml(section.id)}Title">
      <div class="editorial-narrow ges-section-lead">
        ${sectionHeader(section.kicker, section.title, `${section.id}Title`, {
          marginInsight: section.margin,
          paragraphs: section.paragraphs
        })}
        ${renderSectionBody(section)}
        ${sourceNote ? renderSourceNote(sourceNote, { references: ARTICLE.references }) : ""}
      </div>
    </section>
  `;
}

function renderSectionBody(section = {}) {
  if (section.id === "opening") {
    return `
      ${paragraphs(section.paragraphs)}
      ${renderThesisBillboard()}
      ${renderArticleNote({
        label: "Important nuance",
        text: ARTICLE.thesis.caveat
      }, { variant: "guidance" })}
    `;
  }

  if (section.id === "personal-cost") {
    return paragraphs(section.paragraphs);
  }

  if (section.id === "actual-value") {
    return `
      ${paragraphs(section.paragraphs)}
      ${renderOneSaleMarketVisual()}
      ${renderKeyIdea({
        label: "Legal hinge",
        title: "Actual value is a market-value standard, not a purchase-price rule.",
        description: "That distinction is why the assessment can consider a sale without being mechanically equal to it.",
        items: section.comparison?.map(item => `${item.term}: ${item.description}`)
      })}
    `;
  }

  if (section.id === "welcome-stranger") {
    return `
      ${paragraphs(section.paragraphs)}
      ${renderWelcomeStrangerVisual()}
      ${renderArticleNote({
        label: "The fairness test",
        text: "If two similar homes need the same public services, ownership date is a weak reason for permanently different tax bases."
      }, { variant: "guidance" })}
    `;
  }

  if (section.id === "sales-matter") {
    return `
      ${paragraphs(section.paragraphs)}
      ${renderEvidenceBuildsVisual()}
      ${renderSaleProofAnchor()}
    `;
  }

  if (section.id === "evidence-builds") {
    const [intro, ...rest] = section.paragraphs ?? [];
    return `
      ${paragraph(intro)}
      ${renderSaleCountsTable()}
      ${paragraphs(rest)}
    `;
  }

  if (section.id === "protest-rights") {
    return `
      ${paragraphs(section.paragraphs)}
      ${renderReaderRightsCheckpoint()}
    `;
  }

  return `
    ${paragraphs(section.paragraphs)}
  `;
}

function renderThesisBillboard() {
  return `
    <aside class="cost-value-thesis" aria-label="Thesis">
      <p class="cost-value-thesis__label">Thesis</p>
      <div class="cost-value-thesis__statement" aria-label="${escapeHtml(ARTICLE.thesis.statement)}">
        <p>Cost is personal.</p>
        <span class="cost-value-thesis__divider" aria-hidden="true"></span>
        <p>Value is statistical.</p>
      </div>
      <p class="cost-value-thesis__supporting">${escapeHtml(ARTICLE.thesis.supportingText)}</p>
    </aside>
  `;
}

function renderSaleProofAnchor() {
  return `
    <aside class="ges-memory-anchor" aria-label="Memory anchor">
      <div class="ges-memory-anchor__body">
        <p class="ges-memory-anchor__label">Memory anchor</p>
        <p class="ges-memory-anchor__statement">One sale is evidence. A market is proof.</p>
        <p class="ges-memory-anchor__supporting">The difference is not whether sales matter. It is how much one sale can prove by itself.</p>
      </div>
    </aside>
  `;
}

function renderOneSaleMarketVisual() {
  const visual = ARTICLE.visuals.oneSaleMarket;
  return `
    <figure class="ges-key-idea" aria-labelledby="oneSaleMarketTitle">
      <p class="ges-key-idea__label">Illustrated Example</p>
      <p class="ges-key-idea__statement" id="oneSaleMarketTitle">${escapeHtml(visual.title)}</p>
      <div class="ges-key-idea__items" role="list" aria-label="${escapeHtml(visual.title)}">
        <div role="listitem">
          <strong>${escapeHtml(visual.leftTitle)}</strong>
          <ul>
            ${visual.leftItems.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </div>
        <div role="listitem">
          <strong>${escapeHtml(visual.rightTitle)}</strong>
          <ul>
            ${visual.rightItems.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </div>
      </div>
    </figure>
  `;
}

function renderWelcomeStrangerVisual() {
  const visual = ARTICLE.visuals.welcomeStranger;
  return `
    <figure class="ges-reader-checkpoint" aria-labelledby="welcomeStrangerTitle">
      <div class="ges-reader-checkpoint__header">
        <p class="ges-reader-checkpoint__kicker">Illustrated Example</p>
        <h3 id="welcomeStrangerTitle">${escapeHtml(visual.title)}</h3>
        <p>${escapeHtml(visual.question)}</p>
      </div>
      <dl class="ges-memory-anchor__contrast">
        ${visual.neighbors.map(neighbor => `
          <div>
            <dt>${escapeHtml(neighbor.label)}</dt>
            <dd>${escapeHtml(neighbor.year)} purchase: ${escapeHtml(neighbor.price)}. ${escapeHtml(neighbor.note)}.</dd>
          </div>
        `).join("")}
      </dl>
    </figure>
  `;
}

function renderEvidenceBuildsVisual() {
  const visual = ARTICLE.visuals.evidenceBuilds;
  return `
    <figure class="ges-reader-checkpoint" aria-labelledby="evidenceBuildsTitle">
      <div class="ges-reader-checkpoint__header">
        <p class="ges-reader-checkpoint__kicker">Illustrated Example</p>
        <h3 id="evidenceBuildsTitle">${escapeHtml(visual.title)}</h3>
      </div>
      <ol class="ges-reader-checkpoint__list">
        ${visual.steps.map(step => `<li><span aria-hidden="true"></span>${escapeHtml(step)}</li>`).join("")}
      </ol>
    </figure>
  `;
}

function renderSaleCountsTable() {
  const visual = ARTICLE.visuals.saleCounts;
  const maxCount = Math.max(...visual.rows.map(row => row.count));
  const minCount = Math.min(...visual.rows.map(row => row.count));

  return `
    <figure class="ges-reader-checkpoint" aria-labelledby="saleCountsTitle">
      <div class="ges-reader-checkpoint__header">
        <p class="ges-reader-checkpoint__kicker">Local Data</p>
        <h3 id="saleCountsTitle">${escapeHtml(visual.title)}</h3>
        <p>${escapeHtml(visual.note)}</p>
      </div>
      <dl class="ges-memory-anchor__contrast cost-value-sales-counts">
        ${visual.rows.map(row => {
          const percent = Math.round(row.count / maxCount * 100);
          const range = Math.max(1, maxCount - minCount);
          const heat = (row.count - minCount) / range;
          const status = row.count === maxCount ? "Most sales" : row.count === minCount ? "Fewest sales" : "";
          const highAlpha = (0.05 + heat * 0.2).toFixed(3);
          const lowAlpha = (0.05 + (1 - heat) * 0.2).toFixed(3);
          const isHigherHalf = heat >= 0.5;
          const borderAlpha = (0.14 + Math.abs(heat - 0.5) * 0.46).toFixed(3);
          const accentToken = isHigherHalf ? "var(--ges-color-evidence-green)" : "var(--ges-color-caution-amber)";
          const heatClass = row.count === maxCount
            ? "cost-value-sales-counts__item--max"
            : row.count === minCount
              ? "cost-value-sales-counts__item--min"
              : "cost-value-sales-counts__item--mid";
          return `
            <div class="cost-value-sales-counts__item ${heatClass}" style="--sale-high-alpha: ${highAlpha}; --sale-low-alpha: ${lowAlpha}; --sale-card-border: rgb(${accentToken} / ${borderAlpha}); --sale-meter-color: rgb(${accentToken});">
              <dt>
                <span>${escapeHtml(row.year)}</span>
                ${status ? `<em>${escapeHtml(status)}</em>` : ""}
              </dt>
              <dd>
                <strong>${row.count.toLocaleString("en-US")}</strong> sales
                <meter min="0" max="${maxCount}" value="${row.count}" aria-label="${escapeHtml(`${row.year}: ${row.count.toLocaleString("en-US")} qualified sales`)}"></meter>
                <span class="levy-sr-only">${percent} percent of the displayed maximum.</span>
              </dd>
            </div>
          `;
        }).join("")}
      </dl>
    </figure>
  `;
}

function renderReaderRightsCheckpoint() {
  return renderKeyIdea({
    label: "The balance",
    title: "Consistency is not the same thing as perfection.",
    description: "The system uses statistics to treat similar property consistently, and protest rights to handle property-specific evidence when the statistics miss something important."
  });
}

function renderKeyTakeaways() {
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" aria-labelledby="costValueTakeawaysTitle">
      <div class="editorial-narrow ges-section-lead">
        ${sectionHeader("Key Takeaways", "What to remember", "costValueTakeawaysTitle")}
        <ul class="ges-reader-checkpoint__list">
          ${ARTICLE.takeaways.map(item => `<li><span aria-hidden="true"></span>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>
    </section>
  `;
}

function installArticleAnalytics(root) {
  if (!root) return;

  root.addEventListener("click", event => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    trackArticleInteraction(link.dataset.articleAction || "article_link_click", {
      articleId: ARTICLE_ID,
      detail: link.dataset.articleLabel || link.textContent.trim(),
      href: link.href
    });
  });

  installArticleDepthTracking(root.querySelector("[data-ges-reading-progress-target]"));
}

function installArticleDepthTracking(article) {
  if (!article) return;

  const trackedMilestones = new Set();
  let maxScrollPercent = calculateArticleScrollDepth(article);

  const trackDepth = () => {
    maxScrollPercent = Math.max(maxScrollPercent, calculateArticleScrollDepth(article));
    ARTICLE_DEPTH_MILESTONES.forEach(milestone => {
      if (maxScrollPercent >= milestone && !trackedMilestones.has(milestone)) {
        trackedMilestones.add(milestone);
        trackArticleScrollDepth({
          articleId: ARTICLE_ID,
          articleTitle: ARTICLE.title,
          maxScrollPercent: milestone
        });
      }
    });
  };

  trackDepth();
  window.addEventListener("scroll", trackDepth, { passive: true });
  window.addEventListener("resize", trackDepth, { passive: true });
}

function calculateArticleScrollDepth(article) {
  if (!article) return 0;
  const rect = article.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
  const total = Math.max(1, rect.height - viewportHeight);
  const seen = Math.min(total, Math.max(0, -rect.top));
  return Math.round(seen / total * 100);
}
