import {
  calculateEtr,
  formatNullableLevy,
  formatNullableMoney,
  formatNullablePercent,
  moneyCents,
  percent,
  sumRates
} from "./format.js";
import {
  hasValue,
  latestKnown,
  percentChange,
  sortHistoryAscending
} from "./calculations/history.js";
import {
  displayAddress,
  displayMailingAddress
} from "./utils/address.js";
import {
  getClassMarketStats,
  getCodInterpretationRange,
  getCountywideMarketPoint,
  getMedianRatioRange,
  getParcelMarketClass,
  getSelectedMarketGroup
} from "./market-stats.js";
import { buildReviewSignalModel } from "./data/review-signal-model.js";
import {
  addReportPage,
  createReportContext,
  downloadPdfBytes,
  drawKeyValueRows,
  drawLineChart,
  drawPanel,
  drawRule,
  drawSectionTitle,
  drawTable,
  drawText,
  drawVerticalRule,
  drawWrappedText
} from "./reports/pdf-report-kit.js";
import { displayValue, fileSafe, hasDisplayValue } from "./utils/display.js";

export function initAssessorsReport({
  data,
  recordCard,
  valuationGroups,
  context = {},
  loadTaxDistrictAuthorities
}) {
  const button = document.querySelector("[data-assessors-report]");
  if (!button) return;

  const defaultLabel = button.textContent;

  button.addEventListener("click", async () => {
    const activeElement = document.activeElement;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = "Preparing report";

    try {
      const taxDistrictAuthorities = await loadTaxDistrictAuthorities?.().catch(() => null);
      const reportModel = buildAssessorsReportModel(data, recordCard, valuationGroups, {
        ...context,
        taxDistrictAuthorities
      });

      const bytes = await generateAssessorsReportPdf(reportModel);
      downloadPdfBytes(bytes, assessorsReportFilename(data));
      button.textContent = "Report downloaded";
      window.setTimeout(() => {
        button.textContent = defaultLabel;
        button.disabled = false;
        button.setAttribute("aria-busy", "false");
        activeElement?.focus?.();
      }, 1400);
    } catch (error) {
      console.error(error);
      button.textContent = defaultLabel;
      button.disabled = false;
      button.setAttribute("aria-busy", "false");
      alert("The supplemental review report could not be prepared from the current parcel data.");
    }
  });
}

export function buildAssessorsReportModel(data, recordCard, valuationGroups, context) {
  const valueSummary = buildValueSummary(data, recordCard);
  const propertySummary = buildPropertySummary(data, recordCard, valuationGroups);
  const equalization = buildEqualizationContext(data, recordCard, context);
  const taxContext = buildTaxContext(data, context.taxDistrictAuthorities);
  const reviewSignals = buildReportReviewSignals(data, recordCard, valueSummary, equalization);
  const summary = buildWorkingConclusion(data, valueSummary, propertySummary, equalization, reviewSignals);

  return {
    generatedAt: new Date(),
    data,
    recordCard,
    context,
    valueSummary,
    propertySummary,
    equalization,
    taxContext,
    reviewSignals,
    summary
  };
}

export async function generateAssessorsReportPdf(model) {
  const baseCtx = await createReportContext({
    title: `${displayAddress(model.data.parcel?.situsAddress) || "Property"} Supplemental Review Report`
  });

  drawAssessorRecordPage(addReportPage(baseCtx), model);
  drawAssessorValuePage(addReportPage(baseCtx), model);
  drawAssessorEqualizationPage(addReportPage(baseCtx), model);
  drawAssessorTaxSummaryPage(addReportPage(baseCtx), model);

  return baseCtx.doc.save();
}

function assessorsReportFilename(data) {
  return `supplemental-review-report-${fileSafe(data?.parcel?.parcelId || data?.parcel?.situsAddress)}.pdf`;
}

function drawAssessorHeader(ctx, model, sectionLabel) {
  const address = displayAddress(model.data.parcel?.situsAddress) || "Subject property";
  const identity = [
    `Parcel ${model.data.parcel?.parcelId ?? "-"}`,
    model.data.classification?.propertyClass,
    model.propertySummary.valuationGroupLabel
  ].filter(Boolean).join(" / ");

  drawText(ctx, "Supplemental Property Review Report", ctx.margin, ctx.height - ctx.margin, {
    size: 17,
    bold: true,
    color: ctx.palette.navy
  });
  drawText(ctx, sectionLabel, ctx.margin, ctx.height - ctx.margin - 15, {
    size: 8,
    bold: true,
    color: ctx.palette.muted
  });
  drawText(ctx, `Generated ${formatDateTime(model.generatedAt)}`, ctx.width - ctx.margin - 160, ctx.height - ctx.margin - 2, {
    size: 7.2,
    color: ctx.palette.muted
  });
  drawRule(ctx, ctx.margin, ctx.height - ctx.margin - 24, ctx.width - ctx.margin, { color: ctx.palette.line });
  drawText(ctx, address, ctx.margin, ctx.height - ctx.margin - 40, { size: 11, bold: true });
  drawText(ctx, identity, ctx.margin + 220, ctx.height - ctx.margin - 40, { size: 7.8, color: ctx.palette.muted });
}

function drawAssessorFooter(ctx, model, pageNumber) {
  drawRule(ctx, ctx.margin, 24, ctx.width - ctx.margin, { thickness: 0.45, color: ctx.palette.line });
  drawWrappedText(ctx, `Supplemental review document generated from loaded prototype parcel data. Sources: ${sourceList(model) || "loaded parcel datasets"}.`, ctx.margin, 15, ctx.contentWidth - 50, {
    size: 6.5,
    color: ctx.palette.muted,
    maxLines: 1
  });
  drawText(ctx, `Page ${pageNumber}`, ctx.width - ctx.margin - 34, 15, { size: 6.8, color: ctx.palette.muted });
}

