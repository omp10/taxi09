import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BedDouble,
  Check,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  Coffee,
  Dumbbell,
  Lock,
  LogIn,
  MapPin,
  Maximize2,
  Minus,
  Moon,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Users,
  Waves,
  Wifi,
} from 'lucide-react';
import AppHeader from '../../components/AppHeader';
import api from '../../../../shared/api/axiosInstance';
import { payForBooking } from '../../utils/bookingCheckout';

const getRoutePrefix = (pathname = '') => (pathname.startsWith('/taxi/user') ? '/taxi/user' : '');

const rupees = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

/** Facilities are the hotel's own; only the icon is matched by label here. */
const FACILITY_ICONS = {
  'free wi-fi': Wifi,
  'swimming pool': Waves,
  breakfast: Coffee,
  'free breakfast': Coffee,
  spa: Sparkles,
  gym: Dumbbell,
};

const facilityIcon = (label) => FACILITY_ICONS[String(label).trim().toLowerCase()] || Sparkles;

const STEPS = ['Search', 'Select Room', 'Checkout', 'Payment'];

const ID_PROOFS = ['Aadhaar Card', 'PAN Card', 'Passport', 'Driving Licence', 'Voter ID'];

// Indian hotel GST is 12% on tariffs up to Rs7,500 a night and 18% above it.
const gstRateFor = (nightlyTariff) => (nightlyTariff > 7500 ? 0.18 : 0.12);

