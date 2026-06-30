const BASELINE_YEAR = 2019;
const VALUE_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
const TAX_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
const CLASS_ORDER = ["Residential", "Agricultural", "Commercial"];
const LATEST_FINAL_TAX_YEAR = TAX_YEARS.at(-1);
// 2025 Gage County Form 45 real property records:
// 10,659 residential + 5,864 agricultural + 1,240 commercial.
const GAGE_COUNTY_PARCEL_TOTAL = 17763;
const CHART_WIDTH = 300;
const CHART_HEIGHT = 124;
const CHART_PAD = { left: 10, right: 10, top: 4, bottom: 6 };

const decimal = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1
});

const FLAT_RATE_THRESHOLD = 0.005;

const elements = {
  datasetMethodology: document.getElementById("datasetMethodology"),
  sampledPropertiesMetric: document.getElementById("sampledPropertiesMetric"),
  marketAreasMetric: document.getElementById("marketAreasMetric"),
  marketAreasBreakdown: document.getElementById("marketAreasBreakdown"),
  dataWindowNote: document.getElementById("dataWindowNote"),
  valuationGroupOverview: document.getElementById("valuationGroupOverview")
};

let allRecords = [];
let samplingTracker = null;

// Icons are selected from Lucide's 24px outline set and inlined to keep this static page dependency-free.
const CLASS_ICONS = {
  Residential: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    </svg>
  `,
  Agricultural: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m10 11 11 .9a1 1 0 0 1 .8 1.1l-.665 4.158a1 1 0 0 1-.988.842H20"></path>
      <path d="M16 18h-5"></path>
      <path d="M18 5a1 1 0 0 0-1 1v5.573"></path>
      <path d="M3 4h8.129a1 1 0 0 1 .99.863L13 11.246"></path>
      <path d="M4 11V4"></path>
      <path d="M7 15h.01"></path>
      <path d="M8 10.1V4"></path>
      <circle cx="18" cy="18" r="2"></circle>
      <circle cx="7" cy="15" r="5"></circle>
    </svg>
  `,
  Commercial: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path>
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path>
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path>
      <path d="M10 6h4"></path>
      <path d="M10 10h4"></path>
      <path d="M10 14h4"></path>
      <path d="M10 18h4"></path>
    </svg>
  `
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function median(values) {
  const usable = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!usable.length) return null;
  const middle = Math.floor(usable.length / 2);
  return usable.length % 2 ? usable[middle] : (usable[middle - 1] + usable[middle]) / 2;
}

function rowForYear(rows, field, year) {
  return (rows || []).find(row => Number(row?.[field]) === year) || null;
}

function assessedValueForYear(record, year, historyRow, statement) {
  const historyValue = numberOrNull(historyRow?.assessedValue);
  if (historyValue !== null) return historyValue;

  const statementValue = numberOrNull(statement?.assessedValue);
  if (statementValue !== null) return statementValue;

  const guidedBreakdown = rowForYear(record.guidedSnapshot?.assessedValueBreakdown, "year", year);
  const guidedBreakdownValue = numberOrNull(guidedBreakdown?.total);
  if (guidedBreakdownValue !== null) return guidedBreakdownValue;

  const valuationRow = rowForYear(record.valuationHistory, "year", year);
  const valuationValue = numberOrNull(valuationRow?.total);
  if (valuationValue !== null) return valuationValue;

  return null;
}

function byYear(record) {
  const history = new Map((record.guidedSnapshot?.taxpayerHistory || [])
    .map(row => [Number(row.year), row]));
  const statements = new Map((record.guidedSnapshot?.taxStatements || [])
    .map(statement => [Number(statement.taxYear), statement]));

  return VALUE_YEARS.map(year => {
    const row = history.get(year);
    const statement = statements.get(year);
    const value = assessedValueForYear(record, year, row, statement);
    const netTax = numberOrNull(row?.taxes ?? statement?.netAmountDue);
    return {
      year,
      value: Number.isFinite(value) && value > 0 ? value : null,
      netTax: TAX_YEARS.includes(year) && Number.isFinite(netTax) && netTax > 0 ? netTax : null,
      etr: TAX_YEARS.includes(year) && Number.isFinite(value) && value > 0 && Number.isFinite(netTax) && netTax > 0
        ? netTax / value
        : null
    };
  });
}

function indexedSeries(rows, field, years) {
  const baseline = rows.find(row => row.year === BASELINE_YEAR)?.[field];
  if (!Number.isFinite(baseline) || baseline <= 0) return null;
  return years.map(year => {
    const row = rows.find(item => item.year === year);
    return {
      year,
      value: Number.isFinite(row?.[field]) ? (row[field] / baseline) * 100 : null
    };
  });
}

function latestFiniteRow(rows, field) {
  return rows.slice().reverse().find(row => Number.isFinite(row?.[field])) || null;
}

function firstFiniteRow(rows, field) {
  return rows.find(row => Number.isFinite(row?.[field])) || null;
}

function signedPercent(value, digits = 1) {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(digits)}%`;
}

