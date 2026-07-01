import {
  loadPropertySwitcherRecords,
  PROPERTY_SELECTION_STORAGE_KEY
} from "../data-service.js?v=befd9ce";
import { hasInternalToolPermission } from "./internal-permissions.js?v=befd9ce";

const FIELD_KIT_ROOT_ID = "gesFieldKit";
const FIELD_KIT_MOUNTED_KEY = "__gesFieldKitMounted";
const FIELD_KIT_NOTES_KEY = "guidedParcelReview.internalFieldKit.notes.v1";
const FIELD_KIT_SEARCH_LIMIT = 10;

const COMPONENT_INSPECTOR_TARGETS = Object.freeze([
  ["Article Cover", ".article-hero"],
  ["Article Cover Packet", ".article-hero-packet"],
  ["Article Metadata", ".article-entry-panel"],
  ["Format Controls", ".guide-utility"],
  ["Margin Insight", ".ges-margin-insight"],
  ["Decision Tree", ".decision-panel"],
  ["Evidence Translation Matrix", ".evidence-matrix"],
  ["Evidence Matrix Header", ".evidence-matrix-header"],
  ["Process Strip", ".process-strip"],
  ["Resource Panel", ".ges-resource-panel, .resource-section"],
  ["Practical Note", ".ges-practical-note, .note-box"],
  ["Continuation Module", ".continuation-module"],
  ["Evidence Source", ".ges-evidence-source, .article-source-note"],
  ["Stat Grid", ".ges-stat-grid"],
  ["Assessment Build Panel", ".assessment-build-panel"],
  ["Case Timeline", ".ges-case-timeline, .protest-paradox-timeline-card"]
]);

const fieldKitState = {
  activePanel: "",
  propertyRows: null,
  propertyRowsPromise: null,
  ownerHydrationStarted: false,
  searchActiveIndex: -1,
  searchVisibleRows: []
};

function escapeHtml(value = "") {
  return `${value}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeSearch(value = "") {
  return `${value ?? ""}`.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function compactSitus(value = "") {
  return `${value ?? ""}`.trim().replace(/^0+(?=\d)/, "") || "Situs not listed";
}

function ownerFromManifestLabel(value = "") {
  const label = `${value ?? ""}`.replace(/\s+property$/i, "").trim();
  if (!label || /^(residential|agricultural|commercial|industrial|mixed|southern|northern)\b/i.test(label)) return "";
  if (/gworks record|sample|property$/i.test(label)) return "";
  return label;
}

function stripLeadingZeroes(value = "") {
  return `${value ?? ""}`.replace(/^0+(?=\d)/, "");
}

function rowSearchText(row) {
  return normalizeSearch([
    row.situs,
    row.owner,
    row.ownerLastName,
    row.parcelId,
    stripLeadingZeroes(row.parcelId),
    row.id,
    stripLeadingZeroes(row.id),
    row.propertyClass
  ].filter(Boolean).join(" "));
}

function ownerLastName(owner = "") {
  const normalized = `${owner ?? ""}`.trim();
  if (!normalized) return "";
  const firstOwner = normalized.split(/\s*&\s*|\s+AND\s+/i)[0].trim();
  if (firstOwner.includes(",")) return firstOwner.split(",")[0].trim();
  return firstOwner.split(/\s+/).at(-1) || "";
}

function propertyClassLabel(value = "") {
  const normalized = `${value ?? ""}`.trim().toLowerCase();
  if (normalized.includes("ag") || normalized.includes("farm")) return "Farm/Ag";
  if (normalized.includes("comm")) return "Commercial";
  if (normalized.includes("industrial")) return "Industrial";
  if (normalized.includes("res")) return "Residential";
  return value || "Property";
}

function iconSvg(name) {
  const common = 'viewBox="0 0 24 24" aria-hidden="true" focusable="false"';
  if (name === "search") {
    return `<svg ${common}><circle cx="11" cy="11" r="6"></circle><path d="m16 16 4 4"></path></svg>`;
  }
  if (name === "link") {
    return `<svg ${common}><path d="M10 13a5 5 0 0 0 7.1 0l1.4-1.4a5 5 0 0 0-7.1-7.1L10.5 5"></path><path d="M14 11a5 5 0 0 0-7.1 0l-1.4 1.4a5 5 0 0 0 7.1 7.1l.9-.9"></path></svg>`;
  }
  if (name === "clipboard") {
    return `<svg ${common}><path d="M9 4h6"></path><path d="M9 4a3 3 0 0 0 6 0"></path><path d="M8 6H6.8A1.8 1.8 0 0 0 5 7.8v10.4A1.8 1.8 0 0 0 6.8 20h10.4a1.8 1.8 0 0 0 1.8-1.8V7.8A1.8 1.8 0 0 0 17.2 6H16"></path><path d="M8.5 12h7"></path><path d="M8.5 16h5"></path></svg>`;
  }
  if (name === "layers") {
    return `<svg ${common}><path d="m12 3 8 4.5-8 4.5-8-4.5Z"></path><path d="m4 12 8 4.5 8-4.5"></path><path d="m4 16.5 8 4.5 8-4.5"></path></svg>`;
  }
  if (name === "copy") {
    return `<svg ${common}><rect x="9" y="9" width="10" height="10" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"></path></svg>`;
  }
  if (name === "share") {
    return `<svg ${common}><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.7 10.7 6.6-4.4"></path><path d="m8.7 13.3 6.6 4.4"></path></svg>`;
  }
  return "";
}

