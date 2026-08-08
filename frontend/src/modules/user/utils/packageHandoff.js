import api from '../../../shared/api/axiosInstance';

/**
 * Package handoff between a listing and its detail page.
 *
 * The detail routes carry no id in the URL, so a reload or a direct hit would
 * otherwise lose the package and bounce the user back to the listing. Mirroring
 * the router state into sessionStorage lets the detail page recover it.
 *
 * Keyed by scope so a tour and an international package never overwrite each
 * other, and namespaced to match the other `taxi:*-pending` handoff keys.
 */

const KEYS = {
  tour: 'taxi:tour-pending',
  international: 'taxi:international-pending',
};

export const rememberPackage = (scope, pkg, extra = {}) => {
  const key = KEYS[scope];
  if (!key || !pkg) return;

  try {
    window.sessionStorage.setItem(key, JSON.stringify({ pkg, ...extra }));
  } catch {
    // Private mode or a full quota - navigation state still carries the trip.
  }
};

export const recallPackage = (scope) => {
  const key = KEYS[scope];
  if (!key) return null;

  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(key) || 'null');
    return parsed?.pkg || null;
  } catch {
    return null;
  }
};

/**
 * Loads a package straight from the API. This is what makes a shared link work:
 * with no router state and nothing in sessionStorage, the slug is enough.
 */
export const fetchPackageBySlug = async (slug) => {
  if (!slug) return null;
  try {
    const response = await api.get(`/users/travel-packages/${slug}`);
    const data = response?.data?.data ?? response?.data;
    return data?.slug ? data : null;
  } catch {
    return null;
  }
};

/** Anything stored alongside the package, e.g. travellers or a start date. */
export const recallPackageExtras = (scope) => {
  const key = KEYS[scope];
  if (!key) return {};

  try {
    const { pkg, ...extras } = JSON.parse(window.sessionStorage.getItem(key) || 'null') || {};
    void pkg;
    return extras;
  } catch {
    return {};
  }
};
