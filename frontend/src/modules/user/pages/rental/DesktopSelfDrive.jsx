import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowUpDown, BadgeCheck, CalendarDays, CalendarRange, Car, Clock, CreditCard,
  Gauge, Headphones, IndianRupee, MapPin, Play, ShieldCheck, Sparkles, Truck, UserCheck, Users, Zap,
} from 'lucide-react';
import api from '../../../../shared/api/axiosInstance';
import {
  AiChatBubble, DesktopNav, LiveFleetPanel, QuickRail, ServiceCard,
} from '../../components/desktop/DesktopChrome';
import {
  SERVICES, resolveBannerImage, unwrapResults, useDesktopTheme,
} from '../../components/desktop/desktopShared';

/**
 * Desktop landing for /taxi/user/rental (Self Drive).
 *
 * Rendered only at lg and above by RentalHome; BikeRentalHome keeps the entire
 * mobile experience untouched below that breakpoint.
 */

const HERO_CHIPS = [
  { icon: Car, title: '1000+ Cars', copy: 'Wide Range' },
  { icon: IndianRupee, title: 'Best Prices', copy: 'Guaranteed' },
  { icon: Zap, title: 'Easy Booking', copy: 'Instant Confirm' },
  { icon: Headphones, title: '24/7 Support', copy: "We're here" },
];

const BOOKING_TABS = [
  { id: 'self-drive', icon: Gauge, title: 'Self Drive', copy: 'Drive on your own', path: '/taxi/user/rental' },
  { id: 'with-driver', icon: UserCheck, title: 'With Driver', copy: 'Professional Driver', path: '/taxi/user/with-driver' },
  { id: 'outstation', icon: Truck, title: 'Outstation', copy: 'One way / Round trip', path: '/taxi/user/cab/outstation' },
];

const TRUST_CHIPS = [
  { icon: BadgeCheck, label: 'Zero Hidden Charges' },
  { icon: CalendarRange, label: 'Free Cancellation*' },
  { icon: Gauge, label: 'Unlimited KM Options' },
  { icon: Sparkles, label: 'Sanitized Cars' },
];

const WHY_CHOOSE = [
  { icon: Car, title: 'Wide Range', copy: '1000+ Cars to choose from' },
  { icon: IndianRupee, title: 'Best Price', copy: 'Lowest Price Guaranteed' },
  { icon: CalendarRange, title: 'Flexible Booking', copy: 'Hourly, Daily, Weekly & Monthly' },
  { icon: Clock, title: 'Easy & Quick', copy: 'Simple steps & instant confirmation' },
  { icon: Headphones, title: '24/7 Support', copy: "We're here anytime you need us" },
];

const STATS = [
  { icon: Users, value: '10,000+', label: 'Happy Customers' },
  { icon: Car, value: '500+', label: 'Cars Available' },
  { icon: MapPin, value: '50+', label: 'Cities Covered' },
  { icon: Headphones, value: '24/7', label: 'Customer Support' },
];

const ASSURANCES = [
  { icon: CalendarDays, title: 'Easy Booking Process', copy: 'Book in just a few clicks' },
  { icon: CreditCard, title: 'Secure Payments', copy: '100% safe & secure' },
  { icon: ShieldCheck, title: 'Verified Partners', copy: 'Trusted & verified partners' },
  { icon: Zap, title: 'Instant Confirmation', copy: 'No waiting, go driving!' },
];

