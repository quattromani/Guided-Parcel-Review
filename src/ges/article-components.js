import { escapeHtml } from "../utils/html.js?v=db3aed6";

const RESOURCE_TYPE_LABELS = {
  "assessment-guidance": "Assessment guidance",
  "case-record": "Case record",
  "county-record": "County record",
  "legal-authority": "Legal authority",
  "model-input": "Model input",
  "official-form": "Official form",
  "official-resource": "Official resource",
  "pad-report": "PAD report",
  "practice-basis": "Practice basis",
  "tax-record": "Tax record"
};

function marginInsightClasses(insight = {}, options = {}) {
  const placement = options.placement ?? insight.placement ?? insight.position ?? "";
  const classes = ["ges-margin-insight"];

  if (placement === "inline") classes.push("ges-margin-insight--inline");
  if (placement === "after-content") classes.push("ges-margin-insight--after-content");
  if (placement === "first" || options.first || insight.first) classes.push("ges-margin-insight--first");

  return classes.join(" ");
}

export function renderMarginInsight(insight, options = {}) {
  if (!insight?.text) return "";

  return `
    <aside class="${marginInsightClasses(insight, options)}" aria-label="${escapeHtml(insight.label ?? "Margin insight")}">
      ${insight.label ? `<p class="ges-margin-insight__label">${escapeHtml(insight.label)}</p>` : ""}
      <p class="ges-margin-insight__text">${escapeHtml(insight.text)}</p>
    </aside>
  `;
}

export function renderPageCrease() {
  return `<hr class="ges-page-crease" />`;
}

function slugValue(value = "") {
  return `${value}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function clampHeadingLevel(value, fallback = 2) {
  const level = Number.parseInt(value, 10);
  if (!Number.isFinite(level)) return fallback;
  return Math.min(6, Math.max(2, level));
}

function resourceItemTitle(item = {}) {
  return item.title ?? item.label ?? item.citationLabel ?? "";
}

function resourceItemUrl(item = {}, references = {}) {
  if (item.urlKey) return references[item.urlKey] ?? "";
  return item.url ?? item.href ?? "";
}

function resourceItemId(item = {}) {
  if (item.sourceId) return item.sourceId;
  if (item.urlKey) return item.urlKey;
  return slugValue(resourceItemTitle(item));
}

function resourceItemCategory(item = {}) {
  if (item.category) return item.category;
  if (item.type) return slugValue(item.type);
  if (item.urlKey?.startsWith("nebraska") || item.urlKey?.startsWith("title350")) return "legal-authority";
  if (/\b(IAAO|PAD|Property Assessment Division|Reports? & Opinions?|R&O)\b/i.test(resourceItemTitle(item))) return "assessment-guidance";
  return "official-resource";
}

function resourceTypeLabel(item = {}) {
  const explicitType = item.type ?? item.resourceType;
  if (explicitType) return explicitType;

  const category = resourceItemCategory(item);
  return RESOURCE_TYPE_LABELS[category] ?? category.replace(/-/g, " ");
}

function normalizeResourceGroups(block = {}) {
  if (Array.isArray(block)) {
    return [{ heading: "", items: block }];
  }

  if (Array.isArray(block.groups) && block.groups.length) {
    return block.groups
      .map(group => ({
        heading: group.heading ?? group.title ?? "",
        items: Array.isArray(group.items) ? group.items.filter(Boolean) : []
      }))
      .filter(group => group.items.length);
  }

  const items = Array.isArray(block.items) ? block.items.filter(Boolean) : [];
  return items.length ? [{ heading: block.groupHeading ?? "", items }] : [];
}

function renderResourceItem(item = {}, references = {}) {
  const title = resourceItemTitle(item);
  if (!title) return "";

  const url = resourceItemUrl(item, references);
  const type = resourceTypeLabel(item);
  const metaParts = uniqueValues([
    item.source,
    item.publisher,
    item.jurisdiction,
    item.lastReviewedDate ? `Last reviewed ${item.lastReviewedDate}` : ""
  ]);
  const citation = item.citationLabel && item.citationLabel !== title
    ? `<p class="ges-resource-entry__citation">${escapeHtml(item.citationLabel)}</p>`
    : "";
  const description = item.description ? `<p class="ges-resource-entry__description">${escapeHtml(item.description)}</p>` : "";
  const note = item.note ? `<p class="ges-resource-entry__note">${escapeHtml(item.note)}</p>` : "";
  const titleMarkup = url
    ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a>`
    : `<span>${escapeHtml(title)}</span>`;

  return `
          <li class="ges-resource-entry" data-resource-type="${escapeHtml(slugValue(type))}">
            <p class="ges-resource-entry__type">${escapeHtml(type)}</p>
            <div class="ges-resource-entry__body">
              <p class="ges-resource-entry__title">${titleMarkup}</p>
              ${metaParts.length ? `<p class="ges-resource-entry__meta">${metaParts.map(escapeHtml).join(" &middot; ")}</p>` : ""}
              ${citation}
              ${description}
              ${note}
              ${url ? `<code class="ges-resource-entry__url">${escapeHtml(url)}</code>` : ""}
            </div>
          </li>
  `;
}

