#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DEFAULT_SNAPSHOT = "data/sales/gage-mips-public-sales-snapshot.json";
const DEFAULT_SUBJECT = "data/property-records/mips/residential-010496000-record-card.json";
const DEFAULT_OUTPUT = "research/comparable-candidate-rankings/1301-s-5th-mips-sales-candidates.json";

function usage() {
  console.error([
    "Usage:",
    "  node scripts/rank-mips-sales-candidates.js [--snapshot data/sales/gage-mips-public-sales-snapshot.json]",
    "       [--subject data/property-records/mips/residential-010496000-record-card.json]",
    "       [--limit 50] [--out research/comparable-candidate-rankings/1301-s-5th-mips-sales-candidates.json]",
    "",
    "Ranks recent MIPS sales-map records as a sales-discovery seed. Full comp scoring still requires GWorks record-detail enrichment."
  ].join("\n"));
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    snapshot: DEFAULT_SNAPSHOT,
    subject: DEFAULT_SUBJECT,
    limit: 50,
    out: DEFAULT_OUTPUT
  };

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--snapshot") args.snapshot = argv[++index];
    else if (value === "--subject") args.subject = argv[++index];
    else if (value === "--limit") args.limit = Number(argv[++index]);
    else if (value === "--out") args.out = argv[++index];
    else usage();
  }

  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalize(value) {
  return `${value ?? ""}`.trim().toUpperCase();
}

function subjectModel(recordCard) {
  const parcel = recordCard.guidedSnapshot?.parcel || {};
  const residential = recordCard.guidedSnapshot?.residential || {};
  const classification = recordCard.guidedSnapshot?.classification || {};
  const current = recordCard.valuationHistory?.find(row => row.year === 2026) || {};
  return {
    parcelId: parcel.parcelId,
    gworksParcelId: parcel.parcelId,
    address: parcel.situsAddress,
    city: "BEATRICE",
    accountType: parcel.accountType,
    propertyClass: classification.propertyClass,
    lotSizeClass: classification.lotSize,
    style: residential.style,
    buildingSize: residential.buildingSize,
    yearBuilt: residential.yearBuilt,
    salePrice: 324000,
    assessed2026: current.total
  };
}

function addressParts(value) {
  const text = normalize(value);
  const number = Number(text.match(/\b0*(\d{1,5})\b/)?.[1]);
  const streetMatch = text.match(/\bS\s+(\d+)(?:ST|ND|RD|TH)?\b/) || text.match(/\bS\s+([A-Z]+)\b/);
  return {
    text,
    number: Number.isFinite(number) ? number : null,
    block: Number.isFinite(number) ? Math.floor(number / 100) : null,
    street: streetMatch ? `S ${streetMatch[1]}` : null,
    isBeatrice: /\bBEATRICE\b/.test(text)
  };
}

