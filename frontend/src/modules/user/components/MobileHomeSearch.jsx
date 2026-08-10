import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bike, Calendar, Car, MapPin, Star, UserCheck } from 'lucide-react';
import api from '../../../shared/api/axiosInstance';
import { openRentalVehicle, unwrapResults } from './desktop/desktopShared';

/**
 * The mobile home's search card and popular-cars strip.
 *
 * Both run on real data: the pickup suggestions are the branches the fleet
 * actually operates from, and the cars are the live rental catalogue with
 * their configured pricing. Nothing here is placeholder copy.
 */

const MODES = [
  { key: 'self-drive', label: 'Self Drive', icon: Car, path: '/taxi/user/rental', cta: 'Search Cars' },
  { key: 'with-driver', label: 'With Driver', icon: UserCheck, path: '/taxi/user/with-driver', cta: 'Search Rides' },
  { key: 'bike', label: 'Bike Rental', icon: Bike, path: '/taxi/user/rental/bike-categories', cta: 'Search Bikes' },
];

/** The configured price closest to a full day, so the strip can say "/day". */
const dailyRateOf = (vehicle) => {
  const rows = (Array.isArray(vehicle?.pricing) ? vehicle.pricing : [])
    .filter((row) => row?.active !== false && Number(row?.price) > 0);

  if (!rows.length) return null;

  const byCloseness = [...rows].sort(
    (a, b) => Math.abs(Number(a.durationHours || 0) - 24) - Math.abs(Number(b.durationHours || 0) - 24),
  );

  return Number(byCloseness[0].price);
};

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

/** "2026-08-20" -> "20 Aug, 2026". Empty reads as a prompt, not a skeleton. */
const formatDateLabel = (value) => {
  if (!value) return 'Date';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'Date';
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
};

