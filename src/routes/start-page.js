import { copyArray, copyObject } from "../content/site-copy.js";

const fallbackStartPageContent = {
  kicker: "Ready for review",
  title: "Find a property review",
  intro: "Search by situs address to open a loaded parcel view with record details, value history, tax context, market charts, and guided review steps.",
  calloutAriaLabel: "Loaded record coverage",
  calloutLabel: "Loaded records",
  calloutText: "Residential, agricultural, and commercial records are available when they have been loaded into this review workspace.",
  coverageAriaLabel: "What the review covers",
  cards: [
    {
      title: "Parcel context",
      description: "Review parcel facts, classification, land details, valuation groups, and practical items to verify."
    },
    {
      title: "Value and assessment history",
      description: "See how the property's assessed value has moved and which years are still pending or finalized."
    },
    {
      title: "Tax impact",
      description: "See how value changes, levy, credits, and effective tax rate relate to the latest available tax bill."
    },
    {
      title: "BOE Protest Tracker",
      description: "Open the administrative field-capture tool for live Board of Equalization hearing observation.",
      href: "boe-tracker/"
    }
  ],
  disclaimer: "This prototype uses pre-loaded records for demonstration, stress testing, and smoke testing. Official records, valuations, and tax determinations remain with the appropriate county offices."
};

const fallbackDirectStartPageContent = {
  kicker: "Direct property review",
  title: "Start with this property",
  intro: "This link is ready to open a specific property review. First, review the short notice so the property view is read as guidance, not an official record.",
  calloutAriaLabel: "Selected property",
  calloutLabel: "View property",
  calloutText: "The linked property will open after you acknowledge the informational notice.",
  coverageAriaLabel: "What the review covers",
  cards: [
    {
      title: "Parcel context",
      description: "Review parcel facts, classification, land details, valuation groups, and practical items to verify."
    },
    {
      title: "Value and assessment history",
      description: "See how the property's assessed value has moved and which years are still pending or finalized."
    },
    {
      title: "Tax impact",
      description: "See how value changes, levy, credits, and effective tax rate relate to the latest available tax bill."
    },
    {
      title: "BOE Protest Tracker",
      description: "Open the administrative field-capture tool for live Board of Equalization hearing observation.",
      href: "boe-tracker/"
    }
  ],
  disclaimer: "This prototype uses pre-loaded records for demonstration, stress testing, and smoke testing. Official records, valuations, and tax determinations remain with the appropriate county offices."
};

function formatStartCopy(value = "", tokens = {}) {
  return `${value}`.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => tokens[key] ?? "");
}

function coverageTokens(propertySwitcherContext = {}) {
  const loadedPropertyCount = propertySwitcherContext.records?.length ?? propertySwitcherContext.manifest?.properties?.length ?? 0;
  const countyPropertyCount = 18222;
  const coveragePercent = countyPropertyCount && loadedPropertyCount
    ? `${Math.round(loadedPropertyCount / countyPropertyCount * 100)}%`
    : "5%";

  return {
    loadedPropertyCount: loadedPropertyCount.toLocaleString(),
    coveragePercent
  };
}

export function renderStartPage(propertySwitcherContext = {}, renderViewHeader) {
  renderViewHeader?.("start", null, propertySwitcherContext);

  document.getElementById("propertyViewContext")?.classList.add("hidden");
  document.querySelector(".guide-review-header")?.classList.add("hidden");
  document.querySelectorAll("[data-guided-panel]").forEach(panel => {
    panel.classList.add("hidden");
  });

  const canvas = document.querySelector(".mobile-review-canvas");
  if (!canvas) return;

  let start = document.getElementById("guidedStartState");
  if (!start) {
    start = document.createElement("section");
    start.id = "guidedStartState";
    canvas.prepend(start);
  }

  start.className = "guided-start-state";
  const isDirectStart = Boolean(propertySwitcherContext.pendingDirectProperty);
  const copyPath = isDirectStart ? "pages.directStart" : "pages.start";
  const fallbackContent = isDirectStart ? fallbackDirectStartPageContent : fallbackStartPageContent;
  const content = copyObject(copyPath, fallbackContent);
  const cards = copyArray(`${copyPath}.cards`, fallbackContent.cards);
  const tokens = coverageTokens(propertySwitcherContext);
  start.innerHTML = `
    <article class="guided-start-card" aria-labelledby="guidedStartTitle">
      <div class="guided-start-copy">
        <p class="guided-kicker">${formatStartCopy(content.kicker, tokens)}</p>
        <h2 id="guidedStartTitle">${formatStartCopy(content.title, tokens)}</h2>
        <p>${formatStartCopy(content.intro, tokens)}</p>
      </div>

      <div class="guided-start-callout" aria-label="${formatStartCopy(content.calloutAriaLabel, tokens)}">
        <p class="guided-start-callout-label">${formatStartCopy(content.calloutLabel, tokens)}</p>
        <p>${formatStartCopy(content.calloutText, tokens)}</p>
      </div>

      <div class="guided-start-grid" aria-label="${formatStartCopy(content.coverageAriaLabel, tokens)}">
        ${cards.map(card => `
          <section>
            <h3>${formatStartCopy(card.title, tokens)}</h3>
            <p>${formatStartCopy(card.description, tokens)}</p>
            ${card.href ? `<a class="guided-start-link" href="${card.href}">Open ${formatStartCopy(card.title, tokens)}</a>` : ""}
          </section>
        `).join("")}
      </div>

      <p class="guided-start-disclaimer">${formatStartCopy(content.disclaimer, tokens)}</p>
    </article>
  `;
}
