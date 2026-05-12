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
    yearRepeat: data.snapshotYear,
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

function setFieldIfPresent(form, fieldName, value) {
  if (!value) return;

  try {
    form.getTextField(fieldName).setText(`${value}`);
  } catch (error) {
    console.warn(`Form 422 field not found or not fillable: ${fieldName}`, error);
  }
}

export async function generateForm422Pdf(model) {
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

  return pdfDoc.save();
}

export function downloadPdf(bytes, fileName) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
