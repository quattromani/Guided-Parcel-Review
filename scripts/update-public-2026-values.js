#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MANIFEST_PATH = path.join(ROOT, "data/app/property-manifest.json");
const DEFAULT_AUDIT_PATH = "research/gworks-pdfs/public-canary-2026/public-gworks-scrape-audit.json";
const DEFAULT_OUT_PATH = "research/gworks-pdfs/public-canary-2026/public-2026-value-update-audit.json";
const TARGET_YEAR = 2026;
const SOURCE_LABEL = "GWorks PDF";

function usage() {
  console.error([
    "Usage: node scripts/update-public-2026-values.js [--audit-path path] [--out path] [--visibility public|research|all] [--dry-run]",
    "",
    "Updates Gage record-card assessment values from a scrape audit.",
    "Tax statements remain on the latest finalized tax year."
  ].join("\n"));
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    auditPath: DEFAULT_AUDIT_PATH,
    outPath: DEFAULT_OUT_PATH,
    visibility: "public",
    dryRun: false
  };

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--audit-path") {
      args.auditPath = argv[++index];
    } else if (value === "--out") {
      args.outPath = argv[++index];
    } else if (value === "--visibility") {
      args.visibility = argv[++index];
    } else if (value === "--dry-run") {
      args.dryRun = true;
    } else {
      usage();
    }
  }

  if (!["public", "research", "all"].includes(args.visibility)) usage();
  return args;
}

function resolvePath(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(resolvePath(filePath), "utf8"));
}