function drawAssessorRecordPage(ctx, model) {
  const { data, recordCard, propertySummary, valueSummary } = model;
  const residential = data.residential ?? {};
  const classification = data.classification ?? {};
  const parcel = data.parcel ?? {};
  const location = recordCard?.locationModel ?? {};
  const residentialInfo = recordCard?.residentialInformation ?? {};

  drawAssessorHeader(ctx, model, "Record card and parcel identity");

  const top = ctx.height - ctx.margin - 66;
  const gap = 14;
  const colW = (ctx.contentWidth - gap * 2) / 3;
  const x1 = ctx.margin;
  const x2 = x1 + colW + gap;
  const x3 = x2 + colW + gap;

  drawSectionTitle(ctx, "Parcel identity", x1, top, colW);
  drawKeyValueRows(ctx, [
    ["Parcel ID", parcel.parcelId],
    ["Map / geocode", [parcel.mapNumber, parcel.stateGeoCode].filter(Boolean).join(" / ")],
    ["Owner", parcel.owner],
    ["Mailing", displayMailingAddress(parcel.mailingAddress)],
    ["Situs", displayAddress(parcel.situsAddress)],
    ["Legal", parcel.legalDescription],
    ["Tax district", parcel.taxDistrict],
    ["School district", parcel.schoolDistrict]
  ], x1, top - 20, colW, { labelWidth: 76, rowGap: 13, valueLines: 2 });

  drawSectionTitle(ctx, "Classification and location", x2, top, colW);
  drawKeyValueRows(ctx, [
    ["Status", classification.status],
    ["Class / type", [classification.propertyClass, parcel.accountType].filter(Boolean).join(" / ")],
    ["Location", classification.location],
    ["Zoning", classification.zoning],
    ["County area", location.countyArea],
    ["Neighborhood", location.neighborhood],
    ["Valuation group", location.valuationGroup],
    ["Model / method", [location.model, location.method].filter(Boolean).join(" / ")]
  ], x2, top - 20, colW, { labelWidth: 82, rowGap: 13, valueLines: 2 });

  drawSectionTitle(ctx, "Dwelling record", x3, top, colW);
  drawKeyValueRows(ctx, [
    ["Type / style", [residentialInfo.type, residential.style ?? residentialInfo.style].filter(Boolean).join(" / ")],
    ["Year built", residential.yearBuilt],
    ["Effective age", effectiveAge(recordCard)],
    ["Living area", squareFeet(residential.buildingSize)],
    ["Basement", basementSummary(residential, residentialInfo)],
    ["Bed / bath", bedroomsBathrooms(residential, residentialInfo)],
    ["Quality / cond.", [residential.quality ?? residentialInfo.quality, residential.condition ?? residentialInfo.condition].filter(Boolean).join(" / ")],
    ["Heat / exterior", [residential.heatingCooling ?? residentialInfo.heatingCooling, residential.exterior ?? residentialInfo.exteriorWall].filter(Boolean).join(" / ")]
  ], x3, top - 20, colW, { labelWidth: 82, rowGap: 13, valueLines: 2 });

  const mid = 246;
  drawSectionTitle(ctx, "Land and improvements", x1, mid, colW);
  drawKeyValueRows(ctx, [
    ["Land area", propertySummary.landArea],
    ["Land model", recordCard?.landModel?.description],
    ["Recorded land value", formatNullableMoney(recordCard?.landModel?.recordedLotValue)],
    ["Garage", [residential.garage1, residential.garage2].filter(Boolean).join("; ")],
    ["Garage lines", countLabel(recordCard?.garageCostLines?.length, "line")],
    ["Outbuildings", propertySummary.outbuildingSummary],
    ["Misc. improvements", propertySummary.miscImprovementSummary],
    ["Review history", propertySummary.reviewHistorySummary]
  ], x1, mid - 20, colW, { labelWidth: 86, rowGap: 13, valueLines: 2 });

  drawSectionTitle(ctx, "Current value reconciliation", x2, mid, colW);
  drawTable(ctx, [
    { key: "component", label: "Component", width: 1.2 },
    { key: "prior", label: `${valueSummary.prior.year ?? "Prior"}`, width: 0.82, align: "right" },
    { key: "current", label: `${valueSummary.current.year ?? "Current"}`, width: 0.82, align: "right" },
    { key: "change", label: "Change", width: 0.82, align: "right" }
  ], valueBreakdownTableRows(model), x2, mid - 20, colW, { rowHeight: 17, fontSize: 7.1 });

  drawSectionTitle(ctx, "Data-quality scan", x3, mid, colW);
  drawCompactRows(ctx, propertySummary.dataQualityRows.slice(0, 5).map(row => ({
    title: `${row[0]} / ${row[1]}`,
    body: row[2]
  })), x3, mid - 20, colW, 118);

  drawAssessorFooter(ctx, model, 1);
}

