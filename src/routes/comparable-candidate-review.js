import { formatNullableMoney } from "../format.js";
import { escapeHtml } from "../utils/html.js";

const CONDITION_RANKS = ["poor", "fair", "average", "good", "very good", "excellent"];

function moneyLabel(value) {
  return value === null || value === undefined ? "Not listed" : formatNullableMoney(value);
}

function numberLabel(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "Not listed";
  return `${Number(value).toLocaleString("en-US")}${suffix}`;
}

function textLabel(value) {
  return value === null || value === undefined || value === "" ? "Not listed" : `${value}`;
}

function percentLabel(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Not listed";

  return `${(value * 100).toFixed(2)}%`;
}

function moneyPerSqFt(numerator, denominator) {
  if (!numerator || !denominator) return "Not listed";
  return moneyLabel(Math.round(numerator / denominator));
}

function valuePerSqFt(model) {
  if (!model.values?.assessed2026 || !model.buildingSqFt) return null;
  return Math.round(model.values.assessed2026 / model.buildingSqFt);
}

function assessmentToSaleRatio(model) {
  if (!model.values?.assessed2026 || !model.salePrice) return null;
  return model.values.assessed2026 / model.salePrice;
}

function normalized(value) {
  return `${value ?? ""}`.trim().toLowerCase();
}

function conditionRank(value) {
  const text = normalized(value);
  return CONDITION_RANKS.findIndex(rank => text.includes(rank));
}

function isSameOrNearbyQuality(left, right) {
  const leftRank = conditionRank(left);
  const rightRank = conditionRank(right);
  if (leftRank === -1 || rightRank === -1) return { same: false, nearby: false };

  return {
    same: leftRank === rightRank,
    nearby: Math.abs(leftRank - rightRank) <= 1
  };
}

function percentDifference(subjectValue, candidateValue) {
  if (!subjectValue || !candidateValue) return null;
  return (candidateValue - subjectValue) / subjectValue;
}

function sameExteriorCategory(subjectExterior, candidateExterior) {
  const subject = normalized(subjectExterior);
  const candidate = normalized(candidateExterior);
  const categories = ["brick", "stone", "masonry", "vinyl", "wood", "hardboard", "siding", "frame"];

  return categories.some(category => subject.includes(category) && candidate.includes(category));
}

