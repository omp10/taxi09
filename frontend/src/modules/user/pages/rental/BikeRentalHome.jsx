import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Fuel, Shield, ChevronRight, ChevronLeft, ChevronDown, SlidersHorizontal, ArrowDownUp, Star, Info, Car, Search, X, Bike, MapPin, MessageSquare, Calendar, User, Compass, Truck, Check, Headset, Home, Clock, Sun, CalendarDays, RotateCcw, CarFront, CalendarCheck, ShieldCheck, LogOut, ClipboardCheck } from 'lucide-react';
import { userService } from '../../services/userService';
import rentalCarImg from '@/assets/images/rental_car.png';
import marutiSwiftImg from '@/assets/images/maruti_swift_nobg.png';
import marutiBalenoImg from '@/assets/images/maruti_baleno_nobg.png';
import hyundaiAuraImg from '@/assets/images/hyundai_aura_nobg.png';
import toast from 'react-hot-toast';
import HeaderGreeting from '../../components/HeaderGreeting';
import BottomNavbar from '../../components/BottomNavbar';

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



  return (
    <div className="flex min-h-screen bg-[#000000] text-white font-sans overflow-hidden">
      
      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-lg md:max-w-none md:mx-0 mx-auto relative overflow-y-auto overflow-x-hidden pb-12 md:pb-6 h-screen md:min-h-screen md:h-auto md:pt-20 no-scrollbar">
        <HeaderGreeting />
        <BottomNavbar />
        <div className="absolute -top-16 right-[-40px] h-44 w-44 rounded-full bg-[#FFC107]/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-28 right-[-40px] h-40 w-40 rounded-full bg-[#FFC107]/5 blur-3xl pointer-events-none" />

        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="sticky top-0 z-30 w-full bg-[#000000]"
        >
          <div className="bg-[#000000] px-5 pt-12 pb-5 border-b border-white/10 relative overflow-hidden">
          {/* Subtle accent gradients */}
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-[#FFC107]/5 blur-[40px] pointer-events-none" />
          <div className="absolute top-0 left-0 h-24 w-24 rounded-full bg-[#FFC107]/5 blur-[40px] pointer-events-none" />

          <div className="relative flex items-center justify-between gap-4 mb-6 md:px-2">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-lg shrink-0 group transition-all md:hidden"
              >
                <ArrowLeft size={20} className="text-black group-hover:opacity-80 transition-opacity" strokeWidth={2.5} />
              </motion.button>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FFC107] leading-none mb-1.5 md:mb-2">SELF-DRIVE RENTALS</p>
                <h1 className="text-[24px] md:text-[36px] font-[900] tracking-tight text-white leading-none">Choose <span className="text-[#FFC107]">Ride</span></h1>
                <p className="hidden md:block text-[14px] font-medium text-gray-400 mt-2">Find the perfect ride for your journey</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="px-3 py-1 md:px-5 md:py-2 rounded-full bg-[#FFC107] md:bg-[#000000] md:border md:border-[#FFC107] text-[10px] md:text-[13px] font-bold text-black md:text-[#FFC107] shadow-sm uppercase tracking-wider flex items-center gap-2">
                <Car size={16} className="hidden md:block text-[#FFC107]" />
                {availableCountLabel}
              </span>
            </div>
          </div>

          <div className="relative mb-5 md:mb-6">
            <div className="flex gap-1.5 md:gap-0 bg-[#111111] md:bg-transparent p-1.5 md:p-0 rounded-[20px] md:rounded-[14px] border border-white/10 md:border-white/10 shadow-inner md:overflow-hidden md:flex-row flex-col sm:flex-row">
              {DURATION_TABS.map((tab) => {
                const isActive = selectedDuration === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedDuration(tab)}
                    className={`relative flex-1 py-2.5 md:py-3.5 rounded-[14px] md:rounded-[12px] text-[11px] md:text-[13px] font-[800] uppercase tracking-wider transition-all duration-300 outline-none md:border-r md:border-white/10 last:border-r-0 ${isActive ? 'md:bg-[#FFC107] md:border-none' : 'md:bg-transparent md:hover:bg-white/5'}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white md:bg-[#FFC107] rounded-[14px] md:rounded-[12px] shadow-sm"
                        transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                      />
                    )}
                    <span className={`relative z-10 flex items-center justify-center transition-colors duration-300 ${isActive ? 'text-black' : 'text-gray-400'}`}>
                      {tab === 'Hourly' && <Clock size={16} className="hidden md:block mr-2" />}
                      {tab === 'Half-Day' && <Sun size={16} className="hidden md:block mr-2" />}
                      {tab === 'Daily' && <CalendarDays size={16} className="hidden md:block mr-2" />}
                      {tab}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative group flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-500 group-focus-within:text-[#FFC107] transition-colors" strokeWidth={2.5} />
              </div>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by vehicle, category or brand..."
                className="w-full h-full bg-[#1a1a1a] md:bg-[#111111] border border-white/10 md:border-white/10 focus:border-[#FFC107] focus:bg-[#1A2230] rounded-[20px] md:rounded-[12px] pl-11 pr-11 py-3.5 text-[14px] font-bold text-white placeholder:text-gray-600 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-3 flex items-center pr-1"
                >
                  <div className="h-7 w-7 flex items-center justify-center rounded-full bg-white/10 text-gray-400 hover:bg-white/20 transition-colors">
                    <X size={14} strokeWidth={3} />
                  </div>
                </button>
              )}
            </div>
            
            <button className="hidden md:flex items-center justify-center gap-2 px-6 py-3.5 bg-[#111111] border border-white/10 rounded-[12px] text-[13px] font-bold text-gray-300 hover:text-white hover:border-white/30 transition-all shrink-0">
              <SlidersHorizontal size={16} /> Filters
            </button>
          </div>

          {/* Active Filters Row (Desktop only mockup feature) */}
          <div className="hidden md:flex items-center justify-between mt-5 pb-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 px-4 py-2 bg-[#111111] border border-white/10 rounded-[8px] text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Honda Activa <X size={12} className="text-gray-500 cursor-pointer hover:text-white" />
              </span>
              <span className="px-4 py-2 bg-[#111111] border border-white/10 rounded-[8px] text-[11px] font-bold text-gray-400 uppercase tracking-wider">Bike</span>
              <span className="px-4 py-2 bg-[#111111] border border-white/10 rounded-[8px] text-[11px] font-bold text-gray-400 uppercase tracking-wider">1 Seat</span>
              <span className="px-4 py-2 bg-[#111111] border border-white/10 rounded-[8px] text-[11px] font-bold text-gray-400 uppercase tracking-wider">1 Bag Space</span>
              <span className="px-4 py-2 bg-[#111111] border border-white/10 rounded-[8px] text-[11px] font-bold text-gray-400 uppercase tracking-wider">1.20</span>
              <span className="px-4 py-2 bg-[#111111] border border-white/10 rounded-[8px] text-[11px] font-bold text-gray-400 uppercase tracking-wider">Car</span>
            </div>
            <button className="flex items-center gap-2 text-[12px] font-bold text-[#FFC107] hover:text-[#FFD54F] transition-colors uppercase tracking-wider">
              <RotateCcw size={14} /> Clear All
            </button>
          </div>

          {visibleSuggestions.length > 0 && !searchQuery && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 overflow-x-auto no-scrollbar pt-4 pb-1 md:hidden"
            >
              {visibleSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setSearchQuery(suggestion)}
                  className="shrink-0 rounded-full border border-white/10 bg-[#1a1a1a] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 shadow-sm hover:border-[#FFC107] hover:text-[#FFC107] transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </motion.header>

      <div className="px-5 md:px-8 pt-6 space-y-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDuration}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex items-center gap-3 rounded-[20px] md:rounded-[12px] border border-white/10 md:border-white/10 bg-[#1a1a1a] md:bg-[#111111] px-4 py-3.5 md:py-4 shadow-lg"
          >
            <Info size={18} className="text-[#FFC107] md:opacity-80" />
            <p className="text-[13px] font-[700] md:font-medium text-gray-300 tracking-tight md:tracking-normal leading-tight">
              {infoBanner[selectedDuration]}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="relative pt-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-[800] uppercase tracking-[0.2em] text-[#FFC107]">Available Near You</p>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] md:text-[28px] font-[900] tracking-tight text-white">Explore Fleet</h2>
            <button className="hidden md:flex items-center gap-1.5 text-[#FFC107] text-[13px] font-bold hover:underline">
              <MapPin size={16} strokeWidth={2.5} /> View on Map
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center w-full">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {CATEGORY_FILTERS.map(({ id, label, Icon }) => {
                const isActive = selectedCategoryFilter === id;
                const count = categoryCounts[id] || 0;

                return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] font-sans no-scrollbar overflow-y-auto overflow-x-hidden">
      <HeaderGreeting />
      <BottomNavbar />

      {/* Hero Section */}
      <div className="relative pt-24 md:pt-32 pb-32 md:pb-48 px-4 md:px-12 bg-cover bg-center w-full" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop')` }}>
        <div className="absolute inset-0 bg-black/50 md:bg-gradient-to-r from-black/90 via-black/60 to-transparent"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row items-center h-full">
          <div className="w-full md:w-1/2 pt-10 md:pt-0">
            <div className="border-l-[6px] border-[#FFC107] pl-4 md:pl-6 mb-8">
              <h1 className="text-4xl md:text-[64px] font-black text-white leading-[1.1] tracking-tight uppercase">
                Your Ride.<br />Your Way.
              </h1>
              <h2 className="text-4xl md:text-[64px] font-black text-[#FFC107] leading-[1.1] tracking-tight uppercase mt-2">
                TAXI09.
              </h2>
            </div>
          </div>
          <div className="hidden md:flex w-1/2 justify-end relative">
             <img src={rentalCarImg} alt="Taxi" className="w-[120%] max-w-[700px] object-contain drop-shadow-2xl translate-x-12 translate-y-8" />
          </div>
        </div>
      </div>

      {/* Booking Form overlaying Hero */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 -mt-20 md:-mt-28 w-full mb-10">
        <div className="bg-[#fcfcfc] rounded-[24px] shadow-2xl p-6 md:p-8">
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-[2px] w-10 bg-[#FFC107]"></div>
            <h3 className="text-2xl font-black text-black">Book Your Taxi</h3>
            <div className="h-[2px] w-10 bg-[#FFC107]"></div>
          </div>

          {/* Vehicle Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            {['Mini', 'Sedan', 'SUV', 'Prime'].map((type, i) => (
              <button key={type} className={`flex items-center gap-2 px-6 py-2.5 rounded-[12px] text-[14px] font-bold transition-all shadow-sm ${i === 0 ? 'bg-[#FFC107] text-black border border-[#FFC107]' : 'bg-white text-black border border-gray-200 hover:border-gray-300'}`}>
                <Car size={16} /> {type}
              </button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Left Inputs side */}
            <div className="flex-1 flex flex-col gap-4 relative">
              {/* Swap Button (Desktop Center Absolute) */}
              <div className="hidden lg:flex absolute left-1/2 top-[13%] -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm cursor-pointer hover:bg-gray-50">
                <ArrowDownUp size={16} className="text-black" />
              </div>

              {/* Row 1: Locations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative">
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-[12px] p-3 shadow-sm">
                  <MapPin size={20} className="text-green-500" />
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-semibold mb-0.5">Pickup Location</p>
                    <div className="flex items-center justify-between cursor-pointer">
                      <p className="text-[14px] text-black font-bold">Bhubaneswar</p>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-[12px] p-3 shadow-sm">
                  <MapPin size={20} className="text-red-500" />
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-semibold mb-0.5">Drop Location</p>
                    <div className="flex items-center justify-between cursor-pointer">
                      <p className="text-[14px] text-black font-bold">Where to?</p>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Dates */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-[12px] p-3 shadow-sm">
                  <Calendar size={20} className="text-black" />
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-semibold mb-0.5">Pickup Date</p>
                    <div className="flex items-center justify-between cursor-pointer">
                      <p className="text-[14px] text-black font-bold">2026-06-26</p>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-[12px] p-3 shadow-sm">
                  <Calendar size={20} className="text-black" />
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-semibold mb-0.5">Drop Date</p>
                    <div className="flex items-center justify-between cursor-pointer">
                      <p className="text-[14px] text-black font-bold">2026-06-27</p>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Times */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-[12px] p-3 shadow-sm">
                  <Clock size={20} className="text-black" />
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-semibold mb-0.5">Pickup Time</p>
                    <div className="flex items-center justify-between cursor-pointer">
                      <p className="text-[14px] text-black font-bold">06:00 PM</p>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-[12px] p-3 shadow-sm">
                  <Clock size={20} className="text-black" />
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-semibold mb-0.5">Drop Time</p>
                    <div className="flex items-center justify-between cursor-pointer">
                      <p className="text-[14px] text-black font-bold">04:00 PM</p>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Passenger, Cash, Offers */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-[12px] p-3 shadow-sm cursor-pointer hover:bg-gray-50">
                  <User size={18} className="text-black" />
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-[14px] text-black font-bold">1 Passenger</p>
                    <ChevronDown size={14} className="text-gray-400" />
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-[12px] p-3 shadow-sm cursor-pointer hover:bg-gray-50">
                  <ClipboardCheck size={18} className="text-black" />
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-[14px] text-black font-bold">Cash</p>
                    <ChevronDown size={14} className="text-gray-400" />
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-[12px] p-3 shadow-sm cursor-pointer hover:bg-gray-50">
                  <div className="bg-black text-white text-[10px] font-black rounded-sm px-1.5 py-0.5">%</div>
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-[14px] text-black font-bold">Offers</p>
                    <ChevronDown size={14} className="text-gray-400" />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Yellow Box */}
            <div className="w-full lg:w-[320px] shrink-0 bg-[#FFC107] rounded-[24px] p-8 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none"></div>
              
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6 z-10">
                <CarFront size={32} className="text-[#FFC107]" />
              </div>
              <h4 className="text-2xl font-black text-black mb-3 z-10">Ready to ride?</h4>
              <p className="text-[14px] font-semibold text-black/80 mb-8 leading-relaxed z-10">
                Find the best taxi for your journey in just a few clicks.
              </p>
              <button 
                onClick={() => toast.success("Searching for taxis...")}
                className="w-full bg-black text-white font-bold text-[15px] py-4 rounded-[12px] hover:bg-gray-900 transition-colors shadow-md z-10"
              >
                Find Taxi
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Features Row */}
      <div className="bg-[#111111] border-y border-white/10 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
            <div className="flex items-center justify-center md:justify-start gap-4 md:border-r border-white/10 last:border-0 md:px-6">
              <ShieldCheck size={28} className="text-[#FFC107]" />
              <div>
                <p className="text-[13px] font-bold text-white leading-tight">Safe & Secure</p>
                <p className="text-[13px] font-bold text-white leading-tight">Rides</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center md:justify-start gap-4 md:border-r border-white/10 last:border-0 md:px-6">
              <User size={28} className="text-[#FFC107]" />
              <div>
                <p className="text-[13px] font-bold text-white leading-tight">Verified</p>
                <p className="text-[13px] font-bold text-white leading-tight">Drivers</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-4 md:border-r border-white/10 last:border-0 md:px-6">
              <Headset size={28} className="text-[#FFC107]" />
              <div>
                <p className="text-[13px] font-bold text-white leading-tight">24x7</p>
                <p className="text-[13px] font-bold text-white leading-tight">Support</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-4 md:px-6">
              <div className="w-7 h-7 rounded-full border-2 border-[#FFC107] flex items-center justify-center">
                <span className="text-[#FFC107] font-bold text-[14px]">₹</span>
              </div>
              <div>
                <p className="text-[13px] font-bold text-white leading-tight">Affordable</p>
                <p className="text-[13px] font-bold text-white leading-tight">Fares</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BikeRentalHome;