function drawAssessorValuePage(ctx, model) {
  const { recordCard, valueSummary } = model;
  const cost = recordCard?.costApproach ?? {};
  const depreciation = cost.depreciation ?? {};
  const current = valueSummary.current;

  drawAssessorHeader(ctx, model, "Value movement and cost-model evidence");

  const top = ctx.height - ctx.margin - 70;
  const leftW = 438;
  const rightX = ctx.margin + leftW + 18;
  const rightW = ctx.width - ctx.margin - rightX;

  drawSectionTitle(ctx, `${valueSummary.prior.year ?? "Prior"} to ${valueSummary.current.year ?? "Current"} value movement`, ctx.margin, top, leftW);
  drawValueComponentBars(ctx, model, ctx.margin, top - 182, leftW, 150);
  drawTable(ctx, [
    { key: "component", label: "Component", width: 1.35 },
    { key: "prior", label: "Prior", width: 0.85, align: "right" },
    { key: "current", label: "Current", width: 0.85, align: "right" },
    { key: "change", label: "Change", width: 0.85, align: "right" },
    { key: "percent", label: "%", width: 0.55, align: "right" }
  ], valueBreakdownTableRows(model, true), ctx.margin, top - 210, leftW, { rowHeight: 16, fontSize: 7 });

  drawSectionTitle(ctx, "Replacement cost detail", rightX, top, rightW);
  drawKeyValueRows(ctx, [
    ["Year / effective age", cost.yearEffectiveAge],
    ["Base cost", numberOrMoneyCents(cost.baseCost)],
    ["Adjusted cost", decimalValue(cost.adjustedCost, 3)],
    ["RCN", formatNullableMoney(cost.rcn)],
    ["Total RCN", formatNullableMoney(cost.totalRcn)],
    ["Physical depreciation", percentWhole(depreciation.physicalPercent)],
    ["Functional depreciation", percentWhole(depreciation.functionalPercent)],
    ["Depreciation amount", formatNullableMoney(depreciation.amount)],
    ["RCNLD", formatNullableMoney(cost.rcnld)],
    ["Adjusted RCNLD", formatNullableMoney(cost.adjustedRcnld)],
    ["Cost per sq. ft.", numberOrMoneyCents(cost.costPerSquareFoot)]
  ], rightX, top - 20, rightW, { labelWidth: 118, rowGap: 13 });

  const lowerTop = 198;
  drawSectionTitle(ctx, "Quality, condition, and model inputs", ctx.margin, lowerTop, leftW);
  drawKeyValueRows(ctx, [
    ["Residential quality", recordCard?.residentialInformation?.quality],
    ["Residential condition", recordCard?.residentialInformation?.condition],
    ["Architecture", recordCard?.residentialInformation?.architecture],
    ["Base / total area", recordCard?.residentialInformation?.baseTotalArea],
    ["Roof cover", recordCard?.residentialInformation?.roofCover],
    ["Heating / cooling", recordCard?.residentialInformation?.heatingCooling],
    ["Total improvement value", formatNullableMoney(nullableSubtract(current.total, current.land))]
  ], ctx.margin, lowerTop - 20, leftW, { labelWidth: 124, rowGap: 13, valueLines: 2 });

  drawSectionTitle(ctx, "Cost adjustments", rightX, lowerTop, rightW);
  drawTable(ctx, [
    { key: "adjustment", label: "Adjustment", width: 1.3 },
    { key: "value", label: "Value", width: 0.7, align: "right" }
  ], Object.entries(cost.adjustments ?? {}).map(([label, value]) => ({
    adjustment: titleCase(label),
    value: decimalValue(value, 2)
  })).slice(0, 7), rightX, lowerTop - 20, rightW, { rowHeight: 15, fontSize: 7.2 });

  drawAssessorFooter(ctx, model, 2);
}

function drawAssessorEqualizationPage(ctx, model) {
  const { equalization } = model;

  drawAssessorHeader(ctx, model, "Equalization and market-area evidence");

  const top = ctx.height - ctx.margin - 70;
  const gap = 18;
  const chartW = 430;
  const tableX = ctx.margin + chartW + gap;
  const tableW = ctx.width - ctx.margin - tableX;

  drawSectionTitle(ctx, "County ratio-study metric trend", ctx.margin, top, chartW);
  drawMetricTrendChart(ctx, equalization.ratioChartRecords, ctx.margin, top - 192, chartW, 160);
  drawText(ctx, "COD, PRD, and level-of-value are normalized to comparable positions so movement can be read together.", ctx.margin, top - 210, {
    size: 7.4,
    color: ctx.palette.muted
  });

  drawSectionTitle(ctx, "Market-area comparison", tableX, top, tableW);
  drawTable(ctx, [
    { key: "metric", label: "Metric", width: 1 },
    { key: "subject", label: "Subject group", width: 1.15 },
    { key: "county", label: "County / class", width: 1.15 }
  ], equalization.marketComparisonRows.map(row => ({
    metric: row[0],
    subject: displayValue(row[1], { fallback: "-" }),
    county: displayValue(row[2], { fallback: "-" })
  })).slice(0, 8), tableX, top - 20, tableW, { rowHeight: 16, fontSize: 6.9 });

  const lowerTop = 226;
  drawSectionTitle(ctx, "Alignment read", ctx.margin, lowerTop, chartW);
  drawCompactRows(ctx, equalization.alignmentRows.map(row => ({
    title: `${row[0]} / ${row[1]}`,
    body: row[2]
  })), ctx.margin, lowerTop - 20, chartW, 145);

  drawSectionTitle(ctx, "Ratio-study table", tableX, lowerTop, tableW);
  drawTable(ctx, [
    { key: "year", label: "Year", width: 0.45 },
    { key: "sales", label: "Sales", width: 0.55, align: "right" },
    { key: "lov", label: "LOV", width: 0.6, align: "right" },
    { key: "cod", label: "COD", width: 0.52, align: "right" },
    { key: "prd", label: "PRD", width: 0.52, align: "right" },
    { key: "cov", label: "COV", width: 0.52, align: "right" }
  ], equalization.ratioTrendRows.map(row => ({
    year: row[0],
    sales: row[1],
    lov: row[2],
    cod: row[3],
    prd: row[4],
    cov: row[5]
  })), tableX, lowerTop - 20, tableW, { rowHeight: 16, fontSize: 7.1 });

  drawAssessorFooter(ctx, model, 3);
}

