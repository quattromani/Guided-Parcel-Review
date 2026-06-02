import { formatNullableMoney } from "../format.js";
import { displayAddress } from "../utils/address.js";
import { escapeHtml } from "../utils/html.js";
import { renderComparableCandidateReview } from "./comparable-candidate-review.js";

async function loadJson(path, label) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Unable to load ${label}: ${response.status}`);
  }

  return response.json();
}

function recordEntry(manifest, id) {
  return manifest.properties?.find(property => property.id === id) ?? null;
}

function valueRow(card, year) {
  return card?.guidedSnapshot?.assessedValueBreakdown?.find(row => row.year === year) ?? null;
}

function valueChange(values = {}) {
  const current = values.assessed2026;
  const prior = values.assessed2025;

  if (!current || !prior) return null;

  return {
    dollars: current - prior,
    percent: (current - prior) / prior
  };
}

function percentLabel(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Not listed";

  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(2)}%`;
}

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

function ratioMoneyLabel(numerator, denominator) {
  if (!numerator || !denominator) return "Not listed";
  return moneyLabel(Math.round(numerator / denominator));
}

function ratioPercentLabel(numerator, denominator) {
  if (!numerator || !denominator) return "Not listed";
  return percentLabel(numerator / denominator);
}

function outbuildingLabel(card) {
  const rows = card?.guidedSnapshot?.outbuildingData || [];
  if (!rows.length) return "None listed";

  return rows.map(row => {
    const size = row.units ? `${Number(row.units).toLocaleString("en-US")} sq. ft.` : "";
    const cost = row.cost ? ` (${moneyLabel(row.cost)})` : "";
    return [row.description, size].filter(Boolean).join(", ") + cost;
  }).join("; ");
}

function featureLabel(card, pattern) {
  const rows = card?.guidedSnapshot?.dwellingData || [];
  const matches = rows.filter(row => pattern.test(`${row.description || ""}`));

  if (!matches.length) return "None listed";

  return matches.map(row => {
    const units = row.units ? `${Number(row.units).toLocaleString("en-US")} sq. ft.` : "";
    const value = row.value ? ` (${moneyLabel(row.value)})` : "";
    return [row.description, units].filter(Boolean).join(", ") + value;
  }).join("; ");
}

function hasFeature(card, pattern) {
  return (card?.guidedSnapshot?.dwellingData || []).some(row => pattern.test(`${row.description || ""}`));
}

function siteSizeLabel(card) {
  const classification = card?.guidedSnapshot?.classification || {};
  const parcel = card?.guidedSnapshot?.parcel || {};
  const parts = [
    classification.lotSize,
    parcel.legalDescription ? parcel.legalDescription.replace(/^0\s+\d+\s+\d+\s+/i, "") : null
  ].filter(Boolean);

  return parts.join(" · ") || "Not listed";
}

function garageSize(value) {
  return Number(`${value || ""}`.match(/([\d,]+)\s*sq\.?\s*ft/i)?.[1]?.replace(/,/g, "")) || null;
}

function fireplaceLabel(card) {
  return featureLabel(card, /fireplace/i);
}

function propertyUrl(id) {
  const url = new URL(window.location.href);
  url.searchParams.delete("experiment");
  url.searchParams.set("property", id);
  url.searchParams.set("view", "property");
  url.hash = "property-record";
  return `${url.pathname}${url.search}${url.hash}`;
}