export function renderResourcesBlock(block, options = {}) {
  const groups = normalizeResourceGroups(block);
  if (!groups.length) return "";

  const references = options.references ?? {};
  const title = block?.title ?? options.title ?? "Resources and authorities";
  const intro = block?.intro ?? block?.description ?? options.intro ?? "";
  const id = options.id ?? block?.id ?? "gesResourcesBlock";
  const headingLevel = clampHeadingLevel(options.headingLevel ?? block?.headingLevel);
  const groupHeadingLevel = clampHeadingLevel(headingLevel + 1, 3);
  const headingTag = `h${headingLevel}`;
  const groupHeadingTag = `h${groupHeadingLevel}`;
  const resourceItems = groups.flatMap(group => group.items);
  const sourceIds = uniqueValues(resourceItems.map(resourceItemId));
  const sourceCategories = uniqueValues(resourceItems.map(resourceItemCategory));
  const classes = ["ges-resources-block", "article-sources-used", options.className, block?.className].filter(Boolean).join(" ");

  return `
    <section class="${escapeHtml(classes)}" aria-labelledby="${escapeHtml(id)}Title" data-source-ids="${escapeHtml(sourceIds.join(" "))}" data-source-categories="${escapeHtml(sourceCategories.join(" "))}">
      <header class="ges-resources-block__header">
        <p class="guided-kicker">Resources</p>
        <${headingTag} id="${escapeHtml(id)}Title">${escapeHtml(title)}</${headingTag}>
        ${intro ? `<p>${escapeHtml(intro)}</p>` : ""}
      </header>
      <div class="ges-resources-block__groups">
        ${groups.map((group, index) => `
          <section class="ges-resource-group"${group.heading ? ` aria-labelledby="${escapeHtml(`${id}Group${index + 1}`)}"` : ""}>
            ${group.heading ? `<${groupHeadingTag} id="${escapeHtml(`${id}Group${index + 1}`)}">${escapeHtml(group.heading)}</${groupHeadingTag}>` : ""}
            <ul class="ges-resource-list">
              ${group.items.map(item => renderResourceItem(item, references)).join("")}
            </ul>
          </section>
        `).join("")}
      </div>
    </section>
  `;
}

export function renderSectionHeader(kicker, title, id, options = {}) {
  const companion = options.companion ? `<p class="ges-section-companion">${escapeHtml(options.companion)}</p>` : "";
  const insight = renderMarginInsight(options.marginInsight, { placement: options.marginInsightPlacement });
  const classes = ["tax-article-header", "editorial-section-header", insight ? "ges-section-header--with-insight" : ""].filter(Boolean).join(" ");

  return `
    <header class="${classes}">
      <div class="ges-section-heading">
        <p class="guided-kicker">${escapeHtml(kicker)}</p>
        <h2 id="${escapeHtml(id)}">${escapeHtml(title)}</h2>
        ${companion}
      </div>
      ${insight}
    </header>
  `;
}

export function renderArticleTags(tags = []) {
  if (!tags.length) return "";

  return `
        <ul class="article-entry-tags" aria-label="Article tags">
          ${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}
        </ul>`;
}

