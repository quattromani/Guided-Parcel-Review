import { formatNullableLevy, formatNullableMoney } from "../format.js";
import {
  finalizedTaxStatements,
  statementGrossLevy,
  statementTotalCredits
} from "../render.js";
import { escapeHtml } from "../utils/html.js";

const percentOneDecimal = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});
const marketClassSources = [
  { key: "residential", label: "Residential", sheet: "resData" },
  { key: "commercial", label: "Commercial", sheet: "commData" },
  { key: "agricultural", label: "Agricultural", sheet: "agData" }
];
const marketAverageYearRange = { start: 2019, end: 2026 };
const predicted2026NetTax = 4320;
const sFifthLongTaxHistory = [
  { year: 2026, assessedValue: 384850, grossTax: null, netTax: null, totalPaid: null, statementNumber: null, status: "assessment-only" },
  { year: 2025, assessedValue: 278930, grossTax: 4426.52, netTax: 3412.58, totalPaid: 1706.29, statementNumber: "11719" },
  { year: 2024, assessedValue: 275290, grossTax: 4643.14, netTax: 3579.58, totalPaid: 3579.58, statementNumber: "12788" },
  { year: 2023, assessedValue: 252355, grossTax: 4655.6, netTax: 4374.72, totalPaid: 4374.72, statementNumber: "12748" },
  { year: 2022, assessedValue: 219035, grossTax: 4240.98, netTax: 4007.52, totalPaid: 4007.52, statementNumber: "11277" },
  { year: 2021, assessedValue: 198035, grossTax: 3965.06, netTax: 3752.08, totalPaid: 3752.08, statementNumber: "11263" },
  { year: 2020, assessedValue: 198035, grossTax: 3999.7, netTax: 3797.28, totalPaid: 3797.28, statementNumber: "11231" },
  { year: 2019, assessedValue: 172940, grossTax: 3564.78, netTax: 3384.66, totalPaid: 3468.4, statementNumber: "11194" },
  { year: 2018, assessedValue: 159310, grossTax: 3293.18, netTax: 3155.38, totalPaid: 3402.89, statementNumber: "11175" },
  { year: 2017, assessedValue: 159310, grossTax: 3086.24, netTax: 2946.12, totalPaid: 2946.12, statementNumber: "11153" },
  { year: 2016, assessedValue: 159310, grossTax: 3048.38, netTax: 2905.68, totalPaid: 2905.68, statementNumber: "11126" },
  { year: 2015, assessedValue: 159310, grossTax: 3152.48, netTax: 3002.58, totalPaid: 3002.58, statementNumber: "11099" },
  { year: 2014, assessedValue: 159310, grossTax: 3216.36, netTax: 3102.38, totalPaid: 3102.38, statementNumber: "11092" },
  { year: 2013, assessedValue: 159310, grossTax: 3253.48, netTax: 3148.38, totalPaid: 3148.38, statementNumber: "11050" },
  { year: 2012, assessedValue: 159310, grossTax: 3301.4, netTax: 3187.5, totalPaid: 3187.5, statementNumber: "11058" },
  { year: 2011, assessedValue: 159310, grossTax: 3300.3, netTax: 3180.32, totalPaid: 3298.16, statementNumber: "5245" },
  { year: 2010, assessedValue: 159310, grossTax: 3296.56, netTax: 3170.84, totalPaid: 3210.98, statementNumber: "11031" },
  { year: 2009, assessedValue: 159310, grossTax: 3263.6, netTax: 3132.62, totalPaid: 3162.66, statementNumber: "11010" },
  { year: 2008, assessedValue: 159310, grossTax: 3264.74, netTax: 3127.52, totalPaid: 3128.72, statementNumber: "7229" },
  { year: 2007, assessedValue: 127670, grossTax: 2634.34, netTax: 2528.1, totalPaid: 2530.04, statementNumber: "10978" },
  { year: 2006, assessedValue: 127670, grossTax: 2496.78, netTax: 2496.78, totalPaid: 2497.26, statementNumber: "10882" },
  { year: 2005, assessedValue: 127670, grossTax: 2545.5, netTax: 2545.5, totalPaid: 2545.5, statementNumber: "12390" },
  { year: 2004, assessedValue: 127670, grossTax: 2554.96, netTax: 2554.96, totalPaid: 2554.96, statementNumber: "10773" },
  { year: 2003, assessedValue: 119680, grossTax: 2410.42, netTax: 2410.42, totalPaid: 2410.42, statementNumber: "9598" },
  { year: 2002, assessedValue: 117685, grossTax: 2351.82, netTax: 2351.82, totalPaid: 2351.82, statementNumber: "10717" },
  { year: 2001, assessedValue: 117685, grossTax: 2320.88, netTax: 2320.88, totalPaid: 2320.88, statementNumber: "11472" },
  { year: 2000, assessedValue: 107805, grossTax: 2250.72, netTax: 2217.8, totalPaid: 2217.8, statementNumber: "11439" },
  { year: 1999, assessedValue: 107805, grossTax: 2242.1, netTax: 2242.1, totalPaid: 2242.1, statementNumber: "11274" },
  { year: 1998, assessedValue: 107805, grossTax: 2282.12, netTax: 2282.12, totalPaid: 2282.12, statementNumber: "11223" },
  { year: 1997, assessedValue: 107805, grossTax: 2432.24, netTax: 2432.24, totalPaid: 2432.24, statementNumber: "11169" },
  { year: 1996, assessedValue: 89640, grossTax: 2234.28, netTax: 2234.28, totalPaid: 2234.28, statementNumber: "11100" },
  { year: 1995, assessedValue: 89640, grossTax: 2297.74, netTax: 2297.74, totalPaid: 2297.74, statementNumber: "11040" },
  { year: 1994, assessedValue: 69490, grossTax: 1693.9, netTax: 1693.9, totalPaid: 1693.9, statementNumber: "10155" },
  { year: 1993, assessedValue: 58395, grossTax: 1560.2, netTax: 1560.2, totalPaid: 1560.2, statementNumber: "10926" }
];
const longTaxHistoryByParcelId = new Map([
  ["010496000", sFifthLongTaxHistory],
  ["0010496000", sFifthLongTaxHistory]
]);

function prepareExperimentShell() {
  document.querySelector(".guide-review-header")?.classList.add("hidden");
  document.querySelectorAll("[data-guided-panel]").forEach(panel => panel.classList.add("hidden"));
  document.querySelector("[data-footer-resource-shell]")?.classList.add("hidden");
}

function percentChange(current, prior) {
  if (current === null || current === undefined || prior === null || prior === undefined || prior === 0) return null;
  return (current - prior) / prior;
}

function netTaxAmount(statement) {
  return statement?.netAmountDue ?? statement?.totalTaxesDue ?? null;
}

function firstFinite(...values) {
  return values.find(value => value !== null && value !== undefined && Number.isFinite(value)) ?? null;
}

function absoluteMoney(value) {
  return formatNullableMoney(Math.abs(value), true);
}

function movementClass(change) {
  if (change === null || change === undefined || !Number.isFinite(change) || Math.abs(change) < 0.000001) {
    return "movement-pill-flat";
  }

  return change > 0 ? "movement-pill-increase" : "movement-pill-decrease";
}

function movementArrow(change) {
  if (change === null || change === undefined || !Number.isFinite(change) || Math.abs(change) < 0.000001) return "->";
  return change > 0 ? "up" : "down";
}

