import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Clock, Eye, Heart, Loader2, MessageCircle, Play, Route, Search } from 'lucide-react';
import AppHeader from '../../components/AppHeader';
import BottomNavbar from '../../components/BottomNavbar';
import { userService } from '../../services/userService';
import api from '../../../../shared/api/axiosInstance';
import ReelPlayer from './ReelPlayer';

/** Travel stories on a phone: the same feed, one column. */
const compact = (value) => {
  const n = Number(value || 0);
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
};

const MobileTravelStories = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [reelsOnly, setReelsOnly] = useState(false);
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    api.get('/users/travel-stories/facets')
      .then((response) => setCategories((response?.data?.categories || []).map((c) => c.label)))
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    const params = new URLSearchParams({ tab: 'foryou' });
    if (reelsOnly) params.set('mediaType', 'reel');
    if (category !== 'All') params.set('category', category);
    if (search.trim()) params.set('q', search.trim());

    setLoading(true);
    api.get(`/users/travel-stories?${params.toString()}`)
      .then((response) => setStories(response?.data?.data?.results ?? response?.data?.results ?? []))
      .catch((error) => toast.error(error.message || 'Could not load stories'))
      .finally(() => setLoading(false));
  }, [category, search, reelsOnly]);

  useEffect(() => {
    const handle = setTimeout(load, 250);
    return () => clearTimeout(handle);
  }, [load]);

  const like = async (story) => {
    const previous = stories;
    setStories((rows) =>
      rows.map((row) =>
        row._id === story._id ? { ...row, liked: !row.liked, likes: row.likes + (row.liked ? -1 : 1) } : row,
      ),
    );
    try {
      await userService.likeTravelStory(story.slug);
    } catch (error) {
      setStories(previous);
      toast.error(error.message || 'Sign in to like a story');
    }
  };

  return (
    <div className="premium-theme min-h-screen bg-[#fffdf8] pb-24 max-w-lg mx-auto">
      <AppHeader subtitle="TRAVEL STORIES" />

      <div className="px-4">
        <h1 className="text-[22px] font-black text-slate-900">Travel Stories</h1>
        <p className="text-[12.5px] text-slate-500">Real journeys. Real experiences.</p>

        <div className="relative mt-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stories, places…"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-[13px] outline-none focus:border-[#F5B700]"
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setReelsOnly((current) => !current)}
            className={`flex shrink-0 items-center gap-1 rounded-xl border px-3 py-2 text-[12px] font-bold ${
              reelsOnly ? 'border-[#F5B700] bg-[#FFF9E6] text-slate-900' : 'border-slate-200 text-slate-600'
            }`}
          >
            <Play size={11} fill="currentColor" /> Reels
          </button>
          {['All', ...categories].map((chip) => (
            <button
              key={chip}
              onClick={() => setCategory(chip)}
              className={`shrink-0 rounded-xl border px-3 py-2 text-[12px] font-bold ${
                category === chip ? 'border-[#F5B700] bg-[#FFF9E6] text-slate-900' : 'border-slate-200 text-slate-600'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : stories.length === 0 ? (
          <p className="py-16 text-center text-[13px] text-slate-500">No stories here yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {stories.map((story) => (
              <article
                key={story._id}
                onClick={() => (story.videoUrl ? setPlaying(story) : navigate(`/taxi/user/stories/${story.slug}`))}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white"
              >
                <div className="relative aspect-[16/10] bg-slate-100">
                  {story.coverImage ? (
                    <img src={story.coverImage} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  ) : null}
                  <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-2 py-1 text-[10px] font-black text-slate-900">
                    {story.category}
                  </span>
                  {story.videoUrl ? (
                    <>
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45">
                          <Play size={18} className="ml-0.5 text-white" fill="currentColor" />
                        </span>
                      </span>
                      <span className="absolute right-3 top-3 rounded-lg bg-[#F5B700] px-2 py-1 text-[10px] font-black text-slate-900">
                        REEL
                      </span>
                    </>
                  ) : null}
                </div>

                <div className="p-3.5">
                  <p className="text-[11px] font-semibold text-slate-500">
                    {story.authorName}{story.location ? ` · ${story.location}` : ''}
                  </p>
                  <h2 className="mt-0.5 text-[14.5px] font-black leading-snug text-slate-900">{story.title}</h2>

                  <div className="mt-2 flex flex-wrap gap-x-3 text-[11px] text-slate-500">
                    {story.days > 0 ? <span className="flex items-center gap-1"><Clock size={12} /> {story.days} Days</span> : null}
                    {story.distanceKm > 0 ? <span className="flex items-center gap-1"><Route size={12} /> {story.distanceKm} km</span> : null}
                  </div>

                  <div className="mt-2.5 flex items-center gap-4 border-t border-slate-100 pt-2 text-[11.5px] text-slate-500">
                    <button
                      onClick={(e) => { e.stopPropagation(); like(story); }}
                      className={`flex items-center gap-1 ${story.liked ? 'text-red-500' : ''}`}
                    >
                      <Heart size={13} fill={story.liked ? 'currentColor' : 'none'} /> {compact(story.likes)}
                    </button>
                    <span className="flex items-center gap-1"><MessageCircle size={13} /> {compact(story.comments)}</span>
                    <span className="flex items-center gap-1"><Eye size={13} /> {compact(story.views)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {playing ? (
        <ReelPlayer
          reel={stories.find((s) => s._id === playing._id) || playing}
          onClose={() => setPlaying(null)}
          onLike={like}
        />
      ) : null}

      <BottomNavbar />
    </div>
  );
};

export default MobileTravelStories;
