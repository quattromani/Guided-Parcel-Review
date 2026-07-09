export const VISIT_ANALYTICS_ENDPOINT = "https://script.google.com/macros/s/AKfycbzeQYfADnXXiJrs0UrCMRWVOQaw2Jo1cPnuIrf3dECOwX9PjYdNaEfMRIEpRTm-zd8b_g/exec";
const VISIT_ANALYTICS_SECRET = "parcel-visits-2026-private-log";
const VISIT_ANALYTICS_SCHEMA_VERSION = "visit-analytics.v2";
const VISIT_ID_SESSION_KEY = "guidedParcelReview.visitId.v1";
const HEARTBEAT_INTERVAL_MS = 30000;
const INTERACTION_DEDUPE_WINDOW_MS = 1500;

const analyticsState = {
  active: false,
  context: {},
  furthestStep: "",
  heartbeatTimer: null,
  lastInteractionKey: "",
  lastInteractionAt: 0,
  lastVisitEndAt: 0,
  pageViewId: "",
  routeOrder: [],
  startTime: 0,
  stepStartTime: 0,
  currentStep: ""
};

export function initVisitAnalytics(context = {}) {
  if (typeof window === "undefined" || analyticsState.active) return;
  analyticsState.context = normalizeContext(context);
  if (shouldSkipVisitAnalytics()) return;

  analyticsState.active = true;
  analyticsState.pageViewId = pageViewId();
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

export function trackArticleView(context = {}) {
  initVisitAnalytics(context);
  trackVisitEvent("article_view");
}

export function trackArticleInteraction(action = "", details = {}) {
  if (!action) return;
  const payload = {
    ...details,
    action,
    detail: details.detail || action
  };
  if (isDuplicateInteraction(payload)) return;
  trackVisitEvent("article_interaction", {
    ...payload
  });
}

export function trackArticleScrollDepth(details = {}) {
  trackVisitEvent("article_scroll_depth", details);
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

export function trackPropertySwitch(propertyId = "", details = {}) {
  trackVisitEvent("property_switch", {
    step: analyticsState.currentStep,
    targetPropertyId: propertyId,
    ...details
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
  if (!analyticsState.pageViewId) analyticsState.pageViewId = pageViewId();

  const sourceContext = sourceAttributionContext();
  const browserContext = browserContextFrom(navigator.userAgent || "", document.referrer || "");

  const payload = {
    secret: VISIT_ANALYTICS_SECRET,
    schemaVersion: VISIT_ANALYTICS_SCHEMA_VERSION,
    eventId: eventId(),
    timestamp: new Date().toISOString(),
    event,
    visitId: visitId(),
    pageViewId: analyticsState.pageViewId,
    ...analyticsState.context,
    ...details,
    elapsedSeconds: secondsSince(analyticsState.startTime || Date.now()),
    furthestStep: details.furthestStep ?? analyticsState.furthestStep,
    viewport: viewportBucket(),
    path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    referrer: document.referrer || "",
    referrerHost: referrerHost(document.referrer || ""),
    ...sourceContext,
    browserContext,
    isFacebookInApp: isFacebookInAppBrowser(navigator.userAgent || ""),
    userAgent: navigator.userAgent || ""
  };

  sendPayload(payload);
}

function sendPayload(payload) {
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "text/plain" });
    if (navigator.sendBeacon(VISIT_ANALYTICS_ENDPOINT, blob)) return;
  }

  fetch(VISIT_ANALYTICS_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    keepalive: true,
    headers: {
      "Content-Type": "text/plain"
    },
    body
  }).catch(() => {
    // Analytics should never interrupt the review experience.
  });
}

function normalizeContext(context = {}) {
  const tracking = trackingUrlContext();

  return {
    propertyId: context.propertyId || context.id || "",
    parcelId: context.parcelId || "",
    invite: context.invite || tracking.invite,
    trackingId: context.trackingId || tracking.trackingId,
    trackingPerson: context.trackingPerson || tracking.trackingPerson,
    trackingLabel: context.trackingLabel || tracking.trackingLabel,
    propertyClass: context.propertyClass || "",
    county: context.county || "",
    contentType: context.contentType || "",
    articleId: context.articleId || "",
    articleTitle: context.articleTitle || "",
    allowExperimentAnalytics: Boolean(context.allowExperimentAnalytics)
  };
}

function isDuplicateInteraction(details = {}) {
  const now = Date.now();
  const key = [
    details.action || "",
    details.detail || "",
    details.articleId || "",
    details.placement || "",
    details.targetUrl || "",
    details.mediaPercent || ""
  ].join("|");

  if (key && key === analyticsState.lastInteractionKey && now - analyticsState.lastInteractionAt < INTERACTION_DEDUPE_WINDOW_MS) {
    return true;
  }

  analyticsState.lastInteractionKey = key;
  analyticsState.lastInteractionAt = now;
  return false;
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

function pageViewId() {
  return `page-${randomIdPart()}`;
}

function eventId() {
  return `event-${randomIdPart()}`;
}

function randomVisitId() {
  return `visit-${randomIdPart()}`;
}

function randomIdPart() {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function trackingUrlContext() {
  const params = new URLSearchParams(window.location.search);
  const legacyInvite = params.get("invite") || "";
  const trackingId = params.get("gpr_track") || legacyInvite;

  return {
    invite: legacyInvite,
    trackingId,
    trackingPerson: params.get("gpr_person") || "",
    trackingLabel: params.get("gpr_label") || ""
  };
}

function viewportBucket() {
  const width = window.innerWidth || document.documentElement.clientWidth || 0;
  if (width < 700) return "mobile";
  if (width < 1100) return "tablet";
  return "desktop";
}

function sourceAttributionContext() {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") || "",
    utmMedium: params.get("utm_medium") || "",
    utmCampaign: params.get("utm_campaign") || "",
    utmContent: params.get("utm_content") || "",
    utmTerm: params.get("utm_term") || "",
    fbclidPresent: params.has("fbclid")
  };
}

function referrerHost(referrer) {
  if (!referrer) return "";
  try {
    return new URL(referrer).hostname;
  } catch {
    return "";
  }
}

function browserContextFrom(userAgent, referrer) {
  const referrerHostname = referrerHost(referrer);
  if (isFacebookInAppBrowser(userAgent)) return "facebook-in-app";
  if (/\bInstagram\b/i.test(userAgent)) return "instagram-in-app";
  if (/\bLine\/|Twitter|TikTok|LinkedInApp\b/i.test(userAgent)) return "social-in-app";
  if (/(^|\.)facebook\.com$|(^|\.)fb\.com$|(^|\.)instagram\.com$/i.test(referrerHostname)) return "facebook-referral";
  return "browser";
}

function isFacebookInAppBrowser(userAgent) {
  return /\bFBAN|FBAV\b/i.test(userAgent);
}

function shouldSkipVisitAnalytics() {
  return isLocalWorkingHost()
    || isReviewMode()
    || (isExperimentRoute() && !analyticsState.context.allowExperimentAnalytics)
    || isWorkingSessionUserAgent(navigator.userAgent || "");
}

function isReviewMode() {
  const params = new URLSearchParams(window.location.search);
  return params.get("review") === "1"
    || params.get("review") === "true";
}

function isLocalWorkingHost() {
  const hostname = window.location.hostname;

  return hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === "::1"
    || hostname.endsWith(".localhost");
}

function isExperimentRoute() {
  const params = new URLSearchParams(window.location.search);
  return params.has("experiment")
    || params.has("experiments")
    || window.location.pathname.startsWith("/experiments");
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
