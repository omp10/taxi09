import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Play,
  Quote,
  Compass,
  Flag,
  Car,
  Search,
  ShieldCheck,
  Smile,
  Star,
} from 'lucide-react';
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

/** How a booking actually goes, start to finish. Fixed copy, not admin content. */
const HOW_IT_WORKS = [
  { icon: Search, title: 'Search & Book', text: 'Choose your location, date and vehicle. Book in just a few taps.' },
  { icon: Car, title: 'Pick it Up', text: 'Visit the pickup location, verify and collect your vehicle.' },
  { icon: Compass, title: 'Drive & Enjoy', text: 'Drive safely to your destination and enjoy your journey.' },
  { icon: Flag, title: 'Drop & Relax', text: "Return the vehicle at the drop location. That's it, you're done." },
];

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

/**
 * Cards rise in as their row scrolls into view, one after another. Uses
 * framer-motion, which the app already ships - GSAP would be a second
 * animation system for the same effect.
 *
 * `once: true` means a section animates on first sight only; re-running it on
 * every scroll past turns pleasant into irritating.
 */
const listVariants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  shown: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

/**
 * A horizontal rail: scrolls by hand, by arrow, or by dot.
 *
 * The dots are one per screenful rather than one per card, measured off the
 * rail itself - how many cards fit changes with the viewport, so the count
 * cannot be derived from the item list.
 */
