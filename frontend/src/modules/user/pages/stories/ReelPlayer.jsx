import React, { useEffect, useRef, useState } from 'react';
import { Heart, MapPin, Volume2, VolumeX, X } from 'lucide-react';

/**
 * Plays a travel reel.
 *
 * Autoplay is only allowed while muted, so it starts muted and the control is
 * the first thing to hand. The poster frame shows until the first frame decodes,
 * which keeps the panel from flashing black on a slow connection.
 */
const ReelPlayer = ({ reel, onClose, onLike }) => {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);

  // Escape closes it, as with any lightbox.
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!reel) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex w-full max-w-5xl gap-5"
        onClick={(event) => event.stopPropagation()}
        role="presentation"
      >
        {/* Portrait frame, since reels are shot on a phone */}
        <div className="relative mx-auto aspect-[9/16] max-h-[82vh] overflow-hidden rounded-2xl bg-black">
          <video
            ref={videoRef}
            src={reel.videoUrl}
            poster={reel.coverImage}
            className="h-full w-full object-cover"
            autoPlay
            loop
            muted={muted}
            playsInline
            controls
          />

          <button
            type="button"
            onClick={() => setMuted((current) => !current)}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>

        {/* Everything about the trip, beside the video rather than over it */}
        <aside className="hidden w-[300px] shrink-0 self-center rounded-2xl bg-white p-5 lg:block">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#C79100]">{reel.category}</p>
              <h2 className="mt-1 text-[17px] font-black leading-snug text-slate-900">{reel.title}</h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 rounded-lg p-1 text-slate-500">
              <X size={18} />
            </button>
          </div>

          {reel.location ? (
            <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-slate-500">
              <MapPin size={13} /> {reel.location}{reel.state ? `, ${reel.state}` : ''}
            </p>
          ) : null}

          <p className="mt-3 text-[13px] leading-relaxed text-slate-700">{reel.excerpt}</p>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-[12px] text-slate-600">
            {reel.days > 0 ? <span>{reel.days} days</span> : null}
            {reel.distanceKm > 0 ? <span>{reel.distanceKm} km</span> : null}
            {reel.cost > 0 ? <span>₹{Number(reel.cost).toLocaleString('en-IN')}</span> : null}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[12.5px] font-bold text-slate-700">by {reel.authorName}</span>
            <button
              type="button"
              onClick={() => onLike(reel)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12.5px] font-bold ${
                reel.liked ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Heart size={14} fill={reel.liked ? 'currentColor' : 'none'} /> {reel.likes}
            </button>
          </div>
        </aside>

        {/* On a narrow window the panel is gone, so the video needs its own way out */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white lg:hidden"
        >
          <X size={19} />
        </button>
      </div>
    </div>
  );
};

export default ReelPlayer;