function saleAgeMonths(candidate, referenceDate = new Date("2026-01-01T00:00:00Z")) {
  if (!candidate.saleDate) return null;
  const parsed = new Date(candidate.saleDate);
  if (Number.isNaN(parsed.getTime())) return null;

  return (referenceDate.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
}

function hasAtypicalFeature(model) {
  const text = [
    model.landDescription,
    model.site?.lotLegal,
    model.site?.locationFactors,
    model.improvements?.outbuildings,
    model.improvements?.decksPorches,
    model.improvements?.other,
    model.pool,
    model.notes,
    model.context?.reviewCaution
  ].join(" ").toLowerCase();

  return /pool|swimming|machinery building|machine shed|commercial|atypical/.test(text);
}

function siteFactorCautions(model) {
  const text = [
    model.landDescription,
    model.site?.lotLegal,
    model.site?.locationFactors,
    model.context?.reviewCaution
  ].join(" ").toLowerCase();
  const cautions = [];

  if (/busy street/.test(text)) cautions.push("Busy street site factor needs market judgment.");
  if (/large lot|excess/.test(text)) cautions.push("Lot size or excess land may require review.");

  return cautions;
}

function hasLargeOutbuildingPackage(subject, candidate) {
  const subjectOther = subject.values?.otherValue || 0;
  const candidateOther = candidate.values?.otherValue || 0;
  return candidateOther > Math.max(subjectOther * 1.75, subjectOther + 20000);
}

function pushIf(list, condition, message) {
  if (condition) list.push(message);
}

export function isEligibleComparable(subject, candidate) {
  const disqualifiers = [];
  const cautions = [];

  pushIf(disqualifiers, normalized(candidate.propertyClass) !== normalized(subject.propertyClass), "Property class does not match the subject.");
  pushIf(disqualifiers, normalized(candidate.propertyClass) !== "residential", "Candidate is not a residential account.");
  pushIf(disqualifiers, candidate.zoning && subject.zoning && normalized(candidate.zoning) !== normalized(subject.zoning), "Zoning does not match the subject.");
  pushIf(disqualifiers, !candidate.salePrice, "Sale price is missing.");
  pushIf(disqualifiers, !candidate.saleDate, "Sale date is missing.");
  pushIf(disqualifiers, !candidate.buildingSqFt, "Building size is missing.");
  pushIf(disqualifiers, !candidate.structure?.yearBuilt, "Year built is missing.");

  pushIf(cautions, candidate.taxDistrict && subject.taxDistrict && candidate.taxDistrict !== subject.taxDistrict, "Different tax district.");
  pushIf(cautions, candidate.schoolDistrict && subject.schoolDistrict && candidate.schoolDistrict !== subject.schoolDistrict, "Different school district.");
  pushIf(cautions, candidate.location && subject.location && normalized(candidate.location) !== normalized(subject.location), "Different location type.");
  pushIf(cautions, !candidate.condition?.condition || !candidate.condition?.quality, "Missing condition or quality data.");
  pushIf(cautions, hasAtypicalFeature(candidate), "Major atypical feature may require review.");
  pushIf(cautions, hasLargeOutbuildingPackage(subject, candidate), "Candidate has a much larger outbuilding package.");
  siteFactorCautions(candidate).forEach(caution => cautions.push(caution));

  const monthsOld = saleAgeMonths(candidate);
  pushIf(cautions, monthsOld !== null && monthsOld > 36, "Sale is older than the preferred review window.");

  return {
    eligible: disqualifiers.length === 0,
    disqualifiers,
    cautions
  };
}

export function scoreComparable(subject, candidate) {
  const scoreBreakdown = {
    locationJurisdiction: 0,
    physicalStructure: 0,
    qualityCondition: 0,
    basementUtility: 0,
    garageImprovements: 0,
    saleRecency: 0
  };
  const cautions = [];

  if (candidate.taxDistrict && subject.taxDistrict && candidate.taxDistrict === subject.taxDistrict) scoreBreakdown.locationJurisdiction += 8;
  if (candidate.schoolDistrict && subject.schoolDistrict && candidate.schoolDistrict === subject.schoolDistrict) scoreBreakdown.locationJurisdiction += 4;
  if (candidate.location && subject.location && normalized(candidate.location) === normalized(subject.location)) scoreBreakdown.locationJurisdiction += 4;
  if (candidate.lotSizeClass && subject.lotSizeClass && normalized(candidate.lotSizeClass) === normalized(subject.lotSizeClass)) scoreBreakdown.locationJurisdiction += 4;

  const sizeDiff = Math.abs(percentDifference(subject.buildingSqFt, candidate.buildingSqFt) ?? Infinity);
  if (sizeDiff <= 0.1) scoreBreakdown.physicalStructure += 10;
  else if (sizeDiff <= 0.2) scoreBreakdown.physicalStructure += 6;

  const yearDiff = Math.abs((candidate.structure?.yearBuilt || 0) - (subject.structure?.yearBuilt || 0));
  if (subject.structure?.yearBuilt && candidate.structure?.yearBuilt && yearDiff <= 10) scoreBreakdown.physicalStructure += 8;
  if (subject.structure?.style && candidate.structure?.style && normalized(subject.structure.style) === normalized(candidate.structure.style)) scoreBreakdown.physicalStructure += 7;
  if (subject.structure?.bedrooms && candidate.structure?.bedrooms && Math.abs(subject.structure.bedrooms - candidate.structure.bedrooms) <= 1) scoreBreakdown.physicalStructure += 3;
  if (subject.structure?.bathrooms && candidate.structure?.bathrooms && Math.abs(subject.structure.bathrooms - candidate.structure.bathrooms) <= 1) scoreBreakdown.physicalStructure += 3;
  if (sameExteriorCategory(subject.condition?.exterior, candidate.condition?.exterior)) scoreBreakdown.physicalStructure += 4;

  const conditionFit = isSameOrNearbyQuality(subject.condition?.condition, candidate.condition?.condition);
  if (conditionFit.same) scoreBreakdown.qualityCondition += 8;
  else if (conditionFit.nearby) scoreBreakdown.qualityCondition += 5;

  const qualityFit = isSameOrNearbyQuality(subject.condition?.quality, candidate.condition?.quality);
  if (qualityFit.same) scoreBreakdown.qualityCondition += 8;
  else if (qualityFit.nearby) scoreBreakdown.qualityCondition += 4;

  const basementDiff = Math.abs(percentDifference(subject.structure?.basement, candidate.structure?.basement) ?? Infinity);
  if (basementDiff <= 0.2) scoreBreakdown.basementUtility += 5;
  const finishedDiff = Math.abs(percentDifference(subject.basementFinishedSqFt, candidate.basementFinishedSqFt) ?? Infinity);
  if (finishedDiff <= 0.25 || (!subject.basementFinishedSqFt && !candidate.basementFinishedSqFt)) scoreBreakdown.basementUtility += 5;

  if (subject.structure?.garage && candidate.structure?.garage && normalized(subject.structure.garage).split(",")[0] === normalized(candidate.structure.garage).split(",")[0]) scoreBreakdown.garageImprovements += 3;
  const garageDiff = Math.abs(percentDifference(subject.garageSize, candidate.garageSize) ?? Infinity);
  if (garageDiff <= 0.3) scoreBreakdown.garageImprovements += 3;
  if (normalized(subject.improvements?.decksPorches) !== "none listed" && normalized(candidate.improvements?.decksPorches) !== "none listed") scoreBreakdown.garageImprovements += 2;
  if (!hasAtypicalFeature(candidate) && !hasLargeOutbuildingPackage(subject, candidate)) scoreBreakdown.garageImprovements += 2;
  else cautions.push("Atypical feature or outbuilding package may require judgment.");

  const monthsOld = saleAgeMonths(candidate);
  if (monthsOld === null) {
    cautions.push("Sale date is missing.");
  } else if (monthsOld <= 12) {
    scoreBreakdown.saleRecency += 5;
  } else if (monthsOld <= 24) {
    scoreBreakdown.saleRecency += 4;
  } else if (monthsOld <= 36) {
    scoreBreakdown.saleRecency += 3;
  } else {
    scoreBreakdown.saleRecency += 1;
    cautions.push("Sale is older than 36 months.");
  }

  return {
    totalScore: Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0),
    scoreBreakdown,
    cautions
  };
}

