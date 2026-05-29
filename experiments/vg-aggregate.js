const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
const DEFAULT_GROUP_KEY = "residential::3 - beatrice & beatrice subs";
const SCENARIO_TARGETS = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30];
const NARROW_BAND = 0.025;
const WIDE_BAND = 0.05;
const MINIMUM_BAND_COUNT = 12;
const MODEL_LENSES = {
  stable: {
    label: "Stable parcel",
    note: "Stable parcel excludes zero/near-zero taxes, incomplete histories, heavy credit cases, very small tax bases, and extreme one-year swings."
  },
  realWorld: {
    label: "Real-world parcel",
    note: "Real-world parcel keeps ordinary remodel/new-improvement movement, while still excluding incomplete histories, zero taxes, and heavy credit cases."
  }
};
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 2 });

let allRecords = [];
let groups = [];
let activeProjectionObservations = [];
let samplingTracker = null;
let activeModelLens = "stable";

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
  canvas: document.getElementById("trendChart"),
  observationCount: document.getElementById("observationCount"),
  modelLensSelect: document.getElementById("modelLensSelect"),
  stableModelCount: document.getElementById("stableModelCount"),
  realWorldModelCount: document.getElementById("realWorldModelCount"),
  excludedModelCount: document.getElementById("excludedModelCount"),
  modelRuleNote: document.getElementById("modelRuleNote"),
  scenarioInput: document.getElementById("scenarioInput"),
  scenarioValue: document.getElementById("scenarioValue"),
  scenarioBandNote: document.getElementById("scenarioBandNote"),
  scenarioProjection: document.getElementById("scenarioProjection"),
  scenarioProjectionNote: document.getElementById("scenarioProjectionNote"),
  scenarioEtrResponse: document.getElementById("scenarioEtrResponse"),
  scenarioLevyChange: document.getElementById("scenarioLevyChange"),
  scenarioSampleSize: document.getElementById("scenarioSampleSize"),
  projectionRows: document.getElementById("projectionRows"),
  sensitivityCanvas: document.getElementById("sensitivityChart"),
  samplingSummary: document.getElementById("samplingSummary"),
  samplingGroupSelect: document.getElementById("samplingGroupSelect"),
  samplingRows: document.getElementById("samplingRows"),
  candidateNote: document.getElementById("candidateNote"),
  candidateRows: document.getElementById("candidateRows"),
  schoolLevySummary: document.getElementById("schoolLevySummary"),
  schoolLevyRows: document.getElementById("schoolLevyRows"),
  schoolLevyTotals: document.getElementById("schoolLevyTotals")
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

function schoolDistrictLabel(record) {
  return (record.guidedSnapshot?.parcel?.schoolDistrict
    || record.parcel?.schoolDistrict
    || "Unassigned school district");
}

function schoolDistrictDisplayLabel(value) {
  return String(value || "Unassigned school district")
    .replace(/^SCHOOL\s+/i, "SCH ");
}

function latestLevyComponents(record) {
  return (record.guidedSnapshot?.latestFinalLevyComponents || [])
    .filter(component => Number.isFinite(Number(component.rate)) || Number.isFinite(Number(component.amount)));
}

function isSchoolLevyComponent(component) {
  return `${component.group || ""}`.trim().toLowerCase() === "school"
    || /\b(sch|school)\b/i.test(component.description || "");
}

function sumNumber(values) {
  return values
    .map(Number)
    .filter(Number.isFinite)
    .reduce((sum, value) => sum + value, 0);
}

