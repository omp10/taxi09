import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BannerHero from '../../components/BannerHero';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Fuel,
  Gauge,
  HeartHandshake,
  Infinity as InfinityIcon,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react';
import { DesktopNav } from '../../components/desktop/DesktopChrome';
import { openRentalVehicle, unwrapResults, useDesktopTheme } from '../../components/desktop/desktopShared';
import { userService } from '../../services/userService';
import api from '../../../../shared/api/axiosInstance';

/**
 * Bike rental - the desktop page.
 *
 * The bike list, the category tabs and every price come from the same rental
 * catalogue and quote endpoints the car flow uses, so a bike added in the admin
 * panel appears here with no further work.
 */

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const HERO_POINTS = [
  { icon: BadgeCheck, label: 'Well Maintained Bikes' },
  { icon: HeartHandshake, label: '24/7 Roadside Assistance' },
  { icon: Wallet, label: 'No Hidden Charges' },
  { icon: CalendarDays, label: 'Flexible Bookings' },
];

const PLAN_POINTS = [
  { icon: InfinityIcon, title: 'Unlimited Kilometers', sub: 'Ride as much as you want' },
  { icon: ShieldCheck, title: 'Free Helmet', sub: 'Safety comes first' },
  { icon: Fuel, title: 'Fuel Policy', sub: 'Full to full' },
  { icon: BadgeCheck, title: 'Verified Bikes', sub: 'Quality checked' },
];

const FOOTER_POINTS = [
  ['Easy Booking', 'Book in just 2 minutes'],
  ['No Hidden Charges', 'Transparent pricing'],
  ['24/7 Support', 'We are always here'],
  ['Roadside Assistance', 'Anytime, anywhere'],
  ['Sanitized Bikes', 'Cleaned & sanitized'],
  ['Flexible Plans', 'Hourly, Daily & Weekly'],
];

/** The catalogue is inconsistent about capitalisation, so compare folded. */
const isBike = (vehicle) => String(vehicle?.vehicleCategory || '').toLowerCase() === 'bike';

