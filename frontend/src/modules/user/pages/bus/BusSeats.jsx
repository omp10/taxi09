import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Loader2, Info } from 'lucide-react';
import userBusService from '../../services/busService';
import AppHeader from '../../components/AppHeader';
import { buildBusRouteState, toPlainData } from './busNavigationState';

const getRoutePrefix = (pathname = '') => (pathname.startsWith('/taxi/user') ? '/taxi/user' : '');

const resolveSeatPrice = (bus, seat) => {
  const variantPricing = bus?.variantPricing || {};
  const defaultPrice = Number(bus?.price || 0);
  const variantKey = String(seat?.variant || 'seat').trim().toLowerCase();
  const resolvedPrice = variantPricing?.[variantKey] ?? variantPricing?.seat ?? defaultPrice;

  return Number.isFinite(Number(resolvedPrice)) ? Number(resolvedPrice) : defaultPrice;
};

const countSeats = (rows = []) =>
  rows.flat().filter((cell) => cell?.kind === 'seat').length;

const countOpenSeats = (rows = []) =>
  rows.flat().filter((cell) => cell?.kind === 'seat' && cell.status !== 'booked').length;

/** Front-of-bus marker: driver's wheel sits on the right of the cabin. */
const SteeringWheel = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-300" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    <path d="M12 15v6M9.5 10.5 4 8M14.5 10.5 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * A single berth/seat. Sleepers render as tall vertical berths with a pillow
 * end; seaters render as compact squares.
 */
const SeatCell = ({ seat, isSelected, onToggle }) => {
  const isBooked = seat.status === 'booked';
  const isSleeper = seat.variant === 'sleeper';

  const tone = isBooked
    ? 'cursor-not-allowed border-slate-200 bg-slate-100'
    : isSelected
      ? 'border-[var(--primary-dark)] bg-[linear-gradient(180deg,#FFD54F,#FFC107)] shadow-[0_4px_12px_rgba(245,183,0,.4)]'
      : 'border-[var(--border)] bg-white hover:border-[var(--primary)]';

  const labelTone = isBooked ? 'text-slate-400' : isSelected ? 'text-[var(--text)]' : 'text-[var(--text-light)]';

  return (
    <motion.button
      type="button"
      disabled={isBooked}
      whileTap={!isBooked ? { scale: 0.9 } : {}}
      onClick={() => onToggle(seat)}
      className={`relative flex w-full flex-col items-center justify-end border-2 transition-colors ${tone} ${
        isSleeper ? 'h-[78px] rounded-[12px] pb-1.5' : 'h-[36px] justify-center rounded-[8px]'
      }`}
      aria-label={isBooked ? `Berth ${seat.label || seat.id} sold out` : `Berth ${seat.label || seat.id}`}
      title={isBooked ? `Sold out: ${seat.label || seat.id}` : `Available: ${seat.label || seat.id}`}
    >
      {isSleeper ? (
        // pillow at the head of the berth
        <>
          <span
            className={`absolute inset-x-1.5 top-1.5 h-[13px] rounded-[5px] ${
              isBooked ? 'bg-slate-200' : isSelected ? 'bg-white/60' : 'bg-slate-100'
            }`}
          />
          {/* side rails run the length of the berth so it reads as a bed */}
          <span
            className={`absolute bottom-1.5 left-1 top-[19px] w-[2.5px] rounded-full ${
              isBooked ? 'bg-slate-200' : isSelected ? 'bg-white/50' : 'bg-slate-100'
            }`}
          />
          <span
            className={`absolute bottom-1.5 right-1 top-[19px] w-[2.5px] rounded-full ${
              isBooked ? 'bg-slate-200' : isSelected ? 'bg-white/50' : 'bg-slate-100'
            }`}
          />
        </>
      ) : (
        // backrest strip along the top of the seat
        <span
          className={`absolute inset-x-1.5 top-1 h-[5px] rounded-full ${
            isBooked ? 'bg-slate-200' : isSelected ? 'bg-white/60' : 'bg-slate-200'
          }`}
        />
      )}
      <span className={`relative text-[11px] font-extrabold leading-none ${labelTone} ${isSleeper ? '' : 'mt-1.5'}`}>
        {seat.label || seat.id}
      </span>
    </motion.button>
  );
};

