import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../src/article-reader-count.js", import.meta.url), "utf8")
  .replace(/^import .*;\n/, "")
  .replace(/export /g, "");
const context = {};
vm.runInNewContext(`${source}\nthis.ArticleReaderCount = ArticleReaderCount;\nthis.formatReaderCount = formatReaderCount;\nthis.shouldShowReaderCount = shouldShowReaderCount;`, context);

const { ArticleReaderCount, formatReaderCount, shouldShowReaderCount } = context;

const cases = [
  { count: undefined, show: false, label: "" },
  { count: 0, show: false, label: "" },
  { count: 99, show: false, label: "" },
  { count: 100, show: true, label: "100" },
  { count: 327, show: true, label: "327" },
  { count: 999, show: true, label: "999" },
  { count: 1000, show: true, label: "1K" },
  { count: 1240, show: true, label: "1.2K" },
  { count: 12000, show: true, label: "12K" }
];

cases.forEach(({ count, show, label }) => {
  assert.equal(shouldShowReaderCount(count), show, `visibility for ${count}`);
  assert.equal(formatReaderCount(count), label, `format for ${count}`);
  assert.equal(ArticleReaderCount({ articleSlug: "watch-the-tax-roll-move", count }), label ? `Read by ${label} people` : "", `component copy for ${count}`);
});

console.log(JSON.stringify({ ok: true, checked: cases.length }, null, 2));
