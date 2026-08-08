import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowUpDown, BadgeCheck, Bus, CalendarDays, Headphones, Lock, MapPin,
  RefreshCcw, Search, Ticket,
} from 'lucide-react';
import userBusService from '../../services/busService';
import { AiChatBubble, DesktopNav } from '../../components/desktop/DesktopChrome';
import { useDesktopTheme } from '../../components/desktop/desktopShared';

/**
 * Desktop bus booking for /taxi/user/bus.
 *
 * Search and popular routes come from the live bus catalogue; searching hands
 * off to /bus/list, the same results screen the mobile flow uses.
 */

const TRUST = [
  { icon: BadgeCheck, title: 'Verified Operators', copy: 'Every bus is checked' },
  { icon: Ticket, title: 'Instant Tickets', copy: 'Confirmed in seconds' },
  { icon: Lock, title: 'Secure Payments', copy: '100% safe checkout' },
  { icon: RefreshCcw, title: 'Easy Cancellation', copy: 'As per operator policy' },
  { icon: Headphones, title: '24/7 Support', copy: "We're here to help" },
];

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const DesktopBus = () => {
  const navigate = useNavigate();
  const [theme, toggleTheme] = useDesktopTheme();

  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({ fromCity: '', toCity: '', date: todayISO() });
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    userBusService
      .getRoutes()
      .then((response) => {
        if (cancelled) return;
        const data = response?.data?.data ?? response?.data;
        setRoutes(Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []);
      })
      .catch(() => { if (!cancelled) setRoutes([]); });
    return () => { cancelled = true; };
  }, []);

  const cities = useMemo(() => {
    const set = new Set();
    for (const route of routes) {
      if (route.fromCity) set.add(route.fromCity);
      if (route.toCity) set.add(route.toCity);
    }
    return [...set].filter(Boolean).sort();
  }, [routes]);

  // Results live on /bus/list, which expects { fromCity, toCity, date } state.
  const runSearch = (override) => {
    const query = { ...form, ...override };
    if (!query.fromCity || !query.toCity) {
      setError('Choose both a from and to city.');
      return;
    }
    setError('');
    navigate('/taxi/user/bus/list', { state: query });
  };

  const field = 'w-full bg-transparent text-[14px] font-bold text-[var(--dh-text)] placeholder:font-semibold placeholder:text-[var(--dh-muted)] outline-none';

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath="/taxi/user/bus" theme={theme} onToggleTheme={toggleTheme} />

      <section className="mx-auto max-w-[1440px] px-8 pb-20 pt-5 xl:px-12">
        {/* -------------------------------------------------------------- Hero */}
        <div className="relative overflow-hidden rounded-[20px] bg-[linear-gradient(100deg,#FFF6DE_0%,#FFFBEF_50%,#EAF6FF_100%)] px-9 py-10">
          <div className="relative z-10 max-w-[520px]">
            <p className="text-[12.5px] font-black uppercase tracking-[0.12em] text-[#F5B700]">Bus Booking</p>
            <h1 className="mt-2.5 text-[38px] font-black leading-[1.1] tracking-[-0.035em] text-slate-950">
              Book Bus Tickets
            </h1>
            <p className="mt-3 text-[15px] font-medium leading-[1.55] text-slate-700">
              Comfortable seaters and sleepers on every major route, with live tracking and instant confirmation.
            </p>
          </div>
          <Bus size={220} className="pointer-events-none absolute -bottom-8 right-10 text-[#F5B700]/25" strokeWidth={1.1} />
        </div>

        {/* ------------------------------------------------------------ Search */}
        <form
          onSubmit={(event) => { event.preventDefault(); runSearch(); }}
          className="relative z-20 -mt-5 mx-6 grid grid-cols-[1.2fr_auto_1.2fr_1fr_auto] items-center rounded-[18px] bg-[var(--dh-surface)] p-3 shadow-[0_16px_44px_rgba(15,23,42,0.12)] ring-1 ring-[var(--dh-border)]"
        >
          <label className="px-5 py-1">
            <span className="block text-[12.5px] font-bold text-[var(--dh-text)]">From</span>
            <span className="mt-1.5 flex items-center gap-2">
              <MapPin size={16} className="shrink-0 text-[#F5B700]" strokeWidth={2.4} />
              <input
                list="bus-cities"
                value={form.fromCity}
                onChange={(e) => setForm((c) => ({ ...c, fromCity: e.target.value }))}
                placeholder="Departure city"
                className={field}
              />
            </span>
          </label>

          <button
            type="button"
            onClick={() => setForm((c) => ({ ...c, fromCity: c.toCity, toCity: c.fromCity }))}
            className="mx-1 flex h-9 w-9 items-center justify-center rounded-full text-[var(--dh-muted)] hover:bg-[var(--dh-chip)]"
            aria-label="Swap cities"
          >
            <ArrowUpDown size={16} className="rotate-90" strokeWidth={2.4} />
          </button>

          <label className="border-l border-[var(--dh-border)] px-5 py-1">
            <span className="block text-[12.5px] font-bold text-[var(--dh-text)]">To</span>
            <span className="mt-1.5 flex items-center gap-2">
              <MapPin size={16} className="shrink-0 text-[#F5B700]" strokeWidth={2.4} />
              <input
                list="bus-cities"
                value={form.toCity}
                onChange={(e) => setForm((c) => ({ ...c, toCity: e.target.value }))}
                placeholder="Destination city"
                className={field}
              />
            </span>
          </label>

          <label className="border-l border-[var(--dh-border)] px-5 py-1">
            <span className="block text-[12.5px] font-bold text-[var(--dh-text)]">Travel Date</span>
            <span className="mt-1.5 flex items-center gap-2">
              <CalendarDays size={16} className="shrink-0 text-[#F5B700]" strokeWidth={2.4} />
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((c) => ({ ...c, date: e.target.value }))}
                className={field}
              />
            </span>
          </label>

          <button
            type="submit"
            className="ml-3 flex h-[54px] items-center gap-2.5 rounded-[13px] bg-[#F5B700] px-7 text-[15.5px] font-bold text-slate-950 shadow-[0_10px_24px_rgba(245,183,0,0.3)]"
          >
            <Search size={18} strokeWidth={2.8} /> Search Buses
          </button>

          <datalist id="bus-cities">
            {cities.map((city) => <option key={city} value={city} />)}
          </datalist>
        </form>

        {error && (
          <p className="mx-6 mt-3 rounded-[11px] bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-700">{error}</p>
        )}

        <div className="mt-4 grid grid-cols-5 gap-4 rounded-[16px] bg-[var(--dh-surface)] px-7 py-4 ring-1 ring-[var(--dh-border)]">
          {TRUST.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="flex items-center gap-2.5">
              <Icon size={22} className="shrink-0 text-[#F5B700]" strokeWidth={2} />
              <span>
                <span className="block text-[12.5px] font-black text-[var(--dh-text)]">{title}</span>
                <span className="mt-0.5 block text-[11px] font-semibold text-[var(--dh-muted)]">{copy}</span>
              </span>
            </div>
          ))}
        </div>

        {/* ------------------------------------------------------ Popular routes */}
        <div className="mt-6">
          <h2 className="text-[20px] font-black tracking-[-0.03em] text-[var(--dh-text)]">Popular Routes</h2>
          <p className="mt-1 text-[13.5px] font-medium text-[var(--dh-muted)]">
            Tap a route to see buses for your travel date.
          </p>

          {routes.length === 0 ? (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-[86px] rounded-[14px]" />)}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {routes.slice(0, 12).map((route, index) => (
                <button
                  key={route.id || `${route.fromCity}-${route.toCity}-${index}`}
                  onClick={() => runSearch({ fromCity: route.fromCity, toCity: route.toCity })}
                  className="flex items-center justify-between gap-3 rounded-[14px] bg-[var(--dh-surface)] px-5 py-4 text-left ring-1 ring-[var(--dh-border)] transition-transform hover:-translate-y-0.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14.5px] font-black text-[var(--dh-text)]">{route.fromCity}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px] font-semibold text-[var(--dh-muted)]">
                      <ArrowRight size={13} strokeWidth={2.4} className="shrink-0" /> {route.toCity}
                    </span>
                    {route.startingPrice > 0 && (
                      <span className="mt-1 block text-[11.5px] font-bold text-[var(--dh-muted)]">
                        from {formatMoney(route.startingPrice)}
                      </span>
                    )}
                  </span>
                  <Bus size={22} className="shrink-0 text-[#F5B700]" strokeWidth={2} />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <AiChatBubble />
    </div>
  );
};

export default DesktopBus;
