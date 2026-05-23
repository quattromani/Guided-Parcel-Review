import { calculateEtr, percent } from "./format.js";
import {
  chartColors,
  semanticChartColors,
  visualizationTheme
} from "./config/visualization-palettes.js";
import {
  getClassMarketStats,
  getCodInterpretationRange,
  getCountywideMarketPoint,
  getMarketScatterPoints,
  getMedianRatioRange,
  getParcelMarketClass,
  getParcelMarketGroupId,
  getSelectedMarketGroup,
  normalizeMarketClassKey
} from "./market-stats.js";
import { getMetricSignal } from "./metric-signals.js";
import { sortHistoryAscending } from "./calculations/history.js";
import { escapeHtml } from "./utils/html.js";

export { initDemographicsView } from "./charts/demographics.js";
export { buildDistributionChart } from "./charts/tax-distribution.js";

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
let assessmentBandCharts = [];
let countyComparisonIndexedChart;
let countyComparisonRateChart;
let equalizationSalePriceChart;
let marketGroupSalesChart;
let marketPositionScatterChart;
let marketSignalCharts = [];
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

function hasDataValue(value) {
  return value !== null && value !== undefined;
}

function formattedTooltipValues(rows, key, formatter, factor = 1) {
  return rows.map(row => hasDataValue(row?.[key]) ? formatter.format(row[key] * factor) : "Pending");
}

function taxpayerTimelineRows(data) {
  return sortHistoryAscending(data?.taxpayerHistory || []);
}

function indexedTooltipLabel(context) {
  const label = context.dataset.tooltipLabel ?? context.dataset.label;
  const tooltipValues = context.dataset.tooltipValues;

  if (tooltipValues) {
    return `${label}: ${tooltipValues[context.dataIndex] ?? "Pending"}`;
  }

  return `${label}: ${context.parsed.y?.toFixed(1) ?? "Pending"}`;
}

function isMobileChartViewport() {
  return window.matchMedia?.("(max-width: 640px)")?.matches ?? false;
}

function pendingColumnsForRows(rows, isPending) {
  return (rows || [])
    .map((row, index) => ({
      index,
      year: row?.year,
      pending: Boolean(isPending(row, index))
    }))
    .filter(row => row.pending);
}

function pendingColumnsForDataRows(rows, keys) {
  return pendingColumnsForRows(rows, row =>
    keys.some(key => !hasDataValue(row?.[key]))
  );
}

function pendingColumnsForChartDatasets(labels, datasets) {
  return (labels || [])
    .map((label, index) => ({
      index,
      year: label,
      pending: datasets.some(dataset => {
        const value = dataset?.data?.[index];
        return value === null || value === undefined || Number.isNaN(Number(value));
      })
    }))
    .filter(row => row.pending);
}

function pendingColumnOptions(columns) {
  return {
    columns,
    showLabel: () => !isMobileChartViewport()
  };
}

function mobileAxisTitle(text, display = true) {
  return { display, text };
}

function hexToRgba(hex, alpha) {
  const value = `${hex ?? ""}`.replace("#", "");
  if (![3, 6].includes(value.length)) return hex;
  const normalized = value.length === 3
    ? value.split("").map(character => character + character).join("")
    : value;
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, safeRadius);
    return;
  }

  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
}

function pendingColumnBounds(xScale, chartArea, index, labelCount) {
  const current = xScale.getPixelForValue(index);
  const previous = index > 0 ? xScale.getPixelForValue(index - 1) : chartArea.left;
  const next = index < labelCount - 1 ? xScale.getPixelForValue(index + 1) : chartArea.right;
  let left = index > 0 ? previous : chartArea.left;
  let right = current;

  if (!Number.isFinite(left) || !Number.isFinite(right) || right <= left) {
    left = index > 0 ? (previous + current) / 2 : chartArea.left;
    right = index < labelCount - 1 ? (current + next) / 2 : chartArea.right;
  }

  return {
    left: Math.max(chartArea.left, left),
    right: Math.min(chartArea.right, right)
  };
}

const indexedPendingColumnPlugin = {
  id: "indexedPendingColumn",
  beforeDatasetsDraw(chart, args, options = {}) {
    const { ctx, chartArea, scales } = chart;
    const columns = options.columns ?? [];
    if (!chartArea || !scales.x || !columns.length) return;

    const labelCount = chart.data.labels?.length ?? 0;

    ctx.save();
    columns.forEach(column => {
      const { left, right } = pendingColumnBounds(scales.x, chartArea, column.index, labelCount);
      const width = right - left;
      if (width <= 0) return;

      ctx.fillStyle = options.backgroundColor ?? hexToRgba(visualizationTheme.roles.pending, 0.25);
      ctx.fillRect(left, chartArea.top, width, chartArea.bottom - chartArea.top);
      ctx.strokeStyle = options.borderColor ?? hexToRgba(visualizationTheme.roles.pendingText, 0.20);
      ctx.lineWidth = 1;
      ctx.strokeRect(left, chartArea.top, width, chartArea.bottom - chartArea.top);
    });
    ctx.restore();
  },
  afterDatasetsDraw(chart, args, options = {}) {
    const { ctx, chartArea, scales } = chart;
    const columns = options.columns ?? [];
    const showLabel = typeof options.showLabel === "function" ? options.showLabel() : options.showLabel;
    if (!chartArea || !scales.x || !columns.length || showLabel === false) return;

    const labelCount = chart.data.labels?.length ?? 0;
    const label = options.label ?? "Pending";

    ctx.save();
    ctx.font = "700 11px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    columns.forEach(column => {
      const { left, right } = pendingColumnBounds(scales.x, chartArea, column.index, labelCount);
      const width = right - left;
      if (width < 32) return;

      const pillWidth = Math.min(Math.max(ctx.measureText(label).width + 18, 64), Math.max(width - 10, 40));
      const pillHeight = 22;
      const x = left + (width - pillWidth) / 2;
      const y = chartArea.top + 8;

      ctx.fillStyle = options.labelBackgroundColor ?? visualizationTheme.roles.pending;
      ctx.strokeStyle = options.labelBorderColor ?? hexToRgba(visualizationTheme.roles.pendingText, 0.24);
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, x, y, pillWidth, pillHeight, pillHeight / 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = options.labelColor ?? visualizationTheme.roles.pendingText;
      ctx.fillText(label, x + pillWidth / 2, y + pillHeight / 2 + 0.5);
    });
    ctx.restore();
  }
};