const toLocalInput = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const BikeCard = ({ bike, selected, onSelect }) => {
  const price = (bike.pricing || [])[0];

  return (
    <button
      onClick={() => onSelect(bike)}
      className={`w-full overflow-hidden rounded-2xl border bg-white text-left transition-shadow hover:shadow-md ${
        selected ? 'border-[#F5B700] ring-2 ring-[#F5B700]/30' : 'border-slate-200'
      } ${bike.available === false ? 'opacity-60' : ''}`}
    >
      <div className="relative aspect-[4/3] bg-slate-50">
        {bike.image ? (
          <img src={bike.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-contain p-3" />
        ) : null}
        {bike.rating ? (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-[#F5B700] px-1.5 py-0.5 text-[13px] font-black text-slate-900">
            {bike.rating} <Star size={10} fill="currentColor" />
          </span>
        ) : null}
        {bike.available === false ? (
          <span className="absolute left-2 top-2 rounded-lg bg-slate-900/85 px-2 py-1 text-[12.5px] font-bold text-white">
            Booked
          </span>
        ) : null}
      </div>

      <div className="p-3.5">
        <p className="truncate text-[15.5px] font-black text-slate-900">{bike.name}</p>
        <p className="text-[13.5px] text-slate-500">
          {[bike.engineCapacity && `${bike.engineCapacity}cc`, bike.subcategoryName || bike.vehicleCategory]
            .filter(Boolean)
            .join(' • ')}
        </p>

        <div className="mt-2.5 flex items-end justify-between">
          <span>
            <span className="text-[16.5px] font-black text-slate-900">{money(price?.price)}</span>
            <span className="text-[13px] text-slate-500"> / {price?.label || 'package'}</span>
          </span>
          {price?.extraKmPrice > 0 ? (
            <span className="text-[13px] text-slate-500">₹{price.extraKmPrice} / km</span>
          ) : null}
        </div>

        {bike.storeName ? (
          <p className="mt-1.5 flex items-center gap-1 text-[13px] text-slate-500">
            <MapPin size={11} /> {bike.storeName}
          </p>
        ) : null}
      </div>
    </button>
  );
};

const DesktopBikeRental = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useDesktopTheme();

  const [bikes, setBikes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(null);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  const [location, setLocation] = useState('');
  const [pickup, setPickup] = useState(() => toLocalInput(new Date(Date.now() + 3600000)));
  const [dropoff, setDropoff] = useState(() => toLocalInput(new Date(Date.now() + 3 * 86400000)));

  useEffect(() => {
    userService
      .getRentalVehicleSubcategories()
      .then((response) => {
        const rows = unwrapResults(response);
        setCategories(rows.filter((row) => String(row.vehicleCategory || '').toLowerCase() === 'bike'));
      })
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (location.trim()) params.set('location', location.trim());
    if (pickup) params.set('pickup', new Date(pickup).toISOString());
    if (dropoff) params.set('return', new Date(dropoff).toISOString());
    const query = params.toString();

    setLoading(true);
    api
      .get(`/users/rental-vehicles${query ? `?${query}` : ''}`)
      .then((response) => {
        const rows = unwrapResults(response).filter(isBike);
        setBikes(rows);
        setSelected((current) => rows.find((r) => r._id === current?._id) || rows[0] || null);
      })
      .catch((error) => toast.error(error.message || 'Could not load bikes'))
      .finally(() => setLoading(false));
  }, [location, pickup, dropoff]);

  // Debounced so typing a location does not fire a request per keystroke, and
  // so the loading flag is not set synchronously inside the effect.
  useEffect(() => {
    const handle = setTimeout(load, 250);
    return () => clearTimeout(handle);
  }, [load]);

  /* The rail price is the server's, not a figure computed here. The quote is
     tagged with the bike it belongs to, so a stale reply for a bike the user
     has already moved on from is ignored rather than shown against the new one. */
  useEffect(() => {
    const packageId = (selected?.pricing || [])[0]?.id;
    if (!selected?._id || !packageId) return undefined;

    let cancelled = false;
    const vehicleId = selected._id;

    api
      .post('/users/rental-bookings/quote', { vehicleTypeId: vehicleId, packageId })
      .then((response) => {
        if (!cancelled) setQuote({ vehicleId, ...(response?.data || {}) });
      })
      .catch(() => {
        if (!cancelled) setQuote({ vehicleId });
      });

    return () => { cancelled = true; };
  }, [selected]);

  const activeQuote = quote?.vehicleId === selected?._id && quote?.totalCost !== undefined ? quote : null;

  const visible = useMemo(
    () =>
      category === 'All'
        ? bikes
        : bikes.filter((bike) => (bike.subcategoryName || bike.subcategory) === category),
    [bikes, category],
  );

  const days = useMemo(() => {
    const ms = new Date(dropoff) - new Date(pickup);
    return ms > 0 ? Math.max(1, Math.ceil(ms / 86400000)) : 1;
  }, [pickup, dropoff]);

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath="/taxi/user/rental/bike-categories" theme={theme} onToggleTheme={toggleTheme} />

      <div className="mx-auto max-w-[1728px] px-4 pb-16 pt-5 xl:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            {/* Hero is admin artwork - Homepage Banners > Bike Rental. */}
            <BannerHero type="bike_rental" rounded="rounded-2xl" />

            <section className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-white p-6">
              {/* Search */}
              <div className="mt-6 grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-[1.3fr_1fr_1fr_auto]">
                <label className="block">
                  <span className="mb-1 block text-[13px] font-bold text-slate-500">Pick-up Location</span>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Any location"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14.5px] outline-none focus:border-[#F5B700]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[13px] font-bold text-slate-500">Pick-up</span>
                  <input
                    type="datetime-local"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14.5px] outline-none focus:border-[#F5B700]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[13px] font-bold text-slate-500">Return</span>
                  <input
                    type="datetime-local"
                    value={dropoff}
                    min={pickup}
                    onChange={(e) => setDropoff(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14.5px] outline-none focus:border-[#F5B700]"
                  />
                </label>
                <button
                  onClick={load}
                  className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-[#F5B700] px-6 py-2.5 text-[15px] font-black text-slate-900"
                >
                  <Search size={15} /> Search Bikes
                </button>
              </div>
            </section>

            {/* Category tabs, from the admin's own subcategories */}
            {categories.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {['All', ...categories.map((c) => c.name)].map((name) => {
                  const count =
                    name === 'All'
                      ? bikes.length
                      : bikes.filter((b) => (b.subcategoryName || b.subcategory) === name).length;

                  return (
                    <button
                      key={name}
                      onClick={() => setCategory(name)}
                      className={`rounded-xl border px-4 py-2.5 text-left transition-colors ${
                        category === name ? 'border-[#F5B700] bg-[#FFF9E6]' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="block text-[14.5px] font-black text-slate-900">{name}</span>
                      <span className="block text-[13px] text-slate-500">{count} {count === 1 ? 'bike' : 'bikes'}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            <h2 className="mt-7 text-[19px] font-black text-slate-900">Popular Bikes for You</h2>

            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" /></div>
            ) : visible.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-slate-200 py-16 text-center text-[15px] text-slate-500">
                No bikes available for these dates. Try another window or location.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((bike) => (
                  <BikeCard key={bike._id} bike={bike} selected={selected?._id === bike._id} onSelect={setSelected} />
                ))}
              </div>
            )}

            <div className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-[#FFFCF2] p-5 md:grid-cols-3 lg:grid-cols-6">
              {FOOTER_POINTS.map(([title, sub]) => (
                <div key={title}>
                  <p className="text-[14px] font-black text-slate-900">{title}</p>
                  <p className="text-[13px] text-slate-500">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rental plan */}
          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[16.5px] font-black text-slate-900">Your Rental Plan</h2>
                {selected ? (
                  <button onClick={() => setSelected(null)} className="text-[13.5px] font-bold text-[#C79100]">
                    Change Bike
                  </button>
                ) : null}
              </div>

              {!selected ? (
                <p className="mt-4 text-[14px] text-slate-500">Pick a bike to see the price.</p>
              ) : (
                <>
                  <div className="mt-4 flex items-center gap-3">
                    {selected.image ? (
                      <img src={selected.image} alt="" className="h-12 w-16 object-contain" />
                    ) : null}
                    <span>
                      <span className="block text-[15px] font-black text-slate-900">{selected.name}</span>
                      <span className="block text-[13.5px] text-slate-500">
                        {selected.subcategoryName || selected.vehicleCategory}
                      </span>
                    </span>
                  </div>

                  <dl className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-[14px]">
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Pick-up</dt>
                      <dd className="font-semibold text-slate-800">
                        {new Date(pickup).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Return</dt>
                      <dd className="font-semibold text-slate-800">
                        {new Date(dropoff).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Duration</dt>
                      <dd className="font-semibold text-slate-800">{days} {days === 1 ? 'Day' : 'Days'}</dd>
                    </div>
                  </dl>

                  {activeQuote ? (
                    <dl className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-[14px]">
                      <div className="flex justify-between">
                        <dt className="text-slate-500">{activeQuote.packageLabel || 'Rental charge'}</dt>
                        <dd className="font-semibold text-slate-800">{money(activeQuote.packagePrice)}</dd>
                      </div>
                      {activeQuote.addOnsTotal > 0 ? (
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Add-ons</dt>
                          <dd className="font-semibold text-slate-800">{money(activeQuote.addOnsTotal)}</dd>
                        </div>
                      ) : null}
                      {activeQuote.memberDiscount > 0 ? (
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Member discount ({activeQuote.memberDiscountPercent}%)</dt>
                          <dd className="font-semibold text-emerald-600">− {money(activeQuote.memberDiscount)}</dd>
                        </div>
                      ) : null}

                      <div className="flex justify-between border-t border-dashed border-slate-200 pt-2">
                        <dt className="text-[15.5px] font-black text-slate-900">Total Amount</dt>
                        <dd className="text-[17px] font-black text-slate-900">{money(activeQuote.totalCost)}</dd>
                      </div>
                      {activeQuote.payableNow > 0 && activeQuote.payableNow < activeQuote.totalCost ? (
                        <p className="text-[13px] text-slate-500">
                          {money(activeQuote.payableNow)} payable now, {money(activeQuote.balanceDue)} at pick-up
                        </p>
                      ) : null}
                    </dl>
                  ) : (
                    <p className="mt-3 border-t border-slate-100 pt-3 text-[13.5px] text-slate-500">
                      Pricing for this bike is not set up yet.
                    </p>
                  )}

                  <button
                    onClick={() => openRentalVehicle(navigate, selected)}
                    disabled={selected.available === false}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5B700] py-3 text-[15.5px] font-black text-slate-900 disabled:opacity-60"
                  >
                    {selected.available === false ? 'Booked for these dates' : 'Continue to Book'}
                    <ArrowRight size={16} />
                  </button>

                  <p className="mt-2 flex items-center justify-center gap-1.5 text-[13px] text-slate-500">
                    <ShieldCheck size={12} className="text-emerald-600" /> Free cancellation up to 24 hrs before pick-up
                  </p>
                </>
              )}
            </section>

            <div className="grid grid-cols-2 gap-3">
              {PLAN_POINTS.map((point) => (
                <div key={point.title} className="rounded-2xl border border-slate-100 bg-white p-3.5">
                  <point.icon size={17} className="text-[#C79100]" />
                  <p className="mt-1.5 text-[14px] font-black text-slate-900">{point.title}</p>
                  <p className="text-[13px] text-slate-500">{point.sub}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-[#FFD400] to-[#F5B700] p-5">
              <p className="flex items-center gap-2 text-[16.5px] font-black text-slate-900">
                <Sparkles size={16} /> Ride more, pay less
              </p>
              <p className="mt-1 text-[13.5px] text-slate-800">
                Members save on every booking, bikes included.
              </p>
              <button
                onClick={() => navigate('/taxi/user/membership')}
                className="mt-3 flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-[14px] font-black text-white"
              >
                <Gauge size={14} /> See membership
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default DesktopBikeRental;
