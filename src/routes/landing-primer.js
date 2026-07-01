import {
  calculateEtr,
  formatNullableMoney,
  formatNullablePercent,
  money,
  moneyCents
} from "../format.js?v=20260701-article-polish-4";
import { hasValue, latestKnown, percentChange, previousKnown } from "../calculations/history.js?v=20260701-article-polish-4";
import {
  getClassMarketStats,
  getParcelMarketClass,
  getParcelMarketGroupId
} from "../market-stats.js?v=20260701-article-polish-4";
import { quickReadSummaryMarkup, taxStatementShorthandMarkup } from "../render.js?v=20260701-article-polish-4";
import { initPropertyReportExport } from "../reports/property-report.js?v=20260701-article-polish-4";
import { compactParts, formatSquareFeet } from "../utils/display.js?v=20260701-article-polish-4";
import { escapeHtml } from "../utils/html.js?v=20260701-article-polish-4";
import {
  getReviewFlags,
  REVIEW_FLAGS_CHANGED_EVENT
} from "../review-flags.js?v=20260701-article-polish-4";

const integer = new Intl.NumberFormat("en-US");

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
    pill = null,
    className = ""
  } = normalized;
  const metricClassName = className ? ` ${className}` : "";

  return `
    <div class="civic-notice-metric civic-notice-metric-${layout}${metricClassName}">
      <dt>
        <span>${escapeHtml(label)}</span>
        ${pill ? `<span class="civic-notice-pill civic-notice-pill-${escapeHtml(pill.tone || "default")}">${escapeHtml(pill.label)}</span>` : ""}
      </dt>
      <dd>${value}</dd>
      ${note ? `<p>${escapeHtml(note)}</p>` : ""}
    </div>
  `;
}

function propertySnapshotSummary(notice, options = {}) {
  const {
    kicker = "Property record",
    title = "Property review starting point",
    showStatus = true,
    showAction = true,
    showSource = true
  } = options;
  const address = notice.displayAddress || notice.situsAddress;
  const statusLabel = `${notice.assessmentLabel} status ${notice.valueStatusLabel}`;

  return `
    <section class="civic-notice-summary" aria-labelledby="assessmentSnapshotTitle">
      <div class="civic-notice-heading">
        <div>
          <p class="guided-kicker">${escapeHtml(kicker)}</p>
          <h3 id="assessmentSnapshotTitle">${escapeHtml(title)}</h3>
        </div>
        ${showStatus ? `
          <div class="notice-status-group" aria-label="${escapeHtml(statusLabel)}">
            <span>${escapeHtml(notice.assessmentLabel)}:</span>
            <span class="notice-status-pill ${statusToneClass(notice.valueStatusLabel)}">${escapeHtml(notice.valueStatusLabel)}</span>
          </div>
        ` : ""}
      </div>

      <dl class="civic-notice-grid">
        ${noticeMetric("Situs address", escapeHtml(address))}
        ${noticeMetric("Parcel ID", escapeHtml(notice.parcelId))}
        ${noticeMetric("Property class", escapeHtml(notice.propertyClass))}
        ${noticeMetric("Tax district", escapeHtml(notice.taxDistrict))}
        ${noticeMetric("Current assessed value", displayMoneyWithFallback(notice.currentAssessedValue, notice.latestKnownValue, notice.latestKnownValueYear), {
          layout: "full",
          className: "civic-notice-metric-current-value",
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

      ${showAction || showSource ? `
      <div class="civic-notice-footer ${showAction ? "" : "civic-notice-footer-source-only"}">
        ${showSource ? `<p class="civic-source-note">Source: ${escapeHtml(notice.source)}.</p>` : ""}
        ${showAction ? `<button type="button" data-guided-next="property-record" class="next-step-button">Go to Property Record</button>` : ""}
      </div>
      ` : ""}
    </section>
  `;
}

