import {
  completionStatus,
  enrichRecordCalculations,
  formatCurrency,
  formatPercent,
  summarizeSession
} from "./calculations.js?v=20260701-article-polish-4";
import {
  createRecord,
  createSession,
  deleteRecord,
  duplicateRecord,
  generateQueue,
  getActiveContext,
  loadState,
  saveState,
  setActive,
  updateConfig,
  updateRecord,
  updateSession
} from "./storage.js?v=20260701-article-polish-4";
import {
  exportActiveSessionCsv,
  exportActiveSessionJson,
  exportAllJson,
  importJsonFile
} from "./export.js?v=20260701-article-polish-4";
import { syncUnsyncedRecords } from "./sync.js?v=20260701-article-polish-4";

const propertyClasses = ["Residential", "Agricultural", "Commercial", "Industrial", "Exempt/Other", "Unknown"];
const outcomes = ["", "Pending", "Denied", "Approved", "Modified", "Withdrawn", "Tabled", "Continued", "Unknown"];
const refereeAlignments = ["", "Accepted", "Modified", "Rejected", "Not Stated", "Unknown"];
const boardMemberOptions = ["Jurgens", "Dorn", "Lytle", "Tiemann", "Haxby", "Clabaugh", "Adams"];
const countyStaffOptions = [
  "Patricia Milligan, Assessor",
  "Jen Allington, Deputy Assessor",
  "Amanda Fanning, County Attorney"
];
const refereeOptions = ["", "MIPS", "Stanard", "Cardinal", "Other"];
const protestBasisOptions = [
  "Overvaluation",
  "Equalization / Comparable Sales",
  "Condition",
  "Quality",
  "Square Footage",
  "Land Value",
  "Outbuilding",
  "Classification",
  "Agricultural Issue",
  "Clerical / Record Error",
  "Exemption Issue",
  "Other"
];
const evidenceOptions = [
  "Comparable Sales",
  "Photos",
  "Appraisal",
  "Property Record Card",
  "Inspection Notes",
  "Contractor Estimate",
  "Owner Testimony",
  "Assessor Testimony",
  "No Evidence Presented",
  "Other"
];
const observationOptions = [
  "Strong Case",
  "Weak Case",
  "Record Error Found",
  "Equalization Concern",
  "Condition Issue",
  "Board Asked Follow-Up",
  "Assessor Explanation Persuasive",
  "Owner Emotional",
  "Needs Follow-Up",
  "Pattern Emerging"
];

const app = {
  filter: "all",
  search: "",
  touchStartX: 0,
  saveTimer: null
};

const selectors = {};

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheSelectors();
  ensureInitialState();
  populateStaticControls();
  bindEvents();
  render();
}

function cacheSelectors() {
  document.querySelectorAll("[data-session-field], [data-record-field], [data-config-field]").forEach(element => {
    selectors[element.dataset.sessionField || element.dataset.recordField || element.dataset.configField] = element;
  });
}

function ensureInitialState() {
  const state = loadState();
  if (!state.sessions.length) {
    createSession(defaultSessionValues());
  } else {
    state.sessions = state.sessions.map(session => ({
      ...session,
      clerkPresent: session.clerkPresent || "Dawn Hill",
      assessorOrStaffPresent: normalizeStaffNames(session.assessorOrStaffPresent)
    }));
    saveState(state);
  }
}

function populateStaticControls() {
  fillSelect(document.querySelector("[data-session-field='refereePresent']"), refereeOptions);
  fillSelect(document.querySelector("[data-record-field='propertyClass']"), propertyClasses);
  fillSelect(document.querySelector("[data-record-field='outcome']"), outcomes);
  fillSelect(document.querySelector("[data-record-field='refereeAlignment']"), refereeAlignments);
  renderSessionChecklist("boardMembersPresent", boardMemberOptions);
  renderSessionChecklist("assessorOrStaffPresent", countyStaffOptions);
  renderChecklist("protestBasis", protestBasisOptions);
  renderChecklist("evidencePresented", evidenceOptions);
  renderChecklist("quickObservationTags", observationOptions);
}

