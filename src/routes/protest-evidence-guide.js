import { escapeHtml } from "../utils/html.js";

const RESOURCES = [
  {
    label: "Gage County GIS / Property Record Lookup",
    icon: "property",
    description: "Find the property record card for your parcel and for any comparable properties you plan to discuss.",
    url: "https://report.gworks.com/report.ashx?county=gage&type=assessor"
  },
  {
    label: "Gage County Sales Comparison Map",
    icon: "map",
    description: "Start here when looking for recent sales that may have competed with your property in the market.",
    url: "https://experience.arcgis.com/experience/67492767fb8d49a8b321d14022d24e81"
  },
  {
    label: "Nebraska Property Valuation Protest Form 422",
    icon: "form",
    description: "Use the official Nebraska form and confirm the deadline, signature, and filing requirements with the county.",
    url: "https://revenue.nebraska.gov/sites/default/files/doc/pad/forms/422_Property_Valuation_Protest.pdf"
  }
];

const PROCESS_STEPS = [
  ["Find", "2-3 good comparable properties"],
  ["Compare", "the property records"],
  ["Document", "the specific difference"],
  ["Request", "one clear correction"]
];

const HARD_REQUESTS = [
  "My taxes are too high.",
  "This feels unfair.",
  "My value went up too much."
];

const BETTER_REQUESTS = [
  "My record lists two fireplaces, but I have one.",
  "My finished basement area appears overstated.",
  "My condition rating appears inconsistent with comparable records."
];

const GOOD_COMP_TRAITS = [
  "location",
  "style",
  "age",
  "size",
  "condition",
  "quality",
  "lot size",
  "major features"
];

const WEAK_COMP_SIGNALS = [
  "very different size",
  "different property type",
  "major improvements yours does not have",
  "different market area",
  "unusual sale conditions, if known"
];

const RECORD_FACTS = [
  "Living area",
  "Quality",
  "Condition",
  "Lot size",
  "Garage",
  "Basement",
  "Fireplaces",
  "Outbuildings",
  "Comparable sales",
  "Land characteristics"
];

const RECORD_CALLOUT_ROWS = [
  ["Living area", "Compare this"],
  ["Condition", "Compare this"],
  ["Quality", "Compare this"],
  ["Basement finish", "Check this"],
  ["Garage", "Measure if wrong"],
  ["Fireplaces", "Photograph if wrong"],
  ["Outbuildings", "Photograph if missing"],
  ["Land size", "Match this to the request"]
];

const EVIDENCE_EXAMPLES = [
  [
    "Photos show sealed fireplace",
    "record lists functional fireplace",
    "request fireplace correction"
  ],
  [
    "Measurements show smaller living area",
    "record shows larger square footage",
    "request square footage review"
  ],
  [
    "Comparable records show similar homes rated Average",
    "subject is rated Good",
    "request condition adjustment"
  ],
  [
    "Basement is only partly finished",
    "record lists full finish",
    "request basement finish correction"
  ],
  [
    "Old shed was removed",
    "record still lists outbuilding",
    "request outbuilding removal"
  ],
  [
    "Photos show a different major feature",
    "record describes the wrong feature, size, or type",
    "request physical-characteristic correction"
  ]
];

const EVIDENCE_COLUMNS = [
  "What you noticed",
  "What the record says",
  "What to ask for"
];

function paragraph(text) {
  return `<p>${escapeHtml(text)}</p>`;
}

function listMarkup(items) {
  return `
    <ul>
      ${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function resourceIcon(type) {
  const icons = {
    property: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>
        <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      </svg>
    `,
    map: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.382V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"></path>
        <path d="M15 5.764v15"></path>
        <path d="M9 3.236v15"></path>
      </svg>
    `,
    form: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"></path>
        <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
        <path d="M10 9H8"></path>
        <path d="M16 13H8"></path>
        <path d="M16 17H8"></path>
      </svg>
    `
  };

  return `<span class="protest-guide-resource-icon">${icons[type] ?? icons.form}</span>`;
}

