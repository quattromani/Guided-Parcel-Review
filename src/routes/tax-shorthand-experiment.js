import { formatNullableLevy, formatNullableMoney } from "../format.js";
import {
  finalizedTaxStatements,
  renderExperimentViewHeader,
  statementGrossLevy,
  statementTotalCredits
} from "../render.js";
import { taxHistorySourceText } from "../domain/source-labels.js";
import { displayAddress } from "../utils/address.js";
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
  return row.prior ? `vs ${row.prior.year}` : "first loaded year";
}

function statementRows(data) {
  const rows = finalizedTaxStatements(data)
    .slice()
    .sort((a, b) => a.taxYear - b.taxYear)
    .map(statement => ({
      year: statement.taxYear,
      assessedValue: statement.assessedValue ?? null,
      levy: statementGrossLevy(statement),
      gross: statement.grossTaxAmount ?? null,
      credits: statementTotalCredits(statement),
      net: netTaxAmount(statement)
    }));

  return rows.map((row, index) => {
    const prior = rows[index - 1] ?? null;
    return {
      ...row,
      prior,
      valueChange: percentChange(row.assessedValue, prior?.assessedValue),
      levyChange: percentChange(row.levy, prior?.levy),
      grossChange: percentChange(row.gross, prior?.gross),
      netChange: percentChange(row.net, prior?.net)
    };
  }).sort((a, b) => b.year - a.year);
}

function renderMetricCards(rows) {
  const latest = rows[0];
  if (!latest) return "";

  return `
    <section class="tax-shorthand-metrics" aria-label="Latest tax shorthand summary">
      <article>
        <p>Latest net tax</p>
        <strong>${formatNullableMoney(latest.net, true)}</strong>
        ${latest.prior ? resultPill(latest) : ""}
      </article>
      <article>
        <p>Assessed value movement</p>
        <strong>${formatNullableMoney(latest.assessedValue)}</strong>
        ${changeLine("Value", latest.valueChange)}
      </article>
      <article>
        <p>Levy movement</p>
        <strong>${formatNullableLevy(latest.levy)}</strong>
        ${changeLine("Levy", latest.levyChange)}
      </article>
      <article>
        <p>Gross tax movement</p>
        <strong>${formatNullableMoney(latest.gross, true)}</strong>
        ${changeLine("Value + levy", latest.grossChange)}
      </article>
    </section>
  `;
}

function renderRows(rows) {
  return rows.map((row, index) => `
    <tr class="${index % 2 === 0 ? "bg-white" : "bg-slate-50"}">
      <th scope="row" class="tax-shorthand-year-cell">
        <strong>${row.year}</strong>
        <span>${escapeHtml(rowComparisonLabel(row))}</span>
      </th>
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
      <td class="tax-shorthand-result-cell">${resultPill(row)}</td>
    </tr>
  `).join("");
}