/** "10:00" -> "10:00 AM". */
const formatTimeLabel = (value) => {
  if (!value) return 'Time';
  const [hours, minutes] = String(value).split(':');
  const parsed = new Date();
  parsed.setHours(Number(hours), Number(minutes), 0, 0);
  if (Number.isNaN(parsed.getTime())) return 'Time';
  return parsed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const MobileSearchCard = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('self-drive');
  const [stores, setStores] = useState([]);
  const [form, setForm] = useState({ pickup: '', pickupDate: '', pickupTime: '', returnDate: '', returnTime: '' });
  const [todayISO] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    let cancelled = false;
    api.get('/users/service-stores')
      .then((response) => {
        if (cancelled) return;
        const names = [...new Set(
          unwrapResults(response)
            .map((store) => String(store?.name || store?.store_name || '').trim())
            .filter(Boolean),
        )];
        setStores(names);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const active = MODES.find((item) => item.key === mode) || MODES[0];
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams({ search: 'true' });
    if (form.pickup) params.set('location', form.pickup);
    if (form.pickupDate) params.set('date', form.pickupDate);
    if (form.pickupTime) params.set('time', form.pickupTime);
    if (form.returnDate) params.set('returnDate', form.returnDate);
    if (form.returnTime) params.set('returnTime', form.returnTime);
    navigate(`${active.path}?${params.toString()}`);
  };


  return (
    <form onSubmit={submit} className="rounded-[20px] border border-slate-100 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <h2 className="text-[19px] font-black leading-tight tracking-[-0.04em] text-slate-950">Where are you going?</h2>
      <p className="mt-0.5 text-[12.5px] font-bold text-slate-600">Book Self Drive, Taxi or Bike in few taps</p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {MODES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            aria-pressed={mode === key}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-[12.5px] font-bold transition-colors ${
              mode === key
                ? 'border-transparent bg-[#F5B700] text-slate-950'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <Icon size={17} strokeWidth={2.3} />
            {label}
          </button>
        ))}
      </div>

      <datalist id="mobile-service-stores">
        {stores.map((name) => <option key={name} value={name} />)}
      </datalist>

      <label className="mt-2.5 flex items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2">
        <MapPin size={17} className="shrink-0 text-[#F5B700]" strokeWidth={2.4} />
        <span className="min-w-0 flex-1">
          <span className="block text-[11.5px] font-bold text-slate-700">Pickup Location</span>
          <input
            value={form.pickup}
            onChange={update('pickup')}
            list="mobile-service-stores"
            placeholder="Enter city or location"
            className="w-full bg-transparent text-[14.5px] font-bold text-slate-900 outline-none placeholder:font-bold placeholder:text-slate-600"
          />
        </span>
      </label>

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        {[
          { label: 'Pickup', dateKey: 'pickupDate', timeKey: 'pickupTime' },
          { label: 'Return', dateKey: 'returnDate', timeKey: 'returnTime' },
        ].map(({ label, dateKey, timeKey }) => (
          <div key={dateKey} className="rounded-xl border border-slate-200 px-2.5 py-1.5">
            <span className="flex items-center gap-1 text-[11.5px] font-bold text-slate-700">
              <Calendar size={13} className="shrink-0 text-[#F5B700]" strokeWidth={2.4} />
              {label}
            </span>

            {/* Date and time share one line - the field label already says
                "Date & Time", so stacking two more captions repeated it. Each
                native control is laid transparently over its own value, so a
                tap opens the real picker instead of the dd/mm/yyyy skeleton. */}
            <span className="mt-0.5 flex items-baseline gap-1 text-[12.5px] font-bold">
              <span className="relative">
                <span className={form[dateKey] ? 'text-slate-900' : 'text-slate-600'}>
                  {formatDateLabel(form[dateKey])}
                </span>
                <input
                  type="date"
                  aria-label={`${label} - date`}
                  // Return cannot precede pickup, and neither can be in the past.
                  min={dateKey === 'returnDate' ? (form.pickupDate || todayISO) : todayISO}
                  value={form[dateKey]}
                  onChange={update(dateKey)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </span>

              <span className="text-slate-400">&middot;</span>

              <span className="relative">
                <span className={form[timeKey] ? 'text-slate-900' : 'text-slate-600'}>
                  {formatTimeLabel(form[timeKey])}
                </span>
                <input
                  type="time"
                  aria-label={`${label} - time`}
                  value={form[timeKey]}
                  onChange={update(timeKey)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </span>
            </span>
          </div>
        ))}
      </div>

      <button
        type="submit"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5B700] py-3 text-[15px] font-black text-slate-950 active:scale-[0.99] transition-transform"
      >
        {active.cta}
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-white">
          <ArrowRight size={16} strokeWidth={2.6} />
        </span>
      </button>
    </form>
  );
};

export const MobilePopularCars = () => {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get('/users/rental-vehicles')
      .then((response) => {
        if (!cancelled) setCars(unwrapResults(response).filter((car) => car?.active !== false));
      })
      .catch(() => { if (!cancelled) setCars([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Dearest first, so the strip leads with the flagship vehicles.
  const popular = useMemo(
    () => [...cars]
      .map((car) => ({ ...car, rate: dailyRateOf(car) }))
      .sort((a, b) => (b.rate || 0) - (a.rate || 0))
      .slice(0, 8),
    [cars],
  );

  if (!loading && !popular.length) return null;

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-end justify-between px-1">
        <h2 className="text-[22px] font-black tracking-[-0.04em] text-slate-950">Popular Cars</h2>
        <button
          type="button"
          onClick={() => navigate('/taxi/user/rental')}
          className="flex items-center gap-1 text-[14px] font-bold text-[#4338ca]"
        >
          View All <ArrowRight size={15} strokeWidth={2.6} />
        </button>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading
          ? [0, 1, 2].map((key) => (
              <div key={key} className="h-[196px] w-[172px] shrink-0 animate-pulse rounded-2xl bg-slate-100" />
            ))
          : popular.map((car) => (
              <button
                key={car.id || car._id}
                type="button"
                onClick={() => openRentalVehicle(navigate, car)}
                className="flex w-[172px] shrink-0 snap-start flex-col rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-[0_6px_18px_rgba(15,23,42,0.05)]"
              >
                <span className="flex h-[86px] items-center justify-center">
                  <img
                    src={car.coverImage || car.image || '/taxi09_rental_self_drive.png'}
                    alt={car.name}
                    className="max-h-[86px] w-full object-contain"
                  />
                </span>
                <span className="mt-2 block min-h-[38px] text-[14.5px] font-black leading-tight text-slate-900">
                  {car.name}
                </span>
                <span className="mt-1 flex items-baseline gap-1">
                  {car.rate ? (
                    <>
                      <span className="text-[15.5px] font-black text-slate-950">{money(car.rate)}</span>
                      <span className="text-[12.5px] font-semibold text-slate-400">/day</span>
                    </>
                  ) : (
                    <span className="text-[13px] font-bold text-slate-500">Tap for pricing</span>
                  )}
                </span>
                {/* Seats and gearbox are on the record; a star rating is not, so
                    none is shown rather than inventing one. */}
                <span className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500">
                  <Star size={12} className="text-[#F5B700]" fill="#F5B700" strokeWidth={0} />
                  {car.capacity || 4} seats
                  {car.transmission ? ` · ${car.transmission}` : ''}
                </span>
              </button>
            ))}
      </div>
    </section>
  );
};
