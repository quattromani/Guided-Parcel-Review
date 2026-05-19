import { escapeHtml } from "./utils/html.js";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const MONTH_SHORT_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

const MONTH_COMPACT_LABELS = MONTHS.map(month => month.slice(0, 1));

const PHASES = [
  "Early Year: Exemptions & Reporting",
  "Valuation Notice Season",
  "Review & Equalization",
  "Certification & Budgets",
  "Levy Setting & Tax Bills",
  "Year-End / Carryover"
];

const TYPE_LABELS = {
  "taxpayer-action": "Taxpayer action",
  "assessor-duty": "Assessor duty",
  "boe-process": "BOE process",
  "state-certification": "State certification",
  "taxing-authority": "Taxing authority",
  treasurer: "Treasurer",
  informational: "Information"
};

const PRIORITY_ORDER = {
  high: 0,
  medium: 1,
  low: 2
};

const MAJOR_PROCESS_TYPES = new Set([
  "assessor-duty",
  "boe-process",
  "state-certification",
  "taxing-authority",
  "treasurer"
]);

function closestElement(target, selector) {
  if (target instanceof Element) return target.closest(selector);
  return target?.parentElement?.closest(selector) ?? null;
}

export function initAssessmentDatesPanel(calendarData = {}) {
  const modal = document.getElementById("assessmentDatesPanel");
  const content = document.getElementById("assessmentDatesContent");
  const closeButtons = document.querySelectorAll("[data-close-assessment-dates]");

  if (!modal || !content) return null;

  const events = normalizeEvents(calendarData.events || []);
  const assessmentYear = calendarData.assessmentYear || new Date().getFullYear();
  let selectedMonthIndex = clampMonthIndex(new Date().getMonth());
  let viewMode = "taxpayer";
  let returnFocusTo = null;

  function render() {
    const today = startOfDay(new Date());

    content.innerHTML = renderAssessmentDatesContent({
      calendarData,
      events,
      assessmentYear,
      selectedMonthIndex,
      today,
      viewMode
    });

    content.querySelectorAll("[data-assessment-view]").forEach(button => {
      button.addEventListener("click", () => {
        viewMode = button.dataset.assessmentView === "admin" ? "admin" : "taxpayer";
        render();
      });
    });

    content.querySelectorAll("[data-assessment-month]").forEach(button => {
      button.addEventListener("click", () => {
        selectedMonthIndex = clampMonthIndex(Number(button.dataset.assessmentMonth));
        render();
      });
    });
  }

  function open(event) {
    returnFocusTo = event?.currentTarget || document.activeElement;
    render();
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    modal.setAttribute("aria-hidden", "false");
    document.querySelectorAll("[data-assessment-dates-open]").forEach(button => button.setAttribute("aria-expanded", "true"));
    document.body.classList.add("overflow-hidden");
    modal.querySelector("[data-close-assessment-dates]")?.focus();
  }

  function close() {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    modal.setAttribute("aria-hidden", "true");
    document.querySelectorAll("[data-assessment-dates-open]").forEach(button => button.setAttribute("aria-expanded", "false"));
    document.body.classList.remove("overflow-hidden");
    returnFocusTo?.focus?.();
  }

  document.querySelectorAll("[data-assessment-dates-open]").forEach(button => {
    button.setAttribute("aria-expanded", "false");
  });

  document.addEventListener("click", event => {
    const trigger = closestElement(event.target, "[data-assessment-dates-open]");
    if (!trigger) return;

    event.preventDefault();
    if (!trigger.hasAttribute("aria-expanded")) {
      trigger.setAttribute("aria-expanded", "false");
    }
    open({ currentTarget: trigger });
  });

  closeButtons.forEach(button => button.addEventListener("click", close));
  modal.addEventListener("click", close);
  modal.querySelector("[role='dialog']")?.addEventListener("click", event => event.stopPropagation());

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
      close();
    }
  });

  return { open, close, render };
}

