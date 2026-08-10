import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BannerHero from '../../components/BannerHero';
import {
  BadgeCheck, Building2, Calendar, ChevronDown, Headphones, Heart, Images, Lock, MapPin,
  Search, ShieldCheck, Sparkles, Star, Ticket, Users, X,
} from 'lucide-react';
import api from '../../../../shared/api/axiosInstance';
import { DesktopNav } from '../../components/desktop/DesktopChrome';
import { unwrapResults, useDesktopTheme } from '../../components/desktop/desktopShared';

/**
 * Desktop hotel search results for /taxi/user/hotel.
 *
 * Facets are built from the live catalogue, so a filter only appears when some
 * hotel actually carries that value - no bucket that cannot be filled.
 */

const SORTS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'rating', label: 'Guest Rating' },
];

const GUEST_BANDS = [
  { id: '4', label: '4.0+ Excellent', min: 4 },
  { id: '3', label: '3.0+ Very Good', min: 3 },
  { id: '2', label: '2.0+ Good', min: 2 },
];

const WHY_BOOK = [
  { icon: BadgeCheck, title: 'Best Price Guarantee', copy: "Find a lower price? We'll match it." },
  { icon: Ticket, title: 'Free Cancellation', copy: 'Most hotels offer free cancellation.' },
  { icon: Lock, title: 'Secure Booking', copy: 'Your data is safe with us.' },
  { icon: Headphones, title: '24/7 Customer Support', copy: "We're here to help you anytime." },
];

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const ratingWord = (rating) => {
  const value = Number(rating || 0);
  if (value >= 4.5) return 'Excellent';
  if (value >= 4) return 'Very Good';
  if (value >= 3) return 'Good';
  return 'Rated';
};

