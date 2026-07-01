import { enrichRecordCalculations } from "./calculations.js?v=20260701-article-polish-4";

export const STORAGE_KEY = "gpr.boeTracker.v1";

export const DEFAULT_CONFIG = {
  spreadsheetId: "15ZR2WKTLwPv69CGGh0xhKNzdmT71Qpu2wv5ugFXX78Q",
  appsScriptEndpoint: ""
};

const blankData = {
  config: DEFAULT_CONFIG,
  sessions: [],
  records: [],
  activeSessionId: "",
  activeRecordId: ""
};

export function createId(prefix) {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return normalizeState(parsed || blankData);
  } catch {
    return normalizeState(blankData);
  }
}

export function saveState(state) {
  const normalized = normalizeState(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function updateConfig(patch) {
  const state = loadState();
  state.config = { ...DEFAULT_CONFIG, ...state.config, ...patch };
  return saveState(state);
}

export function createSession(values = {}) {
  const state = loadState();
  const timestamp = nowIso();
  const session = {
    sessionId: createId("session"),
    meetingDate: new Date().toISOString().slice(0, 10),
    meetingNumber: "",
    location: "County Board of Equalization",
    boardMembersPresent: "",
    assessorOrStaffPresent: "",
    clerkPresent: "Dawn Hill",
    refereePresent: "",
    generalSessionNotes: "",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...values
  };

  state.sessions.unshift(session);
  state.activeSessionId = session.sessionId;
  return saveState(state);
}

export function updateSession(sessionId, patch) {
  const state = loadState();
  state.sessions = state.sessions.map(session => session.sessionId === sessionId
    ? { ...session, ...patch, updatedAt: nowIso() }
    : session);
  return saveState(state);
}

export function createRecord(sessionId, values = {}) {
  const state = loadState();
  const sessionRecords = state.records.filter(record => record.sessionId === sessionId);
  const timestamp = nowIso();
  const record = blankRecord({
    sessionId,
    sequenceNumber: nextSequence(sessionRecords),
    createdAt: timestamp,
    updatedAt: timestamp,
    ...values
  });

  state.records.push(record);
  state.activeSessionId = sessionId;
  state.activeRecordId = record.recordId;
  return saveState(state);
}

export function generateQueue(sessionId, count) {
  const total = Math.max(0, Math.min(250, Number(count) || 0));
  const state = loadState();
  const existing = state.records.filter(record => record.sessionId === sessionId);
  const start = nextSequence(existing);
  const timestamp = nowIso();

  for (let index = 0; index < total; index += 1) {
    state.records.push(blankRecord({
      sessionId,
      sequenceNumber: start + index,
      createdAt: timestamp,
      updatedAt: timestamp
    }));
  }

  state.activeSessionId = sessionId;
  state.activeRecordId = state.activeRecordId || state.records.find(record => record.sessionId === sessionId)?.recordId || "";
  return saveState(state);
}

export function updateRecord(recordId, patch) {
  const state = loadState();
  state.records = state.records.map(record => {
    if (record.recordId !== recordId) return record;
    return enrichRecordCalculations({
      ...record,
      ...patch,
      synced: false,
      syncStatus: "pending",
      syncError: "",
      updatedAt: nowIso()
    });
  });
  return saveState(state);
}

export function duplicateRecord(recordId) {
  const state = loadState();
  const source = state.records.find(record => record.recordId === recordId);
  if (!source) return state;
  const sessionRecords = state.records.filter(record => record.sessionId === source.sessionId);
  const timestamp = nowIso();
  const copy = blankRecord({
    ...source,
    recordId: createId("record"),
    sequenceNumber: nextSequence(sessionRecords),
    synced: false,
    syncStatus: "pending",
    syncError: "",
    createdAt: timestamp,
    updatedAt: timestamp
  });
  state.records.push(copy);
  state.activeRecordId = copy.recordId;
  return saveState(state);
}

export function deleteRecord(recordId) {
  const state = loadState();
  const target = state.records.find(record => record.recordId === recordId);
  state.records = state.records.filter(record => record.recordId !== recordId);
  if (state.activeRecordId === recordId) {
    state.activeRecordId = state.records
      .filter(record => record.sessionId === target?.sessionId)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)[0]?.recordId || "";
  }
  return saveState(state);
}

export function setActive(sessionId, recordId = "") {
  const state = loadState();
  state.activeSessionId = sessionId;
  state.activeRecordId = recordId || state.records
    .filter(record => record.sessionId === sessionId)
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber)[0]?.recordId || "";
  return saveState(state);
}

