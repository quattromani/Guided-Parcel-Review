import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../src/visit-analytics.js", import.meta.url), "utf8")
  .replace(/export /g, "");
const context = { Intl };
vm.runInNewContext(`${source}\nthis.formatAnalyticsTimestamp = formatAnalyticsTimestamp;`, context);

const { formatAnalyticsTimestamp } = context;

assert.equal(
  formatAnalyticsTimestamp(new Date("2026-07-09T19:40:00.000Z")),
  "2026-07-09T14:40:00.000-05:00",
  "summer timestamps use Central daylight time"
);

assert.equal(
  formatAnalyticsTimestamp(new Date("2026-01-09T20:40:00.123Z")),
  "2026-01-09T14:40:00.123-06:00",
  "winter timestamps use Central standard time"
);

console.log(JSON.stringify({ ok: true, checked: 2 }, null, 2));