function drawAssessorTaxSummaryPage(ctx, model) {
  const { data, taxContext, summary, reviewSignals } = model;

  drawAssessorHeader(ctx, model, "Tax context, review signals, and conclusion");

  const top = ctx.height - ctx.margin - 70;
  const gap = 18;
  const colW = (ctx.contentWidth - gap * 2) / 3;
  const x1 = ctx.margin;
  const x2 = x1 + colW + gap;
  const x3 = x2 + colW + gap;

  drawVerticalRule(ctx, x2 - gap / 2, top + 12, 52, { color: ctx.palette.line, thickness: 0.55 });
  drawVerticalRule(ctx, x3 - gap / 2, top + 12, 52, { color: ctx.palette.line, thickness: 0.55 });

  drawSectionTitle(ctx, "Tax history", x1, top, colW);
  drawLineChart(ctx, taxHistoryPoints(data, "taxes"), x1, top - 120, colW, 92, {
    valueLabel: "Net tax trend",
    color: ctx.palette.green
  });
  drawKeyValueRows(ctx, [
    ["Latest net tax", formatNullableMoney(taxContext.latestNetTax, true)],
    ["Gross / credits", [formatNullableMoney(taxContext.latestStatement?.grossTaxAmount, true), formatNullableMoney(taxContext.latestCreditAmount, true)].filter(Boolean).join(" / ")],
    ["Effective tax rate", formatNullablePercent(taxContext.effectiveTaxRate)],
    ["Latest final levy", formatNullableLevy(taxContext.totalLevy)],
    ["Tax status", taxContext.taxStatus]
  ], x1, top - 142, colW, { labelWidth: 92, rowGap: 13, valueLines: 2 });

  drawSectionTitle(ctx, "Levy share", x2, top, colW);
  drawHorizontalShareBars(ctx, taxContext.levyChartRows, x2, top - 148, colW, 118);
  drawTable(ctx, [
    { key: "body", label: "Taxing body", width: 1.35 },
    { key: "rate", label: "Rate", width: 0.55, align: "right" },
    { key: "share", label: "Share", width: 0.45, align: "right" }
  ], taxContext.levyRows.slice(0, 6).map(row => ({
    body: row[0],
    rate: row[2],
    share: row[3]
  })), x2, top - 174, colW, { rowHeight: 14, fontSize: 6.6 });

  drawSectionTitle(ctx, "Review signals", x3, top, colW);
  drawCompactRows(ctx, reviewSignals.rows.slice(0, 5).map(row => ({
    title: `${row.signal} / ${row.status}`,
    body: row.why
  })), x3, top - 20, colW, 190);

  const conclusionY = 198;
  drawSectionTitle(ctx, "Working conclusion", x1, conclusionY, ctx.contentWidth);
  drawPanel(ctx, x1, 58, ctx.contentWidth, 120, { fill: ctx.palette.panel });
  drawWrappedText(ctx, summary.posture, x1 + 12, 158, ctx.contentWidth - 24, {
    size: 9,
    bold: true,
    lineHeight: 12,
    maxLines: 2
  });
  drawList(ctx, "Key reasons", summary.reasons, x1 + 12, 124, colW - 4);
  drawList(ctx, "Unresolved questions", summary.questions, x2, 124, colW - 4);
  drawList(ctx, "Needed for stronger conclusion", summary.missingData, x3, 124, colW - 4);

  drawAssessorFooter(ctx, model, 4);
}

function valueBreakdownTableRows(model, includePercent = false) {
  const { valueSummary } = model;
  const rows = [
    ["Total assessed value", valueSummary.prior.total, valueSummary.current.total],
    ["Land value", valueSummary.prior.land, valueSummary.current.land],
    ["Dwelling / building value", valueSummary.prior.dwelling, valueSummary.current.dwelling],
    ["Other improvements", valueSummary.prior.improvement, valueSummary.current.improvement],
    ["Outbuildings", valueSummary.prior.outbuilding, valueSummary.current.outbuilding]
  ];

  return rows.map(([component, prior, current]) => {
    const change = nullableSubtract(current, prior);
    const row = {
      component,
      prior: formatNullableMoney(prior),
      current: formatNullableMoney(current),
      change: signedMoney(change)
    };
    if (includePercent) row.percent = signedPercent(percentChange(current, prior));
    return row;
  });
}

function drawCompactRows(ctx, rows, x, y, width, maxHeight) {
  let cursor = y;
  const bottom = y - maxHeight;

  rows.forEach(row => {
    if (cursor < bottom + 18) return;
    drawText(ctx, row.title, x, cursor, {
      size: 7.5,
      bold: true,
      color: ctx.palette.ink
    });
    cursor = drawWrappedText(ctx, row.body, x, cursor - 10, width, {
      size: 6.9,
      lineHeight: 8.8,
      color: ctx.palette.muted,
      maxLines: 3
    }) - 5;
  });

  return cursor;
}

function drawValueComponentBars(ctx, model, x, y, width, height) {
  const rows = [
    ["Land", model.valueSummary.current.land, ctx.palette.green],
    ["Dwelling", model.valueSummary.current.dwelling, ctx.palette.navy],
    ["Other", model.valueSummary.current.improvement, ctx.palette.amber],
    ["Outbuilding", model.valueSummary.current.outbuilding, ctx.palette.faint]
  ].filter(([, value]) => hasValue(value));
  const max = Math.max(...rows.map(([, value]) => Math.abs(Number(value))), 1);

  drawPanel(ctx, x, y, width, height, { fill: ctx.palette.white });
  drawText(ctx, "Current component values", x + 10, y + height - 16, { size: 7.5, bold: true, color: ctx.palette.muted });

  let cursor = y + height - 36;
  rows.forEach(([label, value, color]) => {
    const barWidth = Math.max(2, (Number(value) / max) * (width - 142));
    drawText(ctx, label, x + 10, cursor + 1, { size: 7.2, color: ctx.palette.ink });
    ctx.page.drawRectangle({
      x: x + 82,
      y: cursor - 2,
      width: barWidth,
      height: 8,
      color
    });
    drawText(ctx, formatNullableMoney(value), x + width - 78, cursor, { size: 7.2, bold: true, color: ctx.palette.ink });
    cursor -= 21;
  });

  drawText(ctx, `Total ${formatNullableMoney(model.valueSummary.current.total)} / ${signedPercent(model.valueSummary.totalPercentChange)} from prior`, x + 10, y + 12, {
    size: 7.3,
    bold: true,
    color: ctx.palette.navy
  });
}

