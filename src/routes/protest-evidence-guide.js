import { escapeHtml } from "../utils/html.js";
import { beforeYouWalkIntoPropertyProtestArticle as articleSource } from "../content/articles/before-you-walk-into-a-property-protest.js";
import { trackArticleInteraction, trackArticleScrollDepth } from "../visit-analytics.js";

const EDITORIAL_ICON_SPRITE = "assets/icons/editorial/sprite.svg";
const ARTICLE_SECTIONS = articleSource.sections;
const PRINTABLE_GUIDE_PDF = articleSource.assets.printableGuidePdf;
const ARTICLE_ID = articleSource.id;
const ARTICLE_SLUG = articleSource.slug;
const ARTICLE_LEGACY_QUERY_VALUE = articleSource.legacyQueryValue;
const ARTICLE_CANONICAL_PATH = articleSource.canonicalPath;
const ARTICLE_TITLE = articleSource.title;
const ARTICLE_SUBTITLE = articleSource.subtitle;
const ARTICLE_AUTHOR = articleSource.author;
const ARTICLE_AUTHOR_EMAIL = articleSource.authorEmail;
const ARTICLE_LOCATION = articleSource.location;
const ARTICLE_TAGS = articleSource.tags ?? [ARTICLE_LOCATION].filter(Boolean);
const ARTICLE_DISPLAY_DATE = articleSource.displayDate;
const ARTICLE_PUBLISHED_DATE = articleSource.publishedDate;
const ARTICLE_MODIFIED_DATE = articleSource.modifiedDate;
const ARTICLE_DESCRIPTION = articleSource.description;
const ARTICLE_SOCIAL_IMAGE = articleSource.assets.socialImage;
const ARTICLE_TLDR_VIDEO = articleSource.assets.tldrVideo;
const ARTICLE_AUDIO_READ = articleSource.assets.audioRead;
const ARTICLE_AUDIO_DURATION = articleSource.assets.audioDuration;
const ARTICLE_WORD_COUNT = articleSource.reading.wordCount;
const ARTICLE_READING_TIME_MINUTES = articleSource.reading.minutes;
const ARTICLE_READING_TIME = `PT${ARTICLE_READING_TIME_MINUTES}M`;
const ARTICLE_WORD_COUNT_LABEL = ARTICLE_WORD_COUNT.toLocaleString("en-US");
const ARTICLE_HERO_IMAGE_ALT = articleSource.assets.heroImageAlt;
const ARTICLE_HERO_IMAGE_CREDIT = articleSource.assets.heroImageCredit;
const ARTICLE_HERO_IMAGE_SOURCE = articleSource.assets.heroImageSource;
const ARTICLE_HERO_IMAGE_LICENSE = articleSource.assets.heroImageLicense;
const GAGE_COUNTY_WEBSITE = articleSource.references.gageCountyWebsite;
const GAGE_COUNTY_ASSESSOR_PAGE = articleSource.references.gageCountyAssessorPage;
const GAGE_COUNTY_PROTESTS_PAGE = articleSource.references.gageCountyProtestsPage;
const GAGE_COUNTY_PROPERTY_SEARCH_PAGE = articleSource.references.gageCountyPropertySearchPage;
const ARTICLE_KEYWORDS = articleSource.keywords;
const ARTICLE_DEPTH_MILESTONES = [25, 50, 75, 100];
const ARTICLE_TLDR_TRANSCRIPT = articleSource.tldrTranscript;
const RESOURCES = articleSource.resources;
const PROCESS_STEPS = articleSource.processSteps;
const BOARD_MEETINGS = articleSource.boardMeetings;
const BOARD_MEETING_LOCATION = articleSource.boardMeetingLocation;
const DISCONNECT_FIGURE = articleSource.disconnectFigure;
const HARD_REQUESTS = articleSource.requestComparison.hard;
const BETTER_REQUESTS = articleSource.requestComparison.better;
const GOOD_COMP_TRAITS = articleSource.comparableScorecard.goodTraits;
const WEAK_COMP_SIGNALS = articleSource.comparableScorecard.weakSignals;
const RECORD_FACTS = articleSource.recordFacts;
const RECORD_CALLOUT_ROWS = articleSource.recordCalloutRows;
const EVIDENCE_EXAMPLES = articleSource.evidenceExamples;
const EVIDENCE_COLUMNS = articleSource.evidenceColumns;
const ORGANIZATION_STEPS = articleSource.organizationSteps;
const ARTICLE_AUTHOR_MAILTO = `mailto:${ARTICLE_AUTHOR_EMAIL}?subject=${encodeURIComponent(`Re: ${ARTICLE_TITLE}`)}`;

