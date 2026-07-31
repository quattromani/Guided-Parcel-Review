import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
const artifactDir = process.argv[3] || "/private/tmp/gpr-article-page-verify";
const chromePath = process.env.CHROME_EXECUTABLE_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const manifest = JSON.parse(readFileSync("data/app/articles.json", "utf8"));
const expectedPublicCards = manifest.articles.filter(article => article.published && !article.draft).length;
const expectedInternalCards = manifest.articles.length;
const expectedDraftCards = manifest.articles.filter(article => !article.published || article.draft).length;
const expectedDraftPreviewCards = manifest.articles.filter(article =>
  (!article.published || article.draft) &&
  article.route?.canonicalPath &&
  article.route?.previewable !== false &&
  (article.route?.previewable === true || !article.route?.sourceNote)
).length;

const articlePages = [
  {
    name: "assessment-season-canonical",
    path: "/articles/assessment-season-ends-budget-season-begins/?readerCountPreview=199",
    expects: { resources: true, sourceNotes: true }
  },
  {
    name: "assessment-season-legacy",
    path: "/index.html?article=assessment-season-ends-budget-season-begins&readerCountPreview=199",
    expects: { resources: true, sourceNotes: true }
  },
  {
    name: "watch-tax-roll-canonical",
    path: "/articles/watch-the-tax-roll-move/?readerCountPreview=199",
    expects: { resources: true }
  },
  {
    name: "protest-evidence-canonical",
    path: "/articles/before-you-walk-into-a-property-protest/?readerCountPreview=199",
    expects: { articleNotes: true, continuation: true, marginInsights: true, schedule: true, sourceNotes: true }
  },
  {
    name: "protest-evidence-legacy",
    path: "/index.html?article=protest-evidence-guide&readerCountPreview=199",
    expects: { articleNotes: true, continuation: true, marginInsights: true, schedule: true, sourceNotes: true }
  },
  {
    name: "protest-paradox-canonical",
    path: "/articles/assessment-up-protest-denied-taxes/?readerCountPreview=199",
    expects: { continuation: true, marginInsights: true, sourceNotes: true }
  },
  {
    name: "protest-paradox-legacy",
    path: "/index.html?article=protest-paradox&readerCountPreview=199",
    expects: { continuation: true, marginInsights: true, sourceNotes: true }
  },
  {
    name: "apl-draft-canonical",
    path: "/articles/how-your-property-value-becomes-a-tax-bill/?readerCountPreview=199",
    expects: { marginInsights: true, sourceNotes: true }
  },
  {
    name: "apl-draft-legacy",
    path: "/index.html?article=assessments-protests-and-levies&readerCountPreview=199",
    expects: { marginInsights: true, sourceNotes: true }
  },
  {
    name: "levy-compression-draft-canonical",
    path: "/articles/assessment-went-up-tax-bill/?readerCountPreview=199",
    expects: { articleNotes: true, marginInsights: true }
  },
  {
    name: "levy-compression-legacy",
    path: "/index.html?article=levy-compression&readerCountPreview=199",
    expects: { articleNotes: true, marginInsights: true }
  }
];

const rollPages = [
  { name: "article-roll-public", path: "/articles/", internal: false },
  { name: "article-roll-internal", path: "/articles/?gpr_person=max-quattromani", internal: true }
];

const viewports = [
  { name: "mobile", width: 390, height: 900 },
  { name: "desktop", width: 1280, height: 900 }
];
const themes = ["light", "dark"];
const failures = [];
const warnings = [];
const results = [];

mkdirSync(artifactDir, { recursive: true });

const { chromium } = await loadPlaywright();
const browser = await chromium.launch({
  ...(existsSync(chromePath) ? { executablePath: chromePath } : {}),
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"]
});

try {
  for (const viewport of viewports) {
    for (const theme of themes) {
      const context = await browser.newContext({
        deviceScaleFactor: 1,
        viewport: { width: viewport.width, height: viewport.height }
      });

      for (const article of articlePages) {
        await auditArticlePage(context, article, viewport, theme);
      }

      for (const roll of rollPages) {
        await auditRollPage(context, roll, viewport, theme);
      }

      await context.close();
    }
  }
} finally {
  await browser.close();
}

