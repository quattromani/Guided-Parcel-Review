import { escapeHtml } from "../utils/html.js?v=20260701-article-polish-4";

const RESOURCE_TYPE_LABELS = {
  "assessment-guidance": "Assessment guidance",
  "case-record": "Case record",
  "case-study": "Case study",
  "calculator": "Calculator",
  "companion-guide": "Companion guide",
  "county-record": "County record",
  "download": "Download",
  "experiment": "Experiment",
  "legal-authority": "Legal authority",
  "model-input": "Model input",
  "office": "Office",
  "official-form": "Official form",
  "official-resource": "Official resource",
  "pad-report": "PAD report",
  "practice-basis": "Practice basis",
  "report": "Report",
  "tax-record": "Tax record"
};

function marginInsightClasses(insight = {}, options = {}) {
  const placement = options.placement ?? insight.placement ?? insight.position ?? "";
  const classes = ["ges-margin-insight"];

  if (placement === "inline") classes.push("ges-margin-insight--inline");
  if (placement === "after-content") classes.push("ges-margin-insight--after-content");

  return classes.join(" ");
}

export function renderMarginInsight(insight, options = {}) {
  if (!insight?.text) return "";

  return `
    <aside class="${marginInsightClasses(insight, options)}" aria-label="${escapeHtml(insight.label ?? "Margin insight")}">
      ${insight.label ? `<p class="ges-margin-insight__label">${escapeHtml(insight.label)}</p>` : ""}
      <p class="ges-margin-insight__text">${escapeHtml(insight.text)}</p>
    </aside>
  `;
}

function textValueHasContent(value) {
  if (Array.isArray(value)) return value.some(textValueHasContent);
  if (value && typeof value === "object") return textValueHasContent(value.text ?? "");
  return typeof value === "string" && value.trim().length > 0;
}

