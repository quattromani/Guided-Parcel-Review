import {
  assessmentAtSale,
  cardComparisonData,
  comparisonRecordEntry,
  moneyLabel,
  numberLabel,
  placeholderComparisonData,
  saleRatioDisplayLabel,
  tableMatchCounts,
  tableRowGroups,
  textLabel
} from "../domain/comparison-review.js";
import { escapeHtml } from "../utils/html.js";
import { rankComparableCandidates, renderComparableCandidateReview } from "./comparable-candidate-review.js";

async function loadJson(path, label) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Unable to load ${label}: ${response.status}`);
  }

  return response.json();
}

function propertyUrl(id) {
  const url = new URL(window.location.href);
  url.searchParams.delete("experiment");
  url.searchParams.set("property", id);
  url.searchParams.set("view", "property");
  url.hash = "property-record";
  return `${url.pathname}${url.search}${url.hash}`;
}

async function resolveComparisonModel(manifest, item) {
  if (item.recordId) {
    const property = comparisonRecordEntry(manifest, item.recordId);
    if (!property) throw new Error(`Experiment property not found: ${item.recordId}`);
    const card = await loadJson(property.recordCardPath, `${item.recordId} record card`);
    return cardComparisonData(card, property, item);
  }

  return placeholderComparisonData(item);
}

function renderPropertyCard(model, review = null) {
  const isSubject = model.role === "subject";
  const photo = model.photoUrl
    ? model.propertyId
      ? `
        <a class="neighbor-comp-photo-link" href="${escapeHtml(propertyUrl(model.propertyId))}" aria-label="Open ${escapeHtml(model.address)} property record">
          <img src="${escapeHtml(model.photoUrl)}" alt="${escapeHtml(model.address)} house photo" />
        </a>
      `
      : `
        <div class="neighbor-comp-photo-link">
          <img src="${escapeHtml(model.photoUrl)}" alt="${escapeHtml(model.address)} house photo" />
        </div>
      `
    : `
      <div class="neighbor-comp-photo-link neighbor-comp-photo-placeholder" aria-label="${escapeHtml(model.roleLabel)} photo pending">
        <span>Photo pending</span>
      </div>
    `;

  return `
    <article class="neighbor-comp-card${isSubject ? " neighbor-comp-card-subject" : " neighbor-comp-card-comparable"}">
      ${photo}
      <div class="neighbor-comp-card-body">
        <div>
          <p class="neighbor-comp-label">${escapeHtml(model.roleLabel)}</p>
          <h3>${escapeHtml(model.address)}</h3>
        </div>
        <dl>
          <div>
            <dt>2026 assessment</dt>
            <dd>${escapeHtml(moneyLabel(model.values.assessed2026))}</dd>
          </div>
          <div>
            <dt>Building size</dt>
            <dd>${escapeHtml(numberLabel(model.buildingSqFt, " sq. ft."))}</dd>
          </div>
          <div>
            <dt>Sale date</dt>
            <dd>${escapeHtml(textLabel(model.saleDate))}</dd>
          </div>
          <div>
            <dt>Sale price</dt>
            <dd>${escapeHtml(moneyLabel(model.salePrice))}</dd>
          </div>
          ${review ? `
          <div>
            <dt>Similarity score</dt>
            <dd>${review.score.totalScore}</dd>
          </div>
          <div>
            <dt>Review burden</dt>
            <dd>${escapeHtml(review.adjustmentBurden.replace(" adjustment burden", ""))}</dd>
          </div>
          ` : ""}
        </dl>
      </div>
    </article>
  `;
}

function renderCompTable(models) {
  const groups = tableRowGroups(models);
  const matchCounts = tableMatchCounts(groups, models.length);

  return `
    <div class="neighbor-comp-table-wrap">
      <p class="neighbor-comp-match-note">For each comparison row, the closest available match to the subject property is highlighted in light gray. Match totals at the bottom count how often each comparable was the closest row match.</p>
      <table class="neighbor-comp-table">
        <thead>
          <tr>
            <th scope="col">Comparison point</th>
            ${models.map(model => `
              <th scope="col"${model.role === "subject" ? " class=\"neighbor-comp-subject-col\"" : ""}>
                ${escapeHtml(model.address)}
              </th>
            `).join("")}
          </tr>
        </thead>
        <tbody>
          ${groups.map(group => `
            <tr class="neighbor-comp-group-row">
              <th scope="row" colspan="${models.length + 1}">${escapeHtml(group.group)}</th>
            </tr>
            ${group.rows.map(row => `
              <tr>
                <th scope="row">${escapeHtml(row.label)}</th>
                ${row.values.map((value, index) => `
                  <td class="${[
                    models[index].role === "subject" ? "neighbor-comp-subject-col" : "",
                    row.bestMatchIndexes.includes(index) ? "neighbor-comp-best-match" : ""
                  ].filter(Boolean).join(" ")}">${escapeHtml(value)}</td>
                `).join("")}
              </tr>
            `).join("")}
          `).join("")}
        </tbody>
        <tfoot>
          <tr class="neighbor-comp-match-total-row">
            <th scope="row">Closest row-match count</th>
            ${models.map((model, index) => `
              <td class="${model.role === "subject" ? "neighbor-comp-subject-col" : ""}">
                ${model.role === "subject" ? "Subject" : `${matchCounts[index]} row${matchCounts[index] === 1 ? "" : "s"}`}
              </td>
            `).join("")}
          </tr>
        </tfoot>
      </table>
    </div>
  `;
}

function renderSubjectStory(model, comparableModels = []) {
  if (!model) return "";

  const saleContext = assessmentAtSale(model);
  const comparableRatios = comparableModels
    .map(assessmentAtSale)
    .filter(item => item?.ratio);
  const comparableAverageRatio = comparableRatios.length
    ? comparableRatios.reduce((sum, item) => sum + item.ratio, 0) / comparableRatios.length
    : null;

  return `
    <section class="subject-story-panel review-card" aria-labelledby="subjectStoryTitle">
      <div class="subject-story-photo">
        <img src="${escapeHtml(model.photoUrl || "")}" alt="${escapeHtml(model.address)} house photo" />
      </div>
      <div class="subject-story-main">
        <p class="guided-kicker">Subject Property</p>
        <h2 id="subjectStoryTitle">${escapeHtml(model.address)}</h2>
        <dl class="subject-story-facts">
          <div><dt>2026 assessed value</dt><dd>${escapeHtml(moneyLabel(model.values.assessed2026))}</dd></div>
          <div><dt>Building size</dt><dd>${escapeHtml(numberLabel(model.buildingSqFt, " sq. ft."))}</dd></div>
          <div><dt>Year built</dt><dd>${escapeHtml(numberLabel(model.structure.yearBuilt))}</dd></div>
          <div><dt>Quality</dt><dd>${escapeHtml(textLabel(model.condition.quality))}</dd></div>
          <div><dt>Condition</dt><dd>${escapeHtml(textLabel(model.condition.condition))}</dd></div>
          <div><dt>Tax district</dt><dd>${escapeHtml(textLabel(model.taxDistrict))}</dd></div>
          <div><dt>School district</dt><dd>${escapeHtml(textLabel(model.schoolDistrict))}</dd></div>
        </dl>
      </div>
      <aside class="subject-market-panel">
        <p class="guided-kicker">Market Alignment History</p>
        <h3>Where Did This Property Enter The Cycle?</h3>
        <dl>
          <div><dt>Sale date</dt><dd>${escapeHtml(textLabel(model.saleDate))}</dd></div>
          <div><dt>Sale price</dt><dd>${escapeHtml(moneyLabel(model.salePrice))}</dd></div>
          <div><dt>Assessed value at sale</dt><dd>${escapeHtml(moneyLabel(saleContext?.assessed))}</dd></div>
          <div><dt>Historical assessment-to-sale reference</dt><dd>${escapeHtml(saleRatioDisplayLabel(saleContext?.ratio))}</dd></div>
        </dl>
        <div class="subject-ratio-compare">
          <div>
            <span>Subject historical reference</span>
            <strong>${escapeHtml(saleRatioDisplayLabel(saleContext?.ratio))}</strong>
          </div>
          <div>
            <span>Comp average historical reference</span>
            <strong>${escapeHtml(saleRatioDisplayLabel(comparableAverageRatio))}</strong>
          </div>
        </div>
        <p>
          When this property last sold, its assessed value represented approximately ${escapeHtml(saleRatioDisplayLabel(saleContext?.ratio))} of the sale price.
          Properties that begin at lower assessment-to-sale ratios may experience larger increases over time as assessments move closer to market-supported levels.
        </p>
        <p class="subject-market-note">This historical context helps explain change. It does not determine whether today's assessment is accurate.</p>
      </aside>
    </section>
  `;
}

export async function renderComparisonExperiment(propertySwitcherContext = {}, config = {}) {
  const pageTitle = document.getElementById("pageTitle");
  const canvas = document.querySelector(".mobile-review-canvas");
  if (!canvas) return;

  document.querySelector(".guide-review-header")?.classList.add("hidden");
  document.querySelectorAll("[data-guided-panel]").forEach(panel => panel.classList.add("hidden"));
  document.querySelector("[data-footer-resource-shell]")?.classList.add("hidden");

  const manifest = propertySwitcherContext.manifest || {};
  const models = await Promise.all(config.properties.map(item => resolveComparisonModel(manifest, item)));
  const subject = models.find(model => model.role === "subject");
  const candidateModels = config.candidatePool
    ? await Promise.all(config.candidatePool.map(item => resolveComparisonModel(manifest, item)))
    : models.filter(model => model.role !== "subject");
  const rankedForCards = subject && candidateModels.length
    ? rankComparableCandidates(subject, candidateModels)
    : { selectedCandidates: [] };
  const reviewByParcelId = new Map(rankedForCards.selectedCandidates.map(review => [review.candidate.parcelId, review]));
  const cardGridClass = models.length >= 4 ? "neighbor-comp-card-grid neighbor-comp-card-grid-four" : "neighbor-comp-card-grid";
  const fullRecordComparison = `
    <details class="neighbor-comp-full-record review-card" open>
      <summary>
        <span>
          <span class="guided-kicker">${escapeHtml(config.tableKicker || "Comp Sheet")}</span>
          <strong>${escapeHtml(config.fullRecordTitle || config.tableTitle || "Full Record Comparison")}</strong>
        </span>
        <small>${escapeHtml(config.fullRecordHelp || "This section preserves the underlying record details used in the review. It is intentionally more detailed and is best used after reviewing the summaries above.")}</small>
      </summary>
      ${renderCompTable(models)}
    </details>
  `;

  pageTitle.innerHTML = `
    <div class="comp-page-title">
      <p class="guided-kicker">${escapeHtml(config.kicker || "Experiment · Comp Sheet")}</p>
      <h1>${escapeHtml(config.title)}</h1>
      <p>${escapeHtml(config.subtitle || "")}</p>
    </div>
  `;

  canvas.innerHTML = `
    <section class="neighbor-comp-page" aria-labelledby="neighborCompTitle">
      <div class="neighbor-comp-intro">
        <div>
          <p class="guided-kicker">${escapeHtml(config.contextKicker || "Manual Review · Experimental Layout")}</p>
          <h2 id="neighborCompTitle">${escapeHtml(config.introTitle || "Set up for comparison, not a valuation conclusion")}</h2>
        </div>
        <p>${escapeHtml(config.introCopy || "")}</p>
      </div>

      ${config.disclaimer ? `
        <aside class="neighbor-comp-disclaimer">
          ${escapeHtml(config.disclaimer)}
        </aside>
      ` : ""}

      ${config.showSubjectStory ? renderSubjectStory(subject, models.filter(model => model.role !== "subject")) : ""}

      ${config.showCandidateReview && config.refinedComparableReview ? renderComparableCandidateReview(subject, candidateModels, { refined: true, stage: "pool", searchStats: config.candidateSearchStats }) : ""}

      <section class="neighbor-comp-selected-section" aria-label="${escapeHtml(config.cardSectionLabel || "Comparison property cards")}">
        ${config.cardSectionTitle ? `
          <div class="comp-review-subhead">
            <p class="guided-kicker">${escapeHtml(config.cardSectionKicker || "Selected Comparable Cards")}</p>
            <h3>${escapeHtml(config.cardSectionTitle)}</h3>
          </div>
        ` : ""}
        <div class="${cardGridClass}">
          ${models.map(model => renderPropertyCard(model, reviewByParcelId.get(model.parcelId))).join("")}
        </div>
      </section>

      ${config.showCandidateReview ? renderComparableCandidateReview(subject, candidateModels, { refined: config.refinedComparableReview, stage: config.refinedComparableReview ? "details" : "full", searchStats: config.candidateSearchStats }) : ""}

      ${config.refinedComparableReview ? fullRecordComparison : `
      <section class="neighbor-comp-sheet review-card" aria-label="${escapeHtml(config.tableLabel || "Side-by-side comp sheet")}">
        <div class="neighbor-comp-sheet-header">
          <div>
            <p class="guided-kicker">${escapeHtml(config.tableKicker || "Comp Sheet")}</p>
            <h2>${escapeHtml(config.tableTitle || "Record facts and value breakouts")}</h2>
          </div>
          <p>${escapeHtml(config.sourceText || "")}</p>
        </div>
        ${renderCompTable(models)}
      </section>
      `}
    </section>
  `;

  if (config.refinedComparableReview && window.matchMedia("(max-width: 980px)").matches) {
    canvas.querySelector(".neighbor-comp-full-record")?.removeAttribute("open");
  }
}