function formatMovementPercent(change) {
  if (change === null || change === undefined || !Number.isFinite(change)) return "baseline";
  if (Math.abs(change) < 0.000001) return "flat 0.0%";

  return `${movementArrow(change)} ${percentOneDecimal.format(Math.abs(change))}`;
}

function movementGlyph(change) {
  if (change === null || change === undefined || !Number.isFinite(change) || Math.abs(change) < 0.000001) return "→";
  return change > 0 ? "↑" : "↓";
}

function compactChangePill(change, label = "") {
  if (change === null || change === undefined || !Number.isFinite(change)) {
    return `<span class="tax-shorthand-compact-change tax-shorthand-change-baseline">${escapeHtml(label || "Baseline")}</span>`;
  }

  const className = change > 0
    ? "tax-shorthand-change-up"
    : change < 0
      ? "tax-shorthand-change-down"
      : "tax-shorthand-change-flat";

  return `
    <span class="tax-shorthand-compact-change ${className}" title="${escapeHtml(formatMovementPercent(change))}">
      ${movementGlyph(change)} ${percentOneDecimal.format(Math.abs(change))}
    </span>
  `;
}

function changeLine(label, change) {
  const className = change === null || change === undefined || !Number.isFinite(change)
    ? "tax-shorthand-change-baseline"
    : change > 0
      ? "tax-shorthand-change-up"
      : change < 0
        ? "tax-shorthand-change-down"
        : "tax-shorthand-change-flat";

  return `<span class="tax-shorthand-change ${className}">${escapeHtml(label)} ${escapeHtml(formatMovementPercent(change))}</span>`;
}

function moneyChangeLine(label, current, prior) {
  if (current === null || current === undefined || prior === null || prior === undefined) {
    return `<span class="tax-shorthand-change tax-shorthand-change-baseline">${escapeHtml(label)} baseline</span>`;
  }

  const change = current - prior;
  const className = change > 0
    ? "tax-shorthand-change-up"
    : change < 0
      ? "tax-shorthand-change-down"
      : "tax-shorthand-change-flat";
  const direction = change > 0 ? "up" : change < 0 ? "down" : "flat";

  return `<span class="tax-shorthand-change ${className}">${escapeHtml(label)} ${direction}${change ? ` ${absoluteMoney(change)}` : ""}</span>`;
}

function compactMoneyChangePill(current, prior) {
  if (current === null || current === undefined || prior === null || prior === undefined) {
    return `<span class="tax-shorthand-compact-change tax-shorthand-change-baseline">Baseline</span>`;
  }

  const change = current - prior;
  const className = change > 0
    ? "tax-shorthand-change-up"
    : change < 0
      ? "tax-shorthand-change-down"
      : "tax-shorthand-change-flat";

  return `
    <span class="tax-shorthand-compact-change ${className}" title="${change ? absoluteMoney(change) : "$0.00"}">
      ${movementGlyph(change)} ${change ? absoluteMoney(change) : "$0.00"}
    </span>
  `;
}

function resultPill(row) {
  if (row.status === "assessment-only" || row.net === null || row.net === undefined) {
    return `<span class="movement-pill movement-pill-flat">Assessment only</span>`;
  }

  if (!row.prior || row.net === null || row.net === undefined || row.prior.net === null || row.prior.net === undefined) {
    return `<span class="movement-pill movement-pill-flat">Baseline</span>`;
  }

  const delta = row.net - row.prior.net;
  const netChange = percentChange(row.net, row.prior.net);
  const className = movementClass(delta);
  const direction = delta > 0 ? "Up" : delta < 0 ? "Down" : "Flat";
  const amount = delta === 0 ? "$0.00" : absoluteMoney(delta);
  const percent = netChange === null ? "" : ` / ${percentOneDecimal.format(Math.abs(netChange))}`;

  return `<span class="movement-pill ${className}">${direction} ${amount}${percent}</span>`;
}

function rowComparisonLabel(row) {
  if (row.status === "assessment-only") return "value only";
  return row.prior ? `vs ${row.prior.year}` : "first loaded year";
}

function longHistoryRows(data) {
  const parcelIds = [
    data?.parcel?.parcelId,
    data?.parcel?.taxOnlineParcelId,
    data?.parcelIdentifiers?.taxOnlineParcelId
  ].filter(Boolean);

  return parcelIds.map(parcelId => longTaxHistoryByParcelId.get(parcelId)).find(Boolean) || [];
}

function finalizedStatementRows(data) {
  return finalizedTaxStatements(data)
    .slice()
    .sort((a, b) => a.taxYear - b.taxYear)
    .map(statement => ({
      year: statement.taxYear,
      statementNumber: statement.statementNumber ?? null,
      assessedValue: statement.assessedValue ?? null,
      levy: statementGrossLevy(statement),
      gross: statement.grossTaxAmount ?? null,
      credits: statementTotalCredits(statement),
      net: netTaxAmount(statement),
      totalPaid: statement.totalPaid ?? null,
      status: "tax-statement"
    }));
}

function supplementalHistoryRow(row) {
  const grossLevy = row.assessedValue && row.grossTax
    ? (row.grossTax / row.assessedValue) * 100
    : null;
  const credits = row.grossTax !== null && row.grossTax !== undefined && row.netTax !== null && row.netTax !== undefined
    ? Math.max(0, Math.round((row.grossTax - row.netTax) * 100) / 100)
    : null;

  return {
    year: row.year,
    statementNumber: row.statementNumber,
    assessedValue: row.assessedValue,
    levy: grossLevy,
    gross: row.grossTax,
    credits,
    net: row.netTax,
    totalPaid: row.totalPaid,
    status: row.status || "tax-statement",
    source: "Nebraska Taxes Online"
  };
}

function mergeHistoryRows(data) {
  const rowsByYear = new Map();

  finalizedStatementRows(data).forEach(row => {
    rowsByYear.set(row.year, row);
  });

  longHistoryRows(data).map(supplementalHistoryRow).forEach(row => {
    const existing = rowsByYear.get(row.year);
    rowsByYear.set(row.year, {
      ...row,
      ...existing,
      statementNumber: existing?.statementNumber ?? row.statementNumber,
      assessedValue: firstFinite(existing?.assessedValue, row.assessedValue),
      levy: firstFinite(existing?.levy, row.levy),
      gross: firstFinite(existing?.gross, row.gross),
      credits: firstFinite(existing?.credits, row.credits),
      net: firstFinite(existing?.net, row.net),
      totalPaid: firstFinite(existing?.totalPaid, row.totalPaid),
      status: existing?.status ?? row.status,
      source: existing?.source ?? row.source
    });
  });

  return [...rowsByYear.values()].sort((a, b) => a.year - b.year);
}

function statementRows(data) {
  const rows = mergeHistoryRows(data);
  const baselineTax = rows.find(row => row.net !== null && row.net !== undefined)?.net ?? null;

  return rows.map((row, index) => {
    const prior = rows[index - 1] ?? null;
    return {
      ...row,
      prior,
      taxIndex: baselineTax && row.net !== null && row.net !== undefined
        ? row.net / baselineTax * 100
        : null,
      valueChange: percentChange(row.assessedValue, prior?.assessedValue),
      levyChange: percentChange(row.levy, prior?.levy),
      grossChange: percentChange(row.gross, prior?.gross),
      netChange: percentChange(row.net, prior?.net)
    };
  }).sort((a, b) => b.year - a.year);
}

