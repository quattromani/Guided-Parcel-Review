import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDir, "..");
const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const explicitVersion = valueAfter("--version") || process.env.GPR_ASSET_VERSION || process.env.DEPLOY_VERSION;
const version = explicitVersion || (checkOnly ? readCurrentVersion() : gitVersion()) || timestampVersion();

const htmlFiles = walk(root, file => file.endsWith(".html"));
const jsFiles = [
  ...walk(join(root, "src"), file => file.endsWith(".js")),
  ...walk(join(root, "experiments"), file => file.endsWith(".js")),
  ...walk(join(root, "boe-tracker"), file => file.endsWith(".js"))
];
const cssFiles = [
  ...walk(join(root, "src"), file => file.endsWith(".css")),
  ...walk(join(root, "experiments"), file => file.endsWith(".css")),
  ...walk(join(root, "boe-tracker"), file => file.endsWith(".css"))
];
const files = [...htmlFiles, ...jsFiles, ...cssFiles];
const failures = [];
const changed = [];

if (!/^[A-Za-z0-9._-]+$/.test(version)) {
  throw new Error(`Invalid asset version "${version}". Use letters, numbers, dots, underscores, or hyphens.`);
}

if (!checkOnly) {
  const assetVersionFile = join(root, "src", "asset-version.js");
  const nextAssetVersionSource = `// Updated by scripts/apply-asset-version.mjs before deployment.
export const DEPLOY_VERSION = "${version}";

export function versionedAssetUrl(assetPath, baseUrl = document.baseURI) {
  const url = new URL(assetPath, baseUrl);
  url.searchParams.set("v", DEPLOY_VERSION);
  return url.href;
}
`;
  writeIfChanged(assetVersionFile, nextAssetVersionSource);
}

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const next = transformFile(file, source);

  if (checkOnly) {
    collectFailures(file, source);
    continue;
  }

  writeIfChanged(file, next);
}

if (checkOnly) {
  if (failures.length) {
    console.error(`Asset version check failed for ${failures.length} reference(s). Expected v=${version}.`);
    for (const failure of failures) {
      console.error(`${relative(root, failure.file)}:${failure.line}: ${failure.reference}`);
    }
    process.exit(1);
  }

  console.log(`Asset version check passed. All local CSS/JS references use v=${version}.`);
  process.exit(0);
}

console.log(`Applied asset version ${version}.`);
if (changed.length) {
  console.log(`Updated ${changed.length} file(s):`);
  for (const file of changed) {
    console.log(`- ${relative(root, file)}`);
  }
} else {
  console.log("No files changed.");
}

function valueAfter(flag) {
  const index = args.indexOf(flag);
  if (index === -1) return "";
  return args[index + 1] || "";
}

function readCurrentVersion() {
  try {
    const source = readFileSync(join(root, "src", "asset-version.js"), "utf8");
    return source.match(/DEPLOY_VERSION\s*=\s*["']([^"']+)["']/)?.[1] || "";
  } catch {
    return "";
  }
}

function gitVersion() {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return "";
  }
}

function timestampVersion() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hour = String(now.getUTCHours()).padStart(2, "0");
  const minute = String(now.getUTCMinutes()).padStart(2, "0");
  return `${year}${month}${day}-${hour}${minute}`;
}

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

function transformFile(file, source) {
  if (file.endsWith(".html")) return transformHtml(source);
  if (file.endsWith(".css")) return transformCss(source);
  if (file.endsWith(".js")) return transformJs(source);
  return source;
}

