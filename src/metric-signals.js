const KNOWN_TONES = new Set([
  "strongGreen",
  "green",
  "yellowGreen",
  "yellow",
  "orange",
  "red",
  "neutral"
]);

const AGRICULTURAL_CONTEXT_TERMS = [
  "agricultural",
  "agriculture",
  "horticultural",
  "farm",
  "greenbelt",
  "special valuation"
];

const RESIDENTIAL_CONTEXT_TERMS = [
  "residential",
  "single family",
  "residential improved"
];

const COMMERCIAL_CONTEXT_TERMS = [
  "commercial",
  "income-producing",
  "industrial",
  "apartments"
];

const OUTSIDE_BAND_ALARM_DISTANCE_POINTS = 1.2;

function numericValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeText(value) {
  if (Array.isArray(value)) return value.map(normalizeText).join(" ");
  if (value === true) return "true";
  if (value === false || value === null || value === undefined) return "";
  return String(value).toLowerCase();
}

function contextText(context = {}) {
  return [
    context.propertyClass,
    context.assessmentClass,
    context.valuationGroup,
    context.marketAreaType,
    context.jurisdictionType,
    context.ruralUrbanContext
  ].map(normalizeText).join(" ");
}

function textIncludesAny(text, terms) {
  return terms.some(term => text.includes(term));
}

function standardText(standard = {}) {
  return [
    standard.key,
    standard.label,
    standard.propertyClass,
    standard.subtypes,
    standard.jurisdictionProfile,
    standard.propertyClasses,
    standard.assessmentClasses
  ].map(normalizeText).join(" ");
}

function isAgriculturalContext(context = {}) {
  return Boolean(context.specialValuation || context.greenbelt)
    || textIncludesAny(contextText(context), AGRICULTURAL_CONTEXT_TERMS);
}

function isResidentialContext(context = {}) {
  return textIncludesAny(contextText(context), RESIDENTIAL_CONTEXT_TERMS);
}

function isCommercialContext(context = {}) {
  return textIncludesAny(contextText(context), COMMERCIAL_CONTEXT_TERMS);
}

function findAssessmentLevelStandard(standards, context = {}) {
  const entries = standards?.assessmentLevelStandards ?? [];
  if (!entries.length) return null;

  if (isAgriculturalContext(context)) {
    return entries.find(standard => textIncludesAny(standardText(standard), AGRICULTURAL_CONTEXT_TERMS)) ?? null;
  }

  if (isResidentialContext(context)) {
    return entries.find(standard => textIncludesAny(standardText(standard), RESIDENTIAL_CONTEXT_TERMS)) ?? null;
  }

  if (isCommercialContext(context)) {
    return entries.find(standard => textIncludesAny(standardText(standard), COMMERCIAL_CONTEXT_TERMS)) ?? null;
  }

  return null;
}

function findCodStandard(standards, context = {}) {
  const entries = standards?.codStandards ?? [];
  if (!entries.length) return null;

  const text = contextText(context);
  const classCandidates = isResidentialContext(context)
    ? entries.filter(standard => normalizeText(standard.propertyClass).includes("residential improved"))
    : isCommercialContext(context)
      ? entries.filter(standard => normalizeText(standard.propertyClass).includes("income-producing"))
      : isAgriculturalContext(context)
        ? entries.filter(standard => textIncludesAny(standardText(standard), AGRICULTURAL_CONTEXT_TERMS))
        : entries;
  const candidates = classCandidates.length ? classCandidates : entries;

  if (textIncludesAny(text, ["rural", "small", "mixed", "depressed"])) {
    return candidates.find(standard => normalizeText(standard.key).includes("rural"))
      ?? candidates.find(standard => normalizeText(standard.density).includes("rural"))
      ?? candidates[0];
  }

  if (textIncludesAny(text, ["less active", "mid-sized", "mid sized"])) {
    return candidates.find(standard => normalizeText(standard.key).includes("mid-sized"))
      ?? candidates.find(standard => normalizeText(standard.marketType).includes("less active"))
      ?? candidates[0];
  }

  if (textIncludesAny(text, ["very large", "dense", "active"])) {
    return candidates.find(standard => normalizeText(standard.key).includes("very-large"))
      ?? candidates.find(standard => normalizeText(standard.marketType).includes("active"))
      ?? candidates[0];
  }

  return candidates.find(standard => normalizeText(standard.key).includes("rural"))
    ?? candidates.find(standard => normalizeText(standard.key).includes("mid-sized"))
    ?? candidates[0];
}