function sectionHeader(kicker, title, id) {
  return `
    <header class="tax-article-header editorial-section-header">
      <p class="guided-kicker">${escapeHtml(kicker)}</p>
      <h2 id="${escapeHtml(id)}">${escapeHtml(title)}</h2>
    </header>
  `;
}

function renderDisconnectFigure() {
  const items = [
    ["Homeowner thinks", "My value is too high."],
    ["Board needs", "What should change?"],
    ["Evidence-supported request", "Here is the proof. Here is the correction."]
  ];

  return `
    <figure class="concept-card concept-diagram disconnect-visual" aria-labelledby="disconnectTitle">
      <figcaption id="disconnectTitle">The disconnect</figcaption>
      <div>
        ${items.map(([label, text]) => `
          <article>
            <span>${escapeHtml(label)}</span>
            <p>${escapeHtml(text)}</p>
          </article>
        `).join("")}
      </div>
    </figure>
  `;
}

function renderProcessStrip() {
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section article-section-visual" aria-labelledby="processTitle">
      ${sectionHeader("Roadmap", "The whole process in four moves", "processTitle")}
      <ol class="process-strip" aria-label="Property protest preparation process">
        ${PROCESS_STEPS.map(([verb, detail]) => `
          <li>
            <div class="process-step-heading">
              <span>${escapeHtml(verb)}</span>
            </div>
            <p>${escapeHtml(detail)}</p>
          </li>
        `).join("")}
      </ol>
    </section>
  `;
}

function renderOpeningSection() {
  return `
    <section class="tax-article-section tax-story-chapter tax-article-opening levy-wide-panel article-section" aria-labelledby="protestOpeningTitle">
      <div class="editorial-narrow">
        ${sectionHeader("Homeowner Guide", "The pattern shows up quickly", "protestOpeningTitle")}
        ${paragraph("Spend a day observing property protest hearings and a rhythm starts to appear. Homeowners come forward one after another. Most are sincere. Most have paid attention to their home. Most believe something about the assessment is wrong.")}
        ${paragraph("Then the Board asks the practical question that sits underneath almost every hearing: what can we verify?")}
        ${paragraph("That is where many protests lose their footing. The homeowner may be right that something feels off. But without photographs, measurements, repair estimates, record cards, or comparable properties, the Board has little it can act on.")}
      </div>
      ${renderDisconnectFigure()}
      <aside class="guided-transition protest-guide-takeaway pull-quote">
        <p>Don't walk into a protest asking for justice. Walk in asking for the record to be corrected.</p>
      </aside>
      <div class="editorial-narrow">
        ${paragraph("That is a narrower request. It is also a stronger one. A property protest is not mainly about proving that taxes are too high. It is about showing, with specific evidence, that the property record or assessed value should be corrected.")}
      </div>
    </section>
  `;
}

function renderWhyProtestsFailSection() {
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" aria-labelledby="protestFailTitle">
      <div class="editorial-narrow">
        ${sectionHeader("The First Question", "Why do sincere protests fail?", "protestFailTitle")}
        ${paragraph("Usually not because the homeowner is careless. More often, the protest asks the Board to solve the wrong problem.")}
        ${paragraph("\"Just look at my house\" may be an honest reaction. So is \"there is no way it is worth that.\" But a hearing cannot inspect a feeling. It needs something it can compare, measure, confirm, or correct.")}
      </div>
      <figure class="comparison-card" aria-labelledby="requestCompareTitle">
        <figcaption id="requestCompareTitle">Sincerity is not the same thing as usable evidence</figcaption>
        <div>
          <section>
            <h3>Hard for the Board to act on</h3>
            ${listMarkup(HARD_REQUESTS)}
          </section>
          <section>
            <h3>Easier for the Board to evaluate</h3>
            ${listMarkup(BETTER_REQUESTS)}
          </section>
        </div>
      </figure>
      <div class="editorial-narrow">
        ${paragraph("This is where the homeowner's role changes. You do not need to become an appraiser. You need to become a good witness. Witnesses observe, document, and explain what their evidence shows.")}
      </div>
    </section>
  `;
}

