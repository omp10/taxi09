import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpDown,
  Bell,
  BusFront,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Heart,
  Loader2,
  MapPin,
  Repeat2,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  TicketPercent,
  Users,
  Wifi,
} from 'lucide-react';
import userBusService from '../../services/busService';
import BottomNavbar from '../../components/BottomNavbar';
import AppHeader from '../../components/AppHeader';
import api from '../../../../shared/api/axiosInstance';
import { buildBusRouteState, toPlainData } from './busNavigationState';

const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'departure-asc', label: 'Early Departure' },
  { id: 'rating-desc', label: 'Top Rated' },
];

const DEPARTURE_WINDOWS = [
  { id: 'all', label: 'Any time', chipLabel: 'Departure Time' },
  { id: 'early', label: 'Before 6 AM', chipLabel: 'Before 6 AM', from: 0, to: 360 },
  { id: 'morning', label: '6 AM - 12 PM', chipLabel: 'Morning', from: 360, to: 720 },
  { id: 'afternoon', label: '12 PM - 6 PM', chipLabel: 'Afternoon', from: 720, to: 1080 },
  { id: 'night', label: 'After 6 PM', chipLabel: 'After 6 PM', from: 1080, to: 1440 },
];

const MenuLabel = ({ children }) => (
  <p className="px-3 pb-1 pt-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-light)]">{children}</p>
);

const MenuRow = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center justify-between gap-2 rounded-[12px] px-3 py-2.5 text-left text-[12px] font-bold transition-colors ${
      active ? 'bg-[#FFF7DB] text-[var(--text)]' : 'text-[var(--text)] hover:bg-slate-50'
    }`}
  >
    <span className="truncate">{children}</span>
    {active ? <Check size={14} className="shrink-0 text-[var(--primary-dark)]" /> : null}
  </button>
);

const getRoutePrefix = (pathname = '') => (pathname.startsWith('/taxi/user') ? '/taxi/user' : '');

const splitCityName = (value = '') => String(value).split(',')[0].trim();

const formatDateParts = (dateStr) => {
  const fallback = { day: '--', weekday: 'DAY', month: 'MON', label: '' };
  if (!dateStr) return fallback;

  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return { ...fallback, label: dateStr };

  return {
    day: parsed.toLocaleDateString('en-IN', { day: '2-digit' }),
    weekday: parsed.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase(),
    month: parsed.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
    label: parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
  };
};

const addDays = (dateStr, offset) => {
  const base = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) return dateStr || '';
  base.setDate(base.getDate() + offset);
  return base.toISOString().split('T')[0];
};

const formatDurationBrief = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return 'Direct';
  return raw
    .replace(/days?/gi, 'd')
    .replace(/hours?/gi, 'h')
    .replace(/hrs?/gi, 'h')
    .replace(/minutes?/gi, 'm')
    .replace(/mins?/gi, 'm')
    .replace(/\s+/g, ' ')
    .trim();
};

const getNumericValue = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getBusCompany = (bus) =>
  String(bus?.operator || bus?.busName || bus?.travels || bus?.company || '')
    .trim();

const getBusRating = (bus) => getNumericValue(bus?.rating, 0);
const getBusRatingCount = (bus) => getNumericValue(bus?.ratingCount, 0);
const hasBusRating = (bus) => getBusRatingCount(bus) > 0;
const isHighlyRatedBus = (bus) => hasBusRating(bus) && getBusRating(bus) >= 4.5;

const hasBusDeal = (bus) => {
  const searchableText = [
    bus?.cancellationPolicy,
    bus?.offerText,
    bus?.badge,
    Array.isArray(bus?.tags) ? bus.tags.join(' ') : bus?.tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchableText.includes('free') || searchableText.includes('deal') || searchableText.includes('save');
};

const getDepartureSortValue = (bus) => {
  const raw = String(bus?.departure || '').trim();
  const match = raw.match(/(\d{1,2}):(\d{2})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 60 + Number(match[2]);
};

const getSeatLabel = (bus) => {
  const seats = getNumericValue(bus?.availableSeats, 0);
  return seats > 0 ? `${seats} Seats Left` : 'Limited Seats';
};

// Real boarding/dropping point names off the route stops the API returns.
const getStopName = (bus, stopType) => {
  const stops = Array.isArray(bus?.route?.stops) ? bus.route.stops : [];
  const wanted = stopType === 'drop' ? ['drop', 'both'] : ['pickup', 'both'];
  const stop = stops.find((item) => wanted.includes(String(item?.stopType || 'pickup').toLowerCase()));
  return String(stop?.pointName || '').trim();
};

const BusThumb = ({ index, bus }) => {
  const images = ['/taxi09_bus_hero_city.png', '/taxi09_bus_hero_night.png', '/taxi09_bus_hero_hills.png'];
  return (
    <div className="relative h-[76px] w-[92px] shrink-0 overflow-hidden rounded-[12px] bg-slate-900">
      <img src={images[index % images.length]} alt="" className="h-full w-full object-cover object-right" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-[10px] bg-[var(--success)] px-1.5 py-0.5 text-[9px] font-bold text-white">
        <Star size={8} className="fill-current" />
        {hasBusRating(bus) ? getBusRating(bus).toFixed(1) : '4.4'}
      </span>
      <span className="absolute bottom-1.5 left-1.5 rounded-[10px] bg-black/[.72] px-1.5 py-0.5 text-[8.5px] font-semibold text-white">
        {bus?.type || 'AC Sleeper'}
      </span>
    </div>
  );
};

const FilterChip = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition-colors ${
      active
        ? 'border-[#FFD54F] bg-[#fff8df] text-[var(--text)]'
        : 'border-[var(--border)] bg-white text-[var(--text)]'
    }`}
  >
    {children}
  </button>
);

