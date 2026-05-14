export const TAXPAYER_JOURNEY_ROUTES = [
  {
    id: "landing-primer",
    panelId: "landing-primer",
    eyebrow: "Start here",
    label: "Start",
    question: "You are looking at this property.",
    title: "Start with a calm snapshot of the property",
    description: "Confirm that this is the property you meant to review. The opening snapshot brings the parcel, status, key values, and source context into one starting point."
  },
  {
    id: "property-record",
    panelId: "your-property",
    eyebrow: "Orient",
    label: "Property Record",
    question: "Does the county record describe this property correctly?",
    title: "Review the property record before value or taxes",
    description: "Start with the factual record: identity, land, dwelling facts, quality, condition, photos, and source notes. These details establish the property description used in later value and tax views."
  },
  {
    id: "what-changed",
    panelId: "your-assessment",
    eyebrow: "Observe",
    label: "What Changed",
    question: "What changed?",
    title: "Look at the value movement",
    description: "Separate current assessment-year status from finalized tax years, then compare recent movement with the longer pattern. Use the history to see whether the change is isolated or part of a broader trend."
  },
  {
    id: "valuation-detail",
    panelId: "market-area",
    eyebrow: "Observe",
    label: "Value Detail",
    question: "What may be driving the value?",
    title: "Connect the value to the record and market context",
    description: "Review the main value drivers in plain language before opening deeper market or method detail. Local sales-study data helps place the parcel record in context."
  },
  {
    id: "tax-context",
    panelId: "your-taxes",
    eyebrow: "Understand",
    label: "Tax Context",
    question: "How do values connect to taxes?",
    title: "Separate value, levy, credits, and final tax bills",
    description: "Assessed value is only one part of the tax bill. Levies, budgets, exemptions, credits, and tax district boundaries can also affect the final amount."
  },
  {
    id: "review-signals",
    panelId: "review-checklist",
    eyebrow: "Decide",
    label: "Review Signals",
    question: "Is there anything worth reviewing more closely?",
    title: "Review neutral signals and organize questions",
    description: "Review signals organize facts or patterns that may be worth verifying against the property record, value history, tax context, or source documents."
  },
  {
    id: "final-summary",
    panelId: "final-summary",
    eyebrow: "Summary",
    label: "Summary",
    question: "What was reviewed?",
    title: "Leave with orientation and optional next steps",
    description: "Summarize the property record, value movement, tax context, and any neutral review signals. The summary keeps what has been covered separate from any optional next steps."
  },
  {
    id: "resources",
    panelId: "resources",
    eyebrow: "Resources",
    label: "Resources",
    icon: "stacked-papers",
    secondary: true,
    question: "Resources and forms",
    title: "Use optional resources when you need them",
    description: "Review the assessment calendar, organize comparable-property notes, and access protest preparation materials without making those resources the endpoint of the main review."
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
