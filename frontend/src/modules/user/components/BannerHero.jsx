import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon } from 'lucide-react';
import api from '../../../shared/api/axiosInstance';

/**
 * The admin-managed hero used across the landing pages.
 *
 * Everything on screen is whatever was uploaded under the matching section in
 * Homepage Banners: upload one and it renders, upload several and they
 * cross-fade. Nothing is substituted when the feed is empty, because a
 * packaged placeholder reads as a real banner nobody can change.
 */
const BannerHero = ({
  type,
  className = '',
  ratio = '2139/735',
  rounded = 'rounded-[28px]',
  intervalMs = 5000,
}) => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    api
      .get(`/users/banners?type=${encodeURIComponent(type)}`)
      .then((response) => {
        if (cancelled) return;
        const payload = response?.data?.data || response?.data || {};
        setBanners(Array.isArray(payload.results) ? payload.results : []);
      })
      .catch(() => {
        if (!cancelled) setBanners([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [type]);

  // Wide artwork is preferred; a banner uploaded for only one surface has the
  // other filled in server side, so `image` is a real fallback rather than a
  // stretched guess.
  const slides = useMemo(
    () =>
      banners
        .map((banner, index) => ({
          id: banner?._id || banner?.id || `banner-${index}`,
          src: banner?.desktopImage || banner?.image || '',
          title: banner?.title || 'Taxi09',
          href: banner?.deep_link || banner?.redirect_url || '',
        }))
        .filter((slide) => slide.src),
    [banners],
  );

  const activeSlide = slides.length ? slideIndex % slides.length : 0;

  useEffect(() => {
    if (slides.length <= 1) {
      return undefined;
    }

    const timer = setInterval(() => {
      setSlideIndex((current) => (current + 1) % slides.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [slides.length, intervalMs]);

  return (
    <div
      className={`relative w-full overflow-hidden bg-slate-100 ${rounded} ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {loading ? <div className="absolute inset-0 animate-pulse bg-slate-200" /> : null}

      {!loading && slides.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <ImageIcon size={24} className="text-slate-400" strokeWidth={2} />
          <p className="text-[15.5px] font-semibold text-slate-700">No banner uploaded yet</p>
          <p className="text-[13.5px] text-slate-500">Add one under Homepage Banners in the admin panel.</p>
        </div>
      ) : null}

      {slides.map((slide, index) => (
        <img
          key={slide.id}
          src={slide.src}
          alt={slide.title}
          onClick={() => slide.href && navigate(slide.href)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            index === activeSlide ? 'opacity-100' : 'opacity-0'
          } ${slide.href ? 'cursor-pointer' : ''}`}
        />
      ))}

      {slides.length > 1 ? (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Show banner ${index + 1}`}
              aria-current={index === activeSlide}
              onClick={() => setSlideIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === activeSlide ? 'w-6 bg-[#F5B700]' : 'w-2 bg-white/70'
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default BannerHero;
