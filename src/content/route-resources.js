const resourcesByView = {
  "landing-primer": {
    faqTitle: "Getting oriented FAQs",
    formTitle: "Optional resources",
    learnTitle: "Assessment basics",
    faqs: [
      ["What should I do first?", "Confirm that you are looking at the right property, then review the record before interpreting values or taxes."],
      ["Is this telling me to protest?", "No. The primary goal is orientation and understanding. Official filing materials remain outbound references."],
      ["Why are some current-year values pending?", "Assessment-year information can appear before final tax bills or complete current-year values are available."],
      ["What if the question is only about the tax bill?", "Use Tax Context after the property, value, and equalization steps frame the value base."]
    ],
    learn: [
      ["Assessment year", "The year for which the property value is being reviewed."],
      ["Assessed value", "The value used as the basis for property taxation."],
      ["Prior value", "The most recent earlier value available for comparison."],
      ["Review deadline", "A procedural date that should be confirmed with official sources before any filing."]
    ]
  },
  "your-property": {
    faqTitle: "Property record FAQs",
    formTitle: "Property record forms",
    learnTitle: "Property record terms",
    faqs: [
      ["What should I check first?", "Start with ownership, situs address, legal description, dwelling facts, improvements, condition, and photos. Factual record issues can affect later value review."],
      ["Do bedrooms, bathrooms, condition, and square footage matter?", "Yes. Those characteristics help describe the property and can influence the assessment model."],
      ["What if a photo or property characteristic looks outdated?", "Use the record review request to describe what appears inaccurate, incomplete, or misclassified."],
      ["Is a record concern the same as a valuation protest?", "No. A record concern asks for factual review. A formal valuation protest is a separate filing process."]
    ],
    learn: [
      ["Parcel", "A specific piece of property identified for assessment and tax administration."],
      ["Situs address", "The physical location address associated with the property."],
      ["Legal description", "The formal land description used in property records."],
      ["Property record card", "The assessor record that summarizes parcel facts, land, buildings, and value details."]
    ]
  },
  "your-assessment": {
    faqTitle: "Assessment FAQs",
    formTitle: "Assessment forms",
    learnTitle: "Assessment terms",
    faqs: [
      ["Is assessed value the same as market value?", "For most residential real property, assessed value is intended to reflect market value as of the assessment date."],
      ["Why are land and improvement values separated?", "Separating land from buildings helps show which part of the property model changed."],
      ["Why did the value change?", "Value can change because of updated property facts, market movement, depreciation, new construction, or sale evidence."],
      ["How does market evidence matter?", "Sales evidence helps explain whether assessments are moving with the market."]
    ],
    learn: [
      ["Assessed value", "The value used as the property basis for taxation."],
      ["Land value", "The assessed portion attributed to the site itself."],
      ["Improvement value", "The assessed portion attributed to buildings and other improvements."],
      ["Mass appraisal", "A method of valuing many properties with common data, models, and market evidence."]
    ]
  },
  "your-taxes": {
    faqTitle: "Tax FAQs",
    formTitle: "Tax and exemption forms",
    learnTitle: "Tax terms",
    faqs: [
      ["Why does tax context come after equalization?", "Equalization checks the value base for required level and reasonable uniformity. Tax context then shows how levies, credits, exemptions, and boundaries turn that value base into a bill."],
      ["What is the difference between gross tax and net tax?", "Gross tax starts from value and levy. Net tax reflects applicable credits and adjustments before payment status is applied."],
      ["Why do value and taxes not always move together?", "Taxes also depend on budgets, levies, exemptions, credits, and tax district changes."],
      ["What does effective tax rate show?", "It divides statement net tax by assessed value so different years can be compared more clearly."],
      ["Where do credits fit?", "Credits reduce the final amount due after the tax calculation is applied."]
    ],
    learn: [
      ["Levy", "The tax rate applied by taxing entities to taxable value."],
      ["Gross tax", "The tax amount before credits or similar reductions."],
      ["Tax credit", "A reduction applied to the calculated tax bill."],
      ["Effective tax rate", "Net taxes divided by assessed value for comparison across years."]
    ]
  },
  "market-area": {
    faqTitle: "Market area FAQs",
    formTitle: "Market review forms",
    learnTitle: "Market terms",
    faqs: [
      ["What is a market area?", "It is a group of properties reviewed together because they share market or valuation characteristics."],
      ["Are nearby sales exact matches?", "Usually no. Sales are market evidence because they are reasonably related to the same local market."],
      ["What do local sales trends show?", "They help explain whether values are moving with nearby market evidence."],
      ["What is a ratio study?", "It compares assessed values with sale prices to test assessment level and uniformity."]
    ],
    learn: [
      ["Market area", "A local comparison group used to review properties with similar market behavior."],
      ["Sale evidence", "Sale information used to understand market value and assessment level."],
      ["Sales ratio", "Assessed value divided by sale price."],
      ["Valuation group", "A grouping used to organize assessment analysis and market review."]
    ]
  },
  "county-equalization": {
    faqTitle: "Equalization FAQs",
    formTitle: "Equalization resources",
    learnTitle: "Equalization terms",
    faqs: [
      ["Why does equalization sit before taxes?", "It checks whether the value base is at the required level and reasonably uniform before levies are applied."],
      ["What does equalization not do?", "It does not stop market values from moving, set the tax levy, or decide whether one parcel outcome is right or wrong."],
      ["What do COD and PRD measure?", "COD describes assessment uniformity. PRD helps flag whether high- and low-value properties are treated consistently."],
      ["Can countywide measures prove the parcel value is wrong?", "Not by themselves. They are context; parcel facts and market evidence still matter."]
    ],
    learn: [
      ["Equalization", "The check that reviews assessment level and uniformity before levies are applied."],
      ["COD", "Coefficient of dispersion, a measure of assessment uniformity."],
      ["PRD", "Price-related differential, a measure used to review value-related assessment patterns."],
      ["Level of value", "How assessed values compare with market value overall."]
    ]
  },
  "state-context": {
    faqTitle: "State context FAQs",
    formTitle: "State-related forms",
    learnTitle: "State context terms",
    faqs: [
      ["What does the Property Assessment Division do?", "Nebraska's Property Assessment Division helps frame statewide assessment oversight and comparison."],
      ["How do state assessment reports help?", "They summarize county sales studies and equalization information used for statewide context."],
      ["What is statewide equalization?", "It is the state-level role of reviewing whether county assessments meet required standards."],
      ["Are credits decided here?", "No. Official credits and tax calculations are applied through the tax process."]
    ],
    learn: [
      ["Property Assessment Division", "The state office that helps oversee property assessment standards in Nebraska."],
      ["Abstract", "A county summary of assessed property values reported for review."],
      ["State assessment reports", "Reports that summarize county sales studies and equalization findings."],
      ["Statewide equalization", "State review of assessment levels across counties."]
    ]
  },
  "review-checklist": {
    faqTitle: "Review FAQs",
    formTitle: "Review resources",
    learnTitle: "Review terms",
    faqs: [
      ["What should I review first?", "Start with the property record: square footage, year built, basement, garage, outbuildings, condition, lot size, property class, value history, and tax history."],
      ["What should I do with an unresolved question?", "Keep notes, verify official source documents, and contact the appropriate county or state office if the issue depends on official records or deadlines."],
      ["What steps feed these signals?", "They synthesize the property record, value movement, equalization context, tax context, and source documents."],
      ["Where are filing forms kept?", "The Forms footer links to official state sources. This site does not prepare, prefill, submit, or store filing forms."],
      ["Does this summary decide an outcome?", "No. It is a review aid that separates property facts, value movement, taxes, and context from any official filing decision."]
    ],
    learn: [
      ["Record concern", "A factual review request about property record details."],
      ["Official form", "A form published by the Nebraska Department of Revenue or another official public office."],
      ["Protest window", "The formal period for filing a valuation protest."],
      ["Source document", "An official record, report, tax statement, or form used to verify a claim."]
    ]
  }
};

const resourceAliases = {
  "property-record": "your-property",
  "what-changed": "your-assessment",
  "valuation-detail": "market-area",
  "equalization": "county-equalization",
  "tax-context": "your-taxes",
  "review-signals": "review-checklist",
  "final-summary": "review-checklist"
};

export { resourceAliases, resourcesByView };
