import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Fuel, Shield, ChevronRight, ChevronLeft, ChevronDown, SlidersHorizontal, ArrowDownUp, Star, Info, Car, Search, X, Bike, MapPin, MessageSquare, Calendar, User, Compass, Truck, Check, Headset, Home } from 'lucide-react';
import { userService } from '../../services/userService';
import rentalCarImg from '@/assets/images/rental_car.png';
import marutiSwiftImg from '@/assets/images/maruti_swift_nobg.png';
import marutiBalenoImg from '@/assets/images/maruti_baleno_nobg.png';
import hyundaiAuraImg from '@/assets/images/hyundai_aura_nobg.png';
import toast from 'react-hot-toast';

const DURATION_TABS = ['Hourly', 'Half-Day', 'Daily'];
const RENTAL_SELECTED_VEHICLE_STORAGE_KEY = 'selectedRentalVehicleDetail';
const RENTAL_PAGE_SIZE = 10;
const RENTAL_ROUTE_PATH = '/taxi/user/rental';
const SUBSCRIPTION_ROUTE_PATH = '/taxi/user/rental/subscriptions';
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
  let tagColor = 'text-blue-600';
  let tagBg = 'bg-blue-50 border-blue-100';

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
    tagColor = 'text-orange-500';
    tagBg = 'bg-orange-50 border-orange-100';
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
    fuel: isBike ? 'Self-drive · License required' : 'Self-drive · Clean and sanitized',
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
      <div key={i} className="rounded-[24px] border border-white/80 bg-white/90 shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-hidden">
        <div className="px-4 pt-3.5 pb-3 flex items-center justify-between bg-slate-50/50">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-16 skeleton rounded-full" />
            <div className="h-5 w-32 skeleton rounded-md" />
            <div className="h-3 w-24 skeleton rounded-md" />
            <div className="flex gap-2">
              <div className="h-3 w-8 skeleton rounded-full" />
              <div className="h-3 w-12 skeleton rounded-full" />
            </div>
          </div>
          <div className="h-16 w-20 skeleton rounded-2xl shrink-0" />
        </div>
        <div className="px-4 pb-4 pt-3 space-y-3">
          <div className="flex gap-1">
            <div className="h-4 w-12 skeleton rounded-full" />
            <div className="h-4 w-12 skeleton rounded-full" />
            <div className="h-4 w-12 skeleton rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-2 w-8 skeleton rounded-full" />
              <div className="h-6 w-20 skeleton rounded-md" />
            </div>
            <div className="h-9 w-24 skeleton rounded-xl" />
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
  const isSubscriptionRoute = location.pathname === SUBSCRIPTION_ROUTE_PATH;
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
    return 'all';
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSegment, setActiveSegment] = useState(isSubscriptionRoute ? 'subscriptions' : 'rentals'); // 'rentals' or 'subscriptions'
  const [subCategory, setSubCategory] = useState('Hatchbacks'); // 'Hatchbacks', 'Sedans', 'SUVs' for subscriptions
  const [isAddressEntered, setIsAddressEntered] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  const [locationSearchText, setLocationSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('South Tukoganj, Indore');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(true);

  useEffect(() => {
    setActiveSegment(isSubscriptionRoute ? 'subscriptions' : 'rentals');
  }, [isSubscriptionRoute]);

  const navigateToSegment = (segment) => {
    setIsAddressEntered(false);

    if (segment === 'subscriptions') {
      navigate(SUBSCRIPTION_ROUTE_PATH);
      return;
    }

    navigate(RENTAL_ROUTE_PATH);
  };

  const resolveImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('data:') || img.startsWith('http')) return img;
    const baseUrl = globalThis.__LEGACY_BACKEND_ORIGIN__ || '';
    return `${baseUrl}/${img.startsWith('/') ? img.slice(1) : img}`;
  };

  const taxi09Cars = useMemo(() => {
    const realCars = vehicles.filter(v => v.normalizedCategory === 'car');
    if (realCars.length > 0) {
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
    }

    return [
      {
        id: 'taxi09-1',
        name: 'XUV 700 AT',
        brand: 'Mahindra',
        image: rentalCarImg,
        prices: { Hourly: 240, 'Half-Day': 1400, Daily: 5832 },
        kmLimit: { Daily: '120 km' },
        fuel: 'Diesel · Automatic',
        features: ['SUV', 'Automatic', '7 Seats'],
        categoryType: 'SUVs',
        year: '2024-25'
      },
      {
        id: 'taxi09-2',
        name: 'Swift 2024-25',
        brand: 'Maruti',
        image: rentalCarImg,
        prices: { Hourly: 120, 'Half-Day': 700, Daily: 2592 },
        kmLimit: { Daily: '120 km' },
        fuel: 'Petrol · Manual',
        features: ['Hatchback', 'Manual', '5 Seats'],
        categoryType: 'Hatchbacks',
        year: '2024-25'
      },
      {
        id: 'taxi09-3',
        name: 'Alto 800 VXI',
        brand: 'Maruti',
        image: rentalCarImg,
        prices: { Hourly: 90, 'Half-Day': 500, Daily: 1800 },
        kmLimit: { Daily: '120 km' },
        fuel: 'Petrol · Manual',
        features: ['Hatchback', 'Manual', '5 Seats'],
        categoryType: 'Hatchbacks',
        year: '2023-24'
      },
      {
        id: 'taxi09-4',
        name: 'Alto K10',
        brand: 'Maruti',
        image: rentalCarImg,
        prices: { Hourly: 95, 'Half-Day': 550, Daily: 1950 },
        kmLimit: { Daily: '120 km' },
        fuel: 'Petrol · Manual',
        features: ['Hatchback', 'Manual', '5 Seats'],
        categoryType: 'Hatchbacks',
        year: '2024'
      },
      {
        id: 'taxi09-5',
        name: 'Verna 1.5',
        brand: 'Hyundai',
        image: rentalCarImg,
        prices: { Hourly: 160, 'Half-Day': 900, Daily: 3200 },
        kmLimit: { Daily: '120 km' },
        fuel: 'Petrol · Automatic',
        features: ['Sedan', 'Automatic', '5 Seats'],
        categoryType: 'Sedans',
        year: '2024'
      }
    ];
  }, [vehicles]);

  const subscriptionVehicles = useMemo(() => {
    return vehicles
      .filter((vehicle) => vehicle.subscription?.enabled && vehicle.subscription?.plans?.length)
      .map((vehicle, index) => {
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
          categoryType: normalizeRentalCategory(vehicle.vehicleCategory) === 'bike'
            ? 'Bikes'
            : Number(vehicle.capacity || 0) <= 5
            ? (index % 2 === 0 ? 'Hatchbacks' : 'Sedans')
            : 'SUVs',
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

  const rentalBanners = useMemo(() => {
    return banners.filter(b => b.type === 'rental' || !b.type);
  }, [banners]);

  const subscriptionBanners = useMemo(() => {
    return banners.filter(b => b.type === 'subscription');
  }, [banners]);

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

    navigate('/rental/vehicle', {
      state: {
        duration: payload.duration,
        detailMode: payload.detailMode,
        selectedSubscriptionPlanId: payload.selectedSubscriptionPlanId,
      },
    });
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

  useEffect(() => {
    let mounted = true;
    const loadOffers = async () => {
      try {
        setOffersLoading(true);
        const response = await userService.getActiveRentalCoupons();
        const results = response?.data?.data || response?.data?.results || response?.data || [];
        if (mounted) {
          setOffers(results.filter(o => o.active !== false));
        }
      } catch (error) {
        console.error('Failed to load offers', error);
      } finally {
        if (mounted) {
          setOffersLoading(false);
        }
      }
    };
    loadOffers();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code "${code}" copied!`, { icon: '📋' });
  };

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
    return [
      {
        id: 'search-1',
        brand: 'Maruti',
        name: 'Swift 2024-25',
        fuel: 'Petrol · Manual',
        capacity: 5,
        price: 4896,
        image: marutiSwiftImg,
        distance: '7 km | Lake view..'
      },
      {
        id: 'search-2',
        brand: 'Maruti',
        name: 'Baleno 2024-25',
        fuel: 'Petrol · Manual',
        capacity: 5,
        price: 5088,
        image: marutiBalenoImg,
        distance: '7 km | Lake view..'
      },
      {
        id: 'search-3',
        brand: 'Hyundai',
        name: 'Aura 2024-25 (P)',
        fuel: 'Petrol · Manual',
        capacity: 5,
        price: 4992,
        image: hyundaiAuraImg,
        distance: '7 km | Lake view..'
      },
      {
        id: 'search-4',
        brand: 'Mahindra',
        name: 'XUV 700 AT',
        fuel: 'Diesel · Automatic',
        capacity: 7,
        price: 5832,
        image: rentalCarImg,
        distance: '10 km | Indore Airport'
      }
    ];
  }, []);

  if (activeSegment === 'subscriptions' || (activeSegment === 'rentals' && selectedCategoryFilter === 'car')) {
    if (activeSegment === 'rentals' && isAddressEntered) {
      // 2. Render Search Results View (Indore Listing)
      return (
        <div className="min-h-screen bg-[#F3F4F6] max-w-lg mx-auto font-sans relative pb-24 flex flex-col justify-between overflow-x-hidden no-scrollbar">
          {/* Sticky Header block containing Header, Filters, Search input */}
          <div className="sticky top-0 z-30 bg-white shadow-sm flex flex-col shrink-0">
            {/* Header */}
            <div className="bg-[#F3F4F6] px-4 pt-10 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <button
                  onClick={() => setIsAddressEntered(false)}
                  className="text-slate-800 hover:opacity-75 transition-opacity py-1 pr-1 shrink-0"
                >
                  <ChevronLeft size={24} strokeWidth={2} />
                </button>
                <div className="min-w-0" onClick={() => {
                  setIsAddressEntered(false);
                  setLocationSearchText('');
                  setShowLocationSuggestions(true);
                }}>
                  <h1 className="text-[16px] font-bold text-slate-800 tracking-tight leading-tight flex items-center gap-1 cursor-pointer">
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
            <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-slate-100 bg-white">
              <button className="bg-[#0B94A4] text-white flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] font-semibold shrink-0">
                <SlidersHorizontal size={14} strokeWidth={2} />
                Filter
              </button>
              
              <button className="bg-[#0B94A4] text-white p-1.5 rounded-lg shrink-0 flex items-center justify-center w-8.5 h-8.5">
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
            <div className="bg-white px-4 py-2 border-b border-slate-200">
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
          <div className="flex-1 overflow-y-auto bg-[#F3F4F6] pb-12 no-scrollbar">
            {/* Results Header */}
            <div className="flex items-center justify-between px-4 py-3.5 select-none bg-[#F3F4F6]">
              <h3 className="text-[17px] font-bold text-slate-700">16 cars available</h3>
              <span className="text-[12px] font-medium text-slate-500">Duration: 1 Day, 13 Hrs</span>
            </div>

            {/* Notice Banner */}
            <div className="mx-4 mb-4 bg-gradient-to-r from-[#B2EBF2]/80 to-[#E0F7FA]/80 rounded-2xl p-4 flex gap-4 border border-teal-100/50 select-none">
              <div className="w-[55%]">
                <h4 className="text-[14px] font-bold text-slate-800 leading-tight">
                  Rentals will be chargeable on per day basis <br />
                  <span className="font-semibold text-slate-600 text-[11px] block mt-1">(Only in {selectedLocation.split(',').pop().trim()})</span>
                </h4>
              </div>
              <div className="w-[45%] flex flex-col justify-between text-[11px] text-slate-700 leading-snug">
                <p>
                  Morning 9am to 9am will be considered as one day
                </p>
                <span className="text-indigo-650 hover:text-indigo-800 transition-colors font-bold mt-1.5 inline-flex items-center hover:underline cursor-pointer">
                  Know more &gt;
                </span>
              </div>
            </div>

            {/* Cars List */}
            <div className="px-4 space-y-4">
              {searchResultCars
                .filter(car => {
                  if (!searchQuery) return true;
                  return `${car.brand} ${car.name}`.toLowerCase().includes(searchQuery.toLowerCase());
                })
                .map((car) => (
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
                    className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_4px_16px_rgba(15,23,42,0.02)] flex flex-col gap-3 relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow group animate-fadeIn"
                  >
                    {/* Top row */}
                    <div className="flex justify-between items-start">
                      {/* Left: Image & Badge */}
                      <div className="w-[40%] flex flex-col items-center">
                        <img
                          src={car.image}
                          alt={car.name}
                          className="h-16 object-contain mix-blend-multiply drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="bg-[#E75D35] text-white text-[7.5px] font-bold px-2 py-0.5 rounded-full mt-2 text-center whitespace-nowrap block shadow-sm leading-none">
                          Selling Fast for the selected dates
                        </span>
                      </div>

                      {/* Right: metadata */}
                      <div className="flex-1 pl-4 flex flex-col justify-between min-h-[90px]">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none">{car.brand}</span>
                          <h4 className="text-[15.5px] font-bold text-slate-800 tracking-tight leading-tight mt-1">{car.name}</h4>
                          
                          {/* Details list with icons */}
                          <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 mt-2">
                            <div className="flex items-center gap-0.5">
                              <Fuel size={11} className="text-slate-400" />
                              <span>{car.fuel.split(' · ')[0]}</span>
                            </div>
                            <span>·</span>
                            <div className="flex items-center gap-0.5">
                              <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M6 3v18M12 3v18M18 3v18M6 12h12" />
                              </svg>
                              <span>{car.fuel.split(' · ')[1]}</span>
                            </div>
                            <span>·</span>
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
                        <div className="w-4.5 h-4.5 rounded-full border border-indigo-500/20 bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
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
                          <svg className="w-3.5 h-3.5 text-indigo-600 rotate-45" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z" />
                          </svg>
                          <span className="font-bold text-slate-700">{car.distance}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Floating headset button */}
          <div 
            onClick={() => {
              navigate('/taxi/user/support');
              toast('Connecting to Support Chat...', { icon: '💬' });
            }}
            className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-[#0B94A4] flex items-center justify-center text-white shadow-xl z-50 cursor-pointer hover:bg-[#097E8B] transition-colors"
          >
            <Headset size={22} strokeWidth={2.2} />
          </div>

          {/* Sticky Bottom Navbar */}
          <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 py-2.5 px-4 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] z-40 max-w-lg mx-auto flex items-center justify-between">
            <button
              onClick={() => navigateToSegment('rentals')}
              className="flex flex-col items-center gap-1 flex-1 py-1 text-[#0B94A4]"
            >
              <div className="w-6 h-6 rounded-md flex items-center justify-center font-[900] text-[13px] border-2 border-[#0B94A4] bg-[#0B94A4]/5">
                R
              </div>
              <span className="text-[9.5px] font-bold tracking-wide uppercase">Rentals</span>
            </button>
            
            <button
              onClick={() => navigateToSegment('subscriptions')}
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

    // 1. Render Taxi09 Dashboard View (Teal header, featured list)
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#F1F5F9_40%,#E2E8F0_100%)] max-w-lg mx-auto font-sans relative pb-24 flex flex-col justify-between overflow-x-hidden no-scrollbar">
        {/* Teal Header Block */}
        <div className="bg-gradient-to-br from-[#0B94A4] via-[#097E8B] to-[#055E6B] text-white px-5 pt-12 pb-6 rounded-b-[40px] shadow-[0_10px_30px_rgba(11,148,164,0.15)] relative shrink-0 z-20">
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-[40px] pointer-events-none" />
          
          {/* Row 1: Back Arrow & Logo */}
          <div className="relative flex items-center justify-between mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/taxi/user/rental/type')}
              className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all shrink-0"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </motion.button>
            <div className="flex flex-col items-center select-none text-center">
              <span className="text-[26px] font-[900] tracking-tight leading-none text-white italic drop-shadow-[0_2px_10px_rgba(99,102,241,0.5)]">Taxi09</span>
              <span className="text-[8px] font-extrabold text-white/70 tracking-widest uppercase mt-1">Premium Self-Drive</span>
            </div>
            <div className="w-10 h-10" />
          </div>

          {/* Row 2: Segment Selector Tabs */}
          <div className="bg-[#097E8B]/80 backdrop-blur-md rounded-2xl p-1.5 flex border border-white/10 shadow-inner mb-6 relative">
            <button
              onClick={() => navigateToSegment('rentals')}
              className={`relative flex-1 py-2.5 rounded-[14px] text-[12px] font-extrabold uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center outline-none ${
                activeSegment === 'rentals' ? 'bg-white text-slate-900 shadow-md' : 'text-white/80 hover:bg-white/5'
              }`}
            >
              <span className="text-[13px] font-black">Rentals</span>
              <span className={`text-[8px] font-bold mt-0.5 ${activeSegment === 'rentals' ? 'text-slate-500' : 'text-white/60'}`}>For hours & days</span>
              {activeSegment === 'rentals' && (
                <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white" />
              )}
            </button>
            <button
              onClick={() => navigateToSegment('subscriptions')}
              className={`relative flex-1 py-2.5 rounded-[14px] text-[12px] font-extrabold uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center outline-none ${
                activeSegment === 'subscriptions' ? 'bg-white text-slate-900 shadow-md' : 'text-white/80 hover:bg-white/5'
              }`}
            >
              <span className="text-[13px] font-black">Subscriptions</span>
              <span className={`text-[8px] font-bold mt-0.5 ${activeSegment === 'subscriptions' ? 'text-slate-500' : 'text-white/60'}`}>For months & years</span>
              {activeSegment === 'subscriptions' && (
                <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white" />
              )}
            </button>
          </div>

          {/* Row 3: Horizontal Pills Grid */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
            {activeSegment === 'rentals' ? (
              <>
                <motion.div whileHover={{ scale: 1.03 }} className="border border-white/20 bg-white/10 text-[11px] font-bold text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 select-none cursor-default transition-colors hover:bg-white/15">
                  <Star size={12} className="fill-white" /> Brand New Cars
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} className="border border-white/20 bg-white/10 text-[11px] font-bold text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 select-none cursor-default transition-colors hover:bg-white/15">
                  <Info size={12} /> 24*7 Support
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} className="border border-white/20 bg-white/10 text-[11px] font-bold text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 select-none cursor-default transition-colors hover:bg-white/15">
                  <Truck size={12} /> Home Delivery
                </motion.div>
              </>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.03 }} className="border border-white/20 bg-white/10 text-[11px] font-bold text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 select-none cursor-default transition-colors hover:bg-white/15">
                  <Compass size={12} /> Flexible tenure
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} className="border border-white/20 bg-white/10 text-[11px] font-bold text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 select-none cursor-default transition-colors hover:bg-white/15">
                  <Star size={12} className="fill-white" /> Brand new cars
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} className="border border-white/20 bg-white/10 text-[11px] font-bold text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 select-none cursor-default transition-colors hover:bg-white/15">
                  <Shield size={12} /> Extended warranty
                </motion.div>
              </>
            )}
          </div>

          {/* Row 4: Company Fleet Claim Badge */}
          <div className="flex items-center gap-2 mb-5 select-none justify-center bg-white/5 border border-white/10 py-1.5 px-4 rounded-full w-fit mx-auto shadow-sm backdrop-blur-sm">
            <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center text-slate-900 shadow-sm shrink-0">
              <Check size={10} strokeWidth={3} />
            </div>
            <span className="text-[11px] font-extrabold text-white tracking-wide">Largest company-owned fleet in India</span>
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
              className="bg-white rounded-3xl p-2 shadow-[0_12px_40px_rgba(11,148,164,0.15)] flex items-center gap-3 border border-slate-100/80 relative z-20 hover:shadow-[0_16px_48px_rgba(11,148,164,0.22)] focus-within:shadow-[0_16px_48px_rgba(11,148,164,0.22)] transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B94A4] to-[#097E8B] flex items-center justify-center text-white shrink-0 shadow-md">
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
                    setSelectedLocation(locationSearchText);
                    setShowLocationSuggestions(false);
                    setIsAddressEntered(true);
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
              <div className="w-7 h-7 flex items-center justify-center shrink-0 pr-1 text-[#0B94A4]">
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
                        setSelectedLocation(loc);
                        setLocationSearchText(loc);
                        setShowLocationSuggestions(false);
                        setIsAddressEntered(true);
                      }}
                      className="px-4 py-3 hover:bg-slate-50 flex items-center gap-3 cursor-pointer transition-colors border-b border-slate-50 last:border-b-0"
                    >
                      <MapPin size={14} className="text-indigo-600 shrink-0" />
                      <span className="text-[13px] font-semibold text-slate-700">{loc}</span>
                    </div>
                  ))}
                {LOCATION_SUGGESTIONS.filter(loc => !locationSearchText || loc.toLowerCase().includes(locationSearchText.toLowerCase())).length === 0 && (
                  <div 
                    onClick={() => {
                      if (locationSearchText.trim()) {
                        setSelectedLocation(locationSearchText);
                        setShowLocationSuggestions(false);
                        setIsAddressEntered(true);
                      }
                    }}
                    className="px-4 py-3 hover:bg-slate-50 flex items-center gap-3 cursor-pointer text-slate-500 font-semibold text-[13px] border-t border-slate-50"
                  >
                    <Search size={14} className="text-[#0B94A4] shrink-0" />
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
              <div className="space-y-3.5">
                <h3 className="text-[20px] font-black text-slate-400 tracking-tight select-none">Featured</h3>
                
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
                  {rentalBanners.length > 0 ? (
                    rentalBanners.map((banner) => (
                      <motion.div
                        key={banner.id || banner._id}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (banner.redirect_url) {
                            window.open(banner.redirect_url, '_blank');
                          } else {
                            toast('Promotion loaded', { icon: '✨' });
                          }
                        }}
                        className="w-[280px] h-[130px] rounded-3xl bg-slate-100 shadow-sm shrink-0 border border-slate-200/40 relative overflow-hidden group cursor-pointer"
                      >
                        <img
                          src={resolveImageUrl(banner.image)}
                          alt={banner.title || "Featured banner"}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </motion.div>
                    ))
                  ) : (
                    <>
                      {/* Banner 1 */}
                      <div className="w-[280px] h-[130px] rounded-3xl bg-gradient-to-r from-[#E0F7FA] to-[#80DEEA] p-4 flex items-center justify-between shadow-sm shrink-0 border border-teal-100/20 relative overflow-hidden group">
                        <div className="space-y-1 relative z-10 max-w-[55%]">
                          <span className="text-[15px] font-black text-slate-900 block leading-tight">7 DAYS</span>
                          <span className="text-[13px] font-black text-indigo-750 block leading-tight">Rental Package</span>
                          <button 
                            onClick={() => toast('Weekly discount pricing applied', { icon: '💰' })}
                            className="mt-4 flex items-center gap-1 text-[10px] font-extrabold uppercase text-slate-900/90 tracking-wider hover:opacity-80"
                          >
                            Lowest Price Ever <ChevronRight size={12} strokeWidth={3} />
                          </button>
                        </div>
                        <div className="h-full w-[45%] flex items-end justify-center relative shrink-0">
                          <div className="absolute bottom-2 right-2 w-14 h-22 bg-slate-900/5 rounded-lg border border-slate-900/10 flex items-center justify-center text-slate-400 text-[8px] font-bold">
                            <Calendar size={18} className="opacity-40" />
                          </div>
                          <img src={rentalCarImg} alt="" className="h-14 w-full object-contain relative z-10 -ml-4 mix-blend-multiply drop-shadow-md" />
                        </div>
                      </div>

                      {/* Banner 2 */}
                      <div className="w-[240px] h-[130px] rounded-3xl bg-[#1C2025] p-4 flex flex-col justify-between shadow-sm shrink-0 relative overflow-hidden group border border-slate-800">
                        <div className="absolute top-[-30px] right-[-30px] w-24 h-24 rounded-full bg-yellow-400/5 blur-2xl" />
                        <div className="space-y-1">
                          <span className="text-[14px] font-black text-white block">Rental pass</span>
                          <p className="text-[11px] font-semibold text-slate-400 leading-tight">Get Rental Pass and</p>
                          <p className="text-[14px] font-black text-yellow-400 leading-none">Save 25% <span className="text-[10px] font-bold text-slate-400">on bookings</span></p>
                        </div>
                        <button 
                          onClick={() => toast('Rental Pass applied successfully!', { icon: '🎫' })}
                          className="text-[10px] font-extrabold text-white/60 uppercase tracking-widest text-left"
                        >
                          Get Pass Now
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Rentals - Top Selling Section */}
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
                      className="w-[290px] h-[155px] bg-white border border-slate-100/80 rounded-3xl p-4 shadow-[0_8px_30px_rgba(15,23,42,0.02)] flex items-center justify-between shrink-0 relative overflow-hidden cursor-pointer hover:shadow-[0_12px_36px_rgba(15,23,42,0.06)] hover:border-slate-200/50 transition-all duration-300 group"
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

              {/* Offers Section */}
              <div className="space-y-3 px-1 select-none">
                <h3 className="text-[19px] font-bold text-slate-700 tracking-tight">Offers</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {offers.length > 0 ? (
                    offers.map((offer) => {
                      const isPercent = offer.type === 'percent';
                      const formattedDiscount = isPercent ? `${offer.amount}% OFF` : `₹${offer.amount} OFF`;
                      const desc = offer.description || (isPercent
                        ? `Get ${offer.amount}% off${offer.cap > 0 ? ` up to ₹${offer.cap}` : ''}${offer.min_booking_amount > 0 ? ` on bookings above ₹${offer.min_booking_amount}` : ''}`
                        : `Get flat ₹${offer.amount} off${offer.min_booking_amount > 0 ? ` on bookings above ₹${offer.min_booking_amount}` : ''}`
                      );
                      const hasRestrictions = offer.vehicle_ids && offer.vehicle_ids.length > 0;
                      
                      return (
                        <motion.div 
                          key={offer._id || offer.id}
                          whileHover={{ y: -6 }} 
                          whileTap={{ scale: 0.98 }} 
                          onClick={() => handleCopyCode(offer.code)}
                          className="w-[280px] rounded-3xl bg-white border border-slate-100/80 shadow-[0_8px_30px_rgba(15,23,42,0.02)] hover:shadow-[0_12px_36px_rgba(15,23,42,0.05)] transition-all duration-300 flex flex-col justify-between overflow-hidden shrink-0 cursor-pointer"
                        >
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="text-[14px] font-bold text-slate-800 truncate max-w-[170px]">{offer.code}</h4>
                                <span className="text-[13px] font-bold text-indigo-600 shrink-0">{formattedDiscount}</span>
                              </div>
                              <p className="text-[11.5px] text-slate-400 mt-1.5 leading-normal font-medium">
                                {desc}
                              </p>
                            </div>
                            {hasRestrictions && (
                              <div className="mt-3 text-[9.5px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-lg py-1.5 px-2.5">
                                Applicable only on: {offer.vehicle_ids.map(v => v.name).join(', ')}
                              </div>
                            )}
                          </div>
                          <div className="bg-gradient-to-r from-[#0B94A4] to-[#097E8B] px-4 py-3 flex items-center justify-between relative overflow-hidden border-t border-dashed border-slate-100/20">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/30 via-transparent to-transparent pointer-events-none" />
                            <span className="bg-white text-slate-700 text-[11px] font-bold px-3 py-1 rounded-lg border border-slate-100 shadow-sm uppercase">
                              {offer.code}
                            </span>
                            <span className="text-[10px] text-white/80 font-medium hover:underline">• Copy Code</span>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <>
                      {/* Offer 1 */}
                      <motion.div 
                        whileHover={{ y: -6 }} 
                        whileTap={{ scale: 0.98 }} 
                        onClick={() => handleCopyCode('STMB5')}
                        className="w-[280px] rounded-3xl bg-white border border-slate-100/80 shadow-[0_8px_30px_rgba(15,23,42,0.02)] hover:shadow-[0_12px_36px_rgba(15,23,42,0.05)] transition-all duration-300 flex flex-col justify-between overflow-hidden shrink-0 cursor-pointer"
                      >
                        <div className="p-4 flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="text-[14px] font-bold text-slate-800">Short Trip Offer</h4>
                            <span className="text-[13px] font-bold text-indigo-600">5% OFF</span>
                          </div>
                          <p className="text-[11.5px] text-slate-400 mt-1.5 leading-normal font-medium">
                            Use code STMB5 and get 5% off upto ₹500
                          </p>
                        </div>
                        <div className="bg-gradient-to-r from-[#0B94A4] to-[#097E8B] px-4 py-3 flex items-center justify-between relative overflow-hidden border-t border-dashed border-slate-100/20">
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/30 via-transparent to-transparent pointer-events-none" />
                          <span className="bg-white text-slate-700 text-[11px] font-bold px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                            STMB5
                          </span>
                          <span className="text-[10px] text-white/80 font-medium hover:underline">• Copy Code</span>
                        </div>
                      </motion.div>

                      {/* Offer 2 */}
                      <motion.div 
                        whileHover={{ y: -6 }} 
                        whileTap={{ scale: 0.98 }} 
                        onClick={() => handleCopyCode('WKND10')}
                        className="w-[280px] rounded-3xl bg-white border border-slate-100/80 shadow-[0_8px_30px_rgba(15,23,42,0.02)] hover:shadow-[0_12px_36px_rgba(15,23,42,0.05)] transition-all duration-300 flex flex-col justify-between overflow-hidden shrink-0 cursor-pointer"
                      >
                        <div className="p-4 flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="text-[14px] font-bold text-slate-800">Weekend Special</h4>
                            <span className="text-[13px] font-bold text-indigo-600">10% OFF</span>
                          </div>
                          <p className="text-[11.5px] text-slate-400 mt-1.5 leading-normal font-medium">
                            Get 10% off up to ₹1,000 on weekend bookings
                          </p>
                        </div>
                        <div className="bg-gradient-to-r from-[#0B94A4] to-[#097E8B] px-4 py-3 flex items-center justify-between relative overflow-hidden border-t border-dashed border-slate-100/20">
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/30 via-transparent to-transparent pointer-events-none" />
                          <span className="bg-white text-slate-700 text-[11px] font-bold px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                            WKND10
                          </span>
                          <span className="text-[10px] text-white/80 font-medium hover:underline">• Copy Code</span>
                        </div>
                      </motion.div>
                    </>
                  )}
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
                    <div className="w-12 h-12 rounded-full bg-[#E0F2F1] text-indigo-600 flex items-center justify-center shrink-0">
                      <Home size={22} className="stroke-indigo-600" />
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
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Shield size={22} className="stroke-blue-600" />
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
                  <span className="text-[13px] font-bold text-[#0B94A4] cursor-pointer hover:underline">View all</span>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_4px_16px_rgba(15,23,42,0.02)] divide-y divide-slate-100">
                  {/* FAQ 1 */}
                  <div className="pb-3 pt-0.5">
                    <button 
                      onClick={() => setActiveFaqIndex(activeFaqIndex === 0 ? null : 0)}
                      className="w-full flex justify-between items-center text-left text-[13.5px] font-bold text-slate-800 outline-none"
                    >
                      <span>Is there a speed limit?</span>
                      <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${activeFaqIndex === 0 ? 'rotate-180 text-[#0B94A4]' : ''}`} />
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
                  {subscriptionBanners.length > 0 ? (
                    subscriptionBanners.map((banner) => (
                      <motion.div
                        key={banner.id || banner._id}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (banner.redirect_url) {
                            window.open(banner.redirect_url, '_blank');
                          } else {
                            toast('Promotion loaded', { icon: '✨' });
                          }
                        }}
                        className="w-[280px] h-[130px] rounded-3xl bg-slate-100 shadow-sm shrink-0 border border-slate-200/40 relative overflow-hidden group cursor-pointer"
                      >
                        <img
                          src={resolveImageUrl(banner.image)}
                          alt={banner.title || "Featured banner"}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </motion.div>
                    ))
                  ) : (
                    <>
                      <div className="w-[240px] h-[130px] rounded-3xl bg-slate-950 shadow-sm shrink-0 border border-slate-800 relative overflow-hidden group cursor-pointer flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-slate-900/60 z-0" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-60 z-0">
                          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white">
                            <Car size={32} />
                          </div>
                        </div>
                        <div className="relative z-10 w-12 h-12 rounded-full bg-white/95 shadow-md flex items-center justify-center text-[#0B94A4] group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>

                      <div className="w-[220px] h-[130px] rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 flex items-center gap-3 shadow-sm shrink-0 border border-amber-100/50 select-none">
                        <div className="w-14 h-14 rounded-full bg-amber-100/60 flex items-center justify-center text-amber-800 font-extrabold text-[22px] tracking-tighter shrink-0 shadow-inner">
                          ₹0
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[13.5px] font-black text-slate-900 block leading-tight">No down</span>
                          <span className="text-[13.5px] font-black text-slate-900 block leading-tight">payment</span>
                        </div>
                      </div>
                    </>
                  )}
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
                        className={`relative pb-2 text-[15px] font-black transition-colors ${
                          isActive ? 'text-[#0B94A4]' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {cat}
                        {isActive && (
                          <motion.div
                            layoutId="subCategoryBorder"
                            className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#0B94A4] rounded-full"
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
                        openVehicleDetail(car.rawVehicle || car, {
                          detailMode: 'subscription',
                          selectedSubscriptionPlanId: car.subscriptionPlan?.id || '',
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
                          <span>{car.fuel?.split(' · ')[0] || 'Petrol'}</span>
                          <span>·</span>
                          <span>{car.fuel?.split(' · ')[1] || 'Manual'}</span>
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
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 py-2.5 px-4 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] z-40 max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => navigateToSegment('rentals')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 ${activeSegment === 'rentals' ? 'text-[#0B94A4]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className={`w-6 h-6 rounded-md flex items-center justify-center font-[900] text-[13px] border-2 ${activeSegment === 'rentals' ? 'border-[#0B94A4] bg-[#0B94A4]/5' : 'border-slate-400'}`}>
              R
            </div>
            <span className="text-[9.5px] font-bold tracking-wide uppercase">Rentals</span>
          </button>
          
          <button
            onClick={() => navigateToSegment('subscriptions')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 relative ${activeSegment === 'subscriptions' ? 'text-[#0B94A4]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span className="absolute top-[-10px] bg-rose-500 text-[6.5px] font-black text-white px-1.5 py-0.5 rounded-[4px] uppercase tracking-wide border border-white">
              NEW
            </span>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center font-[900] text-[13px] border-2 ${activeSegment === 'subscriptions' ? 'border-[#0B94A4] bg-[#0B94A4]/5' : 'border-slate-400'}`}>
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#F3F4F6_38%,#EEF2F7_100%)] max-w-lg mx-auto font-sans relative overflow-hidden pb-12">
      <div className="absolute -top-16 right-[-40px] h-44 w-44 rounded-full bg-orange-100/60 blur-3xl pointer-events-none" />
      <div className="absolute bottom-28 right-[-40px] h-40 w-40 rounded-full bg-blue-100/60 blur-3xl pointer-events-none" />

      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-30 w-full"
      >
        <div className="bg-white/85 backdrop-blur-2xl px-5 pt-12 pb-5 border-b border-white/40 shadow-[0_8px_32px_rgba(15,23,42,0.06)] relative overflow-hidden">
          {/* Subtle accent gradients */}
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-orange-400/5 blur-[40px] pointer-events-none" />
          <div className="absolute top-0 left-0 h-24 w-24 rounded-full bg-blue-400/5 blur-[40px] pointer-events-none" />

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
                <h1 className="text-[24px] font-[900] tracking-tight text-slate-950 leading-none">Choose Ride</h1>
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
                    <span className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-slate-950' : 'text-slate-400'}`}>
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
              className="w-full bg-slate-100/50 border border-slate-200/60 focus:border-slate-900/10 focus:bg-white rounded-[20px] pl-11 pr-11 py-3.5 text-[14px] font-bold text-slate-950 placeholder:text-slate-400/80 focus:outline-none focus:shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all"
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

      <div className="px-5 pt-6 space-y-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDuration}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex items-center gap-3 rounded-[20px] border border-white/80 bg-white/60 backdrop-blur-md px-4 py-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 shadow-sm">
              <Info size={16} className="text-blue-500" strokeWidth={2.5} />
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
                className="text-[10px] font-[800] uppercase tracking-wider text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md"
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
                  className={`shrink-0 rounded-[18px] border px-3.5 py-2.5 transition-all ${
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]'
                      : 'border-white/90 bg-white/75 text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.05)]'
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
            <div className="rounded-[18px] border border-orange-100 bg-gradient-to-br from-orange-50 to-white px-3 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">Cars</p>
              <p className="mt-1 text-[17px] font-black text-slate-900">{categoryCounts.car}</p>
            </div>
            <div className="rounded-[18px] border border-sky-100 bg-gradient-to-br from-sky-50 to-white px-3 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-500">Bikes</p>
              <p className="mt-1 text-[17px] font-black text-slate-900">{categoryCounts.bike}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 pb-12 space-y-4">
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
              className="rounded-[24px] border border-white/80 bg-white/90 shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-hidden"
            >
              <div
                className="px-4 pt-3.5 pb-3 flex items-center justify-between"
                style={{ background: `linear-gradient(135deg, ${v.gradientFrom} 0%, ${v.gradientTo} 100%)` }}
              >
                <div className="flex-1 min-w-0 pr-2 space-y-1">
                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${v.tagBg} ${v.tagColor}`}>
                    {v.tag}
                  </span>
                  <h3 className="text-[16px] font-extrabold text-slate-950 leading-tight tracking-tight">{v.name}</h3>
                  {v.shortDescription ? (
                    <p className="text-[11px] font-medium text-slate-500/80">{v.shortDescription}</p>
                  ) : null}
                  <div className="flex items-center gap-1">
                    <Star size={10} className="text-yellow-500 fill-yellow-400" />
                    <span className="text-[11px] font-bold text-slate-700">{v.rating}</span>
                    <span className="text-[10px] font-medium text-slate-400">· {v.kmLimit[selectedDuration]} limit</span>
                  </div>
                </div>
                {v.image ? (
                  <img src={v.image} alt={v.name} className="h-20 w-24 object-contain drop-shadow-lg shrink-0 -mt-2 -mb-2" />
                ) : (
                  <div className="flex h-20 w-24 items-center justify-center rounded-[20px] bg-white/60 text-slate-300 shadow-sm shrink-0">
                    <Car size={28} />
                  </div>
                )}
              </div>

              <div className="px-4 pb-4 pt-3 space-y-2.5 border-t border-slate-50">
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
                      <span className="text-[24px] font-extrabold text-slate-950 tracking-tighter leading-none">₹{v.prices[selectedDuration]}</span>
                      <span className="text-[11px] font-bold text-slate-400/80 ml-0.5">{durationSuffix[selectedDuration]}</span>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => openVehicleDetail(v)}
                    className="bg-slate-950 text-white px-4 py-2.5 rounded-[12px] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-[0_6px_16px_rgba(15,23,42,0.15)] active:bg-black transition-all"
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