function drawMetricTrendChart(ctx, records, x, y, width, height) {
  const chartRecords = (records || []).filter(record => hasValue(record.cod) || hasValue(record.prd) || hasValue(record.levelOfValue));
  if (chartRecords.length < 2) {
    drawPanel(ctx, x, y, width, height, { fill: ctx.palette.white });
    drawText(ctx, "Ratio-study chart unavailable", x + 10, y + height - 18, { size: 8, bold: true, color: ctx.palette.muted });
    return;
  }

  drawPanel(ctx, x, y, width, height, { fill: ctx.palette.white });
  const plotX = x + 34;
  const plotY = y + 28;
  const plotW = width - 52;
  const plotH = height - 58;
  const series = [
    {
      key: "levelOfValue",
      label: "LOV",
      color: ctx.palette.green,
      normalize: value => (Number(value) - 85) / 20
    },
    {
      key: "cod",
      label: "COD",
      color: ctx.palette.navy,
      normalize: value => Number(value) / 35
    },
    {
      key: "prd",
      label: "PRD",
      color: ctx.palette.amber,
      normalize: value => (normalizePrd(value) - 0.95) / 0.18
    }
  ];

  for (let index = 0; index <= 3; index += 1) {
    const gy = plotY + (index / 3) * plotH;
    drawRule(ctx, plotX, gy, plotX + plotW, { thickness: 0.3, color: ctx.palette.line });
  }

  series.forEach((item, seriesIndex) => {
    const points = chartRecords
      .map((record, index) => {
        if (!hasValue(record[item.key])) return null;
        const normalized = Math.max(0, Math.min(1, item.normalize(record[item.key])));
        return {
          x: plotX + (index / (chartRecords.length - 1)) * plotW,
          y: plotY + normalized * plotH
        };
      })
      .filter(Boolean);

    points.forEach((point, index) => {
      const next = points[index + 1];
      if (next) {
        ctx.page.drawLine({
          start: { x: point.x, y: point.y },
          end: { x: next.x, y: next.y },
          thickness: 1.35,
          color: item.color
        });
      }
      ctx.page.drawCircle({ x: point.x, y: point.y, size: 2.1, color: item.color });
    });

    const legendX = plotX + seriesIndex * 48;
    ctx.page.drawRectangle({ x: legendX, y: y + height - 20, width: 10, height: 2.5, color: item.color });
    drawText(ctx, item.label, legendX + 14, y + height - 22, { size: 6.8, bold: true, color: ctx.palette.muted });
  });

  drawText(ctx, `${chartRecords[0]?.year ?? ""}`, plotX, y + 10, { size: 6.5, color: ctx.palette.muted });
  drawText(ctx, `${chartRecords.at(-1)?.year ?? ""}`, plotX + plotW - 20, y + 10, { size: 6.5, color: ctx.palette.muted });
  drawText(ctx, "Normalized position within review bands", plotX, y + height - 38, { size: 6.6, color: ctx.palette.muted });
}

function taxHistoryPoints(data, key) {
  return sortHistoryAscending(data.taxpayerHistory || [])
    .filter(row => hasValue(row?.[key]))
    .slice(-7)
    .map(row => ({
      label: `${row.year}`,
      value: Number(row[key])
    }));
}

function drawHorizontalShareBars(ctx, rows, x, y, width, height) {
  const items = (rows || []).slice(0, 5);
  drawPanel(ctx, x, y, width, height, { fill: ctx.palette.white });
  drawText(ctx, "Largest levy components", x + 10, y + height - 16, { size: 7.5, bold: true, color: ctx.palette.muted });

  let cursor = y + height - 36;
  items.forEach(item => {
    const share = Math.max(0, Math.min(1, Number(item.share) || 0));
    drawWrappedText(ctx, item.label, x + 10, cursor + 3, 76, {
      size: 6.5,
      lineHeight: 7.2,
      maxLines: 1
    });
    ctx.page.drawRectangle({
      x: x + 92,
      y: cursor,
      width: Math.max(1.5, share * (width - 146)),
      height: 8,
      color: ctx.palette.navy
    });
    drawText(ctx, formatNullablePercent(share), x + width - 42, cursor + 1, { size: 6.8, bold: true, color: ctx.palette.ink });
    cursor -= 18;
  });
}

function drawList(ctx, title, items, x, y, width) {
  drawText(ctx, title, x, y, { size: 7.4, bold: true, color: ctx.palette.navy });
  let cursor = y - 12;
  items.slice(0, 3).forEach(item => {
    drawText(ctx, "-", x, cursor, { size: 7, color: ctx.palette.muted });
    cursor = drawWrappedText(ctx, item, x + 8, cursor, width - 8, {
      size: 6.8,
      lineHeight: 8.4,
      color: ctx.palette.muted,
      maxLines: 2
    }) - 3;
  });
}

function buildValueSummary(data, recordCard) {
  const current = currentValueBreakdown(data, recordCard);
  const prior = priorValueBreakdown(data, recordCard, current?.year);
  const totalChange = nullableSubtract(current.total, prior.total);
  const totalPercentChange = percentChange(current.total, prior.total);

  return {
    current,
    prior,
    totalChange,
    totalPercentChange,
    largeChangeFlag: totalPercentChange !== null && Math.abs(totalPercentChange) >= 0.15
  };
}

function currentValueBreakdown(data, recordCard) {
  if (recordCard?.currentCardValue?.current) {
    const current = recordCard.currentCardValue.current;
    return {
      year: data.snapshotYear ?? latestKnown(data.taxpayerHistory, "assessedValue")?.year,
      land: current.landLots,
      dwelling: current.buildings,
      improvement: current.improvement,
      outbuilding: 0,
      total: current.total
    };
  }

  const row = (data.assessedValueBreakdown || [])
    .filter(item => hasValue(item?.total))
    .slice()
    .sort((a, b) => b.year - a.year)[0] ?? {};

  return normalizeBreakdown(row);
}

function priorValueBreakdown(data, recordCard, currentYear) {
  if (recordCard?.currentCardValue?.previous) {
    const prior = recordCard.currentCardValue.previous;
    return {
      year: currentYear ? currentYear - 1 : null,
      land: prior.landLots,
      dwelling: prior.buildings,
      improvement: prior.improvement,
      outbuilding: 0,
      total: prior.total
    };
  }

  const row = (data.assessedValueBreakdown || [])
    .filter(item => hasValue(item?.total) && (!currentYear || item.year < currentYear))
    .slice()
    .sort((a, b) => b.year - a.year)[0] ?? {};

  return normalizeBreakdown(row);
}

function normalizeBreakdown(row = {}) {
  return {
    year: row.year,
    land: row.land,
    dwelling: row.dwelling,
    improvement: row.improvement ?? 0,
    outbuilding: row.outbuilding,
    total: row.total
  };
}

