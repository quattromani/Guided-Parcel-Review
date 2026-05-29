#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { parsePdf } = require("./prepare-record-ingestion");

const ROOT = process.cwd();
const SOURCE_PATH = path.join(ROOT, "data/sources/assessor-7-128-change-parcel-ids.txt");
const MANIFEST_PATH = path.join(ROOT, "data/app/property-manifest.json");
const VALUATION_GROUPS_PATH = path.join(ROOT, "data/counties/gage/valuation-groups.json");
const MARKET_STATS_PATH = path.join(ROOT, "data/counties/gage/market-position-statistics-2026-gage.json");
const TRACKER_PATH = path.join(ROOT, "data/sampling/gage-research-sampling-tracker.json");
const AUDIT_PATH = path.join(ROOT, "data/sampling/gage-research-built-audit.json");
const PDF_DIR = path.join(ROOT, "research/gworks-pdfs/source-pdfs");
const GWORKS_REPORT_BASE = "https://report.gworks.com/report.ashx";
const TARGET_PER_GROUP = 20;
const PRIMARY_DEEP_SAMPLE_GROUP = "Residential-3";

function usage() {
  console.error([
    "Usage:",
    "  node scripts/manage-research-sampling.js init",
    "  node scripts/manage-research-sampling.js screen-local [--limit 100] [--strategy low-id]",
    "  node scripts/manage-research-sampling.js fetch-screen [--limit 100] [--retry-failed] [--strategy low-id]",
    "  node scripts/manage-research-sampling.js add-parcels [--target Residential-15|auto] --name gis-vg15 005218125 005218003 ...",
    "  node scripts/manage-research-sampling.js fetch-named --name gis-vg15 [--limit 100]",
    "  node scripts/manage-research-sampling.js probe-range --start 007000000 --end 007050000 [--step 1000] [--target Residential-5]",
    "  node scripts/manage-research-sampling.js surgical [--limit 240] [--retry-failed]",
    "  node scripts/manage-research-sampling.js next [--group Residential-7] [--limit 20]",
    "  node scripts/manage-research-sampling.js build [--group Residential-7] [--limit 20]",
    "  node scripts/manage-research-sampling.js audit-built [--group Residential-7] [--limit 200]",
    "  node scripts/manage-research-sampling.js summary",
    "",
    "This manages the private all-group Gage research sample tracker."
  ].join("\n"));
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    command: argv[2],
    limit: null,
    group: null,
    retryFailed: false,
    strategy: "source-order",
    start: null,
    end: null,
    step: 1000,
    targets: [],
    name: null,
    parcels: []
  };
  for (let index = 3; index < argv.length; index += 1) {
    if (argv[index] === "--limit") {
      args.limit = Number(argv[++index]);
    } else if (argv[index] === "--group") {
      args.group = argv[++index];
    } else if (argv[index] === "--retry-failed") {
      args.retryFailed = true;
    } else if (argv[index] === "--strategy") {
      args.strategy = argv[++index];
    } else if (argv[index] === "--start") {
      args.start = argv[++index];
    } else if (argv[index] === "--end") {
      args.end = argv[++index];
    } else if (argv[index] === "--step") {
      args.step = Number(argv[++index]);
    } else if (argv[index] === "--target") {
      args.targets.push(argv[++index]);
    } else if (argv[index] === "--name") {
      args.name = argv[++index];
    } else if (!argv[index].startsWith("--")) {
      args.parcels.push(argv[index]);
    } else {
      usage();
    }
  }
  if (!args.command) usage();
  return args;
}

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeGworksParcelId(value) {
  const digits = `${value ?? ""}`.replace(/\D/g, "");
  if (!digits) return "";
  return digits.length < 9 ? digits.padStart(9, "0") : digits;
}

function normalizeNtoParcelId(value) {
  const digits = `${value ?? ""}`.replace(/\D/g, "");
  if (!digits) return "";
  return digits.length < 10 ? digits.padStart(10, "0") : digits;
}

function normalizedClass(value) {
  const text = `${value ?? ""}`.trim().toLowerCase();
  if (text.includes("ag")) return "Agricultural";
  if (text.includes("comm")) return "Commercial";
  if (text.includes("res")) return "Residential";
  if (text.includes("industrial")) return "Industrial";
  return value || "Unknown";
}

function compact(value) {
  return `${value ?? ""}`.trim().replace(/\s+/g, " ");
}

function groupCatalog() {
  const valuationGroups = readJson(VALUATION_GROUPS_PATH, { valuationGroups: [] });
  const marketStats = readJson(MARKET_STATS_PATH, null);
  const catalog = new Map();

  for (const group of valuationGroups.valuationGroups || []) {
    const key = `${group.class}-${group.valuationGroup}`;
    const description = compact(group.description);
    catalog.set(key, {
      key,
      class: group.class,
      number: String(group.valuationGroup),
      valuationGroup: `${group.valuationGroup} - ${description}`,
      marketArea: description,
      marketGroup: group.marketGroup,
      description,
      target: key === PRIMARY_DEEP_SAMPLE_GROUP ? 0 : TARGET_PER_GROUP
    });
  }

  const agRows = marketStats?.classes?.agricultural?.groups
    || marketStats?.priceBandStudies?.agFarm?.rows?.filter(row => row.section === "Market Area")
    || [];
  for (const row of agRows) {
    const id = `${row.id ?? row.range ?? row.label ?? ""}`.match(/\d+/)?.[0];
    if (!id) continue;
    const key = `Agricultural-${id}`;
    const label = `Market Area ${id}`;
    catalog.set(key, {
      key,
      class: "Agricultural",
      number: id,
      valuationGroup: label,
      marketArea: label,
      marketGroup: "Agricultural",
      description: label,
      target: TARGET_PER_GROUP
    });
  }

  return catalog;
}

