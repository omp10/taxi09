import api from '../../../shared/api/axiosInstance';

// Vehicle classes are drawn as emoji on the cab screens; the API only knows the
// icon family, so map it here rather than in each page.
const VEHICLE_EMOJI = { car: '\u{1F697}', suv: '\u{1F699}', van: '\u{1F690}', bike: '\u{1F3CD}️', auto: '\u{1F6FA}', taxi: '\u{1F695}' };

/**
 * Vehicle classes with admin-configured fares, shaped for the cab booking
 * screens. Falls back to the caller's bundled list so a booking screen never
 * renders an empty vehicle picker.
 */
export const getRideFares = async ({ transportType = 'taxi', serviceLocationId = '' } = {}, fallback = []) => {
  try {
    const response = await api.get('/users/ride-fares', { params: { transportType, serviceLocationId } });
    const results = response?.data?.data?.results ?? response?.data?.results;
    if (!Array.isArray(results) || results.length === 0) return fallback;

    return results.map((item) => ({
      id: item.id,
      name: item.name,
      desc: item.description,
      seats: item.capacity,
      maxSeats: item.capacity,
      image: item.image,
      icon: VEHICLE_EMOJI[item.iconType] || VEHICLE_EMOJI.taxi,
      fare: item.basePrice + item.airportSurge,
      baseFare: item.outstationBasePrice || item.basePrice,
      basePrice: item.basePrice,
      pricePerDistance: item.pricePerDistance,
      airportSurge: item.airportSurge,
    }));
  } catch {
    return fallback;
  }
};

export const userService = {
  getAppModules: async () => {
    const response = await api.get('/users/app-modules');
    return response;
  },
  getRentalVehicles: async () => {
    const response = await api.get('/users/rental-vehicles');
    return response;
  },
  getRentalVehicleSubcategories: async () => {
    const response = await api.get('/users/rental-vehicle-subcategories');
    return response;
  },
  getBanners: async () => {
    const response = await api.get('/users/banners');
    return response;
  },
  getIntercityPackages: async () => {
    const response = await api.get('/users/intercity-packages');
    return response;
  },
  createRentalQuoteRequest: async (payload) => {
    const response = await api.post('/users/rental-quote-requests', payload);
    return response;
  },
  createRentalAdvanceOrder: async (payload) => {
    const response = await api.post('/users/rental-advance/razorpay/order', payload);
    return response;
  },
  createPhonePeRentalAdvanceOrder: async (payload) => {
    const response = await api.post('/users/rental-advance/phonepe/order', payload);
    return response;
  },
  payRentalAdvanceWithWallet: async (payload) => {
    const response = await api.post('/users/rental-advance/wallet', payload);
    return response;
  },
  verifyRentalAdvancePayment: async (payload) => {
    const response = await api.post('/users/rental-advance/razorpay/verify', payload);
    return response;
  },
  verifyPhonePeRentalAdvancePayment: async (merchantTransactionId) => {
    const response = await api.get(`/users/rental-advance/phonepe/status/${merchantTransactionId}`);
    return response;
  },
  // The server owns every rental amount. Screens send ids and dates, and render
  // the returned breakdown as-is rather than doing their own arithmetic.
  quoteRentalBooking: async (payload) => {
    const response = await api.post('/users/rental-bookings/quote', payload);
    return response?.data?.data ?? response?.data ?? null;
  },
  createRentalBookingRequest: async (payload) => {
    const response = await api.post('/users/rental-bookings', payload);
    return response;
  },
  getMyRentalBookings: async (params = {}) => {
    const response = await api.get('/users/rental-bookings', { params });
    return response;
  },
  getActiveRentalBooking: async () => {
    const response = await api.get('/users/rental-bookings/active');
    return response;
  },
  updateRentalLocation: async (bookingId, payload) => {
    const response = await api.post(`/users/rental-bookings/${bookingId}/location`, payload);
    return response;
  },
  endRentalRide: async (bookingId) => {
    const response = await api.post(`/users/rental-bookings/${bookingId}/end`);
    return response;
  },
  getServiceLocations: async () => {
    const response = await api.get('/users/service-locations');
    return response;
  },
  getServiceStores: async () => {
    const response = await api.get('/users/service-stores');
    return response;
  },
  getAvailablePromos: async (params) => {
    const response = await api.get('/promos/available', { params });
    return response;
  },
  validatePromo: async (payload) => {
    const response = await api.post('/promos/validate', payload);
    return response;
  },
  validateRentalCoupon: async (payload) => {
    const response = await api.post('/promos/rental/validate', payload);
    return response;
  },
  getActiveRentalCoupons: async () => {
    const response = await api.get('/promos/rental/active');
    return response;
  },
  searchPoolingRoutes: async (params) => {
    const response = await api.get('/users/pooling/search', { params });
    return response;
  },
  getPoolingRouteDetails: async (id, params) => {
    const response = await api.get(`/users/pooling/routes/${id}`, { params });
    return response;
  },
  createPoolingBookingOrder: async (payload) => {
    const response = await api.post('/users/pooling/bookings/order', payload);
    return response;
  },
  verifyPoolingBookingPayment: async (payload) => {
    const response = await api.post('/users/pooling/bookings/verify', payload);
    return response;
  },
  createPoolingBooking: async (payload) => {
    const response = await api.post('/users/pooling/bookings', payload);
    return response;
  },
  getMyPoolingBookings: async () => {
    const response = await api.get('/users/pooling/bookings');
    return response;
  },
  // Membership: plans are public; buying and reading your own need a session.
  getMembershipPlans: async () => api.get('/users/membership-plans'),
  getMyMembership: async () => api.get('/users/membership'),
  purchaseMembership: async (planId) => api.post('/users/membership/purchase', { planId }),

  // Attach your car
  listAttachedVehicles: async () => api.get('/users/attached-vehicles'),
  getAttachedVehicle: async (id) => api.get(`/users/attached-vehicles/${id}`),
  createAttachedVehicle: async (payload) => api.post('/users/attached-vehicles', payload),
  updateAttachedVehicle: async (id, payload) => api.patch(`/users/attached-vehicles/${id}`, payload),
  submitAttachedVehicle: async (id) => api.post(`/users/attached-vehicles/${id}/submit`),
  uploadImage: async (dataUrl, folder = 'attached-vehicles') =>
    api.post('/common/upload/image', { image: dataUrl, folder }),

  // Travel stories
  listTravelStories: async (query = '') => api.get(`/users/travel-stories${query}`),
  getTravelStory: async (slug) => api.get(`/users/travel-stories/${slug}`),
  likeTravelStory: async (slug) => api.post(`/users/travel-stories/${slug}/like`),
  createTravelStory: async (payload) => api.post('/users/travel-stories', payload),
};
