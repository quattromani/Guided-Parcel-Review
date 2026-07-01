import { versionedAssetUrl } from "../asset-version.js?v=20260701-article-polish-4";
import {
  applyGesTheme,
  installGesThemeToggle,
  renderGesThemeToggle
} from "../ges-theme.js?v=20260701-article-polish-4";
import {
  buildProjectNav,
  installTrackingContextLinkEnhancer
} from "./project-nav.js?v=20260701-article-polish-4";

const GLOBAL_HEADER_SELECTOR = "[data-gpr-global-header]";
const GLOBAL_HEADER_STYLESHEET_ID = "gpr-global-header-stylesheet";
const GLOBAL_HEADER_INITIALIZED_KEY = "__gprGlobalHeaderInitialized";

export function ensureGlobalHeaderStylesheet() {
  if (document.getElementById(GLOBAL_HEADER_STYLESHEET_ID)) return;
  if (document.querySelector('link[rel="stylesheet"][href*="src/ges/global-header.css"]')) return;

  const link = document.createElement("link");
  link.id = GLOBAL_HEADER_STYLESHEET_ID;
  link.rel = "stylesheet";
  link.href = versionedAssetUrl("./global-header.css", import.meta.url);
  document.head.append(link);
}

function createHeader() {
  const header = document.createElement("header");
  header.className = "gpr-global-header";
  header.dataset.gprGlobalHeader = "";
  header.innerHTML = `
    <div class="gpr-global-header__inner">
      <div class="gpr-global-header__brand" data-gpr-global-header-brand></div>
      <div class="gpr-global-header__actions">
        ${renderGesThemeToggle()}
      </div>
    </div>
  `;
  header.querySelector("[data-gpr-global-header-brand]")?.append(buildProjectNav());
  return header;
}

function ensureHeader() {
  let header = document.querySelector(GLOBAL_HEADER_SELECTOR);

  if (!header) {
    header = createHeader();
    document.body.prepend(header);
  }

  const brand = header.querySelector("[data-gpr-global-header-brand]");
  if (brand && !brand.querySelector("[data-ges-project-nav-instance]")) {
    brand.append(buildProjectNav());
  }

  const actions = header.querySelector(".gpr-global-header__actions");
  if (actions && !actions.querySelector("[data-ges-theme-option]")) {
    actions.innerHTML = renderGesThemeToggle();
  }

  return header;
}

export function initGlobalHeader() {
  if (typeof document === "undefined" || typeof window === "undefined" || !document.body) return null;

  ensureGlobalHeaderStylesheet();
  applyGesTheme();

  const header = ensureHeader();
  installGesThemeToggle(header);
  installTrackingContextLinkEnhancer(document);
  document.documentElement.dataset.gprGlobalHeader = "enabled";
  window[GLOBAL_HEADER_INITIALIZED_KEY] = true;
  return header;
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGlobalHeader, { once: true });
  } else {
    initGlobalHeader();
  }
}
