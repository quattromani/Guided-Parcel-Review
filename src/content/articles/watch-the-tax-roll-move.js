export const watchTheTaxRollMoveArticle = {
  canonicalPath: "articles/watch-the-tax-roll-move/",
  legacyQueryValue: "watch-the-tax-roll-move",
  title: "Watch the Tax Roll Move",
  description: "A guided civic lesson showing how assessed values divide a budget, how budgets determine collections, and how levies connect the two.",
  modifiedDate: "2026-07-02",
  displayDate: "July 2, 2026",
  author: "Max Quattromani",
  authorEmail: "max@maxquatrromani.com",
  authorTitle: "Nebraska Certified Assessor",
  readingMinutes: 6,
  wordCount: 1200,
  lengthLabel: "interactive-case-study",
  tags: ["Tax roll", "Equalization", "Levies", "Property tax education"],
  assets: {
    authorImage: "assets/images/articles/max-quattromani-author.jpg",
    heroImage: "assets/images/articles/watch-the-tax-roll-move-hero-16x9.jpg",
    heroImageAlt: "Aerial view of homes, lawns, trees, and a neighborhood street intersection.",
    heroImageCredit: "Photo by Kelly on Pexels.",
    heroImageSource: "https://www.pexels.com/",
    printableGuidePdf: "assets/guides/watch-the-tax-roll-move.pdf"
  },
  sections: {
    intro: {
      kicker: "",
      title: "Let's run an experiment.",
      paragraphs: [
        "Every good one begins with a question that can be tested.",
        "This one starts with a familiar assumption: if assessments went down instead of up, taxes should go down too.",
        "That sounds reasonable. If every property owner in a county received a 10% reduction in assessed value, most people would expect the tax bill to move in the same direction.",
        "But what if it did not?",
        "What if lowering every assessment mostly changed the levy instead?",
        "Rather than argue from intuition, we can simplify the system until each relationship is visible.",
        "We'll begin with ten identical homes, one fixed budget, and one levy rate. Then we'll change only one variable at a time and watch what happens."
      ]
    },
    controlGroup: {
      kicker: "The Control Group",
      title: "Start with ten identical homes.",
      intro: "To make the relationships easier to see, we'll begin with ten identical homes. Every house is worth $100,000, creating a county tax base of $1 million. With a $10,000 budget, each home initially contributes the same amount.",
      snapshotKicker: "System Snapshot",
      snapshotTitle: "Control group baseline",
      snapshotNote: "These values establish the control group for every experiment that follows. Each home begins with the same value, carries the same share of the tax base, and pays the same amount toward the budget. Everything below changes only one variable at a time."
    },
    currentTotals: {
      kicker: "Current Totals",
      description: "These three numbers stay visible as each experiment changes the roll, the budget, or the relationship between properties.",
      labels: {
        totalValue: "Total Value",
        budget: "Budget",
        levy: "Levy"
      }
    },
    experimentTakeaway: {
      text: "Assessments determine each property's share of the tax base. Budgets determine how much money local government must collect. The levy connects those two ideas."
    },
    finalThought: {
      title: "One final thought.",
      paragraphsBeforeQuestion: [
        "This article began with a simple question: what would happen if assessments went down instead of up? At first, the answer seems obvious. Lower assessments should mean lower taxes.",
        "But after watching the tax roll move one step at a time, the system becomes easier to see. When every home moved together, very little changed. The levy adjusted. When one property moved differently than its neighbors, the tax burden shifted.",
        "That distinction explains why two homeowners in the same taxing district can experience very different tax bills, even when both receive a valuation increase.",
        "By the final experiment, the neighborhood behaved more like a real county. Assessments reflected actual differences between properties, the levy did not have to compensate for an oversimplified tax base, and the burden spread according to each property's position.",
        "As you leave this article, try replacing one question with another. Instead of asking, \"How much did my assessment go up?\" ask:"
      ],
      question: "How did my property move compared with everyone else's?",
      paragraphsAfterQuestion: [
        "That's the question the property tax system is really answering. Assessment is not designed to raise taxes by itself. Its job is to position the tax base before the budget is applied.",
        "Assessments determine each property's share of the tax base. Budgets determine how much money must be collected. The levy connects the two.",
        "The better the tax base reflects reality, the more naturally the rest of the system can do its job. Accuracy compounds."
      ]
    }
  },
  resourcesBlock: {
    title: "Resources and authorities",
    intro: "The experiment is simplified, but the distinction it teaches is the same distinction used in Nebraska property tax administration: values establish the tax base, budgets determine collections, and levies connect the two.",
    groups: [
      {
        heading: "Legal and public administration context",
        items: [
          {
            title: "Nebraska Constitution Article VIII, Section 1",
            type: "legal-authority",
            url: "https://nebraskalegislature.gov/laws/articles.php?article=VIII-1",
            description: "Constitutional foundation for uniform and proportionate taxation."
          },
          {
            title: "Neb. Rev. Stat. 77-112",
            type: "legal-authority",
            url: "https://nebraskalegislature.gov/laws/statutes.php?statute=77-112",
            description: "Definition of actual value for Nebraska property assessment."
          },
          {
            title: "Neb. Rev. Stat. 77-1601",
            type: "legal-authority",
            url: "https://nebraskalegislature.gov/laws/statutes.php?statute=77-1601",
            description: "Levy authority and the connection between tax requests and taxable value."
          }
        ]
      },
      {
        heading: "Companion reading",
        items: [
          {
            title: "Assessment Up. Protest Denied. Taxes?",
            type: "case-study",
            url: "articles/assessment-up-protest-denied-taxes/",
            description: "A related case study on assessment movement, levy compression, and tax bill outcomes."
          },
          {
            title: "Before You Walk Into a Property Protest",
            type: "companion-guide",
            url: "https://quattromani.github.io/Guided-Parcel-Review/articles/before-you-walk-into-a-property-protest/",
            description: "A practical guide for reviewing your notice, organizing evidence, and preparing for a property protest."
          }
        ]
      }
    ]
  }
};

