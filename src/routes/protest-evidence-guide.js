import { escapeHtml } from "../utils/html.js";
import { trackArticleInteraction, trackArticleScrollDepth } from "../visit-analytics.js";

const EDITORIAL_ICON_SPRITE = "/assets/icons/editorial/sprite.svg";
const PRINTABLE_GUIDE_PDF = "/assets/guides/before-you-walk-into-a-property-protest.pdf";
const ARTICLE_ID = "protest-evidence-guide";
const ARTICLE_SLUG = "protest-evidence-guide";
const ARTICLE_LEGACY_QUERY_VALUE = ARTICLE_SLUG;
const ARTICLE_CANONICAL_PATH = "articles/before-you-walk-into-a-property-protest/";
const ARTICLE_TITLE = "Before You Walk Into a Property Protest";
const ARTICLE_SUBTITLE = "A plain language, cup-of-coffee-length guide for turning a property valuation protest into a clear, evidence-based request.";
const ARTICLE_AUTHOR = "Max Quattromani";
const ARTICLE_LOCATION_DATE = "Gage County, June 25, 2026";
const ARTICLE_PUBLISHED_DATE = "2026-06-25";
const ARTICLE_MODIFIED_DATE = "2026-06-25";
const ARTICLE_DESCRIPTION = "A plain language guide to preparing a property valuation protest with comparables, property record cards, evidence, and a specific correction request.";
const ARTICLE_SOCIAL_IMAGE = "/assets/images/articles/before-you-walk-into-a-property-protest-hero.jpg";
const ARTICLE_HERO_IMAGE_ALT = "Homeowner reviewing a printed property record on a clipboard.";
const ARTICLE_HERO_IMAGE_CREDIT = "Photo by RDNE Stock project on Pexels.";
const ARTICLE_HERO_IMAGE_SOURCE = "https://www.pexels.com/photo/8292825/";
const ARTICLE_HERO_IMAGE_LICENSE = "https://www.pexels.com/license/";
const ARTICLE_KEYWORDS = [
  "property valuation protest",
  "property record card",
  "Gage County property protest",
  "Nebraska Form 422",
  "comparable properties",
  "Board of Equalization",
  "property assessment evidence"
];
const ARTICLE_DEPTH_MILESTONES = [25, 50, 75, 100];

const RESOURCES = [
  {
    label: "Gage County GIS / Property Record Lookup",
    icon: "property-record",
    analyticsAction: "gis_click",
    description: "Find the property record card for your parcel and for any comparable properties you plan to discuss.",
    url: "https://report.gworks.com/report.ashx?county=gage&type=assessor"
  },
  {
    label: "Gage County Sales Comparison Map",
    icon: "market-chart",
    analyticsAction: "sales_map_click",
    description: "Start here when looking for recent sales that may have competed with your property in the market.",
    url: "https://experience.arcgis.com/experience/67492767fb8d49a8b321d14022d24e81"
  },
  {
    label: "Nebraska Property Valuation Protest Form 422",
    icon: "document",
    analyticsAction: "form422_click",
    description: "Use the official Nebraska form and confirm the deadline, signature, and filing requirements with the county.",
    url: "https://revenue.nebraska.gov/sites/default/files/doc/pad/forms/422_Property_Valuation_Protest.pdf"
  }
];

const PROCESS_STEPS = [
  ["Find", "2-3 good comparable properties", "observe"],
  ["Compare", "the property records", "compare"],
  ["Document", "the specific difference", "document"],
  ["Request", "one clear correction", "request"]
];

const BOARD_MEETINGS = [
  {
    dateLabel: "Monday, July 6, 2026",
    timeLabel: "1:00 p.m.",
    calendarUrl: "/assets/calendar/gage-boe-2026-07-06.ics"
  },
  {
    dateLabel: "Friday, July 10, 2026",
    timeLabel: "1:00 p.m.",
    calendarUrl: "/assets/calendar/gage-boe-2026-07-10.ics"
  }
];