function writeJson(filePath, data) {
  const absolutePath = resolvePath(filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(data, null, 2)}\n`);
}

function isNumeric(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function yearNumber(row) {
  return Number(row?.year);
}

function sortedValueRows(rows = []) {
  return rows
    .filter(row => Number.isInteger(yearNumber(row)) && isNumeric(row.total))
    .sort((a, b) => yearNumber(b) - yearNumber(a));
}

function rowOrder(rows = []) {
  const years = rows.map(row => yearNumber(row)).filter(Number.isInteger);
  if (years.length < 2) return "descending";
  return years[0] <= years[years.length - 1] ? "ascending" : "descending";
}

function upsertYearRow(rows, nextRow) {
  const existingIndex = rows.findIndex(row => yearNumber(row) === nextRow.year);
  if (existingIndex >= 0) {
    rows[existingIndex] = {
      ...rows[existingIndex],
      ...nextRow
    };
    return "updated";
  }

  if (rowOrder(rows) === "ascending") {
    rows.push(nextRow);
  } else {
    rows.unshift(nextRow);
  }
  return "inserted";
}

function valuePartsFromAudit(row) {
  return {
    year: TARGET_YEAR,
    dwelling: row.parsedLatestDwelling,
    land: row.parsedLatestLand,
    outbuilding: row.parsedLatestOutbuilding,
    total: row.parsedLatestTotal
  };
}

function cardValueFromParts(parts, note) {
  return {
    buildings: parts.dwelling,
    improvement: parts.outbuilding,
    landLots: parts.land,
    total: parts.total,
    ...(note ? { note } : {})
  };
}

function previousCardValue(recordCard) {
  const rows = [
    ...(recordCard.guidedSnapshot?.assessedValueBreakdown || []),
    ...(recordCard.valuationHistory || [])
  ];

  const prior = sortedValueRows(rows).find(row => yearNumber(row) < TARGET_YEAR);
  if (!prior) return recordCard.currentCardValue?.previous || null;

  return {
    buildings: prior.dwelling ?? prior.building ?? prior.buildings ?? null,
    improvement: prior.outbuilding ?? prior.other ?? prior.improvement ?? null,
    landLots: prior.land ?? prior.landLot ?? prior.landLots ?? null,
    total: prior.total
  };
}

function snapshotSummary(recordCard) {
  const current = recordCard.currentCardValue?.current || {};
  return {
    snapshotYear: recordCard.guidedSnapshot?.snapshotYear ?? null,
    latestFinalTaxYear: recordCard.guidedSnapshot?.latestFinalTaxYear ?? null,
    currentTotal: current.total ?? recordCard.propertyValuation?.total ?? null,
    currentLand: current.landLots ?? recordCard.propertyValuation?.landLot ?? null,
    currentDwelling: current.buildings ?? recordCard.propertyValuation?.buildings ?? null,
    currentOutbuilding: current.improvement ?? recordCard.propertyValuation?.improvement ?? null
  };
}

function removeGeneratedSourceEntries(recordCard) {
  const sources = recordCard.guidedSnapshot?.sources;
  if (!Array.isArray(sources)) return;

  recordCard.guidedSnapshot.sources = sources.filter(source => {
    return !(source
      && typeof source === "object"
      && source.label === "GWorks property report PDF"
      && `${source.value || ""}`.includes("property report fetched"));
  });
}

function updateRecordCard(recordCard, scrapeRow) {
  const parts = valuePartsFromAudit(scrapeRow);
  const required = [parts.dwelling, parts.land, parts.outbuilding, parts.total];
  if (scrapeRow.parsedLatestYear !== TARGET_YEAR || required.some(value => !isNumeric(value))) {
    return {
      status: "skipped",
      reason: "missing-usable-2026-values"
    };
  }

  recordCard.guidedSnapshot = recordCard.guidedSnapshot || {};
  recordCard.guidedSnapshot.snapshotYear = TARGET_YEAR;
  if (!recordCard.guidedSnapshot.latestFinalTaxYear || recordCard.guidedSnapshot.latestFinalTaxYear > 2025) {
    recordCard.guidedSnapshot.latestFinalTaxYear = 2025;
  }

  if (Array.isArray(recordCard.guidedSnapshot.taxpayerHistory)) {
    upsertYearRow(recordCard.guidedSnapshot.taxpayerHistory, {
      year: TARGET_YEAR,
      assessedValue: parts.total,
      taxes: null,
      status: "assessment-only",
      assessmentSource: SOURCE_LABEL
    });
  }

  if (Array.isArray(recordCard.guidedSnapshot.assessedValueBreakdown)) {
    upsertYearRow(recordCard.guidedSnapshot.assessedValueBreakdown, {
      ...parts,
      source: SOURCE_LABEL
    });
  }

  if (Array.isArray(recordCard.valuationHistory)) {
    upsertYearRow(recordCard.valuationHistory, {
      ...parts,
      source: SOURCE_LABEL
    });
  }

  const note = "2026 assessed values from the GWorks PDF. Latest finalized tax data remains 2025.";
  recordCard.currentCardValue = recordCard.currentCardValue || {};
  recordCard.currentCardValue.previous = previousCardValue(recordCard);
  recordCard.currentCardValue.current = cardValueFromParts(parts, note);

  recordCard.propertyValuation = {
    ...(recordCard.propertyValuation || {}),
    buildings: parts.dwelling,
    improvement: parts.outbuilding,
    landLot: parts.land,
    total: parts.total
  };

  if (recordCard.valuationReconciliation) {
    recordCard.valuationReconciliation.finalAssessedTotal = parts.total;
    recordCard.valuationReconciliation.finalDwellingValue = parts.dwelling;
    recordCard.valuationReconciliation.landLot = parts.land;
  }

  if (recordCard.landModel && Object.prototype.hasOwnProperty.call(recordCard.landModel, "recordedLotValue")) {
    recordCard.landModel.recordedLotValue = parts.land;
  }

  removeGeneratedSourceEntries(recordCard);

  return {
    status: "updated",
    reason: null
  };
}

function main() {
  const args = parseArgs(process.argv);
  const manifest = readJson(MANIFEST_PATH);
  const scrapeAudit = readJson(args.auditPath);
  const propertyById = new Map((manifest.properties || [])
    .filter(property => property.county === "gage")
    .filter(property => args.visibility === "all" || `${property.sampleVisibility || "public"}` === args.visibility)
    .map(property => [property.id, property]));

  const rows = [];
  const counts = {
    requested: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    reviewFlagged: 0
  };

  for (const scrapeRow of scrapeAudit.rows || []) {
    counts.requested += 1;
    const property = propertyById.get(scrapeRow.id);
    if (!property?.recordCardPath) {
      counts.skipped += 1;
      rows.push({
        id: scrapeRow.id,
        status: "skipped",
        reason: "public-manifest-record-not-found",
        scrapeStatus: scrapeRow.status,
        scrapeFlags: scrapeRow.flags || []
      });
      continue;
    }

    const recordPath = property.recordCardPath;
    const absoluteRecordPath = resolvePath(recordPath);
    const beforeText = fs.readFileSync(absoluteRecordPath, "utf8");
    const recordCard = JSON.parse(beforeText);
    const before = snapshotSummary(recordCard);
    const result = updateRecordCard(recordCard, scrapeRow);
    const after = snapshotSummary(recordCard);
    const nextText = `${JSON.stringify(recordCard, null, 2)}\n`;
    const changed = beforeText !== nextText;

    if (result.status === "skipped") {
      counts.skipped += 1;
    } else if (changed) {
      counts.updated += 1;
      if (!args.dryRun) fs.writeFileSync(absoluteRecordPath, nextText);
    } else {
      counts.unchanged += 1;
    }

    if ((scrapeRow.flags || []).length) counts.reviewFlagged += 1;

    rows.push({
      id: scrapeRow.id,
      parcelId: property.parcelId,
      recordCardPath: recordPath,
      scrapeStatus: scrapeRow.status,
      scrapeFlags: scrapeRow.flags || [],
      status: result.status === "skipped" ? "skipped" : changed ? "updated" : "unchanged",
      reason: result.reason,
      before,
      after,
      parsed: {
        year: scrapeRow.parsedLatestYear,
        land: scrapeRow.parsedLatestLand,
        dwelling: scrapeRow.parsedLatestDwelling,
        outbuilding: scrapeRow.parsedLatestOutbuilding,
        total: scrapeRow.parsedLatestTotal
      }
    });
  }

  const updateAudit = {
    generatedAt: new Date().toISOString(),
    dryRun: args.dryRun,
    targetYear: TARGET_YEAR,
    scrapeAuditPath: args.auditPath,
    visibility: args.visibility,
    counts,
    rows
  };

  writeJson(args.outPath, updateAudit);
  console.log(`Updated ${counts.updated}; unchanged ${counts.unchanged}; skipped ${counts.skipped}; review-flagged ${counts.reviewFlagged}.`);
  console.log(`Wrote ${args.outPath}`);
}

main();