/** Facet counts, most-populated first. Empty values are skipped. */
const countBy = (items, accessor) => {
  const counts = new Map();
  for (const item of items) {
    for (const key of [accessor(item)].flat()) {
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
};

const FacetGroup = ({ title, facets, selected, onToggle }) => {
  if (!facets.length) return null;
  return (
    <div className="border-t border-[var(--dh-border)] px-5 py-4">
      <p className="text-[14px] font-black text-[var(--dh-text)]">{title}</p>
      <div className="mt-3 space-y-2.5">
        {facets.map(([label, count]) => (
          <label key={label} className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={selected.includes(label)}
              onChange={() => onToggle(label)}
              className="h-4 w-4 shrink-0 accent-[#F5B700]"
            />
            <span className="flex-1 truncate text-[13.5px] font-semibold text-[var(--dh-text)]">{label}</span>
            <span className="text-[12.5px] font-bold text-[var(--dh-muted)]">{count}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

const DesktopHotelList = () => {
  const navigate = useNavigate();
  const [theme, toggleTheme] = useDesktopTheme();

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState([]);
  const [visible, setVisible] = useState(6);

  const [cities, setCities] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [stars, setStars] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [guestBands, setGuestBands] = useState([]);
  const [maxPrice, setMaxPrice] = useState(null);
  const [sort, setSort] = useState('recommended');

  const [search, setSearch] = useState({ location: '', checkIn: '', checkOut: '', guests: 2, rooms: 1 });

  useEffect(() => {
    let cancelled = false;
    // Search runs on the server so it can match area names and, when a map
    // point is supplied, order by real distance.
    const params = new URLSearchParams();
    if (search.location.trim()) params.set('q', search.location.trim());

    api
      .get(`/users/hotels${params.toString() ? `?${params}` : ''}`)
      .then((response) => { if (!cancelled) setHotels(unwrapResults(response)); })
      .catch(() => { if (!cancelled) setHotels([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [search.location]);

  const priceCeiling = useMemo(
    () => hotels.reduce((max, hotel) => Math.max(max, Number(hotel.price || 0)), 0),
    [hotels],
  );

  const cityFacets = useMemo(() => countBy(hotels, (h) => h.city), [hotels]);
  const typeFacets = useMemo(() => countBy(hotels, (h) => h.propertyType), [hotels]);
  // Star buckets read "5 Star", sorted high to low rather than by popularity.
  const starFacets = useMemo(
    () => countBy(hotels, (h) => (h.starRating > 0 ? `${h.starRating} Star` : ''))
      .sort((a, b) => parseInt(b[0], 10) - parseInt(a[0], 10)),
    [hotels],
  );
  const amenityFacets = useMemo(() => countBy(hotels, (h) => h.amenities || []).slice(0, 8), [hotels]);
  const guestFacets = useMemo(
    () => GUEST_BANDS
      .map((band) => [band.label, hotels.filter((h) => Number(h.rating || 0) >= band.min).length])
      .filter(([, count]) => count > 0),
    [hotels],
  );

  const toggle = (setter, value) =>
    setter((current) => (current.includes(value) ? current.filter((i) => i !== value) : [...current, value]));

  const clearAll = () => {
    setCities([]); setPropertyTypes([]); setStars([]); setAmenities([]); setGuestBands([]); setMaxPrice(null);
  };

  const activeFilters =
    cities.length + propertyTypes.length + stars.length + amenities.length + guestBands.length + (maxPrice ? 1 : 0);

  const results = useMemo(() => {
    let list = hotels.filter((hotel) => {
      if (cities.length && !cities.includes(hotel.city)) return false;
      if (propertyTypes.length && !propertyTypes.includes(hotel.propertyType)) return false;
      if (stars.length && !stars.includes(`${hotel.starRating} Star`)) return false;
      if (maxPrice && Number(hotel.price || 0) > maxPrice) return false;
      if (amenities.length && !amenities.every((a) => (hotel.amenities || []).includes(a))) return false;
      if (guestBands.length) {
        const min = Math.min(...guestBands.map((label) => GUEST_BANDS.find((b) => b.label === label)?.min ?? 0));
        if (Number(hotel.rating || 0) < min) return false;
      }
      return true;
    });

    if (sort === 'price-asc') list = [...list].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sort === 'price-desc') list = [...list].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    if (sort === 'rating') list = [...list].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    if (sort === 'recommended') list = [...list].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    return list;
  }, [hotels, cities, propertyTypes, stars, amenities, guestBands, maxPrice, sort]);

  const openHotel = (hotel) => {
    const payload = { hotel, search };
    try {
      window.sessionStorage.setItem('taxi:hotel-pending', JSON.stringify(payload));
    } catch {
      // Continue with router state if storage is unavailable.
    }
    navigate(`/taxi/user/hotel/${hotel.slug}`, { state: payload });
  };

  const headingCity = cities.length === 1 ? cities[0] : search.location.trim();
  const field = 'w-full bg-transparent text-[14px] font-bold text-[var(--dh-text)] placeholder:font-semibold placeholder:text-[var(--dh-muted)] outline-none';

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath="/taxi/user/hotel" theme={theme} onToggleTheme={toggleTheme} />

      <section className="mx-auto max-w-[1440px] px-8 pb-20 pt-5 xl:px-12">
        {/* Hero is admin artwork - Homepage Banners > Hotel. */}
        <BannerHero type="hotel" rounded="rounded-[20px]" className="mb-5" />

        {/* ---------------------------------------------------------- Search bar */}
        <div className="grid grid-cols-[1.3fr_1fr_1fr_1.1fr_auto] items-center gap-6 rounded-[18px] bg-[var(--dh-surface)] px-7 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-[var(--dh-border)]">
          <label className="min-w-0">
            <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[var(--dh-muted)]">Location</span>
            <span className="mt-1.5 flex items-center gap-2">
              <MapPin size={17} className="shrink-0 text-[#F5B700]" strokeWidth={2.4} />
              <input
                value={search.location}
                onChange={(e) => setSearch((c) => ({ ...c, location: e.target.value }))}
                placeholder="Where are you going?"
                className={field}
              />
            </span>
          </label>

          <label className="border-l border-[var(--dh-border)] pl-6">
            <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[var(--dh-muted)]">Check-in</span>
            <span className="mt-1.5 flex items-center gap-2">
              <Calendar size={17} className="shrink-0 text-[#F5B700]" strokeWidth={2.4} />
              <input type="date" value={search.checkIn} onChange={(e) => setSearch((c) => ({ ...c, checkIn: e.target.value }))} className={field} />
            </span>
          </label>

          <label className="border-l border-[var(--dh-border)] pl-6">
            <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[var(--dh-muted)]">Check-out</span>
            <span className="mt-1.5 flex items-center gap-2">
              <Calendar size={17} className="shrink-0 text-[#F5B700]" strokeWidth={2.4} />
              <input type="date" value={search.checkOut} onChange={(e) => setSearch((c) => ({ ...c, checkOut: e.target.value }))} className={field} />
            </span>
          </label>

          <div className="border-l border-[var(--dh-border)] pl-6">
            <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[var(--dh-muted)]">Guests &amp; Rooms</span>
            <span className="mt-1.5 flex items-center gap-2">
              <Users size={17} className="shrink-0 text-[#F5B700]" strokeWidth={2.4} />
              <input
                type="number" min="1" value={search.guests}
                onChange={(e) => setSearch((c) => ({ ...c, guests: Math.max(1, Number(e.target.value || 1)) }))}
                className="w-10 bg-transparent text-[14px] font-bold text-[var(--dh-text)] outline-none"
                aria-label="Guests"
              />
              <span className="text-[13.5px] font-semibold text-[var(--dh-muted)]">Guests,</span>
              <input
                type="number" min="1" value={search.rooms}
                onChange={(e) => setSearch((c) => ({ ...c, rooms: Math.max(1, Number(e.target.value || 1)) }))}
                className="w-10 bg-transparent text-[14px] font-bold text-[var(--dh-text)] outline-none"
                aria-label="Rooms"
              />
              <span className="text-[13.5px] font-semibold text-[var(--dh-muted)]">Room</span>
            </span>
          </div>

          <button
            onClick={() => setVisible(6)}
            className="flex h-[52px] items-center gap-2.5 rounded-[13px] bg-[#F5B700] px-7 text-[15.5px] font-bold text-slate-950 shadow-[0_10px_24px_rgba(245,183,0,0.3)]"
          >
            <Search size={18} strokeWidth={2.8} /> Search Hotels
          </button>
        </div>

        <div className="mt-6 grid grid-cols-[248px_minmax(0,1fr)_312px] gap-6">
          {/* ------------------------------------------------------------ Filters */}
          <aside className="h-fit rounded-[18px] bg-[var(--dh-surface)] py-1 shadow-[0_10px_30px_rgba(15,23,42,0.07)] ring-1 ring-[var(--dh-border)]">
            <div className="flex items-center justify-between px-5 pb-3 pt-4">
              <p className="text-[15px] font-black text-[var(--dh-text)]">Filters</p>
              {activeFilters > 0 && (
                <button onClick={clearAll} className="text-[12.5px] font-bold text-[#F5B700]">Clear All</button>
              )}
            </div>

            {priceCeiling > 0 && (
              <div className="border-t border-[var(--dh-border)] px-5 py-4">
                <p className="text-[14px] font-black text-[var(--dh-text)]">Price per night</p>
                <p className="mt-2 text-[13px] font-bold text-[var(--dh-muted)]">
                  ₹0 – {formatMoney(maxPrice || priceCeiling)}
                </p>
                <input
                  type="range" min={0} max={priceCeiling} step={100}
                  value={maxPrice ?? priceCeiling}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="mt-3 w-full accent-[#F5B700]"
                  aria-label="Maximum price per night"
                />
              </div>
            )}

            <FacetGroup title="City" facets={cityFacets} selected={cities} onToggle={(v) => toggle(setCities, v)} />
            <FacetGroup title="Property Type" facets={typeFacets} selected={propertyTypes} onToggle={(v) => toggle(setPropertyTypes, v)} />
            <FacetGroup title="Star Rating" facets={starFacets} selected={stars} onToggle={(v) => toggle(setStars, v)} />
            <FacetGroup title="Guest Rating" facets={guestFacets} selected={guestBands} onToggle={(v) => toggle(setGuestBands, v)} />
            <FacetGroup title="Amenities" facets={amenityFacets} selected={amenities} onToggle={(v) => toggle(setAmenities, v)} />
          </aside>

          {/* ------------------------------------------------------------ Results */}
          <div>
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-[22px] font-black tracking-[-0.03em] text-[var(--dh-text)]">
                  {headingCity ? `Hotels in ${headingCity}` : 'All Hotels'}
                </h1>
                <p className="mt-0.5 text-[13px] font-semibold text-[var(--dh-muted)]">
                  {loading ? 'Loading properties…' : `${results.length} ${results.length === 1 ? 'property' : 'properties'} found`}
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
                {[0, 1, 2].map((i) => <div key={i} className="skeleton h-[172px] rounded-[16px]" />)}
              </div>
            ) : results.length === 0 ? (
              <div className="mt-4 rounded-[16px] bg-[var(--dh-surface)] p-14 text-center ring-1 ring-[var(--dh-border)]">
                <p className="text-[16px] font-black text-[var(--dh-text)]">No hotels match these filters</p>
                <p className="mt-2 text-[14px] font-medium text-[var(--dh-muted)]">Try clearing a filter or widening the price range.</p>
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-3">
                  {results.slice(0, visible).map((hotel) => {
                    const id = hotel._id || hotel.slug;
                    const isSaved = saved.includes(id);
                    const gallery = hotel.gallery?.length || 0;

                    return (
                      <article
                        key={id}
                        className="grid min-h-[172px] grid-cols-[260px_minmax(0,1fr)_186px] overflow-hidden rounded-[16px] bg-[var(--dh-surface)] shadow-[0_8px_24px_rgba(15,23,42,0.07)] ring-1 ring-[var(--dh-border)]"
                      >
                        <div className="relative bg-[var(--dh-chip)]">
                          <img
                            src={hotel.image || hotel.gallery?.[0] || '/taxi09_hotel_hero.png'}
                            alt={hotel.name}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          {hotel.badge && (
                            <span className="absolute left-3 top-3 rounded-[8px] bg-emerald-600 px-2.5 py-1 text-[10.5px] font-black text-white">
                              {hotel.badge}
                            </span>
                          )}
                          <button
                            onClick={() => toggle(setSaved, id)}
                            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm"
                            aria-label={isSaved ? 'Remove from saved' : 'Save hotel'}
                            aria-pressed={isSaved}
                          >
                            <Heart size={15} className={isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-500'} strokeWidth={2.4} />
                          </button>
                          {gallery > 0 && (
                            <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-[7px] bg-black/60 px-2 py-1 text-[10.5px] font-bold text-white">
                              <Images size={12} strokeWidth={2.4} /> {gallery}
                            </span>
                          )}
                        </div>

                        <div className="flex min-w-0 flex-col justify-center px-5 py-4">
                          <span className="flex items-center gap-2">
                            <h2 className="truncate text-[19px] font-black tracking-[-0.02em] text-[var(--dh-text)]">{hotel.name}</h2>
                            {hotel.starRating > 0 && (
                              <span className="flex shrink-0 items-center gap-0.5" aria-label={`${hotel.starRating} star property`}>
                                {Array.from({ length: hotel.starRating }, (_, i) => (
                                  <Star key={i} size={12} className="fill-[#F5B700] text-[#F5B700]" />
                                ))}
                              </span>
                            )}
                          </span>
                          {hotel.propertyType && (
                            <span className="mt-1 inline-block w-fit rounded-[6px] bg-[var(--dh-chip)] px-2 py-0.5 text-[10.5px] font-black uppercase tracking-[0.05em] text-[var(--dh-muted)]">
                              {hotel.propertyType}
                            </span>
                          )}

                          {(hotel.area || hotel.distance) && (
                            <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--dh-muted)]">
                              <MapPin size={13} strokeWidth={2.2} className="shrink-0" />
                              <span className="truncate">
                                {[hotel.area, hotel.distanceKm != null ? `${hotel.distanceKm} km away` : hotel.distance]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </span>
                            </p>
                          )}

                          {Number(hotel.rating) > 0 && (
                            <p className="mt-2.5 flex items-center gap-2">
                              <span className="flex items-center gap-1 rounded-[6px] bg-emerald-600 px-1.5 py-0.5 text-[11.5px] font-black text-white">
                                <Star size={11} className="fill-white" /> {hotel.rating}
                              </span>
                              <span className="text-[12.5px] font-bold text-[var(--dh-text)]">{ratingWord(hotel.rating)}</span>
                              {hotel.reviews && (
                                <span className="text-[12px] font-semibold text-[var(--dh-muted)]">({hotel.reviews} reviews)</span>
                              )}
                            </p>
                          )}

                          {hotel.amenities?.length > 0 && (
                            <p className="mt-2.5 flex items-center gap-x-4 overflow-hidden">
                              {hotel.amenities.slice(0, 4).map((amenity) => (
                                <span key={amenity} className="flex shrink-0 items-center gap-1.5 text-[11.5px] font-semibold text-[var(--dh-muted)]">
                                  <Sparkles size={12} strokeWidth={2.2} /> {amenity}
                                </span>
                              ))}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end justify-center gap-1.5 border-l border-[var(--dh-border)] px-5 py-4">
                          {Number(hotel.oldPrice) > Number(hotel.price) && (
                            <span className="text-[13px] font-bold text-[var(--dh-muted)] line-through">{formatMoney(hotel.oldPrice)}</span>
                          )}
                          <span className="text-[24px] font-black leading-none tracking-[-0.03em] text-[var(--dh-text)]">
                            {formatMoney(hotel.price)}
                          </span>
                          <span className="text-[11.5px] font-semibold text-[var(--dh-muted)]">/ night + Taxes</span>
                          <button
                            onClick={() => openHotel(hotel)}
                            className="mt-2 w-full rounded-[10px] bg-[#F5B700] py-2.5 text-[13.5px] font-bold text-slate-950 transition-transform hover:-translate-y-0.5"
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
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-[13px] border border-[var(--dh-border)] bg-[var(--dh-surface)] py-3.5 text-[14.5px] font-bold text-[var(--dh-text)] hover:bg-[var(--dh-chip)]"
                  >
                    Load More Hotels <ChevronDown size={17} strokeWidth={2.6} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* --------------------------------------------------------- Right rail */}
          <aside className="sticky top-[100px] h-fit space-y-4">
            <div className="rounded-[18px] bg-[var(--dh-surface)] p-5 ring-1 ring-[var(--dh-border)]">
              <p className="text-[15px] font-black text-[var(--dh-text)]">Why book with Taxi09?</p>
              <div className="mt-4 space-y-3.5">
                {WHY_BOOK.map(({ icon: Icon, title, copy }) => (
                  <div key={title} className="flex gap-2.5">
                    <Icon size={19} className="mt-0.5 shrink-0 text-[#F5B700]" strokeWidth={2.1} />
                    <span>
                      <span className="block text-[12.5px] font-black text-[var(--dh-text)]">{title}</span>
                      <span className="mt-0.5 block text-[11.5px] font-semibold text-[var(--dh-muted)]">{copy}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {activeFilters > 0 && (
              <button
                onClick={clearAll}
                className="flex w-full items-center justify-center gap-2 rounded-[13px] border border-[var(--dh-border)] bg-[var(--dh-surface)] py-3 text-[13.5px] font-bold text-[var(--dh-text)]"
              >
                <X size={15} strokeWidth={2.8} /> Clear {activeFilters} filter{activeFilters === 1 ? '' : 's'}
              </button>
            )}
          </aside>
        </div>

        <div className="mt-6 grid grid-cols-5 gap-4 rounded-[16px] bg-[#FFFBEC] px-8 py-5">
          {[
            [Users, 'Trusted by', 'Thousands of travellers'],
            [Building2, `${hotels.length} Properties`, 'Across India'],
            [ShieldCheck, 'Safe & Secure', 'Secure payments'],
            [Headphones, '24/7 Support', "We're here to help"],
            [Ticket, 'Easy Booking', 'Quick & hassle free'],
          ].map(([Icon, title, copy]) => (
            <div key={title} className="flex items-center gap-3">
              <Icon size={24} className="shrink-0 text-[#F5B700]" strokeWidth={2} />
              <span>
                <span className="block text-[12.5px] font-black text-slate-900">{title}</span>
                <span className="mt-0.5 block text-[11px] font-semibold text-slate-600">{copy}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DesktopHotelList;
