#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");
const { parsePdf } = require("./prepare-record-ingestion");

const ROOT = process.cwd();
const MANIFEST_PATH = path.join(ROOT, "data/app/property-manifest.json");
const TRACKER_PATH = path.join(ROOT, "data/sampling/gage-research-sampling-tracker.json");
const DEFAULT_OUT_DIR = "research/gworks-pdfs/public-canary-2026";
const DEFAULT_AUDIT_NAME = "public-gworks-scrape-audit.json";
const GWORKS_REPORT_BASE = "https://reports.gworks.com/report.ashx";
const GWORKS_USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

function usage() {
  console.error([
    "Usage: node scripts/scrape-public-gworks.js [--out-dir path] [--audit-name file] [--visibility public|research|all] [--limit 40] [--force] [--only-needs-2026]",
    "",
    "Downloads current Gage GWorks PDFs into an isolated folder, parses them,",
    "and writes a scrape audit JSON without changing record cards."
  ].join("\n"));
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    outDir: DEFAULT_OUT_DIR,
    auditName: DEFAULT_AUDIT_NAME,
    visibility: "public",
    limit: null,
    force: false,
    onlyNeeds2026: false
  };

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--out-dir") {
      args.outDir = argv[++index];
    } else if (value === "--audit-name") {
      args.auditName = argv[++index];
    } else if (value === "--visibility") {
      args.visibility = argv[++index];
    } else if (value === "--limit") {
      args.limit = Number(argv[++index]);
    } else if (value === "--force") {
      args.force = true;
    } else if (value === "--only-needs-2026") {
      args.onlyNeeds2026 = true;
    } else {
      usage();
    }
  }

  if (args.limit !== null && (!Number.isInteger(args.limit) || args.limit < 1)) usage();
  if (!["public", "research", "all"].includes(args.visibility)) usage();
  if (!args.auditName || args.auditName.includes("/") || args.auditName.includes("\\")) usage();
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeDigits(value) {
  return `${value ?? ""}`.replace(/\D/g, "");
}

function normalizeNtoParcelId(value) {
  const digits = normalizeDigits(value);
  if (!digits) return "";
  return digits.length < 10 ? digits.padStart(10, "0") : digits;
}