function compareNumeric({ subjectValue, candidateValue, similarPct = 0.1, label, higherIsSuperior = true }) {
  if (!subjectValue || !candidateValue) {
    return {
      rating: "unknown",
      explanation: `${label} is missing for one or both properties.`
    };
  }

  const diff = percentDifference(subjectValue, candidateValue);
  if (Math.abs(diff) <= similarPct) {
    return {
      rating: "similar",
      explanation: `${label} is within ${(similarPct * 100).toFixed(0)}% of the subject.`
    };
  }

  const candidateHigher = diff > 0;
  return {
    rating: candidateHigher === higherIsSuperior ? "superior" : "inferior",
    explanation: `${label} is ${candidateHigher ? "higher/larger" : "lower/smaller"} than the subject.`
  };
}

function compareRanked(subjectValue, candidateValue, label) {
  const subjectRank = conditionRank(subjectValue);
  const candidateRank = conditionRank(candidateValue);
  if (subjectRank === -1 || candidateRank === -1) {
    return {
      rating: "unknown",
      explanation: `${label} is missing or cannot be ranked from the public record text.`
    };
  }
  if (subjectRank === candidateRank) {
    return {
      rating: "similar",
      explanation: `${label} matches the subject.`
    };
  }

  return {
    rating: candidateRank > subjectRank ? "superior" : "inferior",
    explanation: `${label} is ${candidateRank > subjectRank ? "higher" : "lower"} than the subject.`
  };
}

function compareText(subjectValue, candidateValue, label) {
  if (!subjectValue || !candidateValue) {
    return {
      rating: "unknown",
      explanation: `${label} is missing for one or both properties.`
    };
  }
  if (normalized(subjectValue) === normalized(candidateValue)) {
    return {
      rating: "similar",
      explanation: `${label} matches the subject.`
    };
  }

  return {
    rating: "caution",
    explanation: `${label} differs from the subject and may require judgment.`
  };
}

function checklistRow(attribute, subjectValue, candidateValue, comparison) {
  return {
    attribute,
    subjectValue,
    candidateValue,
    rating: comparison.rating,
    explanation: comparison.explanation
  };
}

