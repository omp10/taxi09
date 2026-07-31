import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Clock, MapPin } from 'lucide-react';

/** Soft tint behind the vehicle image, per service type. */
const TYPE_TINT = {
  ride: 'bg-[#FFF6DA]',
  parcel: 'bg-[#FFF0D6]',
  rental: 'bg-[#FFF6DA]',
  bus: 'bg-[#E8F4FF]',
  pooling: 'bg-[#EAF7EE]',
};

const FALLBACK_IMAGE = {
  parcel: '/5_Parcel.png',
  bus: '/bus.png',
  rental: '/scooty.png',
  pooling: '/4_Taxi.png',
  ride: '/4_Taxi.png',
};

/**
 * Two-letter plate-style tag. Uses the real registration when we have one,
 * otherwise falls back to the city so the badge is never invented.
 */
const buildTag = (registration, pickup) => {
  const plate = String(registration || '').replace(/[^A-Za-z]/g, '');
  if (plate.length >= 2) return plate.slice(0, 2).toUpperCase();
  const city = String(pickup || '').trim();
  return city ? city.slice(0, 2).toUpperCase() : '';
};

const STATUS_TONE = {
  success: 'bg-emerald-50 text-emerald-700',
  danger: 'bg-rose-50 text-rose-600',
  warning: 'bg-amber-50 text-amber-700',
};

const ActivityCard = ({
  type,
  title,
  pickup,
  drop,
  address,
  date,
  time,
  status,
  statusTone,
  price,
  onClick,
  vehicleImage,
  eyebrow,
  registration,
}) => {
  const [broken, setBroken] = useState(false);
  const image = broken ? FALLBACK_IMAGE[type] || FALLBACK_IMAGE.ride : vehicleImage;
  const tint = TYPE_TINT[type] || TYPE_TINT.ride;
  const tag = buildTag(registration, pickup);

  // Older records only carry the combined "A to B" string.
  const [fallbackFrom, fallbackTo] = String(address || '').split(' to ');
  const from = pickup || fallbackFrom || '';
  const to = drop || fallbackTo || '';

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className="w-full cursor-pointer rounded-[14px] border border-[var(--border)] bg-white p-2.5 text-left shadow-[var(--shadow-sm)]"
    >
      <div className="flex gap-3">
        <div className={`relative h-[62px] w-[62px] shrink-0 overflow-hidden rounded-[11px] ${tint}`}>
          <img
            src={image}
            alt=""
            className="h-full w-full object-contain p-1.5"
            draggable={false}
            onError={() => setBroken(true)}
          />
          {tag ? (
            <span className="absolute bottom-1 left-1 rounded-[5px] bg-white/95 px-1 py-[1px] text-[8px] font-extrabold tracking-wide text-slate-700 shadow-sm">
              {tag}
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="truncate text-[12.5px] font-extrabold leading-tight text-[var(--text)]">{title}</h4>
              {eyebrow ? (
                <p className="mt-0.5 truncate text-[8.5px] font-bold uppercase tracking-[0.1em] text-[var(--text-light)]">
                  {eyebrow}
                </p>
              ) : null}
            </div>
            <span className="shrink-0 whitespace-nowrap text-[13px] font-extrabold text-[var(--text)]">
              ₹{Number(price || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="mt-1 space-y-0.5">
            <p className="flex items-start gap-1 text-[9.5px] font-semibold text-[var(--text-light)]">
              <MapPin size={10} className="mt-[2px] shrink-0 text-[var(--primary-dark)]" />
              <span className="truncate">{from}</span>
            </p>
            {to ? (
              <p className="flex items-start gap-1 text-[10px] font-semibold text-[var(--text-light)]">
                <MapPin size={10} className="mt-[2px] shrink-0 text-slate-400" />
                <span className="truncate">{to}</span>
              </p>
            ) : null}
          </div>
        </div>

        <span className="flex h-6 w-6 shrink-0 items-center justify-center self-start rounded-full bg-slate-950 text-white">
          <ChevronRight size={13} strokeWidth={3} />
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-[var(--border)] pt-2">
        <span className="flex items-center gap-1 text-[9px] font-semibold text-[var(--text-light)]">
          <Calendar size={11} strokeWidth={2.4} />
          {date}
        </span>
        <span className="flex items-center gap-1 text-[9px] font-semibold text-[var(--text-light)]">
          <Clock size={11} strokeWidth={2.4} />
          {time}
        </span>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
            STATUS_TONE[statusTone] || STATUS_TONE.warning
          }`}
        >
          {String(status || '').toUpperCase()}
        </span>
      </div>
    </motion.button>
  );
};

export default ActivityCard;
