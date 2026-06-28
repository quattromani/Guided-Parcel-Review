import { DEPLOY_VERSION } from "../asset-version.js?v=db3aed6";
import { escapeHtml } from "../utils/html.js?v=db3aed6";

export const GES_LAYOUTS = Object.freeze({
  PUBLIC: "public",
  INTERNAL: "internal",
  PRINTABLE: "printable",
  PDF: "pdf",
  MINIMAL: "minimal"
});

export const GES_PUBLIC_FOOTER_LINKS = Object.freeze([
  { label: "Articles", href: "articles/" },
  { label: "About", href: "about/" },
  { label: "FAQ", href: "faq/" },
  { label: "Contact", href: "contact/" },
  { label: "Administrative", href: "administrative/" }
]);

const PUBLIC_FOOTER_SELECTOR = "[data-ges-public-footer]";
const SITE_NAME = "Guided Parcel Review";
const GES_NAME = "Guided Editorial System";

function absoluteUrl(path = window.location.pathname) {
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, document.baseURI).href;
}

function setMeta(name, content) {
  if (!content) return;
  let element = document.querySelector(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.append(element);
  }
  element.setAttribute("content", content);
}

function setPropertyMeta(property, content) {
  if (!content) return;
  let element = document.querySelector(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.append(element);
  }
  element.setAttribute("content", content);
}

function setCanonicalLink(url) {
  if (!url) return;
  let element = document.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.append(element);
  }
  element.setAttribute("href", url);
}

function normalizeList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

export function applyGesLayoutAttributes({
  layout = GES_LAYOUTS.PUBLIC,
  pageType = "",
  routeName = ""
} = {}) {
  document.documentElement.dataset.gesLayout = layout;
  if (pageType) document.documentElement.dataset.gesPageType = pageType;
  if (routeName) document.documentElement.dataset.gesRoute = routeName;
}

export function applyGesPublicMetadata(metadata = {}) {
  if (!metadata || typeof document === "undefined") return;

  const siteName = metadata.siteName || SITE_NAME;
  const title = metadata.title || siteName;
  const socialTitle = metadata.socialTitle || title;
  const description = metadata.description || metadata.socialDescription || "";
  const socialDescription = metadata.socialDescription || description;
  const canonicalUrl = metadata.canonicalUrl || (metadata.canonicalPath ? absoluteUrl(metadata.canonicalPath) : absoluteUrl(window.location.pathname));
  const pageType = metadata.pageType || "website";
  const ogType = metadata.ogType || (pageType === "article" ? "article" : "website");
  const tags = normalizeList(metadata.tags ?? metadata.categories);
  const keywords = normalizeList(metadata.keywords).concat(tags);

  document.title = metadata.documentTitle || `${title} | ${siteName}`;
  setCanonicalLink(canonicalUrl);
  setMeta("description", description);
  setMeta("robots", metadata.robots || "index, follow, max-image-preview:large");
  setMeta("author", metadata.author);
  if (keywords.length) setMeta("keywords", [...new Set(keywords)].join(", "));
  setMeta("article:published_time", metadata.publishedDate);
  setMeta("article:modified_time", metadata.modifiedDate);
  setMeta("article:section", metadata.section);

  setPropertyMeta("og:type", ogType);
  setPropertyMeta("og:site_name", siteName);
  setPropertyMeta("og:title", socialTitle);
  setPropertyMeta("og:description", socialDescription);
  setPropertyMeta("og:url", canonicalUrl);
  setPropertyMeta("og:image", metadata.socialImage);
  setPropertyMeta("og:image:alt", metadata.socialImageAlt);
  setPropertyMeta("article:published_time", metadata.publishedDate);
  setPropertyMeta("article:modified_time", metadata.modifiedDate);
  setPropertyMeta("article:author", metadata.author);

  setMeta("twitter:card", metadata.socialImage ? "summary_large_image" : "summary");
  setMeta("twitter:title", socialTitle);
  setMeta("twitter:description", socialDescription);
  setMeta("twitter:image", metadata.socialImage);
}

export function renderGesPublicFooter({
  links = GES_PUBLIC_FOOTER_LINKS,
  year = new Date().getFullYear(),
  version = DEPLOY_VERSION
} = {}) {
  return `
    <footer class="ges-public-footer" data-ges-public-footer aria-label="Public footer">
      <div class="ges-public-footer__inner">
        <div class="ges-public-footer__identity">
          <p class="ges-public-footer__eyebrow">${escapeHtml(GES_NAME)}</p>
          <p class="ges-public-footer__title">${escapeHtml(SITE_NAME)}</p>
          <p class="ges-public-footer__description">Public-facing civic education, guides, tools, and references for clearer property information.</p>
        </div>
        <nav class="ges-public-footer__nav" aria-label="Public footer links">
          ${links.map(link => `
            <a class="ges-public-footer__link" href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>
          `).join("")}
        </nav>
        <div class="ges-public-footer__future" data-ges-public-footer-slot="future" hidden>
          <span data-ges-public-footer-slot="source-code"></span>
          <span data-ges-public-footer-slot="release-notes"></span>
          <span data-ges-public-footer-slot="county-attribution"></span>
          <span data-ges-public-footer-slot="open-source-attribution"></span>
          <span data-ges-public-footer-slot="data-provenance"></span>
          <span data-ges-public-footer-slot="accessibility-contact"></span>
        </div>
        <p class="ges-public-footer__meta">
          <span>&copy; ${escapeHtml(year)} ${escapeHtml(SITE_NAME)}</span>
          <span>${escapeHtml(GES_NAME)}</span>
          <span>Version ${escapeHtml(version)}</span>
        </p>
      </div>
    </footer>
  `;
}

export function ensureGesPublicFooter(options = {}) {
  if (typeof document === "undefined" || !document.body) return null;
  let footer = document.querySelector(PUBLIC_FOOTER_SELECTOR);
  if (!footer) {
    document.body.insertAdjacentHTML("beforeend", renderGesPublicFooter(options));
    footer = document.querySelector(PUBLIC_FOOTER_SELECTOR);
  }
  return footer;
}