function paragraph(text) {
  return `<p>${escapeHtml(text)}</p>`;
}

function paragraphs(items = []) {
  return items.map(paragraph).join("");
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
  const videoUrl = absoluteUrl(ARTICLE_TLDR_VIDEO);
  const audioUrl = absoluteUrl(ARTICLE_AUDIO_READ);
  const title = `${ARTICLE_TITLE} | Guided Parcel Review`;

  document.title = title;
  setCanonicalLink(canonicalUrl);
  setMeta("description", ARTICLE_DESCRIPTION);
  setMeta("author", ARTICLE_AUTHOR);
  setMeta("keywords", ARTICLE_KEYWORDS.join(", "));
  setMeta("article:word_count", String(ARTICLE_WORD_COUNT));
  setMeta("article:reading_time", ARTICLE_READING_TIME);
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
  setPropertyMeta("og:image:width", "1920");
  setPropertyMeta("og:image:height", "1080");
  setPropertyMeta("og:video", videoUrl);
  setPropertyMeta("og:video:secure_url", videoUrl);
  setPropertyMeta("og:video:type", "video/mp4");
  setPropertyMeta("og:video:width", "1258");
  setPropertyMeta("og:video:height", "708");
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
        about: {
          "@id": `${canonicalUrl}#gage-county`
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
        timeRequired: ARTICLE_READING_TIME,
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
        wordCount: ARTICLE_WORD_COUNT,
        timeRequired: ARTICLE_READING_TIME,
        articleSection: "Property assessment education",
        keywords: ARTICLE_KEYWORDS,
        about: [
          {
            "@id": `${canonicalUrl}#gage-county`
          },
          "Property valuation protest",
          "Property record verification",
          "Comparable property evidence",
          "Board of Equalization hearing preparation"
        ],
        spatialCoverage: {
          "@id": `${canonicalUrl}#gage-county`
        },
        mentions: [
          {
            "@id": `${canonicalUrl}#gage-county`
          },
          {
            "@type": "WebPage",
            name: "Gage County Assessor",
            url: GAGE_COUNTY_ASSESSOR_PAGE
          },
          {
            "@type": "WebPage",
            name: "Gage County Property Valuation Protests",
            url: GAGE_COUNTY_PROTESTS_PAGE
          },
          {
            "@type": "WebPage",
            name: "Gage County property search information",
            url: GAGE_COUNTY_PROPERTY_SEARCH_PAGE
          }
        ],
        hasPart: [
          {
            "@id": `${canonicalUrl}#resource-list`
          }
        ],
        associatedMedia: [
          {
            "@type": "MediaObject",
            name: "Printable guide PDF",
            contentUrl: pdfUrl,
            encodingFormat: "application/pdf"
          },
          {
            "@type": "VideoObject",
            name: "Video orientation to the property protest guide",
            description: "A short guided orientation summarizing how to turn a property valuation protest into an evidence-based request.",
            contentUrl: videoUrl,
            thumbnailUrl: imageUrl,
            uploadDate: ARTICLE_PUBLISHED_DATE,
            duration: "PT2M44S",
            transcript: ARTICLE_TLDR_TRANSCRIPT.join(" ")
          },
          {
            "@type": "AudioObject",
            name: "Audio version of Before You Walk Into a Property Protest",
            description: "A listenable audio version of the property protest preparation guide.",
            contentUrl: audioUrl,
            encodingFormat: "audio/mpeg",
            uploadDate: ARTICLE_PUBLISHED_DATE,
            duration: ARTICLE_AUDIO_DURATION
          }
        ],
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
        "@type": ["GovernmentOrganization", "AdministrativeArea"],
        "@id": `${canonicalUrl}#gage-county`,
        name: "Gage County, Nebraska",
        url: GAGE_COUNTY_WEBSITE,
        areaServed: {
          "@type": "AdministrativeArea",
          name: "Gage County, Nebraska"
        }
      },
      {
        "@type": "ItemList",
        "@id": `${canonicalUrl}#resource-list`,
        name: "Property protest preparation resources",
        itemListElement: RESOURCES.map((resource, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: resource.label,
          description: resource.description,
          url: resource.url
        }))
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
  return `
    <figure class="concept-card concept-diagram disconnect-visual" aria-labelledby="disconnectTitle">
      <figcaption id="disconnectTitle">The disconnect</figcaption>
      <div>
        ${DISCONNECT_FIGURE.map(([label, text, icon]) => `
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
  const section = ARTICLE_SECTIONS.process;
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section article-section-visual" data-tone="information" aria-labelledby="processTitle">
      ${sectionHeader(section.kicker, section.title, "processTitle")}
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
  const section = ARTICLE_SECTIONS.opening;
  return `
    <section class="tax-article-section tax-story-chapter tax-article-opening levy-wide-panel article-section" data-tone="reflection" aria-labelledby="protestOpeningTitle">
      <div class="editorial-narrow">
        ${renderArticleEntryPanel()}
        ${sectionHeader(section.kicker, section.title, "protestOpeningTitle")}
        ${paragraphs(section.paragraphs)}
      </div>
      ${renderDisconnectFigure()}
      <aside class="guided-transition protest-guide-takeaway pull-quote">
        <p>${escapeHtml(section.pullQuote)}</p>
      </aside>
      <div class="editorial-narrow">
        ${paragraph(section.closingParagraph)}
      </div>
    </section>
  `;
}

