const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const PDF_LIB_PATH = "assets/vendor/pdf-lib.min.js";

let pdfLibPromise;

function loadPdfLib() {
  if (window.PDFLib) return Promise.resolve(window.PDFLib);

  pdfLibPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PDF_LIB_PATH;
    script.async = true;
    script.onload = () => {
      if (window.PDFLib) {
        resolve(window.PDFLib);
        return;
      }

      reject(new Error("PDF generation library loaded but did not expose PDFLib."));
    };
    script.onerror = () => reject(new Error("PDF generation library could not be loaded."));
    document.head.append(script);
  });

  return pdfLibPromise;
}

export function buildRecordCorrectionSubmission({ data, formValues, selectedCategories, governingOffice }) {
  const office = governingOffice?.office ?? {};
  const contact = office.contact ?? {};
  const address = office.address ?? {};
  const hours = office.office_hours ?? {};
  const senderName = formValues.senderName || data.parcel.owner || copy("recordCorrectionRequest.senderFallback", "Not provided");
  const categories = selectedCategories || [];

  return {
    title: copy("recordCorrectionRequest.title", "Property Record Correction Request"),
    submittedAt: new Date().toISOString(),
    parcel: {
      parcelId: data.parcel.parcelId,
      situsAddress: data.parcel.situsAddress,
      owner: data.parcel.owner,
      mailingAddress: data.parcel.mailingAddress,
      legalDescription: data.parcel.legalDescription,
      taxDistrict: data.parcel.taxDistrict,
      county: data.parcel.countyName,
      propertyClass: data.classification.propertyClass,
      location: data.classification.location,
      lotSize: data.classification.lotSize
    },
    sender: {
      name: senderName,
      email: formValues.email,
      phone: formValues.phone,
      preferredContactMethod: formValues.contactMethod
    },
    selectedCategories: categories,
    reviewCategoryCount: categories.filter(category => category.status === "may-need-review").length,
    availableCategoryCount: 6,
    narrative: formValues.comments,
    acknowledgment: copy("recordCorrectionRequest.acknowledgment", "I understand this request is for factual property record review."),
    office: {
      assessorName: office.assessor_name,
      title: office.office_title,
      county: office.county,
      state: office.state,
      email: contact.email,
      phone: contact.phone,
      website: contact.website,
      hours: [hours.days, hours.open && hours.close ? `${hours.open} - ${hours.close}` : null].filter(Boolean).join(", "),
      address: [address.street, `${address.city || ""}, ${address.state || ""} ${address.zip || ""}`.trim()].filter(Boolean).join("\n")
    }
  };
}

export function buildRecordCorrectionEmailPayload(submission, pdfBytes) {
  const parcelId = submission.parcel.parcelId || "unknown parcel";
  const sender = submission.sender;
  const preferredContact = contactMethodLabel(sender.preferredContactMethod).toLowerCase();

  return {
    to: submission.office.email,
    cc: sender.email,
    subject: copyTemplate("recordCorrectionRequest.emailSubjectTemplate", { parcelId }, `Property Record Correction Request - Parcel ${parcelId}`),
    body: [
      copyTemplate("recordCorrectionRequest.emailBody.attachedTemplate", { parcelId }, `Attached is a property record correction request for parcel ${parcelId}.`),
      "",
      copyTemplate("recordCorrectionRequest.emailBody.contactTemplate", { preferredContact }, `Please contact me by ${preferredContact} if additional information is needed.`),
      "",
      copy("recordCorrectionRequest.emailBody.thanks", "Thank you,"),
      "",
      sender.name,
      sender.phone,
      sender.email
    ].filter(line => line !== undefined && line !== null).join("\n"),
    attachment: {
      fileName: `property-record-correction-${parcelId}.pdf`,
      contentType: "application/pdf",
      byteLength: pdfBytes.length
    }
  };
}