function readSourceParcelIds() {
  return fs.readFileSync(SOURCE_PATH, "utf8")
    .split(/\s+/)
    .map(value => value.trim())
    .filter(Boolean);
}

function gworksPdfPath(gworksParcelId) {
  return path.join(PDF_DIR, `${gworksParcelId}.pdf`);
}

function gworksUrl(gworksParcelId) {
  const params = new URLSearchParams({
    county: "gage",
    id: gworksParcelId,
    subs: "true",
    type: "assessor"
  });
  return `${GWORKS_REPORT_BASE}?${params.toString()}`;
}

function sourceIdFromGworks(gworksParcelId) {
  const numeric = String(Number(normalizeGworksParcelId(gworksParcelId)));
  return numeric === "NaN" ? normalizeGworksParcelId(gworksParcelId) : numeric;
}

function candidateBase({ sourceParcelId, gworksParcelId, sequence, candidateSource = "source_list", probeName = null }) {
  const normalizedGworks = normalizeGworksParcelId(gworksParcelId || sourceParcelId);
  return {
    sequence,
    sourceParcelId,
    candidateSource,
    probeName,
    gworksParcelId: normalizedGworks,
    ntoParcelId: normalizeNtoParcelId(normalizedGworks),
    gworksPdfPath: path.relative(ROOT, gworksPdfPath(normalizedGworks)),
    gworksUrl: gworksUrl(normalizedGworks)
  };
}

function manifestBuiltMap(catalog = groupCatalog()) {
  const manifest = readJson(MANIFEST_PATH, { properties: [] });
  const map = new Map();
  for (const property of manifest.properties || []) {
    if (property.county !== "gage") continue;
    const keys = [
      normalizeGworksParcelId(property.parcelId),
      normalizeNtoParcelId(property.parcelId)
    ].filter(Boolean);
    let recordGroup = null;
    if (property.recordCardPath && fs.existsSync(path.join(ROOT, property.recordCardPath))) {
      recordGroup = classifyRecordCard(readJson(path.join(ROOT, property.recordCardPath)), catalog);
    }
    for (const key of keys) {
      map.set(key, { property, recordGroup });
    }
  }
  return map;
}

function classifyRecordCard(recordCard, catalog) {
  const propertyClass = normalizedClass(
    recordCard?.guidedSnapshot?.classification?.propertyClass
    || recordCard?.guidedSnapshot?.parcel?.accountType
  );
  const valuationGroup = recordCard?.locationModel?.valuationGroup || recordCard?.locationModel?.marketArea || "";
  const id = `${valuationGroup}`.match(/\d+/)?.[0];
  const key = id ? `${propertyClass}-${id}` : null;
  if (key && catalog.has(key)) return { ...catalog.get(key), confidence: "record-card" };
  return {
    key: key || `${propertyClass}-unassigned`,
    class: propertyClass,
    valuationGroup: compact(valuationGroup) || "Unassigned",
    marketArea: recordCard?.locationModel?.marketArea || null,
    marketGroup: recordCard?.locationModel?.marketGroup || null,
    confidence: "record-card-unmapped"
  };
}

function defaultTracker() {
  return {
    version: "0.1",
    project: "gage-all-group-research-sample",
    target: {
      targetPerGroup: TARGET_PER_GROUP,
      excludedDeepSampleGroup: PRIMARY_DEEP_SAMPLE_GROUP,
      sourceDescription: "Assessor 7-128 change parcel list",
      sourcePath: path.relative(ROOT, SOURCE_PATH)
    },
    statusDefinitions: {
      source_candidate: "Parcel is in the 7-128 source list and has not been screened.",
      screened_candidate: "GWorks PDF parsed and mapped to a research sample group.",
      screened_needs_review: "GWorks PDF parsed, but group mapping is heuristic and should be checked.",
      built_research: "Record card is built and kept out of the public switcher.",
      built_public: "Record card is built and available in the public switcher.",
      rejected_download_failed: "GWorks assessor PDF could not be downloaded.",
      rejected_pdf_parse_failed: "PDF downloaded but could not be parsed.",
      rejected_unclassified: "PDF parsed but could not be mapped to a supported research group.",
      rejected_unsupported_class: "PDF parsed but class is outside the current residential/commercial/ag scope."
    },
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    groups: [...groupCatalog().values()],
    candidates: []
  };
}

function loadTracker() {
  return readJson(TRACKER_PATH, defaultTracker());
}

function saveTracker(tracker) {
  tracker.updatedAt = new Date().toISOString();
  tracker.groups = [...groupCatalog().values()];
  writeJson(TRACKER_PATH, tracker);
}

function init() {
  const catalog = groupCatalog();
  const existing = readJson(TRACKER_PATH, null);
  const built = manifestBuiltMap(catalog);
  const sourceIds = readSourceParcelIds();
  const candidateMap = new Map((existing?.candidates || []).map(candidate => [candidate.sourceParcelId, candidate]));

  const candidates = sourceIds.map((sourceParcelId, index) => {
    const gworksParcelId = normalizeGworksParcelId(sourceParcelId);
    const ntoParcelId = normalizeNtoParcelId(sourceParcelId);
    const manifestEntry = built.get(gworksParcelId) || built.get(ntoParcelId);
    const current = candidateMap.get(sourceParcelId) || {};
    const base = candidateBase({
      sequence: index + 1,
      sourceParcelId,
      gworksParcelId,
      candidateSource: current.candidateSource || "source_list",
      probeName: current.probeName || null
    });
    const builtFields = manifestEntry ? {
      status: (manifestEntry.property.sampleVisibility || "public") === "research" ? "built_research" : "built_public",
      manifestId: manifestEntry.property.id,
      recordCardPath: manifestEntry.property.recordCardPath,
      sampleVisibility: manifestEntry.property.sampleVisibility || "public",
      groupKey: manifestEntry.recordGroup?.key || current.groupKey,
      groupConfidence: manifestEntry.recordGroup?.confidence || current.groupConfidence,
      assignedValuationGroup: manifestEntry.recordGroup?.valuationGroup || current.assignedValuationGroup,
      assignedMarketArea: manifestEntry.recordGroup?.marketArea || current.assignedMarketArea,
      assignedMarketGroup: manifestEntry.recordGroup?.marketGroup || current.assignedMarketGroup
    } : {};
    return {
      ...base,
      status: "source_candidate",
      ...current,
      ...builtFields
    };
  });

  const tracker = existing || defaultTracker();
  tracker.candidates = candidates;
  tracker.generatedAt ||= new Date().toISOString();
  saveTracker(tracker);
  printSummary(tracker);
}