function bindEvents() {
  document.querySelector("[data-create-session]").addEventListener("click", () => {
    createSession(defaultSessionValues());
    render("Created new session.");
  });

  document.querySelector("[data-session-select]").addEventListener("change", event => {
    setActive(event.target.value);
    render();
  });

  document.querySelectorAll("[data-session-field]").forEach(field => {
    field.addEventListener("input", () => saveSessionField(field));
    field.addEventListener("change", () => saveSessionField(field));
  });

  document.querySelectorAll("[data-session-checklist] input").forEach(field => {
    field.addEventListener("change", () => saveSessionChecklist(field.closest("[data-session-checklist]").dataset.sessionChecklist));
  });

  document.querySelector("[data-generate-queue]").addEventListener("click", () => {
    const { activeSession } = getActiveContext();
    if (!activeSession) return;
    const count = prompt("How many protests are expected?", "30");
    if (!count) return;
    generateQueue(activeSession.sessionId, count);
    render(`Generated ${Number(count) || 0} queue records.`);
  });

  document.querySelector("[data-add-record]").addEventListener("click", () => {
    const { activeSession } = getActiveContext();
    if (!activeSession) return;
    createRecord(activeSession.sessionId);
    render("Added protest record.");
  });

  document.querySelectorAll("[data-record-field]").forEach(field => {
    field.addEventListener("input", () => saveRecordField(field));
    field.addEventListener("change", () => saveRecordField(field));
  });

  document.querySelectorAll("[data-checklist] input").forEach(field => {
    field.addEventListener("change", () => saveChecklist(field.closest("[data-checklist]").dataset.checklist));
  });

  document.querySelector("[data-prev-record]").addEventListener("click", () => navigateRecord(-1));
  document.querySelector("[data-next-record]").addEventListener("click", () => navigateRecord(1));
  document.querySelector("[data-jump-record]").addEventListener("change", event => {
    const { activeSession } = getActiveContext();
    if (!activeSession) return;
    setActive(activeSession.sessionId, event.target.value);
    render();
  });

  document.querySelector("[data-save-draft]").addEventListener("click", () => {
    showSaved("Saved draft.");
    render();
  });
  document.querySelector("[data-save-new]").addEventListener("click", () => {
    const { activeSession } = getActiveContext();
    if (!activeSession) return;
    createRecord(activeSession.sessionId);
    render("Saved. New record ready.");
  });
  document.querySelector("[data-duplicate-record]").addEventListener("click", () => {
    const { activeRecord } = getActiveContext();
    if (!activeRecord) return;
    duplicateRecord(activeRecord.recordId);
    render("Duplicated record.");
  });
  document.querySelector("[data-delete-record]").addEventListener("click", () => {
    const { activeRecord } = getActiveContext();
    if (!activeRecord || !confirm(`Delete protest #${activeRecord.sequenceNumber}?`)) return;
    deleteRecord(activeRecord.recordId);
    render("Deleted record.");
  });

  document.querySelector("[data-start-hearing]").addEventListener("click", () => stampTime("hearingStartTime"));
  document.querySelector("[data-end-hearing]").addEventListener("click", () => stampTime("hearingEndTime"));

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      app.filter = button.dataset.filter;
      renderRecordList();
    });
  });
  document.querySelector("[data-search-records]").addEventListener("input", event => {
    app.search = event.target.value;
    renderRecordList();
  });

  document.querySelectorAll("[data-config-field]").forEach(field => {
    field.addEventListener("input", () => {
      updateConfig({ [field.dataset.configField]: field.value.trim() });
      showSaved("Settings saved.");
    });
  });

  document.querySelector("[data-export-json]").addEventListener("click", exportActiveSessionJson);
  document.querySelector("[data-export-csv]").addEventListener("click", exportActiveSessionCsv);
  document.querySelector("[data-export-all]").addEventListener("click", exportAllJson);
  document.querySelector("[data-import-json]").addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await importJsonFile(file);
      render("Imported JSON data.");
    } catch (error) {
      setSyncMessage(`Import failed: ${error.message}`);
    } finally {
      event.target.value = "";
    }
  });
  document.querySelector("[data-sync-unsynced]").addEventListener("click", runSync);

  document.addEventListener("keydown", event => {
    if (event.target.matches("input, textarea, select")) return;
    if (event.key === "ArrowLeft") navigateRecord(-1);
    if (event.key === "ArrowRight") navigateRecord(1);
  });

  document.querySelector("[data-record-form]").addEventListener("touchstart", event => {
    app.touchStartX = event.changedTouches[0]?.screenX || 0;
  }, { passive: true });
  document.querySelector("[data-record-form]").addEventListener("touchend", event => {
    const delta = (event.changedTouches[0]?.screenX || 0) - app.touchStartX;
    if (Math.abs(delta) > 90) navigateRecord(delta > 0 ? -1 : 1);
  }, { passive: true });

  window.addEventListener("online", renderNetworkStatus);
  window.addEventListener("offline", renderNetworkStatus);
}

