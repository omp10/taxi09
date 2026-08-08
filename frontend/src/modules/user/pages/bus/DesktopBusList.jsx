import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpDown, CalendarDays, ChevronDown, Clock, Images, MapPin, Search, Sparkles, Star, Wifi, X,
} from 'lucide-react';
import userBusService from '../../services/busService';
import { AiChatBubble, DesktopNav } from '../../components/desktop/DesktopChrome';
import { useDesktopTheme } from '../../components/desktop/desktopShared';

/**
 * Desktop bus results for /taxi/user/bus/list.
 *
 * Reads { fromCity, toCity, date } from router state, the same contract the
 * mobile BusList uses, and every facet is derived from what the search returns.
 */

const SORTS = [
  { id: 'departure', label: 'Departure Time' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'rating', label: 'Rating' },
  { id: 'seats', label: 'Seats Available' },
];

// Departure windows, matched against the 24h schedule time.
const TIME_BANDS = [
  { label: 'Before 6 AM', min: 0, max: 6 },
  { label: '6 AM – 12 PM', min: 6, max: 12 },
  { label: '12 PM – 6 PM', min: 12, max: 18 },
  { label: 'After 6 PM', min: 18, max: 24 },
];

const AMENITY_ICONS = { WiFi: Wifi, 'Live Tracking': MapPin, 'GPS Tracking': MapPin };

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/** "21:00" -> "9:00 PM"; anything unparseable is passed through. */
const to12Hour = (value) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
  if (!match) return value || '';
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${display}:${match[2]} ${suffix}`;
};

const hourOf = (value) => {
  const match = /^(\d{1,2}):/.exec(String(value || '').trim());
  return match ? Number(match[1]) : -1;
};

const unwrapSearch = (response) => {
  const data = response?.data?.data ?? response?.data;
  return Array.isArray(data?.results) ? data.results : [];
};

/** Facet counts, most-populated first. Blank values are skipped. */
const countBy = (items, accessor) => {
  const counts = new Map();
  for (const item of items) {
    const key = accessor(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
};

const CheckList = ({ title, facets, selected, onToggle }) => {
  if (!facets.length) return null;
  return (
    <div className="border-t border-[var(--dh-border)] px-5 py-4">
      <p className="text-[13.5px] font-black text-[var(--dh-text)]">{title}</p>
      <div className="mt-3 space-y-2.5">
        {facets.map(([label, count]) => (
          <label key={label} className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={selected.includes(label)}
              onChange={() => onToggle(label)}
              className="h-4 w-4 shrink-0 accent-[#F5B700]"
            />
            <span className="flex-1 truncate text-[13px] font-semibold text-[var(--dh-text)]">{label}</span>
            <span className="text-[12px] font-bold text-[var(--dh-muted)]">{count}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

const DesktopBusList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, toggleTheme] = useDesktopTheme();

  const incoming = location.state || {};
  const [form, setForm] = useState({
    fromCity: incoming.fromCity || '',
    toCity: incoming.toCity || '',
    date: incoming.date || todayISO(),
  });

  const [buses, setBuses] = useState([]);
  // Loading and errors are derived from which query has resolved, so the fetch
  // effect never has to set state synchronously.
  const [resolved, setResolved] = useState(null);

  const [coachTypes, setCoachTypes] = useState([]);
  const [operators, setOperators] = useState([]);
  const [times, setTimes] = useState([]);
  const [maxPrice, setMaxPrice] = useState(null);
  const [sort, setSort] = useState('departure');

  const { fromCity, toCity, date } = form;
  const queryKey = `${fromCity}|${toCity}|${date}`;
  const loading = resolved?.key !== queryKey;
  const error = resolved?.key === queryKey ? resolved.error : '';

  useEffect(() => {
    if (!fromCity || !toCity) {
      navigate('/taxi/user/bus', { replace: true });
      return undefined;
    }

    let cancelled = false;
    userBusService
      .searchBuses({ fromCity, toCity, date })
      .then((response) => {
        if (cancelled) return;
        setBuses(unwrapSearch(response));
        setResolved({ key: queryKey, error: '' });
      })
      .catch((err) => {
        if (cancelled) return;
        setBuses([]);
        setResolved({ key: queryKey, error: err?.response?.data?.message || 'Could not search buses right now.' });
      });
    return () => { cancelled = true; };
  }, [fromCity, toCity, date, queryKey, navigate]);

  const coachFacets = useMemo(() => countBy(buses, (b) => b.coachType || b.type), [buses]);
  const operatorFacets = useMemo(() => countBy(buses, (b) => b.operatorName || b.operator), [buses]);
  const timeFacets = useMemo(
    () => TIME_BANDS
      .map((band) => [band.label, buses.filter((b) => {
        const hour = hourOf(b.departure);
        return hour >= band.min && hour < band.max;
      }).length])
      .filter(([, count]) => count > 0),
    [buses],
  );
  const priceCeiling = useMemo(
    () => buses.reduce((max, bus) => Math.max(max, Number(bus.price || 0)), 0),
    [buses],
  );

  const toggle = (setter, value) =>
    setter((current) => (current.includes(value) ? current.filter((i) => i !== value) : [...current, value]));

  const clearAll = () => { setCoachTypes([]); setOperators([]); setTimes([]); setMaxPrice(null); };
  const activeFilters = coachTypes.length + operators.length + times.length + (maxPrice ? 1 : 0);

  const results = useMemo(() => {
    let rows = buses.filter((bus) => {
      if (coachTypes.length && !coachTypes.includes(bus.coachType || bus.type)) return false;
      if (operators.length && !operators.includes(bus.operatorName || bus.operator)) return false;
      if (maxPrice && Number(bus.price || 0) > maxPrice) return false;
      if (times.length) {
        const hour = hourOf(bus.departure);
        const bands = TIME_BANDS.filter((b) => times.includes(b.label));
        if (!bands.some((b) => hour >= b.min && hour < b.max)) return false;
      }
      return true;
    });

    if (sort === 'price-asc') rows = [...rows].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sort === 'price-desc') rows = [...rows].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    if (sort === 'rating') rows = [...rows].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    if (sort === 'seats') rows = [...rows].sort((a, b) => Number(b.seats || 0) - Number(a.seats || 0));
    if (sort === 'departure') rows = [...rows].sort((a, b) => String(a.departure).localeCompare(String(b.departure)));

    return rows;
  }, [buses, coachTypes, operators, times, maxPrice, sort]);

  // BusSeats reads { bus, fromCity, toCity, date } off router state.
  const openSeats = (bus) => {
    navigate('/taxi/user/bus/seats', { state: { bus, fromCity, toCity, date } });
  };

  const field = 'w-full bg-transparent text-[14px] font-bold text-[var(--dh-text)] outline-none';

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath="/taxi/user/bus" theme={theme} onToggleTheme={toggleTheme} />

      <section className="mx-auto max-w-[1440px] px-8 pb-20 pt-5 xl:px-12">
        {/* ------------------------------------------------------ Search summary */}
        <form
          onSubmit={(event) => event.preventDefault()}
          className="grid grid-cols-[1.2fr_auto_1.2fr_1fr_auto] items-center rounded-[18px] bg-[var(--dh-surface)] px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-[var(--dh-border)]"
        >
          <label className="px-3">
            <span className="block text-[11.5px] font-black uppercase tracking-[0.07em] text-[var(--dh-muted)]">From</span>
            <span className="mt-1 flex items-center gap-2">
              <MapPin size={16} className="shrink-0 text-[#F5B700]" strokeWidth={2.4} />
              <input value={form.fromCity} onChange={(e) => setForm((c) => ({ ...c, fromCity: e.target.value }))} className={field} />
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

          <label className="border-l border-[var(--dh-border)] px-5">
            <span className="block text-[11.5px] font-black uppercase tracking-[0.07em] text-[var(--dh-muted)]">To</span>
            <span className="mt-1 flex items-center gap-2">
              <MapPin size={16} className="shrink-0 text-[#F5B700]" strokeWidth={2.4} />
              <input value={form.toCity} onChange={(e) => setForm((c) => ({ ...c, toCity: e.target.value }))} className={field} />
            </span>
          </label>

          <label className="border-l border-[var(--dh-border)] px-5">
            <span className="block text-[11.5px] font-black uppercase tracking-[0.07em] text-[var(--dh-muted)]">Travel Date</span>
            <span className="mt-1 flex items-center gap-2">
              <CalendarDays size={16} className="shrink-0 text-[#F5B700]" strokeWidth={2.4} />
              <input type="date" value={form.date} onChange={(e) => setForm((c) => ({ ...c, date: e.target.value }))} className={field} />
            </span>
          </label>

          <button
            type="button"
            onClick={() => navigate('/taxi/user/bus')}
            className="ml-3 flex h-[50px] items-center gap-2.5 rounded-[13px] bg-[#F5B700] px-7 text-[15px] font-bold text-slate-950 shadow-[0_10px_24px_rgba(245,183,0,0.3)]"
          >
            <Search size={17} strokeWidth={2.8} /> Modify Search
          </button>
        </form>

        {error && (
          <p className="mt-3 rounded-[11px] bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-700">{error}</p>
        )}

        <div className="mt-5 grid grid-cols-[224px_minmax(0,1fr)] gap-5">
          {/* --------------------------------------------------------- Filters */}
          <aside className="h-fit rounded-[18px] bg-[var(--dh-surface)] py-1 ring-1 ring-[var(--dh-border)]">
            <div className="flex items-center justify-between px-5 pb-3 pt-4">
              <p className="text-[14.5px] font-black text-[var(--dh-text)]">Filters</p>
              {activeFilters > 0 && (
                <button onClick={clearAll} className="text-[12px] font-bold text-[#F5B700]">Clear All</button>
              )}
            </div>

            {priceCeiling > 0 && (
              <div className="border-t border-[var(--dh-border)] px-5 py-4">
                <p className="text-[13.5px] font-black text-[var(--dh-text)]">Fare</p>
                <p className="mt-2 text-[12.5px] font-bold text-[var(--dh-muted)]">
                  Up to {formatMoney(maxPrice || priceCeiling)}
                </p>
                <input
                  type="range" min={0} max={priceCeiling} step={50}
                  value={maxPrice ?? priceCeiling}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="mt-2.5 w-full accent-[#F5B700]"
                  aria-label="Maximum fare"
                />
              </div>
            )}

            <CheckList title="Departure Time" facets={timeFacets} selected={times} onToggle={(v) => toggle(setTimes, v)} />
            <CheckList title="Bus Type" facets={coachFacets} selected={coachTypes} onToggle={(v) => toggle(setCoachTypes, v)} />
            <CheckList title="Operator" facets={operatorFacets} selected={operators} onToggle={(v) => toggle(setOperators, v)} />
          </aside>

          {/* --------------------------------------------------------- Results */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[19px] font-black tracking-[-0.02em] text-[var(--dh-text)]">
                  {loading ? 'Searching…' : `${results.length} Bus${results.length === 1 ? '' : 'es'} Found`}
                </h1>
                <p className="mt-0.5 text-[12.5px] font-semibold text-[var(--dh-muted)]">
                  {fromCity} → {toCity} · {date}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-[13px] font-semibold text-[var(--dh-muted)]">Sort by:</span>
                <span className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="h-[40px] appearance-none rounded-[10px] border border-[var(--dh-border)] bg-[var(--dh-surface)] pl-3.5 pr-9 text-[13.5px] font-bold text-[var(--dh-text)] outline-none"
                  >
                    {SORTS.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--dh-muted)]" strokeWidth={2.6} />
                </span>
              </div>
            </div>

            {loading ? (
              <div className="mt-4 space-y-3">
                {[0, 1, 2].map((i) => <div key={i} className="skeleton h-[150px] rounded-[16px]" />)}
              </div>
            ) : results.length === 0 ? (
              <div className="mt-4 rounded-[16px] bg-[var(--dh-surface)] p-14 text-center ring-1 ring-[var(--dh-border)]">
                <p className="text-[16px] font-black text-[var(--dh-text)]">No buses on this route</p>
                <p className="mt-2 text-[14px] font-medium text-[var(--dh-muted)]">
                  {activeFilters > 0 ? 'Try clearing a filter, or pick another date.' : 'Try another date or route.'}
                </p>
                {activeFilters > 0 && (
                  <button
                    onClick={clearAll}
                    className="mt-5 inline-flex items-center gap-2 rounded-[11px] border border-[var(--dh-border)] px-5 py-2.5 text-[13.5px] font-bold text-[var(--dh-text)]"
                  >
                    <X size={15} strokeWidth={2.8} /> Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {results.map((bus) => (
                  <article
                    key={bus.id}
                    className="grid min-h-[150px] grid-cols-[218px_minmax(0,1fr)_196px] overflow-hidden rounded-[16px] bg-[var(--dh-surface)] shadow-[0_8px_24px_rgba(15,23,42,0.07)] ring-1 ring-[var(--dh-border)]"
                  >
                    <div className="relative bg-[var(--dh-chip)]">
                      {/* Absolute so a tall source image fills the cell instead of
                          stretching the row. */}
                      <img
                        src={bus.image || bus.coverImage || bus.galleryImages?.[0] || '/bus.png'}
                        alt={bus.busName || bus.operatorName || 'Bus'}
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(event) => { event.currentTarget.src = '/bus.png'; }}
                      />
                      {bus.galleryImages?.length > 1 && (
                        <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-[7px] bg-black/60 px-2 py-1 text-[10.5px] font-bold text-white">
                          <Images size={11} strokeWidth={2.4} /> {bus.galleryImages.length}
                        </span>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-col justify-center px-6 py-4">
                      <span className="flex items-center gap-2.5">
                        <h2 className="truncate text-[17px] font-black tracking-[-0.02em] text-[var(--dh-text)]">
                          {bus.operatorName || bus.operator}
                        </h2>
                        {(bus.coachType || bus.type) && (
                          <span className="shrink-0 rounded-[6px] bg-[var(--dh-chip)] px-2 py-0.5 text-[10.5px] font-black uppercase tracking-[0.05em] text-[var(--dh-muted)]">
                            {bus.coachType || bus.type}
                          </span>
                        )}
                        {Number(bus.rating) > 0 && (
                          <span className="flex shrink-0 items-center gap-1 rounded-[6px] bg-emerald-600 px-1.5 py-0.5 text-[11px] font-black text-white">
                            <Star size={10} className="fill-white" /> {bus.rating}
                            {bus.ratingCount > 0 && <span className="font-semibold">({bus.ratingCount})</span>}
                          </span>
                        )}
                      </span>

                      {bus.busName && (
                        <p className="mt-0.5 truncate text-[12.5px] font-semibold text-[var(--dh-muted)]">{bus.busName}</p>
                      )}

                      <div className="mt-3 flex items-center gap-5">
                        <span className="text-[19px] font-black text-[var(--dh-text)]">{to12Hour(bus.departure)}</span>
                        <span className="flex flex-1 items-center gap-2 text-[11.5px] font-semibold text-[var(--dh-muted)]">
                          <span className="h-[2px] flex-1 rounded bg-[var(--dh-border)]" />
                          <Clock size={12} strokeWidth={2.3} /> {bus.duration || '—'}
                          <span className="h-[2px] flex-1 rounded bg-[var(--dh-border)]" />
                        </span>
                        <span className="text-[19px] font-black text-[var(--dh-text)]">{to12Hour(bus.arrival)}</span>
                      </div>

                      <p className="mt-1.5 truncate text-[12px] font-semibold text-[var(--dh-muted)]">
                        {bus.fromCity} → {bus.toCity}
                      </p>

                      {bus.amenities?.length > 0 && (
                        <div className="mt-2.5 flex items-center gap-x-4 overflow-hidden">
                          {bus.amenities.slice(0, 5).map((amenity) => {
                            const Icon = AMENITY_ICONS[amenity] || Sparkles;
                            return (
                              <span key={amenity} className="flex shrink-0 items-center gap-1.5 text-[11.5px] font-semibold text-[var(--dh-muted)]">
                                <Icon size={12} strokeWidth={2.2} /> {amenity}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end justify-center gap-1 border-l border-[var(--dh-border)] px-5 py-4">
                      <span className="text-[23px] font-black leading-none tracking-[-0.03em] text-[var(--dh-text)]">
                        {formatMoney(bus.price)}
                      </span>
                      <span className="text-[11.5px] font-semibold text-[var(--dh-muted)]">per seat</span>
                      <span className={`mt-1 text-[11.5px] font-black ${bus.seats > 5 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {bus.seats > 0 ? `${bus.seats} seats left` : 'Sold out'}
                      </span>
                      <button
                        onClick={() => openSeats(bus)}
                        disabled={!bus.seats}
                        className="mt-2 w-full rounded-[10px] bg-[#F5B700] py-2.5 text-[13.5px] font-bold text-slate-950 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Select Seats
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <AiChatBubble />
    </div>
  );
};

export default DesktopBusList;
