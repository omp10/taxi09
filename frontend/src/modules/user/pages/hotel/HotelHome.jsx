import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BedDouble,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  Heart,
  Home,
  Hotel,
  MapPin,
  Minus,
  Plus,
  Search,
  Car,
  CircleCheck,
  Coffee,
  Dumbbell,
  SlidersHorizontal,
  Sparkles,
  Star,
  Wallet,
  Waves,
  Wifi,
  Tag,
  User,
  Users,
} from 'lucide-react';
import AppHeader from '../../components/AppHeader';
import contentService from '../../services/contentService';

const getRoutePrefix = (pathname = '') => (pathname.startsWith('/taxi/user') ? '/taxi/user' : '');


const destinations = [
  { city: 'Goa', price: 899, image: '/taxi09_hotel_destination_goa.png' },
  { city: 'Delhi', price: 699, image: '/taxi09_hotel_destination_delhi.png' },
  { city: 'Mumbai', price: 799, image: '/taxi09_hotel_destination_mumbai.png' },
  { city: 'Udaipur', price: 899, image: '/taxi09_hotel_destination_udaipur.png' },
];

const heroSlides = [
  {
    image: '/taxi09_hotel_hero.png',
    title: 'Find the perfect stay for your trip',
    subtitle: 'Comfortable stays. Best prices. Verified hotels.',
    offer: '40% OFF',
    code: 'FIRST40',
  },
  {
    image: '/taxi09_hotel_hero_city_v2.png',
    title: 'Premium city stays, taxi-fast deals',
    subtitle: 'Wake up near business hubs, cafes and landmarks.',
    offer: '25% OFF',
    code: 'CITY25',
  },
  {
    image: '/taxi09_hotel_hero_resort_v2.png',
    title: 'Resort breaks made easy',
    subtitle: 'Poolside escapes with verified rooms and instant booking.',
    offer: '30% OFF',
    code: 'RELAX30',
  },
];

const SORTS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'rating-desc', label: 'Top Rated' },
];

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (dateStr, offset) => {
  const base = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(base.getTime())) return dateStr;
  base.setDate(base.getDate() + offset);
  return toDateKey(base);
};

const nightsBetween = (checkIn, checkOut) => {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return Math.max(1, Math.round((end - start) / 86400000));
};