function saleAgeMonths(saleDate, reference = new Date("2026-06-03T00:00:00Z")) {
  if (!saleDate) return null;
  const parsed = new Date(`${saleDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return (reference - parsed) / (1000 * 60 * 60 * 24 * 30.4375);
}

function scoreMipsCandidate(subject, record) {
  const subjectAddress = addressParts(subject.address);
  const candidateAddress = addressParts(record.propertyAddress);
  const breakdown = {
    saleValidity: 0,
    classStyle: 0,
    recency: 0,
    neighborhood: 0,
    priceSignal: 0
  };
  const reasons = [];
  const cautions = [];
  const disqualifiers = [];

  if (record.visibility === "visible") breakdown.saleValidity += 5;
  else disqualifiers.push("Sale is not visible in the MIPS public layer.");
  if (record.usability === 1) {
    breakdown.saleValidity += 10;
    reasons.push("MIPS marks sale as usable.");
  } else {
    cautions.push("MIPS usability flag is not 1.");
  }
  if (record.adjustedSalePrice > 0) breakdown.saleValidity += 5;
  else disqualifiers.push("Adjusted sale price is missing.");
  if (record.saleDate) breakdown.saleValidity += 5;
  else disqualifiers.push("Sale date is missing.");

  if (record.classBCode === 1) breakdown.classStyle += 10;
  else disqualifiers.push("Parcel use is not single-family residential.");
  if (record.typeCode === 1) breakdown.classStyle += 10;
  else cautions.push("Residential type is not single-family residence.");
  if (record.styleTypeCode === 1) {
    breakdown.classStyle += 15;
    reasons.push("MIPS style type is one-story.");
  } else {
    cautions.push(`MIPS style type is ${record.styleTypeLabel || "not one-story"}.`);
  }

  const age = saleAgeMonths(record.saleDate);
  if (age !== null && age <= 12) {
    breakdown.recency += 20;
    reasons.push("Sale is within 12 months of the 2026 filing date.");
  } else if (age !== null && age <= 24) {
    breakdown.recency += 15;
    reasons.push("Sale is within 24 months of the 2026 filing date.");
  } else if (age !== null && age <= 36) {
    breakdown.recency += 10;
  }

  if (candidateAddress.isBeatrice) breakdown.neighborhood += 8;
  if (["S 3", "S 4", "S 5"].includes(candidateAddress.street)) {
    breakdown.neighborhood += 18;
    reasons.push("Located on S 3rd/S 4th/S 5th corridor near subject.");
  } else if (candidateAddress.isBeatrice) {
    breakdown.neighborhood += 4;
  }
  if (candidateAddress.street === subjectAddress.street) breakdown.neighborhood += 8;
  else if (["S 3", "S 4"].includes(candidateAddress.street) && subjectAddress.street === "S 5") breakdown.neighborhood += 6;
  if (subjectAddress.block !== null && candidateAddress.block !== null) {
    const blockDiff = Math.abs(candidateAddress.block - subjectAddress.block);
    if (blockDiff <= 1) {
      breakdown.neighborhood += 12;
      reasons.push("Same or adjacent block band.");
    } else if (blockDiff <= 4) {
      breakdown.neighborhood += 7;
    } else if (blockDiff <= 8) {
      breakdown.neighborhood += 3;
    }
  }

  const salePrice = record.adjustedSalePrice || 0;
  if (salePrice >= 225000 && salePrice <= 375000) breakdown.priceSignal += 12;
  else if (salePrice >= 150000 && salePrice <= 450000) breakdown.priceSignal += 6;
  else cautions.push("Adjusted sale price is outside the main review band.");
  if (salePrice <= subject.salePrice && salePrice >= 250000) {
    breakdown.priceSignal += 6;
    reasons.push("Sale price is below subject's 2020 sale while still in a plausible comp range.");
  }
  if (salePrice < 100000) cautions.push("Very low adjusted sale price may indicate a non-comparable transaction or condition issue.");

  const totalScore = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

  return {
    totalScore,
    breakdown,
    eligible: disqualifiers.length === 0,
    disqualifiers,
    cautions,
    reasons: reasons.slice(0, 4),
    addressParts: candidateAddress
  };
}

function localStatus(record) {
  const pdfPath = `research/gworks-pdfs/source-pdfs/${record.gworksParcelId}.pdf`;
  const recordCardPath = `data/property-records/mips/residential-${record.ntoParcelId}-record-card.json`;
  return {
    pdfPath,
    hasLocalPdf: fs.existsSync(path.resolve(ROOT, pdfPath)),
    recordCardPath,
    hasRecordCard: fs.existsSync(path.resolve(ROOT, recordCardPath))
  };
}

function main() {
  const args = parseArgs(process.argv);
  const snapshot = readJson(path.resolve(ROOT, args.snapshot));
  const subject = subjectModel(readJson(path.resolve(ROOT, args.subject)));
  const seen = new Set();
  const dedupedRecords = [];
  for (const record of snapshot.records) {
    const key = [record.gworksParcelId, record.saleDate, record.adjustedSalePrice, record.grantee].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    dedupedRecords.push(record);
  }

  const rows = dedupedRecords
    .filter(record => record.gworksParcelId !== subject.gworksParcelId)
    .map(record => {
      const score = scoreMipsCandidate(subject, record);
      const status = localStatus(record);
      return {
        parcelId: record.gworksParcelId,
        ntoParcelId: record.ntoParcelId,
        objectId: record.objectId,
        address: record.propertyAddress,
        saleDate: record.saleDate,
        adjustedSalePrice: record.adjustedSalePrice,
        grantor: record.grantor,
        grantee: record.grantee,
        deedType: record.deedType,
        usability: record.usability,
        classBLabel: record.classBLabel,
        typeLabel: record.typeLabel,
        styleTypeLabel: record.styleTypeLabel,
        totalScore: score.totalScore,
        scoreBreakdown: score.breakdown,
        eligible: score.eligible,
        disqualifiers: score.disqualifiers,
        cautions: score.cautions,
        reasons: score.reasons,
        ...status
      };
    })
    .sort((left, right) => {
      if (left.eligible !== right.eligible) return left.eligible ? -1 : 1;
      if (left.totalScore !== right.totalScore) return right.totalScore - left.totalScore;
      return new Date(right.saleDate || 0) - new Date(left.saleDate || 0);
    });

  const output = {
    generatedAt: new Date().toISOString(),
    note: "MIPS sales-seed screen only. Use GWorks PDFs/record cards for physical-detail scoring and exhibit support.",
    subject,
    source: snapshot.source,
    counts: {
      snapshotRecordCount: snapshot.recordCount,
      dedupedRecordCount: dedupedRecords.length,
      visibleRecordCount: snapshot.records.filter(record => record.visibility === "visible").length,
      eligibleSeedCount: rows.filter(row => row.eligible).length
    },
    topCandidates: rows.slice(0, args.limit),
    neighborhoodS3S4S5: rows
      .filter(row => /\bS\s+(3RD|4TH|5TH|3|4|5)\b/i.test(row.address || ""))
      .slice(0, 50),
    needsGworksEnrichment: rows
      .filter(row => row.eligible && !row.hasRecordCard)
      .slice(0, 50)
      .map(row => ({
        parcelId: row.parcelId,
        address: row.address,
        saleDate: row.saleDate,
        adjustedSalePrice: row.adjustedSalePrice,
        seedScore: row.totalScore,
        gworksUrl: `https://report.gworks.com/report.ashx?county=gage&id=${row.parcelId}&subs=true&type=assessor`
      }))
  };

  const outputPath = path.resolve(ROOT, args.out);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify({
    outputPath: path.relative(ROOT, outputPath),
    snapshotRecordCount: output.counts.snapshotRecordCount,
    eligibleSeedCount: output.counts.eligibleSeedCount,
    topCandidates: output.topCandidates.slice(0, 12).map(row => ({
      parcelId: row.parcelId,
      address: row.address,
      saleDate: row.saleDate,
      price: row.adjustedSalePrice,
      score: row.totalScore,
      hasRecordCard: row.hasRecordCard,
      cautions: row.cautions
    }))
  }, null, 2));
}

main();
