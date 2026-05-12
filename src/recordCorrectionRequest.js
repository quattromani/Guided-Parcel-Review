const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export function buildRecordCorrectionSubmission({ data, rows, formValues, selectedItems, governingOffice }) {
  const office = governingOffice?.office ?? {};
  const contact = office.contact ?? {};
  const address = office.address ?? {};
  const hours = office.office_hours ?? {};
  const senderName = formValues.senderName || data.parcel.owner || "Not provided";

  return {
    title: "Property Record Correction Request",
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
    selectedItems,
    availableItemCount: rows.length,
    narrative: formValues.comments,
    acknowledgment: "I understand this request is for factual property record review and is not a formal valuation protest.",
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
    subject: `Property Record Correction Request - Parcel ${parcelId}`,
    body: [
      `Attached is my property record correction request for parcel ${parcelId}.`,
      "",
      `Please contact me by ${preferredContact} if additional information is needed.`,
      "",
      "Thank you,",
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
  const pdfLib = window.PDFLib;
  if (!pdfLib) {
    throw new Error("PDF generation library is not available.");
  }

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

  function selectedItemTable(items) {
    if (!items.length) {
      wrapped("No checklist rows selected; narrative provided.", MARGIN, CONTENT_WIDTH, { size: 10 });
      return;
    }

    const columns = [
      { label: "Category", x: MARGIN, width: 110 },
      { label: "Item", x: MARGIN + 116, width: 120 },
      { label: "Current record value", x: MARGIN + 242, width: 190 },
      { label: "Issue", x: MARGIN + 438, width: 80 }
    ];
    ensureSpace(28);
    y -= 18;
    columns.forEach(column => text(column.label, column.x, y, { size: 8.5, bold: true, color: palette.muted }));
    y -= 8;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: palette.line });

    items.forEach(item => {
      const cellLines = columns.map(column => {
        const value = column.label === "Category" ? item.section
          : column.label === "Item" ? item.label
            : column.label === "Issue" ? item.issueLabel
              : item.value;
        return lines(value || "Not available", column.width, 8.5, regular);
      });
      const rowHeight = Math.max(...cellLines.map(itemLines => itemLines.length)) * 12 + 8;
      ensureSpace(rowHeight);
      y -= 14;
      cellLines.forEach((itemLines, cellIndex) => {
        itemLines.forEach((line, lineIndex) => {
          text(line, columns[cellIndex].x, y - lineIndex * 11, { size: 8.5 });
        });
      });
      y -= rowHeight - 14;
      page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.5, color: palette.line });
    });
  }

  text("Property Record Correction Request", MARGIN, y, { size: 20, bold: true, color: palette.navy });
  y -= 22;
  wrapped(
    "This is not a protest form and does not replace or extend any formal protest deadline. It may be submitted at any time during the year to request factual review of parcel, land, dwelling, improvement, or other property record details.",
    MARGIN,
    CONTENT_WIDTH,
    { size: 10, color: palette.ink, lineHeight: 14 }
  );

  section("1. Submission Details");
  keyValueRows([
    ["Date/time submitted", formatSubmittedAt(submission.submittedAt)],
    ["Parcel ID", submission.parcel.parcelId],
    ["Property address", submission.parcel.situsAddress],
    ["Owner/taxpayer name", submission.parcel.owner],
    ["Sender name", submission.sender.name],
    ["Sender email", submission.sender.email],
    ["Sender phone", submission.sender.phone],
    ["Preferred contact method", contactMethodLabel(submission.sender.preferredContactMethod)]
  ]);

  section("2. Property / Parcel Summary");
  keyValueRows([
    ["Mailing address", submission.parcel.mailingAddress],
    ["Legal description", submission.parcel.legalDescription],
    ["County", submission.parcel.county ? `${submission.parcel.county} County` : null],
    ["Tax district", submission.parcel.taxDistrict],
    ["Property class", submission.parcel.propertyClass],
    ["Location", submission.parcel.location],
    ["Lot size", submission.parcel.lotSize]
  ]);

  section("3. Requested Record Review Items");
  selectedItemTable(submission.selectedItems);

  section("4. Correction Narrative");
  wrapped(submission.narrative || "No additional narrative provided.", MARGIN, CONTENT_WIDTH, { size: 10, lineHeight: 14 });

  section("5. Taxpayer Acknowledgment");
  wrapped(submission.acknowledgment, MARGIN, CONTENT_WIDTH, { size: 10, lineHeight: 14 });

  section("6. Assessor's Office Routing Information");
  keyValueRows([
    ["Office", submission.office.title || submission.office.assessorName],
    ["Assessor", submission.office.assessorName],
    ["Email", submission.office.email],
    ["Phone", submission.office.phone],
    ["Office hours", submission.office.hours],
    ["Address", submission.office.address],
    ["Website", submission.office.website]
  ]);

  return doc.save();
}

export function contactMethodLabel(value) {
  return {
    office: "In-office visit",
    email: "Email",
    phone: "Phone call"
  }[value] ?? "Not provided";
}

function formatSubmittedAt(iso) {
  if (!iso) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(new Date(iso));
}
