import { readFileSync } from "node:fs";

const endpoint = process.env.CDP_ENDPOINT || "http://127.0.0.1:9223";
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4217";
const publicUrl = `${baseUrl}/articles/`;
const internalUrl = `${baseUrl}/articles/?gpr_person=max-quattromani`;
const articleManifest = JSON.parse(readFileSync(new URL("../data/app/articles.json", import.meta.url), "utf8"));
const expectedPublicCount = articleManifest.articles.filter(article => article.published && !article.draft).length;
const expectedInternalCount = articleManifest.articles.length;
const expectedDraftCount = articleManifest.articles.filter(article => !article.published || article.draft).length;
const expectedNewestPublishedTitle = articleManifest.articles
  .filter(article => article.published && !article.draft)
  .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())[0]?.title;
const expectedDraftPreviewCount = articleManifest.articles.filter(article =>
  (!article.published || article.draft) &&
  article.route?.canonicalPath &&
  article.route?.previewable !== false &&
  (article.route?.previewable === true || !article.route?.sourceNote)
).length;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function assert(condition, message, details = {}) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

async function connect() {
  const tabs = await fetch(`${endpoint}/json`).then(response => response.json());
  const page = tabs.find(tab => tab.type === "page") ?? tabs[0];
  assert(page?.webSocketDebuggerUrl, "No debuggable Chrome page found.", { tabs });

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  const pending = new Map();
  let id = 0;

  ws.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) {
      reject(new Error(`${message.error.message}: ${message.error.data || ""}`));
    } else {
      resolve(message.result || {});
    }
  });

  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  function send(method, params = {}) {
    id += 1;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
    });
  }

  return { send, ws };
}

async function evaluate(send, fn) {
  const expression = typeof fn === "string" ? fn : `(${fn})()`;
  const response = await send("Runtime.evaluate", {
    awaitPromise: true,
    expression,
    returnByValue: true
  });

  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text || "Runtime evaluation failed.");
  }

  return response.result?.value;
}

async function waitFor(send, fn, timeoutMs = 6000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = await evaluate(send, fn);
    if (value) return value;
    await sleep(100);
  }
  throw new Error("Timed out waiting for page condition.");
}

async function navigate(send, url, expectedCardCount) {
  await send("Page.navigate", { url });
  await waitFor(send, () => document.readyState === "complete");
  await waitFor(send, () => document.querySelector("[data-article-roll-search]") !== null);
  await waitFor(send, `document.querySelectorAll("[data-article-card]").length === ${Number(expectedCardCount)}`);
}

function pageState() {
  const cards = [...document.querySelectorAll("[data-article-card]")];
  const draftCards = cards.filter(card => card.dataset.articleStatus === "draft");
  return {
    cardCount: cards.length,
    draftCardCount: draftCards.length,
    draftPreviewLinkCount: draftCards.filter(card => card.querySelector(".ges-article-card__media-link, h2 a")).length,
    statusTexts: [...document.querySelectorAll(".ges-article-card__status")].map(node => node.textContent.trim()),
    titles: cards.map(card => card.querySelector("h2")?.textContent?.trim()),
    metaRows: cards.map(card => card.querySelector(".ges-article-card__meta-row")?.textContent?.replace(/\s+/g, " ").trim()),
    readingProgressCount: document.querySelectorAll("[data-ges-reading-progress]").length,
    layout: document.documentElement.dataset.gesLayout,
    route: document.documentElement.dataset.gesRoute,
    sortExists: Boolean(document.querySelector("[data-article-roll-sort]")),
    footerLinks: [...document.querySelectorAll(".ges-public-footer__link")].map(link => link.textContent.trim())
  };
}

function searchLevy() {
  const input = document.querySelector("[data-article-roll-search]");
  input.value = "levy";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  const cards = [...document.querySelectorAll("[data-article-card]")];
  return {
    cardCount: cards.length,
    suggestionsHidden: document.querySelector("[data-article-roll-suggestions]").hidden,
    suggestions: [...document.querySelectorAll("[data-article-roll-suggestion]")].map(node => node.textContent.trim()),
    titles: cards.map(card => card.querySelector("h2")?.textContent?.trim())
  };
}

