import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Fuel, Shield, ChevronRight, ChevronLeft, ChevronDown, SlidersHorizontal, ArrowDownUp, Star, Info, Car, Search, X, Bike, MapPin, MessageSquare, Calendar, User, Compass, Truck, Check, Headset, Home, Bell, Clock, Users, Percent, IndianRupee } from 'lucide-react';
import { userService } from '../../services/userService';
import BottomNavbar from '../../components/BottomNavbar';
import rentalCarImg from '@/assets/images/rental_car.png';
import toast from 'react-hot-toast';
const DURATION_TABS = ['Hourly', 'Half-Day', 'Daily'];
const RENTAL_SELECTED_VEHICLE_STORAGE_KEY = 'selectedRentalVehicleDetail';
const RENTAL_PAGE_SIZE = 10;
const CATEGORY_FILTERS = [
  { id: 'all', label: 'All', Icon: Star },
  { id: 'car', label: 'Cars', Icon: Car },
  { id: 'bike', label: 'Bikes', Icon: Bike },
];

const infoBanner = {
  Hourly: 'Short rentals for quick city use.',
  'Half-Day': 'Mid-length rentals for errands and local trips.',
  Daily: 'Full-day rentals for flexible travel and extended usage.',
};

const durationSuffix = { Hourly: '/hr', 'Half-Day': '/6hr', Daily: '/day' };

const gradientPairs = [
  ['#FFF7ED', '#FFFFFF'],
  ['#F0FDF4', '#FFFFFF'],
  ['#EFF6FF', '#FFFFFF'],
  ['#FDF4FF', '#FFFFFF'],
  ['#FEF2F2', '#FFFFFF'],
];

const normalizeSearchValue = (value = '') => String(value || '').trim().toLowerCase();
const normalizeRentalCategory = (value = '') => {
  const normalized = normalizeSearchValue(value);

  if (normalized === 'bike') return 'bike';
  if (['car', 'suv', 'van'].includes(normalized)) return 'car';

  return normalized;
};

const findPricingBucket = (pricing = [], minHours, maxHours = Infinity) =>
  pricing.find(
    (item) =>
      Number(item.durationHours || 0) >= minHours &&
      Number(item.durationHours || 0) <= maxHours &&
      item.active !== false,
  );

const normalizeRentalVehicle = (item = {}, index = 0) => {
  const [gradientFrom, gradientTo] = gradientPairs[index % gradientPairs.length];
  const pricing = Array.isArray(item.pricing) ? item.pricing : [];
  const hourly = findPricingBucket(pricing, 1, 5) || pricing[0] || null;
  const halfDay = findPricingBucket(pricing, 6, 12) || hourly || pricing[0] || null;
  const daily = findPricingBucket(pricing, 24, Infinity) || pricing[pricing.length - 1] || halfDay || hourly;
  const capacity = Number(item.capacity || 0);
  const luggageCapacity = Number(item.luggageCapacity || 0);
  const isBike = String(item.vehicleCategory || '').toLowerCase() === 'bike';

  const featureSet = new Set(Array.isArray(item.amenities) ? item.amenities.filter(Boolean) : []);
  if (capacity > 0) featureSet.add(`${capacity} seat${capacity === 1 ? '' : 's'}`);
  if (luggageCapacity > 0) featureSet.add(`${luggageCapacity} bag${luggageCapacity === 1 ? '' : 's'} space`);
  if (!featureSet.size) {
    featureSet.add(isBike ? 'Helmet included' : 'Comfort ride');
  }

  const prices = {
    Hourly: Number(hourly?.price || 0),
    'Half-Day': Number(halfDay?.price || 0),
    Daily: Number(daily?.price || 0),
  };

  const kmLimit = {
    Hourly: `${Number(hourly?.includedKm || 0)} km`,
    'Half-Day': `${Number(halfDay?.includedKm || 0)} km`,
    Daily: `${Number(daily?.includedKm || 0)} km`,
  };

  const sortedPackages = [...pricing].sort(
    (a, b) => Number(a.durationHours || 0) - Number(b.durationHours || 0),
  );
  const mostExpensive = sortedPackages.reduce(
    (best, current) =>
      Number(current.price || 0) > Number(best?.price || 0) ? current : best,
    sortedPackages[0] || null,
  );
  const cheapest = sortedPackages.reduce(
    (best, current) =>
      Number(current.price || 0) < Number(best?.price || 0) ? current : best,
    sortedPackages[0] || null,
  );

  let tag = `${item.vehicleCategory || 'Rental'} Ready`;
  let tagColor = 'text-amber-600';
  let tagBg = 'bg-amber-50 border-amber-100';

  if (mostExpensive && String(mostExpensive.id) === String(daily?.id)) {
    tag = 'Premium';
    tagColor = 'text-purple-600';
    tagBg = 'bg-purple-50 border-purple-100';
  } else if (cheapest && String(cheapest.id) === String(hourly?.id)) {
    tag = 'Best Value';
    tagColor = 'text-emerald-600';
    tagBg = 'bg-emerald-50 border-emerald-100';
  } else if (isBike) {
    tag = 'Most Popular';
    tagColor = 'text-amber-600';
    tagBg = 'bg-amber-50 border-amber-100';
  }

  const gallery = [
    item.coverImage,
    item.image,
    ...(Array.isArray(item.galleryImages) ? item.galleryImages : []),
    ...(Array.isArray(item.gallery) ? item.gallery : []),
    item.map_icon,
  ].filter((value, currentIndex, array) => value && array.indexOf(value) === currentIndex);

  const activeSubscriptionPlans = Array.isArray(item.subscription?.plans)
    ? item.subscription.plans.filter((plan) => plan?.active !== false)
    : [];
  const primarySubscriptionPlan = [...activeSubscriptionPlans].sort(
    (a, b) => Number(a.durationDays || 0) - Number(b.durationDays || 0),
  )[0] || null;

  return {
    id: item.id || item._id,
    name: item.name || 'Rental Vehicle',
    tag,
    tagColor,
    tagBg,
    image: item.image || '',
    rating: '4.8',
    fuel: item.fuel || (isBike ? 'Self-drive ┬╖ License required' : 'Self-drive ┬╖ Clean and sanitized'),
    prices,
    kmLimit,
    features: Array.from(featureSet).slice(0, 4),
    gradientFrom,
    gradientTo,
    rawPricing: pricing,
    gallery,
    blueprint: item.blueprint || { lowerDeck: [], upperDeck: [] },
    amenities: Array.isArray(item.amenities) ? item.amenities.filter(Boolean) : [],
    shortDescription: item.short_description || '',
    description: item.description || '',
    luggageCapacity,
    capacity,
    vehicleCategory: item.vehicleCategory || 'Vehicle',
    normalizedCategory: normalizeRentalCategory(item.vehicleCategory),
    advancePayment: {
      enabled: Boolean(item.advancePayment?.enabled),
      paymentMode: item.advancePayment?.paymentMode || 'percentage',
      amount: Number(item.advancePayment?.amount || 0),
      label: item.advancePayment?.label || 'Advance booking payment',
      notes: item.advancePayment?.notes || '',
    },
    subscription: {
      enabled: Boolean(item.subscription?.enabled),
      plans: activeSubscriptionPlans,
      primaryPlan: primarySubscriptionPlan,
    },
  };
};

const RentalSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="rounded-[24px] border border-white/80 bg-white/90 shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-hidden animate-pulse">
        <div className="px-4 pt-3.5 pb-3 flex items-center justify-between bg-slate-50/50">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-16 bg-slate-200 rounded-full" />
            <div className="h-5 w-32 bg-slate-200 rounded-md" />
            <div className="h-3 w-24 bg-slate-200 rounded-md" />
            <div className="flex gap-2">
              <div className="h-3 w-8 bg-slate-200 rounded-full" />
              <div className="h-3 w-12 bg-slate-200 rounded-full" />
            </div>
          </div>
          <div className="h-16 w-20 bg-slate-200 rounded-2xl shrink-0" />
        </div>
        <div className="px-4 pb-4 pt-3 space-y-3">
          <div className="flex gap-1">
            <div className="h-4 w-12 bg-slate-200 rounded-full" />
            <div className="h-4 w-12 bg-slate-200 rounded-full" />
            <div className="h-4 w-12 bg-slate-200 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-2 w-8 bg-slate-200 rounded-full" />
              <div className="h-6 w-20 bg-slate-200 rounded-md" />
            </div>
            <div className="h-9 w-24 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const LOCATION_SUGGESTIONS = [
  "South Tukoganj, Indore",
  "Indore Airport (IDR), Indore",
  "Vijay Nagar, Indore",
  "Palasia, Indore",
  "Rajwada, Indore",
  "Bhopal Junction, Bhopal"
];

const BikeRentalHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedDuration, setSelectedDuration] = useState('Hourly');
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState(() => {
    return location.state?.preSelectedSearch || '';
  });
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(() => {
    if (location.state?.preSelectedCategory) {
      return location.state.preSelectedCategory;
    }
    return 'car';
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSegment, setActiveSegment] = useState('rentals'); // 'rentals' or 'subscriptions'
  const [subCategory, setSubCategory] = useState('Hatchbacks'); // 'Hatchbacks', 'Sedans', 'SUVs' for subscriptions
  const [landingCategory, setLandingCategory] = useState('Hatchback');
  const [dropOffLocation, setDropOffLocation] = useState('');
  const [pickupDate, setPickupDate] = useState('2026-06-26');
  const [dropoffDate, setDropoffDate] = useState('2026-06-27');
  const [pickupTime, setPickupTime] = useState('18:00');
  const [dropoffTime, setDropoffTime] = useState('16:00');
  const [passengerCount, setPassengerCount] = useState(1);
  const [transmission, setTransmission] = useState('Manual');
  const [offerApplied, setOfferApplied] = useState(false);
  const [landingDropdown, setLandingDropdown] = useState(null);
  const [resultDropdown, setResultDropdown] = useState(null);
  const [resultPriceFilter, setResultPriceFilter] = useState('Any');
  const [resultTransmissionFilter, setResultTransmissionFilter] = useState('Any');
  const [resultFuelFilter, setResultFuelFilter] = useState('Any');
  const [resultSeatsFilter, setResultSeatsFilter] = useState('Any');
  const [resultSort, setResultSort] = useState('Recommended');
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isAddressEntered = queryParams.get('search') === 'true';
  const selectedLocation = queryParams.get('location') || 'South Tukoganj, Indore';
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  const [locationSearchText, setLocationSearchText] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('location') || '';
  });
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const loc = params.get('location') || '';
    setLocationSearchText(loc);
  }, [location.search]);
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    const totalBanners = banners.length;
    if (totalBanners <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % totalBanners);
    }, 3500);
    return () => clearInterval(interval);
  }, [banners.length]);

  const resolveImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('data:') || img.startsWith('http')) return img;
    const baseUrl = globalThis.__LEGACY_BACKEND_ORIGIN__ || '';
    return `${baseUrl}/${img.startsWith('/') ? img.slice(1) : img}`;
  };

  const taxi09Cars = useMemo(() => {
    const realCars = vehicles.filter(v => v.normalizedCategory === 'car');
    return realCars.map((car, idx) => ({
      id: car.id,
      name: car.name.split(' ').slice(1).join(' ') || car.name,
      brand: car.name.split(' ')[0] || 'Car',
      image: car.image || rentalCarImg,
      prices: car.prices,
      kmLimit: car.kmLimit,
      fuel: car.fuel,
      features: car.features || ['5 Seats', 'Automatic', 'AC'],
      categoryType: car.capacity <= 5 ? (idx % 2 === 0 ? 'Hatchbacks' : 'Sedans') : 'SUVs',
      year: '2024-25',
      rawVehicle: car
    }));
  }, [vehicles]);

  const subscriptionVehicles = useMemo(() => {
    return vehicles
      .filter((vehicle) => vehicle.subscription?.enabled && vehicle.subscription?.plans?.length)
      .map((vehicle, idx) => {
        const primaryPlan = vehicle.subscription?.primaryPlan || vehicle.subscription?.plans?.[0] || null;
        const brandParts = String(vehicle.name || '').trim().split(' ').filter(Boolean);
        const brand = brandParts[0] || vehicle.vehicleCategory || 'Vehicle';
        const displayName = brandParts.slice(1).join(' ') || vehicle.name || 'Subscription Vehicle';

        return {
          id: vehicle.id,
          brand,
          name: displayName,
          image: vehicle.image || rentalCarImg,
          prices: {
            Hourly: Number(primaryPlan?.price || 0),
            'Half-Day': Number(primaryPlan?.price || 0),
            Daily: Number(primaryPlan?.price || 0),
          },
          kmLimit: {
            Hourly: `${Number(primaryPlan?.includedKm || 0)} km`,
            'Half-Day': `${Number(primaryPlan?.includedKm || 0)} km`,
            Daily: `${Number(primaryPlan?.includedKm || 0)} km`,
          },
          fuel: vehicle.fuel,
          features: vehicle.features || [],
          categoryType: vehicle.capacity <= 5 ? (idx % 2 === 0 ? 'Hatchbacks' : 'Sedans') : 'SUVs',
          year: primaryPlan ? `${primaryPlan.durationDays} day plan` : 'Subscription',
          rawVehicle: vehicle,
          subscriptionPlan: primaryPlan,
        };
      });
  }, [vehicles]);

  const displayedCars = useMemo(() => {
    if (activeSegment === 'rentals') {
      return taxi09Cars.filter(c => c.prices?.Daily > 0);
    }
    return subscriptionVehicles.filter(c => c.categoryType === subCategory);
  }, [taxi09Cars, activeSegment, subscriptionVehicles, subCategory]);

  const openVehicleDetail = (vehicle, options = {}) => {
    const payload = {
      vehicle,
      duration: selectedDuration,
      detailMode: options.detailMode || 'rental',
      selectedSubscriptionPlanId: options.selectedSubscriptionPlanId || '',
    };

    try {
      window.sessionStorage.setItem(RENTAL_SELECTED_VEHICLE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage failures and continue with navigation state.
    }

    navigate('/taxi/user/rental/vehicle', { state: payload });
  };

  useEffect(() => {
    let mounted = true;

    const loadVehicles = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const response = await userService.getRentalVehicles();
        const results = response?.data?.results || response?.results || [];

        if (!mounted) return;

        setVehicles(
          results
            .map((item, index) => normalizeRentalVehicle(item, index))
            .filter((item) => Object.values(item.prices).some((price) => Number(price) > 0)),
        );
      } catch (error) {
        if (mounted) {
          setErrorMessage(error?.message || 'Could not load rental vehicles.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadVehicles();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadBanners = async () => {
      try {
        setBannersLoading(true);
        const response = await userService.getBanners();
        const results = response?.data?.results || response?.results || [];
        if (mounted) {
          setBanners(results.filter(b => b.active !== false));
        }
      } catch (error) {
        console.error('Failed to load banners', error);
      } finally {
        if (mounted) {
          setBannersLoading(false);
        }
      }
    };
    loadBanners();
    return () => {
      mounted = false;
    };
  }, []);

  const availableCountLabel = useMemo(() => {
    const bikes = vehicles.filter(
      (item) => String(item.vehicleCategory || '').toLowerCase() === 'bike',
    ).length;

    if (bikes === vehicles.length && vehicles.length > 0) {
      return `${vehicles.length} bikes`;
    }

    return `${vehicles.length} vehicles`;
  }, [vehicles]);

  const rentalSuggestions = useMemo(() => {
    const seen = new Set();
    const suggestions = [];

    vehicles.forEach((vehicle) => {
      [vehicle.name, vehicle.vehicleCategory, ...(vehicle.amenities || []), ...(vehicle.features || [])]
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .forEach((item) => {
          const key = item.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            suggestions.push(item);
          }
        });
    });

    return suggestions;
  }, [vehicles]);

  const visibleSuggestions = useMemo(() => {
    const query = normalizeSearchValue(searchQuery);

    if (!query) {
      return rentalSuggestions.slice(0, 6);
    }

    return rentalSuggestions
      .filter((item) => normalizeSearchValue(item).includes(query))
      .slice(0, 6);
  }, [rentalSuggestions, searchQuery]);

  const categoryCounts = useMemo(() => {
    return vehicles.reduce(
      (accumulator, vehicle) => {
        const category = normalizeRentalCategory(vehicle.normalizedCategory || vehicle.vehicleCategory);
        if (category === 'car') accumulator.car += 1;
        if (category === 'bike') accumulator.bike += 1;
        accumulator.all += 1;
        return accumulator;
      },
      { all: 0, car: 0, bike: 0 },
    );
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    const query = normalizeSearchValue(searchQuery);

    return vehicles.filter((vehicle) => {
      const matchesCategory =
        selectedCategoryFilter === 'all' ||
        normalizeRentalCategory(vehicle.normalizedCategory || vehicle.vehicleCategory) === selectedCategoryFilter;

      if (!matchesCategory) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        vehicle.name,
        vehicle.vehicleCategory,
        vehicle.shortDescription,
        vehicle.description,
        vehicle.fuel,
        ...(vehicle.amenities || []),
        ...(vehicle.features || []),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [searchQuery, selectedCategoryFilter, vehicles]);

  const filteredCountLabel = `${filteredVehicles.length} result${filteredVehicles.length === 1 ? '' : 's'}`;
  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / RENTAL_PAGE_SIZE));
  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentPage - 1) * RENTAL_PAGE_SIZE;
    return filteredVehicles.slice(startIndex, startIndex + RENTAL_PAGE_SIZE);
  }, [currentPage, filteredVehicles]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryFilter]);

  useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  // If selectedCategoryFilter is 'car', render the custom Taxi09 UI
  const searchResultCars = useMemo(() => {
    const cars = vehicles.filter(v => v.normalizedCategory === 'car');
    return cars.map((car) => {
      const nameParts = car.name.split(' ');
      const brand = nameParts[0] || 'Car';
      const displayName = nameParts.slice(1).join(' ') || car.name;
      return {
        id: car.id,
        brand,
        name: displayName,
        fuel: car.rawVehicle?.fuel || 'Petrol ┬╖ Manual',
        capacity: car.capacity || 5,
        price: car.prices?.Daily || 4000,
        image: car.image || rentalCarImg,
        distance: car.shortDescription || '7 km | Lake view..'
      };
    });
  }, [vehicles]);

  const matchedCars = useMemo(() => {
    return searchResultCars.filter(car => {
      if (!searchQuery) return true;
      return `${car.brand} ${car.name}`.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchResultCars, searchQuery]);

  if (selectedCategoryFilter === 'car') {
    if (isAddressEntered) {
      // 2. Render Search Results View (Indore Listing)
      const fallbackCars = [
        { id: 'swift-demo', brand: 'Maruti', name: 'Swift', image: rentalCarImg, fuel: 'Petrol', capacity: 5, price: 2199, badge: 'Popular', rating: '4.6', reviews: 128, body: 'Hatchback' },
        { id: 'city-demo', brand: 'Honda', name: 'City', image: rentalCarImg, fuel: 'Petrol', capacity: 5, price: 2599, badge: 'Best Value', rating: '4.7', reviews: 210, body: 'Sedan' },
        { id: 'creta-demo', brand: 'Hyundai', name: 'Creta', image: rentalCarImg, fuel: 'Diesel', capacity: 5, price: 3199, badge: 'Premium', rating: '4.8', reviews: 156, body: 'SUV' },
        { id: 'scorpio-demo', brand: 'Mahindra', name: 'Scorpio-N', image: rentalCarImg, fuel: 'Diesel', capacity: 7, price: 3899, badge: '', rating: '4.8', reviews: 98, body: 'SUV' },
      ];
      const listingCars = (matchedCars.length ? matchedCars : fallbackCars).slice(0, 4).map((car, index) => ({
        ...fallbackCars[index],
        ...car,
        body: car.body || car.categoryType?.replace(/s$/, '') || fallbackCars[index]?.body || 'Hatchback',
        badge: car.badge || fallbackCars[index]?.badge || '',
        rating: car.rating || fallbackCars[index]?.rating || '4.7',
        reviews: car.reviews || fallbackCars[index]?.reviews || 128,
        fuel: String(car.fuel || fallbackCars[index]?.fuel || 'Petrol').split(' ')[0],
        transmission: car.transmission || fallbackCars[index]?.transmission || (index === 1 ? 'Auto' : 'Manual'),
      }));
      const filteredListingCars = listingCars
        .filter((car) => {
          if (resultPriceFilter === 'Under ₹3000' && Number(car.price || 0) >= 3000) return false;
          if (resultPriceFilter === '₹3000+' && Number(car.price || 0) < 3000) return false;
          if (resultTransmissionFilter !== 'Any' && car.transmission !== resultTransmissionFilter) return false;
          if (resultFuelFilter !== 'Any' && car.fuel !== resultFuelFilter) return false;
          if (resultSeatsFilter === '5 Seater' && Number(car.capacity || 0) !== 5) return false;
          if (resultSeatsFilter === '6+ Seater' && Number(car.capacity || 0) < 6) return false;
          return true;
        })
        .sort((a, b) => {
          if (resultSort === 'Price Low') return Number(a.price || 0) - Number(b.price || 0);
          if (resultSort === 'Price High') return Number(b.price || 0) - Number(a.price || 0);
          if (resultSort === 'Rating') return Number(b.rating || 0) - Number(a.rating || 0);
          return Number(b.reviews || 0) - Number(a.reviews || 0);
        });
      const activeFilterCount = [
        resultPriceFilter !== 'Any',
        resultTransmissionFilter !== 'Any',
        resultFuelFilter !== 'Any',
        resultSeatsFilter !== 'Any',
      ].filter(Boolean).length;
      const resetResultFilters = () => {
        setResultPriceFilter('Any');
        setResultTransmissionFilter('Any');
        setResultFuelFilter('Any');
        setResultSeatsFilter('Any');
        setResultSort('Recommended');
        setResultDropdown(null);
      };

      return (
        <div className="min-h-screen max-w-lg mx-auto bg-white text-black font-sans relative overflow-x-hidden pb-28 shadow-2xl border-x border-slate-100">
          <header className="px-5 pt-5 pb-3">
            <div className="relative flex items-center justify-center">
              <button
                type="button"
                onClick={() => navigate('/taxi/user/rental', { state: location.state })}
                className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_8px_20px_rgba(15,23,42,0.11)]"
              >
                <ArrowLeft size={21} strokeWidth={2.4} />
              </button>
              <div className="text-center">
                <div className="text-[27px] font-black italic leading-none tracking-tight">
                  TAXI<span className="text-[#f5b700]">09</span>
                </div>
                <div className="mt-0.5 text-[12px] font-bold uppercase tracking-[0.14em] text-slate-500">Self Drive</div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/taxi/user/notifications')}
                className="absolute right-0 flex h-10 w-10 items-center justify-center text-black"
              >
                <Bell size={25} strokeWidth={2.1} />
                <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-[#f5b700]" />
              </button>
            </div>
          </header>

          <main className="px-3">
            <section className="grid grid-cols-[1fr_auto_1fr] items-center rounded-[14px] border border-slate-100 bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.07)]">
              <div className="flex items-start gap-2">
                <span className="mt-5 h-3 w-3 rounded-full bg-[#22c55e]" />
                <div>
                  <p className="text-[11px] font-medium text-slate-500">Pick-up</p>
                  <p className="line-clamp-2 text-[12px] font-black leading-tight">{selectedLocation}</p>
                </div>
              </div>
              <button className="mx-2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_6px_16px_rgba(15,23,42,0.12)]">
                <ArrowDownUp size={20} strokeWidth={2.5} />
              </button>
              <div className="flex items-start gap-2 border-l border-dashed border-slate-200 pl-3">
                <span className="mt-5 h-3 w-3 rounded-full bg-[#ff3347]" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-500">Drop-off</p>
                  <p className="line-clamp-2 text-[12px] font-black leading-tight">{selectedLocation}</p>
                </div>
              </div>
            </section>

            <section className="mt-4">
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                ['Filters', SlidersHorizontal, activeFilterCount ? `${activeFilterCount} On` : 'Filters'],
                ['Price', IndianRupee, resultPriceFilter],
                ['Transmission', SlidersHorizontal, resultTransmissionFilter],
                ['Fuel Type', Fuel, resultFuelFilter],
                ['Seats', ArrowDownUp, resultSeatsFilter],
              ].map(([label, Icon, value]) => {
                const options =
                  label === 'Price'
                    ? ['Any', 'Under ₹3000', '₹3000+']
                    : label === 'Transmission'
                      ? ['Any', 'Manual', 'Auto']
                      : label === 'Fuel Type'
                        ? ['Any', 'Petrol', 'Diesel']
                        : ['Any', '5 Seater', '6+ Seater'];
                const selectedValue =
                  label === 'Price'
                    ? resultPriceFilter
                    : label === 'Transmission'
                      ? resultTransmissionFilter
                      : label === 'Fuel Type'
                        ? resultFuelFilter
                        : resultSeatsFilter;

                return (
                  <div key={label} className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (label === 'Filters') {
                          resetResultFilters();
                          return;
                        }
                        setResultDropdown((current) => (current === label ? null : label));
                      }}
                      className={`flex h-9 items-center gap-2 rounded-[9px] border px-3 text-[13px] font-semibold shadow-sm ${
                        value !== 'Any' && value !== 'Filters'
                          ? 'border-[#f5b700] bg-[#fff7d6] text-black'
                          : 'border-slate-200 bg-white text-black'
                      }`}
                    >
                      <Icon size={17} strokeWidth={2.3} />
                      {value === 'Any' ? label : value}
                      {label !== 'Filters' && <ChevronDown size={15} />}
                    </button>

                    {resultDropdown === label && label !== 'Filters' && (
                      <div className="absolute left-0 top-11 z-40 w-44 overflow-hidden rounded-[12px] border border-slate-100 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.16)]">
                        {options.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              if (label === 'Price') setResultPriceFilter(option);
                              if (label === 'Transmission') setResultTransmissionFilter(option);
                              if (label === 'Fuel Type') setResultFuelFilter(option);
                              if (label === 'Seats') setResultSeatsFilter(option);
                              setResultDropdown(null);
                            }}
                            className="flex w-full items-center justify-between border-b border-slate-50 px-4 py-2.5 text-left text-[13px] font-semibold text-black last:border-b-0"
                          >
                            {option}
                            {selectedValue === option && <Check size={15} className="text-[#f5b700]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </section>

            <section className="mt-3 flex min-h-[78px] items-center overflow-hidden rounded-[13px] border border-amber-200 bg-gradient-to-r from-[#fff7dc] to-[#fff1b7] px-4 shadow-sm">
              <Shield size={46} className="shrink-0 text-[#f5b700]" strokeWidth={2.4} />
              <div className="ml-3 min-w-0 flex-1">
                <h2 className="text-[15px] font-black">Drive with Confidence</h2>
                <p className="mt-0.5 text-[11px] font-medium text-slate-700">Sanitized, insured & road-ready</p>
                <button className="mt-1 text-[11px] font-bold text-[#f5a800]">Learn More</button>
              </div>
              <img src={filteredListingCars[0]?.image || listingCars[0]?.image || rentalCarImg} alt="" className="h-16 w-24 object-contain mix-blend-multiply" />
            </section>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-slate-700">{filteredListingCars.length} Cars available</p>
              <button
                type="button"
                onClick={() => setResultDropdown((current) => (current === 'Sort' ? null : 'Sort'))}
                className="flex items-center gap-1 text-[12px] font-semibold text-slate-700"
              >
                Sort by: <span className="font-black text-[#f5b700]">{resultSort}</span>
                <ChevronDown size={16} />
              </button>
            </div>

            {resultDropdown === 'Sort' && (
              <div className="ml-auto mt-2 w-44 overflow-hidden rounded-[12px] border border-slate-100 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.16)]">
                {['Recommended', 'Price Low', 'Price High', 'Rating'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setResultSort(option);
                      setResultDropdown(null);
                    }}
                    className="flex w-full items-center justify-between border-b border-slate-50 px-4 py-2.5 text-left text-[13px] font-semibold text-black last:border-b-0"
                  >
                    {option}
                    {resultSort === option && <Check size={15} className="text-[#f5b700]" />}
                  </button>
                ))}
              </div>
            )}

            <section className="mt-3 space-y-3">
              {filteredListingCars.length === 0 ? (
                <div className="rounded-[14px] border border-slate-100 bg-white p-5 text-center shadow-[0_5px_18px_rgba(15,23,42,0.06)]">
                  <p className="text-[14px] font-black text-slate-900">No cars match these filters</p>
                  <button
                    type="button"
                    onClick={resetResultFilters}
                    className="mt-3 rounded-[9px] bg-[#f5b700] px-4 py-2 text-[12px] font-black text-black"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : filteredListingCars.map((car) => (
                <article
                  key={car.id}
                  className="rounded-[14px] border border-slate-100 bg-white p-3 shadow-[0_5px_18px_rgba(15,23,42,0.06)]"
                >
                  <div className="grid grid-cols-[30%_1fr_auto] gap-2.5">
                    <div className="relative pt-4">
                      {car.badge && (
                        <span className="absolute left-0 top-0 rounded-full bg-violet-100 px-2 py-1 text-[10px] font-black text-violet-700">
                          {car.badge}
                        </span>
                      )}
                      <img src={car.image} alt={`${car.brand} ${car.name}`} className="mt-4 h-20 w-full object-contain mix-blend-multiply" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-black">{car.brand} {car.name}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] font-semibold text-slate-800">
                        <span className="flex items-center gap-1"><Car size={13} />{car.body}</span>
                        <span>•</span>
                        <span>{car.capacity} Seater</span>
                        <span>•</span>
                        <span>{car.fuel}</span>
                        <span className="flex items-center gap-1"><SlidersHorizontal size={13} />{car.transmission}</span>
                        <span>A/C</span>
                        <span>Bluetooth</span>
                      </div>
                      <span className="mt-2 inline-flex rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-700">
                        Free Cancellation
                      </span>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <span className="flex items-center gap-1 text-[12px] font-semibold text-slate-700">
                        <Star size={14} fill="#f5b700" className="text-[#f5b700]" />
                        {car.rating} <span className="text-slate-500">({car.reviews})</span>
                      </span>
                      <div className="text-right">
                        <p className="text-[17px] font-black">₹{Number(car.price || 2199).toLocaleString('en-IN')}</p>
                        <p className="text-[10px] font-semibold">/ per day</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          openVehicleDetail(normalizeRentalVehicle({
                            id: car.id,
                            name: `${car.brand} ${car.name}`,
                            vehicleCategory: 'car',
                            coverImage: car.image,
                            fuel: car.fuel,
                            capacity: car.capacity,
                            pricing: [{ durationHours: 24, price: car.price, includedKm: 120, active: true }],
                          }));
                        }}
                        className="rounded-[8px] bg-[#f5b700] px-3 py-2 text-[11px] font-black text-black"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <section className="mt-4 flex items-center justify-between rounded-[12px] bg-gradient-to-r from-[#fff4cf] to-[#fff8e6] px-4 py-3">
              <div className="flex items-center gap-3">
                <Percent size={25} className="text-[#f5b700]" />
                <div>
                  <p className="text-[13px] font-black">Save more with long term rentals</p>
                  <p className="text-[11px] font-medium text-slate-600">Weekly & monthly plans available</p>
                </div>
              </div>
              <button className="flex items-center gap-1 text-[13px] font-black text-[#f5a800]">View Plans <ChevronRight size={16} /></button>
            </section>
          </main>

          <BottomNavbar />
        </div>
      );

      return (
        <div className="min-h-screen bg-background max-w-lg md:max-w-none md:mx-0 w-full mx-auto font-sans relative pb-24 flex flex-col justify-between overflow-x-hidden no-scrollbar">
          {/* Sticky Header block containing Header, Filters, Search input */}
          <div className="sticky top-0 z-30 bg-white shadow-sm flex flex-col shrink-0">
            {/* Header */}
            <div className="bg-background px-6 pt-10 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <button
                  onClick={() => navigate('/taxi/user/rental', { state: location.state })}
                  className="text-slate-800 hover:opacity-75 transition-opacity py-1 pr-1 shrink-0"
                >
                  <ChevronLeft size={24} strokeWidth={2} />
                </button>
                <div className="min-w-0" onClick={() => {
                  navigate('/taxi/user/rental', { state: location.state });
                  setLocationSearchText('');
                  setShowLocationSuggestions(true);
                }}>
                  <h1 className="text-[12px] font-bold text-slate-800 tracking-tight leading-tight flex items-center gap-1 cursor-pointer">
                    {selectedLocation}
                  </h1>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5 leading-none">
                    04 Jun <span className="text-slate-500 font-semibold">08:00 am Thu</span> — 05 Jun <span className="text-slate-500 font-semibold">09:00 pm Fri</span>
                  </p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <ChevronDown size={20} strokeWidth={2} />
              </button>
            </div>

            {/* Filters Row */}
            <div className="px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-slate-100 bg-white">
              <button className="bg-[#d48c00] hover:bg-[#c98500] shadow-sm transition-colors text-white flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] font-semibold shrink-0">
                <SlidersHorizontal size={14} strokeWidth={2} />
                Filter
              </button>

              <button className="bg-[#d48c00] hover:bg-[#c98500] shadow-sm transition-colors text-white p-1.5 rounded-lg shrink-0 flex items-center justify-center w-8.5 h-8.5">
                <ArrowDownUp size={14} strokeWidth={2} />
              </button>

              <button className="border border-slate-300 bg-white text-slate-600 px-3 py-1.5 rounded-full text-[13px] font-medium shrink-0">
                Delivery only
              </button>
              <button className="border border-slate-300 bg-white text-slate-600 px-3 py-1.5 rounded-full text-[13px] font-medium shrink-0">
                SUV
              </button>
              <button className="border border-slate-300 bg-white text-slate-600 px-3 py-1.5 rounded-full text-[13px] font-medium shrink-0">
                With...
              </button>
            </div>

            {/* Search filter input */}
            <div className="bg-white px-6 py-2 border-b border-slate-200">
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                  <Search size={16} strokeWidth={2} />
                </span>
                <input
                  type="text"
                  placeholder="Search by Car Model or Brand"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-[13px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-300 transition-colors shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Scrollable content list */}
          <div className="flex-1 overflow-y-auto bg-background pb-12 no-scrollbar">
            {/* Results Header */}
            <div className="flex items-center justify-between px-6 py-3.5 select-none bg-background">
              <h3 className="text-[17px] font-bold text-slate-700">
                {matchedCars.length} car{matchedCars.length === 1 ? '' : 's'} available
              </h3>
              <span className="text-[12px] font-medium text-slate-500">Duration: 1 Day, 13 Hrs</span>
            </div>

            {/* Cars List */}
            <div className="px-6 space-y-4">
              {matchedCars.length === 0 ? (
                <div className="rounded-[24px] border border-slate-100 bg-slate-200/50 p-6 text-center shadow-[0_4px_16px_rgba(15,23,42,0.02)]">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-slate-350/10 text-slate-400">
                    <Car size={22} />
                  </div>
                  <p className="mt-4 text-[15px] font-black text-slate-900">No cars available</p>
                  <p className="mt-1 text-[12px] font-semibold text-slate-400">Try another search query or adjust your filters.</p>
                </div>
              ) : (
                matchedCars.map((car) => (
                  <div
                    key={car.id}
                    onClick={() => {
                      openVehicleDetail(normalizeRentalVehicle({
                        id: car.id,
                        name: `${car.brand} ${car.name}`,
                        vehicleCategory: 'car',
                        coverImage: car.image,
                        fuel: car.fuel,
                        capacity: car.capacity,
                        pricing: [
                          { durationHours: 24, price: car.price, includedKm: 120, active: true }
                        ]
                      }));
                    }}
                    className="bg-white border border-slate-100 rounded-3xl p-4 shadow-[0_4px_16px_rgba(15,23,42,0.02)] flex flex-col gap-3 relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow group animate-fadeIn"
                  >
                    {/* Top row */}
                    <div className="flex justify-between items-start">
                      {/* Left: Image & Badge */}
                      <div className="w-[48%] flex flex-col items-center justify-center">
                        <img
                          src={car.image}
                          alt={car.name}
                          className="h-28 w-full object-contain mix-blend-multiply drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Right: metadata */}
                      <div className="flex-1 pl-4 flex flex-col justify-between min-h-[112px]">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none">{car.brand}</span>
                          <h4 className="text-[15.5px] font-bold text-slate-800 tracking-tight leading-tight mt-1">{car.name}</h4>

                          {/* Details list with icons */}
                          <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 mt-2">
                            <div className="flex items-center gap-0.5">
                              <Fuel size={11} className="text-slate-400" />
                              <span>{car.fuel.split(' ┬╖ ')[0]}</span>
                            </div>
                            <span>┬╖</span>
                            <div className="flex items-center gap-0.5">
                              <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M6 3v18M12 3v18M18 3v18M6 12h12" />
                              </svg>
                              <span>{car.fuel.split(' ┬╖ ')[1]}</span>
                            </div>
                            <span>┬╖</span>
                            <div className="flex items-center gap-0.5">
                              <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M7 10c0-1.1.9-2 2-2h6a2 2 0 0 1 2 2v10H7V10z" />
                                <path d="M5 21h14" />
                              </svg>
                              <span>{car.capacity} Seats</span>
                            </div>
                          </div>
                        </div>

                        {/* Price & arrow */}
                        <div className="mt-3 flex items-center justify-end text-slate-800 font-bold">
                          <span className="text-[18px] leading-none">₹{car.price.toLocaleString('en-IN')}</span>
                          <ChevronRight size={18} strokeWidth={2.5} className="ml-0.5 opacity-80" />
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-slate-100 w-full" />

                    {/* Bottom row */}
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 select-none py-0.5">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <div className="w-4.5 h-4.5 rounded-full border border-[#ffc400]/20 bg-[#fffbeb] text-[#d48c00] flex items-center justify-center shrink-0">
                          <Check size={10} strokeWidth={3} />
                        </div>
                        <span className="font-semibold text-slate-700">Home delivery</span>
                      </div>

                      <span className="text-[9.5px] font-bold text-slate-300">or</span>

                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span className="border border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded-md">
                          Pick from
                        </span>
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-[#d48c00] rotate-45" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z" />
                          </svg>
                          <span className="font-bold text-slate-700">{car.distance}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Floating headset button */}
          <div
            onClick={() => {
              navigate('/taxi/user/support');
              toast('Connecting to Support Chat...', { icon: '≡ƒÆ¼' });
            }}
            className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-[#d48c00] hover:bg-[#c98500] shadow-sm transition-colors flex items-center justify-center text-white shadow-xl z-50 cursor-pointer hover:bg-[#c98500] transition-colors"
          >
            <Headset size={22} strokeWidth={2.2} />
          </div>

          {/* Sticky Bottom Navbar */}
          <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 py-2.5 px-4 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] z-40 max-w-lg md:max-w-none md:mx-0 w-full mx-auto flex items-center justify-between">
            <button
              onClick={() => {
                navigate('/taxi/user/rental', { state: location.state });
                setActiveSegment('rentals');
              }}
              className="flex flex-col items-center gap-1 flex-1 py-1 text-[#d48c00]"
            >
              <div className="w-6 h-6 rounded-md flex items-center justify-center font-[900] text-[13px] border-2 border-[#d48c00] bg-[#ffc400]/5">
                R
              </div>
              <span className="text-[9.5px] font-bold tracking-wide uppercase">Rentals</span>
            </button>

            <button
              onClick={() => {
                navigate('/taxi/user/rental', { state: location.state });
                setActiveSegment('subscriptions');
              }}
              className="flex flex-col items-center gap-1 flex-1 py-1 relative text-slate-400 hover:text-slate-600"
            >
              <span className="absolute top-[-10px] bg-rose-500 text-[6.5px] font-black text-white px-1.5 py-0.5 rounded-[4px] uppercase tracking-wide border border-white">
                NEW
              </span>
              <div className="w-6 h-6 rounded-md flex items-center justify-center font-[900] text-[13px] border-2 border-slate-400">
                S
              </div>
              <span className="text-[9.5px] font-bold tracking-wide uppercase">Subscriptions</span>
            </button>

            <button
              onClick={() => navigate('/taxi/user/activity')}
              className="flex flex-col items-center gap-1 flex-1 py-1 text-slate-400 hover:text-slate-600"
            >
              <Calendar size={20} strokeWidth={2.4} />
              <span className="text-[9.5px] font-bold tracking-wide uppercase">Bookings</span>
            </button>

            <button
              onClick={() => navigate('/taxi/user/support')}
              className="flex flex-col items-center gap-1 flex-1 py-1 text-slate-400 hover:text-slate-600"
            >
              <MessageSquare size={20} strokeWidth={2.4} />
              <span className="text-[9.5px] font-bold tracking-wide uppercase">Support</span>
            </button>

            <button
              onClick={() => navigate('/taxi/user/profile')}
              className="flex flex-col items-center gap-1 flex-1 py-1 text-slate-400 hover:text-slate-600"
            >
              <User size={20} strokeWidth={2.4} />
              <span className="text-[9.5px] font-bold tracking-wide uppercase">More</span>
            </button>
          </div>
        </div>
      );
    }

    const rentalCategories = ['Hatchback', 'Sedan', 'SUV', 'Premium', 'Luxury'];
    const bookingLocation = locationSearchText || selectedLocation || 'Bhubaneswar';
    const formatDisplayTime = (value) => {
      const [hourValue, minute = '00'] = String(value || '00:00').split(':');
      const hour = Number(hourValue);
      const period = hour >= 12 ? 'PM' : 'AM';
      const normalizedHour = hour % 12 || 12;
      return `${String(normalizedHour).padStart(2, '0')}:${minute} ${period}`;
    };
    const submitSelfDriveSearch = () => {
      navigate(`/taxi/user/rental?search=true&location=${encodeURIComponent(bookingLocation)}`, {
        state: {
          ...location.state,
          preSelectedCategory: 'car',
          rentalSearch: {
            category: landingCategory,
            pickupLocation: bookingLocation,
            dropOffLocation: dropOffLocation.trim(),
            pickupDate,
            dropoffDate,
            pickupTime,
            dropoffTime,
            passengerCount,
            transmission,
            offerApplied,
          },
        },
      });
    };

    return (
      <div className="min-h-screen max-w-lg mx-auto bg-white text-black font-sans relative overflow-x-hidden pb-28 shadow-2xl border-x border-slate-100">
        <section className="relative h-[285px] overflow-hidden bg-slate-950">
          <img
            src="/taxi09_rental_hero_banner.png"
            alt="Taxi09 self drive banner"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
          <div className="absolute left-0 right-0 top-14 flex items-center justify-end px-7 text-white">
            <button
              type="button"
              onClick={() => navigate('/taxi/user/notifications')}
              className="relative flex h-12 w-12 items-center justify-center text-[#ffc400]"
              aria-label="Notifications"
            >
              <Bell size={36} strokeWidth={2.1} />
              <span className="absolute right-2 top-1 h-2.5 w-2.5 rounded-full bg-[#ffc400]" />
            </button>
          </div>
        </section>

        <section className="relative z-10 -mt-[78px] px-4">
          <div className="rounded-t-[28px] bg-white px-4 pb-5 pt-6 shadow-[0_-10px_34px_rgba(15,23,42,0.16)]">
            <h1 className="text-center text-[23px] font-black leading-[1.18] text-black">
              Book Your Self Drive Car
            </h1>

            <div className="mt-5 grid grid-cols-5 gap-2">
              {rentalCategories.map((category, index) => (
                <button
                  type="button"
                  key={category}
                  onClick={() => {
                    setLandingCategory(category);
                    setSubCategory(category === 'SUV' ? 'SUVs' : category === 'Sedan' ? 'Sedans' : 'Hatchbacks');
                  }}
                  className={`flex h-[58px] flex-col items-center justify-center rounded-[10px] border text-[11px] font-semibold shadow-[0_5px_14px_rgba(15,23,42,0.07)] ${
                    landingCategory === category
                      ? 'border-[#ffc400] bg-[#ffc400] text-black'
                      : 'border-slate-100 bg-white text-black'
                  }`}
                >
                  <Car size={22} strokeWidth={2.4} fill="currentColor" className="mb-1" />
                  {category}
                </button>
              ))}
            </div>

            <div className="relative mt-4 space-y-3">
              <button
                type="button"
                onClick={() => setShowLocationSuggestions(true)}
                className="flex min-h-[68px] w-full items-center gap-3 rounded-[14px] border border-slate-200 bg-white px-4 text-left shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
              >
                <span className="h-6 w-6 rounded-full bg-[#22c55e]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-medium text-slate-500">Pick-up Location</span>
                  <span className="block truncate text-[16px] font-semibold text-black">{bookingLocation}</span>
                </span>
                <ChevronDown size={21} className="text-slate-500" />
              </button>

              {showLocationSuggestions && (
                <div className="absolute left-0 right-0 top-[72px] z-30 overflow-hidden rounded-[14px] border border-slate-100 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.16)]">
                  {LOCATION_SUGGESTIONS.slice(0, 5).map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        setLocationSearchText(loc);
                        setShowLocationSuggestions(false);
                      }}
                      className="flex w-full items-center gap-2 border-b border-slate-50 px-4 py-2.5 text-left text-[13px] font-semibold text-slate-700 last:border-b-0"
                    >
                      <MapPin size={15} className="text-[#f5b700]" />
                      <span className="truncate">{loc}</span>
                    </button>
                  ))}
                </div>
              )}

              <label
                className="flex min-h-[68px] w-full items-center gap-3 rounded-[14px] border border-slate-200 bg-white px-4 text-left shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
              >
                <MapPin size={28} className="text-[#ff3b4f]" strokeWidth={2.4} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-medium text-slate-500">Drop-off Location</span>
                  <input
                    value={dropOffLocation}
                    onChange={(event) => setDropOffLocation(event.target.value)}
                    placeholder="Where to?"
                    className="block w-full bg-transparent text-[16px] font-semibold text-black outline-none placeholder:text-black"
                  />
                </span>
                <ChevronDown size={21} className="text-slate-500" />
              </label>

              <button
                type="button"
                className="absolute right-[-8px] top-[58px] flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white text-black shadow-[0_8px_24px_rgba(15,23,42,0.15)]"
                aria-label="Swap locations"
              >
                <ArrowDownUp size={25} strokeWidth={2.6} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { icon: Calendar, label: 'Pick-up Date', value: pickupDate, type: 'date', onChange: setPickupDate },
                { icon: Calendar, label: 'Drop-off Date', value: dropoffDate, type: 'date', onChange: setDropoffDate },
                { icon: Clock, label: 'Pick-up Time', value: formatDisplayTime(pickupTime), inputValue: pickupTime, type: 'time', onChange: setPickupTime },
                { icon: Clock, label: 'Drop-off Time', value: formatDisplayTime(dropoffTime), inputValue: dropoffTime, type: 'time', onChange: setDropoffTime },
              ].map(({ icon: Icon, label, value, inputValue, type, onChange }) => (
                <label
                  key={label}
                  className="relative flex min-h-[64px] items-center gap-2.5 rounded-[12px] border border-slate-200 bg-white px-3 text-left shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
                >
                  <Icon size={23} className="text-black" strokeWidth={2.5} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-medium text-slate-500">{label}</span>
                    <span className="block truncate text-[14px] font-semibold text-black">{value}</span>
                  </span>
                  <ChevronDown size={18} className="text-slate-500" />
                  <input
                    type={type}
                    value={inputValue || value}
                    onChange={(event) => onChange(event.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </label>
              ))}
            </div>

            <div className="relative mt-4 grid grid-cols-3 gap-3">
              {[
                {
                  icon: Users,
                  value: `${passengerCount} Passenger${passengerCount > 1 ? 's' : ''}`,
                  keyName: 'passengers',
                },
                {
                  icon: SlidersHorizontal,
                  value: transmission,
                  keyName: 'transmission',
                },
                {
                  icon: Percent,
                  value: offerApplied ? 'Offer On' : 'Offers',
                  keyName: 'offers',
                },
              ].map(({ icon: Icon, value, keyName }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setLandingDropdown((current) => (current === keyName ? null : keyName))}
                  className="flex min-h-[52px] items-center gap-2 rounded-[12px] border border-slate-200 bg-white px-2.5 text-left shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
                >
                  <Icon size={20} className="shrink-0 text-black" strokeWidth={2.7} />
                  <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-black">{value}</span>
                  <ChevronDown size={17} className="shrink-0 text-slate-500" />
                </button>
              ))}

              {landingDropdown && (
                <div
                  className={`absolute top-[58px] z-40 overflow-hidden rounded-[12px] border border-slate-100 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.16)] ${
                    landingDropdown === 'passengers'
                      ? 'left-0 w-[32%]'
                      : landingDropdown === 'transmission'
                        ? 'left-1/2 w-[32%] -translate-x-1/2'
                        : 'right-0 w-[32%]'
                  }`}
                >
                  {landingDropdown === 'passengers' &&
                    [1, 2, 3, 4, 5, 6].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => {
                          setPassengerCount(count);
                          setLandingDropdown(null);
                        }}
                        className="w-full border-b border-slate-50 px-3 py-2 text-left text-[12px] font-semibold text-black last:border-b-0"
                      >
                        {count} Passenger{count > 1 ? 's' : ''}
                      </button>
                    ))}

                  {landingDropdown === 'transmission' &&
                    ['Manual', 'Auto'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setTransmission(option);
                          setLandingDropdown(null);
                        }}
                        className="w-full border-b border-slate-50 px-3 py-2 text-left text-[12px] font-semibold text-black last:border-b-0"
                      >
                        {option}
                      </button>
                    ))}

                  {landingDropdown === 'offers' &&
                    [
                      { label: 'No Offer', value: false },
                      { label: 'Apply Offer', value: true },
                    ].map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => {
                          setOfferApplied(option.value);
                          setLandingDropdown(null);
                          toast(option.value ? 'Offer applied' : 'Offer removed');
                        }}
                        className="w-full border-b border-slate-50 px-3 py-2 text-left text-[12px] font-semibold text-black last:border-b-0"
                      >
                        {option.label}
                      </button>
                    ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={submitSelfDriveSearch}
              className="mt-5 h-[58px] w-full rounded-[13px] bg-[#ffc400] text-[21px] font-black text-black shadow-[0_8px_20px_rgba(255,196,0,0.3)] active:scale-[0.99]"
            >
              Find Self Drive Cars
            </button>

            <div className="mt-6 grid grid-cols-4 divide-x divide-slate-200 rounded-[14px] bg-slate-50 px-1 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              {[
                { icon: Shield, label: 'Safe & Secure\nBookings' },
                { icon: User, label: 'Verified\nCars' },
                { icon: Headset, label: '24x7\nSupport' },
                { icon: IndianRupee, label: 'Affordable\nPrices' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center justify-center gap-2 px-2 text-center">
                  <Icon size={25} className="text-black" strokeWidth={2.1} />
                  <span className="whitespace-pre-line text-[11px] font-medium leading-tight text-black">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <BottomNavbar />
      </div>
    );

    // 1. Render Taxi09 Dashboard View (Teal header, featured list)
    return (
      <div className="premium-theme min-h-screen bg-background text-on-background font-body-md max-w-lg md:max-w-none md:mx-0 w-full mx-auto relative pb-24 shadow-xl border-x border-surface-variant flex flex-col justify-between overflow-x-hidden no-scrollbar">
        {/* Teal Header Block */}
        <div className="bg-gradient-to-b from-[#fffbeb] to-[#fef3c7] shadow-[0_10px_30px_rgba(251,191,36,0.08)] border-b border-amber-200/40 text-slate-900 px-5 pt-12 pb-6 rounded-b-[40px] relative shrink-0 z-20">
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-[#ffc400]/5 blur-[40px] pointer-events-none" />

          {/* Row 1: Back Arrow & Logo */}
          <div className="relative flex items-center justify-between mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/taxi/user/rental/type')}
              className="w-10 h-10 rounded-2xl bg-white border border-amber-200/60 flex items-center justify-center text-slate-800 transition-all shrink-0 cursor-pointer shadow-sm"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </motion.button>
            <div className="flex flex-col items-center select-none text-center">
              <span className="text-[26px] font-[900] tracking-tight leading-none text-slate-950 italic">Taxi<span className="text-[#d48c00]">09</span></span>
              <span className="text-[8px] font-extrabold text-slate-500 tracking-widest uppercase mt-1">Premium Self-Drive</span>
            </div>
            <div className="w-10 h-10" />
          </div>

          {/* Row 2: Segment Selector Tabs */}
          <div className="bg-amber-100/70 border border-amber-200/40 shadow-inner mb-6 relative p-1.5 rounded-2xl flex">
            <button
              onClick={() => setActiveSegment('rentals')}
              className={`relative flex-1 py-2.5 rounded-[14px] text-[12px] font-extrabold uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center outline-none ${activeSegment === 'rentals' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:bg-white/40'
                }`}
            >
              <span className="text-[13px] font-black">Rentals</span>
              <span className={`text-[8px] font-bold mt-0.5 ${activeSegment === 'rentals' ? 'text-slate-500' : 'text-slate-400'}`}>For hours & days</span>
              {activeSegment === 'rentals' && (
                <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white" />
              )}
            </button>
            <button
              onClick={() => setActiveSegment('subscriptions')}
              className={`relative flex-1 py-2.5 rounded-[14px] text-[12px] font-extrabold uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center outline-none ${activeSegment === 'subscriptions' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:bg-white/40'
                }`}
            >
              <span className="text-[13px] font-black">Subscriptions</span>
              <span className={`text-[8px] font-bold mt-0.5 ${activeSegment === 'subscriptions' ? 'text-slate-500' : 'text-slate-400'}`}>For months & years</span>
              {activeSegment === 'subscriptions' && (
                <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white" />
              )}
            </button>
          </div>

          {/* Row 3: Horizontal Pills Grid */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
            {activeSegment === 'rentals' ? (
              <>
                <motion.div whileHover={{ scale: 1.03 }} className="border border-amber-200/50 bg-white/65 text-[11px] font-bold text-slate-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 select-none cursor-default transition-colors hover:bg-white/85 shadow-sm">
                  <Star size={12} className="fill-amber-600 text-amber-600" /> Brand New Cars
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} className="border border-amber-200/50 bg-white/65 text-[11px] font-bold text-slate-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 select-none cursor-default transition-colors hover:bg-white/85 shadow-sm">
                  <Info size={12} className="text-amber-600" /> 24*7 Support
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} className="border border-amber-200/50 bg-white/65 text-[11px] font-bold text-slate-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 select-none cursor-default transition-colors hover:bg-white/85 shadow-sm">
                  <Truck size={12} className="text-amber-600" /> Home Delivery
                </motion.div>
              </>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.03 }} className="border border-amber-200/50 bg-white/65 text-[11px] font-bold text-slate-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 select-none cursor-default transition-colors hover:bg-white/85 shadow-sm">
                  <Compass size={12} className="text-amber-600" /> Flexible tenure
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} className="border border-amber-200/50 bg-white/65 text-[11px] font-bold text-slate-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 select-none cursor-default transition-colors hover:bg-white/85 shadow-sm">
                  <Star size={12} className="fill-amber-600 text-amber-600" /> Brand new cars
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} className="border border-amber-200/50 bg-white/65 text-[11px] font-bold text-slate-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 select-none cursor-default transition-colors hover:bg-white/85 shadow-sm">
                  <Shield size={12} className="text-amber-600" /> Extended warranty
                </motion.div>
              </>
            )}
          </div>

          {/* Row 4: Company Fleet Claim Badge */}
          <div className="flex items-center gap-2 mb-5 select-none justify-center bg-amber-100/50 border border-amber-200/40 py-1.5 px-4 rounded-full w-fit mx-auto shadow-sm">
            <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center text-slate-900 shadow-sm shrink-0">
              <Check size={10} strokeWidth={3} />
            </div>
            <span className="text-[11px] font-extrabold text-slate-700 tracking-wide">Largest company-owned fleet in India</span>
          </div>

          {/* Row 5: Search Bar */}
          <div className="relative z-20">
            {/* Backdrop overlay to close suggestions when clicking outside */}
            {showLocationSuggestions && (
              <div
                className="fixed inset-0 z-10 bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLocationSuggestions(false);
                }}
              />
            )}

            <div
              className="bg-white rounded-3xl p-2 shadow-[0_12px_40px_rgba(212,140,0,0.15)] flex items-center gap-3 border border-slate-100/80 relative z-20 hover:shadow-[0_16px_48px_rgba(212,140,0,0.22)] focus-within:shadow-[0_16px_48px_rgba(212,140,0,0.22)] transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ffc400] to-[#ffd54f] text-[#332000] flex items-center justify-center text-white shrink-0 shadow-md">
                <MapPin size={16} strokeWidth={2.5} />
              </div>
              <input
                type="text"
                placeholder={activeSegment === 'rentals' ? "City, address, airport or hotel" : "Select city to search"}
                value={locationSearchText}
                onChange={(e) => {
                  setLocationSearchText(e.target.value);
                  setShowLocationSuggestions(true);
                }}
                onFocus={() => setShowLocationSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && locationSearchText.trim()) {
                    setShowLocationSuggestions(false);
                    navigate(`/taxi/user/rental?search=true&location=${encodeURIComponent(locationSearchText)}`, { state: location.state });
                  }
                }}
                className="flex-1 text-[13.5px] font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
              />
              {locationSearchText && (
                <button
                  onClick={() => {
                    setLocationSearchText('');
                    setShowLocationSuggestions(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 px-1 shrink-0"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              )}
              <div className="w-7 h-7 flex items-center justify-center shrink-0 pr-1 text-[#d48c00]">
                <ChevronRight size={22} strokeWidth={3} />
              </div>
            </div>

            {/* Location Suggestions Dropdown */}
            {showLocationSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl z-30 max-h-60 overflow-y-auto no-scrollbar py-2">
                {LOCATION_SUGGESTIONS
                  .filter(loc => !locationSearchText || loc.toLowerCase().includes(locationSearchText.toLowerCase()))
                  .map((loc, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setLocationSearchText(loc);
                        setShowLocationSuggestions(false);
                        navigate(`/taxi/user/rental?search=true&location=${encodeURIComponent(loc)}`, { state: location.state });
                      }}
                      className="px-4 py-3 hover:bg-slate-50 flex items-center gap-3 cursor-pointer transition-colors border-b border-slate-50 last:border-b-0"
                    >
                      <MapPin size={14} className="text-[#d48c00] shrink-0" />
                      <span className="text-[13px] font-semibold text-slate-700">{loc}</span>
                    </div>
                  ))}
                {LOCATION_SUGGESTIONS.filter(loc => !locationSearchText || loc.toLowerCase().includes(locationSearchText.toLowerCase())).length === 0 && (
                  <div
                    onClick={() => {
                      if (locationSearchText.trim()) {
                        setShowLocationSuggestions(false);
                        navigate(`/taxi/user/rental?search=true&location=${encodeURIComponent(locationSearchText)}`, { state: location.state });
                      }
                    }}
                    className="px-4 py-3 hover:bg-slate-50 flex items-center gap-3 cursor-pointer text-slate-500 font-semibold text-[13px] border-t border-slate-50"
                  >
                    <Search size={14} className="text-[#d48c00] shrink-0" />
                    <span>Search "{locationSearchText}"</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 pt-6 pb-12 space-y-7 no-scrollbar">
          {activeSegment === 'rentals' ? (
            <>
              {/* Rentals - Featured Section */}
              {bannersLoading ? (
                <div className="space-y-3.5">
                  <h3 className="text-[20px] font-black text-slate-400 tracking-tight select-none">Featured</h3>
                  <div className="w-full h-[130px] rounded-3xl overflow-hidden bg-slate-200 animate-pulse" />
                </div>
              ) : (
                banners.length > 0 && (
                  <div className="space-y-3.5">
                    <h3 className="text-[20px] font-black text-slate-400 tracking-tight select-none">Featured</h3>

                    <div className="relative w-full h-[130px] rounded-3xl overflow-hidden shadow-sm">
                      <AnimatePresence>
                        <motion.div
                          key={`banner-${banners[currentBannerIndex].id || banners[currentBannerIndex]._id || currentBannerIndex}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          onClick={() => {
                            const banner = banners[currentBannerIndex];
                            if (banner.redirect_url) {
                              window.open(banner.redirect_url, '_blank');
                            } else {
                              toast('Promotion loaded', { icon: '✨' });
                            }
                          }}
                          className="absolute inset-0 w-full h-full bg-slate-100 cursor-pointer"
                        >
                          <img
                            src={resolveImageUrl(banners[currentBannerIndex].image)}
                            alt={banners[currentBannerIndex].title || "Featured banner"}
                            className="h-full w-full object-cover"
                          />
                        </motion.div>
                      </AnimatePresence>

                      {/* Indicators */}
                      {banners.length > 1 && (
                        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                          {banners.map((_, i) => (
                            <div
                              key={i}
                              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentBannerIndex ? 'w-4 bg-[#d48c00] shadow-sm' : 'w-1.5 bg-slate-400/50'}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}

              {/* Rentals - Top Selling Section */}
              {displayedCars.length > 0 && (
                <div className="space-y-3.5 pb-4">
                  <h3 className="text-[20px] font-black text-slate-400 tracking-tight select-none">Top selling cars in India</h3>

                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    {displayedCars.map((car) => (
                      <motion.div
                        key={car.id}
                        whileHover={{ y: -6, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (car.rawVehicle) {
                            openVehicleDetail(
                              car.rawVehicle,
                              activeSegment === 'subscriptions'
                                ? {
                                  detailMode: 'subscription',
                                  selectedSubscriptionPlanId: car.subscriptionPlan?.id || '',
                                }
                                : {},
                            );
                          } else {
                            openVehicleDetail(
                              normalizeRentalVehicle({
                                id: car.id,
                                name: `${car.brand} ${car.name}`,
                                vehicleCategory: 'car',
                                coverImage: car.image,
                                pricing: [
                                  { durationHours: 24, price: car.prices.Daily, includedKm: 120, active: true }
                                ]
                              }),
                              activeSegment === 'subscriptions' ? { detailMode: 'subscription' } : {},
                            );
                          }
                        }}
                        className="w-[295px] h-[160px] bg-white border border-slate-100/80 rounded-3xl p-4 shadow-[0_8px_30px_rgba(15,23,42,0.02)] flex items-center justify-between shrink-0 relative overflow-hidden cursor-pointer hover:shadow-[0_12px_36px_rgba(15,23,42,0.06)] hover:border-slate-200/50 transition-all duration-300 group"
                      >
                        <div className="flex flex-col justify-between h-full max-w-[60%]">
                          <div className="space-y-0.5">
                            <p className="text-[11.5px] font-bold text-slate-400 leading-none">
                              {car.name} <span className="opacity-70 font-medium">{car.year || '2024-25'}</span>
                            </p>
                            <h4 className="text-[18px] font-black text-slate-900 tracking-tight">{car.brand}</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {car.features.map((feature, i) => (
                                <span key={i} className="text-[8.5px] font-bold bg-slate-50 border border-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="mt-2 leading-none">
                            <div className="flex items-baseline gap-0.5">
                              <span className="text-[18px] font-black text-slate-900">₹{car.prices.Daily}</span>
                              <span className="text-[10px] font-bold text-slate-400 ml-0.5">per day</span>
                            </div>
                          </div>
                        </div>

                        <div className="w-[42%] h-full flex items-center justify-center relative shrink-0">
                          <motion.img
                            src={car.image}
                            alt={car.name}
                            className="w-full object-contain mix-blend-multiply relative z-10 transition-transform duration-300 group-hover:scale-108 drop-shadow-md"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Offers Section */}
              <div className="space-y-3 px-1 select-none">
                <h3 className="text-[19px] font-bold text-slate-700 tracking-tight">Offers</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {/* Offer 1 */}
                  <motion.div
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-[280px] rounded-3xl bg-white border border-slate-100/80 shadow-[0_8px_30px_rgba(15,23,42,0.02)] hover:shadow-[0_12px_36px_rgba(15,23,42,0.05)] transition-all duration-300 flex flex-col justify-between overflow-hidden shrink-0 cursor-pointer"
                  >
                    <div className="p-4 flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-[14px] font-bold text-slate-800">Short Trip Offer</h4>
                        <span className="text-[13px] font-bold text-[#d48c00]">5% OFF</span>
                      </div>
                      <p className="text-[11.5px] text-slate-400 mt-1.5 leading-normal font-medium">
                        Use code STMB5 and get 5% off upto ₹500
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-[#ffc400] to-[#d48c00] px-4 py-3 flex items-center justify-between relative overflow-hidden border-t border-dashed border-slate-100/20">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#ffc400]/30 via-transparent to-transparent pointer-events-none" />
                      <span className="bg-white text-slate-700 text-[11px] font-bold px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                        STMB5
                      </span>
                      <span className="text-[10px] text-[#332000]/80 font-black cursor-pointer hover:underline">• T&C</span>
                    </div>
                  </motion.div>

                  {/* Offer 2 */}
                  <motion.div
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-[280px] rounded-3xl bg-white border border-slate-100/80 shadow-[0_8px_30px_rgba(15,23,42,0.02)] hover:shadow-[0_12px_36px_rgba(15,23,42,0.05)] transition-all duration-300 flex flex-col justify-between overflow-hidden shrink-0 cursor-pointer"
                  >
                    <div className="p-4 flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-[14px] font-bold text-slate-800">Weekend Special</h4>
                        <span className="text-[13px] font-bold text-[#d48c00]">10% OFF</span>
                      </div>
                      <p className="text-[11.5px] text-slate-400 mt-1.5 leading-normal font-medium">
                        Get 10% off up to ₹1,000 on weekend bookings
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-[#ffc400] to-[#d48c00] px-4 py-3 flex items-center justify-between relative overflow-hidden border-t border-dashed border-slate-100/20">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#ffc400]/30 via-transparent to-transparent pointer-events-none" />
                      <span className="bg-white text-slate-700 text-[11px] font-bold px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                        WKND10
                      </span>
                      <span className="text-[10px] text-[#332000]/80 font-black cursor-pointer hover:underline">• T&C</span>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Why Taxi09? Section */}
              <div className="space-y-3 px-1 select-none">
                <h3 className="text-[19px] font-bold text-slate-700 tracking-tight">Why Taxi09?</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {/* Card 1 */}
                  <motion.div
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-[280px] rounded-3xl bg-white border border-slate-100/80 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.02)] hover:shadow-[0_12px_36px_rgba(15,23,42,0.05)] transition-all duration-300 flex gap-3.5 shrink-0 cursor-default"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#ffd54f]/10 text-[#d48c00] flex items-center justify-center shrink-0">
                      <Home size={22} className="stroke-[#d48c00]" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-[13.5px] font-bold text-slate-800">Home delivery & return</h4>
                      <p className="text-[11px] text-slate-400 leading-normal font-medium">
                        On-time doorstep service, at your preferred location and time
                      </p>
                    </div>
                  </motion.div>

                  {/* Card 2 */}
                  <motion.div
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-[280px] rounded-3xl bg-white border border-slate-100/80 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.02)] hover:shadow-[0_12px_36px_rgba(15,23,42,0.05)] transition-all duration-300 flex gap-3.5 shrink-0 cursor-default"
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Shield size={22} className="stroke-amber-600" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-[13.5px] font-bold text-slate-800">Safe & sanitized</h4>
                      <p className="text-[11px] text-slate-400 leading-normal font-medium">
                        Deep cleaned and sanitized vehicles before every single ride
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* FAQs Section */}
              <div className="space-y-3 px-1 select-none">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-[19px] font-bold text-slate-700 tracking-tight">FAQs</h3>
                  <span className="text-[13px] font-bold text-[#d48c00] cursor-pointer hover:underline">View all</span>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_4px_16px_rgba(15,23,42,0.02)] divide-y divide-slate-100">
                  {/* FAQ 1 */}
                  <div className="pb-3 pt-0.5">
                    <button
                      onClick={() => setActiveFaqIndex(activeFaqIndex === 0 ? null : 0)}
                      className="w-full flex justify-between items-center text-left text-[13.5px] font-bold text-slate-800 outline-none"
                    >
                      <span>Is there a speed limit?</span>
                      <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${activeFaqIndex === 0 ? 'rotate-180 text-[#d48c00]' : ''}`} />
                    </button>
                    {activeFaqIndex === 0 && (
                      <p className="text-[12px] text-slate-500 mt-2 leading-relaxed animate-fadeIn">
                        Taxi09 allows up to 125 km/hr. However, it is always recommended to adhere to local speed limits as specified by road authorities.
                      </p>
                    )}
                  </div>

                  {/* FAQ 2 */}
                  <div className="py-3">
                    <button
                      onClick={() => setActiveFaqIndex(activeFaqIndex === 1 ? null : 1)}
                      className="w-full flex justify-between items-center text-left text-[13.5px] font-bold text-slate-800 outline-none"
                    >
                      <span>Can I extend/cancel/modify?</span>
                      <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${activeFaqIndex === 1 ? 'rotate-180' : ''}`} />
                    </button>
                    {activeFaqIndex === 1 && (
                      <p className="text-[12px] text-slate-500 mt-2 leading-relaxed animate-fadeIn">
                        Yes, extensions are possible subject to vehicle availability. Cancellation charges may apply depending on how close you are to the booking start time.
                      </p>
                    )}
                  </div>

                  {/* FAQ 3 */}
                  <div className="pt-3 pb-0.5">
                    <button
                      onClick={() => setActiveFaqIndex(activeFaqIndex === 2 ? null : 2)}
                      className="w-full flex justify-between items-center text-left text-[13.5px] font-bold text-slate-800 outline-none"
                    >
                      <span>Booking criteria & documents?</span>
                      <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${activeFaqIndex === 2 ? 'rotate-180' : ''}`} />
                    </button>
                    {activeFaqIndex === 2 && (
                      <p className="text-[12px] text-slate-500 mt-2 leading-relaxed animate-fadeIn">
                        To book a car, you need to be at least 21 years old and possess a valid driving license, Aadhaar card, or Passport.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Subscriptions - Banners */}
              <div className="space-y-3.5">
                <h3 className="text-[20px] font-black text-slate-400 tracking-tight select-none">Why subscriptions</h3>

                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
                  <div className="w-[240px] h-[130px] rounded-3xl bg-[#d48c00] shadow-sm shrink-0 border border-slate-800 relative overflow-hidden group cursor-pointer flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-600/30 to-slate-900/60 z-0" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-60 z-0">
                      <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white">
                        <Car size={32} />
                      </div>
                    </div>
                    <div className="relative z-10 w-12 h-12 rounded-full bg-white/95 shadow-md flex items-center justify-center text-[#d48c00] group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  <div className="w-[220px] h-[130px] rounded-3xl bg-gradient-to-br from-amber-50 to-amber-50/50 p-4 flex items-center gap-3 shadow-sm shrink-0 border border-amber-100/50 select-none">
                    <div className="w-14 h-14 rounded-full bg-amber-100/60 flex items-center justify-center text-amber-800 font-extrabold text-[22px] tracking-tighter shrink-0 shadow-inner">
                      ₹0
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[13.5px] font-black text-slate-900 block leading-tight">No down</span>
                      <span className="text-[13.5px] font-black text-slate-900 block leading-tight">payment</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscriptions - Tabs Grid Category */}
              <div className="space-y-4">
                <div className="flex gap-6 border-b border-slate-100 pb-1.5">
                  {['Hatchbacks', 'Sedans', 'SUVs'].map((cat) => {
                    const isActive = subCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSubCategory(cat)}
                        className={`relative pb-2 text-[15px] font-black transition-colors ${isActive ? 'text-[#d48c00]' : 'text-slate-400 hover:text-slate-600'
                          }`}
                      >
                        {cat}
                        {isActive && (
                          <motion.div
                            layoutId="subCategoryBorder"
                            className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#d48c00] hover:bg-[#c98500] shadow-sm transition-colors rounded-full"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Subscriptions - Cars Grid */}
                <div className="grid grid-cols-2 gap-3.5">
                  {displayedCars.length === 0 ? (
                    <div className="col-span-2 rounded-3xl border border-slate-100 bg-white p-5 text-center shadow-[0_6px_20px_rgba(15,23,42,0.03)]">
                      <p className="text-[14px] font-black text-slate-800">No subscription vehicles live yet</p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-400">
                        This section will show vehicles once subscription mode is enabled in admin.
                      </p>
                    </div>
                  ) : displayedCars.map((car) => (
                    <motion.div
                      key={car.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        openVehicleDetail(car.rawVehicle, {
                          detailMode: 'subscription',
                          selectedSubscriptionPlanId: car.subscriptionPlan?.id || car.subscriptionPlan?._id || '',
                        });
                      }}
                      className="bg-white border border-slate-100 rounded-3xl p-3.5 shadow-[0_6px_20px_rgba(15,23,42,0.03)] flex flex-col justify-between h-[180px] cursor-pointer hover:shadow-md transition-shadow group relative overflow-hidden"
                    >
                      <div className="w-full h-[85px] flex items-center justify-center relative overflow-hidden bg-slate-50/30 rounded-2xl p-2 shrink-0">
                        <motion.img
                          src={car.image}
                          alt={car.name}
                          className="h-full object-contain mix-blend-multiply relative z-10 transition-transform duration-300 group-hover:scale-108"
                        />
                      </div>

                      <div className="space-y-0.5 mt-2 flex-1 flex flex-col justify-end">
                        <h4 className="text-[13px] font-black text-slate-800 leading-tight truncate">
                          {car.brand} {car.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 mt-1">
                          <span>{car.fuel?.split(' ┬╖ ')[0] || 'Petrol'}</span>
                          <span>┬╖</span>
                          <span>{car.fuel?.split(' ┬╖ ')[1] || 'Manual'}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Stick Bottom Navigation Menu */}
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 py-2.5 px-4 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] z-40 max-w-lg md:max-w-none md:mx-0 w-full mx-auto flex items-center justify-between">
          <button
            onClick={() => setActiveSegment('rentals')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 ${activeSegment === 'rentals' ? 'text-[#d48c00]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className={`w-6 h-6 rounded-md flex items-center justify-center font-[900] text-[13px] border-2 ${activeSegment === 'rentals' ? 'border-[#d48c00] bg-[#ffc400]/5' : 'border-slate-400'}`}>
              R
            </div>
            <span className="text-[9.5px] font-bold tracking-wide uppercase">Rentals</span>
          </button>

          <button
            onClick={() => setActiveSegment('subscriptions')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 relative ${activeSegment === 'subscriptions' ? 'text-[#d48c00]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span className="absolute top-[-10px] bg-rose-500 text-[6.5px] font-black text-white px-1.5 py-0.5 rounded-[4px] uppercase tracking-wide border border-white">
              NEW
            </span>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center font-[900] text-[13px] border-2 ${activeSegment === 'subscriptions' ? 'border-[#d48c00] bg-[#ffc400]/5' : 'border-slate-400'}`}>
              S
            </div>
            <span className="text-[9.5px] font-bold tracking-wide uppercase">Subscriptions</span>
          </button>

          <button
            onClick={() => navigate('/taxi/user/activity')}
            className="flex flex-col items-center gap-1 flex-1 py-1 text-slate-400 hover:text-slate-600"
          >
            <Calendar size={20} strokeWidth={2.4} />
            <span className="text-[9.5px] font-bold tracking-wide uppercase">Bookings</span>
          </button>

          <button
            onClick={() => navigate('/taxi/user/support')}
            className="flex flex-col items-center gap-1 flex-1 py-1 text-slate-400 hover:text-slate-600"
          >
            <MessageSquare size={20} strokeWidth={2.4} />
            <span className="text-[9.5px] font-bold tracking-wide uppercase">Support</span>
          </button>

          <button
            onClick={() => navigate('/taxi/user/profile')}
            className="flex flex-col items-center gap-1 flex-1 py-1 text-slate-400 hover:text-slate-600"
          >
            <User size={20} strokeWidth={2.4} />
            <span className="text-[9.5px] font-bold tracking-wide uppercase">More</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#F3F4F6_38%,#EEF2F7_100%)] max-w-lg md:max-w-none md:mx-0 w-full mx-auto font-sans relative overflow-hidden pb-12">
      <div className="absolute -top-16 right-[-40px] h-44 w-44 rounded-full bg-amber-100/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-28 right-[-40px] h-40 w-40 rounded-full bg-amber-100/30 blur-3xl pointer-events-none" />

      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-30 w-full"
      >
        <div className="bg-white/85 backdrop-blur-2xl px-6 pt-12 pb-5 border-b border-white/40 shadow-[0_8px_32px_rgba(15,23,42,0.06)] relative overflow-hidden">
          {/* Subtle accent gradients */}
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-amber-400/5 blur-[40px] pointer-events-none" />
          <div className="absolute top-0 left-0 h-24 w-24 rounded-full bg-amber-400/3 blur-[40px] pointer-events-none" />

          <div className="relative flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-[0_4px_12px_rgba(15,23,42,0.15)] shrink-0 group transition-all"
              >
                <ArrowLeft size={20} className="text-white group-hover:opacity-80 transition-opacity" strokeWidth={2.5} />
              </motion.button>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500/60 leading-none mb-1.5">Self-drive rentals</p>
                <h1 className="text-[24px] font-[900] tracking-tight text-on-surface leading-none">Choose Ride</h1>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="px-3 py-1 rounded-full bg-slate-900 text-[10px] font-bold text-white shadow-sm uppercase tracking-wider">
                {availableCountLabel}
              </span>
            </div>
          </div>

          <div className="relative mb-5">
            <div className="flex gap-1.5 bg-slate-100/60 p-1.5 rounded-[20px] border border-slate-200/40 shadow-inner">
              {DURATION_TABS.map((tab) => {
                const isActive = selectedDuration === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedDuration(tab)}
                    className="relative flex-1 py-2.5 rounded-[14px] text-[11px] font-[800] uppercase tracking-wider transition-all duration-300 outline-none"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white rounded-[14px] shadow-[0_4px_12px_rgba(15,23,42,0.08)] border border-slate-100"
                        transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                      />
                    )}
                    <span className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-on-surface' : 'text-slate-400'}`}>
                      {tab}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400 group-focus-within:text-slate-900 transition-colors" strokeWidth={2.5} />
            </div>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by vehicle, category or brand..."
              className="w-full bg-slate-100/50 border border-slate-200/60 focus:border-slate-900/10 focus:bg-white rounded-[20px] pl-11 pr-11 py-3.5 text-[14px] font-bold text-on-surface placeholder:text-slate-400/80 focus:outline-none focus:shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-3 flex items-center pr-1"
              >
                <div className="h-7 w-7 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors">
                  <X size={14} strokeWidth={3} />
                </div>
              </button>
            )}
          </div>

          {visibleSuggestions.length > 0 && !searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 overflow-x-auto no-scrollbar pt-4 pb-1"
            >
              {visibleSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setSearchQuery(suggestion)}
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-sm hover:border-slate-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </motion.header>

      <div className="px-6 pt-6 space-y-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDuration}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex items-center gap-3 rounded-[20px] border border-white/80 bg-white/60 backdrop-blur-md px-4 py-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 shadow-sm">
              <Info size={16} className="text-amber-600" strokeWidth={2.5} />
            </div>
            <p className="text-[13px] font-[700] text-slate-700 tracking-tight leading-tight">
              {infoBanner[selectedDuration]}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="relative pt-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-[800] uppercase tracking-[0.2em] text-slate-400">Available Near You</p>
            {searchQuery && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-[800] uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md"
              >
                {filteredCountLabel}
              </motion.span>
            )}
          </div>
          <h2 className="text-[20px] font-[900] tracking-tight text-slate-900">Explore Fleet</h2>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORY_FILTERS.map(({ id, label, Icon }) => {
              const isActive = selectedCategoryFilter === id;
              const count = categoryCounts[id] || 0;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(id)}
                  className={`shrink-0 rounded-[18px] border px-3.5 py-2.5 transition-all ${isActive
                    ? 'border-[#d48c00] bg-[#d48c00] text-white shadow-[0_10px_24px_rgba(212,140,0,0.16)]'
                    : 'border-surface-variant bg-surface-container text-on-surface-variant shadow-[0_8px_20px_rgba(0,0,0,0.02)]'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-[12px] ${isActive ? 'bg-white/12' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon size={15} strokeWidth={2.4} />
                    </div>
                    <div className="text-left">
                      <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${isActive ? 'text-white' : 'text-slate-500'}`}>
                        {label}
                      </p>
                      <p className={`text-[12px] font-bold ${isActive ? 'text-white/80' : 'text-slate-700'}`}>
                        {count} available
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-[18px] border border-white/80 bg-white/70 px-3 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Fleet</p>
              <p className="mt-1 text-[17px] font-black text-slate-900">{categoryCounts.all}</p>
            </div>
            <div className="rounded-[18px] border border-amber-100 bg-gradient-to-br from-amber-50 to-white px-3 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">Cars</p>
              <p className="mt-1 text-[17px] font-black text-slate-900">{categoryCounts.car}</p>
            </div>
            <div className="rounded-[18px] border border-amber-100 bg-gradient-to-br from-sky-50 to-white px-3 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-500">Bikes</p>
              <p className="mt-1 text-[17px] font-black text-slate-900">{categoryCounts.bike}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pt-4 pb-12 space-y-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <RentalSkeleton />
            </motion.div>
          ) : errorMessage ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-[24px] border border-rose-100 bg-rose-50/90 p-5 text-[13px] font-bold text-rose-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
            >
              {errorMessage}
            </motion.div>
          ) : vehicles.length === 0 ? (
            <motion.div
              key="empty-all"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-[24px] border border-white/80 bg-white/90 p-6 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-slate-100 text-slate-400">
                <Car size={22} />
              </div>
              <p className="mt-4 text-[15px] font-black text-slate-900">No rental vehicles available</p>
              <p className="mt-1 text-[12px] font-bold text-slate-400">Admin has not published any active rental vehicles yet.</p>
            </motion.div>
          ) : filteredVehicles.length === 0 ? (
            <motion.div
              key="empty-search"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-[24px] border border-white/80 bg-white/90 p-6 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-slate-100 text-slate-400">
                <Search size={22} />
              </div>
              <p className="mt-4 text-[15px] font-black text-slate-900">No rentals matched your search</p>
              <p className="mt-1 text-[12px] font-bold text-slate-400">Try another vehicle name, category, amenity, or switch the car and bike filter.</p>
            </motion.div>
          ) : (
            paginatedVehicles.map((v, idx) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38, delay: idx * 0.07, ease: 'easeOut' }}
                className="rounded-[26px] border border-white/80 bg-white/90 shadow-[0_10px_28px_rgba(15,23,42,0.06)] overflow-hidden"
              >
                <div
                  className="px-4.5 pt-4.5 pb-3.5 flex items-center justify-between"
                  style={{ background: `linear-gradient(135deg, ${v.gradientFrom} 0%, ${v.gradientTo} 100%)` }}
                >
                  <div className="flex-1 min-w-0 pr-2 space-y-1">
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${v.tagBg} ${v.tagColor}`}>
                      {v.tag}
                    </span>
                    <h3 className="text-[16.5px] font-extrabold text-on-surface leading-tight tracking-tight">{v.name}</h3>
                    {v.shortDescription ? (
                      <p className="text-[11.5px] font-medium text-slate-500/80">{v.shortDescription}</p>
                    ) : null}
                    <div className="flex items-center gap-1">
                      <Star size={10.5} className="text-yellow-500 fill-yellow-400" />
                      <span className="text-[11.5px] font-bold text-slate-700">{v.rating}</span>
                      <span className="text-[10px] font-medium text-slate-400">┬╖ {v.kmLimit[selectedDuration]} limit</span>
                    </div>
                  </div>
                  {v.image ? (
                    <img src={v.image} alt={v.name} className="h-28 w-34 object-contain drop-shadow-lg shrink-0 -mt-4 -mb-4 -mr-2" />
                  ) : (
                    <div className="flex h-28 w-34 items-center justify-center rounded-[20px] bg-white/60 text-slate-300 shadow-sm shrink-0">
                      <Car size={44} />
                    </div>
                  )}
                </div>

                <div className="px-4.5 pb-4.5 pt-3.5 space-y-3 border-t border-slate-50">
                  <div className="flex flex-wrap gap-1">
                    {v.features.map((feature) => (
                      <span key={feature} className="text-[9px] font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-100">
                        {feature}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Fuel size={11} className="text-slate-300 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-400">{v.fuel}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.15em] block">Price</span>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-[22px] font-extrabold text-on-surface tracking-tighter leading-none">₹{v.prices[selectedDuration]}</span>
                        <span className="text-[11px] font-bold text-slate-400/80 ml-0.5">{durationSuffix[selectedDuration]}</span>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => openVehicleDetail(v)}
                      className="bg-primary text-white hover:opacity-90 transition-all px-4 py-2.5 rounded-[12px] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-[0_6px_16px_rgba(212,140,0,0.15)] active:scale-95"
                    >
                      Book Now <ChevronRight size={13} strokeWidth={3} className="opacity-60" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {!loading && !errorMessage && filteredVehicles.length > RENTAL_PAGE_SIZE ? (
          <div className="flex items-center justify-between gap-3 rounded-[20px] border border-white/80 bg-white/90 px-4 py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="rounded-[12px] border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 disabled:opacity-40"
            >
              Previous
            </button>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Page</p>
              <p className="mt-1 text-[13px] font-black text-slate-900">{currentPage} / {totalPages}</p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="rounded-[12px] border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}

        <div className="flex items-center gap-3 rounded-[16px] border border-white/80 bg-white/90 px-4 py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
          <div className="w-8 h-8 rounded-[10px] bg-slate-50 flex items-center justify-center shrink-0">
            <Shield size={15} className="text-slate-400" strokeWidth={2} />
          </div>
          <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
            All rental vehicles shown here come from the admin catalog. Valid driving license and verification are required before pickup.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BikeRentalHome;