function renderWhyProtestsFailSection() {
  const section = ARTICLE_SECTIONS.whyProtestsFail;
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="information" aria-labelledby="protestFailTitle">
      <div class="editorial-narrow">
        ${sectionHeader(section.kicker, section.title, "protestFailTitle")}
        ${paragraphs(section.paragraphs)}
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
        ${paragraph(section.closingParagraph)}
      </div>
    </section>
  `;
}

function renderBoardQuestionSection() {
  const section = ARTICLE_SECTIONS.boardQuestion;
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="information" aria-labelledby="protestBoardTitle">
      <div class="editorial-narrow">
        ${sectionHeader(section.kicker, section.title, "protestBoardTitle")}
        ${paragraph(section.intro)}
      </div>
      <figure class="decision-panel" aria-labelledby="decisionPanelTitle">
        <figcaption class="decision-panel-label" id="decisionPanelTitle">${escapeHtml(section.label)}</figcaption>
        <p class="decision-question">${escapeHtml(section.question)}</p>
        <div class="decision-outcomes decision-branches" role="list" aria-label="Possible Board outcomes">
          <div class="decision-branch" data-decision-branch="yes" role="listitem">
            <strong class="decision-node"><span>${escapeHtml(section.yesNode)}</span></strong>
            <span class="decision-result">${escapeHtml(section.yesResult)}</span>
            <p class="decision-followup-question">${escapeHtml(section.followupQuestion)}</p>
          </div>
          <div class="decision-branch" data-decision-branch="no" role="listitem">
            <strong class="decision-node"><span>${escapeHtml(section.noNode)}</span></strong>
            <span class="decision-result">${escapeHtml(section.noResult)}</span>
          </div>
        </div>
      </figure>
      <aside class="decision-disclaimer" aria-label="Decision diagram note">
        <strong>Note</strong>
        <span>${escapeHtml(section.disclaimer)}</span>
      </aside>
      <div class="editorial-narrow">
        ${paragraph(section.closingParagraph)}
      </div>
    </section>
  `;
}

