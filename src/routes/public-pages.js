import { copyObject } from "../content/site-copy.js?v=20260701-article-polish-4";
import { createGesPublicShell } from "../ges/shell.js?v=20260701-article-polish-4";
import { escapeHtml } from "../utils/html.js?v=20260701-article-polish-4";

const PUBLIC_PAGE_COPY = Object.freeze({
  about: {
    path: "about/",
    routeName: "public-about",
    title: "About Guided Parcel Review",
    eyebrow: "Guided Editorial System",
    description: "A public civic-education platform for clearer property assessment, equalization, tax, and review information.",
    intro: "GES exists to improve understanding, not simply publish information. It helps readers move from uncertainty toward a clearer sense of what records mean, what questions to ask, and where official sources control.",
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

const ABOUT_SECTION_NAV = Object.freeze([
  { id: "mission", label: "Mission" },
  { id: "about-author", label: "About the Author" },
  { id: "why-ges-exists", label: "Why GES Exists" },
  { id: "project-philosophy", label: "Project Philosophy" },
  { id: "open-source", label: "Open Source" },
  { id: "future-vision", label: "Future Vision" }
]);

const ABOUT_SECTIONS = Object.freeze({
  mission: {
    eyebrow: "Mission",
    title: "Improve understanding",
    paragraphs: [
      "Property assessment is not one subject. It combines property records, valuation methods, equalization review, levy decisions, tax credits, deadlines, and Nebraska law. Guided Parcel Review organizes those pieces so a reader can recognize what is happening before deciding what to do next.",
      "The Guided Editorial System follows a simple standard already documented in this project: reduce cognitive friction without reducing intellectual depth. The goal is clarity without flattening the public process."
    ]
  },
  why: {
    eyebrow: "Practical Origin",
    title: "Why GES exists",
    paragraphs: [
      "Guided Parcel Review grew from practical parcel-review work. The project walks through one property in a clear sequence: record, value, market context, equalization, taxes, and review signals.",
      "GES is the publication layer around that work. It combines civic education, interactive tools, research, visual explanation, parcel review, assessment resources, and public documentation so the reader can move through a difficult subject one step at a time."
    ]
  },
  philosophy: {
    eyebrow: "Project Philosophy",
    title: "Clarity earns trust",
    paragraphs: [
      "GES should feel like a thoughtfully prepared civic publication. It earns authority through careful sequencing, restrained design, source awareness, and respect for the reader's time."
    ],
    bullets: [
      "Start with the property record before moving to value, equalization, tax context, and review signals.",
      "Keep taxpayer-facing copy neutral and sequential.",
      "Orient readers without predicting outcomes or replacing official determinations.",
      "Use design to reduce uncertainty, not to decorate the page."
    ]
  },
  openSource: {
    eyebrow: "Open Source Direction",
    title: "Software can travel; taxpayer data should not",
    paragraphs: [
      "GES is intended to become an open-source platform. The software patterns, publication architecture, and public-facing components should be portable enough for other counties, assessors, organizations, and contributors to study or reuse.",
      "That portability does not change data ownership. Individual counties retain control of their own records, systems, policies, and taxpayer information. GES shares software and publication structure, not taxpayer data."
    ]
  },
  future: {
    eyebrow: "Future Vision",
    title: "Where the platform is heading",
    paragraphs: [
      "The public platform will keep expanding from articles into useful public tools while preserving the same layout-first architecture."
    ],
    bullets: [
      "Educational articles, guides, and long-form explainers.",
      "Interactive assessment tools and calculators.",
      "Public assessment calendars, research, and source provenance.",
      "Assessor workspace patterns for internal review and publication workflows.",
      "Open-source deployment paths for county adoption."
    ]
  }
});

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

function bulletList(items = []) {
  if (!items.length) return "";
  return `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderSectionNav(label, sections) {
  return `
    <nav class="ges-public-section-nav" aria-label="${escapeHtml(label)}">
      ${sections.map(section => `
        <a href="#${escapeHtml(section.id)}">${escapeHtml(section.label)}</a>
      `).join("")}
    </nav>
  `;
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

function renderAboutContentSection({ id, eyebrow, title, paragraphs = [], bullets = [] }) {
  return `
    <section id="${escapeHtml(id)}" class="ges-public-page__section">
      <p class="ges-public-page-hero__eyebrow">${escapeHtml(eyebrow)}</p>
      <h2>${escapeHtml(title)}</h2>
      ${paragraphList(paragraphs)}
      ${bulletList(bullets)}
    </section>
  `;
}

function renderAboutAuthorSection() {
  return `
    <section id="about-author" class="ges-public-page__section">
      <p class="ges-public-page-hero__eyebrow">Author Profile</p>
      <h2>About the author</h2>
      <div class="ges-public-author-profile">
        <img src="assets/images/articles/max-quattromani-author.jpg" alt="" loading="lazy" decoding="async" />
        <div class="ges-public-author-profile__body">
          <p><strong>Max Quattromani</strong> authors Guided Parcel Review and the public GES articles. Published GES article metadata identifies him as Certified in Nebraska Property Assessment.</p>
          <p>The technical work in this repository reflects an interest in public tools, structured civic information, static publishing, and clearer interfaces around assessment material. The author profile stays intentionally concise because the public platform is the focus.</p>
          <p>The work is guided by a practical public-administration goal: make assessment information easier to understand, easier to verify, and easier to discuss with official sources.</p>
        </div>
      </div>
    </section>
  `;
}

function renderAboutPage() {
  const page = PUBLIC_PAGE_COPY.about;
  return `
    <article class="ges-public-page ges-public-page--about" aria-labelledby="publicPageTitle">
      <div class="ges-public-page__body">
        <p class="ges-public-page__intro">${escapeHtml(page.intro)}</p>
        ${renderSectionNav("About page sections", ABOUT_SECTION_NAV)}
        <div class="ges-public-page__sections">
          ${renderAboutContentSection({ id: "mission", ...ABOUT_SECTIONS.mission })}
          ${renderAboutAuthorSection()}
          ${renderAboutContentSection({ id: "why-ges-exists", ...ABOUT_SECTIONS.why })}
          ${renderAboutContentSection({ id: "project-philosophy", ...ABOUT_SECTIONS.philosophy })}
          ${renderAboutContentSection({ id: "open-source", ...ABOUT_SECTIONS.openSource })}
          ${renderAboutContentSection({ id: "future-vision", ...ABOUT_SECTIONS.future })}
        </div>
      </div>
    </article>
  `;
}

function renderAdministrativePage() {
  return `
    <article class="ges-public-page ges-public-page--administrative" aria-labelledby="publicPageTitle">
      <div class="ges-public-page__body">
        <p class="ges-public-page__intro">${escapeHtml(PUBLIC_PAGE_COPY.administrative.intro)}</p>
        ${renderSectionNav("Administrative sections", ADMINISTRATIVE_SECTIONS)}
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

  let bodyHtml = renderPlaceholderPage(page);
  if (pageId === "administrative") bodyHtml = renderAdministrativePage();
  if (pageId === "about") bodyHtml = renderAboutPage();
  shell.setBody(bodyHtml);

  return true;
}