function renderAssessmentDatesContent({
  calendarData,
  events,
  assessmentYear,
  selectedMonthIndex,
  today,
  viewMode
}) {
  const visibleEvents = filterEventsByView(events, viewMode);
  const nowNextItems = getNowNextItems(visibleEvents, today);
  const summary = currentMeaningText(visibleEvents, today);
  const sourceLinks = calendarData.metadata?.sourceLinks || [];
  const todayLabel = formatDate(today);

  return `
    <section class="assessment-dates-shell assessment-dates-mode-${escapeHtml(viewMode)}" aria-labelledby="assessmentDatesTitle">
      <div class="assessment-dates-hero">
        <div>
          <p class="guided-kicker">Reference panel</p>
          <h2 id="assessmentDatesTitle">Assessment Dates</h2>
          <p>${escapeHtml(calendarData.metadata?.subtitle || "A plain-English guide to the assessment year, taxpayer deadlines, and major equalization events.")}</p>
        </div>
        <div class="assessment-dates-mode" aria-label="Assessment date view mode">
          ${renderViewModeButton("taxpayer", "Taxpayer View", viewMode)}
          ${renderViewModeButton("admin", "Assessor/Admin View", viewMode)}
        </div>
      </div>

      <section class="assessment-dates-section assessment-dates-section-current" aria-labelledby="currentUpcomingTitle">
        <div class="assessment-section-heading">
          <div>
            <p class="guided-kicker">Today: ${escapeHtml(todayLabel)}</p>
            <h3 id="currentUpcomingTitle">Current & Upcoming</h3>
          </div>
        </div>
        <div class="assessment-now-grid">
          ${nowNextItems.map(item => renderNowNextCard(item, today)).join("")}
        </div>
      </section>

      <section class="assessment-dates-section assessment-dates-section-meaning" aria-labelledby="whatThisMeansTitle">
        <div class="assessment-meaning-panel">
          <p class="guided-kicker">What this means right now</p>
          <h3 id="whatThisMeansTitle">What This Means Right Now</h3>
          <p>${escapeHtml(summary)}</p>
        </div>
      </section>

      <section class="assessment-dates-section assessment-dates-section-reference" aria-labelledby="referenceTitle">
        <div class="assessment-section-heading">
          <div>
            <p class="guided-kicker">${escapeHtml(String(assessmentYear))} reference</p>
            <h3 id="referenceTitle">Full Reference Calendar</h3>
          </div>
        </div>
        ${renderMonthReference(visibleEvents, selectedMonthIndex, assessmentYear, today, viewMode)}
      </section>

      <section class="assessment-dates-section assessment-dates-section-timeline" aria-labelledby="timelineTitle">
        ${renderTimelineDisclosure(visibleEvents, today, viewMode)}
      </section>

      <section class="assessment-dates-source-note" aria-label="Assessment date sources">
        <p>${escapeHtml(calendarData.metadata?.sourceNote || "Dates should be verified against current official sources before public use.")}</p>
        ${sourceLinks.length ? `
          <div>
            ${sourceLinks.map(link => `
              <a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>
            `).join("")}
          </div>
        ` : ""}
      </section>
    </section>
  `;
}

function renderTimelineDisclosure(events, today, viewMode) {
  return `
    <details class="assessment-timeline-disclosure">
      <summary>
        <span>
          <span class="guided-kicker">${escapeHtml(viewMode === "admin" ? "Fuller internal reference" : "Taxpayer-facing sequence")}</span>
          <span id="timelineTitle">Assessment Year Timeline</span>
        </span>
        <span class="assessment-timeline-disclosure-action">See Whole Year Timeline</span>
      </summary>
      <div class="assessment-timeline-disclosure-body">
        ${renderTimeline(events, today)}
      </div>
    </details>
  `;
}

function renderViewModeButton(mode, label, currentMode) {
  const active = mode === currentMode;

  return `
    <button
      type="button"
      class="${active ? "assessment-mode-active" : ""}"
      data-assessment-view="${escapeHtml(mode)}"
      aria-pressed="${String(active)}"
    >
      ${escapeHtml(label)}
    </button>
  `;
}

function renderNowNextCard(item, today) {
  const event = item.event;
  const status = getEventStatus(event, today);

  return `
    <article class="assessment-now-card assessment-status-${status} assessment-event-type-${escapeHtml(event.type)}">
      <div class="assessment-card-topline">
        <span>${escapeHtml(item.label)}</span>
        ${renderBadge(event)}
      </div>
      <h4>${escapeHtml(event.title)}</h4>
      <p class="assessment-date-label">${escapeHtml(item.dateLabel || dateRangeLabel(event))}</p>
      <p>${escapeHtml(event.plainEnglish)}</p>
      <div class="assessment-card-why">
        <span>Why it matters</span>
        <p>${escapeHtml(event.whyItMatters)}</p>
      </div>
      ${renderSource(event)}
    </article>
  `;
}