export function compareAttributes(subject, candidate) {
  const rows = [
    checklistRow("Sale date", "Subject property", textLabel(candidate.saleDate), candidate.saleDate
      ? { rating: saleAgeMonths(candidate) > 36 ? "caution" : "similar", explanation: saleAgeMonths(candidate) > 36 ? "Sale is older than the preferred window." : "Sale date is available for review." }
      : { rating: "unknown", explanation: "Sale date is missing." }),
    checklistRow("Sale price", "Subject property", moneyLabel(candidate.salePrice), candidate.salePrice
      ? { rating: "similar", explanation: "Sale price is available for ratio review." }
      : { rating: "unknown", explanation: "Sale price is missing from the current source extract." }),
    checklistRow("Building size", numberLabel(subject.buildingSqFt, " sq. ft."), numberLabel(candidate.buildingSqFt, " sq. ft."), compareNumeric({ subjectValue: subject.buildingSqFt, candidateValue: candidate.buildingSqFt, label: "Building size" })),
    checklistRow("Year built", numberLabel(subject.structure?.yearBuilt), numberLabel(candidate.structure?.yearBuilt), compareNumeric({ subjectValue: subject.structure?.yearBuilt, candidateValue: candidate.structure?.yearBuilt, similarPct: 10 / Math.max(subject.structure?.yearBuilt || 1, 1), label: "Year built" })),
    checklistRow("Style", textLabel(subject.structure?.style), textLabel(candidate.structure?.style), compareText(subject.structure?.style, candidate.structure?.style, "Style")),
    checklistRow("Quality", textLabel(subject.condition?.quality), textLabel(candidate.condition?.quality), compareRanked(subject.condition?.quality, candidate.condition?.quality, "Quality")),
    checklistRow("Condition", textLabel(subject.condition?.condition), textLabel(candidate.condition?.condition), compareRanked(subject.condition?.condition, candidate.condition?.condition, "Condition")),
    checklistRow("Bedrooms", numberLabel(subject.structure?.bedrooms), numberLabel(candidate.structure?.bedrooms), compareNumeric({ subjectValue: subject.structure?.bedrooms, candidateValue: candidate.structure?.bedrooms, similarPct: 0.34, label: "Bedroom count" })),
    checklistRow("Bathrooms", numberLabel(subject.structure?.bathrooms), numberLabel(candidate.structure?.bathrooms), compareNumeric({ subjectValue: subject.structure?.bathrooms, candidateValue: candidate.structure?.bathrooms, similarPct: 0.4, label: "Bathroom count" })),
    checklistRow("Basement size", numberLabel(subject.structure?.basement, " sq. ft."), numberLabel(candidate.structure?.basement, " sq. ft."), compareNumeric({ subjectValue: subject.structure?.basement, candidateValue: candidate.structure?.basement, similarPct: 0.2, label: "Basement size" })),
    checklistRow("Finished basement", numberLabel(subject.basementFinishedSqFt, " sq. ft."), numberLabel(candidate.basementFinishedSqFt, " sq. ft."), compareNumeric({ subjectValue: subject.basementFinishedSqFt, candidateValue: candidate.basementFinishedSqFt, similarPct: 0.25, label: "Finished basement" })),
    checklistRow("Garage type", textLabel(subject.structure?.garage), textLabel(candidate.structure?.garage), compareText(subject.structure?.garage, candidate.structure?.garage, "Garage type")),
    checklistRow("Garage size", numberLabel(subject.garageSize, " sq. ft."), numberLabel(candidate.garageSize, " sq. ft."), compareNumeric({ subjectValue: subject.garageSize, candidateValue: candidate.garageSize, similarPct: 0.3, label: "Garage size" })),
    checklistRow("Exterior", textLabel(subject.condition?.exterior), textLabel(candidate.condition?.exterior), sameExteriorCategory(subject.condition?.exterior, candidate.condition?.exterior)
      ? { rating: "similar", explanation: "Exterior categories appear broadly similar." }
      : compareText(subject.condition?.exterior, candidate.condition?.exterior, "Exterior")),
    checklistRow("Lot size class", textLabel(subject.lotSizeClass), textLabel(candidate.lotSizeClass), compareText(subject.lotSizeClass, candidate.lotSizeClass, "Lot size class")),
    checklistRow("Location factor", textLabel(subject.location), textLabel(candidate.location), compareText(subject.location, candidate.location, "Location factor")),
    checklistRow("Site cautions", "Subject reference", textLabel(siteFactorCautions(candidate).join("; ")), siteFactorCautions(candidate).length
      ? { rating: "caution", explanation: "Candidate has a site factor that may affect market comparison." }
      : { rating: "similar", explanation: "No major site caution is flagged from available public record text." }),
    checklistRow("Outbuildings", textLabel(subject.improvements?.outbuildings), textLabel(candidate.improvements?.outbuildings), hasLargeOutbuildingPackage(subject, candidate)
      ? { rating: "caution", explanation: "Candidate outbuilding package is materially different from the subject." }
      : compareText(subject.improvements?.outbuildings, candidate.improvements?.outbuildings, "Outbuildings")),
    checklistRow("Porches/decks", textLabel(subject.improvements?.decksPorches), textLabel(candidate.improvements?.decksPorches), compareText(subject.improvements?.decksPorches, candidate.improvements?.decksPorches, "Porches/decks")),
    checklistRow("Fireplaces", textLabel(subject.fireplaces), textLabel(candidate.fireplaces), compareText(subject.fireplaces, candidate.fireplaces, "Fireplaces")),
    checklistRow("Pool or atypical feature", textLabel(subject.pool || "None listed"), textLabel(candidate.pool || (hasAtypicalFeature(candidate) ? "Atypical feature flagged" : "None listed")), hasAtypicalFeature(candidate)
      ? { rating: "caution", explanation: "Candidate has an atypical feature that may require separate review." }
      : { rating: "similar", explanation: "No major atypical amenity mismatch is flagged." }),
    checklistRow("2026 assessed value", moneyLabel(subject.values?.assessed2026), moneyLabel(candidate.values?.assessed2026), compareNumeric({ subjectValue: subject.values?.assessed2026, candidateValue: candidate.values?.assessed2026, similarPct: 0.15, label: "2026 assessed value" })),
    checklistRow("2026 assessed value per building sq. ft.", moneyLabel(valuePerSqFt(subject)), moneyLabel(valuePerSqFt(candidate)), compareNumeric({ subjectValue: valuePerSqFt(subject), candidateValue: valuePerSqFt(candidate), similarPct: 0.15, label: "Assessed value per building square foot" })),
    checklistRow("2026 assessment-to-sale reference", percentLabel(assessmentToSaleRatio(subject)), percentLabel(assessmentToSaleRatio(candidate)), assessmentToSaleRatio(candidate)
      ? { rating: "similar", explanation: "Reference is available for context. It is not a ratio-study conclusion." }
      : { rating: "unknown", explanation: "Sale price is missing, so this reference cannot be computed." })
  ];

  const summary = rows.reduce((counts, row) => {
    counts[`${row.rating}Count`] = (counts[`${row.rating}Count`] || 0) + 1;
    return counts;
  }, {
    superiorCount: 0,
    similarCount: 0,
    inferiorCount: 0,
    cautionCount: 0,
    unknownCount: 0
  });

  return {
    candidateParcelId: candidate.parcelId,
    candidateAddress: candidate.address,
    rows,
    summary
  };
}

