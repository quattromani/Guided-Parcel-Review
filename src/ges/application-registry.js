const APPLICATION_REGISTRY_PATH = "data/app/application-registry.json";

export const APPLICATION_REGISTRY_STATUSES = Object.freeze({
  ACTIVE: "active",
  ARCHIVED: "archived",
  DEPRECATED: "deprecated",
  DRAFT: "draft",
  EXPERIMENTAL: "experimental",
  PLANNED: "planned"
});

export const APPLICATION_REGISTRY_VISIBILITY = Object.freeze({
  AUTHENTICATED: "authenticated",
  COUNTY_ADMIN: "countyAdmin",
  HIDDEN: "hidden",
  INTERNAL: "internal",
  PERMISSION_KEY: "permissionKey",
  PUBLIC: "public",
  TENANT_SPECIFIC: "tenantSpecific"
});

export const APPLICATION_REGISTRY_LAYOUTS = Object.freeze({
  FUTURE: "future",
  INTERNAL: "internal",
  LEGACY_APP: "legacyApp",
  MINIMAL: "minimal",
  PDF: "pdf",
  PRINTABLE: "printable",
  PUBLIC: "public",
  STANDALONE: "standalone"
});

let registryPromise;

function normalizeList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function normalizeAudienceContext(context = {}) {
  const roles = normalizeList(context.roles);
  const visibility = normalizeList(context.visibility);

  return {
    ...context,
    authenticated: Boolean(context.authenticated),
    countyAdmin: Boolean(context.countyAdmin),
    internal: Boolean(context.internal),
    permissionKey: Boolean(context.permissionKey),
    public: context.public !== false,
    roles,
    tenant: context.tenant || null,
    visibility
  };
}

export async function loadApplicationRegistry(path = APPLICATION_REGISTRY_PATH) {
  registryPromise ??= fetch(path).then(response => {
    if (!response.ok) {
      throw new Error(`Unable to load GES application registry: ${response.status}`);
    }
    return response.json();
  });

  return registryPromise;
}

export function registryApplications(registry = {}) {
  return Array.isArray(registry.applications) ? registry.applications : [];
}

export function findApplicationById(registry = {}, id = "") {
  return registryApplications(registry).find(application => application.id === id) ?? null;
}

export function findApplicationBySlug(registry = {}, slug = "") {
  return registryApplications(registry).find(application => application.slug === slug) ?? null;
}

export function applicationHasVisibility(application = {}, visibility) {
  return normalizeList(application.visibility).includes(visibility);
}

export function applicationMatchesAudience(application = {}, rawContext = {}) {
  const context = normalizeAudienceContext(rawContext);
  const visibility = normalizeList(application.visibility);
  const audience = normalizeList(application.audience);

  if (visibility.includes(APPLICATION_REGISTRY_VISIBILITY.HIDDEN)) return false;
  if (visibility.includes(APPLICATION_REGISTRY_VISIBILITY.PUBLIC) && context.public) return true;
  if (visibility.includes(APPLICATION_REGISTRY_VISIBILITY.INTERNAL) && context.internal) return true;
  if (visibility.includes(APPLICATION_REGISTRY_VISIBILITY.PERMISSION_KEY) && context.permissionKey) return true;
  if (visibility.includes(APPLICATION_REGISTRY_VISIBILITY.AUTHENTICATED) && context.authenticated) return true;
  if (visibility.includes(APPLICATION_REGISTRY_VISIBILITY.COUNTY_ADMIN) && context.countyAdmin) return true;
  if (visibility.includes(APPLICATION_REGISTRY_VISIBILITY.TENANT_SPECIFIC) && context.tenant) return true;

  return audience.some(role => context.roles.includes(role));
}

export function applicationsForAudience(registry = {}, context = {}) {
  return registryApplications(registry).filter(application => applicationMatchesAudience(application, context));
}

export function applicationsForNavigation(registry = {}, target = "primary", context = {}) {
  return applicationsForAudience(registry, context)
    .filter(application => Boolean(application.navigation?.[target]))
    .sort((a, b) => (a.navigation?.order ?? 999) - (b.navigation?.order ?? 999));
}

export function applicationsForSearch(registry = {}, context = {}) {
  return applicationsForAudience(registry, context)
    .filter(application => application.searchable?.enabled)
    .filter(application => {
      if (context.internal) return application.searchable?.internal !== false;
      return application.searchable?.public !== false;
    });
}

export function applicationsByType(registry = {}, type = "") {
  return registryApplications(registry).filter(application => application.type === type);
}

export function applicationsByStatus(registry = {}, status = "") {
  return registryApplications(registry).filter(application => application.status === status);
}

export function resetApplicationRegistryCache() {
  registryPromise = null;
}

