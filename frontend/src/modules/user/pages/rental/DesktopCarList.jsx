import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowUp, BadgeCheck, Bluetooth, Calendar, ChevronDown, Clock, Fuel, Gauge, Heart,
  Infinity as InfinityIcon, LayoutGrid, List, MapPin, Music, Search, Snowflake, Sparkles,
  Star, Sun, Usb, Users, X, Zap,
} from 'lucide-react';
import api from '../../../../shared/api/axiosInstance';
import { DesktopNav } from '../../components/desktop/DesktopChrome';
import { openRentalVehicle, unwrapResults, useDesktopTheme } from '../../components/desktop/desktopShared';

/**
 * Desktop vehicle results for /taxi/user/rental?search=true.
 *
 * Every facet, count and price is derived from the live rental catalogue - a
 * filter only appears when at least one vehicle actually declares that field,
 * so the sidebar never shows a bucket that cannot be filled.
 */

const SORTS = [
  { id: 'popular', label: 'Popular' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'name', label: 'Name (A-Z)' },
];

const QUICK_FILTERS = [
  { id: 'instant', icon: Zap, label: 'Instant Booking' },
  { id: 'zero-deposit', icon: BadgeCheck, label: 'Zero Deposit' },
  { id: 'unlimited-km', icon: InfinityIcon, label: 'Unlimited KM' },
  { id: 'best-rated', icon: Star, label: 'Best Rated' },
  { id: 'new', icon: Sparkles, label: 'New Arrivals' },
];

const AMENITY_ICONS = {
  ac: Snowflake, music: Music, bluetooth: Bluetooth, usb: Usb, sunroof: Sun,
};

const titleCase = (value) =>
  String(value || '').replace(/(^|\s|-)([a-z])/g, (_, prefix, char) => prefix + char.toUpperCase());

const TRANSMISSIONS = ['manual', 'automatic', 'amt', 'cvt'];

/**
 * Existing listings store fuel and gearbox together ("Petrol · Manual"), so
 * split that apart. An explicit `transmission` field, when an admin sets one,
 * wins over whatever the fuel string implies.
 */
const specsOf = (vehicle) => {
  // Split on any run of non-letters. Some rows were saved with a mojibake
  // separator instead of a middot, so matching a specific character is not
  // safe here.
  const parts = String(vehicle.fuel || '')
    .split(/[^\p{L}]+/u)
    .map((part) => part.trim())
    .filter(Boolean);

  const gearbox = parts.find((part) => TRANSMISSIONS.includes(part.toLowerCase()));
  const fuel = parts.find((part) => !TRANSMISSIONS.includes(part.toLowerCase()));

  return {
    fuel: titleCase(fuel || ''),
    transmission: titleCase(vehicle.transmission || gearbox || ''),
  };
};

/** Cheapest active package is what the card headline price shows. */
const lowestPrice = (vehicle) => {
  const prices = (Array.isArray(vehicle.pricing) ? vehicle.pricing : [])
    .filter((item) => item?.active !== false)
    .map((item) => Number(item.price || 0))
    .filter((value) => value > 0);
  return prices.length ? Math.min(...prices) : 0;
};

/** "12 Jun, 10:00 am" - when a held vehicle frees up. */
const formatWhen = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const bucketOf = (vehicle) =>
  vehicle.rentalSubcategoryName || titleCase(vehicle.vehicleCategory) || 'Other';