function renderComparableSection() {
  const section = ARTICLE_SECTIONS.comparables;
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="comparison" aria-labelledby="protestCompsTitle">
      <div class="editorial-narrow">
        ${sectionHeader(section.kicker, section.title, "protestCompsTitle")}
        ${paragraph(section.intro)}
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
        ${paragraphs(section.paragraphs)}
      </div>
    </section>
  `;
}

function renderAssessmentBuildPanel() {
  const section = ARTICLE_SECTIONS.records;
  return `
    <figure class="assessment-build-panel" aria-labelledby="assessmentBuildTitle">
      <figcaption id="assessmentBuildTitle">${escapeHtml(section.layerCaption)}</figcaption>
      <div class="assessment-build-header">
        ${editorialIcon("property-record")}
        <strong>${escapeHtml(section.layerTitle)}</strong>
        <span>${escapeHtml(section.layerSubtitle)}</span>
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
  const section = ARTICLE_SECTIONS.records;
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="evidence" aria-labelledby="protestRecordsTitle">
      <div class="editorial-narrow">
        ${sectionHeader(section.kicker, section.title, "protestRecordsTitle")}
        <p class="article-emphasis">${escapeHtml(section.emphasis)}</p>
      </div>
      ${renderAssessmentBuildPanel()}
      <div class="editorial-narrow">
        ${paragraphs(section.paragraphs)}
      </div>
      ${renderRecordCallout()}
      <div class="editorial-narrow">
        ${paragraph(section.caution)}
      </div>
    </section>
  `;
}

function renderEvidenceSection() {
  const section = ARTICLE_SECTIONS.evidence;
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="evidence" aria-labelledby="protestEvidenceTitle">
      <div class="editorial-narrow">
        ${sectionHeader(section.kicker, section.title, "protestEvidenceTitle")}
        ${paragraph(section.intro)}
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
        ${paragraph(section.closingParagraph)}
      </div>
    </section>
  `;
}

function renderOrganizationSection() {
  const section = ARTICLE_SECTIONS.organization;

  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="action" aria-labelledby="protestOrganizeTitle">
      <div class="editorial-narrow">
        ${sectionHeader(section.kicker, section.title, "protestOrganizeTitle")}
        ${paragraph(section.intro)}
      </div>
      <ol class="question-checklist">
        ${ORGANIZATION_STEPS.map(([title, text]) => `
          <li>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(text)}</p>
          </li>
        `).join("")}
      </ol>
      <aside class="guided-transition protest-guide-takeaway pull-quote">
        <p>${escapeHtml(section.pullQuote)}</p>
      </aside>
    </section>
  `;
}

function renderHearingSection() {
  const section = ARTICLE_SECTIONS.hearing;
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="action" aria-labelledby="protestHearingTitle">
      <div class="editorial-narrow">
        ${sectionHeader(section.kicker, section.title, "protestHearingTitle")}
        ${paragraph(section.intro)}
      </div>
      <figure class="script-card" aria-labelledby="scriptCardTitle">
        <figcaption id="scriptCardTitle">${editorialIcon("hearing-board")}<span>${escapeHtml(section.scriptTitle)}</span></figcaption>
        <blockquote>
          ${section.scriptLines.map(line => `<p>${escapeHtml(line)}</p>`).join("")}
        </blockquote>
      </figure>
      <div class="editorial-narrow">
        ${paragraph(section.closingParagraph)}
      </div>
    </section>
  `;
}

