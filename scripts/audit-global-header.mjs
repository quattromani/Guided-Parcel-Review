import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDir, "..");
const failures = [];

const htmlFiles = walk(root, file => file.endsWith(".html"));
const sourceFiles = [
  ...htmlFiles,
  ...walk(join(root, "src"), file => file.endsWith(".js")),
  ...walk(join(root, "experiments"), file => file.endsWith(".js")),
  ...walk(join(root, "boe-tracker"), file => file.endsWith(".js"))
];

for (const file of htmlFiles) {
  const source = readFileSync(file, "utf8");
  if (!/<body\b/i.test(source)) continue;

  const hasSharedHeaderBootstrap = /src\/app\.js|src\/ges\/global-header\.js|src\/ges\/pattern-library\.js/i.test(source);
  if (!hasSharedHeaderBootstrap) {
    failures.push(`${relative(root, file)}: missing shared global-header bootstrap`);
  }
}

for (const file of sourceFiles) {
  const relativePath = relative(root, file);
  if ([
    "src/ges/project-nav.js",
    "src/ges/global-header.js",
    "src/ges-theme.js"
  ].includes(relativePath)) {
    continue;
  }

  const source = readFileSync(file, "utf8");

  if (/<span[^>]+class=["'][^"']*hero-brand-mark/i.test(source)) {
    failures.push(`${relativePath}: contains old inline hero-brand-mark header markup`);
  }

  if (/data-ges-theme-option=/.test(source)) {
    failures.push(`${relativePath}: contains old inline theme-toggle header markup`);
  }
}

if (failures.length) {
  console.error(`Global header audit failed with ${failures.length} issue(s):`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Global header audit passed. All body-bearing HTML pages use the shared header bootstrap.");

function walk(directory, predicate, results = []) {
  for (const entry of readdirSync(directory)) {
    if (entry === ".git" || entry === "node_modules") continue;

    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath, predicate, results);
      continue;
    }

    if (predicate(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}