const SeatDeck = ({ rows, selectedSeatIds, onToggle, showWheel }) => {
  if (!rows?.length) return null;

  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[#fcfcfd] p-2.5">
      {showWheel ? (
        <div className="mb-2 flex items-center justify-between border-b border-dashed border-[var(--border)] pb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-light)]">Front</span>
          <SteeringWheel />
        </div>
      ) : null}

      <div className="mx-auto max-w-[260px] space-y-1.5">
        {rows.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid gap-1.5"
            style={{
              // aisle gets a narrower track so a 2+1 coach reads correctly
              gridTemplateColumns: row
                .map((cell) => (cell?.kind === 'seat' ? 'minmax(0, 1fr)' : 'minmax(0, 0.4fr)'))
                .join(' '),
            }}
          >
            {row.map((seat, cellIndex) =>
              !seat || seat.kind !== 'seat' ? (
                <div key={`gap-${rowIndex}-${cellIndex}`} className="w-full" />
              ) : (
                <SeatCell
                  key={seat.id}
                  seat={seat}
                  isSelected={selectedSeatIds.includes(seat.id)}
                  onToggle={onToggle}
                />
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const BusSeats = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routePrefix = useMemo(() => getRoutePrefix(location.pathname), [location.pathname]);
  const state = location.state || {};
  const { bus, fromCity, toCity, date } = state;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seatLayout, setSeatLayout] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [activeDeck, setActiveDeck] = useState('lower');

  useEffect(() => {
    if (!bus?.busServiceId || !bus?.scheduleId || !date) {
      navigate(`${routePrefix}/bus`, { replace: true });
      return;
    }

    let active = true;

    const loadSeats = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await userBusService.getSeatLayout({
          busServiceId: bus.busServiceId,
          scheduleId: bus.scheduleId,
          date,
        });
        if (!active) return;
        setSeatLayout(toPlainData(response?.data) || null);
      } catch (err) {
        if (!active) return;
        setError(err?.message || 'Failed to load seat layout');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSeats();

    return () => {
      active = false;
    };
  }, [bus?.busServiceId, bus?.scheduleId, date, navigate, routePrefix]);

  const lowerDeck = seatLayout?.blueprint?.lowerDeck || [];
  const upperDeck = seatLayout?.blueprint?.upperDeck || [];
  const hasUpperDeck = countSeats(upperDeck) > 0;
  const isSleeperBus = String(seatLayout?.blueprint?.templateKey || '').includes('sleeper');
  const activeRows = activeDeck === 'upper' && hasUpperDeck ? upperDeck : lowerDeck;

  const toggleSeat = (seat) => {
    if (!seat || seat.status === 'booked') return;

    setSelectedSeats((current) =>
      current.some((item) => item.id === seat.id)
        ? current.filter((item) => item.id !== seat.id)
        : [
            ...current,
            {
              id: seat.id,
              label: seat.label || seat.id,
              variant: seat.variant || 'seat',
              price: resolveSeatPrice(seatLayout?.bus || bus, seat),
            },
          ],
    );
  };

  const totalFare = selectedSeats.reduce((sum, seat) => sum + Number(seat.price || 0), 0);
  const selectedSeatIds = selectedSeats.map((seat) => seat.id);

  const legend = [
    { key: 'available', label: 'Available', className: 'border-2 border-[var(--border)] bg-white' },
    {
      key: 'selected',
      label: 'Selected',
      className: 'border-2 border-[var(--primary-dark)] bg-[linear-gradient(180deg,#FFD54F,#FFC107)]',
    },
    { key: 'booked', label: 'Booked', className: 'border-2 border-slate-200 bg-slate-100' },
  ];

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-[var(--background)] pb-40 text-[var(--text)]">
      <AppHeader showBack subtitle="SELECT SEATS" />

      <div className="space-y-3 px-3 pt-3">
        <div className="rounded-[18px] border border-[var(--border)] bg-white px-3.5 py-3 shadow-[var(--shadow-sm)]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[14.5px] font-extrabold">{bus?.operator || 'Bus Service'}</p>
              <p className="mt-0.5 truncate text-[12px] font-medium text-[var(--text-light)]">
                {fromCity} to {toCity}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--secondary)] px-2.5 py-1 text-[11.5px] font-bold text-[var(--primary-dark)]">
              {isSleeperBus ? 'Sleeper' : 'Seater'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 rounded-[18px] border border-[var(--border)] bg-white p-12">
            <Loader2 size={28} className="animate-spin text-[var(--primary)]" />
            <p className="text-[13.5px] font-bold text-[var(--text-light)]">Loading seat map...</p>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-[16px] border border-rose-100 bg-rose-50 p-4 text-[13.5px] font-bold text-rose-600">
            {error}
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="rounded-[20px] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-sm)]">
              {hasUpperDeck ? (
                <div className="mb-3 grid grid-cols-2 gap-2 rounded-[12px] bg-slate-100 p-1">
                  {[
                    { id: 'lower', label: 'Lower Deck', rows: lowerDeck },
                    { id: 'upper', label: 'Upper Deck', rows: upperDeck },
                  ].map((deck) => (
                    <button
                      key={deck.id}
                      type="button"
                      onClick={() => setActiveDeck(deck.id)}
                      className={`rounded-[10px] py-2 text-[13px] font-extrabold transition-colors ${
                        activeDeck === deck.id
                          ? 'bg-white text-[var(--text)] shadow-[var(--shadow-sm)]'
                          : 'text-[var(--text-light)]'
                      }`}
                    >
                      {deck.label}
                      <span className="ml-1 font-bold text-[var(--text-light)]">({countOpenSeats(deck.rows)})</span>
                    </button>
                  ))}
                </div>
              ) : null}

              <SeatDeck
                rows={activeRows}
                selectedSeatIds={selectedSeatIds}
                onToggle={toggleSeat}
                showWheel={!hasUpperDeck || activeDeck === 'lower'}
              />

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--border)] pt-3">
                {legend.map((item) => (
                  <div key={item.key} className="flex items-center gap-1.5">
                    <span className={`h-3.5 w-3.5 rounded-[5px] ${item.className}`} />
                    <span className="text-[11.5px] font-bold text-[var(--text-light)]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="flex items-center gap-1.5 px-1 text-[11.5px] font-medium text-[var(--text-light)]">
              <Info size={11} className="shrink-0" />
              {isSleeperBus
                ? 'Berth prices vary by deck and position. Tap a berth to select.'
                : 'Window seats may be priced higher. Tap a seat to select.'}
            </p>
          </>
        ) : null}
      </div>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-lg -translate-x-1/2 border-t border-[var(--border)] bg-white px-4 pb-6 pt-3">
        <AnimatePresence>
          {selectedSeats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-2.5 flex items-center justify-between gap-3 rounded-[14px] bg-[var(--secondary)] px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-light)]">
                  {selectedSeats.length} {isSleeperBus ? 'Berth' : 'Seat'}
                  {selectedSeats.length > 1 ? 's' : ''} selected
                </p>
                <p className="mt-0.5 truncate text-[13.5px] font-extrabold">
                  {selectedSeats.map((seat) => seat.label || seat.id).join(', ')}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-light)]">Total</p>
                <p className="text-[18px] font-extrabold leading-tight">Rs{totalFare}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          disabled={selectedSeats.length === 0 || !!error || loading}
          whileTap={{ scale: 0.98 }}
          onClick={() =>
            navigate(`${routePrefix}/bus/checkout`, {
              state: buildBusRouteState(state, {
                bus: seatLayout?.bus || bus,
                selectedSeats,
                totalFare,
              }),
            })
          }
          className={`flex w-full items-center justify-center gap-2 rounded-[16px] py-3.5 text-[16.5px] font-extrabold transition-colors ${
            selectedSeats.length > 0 && !error && !loading
              ? 'bg-[linear-gradient(180deg,#FFD54F,#FFC107)] text-[var(--text)] shadow-[0_8px_20px_rgba(255,193,7,.4)]'
              : 'cursor-not-allowed bg-slate-100 text-slate-400'
          }`}
        >
          Proceed to Payment <ChevronRight size={18} strokeWidth={2.8} />
        </motion.button>
      </div>
    </div>
  );
};

export default BusSeats;
