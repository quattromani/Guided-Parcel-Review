const FORM_458_SOURCE = "assets/forms/Form_458_2026.pdf";
const FORM_458_YEAR = 2026;

export const form458FieldMap = {
  county: "1 County",
  applicantName: "2 Applicants Name Last First MI",
  residenceAddress: "9 Residence Street Address Town and Zip Code No PO Boxes",
  mailingAddress: "10 Mailing Address If Different Than Address Above",
  phone: "Phone Number required",
  email: "Email Address"
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

function countyForForm(data, recordCard) {
  const county = recordCard?.source?.county || data.parcel.countyName;
  return titleCase(`${county}`.replace(/\s+County$/i, ""));
}

function residenceAddressForForm(data) {
  const mailing = parseMailingAddress(data.parcel.mailingAddress);
  const situs = data.parcel.situsAddress;
  const mailingStreet = `${mailing.street ?? ""}`.toLowerCase();
  const residenceStreet = mailingStreet && mailingStreet.includes(`${situs ?? ""}`.toLowerCase())
    ? mailing.street
    : situs;
  const cityLine = [mailing.city, mailing.state, mailing.zip].filter(Boolean).join(" ");

  return [residenceStreet, cityLine].filter(Boolean).join(", ");
}

function shouldRepeatMailingAddress(data) {
  const mailingStreet = parseMailingAddress(data.parcel.mailingAddress).street.toLowerCase();
  const situs = `${data.parcel.situsAddress ?? ""}`.toLowerCase();

  return !mailingStreet || !situs || !mailingStreet.includes(situs);
}

export function buildForm458PrefillModel(data, recordCard, userContact = {}) {
  const prefill = {
    county: countyForForm(data, recordCard),
    applicantName: data.parcel.owner,
    residenceAddress: residenceAddressForForm(data),
    mailingAddress: shouldRepeatMailingAddress(data) ? data.parcel.mailingAddress : "",
    phone: userContact.phone || "",
    email: userContact.email || ""
  };

  return {
    source: FORM_458_SOURCE,
    fileName: `Form-458-${data.parcel.parcelId}-${FORM_458_YEAR}.pdf`,
    prefill,
    confirmationFields: [
      ["Applicant name", prefill.applicantName],
      ["Residence address", prefill.residenceAddress],
      ["Mailing address", prefill.mailingAddress || "Same as residence address"],
      ["County", `${prefill.county} County`],
      ["Parcel ID", data.parcel.parcelId],
      ["Application year", FORM_458_YEAR]
    ],
    omittedFields: [
      "Social Security number",
      "Date of birth",
      "Citizenship or qualified alien status",
      "Homestead filing status",
      "Eligibility category",
      "Owner-occupant and trust questions",
      "Signature and date"
    ]
  };
}

function setFieldIfPresent(form, fieldName, value) {
  if (!value) return;

  try {
    form.getTextField(fieldName).setText(`${value}`);
  } catch (error) {
    console.warn(`Form 458 field not found or not fillable: ${fieldName}`, error);
  }
}

export async function generateForm458Pdf(model) {
  const pdfLib = window.PDFLib;
  if (!pdfLib?.PDFDocument) {
    throw new Error("PDF generation library is not available.");
  }

  const response = await fetch(model.source);
  if (!response.ok) {
    throw new Error(`Unable to load Form 458 PDF: ${response.status}`);
  }

  const sourceBytes = await response.arrayBuffer();
  const pdfDoc = await pdfLib.PDFDocument.load(sourceBytes);
  const form = pdfDoc.getForm();

  Object.entries(form458FieldMap).forEach(([modelKey, fieldName]) => {
    setFieldIfPresent(form, fieldName, model.prefill[modelKey]);
  });

  return pdfDoc.save();
}
