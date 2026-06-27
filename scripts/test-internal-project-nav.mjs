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

function countParam(url, name) {
  return [...new URL(url, "http://127.0.0.1").searchParams.keys()].filter(key => key === name).length;
}

const baseUrl = process.argv[2] || "http://127.0.0.1:4186";
const artifactDir = process.argv[3] || "/private/tmp/gpr-internal-nav-test";
const trackingQuery = "?invite=max-protest-guide-20260627&gpr_track=max-protest-guide-20260627&gpr_person=max-quattromani&gpr_label=max-internal-review&utm_source=max&utm_medium=tracked-link&utm_campaign=protest-guide-review";
const propertyTrackingQuery = `${trackingQuery}&property=residential-011312000&view=property`;
const articlePath = "/articles/before-you-walk-into-a-property-protest/";
const chromePath = process.env.CHROME_EXECUTABLE_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const { chromium } = await loadPlaywright();

mkdirSync(artifactDir, { recursive: true });

const browser = await chromium.launch({
  ...(existsSync(chromePath) ? { executablePath: chromePath } : {}),
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"]
});

async function newPage(viewport = { width: 1280, height: 1000 }) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1
  });
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
    await page.goto(`${baseUrl}/index.html${propertyTrackingQuery}`, { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    const helperResults = await page.evaluate(async ({ baseUrl, propertyTrackingQuery }) => {
      const projectNav = await import("/src/ges/project-nav.js");
      const currentUrl = `${baseUrl}/index.html${propertyTrackingQuery}`;
      const options = {
        currentUrl,
        baseUrl: `${baseUrl}/index.html`
      };

      return {
        hasPresent: projectNav.hasInternalTrackingParam(currentUrl),
        hasAbsent: projectNav.hasInternalTrackingParam(`${baseUrl}/index.html?gpr_person=public`),
        noQuery: projectNav.appendTrackingParam("articles/before-you-walk-into-a-property-protest/", options),
        existingQuery: projectNav.appendTrackingParam("index.html?article=levy-compression", options),
        hash: projectNav.appendTrackingParam("index.html?article=levy-compression#calculatorTitle", options),
        external: projectNav.appendTrackingParam("https://example.com/project", options),
        mailto: projectNav.appendTrackingParam("mailto:max@example.com", options),
        pdf: projectNav.appendTrackingParam("assets/guides/before-you-walk-into-a-property-protest.pdf", options),
        duplicate: projectNav.appendTrackingParam("index.html?gpr_person=max-quattromani", options),
        internalProject: projectNav.isInternalProjectUrl("boe-tracker/", options),
        externalProject: projectNav.isInternalProjectUrl("https://example.com/project", options)
      };
    }, { baseUrl, propertyTrackingQuery });

    assert.equal(helperResults.hasPresent, true, "internal mode should detect approved Max tracking parameter");
    assert.equal(helperResults.hasAbsent, false, "internal mode should reject other gpr_person values");
    assert.match(helperResults.noQuery, /^\/articles\/before-you-walk-into-a-property-protest\/\?/);
    assert.match(helperResults.noQuery, /gpr_person=max-quattromani/);
    assert.match(helperResults.noQuery, /property=residential-011312000/);
    assert.match(helperResults.noQuery, /view=property/);
    assert.match(helperResults.existingQuery, /^\/index\.html\?article=levy-compression&/);
    assert.match(helperResults.hash, /#calculatorTitle$/);
    assert.match(helperResults.hash, /gpr_person=max-quattromani/);
    assert.equal(helperResults.external, "https://example.com/project");
    assert.equal(helperResults.mailto, "mailto:max@example.com");
    assert.equal(helperResults.pdf, "assets/guides/before-you-walk-into-a-property-protest.pdf");
    assert.equal(countParam(helperResults.duplicate, "gpr_person"), 1, "tracking parameter should not be duplicated");
    assert.equal(helperResults.internalProject, true);
    assert.equal(helperResults.externalProject, false);
    await context.close();
  }

  {
    const { context, page } = await newPage();
    await page.goto(`${baseUrl}${articlePath}`, { waitUntil: "domcontentloaded" });
    await waitForApp(page);
    await page.locator(".gpr-global-header .ges-project-nav__trigger").first().waitFor({ timeout: 10000 });
    assert.equal(await page.locator(".gpr-global-header").count(), 1, "public article should get the shared global header");
    assert.equal(await page.locator(".gpr-global-header .ges-theme-toggle").count(), 1, "public article should get the shared visual mode switcher");
    await context.close();
  }

  {
    const { context, page } = await newPage();
    await page.goto(`${baseUrl}${articlePath}${propertyTrackingQuery}`, { waitUntil: "domcontentloaded" });
    await waitForApp(page);
    const trigger = page.locator(".ges-project-nav__trigger").first();
    const menu = page.locator(".ges-project-nav__menu").first();
    await trigger.waitFor({ timeout: 10000 });

    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    await trigger.click();
    assert.equal(await trigger.getAttribute("aria-expanded"), "true");
    assert.equal(await menu.isVisible(), true);
    const drawers = page.locator(".ges-project-nav__drawer-trigger");
    assert.ok(await drawers.count() >= 5, "project nav should organize links into typed drawers");
    assert.equal(await drawers.first().getAttribute("aria-expanded"), "true", "first drawer should open by default");
    assert.ok(await page.locator(".ges-project-nav__link").count() >= 10, "project nav should expose major project links");

    const experimentsDrawer = page.locator(".ges-project-nav__drawer-trigger", { hasText: "Experiments" });
    await experimentsDrawer.click();
    assert.equal(await drawers.first().getAttribute("aria-expanded"), "false", "opening one drawer should close the previous drawer");
    assert.equal(await experimentsDrawer.getAttribute("aria-expanded"), "true");
    assert.equal(await page.locator(".ges-project-nav__drawer-panel[data-open]").count(), 1, "only one drawer should be open at a time");

    const collapsedLinksTabbable = await page.locator(".ges-project-nav__drawer-panel:not([data-open]) a[href]").evaluateAll(links =>
      links.some(link => link.getAttribute("tabindex") !== "-1")
    );
    assert.equal(collapsedLinksTabbable, false, "collapsed drawer links should be removed from tab order");

    const hrefs = await page.locator(".ges-project-nav__link").evaluateAll(links => links.map(link => link.getAttribute("href")));
    assert.ok(hrefs.every(href => href.includes("gpr_person=max-quattromani")), "all dropdown links preserve gpr_person");
    assert.ok(hrefs.every(href => href.includes("gpr_track=max-protest-guide-20260627")), "all dropdown links preserve gpr_track");
    assert.ok(hrefs.every(href => href.includes("property=residential-011312000")), "all dropdown links preserve selected property");
    assert.ok(hrefs.every(href => href.includes("view=property")), "all dropdown links preserve direct property view");

    await page.keyboard.press("Escape");
    assert.equal(await trigger.getAttribute("aria-expanded"), "false", "Escape should close the menu");

    await trigger.focus();
    await page.keyboard.press("Enter");
    assert.equal(await trigger.getAttribute("aria-expanded"), "true", "keyboard activation should open the menu");
    await page.mouse.click(1000, 900);
    assert.equal(await trigger.getAttribute("aria-expanded"), "false", "outside click should close the menu");

    await trigger.click();
    await page.locator(".ges-project-nav__drawer-trigger", { hasText: "Parcel Review" }).click();
    await page.screenshot({ path: join(artifactDir, "article-light-desktop.png"), fullPage: false });
    await context.close();
  }

  {
    const { context, page } = await newPage();
    await page.goto(`${baseUrl}${articlePath}${trackingQuery}`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.setItem("ges-theme-preference", "dark"));
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForApp(page);
    await page.locator("[data-ges-theme-option=\"dark\"]").first().click();
    assert.equal(await page.locator("[data-ges-theme-option=\"dark\"]").first().getAttribute("aria-pressed"), "true");
    await page.locator(".ges-project-nav__trigger").first().click();

    const colors = await page.locator(".ges-project-nav__menu").first().evaluate(element => {
      const styles = getComputedStyle(element);
      return {
        background: styles.backgroundColor,
        color: styles.color
      };
    });
    assert.notEqual(colors.background, "rgba(0, 0, 0, 0)");
    assert.notEqual(colors.color, "rgba(0, 0, 0, 0)");
    await page.screenshot({ path: join(artifactDir, "article-dark-desktop.png"), fullPage: false });
    await context.close();
  }

  {
    const { context, page } = await newPage({ width: 390, height: 1000 });
    await page.goto(`${baseUrl}${articlePath}${trackingQuery}`, { waitUntil: "domcontentloaded" });
    await waitForApp(page);
    await page.locator(".ges-project-nav__trigger").first().click();

    const metrics = await page.locator(".ges-project-nav__menu").first().evaluate(element => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        viewportWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth
      };
    });
    assert.ok(metrics.left >= 0, "mobile menu should stay inside the left viewport edge");
    assert.ok(metrics.right <= metrics.viewportWidth + 1, "mobile menu should stay inside the right viewport edge");
    assert.ok(metrics.scrollWidth <= metrics.viewportWidth + 1, "mobile menu should not create horizontal overflow");
    await page.screenshot({ path: join(artifactDir, "article-mobile.png"), fullPage: false });
    await context.close();
  }

  {
    const { context, page } = await newPage();
    await page.goto(`${baseUrl}/index.html${trackingQuery}`, { waitUntil: "domcontentloaded" });
    await waitForApp(page);
    await page.locator(".gpr-global-header .ges-project-nav__trigger").first().waitFor({ timeout: 10000 });
    assert.equal(await page.locator(".gpr-global-header").count(), 1, "main guide should get the shared global header");
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(`Global project nav checks passed. Screenshots: ${artifactDir}`);
