import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, Check, ChevronLeft, ChevronRight,
  Headphones, Info, Minus, Plus, Sparkles, Star, Ticket, Users, X,
} from 'lucide-react';
import { fetchPackageBySlug, recallPackage } from '../../utils/packageHandoff';
import { payForBooking } from '../../utils/bookingCheckout';
import api from '../../../../shared/api/axiosInstance';
import { DesktopNav } from '../../components/desktop/DesktopChrome';
import { useDesktopTheme } from '../../components/desktop/desktopShared';

/**
 * Desktop package detail, shared by domestic tours and international packages -
 * both are TravelPackage records with the same shape.
 *
 * Every amount comes from the travel-package quote endpoint, so GST, TCS and
 * coupons are applied by the server rather than recomputed here.
 */

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const titleOf = (pkg) => pkg?.title || pkg?.name || 'Package';

const durationLabel = (pkg) => {
  if (pkg?.durationLabel) return pkg.durationLabel;
  const days = Number(pkg?.durationDays || 0);
  return days > 0 ? `${days} Days / ${Math.max(0, days - 1)} Nights` : '';
};

/**
 * Day-by-day plan derived from the package's own stops - the same derivation
 * the mobile detail page uses, so the two never disagree.
 */
const buildItinerary = (pkg) => {
  const stops = Array.isArray(pkg?.stops) ? pkg.stops : [];
  const days = Number(pkg?.durationDays) || stops.length || 1;
  const place = stops[0] || pkg?.state || pkg?.country || 'your destination';

  return Array.from({ length: days }, (_, index) => {
    if (index === 0) {
      return { day: 1, title: `Arrival in ${place}`, detail: 'Pick-up, hotel check-in and an easy evening to settle in.' };
    }
    if (index === days - 1) {
      return { day: days, title: 'Departure', detail: 'Breakfast, check-out and drop to your onward point.' };
    }
    const stop = stops[Math.min(index, stops.length - 1)] || place;
    return { day: index + 1, title: stop, detail: `Full day exploring ${stop} with guided sightseeing and free time.` };
  });
};

const Row = ({ label, value, hint, strong }) => (
  <div className="flex items-start justify-between gap-4">
    <span className="min-w-0">
      <span className={`block ${strong ? 'text-[16.5px] font-black text-[var(--dh-text)]' : 'text-[14.5px] font-semibold text-[var(--dh-muted)]'}`}>
        {label}
      </span>
      {hint && <span className="mt-0.5 block text-[13px] font-medium text-[var(--dh-muted)]">{hint}</span>}
    </span>
    <span className={strong ? 'text-[20px] font-black text-[var(--dh-text)]' : 'text-[14.5px] font-bold text-[var(--dh-text)]'}>
      {value}
    </span>
  </div>
);

