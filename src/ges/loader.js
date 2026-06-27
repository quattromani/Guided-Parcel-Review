const GES_STYLESHEET_ID = "ges-design-system-stylesheet";

export function ensureGesStylesheet() {
  if (document.getElementById(GES_STYLESHEET_ID)) return;
  if (document.querySelector('link[rel="stylesheet"][href*="src/ges/index.css"]')) return;

  const link = document.createElement("link");
  link.id = GES_STYLESHEET_ID;
  link.rel = "stylesheet";
  link.href = new URL("./index.css?v=ges-1.0.0-20260627e", import.meta.url).href;
  document.head.append(link);
}