function transformHtml(source) {
  return source.replace(/(<(?:link|script)\b[^>]*?\b(?:href|src)=)(["'])([^"']+)(\2)/gi, (match, prefix, quote, reference, suffix) => {
    return `${prefix}${quote}${versionAssetReference(reference)}${suffix}`;
  });
}

function transformCss(source) {
  let next = source.replace(/(@import\s+(?:url\(\s*)?)(["'])([^"']+)(\2)(\s*\)?)/gi, (match, prefix, quote, reference, suffix, close) => {
    return `${prefix}${quote}${versionAssetReference(reference)}${suffix}${close}`;
  });

  next = next.replace(/(@import\s+url\(\s*)([^"'\s)]+)(\s*\))/gi, (match, prefix, reference, suffix) => {
    return `${prefix}${versionAssetReference(reference)}${suffix}`;
  });

  return next;
}

function transformJs(source) {
  let next = source.replace(/(\bfrom\s*)(["'])([^"']+)(\2)/g, replaceImportReference);
  next = next.replace(/(\bimport\s*\(\s*)(["'])([^"']+)(\2)/g, replaceImportReference);
  next = next.replace(/(\bimport\s+)(["'])([^"']+)(\2)/g, replaceImportReference);
  next = next.replace(/(\bnew\s+URL\(\s*)(["'])([^"']+)(\2)/g, replaceImportReference);
  return next;
}

function replaceImportReference(match, prefix, quote, reference, suffix) {
  return `${prefix}${quote}${versionAssetReference(reference)}${suffix}`;
}

function collectFailures(file, source) {
  const references = [];

  if (file.endsWith(".html")) {
    source.replace(/<(?:link|script)\b[^>]*?\b(?:href|src)=["']([^"']+)["'][^>]*>/gi, (match, reference, offset) => {
      references.push({ reference, offset });
      return match;
    });
  } else if (file.endsWith(".css")) {
    source.replace(/@import\s+(?:url\(\s*)?["']?([^"'\s)]+)["']?\s*\)?/gi, (match, reference, offset) => {
      references.push({ reference, offset });
      return match;
    });
  } else if (file.endsWith(".js")) {
    for (const pattern of [
      /\bfrom\s*["']([^"']+)["']/g,
      /\bimport\s*\(\s*["']([^"']+)["']/g,
      /\bimport\s+["']([^"']+)["']/g,
      /\bnew\s+URL\(\s*["']([^"']+)["']/g
    ]) {
      source.replace(pattern, (match, reference, offset) => {
        references.push({ reference, offset });
        return match;
      });
    }
  }

  for (const item of references) {
    if (!isVersionableLocalAsset(item.reference)) continue;
    if (assetVersion(item.reference) === version) continue;

    failures.push({
      file,
      line: source.slice(0, item.offset).split("\n").length,
      reference: item.reference
    });
  }
}

function versionAssetReference(reference) {
  if (!isVersionableLocalAsset(reference)) return reference;

  const { pathPart, queryPart, hashPart } = splitReference(reference);
  const params = new URLSearchParams(queryPart);
  params.set("v", version);
  return `${pathPart}?${params.toString()}${hashPart}`;
}

function assetVersion(reference) {
  const { queryPart } = splitReference(reference);
  return new URLSearchParams(queryPart).get("v") || "";
}

function isVersionableLocalAsset(reference) {
  if (!reference || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(reference)) return false;

  const { pathPart } = splitReference(reference);
  return /\.(?:css|js)$/i.test(pathPart);
}

function splitReference(reference) {
  const hashIndex = reference.indexOf("#");
  const beforeHash = hashIndex === -1 ? reference : reference.slice(0, hashIndex);
  const hashPart = hashIndex === -1 ? "" : reference.slice(hashIndex);
  const queryIndex = beforeHash.indexOf("?");

  if (queryIndex === -1) {
    return {
      pathPart: beforeHash,
      queryPart: "",
      hashPart
    };
  }

  return {
    pathPart: beforeHash.slice(0, queryIndex),
    queryPart: beforeHash.slice(queryIndex + 1),
    hashPart
  };
}

function writeIfChanged(file, next) {
  const current = readFileSync(file, "utf8");
  if (current === next) return;

  writeFileSync(file, next);
  changed.push(file);
}