function buildPropertySummary(data, recordCard, valuationGroups) {
  const landRows = data.landInformation || [];
  const landSquareFeet = landRows.reduce((sum, row) => sum + (Number(row.squareFeet) || 0), 0);
  const valuationGroupId = `${recordCard?.locationModel?.valuationGroup ?? ""}`.match(/\d+/)?.[0];
  const valuationGroup = (valuationGroups?.valuationGroups || []).find(group =>
    String(group.valuationGroup) === String(valuationGroupId)
    && String(group.class ?? "").toLowerCase() === String(data.classification?.propertyClass ?? "").toLowerCase()
  );
  const dataQualityRows = dataQualityReviewRows(data, recordCard);

  return {
    valuationGroupLabel: valuationGroup
      ? `VG ${valuationGroup.valuationGroup} - ${valuationGroup.description}`
      : recordCard?.locationModel?.valuationGroup,
    landArea: landSquareFeet
      ? `${landSquareFeet.toLocaleString()} sq. ft. / ${(landSquareFeet / 43560).toFixed(2)} ac.`
      : data.classification?.lotSize,
    outbuildingSummary: data.outbuildingData?.length
      ? countLabel(data.outbuildingData.length, "record")
      : "No outbuilding records listed",
    miscImprovementSummary: recordCard?.miscImprovements?.length
      ? `${countLabel(recordCard.miscImprovements.length, "item")} / ${formatNullableMoney(sumBy(recordCard.miscImprovements, "value"))}`
      : "No miscellaneous improvement records listed",
    noteSummary: data.propertyNotes?.length ? countLabel(data.propertyNotes.length, "note") : "No public property notes listed",
    reviewHistorySummary: recordCard?.reviewHistory?.length ? countLabel(recordCard.reviewHistory.length, "entry") : "No review history listed",
    dataQualityRows,
    hasDataQualityFlags: dataQualityRows.some(row => row[1] === "Flagged")
  };
}

function dataQualityReviewRows(data, recordCard) {
  const residential = data.residential ?? {};
  const rows = [
    missingRow("Situs address", data.parcel?.situsAddress, "Confirm parcel identity before relying on valuation context."),
    missingRow("Owner name", data.parcel?.owner, "Owner name supports meeting and review packet routing."),
    missingRow("Property class", data.classification?.propertyClass, "Class drives assessment standards and peer context."),
    missingRow("Year built", residential.yearBuilt, "Year built affects depreciation and market comparison."),
    missingRow("Living area", residential.buildingSize, "Building size is a primary valuation input."),
    suspiciousNumberRow("Bedrooms", residential.bedrooms, "Zero or missing bedroom count may indicate record-card review is needed."),
    suspiciousNumberRow("Bathrooms", residential.bathrooms, "Zero or missing bathroom count may indicate record-card review is needed."),
    suspiciousNumberRow("Plumbing fixtures", residential.plumbingFixtures, "Zero or missing plumbing fixture count can affect cost-model inputs."),
    missingRow("Quality", residential.quality ?? recordCard?.residentialInformation?.quality, "Quality supports replacement-cost and market-review interpretation."),
    missingRow("Condition", residential.condition ?? recordCard?.residentialInformation?.condition, "Condition supports depreciation and review posture."),
    missingRow("Land information", data.landInformation?.length, "Land area and land model should be checked for parcel-context review.")
  ];
  const flagged = rows.filter(row => row[1] === "Flagged");

  return flagged.length ? flagged : [["Core record fields", "No notable flag", "Loaded parcel data includes the core fields checked by this report."]];
}

function missingRow(label, value, note) {
  return [label, hasDisplayValue(value) ? "No notable flag" : "Flagged", note];
}

function suspiciousNumberRow(label, value, note) {
  const numeric = Number(value);
  const flagged = !hasDisplayValue(value) || Number.isNaN(numeric) || numeric <= 0;
  return [label, flagged ? "Flagged" : "No notable flag", note];
}

function buildEqualizationContext(data, recordCard, context) {
  const marketClass = getParcelMarketClass(data);
  const classStats = getClassMarketStats(context.marketPositionData, marketClass);
  const selectedMarket = getSelectedMarketGroup(recordCard, classStats);
  const countywide = getCountywideMarketPoint(classStats);
  const medianRange = getMedianRatioRange(classStats, context.iaaoStandards);
  const codRange = getCodInterpretationRange(classStats, context.iaaoStandards);
  const prdRange = context.iaaoStandards?.prdStandards?.acceptableRange ?? { min: 0.98, max: 1.03 };
  const ratioClass = (context.ratioData?.classes || []).find(item => item.key === marketClass)
    ?? context.ratioData?.classes?.[0];
  const ratioRecords = (ratioClass?.records || []).slice().sort((a, b) => b.year - a.year);
  const latestRatioRecord = ratioRecords[0];
  const alignmentRows = buildAlignmentRows(selectedMarket, latestRatioRecord, medianRange, codRange, prdRange);
  const flagged = alignmentRows.some(row => row[1] === "May warrant review");

  return {
    marketClass,
    selectedMarket,
    countywide,
    latestRatioRecord,
    alignmentRows,
    flagged,
    posture: flagged ? "may warrant review" : "appears aligned",
    marketComparisonRows: [
      ["Comparison group", selectedMarket?.label, countywide?.label],
      ["Qualified sales", integer(selectedMarket?.count), integer(countywide?.count)],
      ["Median ratio / level", wholePercent(selectedMarket?.median), wholePercent(countywide?.median)],
      ["Mean ratio", wholePercent(selectedMarket?.mean), wholePercent(countywide?.mean)],
      ["Weighted mean", wholePercent(selectedMarket?.weightedMean), wholePercent(countywide?.weightedMean)],
      ["COD", decimalValue(selectedMarket?.cod, 2), decimalValue(countywide?.cod, 2)],
      ["PRD", marketPrd(selectedMarket?.prd), marketPrd(countywide?.prd)],
      ["Average sale price", formatNullableMoney(selectedMarket?.averageAdjustedSalePrice), formatNullableMoney(countywide?.averageAdjustedSalePrice)],
      ["Average assessed value", formatNullableMoney(selectedMarket?.averageAssessedValue), formatNullableMoney(countywide?.averageAssessedValue)]
    ],
    ratioTrendRows: ratioRecords.slice(0, 5).map(row => [
      row.year,
      integer(row.sales),
      wholePercent(row.levelOfValue),
      decimalValue(row.cod, 2),
      decimalValue(row.prd, 3),
      decimalValue(row.cov, 2)
    ]),
    ratioChartRecords: ratioRecords
      .slice(0, 8)
      .sort((a, b) => a.year - b.year)
      .map(row => ({
        year: row.year,
        sales: row.sales,
        levelOfValue: row.levelOfValue,
        cod: row.cod,
        prd: row.prd,
        cov: row.cov
      }))
  };
}

