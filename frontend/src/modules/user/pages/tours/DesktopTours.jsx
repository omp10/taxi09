import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BannerHero from '../../components/BannerHero';
import {
  BadgeCheck, BadgePercent, CalendarCheck, CalendarDays, ChevronDown, Crown, Grid2X2, Headset,
  Heart, Landmark, MapPin, Mountain, Palmtree, ShieldCheck, Sparkles, Star, Users, UtensilsCrossed,
} from 'lucide-react';
import { rememberPackage } from '../../utils/packageHandoff';
import api from '../../../../shared/api/axiosInstance';
import { DesktopNav } from '../../components/desktop/DesktopChrome';
import { unwrapResults, useDesktopTheme } from '../../components/desktop/desktopShared';

/**
 * Desktop tour packages for /taxi/user/tours.
 *
 * The hero, category chips and trust strip are admin-managed content blocks
 * (tours.hero / tours.categories / tours.trust); the listing and every facet
 * come from the domestic travel-package catalogue.
 */

const ICONS = {
  Grid2X2, Heart, Mountain, Palmtree, Users, Landmark, Crown, Sparkles,
  ShieldCheck, BadgePercent, CalendarCheck, Headset, BadgeCheck, Star, MapPin,
};

const SORTS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'rating', label: 'Traveller Rating' },
  { id: 'duration', label: 'Duration' },
];

const DURATION_BANDS = [
  { label: '1 – 3 Days', min: 1, max: 3 },
  { label: '4 – 6 Days', min: 4, max: 6 },
  { label: '7 – 9 Days', min: 7, max: 9 },
  { label: '10+ Days', min: 10, max: Infinity },
];

// Rendered only when the block is unavailable, so the page is never blank.
const FALLBACK_HERO = {
  eyebrow: 'Discover',
  title: 'Amazing Places with Perfect Plans',
  subtitle: 'Curated tour packages for every kind of traveler.',
  image: '/taxi09_tours_hero_mountain.png',
};

const WHY_BOOK = [
  { icon: Sparkles, title: 'Handpicked Experiences', copy: 'Curated tours by travel experts' },
  { icon: BadgeCheck, title: 'Best Price Guarantee', copy: 'Get the best deals, always' },
  { icon: CalendarCheck, title: 'Flexible & Easy Booking', copy: 'Book now, pay later options' },
  { icon: Headset, title: '24/7 Travel Assistance', copy: "We're with you, always" },
];

const BOTTOM = [
  { icon: Users, title: 'Happy Travellers', copy: 'Trusted by thousands' },
  { icon: Headset, title: '24/7 Customer Support', copy: "We're here to help always" },
  { icon: ShieldCheck, title: 'Secure Payments', copy: '100% secure transactions' },
  { icon: BadgePercent, title: 'Best Price Guarantee', copy: 'Lowest prices, always' },
  { icon: Star, title: 'Rated by travellers', copy: 'By our happy customers' },
];

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const titleOf = (pkg) => pkg.title || pkg.name || 'Package';

