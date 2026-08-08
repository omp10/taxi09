import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BedDouble,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Star,
  UserRound,
  Utensils,
} from 'lucide-react';
import userBusService from '../../services/busService';
import { userAuthService } from '../../services/authService';
import AppHeader from '../../components/AppHeader';
import { buildBusRouteState, toPlainData } from './busNavigationState';

const getRoutePrefix = (pathname = '') => (pathname.startsWith('/taxi/user') ? '/taxi/user' : '');

// Ids and prices must match BUS_ADD_ON_CATALOG on the server, which is the
// authority on pricing - these values are display only.
// Extras come from the bus service itself. Only the icon stays here, since an
// admin sets a label and a price, not a React component.
const ADD_ON_ICONS = { insurance: ShieldCheck, meal_veg: Utensils };

const GENDERS = ['Male', 'Female', 'Other'];

const NAME_PATTERN = /^[A-Za-z][A-Za-z .'-]*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

/**
 * Per-field rules. Phone/email are only mandatory for the lead passenger, who
 * is the booking contact - but if anyone else fills them they must still be valid.
 */
const getFieldError = (field, rawValue, { isLead }) => {
  const value = String(rawValue ?? '').trim();

  if (field === 'name') {
    if (!value) return 'Full name is required';
    if (value.length < 2) return 'Enter at least 2 characters';
    if (value.length > 60) return 'Name is too long';
    if (!NAME_PATTERN.test(value)) return 'Letters, spaces and . - only';
    return '';
  }

  if (field === 'age') {
    if (!value) return 'Age is required';
    if (!/^\d{1,3}$/.test(value)) return 'Digits only';
    const age = Number(value);
    if (age < 1 || age > 120) return 'Enter 1-120';
    return '';
  }

  if (field === 'phone') {
    const digits = value.replace(/\D/g, '');
    if (!digits) return isLead ? 'Mobile number is required' : '';
    if (digits.length !== 10) return 'Enter 10 digits';
    if (!INDIAN_MOBILE_PATTERN.test(digits)) return 'Must start with 6-9';
    return '';
  }

  if (field === 'email') {
    if (!value) return isLead ? 'Email is required' : '';
    if (!EMAIL_PATTERN.test(value)) return 'Enter a valid email';
    return '';
  }

  return '';
};

const FieldError = ({ message }) =>
  message ? <p className="mt-1 text-[9.5px] font-semibold text-[var(--danger)]">{message}</p> : null;

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Field = ({ label, required, children }) => (
  <label className="block">
    <span className="text-[10px] font-bold text-[var(--text-light)]">
      {label} {required ? <span className="text-[var(--danger)]">*</span> : null}
    </span>
    <div className="mt-1">{children}</div>
  </label>
);

const inputClass = (hasError) =>
  `w-full rounded-[10px] border bg-white px-3 py-2.5 text-[12.5px] font-semibold text-[var(--text)] outline-none placeholder:font-medium placeholder:text-slate-300 ${
    hasError ? 'border-[var(--danger)] focus:border-[var(--danger)]' : 'border-[var(--border)] focus:border-[var(--primary)]'
  }`;

const BusDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routePrefix = useMemo(() => getRoutePrefix(location.pathname), [location.pathname]);
  const state = location.state || {};
  const { bus, fromCity, toCity, date, selectedSeats, totalFare } = state;

  const [passengers, setPassengers] = useState(() =>
    (selectedSeats || []).map((seat) => ({
      seatId: seat.id,
      seatLabel: seat.label || seat.id,
      name: '',
      age: '',
      gender: 'Male',
      phone: '',
      email: '',
    })),
  );
  const [touched, setTouched] = useState(() => (selectedSeats || []).map(() => ({})));
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [error, setError] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  const unwrapPayload = (response) => response?.data?.data || response?.data || response || {};

  useEffect(() => {
    let active = true;

    const storedProfile = (() => {
      try {
        return JSON.parse(localStorage.getItem('userInfo') || '{}');
      } catch {
        return {};
      }
    })();

    const applyProfile = (profile = {}) => {
      if (!active) return;
      setProfileData({
        name: String(profile?.name || '').trim(),
        email: String(profile?.email || '').trim(),
        phone: String(profile?.phone || '').trim(),
      });
    };

    applyProfile(storedProfile);

    const loadProfile = async () => {
      try {
        const response = await userAuthService.getCurrentUser();
        const user = response?.data?.user || {};
        localStorage.setItem('userInfo', JSON.stringify({ ...storedProfile, ...user }));
        applyProfile({
          name: user.name || storedProfile?.name || '',
          email: user.email || storedProfile?.email || '',
          phone: user.phone || storedProfile?.phone || '',
        });
      } catch {
        applyProfile(storedProfile);
      } finally {
        if (active) setProfileLoading(false);
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  // Prefill the lead passenger from the signed-in profile, but never clobber
  // anything already typed.
  useEffect(() => {
    if (!profileData) return;
    setPassengers((current) => {
      if (!current.length) return current;
      const lead = current[0];
      if (lead.name || lead.phone || lead.email) return current;
      return [
        {
          ...lead,
          name: profileData.name || '',
          phone: String(profileData.phone || '').replace(/\D/g, '').slice(-10),
          email: profileData.email || '',
        },
        ...current.slice(1),
      ];
    });
  }, [profileData]);

  if (!bus || !selectedSeats?.length) {
    navigate(`${routePrefix}/bus`, { replace: true });
    return null;
  }

  const passengerErrors = passengers.map((item, index) => {
    const context = { isLead: index === 0 };
    return {
      name: getFieldError('name', item.name, context),
      age: getFieldError('age', item.age, context),
      phone: getFieldError('phone', item.phone, context),
      email: getFieldError('email', item.email, context),
    };
  });

  const showError = (index, field) => (touched[index]?.[field] ? passengerErrors[index]?.[field] || '' : '');

  const markTouched = (index, field) =>
    setTouched((current) => current.map((item, idx) => (idx === index ? { ...item, [field]: true } : item)));

  const updatePassenger = (index, patch) => {
    setPassengers((current) => current.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
    setError('');
  };

  const applyProfileTo = (index) => {
    if (!profileData) return;
    updatePassenger(index, {
      name: profileData.name || '',
      phone: String(profileData.phone || '').replace(/\D/g, '').slice(-10),
      email: profileData.email || '',
    });
    setTouched((current) =>
      current.map((item, idx) => (idx === index ? { ...item, name: true, phone: true, email: true } : item)),
    );
  };

  const toggleAddOn = (id) =>
    setSelectedAddOns((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const availableAddOns = Array.isArray(bus?.addOns) ? bus.addOns : [];
  const seatCount = (selectedSeats || []).length || 1;

  // Mirrors the server's rule: a per-seat extra bills once per passenger. The
  // figure below is only a preview - the amount charged is the server's.
  const addOnsTotal = availableAddOns
    .filter((item) => selectedAddOns.includes(item.id))
    .reduce((sum, item) => sum + Number(item.price || 0) * (item.perSeat ? seatCount : 1), 0);
  const payableAmount = Number(totalFare || 0) + addOnsTotal;
  const isSleeperBus = String(bus?.type || '').toLowerCase().includes('sleeper');
  const hasRating = Number(bus?.ratingCount || 0) > 0 && Number(bus?.rating || 0) > 0;

  const handleContinue = async () => {
    if (isPaying) return;

    // Reveal every message at once so nothing stays hidden behind a blur event.
    setTouched(passengers.map(() => ({ name: true, age: true, phone: true, email: true })));

    const firstBadIndex = passengerErrors.findIndex((item) => Object.values(item).some(Boolean));
    if (firstBadIndex >= 0) {
      setError(`Check the highlighted fields for Passenger ${firstBadIndex + 1}.`);
      return;
    }

    setError('');
    setIsPaying(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      const lead = passengers[0];
      const orderResponse = await userBusService.createBookingOrder({
        busServiceId: bus.busServiceId,
        scheduleId: bus.scheduleId,
        travelDate: date,
        seatIds: selectedSeats.map((seat) => seat.id),
        passenger: lead,
        passengers,
        addOns: selectedAddOns,
      });
      const order = unwrapPayload(orderResponse);

      if (!order.keyId || !order.orderId) {
        throw new Error('Unable to start bus payment');
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: bus.operator || 'Bus Booking',
        description: `${fromCity} to ${toCity}`,
        order_id: order.orderId,
        prefill: { name: lead.name, email: lead.email, contact: lead.phone },
        modal: {
          ondismiss: () => setIsPaying(false),
        },
        theme: { color: '#FFC107' },
        handler: async (response) => {
          try {
            const verifyResponse = await userBusService.verifyBookingPayment(response);
            const booking = toPlainData(unwrapPayload(verifyResponse));
            navigate(`${routePrefix}/bus/confirm`, {
              replace: true,
              state: buildBusRouteState({ booking, fromCity, toCity, date }),
            });
          } catch (verifyError) {
            setError(verifyError?.message || 'Payment verification failed');
            setIsPaying(false);
          }
        },
      });

      rzp.on('payment.failed', (event) => {
        setError(event?.error?.description || event?.error?.reason || 'Payment failed');
        setIsPaying(false);
      });

      rzp.open();
    } catch (err) {
      setError(err?.message || 'Unable to continue with payment');
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-[var(--background)] pb-44 text-[var(--text)]">
      <AppHeader showBack subtitle="PASSENGER DETAILS" />

      <div className="space-y-3 px-3 pt-3">
        {/* Bus summary */}
        <div className="overflow-hidden rounded-[18px] border-t-4 border-[var(--primary)] bg-white p-3 shadow-[var(--shadow-sm)]">
          <div className="flex gap-3">
            <div className="h-[86px] w-[94px] shrink-0 overflow-hidden rounded-[12px] bg-slate-900">
              {bus.coverImage || bus.image ? (
                <img src={bus.coverImage || bus.image} alt={bus.operator} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-extrabold leading-tight">{bus.operator}</p>
              <p className="mt-0.5 truncate text-[10px] font-medium text-[var(--text-light)]">
                {bus.type}
                {bus.busName ? ` • ${bus.busName}` : ''}
              </p>

              {Array.isArray(bus.amenities) && bus.amenities.length ? (
                <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1">
                  {bus.amenities.slice(0, 6).map((amenity) => (
                    <span
                      key={amenity}
                      className="flex items-center gap-1 text-[8.5px] font-semibold text-[var(--text-light)]"
                    >
                      <ShieldCheck size={9} className="shrink-0 text-[var(--primary-dark)]" />
                      {amenity}
                    </span>
                  ))}
                </div>
              ) : null}

              {hasRating ? (
                <p className="mt-1.5 flex items-center gap-1 text-[10px] font-bold">
                  <Star size={11} className="fill-[var(--primary)] text-[var(--primary)]" />
                  {Number(bus.rating).toFixed(1)}
                  <span className="font-medium text-[var(--text-light)]">({bus.ratingCount} Ratings)</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Selected berths */}
        <div className="flex items-center gap-3 rounded-[18px] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-sm)]">
          <p className="shrink-0 text-[12.5px] font-extrabold leading-tight">
            Selected {isSleeperBus ? 'Sleeper Berths' : 'Seats'}
          </p>
          <div className="flex flex-1 gap-2 overflow-x-auto no-scrollbar">
            {selectedSeats.map((seat) => (
              <span
                key={seat.id}
                className="flex shrink-0 items-center gap-1.5 rounded-[10px] border border-[var(--primary)] bg-[var(--secondary)] px-2.5 py-1.5"
              >
                <BedDouble size={13} className="shrink-0 text-[var(--primary-dark)]" />
                <span className="leading-tight">
                  <span className="block text-[11.5px] font-extrabold">{seat.label || seat.id}</span>
                  <span className="block text-[8px] font-medium text-[var(--text-light)]">
                    {String(seat.id).startsWith('U') ? 'Upper Deck' : 'Lower Deck'}
                  </span>
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Passenger forms - one per berth */}
        {passengers.map((passenger, index) => (
          <div
            key={passenger.seatId}
            className="rounded-[18px] border border-[var(--border)] bg-white p-3.5 shadow-[var(--shadow-sm)]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[14px] font-extrabold">
                Passenger {index + 1}
                <span className="ml-1 text-[11px] font-medium text-[var(--text-light)]">
                  ({isSleeperBus ? 'Berth' : 'Seat'} {passenger.seatLabel})
                </span>
              </p>
              <button
                type="button"
                onClick={() => applyProfileTo(index)}
                disabled={profileLoading || !profileData?.name}
                className="flex shrink-0 items-center gap-1.5 rounded-[10px] border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold disabled:opacity-40"
              >
                {profileLoading ? <Loader2 size={11} className="animate-spin" /> : <UserRound size={11} />}
                Use Profile
              </button>
            </div>

            <div className="mt-3 grid grid-cols-[1fr_84px] gap-2.5">
              <Field label="Full Name" required>
                <input
                  type="text"
                  value={passenger.name}
                  onChange={(event) => updatePassenger(index, { name: event.target.value })}
                  onBlur={() => markTouched(index, 'name')}
                  placeholder="Enter full name"
                  aria-invalid={Boolean(showError(index, 'name'))}
                  className={inputClass(showError(index, 'name'))}
                />
                <FieldError message={showError(index, 'name')} />
              </Field>
              <Field label="Age" required>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  value={passenger.age}
                  onChange={(event) =>
                    updatePassenger(index, { age: event.target.value.replace(/\D/g, '').slice(0, 3) })
                  }
                  onBlur={() => markTouched(index, 'age')}
                  placeholder="00"
                  aria-invalid={Boolean(showError(index, 'age'))}
                  className={inputClass(showError(index, 'age'))}
                />
                <FieldError message={showError(index, 'age')} />
              </Field>
            </div>

            <div className="mt-2.5">
              <Field label="Gender" required>
                <div className="grid grid-cols-3 gap-2">
                  {GENDERS.map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => updatePassenger(index, { gender })}
                      className={`rounded-[10px] border py-2.5 text-[11.5px] font-bold transition-colors ${
                        passenger.gender === gender
                          ? 'border-[var(--primary)] bg-[var(--secondary)] text-[var(--text)]'
                          : 'border-[var(--border)] bg-white text-[var(--text-light)]'
                      }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              <Field label="Mobile Number" required={index === 0}>
                <div
                  className={`flex items-center rounded-[10px] border bg-white ${
                    showError(index, 'phone')
                      ? 'border-[var(--danger)]'
                      : 'border-[var(--border)] focus-within:border-[var(--primary)]'
                  }`}
                >
                  <span className="shrink-0 border-r border-[var(--border)] px-2 py-2.5 text-[11.5px] font-bold text-[var(--text-light)]">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={passenger.phone}
                    onChange={(event) =>
                      updatePassenger(index, { phone: event.target.value.replace(/\D/g, '').slice(0, 10) })
                    }
                    onBlur={() => markTouched(index, 'phone')}
                    placeholder="98765 43210"
                    aria-invalid={Boolean(showError(index, 'phone'))}
                    className="w-full min-w-0 bg-transparent px-2 py-2.5 text-[12.5px] font-semibold outline-none placeholder:font-medium placeholder:text-slate-300"
                  />
                </div>
                <FieldError message={showError(index, 'phone')} />
              </Field>
              <Field label={index === 0 ? 'Email' : 'Email (Optional)'} required={index === 0}>
                <input
                  type="email"
                  value={passenger.email}
                  onChange={(event) => updatePassenger(index, { email: event.target.value })}
                  onBlur={() => markTouched(index, 'email')}
                  placeholder="name@email.com"
                  aria-invalid={Boolean(showError(index, 'email'))}
                  className={inputClass(showError(index, 'email'))}
                />
                <FieldError message={showError(index, 'email')} />
              </Field>
            </div>
          </div>
        ))}

        {/* Add ons */}
        <div className="rounded-[18px] border border-[var(--border)] bg-white p-3.5 shadow-[var(--shadow-sm)]">
          <p className="text-[14px] font-extrabold">
            Add Ons <span className="text-[11px] font-medium text-[var(--text-light)]">(Optional)</span>
          </p>
          <div className="mt-2.5 space-y-2">
            {availableAddOns.map(({ id, label, hint, price, perSeat }) => {
              const Icon = ADD_ON_ICONS[id] || ShieldCheck;
              const checked = selectedAddOns.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleAddOn(id)}
                  className={`flex w-full items-center gap-2.5 rounded-[12px] border px-3 py-2.5 text-left transition-colors ${
                    checked ? 'border-[var(--primary)] bg-[var(--secondary)]' : 'border-[var(--border)] bg-white'
                  }`}
                >
                  <Icon size={17} className="shrink-0 text-[var(--primary-dark)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-extrabold leading-tight">{label}</span>
                    <span className="block text-[9.5px] font-medium text-[var(--text-light)]">{hint}</span>
                  </span>
                  <span className="shrink-0 text-right text-[12px] font-extrabold">
                    Rs{perSeat ? Number(price) * seatCount : price}
                    {/* A per-seat extra costs more with more passengers - say so. */}
                    {perSeat && seatCount > 1 ? (
                      <span className="block text-[9px] font-medium text-[var(--text-light)]">
                        Rs{price} x {seatCount}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-2 ${
                      checked ? 'border-[var(--primary-dark)] bg-[var(--primary)]' : 'border-[var(--border)] bg-white'
                    }`}
                  >
                    {checked ? (
                      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-[var(--text)]" aria-hidden="true">
                        <path d="M2 6.5 4.5 9 10 3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fare breakdown */}
        <div className="rounded-[18px] border border-[var(--border)] bg-white p-3.5 shadow-[var(--shadow-sm)]">
          <p className="text-[14px] font-extrabold">Fare Summary</p>
          <div className="mt-2.5 space-y-1.5 text-[11.5px] font-semibold">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-light)]">
                {selectedSeats.length} {isSleeperBus ? 'berth' : 'seat'}
                {selectedSeats.length > 1 ? 's' : ''}
              </span>
              <span>Rs{Number(totalFare || 0)}</span>
            </div>
            {availableAddOns.filter((item) => selectedAddOns.includes(item.id)).map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <span className="text-[var(--text-light)]">{item.label}</span>
                <span>Rs{item.price}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-[var(--border)] pt-2 text-[13px] font-extrabold">
              <span>Total</span>
              <span>Rs{payableAmount}</span>
            </div>
          </div>
        </div>

        {/* Secure payments */}
        <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--border)] bg-white p-3.5 shadow-[var(--shadow-sm)]">
          <div className="flex min-w-0 items-center gap-2">
            <ShieldCheck size={20} className="shrink-0 text-[var(--primary-dark)]" />
            <span className="min-w-0">
              <span className="block text-[11.5px] font-extrabold leading-tight">100% Secure Payments</span>
              <span className="block text-[9.5px] font-medium text-[var(--text-light)]">Your data is safe with us</span>
            </span>
          </div>
          <div className="shrink-0 text-right">
            <span className="block text-[8.5px] font-medium text-[var(--text-light)]">We Accept</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[8.5px] font-extrabold text-[var(--text-light)]">
              <span>UPI</span>
              <span>VISA</span>
              <span>MC</span>
              <span>RuPay</span>
            </span>
          </div>
        </div>

        {error ? (
          <div className="rounded-[14px] border border-rose-100 bg-rose-50 px-3.5 py-3 text-[11.5px] font-bold text-[var(--danger)]">
            {error}
          </div>
        ) : null}
      </div>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-lg -translate-x-1/2 border-t border-[var(--border)] bg-white px-4 pb-6 pt-3">
        <div className="mb-2.5 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-light)]">Payable Amount</p>
            <p className="text-[20px] font-extrabold leading-tight">Rs{payableAmount}</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-[var(--success)]">
            Taxes included
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleContinue}
          disabled={isPaying}
          className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(180deg,#FFD54F,#FFC107)] py-3.5 text-[15px] font-extrabold text-[var(--text)] shadow-[0_8px_20px_rgba(255,193,7,.4)] disabled:opacity-60"
        >
          {isPaying ? <Loader2 size={18} className="animate-spin" /> : 'Pay Now'}
          {!isPaying ? <ChevronRight size={18} strokeWidth={2.8} /> : null}
        </motion.button>
      </div>
    </div>
  );
};

export default BusDetails;
