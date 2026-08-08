import api from '../../../shared/api/axiosInstance';

const unwrap = (response) => response?.data?.data || response?.data || response || {};

/**
 * Admin-managed catalogue content. Every call takes a `fallback` so a page can
 * still render its bundled defaults if the API is unreachable - the screens are
 * marketing surfaces and should never come up blank.
 */
export const contentService = {
  getTravelPackages: async (scope = 'domestic', fallback = []) => {
    try {
      const response = await api.get('/users/travel-packages', { params: { scope } });
      const results = unwrap(response)?.results;
      return Array.isArray(results) && results.length ? results : fallback;
    } catch {
      return fallback;
    }
  },

  getHotels: async (fallback = []) => {
    try {
      const response = await api.get('/users/hotels');
      const results = unwrap(response)?.results;
      return Array.isArray(results) && results.length ? results : fallback;
    } catch {
      return fallback;
    }
  },

  getHotelBySlug: async (slug) => {
    const response = await api.get(`/users/hotels/${slug}`);
    return unwrap(response);
  },

  getHireDrivers: async (hireType = 'permanent', fallback = []) => {
    try {
      const response = await api.get('/users/hire-drivers', { params: { hireType } });
      const results = unwrap(response)?.results;
      return Array.isArray(results) && results.length ? results : fallback;
    } catch {
      return fallback;
    }
  },

  getContentBlocks: async (keys = '', fallback = {}) => {
    try {
      const response = await api.get('/users/content-blocks', { params: keys ? { keys } : {} });
      const blocks = unwrap(response)?.blocks;
      return blocks && Object.keys(blocks).length ? blocks : fallback;
    } catch {
      return fallback;
    }
  },
};

export default contentService;