const BOARD_MEETING_LOCATION = "Gage County Courthouse, Board of Supervisors Room, 612 Grant Street, Beatrice, NE 68310";

const HARD_REQUESTS = [
  "My house isn't worth this much.",
  "This feels unfair.",
  "Can someone make this make sense?"
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

function editorialIcon(name, className = "") {
  const classes = ["editorial-icon", className].filter(Boolean).join(" ");
  return `
    <svg class="${classes}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <use href="${EDITORIAL_ICON_SPRITE}#icon-${escapeHtml(name)}"></use>
    </svg>
  `;
}

function renderArticleDepthMarkers() {
  return `
    <div class="article-depth-markers" aria-hidden="true">
      ${ARTICLE_DEPTH_MILESTONES.map(depth => `
        <span class="article-depth-marker" data-article-depth-marker="${depth}"></span>
      `).join("")}
    </div>
  `;
}

function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  const baseUrl = new URL("./", document.baseURI);
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(normalizedPath, baseUrl).href;
}

function setMeta(name, content) {
  if (!content) return;
  let element = document.querySelector(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.append(element);
  }
  element.setAttribute("content", content);
}

function setPropertyMeta(property, content) {
  if (!content) return;
  let element = document.querySelector(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.append(element);
  }
  element.setAttribute("content", content);
}

function setCanonicalLink(url) {
  let element = document.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.append(element);
  }
  element.setAttribute("href", url);
}

function setJsonLd(id, data) {
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement("script");
    element.type = "application/ld+json";
    element.id = id;
    document.head.append(element);
  }
  element.textContent = JSON.stringify(data);
}

