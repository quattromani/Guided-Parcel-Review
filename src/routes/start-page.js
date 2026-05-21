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
  start.innerHTML = `
    <article class="guided-start-card" aria-labelledby="guidedStartTitle">
      <div class="guided-start-copy">
        <p class="guided-kicker">Ready for review</p>
        <h2 id="guidedStartTitle">Preview the review workspace</h2>
        <p>Each sample opens a full parcel view with record details, value history, tax context, market charts, and guided review steps.</p>
      </div>

      <div class="guided-start-callout" aria-label="Sample record coverage">
        <p class="guided-start-callout-label">Sample coverage</p>
        <p>Residential, agricultural, and commercial samples are available.</p>
      </div>

      <div class="guided-start-grid" aria-label="What the review covers">
        <section>
          <h3>Parcel context</h3>
          <p>Review parcel facts, classification, land details, valuation groups, and practical items to verify.</p>
        </section>
        <section>
          <h3>Value and assessment history</h3>
          <p>See how the sample property's assessed value has moved and which years are still pending or finalized.</p>
        </section>
        <section>
          <h3>Tax impact</h3>
          <p>See how value changes, levy, credits, and effective tax rate relate to the latest available tax bill.</p>
        </section>
      </div>

      <p class="guided-start-disclaimer">This prototype uses pre-loaded sample records for demonstration, stress testing, and smoke testing. Official records, valuations, and tax determinations remain with the appropriate county offices.</p>
    </article>
  `;
}
