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
        { label: "Assessed value index", data: valueIndex, tension: 0.25, borderWidth: 3, spanGaps: true },
        { label: "Tax bill index", data: taxIndex, tension: 0.25, borderWidth: 3, spanGaps: true }
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
        { label: "Effective tax rate", data: etrValues, tension: 0.25, borderWidth: 3, spanGaps: true }
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
