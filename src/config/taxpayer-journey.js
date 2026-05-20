export const TAXPAYER_JOURNEY_ROUTES = [
  {
    id: "property-record",
    panelId: "your-property",
    eyebrow: "Observe",
    label: "Property Record",
    question: "Does the county record describe this property correctly?",
    title: "Review the property record before value or taxes",
    description: "Start with identity, land, building facts, and photos."
  },
  {
    id: "what-changed",
    panelId: "your-assessment",
    eyebrow: "Orient",
    label: "What Changed",
    question: "What changed?",
    title: "Look at the value movement",
    description: "Compare recent value movement with the longer pattern."
  },
  {
    id: "valuation-detail",
    panelId: "market-area",
    eyebrow: "Observe",
    label: "Value Detail",
    question: "What may be driving the value?",
    title: "Connect the value to the record and market context",
    description: "Read the property record beside local sales-study context."
  },
  {
    id: "equalization",
    panelId: "county-equalization",
    eyebrow: "Check",
    label: "Equalization",
    question: "How is the base checked for uniformity and proportionality?",
    title: "Use equalization as the check between value and tax",
    description: "Equalization checks value level and price-related fairness before levies are applied."
  },
  {
    id: "state-context",
    panelId: "state-context",
    eyebrow: "Deeper equalization context",
    label: "State Context",
    question: "How does the county compare statewide?",
    title: "Keep the statewide comparison inside the tax context step",
    description: "Use statewide CTL data as broader context.",
    secondary: true,
    primaryRouteId: "tax-context"
  },
  {
    id: "tax-context",
    panelId: "your-taxes",
    eyebrow: "Understand",
    label: "Tax Context",
    question: "How do values connect to taxes?",
    title: "Separate value, levy, credits, and final tax bills",
    description: "Read value, levy, credits, districts, and net tax separately."
  },
  {
    id: "review-signals",
    panelId: "review-checklist",
    eyebrow: "Decide",
    label: "Review Signals",
    question: "Is there anything worth reviewing more closely?",
    title: "Review neutral signals and organize questions",
    description: "Check whether the source facts line up."
  },
  {
    id: "final-summary",
    panelId: "final-summary",
    eyebrow: "Summary",
    label: "Summary",
    question: "What was reviewed?",
    title: "Leave with orientation and optional next steps",
    description: "Summarize the record, value, equalization, taxes, and review signals."
  }
];

export function getJourneyRoute(idOrPanelId) {
  return TAXPAYER_JOURNEY_ROUTES.find(route =>
    route.id === idOrPanelId || route.panelId === idOrPanelId
  );
}

export function getRouteForPanel(panelId) {
  return TAXPAYER_JOURNEY_ROUTES.find(route => route.panelId === panelId);
}
