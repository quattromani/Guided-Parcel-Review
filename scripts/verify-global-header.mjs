import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
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

const baseUrl = process.argv[2] || "http://127.0.0.1:4173";
const artifactDir = process.argv[3] || "/private/tmp/gpr-global-header-verify";
const trackingQuery = "invite=max-protest-guide-20260627&gpr_track=max-protest-guide-20260627&gpr_person=max-quattromani&gpr_label=max-internal-review&utm_source=max&utm_medium=tracked-link&utm_campaign=global-header&property=residential-011312000&view=property";
const chromePath = process.env.CHROME_EXECUTABLE_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const { chromium } = await loadPlaywright();

const pages = [
  "/",
  "/home/",
  "/articles/before-you-walk-into-a-property-protest/",
  "/articles/assessment-up-protest-denied-taxes/",
  "/boe-tracker/",
  "/experiments/",
  "/experiments/valuation-group-overview.html",
  "/experiments/vg-aggregate.html",
  "/experiments/the-protest-paradox.html",
  "/ges/",
  "/research/texas-hays-110-abasolo-preview.html"
];

const viewports = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "mobile", width: 390, height: 900 }
];

mkdirSync(artifactDir, { recursive: true });

const browser = await chromium.launch({
  ...(existsSync(chromePath) ? { executablePath: chromePath } : {}),
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"]
});

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1
    });

    for (const pagePath of pages) {
      const page = await context.newPage();
      const pageErrors = [];
      page.on("pageerror", error => pageErrors.push(error.message));

      const url = withTracking(`${baseUrl}${pagePath}`);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(1200);

      const initial = await page.evaluate(() => {
        const header = document.querySelector(".gpr-global-header");
        const trigger = document.querySelector(".gpr-global-header .ges-project-nav__trigger");
        const themeButtons = [...document.querySelectorAll(".gpr-global-header [data-ges-theme-option]")];
        const headerRect = header?.getBoundingClientRect();

        return {
          headerCount: document.querySelectorAll(".gpr-global-header").length,
          triggerCount: document.querySelectorAll(".gpr-global-header .ges-project-nav__trigger").length,
          themeButtonCount: themeButtons.length,
          darkPressed: document.querySelector('.gpr-global-header [data-ges-theme-option="dark"]')?.getAttribute("aria-pressed"),
          headerTop: headerRect?.top ?? null,
          headerBottom: headerRect?.bottom ?? null,
          horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          triggerExpanded: trigger?.getAttribute("aria-expanded")
        };
      });

      assert.equal(initial.headerCount, 1, `${pagePath} ${viewport.name}: expected one global header`);
      assert.equal(initial.triggerCount, 1, `${pagePath} ${viewport.name}: expected one house nav trigger`);
      assert.equal(initial.themeButtonCount, 2, `${pagePath} ${viewport.name}: expected visual mode switcher`);
      assert.equal(initial.triggerExpanded, "false", `${pagePath} ${viewport.name}: nav starts collapsed`);
      assert.ok(initial.horizontalOverflow <= 1, `${pagePath} ${viewport.name}: initial horizontal overflow`);

      await page.locator(".gpr-global-header .ges-project-nav__trigger").click();

      const openState = await page.evaluate(() => {
        const menu = document.querySelector(".gpr-global-header .ges-project-nav__menu");
        const trigger = document.querySelector(".gpr-global-header .ges-project-nav__trigger");
        const rect = menu?.getBoundingClientRect();
        const hrefs = [...document.querySelectorAll(".gpr-global-header .ges-project-nav__link")].map(link => link.href);

        return {
          expanded: trigger?.getAttribute("aria-expanded"),
          hidden: menu?.hidden,
          menuLeft: rect?.left ?? null,
          menuRight: rect?.right ?? null,
          menuTop: rect?.top ?? null,
          menuBottom: rect?.bottom ?? null,
          viewportWidth: document.documentElement.clientWidth,
          viewportHeight: window.innerHeight,
          linkCount: hrefs.length,
          hrefs,
          horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
        };
      });

      assert.equal(openState.expanded, "true", `${pagePath} ${viewport.name}: trigger opens menu`);
      assert.equal(openState.hidden, false, `${pagePath} ${viewport.name}: menu visible`);
      assert.ok(openState.linkCount >= 10, `${pagePath} ${viewport.name}: menu exposes project links`);
      assert.ok(openState.menuLeft >= -1, `${pagePath} ${viewport.name}: menu inside left viewport`);
      assert.ok(openState.menuRight <= openState.viewportWidth + 1, `${pagePath} ${viewport.name}: menu inside right viewport`);
      assert.ok(openState.menuBottom <= openState.viewportHeight + 1, `${pagePath} ${viewport.name}: menu inside lower viewport`);
      assert.ok(openState.horizontalOverflow <= 1, `${pagePath} ${viewport.name}: menu horizontal overflow`);
      assert.ok(openState.hrefs.every(href => href.includes("gpr_track=max-protest-guide-20260627")), `${pagePath} ${viewport.name}: nav links preserve tracking`);
      assert.ok(openState.hrefs.every(href => href.includes("property=residential-011312000")), `${pagePath} ${viewport.name}: nav links preserve property`);
      assert.ok(openState.hrefs.every(href => href.includes("view=property")), `${pagePath} ${viewport.name}: nav links preserve direct view`);

      await page.keyboard.press("Escape");
      assert.equal(await page.locator(".gpr-global-header .ges-project-nav__trigger").getAttribute("aria-expanded"), "false", `${pagePath} ${viewport.name}: escape closes menu`);

      await page.locator('.gpr-global-header [data-ges-theme-option="dark"]').click();
      const darkState = await page.evaluate(() => ({
        selected: document.documentElement.dataset.gesTheme,
        resolved: document.documentElement.dataset.gesThemeResolved,
        darkPressed: document.querySelector('.gpr-global-header [data-ges-theme-option="dark"]')?.getAttribute("aria-pressed")
      }));
      assert.equal(darkState.selected, "dark", `${pagePath} ${viewport.name}: dark mode selected`);
      assert.equal(darkState.resolved, "dark", `${pagePath} ${viewport.name}: dark mode resolved`);
      assert.equal(darkState.darkPressed, "true", `${pagePath} ${viewport.name}: dark button pressed`);

      await page.evaluate(() => window.scrollTo(0, Math.min(600, document.documentElement.scrollHeight)));
      await page.waitForTimeout(100);

      const stickyState = await page.evaluate(() => {
        const header = document.querySelector(".gpr-global-header");
        const guided = document.querySelector(".guide-review-header");
        const boeLeft = document.querySelector(".boe-left-column");
        const headerRect = header?.getBoundingClientRect();
        const guidedRect = guided?.getBoundingClientRect();
        const boeRect = boeLeft?.getBoundingClientRect();

        return {
          headerTop: headerRect?.top ?? null,
          headerBottom: headerRect?.bottom ?? null,
          guidedTop: guidedRect?.top ?? null,
          boeTop: boeRect?.top ?? null
        };
      });

      assert.ok(stickyState.headerTop === null || stickyState.headerTop >= -1, `${pagePath} ${viewport.name}: header sticky top`);
      if (stickyState.guidedTop !== null && stickyState.headerBottom !== null) {
        assert.ok(stickyState.guidedTop >= stickyState.headerBottom - 1, `${pagePath} ${viewport.name}: guided header clears global header`);
      }
      if (viewport.name === "desktop" && stickyState.boeTop !== null && stickyState.headerBottom !== null) {
        assert.ok(stickyState.boeTop >= stickyState.headerBottom - 1, `${pagePath} ${viewport.name}: BOE sticky column clears global header`);
      }

      if (pageErrors.length) {
        throw new Error(`${pagePath} ${viewport.name}: page errors: ${pageErrors.join("; ")}`);
      }

      await page.screenshot({
        path: join(artifactDir, `${safeName(pagePath)}-${viewport.name}.png`),
        fullPage: false
      });
      await page.close();
    }

    await context.close();
  }
} finally {
  await browser.close();
}

console.log(`Global header browser verification passed. Screenshots: ${artifactDir}`);

function withTracking(value) {
  const url = new URL(value);
  const params = new URLSearchParams(trackingQuery);
  params.forEach((paramValue, name) => url.searchParams.set(name, paramValue));
  return url.href;
}

function safeName(value) {
  if (value === "/") return "root";
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}