function average(values) {
  const usable = values.filter(Number.isFinite);
  if (!usable.length) return null;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

function schoolLevyCoverageRows() {
  const rowsByDistrict = new Map();
  allRecords.forEach(({ record, group }) => {
    const components = latestLevyComponents(record);
    const schoolComponents = components.filter(isSchoolLevyComponent);
    if (!schoolComponents.length) return;

    const totalRate = sumNumber(components.map(component => component.rate));
    const schoolRate = sumNumber(schoolComponents.map(component => component.rate));
    const totalAmount = sumNumber(components.map(component => component.amount));
    const schoolAmount = sumNumber(schoolComponents.map(component => component.amount));
    const schoolShare = totalAmount > 0
      ? (schoolAmount / totalAmount) * 100
      : totalRate > 0
        ? (schoolRate / totalRate) * 100
        : null;
    if (!Number.isFinite(schoolShare) || !Number.isFinite(schoolRate) || schoolRate <= 0) return;

    const schoolDistrict = schoolDistrictLabel(record);
    const className = group.propertyClass || record.propertyClass || "Property";
    const sample = {
      className,
      taxYear: record.guidedSnapshot?.latestFinalTaxYear
        || Math.max(...(record.guidedSnapshot?.taxStatements || []).map(statement => Number(statement.taxYear)).filter(Number.isFinite)),
      schoolComponents: schoolComponents.length,
      schoolRate,
      schoolShare
    };
    const row = rowsByDistrict.get(schoolDistrict) || {
      schoolDistrict,
      statsByClass: new Map(),
      schoolRates: [],
      schoolShares: []
    };
    const classStats = row.statsByClass.get(className) || { className, count: 0, schoolRates: [], schoolShares: [] };
    classStats.count += 1;
    classStats.schoolRates.push(sample.schoolRate);
    classStats.schoolShares.push(sample.schoolShare);
    row.statsByClass.set(className, classStats);
    row.schoolRates.push(schoolRate);
    row.schoolShares.push(schoolShare);
    rowsByDistrict.set(schoolDistrict, row);
  });

  return [...rowsByDistrict.values()]
    .map(row => {
      const classStats = [...row.statsByClass.values()]
        .map(stats => ({
          className: stats.className,
          count: stats.count,
          schoolRate: median(stats.schoolRates),
          schoolShare: median(stats.schoolShares)
        }))
        .sort((a, b) => propertyClassSort(a.className) - propertyClassSort(b.className));
      return {
        schoolDistrict: row.schoolDistrict,
        classStats,
        schoolRate: median(row.schoolRates),
        schoolShare: median(row.schoolShares)
      };
    })
    .sort((a, b) => (b.schoolRate - a.schoolRate) || a.schoolDistrict.localeCompare(b.schoolDistrict));
}

function propertyClassSort(className) {
  const normalized = String(className || "").toLowerCase();
  if (normalized.includes("residential")) return 1;
  if (normalized.includes("agricultural")) return 2;
  if (normalized.includes("commercial")) return 3;
  return 4;
}

function levyRateText(value) {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(6);
}

function schoolShareText(value) {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(1)}%`;
}

function schoolShareHeatStyle(value, scale = { min: 35, max: 70 }) {
  if (!Number.isFinite(value)) return "";
  const min = Number.isFinite(scale.min) ? scale.min : 35;
  const max = Number.isFinite(scale.max) && scale.max > min ? scale.max : min + 1;
  const clamped = Math.max(min, Math.min(max, value));
  const intensity = (clamped - min) / (max - min);
  const alpha = 0.08 + (intensity * 0.32);
  return `--school-share-heat: rgba(217, 119, 6, ${alpha.toFixed(3)});`;
}

function schoolShareScales(rows) {
  return ["Residential", "Agricultural", "Commercial"].reduce((scales, className) => {
    const values = rows
      .map(row => classStatFor(row, className)?.schoolShare)
      .filter(Number.isFinite);
    scales[className] = {
      min: values.length ? Math.min(...values) : null,
      max: values.length ? Math.max(...values) : null
    };
    return scales;
  }, {});
}

function classStatFor(row, className) {
  return row.classStats.find(stats => stats.className.toLowerCase() === className.toLowerCase()) || null;
}

function classShareCell(row, className, scale) {
  const stats = classStatFor(row, className);
  const style = stats ? ` style="${schoolShareHeatStyle(stats.schoolShare, scale)}"` : "";
  if (!stats) return `<td class="class-share-cell"><span class="class-share-empty">—</span></td>`;
  return `
    <td class="class-share-cell"${style}>
      <span class="class-share-value">${schoolShareText(stats.schoolShare)}</span>
      <span class="class-share-count">${stats.count} sample${stats.count === 1 ? "" : "s"}</span>
    </td>
  `;
}

function classTotals(rows, className) {
  const stats = rows.map(row => classStatFor(row, className)).filter(Boolean);
  const count = stats.reduce((sum, item) => sum + item.count, 0);
  return {
    count,
    schoolShare: average(stats.map(item => item.schoolShare))
  };
}

function classTotalCell(rows, className) {
  const totals = classTotals(rows, className);
  if (!totals.count) return `<span class="class-share-empty">—</span>`;
  return `
    <span class="class-share-value">${schoolShareText(totals.schoolShare)}</span>
    <span class="class-share-count">${totals.count} sample${totals.count === 1 ? "" : "s"}</span>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
    const derivedLevyRate = Number(statement?.derived?.grossLevyRate);
    const levyFromGross = Number.isFinite(value) && value > 0 && Number.isFinite(grossTax) && grossTax > 0
      ? grossTax / value
      : null;
    const levyRate = Number.isFinite(derivedLevyRate) && derivedLevyRate > 0
      ? derivedLevyRate
      : levyFromGross;
    return {
      year,
      value: Number.isFinite(value) ? value : null,
      netTax: Number.isFinite(netTax) && netTax > 0 ? netTax : null,
      grossTax: Number.isFinite(grossTax) ? grossTax : null,
      levyRate: Number.isFinite(levyRate) && levyRate > 0 ? levyRate : null,
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

function quantile(values, q) {
  const usable = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!usable.length) return null;
  if (usable.length === 1) return usable[0];
  const index = (usable.length - 1) * q;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return usable[lower] * (1 - weight) + usable[upper] * weight;
}

function percentChange(previous, next) {
  if (!Number.isFinite(previous) || previous <= 0 || !Number.isFinite(next)) return null;
  return (next / previous) - 1;
}

function signedPercent(value, digits = 1) {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(digits)}%`;
}

function plainPercent(value, digits = 1) {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
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

function baseModelReasons(rows) {
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
  if (!rows.every(row => row.value > 0 && row.netTax > 0 && row.etr > 0 && row.levyRate > 0)) {
    flags.add("incomplete 2019-2025 value/tax/levy history");
  }

  return flags;
}

function oneYearChanges(rows, field) {
  const changes = [];
  for (let index = 1; index < rows.length; index += 1) {
    const change = percentChange(rows[index - 1][field], rows[index][field]);
    if (Number.isFinite(change)) changes.push(change);
  }
  return changes;
}

function stableModelReasons(rows) {
  const flags = baseModelReasons(rows);
  const valueChanges = oneYearChanges(rows, "value");
  const taxChanges = oneYearChanges(rows, "netTax");
  const etrChanges = oneYearChanges(rows, "etr");
  const verySmallTaxBase = rows.some(row => row.value > 0 && row.value < 10000)
    || rows.some(row => row.netTax > 0 && row.netTax < 100);
  const extremeMovement = [...valueChanges, ...taxChanges, ...etrChanges]
    .some(change => Math.abs(change) > 0.75);

  if (verySmallTaxBase) flags.add("very small value/tax base");
  if (extremeMovement) flags.add("extreme one-year movement");

  return flags;
}

function modelSampleFlag(rows, lens = activeModelLens) {
  const flags = lens === "realWorld" ? baseModelReasons(rows) : stableModelReasons(rows);

  return {
    excludedFromModel: flags.size > 0,
    reasons: [...flags]
  };
}

function buildYearlyObservations(preparedRecords) {
  return preparedRecords.flatMap(item => {
    if (item.modelFlag.excludedFromModel) return [];
    const label = recordLabel(item.record);
    const observations = [];
    for (let index = 1; index < item.rows.length; index += 1) {
      const previous = item.rows[index - 1];
      const current = item.rows[index];
      const valueChange = percentChange(previous.value, current.value);
      const taxChange = percentChange(previous.netTax, current.netTax);
      const etrChange = percentChange(previous.etr, current.etr);
      const levyChange = percentChange(previous.levyRate, current.levyRate);
      if ([valueChange, taxChange, etrChange, levyChange].every(Number.isFinite)) {
        observations.push({
          propertyLabel: label,
          fromYear: previous.year,
          toYear: current.year,
          period: `${previous.year} → ${current.year}`,
          valueChange,
          taxChange,
          etrChange,
          levyChange,
          projectedTaxChange: ((1 + valueChange) * (1 + etrChange)) - 1
        });
      }
    }
    return observations;
  });
}

function bandLabel(target, tolerance) {
  const lower = Math.max(target - tolerance, -0.99);
  const upper = target + tolerance;
  return `${signedPercent(lower)} to ${signedPercent(upper)}`;
}

function confidenceLabel(count) {
  if (count >= 40) return "strong";
  if (count >= MINIMUM_BAND_COUNT) return "usable";
  if (count > 0) return "thin";
  return "empty";
}

function summarizeProjectionBand(observations, target) {
  let tolerance = NARROW_BAND;
  let matches = observations.filter(item => item.valueChange >= target - tolerance && item.valueChange < target + tolerance);
  if (matches.length < MINIMUM_BAND_COUNT) {
    tolerance = WIDE_BAND;
    matches = observations.filter(item => item.valueChange >= target - tolerance && item.valueChange < target + tolerance);
  }

  const medianEtrChange = median(matches.map(item => item.etrChange));
  const projectedTaxChange = Number.isFinite(medianEtrChange)
    ? ((1 + target) * (1 + medianEtrChange)) - 1
    : null;
  const taxChanges = matches.map(item => item.taxChange);

  return {
    target,
    tolerance,
    matches,
    count: matches.length,
    confidence: confidenceLabel(matches.length),
    bandLabel: bandLabel(target, tolerance),
    medianValueChange: median(matches.map(item => item.valueChange)),
    medianTaxChange: median(taxChanges),
    p25TaxChange: quantile(taxChanges, 0.25),
    p75TaxChange: quantile(taxChanges, 0.75),
    medianEtrChange,
    medianLevyChange: median(matches.map(item => item.levyChange)),
    projectedTaxChange
  };
}

function projectionRangeText(summary) {
  if (!Number.isFinite(summary.p25TaxChange) || !Number.isFinite(summary.p75TaxChange)) return "—";
  return `${signedPercent(summary.p25TaxChange)} to ${signedPercent(summary.p75TaxChange)}`;
}

function cohortCounts(records) {
  return records.reduce((counts, record) => {
    const rows = byYear(record);
    const stableFlag = modelSampleFlag(rows, "stable");
    const realWorldFlag = modelSampleFlag(rows, "realWorld");
    if (!stableFlag.excludedFromModel) counts.stable += 1;
    if (!realWorldFlag.excludedFromModel) counts.realWorld += 1;
    if (stableFlag.excludedFromModel) counts.excludedFromStable += 1;
    if (realWorldFlag.excludedFromModel) counts.excludedFromRealWorld += 1;
    return counts;
  }, { stable: 0, realWorld: 0, excludedFromStable: 0, excludedFromRealWorld: 0 });
}

function computeGroup(records, lens = activeModelLens) {
  const preparedRecords = records.map(record => {
    const rows = byYear(record);
    const modelFlag = modelSampleFlag(rows, lens);
    return {
      record,
      rows,
      valueIndex: indexedSeries(rows, "value"),
      taxIndex: modelFlag.excludedFromModel ? null : indexedSeries(rows, "netTax"),
      modelFlag
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

  const observations = buildYearlyObservations(preparedRecords);

  return {
    preparedRecords,
    aggregate,
    observations,
    valueBaselineCount: preparedRecords.filter(item => item.valueIndex).length,
    taxBaselineCount: preparedRecords.filter(item => item.taxIndex).length,
    taxFlagCount: preparedRecords.filter(item => item.modelFlag.excludedFromModel).length,
    counts: cohortCounts(records)
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

function drawSensitivityChart(observations, activeSummary) {
  const canvas = elements.sensitivityCanvas;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const pad = { left: 82, right: 38, top: 34, bottom: 68 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const values = observations.filter(item => Number.isFinite(item.valueChange) && Number.isFinite(item.taxChange));

  if (!values.length) {
    ctx.fillStyle = "#526780";
    ctx.font = "18px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("No tax-sensitivity observations are available for this group yet.", width / 2, height / 2);
    return;
  }

  const valueChanges = values.map(item => item.valueChange);
  const taxChanges = values.map(item => item.taxChange);
  const xMin = Math.min(-0.05, Math.floor(Math.min(quantile(valueChanges, 0.02), activeSummary.target - activeSummary.tolerance) * 20) / 20);
  const xMax = Math.max(0.35, Math.ceil(Math.max(quantile(valueChanges, 0.98), activeSummary.target + activeSummary.tolerance) * 20) / 20);
  const yMin = Math.min(-0.30, Math.floor(Math.min(quantile(taxChanges, 0.02), activeSummary.projectedTaxChange ?? 0) * 20) / 20);
  const yMax = Math.max(0.35, Math.ceil(Math.max(quantile(taxChanges, 0.98), activeSummary.projectedTaxChange ?? 0) * 20) / 20);

  const xForValue = value => pad.left + ((value - xMin) / (xMax - xMin)) * plotW;
  const yForValue = value => pad.top + (1 - ((value - yMin) / (yMax - yMin))) * plotH;
  const tickStart = (min, step) => Math.ceil(min / step) * step;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  ctx.strokeStyle = "#d7e0ea";
  ctx.lineWidth = 1;
  ctx.font = "13px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#526780";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let tick = tickStart(yMin, 0.1); tick <= yMax + 0.0001; tick += 0.1) {
    const y = yForValue(tick);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    ctx.fillText(signedPercent(tick, 0), pad.left - 12, y);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let tick = tickStart(xMin, 0.1); tick <= xMax + 0.0001; tick += 0.1) {
    const x = xForValue(tick);
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, height - pad.bottom);
    ctx.stroke();
    ctx.fillText(signedPercent(tick, 0), x, height - pad.bottom + 20);
  }

  if (xMin < 0 && xMax > 0) {
    ctx.strokeStyle = "#9fb0c4";
    ctx.beginPath();
    ctx.moveTo(xForValue(0), pad.top);
    ctx.lineTo(xForValue(0), height - pad.bottom);
    ctx.stroke();
  }
  if (yMin < 0 && yMax > 0) {
    ctx.strokeStyle = "#9fb0c4";
    ctx.beginPath();
    ctx.moveTo(pad.left, yForValue(0));
    ctx.lineTo(width - pad.right, yForValue(0));
    ctx.stroke();
  }

  const bandLeft = xForValue(activeSummary.target - activeSummary.tolerance);
  const bandRight = xForValue(activeSummary.target + activeSummary.tolerance);
  ctx.fillStyle = "rgba(23, 57, 94, 0.08)";
  ctx.fillRect(bandLeft, pad.top, bandRight - bandLeft, plotH);

  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = "rgba(82, 103, 128, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xForValue(Math.max(xMin, yMin)), yForValue(Math.max(xMin, yMin)));
  ctx.lineTo(xForValue(Math.min(xMax, yMax)), yForValue(Math.min(xMax, yMax)));
  ctx.stroke();
  ctx.restore();

  const isInActiveBand = item => item.valueChange >= activeSummary.target - activeSummary.tolerance
    && item.valueChange < activeSummary.target + activeSummary.tolerance;

  values.forEach(item => {
    const matched = isInActiveBand(item);
    const clamped = item.valueChange < xMin || item.valueChange > xMax || item.taxChange < yMin || item.taxChange > yMax;
    ctx.globalAlpha = clamped ? 0.14 : (matched ? 0.78 : 0.24);
    ctx.fillStyle = item.taxChange <= item.valueChange ? "#386fa4" : "#b23a3a";
    ctx.beginPath();
    ctx.arc(
      xForValue(clamp(item.valueChange, xMin, xMax)),
      yForValue(clamp(item.taxChange, yMin, yMax)),
      matched ? 4 : 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  if (Number.isFinite(activeSummary.projectedTaxChange)) {
    const px = xForValue(activeSummary.target);
    const py = yForValue(activeSummary.projectedTaxChange);
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#17395e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#17395e";
    ctx.font = "700 13px Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText("projection", Math.min(px + 12, width - 112), Math.max(py - 10, pad.top + 18));
  }

  ctx.fillStyle = "#526780";
  ctx.font = "14px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("Year-to-year value change", pad.left + plotW / 2, height - 14);

  ctx.save();
  ctx.translate(22, pad.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Year-to-year net tax change", 0, 0);
  ctx.restore();
}

function factorText(value) {
  if (!Number.isFinite(value)) return "1 + ?";
  const operator = value < 0 ? "−" : "+";
  return `1 ${operator} ${plainPercent(Math.abs(value))}`;
}

function renderProjectionRows(observations) {
  const summaries = SCENARIO_TARGETS.map(target => summarizeProjectionBand(observations, target));
  elements.projectionRows.innerHTML = summaries.map(summary => `
    <tr>
      <td>${signedPercent(summary.target, 0)}</td>
      <td>${summary.bandLabel}</td>
      <td><span class="confidence ${summary.confidence}">${summary.count} ${summary.confidence}</span></td>
      <td>${signedPercent(summary.medianEtrChange)}</td>
      <td>${signedPercent(summary.medianLevyChange)}</td>
      <td>${signedPercent(summary.projectedTaxChange)}</td>
      <td>${signedPercent(summary.medianTaxChange)}</td>
      <td>${projectionRangeText(summary)}</td>
    </tr>
  `).join("");
}

function updateScenarioDisplay() {
  const target = Number(elements.scenarioInput.value) / 100;
  const summary = summarizeProjectionBand(activeProjectionObservations, target);
  elements.scenarioValue.textContent = signedPercent(target, 0);
  elements.scenarioBandNote.textContent = summary.count
    ? `Using ${summary.count} observations where value moved ${summary.bandLabel}. Confidence cue: ${summary.confidence}.`
    : `No observations are close to ${signedPercent(target, 0)} in this group yet.`;
  elements.scenarioProjection.textContent = signedPercent(summary.projectedTaxChange);
  elements.scenarioProjectionNote.textContent = Number.isFinite(summary.projectedTaxChange)
    ? `Tax_hat = (${factorText(target)}) × (${factorText(summary.medianEtrChange)}) − 1; observed median was ${signedPercent(summary.medianTaxChange)}.`
    : "No comparable ETR response is available for this scenario.";
  elements.scenarioEtrResponse.textContent = signedPercent(summary.medianEtrChange);
  elements.scenarioLevyChange.textContent = signedPercent(summary.medianLevyChange);
  elements.scenarioSampleSize.textContent = `${summary.count}`;
  drawSensitivityChart(activeProjectionObservations, summary);
}

function renderProjectionModel(observations) {
  activeProjectionObservations = observations;
  elements.observationCount.textContent = String(observations.length);
  renderProjectionRows(observations);
  updateScenarioDisplay();
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
  const { preparedRecords, aggregate, observations, valueBaselineCount, taxBaselineCount, taxFlagCount, counts } = computeGroup(records, activeModelLens);
  const latest = aggregate.at(-1);
  const first = aggregate[0];

  elements.groupSelect.value = group.key;
  elements.propertyCount.textContent = String(records.length);
  elements.historyCoverage.textContent = `${valueBaselineCount} value baselines, ${taxBaselineCount} ${MODEL_LENSES[activeModelLens].label.toLowerCase()} tax baselines, ${taxFlagCount} model exclusions`;
  elements.modelLensSelect.value = activeModelLens;
  elements.stableModelCount.textContent = String(counts.stable);
  elements.realWorldModelCount.textContent = String(counts.realWorld);
  elements.excludedModelCount.textContent = String(activeModelLens === "stable"
    ? counts.excludedFromStable
    : counts.excludedFromRealWorld);
  elements.modelRuleNote.textContent = MODEL_LENSES[activeModelLens].note;
  elements.valueIndex.textContent = Number.isFinite(latest?.medianValueIndex) ? decimal.format(latest.medianValueIndex) : "—";
  elements.valueChange.textContent = changeText(latest?.medianValueIndex);
  elements.taxIndex.textContent = Number.isFinite(latest?.medianTaxIndex) ? decimal.format(latest.medianTaxIndex) : "—";
  elements.taxChange.textContent = changeText(latest?.medianTaxIndex);
  elements.etrLatest.textContent = Number.isFinite(latest?.avgEtr) ? percent.format(latest.avgEtr) : "—";
  elements.etrChange.textContent = Number.isFinite(first?.avgEtr) && Number.isFinite(latest?.avgEtr)
    ? `${((latest.avgEtr - first.avgEtr) * 100).toFixed(2)} pts since 2019`
    : "latest year";
  elements.chartTitle.textContent = `${group.label}: value and tax movement`;
  elements.chartNote.textContent = `${records.length} loaded properties are indexed to their own 2019 baselines where available. The tax line uses the ${MODEL_LENSES[activeModelLens].label.toLowerCase()} model-ready cohort.`;
  elements.sampleNote.textContent = `${group.label}. Model lens: ${MODEL_LENSES[activeModelLens].label}. This is a small local static sample, not a statistical study.`;

  if (!records.length || (!valueBaselineCount && !taxBaselineCount)) {
    elements.aggregateRows.innerHTML = `<tr><td colspan="6"><div class="empty-state">No records in this group have a complete 2019 baseline.</div></td></tr>`;
    elements.propertyRows.innerHTML = `<tr><td colspan="6"><div class="empty-state">No loaded sample records for this group yet.</div></td></tr>`;
    drawChart([]);
    renderKpiSparklines([]);
    renderProjectionModel([]);
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
    const taxFlag = item.modelFlag.excludedFromModel
      ? `<span class="sample-flag">${item.modelFlag.reasons.join("; ")}</span>`
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
  renderProjectionModel(observations);
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

async function loadSamplingTracker() {
  try {
    const response = await fetch("../data/sampling/gage-research-sampling-tracker.json");
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
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

function setupProjectionControls() {
  elements.scenarioInput.addEventListener("input", updateScenarioDisplay);
  elements.modelLensSelect.addEventListener("change", () => {
    activeModelLens = elements.modelLensSelect.value;
    render(elements.groupSelect.value);
  });
}

function samplingSummaries() {
  if (!samplingTracker) return [];
  const summaries = (samplingTracker.groups || []).map(group => ({
    groupKey: group.key,
    label: `${group.valuationGroup} · ${group.class}`,
    target: Number(group.target || 0),
    built: 0,
    screened: 0,
    needsReview: 0,
    totalPotential: 0,
    shortfall: 0
  }));
  const byKey = new Map(summaries.map(summary => [summary.groupKey, summary]));

  (samplingTracker.candidates || []).forEach(candidate => {
    if (!candidate.groupKey || !byKey.has(candidate.groupKey)) return;
    const summary = byKey.get(candidate.groupKey);
    if (candidate.status === "built_research" || candidate.status === "built_public") summary.built += 1;
    if (candidate.status === "screened_candidate") summary.screened += 1;
    if (candidate.status === "screened_needs_review") summary.needsReview += 1;
  });

  summaries.forEach(summary => {
    summary.totalPotential = summary.built + summary.screened + summary.needsReview;
    summary.shortfall = Math.max(0, summary.target - summary.totalPotential);
  });

  return summaries.sort((a, b) => {
    if (a.target === 0 && b.target !== 0) return 1;
    if (b.target === 0 && a.target !== 0) return -1;
    if (b.shortfall !== a.shortfall) return b.shortfall - a.shortfall;
    return a.label.localeCompare(b.label);
  });
}

function samplingStatus(summary) {
  if (summary.target === 0) return "reference";
  if (summary.shortfall === 0) return "complete";
  if (summary.totalPotential > 0) return "active";
  return "empty";
}

function renderSamplingCandidates() {
  if (!samplingTracker) return;
  const groupKey = elements.samplingGroupSelect.value;
  const candidates = (samplingTracker.candidates || [])
    .filter(candidate => candidate.groupKey === groupKey)
    .filter(candidate => candidate.status === "screened_candidate" || candidate.status === "screened_needs_review")
    .sort((a, b) => {
      const aReview = a.status === "screened_needs_review" ? 1 : 0;
      const bReview = b.status === "screened_needs_review" ? 1 : 0;
      return bReview - aReview || (a.sequence || 0) - (b.sequence || 0);
    });

  const selected = samplingSummaries().find(summary => summary.groupKey === groupKey);
  elements.candidateNote.textContent = selected
    ? `${selected.label}: ${candidates.length} screened candidate${candidates.length === 1 ? "" : "s"} waiting behind ${selected.built} built record${selected.built === 1 ? "" : "s"}.`
    : "Choose a valuation group to inspect the current pull list.";

  if (!candidates.length) {
    elements.candidateRows.innerHTML = `<tr><td colspan="5"><div class="empty-state">No screened potentials for this group yet.</div></td></tr>`;
    return;
  }

  elements.candidateRows.innerHTML = candidates.slice(0, 30).map(candidate => `
    <tr>
      <td>${candidate.ntoParcelId || candidate.sourceParcelId}</td>
      <td>${candidate.propertyClass || "—"}</td>
      <td>${candidate.situsAddress || "—"}</td>
      <td>${candidate.taxDistrict || "—"}</td>
      <td><span class="status-pill ${candidate.status === "screened_needs_review" ? "review" : "ready"}">${candidate.groupConfidence || "ready"}</span></td>
    </tr>
  `).join("");
}

function renderSamplingTracker() {
  if (!samplingTracker) {
    elements.samplingSummary.textContent = "No private sampling tracker is available yet.";
    elements.samplingRows.innerHTML = `<tr><td colspan="6"><div class="empty-state">Run the research sampler to create a tracker.</div></td></tr>`;
    elements.candidateRows.innerHTML = `<tr><td colspan="5"><div class="empty-state">No screened potentials loaded.</div></td></tr>`;
    return;
  }

  const summaries = samplingSummaries();
  const statusCounts = (samplingTracker.candidates || []).reduce((counts, candidate) => {
    counts[candidate.status] = (counts[candidate.status] || 0) + 1;
    return counts;
  }, {});
  const totalScreened = (statusCounts.screened_candidate || 0) + (statusCounts.screened_needs_review || 0);
  const completed = summaries.filter(summary => summary.target > 0 && summary.shortfall === 0).length;
  elements.samplingSummary.textContent = `${totalScreened} screened potentials, ${statusCounts.built_research || 0} research records already built, ${completed} target groups currently filled from this source.`;

  elements.samplingRows.innerHTML = summaries.map(summary => `
    <tr class="tracker-row ${samplingStatus(summary)}">
      <td>
        <strong>${summary.label}</strong>
        <span>${summary.groupKey}</span>
      </td>
      <td>${summary.target || "reference"}</td>
      <td>${summary.built}</td>
      <td>${summary.screened}</td>
      <td>${summary.needsReview}</td>
      <td><span class="status-pill ${samplingStatus(summary)}">${summary.shortfall}</span></td>
    </tr>
  `).join("");

  const priorValue = elements.samplingGroupSelect.value;
  const targetGroups = summaries.filter(summary => summary.target > 0);
  elements.samplingGroupSelect.innerHTML = targetGroups.map(summary => `
    <option value="${summary.groupKey}">${summary.label} (${summary.totalPotential}/${summary.target})</option>
  `).join("");
  const fallback = [...targetGroups]
    .sort((a, b) => (b.screened + b.needsReview) - (a.screened + a.needsReview) || b.totalPotential - a.totalPotential)
    [0]?.groupKey || targetGroups[0]?.groupKey || "";
  elements.samplingGroupSelect.value = targetGroups.some(summary => summary.groupKey === priorValue) ? priorValue : fallback;
  renderSamplingCandidates();
}

function setupSamplingControls() {
  elements.samplingGroupSelect.addEventListener("change", renderSamplingCandidates);
}

function renderSchoolLevyCoverage() {
  const rows = schoolLevyCoverageRows();
  if (!rows.length) {
    elements.schoolLevySummary.textContent = "No school levy components are available in the loaded sample records yet.";
    elements.schoolLevyRows.innerHTML = `<tr><td colspan="5"><div class="empty-state">School levy coverage is not available.</div></td></tr>`;
    elements.schoolLevyTotals.innerHTML = "";
    return;
  }

  const heatScales = schoolShareScales(rows);
  elements.schoolLevySummary.textContent = `${rows.length} school district${rows.length === 1 ? "" : "s"} appear in the loaded Gage sample records. From left to right, each row shows the district, the school levy rate found in the sample, then the residential, commercial, and agricultural share of each class levy stack. Each share cell includes the class sample count behind it.`;
  elements.schoolLevyRows.innerHTML = rows.map(row => `
    <tr class="school-share-row">
      <td class="school-district-cell"><strong>${escapeHtml(schoolDistrictDisplayLabel(row.schoolDistrict))}</strong></td>
      <td class="school-rate-cell">${levyRateText(row.schoolRate)}</td>
      ${classShareCell(row, "Residential", heatScales.Residential)}
      ${classShareCell(row, "Commercial", heatScales.Commercial)}
      ${classShareCell(row, "Agricultural", heatScales.Agricultural)}
    </tr>
  `).join("");
  elements.schoolLevyTotals.innerHTML = `
    <tr class="school-total-row">
      <td class="school-total-label"><strong>Total / average</strong></td>
      <td class="school-rate-cell">${levyRateText(average(rows.map(row => row.schoolRate)))}</td>
      <td class="class-share-cell">${classTotalCell(rows, "Residential")}</td>
      <td class="class-share-cell">${classTotalCell(rows, "Commercial")}</td>
      <td class="class-share-cell">${classTotalCell(rows, "Agricultural")}</td>
    </tr>
  `;
}

async function main() {
  [allRecords, samplingTracker] = await Promise.all([loadRecords(), loadSamplingTracker()]);
  setupGroupSelect();
  setupProjectionControls();
  setupSamplingControls();
  renderSamplingTracker();
  renderSchoolLevyCoverage();
  render(groups.find(group => group.key === DEFAULT_GROUP_KEY)?.key || groups[0]?.key);
}

main().catch(error => {
  document.body.innerHTML = `<pre>${error.stack || error.message}</pre>`;
});