const DesktopSelfDrive = () => {
  const navigate = useNavigate();
  const [theme, toggleTheme] = useDesktopTheme();

  const [banners, setBanners] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [activeTab, setActiveTab] = useState('self-drive');
  const [search, setSearch] = useState({ pickup: '', drop: '', date: '', time: '' });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/users/banners?type=top').catch(() => null),
      api.get('/users/rental-vehicles').catch(() => null),
    ]).then(([bannerRes, fleetRes]) => {
      if (cancelled) return;
      setBanners(bannerRes ? unwrapResults(bannerRes) : []);
      setFleet(fleetRes ? unwrapResults(fleetRes).slice(0, 4) : []);
    });
    return () => { cancelled = true; };
  }, []);

  const heroImage = useMemo(() => {
    const first = banners.find((banner) => banner?.image);
    return first ? resolveBannerImage(first.image) : '/taxi09_rental_hero_banner.png';
  }, [banners]);

  const submitSearch = (event) => {
    event.preventDefault();
    const tab = BOOKING_TABS.find((item) => item.id === activeTab);

    // Only the self-drive tab searches the rental catalogue; the others are
    // separate flows with their own booking screens.
    if (tab && tab.id !== 'self-drive') {
      navigate(tab.path);
      return;
    }

    const params = new URLSearchParams({ search: 'true' });
    if (search.pickup) params.set('location', search.pickup);
    if (search.drop) params.set('drop', search.drop);
    if (search.date) params.set('date', search.date);
    if (search.time) params.set('time', search.time);
    navigate(`/taxi/user/rental?${params.toString()}`);
  };

  const field = 'w-full bg-transparent text-[13.5px] font-semibold text-[var(--dh-text)] placeholder:text-[var(--dh-muted)] outline-none';
  const fieldBox = 'mt-1.5 flex h-[46px] items-center gap-2 rounded-[11px] border border-[var(--dh-border)] bg-[var(--dh-surface)] px-3';

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath="/taxi/user/rental" theme={theme} onToggleTheme={toggleTheme} />

      {/* -------------------------------------------------------------- Hero */}
      <section className="relative mx-auto max-w-[1440px] px-8 xl:px-12">
        <div className="relative grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)] items-center gap-6 pt-8">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2.5 rounded-[10px] bg-[#FFF7DC] px-3 py-2">
              <span className="rounded-[7px] bg-[#F5B700] px-2 py-0.5 text-[13px] font-black text-slate-950">#1</span>
              <span className="text-[13.5px] font-bold text-slate-800">Trusted Self Drive Car Rental Platform in India</span>
            </div>

            <h1 className="mt-6 text-[58px] font-black leading-[1.02] tracking-[-0.04em] text-[var(--dh-text)]">
              Self Drive,
              <br />
              <span className="text-[#F5B700]">Your Way.</span>
            </h1>

            <p className="mt-5 max-w-[430px] text-[16px] font-medium leading-[1.55] text-[var(--dh-muted)]">
              Drive your dream car on your terms.
              <br />
              No driver. No limits. Just you and the road.
            </p>

            <div className="mt-7 flex flex-wrap gap-2.5">
              {HERO_CHIPS.map(({ icon: Icon, title, copy }) => (
                <span
                  key={title}
                  className="flex items-center gap-2 rounded-[10px] bg-[var(--dh-surface)] px-3 py-2 shadow-[0_4px_14px_rgba(15,23,42,0.07)] ring-1 ring-[var(--dh-border)]"
                >
                  <Icon size={17} className="shrink-0 text-[#F5B700]" strokeWidth={2.3} />
                  <span className="leading-tight">
                    <span className="block text-[12px] font-black text-[var(--dh-text)]">{title}</span>
                    <span className="block text-[10.5px] font-semibold text-[var(--dh-muted)]">{copy}</span>
                  </span>
                </span>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-6">
              <button
                onClick={() => navigate('/taxi/user/rental?search=true')}
                className="flex h-[56px] items-center gap-4 rounded-[15px] bg-[#F5B700] pl-6 pr-2.5 text-[16px] font-bold text-slate-950 shadow-[0_12px_28px_rgba(245,183,0,0.35)] transition-transform hover:-translate-y-0.5"
              >
                Book Self Drive Car
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-[#F5B700]">
                  <ArrowRight size={18} strokeWidth={2.8} />
                </span>
              </button>

              <button
                onClick={() => navigate('/taxi/user/rental/type')}
                className="flex items-center gap-3 text-[16px] font-bold text-[var(--dh-text)]"
              >
                <span className="flex h-[48px] w-[48px] items-center justify-center rounded-full border-2 border-[var(--dh-border)] bg-[var(--dh-surface)]">
                  <Play size={16} className="ml-0.5 fill-current text-[var(--dh-text)]" />
                </span>
                How It Works
              </button>
            </div>
          </div>

          <div className="relative">
            <img src={heroImage} alt="Self drive" className="h-[440px] w-full rounded-[26px] object-cover" />
            <LiveFleetPanel fleet={fleet} className="absolute right-[70px] top-4" />
            <QuickRail />
          </div>
        </div>

        {/* ------------------------------------------------------- Booking card */}
        <div className="relative z-20 mt-6 rounded-[22px] bg-[var(--dh-surface)] p-6 shadow-[0_16px_44px_rgba(15,23,42,0.12)] ring-1 ring-[var(--dh-border)]">
          <div className="grid grid-cols-3 gap-3">
            {BOOKING_TABS.map(({ id, icon: Icon, title, copy }) => {
              const isActive = id === activeTab;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-3 rounded-[13px] border px-4 py-3 text-left transition-colors ${
                    isActive
                      ? 'border-[#F5B700] bg-[#F5B700]'
                      : 'border-[var(--dh-border)] bg-[var(--dh-surface)] hover:bg-[var(--dh-chip)]'
                  }`}
                >
                  <Icon size={22} className={isActive ? 'text-slate-950' : 'text-[var(--dh-muted)]'} strokeWidth={2.2} />
                  <span>
                    <span className={`block text-[14.5px] font-black ${isActive ? 'text-slate-950' : 'text-[var(--dh-text)]'}`}>{title}</span>
                    <span className={`block text-[11.5px] font-semibold ${isActive ? 'text-slate-800' : 'text-[var(--dh-muted)]'}`}>{copy}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <form onSubmit={submitSearch} className="mt-5 grid grid-cols-[1.15fr_auto_1.15fr_1fr_1fr_auto] items-end gap-3 border-t border-[var(--dh-border)] pt-5">
            <label>
              <span className="block text-[12.5px] font-bold text-[var(--dh-text)]">Pickup Location</span>
              <span className={fieldBox}>
                <MapPin size={16} className="shrink-0 text-[var(--dh-muted)]" strokeWidth={2.4} />
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
              className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--dh-border)] text-[var(--dh-muted)] hover:bg-[var(--dh-chip)]"
              aria-label="Swap pickup and drop"
            >
              <ArrowUpDown size={16} className="rotate-90" strokeWidth={2.4} />
            </button>

            <label>
              <span className="block text-[12.5px] font-bold text-[var(--dh-text)]">Drop Location</span>
              <span className={fieldBox}>
                <MapPin size={16} className="shrink-0 text-[var(--dh-muted)]" strokeWidth={2.4} />
                <input
                  value={search.drop}
                  onChange={(event) => setSearch((current) => ({ ...current, drop: event.target.value }))}
                  placeholder="Enter city or location"
                  className={field}
                />
              </span>
            </label>

            <label>
              <span className="block text-[12.5px] font-bold text-[var(--dh-text)]">Pickup Date</span>
              <span className={fieldBox}>
                <CalendarDays size={16} className="shrink-0 text-[var(--dh-muted)]" strokeWidth={2.4} />
                <input
                  type="date"
                  value={search.date}
                  onChange={(event) => setSearch((current) => ({ ...current, date: event.target.value }))}
                  className={field}
                />
              </span>
            </label>

            <label>
              <span className="block text-[12.5px] font-bold text-[var(--dh-text)]">Pickup Time</span>
              <span className={fieldBox}>
                <Clock size={16} className="shrink-0 text-[var(--dh-muted)]" strokeWidth={2.4} />
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
              className="flex h-[46px] items-center gap-2.5 rounded-[12px] bg-[#F5B700] px-6 text-[15px] font-bold text-slate-950 shadow-[0_10px_24px_rgba(245,183,0,0.32)] transition-transform hover:-translate-y-0.5"
            >
              Search Cars
              <ArrowRight size={17} strokeWidth={2.8} />
            </button>
          </form>

          <div className="mt-5 grid grid-cols-4 gap-3 border-t border-[var(--dh-border)] pt-5">
            {TRUST_CHIPS.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center justify-center gap-2 rounded-[11px] bg-[#FFFBEC] py-2.5">
                <Icon size={16} className="shrink-0 text-[#F5B700]" strokeWidth={2.4} />
                <span className="text-[12.5px] font-bold text-slate-800">{label}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Services */}
      <section className="mx-auto mt-12 max-w-[1440px] px-8 xl:px-12">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[12.5px] font-black uppercase tracking-[0.12em] text-[#F5B700]">Explore Our Services</p>
            <h2 className="mt-2 text-[30px] font-black leading-[1.15] tracking-[-0.035em] text-[var(--dh-text)]">
              Everything You Need
              <br />
              <span className="text-[#F5B700]">For Your Journey</span>
            </h2>
          </div>
          <button
            onClick={() => navigate('/taxi/user/rental/type')}
            className="flex items-center gap-2 text-[14.5px] font-bold text-[var(--dh-text)] hover:text-[#F5B700]"
          >
            View All Services <ArrowRight size={16} strokeWidth={2.8} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-6 gap-3.5">
          {SERVICES.map((service, index) => (
            <ServiceCard key={service.title} {...service} highlighted={index === 0} />
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- Why choose */}
      <section className="mx-auto mt-10 max-w-[1440px] px-8 xl:px-12">
        <div className="rounded-[20px] bg-[#FFFBEC] p-6">
          <p className="text-[12.5px] font-black uppercase tracking-[0.1em] text-slate-800">Why Choose Taxi09 Self Drive?</p>

          <div className="mt-4 grid grid-cols-[repeat(5,minmax(0,1fr))_280px] items-center gap-4">
            {WHY_CHOOSE.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="flex items-start gap-2.5">
                <Icon size={26} className="mt-0.5 shrink-0 text-[#F5B700]" strokeWidth={2} />
                <span>
                  <span className="block text-[13.5px] font-black text-slate-900">{title}</span>
                  <span className="mt-0.5 block text-[11.5px] font-semibold leading-tight text-slate-600">{copy}</span>
                </span>
              </div>
            ))}

            <div className="flex items-center gap-3 rounded-[16px] bg-[#F5B700] p-4">
              <ShieldCheck size={40} className="shrink-0 text-slate-950" strokeWidth={1.8} />
              <span>
                <span className="block text-[14px] font-black leading-tight text-slate-950">100% SAFE &amp; VERIFIED CARS</span>
                <span className="mt-1 block text-[11.5px] font-semibold leading-tight text-slate-800">Your safety is our priority.</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Stats */}
      <section className="mx-auto mt-8 max-w-[1440px] px-8 xl:px-12">
        <div className="grid grid-cols-4 divide-x divide-white/15 rounded-[20px] bg-slate-950 px-8 py-6">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-3.5 px-4 first:pl-0">
              <Icon size={30} className="shrink-0 text-[#F5B700]" strokeWidth={2} />
              <div>
                <p className="text-[23px] font-black leading-none tracking-[-0.03em] text-white">{value}</p>
                <p className="mt-1.5 text-[12.5px] font-semibold text-slate-400">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- Assurances */}
      <section className="mx-auto mt-4 max-w-[1440px] px-8 pb-20 xl:px-12">
        <div className="grid grid-cols-4 gap-4 rounded-[18px] bg-[var(--dh-surface)] px-8 py-5 ring-1 ring-[var(--dh-border)]">
          {ASSURANCES.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="flex items-center gap-3">
              <Icon size={26} className="shrink-0 text-[#F5B700]" strokeWidth={2} />
              <span>
                <span className="block text-[13.5px] font-black text-[var(--dh-text)]">{title}</span>
                <span className="mt-0.5 block text-[11.5px] font-semibold text-[var(--dh-muted)]">{copy}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <AiChatBubble />
    </div>
  );
};

export default DesktopSelfDrive;