function renderResourcesSection() {
  const section = ARTICLE_SECTIONS.resources;
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section resource-section" data-tone="action" aria-labelledby="protestResourcesTitle">
      <div class="editorial-narrow">
        <p class="guided-kicker">${escapeHtml(section.kicker)}</p>
        <h2 class="levy-sr-only" id="protestResourcesTitle">${escapeHtml(section.title)}</h2>
        <p>${escapeHtml(section.intro)}</p>
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
      <p class="note-box resource-note">${escapeHtml(section.note)}</p>
    </section>
  `;
}

function renderOneMoreThoughtSection() {
  const section = ARTICLE_SECTIONS.afterHearing;
  return `
    <section class="tax-article-section tax-story-chapter levy-wide-panel article-section" data-tone="reflection" aria-labelledby="protestOneMoreThoughtTitle">
      <div class="editorial-narrow">
        ${sectionHeader(section.kicker, section.title, "protestOneMoreThoughtTitle")}
        ${paragraphs(section.paragraphs)}
      </div>
      <aside class="meeting-schedule-card" aria-labelledby="gageBoardScheduleTitle">
        <h3 id="gageBoardScheduleTitle">${editorialIcon("timeline")}<span>${escapeHtml(section.scheduleTitle)}</span></h3>
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
        <p class="important-inline-note">${escapeHtml(section.scheduleNote)}</p>
      </aside>
      <div class="editorial-narrow">
        ${paragraph(section.closingParagraph)}
      </div>
    </section>
  `;
}

function renderClosingSection() {
  const section = ARTICLE_SECTIONS.closing;
  return `
    <section class="tax-article-section tax-story-chapter tax-article-closing levy-article-narrow article-section" data-tone="reflection" aria-labelledby="protestClosingTitle">
      ${sectionHeader(section.kicker, section.title, "protestClosingTitle")}
      ${paragraphs(section.paragraphs)}
      <aside class="article-share-footer" aria-labelledby="shareArticleTitle">
        <p id="shareArticleTitle">${escapeHtml(section.sharePrompt)}</p>
        <button type="button" data-article-share data-article-action="share_article" data-article-label="${ARTICLE_TITLE}">
          <span class="share-button-label" data-share-button-label>${escapeHtml(section.shareButton)}</span>
          <span class="share-button-smile" aria-hidden="true"></span>
        </button>
        <span data-share-status role="status" aria-live="polite"></span>
      </aside>
      <aside class="related-article-coda" aria-labelledby="relatedProtestParadoxTitle">
        <hr />
        <p id="relatedProtestParadoxTitle">${escapeHtml(section.relatedPrompt)}</p>
        <a href="${escapeHtml(section.relatedHref)}" data-article-action="related_article" data-article-label="${escapeHtml(section.relatedTitle)}">${escapeHtml(section.relatedLabel)} <span>${escapeHtml(section.relatedTitle)}</span></a>
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
          <p class="guided-kicker hero-kicker"><span>Guide</span> / Property Protest Prep</p>
        </div>
        <h1 id="protestArticleTitle" class="hero-title">${ARTICLE_TITLE}</h1>
        <p class="hero-deck">${ARTICLE_SUBTITLE}</p>
      </div>
      <figure class="article-hero-media hero-media article-hero-video" data-hero-video>
        <video
          class="article-hero-video-player"
          data-hero-video-player
          src="${escapeHtml(ARTICLE_TLDR_VIDEO)}"
          poster="${escapeHtml(ARTICLE_SOCIAL_IMAGE)}"
          preload="metadata"
          playsinline
          aria-label="Video overview of the property protest guide"
          title="${escapeHtml(ARTICLE_HERO_IMAGE_CREDIT)}"
          data-image-credit="${escapeHtml(ARTICLE_HERO_IMAGE_CREDIT)}"
          data-image-source="${escapeHtml(ARTICLE_HERO_IMAGE_SOURCE)}"
        ></video>
        <button class="article-hero-video-play" type="button" data-hero-video-play aria-label="Play the video summary">
          <span class="article-hero-video-play-icon" aria-hidden="true"></span>
        </button>
        <figcaption class="levy-sr-only">${escapeHtml(ARTICLE_HERO_IMAGE_ALT)} The video provides a short overview of the article.</figcaption>
      </figure>
    </header>
  `;

  canvas.innerHTML = `
    <article class="tax-shorthand-page levy-compression-page protest-evidence-guide-page editorial-guide tax-article-panel" data-county-theme="gage" aria-label="Property protest evidence guide">
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
  installHeroVideo(pageTitle);
  installHeroAudio(canvas);
  installHeroUtilityTracking(canvas);
}

