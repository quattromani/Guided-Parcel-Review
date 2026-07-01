import { escapeHtml } from "../utils/html.js?v=20260701-article-polish-4";

const OWNER_BATCH_SIZE = 18;

function normalizeSearch(value) {
  return `${value ?? ""}`.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function compactSitus(value) {
  return `${value ?? ""}`.trim().replace(/^0+(?=\d)/, "") || "Situs not listed";
}

function ownerFromManifestLabel(value) {
  const label = `${value ?? ""}`.replace(/\s+property$/i, "").trim();
  if (!label || /^(residential|agricultural|commercial|industrial|mixed|southern|northern)\b/i.test(label)) return "";
  if (/gworks record|sample|property$/i.test(label)) return "";
  return label;
}

function inviteCodeForProperty(property = {}) {
  return property.parcelId || property.id || "";
}

function inviteLinkForProperty(property = {}) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "property-record";
  url.searchParams.set("property", property.id);
  url.searchParams.set("view", "property");
  url.searchParams.set("invite", inviteCodeForProperty(property));
  return url.toString();
}

function propertyRows(propertySwitcherContext = {}) {
  return (propertySwitcherContext.records || [])
    .map(item => item.property)
    .filter(property => property?.id && property.recordCardStatus === "available" && property.recordCardPath)
    .sort((left, right) => compactSitus(left.situsAddress).localeCompare(compactSitus(right.situsAddress), undefined, {
      numeric: true,
      sensitivity: "base"
    }))
    .map(property => {
      const owner = property.owner || ownerFromManifestLabel(property.label);
      return {
        id: property.id,
        parcelId: property.parcelId || "",
        situs: compactSitus(property.situsAddress),
        owner,
        propertyClass: property.propertyClass || "Property",
        county: property.county || "",
        recordCardPath: property.recordCardPath,
        inviteCode: inviteCodeForProperty(property),
        inviteLink: inviteLinkForProperty(property)
      };
    });
}

function setFooterResourcesVisible(visible) {
  document.querySelector("[data-footer-resource-shell]")?.classList.toggle("is-hidden", !visible);
}

function rowSearchText(row) {
  return normalizeSearch([
    row.parcelId,
    row.id,
    row.situs,
    row.owner,
    row.propertyClass,
    row.inviteCode
  ].filter(Boolean).join(" "));
}

