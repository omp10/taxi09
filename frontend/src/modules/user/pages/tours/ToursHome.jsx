import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AppHeader from '../../components/AppHeader';
import contentService from '../../services/contentService';
import {
  Bell,
  BedDouble,
  CalendarCheck,
  CalendarDays,
  Camera,
  ChevronDown,
  ChevronRight,
  Clock3,
  Crown,
  Gift,
  Grid2X2,
  Headset,
  Heart,
  Home,
  Landmark,
  Luggage,
  MapPin,
  Menu,
  Mountain,
  Palmtree,
  Plane,
  Search,
  ShieldCheck,
  Star,
  Tag,
  User,
  Users,
  IndianRupee,
  BadgePercent,
} from 'lucide-react';
import { rememberPackage } from '../../utils/packageHandoff';

const getRoutePrefix = (pathname = '') => (pathname.startsWith('/taxi/user') ? '/taxi/user' : '');

const formatPickedDate = (value) => {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'Select Dates';
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const rupees = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const DESTINATIONS = ['Any Destination', 'Himachal Pradesh', 'Goa', 'Kashmir', 'Uttarakhand', 'Rajasthan', 'Kerala'];
const TRAVELERS = ['1 Adult', '2 Adults', '2 Adults, 1 Child', '4 Adults', 'Family (6+)'];
const BUDGETS = [
  { id: 'any', label: 'Any Budget', min: 0, max: Infinity },
  { id: '0-5k', label: '₹0 - ₹5,000', min: 0, max: 5000 },
  { id: '5-10k', label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
  { id: '10-15k', label: '₹10,000 - ₹15,000', min: 10000, max: 15000 },
  { id: '15-25k', label: '₹15,000 - ₹25,000', min: 15000, max: 25000 },
  { id: '25-40k', label: '₹25,000 - ₹40,000', min: 25000, max: 40000 },
  { id: '40k+', label: 'Above ₹40,000', min: 40000, max: Infinity },
];

const CATEGORIES = [
  { label: 'All Packages', icon: Grid2X2, tone: 'text-slate-700' },
  { label: 'Honeymoon', icon: Heart, tone: 'text-rose-500' },
  { label: 'Adventure', icon: Mountain, tone: 'text-emerald-600' },
  { label: 'Beach', icon: Palmtree, tone: 'text-sky-500' },
  { label: 'Family', icon: Users, tone: 'text-violet-500' },
  { label: 'Pilgrimage', icon: Landmark, tone: 'text-orange-500' },
  { label: 'Luxury', icon: Crown, tone: 'text-amber-500' },
];

const TRUST = [
  { icon: ShieldCheck, title: 'Secure Booking', sub: '100% safe & secure' },
  { icon: BadgePercent, title: 'Best Price Guarantee', sub: 'Get the best deals' },
  { icon: CalendarCheck, title: 'Flexible Cancellation', sub: 'Easy refunds' },
  { icon: Headset, title: '24/7 Support', sub: "We're here to help" },
];

const FALLBACK_PACKAGES = [
  {
    id: 'himachal',
    gallery: ['/taxi09_pkg_himachal.jpg', '/taxi09_tours_hero_mountain.png', '/taxi09_pkg_kashmir.jpg'],
    tag: 'Bestseller',
    tagTone: 'bg-[var(--primary)] text-[var(--text)]',
    title: 'Himachal Delight',
    stops: ['Shimla', 'Manali', 'Solang Valley', 'Dharamshala'],
    state: 'Himachal Pradesh',
    category: 'Adventure',
    image: '/taxi09_pkg_himachal.jpg',
    days: '5 Days / 4 Nights',
    durationDays: 5,
    includes: ['Meals', 'Stay', 'Sightseeing'],
    rating: 4.6,
    reviews: '1.2K',
    oldPrice: 16999,
    price: 11999,
  },
  {
    id: 'goa',
    gallery: ['/taxi09_pkg_goa.jpg', '/taxi09_tours_hero_beach.png', '/taxi09_hotel_hero_resort_v2.png'],
    tag: 'Popular',
    tagTone: 'bg-[var(--primary)] text-[var(--text)]',
    title: 'Goa Beach Escape',
    stops: ['North Goa', 'South Goa', 'Cruise', 'Water Sports'],
    state: 'Goa',
    category: 'Beach',
    image: '/taxi09_pkg_goa.jpg',
    days: '4 Days / 3 Nights',
    durationDays: 4,
    includes: ['Meals', 'Stay', 'Sightseeing'],
    rating: 4.4,
    reviews: '890',
    oldPrice: 13499,
    price: 8999,
  },
  {
    id: 'kashmir',
    gallery: ['/taxi09_pkg_kashmir.jpg', '/taxi09_tours_hero_mountain.png', '/taxi09_pkg_himachal.jpg'],
    tag: 'New',
    tagTone: 'bg-emerald-100 text-emerald-700',
    title: 'Kashmir Paradise',
    stops: ['Srinagar', 'Gulmarg', 'Pahalgam', 'Dal Lake'],
    state: 'Kashmir',
    category: 'Honeymoon',
    image: '/taxi09_pkg_kashmir.jpg',
    days: '6 Days / 5 Nights',
    durationDays: 6,
    includes: ['Meals', 'Stay', 'Sightseeing'],
    rating: 4.8,
    reviews: '756',
    oldPrice: 22999,
    price: 16999,
  },
  {
    id: 'rishikesh',
    gallery: ['/taxi09_pkg_rishikesh.jpg', '/taxi09_tours_hero_spiritual.png', '/taxi09_pkg_himachal.jpg'],
    tag: 'Spiritual',
    tagTone: 'bg-violet-100 text-violet-700',
    title: 'Rishikesh Yoga Retreat',
    stops: ['Rishikesh', 'Haridwar', 'Yoga Sessions', 'Ganga Aarti'],
    state: 'Uttarakhand',
    category: 'Pilgrimage',
    image: '/taxi09_pkg_rishikesh.jpg',
    days: '3 Days / 2 Nights',
    durationDays: 3,
    includes: ['Meals', 'Stay', 'Activities'],
    rating: 4.5,
    reviews: '612',
    oldPrice: 9999,
    price: 6499,
  },
  {
    id: 'udaipur',
    gallery: ['/taxi09_pkg_rajasthan.jpg', '/taxi09_hotel_destination_udaipur.png', '/taxi09_hotel_room_3.jpg'],
    tag: 'Luxury',
    tagTone: 'bg-amber-100 text-amber-700',
    title: 'Royal Rajasthan',
    stops: ['Udaipur', 'Jodhpur', 'Jaisalmer', 'Desert Camp'],
    state: 'Rajasthan',
    category: 'Luxury',
    image: '/taxi09_pkg_rajasthan.jpg',
    days: '7 Days / 6 Nights',
    durationDays: 7,
    includes: ['Meals', 'Stay', 'Sightseeing'],
    rating: 4.7,
    reviews: '1.1K',
    oldPrice: 34999,
    price: 26999,
  },
];

const INCLUDE_ICONS = { Meals: Luggage, Stay: BedDouble, Sightseeing: Camera, Activities: Plane };

/** API records use durationLabel/includes; the card expects days/includes. */
const fromApi = (item) => ({
  ...item,
  id: item.slug || item._id,
  days: item.durationLabel || `${item.durationDays} Days`,
  includes: item.includes?.length ? item.includes : ['Meals', 'Stay', 'Sightseeing'],
  tag: item.badge,
  tagTone: item.badgeTone,
});

const ToursBottomNav = ({ routePrefix }) => {
  const navigate = useNavigate();
  const items = [
    { label: 'Home', icon: Home, path: routePrefix || '/user' },
    { label: 'Bookings', icon: CalendarDays, path: `${routePrefix}/activity` },
    { label: 'Packages', icon: Luggage, path: `${routePrefix}/tours`, center: true },
    { label: 'Offers', icon: Tag, path: `${routePrefix}/promo` },
    { label: 'Account', icon: User, path: `${routePrefix}/profile` },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 border-t border-[var(--border)] bg-white px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 shadow-[0_-8px_22px_rgba(15,23,42,0.1)]">
      <div className="flex items-end justify-around">
        {items.map(({ label, icon: Icon, path, center }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(path)}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <span
              className={
                center
                  ? '-mt-7 flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[var(--primary)] text-[var(--text)] shadow-[0_10px_22px_rgba(245,183,0,0.44)] ring-4 ring-white'
                  : 'flex h-6 items-center justify-center text-[var(--text-light)]'
              }
            >
              <Icon size={center ? 24 : 20} strokeWidth={center ? 2.5 : 2.2} />
            </span>
            <span
              className={`text-[10.5px] ${center ? 'font-extrabold text-[var(--text)]' : 'font-semibold text-[var(--text-light)]'}`}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

const ToursHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routePrefix = useMemo(() => getRoutePrefix(location.pathname), [location.pathname]);

  const [destination, setDestination] = useState(DESTINATIONS[0]);
  const [travelers, setTravelers] = useState(TRAVELERS[1]);
  const [budgetId, setBudgetId] = useState(BUDGETS[0].id);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [category, setCategory] = useState('All Packages');
  const [packages, setPackages] = useState(FALLBACK_PACKAGES);

  useEffect(() => {
    let active = true;
    contentService.getTravelPackages('domestic', FALLBACK_PACKAGES).then((results) => {
      if (active) setPackages(results.map((item) => (item.slug ? fromApi(item) : item)));
    });
    return () => {
      active = false;
    };
  }, []);
  const todayKey = useMemo(() => new Date().toISOString().split('T')[0], []);

  const tripDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    return Math.max(1, Math.round((end - start) / 86400000) + 1);
  }, [endDate, startDate]);

  const visiblePackages = useMemo(() => {
    const range = BUDGETS.find((item) => item.id === budgetId) || BUDGETS[0];
    return packages.filter((tour) => {
      if (category !== 'All Packages' && tour.category !== category) return false;
      if (destination !== 'Any Destination' && tour.state !== destination) return false;
      if (tour.price < range.min || tour.price > range.max) return false;
      // A chosen window only fits packages short enough to complete inside it.
      if (tripDays && tour.durationDays > tripDays) return false;
      return true;
    });
  }, [budgetId, category, destination, packages, tripDays]);

  const handleSearch = () => {
    if (visiblePackages.length === 0) {
      toast.error('No packages match those filters');
      return;
    }
    toast.success(`${visiblePackages.length} package${visiblePackages.length > 1 ? 's' : ''} found`);
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-[#fffaf0] pb-28 text-[var(--text)]">
      {/* Header */}
      <AppHeader subtitle="TOUR PACKAGES" />

      <header className="relative">
        {/* Hero: text is real DOM, not baked into the artwork, so it never crops */}
        <section className="relative h-[340px] overflow-hidden">
          <img
            src="/taxi09_tours_hero_mountain.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-right"
          />


          <div className="relative z-10 px-4 pt-2">
            <p className="font-serif text-[29px] italic leading-none text-slate-900">Discover</p>
            <h1 className="mt-2 max-w-[72%] text-[30px] font-black leading-[1.06] tracking-[-0.04em]">
              Amazing Places with Perfect Plans
            </h1>
            <p className="mt-2.5 max-w-[62%] text-[12.5px] font-semibold leading-[1.4] text-slate-900">
              Curated tour packages for every kind of traveler.
            </p>

            <div className="mt-3.5 inline-flex items-center gap-2.5 rounded-[13px] bg-[#ffdb4d] px-3.5 py-2.5 shadow-[0_6px_14px_rgba(0,0,0,0.12)] ring-1 ring-black/10">
              <Gift size={23} className="shrink-0 text-slate-900" />
              <span className="leading-tight">
                <span className="block text-[13.5px] font-extrabold">Up to 30% OFF</span>
                <span className="block text-[9.5px] font-semibold text-slate-700">on selected packages</span>
              </span>
            </div>
          </div>
        </section>
      </header>

      <main className="-mt-24 px-3">
        {/* Search panel */}
        <section className="relative z-20 overflow-hidden rounded-[18px] border border-[#FFD54F]/45 bg-[#3a2c07]/35 p-3 text-white shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FFD54F]/22 via-transparent to-black/25"
          />

          <div className="relative grid grid-cols-3 divide-x divide-[#FFD54F]/25 border-b border-[#FFD54F]/25 pb-3">
            <div className="min-w-0 px-1.5">
              <p className="text-[9.5px] font-semibold text-[#ffe9a8]">Where to?</p>
              <div className="mt-1 flex items-center gap-1">
                <MapPin size={13} className="shrink-0 text-[var(--primary)]" />
                <div className="relative min-w-0 flex-1">
                  <select
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    className="w-full min-w-0 appearance-none truncate bg-transparent pr-3.5 text-[10.5px] font-bold text-white outline-none"
                  >
                    {DESTINATIONS.map((option) => (
                      <option key={option} value={option} className="text-slate-900">
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-white/70" />
                </div>
              </div>
            </div>

            {/* Dates stay compact: the range lives in a popover */}
            <div className="min-w-0 px-1.5">
              <p className="text-[9.5px] font-semibold text-[#ffe9a8]">Dates</p>
              <button
                type="button"
                onClick={() => setDatePickerOpen((current) => !current)}
                className="mt-1 flex w-full items-center gap-1"
              >
                <CalendarDays size={13} className="shrink-0 text-[var(--primary)]" />
                <span className="min-w-0 flex-1 truncate text-left text-[10.5px] font-bold text-white">
                  {startDate && endDate
                    ? `${formatPickedDate(startDate)} - ${formatPickedDate(endDate)}`
                    : 'Select Dates'}
                </span>
                <ChevronDown
                  size={11}
                  className={`shrink-0 text-white/70 transition-transform ${datePickerOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            <div className="min-w-0 px-1.5">
              <p className="text-[9.5px] font-semibold text-[#ffe9a8]">Travelers</p>
              <div className="mt-1 flex items-center gap-1">
                <User size={13} className="shrink-0 text-[var(--primary)]" />
                <div className="relative min-w-0 flex-1">
                  <select
                    value={travelers}
                    onChange={(event) => setTravelers(event.target.value)}
                    className="w-full min-w-0 appearance-none truncate bg-transparent pr-3.5 text-[10.5px] font-bold text-white outline-none"
                  >
                    {TRAVELERS.map((option) => (
                      <option key={option} value={option} className="text-slate-900">
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-white/70" />
                </div>
              </div>
            </div>
          </div>

          {datePickerOpen ? (
            <div className="relative mt-2.5 rounded-[12px] border border-[#FFD54F]/30 bg-black/35 p-2.5">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="block text-[9.5px] font-semibold text-[#ffe9a8]">From</span>
                  <input
                    type="date"
                    min={todayKey}
                    value={startDate}
                    onChange={(event) => {
                      const next = event.target.value;
                      setStartDate(next);
                      if (endDate && endDate < next) setEndDate(next);
                    }}
                    className="mt-1 w-full bg-transparent text-[11px] font-bold text-white outline-none [color-scheme:dark]"
                  />
                </label>
                <label className="block">
                  <span className="block text-[9.5px] font-semibold text-[#ffe9a8]">To</span>
                  <input
                    type="date"
                    min={startDate || todayKey}
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="mt-1 w-full bg-transparent text-[11px] font-bold text-white outline-none [color-scheme:dark]"
                  />
                </label>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[9.5px] font-semibold text-white/70">
                  {tripDays ? `${tripDays} day window` : 'Pick both dates'}
                </span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="text-[10px] font-bold text-white/70 underline"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatePickerOpen(false)}
                    className="rounded-[8px] bg-[var(--primary)] px-2.5 py-1 text-[10px] font-extrabold text-[var(--text)]"
                  >
                    Done
                  </button>
                </span>
              </div>
            </div>
          ) : null}

          <div className="relative mt-3 grid grid-cols-[1fr_auto] items-end gap-2">
            <div className="min-w-0 px-1.5">
              <p className="text-[9.5px] font-semibold text-[#ffe9a8]">Budget (Optional)</p>
              <div className="mt-1 flex items-center gap-1">
                <IndianRupee size={13} className="shrink-0 text-[var(--primary)]" />
                <div className="relative min-w-0 flex-1">
                  <select
                    value={budgetId}
                    onChange={(event) => setBudgetId(event.target.value)}
                    className="w-full min-w-0 appearance-none truncate bg-transparent pr-3.5 text-[11px] font-bold text-white outline-none"
                  >
                    {BUDGETS.map((item) => (
                      <option key={item.id} value={item.id} className="text-slate-900">
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-white/70" />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="flex h-[42px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[11px] bg-[linear-gradient(180deg,#FFD54F,#FFC107)] px-3 text-[11.5px] font-extrabold text-[var(--text)] shadow-[0_10px_20px_rgba(245,183,0,0.32)] active:scale-[0.98] transition-transform"
            >
              <Search size={14} strokeWidth={3} /> Search Packages
            </button>
          </div>
        </section>

        {/* Categories */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map(({ label, icon: Icon, tone }) => {
            const active = category === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setCategory(label)}
                className={`flex h-[54px] w-[76px] shrink-0 flex-col items-center justify-center gap-1 rounded-[12px] border px-1 text-[6px] font-extrabold leading-none transition-colors ${
                  active
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--text)] shadow-[0_8px_16px_rgba(245,183,0,0.3)]'
                    : 'border-[var(--border)] bg-white text-[var(--text)] shadow-[var(--shadow-sm)]'
                }`}
              >
                <Icon size={13} className={active ? 'text-[var(--text)]' : tone} />
                <span className="w-full whitespace-nowrap text-center">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Packages */}
        <div className="mb-2.5 mt-4 flex items-center justify-between px-1">
          <h2 className="text-[17px] font-extrabold tracking-[-0.02em]">
            {category === 'All Packages' ? 'Popular Packages' : category}
          </h2>
          <button
            type="button"
            onClick={() => {
              setCategory('All Packages');
              setDestination('Any Destination');
              setBudgetId(BUDGETS[0].id);
              setStartDate('');
              setEndDate('');
            }}
            className="flex items-center gap-1 text-[11.5px] font-bold text-[var(--primary-dark)]"
          >
            View All <ChevronRight size={13} strokeWidth={2.8} />
          </button>
        </div>

        <div className="space-y-3 app-grid">
          {visiblePackages.map((tour) => {
            const off = Math.round(((tour.oldPrice - tour.price) / tour.oldPrice) * 100);
            return (
              <div
                key={tour.id}
                className="flex overflow-hidden rounded-[16px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]"
              >
                <div className="relative h-auto w-[134px] shrink-0 self-stretch overflow-hidden bg-slate-900">
                  <img src={tour.image} alt={tour.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <span
                    className={`absolute left-2 top-2 rounded-[8px] px-2 py-0.5 text-[9px] font-extrabold ${tour.tagTone}`}
                  >
                    {tour.tag}
                  </span>
                  <p className="absolute bottom-2 left-2 right-2 flex items-center gap-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[8.5px] font-bold text-white backdrop-blur-sm">
                    <MapPin size={9} className="shrink-0" />
                    <span className="truncate">{tour.state}</span>
                  </p>
                </div>

                <div className="min-w-0 flex-1 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 flex-1 text-[14px] font-extrabold leading-tight">{tour.title}</h3>
                    <span className="shrink-0 rounded-[7px] bg-[var(--secondary)] px-1.5 py-0.5 text-[9px] font-extrabold text-[var(--primary-dark)]">
                      {off}% OFF
                    </span>
                  </div>

                  <p className="mt-1 truncate text-[9px] font-semibold text-[var(--text-light)]">
                    {tour.stops.map((stop, index) => (
                      <React.Fragment key={stop}>
                        {index > 0 ? <span className="text-slate-300"> • </span> : null}
                        {stop}
                      </React.Fragment>
                    ))}
                  </p>

                  <div className="mt-1.5 flex flex-nowrap items-center gap-x-2 overflow-hidden whitespace-nowrap text-[8.5px] font-semibold text-[var(--text-light)]">
                    <span className="flex items-center gap-1">
                      <Clock3 size={10} className="text-[var(--primary-dark)]" /> {tour.days}
                    </span>
                    {tour.includes.map((item) => {
                      const Icon = INCLUDE_ICONS[item] || Camera;
                      return (
                        <span key={item} className="flex items-center gap-1">
                          <Icon size={10} className="text-[var(--primary-dark)]" /> {item}
                        </span>
                      );
                    })}
                  </div>

                  <p className="mt-1.5 flex items-center gap-1 text-[10px] font-extrabold">
                    <Star size={11} className="fill-[var(--primary)] text-[var(--primary)]" />
                    {tour.rating}
                    <span className="font-medium text-[var(--text-light)]">({tour.reviews} Reviews)</span>
                  </p>

                  <div className="mt-2 flex items-end justify-between gap-2">
                    <p className="flex flex-wrap items-baseline gap-x-1.5">
                      <span className="text-[10px] font-medium text-slate-400 line-through">
                        {rupees(tour.oldPrice)}
                      </span>
                      <span className="text-[17px] font-extrabold leading-none">{rupees(tour.price)}</span>
                      <span className="text-[9px] font-medium text-[var(--text-light)]">/ person</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        rememberPackage('tour', tour, { travelers, startDate });
                        navigate(`${routePrefix}/tours/details/${tour.slug}`, {
                          state: { tour, travelers, startDate },
                        });
                      }}
                      className="shrink-0 rounded-[10px] border-2 border-[var(--primary)] px-3 py-1.5 text-[10.5px] font-extrabold active:bg-[var(--secondary)] transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {visiblePackages.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-[var(--border)] bg-white px-4 py-10 text-center">
              <Luggage size={26} className="mx-auto text-slate-300" />
              <p className="mt-2 text-[13px] font-extrabold">No packages match your filters</p>
              <button
                type="button"
                onClick={() => {
                  setCategory('All Packages');
                  setDestination('Any Destination');
                  setBudgetId(BUDGETS[0].id);
                  setStartDate('');
                  setEndDate('');
                }}
                className="mt-3 rounded-[12px] bg-[var(--secondary)] px-4 py-2 text-[11.5px] font-extrabold text-[var(--primary-dark)]"
              >
                Clear filters
              </button>
            </div>
          ) : null}
        </div>

        {/* Trust strip */}
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-[16px] border border-[var(--border)] bg-[#fffdf6] p-3.5 shadow-[var(--shadow-sm)]">
          {TRUST.map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)]">
                <Icon size={16} className="text-[var(--primary-dark)]" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10.5px] font-extrabold leading-tight">{title}</span>
                <span className="block text-[9px] font-medium text-[var(--text-light)]">{sub}</span>
              </span>
            </div>
          ))}
        </div>
      </main>

      <ToursBottomNav routePrefix={routePrefix} />
    </div>
  );
};

export default ToursHome;