function render(message = "") {
  const { activeSession, records, activeRecord, state } = getActiveContext();
  renderNetworkStatus();
  renderSessions(state.sessions, activeSession);
  renderSessionForm(activeSession);
  renderConfig(state.config);
  renderDashboard(activeSession, records, activeRecord);
  renderRecordList();
  renderActiveRecord(activeRecord);
  if (message) showSaved(message);
}

function renderSessions(sessions, activeSession) {
  const select = document.querySelector("[data-session-select]");
  select.innerHTML = sessions.map(session => {
    const label = [session.meetingDate, session.meetingNumber && `#${session.meetingNumber}`, session.location]
      .filter(Boolean)
      .join(" ");
    return `<option value="${escapeHtml(session.sessionId)}">${escapeHtml(label || session.sessionId)}</option>`;
  }).join("");
  select.value = activeSession?.sessionId || "";
}

function renderSessionForm(session) {
  document.querySelectorAll("[data-session-field]").forEach(field => {
    field.value = session?.[field.dataset.sessionField] || "";
  });
  ["boardMembersPresent", "assessorOrStaffPresent"].forEach(key => {
    const values = parseList(session?.[key]);
    document.querySelectorAll(`[data-session-checklist="${key}"] input`).forEach(input => {
      input.checked = values.includes(input.value);
    });
  });
}

function renderConfig(config = {}) {
  document.querySelectorAll("[data-config-field]").forEach(field => {
    field.value = config[field.dataset.configField] || "";
  });
}

function renderDashboardOnly() {
  const { activeSession, records, activeRecord } = getActiveContext();
  renderDashboard(activeSession, records, activeRecord);
}