function renderBoardQuestionSection() {
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" aria-labelledby="protestBoardTitle">
      <div class="editorial-narrow">
        ${sectionHeader("The Board's Job", "What is the Board actually deciding?", "protestBoardTitle")}
        ${paragraph("The Board is not there to decide whether a tax bill feels heavy. It is not there to debate public budgets. It is not there to punish or defend the assessor.")}
      </div>
      <figure class="decision-panel" aria-labelledby="decisionPanelTitle">
        <figcaption id="decisionPanelTitle">The Board's practical question</figcaption>
        <div class="decision-question">Does the evidence support a correction?</div>
        <div class="decision-outcomes">
          <p><strong>Yes</strong><span>What correction?</span></p>
          <p><strong>No</strong><span>Current record likely remains.</span></p>
        </div>
        <p class="note-box">This is a cognitive aid, not a guarantee of outcome. The Board still controls the decision under the applicable process.</p>
      </figure>
      <div class="editorial-narrow">
        ${paragraph("That smaller question keeps the hearing focused on facts that can be checked instead of opinions that cannot be resolved. A good witness does not say, \"This is unfair.\" A good witness says, \"My property record shows two fireplaces. My home has one.\"")}
      </div>
    </section>
  `;
}

function renderComparableSection() {
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" aria-labelledby="protestCompsTitle">
      <div class="editorial-narrow">
        ${sectionHeader("Comparable Properties", "What makes a comparable useful?", "protestCompsTitle")}
        ${paragraph("A comparable property is not just a nearby house with a lower value. The better question is whether that home would have genuinely competed with yours in the marketplace.")}
      </div>
      <figure class="scorecard" aria-labelledby="scorecardTitle">
        <figcaption id="scorecardTitle">Comparable property scorecard</figcaption>
        <div>
          <section>
            <h3>A good comp is similar in</h3>
            ${listMarkup(GOOD_COMP_TRAITS)}
          </section>
          <section>
            <h3>Weak comp signals</h3>
            ${listMarkup(WEAK_COMP_SIGNALS)}
          </section>
        </div>
      </figure>
      <div class="editorial-narrow">
        ${paragraph("Three strong comparables are usually more persuasive than fifteen weak ones. A short set of good matches lets the Board see the pattern. A long set of loose matches often makes the real point harder to find.")}
        ${paragraph("Use the sales map or sales search to find candidates (link below). Then slow down. Pull the property record cards. The sale price may get your attention, but the record facts tell you whether the comparison belongs in the packet.")}
      </div>
    </section>
  `;
}

function renderValueLayerFigure() {
  return `
    <figure class="value-layer-figure" aria-labelledby="valueLayerTitle">
      <figcaption id="valueLayerTitle">Value is the conclusion. The record is where the evidence starts.</figcaption>
      <div class="value-layer-top">
        <strong>Assessed Value</strong>
        <span>= conclusion</span>
      </div>
      <ul>
        ${RECORD_FACTS.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </figure>
  `;
}

function renderRecordCallout() {
  return `
    <figure class="record-callout" aria-labelledby="recordCalloutTitle">
      <figcaption id="recordCalloutTitle">A simplified record card: where to look first</figcaption>
      <dl>
        ${RECORD_CALLOUT_ROWS.map(([field, action]) => `
          <div>
            <dt>${escapeHtml(field)}</dt>
            <dd>${escapeHtml(action)}</dd>
          </div>
        `).join("")}
      </dl>
    </figure>
  `;
}

