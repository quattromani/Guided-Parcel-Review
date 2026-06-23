const DEFAULT_SPREADSHEET_ID = '15ZR2WKTLwPv69CGGh0xhKNzdmT71Qpu2wv5ugFXX78Q';
const DEFAULT_SHEET_NAME = 'BOE Protest Records';

const HEADERS = [
  'syncedAt',
  'sessionId',
  'meetingDate',
  'meetingNumber',
  'location',
  'boardMembersPresent',
  'assessorOrStaffPresent',
  'clerkPresent',
  'refereePresent',
  'generalSessionNotes',
  'recordId',
  'sequenceNumber',
  'parcelId',
  'address',
  'ownerName',
  'propertyClass',
  'currentAssessedValue',
  'ownerRequestedValue',
  'requestedReductionAmount',
  'requestedReductionPercent',
  'refereeRecommendedValue',
  'finalBOEValue',
  'grantedReductionAmount',
  'grantedReductionPercent',
  'protestBasis',
  'evidencePresented',
  'outcome',
  'refereeAlignment',
  'hearingStartTime',
  'hearingEndTime',
  'hearingDurationMinutes',
  'quickObservationTags',
  'freeformNotes',
  'followUpFlag',
  'createdAt',
  'updatedAt'
];

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || '{}');
    const spreadsheetId = payload.spreadsheetId || DEFAULT_SPREADSHEET_ID;
    const sheetName = payload.sheetName || DEFAULT_SHEET_NAME;
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = getOrCreateSheet_(spreadsheet, sheetName);
    const row = buildRow_(payload.session || {}, payload.record || {});

    sheet.appendRow(row);

    return json_({
      ok: true,
      spreadsheetId,
      sheetName,
      recordId: payload.record && payload.record.recordId,
      appendedAt: new Date().toISOString()
    });
  } catch (error) {
    return json_({
      ok: false,
      error: error.message
    });
  }
}

function doGet() {
  return json_({
    ok: true,
    service: 'BOE Protest Tracker sync endpoint'
  });
}

function getOrCreateSheet_(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function buildRow_(session, record) {
  const source = Object.assign({}, session, record, {
    syncedAt: new Date().toISOString()
  });

  return HEADERS.map(header => {
    const value = source[header];
    return Array.isArray(value) ? value.join('; ') : value;
  });
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
