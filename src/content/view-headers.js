import { copyObject } from "./site-copy.js";

const fallbackViewHeaderContent = {
  start: {
    eyebrow: "Guided Parcel Review",
    title: "Start with a sample parcel",
    description: "Choose a sample parcel and begin the review path.",
    imageAlt: "Map of Nebraska highlighting Gage County"
  },
  "your-property": {
    eyebrow: "Guided Parcel Review",
    title: "This property, step by step",
    description: "Start with the record, then move through value, equalization, taxes, and review signals.",
    imageAlt: "Map of Nebraska highlighting Gage County"
  },
  "your-assessment": {
    eyebrow: "Step 2 · Assessment",
    title: "What changed about the assessed value?",
    description: "See what changed, and which years are still pending or final.",
    imageAlt: "Map of Nebraska highlighting the local market area"
  },
  "your-taxes": {
    eyebrow: "Step 5 · Tax context",
    title: "What does this mean for taxes?",
    description: "See how value, levy, credits, and districts affect net tax.",
    imageAlt: "Map of Nebraska highlighting Gage County"
  },
  "market-area": {
    eyebrow: "Step 3 · Value detail",
    title: "How does this compare nearby?",
    description: "Start with the property's local comparison group.",
    imageAlt: "Map of Nebraska highlighting the local market area"
  },
  "county-equalization": {
    eyebrow: "Step 4 · Equalization",
    title: "Are assessments checked for level and consistency?",
    description: "Equalization checks whether assessments are at the required level and applied consistently.",
    imageAlt: "Map of Nebraska highlighting Gage County"
  },
  "state-context": {
    eyebrow: "State baseline",
    title: "How does the county compare statewide?",
    description: "Use statewide CTL data as broader context.",
    imageAlt: "Map of Nebraska"
  },
  "review-checklist": {
    eyebrow: "Step 6 · Review",
    title: "Need to review anything?",
    description: "Check whether the source facts line up.",
    imageAlt: "Map of Nebraska highlighting Gage County"
  }
};

function viewHeaderContent() {
  // Page header copy appears in the top visual header for each guided route.
  return copyObject("viewHeaders", fallbackViewHeaderContent);
}

export { viewHeaderContent };
