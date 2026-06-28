import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(projectRoot, "scss");
const entryFile = path.join(sourceRoot, "ges.scss");
const outputFile = path.join(projectRoot, "src", "ges-system.css");
const importedFiles = new Set();

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveImport(specifier, fromFile) {
  const baseDir = specifier.startsWith(".") ? path.dirname(fromFile) : sourceRoot;
  const rawPath = path.resolve(baseDir, specifier);
  const dir = path.dirname(rawPath);
  const basename = path.basename(rawPath);
  const candidates = [
    `${rawPath}.scss`,
    path.join(dir, `_${basename}.scss`),
    path.join(rawPath, "index.scss"),
    path.join(rawPath, "_index.scss")
  ];

  for (const candidate of candidates) {
    if (await exists(candidate)) return candidate;
  }

  throw new Error(`Unable to resolve SCSS import "${specifier}" from ${fromFile}`);
}

async function compileFile(filePath) {
  const normalizedPath = path.normalize(filePath);
  if (importedFiles.has(normalizedPath)) return "";
  importedFiles.add(normalizedPath);

  let source = await fs.readFile(filePath, "utf8");
  source = source.replace(/^\s*\/\/.*$/gm, "");

  const importPattern = /^\s*@(use|import)\s+["']([^"']+)["'];\s*$/gm;
  let output = "";
  let cursor = 0;
  let match;

  while ((match = importPattern.exec(source))) {
    output += source.slice(cursor, match.index);
    const importFile = await resolveImport(match[2], filePath);
    output += await compileFile(importFile);
    cursor = importPattern.lastIndex;
  }

  output += source.slice(cursor);
  return output.trim() ? `\n/* ${path.relative(projectRoot, filePath)} */\n${output.trim()}\n` : "";
}

const compiled = await compileFile(entryFile);
const banner = [
  "/*",
  "  Generated from scss/ges.scss by scripts/build-scss.mjs.",
  "  Edit SCSS source files, then rebuild this CSS entry point.",
  "*/"
].join("\n");

await fs.writeFile(outputFile, `${banner}\n${compiled.trim()}\n`, "utf8");
console.log(`Built ${path.relative(projectRoot, outputFile)} from ${importedFiles.size} SCSS files.`);