export const taxRollProperties = [
  { label: "House 1", value: 100000, color: "#58748a", tone: "Slate" },
  { label: "House 2", value: 100000, color: "#7f8a5b", tone: "Olive" },
  { label: "House 3", value: 100000, color: "#7890a3", tone: "Dusty Blue" },
  { label: "House 4", value: 100000, color: "#a6634f", tone: "Brick" },
  { label: "House 5", value: 100000, color: "#b99a55", tone: "Muted Gold" },
  { label: "House 6", value: 100000, color: "#4d8a88", tone: "Teal" },
  { label: "House 7", value: 100000, color: "#8d8274", tone: "Warm Gray" },
  { label: "House 8", value: 100000, color: "#7f6f92", tone: "Dusty Purple" },
  { label: "House 9", value: 100000, color: "#52606b", tone: "Muted Navy" },
  { label: "House 10", value: 100000, color: "#6f7d6a", tone: "Sage" }
];
const BASE_VALUES = taxRollProperties.map(property => property.value);
const BASE_BUDGET = 10000;
const BUDGET_UP = BASE_BUDGET * 1.03;
export const taxRollLessons = [
  {
    id: "everyone-up",
    number: "Experiment 1",
    title: "If everyone's assessment goes up, do everyone's taxes go up too?",
    setup: [
      ["All homes", "+10%"],
      ["Budget", "No change"]
    ],
    prediction: "The levy should adjust, but the burden should not redistribute.",
    action: "See the Answer",
    values: () => BASE_VALUES.map(value => value * 1.1),
    budget: BASE_BUDGET,
    result: "Not necessarily.",
    observation: "Almost nothing changes. Every home's assessed value increased. The levy compressed enough that nearly every tax bill stayed about the same.",
    why: "Because every property increased by the same percentage. No property became a larger share of the county's tax base. Instead, the levy adjusted.",
    remember: "Equal movement changes the levy. Unequal movement changes the burden.",
    bridge: {
      icon: "balance",
      title: "Everyone moved together.",
      text: "That kept the tax burden in the same shape. Now reverse the direction and test the opening theory directly: do lower assessments, by themselves, change the result?"
    }
  },
  {
    id: "everyone-down",
    number: "Experiment 2",
    title: "If everyone's assessment goes down, would taxes go down?",
    setup: [
      ["All homes", "-10%"],
      ["Budget", "No change"]
    ],
    prediction: "The levy should adjust upward because the budget stayed the same.",
    action: "See the Answer",
    values: () => BASE_VALUES.map(value => value * 0.9),
    budget: BASE_BUDGET,
    result: "Again, very little changes.",
    observation: "Every home's assessed value fell. The levy expanded. Tax bills remained surprisingly similar.",
    why: "The county still needs to collect the same amount of money. When every property falls together, the levy simply adjusts upward.",
    remember: "Lower assessments alone do not guarantee lower taxes.",
    bridge: {
      icon: "compass",
      title: "So what actually matters?",
      text: "The original hypothesis did not hold. Lowering or raising every assessment together did not redistribute the tax burden. The levy absorbed that change."
    }
  },
  {
    id: "house-four-faster",
    number: "Experiment 3",
    title: "What happens if one house appreciates much faster than the others?",
    setup: [
      ["One home", "+30%"],
      ["Remaining homes", "+10%"],
      ["Budget", "+3%"]
    ],
    prediction: "That home should carry more because its share of the tax base grows.",
    action: "See the Answer",
    values: () => BASE_VALUES.map((value, index) => value * (index === 3 ? 1.3 : 1.1)),
    budget: BUDGET_UP,
    result: "One property now carries more.",
    observation: "Only one property moved dramatically faster than the neighborhood. Its share of the county tax base increased.",
    why: "Because property taxes are based on relative movement. That home now represents a larger percentage of the county's total value.",
    remember: "Higher taxes usually come from becoming a larger share of the tax base, not simply from having a higher assessment.",
    bridge: {
      icon: "map",
      title: "One house is easy to follow.",
      text: "This is the point where the opening question begins to answer itself. A neighborhood is where the pattern starts to feel more like real life."
    }
  },
  {
    id: "two-speeds",
    number: "Experiment 4",
    title: "What happens when one part of town appreciates faster than another?",
    setup: [
      ["Faster half", "+10%"],
      ["Slower half", "+5%"],
      ["Budget", "+3%"]
    ],
    prediction: "The faster-moving half should pick up a larger share of the budget.",
    action: "See the Answer",
    values: () => BASE_VALUES.map((value, index) => value * (index < 5 ? 1.1 : 1.05)),
    budget: BUDGET_UP,
    result: "The burden begins to separate.",
    observation: "Properties that appreciated faster began carrying a larger portion of the budget.",
    why: "Different neighborhoods can experience different market conditions. Relative movement, not identical movement, creates redistribution.",
    remember: "Assessment differences redistribute responsibility.",
    bridge: {
      icon: "cycle",
      title: "Now the pattern is less tidy.",
      text: "Real reassessment years rarely move in two clean groups. Some values rise more, some rise less, and the budget may change at the same time."
    }
  },
  {
    id: "mixed-year",
    number: "Experiment 5",
    title: "What is a more likely reassessment pattern?",
    setup: [
      ["Homes vary", "+2%, +5%, +9%, +14%, +20%"],
      ["Budget", "+3%"]
    ],
    prediction: "Homes that rise faster should gain share. Slower homes should lose share.",
    action: "See the Answer",
    values: () => BASE_VALUES.map((value, index) => value * [1.02, 1.05, 1.09, 1.14, 1.2, 1.2, 1.05, 1.09, 1.14, 1.2][index]),
    budget: BUDGET_UP,
    result: "Now the whole system is working together.",
    observation: "Every property followed its own path. The budget rose by 3%. The levy adjusted. Each property's share shifted differently.",
    why: "Mixed movement is common because no two parts of the tax base move exactly alike.",
    remember: "Tax bills are determined by how your property changed compared with everyone else's."
  }
];

export const taxRollBudgetTransition = "Now we'll add one more variable: the budget. Assessments still determine each home's share, but a budget increase changes how much the levy has to collect.";

export const taxRollExperimentDefaults = {
  baseBudget: BASE_BUDGET,
  budgetIncrease: BUDGET_UP
};
