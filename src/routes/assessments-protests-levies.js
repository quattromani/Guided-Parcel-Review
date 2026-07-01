import {
  installGuideUtilityLanguage,
  renderActTransition,
  renderArticleEntryPanel,
  renderArticleHero,
  renderContinueExploring,
  renderExpandableDetail,
  renderKeyIdea,
  renderMemoryAnchor,
  renderReaderCheckpoint,
  renderResourcesBlock,
  renderSectionHeader,
  renderSourceNote
} from "../ges/article-components.js?v=20260701-article-polish-4";
import { installGesReadingProgress } from "../ges/reading-progress.js?v=20260701-article-polish-4";
import { createGesArticleShell } from "../ges/shell.js?v=20260701-article-polish-4";
import { howYourPropertyValueBecomesATaxBillArticle as articleSource } from "../content/articles/how-your-property-value-becomes-a-tax-bill.js?v=20260701-article-polish-4";
import { escapeHtml } from "../utils/html.js?v=20260701-article-polish-4";

const ARTICLE = articleSource;
const ACT_ONE = ARTICLE.actOne;
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

function referenceHref(key = "") {
  return ARTICLE.references[key] ?? "";
}

function icon(name) {
  const paths = {
    assessment: "<path d='M4 19V7l8-4 8 4v12'></path><path d='M8 19v-7h8v7'></path><path d='M9 9h6'></path>",
    budget: "<path d='M5 5h14v14H5z'></path><path d='M8 9h8'></path><path d='M8 13h5'></path><path d='M8 17h7'></path>",
    calendar: "<path d='M7 3v4'></path><path d='M17 3v4'></path><path d='M4 8h16'></path><path d='M5 5h14v16H5z'></path><path d='M8 12h3'></path><path d='M13 12h3'></path><path d='M8 16h3'></path>",
    check: "<path d='m5 13 4 4L19 7'></path>",
    checklist: "<path d='M8 6h11'></path><path d='M8 12h11'></path><path d='M8 18h11'></path><path d='m4 6 1 1 2-2'></path><path d='m4 12 1 1 2-2'></path><path d='m4 18 1 1 2-2'></path>",
    cost: "<path d='M12 3v18'></path><path d='M17 7.5c0-1.7-1.8-2.8-4.2-2.8-2.5 0-4.1 1.1-4.1 2.8 0 4 8.7 1.8 8.7 6.2 0 1.8-1.8 3-4.5 3-2.5 0-4.6-1.1-4.9-3'></path>",
    equalization: "<path d='M12 3v18'></path><path d='M5 7h14'></path><path d='m6 7-3 6h6L6 7Z'></path><path d='m18 7-3 6h6l-3-6Z'></path>",
    evidence: "<path d='M5 4h14v16H5z'></path><path d='M8 8h8'></path><path d='M8 12h5'></path><path d='m8 16 2 2 5-6'></path>",
    income: "<path d='M4 18h16'></path><path d='M6 18V9'></path><path d='M12 18V5'></path><path d='M18 18v-7'></path>",
    land: "<path d='M3 17 9 5l5 8 3-5 4 9H3Z'></path><path d='M8 17h8'></path>",
    levy: "<path d='M4 19h16'></path><path d='M7 17V9'></path><path d='M12 17V5'></path><path d='M17 17v-6'></path><path d='M6 9h2'></path><path d='M11 5h2'></path><path d='M16 11h2'></path>",
    model: "<path d='M4 7h6v6H4z'></path><path d='M14 7h6v6h-6z'></path><path d='M9 17h6'></path><path d='M7 13v4'></path><path d='M17 13v4'></path>",
    notice: "<path d='M7 3h7l3 3v15H7z'></path><path d='M14 3v4h4'></path><path d='M9.5 11h5'></path><path d='M9.5 15h5'></path>",
    protest: "<path d='M6 4h12v16H6z'></path><path d='M9 8h6'></path><path d='M9 12h6'></path><path d='M9 16h3'></path><path d='m15.5 15.5 3 3'></path>",
    record: "<path d='M6 3h9l3 3v15H6z'></path><path d='M15 3v4h4'></path><path d='M9 10h6'></path><path d='M9 14h6'></path><path d='M9 18h3'></path>",
    role: "<path d='M16 21v-2a4 4 0 0 0-8 0v2'></path><circle cx='12' cy='7' r='4'></circle>",
    sales: "<path d='M4 17 9 12l4 3 7-8'></path><path d='M15 7h5v5'></path>",
    snapshot: "<path d='M5 5h14v14H5z'></path><path d='M8 8h8v8H8z'></path><path d='M12 2v3'></path><path d='M12 19v3'></path><path d='M2 12h3'></path><path d='M19 12h3'></path>",
    taxation: "<path d='M7 3h10v18H7z'></path><path d='M10 7h4'></path><path d='M10 11h4'></path><path d='M10 15h2'></path>",
    value: "<path d='M12 21s7-4.4 7-11a7 7 0 0 0-14 0c0 6.6 7 11 7 11Z'></path><path d='M9.5 10.5 11.5 12.5 15 9'></path>"
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

export function renderAssessmentsProtestsLeviesArticle() {
  const shell = createGesArticleShell({
    htmlClasses: ["assessments-protests-levies-shell-route"],
    metadata: metadata(),
    routeName: "assessments-protests-levies"
  });

  if (!shell?.coverRegion) return;

  shell.setCover(renderHero());
  shell.setBody(`
    <article class="editorial-guide tax-article-panel assessment-tax-guide-page ges-assessment-tax-article" data-county-theme="gage" data-ges-reading-progress-target aria-label="${escapeHtml(ARTICLE.title)}">
      ${renderOpeningSection()}
      ${renderNoticeSection()}
      ${renderSystemMapSection()}
      ${renderResponsibilitySection()}
      ${renderReaderCheckpoint(ACT_ONE.checkpoint)}
      ${renderSourceNote(ACT_ONE.sourceNote, { className: "ges-act-source-note", references: ARTICLE.references })}
      ${renderActTransition(ACT_ONE.transition)}
      ${renderValueNumberAct()}
      ${renderActTransition(ARTICLE.actTwo.transition)}
      ${renderValueBuilderAct()}
      ${renderActTransition(ARTICLE.actThree.transition)}
      ${renderFairnessAct()}
      ${renderActTransition(ARTICLE.actFour.transition)}
      ${renderTaxFlowAct()}
      ${renderContinueExploring(ARTICLE.continueExploring, { references: ARTICLE.references })}
      ${renderResourcesBlock(ARTICLE.resourcesBlock, { id: "assessmentTaxResources", references: ARTICLE.references })}
      <span data-ges-reading-progress-end aria-hidden="true"></span>
    </article>
  `);

  installGuideUtilityLanguage(shell.bodyRegion);
  installLaneFocus(shell.bodyRegion);
  installValueBuilderTabs(shell.bodyRegion);
  installGesReadingProgress({ root: shell.bodyRegion });
}

function renderHero() {
  return renderArticleHero({
    className: "ges-act-one-hero",
    mediaHtml: `
      <figure class="article-hero-media hero-media ges-act-one-hero__media">
        <img src="${escapeHtml(ARTICLE.assets.heroImage)}" alt="${escapeHtml(ARTICLE.assets.heroImageAlt)}" loading="eager" decoding="async" fetchpriority="high" />
        <div class="ges-hero-notice" aria-hidden="true">
          <p class="ges-hero-notice__eyebrow">Valuation notice</p>
          <p class="ges-hero-notice__value">$285,015</p>
          <p class="ges-hero-notice__status">Value changed. Tax not calculated.</p>
        </div>
        <figcaption class="levy-sr-only">${escapeHtml(ARTICLE.assets.heroImageAlt)} ${escapeHtml(ARTICLE.assets.heroImageCredit)}</figcaption>
      </figure>
    `,
    subject: "Assessments, Protests, and Levies",
    subtitle: ARTICLE.subtitle,
    tags: ARTICLE.tags,
    title: ARTICLE.title,
    titleId: "assessmentTaxArticleTitle"
  });
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
      ${renderSectionHeader(ACT_ONE.kicker, ACT_ONE.title, "noticeMomentTitle", {
        companion: "Before the article explains methods, deadlines, or levies, it starts with the question a property owner actually has first.",
        marginInsight: ACT_ONE.marginInsights.notice
      })}
      <p class="ges-act-lede">${escapeHtml(ACT_ONE.heroHook)}</p>
      ${renderMemoryAnchor(ACT_ONE.memoryAnchor)}
    </section>
  `;
}

function renderNoticeSection() {
  const notice = ACT_ONE.notice;

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
  const map = ACT_ONE.systemMap;

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
  const roles = ACT_ONE.roles;

  return `
    <section class="tax-story-chapter article-section ges-act-section" data-tone="action" aria-labelledby="responsibilityTitle">
      ${renderSectionHeader("Responsibility", roles.title, "responsibilityTitle", {
        companion: roles.intro,
        marginInsight: ACT_ONE.marginInsights.roles
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

function renderValueNumberAct() {
  const act = ARTICLE.actTwo;

  return `
    <section class="tax-story-chapter article-section ges-act-section" data-tone="information" aria-labelledby="valueNumberTitle">
      ${renderSectionHeader(act.kicker, act.title, "valueNumberTitle", {
        companion: act.guidingQuestion,
        marginInsight: act.marginInsights.date
      })}
      <p class="ges-act-lede">${escapeHtml(act.intro)}</p>
      ${renderMemoryAnchor(act.memoryAnchor)}
      ${renderSnapshotCard(act.snapshot)}
    </section>
    <section class="tax-story-chapter article-section ges-act-section" data-tone="action" aria-labelledby="recordChecklistTitle">
      ${renderSectionHeader("First Check", act.checklist.title, "recordChecklistTitle", {
        companion: act.checklist.intro,
        marginInsight: act.marginInsights.facts
      })}
      ${renderRecordChecklist(act.checklist)}
      ${renderGuidedRecordInspection(act.inspection)}
    </section>
    <section class="tax-story-chapter article-section ges-act-section" data-tone="comparison" aria-labelledby="issueComparisonTitle">
      ${renderSectionHeader("Sort the Concern", act.issueComparison.title, "issueComparisonTitle", {
        companion: act.issueComparison.intro
      })}
      ${renderIssueComparison(act.issueComparison)}
      ${renderReaderCheckpoint(act.checkpoint)}
    </section>
  `;
}

function renderSnapshotCard(snapshot = {}) {
  if (!snapshot.title) return "";

  return `
    <aside class="ges-snapshot-card" aria-label="${escapeHtml(snapshot.title)}">
      <span class="ges-snapshot-card__icon" aria-hidden="true">${icon("snapshot")}</span>
      <div>
        <h3>${escapeHtml(snapshot.title)}</h3>
        <p>${escapeHtml(snapshot.description ?? "")}</p>
      </div>
    </aside>
  `;
}

function renderRecordChecklist(checklist = {}) {
  const items = Array.isArray(checklist.items) ? checklist.items : [];
  if (!items.length) return "";

  return `
    <div class="ges-record-checklist" aria-label="${escapeHtml(checklist.title ?? "Property record checklist")}">
      ${items.map((item, index) => `
        <article class="ges-record-checklist__item" style="--item-index: ${index};">
          <span class="ges-record-checklist__icon" aria-hidden="true">${icon("checklist")}</span>
          <div>
            <h3>${escapeHtml(item.label)}</h3>
            <p>${escapeHtml(item.detail)}</p>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderGuidedRecordInspection(inspection = {}) {
  const steps = Array.isArray(inspection.steps) ? inspection.steps : [];
  if (!steps.length) return "";

  return `
    <div class="ges-guided-inspection" aria-label="${escapeHtml(inspection.title ?? "Guided record inspection")}">
      <div class="ges-guided-inspection__intro">
        <span aria-hidden="true">${icon("record")}</span>
        <h3>${escapeHtml(inspection.title)}</h3>
      </div>
      <ol class="ges-guided-inspection__steps">
        ${steps.map((step, index) => `
          <li>
            <span class="ges-guided-inspection__number">${index + 1}</span>
            <div>
              <h4>${escapeHtml(step.title)}</h4>
              <p>${escapeHtml(step.detail)}</p>
            </div>
          </li>
        `).join("")}
      </ol>
    </div>
  `;
}

function renderIssueComparison(comparison = {}) {
  const items = Array.isArray(comparison.items) ? comparison.items : [];
  if (!items.length) return "";

  return `
    <div class="ges-issue-comparison" aria-label="${escapeHtml(comparison.title ?? "Record issue versus value issue")}">
      ${items.map((item, index) => `
        <article class="ges-comparison-card ges-issue-comparison__card" data-issue-type="${index === 0 ? "record" : "value"}">
          <div class="ges-comparison-card__header">
            <span aria-hidden="true">${icon(index === 0 ? "record" : "value")}</span>
            <h3>${escapeHtml(item.label)}</h3>
          </div>
          <ul>
            ${(item.examples ?? []).map(example => `<li>${escapeHtml(example)}</li>`).join("")}
          </ul>
          <p class="ges-issue-comparison__next"><strong>First move:</strong> ${escapeHtml(item.nextStep)}</p>
        </article>
      `).join("")}
    </div>
  `;
}

function renderValueBuilderAct() {
  const act = ARTICLE.actThree;

  return `
    <section class="tax-story-chapter article-section ges-act-section" data-tone="information" aria-labelledby="valueBuilderTitle">
      ${renderSectionHeader(act.kicker, act.title, "valueBuilderTitle", {
        companion: act.guidingQuestion,
        marginInsight: act.marginInsights.model
      })}
      <p class="ges-act-lede">${escapeHtml(act.intro)}</p>
      ${renderMemoryAnchor(act.memoryAnchor)}
      ${renderValueBuildDiagram(act.buildDiagram)}
      ${renderValueBuilder(act.builder)}
      ${renderMemoryAnchor(act.secondaryAnchor)}
      ${renderReaderCheckpoint(act.checkpoint)}
    </section>
  `;
}

function renderValueBuildDiagram(diagram = {}) {
  const steps = Array.isArray(diagram.steps) ? diagram.steps : [];
  if (!steps.length) return "";

  return `
    <figure class="ges-value-build-diagram" aria-labelledby="valueBuildDiagramTitle">
      <figcaption id="valueBuildDiagramTitle">${escapeHtml(diagram.title ?? "Value build-up diagram")}</figcaption>
      <ol>
        ${steps.map((step, index) => `
          <li style="--step-index: ${index};">
            <span class="ges-value-build-diagram__icon" aria-hidden="true">${icon(index === 0 ? "land" : index === 1 ? "assessment" : index === 2 ? "sales" : index === 3 ? "model" : "value")}</span>
            <div>
              <h3>${escapeHtml(step.label)}</h3>
              <p>${escapeHtml(step.detail)}</p>
            </div>
          </li>
        `).join("")}
      </ol>
    </figure>
  `;
}

function renderValueBuilder(builder = {}) {
  const tabs = Array.isArray(builder.tabs) ? builder.tabs : [];
  if (!tabs.length) return "";

  return `
    <section class="ges-value-builder" aria-labelledby="valueBuilderModuleTitle">
      <header class="ges-value-builder__header">
        <p class="guided-kicker">Interactive Module</p>
        <h3 id="valueBuilderModuleTitle">${escapeHtml(builder.title ?? "Value Builder")}</h3>
        ${builder.intro ? `<p>${escapeHtml(builder.intro)}</p>` : ""}
      </header>
      <div class="ges-value-builder__layout">
        <div class="ges-value-builder__tabs" role="tablist" aria-label="Value builder topics">
          ${tabs.map((tab, index) => `
            <button type="button" role="tab" id="valueBuilderTab${index + 1}" aria-controls="valueBuilderPanel${index + 1}" aria-selected="${index === 0 ? "true" : "false"}" tabindex="${index === 0 ? "0" : "-1"}" data-value-builder-tab="${index}">
              <span aria-hidden="true">${icon(valueBuilderIcon(tab.id))}</span>
              ${escapeHtml(tab.label)}
            </button>
          `).join("")}
        </div>
        <div class="ges-value-builder__panels">
          ${tabs.map((tab, index) => `
            <article class="ges-value-builder__panel" role="tabpanel" id="valueBuilderPanel${index + 1}" aria-labelledby="valueBuilderTab${index + 1}" data-value-builder-panel="${index}"${index === 0 ? "" : " hidden"}>
              <p class="ges-value-builder__micro">${escapeHtml(tab.micro ?? tab.label)}</p>
              <h4>${escapeHtml(tab.title)}</h4>
              <p>${escapeHtml(tab.summary)}</p>
              <ul>
                ${(tab.bullets ?? []).map(bullet => `<li>${escapeHtml(bullet)}</li>`).join("")}
              </ul>
            </article>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function valueBuilderIcon(id = "") {
  const iconMap = {
    land: "land",
    improvements: "assessment",
    sales: "sales",
    cost: "cost",
    income: "income",
    "replacement-cost": "cost",
    depreciation: "value",
    "mass-appraisal": "model",
    "data-sources": "record"
  };
  return iconMap[id] ?? "value";
}

function renderFairnessAct() {
  const act = ARTICLE.actFour;

  return `
    <section class="tax-story-chapter article-section ges-act-section" data-tone="comparison" aria-labelledby="fairnessTitle">
      ${renderSectionHeader(act.kicker, act.guidingQuestion, "fairnessTitle", {
        companion: act.intro,
        marginInsight: act.marginInsights.parcel
      })}
      ${renderFairnessComparison(act.comparison)}
    </section>
    <section class="tax-story-chapter article-section ges-act-section" data-tone="action" aria-labelledby="protestPathTitle">
      ${renderSectionHeader("Challenge Path", act.protestPath.title, "protestPathTitle", {
        companion: act.protestPath.intro,
        marginInsight: act.marginInsights.calendar
      })}
      ${renderProtestPath(act.protestPath)}
      ${renderExpandableDetail(act.optionalMetrics)}
      ${renderCompanionCard(act.companion)}
      ${renderReaderCheckpoint(act.checkpoint)}
    </section>
  `;
}

function renderFairnessComparison(comparison = {}) {
  const items = Array.isArray(comparison.items) ? comparison.items : [];
  if (!items.length) return "";

  return `
    <div class="ges-fairness-comparison" aria-label="${escapeHtml(comparison.title ?? "Equalization versus protest")}">
      ${items.map((item, index) => `
        <article class="ges-comparison-card ges-fairness-comparison__card" data-fairness-type="${index === 0 ? "equalization" : "protest"}">
          <div class="ges-comparison-card__header">
            <span aria-hidden="true">${icon(index === 0 ? "equalization" : "protest")}</span>
            <div>
              <p>${escapeHtml(item.scope)}</p>
              <h3>${escapeHtml(item.label)}</h3>
            </div>
          </div>
          <dl>
            <div>
              <dt>Question</dt>
              <dd>${escapeHtml(item.question)}</dd>
            </div>
            <div>
              <dt>Evidence</dt>
              <dd>${escapeHtml(item.evidence)}</dd>
            </div>
            <div>
              <dt>Outcome</dt>
              <dd>${escapeHtml(item.outcome)}</dd>
            </div>
          </dl>
        </article>
      `).join("")}
    </div>
  `;
}

function renderProtestPath(path = {}) {
  const steps = Array.isArray(path.steps) ? path.steps : [];
  if (!steps.length) return "";

  return `
    <ol class="ges-protest-path" aria-label="${escapeHtml(path.title ?? "Protest path")}">
      ${steps.map((step, index) => `
        <li style="--step-index: ${index};">
          <span class="ges-protest-path__icon" aria-hidden="true">${icon(index < 2 ? "record" : index < 4 ? "evidence" : "protest")}</span>
          <div>
            <h3>${escapeHtml(step.label)}</h3>
            <p>${escapeHtml(step.detail)}</p>
          </div>
        </li>
      `).join("")}
    </ol>
  `;
}

function renderCompanionCard(card = {}) {
  if (!card.title) return "";
  const href = referenceHref(card.hrefKey);

  return `
    <aside class="ges-companion-card" aria-label="${escapeHtml(card.title)}">
      <div class="ges-companion-card__icon" aria-hidden="true">${icon("protest")}</div>
      <div>
        <p class="guided-kicker">Companion guide</p>
        <h3>${href ? `<a href="${escapeHtml(href)}">${escapeHtml(card.title)}</a>` : escapeHtml(card.title)}</h3>
        <p>${escapeHtml(card.description ?? "")}</p>
        ${href ? `<span>${escapeHtml(card.action ?? "Open guide")}</span>` : ""}
      </div>
    </aside>
  `;
}

function renderTaxFlowAct() {
  const act = ARTICLE.actFive;

  return `
    <section class="tax-story-chapter article-section ges-act-section" data-tone="information" aria-labelledby="taxFlowTitle">
      ${renderSectionHeader(act.kicker, act.title, "taxFlowTitle", {
        companion: act.guidingQuestion,
        marginInsight: act.marginInsights.budgets
      })}
      <p class="ges-act-lede">${escapeHtml(act.intro)}</p>
      ${renderMemoryAnchor(act.memoryAnchor)}
      ${renderTaxFlow(act.flow)}
      ${renderKeyIdea(act.keyIdea)}
      ${renderYearStrip(act.yearStrip)}
      ${renderSynthesis(act.synthesis)}
      ${renderMemoryAnchor(act.accuracy)}
      ${renderReaderCheckpoint(act.checkpoint)}
      ${renderNextSteps(act.nextSteps)}
    </section>
  `;
}

function renderTaxFlow(flow = {}) {
  const steps = Array.isArray(flow.steps) ? flow.steps : [];
  if (!steps.length) return "";

  return `
    <figure class="ges-tax-flow" aria-labelledby="taxFlowDiagramTitle">
      <figcaption id="taxFlowDiagramTitle">${escapeHtml(flow.title ?? "Value to tax flow")}</figcaption>
      <ol>
        ${steps.map((step, index) => `
          <li style="--step-index: ${index};">
            <span class="ges-tax-flow__icon" aria-hidden="true">${icon(["assessment", "budget", "levy", "equalization", "taxation"][index] ?? "taxation")}</span>
            <div>
              <h3>${escapeHtml(step.label)}</h3>
              <p>${escapeHtml(step.detail)}</p>
            </div>
          </li>
        `).join("")}
      </ol>
    </figure>
  `;
}

function renderYearStrip(strip = {}) {
  const events = Array.isArray(strip.events) ? strip.events : [];
  if (!events.length) return "";

  return `
    <figure class="ges-year-strip" aria-labelledby="yearStripTitle">
      <figcaption id="yearStripTitle">${escapeHtml(strip.title ?? "Year at a glance")}</figcaption>
      <ol>
        ${events.map((event, index) => `
          <li style="--step-index: ${index};">
            <span>${escapeHtml(event.label)}</span>
            <p>${escapeHtml(event.detail)}</p>
          </li>
        `).join("")}
      </ol>
    </figure>
  `;
}

function renderSynthesis(synthesis = {}) {
  if (!synthesis.title) return "";

  return `
    <aside class="ges-synthesis-card" aria-label="${escapeHtml(synthesis.title)}">
      <h3>${escapeHtml(synthesis.title)}</h3>
      <p>${escapeHtml(synthesis.text ?? "")}</p>
    </aside>
  `;
}

function renderNextSteps(nextSteps = {}) {
  const items = Array.isArray(nextSteps.items) ? nextSteps.items : [];
  if (!items.length) return "";

  return `
    <section class="ges-next-steps" aria-labelledby="nextStepsTitle">
      <h2 id="nextStepsTitle">${escapeHtml(nextSteps.title ?? "Reader next steps")}</h2>
      <ol>
        ${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
      </ol>
    </section>
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

function installValueBuilderTabs(root = document) {
  root.querySelectorAll(".ges-value-builder").forEach(builder => {
    const tabs = [...builder.querySelectorAll("[data-value-builder-tab]")];
    const panels = [...builder.querySelectorAll("[data-value-builder-panel]")];
    if (!tabs.length || tabs.length !== panels.length) return;

    const activate = (nextIndex, shouldFocus = false) => {
      tabs.forEach((tab, index) => {
        const isActive = index === nextIndex;
        tab.setAttribute("aria-selected", String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
        panels[index].hidden = !isActive;
      });
      builder.dataset.activePanel = String(nextIndex);
      if (shouldFocus) tabs[nextIndex].focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activate(index));
      tab.addEventListener("keydown", (event) => {
        const currentIndex = tabs.indexOf(tab);
        let nextIndex = currentIndex;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % tabs.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;
        if (nextIndex === currentIndex) return;
        event.preventDefault();
        activate(nextIndex, true);
      });
    });
  });
}
