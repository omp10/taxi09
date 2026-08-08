import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, Fuel, Gauge, Headphones,
  Heart, Info, MessageCircle, Phone, Share2, ShieldCheck, Sparkles, Truck, Users, Zap,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { AiChatBubble, DesktopNav } from '../../components/desktop/DesktopChrome';
import {
  RENTAL_SELECTED_VEHICLE_STORAGE_KEY, useDesktopTheme,
} from '../../components/desktop/desktopShared';

/**
 * Desktop vehicle detail for /taxi/user/rental/vehicle.
 *
 * Plans come from vehicle.pricing, the deposit line from vehicle.advancePayment
 * and every rupee in the summary from the server quote endpoint - the page does
 * no pricing arithmetic of its own.
 */

const TRANSMISSIONS = ['manual', 'automatic', 'amt', 'cvt'];

const titleCase = (value) =>
  String(value || '').replace(/(^|\s|-)([a-z])/g, (_, prefix, char) => prefix + char.toUpperCase());

/** Older listings pack fuel and gearbox into one string ("Petrol · Manual"). */
const specsOf = (vehicle) => {
  const parts = String(vehicle?.fuel || '').split(/[^\p{L}]+/u).map((p) => p.trim()).filter(Boolean);
  const gearbox = parts.find((p) => TRANSMISSIONS.includes(p.toLowerCase()));
  const fuel = parts.find((p) => !TRANSMISSIONS.includes(p.toLowerCase()));
  return {
    fuel: titleCase(fuel || ''),
    transmission: titleCase(vehicle?.transmission || gearbox || ''),
  };
};

const ASSURANCES = [
  { icon: BadgeCheck, title: 'Free Cancellation', copy: 'Cancel anytime before pick-up' },
  { icon: Truck, title: 'Doorstep Delivery', copy: 'We deliver at your location' },
  { icon: Sparkles, title: 'Sanitized Vehicle', copy: 'Cleaned and disinfected' },
  { icon: Headphones, title: 'Roadside Assistance', copy: 'Help on the go, 24/7' },
];

