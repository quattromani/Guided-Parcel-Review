import { renderComparisonExperiment } from "./comparison-experiment.js?v=20260701-article-polish-4";

export async function renderGrantNeighborCompExperiment(propertySwitcherContext = {}) {
  return renderComparisonExperiment(propertySwitcherContext, {
    kicker: "Experiment · Neighbor Comp Sheet",
    title: "Grant Street side-by-side property comparison",
    subtitle: "Three adjacent Beatrice residential parcels, arranged west-to-east with the Kuhnke property in the middle. This page organizes record facts and value breakouts so the homes can be compared without jumping between parcel pages.",
    contextKicker: "Same Block · Same VG · Same Tax District",
    introTitle: "Set up for comparison, not a valuation conclusion",
    introCopy: "Use the cards for visual orientation, then scan the aligned rows for size, year built, garage, condition, outbuildings, and 2026 value components.",
    cardSectionLabel: "Neighbor property cards",
    tableLabel: "Side-by-side comp sheet",
    tableKicker: "Comp Sheet",
    tableTitle: "Record facts and value breakouts",
    sourceText: "Source: GWorks 2026 assessment PDFs and Nebraska Taxes Online 2025 statement captures.",
    properties: [
      {
        recordId: "residential-0010302000",
        role: "comparable",
        roleLabel: "Neighbor property",
        locationFactors: "Same block · VG 3 · Beatrice urban · Tax District 157",
        reasonIncluded: "Adjacent Grant Street property west of the middle record.",
        reviewCaution: "Neighbor context only; not a formal comparable sale conclusion."
      },
      {
        recordId: "residential-0010301000",
        role: "subject",
        roleLabel: "Middle property",
        locationFactors: "Same block · VG 3 · Beatrice urban · Tax District 157",
        reasonIncluded: "Middle property in the three-home Grant Street comparison.",
        reviewCaution: "Subject anchor for visual and record comparison only."
      },
      {
        recordId: "residential-0010300000",
        role: "comparable",
        roleLabel: "Neighbor property",
        locationFactors: "Same block · VG 3 · Beatrice urban · Tax District 157",
        reasonIncluded: "Adjacent Grant Street property east of the middle record.",
        reviewCaution: "Neighbor context only; not a formal comparable sale conclusion."
      }
    ]
  });
}
