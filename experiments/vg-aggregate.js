const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
const DEFAULT_GROUP_KEY = "residential::3 - beatrice & beatrice subs";
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 2 });

let allRecords = [];
let groups = [];

const elements = {
  groupSelect: document.getElementById("groupSelect"),
  propertyCount: document.getElementById("propertyCount"),
  historyCoverage: document.getElementById("historyCoverage"),
  valueIndex: document.getElementById("valueIndex"),
  valueChange: document.getElementById("valueChange"),
  taxIndex: document.getElementById("taxIndex"),
  taxChange: document.getElementById("taxChange"),
  etrLatest: document.getElementById("etrLatest"),
  etrChange: document.getElementById("etrChange"),
  chartTitle: document.getElementById("chartTitle"),
  chartNote: document.getElementById("chartNote"),
  aggregateRows: document.getElementById("aggregateRows"),
  propertyRows: document.getElementById("propertyRows"),
  sampleNote: document.getElementById("sampleNote"),
  canvas: document.getElementById("trendChart")
};

function canonicalGroup(record) {
  const propertyClass = (
    record.guidedSnapshot?.classification?.propertyClass ||
    record.guidedSnapshot?.parcel?.accountType ||
    record.classification?.propertyClass ||
    record.parcel?.accountType ||
    "Property"
  ).trim();
  const rawGroup = (record.locationModel?.valuationGroup || record.locationModel?.marketArea || "Unassigned").trim();
  const normalizedGroup = rawGroup
    .replace(/^VG\s+/i, "")
    .replace(/\s+/g, " ");
  return {
    key: `${propertyClass.toLowerCase()}::${normalizedGroup.toLowerCase()}`,
    label: `${normalizedGroup} · ${propertyClass}`,
    groupLabel: normalizedGroup,
    propertyClass
  };
}

function byYear(record) {
  const history = new Map((record.guidedSnapshot?.taxpayerHistory || [])
    .map(row => [Number(row.year), row]));
  const statements = new Map((record.guidedSnapshot?.taxStatements || [])
    .map(statement => [Number(statement.taxYear), statement]));
  return YEARS.map(year => {
    const row = history.get(year);
    const statement = statements.get(year);
    const value = Number(row?.assessedValue);
    const netTax = Number(row?.taxes);
    const grossTax = Number(statement?.grossTaxAmount);
    const homesteadCredit = Number(statement?.credits?.homestead?.amount);
    const totalCredit = Number(statement?.derived?.totalCreditAmount);
    return {
      year,
      value: Number.isFinite(value) ? value : null,
      netTax: Number.isFinite(netTax) && netTax > 0 ? netTax : null,
      grossTax: Number.isFinite(grossTax) ? grossTax : null,
      homesteadCredit: Number.isFinite(homesteadCredit) ? homesteadCredit : 0,
      totalCredit: Number.isFinite(totalCredit) ? totalCredit : null,
      etr: Number.isFinite(value) && value > 0 && Number.isFinite(netTax) && netTax > 0 ? netTax / value : null
    };
  });
}

function indexedSeries(rows, field) {
  const baseline = rows.find(row => row.year === 2019)?.[field];
  if (!baseline || baseline <= 0) return null;
  return rows.map(row => ({
    year: row.year,
    value: row[field] === null || row[field] === undefined ? null : (row[field] / baseline) * 100
  }));
}

function mean(values) {
  const usable = values.filter(Number.isFinite);
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : null;
}

function median(values) {
  const usable = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!usable.length) return null;
  const middle = Math.floor(usable.length / 2);
  return usable.length % 2 ? usable[middle] : (usable[middle - 1] + usable[middle]) / 2;
}

function changeText(indexValue) {
  if (!Number.isFinite(indexValue)) return "No 2019 baseline";
  const change = indexValue - 100;
  const sign = change >= 0 ? "+" : "";
  return `${sign}${decimal.format(change)}% since 2019`;
}

function recordLabel(record) {
  const address = (
    record.guidedSnapshot?.parcel?.situsAddress ||
    record.guidedSnapshot?.parcel?.parcelId ||
    record.parcel?.situsAddress ||
    record.parcel?.parcelId ||
    "Property"
  );
  return address.replace(/^0+/, "") || address;
}

function taxSampleFlag(rows) {
  const flags = new Set();
  rows.forEach(row => {
    if (row.value > 0 && row.grossTax > 0 && (row.netTax === null || row.netTax <= row.grossTax * 0.25)) {
      flags.add("excessive credits or near-zero net tax");
    }
    if (row.homesteadCredit < 0) {
      flags.add("homestead credit");
    }
    if (row.value > 0 && row.netTax === null) {
      flags.add("missing or zero net tax");
    }
  });

  return {
    excludedFromTaxSample: flags.size > 0,
    reasons: [...flags]
  };
}

