import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck, CalendarDays, ChevronDown, CreditCard, Gift, Headphones, Heart, Lock,
  RefreshCcw, Sparkles, Star, Users, UtensilsCrossed,
} from 'lucide-react';
import { rememberPackage } from '../../utils/packageHandoff';
import api from '../../../../shared/api/axiosInstance';
import { DesktopNav } from '../../components/desktop/DesktopChrome';
import { unwrapResults, useDesktopTheme } from '../../components/desktop/desktopShared';

/**
 * Desktop international packages for /taxi/user/international.
 *
 * Destination and duration filters are built from the live catalogue; budget
 * bands only render when some package actually falls inside them.
 */

const SORTS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'rating', label: 'Traveller Rating' },
  { id: 'duration', label: 'Duration' },
];

const BUDGET_BANDS = [
  { id: 'under-50', label: 'Under ₹50,000', min: 0, max: 50000 },
  { id: '50-100', label: '₹50,000 – ₹1,00,000', min: 50000, max: 100000 },
  { id: '100-150', label: '₹1,00,000 – ₹1,50,000', min: 100000, max: 150000 },
  { id: 'above-150', label: 'Above ₹1,50,000', min: 150000, max: Infinity },
];

const DURATION_BANDS = [
  { id: '1-4', label: '1 – 4 Days', min: 1, max: 4 },
  { id: '5-7', label: '5 – 7 Days', min: 5, max: 7 },
  { id: '8-10', label: '8 – 10 Days', min: 8, max: 10 },
  { id: '11-14', label: '11 – 14 Days', min: 11, max: 14 },
  { id: '15+', label: '15+ Days', min: 15, max: Infinity },
];

const TRUST = [
  { icon: BadgeCheck, title: 'Best Price Guarantee', copy: 'Get the best deals always' },
  { icon: Headphones, title: '24/7 Support', copy: "We're here to help" },
  { icon: Lock, title: 'Secure Booking', copy: 'Your data is 100% safe' },
  { icon: RefreshCcw, title: 'Flexible Cancellation', copy: 'Easy cancellations*' },
];

const WHY_BOOK = [
  { icon: Sparkles, title: 'Handpicked Experiences', copy: 'Curated tours by travel experts' },
  { icon: BadgeCheck, title: 'Best Price Guarantee', copy: 'Get the best deals, always' },
  { icon: CalendarDays, title: 'Flexible & Easy Booking', copy: 'Book now, pay later options' },
  { icon: Headphones, title: '24/7 Travel Assistance', copy: "We're with you, always" },
];

const BOTTOM = [
  { icon: Users, title: 'Happy Travellers', copy: 'Trusted by thousands' },
  { icon: Headphones, title: '24/7 Customer Support', copy: "We're here to help always" },
  { icon: Lock, title: 'Secure Payments', copy: '100% secure transactions' },
  { icon: CreditCard, title: 'Easy EMI Options', copy: 'Flexible payment options' },
  { icon: Star, title: 'Rated by travellers', copy: 'By our happy customers' },
];

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const titleOf = (pkg) => pkg.title || pkg.name || 'Package';

const durationLabel = (pkg) => {
  if (pkg.durationLabel) return pkg.durationLabel;
  const days = Number(pkg.durationDays || 0);
  return days > 0 ? `${days} Days / ${Math.max(0, days - 1)} Nights` : '';
};