function renderDashboard(session, records, activeRecord) {
  const summary = summarizeSession(session, records);
  document.querySelector("[data-completion-percent]").textContent = `${summary.completionPercent}%`;
  document.querySelector("[data-progress-dashboard]").innerHTML = [
    ["Total Queue Items", summary.total],
    ["Completed", summary.completed],
    ["In Progress", summary.inProgress],
    ["Empty", summary.empty],
    ["Current Record", activeRecord ? `#${activeRecord.sequenceNumber}` : "-"],
    ["Remaining", summary.remaining],
    ["Pending", summary.pending],
    ["Denied", summary.denied],
    ["Approved", summary.approved],
    ["Modified", summary.modified],
    ["Withdrawn", summary.withdrawn],
    ["Tabled", summary.tabled],
    ["Continued", summary.continued],
    ["Requested Reductions", formatCurrency(summary.totalRequestedReduction)],
    ["Granted Reductions", formatCurrency(summary.totalGrantedReduction)],
    ["Avg Requested %", formatPercent(summary.averageRequestedReductionPercent)],
    ["Avg Granted %", formatPercent(summary.averageGrantedReductionPercent)],
    ["Top Basis", summary.mostCommonProtestBasis || "-"],
    ["Top Evidence", summary.mostCommonEvidenceType || "-"],
    ["Top Outcome", summary.mostCommonOutcome || "-"],
    ["Follow-Ups", summary.followUps],
    ["Avg Duration", summary.averageHearingDuration ? `${Math.round(summary.averageHearingDuration)} min` : "-"],
    ["Unsynced", summary.unsynced]
  ].map(([label, value]) => `
    <div class="boe-stat">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join("");
}

function renderRecordList() {
  const { activeRecord, records } = getActiveContext();
  const filtered = filterRecords(records);
  document.querySelectorAll("[data-filter]").forEach(button => {
    button.classList.toggle("is-active", button.dataset.filter === app.filter);
  });
  const jump = document.querySelector("[data-jump-record]");
  jump.innerHTML = records.map(record => `<option value="${escapeHtml(record.recordId)}">#${record.sequenceNumber}</option>`).join("");
  jump.value = activeRecord?.recordId || "";

  document.querySelector("[data-record-list]").innerHTML = filtered.map(record => {
    const status = completionStatus(record);
    return `
      <li>
        <button type="button" data-record-id="${escapeHtml(record.recordId)}" class="boe-record-row ${activeRecord?.recordId === record.recordId ? "is-active" : ""}">
          <span class="boe-completion" title="${statusLabel(status)}">${statusIcon(status)}</span>
          <span class="boe-record-main">
            <strong>#${record.sequenceNumber} ${escapeHtml(record.parcelId || "")}</strong>
            <small>${escapeHtml(record.address || record.ownerName || "Blank protest record")}</small>
          </span>
          <span class="boe-row-flags">
            ${record.followUpFlag ? "<span title=\"Follow-up\">!</span>" : ""}
            <span title="${record.synced ? "Synced" : "Sync pending"}">${record.synced ? "✓" : "↻"}</span>
          </span>
        </button>
      </li>
    `;
  }).join("");

  document.querySelectorAll("[data-record-id]").forEach(button => {
    button.addEventListener("click", () => {
      const { activeSession } = getActiveContext();
      setActive(activeSession.sessionId, button.dataset.recordId);
      render();
    });
  });
}

function renderActiveRecord(record) {
  const form = document.querySelector("[data-record-form]");
  form.toggleAttribute("hidden", !record);
  if (!record) return;
  const enriched = enrichRecordCalculations(record);
  document.querySelector("[data-active-title]").textContent = `Protest #${enriched.sequenceNumber}`;
  document.querySelector("[data-active-subtitle]").textContent = [enriched.parcelId, enriched.address, enriched.ownerName].filter(Boolean).join(" | ") || "Blank record ready for live capture.";

  document.querySelectorAll("[data-record-field]").forEach(field => {
    const key = field.dataset.recordField;
    if (field.type === "checkbox") {
      field.checked = Boolean(enriched[key]);
    } else {
      field.value = enriched[key] || "";
    }
  });

  ["protestBasis", "evidencePresented", "quickObservationTags"].forEach(key => {
    document.querySelectorAll(`[data-checklist="${key}"] input`).forEach(input => {
      input.checked = (enriched[key] || []).includes(input.value);
    });
  });

  document.querySelector("[data-calculation-summary]").innerHTML = [
    ["Requested Reduction", formatCurrency(enriched.requestedReductionAmount), formatPercent(enriched.requestedReductionPercent)],
    ["Granted Reduction", formatCurrency(enriched.grantedReductionAmount), formatPercent(enriched.grantedReductionPercent)]
  ].map(([label, amount, percent]) => `
    <span><strong>${label}</strong>${amount || "-"} ${percent ? `(${percent})` : ""}</span>
  `).join("");
  document.querySelector("[data-duration-display]").textContent = enriched.hearingDurationMinutes ? `${enriched.hearingDurationMinutes} minutes` : "Duration not set";
  document.querySelector("[data-sync-display]").textContent = enriched.synced ? "Synced" : enriched.syncStatus === "failed" ? "Sync Failed" : "Sync Pending";
}

function saveRecordField(field) {
  const { activeRecord } = getActiveContext();
  if (!activeRecord) return;
  const value = field.type === "checkbox" ? field.checked : field.value;
  updateRecord(activeRecord.recordId, { [field.dataset.recordField]: value });
  showUnsavedThenSaved();
  renderRecordList();
  renderDashboardOnly();
  renderActiveRecord(getActiveContext().activeRecord);
}

function saveSessionField(field) {
  const { activeSession } = getActiveContext();
  if (!activeSession) return;
  updateSession(activeSession.sessionId, { [field.dataset.sessionField]: field.value });
  showUnsavedThenSaved();
  renderDashboardOnly();
}

function saveSessionChecklist(key) {
  const { activeSession } = getActiveContext();
  if (!activeSession) return;
  const values = [...document.querySelectorAll(`[data-session-checklist="${key}"] input:checked`)].map(input => input.value);
  updateSession(activeSession.sessionId, { [key]: values.join("; ") });
  showUnsavedThenSaved();
}

function saveChecklist(key) {
  const { activeRecord } = getActiveContext();
  if (!activeRecord) return;
  const values = [...document.querySelectorAll(`[data-checklist="${key}"] input:checked`)].map(input => input.value);
  updateRecord(activeRecord.recordId, { [key]: values });
  showUnsavedThenSaved();
  renderRecordList();
  renderDashboardOnly();
}

function stampTime(fieldName) {
  const { activeRecord } = getActiveContext();
  if (!activeRecord) return;
  const now = new Date();
  const value = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  updateRecord(activeRecord.recordId, { [fieldName]: value });
  render(`${fieldName === "hearingStartTime" ? "Start" : "End"} time saved.`);
}

function navigateRecord(direction) {
  const { activeSession, activeRecord, records } = getActiveContext();
  if (!activeSession || !records.length) return;
  const index = records.findIndex(record => record.recordId === activeRecord?.recordId);
  const next = records[Math.max(0, Math.min(records.length - 1, index + direction))];
  if (next && next.recordId !== activeRecord?.recordId) {
    setActive(activeSession.sessionId, next.recordId);
    render();
  }
}

async function runSync() {
  setSyncMessage("Syncing unsynced records...");
  const results = await syncUnsyncedRecords(({ record, status }) => {
    setSyncMessage(`Record #${record.sequenceNumber}: ${status}`);
  });
  const failed = results.filter(result => !result.ok).length;
  render(failed ? `Sync finished with ${failed} failed record(s).` : "Sync complete.");
  setSyncMessage(failed ? "Some records remain local and marked unsynced." : "All unsynced records were sent.");
}

function filterRecords(records) {
  const query = app.search.trim().toLowerCase();
  return records.filter(record => {
    if (app.filter === "followup" && !record.followUpFlag) return false;
    if (app.filter === "incomplete" && completionStatus(record) === "complete") return false;
    if (app.filter === "unsynced" && record.synced) return false;
    if (!query) return true;
    return [record.parcelId, record.address, record.ownerName, record.outcome]
      .some(value => `${value || ""}`.toLowerCase().includes(query));
  });
}

function renderChecklist(key, options) {
  document.querySelector(`[data-checklist="${key}"]`).innerHTML = options.map(option => `
    <label class="boe-chip">
      <input type="checkbox" value="${escapeHtml(option)}" />
      <span>${escapeHtml(option)}</span>
    </label>
  `).join("");
}

function renderSessionChecklist(key, options) {
  document.querySelector(`[data-session-checklist="${key}"]`).innerHTML = options.map(option => `
    <label class="boe-chip">
      <input type="checkbox" value="${escapeHtml(option)}" />
      <span>${escapeHtml(option)}</span>
    </label>
  `).join("");
}

function fillSelect(select, options) {
  select.innerHTML = options.map(option => `<option value="${escapeHtml(option)}">${escapeHtml(option || "Select")}</option>`).join("");
}

function defaultSessionValues() {
  return {
    meetingDate: new Date().toISOString().slice(0, 10),
    location: "County Board of Equalization",
    clerkPresent: "Dawn Hill"
  };
}

function parseList(value = "") {
  if (Array.isArray(value)) return value;
  return `${value}`.split(";").map(item => item.trim()).filter(Boolean);
}

function normalizeStaffNames(value = "") {
  return `${value}`.replaceAll("Allignton", "Allington");
}

function showUnsavedThenSaved() {
  const status = document.querySelector("[data-save-status]");
  status.textContent = "Unsaved Changes";
  clearTimeout(app.saveTimer);
  app.saveTimer = setTimeout(() => {
    status.textContent = "Saved";
  }, 450);
}

function showSaved(message = "Saved") {
  const status = document.querySelector("[data-save-status]");
  status.textContent = message;
  clearTimeout(app.saveTimer);
  app.saveTimer = setTimeout(() => {
    status.textContent = "Saved";
  }, 1800);
}

function setSyncMessage(message) {
  document.querySelector("[data-sync-message]").textContent = message;
}

function renderNetworkStatus() {
  const status = document.querySelector("[data-network-status]");
  status.textContent = navigator.onLine ? "Online" : "Offline-ready";
}

function statusIcon(status) {
  return status === "complete" ? "●" : status === "progress" ? "◐" : "○";
}

function statusLabel(status) {
  return status === "complete" ? "Complete" : status === "progress" ? "In Progress" : "Empty";
}

function escapeHtml(value = "") {
  return `${value}`.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}
