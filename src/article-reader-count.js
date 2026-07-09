import { VISIT_ANALYTICS_ENDPOINT } from "./visit-analytics.js?v=20260709-central-timestamp-1";

const ARTICLE_READER_COUNT_CACHE_KEY = "guidedParcelReview.articleReaderCounts.v1";
const ARTICLE_READER_COUNT_CACHE_TTL_MS = 20 * 60 * 1000;
const ARTICLE_READER_COUNT_ENDPOINT_VIEW = "article-reader-counts";
const ARTICLE_READER_COUNT_JSONP_TIMEOUT_MS = 5000;
const ARTICLE_READER_COUNT_MINIMUM = 100;

let inFlightCountsPromise = null;

function storage() {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function now() {
  return Date.now();
}

function endpointUrl(endpoint = VISIT_ANALYTICS_ENDPOINT) {
  const url = new URL(endpoint);
  url.searchParams.set("view", ARTICLE_READER_COUNT_ENDPOINT_VIEW);
  return url.href;
}

function previewReaderCount(articleSlug) {
  if (typeof window === "undefined") return null;
  if (!["localhost", "127.0.0.1"].includes(window.location.hostname)) return null;

  const params = new URLSearchParams(window.location.search);
  const slugParam = normalizeSlug(params.get("readerCountSlug") || articleSlug);
  if (slugParam !== normalizeSlug(articleSlug)) return null;

  const count = Number(params.get("readerCountPreview"));
  if (!shouldShowReaderCount(count)) return null;

  return {
    readers: Math.round(count),
    updatedAt: new Date().toISOString()
  };
}

function normalizeSlug(value = "") {
  return `${value}`
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^articles\//, "")
    .replace(/\/index\.html$/, "")
    .replace(/\/$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function readCachedCounts() {
  const store = storage();
  if (!store) return null;

  try {
    const cached = JSON.parse(store.getItem(ARTICLE_READER_COUNT_CACHE_KEY) || "null");
    if (!cached?.articles || !cached.cachedAt) return null;
    if (now() - cached.cachedAt > ARTICLE_READER_COUNT_CACHE_TTL_MS) return null;
    return cached;
  } catch {
    return null;
  }
}

function writeCachedCounts(data) {
  const store = storage();
  if (!store || !data?.articles) return;

  try {
    store.setItem(ARTICLE_READER_COUNT_CACHE_KEY, JSON.stringify({
      articles: data.articles,
      cachedAt: now()
    }));
  } catch {
    // Reader counts are progressive enhancement only.
  }
}

function getArticleReaderCounts(options = {}) {
  const cached = readCachedCounts();
  if (cached) return Promise.resolve(cached);

  if (!inFlightCountsPromise) {
    inFlightCountsPromise = fetchArticleReaderCounts(options)
      .then(data => {
        writeCachedCounts(data);
        return data;
      })
      .catch(error => {
        inFlightCountsPromise = null;
        throw error;
      });
  }

  return inFlightCountsPromise;
}

async function fetchArticleReaderCounts(options = {}) {
  const url = endpointUrl(options.endpoint);

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      credentials: "omit"
    });
    if (!response.ok) throw new Error(`Reader count request failed: ${response.status}`);
    return await response.json();
  } catch (error) {
    if (options.disableJsonpFallback) throw error;
    return fetchArticleReaderCountsJsonp(url);
  }
}

function fetchArticleReaderCountsJsonp(url) {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined" || typeof window === "undefined") {
      reject(new Error("JSONP requires a browser document"));
      return;
    }

    const callbackName = `__gprArticleReaderCounts${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Reader count JSONP request timed out"));
    }, ARTICLE_READER_COUNT_JSONP_TIMEOUT_MS);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = payload => {
      cleanup();
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Reader count JSONP request failed"));
    };

    const jsonpUrl = new URL(url);
    jsonpUrl.searchParams.set("callback", callbackName);
    script.src = jsonpUrl.href;
    document.head.append(script);
  });
}

export function shouldShowReaderCount(count) {
  return Number.isFinite(Number(count)) && Number(count) >= ARTICLE_READER_COUNT_MINIMUM;
}

export function formatReaderCount(count) {
  const rounded = Math.round(Number(count));
  if (!shouldShowReaderCount(rounded)) return "";
  if (rounded < 1000) return rounded.toLocaleString("en-US");
  if (rounded < 10000) return `${(rounded / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${Math.round(rounded / 1000)}K`;
}

export async function getArticleReaderCount(articleSlug, options = {}) {
  const slug = normalizeSlug(articleSlug);
  if (!slug) return null;

  const preview = previewReaderCount(slug);
  if (preview) return preview;

  const data = await getArticleReaderCounts(options);
  const article = data?.articles?.[slug] ?? data?.articles?.[normalizeSlug(data?.articleId ?? "")];
  const readers = Number(article?.readers);

  if (!shouldShowReaderCount(readers)) return null;
  return {
    readers: Math.round(readers),
    updatedAt: article?.updatedAt || ""
  };
}

export function currentArticleSlug(root = document) {
  const entry = root.querySelector?.("[data-article-reader-count][data-article-slug]");
  if (entry?.dataset.articleSlug) return normalizeSlug(entry.dataset.articleSlug);
  const route = document.documentElement?.dataset?.gesRoute || "";
  if (route) return normalizeSlug(route);

  const path = window.location?.pathname || "";
  const match = path.match(/\/articles\/([^/]+)/);
  return normalizeSlug(match?.[1] || "");
}

export function ArticleReaderCount({ articleSlug, count } = {}) {
  if (!articleSlug || !shouldShowReaderCount(count)) return "";
  const formatted = formatReaderCount(count);
  return formatted ? `Read by ${formatted} people` : "";
}

export function installArticleReaderCounts(root = document, options = {}) {
  const targets = [...root.querySelectorAll?.("[data-article-reader-count]") ?? []];
  if (!targets.length) return;

  targets.forEach(target => {
    if (target.dataset.articleReaderCountReady === "true") return;
    target.dataset.articleReaderCountReady = "true";

    const slug = normalizeSlug(target.dataset.articleSlug || currentArticleSlug(root));
    if (!slug) return;

    getArticleReaderCount(slug, options)
      .then(result => {
        if (!result) return;
        const label = ArticleReaderCount({ articleSlug: slug, count: result.readers });
        if (!label) return;
        target.textContent = label;
        target.setAttribute("aria-label", label);
        target.hidden = false;
        const divider = target.parentElement?.querySelector?.("[data-reader-count-divider]");
        if (divider) divider.hidden = false;
        window.requestAnimationFrame(() => {
          target.dataset.articleReaderCountVisible = "true";
        });
      })
      .catch(() => {
        // Analytics social proof should never interrupt article reading.
      });
  });
}