function buttonMarkup(tool) {
  const controls = tool.panel ? ` aria-expanded="false" aria-controls="gesFieldKitPanel-${tool.id}"` : "";
  const pressed = tool.toggle ? ' aria-pressed="false"' : "";
  return `
    <button type="button" class="ges-field-kit__button" data-ges-field-kit-tool="${tool.id}" aria-label="${escapeHtml(tool.label)}"${controls}${pressed}>
      ${iconSvg(tool.icon)}
      <span class="ges-field-kit__tooltip" role="tooltip">${escapeHtml(tool.label)}</span>
    </button>
  `;
}

function panelMarkup(id, title, body) {
  return `
    <section id="gesFieldKitPanel-${id}" class="ges-field-kit__panel" data-ges-field-kit-panel="${id}" role="dialog" aria-label="${escapeHtml(title)}" hidden>
      ${body}
    </section>
  `;
}

function shellMarkup() {
  const tools = [
    { id: "parcel-search", label: "Parcel Search", icon: "search", panel: true },
    { id: "share", label: "Share Tracked Link", icon: "link", panel: true },
    { id: "notes", label: "Quick Notes", icon: "clipboard", panel: true },
    { id: "inspector", label: "Component Inspector", icon: "layers", toggle: true }
  ];

  return `
    <div id="${FIELD_KIT_ROOT_ID}" class="ges-field-kit-shell" data-ges-field-kit-root>
      <div class="ges-field-kit__panels">
        ${panelMarkup("parcel-search", "Parcel search", `
          <div class="ges-field-kit__panel-heading">
            <p>Parcel Search</p>
          </div>
          <label class="ges-field-kit__field">
            <span class="ges-field-kit__field-label">Search loaded parcels</span>
            <input type="search" class="ges-field-kit__input" data-field-kit-search-input role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="gesFieldKitParcelResults" autocomplete="off" spellcheck="false" placeholder="Owner or property address" />
          </label>
          <div id="gesFieldKitParcelResults" class="ges-field-kit__results" data-field-kit-search-results role="listbox" hidden></div>
          <p class="ges-field-kit__status" data-field-kit-search-status aria-live="polite">Search loaded records by owner or address.</p>
        `)}
        ${panelMarkup("share", "Share tracked link", `
          <div class="ges-field-kit__panel-heading">
            <p>Share / Tracked Link</p>
          </div>
          <label class="ges-field-kit__field">
            <span class="ges-field-kit__field-label">Current URL</span>
            <input type="url" class="ges-field-kit__input ges-field-kit__share-url" data-field-kit-share-url readonly />
          </label>
          <div class="ges-field-kit__actions">
            <button type="button" class="ges-field-kit__action" data-field-kit-copy-link>${iconSvg("copy")}<span>Copy link</span></button>
            <button type="button" class="ges-field-kit__action" data-field-kit-native-share hidden>${iconSvg("share")}<span>Share</span></button>
          </div>
          <p class="ges-field-kit__status" data-field-kit-share-status aria-live="polite">Preserves the current tracking identity.</p>
        `)}
        ${panelMarkup("notes", "Quick notes", `
          <div class="ges-field-kit__panel-heading">
            <p>Quick Notes</p>
          </div>
          <label class="ges-field-kit__field">
            <span class="ges-field-kit__field-label">Scratchpad</span>
            <textarea class="ges-field-kit__textarea" data-field-kit-notes rows="7" placeholder="Capture quick observations..."></textarea>
          </label>
          <div class="ges-field-kit__actions">
            <button type="button" class="ges-field-kit__action" data-field-kit-clear-notes><span>Clear notes</span></button>
          </div>
          <p class="ges-field-kit__status" data-field-kit-notes-status aria-live="polite">Autosaved locally on this device.</p>
        `)}
      </div>
      <div class="ges-field-kit" role="toolbar" aria-label="GES field kit">
        ${tools.map(buttonMarkup).join("")}
      </div>
    </div>
  `;
}

function safeStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.append(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

function closeFieldKitPanel(root) {
  fieldKitState.activePanel = "";
  root.querySelectorAll("[data-ges-field-kit-panel]").forEach(panel => {
    panel.hidden = true;
  });
  root.querySelectorAll("[data-ges-field-kit-tool][aria-expanded]").forEach(button => {
    button.setAttribute("aria-expanded", "false");
  });
}

function openFieldKitPanel(root, panelId) {
  fieldKitState.activePanel = panelId;
  root.querySelectorAll("[data-ges-field-kit-panel]").forEach(panel => {
    panel.hidden = panel.dataset.gesFieldKitPanel !== panelId;
  });
  root.querySelectorAll("[data-ges-field-kit-tool][aria-expanded]").forEach(button => {
    button.setAttribute("aria-expanded", button.dataset.gesFieldKitTool === panelId ? "true" : "false");
  });

  if (panelId === "parcel-search") {
    initParcelSearchPanel(root);
    window.setTimeout(() => root.querySelector("[data-field-kit-search-input]")?.focus(), 0);
  }
  if (panelId === "share") {
    updateSharePanel(root);
    window.setTimeout(() => root.querySelector("[data-field-kit-share-url]")?.select(), 0);
  }
  if (panelId === "notes") {
    window.setTimeout(() => root.querySelector("[data-field-kit-notes]")?.focus(), 0);
  }
}

function toggleFieldKitPanel(root, panelId) {
  if (fieldKitState.activePanel === panelId) {
    closeFieldKitPanel(root);
  } else {
    openFieldKitPanel(root, panelId);
  }
}

function propertyRowsFromContext(context = {}) {
  return (context.records || [])
    .map(item => item.property)
    .filter(property => property?.id && property.recordCardStatus === "available" && property.recordCardPath)
    .map(property => {
      const owner = property.owner || ownerFromManifestLabel(property.label);
      const row = {
        id: property.id,
        parcelId: property.parcelId || "",
        situs: compactSitus(property.situsAddress),
        owner,
        ownerLastName: ownerLastName(owner),
        propertyClass: propertyClassLabel(property.propertyClass),
        recordCardPath: property.recordCardPath
      };
      row.searchText = rowSearchText(row);
      return row;
    })
    .sort((left, right) => left.situs.localeCompare(right.situs, undefined, {
      numeric: true,
      sensitivity: "base"
    }));
}

async function loadFieldKitRows(root) {
  if (fieldKitState.propertyRows) return fieldKitState.propertyRows;
  if (fieldKitState.propertyRowsPromise) return fieldKitState.propertyRowsPromise;

  const status = root.querySelector("[data-field-kit-search-status]");
  if (status) status.textContent = "Loading loaded parcel records...";

  fieldKitState.propertyRowsPromise = loadPropertySwitcherRecords().then(context => {
    fieldKitState.propertyRows = propertyRowsFromContext(context);
    if (status) status.textContent = "Search loaded records by owner or address.";
    hydrateFieldKitOwners(root, fieldKitState.propertyRows);
    return fieldKitState.propertyRows;
  }).catch(() => {
    if (status) status.textContent = "Unable to load parcel records.";
    return [];
  });

  return fieldKitState.propertyRowsPromise;
}

function hydrateFieldKitOwners(root, rows = []) {
  if (fieldKitState.ownerHydrationStarted) return;
  fieldKitState.ownerHydrationStarted = true;

  const queue = rows.filter(row => row.recordCardPath);
  let cursor = 0;
  const batchSize = 12;

  async function loadBatch() {
    const batch = queue.slice(cursor, cursor + batchSize);
    cursor += batchSize;
    if (!batch.length) return;

    await Promise.all(batch.map(async row => {
      try {
        const response = await fetch(row.recordCardPath);
        if (!response.ok) return;
        const card = await response.json();
        const owner = card.guidedSnapshot?.parcel?.owner || card.parcel?.owner || "";
        if (!owner || owner === row.owner) return;
        row.owner = owner;
        row.ownerLastName = ownerLastName(owner);
        row.searchText = rowSearchText(row);
      } catch {
        // Background owner hydration should not interrupt the field kit.
      }
    }));

    applyParcelSearch(root);
    if (cursor < queue.length) {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(loadBatch);
      } else {
        window.setTimeout(loadBatch, 40);
      }
    }
  }

  if (window.requestIdleCallback) {
    window.requestIdleCallback(loadBatch);
  } else {
    window.setTimeout(loadBatch, 40);
  }
}