function updateProtestEvidenceGuideMetadata() {
  const canonicalUrl = absoluteUrl(ARTICLE_CANONICAL_PATH);
  const imageUrl = absoluteUrl(ARTICLE_SOCIAL_IMAGE);
  const pdfUrl = absoluteUrl(PRINTABLE_GUIDE_PDF);
  const title = `${ARTICLE_TITLE} | Guided Parcel Review`;

  document.title = title;
  setCanonicalLink(canonicalUrl);
  setMeta("description", ARTICLE_DESCRIPTION);
  setMeta("author", ARTICLE_AUTHOR);
  setMeta("keywords", ARTICLE_KEYWORDS.join(", "));
  setMeta("robots", "index, follow, max-image-preview:large");
  setMeta("article:published_time", ARTICLE_PUBLISHED_DATE);
  setMeta("article:modified_time", ARTICLE_MODIFIED_DATE);
  setMeta("image:credit", ARTICLE_HERO_IMAGE_CREDIT);
  setMeta("image:source", ARTICLE_HERO_IMAGE_SOURCE);
  setPropertyMeta("og:type", "article");
  setPropertyMeta("og:site_name", "Guided Parcel Review");
  setPropertyMeta("og:title", ARTICLE_TITLE);
  setPropertyMeta("og:description", ARTICLE_DESCRIPTION);
  setPropertyMeta("og:url", canonicalUrl);
  setPropertyMeta("og:image", imageUrl);
  setPropertyMeta("article:published_time", ARTICLE_PUBLISHED_DATE);
  setPropertyMeta("article:modified_time", ARTICLE_MODIFIED_DATE);
  setPropertyMeta("article:author", ARTICLE_AUTHOR);
  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", ARTICLE_TITLE);
  setMeta("twitter:description", ARTICLE_DESCRIPTION);
  setMeta("twitter:image", imageUrl);

  setJsonLd("protest-evidence-guide-jsonld", {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: ARTICLE_TITLE,
        description: ARTICLE_DESCRIPTION,
        isPartOf: {
          "@id": `${window.location.origin}/#website`
        },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: imageUrl,
          contentUrl: imageUrl,
          caption: ARTICLE_HERO_IMAGE_ALT,
          creditText: ARTICLE_HERO_IMAGE_CREDIT,
          creator: {
            "@type": "Organization",
            name: "RDNE Stock project"
          },
          license: ARTICLE_HERO_IMAGE_LICENSE,
          acquireLicensePage: ARTICLE_HERO_IMAGE_SOURCE
        },
        datePublished: ARTICLE_PUBLISHED_DATE,
        dateModified: ARTICLE_MODIFIED_DATE,
        inLanguage: "en-US"
      },
      {
        "@type": "Article",
        "@id": `${canonicalUrl}#article`,
        headline: ARTICLE_TITLE,
        alternativeHeadline: ARTICLE_SUBTITLE,
        description: ARTICLE_DESCRIPTION,
        url: canonicalUrl,
        image: {
          "@type": "ImageObject",
          url: imageUrl,
          contentUrl: imageUrl,
          caption: ARTICLE_HERO_IMAGE_ALT,
          creditText: ARTICLE_HERO_IMAGE_CREDIT,
          creator: {
            "@type": "Organization",
            name: "RDNE Stock project"
          },
          license: ARTICLE_HERO_IMAGE_LICENSE,
          acquireLicensePage: ARTICLE_HERO_IMAGE_SOURCE
        },
        author: {
          "@id": `${canonicalUrl}#author`
        },
        publisher: {
          "@id": `${window.location.origin}/#organization`
        },
        datePublished: ARTICLE_PUBLISHED_DATE,
        dateModified: ARTICLE_MODIFIED_DATE,
        articleSection: "Property assessment education",
        keywords: ARTICLE_KEYWORDS,
        about: [
          "Property valuation protest",
          "Property record verification",
          "Comparable property evidence",
          "Board of Equalization hearing preparation"
        ],
        spatialCoverage: {
          "@type": "Place",
          name: "Gage County, Nebraska"
        },
        associatedMedia: {
          "@type": "MediaObject",
          name: "Printable guide PDF",
          contentUrl: pdfUrl,
          encodingFormat: "application/pdf"
        },
        inLanguage: "en-US",
        mainEntityOfPage: {
          "@id": `${canonicalUrl}#webpage`
        }
      },
      {
        "@type": "Person",
        "@id": `${canonicalUrl}#author`,
        name: ARTICLE_AUTHOR
      },
      {
        "@type": "Organization",
        "@id": `${window.location.origin}/#organization`,
        name: "Guided Parcel Review",
        url: window.location.origin,
        logo: imageUrl
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Guided Parcel Review",
            item: window.location.origin
          },
          {
            "@type": "ListItem",
            position: 2,
            name: ARTICLE_TITLE,
            item: canonicalUrl
          }
        ]
      }
    ]
  });
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
    ["Homeowner thinks", "My value is too high.", "observe"],
    ["Board needs", "What should change?", "equalization"],
    ["Evidence-supported request", "Here is the proof. Here is the correction.", "request"]
  ];

  return `
    <figure class="concept-card concept-diagram disconnect-visual" aria-labelledby="disconnectTitle">
      <figcaption id="disconnectTitle">The disconnect</figcaption>
      <div>
        ${items.map(([label, text, icon]) => `
          <article>
            <div class="editorial-card-heading">
              ${editorialIcon(icon)}
              <span>${escapeHtml(label)}</span>
            </div>
            <p>${escapeHtml(text)}</p>
          </article>
        `).join("")}
      </div>
    </figure>
  `;
}

