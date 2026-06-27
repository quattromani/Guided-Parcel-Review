import { ensureGesStylesheet } from "./loader.js?v=db3aed6";

const DEFAULT_COVER_SELECTOR = '[data-ges-shell-region="cover"], [data-ges-shell-region="title"], #pageTitle';
const DEFAULT_BODY_SELECTOR = '[data-ges-shell-region="body"], [data-ges-shell-region="content"], .mobile-review-canvas';
const DEFAULT_APP_CHROME_SELECTORS = [
  ".guide-review-header",
  "[data-guided-panel]",
  "[data-footer-resource-shell]"
];

function normalizeList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function resolveElement(value, root = document) {
  if (!value) return null;
  if (value.nodeType === 1) return value;
  if (typeof value === "string") return root.querySelector(value);
  return null;
}

export function hideGesAppChrome(root = document, selectors = DEFAULT_APP_CHROME_SELECTORS) {
  normalizeList(selectors).forEach(selector => {
    root.querySelectorAll(selector).forEach(element => {
      element.classList.add("hidden");
      element.setAttribute("aria-hidden", "true");
    });
  });
}

export function resolveGesShellRegions({
  root = document,
  main,
  coverSelector = DEFAULT_COVER_SELECTOR,
  bodySelector = DEFAULT_BODY_SELECTOR
} = {}) {
  const coverRegion = resolveElement(coverSelector, root);
  const bodyRegion = resolveElement(bodySelector, root);
  const mainRegion = resolveElement(main, root)
    ?? coverRegion?.closest("main")
    ?? bodyRegion?.closest("main")
    ?? root.querySelector("main");

  return {
    bodyRegion,
    coverRegion,
    mainRegion
  };
}

export function createGesShell({
  root = document,
  htmlClasses = [],
  routeName = "",
  shell = "editorial",
  main,
  mainClasses = [],
  coverSelector,
  bodySelector,
  hideAppChrome = true,
  hiddenSelectors,
  ensureStyles = true
} = {}) {
  if (ensureStyles) ensureGesStylesheet();

  const htmlElement = root.documentElement ?? document.documentElement;
  const regions = resolveGesShellRegions({
    root,
    main,
    coverSelector,
    bodySelector
  });

  if (!regions.bodyRegion) return null;

  normalizeList(htmlClasses).forEach(className => htmlElement.classList.add(className));
  if (routeName) htmlElement.dataset.gesRoute = routeName;

  if (regions.mainRegion) {
    regions.mainRegion.dataset.gesShell = shell;
    normalizeList(mainClasses).forEach(className => regions.mainRegion.classList.add(className));
  }

  if (regions.coverRegion) regions.coverRegion.dataset.gesShellRegion = "cover";
  regions.bodyRegion.dataset.gesShellRegion = "body";

  if (hideAppChrome) {
    hideGesAppChrome(root, hiddenSelectors ?? DEFAULT_APP_CHROME_SELECTORS);
  }

  return {
    bodyRegion: regions.bodyRegion,
    clear() {
      if (regions.coverRegion) regions.coverRegion.innerHTML = "";
      regions.bodyRegion.innerHTML = "";
      return this;
    },
    coverRegion: regions.coverRegion,
    htmlElement,
    mainRegion: regions.mainRegion,
    root,
    setBody(html = "") {
      regions.bodyRegion.innerHTML = html;
      return regions.bodyRegion;
    },
    setCover(html = "") {
      if (!regions.coverRegion) return null;
      regions.coverRegion.innerHTML = html;
      return regions.coverRegion;
    }
  };
}

export function createGesArticleShell(options = {}) {
  return createGesShell({
    ...options,
    htmlClasses: ["article-shell-route", ...normalizeList(options.htmlClasses)],
    shell: options.shell ?? "article"
  });
}