function renderTimeline(events, today) {
  const grouped = getEventsByPhase(events);

  return `
    <div class="assessment-timeline">
      ${PHASES.map(phase => {
        const phaseEvents = grouped.get(phase) || [];

        if (!phaseEvents.length) return "";

        return `
          <section class="assessment-timeline-phase">
            <div class="assessment-timeline-phase-marker" aria-hidden="true"></div>
            <div>
              <h4>${escapeHtml(phase)}</h4>
              <div class="assessment-timeline-events">
                ${phaseEvents.map(event => renderTimelineEvent(event, today)).join("")}
              </div>
            </div>
          </section>
        `;
      }).join("")}
    </div>
  `;
}

function renderTimelineEvent(event, today) {
  const status = getEventStatus(event, today);

  return `
    <article class="assessment-timeline-event assessment-status-${status} assessment-event-type-${escapeHtml(event.type)}">
      <div>
        <p class="assessment-date-label">${escapeHtml(shortDateRangeLabel(event))}</p>
        <h5>${escapeHtml(event.title)}</h5>
        <p>${escapeHtml(event.whyItMatters)}</p>
      </div>
      <div>
        ${renderBadge(event)}
        <span class="assessment-status-label">${escapeHtml(statusLabel(status))}</span>
      </div>
    </article>
  `;
}

function renderMonthReference(events, selectedMonthIndex, assessmentYear, today, viewMode) {
  const monthEvents = getEventsForMonth(events, selectedMonthIndex, assessmentYear);
  const selectedMonth = MONTHS[selectedMonthIndex];

  return `
    <div class="assessment-month-switcher" aria-label="Select month">
      ${MONTH_SHORT_LABELS.map((label, index) => `
        <button
          type="button"
          data-assessment-month="${index}"
          class="${index === selectedMonthIndex ? "assessment-month-active" : ""}"
          aria-label="${escapeHtml(MONTHS[index])}"
          aria-pressed="${String(index === selectedMonthIndex)}"
        >
          <span class="assessment-month-label-full">${escapeHtml(label)}</span>
          <span class="assessment-month-label-compact" aria-hidden="true">${escapeHtml(MONTH_COMPACT_LABELS[index])}</span>
        </button>
      `).join("")}
    </div>
    <div class="assessment-month-list" aria-live="polite">
      <h4>${escapeHtml(selectedMonth)}</h4>
      ${monthEvents.length ? monthEvents.map(event => renderMonthEvent(event, today, viewMode)).join("") : `
        <p class="assessment-empty-month">No reference entries for ${escapeHtml(selectedMonth)} in ${escapeHtml(viewMode === "admin" ? "Assessor/Admin View" : "Taxpayer View")}.</p>
      `}
    </div>
  `;
}

function renderMonthEvent(event, today, viewMode) {
  const status = getEventStatus(event, today);

  return `
    <article class="assessment-month-event assessment-status-${status} assessment-event-type-${escapeHtml(event.type)}">
      <div class="assessment-month-date">${escapeHtml(shortDateRangeLabel(event))}</div>
      <div class="assessment-month-event-body">
        <h5>${escapeHtml(event.title)}</h5>
        <p>${escapeHtml(event.plainEnglish)}</p>
        ${viewMode === "admin" && event.adminNote ? `
          <p class="assessment-admin-note"><span>Admin note:</span> ${escapeHtml(event.adminNote)}</p>
        ` : ""}
        ${renderSource(event)}
      </div>
      <div class="assessment-month-event-meta">
        <span class="assessment-status-label">${escapeHtml(statusLabel(status))}</span>
        ${renderBadge(event)}
      </div>
    </article>
  `;
}

function renderBadge(event) {
  const label = TYPE_LABELS[event.type] || event.type;

  return `<span class="assessment-type-badge assessment-type-${escapeHtml(event.type)}">${escapeHtml(label)}</span>`;
}