export function formatGuideLengthText(minutes) {
  const numericMinutes = Number.parseInt(minutes, 10);
  if (!Number.isFinite(numericMinutes) || numericMinutes < 1) return "";
  const article = /^[8]|^11|^18/.test(String(numericMinutes)) ? "an" : "a";
  return `About ${article} ${numericMinutes}-minute read`;
}

export function renderGuideUtility({
  articleTitle,
  audioUrl = "",
  icon,
  printableLabel = "Print Version",
  printableUrl,
  readingMinutes,
  lengthLabel = "",
  wordCount = ""
}) {
  const safeIcon = typeof icon === "function" ? icon : () => "";
  const audioControl = audioUrl ? `
          <details class="hero-audio format-control-item-shell" data-hero-audio>
            <summary class="format-control-item hero-utility-button article-audio-cta">
              ${safeIcon("audio")}
              <span>Audio version</span>
            </summary>
            <div class="hero-audio-panel">
              <p>Full audio version of this guide.</p>
              <audio class="hero-audio-player" data-hero-audio-player controls preload="none" src="${escapeHtml(audioUrl)}">
                <a href="${escapeHtml(audioUrl)}">Download the MP3 audio version.</a>
              </audio>
              <a class="hero-audio-download" href="${escapeHtml(audioUrl)}" download data-article-action="audio_article_download" data-article-label="Audio article MP3">Download MP3</a>
            </div>
          </details>` : "";

  return `
    <section class="guide-utility" aria-label="Guide options">
      <div class="guide-length" aria-label="Estimated guide length" data-guide-length data-reading-minutes="${escapeHtml(readingMinutes)}" data-word-count="${escapeHtml(wordCount)}" data-length-label="${escapeHtml(lengthLabel)}">
        <p class="guide-length-label" data-guide-length-label>${escapeHtml(formatGuideLengthText(readingMinutes))}</p>
      </div>
      <div class="guide-formats hero-utility" aria-label="Available formats">
        <div class="format-control">
          <a class="format-control-item hero-utility-button article-print-cta" href="${escapeHtml(printableUrl)}" download data-article-action="download_pdf" data-article-label="${escapeHtml(`${printableLabel} PDF`)}">
            ${safeIcon("document")}
            <span>${escapeHtml(printableLabel)}</span>
          </a>
          ${audioControl}
        </div>
      </div>
    </section>
  `;
}

export function renderArticleEntryPanel({
  articleTitle,
  authorImage,
  authorMailto,
  authorName,
  authorTitle = "",
  displayDate,
  icon,
  printableLabel,
  printableUrl,
  audioUrl = "",
  readingMinutes,
  wordCount,
  lengthLabel
}) {
  return `
    <div class="article-entry-panel">
      <div class="article-entry-meta" aria-label="Article information">
        <div class="article-author-attribution">
          <img class="article-author-photo" src="${escapeHtml(authorImage)}" alt="" loading="lazy" decoding="async" />
          <div class="article-author-copy">
            <p class="article-author-name"><a href="${escapeHtml(authorMailto)}" data-article-action="author_email" data-article-label="${escapeHtml(articleTitle)}"><span class="article-author-name-text">${escapeHtml(authorName)}</span></a></p>
            ${authorTitle ? `<p class="article-author-title">${escapeHtml(authorTitle)}</p>` : ""}
            <p class="article-entry-date">${escapeHtml(displayDate)}</p>
          </div>
        </div>
      </div>
      ${renderGuideUtility({
        articleTitle,
        audioUrl,
        icon,
        printableLabel,
        printableUrl,
        readingMinutes,
        wordCount,
        lengthLabel
      })}
    </div>
  `;
}

export function installGuideUtilityLanguage(root = document) {
  root.querySelectorAll("[data-guide-length]").forEach(lengthElement => {
    const label = lengthElement.querySelector("[data-guide-length-label]");
    const text = formatGuideLengthText(lengthElement.dataset.readingMinutes);
    if (!text) {
      lengthElement.hidden = true;
      return;
    }
    if (label) label.textContent = text;
  });
}