export function importSessionBundle(bundle) {
  const state = loadState();
  const sessions = Array.isArray(bundle?.sessions) ? bundle.sessions : bundle?.session ? [bundle.session] : [];
  const records = Array.isArray(bundle?.records) ? bundle.records : [];
  const sessionIds = new Set(sessions.map(session => session.sessionId));

  state.sessions = [
    ...state.sessions.filter(session => !sessionIds.has(session.sessionId)),
    ...sessions
  ];
  state.records = [
    ...state.records.filter(record => !sessionIds.has(record.sessionId)),
    ...records.map(record => blankRecord(record))
  ];

  state.activeSessionId = sessions[0]?.sessionId || state.activeSessionId;
  state.activeRecordId = records[0]?.recordId || state.activeRecordId;
  return saveState(state);
}

export function markRecordSynced(recordId, response = {}) {
  const state = loadState();
  state.records = state.records.map(record => record.recordId === recordId
    ? { ...record, synced: true, syncStatus: "synced", syncError: "", syncedAt: nowIso(), syncResponse: response }
    : record);
  return saveState(state);
}

export function markRecordSyncFailed(recordId, error) {
  const state = loadState();
  state.records = state.records.map(record => record.recordId === recordId
    ? { ...record, synced: false, syncStatus: "failed", syncError: `${error?.message || error || "Sync failed"}` }
    : record);
  return saveState(state);
}

export function getActiveContext(state = loadState()) {
  const activeSession = state.sessions.find(session => session.sessionId === state.activeSessionId) || state.sessions[0] || null;
  const records = activeSession
    ? state.records.filter(record => record.sessionId === activeSession.sessionId).sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    : [];
  const activeRecord = records.find(record => record.recordId === state.activeRecordId) || records[0] || null;
  return { state, activeSession, records, activeRecord };
}

function normalizeState(value = {}) {
  const config = { ...DEFAULT_CONFIG, ...(value.config || {}) };
  return {
    ...blankData,
    ...value,
    config,
    sessions: Array.isArray(value.sessions) ? value.sessions : [],
    records: Array.isArray(value.records) ? value.records.map(record => blankRecord(record)) : []
  };
}

function blankRecord(values = {}) {
  return enrichRecordCalculations({
    recordId: createId("record"),
    sessionId: "",
    sequenceNumber: 1,
    parcelId: "",
    address: "",
    ownerName: "",
    propertyClass: "Unknown",
    currentAssessedValue: "",
    ownerRequestedValue: "",
    requestedReductionAmount: null,
    requestedReductionPercent: null,
    refereeRecommendedValue: "",
    finalBOEValue: "",
    grantedReductionAmount: null,
    grantedReductionPercent: null,
    protestBasis: [],
    evidencePresented: [],
    outcome: "",
    refereeAlignment: "",
    hearingStartTime: "",
    hearingEndTime: "",
    hearingDurationMinutes: null,
    quickObservationTags: [],
    freeformNotes: "",
    followUpFlag: false,
    synced: false,
    syncStatus: "pending",
    syncError: "",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    ...values
  });
}

function nextSequence(records) {
  return records.reduce((max, record) => Math.max(max, Number(record.sequenceNumber) || 0), 0) + 1;
}