const DesktopPackageDetails = ({ scope = 'domestic' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, toggleTheme] = useDesktopTheme();

  const isInternational = scope === 'international';
  const listPath = isInternational ? '/taxi/user/international' : '/taxi/user/tours';
  const handoffScope = isInternational ? 'international' : 'tour';

  // Both mobile pages use their own state key, so accept either, then fall back
  // to the stored handoff so a reload or a direct hit still works.
  const { slug: slugParam } = useParams();
  const recalled = useMemo(() => recallPackage(handoffScope), [handoffScope]);
  const [fetched, setFetched] = useState(null);

  const pkg = location.state?.tour || location.state?.trip || location.state?.pkg || recalled || fetched;

  // A shared link arrives with only a slug - load it.
  useEffect(() => {
    if (pkg || !slugParam) return undefined;
    let cancelled = false;
    fetchPackageBySlug(slugParam).then((result) => { if (!cancelled) setFetched(result); });
    return () => { cancelled = true; };
  }, [pkg, slugParam]);

  const [travellers, setTravellers] = useState(2);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [slide, setSlide] = useState(0);
  const [openDay, setOpenDay] = useState(1);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState('');

  const gallery = useMemo(() => {
    if (!pkg) return [];
    return [pkg.image, ...(pkg.gallery || [])]
      .filter(Boolean)
      .filter((src, index, list) => list.indexOf(src) === index);
  }, [pkg]);

  const itinerary = useMemo(() => buildItinerary(pkg), [pkg]);

  // Server owns every amount, including GST and TCS.
  useEffect(() => {
    if (!pkg?.slug) return undefined;
    let cancelled = false;
    api
      .post('/users/travel-packages/quote', { slug: pkg.slug, travellers, couponCode: appliedCoupon })
      .then((response) => {
        if (cancelled) return;
        setQuote(response?.data?.data ?? response?.data ?? null);
        setQuoteError('');
      })
      .catch((error) => {
        if (cancelled) return;
        setQuote(null);
        setQuoteError(error?.response?.data?.message || 'Could not price this package');
      });
    return () => { cancelled = true; };
  }, [pkg?.slug, travellers, appliedCoupon]);

  if (!pkg) {
    return (
      <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
        <DesktopNav activePath={listPath} theme={theme} onToggleTheme={toggleTheme} />
        <div className="mx-auto max-w-[1440px] px-8 py-24 text-center xl:px-12">
          <p className="text-[19px] font-black text-[var(--dh-text)]">
            {slugParam ? 'Loading package…' : 'This package is no longer loaded'}
          </p>
          <button
            onClick={() => navigate(listPath)}
            className="mt-5 rounded-[12px] bg-[#F5B700] px-6 py-3 text-[16.5px] font-bold text-slate-950"
          >
            Back to packages
          </button>
        </div>
      </div>
    );
  }

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponError('');
    // The quote endpoint validates the code; a bad one comes back as an error.
    api
      .post('/users/travel-packages/quote', { slug: pkg.slug, travellers, couponCode: code })
      .then((response) => {
        setQuote(response?.data?.data ?? response?.data ?? null);
        setAppliedCoupon(code);
        setQuoteError('');
      })
      .catch((error) => setCouponError(error?.response?.data?.message || 'This coupon is not valid'));
  };

  const bookTrip = async () => {
    setBooking(true);
    setQuoteError('');
    try {
      // Create the booking first so the server owns the amount, then pay it.
      const response = await api.post('/users/package-bookings', {
        slug: pkg.slug,
        travellers,
        couponCode: appliedCoupon,
      });
      const created = response?.data?.data ?? response?.data;

      const paid = await payForBooking({
        kind: 'package',
        bookingId: created._id,
        name: titleOf(pkg),
        description: `${travellers} traveller(s) · ${created.bookingReference}`,
      });

      if (!paid) {
        // Modal dismissed - the booking exists and is payable from My Bookings.
        setQuoteError('Payment cancelled. Your booking is saved and can be paid from My Bookings.');
        setConfirmed('');
        return;
      }
      setConfirmed(paid.bookingReference || created.bookingReference);
    } catch (error) {
      setQuoteError(error?.response?.data?.message || error.message || 'Could not complete this booking');
    } finally {
      setBooking(false);
    }
  };

  const region = pkg.country || pkg.state || '';

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath={listPath} theme={theme} onToggleTheme={toggleTheme} />

      <section className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)_398px] gap-6 px-8 pb-20 pt-5 xl:px-12">
        <div>
          <button
            onClick={() => navigate(listPath)}
            className="flex items-center gap-2 text-[15px] font-bold text-[var(--dh-text)] hover:text-[#F5B700]"
          >
            <ArrowLeft size={16} strokeWidth={2.6} /> Back to {isInternational ? 'International Packages' : 'Tour Packages'}
          </button>

          <div className="mt-4 rounded-[20px] bg-[var(--dh-surface)] p-6 ring-1 ring-[var(--dh-border)]">
            {/* --------------------------------------------------------- Gallery */}
            {gallery.length > 0 && (
              <div className="relative h-[320px] overflow-hidden rounded-[16px] bg-[var(--dh-chip)]">
                <img src={gallery[slide]} alt={titleOf(pkg)} className="absolute inset-0 h-full w-full object-cover" />
                {pkg.badge && (
                  <span className="absolute left-4 top-4 rounded-[9px] bg-[#F5B700] px-3 py-1.5 text-[13.5px] font-black uppercase tracking-[0.05em] text-slate-950">
                    {pkg.badge}
                  </span>
                )}
                {gallery.length > 1 && (
                  <>
                    <button
                      onClick={() => setSlide((i) => (i - 1 + gallery.length) % gallery.length)}
                      className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-md"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={19} className="text-slate-900" strokeWidth={2.6} />
                    </button>
                    <button
                      onClick={() => setSlide((i) => (i + 1) % gallery.length)}
                      className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-md"
                      aria-label="Next image"
                    >
                      <ChevronRight size={19} className="text-slate-900" strokeWidth={2.6} />
                    </button>
                    <span className="absolute bottom-4 left-4 rounded-[8px] bg-black/60 px-2.5 py-1 text-[13.5px] font-bold text-white">
                      {slide + 1} / {gallery.length}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------ Head */}
            <div className="mt-5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[28px] font-black tracking-[-0.035em] text-[var(--dh-text)]">{titleOf(pkg)}</h1>
                {pkg.category && (
                  <span className="rounded-[7px] bg-[var(--dh-chip)] px-2.5 py-1 text-[13px] font-black uppercase tracking-[0.05em] text-[var(--dh-muted)]">
                    {pkg.category}
                  </span>
                )}
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
                {region && (
                  <span className="text-[15px] font-semibold text-[var(--dh-muted)]">{region}</span>
                )}
                {durationLabel(pkg) && (
                  <span className="flex items-center gap-1.5 text-[15px] font-semibold text-[var(--dh-text)]">
                    <CalendarDays size={15} className="text-[var(--dh-muted)]" strokeWidth={2.2} /> {durationLabel(pkg)}
                  </span>
                )}
                {Number(pkg.rating) > 0 && (
                  <span className="flex items-center gap-2">
                    <span className="flex items-center gap-1 rounded-[6px] bg-emerald-600 px-1.5 py-0.5 text-[13.5px] font-black text-white">
                      <Star size={11} className="fill-white" /> {pkg.rating}
                    </span>
                    {pkg.reviews && (
                      <span className="text-[14px] font-semibold text-[var(--dh-muted)]">({pkg.reviews} reviews)</span>
                    )}
                  </span>
                )}
              </div>

              {pkg.stops?.length > 0 && (
                <p className="mt-3 text-[15px] font-semibold text-[var(--dh-muted)]">
                  {pkg.stops.join(' • ')}
                </p>
              )}

              {pkg.perks?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {pkg.perks.map((perk) => (
                    <span key={perk} className="flex items-center gap-1.5 rounded-[8px] bg-emerald-50 px-3 py-1.5 text-[13.5px] font-bold text-emerald-700">
                      <BadgeCheck size={13} strokeWidth={2.4} /> {perk}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ------------------------------------------------- Highlights + plan */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-[20px] bg-[var(--dh-surface)] p-6 ring-1 ring-[var(--dh-border)]">
              <h2 className="text-[19px] font-black tracking-[-0.02em] text-[var(--dh-text)]">What&apos;s Included</h2>
              {pkg.includes?.length ? (
                <ul className="mt-4 space-y-2.5">
                  {pkg.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[15px] font-semibold text-[var(--dh-text)]">
                      <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" strokeWidth={2.8} /> {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-[15px] font-medium text-[var(--dh-muted)]">
                  Inclusions for this package have not been listed yet.
                </p>
              )}
            </div>

            <div className="rounded-[20px] bg-[var(--dh-surface)] p-6 ring-1 ring-[var(--dh-border)]">
              <h2 className="text-[19px] font-black tracking-[-0.02em] text-[var(--dh-text)]">Trip Highlights</h2>
              {pkg.highlights?.length ? (
                <ul className="mt-4 space-y-2.5">
                  {pkg.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[15px] font-semibold text-[var(--dh-text)]">
                      <Sparkles size={15} className="mt-0.5 shrink-0 text-[#F5B700]" strokeWidth={2.3} /> {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-[15px] font-medium text-[var(--dh-muted)]">
                  Highlights for this package have not been listed yet.
                </p>
              )}
            </div>
          </div>

          {/* -------------------------------------------------------- Itinerary */}
          <div className="mt-4 rounded-[20px] bg-[var(--dh-surface)] p-6 ring-1 ring-[var(--dh-border)]">
            <h2 className="text-[19px] font-black tracking-[-0.02em] text-[var(--dh-text)]">Day-wise Plan</h2>
            <div className="mt-4 space-y-2.5">
              {itinerary.map((entry) => {
                const isOpen = openDay === entry.day;
                return (
                  <div key={entry.day} className={`rounded-[13px] border transition-colors ${isOpen ? 'border-[#F5B700] bg-[#FFFCF2]' : 'border-[var(--dh-border)]'}`}>
                    <button
                      onClick={() => setOpenDay(isOpen ? 0 : entry.day)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left"
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[14px] font-black ${isOpen ? 'bg-[#F5B700] text-slate-950' : 'bg-[var(--dh-chip)] text-[var(--dh-muted)]'}`}>
                        {entry.day}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[16px] font-black text-[var(--dh-text)]">{entry.title}</span>
                      </span>
                      <ChevronRight size={17} className={`shrink-0 text-[var(--dh-muted)] transition-transform ${isOpen ? 'rotate-90' : ''}`} strokeWidth={2.4} />
                    </button>
                    {isOpen && (
                      <p className="px-4 pb-4 pl-[66px] text-[14.5px] font-medium leading-[1.55] text-[var(--dh-muted)]">
                        {entry.detail}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- Sidebar */}
        <aside className="sticky top-[100px] h-fit space-y-4">
          <div className="rounded-[20px] bg-[var(--dh-surface)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-[var(--dh-border)]">
            <div className="flex items-end justify-between">
              <div>
                {Number(pkg.oldPrice) > Number(pkg.price) && (
                  <p className="text-[14.5px] font-bold text-[var(--dh-muted)] line-through">{formatMoney(pkg.oldPrice)}</p>
                )}
                <p className="text-[26px] font-black leading-none tracking-[-0.03em] text-[var(--dh-text)]">
                  {formatMoney(pkg.price)}
                </p>
                <p className="mt-1 text-[13.5px] font-semibold text-[var(--dh-muted)]">per person · on twin sharing</p>
              </div>
            </div>

            {/* Travellers */}
            <div className="mt-5 flex items-center justify-between border-t border-[var(--dh-border)] pt-4">
              <span className="flex items-center gap-2 text-[15px] font-bold text-[var(--dh-text)]">
                <Users size={16} className="text-[var(--dh-muted)]" strokeWidth={2.3} /> Travellers
              </span>
              <span className="flex items-center gap-3">
                <button
                  onClick={() => setTravellers((n) => Math.max(1, n - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--dh-border)] text-[var(--dh-text)] disabled:opacity-40"
                  disabled={travellers <= 1}
                  aria-label="Remove a traveller"
                >
                  <Minus size={14} strokeWidth={2.8} />
                </button>
                <span className="w-6 text-center text-[16.5px] font-black text-[var(--dh-text)]">{travellers}</span>
                <button
                  onClick={() => setTravellers((n) => n + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--dh-border)] text-[var(--dh-text)]"
                  aria-label="Add a traveller"
                >
                  <Plus size={14} strokeWidth={2.8} />
                </button>
              </span>
            </div>

            {/* Coupon */}
            <div className="mt-4 border-t border-[var(--dh-border)] pt-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-[11px] bg-emerald-50 px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-[14px] font-black text-emerald-700">
                    <Ticket size={14} strokeWidth={2.5} /> {appliedCoupon} applied
                  </span>
                  <button
                    onClick={() => { setAppliedCoupon(''); setCouponInput(''); }}
                    className="text-emerald-700"
                    aria-label="Remove coupon"
                  >
                    <X size={15} strokeWidth={2.8} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <span className="flex h-[42px] flex-1 items-center gap-2 rounded-[11px] border border-[var(--dh-border)] px-3">
                    <Ticket size={15} className="shrink-0 text-[var(--dh-muted)]" strokeWidth={2.3} />
                    <input
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value); setCouponError(''); }}
                      placeholder="Coupon code"
                      className="w-full bg-transparent text-[15px] font-semibold uppercase text-[var(--dh-text)] placeholder:normal-case placeholder:text-[var(--dh-muted)] outline-none"
                    />
                  </span>
                  <button
                    onClick={applyCoupon}
                    disabled={!couponInput.trim()}
                    className="h-[42px] rounded-[11px] bg-[#F5B700] px-5 text-[15px] font-bold text-slate-950 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              )}
              {couponError && (
                <p className="mt-2 text-[13.5px] font-bold text-rose-700">{couponError}</p>
              )}
            </div>

            {/* Price panel - entirely server-computed */}
            <div className="mt-4 space-y-3 border-t border-[var(--dh-border)] pt-4">
              {quote ? (
                <>
                  <Row label={`Package fare (${quote.travellers} × ${formatMoney(quote.perPerson)})`} value={formatMoney(quote.baseFare)} />
                  {quote.discount > 0 && (
                    <Row label={`Coupon discount (${quote.couponPercent}%)`} value={`− ${formatMoney(quote.discount)}`} />
                  )}
                  {quote.memberDiscount > 0 && (
                    <Row
                      label={`Member discount (${quote.memberDiscountPercent}%)`}
                      value={`− ${formatMoney(quote.memberDiscount)}`}
                    />
                  )}
                  <Row label={`GST (${Math.round(quote.gstRate * 100)}%)`} value={formatMoney(quote.gst)} />
                  {quote.tcs > 0 && (
                    <Row
                      label={`TCS (${Math.round(quote.tcsRate * 100)}%)`}
                      value={formatMoney(quote.tcs)}
                      hint="Collected at source on overseas tour packages"
                    />
                  )}
                  <div className="border-t border-[var(--dh-border)] pt-3">
                    <Row label="Total Amount" value={formatMoney(quote.totalAmount)} strong />
                  </div>
                  {quote.savings > 0 && (
                    <p className="rounded-[11px] bg-emerald-50 px-3.5 py-2.5 text-[13.5px] font-bold text-emerald-700">
                      You save {formatMoney(quote.savings)} on this booking.
                    </p>
                  )}
                </>
              ) : quoteError ? (
                <p className="rounded-[10px] bg-rose-50 px-3 py-2.5 text-[14px] font-bold text-rose-700">{quoteError}</p>
              ) : (
                <div className="space-y-2">
                  <div className="skeleton h-4 rounded" />
                  <div className="skeleton h-4 w-2/3 rounded" />
                  <div className="skeleton h-6 rounded" />
                </div>
              )}
            </div>

            {confirmed ? (
              <div className="mt-5 rounded-[13px] bg-emerald-50 p-4 text-center">
                <p className="text-[15px] font-black text-emerald-800">Booking confirmed</p>
                <p className="mt-1 text-[13.5px] font-bold text-emerald-700">{confirmed}</p>
                <button
                  onClick={() => navigate('/taxi/user/activity')}
                  className="mt-3 rounded-[10px] bg-emerald-600 px-4 py-2 text-[14px] font-bold text-white"
                >
                  View my bookings
                </button>
              </div>
            ) : (
              <button
                disabled={!quote || booking}
                onClick={bookTrip}
                className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-[13px] bg-[#F5B700] py-3.5 text-[17px] font-bold text-slate-950 shadow-[0_10px_24px_rgba(245,183,0,0.3)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {booking ? 'Processing…' : 'Book & Pay'} <ArrowRight size={18} strokeWidth={2.8} />
              </button>
            )}

            <p className="mt-3 flex items-start gap-2 text-[13px] font-medium text-[var(--dh-muted)]">
              <Info size={13} className="mt-0.5 shrink-0" strokeWidth={2.2} />
              Taxes and levies shown are calculated by Taxi09 and confirmed again before payment.
            </p>
          </div>

          <div className="rounded-[18px] bg-[#FFFBEC] p-5">
            <p className="text-[15.5px] font-black text-slate-900">Questions about this trip?</p>
            <p className="mt-1 text-[14px] font-semibold text-slate-600">Our travel experts can help you plan it.</p>
            <button
              onClick={() => navigate('/taxi/user/support')}
              className="mt-3.5 flex items-center gap-2 rounded-[11px] bg-white px-4 py-2.5 text-[15px] font-bold text-slate-900 ring-1 ring-[var(--dh-border)]"
            >
              <Headphones size={15} strokeWidth={2.5} /> Talk to an expert
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default DesktopPackageDetails;