function renderMetricCards(rows) {
  const latestTax = rows.find(row => row.net !== null && row.net !== undefined);
  const latestValue = rows.find(row => row.assessedValue !== null && row.assessedValue !== undefined);
  const latestGross = rows.find(row => row.gross !== null && row.gross !== undefined);
  if (!latestTax && !latestValue) return "";

  return `
    <section class="tax-shorthand-metrics" aria-label="Latest tax shorthand summary">
      <article>
        <p>Latest net tax</p>
        <strong>${formatNullableMoney(latestTax?.net, true)}</strong>
        ${latestTax ? resultPill(latestTax) : ""}
      </article>
      <article>
        <p>Assessed value movement</p>
        <strong>${formatNullableMoney(latestValue?.assessedValue)}</strong>
        ${changeLine("Value", latestValue?.valueChange)}
      </article>
      <article>
        <p>Levy movement</p>
        <strong>${formatNullableLevy(latestTax?.levy)}</strong>
        ${changeLine("Levy", latestTax?.levyChange)}
      </article>
      <article>
        <p>Gross tax movement</p>
        <strong>${formatNullableMoney(latestGross?.gross, true)}</strong>
        ${changeLine("Value + levy", latestGross?.grossChange)}
      </article>
    </section>
  `;
}

function taxIndexBaseYear(rows) {
  return rows
    .slice()
    .sort((left, right) => left.year - right.year)
    .find(row => row.net !== null && row.net !== undefined)?.year ?? null;
}

function renderRows(rows, taxIndexYear) {
  return rows.map((row, index) => `
    <tr class="${index % 2 === 0 ? "bg-white" : "bg-slate-50"}">
      <th scope="row" class="tax-shorthand-year-cell">
        <strong>${row.year}</strong>
        <span>${escapeHtml(rowComparisonLabel(row))}</span>
      </th>
      <td>
        <strong>${escapeHtml(row.statementNumber || "—")}</strong>
        <span class="tax-shorthand-change tax-shorthand-change-baseline">${row.status === "assessment-only" ? "GWorks value" : "NTO statement"}</span>
      </td>
      <td>
        <strong>${formatNullableMoney(row.assessedValue)}</strong>
        ${compactChangePill(row.valueChange)}
      </td>
      <td>
        <strong>${formatNullableLevy(row.levy)}</strong>
        ${compactChangePill(row.levyChange)}
      </td>
      <td>
        <strong>${formatNullableMoney(row.gross, true)}</strong>
        ${compactChangePill(row.grossChange)}
      </td>
      <td>
        <strong>${row.credits === null || row.credits === undefined ? "—" : formatNullableMoney(row.credits, true)}</strong>
        ${compactMoneyChangePill(row.credits, row.prior?.credits)}
      </td>
      <td>
        <strong>${formatNullableMoney(row.net, true)}</strong>
        ${compactChangePill(row.netChange)}
      </td>
      <td>
        <strong>${row.taxIndex === null || row.taxIndex === undefined ? "—" : Math.round(row.taxIndex).toLocaleString("en-US")}</strong>
        <span class="tax-shorthand-change tax-shorthand-change-baseline">${escapeHtml(taxIndexYear ? `${taxIndexYear} = 100` : "tax baseline")}</span>
      </td>
      <td class="tax-shorthand-result-cell">${resultPill(row)}</td>
    </tr>
  `).join("");
}

function renderValueTaxChartSection(rows) {
  if (!rows.length) return "";

  return `
    <article class="tax-shorthand-area-panel tax-article-panel" aria-labelledby="taxArticleTitle">
      ${renderArticleOpening()}
      ${renderGuidedTransition("The rest of this page explains the history and assumptions behind that budgeting number.")}
      ${renderHistoricalArticleSection(rows)}
      ${renderGuidedTransition("Once I saw that history, I stopped asking only what my assessment did. I started asking how much of that change would likely reach the tax bill.")}
      ${renderRelativeExposureSection()}
      ${renderGuidedTransition("So the next question becomes: how much has that difference historically mattered?")}
      ${renderCountyHistoryArticleSection()}
      ${renderGuidedTransition("What does that mean for this property?")}
      ${renderPredictionMathArticleSection()}
      ${renderGuidedTransition("The value determines my property’s position relative to other properties. The relative exposure factor compares my value change with similar properties and turns that difference into a tax-bill multiplier. The tax history shows how budgets, levies, and credits have turned value changes into actual tax bills.")}
      <section class="tax-article-section tax-story-chapter tax-model-check-section" aria-label="Regression backtest chart">
        <h2>One check on the estimate</h2>
        <p>The second chart is a backtest. It checks whether the working estimate still sits near the long-run pattern.</p>
        ${renderTrendDeviationChartSection(rows)}
      </section>
      ${renderGuidedTransition("Whether the estimate is right or wrong, the goal is the same: understand the range before the bill arrives.")}
      ${renderArticleClosing()}
      <p class="tax-article-final-source">Sources: Nebraska Taxes Online property history; 2026 Gage County Report & Opinion; county CTL totals.</p>
    </article>
  `;
}

function renderGuidedTransition(text) {
  return `<aside class="tax-guided-transition">${escapeHtml(text)}</aside>`;
}

function renderArticleOpening() {
  return `
    <section class="tax-article-section tax-story-chapter tax-article-opening" aria-label="Opening prediction">
      <header class="tax-article-header">
        <p class="guided-kicker">Property tax prediction</p>
        <h1 id="taxArticleTitle">What will my property taxes be next year?</h1>
        <p>Last year, my property was assessed at about $278,930. This year’s valuation notice came in at $384,850. That is about a 38% increase.</p>
      </header>
      <p>So the question I wanted to answer was simple: what are my property taxes likely to be next year?</p>
      <aside class="tax-article-pullquote">
        I am budgeting for about <strong>$70 to $85 more per month</strong>.
      </aside>
      <p>This is a prediction. It is a working estimate based on the history and assumptions shown below.</p>
    </section>
  `;
}

function renderHistoricalArticleSection(rows) {
  return `
    <section class="tax-article-section tax-story-chapter tax-history-chapter" aria-labelledby="taxShorthandAreaTitle">
      <div class="tax-shorthand-area-heading">
        <div>
          <p class="guided-kicker">The evidence</p>
          <h3 id="taxShorthandAreaTitle">30 Years of Value vs. Tax History</h3>
        </div>
      </div>
      <div class="tax-chart-key" aria-label="Chart key">
        <span><i class="tax-chart-key-line tax-chart-key-value-line"></i>Assessed value index</span>
        <span><i class="tax-chart-key-line tax-chart-key-tax-line"></i>Net tax index</span>
        <span>1993 = 100</span>
      </div>
      <div class="tax-shorthand-area-chart">
        ${renderValueTaxComboSvg(rows)}
      </div>
      <div class="tax-history-highlights">
        <p>In 1993, this property was assessed at <strong>$58,395</strong> and paid <strong>$1,560.20</strong> in annual property taxes.</p>
        <p>Fifteen years later, in 2008, it was assessed at <strong>$159,310</strong> and paid <strong>$3,127.52</strong>.</p>
        <p>By 2025, it was assessed at <strong>$278,930</strong> and paid <strong>$3,412.58</strong>.</p>
      </div>
      <div class="tax-essay-observations">
        <p>Over time, value and taxes moved in the same direction, but not at the same speed.</p>
      </div>
    </section>
  `;
}

