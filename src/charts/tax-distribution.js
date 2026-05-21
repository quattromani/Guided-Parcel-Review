import { latestTaxDistributionRows } from "../calculations/tax.js";
import { moneyCents, percent } from "../format.js";
import { visualizationTheme } from "../config/visualization-palettes.js";
import { renderGroupedTreemap } from "./treemap.js";

const levyGroupColors = visualizationTheme.districtGroups;

function hasDataValue(value) {
  return value !== null && value !== undefined;
}

function hexToRgbChannel(hex) {
  const normalized = `${hex}`.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16)
  ].join(" ");
}

function colorAlpha(hex, alpha) {
  const channel = hexToRgbChannel(hex);
  return channel ? `rgb(${channel} / ${alpha})` : hex;
}

function normalizeSchoolToken(value = "") {
  return `${value}`
    .toUpperCase()
    .replace(/PUBLIC SCHOOLS?|SCHOOL DISTRICT|DISTRICT|SCHOOLS?/g, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function schoolDistrictTokens(district = {}) {
  return [
    district.name,
    ...(district.aliases || []),
    ...(district.district_codes || [])
  ].map(normalizeSchoolToken).filter(Boolean);
}

function getSchoolLevyDescription(data) {
  return data.latestFinalLevyComponents?.find(row => row.group === "School")?.description ?? "";
}

function levyGroupLabel(label) {
  if (label === "Fire") return "Fire district";
  return label || "Other";
}

function findSchoolDistrictColor(data, schoolDistrictColors) {
  const districts = schoolDistrictColors?.districts || [];
  if (!districts.length) return null;

  const propertyTokens = [
    data.parcel?.schoolDistrict,
    getSchoolLevyDescription(data)
  ].map(normalizeSchoolToken).filter(Boolean);

  return districts.find(district => {
    const tokens = schoolDistrictTokens(district);
    return propertyTokens.some(propertyToken => tokens.some(token => (
      token === propertyToken || propertyToken.includes(token) || token.includes(propertyToken)
    )));
  }) ?? null;
}

function levyColorForGroup(label, schoolColor) {
  const groupLabel = levyGroupLabel(label);

  return groupLabel === "School" && schoolColor
    ? schoolColor
    : levyGroupColors[groupLabel] ?? levyGroupColors.Other;
}

function levyTreemapLabel(group, label) {
  const groupLabel = levyGroupLabel(group);
  if (groupLabel === "Natural resources") return "NRD";
  if (groupLabel === "Community college") return "CC";
  if (groupLabel === "Education service") return "ESU";
  return label;
}

function levyTreemapGroupLabel(group) {
  return levyTreemapLabel(group, levyGroupLabel(group));
}

export function buildDistributionChart(data, schoolDistrictColors, recordCard) {
  const rows = latestTaxDistributionRows(data, recordCard)
    .filter(row => hasDataValue(row.amount) && row.amount > 0);
  const schoolDistrictColor = findSchoolDistrictColor(data, schoolDistrictColors)?.map_color;
  const items = rows
    .map((row, index) => {
      const group = levyGroupLabel(row.group);

      return {
        id: `${group}-${index}`,
        group,
        groupLabel: levyTreemapGroupLabel(group),
        label: levyTreemapLabel(group, row.description || row.authority || group),
        value: row.amount,
        amount: row.amount,
        color: levyColorForGroup(group, schoolDistrictColor)
      };
    })
    .sort((a, b) => b.value - a.value);

  renderGroupedTreemap({
    container: document.getElementById("distributionTreemap"),
    controls: document.getElementById("distributionTreemapControls"),
    items,
    colorAlpha,
    formatAmount: value => hasDataValue(value) ? moneyCents.format(value) : "",
    formatShare: value => percent.format(value),
    ariaLabel: "Latest tax bill distribution chart",
    layout: "priority-stack"
  });
}
