import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

const require = createRequire(import.meta.url);

const DEFAULT_TARGETS = [
  {
    name: "protest-evidence-guide",
    out: "assets/guides/before-you-walk-into-a-property-protest.pdf",
    path: "/articles/before-you-walk-into-a-property-protest/"
  },
  {
    name: "protest-paradox",
    out: "assets/guides/assessment-up-protest-denied-taxes.pdf",
    path: "/articles/assessment-up-protest-denied-taxes/"
  }
];

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const bundledPlaywrightPath = join(
      process.env.HOME || "",
      ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
    );
    return require(bundledPlaywrightPath);
  }
}

function loadPdfLib() {
  try {
    return require("pdf-lib");
  } catch {
    return require(join(
      process.env.HOME || "",
      ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pdf-lib",
    ));
  }
}

function parseArgs(argv) {
  const args = {
    baseUrl: "http://127.0.0.1:4173",
    out: "",
    targets: DEFAULT_TARGETS,
    url: ""
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--base-url") {
      args.baseUrl = argv[index + 1];
      index += 1;
    } else if (value === "--url") {
      args.url = argv[index + 1];
      index += 1;
    } else if (value === "--out") {
      args.out = argv[index + 1];
      index += 1;
    }
  }

  if (args.url || args.out) {
    if (!args.url || !args.out) {
      throw new Error("--url and --out must be provided together for single-PDF generation.");
    }
    args.targets = [{ name: "custom", out: args.out, url: args.url }];
  }

  return args;
}

function targetUrl(target, baseUrl) {
  if (target.url) return target.url;
  return new URL(target.path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).href;
}

function pageHasRenderableResources(pdfDoc, page, PDFName) {
  const resourcesRef = page.node.get(PDFName.of("Resources"));
  if (!resourcesRef) return false;

  const resources = pdfDoc.context.lookup(resourcesRef);
  return ["Font", "XObject", "Pattern"].some((key) => Boolean(resources.get(PDFName.of(key))));
}

async function trimTrailingBlankPages(outputPath) {
  const { PDFDocument, PDFName } = loadPdfLib();
  const pdfDoc = await PDFDocument.load(await readFile(outputPath));
  let trimmedPages = 0;

  while (pdfDoc.getPageCount() > 1) {
    const lastIndex = pdfDoc.getPageCount() - 1;
    const lastPage = pdfDoc.getPage(lastIndex);
    if (pageHasRenderableResources(pdfDoc, lastPage, PDFName)) break;

    pdfDoc.removePage(lastIndex);
    trimmedPages += 1;
  }

  if (trimmedPages > 0) {
    await writeFile(outputPath, await pdfDoc.save());
  }

  return {
    pageCount: pdfDoc.getPageCount(),
    trimmedPages
  };
}

const { chromium } = await loadPlaywright();
const chromePath = process.env.CHROME_EXECUTABLE_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({
  ...(existsSync(chromePath) ? { executablePath: chromePath } : {}),
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
});

try {
  const { baseUrl, targets } = parseArgs(process.argv.slice(2));
  const outputs = [];

  for (const target of targets) {
    const url = targetUrl(target, baseUrl);
    const outputPath = resolve(target.out);
    mkdirSync(dirname(outputPath), { recursive: true });

    const page = await browser.newPage({
      viewport: { width: 1440, height: 1600 },
      deviceScaleFactor: 1
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForLoadState("load", { timeout: 60000 });
    await page.emulateMedia({ media: "print" });
    await page.evaluate(() => document.fonts?.ready);

    await page.pdf({
      path: outputPath,
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: {
        top: "0.55in",
        right: "0.55in",
        bottom: "0.6in",
        left: "0.55in"
      }
    });

    await page.close();
    const pdfState = await trimTrailingBlankPages(outputPath);
    outputs.push({ name: target.name, outputPath, url, ...pdfState });
  }

  console.log(JSON.stringify({ outputs }, null, 2));
} finally {
  await browser.close();
}