function renderRelativeExposureSection() {
  return `
    <section class="tax-article-section tax-story-chapter tax-essay-calculation" aria-labelledby="taxEssayCalculationTitle">
      <h2 id="taxEssayCalculationTitle">The part that matters</h2>
      <div class="tax-essay-copy">
      <p>The number I care about is the gap between my property and the broader residential group. That gap is where my share of the tax burden likely changes.</p>
      <div class="tax-napkin-block" aria-label="Relative exposure calculation">
        <div><span>My property</span><strong>+38%</strong></div>
        <div><span>Residential property overall</span><strong>+14.15%</strong></div>
        <div class="tax-napkin-result"><span>Difference</span><strong>+23.85 pts</strong></div>
      </div>
      </div>
    </section>
  `;
}

function renderCountyHistoryArticleSection() {
  return `
    <section class="tax-article-section tax-story-chapter tax-county-history-section" aria-labelledby="taxCountyHistoryTitle">
      <h2 id="taxCountyHistoryTitle">Recent county history</h2>
      <div class="tax-essay-copy">
      <p>The recent county history points the same direction. Since 2019, countywide valuation rose much faster than taxes levied.</p>
      <div class="tax-napkin-block tax-napkin-block-paired" aria-label="Recent county history">
        <div><span>Countywide valuation since 2019</span><strong>+54%</strong></div>
        <div><span>Taxes levied since 2019</span><strong>+14%</strong></div>
      </div>
      <p>That history is why I expect some levy compression, even if my own bill still rises. Historically, taxes levied have grown at a rate of 2.2% per year.</p>
      </div>
    </section>
  `;
}

function renderPredictionMathArticleSection() {
  return `
    <section class="tax-article-section tax-story-chapter tax-estimate-section" aria-labelledby="taxPredictionMathArticleTitle">
      <h2 id="taxPredictionMathArticleTitle">The estimate</h2>
      <p>Here is where the math lands today.</p>
      <article class="tax-estimate-block">
        <div><span>2025 taxes</span><strong>$3,413</strong></div>
        <div><span>Relative factor</span><strong>1.2385</strong></div>
        <div><span>Growth factor</span><strong>1.022</strong></div>
      </article>
      <div class="tax-estimate-shorthand" aria-label="$3,413 times 1.2385 times 1.022 is approximately $4,320">
        <strong>$3,413</strong>
        <span>×</span>
        <strong>1.2385</strong>
        <span>×</span>
        <strong>1.022</strong>
        <span>≈</span>
        <strong>$4,320</strong>
      </div>
      <p class="tax-estimate-result">As a rough estimate, that works out to <strong>$907 more per year</strong>, or about <strong>$76 more per month</strong>.</p>
    </section>
  `;
}

function renderArticleClosing() {
  return `
    <section class="tax-article-section tax-story-chapter tax-article-closing" aria-label="Assumptions and closing">
      <h2>Bottom line</h2>
      <p>My goal is not to defend the outcome or make a policy argument. Every property is different, and every taxpayer’s result will vary.</p>
      <p>I know a property tax bill is coming. I also know this year’s assessment increase makes a higher bill likely for me.</p>
      <p>So I wanted a working number before the bill arrives.</p>
      <aside class="tax-article-pullquote tax-article-pullquote-subtle">
        For budgeting, I’m using about <strong>$70 to $85 more per month</strong>.
      </aside>
      <p>For what it’s worth, when I tested this same approach against my 2025 tax bill, it came within about 1.4%, or roughly $46, of the actual number. That does not prove the model works, but it was close enough that I am willing to make another prediction.</p>
      <p>This is what I can work with today, based on the information available. As values are finalized, budgets are announced, and levies are set, I can update the model and test how well this estimate held up.</p>
    </section>
  `;
}

function chartDomain(values) {
  const finiteValues = values.filter(value => Number.isFinite(value));
  if (!finiteValues.length) return { min: 0, max: 1 };

  const min = Math.min(...finiteValues);
  const max = Math.max(...finiteValues);
  if (min === max) return { min: min * 0.9, max: max * 1.1 || 1 };

  const padding = (max - min) * 0.12;
  return { min: Math.max(0, min - padding), max: max + padding };
}

function chartY(value, domain, top, bottom) {
  if (!Number.isFinite(value)) return bottom;
  return bottom - ((value - domain.min) / (domain.max - domain.min)) * (bottom - top);
}

function chartPath(points) {
  if (!points.length) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
}

function chartAreaPath(points, bottom) {
  if (!points.length) return "";
  const first = points[0];
  const last = points.at(-1);
  return `M ${first.x.toFixed(1)} ${bottom} ${chartPath(points).replace(/^M /, "L ")} L ${last.x.toFixed(1)} ${bottom} Z`;
}

function axisMoneyLabel(value) {
  if (value >= 1000000) return `$${Math.round(value / 1000000)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value)}`;
}

function valueAxisTicks(domain) {
  const step = 100000;
  const top = Math.ceil(domain.max / step) * step;
  const ticks = [];

  for (let value = top; value >= 0; value -= step) {
    ticks.push({ value, label: axisMoneyLabel(value) });
  }

  return ticks.length ? ticks : [{ value: 0, label: "$0" }];
}

function taxIndexAxisTicks(domain) {
  const step = 100;
  const top = Math.ceil(domain.max / step) * step;
  const ticks = [];

  for (let value = top; value >= 0; value -= step) {
    ticks.push({ value, label: `${Math.round(value)}` });
  }

  return ticks.length ? ticks : [{ value: 100, label: "100" }, { value: 0, label: "0" }];
}

function taxDomainAlignedToBaseValue(indexedRows, valueDomain, baseTaxRow) {
  const fallbackDomain = chartDomain([
    0,
    100,
    ...indexedRows.map(row => row.taxIndex)
  ]);
  const baseValue = baseTaxRow?.assessedValue;
  if (!baseValue || !valueDomain.max) {
    fallbackDomain.min = 0;
    return fallbackDomain;
  }

  const alignedMax = 100 * (valueDomain.max / baseValue);
  const taxMax = Math.max(100, ...indexedRows.map(row => row.taxIndex).filter(Number.isFinite));
  return {
    min: 0,
    max: Math.max(alignedMax, taxMax * 1.08)
  };
}

function shouldShowChartYear(row, index, total) {
  return index === 0 || index === total - 1 || (row.year % 5 === 0 && index < total - 2);
}

function formatWholeMoney(value) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function linearRegression(points, valueKey = "indexValue") {
  if (points.length < 2) {
    const fallback = points[0]?.[valueKey] ?? 0;
    return { slope: 0, intercept: fallback };
  }

  const count = points.length;
  const sumX = points.reduce((sum, point) => sum + point.year, 0);
  const sumY = points.reduce((sum, point) => sum + point[valueKey], 0);
  const meanX = sumX / count;
  const meanY = sumY / count;
  const numerator = points.reduce((sum, point) => sum + (point.year - meanX) * (point[valueKey] - meanY), 0);
  const denominator = points.reduce((sum, point) => sum + (point.year - meanX) ** 2, 0);
  const slope = denominator ? numerator / denominator : 0;

  return { slope, intercept: meanY - slope * meanX };
}

function regressionValueAtYear(regression, year) {
  return regression.intercept + regression.slope * year;
}

function indexedTrendSeries(rows, valueKey) {
  const seriesRows = rows
    .slice()
    .filter(row => Number.isFinite(row[valueKey]))
    .sort((left, right) => left.year - right.year);
  const baseValue = seriesRows[0]?.[valueKey] ?? null;
  if (!seriesRows.length || !baseValue) return [];

  const indexedRows = seriesRows.map(row => ({
    year: row.year,
    sourceValue: row[valueKey],
    indexValue: row[valueKey] / baseValue * 100
  }));
  const regression = linearRegression(indexedRows);

  return indexedRows.map(row => {
    const trendValue = regressionValueAtYear(regression, row.year);
    return {
      ...row,
      trendValue,
      deviation: row.indexValue - trendValue
    };
  });
}

