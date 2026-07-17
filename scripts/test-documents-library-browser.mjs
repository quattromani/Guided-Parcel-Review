import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const bundledPlaywrightPath = join(
      process.env.HOME || "",
      ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"
    );
    return require(bundledPlaywrightPath);
  }
}

const baseUrl = process.argv[2] || "http://127.0.0.1:4186";
const ownerQuery = "?invite=max-documents-20260710&gpr_track=max-documents-20260710&gpr_person=max-quattromani&gpr_label=max-documents-review";
const chromePath = process.env.CHROME_EXECUTABLE_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const { chromium } = await loadPlaywright();
const browser = await chromium.launch({
  ...(existsSync(chromePath) ? { executablePath: chromePath } : {}),
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"]
});

async function newPage(viewport = { width: 1280, height: 1000 }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on("pageerror", error => {
    throw error;
  });
  return { context, page };
}

async function waitForApp(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(900);
}

try {
  {
    const { context, page } = await newPage();
    await page.goto(`${baseUrl}/documents/`, { waitUntil: "domcontentloaded" });
    await waitForApp(page);
    assert.equal(await page.locator(".ges-field-kit-shell").count(), 0, "public Documents route should not mount the Field Kit");
    assert.equal(await page.locator("[data-document-id]").count(), 0, "public Documents route should not expose registrations");
    assert.match(await page.locator("main").innerText(), /does not deliver private office documents/i);
    await context.close();
  }

  {
    const { context, page } = await newPage();
    await page.goto(`${baseUrl}/documents/${ownerQuery}`, { waitUntil: "domcontentloaded" });
    await waitForApp(page);
    await page.locator(".ges-field-kit-shell").waitFor({ timeout: 10000 });
    const registration = page.locator("[data-document-id='operational-transition-plan']");
    await registration.waitFor({ timeout: 10000 });
    assert.match(await registration.innerText(), /Working Draft — private source/);
    assert.match(await registration.innerText(), /0\.3/);
    assert.match(await registration.innerText(), /Incoming Assessor/);
    const href = await registration.locator("a").getAttribute("href");
    assert.match(href, /gpr_person=max-quattromani/);
    assert.match(href, /gpr_track=max-documents-20260710/);
    await registration.locator("a").click();
    await page.waitForURL(/\/documents\/operational-transition-plan\/\?/, { timeout: 10000 });
    await waitForApp(page);
    assert.match(await page.locator("main").innerText(), /no approved rendered artifact/i);
    assert.match(await page.locator("main").innerText(), /Version: 0\.3/);
    assert.match(await page.locator("main").innerText(), /Audience: Incoming Assessor/);
    assert.match(await page.locator("main").innerText(), /Secondary audiences: Office staff/);
    assert.doesNotMatch(await page.content(), /Gage-County-Assessor-Office-Knowledge-System\.git/);
    await page.emulateMedia({ media: "print" });
    assert.equal(await page.locator("h1").isVisible(), true, "document reader should retain its heading in print media");
    await context.close();
  }

  {
    const { context, page } = await newPage({ width: 390, height: 900 });
    await page.goto(`${baseUrl}/documents/${ownerQuery}`, { waitUntil: "domcontentloaded" });
    await waitForApp(page);
    const metrics = await page.locator("html").evaluate(element => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      documentTitle: document.title
    }));
    assert.ok(metrics.scrollWidth <= metrics.viewportWidth + 1, "mobile Documents index should not overflow horizontally");
    assert.match(metrics.documentTitle, /Documents/);
    await context.close();
  }

  {
    const { context, page } = await newPage({ width: 768, height: 1024 });
    await page.goto(`${baseUrl}/documents/${ownerQuery}`, { waitUntil: "domcontentloaded" });
    await waitForApp(page);
    const metrics = await page.locator("html").evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth
    }));
    assert.ok(metrics.scrollWidth <= metrics.viewportWidth + 1, "tablet Documents index should not overflow horizontally");
    assert.equal(await page.locator("[data-document-id='operational-transition-plan']").count(), 1, "tablet Documents index should retain the registered document");
    await context.close();
  }

  {
    const { context, page } = await newPage();
    await page.addInitScript(() => localStorage.setItem("ges-theme-preference", "dark"));
    await page.goto(`${baseUrl}/documents/${ownerQuery}`, { waitUntil: "domcontentloaded" });
    await waitForApp(page);
    const theme = await page.locator("html").evaluate(element => ({
      resolved: element.dataset.gesThemeResolved,
      selected: element.dataset.gesTheme
    }));
    assert.equal(theme.selected, "dark", "Documents should retain the shared dark-mode preference");
    assert.equal(theme.resolved, "dark", "Documents should resolve the shared dark theme");
    await context.close();
  }
} finally {
  await browser.close();
}

console.log("Documents browser checks passed.");
