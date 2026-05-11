import { calculateEtr, groupLevy, percent } from "./format.js";

const levyGroupColors = {
  School: "#fb923c",
  City: "#1b1b1b",
  County: "#4ade80",
  "Natural resources": "#3b82f6",
  "Education service": "#a78bfa",
  "Community college": "#14b8a6",
  Other: "#94a3b8"
};

const chartColors = {
  contextValue: "#2563eb",
  contextTax: "#f43f5e",
  propertyValue: "#64748b",
  propertyTax: "#fda4af",
  propertyRate: "#64748b",
  lov: "#0f766e",
  cod: "#1d4ed8",
  prd: "#ef4444",
  cov: "#73a35b",
  target: "#6b7280"
};

let assessmentAccuracyChart;
let countyComparisonIndexedChart;
let countyComparisonRateChart;
let marketRatioChart;
let marketValueChart;
let marketSalePriceChart;

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

export function buildIndexedChart(data) {
  const usableValueRows = data.taxpayerHistory.filter(row => row.assessedValue !== null);
  const usableTaxRows = data.taxpayerHistory.filter(row => row.taxes !== null);
  const years = data.taxpayerHistory.map(row => row.year);
  const baseValue = usableValueRows[0]?.assessedValue;
  const baseTaxes = usableTaxRows[0]?.taxes;

  document.getElementById("baseYearNote").textContent = `Base year: ${usableValueRows[0]?.year ?? "—"}`;

  const valueIndex = data.taxpayerHistory.map(row => row.assessedValue && baseValue ? (row.assessedValue / baseValue) * 100 : null);
  const taxIndex = data.taxpayerHistory.map(row => row.taxes && baseTaxes ? (row.taxes / baseTaxes) * 100 : null);

  new Chart(document.getElementById("indexedChart"), {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label: "Assessed value index",
          data: valueIndex,
          tension: 0.25,
          borderWidth: 3,
          borderColor: chartColors.contextValue,
          backgroundColor: "rgba(37, 99, 235, 0.18)",
          spanGaps: true
        },
        {
          label: "Tax bill index",
          data: taxIndex,
          tension: 0.25,
          borderWidth: 3,
          borderColor: chartColors.contextTax,
          backgroundColor: "rgba(244, 63, 94, 0.18)",
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

function levelOfValueFit(record, classKey) {
  const target = getLovTarget(classKey);
  if (!record.levelOfValue || !target) return null;
  const ratio = record.levelOfValue / target;
  return Math.max(ratio, 1 / ratio);
}

function formatSignedChange(value, digits = 2) {
  if (value === null || value === undefined) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(digits)}`;
}

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
    ["Level of value", `${latest.levelOfValue.toFixed(2)}%`, `Target: ${target}%`],
    ["COD", latest.cod.toFixed(2), `${formatSignedChange(selectedClass.summary.codChangeSince2025)} from 2025`],
    ["PRD", latest.prd.toFixed(3), `${formatSignedChange(selectedClass.summary.prdDistanceChangeSince2025, 3)} distance from 2025`],
    ["COV", latest.cov.toFixed(2), `${formatSignedChange(selectedClass.summary.covChangeSince2025)} from 2025`]
  ];

  summary.innerHTML = cards.map(([label, value, note]) => `
    <div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</p>
      <p class="mt-1 text-lg font-bold text-slate-950">${value}</p>
      <p class="mt-1 text-xs leading-5 text-slate-500">${note}</p>
    </div>
  `).join("");
}

function renderAssessmentRows(selectedClass) {
  const table = document.getElementById("assessmentMeasureRows");
  if (!table) return;

  table.innerHTML = getAssessmentDisplayRecords(selectedClass).slice().reverse().map(row => `
    <tr>
      <td class="px-3 py-2 font-medium text-slate-950">${row.year}</td>
      <td class="px-3 py-2 text-right">${row.sales}</td>
      <td class="px-3 py-2 text-right">${row.levelOfValue.toFixed(2)}%</td>
      <td class="px-3 py-2 text-right">${row.cod.toFixed(2)}</td>
      <td class="px-3 py-2 text-right">${row.prd.toFixed(3)}</td>
      <td class="px-3 py-2 text-right">${row.cov.toFixed(2)}</td>
    </tr>
  `).join("");
}

function renderAssessmentAccuracyChart(selectedClass) {
  const canvas = document.getElementById("assessmentAccuracyChart");
  if (!canvas) return;

  const records = getAssessmentDisplayRecords(selectedClass);
  const labels = records.map(row => row.year);
  const datasets = [
    {
      label: "LOV fit",
      data: records.map(row => levelOfValueFit(row, selectedClass.key)),
      tension: 0.25,
      borderWidth: 3,
      borderColor: chartColors.lov,
      backgroundColor: "rgba(37, 99, 235, 0.12)"
    },
    {
      label: "COD uniformity",
      data: records.map(row => row.codNormalized),
      tension: 0.25,
      borderWidth: 3,
      borderColor: chartColors.cod,
      backgroundColor: "rgba(29, 78, 216, 0.12)"
    },
    {
      label: "PRD price-level fairness",
      data: records.map(row => row.prdNormalized),
      tension: 0.25,
      borderWidth: 3,
      borderColor: chartColors.prd,
      backgroundColor: "rgba(239, 68, 68, 0.12)"
    },
    {
      label: "COV reliability",
      data: records.map(row => row.covNormalized),
      tension: 0.25,
      borderWidth: 3,
      borderColor: chartColors.cov,
      backgroundColor: "rgba(115, 163, 91, 0.12)"
    },
    {
      label: "Target",
      data: records.map(() => 1),
      tension: 0,
      borderWidth: 3,
      borderColor: chartColors.target,
      backgroundColor: "rgba(107, 114, 128, 0.1)",
      borderDash: [8, 6],
      pointRadius: 0
    }
  ];
  const maxValue = Math.max(...datasets.flatMap(dataset => dataset.data.filter(value => value !== null && value !== undefined)));

  assessmentAccuracyChart?.destroy();
  assessmentAccuracyChart = new Chart(canvas, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        tooltip: {
          callbacks: {
            label: context => `${context.dataset.label}: ${context.parsed.y?.toFixed(2) ?? "—"}`
          }
        }
      },
      scales: {
        y: {
          title: { display: true, text: "Distance from target" },
          suggestedMin: 0,
          suggestedMax: Math.max(2, Math.ceil(maxValue + 0.5))
        }
      }
    }
  });
}

function renderAssessmentClass(selectedClass) {
  renderAssessmentSummary(selectedClass);
  renderAssessmentRows(selectedClass);
  renderAssessmentAccuracyChart(selectedClass);
}

export function initAssessmentRatioAnalysis(data, ratioData) {
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
      button.classList.toggle("bg-slate-950", active);
      button.classList.toggle("text-white", active);
      button.classList.toggle("text-slate-600", !active);
      button.classList.toggle("hover:bg-white", !active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderAssessmentClass(selectedClass);
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

function propertyIndexedDatasets(propertyRows, years) {
  const propertyByYear = rowsByYear(propertyRows);
  const alignedRows = years.map(year => propertyByYear.get(year) ?? { year, assessedValue: null, taxes: null });
  const series = indexedSeries(alignedRows);

  return [
    {
      label: "This property value index",
      data: series.valueIndex,
      tension: 0.25,
      borderWidth: 2,
      borderColor: chartColors.propertyValue,
      backgroundColor: "rgba(100, 116, 139, 0.12)",
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
      borderColor: chartColors.propertyTax,
      backgroundColor: "rgba(253, 164, 175, 0.14)",
      borderDash: [6, 5],
      pointRadius: 3,
      pointStyle: "circle",
      spanGaps: true
    }
  ];
}

function propertyRateDataset(propertyRows, years) {
  const propertyByYear = rowsByYear(propertyRows);

  return {
    label: "This property ETR",
    data: years.map(year => {
      const row = propertyByYear.get(year);
      const etr = row ? calculateEtr(row) : null;
      return etr === null ? null : etr * 100;
    }),
    tension: 0.25,
    borderWidth: 2,
    borderColor: chartColors.propertyRate,
    backgroundColor: "rgba(100, 116, 139, 0.12)",
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
        class="inline-block h-2.5 w-9 rounded-sm border-2"
        style="
          border-color: ${dataset.borderColor};
          background-color: ${dataset.backgroundColor};
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
    const marketGroupLabel = marketGroup ? `${marketGroup} market` : "";

    return {
      ...group,
      description,
      marketGroup,
      label: descriptiveLabel,
      optionLabel: marketGroupLabel ? `${descriptiveLabel} (${marketGroupLabel})` : descriptiveLabel,
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
      <p class="mt-1 text-lg font-bold text-slate-950">${value}</p>
      <p class="mt-1 text-xs leading-5 text-slate-500">${note}</p>
    </div>
  `).join("");
}

function renderMarketNarrative(selected, summary) {
  const narrative = document.getElementById("marketNarrative");
  if (!narrative) return;
  narrative.textContent = marketAreaSignal(selected, summary);
}

function renderMarketRows(groups, selectedGroup) {
  const table = document.getElementById("marketValuationGroupRows");
  if (!table) return;

  table.innerHTML = groups.map(row => {
    const active = String(row.group) === String(selectedGroup);
    return `
      <tr class="${active ? "bg-blue-50" : ""}">
        <td class="px-3 py-2 font-medium text-slate-950">
          <span class="block">${row.label}</span>
          ${row.marketGroup ? `<span class="mt-0.5 block text-xs font-medium text-slate-500">${row.marketGroup}</span>` : ""}
          ${active ? `<span class="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Selected</span>` : ""}
        </td>
        <td class="px-3 py-2 text-right">${integer.format(row.count)}</td>
        <td class="px-3 py-2 text-right">${formatRatio(row.median)}</td>
        <td class="px-3 py-2 text-right">${formatRatio(row.weightedMean)}</td>
        <td class="px-3 py-2 text-right">${formatRatio(row.cod)}</td>
        <td class="px-3 py-2 text-right">${formatRatio(row.prd)}</td>
        <td class="px-3 py-2 text-right text-slate-600">${row.confidenceIntervalMedian}</td>
      </tr>
    `;
  }).join("");
}

function renderMarketSalePriceRows(padRatioData) {
  const table = document.getElementById("marketSalePriceRows");
  if (!table) return;

  const rows = padRatioData.salePriceRanges
    .filter(row => row.section === "Incremental Ranges");
  const totalRow = padRatioData.salePriceRanges
    .find(row => row.range === "ALL" || row.section === "All") ?? {
      count: padRatioData.summary.numberOfSales,
      median: padRatioData.summary.median,
      cod: padRatioData.summary.cod,
      prd: padRatioData.summary.prd,
      averageAdjustedSalePrice: padRatioData.summary.averageAdjustedSalePrice
    };

  const dataRows = rows.map(row => `
    <tr>
      <td class="px-2 py-2 font-medium text-slate-950">${row.range}</td>
      <td class="px-2 py-2 text-right">${integer.format(row.count)}</td>
      <td class="px-2 py-2 text-right">${row.count ? formatRatio(row.median) : "—"}</td>
      <td class="px-2 py-2 text-right">${row.count ? formatRatio(row.cod) : "—"}</td>
      <td class="px-2 py-2 text-right">${row.count ? formatRatio(row.prd) : "—"}</td>
      <td class="px-2 py-2 text-right">${row.count ? wholeMoney.format(row.averageAdjustedSalePrice) : "—"}</td>
    </tr>
  `).join("");
  const footerRow = totalRow ? `
    <tr class="bg-slate-950 font-semibold text-white">
      <td class="px-2 py-2">Total / average</td>
      <td class="px-2 py-2 text-right">${integer.format(totalRow.count)}</td>
      <td class="px-2 py-2 text-right">${formatRatio(totalRow.median)}</td>
      <td class="px-2 py-2 text-right">${formatRatio(totalRow.cod)}</td>
      <td class="px-2 py-2 text-right">${formatRatio(totalRow.prd)}</td>
      <td class="px-2 py-2 text-right">${wholeMoney.format(totalRow.averageAdjustedSalePrice)}</td>
    </tr>
  ` : "";

  table.innerHTML = dataRows + footerRow;
  renderMarketSalePriceChart(rows);
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

function renderMarketSalePriceChart(rows) {
  const canvas = document.getElementById("marketSalePriceChart");
  if (!canvas) return;

  marketSalePriceChart?.destroy();
  marketSalePriceChart = new Chart(canvas, {
    data: {
      labels: rows.map(row => shortPriceBandLabel(row.range)),
      datasets: [
        {
          type: "bar",
          label: "Sales",
          data: rows.map(row => row.count),
          backgroundColor: "rgba(37, 99, 235, 0.18)",
          borderColor: chartColors.contextValue,
          borderWidth: 2,
          borderRadius: 6,
          order: 2
        },
        {
          type: "line",
          label: "Distribution curve",
          data: rows.map(row => row.count),
          tension: 0.38,
          borderWidth: 3,
          borderColor: chartColors.contextTax,
          backgroundColor: "rgba(244, 63, 94, 0.12)",
          pointBackgroundColor: chartColors.contextTax,
          pointRadius: 3,
          fill: true,
          order: 1
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
          title: { display: true, text: "Qualified sales" },
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
          backgroundColor: "rgba(37, 99, 235, 0.24)",
          borderColor: chartColors.contextValue,
          borderWidth: 2
        },
        {
          label: "All Gage residential",
          data: [summary.median, summary.weightedMean, summary.mean, summary.prd],
          backgroundColor: "rgba(100, 116, 139, 0.16)",
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
          backgroundColor: "rgba(20, 184, 166, 0.28)",
          borderColor: "#14b8a6",
          borderWidth: 2
        },
        {
          label: "All Gage residential",
          data: [summary.averageAdjustedSalePrice, summary.averageAssessedValue],
          backgroundColor: "rgba(251, 146, 60, 0.24)",
          borderColor: "#fb923c",
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
    renderMarketRows(groups, selected.group);
    renderMarketRatioChart(selected, padRatioData.summary);
    renderMarketValueChart(selected, padRatioData.summary);
  };

  select.addEventListener("change", () => update(select.value));
  renderMarketSalePriceRows(padRatioData);
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
          backgroundColor: "rgba(37, 99, 235, 0.18)",
          spanGaps: true
        },
        {
          label: labels.tax,
          data: series.taxIndex,
          tension: 0.25,
          borderWidth: 3,
          borderColor: chartColors.contextTax,
          backgroundColor: "rgba(244, 63, 94, 0.18)",
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

function buildCertifiedIndexedChart(canvasId, rows, labels, propertyRows) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !rows?.length) return;

  const baseValue = rows[0].totalValue;
  const baseTaxes = rows[0].taxesLevied;
  const years = rows.map(row => row.year);
  const datasets = [
    {
      label: labels.value,
      data: rows.map(row => (row.totalValue / baseValue) * 100),
      tension: 0.25,
      borderWidth: 3,
      borderColor: chartColors.contextValue,
      backgroundColor: "rgba(37, 99, 235, 0.18)"
    },
    {
      label: labels.tax,
      data: rows.map(row => (row.taxesLevied / baseTaxes) * 100),
      tension: 0.25,
      borderWidth: 3,
      borderColor: chartColors.contextTax,
      backgroundColor: "rgba(244, 63, 94, 0.18)"
    },
    ...propertyIndexedDatasets(propertyRows, years)
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
          backgroundColor: "rgba(37, 99, 235, 0.18)",
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
          backgroundColor: "rgba(37, 99, 235, 0.18)",
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

function buildCertifiedRateChart(canvasId, rows, label, propertyRows) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !rows?.length) return;
  const years = rows.map(row => row.year);

  new Chart(canvas, {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label,
          data: rows.map(row => row.averageTaxRate * 100),
          tension: 0.25,
          borderWidth: 3,
          borderColor: chartColors.contextValue,
          backgroundColor: "rgba(37, 99, 235, 0.18)"
        },
        propertyRateDataset(propertyRows, years)
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
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

  buildCertifiedIndexedChart("stateIndexedChart", stateRows, { value: "Statewide value index", tax: "Statewide tax index" }, data.taxpayerHistory);
  buildCertifiedRateChart("stateEtrChart", stateRows, "Statewide average tax rate", data.taxpayerHistory);
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
      <p class="mt-1 text-lg font-bold text-slate-950">${value}</p>
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

  document.getElementById("countyComparisonIndexedNote").textContent = `${primaryLabel} is compared with ${comparisonLabel}, indexed to ${years[0]}.`;
  document.getElementById("countyComparisonRateNote").textContent = `${primaryLabel} and ${comparisonLabel} average CTL tax rates.`;
  renderCountyComparisonSummary(primaryRows, comparisonRows, primaryLabel, comparisonLabel);

  countyComparisonIndexedChart?.destroy();
  countyComparisonIndexedChart = new Chart(document.getElementById("countyComparisonIndexedChart"), {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label: `${primaryLabel} value index`,
          data: primaryIndex.value,
          tension: 0.25,
          borderWidth: 3,
          borderColor: chartColors.contextValue,
          backgroundColor: "rgba(37, 99, 235, 0.16)"
        },
        {
          label: `${primaryLabel} tax index`,
          data: primaryIndex.taxes,
          tension: 0.25,
          borderWidth: 3,
          borderColor: chartColors.contextTax,
          backgroundColor: "rgba(244, 63, 94, 0.16)"
        },
        {
          label: `${comparisonLabel} value index`,
          data: comparisonIndex.value,
          tension: 0.25,
          borderWidth: 2,
          borderColor: chartColors.propertyValue,
          backgroundColor: "rgba(100, 116, 139, 0.12)",
          borderDash: [6, 5]
        },
        {
          label: `${comparisonLabel} tax index`,
          data: comparisonIndex.taxes,
          tension: 0.25,
          borderWidth: 2,
          borderColor: chartColors.propertyTax,
          backgroundColor: "rgba(253, 164, 175, 0.14)",
          borderDash: [6, 5]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
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
      datasets: [
        {
          label: `${primaryLabel} average tax rate`,
          data: primaryRows.map(row => row.averageTaxRate * 100),
          tension: 0.25,
          borderWidth: 3,
          borderColor: chartColors.contextValue,
          backgroundColor: "rgba(37, 99, 235, 0.16)"
        },
        {
          label: `${comparisonLabel} average tax rate`,
          data: comparisonRows.map(row => row.averageTaxRate * 100),
          tension: 0.25,
          borderWidth: 2,
          borderColor: chartColors.propertyValue,
          backgroundColor: "rgba(100, 116, 139, 0.12)",
          borderDash: [6, 5]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
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

export function initCountyComparison(data, ctlData) {
  const select = document.getElementById("countyComparisonTarget");
  if (!select) return;

  const primaryCounty = getPropertyCountyName(data, ctlData);
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
        <p class="mt-1 text-lg font-bold text-slate-950">${value}</p>
      </div>
    `).join("");
  }

  const stateSummary = document.getElementById("stateCtlSummary");
  if (stateSummary) {
    stateSummary.innerHTML = [
      ["Value growth", formatChange(indexChange(stateRows, "totalValue"))],
      ["Tax growth", formatChange(indexChange(stateRows, "taxesLevied"))],
      ["Rate movement", `${(stateRows[0].averageTaxRate * 100).toFixed(2)}% to ${(stateRows.at(-1).averageTaxRate * 100).toFixed(2)}%`]
    ].map(([label, value]) => `
      <div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</p>
        <p class="mt-1 text-lg font-bold text-slate-950">${value}</p>
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
      <p class="mt-1 text-lg font-bold text-slate-950">${display.value}</p>
      <p class="mt-1 text-xs text-slate-500">${display.note}</p>
    </div>
  `;
  }).join("");
}

function buildCountyValueMixChart(contextData) {
  const canvas = document.getElementById("countyValueMixChart");
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

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: categories.map(row => row[0]),
      datasets: [{
        data: categories.map(row => row[1]),
        backgroundColor: ["#4ade80", "#2563eb", "#14b8a6", "#fb923c", "#94a3b8"],
        borderColor: "#ffffff",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: context => `${context.label}: ${compactMoney.format(context.parsed)}`
          }
        }
      }
    }
  });
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
        backgroundColor: ["#bfdbfe", "#60a5fa", "#1d4ed8"],
        borderColor: "#2563eb",
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
        backgroundColor: "#cbd5e1",
        borderColor: "#64748b",
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
        backgroundColor: ["#93c5fd", "#60a5fa", "#1d4ed8"],
        borderColor: "#2563eb",
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
      <td class="px-3 py-2 font-medium text-slate-950">${row.source}</td>
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

export function buildDistributionChart(data) {
  const grouped = groupLevy(data.latestFinalLevyComponents);
  const total = Object.values(grouped).reduce((sum, value) => sum + value, 0);
  const sorted = Object.entries(grouped)
    .map(([label, rate]) => ({ label, rate, share: rate / total }))
    .sort((a, b) => b.rate - a.rate);
  const labels = sorted.map(row => row.label);
  const values = sorted.map(row => row.rate);
  const colors = sorted.map(row => levyGroupColors[row.label] ?? "#94a3b8");

  new Chart(document.getElementById("distributionChart"), {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: "#ffffff",
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
    <div class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <div class="flex items-center gap-2">
        <span class="h-2.5 w-2.5 rounded-full" style="background-color: ${levyGroupColors[row.label] ?? "#94a3b8"}"></span>
        <p class="font-semibold text-slate-950">${row.label}</p>
      </div>
      <p class="text-slate-600">${percent.format(row.share)} of the total levy</p>
    </div>
  `).join("");
}