export function buildIndexedChart(data) {
  const rows = taxpayerTimelineRows(data);
  const usableValueRows = rows.filter(row => hasDataValue(row.assessedValue));
  const usableTaxRows = rows.filter(row => hasDataValue(row.taxes));
  const years = rows.map(row => row.year);
  const baseValue = usableValueRows[0]?.assessedValue;
  const baseTaxes = usableTaxRows[0]?.taxes;
  const pendingColumns = pendingColumnsForDataRows(rows, ["assessedValue", "taxes"]);
  const isMobileChart = isMobileChartViewport();
  const indexedPendingBadge = document.getElementById("indexedPendingBadge");

  if (indexedPendingBadge) {
    indexedPendingBadge.classList.add("hidden");
  }

  const indexedTrendsIntro = document.getElementById("indexedTrendsIntro");
  if (indexedTrendsIntro) {
    const baseYear = usableValueRows[0]?.year ?? usableTaxRows[0]?.year;
    indexedTrendsIntro.textContent = baseYear
      ? `Using ${baseYear} as the baseline, compare how assessed value and net taxes moved after levy changes and credits were applied.`
      : "Compare how assessed value and net taxes moved after levy changes and credits were applied.";
  }

  const valueIndex = rows.map(row =>
    hasDataValue(row.assessedValue) && baseValue ? (row.assessedValue / baseValue) * 100 : null
  );
  const taxIndex = rows.map(row =>
    hasDataValue(row.taxes) && baseTaxes ? (row.taxes / baseTaxes) * 100 : null
  );
  const datasets = [
    {
      label: "Assessed value",
      tooltipValues: formattedTooltipValues(rows, "assessedValue", wholeMoney),
      data: valueIndex,
      tension: 0.25,
      borderWidth: 3,
      borderColor: chartColors.contextValue,
      backgroundColor: semanticChartColors.valueBg,
      fill: true,
      spanGaps: true
    },
    {
      label: "Tax bill",
      tooltipValues: formattedTooltipValues(rows, "taxes", moneyCents),
      data: taxIndex,
      tension: 0.25,
      borderWidth: 3,
      borderColor: chartColors.contextTax,
      backgroundColor: semanticChartColors.taxBg,
      fill: true,
      spanGaps: true
    }
  ];
  const hasCustomLegend = renderCustomLegend("indexedChartLegend", datasets);

  new Chart(document.getElementById("indexedChart"), {
    type: "line",
    plugins: [indexedPendingColumnPlugin],
    data: {
      labels: years,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        indexedPendingColumn: pendingColumnOptions(pendingColumns),
        legend: { display: !hasCustomLegend },
        tooltip: {
          callbacks: {
            label: indexedTooltipLabel
          }
        }
      },
      scales: {
        y: {
          title: { display: !isMobileChart, text: "Index" },
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
    .filter(row => Number.isFinite(Number(row.netAmountDue)) && Number.isFinite(Number(row.taxYear)))
    .map(row => ({
      ...row,
      netAmountDue: Number(row.netAmountDue),
      taxYear: Number(row.taxYear)
    }))
    .slice()
    .sort((a, b) => a.taxYear - b.taxYear);
  if (!rows.length) return;

  const labels = rows.map(row => row.taxYear);
  const netTaxes = rows.map(row => Number(row.netAmountDue));
  const average = netTaxes.reduce((sum, value) => sum + value, 0) / netTaxes.length;
  const averageLine = rows.map(() => average);
  const peak = rows.reduce((highest, row) => row.netAmountDue > highest.netAmountDue ? row : highest, rows[0]);
  const latest = rows.at(-1);
  const latestVsAverage = latest.netAmountDue - average;
  const rangeLabel = `${rows[0].taxYear}-${rows.at(-1).taxYear}`;
  const netChangeOverPeriod = calculateNetChangeOverPeriod(
    rows[0].netAmountDue,
    latest.netAmountDue
  );
  const cardItems = [
    {
      label: "Latest net bill",
      value: moneyCents.format(latest.netAmountDue),
      pill: `${latestVsAverage < 0 ? "-" : "+"}${moneyCents.format(Math.abs(latestVsAverage))}`
    },
    {
      label: "Highest net bill",
      value: moneyCents.format(peak.netAmountDue),
      pill: peak.taxYear
    },
    {
      label: "Period average",
      value: moneyCents.format(average),
      pill: rangeLabel
    },
    {
      label: "Net change over period",
      value: netChangeOverPeriod === null ? "Not available" : formatCurrencyDelta(netChangeOverPeriod),
      pill: rangeLabel
    }
  ];

  cards.innerHTML = cardItems.map(item => `
    <div class="tax-pattern-card review-note grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
      <div class="min-w-0">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${item.label}</p>
        <p class="mt-1 text-2xl font-bold text-slate-700">${item.value}</p>
      </div>
      <div class="tax-pattern-context">
        <span class="tax-pattern-pill">${item.pill}</span>
      </div>
    </div>
  `).join("");

  taxBurdenPatternChart?.destroy();
  taxBurdenPatternChart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Net taxes",
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
          title: mobileAxisTitle("Net taxes"),
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

function calculateNetChangeOverPeriod(firstValue, lastValue) {
  const first = Number(firstValue);
  const last = Number(lastValue);

  if (!Number.isFinite(first) || !Number.isFinite(last)) {
    return null;
  }

  return last - first;
}

function formatCurrencyDelta(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "Not available";
  if (number === 0) return moneyCents.format(0);

  return `${number < 0 ? "-" : "+"}${moneyCents.format(Math.abs(number))}`;
}

function getDefaultAssessmentClass(data, ratioData) {
  const rawClass = `${data.classification?.propertyClass ?? data.parcel?.accountType ?? ""}`.toLowerCase();

  if (rawClass.includes("ag") || rawClass.includes("farm")) return "agFarm";
  if (rawClass.includes("comm") || rawClass.includes("industrial")) return "commercial";
  if (rawClass.includes("res")) return "residential";

  return ratioData.classes[0]?.key ?? "residential";
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
  agFarm: "agricultural-rural",
  commercial: "income-producing-rural"
};

const assessmentLevelStandardKeys = {
  residential: "nebraska-residential-real-property",
  agFarm: "nebraska-agricultural-horticultural-special-valuation",
  commercial: "nebraska-commercial-real-property"
};

const assessmentMeasureDefinitions = [
  {
    key: "cod",
    label: "Uniformity",
    shortLabel: "COD",
    category: "Statistical measure",
    color: chartColors.cod,
    fill: semanticChartColors.equalizationBg,
    cardBackground: semanticChartColors.equalizationSoft,
    cardBorder: semanticChartColors.equalizationRing,
    digits: 2,
    borderDash: [],
    pointStyle: "circle",
    definition: "COD measures uniformity by showing how tightly assessment ratios cluster around the median."
  },
  {
    key: "prd",
    label: "Price-related balance",
    shortLabel: "PRD",
    category: "Statistical measure",
    color: chartColors.prd,
    fill: semanticChartColors.equalizationBg,
    cardBackground: semanticChartColors.equalizationSoft,
    cardBorder: semanticChartColors.equalizationRing,
    digits: 3,
    borderDash: [7, 5],
    pointStyle: "rectRot",
    definition: "PRD shows whether lower- and higher-priced properties are treated evenly."
  },
  {
    key: "cov",
    label: "Variation",
    shortLabel: "COV",
    category: "Statistical measure",
    color: chartColors.cov,
    fill: semanticChartColors.equalizationBg,
    cardBackground: semanticChartColors.equalizationSoft,
    cardBorder: semanticChartColors.equalizationRing,
    digits: 2,
    borderDash: [2, 5],
    pointStyle: "triangle",
    approximateBand: true,
    definition: "COV shows relative variation around the mean ratio, with its band used as approximate context."
  }
];

const assessmentLevelDefinition = {
  key: "levelOfValue",
  label: "Level of value",
  shortLabel: "LOV",
  category: "Class median range",
  color: chartColors.levelOfValue,
  fill: semanticChartColors.equalizationBg,
  cardBackground: semanticChartColors.equalizationSoft,
  cardBorder: semanticChartColors.equalizationRing,
  digits: 2,
  valueSuffix: "%",
  borderDash: [],
  pointStyle: "rect",
  definition: "Level of value uses the median ratio to show whether the class is within its assessment range."
};

const assessmentBandDefinitions = [
  ...assessmentMeasureDefinitions,
  assessmentLevelDefinition
];

function getAssessmentStandardByKey(collection, key) {
  return collection?.find(item => item.key === key) ?? null;
}

function getCodAssessmentStandard(selectedClass, iaaoStandards) {
  const standardKey = assessmentStandardKeys[selectedClass.key] ?? assessmentStandardKeys.residential;

  return getAssessmentStandardByKey(iaaoStandards?.codStandards, standardKey);
}

function getAssessmentLevelStandard(selectedClass, iaaoStandards) {
  const standardKey = assessmentLevelStandardKeys[selectedClass.key] ?? assessmentLevelStandardKeys.residential;

  return getAssessmentStandardByKey(iaaoStandards?.assessmentLevelStandards, standardKey)
    ?? getAssessmentStandardByKey(iaaoStandards?.assessmentLevelStandards, assessmentLevelStandardKeys.residential);
}

function getAssessmentBandConfig(selectedClass, iaaoStandards) {
  const codStandard = getCodAssessmentStandard(selectedClass, iaaoStandards);
  const levelStandard = getAssessmentLevelStandard(selectedClass, iaaoStandards);

  return {
    levelOfValue: levelStandard?.range ?? { min: 92, max: 100, center: 96 },
    cod: codStandard?.codRange ?? null,
    prd: iaaoStandards?.prdStandards?.acceptableRange ?? { min: 0.98, max: 1.03 },
    cov: codStandard?.estimatedCovRange ?? null
  };
}

function bandPosition(value, range) {
  if (value === null || value === undefined || !range || range.max === range.min) return null;

  return (value - range.min) / (range.max - range.min);
}

function bandStatus(value, approximate = false) {
  const bandLabel = approximate ? "context band" : "standard band";

  if (value === null || value === undefined) return "no measure";
  if (value < 0) return `below ${bandLabel}`;
  if (value > 1) return `above ${bandLabel}`;

  return `inside ${bandLabel}`;
}

const OUTSIDE_BAND_ALARM_DISTANCE_POINTS = 1.2;

function bandDistancePoints(value, range) {
  if (value === null || value === undefined || !range) return 0;

  const numericValue = Number(value);
  const min = Number(range.min);
  const max = Number(range.max);
  if (!Number.isFinite(numericValue) || !Number.isFinite(min) || !Number.isFinite(max)) return 0;

  const distance = numericValue < min ? min - numericValue : numericValue > max ? numericValue - max : 0;
  const usesRatioScale = Math.max(Math.abs(numericValue), Math.abs(min), Math.abs(max)) <= 2;

  return usesRatioScale ? distance * 100 : distance;
}

function rawBandStatus(value, range, { approximate = false } = {}) {
  const bandLabel = approximate ? "context band" : "standard band";

  if (value === null || value === undefined || !range) {
    return { label: "No direct band", tone: "unknown" };
  }

  const outsideTone = bandDistancePoints(value, range) >= OUTSIDE_BAND_ALARM_DISTANCE_POINTS
    ? "outside"
    : "caution";

  if (value < range.min) return { label: `Below ${bandLabel}`, tone: outsideTone };
  if (value > range.max) return { label: `Above ${bandLabel}`, tone: outsideTone };

  return { label: `Inside ${bandLabel}`, tone: "inside" };
}

function assessmentLevelStatus(value, range) {
  if (value === null || value === undefined || !range) {
    return { label: "No target status", tone: "unknown" };
  }

  const outsideTone = bandDistancePoints(value, range) >= OUTSIDE_BAND_ALARM_DISTANCE_POINTS
    ? "outside"
    : "caution";

  if (value < range.min) return { label: "Below class range", tone: outsideTone };
  if (value > range.max) return { label: "Above class range", tone: outsideTone };
  return { label: "Inside class range", tone: "inside" };
}

function formatMeasureValue(measureKey, value, digits, suffix = "") {
  if (value === null || value === undefined) return "—";
  if (measureKey === "prd") return value.toFixed(digits);

  return `${value.toFixed(digits)}${suffix}`;
}

function standardRangeLabel(range, digits = 2, fallback = "No direct band") {
  if (!range) return fallback;

  return `${range.min.toFixed(digits)}-${range.max.toFixed(digits)}`;
}

function assessmentDefinitionRangeLabel(definition, range) {
  if (!range) return "No direct standard band";

  if (definition.key === "levelOfValue") {
    return `Class range: ${standardRangeLabel(range, 0)}%`;
  }

  const label = definition.approximateBand ? "Approx. context band" : "Standard band";
  const digits = definition.key === "prd" ? 2 : 1;

  return `${label}: ${standardRangeLabel(range, digits)}`;
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

const assessmentEndLabelPlugin = {
  id: "assessmentEndLabels",
  afterDatasetsDraw(chart, args, options = {}) {
    if (!options.enabled) return;
    if (isMobileChartViewport()) return;

    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    const labels = chart.data.datasets
      .map((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (meta.hidden) return null;

        let pointIndex = dataset.data.length - 1;
        while (pointIndex >= 0 && !Number.isFinite(dataset.data[pointIndex])) {
          pointIndex -= 1;
        }

        const point = meta.data[pointIndex];
        if (!point) return null;

        const { x, y } = typeof point.getProps === "function"
          ? point.getProps(["x", "y"], true)
          : point;

        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

        return {
          text: dataset.endLabel ?? dataset.label,
          color: dataset.borderColor,
          pointX: x,
          pointY: y,
          labelY: y
        };
      })
      .filter(Boolean)
      .sort((left, right) => left.labelY - right.labelY);

    if (!labels.length) return;

    const minGap = options.minGap ?? 17;
    const top = chartArea.top + 8;
    const bottom = chartArea.bottom - 8;
    let previousY = top - minGap;

    labels.forEach(label => {
      label.labelY = Math.min(bottom, Math.max(top, label.labelY));
      if (label.labelY < previousY + minGap) {
        label.labelY = previousY + minGap;
      }
      previousY = label.labelY;
    });

    const overflow = labels.at(-1).labelY - bottom;
    if (overflow > 0) {
      labels.forEach(label => {
        label.labelY = Math.max(top, label.labelY - overflow);
      });
    }

    ctx.save();
    ctx.font = "700 11px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    labels.forEach(label => {
      const labelX = Math.min(chart.width - (options.maxRightInset ?? 40), chartArea.right + (options.offsetX ?? 9));
      const width = ctx.measureText(label.text).width + 13;
      const height = 18;

      ctx.strokeStyle = colorAlpha(label.color, 0.54);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(label.pointX + 4, label.pointY);
      ctx.lineTo(labelX - 5, label.labelY);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      ctx.strokeStyle = colorAlpha(label.color, 0.34);
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, labelX - 6, label.labelY - height / 2, width, height, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = label.color;
      ctx.fillText(label.text, labelX, label.labelY + 0.5);
    });

    ctx.restore();
  }
};

const marketPositionReferencePlugin = {
  id: "marketPositionReference",
  beforeDatasetsDraw(chart, args, options = {}) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea || !scales.x || !scales.y) return;

    ctx.save();
    const medianRange = options.medianRange;
    if (medianRange) {
      const xStart = scales.x.getPixelForValue(medianRange.min);
      const xEnd = scales.x.getPixelForValue(medianRange.max);
      const left = Math.max(chartArea.left, Math.min(xStart, xEnd));
      const right = Math.min(chartArea.right, Math.max(xStart, xEnd));

      if (right > left) {
        ctx.fillStyle = options.medianBandColor ?? colorAlpha(visualizationTheme.roles.equalization, 0.10);
        ctx.fillRect(left, chartArea.top, right - left, chartArea.bottom - chartArea.top);
      }
    }

    const countywide = options.countywide;
    if (countywide) {
      const centerX = scales.x.getPixelForValue(countywide.median);
      const centerY = scales.y.getPixelForValue(countywide.cod);
      if (Number.isFinite(centerX) && Number.isFinite(centerY)) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
        ctx.clip();

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(chartArea.width, chartArea.height) * 0.42);
        gradient.addColorStop(0, colorAlpha(visualizationTheme.roles.equalization, 0.07));
        gradient.addColorStop(0.72, colorAlpha(visualizationTheme.roles.equalization, 0.022));
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);

        [
          { xRadius: 5.5, yRadius: 4.4, alpha: 0.155 },
          { xRadius: 11, yRadius: 8.8, alpha: 0.11 },
          { xRadius: 17.6, yRadius: 14.3, alpha: 0.078 }
        ].forEach(ring => {
          const radiusX = Math.abs(scales.x.getPixelForValue(countywide.median + ring.xRadius) - centerX);
          const radiusY = Math.abs(scales.y.getPixelForValue(countywide.cod + ring.yRadius) - centerY);
          if (!Number.isFinite(radiusX) || !Number.isFinite(radiusY) || radiusX <= 0 || radiusY <= 0) return;

          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.strokeStyle = colorAlpha(visualizationTheme.roles.equalization, ring.alpha);
          ctx.lineWidth = 1.1;
          ctx.setLineDash([2, 5]);
          ctx.stroke();
        });
        ctx.restore();
      }
    }

    const codRange = options.codRange;
    if (codRange) {
      const yStart = scales.y.getPixelForValue(codRange.min);
      const yEnd = scales.y.getPixelForValue(codRange.max);
      const top = Math.max(chartArea.top, Math.min(yStart, yEnd));
      const bottom = Math.min(chartArea.bottom, Math.max(yStart, yEnd));

      if (bottom > top) {
        ctx.fillStyle = options.codBandColor ?? colorAlpha(visualizationTheme.roles.comparison, 0.08);
        ctx.fillRect(chartArea.left, top, chartArea.right - chartArea.left, bottom - top);
      }
    }
    ctx.restore();
  },
  afterDatasetsDraw(chart, args, options = {}) {
    const { ctx, chartArea, scales } = chart;
    const countywide = options.countywide;
    if (!chartArea || !scales.x || !scales.y || !countywide) return;

    const x = scales.x.getPixelForValue(countywide.median);
    const y = scales.y.getPixelForValue(countywide.cod);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    ctx.save();
    ctx.strokeStyle = options.countyLineColor ?? colorAlpha(visualizationTheme.roles.comparison, 0.42);
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.moveTo(chartArea.left, y);
    ctx.lineTo(chartArea.right, y);
    ctx.stroke();
    ctx.restore();
  }
};

function getAssessmentDisplayRecords(selectedClass) {
  return (selectedClass.records || [])
    .filter(row => (
      row.year >= assessmentDisplayYears.start && row.year <= assessmentDisplayYears.end
    ))
    .slice()
    .sort((a, b) => a.year - b.year);
}