function percentile(values, ratio) {
  const sorted = values
    .filter(Number.isFinite)
    .slice()
    .sort((left, right) => left - right);
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * ratio;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];

  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function taxBacktestSummary(taxSeries, predictionValue) {
  const minPriorYears = 6;
  const misses = [];

  for (let index = minPriorYears; index < taxSeries.length; index += 1) {
    const trainingRows = taxSeries.slice(0, index);
    const regression = linearRegression(trainingRows, "sourceValue");
    const actualRow = taxSeries[index];
    const predictedValue = regressionValueAtYear(regression, actualRow.year);
    const miss = actualRow.sourceValue - predictedValue;

    misses.push({
      year: actualRow.year,
      actualValue: actualRow.sourceValue,
      predictedValue,
      miss,
      absoluteMiss: Math.abs(miss)
    });
  }

  const absoluteMisses = misses.map(row => row.absoluteMiss);
  const medianAbsoluteMiss = percentile(absoluteMisses, 0.5);
  const p80AbsoluteMiss = percentile(absoluteMisses, 0.8);
  const averageMiss = misses.length
    ? misses.reduce((sum, row) => sum + row.miss, 0) / misses.length
    : null;

  return {
    misses,
    medianAbsoluteMiss,
    p80AbsoluteMiss,
    averageMiss,
    rangeLow: p80AbsoluteMiss === null ? null : predictionValue - p80AbsoluteMiss,
    rangeHigh: p80AbsoluteMiss === null ? null : predictionValue + p80AbsoluteMiss
  };
}

function trendTicks(domain) {
  const step = 100;
  const top = Math.ceil(domain.max / step) * step;
  const ticks = [];

  for (let value = top; value >= 0; value -= step) {
    ticks.push({ value, label: `${Math.round(value)}` });
  }

  return ticks.length ? ticks : [{ value: 100, label: "100" }, { value: 0, label: "0" }];
}

function trendYearTicks(firstYear, actualTaxEndYear) {
  const ticks = [];

  for (let year = firstYear; year < actualTaxEndYear; year += 6) {
    ticks.push({ year, label: `${year}` });
  }

  if (!ticks.some(tick => tick.year === actualTaxEndYear)) {
    ticks.push({ year: actualTaxEndYear, label: `${actualTaxEndYear}` });
  }

  return ticks;
}

function renderTrendDeviationChartSection(rows) {
  const valueSeries = indexedTrendSeries(rows, "assessedValue");
  const taxSeries = indexedTrendSeries(rows, "net");
  if (!valueSeries.length || !taxSeries.length) return "";
  const backtestSummary = taxBacktestSummary(taxSeries, predicted2026NetTax);

  return `
    <div class="tax-trend-diagnostic" aria-labelledby="taxTrendDiagnosticTitle">
      <div class="tax-trend-diagnostic-heading">
        <div>
          <p class="guided-kicker">Model check</p>
          <h4 id="taxTrendDiagnosticTitle">Does the Prediction Fit the Pattern?</h4>
        </div>
        <p><span>Dots show actual years.</span><span>Dashed lines show best-fit trend.</span></p>
      </div>
      <div class="tax-trend-diagnostic-chart">
        ${renderTrendDeviationSvg(valueSeries, taxSeries)}
      </div>
      <p class="tax-trend-footer-note">Prediction is not part of the historical series; it is shown separately to test whether it lands within the long-run pattern.</p>
      ${renderTaxBacktestSummary(backtestSummary)}
    </div>
  `;
}

function renderTaxBacktestSummary(summary) {
  if (!summary.misses.length || summary.p80AbsoluteMiss === null) return "";
  const latestActualTax = 3412.58;
  const predictedIncrease = predicted2026NetTax - latestActualTax;
  const monthlyIncrease = predictedIncrease / 12;
  const percentIncrease = predictedIncrease / latestActualTax;

  return `
    <div class="tax-backtest-summary" aria-label="Backtested tax trend miss summary">
      <p><strong>${formatWholeMoney(predicted2026NetTax)}</strong> is the point estimate. That is <strong>${percentOneDecimal.format(percentIncrease)}</strong> above the 2025 net tax bill, or about <strong>${formatWholeMoney(monthlyIncrease)}/month</strong>.</p>
      <div class="tax-backtest-kpis">
        <article>
          <span>2026 estimate</span>
          <strong>${formatWholeMoney(predicted2026NetTax)}</strong>
        </article>
        <article>
          <span>Predicted increase</span>
          <strong>${percentOneDecimal.format(percentIncrease)}</strong>
        </article>
        <article>
          <span>2025 backtest</span>
          <strong>$46 miss</strong>
        </article>
        <article>
          <span>Working range</span>
          <strong>$70-$85/mo</strong>
        </article>
      </div>
    </div>
  `;
}

