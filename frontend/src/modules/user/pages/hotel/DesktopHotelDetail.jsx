import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BadgeCheck, BedDouble, Calendar, ChevronLeft, ChevronRight, ChevronRight as Crumb,
  Headphones, Lock, LogIn, LogOut, MapPin, Maximize, Sparkles, Star, Ticket, Users,
} from 'lucide-react';
import api from '../../../../shared/api/axiosInstance';
import { DesktopNav } from '../../components/desktop/DesktopChrome';
import { useDesktopTheme } from '../../components/desktop/desktopShared';
import { payForBooking } from '../../utils/bookingCheckout';

/**
 * Desktop hotel detail for /taxi/user/hotel/:slug.
 *
 * Rooms, gallery and highlights come from the hotel record; the price panel is
 * whatever the server quote returns for the chosen room and dates.
 */

const WHY_BOOK = [
  { icon: BadgeCheck, title: 'Best Price Guarantee', copy: "Find a lower price? We'll match it." },
  { icon: Ticket, title: 'Free Cancellation', copy: 'Most hotels offer free cancellation.' },
  { icon: Lock, title: 'Secure Booking', copy: 'Your data is safe with us.' },
  { icon: Headphones, title: '24/7 Customer Support', copy: "We're here to help you anytime." },
];

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const formatDate = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' });
};

const ratingWord = (rating) => {
  const value = Number(rating || 0);
  if (value >= 4.5) return 'Excellent';
  if (value >= 4) return 'Very Good';
  if (value >= 3) return 'Good';
  return 'Rated';
};

const DesktopHotelDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const [theme, toggleTheme] = useDesktopTheme();

  const stored = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem('taxi:hotel-pending') || 'null');
    } catch {
      return null;
    }
  }, []);

  const [hotel, setHotel] = useState(location.state?.hotel || stored?.hotel || null);
  const [loading, setLoading] = useState(!hotel);
  const [imageIndex, setImageIndex] = useState(0);
  const [roomKey, setRoomKey] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState('');

  const search = location.state?.search || stored?.search || { checkIn: '', checkOut: '', guests: 2, rooms: 1 };

  // Always refetch by slug so a deep link or reload works without prior state.
  useEffect(() => {
    if (!slug) return undefined;
    let cancelled = false;
    api
      .get(`/users/hotels/${slug}`)
      .then((response) => {
        if (cancelled) return;
        const data = response?.data?.data ?? response?.data;
        if (data?.name) setHotel(data);
      })
      .catch(() => { /* keep whatever the list handed over */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  const rooms = useMemo(
    () => (Array.isArray(hotel?.rooms) ? hotel.rooms : []).filter((room) => room?.active !== false),
    [hotel],
  );
  const activeRoomKey = roomKey || String(rooms[0]?.key || '');

  const gallery = useMemo(() => {
    if (!hotel) return [];
    return [hotel.image, ...(hotel.gallery || [])]
      .filter(Boolean)
      .filter((src, index, list) => list.indexOf(src) === index);
  }, [hotel]);

  // Server owns every amount in the summary.
  useEffect(() => {
    if (!hotel?.slug || !activeRoomKey) return undefined;
    let cancelled = false;
    api
      .post('/users/hotels/quote', {
        slug: hotel.slug,
        roomKey: activeRoomKey,
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        rooms: search.rooms,
        guests: search.guests,
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
  }, [hotel?.slug, activeRoomKey, search.checkIn, search.checkOut, search.rooms, search.guests]);

  if (!hotel) {
    return (
      <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
        <DesktopNav activePath="/taxi/user/hotel" theme={theme} onToggleTheme={toggleTheme} />
        <div className="mx-auto max-w-[1440px] px-8 py-24 text-center xl:px-12">
          <p className="text-[18px] font-black text-[var(--dh-text)]">
            {loading ? 'Loading hotel…' : 'This hotel could not be found'}
          </p>
          {!loading && (
            <button
              onClick={() => navigate('/taxi/user/hotel')}
              className="mt-5 rounded-[12px] bg-[#F5B700] px-6 py-3 text-[15px] font-bold text-slate-950"
            >
              Back to Hotel List
            </button>
          )}
        </div>
      </div>
    );
  }

  const selectedRoom = rooms.find((room) => String(room.key) === activeRoomKey) || rooms[0];

  const continueToPayment = async () => {
    setBooking(true);
    setQuoteError('');
    try {
      // Create the booking first so the server owns the amount, then pay it.
      const response = await api.post('/users/hotel-bookings', {
        slug: hotel.slug,
        roomKey: activeRoomKey,
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        rooms: search.rooms,
        guests: search.guests,
      });
      const created = response?.data?.data ?? response?.data;

      const paid = await payForBooking({
        kind: 'hotel',
        bookingId: created._id,
        name: hotel.name,
        description: `${created.roomName} · ${created.nights} night(s)`,
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

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath="/taxi/user/hotel" theme={theme} onToggleTheme={toggleTheme} />

      <section className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)_404px] gap-6 px-8 pb-20 pt-5 xl:px-12">
        <div className="rounded-[20px] bg-[var(--dh-surface)] p-6 ring-1 ring-[var(--dh-border)]">
          <nav className="flex items-center gap-2 text-[12.5px] font-semibold text-[var(--dh-muted)]">
            <button onClick={() => navigate('/taxi/user')} className="hover:text-[var(--dh-text)]">Home</button>
            <Crumb size={13} />
            <button onClick={() => navigate('/taxi/user/hotel')} className="hover:text-[var(--dh-text)]">Hotel Booking</button>
            {hotel.city && <><Crumb size={13} /><span>{hotel.city}</span></>}
            <Crumb size={13} />
            <span className="text-[var(--dh-text)]">{hotel.name}</span>
          </nav>

          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
            {/* ---------------------------------------------------------- Gallery */}
            <div>
              {gallery.length > 0 && (
                <>
                  <div className="relative h-[248px] overflow-hidden rounded-[14px] bg-[var(--dh-chip)]">
                    <img src={gallery[imageIndex]} alt={hotel.name} className="absolute inset-0 h-full w-full object-cover" />
                    {gallery.length > 1 && (
                      <>
                        <button
                          onClick={() => setImageIndex((i) => (i - 1 + gallery.length) % gallery.length)}
                          className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-md"
                          aria-label="Previous image"
                        >
                          <ChevronLeft size={18} className="text-slate-900" strokeWidth={2.6} />
                        </button>
                        <button
                          onClick={() => setImageIndex((i) => (i + 1) % gallery.length)}
                          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-md"
                          aria-label="Next image"
                        >
                          <ChevronRight size={18} className="text-slate-900" strokeWidth={2.6} />
                        </button>
                        <span className="absolute bottom-3 left-3 rounded-[7px] bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white">
                          {imageIndex + 1} / {gallery.length}
                        </span>
                      </>
                    )}
                  </div>

                  {gallery.length > 1 && (
                    <div className="mt-2.5 flex gap-2.5 overflow-x-auto pb-1">
                      {gallery.map((src, index) => (
                        <button
                          key={src}
                          onClick={() => setImageIndex(index)}
                          className={`h-[62px] w-[92px] shrink-0 overflow-hidden rounded-[10px] ring-2 transition-colors ${
                            index === imageIndex ? 'ring-[#F5B700]' : 'ring-transparent'
                          }`}
                        >
                          <img src={src} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* -------------------------------------------------------- Hotel head */}
            <div>
              <div className="flex items-start gap-3">
                <h1 className="text-[26px] font-black leading-tight tracking-[-0.03em] text-[var(--dh-text)]">{hotel.name}</h1>
                {hotel.badge && (
                  <span className="mt-1 shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-[11.5px] font-black text-emerald-700">
                    {hotel.badge}
                  </span>
                )}
              </div>

              {(hotel.starRating > 0 || hotel.propertyType) && (
                <div className="mt-2 flex items-center gap-3">
                  {hotel.starRating > 0 && (
                    <span className="flex items-center gap-0.5" aria-label={`${hotel.starRating} star property`}>
                      {Array.from({ length: hotel.starRating }, (_, i) => (
                        <Star key={i} size={14} className="fill-[#F5B700] text-[#F5B700]" />
                      ))}
                    </span>
                  )}
                  {hotel.propertyType && (
                    <span className="rounded-[6px] bg-[var(--dh-chip)] px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.05em] text-[var(--dh-muted)]">
                      {hotel.propertyType}
                    </span>
                  )}
                </div>
              )}

              {Number(hotel.rating) > 0 && (
                <p className="mt-3 flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-[6px] bg-emerald-600 px-1.5 py-0.5 text-[12px] font-black text-white">
                    <Star size={11} className="fill-white" /> {hotel.rating}
                  </span>
                  <span className="text-[13.5px] font-bold text-[var(--dh-text)]">{ratingWord(hotel.rating)}</span>
                  {hotel.reviews && <span className="text-[13px] font-semibold text-[var(--dh-muted)]">({hotel.reviews} reviews)</span>}
                </p>
              )}

              {(hotel.area || hotel.distance) && (
                <p className="mt-2.5 flex items-start gap-1.5 text-[13px] font-semibold text-[var(--dh-muted)]">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-[#F5B700]" strokeWidth={2.3} />
                  {[hotel.area, hotel.distance].filter(Boolean).join(' · ')}
                </p>
              )}

              {hotel.facilities?.length > 0 && (
                <div className="mt-5">
                  <p className="text-[15px] font-black text-[var(--dh-text)]">Top Highlights</p>
                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    {hotel.facilities.slice(0, 8).map((facility) => (
                      <span key={facility} className="flex items-center gap-2 text-[13px] font-semibold text-[var(--dh-text)]">
                        <Sparkles size={14} className="shrink-0 text-[#F5B700]" strokeWidth={2.2} /> {facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(hotel.checkInTime || hotel.checkOutTime) && (
                <div className="mt-5 flex gap-6 border-t border-[var(--dh-border)] pt-4">
                  {hotel.checkInTime && (
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-[var(--dh-muted)]">
                      <LogIn size={15} className="text-[#F5B700]" strokeWidth={2.3} /> Check-in {hotel.checkInTime}
                    </span>
                  )}
                  {hotel.checkOutTime && (
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-[var(--dh-muted)]">
                      <LogOut size={15} className="text-[#F5B700]" strokeWidth={2.3} /> Check-out {hotel.checkOutTime}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ------------------------------------------------------------- Rooms */}
          <div className="mt-7 border-t border-[var(--dh-border)] pt-6">
            <h2 className="text-[20px] font-black tracking-[-0.03em] text-[var(--dh-text)]">Select Your Room</h2>
            <p className="mt-1 text-[13.5px] font-medium text-[var(--dh-muted)]">Choose from our best available rooms</p>

            {rooms.length === 0 ? (
              <p className="mt-4 rounded-[14px] bg-[var(--dh-chip)] px-5 py-8 text-center text-[13.5px] font-semibold text-[var(--dh-muted)]">
                No room types are configured for this hotel.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {rooms.map((room) => {
                  const isActive = String(room.key) === activeRoomKey;
                  // Rate comes from the quote so no arithmetic happens here.
                  const nightly = quote?.roomRates?.find((r) => String(r.key) === String(room.key))?.nightlyRate;
                  return (
                    <article
                      key={room.key}
                      className={`grid min-h-[130px] grid-cols-[214px_minmax(0,1fr)_178px] overflow-hidden rounded-[14px] border transition-colors ${
                        isActive ? 'border-[#F5B700] bg-[#FFFCF2]' : 'border-[var(--dh-border)]'
                      }`}
                    >
                      <div className="relative bg-[var(--dh-chip)]">
                        <img
                          src={room.image || hotel.image || '/taxi09_hotel_room_1.jpg'}
                          alt={room.name}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>

                      <div className="flex min-w-0 flex-col justify-center px-5 py-4">
                        <h3 className="truncate text-[16px] font-black text-[var(--dh-text)]">{room.name}</h3>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                          {room.adults > 0 && (
                            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--dh-muted)]">
                              <Users size={13} strokeWidth={2.2} /> {room.adults} Guest{room.adults === 1 ? '' : 's'}
                              {room.children > 0 ? ` + ${room.children}` : ''}
                            </span>
                          )}
                          {room.bed && (
                            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--dh-muted)]">
                              <BedDouble size={13} strokeWidth={2.2} /> {room.bed}
                            </span>
                          )}
                          {room.sqft > 0 && (
                            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--dh-muted)]">
                              <Maximize size={13} strokeWidth={2.2} /> {room.sqft} sq.ft
                            </span>
                          )}
                        </div>

                        {room.perks?.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                            {room.perks.map((perk) => (
                              <span key={perk} className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-700">
                                <BadgeCheck size={13} strokeWidth={2.3} /> {perk}
                              </span>
                            ))}
                          </div>
                        )}

                        {room.roomsLeft > 0 && room.roomsLeft <= 5 && (
                          <p className="mt-2 text-[11.5px] font-black text-rose-600">Only {room.roomsLeft} left at this price</p>
                        )}
                      </div>

                      <div className="flex flex-col items-end justify-center gap-1 border-l border-[var(--dh-border)] px-5 py-4">
                        {nightly > 0 ? (
                          <>
                            <span className="text-[21px] font-black leading-none text-[var(--dh-text)]">{formatMoney(nightly)}</span>
                            <span className="text-[11.5px] font-semibold text-[var(--dh-muted)]">/ night + Taxes</span>
                          </>
                        ) : (
                          <span className="text-[12.5px] font-bold text-[var(--dh-muted)]">Rate on request</span>
                        )}
                        <button
                          onClick={() => setRoomKey(String(room.key))}
                          className={`mt-2.5 w-full rounded-[10px] py-2.5 text-[13.5px] font-bold transition-colors ${
                            isActive ? 'bg-[#F5B700] text-slate-950' : 'border-2 border-[#F5B700] text-[var(--dh-text)] hover:bg-[#F5B700] hover:text-slate-950'
                          }`}
                        >
                          {isActive ? 'Selected' : 'Select Room'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- Sidebar */}
        <aside className="sticky top-[100px] h-fit space-y-4">
          <div className="rounded-[20px] bg-[var(--dh-surface)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-[var(--dh-border)]">
            <h2 className="text-[17px] font-black tracking-[-0.02em] text-[var(--dh-text)]">Your Booking Summary</h2>

            <div className="mt-4 flex gap-3.5">
              <span className="relative h-[62px] w-[86px] shrink-0 overflow-hidden rounded-[11px] bg-[var(--dh-chip)]">
                <img src={hotel.image || gallery[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] font-black text-[var(--dh-text)]">{hotel.name}</span>
                {Number(hotel.rating) > 0 && (
                  <span className="mt-1 flex items-center gap-1.5">
                    <span className="flex items-center gap-1 rounded-[5px] bg-emerald-600 px-1.5 text-[10.5px] font-black text-white">
                      <Star size={9} className="fill-white" /> {hotel.rating}
                    </span>
                  </span>
                )}
                {hotel.area && <span className="mt-1 block truncate text-[11.5px] font-semibold text-[var(--dh-muted)]">{hotel.area}</span>}
              </span>
            </div>

            <dl className="mt-4 space-y-3 border-t border-[var(--dh-border)] pt-4">
              {[
                ['Check-in', formatDate(search.checkIn), Calendar],
                ['Check-out', formatDate(search.checkOut), Calendar],
                ['Guests & Rooms', quote ? `${quote.guests} Guests, ${quote.rooms} Room${quote.rooms === 1 ? '' : 's'}` : '', Users],
                ['Selected Room', selectedRoom?.name, BedDouble],
                ['Stay', quote ? `${quote.nights} Night${quote.nights === 1 ? '' : 's'}` : '', Ticket],
              ].filter(([, value]) => value).map(([label, value, Icon]) => (
                <div key={label} className="flex gap-2.5">
                  <Icon size={15} className="mt-0.5 shrink-0 text-[var(--dh-muted)]" strokeWidth={2.2} />
                  <span className="min-w-0">
                    <dt className="text-[12px] font-bold text-[var(--dh-text)]">{label}</dt>
                    <dd className="mt-0.5 text-[12.5px] font-semibold text-[var(--dh-muted)]">{value}</dd>
                  </span>
                </div>
              ))}
            </dl>

            <div className="mt-4 border-t border-[var(--dh-border)] pt-4">
              <h3 className="text-[15px] font-black text-[var(--dh-text)]">Price Details</h3>

              {quote ? (
                <div className="mt-3 space-y-2.5">
                  <div className="flex justify-between text-[13px] font-semibold text-[var(--dh-muted)]">
                    <span>Room Charges ({quote.nights} Night{quote.nights === 1 ? '' : 's'})</span>
                    <span className="text-[var(--dh-text)]">{formatMoney(quote.roomCharges)}</span>
                  </div>
                  {quote.memberDiscount > 0 ? (
                    <div className="flex justify-between">
                      <span>Member discount ({quote.memberDiscountPercent}%)</span>
                      <span className="text-emerald-600">− {formatMoney(quote.memberDiscount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-[13px] font-semibold text-[var(--dh-muted)]">
                    <span>Taxes &amp; Fees ({quote.taxPercent}% GST)</span>
                    <span className="text-[var(--dh-text)]">{formatMoney(quote.taxes)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--dh-border)] pt-3">
                    <span className="text-[15px] font-black text-[var(--dh-text)]">Total Amount</span>
                    <span className="text-[21px] font-black text-[var(--dh-text)]">{formatMoney(quote.totalAmount)}</span>
                  </div>
                  {quote.savings > 0 && (
                    <p className="rounded-[11px] bg-emerald-50 px-3.5 py-2.5 text-[12px] font-bold text-emerald-700">
                      You save {formatMoney(quote.savings)} on this stay.
                    </p>
                  )}
                </div>
              ) : quoteError ? (
                <p className="mt-3 rounded-[10px] bg-rose-50 px-3 py-2.5 text-[12.5px] font-bold text-rose-700">{quoteError}</p>
              ) : (
                <div className="mt-3 space-y-2">
                  <div className="skeleton h-4 rounded" />
                  <div className="skeleton h-4 w-2/3 rounded" />
                  <div className="skeleton h-6 rounded" />
                </div>
              )}
            </div>

            <button
              onClick={continueToPayment}
              disabled={!quote || booking || Boolean(confirmed)}
              className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-[13px] bg-[#F5B700] py-3.5 text-[15.5px] font-bold text-slate-950 shadow-[0_10px_24px_rgba(245,183,0,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {confirmed ? `Confirmed · ${confirmed}` : booking ? 'Processing…' : 'Continue to Payment'}
              <ArrowRight size={18} strokeWidth={2.8} />
            </button>

            <button
              onClick={() => navigate('/taxi/user/hotel')}
              className="mt-2.5 flex w-full items-center justify-center gap-2.5 rounded-[13px] border border-[var(--dh-border)] py-3 text-[14.5px] font-bold text-[var(--dh-text)] hover:bg-[var(--dh-chip)]"
            >
              <ArrowLeft size={17} strokeWidth={2.4} /> Back to Hotel List
            </button>
          </div>

          <div className="rounded-[18px] bg-[var(--dh-surface)] p-5 ring-1 ring-[var(--dh-border)]">
            <p className="text-[15px] font-black text-[var(--dh-text)]">Why book with Taxi09?</p>
            <div className="mt-4 space-y-3.5">
              {WHY_BOOK.map(({ icon: Icon, title, copy }) => (
                <div key={title} className="flex gap-2.5">
                  <Icon size={19} className="mt-0.5 shrink-0 text-[#F5B700]" strokeWidth={2.1} />
                  <span>
                    <span className="block text-[12.5px] font-black text-[var(--dh-text)]">{title}</span>
                    <span className="mt-0.5 block text-[11.5px] font-semibold text-[var(--dh-muted)]">{copy}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default DesktopHotelDetail;