function renderAssessmentSummary(selectedClass, iaaoStandards) {
  const summary = document.getElementById("assessmentAccuracySummary");
  if (!summary) return;

  const latest = getAssessmentDisplayRecords(selectedClass).at(-1);
  const title = document.getElementById("assessmentBandCardsTitle");
  if (title) {
    title.textContent = latest?.year
      ? `Where does each measure stand in ${latest.year}?`
      : "Where does each measure stand?";
  }
  const classSummary = assessmentClassSummary(selectedClass);
  const bandConfig = getAssessmentBandConfig(selectedClass, iaaoStandards);
  const levelRange = bandConfig.levelOfValue;
  const levelRangeText = standardRangeLabel(levelRange, 0, "No class range");
  const levelRangeNote = levelRange ? `Class range: ${levelRangeText}%` : levelRangeText;
  const levelHelp = levelRange
    ? `Level of value uses the median ratio to show the class assessment level. The applicable range for this class is ${levelRangeText}%.`
    : "Level of value uses the median ratio as the class-level assessment indicator.";

  const cards = [
    {
      label: "COD",
      value: latest.cod.toFixed(2),
      note: `${formatSignedChange(classSummary.codChangeSince2025)} from 2025`,
      color: chartColors.cod,
      status: rawBandStatus(latest.cod, bandConfig.cod),
      help: "Coefficient of Dispersion shows how tightly assessment ratios group around the median. Lower values usually mean more uniform assessments. Very low COD readings should still be read with sample context."
    },
    {
      label: "PRD",
      value: latest.prd.toFixed(3),
      note: `${formatSignedChange(classSummary.prdDistanceChangeSince2025, 3)} from 2025`,
      color: chartColors.prd,
      status: rawBandStatus(latest.prd, bandConfig.prd),
      help: "Price-Related Differential checks whether lower-priced and higher-priced properties are assessed consistently. Values close to 1.00 are preferred."
    },
    {
      label: "COV",
      value: latest.cov.toFixed(2),
      note: `${formatSignedChange(classSummary.covChangeSince2025)} from 2025`,
      color: chartColors.cov,
      status: rawBandStatus(latest.cov, bandConfig.cov, { approximate: true }),
      help: "Coefficient of Variation shows how spread out assessment ratios are around their average. The displayed band is approximate context, not a direct COD substitute."
    },
    {
      label: "Level of value",
      mobileLabel: "LOV",
      value: `${latest.levelOfValue.toFixed(2)}<span class="equalization-mobile-optional">%</span>`,
      note: levelRange ? `${levelRangeText}<span class="equalization-mobile-optional">%</span> range` : levelRangeNote,
      color: chartColors.levelOfValue,
      status: assessmentLevelStatus(latest.levelOfValue, levelRange),
      help: levelHelp
    }
  ];
  const cardByKey = new Map([
    ["cod", cards[0]],
    ["prd", cards[1]],
    ["cov", cards[2]],
    ["levelOfValue", cards[3]]
  ]);
  const detailOpen = window.matchMedia("(min-width: 768px)").matches;

  assessmentBandCharts.forEach(chart => chart.destroy());
  assessmentBandCharts = [];

  summary.innerHTML = assessmentBandDefinitions.map(definition => {
    const card = cardByKey.get(definition.key);
    const range = bandConfig[definition.key];

    return `
    <article class="assessment-metric-card assessment-band-card metric-signal-card metric-signal-card-neutral rounded-xl p-4" style="--metric-color: ${card.color}; --metric-bg: ${colorAlpha(card.color, 0.045)}; --metric-border: ${colorAlpha(card.color, 0.24)}; --measure-color: ${definition.color}; --measure-bg: ${colorAlpha(definition.color, 0.045)}; --measure-border: ${colorAlpha(definition.color, 0.25)};">
      <div class="assessment-metric-topline">
        <div class="min-w-0">
          <p class="assessment-metric-label assessment-metric-heading text-xs font-semibold uppercase tracking-wide">
            <span class="assessment-metric-label-full">${card.label}</span>
            <span class="assessment-metric-label-short" aria-hidden="true">${card.mobileLabel ?? card.label}</span>
            <span class="assessment-metric-help">
              <button type="button" class="assessment-help-button" aria-label="${card.label} explanation">?</button>
              <span class="assessment-help-tooltip" role="tooltip">${card.help}</span>
            </span>
          </p>
          <p class="assessment-metric-value mt-1 text-lg font-bold">${card.value}</p>
          <p class="assessment-metric-note mt-1 text-xs leading-5">${card.note}</p>
          <p class="metric-signal-text mt-2">${card.status.label}</p>
        </div>
      </div>

      <details class="assessment-detail-drawer" ${detailOpen ? "open" : ""}>
        <summary class="assessment-detail-toggle"><span>See statistics + chart</span></summary>
        <div class="assessment-detail-content">
          <p class="assessment-band-kicker mt-4">${definition.category}</p>
          <div class="assessment-band-chart mt-3 h-40">
            <canvas id="assessmentBandChart-${definition.key}"></canvas>
          </div>
          <p class="assessment-band-copy mt-3">${definition.definition}</p>
          <div class="assessment-band-footer mt-3">
            <span>${assessmentDefinitionRangeLabel(definition, range)}</span>
          </div>
        </div>
      </details>
    </article>
    `;
  }).join("");

  renderAssessmentBandCharts(selectedClass, iaaoStandards);
}

function assessmentClassSummary(selectedClass) {
  if (selectedClass.summary) return selectedClass.summary;

  const records = getAssessmentDisplayRecords(selectedClass);
  const latest = records.at(-1) ?? {};
  const baseline = records.find(row => row.year === 2025) ?? records.at(-2) ?? {};
  const prdDistance = row => row.prdDistance ?? (row.prd !== null && row.prd !== undefined ? row.prd - 1 : null);

  return {
    latestYear: latest.year,
    latestSales: latest.sales,
    latestLevelOfValue: latest.levelOfValue,
    latestCod: latest.cod,
    latestPrd: latest.prd,
    latestCov: latest.cov,
    codChangeSince2025: numberDifference(latest.cod, baseline.cod),
    prdDistanceChangeSince2025: numberDifference(prdDistance(latest), prdDistance(baseline)),
    covChangeSince2025: numberDifference(latest.cov, baseline.cov)
  };
}

function numberDifference(current, previous) {
  if (current === null || current === undefined || previous === null || previous === undefined) return null;

  return current - previous;
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
      <td class="px-3 py-2 text-right">${row.levelOfValue.toFixed(2)}<span class="equalization-mobile-optional">%</span></td>
    </tr>
  `).join("");
}

function renderAssessmentBandCharts(selectedClass, iaaoStandards) {
  const records = getAssessmentDisplayRecords(selectedClass);
  const labels = records.map(row => row.year);
  const bandConfig = getAssessmentBandConfig(selectedClass, iaaoStandards);

  assessmentBandCharts.forEach(chart => chart.destroy());
  assessmentBandCharts = [];

  assessmentBandDefinitions.forEach(definition => {
    const canvas = document.getElementById(`assessmentBandChart-${definition.key}`);
    const range = bandConfig[definition.key];
    if (!canvas || !range) return;

    const data = records.map(row => bandPosition(row[definition.key], range));
    const chartValues = data.filter(value => value !== null && value !== undefined);
    const minValue = Math.min(0, ...chartValues);
    const maxValue = Math.max(1, ...chartValues);

    assessmentBandCharts.push(new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: definition.shortLabel,
          measureKey: definition.key,
          digits: definition.digits,
          valueSuffix: definition.valueSuffix,
          approximateBand: Boolean(definition.approximateBand),
          data,
          tension: 0.25,
          borderWidth: 2.5,
          borderColor: definition.color,
          borderDash: definition.borderDash,
          backgroundColor: definition.fill,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: definition.color,
          pointBorderColor: definition.color,
          pointStyle: definition.pointStyle,
          spanGaps: true
        }]
      },
      plugins: [assessmentStandardBandPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: items => items[0]?.label ?? "",
              label: context => {
                const rawValue = records[context.dataIndex]?.[context.dataset.measureKey];
                const value = formatMeasureValue(context.dataset.measureKey, rawValue, context.dataset.digits, context.dataset.valueSuffix);
                return `${definition.shortLabel}: ${value} (${bandStatus(context.parsed.y, context.dataset.approximateBand)})`;
              }
            }
          },
          assessmentStandardBand: {
            min: 0,
            max: 1,
            backgroundColor: colorAlpha(definition.color, 0.08),
            borderColor: colorAlpha(definition.color, 0.32)
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 4
            }
          },
          y: {
            suggestedMin: Math.min(-0.25, Math.floor(minValue - 0.25)),
            suggestedMax: Math.max(1.5, Math.ceil(maxValue + 0.25)),
            ticks: {
              maxTicksLimit: 4,
              callback: value => {
                if (Number(value) === 0) return "Lower";
                if (Number(value) === 1) return "Upper";
                return Number(value).toFixed(1);
              }
            }
          }
        }
      }
    }));
  });

  document.querySelectorAll(".assessment-detail-drawer").forEach(drawer => {
    drawer.addEventListener("toggle", () => {
      if (!drawer.open) return;

      const canvas = drawer.querySelector("canvas");
      window.requestAnimationFrame(() => Chart.getChart(canvas)?.resize());
    });
  });
}

function renderAssessmentConvergenceNote(records, datasets) {
  const note = document.getElementById("assessmentAccuracyConvergenceNote");
  if (!note) return;

  const spreads = records.map((row, index) => {
    const values = datasets
      .map(dataset => dataset.data[index])
      .filter(value => Number.isFinite(value));

    if (values.length < 2) return null;

    return {
      year: row.year,
      spread: Math.max(...values) - Math.min(...values)
    };
  }).filter(Boolean);

  const latest = spreads.at(-1);
  if (!latest) {
    note.textContent = "COD, PRD, COV, and level of value use different scales. This view puts each measure into its own band so the trends can be compared together.";
    return;
  }

  note.textContent = `${latest.year}: COD, PRD, COV, and level of value are ${latest.spread.toFixed(2)} band-widths apart. Closer spacing is easier to compare. Wider spacing needs more attention, especially when the sales sample is small.`;
}

function renderAssessmentAccuracyChart(selectedClass, iaaoStandards) {
  const canvas = document.getElementById("assessmentAccuracyChart");
  if (!canvas) return;

  const isMobileChart = isMobileChartViewport();
  const records = getAssessmentDisplayRecords(selectedClass);
  const labels = records.map(row => row.year);
  const bandConfig = getAssessmentBandConfig(selectedClass, iaaoStandards);
  const datasets = assessmentBandDefinitions.map(definition => ({
    label: definition.label,
    measureKey: definition.key,
    digits: definition.digits,
    range: bandConfig[definition.key],
    approximateBand: Boolean(definition.approximateBand),
    data: records.map(row => bandPosition(row[definition.key], bandConfig[definition.key])),
    tension: 0.25,
    borderWidth: 3,
    borderDash: definition.borderDash,
    borderColor: definition.color,
    backgroundColor: definition.fill,
    pointRadius: 4,
    pointHoverRadius: 6,
    pointBackgroundColor: definition.color,
    pointBorderColor: definition.color,
    pointStyle: definition.pointStyle,
    endLabel: definition.shortLabel,
    spanGaps: true
  }));
  const chartValues = datasets.flatMap(dataset => dataset.data.filter(value => value !== null && value !== undefined));
  const minValue = Math.min(0, ...chartValues);
  const maxValue = Math.max(1, ...chartValues);
  const hasApproximateBand = assessmentBandDefinitions.some(definition =>
    definition.approximateBand && bandConfig[definition.key]
  );
  const hasLineLegend = renderLineLegend("assessmentAccuracyLegend", datasets);

  renderAssessmentConvergenceNote(records, datasets);

  assessmentAccuracyChart?.destroy();
  assessmentAccuracyChart = new Chart(canvas, {
    type: "line",
    data: { labels, datasets },
    plugins: [assessmentStandardBandPlugin, assessmentEndLabelPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      layout: {
        padding: {
          right: isMobileChart ? 8 : 48
        }
      },
      plugins: {
        legend: {
          display: !hasLineLegend,
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8
          }
        },
        tooltip: {
          callbacks: {
            label: context => {
              const rawValue = records[context.dataIndex]?.[context.dataset.measureKey];
              const value = formatMeasureValue(context.dataset.measureKey, rawValue, context.dataset.digits);
              return `${context.dataset.label}: ${value} (${bandStatus(context.parsed.y, context.dataset.approximateBand)})`;
            },
            footer: () => hasApproximateBand
              ? "Shaded area = standard band; COV band is approximate context"
              : "Shaded area = standard band"
          }
        },
        assessmentStandardBand: {
          min: 0,
          max: 1
        },
        assessmentEndLabels: {
          enabled: true,
          offsetX: 9,
          maxRightInset: 40
        }
      },
      scales: {
        y: {
          title: { display: !isMobileChart, text: "Position within selected band" },
          suggestedMin: Math.min(-0.25, Math.floor(minValue - 0.25)),
          suggestedMax: Math.max(1.5, Math.ceil(maxValue + 0.25)),
          ticks: {
            callback: value => {
              if (!isMobileChart && Number(value) === 0) return "Lower edge";
              if (!isMobileChart && Number(value) === 1) return "Upper edge";
              return Number(value).toFixed(1);
            }
          }
        }
      }
    }
  });
}

function renderEqualizationSalePriceRows(
  padRatioData,
  classKey = "residential",
  marketPositionData = null,
  valuationGroups = null,
  selectedGroupId = null
) {
  const table = document.getElementById("equalizationSalePriceRows");
  if (!table) return;

  const study = priceBandStudyForClass(padRatioData, classKey, marketPositionData, valuationGroups);
  if (!study) return;
  const rows = study.rows || [];
  const totalRow = study.totalRow;
  const title = document.getElementById("equalizationSalePriceTitle");
  const description = document.getElementById("equalizationSalePriceDescription");
  const chartTitle = document.getElementById("equalizationSalePriceChartTitle");
  const chartNote = document.getElementById("equalizationSalePriceChartNote");
  const rangeHeader = document.getElementById("equalizationSalePriceRangeHeader");
  const source = document.getElementById("equalizationSalePriceSource");
  const propertyClassLabel = propertyClassLabelForStudy(study.key ?? classKey, study);
  const duplicateLabels = duplicateBandLabels(rows);
  const nonAdditiveNote = study.key === "agFarm"
    ? " Rows are stratified views and should not be summed."
    : "";

  if (title) title.textContent = `What makes up the ${propertyClassLabel} sales data?`;
  if (description) description.textContent = study.description || "";
  if (chartTitle) chartTitle.textContent = study.chartTitle || "Sales distribution";
  if (chartNote) chartNote.textContent = `${study.chartNote || "Qualified sales by band."}${nonAdditiveNote}`;
  if (rangeHeader) {
    rangeHeader.querySelector(".sales-range-label-full").textContent = study.rangeHeader || "Sale price range";
  }
  if (source) {
    source.textContent = study.sourceText
      ?? (padRatioData ? `${getPadRoSourceAnchor(padRatioData)}${getPadRoRefreshWatch(padRatioData)}` : "");
  }

  const dataRows = rows.map(row => {
    const isSelected = selectedGroupId !== null && selectedGroupId !== undefined
      && String(row.id ?? row.group ?? row.range) === String(selectedGroupId);
    return `
    <tr${isSelected ? ` class="market-sales-current-row" data-current-market-row="true"` : ""}>
      <td class="equalization-sales-label-cell px-2 py-2 font-medium text-slate-700" title="${priceBandDisplayLabel(row, duplicateLabels)}">
        <span class="sales-range-label-full equalization-sales-label-text">${priceBandDisplayLabel(row, duplicateLabels)}</span>
        <span class="sales-range-label-compact equalization-sales-label-text">${compactPriceBandDisplayLabel(row, duplicateLabels)}</span>
      </td>
      <td class="px-2 py-2 text-right">${formatCountValue(row.count)}</td>
      <td class="px-2 py-2 text-right">${row.count ? formatRatio(row.median) : "—"}</td>
      <td class="px-2 py-2 text-right">${row.count ? formatRatio(row.cod) : "—"}</td>
      <td class="px-2 py-2 text-right">${row.count ? formatRatio(row.prd) : "—"}</td>
      <td class="px-2 py-2 text-right">${row.count ? formatMoneyValue(row.averageAdjustedSalePrice) : "—"}</td>
    </tr>
  `;
  }).join("");
  const footerRow = totalRow ? `
    <tr class="table-total-row font-semibold">
      <td class="px-2 py-2">Countywide total</td>
      <td class="px-2 py-2 text-right">${formatCountValue(totalRow.count)}</td>
      <td class="px-2 py-2 text-right">${formatRatio(totalRow.median)}</td>
      <td class="px-2 py-2 text-right">${formatRatio(totalRow.cod)}</td>
      <td class="px-2 py-2 text-right">${formatRatio(totalRow.prd)}</td>
      <td class="px-2 py-2 text-right">${formatMoneyValue(totalRow.averageAdjustedSalePrice)}</td>
    </tr>
  ` : "";

  table.innerHTML = dataRows + footerRow;
  scrollCurrentMarketSalesRow(table);
  renderEqualizationSalePriceChart(rows, study, duplicateLabels, selectedGroupId);
}

function scrollCurrentMarketSalesRow(table) {
  const row = table.querySelector("[data-current-market-row]");
  const scrollParent = table.closest(".equalization-sales-table-scroll");
  if (!row || !scrollParent) return;

  window.requestAnimationFrame(() => {
    const nextTop = row.offsetTop - (scrollParent.clientHeight / 2) + (row.offsetHeight / 2);
    scrollParent.scrollTop = Math.max(0, nextTop);
  });
}

function renderEqualizationSalePriceChart(rows, study = {}, duplicateLabels = new Set(), selectedGroupId = null) {
  const canvas = document.getElementById("equalizationSalePriceChart");
  if (!canvas) return;

  const selectedColor = visualizationTheme.roles.equalization;
  const selectedFill = colorAlpha(selectedColor, 0.26);
  const isSelectedRow = row => selectedGroupId !== null && selectedGroupId !== undefined
    && String(row.id ?? row.group ?? row.range) === String(selectedGroupId);
  const datasets = [
    {
      type: "bar",
      label: study.countLabel || "Sales",
      data: rows.map(row => row.count),
      backgroundColor: rows.map(row => isSelectedRow(row) ? selectedFill : semanticChartColors.equalizationBg),
      borderColor: rows.map(row => isSelectedRow(row) ? selectedColor : chartColors.equalization),
      borderWidth: rows.map(row => isSelectedRow(row) ? 3 : 2),
      borderRadius: 6,
      order: 2
    },
    {
      type: "line",
      label: study.lineLabel || "Distribution curve",
      data: rows.map(row => row.count),
      tension: 0.38,
      borderWidth: 3,
      borderColor: semanticChartColors.comparison,
      backgroundColor: semanticChartColors.comparisonBg,
      pointBackgroundColor: rows.map(row => isSelectedRow(row) ? selectedColor : semanticChartColors.comparison),
      pointBorderColor: rows.map(row => isSelectedRow(row) ? selectedColor : semanticChartColors.comparison),
      pointRadius: rows.map(row => isSelectedRow(row) ? 5 : 3),
      fill: true,
      order: 1
    }
  ];
  const legendDatasets = [
    {
      label: study.countLabel || "Sales",
      borderColor: chartColors.equalization
    },
    {
      label: study.lineLabel || "Distribution curve",
      borderColor: semanticChartColors.comparison
    },
    ...(selectedGroupId === null || selectedGroupId === undefined ? [] : [{
      label: "Current view",
      borderColor: selectedColor,
      backgroundColor: selectedFill
    }])
  ];
  const hasCustomLegend = renderCustomLegend("equalizationSalePriceChartLegend", legendDatasets);

  equalizationSalePriceChart?.destroy();
  equalizationSalePriceChart = new Chart(canvas, {
    data: {
      labels: rows.map(row => row.chartLabel || shortPriceBandLabel(priceBandDisplayLabel(row, duplicateLabels))),
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
            color: context => isSelectedRow(rows[context.index]) ? selectedColor : undefined,
            font: context => ({
              weight: isSelectedRow(rows[context.index]) ? 800 : 500
            }),
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          beginAtZero: true,
          title: mobileAxisTitle(study.yAxisTitle || "Qualified sales"),
          ticks: { precision: 0 }
        }
      }
    }
  });
}

function renderAssessmentClass(
  selectedClass,
  iaaoStandards,
  padRatioData = null,
  marketPositionData = null,
  valuationGroups = null
) {
  const contextPill = document.getElementById("assessmentClassContextPill");
  if (contextPill) {
    contextPill.textContent = assessmentClassContextLabel(selectedClass);
  }

  renderAssessmentSummary(selectedClass, iaaoStandards);
  renderAssessmentRows(selectedClass);
  renderAssessmentAccuracyChart(selectedClass, iaaoStandards);
  window.dispatchEvent(new CustomEvent("assessment-class-change", {
    detail: { key: selectedClass.key, label: selectedClass.label }
  }));
}

function assessmentClassContextLabel(selectedClass) {
  if (selectedClass?.key === "agFarm") return "Ag/Farm";
  if (selectedClass?.key === "commercial") return "Commercial";
  return "Residential";
}

export function initAssessmentRatioAnalysis(
  data,
  ratioData,
  iaaoStandards,
  padRatioData = null,
  marketPositionData = null,
  valuationGroups = null
) {
  const filter = document.getElementById("assessmentClassFilter");
  if (!filter) return;

  const defaultKey = getDefaultAssessmentClass(data, ratioData);

  filter.innerHTML = ratioData.classes.map(item => `
    <button
      type="button"
      data-assessment-class="${item.key}"
      class="rounded-lg px-3 py-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      aria-pressed="${item.key === defaultKey}"
    >
      <span class="assessment-class-label-full">${escapeHtml(item.label)}</span>
      <span class="assessment-class-label-short" aria-hidden="true">${escapeHtml(item.key === "commercial" ? "Comm." : item.label)}</span>
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
    renderAssessmentClass(selectedClass, iaaoStandards, padRatioData, marketPositionData, valuationGroups);
  };

  buttons.forEach(button => {
    button.addEventListener("click", () => update(button.dataset.assessmentClass));
  });

  update(defaultKey);
}