function renderTrendDeviationSvg(valueSeries, taxSeries) {
  const width = 1280;
  const height = 430;
  const top = 52;
  const right = 54;
  const bottom = 342;
  const left = 76;
  const plotWidth = width - left - right;
  const firstYear = Math.min(valueSeries[0].year, taxSeries[0].year);
  const predictionYear = 2026;
  const actualTaxEndYear = taxSeries.at(-1).year;
  const lastYear = predictionYear;
  const valueTrendPoints = [
    { year: valueSeries[0].year, indexValue: valueSeries[0].trendValue },
    { year: valueSeries.at(-1).year, indexValue: valueSeries.at(-1).trendValue }
  ];
  const taxTrendPoints = [
    { year: taxSeries[0].year, indexValue: taxSeries[0].trendValue },
    { year: taxSeries.at(-1).year, indexValue: taxSeries.at(-1).trendValue }
  ];
  const predictionPoint = {
    year: predictionYear,
    sourceValue: predicted2026NetTax,
    indexValue: predicted2026NetTax / taxSeries[0].sourceValue * 100
  };
  const allIndexValues = [
    ...valueSeries.flatMap(row => [row.indexValue, row.trendValue]),
    ...taxSeries.flatMap(row => [row.indexValue, row.trendValue]),
    predictionPoint.indexValue
  ];
  const domain = { min: 0, max: Math.max(...allIndexValues, 100) * 1.12 };
  const ticks = trendTicks(domain);
  const yearTicks = trendYearTicks(firstYear, actualTaxEndYear);
  const xForYear = year => left + ((year - firstYear) / (lastYear - firstYear)) * plotWidth;
  const pointFor = row => ({
    x: xForYear(row.year),
    y: chartY(row.indexValue, domain, top, bottom),
    trendY: chartY(row.trendValue, domain, top, bottom),
    row
  });
  const valuePoints = valueSeries.map(pointFor);
  const taxPoints = taxSeries.map(pointFor);
  const predictionDot = {
    x: xForYear(predictionPoint.year),
    y: chartY(predictionPoint.indexValue, domain, top, bottom)
  };
  const trendPath = trendRows => chartPath(trendRows.map(row => ({
    x: xForYear(row.year),
    y: chartY(row.indexValue, domain, top, bottom)
  })));

  return `
    <svg class="tax-trend-svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="taxTrendSvgTitle taxTrendSvgDesc">
      <title id="taxTrendSvgTitle">Indexed assessed value and net tax dots around best-fit regression lines</title>
      <desc id="taxTrendSvgDesc">Both series are indexed to 1993 equals 100. Assessed value regression runs from 1993 to 2026, net tax regression runs from 1993 to 2025, and the 2026 predicted tax is shown as a larger unconnected point.</desc>
      <g class="tax-trend-grid">
        ${ticks.map(tick => {
          const y = chartY(tick.value, domain, top, bottom);
          return `
            <line x1="${left}" y1="${y.toFixed(1)}" x2="${width - right}" y2="${y.toFixed(1)}"></line>
            <text x="${left - 12}" y="${(y + 4).toFixed(1)}" text-anchor="end">${escapeHtml(tick.label)}</text>
          `;
        }).join("")}
      </g>
      <path class="tax-trend-line tax-trend-line-value" d="${trendPath(valueTrendPoints)}"></path>
      <path class="tax-trend-line tax-trend-line-tax" d="${trendPath(taxTrendPoints)}"></path>
      <g class="tax-trend-stems tax-trend-value-stems">
        ${valuePoints.map(point => `
          <line class="${point.row.deviation >= 0 ? "tax-trend-above" : "tax-trend-below"}" x1="${point.x.toFixed(1)}" y1="${point.trendY.toFixed(1)}" x2="${point.x.toFixed(1)}" y2="${point.y.toFixed(1)}"></line>
        `).join("")}
      </g>
      <g class="tax-trend-stems tax-trend-tax-stems">
        ${taxPoints.map(point => `
          <line class="${point.row.deviation >= 0 ? "tax-trend-above" : "tax-trend-below"}" x1="${point.x.toFixed(1)}" y1="${point.trendY.toFixed(1)}" x2="${point.x.toFixed(1)}" y2="${point.y.toFixed(1)}"></line>
        `).join("")}
      </g>
      <g class="tax-trend-points tax-trend-value-points">
        ${valuePoints.map(point => `
          <circle class="${point.row.deviation >= 0 ? "tax-trend-above" : "tax-trend-below"}" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="5">
            <title>${escapeHtml(`${point.row.year}: value index ${Math.round(point.row.indexValue)}, trend ${Math.round(point.row.trendValue)}, ${point.row.deviation >= 0 ? "above" : "below"} by ${Math.abs(point.row.deviation).toFixed(1)} index points`)}</title>
          </circle>
        `).join("")}
      </g>
      <g class="tax-trend-points tax-trend-tax-points">
        ${taxPoints.map(point => `
          <circle class="${point.row.deviation >= 0 ? "tax-trend-above" : "tax-trend-below"}" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4">
            <title>${escapeHtml(`${point.row.year}: tax index ${Math.round(point.row.indexValue)}, trend ${Math.round(point.row.trendValue)}, ${point.row.deviation >= 0 ? "above" : "below"} by ${Math.abs(point.row.deviation).toFixed(1)} index points`)}</title>
          </circle>
        `).join("")}
      </g>
      <g class="tax-trend-prediction-point">
        <circle class="tax-trend-prediction-halo" cx="${predictionDot.x.toFixed(1)}" cy="${predictionDot.y.toFixed(1)}" r="13"></circle>
        <circle class="tax-trend-prediction-dot" cx="${predictionDot.x.toFixed(1)}" cy="${predictionDot.y.toFixed(1)}" r="8">
          <title>${escapeHtml(`${predictionYear} prediction: $${predicted2026NetTax.toLocaleString("en-US")} net tax, index ${Math.round(predictionPoint.indexValue)}`)}</title>
        </circle>
        <text x="${predictionDot.x.toFixed(1)}" y="${(predictionDot.y - 18).toFixed(1)}" text-anchor="middle">2026 prediction</text>
      </g>
      <g class="tax-shorthand-chart-years">
        ${yearTicks.map(tick => `
          <text x="${xForYear(tick.year).toFixed(1)}" y="${bottom + 32}" text-anchor="middle">${escapeHtml(tick.label)}</text>
        `).join("")}
      </g>
      <g class="tax-trend-legend">
        <line x1="${left}" y1="18" x2="${left + 34}" y2="18" class="tax-trend-line-value"></line>
        <circle cx="${left + 17}" cy="18" r="5" class="tax-trend-value-dot"></circle>
        <text x="${left + 44}" y="22">Assessed value index</text>
        <line x1="${left + 210}" y1="18" x2="${left + 244}" y2="18" class="tax-trend-line-tax"></line>
        <circle cx="${left + 227}" cy="18" r="4" class="tax-trend-tax-dot"></circle>
        <text x="${left + 254}" y="22">Net tax index</text>
        <text x="${width - right}" y="22" text-anchor="end">1993 = 100</text>
      </g>
    </svg>
  `;
}

function renderValueTaxComboSvg(rows) {
  const chartRows = rows
    .slice()
    .filter(row => row.assessedValue !== null && row.assessedValue !== undefined)
    .sort((left, right) => left.year - right.year);
  const width = 1280;
  const height = 390;
  const top = 32;
  const right = 46;
  const bottom = 320;
  const left = 86;
  const plotWidth = width - left - right;
  const taxRows = chartRows.filter(row => row.net !== null && row.net !== undefined);
  const baseValue = chartRows[0]?.assessedValue || null;
  const baseTaxRow = taxRows[0] || null;
  const baseTax = baseTaxRow?.net || null;
  const indexedRows = chartRows.map(row => ({
    ...row,
    valueIndex: baseValue ? row.assessedValue / baseValue * 100 : null,
    taxIndex: baseTax && row.net !== null && row.net !== undefined
      ? row.net / baseTax * 100
      : null
  }));
  const indexDomain = {
    min: 0,
    max: Math.max(
      100,
      ...indexedRows.map(row => row.valueIndex).filter(Number.isFinite),
      ...indexedRows.map(row => row.taxIndex).filter(Number.isFinite)
    ) * 1.08
  };
  const xForIndex = index => left + (chartRows.length === 1 ? plotWidth / 2 : (index / (chartRows.length - 1)) * plotWidth);
  const baselineY = chartY(100, indexDomain, top, bottom);
  const valuePoints = indexedRows
    .filter(row => Number.isFinite(row.valueIndex))
    .map(row => {
      const chartIndex = chartRows.findIndex(item => item.year === row.year);
      return {
        x: xForIndex(chartIndex),
        y: chartY(row.valueIndex, indexDomain, top, bottom),
        row
      };
    });
  const taxPoints = indexedRows
    .filter(row => Number.isFinite(row.taxIndex))
    .map(row => {
      const chartIndex = chartRows.findIndex(item => item.year === row.year);
      return {
        x: xForIndex(chartIndex),
        y: chartY(row.taxIndex, indexDomain, top, bottom),
        row
      };
    });
  const overlapValuePoints = valuePoints.filter(point => Number.isFinite(point.row.taxIndex) && point.row.net !== null && point.row.net !== undefined);
  const overlapTaxPoints = taxPoints.filter(point => overlapValuePoints.some(valuePoint => valuePoint.row.year === point.row.year));
  const divergenceAreaPath = overlapValuePoints.length && overlapTaxPoints.length
    ? `${chartPath(overlapValuePoints)} ${overlapTaxPoints.slice().reverse().map(point => `L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ")} Z`
    : "";
  const ticks = taxIndexAxisTicks(indexDomain);

  return `
    <svg class="tax-shorthand-area-svg tax-shorthand-combo-svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="taxShorthandAreaSvgTitle taxShorthandAreaSvgDesc">
      <title id="taxShorthandAreaSvgTitle">Assessed value and net-tax index comparison</title>
      <desc id="taxShorthandAreaSvgDesc">Lines show assessed value and net tax indexed to ${escapeHtml(`${baseTaxRow?.year || "first tax year"} = 100`)}.</desc>
      <g class="tax-shorthand-chart-grid">
        ${ticks.map(tick => {
          const y = chartY(tick.value, indexDomain, top, bottom);
          return `
            <line x1="${left}" y1="${y.toFixed(1)}" x2="${width - right}" y2="${y.toFixed(1)}"></line>
            <text x="${left - 12}" y="${(y + 4).toFixed(1)}" text-anchor="end">${escapeHtml(tick.label)}</text>
          `;
        }).join("")}
        <line class="tax-shorthand-chart-baseline" x1="${left}" y1="${baselineY.toFixed(1)}" x2="${width - right}" y2="${baselineY.toFixed(1)}"></line>
      </g>
      ${divergenceAreaPath ? `<path class="tax-shorthand-index-gap" d="${divergenceAreaPath}"></path>` : ""}
      <path class="tax-shorthand-area-line tax-shorthand-value-line" d="${chartPath(valuePoints)}"></path>
      <path class="tax-shorthand-area-line tax-shorthand-tax-line" d="${chartPath(taxPoints)}"></path>
      ${valuePoints.map(point => `
        <circle class="tax-shorthand-value-point" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${point.row.net === null || point.row.net === undefined ? "5.5" : "4.5"}">
          <title>${escapeHtml(`${point.row.year}: value index ${Math.round(point.row.valueIndex)}; assessed value ${formatNullableMoney(point.row.assessedValue)}`)}</title>
        </circle>
      `).join("")}
      ${taxPoints.map(point => `
        <circle class="tax-shorthand-tax-point" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4.5">
          <title>${escapeHtml(`${point.row.year}: tax index ${Math.round(point.row.taxIndex)}; net tax ${formatNullableMoney(point.row.net, true)}`)}</title>
        </circle>
      `).join("")}
      <g class="tax-shorthand-chart-years">
        ${chartRows.map((row, index) => shouldShowChartYear(row, index, chartRows.length) ? `
          <text x="${xForIndex(index).toFixed(1)}" y="${bottom + 32}" text-anchor="middle">${row.year}</text>
        ` : "").join("")}
      </g>
      <g class="tax-shorthand-chart-legend">
        <text x="${left}" y="${height - 14}">Index: 1993 = 100.</text>
      </g>
    </svg>
  `;
}

