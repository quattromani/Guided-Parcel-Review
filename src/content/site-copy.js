const SITE_COPY_PATH = "data/app/site-copy.json";

let siteCopy = {};

function valueAtPath(source, path) {
  return `${path}`.split(".").reduce((current, key) => current?.[key], source);
}

export async function loadSiteCopy(path = SITE_COPY_PATH) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Unable to load site copy: ${response.status}`);
  }

  siteCopy = await response.json();
  return siteCopy;
}

export function getSiteCopy() {
  return siteCopy;
}

export function copy(path, fallback = "") {
  const value = valueAtPath(siteCopy, path);
  return typeof value === "undefined" ? fallback : value;
}

export function copyArray(path, fallback = []) {
  const value = valueAtPath(siteCopy, path);
  return Array.isArray(value) ? value : fallback;
}

export function copyObject(path, fallback = {}) {
  const value = valueAtPath(siteCopy, path);
  return value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
}

export function copyTemplate(path, tokens = {}, fallback = "") {
  const template = copy(path, fallback);

  return `${template}`.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => tokens[key] ?? "");
}