function buildAlignmentRows(selectedMarket, latestRatioRecord, medianRange, codRange, prdRange) {
  return [
    rangeAlignmentRow(
      "Local median ratio",
      selectedMarket?.median,
      medianRange,
      "Local group median appears within the available level-of-value range.",
      "Local group median appears outside the available level-of-value range."
    ),
    rangeAlignmentRow(
      "Local COD",
      selectedMarket?.cod,
      codRange,
      "Local uniformity measure appears within the available COD reference range.",
      "Local uniformity measure appears outside the available COD reference range."
    ),
    rangeAlignmentRow(
      "Local PRD",
      normalizePrd(selectedMarket?.prd),
      prdRange,
      "Local vertical-equity measure appears within the available PRD reference range.",
      "Local vertical-equity measure appears outside the available PRD reference range."
    ),
    rangeAlignmentRow(
      "County class level of value",
      latestRatioRecord?.levelOfValue,
      medianRange,
      "County class level appears within the available level-of-value range.",
      "County class level appears outside the available level-of-value range."
    ),
    rangeAlignmentRow(
      "County class COD",
      latestRatioRecord?.cod,
      codRange,
      "County class COD appears within the available COD reference range.",
      "County class COD appears outside the available COD reference range."
    )
  ];
}

function rangeAlignmentRow(label, value, range, alignedReason, reviewReason) {
  if (!hasValue(value) || !range) return [label, "Not available", "Available data does not support a report status."];
  const aligned = Number(value) >= Number(range.min) && Number(value) <= Number(range.max);
  return [label, aligned ? "Appears aligned" : "May warrant review", aligned ? alignedReason : reviewReason];
}

function buildTaxContext(data, taxDistrictAuthorities) {
  const latestStatement = (data.taxStatements || [])
    .filter(statement => hasValue(statement?.netAmountDue ?? statement?.totalTaxesDue))
    .slice()
    .sort((a, b) => b.taxYear - a.taxYear)[0];
  const district = (taxDistrictAuthorities?.districts || []).find(item =>
    String(item.taxDistrict) === String(data.parcel?.taxDistrict)
  );
  const levyComponents = district?.authorities?.length
    ? district.authorities.map(item => ({
      description: item.description,
      group: item.category,
      rate: item.levy
    }))
    : data.latestFinalLevyComponents || [];
  const totalLevy = district?.districtLevy ?? sumRates(levyComponents);
  const latestNetTax = latestStatement?.netAmountDue ?? latestStatement?.totalTaxesDue ?? latestKnown(data.taxpayerHistory, "taxes")?.taxes;
  const latestCreditAmount = latestStatement ? statementTotalCredits(latestStatement) : null;
  const effectiveTaxRate = latestStatement?.derived?.netEffectiveTaxRate
    ?? calculateEtr({ assessedValue: latestStatement?.assessedValue, taxes: latestNetTax });
  const largestAuthority = levyComponents.slice().sort((a, b) => b.rate - a.rate)[0];

  return {
    latestStatement,
    latestNetTax,
    latestCreditAmount,
    effectiveTaxRate,
    totalLevy,
    districtDescription: district?.districtDescription,
    districtLabel: district ? `TD ${district.taxDistrict} / ${district.districtDescription}` : `TD ${data.parcel?.taxDistrict}`,
    authorityCount: district?.authorityCount ?? levyComponents.length,
    largestAuthority: largestAuthority ? `${largestAuthority.description} (${formatNullableLevy(largestAuthority.rate)})` : null,
    levyYear: district?.taxYear ?? data.latestFinalTaxYear,
    taxStatus: data.snapshotYear && data.latestFinalTaxYear && data.snapshotYear > data.latestFinalTaxYear
      ? `${data.snapshotYear} taxes pending; ${data.latestFinalTaxYear} is latest final statement year.`
      : "Latest loaded tax statement is final.",
    levyChartRows: levyComponents
      .slice()
      .sort((a, b) => b.rate - a.rate)
      .map(row => ({
        label: row.description,
        rate: row.rate,
        share: totalLevy ? row.rate / totalLevy : null
      })),
    levyRows: levyComponents
      .slice()
      .sort((a, b) => b.rate - a.rate)
      .map(row => {
        const share = totalLevy ? row.rate / totalLevy : null;
        return [
          row.description,
          row.group,
          formatNullableLevy(row.rate),
          formatNullablePercent(share),
          formatNullableMoney(100000 * (row.rate / 100), true)
        ];
      })
  };
}

function buildReportReviewSignals(data, recordCard, valueSummary, equalization) {
  const modelSignals = data.snapshotModel?.viewModels?.reviewSignals
    ?? buildReviewSignalModel(data, recordCard);
  const rows = modelSignals.signals.map(item => ({
    signal: item.title,
    status: item.tone === "review" ? "Flagged" : item.tone === "steady" ? "Clear" : "Monitor",
    why: item.summary,
    action: item.detail
  }));

  rows.push({
    signal: "Local market equalization indicators",
    status: equalization.flagged ? "Flagged" : "Clear",
    why: equalization.flagged
      ? "One or more available local or class equalization indicators appears outside the reference range."
      : "Available local and class equalization indicators appear generally aligned with the reference ranges used by this report.",
    action: equalization.flagged
      ? "Review local sale group, class ratio study, and parcel valuation inputs before any official review or response."
      : "Document the supporting market-area and county-class indicators if an official review or response needs equalization context."
  });

  rows.push({
    signal: "Dwelling value increase exceeds threshold",
    status: valueSummary.largeChangeFlag ? "Flagged" : "Clear",
    why: valueSummary.largeChangeFlag
      ? "Large single-year changes may require secondary review."
      : "Latest loaded single-year value change does not exceed the report threshold.",
    action: valueSummary.largeChangeFlag
      ? "Confirm property characteristics and valuation model inputs."
      : "No threshold-based secondary review is indicated by this report."
  });

  return {
    posture: rows.some(row => row.status === "Flagged") ? "review-helpful" : "generally-consistent",
    rows
  };
}

