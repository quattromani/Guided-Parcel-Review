#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { parsePdf } = require("./prepare-record-ingestion");

const ROOT = process.cwd();
const SOURCE_PATH = path.join(ROOT, "data/sources/assessor-7-128-change-parcel-ids.txt");
const MANIFEST_PATH = path.join(ROOT, "data/app/property-manifest.json");
const TRACKER_PATH = path.join(ROOT, "data/sampling/gage-vg3-sampling-tracker.json");
const PDF_DIR = path.join(ROOT, "research/gworks-pdfs/source-pdfs");
const GWORKS_REPORT_BASE = "https://report.gworks.com/report.ashx";
const TARGET_SAMPLE_COUNT = 130;

function usage() {
  console.error([
    "Usage:",
    "  node scripts/manage-vg3-sampling.js init",
    "  node scripts/manage-vg3-sampling.js screen-local [--limit 50]",
    "  node scripts/manage-vg3-sampling.js fetch-screen [--limit 25]",
    "  node scripts/manage-vg3-sampling.js build [--limit 5]",
    "  node scripts/manage-vg3-sampling.js next [--limit 20]",
    "  node scripts/manage-vg3-sampling.js summary",
    "",
    "This manages the Gage VG3 Beatrice residential research sample tracker."
  ].join("\n"));
  process.exit(1);
}

