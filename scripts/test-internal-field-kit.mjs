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

const baseUrl = process.argv[2] || "http://127.0.0.1:4186";
const artifactDir = process.argv[3] || "/private/tmp/gpr-field-kit-test";
const ownerTrackingQuery = "?invite=max-protest-guide-20260627&gpr_track=max-protest-guide-20260627&gpr_person=max-quattromani&gpr_label=max-internal-review&utm_source=max&utm_medium=tracked-link&utm_campaign=protest-guide-review";
const reviewerTrackingQuery = "?invite=reviewer-protest-guide-20260627&gpr_track=reviewer-protest-guide-20260627&gpr_person=demo-reviewer&gpr_label=reviewer-menu-only&utm_source=reviewer&utm_medium=tracked-link&utm_campaign=protest-guide-review";
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

async function ownerArticlePage(viewport) {
  const { context, page } = await newPage(viewport);
  await page.goto(`${baseUrl}${articlePath}${ownerTrackingQuery}#evidenceMatrixTitle`, { waitUntil: "domcontentloaded" });
  await waitForApp(page);
  await page.locator(".ges-field-kit-shell").waitFor({ timeout: 10000 });
  return { context, page };
}

async function expectPanelVisible(page, panelId, visible) {
  const panel = page.locator(`[data-ges-field-kit-panel="${panelId}"]`);
  assert.equal(await panel.isVisible(), visible, `${panelId} panel visibility`);
}

