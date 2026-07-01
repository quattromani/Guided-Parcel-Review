import { initGlobalHeader } from "../src/ges/global-header.js?v=20260701-article-polish-4";
import {
  applyGesLayoutAttributes,
  ensureGesPublicFooter,
  GES_LAYOUTS
} from "../src/ges/public-layout.js?v=20260701-article-polish-4";
import { ensureGesStylesheet } from "../src/ges/loader.js?v=20260701-article-polish-4";

function readPageMetadata() {
  const element = document.querySelector("[data-ges-experiment-metadata]");
  if (!element?.textContent?.trim()) return {};

  try {
    return JSON.parse(element.textContent);
  } catch (error) {
    console.warn("Unable to read experiment metadata.", error);
    return {};
  }
}

function prepareExperimentShell() {
  const metadata = readPageMetadata();
  const routeName = metadata.routeName || document.documentElement.dataset.gesRoute || "experiment";
  const pageType = metadata.pageType || "experiment";
  const main = document.querySelector("main");
  const cover = document.querySelector("[data-ges-shell-region='cover']");
  const body = document.querySelector("[data-ges-shell-region='body']") || main;

  document.documentElement.classList.add("ges-public-layout-route", "ges-experiment-route");
  document.documentElement.dataset.gesRoute = routeName;
  document.documentElement.dataset.gesPageType = pageType;
  if (metadata.internal === true) document.documentElement.dataset.gesInternalExperiment = "true";

  applyGesLayoutAttributes({
    layout: GES_LAYOUTS.PUBLIC,
    pageType,
    routeName
  });

  if (main) {
    main.dataset.gesShell = metadata.shell || "experiment";
  }

  if (cover) cover.dataset.gesShellRegion = "cover";
  if (body) body.dataset.gesShellRegion = "body";

  ensureGesStylesheet();
  initGlobalHeader();
  ensureGesPublicFooter();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", prepareExperimentShell, { once: true });
} else {
  prepareExperimentShell();
}
