const FORM_422_SOURCE = "assets/forms/422_Property_Valuation_Protest.pdf";

export const form422FieldMap = {
  county: "County",
  filerName: "Name",
  street: "Street",
  city: "City",
  state: "State",
  zip: "Zip",
  parcelId: "Property ID",
  phone: "Phone",
  email: "email address",
  realPropertyDescription: "Real Prop Description",
  year: "Year",
  yearRepeat: "Year2",
  protestedLand: "Protested Land",
  protestedBuildings: "Protested Buildings",
  protestedTotal: "Protested Both",
  protestedPersonalProperty: "Protested Pers Prop"
};

function titleCase(value) {
  return `${value ?? ""}`.toLowerCase().replace(/\b\w/g, character => character.toUpperCase());
}

function parseMailingAddress(address) {
  const fallback = {
    street: address || "",
    city: "",
    state: "",
    zip: ""
  };
  const match = `${address ?? ""}`.match(/^(.*),\s*([^,]+),\s*([A-Z]{2})\s+(.+)$/);
  if (!match) return fallback;

  return {
    street: match[1],
    city: match[2],
    state: match[3],
    zip: match[4]
  };
}

function plainNumber(value) {
  return value === null || value === undefined ? "" : Math.round(value).toString();
}

function displayMoney(value) {
  return value === null || value === undefined
    ? "Not available"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function displayDate(value) {
  if (!value) return "Not listed";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function displaySquareFeet(value) {
  return value === null || value === undefined || value === ""
    ? "Not listed"
    : `${Number(value).toLocaleString()} sq. ft.`;
}

function displayWorksheetMoney(value) {
  return value === null || value === undefined ? "Not listed" : displayMoney(value);
}

function countyForForm(data, recordCard) {
  const county = recordCard?.source?.county || data.parcel.countyName;
  return titleCase(`${county}`.replace(/\s+County$/i, ""));
}

function currentValue(recordCard) {
  return recordCard?.currentCardValue?.current
    ?? recordCard?.currentCardValue?.initialMipsCurrent
    ?? null;
}

export function buildForm422PrefillModel(data, recordCard, userContact = {}) {
  const mailing = parseMailingAddress(data.parcel.mailingAddress);
  const value = currentValue(recordCard);
  const county = countyForForm(data, recordCard);
  const realPropertyDescription = [
    data.parcel.situsAddress,
    data.parcel.legalDescription
  ].filter(Boolean).join(" - ");

  const prefill = {
    county,
    filerName: data.parcel.owner,
    street: mailing.street,
    city: mailing.city,
    state: mailing.state,
    zip: mailing.zip,
    parcelId: data.parcel.parcelId,
    phone: userContact.phone || "",
    email: userContact.email || "",
    realPropertyDescription,
    year: data.snapshotYear,
    yearRepeat: `${data.snapshotYear}`.slice(-2),
    protestedLand: plainNumber(value?.landLots),
    protestedBuildings: plainNumber(value?.buildings),
    protestedTotal: plainNumber(value?.total),
    protestedPersonalProperty: ""
  };

  return {
    source: FORM_422_SOURCE,
    fileName: `Form-422-${data.parcel.parcelId}-${data.snapshotYear}.pdf`,
    prefill,
    confirmationFields: [
      ["Owner / filer name", prefill.filerName],
      ["Mailing address", [prefill.street, [prefill.city, prefill.state, prefill.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ")],
      ["Parcel ID", prefill.parcelId],
      ["Situs / location address", data.parcel.situsAddress],
      ["Legal description", data.parcel.legalDescription],
      ["County", `${prefill.county} County`],
      ["Assessment year", prefill.year],
      ["Current land value", displayMoney(value?.landLots)],
      ["Current building value", displayMoney(value?.buildings)],
      ["Current total value", displayMoney(value?.total)]
    ],
    omittedFields: [
      "Requested valuation",
      "Reasons for requested valuation change",
      "Signature",
      "Date signed",
      "County assessor recommendation",
      "Referee recommendation",
      "County Board of Equalization decision",
      "County certification fields"
    ]
  };
}

function latestSale(recordCard) {
  return (recordCard?.ownershipHistory || [])
    .slice()
    .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))[0];
}

function compactText(values, fallback = "Not listed") {
  const text = values.filter(Boolean).join("; ");
  return text || fallback;
}

function compactLines(values, fallback = "Not listed") {
  const text = values.filter(Boolean).join("\n");
  return text || fallback;
}

function cleanGarageDescription(value) {
  return `${value || ""}`.replace(/\s*\(SF\)\s*$/i, "").trim();
}

function displayUnitText(value, fallbackUnit = "units") {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") return `${Number(value).toLocaleString()} ${fallbackUnit}`;

  return `${value}`.trim()
    .replace(/\bsqft\b/gi, "sq. ft.")
    .replace(/\bsq\.?\s*ft\.?/gi, "sq. ft.");
}

function descriptionWithUnits(description, units) {
  return [description, units].filter(Boolean).join(" - ");
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function numberFromText(value) {
  if (typeof value === "number") return value;
  const parsed = Number(`${value || ""}`.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function lotSizeForWorksheet(data, recordCard) {
  const recordLotSize = recordCard?.landModel?.lotSize;
  if (recordLotSize !== null && recordLotSize !== undefined) {
    return `${Number(recordLotSize).toLocaleString()} sq. ft.`;
  }

  return data.classification?.lotSize || "Not listed";
}

function basementForWorksheet(data, recordCard) {
  if (data.residential?.basementSize) {
    return descriptionWithUnits("Basement area", displaySquareFeet(data.residential.basementSize));
  }

  return recordCard?.residentialInformation?.basementArea || "Not listed";
}

function garageForWorksheet(data, recordCard) {
  const garageRows = recordCard?.garageCostLines || [];
  if (garageRows.length) {
    const typeSummary = uniqueValues(garageRows.map(row => cleanGarageDescription(row.description))).join(", ");
    const totalSqFt = garageRows.reduce((sum, row) => sum + numberFromText(row.units), 0);
    const valueSubtotal = garageRows.reduce((sum, row) => sum + numberFromText(row.rcnld), 0);

    return compactLines([
      typeSummary,
      totalSqFt ? `${Number(totalSqFt).toLocaleString()} sq. ft. total` : "",
      valueSubtotal ? `${displayMoney(valueSubtotal)} garage value subtotal` : ""
    ]);
  }

  const fallbackGarages = [data.residential?.garage1, data.residential?.garage2].map(value => {
    if (!value) return "";
    const [description, ...unitParts] = `${value}`.split(",");
    return descriptionWithUnits(description?.trim(), unitParts.join(",").trim());
  }).filter(Boolean);

  const totalSqFt = fallbackGarages.reduce((sum, value) => sum + numberFromText(value), 0);
  return compactLines([
    uniqueValues(fallbackGarages.map(value => value.split(" - ")[0])).join(", "),
    totalSqFt ? `${Number(totalSqFt).toLocaleString()} sq. ft. total` : ""
  ]);
}

function majorImprovementsForWorksheet(data, recordCard) {
  const records = recordCard?.miscImprovements?.length
    ? recordCard.miscImprovements
    : [...(data.dwellingData || []), ...(data.outbuildingData || [])];

  if (!records.length) {
    return "No outbuilding records listed";
  }

  const valueSubtotal = records.reduce((sum, row) => sum + numberFromText(row.value), 0);
  const itemLabel = records.length === 1 ? "improvement record" : "improvement records";

  return compactLines([
    `${records.length} ${itemLabel}`,
    valueSubtotal ? `${displayMoney(valueSubtotal)} improvement value subtotal` : ""
  ]);
}

function propertyAgeText(data) {
  const yearBuilt = data.residential?.yearBuilt || data.commercial?.yearBuilt;
  if (!yearBuilt) return "Not listed";

  const age = data.snapshotYear ? data.snapshotYear - yearBuilt : null;
  return age !== null && age >= 0 ? `${yearBuilt} / about ${age} years` : `${yearBuilt}`;
}

function saleSummaryForWorksheet(sale) {
  const amount = sale?.amount !== null && sale?.amount !== undefined ? displayMoney(sale.amount) : "";
  const date = sale?.saleDate ? displayDate(sale.saleDate) : "";

  return [amount, date].filter(Boolean).join(" - ") || "Not listed";
}

export function buildComparableWorksheetModel(data, recordCard) {
  const sale = latestSale(recordCard);
  const value = currentValue(recordCard);
  const propertyType = data.residential?.style || recordCard?.residentialInformation?.type || data.classification?.propertyClass;
  const basement = basementForWorksheet(data, recordCard);
  const garage = garageForWorksheet(data, recordCard);

  return {
    fileName: `Comparable-Worksheet-${data.parcel.parcelId}-${data.snapshotYear}.pdf`,
    packetFileName: `Protest-Preparation-Packet-${data.parcel.parcelId}-${data.snapshotYear}.pdf`,
    parcelId: data.parcel.parcelId,
    snapshotYear: data.snapshotYear,
    columns: ["Subject property", "Comparable 1", "Comparable 2", "Comparable 3"],
    rows: [
      ["Parcel / situs", compactLines([data.parcel.parcelId, data.parcel.situsAddress])],
      ["Location / market area", compactLines([recordCard?.locationModel?.valuationGroup, data.classification?.location])],
      ["Most recent sale", saleSummaryForWorksheet(sale)],
      ["Living area / square footage", displaySquareFeet(data.residential?.buildingSize || data.commercial?.buildingSize)],
      ["Style or property type", propertyType || "Not listed"],
      ["Year built / age", propertyAgeText(data)],
      ["Basement", basement],
      ["Garage", garage],
      ["Outbuildings or major improvements", majorImprovementsForWorksheet(data, recordCard)],
      ["Quality / condition", compactLines([data.residential?.quality || data.commercial?.quality, data.residential?.condition || data.commercial?.condition])],
      ["Lot size", lotSizeForWorksheet(data, recordCard)],
      ["Property class", data.classification?.propertyClass || "Not listed"],
      ["Current assessed value", displayWorksheetMoney(value?.total)]
    ].map(([label, subject]) => ({ label, subject }))
  };
}

function setFieldIfPresent(form, fieldName, value) {
  if (!value) return;

  try {
    form.getTextField(fieldName).setText(`${value}`);
  } catch (error) {
    console.warn(`Form 422 field not found or not fillable: ${fieldName}`, error);
  }
}

export async function generateForm422Pdf(model, options = {}) {
  const pdfLib = window.PDFLib;
  if (!pdfLib?.PDFDocument) {
    throw new Error("PDF generation library is not available.");
  }

  const response = await fetch(model.source);
  if (!response.ok) {
    throw new Error(`Unable to load Form 422 PDF: ${response.status}`);
  }

  const sourceBytes = await response.arrayBuffer();
  const pdfDoc = await pdfLib.PDFDocument.load(sourceBytes);
  const form = pdfDoc.getForm();

  Object.entries(form422FieldMap).forEach(([modelKey, fieldName]) => {
    setFieldIfPresent(form, fieldName, model.prefill[modelKey]);
  });

  if (options.flatten) {
    form.flatten();
  }

  return pdfDoc.save();
}

function wrapText(text, font, size, maxWidth) {
  const lines = [];

  `${text ?? ""}`.split(/\r?\n/).forEach(paragraph => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";

    words.forEach(word => {
      const nextLine = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(nextLine, size) <= maxWidth) {
        line = nextLine;
        return;
      }

      if (line) lines.push(line);
      line = word;
    });

    if (line) lines.push(line);
  });

  return lines.length ? lines : [""];
}

function limitedLines(text, font, size, maxWidth, maxLines) {
  const lines = wrapText(text, font, size, maxWidth);
  if (lines.length <= maxLines) return lines;

  const limited = lines.slice(0, maxLines);
  let last = limited[limited.length - 1];
  while (last.length > 3 && font.widthOfTextAtSize(`${last}...`, size) > maxWidth) {
    last = last.slice(0, -1);
  }
  limited[limited.length - 1] = `${last}...`;
  return limited;
}

function drawWrappedText(page, text, options) {
  const {
    x,
    y,
    maxWidth,
    font,
    size,
    lineHeight,
    color,
    maxLines = 3
  } = options;
  const lines = limitedLines(text, font, size, maxWidth, maxLines);

  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: y - (index * lineHeight),
      size,
      font,
      color
    });
  });

  return y - (lines.length * lineHeight);
}

