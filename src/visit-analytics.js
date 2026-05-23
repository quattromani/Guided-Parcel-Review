const VISIT_ANALYTICS_ENDPOINT = "https://script.google.com/macros/s/AKfycby5H_CPJ7wLPcREsIIKChZC4Mnyg37gGcwLVLjT05uJAKQK2liNIoc5wYGKtKIh-IsW/exec";
const VISIT_ANALYTICS_SECRET = "parcel-visits-2026-private-log";
const VISIT_ID_SESSION_KEY = "guidedParcelReview.visitId.v1";
const HEARTBEAT_INTERVAL_MS = 30000;

const analyticsState = {
  active: false,
  context: {},
  furthestStep: "",
  heartbeatTimer: null,
  lastVisitEndAt: 0,
  routeOrder: [],
  startTime: 0,
  stepStartTime: 0,
  currentStep: ""
};

export function initVisitAnalytics(context = {}) {
  if (typeof window === "undefined" || analyticsState.active) return;
  if (shouldSkipVisitAnalytics()) return;

  analyticsState.active = true;
  analyticsState.context = normalizeContext(context);
  analyticsState.startTime = Date.now();
  analyticsState.stepStartTime = analyticsState.startTime;
  trackVisitEvent("visit_start");

  window.addEventListener("pagehide", () => {
    trackCurrentStepDuration();
    trackVisitEvent("visit_end");
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      trackCurrentStepDuration();
      trackVisitEvent("visit_end");
    }
  });

  window.addEventListener("error", event => {
    trackVisitEvent("client_error", {
      step: analyticsState.currentStep,
      errorMessage: event.message || "Client error"
    });
  });

  window.addEventListener("unhandledrejection", event => {
    trackVisitEvent("client_error", {
      step: analyticsState.currentStep,
      errorMessage: event.reason?.message || String(event.reason || "Unhandled rejection")
    });
  });

  analyticsState.heartbeatTimer = window.setInterval(() => {
    trackVisitEvent("heartbeat", {
      step: analyticsState.currentStep
    });
  }, HEARTBEAT_INTERVAL_MS);
}

export function trackDirectStartView(property = {}) {
  const context = normalizeContext(propertyContextFromManifestProperty(property));
  initVisitAnalytics(context);
  trackVisitEvent("direct_start_view", context);
}

export function trackDirectStartAcknowledged(property = {}) {
  const context = normalizeContext(propertyContextFromManifestProperty(property));
  initVisitAnalytics(context);
  trackVisitEvent("direct_start_acknowledged", context);
}

export function trackParcelView(context = {}) {
  initVisitAnalytics(context);
  trackVisitEvent("parcel_view");
}

export function configureStepTracking(routes = []) {
  analyticsState.routeOrder = routes.filter(route => !route.secondary).map(route => route.id);
}

export function trackStepView(step) {
  if (!step) return;
  if (analyticsState.currentStep === step) return;

  if (analyticsState.currentStep && analyticsState.currentStep !== step) {
    trackCurrentStepDuration();
  }

  analyticsState.currentStep = step;
  analyticsState.stepStartTime = Date.now();
  analyticsState.furthestStep = furthestStep(analyticsState.furthestStep, step);

  trackVisitEvent("step_view", {
    step,
    furthestStep: analyticsState.furthestStep
  });
}

export function trackResourceClick(label = "") {
  trackVisitEvent("resource_click", {
    step: analyticsState.currentStep,
    detail: label
  });
}

export function trackFormOpen(label = "") {
  trackVisitEvent("form_open", {
    step: analyticsState.currentStep,
    detail: label
  });
}

export function trackPropertySwitch(propertyId = "") {
  trackVisitEvent("property_switch", {
    step: analyticsState.currentStep,
    targetPropertyId: propertyId
  });
}

export function propertyAnalyticsContext(data = {}, propertySwitcher = {}) {
  const property = propertySwitcher.manifest?.properties?.find(item => item.id === propertySwitcher.activePropertyId);

  return normalizeContext({
    propertyId: propertySwitcher.activePropertyId || property?.id || data.propertyId || "",
    parcelId: data.parcel?.parcelId || property?.parcelId || "",
    propertyClass: data.property?.propertyClass || property?.propertyClass || data.parcel?.propertyClass || "",
    county: property?.county || data.county?.id || data.county?.name || ""
  });
}

