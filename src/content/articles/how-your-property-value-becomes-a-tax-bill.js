export const howYourPropertyValueBecomesATaxBillArticle = {
  id: "how-your-property-value-becomes-a-tax-bill",
  slug: "how-your-property-value-becomes-a-tax-bill",
  legacyQueryValue: "assessments-protests-and-levies",
  canonicalPath: "articles/how-your-property-value-becomes-a-tax-bill/",
  title: "How Your Property Value Becomes a Tax Bill",
  subtitle: "A guided Nebraska explainer for understanding what a valuation notice means, what to check first, how fairness is reviewed, and how value eventually becomes taxes.",
  author: "Max Quattromani",
  authorEmail: "max@maxquatrromani.com",
  authorTitle: "Nebraska Certified Assessor",
  location: "Nebraska",
  tags: [
    "Nebraska property taxes",
    "Assessment basics",
    "Valuation notice",
    "Equalization",
    "Levies"
  ],
  displayDate: "June 29, 2026",
  publishedDate: "",
  modifiedDate: "2026-06-29",
  description: "A Guided Editorial System explainer that separates valuation notices, assessed value, record review, equalization, protests, levies, and tax bills for Nebraska property owners.",
  keywords: [
    "Nebraska valuation notice",
    "property assessment",
    "property tax bill",
    "Board of Equalization",
    "Nebraska levies",
    "property tax education",
    "property record card",
    "property protest"
  ],
  reading: {
    wordCount: 3150,
    minutes: 14,
    lengthLabel: "guided-explainer"
  },
  assets: {
    authorImage: "assets/images/articles/max-quattromani-author.jpg",
    heroImage: "assets/images/articles/property-value-tax-bill-hero-16x9.jpg",
    heroImageAlt: "Miniature houses on a tabletop, with one orange house standing out among darker homes.",
    heroImageCredit: "Photo by Jakub Zerdzicki on Pexels.",
    heroImageSource: "https://www.pexels.com/photo/31370919/",
    socialImage: "assets/images/articles/property-value-tax-bill-hero-16x9.jpg"
  },
  references: {
    nebraskaConstitutionArticleVIII1: "https://nebraskalegislature.gov/laws/articles.php?article=VIII-1",
    nebraskaStatute77112: "https://nebraskalegislature.gov/laws/statutes.php?statute=77-112",
    nebraskaStatute771301: "https://nebraskalegislature.gov/laws/statutes.php?statute=77-1301",
    nebraskaStatute771315: "https://nebraskalegislature.gov/laws/statutes.php?statute=77-1315",
    nebraskaStatute771502: "https://nebraskalegislature.gov/laws/statutes.php?statute=77-1502",
    nebraskaStatute771504: "https://nebraskalegislature.gov/laws/statutes.php?statute=77-1504",
    nebraskaStatute771601: "https://nebraskalegislature.gov/laws/statutes.php?statute=77-1601",
    title350Chapter10: "https://revenue.nebraska.gov/about/legal-information/regulations/chapter-10-real-property",
    padReportsOpinions2026: "https://revenue.nebraska.gov/PAD/2026-reports-and-opinions-property-tax-administrator",
    protestGuide: "articles/before-you-walk-into-a-property-protest/",
    protestParadox: "articles/assessment-up-protest-denied-taxes/",
    guidedParcelReview: "index.html"
  },
  memoryAnchors: [
    "A valuation notice is not a tax bill.",
    "Assessments estimate value. Levies distribute budgets.",
    "January 1 is the snapshot date.",
    "Check facts before arguing conclusions.",
    "Land plus improvements becomes the starting value.",
    "Mass appraisal values groups. Protests review parcels.",
    "Equalization compares many properties. A protest reviews one.",
    "Budgets determine revenue. Levies determine distribution.",
    "A higher value does not automatically mean the same tax increase.",
    "Accuracy compounds."
  ],
  actOne: {
    kicker: "Act 1",
    title: "The Notice Moment",
    heroHook: "A notice arrives in early June. Your value changed. You wonder whether this means your taxes are going up, whether the county looked inside your house, and whether there is something you are supposed to do before the deadline. Those are three different questions.",
    marginInsights: {
      notice: {
        label: "Reader cue",
        text: "A valuation notice is not a tax bill."
      },
      roles: {
        label: "Office cue",
        text: "The right question can still go to the wrong office."
      }
    },
    memoryAnchor: {
      text: "A valuation notice is not a tax bill.",
      supportingText: "It tells you the value side of the system changed. The tax bill arrives only after budgets, levies, and tax districts enter the picture.",
      contrast: [
        {
          term: "Valuation notice",
          description: "A value-side document."
        },
        {
          term: "Tax bill",
          description: "A levy-side result."
        }
      ]
    },
    notice: {
      title: "Notice of Valuation Change",
      subtitle: "The document that starts the question sequence",
      fields: [
        {
          label: "Assessed value",
          value: "$285,015",
          note: "The number being noticed."
        },
        {
          label: "Property record",
          value: "Parcel facts",
          note: "The facts to check next."
        },
        {
          label: "Protest window",
          value: "Short deadline",
          note: "The review path has a calendar."
        },
        {
          label: "Tax due",
          value: "Not shown",
          note: "Taxes are not calculated here."
        }
      ],
      caption: "The notice is useful because it narrows the first question: what changed on the value side?"
    },
    systemMap: {
      title: "Three connected lanes",
      intro: "The same property can move through three different public processes. Keeping those lanes separate prevents the first notice from feeling like the whole tax bill.",
      lanes: [
        {
          title: "Assessment",
          question: "What is the property worth for assessment purposes?",
          owner: "County assessor",
          output: "Assessed value",
          tone: "assessment"
        },
        {
          title: "Equalization",
          question: "Are similar properties being treated similarly?",
          owner: "County Board of Equalization",
          output: "Review and adjustment",
          tone: "equalization"
        },
        {
          title: "Taxation",
          question: "How does the value share become a tax bill?",
          owner: "Taxing subdivisions and levy process",
          output: "Levy and tax bill",
          tone: "taxation"
        }
      ]
    },
    roles: {
      title: "Who owns which question?",
      intro: "Most frustration starts when a good question lands at the wrong step. Start by matching the question to the role.",
      items: [
        {
          title: "Assessor",
          lane: "Assessment",
          ask: "Why did my value change? Is the property record correct?",
          not: "What will my final tax bill be?"
        },
        {
          title: "Board of Equalization",
          lane: "Review",
          ask: "Should this parcel's assessed value be changed after evidence is reviewed?",
          not: "Can the board lower a school, city, fire, or county budget?"
        },
        {
          title: "Taxing Subdivisions",
          lane: "Budget",
          ask: "What revenue is your district asking taxpayers to fund?",
          not: "Can you correct the facts on my property record?"
        },
        {
          title: "County Board",
          lane: "County levy",
          ask: "How does the county budget and levy process work?",
          not: "Can a levy question replace a valuation protest?"
        }
      ]
    },
    checkpoint: {
      title: "Before you continue...",
      intro: "By this point you should be able to separate the document from the tax outcome.",
      items: [
        "A valuation notice reports a value-side change.",
        "Assessment, equalization, and taxation answer different questions.",
        "The right office depends on the question you are asking."
      ]
    },
    sourceNote: {
      label: "Statutory anchors",
      text: "Act 1 relies on Nebraska statutes that separate assessment timing, valuation change notices, county board of equalization review, and levy authority.",
      links: [
        {
          label: "77-1301",
          urlKey: "nebraskaStatute771301"
        },
        {
          label: "77-1315",
          urlKey: "nebraskaStatute771315"
        },
        {
          label: "77-1502",
          urlKey: "nebraskaStatute771502"
        },
        {
          label: "77-1601",
          urlKey: "nebraskaStatute771601"
        }
      ]
    },
    transition: {
      kicker: "Next",
      title: "Understanding Your Assessed Value",
      description: "Now move from the notice itself to the number on it: what assessed value means, why the date matters, and which facts to check first.",
      href: "#valueNumberTitle"
    }
  },
  actTwo: {
    kicker: "Act 2",
    title: "The Value Number",
    guidingQuestion: "What should I check first?",
    intro: "Before comparing sales or writing a protest, start with the record. Nebraska assessment begins from a date-specific snapshot. If the facts in that snapshot are wrong, the value discussion starts in the wrong place.",
    marginInsights: {
      date: {
        label: "Date cue",
        text: "January 1 is the valuation date, not the inspection date."
      },
      facts: {
        label: "Review cue",
        text: "Check facts before arguing conclusions."
      }
    },
    memoryAnchor: {
      text: "January 1 is the snapshot date.",
      supportingText: "The question is not simply what the property looks like today. The assessment asks what existed and what condition applied as of the statutory valuation date.",
      contrast: [
        {
          term: "Snapshot",
          description: "The property as of January 1."
        },
        {
          term: "Inspection",
          description: "A way to update facts, not the valuation date itself."
        }
      ]
    },
    snapshot: {
      title: "Why January 1 matters",
      description: "A later repair, removal, remodel, sale, or storm loss can matter, but first ask whether it existed by January 1. That date keeps the countywide review tied to one common point in time."
    },
    checklist: {
      title: "Property record checklist",
      intro: "Use the notice as a pointer to the property record. These are the first facts worth checking because they can change the entire value conversation.",
      items: [
        {
          label: "Parcel identity",
          detail: "Owner, situs address, parcel number, and legal description point to the correct property."
        },
        {
          label: "Land facts",
          detail: "Lot size, acres, use, class, location influence, and any special characteristics match the parcel."
        },
        {
          label: "Building size",
          detail: "Finished area, story height, basement, garage, porch, and additions are listed correctly."
        },
        {
          label: "Quality and condition",
          detail: "The record reflects the property as it existed on January 1."
        },
        {
          label: "Outbuildings and features",
          detail: "Detached garages, sheds, barns, paving, decks, pools, and other site features are present or removed correctly."
        },
        {
          label: "Recent changes",
          detail: "Permits, removals, renovations, damage, or corrected use are documented with dates."
        }
      ]
    },
    inspection: {
      title: "A guided record inspection",
      steps: [
        {
          title: "Match the parcel",
          detail: "Confirm you are reviewing the right parcel before reading the value."
        },
        {
          title: "Verify the land",
          detail: "Check size, use, access, location, and classification."
        },
        {
          title: "Verify the improvements",
          detail: "Check structures, square footage, year built, condition, and attached features."
        },
        {
          title: "Mark the issue type",
          detail: "Separate wrong facts from disagreement about market value."
        }
      ]
    },
    issueComparison: {
      title: "Record issue or value issue?",
      intro: "Both can matter. They just lead to different first conversations.",
      items: [
        {
          label: "Record issue",
          examples: [
            "The square footage is wrong.",
            "A garage that was removed is still listed.",
            "Condition or use is out of date."
          ],
          nextStep: "Ask the assessor about correcting the record."
        },
        {
          label: "Value issue",
          examples: [
            "The facts are right but the market value appears high.",
            "Comparable sales point lower.",
            "Income or cost evidence supports a different result."
          ],
          nextStep: "Prepare evidence that speaks to the value."
        }
      ]
    },
    checkpoint: {
      title: "Before you continue...",
      intro: "By this point you should know what to verify before building a valuation argument.",
      items: [
        "Why January 1 controls the assessment snapshot.",
        "Which parcel facts belong in the record.",
        "Whether your concern is a record issue, a value issue, or both."
      ]
    },
    transition: {
      kicker: "Next",
      title: "How the Value Is Built",
      description: "Once the facts are in the right frame, the next question is how the assessor turns land, structures, market evidence, and models into a value.",
      href: "#valueBuilderTitle"
    }
  },
  actThree: {
    kicker: "Act 3",
    title: "How the Value Is Built",
    guidingQuestion: "Where does the number come from?",
    intro: "Assessment value is not one magic input. It is built from property facts, market evidence, appraisal approaches, and countywide models that need to work across many parcels at once.",
    marginInsights: {
      model: {
        label: "Model cue",
        text: "A model can be consistent and still need a corrected record."
      }
    },
    memoryAnchor: {
      text: "Land plus improvements becomes the starting value.",
      supportingText: "The record separates the site from what is built on it. The final assessed value then reflects the applicable appraisal approach and local market evidence.",
      contrast: [
        {
          term: "Land",
          description: "The site, location, use, and physical characteristics."
        },
        {
          term: "Improvements",
          description: "Buildings and other taxable structures or features."
        }
      ]
    },
    buildDiagram: {
      title: "Value build-up diagram",
      steps: [
        {
          label: "Land",
          detail: "Site, location, size, use"
        },
        {
          label: "Improvements",
          detail: "Buildings and taxable features"
        },
        {
          label: "Approach evidence",
          detail: "Sales, cost, or income indications"
        },
        {
          label: "Model review",
          detail: "Calibration and countywide checks"
        },
        {
          label: "Assessed value",
          detail: "The noticed value for the parcel"
        }
      ]
    },
    builder: {
      title: "Value Builder",
      intro: "Open the parts that match your question. Most homeowners do not need every appraisal term, but each term has a job.",
      tabs: [
        {
          id: "land",
          label: "Land",
          title: "The site comes first",
          summary: "Land value reflects the parcel before the building is considered.",
          bullets: [
            "Size, location, access, use, zoning or class, and site influence matter.",
            "Land can change value even when the house does not change."
          ],
          micro: "Site plus location"
        },
        {
          id: "improvements",
          label: "Improvements",
          title: "Improvements are what is built on the land",
          summary: "In assessment language, improvements usually mean taxable buildings, structures, and features, not only remodeling work.",
          bullets: [
            "A house, garage, porch, deck, shed, or outbuilding can be an improvement.",
            "Size, quality, condition, age, and features shape the improvement value."
          ],
          micro: "Buildings and features"
        },
        {
          id: "sales",
          label: "Sales",
          title: "The sales approach listens to the market",
          summary: "Comparable sales help show what similar properties sold for under market conditions.",
          bullets: [
            "Similarity matters more than proximity alone.",
            "Adjustments may be needed for size, age, condition, location, and features."
          ],
          micro: "Market evidence"
        },
        {
          id: "cost",
          label: "Cost",
          title: "The cost approach starts from what it would take to replace the improvements",
          summary: "Cost can be useful when sales are limited, for newer property, or for special-purpose improvements.",
          bullets: [
            "Replacement cost is not the same thing as what the owner paid.",
            "Land value is added separately after improvement cost and depreciation are considered."
          ],
          micro: "Cost less loss"
        },
        {
          id: "income",
          label: "Income",
          title: "The income approach is for income-producing property",
          summary: "Rental or commercial property may be analyzed by the income it can generate, when that approach is applicable.",
          bullets: [
            "Income, expenses, vacancy, and capitalization rates can matter.",
            "This is usually more relevant to commercial and rental property than owner-occupied homes."
          ],
          micro: "Income into value"
        },
        {
          id: "replacement-cost",
          label: "Replacement cost",
          title: "Replacement cost estimates utility, not nostalgia",
          summary: "Replacement cost asks what a similar useful improvement would cost today, not what the original structure cost decades ago.",
          bullets: [
            "Cost manuals, local modifiers, and construction characteristics can feed the estimate.",
            "The estimate still has to be reduced for applicable depreciation."
          ],
          micro: "Current utility"
        },
        {
          id: "depreciation",
          label: "Depreciation",
          title: "Depreciation recognizes loss in value",
          summary: "Age, wear, condition, layout, functional issues, and external influences can reduce improvement value.",
          bullets: [
            "Depreciation is not only physical age.",
            "A corrected condition rating can change the analysis."
          ],
          micro: "Loss from new"
        },
        {
          id: "mass-appraisal",
          label: "CAMA and mass appraisal",
          title: "Mass appraisal values groups consistently",
          summary: "Computer-assisted mass appraisal helps apply appraisal logic across many properties instead of hand-appraising one parcel at a time.",
          bullets: [
            "The model depends on accurate property records and market data.",
            "Consistency across groups does not eliminate parcel-specific review."
          ],
          micro: "Groups, then parcels"
        },
        {
          id: "data-sources",
          label: "Data sources",
          title: "The model is only as good as the data it can use",
          summary: "Property records, sales files, permits, maps, inspections, and reported income or cost information can all support the valuation process.",
          bullets: [
            "Missing or stale facts can travel through the value.",
            "Better evidence helps the assessor and board focus on the right issue."
          ],
          micro: "Facts feed value"
        }
      ]
    },
    secondaryAnchor: {
      text: "Mass appraisal values groups. Protests review parcels.",
      supportingText: "The model is designed for consistency across many properties. A protest is where a specific parcel's facts and evidence can be reviewed directly."
    },
    checkpoint: {
      title: "Before you continue...",
      intro: "By this point the value should feel built, not mysterious.",
      items: [
        "Land and improvements form the starting structure.",
        "Sales, cost, and income are appraisal approaches, not separate tax systems.",
        "Mass appraisal works across groups, while parcel review still matters."
      ]
    },
    transition: {
      kicker: "Next",
      title: "How Fairness Is Checked and Challenged",
      description: "After the value is built, the next question is whether similar properties are being treated similarly and what to do if your parcel still looks wrong.",
      href: "#fairnessTitle"
    }
  },
  actFour: {
    kicker: "Act 4",
    title: "How Fairness Is Checked and Challenged",
    guidingQuestion: "Are similar properties being treated similarly?",
    intro: "Fairness has two related meanings. Equalization looks across groups of property. A protest reviews one parcel after evidence is presented for that parcel.",
    marginInsights: {
      parcel: {
        label: "Fairness cue",
        text: "Countywide fairness does not prove one parcel's value."
      },
      protest: {
        label: "Review cue",
        text: "Equalization compares many properties. A protest reviews one."
      },
      calendar: {
        label: "Calendar cue",
        text: "The protest window is short because the tax calendar keeps moving."
      }
    },
    comparison: {
      title: "Equalization vs protest",
      items: [
        {
          label: "Equalization",
          scope: "Many properties",
          question: "Are similar properties being treated similarly?",
          evidence: "Ratios, classes, market areas, neighborhoods, and assessment levels.",
          outcome: "Group-level review or adjustment."
        },
        {
          label: "Protest",
          scope: "One parcel",
          question: "Is this parcel's assessed value supported?",
          evidence: "Property facts, comparable sales, income or cost information, and parcel-specific conditions.",
          outcome: "A decision on the protested parcel."
        }
      ]
    },
    protestPath: {
      title: "The protest path",
      intro: "The formal path is easier to follow after the first two acts: check the record, identify the issue, then decide whether evidence supports a requested value change.",
      steps: [
        {
          label: "Notice",
          detail: "Value changed or was reported."
        },
        {
          label: "Record review",
          detail: "Confirm the property facts."
        },
        {
          label: "Evidence",
          detail: "Gather support for the specific correction."
        },
        {
          label: "Protest",
          detail: "File during the required window if needed."
        },
        {
          label: "Board review",
          detail: "County Board of Equalization reviews the parcel."
        },
        {
          label: "Decision",
          detail: "The record and value move forward or appeal rights may apply."
        }
      ]
    },
    optionalMetrics: {
      title: "For readers who want the metrics",
      summary: "COD and PRD are useful equalization metrics, but they are not required reading for understanding your notice.",
      content: [
        "The coefficient of dispersion, often called COD, helps describe how tightly assessment ratios cluster around a typical ratio.",
        "The price-related differential, often called PRD, helps flag whether higher-value and lower-value properties may be treated differently as a group.",
        "Those metrics can support countywide equalization work. They do not, by themselves, prove the correct value of one parcel."
      ]
    },
    companion: {
      title: "Before You Walk Into a Property Protest",
      description: "Use the companion guide when you move from understanding the system to preparing a clear, evidence-based request.",
      hrefKey: "protestGuide",
      action: "Open the protest guide"
    },
    checkpoint: {
      title: "Before you continue...",
      intro: "By this point you should know which fairness question you are asking.",
      items: [
        "Equalization is group fairness.",
        "A protest is parcel-specific review.",
        "Advanced statistics help system review, but parcel evidence still matters."
      ]
    },
    transition: {
      kicker: "Next",
      title: "How Value Becomes Taxes",
      description: "The final act leaves valuation and follows the number through budgets, levies, taxing districts, and the eventual tax bill.",
      href: "#taxFlowTitle"
    }
  },
  actFive: {
    kicker: "Act 5",
    title: "How Value Becomes Taxes",
    guidingQuestion: "How does the value become a tax bill?",
    intro: "Value matters, but it is not the whole bill. Assessments distribute each parcel's share of the tax base. Budgets establish how much revenue taxing authorities need. Levies translate that revenue need into rates.",
    marginInsights: {
      budgets: {
        label: "Tax cue",
        text: "Budgets determine revenue. Levies distribute it."
      }
    },
    memoryAnchor: {
      text: "Assessments estimate value. Levies distribute budgets.",
      supportingText: "The tax bill sits at the intersection of your parcel's value share, the budgets adopted by overlapping taxing authorities, and the levy rates that apply in your tax district.",
      contrast: [
        {
          term: "Assessment",
          description: "Estimates value and value share."
        },
        {
          term: "Levy",
          description: "Distributes an approved revenue need."
        }
      ]
    },
    flow: {
      title: "Value to tax flow",
      steps: [
        {
          label: "Assessment",
          detail: "Your parcel receives an assessed value."
        },
        {
          label: "Budget",
          detail: "Each taxing authority sets a revenue need."
        },
        {
          label: "Levy",
          detail: "The revenue need is translated into a tax rate."
        },
        {
          label: "Tax district",
          detail: "Overlapping authorities combine for your location."
        },
        {
          label: "Tax bill",
          detail: "The treasurer's statement reflects value, rates, and authorities."
        }
      ]
    },
    keyIdea: {
      title: "A higher value does not automatically mean the same tax increase.",
      description: "If many values rise, if budgets change, or if levies compress, the bill can move differently than the notice suggests. The notice is a warning light to review value, not a final tax calculator."
    },
    yearStrip: {
      title: "Year at a glance",
      events: [
        {
          label: "Jan 1",
          detail: "Valuation snapshot date."
        },
        {
          label: "Spring",
          detail: "Records, sales, and values are reviewed."
        },
        {
          label: "Early summer",
          detail: "Valuation notices and protest window."
        },
        {
          label: "Summer",
          detail: "County Board of Equalization review."
        },
        {
          label: "Fall",
          detail: "Budgets and levies move into the tax process."
        },
        {
          label: "Later",
          detail: "Tax statements reflect the applicable district and levy."
        }
      ]
    },
    synthesis: {
      title: "Put the whole path together",
      text: "The first notice does not answer the final tax question. It starts a sequence: check the record, understand the value, know the fairness review path, then follow the budget and levy process that creates the bill."
    },
    accuracy: {
      text: "Accuracy compounds.",
      supportingText: "A wrong parcel fact can affect the value. A wrong value can affect share. A misunderstood office can cost time during a short window. The earlier the record is right, the clearer every later question becomes."
    },
    checkpoint: {
      title: "Before you finish...",
      intro: "By this point you should be able to explain the tax story without collapsing it into one step.",
      items: [
        "Assessments distribute value share.",
        "Budgets create the revenue need.",
        "Levies translate that need into rates for overlapping tax districts."
      ]
    },
    nextSteps: {
      title: "Reader next steps",
      items: [
        "Find the valuation notice and open the property record.",
        "Check January 1 facts before debating the final number.",
        "Decide whether the issue is record accuracy, value evidence, or tax levy understanding.",
        "Use the companion guides when the question needs deeper treatment."
      ]
    }
  },
  continueExploring: {
    title: "Continue exploring",
    intro: "This article is the hub. These tools and companion guides handle the parts that deserve a deeper workflow.",
    cards: [
      {
        title: "Guided Parcel Review",
        eyebrow: "Tool",
        description: "Review parcel context, assessment patterns, and local evidence inside the interactive project.",
        hrefKey: "guidedParcelReview",
        action: "Open the review tool"
      },
      {
        title: "Before You Walk Into a Property Protest",
        eyebrow: "Companion guide",
        description: "Turn a value concern into a specific, evidence-based request.",
        hrefKey: "protestGuide",
        action: "Read the protest guide"
      },
      {
        title: "Assessment Up. Protest Denied. Taxes?",
        eyebrow: "Case study",
        description: "See how a value increase can move differently from the final tax bill.",
        hrefKey: "protestParadox",
        action: "Read the case study"
      },
      {
        title: "How to Read a Property Record Card",
        eyebrow: "Future guide",
        description: "A field-by-field walkthrough for checking record facts before arguing value.",
        status: "Planned"
      },
      {
        title: "How to Choose Comparable Properties",
        eyebrow: "Future guide",
        description: "A practical guide to selecting sales that actually support a valuation argument.",
        status: "Planned"
      },
      {
        title: "Value-to-tax scenario calculator",
        eyebrow: "Future tool",
        description: "Explore how values, budgets, levy changes, and tax districts can interact.",
        status: "Planned"
      }
    ]
  },
  resourcesBlock: {
    title: "Resources and authorities",
    intro: "Sparse source links are included where they strengthen the legal and technical foundation of the guide.",
    groups: [
      {
        heading: "Nebraska legal anchors",
        items: [
          {
            title: "Nebraska Constitution Article VIII, Section 1",
            description: "Uniformity and proportionality foundation for property taxation.",
            urlKey: "nebraskaConstitutionArticleVIII1",
            type: "Legal authority"
          },
          {
            title: "Neb. Rev. Stat. 77-112",
            description: "Nebraska definition of actual value and valuation considerations.",
            urlKey: "nebraskaStatute77112",
            type: "Legal authority"
          },
          {
            title: "Neb. Rev. Stat. 77-1301",
            description: "Assessment date and listing framework for real property.",
            urlKey: "nebraskaStatute771301",
            type: "Legal authority"
          },
          {
            title: "Neb. Rev. Stat. 77-1315",
            description: "Notice of valuation change.",
            urlKey: "nebraskaStatute771315",
            type: "Legal authority"
          },
          {
            title: "Neb. Rev. Stat. 77-1502",
            description: "County Board of Equalization protest review.",
            urlKey: "nebraskaStatute771502",
            type: "Legal authority"
          },
          {
            title: "Neb. Rev. Stat. 77-1601",
            description: "County levy authority.",
            urlKey: "nebraskaStatute771601",
            type: "Legal authority"
          }
        ]
      },
      {
        heading: "Assessment guidance",
        items: [
          {
            title: "Title 350, Chapter 10 - Real Property",
            description: "Nebraska Department of Revenue real property assessment regulations.",
            urlKey: "title350Chapter10",
            type: "Assessment guidance"
          },
          {
            title: "Property Tax Administrator Reports and Opinions",
            description: "State review materials used for county assessment and equalization context.",
            urlKey: "padReportsOpinions2026",
            type: "PAD report"
          },
          {
            title: "IAAO standards and mass appraisal practice",
            description: "Professional practice context for mass appraisal, ratio studies, and model review.",
            type: "Practice basis"
          }
        ]
      },
      {
        heading: "GES companion material",
        items: [
          {
            title: "Before You Walk Into a Property Protest",
            description: "Companion guide for turning a concern into evidence.",
            urlKey: "protestGuide",
            type: "Companion guide"
          },
          {
            title: "Assessment Up. Protest Denied. Taxes?",
            description: "Case study on value movement, levy compression, and tax outcomes.",
            urlKey: "protestParadox",
            type: "Case study"
          }
        ]
      }
    ]
  }
};
