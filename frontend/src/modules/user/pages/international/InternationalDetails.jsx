import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BadgeCheck,
  CalendarCheck,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  Headset,
  Luggage,
  MapPin,
  Plane,
  ShieldCheck,
  Star,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import { fetchPackageBySlug, recallPackage } from '../../utils/packageHandoff';
import AppHeader from '../../components/AppHeader';
import api from '../../../../shared/api/axiosInstance';
import { payForBooking } from '../../utils/bookingCheckout';

const getRoutePrefix = (pathname = '') => (pathname.startsWith('/taxi/user') ? '/taxi/user' : '');

// Indian levies on overseas tour packages: 5% GST, plus 5% TCS under s.206C(1G)
// for spends up to Rs7 lakh a year.
const GST_RATE = 0.05;
const TCS_RATE = 0.05;
const VISA_FEE_PER_PERSON = 2500;
const INSURANCE_PER_PERSON = 1200;
const COUPONS = { GLOBAL10: 0.1, FLYFREE: 0.15 };

const Row = ({ label, value, tone = '', hint = '' }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="min-w-0">
      <span className="block text-[var(--text-light)]">{label}</span>
      {hint ? <span className="block text-[9px] font-medium text-slate-400">{hint}</span> : null}
    </span>
    <span className={`shrink-0 ${tone}`}>{value}</span>
  </div>
);

const rupees = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const PERK_ICONS = {
  'Visa Assistance': BadgeCheck,
  'Return Flights': Plane,
  'Airport Transfers': Luggage,
  'Guided Tours': Camera,
  'All Meals': Utensils,
  'Travel Insurance': ShieldCheck,
};

const EXCLUSIONS = [
  'Visa fees payable at embassy',
  'Personal expenses & tips',
  'Optional activities',
  'Anything not in inclusions',
];

const POLICIES = [
  { icon: ShieldCheck, title: 'Secure Booking', sub: '100% safe & secure payments' },
  { icon: CalendarCheck, title: 'Free cancellation', sub: 'Up to 21 days before departure' },
  { icon: Headset, title: '24/7 Support', sub: 'On-trip assistance in your timezone' },
];

/** Day plan built from the trip's own stops so it always matches the route. */
const buildItinerary = (trip) => {
  const stops = Array.isArray(trip?.stops) ? trip.stops : [];
  const days = Number(trip?.durationDays) || stops.length || 1;

  return Array.from({ length: days }, (_, index) => {
    if (index === 0) {
      return {
        day: 1,
        title: `Fly to ${stops[0] || trip?.country}`,
        detail: 'Arrival, immigration assistance, private transfer and hotel check-in.',
      };
    }
    if (index === days - 1) {
      return { day: days, title: 'Departure', detail: 'Breakfast, check-out and transfer to the airport for your return flight.' };
    }
    const stop = stops[Math.min(index, stops.length - 1)];
    return { day: index + 1, title: stop, detail: `Guided day in ${stop} with entry tickets and free time for shopping.` };
  });
};

const InternationalDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug: slugParam } = useParams();
  const routePrefix = useMemo(() => getRoutePrefix(location.pathname), [location.pathname]);
  // Fall back to the stored handoff so a reload or a direct hit still works.
  const recalledTrip = useMemo(() => recallPackage('international'), []);
  const [fetchedTrip, setFetchedTrip] = useState(null);
  const trip = location.state?.trip || recalledTrip || fetchedTrip;

  // A shared link arrives with only a slug - load it.
  useEffect(() => {
    if (trip || !slugParam) return undefined;
    let cancelled = false;
    fetchPackageBySlug(slugParam).then((result) => { if (!cancelled) setFetchedTrip(result); });
    return () => { cancelled = true; };
  }, [trip, slugParam]);

  const [slide, setSlide] = useState(0);
  const [openDay, setOpenDay] = useState(1);
  const [travellers, setTravellers] = useState(2);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [withVisa, setWithVisa] = useState(true);
  const [withInsurance, setWithInsurance] = useState(true);
  const [quote, setQuote] = useState(null);
  const [paying, setPaying] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState('');

  const itinerary = useMemo(() => buildItinerary(trip), [trip]);
  const gallery = useMemo(() => {
    const list = Array.isArray(trip?.gallery) && trip.gallery.length ? trip.gallery : [trip?.image];
    return list.filter(Boolean);
  }, [trip]);

  const selectedAddOns = useMemo(
    () => [withVisa ? 'visa' : null, withInsurance ? 'insurance' : null].filter(Boolean),
    [withVisa, withInsurance],
  );

  // Same quote endpoint the desktop page uses.
  useEffect(() => {
    if (!trip?.slug) return undefined;
    let cancelled = false;
    api
      .post('/users/travel-packages/quote', {
        slug: trip.slug,
        travellers,
        couponCode: coupon,
        addOns: selectedAddOns,
      })
      .then((response) => { if (!cancelled) setQuote(response?.data?.data ?? response?.data ?? null); })
      .catch(() => { if (!cancelled) setQuote(null); });
    return () => { cancelled = true; };
  }, [trip?.slug, travellers, coupon, selectedAddOns]);

  if (!trip) {
    // With a slug in the URL the fetch is still in flight, so hold rather than
    // bouncing the visitor straight back to the listing.
    if (slugParam) return null;
    navigate(`${routePrefix}/international`, { replace: true });
    return null;
  }

  const off = Math.round(((trip.oldPrice - trip.price) / trip.oldPrice) * 100);


  const confirmAndPay = async () => {
    setPaying(true);
    try {
      const response = await api.post('/users/package-bookings', {
        slug: trip.slug,
        travellers,
        couponCode: coupon,
        addOns: selectedAddOns,
      });
      const created = response?.data?.data ?? response?.data;

      const paid = await payForBooking({
        kind: 'package',
        bookingId: created._id,
        name: trip.title,
        description: `${travellers} traveller(s) · ${created.bookingReference}`,
      });

      if (!paid) {
        toast('Payment cancelled - your booking is saved in My Bookings');
        return;
      }
      setSheetOpen(false);
      toast.success(`Booking confirmed · ${paid.bookingReference}`);
      navigate(`${routePrefix}/activity`);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Could not complete this booking');
    } finally {
      setPaying(false);
    }
  };
  // Priced by the server, same endpoint the desktop page uses.
  const baseFare = quote?.baseFare ?? 0;
  const visaTotal = quote?.addOns?.find((a) => a.id === 'visa')?.price ?? 0;
  const insuranceTotal = quote?.addOns?.find((a) => a.id === 'insurance')?.price ?? 0;
  const gst = quote?.gst ?? 0;
  const tcs = quote?.tcs ?? 0;
  const discount = quote?.discount ?? 0;
  const grandTotal = quote?.totalAmount ?? 0;
  const total = grandTotal;

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (!COUPONS[code]) {
      toast.error(`${code} is not a valid coupon`);
      return;
    }
    setCoupon(code);
    toast.success(`${code} applied - ${Math.round(COUPONS[code] * 100)}% off the package fare`);
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-[var(--background)] pb-32 text-[var(--text)]">
      <AppHeader showBack subtitle="TRIP DETAILS" />

      {/* Gallery */}
      <section className="relative h-[210px] overflow-hidden bg-slate-900">
        {gallery.map((image, index) => (
          <img
            key={`${image}-${index}`}
            src={image}
            alt={trip.title}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              index === slide ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />

        <span className={`absolute left-3 top-3 z-10 rounded-[6px] px-2 py-0.5 text-[8px] font-extrabold tracking-wide ${trip.badgeTone}`}>
          {trip.badge}
        </span>

        {gallery.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => setSlide((i) => (i - 1 + gallery.length) % gallery.length)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
            >
              <ChevronLeft size={15} strokeWidth={2.8} />
            </button>
            <button
              type="button"
              onClick={() => setSlide((i) => (i + 1) % gallery.length)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
            >
              <ChevronRight size={15} strokeWidth={2.8} />
            </button>
            <span className="absolute right-3 top-3 z-10 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
              {slide + 1}/{gallery.length}
            </span>
          </>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 z-10 p-3.5">
          <h1 className="text-[20px] font-extrabold leading-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)]">
            {trip.title}
          </h1>
          <p className="mt-1 flex items-center gap-1 text-[10.5px] font-semibold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
            <MapPin size={11} className="shrink-0" /> {trip.country}
            <span className="opacity-60">•</span>
            <Clock3 size={11} className="shrink-0" /> {trip.days}
          </p>
        </div>
      </section>

      <main className="space-y-3 px-3 pt-3">
        {/* Rating + price */}
        <section className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--border)] bg-white p-3.5 shadow-[var(--shadow-sm)]">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[13px] font-extrabold">
              <Star size={13} className="fill-[var(--primary)] text-[var(--primary)]" />
              {trip.rating}
              <span className="text-[10px] font-medium text-[var(--text-light)]">({trip.reviews} reviews)</span>
            </p>
            <p className="mt-1 truncate text-[10px] font-semibold text-[var(--text-light)]">{trip.stops.join(' • ')}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="flex items-baseline justify-end gap-1.5">
              <span className="text-[10px] font-medium text-slate-400 line-through">{rupees(trip.oldPrice)}</span>
              <span className="text-[18px] font-extrabold leading-none">{rupees(trip.price)}</span>
            </p>
            <p className="text-[9px] font-medium text-[var(--text-light)]">per person · {off}% off</p>
          </div>
        </section>

        {/* Trip facts */}
        <section className="grid grid-cols-3 gap-2">
          {[
            { icon: Clock3, label: 'Duration', value: trip.days },
            { icon: CalendarCheck, label: 'Departs', value: trip.departure },
            { icon: Plane, label: 'Country', value: trip.country },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-[14px] border border-[var(--border)] bg-white px-2 py-2.5 text-center shadow-[var(--shadow-sm)]">
              <Icon size={15} className="mx-auto text-[var(--primary-dark)]" />
              <p className="mt-1 text-[8.5px] font-bold uppercase tracking-[0.1em] text-[var(--text-light)]">{label}</p>
              <p className="mt-0.5 truncate text-[10px] font-extrabold">{value}</p>
            </div>
          ))}
        </section>

        {/* Itinerary */}
        <section className="rounded-[16px] border border-[var(--border)] bg-white p-3.5 shadow-[var(--shadow-sm)]">
          <h2 className="text-[14px] font-extrabold">Day-wise Itinerary</h2>
          <div className="mt-2.5 space-y-2">
            {itinerary.map(({ day, title, detail }) => {
              const open = openDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setOpenDay(open ? 0 : day)}
                  className={`w-full rounded-[12px] border px-3 py-2.5 text-left transition-colors ${
                    open ? 'border-[var(--primary)] bg-[var(--secondary)]' : 'border-[var(--border)] bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-extrabold">
                      D{day}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12px] font-extrabold">{title}</span>
                    <ChevronDown size={14} className={`shrink-0 text-[var(--text-light)] transition-transform ${open ? 'rotate-180' : ''}`} />
                  </div>
                  {open ? (
                    <p className="mt-2 pl-9 text-[10.5px] font-medium leading-[1.5] text-[var(--text-light)]">{detail}</p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        {/* Inclusions */}
        <section className="rounded-[16px] border border-[var(--border)] bg-white p-3.5 shadow-[var(--shadow-sm)]">
          <h2 className="text-[14px] font-extrabold">What&apos;s Included</h2>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            {trip.perks.map((perk) => {
              const Icon = PERK_ICONS[perk] || CircleCheck;
              return (
                <span key={perk} className="flex items-center gap-2 rounded-[10px] bg-[var(--secondary)] px-2.5 py-2 text-[10.5px] font-semibold">
                  <Icon size={13} className="shrink-0 text-[var(--primary-dark)]" />
                  <span className="truncate">{perk}</span>
                </span>
              );
            })}
          </div>

          <div className="mt-3 border-t border-[var(--border)] pt-3">
            <h3 className="text-[12px] font-extrabold text-[var(--text-light)]">Not included</h3>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              {EXCLUSIONS.map((item) => (
                <span key={item} className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-light)]">
                  <X size={10} className="shrink-0 text-[var(--danger)]" /> {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Travellers */}
        <section className="flex items-center justify-between rounded-[16px] border border-[var(--border)] bg-white p-3.5 shadow-[var(--shadow-sm)]">
          <div>
            <p className="flex items-center gap-1.5 text-[13px] font-extrabold">
              <Users size={14} className="text-[var(--primary-dark)]" /> Travellers
            </p>
            <p className="mt-0.5 text-[9.5px] font-medium text-[var(--text-light)]">Price scales per person</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={travellers <= 1}
              onClick={() => setTravellers((n) => Math.max(1, n - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[16px] font-extrabold disabled:opacity-30"
            >
              −
            </button>
            <span className="w-5 text-center text-[14px] font-extrabold">{travellers}</span>
            <button
              type="button"
              disabled={travellers >= 12}
              onClick={() => setTravellers((n) => Math.min(12, n + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--primary)] bg-[var(--secondary)] text-[16px] font-extrabold text-[var(--primary-dark)] disabled:opacity-30"
            >
              +
            </button>
          </div>
        </section>

        {/* Policies */}
        <section className="rounded-[16px] border border-[var(--border)] bg-[#fffdf6] p-3.5 shadow-[var(--shadow-sm)]">
          {POLICIES.map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-2.5 py-1.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)]">
                <Icon size={15} className="text-[var(--primary-dark)]" />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-extrabold leading-tight">{title}</span>
                <span className="block text-[9.5px] font-medium text-[var(--text-light)]">{sub}</span>
              </span>
            </div>
          ))}
        </section>
      </main>

      {/* Sticky bar */}
      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-lg -translate-x-1/2 border-t border-[var(--border)] bg-white px-4 pb-6 pt-3">
        <div className="mb-2.5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[19px] font-extrabold leading-none">{rupees(total)}</p>
            <p className="truncate text-[9.5px] font-medium text-[var(--text-light)]">
              {travellers} traveller{travellers > 1 ? 's' : ''} × {rupees(trip.price)} · incl. taxes
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-[var(--success)]">
            <Check size={11} strokeWidth={3} /> {off}% off
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(180deg,#FFD54F,#FFC107)] py-3.5 text-[15px] font-extrabold shadow-[0_8px_20px_rgba(255,193,7,.4)] active:scale-[0.99] transition-transform"
        >
          Book This Trip <ChevronRight size={18} strokeWidth={2.8} />
        </button>
      </div>
      {/* Fare sheet */}
      {sheetOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 backdrop-blur-sm">
          <div className="max-h-[86vh] w-full max-w-lg overflow-y-auto rounded-t-[24px] bg-white pb-6">
            <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border)] bg-white px-4 py-3">
              <div className="min-w-0">
                <p className="text-[14px] font-extrabold">Fare Breakdown</p>
                <p className="truncate text-[10px] font-medium text-[var(--text-light)]">{trip.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 px-4 pt-3">
              <section className="rounded-[14px] border border-[var(--border)] p-3">
                <div className="space-y-1.5 text-[11.5px] font-semibold">
                  <Row label={`Package (${travellers} × ${rupees(trip.price)})`} value={rupees(baseFare)} />
                  {visaTotal > 0 ? (
                    <Row label={`Visa fees (${travellers} × ${rupees(VISA_FEE_PER_PERSON)})`} value={rupees(visaTotal)} />
                  ) : null}
                  {insuranceTotal > 0 ? (
                    <Row
                      label={`Travel insurance (${travellers} × ${rupees(INSURANCE_PER_PERSON)})`}
                      value={rupees(insuranceTotal)}
                    />
                  ) : null}
                  <Row label={`GST (${Math.round(GST_RATE * 100)}%)`} value={rupees(gst)} />
                  <Row label={`TCS (${Math.round(TCS_RATE * 100)}%)`} value={rupees(tcs)} hint="Collected at source on overseas tour packages" />
                  {discount > 0 ? (
                    <Row label={`Discount${coupon ? ` (${coupon})` : ''}`} value={`-${rupees(discount)}`} tone="text-[var(--success)]" />
                  ) : null}
                </div>

                <div className="mt-2.5 flex items-center justify-between border-t border-[var(--border)] pt-2.5">
                  <span className="text-[13px] font-extrabold">Total Payable</span>
                  <span className="text-[19px] font-extrabold">{rupees(grandTotal)}</span>
                </div>
                <p className="mt-0.5 text-[9px] font-medium text-[var(--text-light)]">
                  Inclusive of all taxes and levies
                </p>
              </section>

              {/* Optional add-ons */}
              <section className="rounded-[14px] border border-[var(--border)] p-3">
                <p className="text-[12.5px] font-extrabold">Add-ons</p>
                <label className="mt-2 flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={withVisa}
                    onChange={(event) => setWithVisa(event.target.checked)}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11.5px] font-bold leading-tight">Visa processing</span>
                    <span className="block text-[9.5px] font-medium text-[var(--text-light)]">
                      {rupees(VISA_FEE_PER_PERSON)} per person
                    </span>
                  </span>
                </label>
                <label className="mt-2 flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={withInsurance}
                    onChange={(event) => setWithInsurance(event.target.checked)}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11.5px] font-bold leading-tight">Travel insurance</span>
                    <span className="block text-[9.5px] font-medium text-[var(--text-light)]">
                      {rupees(INSURANCE_PER_PERSON)} per person
                    </span>
                  </span>
                </label>
              </section>

              {/* Coupon */}
              <section className="rounded-[14px] border border-[var(--border)] p-3">
                <p className="text-[12.5px] font-extrabold">Have a coupon?</p>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="min-w-0 flex-1 rounded-[10px] border border-[var(--border)] px-3 py-2.5 text-[12px] font-semibold uppercase outline-none placeholder:font-medium placeholder:normal-case placeholder:text-slate-300 focus:border-[var(--primary)]"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    className="shrink-0 rounded-[10px] border-2 border-[var(--primary)] px-4 text-[12px] font-extrabold"
                  >
                    Apply
                  </button>
                </div>
                {coupon ? (
                  <p className="mt-2 flex items-center gap-1.5 text-[10.5px] font-bold text-[var(--success)]">
                    <CircleCheck size={12} /> {coupon} applied
                    <button
                      type="button"
                      onClick={() => setCoupon('')}
                      className="ml-auto text-[10px] font-bold text-[var(--text-light)] underline"
                    >
                      Remove
                    </button>
                  </p>
                ) : (
                  <p className="mt-1.5 text-[9.5px] font-medium text-[var(--text-light)]">
                    Try GLOBAL10 or FLYFREE for a discount.
                  </p>
                )}
              </section>

              <p className="flex items-start gap-1.5 px-1 text-[9.5px] font-medium text-[var(--text-light)]">
                <ShieldCheck size={12} className="mt-[1px] shrink-0 text-[var(--primary-dark)]" />
                Pay 25% now ({rupees(Math.round(grandTotal * 0.25))}) and the balance 21 days before departure.
              </p>

              <button
                type="button"
                onClick={confirmAndPay}
                disabled={paying || !quote}
                className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(180deg,#FFD54F,#FFC107)] py-3.5 text-[15px] font-extrabold shadow-[0_8px_20px_rgba(255,193,7,.4)]"
              >
                {paying ? 'Processing…' : `Confirm & Pay ${rupees(grandTotal)}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default InternationalDetails;