function trackCurrentStepDuration() {
  if (!analyticsState.currentStep || !analyticsState.stepStartTime) return;

  trackVisitEvent("step_duration", {
    step: analyticsState.currentStep,
    stepElapsedSeconds: secondsSince(analyticsState.stepStartTime),
    furthestStep: analyticsState.furthestStep
  });
}

function trackVisitEvent(event, details = {}) {
  if (typeof window === "undefined" || !VISIT_ANALYTICS_ENDPOINT) return;
  if (shouldSkipVisitAnalytics()) return;
  if (event === "visit_end" && Date.now() - analyticsState.lastVisitEndAt < 2000) return;
  if (event === "visit_end") analyticsState.lastVisitEndAt = Date.now();

  const payload = {
    secret: VISIT_ANALYTICS_SECRET,
    timestamp: new Date().toISOString(),
    event,
    visitId: visitId(),
    ...analyticsState.context,
    ...details,
    elapsedSeconds: secondsSince(analyticsState.startTime || Date.now()),
    furthestStep: details.furthestStep ?? analyticsState.furthestStep,
    viewport: viewportBucket(),
    path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    referrer: document.referrer || "",
    userAgent: navigator.userAgent || ""
  };

  sendPayload(payload);
}

function sendPayload(payload) {
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
    if (navigator.sendBeacon(VISIT_ANALYTICS_ENDPOINT, blob)) return;
  }

  fetch(VISIT_ANALYTICS_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    keepalive: true,
    headers: {
      "Content-Type": "text/plain;charset=UTF-8"
    },
    body
  }).catch(() => {
    // Analytics should never interrupt the review experience.
  });
}

function normalizeContext(context = {}) {
  return {
    propertyId: context.propertyId || context.id || "",
    parcelId: context.parcelId || "",
    invite: inviteToken(),
    propertyClass: context.propertyClass || "",
    county: context.county || ""
  };
}

function propertyContextFromManifestProperty(property = {}) {
  return {
    propertyId: property.id,
    parcelId: property.parcelId,
    propertyClass: property.propertyClass,
    county: property.county
  };
}

function visitId() {
  try {
    const existing = window.sessionStorage?.getItem(VISIT_ID_SESSION_KEY);
    if (existing) return existing;

    const next = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : randomVisitId();
    window.sessionStorage?.setItem(VISIT_ID_SESSION_KEY, next);
    return next;
  } catch {
    analyticsState.visitId ??= randomVisitId();
    return analyticsState.visitId;
  }
}

function randomVisitId() {
  return `visit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function inviteToken() {
  return new URLSearchParams(window.location.search).get("invite") || "";
}

function viewportBucket() {
  const width = window.innerWidth || document.documentElement.clientWidth || 0;
  if (width < 700) return "mobile";
  if (width < 1100) return "tablet";
  return "desktop";
}

function shouldSkipVisitAnalytics() {
  return isLocalWorkingHost() || isWorkingSessionUserAgent(navigator.userAgent || "");
}

function isLocalWorkingHost() {
  const hostname = window.location.hostname;

  return hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === "::1"
    || hostname.endsWith(".localhost");
}

function isWorkingSessionUserAgent(userAgent) {
  return /(?:codex|chatgpt|openai|headlesschrome|playwright|puppeteer)(?:\/|\b)/i.test(userAgent);
}

function secondsSince(timestamp) {
  if (!timestamp) return 0;
  return Math.max(0, Math.round((Date.now() - timestamp) / 1000));
}

function furthestStep(current, next) {
  const currentIndex = analyticsState.routeOrder.indexOf(current);
  const nextIndex = analyticsState.routeOrder.indexOf(next);

  if (nextIndex === -1) return current || next;
  if (currentIndex === -1) return next;

  return nextIndex > currentIndex ? next : current;
}
