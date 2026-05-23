import { calculateEtr, formatNullableMoney, formatNullablePercent, moneyCents } from "../format.js";
import { latestKnown, percentChange, previousKnown, sortHistoryAscending } from "../calculations/history.js";
import {
  displayAddress,
  displayMailingAddress
} from "../utils/address.js";
import {
  getClassMarketStats,
  getParcelMarketClass,
  getParcelMarketGroupId,
  getSelectedMarketGroup
} from "../market-stats.js";
import { compactParts, fileSafe, formatSquareFeet } from "../utils/display.js";
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

function formatRatio(value) {
  return Number.isFinite(Number(value)) ? `${Number(value).toFixed(2)}%` : "Not listed";
}

function selectedMarketSummary(data, recordCard, context = {}) {
  const classKey = getParcelMarketClass(data);
  const classStats = getClassMarketStats(context.marketPositionData, classKey);
  const groupId = getParcelMarketGroupId(recordCard, classStats?.classKey ?? classKey);
  const group = getSelectedMarketGroup(recordCard, classStats, groupId);

  return {
    classStats,
    group,
    label: marketAreaDisplayLabel(recordCard, group, classStats?.classKey ?? classKey)
  };
}

function marketAreaDisplayLabel(recordCard, group, classKey = "residential") {
  if (classKey !== "agricultural" && recordCard?.locationModel?.valuationGroup) {
    return recordCard.locationModel.valuationGroup.replace(/^(\d+)/, "VG $1");
  }

  if (group?.label) return group.label.replace(/^Valuation Group\s+/i, "VG ");

  return recordCard?.locationModel?.valuationGroup || recordCard?.locationModel?.marketArea || "Local comparison group";
}

function normalizedHistoryRows(rows = []) {
  return sortHistoryAscending(rows)
    .filter(row => row.assessedValue !== null || row.taxes !== null)
    .map(row => ({
      ...row,
      assessedValue: Number.isFinite(Number(row.assessedValue)) ? Number(row.assessedValue) : null,
      taxes: Number.isFinite(Number(row.taxes)) ? Number(row.taxes) : null,
      etr: calculateEtr(row)
    }));
}

function finalizedTaxStatements(data = {}) {
  return (data.taxStatements || [])
    .filter(row => Number.isFinite(Number(row.netAmountDue)) && Number.isFinite(Number(row.taxYear)))
    .map(row => ({
      ...row,
      netAmountDue: Number(row.netAmountDue),
      grossTaxAmount: Number.isFinite(Number(row.grossTaxAmount)) ? Number(row.grossTaxAmount) : null,
      assessedValue: Number.isFinite(Number(row.assessedValue)) ? Number(row.assessedValue) : null,
      totalCredits: statementCredits(row),
      taxYear: Number(row.taxYear)
    }))
    .sort((a, b) => a.taxYear - b.taxYear);
}

function statementCredits(statement = {}) {
  if (Number.isFinite(Number(statement.totalCredits))) return Number(statement.totalCredits);
  if (Number.isFinite(Number(statement.derived?.totalCreditAmount))) return Math.abs(Number(statement.derived.totalCreditAmount));
  const credits = statement.credits || {};
  const values = [
    credits.propertyTaxCredit,
    credits.schoolDistrictCredit,
    credits.communityCollegeCredit,
    credits.otherCredit,
    credits.homestead?.amount,
    credits.nonAgTax?.amount,
    credits.agLandTax?.amount,
    credits.schoolTax?.amount
  ].map(Number).filter(Number.isFinite);

  return values.length ? Math.abs(values.reduce((sum, value) => sum + value, 0)) : null;
}

function netChangeOverPeriod(rows = []) {
  if (rows.length < 2) return null;
  const first = rows[0];
  const last = rows.at(-1);
  if (!Number.isFinite(first?.netAmountDue) || !Number.isFinite(last?.netAmountDue)) return null;
  return last.netAmountDue - first.netAmountDue;
}

function signedMoney(value) {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return moneyCents.format(0);
  return `${value > 0 ? "+" : "-"}${moneyCents.format(Math.abs(value))}`;
}

function signedPercent(value) {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0.00%";
  return `${value > 0 ? "+" : "-"}${formatNullablePercent(Math.abs(value))}`;
}

