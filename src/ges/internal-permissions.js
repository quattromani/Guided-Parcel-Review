export const INTERNAL_PERMISSION_PARAM_NAME = "gpr_person";
export const INTERNAL_OWNER_PERSON = "max-quattromani";
export const INTERNAL_MENU_PERSON_SLUGS = Object.freeze([
  INTERNAL_OWNER_PERSON
]);

function currentLocationHref() {
  return typeof window !== "undefined" && window.location?.href
    ? window.location.href
    : "https://quattromani.github.io/Guided-Parcel-Review/";
}

function paramsFrom(source = currentLocationHref()) {
  if (source instanceof URLSearchParams) return source;
  if (source instanceof URL) return source.searchParams;
  if (source?.search instanceof URLSearchParams) return source.search;
  if (typeof source?.search === "string") return new URLSearchParams(source.search);

  try {
    return new URL(`${source || currentLocationHref()}`, currentLocationHref()).searchParams;
  } catch {
    return new URLSearchParams();
  }
}

export function internalPersonSlug(source = currentLocationHref()) {
  return paramsFrom(source).get(INTERNAL_PERMISSION_PARAM_NAME) || "";
}

export function hasInternalMenuPermission(source = currentLocationHref()) {
  return INTERNAL_MENU_PERSON_SLUGS.includes(internalPersonSlug(source));
}

export function hasInternalToolPermission(source = currentLocationHref()) {
  return internalPersonSlug(source) === INTERNAL_OWNER_PERSON;
}
