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
  const firstTaxYear = rows
    .slice()
    .sort((left, right) => left.year - right.year)
    .find(row => row.net !== null && row.net !== undefined)?.year;

  return `
    <section class="tax-shorthand-area-panel" aria-labelledby="taxShorthandAreaTitle">
      <div class="tax-shorthand-area-heading">
        <div>
          <p class="guided-kicker">Long-run value and tax pattern</p>
          <h3 id="taxShorthandAreaTitle">Assessed value bars with indexed net-tax line</h3>
        </div>
        <p>Bars use assessed value dollars. The line indexes net tax to ${escapeHtml(`${firstTaxYear || "first year"} = 100`)}.</p>
      </div>
      <div class="tax-shorthand-area-chart">
        ${renderValueTaxComboSvg(rows)}
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

function renderValueTaxComboSvg(rows) {
  const chartRows = rows
    .slice()
    .filter(row => row.assessedValue !== null && row.assessedValue !== undefined)
    .sort((left, right) => left.year - right.year);
  const width = 1280;
  const height = 390;
  const top = 42;
  const right = 86;
  const bottom = 312;
  const left = 86;
  const plotWidth = width - left - right;
  const taxRows = chartRows.filter(row => row.net !== null && row.net !== undefined);
  const baseTaxRow = taxRows[0] || null;
  const baseTax = baseTaxRow?.net || null;
  const indexedRows = chartRows.map(row => ({
    ...row,
    taxIndex: baseTax && row.net !== null && row.net !== undefined
      ? row.net / baseTax * 100
      : null
  }));
  const valueDomain = { min: 0, max: Math.max(...indexedRows.map(row => row.assessedValue), 1) * 1.14 };
  const taxDomain = taxDomainAlignedToBaseValue(indexedRows, valueDomain, baseTaxRow);
  const xForIndex = index => left + (chartRows.length === 1 ? plotWidth / 2 : (index / (chartRows.length - 1)) * plotWidth);
  const barSlot = chartRows.length > 1 ? plotWidth / chartRows.length : plotWidth / 2;
  const barWidth = Math.max(8, Math.min(24, barSlot * 0.58));
  const taxBaselineY = chartY(100, taxDomain, top, bottom);
  const taxPoints = indexedRows
    .filter(row => row.taxIndex !== null && row.taxIndex !== undefined && Number.isFinite(row.taxIndex))
    .map((row, index) => {
      const chartIndex = chartRows.findIndex(item => item.year === row.year);
      return {
        x: xForIndex(chartIndex),
        y: chartY(row.taxIndex, taxDomain, top, bottom),
        row
      };
    });
  const bars = indexedRows.map((row, index) => ({
    x: xForIndex(index),
    y: chartY(row.assessedValue, valueDomain, top, bottom),
    height: bottom - chartY(row.assessedValue, valueDomain, top, bottom),
    row
  }));
  const valueTicks = valueAxisTicks(valueDomain);
  const taxTicks = taxIndexAxisTicks(taxDomain);

  return `
    <svg class="tax-shorthand-area-svg tax-shorthand-combo-svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="taxShorthandAreaSvgTitle taxShorthandAreaSvgDesc">
      <title id="taxShorthandAreaSvgTitle">Assessed value bar chart with net-tax index line</title>
      <desc id="taxShorthandAreaSvgDesc">Bars show assessed value dollars from ${escapeHtml(`${chartRows[0]?.year}`)} to ${escapeHtml(`${chartRows.at(-1)?.year}`)}. The line shows net tax indexed to ${escapeHtml(`${baseTaxRow?.year || "first tax year"} = 100`)}.</desc>
      <g class="tax-shorthand-chart-grid">
        ${valueTicks.map(tick => {
          const y = chartY(tick.value, valueDomain, top, bottom);
          return `
            <line x1="${left}" y1="${y.toFixed(1)}" x2="${width - right}" y2="${y.toFixed(1)}"></line>
            <text x="${left - 12}" y="${(y + 4).toFixed(1)}" text-anchor="end">${escapeHtml(tick.label)}</text>
          `;
        }).join("")}
        ${taxTicks.map(tick => {
          const y = chartY(tick.value, taxDomain, top, bottom);
          return `<text x="${width - right + 12}" y="${(y + 4).toFixed(1)}" text-anchor="start">${escapeHtml(tick.label)}</text>`;
        }).join("")}
        <line class="tax-shorthand-chart-baseline" x1="${left}" y1="${taxBaselineY.toFixed(1)}" x2="${width - right}" y2="${taxBaselineY.toFixed(1)}"></line>
        <text x="${width - right}" y="${(taxBaselineY - 8).toFixed(1)}" text-anchor="end">${escapeHtml(`${baseTaxRow?.year || "Tax"} tax = 100`)}</text>
      </g>
      <g class="tax-shorthand-value-bars">
        ${bars.map(bar => `
          <rect class="tax-shorthand-value-bar" x="${(bar.x - barWidth / 2).toFixed(1)}" y="${bar.y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${bar.height.toFixed(1)}" rx="2">
            <title>${escapeHtml(`${bar.row.year}: assessed value ${formatNullableMoney(bar.row.assessedValue)}${bar.row.net === null || bar.row.net === undefined ? "" : `, net tax ${formatNullableMoney(bar.row.net, true)}`}`)}</title>
          </rect>
        `).join("")}
      </g>
      <path class="tax-shorthand-area-line tax-shorthand-tax-line" d="${chartPath(taxPoints)}"></path>
      ${taxPoints.map(point => `
        <circle class="tax-shorthand-tax-point" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4">
          <title>${escapeHtml(`${point.row.year}: tax index ${Math.round(point.row.taxIndex)}; net tax ${formatNullableMoney(point.row.net, true)}`)}</title>
        </circle>
      `).join("")}
      <g class="tax-shorthand-chart-years">
        ${chartRows.map((row, index) => shouldShowChartYear(row, index, chartRows.length) ? `
          <text x="${xForIndex(index).toFixed(1)}" y="${bottom + 32}" text-anchor="middle">${row.year}</text>
        ` : "").join("")}
      </g>
      <g class="tax-shorthand-chart-legend">
        <rect x="${left}" y="12" width="12" height="12" class="tax-shorthand-value-swatch"></rect>
        <text x="${left + 18}" y="22">Assessed value bars</text>
        <line x1="${left + 184}" y1="18" x2="${left + 214}" y2="18" class="tax-shorthand-tax-line"></line>
        <circle cx="${left + 199}" cy="18" r="4" class="tax-shorthand-tax-point"></circle>
        <text x="${left + 224}" y="22">Net tax index line</text>
        <text x="${left}" y="${height - 14}">Left axis: assessed value. Right axis: tax index.</text>
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
  const taxIndexYear = taxIndexBaseYear(rows);
  const taxYearCount = rows.filter(row => row.net !== null && row.net !== undefined).length;
  const valueOnlyCount = rows.length - taxYearCount;
  const historyCountLabel = valueOnlyCount
    ? `${taxYearCount} tax years + ${valueOnlyCount} value-only year`
    : `${taxYearCount} statement years`;
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
          <span>${escapeHtml(historyCountLabel)}</span>
        </div>
        ${rows.length ? renderMetricCards(rows) : ""}
        ${rows.length ? `
          <div class="tax-shorthand-table-wrap">
            <table class="tax-shorthand-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Statement</th>
                  <th>Assessed value</th>
                  <th>Levy</th>
                  <th>Gross tax</th>
                  <th>Credits</th>
                  <th>Net tax</th>
                  <th>Tax index</th>
                  <th>Net result</th>
                </tr>
              </thead>
              <tbody>
                ${renderRows(rows, taxIndexYear)}
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
