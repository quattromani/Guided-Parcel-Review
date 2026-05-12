const civicDefault = {
  id: "civic-default",
  label: "Civic default",
  description: "Calm public-information palette for property value, tax, and equalization visuals.",
  colors: {
    primary: "#0D6EFD",
    secondary: "#334155",
    accent: "#00CCCD",
    success: "#198754",
    warning: "#FFC107",
    danger: "#DC3545"
  },
  neutrals: {
    ink: "#334155",
    text: "#475569",
    mutedText: "#64748b",
    border: "#e2e8f0",
    gridline: "rgba(100, 116, 139, 0.22)",
    surface: "#ffffff",
    surfaceMuted: "#f8fafc"
  },
  roles: {
    property: "#334155",
    propertySoft: "rgba(100, 116, 139, 0.12)",
    value: "#198754",
    valueSoft: "rgba(25, 135, 84, 0.16)",
    valueSurface: "rgb(232 246 239)",
    valueBorder: "rgb(194 228 213)",
    tax: "#DC3545",
    taxSoft: "rgba(220, 53, 69, 0.16)",
    taxSurface: "rgb(253 236 238)",
    taxBorder: "rgb(245 194 199)",
    rate: "#0D6EFD",
    rateSoft: "rgba(13, 110, 253, 0.16)",
    rateSurface: "rgb(231 241 255)",
    rateBorder: "rgb(184 213 254)",
    market: "#00CCCD",
    marketSoft: "rgba(0, 204, 205, 0.18)",
    comparison: "#64748b",
    comparisonSoft: "rgba(100, 116, 139, 0.12)",
    attention: "#FFC107",
    attentionSoft: "rgba(255, 193, 7, 0.20)",
    outlier: "#DC3545",
    outlierSoft: "rgba(220, 53, 69, 0.14)",
    standardBand: "rgba(51, 65, 85, 0.10)",
    standardBandBorder: "rgba(51, 65, 85, 0.35)"
  },
  districtGroups: {
    School: "#FFC107",
    City: "#334155",
    County: "#198754",
    "Natural resources": "#0D6EFD",
    "Education service": "#64748b",
    "Community college": "#00CCCD",
    "Fire district": "#DC3545",
    Township: "#475569",
    Agriculture: "#73a35b",
    Historical: "#94a3b8",
    Other: "#94a3b8"
  },
  sequences: {
    categorical: ["#198754", "#0D6EFD", "#00CCCD", "#FFC107", "#64748b", "#DC3545"],
    blueScale: ["#bfdbfe", "#60a5fa", "#0D6EFD"],
    countyHierarchy: {
      subject: "#198754",
      county: "#73a35b",
      state: "#DC3545"
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
  cod: visualizationTheme.colors.primary,
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
