import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BannerHero from '../../components/BannerHero';
import {
  ArrowRight, ArrowUpDown, BadgeCheck, Calendar, Car, CheckCircle2, ChevronDown, Clock,
  CreditCard, Headphones, Languages, MapPin, Palette, ShieldCheck, Star, Ticket, Users,
} from 'lucide-react';
import api from '../../../../shared/api/axiosInstance';
import { DesktopNav } from '../../components/desktop/DesktopChrome';
import { unwrapResults, useDesktopTheme } from '../../components/desktop/desktopShared';

/**
 * Desktop "With Driver" search + driver list.
 *
 * Drivers come from the admin-managed hire catalogue and the fare breakdown
 * from the server quote endpoint. Anything the catalogue does not carry (a
 * car's colour, its class) simply does not render.
 */

const HERO_BADGES = [
  { icon: ShieldCheck, title: 'Verified Drivers', copy: 'Background Checked' },
  { icon: MapPin, title: 'Live Tracking', copy: 'Share Your Trip' },
  { icon: Headphones, title: '24/7 Support', copy: "We're Here" },
  { icon: BadgeCheck, title: 'Safe & Secure', copy: 'Your Safety First' },
];

const PROMISES = [
  { icon: BadgeCheck, label: 'Best Price Guarantee' },
  { icon: CheckCircle2, label: 'No Hidden Charges' },
  { icon: Clock, label: 'On Time Pickup' },
  { icon: CreditCard, label: 'Multiple Payment Options' },
];

const FOOTER_NOTES = [
  { icon: Ticket, title: 'Free Cancellation', copy: 'Cancel till 30 mins before pickup' },
  { icon: MapPin, title: 'Live Tracking', copy: 'Share your ride with friends & family' },
  { icon: ShieldCheck, title: 'Verified Drivers', copy: 'All drivers are background verified' },
  { icon: Headphones, title: '24/7 Customer Support', copy: "We're always here to help" },
];

const SORTS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'rating', label: 'Highest Rated' },
  { id: 'experience', label: 'Most Experienced' },
  { id: 'nearest', label: 'Nearest First' },
];

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

/** Trip counts are stored as free text ("3200+"), so sort on the digits. */
const tripCount = (driver) => Number(String(driver.trips || '').replace(/\D/g, '') || 0);
const experienceYears = (driver) => Number(String(driver.experience || '').replace(/\D/g, '') || 0);