function cardComparisonData(card, property, config = {}) {
  const parcel = card.guidedSnapshot?.parcel || {};
  const residential = card.guidedSnapshot?.residential || {};
  const classification = card.guidedSnapshot?.classification || {};
  const current = valueRow(card, 2026);
  const prior = valueRow(card, 2025);
  const outbuildings = outbuildingLabel(card);
  const decksPorches = featureLabel(card, /deck|porch|prch|knee-wall/i);
  const fireplaces = fireplaceLabel(card);
  const pool = hasFeature(card, /pool|swimming/i) ? "Swimming pool listed in dwelling data" : null;

  return {
    role: config.role || "comparable",
    roleLabel: config.roleLabel || (config.role === "subject" ? "Subject Property" : "Comparable Sale"),
    address: config.address || displayAddress(parcel.situsAddress),
    parcelId: config.parcelId || parcel.parcelId || property?.parcelId || "",
    propertyId: property?.id || config.propertyId || "",
    photoUrl: config.photoUrl || card.guidedSnapshot?.assets?.photo || "",
    taxDistrict: parcel.taxDistrict || property?.taxDistrict || config.taxDistrict || "",
    schoolDistrict: parcel.schoolDistrict || config.schoolDistrict || "",
    propertyClass: classification.propertyClass || parcel.accountType || property?.propertyClass || config.propertyClass || "",
    accountType: parcel.accountType || classification.propertyClass || property?.propertyClass || "",
    location: classification.location || card.locationModel?.marketGroup || property?.marketGroup || config.location || "",
    zoning: classification.zoning || config.zoning || "",
    lotSizeClass: classification.lotSize || config.lotSizeClass || "",
    landDescription: parcel.legalDescription || config.landDescription || "",
    values: {
      assessed2026: current?.total ?? null,
      assessed2025: prior?.total ?? null,
      landValue: current?.land ?? null,
      buildingValue: current?.dwelling ?? null,
      otherValue: current?.outbuilding ?? null
    },
    assessedValues: Object.fromEntries((card.guidedSnapshot?.assessedValueBreakdown || []).map(row => [row.year, row])),
    buildingSqFt: residential.buildingSize ?? null,
    basementFinishedSqFt: residential.minFinish ?? null,
    garageSize: garageSize(residential.garage1),
    saleDate: config.saleDate || null,
    salePrice: config.salePrice ?? null,
    structure: {
      buildingSize: residential.buildingSize ?? null,
      yearBuilt: residential.yearBuilt ?? null,
      style: residential.style || null,
      bedrooms: residential.bedrooms ?? null,
      bathrooms: residential.bathrooms ?? null,
      basement: residential.basementSize ?? null,
      garage: residential.garage1 || null
    },
    condition: {
      quality: residential.quality || null,
      condition: residential.condition || null,
      exterior: residential.exterior || null,
      remodelNotes: config.remodelNotes || null
    },
    site: {
      landValue: current?.land ?? null,
      lotLegal: siteSizeLabel(card),
      locationFactors: config.locationFactors || null
    },
    improvements: {
      outbuildings,
      decksPorches,
      other: featureLabel(card, /fireplace|patio|slab|stoop|enclosed|pool|swimming/i)
    },
    outbuildings,
    porchesDecks: decksPorches,
    fireplaces,
    pool: config.pool || pool,
    notes: config.notes || "",
    context: {
      valuationGroup: property?.valuationGroupLabel || config.valuationGroup || null,
      taxDistrict: parcel.taxDistrict || property?.taxDistrict || config.taxDistrict || null,
      marketArea: property?.marketArea || config.marketArea || null,
      reasonIncluded: config.reasonIncluded || null,
      reviewCaution: config.reviewCaution || null
    }
  };
}