function downloadPdf(candidate) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
  if (fs.existsSync(path.join(ROOT, candidate.gworksPdfPath))) return true;

  execFileSync("curl", [
    "-L",
    "-s",
    "-f",
    "--connect-timeout",
    "10",
    "--max-time",
    "15",
    "-o",
    path.join(ROOT, candidate.gworksPdfPath),
    candidate.gworksUrl
  ], { stdio: ["ignore", "pipe", "pipe"] });
  return true;
}

function addressLooksRural(address = "") {
  const value = compact(address).toUpperCase();
  const number = Number(value.match(/^0*([0-9]{1,6})\b/)?.[1] || 0);
  return /\b(?:RD|ROAD|HWY|HIGHWAY|COUNTY|STATE SPUR|RURAL ROUTE)\b/.test(value)
    || number >= 10000
    || /\b[NSWE]{1,2}\s+\d+\s+RD\b/.test(value);
}

function parsedText(parsed) {
  return [
    parsed.situsAddress,
    parsed.legalDescription,
    parsed.schoolDistrict,
    parsed.taxDistrict
  ].map(value => compact(value).toUpperCase()).join(" ");
}

const TOWN_GROUPS = [
  ["BEATRICE", "Residential-3"],
  ["ADAMS", "Residential-1"],
  ["BARNESTON", "Residential-2"],
  ["BLUE SPRINGS", "Residential-5"],
  ["CLATONIA", "Residential-6"],
  ["CORTLAND", "Residential-7"],
  ["FILLEY", "Residential-9"],
  ["LIBERTY", "Residential-10"],
  ["ODELL", "Residential-11"],
  ["PICKRELL", "Residential-12"],
  ["ROCKFORD", "Residential-13"],
  ["HOLMESVILLE", "Residential-13"],
  ["LANHAM", "Residential-13"],
  ["ELLIS", "Residential-13"],
  ["VIRGINIA", "Residential-17"],
  ["WYMORE", "Residential-18"],
  ["DOCTOR'S LAKE", "Residential-19"],
  ["DOCTORS LAKE", "Residential-19"],
  ["DRS LAKE", "Residential-19"]
];

const RESIDENTIAL_TAX_DISTRICTS = new Map([
  ["87", "Residential-13"],
  ["126", "Residential-13"],
  ["144", "Residential-1"],
  ["146", "Residential-5"],
  ["147", "Residential-6"],
  ["148", "Residential-7"],
  ["149", "Residential-9"],
  ["150", "Residential-10"],
  ["151", "Residential-11"],
  ["153", "Residential-12"],
  ["154", "Residential-17"],
  ["155", "Residential-17"],
  ["156", "Residential-18"],
  ["157", "Residential-3"],
  ["797", "Residential-3"]
]);

const COMMERCIAL_TAX_DISTRICTS = new Map([
  ["29", "Commercial-50"],
  ["87", "Commercial-50"],
  ["123", "Commercial-50"],
  ["126", "Commercial-50"],
  ["157", "Commercial-3"],
  ["797", "Commercial-3"],
  ["156", "Commercial-18"],
  ["144", "Commercial-10"],
  ["148", "Commercial-10"],
  ["146", "Commercial-15"],
  ["147", "Commercial-10"],
  ["149", "Commercial-10"],
  ["150", "Commercial-15"],
  ["151", "Commercial-15"],
  ["153", "Commercial-10"],
  ["154", "Commercial-15"],
  ["155", "Commercial-15"]
]);

const COMMERCIAL_TOWN_GROUPS = [
  ["BEATRICE", "Commercial-3"],
  ["WYMORE", "Commercial-18"],
  ["ADAMS", "Commercial-10"],
  ["CLATONIA", "Commercial-10"],
  ["CORTLAND", "Commercial-10"],
  ["FILLEY", "Commercial-10"],
  ["PICKRELL", "Commercial-10"],
  ["BLUE SPRINGS", "Commercial-15"],
  ["BARNESTON", "Commercial-15"],
  ["LIBERTY", "Commercial-15"],
  ["ODELL", "Commercial-15"],
  ["VIRGINIA", "Commercial-15"]
];

const AG_MARKET_AREA_2_GEOCODES = new Set(["4209", "4407", "4455"]);
const AG_MARKET_AREA_2_TOWNSHIP_RANGES = new Set(["3-8", "2-8", "1-8"]);

function firstTextGroup(text, pairs) {
  return pairs.find(([needle]) => text.includes(needle))?.[1] || null;
}

function stateGeoCodePrefix(parsed) {
  return `${parsed.stateGeoCode || ""}`.match(/^\s*(\d{4})/)?.[1] || null;
}

function legalTownshipRange(parsed) {
  const legal = `${parsed.legalDescription || ""}`;
  const match = legal.match(/\bSEC\s+(\d+)-(\d+)-(\d+)\b/i)
    || legal.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\b/);
  if (!match) return null;
  return `${Number(match[2])}-${Number(match[3])}`;
}