function renderNoActiveProperty(propertySwitcherContext) {
  const canvas = document.querySelector(".mobile-review-canvas");
  if (!canvas) return;

  canvas.innerHTML = `
    <section class="tax-shorthand-page review-card" aria-labelledby="taxShorthandEmptyTitle">
      <h2 id="taxShorthandEmptyTitle">Tax prediction story needs a loaded property</h2>
      <p>Open the S 5th Avenue parcel to render the one-page prediction.</p>
    </section>
  `;
}

function renderPredictionHero() {
  return `
    <section class="tax-prediction-hero" aria-labelledby="taxPredictionTitle">
      <div class="tax-prediction-hero-copy">
        <p class="guided-kicker">2026 property tax prediction</p>
        <h1 id="taxPredictionTitle">What I Think My 2026 Property Tax Bill Will Be</h1>
        <p>Based on 30+ years of property tax history, county valuation growth, valuation-group movement, and historical levy behavior.</p>
      </div>
      <div class="tax-prediction-kpis" aria-label="Prediction summary">
        <article class="tax-prediction-kpi tax-prediction-kpi-primary">
          <p>Predicted Tax Bill</p>
          <strong>≈ $4,290</strong>
        </article>
        <article class="tax-prediction-kpi">
          <p>Annual Increase</p>
          <strong>≈ $877</strong>
        </article>
        <article class="tax-prediction-kpi">
          <p>Monthly Increase</p>
          <strong>≈ $73</strong>
        </article>
      </div>
      <p class="tax-prediction-range">Estimated range: <strong>$4,200-$4,500 annually</strong> · <strong>≈ $70-$85/month</strong></p>
    </section>
  `;
}

function renderPropertyMathCard() {
  return `
    <article class="tax-prediction-step tax-prediction-step-alert">
      <span class="tax-prediction-step-number">1</span>
      <div>
        <p class="guided-kicker">My property</p>
        <h3>Value jumped faster than normal</h3>
      </div>
      <div class="tax-prediction-stat-pair">
        <div>
          <span>2025 Value</span>
          <strong>$278,930</strong>
        </div>
        <div>
          <span>2026 Value</span>
          <strong>$384,850</strong>
        </div>
      </div>
      <div class="tax-prediction-big-change">↑ +38%</div>
    </article>
  `;
}

function renderGroupMathCard() {
  return `
    <article class="tax-prediction-step">
      <span class="tax-prediction-step-number">2</span>
      <div>
        <p class="guided-kicker">Typical valuation group</p>
        <h3>Typical VG3 Adjustment</h3>
      </div>
      <div class="tax-prediction-split-stat">
        <div>
          <span>Group movement</span>
          <strong>+15%</strong>
        </div>
        <div>
          <span>Difference</span>
          <strong>+23 pts</strong>
        </div>
      </div>
      <p>My property increased faster than typical properties in my valuation group.</p>
    </article>
  `;
}

function renderCountyMathCard() {
  return `
    <article class="tax-prediction-step">
      <span class="tax-prediction-step-number">3</span>
      <div>
        <p class="guided-kicker">County history</p>
        <h3>2019-2025</h3>
      </div>
      <div class="tax-prediction-bars" aria-label="County value and tax growth comparison">
        <div class="tax-prediction-bar-row">
          <span>County Value Growth</span>
          <div><i style="width: 100%"></i></div>
          <strong>+54%</strong>
        </div>
        <div class="tax-prediction-bar-row">
          <span>County Tax Growth</span>
          <div><i style="width: 26%"></i></div>
          <strong>+14%</strong>
        </div>
      </div>
      <p>Historically, taxes have grown much slower than valuations.</p>
    </article>
  `;
}

function renderEquationMathCard() {
  return `
    <article class="tax-prediction-step tax-prediction-equation-card">
      <span class="tax-prediction-step-number">4</span>
      <div>
        <p class="guided-kicker">Prediction</p>
        <h3>The working estimate</h3>
      </div>
      <div class="tax-prediction-equation" aria-label="$3,413 times 1.23 times 1.022 is approximately $4,290">
        <strong>$3,413</strong>
        <span>×</span>
        <strong>1.23</strong>
        <span>×</span>
        <strong>1.022</strong>
        <span>=</span>
        <strong>≈ $4,290</strong>
      </div>
    </article>
  `;
}

function renderMathSection() {
  return `
    <section class="tax-prediction-section" aria-labelledby="taxPredictionMathTitle">
      <div class="tax-prediction-section-heading">
        <p class="guided-kicker">Here's My Math</p>
        <h2 id="taxPredictionMathTitle">A faster value correction, softened by levy compression</h2>
      </div>
      <div class="tax-prediction-steps">
        ${renderPropertyMathCard()}
        ${renderGroupMathCard()}
        ${renderCountyMathCard()}
        ${renderEquationMathCard()}
      </div>
    </section>
  `;
}