function matchRow(row, query) {
  if (!query) return false;
  const tokens = query.split(" ").filter(Boolean);
  return tokens.every(token => row.searchText.includes(token));
}

function rowRank(row, query) {
  if (!query) return 100;
  const label = normalizeSearch(row.situs);
  const owner = normalizeSearch(row.owner);
  if (label.startsWith(query)) return 0;
  if (owner.startsWith(query) || normalizeSearch(row.ownerLastName).startsWith(query)) return 1;
  if (row.searchText.split(" ").some(token => token.startsWith(query))) return 2;
  return 3;
}

function renderSearchResults(root, rows) {
  const results = root.querySelector("[data-field-kit-search-results]");
  const input = root.querySelector("[data-field-kit-search-input]");
  const status = root.querySelector("[data-field-kit-search-status]");
  if (!results || !input) return;

  fieldKitState.searchVisibleRows = rows;
  fieldKitState.searchActiveIndex = rows.length ? 0 : -1;

  results.innerHTML = rows.map((row, index) => `
    <button type="button" class="ges-field-kit__result ${index === 0 ? "is-active" : ""}" data-field-kit-property-id="${escapeHtml(row.id)}" role="option" aria-selected="${index === 0 ? "true" : "false"}">
      <span>${escapeHtml(row.situs)}</span>
      <small>${escapeHtml([row.owner, row.propertyClass, row.parcelId].filter(Boolean).join(" / "))}</small>
    </button>
  `).join("");

  results.hidden = !rows.length;
  input.setAttribute("aria-expanded", rows.length ? "true" : "false");
  if (status) status.textContent = rows.length
    ? `${rows.length} matching loaded ${rows.length === 1 ? "record" : "records"}.`
    : input.value.trim()
    ? "No matching loaded record."
    : "Search loaded records by owner or address.";
}

function setSearchActiveIndex(root, index) {
  const options = [...root.querySelectorAll("[data-field-kit-property-id]")];
  if (!options.length) return;
  fieldKitState.searchActiveIndex = Math.max(0, Math.min(index, options.length - 1));

  options.forEach((option, optionIndex) => {
    const active = optionIndex === fieldKitState.searchActiveIndex;
    option.classList.toggle("is-active", active);
    option.setAttribute("aria-selected", active ? "true" : "false");
    if (active) option.scrollIntoView({ block: "nearest" });
  });
}

async function applyParcelSearch(root) {
  const input = root.querySelector("[data-field-kit-search-input]");
  if (!input) return;
  const query = normalizeSearch(input.value);
  const rows = await loadFieldKitRows(root);
  const matches = rows
    .filter(row => matchRow(row, query))
    .sort((left, right) => rowRank(left, query) - rowRank(right, query))
    .slice(0, FIELD_KIT_SEARCH_LIMIT);

  renderSearchResults(root, matches);
}

function switchToProperty(propertyId) {
  if (!propertyId) return;

  try {
    safeStorage()?.setItem(PROPERTY_SELECTION_STORAGE_KEY, propertyId);
  } catch {
    // The query string remains the source of truth if storage is unavailable.
  }

  const url = new URL(window.location.href);
  url.searchParams.set("property", propertyId);
  url.searchParams.set("view", "property");
  url.hash = "";
  window.location.assign(url.toString());
}

function initParcelSearchPanel(root) {
  const input = root.querySelector("[data-field-kit-search-input]");
  const results = root.querySelector("[data-field-kit-search-results]");
  if (!input || input.dataset.fieldKitReady) return;
  input.dataset.fieldKitReady = "true";

  loadFieldKitRows(root);

  input.addEventListener("input", () => applyParcelSearch(root));
  input.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeFieldKitPanel(root);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSearchActiveIndex(root, fieldKitState.searchActiveIndex + 1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSearchActiveIndex(root, fieldKitState.searchActiveIndex - 1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const row = fieldKitState.searchVisibleRows[fieldKitState.searchActiveIndex];
      if (row) switchToProperty(row.id);
    }
  });

  results?.addEventListener("click", event => {
    const option = event.target.closest("[data-field-kit-property-id]");
    if (option) switchToProperty(option.dataset.fieldKitPropertyId);
  });
}

