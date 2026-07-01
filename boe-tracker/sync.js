import { DEFAULT_CONFIG, loadState, markRecordSynced, markRecordSyncFailed } from "./storage.js?v=20260701-article-polish-4";

export function syncPayload(session, record, config = {}) {
  return {
    spreadsheetId: config.spreadsheetId || DEFAULT_CONFIG.spreadsheetId,
    sheetName: "BOE Protest Records",
    session,
    record
  };
}

export async function syncRecord(session, record, config = {}) {
  const endpoint = `${config.appsScriptEndpoint || ""}`.trim();
  if (!endpoint) {
    throw new Error("Apps Script endpoint is not configured.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(syncPayload(session, record, config))
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Sync failed with status ${response.status}`);
  }

  markRecordSynced(record.recordId, data);
  return data;
}

export async function syncUnsyncedRecords(onProgress = () => {}) {
  const state = loadState();
  const config = state.config || {};
  const unsynced = state.records.filter(record => !record.synced);
  const results = [];

  for (const record of unsynced) {
    const session = state.sessions.find(item => item.sessionId === record.sessionId);
    if (!session) continue;
    try {
      onProgress({ record, status: "syncing" });
      const response = await syncRecord(session, record, config);
      results.push({ recordId: record.recordId, ok: true, response });
      onProgress({ record, status: "synced" });
    } catch (error) {
      markRecordSyncFailed(record.recordId, error);
      results.push({ recordId: record.recordId, ok: false, error });
      onProgress({ record, status: "failed", error });
    }
  }

  return results;
}