function indexedSeries(rows, valueFactor = 1, taxFactor = 1) {
  const orderedRows = sortHistoryAscending(rows || []);
  const usableValueRows = orderedRows.filter(row => hasDataValue(row.assessedValue));
  const usableTaxRows = orderedRows.filter(row => hasDataValue(row.taxes));
  const baseValue = usableValueRows[0]?.assessedValue;
  const baseTaxes = usableTaxRows[0]?.taxes;

  return {
    years: orderedRows.map(row => row.year),
    valueIndex: orderedRows.map(row => hasDataValue(row.assessedValue) && baseValue ? (row.assessedValue / baseValue) * 100 * valueFactor : null),
    taxIndex: orderedRows.map(row => hasDataValue(row.taxes) && baseTaxes ? (row.taxes / baseTaxes) * 100 * taxFactor : null)
  };
}

function rowsByYear(rows) {
  return new Map(rows.map(row => [row.year, row]));
}

function propertyIndexedDatasets(propertyRows, years, palette = {}) {
  const propertyByYear = rowsByYear(propertyRows);
  const alignedRows = years.map(year => propertyByYear.get(year) ?? { year, assessedValue: null, taxes: null });
  const series = indexedSeries(alignedRows);
  const valueColor = colorAlpha(palette.propertyValueColor ?? palette.valueColor ?? chartColors.contextValue, 0.4);
  const valueBg = palette.propertyValueBg ?? semanticChartColors.valueBg;
  const taxColor = colorAlpha(palette.propertyTaxColor ?? palette.taxColor ?? chartColors.contextTax, 0.4);
  const taxBg = palette.propertyTaxBg ?? semanticChartColors.taxBg;

  return [
    {
      label: "This property value",
      tooltipValues: formattedTooltipValues(alignedRows, "assessedValue", wholeMoney),
      data: series.valueIndex,
      tension: 0.25,
      borderWidth: 2,
      borderColor: valueColor,
      backgroundColor: valueBg,
      pointRadius: 3,
      pointStyle: "circle",
      pointBackgroundColor: valueColor,
      pointBorderColor: valueColor,
      spanGaps: true
    },
    {
      label: "This property tax bill",
      tooltipValues: formattedTooltipValues(alignedRows, "taxes", moneyCents),
      data: series.taxIndex,
      tension: 0.25,
      borderWidth: 2,
      borderColor: taxColor,
      backgroundColor: taxBg,
      pointRadius: 3,
      pointStyle: "circle",
      pointBackgroundColor: taxColor,
      pointBorderColor: taxColor,
      spanGaps: true
    }
  ];
}

function propertyRateDataset(propertyRows, years, palette = {}) {
  const propertyByYear = rowsByYear(propertyRows);
  const rateColor = colorAlpha(palette.propertyRateColor ?? palette.rateColor ?? chartColors.contextRate, 0.4);
  const rateBg = palette.propertyRateBg ?? semanticChartColors.etrBg;

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
    pointRadius: 3,
    pointBackgroundColor: rateColor,
    pointBorderColor: rateColor,
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

function lineStyleForDash(borderDash = []) {
  if (!borderDash.length) return "solid";
  return borderDash[0] <= 2 ? "dotted" : "dashed";
}

function renderLineLegend(elementId, datasets) {
  const legend = document.getElementById(elementId);
  if (!legend) return false;

  legend.innerHTML = datasets.map(dataset => `
    <div class="assessment-line-legend-item">
      <span
        class="assessment-line-legend-swatch"
        style="border-top-color: ${dataset.borderColor}; border-top-style: ${lineStyleForDash(dataset.borderDash)};"
      ></span>
      <span>${dataset.endLabel ?? dataset.label}</span>
    </div>
  `).join("");
  return true;
}

function renderMarketComparisonLegend(elementId, selectedLabel = "Selected market area", countyLabel = "Countywide") {
  const legend = document.getElementById(elementId);
  if (!legend) return false;

  const items = [
    {
      label: selectedLabel,
      borderColor: visualizationTheme.roles.equalization,
      backgroundColor: colorAlpha(visualizationTheme.roles.equalization, 0.22)
    },
    {
      label: countyLabel,
      borderColor: visualizationTheme.roles.comparison,
      backgroundColor: colorAlpha(visualizationTheme.roles.comparison, 0.16)
    }
  ];

  legend.innerHTML = items.map(item => `
    <div class="flex items-center gap-2">
      <span
        class="chart-legend-dot inline-block border-2"
        style="border-color: ${item.borderColor}; background-color: ${item.backgroundColor};"
      ></span>
      <span>${item.label}</span>
    </div>
  `).join("");
  return true;
}

function formatRatio(value, digits = 2) {
  if (value === null || value === undefined) return "—";
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : "—";
}

function priceBandStudyKeyForClass(classKey = "residential") {
  const normalized = normalizeMarketClassKey(classKey);
  if (normalized === "agricultural") return "agFarm";
  if (normalized === "commercial") return "commercial";
  return "residential";
}

function normalizedPrdRange(range) {
  if (!range) return null;

  const min = Number(range.min);
  const max = Number(range.max);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;

  return max <= 2 ? { min: min * 100, max: max * 100 } : { min, max };
}

function valuationGroupLookup(valuationGroups, propertyClass = "residential") {
  const classKey = normalizeMarketClassKey(propertyClass);

  return new Map((valuationGroups?.valuationGroups || [])
    .filter(item => normalizeMarketClassKey(item.class) === classKey)
    .map(item => [String(item.valuationGroup), item]));
}

function enrichedMarketGroups(groups, valuationGroups, propertyClass = "residential") {
  const lookup = valuationGroupLookup(valuationGroups, propertyClass);
  const classKey = normalizeMarketClassKey(propertyClass);
  const isAgricultural = classKey === "agricultural";

  return groups.map(group => {
    const id = String(group.id ?? group.group);
    const listing = lookup.get(id);
    const description = listing?.description || group.description || "";
    const marketGroup = listing?.marketGroup || null;
    const descriptiveLabel = isAgricultural
      ? group.label
      : description
        ? `Valuation Group ${id} - ${description}`
        : group.label;
    const areaFirstLabel = isAgricultural
      ? group.label
      : description
        ? `${description} · VG ${id}`
        : group.label;
    const optionLabel = isAgricultural
      ? group.label
      : description && marketGroup
        ? `${description} · ${marketGroup}`
        : description || `Local group ${id}`;

    return {
      ...group,
      id,
      group: id,
      description,
      marketGroup,
      label: areaFirstLabel,
      descriptiveLabel,
      optionLabel,
      shortLabel: isAgricultural ? group.label : description ? `VG ${id} - ${description}` : group.label
    };
  });
}

function marketSignalDefinitions(selected, summary, classStats, standards) {
  const medianRange = getMedianRatioRange(classStats, standards);
  const codRange = getCodInterpretationRange(classStats, standards);
  const prdRange = normalizedPrdRange(standards?.prdStandards?.acceptableRange);

  return [
    {
      metricKey: "qualifiedSales",
      label: "Qualified sales",
      shortLabel: "Sales",
      category: "Evidence depth",
      rawValue: selected.count,
      comparisonValue: summary.count ?? summary.numberOfSales,
      value: integer.format(selected.count),
      note: `${integer.format(summary.count ?? summary.numberOfSales)} countywide`,
      color: visualizationTheme.roles.equalization,
      range: null,
      formatter: value => integer.format(value),
      definition: "Qualified sales tell you how much evidence is behind this local group before reading the ratio measures."
    },
    {
      metricKey: "medianRatio",
      label: "Median ratio",
      shortLabel: "Median",
      category: "Level",
      rawValue: selected.median,
      comparisonValue: summary.median,
      value: formatRatio(selected.median),
      note: `County: ${formatRatio(summary.median)}`,
      color: chartColors.levelOfValue,
      range: medianRange,
      formatter: value => formatRatio(value),
      definition: "Median ratio shows the middle assessment-to-sale ratio for the group, which is the local level signal before countywide equalization."
    },
    {
      metricKey: "cod",
      label: "COD",
      shortLabel: "COD",
      category: "Uniformity",
      rawValue: selected.cod,
      comparisonValue: summary.cod,
      value: formatRatio(selected.cod),
      note: `County: ${formatRatio(summary.cod)}`,
      color: chartColors.cod,
      range: codRange,
      formatter: value => formatRatio(value),
      definition: "COD shows how tightly this local group's sales ratios cluster around the median ratio, with very low readings still requiring sample context."
    },
    {
      metricKey: "prd",
      label: "PRD",
      shortLabel: "PRD",
      category: "Price-related balance",
      rawValue: selected.prd,
      comparisonValue: summary.prd,
      value: formatRatio(selected.prd),
      note: `County: ${formatRatio(summary.prd)}`,
      color: chartColors.prd,
      range: prdRange,
      formatter: value => formatRatio(value),
      definition: "PRD shows whether lower- and higher-priced properties in the group are being treated evenly."
    }
  ];
}

function renderMarketSignalChart(definition) {
  const canvas = document.getElementById(`marketSignalChart-${definition.metricKey}`);
  if (!canvas) return;

  const values = [definition.rawValue, definition.comparisonValue].map(Number);
  const finiteValues = values.filter(Number.isFinite);
  const rangeValues = definition.range ? [definition.range.min, definition.range.max].map(Number) : [];
  const yValues = [...finiteValues, ...rangeValues].filter(Number.isFinite);
  const maxRaw = Math.max(...yValues, 1);
  const minRaw = Math.min(...yValues, definition.metricKey === "qualifiedSales" ? 0 : maxRaw);
  const padding = definition.metricKey === "qualifiedSales"
    ? Math.max(5, maxRaw * 0.12)
    : Math.max(1, (maxRaw - minRaw) * 0.22);
  const suggestedMin = definition.metricKey === "qualifiedSales"
    ? 0
    : Math.max(0, Math.floor(minRaw - padding));
  const suggestedMax = Math.ceil(maxRaw + padding);
  const selectedColor = definition.color;
  const countyColor = visualizationTheme.roles.comparison;

  marketSignalCharts.push(new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["Selected", "Countywide"],
      datasets: [{
        label: definition.label,
        data: values,
        backgroundColor: [
          colorAlpha(selectedColor, 0.24),
          colorAlpha(countyColor, 0.16)
        ],
        borderColor: [
          selectedColor,
          countyColor
        ],
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    plugins: definition.range ? [assessmentStandardBandPlugin] : [],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => `${context.label}: ${definition.formatter(context.parsed.y)}`
          }
        },
        assessmentStandardBand: definition.range ? {
          min: definition.range.min,
          max: definition.range.max,
          backgroundColor: colorAlpha(selectedColor, 0.08),
          borderColor: colorAlpha(selectedColor, 0.30)
        } : false
      },
      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          beginAtZero: definition.metricKey === "qualifiedSales",
          suggestedMin,
          suggestedMax,
          ticks: {
            precision: definition.metricKey === "qualifiedSales" ? 0 : undefined,
            callback: value => definition.metricKey === "qualifiedSales"
              ? integer.format(Number(value))
              : formatRatio(Number(value), 0)
          }
        }
      }
    }
  }));
}