function renderSource(event) {
  const { label, note } = sourceLabelParts(event.sourceLabel || "Source pending verification");

  if (!event.sourceUrl) {
    return `
      <div class="assessment-source">
        <p>Source: ${escapeHtml(label)}</p>
        ${note ? `<p class="assessment-source-note">${escapeHtml(note)}</p>` : ""}
      </div>
    `;
  }

  return `
    <div class="assessment-source">
      <p>
        Source:
        <a href="${escapeHtml(event.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>
      </p>
      ${note ? `<p class="assessment-source-note">${escapeHtml(note)}</p>` : ""}
    </div>
  `;
}

function sourceLabelParts(sourceLabel) {
  const [label, ...noteParts] = `${sourceLabel}`.split(";");

  return {
    label: label.trim(),
    note: noteParts.join(";").trim()
  };
}

function getNowNextItems(events, today) {
  const nowNextEvents = events.filter(event => event.showInNowNext);
  const active = getActiveEvents(nowNextEvents, today);
  const nextDeadline = getNextTaxpayerDeadline(nowNextEvents, today);
  const nextMilestone = getNextMajorProcessMilestone(nowNextEvents, today);
  const usedIds = new Set([
    active[0]?.id,
    nextDeadline?.id,
    nextMilestone?.id
  ].filter(Boolean));
  const comingSoon = getUpcomingEvents(nowNextEvents, today)
    .filter(event => !usedIds.has(event.id))
    .find(event => daysUntil(event.start, today) <= 60);
  const items = [];

  if (active[0]) {
    items.push({
      label: "Active now",
      event: active[0],
      dateLabel: dateRangeLabel(active[0])
    });
  }

  if (nextDeadline) {
    items.push({
      label: "Next taxpayer deadline",
      event: nextDeadline,
      dateLabel: deadlineLabel(nextDeadline)
    });
  }

  if (nextMilestone) {
    items.push({
      label: "Next major milestone",
      event: nextMilestone,
      dateLabel: dateRangeLabel(nextMilestone)
    });
  }

  if (comingSoon) {
    items.push({
      label: "Coming soon",
      event: comingSoon,
      dateLabel: dateRangeLabel(comingSoon)
    });
  }

  if (!items.length) {
    const next = getUpcomingEvents(events, today)[0] || sortEvents(events)[0];
    if (next) {
      items.push({
        label: "Next reference point",
        event: next,
        dateLabel: dateRangeLabel(next)
      });
    }
  }

  return items.slice(0, 4);
}

function currentMeaningText(events, today) {
  const activeTaxpayer = getActiveEvents(events, today).find(event => event.type === "taxpayer-action");
  const nextTaxpayerStart = getUpcomingEvents(events, today).find(event => event.type === "taxpayer-action");
  const nextDeadline = getNextTaxpayerDeadline(events, today);
  const nextMilestone = getNextMajorProcessMilestone(events, today);
  const parts = [];

  if (activeTaxpayer) {
    parts.push(`${activeTaxpayer.title} is active now. ${activeTaxpayer.whyItMatters}`);
  } else if (nextTaxpayerStart) {
    parts.push(`${nextTaxpayerStart.title} is coming next. ${nextTaxpayerStart.whyItMatters}`);
  } else if (nextMilestone) {
    parts.push(`${nextMilestone.title} is the next major process step. ${nextMilestone.whyItMatters}`);
  }

  if (nextDeadline) {
    parts.push(`The next taxpayer-facing deadline shown here is ${formatDate(deadlineDate(nextDeadline))} for ${nextDeadline.title.toLowerCase()}.`);
  } else if (nextMilestone) {
    parts.push(`The next process milestone shown here is ${dateRangeLabel(nextMilestone)}.`);
  }

  if (!parts.length) {
    return "No active filing window is shown for today. Use the timeline and month reference to see where the next assessment-year step fits.";
  }

  return `${parts.join(" ")} This panel is a reference guide only; official county and state instructions control filing requirements.`;
}

export function getActiveEvents(events, today = new Date()) {
  return sortEvents(events.filter(event => getEventStatus(event, today) === "active"));
}

export function getUpcomingEvents(events, today = new Date()) {
  return sortEvents(events.filter(event => getEventStatus(event, today) === "upcoming"));
}

