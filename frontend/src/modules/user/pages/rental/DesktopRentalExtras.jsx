import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Armchair, ArrowLeft, ArrowRight, BadgeCheck, Calendar, Car, CheckCircle2, Clock, CreditCard,
  Fuel, Gauge, Headphones, Luggage, MapPin, Navigation, Package, ShieldCheck, Sparkles, Tag,
  Ticket, Users,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { DesktopNav } from '../../components/desktop/DesktopChrome';
import {
  RENTAL_SELECTED_VEHICLE_STORAGE_KEY, useDesktopTheme,
} from '../../components/desktop/desktopShared';

// Keys owned by the existing mobile flow - reuse them so a desktop reload
// restores the same booking, and so the next step finds what it expects.
const RENTAL_SCHEDULE_STATE_KEY = 'taxi:rental-schedule-pending';
const RENTAL_KYC_STATE_KEY = 'taxi:rental-kyc-pending';

/**
 * Desktop "Extra Options" step for /taxi/user/rental/schedule.
 *
 * Add-ons and kilometre plans come from the vehicle itself; every amount in the
 * price panel is returned by the server quote endpoint, re-fetched whenever the
 * selection changes. Nothing here is priced client-side.
 */

const STEPS = ['Select Car', 'Extra Options', 'Review Booking', 'Payment', 'Confirmed'];

const ADD_ON_ICONS = {
  Armchair, Users, Car, Luggage, Navigation, MapPin, Tag, ShieldCheck, Package,
};

const ASSURANCES = [
  { icon: BadgeCheck, title: 'Free Cancellation', copy: 'Cancel anytime before pick-up' },
  { icon: CreditCard, title: 'Transparent Pricing', copy: 'No hidden charges' },
  { icon: Sparkles, title: 'Sanitized Vehicles', copy: 'Cleaned and disinfected' },
  { icon: Headphones, title: '24/7 Customer Support', copy: "We're here to help" },
];

const TRANSMISSIONS = ['manual', 'automatic', 'amt', 'cvt'];

const titleCase = (value) =>
  String(value || '').replace(/(^|\s|-)([a-z])/g, (_, prefix, char) => prefix + char.toUpperCase());

const specsOf = (vehicle) => {
  const parts = String(vehicle?.fuel || '').split(/[^\p{L}]+/u).map((p) => p.trim()).filter(Boolean);
  const gearbox = parts.find((p) => TRANSMISSIONS.includes(p.toLowerCase()));
  const fuel = parts.find((p) => !TRANSMISSIONS.includes(p.toLowerCase()));
  return {
    fuel: titleCase(fuel || ''),
    transmission: titleCase(vehicle?.transmission || gearbox || ''),
  };
};

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

/** Pickup arrives as an ISO-ish string from the earlier steps. */
const formatDateTime = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const planLabel = (plan) => {
  if (!plan) return '';
  if (!plan.includedKm) return 'Unlimited KM';
  return `${plan.includedKm} KM`;
};