function placeholderComparisonData(config = {}) {
  return {
    role: "comparable",
    roleLabel: config.roleLabel || "Comparable Sale",
    address: config.address || "Comparable record pending",
    parcelId: config.parcelId || "",
    propertyId: config.propertyId || "",
    photoUrl: config.photoUrl || "",
    taxDistrict: config.taxDistrict || "",
    schoolDistrict: config.schoolDistrict || "",
    propertyClass: config.propertyClass || "Residential",
    accountType: config.accountType || "Residential",
    location: config.location || "",
    zoning: config.zoning || "",
    lotSizeClass: config.lotSizeClass || "",
    landDescription: config.landDescription || "",
    values: {
      assessed2026: config.values?.assessed2026 ?? null,
      assessed2025: config.values?.assessed2025 ?? null,
      landValue: config.values?.landValue ?? null,
      buildingValue: config.values?.buildingValue ?? null,
      otherValue: config.values?.otherValue ?? null
    },
    assessedValues: config.assessedValues || {},
    buildingSqFt: config.buildingSqFt ?? null,
    basementFinishedSqFt: config.basementFinishedSqFt ?? null,
    garageSize: config.garageSize ?? null,
    saleDate: config.saleDate || null,
    salePrice: config.salePrice ?? null,
    structure: {
      buildingSize: config.structure?.buildingSize ?? null,
      yearBuilt: config.structure?.yearBuilt ?? null,
      style: config.structure?.style || null,
      bedrooms: config.structure?.bedrooms ?? null,
      bathrooms: config.structure?.bathrooms ?? null,
      basement: config.structure?.basement ?? null,
      garage: config.structure?.garage || null
    },
    condition: {
      quality: config.condition?.quality || null,
      condition: config.condition?.condition || null,
      exterior: config.condition?.exterior || null,
      remodelNotes: config.condition?.remodelNotes || null
    },
    site: {
      landValue: config.site?.landValue ?? config.values?.landValue ?? null,
      lotLegal: config.site?.lotLegal || null,
      locationFactors: config.site?.locationFactors || null
    },
    improvements: {
      outbuildings: config.improvements?.outbuildings || null,
      decksPorches: config.improvements?.decksPorches || null,
      other: config.improvements?.other || null
    },
    outbuildings: config.improvements?.outbuildings || null,
    porchesDecks: config.improvements?.decksPorches || null,
    fireplaces: config.fireplaces || null,
    pool: config.pool || null,
    notes: config.notes || "",
    context: {
      valuationGroup: config.context?.valuationGroup || null,
      taxDistrict: config.context?.taxDistrict || null,
      marketArea: config.context?.marketArea || null,
      reasonIncluded: config.context?.reasonIncluded || "Comparable record slot reserved for manually selected GWorks record.",
      reviewCaution: config.context?.reviewCaution || "Pending source record. Do not treat as a completed comparable sale."
    }
  };
}

function tableRowGroups(models) {
  return [
    {
      group: "Value",
      rows: [
        ["2026 assessed value", model => moneyLabel(model.values.assessed2026)],
        ["2025 assessed value", model => moneyLabel(model.values.assessed2025)],
        ["2026 change", model => {
          const change = valueChange(model.values);
          return change ? `${moneyLabel(change.dollars)} · ${percentLabel(change.percent)}` : "Not listed";
        }],
        ["Land / building / other", model => `${moneyLabel(model.values.landValue)} / ${moneyLabel(model.values.buildingValue)} / ${moneyLabel(model.values.otherValue)}`],
        ["Assessed value per building sq. ft.", model => ratioMoneyLabel(model.values.assessed2026, model.buildingSqFt)],
        ["Sale date", model => textLabel(model.saleDate)],
        ["Sale price", model => moneyLabel(model.salePrice)],
        ["Sale price per building sq. ft.", model => ratioMoneyLabel(model.salePrice, model.buildingSqFt)],
        ["2026 assessment-to-sale reference", model => ratioPercentLabel(model.values.assessed2026, model.salePrice)]
      ]
    },
    {
      group: "Structure",
      rows: [
        ["Building size", model => numberLabel(model.structure.buildingSize, " sq. ft.")],
        ["Year built", model => numberLabel(model.structure.yearBuilt)],
        ["Style", model => textLabel(model.structure.style)],
        ["Beds / baths", model => `${numberLabel(model.structure.bedrooms)} / ${numberLabel(model.structure.bathrooms)}`],
        ["Basement", model => numberLabel(model.structure.basement, " sq. ft.")],
        ["Garage", model => textLabel(model.structure.garage)]
      ]
    },
    {
      group: "Condition",
      rows: [
        ["Quality / condition", model => [model.condition.quality, model.condition.condition].filter(Boolean).join(" / ") || "Not listed"],
        ["Exterior", model => textLabel(model.condition.exterior)],
        ["Remodel notes", model => textLabel(model.condition.remodelNotes)]
      ]
    },
    {
      group: "Site",
      rows: [
        ["Land value", model => moneyLabel(model.site.landValue)],
        ["Lot size / legal", model => textLabel(model.site.lotLegal)],
        ["Location factors", model => textLabel(model.site.locationFactors)]
      ]
    },
    {
      group: "Improvements",
      rows: [
        ["Outbuildings", model => textLabel(model.improvements.outbuildings)],
        ["Decks / porches", model => textLabel(model.improvements.decksPorches)],
        ["Other improvements", model => textLabel(model.improvements.other)]
      ]
    },
    {
      group: "Context",
      rows: [
        ["Valuation group", model => textLabel(model.context.valuationGroup)],
        ["Tax district", model => textLabel(model.context.taxDistrict)],
        ["Neighborhood / market area", model => textLabel(model.context.marketArea)],
        ["Reason included", model => textLabel(model.context.reasonIncluded)],
        ["Review caution", model => textLabel(model.context.reviewCaution)]
      ]
    }
  ].map(group => ({
    ...group,
    rows: group.rows.map(([label, getter]) => ({
      label,
      values: models.map(getter)
    }))
  }));
}

