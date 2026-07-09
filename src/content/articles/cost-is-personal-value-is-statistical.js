export const costPersonalValueStatisticalArticle = {
  id: "cost-personal-value-statistical",
  slug: "cost-is-personal-value-is-statistical",
  legacyQueryValue: "cost-personal-value-statistical",
  canonicalPath: "articles/cost-is-personal-value-is-statistical/",
  title: "Cost Is Personal. Value Is Statistical.",
  subtitle: "Why the price you paid for one house matters, but does not automatically become the assessed value.",
  description: "A plain-English explanation of why Nebraska assessments use market value, qualified sales, and mass appraisal instead of treating each purchase price as the tax value forever.",
  author: "Max Quattromani",
  authorEmail: "max@maxquatrromani.com",
  authorTitle: "Certified in Nebraska Property Assessment",
  displayDate: "July 8, 2026",
  publishedDate: "2026-07-08T15:00:00-05:00",
  modifiedDate: "2026-07-08T15:00:00-05:00",
  readingMinutes: 7,
  wordCount: 1500,
  lengthLabel: "plain-language explainer",
  tags: ["Assessment", "Market Value", "Mass Appraisal", "Gage County", "Property Tax Education"],
  keywords: [
    "purchase price assessed value",
    "Nebraska actual value",
    "market value property tax",
    "mass appraisal",
    "qualified sales",
    "Gage County residential sales"
  ],
  assets: {
    authorImage: "assets/images/articles/max-quattromani-author.jpg",
    heroImage: "assets/images/articles/cost-personal-value-statistical-hero-16x9.png",
    heroImageAlt: "Illustration of one home sale beside a neighborhood map with many sale points and a trend line.",
    heroImageCredit: "Generated editorial illustration for Guided Parcel Review.",
    heroImageSource: "OpenAI image generation, July 2026"
  },
  references: {
    nebraskaConstitutionArticleViii: "https://nebraskalegislature.gov/laws/articles.php?article=VIII-1",
    nebraskaStatute77112: "https://nebraskalegislature.gov/laws/statutes.php?statute=77-112",
    nebraskaStatute771301: "https://nebraskalegislature.gov/laws/statutes.php?statute=77-1301",
    nebraskaStatute771315: "https://nebraskalegislature.gov/laws/statutes.php?statute=77-1315",
    nebraskaStatute771502: "https://nebraskalegislature.gov/laws/statutes.php?statute=77-1502",
    nebraskaStatute775023: "https://nebraskalegislature.gov/laws/statutes.php?statute=77-5023",
    nebraskaStatute775027: "https://nebraskalegislature.gov/laws/statutes.php?statute=77-5027",
    nebraskaReportsOpinions2026: "https://revenue.nebraska.gov/PAD/2026-reports-and-opinions-property-tax-administrator",
    title350Chapter10: "https://revenue.nebraska.gov/about/legal-information/regulations/chapter-10-real-property",
    iaaoMassAppraisal: "https://www.iaao.org/media/standards/Standard_on_Mass_Appraisal.pdf",
    iaaoRatioStudies: "https://www.iaao.org/media/standards/Standard_on_Ratio_Studies.pdf",
    iaaoFundamentals: "https://www.iaao.org/education/course-101-fundamentals-of-real-property-appraisal/",
    berryReassessing: "https://digitalcommons.unomaha.edu/urbanstudiesfacpub/60/",
    berryGageRegressivity: "https://digitalcommons.unomaha.edu/urbanstudiesfacpub/68/",
    beforeProtest: "articles/before-you-walk-into-a-property-protest/",
    taxRollMove: "articles/watch-the-tax-roll-move/",
    taxBillArticle: "articles/how-your-property-value-becomes-a-tax-bill/"
  },
  thesis: {
    statement: "Cost is personal. Value is statistical.",
    supportingText: "That is the heart of the misunderstanding.",
    caveat: "Statistical does not mean perfect. Records can be wrong. Models can miss things. The point is consistency across thousands of parcels, not infallibility."
  },
  sections: [
    {
      id: "opening",
      kicker: "The Question",
      title: "Most property owners have wondered this.",
      paragraphs: [
        "Maybe you bought your home six months ago. Maybe you have lived there for thirty years. Maybe you inherited it from your parents and still think of it by the price your family remembers.",
        "Then a valuation notice arrives, and there are two numbers in your mind: the price you know and the value the County reports.",
        "It is hard not to compare them.",
        "That is why this question comes up so often in protest hearings: I paid this much for my house. How can the assessment say something different?",
        "The question sounds technical, but it usually starts somewhere more human. Most people do not remember what the market was doing when they bought their home. They remember what their family was doing.",
        "They remember the down payment, the inspection, the bidding war, the relief, the uncertainty, or the sacrifice it took to get there. Naturally, that number becomes the one they trust most.",
        "Assessment is not trying to measure one family's experience. It is trying to measure the market's experience."
      ],
      margin: {
        label: "Hearing note",
        text: "If this question has bothered you, you are not alone."
      }
    },
    {
      id: "personal-cost",
      kicker: "The Misunderstanding",
      title: "Cost starts to feel like value because it is yours.",
      paragraphs: [
        "Some buyers negotiate exceptionally well. Some fall in love with a house. Some buy in a bidding war. Some buy from relatives. Some buy in winter. Some buy just before school starts.",
        "Those circumstances can all affect cost.",
        "They can also be completely real. A purchase price is not imaginary just because it is personal.",
        "But an assessment has to look past the circumstances of one transaction and ask what the broader market supports."
      ]
    },
    {
      id: "actual-value",
      kicker: "The Standard",
      title: "Nebraska measures market value, not a receipt.",
      paragraphs: [
        "Now the legal definition has a place to land.",
        "Nebraska law calls the target actual value: market value in the ordinary course of trade. It also allows professionally accepted mass appraisal methods, including sales comparison, income, and cost approaches.",
        "So the assessment question is not simply, what did this owner pay? It is: what does the market indicate for this property, as of the assessment date, when similar property is being valued by the same standard?"
      ],
      comparison: [
        {
          term: "Purchase price",
          description: "The transaction that happened."
        },
        {
          term: "Market value",
          description: "The probable price the market supports."
        },
        {
          term: "Assessment",
          description: "The value applied uniformly across the roll."
        }
      ],
      sourceNote: "massAppraisal"
    },
    {
      id: "welcome-stranger",
      kicker: "Uniformity",
      title: "Why not just use what everyone paid?",
      paragraphs: [
        "The tempting shortcut creates a fairness problem.",
        "Imagine two nearly identical houses on the same block. One sold in 1994 for $80,000. The other sold in 2026 for $260,000.",
        "If assessments stayed tied to purchase price, the tax system would stop measuring the current market. It would start measuring tenure.",
        "This is the Welcome Stranger problem: Welcome, stranger! The newest buyer carries a different tax base because they arrived later, not because their house is meaningfully different.",
        "Nebraska's uniformity principle points the other way. Similar property needs a common current standard."
      ],
      sourceNote: "uniformity"
    },
    {
      id: "sales-matter",
      kicker: "Evidence",
      title: "Sale prices absolutely matter.",
      paragraphs: [
        "The point is not that assessors ignore sale prices. Qualified sales are one of the main ways a market becomes visible.",
        "They support comparable-sales work, ratio studies, market adjustments, and model review.",
        "Nebraska case law gives the practical guardrails: purchase price alone is not conclusive, but a supported arm's-length sale should receive strong consideration."
      ],
      sourceNote: "saleCases"
    },
    {
      id: "evidence-builds",
      kicker: "The Sample",
      title: "Change can feel slow because evidence has to build.",
      paragraphs: [
        "Countywide residential sales can show broad movement, but they are still a sample of the housing stock.",
        "That matters most for unique homes, high-end homes, unusual acreage sites, heavy remodels, and properties with atypical condition. Fewer truly similar sales means less direct evidence.",
        "A model can still be reasonable with limited sales. Confidence improves when the same signal appears more than once."
      ],
      sourceNote: "gageSales"
    },
    {
      id: "protest-rights",
      kicker: "The Safety Valve",
      title: "Statistics create consistency, not perfection.",
      paragraphs: [
        "Most people do not look at an assessment and think, that is exactly the number I would have chosen. That is okay.",
        "Mass appraisal is not trying to match every owner's personal opinion of value. It is trying to apply one consistent standard across an entire market.",
        "That standard still depends on good records. If the square footage is wrong, the record matters. If the condition is wrong, the record matters. If the model missed a feature, limitation, or comparable sale that changes the picture, that matters too.",
        "That is why protest rights exist.",
        "A protest is not a rejection of the whole system. At its best, it is a focused request to correct the data, reconsider the evidence, or explain why the model treated one property differently from the market around it.",
        "That is also why the opening question is so reasonable. In ordinary life, cost becomes personal evidence of value. In appraisal, value has to be measured statistically."
      ],
      sourceNote: "protestRights"
    }
  ],
  visuals: {
    oneSaleMarket: {
      title: "One Sale vs. The Market",
      leftTitle: "One Sale",
      leftItems: ["Transaction price", "Sale date", "Terms and condition", "One point of evidence"],
      rightTitle: "The Market",
      rightItems: ["Comparable sales", "Time adjustments", "Ratio studies", "Model calibration"]
    },
    welcomeStranger: {
      title: "The Welcome Stranger Problem",
      question: "Should taxes depend on when you bought your home?",
      neighbors: [
        { label: "Neighbor A", year: "1994", price: "$80,000", note: "Long-time owner" },
        { label: "Neighbor B", year: "2026", price: "$260,000", note: "New buyer" }
      ]
    },
    evidenceBuilds: {
      title: "How a Sale Enters the System",
      steps: ["Sale occurs", "Sale is reviewed", "Qualified sale enters analysis", "Similar sales are compared", "Market signal informs the roll"]
    },
    saleCounts: {
      title: "Gage County residential qualified sale counts",
      note: "Compiled from 2019-2026 Gage County PAD Reports and Opinions and the 2026 Gage County R&O extraction.",
      rows: [
        { year: "2022", count: 724 },
        { year: "2023", count: 800 },
        { year: "2024", count: 688 },
        { year: "2025", count: 606 },
        { year: "2026 study", count: 550 }
      ]
    }
  },
  takeaways: [
    "A recent arm's-length purchase price is strong evidence, not an automatic assessment.",
    "Nebraska's target is actual value: market value in the ordinary course of trade.",
    "Purchase-price taxation would turn ownership date into a permanent tax divider.",
    "Qualified sales matter because they reveal market movement when analyzed together.",
    "Protest rights exist because uniform statistics still depend on accurate property facts."
  ],
  sourceNotes: {
    actualValue: {
      label: "Legal anchor",
      title: "Nebraska actual-value definition",
      subtitle: "Neb. Rev. Stat. § 77-112",
      purpose: "Supports the distinction between a personal transaction price and market value in the ordinary course of trade.",
      sourceType: "Legal authority",
      items: [{ label: "Neb. Rev. Stat. § 77-112", urlKey: "nebraskaStatute77112" }]
    },
    massAppraisal: {
      label: "Legal / practice basis",
      title: "Actual value and accepted appraisal methods",
      subtitle: "Nebraska statute and IAAO mass appraisal guidance",
      purpose: "Supports the article's description of sales comparison, income, cost, and mass appraisal methods.",
      sourceType: "Assessment guidance",
      items: [
        { label: "Neb. Rev. Stat. § 77-112", urlKey: "nebraskaStatute77112" },
        { label: "IAAO Standard on Mass Appraisal", urlKey: "iaaoMassAppraisal" }
      ]
    },
    uniformity: {
      label: "Constitutional anchor",
      title: "Uniform and proportionate taxation",
      subtitle: "Nebraska Constitution Article VIII, § 1",
      purpose: "Supports the explanation that similar property should be valued by a common standard instead of by owner purchase history.",
      sourceType: "Legal authority",
      items: [
        { label: "Neb. Const. art. VIII, § 1", urlKey: "nebraskaConstitutionArticleViii" },
        { label: "Neb. Rev. Stat. § 77-5023", urlKey: "nebraskaStatute775023" }
      ]
    },
    saleCases: {
      label: "Case-law anchor",
      title: "Sale price as evidence, not automatic conclusion",
      subtitle: "Reynolds, Dowd, and US Ecology",
      purpose: "Supports the point that purchase price alone is not conclusive, while a supported arm's-length sale should receive strong consideration.",
      sourceType: "Case law",
      items: [
        { label: "Reynolds v. Keith Cty. Bd. of Equal., 18 Neb. App. 616, 790 N.W.2d 455 (2010)", urlKey: "nebraskaStatute77112" },
        { label: "Dowd v. Board of Equalization, 240 Neb. 437, 482 N.W.2d 583 (1992)", urlKey: "nebraskaStatute77112" },
        { label: "US Ecology, Inc. v. Boyd Cty. Bd. of Equal., 256 Neb. 7, 588 N.W.2d 575 (1999)", urlKey: "nebraskaStatute77112" }
      ]
    },
    gageSales: {
      label: "Data source",
      title: "Gage County residential qualified sales",
      subtitle: "2019-2026 Gage County PAD Reports and Opinions; 2026 R&O countywide residential extract",
      purpose: "Supports the 2022-2026 residential qualified sale counts used to explain sample size and market evidence.",
      sourceType: "PAD report",
      items: [
        { label: "2026 Reports and Opinions of the Property Tax Administrator", urlKey: "nebraskaReportsOpinions2026" },
        { label: "Neb. Rev. Stat. § 77-5027", urlKey: "nebraskaStatute775027" },
        { label: "IAAO Standard on Ratio Studies", urlKey: "iaaoRatioStudies" }
      ]
    },
    protestRights: {
      label: "Procedure anchor",
      title: "Nebraska protest rights and documentation standard",
      subtitle: "Neb. Rev. Stat. § 77-1502",
      purpose: "Supports the closing explanation that protest rights exist to review evidence, records, and requested valuation changes.",
      sourceType: "Legal authority",
      items: [
        { label: "Neb. Rev. Stat. § 77-1502", urlKey: "nebraskaStatute771502" },
        { label: "Title 350, Ch. 10, Real Property Regulations", urlKey: "title350Chapter10" }
      ]
    }
  },
  resourcesBlock: {
    title: "Resources and authorities",
    intro: "These authorities support the legal and appraisal statements in this article. The article is educational, not legal advice.",
    groups: [
      {
        heading: "Nebraska legal authority",
        items: [
          {
            title: "Nebraska Constitution Article VIII, Section 1",
            type: "legal-authority",
            urlKey: "nebraskaConstitutionArticleViii",
            description: "Uniform and proportionate taxation framework for real property."
          },
          {
            title: "Neb. Rev. Stat. 77-112",
            type: "legal-authority",
            urlKey: "nebraskaStatute77112",
            description: "Defines actual value as market value in the ordinary course of trade and recognizes accepted mass appraisal methods."
          },
          {
            title: "Neb. Rev. Stat. 77-1301",
            type: "legal-authority",
            urlKey: "nebraskaStatute771301",
            description: "Assessment date and annual assessment timing."
          },
          {
            title: "Neb. Rev. Stat. 77-1315",
            type: "legal-authority",
            urlKey: "nebraskaStatute771315",
            description: "Real property assessment roll and valuation notice context."
          },
          {
            title: "Neb. Rev. Stat. 77-1502",
            type: "legal-authority",
            urlKey: "nebraskaStatute771502",
            description: "County board protest procedure and documentation requirements."
          },
          {
            title: "Neb. Rev. Stat. 77-5023",
            type: "legal-authority",
            urlKey: "nebraskaStatute775023",
            description: "Acceptable range and generally accepted mass appraisal technique language."
          },
          {
            title: "Neb. Rev. Stat. 77-5027",
            type: "legal-authority",
            urlKey: "nebraskaStatute775027",
            description: "Property Tax Administrator reports and equalization duties."
          },
          {
            title: "Title 350, Nebraska Administrative Code, Chapter 10",
            type: "legal-authority",
            urlKey: "title350Chapter10",
            description: "Nebraska real property regulations and protest procedure context."
          }
        ]
      },
      {
        heading: "Case-law anchors",
        items: [
          {
            title: "Reynolds v. Keith County Board of Equalization",
            type: "legal-authority",
            urlKey: "nebraskaStatute77112",
            description: "Nebraska annotation: purchase price standing alone is not conclusive of actual value; it is one factor."
          },
          {
            title: "Dowd v. Board of Equalization",
            type: "legal-authority",
            urlKey: "nebraskaStatute77112",
            description: "Nebraska annotation: supported arm's-length sale evidence should receive strong consideration."
          },
          {
            title: "US Ecology, Inc. v. Boyd County Board of Equalization",
            type: "legal-authority",
            urlKey: "nebraskaStatute77112",
            description: "Nebraska annotation: actual value is market value, not simply what one individual buyer may be willing to pay."
          },
          {
            title: "Cain v. Custer County Board of Equalization",
            type: "legal-authority",
            urlKey: "nebraskaStatute77112",
            description: "Nebraska annotation: discusses mass appraisal and evidence needed when claiming unique property treatment."
          }
        ]
      },
      {
        heading: "Assessment standards and research",
        items: [
          {
            title: "IAAO Standard on Mass Appraisal",
            type: "assessment-guidance",
            urlKey: "iaaoMassAppraisal",
            description: "Professional standard for applying appraisal methods across many properties."
          },
          {
            title: "IAAO Standard on Ratio Studies",
            type: "assessment-guidance",
            urlKey: "iaaoRatioStudies",
            description: "Professional standard for studying assessment-to-sale relationships and uniformity."
          },
          {
            title: "IAAO Course 101, Fundamentals of Real Property Appraisal",
            type: "assessment-guidance",
            urlKey: "iaaoFundamentals",
            description: "Fundamentals of appraisal methods and market value concepts."
          },
          {
            title: "Property Tax Administrator Reports and Opinions",
            type: "pad-report",
            urlKey: "nebraskaReportsOpinions2026",
            description: "Official county assessment statistics, ratio studies, and sales-count context."
          },
          {
            title: "Berry, Reassessing the Property Tax",
            type: "report",
            urlKey: "berryReassessing",
            description: "Research context for property tax assessment, distribution, and public policy."
          },
          {
            title: "Berry, Evaluation of Property Tax Regressivity in Gage County",
            type: "report",
            urlKey: "berryGageRegressivity",
            description: "Gage County-specific assessment equity research context."
          }
        ]
      },
      {
        heading: "Related Guided Parcel Review articles",
        items: [
          {
            title: "Before You Walk Into a Property Protest",
            type: "companion-guide",
            urlKey: "beforeProtest",
            description: "How to turn a concern into an evidence-based protest request."
          },
          {
            title: "Watch the Tax Roll Move",
            type: "experiment",
            urlKey: "taxRollMove",
            description: "Why relative value movement matters once the levy is applied."
          },
          {
            title: "How Your Property Value Becomes a Tax Bill",
            type: "companion-guide",
            urlKey: "taxBillArticle",
            description: "The broader path from value notice to tax bill."
          }
        ]
      }
    ]
  },
  related: {
    title: "Keep Going",
    intro: "These companion articles continue the same idea from different angles.",
    cards: [
      {
        title: "Before You Walk Into a Property Protest",
        description: "A practical guide for organizing record facts, comparable sales, and a specific requested correction.",
        hrefKey: "beforeProtest",
        action: "Read the guide"
      },
      {
        title: "Watch the Tax Roll Move",
        description: "An interactive explanation of how assessments divide the tax base before levies apply.",
        hrefKey: "taxRollMove",
        action: "Open the experiment"
      },
      {
        title: "How Your Property Value Becomes a Tax Bill",
        description: "A plain-language tour of notices, value, protests, budgets, levies, and tax bills.",
        hrefKey: "taxBillArticle",
        action: "Read the explainer"
      }
    ]
  }
};
