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
} from "../domain/comparison-review.js?v=20260701-article-polish-4";
import { escapeHtml } from "../utils/html.js?v=20260701-article-polish-4";
import { rankComparableCandidates } from "./comparable-candidate-review.js?v=20260701-article-polish-4";

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

function scoreLabel(model, review) {
  if (model.role === "subject") return "Subject";
  return review?.score?.totalScore ?? "Not listed";
}

function burdenLabel(model, review) {
  if (model.role === "subject") return "-";
  return review?.adjustmentBurden || "Not listed";
}

function normalizedPricePerSqFtLabel(model) {
  return model.normalizedPricePerSqFtLabel || moneyPerSqFtLabel(model.salePrice, model.buildingSqFt);
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
          <div>
            <dt>Normalized $/sf</dt>
            <dd>${escapeHtml(normalizedPricePerSqFtLabel(model))}</dd>
          </div>
          <div>
            <dt>Similarity score</dt>
            <dd>${escapeHtml(scoreLabel(model, review))}</dd>
          </div>
          <div>
            <dt>Adjustment burden</dt>
            <dd>${escapeHtml(burdenLabel(model, review))}</dd>
          </div>
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

function assessmentAverageRatio(models = []) {
  const ratios = models
    .map(assessmentAtSale)
    .filter(item => item?.ratio);
  return ratios.length
    ? ratios.reduce((sum, item) => sum + item.ratio, 0) / ratios.length
    : null;
}

function renderQuestionSection(config = {}) {
  return `
    <section class="comp-story-question review-card" aria-labelledby="neighborCompTitle">
      <p class="guided-kicker">${escapeHtml(config.contextKicker || "Guided Comparable Search")}</p>
      <h2 id="neighborCompTitle">${escapeHtml(config.introTitle || "A walkthrough for understanding comparison")}</h2>
      <p>${escapeHtml(config.introCopy || "This exercise is not intended to determine an exact market value. It demonstrates how similar properties can be reviewed and compared as part of an equalization review process.")}</p>
      ${config.disclaimer ? `<p class="comp-story-disclaimer">${escapeHtml(config.disclaimer)}</p>` : ""}
    </section>
  `;
}

function renderSubjectSnapshot(model) {
  if (!model) return "";

  const saleContext = assessmentAtSale(model);

  return `
    <section class="subject-snapshot-panel review-card" aria-labelledby="subjectStoryTitle">
      <div class="subject-story-photo">
        <img src="${escapeHtml(model.photoUrl || "")}" alt="${escapeHtml(model.address)} house photo" />
      </div>
      <div class="subject-story-main">
        <p class="guided-kicker">Subject Property</p>
        <h2 id="subjectStoryTitle">${escapeHtml(model.address)}</h2>
        <dl class="subject-story-facts">
          <div><dt>2026 assessed value</dt><dd>${escapeHtml(moneyLabel(model.values.assessed2026))}</dd></div>
          <div><dt>Building size</dt><dd>${escapeHtml(numberLabel(model.buildingSqFt, " sq. ft."))}</dd></div>
          <div><dt>Sale price</dt><dd>${escapeHtml(moneyLabel(model.salePrice))}</dd></div>
          <div><dt>Assessment-to-sale ratio</dt><dd>${escapeHtml(saleRatioDisplayLabel(saleContext?.ratio))}</dd></div>
        </dl>
        <details class="subject-details-toggle">
          <summary>View Property Details</summary>
          <dl>
            <div><dt>Sale date</dt><dd>${escapeHtml(textLabel(model.saleDate))}</dd></div>
            <div><dt>Assessed value at sale</dt><dd>${escapeHtml(moneyLabel(saleContext?.assessed))}</dd></div>
            <div><dt>Year built</dt><dd>${escapeHtml(numberLabel(model.structure.yearBuilt))}</dd></div>
            <div><dt>Quality / condition</dt><dd>${escapeHtml([model.condition.quality, model.condition.condition].filter(Boolean).join(" / ") || "Not listed")}</dd></div>
            <div><dt>Tax district</dt><dd>${escapeHtml(textLabel(model.taxDistrict))}</dd></div>
            <div><dt>School district</dt><dd>${escapeHtml(textLabel(model.schoolDistrict))}</dd></div>
          </dl>
        </details>
      </div>
    </section>
  `;
}

function renderSubjectAdjustmentSection(adjustment = null) {
  if (!adjustment) return "";

  const statItems = adjustment.statItems || [];

  return `
    <section class="subject-adjustment-section review-card" aria-labelledby="subjectAdjustmentTitle">
      <div class="comp-story-section-head">
        <p class="guided-kicker">${escapeHtml(adjustment.kicker || "Subject Adjustment")}</p>
        <h2 id="subjectAdjustmentTitle">${escapeHtml(adjustment.title || "Subject adjustment context")}</h2>
        ${adjustment.intro ? `<p>${escapeHtml(adjustment.intro)}</p>` : ""}
      </div>
      ${statItems.length ? `
        <dl class="why-matches-stats">
          ${statItems.map(([label, value]) => `
            <div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(`${value}`)}</dd></div>
          `).join("")}
        </dl>
      ` : ""}
      ${adjustment.note ? `<p class="why-matches-note">${escapeHtml(adjustment.note)}</p>` : ""}
    </section>
  `;
}

function renderBestMatchesSection(models, selectedReviews, reviewByParcelId, config = {}) {
  return `
    <section class="best-matches-section review-card" aria-labelledby="bestMatchesTitle">
      <div class="comp-story-section-head">
        <p class="guided-kicker">${escapeHtml(config.cardSectionKicker || "Best Available Matches")}</p>
        <h2 id="bestMatchesTitle">${escapeHtml(config.cardSectionTitle || "Subject property and selected nearby sales")}</h2>
        <p>Swipe through the subject and selected sales first. The detailed record checks are available farther down the page.</p>
      </div>
      <div class="neighbor-comp-card-grid neighbor-comp-card-grid-four neighbor-comp-card-carousel" aria-label="${escapeHtml(config.cardSectionLabel || "Comparison property cards")}">
        ${models.map(model => renderPropertyCard(model, reviewByParcelId.get(model.parcelId))).join("")}
      </div>
      ${renderRankingSummary(selectedReviews)}
    </section>
  `;
}

function renderRankingSummary(reviews = []) {
  if (!reviews.length) return "";

  return `
    <section class="mobile-ranking-summary" aria-labelledby="rankingSummaryTitle">
      <h3 id="rankingSummaryTitle">Best Available Matches</h3>
      <div class="mobile-ranking-list">
        ${reviews.map((review, index) => `
          <article>
            <span>${index + 1}</span>
            <strong>${escapeHtml(review.candidate.address)}</strong>
            <em>${review.score.totalScore}</em>
            <small>${escapeHtml(review.adjustmentBurden)}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderWhyMatchesSection(ranked, searchStats = {}, config = {}) {
  const allCandidates = ranked.allCandidates || [];
  const selectedCandidates = ranked.selectedCandidates || [];
  const eligibleCount = allCandidates.filter(review => review.eligibility.eligible).length;
  const reviewedCount = searchStats.localPdfCandidateCount ?? allCandidates.length;
  const statItems = searchStats.statItems || [
    ["Records reviewed", reviewedCount],
    ["Eligible candidates", searchStats.eligibleScriptCandidateCount ?? eligibleCount],
    ["Selected matches", selectedCandidates.length]
  ];
  const note = config.whyMatchesNote || `
        The selected sales rose to the top because they combine usable sale information with similar public-record characteristics.
        Each one still has differences that require judgment.
      `;

  return `
    <section class="why-matches-section review-card" aria-labelledby="whyMatchesTitle">
      <div class="comp-story-section-head">
        <p class="guided-kicker">${escapeHtml(config.whyMatchesKicker || "Why These Matches Were Selected")}</p>
        <h2 id="whyMatchesTitle">${escapeHtml(config.whyMatchesTitle || "Best available candidates, not identical properties")}</h2>
        <p>${escapeHtml(config.whyMatchesIntro || "Comparable selection often means choosing the best available candidates rather than finding perfect matches.")}</p>
      </div>
      <dl class="why-matches-stats">
        ${statItems.map(([label, value]) => `
          <div><dt>${escapeHtml(label)}</dt><dd>${Number(value).toLocaleString("en-US")}</dd></div>
        `).join("")}
      </dl>
      <p class="why-matches-note">${escapeHtml(note)}</p>
    </section>
  `;
}

function moneyPerSqFtLabel(price, squareFeet) {
  if (!price || !squareFeet) return "Not listed";
  return `${new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price / squareFeet)}/sf`;
}

function renderMipsCandidateReviewSection(rows = []) {
  if (!rows.length) return "";

  return `
    <section class="mips-candidate-review-section review-card" aria-labelledby="mipsCandidateReviewTitle">
      <div class="comp-story-section-head">
        <p class="guided-kicker">MIPS Public Sales Screen</p>
        <h2 id="mipsCandidateReviewTitle">Recent sale candidates checked against full records</h2>
        <p>The MIPS map is used as the first pass. The full-detail score then checks the GWorks property facts where a PDF record is available.</p>
      </div>
      <div class="neighbor-comp-table-wrap">
        <table class="neighbor-comp-table">
          <thead>
            <tr>
              <th scope="col">Candidate</th>
              <th scope="col">Sale</th>
              <th scope="col">Price / sq. ft.</th>
              <th scope="col">MIPS seed</th>
              <th scope="col">Full-detail score</th>
              <th scope="col">Review note</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                <th scope="row">
                  ${escapeHtml(row.address)}
                  <br><small>${escapeHtml(row.parcelId)}</small>
                </th>
                <td>${escapeHtml(textLabel(row.saleDate))}<br>${escapeHtml(moneyLabel(row.salePrice))}</td>
                <td>${escapeHtml(moneyPerSqFtLabel(row.salePrice, row.buildingSqFt))}</td>
                <td>${escapeHtml(numberLabel(row.mipsSeedScore))}</td>
                <td>${escapeHtml(numberLabel(row.fullDetailScore))}</td>
                <td>${escapeHtml(row.note || "")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderEqualizationSection() {
  return `
    <section class="equalization-story-section review-card" aria-labelledby="equalizationStoryTitle">
      <div class="comp-story-section-head">
        <p class="guided-kicker">What Are We Checking?</p>
        <h2 id="equalizationStoryTitle">Similar properties should be treated similarly</h2>
      </div>
      <p>
        This exercise is not trying to determine the exact value of a house. It is trying to determine whether similar
        properties are being treated similarly. That principle is known as equalization.
      </p>
      <p>
        Comparable sales are one tool used to evaluate whether assessments appear uniform and proportionate across similar properties.
      </p>
    </section>
  `;
}

function renderAssessmentContextSection(subject, comparableModels = []) {
  if (!subject) return "";

  const saleContext = assessmentAtSale(subject);
  const comparableAverageRatio = assessmentAverageRatio(comparableModels);

  return `
    <section class="assessment-context-section review-card" aria-labelledby="assessmentContextTitle">
      <div class="comp-story-section-head">
        <p class="guided-kicker">Assessment-to-Sale Context</p>
        <h2 id="assessmentContextTitle">Where the property entered the cycle</h2>
      </div>
      <dl class="assessment-context-facts">
        <div><dt>Subject sale price</dt><dd>${escapeHtml(moneyLabel(subject.salePrice))}</dd></div>
        <div><dt>Assessed at sale</dt><dd>${escapeHtml(moneyLabel(saleContext?.assessed))}</dd></div>
        <div><dt>Subject reference</dt><dd>${escapeHtml(saleRatioDisplayLabel(saleContext?.ratio))}</dd></div>
        <div><dt>Comp average reference</dt><dd>${escapeHtml(saleRatioDisplayLabel(comparableAverageRatio))}</dd></div>
      </dl>
      <p>
        This historical context helps explain starting position and assessment movement over time. It does not determine whether
        the current assessment is correct.
      </p>
    </section>
  `;
}

function renderDetailedComparisonSection(reviews = []) {
  if (!reviews.length) return "";

  return `
    <details class="detailed-comparison-section review-card">
      <summary>
        <span>
          <span class="guided-kicker">Detailed Comparison</span>
          <strong>View Detailed Comparison</strong>
        </span>
        <small>Open this section to inspect the attribute-by-attribute review behind the selected matches.</small>
      </summary>
      <div class="comp-review-checklist-stack">
        ${reviews.map(renderChecklist).join("")}
      </div>
    </details>
  `;
}

function renderBadge(label, modifier) {
  return `<span class="comp-review-badge comp-review-badge-${escapeHtml(modifier)}">${escapeHtml(label)}</span>`;
}

function renderChecklist(review) {
  return `
    <details class="comp-review-checklist">
      <summary class="comp-review-checklist-head">
        <div>
          <p class="neighbor-comp-label">${escapeHtml(review.candidate.roleLabel || "Candidate")}</p>
          <h3>${escapeHtml(review.candidate.address)} checklist</h3>
        </div>
        <div class="comp-review-badge-row">
          ${renderBadge(`${review.score.totalScore} score`, "score")}
          ${renderBadge(review.adjustmentBurden, "burden")}
        </div>
      </summary>
      <div class="neighbor-comp-table-wrap">
        <table class="neighbor-comp-table comp-review-table">
          <thead>
            <tr>
              <th scope="col">Comparison point</th>
              <th scope="col">Subject</th>
              <th scope="col">Candidate</th>
              <th scope="col">Rating</th>
              <th scope="col">Note</th>
            </tr>
          </thead>
          <tbody>
            ${review.checklist.rows.map(row => `
              <tr>
                <th scope="row">${escapeHtml(row.attribute)}</th>
                <td>${escapeHtml(row.subjectValue)}</td>
                <td>${escapeHtml(row.candidateValue)}</td>
                <td>${renderBadge(row.rating, row.rating)}</td>
                <td>${escapeHtml(row.explanation)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </details>
  `;
}

function renderAuditTrailSection(models, config = {}) {
  const sourceText = config.sourceText || "Source: GWorks property record PDFs, Nebraska Taxes Online statement data, and manually selected comparable sales records. This experimental view is for review and layout testing only.";

  return `
    <details class="neighbor-comp-full-record review-card">
      <summary>
        <span>
          <span class="guided-kicker">${escapeHtml(config.tableKicker || "Audit Trail")}</span>
          <strong>Full Record Comparison</strong>
        </span>
        <small>This section preserves the underlying records used in the review process and is provided for transparency and verification.</small>
      </summary>
      ${renderCompTable(models)}
      <p class="neighbor-comp-source-note">${escapeHtml(sourceText)}</p>
    </details>
  `;
}

export async function renderComparisonExperiment(propertySwitcherContext = {}, config = {}) {
  const pageTitle = document.getElementById("pageTitle");
  const canvas = document.querySelector(".mobile-review-canvas");
  if (!canvas) return;

  document.querySelector(".guide-review-header")?.classList.add("is-hidden");
  document.querySelectorAll("[data-guided-panel]").forEach(panel => panel.classList.add("is-hidden"));
  document.querySelector("[data-footer-resource-shell]")?.classList.add("is-hidden");

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

  pageTitle.innerHTML = `
    <div class="comp-page-title">
      <p class="guided-kicker">${escapeHtml(config.kicker || "Experiment · Comp Sheet")}</p>
      <h1>${escapeHtml(config.title)}</h1>
      <p>${escapeHtml(config.subtitle || "")}</p>
    </div>
  `;

  canvas.innerHTML = `
    <section class="neighbor-comp-page" aria-labelledby="neighborCompTitle">
      ${renderQuestionSection(config)}
      ${renderSubjectSnapshot(subject)}
      ${renderSubjectAdjustmentSection(config.subjectAdjustment)}
      ${renderBestMatchesSection(models, rankedForCards.selectedCandidates, reviewByParcelId, config)}
      ${renderWhyMatchesSection(rankedForCards, config.candidateSearchStats, config)}
      ${renderMipsCandidateReviewSection(config.mipsCandidateReview)}
      ${renderEqualizationSection()}
      ${renderAssessmentContextSection(subject, models.filter(model => model.role !== "subject"))}
      ${renderDetailedComparisonSection(rankedForCards.selectedCandidates)}
      ${renderAuditTrailSection(models, config)}
    </section>
  `;
}
