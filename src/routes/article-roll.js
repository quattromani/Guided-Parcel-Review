import { hasInternalMenuPermission } from "../ges/internal-permissions.js?v=20260701-article-polish-4";
import { createGesPublicShell } from "../ges/shell.js?v=20260709-masthead-polish-3";
import { escapeHtml } from "../utils/html.js?v=20260701-article-polish-4";

const ARTICLE_MANIFEST_PATH = "data/app/articles.json";
const ARTICLE_ROLL_ROUTE = "articles/";
const SUGGESTION_LIMIT = 6;

let articleManifestPromise;

function normalizedPathname() {
  return window.location.pathname.endsWith("/")
    ? window.location.pathname
    : `${window.location.pathname}/`;
}

function normalizeList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function slugValue(value = "") {
  return `${value}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function dateValue(value) {
  if (!value) return null;
  const dateOnly = `${value}`.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateTime(value) {
  return dateValue(value)?.getTime() ?? 0;
}

function formatDate(value, fallback = "") {
  const date = dateValue(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function routeHref(article = {}) {
  return article.route?.canonicalPath || "";
}

function canPreviewArticle(article = {}, internalView = false) {
  const href = routeHref(article);
  if (!href) return false;
  if (article.status === "published") return true;
  if (!internalView || article.status !== "draft") return false;
  if (article.route?.previewable === false) return false;
  return article.route?.previewable === true || !article.route?.sourceNote;
}

function readingTimeText(article = {}) {
  const minutes = Number.parseInt(article.readingTime?.minutes, 10);
  if (!Number.isFinite(minutes) || minutes < 1) return "Reading time pending";
  return `${minutes} min read`;
}

function resourcesText(article = {}) {
  const count = Number.parseInt(article.resources?.count, 10);
  if (!article.resources?.hasResources || !Number.isFinite(count) || count < 1) return "";
  return `${count} resources`;
}

function publicationStatus(article = {}) {
  return article.published && !article.draft ? "published" : "draft";
}

function normalizeArticle(article = {}, defaults = {}) {
  const status = publicationStatus(article);
  const author = {
    ...(defaults.author ?? {}),
    ...(article.author ?? {})
  };
  const hero = {
    ...(status === "draft" ? defaults.draftHero ?? {} : {}),
    ...(article.hero ?? {})
  };
  const categories = normalizeList(article.categories);
  const tags = normalizeList(article.tags);
  const keywords = normalizeList(article.keywords);
  const references = article.references ?? {};
  const searchTokens = [
    article.title,
    article.subtitle,
    article.excerpt,
    author.name,
    ...categories,
    ...tags,
    ...keywords,
    ...normalizeList(references.glossaryReferences),
    ...normalizeList(references.statuteReferences),
    ...normalizeList(references.legalReferences)
  ];

  return {
    ...article,
    author,
    hero,
    categories,
    tags,
    keywords,
    status,
    searchText: searchTokens.join(" ").toLowerCase()
  };
}

function publicArticles(articles = [], internalView = false) {
  return articles.filter(article => internalView || article.status === "published");
}

function articleMatchesQuery(article, query) {
  if (!query) return true;
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  return tokens.every(token => article.searchText.includes(token));
}

function articleMatchesCategory(article, category) {
  const normalized = slugValue(category);
  if (!normalized || normalized === "all") return true;
  return article.categories.some(value => slugValue(value) === normalized);
}

function sortArticles(articles = [], sortMode = "publication-date") {
  const sorted = [...articles];

  if (sortMode === "published") {
    return sorted.sort((a, b) => {
      if (a.status !== b.status) return a.status === "published" ? -1 : 1;
      return dateTime(b.publishDate) - dateTime(a.publishDate);
    });
  }

  if (sortMode === "draft") {
    return sorted.sort((a, b) => {
      if (a.status !== b.status) return a.status === "draft" ? -1 : 1;
      return dateTime(b.modifiedDate) - dateTime(a.modifiedDate);
    });
  }

  if (sortMode === "modified") {
    return sorted.sort((a, b) => dateTime(b.modifiedDate) - dateTime(a.modifiedDate));
  }

  if (sortMode === "alphabetical") {
    return sorted.sort((a, b) => `${a.title}`.localeCompare(`${b.title}`));
  }

  return sorted.sort((a, b) => dateTime(b.publishDate) - dateTime(a.publishDate));
}

function typeaheadTokens(articles = []) {
  return [...new Set(articles.flatMap(article => [
    article.title,
    article.subtitle,
    ...article.categories,
    ...article.tags,
    ...article.keywords,
    ...normalizeList(article.references?.glossaryReferences),
    ...normalizeList(article.references?.statuteReferences),
    ...normalizeList(article.references?.legalReferences)
  ]).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

function typeaheadMatches(tokens = [], query = "") {
  const value = query.trim().toLowerCase();
  if (!value) return [];

  return tokens
    .filter(token => token.toLowerCase().includes(value))
    .slice(0, SUGGESTION_LIMIT);
}

async function loadArticleManifest() {
  articleManifestPromise ??= fetch(ARTICLE_MANIFEST_PATH)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Unable to load article manifest: ${response.status}`);
      }
      return response.json();
    });

  return articleManifestPromise;
}

