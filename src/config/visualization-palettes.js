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
    equalization: "#48657F",
    equalizationAlt: "#A9792B",
    equalizationMuted: "#3A7D8C",
    equalizationLevel: "#002D62",
    equalizationSoft: "rgba(72, 101, 127, 0.13)",
    equalizationSurface: "rgb(241 245 248)",
    equalizationBorder: "rgb(198 211 222)",
    pending: "#F3E2C2",
    pendingText: "#6E531B",
    pendingBorder: "#D8B874",
    market: "#48657F",
    marketSoft: "rgba(72, 101, 127, 0.13)",
    comparison: "#667085",
    comparisonSoft: "rgba(100, 116, 139, 0.12)",
    attention: "#A9792B",
    attentionSoft: "rgba(169, 121, 43, 0.16)",
    outlier: "#9B3D3D",
    outlierSoft: "rgba(155, 61, 61, 0.12)",
    standardBand: "rgba(72, 101, 127, 0.11)",
    standardBandBorder: "rgba(72, 101, 127, 0.34)"
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
  contextRate: visualizationTheme.roles.tax,
  propertyValue: visualizationTheme.roles.property,
  propertyTax: visualizationTheme.roles.taxSoft,
  propertyRate: visualizationTheme.roles.tax,
  equalization: visualizationTheme.roles.equalization,
  cod: visualizationTheme.roles.equalization,
  prd: visualizationTheme.roles.equalizationAlt,
  cov: visualizationTheme.roles.equalizationMuted,
  levelOfValue: visualizationTheme.roles.equalizationLevel,
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
  etr: visualizationTheme.roles.tax,
  etrBg: visualizationTheme.roles.taxSoft,
  etrSoft: visualizationTheme.roles.taxSurface,
  etrRing: visualizationTheme.roles.taxBorder,
  equalization: visualizationTheme.roles.equalization,
  equalizationBg: visualizationTheme.roles.equalizationSoft,
  equalizationSoft: visualizationTheme.roles.equalizationSurface,
  equalizationRing: visualizationTheme.roles.equalizationBorder,
  comparison: visualizationTheme.roles.comparison,
  comparisonBg: visualizationTheme.roles.comparisonSoft,
  pending: visualizationTheme.roles.pending,
  pendingRing: visualizationTheme.roles.pendingBorder
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
    "--viz-surface-muted": palette.neutrals.surfaceMuted,
    "--chart-gridline": palette.neutrals.gridline
  }).forEach(([name, value]) => root.style.setProperty(name, value));
}

export function applyChartDefaults(chart = globalThis.Chart, palette = visualizationTheme) {
  if (!chart?.defaults) return;

  chart.defaults.color = palette.neutrals.text;
  chart.defaults.borderColor = palette.neutrals.gridline;
  chart.defaults.font = {
    ...chart.defaults.font,
    family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  };

  if (chart.defaults.plugins?.legend?.labels) {
    chart.defaults.plugins.legend.labels.color = palette.neutrals.text;
    chart.defaults.plugins.legend.labels.boxWidth = 18;
    chart.defaults.plugins.legend.labels.boxHeight = 8;
    chart.defaults.plugins.legend.labels.padding = 14;
  }

  if (chart.defaults.scale?.grid) {
    chart.defaults.scale.grid.color = palette.neutrals.gridline;
  }

  if (chart.defaults.scale?.border) {
    chart.defaults.scale.border.color = palette.neutrals.border;
  }

  if (!applyChartDefaults.responsiveAxisTitlePluginRegistered && typeof chart.register === "function") {
    chart.register({
      id: "civicResponsiveAxisTitles",
      beforeUpdate(chartInstance) {
        const isMobile = globalThis.matchMedia?.("(max-width: 640px)")?.matches ?? false;
        Object.entries(chartInstance.options.scales ?? {}).forEach(([scaleId, scaleOptions]) => {
          const title = scaleOptions?.title;
          const isYAxis = scaleOptions?.axis === "y" || scaleId.startsWith("y");
          if (!isYAxis || !title) return;

          if (!Object.prototype.hasOwnProperty.call(title, "civicDesktopDisplay")) {
            Object.defineProperty(title, "civicDesktopDisplay", {
              configurable: true,
              value: title.display ?? false,
              writable: true
            });
          }

          title.display = isMobile ? false : title.civicDesktopDisplay;
        });
      }
    });
    applyChartDefaults.responsiveAxisTitlePluginRegistered = true;
  }
}