function buildWorkingConclusion(data, valueSummary, propertySummary, equalization, reviewSignals) {
  const flagged = reviewSignals.rows.filter(row => row.status === "Flagged");
  const current = valueSummary.current;
  const prior = valueSummary.prior;
  const valueMovement = `${formatNullableMoney(prior.total)} to ${formatNullableMoney(current.total)} (${signedPercent(valueSummary.totalPercentChange)})`;
  const posture = flagged.length
    ? "Based on available data, this property shows review signals that may warrant closer inspection before any official review or response."
    : "Based on available parcel, valuation, market-area, and tax-context data, this property appears generally aligned with the available equalization indicators.";
  const questions = [
    data.taxpayerHistory?.some(row => row.year === data.snapshotYear && !hasValue(row.assessedValue))
      ? `${data.snapshotYear} assessed value remains pending in the loaded snapshot data.`
      : null,
    "Are there recent permits, physical inspections, sales, or protest notes outside the loaded prototype data?",
    "Do official record-card component totals match the working file used for the final review?"
  ].filter(Boolean);
  const missingData = [
    "Final official assessor report, protest worksheet, and BOE packet materials.",
    "Any production-valid reconciliation notes not included in the parcel snapshot feed.",
    "Any official exhibit attachments required beyond the report charts generated from loaded parcel data."
  ];

  return {
    posture,
    reasons: [
      `Latest loaded assessed value movement: ${valueMovement}.`,
      `Equalization context ${equalization.posture} based on available local and county-class indicators.`,
      propertySummary.hasDataQualityFlags
        ? "One or more core property-record fields may need confirmation."
        : "Core record fields checked by this report are present in the loaded snapshot data.",
      flagged.length
        ? `${flagged.length} review signal(s) are flagged in this report.`
        : "No report-level review signals are flagged."
    ],
    questions,
    missingData
  };
}

function sourceList(model) {
  return [
    model.recordCard?.source?.displayCitation,
    model.context?.padRatioData?.source?.title,
    model.context?.ratioData?.source?.displayCitation,
    model.context?.taxDistrictAuthorities?.source?.title
  ].filter(Boolean).join("; ");
}

function statementTotalCredits(statement) {
  if (statement?.derived?.totalCreditAmount !== null && statement?.derived?.totalCreditAmount !== undefined) {
    return Math.abs(statement.derived.totalCreditAmount);
  }

  if (!statement?.credits) return null;

  return Math.abs(Object.values(statement?.credits || {}).reduce((sum, credit) => sum + (credit?.amount || 0), 0));
}

function nullableSubtract(current, prior) {
  if (!hasValue(current) || !hasValue(prior)) return null;
  return Number(current) - Number(prior);
}

function sumBy(rows = [], key) {
  return rows.reduce((sum, row) => sum + (Number(row?.[key]) || 0), 0);
}

function effectiveAge(recordCard) {
  const value = recordCard?.costApproach?.yearEffectiveAge;
  if (!value) return null;

  return value;
}

function basementSummary(residential, residentialInfo) {
  return [
    squareFeet(residential.basementSize),
    residential.minFinish ? `${Number(residential.minFinish).toLocaleString()} sq. ft. min finish` : null,
    residential.partFinish ? `${Number(residential.partFinish).toLocaleString()} sq. ft. part finish` : null,
    residentialInfo.basementArea
  ].filter(Boolean).join(" / ");
}

function bedroomsBathrooms(residential, residentialInfo) {
  if (hasValue(residential.bedrooms) && hasValue(residential.bathrooms)) {
    return `${residential.bedrooms} / ${residential.bathrooms}`;
  }

  return residentialInfo.bedBathroom;
}

function squareFeet(value) {
  return hasValue(value) ? `${Number(value).toLocaleString()} sq. ft.` : null;
}

function countLabel(count, noun) {
  if (!hasValue(count)) return null;
  return `${Number(count).toLocaleString()} ${noun}${Number(count) === 1 ? "" : "s"}`;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

function signedMoney(value) {
  if (!hasValue(value)) return "-";
  if (Number(value) === 0) return formatNullableMoney(0);

  return `${Number(value) > 0 ? "+" : "-"}${formatNullableMoney(Math.abs(Number(value)))}`;
}

function signedPercent(value) {
  if (!hasValue(value)) return "-";
  if (Number(value) === 0) return percent.format(0);

  return `${Number(value) > 0 ? "+" : "-"}${percent.format(Math.abs(Number(value)))}`;
}

function wholePercent(value) {
  if (!hasValue(value)) return "-";
  return `${Number(value).toFixed(2)}%`;
}

function percentWhole(value) {
  if (!hasValue(value)) return "-";
  return `${Number(value).toFixed(1)}%`;
}

function decimalValue(value, digits = 2) {
  if (!hasValue(value)) return "-";
  return Number(value).toFixed(digits);
}

function numberOrMoneyCents(value) {
  if (!hasValue(value)) return "-";
  return moneyCents.format(Number(value));
}

function integer(value) {
  if (!hasValue(value)) return "-";
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function marketPrd(value) {
  if (!hasValue(value)) return "-";
  const normalized = normalizePrd(value);

  return normalized ? normalized.toFixed(3) : "-";
}

function normalizePrd(value) {
  if (!hasValue(value)) return null;
  const number = Number(value);
  return number > 10 ? number / 100 : number;
}

function titleCase(value) {
  return `${value ?? ""}`
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, character => character.toUpperCase())
    .trim();
}

// TODO: Capture rendered Chart.js canvases as print-safe image snapshots when the report needs visual chart parity with the dashboard.
