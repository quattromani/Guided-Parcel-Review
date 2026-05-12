import { calculateEtr, groupLevy, percent } from "./format.js";
import {
  chartColors,
  semanticChartColors,
  visualizationTheme
} from "./config/visualization-palettes.js";

const levyGroupColors = visualizationTheme.districtGroups;
const palette = {
  slate700: visualizationTheme.neutrals.ink,
  slate600: visualizationTheme.neutrals.text,
  slate500: visualizationTheme.neutrals.mutedText,
  white: visualizationTheme.neutrals.surface,
  blue: visualizationTheme.colors.primary,
  blueSoft: visualizationTheme.roles.rateSoft,
  red: visualizationTheme.colors.danger,
  redSoft: visualizationTheme.roles.taxSoft,
  green: visualizationTheme.colors.success,
  greenSoft: visualizationTheme.roles.valueSoft,
  yellow: visualizationTheme.colors.warning,
  yellowSoft: visualizationTheme.roles.attentionSoft,
  teal: visualizationTheme.colors.accent,
  tealSoft: visualizationTheme.roles.marketSoft
};

let assessmentAccuracyChart;
let countyComparisonIndexedChart;
let countyComparisonRateChart;
let marketRatioChart;
let marketValueChart;
let marketSalePriceChart;
let taxBurdenPatternChart;

const assessmentDisplayYears = {
  start: 2019,
  end: 2026
};

const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const compactMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1
});
const wholeMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});
const moneyCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

export function buildIndexedChart(data) {
  const usableValueRows = data.taxpayerHistory.filter(row => row.assessedValue !== null);
  const usableTaxRows = data.taxpayerHistory.filter(row => row.taxes !== null);
  const years = data.taxpayerHistory.map(row => row.year);
  const baseValue = usableValueRows[0]?.assessedValue;
  const baseTaxes = usableTaxRows[0]?.taxes;

  document.getElementById("baseYearNote").textContent = `Base year: ${usableValueRows[0]?.year ?? "—"}`;

  const valueIndex = data.taxpayerHistory.map(row => row.assessedValue && baseValue ? (row.assessedValue / baseValue) * 100 : null);
  const taxIndex = data.taxpayerHistory.map(row => row.taxes && baseTaxes ? (row.taxes / baseTaxes) * 100 : null);
  const datasets = [
    {
      label: "Assessed value index",
      data: valueIndex,
      tension: 0.25,
      borderWidth: 3,
      borderColor: chartColors.contextValue,
      backgroundColor: semanticChartColors.valueBg,
      spanGaps: true
    },
    {
      label: "Tax bill index",
      data: taxIndex,
      tension: 0.25,
      borderWidth: 3,
      borderColor: chartColors.contextTax,
      backgroundColor: semanticChartColors.taxBg,
      spanGaps: true
    }
  ];
  const hasCustomLegend = renderCustomLegend("indexedChartLegend", datasets);

  new Chart(document.getElementById("indexedChart"), {
    type: "line",
    data: {
      labels: years,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: !hasCustomLegend },
        tooltip: {
          callbacks: {
            label: context => `${context.dataset.label}: ${context.parsed.y?.toFixed(1) ?? "Pending"}`
          }
        }
      },
      scales: {
        y: {
          title: { display: true, text: "Index" },
          suggestedMin: 80,
          suggestedMax: 215
        }
      }
    }
  });
}