try {
  {
    const { context, page } = await newPage();
    await page.goto(`${baseUrl}${articlePath}`, { waitUntil: "domcontentloaded" });
    await waitForApp(page);
    assert.equal(await page.locator(".ges-field-kit-shell").count(), 0, "public article should not mount Field Kit");
    await context.close();
  }

  {
    const { context, page } = await newPage();
    await page.goto(`${baseUrl}${articlePath}${reviewerTrackingQuery}`, { waitUntil: "domcontentloaded" });
    await waitForApp(page);
    assert.equal(await page.locator(".ges-field-kit-shell").count(), 0, "non-owner tracked reviewer should not mount Field Kit");
    await context.close();
  }

  {
    const { context, page } = await ownerArticlePage();
    const shell = page.locator(".ges-field-kit-shell");
    const toolbar = page.locator(".ges-field-kit[role='toolbar']");
    await assert.doesNotReject(() => toolbar.waitFor({ timeout: 10000 }));
    assert.equal(await shell.count(), 1, "owner tracked URL should mount one Field Kit");
    assert.equal(await page.locator(".ges-field-kit__button").count(), 5, "Field Kit should expose five current tools");
    assert.equal(await page.locator('[data-ges-field-kit-tool="parcel-search"]').getAttribute("aria-label"), "Parcel Search");
    assert.equal(await page.locator('[data-ges-field-kit-tool="documents"]').getAttribute("aria-label"), "Documents");
    assert.equal(await page.locator('[data-ges-field-kit-tool="share"]').getAttribute("aria-label"), "Share Tracked Link");
    assert.equal(await page.locator('[data-ges-field-kit-tool="notes"]').getAttribute("aria-label"), "Quick Notes");
    assert.equal(await page.locator('[data-ges-field-kit-tool="inspector"]').getAttribute("aria-label"), "Component Inspector");
    await page.screenshot({ path: join(artifactDir, "field-kit-light.png"), fullPage: false });
    await context.close();
  }

  {
    const { context, page } = await ownerArticlePage();
    await page.locator('[data-ges-field-kit-tool="documents"]').click();
    await page.waitForURL(/\/documents\/\?/, { timeout: 10000 });
    await waitForApp(page);
    assert.match(page.url(), /gpr_person=max-quattromani/);
    assert.match(page.url(), /gpr_track=max-protest-guide-20260627/);
    assert.equal(await page.locator("[data-document-id='operational-transition-plan']").count(), 1, "Documents control should open the registered document library");
    await context.close();
  }

  {
    const { context, page } = await ownerArticlePage();
    const searchButton = page.locator('[data-ges-field-kit-tool="parcel-search"]');
    await searchButton.focus();
    await page.keyboard.press("Enter");
    await expectPanelVisible(page, "parcel-search", true);
    assert.equal(await searchButton.getAttribute("aria-expanded"), "true", "keyboard activation should open Parcel Search");

    const input = page.locator("[data-field-kit-search-input]");
    await input.fill("quattromani");
    await page.locator("[data-field-kit-property-id]").first().waitFor({ timeout: 10000 });
    const firstResultText = await page.locator("[data-field-kit-property-id]").first().innerText();
    assert.match(firstResultText, /1301 S 5TH|QUATTROMANI/i, "parcel search should find owner/address results");

    await page.keyboard.press("Escape");
    await expectPanelVisible(page, "parcel-search", false);
    assert.equal(await searchButton.getAttribute("aria-expanded"), "false", "Escape should close Parcel Search");
    await context.close();
  }

  {
    const { context, page } = await ownerArticlePage();
    const shareButton = page.locator('[data-ges-field-kit-tool="share"]');
    await shareButton.click();
    await expectPanelVisible(page, "share", true);
    const shareUrl = await page.locator("[data-field-kit-share-url]").inputValue();
    assert.match(shareUrl, /articles\/before-you-walk-into-a-property-protest\//);
    assert.match(shareUrl, /gpr_person=max-quattromani/);
    assert.match(shareUrl, /gpr_track=max-protest-guide-20260627/);
    assert.match(shareUrl, /#evidenceMatrixTitle$/);

    await page.locator("[data-field-kit-copy-link]").click();
    await assert.doesNotReject(() => page.locator("[data-field-kit-share-status]").getByText(/Link copied|Copy failed/).waitFor({ timeout: 3000 }));
    await page.locator(".article-hero .hero-title").click();
    await expectPanelVisible(page, "share", false);
    await context.close();
  }

  {
    const { context, page } = await ownerArticlePage();
    await page.locator('[data-ges-field-kit-tool="notes"]').click();
    await expectPanelVisible(page, "notes", true);
    await page.locator("[data-field-kit-notes]").fill("Needs better diagram.");
    const storedNotes = await page.evaluate(() => localStorage.getItem("guidedParcelReview.internalFieldKit.notes.v1"));
    assert.equal(storedNotes, "Needs better diagram.", "Quick Notes should autosave locally");
    await page.locator("[data-field-kit-clear-notes]").click();
    assert.equal(await page.locator("[data-field-kit-notes]").inputValue(), "", "clear notes should empty scratchpad");
    await context.close();
  }

  {
    const { context, page } = await ownerArticlePage();
    const inspectorButton = page.locator('[data-ges-field-kit-tool="inspector"]');
    await inspectorButton.click();
    assert.equal(await page.locator("body").evaluate(body => body.classList.contains("ges-component-inspector-enabled")), true, "inspector should add body toggle class");
    assert.equal(await inspectorButton.getAttribute("aria-pressed"), "true");
    assert.ok(await page.locator("[data-ges-inspector-label]").count() > 0, "inspector should label detected GES components");

    await inspectorButton.click();
    assert.equal(await page.locator("body").evaluate(body => body.classList.contains("ges-component-inspector-enabled")), false, "inspector should toggle off");
    assert.equal(await inspectorButton.getAttribute("aria-pressed"), "false");
    assert.equal(await page.locator("[data-ges-inspector-label]").count(), 0, "inspector labels should clear on toggle off");
    await context.close();
  }

  {
    const { context, page } = await newPage();
    await page.addInitScript(() => localStorage.setItem("ges-theme-preference", "dark"));
    await page.goto(`${baseUrl}${articlePath}${ownerTrackingQuery}`, { waitUntil: "domcontentloaded" });
    await waitForApp(page);
    await page.locator(".ges-field-kit-shell").waitFor({ timeout: 10000 });
    await page.locator('[data-ges-field-kit-tool="notes"]').click();

    const theme = await page.locator("html").evaluate(element => element.dataset.gesThemeResolved);
    assert.equal(theme, "dark", "dark-mode test should resolve dark theme");
    const colors = await page.locator(".ges-field-kit").evaluate(element => {
      const styles = getComputedStyle(element);
      return {
        background: styles.backgroundColor,
        border: styles.borderColor
      };
    });
    assert.notEqual(colors.background, "rgba(0, 0, 0, 0)");
    assert.notEqual(colors.border, "rgba(0, 0, 0, 0)");
    await page.screenshot({ path: join(artifactDir, "field-kit-dark.png"), fullPage: false });
    await context.close();
  }

  {
    const { context, page } = await ownerArticlePage({ width: 390, height: 900 });
    await page.locator('[data-ges-field-kit-tool="share"]').click();
    const metrics = await page.locator(".ges-field-kit-shell").evaluate(element => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        bottom: window.innerHeight - rect.bottom,
        viewportWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth
      };
    });
    assert.ok(metrics.left >= 0, "mobile Field Kit should stay inside the left viewport edge");
    assert.ok(metrics.right <= metrics.viewportWidth + 1, "mobile Field Kit should stay inside the right viewport edge");
    assert.ok(metrics.bottom >= 0, "mobile Field Kit should stay pinned inside the viewport bottom");
    assert.ok(metrics.scrollWidth <= metrics.viewportWidth + 1, "mobile Field Kit should not create horizontal overflow");
    await page.screenshot({ path: join(artifactDir, "field-kit-mobile.png"), fullPage: false });
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(`Internal Field Kit checks passed. Screenshots: ${artifactDir}`);