const formatShortDate = (value) => {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const AMENITY_ICONS = {
  'free wi-fi': Wifi,
  breakfast: Coffee,
  'free cancellation': CircleCheck,
  'pay at hotel': Wallet,
  parking: Car,
  pool: Waves,
  beachfront: Waves,
  'private pool': Waves,
  gym: Dumbbell,
  spa: Sparkles,
  'sea view': Waves,
  'lake view': Waves,
  'hill view': Sparkles,
  heritage: Sparkles,
  rooftop: Sparkles,
  'airport shuttle': Car,
};

const getAmenityIcon = (label) => AMENITY_ICONS[String(label).toLowerCase()] || CircleCheck;

/** Five stars with a clipped overlay so 4.5 renders as a real half star. */
const StarRating = ({ value, size = 11 }) => (
  <span className="flex items-center gap-[1px]">
    {Array.from({ length: 5 }).map((_, index) => {
      const fill = Math.max(0, Math.min(1, value - index));
      return (
        <span key={index} className="relative inline-flex">
          <Star size={size} className="fill-slate-200 text-slate-200" />
          {fill > 0 ? (
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="fill-[var(--primary)] text-[var(--primary)]" />
            </span>
          ) : null}
        </span>
      );
    })}
  </span>
);

const rupees = (value) => `₹${Number(value).toLocaleString('en-IN')}`;

const SectionTitle = ({ title, actionLabel, onAction }) => (
  <div className="mb-2.5 mt-5 flex items-center justify-between px-1">
    <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-[var(--text)]">{title}</h2>
    {actionLabel ? (
      <button
        type="button"
        onClick={onAction}
        className="flex items-center gap-1 text-[13.5px] font-bold text-[var(--primary-dark)]"
      >
        {actionLabel} <ChevronRight size={13} strokeWidth={2.8} />
      </button>
    ) : null}
  </div>
);

const HotelBottomNav = ({ routePrefix }) => {
  const navigate = useNavigate();
  const items = [
    { icon: Home, label: 'Home', path: routePrefix || '/user' },
    { icon: CalendarDays, label: 'Bookings', path: `${routePrefix}/activity` },
    { icon: Hotel, label: 'Hotels', path: `${routePrefix}/hotel`, center: true },
    { icon: Tag, label: 'Offers', path: `${routePrefix}/promo` },
    { icon: User, label: 'Account', path: `${routePrefix}/profile` },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 border-t border-[var(--border)] bg-white px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
      <div className="flex items-end justify-around">
        {items.map(({ icon: Icon, label, path, center }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(path)}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <span
              className={
                center
                  ? '-mt-7 flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[var(--primary)] text-[var(--text)] shadow-[0_8px_20px_rgba(245,183,0,0.42)] ring-4 ring-white'
                  : 'flex h-6 items-center justify-center text-[var(--text-light)]'
              }
            >
              <Icon size={center ? 25 : 21} strokeWidth={center ? 2.5 : 2.2} />
            </span>
            <span
              className={`text-[12.5px] ${center ? 'font-extrabold text-[var(--text)]' : 'font-semibold text-[var(--text-light)]'}`}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

const HotelHome = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const routePrefix = useMemo(() => getRoutePrefix(location.pathname), [location.pathname]);

  const today = useMemo(() => toDateKey(new Date()), []);
  const [destination, setDestination] = useState('Goa');
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(() => addDays(today, 1));
  const [mode, setMode] = useState('hotel');
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(2);
  const [guestPickerOpen, setGuestPickerOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [wishlist, setWishlist] = useState([]);
  const [sortBy, setSortBy] = useState('recommended');
  const [sortOpen, setSortOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [searchedFor, setSearchedFor] = useState('');
  const [hotels, setHotels] = useState([]);

  useEffect(() => {
    let active = true;
    contentService.getHotels().then((results) => {
      if (active) setHotels(results.map((item) => ({ ...item, id: item.slug || item._id || item.id })));
    });
    return () => {
      active = false;
    };
  }, []);

  const activeHero = heroSlides[heroIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroSlides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  // The cities we actually have hotels in. A hotel added in a seventh city
  // shows up here on its own; a hardcoded list would have left it unreachable.
  const cities = useMemo(
    () => [...new Set(hotels.map((hotel) => hotel?.city).filter(Boolean))].sort(),
    [hotels],
  );

  const nights = nightsBetween(checkIn, checkOut);

  const visibleHotels = useMemo(() => {
    const filtered = hotels.filter((hotel) => !searchedFor || hotel.city === searchedFor);
    const sorted = [...filtered];

    if (sortBy === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating-desc') sorted.sort((a, b) => b.rating - a.rating);

    return sorted;
  }, [hotels, searchedFor, sortBy]);

  const listedHotels = showAll ? visibleHotels : visibleHotels.slice(0, 4);

  const handleSearch = () => {
    if (mode === 'hourly') {
      toast('Hourly stays are coming soon');
      return;
    }
    setSearchedFor(destination);
    setShowAll(true);
    toast.success(`${destination}: ${hotels.filter((h) => h.city === destination).length} stays found`);
  };

  const toggleWishlist = (id) =>
    setWishlist((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  const pickDestination = (city) => {
    setDestination(city);
    setSearchedFor(city);
    setShowAll(true);
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-[var(--background)] pb-28 text-[var(--text)]">
      <AppHeader subtitle="HOTEL BOOKING" />

      {/* Hero */}
      <section className="relative h-[210px] overflow-hidden bg-slate-900">
        {heroSlides.map((slide, index) => (
          <img
            key={slide.image}
            src={slide.image}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              index === heroIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 via-45% to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-center px-4">
          <div className="max-w-[56%]">
            <h1 className="text-[21px] font-extrabold leading-[1.12] tracking-[-0.03em]">{activeHero.title}</h1>
            <p className="mt-2 text-[13px] font-medium leading-[1.45] text-[var(--text-light)]">
              {activeHero.subtitle}
            </p>
            <span className="mt-3 block h-1 w-12 rounded-full bg-[var(--primary)]" />
          </div>

          <div className="absolute bottom-3 left-4 flex gap-1.5">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.code}
                type="button"
                aria-label={`Banner ${index + 1}`}
                onClick={() => setHeroIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === heroIndex ? 'w-7 bg-[var(--primary)]' : 'w-1.5 bg-slate-900/25'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <main className="px-3">
        {/* Search card - sits below the hero, no negative overlap */}
        <section className="relative z-20 -mt-5 rounded-[18px] bg-white p-3 shadow-[var(--shadow-md)]">
          <div className="grid grid-cols-2 gap-2 border-b border-[var(--border)] pb-3">
            {[
              { id: 'hotel', icon: Hotel, label: 'Hotels' },
              { id: 'hourly', icon: Clock3, label: 'Hourly Stays' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={`flex items-center justify-center gap-1.5 rounded-[12px] px-3 py-2.5 text-[13.5px] font-extrabold transition-colors ${
                  mode === id ? 'bg-[var(--secondary)] text-[var(--primary-dark)]' : 'bg-slate-50 text-[var(--text-light)]'
                }`}
              >
                <Icon size={14} strokeWidth={2.4} />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-[13px] border border-[var(--border)] px-3 py-2.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--text-light)]">Destination</p>
            <div className="mt-1 flex items-center gap-1.5">
              <MapPin size={14} className="shrink-0 text-[var(--primary-dark)]" />
              <select
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                className="min-w-0 flex-1 appearance-none bg-transparent text-[14.5px] font-extrabold outline-none"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}, India
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="shrink-0 text-[var(--text-light)]" />
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="rounded-[13px] border border-[var(--border)] px-3 py-2.5">
              <span className="block text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--text-light)]">
                Check-in
              </span>
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={(event) => {
                  const nextCheckIn = event.target.value;
                  setCheckIn(nextCheckIn);
                  // Keep the stay at least one night long.
                  if (checkOut <= nextCheckIn) setCheckOut(addDays(nextCheckIn, 1));
                }}
                className="mt-1 w-full bg-transparent text-[13.5px] font-extrabold outline-none"
              />
            </label>
            <label className="rounded-[13px] border border-[var(--border)] px-3 py-2.5">
              <span className="block text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--text-light)]">
                Check-out
              </span>
              <input
                type="date"
                min={addDays(checkIn, 1)}
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
                className="mt-1 w-full bg-transparent text-[13.5px] font-extrabold outline-none"
              />
            </label>
          </div>

          <p className="mt-1.5 px-1 text-[12px] font-semibold text-[var(--text-light)]">
            {nights} night{nights > 1 ? 's' : ''} · {formatShortDate(checkIn)} — {formatShortDate(checkOut)}
          </p>

          <div className="relative mt-2 grid grid-cols-[1fr_128px] gap-2">
            <button
              type="button"
              onClick={() => setGuestPickerOpen((current) => !current)}
              className="flex items-center justify-between rounded-[13px] border border-[var(--border)] px-3 py-3 text-left"
            >
              <span className="flex items-center gap-2 text-[13.5px] font-extrabold">
                <Users size={15} className="text-[var(--primary-dark)]" />
                {rooms} Room{rooms > 1 ? 's' : ''}, {guests} Guest{guests > 1 ? 's' : ''}
              </span>
              <ChevronDown
                size={14}
                className={`text-[var(--text-light)] transition-transform ${guestPickerOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <button
              type="button"
              onClick={handleSearch}
              className="flex items-center justify-center gap-1.5 rounded-[13px] bg-[linear-gradient(180deg,#FFD54F,#FFC107)] text-[14px] font-extrabold text-[var(--text)] shadow-[0_8px_18px_rgba(245,183,0,0.35)] active:scale-[0.98] transition-transform"
            >
              <Search size={15} strokeWidth={2.8} />
              Search
            </button>

            {guestPickerOpen ? (
              <div className="absolute left-0 top-[56px] z-30 w-full rounded-[16px] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-lg)]">
                {[
                  { label: 'Rooms', value: rooms, set: setRooms, min: 1, max: 6 },
                  { label: 'Guests', value: guests, set: setGuests, min: 1, max: 20 },
                ].map(({ label, value, set, min, max }) => (
                  <div key={label} className="flex items-center justify-between py-2">
                    <span className="text-[13.5px] font-extrabold">{label}</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={value <= min}
                        onClick={() => set(value - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] disabled:opacity-30"
                      >
                        <Minus size={13} strokeWidth={3} />
                      </button>
                      <span className="w-5 text-center text-[14.5px] font-extrabold">{value}</span>
                      <button
                        type="button"
                        disabled={value >= max}
                        onClick={() => set(value + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] disabled:opacity-30"
                      >
                        <Plus size={13} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setGuestPickerOpen(false)}
                  className="mt-1 w-full rounded-[12px] bg-[var(--secondary)] py-2.5 text-[13.5px] font-extrabold text-[var(--primary-dark)]"
                >
                  Done
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <SectionTitle
          title="Popular Destinations"
          actionLabel={searchedFor ? 'Clear' : 'View All'}
          onAction={() => {
            setSearchedFor('');
            setShowAll(true);
          }}
        />
        <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
          {destinations.map(({ city, price, image }) => (
            <button
              key={city}
              type="button"
              onClick={() => pickDestination(city)}
              className={`group relative h-[118px] w-[98px] shrink-0 overflow-hidden rounded-[16px] bg-slate-900 text-left shadow-[var(--shadow-sm)] ${
                searchedFor === city ? 'ring-2 ring-[var(--primary)]' : ''
              }`}
            >
              <img src={image} alt={city} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
              <div className="absolute inset-x-2 bottom-2">
                <div className="flex items-end justify-between gap-1">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-extrabold leading-none text-white">{city}</p>
                    <p className="mt-1 text-[11px] font-semibold leading-none text-white/80">From {rupees(price)}</p>
                  </div>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]">
                    <ChevronRight size={12} strokeWidth={3} className="text-slate-950" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mb-2.5 mt-5 flex items-center justify-between px-1">
          <h2 className="text-[18px] font-extrabold tracking-[-0.02em]">
            {searchedFor ? `Stays in ${searchedFor}` : 'Recommended Hotels'}
            <span className="ml-1.5 text-[13px] font-semibold text-[var(--text-light)]">
              ({visibleHotels.length})
            </span>
          </h2>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((current) => !current)}
              className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-[13px] font-bold"
            >
              <SlidersHorizontal size={12} />
              {SORTS.find((item) => item.id === sortBy)?.label.split(':')[0]}
            </button>
            {sortOpen ? (
              <div className="absolute right-0 top-[38px] z-30 w-[190px] rounded-[14px] border border-[var(--border)] bg-white p-1.5 shadow-[var(--shadow-lg)]">
                {SORTS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setSortBy(option.id);
                      setSortOpen(false);
                    }}
                    className={`w-full rounded-[10px] px-3 py-2 text-left text-[13.5px] font-bold ${
                      sortBy === option.id ? 'bg-[var(--secondary)] text-[var(--primary-dark)]' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 app-grid">
          {listedHotels.map((hotel) => {
            const liked = wishlist.includes(hotel.id);
            const off = Math.round(((hotel.oldPrice - hotel.price) / hotel.oldPrice) * 100);
            return (
              <div
                key={hotel.id}
                className="flex gap-3 rounded-[18px] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-sm)]"
              >
                <div className="relative h-[124px] w-[108px] shrink-0 overflow-hidden rounded-[14px] bg-slate-200">
                  <img src={hotel.image} alt={hotel.name} className="h-full w-full object-cover" />
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10.5px] font-extrabold">
                    {hotel.badge}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(hotel.id)}
                    aria-label={liked ? 'Remove from wishlist' : 'Save to wishlist'}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 active:scale-90 transition-transform"
                  >
                    <Heart
                      size={14}
                      className={liked ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}
                    />
                  </button>
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 flex-1 text-[15.5px] font-extrabold leading-tight">{hotel.name}</h3>
                    <span className="shrink-0 rounded-[6px] bg-emerald-50 px-1.5 py-0.5 text-[11px] font-extrabold text-[var(--success)]">
                      {off}% OFF
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-1.5">
                    <StarRating value={hotel.rating} />
                    <span className="text-[13px] font-extrabold">{hotel.rating}</span>
                    <span className="text-[12px] font-medium text-[var(--text-light)]">({hotel.reviews} reviews)</span>
                  </div>

                  <p className="mt-1.5 flex items-start gap-1 text-[12px] font-medium leading-[1.35] text-[var(--text-light)]">
                    <MapPin size={11} className="mt-[1px] shrink-0" />
                    <span className="min-w-0">
                      {hotel.area} <span className="text-slate-300">•</span> {hotel.distance}
                    </span>
                  </p>

                  <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1">
                    {hotel.amenities.slice(0, 4).map((amenity) => {
                      const Icon = getAmenityIcon(amenity);
                      return (
                        <span
                          key={amenity}
                          className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-light)]"
                        >
                          <Icon size={10} className="shrink-0 text-[var(--primary-dark)]" />
                          {amenity}
                        </span>
                      );
                    })}
                  </div>

                  <div className="mt-auto pt-2">
                    <p className="flex flex-wrap items-baseline gap-x-1.5">
                      <span className="text-[12px] font-medium text-slate-400 line-through">
                        {rupees(hotel.oldPrice)}
                      </span>
                      <span className="text-[18px] font-extrabold leading-none">{rupees(hotel.price)}</span>
                      <span className="text-[11px] font-medium text-[var(--text-light)]">
                        / night{nights > 1 ? ` · ${rupees(hotel.price * nights)} total` : ''}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`${routePrefix}/hotel/rooms`, {
                          state: { hotel, checkIn, checkOut, rooms, guests },
                        })
                      }
                      className="mt-2 w-full rounded-[10px] bg-[linear-gradient(180deg,#FFD54F,#FFC107)] py-2.5 text-[13.5px] font-extrabold shadow-[0_6px_14px_rgba(245,183,0,0.32)] active:scale-[0.98] transition-transform"
                    >
                      View Rooms
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {visibleHotels.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-[var(--border)] bg-white px-4 py-10 text-center">
              <BedDouble size={26} className="mx-auto text-slate-300" />
              <p className="mt-2 text-[14.5px] font-extrabold">No stays in {searchedFor}</p>
              <p className="mt-1 text-[13px] font-medium text-[var(--text-light)]">
                Try another destination or clear the filter.
              </p>
              <button
                type="button"
                onClick={() => setSearchedFor('')}
                className="mt-3 rounded-[12px] bg-[var(--secondary)] px-4 py-2 text-[13.5px] font-extrabold text-[var(--primary-dark)]"
              >
                Show all hotels
              </button>
            </div>
          ) : null}

          {!showAll && visibleHotels.length > 4 ? (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full rounded-[14px] border border-[var(--border)] bg-white py-3 text-[13.5px] font-extrabold shadow-[var(--shadow-sm)]"
            >
              Show all {visibleHotels.length} hotels
            </button>
          ) : null}
        </div>
      </main>

      <HotelBottomNav routePrefix={routePrefix} />
    </div>
  );
};

export default HotelHome;