const CheckList = ({ title, facets, selected, onToggle }) => {
  if (!facets.length) return null;
  return (
    <div className="border-t border-[var(--dh-border)] px-5 py-4">
      <p className="text-[15px] font-black text-[var(--dh-text)]">{title}</p>
      <div className="mt-3 space-y-2.5">
        {facets.map(([label, count]) => (
          <label key={label} className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={selected.includes(label)}
              onChange={() => onToggle(label)}
              className="h-4 w-4 shrink-0 accent-[#F5B700]"
            />
            <span className="flex-1 truncate text-[14.5px] font-semibold text-[var(--dh-text)]">{label}</span>
            <span className="text-[13.5px] font-bold text-[var(--dh-muted)]">{count}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

const DesktopInternational = () => {
  const navigate = useNavigate();
  const [theme, toggleTheme] = useDesktopTheme();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState([]);
  const [visible, setVisible] = useState(6);

  const [budgets, setBudgets] = useState([]);
  const [durations, setDurations] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [maxPrice, setMaxPrice] = useState(null);
  const [sort, setSort] = useState('recommended');
  const [showAllDestinations, setShowAllDestinations] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/users/travel-packages', { params: { scope: 'international' } })
      .then((response) => { if (!cancelled) setPackages(unwrapResults(response)); })
      .catch(() => { if (!cancelled) setPackages([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const priceCeiling = useMemo(
    () => packages.reduce((max, pkg) => Math.max(max, Number(pkg.price || 0)), 0),
    [packages],
  );

  // A destination is the package's country, falling back to its title.
  const destinationFacets = useMemo(() => {
    const counts = new Map();
    for (const pkg of packages) {
      const key = pkg.country || pkg.category || '';
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [packages]);

  const budgetFacets = useMemo(
    () => BUDGET_BANDS
      .map((band) => [band.label, packages.filter((p) => Number(p.price || 0) >= band.min && Number(p.price || 0) < band.max).length])
      .filter(([, count]) => count > 0),
    [packages],
  );

  const durationFacets = useMemo(
    () => DURATION_BANDS
      .map((band) => [band.label, packages.filter((p) => Number(p.durationDays || 0) >= band.min && Number(p.durationDays || 0) <= band.max).length])
      .filter(([, count]) => count > 0),
    [packages],
  );

  const toggle = (setter, value) =>
    setter((current) => (current.includes(value) ? current.filter((i) => i !== value) : [...current, value]));

  const clearAll = () => {
    setBudgets([]); setDurations([]); setDestinations([]); setMaxPrice(null);
  };

  const activeFilters = budgets.length + durations.length + destinations.length + (maxPrice ? 1 : 0);

  const results = useMemo(() => {
    let list = packages.filter((pkg) => {
      const price = Number(pkg.price || 0);
      const days = Number(pkg.durationDays || 0);

      if (maxPrice && price > maxPrice) return false;
      if (destinations.length && !destinations.includes(pkg.country || pkg.category)) return false;

      if (budgets.length) {
        const bands = BUDGET_BANDS.filter((b) => budgets.includes(b.label));
        if (!bands.some((b) => price >= b.min && price < b.max)) return false;
      }
      if (durations.length) {
        const bands = DURATION_BANDS.filter((b) => durations.includes(b.label));
        if (!bands.some((b) => days >= b.min && days <= b.max)) return false;
      }
      return true;
    });

    if (sort === 'price-asc') list = [...list].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sort === 'price-desc') list = [...list].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    if (sort === 'rating') list = [...list].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    if (sort === 'duration') list = [...list].sort((a, b) => Number(a.durationDays || 0) - Number(b.durationDays || 0));
    if (sort === 'recommended') list = [...list].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    return list;
  }, [packages, budgets, durations, destinations, maxPrice, sort]);

  const openPackage = (pkg) => {
    rememberPackage('international', pkg);
    // InternationalDetails reads `trip` off router state.
    navigate(`/taxi/user/international/details/${pkg.slug}`, { state: { trip: pkg } });
  };

  // Destination tiles reuse each package's own artwork.
  const topDestinations = useMemo(() => {
    const seen = new Map();
    for (const pkg of packages) {
      const key = pkg.country || pkg.category;
      if (key && !seen.has(key)) seen.set(key, pkg.image || pkg.gallery?.[0] || '');
    }
    return [...seen.entries()];
  }, [packages]);

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath="/taxi/user/tours" theme={theme} onToggleTheme={toggleTheme} />

      <section className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)_324px] gap-6 px-8 pb-20 pt-5 xl:px-12">
        <div>
          {/* ------------------------------------------------------------- Hero */}
          <div className="relative overflow-hidden rounded-[20px] bg-[linear-gradient(100deg,#EAF6FF_0%,#F5FBFF_45%,#FFF6DE_100%)] px-9 py-10">
            <div className="relative z-10 max-w-[460px]">
              <h1 className="text-[38px] font-black leading-[1.1] tracking-[-0.035em] text-slate-950">
                International Packages
              </h1>
              <p className="mt-3 text-[16px] font-medium leading-[1.55] text-slate-700">
                Explore the world with our best-selling international tour packages.
                <br />
                Handpicked destinations, unforgettable experiences.
              </p>
            </div>
            <img
              src="/taxi09_tours_hero_beach.png"
              alt=""
              className="pointer-events-none absolute -right-4 top-0 h-full w-[52%] object-cover opacity-95"
            />
          </div>

          <div className="mt-3 grid grid-cols-4 gap-4 rounded-[16px] bg-[var(--dh-surface)] px-7 py-4 ring-1 ring-[var(--dh-border)]">
            {TRUST.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="flex items-center gap-2.5">
                <Icon size={22} className="shrink-0 text-[#F5B700]" strokeWidth={2} />
                <span>
                  <span className="block text-[14px] font-black text-[var(--dh-text)]">{title}</span>
                  <span className="mt-0.5 block text-[13px] font-semibold text-[var(--dh-muted)]">{copy}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-[224px_minmax(0,1fr)] gap-5">
            {/* --------------------------------------------------------- Filters */}
            <aside className="h-fit rounded-[18px] bg-[var(--dh-surface)] py-1 ring-1 ring-[var(--dh-border)]">
              <div className="flex items-center justify-between px-5 pb-3 pt-4">
                <p className="text-[16px] font-black text-[var(--dh-text)]">Filter Packages</p>
                {activeFilters > 0 && (
                  <button onClick={clearAll} className="text-[13.5px] font-bold text-[#F5B700]">Clear All</button>
                )}
              </div>

              <CheckList title="Budget (Per Person)" facets={budgetFacets} selected={budgets} onToggle={(v) => toggle(setBudgets, v)} />

              {priceCeiling > 0 && (
                <div className="border-t border-[var(--dh-border)] px-5 py-4">
                  <p className="text-[14px] font-bold text-[var(--dh-muted)]">
                    Up to {formatMoney(maxPrice || priceCeiling)}
                  </p>
                  <input
                    type="range" min={0} max={priceCeiling} step={1000}
                    value={maxPrice ?? priceCeiling}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="mt-2.5 w-full accent-[#F5B700]"
                    aria-label="Maximum price per person"
                  />
                </div>
              )}

              <CheckList title="Trip Duration" facets={durationFacets} selected={durations} onToggle={(v) => toggle(setDurations, v)} />

              {destinationFacets.length > 0 && (
                <div className="border-t border-[var(--dh-border)] px-5 py-4">
                  <p className="text-[15px] font-black text-[var(--dh-text)]">Destinations</p>
                  <div className="mt-3 space-y-2.5">
                    {(showAllDestinations ? destinationFacets : destinationFacets.slice(0, 6)).map(([label, count]) => (
                      <label key={label} className="flex cursor-pointer items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={destinations.includes(label)}
                          onChange={() => toggle(setDestinations, label)}
                          className="h-4 w-4 shrink-0 accent-[#F5B700]"
                        />
                        <span className="flex-1 truncate text-[14.5px] font-semibold text-[var(--dh-text)]">{label}</span>
                        <span className="text-[13.5px] font-bold text-[var(--dh-muted)]">{count}</span>
                      </label>
                    ))}
                  </div>
                  {destinationFacets.length > 6 && (
                    <button
                      onClick={() => setShowAllDestinations((v) => !v)}
                      className="mt-3 flex items-center gap-1.5 text-[14px] font-bold text-[#F5B700]"
                    >
                      {showAllDestinations ? 'View Less' : 'View More'}
                      <ChevronDown size={14} className={showAllDestinations ? 'rotate-180' : ''} strokeWidth={2.6} />
                    </button>
                  )}
                </div>
              )}
            </aside>

            {/* --------------------------------------------------------- Results */}
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[18px] font-black tracking-[-0.02em] text-[var(--dh-text)]">
                  {loading ? 'Loading packages…' : `${results.length} International Package${results.length === 1 ? '' : 's'} Found`}
                </p>

                <div className="flex items-center gap-2.5">
                  <span className="text-[14.5px] font-semibold text-[var(--dh-muted)]">Sort by:</span>
                  <span className="relative">
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="h-[40px] appearance-none rounded-[10px] border border-[var(--dh-border)] bg-[var(--dh-surface)] pl-3.5 pr-9 text-[15px] font-bold text-[var(--dh-text)] outline-none"
                    >
                      {SORTS.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
                    </select>
                    <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--dh-muted)]" strokeWidth={2.6} />
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="mt-4 space-y-3">
                  {[0, 1, 2].map((i) => <div key={i} className="skeleton h-[168px] rounded-[16px]" />)}
                </div>
              ) : results.length === 0 ? (
                <div className="mt-4 rounded-[16px] bg-[var(--dh-surface)] p-14 text-center ring-1 ring-[var(--dh-border)]">
                  <p className="text-[17px] font-black text-[var(--dh-text)]">No packages match these filters</p>
                  <p className="mt-2 text-[15.5px] font-medium text-[var(--dh-muted)]">Try clearing a filter or widening the budget.</p>
                </div>
              ) : (
                <>
                  <div className="mt-4 space-y-3">
                    {results.slice(0, visible).map((pkg) => {
                      const id = pkg._id || pkg.slug;
                      const isSaved = saved.includes(id);

                      return (
                        <article
                          key={id}
                          className="grid min-h-[168px] grid-cols-[262px_minmax(0,1fr)_192px] overflow-hidden rounded-[16px] bg-[var(--dh-surface)] shadow-[0_8px_24px_rgba(15,23,42,0.07)] ring-1 ring-[var(--dh-border)]"
                        >
                          <div className="relative bg-[var(--dh-chip)]">
                            <img
                              src={pkg.image || pkg.gallery?.[0] || '/taxi09_tours_hero_beach.png'}
                              alt={titleOf(pkg)}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                            {pkg.badge && (
                              <span className="absolute left-3 top-3 rounded-[8px] bg-[#F5B700] px-2.5 py-1 text-[12.5px] font-black text-slate-950">
                                {pkg.badge}
                              </span>
                            )}
                            <button
                              onClick={() => toggle(setSaved, id)}
                              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm"
                              aria-label={isSaved ? 'Remove from saved' : 'Save package'}
                              aria-pressed={isSaved}
                            >
                              <Heart size={15} className={isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-500'} strokeWidth={2.4} />
                            </button>
                          </div>

                          <div className="flex min-w-0 flex-col justify-center px-5 py-4">
                            <h2 className="truncate text-[20px] font-black tracking-[-0.02em] text-[var(--dh-text)]">{titleOf(pkg)}</h2>

                            {pkg.stops?.length > 0 && (
                              <p className="mt-1 truncate text-[14px] font-semibold text-[var(--dh-muted)]">
                                {pkg.stops.join(' • ')}
                              </p>
                            )}

                            <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                              {durationLabel(pkg) && (
                                <span className="flex items-center gap-1.5 text-[14px] font-semibold text-[var(--dh-text)]">
                                  <CalendarDays size={13} className="text-[var(--dh-muted)]" strokeWidth={2.2} /> {durationLabel(pkg)}
                                </span>
                              )}
                              {(pkg.includes || []).slice(0, 2).map((item) => (
                                <span key={item} className="flex items-center gap-1.5 text-[14px] font-semibold text-[var(--dh-text)]">
                                  <UtensilsCrossed size={13} className="text-[var(--dh-muted)]" strokeWidth={2.2} /> {item}
                                </span>
                              ))}
                            </div>

                            {Number(pkg.rating) > 0 && (
                              <p className="mt-2.5 flex items-center gap-2">
                                <span className="flex items-center gap-1 rounded-[6px] bg-emerald-600 px-1.5 py-0.5 text-[13.5px] font-black text-white">
                                  <Star size={11} className="fill-white" /> {pkg.rating}
                                </span>
                                {pkg.reviews && (
                                  <span className="text-[13.5px] font-semibold text-[var(--dh-muted)]">({pkg.reviews} reviews)</span>
                                )}
                              </p>
                            )}

                            {pkg.perks?.length > 0 && (
                              <p className="mt-2 w-fit truncate rounded-[7px] bg-emerald-50 px-2.5 py-1 text-[13.5px] font-bold text-emerald-700">
                                {pkg.perks.slice(0, 2).join(' + ')}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end justify-center gap-1 border-l border-[var(--dh-border)] px-5 py-4">
                            {Number(pkg.oldPrice) > Number(pkg.price) && (
                              <span className="text-[14px] font-bold text-[var(--dh-muted)] line-through">{formatMoney(pkg.oldPrice)}</span>
                            )}
                            <span className="text-[23px] font-black leading-none tracking-[-0.03em] text-[var(--dh-text)]">
                              {formatMoney(pkg.price)}
                            </span>
                            <span className="text-[13.5px] font-semibold text-[var(--dh-muted)]">Per Person</span>
                            <span className="text-[13px] font-medium text-[var(--dh-muted)]">On Twin Sharing</span>
                            <button
                              onClick={() => openPackage(pkg)}
                              className="mt-2 w-full rounded-[10px] bg-[#F5B700] py-2.5 text-[15px] font-bold text-slate-950 transition-transform hover:-translate-y-0.5"
                            >
                              View Details
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {visible < results.length && (
                    <button
                      onClick={() => setVisible((v) => v + 6)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-[13px] border border-[var(--dh-border)] bg-[var(--dh-surface)] py-3.5 text-[16px] font-bold text-[var(--dh-text)] hover:bg-[var(--dh-chip)]"
                    >
                      Load More Packages <ChevronDown size={17} strokeWidth={2.6} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-5 gap-4 rounded-[16px] bg-[var(--dh-surface)] px-8 py-5 ring-1 ring-[var(--dh-border)]">
            {BOTTOM.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="flex items-center gap-2.5">
                <Icon size={22} className="shrink-0 text-[#F5B700]" strokeWidth={2} />
                <span>
                  <span className="block text-[13.5px] font-black text-[var(--dh-text)]">{title}</span>
                  <span className="mt-0.5 block text-[12.5px] font-semibold text-[var(--dh-muted)]">{copy}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* --------------------------------------------------------- Right rail */}
        <aside className="sticky top-[100px] h-fit space-y-4">
          <div className="rounded-[18px] bg-[var(--dh-surface)] p-5 ring-1 ring-[var(--dh-border)]">
            <p className="text-[16.5px] font-black leading-tight text-[var(--dh-text)]">
              Why Book International Packages with Taxi09?
            </p>
            <div className="mt-4 space-y-3.5">
              {WHY_BOOK.map(({ icon: Icon, title, copy }) => (
                <div key={title} className="flex gap-2.5">
                  <Icon size={19} className="mt-0.5 shrink-0 text-[#F5B700]" strokeWidth={2.1} />
                  <span>
                    <span className="block text-[14px] font-black text-[var(--dh-text)]">{title}</span>
                    <span className="mt-0.5 block text-[13.5px] font-semibold text-[var(--dh-muted)]">{copy}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[18px] bg-[#FFF6DE] p-5">
            <p className="text-[16.5px] font-black text-slate-950">Planning a getaway?</p>
            <p className="mt-1.5 max-w-[190px] text-[14px] font-semibold text-slate-700">
              Browse every destination we cover and find your next trip.
            </p>
            <button
              onClick={() => { clearAll(); setVisible(packages.length || 6); }}
              className="mt-3.5 rounded-[10px] bg-[#F5B700] px-4 py-2.5 text-[14.5px] font-bold text-slate-950"
            >
              Show All Packages
            </button>
            <Gift size={64} className="absolute -bottom-2 -right-2 text-[#F5B700]/30" strokeWidth={1.4} />
          </div>

          {topDestinations.length > 0 && (
            <div className="rounded-[18px] bg-[var(--dh-surface)] p-5 ring-1 ring-[var(--dh-border)]">
              <p className="text-[16.5px] font-black text-[var(--dh-text)]">Top Destinations</p>
              <div className="mt-4 grid grid-cols-4 gap-3">
                {topDestinations.map(([name, image]) => (
                  <button
                    key={name}
                    onClick={() => setDestinations([name])}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span className="h-[52px] w-[52px] overflow-hidden rounded-full ring-2 ring-[var(--dh-border)]">
                      <img src={image || '/taxi09_tours_hero_beach.png'} alt="" className="h-full w-full object-cover" />
                    </span>
                    <span className="w-full truncate text-center text-[13px] font-bold text-[var(--dh-text)]">{name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
};

export default DesktopInternational;