function annualizedPercent(value) {
  if (!Number.isFinite(value)) return "avg —/yr";
  const normalized = Math.abs(value) < 0.0005 ? 0 : value;
  return `avg ${(normalized * 100).toFixed(1)}%/yr`;
}

function indexDelta(indexValue) {
  return Number.isFinite(indexValue) ? (indexValue - 100) / 100 : null;
}

function annualizedRate(rows, field) {
  const beginning = firstFiniteRow(rows, field);
  const ending = latestFiniteRow(rows, field);
  const beginningValue = beginning?.[field];
  const endingValue = ending?.[field];
  const years = (ending?.year || 0) - (beginning?.year || 0);
  if (!Number.isFinite(beginningValue) || !Number.isFinite(endingValue) || beginningValue <= 0 || endingValue <= 0 || years <= 0) {
    return null;
  }
  return (endingValue / beginningValue) ** (1 / years) - 1;
}

function relationshipLabel(valueRate, taxRate) {
  if (!Number.isFinite(valueRate) || !Number.isFinite(taxRate)) return "—";
  const valueFlat = Math.abs(valueRate) < FLAT_RATE_THRESHOLD;
  const taxFlat = Math.abs(taxRate) < FLAT_RATE_THRESHOLD;
  const valueToTaxRatio = Math.abs(valueRate) / Math.max(Math.abs(taxRate), FLAT_RATE_THRESHOLD);

  if (valueFlat && taxRate < -FLAT_RATE_THRESHOLD) return "Value stable";
  if (valueRate > FLAT_RATE_THRESHOLD && taxRate < -FLAT_RATE_THRESHOLD) return "Tax declined";
  if (valueFlat && taxFlat) return "Similar pace";
  if (taxRate > FLAT_RATE_THRESHOLD && (valueFlat || taxRate > valueRate * 1.25)) return "Tax rose faster";
  if (valueFlat) return "Value stable";
  if (valueRate > taxRate * 1.25) return `Value outpaced tax ${valueToTaxRatio.toFixed(1)}x`;
  return "Similar pace";
}

function firstNumberToken(value) {
  return String(value || "").match(/\d+/)?.[0] || "";
}

function overviewClassLabel(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("residential")) return "Residential";
  if (normalized.includes("agricultural")) return "Agricultural";
  if (normalized.includes("commercial")) return "Commercial";
  return "Property";
}

function overviewGroupKeyForRecord(record) {
  const classLabel = overviewClassLabel(
    record.guidedSnapshot?.classification?.propertyClass ||
    record.guidedSnapshot?.parcel?.accountType ||
    record.classification?.propertyClass ||
    record.parcel?.accountType
  );
  const rawGroup = record.locationModel?.valuationGroup || record.locationModel?.marketArea || "";
  const groupNumber = firstNumberToken(rawGroup);
  if (!groupNumber || classLabel === "Property") return null;
  return `${classLabel}-${groupNumber}`;
}

function groupedRecords() {
  return allRecords.reduce((map, record) => {
    const key = overviewGroupKeyForRecord(record);
    if (!key) return map;
    const records = map.get(key) || [];
    records.push(record);
    map.set(key, records);
    return map;
  }, new Map());
}

function overviewGroups() {
  if (!samplingTracker?.groups?.length) return [];
  const classRank = new Map(CLASS_ORDER.map((className, index) => [className, index]));
  return samplingTracker.groups
    .filter(group => classRank.has(group.class))
    .sort((a, b) => (
      classRank.get(a.class) - classRank.get(b.class)
      || Number(a.number || 0) - Number(b.number || 0)
      || String(a.valuationGroup || "").localeCompare(String(b.valuationGroup || ""))
    ));
}

