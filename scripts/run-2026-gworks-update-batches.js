#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.cwd();
const MANIFEST_PATH = path.join(ROOT, "data/app/property-manifest.json");
const BATCH_ROOT = "research/gworks-pdfs/assessment-2026-batches";
const VISIBILITY = "research";

function usage() {
  console.error([
    "Usage: node scripts/run-2026-gworks-update-batches.js [--limit 40] [--max-batches 3] [--no-force]",
    "",
    "Runs sequential GWorks scrape/update batches for research records that still",
    "need the 2026 assessment layer. Stops on scrape failures."
  ].join("\n"));
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    limit: 40,
    maxBatches: null,
    force: true
  };

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--limit") {
      args.limit = Number(argv[++index]);
    } else if (value === "--max-batches") {
      args.maxBatches = Number(argv[++index]);
    } else if (value === "--no-force") {
      args.force = false;
    } else {
      usage();
    }
  }

  if (!Number.isInteger(args.limit) || args.limit < 1) usage();
  if (args.maxBatches !== null && (!Number.isInteger(args.maxBatches) || args.maxBatches < 1)) usage();
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function researchNeeding2026() {
  const manifest = readJson(MANIFEST_PATH);
  return (manifest.properties || [])
    .filter(property => property.county === "gage")
    .filter(property => property.sampleVisibility === VISIBILITY)
    .filter(property => property.recordCardStatus === "available")
    .filter(property => property.recordCardPath)
    .filter(property => {
      const recordPath = path.join(ROOT, property.recordCardPath);
      if (!fs.existsSync(recordPath)) return false;
      const recordCard = readJson(recordPath);
      return recordCard.guidedSnapshot?.snapshotYear !== 2026;
    });
}

function nextBatchNumber() {
  const absoluteRoot = path.join(ROOT, BATCH_ROOT);
  if (!fs.existsSync(absoluteRoot)) return 1;
  const numbers = fs.readdirSync(absoluteRoot)
    .map(name => name.match(/^batch-(\d+)$/)?.[1])
    .filter(Boolean)
    .map(Number);
  return numbers.length ? Math.max(...numbers) + 1 : 1;
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

function auditHasFailures(auditPath) {
  const audit = readJson(path.join(ROOT, auditPath));
  return (audit.rows || []).some(row => row.status === "failed");
}

function main() {
  const args = parseArgs(process.argv);
  const completed = [];
  let batchNumber = nextBatchNumber();

  while (true) {
    const remaining = researchNeeding2026().length;
    if (!remaining) break;
    if (args.maxBatches !== null && completed.length >= args.maxBatches) break;

    const batchName = `batch-${String(batchNumber).padStart(3, "0")}`;
    const outDir = `${BATCH_ROOT}/${batchName}`;
    const batchLimit = Math.min(args.limit, remaining);
    const scrapeAuditPath = `${outDir}/gworks-scrape-audit.json`;
    const updateAuditPath = `${outDir}/value-update-audit.json`;

    console.error(`\n=== ${batchName}: ${batchLimit} of ${remaining} remaining ===`);
    run("node", [
      "scripts/scrape-public-gworks.js",
      "--visibility", VISIBILITY,
      "--only-needs-2026",
      "--limit", String(batchLimit),
      "--out-dir", outDir,
      "--audit-name", "gworks-scrape-audit.json",
      ...(args.force ? ["--force"] : [])
    ]);

    if (auditHasFailures(scrapeAuditPath)) {
      throw new Error(`${batchName} has scrape failures; stopping before update`);
    }

    run("node", [
      "scripts/update-public-2026-values.js",
      "--visibility", VISIBILITY,
      "--audit-path", scrapeAuditPath,
      "--out", updateAuditPath
    ]);

    run("node", ["scripts/validate-data-contracts.js"]);
    completed.push(batchName);
    batchNumber += 1;
  }

  console.log(JSON.stringify({
    completed,
    remaining: researchNeeding2026().length
  }, null, 2));
}

main();