function parseArgs(argv) {
  const args = { command: argv[2], limit: null };
  for (let index = 3; index < argv.length; index += 1) {
    if (argv[index] === "--limit") {
      args.limit = Number(argv[++index]);
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

function manifestBuiltMap() {
  const manifest = readJson(MANIFEST_PATH, { properties: [] });
  const map = new Map();
  for (const property of manifest.properties || []) {
    const keys = [
      normalizeGworksParcelId(property.parcelId),
      normalizeNtoParcelId(property.parcelId)
    ].filter(Boolean);
    for (const key of keys) map.set(key, property);
  }
  return map;
}

function readSourceParcelIds() {
  return fs.readFileSync(SOURCE_PATH, "utf8")
    .split(/\s+/)
    .map(value => value.trim())
    .filter(Boolean);
}

function defaultTracker() {
  return {
    version: "0.1",
    project: "gage-vg3-beatrice-residential-sample",
    target: {
      valuationGroup: "VG 3 - Beatrice & Beatrice Subs",
      propertyClass: "Residential",
      targetSampleCount: TARGET_SAMPLE_COUNT,
      sourceDescription: "Assessor 7-128 change parcel list",
      sourcePath: path.relative(ROOT, SOURCE_PATH)
    },
    statusDefinitions: {
      source_candidate: "Parcel is in the 7-128 source list and has not been screened.",
      already_built: "Parcel already exists in the manifest.",
      screened_vg3_candidate: "GWorks PDF screens as a conservative Beatrice residential candidate.",
      queued_for_build: "Candidate selected for full NTO/GWorks record-card build.",
      built_research: "Record card is built and kept out of the public switcher.",
      built_public: "Record card is built and available in the public switcher.",
      rejected_build_failed: "Candidate failed during full NTO capture or record-card generation.",
      rejected_download_failed: "GWorks assessor PDF could not be downloaded.",
      rejected_pdf_parse_failed: "PDF downloaded but could not be parsed.",
      rejected_non_residential: "GWorks does not classify the parcel as residential.",
      rejected_rural_address: "Address looks rural/county-road rather than Beatrice street-grid.",
      rejected_unusable_address: "Address is missing or too ambiguous for VG3 proxy selection."
    },
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    candidates: []
  };
}

function loadTracker() {
  return readJson(TRACKER_PATH, defaultTracker());
}

function saveTracker(tracker) {
  tracker.updatedAt = new Date().toISOString();
  writeJson(TRACKER_PATH, tracker);
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

function init() {
  const existing = readJson(TRACKER_PATH, null);
  const built = manifestBuiltMap();
  const sourceIds = readSourceParcelIds();
  const candidateMap = new Map((existing?.candidates || []).map(candidate => [candidate.sourceParcelId, candidate]));

  const candidates = sourceIds.map((sourceParcelId, index) => {
    const gworksParcelId = normalizeGworksParcelId(sourceParcelId);
    const ntoParcelId = normalizeNtoParcelId(sourceParcelId);
    const manifestEntry = built.get(gworksParcelId) || built.get(ntoParcelId);
    const current = candidateMap.get(sourceParcelId) || {};
    const base = {
      sequence: index + 1,
      sourceParcelId,
      gworksParcelId,
      ntoParcelId,
      gworksPdfPath: path.relative(ROOT, gworksPdfPath(gworksParcelId)),
      gworksUrl: gworksUrl(gworksParcelId)
    };
    const manifestVisibility = manifestEntry?.sampleVisibility || "public";
    const builtStatus = manifestVisibility === "research" ? "built_research" : "built_public";
    const builtFields = manifestEntry ? {
      status: current.status?.startsWith("built_") ? current.status : builtStatus,
      manifestId: manifestEntry.id,
      recordCardPath: manifestEntry.recordCardPath,
      sampleVisibility: manifestVisibility
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
    "30",
    "-o",
    path.join(ROOT, candidate.gworksPdfPath),
    candidate.gworksUrl
  ], { stdio: ["ignore", "pipe", "pipe"] });
  return true;
}

function isResidential(parsed) {
  return `${parsed.classification?.propertyClass || parsed.accountType || ""}`.toLowerCase().includes("res");
}

function addressNumber(address) {
  const match = `${address || ""}`.trim().match(/^0*([0-9]{1,6})\b/);
  return match ? Number(match[1]) : null;
}

function isLikelyStreetGridAddress(address) {
  const value = `${address || ""}`.trim().replace(/\s+/g, " ").toUpperCase();
  if (!value) return false;
  const number = addressNumber(value);
  if (!number || number > 9999) return false;
  if (/\b(?:SW|SE|NW|NE)\b.*\b(?:RD|ROAD)\b/.test(value)) return false;
  if (/\b(?:RD|ROAD|HWY|HIGHWAY|RURAL ROUTE|COUNTY ROAD|STATE SPUR)\b/.test(value)) return false;
  return true;
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

  const screened = {
    parsedAt: new Date().toISOString(),
    owner: parsed.owner,
    situsAddress: parsed.situsAddress,
    propertyClass: parsed.classification?.propertyClass || parsed.accountType,
    accountType: parsed.accountType,
    taxDistrict: parsed.taxDistrict,
    schoolDistrict: parsed.schoolDistrict,
    legalDescription: parsed.legalDescription,
    pdfParcelId: parsed.parcelId,
    pdfNtoParcelId: parsed.ntoParcelId
  };

  if (!isResidential(parsed)) {
    return {
      ...screened,
      status: "rejected_non_residential",
      rejectedReason: "GWorks property class is not residential."
    };
  }

  if (!parsed.situsAddress) {
    return {
      ...screened,
      status: "rejected_unusable_address",
      rejectedReason: "GWorks PDF has no situs address."
    };
  }

  if (!isLikelyStreetGridAddress(parsed.situsAddress)) {
    return {
      ...screened,
      status: "rejected_rural_address",
      rejectedReason: "Situs address does not look like a conservative Beatrice street-grid address."
    };
  }

  return {
    ...screened,
    status: "screened_vg3_candidate",
    rejectedReason: null,
    sampleVisibility: "research",
    valuationGroup: "VG 3 - Beatrice & Beatrice Subs",
    marketArea: "Beatrice & Beatrice Subs"
  };
}

function shouldScreen(candidate) {
  return [
    "source_candidate",
    "rejected_download_failed",
    "rejected_pdf_parse_failed",
    "rejected_rural_address"
  ].includes(candidate.status);
}

function screen({ fetch, limit }) {
  const tracker = loadTracker();
  const eligible = tracker.candidates
    .filter(candidate => shouldScreen(candidate))
    .filter(candidate => fetch || fs.existsSync(path.join(ROOT, candidate.gworksPdfPath)))
    .slice(0, limit || 50);

  for (const candidate of eligible) {
    Object.assign(candidate, screenCandidate(candidate, { fetch }));
  }

  saveTracker(tracker);
  printSummary(tracker);
  const screened = eligible.map(candidate => ({
    sourceParcelId: candidate.sourceParcelId,
    status: candidate.status,
    situsAddress: candidate.situsAddress,
    propertyClass: candidate.propertyClass,
    rejectedReason: candidate.rejectedReason
  }));
  console.log(JSON.stringify({ screened }, null, 2));
}

function next(limit = 20) {
  const tracker = loadTracker();
  const candidates = tracker.candidates
    .filter(candidate => candidate.status === "screened_vg3_candidate")
    .slice(0, limit);
  console.log(JSON.stringify(candidates.map(candidate => ({
    sourceParcelId: candidate.sourceParcelId,
    gworksParcelId: candidate.gworksParcelId,
    ntoParcelId: candidate.ntoParcelId,
    situsAddress: candidate.situsAddress,
    gworksPdfPath: candidate.gworksPdfPath,
    ingestCommand: [
      "node scripts/ingest-record.js",
      candidate.gworksPdfPath,
      "--valuation-group \"VG 3 - Beatrice & Beatrice Subs\"",
      "--market-area \"Beatrice & Beatrice Subs\"",
      "--sample-visibility research",
      "--update-manifest"
    ].join(" ")
  })), null, 2));
}

function build({ limit }) {
  const tracker = loadTracker();
  const candidates = tracker.candidates
    .filter(candidate => candidate.status === "screened_vg3_candidate")
    .slice(0, limit || 5);

  for (const candidate of candidates) {
    try {
      const output = execFileSync(process.execPath, [
        "scripts/ingest-record.js",
        candidate.gworksPdfPath,
        "--valuation-group",
        "VG 3 - Beatrice & Beatrice Subs",
        "--market-area",
        "Beatrice & Beatrice Subs",
        "--sample-visibility",
        "research",
        "--update-manifest"
      ], {
        cwd: ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "inherit"]
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
      console.log(JSON.stringify({
        built: candidate.sourceParcelId,
        manifestId: candidate.manifestId,
        recordCardPath: candidate.recordCardPath
      }, null, 2));
    } catch (error) {
      Object.assign(candidate, {
        status: "rejected_build_failed",
        rejectedReason: error.message
      });
      saveTracker(tracker);
      console.error(JSON.stringify({
        failed: candidate.sourceParcelId,
        error: error.message
      }, null, 2));
    }
  }

  printSummary(tracker);
}

function countsByStatus(tracker) {
  return tracker.candidates.reduce((counts, candidate) => {
    counts[candidate.status] = (counts[candidate.status] || 0) + 1;
    return counts;
  }, {});
}

function printSummary(tracker = loadTracker()) {
  const counts = countsByStatus(tracker);
  const builtCount = (counts.built_research || 0) + (counts.built_public || 0) + (counts.already_built || 0);
  const screenedCount = counts.screened_vg3_candidate || 0;
  const builtAndScreenedCount = builtCount + screenedCount;
  console.log(JSON.stringify({
    trackerPath: path.relative(ROOT, TRACKER_PATH),
    totalCandidates: tracker.candidates.length,
    targetSampleCount: tracker.target.targetSampleCount,
    builtOrExisting: builtCount,
    screenedVg3Candidates: screenedCount,
    builtPlusScreenedCandidates: builtAndScreenedCount,
    remainingBuiltRecordsToTarget: Math.max(0, tracker.target.targetSampleCount - builtCount),
    remainingCandidateShortfall: Math.max(0, tracker.target.targetSampleCount - builtAndScreenedCount),
    counts
  }, null, 2));
}

function main() {
  const args = parseArgs(process.argv);
  if (args.command === "init") return init();
  if (args.command === "screen-local") return screen({ fetch: false, limit: args.limit });
  if (args.command === "fetch-screen") return screen({ fetch: true, limit: args.limit });
  if (args.command === "build") return build({ limit: args.limit });
  if (args.command === "next") return next(args.limit || 20);
  if (args.command === "summary") return printSummary();
  usage();
}

if (require.main === module) {
  main();
}
