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
  latestKnown,
  percentChange
} from "./calculations/history.js";
import {
  getClassMarketStats,
  getCodInterpretationRange,
  getCountywideMarketPoint,
  getMedianRatioRange,
  getParcelMarketClass,
  getSelectedMarketGroup
} from "./market-stats.js";
import { buildReviewSignalModel } from "./data/review-signal-model.js";
import { escapeHtml } from "./utils/html.js";

const REPORT_LAYER_ID = "assessorsReportPrintLayer";

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
      const layer = renderAssessorsReport(reportModel);

      await waitForReportReady(layer);
      button.textContent = defaultLabel;
      button.disabled = false;
      button.setAttribute("aria-busy", "false");

      window.addEventListener("afterprint", () => {
        layer.remove();
        activeElement?.focus?.();
      }, { once: true });

      window.print();
    } catch (error) {
      console.error(error);
      button.textContent = defaultLabel;
      button.disabled = false;
      button.setAttribute("aria-busy", "false");
      alert("The Assessor's Report could not be prepared from the current parcel data.");
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

function renderAssessorsReport(model) {
  document.getElementById(REPORT_LAYER_ID)?.remove();

  const layer = document.createElement("section");
  layer.id = REPORT_LAYER_ID;
  layer.className = "assessors-report-print-layer";
  layer.setAttribute("aria-label", "Assessor's Supplemental Property Report");
  layer.innerHTML = reportHtml(model);
  document.body.append(layer);

  return layer;
}

export function reportHtml(model) {
  return `
    <article class="assessors-report">
      ${reportHeader(model)}
      ${reportSection("1. Property Record Summary", propertyRecordSummaryHtml(model))}
      ${reportSection("2. What Changed", whatChangedHtml(model))}
      ${reportSection("3. Value Detail / Valuation Breakdown", valueDetailHtml(model))}
      ${reportSection("4. Equalization Context", equalizationContextHtml(model))}
      ${reportSection("5. Tax Context", taxContextHtml(model))}
      ${reportSection("6. Review Signals", reviewSignalsHtml(model))}
      ${reportSection("7. Summary / Working Conclusion", workingConclusionHtml(model), "assessors-report-section-summary")}
      <footer class="assessors-report-footer">
        Supplemental review document generated from loaded prototype parcel data. Sources: ${escapeHtml(sourceList(model))}.
      </footer>
    </article>
  `;
}

function reportHeader(model) {
  const { data, generatedAt, propertySummary, valueSummary } = model;
  const property = data.snapshotModel?.viewModels?.property ?? {};
  const district = data.snapshotModel?.viewModels?.district ?? {};
  const current = valueSummary.current;
  const prior = valueSummary.prior;

  return `
    <header class="assessors-report-header">
      <div>
        <p class="assessors-report-kicker">Supplemental review document</p>
        <h1>Assessor's Supplemental Property Report</h1>
        <p class="assessors-report-subtitle">
          Generated from parcel snapshot data. For review and discussion; not a substitute for the official assessor's report or protest record.
        </p>
      </div>
      <div class="assessors-report-generated">
        <p>Generated</p>
        <strong>${escapeHtml(formatDateTime(generatedAt))}</strong>
      </div>
    </header>

    <section class="assessors-report-identity">
      ${keyValueTable([
        ["Parcel ID", data.parcel?.parcelId],
        ["Situs address", data.parcel?.situsAddress],
        ["Owner", data.parcel?.owner],
        ["Property class / type", [data.classification?.propertyClass, data.parcel?.accountType].filter(Boolean).join(" / ")],
        ["Assessment year", data.snapshotYear],
        ["Latest value year", current.year],
        ["Market area / valuation group", property.valuationGroup ?? propertySummary.valuationGroupLabel],
        ["School / taxing district", [data.parcel?.schoolDistrict, district?.districtDescription ? `TD ${data.parcel?.taxDistrict} (${district.districtDescription})` : `TD ${data.parcel?.taxDistrict}`].filter(Boolean).join(" | ")]
      ])}
      ${keyValueTable([
        ["Current assessed value", formatNullableMoney(current.total)],
        ["Prior assessed value", formatNullableMoney(prior.total)],
        ["Dollar change", signedMoney(valueSummary.totalChange)],
        ["Percent change", signedPercent(valueSummary.totalPercentChange)]
      ], "assessors-report-value-table")}
    </section>
  `;
}

function propertyRecordSummaryHtml(model) {
  const { data, recordCard, propertySummary } = model;
  const residential = data.residential ?? {};
  const classification = data.classification ?? {};
  const parcel = data.parcel ?? {};
  const location = recordCard?.locationModel ?? {};
  const residentialInfo = recordCard?.residentialInformation ?? {};

  return `
    <div class="assessors-report-grid">
      ${subsection("Parcel Identity", keyValueTable([
        ["Parcel ID", parcel.parcelId],
        ["Map number", parcel.mapNumber],
        ["State geocode", parcel.stateGeoCode],
        ["Owner", parcel.owner],
        ["Mailing address", parcel.mailingAddress],
        ["Situs address", parcel.situsAddress],
        ["Legal description", parcel.legalDescription],
        ["Tax district", parcel.taxDistrict],
        ["School district", parcel.schoolDistrict]
      ]))}
      ${subsection("Classification & Location", keyValueTable([
        ["Status", classification.status],
        ["Property class", classification.propertyClass],
        ["Account type", parcel.accountType],
        ["Location", classification.location],
        ["Zoning", classification.zoning],
        ["City size", classification.citySize],
        ["County area", location.countyArea],
        ["Neighborhood", location.neighborhood],
        ["Location group", location.locationGroup],
        ["Valuation group", location.valuationGroup],
        ["Model / method", [location.model, location.method].filter(Boolean).join(" / ")]
      ]))}
    </div>
    <div class="assessors-report-grid">
      ${subsection("Dwelling Record", keyValueTable([
        ["Residential type", residentialInfo.type],
        ["Style", residential.style ?? residentialInfo.style],
        ["Year built", residential.yearBuilt],
        ["Effective age / year", effectiveAge(recordCard)],
        ["Living area", squareFeet(residential.buildingSize)],
        ["Basement", basementSummary(residential, residentialInfo)],
        ["Bedrooms / bathrooms", bedroomsBathrooms(residential, residentialInfo)],
        ["Plumbing fixtures", residential.plumbingFixtures ?? residentialInfo.fixtureRoughin],
        ["Quality / condition", [residential.quality ?? residentialInfo.quality, residential.condition ?? residentialInfo.condition].filter(Boolean).join(" / ")],
        ["Exterior", residential.exterior ?? residentialInfo.exteriorWall],
        ["Heating / cooling", residential.heatingCooling ?? residentialInfo.heatingCooling]
      ]))}
      ${subsection("Land & Improvements", keyValueTable([
        ["Land units / acres / lots", propertySummary.landArea],
        ["Land model", recordCard?.landModel?.description],
        ["Recorded land value", formatNullableMoney(recordCard?.landModel?.recordedLotValue)],
        ["Garage details", [residential.garage1, residential.garage2].filter(Boolean).join("; ")],
        ["Garage cost lines", countLabel(recordCard?.garageCostLines?.length, "line")],
        ["Outbuildings", propertySummary.outbuildingSummary],
        ["Miscellaneous improvements", propertySummary.miscImprovementSummary],
        ["Property notes", propertySummary.noteSummary],
        ["Review history", propertySummary.reviewHistorySummary]
      ]))}
    </div>
    ${subsection("Notable Missing or Suspicious Fields", standardTable(
      ["Field / signal", "Status", "Review note"],
      propertySummary.dataQualityRows
    ))}
  `;
}

function whatChangedHtml(model) {
  const { data, valueSummary, reviewSignals } = model;
  const current = valueSummary.current;
  const prior = valueSummary.prior;
  const garageTotal = sumBy(model.recordCard?.garageCostLines, "rcnld");
  const miscTotal = sumBy(model.recordCard?.miscImprovements, "value");
  const componentRows = [
    changeRow("Total assessed value", prior.total, current.total),
    changeRow("Land value", prior.land, current.land),
    changeRow("Dwelling / building value", prior.dwelling, current.dwelling),
    changeRow("Other improvements", prior.improvement, current.improvement),
    changeRow("Outbuildings", prior.outbuilding, current.outbuilding)
  ];
  const latestSignals = reviewSignals.rows
    .filter(row => row.status === "Flagged" || row.status === "Monitor")
    .slice(0, 4)
    .map(row => [row.signal, row.status, row.why]);

  return `
    <div class="assessors-report-grid assessors-report-grid-wide-left">
      ${subsection(`${prior.year ?? "Prior"} to ${current.year ?? "Current"} Value Movement`, standardTable(
        ["Component", "Prior", "Current", "Dollar change", "Percent change"],
        componentRows
      ))}
      ${subsection("Characteristic & Review Changes", standardTable(
        ["Item", "Status", "Review note"],
        [
          ["Property characteristics", "Not listed", "The loaded snapshot does not include a current-year characteristic-change log."],
          ["Garage value change", "Not isolated", `Current cost-model garage lines total ${formatNullableMoney(garageTotal)}; year-over-year garage-specific movement is not isolated in the loaded value history.`],
          ["Miscellaneous improvement change", "Not isolated", `Current cost-model miscellaneous improvement lines total ${formatNullableMoney(miscTotal)}; year-over-year misc-specific movement is not isolated in the loaded value history.`],
          ["Inspection / record activity", model.propertySummary.reviewHistorySummary, "Confirm whether any recent permit, inspection, or field-review changes occurred outside the loaded prototype data."],
          ["Large increase / decrease", valueSummary.largeChangeFlag ? "Flagged" : "Not flagged", valueSummary.largeChangeFlag ? "Single-year value movement exceeds the review threshold used by this report." : "Latest loaded value movement does not exceed the report threshold."],
          ["Dashboard review signals", latestSignals.length ? `${latestSignals.length} signal(s)` : "No flags", "Signals already generated elsewhere in the app are consolidated in the Review Signals section."]
        ]
      ))}
    </div>
    ${latestSignals.length ? subsection("Active Review Signals", standardTable(
      ["Signal", "Status", "Why it matters"],
      latestSignals
    )) : ""}
  `;
}

function valueDetailHtml(model) {
  const { recordCard, valueSummary } = model;
  const current = valueSummary.current;
  const cost = recordCard?.costApproach ?? {};
  const garageTotal = sumBy(recordCard?.garageCostLines, "rcnld");
  const miscTotal = sumBy(recordCard?.miscImprovements, "value");
  const totalImprovementValue = nullableSubtract(current.total, current.land);
  const depreciation = cost.depreciation ?? {};

  return `
    <div class="assessors-report-grid">
      ${subsection("Assessed Value Breakdown", standardTable(
        ["Component", "Value", "Source / note"],
        [
          ["Land value", formatNullableMoney(current.land), "Current loaded value breakdown"],
          ["Dwelling / building value", formatNullableMoney(current.dwelling), "Current loaded value breakdown"],
          ["Garage value", formatNullableMoney(garageTotal), "Cost-model garage lines, where present"],
          ["Miscellaneous improvements", formatNullableMoney(miscTotal), "Cost-model miscellaneous improvement lines, where present"],
          ["Outbuildings", formatNullableMoney(current.outbuilding), "Current loaded outbuilding value"],
          ["Total improvement value", formatNullableMoney(totalImprovementValue), "Total assessed value less land value"],
          ["Total assessed value", formatNullableMoney(current.total), "Latest loaded assessed value"]
        ]
      ))}
      ${subsection("Replacement-Cost / Marshall & Swift Detail", keyValueTable([
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
        ["Cost per square foot", numberOrMoneyCents(cost.costPerSquareFoot)]
      ]))}
    </div>
    <div class="assessors-report-grid">
      ${subsection("Quality / Condition Factors", keyValueTable([
        ["Residential quality", recordCard?.residentialInformation?.quality],
        ["Residential condition", recordCard?.residentialInformation?.condition],
        ["Architecture", recordCard?.residentialInformation?.architecture],
        ["Base / total area", recordCard?.residentialInformation?.baseTotalArea],
        ["Roof cover", recordCard?.residentialInformation?.roofCover],
        ["Heating / cooling", recordCard?.residentialInformation?.heatingCooling]
      ]))}
      ${subsection("Cost Adjustments", standardTable(
        ["Adjustment", "Value"],
        Object.entries(cost.adjustments ?? {}).map(([label, value]) => [titleCase(label), decimalValue(value, 2)])
      ))}
    </div>
  `;
}

function equalizationContextHtml(model) {
  const { equalization } = model;

  return `
    <p class="assessors-report-caution">
      Equalization indicators are context for review. Based on current prototype data, they do not by themselves prove an individual parcel value.
    </p>
    <div class="assessors-report-grid">
      ${subsection("Market Area / Valuation Group Comparison", standardTable(
        ["Metric", "Subject group", "County / class context"],
        equalization.marketComparisonRows
      ))}
      ${subsection("Alignment Read", standardTable(
        ["Indicator", "Status", "Reason"],
        equalization.alignmentRows
      ))}
    </div>
    ${subsection("County Ratio / Equalization Trend", standardTable(
      ["Year", "Sales", "Level of value", "COD", "PRD", "COV"],
      equalization.ratioTrendRows
    ))}
    ${subsection("Chart Data Included for Print", `
      <p class="assessors-report-note">
        Chart inputs from the equalization dashboard are included as compact tables in this print version.
      </p>
    `)}
  `;
}

function taxContextHtml(model) {
  const { data, taxContext } = model;

  return `
    <div class="assessors-report-tax-statement">
      Assessed value determines the property's share of the tax base; levies and budgets determine the final tax bill.
    </div>
    <div class="assessors-report-grid">
      ${subsection("Tax Snapshot", keyValueTable([
        ["Latest final tax year", taxContext.latestStatement?.taxYear ?? data.latestFinalTaxYear],
        ["Prior / current tax amount", formatNullableMoney(taxContext.latestNetTax, true)],
        ["Gross tax amount", formatNullableMoney(taxContext.latestStatement?.grossTaxAmount, true)],
        ["Credits", formatNullableMoney(taxContext.latestCreditAmount, true)],
        ["Effective tax rate", formatNullablePercent(taxContext.effectiveTaxRate)],
        ["Latest final levy", formatNullableLevy(taxContext.totalLevy)],
        ["Tax district", taxContext.districtLabel],
        ["School district", data.parcel?.schoolDistrict]
      ]))}
      ${subsection("Taxing District Summary", keyValueTable([
        ["District description", taxContext.districtDescription],
        ["Authority count", taxContext.authorityCount],
        ["Largest levy share", taxContext.largestAuthority],
        ["Levy data year", taxContext.levyYear],
        ["Tax bill status", taxContext.taxStatus]
      ]))}
    </div>
    ${subsection("Levy / Tax Distribution", standardTable(
      ["Taxing body", "Category", "Rate", "Share", "Per $100k"],
      taxContext.levyRows
    ))}
  `;
}

function reviewSignalsHtml(model) {
  return standardTable(
    ["Signal", "Status", "Why it matters", "Suggested review action"],
    model.reviewSignals.rows.map(row => [row.signal, row.status, row.why, row.action])
  );
}

function workingConclusionHtml(model) {
  const { summary } = model;

  return `
    <div class="assessors-report-summary-box">
      <p class="assessors-report-summary-posture">${escapeHtml(summary.posture)}</p>
      <div class="assessors-report-grid">
        ${subsection("Key Reasons", unorderedList(summary.reasons))}
        ${subsection("Unresolved Questions", unorderedList(summary.questions))}
      </div>
      ${subsection("Missing Data Needed for Stronger Conclusion", unorderedList(summary.missingData))}
    </div>
  `;
}

function reportSection(title, body, extraClass = "") {
  return `
    <section class="assessors-report-section ${extraClass}">
      <h2>${escapeHtml(title)}</h2>
      ${body}
    </section>
  `;
}

function subsection(title, body) {
  return `
    <section class="assessors-report-subsection">
      <h3>${escapeHtml(title)}</h3>
      ${body}
    </section>
  `;
}

function keyValueTable(rows, className = "") {
  const visibleRows = rows.filter(([, value]) => hasDisplayValue(value));

  return `
    <table class="assessors-report-table assessors-report-key-value ${className}">
      <tbody>
        ${visibleRows.map(([label, value]) => `
          <tr>
            <th scope="row">${escapeHtml(label)}</th>
            <td>${escapeHtml(displayValue(value))}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function standardTable(headers, rows) {
  const safeRows = rows?.length ? rows : [["No data listed", "Not available"]];

  return `
    <table class="assessors-report-table">
      <thead>
        <tr>${headers.map(header => `<th scope="col">${escapeHtml(header)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${safeRows.map(row => `
          <tr>
            ${row.map(value => `<td>${escapeHtml(displayValue(value))}</td>`).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function unorderedList(items) {
  return `
    <ul class="assessors-report-list">
      ${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
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
      year: data.latestFinalTaxYear ?? latestKnown(data.taxpayerHistory, "assessedValue")?.year,
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
    ])
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
    maximumAlignmentRow(
      "Local COD",
      selectedMarket?.cod,
      codRange?.max,
      "Local uniformity measure appears within the available COD reference range.",
      "Local uniformity measure is above the available COD reference range."
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
    maximumAlignmentRow(
      "County class COD",
      latestRatioRecord?.cod,
      codRange?.max,
      "County class COD appears within the available COD reference range.",
      "County class COD is above the available COD reference range."
    )
  ];
}

function rangeAlignmentRow(label, value, range, alignedReason, reviewReason) {
  if (!hasValue(value) || !range) return [label, "Not available", "Available data does not support a report status."];
  const aligned = Number(value) >= Number(range.min) && Number(value) <= Number(range.max);
  return [label, aligned ? "Appears aligned" : "May warrant review", aligned ? alignedReason : reviewReason];
}

function maximumAlignmentRow(label, value, max, alignedReason, reviewReason) {
  if (!hasValue(value) || !hasValue(max)) return [label, "Not available", "Available data does not support a report status."];
  const aligned = Number(value) <= Number(max);
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
      ? "Review local sale group, class ratio study, and parcel valuation inputs before final protest response."
      : "Document the supporting market-area and county-class indicators if a protest response needs equalization context."
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
    ? "Based on available data, this property shows review signals that may warrant closer inspection before final protest response."
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
    "Live chart image capture for final packet presentation, if visual chart exhibits are required."
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

function changeRow(label, prior, current) {
  const change = nullableSubtract(current, prior);
  return [
    label,
    formatNullableMoney(prior),
    formatNullableMoney(current),
    signedMoney(change),
    signedPercent(percentChange(current, prior))
  ];
}

function waitForReportReady(layer) {
  const images = [...layer.querySelectorAll("img")];
  const imagePromises = images.map(image => {
    if (image.complete) return Promise.resolve();

    return new Promise(resolve => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    });
  });

  return Promise.all([
    document.fonts?.ready ?? Promise.resolve(),
    ...imagePromises,
    animationFrame(),
    animationFrame()
  ]);
}

function animationFrame() {
  return new Promise(resolve => window.requestAnimationFrame(resolve));
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

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function hasDisplayValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return hasValue(value);
}

function displayValue(value) {
  if (!hasDisplayValue(value)) return "-";
  if (typeof value === "number") return Number.isInteger(value) ? value.toLocaleString() : String(value);

  return String(value);
}

// TODO: Capture rendered Chart.js canvases as print-safe image snapshots when the report needs visual chart parity with the dashboard.
