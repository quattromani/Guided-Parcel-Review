// Updated by scripts/apply-asset-version.mjs before deployment.
export const DEPLOY_VERSION = "20260709-masthead-polish-3";

export function versionedAssetUrl(assetPath, baseUrl = document.baseURI) {
  const url = new URL(assetPath, baseUrl);
  url.searchParams.set("v", DEPLOY_VERSION);
  return url.href;
}
