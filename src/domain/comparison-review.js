import {
  featureLabel,
  garageSizeFromText,
  garageSizeTotal,
  garageSummary,
  hasFeature,
  moneyLabel,
  numberLabel,
  outbuildingLabel,
  percentLabel,
  ratioMoneyLabel,
  ratioPercentLabel,
  recordDisplayAddress,
  recordValueRow,
  recordValueRowsByYear,
  siteSizeLabel,
  textLabel,
  valueChange
} from "./property-record-facts.js?v=db3aed6";

export {
  moneyLabel,
  numberLabel,
  percentLabel,
  ratioMoneyLabel,
  ratioPercentLabel,
  textLabel,
  valueChange
};

export function comparisonRecordEntry(manifest, id) {
  return manifest.properties?.find(property => property.id === id) ?? null;
}

export function cardComparisonData(recordCard, property, config = {}) {
  const parcel = recordCard.guidedSnapshot?.parcel || {};
  const residential = recordCard.guidedSnapshot?.residential || {};
  const classification = recordCard.guidedSnapshot?.classification || {};
  const current = recordValueRow(recordCard, 2026);
  const prior = recordValueRow(recordCard, 2025);
  const outbuildings = outbuildingLabel(recordCard);
  const decksPorches = featureLabel(recordCard, /deck|porch|prch|knee-wall/i);
  const fireplaces = featureLabel(recordCard, /fireplace/i);
  const pool = config.excludePoolFromComparison
    ? null
    : hasFeature(recordCard, /pool|swimming/i) ? "Swimming pool listed in dwelling data" : null;
  const otherImprovementPattern = config.excludePoolFromComparison
    ? /fireplace|patio|slab|stoop|enclosed/i
    : /fireplace|patio|slab|stoop|enclosed|pool|swimming/i;
  const garage = garageSummary(recordCard, null);
  const garageSqFt = garageSizeTotal(recordCard) || garageSizeFromText(residential.garage1);

  return {
    role: config.role || "comparable",
    roleLabel: config.roleLabel || (config.role === "subject" ? "Subject Property" : "Comparable Sale"),
    address: config.address || recordDisplayAddress(recordCard),
    parcelId: config.parcelId || parcel.parcelId || property?.parcelId || "",
    propertyId: property?.id || config.propertyId || "",
    photoUrl: config.photoUrl || recordCard.guidedSnapshot?.assets?.photo || "",
    taxDistrict: parcel.taxDistrict || property?.taxDistrict || config.taxDistrict || "",
    schoolDistrict: parcel.schoolDistrict || config.schoolDistrict || "",
    propertyClass: classification.propertyClass || parcel.accountType || property?.propertyClass || config.propertyClass || "",
    accountType: parcel.accountType || classification.propertyClass || property?.propertyClass || "",
    location: classification.location || recordCard.locationModel?.marketGroup || property?.marketGroup || config.location || "",
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
    normalizedPricePerSqFtLabel: config.normalizedPricePerSqFtLabel || null,
    assessedValues: recordValueRowsByYear(recordCard),
    buildingSqFt: residential.buildingSize ?? null,
    basementFinishedSqFt: residential.minFinish ?? null,
    garageSize: garageSqFt,
    saleDate: config.saleDate || null,
    salePrice: config.salePrice ?? null,
    structure: {
      buildingSize: residential.buildingSize ?? null,
      yearBuilt: residential.yearBuilt ?? null,
      style: residential.style || null,
      bedrooms: residential.bedrooms ?? null,
      bathrooms: residential.bathrooms ?? null,
      basement: residential.basementSize ?? null,
      garage
    },
    condition: {
      quality: residential.quality || null,
      condition: residential.condition || null,
      exterior: residential.exterior || null,
      remodelNotes: config.remodelNotes || null
    },
    site: {
      landValue: current?.land ?? null,
      lotLegal: siteSizeLabel(recordCard),
      locationFactors: config.locationFactors || null
    },
    improvements: {
      outbuildings,
      decksPorches,
      other: featureLabel(recordCard, otherImprovementPattern)
    },
    outbuildings,
    porchesDecks: decksPorches,
    fireplaces,
    pool: config.excludePoolFromComparison ? null : config.pool || pool,
    notes: config.notes || "",
    context: {
      valuationGroup: recordCard.locationModel?.valuationGroup || property?.valuationGroupLabel || config.valuationGroup || null,
      taxDistrict: parcel.taxDistrict || property?.taxDistrict || config.taxDistrict || null,
      marketArea: property?.marketArea || config.marketArea || null,
      reasonIncluded: config.reasonIncluded || null,
      reviewCaution: config.reviewCaution || null
    }
  };
}