function formatRange(range, digits = 0) {
  if (!range) return "standard range";
  return `${Number(range.min).toFixed(digits)}-${Number(range.max).toFixed(digits)}`;
}

function signalResult({
  tone = "neutral",
  severity = "context",
  label = "Context only",
  explanation = "No applicable standard was available for this metric.",
  trigger = "no applicable standard",
  normalizedValue = null,
  standardUsed = "No applicable standard"
}) {
  const safeTone = KNOWN_TONES.has(tone) ? tone : "neutral";

  return {
    tone: safeTone,
    severity: safeTone === "red" ? "alarm" : severity,
    label,
    explanation,
    trigger,
    normalizedValue,
    standardUsed
  };
}

function outsideBandTone(distancePoints) {
  return distancePoints >= OUTSIDE_BAND_ALARM_DISTANCE_POINTS ? "red" : "orange";
}

function thresholdMatches(threshold, value, share) {
  return (threshold.min === undefined || value >= threshold.min)
    && (threshold.max === undefined || value <= threshold.max)
    && (threshold.minShare === undefined || share === null || share >= threshold.minShare);
}

function sampleSizeSignal({ value, comparisonValue, standards }) {
  const normalizedValue = numericValue(value);
  const comparison = numericValue(comparisonValue);
  const guidance = standards?.sampleSizeGuidance?.qualifiedSales;

  if (normalizedValue === null || !guidance?.thresholds?.length) {
    return signalResult({ normalizedValue });
  }

  const share = comparison && comparison > 0 ? normalizedValue / comparison : null;
  const threshold = guidance.thresholds.find(item => thresholdMatches(item, normalizedValue, share))
    ?? guidance.thresholds.at(-1);

  return signalResult({
    tone: threshold.tone,
    severity: threshold.severity,
    label: threshold.label,
    explanation: threshold.explanation,
    trigger: threshold.trigger,
    normalizedValue,
    standardUsed: guidance.sourceLabel
  });
}

function medianRatioSignal({ value, standards, context }) {
  const normalizedValue = numericValue(value);
  const standard = findAssessmentLevelStandard(standards, context);
  const range = standard?.range;

  if (normalizedValue === null || !range) {
    return signalResult({ normalizedValue });
  }

  const min = Number(range.min);
  const max = Number(range.max);
  const ideal = Number(standard.idealValue ?? (min + max) / 2);
  const standardUsed = standard.sourceLabel ?? `${standard.label} ${formatRange(range)}%`;

  if (normalizedValue < min || normalizedValue > max) {
    const distance = normalizedValue < min ? min - normalizedValue : normalizedValue - max;
    const tone = outsideBandTone(distance);
    return signalResult({
      tone,
      severity: tone === "red" ? "alarm" : "caution",
      label: tone === "red" ? "Outside expected range" : "Just outside range",
      explanation: tone === "red"
        ? "This value is outside the expected range for the applicable property class."
        : "This value is outside the expected range, but close enough to read with context.",
      trigger: tone === "red"
        ? "median ratio outside applicable class range by at least 1.2 points"
        : "median ratio just outside applicable class range",
      normalizedValue,
      standardUsed
    });
  }

  const centerDistance = Math.abs(normalizedValue - ideal) / Math.max(
    1,
    normalizedValue >= ideal ? max - ideal : ideal - min
  );
  const tone = centerDistance <= 0.35
    ? "strongGreen"
    : centerDistance <= 0.75
      ? "green"
      : "yellowGreen";

  return signalResult({
    tone,
    severity: tone === "yellowGreen" ? "context" : "within",
    label: tone === "strongGreen" ? "Near center" : tone === "green" ? "Within expected range" : "Near edge of range",
    explanation: "This median ratio is within the expected range for the applicable property class.",
    trigger: "median ratio inside applicable class range",
    normalizedValue,
    standardUsed
  });
}

