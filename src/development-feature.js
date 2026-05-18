const DEVELOPMENT_FEATURE_PARAM = "developmentFeature";
const SAMPLE_START_FEATURE = "sample-start";

function currentUrlParams() {
  if (typeof window === "undefined") return null;

  return new URLSearchParams(window.location.search);
}

export function developmentFeatureSampleStartPropertyId(manifest) {
  const params = currentUrlParams();
  if (!params || params.get(DEVELOPMENT_FEATURE_PARAM) !== SAMPLE_START_FEATURE) return null;

  const propertyId = params.get("property");
  const requestedProperty = manifest?.properties?.find(item => item.id === propertyId);

  return requestedProperty?.id ?? null;
}

export function continueDevelopmentFeatureSampleStart(propertyId, storageKey) {
  if (!propertyId || typeof window === "undefined") return;

  try {
    window.localStorage?.setItem(storageKey, propertyId);
  } catch {
    // The redirected URL carries the selected property when storage is unavailable.
  }

  const url = new URL(window.location.href);
  url.searchParams.delete(DEVELOPMENT_FEATURE_PARAM);
  url.searchParams.set("property", propertyId);
  url.searchParams.delete("orientation");
  url.hash = "";
  window.location.assign(url.toString());
}
