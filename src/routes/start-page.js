import { copyArray, copyObject } from "../content/site-copy.js";

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
  const content = copyObject("pages.start", {});
  const cards = copyArray("pages.start.cards", []);
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