function ruralResidentialGroup(parsed) {
  const text = parsedText(parsed);
  const taxDistrict = `${parsed.taxDistrict || ""}`;
  if (/WYMORE|DILLER|ODELL|TRI COUNTY|BLUE SPRINGS|BARNESTON|VIRGINIA/.test(text) || ["3", "29", "36", "115", "119", "146", "151", "156"].includes(taxDistrict)) {
    return {
      groupKey: "Residential-15",
      confidence: "review-rural-south",
      notes: "Rural residential mapped to south/rural group from school, town, or tax district evidence."
    };
  }
  if (/NORRIS|FREEMAN|WILBER|ADAMS|CORTLAND|CLATONIA|FILLEY|PICKRELL/.test(text) || ["25", "33", "69", "109", "147", "148", "149"].includes(taxDistrict)) {
    return {
      groupKey: "Residential-16",
      confidence: "review-rural-north",
      notes: "Rural residential mapped to north group from school, town, or tax district evidence."
    };
  }
  return {
    groupKey: "Residential-15",
    confidence: "review-rural-default",
    notes: "Rural residential defaulted to south/rural group; manual review recommended."
  };
}

function agMarketArea(parsed) {
  const geoCode = stateGeoCodePrefix(parsed);
  const townshipRange = legalTownshipRange(parsed);
  if (geoCode && AG_MARKET_AREA_2_GEOCODES.has(geoCode)) {
    return {
      groupKey: "Agricultural-2",
      confidence: "high",
      notes: `Agricultural parcel mapped to Market Area 2 from R&O market map geocode ${geoCode}; MA2 is the three townships sharing the Pawnee County border.`
    };
  }
  if (!geoCode && townshipRange && AG_MARKET_AREA_2_TOWNSHIP_RANGES.has(townshipRange)) {
    return {
      groupKey: "Agricultural-2",
      confidence: "medium",
      notes: `Agricultural parcel mapped to Market Area 2 from legal township-range ${townshipRange}; MA2 is the three townships sharing the Pawnee County border.`
    };
  }
  if (geoCode || townshipRange) {
    return {
      groupKey: "Agricultural-1",
      confidence: geoCode ? "high" : "medium",
      notes: geoCode
        ? `Agricultural parcel mapped to Market Area 1 from R&O market map geocode ${geoCode}; MA1 is the county remainder outside MA2.`
        : `Agricultural parcel mapped to Market Area 1 from legal township-range ${townshipRange}; MA1 is the county remainder outside MA2.`
    };
  }
  return {
    groupKey: null,
    confidence: "unclassified",
    notes: "Agricultural market area could not be inferred from available PDF fields."
  };
}

function classifyParsed(parsed, catalog) {
  const propertyClass = normalizedClass(parsed.classification?.propertyClass || parsed.accountType);
  const text = parsedText(parsed);
  const taxDistrict = `${parsed.taxDistrict || ""}`;

  if (propertyClass === "Agricultural") {
    return attachGroup(agMarketArea(parsed), catalog);
  }

  if (propertyClass === "Residential") {
    const explicitGroup = RESIDENTIAL_TAX_DISTRICTS.get(taxDistrict);
    if (explicitGroup === "Residential-19" || explicitGroup === "Residential-13") {
      return attachGroup({
        groupKey: explicitGroup,
        confidence: "high",
        notes: "Residential group inferred from an explicit small-area tax district."
      }, catalog);
    }

    const rural = addressLooksRural(parsed.situsAddress);
    if (rural) return attachGroup(ruralResidentialGroup(parsed), catalog);

    const groupKey = explicitGroup || firstTextGroup(text, TOWN_GROUPS);
    return attachGroup({
      groupKey,
      confidence: groupKey ? "high" : "unclassified",
      notes: groupKey ? "Residential street/town group inferred from tax district or town evidence." : "Residential group could not be inferred."
    }, catalog);
  }

  if (propertyClass === "Commercial") {
    if (addressLooksRural(parsed.situsAddress)) {
      return attachGroup({
        groupKey: "Commercial-50",
        confidence: "high",
        notes: "Commercial parcel mapped to rural group from rural address pattern."
      }, catalog);
    }
    const groupKey = COMMERCIAL_TAX_DISTRICTS.get(taxDistrict) || firstTextGroup(text, COMMERCIAL_TOWN_GROUPS);
    return attachGroup({
      groupKey,
      confidence: groupKey ? "medium" : "unclassified",
      notes: groupKey ? "Commercial valuation group inferred from tax district or town evidence." : "Commercial group could not be inferred."
    }, catalog);
  }

  return {
    class: propertyClass,
    groupKey: null,
    confidence: "unsupported",
    notes: `Unsupported class for current experiment scope: ${propertyClass}.`
  };
}

function attachGroup(result, catalog) {
  if (!result.groupKey || !catalog.has(result.groupKey)) return result;
  const group = catalog.get(result.groupKey);
  return {
    ...result,
    ...group,
    groupKey: group.key
  };
}

function applyExpectedGroup(candidate, assignment, propertyClass, catalog) {
  const expectedGroupKey = candidate.expectedGroupKey;
  if (!expectedGroupKey || !catalog.has(expectedGroupKey)) return assignment;
  const expectedGroup = catalog.get(expectedGroupKey);
  if (expectedGroup.class !== propertyClass) return assignment;
  if (propertyClass === "Agricultural" && assignment.groupKey && assignment.groupKey !== expectedGroupKey) {
    return {
      ...assignment,
      notes: [
        assignment.notes,
        `GWorks export expected ${expectedGroup.key}.`,
        "Keeping the R&O geocode market-area classification for agricultural land."
      ].join(" ")
    };
  }
  if (assignment.groupKey === expectedGroupKey) {
    if (`${candidate.probeName || ""}`.startsWith("gworks-export-") && `${assignment.confidence || ""}`.startsWith("review")) {
      return {
        ...assignment,
        confidence: "gis-filter",
        notes: [
          `GWorks valuation-group export expected ${expectedGroup.key}.`,
          `PDF heuristic agreed with ${assignment.groupKey}.`,
          "Using the export-backed group because the parcel class and rural-group inference agree."
        ].join(" ")
      };
    }
    return assignment;
  }
  return {
    ...assignment,
    ...expectedGroup,
    groupKey: expectedGroup.key,
    confidence: "gis-filter",
    notes: [
      `GIS filter expected ${expectedGroup.key}.`,
      assignment.groupKey ? `PDF heuristic inferred ${assignment.groupKey}.` : "PDF heuristic did not infer a group.",
      "Using the GIS valuation-group filter because the parcel class matches."
    ].join(" ")
  };
}