export function placeholderComparisonData(config = {}) {
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
    normalizedPricePerSqFtLabel: config.normalizedPricePerSqFtLabel || null,
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

export function tableRowGroups(models) {
  const subjectIndex = models.findIndex(model => model.role === "subject");

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
    rows: group.rows.map(([label, getter]) => {
      const values = models.map(getter);
      return {
        label,
        values,
        bestMatchIndexes: bestMatchIndexes(values, models, subjectIndex, label)
      };
    })
  }));
}

export function tableMatchCounts(groups, modelCount) {
  const matchCounts = Array.from({ length: modelCount }, () => 0);
  groups.forEach(group => {
    group.rows.forEach(row => {
      row.bestMatchIndexes.forEach(index => {
        matchCounts[index] += 1;
      });
    });
  });
  return matchCounts;
}

function normalizedComparisonText(value) {
  return `${value ?? ""}`
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function comparisonNumbers(value) {
  const text = `${value ?? ""}`;
  if (/not listed|pending/i.test(text)) return [];
  return Array.from(text.matchAll(/-?\$?[\d,]+(?:\.\d+)?%?/g))
    .map(match => Number(match[0].replace(/[$,%]/g, "")))
    .filter(Number.isFinite);
}

function textDistance(subjectValue, candidateValue) {
  const subject = normalizedComparisonText(subjectValue);
  const candidate = normalizedComparisonText(candidateValue);
  if (!subject || !candidate || /not listed|pending/.test(subject) || /not listed|pending/.test(candidate)) return Infinity;
  if (subject === candidate) return 0;

  const subjectTokens = new Set(subject.split(/[^a-z0-9]+/).filter(token => token.length > 2));
  const candidateTokens = new Set(candidate.split(/[^a-z0-9]+/).filter(token => token.length > 2));
  if (!subjectTokens.size || !candidateTokens.size) return Infinity;

  const shared = Array.from(subjectTokens).filter(token => candidateTokens.has(token)).length;
  const union = new Set([...subjectTokens, ...candidateTokens]).size;
  return union ? 1 - shared / union : Infinity;
}

function valueDistance(subjectValue, candidateValue) {
  const subjectNumbers = comparisonNumbers(subjectValue);
  const candidateNumbers = comparisonNumbers(candidateValue);
  if (subjectNumbers.length && candidateNumbers.length) {
    const length = Math.min(subjectNumbers.length, candidateNumbers.length);
    const total = subjectNumbers.slice(0, length).reduce((sum, subjectNumber, index) => {
      const candidateNumber = candidateNumbers[index];
      const scale = Math.max(Math.abs(subjectNumber), Math.abs(candidateNumber), 1);
      return sum + Math.abs(subjectNumber - candidateNumber) / scale;
    }, 0);
    return total / length;
  }

  return textDistance(subjectValue, candidateValue);
}

function bestMatchIndexes(values, models, subjectIndex, label) {
  if (subjectIndex === -1) return [];
  if (/reason included|review caution/i.test(label)) return [];

  const subjectValue = values[subjectIndex];
  const scored = values.map((value, index) => {
    if (index === subjectIndex || models[index].role === "subject") return null;
    return {
      index,
      distance: valueDistance(subjectValue, value)
    };
  }).filter(item => item && Number.isFinite(item.distance));

  if (!scored.length) return [];

  const best = Math.min(...scored.map(item => item.distance));
  if (!Number.isFinite(best)) return [];

  return scored
    .filter(item => Math.abs(item.distance - best) < 0.000001)
    .map(item => item.index);
}

export function assessmentAtSale(model) {
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

export function saleRatioDisplayLabel(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Not listed";
  return `${(value * 100).toFixed(0)}%`;
}
