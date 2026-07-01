import {
  APPLICATION_REGISTRY_LAYOUTS,
  applicationsForNavigation
} from "./application-registry.js?v=20260701-article-polish-4";

export const GES_NAVIGATION_TARGETS = Object.freeze({
  PRIMARY: "primary",
  FOOTER: "footer",
  INTERNAL: "internal",
  UTILITY_BELT: "utilityBelt"
});

export const GES_NAVIGATION_TYPES = Object.freeze({
  PRIMARY_NAVIGATION: "primaryNavigation",
  SECONDARY_NAVIGATION: "secondaryNavigation",
  CONTEXT_NAVIGATION: "contextNavigation",
  ARTICLE_NAVIGATION: "articleNavigation",
  FOOTER_NAVIGATION: "footerNavigation",
  INTERNAL_NAVIGATION: "internalNavigation",
  WORKSPACE_NAVIGATION: "workspaceNavigation",
  UTILITY_BELT: "utilityBelt",
  QUICK_ACTIONS: "quickActions",
  BREADCRUMBS: "breadcrumbs",
  RELATED_CONTENT: "relatedContent",
  RECOVERY_NAVIGATION: "recoveryNavigation",
  SEARCH_NAVIGATION: "searchNavigation",
  DEVELOPER_NAVIGATION: "developerNavigation"
});

export const GES_LAYOUT_NAVIGATION_TARGETS = Object.freeze({
  [APPLICATION_REGISTRY_LAYOUTS.PUBLIC]: [
    GES_NAVIGATION_TARGETS.PRIMARY,
    GES_NAVIGATION_TARGETS.FOOTER
  ],
  [APPLICATION_REGISTRY_LAYOUTS.INTERNAL]: [
    GES_NAVIGATION_TARGETS.INTERNAL,
    GES_NAVIGATION_TARGETS.UTILITY_BELT
  ],
  [APPLICATION_REGISTRY_LAYOUTS.PRINTABLE]: [],
  [APPLICATION_REGISTRY_LAYOUTS.PDF]: [],
  [APPLICATION_REGISTRY_LAYOUTS.MINIMAL]: [],
  [APPLICATION_REGISTRY_LAYOUTS.LEGACY_APP]: [],
  [APPLICATION_REGISTRY_LAYOUTS.STANDALONE]: [],
  [APPLICATION_REGISTRY_LAYOUTS.FUTURE]: []
});

function normalizeNavigationValue(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function normalizeList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function navigationTargetSettings(application = {}, target = "") {
  return normalizeNavigationValue(application.navigation?.[target]);
}

function navigationValue(application = {}, target = "", key = "", fallback = null) {
  const targetSettings = navigationTargetSettings(application, target);
  return targetSettings[key] ?? application.navigation?.[key] ?? fallback;
}

export function navigationTargetsForLayout(layout = APPLICATION_REGISTRY_LAYOUTS.PUBLIC) {
  return [...(GES_LAYOUT_NAVIGATION_TARGETS[layout] ?? [])];
}

export function applicationHref(application = {}) {
  if (typeof application.route?.canonicalPath === "string" && application.route.canonicalPath) {
    return application.route.canonicalPath;
  }

  if (Array.isArray(application.route?.currentRoutes) && application.route.currentRoutes[0]) {
    return application.route.currentRoutes[0];
  }

  return "#";
}

export function applicationNavigationItem(application = {}, target = GES_NAVIGATION_TARGETS.PRIMARY) {
  return {
    id: `${target}:${application.id}`,
    applicationId: application.id,
    slug: application.slug,
    label: navigationValue(application, target, "label", application.shortTitle || application.title),
    title: application.title,
    description: navigationValue(application, target, "description", application.description),
    href: navigationValue(application, target, "href", applicationHref(application)),
    icon: navigationValue(application, target, "icon", application.icon),
    group: navigationValue(application, target, "group", application.category || "Applications"),
    order: navigationValue(application, target, "order", 999),
    target,
    type: application.type,
    status: application.status,
    audience: application.audience ?? [],
    visibility: application.visibility ?? [],
    layout: application.layout ?? null,
    category: application.category ?? null,
    tags: application.tags ?? [],
    searchable: Boolean(application.searchable?.enabled),
    requiresAuth: Boolean(application.permissions?.requiresAuth),
    requiresPermissionKey: Boolean(application.permissions?.requiresPermissionKey),
    requiresPermissionKeyValue: application.permissions?.requiresPermissionKeyValue ?? null,
    sourceApplication: application
  };
}

export function registryNavigationItems(
  registry = {},
  { target = GES_NAVIGATION_TARGETS.PRIMARY, context = {}, statuses = [] } = {}
) {
  const allowedStatuses = normalizeList(statuses);

  return applicationsForNavigation(registry, target, context)
    .filter(application => {
      if (!allowedStatuses.length) return true;
      return allowedStatuses.includes(application.status);
    })
    .map(application => applicationNavigationItem(application, target))
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return String(a.label).localeCompare(String(b.label));
    });
}

export function groupNavigationItems(items = []) {
  const grouped = items.reduce((groups, item) => {
    const group = item.group || "Applications";
    groups[group] ??= {
      id: group.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      label: group,
      order: item.order,
      items: []
    };
    groups[group].order = Math.min(groups[group].order, item.order);
    groups[group].items.push(item);
    return groups;
  }, {});

  return Object.values(grouped)
    .map(group => ({
      ...group,
      items: [...group.items].sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return String(a.label).localeCompare(String(b.label));
      })
    }))
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return String(a.label).localeCompare(String(b.label));
    });
}

export function layoutNavigationModel(
  registry = {},
  { layout = APPLICATION_REGISTRY_LAYOUTS.PUBLIC, context = {}, statuses = [] } = {}
) {
  const targets = navigationTargetsForLayout(layout);
  const model = {
    layout,
    targets,
    itemsByTarget: {},
    groupsByTarget: {}
  };

  targets.forEach(target => {
    const items = registryNavigationItems(registry, {
      target,
      context: { ...context, layout },
      statuses
    });
    model.itemsByTarget[target] = items;
    model.groupsByTarget[target] = groupNavigationItems(items);
  });

  return model;
}