function screenCandidate(candidate, { fetch = false } = {}) {
  const pdfPath = path.join(ROOT, candidate.gworksPdfPath);
  try {
    if (fetch) downloadPdf(candidate);
    if (!fs.existsSync(pdfPath)) return { status: candidate.status, skipped: "missing_pdf" };
  } catch (error) {
    return {
      status: "rejected_download_failed",
      rejectedReason: error.message
    };
  }

  let parsed;
  try {
    parsed = parsePdf(pdfPath);
  } catch (error) {
    return {
      status: "rejected_pdf_parse_failed",
      rejectedReason: error.message
    };
  }

  const catalog = groupCatalog();
  const propertyClass = normalizedClass(parsed.classification?.propertyClass || parsed.accountType);
  const assignment = applyExpectedGroup(candidate, classifyParsed(parsed, catalog), propertyClass, catalog);
  const screened = {
    parsedAt: new Date().toISOString(),
    owner: parsed.owner,
    situsAddress: parsed.situsAddress,
    propertyClass,
    accountType: parsed.accountType,
    taxDistrict: parsed.taxDistrict,
    schoolDistrict: parsed.schoolDistrict,
    legalDescription: parsed.legalDescription,
    pdfParcelId: parsed.parcelId,
    pdfNtoParcelId: parsed.ntoParcelId,
    expectedGroupKey: candidate.expectedGroupKey || null,
    groupKey: assignment.groupKey,
    groupConfidence: assignment.confidence,
    assignmentNotes: assignment.notes,
    assignedValuationGroup: assignment.valuationGroup,
    assignedMarketArea: assignment.marketArea,
    assignedMarketGroup: assignment.marketGroup,
    sampleVisibility: "research",
    rejectedReason: null
  };

  if (assignment.confidence === "unsupported") {
    return {
      ...screened,
      status: "rejected_unsupported_class",
      rejectedReason: assignment.notes
    };
  }

  if (!assignment.groupKey) {
    return {
      ...screened,
      status: "rejected_unclassified",
      rejectedReason: assignment.notes
    };
  }

  const needsReview = `${assignment.confidence}`.startsWith("review");
  return {
    ...screened,
    status: needsReview ? "screened_needs_review" : "screened_candidate"
  };
}

function shouldScreen(candidate, { fetch = false, retryFailed = false } = {}) {
  if (candidate.status === "source_candidate") return true;
  if (retryFailed && candidate.status === "rejected_download_failed") return true;
  if (!fetch && candidate.status === "rejected_download_failed") return true;
  if (candidate.status === "rejected_pdf_parse_failed" || candidate.status === "rejected_unclassified") return true;
  if (fetch) return false;

  return [
    "screened_candidate",
    "screened_needs_review",
    "rejected_unsupported_class"
  ].includes(candidate.status);
}

function sortForStrategy(candidates, strategy) {
  if (strategy === "source-order") {
    return candidates.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  }
  if (strategy === "low-id") {
    return candidates.sort((a, b) => {
      const aId = Number(a.gworksParcelId || Number.MAX_SAFE_INTEGER);
      const bId = Number(b.gworksParcelId || Number.MAX_SAFE_INTEGER);
      return aId - bId || (a.sequence || 0) - (b.sequence || 0);
    });
  }
  if (strategy === "high-id") {
    return candidates.sort((a, b) => {
      const aId = Number(a.gworksParcelId || 0);
      const bId = Number(b.gworksParcelId || 0);
      return bId - aId || (a.sequence || 0) - (b.sequence || 0);
    });
  }
  usage();
}

function screen({ fetch, limit, retryFailed, strategy }) {
  const tracker = loadTracker();
  const eligible = sortForStrategy(tracker.candidates
    .filter(candidate => shouldScreen(candidate, { fetch, retryFailed }))
    .filter(candidate => fetch || fs.existsSync(path.join(ROOT, candidate.gworksPdfPath))), strategy)
    .slice(0, limit || 100);

  for (const candidate of eligible) {
    Object.assign(candidate, screenCandidate(candidate, { fetch }));
    saveTracker(tracker);
  }

  saveTracker(tracker);
  printSummary(tracker);
  console.log(JSON.stringify({
    screened: eligible.map(candidate => ({
      sourceParcelId: candidate.sourceParcelId,
      status: candidate.status,
      groupKey: candidate.groupKey,
      groupConfidence: candidate.groupConfidence,
      situsAddress: candidate.situsAddress,
      propertyClass: candidate.propertyClass,
      taxDistrict: candidate.taxDistrict,
      rejectedReason: candidate.rejectedReason
    }))
  }, null, 2));
}

