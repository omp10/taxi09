import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BadgeCheck,
  CalendarDays,
  Camera,
  ChevronRight,
  Clock3,
  Crown,
  Globe2,
  Heart,
  Home,
  Images,
  Landmark,
  Luggage,
  Palmtree,
  Plane,
  Search,
  ShieldCheck,
  Star,
  Tag,
  User,
  Users,
  Utensils,
  Waves,
} from 'lucide-react';
import { rememberPackage } from '../../utils/packageHandoff';
import AppHeader from '../../components/AppHeader';
import contentService from '../../services/contentService';

const getRoutePrefix = (pathname = '') => (pathname.startsWith('/taxi/user') ? '/taxi/user' : '');

const rupees = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const FILTERS = [
  { id: 'all', label: 'All Trips', icon: Globe2 },
  { id: 'beach', label: 'Beach', icon: Waves },
  { id: 'city', label: 'City', icon: Landmark },
  { id: 'honeymoon', label: 'Honeymoon', icon: Heart },
  { id: 'luxury', label: 'Luxury', icon: Crown },
  { id: 'family', label: 'Family', icon: Users },
];

const PERK_ICONS = {
  'Visa Assistance': BadgeCheck,
  'Return Flights': Plane,
  'Airport Transfers': Luggage,
  'Guided Tours': Camera,
  'All Meals': Utensils,
  'Travel Insurance': ShieldCheck,
};

const FALLBACK_TRIPS = [
  {
    id: 'thailand',
    badge: 'BESTSELLER',
    badgeTone: 'bg-violet-600 text-white',
    title: 'Thailand Island Hopper',
    country: 'Thailand',
    category: 'beach',
    stops: ['Bangkok', 'Pattaya', 'Phuket', 'Krabi'],
    image: '/taxi09_intl_thailand.jpg',
    gallery: ['/taxi09_intl_thailand.jpg', '/taxi09_intl_bali.jpg', '/taxi09_intl_maldives.jpg'],
    photos: 8,
    days: '7 Days / 6 Nights',
    durationDays: 7,
    highlights: ['All Meals', 'Ocean View'],
    perks: ['Visa Assistance', 'Return Flights', 'Airport Transfers', 'Guided Tours'],
    rating: 4.7,
    reviews: '892',
    oldPrice: 159999,
    price: 124999,
    departure: '18 Jun 2026',
  },
  {
    id: 'bali',
    badge: 'POPULAR CHOICE',
    badgeTone: 'bg-sky-600 text-white',
    title: 'Bali Paradise Escape',
    country: 'Indonesia',
    category: 'honeymoon',
    stops: ['Ubud', 'Seminyak', 'Nusa Penida', 'Kuta'],
    image: '/taxi09_intl_bali.jpg',
    gallery: ['/taxi09_intl_bali.jpg', '/taxi09_intl_thailand.jpg', '/taxi09_intl_maldives.jpg'],
    photos: 6,
    days: '5 Days / 4 Nights',
    durationDays: 5,
    highlights: ['All Meals', 'Private Villa'],
    perks: ['Visa Assistance', 'Return Flights', 'Airport Transfers', 'Guided Tours'],
    rating: 4.5,
    reviews: '642',
    oldPrice: 119999,
    price: 89999,
    departure: '12 May 2026',
  },
  {
    id: 'dubai',
    badge: 'TRENDING',
    badgeTone: 'bg-amber-500 text-slate-950',
    title: 'Dubai City & Desert',
    country: 'UAE',
    category: 'city',
    stops: ['Burj Khalifa', 'Desert Safari', 'Marina', 'Palm Jumeirah'],
    image: '/taxi09_intl_dubai.jpg',
    gallery: ['/taxi09_intl_dubai.jpg', '/taxi09_intl_singapore.jpg', '/taxi09_intl_thailand.jpg'],
    photos: 10,
    days: '4 Days / 3 Nights',
    durationDays: 4,
    highlights: ['Breakfast', 'City View'],
    perks: ['Visa Assistance', 'Return Flights', 'Airport Transfers', 'Guided Tours'],
    rating: 4.6,
    reviews: '1.4K',
    oldPrice: 94999,
    price: 69999,
    departure: '02 Jun 2026',
  },
  {
    id: 'maldives',
    badge: 'LUXURY',
    badgeTone: 'bg-slate-900 text-[var(--primary)]',
    title: 'Maldives Overwater Retreat',
    country: 'Maldives',
    category: 'luxury',
    stops: ['Male', 'Overwater Villa', 'Reef Snorkelling', 'Sunset Cruise'],
    image: '/taxi09_intl_maldives.jpg',
    gallery: ['/taxi09_intl_maldives.jpg', '/taxi09_intl_bali.jpg', '/taxi09_intl_thailand.jpg'],
    photos: 12,
    days: '5 Days / 4 Nights',
    durationDays: 5,
    highlights: ['All Meals', 'Overwater Villa'],
    perks: ['Return Flights', 'Airport Transfers', 'All Meals', 'Travel Insurance'],
    rating: 4.9,
    reviews: '523',
    oldPrice: 259999,
    price: 199999,
    departure: '25 Jun 2026',
  },
  {
    id: 'singapore',
    badge: 'FAMILY PICK',
    badgeTone: 'bg-emerald-600 text-white',
    title: 'Singapore & Malaysia',
    country: 'Singapore',
    category: 'family',
    stops: ['Sentosa', 'Universal Studios', 'Genting', 'Kuala Lumpur'],
    image: '/taxi09_intl_singapore.jpg',
    gallery: ['/taxi09_intl_singapore.jpg', '/taxi09_intl_dubai.jpg', '/taxi09_intl_vietnam.jpg'],
    photos: 9,
    days: '6 Days / 5 Nights',
    durationDays: 6,
    highlights: ['Breakfast', 'Theme Parks'],
    perks: ['Visa Assistance', 'Return Flights', 'Airport Transfers', 'Guided Tours'],
    rating: 4.4,
    reviews: '1.1K',
    oldPrice: 139999,
    price: 109999,
    departure: '08 Jul 2026',
  },
  {
    id: 'vietnam',
    badge: 'NEW',
    badgeTone: 'bg-rose-500 text-white',
    title: 'Vietnam Explorer',
    country: 'Vietnam',
    category: 'beach',
    stops: ['Hanoi', 'Ha Long Bay', 'Da Nang', 'Ho Chi Minh'],
    image: '/taxi09_intl_vietnam.jpg',
    gallery: ['/taxi09_intl_vietnam.jpg', '/taxi09_intl_thailand.jpg', '/taxi09_intl_singapore.jpg'],
    photos: 7,
    days: '6 Days / 5 Nights',
    durationDays: 6,
    highlights: ['All Meals', 'Bay Cruise'],
    perks: ['Visa Assistance', 'Return Flights', 'Airport Transfers', 'Guided Tours'],
    rating: 4.5,
    reviews: '388',
    oldPrice: 104999,
    price: 79999,
    departure: '20 Jun 2026',
  },
];