function computeOverviewAggregate(records) {
  const prepared = records.map(record => {
    const rows = byYear(record);
    return {
      valueIndex: indexedSeries(rows, "value", VALUE_YEARS),
      taxIndex: indexedSeries(rows, "netTax", TAX_YEARS)
    };
  });

  return VALUE_YEARS.map(year => {
    const valueIndexes = prepared
      .filter(item => item.valueIndex)
      .map(item => item.valueIndex.find(row => row.year === year)?.value)
      .filter(Number.isFinite);
    const taxIndexes = prepared
      .filter(item => item.taxIndex)
      .map(item => item.taxIndex.find(row => row.year === year)?.value)
      .filter(Number.isFinite);
    return {
      year,
      medianValueIndex: median(valueIndexes),
      medianTaxIndex: TAX_YEARS.includes(year) ? median(taxIndexes) : null
    };
  });
}

function hasAggregateData(row) {
  return Number.isFinite(row?.medianValueIndex) || Number.isFinite(row?.medianTaxIndex);
}

function displayAggregateRows(aggregate) {
  return aggregate.filter(hasAggregateData);
}

function chartScaleForAggregates(aggregates) {
  const values = aggregates
    .flatMap(aggregate => displayAggregateRows(aggregate))
    .flatMap(row => [row.medianValueIndex, row.medianTaxIndex])
    .filter(Number.isFinite);
  if (!values.length) return { min: 80, max: 140 };
  const min = Math.min(80, Math.floor(Math.min(...values) / 10) * 10);
  const max = Math.max(140, Math.ceil(Math.max(...values) / 10) * 10);
  return { min, max: max === min ? min + 1 : max };
}