export function getNextTaxpayerDeadline(events, today = new Date()) {
  const day = startOfDay(today);

  return events
    .filter(event => event.type === "taxpayer-action")
    .filter(event => event.audience.includes("taxpayer"))
    .filter(event => deadlineDate(event) >= day)
    .sort((a, b) => {
      const deadlineDifference = deadlineDate(a) - deadlineDate(b);
      if (deadlineDifference !== 0) return deadlineDifference;

      return priorityRank(a) - priorityRank(b);
    })[0] || null;
}

export function getNextMajorProcessMilestone(events, today = new Date()) {
  const day = startOfDay(today);

  return events
    .filter(event => MAJOR_PROCESS_TYPES.has(event.type))
    .filter(event => event.start > day)
    .sort((a, b) => {
      const startDifference = a.start - b.start;
      if (startDifference !== 0) return startDifference;

      return priorityRank(a) - priorityRank(b);
    })[0] || null;
}

export function getEventsByMonth(events, assessmentYear) {
  return MONTHS.reduce((map, month, index) => {
    map.set(month, getEventsForMonth(events, index, assessmentYear));
    return map;
  }, new Map());
}

export function getEventsByPhase(events) {
  return sortEvents(events).reduce((map, event) => {
    const phase = event.phase || "Year-End / Carryover";
    const group = map.get(phase) || [];
    group.push(event);
    map.set(phase, group);
    return map;
  }, new Map());
}

export function getEventStatus(event, today = new Date()) {
  const day = startOfDay(today);

  if (event.start <= day && event.end >= day) return "active";
  if (event.start > day) return "upcoming";

  return "past";
}

function filterEventsByView(events, viewMode) {
  if (viewMode === "admin") return sortEvents(events);

  return sortEvents(events.filter(event => event.audience.includes("taxpayer")));
}

function getEventsForMonth(events, selectedMonthIndex, assessmentYear) {
  const monthStart = new Date(assessmentYear, selectedMonthIndex, 1);
  const monthEnd = new Date(assessmentYear, selectedMonthIndex + 1, 0);

  return sortEvents(events.filter(event =>
    !event.hideInFullReference && event.start <= monthEnd && event.end >= monthStart
  ));
}

function normalizeEvents(events) {
  return events.map(event => {
    const start = parseIsoDate(event.startDate);
    const end = parseIsoDate(event.endDate || event.startDate);

    return {
      ...event,
      audience: event.audience || [],
      end,
      start,
      deadline: event.deadlineDate ? parseIsoDate(event.deadlineDate) : null
    };
  });
}

function sortEvents(events) {
  return [...events].sort((a, b) => {
    const startDifference = a.start - b.start;
    if (startDifference !== 0) return startDifference;

    return priorityRank(a) - priorityRank(b);
  });
}

function priorityRank(event) {
  return PRIORITY_ORDER[event.priority] ?? 3;
}

function parseIsoDate(value) {
  const [year, month, day] = `${value}`.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function startOfDay(value) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function dateRangeLabel(event) {
  if (sameDate(event.start, event.end)) {
    return formatDate(event.start);
  }

  if (event.start.getFullYear() === event.end.getFullYear()) {
    if (event.start.getMonth() === event.end.getMonth()) {
      return `${formatMonthDay(event.start)}-${event.end.getDate()}, ${event.end.getFullYear()}`;
    }

    return `${formatMonthDay(event.start)}-${formatMonthDay(event.end)}, ${event.end.getFullYear()}`;
  }

  return `${formatDate(event.start)}-${formatDate(event.end)}`;
}

function shortDateRangeLabel(event) {
  if (sameDate(event.start, event.end)) {
    return formatMonthDay(event.start);
  }

  if (event.start.getMonth() === event.end.getMonth()) {
    return `${formatMonthDay(event.start)}-${event.end.getDate()}`;
  }

  return `${formatMonthDay(event.start)}-${formatMonthDay(event.end)}`;
}

function deadlineLabel(event) {
  return `Deadline: ${formatDate(deadlineDate(event))}`;
}

function deadlineDate(event) {
  return event.deadline || event.end || event.start;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatMonthDay(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function sameDate(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function statusLabel(status) {
  if (status === "active") return "Active";
  if (status === "upcoming") return "Upcoming";

  return "Past";
}

function daysUntil(date, today) {
  return Math.ceil((startOfDay(date) - startOfDay(today)) / 86400000);
}

function clampMonthIndex(index) {
  if (Number.isNaN(index)) return 0;

  return Math.min(11, Math.max(0, index));
}