function hasMarginInsightCompanionText(options = {}) {
  return [
    "body",
    "closing",
    "closingParagraph",
    "companion",
    "description",
    "heroHook",
    "intro",
    "lede",
    "paragraph",
    "paragraphs",
    "text"
  ].some(key => textValueHasContent(options[key]));
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function sourceNoteHref(item = {}, options = {}) {
  if (typeof options.resolveHref === "function") return options.resolveHref(item) ?? "";
  if (item.urlKey) return options.references?.[item.urlKey] ?? "";
  return item.url ?? item.href ?? "";
}

function sourceNoteId(item = {}) {
  if (item.sourceId) return item.sourceId;
  if (item.urlKey) return item.urlKey;

  return (item.label ?? item.title ?? item.text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sourceNoteCategory(item = {}) {
  if (item.category) return item.category;
  if (item.urlKey?.startsWith("nebraska") || item.urlKey?.startsWith("title350")) return "legal-authority";
  if (/\b(IAAO|PAD|Property Assessment Division|Reports & Opinions)\b/.test(item.label ?? "")) return "assessment-guidance";
  return "practice-basis";
}

function renderSourceNoteLink(item = {}, options = {}, suffix = "") {
  const label = item.label ?? item.title ?? item.text ?? "";
  const href = sourceNoteHref(item, options);
  const suffixMarkup = suffix ? `<span class="article-source-note__punctuation">&#8288;${escapeHtml(suffix)}</span>` : "";
  if (!href) return `<span>${escapeHtml(label)}${suffixMarkup}</span>`;

  const target = item.target ?? options.linkTarget ?? "_blank";
  const rel = item.rel ?? options.linkRel ?? "noopener noreferrer";
  const targetAttribute = target ? ` target="${escapeHtml(target)}"` : "";
  const relAttribute = rel ? ` rel="${escapeHtml(rel)}"` : "";

  return `<a href="${escapeHtml(href)}"${targetAttribute}${relAttribute}>${escapeHtml(label)}${suffixMarkup}</a>`;
}

function renderEvidenceReferenceList(records = [], options = {}) {
  return records.map((item, index) => {
    const punctuation = index === records.length - 1 ? "." : ";";
    return `<span class="article-source-note__item">${renderSourceNoteLink(item, options, punctuation)}</span>`;
  }).join(" ");
}

function renderEvidenceText(value = "") {
  if (Array.isArray(value)) {
    return value
      .filter(Boolean)
      .map(part => `<span>${escapeHtml(part)}</span>`)
      .join('<span class="ges-evidence-source__separator" aria-hidden="true">&bull;</span>');
  }

  return escapeHtml(value);
}

function evidenceSourceHref(source = {}, options = {}) {
  if (source.urlKey) return options.references?.[source.urlKey] ?? "";
  return source.url ?? source.href ?? "";
}

function evidenceMetadataValue(source = {}, keys = []) {
  for (const key of keys) {
    const value = source[key];
    if (value) return value;
  }
  return "";
}

function evidenceMetadataAttributes(source = {}, records = [], options = {}) {
  if (options.includeMetadata === false) return [];

  const metadataAttributes = [];
  const metadataSources = records.length ? records : [source];
  const label = source.label ?? source.sourceLabel ?? "Source";
  const sourceIds = uniqueValues(metadataSources.map(item => (options.sourceIdForItem ?? sourceNoteId)(item)));
  const sourceCategories = uniqueValues(metadataSources.map(item => (options.sourceCategoryForItem ?? sourceNoteCategory)(item)));
  const metadataFields = {
    "data-source-label": label,
    "data-source-ids": sourceIds.join(" "),
    "data-source-categories": sourceCategories.join(" "),
    "data-source-type": evidenceMetadataValue(source, ["sourceType", "type", "resourceType"]),
    "data-source-organization": evidenceMetadataValue(source, ["organization", "source", "publisher"]),
    "data-source-publication-date": evidenceMetadataValue(source, ["publicationDate", "publishedDate"]),
    "data-source-last-verified-date": evidenceMetadataValue(source, ["lastVerifiedDate", "lastReviewedDate", "verifiedAsOf"]),
    "data-source-confidence": evidenceMetadataValue(source, ["confidenceLevel", "confidence"]),
    "data-source-citation-format": evidenceMetadataValue(source, ["citationFormat", "citation"]),
    "data-source-version": evidenceMetadataValue(source, ["versionNumber", "version"]),
    "data-source-coverage": evidenceMetadataValue(source, ["dataCoverage", "coverage"]),
    "data-source-author": evidenceMetadataValue(source, ["author"])
  };

  Object.entries(metadataFields).forEach(([name, value]) => {
    if (value) metadataAttributes.push(`${name}="${escapeHtml(value)}"`);
  });

  return metadataAttributes;
}

export function renderEvidenceSource(source = {}, options = {}) {
  const items = Array.isArray(source.items) ? source.items.filter(Boolean) : [];
  const links = Array.isArray(source.links) ? source.links.filter(Boolean) : [];
  const records = [...items, ...links];
  const sourceLabel = source.sourceLabel ?? options.sourceLabel ?? "Source";
  const title = source.title ?? source.name ?? source.source ?? source.label ?? "";
  const subtitle = source.subtitle ?? source.document ?? source.dataset ?? source.citationLabel ?? "";
  const purpose = source.purpose ?? source.usedFor ?? source.description ?? source.text ?? "";
  const url = evidenceSourceHref(source, options);

  if (!title && !subtitle && !purpose && !records.length) return "";

  const classes = [
    "article-source-note",
    "ges-evidence-source",
    options.className,
    source.className
  ].filter(Boolean).join(" ");
  const metadataAttributes = evidenceMetadataAttributes(source, records, options);
  const titleMarkup = title
    ? url
      ? `<a class="ges-evidence-source__title-link" href="${escapeHtml(url)}" target="${escapeHtml(source.target ?? options.linkTarget ?? "_blank")}" rel="${escapeHtml(source.rel ?? options.linkRel ?? "noopener noreferrer")}">${escapeHtml(title)}</a>`
      : escapeHtml(title)
    : "";
  const subtitleMarkup = subtitle
    ? renderEvidenceText(subtitle)
    : records.length
      ? renderEvidenceReferenceList(records, options)
      : "";
  const iconMarkup = source.iconHtml ?? options.iconHtml ?? "";

  return `
    <aside class="${escapeHtml(classes)}" aria-label="${escapeHtml(source.ariaLabel ?? `${sourceLabel}: ${title || subtitle || "supporting evidence"}`)}"${metadataAttributes.length ? ` ${metadataAttributes.join(" ")}` : ""}>
      ${iconMarkup}
      <div class="ges-evidence-source__body">
        <p class="ges-evidence-source__label">${escapeHtml(sourceLabel)}</p>
        ${titleMarkup ? `<p class="ges-evidence-source__title">${titleMarkup}</p>` : ""}
        ${subtitleMarkup ? `<p class="ges-evidence-source__subtitle">${subtitleMarkup}</p>` : ""}
        ${purpose ? `<p class="ges-evidence-source__purpose">${escapeHtml(purpose)}</p>` : ""}
      </div>
    </aside>
  `;
}

export function renderSourceNote(note = {}, options = {}) {
  return renderEvidenceSource(note, options);
}

export { renderEvidenceSource as renderEvidence };

export function renderMemoryAnchor(anchor = {}) {
  const text = anchor.text ?? anchor.statement ?? "";
  if (!text) return "";

  const label = anchor.label ?? "Memory anchor";
  const supporting = anchor.supportingText ?? anchor.description ?? "";
  const contrast = Array.isArray(anchor.contrast) ? anchor.contrast.filter(Boolean) : [];
  const classes = ["ges-memory-anchor", anchor.className].filter(Boolean).join(" ");

  return `
    <aside class="${escapeHtml(classes)}" aria-label="${escapeHtml(label)}">
      <div class="ges-memory-anchor__body">
        <p class="ges-memory-anchor__label">${escapeHtml(label)}</p>
        <p class="ges-memory-anchor__statement">${escapeHtml(text)}</p>
        ${supporting ? `<p class="ges-memory-anchor__supporting">${escapeHtml(supporting)}</p>` : ""}
      </div>
      ${contrast.length ? `
        <dl class="ges-memory-anchor__contrast">
          ${contrast.map(item => `
            <div>
              <dt>${escapeHtml(item.term ?? item.label ?? "")}</dt>
              <dd>${escapeHtml(item.description ?? item.value ?? "")}</dd>
            </div>
          `).join("")}
        </dl>
      ` : ""}
    </aside>
  `;
}

export function renderActTransition(transition = {}) {
  const title = transition.title ?? "";
  if (!title) return "";

  const kicker = transition.kicker ?? "Next";
  const description = transition.description ?? "";
  const href = transition.href ?? "";
  const classes = ["ges-act-transition", transition.className].filter(Boolean).join(" ");
  const titleMarkup = href
    ? `<a href="${escapeHtml(href)}">${escapeHtml(title)}</a>`
    : `<span>${escapeHtml(title)}</span>`;

  return `
    <aside class="${escapeHtml(classes)}" aria-label="${escapeHtml(kicker)}">
      <p class="ges-act-transition__kicker">${escapeHtml(kicker)}</p>
      <p class="ges-act-transition__title">${titleMarkup}</p>
      ${description ? `<p class="ges-act-transition__description">${escapeHtml(description)}</p>` : ""}
    </aside>
  `;
}

function renderNoteBody({ label = "", text = "", splitLead = false } = {}) {
  if (label) {
    return `<span><strong>${escapeHtml(`${label}:`)}</strong> ${escapeHtml(text)}</span>`;
  }

  if (splitLead) {
    const [lead, ...rest] = String(text).split(":");
    if (rest.length) {
      return `<span><strong>${escapeHtml(`${lead}:`)}</strong> ${escapeHtml(rest.join(":").trim())}</span>`;
    }
  }

  return `<span>${escapeHtml(text)}</span>`;
}

function safeTextTag(value = "", fallback = "p") {
  const tag = String(value || fallback).toLowerCase();
  return ["p", "h2", "h3", "h4", "h5", "h6"].includes(tag) ? tag : fallback;
}

export function renderArticleNote(note = {}, options = {}) {
  const text = note.text ?? options.text ?? "";
  const label = note.label ?? options.label ?? "";
  if (!text && !label) return "";

  const variant = note.variant ?? options.variant ?? "";
  const iconHtml = note.iconHtml ?? options.iconHtml ?? "";
  const classes = [
    "article-caution-note",
    variant === "guidance" ? "article-guidance-note" : "",
    options.className,
    note.className
  ].filter(Boolean).join(" ");

  return `
    <p class="${escapeHtml(classes)}">
      ${iconHtml}
      ${renderNoteBody({ label, text, splitLead: note.splitLead ?? options.splitLead })}
    </p>
  `;
}

export function renderContinuationModule(module = {}, options = {}) {
  const paragraphs = Array.isArray(module.paragraphs) ? module.paragraphs.filter(Boolean) : [];
  const title = module.title ?? "";
  const link = module.link ?? null;

  if (!title && !paragraphs.length && !link) return "";

  const id = options.id ?? module.id ?? "gesContinuationTitle";
  const titleTag = safeTextTag(options.titleTag ?? module.titleTag, "h3");
  const paragraphClass = options.paragraphClass ?? module.paragraphClass ?? "";
  const action = options.action ?? module.action ?? "continuation_article";
  const classes = ["continuation-module", options.className, module.className].filter(Boolean).join(" ");
  const linkHref = link?.href ?? link?.url ?? "";
  const linkTitle = link?.title ?? link?.label ?? "";
  const titleMarkup = title
    ? `<${titleTag} id="${escapeHtml(id)}">${escapeHtml(title)}</${titleTag}>`
    : "";

  return `
    <aside class="${escapeHtml(classes)}"${title ? ` aria-labelledby="${escapeHtml(id)}"` : ""}>
      ${titleMarkup}
      ${paragraphs.map(paragraph => `<p${paragraphClass ? ` class="${escapeHtml(paragraphClass)}"` : ""}>${escapeHtml(paragraph)}</p>`).join("")}
      ${link ? `
        <p class="continuation-link">
          ${link.label ? `<span>${escapeHtml(link.label)}</span>` : ""}
          ${linkHref ? `<a href="${escapeHtml(linkHref)}" data-article-action="${escapeHtml(link.action ?? action)}" data-article-label="${escapeHtml(linkTitle)}">${escapeHtml(linkTitle)}</a>` : `<span>${escapeHtml(linkTitle)}</span>`}
        </p>
      ` : ""}
    </aside>
  `;
}

export function renderReaderCheckpoint(checkpoint = {}) {
  const items = Array.isArray(checkpoint.items) ? checkpoint.items.filter(Boolean) : [];
  const title = checkpoint.title ?? "Before you continue...";
  if (!items.length && !checkpoint.intro) return "";

  return `
    <aside class="ges-reader-checkpoint" aria-label="${escapeHtml(title)}">
      <div class="ges-reader-checkpoint__header">
        <p class="ges-reader-checkpoint__kicker">Checkpoint</p>
        <h3>${escapeHtml(title)}</h3>
        ${checkpoint.intro ? `<p>${escapeHtml(checkpoint.intro)}</p>` : ""}
      </div>
      ${items.length ? `
        <ul class="ges-reader-checkpoint__list">
          ${items.map(item => `<li><span aria-hidden="true"></span>${escapeHtml(item)}</li>`).join("")}
        </ul>
      ` : ""}
    </aside>
  `;
}

export function renderKeyIdea(idea = {}) {
  const title = idea.title ?? idea.text ?? idea.statement ?? "";
  if (!title) return "";

  const label = idea.label ?? "Key idea";
  const description = idea.description ?? idea.supportingText ?? "";
  const items = Array.isArray(idea.items) ? idea.items.filter(Boolean) : [];

  return `
    <aside class="ges-key-idea" aria-label="${escapeHtml(label)}">
      <p class="ges-key-idea__label">${escapeHtml(label)}</p>
      <p class="ges-key-idea__statement">${escapeHtml(title)}</p>
      ${description ? `<p class="ges-key-idea__description">${escapeHtml(description)}</p>` : ""}
      ${items.length ? `
        <ul class="ges-key-idea__items">
          ${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      ` : ""}
    </aside>
  `;
}

export function renderExpandableDetail(detail = {}) {
  const title = detail.title ?? detail.label ?? "";
  if (!title) return "";

  const summary = detail.summary ?? detail.description ?? "";
  const content = Array.isArray(detail.content) ? detail.content.filter(Boolean) : [];

  return `
    <details class="ges-expandable-detail">
      <summary>
        <span class="ges-expandable-detail__title">${escapeHtml(title)}</span>
        ${summary ? `<span class="ges-expandable-detail__summary">${escapeHtml(summary)}</span>` : ""}
      </summary>
      ${content.length ? `
        <div class="ges-expandable-detail__content">
          ${content.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        </div>
      ` : ""}
    </details>
  `;
}

function isExternalUrl(url = "") {
  return /^https?:\/\//i.test(url);
}

function cardHref(card = {}, references = {}) {
  if (card.hrefKey) return references[card.hrefKey] ?? "";
  return card.href ?? card.url ?? "";
}

export function renderContinueExploring(block = {}, options = {}) {
  const cards = Array.isArray(block.cards) ? block.cards.filter(Boolean) : [];
  if (!cards.length) return "";

  const references = options.references ?? {};
  const id = options.id ?? block.id ?? "continueExploring";
  const title = block.title ?? "Continue exploring";
  const intro = block.intro ?? "";

  return `
    <section class="ges-continue-exploring" aria-labelledby="${escapeHtml(id)}Title">
      <header class="ges-continue-exploring__header">
        <p class="guided-kicker">Continue Exploring</p>
        <h2 id="${escapeHtml(id)}Title">${escapeHtml(title)}</h2>
        ${intro ? `<p>${escapeHtml(intro)}</p>` : ""}
      </header>
      <div class="ges-continue-exploring__grid">
        ${cards.map(card => {
          const href = cardHref(card, references);
          const titleText = card.title ?? "";
          const action = card.action ?? "Open";
          const status = card.status ?? "";
          const linkAttrs = href && isExternalUrl(href) ? ` target="_blank" rel="noopener noreferrer"` : "";
          return `
            <article class="ges-exploration-card"${status ? ` data-status="${escapeHtml(status)}"` : ""}>
              ${card.eyebrow ? `<p class="ges-exploration-card__eyebrow">${escapeHtml(card.eyebrow)}</p>` : ""}
              <h3>${href ? `<a href="${escapeHtml(href)}"${linkAttrs}>${escapeHtml(titleText)}</a>` : escapeHtml(titleText)}</h3>
              ${card.description ? `<p>${escapeHtml(card.description)}</p>` : ""}
              ${href ? `<span class="ges-exploration-card__action">${escapeHtml(action)}</span>` : `<span class="ges-exploration-card__status">${escapeHtml(status || "Planned")}</span>`}
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function slugValue(value = "") {
  return `${value}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function clampHeadingLevel(value, fallback = 2) {
  const level = Number.parseInt(value, 10);
  if (!Number.isFinite(level)) return fallback;
  return Math.min(6, Math.max(2, level));
}

function resourceItemTitle(item = {}) {
  return item.title ?? item.label ?? item.citationLabel ?? "";
}

function resourceItemUrl(item = {}, references = {}) {
  if (item.urlKey) return references[item.urlKey] ?? "";
  return item.url ?? item.href ?? "";
}

function resourceItemId(item = {}) {
  if (item.sourceId) return item.sourceId;
  if (item.urlKey) return item.urlKey;
  return slugValue(resourceItemTitle(item));
}

function resourceItemCategory(item = {}) {
  if (item.category) return item.category;
  if (item.type) return slugValue(item.type);
  if (item.urlKey?.startsWith("nebraska") || item.urlKey?.startsWith("title350")) return "legal-authority";
  if (/\b(IAAO|PAD|Property Assessment Division|Reports? & Opinions?|R&O)\b/i.test(resourceItemTitle(item))) return "assessment-guidance";
  return "official-resource";
}

function resourceTypeLabel(item = {}) {
  const explicitType = item.type ?? item.resourceType;
  if (explicitType) {
    const explicitSlug = slugValue(explicitType);
    return RESOURCE_TYPE_LABELS[explicitSlug] ?? explicitType;
  }

  const category = resourceItemCategory(item);
  return RESOURCE_TYPE_LABELS[category] ?? category.replace(/-/g, " ");
}

function resourceBlockTitle(block = {}, options = {}) {
  const title = block?.title ?? options.title ?? "";
  if (!title || /^resources(?:\s+and\s+authorities)?$/i.test(title.trim())) return "Administrative Reference";
  return title;
}

function resourceBlockIntro(block = {}, options = {}) {
  const title = block?.title ?? options.title ?? "";
  const defaultIntro = "Everything below supports the information presented above, including legal authorities, comparison readings, and related tools.";
  if (!title || /^resources(?:\s+and\s+authorities)?$/i.test(title.trim())) return options.intro ?? defaultIntro;
  return block?.intro
    ?? block?.description
    ?? options.intro
    ?? defaultIntro;
}

function resourceGroupHeading(heading = "") {
  const normalized = `${heading}`.trim();
  if (!normalized) return "";
  if (/^legal\s+and\s+public\s+administration\s+context$/i.test(normalized)) return "Legal and Public Administration Context";
  if (/^(companion|comparison)\s+reading$/i.test(normalized)) return "Comparison Reading";
  if (/^related\s+tools?$/i.test(normalized)) return "Related Tools";
  if (/^(downloads?|reports?|downloads?\s*\/\s*reports?)$/i.test(normalized)) return "Downloads / Reports";
  if (/^(contacts?|offices?|contacts?\s*\/\s*offices?)$/i.test(normalized)) return "Contact / Offices";
  return normalized;
}

function normalizeResourceGroups(block = {}) {
  if (Array.isArray(block)) {
    return [{ heading: "", items: block }];
  }

  if (Array.isArray(block.groups) && block.groups.length) {
    return block.groups
      .map(group => ({
        heading: resourceGroupHeading(group.label ?? group.heading ?? group.title ?? ""),
        items: Array.isArray(group.items) ? group.items.filter(Boolean) : []
      }))
      .filter(group => group.items.length);
  }

  const items = Array.isArray(block.items) ? block.items.filter(Boolean) : [];
  return items.length ? [{ heading: resourceGroupHeading(block.groupHeading ?? block.label ?? ""), items }] : [];
}

function renderResourceItem(item = {}, references = {}) {
  const title = resourceItemTitle(item);
  if (!title) return "";

  const url = resourceItemUrl(item, references);
  const type = resourceTypeLabel(item);
  const metaParts = uniqueValues([
    item.source,
    item.publisher,
    item.jurisdiction,
    item.lastReviewedDate ? `Last reviewed ${item.lastReviewedDate}` : ""
  ]);
  const citation = item.citationLabel && item.citationLabel !== title
    ? `<p class="ges-resource-entry__citation">${escapeHtml(item.citationLabel)}</p>`
    : "";
  const description = item.description ? `<p class="ges-resource-entry__description">${escapeHtml(item.description)}</p>` : "";
  const note = item.note ? `<p class="ges-resource-entry__note">${escapeHtml(item.note)}</p>` : "";
  const titleMarkup = url
    ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a>`
    : `<span>${escapeHtml(title)}</span>`;

  return `
          <li class="ges-resource-entry" data-resource-type="${escapeHtml(slugValue(type))}">
            <p class="ges-resource-entry__type">${escapeHtml(type)}</p>
            <div class="ges-resource-entry__body">
              <p class="ges-resource-entry__title">${titleMarkup}</p>
              ${metaParts.length ? `<p class="ges-resource-entry__meta">${metaParts.map(escapeHtml).join(" &middot; ")}</p>` : ""}
              ${citation}
              ${description}
              ${note}
              ${url ? `<code class="ges-resource-entry__url">${escapeHtml(url)}</code>` : ""}
            </div>
          </li>
  `;
}

export function renderResourcesBlock(block, options = {}) {
  const groups = normalizeResourceGroups(block);
  if (!groups.length) return "";

  const references = options.references ?? {};
  const title = resourceBlockTitle(block, options);
  const intro = resourceBlockIntro(block, options);
  const id = options.id ?? block?.id ?? "gesResourcesBlock";
  const headingLevel = clampHeadingLevel(options.headingLevel ?? block?.headingLevel);
  const groupHeadingLevel = clampHeadingLevel(headingLevel + 1, 3);
  const headingTag = `h${headingLevel}`;
  const groupHeadingTag = `h${groupHeadingLevel}`;
  const resourceItems = groups.flatMap(group => group.items);
  const sourceIds = uniqueValues(resourceItems.map(resourceItemId));
  const sourceCategories = uniqueValues(resourceItems.map(resourceItemCategory));
  const classes = [
    "ges-resources-block",
    "ges-administrative-reference",
    "article-sources-used",
    options.className,
    block?.className
  ].filter(Boolean).join(" ");

  return `
    <section class="${escapeHtml(classes)}" aria-labelledby="${escapeHtml(id)}Title" data-source-ids="${escapeHtml(sourceIds.join(" "))}" data-source-categories="${escapeHtml(sourceCategories.join(" "))}">
      <div class="ges-resources-block__inner">
        <header class="ges-resources-block__header">
          <p class="guided-kicker">Reference</p>
          <${headingTag} id="${escapeHtml(id)}Title">${escapeHtml(title)}</${headingTag}>
          ${intro ? `<p>${escapeHtml(intro)}</p>` : ""}
        </header>
        <div class="ges-resources-block__groups">
          ${groups.map((group, index) => `
            <section class="ges-resource-group"${group.heading ? ` aria-labelledby="${escapeHtml(`${id}Group${index + 1}`)}"` : ""}>
              ${group.heading ? `<${groupHeadingTag} id="${escapeHtml(`${id}Group${index + 1}`)}">${escapeHtml(group.heading)}</${groupHeadingTag}>` : ""}
              <ul class="ges-resource-list">
                ${group.items.map(item => renderResourceItem(item, references)).join("")}
              </ul>
            </section>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

export function renderAdministrativeReference(block, options = {}) {
  return renderResourcesBlock(block, {
    id: options.id,
    headingLevel: options.headingLevel,
    references: options.references,
    className: ["ges-administrative-reference-zone", options.className].filter(Boolean).join(" ")
  });
}

function normalizeTableCell(cell) {
  if (cell && typeof cell === "object") return cell;
  return { value: cell };
}

export function renderCivicDataTable(table = {}, options = {}) {
  const columns = Array.isArray(table.columns) ? table.columns : [];
  const rows = Array.isArray(table.rows) ? table.rows : [];
  if (!columns.length || !rows.length) return "";

  const caption = table.caption ?? options.caption ?? "";
  const classes = ["ges-civic-data-table", table.variant ? `ges-civic-data-table--${slugValue(table.variant)}` : "", options.className, table.className].filter(Boolean).join(" ");

  return `
    <div class="ges-civic-data-table-wrap">
      <table class="${escapeHtml(classes)}">
        ${caption ? `<caption>${escapeHtml(caption)}</caption>` : ""}
        <thead>
          <tr>
            ${columns.map(column => `<th scope="col">${escapeHtml(column.label ?? column.key ?? "")}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${columns.map((column, index) => {
                const key = column.key ?? index;
                const cell = normalizeTableCell(Array.isArray(row) ? row[index] : row[key]);
                const value = cell.value ?? "";
                const label = column.shortLabel ?? column.label ?? column.key ?? "";
                const attributes = [
                  `data-label="${escapeHtml(label)}"`,
                  cell.tone ? `data-tone="${escapeHtml(cell.tone)}"` : "",
                  cell.className ? `class="${escapeHtml(cell.className)}"` : ""
                ].filter(Boolean).join(" ");
                const tag = index === 0 ? "th" : "td";
                const scope = index === 0 ? ' scope="row"' : "";
                return `<${tag}${scope} ${attributes}>${escapeHtml(value)}</${tag}>`;
              }).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

export function renderSectionHeader(kicker, title, id, options = {}) {
  const companion = options.companion ? `<p class="ges-section-companion">${escapeHtml(options.companion)}</p>` : "";
  const insight = hasMarginInsightCompanionText(options)
    ? renderMarginInsight(options.marginInsight, { placement: options.marginInsightPlacement })
    : "";
  const classes = ["tax-article-header", "editorial-section-header", insight ? "ges-section-header--with-insight" : ""].filter(Boolean).join(" ");

  return `
    <header class="${classes}">
      <div class="ges-section-heading">
        <p class="guided-kicker">${escapeHtml(kicker)}</p>
        <h2 id="${escapeHtml(id)}">${escapeHtml(title)}</h2>
        ${companion}
      </div>
      ${insight}
    </header>
  `;
}

export function renderArticleTags(tags = []) {
  if (!tags.length) return "";

  return `
        <ul class="article-entry-tags" aria-label="Article tags">
          ${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}
        </ul>`;
}

export function renderArticleHero({
  className = "",
  label = "Article",
  mediaHtml = "",
  subject = "",
  subtitle = "",
  tags = [],
  title = "",
  titleId = "articleTitle"
} = {}) {
  const classes = ["comp-page-title", "levy-page-title", "article-hero", className].filter(Boolean).join(" ");
  const subjectMarkup = subject
    ? `
              <span class="hero-kicker-divider" aria-hidden="true">/</span>
              <span class="hero-kicker-subject">${escapeHtml(subject)}</span>`
    : "";

  return `
    <header class="${escapeHtml(classes)}" aria-labelledby="${escapeHtml(titleId)}">
      <div class="article-hero-packet">
        <div class="hero-kicker-row">
          <p class="guided-kicker hero-kicker hero-brand-kicker">
            <span class="hero-kicker-text">
              <span class="hero-kicker-label">${escapeHtml(label)}</span>${subjectMarkup}
            </span>
          </p>
        </div>
        <h1 id="${escapeHtml(titleId)}" class="hero-title">${escapeHtml(title)}</h1>
        ${subtitle ? `<p class="hero-deck">${escapeHtml(subtitle)}</p>` : ""}
        ${renderArticleTags(tags)}
      </div>
      ${mediaHtml}
    </header>
  `;
}

export function formatGuideLengthText(minutes) {
  const numericMinutes = Number.parseInt(minutes, 10);
  if (!Number.isFinite(numericMinutes) || numericMinutes < 1) return "";
  const article = /^[8]|^11|^18/.test(String(numericMinutes)) ? "an" : "a";
  return `About ${article} ${numericMinutes}-minute read`;
}

export function renderGuideUtility({
  articleTitle,
  audioUrl = "",
  icon,
  printableLabel = "Print Version",
  printableUrl,
  readingMinutes,
  lengthLabel = "",
  wordCount = ""
}) {
  const safeIcon = typeof icon === "function" ? icon : () => "";
  const printableControl = printableUrl ? `
          <a class="format-control-item hero-utility-button article-print-cta" href="${escapeHtml(printableUrl)}" download data-article-action="download_pdf" data-article-label="${escapeHtml(`${printableLabel} PDF`)}">
            ${safeIcon("document")}
            <span>${escapeHtml(printableLabel)}</span>
          </a>` : "";
  const audioControl = audioUrl ? `
          <details class="hero-audio format-control-item-shell" data-hero-audio>
            <summary class="format-control-item hero-utility-button article-audio-cta">
              ${safeIcon("audio")}
              <span>Audio version</span>
            </summary>
            <div class="hero-audio-panel">
              <p>Full audio version of this guide.</p>
              <audio class="hero-audio-player" data-hero-audio-player controls preload="none" src="${escapeHtml(audioUrl)}">
                <a href="${escapeHtml(audioUrl)}">Download the MP3 audio version.</a>
              </audio>
              <a class="hero-audio-download" href="${escapeHtml(audioUrl)}" download data-article-action="audio_article_download" data-article-label="Audio article MP3">Download MP3</a>
            </div>
          </details>` : "";
  const formatControls = [printableControl, audioControl].filter(Boolean).join("");

  return `
    <section class="guide-utility" aria-label="Guide options">
      <div class="guide-length" aria-label="Estimated guide length" data-guide-length data-reading-minutes="${escapeHtml(readingMinutes)}" data-word-count="${escapeHtml(wordCount)}" data-length-label="${escapeHtml(lengthLabel)}">
        <p class="guide-length-label" data-guide-length-label>${escapeHtml(formatGuideLengthText(readingMinutes))}</p>
      </div>
      ${formatControls ? `<div class="guide-formats hero-utility" aria-label="Available formats">
        <div class="format-control">
          ${formatControls}
        </div>
      </div>` : ""}
    </section>
  `;
}

export function renderArticleEntryPanel({
  articleSlug = "",
  articleTitle,
  authorImage,
  authorMailto,
  authorName,
  authorTitle = "",
  displayDate,
  icon,
  printableLabel,
  printableUrl,
  audioUrl = "",
  readingMinutes,
  wordCount,
  lengthLabel
}) {
  return `
    <div class="article-entry-panel article-entry-panel--locked" data-article-entry-panel>
      <div class="article-entry-meta" aria-label="Article information">
        <div class="article-author-attribution">
          <img class="article-author-photo" src="${escapeHtml(authorImage)}" alt="" loading="lazy" decoding="async" />
          <div class="article-author-copy">
            <p class="article-author-name"><a href="${escapeHtml(authorMailto)}" data-article-action="author_email" data-article-label="${escapeHtml(articleTitle)}"><span class="article-author-name-text">${escapeHtml(authorName)}</span></a></p>
            ${authorTitle ? `<p class="article-author-title">${escapeHtml(authorTitle)}</p>` : ""}
            <p class="article-entry-date">${escapeHtml(displayDate)}</p>
          </div>
        </div>
        <span class="article-reader-count" data-article-reader-count data-article-slug="${escapeHtml(articleSlug)}" hidden aria-live="polite"></span>
      </div>
      ${renderGuideUtility({
        articleTitle,
        audioUrl,
        icon,
        printableLabel,
        printableUrl,
        readingMinutes,
        wordCount,
        lengthLabel
      })}
    </div>
  `;
}

export function installGuideUtilityLanguage(root = document) {
  root.querySelectorAll("[data-guide-length]").forEach(lengthElement => {
    const label = lengthElement.querySelector("[data-guide-length-label]");
    const text = formatGuideLengthText(lengthElement.dataset.readingMinutes);
    if (!text) {
      lengthElement.hidden = true;
      return;
    }
    if (label) label.textContent = text;
  });
}
