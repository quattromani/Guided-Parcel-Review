#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const {
  ntoCandidates,
  parsePdf,
  recordId
} = require("./prepare-record-ingestion");

function usage() {
  console.error([
    "Usage: node scripts/ingest-record.js /path/to/parcel.pdf [--update-manifest] [--skip-nto-capture]",
    "       node scripts/ingest-record.js /path/to/parcel.pdf [--valuation-group 3] [--market-area \"Beatrice & Beatrice Subs\"]",
    "",
    "This runs the standard ingestion pipeline:",
    "  1. Parse the GWorks PDF",
    "  2. Capture 2019-current NTO statement details",
    "  3. Generate the draft record card",
    "  4. Optionally add/update the manifest entry"
  ].join("\n"));
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    pdfPath: null,
    valuationGroup: null,
    marketArea: null,
    marketGroup: null,
    updateManifest: false,
    skipNtoCapture: false
  };

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--update-manifest") {
      args.updateManifest = true;
    } else if (value === "--skip-nto-capture") {
      args.skipNtoCapture = true;
    } else if (value === "--valuation-group") {
      args.valuationGroup = argv[++index];
    } else if (value === "--market-area") {
      args.marketArea = argv[++index];
    } else if (value === "--market-group") {
      args.marketGroup = argv[++index];
    } else if (!args.pdfPath) {
      args.pdfPath = value;
    } else {
      usage();
    }
  }

  if (!args.pdfPath) usage();
  return args;
}

function runNodeScript(scriptPath, args) {
  return execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"]
  });
}

function main() {
  const args = parseArgs(process.argv);
  const pdfPath = path.resolve(args.pdfPath);
  if (!fs.existsSync(pdfPath)) throw new Error(`PDF not found: ${pdfPath}`);

  const parsed = parsePdf(pdfPath);
  const candidate = parsed.ntoParcelId || ntoCandidates(parsed.parcelId)[0];
  const capturePath = path.resolve("research/nto-captures", `${candidate}-2025-nto-capture.json`);

  if (!args.skipNtoCapture) {
    runNodeScript("scripts/capture-nto-statements.js", [candidate]);
  } else if (!fs.existsSync(capturePath)) {
    throw new Error(`--skip-nto-capture was provided, but no capture exists at ${capturePath}`);
  }

  const generateArgs = [pdfPath, "--nto-capture", capturePath];
  if (args.valuationGroup) generateArgs.push("--valuation-group", args.valuationGroup);
  if (args.marketArea) generateArgs.push("--market-area", args.marketArea);
  if (args.marketGroup) generateArgs.push("--market-group", args.marketGroup);
  if (args.updateManifest) generateArgs.push("--update-manifest");
  const output = runNodeScript("scripts/generate-record-card.js", generateArgs);
  const generated = JSON.parse(output);

  console.log(JSON.stringify({
    parcelId: parsed.parcelId,
    ntoParcelId: candidate,
    manifestId: recordId(parsed),
    capturePath,
    ...generated
  }, null, 2));
}

main();