export function adjustmentBurdenLabel(checklist, eligibility) {
  const { superiorCount, inferiorCount, cautionCount, unknownCount, similarCount } = checklist.summary;
  if (!eligibility.eligible || unknownCount >= 10) return "Review only";
  if (cautionCount >= 3 || superiorCount + inferiorCount >= similarCount) return "High adjustment burden";
  if (superiorCount + inferiorCount >= 4 || cautionCount >= 1) return "Moderate adjustment burden";
  return "Low adjustment burden";
}

function topReasons(subject, candidate, score, checklist) {
  const reasons = [];
  if (candidate.taxDistrict === subject.taxDistrict) reasons.push("Same tax district.");
  if (candidate.location === subject.location) reasons.push("Same location type.");
  if (Math.abs(percentDifference(subject.buildingSqFt, candidate.buildingSqFt) ?? Infinity) <= 0.2) reasons.push("Building size is within a usable range.");
  if (candidate.saleDate) reasons.push("Sale date is available.");
  if (score.scoreBreakdown.qualityCondition >= 12) reasons.push("Quality and condition are broadly similar.");
  if (checklist.summary.similarCount >= 8) reasons.push("Multiple record characteristics compare as similar.");

  return reasons.slice(0, 3);
}

function topCautions(eligibility, score, checklist) {
  return [
    ...eligibility.disqualifiers,
    ...eligibility.cautions,
    ...score.cautions,
    ...checklist.rows
      .filter(row => row.rating === "caution" || row.rating === "unknown")
      .map(row => `${row.attribute}: ${row.explanation}`)
  ].filter((value, index, list) => {
    if (!value || list.indexOf(value) !== index) return false;
    if (/sale is older/i.test(value) && list.slice(0, index).some(item => /sale is older|sale older/i.test(item))) return false;
    return true;
  }).slice(0, 3);
}