const Rail = ({ label, children }) => {
  const railRef = useRef(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const count = React.Children.count(children);

  const measure = (rail) => {
    if (!rail || !rail.clientWidth) return;
    setPages(Math.ceil(rail.scrollWidth / rail.clientWidth));
    setPage(Math.round(rail.scrollLeft / rail.clientWidth));
  };

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;

    measure(rail);
    // The rail resizes with the window, and card images settle after first
    // paint, so re-measure rather than trusting the value taken on mount.
    const observer = new ResizeObserver(() => measure(rail));
    observer.observe(rail);
    return () => observer.disconnect();
  }, [count]);

  const nudge = (direction) => {
    const rail = railRef.current;
    if (rail) rail.scrollBy({ left: rail.clientWidth * direction, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {pages > 1 ? (
        <>
          <button
            type="button"
            onClick={() => nudge(-1)}
            aria-label={`Previous ${label}`}
            className="absolute -left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_4px_14px_rgba(15,23,42,0.10)] transition hover:text-slate-900 lg:flex"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => nudge(1)}
            aria-label={`More ${label}`}
            className="absolute -right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_4px_14px_rgba(15,23,42,0.10)] transition hover:text-slate-900 lg:flex"
          >
            <ChevronRight size={18} />
          </button>
        </>
      ) : null}

      <div
        ref={railRef}
        onScroll={(event) => measure(event.currentTarget)}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:gap-5 lg:px-0 [scrollbar-width:none]"
      >
        {children}
      </div>

      {pages > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {Array.from({ length: pages }, (unused, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                const rail = railRef.current;
                if (rail) rail.scrollTo({ left: index * rail.clientWidth, behavior: 'smooth' });
              }}
              aria-label={`Go to ${label} page ${index + 1}`}
              aria-current={index === page}
              className={`h-1.5 rounded-full transition-all ${
                index === page ? 'w-4 bg-[#F5B700]' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

const SectionHeading = ({ eyebrow, icon: Icon, title, subtitle, action, onAction }) => (
  <div className="mb-3 flex items-end justify-between gap-3 px-1 lg:mb-5">
    <div>
      {eyebrow ? (
        <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#F5B700]">
          {Icon ? <Icon size={13} strokeWidth={2.6} /> : null}
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-0.5 text-[21px] lg:text-[30px] font-bold lg:font-semibold tracking-[-0.03em] text-slate-950 lg:text-[var(--dh-text,#0f172a)]">{title}</h2>
      {subtitle ? (
        <p className="mt-0.5 text-[12.5px] lg:text-[14.5px] font-medium text-slate-500 lg:text-[var(--dh-muted,#64748b)]">{subtitle}</p>
      ) : null}
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
  const [activeVideo, setActiveVideo] = useState(0);

  const [drivers, setDrivers] = useState([]);
  const [articles, setArticles] = useState([]);
  const [playing, setPlaying] = useState('');

  const reduceMotion = useReducedMotion();

  // Someone who has asked for less motion gets the content, not the movement.
  const rowMotion = reduceMotion
    ? {}
    : { variants: listVariants, initial: 'hidden', whileInView: 'shown', viewport: { once: true, amount: 0.2 } };
  const cardMotion = reduceMotion ? {} : { variants: cardVariants };

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.get('/users/content-blocks').catch(() => null),
      api.get('/users/hire-drivers').catch(() => null),
      api.get('/users/blogs?limit=10').catch(() => null),
      api.get('/users/reviews?limit=12').catch(() => null),
    ]).then(([blockRes, driverRes, storyRes, reviewRes]) => {
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
      // Real reviews, each tied to a booking that completed, replacing the
      // admin-written testimonials that used to sit here. Only published ones
      // come back, and a review with no words to read is not worth a card.
      setReviews(
        unwrap(reviewRes)
          .filter((review) => String(review?.comment || '').trim())
          .map((review) => ({
            name: review.userName || 'Verified customer',
            quote: review.comment,
            rating: review.rating,
            city: '',
            image: '',
            verified: true,
          })),
      );
      setVideos(asItems('home.videos').filter((item) => youtubeIdOf(item?.youtubeUrl)));
      // The rail scrolls, so the cap is only there to keep a large roster from
      // rendering in full on the homepage.
      setDrivers(unwrap(driverRes).filter((driver) => driver?.active !== false).slice(0, 12));
      // Only posts with a cover; a card here is mostly its image.
      setArticles(unwrap(storyRes).filter((post) => post?.coverImage).slice(0, 10));
    });

    return () => { cancelled = true; };
  }, []);

  const nothingToShow = !reviews.length && !videos.length && !drivers.length && !articles.length;
  if (nothingToShow) return null;

  return (
    <>
      {drivers.length ? (
        <section className="mt-7 lg:mt-14">
          <div className="mb-3 flex items-end justify-between gap-4 lg:mb-5">
            <div>
              <p className="flex items-center gap-1.5 text-[10.5px] lg:text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#F5B700]">
                <ShieldCheck size={13} strokeWidth={2.6} />
                Vetted &amp; verified drivers
              </p>
              <h2 className="mt-1 text-[21px] lg:text-[30px] font-bold lg:font-bold leading-tight tracking-[-0.03em] text-slate-950 lg:text-[var(--dh-text,#0f172a)]">
                Meet our drivers
              </h2>
              <p className="mt-0.5 text-[12.5px] lg:text-[14.5px] font-medium text-slate-500 lg:text-[var(--dh-muted,#64748b)]">
                Experienced, professional and committed to your safety.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/taxi/user/with-driver')}
              className="hidden shrink-0 items-center gap-2 rounded-full border border-[#F5B700] px-4 py-2 text-[13px] font-bold text-slate-800 transition hover:bg-[#F5B700]/10 lg:inline-flex lg:text-[var(--dh-text,#0f172a)]"
            >
              See all drivers
              <ArrowRight size={15} />
            </button>
          </div>

          <Rail label="drivers">
            {drivers.map((driver) => (
              <button
                key={driver.id || driver._id || driver.name}
                type="button"
                onClick={() => navigate('/taxi/user/with-driver')}
                className="flex w-[248px] lg:w-[252px] shrink-0 snap-start flex-col rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-[0_6px_18px_rgba(15,23,42,0.05)] lg:border-[var(--dh-border,#eceef1)] lg:bg-[var(--dh-surface,#ffffff)]"
              >
                <span className="flex items-center gap-3">
                  <span className="relative shrink-0">
                    <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-2 ring-[#F5B700]/70">
                      {driver.photo || driver.image ? (
                        <img src={driver.photo || driver.image} alt={driver.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[20px] font-bold text-slate-400">
                          {String(driver.name || '?').trim().charAt(0).toUpperCase()}
                        </span>
                      )}
                    </span>
                    {driver.verified ? (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white">
                        <BadgeCheck size={16} className="text-[#F5B700]" fill="#F5B700" stroke="#ffffff" />
                      </span>
                    ) : null}
                  </span>

                  <span className="min-w-0">
                    <span className="block truncate text-[14.5px] font-bold text-slate-900 lg:text-[var(--dh-text,#0f172a)]">{driver.name}</span>
                    {driver.city ? (
                      <span className="mt-0.5 flex items-center gap-1 truncate text-[12px] font-semibold text-slate-500">
                        <MapPin size={11} strokeWidth={2.4} className="shrink-0" />
                        {driver.city}
                      </span>
                    ) : null}
                    <span className="mt-1 flex items-center gap-2 text-[12px] font-bold text-slate-700">
                      {Number(driver.rating) > 0 ? (
                        <span className="flex items-center gap-1">
                          <Star size={12} className="text-[#F5B700]" fill="#F5B700" strokeWidth={0} />
                          {Number(driver.rating).toFixed(1)}
                        </span>
                      ) : null}
                      {driver.experience ? (
                        <span className="truncate font-semibold text-slate-500">{driver.experience}</span>
                      ) : null}
                    </span>
                  </span>
                </span>

                {driver.about ? (
                  <span className="mt-3 flex flex-1 gap-1.5 rounded-xl bg-slate-50/80 p-2.5 lg:bg-[var(--dh-chip,#f6f7f9)]">
                    <Quote size={13} className="mt-0.5 shrink-0 text-[#F5B700]" fill="currentColor" strokeWidth={0} />
                    <span className="line-clamp-4 text-[12.5px] font-medium italic leading-[1.5] text-slate-600 lg:text-[var(--dh-muted,#64748b)]">
                      {driver.about}
                    </span>
                  </span>
                ) : null}

                <span className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[9.5px] font-bold text-slate-500 lg:border-[var(--dh-border,#eceef1)]">
                  <span className="flex flex-col items-center gap-0.5">
                    <ShieldCheck size={13} className="text-[#F5B700]" strokeWidth={2.4} />
                    Verified
                  </span>
                  <span className="flex flex-col items-center gap-0.5 text-center leading-tight">
                    <BadgeCheck size={13} className="text-[#F5B700]" strokeWidth={2.4} />
                    Background
                    <span className="-mt-0.5">Checked</span>
                  </span>
                  <span className="flex flex-col items-center gap-0.5">
                    <Smile size={13} className="text-[#F5B700]" strokeWidth={2.4} />
                    {Number(driver.rating) > 0 ? `${Number(driver.rating).toFixed(1)}/5` : 'Rated'}
                    <span className="-mt-0.5">Rating</span>
                  </span>
                </span>
              </button>
            ))}
          </Rail>
        </section>
      ) : null}

      {videos.length ? (
        <section className="mt-7 lg:mt-14">
          {(() => {
            // One feature video. The steps explain the flow, the video shows it.
            const current = videos[activeVideo] || videos[0];
            const id = youtubeIdOf(current.youtubeUrl);
            const isPlaying = playing === id;

            return (
              <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_1.05fr] lg:gap-10">
                <div>
                  <p className="text-[10.5px] lg:text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#F5B700]">
                    How it works
                  </p>
                  <h2 className="mt-1 text-[21px] lg:text-[32px] font-bold lg:font-bold leading-tight tracking-[-0.03em] text-slate-950 lg:text-[var(--dh-text,#0f172a)]">
                    {current.title}
                  </h2>
                  {current.caption ? (
                    <p className="mt-1.5 max-w-[380px] text-[13px] lg:text-[15px] font-medium leading-[1.55] text-slate-500 lg:text-[var(--dh-muted,#64748b)]">
                      {current.caption}
                    </p>
                  ) : null}

                  <div className="relative mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4">
                    {/* The dashed rail sits behind the icons and stops short of both ends. */}
                    <span className="pointer-events-none absolute left-[12%] right-[12%] top-7 hidden border-t border-dashed border-slate-300 sm:block" />
                    {HOW_IT_WORKS.map((step, index) => (
                      <div key={step.title} className="relative flex flex-col items-center text-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F5B700]/15 text-[#c99400]">
                          <step.icon size={22} strokeWidth={2.2} />
                        </span>
                        <span className="mt-2 text-[11px] font-bold text-[#F5B700]">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="mt-0.5 text-[13px] font-bold text-slate-900 lg:text-[var(--dh-text,#0f172a)]">
                          {step.title}
                        </span>
                        <span className="mt-1 text-[11.5px] font-medium leading-[1.45] text-slate-500 lg:text-[var(--dh-muted,#64748b)]">
                          {step.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/taxi/user/services')}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#F5B700] px-5 py-2.5 text-[13.5px] font-bold text-slate-900 transition hover:brightness-95"
                  >
                    Explore all services
                    <ArrowRight size={15} />
                  </button>
                </div>

                <div className="flex flex-col overflow-hidden rounded-[22px] shadow-[0_10px_30px_rgba(15,23,42,0.10)] sm:flex-row">
                  <div className="relative aspect-video w-full bg-slate-900 sm:aspect-auto sm:min-h-[300px] sm:flex-[1.5]">
                    {isPlaying ? (
                      // Only loaded once tapped, so the homepage does not pull
                      // an iframe on every visit.
                      <iframe
                        src={`https://www.youtube.com/embed/${id}?autoplay=1`}
                        title={current.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPlaying(id)}
                        className="absolute inset-0 h-full w-full"
                        aria-label={`Play ${current.title}`}
                      >
                        <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" />
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-slate-900">
                            <Play size={24} fill="currentColor" />
                          </span>
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col justify-center gap-2 bg-[#12161f] p-5 sm:flex-1">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5B700]/20 text-[#F5B700]">
                      <Play size={16} fill="currentColor" />
                    </span>
                    <p className="text-[16px] font-bold leading-tight text-white">
                      See how easy it is with Taxi09
                    </p>
                    <p className="text-[12.5px] font-medium leading-[1.5] text-white/60">
                      Watch our quick video to learn how booking with Taxi09 is simple, safe and reliable.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPlaying(id)}
                      className="mt-1 inline-flex w-fit items-center gap-2 rounded-full border border-[#F5B700] px-4 py-2 text-[12.5px] font-bold text-[#F5B700] transition hover:bg-[#F5B700]/10"
                    >
                      Watch Demo
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      ) : null}

      {reviews.length ? (
        <section className="mt-7 lg:mt-14">
          <SectionHeading
            eyebrow="From our customers"
            title="What people say"
            action="View all reviews"
            onAction={() => navigate('/taxi/user/stories')}
          />
          <Rail label="reviews">
            {reviews.map((review, index) => (
              <div
                key={`${review.name}-${index}`}
                className="flex w-[280px] shrink-0 snap-start flex-col rounded-[20px] border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] lg:w-[420px] lg:p-6 lg:border-[var(--dh-border,#eceef1)] lg:bg-[var(--dh-surface,#ffffff)]"
              >
                <Quote size={26} className="text-[#F5B700]" fill="currentColor" strokeWidth={0} />
                <p className="mt-3 flex-1 text-[13.5px] lg:text-[15.5px] font-medium leading-[1.55] text-slate-700 lg:text-[var(--dh-text,#0f172a)]">
                  {review.quote}
                </p>
                <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4 lg:border-[var(--dh-border,#eceef1)]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                    {review.image ? (
                      <img src={review.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[14px] font-bold text-slate-400">
                        {String(review.name || '?').trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold text-slate-900 lg:text-[var(--dh-text,#0f172a)]">{review.name}</span>
                    {review.city ? (
                      <span className="block truncate text-[12.5px] font-medium text-slate-500">{review.city}</span>
                    ) : null}
                  </span>
                  {Number(review.rating) > 0 ? (
                    <span className="flex shrink-0 items-center gap-1 text-[14px] font-bold text-slate-800 lg:text-[var(--dh-text,#0f172a)]">
                      <Star size={15} className="text-[#F5B700]" fill="#F5B700" strokeWidth={0} />
                      {Number(review.rating).toFixed(1)}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </Rail>
        </section>
      ) : null}

      {articles.length ? (
        <section className="mt-7 lg:mt-14">
          <SectionHeading
            eyebrow="Read about us"
            icon={BookOpen}
            title="Explore stories & tips"
            subtitle="Travel guides, car tips and lifestyle stories curated for you."
            action="All stories"
            onAction={() => navigate('/taxi/user/blog')}
          />
          <Rail label="stories">
            {articles.map((story) => (
              <button
                key={story.slug || story.id || story._id}
                type="button"
                onClick={() => navigate(`/taxi/user/blog/${story.slug}`)}
                className="group flex w-[248px] shrink-0 snap-start flex-col overflow-hidden rounded-[20px] border border-slate-100 bg-white text-left shadow-[0_8px_24px_rgba(15,23,42,0.06)] lg:w-[300px] lg:border-[var(--dh-border,#eceef1)] lg:bg-[var(--dh-surface,#ffffff)]"
              >
                <span className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={story.coverImage}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  {story.publishedAt ? (
                    // Date as a tab on the corner, so the headline below stays clean.
                    <span className="absolute left-3 top-0 flex flex-col items-center rounded-b-lg bg-[#F5B700] px-2 pb-1.5 pt-1 text-center leading-none text-slate-900">
                      <Calendar size={10} strokeWidth={2.6} className="mb-0.5" />
                      <span className="text-[13px] font-bold">
                        {new Date(story.publishedAt).toLocaleDateString('en-IN', { day: '2-digit' })}
                      </span>
                      <span className="text-[8.5px] font-bold uppercase tracking-wide">
                        {new Date(story.publishedAt).toLocaleDateString('en-IN', { month: 'short' })}
                      </span>
                      <span className="text-[8.5px] font-bold">
                        {new Date(story.publishedAt).getFullYear()}
                      </span>
                    </span>
                  ) : null}
                  {story.category ? (
                    <span className="absolute bottom-3 left-3 rounded-md bg-slate-900/85 px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.08em] text-white">
                      {story.category}
                    </span>
                  ) : null}
                </span>

                <span className="flex flex-1 items-start justify-between gap-3 p-4">
                  <span className="min-w-0 flex-1 text-[14px] lg:text-[15.5px] font-bold leading-[1.35] text-slate-900 lg:text-[var(--dh-text,#0f172a)]">
                    {story.title}
                  </span>
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-800 transition-colors group-hover:border-slate-900 group-hover:bg-[#F5B700] lg:border-[var(--dh-border,#cbd5e1)] lg:text-[var(--dh-text,#0f172a)]">
                    <ArrowUpRight size={17} strokeWidth={2.2} />
                  </span>
                </span>
              </button>
            ))}
          </Rail>
        </section>
      ) : null}
    </>
  );
};

export default HomeContentSections;
