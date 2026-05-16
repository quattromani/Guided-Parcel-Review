import { calculateEtr, groupLevy, percent } from "./format.js";
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

export { initDemographicsView } from "./charts/demographics.js";

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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formattedTooltipValues(rows, key, formatter, factor = 1) {
  return rows.map(row => hasDataValue(row?.[key]) ? formatter.format(row[key] * factor) : "Pending");
}

function indexedTooltipLabel(context) {
  const label = context.dataset.tooltipLabel ?? context.dataset.label;
  const tooltipValues = context.dataset.tooltipValues;

  if (tooltipValues) {
    return `${label}: ${tooltipValues[context.dataIndex] ?? "Pending"}`;
  }

  return `${label}: ${context.parsed.y?.toFixed(1) ?? "Pending"}`;
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
    if (!chartArea || !scales.x || !columns.length || options.showLabel === false) return;

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
  const usableValueRows = data.taxpayerHistory.filter(row => hasDataValue(row.assessedValue));
  const usableTaxRows = data.taxpayerHistory.filter(row => hasDataValue(row.taxes));
  const years = data.taxpayerHistory.map(row => row.year);
  const baseValue = usableValueRows[0]?.assessedValue;
  const baseTaxes = usableTaxRows[0]?.taxes;
  const pendingColumns = data.taxpayerHistory
    .map((row, index) => ({
      index,
      year: row.year,
      pending: !hasDataValue(row.assessedValue) || !hasDataValue(row.taxes)
    }))
    .filter(row => row.pending);

  document.getElementById("baseYearNote").textContent = `Base year: ${usableValueRows[0]?.year ?? "—"}`;

  const valueIndex = data.taxpayerHistory.map(row =>
    hasDataValue(row.assessedValue) && baseValue ? (row.assessedValue / baseValue) * 100 : null
  );
  const taxIndex = data.taxpayerHistory.map(row =>
    hasDataValue(row.taxes) && baseTaxes ? (row.taxes / baseTaxes) * 100 : null
  );
  const datasets = [
    {
      label: "Assessed value",
      tooltipValues: formattedTooltipValues(data.taxpayerHistory, "assessedValue", wholeMoney),
      data: valueIndex,
      tension: 0.25,
      borderWidth: 3,
      borderColor: chartColors.contextValue,
      backgroundColor: semanticChartColors.valueBg,
      spanGaps: true
    },
    {
      label: "Tax bill",
      tooltipValues: formattedTooltipValues(data.taxpayerHistory, "taxes", moneyCents),
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
        indexedPendingColumn: {
          columns: pendingColumns
        },
        legend: { display: !hasCustomLegend },
        tooltip: {
          callbacks: {
            label: indexedTooltipLabel
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
    <div class="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <div class="min-w-0">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${item.label}</p>
        <p class="mt-1 text-2xl font-bold text-slate-700">${item.value}</p>
      </div>
      <p class="max-w-40 text-right text-sm font-semibold leading-5 text-slate-600">${item.note}</p>
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
    definition: "Uniformity is measured by COD. It shows how tightly individual assessment ratios cluster around the median ratio."
  },
  {
    key: "prd",
    label: "Price level fairness",
    shortLabel: "PRD",
    category: "Statistical measure",
    color: chartColors.prd,
    fill: semanticChartColors.equalizationBg,
    cardBackground: semanticChartColors.equalizationSoft,
    cardBorder: semanticChartColors.equalizationRing,
    digits: 3,
    borderDash: [7, 5],
    pointStyle: "rectRot",
    definition: "Price level fairness is measured by PRD. It shows whether lower- and higher-priced properties are being treated evenly."
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
    definition: "COV measures relative variation around the mean ratio. When a comparison band is available, it is approximate context derived from the selected COD guidance."
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
  definition: "Level of value uses the median ratio to show whether the class is within the applicable assessment level range."
};

const assessmentBandDefinitions = [
  ...assessmentMeasureDefinitions,
  assessmentLevelDefinition
];

function getAssessmentStandardByKey(collection, key) {
  return collection?.find(item => item.key === key) ?? null;
}

function getCodAssessmentStandard(selectedClass, iaaoStandards) {
  if (selectedClass.key === "agFarm") return null;

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

function rawBandStatus(value, range, { approximate = false } = {}) {
  const bandLabel = approximate ? "context band" : "standard band";

  if (value === null || value === undefined || !range) {
    return { label: "No direct band", tone: "unknown" };
  }

  if (value < range.min) return { label: `Below ${bandLabel}`, tone: "outside" };
  if (value > range.max) return { label: `Above ${bandLabel}`, tone: "outside" };

  return { label: `Inside ${bandLabel}`, tone: "inside" };
}

function assessmentLevelStatus(value, range) {
  if (value === null || value === undefined || !range) {
    return { label: "No target status", tone: "unknown" };
  }

  if (value < range.min) return { label: "Below class range", tone: "outside" };
  if (value > range.max) return { label: "Above class range", tone: "outside" };
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
      const labelX = Math.min(chart.width - 40, chartArea.right + 9);
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
  return selectedClass.records.filter(row => (
    row.year >= assessmentDisplayYears.start && row.year <= assessmentDisplayYears.end
  ));
}

function renderAssessmentSummary(selectedClass, iaaoStandards) {
  const summary = document.getElementById("assessmentAccuracySummary");
  if (!summary) return;

  const latest = selectedClass.records.at(-1);
  const bandConfig = getAssessmentBandConfig(selectedClass, iaaoStandards);
  const levelRange = bandConfig.levelOfValue;
  const levelRangeText = standardRangeLabel(levelRange, 0, "No class range");
  const levelRangeNote = levelRange ? `Class range: ${levelRangeText}%` : levelRangeText;
  const levelHelp = levelRange
    ? `Level of value uses the median ratio as the class-level assessment indicator. The applicable range for this class is ${levelRangeText}%.`
    : "Level of value uses the median ratio as the class-level assessment indicator.";

  const cards = [
    {
      label: "COD",
      value: latest.cod.toFixed(2),
      note: `${formatSignedChange(selectedClass.summary.codChangeSince2025)} from 2025`,
      color: chartColors.cod,
      status: rawBandStatus(latest.cod, bandConfig.cod),
      help: "Coefficient of Dispersion shows how tightly assessment ratios cluster around the median. Lower values generally indicate more uniform assessments."
    },
    {
      label: "PRD",
      value: latest.prd.toFixed(3),
      note: `${formatSignedChange(selectedClass.summary.prdDistanceChangeSince2025, 3)} distance from 2025`,
      color: chartColors.prd,
      status: rawBandStatus(latest.prd, bandConfig.prd),
      help: "Price-Related Differential checks whether lower- and higher-priced properties are assessed evenly. Values close to 1.00 are preferred."
    },
    {
      label: "COV",
      value: latest.cov.toFixed(2),
      note: `${formatSignedChange(selectedClass.summary.covChangeSince2025)} from 2025`,
      color: chartColors.cov,
      status: rawBandStatus(latest.cov, bandConfig.cov, { approximate: true }),
      help: "Coefficient of Variation shows how spread out assessment ratios are around their mean. The displayed band is approximate context, not a direct COD substitute."
    },
    {
      label: "Level of value",
      value: `${latest.levelOfValue.toFixed(2)}%`,
      note: levelRangeNote,
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
    <article class="assessment-metric-card assessment-band-card rounded-xl p-4" style="--metric-color: ${card.color}; --metric-bg: ${colorAlpha(card.color, 0.045)}; --metric-border: ${colorAlpha(card.color, 0.24)}; --measure-color: ${definition.color}; --measure-bg: ${colorAlpha(definition.color, 0.045)}; --measure-border: ${colorAlpha(definition.color, 0.25)};">
      <div class="assessment-metric-topline">
        <div class="min-w-0">
          <div class="assessment-metric-heading">
            <p class="assessment-metric-label text-xs font-semibold uppercase tracking-wide">${card.label}</p>
            <span class="assessment-metric-help">
              <button type="button" class="assessment-help-button" aria-label="${card.label} explanation">?</button>
              <span class="assessment-help-tooltip" role="tooltip">${card.help}</span>
            </span>
          </div>
          <p class="assessment-metric-value mt-1 text-lg font-bold">${card.value}</p>
          <p class="assessment-metric-status assessment-metric-status-${card.status.tone}">${card.status.label}</p>
          <p class="assessment-metric-note mt-1 text-xs leading-5">${card.note}</p>
        </div>
        <span class="assessment-band-code">${definition.shortLabel}</span>
      </div>

      <details class="assessment-detail-drawer" ${detailOpen ? "open" : ""}>
        <summary class="assessment-detail-toggle">See statistics + chart</summary>
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
    note.textContent = "COD, PRD, and COV are normalized to their own bands so their relative movement can be read together.";
    return;
  }

  const tightest = spreads.reduce((best, item) => item.spread < best.spread ? item : best, spreads[0]);
  const firstYear = records[0]?.year;
  const yearWindow = firstYear ? `${firstYear}-${latest.year}` : "the displayed";

  if (latest.spread <= tightest.spread + 0.05) {
    note.textContent = `${latest.year} is one of the tightest convergences in the ${yearWindow} window: COD, PRD, and COV are ${latest.spread.toFixed(2)} normalized band-widths apart. They remain different statistics, but their latest readings land in a similar position relative to their own ranges.`;
    return;
  }

  note.textContent = `${latest.year} places COD, PRD, and COV ${latest.spread.toFixed(2)} normalized band-widths apart. The combined view keeps their raw scales separate while showing how each measure sits relative to its own range.`;
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
  const hasApproximateBand = assessmentMeasureDefinitions.some(definition =>
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
          right: 48
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
          enabled: true
        }
      },
      scales: {
        y: {
          title: { display: true, text: "Position within selected band" },
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

function renderEqualizationSalePriceRows(padRatioData, classKey = "residential", marketPositionData = null) {
  const table = document.getElementById("equalizationSalePriceRows");
  if (!table || !padRatioData) return;

  const study = priceBandStudyForClass(padRatioData, classKey, marketPositionData);
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
  if (rangeHeader) rangeHeader.textContent = study.rangeHeader || "Sale price range";
  if (source) source.textContent = `${getPadRoSourceAnchor(padRatioData)}${getPadRoRefreshWatch(padRatioData)}`;

  const dataRows = rows.map(row => `
    <tr>
      <td class="px-2 py-2 font-medium text-slate-700">${priceBandDisplayLabel(row, duplicateLabels)}</td>
      <td class="px-2 py-2 text-right">${formatCountValue(row.count)}</td>
      <td class="px-2 py-2 text-right">${row.count ? formatRatio(row.median) : "—"}</td>
      <td class="px-2 py-2 text-right">${row.count ? formatRatio(row.cod) : "—"}</td>
      <td class="px-2 py-2 text-right">${row.count ? formatRatio(row.prd) : "—"}</td>
      <td class="px-2 py-2 text-right">${row.count ? formatMoneyValue(row.averageAdjustedSalePrice) : "—"}</td>
    </tr>
  `).join("");
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
  renderEqualizationSalePriceChart(rows, study, duplicateLabels);
}

function renderEqualizationSalePriceChart(rows, study = {}, duplicateLabels = new Set()) {
  const canvas = document.getElementById("equalizationSalePriceChart");
  if (!canvas) return;

  const datasets = [
    {
      type: "bar",
      label: study.countLabel || "Sales",
      data: rows.map(row => row.count),
      backgroundColor: semanticChartColors.equalizationBg,
      borderColor: chartColors.equalization,
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
      borderColor: semanticChartColors.comparison,
      backgroundColor: semanticChartColors.comparisonBg,
      pointBackgroundColor: semanticChartColors.comparison,
      pointRadius: 3,
      fill: true,
      order: 1
    }
  ];
  const hasCustomLegend = renderCustomLegend("equalizationSalePriceChartLegend", datasets);

  equalizationSalePriceChart?.destroy();
  equalizationSalePriceChart = new Chart(canvas, {
    data: {
      labels: rows.map(row => shortPriceBandLabel(priceBandDisplayLabel(row, duplicateLabels))),
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

function renderAssessmentClass(selectedClass, iaaoStandards, padRatioData = null, marketPositionData = null) {
  renderAssessmentSummary(selectedClass, iaaoStandards);
  renderAssessmentRows(selectedClass);
  renderAssessmentAccuracyChart(selectedClass, iaaoStandards);
  renderEqualizationSalePriceRows(padRatioData, selectedClass.key, marketPositionData);
  window.dispatchEvent(new CustomEvent("assessment-class-change", {
    detail: { key: selectedClass.key, label: selectedClass.label }
  }));
}

export function initAssessmentRatioAnalysis(data, ratioData, iaaoStandards, padRatioData = null, marketPositionData = null) {
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
    renderAssessmentClass(selectedClass, iaaoStandards, padRatioData, marketPositionData);
  };

  buttons.forEach(button => {
    button.addEventListener("click", () => update(button.dataset.assessmentClass));
  });

  update(defaultKey);
}

function indexedSeries(rows, valueFactor = 1, taxFactor = 1) {
  const usableValueRows = rows.filter(row => hasDataValue(row.assessedValue));
  const usableTaxRows = rows.filter(row => hasDataValue(row.taxes));
  const baseValue = usableValueRows[0]?.assessedValue;
  const baseTaxes = usableTaxRows[0]?.taxes;

  return {
    years: rows.map(row => row.year),
    valueIndex: rows.map(row => hasDataValue(row.assessedValue) && baseValue ? (row.assessedValue / baseValue) * 100 * valueFactor : null),
    taxIndex: rows.map(row => hasDataValue(row.taxes) && baseTaxes ? (row.taxes / baseTaxes) * 100 * taxFactor : null)
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

function marketAreaSignal(selected, summary, classStats, medianRange = null, isParcelGroup = true) {
  const medianDelta = selected.median - summary.median;
  const codDelta = selected.cod - summary.cod;
  const classLabel = classStats?.classLabel ?? "selected property class";
  const className = classLabel.replace(/\s+real property/i, "").toLowerCase();
  const groupKind = classStats?.classKey === "agricultural" ? "market area" : "valuation group";
  const rangeText = medianRange
    ? selected.median >= medianRange.min && selected.median <= medianRange.max
      ? "inside the expected range"
      : "outside the expected range"
    : "shown for context";
  const medianText = Math.abs(medianDelta) < 1
    ? `close to the county ${className} median`
    : medianDelta > 0
      ? `${Math.abs(medianDelta).toFixed(2)} points above the county ${className} median`
      : `${Math.abs(medianDelta).toFixed(2)} points below the county ${className} median`;
  const codText = Math.abs(codDelta) < 1
    ? "close to the countywide pattern"
    : codDelta < 0
      ? `less dispersed than the county overall by ${Math.abs(codDelta).toFixed(2)} COD points`
      : `more dispersed than the county overall by ${Math.abs(codDelta).toFixed(2)} COD points`;
  const sampleText = selected.count < 10
    ? " Because this is a small sample, its position can move more from sale to sale."
    : "";

  const groupIntro = isParcelGroup
    ? `${selected.label} is this property’s local ${groupKind}`
    : `${selected.label} is the selected ${groupKind}`;

  return `${groupIntro}. It includes ${integer.format(selected.count)} qualified ${className} sales. Its median ratio is ${formatRatio(selected.median)}, ${medianText} and ${rangeText}. Its COD is ${formatRatio(selected.cod)}, ${codText}.${sampleText}`;
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
      definition: "COD shows how tightly this local group's sales ratios cluster around the median ratio."
    },
    {
      metricKey: "prd",
      label: "PRD",
      shortLabel: "PRD",
      category: "Price fairness",
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
      class="metric-signal-card metric-signal-card-${signal.tone} rounded-xl p-4"
      role="group"
      aria-label="${escapeHtml(ariaLabel)}"
      style="--measure-color: ${card.color}; --measure-border: ${colorAlpha(card.color, 0.26)};"
    >
      <div class="assessment-metric-topline">
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-wide">${escapeHtml(card.label)}</p>
          <p class="mt-1 text-lg font-bold text-slate-700">${escapeHtml(card.value)}</p>
          <p class="mt-1 text-xs leading-5 text-slate-500">${escapeHtml(card.note)}</p>
          <p class="metric-signal-text mt-2">${escapeHtml(signal.label)}</p>
        </div>
        <span class="assessment-band-code">${escapeHtml(card.shortLabel)}</span>
      </div>
      <details class="assessment-detail-drawer" ${detailOpen ? "open" : ""}>
        <summary class="assessment-detail-toggle">See statistics + chart</summary>
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
            <p>Qualified sales are not spread evenly across local comparison groups. This shows how much of the class study is coming from each ${escapeHtml(groupKind)}.</p>
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

function renderMarketNarrative(selected, summary, classStats, medianRange, isParcelGroup = true) {
  const narrative = document.getElementById("marketNarrative");
  if (!narrative) return;
  narrative.textContent = marketAreaSignal(selected, summary, classStats, medianRange, isParcelGroup);
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

function priceBandStudyForClass(padRatioData, classKey = "residential", marketPositionData = null) {
  const studyKey = priceBandStudyKeyForClass(classKey);

  if (studyKey === "residential" || !padRatioData.priceBandStudies?.[studyKey]) {
    return {
      key: "residential",
      label: "Residential sale-price bands",
      description: "Sale-price ranges show where qualified residential sales are concentrated and whether the study is based mostly on lower-, middle-, or higher-priced properties.",
      chartNote: "Qualified sales by price band, including empty upper bands.",
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

  return Math.abs(point.median - medianCenter) <= medianPadding
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
    ? " The sales sample is small, so read the point with context."
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
      label: "Qualified sales",
      value: integer.format(selected.count),
      countyValue: integer.format(countywide.count)
    }
  ];

  container.innerHTML = rows.map(row => `
    <div
      class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200"
      role="group"
      aria-label="${escapeHtml(`${row.label}: ${row.value}. Countywide: ${row.countyValue}.`)}"
    >
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${escapeHtml(row.label)}</p>
      <p class="mt-1 text-2xl font-bold leading-tight text-slate-700">${escapeHtml(row.value)}</p>
      <p class="mt-2 text-xs leading-5 text-slate-500">Countywide: ${escapeHtml(row.countyValue)}</p>
    </div>
  `).join("");
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
          title: { display: true, text: "COD" },
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
  if (!marketAreaSelects.length || !baseClassStats?.groups?.length) return;

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
    const defaultListing = getSelectedMarketGroup(recordCard, classStats, defaultGroup);
    const groupName = defaultListing?.description || defaultListing?.label || recordCard.locationModel.valuationGroup;
    const groupNumber = defaultListing?.id ?? getParcelMarketGroupId(recordCard, classStats.classKey);
    const groupText = classStats.classKey === "agricultural"
      ? `This property is reviewed against ${groupName}.`
      : groupNumber
        ? `This property resides in the ${groupName} Valuation Group ${groupNumber}.`
        : `This property resides in the ${groupName} local comparison group.`;
    sourceNote.textContent = `${groupText} These local sales-study measures introduce the evidence used in the countywide equalization check.`;
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
    marketAreaSelects.forEach(select => {
      select.value = selected.id;
    });
    renderMarketSignalCards(selected, countywide, iaaoStandards, {
      ...signalContext,
      classStats
    });
    renderMarketGroupSalesDistribution(selected, classStats);
    renderMarketNarrative(selected, countywide, classStats, medianRange, isParcelGroup);
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

  const series = indexedSeries(data.taxpayerHistory, valueFactor, taxFactor);
  const contextualRows = data.taxpayerHistory.map(row => ({
    ...row,
    assessedValue: hasDataValue(row.assessedValue) ? row.assessedValue * valueFactor : null,
    taxes: hasDataValue(row.taxes) ? row.taxes * taxFactor : null
  }));

  new Chart(canvas, {
    type: "line",
    data: {
      labels: series.years,
      datasets: [
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
        },
        tooltip: {
          callbacks: {
            label: indexedTooltipLabel
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
      tooltipValues: formattedTooltipValues(rows, "totalValue", compactMoney),
      data: rows.map(row => (row.totalValue / baseValue) * 100),
      tension: 0.25,
      borderWidth: 3,
      borderColor: valueColor,
      backgroundColor: valueBg
    },
    {
      label: labels.tax,
      tooltipValues: formattedTooltipValues(rows, "taxesLevied", compactMoney),
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
        },
        tooltip: {
          callbacks: {
            label: indexedTooltipLabel
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
          borderColor: chartColors.contextRate,
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
  const rateColor = palette.rateColor ?? chartColors.contextRate;
  const rateBg = palette.rateBg ?? semanticChartColors.etrBg;
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

  buildIndexedOverviewChart("marketIndexedChart", data, { value: "Market area value", tax: "Market area tax bill" }, 0.96, 1.01);
  buildEtrOverviewChart("marketEtrChart", data, "Market area ETR", 0.98);

  buildCertifiedIndexedChart("countyIndexedChart", countyRows, { value: `${countyLabel} value`, tax: `${countyLabel} taxes levied` }, data.taxpayerHistory);
  buildCertifiedRateChart("countyEtrChart", countyRows, `${countyLabel} average tax rate`, data.taxpayerHistory);

  buildCertifiedIndexedChart("stateIndexedChart", stateRows, { value: "Statewide value", tax: "Statewide taxes levied" }, data.taxpayerHistory, {
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

function latestRow(rows) {
  return rows?.length ? rows.at(-1) : null;
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

function pressureTone(value) {
  if (value === null || value === undefined) return "neutral";
  if (value >= 105) return "high";
  if (value <= 95) return "low";
  return "neutral";
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
      label: `${primaryLabel} average rate comparison`,
      value: formatPressureIndex(primaryPressure),
      note: pressureNote(primaryPressure),
      tone: pressureTone(primaryPressure)
    },
    {
      label: `${comparisonLabel} average rate comparison`,
      value: formatPressureIndex(comparisonPressure),
      note: comparisonLabel === "Statewide" ? "Nebraska's average tax rate is indexed to 100." : pressureNote(comparisonPressure),
      tone: comparisonLabel === "Statewide" ? "neutral" : pressureTone(comparisonPressure)
    },
    {
      label: `${primaryLabel} growth`,
      value: `${formatChange(indexChange(primaryRows, "totalValue"))} value`,
      note: `${formatChange(indexChange(primaryRows, "taxesLevied"))} taxes levied.`
    },
    {
      label: `${comparisonLabel} growth`,
      value: `${formatChange(indexChange(comparisonRows, "totalValue"))} value`,
      note: `${formatChange(indexChange(comparisonRows, "taxesLevied"))} taxes levied.`
    }
  ];

  container.innerHTML = cards.map(card => `
    <div class="pressure-card pressure-card-${card.tone ?? "neutral"}">
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

  document.getElementById("countyComparisonIndexedNote").textContent = `${primaryLabel} is compared with ${comparisonLabel}, indexed to ${years[0]}.`;
  document.getElementById("countyComparisonRateNote").textContent = `${primaryLabel} and ${comparisonLabel} average CTL tax rates.`;
  renderCountyComparisonSummary(primaryRows, comparisonRows, statewideRows, primaryLabel, comparisonLabel);

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
        legend: { display: !hasIndexedLegend },
        tooltip: {
          callbacks: {
            label: indexedTooltipLabel
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
        label: "Statewide value growth",
        value: formatChange(indexChange(stateRows, "totalValue")),
        note: "Total certified value growth since 2019.",
        color: semanticChartColors.value,
        bg: semanticChartColors.valueSoft,
        ring: semanticChartColors.valueRing
      },
      {
        label: "Statewide tax growth",
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

function latestFinalTaxAmount(data) {
  const finalYear = data.latestFinalTaxYear;
  const finalRow = data.taxpayerHistory?.find(row =>
    row.year === finalYear && hasDataValue(row.taxes)
  );

  return finalRow?.taxes
    ?? data.snapshotModel?.viewModels?.taxes?.latestFinalTax
    ?? null;
}

export function buildDistributionChart(data, schoolDistrictColors) {
  const grouped = groupLevy(data.latestFinalLevyComponents);
  const total = Object.values(grouped).reduce((sum, value) => sum + value, 0);
  const latestTaxesPaid = latestFinalTaxAmount(data);
  const schoolDistrictColor = findSchoolDistrictColor(data, schoolDistrictColors)?.map_color;
  const sorted = Object.entries(grouped)
    .map(([label, rate]) => ({
      label,
      rate,
      share: rate / total,
      paidAmount: hasDataValue(latestTaxesPaid) ? (rate / total) * latestTaxesPaid : null
    }))
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
    <div class="distribution-note-card">
      <div class="distribution-note-heading">
        <span class="distribution-note-label">
          <span class="h-2.5 w-2.5 rounded-full" style="background-color: ${levyColorForGroup(row.label, schoolDistrictColor)}"></span>
          <span class="font-semibold leading-5 text-slate-700">${row.label}</span>
        </span>
        <span class="distribution-note-amount">${hasDataValue(row.paidAmount) ? moneyCents.format(row.paidAmount) : "—"}</span>
      </div>
      <p class="mt-0.5 text-xs leading-4 text-slate-600">${percent.format(row.share)} of levy</p>
    </div>
  `).join("");
}
