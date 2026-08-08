import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowUpDown, CalendarDays, Car, Clock, Headphones, MapPin, Play, UserRound, Users,
} from 'lucide-react';
import api from '../../../shared/api/axiosInstance';
import {
  AiChatBubble, DesktopNav, LiveFleetPanel, QuickRail, ServiceCard,
} from '../components/desktop/DesktopChrome';
import {
  SERVICES, resolveBannerImage, unwrapResults, useDesktopTheme,
} from '../components/desktop/desktopShared';

/**
 * Desktop landing page for /taxi/user.
 *
 * Rendered only at lg and above; MobileHome keeps its own markup untouched
 * below that breakpoint. The hero image comes from the admin banner feed, and
 * the service tiles reuse the same images the mobile home already ships.
 */

/**
 * The strip is built from counts the server actually holds. Only "24/7" is
 * fixed, because it describes the service rather than measuring it, and a
 * tile with nothing to show is left out rather than padded with a guess.
 */
const buildStats = (stats) =>
  [
    { icon: Users, value: stats.customers, label: stats.customers === 1 ? 'Customer' : 'Customers' },
    { icon: Car, value: stats.rentalVehicles, label: 'Cars for hire' },
    { icon: MapPin, value: stats.cities, label: stats.cities === 1 ? 'City covered' : 'Cities covered' },
  ]
    .filter((item) => Number(item.value) > 0)
    .map((item) => ({ ...item, value: Number(item.value).toLocaleString('en-IN') }))
    .concat([{ icon: Headphones, value: '24/7', label: 'Customer support' }]);

