async function loadJson(path, label) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Unable to load ${label}: ${response.status}`);
  }

  return response.json();
}

const DATA_PATHS = {
  manifest: "data/app/property-manifest.json"
};

let manifestPromise;
let activeRecordCardPromise;
let activePropertyDataPromise;

export function loadPropertyManifest() {
  manifestPromise ??= loadJson(DATA_PATHS.manifest, "property manifest");

  return manifestPromise;
}

export function getActivePropertyId(manifest) {
  return manifest.activePropertyId;
}

async function getActivePropertyEntry() {
  const manifest = await loadPropertyManifest();
  const activePropertyId = getActivePropertyId(manifest);
  const property = manifest.properties.find(item => item.id === activePropertyId);

  if (!property) {
    throw new Error(`Active property '${activePropertyId}' is not listed in the property manifest.`);
  }

  return { manifest, property };
}

async function getActiveCountyEntry() {
  const { manifest, property } = await getActivePropertyEntry();
  const county = manifest.sharedData.counties[property.county];

  if (!county) {
    throw new Error(`County '${property.county}' is not listed in the property manifest.`);
  }

  return { manifest, property, county };
}

function propertyDataFromRecordCard(recordCard) {
  if (!recordCard?.guidedSnapshot) {
    throw new Error("The active MIPS property record card is missing guided snapshot context.");
  }

  return recordCard.guidedSnapshot;
}

export function loadPropertyRecordCard() {
  activeRecordCardPromise ??= getActivePropertyEntry()
    .then(({ property }) => loadJson(property.recordCardPath, "property record card"));

  return activeRecordCardPromise;
}

export function loadPropertyData() {
  activePropertyDataPromise ??= loadPropertyRecordCard().then(propertyDataFromRecordCard);

  return activePropertyDataPromise;
}

export function loadAssessmentCalendar() {
  return loadPropertyManifest()
    .then(manifest => loadJson(manifest.sharedData.calendarPath, "PAD main assessment calendar"))
    .then(normalizePadCalendar);
}

export function loadCertifiedTaxesLevied() {
  return loadPropertyManifest()
    .then(manifest => loadJson(manifest.sharedData.statewideCtlPath, "certified taxes levied"));
}

export function loadAssessmentRatioAnalysis() {
  return getActiveCountyEntry()
    .then(({ county }) => loadJson(county.assessmentRatioPath, "assessment ratio analysis"));
}

export function loadCountyContext() {
  return getActiveCountyEntry()
    .then(({ county }) => loadJson(county.countyContextPath, "county context"));
}

export function loadGoverningOffice() {
  return getActiveCountyEntry()
    .then(({ county }) => county.governingOfficePath
      ? loadJson(county.governingOfficePath, "governing office")
      : null);
}

export function loadPadRatioStatistics() {
  return getActiveCountyEntry()
    .then(({ county }) => loadJson(county.padRatioStatisticsPath, "PAD ratio statistics"));
}

export function loadMarketPositionStatistics() {
  return getActiveCountyEntry()
    .then(({ county }) => loadJson(county.marketPositionStatisticsPath, "market position statistics"));
}

export function loadTaxDistrictAuthorities() {
  return getActiveCountyEntry()
    .then(({ county }) => loadJson(county.taxDistrictAuthoritiesPath, "tax district authorities"));
}

export function loadSchoolDistrictColors() {
  return getActiveCountyEntry()
    .then(({ county }) => county.schoolDistrictColorsPath
      ? loadJson(county.schoolDistrictColorsPath, "school district colors")
      : { districts: [] });
}

export function loadValuationGroups() {
  return getActiveCountyEntry()
    .then(({ county }) => loadJson(county.valuationGroupsPath, "valuation groups"));
}

export function loadIaaoStandards() {
  return loadPropertyManifest()
    .then(manifest => loadJson(manifest.sharedData.standards.iaaoStandardsPath, "IAAO standards"));
}

export function getSnapshotHistory(data) {
  return data.taxpayerHistory.find(row => row.year === data.snapshotYear)
    ?? data.taxpayerHistory[data.taxpayerHistory.length - 1];
}

export function getLatestFinalTaxHistory(data) {
  return data.taxpayerHistory
    .filter(row => row.taxes !== null && row.taxes !== undefined)
    .at(-1);
}

export function getPreviousFinalValueHistory(data) {
  const snapshot = getSnapshotHistory(data);

  return data.taxpayerHistory
    .filter(row => row.year < snapshot.year && row.assessedValue !== null && row.assessedValue !== undefined)
    .at(-1);
}

function dateParts(isoDate) {
  if (!isoDate) return null;
  const [, month, day] = isoDate.split("-").map(Number);
  return { month, day };
}

function dateToken(parts) {
  return parts.month * 100 + parts.day;
}

function eventTokens(event) {
  const start = dateParts(event.due?.start_date);
  const end = dateParts(event.due?.end_date) || start;

  return start && end ? { start: dateToken(start), end: dateToken(end) } : null;
}

function eventOverlapsStage(event, stage) {
  const tokens = eventTokens(event);
  if (!tokens) return false;

  const stageStart = dateToken(stage.start);
  const stageEnd = dateToken(stage.end);

  return tokens.start <= stageEnd && tokens.end >= stageStart;
}

function eventSummary(event) {
  return {
    id: event.id,
    timing: event.due.label,
    duty: event.duty,
    responsibleParty: event.responsible_party,
    authority: event.authority || [],
    sourcePage: event.source?.page
  };
}

function pickEvents(events, stage) {
  const matches = events
    .filter(event => stage.phases.includes(event.phase))
    .filter(event => eventOverlapsStage(event, stage))
    .filter(event => !stage.match || stage.match(event));

  return matches.slice(0, stage.maxEvents ?? 3).map(eventSummary);
}

function normalizePadCalendar(padCalendar) {
  const stages = [
    {
      id: "assessment",
      label: "Assessment",
      timing: "Jan 1 - May 31",
      start: { month: 1, day: 1 },
      end: { month: 5, day: 31 },
      description: "Assessment-roll work establishes and supports property values before valuation notices and protest rights open.",
      phases: ["assessment_roll"],
      maxEvents: 4
    },
    {
      id: "protest",
      label: "Protest",
      timing: "Jun 1 - Jun 30",
      start: { month: 6, day: 1 },
      end: { month: 6, day: 30 },
      description: "Property owners may file valuation protests during the June protest window.",
      phases: ["protest_and_equalization"],
      match: event => /assessment roll|file a property valuation protest|valuation protest/i.test(event.duty),
      link: {
        label: "Form 422 Property Valuation Protest",
        url: "https://revenue.nebraska.gov/sites/default/files/doc/pad/forms/422_Property_Valuation_Protest.pdf"
      }
    },
    {
      id: "review",
      label: "Review",
      timing: "Jun 1 - Jul 25",
      start: { month: 6, day: 1 },
      end: { month: 7, day: 25 },
      description: "County Board of Equalization hearings and decisions happen after protests are filed.",
      phases: ["protest_and_equalization"],
      match: event => /holds hearings|finalize decisions|county board of equalization/i.test(event.duty)
    },
    {
      id: "budgets",
      label: "Budgets",
      timing: "August - September",
      start: { month: 8, day: 1 },
      end: { month: 9, day: 30 },
      description: "Political subdivisions prepare requests, hearing notices, and final budgets.",
      phases: ["budget_levy_tax_setting"]
    },
    {
      id: "levies",
      label: "Levies",
      timing: "October",
      start: { month: 10, day: 1 },
      end: { month: 10, day: 31 },
      description: "Tax requests and levy rates are set after budgets are finalized.",
      phases: ["budget_levy_tax_setting"]
    },
    {
      id: "tax-bills",
      label: "Final tax bills",
      timing: "November - December",
      start: { month: 11, day: 1 },
      end: { month: 12, day: 31 },
      description: "The tax list is delivered and taxes become due after values, budgets, levies, and exemptions are applied.",
      phases: ["tax_collection", "budget_levy_tax_setting"]
    }
  ].map(stage => ({
    ...stage,
    sourceEvents: pickEvents(padCalendar.events || [], stage),
    link: stage.link || { label: "", url: "" }
  }));

  return {
    jurisdiction: padCalendar.jurisdiction,
    name: "Property tax timeline",
    sourceTitle: padCalendar.title,
    sourceDocument: padCalendar.source_document,
    sourceRevision: padCalendar.source_revision,
    legalDateRule: padCalendar.legal_date_rule,
    currentStageRule: "Stages are active when today's month/day falls inside a stage range. PAD event dates are used as source milestones; annual dates are interpreted by month/day for the current assessment year.",
    stages
  };
}