function addParcels({ parcels, targets, name }) {
  if (!parcels.length) usage();
  const tracker = loadTracker();
  const expectedTargets = targets.filter(target => target !== "auto");
  const existingKeys = new Set(tracker.candidates.flatMap(candidate => [
    candidate.sourceParcelId,
    candidate.gworksParcelId,
    candidate.ntoParcelId
  ].filter(Boolean)));
  const nextSequence = Math.max(0, ...tracker.candidates.map(candidate => Number(candidate.sequence) || 0)) + 1;
  const added = [];
  const skipped = [];

  parcels.forEach((parcel, index) => {
    const gworksParcelId = normalizeGworksParcelId(parcel);
    const sourceParcelId = sourceIdFromGworks(gworksParcelId);
    const ntoParcelId = normalizeNtoParcelId(gworksParcelId);
    if (existingKeys.has(sourceParcelId) || existingKeys.has(gworksParcelId) || existingKeys.has(ntoParcelId)) {
      skipped.push({ parcel, reason: "already tracked" });
      return;
    }
    const candidate = {
      ...candidateBase({
        sequence: nextSequence + added.length + index,
        sourceParcelId,
        gworksParcelId,
        candidateSource: "manual_gis",
        probeName: name || "manual-gis"
      }),
      expectedGroupKey: expectedTargets[0] || null,
      expectedGroupKeys: expectedTargets,
      status: "source_candidate",
      sampleVisibility: "research"
    };
    tracker.candidates.push(candidate);
    existingKeys.add(sourceParcelId);
    existingKeys.add(gworksParcelId);
    existingKeys.add(ntoParcelId);
    added.push(candidate);
  });

  saveTracker(tracker);
  console.log(JSON.stringify({
    added: added.map(candidate => ({
      sourceParcelId: candidate.sourceParcelId,
      gworksParcelId: candidate.gworksParcelId,
      expectedGroupKey: candidate.expectedGroupKey,
      probeName: candidate.probeName
    })),
    skipped
  }, null, 2));
}

function screenNamed({ fetch, name, limit }) {
  if (!name) usage();
  const tracker = loadTracker();
  const statusOrder = new Map([
    ["source_candidate", 0],
    ["rejected_download_failed", 1],
    ["rejected_pdf_parse_failed", 2],
    ["rejected_unclassified", 3],
    ["screened_needs_review", 4],
    ["screened_candidate", 5]
  ]);
  const eligible = tracker.candidates
    .filter(candidate => candidate.probeName === name)
    .filter(candidate => ["source_candidate", "rejected_download_failed", "rejected_pdf_parse_failed", "rejected_unclassified", "screened_candidate", "screened_needs_review"].includes(candidate.status))
    .sort((a, b) => (statusOrder.get(a.status) ?? 9) - (statusOrder.get(b.status) ?? 9) || (a.sequence || 0) - (b.sequence || 0))
    .slice(0, limit || 100);

  for (const candidate of eligible) {
    Object.assign(candidate, screenCandidate(candidate, { fetch }));
    saveTracker(tracker);
  }

  saveTracker(tracker);
  console.log(JSON.stringify({
    screened: eligible.map(candidate => ({
      sourceParcelId: candidate.sourceParcelId,
      status: candidate.status,
      expectedGroupKey: candidate.expectedGroupKey,
      groupKey: candidate.groupKey,
      groupConfidence: candidate.groupConfidence,
      situsAddress: candidate.situsAddress,
      propertyClass: candidate.propertyClass,
      taxDistrict: candidate.taxDistrict,
      rejectedReason: candidate.rejectedReason
    }))
  }, null, 2));
  printSummary(tracker);
}

function candidatePriority(candidate) {
  const statusWeight = candidate.status === "screened_candidate" ? 0 : 1;
  const taxDistrict = Number(candidate.taxDistrict || 0);
  return [statusWeight, taxDistrict, candidate.sequence || 0];
}

function next({ group, limit }) {
  const tracker = loadTracker();
  const candidates = tracker.candidates
    .filter(candidate => ["screened_candidate", "screened_needs_review"].includes(candidate.status))
    .filter(candidate => !group || candidate.groupKey === group)
    .sort((a, b) => {
      const ap = candidatePriority(a);
      const bp = candidatePriority(b);
      return ap[0] - bp[0] || ap[1] - bp[1] || ap[2] - bp[2];
    })
    .slice(0, limit || 20);

  console.log(JSON.stringify(candidates.map(candidate => ({
    sourceParcelId: candidate.sourceParcelId,
    gworksParcelId: candidate.gworksParcelId,
    ntoParcelId: candidate.ntoParcelId,
    groupKey: candidate.groupKey,
    groupConfidence: candidate.groupConfidence,
    assignmentNotes: candidate.assignmentNotes,
    propertyClass: candidate.propertyClass,
    situsAddress: candidate.situsAddress,
    taxDistrict: candidate.taxDistrict,
    schoolDistrict: candidate.schoolDistrict,
    gworksPdfPath: candidate.gworksPdfPath,
    ingestCommand: [
      "node scripts/ingest-record.js",
      candidate.gworksPdfPath,
      `--valuation-group "${candidate.assignedValuationGroup}"`,
      `--market-area "${candidate.assignedMarketArea}"`,
      `--market-group "${candidate.assignedMarketGroup}"`,
      "--sample-visibility research",
      "--update-manifest"
    ].join(" ")
  })), null, 2));
}

