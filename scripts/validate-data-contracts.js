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
  assert(typeof manifest.activePropertyId === "string" || manifest.activePropertyId === null, "Manifest activePropertyId must be a string or null.");
  assert(Array.isArray(manifest.properties) && manifest.properties.length, "Manifest must list at least one property.");
  const active = manifest.activePropertyId
    ? manifest.properties.find(property => property.id === manifest.activePropertyId)
    : null;

  if (manifest.activePropertyId) {
    assert(active, `Active property '${manifest.activePropertyId}' is not listed.`);
    assertFile(active.recordCardPath);
  }

  for (const property of manifest.properties) {
    assert(property.id, "Every manifest property needs an id.");
    assert(property.county, `Property '${property.id}' needs a county slug.`);
    assert(property.recordCardPath, `Property '${property.id}' needs recordCardPath.`);
    if (property.sampleVisibility !== undefined) {
      assert(
        ["public", "research"].includes(property.sampleVisibility),
        `Property '${property.id}' sampleVisibility must be 'public' or 'research'.`
      );
    }
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

function validateRecordCard(recordCard, manifestEntry) {
  assert(recordCard.source?.system, "Record card must identify a source system.");
  assert(recordCard.guidedSnapshot, "Record card must include guidedSnapshot for the current prototype.");
  assert(recordCard.parcelIdentifiers?.parcelId, "Record card must include parcelIdentifiers.parcelId.");

  const snapshot = recordCard.guidedSnapshot;
  assert(snapshot.parcel?.parcelId, "guidedSnapshot.parcel.parcelId is required.");
  assert(snapshot.parcel.parcelId === manifestEntry.parcelId, `Manifest parcelId and record-card parcelId must match for '${manifestEntry.id}'.`);
  assert(snapshot.parcel.taxDistrict === manifestEntry.taxDistrict, `Manifest taxDistrict and record-card taxDistrict must match for '${manifestEntry.id}'.`);
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
    if (statement.assessedValue !== null && statement.assessedValue !== undefined) {
      assert(statement.derived?.grossLevyRate !== undefined, `taxStatement ${statement.taxYear} needs derived.grossLevyRate until calculations fully move to code.`);
    }
  }
}

function main() {
  validateSchemasParse();
  const { manifest } = validateManifest();
  manifest.properties
    .filter(property => property.recordCardStatus === "available")
    .forEach(property => validateRecordCard(readJson(property.recordCardPath), property));
  console.log("data contracts ok");
}

main();