function hydrateOwnerRows(rows, tableBody) {
  const pending = rows.filter(row => !row.owner && row.recordCardPath);
  let cursor = 0;

  async function loadNextBatch() {
    const batch = pending.slice(cursor, cursor + OWNER_BATCH_SIZE);
    cursor += OWNER_BATCH_SIZE;
    if (!batch.length) return;

    await Promise.all(batch.map(async row => {
      try {
        const response = await fetch(row.recordCardPath);
        if (!response.ok) return;
        const card = await response.json();
        const owner = card.guidedSnapshot?.parcel?.owner || card.parcel?.owner || "";
        if (!owner) return;

        row.owner = owner;
        row.searchText = rowSearchText(row);
        const ownerCell = tableBody.querySelector(`[data-owner-for="${CSS.escape(row.id)}"]`);
        if (ownerCell) {
          ownerCell.textContent = owner;
          ownerCell.classList.remove("property-invite-muted");
        }
      } catch {
        // Missing owner data should not interrupt the invite workbench.
      }
    }));

    window.requestIdleCallback ? window.requestIdleCallback(loadNextBatch) : window.setTimeout(loadNextBatch, 20);
  }

  loadNextBatch();
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.append(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  return copied;
}

function initPropertyInviteIndex(root, rows) {
  const input = root.querySelector("[data-property-invite-search]");
  const count = root.querySelector("[data-property-invite-count]");
  const empty = root.querySelector("[data-property-invite-empty]");
  const tableBody = root.querySelector("[data-property-invite-table-body]");
  const status = root.querySelector("[data-property-invite-status]");
  const rowNodes = [...root.querySelectorAll("[data-property-invite-row]")];

  rows.forEach(row => {
    row.searchText = rowSearchText(row);
  });

  function setStatus(text) {
    if (status) status.textContent = text;
  }

  function applyFilter() {
    const query = normalizeSearch(input?.value || "");
    const tokens = query.split(" ").filter(Boolean);
    let visibleCount = 0;

    rowNodes.forEach(node => {
      const row = rows.find(item => item.id === node.dataset.propertyId);
      const matches = !tokens.length || tokens.every(token => row?.searchText.includes(token));
      node.hidden = !matches;
      if (matches) visibleCount += 1;
    });

    if (count) count.textContent = `${visibleCount.toLocaleString()} of ${rows.length.toLocaleString()} loaded records`;
    if (empty) empty.hidden = visibleCount > 0;
  }

  root.addEventListener("click", async event => {
    const button = event.target.closest("[data-copy-invite-link]");
    if (!button) return;

    const link = button.dataset.copyInviteLink;
    if (!link) return;

    const original = button.textContent;
    button.disabled = true;
    try {
      await copyText(link);
      button.textContent = "Copied";
      setStatus(`Copied invite link for ${button.dataset.copyInviteLabel || "property"}.`);
    } catch {
      button.textContent = "Copy failed";
      setStatus("Copy failed. Open the property link and copy it from the address bar.");
    } finally {
      window.setTimeout(() => {
        button.disabled = false;
        button.textContent = original;
      }, 1600);
    }
  });

  input?.addEventListener("input", applyFilter);
  hydrateOwnerRows(rows, tableBody);
  applyFilter();
}

export function renderPropertyInviteIndex(propertySwitcherContext = {}) {
  const pageTitle = document.getElementById("pageTitle");
  const canvas = document.querySelector(".mobile-review-canvas");
  if (!canvas) return;

  document.querySelector(".guide-review-header")?.classList.add("is-hidden");
  document.querySelectorAll("[data-guided-panel]").forEach(panel => panel.classList.add("is-hidden"));
  setFooterResourcesVisible(false);

  const rows = propertyRows(propertySwitcherContext);

  pageTitle.innerHTML = `
    <div class="comp-page-title">
      <p class="guided-kicker">Experiment · Internal Workbench</p>
      <h1>Property Invite Index</h1>
      <p>Search loaded parcel records and copy direct invite links for quick handoff.</p>
    </div>
  `;

  canvas.innerHTML = `
    <section class="property-invite-page review-card" aria-labelledby="propertyInviteTitle">
      <div class="property-invite-header">
        <div>
          <p class="guided-kicker">Loaded Records</p>
          <h2 id="propertyInviteTitle">Invite-ready property list</h2>
          <p>Search by situs, parcel ID, owner, class, or invite code. Owner names load from record cards in the background.</p>
        </div>
        <label class="property-invite-search">
          <span>Search loaded properties</span>
          <input
            type="search"
            placeholder="Start typing an address, parcel ID, or owner"
            data-property-invite-search
            autocomplete="off"
          />
        </label>
      </div>

      <div class="property-invite-toolbar">
        <strong data-property-invite-count>${rows.length.toLocaleString()} loaded records</strong>
        <span data-property-invite-status aria-live="polite">Invite links use the parcel ID as the invite code.</span>
      </div>

      <div class="property-invite-table-wrap">
        <table class="property-invite-table">
          <thead>
            <tr>
              <th scope="col">Parcel ID</th>
              <th scope="col">Situs</th>
              <th scope="col">Owner</th>
              <th scope="col">Class</th>
              <th scope="col">Invite</th>
            </tr>
          </thead>
          <tbody data-property-invite-table-body>
            ${rows.map(row => `
              <tr data-property-invite-row data-property-id="${escapeHtml(row.id)}">
                <td>
                  <a href="${escapeHtml(`?property=${encodeURIComponent(row.id)}&view=property#property-record`)}">${escapeHtml(row.parcelId || row.id)}</a>
                </td>
                <td>${escapeHtml(row.situs)}</td>
                <td class="${row.owner ? "" : "property-invite-muted"}" data-owner-for="${escapeHtml(row.id)}">${escapeHtml(row.owner || "Loading owner")}</td>
                <td>${escapeHtml(row.propertyClass)}</td>
                <td>
                  <button
                    type="button"
                    class="property-invite-copy"
                    data-copy-invite-link="${escapeHtml(row.inviteLink)}"
                    data-copy-invite-label="${escapeHtml(row.situs)}"
                  >Copy invite</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <p class="property-invite-empty" data-property-invite-empty hidden>No loaded property matches that search.</p>
    </section>
  `;

  initPropertyInviteIndex(canvas, rows);
}