const DesktopHome = () => {
  const navigate = useNavigate();
  const [theme, toggleTheme] = useDesktopTheme();
  const [banners, setBanners] = useState([]);
  const [search, setSearch] = useState({ pickup: '', drop: '', date: '', time: '' });
  const [fleet, setFleet] = useState([]);
  const [platformStats, setPlatformStats] = useState(null);

  // Hero artwork is admin-managed through the same banner feed the mobile
  // home uses, so uploading a top banner updates both surfaces.
  useEffect(() => {
    api.get('/users/platform-stats')
      .then((response) => setPlatformStats(response?.data || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/users/banners?type=top')
      .then((response) => {
        if (!cancelled) setBanners(unwrapResults(response));
      })
      .catch(() => {
        if (!cancelled) setBanners([]);
      });
    return () => { cancelled = true; };
  }, []);

  // The hero side panel lists real vehicles from the rental catalogue rather
  // than invented "recently booked" rows.
  useEffect(() => {
    let cancelled = false;
    api
      .get('/users/rental-vehicles')
      .then((response) => {
        if (!cancelled) setFleet(unwrapResults(response).slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setFleet([]);
      });
    return () => { cancelled = true; };
  }, []);

  // Prefer artwork uploaded for wide screens. A phone banner cropped to a
  // desktop hero loses its subject, which is why the two are separate; a banner
  // with only the phone image still works, it just crops the same as before.
  const heroImage = useMemo(() => {
    const wide = banners.find((banner) => banner?.desktopImage);
    if (wide) return resolveBannerImage(wide.desktopImage);

    const first = banners.find((banner) => banner?.image);
    return first ? resolveBannerImage(first.image) : '/taxi09_home_top_banner.png';
  }, [banners]);

  const submitSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams({ search: 'true' });
    if (search.pickup) params.set('location', search.pickup);
    if (search.drop) params.set('drop', search.drop);
    if (search.date) params.set('date', search.date);
    if (search.time) params.set('time', search.time);
    navigate(`/taxi/user/rental?${params.toString()}`);
  };

  const field = 'w-full bg-transparent text-[14px] font-semibold text-[var(--dh-text)] placeholder:text-[var(--dh-muted)] outline-none';

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath="/taxi/user" theme={theme} onToggleTheme={toggleTheme} />

      {/* -------------------------------------------------------------- Hero */}
      <section className="relative mx-auto max-w-[1440px] px-8 xl:px-12">
        <div className="relative grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] items-center gap-6 pt-6">
          <div className="relative z-10 pb-10">
            <div className="flex items-center gap-3">
              <span className="rounded-[10px] bg-[#FFF0B8] px-3 py-1.5 text-[15px] font-black text-slate-950">#1</span>
              <span className="text-[15px] font-semibold text-[var(--dh-text)]">Trusted Car Rental Brand in India</span>
            </div>

            <h1 className="mt-5 text-[52px] font-black leading-[1.08] tracking-[-0.035em] text-[var(--dh-text)]">
              Drive Your <span className="text-[#F5B700]">Journey.</span>
              <br />
              We Handle Everything.
            </h1>

            <p className="mt-5 max-w-[470px] text-[16.5px] font-medium leading-[1.6] text-[var(--dh-muted)]">
              Self Drive Cars, With Driver, Bike Rental, Bus Booking, Hotel Booking &amp; Tour Packages &ndash; All in One Place.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {[0, 1, 2, 3].map((index) => (
                  <span
                    key={index}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-[2.5px] border-[var(--dh-surface)] bg-[var(--dh-chip)] text-[12px] font-black text-[var(--dh-muted)]"
                  >
                    <UserRound size={15} strokeWidth={2.4} />
                  </span>
                ))}
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-[2.5px] border-[var(--dh-surface)] bg-[#F5B700] text-[12px] font-black text-slate-950">
                  4.9
                </span>
              </div>
              {/* The count is the real one, so the badge is dropped until there
                  is a figure to stand behind. */}
              <span className="text-[15px] font-semibold text-[var(--dh-text)]">
                {platformStats?.customers > 0
                  ? `Trusted by ${Number(platformStats.customers).toLocaleString('en-IN')} customers`
                  : 'Trusted by travellers across India'}
              </span>
            </div>

            <div className="mt-8 flex items-center gap-6">
              <button
                onClick={() => navigate('/taxi/user/rental')}
                className="flex h-[58px] items-center gap-4 rounded-[16px] bg-[#F5B700] pl-7 pr-2.5 text-[17px] font-bold text-slate-950 shadow-[0_12px_28px_rgba(245,183,0,0.35)] transition-transform hover:-translate-y-0.5"
              >
                Book Now
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-[#F5B700]">
                  <ArrowRight size={19} strokeWidth={2.8} />
                </span>
              </button>

              <button
                onClick={() => navigate('/taxi/user/tours')}
                className="flex items-center gap-3.5 text-[16.5px] font-bold text-[var(--dh-text)]"
              >
                <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-[var(--dh-border)] bg-[var(--dh-surface)]">
                  <Play size={17} className="ml-0.5 fill-current text-[var(--dh-text)]" />
                </span>
                Watch Video
              </button>
            </div>
          </div>

          {/* Hero banner - admin managed */}
          <div className="relative">
            <img
              src={heroImage}
              alt="Taxi09"
              className="h-[460px] w-full rounded-[28px] object-cover"
            />

            {/* Live fleet panel */}
            <LiveFleetPanel fleet={fleet} className="absolute right-[74px] top-8" />

            <QuickRail />
          </div>
        </div>

        {/* ---------------------------------------------------------- Search */}
        <form
          onSubmit={submitSearch}
          className="relative z-20 -mt-4 grid grid-cols-[1.2fr_auto_1.2fr_1fr_1fr_auto] items-center gap-0 rounded-[20px] bg-[var(--dh-surface)] p-3 shadow-[0_16px_44px_rgba(15,23,42,0.12)] ring-1 ring-[var(--dh-border)]"
        >
          <label className="px-5 py-1">
            <span className="block text-[13px] font-bold text-[var(--dh-text)]">Pickup Location</span>
            <span className="mt-1.5 flex items-center gap-2">
              <MapPin size={17} className="shrink-0 text-[#F5B700]" strokeWidth={2.4} />
              <input
                value={search.pickup}
                onChange={(event) => setSearch((current) => ({ ...current, pickup: event.target.value }))}
                placeholder="Enter city or location"
                className={field}
              />
            </span>
          </label>

          <button
            type="button"
            onClick={() => setSearch((current) => ({ ...current, pickup: current.drop, drop: current.pickup }))}
            className="mx-1 flex h-9 w-9 items-center justify-center rounded-full text-[var(--dh-muted)] hover:bg-[var(--dh-chip)]"
            aria-label="Swap pickup and drop"
          >
            <ArrowUpDown size={17} className="rotate-90" strokeWidth={2.4} />
          </button>

          <label className="border-l border-[var(--dh-border)] px-5 py-1">
            <span className="block text-[13px] font-bold text-[var(--dh-text)]">Drop Location</span>
            <span className="mt-1.5 flex items-center gap-2">
              <MapPin size={17} className="shrink-0 text-[#F5B700]" strokeWidth={2.4} />
              <input
                value={search.drop}
                onChange={(event) => setSearch((current) => ({ ...current, drop: event.target.value }))}
                placeholder="Enter city or location"
                className={field}
              />
            </span>
          </label>

          <label className="border-l border-[var(--dh-border)] px-5 py-1">
            <span className="block text-[13px] font-bold text-[var(--dh-text)]">Pickup Date</span>
            <span className="mt-1.5 flex items-center gap-2">
              <CalendarDays size={17} className="shrink-0 text-[#F5B700]" strokeWidth={2.4} />
              <input
                type="date"
                value={search.date}
                onChange={(event) => setSearch((current) => ({ ...current, date: event.target.value }))}
                className={field}
              />
            </span>
          </label>

          <label className="border-l border-[var(--dh-border)] px-5 py-1">
            <span className="block text-[13px] font-bold text-[var(--dh-text)]">Pickup Time</span>
            <span className="mt-1.5 flex items-center gap-2">
              <Clock size={17} className="shrink-0 text-[#F5B700]" strokeWidth={2.4} />
              <input
                type="time"
                value={search.time}
                onChange={(event) => setSearch((current) => ({ ...current, time: event.target.value }))}
                className={field}
              />
            </span>
          </label>

          <button
            type="submit"
            className="ml-3 flex h-[58px] items-center gap-3 rounded-[15px] bg-[#F5B700] px-7 text-[16px] font-bold text-slate-950 shadow-[0_10px_24px_rgba(245,183,0,0.32)] transition-transform hover:-translate-y-0.5"
          >
            Search Vehicles
            <ArrowRight size={19} strokeWidth={2.8} />
          </button>
        </form>
      </section>

      {/* ---------------------------------------------------------- Services */}
      <section className="mx-auto mt-12 max-w-[1440px] px-8 xl:px-12">
        <div className="grid grid-cols-[300px_minmax(0,1fr)] gap-8">
          <div>
            <p className="text-[13px] font-black uppercase tracking-[0.12em] text-[#F5B700]">Explore Our Services</p>
            <h2 className="mt-3 text-[34px] font-black leading-[1.15] tracking-[-0.035em] text-[var(--dh-text)]">
              All Your Travel Needs,
              <br />
              <span className="text-[#F5B700]">One Trusted Platform.</span>
            </h2>
            <p className="mt-4 text-[15px] font-medium leading-[1.6] text-[var(--dh-muted)]">
              From self-drive cars to hotel bookings, we provide everything you need for a comfortable and memorable journey.
            </p>
            <button
              onClick={() => navigate('/taxi/user/rental/type')}
              className="mt-6 flex h-[52px] items-center gap-3 rounded-[14px] border-2 border-[#F5B700] px-6 text-[15px] font-bold text-[var(--dh-text)] transition-colors hover:bg-[#FFF7DC]"
            >
              Explore All Services
              <ArrowRight size={17} strokeWidth={2.8} className="text-[#F5B700]" />
            </button>
          </div>

          {/* items-start, so one long caption does not leave every other card with a
              void between its text and its arrow. */}
          <div className="grid grid-cols-6 items-start gap-3.5">
            {SERVICES.map((service, index) => (
              <ServiceCard key={service.title} {...service} badge={index === 0 ? 'Popular' : undefined} />
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Stats */}
      <section className="mx-auto mt-10 max-w-[1440px] px-8 pb-16 xl:px-12">
        <div className="flex flex-wrap justify-between gap-6 rounded-[20px] bg-[#FFF9E6] px-10 py-7">
          {buildStats(platformStats || {}).map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-4">
              <Icon size={34} className="shrink-0 text-[#F5B700]" strokeWidth={2} />
              <div>
                <p className="text-[25px] font-black leading-none tracking-[-0.03em] text-slate-950">{value}</p>
                <p className="mt-1.5 text-[13.5px] font-semibold text-slate-600">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <AiChatBubble />
    </div>
  );
};

export default DesktopHome;