export async function generateRecordCorrectionPdf(submission) {
  // PDF generation is an optional action path, so the vendor asset loads only when a user prepares a correction request.
  const pdfLib = await loadPdfLib();

  const { PDFDocument, StandardFonts, rgb } = pdfLib;
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const palette = {
    ink: rgb(0.12, 0.18, 0.29),
    muted: rgb(0.36, 0.44, 0.56),
    line: rgb(0.82, 0.86, 0.91),
    panel: rgb(0.96, 0.98, 1),
    navy: rgb(0.18, 0.27, 0.40)
  };

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function ensureSpace(height) {
    if (y - height >= MARGIN) return;
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  }

  function text(content, x, yPos, options = {}) {
    page.drawText(String(content ?? ""), {
      x,
      y: yPos,
      size: options.size ?? 10,
      font: options.bold ? bold : regular,
      color: options.color ?? palette.ink
    });
  }

  function lines(content, maxWidth, size = 10, font = regular) {
    const words = String(content ?? "").split(/\s+/).filter(Boolean);
    const output = [];
    let line = "";

    words.forEach(word => {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        line = next;
      } else {
        if (line) output.push(line);
        line = word;
      }
    });

    if (line) output.push(line);
    return output.length ? output : [""];
  }

  function wrapped(content, x, maxWidth, options = {}) {
    const size = options.size ?? 10;
    const font = options.bold ? bold : regular;
    const lineHeight = options.lineHeight ?? 14;
    const textLines = String(content ?? "").split("\n").flatMap(line => lines(line, maxWidth, size, font));
    ensureSpace(textLines.length * lineHeight + 8);
    textLines.forEach(line => {
      y -= lineHeight;
      text(line, x, y, { ...options, size });
    });
  }

  function section(title) {
    ensureSpace(34);
    y -= 24;
    text(title, MARGIN, y, { size: 13, bold: true, color: palette.navy });
    y -= 8;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: palette.line });
  }

  function keyValueRows(rows) {
    const labelWidth = 150;
    rows.filter(([, value]) => value !== null && value !== undefined && value !== "").forEach(([label, value]) => {
      const valueLines = String(value).split("\n").flatMap(line => lines(line, CONTENT_WIDTH - labelWidth - 16, 10, regular));
      const rowHeight = Math.max(18, valueLines.length * 13 + 4);
      ensureSpace(rowHeight);
      y -= 15;
      text(label, MARGIN, y, { size: 9, bold: true, color: palette.muted });
      valueLines.forEach((line, index) => {
        text(line, MARGIN + labelWidth, y - index * 13, { size: 10 });
      });
      y -= Math.max(4, (valueLines.length - 1) * 13 + 5);
    });
  }

  function selectedCategorySummary(categories) {
    if (!categories.length) {
      wrapped(copy("recordCorrectionRequest.pdf.emptyCategories", "No review categories selected; comments provided."), MARGIN, CONTENT_WIDTH, { size: 10 });
      return;
    }

    categories.forEach(category => {
      const exampleText = Array.isArray(category.examples) && category.examples.length
        ? `${copy("recordCorrectionRequest.pdf.examplesPrefix", "Examples:")} ${category.examples.join(", ")}`
        : "";
      const status = category.statusLabel || copy("recordCorrectionRequest.pdf.selectedStatusFallback", "Selected");
      const descriptionLines = lines(category.description || "", CONTENT_WIDTH - 20, 9.5, regular);
      const exampleLines = exampleText ? lines(exampleText, CONTENT_WIDTH - 20, 8.5, regular) : [];
      const rowHeight = 33 + descriptionLines.length * 12 + exampleLines.length * 11;

      ensureSpace(rowHeight);
      y -= 18;
      text(category.title, MARGIN, y, { size: 10, bold: true, color: palette.ink });
      text(status, PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize(status, 9), y, { size: 9, bold: true, color: palette.muted });
      y -= 13;
      descriptionLines.forEach((line, index) => {
        text(line, MARGIN + 10, y - index * 12, { size: 9.5, color: palette.ink });
      });
      y -= descriptionLines.length * 12;
      exampleLines.forEach((line, index) => {
        text(line, MARGIN + 10, y - index * 11, { size: 8.5, color: palette.muted });
      });
      y -= Math.max(8, exampleLines.length * 11);
      page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.5, color: palette.line });
    });
  }

  const sectionLabels = copyArray("recordCorrectionRequest.pdf.sections", [
    "1. Submission Details",
    "2. Property / Parcel Summary",
    "3. Requested Record Review Categories",
    "4. Correction Narrative",
    "5. Taxpayer Acknowledgment",
    "6. Assessor's Office Routing Information"
  ]);
  const labels = copyObject("recordCorrectionRequest.labels", {});

  text(copy("recordCorrectionRequest.title", "Property Record Correction Request"), MARGIN, y, { size: 20, bold: true, color: palette.navy });
  y -= 22;
  wrapped(
    copy("recordCorrectionRequest.pdf.intro", "Use this request for factual review of parcel, land, dwelling, improvement, or other property record details."),
    MARGIN,
    CONTENT_WIDTH,
    { size: 10, color: palette.ink, lineHeight: 14 }
  );

  section(sectionLabels[0]);
  keyValueRows([
    [labels.dateTimeSubmitted || "Date/time submitted", formatSubmittedAt(submission.submittedAt)],
    [labels.parcelId || "Parcel ID", submission.parcel.parcelId],
    [labels.propertyAddress || "Property address", submission.parcel.situsAddress],
    [labels.ownerTaxpayerName || "Owner/taxpayer name", submission.parcel.owner],
    [labels.senderName || "Sender name", submission.sender.name],
    [labels.senderEmail || "Sender email", submission.sender.email],
    [labels.senderPhone || "Sender phone", submission.sender.phone],
    [labels.preferredContactMethod || "Preferred contact method", contactMethodLabel(submission.sender.preferredContactMethod)]
  ]);

  section(sectionLabels[1]);
  keyValueRows([
    [labels.mailingAddress || "Mailing address", submission.parcel.mailingAddress],
    [labels.legalDescription || "Legal description", submission.parcel.legalDescription],
    [labels.county || "County", submission.parcel.county ? `${submission.parcel.county} County` : null],
    [labels.taxDistrict || "Tax district", submission.parcel.taxDistrict],
    [labels.propertyClass || "Property class", submission.parcel.propertyClass],
    [labels.location || "Location", submission.parcel.location],
    [labels.lotSize || "Lot size", submission.parcel.lotSize]
  ]);

  section(sectionLabels[2]);
  selectedCategorySummary(submission.selectedCategories || []);

  section(sectionLabels[3]);
  wrapped(submission.narrative || copy("recordCorrectionRequest.pdf.emptyNarrative", "No additional narrative provided."), MARGIN, CONTENT_WIDTH, { size: 10, lineHeight: 14 });

  section(sectionLabels[4]);
  wrapped(submission.acknowledgment, MARGIN, CONTENT_WIDTH, { size: 10, lineHeight: 14 });

  section(sectionLabels[5]);
  keyValueRows([
    [labels.office || "Office", submission.office.title || submission.office.assessorName],
    [labels.assessor || "Assessor", submission.office.assessorName],
    [labels.email || "Email", submission.office.email],
    [labels.phone || "Phone", submission.office.phone],
    [labels.officeHours || "Office hours", submission.office.hours],
    [labels.address || "Address", submission.office.address],
    [labels.website || "Website", submission.office.website]
  ]);

  return doc.save();
}

export function contactMethodLabel(value) {
  const labels = copyObject("recordCorrectionRequest.contactMethods", {});
  return labels[value] ?? labels.fallback ?? "Not provided";
}

function formatSubmittedAt(iso) {
  if (!iso) return copy("recordCorrectionRequest.dateFallback", "Not available");
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(new Date(iso));
}
import { copy, copyArray, copyObject, copyTemplate } from "./content/site-copy.js";
