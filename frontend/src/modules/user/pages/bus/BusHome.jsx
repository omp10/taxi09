import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  BusFront,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Loader2,
  MapPin,
  Repeat2,
  Search,
  ShieldCheck,
  TicketPercent,
  Timer,
  X,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettings } from '../../../../shared/context/SettingsContext';
import userBusService from '../../services/busService';
import BottomNavbar from '../../components/BottomNavbar';

const isEnabledFlag = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(String(value || '').trim().toLowerCase());
};

const getRoutePrefix = (pathname = '') => (pathname.startsWith('/taxi/user') ? '/taxi/user' : '');

const getDateOffset = (offset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0];
};

const formatDateKey = (value) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthStart = (value) => new Date(value.getFullYear(), value.getMonth(), 1);
const addMonths = (value, amount) => new Date(value.getFullYear(), value.getMonth() + amount, 1);

const buildCalendarDays = (monthDate) => {
  const start = getMonthStart(monthDate);
  const startOffset = (start.getDay() + 6) % 7;
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const value = new Date(gridStart);
    value.setDate(gridStart.getDate() + index);
    return value;
  });
};

const normalizeCity = (value = '') => value.trim().toLowerCase();

// "Indore, MP" -> "Indore" for compact route labels.
const splitCityName = (value = '') => String(value).split(',')[0].trim();