function trendDirection(value, label) {
  if (!Number.isFinite(value)) return `${label} unavailable`;
  if (value > 0) return `${label} up`;
  if (value < 0) return `${label} down`;
  return `${label} flat`;
}

function valueMovementTitle(value) {
  if (!Number.isFinite(value)) return "Value movement";
  if (value > 0) return `Value up ${formatNullablePercent(value)}`;
  if (value < 0) return `Value down ${formatNullablePercent(Math.abs(value))}`;
  return "Value flat";
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
  const notice = data.snapshotModel?.viewModels?.notice ?? {};
  const market = selectedMarketSummary(data, recordCard, context);
  const taxStatements = finalizedTaxStatements(data);
  const peakTaxStatement = taxStatements.reduce((peak, row) => row.netAmountDue > peak.netAmountDue ? row : peak, taxStatements[0] ?? {});
  const averageNetTax = taxStatements.length
    ? taxStatements.reduce((sum, row) => sum + row.netAmountDue, 0) / taxStatements.length
    : null;
  const latestStatement = taxStatements.at(-1);
  const statementNetChange = netChangeOverPeriod(taxStatements);
  const history = normalizedHistoryRows(data.taxpayerHistory || []);

  return {
    generatedAt: new Date(),
    notice,
    identity: {
      title: "Guided Review Summary",
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
      latestFinalTaxYear: data.latestFinalTaxYear,
      reviewSignalCount: (data.snapshotModel?.viewModels?.reviewSignals?.signals ?? []).filter(signal => signal.tone === "review").length
    },
    market,
    taxStatements,
    taxSummary: {
      latestStatement,
      peakTaxStatement,
      averageNetTax,
      statementNetChange
    },
    history: history.slice(-7)
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
  ], " \u00b7 "), ctx.margin + 12, top - 36, { size: 9, color: ctx.palette.muted });
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
    ["Latest listed value", model.review.latestValue ? `${formatNullableMoney(model.review.latestValue.assessedValue)} (${model.review.latestValue.year})` : "Not listed"],
    ["Recent movement", formatNullablePercent(model.review.valueMovement)],
    ["Valuation group", model.identity.valuationGroup]
  ], x1, cursor, colW, { rowGap: 13 });
  drawMetricList(ctx, model.review.assessmentMetrics, x1, cursor - 4, colW);

  drawSectionTitle(ctx, "Tax / levy summary", x2, yTop, colW);
  drawLineChart(ctx, model.history.map(row => ({
    label: `${row.year}`,
    value: row.taxes
  })).filter(point => point.value !== null && point.value !== undefined), x2, yTop - 112, colW, 86, {
    valueLabel: "Net tax trend",
    color: ctx.palette.green
  });
  drawKeyValueRows(ctx, [
    ["Latest net tax", model.review.latestTax ? `${moneyCents.format(model.review.latestTax.taxes)} (${model.review.latestTax.year})` : "Not listed"],
    ["Tax movement", formatNullablePercent(model.review.taxMovement)],
    ["Effective tax rate", model.review.latestEtr === null ? "Not listed" : formatNullablePercent(model.review.latestEtr)],
    ["Tax district", model.review.taxDistrict],
    ["Timing", `${model.review.latestFinalTaxYear} is the latest tax statement year in this report.`]
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

const JOURNEY_STEPS = [
  "Property Record",
  "What Changed",
  "Value Detail",
  "Equalization",
  "Tax Context",
  "Review Signals",
  "Summary"
];

function drawJourneyHeader(ctx, model, stepIndex, title, pageNumber) {
  ctx.page.drawRectangle({
    x: 0,
    y: ctx.height - 48,
    width: ctx.width,
    height: 48,
    color: ctx.palette.navy
  });
  drawText(ctx, model.identity.address, ctx.margin, ctx.height - 21, {
    size: 13,
    bold: true,
    color: ctx.palette.white
  });
  drawText(ctx, compactParts([
    model.identity.propertyClass,
    model.identity.location,
    model.identity.valuationGroup
  ], " · "), ctx.margin + 250, ctx.height - 21, {
    size: 8.2,
    bold: true,
    color: ctx.palette.white
  });
  drawText(ctx, `Generated ${reportDate(model.generatedAt)}`, ctx.width - ctx.margin - 118, ctx.height - 21, {
    size: 7.2,
    color: ctx.palette.white
  });

  const trackY = ctx.height - 72;
  const startX = ctx.margin + 8;
  const gap = (ctx.contentWidth - 16) / (JOURNEY_STEPS.length - 1);
  drawRule(ctx, startX, trackY, startX + gap * (JOURNEY_STEPS.length - 1), { color: ctx.palette.line, thickness: 0.6 });
  JOURNEY_STEPS.forEach((label, index) => {
    const x = startX + gap * index;
    const complete = index < stepIndex;
    const active = index === stepIndex;
    ctx.page.drawCircle({
      x,
      y: trackY,
      size: active ? 8 : 7,
      color: complete || active ? ctx.palette.green : ctx.palette.white,
      borderColor: active ? ctx.palette.navy : ctx.palette.line,
      borderWidth: active ? 1.4 : 0.8
    });
    drawText(ctx, `${index + 1}`, x - 2.3, trackY - 2.5, {
      size: 6.5,
      bold: true,
      color: complete || active ? ctx.palette.white : ctx.palette.muted
    });
    drawText(ctx, label, x - 24, trackY - 18, {
      size: 5.8,
      bold: active,
      color: active ? ctx.palette.navy : ctx.palette.muted
    });
  });

  drawText(ctx, title, ctx.margin, ctx.height - 112, {
    size: 19,
    bold: true,
    color: ctx.palette.ink
  });
  drawText(ctx, `Page ${pageNumber}`, ctx.width - ctx.margin - 34, 18, { size: 7, color: ctx.palette.muted });
}

function drawTransition(ctx, text, x, y, width) {
  drawRule(ctx, x, y, x + 76, { color: ctx.palette.navy, thickness: 1.2 });
  drawRule(ctx, x, y - 1.8, x + 76, { color: ctx.palette.line, thickness: 0.8 });
  drawWrappedText(ctx, text, x, y - 22, width, {
    size: 11.6,
    lineHeight: 15.5,
    bold: true,
    color: ctx.palette.green,
    maxLines: 3
  });
}

function drawMiniCard(ctx, card, x, y, width, height, options = {}) {
  drawPanel(ctx, x, y - height, width, height, {
    fill: options.fill ?? ctx.palette.white,
    border: ctx.palette.line
  });
  drawText(ctx, card.kicker, x + 10, y - 15, {
    size: 6.7,
    bold: true,
    color: ctx.palette.muted
  });
  drawWrappedText(ctx, card.title, x + 10, y - 31, width - 20, {
    size: options.titleSize ?? 11.5,
    lineHeight: 13.5,
    bold: true,
    color: ctx.palette.ink,
    maxLines: 2
  });
  drawWrappedText(ctx, card.body, x + 10, y - 58, width - 20, {
    size: 7.8,
    lineHeight: 10.4,
    color: ctx.palette.muted,
    maxLines: options.bodyLines ?? 4
  });
}

function drawCardGrid(ctx, cards, x, y, width, options = {}) {
  const columns = options.columns ?? 2;
  const gap = options.gap ?? 12;
  const height = options.height ?? 92;
  const cardW = (width - gap * (columns - 1)) / columns;
  cards.forEach((card, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    drawMiniCard(ctx, card, x + col * (cardW + gap), y - row * (height + gap), cardW, height, options);
  });
}

function drawJourneyFooter(ctx) {
  drawRule(ctx, ctx.margin, 32, ctx.width - ctx.margin, { color: ctx.palette.line, thickness: 0.45 });
  drawText(ctx, "Guided Parcel Review · public-information review aid. Official county and state records control.", ctx.margin, 18, {
    size: 7,
    color: ctx.palette.muted
  });
}

function historyPoints(model, key) {
  return model.history
    .filter(row => Number.isFinite(row[key]))
    .map(row => ({ label: `${row.year}`, value: row[key] }));
}

function drawPropertyAndChangePage(ctx, model) {
  drawJourneyHeader(ctx, model, 0, "Property Record + What Changed", 1);
  drawTransition(ctx, "Start with the record facts, then read what changed before moving into comparison context.", ctx.margin, ctx.height - 136, ctx.contentWidth);

  const top = ctx.height - 214;
  const gap = 14;
  const cardW = (ctx.contentWidth - gap) / 2;
  drawCardGrid(ctx, [
    {
      kicker: "Step 1 · Property Record",
      title: `${model.identity.propertyClass} property`,
      body: compactParts([
        `Parcel ${model.identity.parcelId}`,
        formatSquareFeet(model.characteristics.buildingSize),
        compactParts([model.characteristics.quality, model.characteristics.condition], " / "),
        `tax district ${model.identity.taxDistrict}`
      ], "; ")
    },
    {
      kicker: "Step 2 · What Changed",
      title: valueMovementTitle(model.review.valueMovement),
      body: model.review.latestValue && model.review.previousValue
        ? `${formatNullableMoney(model.review.previousValue.assessedValue)} to ${formatNullableMoney(model.review.latestValue.assessedValue)} · ${model.review.previousValue.year}-${model.review.latestValue.year}. This sets the property value in the ${model.review.latestValue.year} assessment base.`
        : "Value movement depends on which assessment years are available."
    }
  ], ctx.margin, top, ctx.contentWidth, { columns: 2, height: 106, bodyLines: 5 });

  const tableTop = top - 136;
  drawSectionTitle(ctx, "Record details carried forward", ctx.margin, tableTop, cardW);
  drawKeyValueRows(ctx, [
    ["Owner", model.identity.owner],
    ["Mailing address", model.identity.mailingAddress],
    ["Legal description", model.identity.legalDescription],
    ["School district", model.identity.schoolDistrict],
    ["Neighborhood", model.identity.neighborhood]
  ], ctx.margin, tableTop - 20, cardW, { valueLines: 2, rowGap: 15 });

  drawSectionTitle(ctx, "Value components", ctx.margin + cardW + gap, tableTop, cardW);
  drawTable(ctx, [
    { key: "component", label: "Component", width: 1.2 },
    { key: "prior", label: "Prior", width: 0.8, align: "right" },
    { key: "current", label: "Current", width: 0.85, align: "right" }
  ], model.values, ctx.margin + cardW + gap, tableTop - 18, cardW, { rowHeight: 17 });

  drawJourneyFooter(ctx);
}

function drawValueAndEqualizationPage(ctx, model) {
  drawJourneyHeader(ctx, model, 2, "Value Detail + Equalization", 2);
  drawTransition(ctx, "Next, compare the property with its local group, then read equalization as a uniformity and level check.", ctx.margin, ctx.height - 136, ctx.contentWidth);

  const top = ctx.height - 216;
  const gap = 14;
  const colW = (ctx.contentWidth - gap) / 2;
  const group = model.market.group;
  const countywide = model.market.classStats?.countywide;
  drawCardGrid(ctx, [
    {
      kicker: "Step 3 · Value Detail",
      title: model.market.label,
      body: group
        ? `${integer.format(group.count ?? 0)} qualified sales. Median ratio ${formatRatio(group.median)}, COD ${formatRatio(group.cod)}, PRD ${formatRatio(group.prd)}.`
        : "Local market-area data was not available for this parcel."
    },
    {
      kicker: "Step 4 · Equalization",
      title: "Uniform and proportionate base",
      body: countywide
        ? `Countywide ${model.market.classStats?.classLabel ?? "class"}: median ${formatRatio(countywide.median)}, COD ${formatRatio(countywide.cod)}, PRD ${formatRatio(countywide.prd)}.`
        : "Equalization checks required level and consistency before levies are applied."
    }
  ], ctx.margin, top, ctx.contentWidth, { columns: 2, height: 112, bodyLines: 5 });

  drawSectionTitle(ctx, "Assessment value trend", ctx.margin, top - 142, colW);
  drawLineChart(ctx, historyPoints(model, "assessedValue"), ctx.margin, top - 264, colW, 104, {
    valueLabel: "Assessed value",
    color: ctx.palette.navy
  });
  drawKeyValueRows(ctx, [
    ["Latest listed", model.review.latestValue ? `${formatNullableMoney(model.review.latestValue.assessedValue)} (${model.review.latestValue.year})` : "Not listed"],
    ["Recent movement", signedPercent(model.review.valueMovement)],
    ["Valuation group", model.identity.valuationGroup]
  ], ctx.margin, top - 292, colW, { rowGap: 15 });

  drawSectionTitle(ctx, "Local comparison read", ctx.margin + colW + gap, top - 142, colW);
  drawKeyValueRows(ctx, [
    ["Selected group", model.market.label],
    ["Qualified sales", group?.count ? integer.format(group.count) : "Not listed"],
    ["Median ratio", formatRatio(group?.median)],
    ["COD", formatRatio(group?.cod)],
    ["PRD", formatRatio(group?.prd)],
    ["Countywide median", formatRatio(countywide?.median)]
  ], ctx.margin + colW + gap, top - 164, colW, { rowGap: 16 });

  drawJourneyFooter(ctx);
}

function drawTaxContextPage(ctx, model) {
  drawJourneyHeader(ctx, model, 4, "Tax Context", 3);
  drawTransition(ctx, "Tax context separates the statement math, the net-bill pattern, and the broader county baseline.", ctx.margin, ctx.height - 136, ctx.contentWidth);

  const top = ctx.height - 214;
  const statement = model.taxSummary.latestStatement;
  const creditText = Number.isFinite(statement?.totalCredits) ? moneyCents.format(statement.totalCredits) : "—";
  const grossLevy = Number.isFinite(statement?.derived?.grossLevyRate)
    ? statement.derived.grossLevyRate * 100
    : statement?.levyRate;
  drawCardGrid(ctx, [
    { kicker: "Assessed value", title: formatNullableMoney(statement?.assessedValue), body: `${statement?.taxYear ?? model.review.latestFinalTaxYear}` },
    { kicker: "Levy", title: Number.isFinite(grossLevy) ? grossLevy.toFixed(6).replace(/\.?0+$/, "") : "—", body: "gross rate" },
    { kicker: "Gross tax", title: formatNullableMoney(statement?.grossTaxAmount, true), body: "before credits" },
    { kicker: "Credits", title: creditText, body: "reductions" },
    { kicker: "Net tax", title: moneyCents.format(statement?.netAmountDue ?? 0), body: "statement amount" }
  ], ctx.margin, top, ctx.contentWidth, { columns: 5, height: 76, titleSize: 10.4, bodyLines: 1 });

  const chartTop = top - 106;
  const gap = 16;
  const chartW = ctx.contentWidth * 0.58;
  const cardX = ctx.margin + chartW + gap;
  const cardW = ctx.contentWidth - chartW - gap;
  drawSectionTitle(ctx, "Net bill pattern", ctx.margin, chartTop, chartW);
  drawLineChart(ctx, model.taxStatements.map(row => ({ label: `${row.taxYear}`, value: row.netAmountDue })), ctx.margin, chartTop - 134, chartW, 112, {
    valueLabel: "Statement net tax",
    color: ctx.palette.red
  });
  const latestVsAverage = Number.isFinite(model.taxSummary.averageNetTax) && Number.isFinite(statement?.netAmountDue)
    ? statement.netAmountDue - model.taxSummary.averageNetTax
    : null;
  const rangeLabel = model.taxStatements.length ? `${model.taxStatements[0].taxYear}-${model.taxStatements.at(-1).taxYear}` : "Loaded years";
  drawCardGrid(ctx, [
    { kicker: "Latest net bill", title: statement ? moneyCents.format(statement.netAmountDue) : "Not listed", body: signedMoney(latestVsAverage) },
    { kicker: "Highest net bill", title: model.taxSummary.peakTaxStatement?.netAmountDue ? moneyCents.format(model.taxSummary.peakTaxStatement.netAmountDue) : "Not listed", body: `${model.taxSummary.peakTaxStatement?.taxYear ?? ""}` },
    { kicker: "Period average", title: Number.isFinite(model.taxSummary.averageNetTax) ? moneyCents.format(model.taxSummary.averageNetTax) : "Not listed", body: rangeLabel },
    { kicker: "Net change over period", title: Number.isFinite(model.taxSummary.statementNetChange) ? signedMoney(model.taxSummary.statementNetChange) : "Not available", body: rangeLabel }
  ], cardX, chartTop, cardW, { columns: 2, height: 64, titleSize: 10.5, bodyLines: 1 });

  drawSectionTitle(ctx, "Completed statement years", ctx.margin, 130, ctx.contentWidth);
  drawTable(ctx, [
    { key: "year", label: "Year", width: 0.45 },
    { key: "gross", label: "Gross", width: 0.8, align: "right" },
    { key: "credits", label: "Credits", width: 0.8, align: "right" },
    { key: "net", label: "Net", width: 0.8, align: "right" },
    { key: "etr", label: "ETR", width: 0.55, align: "right" }
  ], model.taxStatements.slice(-5).map(row => ({
    year: `${row.taxYear}`,
    gross: formatNullableMoney(row.grossTaxAmount, true),
    credits: Number.isFinite(row.totalCredits) ? moneyCents.format(row.totalCredits) : "—",
    net: moneyCents.format(row.netAmountDue),
    etr: formatNullablePercent(row.assessedValue ? row.netAmountDue / row.assessedValue : null)
  })).reverse(), ctx.margin, 112, ctx.contentWidth, { rowHeight: 13, headerHeight: 14, fontSize: 7.2 });

  drawJourneyFooter(ctx);
}

function drawSignalsAndSummaryPage(ctx, model) {
  drawJourneyHeader(ctx, model, 5, "Review Signals + Summary", 4);
  drawTransition(ctx, "Finish by bringing the record, value movement, equalization, and tax context back together.", ctx.margin, ctx.height - 136, ctx.contentWidth);

  const top = ctx.height - 216;
  const gap = 14;
  const colW = (ctx.contentWidth - gap) / 2;
  drawSectionTitle(ctx, "Review signals", ctx.margin, top, colW);
  let signalY = top - 24;
  model.review.signals.forEach(signal => {
    drawMiniCard(ctx, {
      kicker: signal.tone ? signal.tone : "Signal",
      title: signal.title,
      body: signal.summary
    }, ctx.margin, signalY, colW, 78, { bodyLines: 3 });
    signalY -= 90;
  });

  drawSectionTitle(ctx, "Quick read for this property", ctx.margin + colW + gap, top, colW);
  drawCardGrid(ctx, [
    {
      kicker: "Current value",
      title: model.review.latestValue ? `${formatNullableMoney(model.review.latestValue.assessedValue)} · ${signedPercent(model.review.valueMovement)}` : "Not listed",
      body: model.review.latestValue ? `${model.review.latestValue.year} assessment base.` : "No current value was listed."
    },
    {
      kicker: "Local market",
      title: model.market.group?.count ? `${integer.format(model.market.group.count)} qualified sales` : "Market context",
      body: model.market.group ? `Median ratio ${formatRatio(model.market.group.median)} in ${model.market.label}.` : "Local group metrics were not available."
    },
    {
      kicker: "Taxes",
      title: model.review.latestTax ? moneyCents.format(model.review.latestTax.taxes) : "Not listed",
      body: model.review.latestEtr !== null ? `ETR ${formatNullablePercent(model.review.latestEtr)}; recent movement ${signedPercent(model.review.taxMovement)}.` : "Tax statement context was not available."
    },
    {
      kicker: "Review posture",
      title: `${integer.format(model.review.reviewSignalCount)} review ${model.review.reviewSignalCount === 1 ? "item" : "items"}`,
      body: "Use these signals to decide whether source records or official follow-up deserve a closer look."
    }
  ], ctx.margin + colW + gap, top - 24, colW, { columns: 2, height: 96, bodyLines: 4 });

  const bottomY = 48;
  drawPanel(ctx, ctx.margin, bottomY, ctx.contentWidth, 76, { fill: ctx.palette.panel });
  drawText(ctx, "Guided review takeaway", ctx.margin + 12, bottomY + 52, {
    size: 8,
    bold: true,
    color: ctx.palette.muted
  });
  drawWrappedText(ctx, "Verify property facts first. Then use value movement, local comparison context, equalization measures, and tax results to decide whether a closer official review is useful.", ctx.margin + 12, bottomY + 36, ctx.contentWidth - 24, {
    size: 10,
    lineHeight: 13,
    color: ctx.palette.ink,
    maxLines: 3
  });

  drawJourneyFooter(ctx);
}

export async function generatePropertyReportPdf(data, recordCard, context = {}) {
  const model = reportModel(data, recordCard, context);
  const baseCtx = await createReportContext({ title: `${model.identity.address} Guided Review Summary` });
  drawPropertyAndChangePage(addReportPage(baseCtx), model);
  drawValueAndEqualizationPage(addReportPage(baseCtx), model);
  drawTaxContextPage(addReportPage(baseCtx), model);
  drawSignalsAndSummaryPage(addReportPage(baseCtx), model);
  return baseCtx.doc.save();
}

export function propertyReportFilename(data) {
  return `guided-review-summary-${fileSafe(data?.parcel?.parcelId || data?.parcel?.situsAddress)}.pdf`;
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
