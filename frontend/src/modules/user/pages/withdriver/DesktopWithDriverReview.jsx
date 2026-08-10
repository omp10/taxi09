import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BadgeCheck, Calendar, Car, CheckCircle2, Clock, CreditCard,
  Headphones, Languages, MapPin, Palette, Route, ShieldCheck, Sparkles, Star, Ticket, Users, Wallet,
} from 'lucide-react';
import { DesktopNav } from '../../components/desktop/DesktopChrome';
import { useDesktopTheme } from '../../components/desktop/desktopShared';
import { useAppGoogleMapsLoader } from '../../../admin/utils/googleMaps';

/**
 * Desktop "Review & Confirm" step for a with-driver booking.
 *
 * Reads the driver and the server fare quote captured on the previous step -
 * it never recomputes a total, so what was quoted is what is shown.
 */

const STEPS = ['Search Ride', 'Select Driver', 'Review & Confirm', 'Payment', 'Confirmed'];
const CURRENT_STEP = 2;

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: Sparkles },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'netbanking', label: 'Net Banking', icon: Wallet },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
];

const BENEFITS = [
  { icon: BadgeCheck, title: 'No Hidden Charges', copy: 'Transparent pricing' },
  { icon: Clock, title: 'On-time Pickup', copy: 'Your time, our priority' },
  { icon: Headphones, title: '24/7 Support', copy: "We're always here" },
];

const FOOTER_NOTES = [
  { icon: Ticket, title: 'Free Cancellation', copy: 'Cancel till 30 mins before pickup' },
  { icon: MapPin, title: 'Live Tracking', copy: 'Share your ride with family' },
  { icon: ShieldCheck, title: 'Verified Drivers', copy: 'Background verified & trained' },
  { icon: Headphones, title: '24/7 Customer Support', copy: "We're always here to help" },
];

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const formatDate = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'long' });
};

const DesktopWithDriverReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, toggleTheme] = useDesktopTheme();
  const [method, setMethod] = useState('upi');

  const stored = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem('taxi:hire-driver-pending') || 'null');
    } catch {
      return null;
    }
  }, []);

  const state = location.state || stored || {};
  const { driver, trip = {}, quote } = state;

  const { isLoaded: mapsReady } = useAppGoogleMapsLoader();
  const [confirming, setConfirming] = useState(false);

  // The previous step captures pickup and drop as text, so the coordinates the
  // dispatcher needs are resolved here. Only if that fails does the booking
  // fall back to the location picker, rather than sending every guest back
  // through a step they have already completed.
  const geocode = (address) =>
    new Promise((resolve) => {
      if (!address || !mapsReady || !window.google?.maps?.Geocoder) {
        resolve(null);
        return;
      }

      new window.google.maps.Geocoder().geocode(
        { address, componentRestrictions: { country: 'IN' } },
        (results, status) => {
          const point = status === 'OK' ? results?.[0]?.geometry?.location : null;
          resolve(point ? [point.lng(), point.lat()] : null);
        },
      );
    });

  const confirmAndPay = async () => {
    setConfirming(true);
    const [pickupCoords, dropCoords] = await Promise.all([geocode(trip.pickup), geocode(trip.drop)]);
    setConfirming(false);

    if (!pickupCoords || !dropCoords) {
      // Could not place one of the addresses: collect them properly instead of
      // dispatching a ride to the wrong point.
      navigate('/taxi/user/ride/select-location', { state });
      return;
    }

    const distanceKm = Number(quote?.distanceKm || 0);

    navigate('/taxi/user/ride/searching', {
      state: {
        pickup: trip.pickup,
        drop: trip.drop,
        pickupCoords,
        dropCoords,
        // Base fare only: the server re-prices the journey options from its own
        // catalogue, so sending the quoted total would double-charge.
        fare: quote?.baseFare ?? quote?.totalFare ?? 0,
        baseFare: quote?.baseFare ?? quote?.totalFare ?? 0,
        paymentMethod: method === 'wallet' ? 'Wallet' : 'Cash',
        serviceType: 'hire_driver',
        hireDriver: {
          hireType: trip.hireType || '',
          tripType: trip.tripType || '',
          driverPreference: driver?._id || driver?.id || '',
          travelDate: trip.date || '',
          travelTime: trip.time || '',
        },
        estimatedDistanceMeters: Math.round(distanceKm * 1000),
        estimatedDurationMinutes: Number(quote?.durationMinutes || Math.round(distanceKm * 1.6)),
        vehicleTypeId: quote?.vehicleClassId || '',
        vehicleIconType: 'car',
        transport_type: 'taxi',
        vehicle: {
          vehicleTypeId: quote?.vehicleClassId || '',
          name: quote?.vehicleClassName || 'Driver Service',
          iconType: 'car',
          price: quote?.totalFare ?? 0,
          transportType: 'taxi',
        },
        searchNonce: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
    });
  };

  if (!driver) {
    return (
      <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
        <DesktopNav activePath="/taxi/user/with-driver" theme={theme} onToggleTheme={toggleTheme} />
        <div className="mx-auto max-w-[1440px] px-8 py-24 text-center xl:px-12">
          <p className="text-[19px] font-black text-[var(--dh-text)]">No driver selected</p>
          <button
            onClick={() => navigate('/taxi/user/with-driver')}
            className="mt-5 rounded-[12px] bg-[#F5B700] px-6 py-3 text-[16.5px] font-bold text-slate-950"
          >
            Choose a driver
          </button>
        </div>
      </div>
    );
  }

  const tripFacts = [
    ['Pickup Location', trip.pickup, MapPin],
    ['Drop Location', trip.drop, MapPin],
    ['Date & Time', [formatDate(trip.date), trip.time].filter(Boolean).join(', '), Calendar],
    ['Vehicle', quote ? `${quote.vehicleClassName}${quote.seats ? ` · ${quote.seats} Seats` : ''}` : '', Car],
    ['Distance & Time', quote ? `${quote.distanceKm} km${quote.durationMinutes ? ` · ~${quote.durationMinutes} mins` : ''}` : '', Route],
  ].filter(([, value]) => value);

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath="/taxi/user/with-driver" theme={theme} onToggleTheme={toggleTheme} />

      <section className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)_388px] gap-6 px-8 pb-20 pt-5 xl:px-12">
        <div className="rounded-[20px] bg-[var(--dh-surface)] p-7 ring-1 ring-[var(--dh-border)]">
          {/* ------------------------------------------------------------ Stepper */}
          <ol className="flex items-center gap-3">
            {STEPS.map((label, index) => {
              const isDone = index < CURRENT_STEP;
              const isCurrent = index === CURRENT_STEP;
              return (
                <li key={label} className="flex flex-1 items-center gap-2.5 last:flex-none">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      isCurrent ? 'bg-[#F5B700] text-slate-950'
                        : isDone ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-[var(--dh-chip)] text-[var(--dh-muted)]'
                    }`}
                  >
                    {isDone ? <CheckCircle2 size={18} strokeWidth={2.4} /> : <span className="text-[15.5px] font-black">{index + 1}</span>}
                  </span>
                  <span className={`whitespace-nowrap text-[15px] font-bold ${isCurrent ? 'text-[var(--dh-text)]' : 'text-[var(--dh-muted)]'}`}>
                    {label}
                  </span>
                  {index < STEPS.length - 1 && (
                    <span className={`h-[2px] flex-1 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-[var(--dh-border)]'}`} />
                  )}
                </li>
              );
            })}
          </ol>

          <div className="mt-8 flex items-start justify-between gap-6">
            <div>
              <h1 className="text-[28px] font-black tracking-[-0.035em] text-[var(--dh-text)]">Review Your Ride</h1>
              <p className="mt-1.5 text-[15.5px] font-medium text-[var(--dh-muted)]">
                Please review the trip details and driver information before confirming your booking.
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-2.5 rounded-[12px] bg-[#FFFBEC] px-4 py-3">
              <ShieldCheck size={22} className="text-[#F5B700]" strokeWidth={2.1} />
              <span>
                <span className="block text-[14.5px] font-black text-slate-900">Secure Booking</span>
                <span className="block text-[13px] font-semibold text-slate-600">Your data is safe with us</span>
              </span>
            </span>
          </div>

          {/* ------------------------------------------------------- Trip facts */}
          {tripFacts.length > 0 && (
            <div className="mt-6 grid grid-cols-5 divide-x divide-[var(--dh-border)] rounded-[16px] border border-[var(--dh-border)] py-4">
              {tripFacts.map(([label, value, Icon]) => (
                <div key={label} className="px-4">
                  <span className="flex items-center gap-1.5 text-[13.5px] font-bold text-[var(--dh-muted)]">
                    <Icon size={14} className="text-[#F5B700]" strokeWidth={2.4} /> {label}
                  </span>
                  <p className="mt-1.5 text-[15px] font-bold leading-snug text-[var(--dh-text)]">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* ----------------------------------------------------------- Driver */}
          <div className="mt-4 rounded-[16px] border border-[var(--dh-border)] p-5">
            <h2 className="text-[18px] font-black text-[var(--dh-text)]">Your Driver</h2>

            <div className="mt-4 grid grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-5">
              <div className="flex items-center gap-3.5">
                <span className="relative h-[86px] w-[86px] shrink-0 overflow-hidden rounded-full bg-[var(--dh-chip)]">
                  {driver.photo ? (
                    <img src={driver.photo} alt={driver.name} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <Users size={30} className="absolute inset-0 m-auto text-[var(--dh-muted)]" strokeWidth={1.8} />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[19px] font-black text-[var(--dh-text)]">{driver.name}</span>
                  {Number(driver.rating) > 0 && (
                    <span className="mt-1 flex items-center gap-1.5">
                      <Star size={14} className="fill-[#F5B700] text-[#F5B700]" />
                      <span className="text-[14.5px] font-black text-[var(--dh-text)]">{driver.rating}</span>
                      {driver.trips && <span className="text-[13.5px] font-semibold text-[var(--dh-muted)]">({driver.trips} trips)</span>}
                    </span>
                  )}
                  {driver.verified && (
                    <span className="mt-1.5 flex items-center gap-1.5 text-[13.5px] font-bold text-emerald-700">
                      <ShieldCheck size={14} strokeWidth={2.3} /> Verified Driver
                    </span>
                  )}
                </span>
              </div>

              <div className="flex min-w-0 items-center gap-4 border-l border-[var(--dh-border)] pl-5">
                {driver.vehicleImage && (
                  <span className="relative h-[64px] w-[100px] shrink-0">
                    <img src={driver.vehicleImage} alt="" className="absolute inset-0 h-full w-full object-contain" />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[16.5px] font-black text-[var(--dh-text)]">{driver.vehicleName || 'Vehicle on assignment'}</span>
                    {driver.vehicleClass && (
                      <span className="shrink-0 rounded-[7px] bg-[var(--dh-chip)] px-2 py-0.5 text-[13px] font-bold text-[var(--dh-muted)]">
                        {driver.vehicleClass}
                      </span>
                    )}
                  </span>
                  {driver.vehiclePlate && (
                    <span className="mt-1.5 flex items-center gap-1.5 text-[14px] font-semibold text-[var(--dh-muted)]">
                      <Car size={13} strokeWidth={2.2} /> {driver.vehiclePlate}
                    </span>
                  )}
                  {driver.vehicleColor && (
                    <span className="mt-1 flex items-center gap-1.5 text-[14px] font-semibold text-[var(--dh-muted)]">
                      <Palette size={13} strokeWidth={2.2} /> {driver.vehicleColor}
                    </span>
                  )}
                  {driver.experience && (
                    <span className="mt-1 block text-[14px] font-semibold text-[var(--dh-muted)]">{driver.experience} Experience</span>
                  )}
                  {driver.languages?.length > 0 && (
                    <span className="mt-1 flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--dh-muted)]">
                      <Languages size={13} strokeWidth={2.2} /> {driver.languages.join(', ')}
                    </span>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 border-l border-[var(--dh-border)] pl-5">
                {(driver.amenities?.length ? driver.amenities : []).map((amenity) => (
                  <span key={amenity} className="flex items-center gap-2 text-[14px] font-semibold text-[var(--dh-text)]">
                    <Sparkles size={14} className="shrink-0 text-[#F5B700]" strokeWidth={2.2} /> {amenity}
                  </span>
                ))}
                {!driver.amenities?.length && (
                  <span className="col-span-2 text-[13.5px] font-semibold text-[var(--dh-muted)]">
                    No vehicle features listed.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------- Fare breakdown */}
          {quote && (
            <div className="mt-4 rounded-[16px] border border-[var(--dh-border)] p-5">
              <h2 className="text-[18px] font-black text-[var(--dh-text)]">Fare Breakdown</h2>

              <div className="mt-4 grid grid-cols-[repeat(4,minmax(0,1fr))_260px] items-center gap-4">
                {[
                  ['Base Fare', '', quote.baseFare],
                  ['Distance Fare', `(${quote.chargeableKm} km)`, quote.distanceFare],
                  ['Time Fare', `(${quote.durationMinutes} mins)`, quote.timeFare],
                  ['Taxes & Fees', quote.taxPercent ? `(${quote.taxPercent}%)` : '', quote.taxes],
                ].map(([label, note, value]) => (
                  <div key={label} className="border-r border-[var(--dh-border)] pr-4 last:border-0">
                    <p className="text-[14.5px] font-semibold text-[var(--dh-muted)]">
                      {label} {note && <span className="block text-[13.5px]">{note}</span>}
                    </p>
                    <p className="mt-2 text-[18px] font-black text-[var(--dh-text)]">{formatMoney(value)}</p>
                  </div>
                ))}

                <div className="rounded-[13px] bg-[#FFFBEC] px-5 py-4">
                  <p className="text-[14.5px] font-bold text-slate-700">Total Amount</p>
                  <p className="mt-1 text-[26px] font-black leading-none text-slate-950">{formatMoney(quote.totalFare)}</p>
                  <p className="mt-1.5 text-[13px] font-semibold text-slate-600">
                    {quote.taxes > 0 ? 'Inclusive of all taxes' : 'Taxes not configured'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] gap-4">
            <div className="rounded-[16px] border border-[var(--dh-border)] p-5">
              <h3 className="text-[16.5px] font-black text-[var(--dh-text)]">Best Price Benefits</h3>
              <div className="mt-3.5 space-y-3">
                {BENEFITS.map(({ icon: Icon, title, copy }) => (
                  <span key={title} className="flex items-center gap-3">
                    <Icon size={20} className="shrink-0 text-[#F5B700]" strokeWidth={2.1} />
                    <span>
                      <span className="block text-[14px] font-black text-[var(--dh-text)]">{title}</span>
                      <span className="block text-[13px] font-semibold text-[var(--dh-muted)]">{copy}</span>
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[16px] border border-[var(--dh-border)] p-5">
              <h3 className="text-[16.5px] font-black text-[var(--dh-text)]">Payment Options</h3>
              <div className="mt-3.5 grid grid-cols-4 gap-2.5">
                {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setMethod(id)}
                    aria-pressed={method === id}
                    className={`flex flex-col items-center gap-2 rounded-[12px] border py-3.5 transition-colors ${
                      method === id ? 'border-[#F5B700] bg-[#FFFCF2]' : 'border-[var(--dh-border)] hover:bg-[var(--dh-chip)]'
                    }`}
                  >
                    <Icon size={20} className="text-[var(--dh-muted)]" strokeWidth={2} />
                    <span className="text-[13.5px] font-bold text-[var(--dh-text)]">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-4 rounded-[16px] bg-[#FFFBEC] px-6 py-5">
            {FOOTER_NOTES.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="flex items-center gap-3">
                <Icon size={22} className="shrink-0 text-[#F5B700]" strokeWidth={2} />
                <span>
                  <span className="block text-[14px] font-black text-slate-900">{title}</span>
                  <span className="mt-0.5 block text-[13px] font-semibold text-slate-600">{copy}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------------ Sidebar */}
        <aside className="sticky top-[100px] h-fit rounded-[20px] bg-[var(--dh-surface)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-[var(--dh-border)]">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-black tracking-[-0.02em] text-[var(--dh-text)]">Your Trip Summary</h2>
            <button onClick={() => navigate('/taxi/user/with-driver')} className="text-[14.5px] font-bold text-[#F5B700]">
              Edit
            </button>
          </div>

          <dl className="mt-4 space-y-3.5">
            {tripFacts.map(([label, value, Icon]) => (
              <div key={label} className="flex gap-2.5">
                <Icon size={16} className="mt-0.5 shrink-0 text-[var(--dh-muted)]" strokeWidth={2.2} />
                <span className="min-w-0">
                  <dt className="text-[14px] font-bold text-[var(--dh-text)]">{label}</dt>
                  <dd className="mt-0.5 text-[14px] font-semibold text-[var(--dh-muted)]">{value}</dd>
                </span>
              </div>
            ))}
          </dl>

          {quote && (
            <div className="mt-5 border-t border-[var(--dh-border)] pt-4">
              <h3 className="text-[16.5px] font-black text-[var(--dh-text)]">Fare Details</h3>
              <div className="mt-3 space-y-2.5">
                <div className="flex justify-between text-[14.5px] font-semibold text-[var(--dh-muted)]">
                  <span>Base Fare</span><span className="text-[var(--dh-text)]">{formatMoney(quote.baseFare)}</span>
                </div>
                {quote.distanceFare > 0 && (
                  <div className="flex justify-between text-[14.5px] font-semibold text-[var(--dh-muted)]">
                    <span>Distance Fare ({quote.chargeableKm} km)</span>
                    <span className="text-[var(--dh-text)]">{formatMoney(quote.distanceFare)}</span>
                  </div>
                )}
                {quote.timeFare > 0 && (
                  <div className="flex justify-between text-[14.5px] font-semibold text-[var(--dh-muted)]">
                    <span>Time Fare ({quote.durationMinutes} mins)</span>
                    <span className="text-[var(--dh-text)]">{formatMoney(quote.timeFare)}</span>
                  </div>
                )}
                {quote.taxes > 0 && (
                  <div className="flex justify-between text-[14.5px] font-semibold text-[var(--dh-muted)]">
                    <span>Taxes &amp; Fees</span><span className="text-[var(--dh-text)]">{formatMoney(quote.taxes)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-[var(--dh-border)] pt-3">
                  <span className="text-[16.5px] font-black text-[var(--dh-text)]">Total Amount</span>
                  <span className="text-[20px] font-black text-[var(--dh-text)]">{formatMoney(quote.totalFare)}</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={confirmAndPay}
            disabled={!quote || confirming}
            className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-[13px] bg-[#F5B700] py-3.5 text-[17px] font-bold text-slate-950 shadow-[0_10px_24px_rgba(245,183,0,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirm &amp; Pay <ArrowRight size={18} strokeWidth={2.8} />
          </button>

          <button
            onClick={() => navigate('/taxi/user/with-driver')}
            className="mt-2.5 flex w-full items-center justify-center gap-2.5 rounded-[13px] border border-[var(--dh-border)] py-3 text-[16px] font-bold text-[var(--dh-text)] hover:bg-[var(--dh-chip)]"
          >
            <ArrowLeft size={17} strokeWidth={2.4} /> Back to Select Driver
          </button>
        </aside>
      </section>
    </div>
  );
};

export default DesktopWithDriverReview;
