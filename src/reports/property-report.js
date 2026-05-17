import { calculateEtr, formatNullableMoney, formatNullablePercent, moneyCents } from "../format.js";
import { sortHistoryAscending } from "../calculations/history.js";
import {
  displayAddress,
  displayMailingAddress
} from "../utils/address.js";
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
} from "./pdf-report-kit.js";

const integer = new Intl.NumberFormat("en-US");

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "Not listed";
  return value;
}

function formatSquareFeet(value) {
  if (value === null || value === undefined || value === "") return "Not listed";
  return `${integer.format(Number(value))} sq. ft.`;
}

function compactParts(parts, separator = " \u00b7 ") {
  return parts.filter(Boolean).join(separator);
}

function fileSafe(value) {
  return `${value ?? "property"}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function latestKnown(rows, key) {
  return (rows || [])
    .filter(row => row?.[key] !== null && row?.[key] !== undefined)
    .slice()
    .sort((a, b) => b.year - a.year)[0] ?? null;
}

function previousKnown(rows, latestYear, key) {
  return (rows || [])
    .filter(row => row.year < latestYear && row?.[key] !== null && row?.[key] !== undefined)
    .slice()
    .sort((a, b) => b.year - a.year)[0] ?? null;
}

function percentChange(current, previous) {
  if (!current || !previous) return null;
  return (current - previous) / previous;
}

function valuationGroupLabel(recordCard) {
  return `${recordCard?.locationModel?.valuationGroup ?? ""}`.trim().replace(/^\d+\s*(?:-|\u2013)\s*/, "") || "Not listed";
}

function schoolDistrictLabel(value) {
  return `${value ?? ""}`.replace(/^SCH\s*/i, "School ");
}

function garageSummary(recordCard) {
  const lines = recordCard?.garageCostLines || [];
  if (!lines.length) return "No garage records listed";
  return lines.map(line => compactParts([
    line.description,
    line.units,
    line.yearIn ? `year ${line.yearIn}` : null,
    line.rcnld ? `${formatNullableMoney(line.rcnld)} value` : null
  ], ", ")).join("; ");
}

function improvementRows(recordCard) {
  return (recordCard?.miscImprovements || []).slice(0, 5).map(item => ({
    type: item.description || item.code || "Improvement",
    size: item.size ? `${integer.format(Number(item.size))}` : "-",
    year: item.yearIn ? `${item.yearIn}` : "-",
    value: formatNullableMoney(item.value)
  }));
}

function valueRows(data, recordCard) {
  const previous = recordCard?.currentCardValue?.previous;
  const current = recordCard?.currentCardValue?.current ?? recordCard?.propertyValuation;
  const currentYear = data.snapshotYear ?? data.latestFinalTaxYear;
  const previousYear = currentYear - 1;

  return [
    {
      component: "Land",
      prior: formatNullableMoney(previous?.landLots),
      current: formatNullableMoney(current?.landLots ?? current?.landLot)
    },
    {
      component: "Building",
      prior: formatNullableMoney(previous?.buildings),
      current: formatNullableMoney(current?.buildings)
    },
    {
      component: "Other improvements",
      prior: formatNullableMoney(previous?.improvement),
      current: formatNullableMoney(current?.improvement)
    },
    {
      component: "Total",
      prior: formatNullableMoney(previous?.total),
      current: formatNullableMoney(current?.total),
      label: `${previousYear} / ${currentYear}`
    }
  ];
}

function reviewSignalSummary(data) {
  const signals = data.snapshotModel?.viewModels?.reviewSignals?.signals ?? [];
  if (!signals.length) {
    return [{
      title: "No review signals generated",
      summary: "The loaded records did not surface a specific item for closer review."
    }];
  }
  return signals.slice(0, 4);
}

function assessmentMetrics(context = {}) {
  const classStats = context.ratioData?.classes?.find(item => item.key === "residential")
    ?? context.ratioData?.classes?.[0];
  const latest = (classStats?.records || []).slice().sort((a, b) => a.year - b.year).at(-1);
  if (!latest) return [];

  return [
    ["Median ratio", latest.levelOfValue ? `${latest.levelOfValue.toFixed(2)}%` : "Not listed"],
    ["COD", latest.cod ? latest.cod.toFixed(2) : "Not listed"],
    ["PRD", latest.prd ? latest.prd.toFixed(3) : "Not listed"],
    ["Qualified sales", latest.sales ? integer.format(latest.sales) : "Not listed"]
  ];
}

function reportModel(data, recordCard, context = {}) {
  const latestValue = latestKnown(data.taxpayerHistory, "assessedValue");
  const previousValue = previousKnown(data.taxpayerHistory, latestValue?.year, "assessedValue");
  const latestTax = latestKnown(data.taxpayerHistory, "taxes");
  const previousTax = previousKnown(data.taxpayerHistory, latestTax?.year, "taxes");
  const latestEtr = calculateEtr(latestTax);
  const valueMovement = percentChange(latestValue?.assessedValue, previousValue?.assessedValue);
  const taxMovement = percentChange(latestTax?.taxes, previousTax?.taxes);
  const residential = data.residential ?? {};
  const cost = recordCard?.costApproach ?? {};

  return {
    generatedAt: new Date(),
    identity: {
      title: "Property Report",
      address: displayAddress(data.parcel.situsAddress),
      parcelId: data.parcel.parcelId,
      owner: data.parcel.owner,
      mailingAddress: displayMailingAddress(data.parcel.mailingAddress),
      legalDescription: data.parcel.legalDescription,
      county: data.parcel.countyName,
      taxDistrict: data.parcel.taxDistrict,
      schoolDistrict: schoolDistrictLabel(data.parcel.schoolDistrict),
      propertyClass: data.classification.propertyClass,
      location: data.classification.location,
      status: data.classification.status,
      zoning: data.classification.zoning,
      lotSize: data.classification.lotSize,
      valuationGroup: valuationGroupLabel(recordCard),
      neighborhood: recordCard?.locationModel?.neighborhood
    },
    characteristics: {
      type: recordCard?.residentialInformation?.type ?? data.parcel.accountType,
      yearBuilt: residential.yearBuilt,
      effectiveAge: cost.yearEffectiveAge,
      style: recordCard?.residentialInformation?.style ?? residential.style,
      architecture: recordCard?.residentialInformation?.architecture,
      quality: residential.quality ?? recordCard?.residentialInformation?.quality,
      condition: residential.condition ?? recordCard?.residentialInformation?.condition,
      buildingSize: residential.buildingSize,
      baseArea: recordCard?.residentialInformation?.baseTotalArea,
      bedroomsBathrooms: residential.bedroomsBathrooms ?? recordCard?.residentialInformation?.bedBathroom,
      basement: residential.basement ?? recordCard?.residentialInformation?.basementArea,
      exterior: recordCard?.residentialInformation?.exteriorWall,
      heatingCooling: recordCard?.residentialInformation?.heatingCooling,
      roof: recordCard?.residentialInformation?.roofCover,
      garage: garageSummary(recordCard)
    },
    land: {
      description: recordCard?.landModel?.description,
      lotSize: recordCard?.landModel?.lotSize,
      recordedLotValue: recordCard?.landModel?.recordedLotValue,
      frontage: recordCard?.landModel?.frontage
    },
    values: valueRows(data, recordCard),
    improvements: improvementRows(recordCard),
    review: {
      latestValue,
      previousValue,
      latestTax,
      previousTax,
      latestEtr,
      valueMovement,
      taxMovement,
      assessmentMetrics: assessmentMetrics(context),
      signals: reviewSignalSummary(data),
      taxDistrict: data.parcel.taxDistrict,
      latestFinalTaxYear: data.latestFinalTaxYear
    },
    history: sortHistoryAscending(data.taxpayerHistory || [])
      .filter(row => row.assessedValue !== null || row.taxes !== null)
      .slice(-6)
  };
}

function reportDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function drawReportHeader(ctx, model, subtitle) {
  drawText(ctx, model.identity.title, ctx.margin, ctx.height - ctx.margin, {
    size: 18,
    bold: true,
    color: ctx.palette.navy
  });
  drawText(ctx, subtitle, ctx.margin, ctx.height - ctx.margin - 16, {
    size: 8.6,
    color: ctx.palette.muted
  });
  drawText(ctx, `Generated ${reportDate(model.generatedAt)}`, ctx.width - ctx.margin - 106, ctx.height - ctx.margin - 2, {
    size: 7.5,
    color: ctx.palette.muted
  });
  drawRule(ctx, ctx.margin, ctx.height - ctx.margin - 25, ctx.width - ctx.margin, { color: ctx.palette.line });
}

function drawPageFooter(ctx, pageNumber) {
  drawRule(ctx, ctx.margin, 24, ctx.width - ctx.margin, { color: ctx.palette.line, thickness: 0.5 });
  drawText(ctx, "For public information and orientation. Official county and state records control.", ctx.margin, 12, {
    size: 7,
    color: ctx.palette.muted
  });
  drawText(ctx, `Page ${pageNumber}`, ctx.width - ctx.margin - 32, 12, {
    size: 7,
    color: ctx.palette.muted
  });
}

function drawRecordPage(ctx, model) {
  drawReportHeader(ctx, model, "Property record card");

  const top = ctx.height - ctx.margin - 44;
  drawPanel(ctx, ctx.margin, top - 54, ctx.contentWidth, 54, { fill: ctx.palette.panel });
  drawText(ctx, model.identity.address, ctx.margin + 12, top - 19, { size: 16, bold: true, color: ctx.palette.ink });
  drawText(ctx, compactParts([
    `Parcel ${model.identity.parcelId}`,
    model.identity.propertyClass,
    model.identity.location,
    model.identity.valuationGroup
  ]), ctx.margin + 12, top - 36, { size: 9, color: ctx.palette.muted });
  drawWrappedText(ctx, model.identity.owner, ctx.width - ctx.margin - 242, top - 18, 230, {
    size: 8.6,
    bold: true,
    maxLines: 1
  });
  drawWrappedText(ctx, model.identity.mailingAddress, ctx.width - ctx.margin - 242, top - 32, 230, {
    size: 7.8,
    color: ctx.palette.muted,
    maxLines: 2
  });

  const y = top - 76;
  const gap = 16;
  const colW = (ctx.contentWidth - gap * 2) / 3;
  const col1 = ctx.margin;
  const col2 = col1 + colW + gap;
  const col3 = col2 + colW + gap;

  drawSectionTitle(ctx, "Parcel identifiers", col1, y, colW);
  const col1Bottom = drawKeyValueRows(ctx, [
    ["Parcel ID", model.identity.parcelId],
    ["County", model.identity.county],
    ["Tax district", model.identity.taxDistrict],
    ["School district", model.identity.schoolDistrict],
    ["Neighborhood", model.identity.neighborhood],
    ["Legal", model.identity.legalDescription]
  ], col1, y - 20, colW, { rowGap: 14, valueLines: 2 });

  drawSectionTitle(ctx, "Property characteristics", col2, y, colW);
  const col2Bottom = drawKeyValueRows(ctx, [
    ["Type", model.characteristics.type],
    ["Status / zoning", compactParts([model.identity.status, model.identity.zoning], " / ")],
    ["Year built", model.characteristics.yearBuilt],
    ["Effective age", model.characteristics.effectiveAge],
    ["Style", model.characteristics.style],
    ["Quality / condition", compactParts([model.characteristics.quality, model.characteristics.condition], " / ")],
    ["Bedrooms / baths", model.characteristics.bedroomsBathrooms],
    ["Building size", formatSquareFeet(model.characteristics.buildingSize)]
  ], col2, y - 20, colW);

  drawSectionTitle(ctx, "Building and land detail", col3, y, colW);
  const col3Bottom = drawKeyValueRows(ctx, [
    ["Architecture", model.characteristics.architecture],
    ["Basement", model.characteristics.basement],
    ["Heating / cooling", model.characteristics.heatingCooling],
    ["Exterior", model.characteristics.exterior],
    ["Garage", model.characteristics.garage],
    ["Land model", model.land.description],
    ["Land size", model.land.lotSize ? `${integer.format(model.land.lotSize)} sq. ft.` : model.identity.lotSize]
  ], col3, y - 20, colW, { valueLines: 2 });

  const tableTitleY = Math.max(210, Math.min(col1Bottom, col2Bottom, col3Bottom) - 28);
  const tableY = tableTitleY - 20;
  drawSectionTitle(ctx, "Current value record", col1, tableTitleY, colW * 1.45);
  drawTable(ctx, [
    { key: "component", label: "Component", width: 1.2 },
    { key: "prior", label: "Prior", width: 0.8, align: "right" },
    { key: "current", label: "Current", width: 0.9, align: "right" }
  ], model.values, col1, tableY, colW * 1.45, { rowHeight: 16 });

  drawSectionTitle(ctx, "Improvements / outbuildings", col2 + colW * 0.45, tableTitleY, colW * 1.55);
  drawTable(ctx, [
    { key: "type", label: "Record", width: 1.5 },
    { key: "size", label: "Size", width: 0.55, align: "right" },
    { key: "year", label: "Year", width: 0.5, align: "right" },
    { key: "value", label: "Value", width: 0.65, align: "right" }
  ], model.improvements.length ? model.improvements : [{ type: "No outbuilding records listed", size: "-", year: "-", value: "-" }], col2 + colW * 0.45, tableY, colW * 1.55, { rowHeight: 16 });

  drawPageFooter(ctx, 1);
}

function drawMetricList(ctx, metrics, x, y, width) {
  let cursor = y;
  metrics.forEach(([label, value]) => {
    drawText(ctx, label, x, cursor, { size: 7.2, bold: true, color: ctx.palette.muted });
    drawText(ctx, value, x + width - 58, cursor, { size: 8.6, bold: true, color: ctx.palette.ink });
    cursor -= 13;
  });
  return cursor;
}

function drawSummaryPage(ctx, model) {
  drawReportHeader(ctx, model, "Review summary");

  const yTop = ctx.height - ctx.margin - 56;
  const gap = 18;
  const colW = (ctx.contentWidth - gap * 2) / 3;
  const x1 = ctx.margin;
  const x2 = x1 + colW + gap;
  const x3 = x2 + colW + gap;
  const columnBottom = 52;

  drawVerticalRule(ctx, x2 - gap / 2, yTop + 14, columnBottom, { color: ctx.palette.line, thickness: 0.65 });
  drawVerticalRule(ctx, x3 - gap / 2, yTop + 14, columnBottom, { color: ctx.palette.line, thickness: 0.65 });

  drawSectionTitle(ctx, "Assessment / equalization", x1, yTop, colW);
  drawLineChart(ctx, model.history.map(row => ({
    label: `${row.year}`,
    value: row.assessedValue
  })).filter(point => point.value !== null && point.value !== undefined), x1, yTop - 112, colW, 86, {
    valueLabel: "Assessed value trend",
    color: ctx.palette.navy
  });
  let cursor = yTop - 132;
  cursor = drawKeyValueRows(ctx, [
    ["Latest final value", model.review.latestValue ? `${formatNullableMoney(model.review.latestValue.assessedValue)} (${model.review.latestValue.year})` : "Not listed"],
    ["Recent movement", formatNullablePercent(model.review.valueMovement)],
    ["Valuation group", model.identity.valuationGroup]
  ], x1, cursor, colW, { rowGap: 13 });
  drawMetricList(ctx, model.review.assessmentMetrics, x1, cursor - 4, colW);

  drawSectionTitle(ctx, "Tax / levy summary", x2, yTop, colW);
  drawLineChart(ctx, model.history.map(row => ({
    label: `${row.year}`,
    value: row.taxes
  })).filter(point => point.value !== null && point.value !== undefined), x2, yTop - 112, colW, 86, {
    valueLabel: "Final tax trend",
    color: ctx.palette.green
  });
  drawKeyValueRows(ctx, [
    ["Latest final tax", model.review.latestTax ? `${moneyCents.format(model.review.latestTax.taxes)} (${model.review.latestTax.year})` : "Not listed"],
    ["Tax movement", formatNullablePercent(model.review.taxMovement)],
    ["Effective tax rate", model.review.latestEtr === null ? "Not listed" : formatNullablePercent(model.review.latestEtr)],
    ["Tax district", model.review.taxDistrict],
    ["Timing", `${model.review.latestFinalTaxYear} is the latest finalized tax year in this report.`]
  ], x2, yTop - 132, colW, { rowGap: 14, valueLines: 2 });

  drawSectionTitle(ctx, "Review signals / follow-up", x3, yTop, colW);
  let signalY = yTop - 22;
  model.review.signals.forEach(signal => {
    drawText(ctx, signal.title, x3, signalY, { size: 8.8, bold: true, color: ctx.palette.ink });
    signalY = drawWrappedText(ctx, signal.summary, x3, signalY - 12, colW, {
      size: 7.8,
      lineHeight: 10.2,
      color: ctx.palette.muted,
      maxLines: 4
    }) - 7;
  });
  const postureY = Math.max(columnBottom + 18, signalY - 58);
  drawPanel(ctx, x3, postureY, colW, 48, { fill: ctx.palette.panel });
  drawText(ctx, "Plain-English review posture", x3 + 9, postureY + 32, { size: 7.4, bold: true, color: ctx.palette.muted });
  drawWrappedText(
    ctx,
    "Verify property facts first, then use value, equalization, and tax context to decide whether official follow-up is useful.",
    x3 + 9,
    postureY + 19,
    colW - 18,
    { size: 7.6, lineHeight: 10, maxLines: 3 }
  );

  drawPageFooter(ctx, 2);
}

export async function generatePropertyReportPdf(data, recordCard, context = {}) {
  const model = reportModel(data, recordCard, context);
  const baseCtx = await createReportContext({ title: `${model.identity.address} Property Report` });
  drawRecordPage(addReportPage(baseCtx), model);
  drawSummaryPage(addReportPage(baseCtx), model);
  return baseCtx.doc.save();
}

export function propertyReportFilename(data) {
  return `property-report-${fileSafe(data?.parcel?.parcelId || data?.parcel?.situsAddress)}.pdf`;
}

export function initPropertyReportExport({ data, recordCard, context = {} }) {
  const button = document.querySelector("[data-property-report-download]");
  if (!button) return;

  button.addEventListener("click", async () => {
    const original = button.textContent;
    button.disabled = true;
    button.textContent = "Preparing report...";
    try {
      const bytes = await generatePropertyReportPdf(data, recordCard, context);
      downloadPdfBytes(bytes, propertyReportFilename(data));
      button.textContent = "Report downloaded";
      window.setTimeout(() => {
        button.textContent = original;
        button.disabled = false;
      }, 1400);
    } catch (error) {
      console.error(error);
      button.textContent = "Report unavailable";
      window.setTimeout(() => {
        button.textContent = original;
        button.disabled = false;
      }, 1800);
    }
  });
}
