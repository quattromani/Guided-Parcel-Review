import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  PDFDocument,
  StandardFonts,
  TextAlignment,
  rgb
} = require("/Users/maxquattromani/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pdf-lib");

const inputPath = process.argv[2] || "/private/tmp/form422-official.pdf";
const outputDir = process.argv[3] || "research/protest-forms";

const protest = {
  county: "Gage",
  name: "Max A. Quattromani",
  street: "1301 S 5th Ave",
  city: "Beatrice",
  state: "NE",
  zip: "68310",
  propertyId: "010496000",
  phone: "(303) 875-7843",
  email: "max@maxquattromani.com",
  legalDescription: "0 3 6 LOTS 1-3 & N 27' W 1/2 LOT 4 BLK 12 BRUMBACKS 2ND ADD",
  filed: "June 4",
  filedYear: "26",
  protestedYear: "26",
  protestedLand: "31,920",
  protestedBuildings: "352,930",
  protestedTotal: "384,850",
  protestedPersonalProperty: "0",
  requestedLand: "31,920",
  requestedBuildings: "319,280",
  requestedTotal: "351,200",
  requestedPersonalProperty: "0",
  date: "06/04/2026",
  reasons: [
    "Requesting review of: (1) two non-functional fireplaces currently contributing value;",
    "(2) condition change from Average to Good without known supporting improvements; and",
    "(3) equalization impacts shown by recent same-neighborhood comparable sales.",
    "Requested value: $351,200. See attached addendum and exhibits."
  ].join("\n")
};

function setText(form, name, value, { fontSize = 10, multiline = false, align = null } = {}) {
  const field = form.getTextField(name);
  if (multiline) field.enableMultiline();
  field.setText(value);
  field.setFontSize(fontSize);
  if (align) field.setAlignment(align);
}

function drawYesCheck(pdfDoc) {
  const page = pdfDoc.getPages()[0];
  const rect = { x: 227.782, y: 668.202, width: 11.216, height: 11.216 };
  const color = rgb(0, 0, 0);
  page.drawLine({
    start: { x: rect.x + 1.6, y: rect.y + 1.4 },
    end: { x: rect.x + rect.width - 1.6, y: rect.y + rect.height - 1.4 },
    thickness: 1.4,
    color
  });
  page.drawLine({
    start: { x: rect.x + rect.width - 1.6, y: rect.y + 1.4 },
    end: { x: rect.x + 1.6, y: rect.y + rect.height - 1.4 },
    thickness: 1.4,
    color
  });
}

async function build({ flatten }) {
  const pdfDoc = await PDFDocument.load(await fs.readFile(inputPath));
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const form = pdfDoc.getForm();

  setText(form, "County", protest.county, { fontSize: 10 });
  setText(form, "Name", protest.name, { fontSize: 10 });
  setText(form, "Street", protest.street, { fontSize: 10 });
  setText(form, "City", protest.city, { fontSize: 10 });
  setText(form, "State", protest.state, { fontSize: 10 });
  setText(form, "Zip", protest.zip, { fontSize: 10, align: TextAlignment.Right });
  setText(form, "Property ID", protest.propertyId, { fontSize: 10 });
  setText(form, "Phone", protest.phone, { fontSize: 10 });
  setText(form, "email address", protest.email, { fontSize: 10 });
  setText(form, "Real Prop Description", protest.legalDescription, { fontSize: 9, multiline: true });
  setText(form, "Filed", protest.filed, { fontSize: 10, align: TextAlignment.Center });
  setText(form, "Year", protest.filedYear, { fontSize: 10, align: TextAlignment.Center });
  setText(form, "Year2", protest.protestedYear, { fontSize: 8, align: TextAlignment.Center });

  for (const [name, value] of [
    ["Protested Land", protest.protestedLand],
    ["Requested Land", protest.requestedLand],
    ["Protested Buildings", protest.protestedBuildings],
    ["Requested Buildings", protest.requestedBuildings],
    ["Protested Both", protest.protestedTotal],
    ["Requested Both", protest.requestedTotal],
    ["Protested Pers Prop", protest.protestedPersonalProperty],
    ["Requested Pers Prop", protest.requestedPersonalProperty]
  ]) {
    setText(form, name, value, { fontSize: 10, align: TextAlignment.Right });
  }

  setText(form, "Reasons", protest.reasons, { fontSize: 8.2, multiline: true });
  setText(form, "Date", protest.date, { fontSize: 10, align: TextAlignment.Center });
  drawYesCheck(pdfDoc);

  form.updateFieldAppearances(helvetica);
  if (flatten) form.flatten();

  return pdfDoc.save();
}

await fs.mkdir(outputDir, { recursive: true });
const fillablePath = path.join(outputDir, "1301-s-5th-form-422-draft-fillable.pdf");
const printPath = path.join(outputDir, "1301-s-5th-form-422-draft-print.pdf");
await fs.writeFile(fillablePath, await build({ flatten: false }));
await fs.writeFile(printPath, await build({ flatten: true }));

const mathNote = `# Form 422 Math Check - 1301 S 5th

Source property: 010496000, 1301 S 5th, Gage County.

## Protested 2026 value

- Land: $31,920
- Dwelling/building: $336,830
- Improvement/outbuilding: $16,100
- Buildings line for Form 422: $336,830 + $16,100 = $352,930
- Total land and buildings: $31,920 + $352,930 = $384,850

The screenshot total of $385,850 is $1,000 high. The corrected protested total is $384,850.

## Requested value

- Requested land: $31,920
- Requested buildings: $319,280
- Requested total land and buildings: $31,920 + $319,280 = $351,200
- Requested reduction from corrected protested total: $384,850 - $351,200 = $33,650

The requested-side math is internally consistent.
`;

await fs.writeFile(path.join(outputDir, "1301-s-5th-form-422-math-check.md"), mathNote);

console.log(JSON.stringify({ fillablePath, printPath }, null, 2));