function renderArticleEntryPanel() {
  return `
    <div class="article-entry-panel">
      <div class="article-entry-meta" aria-label="Article information">
        <p>Prepared by <a href="${escapeHtml(ARTICLE_AUTHOR_MAILTO)}" data-article-action="author_email" data-article-label="${escapeHtml(ARTICLE_TITLE)}">${escapeHtml(ARTICLE_AUTHOR)}</a></p>
        <div class="article-entry-context">
          <p>${ARTICLE_DISPLAY_DATE}</p>
          ${renderArticleTags()}
        </div>
        ${renderArticleReadingTime()}
      </div>
      <div class="hero-utility" aria-label="Article format options">
        <a class="hero-utility-button article-print-cta" href="${PRINTABLE_GUIDE_PDF}" download data-article-action="download_pdf" data-article-label="Printable guide PDF">
          ${editorialIcon("document")}
          <span>Prefer paper? Download the printable guide.</span>
        </a>
        <details class="hero-audio" data-hero-audio>
          <summary class="hero-utility-button article-audio-cta">
            ${editorialIcon("audio")}
            <span>Prefer audio? Listen to the article.</span>
          </summary>
          <div class="hero-audio-panel">
            <p>Full audio version of this guide.</p>
            <audio class="hero-audio-player" data-hero-audio-player controls preload="none" src="${escapeHtml(ARTICLE_AUDIO_READ)}">
              <a href="${escapeHtml(ARTICLE_AUDIO_READ)}">Download the MP3 audio version.</a>
            </audio>
            <a class="hero-audio-download" href="${escapeHtml(ARTICLE_AUDIO_READ)}" download data-article-action="audio_article_download" data-article-label="Audio article MP3">Download MP3</a>
          </div>
        </details>
      </div>
    </div>
  `;
}

function renderArticleTags() {
  if (!ARTICLE_TAGS.length) {
    return "";
  }

  return `
        <ul class="article-entry-tags" aria-label="Article tags">
          ${ARTICLE_TAGS.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}
        </ul>`;
}

function renderArticleReadingTime() {
  return `
    <p class="article-reading-time" aria-label="Estimated reading time">
      <span>Reading time:</span>
      <time datetime="${ARTICLE_READING_TIME}">${ARTICLE_READING_TIME_MINUTES} min</time>
      <span>(${ARTICLE_WORD_COUNT_LABEL} words)</span>
    </p>
  `;
}

function installHeroVideo(root) {
  const wrapper = root.querySelector("[data-hero-video]");
  if (!wrapper || wrapper.dataset.heroVideoReady === "true") return;
  wrapper.dataset.heroVideoReady = "true";

  const video = wrapper.querySelector("[data-hero-video-player]");
  const playButton = wrapper.querySelector("[data-hero-video-play]");
  if (!video || !playButton) return;

  let playTracked = false;
  let completeTracked = false;

  const trackHeroVideo = (action, details = {}) => {
    trackArticleInteraction(action, {
      articleId: ARTICLE_ID,
      detail: "hero video summary",
      ...details
    });
  };

  const syncVideoState = () => {
    wrapper.classList.toggle("is-playing", !video.paused && !video.ended);
    wrapper.classList.toggle("has-started", video.currentTime > 0 && !video.ended);
    if (video.ended) wrapper.classList.remove("has-started", "is-playing");
  };

  playButton.addEventListener("click", async () => {
    try {
      await video.play();
      video.controls = true;
      if (!playTracked) {
        playTracked = true;
        trackHeroVideo("tldr_video_play", { placement: "hero" });
      }
    } catch {
      video.controls = true;
      video.focus({ preventScroll: true });
    }
    syncVideoState();
  });

  video.addEventListener("play", () => {
    video.controls = true;
    if (!playTracked) {
      playTracked = true;
      trackHeroVideo("tldr_video_play", { placement: "hero" });
    }
    syncVideoState();
  });
  video.addEventListener("pause", syncVideoState);
  video.addEventListener("timeupdate", syncVideoState);
  video.addEventListener("ended", () => {
    if (!completeTracked) {
      completeTracked = true;
      trackHeroVideo("tldr_video_complete", { placement: "hero" });
    }
    syncVideoState();
  });
}

