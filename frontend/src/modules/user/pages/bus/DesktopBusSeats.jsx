import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Armchair, Clock, MapPin, Star, Ticket,
} from 'lucide-react';
import userBusService from '../../services/busService';
import { DesktopNav } from '../../components/desktop/DesktopChrome';
import { useDesktopTheme } from '../../components/desktop/desktopShared';
import { buildBusRouteState, toPlainData } from './busNavigationState';

/**
 * Desktop seat selection for /taxi/user/bus/seats.
 *
 * Sleeper coaches draw as tall vertical berths (the layout riders expect from
 * redbus); seaters draw as compact squares. Everything comes from the seat
 * layout endpoint - no seat map is assumed client-side.
 */

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

/** "21:00" -> "9:00 PM"; anything unparseable is passed through. */
const to12Hour = (value) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
  if (!match) return value || '';
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${display}:${match[2]} ${suffix}`;
};

const countSeats = (deck) =>
  (Array.isArray(deck) ? deck : []).reduce(
    (total, row) => total + (Array.isArray(row) ? row.filter((cell) => cell && cell.type !== 'aisle').length : 0),
    0,
  );

const SeatCell = ({ seat, isSelected, onToggle }) => {
  const isBooked = seat.status === 'booked';
  const isSleeper = seat.variant === 'sleeper';

  const tone = isBooked
    ? 'cursor-not-allowed border-[var(--dh-border)] bg-[var(--dh-chip)]'
    : isSelected
      ? 'border-[#F4B400] bg-[linear-gradient(180deg,#FFD54F,#FFC107)] shadow-[0_4px_12px_rgba(245,183,0,0.4)]'
      : 'border-[var(--dh-border)] bg-[var(--dh-surface)] hover:border-[#F5B700]';

  return (
    <button
      type="button"
      disabled={isBooked}
      onClick={() => onToggle(seat)}
      aria-pressed={isSelected}
      aria-label={`${isSleeper ? 'Berth' : 'Seat'} ${seat.label || seat.id}${isBooked ? ' sold out' : ''}`}
      title={isBooked ? `Sold out: ${seat.label || seat.id}` : `${seat.label || seat.id} · ${formatMoney(seat.price)}`}
      className={`relative flex flex-col items-center justify-end border-2 transition-colors ${tone} ${
        isSleeper ? 'h-[74px] w-[38px] rounded-[11px] pb-1' : 'h-[38px] w-[38px] justify-center rounded-[9px]'
      }`}
    >
      {/* Pillow end, so a berth reads as a berth at a glance. */}
      {isSleeper && (
        <span
          className={`absolute left-1/2 top-1 h-[11px] w-[22px] -translate-x-1/2 rounded-[5px] ${
            isBooked ? 'bg-slate-300' : isSelected ? 'bg-white/70' : 'bg-[var(--dh-chip)]'
          }`}
        />
      )}
      <span className={`text-[12.5px] font-black ${isBooked ? 'text-slate-400' : isSelected ? 'text-slate-900' : 'text-[var(--dh-muted)]'}`}>
        {seat.label || seat.id}
      </span>
    </button>
  );
};

const DesktopBusSeats = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, toggleTheme] = useDesktopTheme();

  const state = location.state || {};
  const { bus, fromCity, toCity, date } = state;

  const [seatLayout, setSeatLayout] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [activeDeck, setActiveDeck] = useState('lower');
  // Derived rather than set synchronously inside the fetch effect.
  const [resolved, setResolved] = useState(null);

  const layoutKey = `${bus?.busServiceId || ''}|${bus?.scheduleId || ''}|${date || ''}`;
  const loading = resolved?.key !== layoutKey;
  const error = resolved?.key === layoutKey ? resolved.error : '';

  useEffect(() => {
    if (!bus?.busServiceId || !bus?.scheduleId || !date) {
      navigate('/taxi/user/bus', { replace: true });
      return undefined;
    }

    let cancelled = false;
    userBusService
      .getSeatLayout({ busServiceId: bus.busServiceId, scheduleId: bus.scheduleId, date })
      .then((response) => {
        if (cancelled) return;
        setSeatLayout(toPlainData(response?.data) || null);
        setResolved({ key: layoutKey, error: '' });
      })
      .catch((err) => {
        if (cancelled) return;
        setSeatLayout(null);
        setResolved({ key: layoutKey, error: err?.response?.data?.message || 'Failed to load seat layout' });
      });
    return () => { cancelled = true; };
  }, [bus?.busServiceId, bus?.scheduleId, date, layoutKey, navigate]);

  const lowerDeck = seatLayout?.blueprint?.lowerDeck || [];
  const upperDeck = seatLayout?.blueprint?.upperDeck || [];
  const hasUpperDeck = countSeats(upperDeck) > 0;
  const activeRows = activeDeck === 'upper' && hasUpperDeck ? upperDeck : lowerDeck;

  const selectedIds = selectedSeats.map((seat) => seat.id);
  const totalFare = selectedSeats.reduce((sum, seat) => sum + Number(seat.price || 0), 0);

  const availableCount = useMemo(
    () => [...lowerDeck, ...upperDeck]
      .flat()
      .filter((cell) => cell && cell.type !== 'aisle' && cell.status !== 'booked' && cell.status !== 'blocked').length,
    [lowerDeck, upperDeck],
  );

  const toggleSeat = (seat) => {
    if (!seat || seat.status === 'booked') return;
    setSelectedSeats((current) =>
      current.some((item) => item.id === seat.id)
        ? current.filter((item) => item.id !== seat.id)
        : [...current, { id: seat.id, label: seat.label || seat.id, price: Number(seat.price || bus?.price || 0), variant: seat.variant }],
    );
  };

  const proceed = () => {
    navigate('/taxi/user/bus/checkout', {
      state: buildBusRouteState(state, { bus: seatLayout?.bus || bus, selectedSeats, totalFare }),
    });
  };

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath="/taxi/user/bus" theme={theme} onToggleTheme={toggleTheme} />

      <section className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)_390px] gap-6 px-8 pb-20 pt-5 xl:px-12">
        <div className="rounded-[20px] bg-[var(--dh-surface)] p-6 ring-1 ring-[var(--dh-border)]">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[15px] font-bold text-[var(--dh-text)] hover:text-[#F5B700]"
          >
            <ArrowLeft size={16} strokeWidth={2.6} /> Back to Buses
          </button>

          {/* ---------------------------------------------------------- Bus head */}
          <div className="mt-4 flex items-start justify-between gap-6 border-b border-[var(--dh-border)] pb-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="truncate text-[22px] font-black tracking-[-0.03em] text-[var(--dh-text)]">
                  {bus?.operatorName || bus?.operator || 'Bus'}
                </h1>
                {(bus?.coachType || bus?.type) && (
                  <span className="shrink-0 rounded-[6px] bg-[var(--dh-chip)] px-2 py-0.5 text-[12.5px] font-black uppercase tracking-[0.05em] text-[var(--dh-muted)]">
                    {bus.coachType || bus.type}
                  </span>
                )}
                {Number(bus?.rating) > 0 && (
                  <span className="flex shrink-0 items-center gap-1 rounded-[6px] bg-emerald-600 px-1.5 py-0.5 text-[13px] font-black text-white">
                    <Star size={10} className="fill-white" /> {bus.rating}
                  </span>
                )}
              </div>
              {bus?.busName && <p className="mt-0.5 text-[14.5px] font-semibold text-[var(--dh-muted)]">{bus.busName}</p>}
              <p className="mt-2 flex items-center gap-4 text-[14.5px] font-semibold text-[var(--dh-muted)]">
                <span className="flex items-center gap-1.5"><MapPin size={14} strokeWidth={2.2} /> {fromCity} → {toCity}</span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} strokeWidth={2.2} /> {to12Hour(bus?.departure)} – {to12Hour(bus?.arrival)}
                </span>
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[13.5px] font-semibold text-[var(--dh-muted)]">{date}</p>
              {!loading && !error && (
                <p className="mt-1 text-[14px] font-black text-emerald-600">{availableCount} seats available</p>
              )}
            </div>
          </div>

          {/* ------------------------------------------------------------- Decks */}
          {hasUpperDeck && (
            <div className="mt-5 flex gap-2.5">
              {['lower', 'upper'].map((deck) => (
                <button
                  key={deck}
                  onClick={() => setActiveDeck(deck)}
                  aria-pressed={activeDeck === deck}
                  className={`rounded-[11px] border px-5 py-2.5 text-[15px] font-bold capitalize transition-colors ${
                    activeDeck === deck
                      ? 'border-[#F5B700] bg-[#FFF7DC] text-slate-900'
                      : 'border-[var(--dh-border)] text-[var(--dh-text)] hover:bg-[var(--dh-chip)]'
                  }`}
                >
                  {deck} deck
                </button>
              ))}
            </div>
          )}

          {/* -------------------------------------------------------- Seat layout */}
          {loading ? (
            <div className="mt-5 space-y-3">
              {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-[74px] rounded-[12px]" />)}
            </div>
          ) : error ? (
            <p className="mt-5 rounded-[12px] bg-rose-50 px-4 py-3.5 text-[14.5px] font-bold text-rose-700">{error}</p>
          ) : activeRows.length === 0 ? (
            <p className="mt-5 rounded-[12px] bg-[var(--dh-chip)] px-4 py-10 text-center text-[15px] font-semibold text-[var(--dh-muted)]">
              No seat map configured for this bus.
            </p>
          ) : (
            <>
              <div className="mt-5 flex flex-wrap items-center gap-5">
                {[
                  ['Available', 'border-[var(--dh-border)] bg-[var(--dh-surface)]'],
                  ['Selected', 'border-[#F4B400] bg-[linear-gradient(180deg,#FFD54F,#FFC107)]'],
                  ['Sold out', 'border-[var(--dh-border)] bg-[var(--dh-chip)]'],
                ].map(([label, tone]) => (
                  <span key={label} className="flex items-center gap-2 text-[13.5px] font-semibold text-[var(--dh-muted)]">
                    <span className={`h-4 w-4 rounded-[5px] border-2 ${tone}`} /> {label}
                  </span>
                ))}
              </div>

              <div className="mt-5 w-fit rounded-[16px] border border-[var(--dh-border)] bg-[var(--dh-chip)]/40 p-5">
                <div className="mb-3 flex items-center justify-end gap-1.5 text-[13px] font-bold text-[var(--dh-muted)]">
                  <Armchair size={13} strokeWidth={2.3} /> Driver
                </div>
                <div className="space-y-2">
                  {activeRows.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex items-end gap-2">
                      {(Array.isArray(row) ? row : []).map((cell, cellIndex) =>
                        !cell || cell.type === 'aisle' ? (
                          <span key={`gap-${rowIndex}-${cellIndex}`} className="w-[38px]" />
                        ) : (
                          <SeatCell
                            key={cell.id || `${rowIndex}-${cellIndex}`}
                            seat={cell}
                            isSelected={selectedIds.includes(cell.id)}
                            onToggle={toggleSeat}
                          />
                        ),
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ------------------------------------------------------------- Sidebar */}
        <aside className="sticky top-[100px] h-fit rounded-[20px] bg-[var(--dh-surface)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-[var(--dh-border)]">
          <h2 className="text-[18px] font-black tracking-[-0.02em] text-[var(--dh-text)]">Your Selection</h2>

          {selectedSeats.length === 0 ? (
            <p className="mt-4 rounded-[12px] bg-[var(--dh-chip)] px-4 py-8 text-center text-[14.5px] font-semibold text-[var(--dh-muted)]">
              Pick a seat from the layout to continue.
            </p>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedSeats.map((seat) => (
                  <button
                    key={seat.id}
                    onClick={() => toggleSeat(seat)}
                    className="flex items-center gap-1.5 rounded-[9px] bg-[#FFF7DC] px-2.5 py-1.5 text-[14px] font-black text-slate-900"
                    aria-label={`Remove ${seat.label}`}
                  >
                    <Ticket size={12} strokeWidth={2.6} /> {seat.label}
                  </button>
                ))}
              </div>

              <dl className="mt-4 space-y-2.5 border-t border-[var(--dh-border)] pt-4">
                <div className="flex justify-between text-[14.5px] font-semibold text-[var(--dh-muted)]">
                  <dt>Seats</dt>
                  <dd className="text-[var(--dh-text)]">{selectedSeats.length}</dd>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--dh-border)] pt-3">
                  <dt className="text-[16.5px] font-black text-[var(--dh-text)]">Total Fare</dt>
                  <dd className="text-[21px] font-black text-[var(--dh-text)]">{formatMoney(totalFare)}</dd>
                </div>
                <p className="text-[13.5px] font-medium text-[var(--dh-muted)]">
                  Taxes and any operator fees are confirmed on the payment step.
                </p>
              </dl>
            </>
          )}

          <button
            onClick={proceed}
            disabled={selectedSeats.length === 0 || Boolean(error) || loading}
            className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-[13px] bg-[#F5B700] py-3.5 text-[17px] font-bold text-slate-950 shadow-[0_10px_24px_rgba(245,183,0,0.3)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Proceed to Payment <ArrowRight size={18} strokeWidth={2.8} />
          </button>

          <button
            onClick={() => navigate(-1)}
            className="mt-2.5 flex w-full items-center justify-center gap-2.5 rounded-[13px] border border-[var(--dh-border)] py-3 text-[16px] font-bold text-[var(--dh-text)] hover:bg-[var(--dh-chip)]"
          >
            <ArrowLeft size={17} strokeWidth={2.4} /> Back to Buses
          </button>
        </aside>
      </section>
    </div>
  );
};

export default DesktopBusSeats;
