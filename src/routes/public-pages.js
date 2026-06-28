import { copyObject } from "../content/site-copy.js?v=db3aed6";
import { createGesPublicShell } from "../ges/shell.js?v=db3aed6";
import { escapeHtml } from "../utils/html.js?v=db3aed6";

const PUBLIC_PAGE_COPY = Object.freeze({
  about: {
    path: "about/",
    routeName: "public-about",
    title: "About",
    eyebrow: "Public Page",
    description: "Reserved public About route for Guided Parcel Review and the Guided Editorial System.",
    intro: "This route is reserved for the public About page. Full content will be developed in a later publication pass.",
    reusedPanel: "about"
  },
  faq: {
    path: "faq/",
    routeName: "public-faq",
    title: "FAQ",
    eyebrow: "Public Page",
    description: "Reserved public FAQ route for Guided Parcel Review and the Guided Editorial System.",
    intro: "This route is reserved for public frequently asked questions. Existing step-specific FAQs remain in the guided review resource system until they are promoted into a public FAQ structure.",
    reusedPanel: "faq"
  },
  contact: {
    path: "contact/",
    routeName: "public-contact",
    title: "Contact",
    eyebrow: "Public Page",
    description: "Reserved public Contact route for Guided Parcel Review and the Guided Editorial System.",
    intro: "This route is reserved for public contact guidance. Full channel-specific contact content will be developed in a later publication pass.",
    reusedPanel: "contact"
  },
  administrative: {
    path: "administrative/",
    routeName: "public-administrative",
    title: "Administrative",
    eyebrow: "Administrative",
    description: "Administrative notices, policies, accessibility information, copyright, and source notices for Guided Parcel Review.",
    intro: "Administrative material is organized here so privacy, terms, accessibility, legal notices, copyright, and source notices can mature in one public route."
  }
});

const ADMINISTRATIVE_SECTIONS = Object.freeze([
  { id: "privacy-policy", label: "Privacy Policy", panel: "privacy" },
  { id: "terms-of-use", label: "Terms of Use", panel: "terms" },
  { id: "accessibility-statement", label: "Accessibility Statement", panel: "accessibility" },
  {
    id: "legal-notices",
    label: "Legal Notices",
    fallbackTitle: "Legal notices",
    fallbackBody: "Legal notice language will be finalized in a later administrative content pass."
  },
  {
    id: "copyright",
    label: "Copyright",
    fallbackTitle: "Copyright",
    fallbackBody: "Copyright and reuse terms will be finalized in a later administrative content pass."
  },
  {
    id: "source-data-notices",
    label: "Source/Data Notices",
    fallbackTitle: "Source and data notices",
    fallbackBody: "Source, data provenance, and attribution details will be finalized as public resource pages mature."
  }
]);

function normalizedPathname() {
  return window.location.pathname.endsWith("/")
    ? window.location.pathname
    : `${window.location.pathname}/`;
}

function currentPublicPageId() {
  const pathname = normalizedPathname();
  return Object.entries(PUBLIC_PAGE_COPY)
    .find(([, page]) => pathname.endsWith(`/${page.path}`))?.[0] ?? "";
}

function panelCopy(id) {
  return copyObject("footer.panels", {})[id] ?? {};
}

function paragraphList(items = []) {
  return items.map(item => `<p>${escapeHtml(item)}</p>`).join("");
}

function renderPanelSection(section) {
  const existing = section.panel ? panelCopy(section.panel) : {};
  const title = existing.title || section.fallbackTitle || section.label;
  const body = existing.body ? `<p>${escapeHtml(existing.body)}</p>` : paragraphList(existing.notes);
  const finalBody = body || `<p>${escapeHtml(section.fallbackBody || "Content will be added in a later publication pass.")}</p>`;

  return `
    <section id="${escapeHtml(section.id)}" class="ges-public-page__section">
      <p class="ges-public-page-hero__eyebrow">${escapeHtml(existing.kicker || section.label)}</p>
      <h2>${escapeHtml(title)}</h2>
      ${finalBody}
    </section>
  `;
}

function renderAdministrativePage() {
  return `
    <article class="ges-public-page ges-public-page--administrative" aria-labelledby="publicPageTitle">
      <div class="ges-public-page__body">
        <p class="ges-public-page__intro">${escapeHtml(PUBLIC_PAGE_COPY.administrative.intro)}</p>
        <nav class="ges-public-section-nav" aria-label="Administrative sections">
          ${ADMINISTRATIVE_SECTIONS.map(section => `
            <a href="#${escapeHtml(section.id)}">${escapeHtml(section.label)}</a>
          `).join("")}
        </nav>
        <div class="ges-public-page__sections">
          ${ADMINISTRATIVE_SECTIONS.map(renderPanelSection).join("")}
        </div>
      </div>
    </article>
  `;
}

function renderPlaceholderPage(page) {
  const existing = page.reusedPanel ? panelCopy(page.reusedPanel) : {};
  const supportingCopy = existing.body
    ? `<p>${escapeHtml(existing.body)}</p>`
    : paragraphList(existing.notes);

  return `
    <article class="ges-public-page ges-public-page--placeholder" aria-labelledby="publicPageTitle">
      <div class="ges-public-page__body">
        <p class="ges-public-page__intro">${escapeHtml(page.intro)}</p>
        <section class="ges-public-page__notice" aria-label="Phase 02 route status">
          <p class="ges-public-page-hero__eyebrow">Phase 02 Placeholder</p>
          ${supportingCopy || `<p>${escapeHtml(page.description)}</p>`}
        </section>
      </div>
    </article>
  `;
}

export function isGesPublicPageRequest() {
  return Boolean(currentPublicPageId());
}

export function renderGesPublicPage() {
  const pageId = currentPublicPageId();
  const page = PUBLIC_PAGE_COPY[pageId];
  if (!page) return false;

  const shell = createGesPublicShell({
    htmlClasses: ["ges-public-page-route"],
    mainClasses: ["ges-public-main"],
    metadata: {
      title: page.title,
      description: page.description,
      canonicalPath: page.path,
      pageType: pageId === "administrative" ? "administrative" : "public-page",
      socialTitle: `${page.title} | Guided Parcel Review`,
      socialDescription: page.description
    },
    pageType: pageId === "administrative" ? "administrative" : "public-page",
    routeName: page.routeName,
    shell: pageId === "administrative" ? "public-administrative" : "minimal"
  });
  if (!shell?.coverRegion) return false;

  shell.setCover(`
    <header class="ges-public-page-hero" aria-labelledby="publicPageTitle">
      <p class="ges-public-page-hero__eyebrow">${escapeHtml(page.eyebrow)}</p>
      <h1 id="publicPageTitle">${escapeHtml(page.title)}</h1>
      <p class="ges-public-page-hero__dek">${escapeHtml(page.description)}</p>
    </header>
  `);

  shell.setBody(pageId === "administrative"
    ? renderAdministrativePage()
    : renderPlaceholderPage(page));

  return true;
}
