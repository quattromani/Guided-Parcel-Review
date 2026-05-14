const CLASS_ALIASES = {
  agFarm: "agricultural",
  agriculture: "agricultural",
  agricultural: "agricultural",
  commercial: "commercial",
  residential: "residential"
};

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function firstNumberToken(value) {
  return `${value ?? ""}`.match(/\d+/)?.[0] ?? null;
}

export function normalizeMarketClassKey(value) {
  const raw = normalizeText(value);
  if (CLASS_ALIASES[raw]) return CLASS_ALIASES[raw];
  if (raw.includes("ag") || raw.includes("farm") || raw.includes("hort")) return "agricultural";
  if (raw.includes("comm") || raw.includes("industrial")) return "commercial";
  if (raw.includes("res")) return "residential";

  return "residential";
}

export function getParcelMarketClass(data = {}) {
  return normalizeMarketClassKey(
    data.classification?.propertyClass
      ?? data.parcel?.accountType
      ?? data.snapshotModel?.viewModels?.property?.propertyClass
  );
}

export function getClassMarketStats(marketPositionData, parcelClass = "residential") {
  const classKey = normalizeMarketClassKey(parcelClass);
  const classStats = marketPositionData?.classes?.[classKey];

  if (!classStats) return null;

  return {
    ...classStats,
    classKey,
    classLabel: marketPositionData?.standardsContext?.[classKey]?.classLabel ?? classKey,
    source: marketPositionData?.source,
    standardsContext: marketPositionData?.standardsContext?.[classKey],
    standardsReferences: marketPositionData?.standardsReferences
  };
}

export function getParcelMarketGroupId(recordCard, classKey = "residential") {
  if (classKey === "agricultural") {
    return firstNumberToken(
      recordCard?.locationModel?.marketArea
        ?? recordCard?.locationModel?.agMarketArea
        ?? recordCard?.locationModel?.countyArea
    );
  }

  return firstNumberToken(recordCard?.locationModel?.valuationGroup);
}

export function getSelectedMarketGroup(recordCard, classStats, selectedGroupId = null) {
  const groupId = selectedGroupId ?? getParcelMarketGroupId(recordCard, classStats?.classKey);
  const groups = classStats?.groups ?? [];

  return groups.find(group => String(group.id) === String(groupId)) ?? groups[0] ?? null;
}

export function getMarketScatterPoints(classStats) {
  return (classStats?.groups ?? [])
    .filter(group => Number.isFinite(Number(group.median)) && Number.isFinite(Number(group.cod)))
    .map(group => ({
      ...group,
      x: Number(group.median),
      y: Number(group.cod)
    }));
}

export function findStandardByKey(standards, key) {
  if (!key) return null;

  const collections = [
    standards?.assessmentLevelStandards,
    standards?.codStandards
  ];

  for (const collection of collections) {
    const match = collection?.find(item => item.key === key);
    if (match) return match;
  }

  return null;
}

export function getMedianRatioRange(classStats, iaaoStandards = {}) {
  const classKey = classStats?.classKey;
  const standardKey = classStats?.standardsReferences?.assessmentLevelStandards?.[classKey];
  const standard = findStandardByKey(iaaoStandards, standardKey);

  return standard?.range ?? classStats?.standardsContext?.medianAcceptableRange ?? null;
}

export function getCodInterpretationRange(classStats, iaaoStandards = {}) {
  const classKey = classStats?.classKey;
  const standardKey = classStats?.standardsReferences?.codStandards?.[classKey];
  const standard = findStandardByKey(iaaoStandards, standardKey);

  return standard?.codRange ?? null;
}

export function getCountywideMarketPoint(classStats) {
  const countywide = classStats?.countywide;
  if (!countywide) return null;

  return {
    ...countywide,
    x: Number(countywide.median),
    y: Number(countywide.cod)
  };
}