function renderValueTaxChartSection(rows) {
  if (!rows.length) return "";

  return `
    <section class="tax-shorthand-area-panel" aria-labelledby="taxShorthandAreaTitle">
      <div class="tax-shorthand-area-heading">
        <div>
          <p class="guided-kicker">Value and net tax pattern</p>
          <h3 id="taxShorthandAreaTitle">Assessed value and net tax by statement year</h3>
        </div>
        <p>Indexed to the first loaded statement year so value and net tax movement share one scale.</p>
      </div>
      <div class="tax-shorthand-area-chart">
        ${renderValueTaxAreaSvg(rows)}
      </div>
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

function indexChartTicks(domain) {
  const step = 50;
  const top = Math.ceil(domain.max / step) * step;
  const bottom = Math.floor(domain.min / step) * step;
  const ticks = [];

  for (let value = top; value >= bottom; value -= step) {
    ticks.push({ value, label: `${Math.round(value)}` });
  }

  return ticks.length ? ticks : [{ value: 100, label: "100" }];
}

function renderValueTaxAreaSvg(rows) {
  const chartRows = rows.slice().sort((left, right) => left.year - right.year);
  const width = 1040;
  const height = 340;
  const top = 34;
  const right = 36;
  const bottom = 278;
  const left = 96;
  const plotWidth = width - left - right;
  const baseValue = chartRows[0]?.assessedValue || null;
  const baseTax = chartRows[0]?.net || null;
  const indexedRows = chartRows.map(row => ({
    ...row,
    valueIndex: baseValue ? row.assessedValue / baseValue * 100 : null,
    taxIndex: baseTax ? row.net / baseTax * 100 : null
  }));
  const indexDomain = chartDomain([
    100,
    ...indexedRows.map(row => row.valueIndex),
    ...indexedRows.map(row => row.taxIndex)
  ]);
  const xForIndex = index => left + (chartRows.length === 1 ? plotWidth / 2 : (index / (chartRows.length - 1)) * plotWidth);
  const baselineY = chartY(100, indexDomain, top, bottom);
  const valuePoints = indexedRows.map((row, index) => ({
    x: xForIndex(index),
    y: chartY(row.valueIndex, indexDomain, top, bottom),
    row
  }));
  const taxPoints = indexedRows.map((row, index) => ({
    x: xForIndex(index),
    y: chartY(row.taxIndex, indexDomain, top, bottom),
    row
  }));
  const ticks = indexChartTicks(indexDomain);

  return `
    <svg class="tax-shorthand-area-svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="taxShorthandAreaSvgTitle taxShorthandAreaSvgDesc">
      <title id="taxShorthandAreaSvgTitle">Assessed value and net tax area chart</title>
      <desc id="taxShorthandAreaSvgDesc">Indexed area chart comparing assessed value and net tax for ${escapeHtml(chartRows.map(row => row.year).join(", "))}.</desc>
      <g class="tax-shorthand-chart-grid">
        ${ticks.map(tick => {
          const y = chartY(tick.value, indexDomain, top, bottom);
          return `
            <line x1="${left}" y1="${y.toFixed(1)}" x2="${width - right}" y2="${y.toFixed(1)}"></line>
            <text x="${left - 12}" y="${(y + 4).toFixed(1)}" text-anchor="end">${escapeHtml(tick.label)}</text>
          `;
        }).join("")}
        <line class="tax-shorthand-chart-baseline" x1="${left}" y1="${baselineY.toFixed(1)}" x2="${width - right}" y2="${baselineY.toFixed(1)}"></line>
        <text x="${width - right}" y="${(baselineY - 8).toFixed(1)}" text-anchor="end">2019 = 100</text>
      </g>
      <path class="tax-shorthand-area-fill tax-shorthand-value-fill" d="${chartAreaPath(valuePoints, baselineY.toFixed(1))}"></path>
      <path class="tax-shorthand-area-fill tax-shorthand-tax-fill" d="${chartAreaPath(taxPoints, baselineY.toFixed(1))}"></path>
      <path class="tax-shorthand-area-line tax-shorthand-value-line" d="${chartPath(valuePoints)}"></path>
      <path class="tax-shorthand-area-line tax-shorthand-tax-line" d="${chartPath(taxPoints)}"></path>
      ${valuePoints.map(point => `
        <circle class="tax-shorthand-value-point" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4"></circle>
      `).join("")}
      ${taxPoints.map(point => `
        <circle class="tax-shorthand-tax-point" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4"></circle>
      `).join("")}
      <g class="tax-shorthand-chart-years">
        ${chartRows.map((row, index) => `
          <text x="${xForIndex(index).toFixed(1)}" y="${bottom + 32}" text-anchor="middle">${row.year}</text>
        `).join("")}
      </g>
      <g class="tax-shorthand-chart-legend">
        <rect x="${left}" y="10" width="12" height="12" class="tax-shorthand-value-swatch"></rect>
        <text x="${left + 18}" y="20">Assessed value</text>
        <rect x="${left + 150}" y="10" width="12" height="12" class="tax-shorthand-tax-swatch"></rect>
        <text x="${left + 168}" y="20">Net tax</text>
      </g>
    </svg>
  `;
}

function renderNoActiveProperty(propertySwitcherContext) {
  renderExperimentViewHeader({
    eyebrow: "Experiment · Tax context",
    title: "Year-by-year tax shorthand",
    description: "Select a loaded property to build the annual assessed-value, levy, credits, and net-tax walkthrough."
  }, null, propertySwitcherContext);

  const canvas = document.querySelector(".mobile-review-canvas");
  if (!canvas) return;

  canvas.innerHTML = `
    <section class="tax-shorthand-page review-card" aria-labelledby="taxShorthandEmptyTitle">
      <h2 id="taxShorthandEmptyTitle">Select a property record</h2>
      <p>The table will render after an active property is selected.</p>
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
  const propertyLabel = displayAddress(data.parcel?.situsAddress) || data.parcel?.parcelId || "selected property";
  renderExperimentViewHeader({
    eyebrow: "Experiment · Tax context",
    title: "Year-by-year tax shorthand",
    description: `${propertyLabel} annual statement math from assessed value through final net tax.`
  }, snapshotModel, propertySwitcherContext);

  const canvas = document.querySelector(".mobile-review-canvas");
  if (!canvas) return;

  canvas.innerHTML = `
    <section class="tax-shorthand-page" aria-labelledby="taxShorthandTitle">
      <article class="review-card tax-shorthand-card">
        <div class="tax-shorthand-card-header">
          <div>
            <p class="guided-kicker">Tax statement shorthand</p>
            <h2 id="taxShorthandTitle">${escapeHtml(data.parcel?.parcelId || "Selected parcel")} · ${escapeHtml(propertyLabel)}</h2>
          </div>
          <span>${escapeHtml(`${rows.length} statement years`)}</span>
        </div>
        ${rows.length ? renderMetricCards(rows) : ""}
        ${rows.length ? `
          <div class="tax-shorthand-table-wrap">
            <table class="tax-shorthand-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Assessed value</th>
                  <th>Levy</th>
                  <th>Gross tax</th>
                  <th>Credits</th>
                  <th>Net tax</th>
                  <th>Net result</th>
                </tr>
              </thead>
              <tbody>
                ${renderRows(rows)}
              </tbody>
            </table>
          </div>
          ${renderValueTaxChartSection(rows)}
          <p class="chart-source">${escapeHtml(taxHistorySourceText(data))}</p>
        ` : `
          <p class="tax-shorthand-empty">No finalized tax statement rows are loaded for this property yet.</p>
        `}
      </article>
      ${renderCountyMarketAverageSection(countyContext)}
    </section>
  `;
}
