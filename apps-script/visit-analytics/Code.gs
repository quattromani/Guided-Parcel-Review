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
  'trackingId',
  'trackingPerson',
  'trackingLabel',
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

function doGet(event) {
  const params = event && event.parameter ? event.parameter : {};
  if (params.view === 'article-reader-counts') {
    return visitAnalyticsPublicJson_(buildArticleReaderCounts_(), params.callback);
  }

  return visitAnalyticsJson_({
    ok: true,
    service: 'Guided Parcel Review visit analytics endpoint',
    schemaVersion: 'visit-analytics.v2'
  });
}

function buildArticleReaderCounts_() {
  const spreadsheet = SpreadsheetApp.openById(VISIT_ANALYTICS_SPREADSHEET_ID);
  const sheet = getOrCreateVisitAnalyticsSheet_(spreadsheet, VISIT_ANALYTICS_SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return { articles: {} };

  const headers = values[0].map(String);
  const index = visitAnalyticsHeaderIndex_(headers);
  const articles = {};

  values.slice(1).forEach(row => {
    const eventName = visitAnalyticsCell_(row, index.event);
    const contentType = visitAnalyticsCell_(row, index.contentType);
    if (eventName !== 'article_view' && contentType !== 'article' && contentType !== 'case-study') return;

    const articleKeys = articleReaderCountKeys_(
      visitAnalyticsCell_(row, index.articleId),
      visitAnalyticsCell_(row, index.path)
    );
    if (!articleKeys.length) return;

    const readerKey = visitAnalyticsCell_(row, index.pageViewId)
      || visitAnalyticsCell_(row, index.visitId)
      || visitAnalyticsCell_(row, index.eventId);
    if (!readerKey) return;

    const receivedAt = visitAnalyticsCell_(row, index.receivedAt);
    const timestamp = visitAnalyticsCell_(row, index.timestamp);
    const rowUpdatedAt = timestamp || receivedAt;

    articleKeys.forEach(articleKey => {
      if (!articles[articleKey]) {
        articles[articleKey] = {
          readerKeys: {},
          updatedAt: ''
        };
      }

      articles[articleKey].readerKeys[readerKey] = true;

      if (rowUpdatedAt && (!articles[articleKey].updatedAt || rowUpdatedAt > articles[articleKey].updatedAt)) {
        articles[articleKey].updatedAt = rowUpdatedAt;
      }
    });
  });

  return {
    articles: Object.keys(articles).reduce((result, key) => {
      result[key] = {
        readers: Object.keys(articles[key].readerKeys).length,
        updatedAt: articles[key].updatedAt
      };
      return result;
    }, {})
  };
}

function visitAnalyticsHeaderIndex_(headers) {
  return headers.reduce((result, header, position) => {
    result[header] = position;
    return result;
  }, {});
}

function visitAnalyticsCell_(row, index) {
  if (typeof index === 'undefined' || index < 0) return '';
  const value = row[index];
  return value === null || typeof value === 'undefined' ? '' : String(value);
}

function articleReaderCountKeys_(articleId, path) {
  const keys = [articleReaderCountSlug_(articleId)];
  const match = String(path || '').match(/\/articles\/([^/?#]+)/);
  keys.push(articleReaderCountSlug_(match ? match[1] : ''));
  return keys.filter((key, index) => key && keys.indexOf(key) === index);
}

function articleReaderCountSlug_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '')
    .replace(/^articles\//, '')
    .replace(/\/index\.html$/, '')
    .replace(/\/$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
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

function visitAnalyticsPublicJson_(payload, callback) {
  const body = JSON.stringify(payload);
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + '(' + body + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return visitAnalyticsJson_(payload);
}