/** API records carry durationLabel/departureDate/badge; the card expects days/departure/tag. */
const fromApi = (item) => ({
  ...item,
  id: item.slug || item._id,
  days: item.durationLabel || `${item.durationDays} Days`,
  departure: item.departureDate || '',
  highlights: item.highlights?.length ? item.highlights : [],
  perks: item.perks?.length ? item.perks : [],
});

const InternationalBottomNav = ({ routePrefix }) => {
  const navigate = useNavigate();
  const items = [
    { label: 'Home', icon: Home, path: routePrefix || '/user' },
    { label: 'Bookings', icon: CalendarDays, path: `${routePrefix}/activity` },
    { label: 'Packages', icon: Luggage, path: `${routePrefix}/international`, center: true },
    { label: 'Offers', icon: Tag, path: `${routePrefix}/promo` },
    { label: 'Account', icon: User, path: `${routePrefix}/profile` },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 border-t border-[var(--border)] bg-white px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 shadow-[0_-8px_22px_rgba(15,23,42,0.1)]">
      <div className="flex items-end justify-around">
        {items.map(({ label, icon: Icon, path, center }) => (
          <button key={label} type="button" onClick={() => navigate(path)} className="flex flex-1 flex-col items-center gap-1">
            <span
              className={
                center
                  ? '-mt-7 flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[var(--primary)] text-[var(--text)] shadow-[0_10px_22px_rgba(245,183,0,0.44)] ring-4 ring-white'
                  : 'flex h-6 items-center justify-center text-[var(--text-light)]'
              }
            >
              <Icon size={center ? 24 : 20} strokeWidth={center ? 2.5 : 2.2} />
            </span>
            <span className={`text-[10.5px] ${center ? 'font-extrabold text-[var(--text)]' : 'font-semibold text-[var(--text-light)]'}`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

const InternationalHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routePrefix = useMemo(() => getRoutePrefix(location.pathname), [location.pathname]);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [wishlist, setWishlist] = useState([]);
  const [trips, setTrips] = useState(FALLBACK_TRIPS);

  useEffect(() => {
    let active = true;
    contentService.getTravelPackages('international', FALLBACK_TRIPS).then((results) => {
      if (active) setTrips(results.map((item) => (item.slug ? fromApi(item) : item)));
    });
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return trips.filter((trip) => {
      if (filter !== 'all' && trip.category !== filter) return false;
      if (!needle) return true;
      return [trip.title, trip.country, ...trip.stops].join(' ').toLowerCase().includes(needle);
    });
  }, [filter, query, trips]);

  const avgRating = useMemo(() => {
    const total = trips.reduce((sum, trip) => sum + Number(trip.rating || 0), 0);
    return trips.length ? (total / trips.length).toFixed(1) : "0.0";
  }, [trips]);

  const toggleWishlist = (id) =>
    setWishlist((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-[var(--background)] pb-28 text-[var(--text)]">
      <AppHeader subtitle="INTERNATIONAL" />

      {/* Hero */}
      <section className="relative h-[186px] overflow-hidden bg-slate-900">
        <img src="/taxi09_intl_hero.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />

        <div className="absolute inset-x-0 top-0 px-4 pt-5">
          <h1 className="text-[22px] font-extrabold leading-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
            Explore the <span className="font-serif italic text-[var(--primary)]">World</span> Beyond Borders
          </h1>
          <p className="mt-1 text-[11.5px] font-medium text-white/85">Unforgettable international escapes</p>
        </div>

        <div className="absolute inset-x-0 bottom-4 px-4">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
            <Search size={16} className="shrink-0 text-[var(--text-light)]" strokeWidth={2.6} />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search country, city or trip..."
              className="w-full min-w-0 bg-transparent text-[12.5px] font-semibold outline-none placeholder:font-medium placeholder:text-slate-400"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="shrink-0 text-[11px] font-bold text-[var(--primary-dark)]"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <main className="px-3">
        {/* Section head */}
        <div className="mt-3.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[17px] font-extrabold tracking-[-0.02em]">Popular Trips</h2>
            <p className="mt-0.5 text-[10.5px] font-medium text-[var(--text-light)]">
              Handpicked international packages for your next adventure
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-[12px] font-extrabold">
            <Star size={13} className="fill-[var(--primary)] text-[var(--primary)]" />
            {avgRating}
            <span className="text-[9.5px] font-medium text-[var(--text-light)]">(3.9K)</span>
          </span>
        </div>

        {/* Filters */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {FILTERS.map(({ id, label, icon: Icon }) => {
            const active = filter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-[11px] font-extrabold transition-colors ${
                  active
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--text)] shadow-[0_6px_14px_rgba(245,183,0,0.32)]'
                    : 'border-[var(--border)] bg-white text-[var(--text-light)]'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Trip cards */}
        <div className="mt-1 space-y-3.5 app-grid">
          {visible.map((trip) => {
            const off = Math.round(((trip.oldPrice - trip.price) / trip.oldPrice) * 100);
            const liked = wishlist.includes(trip.id);

            return (
              <article
                key={trip.id}
                className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]"
              >
                <div className="flex">
                  <div className="relative h-auto w-[142px] shrink-0 self-stretch overflow-hidden bg-slate-900">
                    <img src={trip.image} alt={trip.title} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    <span className={`absolute left-2 top-2 rounded-[6px] px-1.5 py-0.5 text-[7.5px] font-extrabold tracking-wide ${trip.badgeTone}`}>
                      {trip.badge}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(trip.id)}
                      aria-label={liked ? 'Remove from wishlist' : 'Save trip'}
                      className="absolute left-2 top-8 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 active:scale-90 transition-transform"
                    >
                      <Heart size={13} className={liked ? 'fill-rose-500 text-rose-500' : 'text-slate-600'} />
                    </button>

                    <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-[6px] bg-black/65 px-1.5 py-0.5 text-[8px] font-bold text-white backdrop-blur-sm">
                      <Images size={9} /> {trip.photos} Photos
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 p-3">
                    <h3 className="text-[14px] font-extrabold leading-tight">{trip.title}</h3>
                    <p className="mt-1 truncate text-[9px] font-semibold text-[var(--text-light)]">
                      {trip.stops.join(' • ')}
                    </p>

                    <div className="mt-1.5 flex flex-nowrap items-center gap-x-2 overflow-hidden whitespace-nowrap text-[8.5px] font-semibold text-[var(--text-light)]">
                      <span className="flex items-center gap-1">
                        <Clock3 size={10} className="text-[var(--primary-dark)]" /> {trip.days}
                      </span>
                      {trip.highlights.map((item) => (
                        <span key={item} className="flex items-center gap-1">
                          <Utensils size={10} className="text-[var(--primary-dark)]" /> {item}
                        </span>
                      ))}
                    </div>

                    <p className="mt-1.5 flex items-center gap-1 text-[10px] font-extrabold">
                      <Star size={11} className="fill-[var(--primary)] text-[var(--primary)]" />
                      {trip.rating}
                      <span className="font-medium text-[var(--text-light)]">({trip.reviews} Reviews)</span>
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
                      <span className="text-[16px] font-extrabold leading-none">{rupees(trip.price)}</span>
                      <span className="text-[9.5px] font-medium text-slate-400 line-through">
                        {rupees(trip.oldPrice)}
                      </span>
                      <span className="text-[8.5px] font-medium text-[var(--text-light)]">/ person</span>
                      <span className="ml-auto rounded-[6px] bg-[var(--secondary)] px-1.5 py-0.5 text-[9px] font-extrabold text-[var(--primary-dark)]">
                        {off}% OFF
                      </span>
                    </div>
                  </div>
                </div>

                {/* Perks strip */}
                <div className="grid grid-cols-4 gap-1 border-t border-[var(--border)] px-3 py-2.5">
                  {trip.perks.map((perk) => {
                    const Icon = PERK_ICONS[perk] || BadgeCheck;
                    return (
                      <span key={perk} className="flex min-w-0 flex-col items-center gap-1 text-center">
                        <Icon size={14} className="text-[var(--primary-dark)]" />
                        <span className="text-[7.5px] font-semibold leading-tight text-[var(--text-light)]">{perk}</span>
                      </span>
                    );
                  })}
                </div>

                {/* Departure footer */}
                <div className="flex items-center justify-between gap-2 bg-[var(--secondary)] px-3 py-2">
                  <span className="flex min-w-0 items-center gap-1.5 text-[10px] font-bold">
                    <CalendarDays size={12} className="shrink-0 text-[var(--primary-dark)]" />
                    <span className="truncate">Next Departure: {trip.departure}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      rememberPackage('international', trip);
                      navigate(`${routePrefix}/international/details/${trip.slug}`, { state: { trip } });
                    }}
                    className="flex shrink-0 items-center gap-1 rounded-[9px] bg-[linear-gradient(180deg,#FFD54F,#FFC107)] px-3 py-1.5 text-[10.5px] font-extrabold shadow-[0_6px_14px_rgba(245,183,0,0.3)]"
                  >
                    View Details <ChevronRight size={12} strokeWidth={3} />
                  </button>
                </div>
              </article>
            );
          })}

          {visible.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-[var(--border)] bg-white px-4 py-10 text-center">
              <Palmtree size={26} className="mx-auto text-slate-300" />
              <p className="mt-2 text-[13px] font-extrabold">No trips match your search</p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setFilter('all');
                }}
                className="mt-3 rounded-[12px] bg-[var(--secondary)] px-4 py-2 text-[11.5px] font-extrabold text-[var(--primary-dark)]"
              >
                Show all trips
              </button>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => toast('More destinations landing soon')}
          className="mt-4 w-full rounded-[14px] border border-[var(--border)] bg-white py-3 text-[12px] font-extrabold shadow-[var(--shadow-sm)]"
        >
          Request a custom itinerary
        </button>
      </main>

      <InternationalBottomNav routePrefix={routePrefix} />
    </div>
  );
};

export default InternationalHome;
