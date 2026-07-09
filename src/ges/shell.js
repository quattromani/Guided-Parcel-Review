import { ensureGesStylesheet } from "./loader.js?v=20260709-masthead-polish-3";
import {
  applyGesLayoutAttributes,
  applyGesPublicMetadata,
  ensureGesPublicFooter,
  GES_LAYOUTS
} from "./public-layout.js?v=20260701-article-polish-4";

const DEFAULT_COVER_SELECTOR = '[data-ges-shell-region="cover"], [data-ges-shell-region="title"], #pageTitle';
const DEFAULT_BODY_SELECTOR = '[data-ges-shell-region="body"], [data-ges-shell-region="content"], .mobile-review-canvas';
const DEFAULT_APP_CHROME_SELECTORS = [
  ".guide-review-header",
  "[data-guided-panel]",
  "[data-footer-resource-shell]"
];
const ARTICLE_PRIMARY_INPUT_SELECTOR = [
  "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='checkbox']):not([type='radio']):not([type='range']):not([type='color']):not([type='file']):not([type='image']):not([type='reset']):not([disabled]):not([readonly]):not([aria-hidden='true'])",
  "textarea:not([disabled]):not([readonly]):not([aria-hidden='true'])"
].join(", ");
const ARTICLE_PRIMARY_INPUT_FIELD_SELECTOR = [
  ".levy-input-shell",
  ".ges-field-kit__field",
  ".case-calculator label",
  "label"
].join(", ");

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

function markPrimaryArticleInput(root = document) {
  const articleRoot = root?.matches?.("article")
    ? root
    : root?.querySelector?.("article");
  if (!articleRoot) return null;

  articleRoot.querySelectorAll("[data-article-primary-input]").forEach(element => {
    element.removeAttribute("data-article-primary-input");
  });
  articleRoot.querySelectorAll("[data-article-primary-input-field]").forEach(element => {
    element.removeAttribute("data-article-primary-input-field");
  });

  const input = articleRoot.querySelector(ARTICLE_PRIMARY_INPUT_SELECTOR);
  if (!input) return null;

  input.setAttribute("data-article-primary-input", "true");
  input.closest(ARTICLE_PRIMARY_INPUT_FIELD_SELECTOR)?.setAttribute("data-article-primary-input-field", "true");
  return input;
}

function installArticlePrimaryInputMarker(shell) {
  if (!shell?.setBody) return shell;
  const setBody = shell.setBody.bind(shell);
  shell.setBody = (html = "") => {
    const bodyRegion = setBody(html);
    markPrimaryArticleInput(bodyRegion);
    return bodyRegion;
  };
  markPrimaryArticleInput(shell.bodyRegion);
  return shell;
}

export function hideGesAppChrome(root = document, selectors = DEFAULT_APP_CHROME_SELECTORS) {
  normalizeList(selectors).forEach(selector => {
    root.querySelectorAll(selector).forEach(element => {
      element.classList.add("is-hidden");
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
  return installArticlePrimaryInputMarker(createGesPublicShell({
    ...options,
    htmlClasses: ["article-shell-route", ...normalizeList(options.htmlClasses)],
    mainClasses: ["ges-public-main", ...normalizeList(options.mainClasses)],
    pageType: options.pageType ?? "article",
    shell: options.shell ?? "article"
  }));
}

export function createGesPublicShell(options = {}) {
  const routeName = options.routeName ?? "";
  const shell = createGesShell({
    ...options,
    htmlClasses: ["ges-public-layout-route", ...normalizeList(options.htmlClasses)],
    shell: options.shell ?? "public"
  });

  if (!shell) return null;

  applyGesLayoutAttributes({
    layout: GES_LAYOUTS.PUBLIC,
    pageType: options.pageType ?? options.shell ?? "public",
    routeName
  });
  applyGesPublicMetadata(options.metadata);
  ensureGesPublicFooter(options.footer);
  return shell;
}

export function createGesInternalShell(options = {}) {
  const shell = createGesShell({
    ...options,
    hideAppChrome: options.hideAppChrome ?? false,
    shell: options.shell ?? "internal"
  });

  if (!shell) return null;

  applyGesLayoutAttributes({
    layout: GES_LAYOUTS.INTERNAL,
    pageType: options.pageType ?? "internal",
    routeName: options.routeName ?? ""
  });

  return shell;
}