function renderStatusBadge(article) {
  if (article.status === "published") {
    return `<span class="ges-article-card__status ges-article-card__status--published">Published</span>`;
  }

  return `<span class="ges-article-card__status ges-article-card__status--draft">Draft</span>`;
}

function renderTermList(items = [], label, className = "") {
  if (!items.length) return "";

  return `
    <ul class="article-entry-tags ${escapeHtml(className)}" aria-label="${escapeHtml(label)}">
      ${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function renderCompatibility(article) {
  const badges = [
    article.compatibility?.readingProgress ? "Reading progress ready" : "",
    article.compatibility?.qr ? "QR ready" : "QR pending",
    resourcesText(article)
  ].filter(Boolean);

  if (!badges.length) return "";

  return `
    <ul class="ges-article-card__compatibility" aria-label="Article compatibility">
      ${badges.map(badge => `<li>${escapeHtml(badge)}</li>`).join("")}
    </ul>
  `;
}

function articleLinkLabel(article = {}) {
  return article.status === "draft" ? `Preview draft: ${article.title}` : `Read ${article.title}`;
}

function renderCardLink(article, content, { internalView = false } = {}) {
  const href = routeHref(article);
  if (!canPreviewArticle(article, internalView)) {
    return `<div class="ges-article-card__media-placeholder">${content}</div>`;
  }

  return `<a class="ges-article-card__media-link" href="${escapeHtml(href)}" aria-label="${escapeHtml(articleLinkLabel(article))}">${content}</a>`;
}

function renderArticleCard(article, { internalView = false } = {}) {
  const href = routeHref(article);
  const previewable = canPreviewArticle(article, internalView);
  const titleMarkup = previewable
    ? `<a href="${escapeHtml(href)}">${escapeHtml(article.title)}</a>`
    : `<span>${escapeHtml(article.title)}</span>`;
  const draftNote = article.route?.sourceNote
    || (previewable ? "Draft preview route is available. Public roll still hides this article." : "Draft metadata only. Public route is not live.");
  const updatedMarkup = article.modifiedDate
    ? `<span>Updated ${escapeHtml(formatDate(article.modifiedDate))}</span>`
    : "";
  const publicationText = article.status === "published"
    ? `Published ${formatDate(article.publishDate, article.displayDate || "Date pending")}`
    : "Draft";

  return `
    <article class="ges-component-card ges-article-card" data-article-card data-article-status="${escapeHtml(article.status)}" data-article-id="${escapeHtml(article.id)}">
      <figure class="ges-article-card__media">
        ${renderCardLink(article, `
          <img src="${escapeHtml(article.hero?.src)}" alt="${escapeHtml(article.hero?.alt || "")}" loading="lazy" decoding="async" />
        `, { internalView })}
      </figure>
      <div class="ges-article-card__body">
        <div class="ges-article-card__meta-row">
          <span>${escapeHtml(publicationText)}</span>
          ${updatedMarkup}
          ${internalView ? renderStatusBadge(article) : ""}
        </div>
        <h2>${titleMarkup}</h2>
        ${article.subtitle ? `<p class="ges-article-card__subtitle">${escapeHtml(article.subtitle)}</p>` : ""}
        <p class="ges-article-card__excerpt">${escapeHtml(article.excerpt)}</p>
        <dl class="ges-article-card__facts">
          <div>
            <dt>Author</dt>
            <dd>${escapeHtml(article.author?.name || "Author pending")}</dd>
          </div>
          <div>
            <dt>Reading time</dt>
            <dd>${escapeHtml(readingTimeText(article))}</dd>
          </div>
        </dl>
        ${renderTermList(article.categories, "Article categories", "ges-article-card__categories")}
        ${renderTermList(article.tags, "Article tags", "ges-article-card__tags")}
        ${renderCompatibility(article)}
        ${internalView && article.status === "draft" ? `<p class="ges-article-card__internal-note">${escapeHtml(draftNote)}</p>` : ""}
      </div>
    </article>
  `;
}

function renderFilterButton(category, activeCategory) {
  const id = slugValue(category);
  const active = id === slugValue(activeCategory);

  return `
    <button type="button" class="ges-article-roll-filter" data-article-filter="${escapeHtml(category)}" aria-pressed="${active ? "true" : "false"}">
      ${escapeHtml(category)}
    </button>
  `;
}

function renderControls(categories = [], { internalView = false } = {}) {
  return `
    <section class="ges-article-roll-controls" aria-label="Article roll controls">
      <div class="ges-article-roll-search">
        <label for="articleRollSearch">Search the knowledge library</label>
        <input id="articleRollSearch" type="search" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="articleRollSuggestions" data-article-roll-search />
        <div id="articleRollSuggestions" class="ges-article-roll-suggestions" role="listbox" hidden data-article-roll-suggestions></div>
      </div>
      <div class="ges-article-roll-filter-group" role="group" aria-label="Filter articles by category">
        ${renderFilterButton("All", "All")}
        ${categories.map(category => renderFilterButton(category, "All")).join("")}
      </div>
      ${internalView ? `
        <label class="ges-article-roll-sort">
          <span>Internal sort</span>
          <select data-article-roll-sort>
            <option value="publication-date">Publication date</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="modified">Recently modified</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </label>
      ` : ""}
      <p class="ges-article-roll-status" role="status" aria-live="polite" data-article-roll-status></p>
    </section>
  `;
}

function renderRollShell({ articles, categories, internalView }) {
  return `
    <article class="ges-public-page ges-article-roll" aria-labelledby="articleRollTitle">
      <div class="ges-article-roll__body">
        ${renderControls(categories, { internalView })}
        <section class="ges-article-roll-grid" aria-label="Article list" data-article-roll-grid></section>
        <div class="ges-article-roll-empty" data-article-roll-empty hidden>
          <p>No articles match the current search and filter.</p>
        </div>
      </div>
    </article>
  `;
}

function updateSuggestions({ input, suggestions, tokens }) {
  const matches = typeaheadMatches(tokens, input.value);
  input.setAttribute("aria-expanded", matches.length ? "true" : "false");

  if (!matches.length) {
    suggestions.hidden = true;
    suggestions.innerHTML = "";
    return;
  }

  suggestions.hidden = false;
  suggestions.innerHTML = matches.map((match, index) => `
    <button type="button" role="option" id="articleRollSuggestion${index}" data-article-roll-suggestion="${escapeHtml(match)}">
      ${escapeHtml(match)}
    </button>
  `).join("");
}

function installArticleRoll(root, articles, options = {}) {
  const grid = root.querySelector("[data-article-roll-grid]");
  const empty = root.querySelector("[data-article-roll-empty]");
  const status = root.querySelector("[data-article-roll-status]");
  const searchInput = root.querySelector("[data-article-roll-search]");
  const suggestions = root.querySelector("[data-article-roll-suggestions]");
  const sortSelect = root.querySelector("[data-article-roll-sort]");
  const filterButtons = [...root.querySelectorAll("[data-article-filter]")];
  const tokens = typeaheadTokens(articles);
  const state = {
    category: "All",
    query: "",
    sort: options.internalView ? "publication-date" : "publication-date"
  };

  function filteredArticles() {
    return sortArticles(
      articles.filter(article =>
        articleMatchesQuery(article, state.query)
        && articleMatchesCategory(article, state.category)
      ),
      state.sort
    );
  }

  function render() {
    const visible = filteredArticles();
    grid.innerHTML = visible.map(article => renderArticleCard(article, options)).join("");
    empty.hidden = Boolean(visible.length);
    status.textContent = `${visible.length} ${visible.length === 1 ? "article" : "articles"} shown`;
    filterButtons.forEach(button => {
      const active = slugValue(button.dataset.articleFilter) === slugValue(state.category);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  searchInput.addEventListener("input", () => {
    state.query = searchInput.value.trim();
    updateSuggestions({ input: searchInput, suggestions, tokens });
    render();
  });

  searchInput.addEventListener("keydown", event => {
    if (event.key === "ArrowDown") {
      const firstSuggestion = suggestions.querySelector("button");
      if (firstSuggestion) {
        event.preventDefault();
        firstSuggestion.focus();
      }
    }
    if (event.key === "Escape") {
      suggestions.hidden = true;
      searchInput.setAttribute("aria-expanded", "false");
    }
  });

  suggestions.addEventListener("click", event => {
    const suggestion = event.target.closest("[data-article-roll-suggestion]");
    if (!suggestion) return;
    searchInput.value = suggestion.dataset.articleRollSuggestion;
    state.query = searchInput.value;
    suggestions.hidden = true;
    searchInput.setAttribute("aria-expanded", "false");
    searchInput.focus();
    render();
  });

  suggestions.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      suggestions.hidden = true;
      searchInput.setAttribute("aria-expanded", "false");
      searchInput.focus();
    }
  });

  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      state.category = button.dataset.articleFilter || "All";
      render();
    });
  });

  sortSelect?.addEventListener("change", () => {
    state.sort = sortSelect.value;
    render();
  });

  render();
}

export function isArticleRollRequest() {
  return normalizedPathname().endsWith(`/${ARTICLE_ROLL_ROUTE}`);
}

export async function renderArticleRoll() {
  const internalView = hasInternalMenuPermission();
  const manifest = await loadArticleManifest();
  const articles = publicArticles(
    normalizeList(manifest.articles).map(article => normalizeArticle(article, manifest.defaults)),
    internalView
  );
  const categories = normalizeList(manifest.taxonomy?.categories);
  const shell = createGesPublicShell({
    htmlClasses: ["ges-public-page-route", "ges-article-roll-route"],
    mainClasses: ["ges-public-main"],
    metadata: {
      title: "Articles",
      description: "The canonical GES knowledge library for published property assessment, equalization, protest, tax, and research articles.",
      canonicalPath: ARTICLE_ROLL_ROUTE,
      pageType: "article-roll",
      socialTitle: "GES Articles | Guided Parcel Review",
      socialDescription: "A structured knowledge library for Guided Parcel Review educational articles.",
      socialImage: "assets/brand/civic-house/social/og-image-1200x630.png",
      keywords: categories
    },
    pageType: "article-roll",
    routeName: "article-roll",
    shell: "public"
  });

  if (!shell?.coverRegion) return false;

  const publishedCount = articles.filter(article => article.status === "published").length;
  const draftCount = articles.filter(article => article.status === "draft").length;

  shell.setCover(`
    <header class="ges-public-page-hero ges-article-roll-hero" aria-labelledby="articleRollTitle">
      <p class="ges-public-page-hero__eyebrow">Structured Knowledge Library</p>
      <h1 id="articleRollTitle">Articles</h1>
      <p class="ges-public-page-hero__dek">Published GES guides, explainers, case studies, and future article metadata in one canonical roll.</p>
      <dl class="ges-article-roll-hero__stats" aria-label="Article roll counts">
        <div>
          <dt>Published</dt>
          <dd>${escapeHtml(publishedCount)}</dd>
        </div>
        ${internalView ? `
          <div>
            <dt>Drafts</dt>
            <dd>${escapeHtml(draftCount)}</dd>
          </div>
        ` : ""}
      </dl>
    </header>
  `);

  shell.setBody(renderRollShell({ articles, categories, internalView }));
  installArticleRoll(shell.bodyRegion, articles, { internalView });

  return true;
}
