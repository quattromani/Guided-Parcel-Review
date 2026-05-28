#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const DEFAULT_COUNTY_ID = "3";
const DEFAULT_TAX_YEAR = "2025";
const DEFAULT_FROM_YEAR = "2019";
const DEFAULT_OUTPUT_DIR = "research/nto-captures";
const DEFAULT_CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function usage() {
  console.error([
    "Usage: node scripts/capture-nto-statements.js <nto-parcel-id> [--county 3] [--tax-year 2025] [--out research/nto-captures]",
    "       node scripts/capture-nto-statements.js <nto-parcel-id> [--from-year 2019]",
    "",
    "Environment overrides:",
    "  PLAYWRIGHT_MODULE=/absolute/path/to/playwright",
    "  CHROME_EXECUTABLE=/absolute/path/to/chrome"
  ].join("\n"));
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    parcelId: null,
    countyId: DEFAULT_COUNTY_ID,
    taxYear: DEFAULT_TAX_YEAR,
    fromYear: DEFAULT_FROM_YEAR,
    outputDir: DEFAULT_OUTPUT_DIR
  };

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--county") {
      args.countyId = argv[++index];
    } else if (value === "--tax-year") {
      args.taxYear = argv[++index];
    } else if (value === "--from-year") {
      args.fromYear = argv[++index];
    } else if (value === "--out") {
      args.outputDir = argv[++index];
    } else if (!args.parcelId) {
      args.parcelId = value;
    } else {
      usage();
    }
  }

  if (!args.parcelId) usage();
  return args;
}

function requirePlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_MODULE,
    "playwright",
    path.join(process.env.HOME || "", ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright")
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch (_error) {
      // Try the next candidate.
    }
  }

  throw new Error("Could not load Playwright. Set PLAYWRIGHT_MODULE to the installed playwright package path.");
}

function normalizeWhitespace(value) {
  return value.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
}

function ntoUrl({ countyId, parcelId, taxYear }) {
  return `https://nebraskataxesonline.us/County/${countyId}/Property/${parcelId}/Type/1/TaxYear/${taxYear}`;
}

function extractRecordText(pageText, year) {
  const start = pageText.indexOf(`TAX YEAR RECORD\n${year}`);
  if (start === -1) return null;

  const endMarkers = [
    "\nMAKE A PAYMENT",
    "\nPRINT",
    "\nSTATEMENT HISTORY",
    "\nView Details"
  ];
  const end = endMarkers
    .map(marker => pageText.indexOf(marker, start + 1))
    .filter(index => index > start)
    .sort((a, b) => a - b)[0];

  return normalizeWhitespace(pageText.slice(start, end || start + 6000));
}

async function getStatementRows(page) {
  return page.locator("tr").evaluateAll(rows => rows
    .map((row, rowIndex) => ({
      rowIndex,
      text: row.innerText
    }))
    .filter(row => /\b20\d{2}\b/.test(row.text) && /VIEW DETAILS/i.test(row.text)));
}

async function clickDetailsForVisibleRow(page, visibleRowIndex) {
  const rows = page.locator("tr").filter({ hasText: /VIEW DETAILS/i });
  const row = rows.nth(visibleRowIndex);
  const button = row.locator("button, a").filter({ hasText: /VIEW DETAILS/i }).first();
  await button.click();
}

async function goToStatementPage(page, pageNumber) {
  for (let index = 1; index < pageNumber; index += 1) {
    const next = page.locator("button, a").filter({ hasText: /Next/i }).last();
    if (await next.count() === 0) return false;
    const disabled = await next.evaluate(element =>
      element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true" || element.classList.contains("disabled")
    ).catch(() => false);
    if (disabled) return false;
    await next.click();
    await page.waitForTimeout(800);
  }
  return true;
}

async function capture(args) {
  const { chromium } = requirePlaywright();
  const executablePath = process.env.CHROME_EXECUTABLE || DEFAULT_CHROME_PATH;
  const launchOptions = {
    headless: true,
    args: ["--disable-gpu", "--no-sandbox"]
  };

  if (fs.existsSync(executablePath)) {
    launchOptions.executablePath = executablePath;
  }

  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const url = ntoUrl(args);
  const detailRecords = [];
  const statementPages = [];
  const seenYears = new Set();

  for (let statementPage = 1; statementPage <= 4; statementPage += 1) {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(1200);
    const reachedPage = await goToStatementPage(page, statementPage);
    if (!reachedPage) break;

    const pageText = await page.evaluate(() => document.body.innerText);
    const rows = await getStatementRows(page);
    if (!rows.length && statementPage > 1) break;
    const yearsOnPage = rows
      .map(row => Number(row.text.match(/\b(20\d{2})\b/)?.[1]))
      .filter(Boolean);

    statementPages.push({
      page: statementPage,
      text: normalizeWhitespace(pageText),
      rows: rows.map(row => normalizeWhitespace(row.text))
    });

    if (yearsOnPage.length && yearsOnPage.every(year => year < Number(args.fromYear))) {
      break;
    }

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const year = rows[rowIndex].text.match(/\b(20\d{2})\b/)?.[1];
      if (!year || seenYears.has(year)) continue;
      if (Number(year) < Number(args.fromYear)) continue;
      seenYears.add(year);

      await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForTimeout(800);
      await goToStatementPage(page, statementPage);
      await clickDetailsForVisibleRow(page, rowIndex);
      await page.waitForTimeout(1200);

      const detailText = await page.evaluate(() => document.body.innerText);
      detailRecords.push({
        year: Number(year),
        text: extractRecordText(detailText, year) || normalizeWhitespace(detailText)
      });
    }
  }

  await browser.close();

  return {
    capturedAt: new Date().toISOString(),
    source: "Nebraska Taxes Online",
    countyId: args.countyId,
    parcelId: args.parcelId,
    taxYear: Number(args.taxYear),
    fromYear: Number(args.fromYear),
    url,
    statementPages,
    detailRecords: detailRecords.sort((a, b) => b.year - a.year)
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const outputDir = path.resolve(args.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  const result = await capture(args);
  const outputPath = path.join(outputDir, `${args.parcelId}-${args.taxYear}-nto-capture.json`);
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);

  console.log(JSON.stringify({
    outputPath,
    url: result.url,
    statementPages: result.statementPages.length,
    yearsCaptured: result.detailRecords.map(record => record.year)
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