function currentShareUrl() {
  return window.location.href;
}

function updateSharePanel(root) {
  const input = root.querySelector("[data-field-kit-share-url]");
  const nativeShare = root.querySelector("[data-field-kit-native-share]");
  if (input) input.value = currentShareUrl();
  if (nativeShare) nativeShare.hidden = !navigator.share;
}

function initSharePanel(root) {
  const copyButton = root.querySelector("[data-field-kit-copy-link]");
  const nativeShare = root.querySelector("[data-field-kit-native-share]");
  const status = root.querySelector("[data-field-kit-share-status]");

  copyButton?.addEventListener("click", async () => {
    try {
      await copyText(currentShareUrl());
      if (status) status.textContent = "Link copied.";
    } catch {
      if (status) status.textContent = "Copy failed. Select the URL and copy it manually.";
    }
  });

  nativeShare?.addEventListener("click", async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: document.title || "Guided Parcel Review",
        url: currentShareUrl()
      });
      if (status) status.textContent = "Share sheet opened.";
    } catch {
      if (status) status.textContent = "Share canceled.";
    }
  });
}

function initNotesPanel(root) {
  const textarea = root.querySelector("[data-field-kit-notes]");
  const clearButton = root.querySelector("[data-field-kit-clear-notes]");
  const status = root.querySelector("[data-field-kit-notes-status]");
  if (!textarea) return;

  textarea.value = safeStorage()?.getItem(FIELD_KIT_NOTES_KEY) || "";
  textarea.addEventListener("input", () => {
    safeStorage()?.setItem(FIELD_KIT_NOTES_KEY, textarea.value);
    if (status) status.textContent = "Saved locally.";
  });

  clearButton?.addEventListener("click", () => {
    textarea.value = "";
    safeStorage()?.removeItem(FIELD_KIT_NOTES_KEY);
    if (status) status.textContent = "Notes cleared.";
    textarea.focus();
  });
}

function clearComponentInspector() {
  document.body.classList.remove("ges-component-inspector-enabled");
  document.querySelectorAll("[data-ges-inspector-owned]").forEach(element => {
    element.removeAttribute("data-ges-inspector-label");
    element.removeAttribute("data-ges-inspector-owned");
  });
}

function enableComponentInspector() {
  clearComponentInspector();
  COMPONENT_INSPECTOR_TARGETS.forEach(([label, selector]) => {
    document.querySelectorAll(selector).forEach(element => {
      if (element.closest("[data-ges-field-kit-root]")) return;
      element.dataset.gesInspectorLabel = label;
      element.dataset.gesInspectorOwned = "";
    });
  });
  document.body.classList.add("ges-component-inspector-enabled");
}

function toggleComponentInspector(root) {
  const button = root.querySelector('[data-ges-field-kit-tool="inspector"]');
  const enabled = !document.body.classList.contains("ges-component-inspector-enabled");
  if (enabled) {
    enableComponentInspector();
  } else {
    clearComponentInspector();
  }
  button?.setAttribute("aria-pressed", enabled ? "true" : "false");
}

function initFieldKitBehavior(root) {
  root.addEventListener("click", event => {
    const button = event.target.closest("[data-ges-field-kit-tool]");
    if (!button) return;

    const tool = button.dataset.gesFieldKitTool;
    if (tool === "inspector") {
      closeFieldKitPanel(root);
      toggleComponentInspector(root);
      return;
    }

    toggleFieldKitPanel(root, tool);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeFieldKitPanel(root);
  });

  document.addEventListener("click", event => {
    if (!root.contains(event.target)) closeFieldKitPanel(root);
  });

  initSharePanel(root);
  initNotesPanel(root);
}

export function initGesFieldKit() {
  if (typeof document === "undefined" || typeof window === "undefined") return null;
  if (!hasInternalToolPermission()) return null;
  if (window[FIELD_KIT_MOUNTED_KEY]) return document.getElementById(FIELD_KIT_ROOT_ID);

  const wrapper = document.createElement("div");
  wrapper.innerHTML = shellMarkup();
  const root = wrapper.firstElementChild;
  document.body.append(root);
  window[FIELD_KIT_MOUNTED_KEY] = true;
  initFieldKitBehavior(root);
  return root;
}
