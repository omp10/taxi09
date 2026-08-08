/**
 * Thin wrapper over the admin content endpoints. Admin pages in this codebase
 * use raw fetch with the adminToken rather than the shared axios instance, so
 * this keeps that convention in one place instead of in every page.
 */
const baseUrl = () => `${globalThis.__LEGACY_BACKEND_ORIGIN__}/api/v1/admin`;

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`,
});

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl()}${path}`, { headers: authHeaders(), ...options });
  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `Request failed (${response.status})`);
  }
  return payload?.data ?? payload;
};

export const contentApi = {
  // Travel packages
  listPackages: (scope) => request(`/travel-packages${scope ? `?scope=${scope}` : ''}`),
  createPackage: (body) => request('/travel-packages', { method: 'POST', body: JSON.stringify(body) }),
  updatePackage: (id, body) => request(`/travel-packages/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  togglePackage: (id) => request(`/travel-packages/${id}/toggle`, { method: 'PATCH' }),
  deletePackage: (id) => request(`/travel-packages/${id}`, { method: 'DELETE' }),

  // Hotels
  listHotels: () => request('/hotels'),
  createHotel: (body) => request('/hotels', { method: 'POST', body: JSON.stringify(body) }),
  updateHotel: (id, body) => request(`/hotels/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  toggleHotel: (id) => request(`/hotels/${id}/toggle`, { method: 'PATCH' }),
  deleteHotel: (id) => request(`/hotels/${id}`, { method: 'DELETE' }),

  // Drivers for hire
  listHireDrivers: () => request('/hire-drivers'),
  createHireDriver: (body) => request('/hire-drivers', { method: 'POST', body: JSON.stringify(body) }),
  updateHireDriver: (id, body) => request(`/hire-drivers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  toggleHireDriver: (id) => request(`/hire-drivers/${id}/toggle`, { method: 'PATCH' }),
  deleteHireDriver: (id) => request(`/hire-drivers/${id}`, { method: 'DELETE' }),

  // Bookings
  listHotelBookings: (params = '') => request(`/hotel-bookings${params}`),
  updateHotelBooking: (id, body) => request(`/hotel-bookings/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  listPackageBookings: (params = '') => request(`/package-bookings${params}`),
  updatePackageBooking: (id, body) => request(`/package-bookings/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  listAllBookings: () => request('/all-bookings'),

  // Membership tiers and the memberships sold
  listMembershipPlans: () => request('/membership-plans'),
  createMembershipPlan: (body) => request('/membership-plans', { method: 'POST', body: JSON.stringify(body) }),
  updateMembershipPlan: (id, body) => request(`/membership-plans/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  toggleMembershipPlan: (id) => request(`/membership-plans/${id}/toggle`, { method: 'PATCH' }),
  deleteMembershipPlan: (id) => request(`/membership-plans/${id}`, { method: 'DELETE' }),
  listMemberships: (params = '') => request(`/memberships${params}`),

  // Cars owners have offered to the platform
  listAttachedVehicles: (params = '') => request(`/attached-vehicles${params}`),
  updateAttachedVehicle: (id, body) => request(`/attached-vehicles/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // Travel stories
  listTravelStories: (params = '') => request(`/travel-stories${params}`),
  updateTravelStory: (id, body) => request(`/travel-stories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTravelStory: (id) => request(`/travel-stories/${id}`, { method: 'DELETE' }),

  // Content blocks
  listBlocks: () => request('/content-blocks'),
  saveBlock: (body) => request('/content-blocks', { method: 'PUT', body: JSON.stringify(body) }),
  deleteBlock: (id) => request(`/content-blocks/${id}`, { method: 'DELETE' }),
};

export default contentApi;