function codSignal({ value, standards, context }) {
  const normalizedValue = numericValue(value);
  const standard = findCodStandard(standards, context);
  const range = standard?.codRange;

  if (normalizedValue === null || !range) {
    return signalResult({ normalizedValue });
  }

  const max = Number(range.max);
  const softIdeal = Math.min(10, max);
  const preferredMax = Math.min(15, max);
  const standardUsed = `IAAO COD ${formatRange(range, 1)} for ${standard.jurisdictionProfile}`;

  if (normalizedValue <= softIdeal) {
    return signalResult({
      tone: "strongGreen",
      severity: "within",
      label: "Tight cluster",
      explanation: "Lower COD means the sales ratios are more tightly grouped around the median.",
      trigger: "COD within the strongest part of the selected range",
      normalizedValue,
      standardUsed
    });
  }

  if (normalizedValue <= preferredMax) {
    return signalResult({
      tone: "green",
      severity: "within",
      label: "Within range",
      explanation: "Lower COD means more uniform assessment ratios. This result is within the selected range.",
      trigger: "COD within selected range",
      normalizedValue,
      standardUsed
    });
  }

  if (normalizedValue <= max) {
    return signalResult({
      tone: "yellowGreen",
      severity: "context",
      label: "Useful with context",
      explanation: "Lower COD means more uniform assessment ratios. This result is near the caution area, but still within the selected rural or small-jurisdiction range.",
      trigger: "COD near upper part of selected range",
      normalizedValue,
      standardUsed
    });
  }

  const distance = normalizedValue - max;
  const tone = outsideBandTone(distance);
  return signalResult({
    tone,
    severity: tone === "red" ? "alarm" : "caution",
    label: tone === "red" ? "Outside range" : "Above range",
    explanation: tone === "red"
      ? "This COD is materially above the selected range, which may indicate less uniform assessment ratios."
      : "This COD is above the selected range and should be read with caution.",
    trigger: tone === "red"
      ? "COD above selected range by at least 1.2 points"
      : "COD above selected range",
    normalizedValue,
    standardUsed
  });
}

function normalizePrdValue(value) {
  const normalizedValue = numericValue(value);
  if (normalizedValue === null) return null;
  return normalizedValue <= 2 ? normalizedValue * 100 : normalizedValue;
}

function normalizePrdRange(range) {
  if (!range) return null;
  const min = Number(range.min);
  const max = Number(range.max);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;

  return max <= 2
    ? { min: min * 100, max: max * 100 }
    : { min, max };
}

function prdSignal({ value, standards }) {
  const normalizedValue = normalizePrdValue(value);
  const range = normalizePrdRange(standards?.prdStandards?.acceptableRange);

  if (normalizedValue === null || !range) {
    return signalResult({ normalizedValue });
  }

  const ideal = 100;
  const standardUsed = `IAAO PRD ${formatRange(range, 0)}`;

  if (normalizedValue < range.min || normalizedValue > range.max) {
    const distance = normalizedValue < range.min ? range.min - normalizedValue : normalizedValue - range.max;
    const tone = outsideBandTone(distance);
    return signalResult({
      tone,
      severity: tone === "red" ? "alarm" : "caution",
      label: tone === "red" ? "Outside expected range" : "Just outside range",
      explanation: tone === "red"
        ? "This PRD is outside the expected range by at least 1.2 points."
        : "This PRD is outside the expected range, but close enough to read with context.",
      trigger: tone === "red"
        ? "PRD outside expected range by at least 1.2 points"
        : "PRD just outside expected range",
      normalizedValue,
      standardUsed
    });
  }

  const centerDistance = Math.abs(normalizedValue - ideal) / Math.max(
    1,
    normalizedValue >= ideal ? range.max - ideal : ideal - range.min
  );
  const tone = centerDistance <= 0.35
    ? "strongGreen"
    : centerDistance <= 0.75
      ? "green"
      : "yellowGreen";

  return signalResult({
    tone,
    severity: tone === "yellowGreen" ? "context" : "within",
    label: tone === "yellowGreen" ? "Near upper edge" : "Within expected range",
    explanation: "This PRD is within the expected range. Values above the upper range may suggest regressivity; values below the lower range may suggest progressivity.",
    trigger: "PRD inside expected range",
    normalizedValue,
    standardUsed
  });
}

export function getMetricSignal({
  metricKey,
  value,
  comparisonValue = null,
  standards = {},
  context = {}
}) {
  switch (metricKey) {
    case "qualifiedSales":
      return sampleSizeSignal({ value, comparisonValue, standards, context });
    case "medianRatio":
    case "levelOfValue":
      return medianRatioSignal({ value, standards, context });
    case "cod":
      return codSignal({ value, standards, context });
    case "prd":
      return prdSignal({ value, standards, context });
    default:
      return signalResult({ normalizedValue: numericValue(value) });
  }
}