const formatDisplayDate = (value) => {
  if (!value) return '';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const routePalettes = [
  'from-[#e8fff2] via-[#f7fffb] to-[#fff8df]',
  'from-[#f4ecff] via-[#fffaff] to-[#fff1d4]',
  'from-[#e8f7ff] via-[#fbfdff] to-[#fff4dc]',
  'from-[#fff0df] via-[#fffaf4] to-[#eaf7ff]',
];

const routeAccents = ['#16a34a', '#7c3aed', '#0284c7', '#f59e0b'];


const trustItems = [
  { icon: BusFront, title: 'Wide Range of Buses', subtitle: 'AC, Non AC, Sleeper & more', tone: 'text-[#f5b700]' },
  { icon: TicketPercent, title: 'Easy Cancellation', subtitle: 'Hassle-free refunds', tone: 'text-slate-900' },
  { icon: ShieldCheck, title: 'Secure Payments', subtitle: '100% safe & encrypted', tone: 'text-[#f5b700]' },
  { icon: Zap, title: 'Instant Booking', subtitle: 'Quick confirmation', tone: 'text-[#f5b700]' },
];

const featurePills = [
  { icon: TicketPercent, title: 'Best Prices', subtitle: 'Guaranteed' },
  { icon: MapPin, title: 'Live Tracking', subtitle: 'On Your Journey' },
  { icon: Headphones, title: '24/7 Support', subtitle: 'Always Here' },
];

const heroSlides = [
  {
    image: '/taxi09_bus_hero_city.png',
    title: 'Your Journey,\nOur Priority',
    subtitle: 'Book bus tickets anytime,\nanywhere with ease.',
    gradient: 'from-[#ffd54a] via-[#ffd54a]/82 via-42% to-transparent',
  },
  {
    image: '/taxi09_bus_hero_hills.png',
    title: 'Scenic Routes,\nEasy Booking',
    subtitle: 'Find clean buses for\nweekend getaways.',
    gradient: 'from-[#f8d85b] via-[#f8d85b]/78 via-40% to-transparent',
  },
  {
    image: '/taxi09_bus_hero_night.png',
    title: 'Night Travel,\nStill Covered',
    subtitle: 'Verified buses with\n24/7 support.',
    gradient: 'from-[#f4b312] via-[#f4b312]/82 via-40% to-transparent',
  },
];

const offerSlides = [
  {
    eyebrow: 'Flat',
    title: '15%',
    suffix: 'OFF',
    subtitle: 'on your first bus booking',
    code: 'FIRST15',
    art: 'gift',
    tone: 'from-[#fffcf4] via-[#fff9ea] to-[#fdf3dd]',
  },
  {
    eyebrow: 'Safe Ride',
    title: '100%',
    suffix: 'TRUST',
    subtitle: 'verified buses and operators',
    code: 'SAFEBUS',
    art: 'safe',
    tone: 'from-[#f1fff6] via-[#effcf4] to-[#e4f8ed]',
  },
  {
    eyebrow: 'Cashback',
    title: 'Rs250',
    suffix: 'BACK',
    subtitle: 'on selected active routes',
    code: 'BUS250',
    art: 'wallet',
    tone: 'from-[#f7f2ff] via-[#f1ecff] to-[#fff8e2]',
  },
];

// Offer resets every 3 hours so the countdown always shows a live window.
const OFFER_WINDOW_MS = 3 * 60 * 60 * 1000;

const getOfferRemaining = () => {
  const remaining = OFFER_WINDOW_MS - (Date.now() % OFFER_WINDOW_MS);
  const totalSeconds = Math.floor(remaining / 1000);
  return {
    hrs: String(Math.floor(totalSeconds / 3600)).padStart(2, '0'),
    mins: String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0'),
    secs: String(totalSeconds % 60).padStart(2, '0'),
  };
};

const GiftBoxArt = () => (
  <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
    <g opacity="0.85" fill="#f7c948">
      <circle cx="16" cy="30" r="3" /><circle cx="104" cy="42" r="2.5" />
      <rect x="12" y="62" width="6" height="3" rx="1.5" transform="rotate(-25 12 62)" />
      <rect x="100" y="72" width="7" height="3" rx="1.5" transform="rotate(20 100 72)" />
      <circle cx="26" cy="88" r="2.5" /><circle cx="96" cy="20" r="2" />
    </g>
    <rect x="26" y="56" width="68" height="44" rx="5" fill="#f5b700" />
    <rect x="26" y="56" width="68" height="12" rx="4" fill="#ffd449" />
    <rect x="52" y="56" width="16" height="44" fill="#ff9f1c" />
    <path d="M60 56c-14 0-22-6-22-14s12-8 22 14z" fill="#ff8c00" />
    <path d="M60 56c14 0 22-6 22-14s-12-8-22 14z" fill="#ffa62b" />
    <circle cx="60" cy="52" r="6" fill="#ff8c00" />
  </svg>
);

const WalletArt = () => (
  <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
    <circle cx="86" cy="34" r="13" fill="#f5b700" />
    <circle cx="86" cy="34" r="9" fill="#ffd449" />
    <circle cx="34" cy="86" r="9" fill="#f5b700" />
    <rect x="20" y="42" width="76" height="52" rx="12" fill="#6d5bd0" />
    <rect x="20" y="42" width="76" height="16" rx="8" fill="#8271e0" />
    <rect x="58" y="60" width="42" height="20" rx="8" fill="#5a49bd" />
    <circle cx="74" cy="70" r="5" fill="#ffd449" />
  </svg>
);

const SafeTravelArt = () => (
  <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
    <circle cx="60" cy="60" r="46" fill="#d9f5e4" />
    <path d="M60 24l26 11v22c0 17-11 30-26 35-15-5-26-18-26-35V35z" fill="#22c55e" />
    <path d="M47 60l9 9 18-18" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const renderOfferArt = (type) => {
  if (type === 'safe') return <SafeTravelArt />;
  if (type === 'wallet') return <WalletArt />;
  return <GiftBoxArt />;
};

const BusHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const routePrefix = useMemo(() => getRoutePrefix(location.pathname), [location.pathname]);
  const busEnabled = isEnabledFlag(settings.transportRide?.enable_bus_service);

  const [fromCity, setFromCity] = useState('Indore, MP');
  const [toCity, setToCity] = useState('Bhopal, MP');
  const [date, setDate] = useState(getDateOffset(0));
  const [error, setError] = useState('');
  const [routeSuggestions, setRouteSuggestions] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => getMonthStart(new Date(`${getDateOffset(0)}T00:00:00`)));
  const [offerCountdown, setOfferCountdown] = useState(getOfferRemaining);
  const [heroIndex, setHeroIndex] = useState(0);
  const [offerIndex, setOfferIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setOfferCountdown(getOfferRemaining()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setHeroIndex((current) => (current + 1) % heroSlides.length), 4200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setOfferIndex((current) => (current + 1) % offerSlides.length), 3600);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!busEnabled) {
      setRouteSuggestions([]);
      return;
    }

    let active = true;

    const loadRoutes = async () => {
      setRoutesLoading(true);
      setRoutesError('');
      try {
        const response = await userBusService.getRoutes();
        if (!active) return;
        const results = Array.isArray(response?.data?.results) ? response.data.results : [];
        setRouteSuggestions(results);

        if (!results.length) return;

        const preferredRoute =
          results.find(
            (route) =>
              normalizeCity(route?.fromCity) === normalizeCity('Indore') &&
              normalizeCity(route?.toCity) === normalizeCity('Bhopal')
          ) || results[0];

        if (preferredRoute?.fromCity) setFromCity(preferredRoute.fromCity);
        if (preferredRoute?.toCity) setToCity(preferredRoute.toCity);
      } catch (err) {
        if (!active) return;
        setRoutesError(err?.message || 'Failed to load route suggestions');
      } finally {
        if (active) setRoutesLoading(false);
      }
    };

    loadRoutes();

    return () => {
      active = false;
    };
  }, [busEnabled]);

  // Origins come from real routes; destinations are limited to what actually
  // departs from the chosen origin, so a user can only build a bookable pair.
  const originOptions = useMemo(() => {
    const cities = new Set();
    routeSuggestions.forEach((route) => {
      const value = String(route?.fromCity || '').trim();
      if (value) cities.add(value);
    });
    return Array.from(cities).sort((left, right) => left.localeCompare(right));
  }, [routeSuggestions]);

  const destinationOptions = useMemo(() => {
    const cities = new Set();
    routeSuggestions.forEach((route) => {
      if (normalizeCity(route?.fromCity) !== normalizeCity(fromCity)) return;
      const value = String(route?.toCity || '').trim();
      if (value) cities.add(value);
    });
    return Array.from(cities).sort((left, right) => left.localeCompare(right));
  }, [fromCity, routeSuggestions]);

  // Keep the destination valid whenever the origin changes.
  useEffect(() => {
    if (!destinationOptions.length) return;
    if (destinationOptions.some((city) => normalizeCity(city) === normalizeCity(toCity))) return;
    setToCity(destinationOptions[0]);
  }, [destinationOptions, toCity]);

  const matchingRoute = useMemo(
    () =>
      routeSuggestions.find(
        (route) =>
          normalizeCity(route?.fromCity) === normalizeCity(fromCity) &&
          normalizeCity(route?.toCity) === normalizeCity(toCity)
      ) || null,
    [fromCity, routeSuggestions, toCity]
  );

  const featuredRoutes = useMemo(() => routeSuggestions.slice(0, 4), [routeSuggestions]);
  const selectedDateValue = useMemo(() => (date ? new Date(`${date}T00:00:00`) : null), [date]);
  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const monthLabel = useMemo(
    () =>
      calendarMonth.toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      }),
    [calendarMonth]
  );

  const handleSearch = () => {
    const source = fromCity.trim();
    const destination = toCity.trim();

    if (!busEnabled) {
      setError('Bus service is disabled right now.');
      return;
    }
    if (!source || !destination) {
      setError('Choose both source and destination first.');
      return;
    }
    if (normalizeCity(source) === normalizeCity(destination)) {
      setError('From and destination cannot be the same.');
      return;
    }
    if (!date) {
      setError('Select a travel date.');
      return;
    }
    if (date < getDateOffset(0)) {
      setError('Please select today or a future travel date.');
      return;
    }
    if (!matchingRoute) {
      setError('This route is not active yet. Pick one from the popular routes below.');
      return;
    }

    setError('');
    navigate(`${routePrefix}/bus/list`, {
      state: {
        fromCity: source,
        toCity: destination,
        date,
      },
    });
  };

  const fillRoute = (route) => {
    setFromCity(route?.fromCity || '');
    setToCity(route?.toCity || '');
    setError('');
  };

  const openCalendar = () => {
    const activeDate =
      selectedDateValue && !Number.isNaN(selectedDateValue.getTime())
        ? selectedDateValue
        : new Date(`${getDateOffset(0)}T00:00:00`);
    setCalendarMonth(getMonthStart(activeDate));
    setCalendarOpen(true);
  };

  const selectCalendarDate = (value) => {
    const nextValue = formatDateKey(value);
    if (nextValue < getDateOffset(0)) return;
    setDate(nextValue);
    setCalendarOpen(false);
    setError('');
  };

  const activeHero = heroSlides[heroIndex];
  const activeOffer = offerSlides[offerIndex];

  return (
    <div className="min-h-screen max-w-lg mx-auto border-x border-[#f7e3af] bg-[#fffaf0] pb-28 font-sans text-slate-950 shadow-2xl">
      <main className="pb-5">
        {/* Hero */}
        <section className="relative min-h-[300px] overflow-hidden bg-[#ffd54a]">
          {heroSlides.map((slide, index) => (
            <motion.img
              key={slide.image}
              src={slide.image}
              alt="Taxi09 bus booking"
              initial={false}
              animate={{ opacity: index === heroIndex ? 1 : 0, scale: index === heroIndex ? 1 : 1.04 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[72%_center]"
            />
          ))}
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${activeHero.gradient}`} />

          <div className="relative z-10 px-4 pb-5 pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[22px] font-black italic leading-none tracking-[-0.05em] text-slate-950">
                  TAXI<span className="text-white">09</span>
                </p>
                <p className="mt-1 text-[11px] font-semibold text-slate-800">Bus Booking</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`${routePrefix}/notifications`)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-950 active:scale-95 transition-transform"
                aria-label="Notifications"
              >
                <Bell size={22} strokeWidth={2.4} />
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-[#ffd54a]">
                  3
                </span>
              </button>
            </div>

            <div className="mt-6 max-w-[56%]">
              <h1 className="text-[24px] font-black leading-[1.12] tracking-[-0.03em] text-slate-950">
                {activeHero.title.split('\n').map((line) => (
                  <React.Fragment key={line}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </h1>
              <p className="mt-2 text-[13px] font-medium leading-4 text-slate-800">
                {activeHero.subtitle.split('\n').map((line) => (
                  <React.Fragment key={line}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </p>
            </div>

            <div className="mt-5 flex w-full max-w-[330px] divide-x divide-[#f1e6cb] rounded-[14px] bg-white px-1 py-2 shadow-[0_10px_24px_rgba(120,90,0,0.14)]">
              {featurePills.map(({ icon: Icon, title, subtitle }) => (
                <div key={title} className="flex flex-1 items-center gap-1.5 px-1.5">
                  <Icon size={15} className="shrink-0 text-[#f5b700]" strokeWidth={2.6} />
                  <div className="min-w-0">
                    <p className="truncate text-[10.5px] font-black leading-tight text-slate-950">{title}</p>
                    <p className="truncate text-[9.5px] font-medium leading-tight text-slate-500">{subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.image}
                  type="button"
                  onClick={() => setHeroIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${index === heroIndex ? 'w-5 bg-slate-950' : 'w-1.5 bg-white/80'}`}
                  aria-label={`Show bus banner ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        <div className="px-3">
          {/* Offer + countdown */}
          <section className={`-mt-6 relative z-20 overflow-hidden rounded-[20px] bg-gradient-to-r ${activeOffer.tone} px-3 py-3.5 shadow-[0_12px_30px_rgba(15,23,42,0.10)]`}>
            <div className="flex items-center gap-1.5">
            <div className="shrink-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{activeOffer.eyebrow}</p>
              <p className="mt-0.5 flex items-baseline gap-1 leading-none text-[#b8770a]">
                <span className="text-[28px] font-black tracking-[-0.03em]">{activeOffer.title}</span>
                <span className="text-[13px] font-black text-slate-900">{activeOffer.suffix}</span>
              </p>
              <p className="mt-1.5 text-[11px] font-medium leading-tight text-slate-600">{activeOffer.subtitle}</p>
              <span className="mt-2 inline-flex rounded-[8px] border border-dashed border-[#d9b25e] px-2 py-1 text-[10.5px] font-bold text-slate-800">
                Use Code: {activeOffer.code}
              </span>
            </div>

            <div className="h-[60px] w-[52px] shrink-0">
              {renderOfferArt(activeOffer.art)}
            </div>

            <div className="shrink-0">
              <p className="text-center text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700">
                Offer Ends In
              </p>
              <div className="mt-1.5 flex items-start justify-center gap-0.5">
                {[
                  [offerCountdown.hrs, 'HRS'],
                  [offerCountdown.mins, 'MINS'],
                  [offerCountdown.secs, 'SECS'],
                ].map(([value, label], idx) => (
                  <React.Fragment key={label}>
                    {idx > 0 && <span className="pt-1 text-[13.5px] font-black leading-none text-slate-400">:</span>}
                    <div className="w-[27px]">
                      <div className="rounded-[7px] border border-[#f0e3c4] bg-white py-1 text-center shadow-[0_2px_5px_rgba(0,0,0,0.04)]">
                        <p className="text-[15.5px] font-black leading-none tabular-nums text-slate-950">{value}</p>
                      </div>
                      <p className="mt-1 text-center text-[8.5px] font-bold text-slate-500">{label}</p>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOfferIndex((current) => (current + 1) % offerSlides.length)}
              className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white active:scale-95 transition-transform"
              aria-label="Next offer"
            >
              <ArrowRight size={15} strokeWidth={2.6} />
            </button>
            </div>
            <div className="mt-2 flex justify-center gap-1.5">
              {offerSlides.map((slide, index) => (
                <button
                  key={slide.code}
                  type="button"
                  onClick={() => setOfferIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${index === offerIndex ? 'w-5 bg-[#f5b700]' : 'w-1.5 bg-slate-300'}`}
                  aria-label={`Show offer ${index + 1}`}
                />
              ))}
            </div>
          </section>

          {/* Search */}
          <section className="mt-3 rounded-[22px] border border-[#f1e0b8] bg-white px-3 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between px-0.5">
              <h2 className="text-[18px] font-black tracking-[-0.02em] text-slate-950">Plan Your Bus Journey</h2>
              {routesLoading && <Loader2 size={16} className="animate-spin text-slate-400" />}
            </div>

            <div className="relative mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-[14px] border border-[#eee9df] bg-white px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">From</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full border-[3px] border-[#f5b700]" />
                  <select
                    value={fromCity}
                    onChange={(event) => {
                      setFromCity(event.target.value);
                      setError('');
                    }}
                    className="w-full min-w-0 appearance-none bg-transparent text-[14.5px] font-bold text-slate-950 outline-none"
                  >
                    {!originOptions.includes(fromCity) && <option value={fromCity}>{fromCity || 'Select city'}</option>}
                    {originOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFromCity(toCity);
                  setToCity(fromCity);
                  setError('');
                }}
                className="absolute left-1/2 top-[26px] z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white bg-[#f5b700] text-black shadow-[0_6px_14px_rgba(245,183,0,0.35)] active:scale-95 transition-transform"
                aria-label="Swap cities"
              >
                <Repeat2 size={15} strokeWidth={2.8} />
              </button>

              <div className="rounded-[14px] border border-[#eee9df] bg-white px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">To</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <MapPin size={13} className="shrink-0 text-slate-400" strokeWidth={2.6} />
                  <select
                    value={toCity}
                    onChange={(event) => {
                      setToCity(event.target.value);
                      setError('');
                    }}
                    className="w-full min-w-0 appearance-none bg-transparent text-[14.5px] font-bold text-slate-950 outline-none"
                  >
                    {!destinationOptions.includes(toCity) && <option value={toCity}>{toCity || 'Select city'}</option>}
                    {destinationOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={openCalendar}
                className="col-span-2 rounded-[14px] border border-[#eee9df] bg-white px-3 py-2.5 text-left"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Journey Date</p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="truncate text-[14.5px] font-bold text-slate-950">{formatDisplayDate(date)}</span>
                  <CalendarDays size={15} className="shrink-0 text-slate-400" strokeWidth={2.4} />
                </div>
              </button>
            </div>

            {matchingRoute && (
              <div className="mt-2.5 rounded-[12px] bg-[#f0fdf4] px-3 py-2 text-[11.5px] font-semibold text-emerald-700">
                Active route found. Tickets from Rs{Number(matchingRoute.startingPrice || 0)}
              </div>
            )}

            {error && (
              <div className="mt-2.5 rounded-[12px] bg-rose-50 px-3 py-2 text-[11.5px] font-semibold text-rose-600">{error}</div>
            )}

            {routesError && !error && (
              <div className="mt-2.5 rounded-[12px] bg-rose-50 px-3 py-2 text-[11.5px] font-semibold text-rose-600">
                {routesError}
              </div>
            )}

            {!busEnabled && !error && (
              <div className="mt-2.5 rounded-[12px] bg-amber-50 px-3 py-2 text-[11.5px] font-semibold text-amber-700">
                Bus service is currently disabled.
              </div>
            )}

            <button
              type="button"
              onClick={handleSearch}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[#f5b700] text-[16.5px] font-black text-slate-950 shadow-[0_10px_22px_rgba(245,183,0,0.28)] active:scale-[0.99] transition-transform"
            >
              <Search size={17} strokeWidth={3} />
              Search Buses
            </button>
          </section>

          {/* Popular routes */}
          <section className="mt-4">
            <div className="flex items-center justify-between px-0.5">
              <h2 className="text-[18px] font-black tracking-[-0.02em] text-slate-950">Popular Routes</h2>
              <button
                type="button"
                onClick={() => navigate(`${routePrefix}/bus/list`, { state: { fromCity, toCity, date } })}
                className="flex items-center gap-1 text-[13px] font-bold text-slate-600"
              >
                View All <ChevronRight size={13} strokeWidth={2.8} />
              </button>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              {featuredRoutes.map((route, index) => (
                <button
                  key={`${route?.fromCity || 'from'}-${route?.toCity || 'to'}-${index}`}
                  type="button"
                  onClick={() => fillRoute(route)}
                  className={`relative min-h-[112px] overflow-hidden rounded-[18px] border border-white/80 bg-gradient-to-br ${routePalettes[index % routePalettes.length]} p-3 text-left shadow-[0_12px_24px_rgba(15,23,42,0.08)] active:scale-[0.98] transition-transform`}
                >
                  <span
                    className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-15"
                    style={{ backgroundColor: routeAccents[index % routeAccents.length] }}
                  />
                  <span
                    className="absolute bottom-3 right-4 h-[2px] w-16 rounded-full opacity-30"
                    style={{ backgroundColor: routeAccents[index % routeAccents.length] }}
                  />
                  <span className="relative flex items-center justify-between">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_5px_12px_rgba(15,23,42,0.08)]"
                      style={{ color: routeAccents[index % routeAccents.length] }}
                    >
                      <BusFront size={16} strokeWidth={2.6} />
                    </span>
                    <span className="rounded-full bg-white/85 px-2 py-1 text-[10px] font-black text-slate-600 shadow-[0_4px_10px_rgba(15,23,42,0.06)]">
                      Popular
                    </span>
                  </span>

                  <div className="relative mt-3">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="min-w-0 truncate text-[13.5px] font-black leading-tight text-slate-950">
                        {splitCityName(route?.fromCity) || 'Route'}
                      </span>
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/85 text-[12px] font-black text-slate-500">
                        &rarr;
                      </span>
                      <span className="min-w-0 truncate text-[13.5px] font-black leading-tight text-slate-950">
                        {splitCityName(route?.toCity) || 'Destination'}
                      </span>
                    </div>

                    <div className="mt-2 flex items-end justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Starts at</p>
                        <p className="mt-0.5 text-[14.5px] font-black text-slate-950">
                          Rs{Number(route?.startingPrice || 0)}
                        </p>
                      </div>
                      {route?.duration && (
                        <span className="flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[10.5px] font-bold text-slate-600">
                          <Timer size={10} strokeWidth={2.5} />
                          {route.duration}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className="absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-[0_5px_12px_rgba(15,23,42,0.16)]"
                    style={{ backgroundColor: routeAccents[index % routeAccents.length] }}
                  >
                    <ArrowRight size={13} strokeWidth={2.8} />
                  </span>
                </button>
              ))}
            </div>

            {!routesLoading && !featuredRoutes.length && !routesError && (
              <p className="py-8 text-center text-[13.5px] font-medium text-slate-400">No active routes found.</p>
            )}
          </section>

          {/* Why book */}
          <section className="mt-4">
            <h2 className="px-0.5 text-[18px] font-black tracking-[-0.02em] text-slate-950">Why Book with Taxi09?</h2>
            <div className="mt-2.5 grid grid-cols-4 divide-x divide-[#f1e6cb] rounded-[18px] border border-[#f4e7c6] bg-[#fffdf6] py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              {trustItems.map(({ icon: Icon, title, subtitle, tone }) => (
                <div key={title} className="flex min-w-0 flex-col items-center gap-1.5 px-1.5 text-center">
                  <Icon size={19} className={`shrink-0 ${tone}`} strokeWidth={2.4} />
                  <p className="text-[10px] font-black leading-[1.2] text-slate-950">{title}</p>
                  <p className="text-[9px] font-medium leading-[1.2] text-slate-500">{subtitle}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {calendarOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3 backdrop-blur-sm">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="w-full max-w-lg rounded-[26px] bg-white p-5 shadow-[0_22px_40px_rgba(15,23,42,0.22)]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Select Journey Date</p>
                <h3 className="mt-1 text-[20px] font-extrabold">{monthLabel}</h3>
              </div>
              <button
                type="button"
                onClick={() => setCalendarOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCalendarMonth((current) => addMonths(current, -1))}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="rounded-full bg-[#fff8df] px-4 py-2 text-[13.5px] font-bold text-slate-800">
                {formatDisplayDate(date)}
              </span>
              <button
                type="button"
                onClick={() => setCalendarMonth((current) => addMonths(current, 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1 text-center">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day) => (
                <span key={day} className="py-2 text-[12px] font-bold text-slate-400">
                  {day}
                </span>
              ))}

              {calendarDays.map((day) => {
                const key = formatDateKey(day);
                const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
                const isDisabled = key < getDateOffset(0);
                const isSelected = key === date;

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => selectCalendarDate(day)}
                    className={`aspect-square rounded-[14px] text-[14.5px] font-bold ${
                      isSelected
                        ? 'bg-[#f5b700] text-black'
                        : isDisabled
                          ? 'text-slate-200'
                          : isCurrentMonth
                            ? 'text-slate-800 hover:bg-slate-50'
                            : 'text-slate-300'
                    }`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDate(getDateOffset(0));
                  setCalendarOpen(false);
                }}
                className="rounded-[16px] bg-slate-50 py-3 text-[13.5px] font-bold text-slate-700"
              >
                Use Today
              </button>
              <button
                type="button"
                onClick={() => setCalendarOpen(false)}
                className="rounded-[16px] bg-[#f5b700] py-3 text-[13.5px] font-bold text-black"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <BottomNavbar />
    </div>
  );
};

export default BusHome;
