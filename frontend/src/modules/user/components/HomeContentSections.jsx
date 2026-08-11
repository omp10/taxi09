import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Quote, Star } from 'lucide-react';
import api from '../../../shared/api/axiosInstance';

/**
 * Admin-managed homepage sections: customer reviews, videos, our drivers.
 *
 * Nothing here is written into the code. Reviews and videos come from the
 * keyed content blocks the admin edits under App Content -> Homepage Sections;
 * the drivers come from the same Hire Drivers roster the booking flow uses, so
 * the homepage cannot disagree with what is actually bookable.
 *
 * A section with no content renders nothing at all rather than a placeholder,
 * so an empty homepage is quiet rather than broken-looking.
 */

const unwrap = (response) =>
  response?.data?.data?.results ?? response?.data?.results ?? response?.results ?? [];

/** Accepts a full URL or a bare id and returns the 11-character video id. */
const youtubeIdOf = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^[\w-]{11}$/.test(raw)) return raw;
  const match = raw.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return match ? match[1] : '';
};

const SectionHeading = ({ eyebrow, title, action, onAction }) => (
  <div className="mb-3 flex items-end justify-between gap-3 px-1">
    <div>
      {eyebrow ? (
        <p className="text-[11.5px] font-black uppercase tracking-[0.14em] text-[#F5B700]">{eyebrow}</p>
      ) : null}
      <h2 className="mt-0.5 text-[20px] font-extrabold tracking-[-0.03em] text-slate-900">{title}</h2>
    </div>
    {action ? (
      <button type="button" onClick={onAction} className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-[#4338ca]">
        {action} <ArrowRight size={14} strokeWidth={2.6} />
      </button>
    ) : null}
  </div>
);

const HomeContentSections = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [playing, setPlaying] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.get('/users/content-blocks').catch(() => null),
      api.get('/users/hire-drivers').catch(() => null),
    ]).then(([blockRes, driverRes]) => {
      if (cancelled) return;

      // The public feed returns { blocks: { 'home.videos': {...} } } - keyed,
      // not a list. The admin feed returns a list, hence both shapes here.
      const raw = blockRes?.data?.data?.blocks ?? blockRes?.data?.blocks ?? blockRes?.blocks ?? unwrap(blockRes);
      const byKey = {};
      if (Array.isArray(raw)) {
        raw.forEach((block) => { byKey[block.key] = block; });
      } else if (raw && typeof raw === 'object') {
        Object.assign(byKey, raw);
      }

      const asItems = (key) => {
        const block = byKey[key];
        if (Array.isArray(block)) return block;
        return Array.isArray(block?.items) ? block.items : [];
      };
      setReviews(asItems('home.testimonials').filter((item) => String(item?.quote || '').trim()));
      setVideos(asItems('home.videos').filter((item) => youtubeIdOf(item?.youtubeUrl)));
      setDrivers(unwrap(driverRes).filter((driver) => driver?.active !== false).slice(0, 8));
    });

    return () => { cancelled = true; };
  }, []);

  const nothingToShow = !reviews.length && !videos.length && !drivers.length;
  if (nothingToShow) return null;

  return (
    <>
      {drivers.length ? (
        <section className="mt-7">
          <SectionHeading
            eyebrow="Vetted and verified"
            title="Meet our drivers"
            action="See all"
            onAction={() => navigate('/taxi/user/with-driver')}
          />
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {drivers.map((driver) => (
              <button
                key={driver.id || driver._id || driver.name}
                type="button"
                onClick={() => navigate('/taxi/user/with-driver')}
                className="w-[132px] shrink-0 snap-start rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-[0_6px_18px_rgba(15,23,42,0.05)]"
              >
                <span className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                  {driver.photo || driver.image ? (
                    <img src={driver.photo || driver.image} alt={driver.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[20px] font-black text-slate-400">
                      {String(driver.name || '?').trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="mt-2 block truncate text-center text-[13.5px] font-bold text-slate-800">{driver.name}</span>
                {driver.city ? (
                  <span className="block truncate text-center text-[12px] font-semibold text-slate-500">{driver.city}</span>
                ) : null}
                {Number(driver.rating) > 0 ? (
                  <span className="mt-1 flex items-center justify-center gap-1 text-[12px] font-semibold text-slate-600">
                    <Star size={11} className="text-[#F5B700]" fill="#F5B700" strokeWidth={0} />
                    {Number(driver.rating).toFixed(1)}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {videos.length ? (
        <section className="mt-7">
          <SectionHeading eyebrow="Watch" title="How it works" />
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {videos.map((video) => {
              const id = youtubeIdOf(video.youtubeUrl);
              const isPlaying = playing === id;

              return (
                <div key={id} className="w-[248px] shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
                  <div className="relative aspect-video bg-slate-900">
                    {isPlaying ? (
                      // Only loaded once tapped, so the homepage does not pull
                      // an iframe per video on every visit.
                      <iframe
                        src={`https://www.youtube.com/embed/${id}?autoplay=1`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full"
                      />
                    ) : (
                      <button type="button" onClick={() => setPlaying(id)} className="absolute inset-0 h-full w-full" aria-label={`Play ${video.title}`}>
                        <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" />
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-900">
                            <Play size={20} fill="currentColor" />
                          </span>
                        </span>
                      </button>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[13.5px] font-bold leading-tight text-slate-800">{video.title}</p>
                    {video.caption ? (
                      <p className="mt-0.5 text-[12px] font-semibold text-slate-500">{video.caption}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {reviews.length ? (
        <section className="mt-7">
          <SectionHeading eyebrow="From our customers" title="What people say" />
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {reviews.map((review, index) => (
              <div key={`${review.name}-${index}`} className="w-[262px] shrink-0 snap-start rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
                <Quote size={18} className="text-[#F5B700]" />
                <p className="mt-2 text-[13.5px] font-medium leading-[1.5] text-slate-700">{review.quote}</p>
                <div className="mt-3 flex items-center gap-2.5 border-t border-slate-50 pt-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                    {review.image ? (
                      <img src={review.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[13px] font-black text-slate-400">
                        {String(review.name || '?').trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold text-slate-800">{review.name}</span>
                    {review.city ? <span className="block truncate text-[12px] text-slate-500">{review.city}</span> : null}
                  </span>
                  {Number(review.rating) > 0 ? (
                    <span className="flex shrink-0 items-center gap-0.5 text-[12.5px] font-bold text-slate-700">
                      <Star size={12} className="text-[#F5B700]" fill="#F5B700" strokeWidth={0} />
                      {Number(review.rating).toFixed(1)}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
};

export default HomeContentSections;