function renderMarketSignalCharts(definitions) {
  marketSignalCharts.forEach(chart => chart.destroy());
  marketSignalCharts = [];
  definitions.forEach(renderMarketSignalChart);

  document.querySelectorAll("#marketSignalCards .assessment-detail-drawer").forEach(drawer => {
    drawer.addEventListener("toggle", () => {
      if (!drawer.open) return;

      const canvas = drawer.querySelector("canvas");
      window.requestAnimationFrame(() => Chart.getChart(canvas)?.resize());
    });
  });
}

function renderMarketSignalCards(selected, summary, standards, context = {}) {
  const container = document.getElementById("marketSignalCards");
  if (!container) return;

  const signalContext = {
    ...context,
    valuationGroup: selected.descriptiveLabel ?? selected.label,
    marketAreaType: selected.marketGroup
  };
  const cards = marketSignalDefinitions(selected, summary, context.classStats, standards);
  const detailOpen = window.matchMedia("(min-width: 768px)").matches;

  container.innerHTML = cards.map(card => {
    const signal = getMetricSignal({
      metricKey: card.metricKey,
      value: card.rawValue,
      comparisonValue: card.comparisonValue,
      standards,
      context: signalContext
    });
    const ariaLabel = [
      `${card.label}: ${card.value}.`,
      signal.label,
      signal.explanation
    ].join(" ");
    const rangeLabel = assessmentDefinitionRangeLabel({
      key: card.metricKey === "medianRatio" ? "levelOfValue" : card.metricKey,
      approximateBand: false
    }, card.range);

    return `
    <article
      class="metric-signal-card metric-signal-card-neutral market-signal-card rounded-xl p-4"
      role="group"
      aria-label="${escapeHtml(ariaLabel)}"
      style="--measure-color: ${card.color}; --measure-border: ${colorAlpha(card.color, 0.26)};"
    >
      <div class="assessment-metric-topline">
        <div class="min-w-0">
          <p class="assessment-metric-heading text-xs font-semibold uppercase tracking-wide">
            <span>${escapeHtml(card.label)}</span>
            <span class="assessment-metric-help">
              <button type="button" class="assessment-help-button" aria-label="${escapeHtml(card.label)} explanation">?</button>
              <span class="assessment-help-tooltip" role="tooltip">${escapeHtml(card.definition)}</span>
            </span>
          </p>
          <p class="mt-1 text-lg font-bold text-slate-700">${escapeHtml(card.value)}</p>
          <p class="mt-1 text-xs leading-5 text-slate-500">${escapeHtml(card.note)}</p>
          <p class="metric-signal-text mt-2">${escapeHtml(signal.label)}</p>
        </div>
      </div>
      <details class="assessment-detail-drawer" ${detailOpen ? "open" : ""}>
        <summary class="assessment-detail-toggle"><span>See statistics + chart</span></summary>
        <div class="assessment-detail-content">
          <p class="assessment-band-kicker mt-4">${escapeHtml(card.category)}</p>
          <div class="assessment-band-chart mt-3 h-40">
            <canvas id="marketSignalChart-${card.metricKey}"></canvas>
          </div>
          <p class="assessment-band-copy mt-3">${escapeHtml(card.definition)}</p>
          <div class="assessment-band-footer mt-3">
            <span>${escapeHtml(card.range ? rangeLabel : "Benchmark: selected market area vs. countywide")}</span>
          </div>
        </div>
      </details>
    </article>
  `;
  }).join("");

  renderMarketSignalCharts(cards);
}

