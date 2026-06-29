import {
  hasInternalMenuPermission,
  INTERNAL_OWNER_PERSON,
  INTERNAL_PERMISSION_PARAM_NAME
} from "./internal-permissions.js?v=befd9ce";

export const INTERNAL_TRACKING_PARAM = Object.freeze({
  name: INTERNAL_PERMISSION_PARAM_NAME,
  value: INTERNAL_OWNER_PERSON
});

export const TRACKING_CONTEXT_PARAM_NAMES = Object.freeze([
  "property",
  "view",
  "orientation",
  "developmentFeature",
  "invite",
  "gpr_track",
  "gpr_person",
  "gpr_label",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term"
]);

export const INTERNAL_PROJECT_NAV_SECTIONS = Object.freeze([
  {
    title: "Parcel Review",
    links: [
      {
        label: "Project home",
        href: "home/"
      },
      {
        label: "Guided Parcel Review main guide",
        href: "index.html"
      },
      {
        label: "Loaded property invite index",
        href: "index.html?experiment=property-invite-index"
      },
      {
        label: "BOE protest tracker",
        href: "boe-tracker/"
      }
    ]
  },
  {
    title: "Articles",
    links: [
      {
        label: "Article roll",
        href: "articles/"
      },
      {
        label: "Before You Walk Into a Property Protest",
        href: "articles/before-you-walk-into-a-property-protest/"
      },
      {
        label: "Assessment Up. Protest Denied. Taxes?",
        href: "articles/assessment-up-protest-denied-taxes/"
      }
    ]
  },
  {
    title: "Explainers + Calculators",
    links: [
      {
        label: "Levy compression explainer",
        href: "index.html?article=levy-compression"
      },
      {
        label: "Levy compression calculator",
        href: "index.html?article=levy-compression#calculatorTitle"
      },
      {
        label: "Tax shorthand walkthrough",
        href: "index.html?experiment=tax-shorthand"
      }
    ]
  },
  {
    title: "Experiments",
    links: [
      {
        label: "Experiment index",
        href: "index.html?experiment=index"
      },
      {
        label: "Grant Street side-by-side comparison",
        href: "index.html?experiment=grant-neighbor-comps"
      },
      {
        label: "1301 S 5th comparable sales",
        href: "index.html?experiment=1301-s-5th-comps"
      },
      {
        label: "Ames Highway 77 comparable sales",
        href: "index.html?experiment=ames-highway-77-comps"
      },
      {
        label: "Beekman Country Club comparable sales",
        href: "index.html?experiment=beekman-country-club-comps"
      },
      {
        label: "1722 Washington comparable sales",
        href: "index.html?experiment=1722-washington-comps"
      },
      {
        label: "Valuation group overview",
        href: "experiments/valuation-group-overview.html"
      },
      {
        label: "Valuation group aggregate lab",
        href: "experiments/vg-aggregate.html"
      }
    ]
  },
  {
    title: "Design System + Patterns",
    links: [
      {
        label: "GES pattern library",
        href: "ges/"
      }
    ]
  }
]);

const PROJECT_REPOSITORY_PATH = "/Guided-Parcel-Review/";
const PROJECT_NAV_ID_PREFIX = "gesProjectNav";
const TRACKING_LINK_ENHANCER_KEY = "__gprTrackingLinkEnhancerInstalled";
const NON_PAGE_EXTENSIONS = new Set([
  ".aac",
  ".avif",
  ".csv",
  ".css",
  ".doc",
  ".docx",
  ".gif",
  ".ico",
  ".ics",
  ".jpeg",
  ".jpg",
  ".js",
  ".json",
  ".m4a",
  ".mov",
  ".mp3",
  ".mp4",
  ".pdf",
  ".png",
  ".svg",
  ".tsv",
  ".txt",
  ".webmanifest",
  ".webp",
  ".xls",
  ".xlsx",
  ".zip"
]);

let navIdSequence = 0;

function currentLocationHref() {
  return typeof window !== "undefined" && window.location?.href
    ? window.location.href
    : "https://quattromani.github.io/Guided-Parcel-Review/";
}

function currentBaseHref() {
  return typeof document !== "undefined" && document.baseURI
    ? document.baseURI
    : currentLocationHref();
}