function normalizeComparableParcelId(value) {
  return normalizeDigits(value).replace(/^0+/, "") || "0";
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

function gageProperties({ visibility, onlyNeeds2026 }) {
  const manifest = readJson(MANIFEST_PATH);
  return (manifest.properties || [])
    .filter(property => property.county === "gage")
    .filter(property => visibility === "all" || `${property.sampleVisibility || "public"}` === visibility)
    .filter(property => property.recordCardStatus === "available")
    .filter(property => property.recordCardPath)
    .filter(property => {
      if (!onlyNeeds2026) return true;
      const recordPath = path.join(ROOT, property.recordCardPath);
      if (!fs.existsSync(recordPath)) return false;
      const recordCard = readJson(recordPath);
      return recordCard.guidedSnapshot?.snapshotYear !== 2026;
    });
}

function trackerMaps() {
  if (!fs.existsSync(TRACKER_PATH)) return { byManifestId: new Map(), byNtoParcelId: new Map() };

  const tracker = readJson(TRACKER_PATH);
  const byManifestId = new Map();
  const byNtoParcelId = new Map();

  for (const candidate of tracker.candidates || []) {
    if (candidate.manifestId) byManifestId.set(candidate.manifestId, candidate);
    if (candidate.ntoParcelId) byNtoParcelId.set(candidate.ntoParcelId, candidate);
  }

  return { byManifestId, byNtoParcelId };
}

function gworksParcelIdFor(property, recordCard, maps) {
  const ntoParcelId = normalizeNtoParcelId(
    recordCard.parcelIdentifiers?.taxOnlineParcelId
    || property.parcelId
  );
  const candidate = maps.byManifestId.get(property.id) || maps.byNtoParcelId.get(ntoParcelId);
  if (candidate?.gworksParcelId) return candidate.gworksParcelId;

  return recordCard.parcelIdentifiers?.parcelId
    || normalizeDigits(property.parcelId)
    || property.parcelId;
}

function latestValueRow(rows = []) {
  return rows
    .filter(row => Number.isInteger(row.year))
    .sort((a, b) => b.year - a.year)[0] || null;
}

function compareParsedToExisting({ property, recordCard, parsed, gworksParcelId }) {
  const existingLatest = latestValueRow(recordCard.valuationHistory);
  const parsedLatest = latestValueRow(parsed.assessedValues);
  const knownValueRows = [
    ...(recordCard.valuationHistory || []).map(row => ({ year: row.year, total: row.total, source: "valuationHistory" })),
    ...(recordCard.guidedSnapshot?.assessedValueBreakdown || []).map(row => ({ year: row.year, total: row.total, source: "assessedValueBreakdown" })),
    ...(recordCard.guidedSnapshot?.taxpayerHistory || []).map(row => ({ year: row.year, total: row.assessedValue, source: "taxpayerHistory" }))
  ].filter(row => Number.isInteger(row.year) && Number.isFinite(row.total));
  const priorKnownMatch = parsedLatest
    ? knownValueRows
      .filter(row => row.year < parsedLatest.year)
      .sort((a, b) => b.year - a.year)
      .find(row => row.total === parsedLatest.total)
    : null;
  const flags = [];
  const latestTotalChange = existingLatest?.total && parsedLatest?.total
    ? parsedLatest.total - existingLatest.total
    : null;
  const latestTotalChangePercent = existingLatest?.total && latestTotalChange !== null
    ? latestTotalChange / existingLatest.total
    : null;

  if (normalizeComparableParcelId(parsed.parcelId) !== normalizeComparableParcelId(gworksParcelId)) {
    flags.push("parsed-parcel-mismatch");
  }

  if (parsed.taxDistrict && property.taxDistrict && `${parsed.taxDistrict}` !== `${property.taxDistrict}`) {
    flags.push("tax-district-changed");
  }

  if (!parsed.assessedValues.length) {
    flags.push("no-assessed-values");
  }

  if (!parsed.assessedValues.some(row => row.year === 2026)) {
    flags.push("missing-2026-value");
  }

  if (parsedLatest && parsedLatest.total !== parsedLatest.land + parsedLatest.dwelling + parsedLatest.outbuilding) {
    flags.push("latest-components-do-not-sum");
  }

  if (existingLatest && parsedLatest && existingLatest.year === parsedLatest.year && existingLatest.total !== parsedLatest.total) {
    flags.push("same-year-total-changed");
  }

  if (latestTotalChangePercent !== null && Math.abs(latestTotalChangePercent) >= 0.3) {
    flags.push("material-total-change");
  }

  if (priorKnownMatch && existingLatest?.total !== parsedLatest?.total) {
    flags.push("parsed-latest-matches-prior-known-year");
  }

  return {
    existingSnapshotYear: recordCard.guidedSnapshot?.snapshotYear ?? null,
    existingLatestYear: existingLatest?.year ?? null,
    existingLatestTotal: existingLatest?.total ?? null,
    parsedParcelId: parsed.parcelId,
    parsedNtoParcelId: parsed.ntoParcelId,
    parsedTaxDistrict: parsed.taxDistrict,
    parsedPropertyClass: parsed.classification?.propertyClass || parsed.accountType || null,
    parsedLatestYear: parsedLatest?.year ?? null,
    parsedLatestTotal: parsedLatest?.total ?? null,
    parsedLatestLand: parsedLatest?.land ?? null,
    parsedLatestDwelling: parsedLatest?.dwelling ?? null,
    parsedLatestOutbuilding: parsedLatest?.outbuilding ?? null,
    latestTotalChange,
    latestTotalChangePercent,
    priorKnownMatch,
    flags
  };
}

async function fetchPdf(url) {
  const response = await fetch(url, {
    headers: {
      "Accept": "application/pdf,*/*",
      "User-Agent": GWORKS_USER_AGENT
    }
  });
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (!buffer.subarray(0, 4).equals(Buffer.from("%PDF"))) {
    throw new Error(`Response was not a PDF (${response.headers.get("content-type") || "unknown content type"})`);
  }

  return buffer;
}

async function scrapeOne(item, outDir, force) {
  const pdfPath = path.join(outDir, `${item.gworksParcelId}.pdf`);
  const relativePdfPath = path.relative(ROOT, pdfPath);
  const row = {
    id: item.property.id,
    parcelId: item.property.parcelId,
    gworksParcelId: item.gworksParcelId,
    url: gworksUrl(item.gworksParcelId),
    pdfPath: relativePdfPath,
    bytes: null,
    downloadMs: 0,
    parseMs: 0,
    status: "pending",
    flags: []
  };

  try {
    const startDownload = performance.now();
    if (force || !fs.existsSync(pdfPath)) {
      const buffer = await fetchPdf(row.url);
      fs.writeFileSync(pdfPath, buffer);
      row.bytes = buffer.byteLength;
      row.downloadStatus = "downloaded";
    } else {
      row.bytes = fs.statSync(pdfPath).size;
      row.downloadStatus = "cached";
    }
    row.downloadMs = Math.round(performance.now() - startDownload);

    const startParse = performance.now();
    const parsed = parsePdf(pdfPath);
    row.parseMs = Math.round(performance.now() - startParse);
    Object.assign(row, compareParsedToExisting({
      property: item.property,
      recordCard: item.recordCard,
      parsed,
      gworksParcelId: item.gworksParcelId
    }));
    row.flags = row.flags.concat(row.flagsFromCompare || []);
    row.status = row.flags.length ? "review" : "ok";
  } catch (error) {
    row.status = "failed";
    row.error = error.message;
  }

  return row;
}

async function main() {
  const args = parseArgs(process.argv);
  const absoluteOutDir = path.resolve(args.outDir);
  const auditPath = path.join(absoluteOutDir, args.auditName);
  fs.mkdirSync(absoluteOutDir, { recursive: true });

  const maps = trackerMaps();
  const properties = gageProperties(args).slice(0, args.limit || undefined);
  const items = properties.map(property => {
    const recordCard = readJson(path.join(ROOT, property.recordCardPath));
    return {
      property,
      recordCard,
      gworksParcelId: gworksParcelIdFor(property, recordCard, maps)
    };
  });

  const start = performance.now();
  const rows = [];

  for (const [index, item] of items.entries()) {
    process.stderr.write(`[${index + 1}/${items.length}] ${item.property.id} ${item.gworksParcelId}\n`);
    rows.push(await scrapeOne(item, absoluteOutDir, args.force));
  }

  const elapsedMs = Math.round(performance.now() - start);
  const countsByStatus = rows.reduce((counts, row) => {
    counts[row.status] = (counts[row.status] || 0) + 1;
    return counts;
  }, {});
  const countsByFlag = rows.flatMap(row => row.flags || []).reduce((counts, flag) => {
    counts[flag] = (counts[flag] || 0) + 1;
    return counts;
  }, {});
  const downloadedRows = rows.filter(row => row.downloadStatus === "downloaded");
  const output = {
    generatedAt: new Date().toISOString(),
    outDir: path.relative(ROOT, absoluteOutDir),
    auditPath: path.relative(ROOT, auditPath),
    visibility: args.visibility,
    onlyNeeds2026: args.onlyNeeds2026,
    requested: rows.length,
    elapsedMs,
    elapsedSeconds: Math.round(elapsedMs / 100) / 10,
    averageSecondsPerRecord: rows.length ? Math.round((elapsedMs / rows.length) / 100) / 10 : null,
    downloaded: downloadedRows.length,
    totalDownloadedBytes: downloadedRows.reduce((sum, row) => sum + (row.bytes || 0), 0),
    countsByStatus,
    countsByFlag,
    rows
  };

  fs.writeFileSync(auditPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(output, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
