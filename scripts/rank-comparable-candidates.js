#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { parsePdf } = require("./prepare-record-ingestion");

const ROOT = process.cwd();
const TRACKER_PATH = path.join(ROOT, "data/sampling/gage-research-sampling-tracker.json");
const DEFAULT_SUBJECT = "data/property-records/mips/residential-010496000-record-card.json";
const DEFAULT_GROUP = "Residential-3";
const DEFAULT_OUTPUT = "research/comparable-candidate-rankings/1301-s-5th-vg3-candidates.json";

function usage() {
  console.error([
    "Usage:",
    "  node scripts/rank-comparable-candidates.js [--subject data/property-records/mips/residential-010496000-record-card.json]",
    "       [--group Residential-3] [--limit 50] [--out research/comparable-candidate-rankings/1301-s-5th-vg3-candidates.json]",
    "",
    "This scores already-downloaded GWorks PDFs from the research tracker. It does not estimate value."
  ].join("\n"));
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    subject: DEFAULT_SUBJECT,
    group: DEFAULT_GROUP,
    limit: 50,
    out: DEFAULT_OUTPUT,
    includeIneligible: false
  };

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--subject") args.subject = argv[++index];
    else if (value === "--group") args.group = argv[++index];
    else if (value === "--limit") args.limit = Number(argv[++index]);
    else if (value === "--out") args.out = argv[++index];
    else if (value === "--include-ineligible") args.includeIneligible = true;
    else usage();
  }

  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function candidateGroupKey(candidate) {
  const direct = candidate.expectedGroupKey || candidate.groupKey;
  if (direct) return direct;
  const classLabel = candidate.propertyClass || candidate.accountType || "Residential";
  const groupNumber = `${candidate.valuationGroup || ""}`.match(/\d+/)?.[0];
  return groupNumber ? `${classLabel}-${groupNumber}` : null;
}

function normalize(value) {
  return `${value ?? ""}`.trim().toLowerCase();
}