function renderMarketGroupSalesDistribution(selected, classStats) {
  const container = document.getElementById("marketGroupSalesDistribution");
  if (!container || !classStats?.groups?.length) return;

  const isDesktop = window.matchMedia("(min-width: 768px)").matches;
  const groupKind = classStats.classKey === "agricultural" ? "market area" : "valuation group";
  const groupKindPlural = classStats.classKey === "agricultural" ? "market areas" : "valuation groups";
  const rows = [...classStats.groups]
    .filter(group => Number.isFinite(Number(group.count)))
    .sort((a, b) => Number(b.count) - Number(a.count));
  const total = Number(classStats.countywide?.count) || rows.reduce((sum, row) => sum + Number(row.count || 0), 0);
  const selectedId = String(selected?.id ?? selected?.group ?? "");
  const selectedRow = rows.find(row => String(row.id ?? row.group) === selectedId);
  const selectedLabel = selectedRow?.shortLabel ?? selectedRow?.descriptiveLabel ?? selectedRow?.label ?? selected?.label ?? "Selected group";
  const selectedShare = total ? Number(selectedRow?.count || 0) / total : 0;
  const chartHeight = Math.max(260, rows.length * 28 + 72);
  const sourceText = getMarketPositionSourceAnchor(classStats);

  marketGroupSalesChart?.destroy();

  container.innerHTML = `
    <details class="mobile-support-disclosure market-group-sales-disclosure" ${isDesktop ? "open" : ""}>
      <summary class="mobile-support-toggle">
        <span>See sales by ${escapeHtml(groupKind)}</span>
        <span class="mobile-support-chevron" aria-hidden="true"></span>
      </summary>
      <section class="mobile-support-content market-group-sales-panel" aria-labelledby="marketGroupSalesTitle">
        <div class="market-group-sales-heading">
          <div>
            <p class="guided-kicker">Evidence depth</p>
            <h3 id="marketGroupSalesTitle">Sales by ${escapeHtml(groupKind)}</h3>
            <p>Recent qualified sales are not spread evenly across local comparison groups. This shows how many class-study sales came from each ${escapeHtml(groupKind)}.</p>
          </div>
          <div class="market-group-sales-callout">
            <span>${escapeHtml(selectedLabel)}</span>
            <strong>${escapeHtml(integer.format(Number(selectedRow?.count || 0)))}</strong>
            <span>${escapeHtml(formatPercentShare(selectedShare))} of class sales</span>
          </div>
        </div>
        <div class="market-group-sales-chart" style="height: ${chartHeight}px">
          <canvas id="marketGroupSalesChart"></canvas>
        </div>
        <p class="chart-source">${escapeHtml(sourceText)}</p>
      </section>
    </details>
  `;

  const canvas = document.getElementById("marketGroupSalesChart");
  if (!canvas) return;

  const selectedColor = visualizationTheme.roles.equalization;
  const selectedBorderColor = chartColors.equalization;
  const otherColor = colorAlpha(visualizationTheme.roles.comparison, 0.16);
  const otherBorderColor = colorAlpha(visualizationTheme.roles.comparison, 0.72);

  marketGroupSalesChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: rows.map(row => marketGroupSalesAxisLabel(row, classStats.classKey)),
      datasets: [{
        label: "Qualified sales",
        data: rows.map(row => Number(row.count || 0)),
        backgroundColor: rows.map(row =>
          String(row.id ?? row.group) === selectedId ? colorAlpha(selectedColor, 0.26) : otherColor
        ),
        borderColor: rows.map(row =>
          String(row.id ?? row.group) === selectedId ? selectedBorderColor : otherBorderColor
        ),
        borderWidth: rows.map(row => String(row.id ?? row.group) === selectedId ? 2 : 1),
        borderRadius: 5,
        barPercentage: 0.78,
        categoryPercentage: 0.82
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "nearest", intersect: true },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: context => rows[context[0].dataIndex]?.descriptiveLabel
              ?? rows[context[0].dataIndex]?.label
              ?? "",
            label: context => {
              const row = rows[context.dataIndex];
              const count = Number(row?.count || 0);
              const share = total ? count / total : 0;
              return `${integer.format(count)} qualified sales (${formatPercentShare(share)})`;
            },
            afterLabel: context => {
              const row = rows[context.dataIndex];
              return [
                `Median: ${formatRatio(row?.median)}`,
                `COD: ${formatRatio(row?.cod)}`,
                `PRD: ${formatRatio(row?.prd)}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: colorAlpha(visualizationTheme.neutrals.border, 0.72) },
          title: {
            display: true,
            text: "Qualified sales"
          },
          ticks: {
            precision: 0,
            callback: value => integer.format(Number(value))
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            autoSkip: false
          }
        }
      }
    }
  });

  const disclosure = container.querySelector(".market-group-sales-disclosure");
  disclosure?.addEventListener("toggle", () => {
    if (!disclosure.open) return;
    window.requestAnimationFrame(() => marketGroupSalesChart?.resize());
  });
}

function marketGroupSalesAxisLabel(row, classKey = "residential") {
  if (classKey === "agricultural") {
    return row.label ?? row.shortLabel ?? `Area ${row.id ?? row.group}`;
  }

  return `VG ${row.id ?? row.group}`;
}

function formatPercentShare(value) {
  return Number.isFinite(value)
    ? `${(value * 100).toFixed(value >= 0.1 ? 0 : 1)}%`
    : "0%";
}

function renderMarketNarrative(selected, summary, classStats, medianRange, standards, isParcelGroup = true) {
  const narrative = document.getElementById("marketNarrative");
  if (!narrative) return;
  const groupKind = classStats?.classKey === "agricultural" ? "Market area" : "Valuation group";
  const groupText = selected?.label ?? "Selected group";
  const groupLabel = isParcelGroup ? `${groupKind}` : "Selected view";
  const rows = [
    [groupLabel, groupText, summary?.label ?? "Countywide"],
    ["Qualified sales", integer.format(Number(selected?.count ?? 0)), integer.format(Number(summary?.count ?? 0))],
    ["Median ratio", formatRatio(selected?.median), formatRatio(summary?.median)],
    ["COD", formatRatio(selected?.cod), formatRatio(summary?.cod)],
    ["PRD", formatRatio(selected?.prd), formatRatio(summary?.prd)]
  ];

  narrative.innerHTML = `
    <table class="market-compare-table">
      <thead>
        <tr>
          <th scope="col">Measure</th>
          <th scope="col">Selected</th>
          <th scope="col">Countywide</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(([label, selectedValue, countyValue]) => `
          <tr>
            <th scope="row">${escapeHtml(label)}</th>
            <td>${escapeHtml(selectedValue)}</td>
            <td>${escapeHtml(countyValue)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function countywideTotalForClass(marketPositionData, classKey = "residential") {
  const normalized = normalizeMarketClassKey(classKey);
  const countywide = marketPositionData?.classes?.[normalized]?.countywide;
  if (!countywide) return null;

  return {
    count: countywide.count,
    median: countywide.median,
    mean: countywide.mean,
    weightedMean: countywide.weightedMean,
    cod: countywide.cod,
    prd: countywide.prd,
    averageAdjustedSalePrice: countywide.averageAdjustedSalePrice,
    averageAssessedValue: countywide.averageAssessedValue
  };
}

function localGroupStudyForClass(marketPositionData, classKey = "residential", valuationGroups = null) {
  const classStats = getClassMarketStats(marketPositionData, classKey);
  if (!classStats?.groups?.length) return null;

  const normalizedClassKey = classStats.classKey;
  const isAgricultural = normalizedClassKey === "agricultural";
  const groups = enrichedMarketGroups(classStats.groups, valuationGroups, normalizedClassKey);
  const groupKind = isAgricultural ? "market area" : "valuation group";
  const groupKindPlural = isAgricultural ? "market areas" : "valuation groups";
  const classLabel = propertyClassLabelForStudy(normalizedClassKey);
  const className = classLabel.replace(/\s+real property/i, "").toLowerCase();
  const rangeHeader = isAgricultural ? "Market area" : "Valuation group";
  const sourceText = `${getMarketPositionSourceAnchor({ ...classStats, groups })}`;

  return {
    key: normalizedClassKey,
    label: `${classLabel} ${groupKindPlural}`,
    propertyClassLabel: className,
    description: `${rangeHeader}s show where recent qualified ${className} sales are concentrated. They also show how each local group compares with the countywide sales study.`,
    chartTitle: `Sales by ${groupKind}`,
    chartNote: `Qualified sales by ${groupKind}.`,
    rangeHeader,
    countLabel: "Sales",
    lineLabel: "Distribution curve",
    yAxisTitle: "Qualified sales",
    sourceText,
    rows: groups.map(group => {
      const id = group.id ?? group.group;
      return {
        ...group,
        section: groupKindPlural,
        range: group.label || group.descriptiveLabel || `${rangeHeader} ${id}`,
        compactLabel: group.label,
        chartLabel: isAgricultural ? group.label : `VG ${id}`
      };
    }),
    totalRow: classStats.countywide
  };
}

function priceBandStudyForClass(
  padRatioData,
  classKey = "residential",
  marketPositionData = null,
  valuationGroups = null
) {
  const studyKey = priceBandStudyKeyForClass(classKey);
  const localGroupStudy = localGroupStudyForClass(marketPositionData, classKey, valuationGroups);
  if (localGroupStudy) return localGroupStudy;

  if (!padRatioData) return null;

  if (studyKey === "residential" || !padRatioData.priceBandStudies?.[studyKey]) {
    return {
      key: "residential",
      label: "Residential sale-price bands",
      description: "These numbers come from recent qualified residential sales. The price ranges show whether most sales were lower-priced, middle-priced, or higher-priced properties.",
      chartNote: "Recent qualified sales grouped by price band. Empty upper bands are shown when no sales were reported there.",
      rangeHeader: "Sale price range",
      rows: padRatioData.salePriceRanges.filter(row => row.section === "Incremental Ranges"),
      totalRow: countywideTotalForClass(marketPositionData, "residential")
        ?? padRatioData.salePriceRanges
        .find(row => row.range === "ALL" || row.section === "All") ?? {
          count: padRatioData.summary.numberOfSales,
          median: padRatioData.summary.median,
          cod: padRatioData.summary.cod,
          prd: padRatioData.summary.prd,
          averageAdjustedSalePrice: padRatioData.summary.averageAdjustedSalePrice
        }
    };
  }

  const study = padRatioData.priceBandStudies[studyKey];

  return {
    ...study,
    rangeHeader: study.rangeHeader ?? (studyKey === "agFarm" ? "Study group" : "Sale price range"),
    totalRow: countywideTotalForClass(marketPositionData, studyKey) ?? study.totalRow
  };
}

function propertyClassLabelForStudy(classKey = "residential", study = {}) {
  if (study.propertyClassLabel) return study.propertyClassLabel;
  if (classKey === "agFarm" || classKey === "agricultural") return "agricultural";
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

  return `Source: ${year} ${countyName} Property Assessment Division Reports and Opinions${pageText}.`;
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
  return ` Newer sales-study data may be available; this section still uses ${source.reportYear} data.`;
}

function duplicateBandLabels(rows) {
  const counts = rows.reduce((acc, row) => {
    acc[row.range] = (acc[row.range] ?? 0) + 1;
    return acc;
  }, {});

  return new Set(Object.entries(counts).filter(([, count]) => count > 1).map(([label]) => label));
}

function priceBandDisplayLabel(row, duplicateLabels) {
  return duplicateLabels.has(row.range) && row.section
    ? `${row.section} · ${row.range}`
    : row.range;
}

function compactPriceBandDisplayLabel(row, duplicateLabels) {
  if (row.compactLabel) return row.compactLabel;

  const label = shortPriceBandLabel(row.range);
  return duplicateLabels.has(row.range) && row.section
    ? `${row.section} · ${label}`
    : label;
}

function formatCountValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? integer.format(number) : "—";
}

function formatMoneyValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? wholeMoney.format(number) : "—";
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

function confidenceIntervalLabel(interval) {
  if (!interval) return "Confidence interval: not available";
  if (typeof interval === "string") return `Confidence interval: ${interval}`;
  if (interval.low === null || interval.low === undefined || interval.high === null || interval.high === undefined) {
    return "Confidence interval: not available";
  }

  return `Confidence interval: ${formatRatio(interval.low)} to ${formatRatio(interval.high)}`;
}

function getMarketPositionSourceAnchor(classStats) {
  const source = classStats?.source || {};
  const year = source.taxYear ?? source.reportDate?.match(/\b20\d{2}\b/)?.[0] ?? "Current";
  const countyName = source.county ? `${source.county} County` : "county";
  const pages = source.extractedFromPages?.[classStats?.classKey] ?? [];
  const pageRange = pages.length > 1 ? `${pages[0]}-${pages.at(-1)}` : pages[0];
  const pageText = pageRange ? `, pages ${pageRange}` : "";

  return `Source: ${year} ${countyName} Reports and Opinions of the Property Tax Administrator${pageText}.`;
}

function renderMarketPositionLegend() {
  const legend = document.getElementById("marketPositionLegend");
  if (!legend) return;

  const items = [
    {
      label: "Other local groups",
      borderColor: colorAlpha(visualizationTheme.roles.comparison, 0.68),
      backgroundColor: colorAlpha(visualizationTheme.roles.comparison, 0.18)
    },
    {
      label: "Selected group",
      borderColor: visualizationTheme.roles.equalization,
      backgroundColor: colorAlpha(visualizationTheme.roles.equalization, 0.20)
    },
    {
      label: "Countywide result",
      borderColor: visualizationTheme.roles.comparison,
      backgroundColor: palette.white,
      dashed: true
    },
    {
      label: "Expected median range",
      borderColor: visualizationTheme.roles.equalization,
      backgroundColor: colorAlpha(visualizationTheme.roles.equalization, 0.10),
      square: true
    }
  ];

  legend.innerHTML = items.map(item => `
    <div class="flex items-center gap-2">
      <span
        class="chart-legend-dot inline-block border-2"
        style="
          border-color: ${item.borderColor};
          background-color: ${item.backgroundColor};
          ${item.dashed ? "border-style: dashed;" : ""}
          ${item.square ? "border-radius: 0.25rem;" : ""}
        "
      ></span>
      <span>${item.label}</span>
    </div>
  `).join("");
}

function marketPositionBounds(points, countywide, medianRange, codRange) {
  const xValues = points.map(point => point.x).concat(countywide ? [countywide.x] : []);
  const yValues = points.map(point => point.y).concat(countywide ? [countywide.y] : []);
  if (medianRange) xValues.push(medianRange.min, medianRange.max);
  if (codRange) yValues.push(codRange.min, codRange.max);

  const xMinRaw = Math.min(...xValues);
  const xMaxRaw = Math.max(...xValues);
  const yMaxRaw = Math.max(...yValues);
  const xPadding = Math.max(3, (xMaxRaw - xMinRaw) * 0.08);
  const yPadding = Math.max(2, yMaxRaw * 0.12);

  return {
    xMin: Math.max(0, Math.floor(xMinRaw - xPadding)),
    xMax: Math.ceil(xMaxRaw + xPadding),
    yMax: Math.ceil(yMaxRaw + yPadding)
  };
}

function centralMarketPoint(point, medianRange, codRange, countywide) {
  const medianCenter = medianRange?.center
    ?? (medianRange ? (medianRange.min + medianRange.max) / 2 : countywide?.median);
  const medianPadding = medianRange
    ? Math.max(6, (medianRange.max - medianRange.min) * 1.5)
    : 10;
  const codLimit = codRange?.max ?? (countywide ? countywide.cod * 1.6 : 25);
  const codFloor = codRange?.min ?? 0;

  return Math.abs(point.median - medianCenter) <= medianPadding
    && point.cod >= codFloor
    && point.cod <= codLimit + 3;
}

function marketPointTooltip(point, classStats) {
  return [
    `Class: ${classStats?.classLabel ?? "Selected class"}`,
    `Qualified sales: ${integer.format(point.count)}`,
    `Median ratio: ${formatRatio(point.median)}`,
    `COD: ${formatRatio(point.cod)}`,
    `PRD: ${formatRatio(point.prd)}`,
    `Average adjusted sale price: ${wholeMoney.format(point.averageAdjustedSalePrice)}`,
    `Average assessed value: ${wholeMoney.format(point.averageAssessedValue)}`,
    confidenceIntervalLabel(point.medianConfidenceInterval)
  ];
}

function renderMarketScatterSummary(selected, countywide, classStats, medianRange) {
  const summary = document.getElementById("marketScatterSummary");
  if (!summary) return;

  const medianInsideRange = medianRange
    ? selected.median >= medianRange.min && selected.median <= medianRange.max
    : null;
  const medianRangeText = medianInsideRange === null
    ? "is shown against the available median-ratio reference"
    : medianInsideRange
      ? "remains inside the expected median-ratio range"
      : "sits outside the expected median-ratio range";
  const codDelta = selected.cod - countywide.cod;
  const codText = Math.abs(codDelta) < 1
    ? "with COD close to the countywide pattern"
    : codDelta > 0
      ? `with COD ${formatRatio(Math.abs(codDelta))} points more dispersed than the county overall`
      : `with COD ${formatRatio(Math.abs(codDelta))} points less dispersed than the county overall`;
  const sampleText = selected.count < 10
    ? " The sales sample is small, so treat this point as limited evidence."
    : "";

  summary.textContent = `The highlighted group ${medianRangeText} and ${codText}. The nearby cluster shows how other local groups relate to the broader county pattern.${sampleText}`;
}

function renderMarketPriceSummary(selected, countywide) {
  const container = document.getElementById("marketPriceSummary");
  if (!container) return;

  const rows = [
    {
      label: "Average adjusted sale price",
      value: wholeMoney.format(selected.averageAdjustedSalePrice),
      countyValue: wholeMoney.format(countywide.averageAdjustedSalePrice)
    },
    {
      label: "Average assessed value",
      value: wholeMoney.format(selected.averageAssessedValue),
      countyValue: wholeMoney.format(countywide.averageAssessedValue)
    },
    {
      label: "Level of value",
      value: formatRatio(selected.median),
      countyValue: formatRatio(countywide.median)
    }
  ];

  container.innerHTML = rows.map(row => `
    <div
      class="review-card-muted"
      role="group"
      aria-label="${escapeHtml(`${row.label}: ${row.value}. Countywide: ${row.countyValue}.`)}"
    >
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${escapeHtml(row.label)}</p>
      <p class="mt-1 text-2xl font-bold leading-tight text-slate-700">${escapeHtml(row.value)}</p>
      <p class="mt-2 text-xs leading-5 text-slate-500">Countywide: ${escapeHtml(row.countyValue)}</p>
    </div>
  `).join("");
}

function marketGroupContextName(group, classKey = "residential") {
  const fallback = normalizeMarketClassKey(classKey) === "agricultural"
    ? "the selected market area"
    : "the selected local group";
  const value = group?.description || group?.optionLabel || group?.label || fallback;
  return String(value)
    .replace(/\s*·\s*VG\s*\d+\b.*$/i, "")
    .replace(/\s*·\s*(Urban|Rural|City|Village)$/i, "")
    .replace(/^Valuation Group\s*\d+\s*-\s*/i, "")
    .trim() || fallback;
}

function renderMarketPositionScatter(selected, classStats, iaaoStandards, onSelectGroup = null) {
  const canvas = document.getElementById("marketPositionScatter");
  if (!canvas) return;

  const medianRange = getMedianRatioRange(classStats, iaaoStandards);
  const codRange = getCodInterpretationRange(classStats, iaaoStandards);
  const countywide = getCountywideMarketPoint(classStats);
  const points = getMarketScatterPoints(classStats);
  const selectedPoint = points.find(point => String(point.id) === String(selected.id)) ?? points[0];
  const otherPoints = points.filter(point => String(point.id) !== String(selectedPoint.id));
  const bounds = marketPositionBounds(points, countywide, medianRange, codRange);
  const mutedPointColor = colorAlpha(visualizationTheme.roles.comparison, 0.55);
  const mutedPointFill = colorAlpha(visualizationTheme.roles.comparison, 0.18);
  const selectedColor = visualizationTheme.roles.equalization;
  const countyColor = visualizationTheme.roles.comparison;
  const otherPointRadii = otherPoints.map(point =>
    centralMarketPoint(point, medianRange, codRange, countywide) ? 5.5 : 3.5
  );
  const otherPointBackgrounds = otherPoints.map(point =>
    centralMarketPoint(point, medianRange, codRange, countywide)
      ? mutedPointFill
      : colorAlpha(visualizationTheme.roles.comparison, 0.08)
  );
  const otherPointBorders = otherPoints.map(point =>
    centralMarketPoint(point, medianRange, codRange, countywide)
      ? mutedPointColor
      : colorAlpha(visualizationTheme.roles.comparison, 0.32)
  );

  renderMarketPositionLegend();
  marketPositionScatterChart?.destroy();
  marketPositionScatterChart = new Chart(canvas, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Other local groups",
          data: otherPoints,
          pointRadius: otherPointRadii,
          pointHoverRadius: otherPointRadii.map(radius => radius + 2),
          pointBackgroundColor: otherPointBackgrounds,
          pointBorderColor: otherPointBorders,
          pointBorderWidth: 1.5
        },
        {
          label: "Selected group",
          data: selectedPoint ? [selectedPoint] : [],
          pointRadius: 8,
          pointHoverRadius: 10,
          pointBackgroundColor: colorAlpha(selectedColor, 0.22),
          pointBorderColor: selectedColor,
          pointBorderWidth: 3
        },
        {
          label: "Countywide result",
          data: countywide ? [countywide] : [],
          pointRadius: 7,
          pointHoverRadius: 9,
          pointStyle: "triangle",
          pointBackgroundColor: palette.white,
          pointBorderColor: countyColor,
          pointBorderWidth: 2.5
        }
      ]
    },
    plugins: [marketPositionReferencePlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "nearest", intersect: true },
      onClick: (event, elements, chart) => {
        const hit = elements?.[0];
        if (!hit || hit.datasetIndex === 2) return;

        const point = chart.data.datasets[hit.datasetIndex]?.data?.[hit.index];
        if (!point?.id || point.id === "ALL") return;

        onSelectGroup?.(point.id);
      },
      onHover: (event, elements) => {
        canvas.style.cursor = elements?.some(element => element.datasetIndex !== 2) ? "pointer" : "default";
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: context => context[0]?.raw?.label ?? "",
            label: context => `Median ${formatRatio(context.raw.median)}, COD ${formatRatio(context.raw.cod)}`,
            afterLabel: context => marketPointTooltip(context.raw, classStats)
          }
        },
        marketPositionReference: {
          medianRange,
          codRange,
          countywide: countywide ? {
            median: countywide.median,
            cod: countywide.cod
          } : null
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Median ratio" },
          min: bounds.xMin,
          max: bounds.xMax,
          grid: { color: visualizationTheme.neutrals.gridline },
          ticks: { callback: value => formatRatio(Number(value), 0) }
        },
        y: {
          title: mobileAxisTitle("COD"),
          min: 0,
          suggestedMax: bounds.yMax,
          grid: { color: visualizationTheme.neutrals.gridline },
          ticks: { callback: value => formatRatio(Number(value), 0) }
        }
      }
    }
  });

  canvas.setAttribute(
    "aria-label",
    `${selected.label} is highlighted at median ratio ${formatRatio(selected.median)} and COD ${formatRatio(selected.cod)}. Countywide median ratio is ${formatRatio(countywide.median)} and countywide COD is ${formatRatio(countywide.cod)}.`
  );
  renderMarketScatterSummary(selected, countywide, classStats, medianRange);
  const source = document.getElementById("marketPositionSource");
  if (source) source.textContent = getMarketPositionSourceAnchor(classStats);
}

export function initMarketAreaView(data, recordCard, padRatioData, valuationGroups, iaaoStandards, marketPositionData) {
  const legacySelect = document.getElementById("marketAreaSelect");
  const marketAreaSelects = [...document.querySelectorAll("[data-market-area-select]")];
  if (!marketAreaSelects.length && legacySelect) marketAreaSelects.push(legacySelect);
  const classKey = getParcelMarketClass(data);
  const baseClassStats = getClassMarketStats(marketPositionData, classKey);
  if (!baseClassStats?.groups?.length) return;

  const groups = enrichedMarketGroups(baseClassStats.groups, valuationGroups, baseClassStats.classKey);
  const classStats = {
    ...baseClassStats,
    groups
  };
  const countywide = classStats.countywide;
  const medianRange = getMedianRatioRange(classStats, iaaoStandards);
  const signalContext = {
    propertyClass: data.classification?.propertyClass ?? data.parcel?.accountType,
    assessmentClass: classStats.classLabel,
    jurisdictionType: padRatioData?.source?.jurisdictionType ?? data.classification?.location,
    ruralUrbanContext: padRatioData?.source?.ruralUrbanContext ?? data.classification?.location,
    countyName: classStats.source?.county ?? padRatioData?.source?.countyName ?? data.parcel?.countyName,
    specialValuation: Boolean(data.classification?.specialValuation),
    greenbelt: Boolean(data.classification?.greenbelt)
  };
  const defaultGroup = getParcelMarketGroupId(recordCard, classStats.classKey) ?? groups[0].id;
  const sourceNote = document.getElementById("marketSourceNote");
  if (sourceNote) {
    sourceNote.textContent = "Next, place the property in its local comparison group. These recent sales measures lead into the countywide equalization check.";
  }

  const optionsMarkup = groups.map(group => `
    <option value="${group.id}">${group.optionLabel ?? group.label}</option>
  `).join("");
  marketAreaSelects.forEach(select => {
    select.innerHTML = optionsMarkup;
  });

  const update = groupId => {
    const selected = getSelectedMarketGroup(recordCard, classStats, groupId) ?? groups[0];
    const isParcelGroup = String(selected.id) === String(defaultGroup);
    const contextPill = document.getElementById("marketAreaContextPill");
    if (contextPill) {
      contextPill.textContent = selected.optionLabel ?? selected.label ?? `Area ${selected.id}`;
    }
    const priceContextNote = document.getElementById("marketPriceContextNote");
    if (priceContextNote) {
      const groupName = marketGroupContextName(selected, classStats.classKey);
      priceContextNote.textContent = `Average sale price, average assessed value, and level of value show how ${groupName} compares with other groups.`;
    }
    marketAreaSelects.forEach(select => {
      select.value = selected.id;
    });
    renderMarketSignalCards(selected, countywide, iaaoStandards, {
      ...signalContext,
      classStats
    });
    renderMarketNarrative(selected, countywide, classStats, medianRange, iaaoStandards, isParcelGroup);
    renderEqualizationSalePriceRows(padRatioData, classStats.classKey, marketPositionData, valuationGroups, selected.id);
    renderMarketPositionScatter(selected, classStats, iaaoStandards, update);
    renderMarketPriceSummary(selected, countywide);
  };

  marketAreaSelects.forEach(select => {
    select.addEventListener("change", () => update(select.value));
  });
  update(defaultGroup);
}

function buildIndexedOverviewChart(canvasId, data, labels, valueFactor, taxFactor) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const propertyRows = taxpayerTimelineRows(data);
  const series = indexedSeries(propertyRows, valueFactor, taxFactor);
  const contextualRows = propertyRows.map(row => ({
    ...row,
    assessedValue: hasDataValue(row.assessedValue) ? row.assessedValue * valueFactor : null,
    taxes: hasDataValue(row.taxes) ? row.taxes * taxFactor : null
  }));
  const datasets = [
    {
      label: labels.value,
      tooltipValues: formattedTooltipValues(contextualRows, "assessedValue", wholeMoney),
      data: series.valueIndex,
      tension: 0.25,
      borderWidth: 3,
      borderColor: chartColors.contextValue,
      backgroundColor: semanticChartColors.valueBg,
      spanGaps: true
    },
    {
      label: labels.tax,
      tooltipValues: formattedTooltipValues(contextualRows, "taxes", moneyCents),
      data: series.taxIndex,
      tension: 0.25,
      borderWidth: 3,
      borderColor: chartColors.contextTax,
      backgroundColor: semanticChartColors.taxBg,
      spanGaps: true
    },
    ...propertyIndexedDatasets(propertyRows, series.years)
  ];
  const pendingColumns = pendingColumnsForDataRows(contextualRows, ["assessedValue", "taxes"]);

  new Chart(canvas, {
    type: "line",
    plugins: [indexedPendingColumnPlugin],
    data: {
      labels: series.years,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        indexedPendingColumn: pendingColumnOptions(pendingColumns),
        legend: {
          labels: {
            boxWidth: 34,
            boxHeight: 10,
            padding: 18
          }
        },
        tooltip: {
          callbacks: {
            label: indexedTooltipLabel
          }
        }
      },
      scales: {
        y: {
          title: mobileAxisTitle("Index"),
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

  const orderedRows = rows.slice().sort((a, b) => a.year - b.year);
  const baseValue = orderedRows[0].totalValue;
  const baseTaxes = orderedRows[0].taxesLevied;
  const years = orderedRows.map(row => row.year);
  const valueColor = palette.valueColor ?? chartColors.contextValue;
  const valueBg = palette.valueBg ?? semanticChartColors.valueBg;
  const taxColor = palette.taxColor ?? chartColors.contextTax;
  const taxBg = palette.taxBg ?? semanticChartColors.taxBg;
  const datasets = [
    {
      label: labels.value,
      tooltipValues: formattedTooltipValues(orderedRows, "totalValue", compactMoney),
      data: orderedRows.map(row => (row.totalValue / baseValue) * 100),
      tension: 0.25,
      borderWidth: 3,
      borderColor: valueColor,
      backgroundColor: valueBg
    },
    {
      label: labels.tax,
      tooltipValues: formattedTooltipValues(orderedRows, "taxesLevied", compactMoney),
      data: orderedRows.map(row => (row.taxesLevied / baseTaxes) * 100),
      tension: 0.25,
      borderWidth: 3,
      borderColor: taxColor,
      backgroundColor: taxBg
    },
    ...propertyIndexedDatasets(propertyRows, years, palette)
  ];
  const pendingColumns = pendingColumnsForChartDatasets(years, datasets);
  const hasCustomLegend = renderCustomLegend(`${canvasId}Legend`, datasets);

  new Chart(canvas, {
    type: "line",
    plugins: [indexedPendingColumnPlugin],
    data: {
      labels: years,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        indexedPendingColumn: pendingColumnOptions(pendingColumns),
        legend: {
          display: !hasCustomLegend,
          labels: {
            boxWidth: 34,
            boxHeight: 10,
            padding: 18
          }
        },
        tooltip: {
          callbacks: {
            label: indexedTooltipLabel
          }
        }
      },
      scales: {
        y: {
          title: mobileAxisTitle("Index"),
          suggestedMin: 90,
          suggestedMax: 170
        }
      }
    }
  });
}

export function buildEtrChart(data) {
  const rows = taxpayerTimelineRows(data);
  const years = rows.map(row => row.year);
  const etrValues = rows.map(row => {
    const etr = calculateEtr(row);
    return etr === null ? null : etr * 100;
  });
  const pendingColumns = pendingColumnsForRows(rows, row => calculateEtr(row) === null);

  new Chart(document.getElementById("etrChart"), {
    type: "line",
    plugins: [indexedPendingColumnPlugin],
    data: {
      labels: years,
      datasets: [
        {
          label: "Effective tax rate",
          data: etrValues,
          tension: 0.25,
          borderWidth: 3,
          borderColor: chartColors.contextRate,
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
        indexedPendingColumn: pendingColumnOptions(pendingColumns),
        tooltip: {
          callbacks: {
            label: context => context.parsed.y === null ? "ETR: Pending" : `ETR: ${formatApproximateRatePercent(context.parsed.y)}`
          }
        }
      },
      scales: {
        y: {
          title: mobileAxisTitle("Effective tax rate"),
          ticks: { callback: value => formatApproximateRatePercent(value) },
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

  const propertyRows = taxpayerTimelineRows(data);
  const years = propertyRows.map(row => row.year);
  const etrValues = propertyRows.map(row => {
    const etr = calculateEtr(row);
    return etr === null ? null : etr * 100 * factor;
  });
  const pendingColumns = pendingColumnsForRows(propertyRows, row => calculateEtr(row) === null);

  new Chart(canvas, {
    type: "line",
    plugins: [indexedPendingColumnPlugin],
    data: {
      labels: years,
      datasets: [
        {
          label,
          data: etrValues,
          tension: 0.25,
          borderWidth: 3,
          borderColor: chartColors.contextRate,
          backgroundColor: semanticChartColors.etrBg,
          spanGaps: true
        },
        propertyRateDataset(propertyRows, years)
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        indexedPendingColumn: pendingColumnOptions(pendingColumns)
      },
      scales: {
        y: {
          title: mobileAxisTitle("Effective tax rate"),
          ticks: { callback: value => formatApproximateRatePercent(value) },
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
  const orderedRows = rows.slice().sort((a, b) => a.year - b.year);
  const years = orderedRows.map(row => row.year);
  const rateColor = palette.rateColor ?? chartColors.contextRate;
  const rateBg = palette.rateBg ?? semanticChartColors.etrBg;
  const datasets = [
    {
      label,
      data: orderedRows.map(row => row.averageTaxRate * 100),
      tension: 0.25,
      borderWidth: 3,
      borderColor: rateColor,
      backgroundColor: rateBg
    },
    propertyRateDataset(propertyRows, years, palette)
  ];
  const pendingColumns = pendingColumnsForChartDatasets(years, datasets);
  const hasCustomLegend = renderCustomLegend(`${canvasId}Legend`, datasets);

  new Chart(canvas, {
    type: "line",
    plugins: [indexedPendingColumnPlugin],
    data: {
      labels: years,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        indexedPendingColumn: pendingColumnOptions(pendingColumns),
        legend: { display: !hasCustomLegend }
      },
      scales: {
        y: {
          title: mobileAxisTitle("Average tax rate"),
          ticks: { callback: value => formatApproximateRatePercent(value) },
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
  const propertyRows = taxpayerTimelineRows(data);
  const countyRows = ctlData.counties
    .filter(row => row.countyName === countyName)
    .sort((a, b) => a.year - b.year);
  const stateRows = ctlData.statewide.slice().sort((a, b) => a.year - b.year);

  buildIndexedOverviewChart("marketIndexedChart", data, { value: "Market area value", tax: "Market area tax bill" }, 0.96, 1.01);
  buildEtrOverviewChart("marketEtrChart", data, "Market area ETR", 0.98);

  buildCertifiedIndexedChart("countyIndexedChart", countyRows, { value: `${countyLabel} value`, tax: `${countyLabel} taxes levied` }, propertyRows);
  buildCertifiedRateChart("countyEtrChart", countyRows, `${countyLabel} average tax rate`, propertyRows);

  buildCertifiedIndexedChart("stateIndexedChart", stateRows, { value: "Statewide value", tax: "Statewide taxes levied" }, propertyRows, {
    valueColor: semanticChartColors.value,
    valueBg: semanticChartColors.valueBg,
    taxColor: semanticChartColors.tax,
    taxBg: semanticChartColors.taxBg,
    propertyValueColor: semanticChartColors.value,
    propertyValueBg: semanticChartColors.valueBg,
    propertyTaxColor: semanticChartColors.tax,
    propertyTaxBg: semanticChartColors.taxBg
  });
  buildCertifiedRateChart("stateEtrChart", stateRows, "Statewide average tax rate", propertyRows, {
    rateColor: semanticChartColors.tax,
    rateBg: semanticChartColors.taxBg,
    propertyRateColor: semanticChartColors.etr,
    propertyRateBg: semanticChartColors.etrBg
  });
}

function indexChange(rows, key) {
  if (!rows?.length) return null;
  const orderedRows = rows.slice().sort((a, b) => a.year - b.year);
  return (orderedRows.at(-1)[key] / orderedRows[0][key]) - 1;
}

function formatChange(value) {
  if (value === null || value === undefined) return "—";
  return percent.format(value);
}

function formatApproximateRatePercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toFixed(1)}%`;
}

function indexChangeFromAvailableRows(rows, key) {
  const usableRows = (rows || [])
    .filter(row => hasDataValue(row?.[key]) && Number(row[key]) !== 0)
    .sort((a, b) => a.year - b.year);
  return indexChange(usableRows, key);
}

function propertyRateMovement(rows) {
  const usableRows = (rows || [])
    .map(row => ({ ...row, etr: calculateEtr(row) }))
    .filter(row => row.etr !== null)
    .sort((a, b) => a.year - b.year);
  if (usableRows.length < 2) return "—";
  return `${formatApproximateRatePercent(usableRows[0].etr * 100)} to ${formatApproximateRatePercent(usableRows.at(-1).etr * 100)}`;
}

function latestRow(rows) {
  return rows?.length ? rows.slice().sort((a, b) => a.year - b.year).at(-1) : null;
}

function yearRangeLabel(rows) {
  const years = [...new Set((rows || [])
    .map(row => Number(row?.year))
    .filter(year => Number.isFinite(year)))]
    .sort((a, b) => a - b);

  if (!years.length) return "available years";
  if (years.length === 1) return `${years[0]}`;

  return `${years[0]} - ${years.at(-1)}`;
}

function setText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function pressureIndex(rows, statewideRows) {
  const row = latestRow(rows);
  const stateRow = latestRow(statewideRows);
  if (!row?.averageTaxRate || !stateRow?.averageTaxRate) return null;

  return (row.averageTaxRate / stateRow.averageTaxRate) * 100;
}

function formatPressureIndex(value) {
  if (value === null || value === undefined) return "—";
  return integer.format(value);
}

function pressureNote(value) {
  if (value === null || value === undefined) return "Nebraska's average tax rate is indexed to 100.";
  const delta = value - 100;
  if (Math.abs(delta) < 0.5) return "Aligned with Nebraska's average tax rate.";

  return `${Math.abs(delta).toFixed(0)} points ${delta > 0 ? "above" : "below"} Nebraska's average tax rate.`;
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

function renderCountyComparisonSummary(primaryRows, comparisonRows, statewideRows, primaryLabel, comparisonLabel) {
  const container = document.getElementById("countyComparisonSummary");
  if (!container) return;

  const primaryPressure = pressureIndex(primaryRows, statewideRows);
  const comparisonPressure = pressureIndex(comparisonRows, statewideRows);
  const cards = [
    {
      key: "state-growth",
      label: `${comparisonLabel} growth`,
      value: `${formatChange(indexChange(comparisonRows, "totalValue"))} value`,
      note: `${formatChange(indexChange(comparisonRows, "taxesLevied"))} taxes levied.`
    },
    {
      key: "state-pressure",
      label: `${comparisonLabel} average rate comparison`,
      value: formatPressureIndex(comparisonPressure),
      note: comparisonLabel === "Statewide" ? "Nebraska's average tax rate is indexed to 100." : pressureNote(comparisonPressure)
    },
    {
      key: "county-growth",
      label: `${primaryLabel} growth`,
      value: `${formatChange(indexChange(primaryRows, "totalValue"))} value`,
      note: `${formatChange(indexChange(primaryRows, "taxesLevied"))} taxes levied.`
    },
    {
      key: "county-pressure",
      label: `${primaryLabel} average rate comparison`,
      value: formatPressureIndex(primaryPressure),
      note: pressureNote(primaryPressure)
    }
  ];

  container.innerHTML = cards.map(card => `
    <div class="pressure-card county-comparison-card county-comparison-card-${card.key}">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${card.label}</p>
      <p class="mt-1 text-lg font-bold text-slate-700">${card.value}</p>
      <p class="mt-1 text-xs leading-5 text-slate-600">${card.note}</p>
    </div>
  `).join("");
}

function renderCountyComparisonCharts(ctlData, primaryCounty, comparisonTarget) {
  const primaryRows = getCtlRowsForTarget(ctlData, primaryCounty);
  const comparisonRows = getCtlRowsForTarget(ctlData, comparisonTarget);
  const statewideRows = getCtlRowsForTarget(ctlData, "__STATE__");
  if (!primaryRows.length || !comparisonRows.length) return;

  const primaryLabel = countyDisplayName(primaryCounty);
  const comparisonLabel = comparisonTarget === "__STATE__" ? "Statewide" : countyDisplayName(comparisonTarget);
  const years = primaryRows.map(row => row.year);
  const primaryIndex = ctlIndexedRows(primaryRows, "totalValue", "taxesLevied");
  const comparisonIndex = ctlIndexedRows(comparisonRows, "totalValue", "taxesLevied");
  const comparisonValueColor = colorAlpha(chartColors.contextValue, 0.4);
  const comparisonTaxColor = colorAlpha(chartColors.contextTax, 0.4);
  const indexedDatasets = [
    {
      label: `${primaryLabel} value`,
      tooltipValues: formattedTooltipValues(primaryRows, "totalValue", compactMoney),
      data: primaryIndex.value,
      tension: 0.25,
      borderWidth: 3,
      borderColor: chartColors.contextValue,
      backgroundColor: semanticChartColors.valueBg
    },
    {
      label: `${primaryLabel} taxes levied`,
      tooltipValues: formattedTooltipValues(primaryRows, "taxesLevied", compactMoney),
      data: primaryIndex.taxes,
      tension: 0.25,
      borderWidth: 3,
      borderColor: chartColors.contextTax,
      backgroundColor: semanticChartColors.taxBg
    },
    {
      label: `${comparisonLabel} value`,
      tooltipValues: formattedTooltipValues(comparisonRows, "totalValue", compactMoney),
      data: comparisonIndex.value,
      tension: 0.25,
      borderWidth: 2,
      borderColor: comparisonValueColor,
      backgroundColor: semanticChartColors.valueBg,
      pointBackgroundColor: comparisonValueColor,
      pointBorderColor: comparisonValueColor
    },
    {
      label: `${comparisonLabel} taxes levied`,
      tooltipValues: formattedTooltipValues(comparisonRows, "taxesLevied", compactMoney),
      data: comparisonIndex.taxes,
      tension: 0.25,
      borderWidth: 2,
      borderColor: comparisonTaxColor,
      backgroundColor: semanticChartColors.taxBg,
      pointBackgroundColor: comparisonTaxColor,
      pointBorderColor: comparisonTaxColor
    }
  ];
  const rateDatasets = [
    {
      label: `${primaryLabel} average tax rate`,
      data: primaryRows.map(row => row.averageTaxRate * 100),
      tension: 0.25,
      borderWidth: 3,
      borderColor: chartColors.contextRate,
      backgroundColor: semanticChartColors.etrBg
    },
    {
      label: `${comparisonLabel} average tax rate`,
      data: comparisonRows.map(row => row.averageTaxRate * 100),
      tension: 0.25,
      borderWidth: 2,
      borderColor: comparisonTaxColor,
      backgroundColor: semanticChartColors.etrBg,
      pointBackgroundColor: comparisonTaxColor,
      pointBorderColor: comparisonTaxColor
    }
  ];
  const hasIndexedLegend = renderCustomLegend("countyComparisonIndexedChartLegend", indexedDatasets);
  const hasRateLegend = renderCustomLegend("countyComparisonRateChartLegend", rateDatasets);
  const indexedPendingColumns = pendingColumnsForChartDatasets(years, indexedDatasets);
  const ratePendingColumns = pendingColumnsForChartDatasets(years, rateDatasets);
  const comparisonRange = yearRangeLabel(primaryRows);

  setText("countyComparisonRangeIntro", `This comparison covers the ${comparisonRange} assessment-year range shown in the charts below. It starts with a simple baseline: Nebraska equals 100. A county above 100 has a higher average tax rate than the statewide average; below 100 has a lower rate. Certified values, taxes levied, and average tax rates provide additional context.`);
  setText("countyComparisonIndexedNote", `${primaryLabel} is compared with ${comparisonLabel}, indexed to ${years[0]}.`);
  setText("countyComparisonRateNote", `${primaryLabel} and ${comparisonLabel} average CTL tax rates.`);
  renderCountyComparisonSummary(primaryRows, comparisonRows, statewideRows, primaryLabel, comparisonLabel);

  countyComparisonIndexedChart?.destroy();
  countyComparisonIndexedChart = new Chart(document.getElementById("countyComparisonIndexedChart"), {
    type: "line",
    plugins: [indexedPendingColumnPlugin],
    data: {
      labels: years,
      datasets: indexedDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        indexedPendingColumn: pendingColumnOptions(indexedPendingColumns),
        legend: { display: !hasIndexedLegend },
        tooltip: {
          callbacks: {
            label: indexedTooltipLabel
          }
        }
      },
      scales: {
        y: {
          title: mobileAxisTitle("Index"),
          suggestedMin: 90,
          suggestedMax: 170
        }
      }
    }
  });

  countyComparisonRateChart?.destroy();
  countyComparisonRateChart = new Chart(document.getElementById("countyComparisonRateChart"), {
    type: "line",
    plugins: [indexedPendingColumnPlugin],
    data: {
      labels: years,
      datasets: rateDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        indexedPendingColumn: pendingColumnOptions(ratePendingColumns),
        legend: { display: !hasRateLegend }
      },
      scales: {
        y: {
          title: mobileAxisTitle("Average tax rate"),
          ticks: { callback: value => formatApproximateRatePercent(value) },
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

  const countyGrowthSummary = document.getElementById("countyGrowthSummary");
  const countyRateSummary = document.getElementById("countyRateSummary");
  const countyRange = yearRangeLabel(countyRows);
  setText("countyCtlSummaryIntro", `Certified values and taxes levied from ${countyRange} show the broader value base and the public obligations distributed across it before the parcel-level tax step.`);
  setText("countyIndexedRangeNote", `The chart and table below cover ${countyRange}. Values and taxes are indexed to the same starting point so their movement can be compared over time.`);

  const valueGrowth = formatChange(indexChange(countyRows, "totalValue"));
  const taxGrowth = formatChange(indexChange(countyRows, "taxesLevied"));
  const rateMovement = `${formatApproximateRatePercent(countyRows[0].averageTaxRate * 100)} to ${formatApproximateRatePercent(countyRows.at(-1).averageTaxRate * 100)}`;
  const propertyRows = taxpayerTimelineRows(data);
  const propertyValueGrowth = formatChange(indexChangeFromAvailableRows(propertyRows, "assessedValue"));
  const propertyTaxGrowth = formatChange(indexChangeFromAvailableRows(propertyRows, "taxes"));
  const propertyRateChange = propertyRateMovement(propertyRows);

  if (countyGrowthSummary) {
    countyGrowthSummary.innerHTML = `
      <div class="county-growth-pair county-baseline-card review-card-muted">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">County value growth</p>
          <p class="mt-1 text-lg font-bold text-slate-700">${valueGrowth}</p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">County tax growth</p>
          <p class="mt-1 text-lg font-bold text-slate-700">${taxGrowth}</p>
        </div>
      </div>
      <div class="county-growth-pair county-baseline-card review-card-muted">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Property value growth</p>
          <p class="mt-1 text-lg font-bold text-slate-700">${propertyValueGrowth}</p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Property tax growth</p>
          <p class="mt-1 text-lg font-bold text-slate-700">${propertyTaxGrowth}</p>
        </div>
      </div>`;
  }

  if (countyRateSummary) {
    countyRateSummary.innerHTML = `
      <div class="county-baseline-card review-card-muted">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">County rate movement</p>
        <p class="mt-1 text-lg font-bold text-slate-700">${rateMovement}</p>
      </div>
      <div class="county-baseline-card review-card-muted">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Property rate movement</p>
        <p class="mt-1 text-lg font-bold text-slate-700">${propertyRateChange}</p>
      </div>`;
  }

  const stateSummary = document.getElementById("stateCtlSummary");
  if (stateSummary) {
    const stateCards = [
      {
        label: "Statewide value growth",
        value: formatChange(indexChange(stateRows, "totalValue")),
        note: "Total certified value growth since 2019.",
        color: semanticChartColors.value
      },
      {
        label: "Statewide tax growth",
        value: formatChange(indexChange(stateRows, "taxesLevied")),
        note: "Total taxes levied growth since 2019.",
        color: semanticChartColors.tax
      },
      {
        label: "Statewide average tax rate",
        value: `${formatApproximateRatePercent(stateRows[0].averageTaxRate * 100)} to ${formatApproximateRatePercent(stateRows.at(-1).averageTaxRate * 100)}`,
        note: "Average CTL tax-rate movement over the same period.",
        color: semanticChartColors.tax
      }
    ];

    stateSummary.innerHTML = stateCards.map(card => `
      <div class="statewide-summary-card review-card">
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
