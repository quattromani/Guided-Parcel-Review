export const DOCUMENTS_ROUTE = "documents/";

// This registry is intentionally limited to safe publication scaffolds. It is not
// a mirror of the private Knowledge System and must never contain private source
// text, source commits, private URLs, or rendered internal artifacts.
export const DOCUMENT_REGISTRY = Object.freeze([
  Object.freeze({
    id: "operational-transition-plan",
    slug: "operational-transition-plan",
    title: "First 100 Days Operational Transition Plan",
    shortTitle: "First 100 Days Plan",
    summary: "Private Working Draft 0.3 for an incoming Assessor. No internal plan content is included in this static application.",
    family: "Transition",
    status: "Working Draft — private source",
    version: "0.3",
    updatedAt: "2026-07-17",
    audience: "Incoming Assessor",
    secondaryAudience: "Office staff, County Board leadership, PAD transition contacts, and authorized advisors",
    visibility: "private-source",
    sourceReference: "Private Knowledge System source v0.3; not included in Guided Parcel Review.",
    renderedArtifact: null
  })
]);

export function documentBySlug(slug = "") {
  return DOCUMENT_REGISTRY.find(document => document.slug === slug) ?? null;
}