export function rankComparableCandidates(subject, candidates) {
  const reviewed = candidates.map(candidate => {
    const eligibility = isEligibleComparable(subject, candidate);
    const score = scoreComparable(subject, candidate);
    const checklist = compareAttributes(subject, candidate);
    const adjustmentBurden = adjustmentBurdenLabel(checklist, eligibility);
    const reasons = topReasons(subject, candidate, score, checklist);
    const cautions = topCautions(eligibility, score, checklist);

    return {
      candidate,
      eligibility,
      score,
      checklist,
      adjustmentBurden,
      reasons,
      cautions
    };
  }).sort((left, right) => {
    const leftSelected = left.candidate.role === "selectedComparable";
    const rightSelected = right.candidate.role === "selectedComparable";
    if (leftSelected !== rightSelected) return leftSelected ? -1 : 1;
    if (left.eligibility.eligible !== right.eligibility.eligible) return left.eligibility.eligible ? -1 : 1;
    if (left.score.totalScore !== right.score.totalScore) return right.score.totalScore - left.score.totalScore;
    if (left.checklist.summary.cautionCount !== right.checklist.summary.cautionCount) return left.checklist.summary.cautionCount - right.checklist.summary.cautionCount;

    const leftDate = left.candidate.saleDate ? new Date(left.candidate.saleDate).getTime() : 0;
    const rightDate = right.candidate.saleDate ? new Date(right.candidate.saleDate).getTime() : 0;
    return rightDate - leftDate;
  });

  return {
    selectedCandidates: reviewed.slice(0, 3),
    alternates: reviewed.slice(3),
    allCandidates: reviewed
  };
}

function renderBadge(label, modifier) {
  return `<span class="comp-review-badge comp-review-badge-${escapeHtml(modifier)}">${escapeHtml(label)}</span>`;
}