writeFileSync(join(artifactDir, "report.json"), JSON.stringify({ failures, warnings, results }, null, 2));

if (failures.length) {
  console.error(JSON.stringify({ artifactDir, failures, warnings }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ artifactDir, checked: results.length, ok: true, warnings }, null, 2));

async function auditArticlePage(context, article, viewport, theme) {
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  try {
    await page.goto(urlFor(article.path), { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1000);
    await setTheme(page, theme);
    await page.waitForTimeout(250);

    const state = await page.evaluate(({ themeName, viewportName }) => {
      const colorParts = value => (value.match(/\d+(?:\.\d+)?/g) || []).slice(0, 3).map(Number);
      const rectSummary = selector => [...document.querySelectorAll(selector)].map(node => {
        const rect = node.getBoundingClientRect();
        return {
          className: `${node.className}`,
          left: rect.left,
          right: rect.right,
          width: rect.width
        };
      });

      const chapters = [...document.querySelectorAll(".tax-story-chapter")];
      const chapterCreases = chapters.map((chapter, index) => {
        const before = getComputedStyle(chapter, "::before");
        return {
          content: before.content,
          display: before.display,
          hasPreviousChapter: chapter.previousElementSibling?.classList.contains("tax-story-chapter") ?? false,
          height: before.height,
          index
        };
      });

      const marginInsightColors = [...document.querySelectorAll(".ges-margin-insight__text")].map(node => {
        const [r, g, b] = colorParts(getComputedStyle(node).color);
        return { b, g, r, text: node.textContent.trim() };
      });

      const sourcePunctuationBreaks = [...document.querySelectorAll(".article-source-note__punctuation")]
        .map(punctuation => {
          const item = punctuation.closest(".article-source-note__item");
          const target = item?.querySelector("a, span:not(.article-source-note__punctuation)");
          const targetRects = target ? [...target.getClientRects()] : [];
          const punctuationRect = punctuation.getBoundingClientRect();
          const lastTargetRect = targetRects[targetRects.length - 1];
          if (!lastTargetRect) return null;
          return {
            bad: punctuationRect.top > lastTargetRect.bottom - 2,
            text: item.textContent.replace(/\s+/g, " ").trim()
          };
        })
        .filter(Boolean)
        .filter(item => item.bad);

      const fontSize = selector => {
        const node = document.querySelector(selector);
        return node ? Number.parseFloat(getComputedStyle(node).fontSize) : null;
      };
      const text = selector => document.querySelector(selector)?.textContent.replace(/\s+/g, " ").trim() || "";
      const cautionSize = fontSize(".article-caution-note:not(.article-guidance-note)");
      const guidanceSize = fontSize(".article-guidance-note");
      const h1Size = fontSize(".article-title, .article-hero .hero-title");
      const openingH2Size = fontSize(".ges-opening-section h2, .tax-story-chapter h2");

      const mobileFullWidthSelectors = [
        ".comparison-card",
        ".scorecard",
        ".question-checklist",
        ".article-caution-note",
        ".article-source-note",
        ".continuation-module",
        ".meeting-schedule-card"
      ];
      const clippedMobileElements = viewportName === "mobile"
        ? mobileFullWidthSelectors.flatMap(selector => rectSummary(selector)
          .filter(rect => rect.width > 0 && (rect.left > 34 || rect.right < document.documentElement.clientWidth - 34))
          .map(rect => ({ selector, ...rect })))
        : [];

      return {
        articleShell: document.documentElement.classList.contains("article-shell-route"),
        badFirstCreases: chapterCreases.filter(item => item.index === 0 && item.content !== "none" && item.display !== "none"),
        badMarginColors: marginInsightColors.filter(color => {
          if (themeName === "dark") return !(color.g >= color.r && color.g >= color.b);
          return !(color.r > color.g && color.r > color.b);
        }),
        cautionSize,
        clippedMobileElements,
        darkResolved: document.documentElement.dataset.gesThemeResolved,
        guidanceSize,
        h1Dominant: h1Size !== null && openingH2Size !== null ? h1Size > openingH2Size : true,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        missingLaterCreases: chapterCreases.filter(item =>
          item.index > 0 &&
          item.hasPreviousChapter &&
          (item.content === "none" || item.display === "none" || Number.parseFloat(item.height) < 1)
        ),
        pastHearingLinks: document.querySelectorAll(".meeting-date-past a").length,
        pastHearingStatic: document.querySelectorAll(".meeting-date-past .meeting-date-static").length,
        publicationMeta: text(".article-publication-meta"),
        publicationMetaHasDeadSeparator: /\|\s*\||^\s*\||\|\s*$/.test(text(".article-publication-meta")),
        trustRow: text(".article-trust-signals"),
        trustRowHasReaderCount: text(".article-trust-signals").includes("Read by 199 people"),
        trustRowHasDeadSeparator: /\|\s*\||^\s*\||\|\s*$/.test(text(".article-trust-signals")),
        authorText: text(".article-author-attribution"),
        authorHasDateOrByline: /\b(By|Published|Updated|Current as of|Read by|\d{4})\b/.test(text(".article-author-attribution")),
        visibleTopics: [...document.querySelectorAll(".article-entry-tags, .ges-tags, .ges-pill-list")]
          .filter(node => node.offsetParent !== null && !node.closest("[data-article-card]")).length,
        sourceNoteCount: document.querySelectorAll(".article-source-note").length,
        sourcePunctuationBreaks,
        staleClasses: {
          marginFirst: document.querySelectorAll(".ges-margin-insight--first").length,
          pageCrease: document.querySelectorAll(".ges-page-crease").length
        }
      };
    }, { themeName: theme, viewportName: viewport.name });

    results.push({ page: article.name, state, theme, viewport: viewport.name });
    softAssert(state.articleShell, article, viewport, theme, "article shell did not mount");
    softAssert(state.horizontalOverflow <= 1, article, viewport, theme, `horizontal overflow ${state.horizontalOverflow}px`);
    softAssert(state.h1Dominant, article, viewport, theme, "article H1 is not visually dominant over opening H2");
    softAssert(state.trustRow.startsWith("About "), article, viewport, theme, `trust row does not start with read time: ${state.trustRow}`);
    softAssert(state.trustRowHasReaderCount, article, viewport, theme, `reader count preview missing from trust row: ${state.trustRow}`);
    softAssert(!state.trustRowHasDeadSeparator, article, viewport, theme, "trust row has a dead separator");
    softAssert(state.publicationMeta.startsWith("Published "), article, viewport, theme, `publication meta missing published label: ${state.publicationMeta}`);
    softAssert(!state.publicationMetaHasDeadSeparator, article, viewport, theme, "publication meta has a dead separator");
    softAssert(state.authorText.includes("Max Quattromani"), article, viewport, theme, "author name missing");
    softAssert(state.authorText.includes("Certified in Nebraska Property Assessment"), article, viewport, theme, "author credential is not normalized");
    softAssert(!state.authorText.includes("Nebraska Certified Assessor"), article, viewport, theme, "stale author credential found");
    softAssert(!state.authorHasDateOrByline, article, viewport, theme, `author block includes date/byline/metrics: ${state.authorText}`);
    softAssert(state.visibleTopics === 0, article, viewport, theme, "visible article topic/tag pills found outside article roll");
    softAssert(state.staleClasses.marginFirst === 0, article, viewport, theme, "stale margin first class found");
    softAssert(state.staleClasses.pageCrease === 0, article, viewport, theme, "stale page crease element found");
    softAssert(state.badFirstCreases.length === 0, article, viewport, theme, "first chapter has generated crease");
    softAssert(state.missingLaterCreases.length === 0, article, viewport, theme, "adjacent later chapter missing universal crease");

    if (article.expects.marginInsights) {
      softAssert(state.badMarginColors.length === 0, article, viewport, theme, `margin insight color did not match ${theme}`);
    }
    if (article.expects.sourceNotes) {
      softAssert(state.sourceNoteCount > 0, article, viewport, theme, "expected source notes");
      softAssert(state.sourcePunctuationBreaks.length === 0, article, viewport, theme, "source punctuation wrapped away from its link");
    }
    if (article.expects.schedule) {
      softAssert(state.pastHearingLinks === 0, article, viewport, theme, "past hearing is still linked");
      softAssert(state.pastHearingStatic > 0, article, viewport, theme, "past hearing static node missing");
    }
    if (article.expects.articleNotes && state.cautionSize !== null && state.guidanceSize !== null) {
      softAssert(Math.abs(state.cautionSize - state.guidanceSize) <= 0.5, article, viewport, theme, "guidance and caution notes use different font sizes");
    }
    if (viewport.name === "mobile") {
      const meaningfulClip = state.clippedMobileElements.filter(item =>
        !item.selector.includes("article-source-note") &&
        !item.selector.includes("article-caution-note")
      );
      if (meaningfulClip.length) {
        warnings.push(label(article, viewport, theme, `mobile elements remain inset: ${meaningfulClip.map(item => item.selector).join(", ")}`));
      }
    }
    if (theme === "dark") {
      softAssert(state.darkResolved === "dark", article, viewport, theme, "dark mode did not resolve");
    }
    if (pageErrors.length) {
      softAssert(false, article, viewport, theme, `page errors: ${pageErrors.join("; ")}`);
    }
    if (consoleErrors.length) {
      warnings.push(label(article, viewport, theme, `console errors: ${consoleErrors.join("; ")}`));
    }

    await page.screenshot({
      fullPage: false,
      path: join(artifactDir, `${article.name}-${viewport.name}-${theme}.png`)
    });
  } catch (error) {
    failures.push(label(article, viewport, theme, error.message));
  } finally {
    await page.close();
  }
}

async function auditRollPage(context, roll, viewport, theme) {
  const page = await context.newPage();
  try {
    await page.goto(urlFor(roll.path), { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1000);
    await setTheme(page, theme);
    await page.waitForTimeout(250);

    const state = await page.evaluate(() => {
      const cards = [...document.querySelectorAll("[data-article-card]")];
      const draftCards = cards.filter(card => card.dataset.articleStatus === "draft");
      return {
        cardCount: cards.length,
        draftCount: draftCards.length,
        draftLinks: draftCards.filter(card => card.querySelector(".ges-article-card__media-link, h2 a")).length,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        internalNotes: document.querySelectorAll(".ges-article-card__internal-note").length,
        resolvedTheme: document.documentElement.dataset.gesThemeResolved
      };
    });

    results.push({ page: roll.name, state, theme, viewport: viewport.name });
    softAssert(state.horizontalOverflow <= 1, roll, viewport, theme, `roll horizontal overflow ${state.horizontalOverflow}px`);
    if (roll.internal) {
      softAssert(state.cardCount === expectedInternalCards, roll, viewport, theme, `expected ${expectedInternalCards} internal cards, found ${state.cardCount}`);
      softAssert(state.draftCount === expectedDraftCards, roll, viewport, theme, `expected ${expectedDraftCards} draft cards, found ${state.draftCount}`);
      softAssert(state.draftLinks === expectedDraftPreviewCards, roll, viewport, theme, "draft preview link count mismatch");
      softAssert(state.internalNotes === expectedDraftCards, roll, viewport, theme, "draft internal notes missing");
    } else {
      softAssert(state.cardCount === expectedPublicCards, roll, viewport, theme, `expected ${expectedPublicCards} public cards, found ${state.cardCount}`);
      softAssert(state.draftCount === 0, roll, viewport, theme, "public roll shows drafts");
    }
    if (theme === "dark") {
      softAssert(state.resolvedTheme === "dark", roll, viewport, theme, "roll dark mode did not resolve");
    }

    await page.screenshot({
      fullPage: false,
      path: join(artifactDir, `${roll.name}-${viewport.name}-${theme}.png`)
    });
  } catch (error) {
    failures.push(label(roll, viewport, theme, error.message));
  } finally {
    await page.close();
  }
}

async function setTheme(page, theme) {
  const selector = `[data-ges-theme-option="${theme}"]`;
  await page.locator(selector).first().click({ timeout: 5000 });
  await page.waitForFunction(
    expected => document.documentElement.dataset.gesThemeResolved === expected,
    theme,
    { timeout: 5000 }
  );
}

function urlFor(path) {
  return new URL(path, baseUrl).href;
}

function label(page, viewport, theme, message) {
  return `${page.name} ${viewport.name} ${theme}: ${message}`;
}

function softAssert(condition, page, viewport, theme, message) {
  try {
    assert.ok(condition, label(page, viewport, theme, message));
  } catch (error) {
    failures.push(error.message);
  }
}