async function drawComparableWorksheetPage(pdfDoc, model, options = {}) {
  const { rgb, StandardFonts } = window.PDFLib;
  const page = pdfDoc.addPage([612, 792]);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.12, 0.2, 0.28);
  const muted = rgb(0.42, 0.48, 0.55);
  const border = rgb(0.78, 0.82, 0.87);
  const soft = rgb(0.96, 0.97, 0.98);
  const header = rgb(0.91, 0.94, 0.97);
  const margin = 36;
  const tableWidth = 540;
  const colWidths = [104, 148, 96, 96, 96];
  const rowFontSize = 6.9;
  const lineHeight = 8.1;
  let y = 756;

  page.drawText("Comparable Value Worksheet", {
    x: margin,
    y,
    size: 16,
    font: bold,
    color: ink
  });
  y -= 18;

  page.drawText(`Parcel ${model.parcelId} - ${model.snapshotYear} assessment review`, {
    x: margin,
    y,
    size: 8.5,
    font: regular,
    color: muted
  });
  y -= 18;

  y = drawWrappedText(page, "Subject property data is pre-filled from available records. This worksheet assumes those details are substantially accurate and is intended to organize basic comparable-property information before any filing decision.", {
    x: margin,
    y,
    maxWidth: tableWidth,
    font: regular,
    size: 8,
    lineHeight: 10,
    color: muted,
    maxLines: 3
  }) - 8;

  const headerHeight = 26;
  let x = margin;
  colWidths.forEach((width, index) => {
    page.drawRectangle({
      x,
      y: y - headerHeight,
      width,
      height: headerHeight,
      color: header,
      borderColor: border,
      borderWidth: 0.6
    });
    drawWrappedText(page, index === 0 ? "Review field" : model.columns[index - 1], {
      x: x + 5,
      y: y - 10,
      maxWidth: width - 10,
      font: bold,
      size: 7.4,
      lineHeight: 8,
      color: ink,
      maxLines: 2
    });
    x += width;
  });
  y -= headerHeight;

  model.rows.forEach((row, rowIndex) => {
    const subjectMaxLines = row.label === "Outbuildings or major improvements"
      ? 5
      : `${row.subject || ""}`.includes("\n") ? 4 : 3;
    const labelLines = limitedLines(row.label, bold, rowFontSize, colWidths[0] - 10, 2).length;
    const subjectLines = limitedLines(row.subject, regular, rowFontSize, colWidths[1] - 10, subjectMaxLines).length;
    const comparableLineCounts = (row.comparables || []).map(value => {
      if (!`${value || ""}`.trim()) return 1;
      return limitedLines(value, regular, rowFontSize, colWidths[2] - 10, row.label === "Notes" ? 4 : 3).length;
    });
    const contentLineCount = Math.max(labelLines, subjectLines, ...comparableLineCounts);
    const rowHeight = Math.max(row.label === "Notes" ? 42 : 24, Math.min(row.label === "Notes" ? 50 : 56, (contentLineCount * lineHeight) + 12));
    x = margin;

    colWidths.forEach((width, columnIndex) => {
      page.drawRectangle({
        x,
        y: y - rowHeight,
        width,
        height: rowHeight,
        color: rowIndex % 2 === 0 ? rgb(1, 1, 1) : soft,
        borderColor: border,
        borderWidth: 0.45
      });

      if (columnIndex === 0) {
        drawWrappedText(page, row.label, {
          x: x + 5,
          y: y - 10,
          maxWidth: width - 10,
          font: bold,
          size: rowFontSize,
          lineHeight,
          color: ink,
          maxLines: 2
        });
      } else if (columnIndex === 1) {
        drawWrappedText(page, row.subject, {
          x: x + 5,
          y: y - 10,
          maxWidth: width - 10,
          font: regular,
          size: rowFontSize,
          lineHeight,
          color: ink,
          maxLines: subjectMaxLines
        });
      } else {
        const comparableValue = `${row.comparables?.[columnIndex - 2] || ""}`.trim();

        if (comparableValue) {
          drawWrappedText(page, comparableValue, {
            x: x + 5,
            y: y - 10,
            maxWidth: width - 10,
            font: regular,
            size: rowFontSize,
            lineHeight,
            color: ink,
            maxLines: row.label === "Notes" ? 4 : 3
          });
        } else {
          const lineCount = row.label === "Notes" ? 3 : 1;
          for (let i = 0; i < lineCount; i += 1) {
            const lineY = y - rowHeight + 9 + (i * 9);
            page.drawLine({
              start: { x: x + 6, y: lineY },
              end: { x: x + width - 6, y: lineY },
              thickness: 0.45,
              color: border
            });
          }
        }
      }
      x += width;
    });

    y -= rowHeight;
  });

  page.drawText(options.packet ? "Page 1: Comparable Worksheet. Page 2: Prepared Form 422." : "Comparable Worksheet", {
    x: margin,
    y: 24,
    size: 7.5,
    font: regular,
    color: muted
  });
}

