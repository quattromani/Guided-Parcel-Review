const resourcesByView = {
  "your-property": {
    faqTitle: "Property record FAQs",
    formTitle: "Property record forms",
    faqs: [
      ["What should I check first?", "Start with ownership, situs address, legal description, dwelling facts, improvements, condition, and photos. Factual record issues can affect later value review."],
      ["Do bedrooms, bathrooms, condition, and square footage matter?", "Yes. Those characteristics help describe the property and can influence the assessment model."],
      ["What if a photo or property characteristic looks outdated?", "Use the record review request to describe what appears inaccurate, incomplete, or misclassified."]
    ]
  },
  "your-assessment": {
    faqTitle: "Assessment FAQs",
    formTitle: "Assessment forms",
    faqs: [
      ["Is assessed value the same as market value?", "For most residential real property, assessed value is intended to reflect market value as of the assessment date."],
      ["Why are land and improvement values separated?", "Separating land from buildings helps show which part of the property model changed."],
      ["Why did the value change?", "Value can change because of updated property facts, market movement, depreciation, new construction, or sale evidence."],
      ["How does market evidence matter?", "Sales evidence helps explain whether assessments are moving with the market."]
    ]
  },
  "your-taxes": {
    faqTitle: "Tax FAQs",
    formTitle: "Tax and exemption forms",
    faqs: [
      ["Why does tax context come after equalization?", "Equalization checks whether assessments are at the required level and applied consistently. Tax context then shows how levies, credits, exemptions, and tax-district assignment affect the bill."],
      ["What is the difference between gross tax and net tax?", "Gross tax starts from value and levy. Net tax reflects applicable credits and adjustments before payment status is applied."],
      ["Why do value and taxes not always move together?", "Taxes also depend on budgets, levies, exemptions, credits, and tax district changes."],
      ["What does effective tax rate show?", "It divides statement net tax by assessed value so different years can be compared more clearly."],
      ["Where do credits fit?", "Credits reduce the final amount due after the tax calculation is applied."]
    ]
  },
  "market-area": {
    faqTitle: "Market area FAQs",
    formTitle: "Market review forms",
    faqs: [
      ["What is a market area?", "It is a group of properties reviewed together because they share market or valuation characteristics."],
      ["Are nearby sales exact matches?", "Usually no. Sales are market evidence because they are reasonably related to the same local market."],
      ["What do local sales trends show?", "They help explain whether values are moving with nearby market evidence."],
      ["What is a ratio study?", "It compares assessed values with sale prices to test assessment level and uniformity."]
    ]
  },
  "county-equalization": {
    faqTitle: "Equalization FAQs",
    formTitle: "Equalization resources",
    faqs: [
      ["Why does equalization sit before taxes?", "It checks whether assessments are at the required level and applied consistently before levies are applied."],
      ["What does equalization not do?", "It does not stop market values from moving, set the tax levy, or decide whether one parcel outcome is right or wrong."],
      ["What do COD and PRD measure?", "COD describes assessment uniformity. PRD helps flag whether high- and low-value properties are treated consistently."],
      ["Can countywide measures prove the parcel value is wrong?", "Not by themselves. They are context; parcel facts and market evidence still matter."]
    ]
  },
  "state-context": {
    faqTitle: "State context FAQs",
    formTitle: "State-related forms",
    faqs: [
      ["What does the Property Assessment Division do?", "Nebraska's Property Assessment Division helps frame statewide assessment oversight and comparison."],
      ["How do state assessment reports help?", "They summarize county sales studies and equalization information used for statewide context."],
      ["What is statewide equalization?", "It is the state-level role of reviewing whether county assessments meet required standards."],
      ["Are credits decided here?", "No. Official credits and tax calculations are applied through the tax process."]
    ]
  },
  "review-checklist": {
    faqTitle: "Review FAQs",
    formTitle: "Review resources",
    faqs: [
      ["What should I review first?", "Start with the property record: square footage, year built, basement, garage, outbuildings, condition, lot size, property class, value history, and tax history."],
      ["What should I do with an unresolved question?", "Keep notes, verify official source documents, and contact the appropriate county or state office if the issue depends on official records or deadlines."],
      ["What steps feed these signals?", "They come from the property record, value movement, equalization measures, tax context, and source documents."],
      ["Does this summary decide an outcome?", "No. It is a review aid. It separates property facts, value movement, taxes, and context."]
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
