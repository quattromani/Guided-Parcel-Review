import { percent } from "../format.js";
import { visualizationTheme } from "../config/visualization-palettes.js";

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

function sheetRows(contextData, key) {
  return contextData.sheets?.[key]?.rows ?? [];
}

function findMetric(rows, metric, subgroup = "County") {
  return rows.find(row => row.metric === metric && (!subgroup || row.subgroup === subgroup));
}

function formatNumberWithDecimals(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(number) ? 0 : 2
  }).format(number);
}

function formatContextValue(row) {
  if (!row) return "—";
  if (typeof row.value === "string") return row.value;
  if (row.unit === "$") return wholeMoney.format(row.value);
  if (row.unit === "%") return percent.format(row.value);
  if (row.unit === "people" || row.unit === "count") return integer.format(row.value);
  if (row.unit) return `${formatNumberWithDecimals(row.value)} ${row.unit}`;
  return formatNumberWithDecimals(row.value);
}

function formatCardValue(row) {
  if (!row) return { value: "—", note: "" };
  if (typeof row.value === "string") return { value: row.value, note: row.unit ?? "" };
  if (row.unit === "$") return { value: wholeMoney.format(row.value), note: row.dataYear ?? row.year ?? "" };
  if (row.unit === "%") return { value: percent.format(row.value), note: row.dataYear ?? row.year ?? "" };
  if (row.unit === "people" || row.unit === "count") return { value: integer.format(row.value), note: row.dataYear ?? row.year ?? "" };
  if (row.unit) return { value: formatNumberWithDecimals(row.value), note: `${row.unit} • ${row.dataYear ?? row.year ?? ""}` };
  return { value: formatNumberWithDecimals(row.value), note: row.dataYear ?? row.year ?? "" };
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
        borderColor: visualizationTheme.neutrals.surface,
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
        borderColor: visualizationTheme.colors.secondary,
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
        borderColor: visualizationTheme.colors.secondary,
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