function number(value) {
  const parsed = Number(`${value ?? ""}`.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function garageRowsFromRecordCard(recordCard) {
  return [
    ...(recordCard.garageCostLines || []),
    ...(recordCard.guidedSnapshot?.outbuildingData || []).filter(row => /garage/i.test(`${row.description || ""}`))
  ];
}

function garageRowsFromParsed(parsed) {
  const attached = parsed.residential?.garage1
    ? [{ description: parsed.residential.garage1, units: parsed.residential.garage1Size }]
    : [];
  const detached = (parsed.outbuildingRows || []).filter(row => /garage/i.test(`${row.description || ""}`));
  return [...attached, ...detached];
}

function garageTypeLabel(rows) {
  return rows.length
    ? rows.map(row => [row.description, row.units ? `${Number(row.units).toLocaleString("en-US")} sq. ft.` : null].filter(Boolean).join(", ")).join("; ")
    : null;
}

function garageTotalSize(rows) {
  return rows.reduce((sum, row) => sum + (Number(row.units) || 0), 0) || null;
}

function saleInfo(pdfPath) {
  const text = execFileSync("pdftotext", ["-layout", pdfPath, "-"], { encoding: "utf8" });
  const block = text.match(/Sales Information([\s\S]*?)(?:\n\s*\d+\s*\n|Property Classification)/)?.[1] || "";
  const row = block.match(/(\d{1,2}\/\d{1,2}\/20\d{2})\s+\$?([\d,]+(?:\.\d{2})?)/);
  if (!row) return { saleDate: null, salePrice: null };

  return {
    saleDate: row[1],
    salePrice: number(row[2])
  };
}

function valueRow(record, year) {
  return record.guidedSnapshot?.assessedValueBreakdown?.find(row => row.year === year) || null;
}

function subjectModel(recordCard) {
  const parcel = recordCard.guidedSnapshot?.parcel || {};
  const residential = recordCard.guidedSnapshot?.residential || {};
  const classification = recordCard.guidedSnapshot?.classification || {};
  const current = valueRow(recordCard, 2026);
  const garageRows = garageRowsFromRecordCard(recordCard);

  return {
    parcelId: parcel.parcelId,
    address: parcel.situsAddress,
    taxDistrict: parcel.taxDistrict,
    schoolDistrict: parcel.schoolDistrict,
    propertyClass: classification.propertyClass || parcel.accountType,
    accountType: parcel.accountType,
    location: classification.location,
    zoning: classification.zoning,
    lotSizeClass: classification.lotSize,
    valuationGroup: recordCard.locationModel?.valuationGroup,
    buildingSize: residential.buildingSize,
    yearBuilt: residential.yearBuilt,
    style: residential.style,
    quality: residential.quality,
    condition: residential.condition,
    exterior: residential.exterior,
    bedrooms: residential.bedrooms,
    bathrooms: residential.bathrooms,
    basementSize: residential.basementSize,
    basementFinishedSqFt: residential.minFinish,
    garageType: garageTypeLabel(garageRows),
    garageSize: garageTotalSize(garageRows),
    assessed2026: current?.total,
    landValue: current?.land,
    dwellingValue: current?.dwelling,
    outbuildingValue: current?.outbuilding
  };
}

function candidateModel(candidate, parsed, pdfPath) {
  const sale = saleInfo(pdfPath);
  const current = parsed.assessedValues?.find(row => row.year === 2026);
  const garageRows = garageRowsFromParsed(parsed);

  return {
    parcelId: parsed.parcelId,
    ntoParcelId: parsed.ntoParcelId,
    address: parsed.situsAddress,
    owner: parsed.owner,
    pdfPath,
    gworksUrl: candidate.gworksUrl,
    taxDistrict: parsed.taxDistrict,
    schoolDistrict: parsed.schoolDistrict,
    propertyClass: parsed.classification?.propertyClass || parsed.accountType,
    accountType: parsed.accountType,
    location: parsed.classification?.location,
    zoning: parsed.classification?.zoning,
    lotSizeClass: parsed.classification?.lotSize,
    valuationGroup: candidateGroupKey(candidate),
    saleDate: sale.saleDate,
    salePrice: sale.salePrice,
    buildingSize: parsed.residential?.buildingSize,
    yearBuilt: parsed.residential?.yearBuilt,
    style: parsed.residential?.style,
    quality: parsed.residential?.quality,
    condition: parsed.residential?.condition,
    exterior: parsed.residential?.exterior,
    bedrooms: parsed.residential?.bedrooms,
    bathrooms: parsed.residential?.bathrooms,
    basementSize: parsed.residential?.basementSize,
    basementFinishedSqFt: parsed.residential?.minFinish,
    garageType: garageTypeLabel(garageRows),
    garageSize: garageTotalSize(garageRows),
    outbuildings: parsed.outbuildingRows || [],
    porchesDecks: (parsed.dwellingRows || []).filter(row => /deck|porch|prch/i.test(row.description || "")),
    fireplaces: (parsed.dwellingRows || []).filter(row => /fireplace/i.test(row.description || "")),
    assessed2026: current?.total,
    landValue: current?.land,
    dwellingValue: current?.dwelling,
    outbuildingValue: current?.outbuilding
  };
}

function isEligibleComparable(subject, candidate) {
  const disqualifiers = [];
  const cautions = [];

  if (normalize(candidate.propertyClass) !== normalize(subject.propertyClass)) disqualifiers.push("Property class does not match subject.");
  if (normalize(candidate.accountType) !== "residential") disqualifiers.push("Candidate is not residential.");
  if (candidate.zoning && subject.zoning && normalize(candidate.zoning) !== normalize(subject.zoning)) cautions.push("Different zoning.");
  if (!candidate.salePrice) disqualifiers.push("Sale price is missing.");
  if (!candidate.saleDate) disqualifiers.push("Sale date is missing.");
  if (!candidate.buildingSize) disqualifiers.push("Building size is missing.");
  if (!candidate.yearBuilt) disqualifiers.push("Year built is missing.");
  if (candidate.taxDistrict !== subject.taxDistrict) cautions.push("Different tax district.");
  if (candidate.schoolDistrict !== subject.schoolDistrict) cautions.push("Different school district.");
  if (candidate.location !== subject.location) cautions.push("Different location type.");
  if (!candidate.quality || !candidate.condition) cautions.push("Missing quality or condition.");
  if ((candidate.outbuildingValue || 0) > Math.max((subject.outbuildingValue || 0) * 1.75, (subject.outbuildingValue || 0) + 20000)) {
    cautions.push("Materially larger outbuilding package.");
  }
  if ((candidate.outbuildings || []).some(row => /machinery|machine|pool/i.test(row.description || ""))) {
    cautions.push("Atypical improvement present.");
  }
  if (candidate.saleDate && saleAgeMonths(candidate.saleDate) > 36) cautions.push("Sale older than 36 months.");

  return {
    eligible: disqualifiers.length === 0,
    disqualifiers,
    cautions
  };
}

function pctDiff(subjectValue, candidateValue) {
  if (!subjectValue || !candidateValue) return null;
  return Math.abs(candidateValue - subjectValue) / subjectValue;
}

function saleAgeMonths(saleDate, reference = new Date("2026-01-01T00:00:00Z")) {
  const parsed = new Date(saleDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return (reference - parsed) / (1000 * 60 * 60 * 24 * 30.4375);
}

function conditionRank(value) {
  const ranks = ["poor", "fair", "average", "good", "very good", "excellent"];
  const text = normalize(value);
  return ranks.findIndex(rank => text.includes(rank));
}

function similarExterior(left, right) {
  const a = normalize(left);
  const b = normalize(right);
  return ["brick", "stone", "masonry", "vinyl", "wood", "hardboard", "siding", "frame"]
    .some(term => a.includes(term) && b.includes(term));
}

function scoreComparable(subject, candidate) {
  const breakdown = {
    locationJurisdiction: 0,
    physicalStructure: 0,
    qualityCondition: 0,
    basementUtility: 0,
    garageImprovements: 0,
    saleRecency: 0
  };

  if (candidate.taxDistrict === subject.taxDistrict) breakdown.locationJurisdiction += 8;
  if (candidate.schoolDistrict === subject.schoolDistrict) breakdown.locationJurisdiction += 4;
  if (candidate.location === subject.location) breakdown.locationJurisdiction += 4;
  if (candidate.lotSizeClass === subject.lotSizeClass) breakdown.locationJurisdiction += 4;

  const size = pctDiff(subject.buildingSize, candidate.buildingSize);
  if (size !== null && size <= 0.1) breakdown.physicalStructure += 10;
  else if (size !== null && size <= 0.2) breakdown.physicalStructure += 6;
  if (subject.yearBuilt && candidate.yearBuilt && Math.abs(subject.yearBuilt - candidate.yearBuilt) <= 10) breakdown.physicalStructure += 8;
  if (subject.style && candidate.style && normalize(subject.style) === normalize(candidate.style)) breakdown.physicalStructure += 7;
  if (subject.bedrooms && candidate.bedrooms && Math.abs(subject.bedrooms - candidate.bedrooms) <= 1) breakdown.physicalStructure += 3;
  if (subject.bathrooms && candidate.bathrooms && Math.abs(subject.bathrooms - candidate.bathrooms) <= 1) breakdown.physicalStructure += 3;
  if (similarExterior(subject.exterior, candidate.exterior)) breakdown.physicalStructure += 4;

  const conditionDiff = Math.abs(conditionRank(subject.condition) - conditionRank(candidate.condition));
  if (conditionDiff === 0) breakdown.qualityCondition += 8;
  else if (conditionDiff === 1) breakdown.qualityCondition += 5;
  const qualityDiff = Math.abs(conditionRank(subject.quality) - conditionRank(candidate.quality));
  if (qualityDiff === 0) breakdown.qualityCondition += 8;
  else if (qualityDiff === 1) breakdown.qualityCondition += 4;

  const basement = pctDiff(subject.basementSize, candidate.basementSize);
  if (basement !== null && basement <= 0.2) breakdown.basementUtility += 5;
  const finish = pctDiff(subject.basementFinishedSqFt, candidate.basementFinishedSqFt);
  if (finish !== null && finish <= 0.25) breakdown.basementUtility += 5;
  else if (!subject.basementFinishedSqFt && !candidate.basementFinishedSqFt) breakdown.basementUtility += 5;

  if (subject.garageType && candidate.garageType && normalize(subject.garageType).split(",")[0] === normalize(candidate.garageType).split(",")[0]) breakdown.garageImprovements += 3;
  const garage = pctDiff(subject.garageSize, candidate.garageSize);
  if (garage !== null && garage <= 0.3) breakdown.garageImprovements += 3;
  if ((subject.outbuildingValue || 0) && (candidate.outbuildingValue || 0) && pctDiff(subject.outbuildingValue, candidate.outbuildingValue) <= 0.35) breakdown.garageImprovements += 2;
  if (!(candidate.outbuildings || []).some(row => /machinery|machine|pool/i.test(row.description || ""))) breakdown.garageImprovements += 2;

  const age = saleAgeMonths(candidate.saleDate);
  if (age !== null && age <= 12) breakdown.saleRecency += 5;
  else if (age !== null && age <= 24) breakdown.saleRecency += 4;
  else if (age !== null && age <= 36) breakdown.saleRecency += 3;
  else if (age !== null) breakdown.saleRecency += 1;

  return {
    totalScore: Object.values(breakdown).reduce((sum, value) => sum + value, 0),
    breakdown
  };
}

function assessmentToSale(candidate) {
  if (!candidate.assessed2026 || !candidate.salePrice) return null;
  return candidate.assessed2026 / candidate.salePrice;
}

function topReasons(subject, candidate, score) {
  const reasons = [];
  if (candidate.taxDistrict === subject.taxDistrict) reasons.push("Same tax district.");
  if (candidate.schoolDistrict === subject.schoolDistrict) reasons.push("Same school district.");
  if (candidate.location === subject.location) reasons.push("Same location type.");
  if (pctDiff(subject.buildingSize, candidate.buildingSize) <= 0.2) reasons.push("Building size is within 20%.");
  if (score.breakdown.qualityCondition >= 12) reasons.push("Quality/condition are broadly similar.");
  if (candidate.salePrice && candidate.saleDate) reasons.push("Sale date and price are available.");
  return reasons.slice(0, 3);
}

function rankCandidates(subject, candidates, includeIneligible) {
  return candidates.map(candidate => {
    const eligibility = isEligibleComparable(subject, candidate);
    const score = scoreComparable(subject, candidate);
    return {
      parcelId: candidate.parcelId,
      ntoParcelId: candidate.ntoParcelId,
      address: candidate.address,
      owner: candidate.owner,
      saleDate: candidate.saleDate,
      salePrice: candidate.salePrice,
      assessed2026: candidate.assessed2026,
      assessmentToSaleRatio: assessmentToSale(candidate),
      buildingSize: candidate.buildingSize,
      yearBuilt: candidate.yearBuilt,
      style: candidate.style,
      quality: candidate.quality,
      condition: candidate.condition,
      totalScore: score.totalScore,
      scoreBreakdown: score.breakdown,
      eligible: eligibility.eligible,
      disqualifiers: eligibility.disqualifiers,
      cautions: eligibility.cautions,
      reasons: topReasons(subject, candidate, score),
      pdfPath: candidate.pdfPath,
      gworksUrl: candidate.gworksUrl
    };
  })
    .filter(row => includeIneligible || row.eligible)
    .sort((left, right) => {
      if (left.eligible !== right.eligible) return left.eligible ? -1 : 1;
      if (left.totalScore !== right.totalScore) return right.totalScore - left.totalScore;
      if (left.cautions.length !== right.cautions.length) return left.cautions.length - right.cautions.length;
      return new Date(right.saleDate || 0) - new Date(left.saleDate || 0);
    });
}

function main() {
  const args = parseArgs(process.argv);
  const tracker = readJson(TRACKER_PATH);
  const subject = subjectModel(readJson(path.resolve(args.subject)));
  const groupCandidates = tracker.candidates.filter(candidate =>
    candidateGroupKey(candidate) === args.group
    && candidate.gworksParcelId !== subject.parcelId
  );

  const parsedCandidates = [];
  const skipped = [];

  for (const candidate of groupCandidates) {
    const pdfPath = path.resolve(candidate.gworksPdfPath || "");
    if (!candidate.gworksPdfPath || !fs.existsSync(pdfPath)) {
      skipped.push({ parcelId: candidate.gworksParcelId, reason: "pdf_not_local" });
      continue;
    }
    try {
      const parsed = parsePdf(pdfPath);
      parsedCandidates.push(candidateModel(candidate, parsed, path.relative(ROOT, pdfPath)));
    } catch (error) {
      skipped.push({ parcelId: candidate.gworksParcelId, reason: error.message });
    }
  }

  const ranked = rankCandidates(subject, parsedCandidates, args.includeIneligible);
  const result = {
    generatedAt: new Date().toISOString(),
    note: "Candidate-selection helper only. This does not estimate market value or produce an appraisal conclusion.",
    subject,
    source: {
      trackerPath: path.relative(ROOT, TRACKER_PATH),
      group: args.group,
      groupCandidateCount: groupCandidates.length,
      localPdfCandidateCount: parsedCandidates.length,
      skippedWithoutLocalPdf: skipped.filter(row => row.reason === "pdf_not_local").length
    },
    topCandidates: ranked.slice(0, args.limit),
    alternates: ranked.slice(args.limit, args.limit + 25),
    skippedSample: skipped.slice(0, 50)
  };

  const outputPath = path.resolve(args.out);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({
    outputPath: path.relative(ROOT, outputPath),
    groupCandidateCount: groupCandidates.length,
    localPdfCandidateCount: parsedCandidates.length,
    eligibleRankedCount: ranked.filter(row => row.eligible).length,
    topCandidates: result.topCandidates.slice(0, 10).map(row => ({
      parcelId: row.parcelId,
      address: row.address,
      saleDate: row.saleDate,
      salePrice: row.salePrice,
      score: row.totalScore,
      cautions: row.cautions
    }))
  }, null, 2));
}

main();