function aggregateYearDomain(aggregate) {
  const years = displayAggregateRows(aggregate).map(row => row.year);
  if (!years.length) return { start: BASELINE_YEAR, end: LATEST_FINAL_TAX_YEAR };
  return {
    start: Math.min(BASELINE_YEAR, ...years),
    end: Math.max(...years)
  };
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

function overviewPath(aggregate, key, scale, domain) {
  const plotW = CHART_WIDTH - CHART_PAD.left - CHART_PAD.right;
  const plotH = CHART_HEIGHT - CHART_PAD.top - CHART_PAD.bottom;
  const yearSpan = Math.max(domain.end - domain.start, 1);
  const points = aggregate
    .filter(row => Number.isFinite(row[key]))
    .map(row => ({
      x: CHART_PAD.left + ((row.year - domain.start) / yearSpan) * plotW,
      y: CHART_PAD.top + (1 - ((row[key] - scale.min) / (scale.max - scale.min))) * plotH
    }));
  return sparklinePath(points);
}

function chartSvg(aggregate, scale, relationship = "") {
  const displayRows = displayAggregateRows(aggregate);
  const values = displayRows
    .flatMap(row => [row.medianValueIndex, row.medianTaxIndex])
    .filter(Number.isFinite);
  if (values.length < 2) {
    return `<div class="empty-chart"><span>No indexed history yet</span></div>`;
  }

  const domain = aggregateYearDomain(displayRows);
  const plotH = CHART_HEIGHT - CHART_PAD.top - CHART_PAD.bottom;
  const baselineY = CHART_PAD.top + (1 - ((100 - scale.min) / (scale.max - scale.min))) * plotH;
  const valuePath = overviewPath(displayRows, "medianValueIndex", scale, domain);
  const taxPath = overviewPath(displayRows, "medianTaxIndex", scale, domain);

  return `
    <div class="chart-frame">
      ${relationship ? `<span class="relationship-badge chart-relationship-badge" aria-label="Value and tax movement relationship">${escapeHtml(relationship)}</span>` : ""}
      <svg class="mini-chart" viewBox="0 0 300 124" preserveAspectRatio="none" role="img" aria-label="Value and tax index line chart">
        <line class="baseline" x1="${CHART_PAD.left}" y1="${baselineY.toFixed(2)}" x2="${CHART_WIDTH - CHART_PAD.right}" y2="${baselineY.toFixed(2)}"></line>
        <path class="chart-line value-line" d="${valuePath}"></path>
        <path class="chart-line tax-line" d="${taxPath}"></path>
      </svg>
      <div class="year-row" aria-hidden="true">
        <span>${domain.start}</span>
        <span>${domain.end}</span>
      </div>
    </div>
  `;
}

function movementClass(delta) {
  if (!Number.isFinite(delta) || Math.abs(delta) < 0.0005) return "neutral";
  return delta > 0 ? "up" : "down";
}

function movementGlyph(delta) {
  if (!Number.isFinite(delta) || Math.abs(delta) < 0.0005) return "=";
  return "";
}

function movementPill(type, delta, annualized) {
  const className = `${type} ${movementClass(delta)}`;
  const label = type === "value" ? "Value" : "Tax";
  return `
    <span class="movement-stack ${className}">
      <span class="movement-pill">
        <span class="movement-glyph" aria-hidden="true">${movementGlyph(delta)}</span>
        <span class="movement-primary">
          <span class="metric">${label}</span>
          <strong>${signedPercent(delta)}</strong>
        </span>
      </span>
      <span class="movement-annualized">${annualizedPercent(annualized)}</span>
    </span>
  `;
}

function sampleLine(sampleCount) {
  return `${sampleCount} sample${sampleCount === 1 ? "" : "s"}`;
}

function taxDistrictLine(count) {
  return `${count.toLocaleString("en-US")} tax district${count === 1 ? "" : "s"}`;
}

function cardMarkup(group, recordsByGroup, aggregateByGroup) {
  const records = recordsByGroup.get(group.key) || [];
  const aggregate = aggregateByGroup.get(group.key) || computeOverviewAggregate(records);
  const chartScale = chartScaleForAggregates([aggregate]);
  const latestValue = latestFiniteRow(aggregate, "medianValueIndex");
  const latestTax = latestFiniteRow(aggregate, "medianTaxIndex");
  const valueDelta = indexDelta(latestValue?.medianValueIndex);
  const taxDelta = indexDelta(latestTax?.medianTaxIndex);
  const valueAnnualized = annualizedRate(aggregate, "medianValueIndex");
  const taxAnnualized = annualizedRate(aggregate, "medianTaxIndex");
  const relationship = relationshipLabel(valueAnnualized, taxAnnualized);
  const districtCount = taxDistrictCount(records);

  return `
    <article class="vg-card class-${group.class.toLowerCase()}">
      <div class="vg-card-header">
        <div class="vg-card-title-row">
          <h3>${escapeHtml(group.valuationGroup)}</h3>
          <p class="sample-inline">
            <span>${sampleLine(records.length)}</span>
            <span title="Unique tax districts represented in this sample.">${taxDistrictLine(districtCount)}</span>
          </p>
        </div>
      </div>
      ${chartSvg(aggregate, chartScale, relationship)}
      <div class="vg-card-footer">
        <div class="movement-row" aria-label="Movement summary">
          ${movementPill("value", valueDelta, valueAnnualized)}
          ${movementPill("tax", taxDelta, taxAnnualized)}
        </div>
      </div>
    </article>
  `;
}

function classIcon(className) {
  return CLASS_ICONS[className] || "";
}

function sectionMarkup(className, groups, recordsByGroup, aggregateByGroup) {
  const classGroups = groups.filter(group => group.class === className);
  if (!classGroups.length) return "";
  const groupLabel = className === "Agricultural" ? "market areas" : "valuation groups";
  const sectionLegend = className === "Residential"
    ? `
      <div class="overview-legend" aria-label="Chart legend">
        <span><i class="value"></i> Value index</span>
        <span><i class="tax"></i> Tax index</span>
      </div>
    `
    : "";
  const classNote = className === "Agricultural"
    ? `<p class="class-note">Agricultural values and tax movement are shown separately because they follow different market forces than residential property.</p>`
    : className === "Commercial"
      ? `<p class="class-note">Commercial values and tax movement often follow different patterns than residential and agricultural property.</p>`
      : "";
  return `
    <section class="class-section class-${className.toLowerCase()}" aria-label="${escapeHtml(className)} valuation group overview">
      <div class="class-divider" aria-hidden="true"></div>
      <div class="class-section-header">
        <div class="class-heading">
          <span class="class-icon" aria-hidden="true">${classIcon(className)}</span>
          <h2>${escapeHtml(className)} <small>${classGroups.length} ${groupLabel}</small></h2>
        </div>
        ${sectionLegend}
      </div>
      ${classNote}
      <div class="card-grid">
        ${classGroups.map(group => cardMarkup(group, recordsByGroup, aggregateByGroup)).join("")}
      </div>
    </section>
  `;
}

function renderDataWindow(aggregates) {
  const latestValueYear = latestFiniteRow(aggregates, "medianValueIndex")?.year || VALUE_YEARS.at(-1);
  const latestTaxYear = latestFiniteRow(aggregates, "medianTaxIndex")?.year || LATEST_FINAL_TAX_YEAR;
  elements.dataWindowNote.textContent = `Value line through ${latestValueYear} where available; tax line through finalized ${latestTaxYear} tax data.`;
}

function taxDistrictCount(records) {
  return new Set(records
    .map(record => `${record.guidedSnapshot?.parcel?.taxDistrict || record.sourceExtract?.taxDistrict || ""}`.trim())
    .filter(Boolean)).size;
}

function renderDatasetMethodology(sampleCount) {
  const samplePercentage = (sampleCount / GAGE_COUNTY_PARCEL_TOTAL) * 100;
  elements.datasetMethodology.innerHTML = `
    <strong>${datasetIconMarkup()} Dataset</strong>
    <span>Based on a randomized sample of ${sampleCount.toLocaleString("en-US")} properties (${decimal.format(samplePercentage)}% of county parcels) distributed across residential, agricultural, and commercial market areas.</span>
  `;
}

function datasetIconMarkup() {
  return `
    <span class="dataset-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <ellipse cx="12" cy="5" rx="8" ry="3"></ellipse>
        <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"></path>
        <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"></path>
      </svg>
    </span>
  `;
}

function render() {
  const groups = overviewGroups();
  if (!groups.length) {
    elements.valuationGroupOverview.innerHTML = `<div class="empty-state">No valuation group tracker is available yet.</div>`;
    elements.datasetMethodology.innerHTML = `
      <strong>${datasetIconMarkup()} Dataset</strong>
      <span>No randomized sample properties loaded.</span>
    `;
    elements.sampledPropertiesMetric.textContent = "No sampled properties loaded";
    elements.marketAreasMetric.textContent = "No market areas loaded";
    elements.marketAreasBreakdown.textContent = "Residential • agricultural • commercial";
    return;
  }

  const recordsByGroup = groupedRecords();
  const aggregateByGroup = new Map(groups.map(group => [
    group.key,
    computeOverviewAggregate(recordsByGroup.get(group.key) || [])
  ]));
  const aggregates = [...aggregateByGroup.values()];
  const totalSamples = groups.reduce((sum, group) => sum + (recordsByGroup.get(group.key)?.length || 0), 0);
  const classCounts = CLASS_ORDER.reduce((counts, className) => {
    counts[className] = groups.filter(group => group.class === className).length;
    return counts;
  }, {});
  renderDatasetMethodology(totalSamples);
  elements.sampledPropertiesMetric.textContent = `${totalSamples.toLocaleString("en-US")} sampled properties`;
  elements.marketAreasMetric.textContent = `${groups.length.toLocaleString("en-US")} market areas`;
  elements.marketAreasBreakdown.textContent = `${classCounts.Residential || 0} residential • ${classCounts.Agricultural || 0} agricultural • ${classCounts.Commercial || 0} commercial`;
  renderDataWindow(aggregates.flat());
  elements.valuationGroupOverview.innerHTML = CLASS_ORDER
    .map(className => sectionMarkup(className, groups, recordsByGroup, aggregateByGroup))
    .join("");
}

async function loadRecords() {
  const manifest = await fetch("data/app/property-manifest.json").then(response => response.json());
  const gageProperties = manifest.properties
    .filter(item => item.county === "gage" && item.recordCardStatus === "available");
  return Promise.all(gageProperties.map(async property => {
    const record = await fetch(property.recordCardPath).then(response => response.json());
    return record;
  }));
}

async function loadSamplingTracker() {
  const response = await fetch("data/sampling/gage-research-sampling-tracker.json");
  if (!response.ok) throw new Error("Sampling tracker could not be loaded.");
  return response.json();
}

async function main() {
  [allRecords, samplingTracker] = await Promise.all([
    loadRecords(),
    loadSamplingTracker()
  ]);
  render();
}

main().catch(error => {
  document.body.innerHTML = `<main class="overview-shell"><div class="error-state">${escapeHtml(error.stack || error.message)}</div></main>`;
});
