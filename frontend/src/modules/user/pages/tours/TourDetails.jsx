import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BedDouble,
  CalendarCheck,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  Headset,
  MapPin,
  Plane,
  ShieldCheck,
  Star,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import { fetchPackageBySlug, recallPackage, recallPackageExtras } from '../../utils/packageHandoff';
import AppHeader from '../../components/AppHeader';
import api from '../../../../shared/api/axiosInstance';
import { payForBooking } from '../../utils/bookingCheckout';

const getRoutePrefix = (pathname = '') => (pathname.startsWith('/taxi/user') ? '/taxi/user' : '');

const rupees = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const INCLUSIONS = [
  { label: 'Hotel stay with breakfast', icon: BedDouble },
  { label: 'All meals as per itinerary', icon: Utensils },
  { label: 'Private cab for transfers', icon: Plane },
  { label: 'Sightseeing & entry tickets', icon: Camera },
  { label: 'Driver allowance & tolls', icon: CircleCheck },
];

const EXCLUSIONS = [
  'Airfare / train tickets',
  'Personal expenses & tips',
  'Adventure activity charges',
  'Anything not in inclusions',
];

const POLICIES = [
  { icon: ShieldCheck, title: 'Secure Booking', sub: '100% safe & secure payments' },
  { icon: CalendarCheck, title: 'Free cancellation', sub: 'Up to 7 days before departure' },
  { icon: Headset, title: '24/7 Support', sub: 'On-trip assistance any time' },
];

/** Day-wise plan generated from the package stops so it always matches the route. */
const buildItinerary = (tour) => {
  const stops = Array.isArray(tour?.stops) ? tour.stops : [];
  const days = Number(tour?.durationDays) || stops.length || 1;

  return Array.from({ length: days }, (_, index) => {
    const stop = stops[Math.min(index, stops.length - 1)] || tour?.state || 'Leisure day';
    if (index === 0) {
      return { day: 1, title: `Arrival in ${stops[0] || tour?.state}`, detail: 'Pick-up, hotel check-in and an easy evening to settle in.' };
    }
    if (index === days - 1) {
      return { day: days, title: 'Departure', detail: 'Breakfast, check-out and drop to your onward point.' };
    }
    return { day: index + 1, title: stop, detail: `Full day exploring ${stop} with guided sightseeing and free time.` };
  });
};

const TourDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug: slugParam } = useParams();
  const routePrefix = useMemo(() => getRoutePrefix(location.pathname), [location.pathname]);
  const state = location.state || {};
  // Fall back to the stored handoff so a reload or a direct hit still works.
  const recalled = useMemo(() => ({ pkg: recallPackage('tour'), ...recallPackageExtras('tour') }), []);
  const [fetchedTour, setFetchedTour] = useState(null);
  const tour = state.tour || recalled.pkg || fetchedTour;

  // A shared link arrives with only a slug - load it.
  useEffect(() => {
    if (tour || !slugParam) return undefined;
    let cancelled = false;
    fetchPackageBySlug(slugParam).then((result) => { if (!cancelled) setFetchedTour(result); });
    return () => { cancelled = true; };
  }, [tour, slugParam]);
  const travelersLabel = state.travelers || recalled.travelers || '2 Adults';
  const startDate = state.startDate || recalled.startDate || '';

  const [openDay, setOpenDay] = useState(1);
  const [paying, setPaying] = useState(false);
  const [slide, setSlide] = useState(0);
  const [showAllInclusions, setShowAllInclusions] = useState(false);

  const itinerary = useMemo(() => buildItinerary(tour), [tour]);
  const gallery = useMemo(() => {
    const list = Array.isArray(tour?.gallery) && tour.gallery.length ? tour.gallery : [tour?.image];
    return list.filter(Boolean);
  }, [tour]);

  const bookPackage = async () => {
    setPaying(true);
    try {
      // Create the booking first so the server owns the amount, then pay it.
      const response = await api.post('/users/package-bookings', {
        slug: tour.slug,
        travellers: travellerCount,
      });
      const created = response?.data?.data ?? response?.data;

      const paid = await payForBooking({
        kind: 'package',
        bookingId: created._id,
        name: tour.title,
        description: `${travellerCount} traveller(s) · ${created.bookingReference}`,
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

  if (!tour) {
    // With a slug in the URL the fetch is still in flight, so hold rather than
    // bouncing the visitor straight back to the listing.
    if (slugParam) return null;
    navigate(`${routePrefix}/tours`, { replace: true });
    return null;
  }

  // "2 Adults, 1 Child" -> 3 travellers
  const travellerCount =
    (String(travelersLabel).match(/\d+/g) || ['2']).reduce((sum, value) => sum + Number(value), 0) || 2;
  const off = Math.round(((tour.oldPrice - tour.price) / tour.oldPrice) * 100);
  const total = tour.price * travellerCount;

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-[var(--background)] pb-32 text-[var(--text)]">
      <AppHeader showBack subtitle="PACKAGE DETAILS" />

      {/* Hero carousel */}
      <section className="relative h-[210px] overflow-hidden bg-slate-900">
        {gallery.map((image, index) => (
          <img
            key={`${image}-${index}`}
            src={image}
            alt={tour.title}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              index === slide ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        {/* stronger scrim: the title sits on bright skies otherwise */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />

        <span className={`absolute left-3 top-3 z-10 rounded-[8px] px-2 py-0.5 text-[9.5px] font-extrabold ${tour.tagTone}`}>
          {tour.tag}
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
            {tour.title}
          </h1>
          <p className="mt-1 flex items-center gap-1 text-[10.5px] font-semibold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
            <MapPin size={11} className="shrink-0" /> {tour.state}
            <span className="opacity-60">•</span>
            <Clock3 size={11} className="shrink-0" /> {tour.days}
          </p>

          {gallery.length > 1 ? (
            <div className="mt-2 flex gap-1.5">
              {gallery.map((image, index) => (
                <button
                  key={`dot-${image}-${index}`}
                  type="button"
                  aria-label={`Photo ${index + 1}`}
                  onClick={() => setSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === slide ? 'w-5 bg-[var(--primary)]' : 'w-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <main className="space-y-3 px-3 pt-3">
        {/* Rating + price */}
        <section className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--border)] bg-white p-3.5 shadow-[var(--shadow-sm)]">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[13px] font-extrabold">
              <Star size={13} className="fill-[var(--primary)] text-[var(--primary)]" />
              {tour.rating}
              <span className="text-[10px] font-medium text-[var(--text-light)]">({tour.reviews} reviews)</span>
            </p>
            <p className="mt-1 truncate text-[10px] font-semibold text-[var(--text-light)]">
              {tour.stops.join(' • ')}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="flex items-baseline justify-end gap-1.5">
              <span className="text-[10px] font-medium text-slate-400 line-through">{rupees(tour.oldPrice)}</span>
              <span className="text-[19px] font-extrabold leading-none">{rupees(tour.price)}</span>
            </p>
            <p className="text-[9px] font-medium text-[var(--text-light)]">per person · {off}% off</p>
          </div>
        </section>

        {/* Day-wise itinerary */}
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
                    <ChevronDown
                      size={14}
                      className={`shrink-0 text-[var(--text-light)] transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  </div>
                  {open ? (
                    <p className="mt-2 pl-9 text-[10.5px] font-medium leading-[1.5] text-[var(--text-light)]">
                      {detail}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        {/* Inclusions / exclusions */}
        <section className="rounded-[16px] border border-[var(--border)] bg-white p-3.5 shadow-[var(--shadow-sm)]">
          <h2 className="text-[14px] font-extrabold">What&apos;s Included</h2>
          <div className="mt-2.5 space-y-1.5">
            {(showAllInclusions ? INCLUSIONS : INCLUSIONS.slice(0, 3)).map(({ label, icon: Icon }) => (
              <p key={label} className="flex items-center gap-2 text-[11px] font-semibold">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                  <Icon size={12} className="text-[var(--success)]" />
                </span>
                {label}
              </p>
            ))}
          </div>
          {INCLUSIONS.length > 3 ? (
            <button
              type="button"
              onClick={() => setShowAllInclusions((current) => !current)}
              className="mt-2 text-[11px] font-bold text-[var(--primary-dark)]"
            >
              {showAllInclusions ? 'Show less' : `+${INCLUSIONS.length - 3} more inclusions`}
            </button>
          ) : null}

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

        {/* Trip facts */}
        <section className="grid grid-cols-3 gap-2">
          {[
            { icon: Clock3, label: 'Duration', value: tour.days },
            { icon: Users, label: 'Travellers', value: travelersLabel },
            { icon: CalendarCheck, label: 'Starts', value: startDate ? new Date(`${startDate}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Flexible' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-[14px] border border-[var(--border)] bg-white px-2 py-2.5 text-center shadow-[var(--shadow-sm)]">
              <Icon size={15} className="mx-auto text-[var(--primary-dark)]" />
              <p className="mt-1 text-[8.5px] font-bold uppercase tracking-[0.1em] text-[var(--text-light)]">{label}</p>
              <p className="mt-0.5 truncate text-[10.5px] font-extrabold">{value}</p>
            </div>
          ))}
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

      {/* Sticky booking bar */}
      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-lg -translate-x-1/2 border-t border-[var(--border)] bg-white px-4 pb-6 pt-3">
        <div className="mb-2.5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-medium text-slate-400 line-through">{rupees(tour.oldPrice)}</span>
              <span className="text-[19px] font-extrabold leading-none">{rupees(tour.price)}</span>
            </p>
            <p className="truncate text-[9.5px] font-medium text-[var(--text-light)]">
              per person · {travellerCount} travellers = {rupees(total)}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-[var(--success)]">
            <Check size={11} strokeWidth={3} /> {off}% off
          </span>
        </div>
        <button
          type="button"
          onClick={bookPackage}
          disabled={paying}
          className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(180deg,#FFD54F,#FFC107)] py-3.5 text-[15px] font-extrabold shadow-[0_8px_20px_rgba(255,193,7,.4)] active:scale-[0.99] transition-transform"
        >
          {paying ? 'Processing…' : 'Book This Package'} <ChevronRight size={18} strokeWidth={2.8} />
        </button>
      </div>
    </div>
  );
};

export default TourDetails;