function renderProcessStrip() {
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section article-section-visual" data-tone="information" aria-labelledby="processTitle">
      ${sectionHeader("Before You Begin", "The whole process in four moves", "processTitle")}
      <ol class="process-strip" aria-label="Property protest preparation process">
        ${PROCESS_STEPS.map(([verb, detail, icon]) => `
          <li>
            <div class="process-step-heading">
              ${editorialIcon(icon)}
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
    <section class="tax-article-section tax-story-chapter tax-article-opening levy-wide-panel article-section" data-tone="reflection" aria-labelledby="protestOpeningTitle">
      <div class="editorial-narrow">
        ${sectionHeader("In the Hearing Room", "The pattern shows up quickly", "protestOpeningTitle")}
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
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="information" aria-labelledby="protestFailTitle">
      <div class="editorial-narrow">
        ${sectionHeader("Finding the Disconnect", "Why do sincere protests fail?", "protestFailTitle")}
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
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="information" aria-labelledby="protestBoardTitle">
      <div class="editorial-narrow">
        ${sectionHeader("Narrowing the Question", "What is the Board actually deciding?", "protestBoardTitle")}
        ${paragraph("The Board is not there to decide whether a tax bill feels heavy. It is not there to debate public budgets. It is not there to punish or defend the assessor.")}
      </div>
      <figure class="decision-panel" aria-labelledby="decisionPanelTitle">
        <figcaption id="decisionPanelTitle">The Board's practical question</figcaption>
        <div class="decision-question">${editorialIcon("verification")}<span>Does the evidence support a correction?</span></div>
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
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="comparison" aria-labelledby="protestCompsTitle">
      <div class="editorial-narrow">
        ${sectionHeader("Finding Good Comparables", "What makes a comparable useful?", "protestCompsTitle")}
        ${paragraph("A comparable property is not just a nearby house with a lower value. The better question is whether that home would have genuinely competed with yours in the marketplace.")}
      </div>
      <figure class="scorecard" aria-labelledby="scorecardTitle">
        <figcaption id="scorecardTitle">Comparable property scorecard</figcaption>
        <div>
          <section>
            <h3>${editorialIcon("comparable-property")}<span>A good comp is similar in</span></h3>
            ${listMarkup(GOOD_COMP_TRAITS)}
          </section>
          <section>
            <h3>${editorialIcon("compare")}<span>Weak comp signals</span></h3>
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
        ${editorialIcon("property-record")}
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
      <figcaption id="recordCalloutTitle">${editorialIcon("property-record")}<span>A simplified record card: where to look first</span></figcaption>
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
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="evidence" aria-labelledby="protestRecordsTitle">
      <div class="editorial-narrow">
        ${sectionHeader("Verifying the Record", "Why does the record matter more than the value?", "protestRecordsTitle")}
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
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="evidence" aria-labelledby="protestEvidenceTitle">
      <div class="editorial-narrow">
        ${sectionHeader("Connecting Proof to Relief", "How do you turn evidence into one correction?", "protestEvidenceTitle")}
        ${paragraph("Keep the path short. What you noticed should connect directly to what the record says and what you are asking to correct.")}
      </div>
      <figure class="evidence-matrix" aria-labelledby="evidenceMatrixTitle">
        <figcaption id="evidenceMatrixTitle">${editorialIcon("evidence")}<span>Evidence -> Record issue -> Requested correction</span></figcaption>
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
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="action" aria-labelledby="protestOrganizeTitle">
      <div class="editorial-narrow">
        ${sectionHeader("Building the Packet", "What should the packet say?", "protestOrganizeTitle")}
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
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="action" aria-labelledby="protestHearingTitle">
      <div class="editorial-narrow">
        ${sectionHeader("Speaking to the Board", "How do you say it out loud?", "protestHearingTitle")}
        ${paragraph("You do not need to sound formal. Plain speech usually works better. You are simply walking the Board from the record to the evidence to the request.")}
      </div>
      <figure class="script-card" aria-labelledby="scriptCardTitle">
        <figcaption id="scriptCardTitle">${editorialIcon("hearing-board")}<span>What to say at the hearing</span></figcaption>
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
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section resource-section" data-tone="action" aria-labelledby="protestResourcesTitle">
      <div class="editorial-narrow">
        <p class="guided-kicker">Gathering Your Materials</p>
        <h2 class="levy-sr-only" id="protestResourcesTitle">Where do you find the materials?</h2>
        <p>Here are the typical tools for checking the record, finding comparable sales, and filing the official protest form.</p>
      </div>
      <div class="resource-card-grid">
        ${RESOURCES.map(resource => `
          <article class="resource-card">
            <a href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer" data-article-action="${escapeHtml(resource.analyticsAction)}" data-article-label="${escapeHtml(resource.label)}">${editorialIcon(resource.icon)}<span>${escapeHtml(resource.label)}</span></a>
            <p>${escapeHtml(resource.description)}</p>
          </article>
        `).join("")}
      </div>
      <div class="print-url-list" aria-label="Full resource URLs for print">
        ${RESOURCES.map(resource => `
          <div class="print-url">
            ${editorialIcon(resource.icon, "editorial-icon-sm")}
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

function renderOneMoreThoughtSection() {
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="reflection" aria-labelledby="protestOneMoreThoughtTitle">
      <div class="editorial-narrow">
        ${sectionHeader("After the Hearing", "If today did not settle it", "protestOneMoreThoughtTitle")}
        ${paragraph("If your protest was not successful today because you did not have enough evidence to support the adjustment you requested, that does not necessarily mean the conversation is over.")}
        ${paragraph("For a regular real property valuation protest, June 30 is the statutory filing cutoff. The official Nebraska Form 422 instructions say the protest must be filed after the assessment roll is complete and on or before June 30. A later hearing date does not create a new filing window for a first protest.")}
        ${paragraph("The Board of Equalization can only act on the information in front of it. If you already filed by the applicable deadline and later gather stronger comparable properties, obtain additional documentation, or discover something in your property record that supports a specific correction, ask the County Clerk's Office whether those materials can still be submitted for the existing protest.")}
      </div>
      <aside class="meeting-schedule-card" aria-labelledby="gageBoardScheduleTitle">
        <h3 id="gageBoardScheduleTitle">${editorialIcon("timeline")}<span>The next scheduled property protest hearings of the Gage County Board of Equalization are:</span></h3>
        <p>${escapeHtml(BOARD_MEETING_LOCATION)}</p>
        <ul>
          ${BOARD_MEETINGS.map(meeting => `
            <li>
              <a href="${escapeHtml(meeting.calendarUrl)}" download aria-label="Add ${escapeHtml(meeting.dateLabel)} Gage County Board of Equalization meeting to calendar" data-article-action="calendar_download" data-article-label="${escapeHtml(meeting.dateLabel)}">
                <span>${escapeHtml(meeting.dateLabel)}</span>
                <strong>${escapeHtml(meeting.timeLabel)}</strong>
                <em>Add to calendar</em>
              </a>
            </li>
          `).join("")}
        </ul>
      </aside>
      <div class="editorial-narrow">
        ${paragraph("These dates are hearing sessions, not filing deadlines.")}
        ${paragraph("Sometimes the most productive outcome from a first hearing is not an immediate adjustment. It is learning exactly what evidence the Board needs to evaluate your request.")}
      </div>
    </section>
  `;
}

function renderClosingSection() {
  return `
    <section class="tax-article-section tax-story-chapter tax-article-closing levy-article-narrow article-section" data-tone="reflection" aria-labelledby="protestClosingTitle">
      ${sectionHeader("Beyond Your Property", "A protest can improve the record", "protestClosingTitle")}
      ${paragraph("A protest is not an attack on the assessment system. At its best, it is one of the final quality-control steps before the assessment roll becomes final.")}
      ${paragraph("The homeowner may be the only person in the room who has lived with the property closely enough to notice the small mistake: the old outbuilding, the wrong fireplace count, the basement finish that was never completed, the condition rating that no longer fits.")}
      ${paragraph("Better records produce better models. Better models produce more uniform assessments. More uniform assessments reduce the need for future protests.")}
      ${paragraph("Accuracy compounds.")}
      <aside class="article-share-footer" aria-labelledby="shareArticleTitle">
        <p id="shareArticleTitle">Know someone staring at a valuation notice with one eyebrow raised?</p>
        <button type="button" data-article-share data-article-action="share_article" data-article-label="${ARTICLE_TITLE}">Share this guide</button>
        <span data-share-status role="status" aria-live="polite"></span>
      </aside>
      <aside class="related-article-coda" aria-labelledby="relatedProtestParadoxTitle">
        <hr />
        <p id="relatedProtestParadoxTitle">Can't get enough longform reading about property assessments? Extremely relatable.</p>
        <a href="experiments/the-protest-paradox.html" data-article-action="related_article" data-article-label="Assessment Up. Protest Denied. Taxes?">Read the companion case study: <span>Assessment Up. Protest Denied. Taxes?</span></a>
      </aside>
    </section>
  `;
}

export function isProtestEvidenceGuideRequest(searchParams = new URLSearchParams(window.location.search)) {
  return searchParams.get("article") === ARTICLE_LEGACY_QUERY_VALUE
    || normalizedPathname().endsWith(`/${ARTICLE_CANONICAL_PATH}`);
}

function normalizedPathname() {
  return window.location.pathname.endsWith("/")
    ? window.location.pathname
    : `${window.location.pathname}/`;
}

export function renderProtestEvidenceGuide() {
  const pageTitle = document.getElementById("pageTitle");
  const canvas = document.querySelector(".mobile-review-canvas");
  if (!canvas) return;

  updateProtestEvidenceGuideMetadata();
  document.documentElement.classList.add("article-shell-route", "levy-compression-shell-route");
  document.querySelector(".guide-review-header")?.classList.add("hidden");
  document.querySelectorAll("[data-guided-panel]").forEach(panel => panel.classList.add("hidden"));
  document.querySelector("[data-footer-resource-shell]")?.classList.add("hidden");

  pageTitle.innerHTML = `
    <header class="comp-page-title levy-page-title article-hero" aria-labelledby="protestArticleTitle">
      <div class="article-hero-packet">
        <div class="hero-kicker-row">
          ${editorialIcon("document", "editorial-icon-sm hero-kicker-icon")}
          <p class="guided-kicker hero-kicker">Guide / Property Protest Prep</p>
        </div>
        <h1 id="protestArticleTitle" class="hero-title">${ARTICLE_TITLE}</h1>
        <p class="hero-deck">${ARTICLE_SUBTITLE}</p>
        <div class="hero-meta" aria-label="Article information">
          <p>Prepared by ${ARTICLE_AUTHOR}</p>
          <p>${ARTICLE_LOCATION_DATE.replace(", ", " · ")}</p>
        </div>
        <div class="hero-action">
          <a class="article-print-cta" href="${PRINTABLE_GUIDE_PDF}" download data-article-action="download_pdf" data-article-label="Printable guide PDF">Prefer paper? Download the printable guide.</a>
        </div>
      </div>
      <figure class="article-hero-media hero-media">
        <img src="${escapeHtml(ARTICLE_SOCIAL_IMAGE)}" alt="${escapeHtml(ARTICLE_HERO_IMAGE_ALT)}" title="${escapeHtml(ARTICLE_HERO_IMAGE_CREDIT)}" data-image-credit="${escapeHtml(ARTICLE_HERO_IMAGE_CREDIT)}" data-image-source="${escapeHtml(ARTICLE_HERO_IMAGE_SOURCE)}" loading="eager" decoding="async" />
      </figure>
    </header>
  `;

  canvas.innerHTML = `
    <article class="tax-shorthand-page levy-compression-page protest-evidence-guide-page editorial-guide tax-article-panel" aria-label="Property protest evidence guide">
      ${renderArticleDepthMarkers()}
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
      ${renderOneMoreThoughtSection()}
      ${renderClosingSection()}
    </article>
  `;

  installArticleAnalytics(canvas);
}

function installArticleAnalytics(canvas) {
  const article = canvas.querySelector(".protest-evidence-guide-page");
  if (!article || article.dataset.analyticsReady === "true") return;
  article.dataset.analyticsReady = "true";
  article.addEventListener("click", event => {
    const link = event.target.closest("[data-article-action]");
    if (!link) return;
    if (link.matches("[data-article-share]")) {
      event.preventDefault();
      shareArticle(link);
      return;
    }
    trackArticleInteraction(link.dataset.articleAction, {
      articleId: ARTICLE_ID,
      detail: link.dataset.articleLabel || link.textContent?.trim() || link.getAttribute("href") || "",
      targetUrl: link.getAttribute("href") || ""
    });
  });
  installArticleDepthTracking(article);
}

async function shareArticle(button) {
  const shareUrl = absoluteUrl(ARTICLE_CANONICAL_PATH);
  const status = button.closest(".article-share-footer")?.querySelector("[data-share-status]");
  const shareData = {
    title: ARTICLE_TITLE,
    text: ARTICLE_DESCRIPTION,
    url: shareUrl
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      status.textContent = "Shared.";
      trackArticleInteraction("share_article", {
        articleId: ARTICLE_ID,
        detail: ARTICLE_TITLE,
        targetUrl: shareUrl
      });
      return;
    }

    await copyTextToClipboard(shareUrl);
    status.textContent = "Link copied.";
    trackArticleInteraction("copy_link", {
      articleId: ARTICLE_ID,
      detail: ARTICLE_TITLE,
      targetUrl: shareUrl
    });
  } catch (error) {
    if (error?.name === "AbortError") return;
    status.textContent = "Copy this page URL from your browser.";
  }
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.inset = "0 auto auto 0";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function installArticleDepthTracking(article) {
  const markers = Array.from(article.querySelectorAll("[data-article-depth-marker]"));
  const reached = new Set();
  let maxScrollPercent = calculateArticleScrollDepth(article);
  let finalReported = false;
  let ticking = false;

  const reportDepth = (depth, source = "marker") => {
    const scrollPercent = Math.max(0, Math.min(100, Number(depth) || 0));
    if (reached.has(scrollPercent)) return;
    reached.add(scrollPercent);
    maxScrollPercent = Math.max(maxScrollPercent, scrollPercent);
    trackArticleScrollDepth({
      articleId: ARTICLE_ID,
      detail: scrollPercent === 100 ? "scroll_complete" : `scroll_${scrollPercent}`,
      scrollPercent,
      maxScrollPercent,
      reachedBottom: scrollPercent === 100,
      source
    });
  };

  const measureDepth = () => {
    ticking = false;
    maxScrollPercent = Math.max(maxScrollPercent, calculateArticleScrollDepth(article));
    ARTICLE_DEPTH_MILESTONES.forEach(depth => {
      if (maxScrollPercent >= depth) reportDepth(depth, "calculated");
    });
  };

  const requestMeasureDepth = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(measureDepth);
  };

  const reportFinalDepth = () => {
    if (finalReported) return;
    finalReported = true;
    maxScrollPercent = Math.max(maxScrollPercent, calculateArticleScrollDepth(article));
    trackArticleScrollDepth({
      articleId: ARTICLE_ID,
      detail: "scroll_final",
      maxScrollPercent,
      reachedBottom: maxScrollPercent >= 100,
      source: "final"
    });
  };

  if ("IntersectionObserver" in window && markers.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        reportDepth(entry.target.dataset.articleDepthMarker, "marker");
      });
    }, {
      root: null,
      threshold: 0,
      rootMargin: "0px 0px -1px 0px"
    });
    markers.forEach(marker => observer.observe(marker));
  }

  window.addEventListener("scroll", requestMeasureDepth, { passive: true });
  window.addEventListener("resize", requestMeasureDepth);
  window.addEventListener("pagehide", reportFinalDepth);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") reportFinalDepth();
  });
  requestMeasureDepth();
}

function calculateArticleScrollDepth(article) {
  const rect = article.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const articleHeight = Math.max(1, article.scrollHeight || rect.height || 1);
  const viewedDistance = Math.min(articleHeight, Math.max(0, viewportHeight - rect.top));

  return Math.max(0, Math.min(100, Math.round((viewedDistance / articleHeight) * 100)));
}