/** Facet counts, most-populated first. Empty keys are skipped entirely. */
const countBy = (vehicles, accessor) => {
  const counts = new Map();
  for (const vehicle of vehicles) {
    const key = accessor(vehicle);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
};

const FacetGroup = ({ title, facets, selected, onToggle, suffix }) => {
  if (!facets.length) return null;
  return (
    <div className="border-t border-[var(--dh-border)] px-5 py-4">
      <div className="flex items-center justify-between">
        <p className="text-[15.5px] font-black text-[var(--dh-text)]">{title}</p>
        {suffix}
      </div>
      <div className="mt-3 space-y-2.5">
        {facets.map(([label, count]) => (
          <label key={label} className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={selected.includes(label)}
              onChange={() => onToggle(label)}
              className="h-4 w-4 shrink-0 accent-[#F5B700]"
            />
            <span className="flex-1 text-[15px] font-semibold text-[var(--dh-text)]">{label}</span>
            <span className="text-[14px] font-bold text-[var(--dh-muted)]">{count}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

const DesktopCarList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [theme, toggleTheme] = useDesktopTheme();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState([]);

  const [types, setTypes] = useState([]);
  const [fuels, setFuels] = useState([]);
  const [transmissions, setTransmissions] = useState([]);
  const [quick, setQuick] = useState([]);
  const [maxPrice, setMaxPrice] = useState(null);
  const [sort, setSort] = useState('popular');
  const [view, setView] = useState('grid');
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    const place = searchParams.get('location');
    if (place) params.set('location', place);
    if (searchParams.get('pickupISO')) params.set('pickup', searchParams.get('pickupISO'));
    if (searchParams.get('returnISO')) params.set('return', searchParams.get('returnISO'));

    api
      .get(`/users/rental-vehicles${params.toString() ? `?${params}` : ''}`)
      .then((response) => { if (!cancelled) setVehicles(unwrapResults(response)); })
      .catch(() => { if (!cancelled) setVehicles([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [searchParams]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const priceCeiling = useMemo(() => {
    const values = vehicles.map(lowestPrice).filter(Boolean);
    return values.length ? Math.max(...values) : 0;
  }, [vehicles]);

  const typeFacets = useMemo(() => countBy(vehicles, bucketOf), [vehicles]);
  const fuelFacets = useMemo(() => countBy(vehicles, (v) => specsOf(v).fuel), [vehicles]);
  const transmissionFacets = useMemo(() => countBy(vehicles, (v) => specsOf(v).transmission), [vehicles]);

  const toggle = (setter, value) =>
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));

  const clearAll = () => {
    setTypes([]); setFuels([]); setTransmissions([]); setQuick([]); setMaxPrice(null);
  };

  const activeFilterCount = types.length + fuels.length + transmissions.length + quick.length + (maxPrice ? 1 : 0);

  const results = useMemo(() => {
    let list = vehicles.filter((vehicle) => {
      if (types.length && !types.includes(bucketOf(vehicle))) return false;
      const specs = specsOf(vehicle);
      if (fuels.length && !fuels.includes(specs.fuel)) return false;
      if (transmissions.length && !transmissions.includes(specs.transmission)) return false;
      if (maxPrice && lowestPrice(vehicle) > maxPrice) return false;
      // Quick filters map onto real config: an add-on-free, deposit-free
      // listing is the closest truthful reading of "Zero Deposit".
      if (quick.includes('unlimited-km') && !(vehicle.pricing || []).some((p) => Number(p.includedKm || 0) === 0)) return false;
      return true;
    });

    if (sort === 'price-asc') list = [...list].sort((a, b) => lowestPrice(a) - lowestPrice(b));
    if (sort === 'price-desc') list = [...list].sort((a, b) => lowestPrice(b) - lowestPrice(a));
    if (sort === 'name') list = [...list].sort((a, b) => String(a.name).localeCompare(String(b.name)));

    return list;
  }, [vehicles, types, fuels, transmissions, quick, maxPrice, sort]);

  const pickupLocation = searchParams.get('location') || 'Select location';
  const dropLocation = searchParams.get('drop') || pickupLocation;
  const pickupDate = searchParams.get('date') || 'Select Date';
  const pickupTime = searchParams.get('time') || 'Select Time';

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath="/taxi/user/rental" theme={theme} onToggleTheme={toggleTheme} />

      {/* ------------------------------------------------------ Search summary */}
      <section className="mx-auto max-w-[1728px] px-4 pt-5 xl:px-6">
        <div className="grid grid-cols-[1.2fr_1.2fr_1fr_1fr_auto] items-center gap-6 rounded-[18px] bg-[var(--dh-surface)] px-7 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-[var(--dh-border)]">
          {[
            { label: 'Pickup Location', value: pickupLocation, icon: MapPin },
            { label: 'Drop Location', value: dropLocation, icon: MapPin },
            { label: 'Pickup Date', value: pickupDate, icon: Calendar },
            { label: 'Pickup Time', value: pickupTime, icon: Clock },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="min-w-0">
              <p className="text-[14.5px] font-bold text-[var(--dh-text)]">{label}</p>
              <p className="mt-1.5 flex items-center gap-2 text-[15.5px] font-semibold text-[var(--dh-muted)]">
                <Icon size={16} className="shrink-0 text-[#F5B700]" strokeWidth={2.4} />
                <span className="truncate">{value}</span>
              </p>
            </div>
          ))}

          <button
            onClick={() => navigate('/taxi/user/rental')}
            className="flex h-[54px] items-center gap-2.5 rounded-[13px] bg-[#F5B700] px-8 text-[17px] font-bold text-slate-950 shadow-[0_10px_24px_rgba(245,183,0,0.32)] transition-transform hover:-translate-y-0.5"
          >
            Modify Search
            <Search size={18} strokeWidth={2.8} />
          </button>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1728px] grid-cols-[266px_minmax(0,1fr)] gap-6 px-4 pb-20 pt-6 xl:px-6">
        {/* -------------------------------------------------------- Filter rail */}
        <aside className="h-fit rounded-[18px] bg-[var(--dh-surface)] py-1 shadow-[0_10px_30px_rgba(15,23,42,0.07)] ring-1 ring-[var(--dh-border)]">
          <FacetGroup title="Vehicle Type" facets={typeFacets} selected={types} onToggle={(v) => toggle(setTypes, v)} />

          {priceCeiling > 0 && (
            <div className="border-t border-[var(--dh-border)] px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-[15.5px] font-black text-[var(--dh-text)]">Price Range</p>
                <span className="text-[14.5px] font-bold text-[var(--dh-muted)]">₹</span>
              </div>
              <p className="mt-2 text-[14.5px] font-bold text-[var(--dh-muted)]">
                ₹0 – ₹{(maxPrice || priceCeiling).toLocaleString('en-IN')}
              </p>
              <input
                type="range"
                min={0}
                max={priceCeiling}
                step={100}
                value={maxPrice ?? priceCeiling}
                onChange={(event) => setMaxPrice(Number(event.target.value))}
                className="mt-3 w-full accent-[#F5B700]"
                aria-label="Maximum price per day"
              />
            </div>
          )}

          <FacetGroup title="Transmission" facets={transmissionFacets} selected={transmissions} onToggle={(v) => toggle(setTransmissions, v)} />
          <FacetGroup title="Fuel Type" facets={fuelFacets} selected={fuels} onToggle={(v) => toggle(setFuels, v)} />

          {activeFilterCount > 0 && (
            <div className="border-t border-[var(--dh-border)] px-5 py-4">
              <button
                onClick={clearAll}
                className="flex w-full items-center justify-center gap-2 rounded-[11px] border border-[var(--dh-border)] py-2.5 text-[15px] font-bold text-[var(--dh-text)] hover:bg-[var(--dh-chip)]"
              >
                <X size={15} strokeWidth={2.8} /> Clear All Filters
              </button>
            </div>
          )}
        </aside>

        {/* ------------------------------------------------------------ Results */}
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-[22px] font-black tracking-[-0.03em] text-[var(--dh-text)]">
              {loading ? 'Finding cars…' : `${results.length} ${results.length === 1 ? 'Car' : 'Cars'} Found`}
            </h1>

            <div className="flex items-center gap-3">
              <span className="text-[15.5px] font-semibold text-[var(--dh-muted)]">Sort By:</span>
              <span className="relative">
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="h-[42px] appearance-none rounded-[11px] border border-[var(--dh-border)] bg-[var(--dh-surface)] pl-4 pr-10 text-[15.5px] font-bold text-[var(--dh-text)] outline-none"
                >
                  {SORTS.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--dh-muted)]" strokeWidth={2.6} />
              </span>

              <span className="flex overflow-hidden rounded-[11px] border border-[var(--dh-border)]">
                {[{ id: 'grid', icon: LayoutGrid }, { id: 'list', icon: List }].map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setView(id)}
                    className={`flex h-[42px] w-[42px] items-center justify-center ${view === id ? 'bg-[#F5B700] text-slate-950' : 'bg-[var(--dh-surface)] text-[var(--dh-muted)]'}`}
                    aria-label={`${id} view`}
                    aria-pressed={view === id}
                  >
                    <Icon size={17} strokeWidth={2.4} />
                  </button>
                ))}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {QUICK_FILTERS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => toggle(setQuick, id)}
                className={`flex items-center gap-2 rounded-[11px] border px-4 py-2.5 text-[14.5px] font-bold transition-colors ${
                  quick.includes(id)
                    ? 'border-[#F5B700] bg-[#FFF7DC] text-slate-900'
                    : 'border-[var(--dh-border)] bg-[var(--dh-surface)] text-[var(--dh-text)] hover:bg-[var(--dh-chip)]'
                }`}
              >
                <Icon size={15} className="text-[#F5B700]" strokeWidth={2.4} />
                {label}
              </button>
            ))}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-2 rounded-[11px] px-4 py-2.5 text-[14.5px] font-bold text-[var(--dh-muted)] hover:text-[var(--dh-text)]"
              >
                <X size={15} strokeWidth={2.8} /> Clear All
              </button>
            )}
          </div>

          {loading ? (
            <div className="mt-5 space-y-3">
              {[0, 1, 2].map((index) => <div key={index} className="skeleton h-[176px] rounded-[18px]" />)}
            </div>
          ) : results.length === 0 ? (
            <div className="mt-5 rounded-[18px] bg-[var(--dh-surface)] p-14 text-center ring-1 ring-[var(--dh-border)]">
              <p className="text-[17px] font-black text-[var(--dh-text)]">No cars match these filters</p>
              <p className="mt-2 text-[15.5px] font-medium text-[var(--dh-muted)]">Try clearing a filter or widening the price range.</p>
            </div>
          ) : (
            <div className={`mt-5 ${view === 'grid' ? 'space-y-3' : 'grid grid-cols-2 gap-3'}`}>
              {results.map((vehicle) => {
                const id = vehicle.id || vehicle._id;
                const price = lowestPrice(vehicle);
                const amenities = (Array.isArray(vehicle.amenities) ? vehicle.amenities : []).slice(0, 5);
                const specs = specsOf(vehicle);
                const isSaved = saved.includes(id);

                return (
                  /* min-h keeps every card the same height without clipping the
                     ones that have more spec rows filled in. */
                  <article
                    key={id}
                    className={`grid min-h-[190px] grid-cols-[286px_minmax(0,1fr)_216px] overflow-hidden rounded-[18px] bg-[var(--dh-surface)] shadow-[0_8px_24px_rgba(15,23,42,0.07)] ring-1 ring-[var(--dh-border)] ${
                      vehicle.available === false ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="relative bg-[var(--dh-chip)]">
                      {/* Absolute so a tall source image fills the cell instead of
                          stretching the row - h-full against an auto-height grid
                          row resolves to the image's natural height. */}
                      <img
                        src={vehicle.image || vehicle.coverImage || '/taxi09_rental_self_drive.png'}
                        alt={vehicle.name}
                        className="absolute inset-0 h-full w-full object-contain p-3"
                      />
                      <button
                        onClick={() => toggle(setSaved, id)}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--dh-surface)] shadow-sm"
                        aria-label={isSaved ? 'Remove from saved' : 'Save vehicle'}
                        aria-pressed={isSaved}
                      >
                        <Heart size={15} className={isSaved ? 'fill-rose-500 text-rose-500' : 'text-[var(--dh-muted)]'} strokeWidth={2.4} />
                      </button>
                    </div>

                    <div className="flex min-w-0 flex-col justify-center px-5 py-4">
                      <h2 className="text-[20px] font-black tracking-[-0.02em] text-[var(--dh-text)]">{vehicle.name}</h2>
                      <p className="mt-0.5 text-[15px] font-semibold text-[var(--dh-muted)]">{bucketOf(vehicle)}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                        {vehicle.capacity > 0 && (
                          <span className="flex items-center gap-1.5 text-[15px] font-semibold text-[var(--dh-text)]">
                            <Users size={15} className="text-[var(--dh-muted)]" strokeWidth={2.2} /> {vehicle.capacity} Seats
                          </span>
                        )}
                        {specs.transmission && (
                          <span className="flex items-center gap-1.5 text-[15px] font-semibold text-[var(--dh-text)]">
                            <Gauge size={15} className="text-[var(--dh-muted)]" strokeWidth={2.2} /> {specs.transmission}
                          </span>
                        )}
                        {specs.fuel && (
                          <span className="flex items-center gap-1.5 text-[15px] font-semibold text-[var(--dh-text)]">
                            <Fuel size={15} className="text-[var(--dh-muted)]" strokeWidth={2.2} /> {specs.fuel}
                          </span>
                        )}
                      </div>

                      {amenities.length > 0 && (
                        <div className="mt-2.5 flex items-center gap-x-5 overflow-hidden">
                          {amenities.map((amenity) => {
                            const Icon = AMENITY_ICONS[String(amenity).toLowerCase()] || Sparkles;
                            return (
                              <span key={amenity} className="flex items-center gap-1.5 text-[14px] font-semibold text-[var(--dh-muted)]">
                                <Icon size={14} strokeWidth={2.2} /> {titleCase(amenity)}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Always occupies a row so cards with and without an
                          advance offer still line up. */}
                      <div className="mt-3 h-[30px]">
                        {vehicle.advancePayment?.enabled && (
                          <span className="inline-flex rounded-[8px] bg-emerald-50 px-3 py-1.5 text-[14px] font-bold text-emerald-700">
                            Book with {vehicle.advancePayment.paymentMode === 'percentage'
                              ? `${vehicle.advancePayment.amount}% advance`
                              : `₹${Number(vehicle.advancePayment.amount).toLocaleString('en-IN')} advance`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-center gap-2 border-l border-[var(--dh-border)] px-5 py-4">
                      {price > 0 ? (
                        <>
                          <p className="text-[24px] font-black leading-none tracking-[-0.03em] text-[var(--dh-text)]">
                            ₹{price.toLocaleString('en-IN')}
                            <span className="text-[15.5px] font-bold text-[var(--dh-muted)]">/day</span>
                          </p>
                          <p className="text-[13.5px] font-semibold text-[var(--dh-muted)]">Excl. of taxes</p>
                        </>
                      ) : (
                        <p className="text-[15.5px] font-bold text-[var(--dh-muted)]">Price on request</p>
                      )}

                      {vehicle.available === false ? (
                        <>
                          <span className="mt-1 w-full rounded-[11px] bg-[var(--dh-chip)] py-2.5 text-center text-[14.5px] font-bold text-[var(--dh-muted)]">
                            Booked
                          </span>
                          {vehicle.availableFrom && (
                            <span className="text-[13px] font-semibold text-rose-600">
                              Free from {formatWhen(vehicle.availableFrom)}
                            </span>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => openRentalVehicle(navigate, vehicle)}
                          className="mt-1 w-full rounded-[11px] bg-[#F5B700] py-2.5 text-[15.5px] font-bold text-slate-950 transition-transform hover:-translate-y-0.5"
                        >
                          View Details
                        </button>
                      )}

                      {(vehicle.addOns || []).length > 0 && (
                        <p className="text-[13.5px] font-bold text-[var(--dh-muted)]">
                          +{vehicle.addOns.filter((a) => a.active !== false).length} add-ons
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-28 right-8 z-40 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#F5B700] text-slate-950 shadow-[0_10px_24px_rgba(245,183,0,0.35)]"
          aria-label="Back to top"
        >
          <ArrowUp size={20} strokeWidth={2.8} />
        </button>
      )}
    </div>
  );
};

export default DesktopCarList;