const durationLabel = (pkg) => {
  if (pkg.durationLabel) return pkg.durationLabel;
  const days = Number(pkg.durationDays || 0);
  return days > 0 ? `${days} Days / ${Math.max(0, days - 1)} Nights` : '';
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

const DesktopTours = () => {
  const navigate = useNavigate();
  const [theme, toggleTheme] = useDesktopTheme();

  const [packages, setPackages] = useState([]);
  const [blocks, setBlocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState([]);
  const [visible, setVisible] = useState(6);

  const [category, setCategory] = useState('All Packages');
  const [states, setStates] = useState([]);
  const [durations, setDurations] = useState([]);
  const [maxPrice, setMaxPrice] = useState(null);
  const [sort, setSort] = useState('recommended');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/users/travel-packages', { params: { scope: 'domestic' } }).catch(() => null),
      api.get('/users/content-blocks', { params: { keys: 'tours.hero,tours.categories,tours.trust' } }).catch(() => null),
    ]).then(([packageRes, blockRes]) => {
      if (cancelled) return;
      setPackages(packageRes ? unwrapResults(packageRes) : []);
      setBlocks(blockRes?.data?.data?.blocks ?? blockRes?.data?.blocks ?? {});
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const hero = blocks['tours.hero']?.[0] || FALLBACK_HERO;
  const trust = blocks['tours.trust'] || [];

  // Only show a category chip when a package actually carries that category.
  const categoryChips = useMemo(() => {
    const present = new Set(packages.map((p) => p.category).filter(Boolean));
    const chips = blocks['tours.categories'] || [];
    return chips.filter((chip) => chip.label === 'All Packages' || present.has(chip.label));
  }, [blocks, packages]);

  const stateFacets = useMemo(() => countBy(packages, (p) => p.state || p.country), [packages]);
  const durationFacets = useMemo(
    () => DURATION_BANDS
      .map((band) => [band.label, packages.filter((p) => Number(p.durationDays || 0) >= band.min && Number(p.durationDays || 0) <= band.max).length])
      .filter(([, count]) => count > 0),
    [packages],
  );
  const priceCeiling = useMemo(
    () => packages.reduce((max, pkg) => Math.max(max, Number(pkg.price || 0)), 0),
    [packages],
  );

  const toggle = (setter, value) =>
    setter((current) => (current.includes(value) ? current.filter((i) => i !== value) : [...current, value]));

  const clearAll = () => {
    setCategory('All Packages'); setStates([]); setDurations([]); setMaxPrice(null);
  };

  const activeFilters =
    (category !== 'All Packages' ? 1 : 0) + states.length + durations.length + (maxPrice ? 1 : 0);

  const results = useMemo(() => {
    let list = packages.filter((pkg) => {
      const price = Number(pkg.price || 0);
      const days = Number(pkg.durationDays || 0);

      if (category !== 'All Packages' && pkg.category !== category) return false;
      if (states.length && !states.includes(pkg.state || pkg.country)) return false;
      if (maxPrice && price > maxPrice) return false;
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
  }, [packages, category, states, durations, maxPrice, sort]);

  // Destination tiles reuse each package's own artwork.
  const topDestinations = useMemo(() => {
    const seen = new Map();
    for (const pkg of packages) {
      const key = pkg.state || pkg.country;
      if (key && !seen.has(key)) seen.set(key, pkg.image || pkg.gallery?.[0] || '');
    }
    return [...seen.entries()];
  }, [packages]);

  const openPackage = (pkg) => {
    rememberPackage('tour', pkg);
    // TourDetails reads `tour` off router state.
    navigate(`/taxi/user/tours/details/${pkg.slug}`, { state: { tour: pkg } });
  };

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath="/taxi/user/tours" theme={theme} onToggleTheme={toggleTheme} />

      <section className="mx-auto grid max-w-[1728px] grid-cols-[minmax(0,1fr)_324px] gap-6 px-4 pb-20 pt-5 xl:px-6">
        <div>
        {/* Hero is admin artwork - Homepage Banners > Tours. */}
        <BannerHero type="tours" rounded="rounded-[20px]" />

        {trust.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-4 rounded-[16px] bg-[var(--dh-surface)] px-7 py-4 ring-1 ring-[var(--dh-border)]">
            {trust.map((item) => {
              const Icon = ICONS[item.icon] || Sparkles;
              return (
                <div key={item.title} className="flex items-center gap-2.5">
                  <Icon size={22} className="shrink-0 text-[#F5B700]" strokeWidth={2} />
                  <span>
                    <span className="block text-[14px] font-black text-[var(--dh-text)]">{item.title}</span>
                    <span className="mt-0.5 block text-[13px] font-semibold text-[var(--dh-muted)]">{item.sub}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* -------------------------------------------------------- Category row */}
        {categoryChips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {categoryChips.map((chip) => {
              const Icon = ICONS[chip.icon] || Sparkles;
              const isActive = chip.label === category;
              return (
                <button
                  key={chip.label}
                  onClick={() => setCategory(chip.label)}
                  aria-pressed={isActive}
                  className={`flex items-center gap-2 rounded-[12px] border px-4 py-2.5 text-[15px] font-bold transition-colors ${
                    isActive
                      ? 'border-[#F5B700] bg-[#FFF7DC] text-slate-900'
                      : 'border-[var(--dh-border)] bg-[var(--dh-surface)] text-[var(--dh-text)] hover:bg-[var(--dh-chip)]'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-[#F5B700]' : chip.tone} strokeWidth={2.3} />
                  {chip.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-5 grid grid-cols-[216px_minmax(0,1fr)] gap-5">
          {/* ----------------------------------------------------------- Filters */}
          <aside className="h-fit rounded-[18px] bg-[var(--dh-surface)] py-1 ring-1 ring-[var(--dh-border)]">
            <div className="flex items-center justify-between px-5 pb-3 pt-4">
              <p className="text-[16px] font-black text-[var(--dh-text)]">Filter Packages</p>
              {activeFilters > 0 && (
                <button onClick={clearAll} className="text-[13.5px] font-bold text-[#F5B700]">Clear All</button>
              )}
            </div>

            {priceCeiling > 0 && (
              <div className="border-t border-[var(--dh-border)] px-5 py-4">
                <p className="text-[15px] font-black text-[var(--dh-text)]">Budget (Per Person)</p>
                <p className="mt-2 text-[14px] font-bold text-[var(--dh-muted)]">
                  Up to {formatMoney(maxPrice || priceCeiling)}
                </p>
                <input
                  type="range" min={0} max={priceCeiling} step={500}
                  value={maxPrice ?? priceCeiling}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="mt-2.5 w-full accent-[#F5B700]"
                  aria-label="Maximum price per person"
                />
              </div>
            )}

            <CheckList title="Trip Duration" facets={durationFacets} selected={durations} onToggle={(v) => toggle(setDurations, v)} />
            <CheckList title="Destination" facets={stateFacets} selected={states} onToggle={(v) => toggle(setStates, v)} />
          </aside>

          {/* ----------------------------------------------------------- Results */}
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[18px] font-black tracking-[-0.02em] text-[var(--dh-text)]">
                {loading ? 'Loading packages…' : `${results.length} Tour Package${results.length === 1 ? '' : 's'} Found`}
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
                <p className="mt-2 text-[15.5px] font-medium text-[var(--dh-muted)]">Try another category or widen the budget.</p>
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
                            src={pkg.image || pkg.gallery?.[0] || '/taxi09_tours_hero_mountain.png'}
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
                          <span className="flex items-center gap-2">
                            <h2 className="truncate text-[20px] font-black tracking-[-0.02em] text-[var(--dh-text)]">{titleOf(pkg)}</h2>
                            {pkg.category && (
                              <span className="shrink-0 rounded-[6px] bg-[var(--dh-chip)] px-2 py-0.5 text-[12.5px] font-black uppercase tracking-[0.05em] text-[var(--dh-muted)]">
                                {pkg.category}
                              </span>
                            )}
                          </span>

                          {(pkg.state || pkg.stops?.length > 0) && (
                            <p className="mt-1 flex items-center gap-1.5 truncate text-[14px] font-semibold text-[var(--dh-muted)]">
                              <MapPin size={13} className="shrink-0" strokeWidth={2.2} />
                              <span className="truncate">{pkg.stops?.length ? pkg.stops.join(' • ') : pkg.state}</span>
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
                        </div>

                        <div className="flex flex-col items-end justify-center gap-1 border-l border-[var(--dh-border)] px-5 py-4">
                          {Number(pkg.oldPrice) > Number(pkg.price) && (
                            <span className="text-[14px] font-bold text-[var(--dh-muted)] line-through">{formatMoney(pkg.oldPrice)}</span>
                          )}
                          <span className="text-[23px] font-black leading-none tracking-[-0.03em] text-[var(--dh-text)]">
                            {formatMoney(pkg.price)}
                          </span>
                          <span className="text-[13.5px] font-semibold text-[var(--dh-muted)]">Per Person</span>
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
              Why Book Tour Packages with Taxi09?
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

          {hero.offerTitle && (
            <div className="rounded-[18px] bg-[#FFF6DE] p-5">
              <p className="text-[18px] font-black leading-tight text-slate-950">{hero.offerTitle}</p>
              {hero.offerSubtitle && (
                <p className="mt-1.5 text-[14px] font-semibold text-slate-700">{hero.offerSubtitle}</p>
              )}
              <button
                onClick={() => { clearAll(); setVisible(packages.length || 6); }}
                className="mt-3.5 rounded-[10px] bg-[#F5B700] px-4 py-2.5 text-[14.5px] font-bold text-slate-950"
              >
                Show All Packages
              </button>
            </div>
          )}

          {topDestinations.length > 0 && (
            <div className="rounded-[18px] bg-[var(--dh-surface)] p-5 ring-1 ring-[var(--dh-border)]">
              <p className="text-[16.5px] font-black text-[var(--dh-text)]">Top Destinations</p>
              <div className="mt-4 grid grid-cols-4 gap-3">
                {topDestinations.map(([name, image]) => (
                  <button
                    key={name}
                    onClick={() => setStates([name])}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span className="h-[52px] w-[52px] overflow-hidden rounded-full ring-2 ring-[var(--dh-border)]">
                      <img src={image || '/taxi09_tours_hero_mountain.png'} alt="" className="h-full w-full object-cover" />
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

export default DesktopTours;
