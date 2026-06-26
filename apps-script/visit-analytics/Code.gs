const VISIT_ANALYTICS_SPREADSHEET_ID = '15ZR2WKTLwPv69CGGh0xhKNzdmT71Qpu2wv5ugFXX78Q';
const VISIT_ANALYTICS_SHEET_NAME = 'Guided Parcel Visits';
const VISIT_ANALYTICS_SECRET = 'parcel-visits-2026-private-log';

const VISIT_ANALYTICS_HEADERS = [
  'receivedAt',
  'schemaVersion',
  'eventId',
  'timestamp',
  'event',
  'action',
  'detail',
  'visitId',
  'pageViewId',
  'propertyId',
  'parcelId',
  'invite',
  'propertyClass',
  'county',
  'contentType',
  'articleId',
  'articleTitle',
  'placement',
  'targetUrl',
  'elapsedSeconds',
  'step',
  'stepElapsedSeconds',
  'furthestStep',
  'scrollPercent',
  'maxScrollPercent',
  'reachedBottom',
  'source',
  'mediaId',
  'mediaType',
  'mediaCurrentTime',
  'mediaDuration',
  'mediaPercent',
  'mediaMuted',
  'mediaPaused',
  'mediaReadyState',
  'mediaNetworkState',
  'errorName',
  'errorMessage',
  'viewport',
  'path',
  'referrer',
  'referrerHost',
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'utmContent',
  'utmTerm',
  'fbclidPresent',
  'browserContext',
  'isFacebookInApp',
  'userAgent'
];

function doPost(event) {
  try {
    const payload = parseVisitAnalyticsPayload_(event);
    if (payload.secret !== VISIT_ANALYTICS_SECRET) {
      return visitAnalyticsJson_({ ok: false, error: 'Unauthorized' });
    }

    const spreadsheet = SpreadsheetApp.openById(VISIT_ANALYTICS_SPREADSHEET_ID);
    const sheet = getOrCreateVisitAnalyticsSheet_(spreadsheet, VISIT_ANALYTICS_SHEET_NAME);
    const headers = ensureVisitAnalyticsHeaders_(sheet);

    sheet.appendRow(buildVisitAnalyticsRow_(payload, headers));

    return visitAnalyticsJson_({
      ok: true,
      sheetName: sheet.getName(),
      event: payload.event || '',
      eventId: payload.eventId || '',
      receivedAt: new Date().toISOString()
    });
  } catch (error) {
    return visitAnalyticsJson_({
      ok: false,
      error: error.message
    });
  }
}

function doGet() {
  return visitAnalyticsJson_({
    ok: true,
    service: 'Guided Parcel Review visit analytics endpoint',
    schemaVersion: 'visit-analytics.v2'
  });
}

function parseVisitAnalyticsPayload_(event) {
  const raw = event && event.postData && event.postData.contents ? event.postData.contents : '{}';
  return JSON.parse(raw || '{}');
}

function getOrCreateVisitAnalyticsSheet_(spreadsheet, sheetName) {
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function ensureVisitAnalyticsHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(VISIT_ANALYTICS_HEADERS);
    sheet.setFrozenRows(1);
    return VISIT_ANALYTICS_HEADERS.slice();
  }

  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const existing = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  const missing = VISIT_ANALYTICS_HEADERS.filter(header => existing.indexOf(header) === -1);
  if (!missing.length) return existing;

  sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
  sheet.setFrozenRows(1);
  return existing.concat(missing);
}

function buildVisitAnalyticsRow_(payload, headers) {
  const source = normalizeVisitAnalyticsPayload_(payload);
  return headers.map(header => {
    const value = source[header];
    if (Array.isArray(value)) return value.join('; ');
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (value === null || typeof value === 'undefined') return '';
    return value;
  });
}

function normalizeVisitAnalyticsPayload_(payload) {
  const referrer = payload.referrer || '';
  return Object.assign({}, payload, {
    receivedAt: new Date().toISOString(),
    schemaVersion: payload.schemaVersion || 'visit-analytics.v1',
    action: payload.action || '',
    detail: payload.detail || payload.action || '',
    referrerHost: payload.referrerHost || visitAnalyticsHost_(referrer),
    fbclidPresent: coerceVisitAnalyticsBoolean_(payload.fbclidPresent),
    isFacebookInApp: coerceVisitAnalyticsBoolean_(payload.isFacebookInApp),
    mediaMuted: coerceVisitAnalyticsBoolean_(payload.mediaMuted),
    mediaPaused: coerceVisitAnalyticsBoolean_(payload.mediaPaused),
    reachedBottom: coerceVisitAnalyticsBoolean_(payload.reachedBottom)
  });
}

function visitAnalyticsHost_(url) {
  if (!url) return '';
  const match = String(url).match(/^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i);
  return match ? match[1] : '';
}

function coerceVisitAnalyticsBoolean_(value) {
  return value === true || value === 'true' || value === 'TRUE' || value === 1 || value === '1';
}

function visitAnalyticsJson_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