function renderWhySection() {
  const cards = [
    {
      icon: "↗",
      title: "Property Up Faster Than Average",
      copy: "My property rose about 38%. Typical valuation-group movement appears closer to 15%."
    },
    {
      icon: "⌁",
      title: "Levy Compression Is Real",
      copy: "County values increased roughly 54%. Taxes levied increased roughly 14%."
    },
    {
      icon: "$",
      title: "Budgets Usually Grow Slowly",
      copy: "Historical tax growth averages about 2.2% annually."
    }
  ];

  return `
    <section class="tax-prediction-section" aria-labelledby="taxPredictionWhyTitle">
      <div class="tax-prediction-section-heading">
        <p class="guided-kicker">Why I think this works</p>
        <h2 id="taxPredictionWhyTitle">The value jump matters, but it is not the whole bill</h2>
      </div>
      <div class="tax-prediction-why-grid">
        ${cards.map(card => `
          <article class="tax-prediction-why-card">
            <span>${escapeHtml(card.icon)}</span>
            <h3>${escapeHtml(card.title)}</h3>
            <p>${escapeHtml(card.copy)}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderBottomLine() {
  return `
    <section class="tax-prediction-bottom-line review-card" aria-label="Bottom-line takeaway">
      <p>My assessment tells me what my property is worth on paper.</p>
      <p>Budgets and levies determine what I actually pay.</p>
      <strong>Today, based on the information available, I'm budgeting for roughly $70-$85 more per month.</strong>
    </section>
  `;
}

function sourceRowsForClass(countyContext, source) {
  return (countyContext?.sheets?.[source.sheet]?.rows || [])
    .filter(row => row && typeof row === "object" && Number.isFinite(row.year))
    .sort((left, right) => left.year - right.year);
}

function countyAverageMarketRows(countyContext) {
  const yearRows = new Map();

  marketClassSources.forEach(source => {
    const displayedRows = sourceRowsForClass(countyContext, source)
      .filter(row => row.year >= marketAverageYearRange.start && row.year <= marketAverageYearRange.end);

    displayedRows.forEach((row, index) => {
      const prior = displayedRows[index - 1] ?? null;
      if (!yearRows.has(row.year)) yearRows.set(row.year, { year: row.year, classes: {} });
      yearRows.get(row.year).classes[source.key] = {
        label: source.label,
        sales: row.sales ?? null,
        averageSalePrice: row.avgSalePrice ?? null,
        averageAssessedValue: row.avgAssessedValue ?? null,
        salePriceChange: percentChange(row.avgSalePrice, prior?.avgSalePrice),
        assessedValueChange: percentChange(row.avgAssessedValue, prior?.avgAssessedValue)
      };
    });
  });

  return [...yearRows.values()].sort((left, right) => right.year - left.year);
}

function countyAverageSummary(countyRows) {
  const ascendingRows = countyRows.slice().sort((left, right) => left.year - right.year);
  const first = ascendingRows[0];
  const latest = ascendingRows.at(-1);
  if (!first || !latest) return [];

  return marketClassSources.map(source => {
    const firstValue = first.classes[source.key]?.averageSalePrice ?? null;
    const latestValue = latest.classes[source.key]?.averageSalePrice ?? null;

    return {
      ...source,
      firstYear: first.year,
      latestYear: latest.year,
      firstValue,
      latestValue,
      change: percentChange(latestValue, firstValue)
    };
  });
}

function renderCountyAverageSummary(countyRows) {
  const summaries = countyAverageSummary(countyRows);
  if (!summaries.length) return "";

  return `
    <section class="market-average-summary" aria-label="R&O average price movement by class">
      ${summaries.map(summary => `
        <article>
          <p>${escapeHtml(summary.label)}</p>
          <strong>${formatNullableMoney(summary.latestValue)}</strong>
          <span>${escapeHtml(`${summary.firstYear}-${summary.latestYear}`)} ${summary.change === null ? "baseline" : escapeHtml(formatMovementPercent(summary.change))}</span>
        </article>
      `).join("")}
    </section>
  `;
}

function marketAveragePill(change) {
  if (change === null || change === undefined || !Number.isFinite(change)) {
    return `<span class="movement-pill movement-pill-flat">Baseline</span>`;
  }

  const className = movementClass(change);
  const label = change > 0 ? "Up" : change < 0 ? "Down" : "Flat";

  return `<span class="movement-pill ${className}">${label} ${percentOneDecimal.format(Math.abs(change))}</span>`;
}

function renderMarketAverageCell(cell) {
  if (!cell) return `<span class="tax-shorthand-change tax-shorthand-change-baseline">No R&O row</span>`;

  return `
    <div class="market-average-class-cell">
      <div>
        <strong>${formatNullableMoney(cell.averageSalePrice)}</strong>
        ${marketAveragePill(cell.salePriceChange)}
      </div>
      <span>${escapeHtml(`${cell.sales ?? "—"} sales`)}</span>
      <span>${escapeHtml(`Avg assessed ${formatNullableMoney(cell.averageAssessedValue)}`)}</span>
      ${changeLine("Assessed", cell.assessedValueChange)}
    </div>
  `;
}

function renderCountyMarketAverageSection(countyContext) {
  const rows = countyAverageMarketRows(countyContext);
  if (!rows.length) return "";

  return `
    <article class="review-card tax-shorthand-card market-average-card">
      <div class="tax-shorthand-card-header">
        <div>
          <p class="guided-kicker">Gage County R&O market context</p>
          <h2>Average adjusted sale price by class</h2>
        </div>
        <span>${escapeHtml(`${marketAverageYearRange.start}-${marketAverageYearRange.end}`)}</span>
      </div>
      <p class="market-average-intro">
        PAD Reports and Opinions publish qualified-sales average adjusted sale price and average assessed value by property class. This table uses 2019 as the baseline and compares each later year with the prior displayed year.
      </p>
      ${renderCountyAverageSummary(rows)}
      <div class="tax-shorthand-table-wrap market-average-table-wrap">
        <table class="tax-shorthand-table market-average-table">
          <thead>
            <tr>
              <th>Year</th>
              ${marketClassSources.map(source => `<th>${escapeHtml(source.label)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row, index) => `
              <tr class="${index % 2 === 0 ? "bg-white" : "bg-slate-50"}">
                <th scope="row" class="tax-shorthand-year-cell">
                  <strong>${row.year}</strong>
                  <span>${row.year === marketAverageYearRange.start ? "baseline" : `vs ${row.year - 1}`}</span>
                </th>
                ${marketClassSources.map(source => `<td>${renderMarketAverageCell(row.classes[source.key])}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <p class="chart-source">
        Source: ${escapeHtml(countyContext?.source?.displayCitation || "Gage County PAD Reports and Opinions, 2019-2026")}. Figures are R&O qualified-sales averages, not a census average of every parcel.
        <a href="https://revenue.nebraska.gov/PAD/research-statistical-reports/statewide-equalization">Nebraska PAD statewide equalization reports</a>.
      </p>
    </article>
  `;
}

export function renderTaxShorthandExperiment(propertySwitcherContext = {}, { data, recordCard, snapshotModel, countyContext } = {}) {
  prepareExperimentShell();

  if (!data) {
    renderNoActiveProperty(propertySwitcherContext);
    return;
  }

  const rows = statementRows(data);
  const canvas = document.querySelector(".mobile-review-canvas");
  if (!canvas) return;

  canvas.innerHTML = `
    <section class="tax-shorthand-page" aria-labelledby="taxArticleTitle">
      ${rows.length ? renderValueTaxChartSection(rows) : `
        <section class="tax-shorthand-area-panel">
          <p class="tax-shorthand-empty">No finalized tax statement rows are loaded for this property yet.</p>
        </section>
      `}
    </section>
  `;
}
