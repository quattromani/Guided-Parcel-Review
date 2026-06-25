import { existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

const require = createRequire(import.meta.url);

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

function parseArgs(argv) {
  const args = {
    url: "http://127.0.0.1:4173/articles/before-you-walk-into-a-property-protest/",
    out: "assets/guides/before-you-walk-into-a-property-protest.pdf",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--url") {
      args.url = argv[index + 1];
      index += 1;
    } else if (value === "--out") {
      args.out = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

const { url, out } = parseArgs(process.argv.slice(2));
const outputPath = resolve(out);
mkdirSync(dirname(outputPath), { recursive: true });

const { chromium } = await loadPlaywright();
const chromePath = process.env.CHROME_EXECUTABLE_PATH || "";
const browser = await chromium.launch({
  ...(existsSync(chromePath) ? { executablePath: chromePath } : {}),
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
});

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1600 },
    deviceScaleFactor: 1,
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
      left: "0.55in",
    },
  });

  console.log(JSON.stringify({ outputPath, url }, null, 2));
} finally {
  await browser.close();
}
