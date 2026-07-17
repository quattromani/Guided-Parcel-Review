import {
  DOCUMENT_REGISTRY,
  DOCUMENTS_ROUTE,
  documentBySlug
} from "../content/documents.js?v=20260710-documents-library-1";
import { renderArticleMasthead } from "../ges/article-components.js?v=20260709-article-lockdown-1";
import { hasInternalToolPermission } from "../ges/internal-permissions.js?v=20260701-article-polish-4";
import {
  appendTrackingParam,
  projectRootHref
} from "../ges/project-nav.js?v=20260710-documents-library-1";
import { createGesInternalShell } from "../ges/shell.js?v=20260709-article-lockdown-1";
import { escapeHtml } from "../utils/html.js?v=20260701-article-polish-4";

function normalizedPathname() {
  return window.location.pathname.endsWith("/")
    ? window.location.pathname
    : `${window.location.pathname}/`;
}

function documentSlugFromPath() {
  const pathname = normalizedPathname();
  const marker = `/${DOCUMENTS_ROUTE}`;
  const markerIndex = pathname.lastIndexOf(marker);
  if (markerIndex < 0) return "";

  return pathname
    .slice(markerIndex + marker.length)
    .replace(/\/$/, "")
    .split("/")
    .filter(Boolean)
    .at(0) ?? "";
}

function formatDate(value = "") {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric"
  }).format(date);
}

function setDocumentPageTitle(title = "Documents") {
  document.title = `${title} | Guided Parcel Review`;
}

function documentHref(document = {}) {
  return appendTrackingParam(projectRootHref(`${DOCUMENTS_ROUTE}${document.slug}/`));
}

function documentsHref() {
  return appendTrackingParam(projectRootHref(DOCUMENTS_ROUTE));
}

function createDocumentsShell({ pageType, routeName } = {}) {
  return createGesInternalShell({
    hideAppChrome: true,
    htmlClasses: ["article-shell-route", "ges-public-page-route"],
    mainClasses: ["ges-public-main"],
    pageType,
    routeName,
    shell: "documents"
  });
}

function renderDocumentMetadata(document = {}) {
  const entries = [
    document.status ? `Status: ${document.status}` : "",
    document.version ? `Version: ${document.version}` : "",
    document.updatedAt ? `Updated: ${formatDate(document.updatedAt)}` : "",
    document.reviewAt ? `Review: ${formatDate(document.reviewAt)}` : "",
    document.audience ? `Audience: ${document.audience}` : "",
    document.secondaryAudience ? `Secondary audiences: ${document.secondaryAudience}` : ""
  ].filter(Boolean);

  if (!entries.length) return "";

  return `
    <div class="article-publication-meta" aria-label="Document metadata">
      ${entries.map(entry => `<p>${escapeHtml(entry)}</p>`).join("")}
    </div>
  `;
}

function renderAccessNotice(shell, { title = "Documents" } = {}) {
  setDocumentPageTitle(title);
  shell.setCover(renderArticleMasthead({
    label: "Documents",
    subtitle: "This public static build does not deliver private office documents.",
    title,
    titleId: "documentsTitle"
  }));
  shell.setBody(`
    <article class="ges-public-page" aria-labelledby="documentsTitle">
      <div class="ges-public-page__body">
        <section class="ges-public-page__notice" aria-label="Document access notice">
          <p class="ges-public-page-hero__eyebrow">Private source boundary</p>
          <p>Private institutional documents are not bundled into Guided Parcel Review. This route is a navigation scaffold only until an authenticated document delivery service is available.</p>
        </section>
      </div>
    </article>
  `);
}

