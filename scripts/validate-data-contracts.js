const fs = require("fs");
const path = require("path");

const root = process.cwd();
const schemaDir = path.join(root, "docs", "data-contracts");
const manifestPath = path.join(root, "data", "app", "property-manifest.json");
const mipsFieldMapPath = path.join(root, "src", "adapters", "mips", "field-map.json");

// This is intentionally a lightweight contract smoke test, not a full JSON Schema validator.
// It catches the handoff-critical joins and source files without adding a runtime dependency.
function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertFile(relativePath) {
  assert(fs.existsSync(path.join(root, relativePath)), `Missing file: ${relativePath}`);
}

function validateSchemasParse() {
  for (const file of fs.readdirSync(schemaDir)) {
    if (!file.endsWith(".json")) continue;
    JSON.parse(fs.readFileSync(path.join(schemaDir, file), "utf8"));
  }
  JSON.parse(fs.readFileSync(mipsFieldMapPath, "utf8"));
}

function validateManifest() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert(typeof manifest.activePropertyId === "string", "Manifest must define activePropertyId.");
  assert(Array.isArray(manifest.properties) && manifest.properties.length, "Manifest must list at least one property.");
  const active = manifest.properties.find(property => property.id === manifest.activePropertyId);
  assert(active, `Active property '${manifest.activePropertyId}' is not listed.`);
  assertFile(active.recordCardPath);

  for (const property of manifest.properties) {
    assert(property.id, "Every manifest property needs an id.");
    assert(property.county, `Property '${property.id}' needs a county slug.`);
    assert(property.recordCardPath, `Property '${property.id}' needs recordCardPath.`);
  }

  const sharedPaths = [
    manifest.sharedData.calendarPath,
    manifest.sharedData.legalReferencesPath,
    manifest.sharedData.realPropertyFormsPath,
    manifest.sharedData.statewideCtlPath,
    manifest.sharedData.standards?.iaaoStandardsPath,
    manifest.sharedData.standards?.iaaoGlossaryPath
  ].filter(Boolean);

  sharedPaths.forEach(assertFile);

  Object.entries(manifest.sharedData.counties || {}).forEach(([countySlug, county]) => {
    Object.entries(county)
      .filter(([key, value]) => key.endsWith("Path") && value)
      .forEach(([, value]) => assertFile(value));
    assert(county.label, `County '${countySlug}' needs a label.`);
  });

  return { manifest, active };
}

function validateRecordCard(recordCard, active) {
  assert(recordCard.source?.system, "Record card must identify a source system.");
  assert(recordCard.guidedSnapshot, "Record card must include guidedSnapshot for the current prototype.");
  assert(recordCard.parcelIdentifiers?.parcelId, "Record card must include parcelIdentifiers.parcelId.");

  const snapshot = recordCard.guidedSnapshot;
  assert(snapshot.parcel?.parcelId, "guidedSnapshot.parcel.parcelId is required.");
  assert(snapshot.parcel.parcelId === active.parcelId, "Manifest parcelId and record-card parcelId must match.");
  assert(snapshot.parcel.taxDistrict === active.taxDistrict, "Manifest taxDistrict and record-card taxDistrict must match.");
  assert(Array.isArray(snapshot.taxpayerHistory), "guidedSnapshot.taxpayerHistory must be an array.");
  assert(snapshot.taxpayerHistory.some(row => row.year === snapshot.snapshotYear), "taxpayerHistory must include snapshotYear.");
  assert(Array.isArray(snapshot.latestFinalLevyComponents), "latestFinalLevyComponents must be an array.");

  for (const row of snapshot.taxpayerHistory) {
    assert(Number.isInteger(row.year), "taxpayerHistory rows need integer year.");
    assert("assessedValue" in row, `taxpayerHistory ${row.year} missing assessedValue.`);
    assert("taxes" in row, `taxpayerHistory ${row.year} missing taxes.`);
    assert(row.status, `taxpayerHistory ${row.year} missing status.`);
  }

  for (const statement of snapshot.taxStatements || []) {
    assert(Number.isInteger(statement.taxYear), "taxStatements rows need integer taxYear.");
    assert(typeof statement.netAmountDue === "number", `taxStatement ${statement.taxYear} needs netAmountDue.`);
    assert(statement.derived?.grossLevyRate !== undefined, `taxStatement ${statement.taxYear} needs derived.grossLevyRate until calculations fully move to code.`);
  }
}

function main() {
  validateSchemasParse();
  const { active } = validateManifest();
  validateRecordCard(readJson(active.recordCardPath), active);
  console.log("data contracts ok");
}

main();