const WHY_BOOK = [
  { icon: ShieldCheck, title: '100% Verified Cars', copy: 'Safe & secure rides' },
  { icon: BadgeCheck, title: 'Transparent Pricing', copy: 'No hidden charges' },
  { icon: Headphones, title: '24/7 Customer Support', copy: "We're here to help" },
  { icon: Zap, title: 'Instant Confirmation', copy: 'No waiting, go driving' },
];

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const DesktopVehicleDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, toggleTheme] = useDesktopTheme();

  const stored = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(RENTAL_SELECTED_VEHICLE_STORAGE_KEY) || 'null');
    } catch {
      return null;
    }
  }, []);

  const vehicle = location.state?.vehicle || stored?.vehicle || null;

  const plans = useMemo(
    () => (Array.isArray(vehicle?.pricing) ? vehicle.pricing : []).filter((item) => item?.active !== false),
    [vehicle],
  );

  // Empty means "first plan"; deriving the fallback avoids a setState-in-effect
  // cascade just to pick a default.
  const [planId, setPlanId] = useState('');
  const [imageIndex, setImageIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');

  const activePlanId = planId || String(plans[0]?.id || plans[0]?.packageId || '');

  // Server owns every amount shown in the summary.
  useEffect(() => {
    const vehicleTypeId = vehicle?.id || vehicle?._id;
    if (!vehicleTypeId || !activePlanId) return undefined;

    let cancelled = false;
    userService
      .quoteRentalBooking({ vehicleTypeId, packageId: activePlanId })
      .then((result) => {
        if (cancelled) return;
        setQuote(result);
        setQuoteError('');
      })
      .catch((error) => {
        if (cancelled) return;
        setQuote(null);
        setQuoteError(error?.response?.data?.message || 'Could not price this vehicle');
      });
    return () => { cancelled = true; };
  }, [vehicle?.id, vehicle?._id, activePlanId]);

  const gallery = useMemo(() => {
    if (!vehicle) return [];
    return [vehicle.image, vehicle.coverImage, ...(vehicle.galleryImages || [])]
      .filter(Boolean)
      .filter((src, index, list) => list.indexOf(src) === index);
  }, [vehicle]);

  if (!vehicle) {
    return (
      <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
        <DesktopNav activePath="/taxi/user/rental" theme={theme} onToggleTheme={toggleTheme} />
        <div className="mx-auto max-w-[1440px] px-8 py-24 text-center xl:px-12">
          <p className="text-[18px] font-black text-[var(--dh-text)]">This vehicle is no longer loaded</p>
          <button
            onClick={() => navigate('/taxi/user/rental?search=true')}
            className="mt-5 rounded-[12px] bg-[#F5B700] px-6 py-3 text-[15px] font-bold text-slate-950"
          >
            Back to Search Results
          </button>
        </div>
      </div>
    );
  }

  const specs = specsOf(vehicle);
  const category = vehicle.rentalSubcategoryName || titleCase(vehicle.vehicleCategory) || 'Vehicle';
  const amenities = Array.isArray(vehicle.amenities) ? vehicle.amenities : [];
  const selectedPlan = plans.find((p) => String(p.id || p.packageId) === activePlanId) || plans[0];

  // Only render spec rows the catalogue actually has a value for.
  const specRows = [
    ['Vehicle Type', category],
    ['Model', vehicle.name],
    ['Seats', vehicle.capacity ? `${vehicle.capacity} Seats` : ''],
    ['Fuel Type', specs.fuel],
    ['Transmission', specs.transmission],
    ['Luggage', vehicle.luggageCapacity ? `${vehicle.luggageCapacity} bags` : ''],
    ['Included KM', selectedPlan?.includedKm ? `${selectedPlan.includedKm} km` : ''],
    ['Extra per KM', selectedPlan?.extraKmPrice ? formatMoney(selectedPlan.extraKmPrice) : ''],
  ].filter(([, value]) => value);

  const continueToBook = () => {
    const payload = {
      vehicle,
      duration: location.state?.duration || stored?.duration || 'Daily',
      selectedPackage: {
        id: selectedPlan?.id,
        packageId: selectedPlan?.id,
        label: selectedPlan?.label,
        price: selectedPlan?.price,
        durationHours: selectedPlan?.durationHours,
        includedKm: selectedPlan?.includedKm,
        extraHourPrice: selectedPlan?.extraHourPrice,
        addOns: [],
      },
    };
    try {
      // RentalSchedule restores from this key on reload.
      window.sessionStorage.setItem('taxi:rental-schedule-pending', JSON.stringify(payload));
    } catch {
      // Continue with router state if storage is unavailable.
    }
    navigate('/taxi/user/rental/schedule', { state: payload });
  };

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath="/taxi/user/rental" theme={theme} onToggleTheme={toggleTheme} />

      <section className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)_402px] gap-6 px-8 pb-20 pt-5 xl:px-12">
        <div>
          {/* --------------------------------------------------------- Breadcrumb */}
          <div className="flex items-center gap-3 text-[13.5px] font-semibold text-[var(--dh-muted)]">
            <button
              onClick={() => navigate('/taxi/user/rental?search=true')}
              className="flex items-center gap-2 font-bold text-[var(--dh-text)] hover:text-[#F5B700]"
            >
              <ArrowLeft size={16} strokeWidth={2.6} /> Back to Search Results
            </button>
            <ChevronRight size={14} />
            <span>{category}</span>
            <ChevronRight size={14} />
            <span className="text-[var(--dh-text)]">{vehicle.name}</span>
          </div>

          <div className="mt-4 rounded-[20px] bg-[var(--dh-surface)] p-6 ring-1 ring-[var(--dh-border)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-[30px] font-black tracking-[-0.035em] text-[var(--dh-text)]">{vehicle.name}</h1>
                  <span className="rounded-[9px] bg-[#FFF0B8] px-3 py-1 text-[13px] font-black text-slate-900">{category}</span>
                </div>
                {vehicle.short_description && (
                  <p className="mt-2 text-[14px] font-medium text-[var(--dh-muted)]">{vehicle.short_description}</p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                  {vehicle.capacity > 0 && (
                    <span className="flex items-center gap-2 text-[14px] font-semibold text-[var(--dh-text)]">
                      <Users size={17} className="text-[var(--dh-muted)]" strokeWidth={2.2} /> {vehicle.capacity} Seats
                    </span>
                  )}
                  {specs.transmission && (
                    <span className="flex items-center gap-2 text-[14px] font-semibold text-[var(--dh-text)]">
                      <Gauge size={17} className="text-[var(--dh-muted)]" strokeWidth={2.2} /> {specs.transmission}
                    </span>
                  )}
                  {specs.fuel && (
                    <span className="flex items-center gap-2 text-[14px] font-semibold text-[var(--dh-text)]">
                      <Fuel size={17} className="text-[var(--dh-muted)]" strokeWidth={2.2} /> {specs.fuel}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => setSaved((current) => !current)}
                  className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-[var(--dh-border)]"
                  aria-label={saved ? 'Remove from saved' : 'Save vehicle'}
                  aria-pressed={saved}
                >
                  <Heart size={18} className={saved ? 'fill-rose-500 text-rose-500' : 'text-[var(--dh-muted)]'} strokeWidth={2.2} />
                </button>
                <button
                  onClick={() => navigator.share?.({ title: vehicle.name, url: window.location.href })}
                  className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-[var(--dh-border)]"
                  aria-label="Share"
                >
                  <Share2 size={18} className="text-[var(--dh-muted)]" strokeWidth={2.2} />
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              {vehicle.advancePayment?.enabled && (
                <span className="flex items-center gap-1.5 rounded-[9px] bg-[#FFFBEC] px-3 py-2 text-[12.5px] font-bold text-slate-800">
                  <BadgeCheck size={15} className="text-[#F5B700]" strokeWidth={2.4} />
                  Book at {vehicle.advancePayment.paymentMode === 'percentage'
                    ? `${vehicle.advancePayment.amount}% advance`
                    : formatMoney(vehicle.advancePayment.amount)}
                </span>
              )}
              <span className="flex items-center gap-1.5 rounded-[9px] bg-emerald-50 px-3 py-2 text-[12.5px] font-bold text-emerald-700">
                <BadgeCheck size={15} strokeWidth={2.4} /> Free Cancellation
              </span>
              {selectedPlan?.includedKm === 0 && (
                <span className="flex items-center gap-1.5 rounded-[9px] bg-emerald-50 px-3 py-2 text-[12.5px] font-bold text-emerald-700">
                  <Gauge size={15} strokeWidth={2.4} /> Unlimited KM
                </span>
              )}
            </div>

            {/* ---------------------------------------------------------- Gallery */}
            {gallery.length > 0 && (
              <>
                <div className="relative mt-6 flex h-[330px] items-center justify-center rounded-[16px] bg-[var(--dh-chip)]">
                  <img src={gallery[imageIndex]} alt={vehicle.name} className="max-h-full max-w-full object-contain p-6" />

                  {gallery.length > 1 && (
                    <>
                      <button
                        onClick={() => setImageIndex((i) => (i - 1 + gallery.length) % gallery.length)}
                        className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--dh-surface)] shadow-md"
                        aria-label="Previous image"
                      >
                        <ChevronLeft size={19} className="text-[var(--dh-text)]" strokeWidth={2.6} />
                      </button>
                      <button
                        onClick={() => setImageIndex((i) => (i + 1) % gallery.length)}
                        className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--dh-surface)] shadow-md"
                        aria-label="Next image"
                      >
                        <ChevronRight size={19} className="text-[var(--dh-text)]" strokeWidth={2.6} />
                      </button>
                      <span className="absolute bottom-3 rounded-full bg-[var(--dh-surface)] px-3 py-1 text-[12px] font-bold text-[var(--dh-text)] shadow-sm">
                        {imageIndex + 1} / {gallery.length}
                      </span>
                    </>
                  )}
                </div>

                {gallery.length > 1 && (
                  <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                    {gallery.map((src, index) => (
                      <button
                        key={src}
                        onClick={() => setImageIndex(index)}
                        className={`h-[74px] w-[112px] shrink-0 overflow-hidden rounded-[12px] bg-[var(--dh-chip)] ring-2 transition-colors ${
                          index === imageIndex ? 'ring-[#F5B700]' : 'ring-transparent'
                        }`}
                      >
                        <img src={src} alt="" className="h-full w-full object-contain p-1.5" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ------------------------------------------- Specifications + features */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-[20px] bg-[var(--dh-surface)] p-6 ring-1 ring-[var(--dh-border)]">
              <h2 className="text-[19px] font-black tracking-[-0.02em] text-[var(--dh-text)]">Vehicle Specifications</h2>
              <dl className="mt-4 space-y-3">
                {specRows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between border-b border-[var(--dh-border)] pb-2.5 last:border-0">
                    <dt className="text-[13.5px] font-semibold text-[var(--dh-muted)]">{label}</dt>
                    <dd className="text-[13.5px] font-bold text-[var(--dh-text)]">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-[20px] bg-[var(--dh-surface)] p-6 ring-1 ring-[var(--dh-border)]">
              <h2 className="text-[19px] font-black tracking-[-0.02em] text-[var(--dh-text)]">Features</h2>
              {amenities.length ? (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {amenities.map((amenity) => (
                    <span key={amenity} className="flex items-center gap-2.5 text-[13.5px] font-semibold text-[var(--dh-text)]">
                      <Sparkles size={16} className="shrink-0 text-[#F5B700]" strokeWidth={2.2} />
                      {titleCase(amenity)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-[13.5px] font-medium text-[var(--dh-muted)]">
                  No features listed for this vehicle yet.
                </p>
              )}

              {vehicle.description && (
                <p className="mt-5 border-t border-[var(--dh-border)] pt-4 text-[13.5px] font-medium leading-[1.6] text-[var(--dh-muted)]">
                  {vehicle.description}
                </p>
              )}
            </div>
          </div>

          {/* --------------------------------------------------------- Why book */}
          <div className="mt-4 rounded-[20px] bg-[#FFFBEC] p-6">
            <p className="text-[14px] font-black text-slate-900">Why book with Taxi09?</p>
            <div className="mt-4 grid grid-cols-4 gap-4">
              {WHY_BOOK.map(({ icon: Icon, title, copy }) => (
                <div key={title} className="flex items-start gap-2.5">
                  <Icon size={24} className="mt-0.5 shrink-0 text-[#F5B700]" strokeWidth={2} />
                  <span>
                    <span className="block text-[13px] font-black text-slate-900">{title}</span>
                    <span className="mt-0.5 block text-[11.5px] font-semibold text-slate-600">{copy}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-4 rounded-[18px] bg-[var(--dh-surface)] px-6 py-5 ring-1 ring-[var(--dh-border)]">
            {ASSURANCES.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="flex items-center gap-3">
                <Icon size={24} className="shrink-0 text-[#F5B700]" strokeWidth={2} />
                <span>
                  <span className="block text-[13px] font-black text-[var(--dh-text)]">{title}</span>
                  <span className="mt-0.5 block text-[11.5px] font-semibold text-[var(--dh-muted)]">{copy}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------------- Sidebar */}
        <aside className="sticky top-[100px] h-fit space-y-4">
          <div className="rounded-[20px] bg-[var(--dh-surface)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-[var(--dh-border)]">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-black tracking-[-0.02em] text-[var(--dh-text)]">Select Your Plan</h2>
              <span className="text-[12.5px] font-bold text-[var(--dh-muted)]">Daily Price</span>
            </div>

            <div className="mt-4 space-y-2.5">
              {plans.map((plan) => {
                const id = String(plan.id || plan.packageId || '');
                const isActive = id === activePlanId;
                return (
                  <button
                    key={id}
                    onClick={() => setPlanId(id)}
                    className={`flex w-full items-center gap-3 rounded-[13px] border p-3.5 text-left transition-colors ${
                      isActive ? 'border-[#F5B700] bg-[#FFFCF2]' : 'border-[var(--dh-border)] hover:bg-[var(--dh-chip)]'
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${isActive ? 'border-[#F5B700]' : 'border-[var(--dh-border)]'}`}>
                      {isActive && <span className="h-2.5 w-2.5 rounded-full bg-[#F5B700]" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-black text-[var(--dh-text)]">
                        {plan.label || `${plan.durationHours || 24} Hours`}
                      </span>
                      <span className="block text-[11.5px] font-semibold text-[var(--dh-muted)]">
                        {plan.includedKm ? `${plan.includedKm} km included` : 'Unlimited KM'}
                        {plan.extraKmPrice ? ` · Extra ${formatMoney(plan.extraKmPrice)}/km` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[17px] font-black text-[var(--dh-text)]">{formatMoney(plan.price)}</span>
                    </span>
                  </button>
                );
              })}
              {plans.length === 0 && (
                <p className="rounded-[12px] bg-[var(--dh-chip)] px-4 py-5 text-center text-[13px] font-semibold text-[var(--dh-muted)]">
                  No plans configured for this vehicle.
                </p>
              )}
            </div>

            {/* Price summary - every figure comes from the server quote */}
            <div className="mt-5 border-t border-[var(--dh-border)] pt-4">
              <h3 className="text-[15px] font-black text-[var(--dh-text)]">Price Summary</h3>

              {quote ? (
                <div className="mt-3 space-y-2.5">
                  <div className="flex justify-between text-[13.5px] font-semibold text-[var(--dh-muted)]">
                    <span>Base Fare</span>
                    <span className="text-[var(--dh-text)]">{formatMoney(quote.packagePrice)}</span>
                  </div>
                  {quote.addOnsTotal > 0 && (
                    <div className="flex justify-between text-[13.5px] font-semibold text-[var(--dh-muted)]">
                      <span>Add-ons</span>
                      <span className="text-[var(--dh-text)]">{formatMoney(quote.addOnsTotal)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-[var(--dh-border)] pt-3">
                    <span className="text-[15px] font-black text-[var(--dh-text)]">Total Amount</span>
                    <span className="text-[19px] font-black text-[var(--dh-text)]">{formatMoney(quote.totalCost)}</span>
                  </div>
                  {quote.payableNow > 0 && (
                    <div className="flex justify-between text-[13px] font-bold text-[var(--dh-muted)]">
                      <span>{quote.advancePayment?.label || 'Pay now'}</span>
                      <span className="text-[var(--dh-text)]">{formatMoney(quote.payableNow)}</span>
                    </div>
                  )}
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

            {vehicle.advancePayment?.enabled && quote && (
              <div className="mt-4 flex items-start gap-2.5 rounded-[12px] bg-emerald-50 p-3.5">
                <ShieldCheck size={20} className="mt-0.5 shrink-0 text-emerald-600" strokeWidth={2.2} />
                <span>
                  <span className="block text-[13px] font-black text-emerald-800">Book with a part payment</span>
                  <span className="mt-0.5 block text-[11.5px] font-semibold text-emerald-700">
                    Pay {formatMoney(quote.payableNow)} now, {formatMoney(quote.balanceDue)} at pickup.
                  </span>
                </span>
              </div>
            )}

            <button
              onClick={continueToBook}
              disabled={!selectedPlan}
              className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-[13px] bg-[#F5B700] py-3.5 text-[15.5px] font-bold text-slate-950 shadow-[0_10px_24px_rgba(245,183,0,0.3)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue to Book <ArrowRight size={18} strokeWidth={2.8} />
            </button>

            <button
              onClick={() => navigate('/taxi/user/support')}
              className="mt-2.5 flex w-full items-center justify-center gap-2.5 rounded-[13px] border border-[var(--dh-border)] py-3 text-[14.5px] font-bold text-[var(--dh-text)] hover:bg-[var(--dh-chip)]"
            >
              <MessageCircle size={17} strokeWidth={2.4} /> Chat with Partner
            </button>
          </div>

          <div className="rounded-[18px] bg-[#FFFBEC] p-5">
            <p className="text-[14px] font-black text-slate-900">Need help choosing the right car?</p>
            <p className="mt-1 text-[12.5px] font-semibold text-slate-600">Our experts are here to assist you</p>
            <button
              onClick={() => navigate('/taxi/user/support')}
              className="mt-3.5 flex items-center gap-2 rounded-[11px] bg-[var(--dh-surface)] px-4 py-2.5 text-[13.5px] font-bold text-[var(--dh-text)] ring-1 ring-[var(--dh-border)]"
            >
              <Phone size={15} strokeWidth={2.6} /> Call Us Now
            </button>
          </div>

          <p className="flex items-start gap-2 px-1 text-[11.5px] font-medium text-[var(--dh-muted)]">
            <Info size={14} className="mt-0.5 shrink-0" strokeWidth={2.2} />
            Final taxes are confirmed on the review step before payment.
          </p>
        </aside>
      </section>

      <AiChatBubble />
    </div>
  );
};

export default DesktopVehicleDetail;