async function resolveComparisonModel(manifest, item) {
  if (item.recordId) {
    const property = recordEntry(manifest, item.recordId);
    if (!property) throw new Error(`Experiment property not found: ${item.recordId}`);
    const card = await loadJson(property.recordCardPath, `${item.recordId} record card`);
    return cardComparisonData(card, property, item);
  }

  return placeholderComparisonData(item);
}

function renderPropertyCard(model) {
  const isSubject = model.role === "subject";
  const change = valueChange(model.values);
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
            <dt>2026 value</dt>
            <dd>${escapeHtml(moneyLabel(model.values.assessed2026))}</dd>
          </div>
          <div>
            <dt>2025 value</dt>
            <dd>${escapeHtml(moneyLabel(model.values.assessed2025))}</dd>
          </div>
          <div>
            <dt>Movement</dt>
            <dd>${escapeHtml(change ? percentLabel(change.percent) : "Not listed")}</dd>
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
            <dt>Value / sq. ft.</dt>
            <dd>${escapeHtml(ratioMoneyLabel(model.values.assessed2026, model.buildingSqFt))}</dd>
          </div>
        </dl>
      </div>
    </article>
  `;
}

function renderCompTable(models) {
  return `
    <div class="neighbor-comp-table-wrap">
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
          ${tableRowGroups(models).map(group => `
            <tr class="neighbor-comp-group-row">
              <th scope="row" colspan="${models.length + 1}">${escapeHtml(group.group)}</th>
            </tr>
            ${group.rows.map(row => `
              <tr>
                <th scope="row">${escapeHtml(row.label)}</th>
                ${row.values.map((value, index) => `
                  <td${models[index].role === "subject" ? " class=\"neighbor-comp-subject-col\"" : ""}>${escapeHtml(value)}</td>
                `).join("")}
              </tr>
            `).join("")}
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function assessmentAtSale(model) {
  if (!model.saleDate || !model.salePrice) return null;
  const saleYear = Number(`${model.saleDate}`.match(/\b(20\d{2})\b/)?.[1]);
  const assessed = model.assessedValues?.[saleYear]?.total;
  if (!saleYear || !assessed) return null;

  return {
    saleYear,
    assessed,
    ratio: assessed / model.salePrice
  };
}

function saleRatioDisplayLabel(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Not listed";
  return `${(value * 100).toFixed(0)}%`;
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
        <h3>Where the property entered the cycle</h3>
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
          Properties entering a cycle at lower assessment-to-sale ratios may experience larger valuation increases over time as assessments move toward market-supported levels.
        </p>
        <p class="subject-market-note">This reference helps explain starting position. It is not a ratio-study result and does not determine whether the current assessment is accurate.</p>
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

      <section class="neighbor-comp-selected-section" aria-label="${escapeHtml(config.cardSectionLabel || "Comparison property cards")}">
        ${config.cardSectionTitle ? `
          <div class="comp-review-subhead">
            <p class="guided-kicker">${escapeHtml(config.cardSectionKicker || "Selected Comparable Cards")}</p>
            <h3>${escapeHtml(config.cardSectionTitle)}</h3>
          </div>
        ` : ""}
        <div class="${cardGridClass}">
          ${models.map(renderPropertyCard).join("")}
        </div>
      </section>

      ${config.showCandidateReview ? renderComparableCandidateReview(subject, candidateModels, { refined: config.refinedComparableReview, searchStats: config.candidateSearchStats }) : ""}

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