function renderRecordsSection() {
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" aria-labelledby="protestRecordsTitle">
      <div class="editorial-narrow">
        ${sectionHeader("Property Records", "Why does the record matter more than the value?", "protestRecordsTitle")}
        <p class="article-emphasis">The assessed value is not the evidence. It is the conclusion.</p>
      </div>
      ${renderValueLayerFigure()}
      <div class="editorial-narrow">
        ${paragraph("Compare your property record with the records for your comparables. Do not stop at the total assessed value. Ask what facts are driving that value.")}
        ${paragraph("Maybe your home and a comparable are similar, but your record shows more finished basement. Maybe the comparable has a larger garage. Maybe your condition rating is higher even though the homes appear similar. Those differences are where useful questions begin.")}
      </div>
      ${renderRecordCallout()}
      <div class="editorial-narrow">
        ${paragraph("But be careful: the Board cannot fix one error by making another. If a comparable looks like a good match but its record is wrong, the answer may not be to change your value to match that mistake. The better question may be: which record is incorrect, and what evidence shows the correction?")}
      </div>
    </section>
  `;
}

function renderEvidenceSection() {
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" aria-labelledby="protestEvidenceTitle">
      <div class="editorial-narrow">
        ${sectionHeader("Evidence to Request", "How do you turn evidence into one correction?", "protestEvidenceTitle")}
        ${paragraph("Keep the path short. What you noticed should connect directly to what the record says and what you are asking to correct.")}
      </div>
      <figure class="evidence-matrix" aria-labelledby="evidenceMatrixTitle">
        <figcaption id="evidenceMatrixTitle">Evidence -> Record issue -> Requested correction</figcaption>
        <ol class="evidence-path-list">
          ${EVIDENCE_EXAMPLES.map(row => `
            <li>
              ${row.map((cell, index) => `
                <section>
                  <h3>${escapeHtml(EVIDENCE_COLUMNS[index])}</h3>
                  <p>${escapeHtml(cell)}</p>
                </section>
              `).join("")}
            </li>
          `).join("")}
        </ol>
      </figure>
      <div class="editorial-narrow">
        ${paragraph("The important part is the connection. A photo by itself is helpful. A record card by itself is helpful. Together, they become evidence of a specific correction.")}
      </div>
    </section>
  `;
}

function renderOrganizationSection() {
  const steps = [
    ["What appears incorrect?", "Name the record fact or value issue as plainly as possible."],
    ["What evidence supports that?", "Attach the photo, measurement, estimate, record card, sale record, or comparable record that helps verify it."],
    ["What correction are you requesting?", "Ask for the specific record or value adjustment you want the Board to consider."]
  ];

  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" aria-labelledby="protestOrganizeTitle">
      <div class="editorial-narrow">
        ${sectionHeader("Organizing the Protest", "What should the packet say?", "protestOrganizeTitle")}
        ${paragraph("You do not need a complicated argument. You need a clean sequence the Board can follow.")}
      </div>
      <ol class="question-checklist">
        ${steps.map(([title, text]) => `
          <li>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(text)}</p>
          </li>
        `).join("")}
      </ol>
      <aside class="guided-transition protest-guide-takeaway pull-quote">
        <p>A clear protest is not louder. It is easier to verify.</p>
      </aside>
    </section>
  `;
}

function renderHearingSection() {
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" aria-labelledby="protestHearingTitle">
      <div class="editorial-narrow">
        ${sectionHeader("At the Hearing", "How do you say it out loud?", "protestHearingTitle")}
        ${paragraph("You do not need to sound formal. Plain speech usually works better. You are simply walking the Board from the record to the evidence to the request.")}
      </div>
      <figure class="script-card" aria-labelledby="scriptCardTitle">
        <figcaption id="scriptCardTitle">What to say at the hearing</figcaption>
        <blockquote>
          <p>The property record shows __________________.</p>
          <p>My evidence shows __________________.</p>
          <p>The comparable records show __________________.</p>
          <p>I am requesting __________________.</p>
        </blockquote>
      </figure>
      <div class="editorial-narrow">
        ${paragraph("That gives the Board something to work with. They may ask follow-up questions, and it does not guarantee an outcome, but it puts the record, the evidence, and the request in the same place. It also keeps you from drifting into frustration when the strongest thing you can offer is a specific fact the Board can evaluate.")}
      </div>
    </section>
  `;
}