function build({ group, limit }) {
  if (!group) {
    throw new Error("build requires --group so records are added deliberately.");
  }

  const tracker = loadTracker();
  const candidates = tracker.candidates
    .filter(candidate => ["screened_candidate", "screened_needs_review"].includes(candidate.status))
    .filter(candidate => candidate.groupKey === group)
    .sort((a, b) => {
      const ap = candidatePriority(a);
      const bp = candidatePriority(b);
      return ap[0] - bp[0] || ap[1] - bp[1] || ap[2] - bp[2];
    })
    .slice(0, limit || 20);

  for (const [index, candidate] of candidates.entries()) {
    console.log(`[${index + 1}/${candidates.length}] ${candidate.groupKey} ${candidate.ntoParcelId} ${candidate.situsAddress || ""}`.trim());
    try {
      const output = execFileSync(process.execPath, [
        "scripts/ingest-record.js",
        candidate.gworksPdfPath,
        "--valuation-group",
        candidate.assignedValuationGroup,
        "--market-area",
        candidate.assignedMarketArea,
        "--market-group",
        candidate.assignedMarketGroup,
        "--sample-visibility",
        "research",
        "--update-manifest"
      ], {
        cwd: ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "inherit"],
        timeout: 240000
      });
      const generated = JSON.parse(output);
      Object.assign(candidate, {
        status: "built_research",
        builtAt: new Date().toISOString(),
        manifestId: generated.manifestId,
        recordCardPath: generated.recordCardPath,
        capturePath: path.relative(ROOT, generated.capturePath),
        directAppUrl: generated.directAppUrl,
        assets: generated.assets,
        sampleVisibility: "research",
        rejectedReason: null
      });
      saveTracker(tracker);
      console.log(JSON.stringify(generated, null, 2));
    } catch (error) {
      const details = [
        error.message,
        error.stdout?.toString?.(),
        error.stderr?.toString?.()
      ].filter(Boolean).join("\n");
      const captureFailed = error.code === "ETIMEDOUT"
        || error.signal === "SIGTERM"
        || /capture-nto-statements|nebraskataxesonline|ETIMEDOUT|timed out/i.test(details);
      Object.assign(candidate, {
        status: captureFailed ? "rejected_nto_capture_failed" : "rejected_build_failed",
        rejectedAt: new Date().toISOString(),
        rejectedReason: details
      });
      saveTracker(tracker);
      console.error(JSON.stringify({
        failed: candidate.sourceParcelId,
        status: candidate.status,
        error: error.message
      }, null, 2));
    }
  }

  printSummary(tracker);
}

function parseRecordClass(recordCard) {
  return normalizedClass(
    recordCard?.guidedSnapshot?.classification?.propertyClass
    || recordCard?.guidedSnapshot?.parcel?.accountType
  );
}

function manifestRecordPath(manifestId) {
  if (!manifestId) return null;
  const manifest = readJson(MANIFEST_PATH, { properties: [] });
  const property = (manifest.properties || []).find(entry => entry.id === manifestId);
  return property?.recordCardPath || null;
}

function auditCandidate(candidate, catalog) {
  const flags = [];
  const pdfPath = path.join(ROOT, candidate.gworksPdfPath || "");
  const candidateRecordCardPath = candidate.recordCardPath || manifestRecordPath(candidate.manifestId);
  const recordPath = path.join(ROOT, candidateRecordCardPath || "");
  let parsed = null;
  let rawHeuristic = null;
  let recordCard = null;
  let recordGroup = null;
  let recordClass = null;
  let taxYearsCaptured = [];
  const capturePath = path.join(ROOT, "research/nto-captures", `${candidate.ntoParcelId}-2025-nto-capture.json`);

  if (!candidateRecordCardPath || !fs.existsSync(recordPath)) {
    flags.push("missing-record-card");
  } else {
    recordCard = readJson(recordPath, null);
    recordGroup = classifyRecordCard(recordCard, catalog);
    recordClass = parseRecordClass(recordCard);
    if (recordGroup?.key && recordGroup.key !== candidate.groupKey) {
      flags.push("record-card-group-mismatch");
    }
  }

  if (!candidate.gworksPdfPath || !fs.existsSync(pdfPath)) {
    flags.push("missing-gworks-pdf");
  } else {
    parsed = parsePdf(pdfPath);
    const parsedClass = normalizedClass(parsed.classification?.propertyClass || parsed.accountType);
    rawHeuristic = classifyParsed(parsed, catalog);
    if (candidate.propertyClass && parsedClass !== candidate.propertyClass) {
      flags.push("tracker-pdf-class-mismatch");
    }
    if (recordClass && parsedClass !== recordClass) {
      flags.push("record-pdf-class-mismatch");
    }
    if (rawHeuristic.groupKey && rawHeuristic.groupKey !== candidate.groupKey) {
      flags.push("pdf-heuristic-group-mismatch");
    }
    if (parsedClass === "Agricultural") {
      const agAssignment = agMarketArea(parsed);
      if (agAssignment.groupKey && agAssignment.groupKey !== candidate.groupKey) {
        flags.push("ag-ro-boundary-mismatch");
      }
    }
  }

  if (candidate.expectedGroupKey && candidate.expectedGroupKey !== candidate.groupKey) {
    flags.push("expected-group-mismatch");
  }
  if (candidate.groupConfidence === "gis-filter") {
    flags.push("gis-filter-override");
  }
  if (`${candidate.groupConfidence || ""}`.startsWith("review")) {
    flags.push("screened-needs-review");
  }
  if (!fs.existsSync(capturePath)) {
    flags.push("missing-nto-capture");
  } else {
    const capture = readJson(capturePath, {});
    taxYearsCaptured = [...new Set((capture.detailRecords || []).map(record => record.year).filter(Boolean))].sort();
    const expectedYears = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
    const missingYears = expectedYears.filter(year => !taxYearsCaptured.includes(year));
    if (missingYears.length) flags.push("short-nto-history");
  }

  const trustedExpectedOverride = candidate.groupConfidence === "gis-filter"
    && candidate.expectedGroupKey
    && candidate.expectedGroupKey === candidate.groupKey;
  const blockingFlags = flags.filter(flag => {
    if (flag === "gis-filter-override" && trustedExpectedOverride) return false;
    if (flag === "pdf-heuristic-group-mismatch" && trustedExpectedOverride) return false;
    return true;
  });

  return {
    manifestId: candidate.manifestId || null,
    sourceParcelId: candidate.sourceParcelId,
    gworksParcelId: candidate.gworksParcelId,
    ntoParcelId: candidate.ntoParcelId,
    status: candidate.status,
    assignedGroup: candidate.groupKey || null,
    expectedGroup: candidate.expectedGroupKey || null,
    groupConfidence: candidate.groupConfidence || null,
    owner: candidate.owner || parsed?.owner || null,
    situsAddress: candidate.situsAddress || parsed?.situsAddress || null,
    taxDistrict: candidate.taxDistrict || parsed?.taxDistrict || null,
    schoolDistrict: candidate.schoolDistrict || parsed?.schoolDistrict || null,
    propertyClass: candidate.propertyClass || null,
    recordGroup: recordGroup?.key || null,
    recordClass,
    taxYearsCaptured,
    pdfHeuristicGroup: rawHeuristic?.groupKey || null,
    pdfHeuristicConfidence: rawHeuristic?.confidence || null,
    pdfHeuristicNotes: rawHeuristic?.notes || null,
    assignmentNotes: candidate.assignmentNotes || null,
    recordCardPath: candidateRecordCardPath || null,
    gworksPdfPath: candidate.gworksPdfPath || null,
    flags,
    blockingFlags,
    auditStatus: blockingFlags.length ? "review" : "clean"
  };
}

