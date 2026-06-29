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

const civicDark = {
  id: "civic-dark",
  label: "Civic dark",
  description: "Softened dark-mode palette for property value, tax, and equalization visuals.",
  colors: {
    primary: "#8BB5BF",
    secondary: "#8FA0A6",
    accent: "#88AEB8",
    success: "#8BA58F",
    warning: "#BE9F6A",
    danger: "#C98480"
  },
  neutrals: {
    ink: "#E1E7EA",
    text: "#B8C4C9",
    mutedText: "#8F9EA5",
    border: "#4A5B66",
    gridline: "rgba(143, 158, 165, 0.22)",
    surface: "#1C2832",
    surfaceMuted: "#18232C",
    tooltipSurface: "#263642"
  },
  roles: {
    property: "#E1E7EA",
    propertySoft: "rgba(143, 158, 165, 0.16)",
    value: "#8BA58F",
    valueSoft: "rgba(139, 165, 143, 0.2)",
    valueSurface: "rgb(31 54 44)",
    valueBorder: "rgb(79 105 83)",
    tax: "#C98480",
    taxSoft: "rgba(201, 132, 128, 0.18)",
    taxSurface: "rgb(61 41 43)",
    taxBorder: "rgb(125 76 74)",
    rate: "#9BA3C6",
    rateSoft: "rgba(155, 163, 198, 0.18)",
    rateSurface: "rgb(34 45 68)",
    rateBorder: "rgb(88 96 130)",
    equalization: "#8BB5BF",
    equalizationAlt: "#BE9F6A",
    equalizationMuted: "#8BA58F",
    equalizationLevel: "#9BA3C6",
    equalizationSoft: "rgba(139, 181, 191, 0.18)",
    equalizationSurface: "rgb(30 53 61)",
    equalizationBorder: "rgb(79 111 120)",
    pending: "#3B3122",
    pendingText: "#E6D1A6",
    pendingBorder: "#766037",
    market: "#8BB5BF",
    marketSoft: "rgba(139, 181, 191, 0.16)",
    comparison: "#8F9EA5",
    comparisonSoft: "rgba(143, 158, 165, 0.14)",
    attention: "#BE9F6A",
    attentionSoft: "rgba(190, 159, 106, 0.18)",
    outlier: "#C98480",
    outlierSoft: "rgba(201, 132, 128, 0.16)",
    standardBand: "rgba(143, 158, 165, 0.14)",
    standardBandBorder: "rgba(143, 158, 165, 0.36)"
  },
  districtGroups: {
    School: "#BE9F6A",
    City: "#E1E7EA",
    County: "#8BA58F",
    "Natural resources": "#88AEB8",
    "Education service": "#8F9EA5",
    "Community college": "#88AEB8",
    "Fire district": "#C98480",
    Township: "#B8C4C9",
    Agriculture: "#9ABF92",
    Historical: "#8F9EA5",
    Other: "#8F9EA5"
  },
  sequences: {
    categorical: ["#8BA58F", "#8BB5BF", "#9BA3C6", "#BE9F6A", "#8F9EA5", "#C98480"],
    blueScale: ["#263642", "#51707D", "#8BB5BF"],
    countyHierarchy: {
      subject: "#8BB5BF",
      county: "#8BA58F",
      state: "#8F9EA5"
    }
  }
};

export const VISUALIZATION_PALETTES = {
  [civicDefault.id]: civicDefault,
  [civicDark.id]: civicDark
};

export const DEFAULT_VISUALIZATION_PALETTE_ID = civicDefault.id;
export const DARK_VISUALIZATION_PALETTE_ID = civicDark.id;

export function getVisualizationPalette(id = DEFAULT_VISUALIZATION_PALETTE_ID) {
  return VISUALIZATION_PALETTES[id] ?? VISUALIZATION_PALETTES[DEFAULT_VISUALIZATION_PALETTE_ID];
}

function storedThemePreference() {
  try {
    return globalThis.localStorage?.getItem("ges-theme-preference") ?? null;
  } catch {
    return null;
  }
}