function renderResourcesSection() {
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section resource-section" aria-labelledby="protestResourcesTitle">
      <div class="editorial-narrow">
        <p class="guided-kicker" id="protestResourcesTitle">Resources</p>
        <p>Here are the typical tools for checking the record, finding comparable sales, and filing the official protest form.</p>
      </div>
      <div class="resource-card-grid">
        ${RESOURCES.map(resource => `
          <article class="resource-card">
            <a href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(resource.label)}</a>
            <p>${escapeHtml(resource.description)}</p>
          </article>
        `).join("")}
      </div>
      <div class="print-url-list" aria-label="Full resource URLs for print">
        ${RESOURCES.map(resource => `
          <div class="print-url">
            ${resourceIcon(resource.icon)}
            <p>
              <span>${escapeHtml(resource.label)}</span>
              <code>${escapeHtml(resource.url)}</code>
            </p>
          </div>
        `).join("")}
      </div>
      <p class="note-box resource-note">This guide is general educational guidance. It is not legal advice, not an appraisal, and not a guarantee of any outcome. Local deadlines, filing rules, hearing procedures, and Board decisions still control.</p>
    </section>
  `;
}

function renderClosingSection() {
  return `
    <section class="tax-article-section tax-story-chapter tax-article-closing levy-article-narrow article-section" aria-labelledby="protestClosingTitle">
      ${sectionHeader("The Larger Point", "A protest can improve the record", "protestClosingTitle")}
      ${paragraph("A protest is not an attack on the assessment system. At its best, it is one of the final quality-control steps before the assessment roll becomes final.")}
      ${paragraph("The homeowner may be the only person in the room who has lived with the property closely enough to notice the small mistake: the old outbuilding, the wrong fireplace count, the basement finish that was never completed, the condition rating that no longer fits.")}
      ${paragraph("Better records produce better models. Better models produce more uniform assessments. More uniform assessments reduce the need for future protests.")}
      ${paragraph("Accuracy compounds.")}
    </section>
  `;
}

export function isProtestEvidenceGuideRequest(searchParams = new URLSearchParams(window.location.search)) {
  return searchParams.get("article") === "protest-evidence-guide";
}

export function renderProtestEvidenceGuide() {
  const pageTitle = document.getElementById("pageTitle");
  const canvas = document.querySelector(".mobile-review-canvas");
  if (!canvas) return;

  document.documentElement.classList.add("article-shell-route", "levy-compression-shell-route");
  document.querySelector(".guide-review-header")?.classList.add("hidden");
  document.querySelectorAll("[data-guided-panel]").forEach(panel => panel.classList.add("hidden"));
  document.querySelector("[data-footer-resource-shell]")?.classList.add("hidden");

  pageTitle.innerHTML = `
    <div class="comp-page-title levy-page-title article-hero">
      <p class="guided-kicker">Educational Guide</p>
      <h1>Before You Walk Into a Property Protest</h1>
      <p>A plain-language guide for turning a property valuation protest into a clear, evidence-based request.</p>
      <div class="levy-author-byline">
        <p>By Max Quattromani</p>
      </div>
    </div>
  `;

  canvas.innerHTML = `
    <article class="tax-shorthand-page levy-compression-page protest-evidence-guide-page editorial-guide tax-article-panel" aria-label="Property protest evidence guide">
      ${renderOpeningSection()}
      ${renderProcessStrip()}
      ${renderWhyProtestsFailSection()}
      ${renderBoardQuestionSection()}
      ${renderComparableSection()}
      ${renderRecordsSection()}
      ${renderEvidenceSection()}
      ${renderOrganizationSection()}
      ${renderHearingSection()}
      ${renderResourcesSection()}
      ${renderClosingSection()}
    </article>
  `;
}
