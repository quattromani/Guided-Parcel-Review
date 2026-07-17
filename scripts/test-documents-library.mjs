import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

const [registry, route, fieldKit, indexPage, documentPage] = await Promise.all([
  source("src/content/documents.js"),
  source("src/routes/documents.js"),
  source("src/ges/field-kit.js"),
  source("documents/index.html"),
  source("documents/operational-transition-plan/index.html")
]);

assert.match(registry, /operational-transition-plan/);
assert.match(registry, /renderedArtifact: null/);
assert.match(registry, /not included in Guided Parcel Review/);
assert.doesNotMatch(registry, /Gage-County-Assessor-Office-Knowledge-System\.git/);
assert.match(route, /hasInternalToolPermission/);
assert.match(route, /will not be fetched or bundled by this static site/);
assert.match(fieldKit, /id: "documents", label: "Documents"/);
assert.match(fieldKit, /openDocuments\(\)/);
assert.match(indexPage, /noindex, nofollow, noarchive/);
assert.match(documentPage, /noindex, nofollow, noarchive/);

console.log("Documents library scaffold checks passed.");
