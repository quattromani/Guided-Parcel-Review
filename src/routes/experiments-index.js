import { escapeHtml } from "../utils/html.js";

export const experimentLinks = [
  {
    title: "Property Invite Index",
    href: "?experiment=property-invite-index",
    note: "Internal searchable table of loaded records with one-click invite links."
  },
  {
    title: "1301 S 5th Comparable Sales Walkthrough",
    href: "?experiment=1301-s-5th-comps",
    note: "Four-property comparable sales experiment with candidate screening and full record comparison."
  },
  {
    title: "Ames Highway 77 Comparable Sales Walkthrough",
    href: "?experiment=ames-highway-77-comps",
    note: "MIPS Highway 77 sale screen and full-record dwelling comparison for 29810 US Hwy 77."
  },
  {
    title: "Beekman Country Club Comparable Sales Walkthrough",
    href: "?experiment=beekman-country-club-comps",
    note: "MIPS Country Club-area sale screen and full-record dwelling comparison for 1417 Country Club Ln."
  },
  {
    title: "1722 Washington Comparable Sales Walkthrough",
    href: "?experiment=1722-washington-comps",
    note: "Residential-3 candidate ranking and full-record comparison for 1722 Washington."
  },
  {
    title: "Tax Shorthand Year-Over-Year Walkthrough",
    href: "?experiment=tax-shorthand",
    note: "Active-property tax statement table showing assessed value, levy, credits, and final net-tax movement by year."
  },
  {
    title: "Levy Compression Educational Post",
    href: "?article=levy-compression",
    note: "Standalone article and calculator for estimating future ETR and tax changes when valuations rise."
  },
  {
    title: "Grant Street Side-by-Side Comparison",
    href: "?experiment=grant-neighbor-comps",
    note: "Three adjacent Grant Street properties arranged for neighbor comparison."
  },
  {
    title: "Valuation Group Overview",
    href: "experiments/valuation-group-overview.html",
    note: "Sampled value and tax movement across loaded valuation groups."
  },
  {
    title: "Valuation Group Aggregate Lab",
    href: "experiments/vg-aggregate.html",
    note: "Aggregate valuation group workbench and projection lab."
  }
];

export function isExperimentIndexRequest(searchParams = new URLSearchParams(window.location.search)) {
  const experimentView = searchParams.get("experiment");
  return searchParams.has("experiments")
    || (searchParams.has("experiment") && (!experimentView || experimentView === "index" || experimentView === "experiments"));
}

export function renderExperimentsIndex() {
  const pageTitle = document.getElementById("pageTitle");
  const canvas = document.querySelector(".mobile-review-canvas");
  if (!canvas) return;

  document.querySelector(".guide-review-header")?.classList.add("hidden");
  document.querySelectorAll("[data-guided-panel]").forEach(panel => panel.classList.add("hidden"));
  document.querySelector("[data-footer-resource-shell]")?.classList.add("hidden");

  pageTitle.innerHTML = `
    <div class="comp-page-title">
      <p class="guided-kicker">Experiments</p>
      <h1>Experiment Index</h1>
      <p>Internal links for moving between current review experiments.</p>
    </div>
  `;

  canvas.innerHTML = `
    <section class="experiments-index-page review-card" aria-labelledby="experimentsIndexTitle">
      <h2 id="experimentsIndexTitle">Available experiments</h2>
      <ul class="experiments-index-list">
        ${experimentLinks.map(link => `
          <li>
            <a href="${escapeHtml(link.href)}">${escapeHtml(link.title)}</a>
            <span>${escapeHtml(link.note)}</span>
          </li>
        `).join("")}
      </ul>
    </section>
  `;
}