export async function generateComparableWorksheetPdf(model) {
  const pdfLib = window.PDFLib;
  if (!pdfLib?.PDFDocument) {
    throw new Error("PDF generation library is not available.");
  }

  const pdfDoc = await pdfLib.PDFDocument.create();
  await drawComparableWorksheetPage(pdfDoc, model);
  return pdfDoc.save();
}

export async function generateProtestPacketPdf(formModel, worksheetModel) {
  const pdfLib = window.PDFLib;
  if (!pdfLib?.PDFDocument) {
    throw new Error("PDF generation library is not available.");
  }

  const packetDoc = await pdfLib.PDFDocument.create();
  await drawComparableWorksheetPage(packetDoc, worksheetModel, { packet: true });

  const formBytes = await generateForm422Pdf(formModel, { flatten: true });
  const formDoc = await pdfLib.PDFDocument.load(formBytes);
  const formPages = await packetDoc.copyPages(formDoc, formDoc.getPageIndices());
  formPages.forEach(page => packetDoc.addPage(page));

  return packetDoc.save();
}

export function printPdf(bytes, fileName, documentLabel = "document") {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const frame = document.createElement("iframe");
    let settled = false;

    function cleanup() {
      window.setTimeout(() => {
        frame.remove();
        URL.revokeObjectURL(url);
      }, 60000);
    }

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      frame.remove();
      URL.revokeObjectURL(url);
      reject(new Error(`The printable ${documentLabel} could not be opened.`));
    }, 10000);

    frame.title = fileName;
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.style.opacity = "0";

    frame.addEventListener("load", () => {
      try {
        const printWindow = frame.contentWindow;
        if (!printWindow) throw new Error(`The printable ${documentLabel} could not be opened.`);

        printWindow.focus();
        printWindow.print();
        settled = true;
        window.clearTimeout(timer);
        cleanup();
        resolve();
      } catch (error) {
        settled = true;
        window.clearTimeout(timer);
        frame.remove();
        URL.revokeObjectURL(url);
        reject(error);
      }
    });

    frame.src = url;
    document.body.append(frame);
  });
}