export function getActiveVisualizationPalette() {
  const resolvedTheme = globalThis.document?.documentElement?.dataset?.gesThemeResolved;
  const storedTheme = storedThemePreference();
  const systemTheme = globalThis.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  const activeTheme = resolvedTheme || storedTheme || systemTheme;

  return activeTheme === "dark" ? civicDark : civicDefault;
}

export const visualizationTheme = new Proxy(civicDefault, {
  get(_target, property) {
    return getActiveVisualizationPalette()[property];
  },
  ownKeys() {
    return Reflect.ownKeys(getActiveVisualizationPalette());
  },
  getOwnPropertyDescriptor(_target, property) {
    return Object.getOwnPropertyDescriptor(getActiveVisualizationPalette(), property);
  }
});

export const chartColors = {
  get contextValue() { return visualizationTheme.roles.value; },
  get contextTax() { return visualizationTheme.roles.tax; },
  get contextRate() { return visualizationTheme.roles.rate; },
  get propertyValue() { return visualizationTheme.roles.property; },
  get propertyTax() { return visualizationTheme.roles.taxSoft; },
  get propertyRate() { return visualizationTheme.roles.rate; },
  get equalization() { return visualizationTheme.roles.equalization; },
  get cod() { return visualizationTheme.roles.equalization; },
  get prd() { return visualizationTheme.roles.equalizationAlt; },
  get cov() { return visualizationTheme.roles.equalizationMuted; },
  get levelOfValue() { return visualizationTheme.roles.equalizationLevel; },
  get standardBand() { return visualizationTheme.roles.standardBand; },
  get standardBandBorder() { return visualizationTheme.roles.standardBandBorder; }
};

export const semanticChartColors = {
  get value() { return visualizationTheme.roles.value; },
  get valueBg() { return visualizationTheme.roles.valueSoft; },
  get valueSoft() { return visualizationTheme.roles.valueSurface; },
  get valueRing() { return visualizationTheme.roles.valueBorder; },
  get tax() { return visualizationTheme.roles.tax; },
  get taxBg() { return visualizationTheme.roles.taxSoft; },
  get taxSoft() { return visualizationTheme.roles.taxSurface; },
  get taxRing() { return visualizationTheme.roles.taxBorder; },
  get etr() { return visualizationTheme.roles.rate; },
  get etrBg() { return visualizationTheme.roles.rateSoft; },
  get etrSoft() { return visualizationTheme.roles.rateSurface; },
  get etrRing() { return visualizationTheme.roles.rateBorder; },
  get equalization() { return visualizationTheme.roles.equalization; },
  get equalizationBg() { return visualizationTheme.roles.equalizationSoft; },
  get equalizationSoft() { return visualizationTheme.roles.equalizationSurface; },
  get equalizationRing() { return visualizationTheme.roles.equalizationBorder; },
  get comparison() { return visualizationTheme.roles.comparison; },
  get comparisonBg() { return visualizationTheme.roles.comparisonSoft; },
  get pending() { return visualizationTheme.roles.pending; },
  get pendingRing() { return visualizationTheme.roles.pendingBorder; }
};

export function applyVisualizationPalette(palette = getActiveVisualizationPalette()) {
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
    "--viz-surface": palette.neutrals.surface,
    "--viz-surface-muted": palette.neutrals.surfaceMuted,
    "--chart-gridline": palette.neutrals.gridline,
    "--chart-axis": palette.neutrals.border,
    "--chart-label": palette.neutrals.text,
    "--chart-tooltip-surface": palette.neutrals.tooltipSurface ?? palette.neutrals.surface
  }).forEach(([name, value]) => root.style.setProperty(name, value));
}

export function applyChartDefaults(chart = globalThis.Chart, palette = getActiveVisualizationPalette()) {
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

  if (chart.defaults.plugins?.tooltip) {
    chart.defaults.plugins.tooltip.backgroundColor = palette.neutrals.tooltipSurface ?? palette.neutrals.surface;
    chart.defaults.plugins.tooltip.borderColor = palette.neutrals.border;
    chart.defaults.plugins.tooltip.borderWidth = 1;
    chart.defaults.plugins.tooltip.titleColor = palette.neutrals.ink;
    chart.defaults.plugins.tooltip.bodyColor = palette.neutrals.text;
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