function renderMiniList(items, emptyText) {
  const values = items?.length ? items : [emptyText];
  return `
    <ul>
      ${values.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function renderCandidateSummary(review) {
  const status = review.eligibility.eligible
    ? renderBadge("Eligible", "eligible")
    : renderBadge("Review only", "review");

  return `
    <article class="comp-review-summary-card">
      <div class="comp-review-summary-head">
        <div>
          <p class="neighbor-comp-label">${escapeHtml(review.candidate.roleLabel || "Candidate")}</p>
          <h3>${escapeHtml(review.candidate.address)}</h3>
        </div>
        <strong>${review.score.totalScore}</strong>
      </div>
      <div class="comp-review-badge-row">
        ${status}
        ${renderBadge(review.adjustmentBurden, "burden")}
      </div>
      <dl>
        <div><dt>Sale date</dt><dd>${escapeHtml(textLabel(review.candidate.saleDate))}</dd></div>
        <div><dt>Sale price</dt><dd>${escapeHtml(moneyLabel(review.candidate.salePrice))}</dd></div>
        <div><dt>2026 value</dt><dd>${escapeHtml(moneyLabel(review.candidate.values?.assessed2026))}</dd></div>
        <div><dt>Value / sq. ft.</dt><dd>${escapeHtml(moneyPerSqFt(review.candidate.values?.assessed2026, review.candidate.buildingSqFt))}</dd></div>
        <div><dt>Assessment-to-sale</dt><dd>${escapeHtml(percentLabel(assessmentToSaleRatio(review.candidate)))}</dd></div>
      </dl>
      <div class="comp-review-card-lists">
        <div>
          <h4>Why included</h4>
          ${renderMiniList(review.reasons, "Included for review context.")}
        </div>
        <div>
          <h4>Cautions</h4>
          ${renderMiniList(review.cautions, "No major caution flagged from available data.")}
        </div>
      </div>
    </article>
  `;
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

function mainStrength(review) {
  return review.reasons?.[0] || "Best available candidate from the reviewed pool.";
}

function mainCaution(review) {
  return review.cautions?.[0] || "No major caution flagged from available data.";
}

function renderMethodologyNote() {
  return `
    <section class="comp-methodology-note">
      <p class="guided-kicker">How To Read This</p>
      <h3>Manual selection, scored for review</h3>
      <p>
        The three comparable sales on this page were manually selected for this experiment. The score and burden labels are a review aid:
        they show where public record characteristics appear similar, superior, inferior, unknown, or cautionary relative to the subject.
        Those labels describe adjustment work, not whether a property is good or bad.
      </p>
    </section>
  `;
}

function renderRankingSummary(reviews) {
  return `
    <section class="comp-ranking-summary" aria-labelledby="rankingSummaryTitle">
      <div class="comp-review-subhead">
        <p class="guided-kicker">Comparable Ranking Summary</p>
        <h3 id="rankingSummaryTitle">Selected manual candidates at a glance</h3>
      </div>
      <div class="neighbor-comp-table-wrap">
        <table class="neighbor-comp-table comp-ranking-table">
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Address</th>
              <th scope="col">Sale date</th>
              <th scope="col">Sale price</th>
              <th scope="col">Score</th>
              <th scope="col">Burden</th>
              <th scope="col">Main strength</th>
              <th scope="col">Main caution</th>
            </tr>
          </thead>
          <tbody>
            ${reviews.map((review, index) => `
              <tr>
                <th scope="row">${index + 1}</th>
                <td>${escapeHtml(review.candidate.address)}</td>
                <td>${escapeHtml(textLabel(review.candidate.saleDate))}</td>
                <td>${escapeHtml(moneyLabel(review.candidate.salePrice))}</td>
                <td>${review.score.totalScore}</td>
                <td>${renderBadge(review.adjustmentBurden, "burden")}</td>
                <td>${escapeHtml(mainStrength(review))}</td>
                <td>${escapeHtml(mainCaution(review))}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderSearchReality(ranked, searchStats = {}) {
  const eligibleCount = ranked.allCandidates.filter(review => review.eligibility.eligible).length;
  const broaderStats = [
    searchStats.trackerCandidateCount !== undefined ? ["VG3 residential records in tracker", searchStats.trackerCandidateCount] : null,
    searchStats.localPdfCandidateCount !== undefined ? ["Local GWorks PDFs reviewed by script", searchStats.localPdfCandidateCount] : null,
    searchStats.eligibleScriptCandidateCount !== undefined ? ["Eligible script-ranked candidates", searchStats.eligibleScriptCandidateCount] : null
  ].filter(Boolean);

  return `
    <section class="comp-search-reality">
      <div>
        <p class="guided-kicker">Search Reality</p>
        <h3>Best available candidates, not identical properties</h3>
        <p>
          The cards above are the records currently loaded into this experiment. The broader helper script can screen a much larger VG3 residential pool,
          but only local PDFs with sale and structure data can be scored today.
        </p>
      </div>
      <dl>
        <div><dt>Experiment records reviewed</dt><dd>${ranked.allCandidates.length}</dd></div>
        <div><dt>Eligible loaded records</dt><dd>${eligibleCount}</dd></div>
        <div><dt>Manual selected comps</dt><dd>${ranked.selectedCandidates.length}</dd></div>
        ${broaderStats.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${Number(value).toLocaleString("en-US")}</dd></div>`).join("")}
      </dl>
    </section>
  `;
}

function renderDynamicNarrative(subject, reviews) {
  const selected = reviews.map(review => review.candidate);
  const shared = [];
  if (selected.every(candidate => candidate.taxDistrict === subject.taxDistrict)) shared.push("tax district");
  if (selected.every(candidate => candidate.schoolDistrict === subject.schoolDistrict)) shared.push("school district");
  if (selected.every(candidate => normalized(candidate.propertyClass) === normalized(subject.propertyClass))) shared.push("residential classification");
  if (selected.every(candidate => normalized(candidate.location) === normalized(subject.location))) shared.push("urban location");
  if (selected.every(candidate => normalized(candidate.structure?.style) === normalized(subject.structure?.style))) shared.push("one-story design");

  return `
    <section class="comp-tells-us">
      <p class="guided-kicker">What This Tells Us</p>
      <h3>Useful context, with remaining judgment calls</h3>
      <p>
        This review found nearby sold properties sharing ${shared.length ? escapeHtml(shared.join(", ")) : "several available public record characteristics"} with the subject.
        None is a perfect match. The purpose of the comparison is to identify which sales appear most comparable and where meaningful differences remain.
      </p>
    </section>
  `;
}

function renderCompactReviewCard(review) {
  const summary = review.checklist.summary;

  return `
    <article class="comp-compact-review-card">
      <div class="comp-review-summary-head">
        <div>
          <p class="neighbor-comp-label">${escapeHtml(review.candidate.roleLabel || "Comparable")}</p>
          <h3>${escapeHtml(review.candidate.address)}</h3>
        </div>
        ${renderBadge(review.adjustmentBurden, "burden")}
      </div>
      <div class="comp-review-card-lists">
        <div>
          <h4>Why included</h4>
          ${renderMiniList(review.reasons, "Included for review context.")}
        </div>
        <div>
          <h4>Main cautions</h4>
          ${renderMiniList(review.cautions, "No major caution flagged from available data.")}
        </div>
      </div>
      <dl class="comp-compact-counts">
        <div><dt>Superior</dt><dd>${summary.superiorCount}</dd></div>
        <div><dt>Similar</dt><dd>${summary.similarCount}</dd></div>
        <div><dt>Inferior</dt><dd>${summary.inferiorCount}</dd></div>
        <div><dt>Caution</dt><dd>${summary.cautionCount}</dd></div>
      </dl>
    </article>
  `;
}

function renderAlternates(reviews) {
  if (!reviews.length) return "";

  return `
    <div class="comp-review-alternates">
      <p class="neighbor-comp-label">Next Ranked Candidates</p>
      ${reviews.map(review => `
        <article>
          <strong>${escapeHtml(review.candidate.address)}</strong>
          <span>${review.score.totalScore} score · ${escapeHtml(textLabel(review.candidate.saleDate))} · ${escapeHtml(moneyLabel(review.candidate.salePrice))}</span>
        </article>
      `).join("")}
    </div>
  `;
}

function renderRefinedComparableCandidateReview(subject, candidates, options = {}) {
  const ranked = rankComparableCandidates(subject, candidates);

  return `
    <section class="comp-review-section review-card" aria-labelledby="candidateReviewTitle">
      <div class="comp-review-header">
        <div>
          <p class="guided-kicker">Comparable Candidate Review</p>
          <h2 id="candidateReviewTitle">Candidate scoring and review helper</h2>
        </div>
        <p>
          This experimental score does not determine market value. It only helps identify which sold properties
          appear most similar to the subject based on available public record characteristics. A real comparable
          sales analysis still requires judgment, verification, and adjustment.
        </p>
      </div>
      ${renderMethodologyNote()}
      ${renderRankingSummary(ranked.selectedCandidates)}
      ${renderSearchReality(ranked, options.searchStats)}
      ${renderDynamicNarrative(subject, ranked.selectedCandidates)}
      <section class="comp-review-card-section">
        <div class="comp-review-subhead">
          <p class="guided-kicker">Comparable Review Cards</p>
          <h3>Why each selected candidate is useful</h3>
        </div>
        <div class="comp-compact-review-grid">
          ${ranked.selectedCandidates.map(renderCompactReviewCard).join("")}
        </div>
      </section>
      ${renderAlternates(ranked.alternates)}
      <section class="comp-review-card-section">
        <div class="comp-review-subhead">
          <p class="guided-kicker">Detailed Checklist</p>
          <h3>Open a comparable to inspect attribute-by-attribute ratings</h3>
        </div>
        <div class="comp-review-checklist-stack">
          ${ranked.selectedCandidates.map(renderChecklist).join("")}
        </div>
      </section>
    </section>
  `;
}

export function renderComparableCandidateReview(subject, candidates, options = {}) {
  if (!subject || !candidates?.length) return "";
  if (options.refined) return renderRefinedComparableCandidateReview(subject, candidates, options);

  const ranked = rankComparableCandidates(subject, candidates);

  return `
    <section class="comp-review-section review-card" aria-labelledby="candidateReviewTitle">
      <div class="comp-review-header">
        <div>
          <p class="guided-kicker">Comparable Candidate Review</p>
          <h2 id="candidateReviewTitle">Candidate scoring and attribute checklist</h2>
        </div>
        <p>
          This experimental score does not determine market value. It only helps identify which sold properties
          appear most similar to the subject based on available public record characteristics. A real comparable
          sales analysis still requires judgment, verification, and adjustment.
        </p>
      </div>
      <div class="comp-review-summary-grid">
        ${ranked.selectedCandidates.map(renderCandidateSummary).join("")}
      </div>
      ${renderAlternates(ranked.alternates)}
      <div class="comp-review-checklist-stack">
        ${ranked.selectedCandidates.map(renderChecklist).join("")}
      </div>
    </section>
  `;
}