const BusList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routePrefix = useMemo(() => getRoutePrefix(location.pathname), [location.pathname]);
  const state = location.state || {};
  const [fromCity, setFromCity] = useState(state.fromCity);
  const [toCity, setToCity] = useState(state.toCity);
  const [routeOptions, setRouteOptions] = useState([]);
  const [banners, setBanners] = useState([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  // Date lives in local state so the date strip can re-search without a re-navigate.
  const [date, setDate] = useState(state.date);
  const [dateWindowOffset, setDateWindowOffset] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buses, setBuses] = useState([]);
  const [sortBy, setSortBy] = useState('recommended');
  const [showDealsOnly, setShowDealsOnly] = useState(false);
  const [showHighlyRatedOnly, setShowHighlyRatedOnly] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedBusType, setSelectedBusType] = useState('All');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [departureWindow, setDepartureWindow] = useState('all');
  const [openMenu, setOpenMenu] = useState(null);
  const sortMenuRef = useRef(null);

  useEffect(() => {
    if (!fromCity || !toCity || !date) {
      navigate(`${routePrefix}/bus`, { replace: true });
      return;
    }

    let active = true;

    const loadResults = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await userBusService.searchBuses({ fromCity, toCity, date });
        if (!active) return;
        const results = Array.isArray(response?.data?.results) ? response.data.results : [];
        setBuses(Array.isArray(results) ? toPlainData(results) || [] : []);
      } catch (err) {
        if (!active) return;
        setError(err?.message || 'Failed to search buses');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadResults();
    return () => {
      active = false;
    };
  }, [date, fromCity, navigate, routePrefix, toCity]);

  useEffect(() => {
    if (!openMenu) return undefined;

    const handlePointerDown = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpenMenu(null);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openMenu]);

  const sortOption = useMemo(
    () => SORT_OPTIONS.find((option) => option.id === sortBy) || SORT_OPTIONS[0],
    [sortBy]
  );

  const busCompanies = useMemo(() => {
    const uniqueCompanies = Array.from(
      new Set((Array.isArray(buses) ? buses : []).map((bus) => getBusCompany(bus)).filter(Boolean))
    );
    return uniqueCompanies.sort((left, right) => left.localeCompare(right));
  }, [buses]);

  const busTypeOptions = useMemo(() => {
    const types = new Set();
    (Array.isArray(buses) ? buses : []).forEach((bus) => {
      const value = String(bus?.type || '').trim();
      if (value) types.add(value);
    });
    return Array.from(types).sort((left, right) => left.localeCompare(right));
  }, [buses]);

  const amenityOptions = useMemo(() => {
    const items = new Set();
    (Array.isArray(buses) ? buses : []).forEach((bus) => {
      (Array.isArray(bus?.amenities) ? bus.amenities : []).forEach((amenity) => {
        const value = String(amenity || '').trim();
        if (value) items.add(value);
      });
    });
    return Array.from(items).sort((left, right) => left.localeCompare(right));
  }, [buses]);

  const toggleMenu = (menu) => setOpenMenu((current) => (current === menu ? null : menu));

  const toggleAmenity = (amenity) =>
    setSelectedAmenities((current) =>
      current.includes(amenity) ? current.filter((item) => item !== amenity) : [...current, amenity],
    );

  const resetFilters = () => {
    setSortBy('recommended');
    setDepartureWindow('all');
    setSelectedBusType('All');
    setSelectedAmenities([]);
    setSelectedCompany('all');
    setShowDealsOnly(false);
    setShowHighlyRatedOnly(false);
  };

  const visibleBuses = useMemo(() => {
    const nextBuses = Array.isArray(buses) ? [...buses] : [];
    const filteredBuses = nextBuses.filter((bus) => {
      const busType = String(bus?.type || '').toLowerCase();
      const amenities = Array.isArray(bus?.amenities) ? bus.amenities.map((item) => String(item).toLowerCase()) : [];

      if (showDealsOnly && !hasBusDeal(bus)) return false;
      if (showHighlyRatedOnly && !isHighlyRatedBus(bus)) return false;
      if (selectedCompany !== 'all' && getBusCompany(bus) !== selectedCompany) return false;
      if (selectedBusType !== 'All' && busType !== selectedBusType.toLowerCase()) return false;
      if (selectedAmenities.length && !selectedAmenities.every((wanted) => amenities.includes(wanted.toLowerCase()))) {
        return false;
      }
      if (departureWindow !== 'all') {
        const window = DEPARTURE_WINDOWS.find((item) => item.id === departureWindow);
        const minutes = getDepartureSortValue(bus);
        if (!window || minutes === Number.MAX_SAFE_INTEGER) return false;
        if (minutes < window.from || minutes >= window.to) return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') {
      filteredBuses.sort(
        (left, right) => getNumericValue(left?.price, Number.MAX_SAFE_INTEGER) - getNumericValue(right?.price, Number.MAX_SAFE_INTEGER)
      );
    } else if (sortBy === 'departure-asc') {
      filteredBuses.sort((left, right) => getDepartureSortValue(left) - getDepartureSortValue(right));
    } else if (sortBy === 'rating-desc') {
      filteredBuses.sort((left, right) => {
        const ratingDelta = getBusRating(right) - getBusRating(left);
        if (ratingDelta !== 0) return ratingDelta;
        return getBusRatingCount(right) - getBusRatingCount(left);
      });
    }

    return filteredBuses;
  }, [buses, departureWindow, selectedAmenities, selectedBusType, selectedCompany, showDealsOnly, showHighlyRatedOnly, sortBy]);

  const dateChips = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(state.date, index + dateWindowOffset)),
    [dateWindowOffset, state.date]
  );

  // Route list powers the editable From/To pickers.
  useEffect(() => {
    let active = true;
    userBusService
      .getRoutes()
      .then((response) => {
        if (!active) return;
        const results = Array.isArray(response?.data?.results) ? response.data.results : [];
        setRouteOptions(results);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get('/users/banners?type=top')
      .then((response) => {
        if (!active) return;
        const payload = response?.data?.data || response?.data || {};
        setBanners(Array.isArray(payload.results) ? payload.results : []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return undefined;
    const timer = setInterval(() => setBannerIndex((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const originOptions = useMemo(() => {
    const cities = new Set();
    routeOptions.forEach((route) => {
      const value = String(route?.fromCity || '').trim();
      if (value) cities.add(value);
    });
    return Array.from(cities).sort((left, right) => left.localeCompare(right));
  }, [routeOptions]);

  const destinationOptions = useMemo(() => {
    const cities = new Set();
    routeOptions.forEach((route) => {
      if (String(route?.fromCity || '').trim().toLowerCase() !== String(fromCity || '').trim().toLowerCase()) return;
      const value = String(route?.toCity || '').trim();
      if (value) cities.add(value);
    });
    return Array.from(cities).sort((left, right) => left.localeCompare(right));
  }, [fromCity, routeOptions]);

  // Keep the destination bookable whenever the origin changes.
  useEffect(() => {
    if (!destinationOptions.length) return;
    if (destinationOptions.some((city) => city.toLowerCase() === String(toCity || '').toLowerCase())) return;
    setToCity(destinationOptions[0]);
  }, [destinationOptions, toCity]);

  const resolveBannerImage = (img) => {
    if (!img) return '';
    if (img.startsWith('data:') || img.startsWith('http') || img.startsWith('/')) return img;
    const origin = globalThis.__LEGACY_BACKEND_ORIGIN__ || window.location.origin;
    return `${origin}/${img}`;
  };

  const todayKey = useMemo(() => new Date().toISOString().split('T')[0], []);
  const passengers = getNumericValue(state.passengers, 1) || 1;
  const originStopName = useMemo(() => getStopName(buses[0], 'pickup'), [buses]);
  const destinationStopName = useMemo(() => getStopName(buses[0], 'drop'), [buses]);

  const handleSelect = (bus) => {
    navigate(`${routePrefix}/bus/details`, {
      state: buildBusRouteState({ ...state, fromCity, toCity, date }, { bus }),
    });
  };


  const activeFilterCount = [
    showDealsOnly,
    showHighlyRatedOnly,
    selectedCompany !== 'all',
    selectedBusType !== 'All',
    selectedAmenities.length > 0,
    departureWindow !== 'all',
    sortBy !== 'recommended',
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-[var(--background)] pb-40 text-[var(--text)] shadow-2xl">
      <AppHeader showBack subtitle="BUS BOOKING" />

      <div className="rounded-b-[28px] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.35),transparent_40%),linear-gradient(180deg,#FFD43B,#FFC107)] px-4 pb-4 pt-3">
        <section className="rounded-[18px] bg-white p-3 shadow-[var(--shadow-md)]">
          <div className="flex gap-2.5">
            <div className="relative min-w-0 flex-1 space-y-2.5">
              <div className="flex gap-2">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full border-[2.5px] border-[var(--primary)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[var(--text-light)]">From</p>
                  <select
                    value={fromCity}
                    onChange={(event) => setFromCity(event.target.value)}
                    className="-ml-0.5 w-full min-w-0 appearance-none truncate bg-transparent text-[14px] font-extrabold leading-tight text-[var(--text)] outline-none"
                  >
                    {!originOptions.includes(fromCity) && <option value={fromCity}>{fromCity}</option>}
                    {originOptions.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {originStopName ? (
                    <p className="truncate text-[9px] font-medium text-[var(--text-light)]">{originStopName}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex gap-2">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[var(--text-light)]">To</p>
                  <select
                    value={toCity}
                    onChange={(event) => setToCity(event.target.value)}
                    className="-ml-0.5 w-full min-w-0 appearance-none truncate bg-transparent text-[14px] font-extrabold leading-tight text-[var(--text)] outline-none"
                  >
                    {!destinationOptions.includes(toCity) && <option value={toCity}>{toCity}</option>}
                    {destinationOptions.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {destinationStopName ? (
                    <p className="truncate text-[9px] font-medium text-[var(--text-light)]">{destinationStopName}</p>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFromCity(toCity);
                  setToCity(fromCity);
                }}
                className="absolute right-1 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[var(--primary)] text-[var(--text)] shadow-[0_4px_10px_rgba(245,183,0,.4)] active:scale-95 transition-transform"
                aria-label="Swap cities"
              >
                <Repeat2 size={13} strokeWidth={2.8} />
              </button>
            </div>

            <div className="w-px shrink-0 bg-[var(--border)]" />

            <div className="w-[100px] shrink-0 space-y-2.5">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[var(--text-light)]">Date</p>
                <p className="mt-0.5 flex items-center gap-1 text-[10.5px] font-extrabold text-[var(--text)]">
                  <CalendarDays size={11} className="shrink-0 text-[var(--text-light)]" strokeWidth={2.5} />
                  {formatDateParts(date).label}
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`${routePrefix}/bus`)}
                  className="mt-0.5 text-[9.5px] font-bold text-[var(--primary-dark)]"
                >
                  Change
                </button>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[var(--text-light)]">Passengers</p>
                <p className="mt-0.5 flex items-center gap-1 text-[10.5px] font-extrabold text-[var(--text)]">
                  <Users size={11} className="shrink-0 text-[var(--text-light)]" strokeWidth={2.5} />
                  {passengers} Passenger{passengers === 1 ? '' : 's'}
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`${routePrefix}/bus`)}
                  className="mt-0.5 text-[9.5px] font-bold text-[var(--primary-dark)]"
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <main className="px-3 pb-4">
        {banners.length > 0 ? (
          <section className="mt-3">
            <div
              onClick={() => navigate(banners[bannerIndex]?.redirect_url || `${routePrefix}/promo`)}
              className="relative w-full cursor-pointer select-none overflow-hidden rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)]"
            >
              <div
                className="flex w-full transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${bannerIndex * 100}%)` }}
              >
                {banners.map((banner, idx) => (
                  <img
                    key={banner?._id || idx}
                    src={resolveBannerImage(banner?.image)}
                    alt="Offer banner"
                    className="block h-auto w-full shrink-0"
                    draggable={false}
                  />
                ))}
              </div>
              {banners.length > 1 ? (
                <div className="absolute bottom-2.5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
                  {banners.map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 w-1.5 rounded-full transition-all ${idx === bannerIndex ? 'bg-[var(--primary)]' : 'bg-white/70'}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="mt-2 flex items-center gap-1.5">

          <button
            type="button"
            onClick={() => setDateWindowOffset((current) => current - 1)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm active:scale-95"
            aria-label="Previous days"
          >
            <ChevronLeft size={16} strokeWidth={2.6} />
          </button>
          <div className="flex flex-1 gap-1.5 overflow-x-auto py-2 no-scrollbar">
            {dateChips.map((chipDate) => {
              const parts = formatDateParts(chipDate);
              const active = chipDate === date;
              const isPast = chipDate < todayKey;
              return (
                <button
                  key={chipDate}
                  type="button"
                  disabled={isPast}
                  onClick={() => setDate(chipDate)}
                  className={`w-[54px] shrink-0 rounded-[16px] px-1 py-2 text-center shadow-[var(--shadow-sm)] transition-transform active:scale-95 ${
                    active
                      ? 'bg-[linear-gradient(180deg,#FFD54F,#FFC107)] text-[var(--text)]'
                      : isPast
                        ? 'bg-white text-slate-300'
                        : 'bg-white text-[var(--text-light)]'
                  }`}
                >
                  <p className="text-[8px] font-bold">{parts.weekday}</p>
                  <p className="text-[17px] font-extrabold leading-tight">{parts.day}</p>
                  <p className="text-[8px] font-semibold">{parts.month}</p>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setDateWindowOffset((current) => current + 1)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm active:scale-95"
            aria-label="Next days"
          >
            <ChevronRight size={16} strokeWidth={2.6} />
          </button>
        </section>

        <section ref={sortMenuRef} className="relative">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <FilterChip active={openMenu === 'sort' || sortBy !== 'recommended'} onClick={() => toggleMenu('sort')}>
              <SlidersHorizontal size={13} /> {sortOption.id === 'recommended' ? 'Sort By' : sortOption.label}
              <ChevronDown size={12} className={openMenu === 'sort' ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </FilterChip>
            <FilterChip active={openMenu === 'departure' || departureWindow !== 'all'} onClick={() => toggleMenu('departure')}>
              <Clock3 size={13} /> {DEPARTURE_WINDOWS.find((w) => w.id === departureWindow)?.chipLabel || 'Departure Time'}
              <ChevronDown size={12} className={openMenu === 'departure' ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </FilterChip>
            <FilterChip active={openMenu === 'type' || selectedBusType !== 'All'} onClick={() => toggleMenu('type')}>
              <BusFront size={13} /> {selectedBusType === 'All' ? 'Bus Type' : selectedBusType}
              <ChevronDown size={12} className={openMenu === 'type' ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </FilterChip>
            <FilterChip active={openMenu === 'amenities' || selectedAmenities.length > 0} onClick={() => toggleMenu('amenities')}>
              <Wifi size={13} /> Amenities
              {selectedAmenities.length > 0 ? (
                <span className="rounded-full bg-[var(--primary)] px-1.5 text-[9px]">{selectedAmenities.length}</span>
              ) : (
                <ChevronDown size={12} className={openMenu === 'amenities' ? 'rotate-180 transition-transform' : 'transition-transform'} />
              )}
            </FilterChip>
            <FilterChip active={openMenu === 'filters' || activeFilterCount > 0} onClick={() => toggleMenu('filters')}>
              <Filter size={13} /> Filters
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-[var(--primary)] px-1.5 text-[9px]">{activeFilterCount}</span>
              ) : null}
            </FilterChip>
          </div>

          {openMenu ? (
            <div className="absolute left-0 top-[46px] z-30 w-[min(21rem,calc(100vw-1.5rem))] rounded-[18px] border border-[var(--border)] bg-white p-2 shadow-[var(--shadow-lg)]">
              {openMenu === 'sort' ? (
                <>
                  <MenuLabel>Sort buses by</MenuLabel>
                  {SORT_OPTIONS.map((option) => (
                    <MenuRow
                      key={option.id}
                      active={sortBy === option.id}
                      onClick={() => {
                        setSortBy(option.id);
                        setOpenMenu(null);
                      }}
                    >
                      {option.label}
                    </MenuRow>
                  ))}
                </>
              ) : null}

              {openMenu === 'departure' ? (
                <>
                  <MenuLabel>Departure time</MenuLabel>
                  {DEPARTURE_WINDOWS.map((window) => (
                    <MenuRow
                      key={window.id}
                      active={departureWindow === window.id}
                      onClick={() => {
                        setDepartureWindow(window.id);
                        setOpenMenu(null);
                      }}
                    >
                      {window.label}
                    </MenuRow>
                  ))}
                </>
              ) : null}

              {openMenu === 'type' ? (
                <>
                  <MenuLabel>Bus type</MenuLabel>
                  <MenuRow
                    active={selectedBusType === 'All'}
                    onClick={() => {
                      setSelectedBusType('All');
                      setOpenMenu(null);
                    }}
                  >
                    All types
                  </MenuRow>
                  {busTypeOptions.length === 0 ? (
                    <p className="px-3 py-2 text-[11px] font-semibold text-[var(--text-light)]">
                      No bus types on this route yet.
                    </p>
                  ) : null}
                  {busTypeOptions.map((type) => (
                    <MenuRow
                      key={type}
                      active={selectedBusType === type}
                      onClick={() => {
                        setSelectedBusType(type);
                        setOpenMenu(null);
                      }}
                    >
                      {type}
                    </MenuRow>
                  ))}
                </>
              ) : null}

              {openMenu === 'amenities' ? (
                <>
                  <MenuLabel>Amenities</MenuLabel>
                  {amenityOptions.length === 0 ? (
                    <p className="px-3 py-2 text-[11px] font-semibold text-[var(--text-light)]">
                      No amenities listed on this route.
                    </p>
                  ) : null}
                  <div className="max-h-[220px] overflow-y-auto">
                    {amenityOptions.map((amenity) => (
                      <MenuRow
                        key={amenity}
                        active={selectedAmenities.includes(amenity)}
                        onClick={() => toggleAmenity(amenity)}
                      >
                        {amenity}
                      </MenuRow>
                    ))}
                  </div>
                  {selectedAmenities.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setSelectedAmenities([])}
                      className="mt-1 w-full rounded-[12px] py-2 text-[11px] font-bold text-[var(--primary-dark)]"
                    >
                      Clear amenities
                    </button>
                  ) : null}
                </>
              ) : null}

              {openMenu === 'filters' ? (
                <>
                  <MenuLabel>Quick filters</MenuLabel>
                  <MenuRow active={showDealsOnly} onClick={() => setShowDealsOnly((current) => !current)}>
                    Deals &amp; free cancellation
                  </MenuRow>
                  <MenuRow active={showHighlyRatedOnly} onClick={() => setShowHighlyRatedOnly((current) => !current)}>
                    Highly rated (4.5+)
                  </MenuRow>

                  <MenuLabel>Operator</MenuLabel>
                  <div className="max-h-[180px] overflow-y-auto">
                    <MenuRow active={selectedCompany === 'all'} onClick={() => setSelectedCompany('all')}>
                      All operators
                    </MenuRow>
                    {busCompanies.map((company) => (
                      <MenuRow
                        key={company}
                        active={selectedCompany === company}
                        onClick={() => setSelectedCompany(company)}
                      >
                        {company}
                      </MenuRow>
                    ))}
                  </div>

                  <div className="mt-2 flex gap-2 border-t border-[var(--border)] pt-2">
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="flex-1 rounded-[12px] border border-[var(--border)] py-2.5 text-[11px] font-bold text-[var(--text)]"
                    >
                      Reset all
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenMenu(null)}
                      className="flex-1 rounded-[12px] bg-[linear-gradient(180deg,#FFD54F,#FFC107)] py-2.5 text-[11px] font-extrabold text-[var(--text)]"
                    >
                      Show {visibleBuses.length} buses
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </section>

        {loading ? (
          <div className="mt-4 rounded-[18px] bg-white p-10 text-center shadow-sm">
            <Loader2 size={30} className="mx-auto animate-spin text-[#f5b700]" />
            <p className="mt-3 text-sm font-black text-slate-500">Finding available buses...</p>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="mt-4 rounded-[16px] border border-rose-100 bg-rose-50 p-4 text-sm font-black text-rose-600">{error}</div>
        ) : null}

        {!loading && !error && buses.length > 0 ? (
          <section className="mt-2 rounded-[var(--radius-sm)] bg-[linear-gradient(90deg,#FFF7DB,#fff)] px-4 py-3 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[10px] font-black text-slate-800">
                <TicketPercent size={13} className="text-[#d08a00]" />
                {visibleBuses.length} Buses Found
              </p>
              <p className="flex items-center gap-1 text-[9px] font-bold text-slate-600">
                Showing lowest price first <ArrowUpDown size={11} />
              </p>
            </div>
          </section>
        ) : null}

        {!loading && !error && visibleBuses.length === 0 ? (
          <div className="mt-4 rounded-[18px] bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-black text-slate-950">No buses found</h2>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Try changing filters or searching for another date.
            </p>
          </div>
        ) : null}

        {!loading && !error ? (
          <section className="mt-2.5 space-y-2.5">
            {visibleBuses.map((bus, index) => {
              const rated = hasBusRating(bus);
              const topAmenities = Array.isArray(bus.amenities) ? bus.amenities.slice(0, 4) : [];
              const price = Number(bus.price || 0).toLocaleString('en-IN');
              const boardingPoint = getStopName(bus, 'pickup');
              const droppingPoint = getStopName(bus, 'drop');

              return (
                <motion.article
                  key={bus.id || `${getBusCompany(bus)}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.035 }}
                  className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]"
                >
                  <button type="button" onClick={() => handleSelect(bus)} className="w-full p-2.5 text-left">
                    <div className="flex gap-3">
                      <BusThumb index={index} bus={bus} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-[13.5px] font-extrabold leading-tight text-[var(--text)]">
                              {getBusCompany(bus) || 'Bus Service'}
                            </h3>
                            <p className="mt-0.5 truncate text-[9px] font-medium text-[var(--text-light)]">
                              {bus?.type || 'AC Sleeper'}
                              {bus?.busName && bus.busName !== getBusCompany(bus) ? ` · ${bus.busName}` : ''}
                            </p>
                          </div>
                          <Heart size={15} className="shrink-0 text-slate-300" strokeWidth={2.3} />
                        </div>

                        <div className="mt-2 grid grid-cols-[1fr_50px_1fr] items-start gap-1">
                          <div className="min-w-0">
                            <p className="text-[14px] font-extrabold leading-none text-[var(--text)]">{bus.departure || '--:--'}</p>
                            <p className="mt-0.5 truncate text-[9px] font-bold text-slate-600">{splitCityName(fromCity)}</p>
                            {boardingPoint ? (
                              <p className="truncate text-[8px] font-medium text-slate-400">{boardingPoint}</p>
                            ) : null}
                          </div>
                          <div className="text-center">
                            <p className="text-[8.5px] font-semibold text-[var(--text-light)]">{formatDurationBrief(bus.duration)}</p>
                            <div className="my-1 h-px bg-slate-200" />
                            <BusFront size={11} className="mx-auto text-slate-400" />
                          </div>
                          <div className="min-w-0 text-right">
                            <p className="text-[14px] font-extrabold leading-none text-[var(--text)]">{bus.arrival || '--:--'}</p>
                            <p className="mt-0.5 truncate text-[9px] font-bold text-slate-600">{splitCityName(toCity)}</p>
                            {droppingPoint ? (
                              <p className="truncate text-[8px] font-medium text-slate-400">{droppingPoint}</p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    {topAmenities.length ? (
                      <div className="mt-2 flex flex-wrap gap-x-2.5 gap-y-1 text-[8.5px] font-medium text-[var(--text-light)]">
                        {topAmenities.map((amenity) => (
                          <span key={amenity} className="flex items-center gap-1">
                            <ShieldCheck size={9} className="shrink-0 text-slate-400" />
                            {amenity}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-y-1.5 border-t border-[var(--border)] pt-2">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8.5px] font-bold text-[var(--success)]">
                          {getSeatLabel(bus)}
                        </span>
                        {rated ? (
                          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[8.5px] font-bold text-amber-700">
                            <Star size={10} className="fill-current" />
                            {getBusRating(bus).toFixed(1)}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="text-right">
                          <p className="text-[17px] font-extrabold leading-none text-[var(--text)]">Rs{price}</p>
                          <p className="text-[8px] font-medium text-[var(--text-light)]">per seat</p>
                        </div>
                        <span className="rounded-[11px] bg-[linear-gradient(180deg,#FFD54F,#FFC107)] px-3 py-2 text-[10px] font-extrabold text-[var(--text)] shadow-[0_6px_14px_rgba(255,193,7,.35)]">
                          View Seats
                        </span>
                      </div>
                    </div>
                  </button>
                </motion.article>
              );
            })}
          </section>
        ) : null}
      </main>

      {/* Sticky modify-search bar, sits directly above the tab bar */}
      <div className="fixed bottom-[68px] left-1/2 z-40 w-full max-w-lg -translate-x-1/2 px-3">
        <div className="flex items-center gap-2 rounded-[var(--radius)] bg-white px-4 py-3 shadow-[var(--shadow-lg)]">
          <div className="grid min-w-0 flex-1 grid-cols-3 gap-2">
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">From</p>
              <p className="truncate text-[10.5px] font-black text-slate-950">{splitCityName(fromCity)}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">To</p>
              <p className="truncate text-[10.5px] font-black text-slate-950">{splitCityName(toCity)}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">Date</p>
              <p className="truncate text-[10.5px] font-black text-slate-950">{formatDateParts(date).label}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`${routePrefix}/bus`)}
            className="flex shrink-0 items-center gap-1.5 rounded-[16px] border-2 border-[var(--primary)] bg-white px-3 py-2.5 text-[11px] font-semibold text-[var(--text)] active:bg-[#FFF7DB] transition-colors"
          >
            <SlidersHorizontal size={12} strokeWidth={2.8} />
            Modify
          </button>
        </div>
      </div>

      <BottomNavbar />
    </div>
  );
};

export default BusList;
