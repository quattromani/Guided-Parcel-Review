import { copyArray, copyObject } from "../content/site-copy.js";

const fallbackStartPageContent = {
  kicker: "Ready for review",
  title: "Preview the review workspace",
  intro: "Each sample opens a full parcel view with record details, value history, tax context, market charts, and guided review steps.",
  calloutAriaLabel: "Sample record coverage",
  calloutLabel: "Sample coverage",
  calloutText: "Residential, agricultural, and commercial samples are available.",
  coverageAriaLabel: "What the review covers",
  cards: [
    {
      title: "Parcel context",
      description: "Review parcel facts, classification, land details, valuation groups, and practical items to verify."
    },
    {
      title: "Value and assessment history",
      description: "See how the sample property's assessed value has moved and which years are still pending or finalized."
    },
    {
      title: "Tax impact",
      description: "See how value changes, levy, credits, and effective tax rate relate to the latest available tax bill."
    }
  ],
  disclaimer: "This prototype uses pre-loaded sample records for demonstration, stress testing, and smoke testing. Official records, valuations, and tax determinations remain with the appropriate county offices."
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
    }
  ],
  disclaimer: "This prototype uses pre-loaded records for demonstration, stress testing, and smoke testing. Official records, valuations, and tax determinations remain with the appropriate county offices."
};

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
  start.innerHTML = `
    <article class="guided-start-card" aria-labelledby="guidedStartTitle">
      <div class="guided-start-copy">
        <p class="guided-kicker">${content.kicker}</p>
        <h2 id="guidedStartTitle">${content.title}</h2>
        <p>${content.intro}</p>
      </div>

      <div class="guided-start-callout" aria-label="${content.calloutAriaLabel}">
        <p class="guided-start-callout-label">${content.calloutLabel}</p>
        <p>${content.calloutText}</p>
      </div>

      <div class="guided-start-grid" aria-label="${content.coverageAriaLabel}">
        ${cards.map(card => `
          <section>
            <h3>${card.title}</h3>
            <p>${card.description}</p>
          </section>
        `).join("")}
      </div>

      <p class="guided-start-disclaimer">${content.disclaimer}</p>
    </article>
  `;
}
