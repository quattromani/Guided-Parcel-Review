import { escapeHtml } from "../utils/html.js";

export function renderMarginInsight(insight) {
  if (!insight?.text) return "";

  return `
    <aside class="ges-margin-insight" aria-label="${escapeHtml(insight.label ?? "Margin insight")}">
      ${insight.label ? `<p class="ges-margin-insight__label">${escapeHtml(insight.label)}</p>` : ""}
      <p class="ges-margin-insight__text">${escapeHtml(insight.text)}</p>
    </aside>
  `;
}

export function renderPageCrease() {
  return `<hr class="ges-page-crease" />`;
}

export function renderSectionHeader(kicker, title, id, options = {}) {
  const companion = options.companion ? `<p class="ges-section-companion">${escapeHtml(options.companion)}</p>` : "";
  const insight = renderMarginInsight(options.marginInsight);
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

function renderAuthorEmailIcon() {
  return `
                <span class="article-author-email-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M4 6h16v12H4Z"></path>
                    <path d="m4 7 8 6 8-6"></path>
                  </svg>
                </span>`;
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
  printableLabel = "Printable guide",
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
            <p class="article-author-name"><a href="${escapeHtml(authorMailto)}" data-article-action="author_email" data-article-label="${escapeHtml(articleTitle)}"><span class="article-author-name-text">${escapeHtml(authorName)}</span>${renderAuthorEmailIcon()}</a></p>
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