const DesktopRentalExtras = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, toggleTheme] = useDesktopTheme();

  const stored = useMemo(() => {
    for (const key of [RENTAL_SCHEDULE_STATE_KEY, RENTAL_SELECTED_VEHICLE_STORAGE_KEY]) {
      try {
        const parsed = JSON.parse(window.sessionStorage.getItem(key) || 'null');
        if (parsed?.vehicle) return parsed;
      } catch {
        // Try the next key.
      }
    }
    return null;
  }, []);

  const state = location.state || stored || {};
  const vehicle = state.vehicle || null;

  const plans = useMemo(
    () => (Array.isArray(vehicle?.pricing) ? vehicle.pricing : []).filter((item) => item?.active !== false),
    [vehicle],
  );
  const addOns = useMemo(
    () => (Array.isArray(vehicle?.addOns) ? vehicle.addOns : []).filter((item) => item?.active !== false),
    [vehicle],
  );

  const [planId, setPlanId] = useState(
    String(state.selectedPackage?.id || state.selectedPackage?.packageId || ''),
  );
  const [selectedAddOns, setSelectedAddOns] = useState(
    Array.isArray(state.selectedPackage?.addOns) ? state.selectedPackage.addOns : [],
  );
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');

  const activePlanId = planId || String(plans[0]?.id || plans[0]?.packageId || '');
  const selectedPlan = plans.find((p) => String(p.id || p.packageId) === activePlanId) || plans[0];

  // Re-price on the server whenever the plan or add-on selection changes.
  useEffect(() => {
    const vehicleTypeId = vehicle?.id || vehicle?._id;
    if (!vehicleTypeId || !activePlanId) return undefined;

    let cancelled = false;
    userService
      .quoteRentalBooking({ vehicleTypeId, packageId: activePlanId, addOns: selectedAddOns })
      .then((result) => {
        if (cancelled) return;
        setQuote(result);
        setQuoteError('');
      })
      .catch((error) => {
        if (cancelled) return;
        setQuote(null);
        setQuoteError(error?.response?.data?.message || 'Could not price this booking');
      });
    return () => { cancelled = true; };
  }, [vehicle?.id, vehicle?._id, activePlanId, selectedAddOns]);

  if (!vehicle) {
    return (
      <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
        <DesktopNav activePath="/taxi/user/rental" theme={theme} onToggleTheme={toggleTheme} />
        <div className="mx-auto max-w-[1440px] px-8 py-24 text-center xl:px-12">
          <p className="text-[19px] font-black text-[var(--dh-text)]">No booking in progress</p>
          <button
            onClick={() => navigate('/taxi/user/rental?search=true')}
            className="mt-5 rounded-[12px] bg-[#F5B700] px-6 py-3 text-[16.5px] font-bold text-slate-950"
          >
            Choose a car
          </button>
        </div>
      </div>
    );
  }

  const specs = specsOf(vehicle);
  const category = vehicle.rentalSubcategoryName || titleCase(vehicle.vehicleCategory) || 'Vehicle';

  const toggleAddOn = (id) =>
    setSelectedAddOns((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;

    setApplyingCoupon(true);
    try {
      const response = await userService.validateRentalCoupon({
        code,
        bookingAmount: quote?.totalCost || 0,
        vehicleId: vehicle._id || vehicle.id,
      });
      const result = response?.data?.data;

      if (result?.valid) {
        setAppliedCoupon(result.coupon);
        setCouponError('');
      } else {
        setAppliedCoupon(null);
        setCouponError(result?.message || 'Promo code is not valid.');
      }
    } catch (error) {
      setAppliedCoupon(null);
      setCouponError(error?.response?.data?.message || 'Could not validate this code.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const continueToReview = () => {
    const payload = {
      ...state,
      vehicle,
      selectedPackage: {
        ...(state.selectedPackage || {}),
        id: selectedPlan?.id,
        packageId: selectedPlan?.id,
        label: selectedPlan?.label,
        price: selectedPlan?.price,
        durationHours: selectedPlan?.durationHours,
        includedKm: selectedPlan?.includedKm,
        extraHourPrice: selectedPlan?.extraHourPrice,
        addOns: selectedAddOns,
      },
      appliedCoupon: appliedCoupon || null,
      // Carry the server's figures forward so the later steps display and
      // charge the same numbers this screen showed.
      totalCost: quote?.totalCost,
      payableNowOverride: quote?.payableNow,
      advancePaymentLabelOverride: quote?.advancePayment?.label,
      paymentVariant: quote && quote.balanceDue === 0 ? 'full' : 'advance',
      rentalPaymentSummary: quote
        ? {
            baseFare: quote.packagePrice,
            addOnsTotal: quote.addOnsTotal,
            taxes: 0,
            totalPayable: quote.totalCost,
            payableNow: quote.payableNow,
            payLater: quote.balanceDue,
            selectedAddOns: quote.addOns,
          }
        : null,
    };

    try {
      window.sessionStorage.setItem(RENTAL_KYC_STATE_KEY, JSON.stringify(payload));
    } catch {
      // Continue with router state if storage is unavailable.
    }
    navigate('/taxi/user/rental/kyc', { state: payload });
  };

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath="/taxi/user/rental" theme={theme} onToggleTheme={toggleTheme} />

      <section className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)_412px] gap-6 px-8 pb-20 pt-5 xl:px-12">
        <div className="rounded-[20px] bg-[var(--dh-surface)] p-7 ring-1 ring-[var(--dh-border)]">
          {/* ------------------------------------------------------------ Stepper */}
          <ol className="flex items-center gap-3">
            {STEPS.map((label, index) => {
              const isDone = index < 1;
              const isCurrent = index === 1;
              return (
                <li key={label} className="flex flex-1 items-center gap-3 last:flex-none">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                      isCurrent ? 'bg-[#F5B700] text-slate-950'
                        : isDone ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-[var(--dh-chip)] text-[var(--dh-muted)]'
                    }`}
                  >
                    {isDone ? <CheckCircle2 size={20} strokeWidth={2.4} /> : <span className="text-[16.5px] font-black">{index + 1}</span>}
                  </span>
                  <span className={`whitespace-nowrap text-[15.5px] font-bold ${isCurrent ? 'text-[var(--dh-text)]' : 'text-[var(--dh-muted)]'}`}>
                    {label}
                  </span>
                  {index < STEPS.length - 1 && (
                    <span className={`h-[2px] flex-1 rounded-full ${index < 1 ? 'bg-emerald-400' : 'bg-[var(--dh-border)]'}`} />
                  )}
                </li>
              );
            })}
          </ol>

          {/* ---------------------------------------------------------- Add-ons */}
          <div className="mt-8">
            <h1 className="text-[24px] font-black tracking-[-0.03em] text-[var(--dh-text)]">Enhance Your Journey</h1>
            <p className="mt-1.5 text-[15.5px] font-medium text-[var(--dh-muted)]">
              Add extra options to make your trip more comfortable and worry-free.
            </p>

            {addOns.length ? (
              <div className="mt-5 grid grid-cols-3 gap-3.5">
                {addOns.map((addOn) => {
                  const Icon = ADD_ON_ICONS[addOn.icon] || Package;
                  const isOn = selectedAddOns.includes(addOn.id);
                  return (
                    <button
                      key={addOn.id}
                      type="button"
                      onClick={() => toggleAddOn(addOn.id)}
                      aria-pressed={isOn}
                      className={`flex gap-3 rounded-[15px] border p-4 text-left transition-colors ${
                        isOn ? 'border-[#F5B700] bg-[#FFFCF2]' : 'border-[var(--dh-border)] hover:bg-[var(--dh-chip)]'
                      }`}
                    >
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 ${
                        isOn ? 'border-[#F5B700] bg-[#F5B700]' : 'border-[var(--dh-border)]'
                      }`}>
                        {isOn && <CheckCircle2 size={13} className="text-slate-950" strokeWidth={3} />}
                      </span>

                      <Icon size={26} className="mt-0.5 shrink-0 text-[var(--dh-muted)]" strokeWidth={1.9} />

                      <span className="min-w-0 flex-1">
                        <span className="block text-[16px] font-black text-[var(--dh-text)]">{addOn.label}</span>
                        {addOn.description && (
                          <span className="mt-1 block text-[13.5px] font-medium leading-[1.4] text-[var(--dh-muted)]">
                            {addOn.description}
                          </span>
                        )}
                        <span className="mt-2 flex flex-wrap items-baseline gap-2">
                          <span className="text-[17px] font-black text-[var(--dh-text)]">{formatMoney(addOn.price)}</span>
                          {addOn.originalPrice > addOn.price && (
                            <>
                              <span className="text-[14.5px] font-bold text-[var(--dh-muted)] line-through">
                                {formatMoney(addOn.originalPrice)}
                              </span>
                              <span className="rounded-full bg-[#F5B700] px-2 py-0.5 text-[12px] font-black text-slate-950">
                                Save {formatMoney(addOn.originalPrice - addOn.price)}
                              </span>
                            </>
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-5 rounded-[14px] bg-[var(--dh-chip)] px-5 py-8 text-center text-[15px] font-semibold text-[var(--dh-muted)]">
                No add-ons are configured for this vehicle.
              </p>
            )}
          </div>

          {/* --------------------------------------------------- Kilometre plan */}
          {plans.length > 0 && (
            <div className="mt-8 border-t border-[var(--dh-border)] pt-7">
              <h2 className="text-[22px] font-black tracking-[-0.03em] text-[var(--dh-text)]">Kilometre Plan</h2>
              <p className="mt-1.5 text-[15.5px] font-medium text-[var(--dh-muted)]">
                Choose the best kilometre limit that suits your travel needs.
              </p>

              <div className="mt-5 grid grid-cols-4 gap-3.5">
                {plans.map((plan) => {
                  const id = String(plan.id || plan.packageId || '');
                  const isOn = id === activePlanId;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPlanId(id)}
                      aria-pressed={isOn}
                      className={`rounded-[15px] border p-4 text-left transition-colors ${
                        isOn ? 'border-[#F5B700] bg-[#FFFCF2]' : 'border-[var(--dh-border)] hover:bg-[var(--dh-chip)]'
                      }`}
                    >
                      <span className="flex items-start gap-2.5">
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          isOn ? 'border-[#F5B700]' : 'border-[var(--dh-border)]'
                        }`}>
                          {isOn && <span className="h-2.5 w-2.5 rounded-full bg-[#F5B700]" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[16px] font-black text-[var(--dh-text)]">
                            {plan.label || planLabel(plan)}
                          </span>
                          <span className="mt-1 block text-[13.5px] font-semibold text-[var(--dh-muted)]">
                            {plan.includedKm
                              ? `${plan.includedKm} km included${plan.extraKmPrice ? ` · Extra ${formatMoney(plan.extraKmPrice)}/km` : ''}`
                              : 'Best for long drives'}
                          </span>
                        </span>
                      </span>
                      <span className="mt-3 block text-[20px] font-black text-[var(--dh-text)]">
                        {formatMoney(plan.price)}
                        <span className="text-[14px] font-bold text-[var(--dh-muted)]">/{plan.durationHours ? `${plan.durationHours}h` : 'day'}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- Coupon */}
          <div className="mt-8 border-t border-[var(--dh-border)] pt-7">
            <div className="flex items-end justify-between gap-6">
              <div>
                <h2 className="text-[22px] font-black tracking-[-0.03em] text-[var(--dh-text)]">Add Coupon</h2>
                <p className="mt-1.5 text-[15.5px] font-medium text-[var(--dh-muted)]">
                  Apply coupon code and get exciting discounts.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-[50px] w-[280px] items-center gap-2.5 rounded-[12px] border border-[var(--dh-border)] px-4">
                  <Ticket size={17} className="shrink-0 text-[var(--dh-muted)]" strokeWidth={2.2} />
                  <input
                    value={coupon}
                    onChange={(event) => { setCoupon(event.target.value); setCouponError(''); }}
                    placeholder="Enter coupon code"
                    className="w-full bg-transparent text-[15.5px] font-semibold uppercase text-[var(--dh-text)] placeholder:normal-case placeholder:text-[var(--dh-muted)] outline-none"
                  />
                </span>
                <button
                  onClick={applyCoupon}
                  disabled={applyingCoupon || !coupon.trim()}
                  className="h-[50px] rounded-[12px] bg-[#F5B700] px-8 text-[16.5px] font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {applyingCoupon ? 'Checking…' : 'Apply'}
                </button>
              </div>
            </div>

            {couponError && (
              <p className="mt-3 rounded-[10px] bg-rose-50 px-3.5 py-2.5 text-[14px] font-bold text-rose-700">{couponError}</p>
            )}
            {appliedCoupon && (
              <p className="mt-3 rounded-[10px] bg-emerald-50 px-3.5 py-2.5 text-[14px] font-bold text-emerald-700">
                {appliedCoupon.code} applied — discount is confirmed on the payment step.
              </p>
            )}
          </div>

          <div className="mt-7 grid grid-cols-4 gap-4 rounded-[16px] bg-[#FFFBEC] px-6 py-5">
            {ASSURANCES.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="flex items-center gap-3">
                <Icon size={24} className="shrink-0 text-[#F5B700]" strokeWidth={2} />
                <span>
                  <span className="block text-[14px] font-black text-slate-900">{title}</span>
                  <span className="mt-0.5 block text-[13px] font-semibold text-slate-600">{copy}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------------- Sidebar */}
        <aside className="sticky top-[100px] h-fit rounded-[20px] bg-[var(--dh-surface)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-[var(--dh-border)]">
          <div className="flex gap-3.5">
            <span className="relative h-[68px] w-[104px] shrink-0 overflow-hidden rounded-[12px] bg-[var(--dh-chip)]">
              <img
                src={vehicle.image || vehicle.coverImage || '/taxi09_rental_self_drive.png'}
                alt={vehicle.name}
                className="absolute inset-0 h-full w-full object-contain p-1.5"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[18px] font-black tracking-[-0.02em] text-[var(--dh-text)]">{vehicle.name}</span>
              <span className="block text-[14px] font-semibold text-[var(--dh-muted)]">{category}</span>
              <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                {vehicle.capacity > 0 && (
                  <span className="flex items-center gap-1 text-[13.5px] font-semibold text-[var(--dh-muted)]">
                    <Users size={13} strokeWidth={2.2} /> {vehicle.capacity} Seats
                  </span>
                )}
                {specs.transmission && (
                  <span className="flex items-center gap-1 text-[13.5px] font-semibold text-[var(--dh-muted)]">
                    <Gauge size={13} strokeWidth={2.2} /> {specs.transmission}
                  </span>
                )}
                {specs.fuel && (
                  <span className="flex items-center gap-1 text-[13.5px] font-semibold text-[var(--dh-muted)]">
                    <Fuel size={13} strokeWidth={2.2} /> {specs.fuel}
                  </span>
                )}
              </span>
            </span>
          </div>

          <dl className="mt-5 space-y-3.5 border-t border-[var(--dh-border)] pt-4">
            {[
              ['Pickup Location', state.serviceLocation?.name || state.pickupLocation, MapPin],
              ['Drop Location', state.dropoffLocation || state.serviceLocation?.name || state.pickupLocation, MapPin],
              ['Pickup Date & Time', formatDateTime(state.pickup), Calendar],
              ['Duration', selectedPlan?.durationHours ? `${selectedPlan.durationHours} Hours` : '', Clock],
              ['Kilometre Plan', selectedPlan ? planLabel(selectedPlan) : '', Gauge],
            ]
              .filter(([, value]) => value)
              .map(([label, value, Icon]) => (
                <div key={label} className="flex gap-2.5">
                  <Icon size={16} className="mt-0.5 shrink-0 text-[var(--dh-muted)]" strokeWidth={2.2} />
                  <span className="min-w-0">
                    <dt className="text-[14px] font-bold text-[var(--dh-text)]">{label}</dt>
                    <dd className="mt-0.5 text-[14px] font-semibold text-[var(--dh-muted)]">{value}</dd>
                  </span>
                </div>
              ))}
          </dl>

          {/* Price panel - entirely server-computed */}
          <div className="mt-5 border-t border-[var(--dh-border)] pt-4">
            <h3 className="text-[16.5px] font-black text-[var(--dh-text)]">Price Details</h3>

            {quote ? (
              <div className="mt-3 space-y-2.5">
                <div className="flex justify-between text-[14.5px] font-semibold text-[var(--dh-muted)]">
                  <span>Base Fare{selectedPlan?.label ? ` (${selectedPlan.label})` : ''}</span>
                  <span className="text-[var(--dh-text)]">{formatMoney(quote.packagePrice)}</span>
                </div>
                <div className="flex justify-between text-[14.5px] font-semibold text-[var(--dh-muted)]">
                  <span>Extra Options ({quote.addOns?.length || 0})</span>
                  <span className="text-[var(--dh-text)]">{formatMoney(quote.addOnsTotal)}</span>
                </div>
                {quote.addOnsSavings > 0 && (
                  <div className="flex justify-between text-[14.5px] font-bold text-emerald-700">
                    <span>You save</span>
                    <span>-{formatMoney(quote.addOnsSavings)}</span>
                  </div>
                )}
                {quote.extraHoursTotal > 0 && (
                  <div className="flex justify-between text-[14.5px] font-semibold text-[var(--dh-muted)]">
                    <span>Extra Hours ({quote.extraHours})</span>
                    <span className="text-[var(--dh-text)]">{formatMoney(quote.extraHoursTotal)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-[var(--dh-border)] pt-3">
                  <span className="text-[16.5px] font-black text-[var(--dh-text)]">Total Amount</span>
                  <span className="text-[20px] font-black text-[var(--dh-text)]">{formatMoney(quote.totalCost)}</span>
                </div>

                {quote.payableNow > 0 && (
                  <div className="flex items-start gap-2.5 rounded-[12px] bg-emerald-50 p-3.5">
                    <ShieldCheck size={19} className="mt-0.5 shrink-0 text-emerald-600" strokeWidth={2.2} />
                    <span>
                      <span className="block text-[14px] font-black text-emerald-800">
                        {quote.advancePayment?.label || 'Advance booking payment'}
                      </span>
                      <span className="mt-0.5 block text-[13.5px] font-semibold text-emerald-700">
                        Pay {formatMoney(quote.payableNow)} now, {formatMoney(quote.balanceDue)} at pickup.
                      </span>
                    </span>
                  </div>
                )}
              </div>
            ) : quoteError ? (
              <p className="mt-3 rounded-[10px] bg-rose-50 px-3 py-2.5 text-[14px] font-bold text-rose-700">{quoteError}</p>
            ) : (
              <div className="mt-3 space-y-2">
                <div className="skeleton h-4 rounded" />
                <div className="skeleton h-4 w-2/3 rounded" />
                <div className="skeleton h-6 rounded" />
              </div>
            )}
          </div>

          <button
            onClick={continueToReview}
            disabled={!quote}
            className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-[13px] bg-[#F5B700] py-3.5 text-[17px] font-bold text-slate-950 shadow-[0_10px_24px_rgba(245,183,0,0.3)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to Review Booking <ArrowRight size={18} strokeWidth={2.8} />
          </button>

          <button
            onClick={() => navigate('/taxi/user/rental/vehicle', { state })}
            className="mt-2.5 flex w-full items-center justify-center gap-2.5 rounded-[13px] border border-[var(--dh-border)] py-3 text-[16px] font-bold text-[var(--dh-text)] hover:bg-[var(--dh-chip)]"
          >
            <ArrowLeft size={17} strokeWidth={2.4} /> Back to Select Car
          </button>
        </aside>
      </section>
    </div>
  );
};

export default DesktopRentalExtras;
