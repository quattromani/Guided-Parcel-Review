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

function blockMatch(text, pattern, fallback = "") {
  const match = text.match(pattern);
  return match ? match[1] : fallback;
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

function ownerMailingAddress(text) {
  const block = blockMatch(text, /Current Owner:[^\n]*\n([\s\S]*?)\nSitus Address:/, "");
  const lines = block
    .split(/\n/)
    .map(line => line.trim())
    .filter(Boolean);

  return lines.length ? lines.join(", ") : null;
}

function parseCommercialDatasheet(text) {
  const block = blockMatch(text, /Comm?er(?:cial|ical) Datasheet - Building([\s\S]*?)(?:Dwelling Data|Outbuilding Data|Photo\/Sketch)/i, "");
  const rows = [];
  const pending = [];
  let current = null;

  const finalize = () => {
    if (!current) return;
    rows.push({
      occupancy: current.occupancyParts.join(" / ").replace(/\s+/g, " ").trim() || null,
      size: current.size,
      yearBuilt: current.yearBuilt,
      perimeter: current.perimeter
    });
    current = null;
  };

  block.split(/\n/)
    .map(line => line.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .filter(line => !/^(Occupancy|Built|Size|Year|Perimeter)(?:\s+(Occupancy|Built|Size|Year|Perimeter))*$/i.test(line))
    .forEach(line => {
      const numeric = line.match(/^(.*?)([\d,]+)\s+(\d{4})\s+([\d,]+)$/);
      if (numeric) {
        finalize();
        const occupancy = [...pending, numeric[1].trim()].filter(Boolean);
        pending.length = 0;
        current = {
          occupancyParts: occupancy,
          size: number(numeric[2]),
          yearBuilt: Number(numeric[3]) || null,
          perimeter: number(numeric[4])
        };
        return;
      }

      if (current) {
        current.occupancyParts.push(line);
      } else {
        pending.push(line);
      }
    });

  finalize();
  return rows;
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

  const levyRows = text.split(/\n/)
    .map(line => line.match(/([A-Z][A-Z0-9 #&.'/-]*?)\s+([0-9]\.[0-9]{8})\s*$/))
    .filter(Boolean)
    .map(match => ({
      description: match[1].trim().replace(/\s+/g, " "),
      rate: Number(match[2])
    }));

  const dwellingBlock = blockMatch(text, /Dwelling Data([\s\S]*?)Outbuilding Data/, "");
  const dwellingRows = [...dwellingBlock.matchAll(/^\s*([A-Z][A-Za-z0-9 &,.'~/-]+?)\s+([\d,]+)\s+\$?([\d,]+)\s*$/gm)]
    .filter(match => !/^(YEAR|TOTAL|COUNTY|SCHOOL|DISTRICT|LAND|DWELLING|OUTBUILDING|VALUE|DESCRIPTION)$/i.test(match[1].trim()))
    .map(match => ({
      description: match[1].trim().replace(/\s+/g, " "),
      units: number(match[2]),
      value: money(match[3])
    }));

  const outbuildingBlock = blockMatch(text, /Outbuilding Data([\s\S]*?)(?:\n\s*\d+\s*\n|Photo\/Sketch)/, "");
  const outbuildingRows = [...outbuildingBlock.matchAll(/^\s*([A-Z][A-Za-z0-9 &,.'~/-]+?)\s+([\d,]+)(?:\s+(\d{4}))?\s+\$?([\d,]+)\s*$/gm)]
    .filter(match => !/DESCRIPTION|YEAR BUILT|COST/i.test(match[1]))
    .map(match => ({
      description: match[1].trim().replace(/\s+/g, " "),
      units: number(match[2]),
      yearBuilt: match[3] ? Number(match[3]) : null,
      cost: money(match[4])
    }));

  const exteriorLine = firstMatch(text, /Exterior:\s+(.+?)\s+Bathrooms:/);
  const exteriorLineFlexible = firstMatch(text, /Exterior:\s+(.+?)\s+(?:Style|Heating\/Cooling|Bathrooms):/);
  const exteriorContinuation = firstMatch(text, /Exterior:[^\n]+\n\s+(.+?)(?:\n|Bedrooms:)/);
  const exterior = [exteriorLine || exteriorLineFlexible, exteriorContinuation]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim() || null;

  const commercialDatasheet = parseCommercialDatasheet(text);

  return {
    pdfPath,
    parcelId,
    ntoParcelId: parcelId.length === 9 ? `0${parcelId}` : parcelId,
    mapNumber: firstMatch(text, /Map Number\s+([0-9]+)/),
    stateGeoCode: firstMatch(text, /State Geo Code\s+([0-9-]+)/),
    cadastralId: firstMatch(text, /Cadastral #\s+([0-9-]+)/),
    owner: firstMatch(text, /Current Owner:\s+(.+?)\n/),
    mailingAddress: ownerMailingAddress(text),
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
      zoning: firstMatch(text, /Residential Datasheet[\s\S]*?Zoning:\s+(.+?)\s+(?:Quality|Style|Condition|Lot Size):/),
      condition: firstMatch(text, /Condition:\s+(.+?)(?:\s+Garage 2 Size:|\n)/),
      yearBuilt: Number(firstMatch(text, /Year Built:\s+([0-9]+)/)) || null,
      style: firstMatch(text, /Style:\s+(.+?)(?:\s+Bathrooms:|\n)/),
      exterior,
      bathrooms: number(firstMatch(text, /Bathrooms:\s+([0-9.]+)/)),
      bedrooms: number(firstMatch(text, /Bedrooms:\s+([0-9.]+)/)),
      heatingCooling: firstMatch(text, /Heating\/Cooling:\s+(.+?)(?:\s+Min Finish:|\n)/),
      plumbingFixtures: number(firstMatch(text, /Plumbing Fixtures:\s+([0-9.]+)/)),
      minFinish: Number(firstMatch(text, /Min Finish:\s+([\d,]+) sq\. ft/)?.replace(/,/g, "")) || 0,
      partFinish: Number(firstMatch(text, /Part Finish:\s+([\d,]+) sq\. ft/)?.replace(/,/g, "")) || 0,
      basementSize: Number(firstMatch(text, /Basement Size:\s+([\d,]+) sq\. ft/)?.replace(/,/g, "")) || null,
      buildingSize: Number(firstMatch(text, /Building Size:\s+([\d,]+) sq\. ft/)?.replace(/,/g, "")) || null,
      quality: firstMatch(text, /Quality:\s+(.+?)(?:\s+Garage 1 Size:|\n)/),
      garage1: firstMatch(text, /Garage 1:\s+(.+)/),
      garage1Size: Number(firstMatch(text, /Garage 1 Size:\s+([\d,]+) sq\. ft/)?.replace(/,/g, "")) || null
    },
    assessedValues: values,
    levyRows,
    dwellingRows,
    outbuildingRows,
    commercialDatasheet
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