function installHeroAudio(root) {
  const wrapper = root.querySelector("[data-hero-audio]");
  if (!wrapper || wrapper.dataset.heroAudioReady === "true") return;
  wrapper.dataset.heroAudioReady = "true";

  const audio = wrapper.querySelector("[data-hero-audio-player]");
  if (!audio) return;

  let expandTracked = false;
  let playTracked = false;
  let completeTracked = false;

  const trackHeroAudio = (action, details = {}) => {
    trackArticleInteraction(action, {
      articleId: ARTICLE_ID,
      detail: "audio article version",
      ...details
    });
  };

  wrapper.addEventListener("toggle", () => {
    if (!wrapper.open || expandTracked) return;
    expandTracked = true;
    trackHeroAudio("audio_article_expand", { placement: "hero" });
  });

  audio.addEventListener("play", () => {
    if (!playTracked) {
      playTracked = true;
      trackHeroAudio("audio_article_play", { placement: "hero" });
    }
  });

  audio.addEventListener("pause", () => {
    if (!audio.ended && audio.currentTime > 0) {
      trackHeroAudio("audio_article_pause", {
        placement: "hero",
        currentTime: Math.round(audio.currentTime)
      });
    }
  });

  audio.addEventListener("ended", () => {
    if (completeTracked) return;
    completeTracked = true;
    trackHeroAudio("audio_article_complete", { placement: "hero" });
  });
}

function installHeroUtilityTracking(root) {
  const utility = root.querySelector(".hero-utility");
  if (!utility || utility.dataset.heroUtilityReady === "true") return;
  utility.dataset.heroUtilityReady = "true";

  utility.addEventListener("click", event => {
    const link = event.target.closest("[data-article-action]");
    if (!link) return;
    trackArticleInteraction(link.dataset.articleAction, {
      articleId: ARTICLE_ID,
      detail: link.dataset.articleLabel || link.textContent?.trim() || link.getAttribute("href") || "",
      targetUrl: link.getAttribute("href") || "",
      placement: "hero"
    });
  });
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
  const label = button.querySelector("[data-share-button-label]");
  const shareText = `${ARTICLE_TITLE}\n\n${ARTICLE_DESCRIPTION}\n\n${shareUrl}`;
  const shareData = {
    text: shareText
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      if (status) status.textContent = "Shared.";
      showShareConfirmation(button, label, "Shared");
      trackArticleInteraction("share_article", {
        articleId: ARTICLE_ID,
        detail: ARTICLE_TITLE,
        targetUrl: shareUrl
      });
      return;
    }

    await copyTextToClipboard(shareText);
    if (status) status.textContent = "Share text copied with the link.";
    showShareConfirmation(button, label, "Copied");
    trackArticleInteraction("copy_link", {
      articleId: ARTICLE_ID,
      detail: ARTICLE_TITLE,
      targetUrl: shareUrl
    });
  } catch (error) {
    if (error?.name === "AbortError") return;
    if (status) status.textContent = "Copy this page URL from your browser.";
  }
}

function showShareConfirmation(button, label, message) {
  if (!button || !label) return;
  window.clearTimeout(button._shareConfirmationTimer);
  const originalLabel = button.dataset.originalShareLabel || label.textContent || "Share this guide";
  button.dataset.originalShareLabel = originalLabel;
  label.textContent = message;
  button.classList.add("is-share-confirmed");
  button._shareConfirmationTimer = window.setTimeout(() => {
    label.textContent = originalLabel;
    button.classList.remove("is-share-confirmed");
  }, 2600);
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
