import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Armchair,
  BusFront,
  CalendarDays,
  ChevronRight,
  Clock3,
  Phone,
  Star,
  ShieldCheck,
  Ticket,
} from 'lucide-react';
import { buildBusRouteState } from './busNavigationState';
import AppHeader from '../../components/AppHeader';

const getRoutePrefix = (pathname = '') => (pathname.startsWith('/taxi/user') ? '/taxi/user' : '');

const formatTravelDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
};

const formatDurationBrief = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return 'Direct';
  return raw
    .replace(/days?/gi, 'd')
    .replace(/hours?/gi, 'h')
    .replace(/hrs?/gi, 'h')
    .replace(/minutes?/gi, 'm')
    .replace(/mins?/gi, 'm')
    .replace(/\s+/g, ' ')
    .trim();
};

const splitCity = (value = '') => String(value).split(',')[0].trim();

const getStopName = (bus, stopType) => {
  const stops = Array.isArray(bus?.route?.stops) ? bus.route.stops : [];
  const wanted = stopType === 'drop' ? ['drop', 'both'] : ['pickup', 'both'];
  const stop = stops.find((item) => wanted.includes(String(item?.stopType || 'pickup').toLowerCase()));
  return String(stop?.pointName || '').trim();
};

const SectionTitle = ({ children }) => (
  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--text-light)]">{children}</p>
);

const Stat = ({ icon: Icon, label, value, tone = '' }) => (
  <div className="min-w-0 rounded-[12px] bg-slate-50 px-2 py-2 text-center">
    <Icon size={13} className="mx-auto text-[var(--text-light)]" />
    <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[var(--text-light)]">{label}</p>
    <p className={`mt-0.5 truncate text-[11px] font-extrabold ${tone}`}>{value}</p>
  </div>
);

const stopBadgeTone = {
  pickup: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  drop: 'border-rose-200 bg-rose-50 text-rose-700',
  both: 'border-indigo-200 bg-indigo-50 text-indigo-700',
};

const BusPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routePrefix = useMemo(() => getRoutePrefix(location.pathname), [location.pathname]);
  const state = location.state || {};
  const { bus, fromCity, toCity, date } = state;
  const [activeImage, setActiveImage] = useState(bus?.coverImage || bus?.image || bus?.galleryImages?.[0] || '');
  const [openPolicy, setOpenPolicy] = useState('');

  if (!bus?.busServiceId || !bus?.scheduleId) {
    navigate(`${routePrefix}/bus`, { replace: true });
    return null;
  }

  const gallery = [
    bus?.coverImage || bus?.image || '',
    ...(Array.isArray(bus?.galleryImages) ? bus.galleryImages : []),
  ].filter(Boolean).filter((image, index, list) => list.indexOf(image) === index);
  const routeStops = Array.isArray(bus?.route?.stops) ? bus.route.stops : [];
  const boardingPoint = getStopName(bus, 'pickup');
  const droppingPoint = getStopName(bus, 'drop');
  const hasRating = Number(bus?.ratingCount || 0) > 0 && Number(bus?.rating || 0) > 0;
  const policies = [
    { key: 'boarding', label: 'Boarding Policy', text: bus?.boardingPolicy },
    { key: 'cancellation', label: 'Cancellation Policy', text: bus?.cancellationPolicy },
    { key: 'luggage', label: 'Luggage Policy', text: bus?.luggagePolicy },
  ].filter((item) => Boolean(item.text));

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-[var(--background)] pb-28 text-[var(--text)]">
      <AppHeader showBack subtitle="BUS DETAILS" />

      <div className="space-y-3 px-3 pt-3">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]"
        >
          <div className="relative h-[168px] bg-slate-900">
            {activeImage ? (
              <img
                src={activeImage}
                alt={bus.busName || bus.operator || 'Bus'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,#FFD54F,#FFC107)]">
                <BusFront size={56} className="text-white/90" />
              </div>
            )}
            {/* Solid scrim so the overlay text stays readable on any photo */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent" />

            {hasRating ? (
              <span className="absolute left-3 top-3 flex items-center gap-1 rounded-[10px] bg-[var(--success)] px-2 py-1 text-[10px] font-bold text-white">
                <Star size={10} className="fill-current" />
                {Number(bus.rating).toFixed(1)}
                {bus.ratingCount ? <span className="font-medium opacity-80">({bus.ratingCount})</span> : null}
              </span>
            ) : null}
            <span className="absolute right-3 top-3 rounded-[10px] bg-black/60 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
              {bus.type || 'Coach'}
            </span>

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3.5 text-white">
              <div className="min-w-0">
                <p className="truncate text-[9px] font-bold uppercase tracking-[0.16em] text-white/70">
                  {bus.busName || 'Coach Service'}
                </p>
                <h2 className="mt-0.5 truncate text-[19px] font-extrabold leading-tight">{bus.operator}</h2>
                <p className="mt-0.5 truncate text-[10px] font-medium text-white/75">
                  {bus.routeName || `${fromCity} to ${toCity}`}
                </p>
              </div>
              <div className="shrink-0 rounded-[12px] bg-white/15 px-2.5 py-1.5 text-right backdrop-blur-md">
                <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/70">Starts at</p>
                <p className="text-[19px] font-extrabold leading-tight">Rs{Number(bus.price || 0)}</p>
              </div>
            </div>
          </div>

          {gallery.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto p-2.5 no-scrollbar">
              {gallery.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(image)}
                  className={`shrink-0 overflow-hidden rounded-[12px] border-2 transition-colors ${
                    activeImage === image ? 'border-[var(--primary)]' : 'border-transparent'
                  }`}
                >
                  <img src={image} alt={`${bus.operator} ${index + 1}`} className="h-14 w-20 object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </motion.div>

        {/* Timeline */}
        <div className="rounded-[20px] border border-[var(--border)] bg-white p-3.5 shadow-[var(--shadow-sm)]">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="min-w-0">
              <p className="text-[20px] font-extrabold leading-none">{bus.departure || '--:--'}</p>
              <p className="mt-1 truncate text-[10px] font-bold text-[var(--text-light)]">{splitCity(fromCity)}</p>
              {boardingPoint ? (
                <p className="truncate text-[9px] font-medium text-[var(--text-light)]">{boardingPoint}</p>
              ) : null}
            </div>
            <div className="flex flex-col items-center px-2">
              <span className="text-[9px] font-bold text-[var(--text-light)]">{formatDurationBrief(bus.duration)}</span>
              <div className="my-1 flex w-16 items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                <span className="h-px flex-1 bg-[var(--border)]" />
                <BusFront size={12} className="text-[var(--text-light)]" />
                <span className="h-px flex-1 bg-[var(--border)]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
              </div>
              <span className="text-[9px] font-medium text-[var(--text-light)]">Direct</span>
            </div>
            <div className="min-w-0 text-right">
              <p className="text-[20px] font-extrabold leading-none">{bus.arrival || '--:--'}</p>
              <p className="mt-1 truncate text-[10px] font-bold text-[var(--text-light)]">{splitCity(toCity)}</p>
              {droppingPoint ? (
                <p className="truncate text-[9px] font-medium text-[var(--text-light)]">{droppingPoint}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3">
            <Stat icon={CalendarDays} label="Travel date" value={formatTravelDate(date)} />
            <Stat icon={Armchair} label="Seats left" value={`${bus.availableSeats || 0}`} tone="text-[var(--success)]" />
            <Stat icon={Ticket} label="Per seat" value={`Rs${Number(bus.price || 0)}`} />
          </div>
        </div>

        {/* Amenities */}
        {Array.isArray(bus.amenities) && bus.amenities.length > 0 ? (
          <div className="rounded-[20px] border border-[var(--border)] bg-white p-3.5 shadow-[var(--shadow-sm)]">
            <SectionTitle>Onboard Amenities</SectionTitle>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {bus.amenities.map((amenity) => (
                <div
                  key={amenity}
                  className="flex items-center gap-2 rounded-[12px] bg-[var(--secondary)] px-2.5 py-2 text-[10.5px] font-semibold"
                >
                  <ShieldCheck size={12} className="shrink-0 text-[var(--primary-dark)]" />
                  <span className="truncate">{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Stops */}
        <div className="rounded-[20px] border border-[var(--border)] bg-white p-3.5 shadow-[var(--shadow-sm)]">
          <SectionTitle>Stops &amp; Boarding Points</SectionTitle>
          <div className="mt-2.5">
            {routeStops.length > 0 ? (
              <div className="relative space-y-3 pl-4">
                <span className="absolute bottom-2 left-[3px] top-2 w-px bg-[var(--border)]" />
                {routeStops.map((stop, index) => (
                  <div key={stop.id || `${bus.id}-stop-${index}`} className="relative">
                    <span
                      className={`absolute -left-4 top-1.5 h-[7px] w-[7px] rounded-full ring-2 ring-white ${
                        stop.stopType === 'drop' ? 'bg-rose-500' : 'bg-[var(--primary)]'
                      }`}
                    />
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-extrabold">
                          {stop.city || stop.pointName || `Stop ${index + 1}`}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] font-medium text-[var(--text-light)]">
                          {stop.pointName || 'Point not set'}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className={`inline-flex rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                            stopBadgeTone[stop.stopType] || stopBadgeTone.both
                          }`}
                        >
                          {stop.stopType === 'both' ? 'BP + DP' : stop.stopType === 'drop' ? 'DP' : 'BP'}
                        </span>
                        <p className="mt-0.5 text-[10px] font-bold text-[var(--text-light)]">
                          {stop.arrivalTime || stop.departureTime || '--:--'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-[14px] border border-dashed border-[var(--border)] bg-slate-50 px-3 py-5 text-center text-[11px] font-semibold text-[var(--text-light)]">
                No stop details added for this bus yet.
              </p>
            )}
          </div>
        </div>

        {/* Policies */}
        {policies.length > 0 ? (
          <div className="rounded-[20px] border border-[var(--border)] bg-white p-3.5 shadow-[var(--shadow-sm)]">
            <SectionTitle>Policies</SectionTitle>
            <div className="mt-2.5 space-y-2">
              {policies.map(({ key, label, text }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setOpenPolicy((current) => (current === key ? '' : key))}
                  className="w-full rounded-[14px] bg-slate-50 px-3 py-2.5 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold">{label}</span>
                    <ChevronRight
                      size={14}
                      className={`shrink-0 text-[var(--text-light)] transition-transform ${
                        openPolicy === key ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                  {openPolicy === key ? (
                    <p className="mt-1.5 text-[10.5px] font-medium leading-[1.6] text-[var(--text-light)]">{text}</p>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {(bus.driverName || bus.driverPhone) ? (
          <div className="flex items-center justify-between rounded-[20px] border border-[var(--border)] bg-white p-3.5 shadow-[var(--shadow-sm)]">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">Bus Staff</p>
              <p className="mt-0.5 truncate text-[12px] font-extrabold">{bus.driverName || 'Assigned crew'}</p>
            </div>
            {bus.driverPhone ? (
              <a
                href={`tel:${bus.driverPhone}`}
                className="flex shrink-0 items-center gap-1.5 rounded-[12px] border border-[var(--border)] px-3 py-2 text-[11px] font-bold"
              >
                <Phone size={12} className="text-[var(--primary-dark)]" />
                Call
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-lg -translate-x-1/2 border-t border-[var(--border)] bg-white/95 px-4 pb-6 pt-3 backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">Starting from</p>
            <p className="text-[18px] font-extrabold leading-tight">
              Rs{Number(bus.price || 0)}
              <span className="ml-1 text-[10px] font-medium text-[var(--text-light)]">per seat</span>
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-[var(--success)]">
            {bus.availableSeats || 0} seats left
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate(`${routePrefix}/bus/seats`, { state: buildBusRouteState(state) })}
          className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(180deg,#FFD54F,#FFC107)] py-3.5 text-[15px] font-extrabold text-[var(--text)] shadow-[0_8px_20px_rgba(255,193,7,.4)] active:scale-[0.99] transition-transform"
        >
          Select Seats <ChevronRight size={18} strokeWidth={2.8} />
        </button>
      </div>
    </div>
  );
};

export default BusPreview;
