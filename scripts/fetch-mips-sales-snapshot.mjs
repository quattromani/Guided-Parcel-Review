#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DEFAULT_OUT = "data/sales/gage-mips-public-sales-snapshot.json";
const LAYER_URL = "https://services1.arcgis.com/32wfTde6zPzZl2pZ/arcgis/rest/services/Gage_Sales_040726_View/FeatureServer/3";
const EXPERIENCE_URL = "https://experience.arcgis.com/experience/67492767fb8d49a8b321d14022d24e81";
const WEBMAP_ID = "9a195e4ef86d47a4b8681752b1f6f141";

function usage() {
  console.error("Usage: node scripts/fetch-mips-sales-snapshot.mjs [--out data/sales/gage-mips-public-sales-snapshot.json]");
  process.exit(1);
}

function parseArgs(argv) {
  const args = { out: DEFAULT_OUT };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--out") args.out = argv[++index];
    else usage();
  }
  return args;
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed ${response.status}: ${url}`);
  return response.json();
}

function domainLookup(meta) {
  const lookup = {};
  for (const field of meta.fields || []) {
    const values = field.domain?.codedValues;
    if (!values) continue;
    lookup[field.name] = Object.fromEntries(values.map(row => [String(row.code), row.name]));
  }
  return lookup;
}

function isoDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function gworksParcelId(value) {
  if (value === null || value === undefined) return null;
  return String(value).padStart(9, "0");
}

function ntoParcelId(value) {
  const gworks = gworksParcelId(value);
  return gworks ? gworks.padStart(10, "0") : null;
}

function normalizeRecord(feature, domains) {
  const attr = feature.attributes || {};
  return {
    objectId: attr.OBJECTID,
    parcelId: attr.parcelid,
    gworksParcelId: gworksParcelId(attr.parcelid),
    ntoParcelId: ntoParcelId(attr.parcelid),
    classACode: attr.stclassa,
    classBCode: attr.stclassb,
    classBLabel: domains.stclassb?.[String(attr.stclassb)] || null,
    typeCode: attr.type,
    typeLabel: domains.type?.[String(attr.type)] || null,
    styleTypeCode: attr.style1type,
    styleTypeLabel: domains.style1type?.[String(attr.style1type)] || null,
    visibility: attr.visibility,
    saleTimestamp: attr.saledate,
    saleDate: isoDate(attr.saledate),
    adjustedSalePrice: attr.f_adjusted,
    parcelIds: attr.parcelids,
    grantor: attr.f_gntrnam1,
    grantee: attr.f_gntenam1,
    propertyAddress: attr.propaddr,
    legalDescription: attr.f_legaldsc,
    deedType: attr.f_deedtype,
    usability: attr.r_useablty,
    primaryPhotoUrl: attr.primary_nao,
    geometry: feature.geometry || null
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const meta = await getJson(`${LAYER_URL}?f=json`);
  const query = new URL(`${LAYER_URL}/query`);
  query.searchParams.set("where", "1=1");
  query.searchParams.set("outFields", "*");
  query.searchParams.set("returnGeometry", "true");
  query.searchParams.set("f", "json");
  query.searchParams.set("orderByFields", "saledate desc, f_adjusted desc");
  query.searchParams.set("resultRecordCount", String(meta.maxRecordCount || 2000));
  const data = await getJson(query.toString());

  if (data.error) throw new Error(JSON.stringify(data.error));

  const domains = domainLookup(meta);
  const records = (data.features || []).map(feature => normalizeRecord(feature, domains));
  const snapshot = {
    generatedAt: new Date().toISOString(),
    source: {
      name: "MIPS Gage Public Sales",
      experienceUrl: EXPERIENCE_URL,
      webMapId: WEBMAP_ID,
      featureLayerUrl: LAYER_URL,
      layerName: meta.name,
      displayField: meta.displayField,
      objectIdField: meta.objectIdField,
      maxRecordCount: meta.maxRecordCount,
      dateWindowLabel: "October 01, 2023 - March 01, 2026"
    },
    fields: (meta.fields || []).map(field => ({
      name: field.name,
      alias: field.alias,
      type: field.type,
      domain: field.domain?.codedValues || null
    })),
    recordCount: records.length,
    records
  };

  const outputPath = path.resolve(ROOT, args.out);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(JSON.stringify({
    outputPath: path.relative(ROOT, outputPath),
    recordCount: records.length,
    visibleCount: records.filter(row => row.visibility === "visible").length,
    beatriceOneStorySfrCount: records.filter(row =>
      row.visibility === "visible"
      && row.classBCode === 1
      && row.typeCode === 1
      && row.styleTypeCode === 1
      && /BEATRICE/i.test(row.propertyAddress || "")
    ).length
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