function computeGroup(records) {
  const preparedRecords = records.map(record => {
    const rows = byYear(record);
    const taxFlag = taxSampleFlag(rows);
    return {
      record,
      rows,
      valueIndex: indexedSeries(rows, "value"),
      taxIndex: taxFlag.excludedFromTaxSample ? null : indexedSeries(rows, "netTax"),
      taxFlag
    };
  });

  const aggregate = YEARS.map(year => {
    const valueIndexes = preparedRecords
      .filter(item => item.valueIndex)
      .map(item => item.valueIndex.find(row => row.year === year)?.value)
      .filter(Number.isFinite);
    const taxIndexes = preparedRecords
      .filter(item => item.taxIndex)
      .map(item => item.taxIndex.find(row => row.year === year)?.value)
      .filter(Number.isFinite);
    const etrs = preparedRecords
      .map(item => item.rows.find(row => row.year === year)?.etr)
      .filter(Number.isFinite);
    return {
      year,
      avgValueIndex: mean(valueIndexes),
      medianValueIndex: median(valueIndexes),
      avgTaxIndex: mean(taxIndexes),
      medianTaxIndex: median(taxIndexes),
      avgEtr: mean(etrs)
    };
  });

  return {
    preparedRecords,
    aggregate,
    valueBaselineCount: preparedRecords.filter(item => item.valueIndex).length,
    taxBaselineCount: preparedRecords.filter(item => item.taxIndex).length,
    taxFlagCount: preparedRecords.filter(item => item.taxFlag.excludedFromTaxSample).length
  };
}

