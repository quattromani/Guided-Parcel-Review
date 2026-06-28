const DEFAULT_PROGRESS_SELECTOR = "[data-ges-reading-progress]";
const DEFAULT_TARGET_SELECTOR = "[data-ges-reading-progress-target]";
const DEFAULT_END_SELECTOR = "[data-ges-reading-progress-end]";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function clamp(value, min = 0, max = 1) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function resolveElement(value, root = document) {
  if (!value) return null;
  if (value.nodeType === 1) return value;
  if (typeof value === "string") return root.querySelector(value);
  return null;
}

function renderProgressMarkup() {
  return `
    <div class="ges-reading-progress__track">
      <span class="ges-reading-progress__fill"></span>
    </div>
    <span class="ges-reading-progress__marker"></span>
  `;
}

function ensureProgressElement(root = document) {
  const existing = root.querySelector(DEFAULT_PROGRESS_SELECTOR);
  if (existing) return existing;

  const element = document.createElement("div");
  element.className = "ges-reading-progress";
  element.dataset.gesReadingProgress = "";
  element.setAttribute("aria-hidden", "true");
  element.innerHTML = renderProgressMarkup();
  document.body.prepend(element);
  return element;
}

function pageY(element, edge = "top") {
  const rect = element.getBoundingClientRect();
  return window.scrollY + (edge === "bottom" ? rect.bottom : rect.top);
}

function fixedTopOffset() {
  const header = document.querySelector(".gpr-global-header");
  return header?.getBoundingClientRect().height || 0;
}

export function renderGesReadingProgress() {
  return `
    <div class="ges-reading-progress" data-ges-reading-progress aria-hidden="true">
      ${renderProgressMarkup()}
    </div>
  `;
}

export function renderGesReadingProgressEndMarker() {
  return `<span class="ges-reading-progress__end" data-ges-reading-progress-end aria-hidden="true"></span>`;
}

export function installGesReadingProgress({
  root = document,
  progress,
  progressSelector = DEFAULT_PROGRESS_SELECTOR,
  target,
  targetSelector = DEFAULT_TARGET_SELECTOR,
  end,
  endSelector = DEFAULT_END_SELECTOR
} = {}) {
  if (typeof document === "undefined" || typeof window === "undefined" || !document.body) return null;

  const targetElement = resolveElement(target, root) ?? resolveElement(targetSelector, root);
  if (!targetElement) return null;

  const progressElement = resolveElement(progress, root)
    ?? resolveElement(progressSelector, document)
    ?? ensureProgressElement(document);
  const fillElement = progressElement.querySelector(".ges-reading-progress__fill");
  const markerElement = progressElement.querySelector(".ges-reading-progress__marker");
  if (!fillElement || !markerElement) return null;

  if (progressElement.__gesReadingProgressInstance) {
    if (progressElement.__gesReadingProgressInstance.target === targetElement) {
      progressElement.__gesReadingProgressInstance.update();
      return progressElement.__gesReadingProgressInstance;
    }
    progressElement.__gesReadingProgressInstance.destroy();
  }

  progressElement.dataset.gesReadingProgressReady = "true";

  const mediaQuery = window.matchMedia?.(REDUCED_MOTION_QUERY);
  let reducedMotion = Boolean(mediaQuery?.matches);
  let startY = 0;
  let endY = 0;
  let viewportHeight = 0;
  let viewportWidth = 0;
  let markerWidth = 0;
  let topOffset = 0;
  let measureQueued = false;
  let updateQueued = false;
  let intersectionObserver = null;
  let resizeObserver = null;

  const endElement = () => resolveElement(end, root) ?? targetElement.querySelector(endSelector);

  const setProgress = (value) => {
    const progressValue = clamp(value);
    const markerTravel = Math.max(0, viewportWidth - markerWidth);
    progressElement.style.setProperty("--ges-reading-progress-value", progressValue.toFixed(5));
    progressElement.style.setProperty("--ges-reading-progress-marker-x", `${(progressValue * markerTravel).toFixed(2)}px`);
    progressElement.dataset.gesReadingProgressState =
      progressValue <= 0 ? "start" : progressValue >= 1 ? "complete" : "reading";
  };

  const updateProgress = () => {
    updateQueued = false;

    const longRange = endY - viewportHeight + topOffset - startY;
    let progressValue;

    if (longRange > 1) {
      progressValue = (window.scrollY + topOffset - startY) / longRange;
    } else {
      const compactRange = Math.max(1, endY - startY);
      progressValue = (window.scrollY + viewportHeight - startY) / compactRange;
    }

    setProgress(progressValue);
  };

  const requestProgressUpdate = () => {
    if (reducedMotion) {
      updateProgress();
      return;
    }
    if (updateQueued) return;
    updateQueued = true;
    window.requestAnimationFrame(updateProgress);
  };

  const measure = () => {
    measureQueued = false;
    const explicitEnd = endElement();
    startY = pageY(targetElement, "top");
    endY = explicitEnd ? pageY(explicitEnd, "top") : pageY(targetElement, "bottom");
    viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    viewportWidth = document.documentElement.clientWidth || window.innerWidth || 0;
    markerWidth = markerElement.getBoundingClientRect().width || 0;
    topOffset = fixedTopOffset();
    requestProgressUpdate();
  };

  const requestMeasure = () => {
    if (reducedMotion) {
      measure();
      return;
    }
    if (measureQueued) return;
    measureQueued = true;
    window.requestAnimationFrame(measure);
  };

  const handleMotionPreference = event => {
    reducedMotion = Boolean(event.matches);
    requestMeasure();
  };

  if ("IntersectionObserver" in window) {
    intersectionObserver = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      progressElement.classList.toggle("is-near-reading-target", entry.isIntersecting);
      requestMeasure();
    }, {
      root: null,
      rootMargin: "120% 0px 120% 0px",
      threshold: 0
    });
    intersectionObserver.observe(targetElement);
  }

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(requestMeasure);
    resizeObserver.observe(targetElement);
  }

  mediaQuery?.addEventListener?.("change", handleMotionPreference);
  window.addEventListener("scroll", requestProgressUpdate, { passive: true });
  window.addEventListener("resize", requestMeasure);
  window.visualViewport?.addEventListener?.("resize", requestMeasure);
  window.addEventListener("load", requestMeasure, { once: true });
  requestMeasure();

  const api = {
    destroy() {
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
      mediaQuery?.removeEventListener?.("change", handleMotionPreference);
      window.removeEventListener("scroll", requestProgressUpdate);
      window.removeEventListener("resize", requestMeasure);
      window.visualViewport?.removeEventListener?.("resize", requestMeasure);
      progressElement.dataset.gesReadingProgressReady = "false";
      delete progressElement.__gesReadingProgressInstance;
    },
    element: progressElement,
    target: targetElement,
    update: requestMeasure
  };

  progressElement.__gesReadingProgressInstance = api;
  return api;
}
