export const ORIENTATION_STORAGE_KEY = "propertySnapshot.guidedParcelReview.orientation.v1";

function hasAcknowledgedOrientation(force = false) {
  if (force || shouldForceOrientation()) return false;

  try {
    return window.localStorage?.getItem(ORIENTATION_STORAGE_KEY) === "acknowledged";
  } catch {
    return false;
  }
}

function markOrientationAcknowledged() {
  if (shouldForceOrientation()) return;

  try {
    window.localStorage?.setItem(ORIENTATION_STORAGE_KEY, "acknowledged");
  } catch {
    // The modal still closes for browsers that block localStorage.
  }
}

function shouldForceOrientation() {
  return new URLSearchParams(window.location.search).get("orientation") === "force";
}

function focusPropertySwitcher() {
  const switcher = document.querySelector("[data-property-switcher]");
  switcher?.focus({ preventScroll: true });

  document.body.classList.add("property-switcher-guidance-active");
  window.setTimeout(() => {
    document.body.classList.remove("property-switcher-guidance-active");
  }, 3600);
}

export function initFirstVisitOrientation(options = {}) {
  const {
    force = false,
    primaryButtonLabel = "Choose a Sample Property",
    onAccepted,
    propertySelectionCopy = "For this prototype, start by choosing one of the pre-loaded sample parcels from the property switcher in the page header."
  } = options;

  if (hasAcknowledgedOrientation(force)) return false;

  const modal = document.createElement("div");
  modal.className = "orientation-modal-backdrop";
  modal.innerHTML = `
    <section class="orientation-modal" role="dialog" aria-modal="true" aria-labelledby="orientationTitle" aria-describedby="orientationDescription">
      <div class="orientation-modal-header">
        <p class="orientation-eyebrow">First visit</p>
        <h2 id="orientationTitle">Welcome to the Guided Parcel Review</h2>
      </div>

      <div id="orientationDescription" class="orientation-modal-body">
        <p>The Guided Parcel Review is a step-by-step way to understand how a property&rsquo;s assessed value, tax history, and parcel details fit together.</p>
        <p>${propertySelectionCopy}</p>
        <p>It is designed to help answer the bigger question many property owners have:<br><strong>&ldquo;How am I really being affected by changes in value and property taxes?&rdquo;</strong></p>
        <p>You can use this tool to review a sample property, understand a recent notice of value, research how property information is organized, or see how assessment and tax data can be explained more clearly.</p>
        <p>This site is an independent informational and visualization tool. It is not an official county record, government website, or final valuation source. Sample records have been pre-loaded to demonstrate, stress test, and smoke test the product while it is in active development.</p>
        <p>Official property records, valuations, and tax determinations remain with the appropriate county offices.</p>
        <p>Tip: To start fresh later, use the small recycle button at the end of the footer to clear the current sample and return to this welcome screen.</p>
        <p>The goal is simple: clearer information, better understanding, and fewer surprises.</p>
      </div>

      <label class="orientation-acknowledgment" for="orientationAcknowledgment">
        <input id="orientationAcknowledgment" type="checkbox" />
        <span>I understand this tool is informational and is not an official government record.</span>
      </label>

      <div class="orientation-actions">
        <button type="button" class="orientation-primary-button" disabled>
          ${primaryButtonLabel}
        </button>
      </div>
    </section>
  `;

  const acknowledgment = modal.querySelector("#orientationAcknowledgment");
  const primaryButton = modal.querySelector(".orientation-primary-button");
  const focusableSelector = "input, button";

  function close() {
    markOrientationAcknowledged();
    modal.remove();
    document.body.classList.remove("orientation-modal-open");
    if (typeof onAccepted === "function") {
      onAccepted();
    } else {
      focusPropertySwitcher();
    }
  }

  acknowledgment.addEventListener("change", () => {
    primaryButton.disabled = !acknowledgment.checked;
  });

  primaryButton.addEventListener("click", close);

  modal.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;

    const focusable = [...modal.querySelectorAll(focusableSelector)].filter(element => !element.disabled);
    const first = focusable[0];
    const last = focusable.at(-1);

    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.body.append(modal);
  document.body.classList.add("orientation-modal-open");
  window.requestAnimationFrame(() => acknowledgment.focus());

  return true;
}