function filterLegal() {
  const input = document.querySelector("[data-article-roll-search]");
  input.value = "";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  document.querySelector('[data-article-filter="Legal"]').click();
  const cards = [...document.querySelectorAll("[data-article-card]")];
  return {
    cardCount: cards.length,
    titles: cards.map(card => card.querySelector("h2")?.textContent?.trim()),
    activeFilter: document.querySelector('[data-article-filter="Legal"]')?.getAttribute("aria-pressed")
  };
}

function sortDraftsFirst() {
  const sort = document.querySelector("[data-article-roll-sort]");
  sort.value = "draft";
  sort.dispatchEvent(new Event("change", { bubbles: true }));
  const cards = [...document.querySelectorAll("[data-article-card]")];
  return {
    firstStatus: cards[0]?.dataset.articleStatus,
    firstTitle: cards[0]?.querySelector("h2")?.textContent?.trim(),
    draftCount: cards.filter(card => card.dataset.articleStatus === "draft").length
  };
}

function mobileState() {
  const grid = document.querySelector("[data-article-roll-grid]");
  return {
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    gridColumns: getComputedStyle(grid).gridTemplateColumns
  };
}

const { send, ws } = await connect();
await send("Page.enable");
await send("Runtime.enable");

await navigate(send, publicUrl, expectedPublicCount);
const publicState = await evaluate(send, pageState);
assert(publicState.cardCount === expectedPublicCount, "Public roll should show published cards.", publicState);
assert(publicState.draftCardCount === 0, "Public roll should hide drafts.", publicState);
assert(publicState.statusTexts.length === 0, "Public roll should hide status badges.", publicState);
assert(publicState.readingProgressCount === 0, "Article roll should not mount Reading Progress.", publicState);
assert(publicState.layout === "public" && publicState.route === "article-roll", "Article roll should inherit Public Layout.", publicState);
assert(publicState.titles[0] === expectedNewestPublishedTitle, "Public roll should sort newest first.", publicState);
assert(publicState.metaRows.some(row => row.includes("June 23, 2026")), "Date-only article dates should not shift by timezone.", publicState);
assert(publicState.footerLinks.includes("Articles"), "Public footer should link to Articles.", publicState);

const searchState = await evaluate(send, searchLevy);
assert(searchState.cardCount >= 1 && searchState.cardCount < expectedPublicCount, "Search should filter rendered cards.", searchState);
assert(searchState.titles.includes("Assessment Up. Protest Denied. Taxes?"), "Search should match article metadata.", searchState);
assert(searchState.suggestions.some(value => value.includes("Levy")), "Typeahead should surface matching metadata.", searchState);

const filterState = await evaluate(send, filterLegal);
assert(filterState.cardCount === 1, "Category filter should reduce article cards.", filterState);
assert(filterState.activeFilter === "true", "Category filter should expose selected state.", filterState);

await navigate(send, internalUrl, expectedInternalCount);
const internalState = await evaluate(send, pageState);
assert(internalState.cardCount === expectedInternalCount, "Internal roll should show published and draft entries.", internalState);
assert(internalState.draftCardCount === expectedDraftCount, "Internal roll should include drafts.", internalState);
assert(internalState.draftPreviewLinkCount === expectedDraftPreviewCount, "Internal roll should link previewable draft entries.", internalState);
assert(internalState.statusTexts.includes("Published") && internalState.statusTexts.includes("Draft"), "Internal roll should show status badges.", internalState);
assert(internalState.sortExists, "Internal roll should expose sort control.", internalState);

const draftSortState = await evaluate(send, sortDraftsFirst);
assert(draftSortState.firstStatus === "draft", "Draft sort should put draft entries first.", draftSortState);
assert(draftSortState.draftCount === expectedDraftCount, "Draft sort should preserve draft entries.", draftSortState);

await send("Emulation.setDeviceMetricsOverride", {
  deviceScaleFactor: 1,
  height: 1200,
  mobile: true,
  width: 390
});
await navigate(send, publicUrl, expectedPublicCount);
const responsiveState = await evaluate(send, mobileState);
assert(responsiveState.scrollWidth <= responsiveState.clientWidth, "Mobile layout should not overflow horizontally.", responsiveState);
assert(!responsiveState.gridColumns.includes(" "), "Mobile article cards should stack in one column.", responsiveState);
await send("Emulation.clearDeviceMetricsOverride");

ws.close();
console.log(JSON.stringify({
  publicState,
  searchState,
  filterState,
  internalState,
  draftSortState,
  responsiveState
}, null, 2));