function renderDocumentRegistration(document = {}) {
  const metadata = [
    document.status,
    document.version,
    document.updatedAt ? `Updated ${formatDate(document.updatedAt)}` : "",
    document.reviewAt ? `Review ${formatDate(document.reviewAt)}` : "",
    document.audience ? `For ${document.audience}` : "",
    document.secondaryAudience ? `Also for ${document.secondaryAudience}` : ""
  ].filter(Boolean).join(" · ");

  return `
    <li class="ges-resource-entry" data-document-id="${escapeHtml(document.id)}">
      <p class="ges-resource-entry__type">${escapeHtml(document.family)}</p>
      <div class="ges-resource-entry__body">
        <p class="ges-resource-entry__title"><a href="${escapeHtml(documentHref(document))}">${escapeHtml(document.title)}</a></p>
        ${metadata ? `<p class="ges-resource-entry__meta">${escapeHtml(metadata)}</p>` : ""}
        <p class="ges-resource-entry__description">${escapeHtml(document.summary)}</p>
      </div>
    </li>
  `;
}

export function isDocumentsIndexRequest() {
  return normalizedPathname().endsWith(`/${DOCUMENTS_ROUTE}`);
}

export function isDocumentRequest() {
  return Boolean(documentSlugFromPath());
}

export function renderDocumentsIndex() {
  const shell = createDocumentsShell({
    pageType: "documents-index",
    routeName: "documents-index"
  });
  if (!shell?.coverRegion) return false;

  if (!hasInternalToolPermission()) {
    renderAccessNotice(shell);
    return true;
  }

  setDocumentPageTitle("Documents");
  shell.setCover(renderArticleMasthead({
    label: "Documents",
    subtitle: "Approved document registrations for repeated internal consultation. Private source content remains outside this static application.",
    title: "Documents",
    titleId: "documentsTitle"
  }));
  shell.setBody(`
    <article class="ges-public-page" aria-labelledby="documentsTitle">
      <div class="ges-public-page__body">
        <section class="ges-public-page__notice" aria-label="Document source boundary">
          <p class="ges-public-page-hero__eyebrow">Controlled viewer scaffold</p>
          <p>Only approved rendered artifacts may appear here after authenticated delivery is available. The editable Knowledge System source is not present in this repository or browser build.</p>
        </section>
        <section class="ges-resources-block ges-administrative-reference" aria-labelledby="documentsLibraryTitle">
          <div class="ges-resources-block__inner">
            <header class="ges-resources-block__header">
              <p class="guided-kicker">Library</p>
              <h2 id="documentsLibraryTitle">Registered documents</h2>
              <p>Document registrations show purpose, current status, and release readiness without copying private source material.</p>
            </header>
            <ul class="ges-resource-list" aria-label="Registered documents">
              ${DOCUMENT_REGISTRY.map(renderDocumentRegistration).join("")}
            </ul>
          </div>
        </section>
      </div>
    </article>
  `);

  return true;
}

export function renderDocument() {
  const slug = documentSlugFromPath();
  const document = documentBySlug(slug);
  const shell = createDocumentsShell({
    pageType: "document",
    routeName: slug || "document"
  });
  if (!shell?.coverRegion) return false;

  if (!hasInternalToolPermission()) {
    renderAccessNotice(shell, { title: "Documents" });
    return true;
  }

  if (!document) {
    renderAccessNotice(shell, { title: "Document not registered" });
    return true;
  }

  setDocumentPageTitle(document.title);
  shell.setCover(renderArticleMasthead({
    label: "Document",
    subject: document.family,
    subtitle: document.summary,
    title: document.title,
    titleId: "documentTitle"
  }));
  shell.setBody(`
    <article class="ges-public-page" aria-labelledby="documentTitle">
      <div class="ges-public-page__body">
        ${renderDocumentMetadata(document)}
        <section class="ges-public-page__notice" aria-label="Document release status">
          <p class="ges-public-page-hero__eyebrow">Release status</p>
          <p>This registration has no approved rendered artifact in Guided Parcel Review. The private source remains in the Knowledge System repository and will not be fetched or bundled by this static site.</p>
          ${document.sourceReference ? `<p>${escapeHtml(document.sourceReference)}</p>` : ""}
        </section>
        <p><a href="${escapeHtml(documentsHref())}">Back to Documents</a></p>
      </div>
    </article>
  `);

  return true;
}
