import { versionedAssetUrl } from "../asset-version.js?v=20260709-masthead-polish-3";

const GES_STYLESHEET_ID = "ges-design-system-stylesheet";

export function ensureGesStylesheet() {
  if (document.getElementById(GES_STYLESHEET_ID)) return;
  if (document.querySelector('link[rel="stylesheet"][href*="src/ges/index.css"]')) return;

  const link = document.createElement("link");
  link.id = GES_STYLESHEET_ID;
  link.rel = "stylesheet";
  link.href = versionedAssetUrl("./index.css", import.meta.url);
  document.head.append(link);
}