function parseUrl(value, base = currentBaseHref()) {
  try {
    return new URL(value, base);
  } catch {
    return null;
  }
}

function searchParamsFrom(source = currentLocationHref()) {
  if (source instanceof URLSearchParams) return source;
  if (source instanceof URL) return source.searchParams;
  if (source?.search instanceof URLSearchParams) return source.search;
  if (typeof source?.search === "string") return new URLSearchParams(source.search);
  const parsed = parseUrl(`${source || currentLocationHref()}`, currentBaseHref());
  return parsed?.searchParams ?? new URLSearchParams();
}

function protocolFromRawUrl(url = "") {
  return `${url}`.trim().match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase() ?? "";
}

function pathExtension(pathname = "") {
  const lastSegment = pathname.split("/").pop() || "";
  const dotIndex = lastSegment.lastIndexOf(".");
  return dotIndex > -1 ? lastSegment.slice(dotIndex).toLowerCase() : "";
}

function projectBasePath(locationUrl) {
  const pathname = locationUrl.pathname.endsWith("/")
    ? locationUrl.pathname
    : `${locationUrl.pathname}/`;
  const index = pathname.indexOf(PROJECT_REPOSITORY_PATH);

  return index >= 0
    ? pathname.slice(0, index + PROJECT_REPOSITORY_PATH.length)
    : "/";
}

function isPageLikeUrl(url) {
  const extension = pathExtension(url.pathname);
  return !NON_PAGE_EXTENSIONS.has(extension);
}

function trackingContextFrom(source = currentLocationHref()) {
  const params = searchParamsFrom(source);
  return TRACKING_CONTEXT_PARAM_NAMES
    .map(name => [name, params.get(name)])
    .filter(([, value]) => value);
}