const DesktopWithDriver = () => {
  const navigate = useNavigate();
  const [theme, toggleTheme] = useDesktopTheme();

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [sort, setSort] = useState('recommended');

  const [trip, setTrip] = useState({ pickup: '', drop: '', date: '', time: '' });

  useEffect(() => {
    let cancelled = false;
    api
      .get('/users/hire-drivers', { params: { hireType: 'outstation' } })
      .then((response) => {
        if (cancelled) return;
        const results = unwrapResults(response);
        // Fall back to the full catalogue if none are tagged for this hire type.
        if (results.length) return setDrivers(results);
        return api.get('/users/hire-drivers').then((all) => {
          if (!cancelled) setDrivers(unwrapResults(all));
        });
      })
      .catch(() => { if (!cancelled) setDrivers([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Fare is quoted by the server; distance comes from the chosen driver's
  // catalogue entry until a real route lookup is wired to the search box.
  const distanceKm = useMemo(
    () => Math.max(...drivers.map((d) => Number(d.distanceKm || 0)), 0),
    [drivers],
  );

  useEffect(() => {
    let cancelled = false;
    api
      .post('/users/hire-driver/quote', { distanceKm, durationMinutes: Math.round(distanceKm * 1.6) })
      .then((response) => {
        if (cancelled) return;
        setQuote(response?.data?.data ?? response?.data ?? null);
        setQuoteError('');
      })
      .catch((error) => {
        if (cancelled) return;
        setQuote(null);
        setQuoteError(error?.response?.data?.message || 'Fares are unavailable right now');
      });
    return () => { cancelled = true; };
  }, [distanceKm]);

  const sorted = useMemo(() => {
    const list = [...drivers];
    if (sort === 'rating') list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    if (sort === 'experience') list.sort((a, b) => experienceYears(b) - experienceYears(a));
    if (sort === 'nearest') list.sort((a, b) => Number(a.distanceKm || 0) - Number(b.distanceKm || 0));
    if (sort === 'recommended') list.sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0) || tripCount(b) - tripCount(a));
    return list;
  }, [drivers, sort]);

  const bookDriver = (driver) => {
    const payload = { driver, trip, quote };
    try {
      window.sessionStorage.setItem('taxi:hire-driver-pending', JSON.stringify(payload));
    } catch {
      // Continue with router state if storage is unavailable.
    }
    navigate('/taxi/user/with-driver/review', { state: payload });
  };

  const field = 'w-full bg-transparent text-[13.5px] font-semibold text-[var(--dh-text)] placeholder:text-[var(--dh-muted)] outline-none';
  const fieldBox = 'mt-1.5 flex h-[46px] items-center gap-2 rounded-[11px] border border-[var(--dh-border)] px-3';

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath="/taxi/user/with-driver" theme={theme} onToggleTheme={toggleTheme} />

      <section className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)_368px] gap-6 px-8 pb-20 pt-5 xl:px-12">
        <div className="rounded-[20px] bg-[var(--dh-surface)] ring-1 ring-[var(--dh-border)]">
          {/* Hero is admin artwork - Homepage Banners > With Driver. */}
          <div className="p-4 pb-0">
            <BannerHero type="with_driver" rounded="rounded-[16px]" />
          </div>

          {/* ----------------------------------------------------------- Search */}
          <div className="mx-6 -mt-1 rounded-[16px] border border-[var(--dh-border)] bg-[var(--dh-surface)] p-4">
            <div className="grid grid-cols-[1.2fr_auto_1.2fr_1fr_1fr_auto] items-end gap-3">
              <label>
                <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--dh-text)]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Pickup Location
                </span>
                <span className={fieldBox}>
                  <MapPin size={16} className="shrink-0 text-[var(--dh-muted)]" strokeWidth={2.3} />
                  <input
                    value={trip.pickup}
                    onChange={(e) => setTrip((c) => ({ ...c, pickup: e.target.value }))}
                    placeholder="Enter city or location"
                    className={field}
                  />
                </span>
              </label>

              <button
                type="button"
                onClick={() => setTrip((c) => ({ ...c, pickup: c.drop, drop: c.pickup }))}
                className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--dh-border)] text-[var(--dh-muted)] hover:bg-[var(--dh-chip)]"
                aria-label="Swap pickup and drop"
              >
                <ArrowUpDown size={16} className="rotate-90" strokeWidth={2.4} />
              </button>

              <label>
                <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--dh-text)]">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Drop Location
                </span>
                <span className={fieldBox}>
                  <MapPin size={16} className="shrink-0 text-[var(--dh-muted)]" strokeWidth={2.3} />
                  <input
                    value={trip.drop}
                    onChange={(e) => setTrip((c) => ({ ...c, drop: e.target.value }))}
                    placeholder="Enter city or location"
                    className={field}
                  />
                </span>
              </label>

              <label>
                <span className="text-[12.5px] font-bold text-[var(--dh-text)]">Date</span>
                <span className={fieldBox}>
                  <Calendar size={16} className="shrink-0 text-[var(--dh-muted)]" strokeWidth={2.3} />
                  <input type="date" value={trip.date} onChange={(e) => setTrip((c) => ({ ...c, date: e.target.value }))} className={field} />
                </span>
              </label>

              <label>
                <span className="text-[12.5px] font-bold text-[var(--dh-text)]">Time</span>
                <span className={fieldBox}>
                  <Clock size={16} className="shrink-0 text-[var(--dh-muted)]" strokeWidth={2.3} />
                  <input type="time" value={trip.time} onChange={(e) => setTrip((c) => ({ ...c, time: e.target.value }))} className={field} />
                </span>
              </label>

              <button
                type="button"
                onClick={() => document.getElementById('available-drivers')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex h-[46px] items-center gap-2.5 rounded-[12px] bg-[#F5B700] px-6 text-[15px] font-bold text-slate-950"
              >
                Search Drivers <ArrowRight size={17} strokeWidth={2.8} />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-3 rounded-[12px] bg-[#FFFBEC] py-2.5">
              {PROMISES.map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center justify-center gap-2 text-[12.5px] font-bold text-slate-800">
                  <Icon size={15} className="shrink-0 text-[#F5B700]" strokeWidth={2.4} /> {label}
                </span>
              ))}
            </div>
          </div>

          {/* ---------------------------------------------------------- Drivers */}
          <div id="available-drivers" className="px-6 pb-6 pt-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-[20px] font-black tracking-[-0.03em] text-[var(--dh-text)]">Available Drivers</h2>
                <p className="mt-0.5 text-[12.5px] font-semibold text-[var(--dh-muted)]">
                  {loading ? 'Loading drivers…' : `${sorted.length} ${sorted.length === 1 ? 'driver' : 'drivers'} available for your trip`}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-[13px] font-semibold text-[var(--dh-muted)]">Sort By:</span>
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
                {[0, 1, 2].map((i) => <div key={i} className="skeleton h-[132px] rounded-[16px]" />)}
              </div>
            ) : sorted.length === 0 ? (
              <p className="mt-4 rounded-[16px] bg-[var(--dh-chip)] px-6 py-12 text-center text-[13.5px] font-semibold text-[var(--dh-muted)]">
                No drivers are listed for hire yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {sorted.map((driver) => (
                  <article
                    key={driver.id || driver._id}
                    className="grid min-h-[132px] grid-cols-[240px_minmax(0,1fr)_190px_180px] items-center gap-4 rounded-[16px] border border-[var(--dh-border)] p-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="relative h-[74px] w-[74px] shrink-0 overflow-hidden rounded-full bg-[var(--dh-chip)]">
                        {driver.photo ? (
                          <img src={driver.photo} alt={driver.name} className="absolute inset-0 h-full w-full object-cover" />
                        ) : (
                          <Users size={26} className="absolute inset-0 m-auto text-[var(--dh-muted)]" strokeWidth={1.8} />
                        )}
                        {driver.available && (
                          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-1.5 text-[8.5px] font-black text-white">
                            Online
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[16px] font-black text-[var(--dh-text)]">{driver.name}</span>
                        {Number(driver.rating) > 0 && (
                          <span className="mt-1 flex items-center gap-1.5">
                            <Star size={14} className="fill-[#F5B700] text-[#F5B700]" />
                            <span className="text-[13px] font-black text-[var(--dh-text)]">{driver.rating}</span>
                            {driver.trips && <span className="text-[12px] font-semibold text-[var(--dh-muted)]">({driver.trips} trips)</span>}
                          </span>
                        )}
                        {driver.experience && (
                          <span className="mt-0.5 block text-[12px] font-semibold text-[var(--dh-muted)]">{driver.experience} Experience</span>
                        )}
                        {driver.languages?.length > 0 && (
                          <span className="mt-0.5 flex items-center gap-1 text-[11.5px] font-semibold text-[var(--dh-muted)]">
                            <Languages size={12} strokeWidth={2.2} /> {driver.languages.join(', ')}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex min-w-0 items-center gap-4 border-l border-[var(--dh-border)] pl-4">
                      {driver.vehicleImage && (
                        <span className="relative h-[62px] w-[96px] shrink-0">
                          <img src={driver.vehicleImage} alt="" className="absolute inset-0 h-full w-full object-contain" />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[15px] font-black text-[var(--dh-text)]">{driver.vehicleName || 'Vehicle on assignment'}</span>
                          {driver.vehicleClass && (
                            <span className="shrink-0 rounded-[7px] bg-[var(--dh-chip)] px-2 py-0.5 text-[11px] font-bold text-[var(--dh-muted)]">
                              {driver.vehicleClass}
                            </span>
                          )}
                        </span>
                        {driver.vehiclePlate && (
                          <span className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--dh-muted)]">
                            <Car size={13} strokeWidth={2.2} /> {driver.vehiclePlate}
                          </span>
                        )}
                        {driver.vehicleColor && (
                          <span className="mt-1 flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--dh-muted)]">
                            <Palette size={13} strokeWidth={2.2} /> {driver.vehicleColor}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="space-y-2 border-l border-[var(--dh-border)] pl-4">
                      {driver.verified && (
                        <span className="flex items-center gap-2 text-[12.5px] font-bold text-emerald-700">
                          <ShieldCheck size={16} strokeWidth={2.3} /> Verified Driver
                        </span>
                      )}
                      {driver.badge && (
                        <span className="flex items-center gap-2 text-[12.5px] font-bold text-[var(--dh-muted)]">
                          <BadgeCheck size={16} strokeWidth={2.3} /> {driver.badge}
                        </span>
                      )}
                      {Number(driver.etaMinutes) > 0 && (
                        <span className="flex items-center gap-2 text-[12.5px] font-semibold text-[var(--dh-muted)]">
                          <Clock size={15} strokeWidth={2.3} /> {driver.etaMinutes} min away
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 border-l border-[var(--dh-border)] pl-4">
                      {quote ? (
                        <>
                          <span className="text-[21px] font-black leading-none text-[var(--dh-text)]">{formatMoney(quote.totalFare)}</span>
                          <span className="text-[11px] font-semibold text-[var(--dh-muted)]">Total Fare</span>
                        </>
                      ) : (
                        <span className="text-[12.5px] font-bold text-[var(--dh-muted)]">Fare on request</span>
                      )}
                      <button
                        onClick={() => bookDriver(driver)}
                        className="w-full rounded-[10px] border-2 border-[#F5B700] py-2 text-[13.5px] font-bold text-[var(--dh-text)] transition-colors hover:bg-[#F5B700] hover:text-slate-950"
                      >
                        Book Now
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4 border-t border-[var(--dh-border)] px-6 py-5">
            {FOOTER_NOTES.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="flex items-center gap-3">
                <Icon size={22} className="shrink-0 text-[#F5B700]" strokeWidth={2} />
                <span>
                  <span className="block text-[12.5px] font-black text-[var(--dh-text)]">{title}</span>
                  <span className="mt-0.5 block text-[11px] font-semibold text-[var(--dh-muted)]">{copy}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------- Trip summary */}
        <aside className="sticky top-[100px] h-fit rounded-[20px] bg-[var(--dh-surface)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-[var(--dh-border)]">
          <h2 className="text-[17px] font-black tracking-[-0.02em] text-[var(--dh-text)]">Your Trip Summary</h2>

          <dl className="mt-4 space-y-3.5">
            {[
              ['Pickup Location', trip.pickup, 'bg-emerald-500'],
              ['Drop Location', trip.drop, 'bg-rose-500'],
            ].filter(([, v]) => v).map(([label, value, dot]) => (
              <div key={label} className="flex gap-2.5">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                <span className="min-w-0">
                  <dt className="text-[12.5px] font-bold text-[var(--dh-text)]">{label}</dt>
                  <dd className="mt-0.5 text-[12.5px] font-semibold text-[var(--dh-muted)]">{value}</dd>
                </span>
              </div>
            ))}
            {[
              [Calendar, trip.date],
              [Clock, trip.time],
              [Car, quote ? `${quote.vehicleClassName}${quote.seats ? ` · ${quote.seats} Seats` : ''}` : ''],
            ].filter(([, v]) => v).map(([Icon, value]) => (
              <div key={value} className="flex items-center gap-2.5">
                <Icon size={16} className="shrink-0 text-[var(--dh-muted)]" strokeWidth={2.2} />
                <span className="text-[12.5px] font-semibold text-[var(--dh-text)]">{value}</span>
              </div>
            ))}
            {!trip.pickup && !trip.drop && (
              <p className="rounded-[10px] bg-[var(--dh-chip)] px-3 py-3 text-[12px] font-semibold text-[var(--dh-muted)]">
                Enter your pickup and drop to see the trip summary.
              </p>
            )}
          </dl>

          {/* Fare panel - computed by the server */}
          <div className="mt-5 border-t border-[var(--dh-border)] pt-4">
            <h3 className="text-[15px] font-black text-[var(--dh-text)]">Fare Details</h3>

            {quote ? (
              <div className="mt-3 space-y-2.5">
                <div className="flex justify-between text-[13px] font-semibold text-[var(--dh-muted)]">
                  <span>Base Fare</span><span className="text-[var(--dh-text)]">{formatMoney(quote.baseFare)}</span>
                </div>
                {quote.distanceFare > 0 && (
                  <div className="flex justify-between text-[13px] font-semibold text-[var(--dh-muted)]">
                    <span>Distance Fare ({quote.chargeableKm} km)</span>
                    <span className="text-[var(--dh-text)]">{formatMoney(quote.distanceFare)}</span>
                  </div>
                )}
                {quote.timeFare > 0 && (
                  <div className="flex justify-between text-[13px] font-semibold text-[var(--dh-muted)]">
                    <span>Time Fare ({quote.durationMinutes} mins)</span>
                    <span className="text-[var(--dh-text)]">{formatMoney(quote.timeFare)}</span>
                  </div>
                )}
                {quote.taxes > 0 && (
                  <div className="flex justify-between text-[13px] font-semibold text-[var(--dh-muted)]">
                    <span>Taxes &amp; Fees ({quote.taxPercent}%)</span>
                    <span className="text-[var(--dh-text)]">{formatMoney(quote.taxes)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-[var(--dh-border)] pt-3">
                  <span className="text-[15px] font-black text-[var(--dh-text)]">Total Amount</span>
                  <span className="text-[20px] font-black text-[var(--dh-text)]">{formatMoney(quote.totalFare)}</span>
                </div>
              </div>
            ) : quoteError ? (
              <p className="mt-3 rounded-[10px] bg-rose-50 px-3 py-2.5 text-[12.5px] font-bold text-rose-700">{quoteError}</p>
            ) : (
              <div className="mt-3 space-y-2">
                <div className="skeleton h-4 rounded" />
                <div className="skeleton h-4 w-2/3 rounded" />
              </div>
            )}
          </div>

          <button
            onClick={() => sorted[0] && bookDriver(sorted[0])}
            disabled={!sorted.length || !quote}
            className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-[13px] bg-[#F5B700] py-3.5 text-[15.5px] font-bold text-slate-950 shadow-[0_10px_24px_rgba(245,183,0,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Proceed to Book <ArrowRight size={18} strokeWidth={2.8} />
          </button>
        </aside>
      </section>
    </div>
  );
};

export default DesktopWithDriver;
