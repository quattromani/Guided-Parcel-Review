import {
  calculateEtr,
  formatNullableMoney,
  formatNullablePercent,
  money,
  moneyCents
} from "../format.js";
import { hasValue, latestKnown, percentChange, previousKnown } from "../calculations/history.js";
import {
  getClassMarketStats,
  getParcelMarketClass,
  getParcelMarketGroupId
} from "../market-stats.js";
import { initPropertyReportExport } from "../reports/property-report.js";

const integer = new Intl.NumberFormat("en-US");

function escapeHtml(value) {
  return `${value ?? ""}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function displayMoneyWithFallback(value, fallbackValue, fallbackYear, options = {}) {
  if (value !== null && value !== undefined) return money.format(value);
  if (fallbackValue !== null && fallbackValue !== undefined) {
    if (options.compactLatest) {
      return `<span class="pending-value">Pending</span><small>${fallbackYear}: ${money.format(fallbackValue)}</small>`;
    }
    return `<span class="pending-value">Pending</span><small>Latest known: ${money.format(fallbackValue)} (${fallbackYear})</small>`;
  }
  return `<span class="pending-value">Pending</span>`;
}

function noticeMetric(label, value, options = {}) {
  const normalized = typeof options === "string"
    ? { note: options }
    : options;
  const {
    note = "",
    layout = "pair",
    pill = null
  } = normalized;

  return `
    <div class="civic-notice-metric civic-notice-metric-${layout}">
      <dt>
        <span>${escapeHtml(label)}</span>
        ${pill ? `<span class="civic-notice-pill civic-notice-pill-${escapeHtml(pill.tone || "default")}">${escapeHtml(pill.label)}</span>` : ""}
      </dt>
      <dd>${value}</dd>
      ${note ? `<p>${escapeHtml(note)}</p>` : ""}
    </div>
  `;
}

function statusToneClass(status) {
  return `${status ?? ""}`.toLowerCase() === "pending" ? "notice-status-pill-pending" : "";
}

function signalToneLabel(tone) {
  if (tone === "review") return "May warrant review";
  if (tone === "steady") return "Generally consistent";
  return "Informational";
}

function renderSignal(signal) {
  return `
    <article class="review-signal-card review-signal-card-${signal.tone}">
      <p>${signalToneLabel(signal.tone)}</p>
      <h3>${escapeHtml(signal.title)}</h3>
      <p>${escapeHtml(signal.summary)}</p>
    </article>
  `;
}

function formatSquareFeet(value) {
  return hasValue(value) ? `${integer.format(value)} sq. ft.` : null;
}

function formatRatio(value) {
  return hasValue(value) ? `${Number(value).toFixed(2)}%` : "not listed";
}

function itemCountLabel(count, singular, plural = `${singular}s`) {
  return `${integer.format(count)} ${count === 1 ? singular : plural}`;
}

function compactParts(parts) {
  return parts.filter(Boolean).join("; ");
}

function selectedMarketArea(data, recordCard, context = {}) {
  const classKey = getParcelMarketClass(data);
  const classStats = getClassMarketStats(context.marketPositionData, classKey);
  const valuationGroupId = getParcelMarketGroupId(recordCard, classStats?.classKey ?? classKey);
  if (!valuationGroupId) return { marketArea: null, classKey };

  const classMarketArea = classStats?.groups?.find(group => String(group.id) === String(valuationGroupId));
  if (classMarketArea) return { marketArea: classMarketArea, classKey: classStats.classKey };

  if (classKey === "residential") {
    const legacyMarketArea = context.padRatioData?.valuationGroups?.find(group =>
      String(group.group ?? group.valuationGroup) === String(valuationGroupId)
    );

    if (legacyMarketArea) return { marketArea: legacyMarketArea, classKey };
  }

  return { marketArea: null, classKey };
}

function marketAreaName(recordCard, marketArea, classKey = "residential") {
  if (classKey !== "agricultural" && recordCard?.locationModel?.valuationGroup) {
    return recordCard.locationModel.valuationGroup.replace(/^(\d+)/, "VG $1");
  }

  if (marketArea?.label) {
    return marketArea.label.replace(/^Valuation Group\s+/i, "VG ");
  }

  return recordCard?.locationModel?.valuationGroup || "Valuation group listed";
}

function signalMeta(signals) {
  const counts = signals.reduce((acc, signal) => {
    acc[signal.tone] = (acc[signal.tone] ?? 0) + 1;
    return acc;
  }, {});

  const parts = [
    counts.review ? `${counts.review} may warrant review` : "",
    counts.informational ? `${counts.informational} informational` : "",
    counts.steady ? `${counts.steady} generally consistent` : ""
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "No review signals generated";
}

function finalReviewCard(card) {
  const toneClass = card.tone ? ` final-review-kpi-card-${card.tone}` : "";
  const reviewAction = card.route ? `
      <button type="button" class="final-review-card-action" data-guided-next="${escapeHtml(card.route)}">Review</button>
    ` : "";

  return `
    <section class="final-review-kpi-card${toneClass}">
      <div class="final-review-card-topline">
        <p class="final-review-card-step">${escapeHtml(card.step)}</p>
        ${reviewAction}
      </div>
      <h3>${escapeHtml(card.value)}</h3>
      ${card.meta ? `<small>${escapeHtml(card.meta)}</small>` : ""}
      <p>${escapeHtml(card.note)}</p>
    </section>
  `;
}

function finalReviewBlock(block) {
  return `
    <section class="final-review-block">
      <p class="final-review-narrative">${escapeHtml(block.narrative)}</p>
      <div class="final-review-kpi-grid">
        ${block.cards.map(finalReviewCard).join("")}
      </div>
    </section>
  `;
}

function buildFinalReviewModel(data, context = {}) {
  const notice = data.snapshotModel.viewModels.notice;
  const reviewSignals = data.snapshotModel.viewModels.reviewSignals?.signals ?? [];
  const history = data.taxpayerHistory ?? [];
  const residential = data.residential ?? {};
  const latestValue = latestKnown(history, "assessedValue");
  const previousValue = previousKnown(history, latestValue?.year, "assessedValue");
  const latestTax = latestKnown(history, "taxes");
  const currentYearRow = history.find(row => row.year === data.snapshotYear);
  const currentYearPending = !hasValue(currentYearRow?.assessedValue);
  const latestValueMovement = percentChange(latestValue?.assessedValue, previousValue?.assessedValue);
  const latestEtr = calculateEtr(latestTax);
  const marketAreaSummary = selectedMarketArea(data, context.recordCard, context);
  const marketArea = marketAreaSummary.marketArea;
  const propertyDetails = compactParts([
    formatSquareFeet(residential.buildingSize),
    [residential.quality, residential.condition].filter(Boolean).join(" / ") || null,
    notice.taxDistrict ? `tax district ${notice.taxDistrict}` : null
  ]);

  return {
    heading: `Review of the main assessment story for ${notice.displayAddress || notice.situsAddress}`,
    intro: "The main takeaways from the property record, value movement, market context, equalization, taxes, and review signals are gathered here for orientation. This is not a filing recommendation.",
    blocks: [
      {
        narrative: "The first part of the review anchors the parcel facts, then separates current value status from finalized value history. That keeps the property description and value movement clear before adding market or tax context.",
        cards: [
          {
            step: "Step 1 · Property Record",
            route: "property-record",
            value: `${notice.propertyClass} property`,
            meta: `Parcel ${notice.parcelId}`,
            note: propertyDetails
              ? `The record includes ${propertyDetails}.`
              : "The record provides the parcel identity and core property description used later in the review."
          },
          {
            step: "Step 2 · What Changed",
            route: "what-changed",
            value: currentYearPending ? `${notice.taxYear} pending` : formatNullableMoney(notice.currentAssessedValue),
            tone: currentYearPending ? "pending" : "",
            meta: latestValue
              ? `Latest final value: ${formatNullableMoney(latestValue.assessedValue)} (${latestValue.year})`
              : "No final assessed value listed",
            note: latestValueMovement !== null && previousValue
              ? `Latest known final value movement is ${formatNullablePercent(latestValueMovement)} from ${previousValue.year} to ${latestValue.year}.`
              : "Value movement depends on available finalized assessment years."
          }
        ]
      },
      {
        narrative: "The later steps move from market context to equalization, then to taxes. Equalization is the fairness check before levies are applied; tax context shows how that value base becomes a bill.",
        cards: [
          {
            step: "Step 3 · Value Detail",
            route: "valuation-detail",
            value: marketAreaName(context.recordCard, marketArea, marketAreaSummary.classKey),
            meta: marketArea?.count ? itemCountLabel(marketArea.count, "qualified sale") : "Market-area context",
            note: marketArea
              ? `Median ratio ${formatRatio(marketArea.median)}, COD ${formatRatio(marketArea.cod)}, PRD ${formatRatio(marketArea.prd)}.`
              : "Market data helps place the property in context, but it is not a conclusion about this parcel by itself."
          },
          {
            step: "Step 4 · Equalization",
            route: "equalization",
            value: "Fairness check",
            meta: "Required level and uniformity",
            note: "Equalization does not stop market movement or set the levy. It checks whether assessments are at the required level and reasonably uniform."
          },
          {
            step: "Step 5 · Tax Context",
            route: "tax-context",
            value: latestEtr !== null ? `ETR ${formatNullablePercent(latestEtr)}` : "ETR pending",
            meta: latestTax ? `Net taxes ${moneyCents.format(latestTax.taxes)} (${latestTax.year})` : "No final tax bill listed",
            note: "Effective tax rate compares finalized taxes paid with assessed value after levy, credits, and exemptions are reflected in the final bill."
          },
          {
            step: "Step 6 · Review Signals",
            route: "review-signals",
            value: reviewSignals.length ? itemCountLabel(reviewSignals.length, "item") : "No items surfaced",
            meta: signalMeta(reviewSignals),
            note: reviewSignals.some(signal => signal.tone === "review")
              ? "Review signals identify items to verify more closely; they are not conclusions."
              : "Loaded records did not surface an obvious record discrepancy; pending current-year data remains informational."
          }
        ]
      }
    ]
  };
}

export function installCivicJourneyPanels(data, context = {}) {
  installLandingPrimer(data);
  installReviewSignalsPanel(data);
  installFinalSummary(data, context);
  alignPrimaryJourneyNextSteps();
}

function installLandingPrimer(data) {
  const existing = document.querySelector('[data-guided-panel="landing-primer"]');
  existing?.remove();

  const notice = data.snapshotModel.viewModels.notice;
  const address = notice.displayAddress || notice.situsAddress;
  const firstPanel = document.querySelector('[data-guided-panel="your-property"]');
  const section = document.createElement("section");
  section.dataset.guidedPanel = "landing-primer";
  section.className = "space-y-6";

  section.innerHTML = `
    <article class="civic-landing-shell">
      <div class="civic-landing-intro">
        <p class="guided-kicker">Guided Parcel Review</p>
        <p>Property, value, and tax records are easier to review when the basic facts come first. Begin by confirming the property and noticing which information is final, pending, or available only as context.</p>
      </div>

      <section class="civic-notice-summary" aria-labelledby="assessmentSnapshotTitle">
        <div class="civic-notice-heading">
          <div>
            <p class="guided-kicker">Property record</p>
            <h3 id="assessmentSnapshotTitle">Property review starting point</h3>
          </div>
          <div class="notice-status-group" aria-label="${escapeHtml(`${notice.assessmentLabel} status ${notice.valueStatusLabel}`)}">
            <span>${escapeHtml(notice.assessmentLabel)}:</span>
            <span class="notice-status-pill ${statusToneClass(notice.valueStatusLabel)}">${escapeHtml(notice.valueStatusLabel)}</span>
          </div>
        </div>

        <dl class="civic-notice-grid">
          ${noticeMetric("Situs address", escapeHtml(address))}
          ${noticeMetric("Parcel ID", escapeHtml(notice.parcelId))}
          ${noticeMetric("Property class", escapeHtml(notice.propertyClass))}
          ${noticeMetric("Tax district", escapeHtml(notice.taxDistrict))}
          ${noticeMetric("Current assessed value", displayMoneyWithFallback(notice.currentAssessedValue, notice.latestKnownValue, notice.latestKnownValueYear), {
            layout: "full",
            pill: {
              label: `${notice.taxYear}`,
              tone: notice.currentAssessedValue === null || notice.currentAssessedValue === undefined ? "pending" : "current"
            }
          })}
          ${noticeMetric("Prior assessed value", formatNullableMoney(notice.priorAssessedValue), {
            layout: "full",
            pill: notice.priorAssessedValueYear ? { label: `${notice.priorAssessedValueYear}`, tone: "prior" } : null
          })}
          ${noticeMetric("Dollar change", formatNullableMoney(notice.dollarChange))}
          ${noticeMetric("Percent change", formatNullablePercent(notice.percentChange))}
          ${noticeMetric("Land value", displayMoneyWithFallback(notice.landValue, notice.latestKnownLandValue, notice.latestKnownValueYear, { compactLatest: true }))}
          ${noticeMetric("Improvement value", displayMoneyWithFallback(notice.improvementValue, notice.latestKnownImprovementValue, notice.latestKnownValueYear, { compactLatest: true }))}
          ${noticeMetric(notice.assessmentDateLabel ?? "Assessment Date", escapeHtml(notice.assessmentDate))}
          ${noticeMetric(notice.reviewDeadlineLabel, escapeHtml(notice.reviewDeadline))}
        </dl>

        <p class="civic-source-note">Source: ${escapeHtml(notice.source)}. Official records and deadlines should be confirmed with the county.</p>
      </section>
    </article>

    <article class="next-step-card">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Next step</p>
        <h3 class="mt-1 text-lg font-bold text-slate-700">First, check whether the record describes the property correctly.</h3>
      </div>
      <button type="button" data-guided-next="property-record" class="next-step-button">Go to Property Record</button>
    </article>
  `;

  firstPanel?.before(section);
}

function installReviewSignalsPanel(data) {
  const panel = document.querySelector('[data-guided-panel="review-checklist"]');
  if (!panel) return;

  const reviewSignals = data.snapshotModel.viewModels.reviewSignals?.signals ?? [];
  const cards = reviewSignals.length
    ? reviewSignals.map(renderSignal).join("")
    : `
      <article class="review-signal-card review-signal-card-steady">
        <p>Generally consistent</p>
        <h3>No review signals generated</h3>
        <p>The loaded records did not surface a specific item for closer review.</p>
      </article>
    `;

  panel.innerHTML = `
    <section class="civic-review-signals" aria-labelledby="reviewSignalsTitle">
      <div>
        <p class="guided-kicker">Review signals</p>
        <h2 id="reviewSignalsTitle">Items worth verifying, if any</h2>
        <p>Review signals collect facts or patterns from the record, value, equalization, and tax steps. They are neutral prompts for review, not findings or filing recommendations.</p>
      </div>
      <div class="civic-review-signal-grid">
        ${cards}
      </div>
    </section>

    <article class="ooda-decision-card">
      <p class="guided-kicker">Decision check</p>
      <h2>Does anything need a closer look?</h2>
      <p>If something appears incomplete or materially different from what you know about the property, use official records or the assessor’s office to verify it. If the record appears generally consistent, continue to the summary.</p>
    </article>
  `;
}

function installFinalSummary(data, context = {}) {
  const existing = document.querySelector('[data-guided-panel="final-summary"]');
  existing?.remove();

  const notice = data.snapshotModel.viewModels.notice;
  const finalReview = buildFinalReviewModel(data, context);
  const reviewPanel = document.querySelector('[data-guided-panel="review-checklist"]');
  const section = document.createElement("section");
  section.dataset.guidedPanel = "final-summary";
  section.className = "hidden space-y-6";

  section.innerHTML = `
    <article class="civic-summary-shell civic-final-review">
      <div>
        <p class="guided-kicker">Final review</p>
        <h2>${escapeHtml(finalReview.heading)}.</h2>
        <p>${escapeHtml(finalReview.intro)}</p>
      </div>

      ${finalReview.blocks.map(finalReviewBlock).join("")}
    </article>

    <article class="ooda-decision-card">
      <p class="guided-kicker">Optional next steps</p>
      <h2>Rely on official records for decisions and filings.</h2>
      <p>If something appears incomplete or materially different, confirm it with the assessor or other governing office. If everything appears generally consistent, the useful outcome may simply be that the property owner understands the record, value movement, and tax context more clearly.</p>
    </article>

    <aside class="guided-completion-handoff">
      <p class="guided-kicker">Review complete</p>
      <h2>You have reached the end of the guided review.</h2>
      <p>The path has walked through the record, value movement, equalization context, tax context, and review signals. A property report is available below if a concise reference copy would be useful.</p>
    </aside>

    <article class="property-report-download-card">
      <div>
        <p class="guided-kicker">Property report</p>
        <h2>Save a concise reference copy.</h2>
        <p>Download a two-page landscape PDF with the property record card and a curated review summary.</p>
      </div>
      <button type="button" class="next-step-button property-report-download-button" data-property-report-download>Download Property Report</button>
    </article>
  `;

  reviewPanel?.after(section);
  initPropertyReportExport({ data, recordCard: context.recordCard, context });
}

function alignPrimaryJourneyNextSteps() {
  updateNextStep("your-property", "what-changed", "Now review what changed.", "Go to What Changed");
  updateNextStep("your-assessment", "valuation-detail", "Now review what may be driving the value.", "Go to Value Detail");
  updateNextStep("market-area", "equalization", "Now check the fairness layer.", "Go to Equalization");
  updateNextStep("county-equalization", "tax-context", "Now connect the value base to taxes.", "Go to Tax Context");
  updateNextStep("your-taxes", "review-signals", "Now review neutral signals.", "Go to Review Signals");
  appendFinalSummaryStep();
}

function updateNextStep(panelId, nextRoute, heading, buttonLabel) {
  const panel = document.querySelector(`[data-guided-panel="${panelId}"]`);
  const button = panel?.querySelector(".next-step-card [data-guided-next]");
  const headingNode = button?.closest(".next-step-card")?.querySelector("h3");

  if (!button) return;
  button.dataset.guidedNext = nextRoute;
  button.textContent = buttonLabel;
  if (headingNode) headingNode.textContent = heading;
}

function appendFinalSummaryStep() {
  const panel = document.querySelector('[data-guided-panel="review-checklist"]');
  if (!panel || panel.querySelector('[data-guided-next="final-summary"]')) return;

  const next = document.createElement("article");
  next.className = "next-step-card";
  next.innerHTML = `
    <div>
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Final step</p>
      <h3 class="mt-1 text-lg font-bold text-slate-700">Finish with a summary.</h3>
      <p class="mt-1 text-sm text-slate-600">Review what you learned and any optional next steps without treating a filing as the expected outcome.</p>
    </div>
    <button type="button" data-guided-next="final-summary" class="next-step-button">Go to Summary</button>
  `;
  panel.append(next);
}