function auditBuilt({ group, limit }) {
  const tracker = loadTracker();
  const catalog = groupCatalog();
  const candidates = tracker.candidates
    .filter(candidate => ["built_research", "built_public"].includes(candidate.status))
    .filter(candidate => !group || candidate.groupKey === group)
    .sort((a, b) => (a.groupKey || "").localeCompare(b.groupKey || "", undefined, { numeric: true }) || (a.sequence || 0) - (b.sequence || 0))
    .slice(0, limit || 10000);

  const rows = candidates.map(candidate => auditCandidate(candidate, catalog));
  const countsByAuditStatus = rows.reduce((counts, row) => {
    counts[row.auditStatus] = (counts[row.auditStatus] || 0) + 1;
    return counts;
  }, {});
  const countsByFlag = rows.flatMap(row => row.flags).reduce((counts, flag) => {
    counts[flag] = (counts[flag] || 0) + 1;
    return counts;
  }, {});
  const output = {
    generatedAt: new Date().toISOString(),
    trackerPath: path.relative(ROOT, TRACKER_PATH),
    group: group || null,
    audited: rows.length,
    countsByAuditStatus,
    countsByFlag,
    rows
  };
  writeJson(AUDIT_PATH, output);
  console.log(JSON.stringify({
    auditPath: path.relative(ROOT, AUDIT_PATH),
    audited: output.audited,
    countsByAuditStatus,
    countsByFlag,
    reviewRows: rows.filter(row => row.auditStatus === "review").map(row => ({
      manifestId: row.manifestId,
      assignedGroup: row.assignedGroup,
      pdfHeuristicGroup: row.pdfHeuristicGroup,
      flags: row.flags,
      blockingFlags: row.blockingFlags,
      assignmentNotes: row.assignmentNotes
    }))
  }, null, 2));
}

function countsByStatus(tracker) {
  return tracker.candidates.reduce((counts, candidate) => {
    counts[candidate.status] = (counts[candidate.status] || 0) + 1;
    return counts;
  }, {});
}

function groupSummaries(tracker) {
  const catalog = groupCatalog();
  const summaries = [...catalog.values()].map(group => ({
    groupKey: group.key,
    label: `${group.class} ${group.valuationGroup}`,
    target: group.target,
    built: 0,
    screened: 0,
    needsReview: 0,
    totalPotential: 0,
    shortfall: group.target
  }));
  const byKey = new Map(summaries.map(summary => [summary.groupKey, summary]));

  for (const candidate of tracker.candidates) {
    if (!candidate.groupKey || !byKey.has(candidate.groupKey)) continue;
    const summary = byKey.get(candidate.groupKey);
    if (candidate.status === "built_research" || candidate.status === "built_public") summary.built += 1;
    if (candidate.status === "screened_candidate") summary.screened += 1;
    if (candidate.status === "screened_needs_review") summary.needsReview += 1;
  }

  for (const summary of summaries) {
    summary.totalPotential = summary.built + summary.screened + summary.needsReview;
    summary.shortfall = Math.max(0, summary.target - summary.totalPotential);
  }

  return summaries.sort((a, b) => {
    if (a.target === 0 && b.target !== 0) return 1;
    if (b.target === 0 && a.target !== 0) return -1;
    return a.groupKey.localeCompare(b.groupKey, undefined, { numeric: true });
  });
}

function printSummary(tracker = loadTracker()) {
  const summaries = groupSummaries(tracker);
  console.log(JSON.stringify({
    trackerPath: path.relative(ROOT, TRACKER_PATH),
    totalCandidates: tracker.candidates.length,
    targetPerGroup: tracker.target.targetPerGroup,
    counts: countsByStatus(tracker),
    groups: summaries
  }, null, 2));
}

function main() {
  const args = parseArgs(process.argv);
  if (args.command === "init") return init();
  if (args.command === "screen-local") return screen({ fetch: false, limit: args.limit, retryFailed: args.retryFailed, strategy: args.strategy });
  if (args.command === "fetch-screen") return screen({ fetch: true, limit: args.limit, retryFailed: args.retryFailed, strategy: args.strategy });
  if (args.command === "add-parcels") return addParcels({ parcels: args.parcels, targets: args.targets, name: args.name });
  if (args.command === "fetch-named") return screenNamed({ fetch: true, name: args.name, limit: args.limit });
  if (args.command === "screen-named") return screenNamed({ fetch: false, name: args.name, limit: args.limit });
  if (args.command === "next") return next({ group: args.group, limit: args.limit });
  if (args.command === "build") return build({ group: args.group, limit: args.limit });
  if (args.command === "audit-built") return auditBuilt({ group: args.group, limit: args.limit });
  if (args.command === "summary") return printSummary();
  usage();
}

if (require.main === module) {
  main();
}
