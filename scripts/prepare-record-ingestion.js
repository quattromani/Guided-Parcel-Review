#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

function usage() {
  console.error("Usage: node scripts/prepare-record-ingestion.js /path/to/parcel.pdf");
  process.exit(1);
}

function firstMatch(text, pattern, fallback = null) {
  const match = text.match(pattern);
  return match ? match[1].trim().replace(/\s+/g, " ") : fallback;
}

function money(value) {
  if (!value) return null;
  return Number(value.replace(/[$,]/g, ""));
}

function number(value) {
  if (value === null || value === undefined) return null;
  const parsed = Number(`${value}`.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePdf(pdfPath) {
  const text = execFileSync("pdftotext", ["-layout", pdfPath, "-"], { encoding: "utf8" });
  const parcelId = firstMatch(text, /Parcel ID:\s+([0-9]+)/);
  if (!parcelId) {
    throw new Error("Could not find Parcel ID in PDF text.");
  }

  const values = [...text.matchAll(/^\s*(20\d{2})\s+\$?([\d,]+)\s+\$?([\d,]+)\s+\$?([\d,]+)\s+\$?([\d,]+)/gm)]
    .map(match => ({
      year: Number(match[1]),
      total: money(match[2]),
      land: money(match[3]),
      outbuilding: money(match[4]),
      dwelling: money(match[5])
    }));

  const levyRows = [...text.matchAll(/^\s*([A-Z0-9 #&.'-]+?)\s+([0-9]\.[0-9]{8})\s*$/gm)]
    .map(match => ({
      description: match[1].trim().replace(/\s+/g, " "),
      rate: Number(match[2])
    }));

  const dwellingRows = [...text.matchAll(/^\s*([A-Z][A-Z0-9 &,.'~/-]+?)\s+([\d,]+)\s+\$?([\d,]+)\s*$/gm)]
    .filter(match => !/^(YEAR|TOTAL|COUNTY|SCHOOL|DISTRICT|LAND|DWELLING|OUTBUILDING|VALUE|DESCRIPTION)$/i.test(match[1].trim()))
    .map(match => ({
      description: match[1].trim().replace(/\s+/g, " "),
      units: number(match[2]),
      value: money(match[3])
    }));

  const exteriorLine = firstMatch(text, /Exterior:\s+(.+?)\s+Bathrooms:/);
  const exteriorContinuation = firstMatch(text, /Exterior:[^\n]+\n\s+(.+?)\n/);
  const exterior = [exteriorLine, exteriorContinuation]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim() || null;

  return {
    pdfPath,
    parcelId,
    ntoParcelId: parcelId.length === 9 ? `0${parcelId}` : parcelId,
    mapNumber: firstMatch(text, /Map Number\s+([0-9]+)/),
    stateGeoCode: firstMatch(text, /State Geo Code\s+([0-9-]+)/),
    cadastralId: firstMatch(text, /Cadastral #\s+([0-9-]+)/),
    owner: firstMatch(text, /Current Owner:\s+(.+?)\n/),
    mailingAddress: firstMatch(text, /Current Owner:[\s\S]*?\n\s+(.+?\n\s+BEATRICE,\s+NE\s+\d{5}(?:-\d{4})?)/m)?.replace(/\n\s*/g, ", "),
    situsAddress: firstMatch(text, /Situs Address:\s+(.+)/),
    taxDistrict: firstMatch(text, /Tax District:\s+([0-9]+)/),
    schoolDistrict: firstMatch(text, /School District:\s+(.+)/),
    accountType: firstMatch(text, /Account Type:\s+(.+)/),
    legalDescription: firstMatch(text, /Legal Description:\s+(.+)/),
    classification: {
      status: firstMatch(text, /Status:\s+(.+?)\s+Location:/),
      location: firstMatch(text, /Location:\s+(.+)/),
      propertyClass: firstMatch(text, /Property Class:\s+(.+?)\s+City Size:/),
      citySize: firstMatch(text, /City Size:\s+(.+)/),
      zoning: firstMatch(text, /Zoning:\s+(.+?)\s+Lot Size:/),
      lotSize: firstMatch(text, /Lot Size:\s+(.+)/)
    },
    residential: {
      zoning: firstMatch(text, /Residential Datasheet[\s\S]*?Zoning:\s+(.+?)\s+Condition:/),
      condition: firstMatch(text, /Condition:\s+(.+)/),
      yearBuilt: Number(firstMatch(text, /Year Built:\s+([0-9]+)/)) || null,
      style: firstMatch(text, /Style:\s+(.+)/),
      exterior,
      bathrooms: Number(firstMatch(text, /Bathrooms:\s+([0-9.]+)/)) || null,
      bedrooms: Number(firstMatch(text, /Bedrooms:\s+([0-9.]+)/)) || null,
      heatingCooling: firstMatch(text, /Heating\/Cooling:\s+(.+)/),
      plumbingFixtures: Number(firstMatch(text, /Plumbing Fixtures:\s+([0-9.]+)/)) || null,
      minFinish: Number(firstMatch(text, /Min Finish:\s+([\d,]+) sq\. ft/)?.replace(/,/g, "")) || 0,
      partFinish: Number(firstMatch(text, /Part Finish:\s+([\d,]+) sq\. ft/)?.replace(/,/g, "")) || 0,
      basementSize: Number(firstMatch(text, /Basement Size:\s+([\d,]+) sq\. ft/)?.replace(/,/g, "")) || null,
      buildingSize: Number(firstMatch(text, /Building Size:\s+([\d,]+) sq\. ft/)?.replace(/,/g, "")) || null,
      quality: firstMatch(text, /Quality:\s+(.+?)\s+Garage 1 Size:/),
      garage1: firstMatch(text, /Garage 1:\s+(.+)/),
      garage1Size: Number(firstMatch(text, /Garage 1 Size:\s+([\d,]+) sq\. ft/)?.replace(/,/g, "")) || null
    },
    assessedValues: values,
    levyRows,
    dwellingRows
  };
}

function normalizedPropertyClass(parsed) {
  const classKey = `${parsed.classification.propertyClass || parsed.accountType || "property"}`.toLowerCase();
  if (classKey.includes("ag")) return "agricultural";
  if (classKey.includes("comm")) return "commercial";
  return "residential";
}

function recordId(parsed) {
  return `${normalizedPropertyClass(parsed)}-${parsed.ntoParcelId}`;
}

function ntoCandidates(parcelId) {
  const candidates = new Set([parcelId]);
  if (/^\d+$/.test(parcelId)) {
    candidates.add(parcelId.padStart(10, "0"));
    candidates.add(parcelId.replace(/^0+/, ""));
  }
  return [...candidates].filter(Boolean);
}

const CLASS_TEMPLATES = {
  residential: {
    referenceFixture: "data/property-records/mips/residential-010496000-record-card.json",
    pdfSections: [
      "parcel identity, owner, situs, mailing, legal, district, and classification",
      "residential datasheet: year built, style, quality, condition, exterior, room/plumbing counts, basement, building size, heating/cooling, garage",
      "dwelling data, garage cost lines, and miscellaneous improvements",
      "current and prior assessed value components"
    ],
    ntoSections: [
      "2019-current REAL statement detail",
      "gross tax, school/non-ag/homestead credits, net tax, paid amount, and balance due",
      "assessed valuation components by year",
      "latest tax distribution levy components"
    ],
    recordCardFocus: [
      "guidedSnapshot.residential",
      "residentialInformation",
      "garageCostLines",
      "miscImprovements",
      "guidedSnapshot.dwellingData"
    ]
  },
  agricultural: {
    referenceFixture: "data/property-records/mips/agricultural-001902000-record-card.json",
    pdfSections: [
      "parcel identity, owner, situs, mailing, legal, district, and classification",
      "agricultural land rows, acres, land class/productivity information, and location model",
      "residential dwelling facts only when the agricultural parcel includes a residence",
      "outbuildings, improvements, and current/prior assessed value components"
    ],
    ntoSections: [
      "2019-current REAL statement detail",
      "gross tax, school/non-ag/ag-land/homestead credits, net tax, paid amount, and balance due",
      "land, dwelling, outbuilding, and total assessed components by year",
      "latest tax distribution levy components"
    ],
    recordCardFocus: [
      "guidedSnapshot.landInformation",
      "landModel",
      "guidedSnapshot.residential when present",
      "guidedSnapshot.outbuildingData",
      "ag-land credit fields in guidedSnapshot.taxStatements"
    ]
  },
  commercial: {
    referenceFixture: "data/property-records/mips/commercial-010635030-record-card.json",
    pdfSections: [
      "parcel identity, owner, situs, mailing, legal, district, and classification",
      "commercial datasheets: occupancy, building size, year built, perimeter, construction/quality/condition when available",
      "TIF or multiple-statement context when present",
      "current and prior assessed value components"
    ],
    ntoSections: [
      "2019-current REAL, TIF, or combined statement detail",
      "gross tax, credits, net tax, paid amount, and balance due by component",
      "assessed valuation components by year",
      "latest tax distribution levy components for each applicable district"
    ],
    recordCardFocus: [
      "guidedSnapshot.commercial",
      "statementComponents inside guidedSnapshot.taxStatements when NTO splits REAL/TIF",
      "commercial-friendly fallback values in guidedSnapshot.residential",
      "source notes explaining unavailable cost-model fields"
    ]
  }
};

function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) usage();

  const absolutePdfPath = path.resolve(pdfPath);
  if (!fs.existsSync(absolutePdfPath)) {
    throw new Error(`PDF not found: ${absolutePdfPath}`);
  }

  const parsed = parsePdf(absolutePdfPath);
  const id = recordId(parsed);
  const outputPath = `data/property-records/mips/${id}-record-card.json`;
  const propertyClass = normalizedPropertyClass(parsed);

  console.log(JSON.stringify({
    parsedPdf: parsed,
    classTemplate: {
      propertyClass,
      ...CLASS_TEMPLATES[propertyClass]
    },
    suggested: {
      manifestId: id,
      recordCardPath: outputPath,
      directAppUrl: `http://localhost:4173/?property=${parsed.ntoParcelId}#property-record`
    },
    ntoCandidates: ntoCandidates(parsed.parcelId).map(parcel => ({
      parcel,
      url: `https://nebraskataxesonline.us/County/3/Property/${parcel}/Type/1/TaxYear/2025`
    })),
    nextSteps: [
      "Open the strongest NTO candidate. For this county, 9-digit GWorks parcel ids often need a leading zero.",
      `Run node scripts/capture-nto-statements.js ${parsed.ntoParcelId} to capture 2019-current statement detail text.`,
      "Generate the record-card JSON by following the printed class template and reference fixture.",
      "Add the manifest entry and run node scripts/validate-data-contracts.js."
    ]
  }, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = {
  CLASS_TEMPLATES,
  normalizedPropertyClass,
  ntoCandidates,
  parsePdf,
  recordId
};
