const civicDefault = {
  id: "civic-default",
  label: "Civic default",
  description: "Calm public-information palette for property value, tax, and equalization visuals.",
  colors: {
    primary: "#002D62",
    secondary: "#48657F",
    accent: "#3A7D8C",
    success: "#5F8F72",
    warning: "#A9792B",
    danger: "#9B3D3D"
  },
  neutrals: {
    ink: "#1F3347",
    text: "#475569",
    mutedText: "#667085",
    border: "#e2e8f0",
    gridline: "rgba(100, 116, 139, 0.22)",
    surface: "#ffffff",
    surfaceMuted: "#f8fafc"
  },
  roles: {
    property: "#1F3347",
    propertySoft: "rgba(100, 116, 139, 0.12)",
    value: "#5F8F72",
    valueSoft: "rgba(95, 143, 114, 0.16)",
    valueSurface: "rgb(239 247 242)",
    valueBorder: "rgb(199 222 208)",
    tax: "#9B3D3D",
    taxSoft: "rgba(155, 61, 61, 0.14)",
    taxSurface: "rgb(250 240 240)",
    taxBorder: "rgb(226 196 196)",
    rate: "#48657F",
    rateSoft: "rgba(72, 101, 127, 0.14)",
    rateSurface: "rgb(238 243 247)",
    rateBorder: "rgb(190 205 218)",
    pending: "#DDE8F4",
    pendingText: "#24496F",
    market: "#3A7D8C",
    marketSoft: "rgba(58, 125, 140, 0.16)",
    comparison: "#667085",
    comparisonSoft: "rgba(100, 116, 139, 0.12)",
    attention: "#A9792B",
    attentionSoft: "rgba(169, 121, 43, 0.16)",
    outlier: "#9B3D3D",
    outlierSoft: "rgba(155, 61, 61, 0.12)",
    standardBand: "rgba(95, 143, 114, 0.18)",
    standardBandBorder: "rgba(95, 143, 114, 0.46)"
  },
  districtGroups: {
    School: "#A9792B",
    City: "#1F3347",
    County: "#5F8F72",
    "Natural resources": "#3A7D8C",
    "Education service": "#667085",
    "Community college": "#3A7D8C",
    "Fire district": "#9B3D3D",
    Township: "#475569",
    Agriculture: "#6F9F66",
    Historical: "#94a3b8",
    Other: "#94a3b8"
  },
  sequences: {
    categorical: ["#5F8F72", "#48657F", "#3A7D8C", "#A9792B", "#667085", "#9B3D3D"],
    blueScale: ["#dbe7f3", "#9eb3c6", "#48657F"],
    countyHierarchy: {
      subject: "#48657F",
      county: "#5F8F72",
      state: "#667085"
    }
  }
};

export const VISUALIZATION_PALETTES = {
  [civicDefault.id]: civicDefault
};

export const DEFAULT_VISUALIZATION_PALETTE_ID = civicDefault.id;

export function getVisualizationPalette(id = DEFAULT_VISUALIZATION_PALETTE_ID) {
  return VISUALIZATION_PALETTES[id] ?? VISUALIZATION_PALETTES[DEFAULT_VISUALIZATION_PALETTE_ID];
}

export const visualizationTheme = getVisualizationPalette();

export const chartColors = {
  contextValue: visualizationTheme.roles.value,
  contextTax: visualizationTheme.roles.tax,
  propertyValue: visualizationTheme.roles.property,
  propertyTax: visualizationTheme.roles.taxSoft,
  propertyRate: visualizationTheme.roles.rate,
  cod: visualizationTheme.colors.secondary,
  prd: visualizationTheme.colors.danger,
  cov: "#73a35b",
  standardBand: visualizationTheme.roles.standardBand,
  standardBandBorder: visualizationTheme.roles.standardBandBorder
};

export const semanticChartColors = {
  value: visualizationTheme.roles.value,
  valueBg: visualizationTheme.roles.valueSoft,
  valueSoft: visualizationTheme.roles.valueSurface,
  valueRing: visualizationTheme.roles.valueBorder,
  tax: visualizationTheme.roles.tax,
  taxBg: visualizationTheme.roles.taxSoft,
  taxSoft: visualizationTheme.roles.taxSurface,
  taxRing: visualizationTheme.roles.taxBorder,
  etr: visualizationTheme.roles.rate,
  etrBg: visualizationTheme.roles.rateSoft,
  etrSoft: visualizationTheme.roles.rateSurface,
  etrRing: visualizationTheme.roles.rateBorder
};

export function applyVisualizationPalette(palette = visualizationTheme) {
  const root = document.documentElement;

  Object.entries({
    "--viz-primary": palette.colors.primary,
    "--viz-secondary": palette.colors.secondary,
    "--viz-accent": palette.colors.accent,
    "--viz-success": palette.colors.success,
    "--viz-warning": palette.colors.warning,
    "--viz-danger": palette.colors.danger,
    "--viz-ink": palette.neutrals.ink,
    "--viz-text": palette.neutrals.text,
    "--viz-muted-text": palette.neutrals.mutedText,
    "--viz-border": palette.neutrals.border,
    "--viz-surface-muted": palette.neutrals.surfaceMuted
  }).forEach(([name, value]) => root.style.setProperty(name, value));
}
