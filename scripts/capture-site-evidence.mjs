import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { extname, join } from "node:path";

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

const { chromium } = await loadPlaywright();

const url = process.argv[2];
const outDir = process.argv[3];

if (!url || !outDir) {
  console.error("Usage: node scripts/capture-site-evidence.mjs <url> <out-dir>");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
mkdirSync(join(outDir, "images"), { recursive: true });

const timestamp = new Date().toISOString();
const chromePath = process.env.CHROME_EXECUTABLE_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({
  ...(existsSync(chromePath) ? { executablePath: chromePath } : {}),
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 1400 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
const responses = [];

page.on("response", (response) => {
  responses.push({
    url: response.url(),
    status: response.status(),
    contentType: response.headers()["content-type"] || "",
  });
});

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(2500);

const finalUrl = page.url();
const title = await page.title();
const html = await page.content();
const text = await page.evaluate(() => document.body.innerText);

writeFileSync(join(outDir, "page.html"), html);
writeFileSync(join(outDir, "page-text.txt"), text);

await page.screenshot({
  path: join(outDir, "screenshot-full-page.png"),
  fullPage: true,
});

await page.screenshot({
  path: join(outDir, "screenshot-visible-1440x1400.png"),
  fullPage: false,
});

await page.addStyleTag({
  content: `
    #codex-capture-url-banner {
      position: fixed;
      z-index: 2147483647;
      top: 0;
      left: 0;
      right: 0;
      padding: 10px 14px;
      background: #fff7c7;
      color: #111;
      border-bottom: 1px solid #7a6d21;
      font: 13px/1.35 Arial, sans-serif;
      box-sizing: border-box;
    }
    body { padding-top: 42px !important; }
  `,
});
await page.evaluate(({ finalUrl, timestamp }) => {
  const banner = document.createElement("div");
  banner.id = "codex-capture-url-banner";
  banner.textContent = `Reference screenshot captured ${timestamp} from ${finalUrl}`;
  document.body.prepend(banner);
}, { finalUrl, timestamp });
await page.screenshot({
  path: join(outDir, "screenshot-visible-url-stamped-1440x1400.png"),
  fullPage: false,
});

await page.pdf({
  path: join(outDir, "full-page.pdf"),
  format: "Letter",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: `<div style="font-size:9px;width:100%;padding:0 18px;color:#444;">Captured ${timestamp} from ${finalUrl}</div>`,
  footerTemplate: `<div style="font-size:9px;width:100%;padding:0 18px;color:#444;"><span class="pageNumber"></span>/<span class="totalPages"></span></div>`,
  margin: { top: "0.45in", bottom: "0.45in", left: "0.35in", right: "0.35in" },
});

const imageSources = await page.evaluate(() => {
  const values = new Set();
  document.querySelectorAll("img").forEach((img) => {
    if (img.currentSrc) values.add(img.currentSrc);
    if (img.src) values.add(img.src);
  });
  document.querySelectorAll("[style]").forEach((el) => {
    const style = el.getAttribute("style") || "";
    for (const match of style.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
      values.add(new URL(match[1], location.href).href);
    }
  });
  return [...values].map((src) => new URL(src, location.href).href);
});

const downloadedImages = [];
for (let index = 0; index < imageSources.length; index += 1) {
  const src = imageSources[index];
  try {
    const response = await page.request.get(src, { timeout: 30000 });
    if (!response.ok()) {
      downloadedImages.push({ src, status: response.status(), savedAs: null });
      continue;
    }
    const body = await response.body();
    const contentType = response.headers()["content-type"] || "";
    const fromUrl = extname(new URL(src).pathname).split("?")[0];
    const extension = fromUrl || (contentType.includes("png") ? ".png" : contentType.includes("webp") ? ".webp" : ".jpg");
    const hash = createHash("sha256").update(body).digest("hex").slice(0, 12);
    const filename = `image-${String(index + 1).padStart(2, "0")}-${hash}${extension}`;
    writeFileSync(join(outDir, "images", filename), body);
    downloadedImages.push({
      src,
      status: response.status(),
      contentType,
      bytes: body.length,
      savedAs: `images/${filename}`,
      sha256: createHash("sha256").update(body).digest("hex"),
    });
  } catch (error) {
    downloadedImages.push({ src, error: String(error), savedAs: null });
  }
}

const links = await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => ({
  text: a.innerText.trim(),
  href: new URL(a.getAttribute("href"), location.href).href,
})));

const metadata = {
  capturedAt: timestamp,
  requestedUrl: url,
  finalUrl,
  title,
  userAgent: await page.evaluate(() => navigator.userAgent),
  viewport: { width: 1440, height: 1400 },
  imageSources,
  downloadedImages,
  links,
  responses,
};

writeFileSync(join(outDir, "capture-metadata.json"), JSON.stringify(metadata, null, 2));

await browser.close();

console.log(JSON.stringify({
  outDir,
  finalUrl,
  title,
  imageCount: downloadedImages.filter((image) => image.savedAs).length,
}, null, 2));
