import { useEffect, useState } from 'react';
import {
  Bike, BookOpen, Building2, Bus, Car, GraduationCap, Headphones, House, Map, UserCheck,
} from 'lucide-react';

/**
 * Constants and helpers shared by the desktop landing pages.
 *
 * Kept apart from DesktopChrome.jsx so that file exports components only -
 * mixing the two disables fast refresh for the whole module.
 */

/** The nav icon shows on the current link and on hover, not on all ten at once. */
export const NAV_LINKS = [
  { label: 'Home', path: '/taxi/user', icon: House },
  { label: 'Self Drive', path: '/taxi/user/rental', badge: 'NEW', icon: Car },
  { label: 'Hire Driver', path: '/taxi/user/with-driver', icon: UserCheck },
  { label: 'Bike Rental', path: '/taxi/user/rental/bike-categories', icon: Bike },
  { label: 'Bus Booking', path: '/taxi/user/bus', icon: Bus },
  { label: 'Hotel Booking', path: '/taxi/user/hotel', icon: Building2 },
  { label: 'Tour Packages', path: '/taxi/user/tours', icon: Map },
  { label: 'Travel Stories', path: '/taxi/user/stories', icon: BookOpen },
  { label: 'Internship', path: '/taxi/user/internship', icon: GraduationCap },
  { label: 'Contact Us', path: '/taxi/user/support', icon: Headphones },
];

export const QUICK_RAIL = [
  { icon: Car, label: 'Self Drive', path: '/taxi/user/rental' },
  { icon: UserCheck, label: 'Hire Driver', path: '/taxi/user/with-driver' },
  { icon: Bike, label: 'Bike Rental', path: '/taxi/user/rental/bike-categories' },
  { icon: Bus, label: 'Bus Booking', path: '/taxi/user/bus' },
  { icon: Building2, label: 'Hotel Booking', path: '/taxi/user/hotel' },
];

export const SERVICES = [
  { title: 'Self Drive Cars', copy: 'Drive your car on your own terms.', image: '/taxi09_rental_self_drive.png', path: '/taxi/user/rental' },
  { title: 'Hire Driver', copy: 'Relax! Our professional drivers are at your service.', image: '/taxi09_rental_with_driver.png', path: '/taxi/user/with-driver' },
  { title: 'Bike Rental', copy: 'Affordable bikes & scooters for city ride.', image: '/taxi09_rental_bike.png', path: '/taxi/user/rental/bike-categories' },
  { title: 'Bus Booking', copy: 'Book buses for outstation trips & group travel.', image: '/taxi09_service_bus.png', path: '/taxi/user/bus' },
  { title: 'Hotel Booking', copy: 'Best hotels at best prices across India.', image: '/taxi09_service_hotel.svg', path: '/taxi/user/hotel' },
  { title: 'Tour Packages', copy: 'Explore amazing places with our tour packages.', image: '/taxi09_service_travel.svg', path: '/taxi/user/tours' },
];

// Bumped when the palette changed to dark-by-default: the old key already had
// 'light' written into every returning visitor's storage on first mount, which
// would have overridden the new default for everyone who had ever loaded the page.
const THEME_KEY = 'taxi09:desktop-theme:v2';

/**
 * Theme choice is shared across the desktop pages, hence one storage key.
 *
 * Dark is the default look; light is kept for anyone who picks it from the
 * sun/moon control, so an existing preference still wins over the default.
 */
export const useDesktopTheme = () => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Theme preference is a nicety; ignore storage failures.
    }
  }, [theme]);

  return [theme, () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))];
};

export const resolveBannerImage = (img) => {
  if (!img) return '';
  if (img.startsWith('data:') || img.startsWith('http') || img.startsWith('/')) return img;
  const origin = globalThis.__LEGACY_BACKEND_ORIGIN__ || window.location.origin;
  return `${origin}/${img}`;
};

export const readUserToken = () => {
  try {
    return localStorage.getItem('userToken') || localStorage.getItem('token') || '';
  } catch {
    return '';
  }
};

export const unwrapResults = (response) => {
  const results = response?.data?.data?.results ?? response?.data?.results;
  return Array.isArray(results) ? results : [];
};

// The detail route takes the vehicle through router state (and a sessionStorage
// mirror for reloads) rather than an :id param - match what the mobile list does.
export const RENTAL_SELECTED_VEHICLE_STORAGE_KEY = 'selectedRentalVehicleDetail';

export const openRentalVehicle = (navigate, vehicle, duration = 'Daily') => {
  const payload = { vehicle, duration, detailMode: 'rental', selectedSubscriptionPlanId: '' };
  try {
    window.sessionStorage.setItem(RENTAL_SELECTED_VEHICLE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures and continue with navigation state.
  }
  navigate('/taxi/user/rental/vehicle', { state: payload });
};
