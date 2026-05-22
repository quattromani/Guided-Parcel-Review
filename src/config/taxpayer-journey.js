import { copyArray } from "../content/site-copy.js";

const fallbackTaxpayerJourneyRoutes = [
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
    description: "Compare the latest change with the longer value history."
  },
  {
    id: "valuation-detail",
    panelId: "market-area",
    eyebrow: "Observe",
    label: "Value Detail",
    question: "What may be driving the value?",
    title: "Compare the value with the property record and local sales",
    description: "Read the property facts beside recent qualified sales."
  },
  {
    id: "equalization",
    panelId: "county-equalization",
    eyebrow: "Check",
    label: "Equalization",
    question: "Are assessments checked for level and consistency?",
    title: "Use equalization to check the assessment base",
    description: "Equalization checks whether assessments meet required levels and are applied consistently."
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
    title: "See how value changes affect the tax bill",
    description: "Review value, levy, credits, districts, and net tax separately."
  },
  {
    id: "review-signals",
    panelId: "review-checklist",
    eyebrow: "Decide",
    label: "Review Signals",
    question: "Is there anything worth reviewing more closely?",
    title: "Review neutral signals and organize follow-up questions",
    description: "Check whether the source facts line up."
  },
  {
    id: "final-summary",
    panelId: "final-summary",
    eyebrow: "Summary",
    label: "Summary",
    question: "What was reviewed?",
    title: "Leave with orientation and optional next steps",
    description: "Review the record, value, equalization, taxes, and signals in one place."
  }
];

export function getTaxpayerJourneyRoutes() {
  // Guided-step labels and route intro copy are authored in the central site copy file.
  return copyArray("routes", fallbackTaxpayerJourneyRoutes);
}

export const TAXPAYER_JOURNEY_ROUTES = fallbackTaxpayerJourneyRoutes;

export function getJourneyRoute(idOrPanelId) {
  return getTaxpayerJourneyRoutes().find(route =>
    route.id === idOrPanelId || route.panelId === idOrPanelId
  );
}

export function getRouteForPanel(panelId) {
  return getTaxpayerJourneyRoutes().find(route => route.panelId === panelId);
}
