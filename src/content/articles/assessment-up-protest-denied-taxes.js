export const assessmentUpProtestDeniedTaxesArticle = {
  id: "protest-paradox",
  slug: "assessment-up-protest-denied-taxes",
  legacyQueryValue: "protest-paradox",
  canonicalPath: "articles/assessment-up-protest-denied-taxes/",
  title: "Assessment Up. Protest Denied. Taxes?",
  subtitle: "A case study showing why property taxes can fall after an assessment increase, and how levy compression changes the tax impact of a valuation notice.",
  author: "Max Quattromani",
  authorEmail: "max@maxquatrromani.com",
  authorTitle: "Nebraska Certified Assessor",
  location: "Gage County",
  tags: ["Gage County", "Levy Compression", "Property Tax"],
  displayDate: "June 23, 2026",
  publishedDate: "2026-06-23",
  modifiedDate: "2026-06-26",
  description: "A Gage County case study showing why property taxes can fall after an assessment increase, and how levy compression changes the tax impact of a valuation notice.",
  keywords: [
    "property tax levy compression",
    "assessment increase taxes down",
    "Gage County property assessment",
    "property valuation protest",
    "effective tax rate",
    "property tax estimate"
  ],
  reading: {
    wordCount: 1850,
    minutes: 8,
    lengthLabel: "field-note"
  },
  assets: {
    authorImage: "assets/images/articles/max-quattromani-author.jpg",
    printableGuidePdf: "assets/guides/assessment-up-protest-denied-taxes.pdf",
    socialImage: "assets/images/protest-paradox-share.jpg",
    heroImageAlt: "Aerial view of rural agricultural land and homes."
  },
  calculatorStarterValues: {
    taxes2025: 1410.22,
    value2025: 220510,
    value2026: 285015,
    valueGrowth: 9.57,
    budgetGrowth: 3
  },
  references: {
    gageCountyPropertySearchPage: "https://report.gworks.com/report.ashx?county=gage&type=assessor",
    gageCountyRo2026: "https://revenue.nebraska.gov/sites/default/files/doc/pad/research/statewide_equalization/counties/2026/34Gage.pdf",
    nebraskaPadRoIndex2026: "https://revenue.nebraska.gov/PAD/2026-reports-and-opinions-property-tax-administrator"
  },
  sourcesUsed: {
    title: "Resources and authorities",
    intro: "This case study relies on the parcel record, tax-year records, and Gage County PAD Report and Opinion context named in the article.",
    groups: [
      {
        heading: "Case record",
        items: [
          {
            title: "Gage County property record card for parcel 004817000",
            source: "Gage County Assessor / GWorks public record export",
            description: "Property record used for the case-study valuation movement and component-change context.",
            urlKey: "gageCountyPropertySearchPage",
            type: "County record",
            jurisdiction: "Gage County",
            note: "The article cites the generated parcel record card rather than a permanent parcel-specific URL."
          },
          {
            title: "Nebraska Taxes Online tax-year records for parcel 0004817000",
            source: "Nebraska Taxes Online",
            description: "Tax-year records used for the 2025 tax-bill comparison.",
            type: "Tax record",
            jurisdiction: "Nebraska",
            note: "No durable parcel-specific public URL is stored in the project."
          }
        ]
      },
      {
        heading: "Assessment context",
        items: [
          {
            title: "2026 Reports and Opinions of the Property Tax Administrator - Gage County",
            source: "Nebraska Department of Revenue, Property Assessment Division",
            description: "Countywide assessment context and market-study material used for the levy-compression explanation.",
            urlKey: "gageCountyRo2026",
            type: "PAD report",
            jurisdiction: "Gage County",
            lastReviewedDate: "May 14, 2026"
          },
          {
            title: "2026 Reports and Opinions index",
            source: "Nebraska Department of Revenue, Property Assessment Division",
            description: "Official landing page for county Reports and Opinions.",
            urlKey: "nebraskaPadRoIndex2026",
            type: "Official index",
            jurisdiction: "Nebraska"
          }
        ]
      }
    ]
  },
  learningPoints: [
    "Why taxes can fall after an assessment increase",
    "What levy compression actually does",
    "How to estimate the impact of your next notice",
    "Which question matters more than your new value"
  ],
  timeline: {
    caption: "What happened in 2025",
    date: "July 21, 2025",
    items: [
      "Property owner appeared before the Board of Equalization.",
      "Protest focused on a roughly $10,000 first-acre homesite increase.",
      "Board left valuation unchanged."
    ]
  },
  frameworkSteps: [
    ["Property Movement", "How much did this property move?", "+4.75%", "The parcel's assessed value moved from $210,510 to $220,510."],
    ["County Movement", "How much did everyone else move?", "Countywide growth", "When many properties increase together, the tax base expands."],
    ["Budget Movement", "How much money did local governments need?", "Budget growth", "Budgets determine how much tax pressure must be collected."]
  ],
  componentChanges: [
    ["Land", "$62,690 -> $62,690", "No change"],
    ["Dwelling", "$146,455 -> $210,990", "Major increase"],
    ["Other Improvements", "$11,365 -> $11,335", "Slight decrease"]
  ],
  calculatorInputs: [
    ["taxes2025", "Last year's tax bill", "Editable field - case-study starter", "$1,410.22", "money-cents", true],
    ["value2025", "Last year's value", "Editable field - case-study starter", "$220,510", "money-whole", true],
    ["value2026", "This year's value", "Editable field - case-study starter", "$285,015", "money-whole", true],
    ["valueGrowth", "2026 countywide value growth", "Observed county input", "9.57%", "percent", false],
    ["budgetGrowth", "Estimated budget growth", "Planning assumption", "3.00%", "percent", false]
  ],
  sourceNotes: {
    mystery: {
      label: "Case record",
      title: "Gage County property record card",
      subtitle: "Parcel 004817000 / Board of Equalization hearing context",
      purpose: "Used to verify the protested value change and the hearing outcome described above.",
      sourceType: "Administrative record",
      organization: "Gage County Assessor"
    },
    taxResult: {
      label: "Tax record",
      title: "Nebraska Taxes Online",
      subtitle: "Parcel 0004817000 / Tax Years 2024-2025",
      purpose: "Used to verify the historical tax comparison shown above.",
      sourceType: "Tax record",
      organization: "Nebraska Taxes Online",
      dataCoverage: "Tax Years 2024-2025"
    },
    calculator: {
      label: "Model inputs",
      title: "Case-study model inputs",
      subtitle: "2025 tax record / 2026 valuation context / countywide value growth / budget-growth assumption",
      purpose: "Used to show how the calculator turns parcel value movement, countywide growth, and budget growth into a directional tax estimate.",
      sourceType: "Internal calculation"
    },
    closing: {
      label: "Sources",
      title: "Case-study source set",
      subtitle: "Gage County record card / Nebraska Taxes Online / 2026 Gage County Report and Opinion",
      purpose: "Used to tie the parcel-specific example back to official record, tax, and countywide assessment context.",
      sourceType: "Source set",
      lastVerifiedDate: "June 23, 2026"
    }
  },
  sections: {
    learning: {
      kicker: "Case Study",
      title: "Start with the puzzle",
      marginInsight: {
        text: "The tax bill follows relative movement, not the notice alone."
      },
      practicalQuestion: "Do not stop at the new value. Ask how the property moved compared with the rest of the tax base."
    },
    mystery: {
      kicker: "The Mystery",
      title: "A value went up. The protest was denied. The tax bill went down.",
      marginInsight: {
        label: "Reader cue",
        text: "The outcome sounds contradictory until the tax base enters the frame."
      },
      paragraphs: [
        "That sounds wrong at first. If the Board left the value unchanged, many homeowners would expect the tax bill to rise too.",
        "This case shows why assessment change and tax change are related, but not identical."
      ],
      valueChangeNote: "Dollar increase: $10,000. Percent increase: 4.75%."
    },
    taxResult: {
      kicker: "Why It Seems Wrong",
      title: "The 2025 tax bill moved the other direction",
      marginInsight: {
        text: "A higher value can still produce a lower bill when rates compress."
      },
      intro: "Even though the Board left the valuation unchanged, the property's 2025 taxes did not increase. They decreased.",
      closing: "Many people assume a higher assessment automatically has to mean higher taxes. This property produced a different outcome: while its assessment was up 4.75%, the final tax bill moved the other direction, down about 3.6%."
    },
    framework: {
      kicker: "The Missing Rule",
      title: "Property taxes follow relative movement",
      marginInsight: {
        text: "Your share matters only after it is compared with everyone else's."
      },
      intro: "The tax bill is not a direct translation of the valuation notice. The notice changes the starting point. The bill depends on what happened around that property too.",
      pullQuote: "A higher assessment usually means a property is carrying a larger share of the tax base. But a share only matters in context."
    },
    compression: {
      kicker: "What Levy Compression Means",
      title: "The rate can fall when the base grows faster than the budget",
      paragraphs: [
        "Think of the tax levy as a pie. If the pie, meaning the budget, stays the same size but the table, meaning the tax base, gets much larger, each person's slice can get smaller.",
        "When many properties rise together, the tax rate does not always need to rise with them. If the tax base grows faster than the budget, tax rates can compress downward."
      ]
    },
    apply: {
      kicker: "Apply The Framework",
      title: "Ready to apply this yourself?",
      marginInsight: {
        label: "Key move",
        text: "Separate value change from tax-rate change before reacting."
      },
      paragraphs: [
        "Everything above explained one parcel. Everything below uses the same framework to evaluate a different notice.",
        "If you have your own notice nearby, this is where the framework becomes useful."
      ],
      pullQuote: "Last year's discussion focused on a roughly $10,000 homesite increase. This year's increase is much larger and comes almost entirely from the dwelling.",
      noticeChangeNote: "Dollar increase: $64,505. Percent increase: 29.25%."
    },
    calculator: {
      kicker: "Estimate the Impact",
      title: "Run the value through the tax context",
      marginInsight: {
        text: "The model is a directional estimate, not a tax-bill prediction."
      },
      intro: "Start with your own numbers. The case-study values are loaded as starter values.",
      sameRateIntro: "This is often the first calculation taxpayers make. If the 2025 net effective tax rate stayed the same, the 2026 value would produce a larger increase before any levy compression.",
      sameRateNote: "Baseline only - not the likely outcome.",
      realWorldIntro: "Most properties moved too. The tax base expanded. If countywide value growth outpaces budget growth, levy rates often compress.",
      rangeIntro: "After the baseline is adjusted for county movement and budget movement, the likely outcome is much smaller than the value increase alone might suggest.",
      pullQuote: "Most taxpayers begin with a valuation notice. Most elected officials begin with a budget. The tax bill is produced somewhere in the middle.",
      disclaimer: "This is not a precise tax bill prediction. It is a directional estimate based on historical levy behavior, countywide value growth, and reasonable budget assumptions."
    },
    lesson: {
      kicker: "The Bigger Lesson",
      title: "The question that changes everything",
      question: "Most homeowners ask: What is my new value?",
      betterQuestion: "How did my property move compared with everyone else?"
    },
    closing: {
      kicker: "One Final Thought",
      title: "Accuracy compounds",
      marginInsight: {
        text: "Accurate records help show where a property fits."
      },
      paragraphs: [
        "Fairness begins with accurate and consistent treatment. Sometimes a property is measured incorrectly, classified incorrectly, or positioned differently than comparable properties. When that happens, a review process helps ensure that each property carries its appropriate share of the tax burden.",
        "In this case, the protest focused on a $10,000 increase to the property's first-acre homesite value. Similar adjustments were applied broadly to comparable properties throughout the county based on market studies used to establish site values. Because many similar properties moved together, the adjustment had relatively little effect on the property's position within the larger tax base.",
        "A protest or equalization review focuses on how a property compares with its peers. The tax bill that follows reflects something larger: how that property moved relative to other properties, how the overall tax base changed, and how much local governments decide to collect.",
        "Sometimes a review results in an adjustment. Sometimes it confirms that a property was already positioned appropriately within the broader tax base. Both outcomes have value. One corrects the record. The other confirms it.",
        "The valuation process helps determine where a property fits within the system. The tax bill reflects how that system moves as a whole. Both questions matter."
      ],
      sharePrompt: "Know someone trying to make sense of a valuation notice and a tax bill moving in different directions?",
      shareButton: "Share this case study",
      continuation: {
        title: "Need to prepare for the hearing side of the process?",
        link: {
          label: "Read the companion guide:",
          title: "Before You Walk Into a Property Protest",
          href: "articles/before-you-walk-into-a-property-protest/"
        }
      }
    }
  }
};
