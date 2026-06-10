const REVIEW_FLAGS_STORAGE_PREFIX = "guidedParcelReview.reviewFlags.v1:";
export const REVIEW_FLAGS_CHANGED_EVENT = "guided-parcel-review:review-flags-changed";

function storageKey(parcelId) {
  return `${REVIEW_FLAGS_STORAGE_PREFIX}${parcelId || "unknown"}`;
}

function normalizeFlag(flag = {}) {
  return {
    id: String(flag.id || "").trim(),
    label: String(flag.label || "").trim(),
    value: String(flag.value || "").trim(),
    section: String(flag.section || "").trim(),
    note: String(flag.note || "")
  };
}

export function getReviewFlags(parcelId) {
  if (!parcelId) return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(parcelId)) || "[]");
    return Array.isArray(parsed)
      ? parsed.map(normalizeFlag).filter(flag => flag.id && flag.label)
      : [];
  } catch {
    localStorage.removeItem(storageKey(parcelId));
    return [];
  }
}

export function isReviewFlagSelected(parcelId, flagId) {
  return getReviewFlags(parcelId).some(flag => flag.id === flagId);
}

export function setReviewFlag(parcelId, flag, selected) {
  if (!parcelId) return [];

  const normalized = normalizeFlag(flag);
  if (!normalized.id || !normalized.label) return getReviewFlags(parcelId);

  const existing = getReviewFlags(parcelId).filter(item => item.id !== normalized.id);
  const next = selected ? [...existing, normalized] : existing;
  localStorage.setItem(storageKey(parcelId), JSON.stringify(next));

  window.dispatchEvent(new CustomEvent(REVIEW_FLAGS_CHANGED_EVENT, {
    detail: {
      parcelId,
      reviewFlags: next
    }
  }));

  return next;
}