function statusToneClass(status) {
  return `${status ?? ""}`.toLowerCase() === "pending" ? "notice-status-pill-pending" : "";
}

function formatRatio(value) {
  return hasValue(value) ? `${Number(value).toFixed(2)}%` : "not listed";
}

function itemCountLabel(count, singular, plural = `${singular}s`) {
  return `${integer.format(count)} ${count === 1 ? singular : plural}`;
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
  const reviewSignals = signals.filter(signal => signal.tone === "review");
  if (reviewSignals.length) {
    const titles = reviewSignals.slice(0, 2).map(signal => signal.title).filter(Boolean);
    const remaining = reviewSignals.length - titles.length;
    return remaining > 0 ? `${titles.join(" · ")} · ${remaining} more` : titles.join(" · ");
  }

  const counts = signals.reduce((acc, signal) => {
    acc[signal.tone] = (acc[signal.tone] ?? 0) + 1;
    return acc;
  }, {});

  const parts = [
    counts.informational ? `${counts.informational} informational` : "",
    counts.steady ? `${counts.steady} generally consistent` : ""
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "No review signals generated";
}

function signalSummary(signals) {
  const reviewSignal = signals.find(signal => signal.tone === "review");
  return reviewSignal?.summary || "Review signals point to source items to verify. They are not conclusions.";
}

function valueMovementLabel(change) {
  if (!Number.isFinite(change)) return "Value movement";
  if (change > 0) return `Value up ${formatNullablePercent(change)}`;
  if (change < 0) return `Value down ${formatNullablePercent(Math.abs(change))}`;
  return "Value flat";
}

function valueMovementMeta(latestValue, previousValue) {
  if (!latestValue || !previousValue) {
    return latestValue
      ? `Latest listed value: ${formatNullableMoney(latestValue.assessedValue)} (${latestValue.year})`
      : "No assessed value listed";
  }

  return `${formatNullableMoney(previousValue.assessedValue)} to ${formatNullableMoney(latestValue.assessedValue)} · ${previousValue.year}-${latestValue.year}`;
}

function valueMovementNote(latestValueMovement, latestValue, previousValue, notice, currentYearPending) {
  if (Number.isFinite(latestValueMovement) && latestValue && previousValue) {
    return currentYearPending
      ? `Current ${notice.taxYear} value is pending; the latest listed year sets the working value base.`
      : `This sets the property value in the ${latestValue.year} assessment base.`;
  }

  return "Value movement depends on which assessment years are available.";
}

function finalReviewCard(card) {
  const toneClass = card.tone ? ` final-review-kpi-card-${card.tone}` : "";
  const actionClass = card.actionTone ? ` final-review-card-action-${card.actionTone}` : "";
  const actionLabel = card.actionLabel || "Review";
  const actionAriaLabel = card.actionAriaLabel || actionLabel;
  const actionTarget = card.anchor || card.route;
  const reviewAction = card.route ? `
      <a href="#${escapeHtml(actionTarget)}" class="final-review-card-action${actionClass}" aria-label="${escapeHtml(actionAriaLabel)}">${escapeHtml(actionLabel)}</a>
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
  const reviewSignalCount = reviewSignals.filter(signal => signal.tone === "review").length;
  const reviewFlagCount = getReviewFlags(data.parcel?.parcelId).length;
  const propertyDetails = compactParts([
    formatSquareFeet(residential.buildingSize, { fallback: null }),
    [residential.quality, residential.condition].filter(Boolean).join(" / ") || null,
    notice.taxDistrict ? `tax district ${notice.taxDistrict}` : null
  ]);

  return {
    heading: `Review of the main assessment summary for ${notice.displayAddress || notice.situsAddress}`,
    intro: "This gathers the main points from the record, value, equalization, taxes, and review signals.",
    blocks: [
      {
        narrative: "Start with the parcel facts. Then check value status, tax statement status, and payment status separately.",
        cards: [
          {
            step: "Step 1 · Property Record",
            route: "property-record",
            anchor: reviewFlagCount ? "verify-property-information" : "",
            actionLabel: reviewFlagCount ? `${reviewFlagCount} marked` : "Review",
            actionAriaLabel: reviewFlagCount
              ? `Go back to property record to review ${itemCountLabel(reviewFlagCount, "marked property detail")}`
              : "Review property record",
            actionTone: reviewFlagCount ? "marked" : "",
            value: `${notice.propertyClass} property`,
            meta: `Parcel ${notice.parcelId}`,
            note: propertyDetails
              ? `The record includes ${propertyDetails}.`
              : "The record provides the parcel identity and core property description used later in the review."
          },
          {
            step: "Step 2 · What Changed",
            route: "what-changed",
            value: valueMovementLabel(latestValueMovement),
            tone: currentYearPending ? "pending" : "",
            meta: valueMovementMeta(latestValue, previousValue),
            note: valueMovementNote(latestValueMovement, latestValue, previousValue, notice, currentYearPending)
          }
        ]
      },
      {
        narrative: "Next, compare local sales, equalization measures, and tax results.",
        cards: [
          {
            step: "Step 3 · Value Detail",
            route: "valuation-detail",
            value: marketAreaName(context.recordCard, marketArea, marketAreaSummary.classKey),
            meta: marketArea?.count ? itemCountLabel(marketArea.count, "qualified sale") : "Market-area context",
            note: marketArea
              ? `Median (middle) ratio ${formatRatio(marketArea.median)}, COD ${formatRatio(marketArea.cod)}, PRD ${formatRatio(marketArea.prd)}.`
              : "Market data helps compare this property with nearby sales. It is not a conclusion about this parcel by itself."
          },
          {
            step: "Step 4 · Equalization",
            route: "equalization",
            value: "Equalization check",
            meta: "Required level and uniformity",
            note: "Equalization does not stop market changes or set the levy. It checks level and consistency across assessments."
          },
          {
            step: "Step 5 · Tax Context",
            route: "tax-context",
            value: latestEtr !== null ? `ETR ${formatNullablePercent(latestEtr)}` : "ETR pending",
            meta: latestTax ? `Net tax ${moneyCents.format(latestTax.taxes)} (${latestTax.year})` : "No tax statement listed",
            note: "Effective tax rate compares net tax with assessed value after levy, credits, and exemptions are applied."
          },
          {
            step: "Step 6 · Review Signals",
            tone: reviewSignalCount ? "review" : "",
            value: itemCountLabel(reviewSignalCount, "item"),
            meta: reviewSignalCount ? signalMeta(reviewSignals) : "Generally consistent",
            note: reviewSignalCount ? signalSummary(reviewSignals) : "Loaded records did not surface an obvious record mismatch."
          }
        ]
      }
    ]
  };
}

export function installCivicJourneyPanels(data, context = {}) {
  installReviewSignalsPanel(data, context);
  installFinalSummary(data, context);
}

function installReviewSignalsPanel(data, context = {}) {
  const panel = document.querySelector('[data-guided-panel="review-checklist"]');
  if (!panel) return;

  const finalReview = buildFinalReviewModel(data, context);

  panel.innerHTML = `
    <aside class="guided-transition">
      <p>This page gathers the main signals from the earlier steps. It highlights items that may deserve a closer look. It does not make conclusions or recommendations.</p>
    </aside>

    <article class="civic-summary-shell civic-final-review">
      <div>
        <p class="guided-kicker">Final review</p>
        <h2>${escapeHtml(finalReview.heading)}.</h2>
        <p>${escapeHtml(finalReview.intro)}</p>
      </div>

      ${finalReview.blocks.map(finalReviewBlock).join("")}
    </article>

    <aside class="guided-transition guided-step-handoff">
      <p>You have reviewed the key facts, value movement, equalization, and tax context. Next, take one last look at the summary. If you marked any property details for review, you can submit them there.</p>
    </aside>

    <nav class="guided-next-action" aria-label="Continue review">
      <a href="#final-summary" data-guided-next="final-summary" class="next-step-button">Go to Summary</a>
    </nav>
  `;
}

function installFinalSummary(data, context = {}) {
  const existing = document.querySelector('[data-guided-panel="final-summary"]');
  existing?.remove();

  const notice = data.snapshotModel.viewModels.notice;
  const reviewPanel = document.querySelector('[data-guided-panel="review-checklist"]');
  const section = document.createElement("section");
  section.dataset.guidedPanel = "final-summary";
  section.className = "is-hidden flow-space-6";

  section.innerHTML = `
    <aside class="guided-transition">
      <p>Start with the property snapshot. Then read the quick summary for value, market, taxes, and county context. If you marked any property details for review, you can submit them below.</p>
    </aside>

    <article class="civic-summary-shell civic-summary-snapshot">
      ${propertySnapshotSummary(notice, {
        kicker: "Property snapshot",
        title: "Record values at a glance",
        showStatus: false,
        showAction: false,
        showSource: false
      })}
    </article>

    <section class="summary-tax-equation-float tax-equation-waterfall" aria-label="Tax statement calculation">
      ${taxStatementShorthandMarkup(data)}
    </section>

    <article class="civic-summary-shell civic-summary-quick-read" aria-labelledby="summaryQuickReadTitle">
      <div>
        <h2 id="summaryQuickReadTitle">Quick read for this property</h2>
      </div>
      ${quickReadSummaryMarkup(data, context.recordCard, context)}
    </article>

    <article class="civic-summary-shell review-flags-summary-shell" aria-labelledby="reviewFlagsSummaryTitle">
      <div>
        <h2 id="reviewFlagsSummaryTitle">Items you marked for review</h2>
      </div>
      <div id="reviewFlagsSummaryContent"></div>
    </article>

    <aside class="guided-transition guided-step-handoff">
      <p>Download a copy of this guided review for your records when you're ready.</p>
    </aside>
    <nav class="guided-next-action" aria-label="Download guided review summary">
      <button type="button" class="next-step-button property-report-download-button" data-property-report-download>Download Guided Review Summary</button>
    </nav>
  `;

  reviewPanel?.after(section);
  renderReviewFlagsSummary(data);
  window.addEventListener(REVIEW_FLAGS_CHANGED_EVENT, event => {
    if (event.detail?.parcelId !== data.parcel?.parcelId) return;
    renderReviewFlagsSummary(data);
  });
  initPropertyReportExport({ data, recordCard: context.recordCard, context });
}

function renderReviewFlagsSummary(data) {
  const container = document.getElementById("reviewFlagsSummaryContent");
  if (!container) return;

  const flags = getReviewFlags(data.parcel?.parcelId);
  const hasFlags = flags.length > 0;
  const shell = container.closest(".review-flags-summary-shell");
  const title = document.getElementById("reviewFlagsSummaryTitle");
  if (shell) {
    shell.classList.toggle("review-flags-summary-shell-active", hasFlags);
    shell.classList.toggle("review-flags-summary-shell-empty", !hasFlags);
  }
  if (title) {
    title.innerHTML = hasFlags
      ? `Items you marked for review <span class="review-flags-count">(${flags.length})</span>`
      : "Items you marked for review";
  }

  container.innerHTML = `
    ${hasFlags ? `
      <div class="review-flags-workspace">
        <section class="review-flags-review-column" aria-label="Marked property details">
          <p class="review-flags-intro">You marked these property details for review:</p>
          <ul class="review-flags-list">
            ${flags.map(flag => `
              <li>
                <div class="review-flags-card-heading">
                  <span>${escapeHtml(flag.label)}</span>
                  ${flag.section ? `<small>${escapeHtml(flag.section)}</small>` : ""}
                </div>
                <dl>
                  <dt>Current value</dt>
                  <dd>${escapeHtml(flag.value || "Not listed")}</dd>
                </dl>
              </li>
            `).join("")}
          </ul>
        </section>
        <section class="review-flags-submit-column" aria-label="Submit marked items for review">
          <p class="review-flags-explainer">You marked these property details for review. If you would like county staff to review them, provide your contact information and any additional context below.</p>
          ${reviewFlagsIntakeForm()}
        </section>
      </div>
    ` : `
      <div class="review-flags-empty">
        <p>You do not have any items marked for review.</p>
        <p>If everything looks good, you can download a summary to keep below.</p>
      </div>
    `}
  `;

  if (hasFlags) initReviewFlagsSubmission(data, flags);
}

function reviewFlagsIntakeForm() {
  return `
    <form id="reviewFlagsIntakeForm" class="review-flags-intake" novalidate>
      <div id="reviewFlagsFormErrors" class="review-flags-form-errors is-hidden" role="alert" aria-live="assertive"></div>
      <div class="review-flags-form-grid">
        <div>
          <label for="reviewFlagsName">Name</label>
          <input id="reviewFlagsName" name="name" type="text" autocomplete="name" required />
        </div>
        <div>
          <label for="reviewFlagsEmail">Email</label>
          <input id="reviewFlagsEmail" name="email" type="email" autocomplete="email" required />
        </div>
        <div class="review-flags-phone-field">
          <label for="reviewFlagsPhone">Phone</label>
          <input id="reviewFlagsPhone" name="phone" type="tel" autocomplete="tel" required />
        </div>
        <div class="review-flags-message-field">
          <label for="reviewFlagsMessage">Optional message / additional explanation</label>
          <textarea id="reviewFlagsMessage" name="message" rows="4"></textarea>
        </div>
      </div>
      <div class="review-flags-submit-row">
        <p id="reviewFlagsSubmitStatus" aria-live="polite"></p>
        <button type="submit" class="next-step-button">Submit these items for review</button>
      </div>
    </form>
  `;
}

function initReviewFlagsSubmission(data, flags) {
  const form = document.getElementById("reviewFlagsIntakeForm");
  const errors = document.getElementById("reviewFlagsFormErrors");
  const status = document.getElementById("reviewFlagsSubmitStatus");
  if (!form) return;

  function setErrors(messages) {
    if (!errors) return;
    if (!messages.length) {
      errors.classList.add("is-hidden");
      errors.innerHTML = "";
      return;
    }
    errors.classList.remove("is-hidden");
    errors.innerHTML = `
      <p>Please review the intake details before preparing the request.</p>
      <ul>${messages.map(message => `<li>${escapeHtml(message)}</li>`).join("")}</ul>
    `;
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    const formData = new FormData(form);
    const contact = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      message: String(formData.get("message") || "").trim()
    };
    const messages = [];

    if (!contact.name) messages.push("Enter your name.");
    if (!contact.email) {
      messages.push("Enter your email address.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      messages.push("Enter a valid email address.");
    }
    if (!contact.phone) messages.push("Enter your phone number.");
    if (!flags.length) messages.push("Mark at least one property detail for review.");

    setErrors(messages);
    if (messages.length) {
      if (status) {
        status.textContent = "The review request needs a little more information.";
        status.className = "review-flags-status-error";
      }
      return;
    }

    const payload = {
      parcelId: data.parcel?.parcelId || "",
      propertyId: data.propertyId || data.parcel?.parcelId || "",
      propertyAddress: data.snapshotModel?.viewModels?.notice?.displayAddress || data.parcel?.situsAddress || "",
      flaggedItems: flags,
      contact,
      timestamp: new Date().toISOString()
    };

    console.info("Mock property-detail review request prepared", payload);
    if (status) {
      status.textContent = "Your review request has been prepared.";
      status.className = "review-flags-status-success";
    }
  });
}
