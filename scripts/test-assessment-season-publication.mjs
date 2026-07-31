import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const articleSource = readFileSync(new URL("../src/content/articles/assessment-season-ends-budget-season-begins.js", import.meta.url), "utf8");
const articleModule = await import(`data:text/javascript;base64,${Buffer.from(articleSource).toString("base64")}`);
const article = articleModule.assessmentSeasonEndsBudgetSeasonBeginsArticle;
const manifest = JSON.parse(readFileSync(new URL("../data/app/articles.json", import.meta.url), "utf8"));
const html = readFileSync(new URL("../articles/assessment-season-ends-budget-season-begins/index.html", import.meta.url), "utf8");
const route = readFileSync(new URL("../src/routes/assessment-season-ends-budget-season-begins.js", import.meta.url), "utf8");
const manifestArticle = manifest.articles.find(item => item.id === article.id);

function metaContent(attribute, value) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.match(new RegExp(`<meta\\s+${attribute}="${escaped}"\\s+content="([^"]*)"\\s*/?>`))?.[1] || "";
}

assert.ok(manifestArticle, "assessment-season article is registered in the article manifest");
assert.equal(manifestArticle.excerpt, article.description, "article-roll excerpt matches the canonical description");
assert.equal(manifestArticle.social.description, article.socialDescription, "manifest social copy matches the canonical social description");
assert.equal(manifestArticle.resources.printableGuide, article.assets.printableGuidePdf, "manifest printable guide matches the canonical asset");
assert.ok(existsSync(new URL(`../${article.assets.printableGuidePdf}`, import.meta.url)), "printable guide asset exists");
assert.equal(manifestArticle.resources.audio, article.assets.audioRead, "manifest audio edition matches the canonical asset");
assert.equal(manifestArticle.resources.audioDuration, article.assets.audioDuration, "manifest audio duration matches canonical metadata");
assert.ok(existsSync(new URL(`../${article.assets.audioRead}`, import.meta.url)), "audio edition asset exists");
assert.equal(metaContent("name", "description"), article.description, "static meta description matches canonical content");
assert.equal(metaContent("property", "og:description"), article.socialDescription, "Open Graph description matches canonical social copy");
assert.equal(metaContent("name", "twitter:description"), article.socialDescription, "Twitter description matches canonical social copy");
assert.ok(article.description.length <= 160, "meta description remains within the preferred scan length");
assert.ok(article.socialDescription.length <= 200, "social description remains concise");

const jsonLdText = html.match(/<script id="assessment-season-article-jsonld" type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/)?.[1];
assert.ok(jsonLdText, "static Article structured data is present");
const jsonLd = JSON.parse(jsonLdText);
assert.equal(jsonLd.headline, article.title, "structured-data headline matches the article");
assert.equal(jsonLd.description, article.description, "structured-data description matches the article");
assert.equal(jsonLd.wordCount, article.wordCount, "structured-data word count matches the article");
const audioMedia = jsonLd.associatedMedia?.find(item => item["@type"] === "AudioObject");
assert.ok(audioMedia, "static structured data includes the audio edition");
assert.equal(audioMedia.duration, article.assets.audioDuration, "structured-data audio duration matches canonical metadata");
assert.ok(audioMedia.contentUrl.endsWith(article.assets.audioRead), "structured-data audio URL matches the canonical asset");

[
  "trackArticleInteraction",
  "trackArticleScrollDepth",
  "ARTICLE_DEPTH_MILESTONES = [25, 50, 75, 100]",
  "data-article-depth-marker",
  "history_chart_year_open",
  "history_table_toggle",
  "equalization_note_toggle",
  "dataset_download",
  "audioUrl: ARTICLE.assets.audioRead",
  "audio_article_expand",
  "audio_article_play",
  "audio_article_pause",
  "audio_article_complete",
  "printableUrl: ARTICLE.assets.printableGuidePdf",
  "calendar_download",
  "resource_click",
  "source_click",
  "analyticsReady"
].forEach(token => assert.ok(route.includes(token), `analytics wiring includes ${token}`));

console.log(JSON.stringify({
  ok: true,
  analyticsChecks: 19,
  descriptionLength: article.description.length,
  socialDescriptionLength: article.socialDescription.length
}, null, 2));