function escapeHtml(value = "") {
  return `${value}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatProjectHref(url, locationUrl) {
  const projectBase = projectBasePath(locationUrl);
  if (url.origin !== locationUrl.origin || !url.pathname.startsWith(projectBase)) {
    return url.href;
  }

  const relativePath = url.pathname.slice(projectBase.length) || "index.html";
  return `${projectBase}${relativePath}${url.search}${url.hash}`;
}

function projectRootHref(value) {
  const locationUrl = parseUrl(currentLocationHref());
  if (!locationUrl) return value;

  const projectBaseUrl = new URL(projectBasePath(locationUrl), locationUrl.origin);
  const targetUrl = parseUrl(value, projectBaseUrl.href);
  if (!targetUrl) return value;

  return formatProjectHref(targetUrl, locationUrl);
}

export function hasInternalTrackingParam(source = currentLocationHref()) {
  return hasInternalMenuPermission(source);
}

export function isInternalProjectUrl(url, options = {}) {
  const rawUrl = `${url ?? ""}`.trim();
  if (!rawUrl) return false;

  const explicitProtocol = protocolFromRawUrl(rawUrl);
  if (explicitProtocol && explicitProtocol !== "http" && explicitProtocol !== "https") {
    return false;
  }

  const locationUrl = parseUrl(options.currentUrl || currentLocationHref(), currentBaseHref());
  const targetUrl = parseUrl(rawUrl, options.baseUrl || currentBaseHref());
  if (!locationUrl || !targetUrl) return false;
  if (targetUrl.origin !== locationUrl.origin) return false;
  if (!targetUrl.pathname.startsWith(projectBasePath(locationUrl))) return false;

  return isPageLikeUrl(targetUrl);
}

export function appendTrackingParam(url, options = {}) {
  if (`${url ?? ""}`.trim().startsWith("#")) return url;
  if (!isInternalProjectUrl(url, options)) return url;

  const locationHref = options.currentUrl || currentLocationHref();
  const locationUrl = parseUrl(locationHref, currentBaseHref());
  const targetUrl = parseUrl(url, options.baseUrl || currentBaseHref());
  if (!locationUrl || !targetUrl) return url;

  trackingContextFrom(locationHref).forEach(([name, value]) => {
    if (targetUrl.searchParams.get(name) !== value) {
      targetUrl.searchParams.set(name, value);
    }
  });

  return options.absolute ? targetUrl.href : formatProjectHref(targetUrl, locationUrl);
}

export function enhanceInternalNavLinks(container, options = {}) {
  if (!container) return;

  const links = [
    ...(container.matches?.("a[href]") ? [container] : []),
    ...(container.querySelectorAll ? [...container.querySelectorAll("a[href]")] : [])
  ];

  links.forEach(link => {
    if (link.hasAttribute("download")) return;
    const href = link.getAttribute("href");
    if (!href) return;
    link.setAttribute("href", appendTrackingParam(href, options));
  });
}

function enhanceLinkElement(link, options = {}) {
  if (!link || link.hasAttribute("download")) return;
  const href = link.getAttribute("href");
  if (!href) return;
  link.setAttribute("href", appendTrackingParam(href, options));
}

export function installTrackingContextLinkEnhancer(container = document, options = {}) {
  if (!container || container[TRACKING_LINK_ENHANCER_KEY]) return;
  container[TRACKING_LINK_ENHANCER_KEY] = true;
  enhanceInternalNavLinks(container, options);

  container.addEventListener?.("click", event => {
    const link = event.target?.closest?.("a[href]");
    if (!link || !container.contains?.(link)) return;
    enhanceLinkElement(link, options);
  }, true);

  const ownerWindow = container.defaultView || container.ownerDocument?.defaultView;
  const MutationObserverCtor = ownerWindow?.MutationObserver;
  if (!MutationObserverCtor || !container.querySelectorAll) return;

  const observer = new MutationObserverCtor(records => {
    records.forEach(record => {
      record.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        enhanceInternalNavLinks(node, options);
      });
    });
  });

  observer.observe(container.body || container, {
    childList: true,
    subtree: true
  });
}

function defaultHouseMarkMarkup() {
  const logoHref = projectRootHref("assets/brand/civic-house-mark.svg");

  return `
    <span class="hero-brand-mark ges-project-nav__mark" aria-hidden="true">
      <img class="hero-brand-mark__image hero-brand-mark__image--light" src="${escapeHtml(logoHref)}" alt="" width="28" height="28" decoding="async" />
      <img class="hero-brand-mark__image hero-brand-mark__image--dark" src="${escapeHtml(logoHref)}" alt="" width="28" height="28" decoding="async" />
      <span class="ges-project-nav__close-mark" aria-hidden="true">
        <span class="ges-project-nav__close-stroke ges-project-nav__close-stroke--a"></span>
        <span class="ges-project-nav__close-stroke ges-project-nav__close-stroke--b"></span>
      </span>
    </span>
  `;
}

function linkCountLabel(count) {
  return `${count} ${count === 1 ? "link" : "links"}`;
}

function projectNavMenuMarkup(menuId) {
  return INTERNAL_PROJECT_NAV_SECTIONS.map((section, index) => {
    const drawerId = `${menuId}-drawer-${index + 1}`;
    const triggerId = `${drawerId}-trigger`;
    const open = index === 0;

    return `
    <span class="ges-project-nav__section" data-ges-project-nav-drawer>
      <button type="button" id="${triggerId}" class="ges-project-nav__drawer-trigger" data-ges-project-nav-drawer-trigger aria-expanded="${open ? "true" : "false"}" aria-controls="${drawerId}">
        <span class="ges-project-nav__drawer-title">${escapeHtml(section.title)}</span>
        <span class="ges-project-nav__drawer-meta">${escapeHtml(linkCountLabel(section.links.length))}</span>
        <span class="ges-project-nav__drawer-icon" aria-hidden="true"></span>
      </button>
      <span id="${drawerId}" class="ges-project-nav__drawer-panel" role="group" aria-labelledby="${triggerId}" aria-hidden="${open ? "false" : "true"}"${open ? " data-open" : ""}>
        <span class="ges-project-nav__link-stack">
        ${section.links.map(link => `
          <a class="ges-project-nav__link" href="${escapeHtml(projectRootHref(link.href))}">${escapeHtml(link.label)}</a>
        `).join("")}
        </span>
      </span>
    </span>
  `;
  }).join("");
}

function closeProjectNav(nav) {
  const trigger = nav.querySelector(".ges-project-nav__trigger");
  const menu = nav.querySelector(".ges-project-nav__menu");
  if (!trigger || !menu) return;

  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-label", "Open Guided Parcel Review project navigation");
  menu.hidden = true;
}

function openProjectNav(nav) {
  const trigger = nav.querySelector(".ges-project-nav__trigger");
  const menu = nav.querySelector(".ges-project-nav__menu");
  if (!trigger || !menu) return;

  document.querySelectorAll(".ges-project-nav").forEach(candidate => {
    if (candidate !== nav) closeProjectNav(candidate);
  });

  trigger.setAttribute("aria-expanded", "true");
  trigger.setAttribute("aria-label", "Close Guided Parcel Review project navigation");
  menu.hidden = false;
}

function toggleProjectNav(nav) {
  const trigger = nav.querySelector(".ges-project-nav__trigger");
  if (trigger?.getAttribute("aria-expanded") === "true") {
    closeProjectNav(nav);
  } else {
    openProjectNav(nav);
  }
}

function setDrawerLinksTabbable(panel, tabbable) {
  panel.querySelectorAll("a[href]").forEach(link => {
    if (tabbable) {
      link.removeAttribute("tabindex");
    } else {
      link.setAttribute("tabindex", "-1");
    }
  });
}

function setProjectNavDrawerOpen(drawer, open) {
  const trigger = drawer.querySelector("[data-ges-project-nav-drawer-trigger]");
  const panel = drawer.querySelector(".ges-project-nav__drawer-panel");
  if (!trigger || !panel) return;

  trigger.setAttribute("aria-expanded", open ? "true" : "false");
  panel.toggleAttribute("data-open", open);
  panel.setAttribute("aria-hidden", open ? "false" : "true");
  setDrawerLinksTabbable(panel, open);
}

function drawerList(nav) {
  return [...nav.querySelectorAll("[data-ges-project-nav-drawer]")];
}

function toggleProjectNavDrawer(nav, trigger) {
  const drawer = trigger.closest("[data-ges-project-nav-drawer]");
  if (!drawer) return;
  const nextOpen = trigger.getAttribute("aria-expanded") !== "true";

  drawerList(nav).forEach(candidate => {
    setProjectNavDrawerOpen(candidate, candidate === drawer ? nextOpen : false);
  });
}

function initProjectNavDrawers(nav) {
  drawerList(nav).forEach((drawer, index) => {
    setProjectNavDrawerOpen(drawer, index === 0);
  });
}

function installProjectNavBehavior(nav) {
  const trigger = nav.querySelector(".ges-project-nav__trigger");
  const menu = nav.querySelector(".ges-project-nav__menu");
  if (!trigger || !menu) return;

  trigger.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    toggleProjectNav(nav);
  });

  menu.addEventListener("click", event => {
    const drawerTrigger = event.target.closest("[data-ges-project-nav-drawer-trigger]");
    if (drawerTrigger) {
      event.preventDefault();
      toggleProjectNavDrawer(nav, drawerTrigger);
      return;
    }

    if (event.target.closest("a[href]")) closeProjectNav(nav);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeProjectNav(nav);
  });

  document.addEventListener("click", event => {
    if (!nav.contains(event.target)) closeProjectNav(nav);
  });
}

export function buildProjectNav({
  triggerMarkup = defaultHouseMarkMarkup(),
  triggerClass = "",
  standalone = false
} = {}) {
  const wrapper = document.createElement("span");
  const menuId = `${PROJECT_NAV_ID_PREFIX}-${++navIdSequence}`;
  wrapper.className = ["ges-project-nav", standalone ? "ges-project-nav--standalone" : ""].filter(Boolean).join(" ");
  wrapper.dataset.gesProjectNavInstance = "";

  wrapper.innerHTML = `
    <button type="button" class="ges-project-nav__trigger ${escapeHtml(triggerClass)}" aria-label="Open Guided Parcel Review project navigation" aria-haspopup="true" aria-expanded="false" aria-controls="${menuId}">
      ${triggerMarkup}
    </button>
    <span id="${menuId}" class="ges-project-nav__menu" role="navigation" aria-label="Guided Parcel Review project navigation" hidden>
      ${projectNavMenuMarkup(menuId)}
    </span>
  `;

  enhanceInternalNavLinks(wrapper);
  initProjectNavDrawers(wrapper);
  installProjectNavBehavior(wrapper);
  return wrapper;
}