export function buildTaxBurdenPattern(data) {
  const canvas = document.getElementById("taxBurdenPatternChart");
  const cards = document.getElementById("taxBurdenPatternCards");
  if (!canvas || !cards) return;

  const rows = (data.taxStatements || [])
    .filter(row => row.netAmountDue !== null && row.netAmountDue !== undefined)
    .slice()
    .sort((a, b) => a.taxYear - b.taxYear);
  if (!rows.length) return;

  const labels = rows.map(row => row.taxYear);
  const netTaxes = rows.map(row => row.netAmountDue);
  const average = netTaxes.reduce((sum, value) => sum + value, 0) / netTaxes.length;
  const averageLine = rows.map(() => average);
  const peak = rows.reduce((highest, row) => row.netAmountDue > highest.netAmountDue ? row : highest, rows[0]);
  const latest = rows.at(-1);
  const latestVsAverage = latest.netAmountDue - average;
  const cardItems = [
    {
      label: "Highest net bill",
      value: moneyCents.format(peak.netAmountDue),
      note: `${peak.taxYear} statement year`
    },
    {
      label: "Period average",
      value: moneyCents.format(average),
      note: `${rows[0].taxYear}-${rows.at(-1).taxYear} statement years`
    },
    {
      label: "Latest net bill",
      value: moneyCents.format(latest.netAmountDue),
      note: `${latestVsAverage < 0 ? moneyCents.format(Math.abs(latestVsAverage)) + " below" : moneyCents.format(latestVsAverage) + " above"} average`
    }
  ];

  cards.innerHTML = cardItems.map(item => `
    <div class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${item.label}</p>
      <p class="mt-1 text-2xl font-bold text-slate-700">${item.value}</p>
      <p class="mt-1 text-xs leading-5 text-slate-500">${item.note}</p>
    </div>
  `).join("");

  taxBurdenPatternChart?.destroy();
  taxBurdenPatternChart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Net taxes paid",
          data: netTaxes,
          tension: 0.35,
          borderWidth: 3,
          borderColor: chartColors.contextTax,
          backgroundColor: semanticChartColors.taxBg,
          pointRadius: 5,
          pointHoverRadius: 6,
          pointBackgroundColor: rows.map(row => row.taxYear === peak.taxYear ? chartColors.contextTax : palette.white),
          pointBorderColor: chartColors.contextTax,
          pointBorderWidth: 2,
          fill: true
        },
        {
          label: "Average net bill",
          data: averageLine,
          tension: 0,
          borderWidth: 2,
          borderColor: palette.slate500,
          borderDash: [6, 5],
          pointRadius: 0,
          pointHoverRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: {
            boxWidth: 18,
            usePointStyle: false
          }
        },
        tooltip: {
          callbacks: {
            label: context => `${context.dataset.label}: ${moneyCents.format(context.parsed.y)}`
          }
        }
      },
      scales: {
        y: {
          title: { display: true, text: "Net taxes paid" },
          ticks: { callback: value => wholeMoney.format(value) },
          suggestedMin: Math.floor((Math.min(...netTaxes) - 150) / 250) * 250,
          suggestedMax: Math.ceil((Math.max(...netTaxes) + 150) / 250) * 250
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

function getDefaultAssessmentClass(data, ratioData) {
  const rawClass = `${data.classification?.propertyClass ?? data.parcel?.accountType ?? ""}`.toLowerCase();

  if (rawClass.includes("ag") || rawClass.includes("farm")) return "agFarm";
  if (rawClass.includes("comm")) return "commercial";
  if (rawClass.includes("res")) return "residential";

  return ratioData.classes[0]?.key ?? "residential";
}

function getLovTarget(classKey) {
  return classKey === "agFarm" ? 75 : 100;
}

function formatSignedChange(value, digits = 2) {
  if (value === null || value === undefined) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(digits)}`;
}

function hexToRgbChannel(hex) {
  const normalized = `${hex}`.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16)
  ].join(" ");
}

function colorAlpha(hex, alpha) {
  const channel = hexToRgbChannel(hex);
  return channel ? `rgb(${channel} / ${alpha})` : hex;
}

const assessmentStandardKeys = {
  residential: "residential-improved-rural",
  agFarm: "other-vacant-rural",
  commercial: "income-producing-rural"
};

const assessmentMeasureDefinitions = [
  {
    key: "cod",
    label: "Uniformity",
    color: chartColors.cod,
    fill: semanticChartColors.etrBg,
    cardBackground: semanticChartColors.etrSoft,
    cardBorder: semanticChartColors.etrRing,
    digits: 2,
    definition: "Uniformity is measured by COD. It shows how tightly individual assessments cluster around typical market value."
  },
  {
    key: "prd",
    label: "Price level fairness",
    color: chartColors.prd,
    fill: semanticChartColors.taxBg,
    cardBackground: semanticChartColors.taxSoft,
    cardBorder: semanticChartColors.taxRing,
    digits: 3,
    definition: "Price level fairness is measured by PRD. It shows whether lower- and higher-priced properties are being treated evenly."
  },
  {
    key: "cov",
    label: "Reliability",
    color: chartColors.cov,
    fill: semanticChartColors.valueBg,
    cardBackground: semanticChartColors.valueSoft,
    cardBorder: semanticChartColors.valueRing,
    digits: 2,
    definition: "Reliability is measured by COV. It shows whether the study results are stable enough to trust across the sales sample."
  }
];

function getAssessmentStandard(selectedClass, iaaoStandards) {
  const standardKey = assessmentStandardKeys[selectedClass.key] ?? assessmentStandardKeys.residential;

  return iaaoStandards?.codStandards?.find(item => item.key === standardKey)
    ?? iaaoStandards?.codStandards?.find(item => item.key === assessmentStandardKeys.residential);
}

function getAssessmentBandConfig(selectedClass, iaaoStandards) {
  const codStandard = getAssessmentStandard(selectedClass, iaaoStandards);

  return {
    cod: codStandard?.codRange ?? { min: 5, max: 20 },
    prd: iaaoStandards?.prdStandards?.acceptableRange ?? { min: 0.98, max: 1.03 },
    cov: codStandard?.estimatedCovRange ?? { min: 6.25, max: 25 }
  };
}

function bandPosition(value, range) {
  if (value === null || value === undefined || !range || range.max === range.min) return null;

  return (value - range.min) / (range.max - range.min);
}

function bandStatus(value) {
  if (value === null || value === undefined) return "no measure";
  if (value < 0) return "below standard band";
  if (value > 1) return "above standard band";

  return "inside standard band";
}

function formatMeasureValue(measureKey, value, digits) {
  if (value === null || value === undefined) return "—";
  if (measureKey === "prd") return value.toFixed(digits);

  return value.toFixed(digits);
}

function standardRangeLabel(range, digits = 2) {
  if (!range) return "standard band";

  return `${range.min.toFixed(digits)}-${range.max.toFixed(digits)}`;
}

const assessmentStandardBandPlugin = {
  id: "assessmentStandardBand",
  beforeDatasetsDraw(chart, args, options) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea || !scales.y) return;

    const top = scales.y.getPixelForValue(options.max ?? 1);
    const bottom = scales.y.getPixelForValue(options.min ?? 0);
    const y = Math.min(top, bottom);
    const height = Math.abs(bottom - top);

    ctx.save();
    ctx.fillStyle = options.backgroundColor ?? chartColors.standardBand;
    ctx.fillRect(chartArea.left, y, chartArea.right - chartArea.left, height);
    ctx.strokeStyle = options.borderColor ?? chartColors.standardBandBorder;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(chartArea.left, top);
    ctx.lineTo(chartArea.right, top);
    ctx.moveTo(chartArea.left, bottom);
    ctx.lineTo(chartArea.right, bottom);
    ctx.stroke();
    ctx.restore();
  }
};

function getAssessmentDisplayRecords(selectedClass) {
  return selectedClass.records.filter(row => (
    row.year >= assessmentDisplayYears.start && row.year <= assessmentDisplayYears.end
  ));
}

function renderAssessmentSummary(selectedClass) {
  const summary = document.getElementById("assessmentAccuracySummary");
  if (!summary) return;

  const latest = selectedClass.records.at(-1);
  const target = getLovTarget(selectedClass.key);

  const cards = [
    {
      label: "COD",
      value: latest.cod.toFixed(2),
      note: `${formatSignedChange(selectedClass.summary.codChangeSince2025)} from 2025`,
      color: chartColors.cod,
      help: "Coefficient of Dispersion shows how tightly assessment ratios cluster around the median. Lower values generally indicate more uniform assessments."
    },
    {
      label: "PRD",
      value: latest.prd.toFixed(3),
      note: `${formatSignedChange(selectedClass.summary.prdDistanceChangeSince2025, 3)} distance from 2025`,
      color: chartColors.prd,
      help: "Price-Related Differential checks whether lower- and higher-priced properties are assessed evenly. Values close to 1.00 are preferred."
    },
    {
      label: "COV",
      value: latest.cov.toFixed(2),
      note: `${formatSignedChange(selectedClass.summary.covChangeSince2025)} from 2025`,
      color: chartColors.cov,
      help: "Coefficient of Variation shows how spread out assessment ratios are around their average. Lower values generally indicate more consistent results."
    },
    {
      label: "Level of value",
      value: `${latest.levelOfValue.toFixed(2)}%`,
      note: `Target: ${target}%`,
      color: palette.teal,
      help: `Level of value compares assessed value with market value. The target for this class is ${target}%.`
    }
  ];

  summary.innerHTML = cards.map(card => `
    <div class="assessment-metric-card rounded-xl p-4" style="--metric-color: ${card.color}; --metric-bg: ${colorAlpha(card.color, 0.14)}; --metric-border: ${colorAlpha(card.color, 0.28)};">
      <div class="assessment-metric-heading">
        <p class="assessment-metric-label text-xs font-semibold uppercase tracking-wide">${card.label}</p>
        <span class="assessment-metric-help">
          <button type="button" class="assessment-help-button" aria-label="${card.label} explanation">?</button>
          <span class="assessment-help-tooltip" role="tooltip">${card.help}</span>
        </span>
      </div>
      <p class="assessment-metric-value mt-1 text-lg font-bold">${card.value}</p>
      <p class="assessment-metric-note mt-1 text-xs leading-5">${card.note}</p>
    </div>
  `).join("");
}

function renderAssessmentRows(selectedClass) {
  const table = document.getElementById("assessmentMeasureRows");
  if (!table) return;

  table.innerHTML = getAssessmentDisplayRecords(selectedClass).slice().reverse().map(row => `
    <tr>
      <td class="px-3 py-2 font-medium text-slate-700">${row.year}</td>
      <td class="px-3 py-2 text-right">${row.sales}</td>
      <td class="px-3 py-2 text-right">${row.cod.toFixed(2)}</td>
      <td class="px-3 py-2 text-right">${row.prd.toFixed(3)}</td>
      <td class="px-3 py-2 text-right">${row.cov.toFixed(2)}</td>
      <td class="px-3 py-2 text-right">${row.levelOfValue.toFixed(2)}%</td>
    </tr>
  `).join("");
}

function renderAssessmentAccuracyNotes(selectedClass, iaaoStandards) {
  const notes = document.getElementById("assessmentAccuracyNotes");
  if (!notes) return;

  const bandConfig = getAssessmentBandConfig(selectedClass, iaaoStandards);

  notes.innerHTML = assessmentMeasureDefinitions.map(definition => `
    <div class="assessment-note-card flex min-h-32 flex-col rounded-lg p-3" style="--measure-color: ${definition.color};">
      <p class="assessment-note-title">${definition.label}</p>
      <p class="assessment-note-body mt-2">${definition.definition}</p>
      <p class="assessment-note-band mt-auto pt-3 text-[11px] font-semibold uppercase tracking-wide">
        Standard band: ${standardRangeLabel(bandConfig[definition.key], definition.key === "prd" ? 2 : 1)}
      </p>
    </div>
  `).join("");
}

function renderAssessmentAccuracyChart(selectedClass, iaaoStandards) {
  const canvas = document.getElementById("assessmentAccuracyChart");
  if (!canvas) return;

  const records = getAssessmentDisplayRecords(selectedClass);
  const labels = records.map(row => row.year);
  const bandConfig = getAssessmentBandConfig(selectedClass, iaaoStandards);
  const datasets = assessmentMeasureDefinitions.map(definition => ({
    label: definition.label,
    measureKey: definition.key,
    digits: definition.digits,
    range: bandConfig[definition.key],
    data: records.map(row => bandPosition(row[definition.key], bandConfig[definition.key])),
    tension: 0.25,
    borderWidth: 3,
    borderColor: definition.color,
    backgroundColor: definition.fill,
    pointBackgroundColor: definition.color,
    pointBorderColor: definition.color,
    pointStyle: "circle"
  }));
  const chartValues = datasets.flatMap(dataset => dataset.data.filter(value => value !== null && value !== undefined));
  const minValue = Math.min(0, ...chartValues);
  const maxValue = Math.max(1, ...chartValues);

  assessmentAccuracyChart?.destroy();
  assessmentAccuracyChart = new Chart(canvas, {
    type: "line",
    data: { labels, datasets },
    plugins: [assessmentStandardBandPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            boxWidth: 8,
            boxHeight: 8
          }
        },
        tooltip: {
          callbacks: {
            label: context => {
              const rawValue = records[context.dataIndex]?.[context.dataset.measureKey];
              const value = formatMeasureValue(context.dataset.measureKey, rawValue, context.dataset.digits);
              return `${context.dataset.label}: ${value} (${bandStatus(context.parsed.y)})`;
            },
            footer: () => "Shaded area = standard band"
          }
        },
        assessmentStandardBand: {
          min: 0,
          max: 1
        }
      },
      scales: {
        y: {
          title: { display: true, text: "Position within standard range" },
          suggestedMin: Math.min(-0.25, Math.floor(minValue - 0.25)),
          suggestedMax: Math.max(1.5, Math.ceil(maxValue + 0.25)),
          ticks: {
            callback: value => {
              if (Number(value) === 0) return "Lower edge";
              if (Number(value) === 1) return "Upper edge";
              return Number(value).toFixed(1);
            }
          }
        }
      }
    }
  });
}

function renderAssessmentClass(selectedClass, iaaoStandards) {
  renderAssessmentSummary(selectedClass);
  renderAssessmentRows(selectedClass);
  renderAssessmentAccuracyChart(selectedClass, iaaoStandards);
  renderAssessmentAccuracyNotes(selectedClass, iaaoStandards);
  window.dispatchEvent(new CustomEvent("assessment-class-change", {
    detail: { key: selectedClass.key, label: selectedClass.label }
  }));
}

export function initAssessmentRatioAnalysis(data, ratioData, iaaoStandards) {
  const filter = document.getElementById("assessmentClassFilter");
  if (!filter) return;

  const defaultKey = getDefaultAssessmentClass(data, ratioData);

  filter.innerHTML = ratioData.classes.map(item => `
    <button
      type="button"
      data-assessment-class="${item.key}"
      class="rounded-lg px-3 py-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      aria-pressed="${item.key === defaultKey}"
    >
      ${item.label}
    </button>
  `).join("");

  const buttons = [...filter.querySelectorAll("[data-assessment-class]")];
  const update = key => {
    const selectedClass = ratioData.classes.find(item => item.key === key) ?? ratioData.classes[0];
    buttons.forEach(button => {
      const active = button.dataset.assessmentClass === selectedClass.key;
      button.classList.toggle("bg-slate-700", active);
      button.classList.toggle("text-white", active);
      button.classList.toggle("text-slate-600", !active);
      button.classList.toggle("hover:bg-white", !active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderAssessmentClass(selectedClass, iaaoStandards);
  };

  buttons.forEach(button => {
    button.addEventListener("click", () => update(button.dataset.assessmentClass));
  });

  update(defaultKey);
}

function indexedSeries(rows, valueFactor = 1, taxFactor = 1) {
  const usableValueRows = rows.filter(row => row.assessedValue !== null);
  const usableTaxRows = rows.filter(row => row.taxes !== null);
  const baseValue = usableValueRows[0]?.assessedValue;
  const baseTaxes = usableTaxRows[0]?.taxes;

  return {
    years: rows.map(row => row.year),
    valueIndex: rows.map(row => row.assessedValue && baseValue ? (row.assessedValue / baseValue) * 100 * valueFactor : null),
    taxIndex: rows.map(row => row.taxes && baseTaxes ? (row.taxes / baseTaxes) * 100 * taxFactor : null)
  };
}

function rowsByYear(rows) {
  return new Map(rows.map(row => [row.year, row]));
}

function propertyIndexedDatasets(propertyRows, years, palette = {}) {
  const propertyByYear = rowsByYear(propertyRows);
  const alignedRows = years.map(year => propertyByYear.get(year) ?? { year, assessedValue: null, taxes: null });
  const series = indexedSeries(alignedRows);
  const valueColor = palette.propertyValueColor ?? chartColors.propertyValue;
  const valueBg = palette.propertyValueBg ?? visualizationTheme.roles.comparisonSoft;
  const taxColor = palette.propertyTaxColor ?? chartColors.propertyTax;
  const taxBg = palette.propertyTaxBg ?? semanticChartColors.taxBg;

  return [
    {
      label: "This property value index",
      data: series.valueIndex,
      tension: 0.25,
      borderWidth: 2,
      borderColor: valueColor,
      backgroundColor: valueBg,
      borderDash: [6, 5],
      pointRadius: 3,
      pointStyle: "circle",
      spanGaps: true
    },
    {
      label: "This property tax index",
      data: series.taxIndex,
      tension: 0.25,
      borderWidth: 2,
      borderColor: taxColor,
      backgroundColor: taxBg,
      borderDash: [6, 5],
      pointRadius: 3,
      pointStyle: "circle",
      spanGaps: true
    }
  ];
}

function propertyRateDataset(propertyRows, years, palette = {}) {
  const propertyByYear = rowsByYear(propertyRows);
  const rateColor = palette.propertyRateColor ?? chartColors.propertyRate;
  const rateBg = palette.propertyRateBg ?? visualizationTheme.roles.comparisonSoft;

  return {
    label: "This property ETR",
    data: years.map(year => {
      const row = propertyByYear.get(year);
      const etr = row ? calculateEtr(row) : null;
      return etr === null ? null : etr * 100;
    }),
    tension: 0.25,
    borderWidth: 2,
    borderColor: rateColor,
    backgroundColor: rateBg,
    borderDash: [6, 5],
    pointRadius: 3,
    spanGaps: true
  };
}

function renderCustomLegend(elementId, datasets) {
  const legend = document.getElementById(elementId);
  if (!legend) return false;

  legend.innerHTML = datasets.map(dataset => `
    <div class="flex items-center gap-2">
      <span
        class="chart-legend-dot inline-block border-2"
        style="
          border-color: ${dataset.borderColor};
          background-color: ${dataset.borderDash ? palette.white : dataset.borderColor};
          ${dataset.borderDash ? "border-style: dashed;" : ""}
        "
      ></span>
      <span>${dataset.label}</span>
    </div>
  `).join("");
  return true;
}

function extractValuationGroupId(recordCard) {
  const raw = `${recordCard?.locationModel?.valuationGroup ?? ""}`;
  return raw.match(/\d+/)?.[0] ?? null;
}

function formatRatio(value, digits = 2) {
  if (value === null || value === undefined) return "—";
  return value.toFixed(digits);
}

function marketAreaSignal(selected, summary) {
  const medianDelta = selected.median - summary.median;
  const codDelta = selected.cod - summary.cod;
  const medianText = Math.abs(medianDelta) < 1
    ? "very close to the county residential median"
    : medianDelta > 0
      ? `${Math.abs(medianDelta).toFixed(2)} points above the county residential median`
      : `${Math.abs(medianDelta).toFixed(2)} points below the county residential median`;
  const codText = Math.abs(codDelta) < 1
    ? "roughly as uniform as the countywide residential study"
    : codDelta < 0
      ? `tighter than the countywide study by ${Math.abs(codDelta).toFixed(2)} COD points`
      : `wider than the countywide study by ${Math.abs(codDelta).toFixed(2)} COD points`;

  return `${selected.label} includes ${integer.format(selected.count)} qualified residential sales. Its median ratio is ${formatRatio(selected.median)}, ${medianText}, and its COD is ${formatRatio(selected.cod)}, ${codText}.`;
}

function valuationGroupLookup(valuationGroups, propertyClass = "Residential") {
  return new Map((valuationGroups?.valuationGroups || [])
    .filter(item => item.class === propertyClass)
    .map(item => [String(item.valuationGroup), item]));
}

function enrichedMarketGroups(groups, valuationGroups, propertyClass = "Residential") {
  const lookup = valuationGroupLookup(valuationGroups, propertyClass);

  return groups.map(group => {
    const listing = lookup.get(String(group.group));
    const description = listing?.description || group.description || "";
    const marketGroup = listing?.marketGroup || null;
    const descriptiveLabel = description
      ? `Valuation Group ${group.group} - ${description}`
      : group.label;
    const areaFirstLabel = description
      ? `${description} · VG ${group.group}`
      : group.label;
    const marketGroupLabel = marketGroup ? `${marketGroup} market` : "";

    return {
      ...group,
      description,
      marketGroup,
      label: areaFirstLabel,
      descriptiveLabel,
      optionLabel: marketGroupLabel ? `${areaFirstLabel} (${marketGroupLabel})` : areaFirstLabel,
      shortLabel: description ? `VG ${group.group} - ${description}` : group.label
    };
  });
}

function renderMarketSignalCards(selected, summary) {
  const container = document.getElementById("marketSignalCards");
  if (!container) return;

  const cards = [
    ["Qualified sales", integer.format(selected.count), `${integer.format(summary.numberOfSales)} countywide`],
    ["Median ratio", formatRatio(selected.median), `County: ${formatRatio(summary.median)}`],
    ["COD", formatRatio(selected.cod), `County: ${formatRatio(summary.cod)}`],
    ["PRD", formatRatio(selected.prd), `County: ${formatRatio(summary.prd)}`]
  ];

  container.innerHTML = cards.map(([label, value, note]) => `
    <div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</p>
      <p class="mt-1 text-lg font-bold text-slate-700">${value}</p>
      <p class="mt-1 text-xs leading-5 text-slate-500">${note}</p>
    </div>
  `).join("");
}

function renderMarketNarrative(selected, summary) {
  const narrative = document.getElementById("marketNarrative");
  if (!narrative) return;
  narrative.textContent = marketAreaSignal(selected, summary);
}

function priceBandStudyForClass(padRatioData, classKey = "residential") {
  if (classKey === "residential" || !padRatioData.priceBandStudies?.[classKey]) {
    return {
      key: "residential",
      label: "Residential sale-price bands",
      description: "Incremental residential sale-price ranges from the same PAD R&O pages help reviewers understand where the qualified sales are concentrated.",
      chartNote: "Qualified sales by price band, including empty upper bands.",
      rows: padRatioData.salePriceRanges.filter(row => row.section === "Incremental Ranges"),
      totalRow: padRatioData.salePriceRanges
        .find(row => row.range === "ALL" || row.section === "All") ?? {
          count: padRatioData.summary.numberOfSales,
          median: padRatioData.summary.median,
          cod: padRatioData.summary.cod,
          prd: padRatioData.summary.prd,
          averageAdjustedSalePrice: padRatioData.summary.averageAdjustedSalePrice
        }
    };
  }

  return padRatioData.priceBandStudies[classKey];
}

function propertyClassLabelForStudy(classKey = "residential", study = {}) {
  if (study.propertyClassLabel) return study.propertyClassLabel;
  if (classKey === "agFarm") return "agricultural";
  if (classKey === "commercial") return "commercial";
  return "residential";
}

function getPadRoSourceAnchor(padRatioData) {
  const source = padRatioData.source || {};
  const year = source.reportYear ?? source.title?.match(/\b20\d{2}\b/)?.[0] ?? "Current";
  const countyName = source.countyName ? `${source.countyName} County` : "county";
  const pageRange = source.sourcePageRange
    ?? (source.sourcePages?.length ? `${source.sourcePages[0]}-${source.sourcePages.at(-1)}` : "");
  const pageText = pageRange ? `, pages ${pageRange}` : "";

  return `Source: ${year} ${countyName} PAD R&O${pageText}.`;
}

function getPadRoRefreshWatch(padRatioData) {
  const source = padRatioData.source || {};
  if (!source.reportYear || !source.nextReviewAfter) return "";

  const reviewDate = new Date(`${source.nextReviewAfter}T00:00:00`);
  if (Number.isNaN(reviewDate.getTime()) || new Date() < reviewDate) return "";

  const nextYear = source.reportYear + 1;

  // R&Os are due around April 7, but the app cannot assume the new PDF has been
  // digested into JSON that day. Keep this as a quiet refresh watch until the
  // next report file is extracted and the manifest points at the new JSON.
  return ` R&O refresh watch: ${nextYear} data may be available; this section still uses ${source.reportYear} data.`;
}

function renderMarketSalePriceRows(padRatioData, classKey = "residential") {
  const table = document.getElementById("marketSalePriceRows");
  if (!table) return;

  const study = priceBandStudyForClass(padRatioData, classKey);
  const rows = study.rows || [];
  const totalRow = study.totalRow;
  const title = document.getElementById("marketSalePriceTitle");
  const description = document.getElementById("marketSalePriceDescription");
  const chartTitle = document.getElementById("marketSalePriceChartTitle");
  const chartNote = document.getElementById("marketSalePriceChartNote");
  const source = document.getElementById("marketSalePriceSource");
  const propertyClassLabel = propertyClassLabelForStudy(study.key ?? classKey, study);

  if (title) title.textContent = `What makes up the ${propertyClassLabel} sales data?`;
  if (description) description.textContent = study.description || "";
  if (chartTitle) chartTitle.textContent = study.chartTitle || "Sales distribution";
  if (chartNote) chartNote.textContent = study.chartNote || "Qualified sales by band.";
  if (source) source.textContent = `${getPadRoSourceAnchor(padRatioData)}${getPadRoRefreshWatch(padRatioData)}`;

  const dataRows = rows.map(row => `
    <tr>
      <td class="px-2 py-2 font-medium text-slate-700">${row.range}</td>
      <td class="px-2 py-2 text-right">${integer.format(row.count)}</td>
      <td class="px-2 py-2 text-right">${row.count ? formatRatio(row.median) : "—"}</td>
      <td class="px-2 py-2 text-right">${row.count ? formatRatio(row.cod) : "—"}</td>
      <td class="px-2 py-2 text-right">${row.count ? formatRatio(row.prd) : "—"}</td>
      <td class="px-2 py-2 text-right">${row.count ? wholeMoney.format(row.averageAdjustedSalePrice) : "—"}</td>
    </tr>
  `).join("");
  const footerRow = totalRow ? `
    <tr class="table-total-row font-semibold">
      <td class="px-2 py-2">Total / average</td>
      <td class="px-2 py-2 text-right">${integer.format(totalRow.count)}</td>
      <td class="px-2 py-2 text-right">${formatRatio(totalRow.median)}</td>
      <td class="px-2 py-2 text-right">${formatRatio(totalRow.cod)}</td>
      <td class="px-2 py-2 text-right">${formatRatio(totalRow.prd)}</td>
      <td class="px-2 py-2 text-right">${wholeMoney.format(totalRow.averageAdjustedSalePrice)}</td>
    </tr>
  ` : "";

  table.innerHTML = dataRows + footerRow;
  renderMarketSalePriceChart(rows, study);
}

function shortPriceBandLabel(range) {
  const compactBandNumber = value => {
    if (value >= 1000000) return `$${integer.format(value / 1000000)}M`;
    if (value >= 1000) return `$${integer.format(Math.round(value / 1000))}K`;
    return `$${integer.format(value)}`;
  };
  const numbers = range.match(/\d[\d,]*/g)?.map(value => Number(value.replace(/,/g, ""))) ?? [];

  if (range.includes("+") && numbers.length) return `${compactBandNumber(numbers[0])}+`;
  if (numbers.length >= 2) return `${compactBandNumber(numbers[0])}-${compactBandNumber(numbers[1] + 1)}`;

  return range;
}

function renderMarketSalePriceChart(rows, study = {}) {
  const canvas = document.getElementById("marketSalePriceChart");
  if (!canvas) return;
  const datasets = [
    {
      type: "bar",
      label: study.countLabel || "Sales",
      data: rows.map(row => row.count),
      backgroundColor: semanticChartColors.valueBg,
      borderColor: chartColors.contextValue,
      borderWidth: 2,
      borderRadius: 6,
      order: 2
    },
    {
      type: "line",
      label: study.lineLabel || "Distribution curve",
      data: rows.map(row => row.count),
      tension: 0.38,
      borderWidth: 3,
      borderColor: chartColors.contextTax,
      backgroundColor: semanticChartColors.taxBg,
      pointBackgroundColor: chartColors.contextTax,
      pointRadius: 3,
      fill: true,
      order: 1
    }
  ];
  const hasCustomLegend = renderCustomLegend("marketSalePriceChartLegend", datasets);

  marketSalePriceChart?.destroy();
  marketSalePriceChart = new Chart(canvas, {
    data: {
      labels: rows.map(row => shortPriceBandLabel(row.range)),
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: !hasCustomLegend,
          labels: {
            boxWidth: 28,
            boxHeight: 9
          }
        },
        tooltip: {
          callbacks: {
            title: context => rows[context[0].dataIndex]?.range ?? "",
            label: context => `${context.dataset.label}: ${integer.format(context.parsed.y)}`
          }
        }
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: study.yAxisTitle || "Qualified sales" },
          ticks: { precision: 0 }
        }
      }
    }
  });
}

function renderMarketRatioChart(selected, summary) {
  const canvas = document.getElementById("marketRatioChart");
  if (!canvas) return;
  const selectedLabel = selected.shortLabel || selected.label;

  marketRatioChart?.destroy();
  marketRatioChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["Median", "Weighted mean", "Mean", "PRD"],
      datasets: [
        {
          label: selectedLabel,
          data: [selected.median, selected.weightedMean, selected.mean, selected.prd],
          backgroundColor: semanticChartColors.valueBg,
          borderColor: chartColors.contextValue,
          borderWidth: 2
        },
        {
          label: "All Gage residential",
          data: [summary.median, summary.weightedMean, summary.mean, summary.prd],
          backgroundColor: visualizationTheme.roles.comparisonSoft,
          borderColor: chartColors.propertyValue,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          suggestedMin: 75,
          suggestedMax: 115
        }
      }
    }
  });
}

function renderMarketValueChart(selected, summary) {
  const canvas = document.getElementById("marketValueChart");
  if (!canvas) return;
  const selectedLabel = selected.shortLabel || selected.label;

  marketValueChart?.destroy();
  marketValueChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["Avg. adjusted sale price", "Avg. assessed value"],
      datasets: [
        {
          label: selectedLabel,
          data: [selected.averageAdjustedSalePrice, selected.averageAssessedValue],
          backgroundColor: visualizationTheme.roles.marketSoft,
          borderColor: visualizationTheme.roles.market,
          borderWidth: 2
        },
        {
          label: "All Gage residential",
          data: [summary.averageAdjustedSalePrice, summary.averageAssessedValue],
          backgroundColor: visualizationTheme.roles.attentionSoft,
          borderColor: visualizationTheme.roles.attention,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: context => `${context.dataset.label}: ${wholeMoney.format(context.parsed.y)}`
          }
        }
      },
      scales: {
        y: {
          ticks: { callback: value => compactMoney.format(value) }
        }
      }
    }
  });
}

export function initMarketAreaView(data, recordCard, padRatioData, valuationGroups) {
  const select = document.getElementById("marketAreaSelect");
  if (!select || !padRatioData?.valuationGroups?.length) return;

  const groups = enrichedMarketGroups(padRatioData.valuationGroups, valuationGroups, padRatioData.source.propertyClass);
  const defaultGroup = extractValuationGroupId(recordCard) ?? groups[0].group;
  const sourceNote = document.getElementById("marketSourceNote");
  if (sourceNote) {
    const defaultListing = groups.find(group => String(group.group) === String(defaultGroup));
    sourceNote.textContent = `${padRatioData.source.title}, ${padRatioData.source.countyName} County ${padRatioData.source.propertyClass}, pages ${padRatioData.source.sourcePages.join("-")}. The property default follows ${defaultListing?.label ?? recordCard.locationModel.valuationGroup}.`;
  }

  select.innerHTML = groups.map(group => `
    <option value="${group.group}">${group.optionLabel ?? group.label}</option>
  `).join("");

  const update = groupId => {
    const selected = groups.find(group => String(group.group) === String(groupId)) ?? groups[0];
    select.value = selected.group;
    renderMarketSignalCards(selected, padRatioData.summary);
    renderMarketNarrative(selected, padRatioData.summary);
    renderMarketRatioChart(selected, padRatioData.summary);
    renderMarketValueChart(selected, padRatioData.summary);
  };

  select.addEventListener("change", () => update(select.value));
  window.addEventListener("assessment-class-change", event => {
    renderMarketSalePriceRows(padRatioData, event.detail?.key);
  });
  renderMarketSalePriceRows(padRatioData, getDefaultAssessmentClass(data, padRatioData));
  update(defaultGroup);
}

function buildIndexedOverviewChart(canvasId, data, labels, valueFactor, taxFactor) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const series = indexedSeries(data.taxpayerHistory, valueFactor, taxFactor);

  new Chart(canvas, {
    type: "line",
    data: {
      labels: series.years,
      datasets: [
        {
          label: labels.value,
          data: series.valueIndex,
          tension: 0.25,
          borderWidth: 3,
          borderColor: chartColors.contextValue,
          backgroundColor: semanticChartColors.valueBg,
          spanGaps: true
        },
        {
          label: labels.tax,
          data: series.taxIndex,
          tension: 0.25,
          borderWidth: 3,
          borderColor: chartColors.contextTax,
          backgroundColor: semanticChartColors.taxBg,
          spanGaps: true
        },
        ...propertyIndexedDatasets(data.taxpayerHistory, series.years)
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: {
            boxWidth: 34,
            boxHeight: 10,
            padding: 18
          }
        }
      },
      scales: {
        y: {
          title: { display: true, text: "Index" },
          suggestedMin: 80,
          suggestedMax: 215
        }
      }
    }
  });
}

function buildCertifiedIndexedChart(canvasId, rows, labels, propertyRows, palette = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !rows?.length) return;

  const baseValue = rows[0].totalValue;
  const baseTaxes = rows[0].taxesLevied;
  const years = rows.map(row => row.year);
  const valueColor = palette.valueColor ?? chartColors.contextValue;
  const valueBg = palette.valueBg ?? semanticChartColors.valueBg;
  const taxColor = palette.taxColor ?? chartColors.contextTax;
  const taxBg = palette.taxBg ?? semanticChartColors.taxBg;
  const datasets = [
    {
      label: labels.value,
      data: rows.map(row => (row.totalValue / baseValue) * 100),
      tension: 0.25,
      borderWidth: 3,
      borderColor: valueColor,
      backgroundColor: valueBg
    },
    {
      label: labels.tax,
      data: rows.map(row => (row.taxesLevied / baseTaxes) * 100),
      tension: 0.25,
      borderWidth: 3,
      borderColor: taxColor,
      backgroundColor: taxBg
    },
    ...propertyIndexedDatasets(propertyRows, years, palette)
  ];
  const hasCustomLegend = renderCustomLegend(`${canvasId}Legend`, datasets);

  new Chart(canvas, {
    type: "line",
    data: {
      labels: years,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: !hasCustomLegend,
          labels: {
            boxWidth: 34,
            boxHeight: 10,
            padding: 18
          }
        }
      },
      scales: {
        y: {
          title: { display: true, text: "Index" },
          suggestedMin: 90,
          suggestedMax: 170
        }
      }
    }
  });
}

export function buildEtrChart(data) {
  const years = data.taxpayerHistory.map(row => row.year);
  const etrValues = data.taxpayerHistory.map(row => {
    const etr = calculateEtr(row);
    return etr === null ? null : etr * 100;
  });

  new Chart(document.getElementById("etrChart"), {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label: "Effective tax rate",
          data: etrValues,
          tension: 0.25,
          borderWidth: 3,
          borderColor: chartColors.contextValue,
          backgroundColor: semanticChartColors.etrBg,
          spanGaps: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        tooltip: {
          callbacks: {
            label: context => context.parsed.y === null ? "ETR: Pending" : `ETR: ${context.parsed.y.toFixed(2)}%`
          }
        }
      },
      scales: {
        y: {
          title: { display: true, text: "Effective tax rate" },
          ticks: { callback: value => `${value}%` },
          suggestedMin: 1.0,
          suggestedMax: 2.2
        }
      }
    }
  });
}

function buildEtrOverviewChart(canvasId, data, label, factor) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const years = data.taxpayerHistory.map(row => row.year);
  const etrValues = data.taxpayerHistory.map(row => {
    const etr = calculateEtr(row);
    return etr === null ? null : etr * 100 * factor;
  });

  new Chart(canvas, {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label,
          data: etrValues,
          tension: 0.25,
          borderWidth: 3,
          borderColor: chartColors.contextValue,
          backgroundColor: semanticChartColors.etrBg,
          spanGaps: true
        },
        propertyRateDataset(data.taxpayerHistory, years)
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      scales: {
        y: {
          title: { display: true, text: "Effective tax rate" },
          ticks: { callback: value => `${value}%` },
          suggestedMin: 1.0,
          suggestedMax: 2.2
        }
      }
    }
  });
}

function buildCertifiedRateChart(canvasId, rows, label, propertyRows, palette = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !rows?.length) return;
  const years = rows.map(row => row.year);
  const rateColor = palette.rateColor ?? chartColors.contextValue;
  const rateBg = palette.rateBg ?? semanticChartColors.valueBg;
  const datasets = [
    {
      label,
      data: rows.map(row => row.averageTaxRate * 100),
      tension: 0.25,
      borderWidth: 3,
      borderColor: rateColor,
      backgroundColor: rateBg
    },
    propertyRateDataset(propertyRows, years, palette)
  ];
  const hasCustomLegend = renderCustomLegend(`${canvasId}Legend`, datasets);

  new Chart(canvas, {
    type: "line",
    data: {
      labels: years,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: !hasCustomLegend }
      },
      scales: {
        y: {
          title: { display: true, text: "Average tax rate" },
          ticks: { callback: value => `${value}%` },
          suggestedMin: 1.0,
          suggestedMax: 2.0
        }
      }
    }
  });
}

export function buildOverviewCharts(data, ctlData) {
  const countyName = getPropertyCountyName(data, ctlData);
  const countyLabel = countyDisplayName(countyName);
  const countyRows = ctlData.counties
    .filter(row => row.countyName === countyName)
    .sort((a, b) => a.year - b.year);
  const stateRows = ctlData.statewide.slice().sort((a, b) => a.year - b.year);

  buildIndexedOverviewChart("marketIndexedChart", data, { value: "Market area value index", tax: "Market area tax index" }, 0.96, 1.01);
  buildEtrOverviewChart("marketEtrChart", data, "Market area ETR", 0.98);

  buildCertifiedIndexedChart("countyIndexedChart", countyRows, { value: `${countyLabel} value index`, tax: `${countyLabel} tax index` }, data.taxpayerHistory);
  buildCertifiedRateChart("countyEtrChart", countyRows, `${countyLabel} average tax rate`, data.taxpayerHistory);

  buildCertifiedIndexedChart("stateIndexedChart", stateRows, { value: "Statewide value index", tax: "Statewide tax index" }, data.taxpayerHistory, {
    valueColor: semanticChartColors.value,
    valueBg: semanticChartColors.valueBg,
    taxColor: semanticChartColors.tax,
    taxBg: semanticChartColors.taxBg,
    propertyValueColor: semanticChartColors.value,
    propertyValueBg: semanticChartColors.valueBg,
    propertyTaxColor: semanticChartColors.tax,
    propertyTaxBg: semanticChartColors.taxBg
  });
  buildCertifiedRateChart("stateEtrChart", stateRows, "Statewide average tax rate", data.taxpayerHistory, {
    rateColor: semanticChartColors.tax,
    rateBg: semanticChartColors.taxBg,
    propertyRateColor: semanticChartColors.etr,
    propertyRateBg: semanticChartColors.etrBg
  });
}

function indexChange(rows, key) {
  if (!rows?.length) return null;
  return (rows.at(-1)[key] / rows[0][key]) - 1;
}

function formatChange(value) {
  if (value === null || value === undefined) return "—";
  return percent.format(value);
}

function countyDisplayName(name) {
  if (name === "Statewide") return name;
  return `${name.toLowerCase().replace(/\b\w/g, character => character.toUpperCase())} County`;
}

function propertyRecordCountyLabel(recordCard, data, ctlData) {
  const recordCounty = `${recordCard?.source?.county ?? ""}`.trim();
  if (recordCounty) return recordCounty;
  return countyDisplayName(getPropertyCountyName(data, ctlData));
}

function getPropertyCountyName(data, ctlData) {
  const requested = `${data.parcel?.countyName ?? data.parcel?.county ?? data.countyName ?? ""}`.trim().toUpperCase();
  const names = new Set(ctlData.counties.map(row => row.countyName));

  if (names.has(requested)) return requested;
  return ctlData.counties.find(row => row.countyName === "GAGE")?.countyName ?? ctlData.counties[0]?.countyName;
}

function getCtlRowsForTarget(ctlData, target) {
  const rows = target === "__STATE__"
    ? ctlData.statewide
    : ctlData.counties.filter(row => row.countyName === target);

  return rows.slice().sort((a, b) => a.year - b.year);
}

function ctlIndexedRows(rows, valueKey, taxKey) {
  const baseValue = rows[0]?.[valueKey];
  const baseTaxes = rows[0]?.[taxKey];

  return {
    value: rows.map(row => baseValue ? (row[valueKey] / baseValue) * 100 : null),
    taxes: rows.map(row => baseTaxes ? (row[taxKey] / baseTaxes) * 100 : null)
  };
}

function renderCountyComparisonSummary(primaryRows, comparisonRows, primaryLabel, comparisonLabel) {
  const container = document.getElementById("countyComparisonSummary");
  if (!container) return;

  const cards = [
    [`${primaryLabel} value growth`, formatChange(indexChange(primaryRows, "totalValue"))],
    [`${comparisonLabel} value growth`, formatChange(indexChange(comparisonRows, "totalValue"))],
    [`${primaryLabel} tax growth`, formatChange(indexChange(primaryRows, "taxesLevied"))],
    [`${comparisonLabel} tax growth`, formatChange(indexChange(comparisonRows, "taxesLevied"))]
  ];

  container.innerHTML = cards.map(([label, value]) => `
    <div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</p>
      <p class="mt-1 text-lg font-bold text-slate-700">${value}</p>
    </div>
  `).join("");
}

function renderCountyComparisonCharts(ctlData, primaryCounty, comparisonTarget) {
  const primaryRows = getCtlRowsForTarget(ctlData, primaryCounty);
  const comparisonRows = getCtlRowsForTarget(ctlData, comparisonTarget);
  if (!primaryRows.length || !comparisonRows.length) return;

  const primaryLabel = countyDisplayName(primaryCounty);
  const comparisonLabel = comparisonTarget === "__STATE__" ? "Statewide" : countyDisplayName(comparisonTarget);
  const years = primaryRows.map(row => row.year);
  const primaryIndex = ctlIndexedRows(primaryRows, "totalValue", "taxesLevied");
  const comparisonIndex = ctlIndexedRows(comparisonRows, "totalValue", "taxesLevied");
  const comparisonTaxColor = colorAlpha(semanticChartColors.tax, 0.52);
  const indexedDatasets = [
    {
      label: `${primaryLabel} value index`,
      data: primaryIndex.value,
      tension: 0.25,
      borderWidth: 3,
      borderColor: chartColors.contextValue,
      backgroundColor: semanticChartColors.valueBg
    },
    {
      label: `${primaryLabel} tax index`,
      data: primaryIndex.taxes,
      tension: 0.25,
      borderWidth: 3,
      borderColor: chartColors.contextTax,
      backgroundColor: semanticChartColors.taxBg
    },
    {
      label: `${comparisonLabel} value index`,
      data: comparisonIndex.value,
      tension: 0.25,
      borderWidth: 2,
      borderColor: chartColors.propertyValue,
      backgroundColor: visualizationTheme.roles.comparisonSoft,
      borderDash: [6, 5]
    },
    {
      label: `${comparisonLabel} tax index`,
      data: comparisonIndex.taxes,
      tension: 0.25,
      borderWidth: 2,
      borderColor: comparisonTaxColor,
      backgroundColor: semanticChartColors.taxBg,
      borderDash: [6, 5]
    }
  ];
  const rateDatasets = [
    {
      label: `${primaryLabel} average tax rate`,
      data: primaryRows.map(row => row.averageTaxRate * 100),
      tension: 0.25,
      borderWidth: 3,
      borderColor: chartColors.contextValue,
      backgroundColor: semanticChartColors.valueBg
    },
    {
      label: `${comparisonLabel} average tax rate`,
      data: comparisonRows.map(row => row.averageTaxRate * 100),
      tension: 0.25,
      borderWidth: 2,
      borderColor: chartColors.propertyValue,
      backgroundColor: visualizationTheme.roles.comparisonSoft,
      borderDash: [6, 5]
    }
  ];
  const hasIndexedLegend = renderCustomLegend("countyComparisonIndexedChartLegend", indexedDatasets);
  const hasRateLegend = renderCustomLegend("countyComparisonRateChartLegend", rateDatasets);

  document.getElementById("countyComparisonIndexedNote").textContent = `${primaryLabel} is compared with ${comparisonLabel}, indexed to ${years[0]}.`;
  document.getElementById("countyComparisonRateNote").textContent = `${primaryLabel} and ${comparisonLabel} average CTL tax rates.`;
  renderCountyComparisonSummary(primaryRows, comparisonRows, primaryLabel, comparisonLabel);

  countyComparisonIndexedChart?.destroy();
  countyComparisonIndexedChart = new Chart(document.getElementById("countyComparisonIndexedChart"), {
    type: "line",
    data: {
      labels: years,
      datasets: indexedDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: !hasIndexedLegend }
      },
      scales: {
        y: {
          title: { display: true, text: "Index" },
          suggestedMin: 90,
          suggestedMax: 170
        }
      }
    }
  });

  countyComparisonRateChart?.destroy();
  countyComparisonRateChart = new Chart(document.getElementById("countyComparisonRateChart"), {
    type: "line",
    data: {
      labels: years,
      datasets: rateDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: !hasRateLegend }
      },
      scales: {
        y: {
          title: { display: true, text: "Average tax rate" },
          ticks: { callback: value => `${value}%` },
          suggestedMin: 1.0,
          suggestedMax: 2.0
        }
      }
    }
  });
}

export function initCountyComparison(data, ctlData, recordCard) {
  const select = document.getElementById("countyComparisonTarget");
  if (!select) return;

  const primaryCounty = getPropertyCountyName(data, ctlData);
  const heading = document.getElementById("countyComparisonTitle");
  if (heading) {
    heading.textContent = `How does ${propertyRecordCountyLabel(recordCard, data, ctlData)} compare?`;
  }
  const countyNames = [...new Set(ctlData.counties.map(row => row.countyName))].sort();
  select.innerHTML = [
    `<option value="__STATE__" selected>Statewide</option>`,
    ...countyNames
      .filter(name => name !== primaryCounty)
      .map(name => `<option value="${name}">${countyDisplayName(name)}</option>`)
  ].join("");

  select.value = "__STATE__";
  select.selectedIndex = 0;
  select.addEventListener("change", () => {
    renderCountyComparisonCharts(ctlData, primaryCounty, select.value);
  });
  renderCountyComparisonCharts(ctlData, primaryCounty, select.value);
}

export function buildCtlSummary(data, ctlData) {
  const countyName = getPropertyCountyName(data, ctlData);
  const countyRows = ctlData.counties
    .filter(row => row.countyName === countyName)
    .sort((a, b) => a.year - b.year);
  const stateRows = ctlData.statewide.slice().sort((a, b) => a.year - b.year);

  const countySummary = document.getElementById("countyCtlSummary");
  if (countySummary) {
    countySummary.innerHTML = [
      ["Value growth", formatChange(indexChange(countyRows, "totalValue"))],
      ["Tax growth", formatChange(indexChange(countyRows, "taxesLevied"))],
      ["Rate movement", `${(countyRows[0].averageTaxRate * 100).toFixed(2)}% to ${(countyRows.at(-1).averageTaxRate * 100).toFixed(2)}%`]
    ].map(([label, value]) => `
      <div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</p>
        <p class="mt-1 text-lg font-bold text-slate-700">${value}</p>
      </div>
    `).join("");
  }

  const stateSummary = document.getElementById("stateCtlSummary");
  if (stateSummary) {
    const stateCards = [
      {
        label: "Statewide value index",
        value: formatChange(indexChange(stateRows, "totalValue")),
        note: "Total certified value growth since 2019.",
        color: semanticChartColors.value,
        bg: semanticChartColors.valueSoft,
        ring: semanticChartColors.valueRing
      },
      {
        label: "Statewide tax index",
        value: formatChange(indexChange(stateRows, "taxesLevied")),
        note: "Total taxes levied growth since 2019.",
        color: semanticChartColors.tax,
        bg: semanticChartColors.taxSoft,
        ring: semanticChartColors.taxRing
      },
      {
        label: "Statewide average tax rate",
        value: `${(stateRows[0].averageTaxRate * 100).toFixed(2)}% to ${(stateRows.at(-1).averageTaxRate * 100).toFixed(2)}%`,
        note: "Average CTL tax-rate movement over the same period.",
        color: semanticChartColors.tax,
        bg: semanticChartColors.taxSoft,
        ring: semanticChartColors.taxRing
      }
    ];

    stateSummary.innerHTML = stateCards.map(card => `
      <div class="rounded-xl p-4" style="background-color: ${card.bg}; box-shadow: inset 0 0 0 1px ${card.ring};">
        <div class="flex items-center gap-2">
          <span class="chart-legend-dot inline-block" style="background-color: ${card.color};"></span>
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-700">${card.label}</p>
        </div>
        <p class="mt-2 text-lg font-bold text-slate-700">${card.value}</p>
        <p class="mt-1 text-sm leading-5 text-slate-600">${card.note}</p>
      </div>
    `).join("");
  }
}

function sheetRows(contextData, key) {
  return contextData.sheets?.[key]?.rows ?? [];
}

function findMetric(rows, metric, subgroup = "County") {
  return rows.find(row => row.metric === metric && (!subgroup || row.subgroup === subgroup));
}

function formatContextValue(row) {
  if (!row) return "—";
  if (typeof row.value === "string") return row.value;
  if (row.unit === "$") return wholeMoney.format(row.value);
  if (row.unit === "%") return percent.format(row.value);
  if (row.unit === "people" || row.unit === "count") return integer.format(row.value);
  if (row.unit) return `${integer.format(row.value)} ${row.unit}`;
  return integer.format(row.value);
}

function formatCardValue(row) {
  if (!row) return { value: "—", note: "" };
  if (typeof row.value === "string") return { value: row.value, note: row.unit ?? "" };
  if (row.unit === "$") return { value: wholeMoney.format(row.value), note: row.dataYear ?? row.year ?? "" };
  if (row.unit === "%") return { value: percent.format(row.value), note: row.dataYear ?? row.year ?? "" };
  if (row.unit === "people" || row.unit === "count") return { value: integer.format(row.value), note: row.dataYear ?? row.year ?? "" };
  if (row.unit) return { value: integer.format(row.value), note: `${row.unit} • ${row.dataYear ?? row.year ?? ""}` };
  return { value: integer.format(row.value), note: row.dataYear ?? row.year ?? "" };
}

function renderDemographicCards(contextData) {
  const container = document.getElementById("demographicProfileCards");
  if (!container) return;

  const profile = sheetRows(contextData, "countyProfile");
  const demographics = sheetRows(contextData, "demographics");
  const cards = [
    ["Population", findMetric(demographics, "Population")],
    ["Land area", findMetric(demographics, "Land Area")],
    ["Density", findMetric(demographics, "Population Density")],
    ["Median income", findMetric(demographics, "Median Household Income")],
    ["Avg home value", findMetric(profile, "Avg Home Value")],
    ["Businesses", findMetric(profile, "# of Businesses")]
  ];

  container.innerHTML = cards.map(([label, row]) => {
    const display = formatCardValue(row);
    return `
    <div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</p>
      <p class="mt-1 text-lg font-bold text-slate-700">${display.value}</p>
      <p class="mt-1 text-xs text-slate-500">${display.note}</p>
    </div>
  `;
  }).join("");
}

function buildCountyValueMixChart(contextData) {
  const canvas = document.getElementById("countyValueMixChart");
  const notes = document.getElementById("countyValueMixNotes");
  const county = sheetRows(contextData, "municipalValueByType").find(row => row.jurisdictionType === "County")
    ?? sheetRows(contextData, "valuationsByPropertytype20").find(row => row.level === "County");
  if (!canvas || !county) return;

  const categories = [
    ["Agricultural", (county.agland ?? 0) + (county.agdwellAndHs ?? 0) + (county.agimprvAndFs ?? 0)],
    ["Residential", county.residential ?? 0],
    ["Commercial / industrial", (county.commercial ?? 0) + (county.industrial ?? 0)],
    ["Personal / state assessed", (county.personalProp ?? 0) + (county.stateasdPp ?? county.stateAssessedPp ?? 0) + (county.stateasdreal ?? county.stateAssessedReal ?? 0)],
    ["Other", (county.recreation ?? 0) + (county.minerals ?? 0)]
  ].filter(([, value]) => value > 0);
  const colors = visualizationTheme.sequences.categorical;
  const total = categories.reduce((sum, [, value]) => sum + value, 0);

  new Chart(canvas, {
    type: "pie",
    data: {
      labels: categories.map(row => row[0]),
      datasets: [{
        data: categories.map(row => row[1]),
        backgroundColor: colors,
        borderColor: palette.white,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => `${context.label}: ${compactMoney.format(context.parsed)} (${percent.format(context.parsed / total)})`
          }
        }
      }
    }
  });

  if (!notes) return;

  notes.innerHTML = categories.map(([label, value], index) => `
    <div class="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
      <div class="flex items-center gap-2">
        <span class="h-2.5 w-2.5 rounded-full" style="background-color: ${colors[index]};"></span>
        <p class="font-semibold leading-5 text-slate-700">${label}</p>
      </div>
      <p class="mt-0.5 text-xs leading-4 text-slate-600">${percent.format(value / total)} of value</p>
    </div>
  `).join("");
}

function buildCountyAgeMixChart(contextData) {
  const canvas = document.getElementById("countyAgeMixChart");
  const rows = sheetRows(contextData, "demographics").filter(row => row.category === "Age");
  if (!canvas || !rows.length) return;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: rows.map(row => row.metric.replace("Age ", "")),
      datasets: [{
        label: "Share of population",
        data: rows.map(row => row.value * 100),
        backgroundColor: visualizationTheme.sequences.blueScale,
        borderColor: visualizationTheme.colors.primary,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          ticks: { callback: value => `${value}%` },
          suggestedMax: 65
        }
      }
    }
  });
}

function buildCommunityPopulationChart(contextData) {
  const canvas = document.getElementById("communityPopulationChart");
  const rows = sheetRows(contextData, "countyProfile")
    .filter(row => row.metric === "Population 2025" && row.subgroup !== "County")
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  if (!canvas || !rows.length) return;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: rows.map(row => row.subgroup),
      datasets: [{
        label: "2025 population",
        data: rows.map(row => row.value),
        backgroundColor: visualizationTheme.roles.comparisonSoft,
        borderColor: visualizationTheme.roles.comparison,
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { callback: value => integer.format(value) }
        }
      }
    }
  });
}

function buildHouseholdSignalsChart(contextData) {
  const canvas = document.getElementById("householdSignalsChart");
  const metrics = [
    "Households with One Child",
    "Households with 2+ Children",
    "Households with Seniors 65+"
  ];
  const rows = metrics.map(metric => findMetric(sheetRows(contextData, "demographics"), metric)).filter(Boolean);
  if (!canvas || !rows.length) return;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: rows.map(row => row.metric.replace("Households with ", "")),
      datasets: [{
        label: "Households",
        data: rows.map(row => row.value),
        backgroundColor: visualizationTheme.sequences.blueScale,
        borderColor: visualizationTheme.colors.primary,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          ticks: { callback: value => integer.format(value) }
        }
      }
    }
  });
}

function renderDemographicFacts(contextData) {
  const table = document.getElementById("demographicFactsRows");
  if (!table) return;

  const demographicRows = sheetRows(contextData, "demographics")
    .map(row => ({ ...row, source: "Demographics", year: row.dataYear }));
  const profileRows = sheetRows(contextData, "countyProfile")
    .filter(row => row.subgroup === "County")
    .map(row => ({ ...row, source: "County Profile" }));
  const rows = [...profileRows, ...demographicRows].slice(0, 48);

  table.innerHTML = rows.map(row => `
    <tr>
      <td class="px-3 py-2 font-medium text-slate-700">${row.source}</td>
      <td class="px-3 py-2">${row.category}</td>
      <td class="px-3 py-2">${row.metric}</td>
      <td class="px-3 py-2">${row.subgroup}</td>
      <td class="px-3 py-2 text-right font-medium">${formatContextValue(row)}</td>
      <td class="px-3 py-2 text-slate-600">${row.year ?? ""}</td>
    </tr>
  `).join("");
}

export function initDemographicsView(contextData) {
  renderDemographicCards(contextData);
  buildCountyValueMixChart(contextData);
  buildCountyAgeMixChart(contextData);
  buildCommunityPopulationChart(contextData);
  buildHouseholdSignalsChart(contextData);
  renderDemographicFacts(contextData);
}

function normalizeSchoolToken(value = "") {
  return `${value}`
    .toUpperCase()
    .replace(/PUBLIC SCHOOLS?|SCHOOL DISTRICT|DISTRICT|SCHOOLS?/g, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function schoolDistrictTokens(district = {}) {
  return [
    district.name,
    ...(district.aliases || []),
    ...(district.district_codes || [])
  ].map(normalizeSchoolToken).filter(Boolean);
}

function getSchoolLevyDescription(data) {
  return data.latestFinalLevyComponents?.find(row => row.group === "School")?.description ?? "";
}

function findSchoolDistrictColor(data, schoolDistrictColors) {
  const districts = schoolDistrictColors?.districts || [];
  if (!districts.length) return null;

  const propertyTokens = [
    data.parcel?.schoolDistrict,
    getSchoolLevyDescription(data)
  ].map(normalizeSchoolToken).filter(Boolean);

  return districts.find(district => {
    const tokens = schoolDistrictTokens(district);
    return propertyTokens.some(propertyToken => tokens.some(token => (
      token === propertyToken || propertyToken.includes(token) || token.includes(propertyToken)
    )));
  }) ?? null;
}

function levyColorForGroup(label, schoolColor) {
  return label === "School" && schoolColor
    ? schoolColor
    : levyGroupColors[label] ?? levyGroupColors.Other;
}

export function buildDistributionChart(data, schoolDistrictColors) {
  const grouped = groupLevy(data.latestFinalLevyComponents);
  const total = Object.values(grouped).reduce((sum, value) => sum + value, 0);
  const schoolDistrictColor = findSchoolDistrictColor(data, schoolDistrictColors)?.map_color;
  const sorted = Object.entries(grouped)
    .map(([label, rate]) => ({ label, rate, share: rate / total }))
    .sort((a, b) => b.rate - a.rate);
  const labels = sorted.map(row => row.label);
  const values = sorted.map(row => row.rate);
  const colors = sorted.map(row => levyColorForGroup(row.label, schoolDistrictColor));

  new Chart(document.getElementById("distributionChart"), {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: palette.white,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => `${context.label}: ${percent.format(context.parsed / total)}`
          }
        }
      }
    }
  });

  document.getElementById("distributionNotes").innerHTML = sorted.map(row => `
    <div class="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
      <div class="flex items-center gap-2">
        <span class="h-2.5 w-2.5 rounded-full" style="background-color: ${levyColorForGroup(row.label, schoolDistrictColor)}"></span>
        <p class="font-semibold leading-5 text-slate-700">${row.label}</p>
      </div>
      <p class="mt-0.5 text-xs leading-4 text-slate-600">${percent.format(row.share)} of levy</p>
    </div>
  `).join("");
}