function drawChart(aggregate) {
  const canvas = elements.canvas;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const pad = { left: 72, right: 36, top: 36, bottom: 62 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const indexValues = aggregate.flatMap(row => [
    row.medianValueIndex,
    row.medianTaxIndex
  ]).filter(Number.isFinite);
  if (!indexValues.length) {
    ctx.fillStyle = "#526780";
    ctx.font = "18px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("No indexed history is available for this group yet.", width / 2, height / 2);
    return;
  }
  const minIndex = Math.min(80, Math.floor(Math.min(...indexValues) / 10) * 10);
  const maxIndex = Math.max(140, Math.ceil(Math.max(...indexValues) / 10) * 10);

  const x = year => pad.left + ((year - YEARS[0]) / (YEARS.at(-1) - YEARS[0])) * plotW;
  const yIndex = value => pad.top + (1 - ((value - minIndex) / (maxIndex - minIndex))) * plotH;

  ctx.strokeStyle = "#d7e0ea";
  ctx.lineWidth = 1;
  ctx.font = "14px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#526780";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let tick = minIndex; tick <= maxIndex; tick += 10) {
    const y = yIndex(tick);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    ctx.fillText(`${tick}`, pad.left - 12, y);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  YEARS.forEach(year => {
    ctx.fillText(String(year), x(year), height - pad.bottom + 20);
  });

  ctx.save();
  ctx.translate(20, pad.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("Index, 2019 = 100", 0, 0);
  ctx.restore();

  const drawLine = (points, key, color) => {
    const usablePoints = points.filter(point => Number.isFinite(point[key]));
    if (!usablePoints.length) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    ctx.beginPath();
    const plotted = usablePoints.map(point => ({
      x: x(point.year),
      y: yIndex(point[key])
    }));
    ctx.moveTo(plotted[0].x, plotted[0].y);
    for (let index = 0; index < plotted.length - 1; index += 1) {
      const previous = plotted[index - 1] || plotted[index];
      const current = plotted[index];
      const next = plotted[index + 1];
      const afterNext = plotted[index + 2] || next;
      const cp1 = {
        x: current.x + (next.x - previous.x) / 6,
        y: current.y + (next.y - previous.y) / 6
      };
      const cp2 = {
        x: next.x - (afterNext.x - current.x) / 6,
        y: next.y - (afterNext.y - current.y) / 6
      };
      ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, next.x, next.y);
    }
    ctx.stroke();
    usablePoints.forEach(point => {
      ctx.beginPath();
      ctx.arc(x(point.year), yIndex(point[key]), 5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  drawLine(aggregate, "medianValueIndex", "#2f7d55");
  drawLine(aggregate, "medianTaxIndex", "#b23a3a");
}

function sparklinePath(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const commands = [`M ${points[0].x} ${points[0].y}`];
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] || points[index];
    const current = points[index];
    const next = points[index + 1];
    const afterNext = points[index + 2] || next;
    const cp1 = {
      x: current.x + (next.x - previous.x) / 6,
      y: current.y + (next.y - previous.y) / 6
    };
    const cp2 = {
      x: next.x - (afterNext.x - current.x) / 6,
      y: next.y - (afterNext.y - current.y) / 6
    };
    commands.push(`C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${next.x} ${next.y}`);
  }
  return commands.join(" ");
}

function renderKpiSparkline(name, values, options = {}) {
  const svg = document.querySelector(`[data-sparkline="${name}"]`);
  if (!svg) return;
  const line = svg.querySelector(".spark-line");
  const area = svg.querySelector(".spark-area");
  const usable = values
    .map((value, index) => ({ value, index }))
    .filter(item => Number.isFinite(item.value));

  if (usable.length < 2) {
    line.setAttribute("d", "");
    area.setAttribute("d", "");
    return;
  }

  const width = 320;
  const height = 120;
  const top = 14;
  const bottom = 118;
  const anchorValue = options.anchorValue;
  const anchorY = options.anchorY ?? 44;
  const valuesOnly = usable.map(item => item.value);
  const min = Number.isFinite(options.minValue) ? options.minValue : Math.min(...valuesOnly);
  const max = Number.isFinite(options.maxValue) ? options.maxValue : Math.max(...valuesOnly);
  const hasAnchor = Number.isFinite(anchorValue);
  const belowAnchor = hasAnchor ? Math.max(anchorValue - min, 0) : 0;
  const aboveAnchor = hasAnchor ? Math.max(max - anchorValue, 0) : 0;
  const unitsPerPixel = hasAnchor && !options.splitAnchorScale
    ? Math.max(
      aboveAnchor / Math.max(anchorY - top, 1),
      belowAnchor / Math.max(bottom - anchorY, 1),
      1
    )
    : ((max - min) || 1) / (bottom - top);
  const yForValue = value => {
    if (hasAnchor && options.splitAnchorScale) {
      if (value >= anchorValue) {
        const upwardSpread = aboveAnchor || 1;
        return anchorY - ((value - anchorValue) / upwardSpread) * (anchorY - top);
      }
      const downwardSpread = belowAnchor || 1;
      return anchorY + ((anchorValue - value) / downwardSpread) * (bottom - anchorY);
    }
    if (hasAnchor) return anchorY - ((value - anchorValue) / unitsPerPixel);
    return top + (1 - ((value - min) / ((max - min) || 1))) * (bottom - top);
  };
  const points = usable.map(item => ({
    x: usable.length === 1 ? width : (item.index / (YEARS.length - 1)) * width,
    y: yForValue(item.value)
  }));
  const linePath = sparklinePath(points);
  const first = points[0];
  const last = points.at(-1);

  line.setAttribute("d", linePath);
  area.setAttribute("d", `${linePath} L ${last.x} ${height} L ${first.x} ${height} Z`);
}

function renderKpiSparklines(aggregate) {
  const indexValues = aggregate.flatMap(row => [
    row.medianValueIndex,
    row.medianTaxIndex
  ]).filter(Number.isFinite);
  const minIndex = indexValues.length ? Math.min(80, Math.floor(Math.min(...indexValues) / 10) * 10) : 80;
  const maxIndex = indexValues.length ? Math.max(140, Math.ceil(Math.max(...indexValues) / 10) * 10) : 140;
  const indexScaleOptions = { minValue: minIndex, maxValue: maxIndex };
  renderKpiSparkline("value", aggregate.map(row => row.medianValueIndex), indexScaleOptions);
  renderKpiSparkline("tax", aggregate.map(row => row.medianTaxIndex), indexScaleOptions);
  renderKpiSparkline("etr", aggregate.map(row => row.avgEtr));
}

function render(groupKey) {
  const group = groups.find(item => item.key === groupKey) || groups[0];
  const records = allRecords.filter(item => item.group.key === group.key).map(item => item.record);
  const { preparedRecords, aggregate, valueBaselineCount, taxBaselineCount, taxFlagCount } = computeGroup(records);
  const latest = aggregate.at(-1);
  const first = aggregate[0];

  elements.groupSelect.value = group.key;
  elements.propertyCount.textContent = String(records.length);
  elements.historyCoverage.textContent = `${valueBaselineCount} value baselines, ${taxBaselineCount} tax baselines, ${taxFlagCount} tax flags`;
  elements.valueIndex.textContent = Number.isFinite(latest?.medianValueIndex) ? decimal.format(latest.medianValueIndex) : "—";
  elements.valueChange.textContent = changeText(latest?.medianValueIndex);
  elements.taxIndex.textContent = Number.isFinite(latest?.medianTaxIndex) ? decimal.format(latest.medianTaxIndex) : "—";
  elements.taxChange.textContent = changeText(latest?.medianTaxIndex);
  elements.etrLatest.textContent = Number.isFinite(latest?.avgEtr) ? percent.format(latest.avgEtr) : "—";
  elements.etrChange.textContent = Number.isFinite(first?.avgEtr) && Number.isFinite(latest?.avgEtr)
    ? `${((latest.avgEtr - first.avgEtr) * 100).toFixed(2)} pts since 2019`
    : "latest year";
  elements.chartTitle.textContent = `${group.label}: value and tax movement`;
  elements.chartNote.textContent = `${records.length} loaded properties are indexed to their own 2019 baselines where available. The tax line excludes records flagged for homestead, excessive credits, or near-zero net tax.`;
  elements.sampleNote.textContent = `${group.label}. This is a small local static sample, not a statistical study.`;

  if (!records.length || (!valueBaselineCount && !taxBaselineCount)) {
    elements.aggregateRows.innerHTML = `<tr><td colspan="6"><div class="empty-state">No records in this group have a complete 2019 baseline.</div></td></tr>`;
    elements.propertyRows.innerHTML = `<tr><td colspan="6"><div class="empty-state">No loaded sample records for this group yet.</div></td></tr>`;
    drawChart([]);
    renderKpiSparklines([]);
    return;
  }

  elements.aggregateRows.innerHTML = aggregate.map(row => `
    <tr>
      <td>${row.year}</td>
      <td>${Number.isFinite(row.avgValueIndex) ? decimal.format(row.avgValueIndex) : "—"}</td>
      <td>${Number.isFinite(row.medianValueIndex) ? decimal.format(row.medianValueIndex) : "—"}</td>
      <td>${Number.isFinite(row.avgTaxIndex) ? decimal.format(row.avgTaxIndex) : "—"}</td>
      <td>${Number.isFinite(row.medianTaxIndex) ? decimal.format(row.medianTaxIndex) : "—"}</td>
      <td>${Number.isFinite(row.avgEtr) ? percent.format(row.avgEtr) : "—"}</td>
    </tr>
  `).join("");

  elements.propertyRows.innerHTML = preparedRecords.map(item => {
    const row2019 = item.rows.find(row => row.year === 2019);
    const row2025 = item.rows.find(row => row.year === 2025);
    const valueIndex = item.valueIndex?.find(row => row.year === 2025)?.value;
    const taxIndex = item.taxIndex?.find(row => row.year === 2025)?.value;
    const taxFlag = item.taxFlag.excludedFromTaxSample
      ? `<span class="sample-flag">${item.taxFlag.reasons.join("; ")}</span>`
      : `<span class="sample-ok">included</span>`;
    return `
      <tr>
        <td>${recordLabel(item.record)}</td>
        <td>${money.format(row2019?.value || 0)}</td>
        <td>${money.format(row2025?.value || 0)}</td>
        <td>${Number.isFinite(valueIndex) ? decimal.format(valueIndex) : "—"}</td>
        <td>${Number.isFinite(taxIndex) ? decimal.format(taxIndex) : "—"}</td>
        <td>${taxFlag}</td>
      </tr>
    `;
  }).join("");

  drawChart(aggregate);
  renderKpiSparklines(aggregate);
}

async function loadRecords() {
  const manifest = await fetch("../data/app/property-manifest.json").then(response => response.json());
  const gageProperties = manifest.properties.filter(item => item.county === "gage" && item.recordCardStatus === "available");
  const loaded = await Promise.all(gageProperties.map(async property => {
    const record = await fetch(`../${property.recordCardPath}`).then(response => response.json());
    return { property, record, group: canonicalGroup(record) };
  }));
  return loaded;
}

function setupGroupSelect() {
  const groupMap = new Map();
  allRecords.forEach(item => {
    const existing = groupMap.get(item.group.key);
    if (existing) existing.count += 1;
    else groupMap.set(item.group.key, { ...item.group, count: 1 });
  });
  groups = [...groupMap.values()].sort((a, b) => {
    if (a.key === DEFAULT_GROUP_KEY) return -1;
    if (b.key === DEFAULT_GROUP_KEY) return 1;
    return a.label.localeCompare(b.label);
  });
  elements.groupSelect.innerHTML = groups.map(group => `
    <option value="${group.key}">${group.label} (${group.count})</option>
  `).join("");
  elements.groupSelect.addEventListener("change", () => render(elements.groupSelect.value));
}

async function main() {
  allRecords = await loadRecords();
  setupGroupSelect();
  render(groups.find(group => group.key === DEFAULT_GROUP_KEY)?.key || groups[0]?.key);
}

main().catch(error => {
  document.body.innerHTML = `<pre>${error.stack || error.message}</pre>`;
});