const NAME_PATTERN = /^[A-Za-z][A-Za-z .'-]*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOBILE_PATTERN = /^[6-9]\d{9}$/;

const fieldError = (field, raw) => {
  const value = String(raw ?? '').trim();
  if (field === 'name') {
    if (!value) return 'Full name is required';
    if (value.length < 2) return 'Enter at least 2 characters';
    if (!NAME_PATTERN.test(value)) return 'Letters, spaces and . - only';
    return '';
  }
  if (field === 'phone') {
    const digits = value.replace(/\D/g, '');
    if (!digits) return 'Mobile number is required';
    if (digits.length !== 10) return 'Enter 10 digits';
    if (!MOBILE_PATTERN.test(digits)) return 'Must start with 6-9';
    return '';
  }
  if (field === 'email') {
    if (!value) return 'Email is required';
    if (!EMAIL_PATTERN.test(value)) return 'Enter a valid email';
    return '';
  }
  if (field === 'idNumber') {
    if (!value) return 'ID number is required';
    if (value.length < 6) return 'Enter a valid ID number';
    return '';
  }
  return '';
};

const formatLongDate = (value) => {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatWeekday = (value) => {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-IN', { weekday: 'short' });
};

const nightsBetween = (checkIn, checkOut) => {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return Math.max(1, Math.round((end - start) / 86400000));
};

const Stepper = ({ current }) => (
  <div className="flex items-start justify-between px-2">
    {STEPS.map((label, index) => {
      const done = index < current;
      const active = index === current;
      return (
        <React.Fragment key={label}>
          <div className="flex w-[62px] shrink-0 flex-col items-center gap-1.5">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-extrabold ${
                done
                  ? 'bg-[var(--primary)] text-[var(--text)]'
                  : active
                    ? 'bg-[var(--primary)] text-[var(--text)] ring-4 ring-[var(--secondary)]'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {done ? <Check size={14} strokeWidth={3.2} /> : index + 1}
            </span>
            <span
              className={`text-center text-[9px] leading-tight ${
                done || active ? 'font-extrabold text-[var(--text)]' : 'font-semibold text-[var(--text-light)]'
              }`}
            >
              {label}
            </span>
          </div>
          {index < STEPS.length - 1 ? (
            <span className={`mt-3.5 h-[2px] flex-1 rounded-full ${index < current ? 'bg-[var(--primary)]' : 'bg-slate-200'}`} />
          ) : null}
        </React.Fragment>
      );
    })}
  </div>
);

const Field = ({ label, required, error, children }) => (
  <label className="block">
    <span className="text-[10px] font-bold text-[var(--text-light)]">
      {label} {required ? <span className="text-[var(--danger)]">*</span> : null}
    </span>
    <div className="mt-1">{children}</div>
    {error ? <p className="mt-1 text-[9.5px] font-semibold text-[var(--danger)]">{error}</p> : null}
  </label>
);

const inputClass = (hasError) =>
  `w-full rounded-[10px] border bg-white px-3 py-2.5 text-[12.5px] font-semibold outline-none placeholder:font-medium placeholder:text-slate-300 ${
    hasError ? 'border-[var(--danger)]' : 'border-[var(--border)] focus:border-[var(--primary)]'
  }`;

const HotelCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routePrefix = useMemo(() => getRoutePrefix(location.pathname), [location.pathname]);
  const state = location.state || {};
  const { hotel, room, checkIn, checkOut, rooms: roomCount = 1, guests = 2 } = state;

  const [guest, setGuest] = useState({ name: '', phone: '', email: '', idType: ID_PROOFS[0], idNumber: '' });
  const [touched, setTouched] = useState({});
  const [breakfastQty, setBreakfastQty] = useState(0);
  const [airportPickup, setAirportPickup] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [paying, setPaying] = useState(false);

  const nights = nightsBetween(checkIn, checkOut);

  const selectedAddOns = useMemo(
    () => [breakfastQty > 0 ? 'breakfast' : null, airportPickup ? 'pickup' : null].filter(Boolean),
    [breakfastQty, airportPickup],
  );

  // Same quote endpoint the desktop checkout calls.
  useEffect(() => {
    if (!hotel?.slug) return undefined;
    let cancelled = false;
    api
      .post('/users/hotels/quote', {
        slug: hotel.slug,
        roomKey: room?.key,
        checkIn,
        checkOut,
        rooms: roomCount,
        guests: guests,
        addOns: selectedAddOns,
      })
      .then((response) => {
        if (cancelled) return;
        setQuote(response?.data?.data ?? response?.data ?? null);
        setQuoteError('');
      })
      .catch((error) => {
        if (cancelled) return;
        setQuote(null);
        setQuoteError(error?.response?.data?.message || 'Could not price this stay');
      });
    return () => { cancelled = true; };
  }, [hotel?.slug, room?.key, checkIn, checkOut, roomCount, guests, selectedAddOns]);

  const errors = {
    name: fieldError('name', guest.name),
    phone: fieldError('phone', guest.phone),
    email: fieldError('email', guest.email),
    idNumber: fieldError('idNumber', guest.idNumber),
  };
  const showError = (field) => (touched[field] ? errors[field] : '');

  if (!hotel || !room) {
    navigate(`${routePrefix}/hotel`, { replace: true });
    return null;
  }

  const update = (patch) => setGuest((current) => ({ ...current, ...patch }));
  const markTouched = (field) => setTouched((current) => ({ ...current, [field]: true }));

  // Every figure below comes from the server quote - the same endpoint the
  // desktop checkout uses - so the two can never disagree.
  const roomCharges = quote?.roomCharges ?? 0;
  const taxes = quote?.taxes ?? 0;
  const memberDiscount = quote?.memberDiscount ?? 0;
  const total = quote?.totalAmount ?? 0;
  const breakfastTotal = quote?.addOns?.find((a) => a.id === 'breakfast')?.price ?? 0;
  const pickupTotal = quote?.addOns?.find((a) => a.id === 'pickup')?.price ?? 0;

  const handlePay = async () => {
    setTouched({ name: true, phone: true, email: true, idNumber: true });
    const firstError = Object.values(errors).find(Boolean);
    if (firstError) {
      toast.error('Check the highlighted guest details');
      return;
    }
    if (!quote) {
      toast.error(quoteError || 'Still pricing this stay, try again in a moment');
      return;
    }

    setPaying(true);
    try {
      // Create the booking first so the server owns the amount, then pay it.
      const response = await api.post('/users/hotel-bookings', {
        slug: hotel.slug,
        roomKey: room?.key,
        checkIn,
        checkOut,
        rooms: roomCount,
        guests: guests,
        addOns: selectedAddOns,
        guestName: guest.name,
        guestPhone: guest.phone,
      });
      const created = response?.data?.data ?? response?.data;

      const paid = await payForBooking({
        kind: 'hotel',
        bookingId: created._id,
        name: hotel.name,
        description: `${created.roomName} · ${created.nights} night(s)`,
        prefill: { name: guest.name, contact: guest.phone, email: guest.email },
      });

      if (!paid) {
        toast('Payment cancelled - your booking is saved in My Bookings');
        return;
      }
      toast.success(`Booking confirmed · ${paid.bookingReference}`);
      navigate(`${routePrefix}/activity`);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Could not complete this booking');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-[var(--background)] pb-32 text-[var(--text)]">
      <AppHeader showBack subtitle="CHECKOUT" />

      <div className="flex items-center justify-center gap-1.5 bg-[var(--secondary)] py-1.5">
        <Lock size={11} className="text-[var(--primary-dark)]" />
        <span className="text-[10px] font-extrabold text-[var(--primary-dark)]">Secure Booking</span>
      </div>

      <div className="space-y-3 px-3 pt-3">
        <section className="rounded-[16px] border border-[var(--border)] bg-white py-3.5 shadow-[var(--shadow-sm)]">
          <Stepper current={2} />
        </section>

        {/* Hotel summary */}
        <section className="rounded-[16px] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-sm)]">
          <div className="flex gap-3">
            <img
              src={hotel.image}
              alt={hotel.name}
              className="h-[86px] w-[94px] shrink-0 rounded-[12px] object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="min-w-0 text-[14px] font-extrabold leading-tight">{hotel.name}</h2>
                <span className="flex shrink-0 items-center gap-1 rounded-[8px] bg-[var(--secondary)] px-1.5 py-1 text-[10.5px] font-extrabold">
                  {hotel.rating}
                  <Star size={10} className="fill-[var(--primary)] text-[var(--primary)]" />
                </span>
              </div>
              <p className="mt-1 flex items-start gap-1 text-[10px] font-medium leading-[1.35] text-[var(--text-light)]">
                <MapPin size={10} className="mt-[1px] shrink-0" />
                <span>
                  {hotel.area} <span className="text-slate-300">•</span> {hotel.distance}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-3 flex justify-between gap-1 border-t border-[var(--border)] pt-3">
            {(hotel?.facilities || []).filter(Boolean).map((label) => {
              const Icon = facilityIcon(label);
              return (
              <span key={label} className="flex min-w-0 flex-col items-center gap-1 text-center">
                <Icon size={15} className="text-[var(--primary-dark)]" />
                <span className="text-[8px] font-semibold leading-tight text-[var(--text-light)]">{label}</span>
              </span>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-y-3 rounded-[12px] bg-[var(--secondary)] p-3">
            {[
              { label: 'Check-in', value: formatLongDate(checkIn), sub: `${formatWeekday(checkIn)}, 2:00 PM` },
              { label: 'Check-out', value: formatLongDate(checkOut), sub: `${formatWeekday(checkOut)}, 11:00 AM` },
              { label: 'Duration', value: `${nights} Night${nights > 1 ? 's' : ''}`, sub: `${roomCount} Room${roomCount > 1 ? 's' : ''}`, icon: Moon },
              { label: 'Guests', value: `${guests} Guest${guests > 1 ? 's' : ''}`, sub: `${room.adults} Adults + ${room.children} Child`, icon: Users },
            ].map(({ label, value, sub, icon: Icon }) => (
              <div key={label} className="min-w-0">
                <p className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-[var(--text-light)]">{label}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11.5px] font-extrabold">
                  {Icon ? <Icon size={11} className="shrink-0 text-[var(--primary-dark)]" /> : null}
                  <span className="truncate">{value}</span>
                </p>
                <p className="text-[9px] font-medium text-[var(--text-light)]">{sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Selected room */}
        <section className="rounded-[16px] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between">
            <h3 className="text-[13.5px] font-extrabold">Selected Room</h3>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-[11px] font-bold text-[var(--primary-dark)]"
            >
              <Pencil size={11} /> Edit
            </button>
          </div>

          <div className="mt-2.5 flex gap-3">
            <img src={room.image} alt={room.name} className="h-[74px] w-[84px] shrink-0 rounded-[11px] object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 text-[12.5px] font-extrabold leading-tight">{room.name}</p>
                <div className="shrink-0 text-right">
                  <p className="text-[16px] font-extrabold leading-none">{rupees(room.price)}</p>
                  <p className="text-[8.5px] font-medium text-[var(--text-light)]">/ night</p>
                </div>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1 text-[9px] font-semibold text-[var(--text-light)]">
                <span className="flex items-center gap-1">
                  <Maximize2 size={9} className="text-[var(--primary-dark)]" /> {room.sqft} sq.ft.
                </span>
                <span className="flex items-center gap-1">
                  <BedDouble size={9} className="text-[var(--primary-dark)]" /> {room.bed}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={9} className="text-[var(--primary-dark)]" /> {room.adults} Adults + {room.children} Child
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {room.perks.map((perk) => (
                  <span
                    key={perk}
                    className="flex items-center gap-1 rounded-[6px] bg-emerald-50 px-1.5 py-0.5 text-[8.5px] font-semibold text-[var(--success)]"
                  >
                    <CircleCheck size={9} /> {perk}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Guest details */}
        <section className="rounded-[16px] border border-[var(--border)] bg-white p-3.5 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between">
            <h3 className="text-[13.5px] font-extrabold">Guest Details</h3>
            <button
              type="button"
              onClick={() => {
                try {
                  const stored = JSON.parse(localStorage.getItem('userInfo') || '{}');
                  update({
                    name: stored.name || '',
                    phone: String(stored.phone || '').replace(/\D/g, '').slice(-10),
                    email: stored.email || '',
                  });
                  setTouched({ name: true, phone: true, email: true });
                  toast.success('Filled from your profile');
                } catch {
                  toast.error('No saved profile found');
                }
              }}
              className="flex items-center gap-1 text-[11px] font-bold text-[var(--primary-dark)]"
            >
              <LogIn size={11} /> Autofill
            </button>
          </div>

          <div className="mt-2.5 space-y-2.5">
            <Field label="Full Name (as per ID)" required error={showError('name')}>
              <input
                type="text"
                value={guest.name}
                onChange={(event) => update({ name: event.target.value })}
                onBlur={() => markTouched('name')}
                placeholder="Enter full name"
                className={inputClass(showError('name'))}
              />
            </Field>

            <Field label="Mobile Number" required error={showError('phone')}>
              <div
                className={`flex items-center rounded-[10px] border bg-white ${
                  showError('phone') ? 'border-[var(--danger)]' : 'border-[var(--border)] focus-within:border-[var(--primary)]'
                }`}
              >
                <span className="shrink-0 border-r border-[var(--border)] px-2.5 py-2.5 text-[12px] font-bold text-[var(--text-light)]">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={guest.phone}
                  onChange={(event) => update({ phone: event.target.value.replace(/\D/g, '').slice(0, 10) })}
                  onBlur={() => markTouched('phone')}
                  placeholder="Enter mobile number"
                  className="w-full min-w-0 bg-transparent px-2.5 py-2.5 text-[12.5px] font-semibold outline-none placeholder:font-medium placeholder:text-slate-300"
                />
              </div>
            </Field>

            <Field label="Email Address" required error={showError('email')}>
              <input
                type="email"
                value={guest.email}
                onChange={(event) => update({ email: event.target.value })}
                onBlur={() => markTouched('email')}
                placeholder="Enter email address"
                className={inputClass(showError('email'))}
              />
            </Field>

            <div className="grid grid-cols-[132px_1fr] gap-2">
              <Field label="ID Proof" required>
                <div className="relative">
                  <select
                    value={guest.idType}
                    onChange={(event) => update({ idType: event.target.value })}
                    className="w-full appearance-none rounded-[10px] border border-[var(--border)] bg-white px-3 py-2.5 pr-7 text-[12px] font-semibold outline-none focus:border-[var(--primary)]"
                  >
                    {ID_PROOFS.map((proof) => (
                      <option key={proof}>{proof}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-light)]" />
                </div>
              </Field>
              <Field label="ID Number" required error={showError('idNumber')}>
                <input
                  type="text"
                  value={guest.idNumber}
                  onChange={(event) => update({ idNumber: event.target.value.toUpperCase() })}
                  onBlur={() => markTouched('idNumber')}
                  placeholder="Enter ID number"
                  className={inputClass(showError('idNumber'))}
                />
              </Field>
            </div>
          </div>
        </section>

        {/* Add-ons */}
        <section className="rounded-[16px] border border-[var(--border)] bg-white p-3.5 shadow-[var(--shadow-sm)]">
          <h3 className="text-[13.5px] font-extrabold">
            Add-ons <span className="text-[11px] font-medium text-[var(--text-light)]">(Optional)</span>
          </h3>

          <div className="mt-2.5 space-y-2">
            <div className="flex items-center gap-2.5 rounded-[12px] border border-[var(--border)] px-3 py-2.5">
              <Coffee size={17} className="shrink-0 text-[var(--primary-dark)]" />
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-extrabold leading-tight">Extra Breakfast</span>
                <span className="block text-[9.5px] font-medium text-[var(--text-light)]">
                  ₹350 per person per day
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  disabled={breakfastQty <= 0}
                  onClick={() => setBreakfastQty((q) => Math.max(0, q - 1))}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] disabled:opacity-30"
                >
                  <Minus size={12} strokeWidth={3} />
                </button>
                <span className="w-4 text-center text-[12.5px] font-extrabold">{breakfastQty}</span>
                <button
                  type="button"
                  disabled={breakfastQty >= 10}
                  onClick={() => setBreakfastQty((q) => Math.min(10, q + 1))}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--primary)] bg-[var(--secondary)] text-[var(--primary-dark)] disabled:opacity-30"
                >
                  <Plus size={12} strokeWidth={3} />
                </button>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setAirportPickup((current) => !current)}
              className={`flex w-full items-center gap-2.5 rounded-[12px] border px-3 py-2.5 text-left transition-colors ${
                airportPickup ? 'border-[var(--primary)] bg-[var(--secondary)]' : 'border-[var(--border)]'
              }`}
            >
              <Sparkles size={17} className="shrink-0 text-[var(--primary-dark)]" />
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-extrabold leading-tight">Airport Pickup</span>
                <span className="block text-[9.5px] font-medium text-[var(--text-light)]">Sedan • Max 3 Persons</span>
              </span>
              <span className="shrink-0 text-[12px] font-extrabold">₹799</span>
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-2 ${
                  airportPickup ? 'border-[var(--primary-dark)] bg-[var(--primary)]' : 'border-[var(--border)]'
                }`}
              >
                {airportPickup ? <Check size={10} strokeWidth={3.5} /> : null}
              </span>
            </button>
          </div>
        </section>


        {/* Price summary */}
        <section className="rounded-[16px] border border-[var(--border)] bg-white p-3.5 shadow-[var(--shadow-sm)]">
          <button
            type="button"
            onClick={() => setSummaryOpen((current) => !current)}
            className="flex w-full items-center justify-between"
          >
            <h3 className="text-[13.5px] font-extrabold">Price Summary</h3>
            <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--text-light)]">
              {summaryOpen ? 'Hide' : 'Show'}
              {summaryOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </span>
          </button>

          {summaryOpen ? (
            <div className="mt-2.5 space-y-1.5 text-[11.5px] font-semibold">
              <div className="flex justify-between">
                <span className="text-[var(--text-light)]">
                  Room Charges ({nights} Night{nights > 1 ? 's' : ''}
                  {roomCount > 1 ? ` × ${roomCount}` : ''})
                </span>
                <span>{rupees(roomCharges)}</span>
              </div>
              {breakfastTotal > 0 ? (
                <div className="flex justify-between">
                  <span className="text-[var(--text-light)]">Extra Breakfast × {breakfastQty}</span>
                  <span>{rupees(breakfastTotal)}</span>
                </div>
              ) : null}
              {pickupTotal > 0 ? (
                <div className="flex justify-between">
                  <span className="text-[var(--text-light)]">Airport Pickup</span>
                  <span>{rupees(pickupTotal)}</span>
                </div>
              ) : null}
              {memberDiscount > 0 ? (
                <div className="flex justify-between">
                  <span className="text-[var(--text-light)]">
                    Member discount ({quote?.memberDiscountPercent}%)
                  </span>
                  <span className="text-[var(--success)]">-{rupees(memberDiscount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-[var(--text-light)]">
                  Taxes &amp; Fees ({Math.round(gstRateFor(room.price) * 100)}% GST)
                </span>
                <span>{rupees(taxes)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--border)] pt-2">
                <span className="text-[13px] font-extrabold">Total Amount</span>
                <span className="text-[18px] font-extrabold">{rupees(total)}</span>
              </div>
              <p className="text-[9px] font-medium text-[var(--text-light)]">Inclusive of all taxes</p>
            </div>
          ) : null}
        </section>
      </div>

      {/* Sticky pay bar */}
      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-lg -translate-x-1/2 border-t border-[var(--border)] bg-white px-4 pb-6 pt-3">
        <div className="mb-2.5 flex items-end justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-light)]">Total Amount</p>
            <p className="text-[19px] font-extrabold leading-tight">{rupees(total)}</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-[var(--success)]">
            <Lock size={10} /> Secure
          </span>
        </div>
        <button
          type="button"
          onClick={handlePay}
          disabled={paying || !quote}
          className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(180deg,#FFD54F,#FFC107)] py-3.5 text-[15px] font-extrabold shadow-[0_8px_20px_rgba(255,193,7,.4)] active:scale-[0.99] transition-transform"
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

export default HotelCheckout;
