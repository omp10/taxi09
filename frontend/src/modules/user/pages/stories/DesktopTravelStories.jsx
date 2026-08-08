import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bookmark,
  Clock,
  Eye,
  Heart,
  IndianRupee,
  Loader2,
  MapPin,
  MessageCircle,
  Route,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { AiChatBubble, DesktopNav } from '../../components/desktop/DesktopChrome';
import { useDesktopTheme } from '../../components/desktop/desktopShared';
import { userService } from '../../services/userService';
import api from '../../../../shared/api/axiosInstance';

/**
 * Travel Stories - the desktop feed.
 *
 * The category chips, destinations, hashtags and headline counts are all
 * aggregated by the server from the published stories, so nothing here is a
 * hardcoded list that can drift away from the content.
 */

const TABS = [
  { key: 'foryou', label: 'For You' },
  { key: 'trending', label: 'Trending' },
  { key: 'latest', label: 'Latest' },
];

const compact = (value) => {
  const n = Number(value || 0);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
};

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const StoryCard = ({ story, onOpen, onLike }) => (
  <article
    onClick={() => onOpen(story)}
    className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white transition-shadow hover:shadow-lg"
  >
    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
      {story.coverImage ? (
        <img
          src={story.coverImage}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : null}

      <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-2 py-1 text-[10.5px] font-black text-slate-900">
        {story.category}
      </span>
      {story.readMinutes > 0 ? (
        <span className="absolute right-3 top-3 rounded-lg bg-black/55 px-2 py-1 text-[10.5px] font-bold text-white">
          {story.readMinutes} min read
        </span>
      ) : null}

      {/* Author sits on the image, as in the design */}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8">
        {story.authorAvatar ? (
          <img src={story.authorAvatar} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F5B700] text-[11px] font-black text-slate-900">
            {(story.authorName || '?').charAt(0)}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-[11.5px] font-bold text-white">{story.authorName}</span>
          {story.location ? (
            <span className="block truncate text-[10.5px] text-white/80">
              {story.location}{story.state ? `, ${story.state}` : ''}
            </span>
          ) : null}
        </span>
      </div>
    </div>

    <div className="p-3.5">
      <h3 className="line-clamp-2 min-h-[38px] text-[14.5px] font-black leading-snug text-slate-900">
        {story.title}
      </h3>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
        {story.days > 0 ? <span className="flex items-center gap-1"><Clock size={12} /> {story.days} Days</span> : null}
        {story.distanceKm > 0 ? <span className="flex items-center gap-1"><Route size={12} /> {story.distanceKm} km</span> : null}
        {story.cost > 0 ? <span className="flex items-center gap-1"><IndianRupee size={12} /> {money(story.cost).slice(1)}</span> : null}
      </div>

      <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-2.5 text-[11.5px] text-slate-500">
        <button
          onClick={(e) => { e.stopPropagation(); onLike(story); }}
          className={`flex items-center gap-1 transition-colors ${story.liked ? 'text-red-500' : 'hover:text-red-500'}`}
        >
          <Heart size={13} fill={story.liked ? 'currentColor' : 'none'} /> {compact(story.likes)}
        </button>
        <span className="flex items-center gap-1"><MessageCircle size={13} /> {compact(story.comments)}</span>
        <span className="flex items-center gap-1"><Eye size={13} /> {compact(story.views)}</span>
        <Bookmark size={13} className="ml-auto text-slate-400" />
      </div>
    </div>
  </article>
);

const Panel = ({ title, action, children }) => (
  <section className="rounded-2xl border border-slate-100 bg-white p-4">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[14.5px] font-black text-slate-900">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const DesktopTravelStories = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useDesktopTheme();
  const [stories, setStories] = useState([]);
  const [facets, setFacets] = useState({ categories: [], destinations: [], hashtags: [], totals: {} });
  const [tab, setTab] = useState('foryou');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/travel-stories/facets')
      .then((response) => setFacets(response?.data || {}))
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    const params = new URLSearchParams({ tab });
    if (category !== 'All') params.set('category', category);
    if (search.trim()) params.set('q', search.trim());

    setLoading(true);
    api.get(`/users/travel-stories?${params.toString()}`)
      .then((response) => setStories(response?.data?.results || []))
      .catch((error) => toast.error(error.message || 'Could not load stories'))
      .finally(() => setLoading(false));
  }, [tab, category, search]);

  useEffect(() => {
    const handle = setTimeout(load, 250);
    return () => clearTimeout(handle);
  }, [load]);

  const chips = useMemo(
    () => ['All', ...facets.categories.map((c) => c.label)],
    [facets.categories],
  );

  const like = async (story) => {
    // Optimistic: the count moves at once and is put back if the call fails.
    const previous = stories;
    setStories((rows) =>
      rows.map((row) =>
        row._id === story._id
          ? { ...row, liked: !row.liked, likes: row.likes + (row.liked ? -1 : 1) }
          : row,
      ),
    );

    try {
      await userService.likeTravelStory(story.slug);
    } catch (error) {
      setStories(previous);
      toast.error(error.message || 'Sign in to like a story');
    }
  };

  const totals = facets.totals || {};

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath="/taxi/user/stories" theme={theme} onToggleTheme={toggleTheme} />

      <div className="mx-auto max-w-[1440px] px-8 py-6 xl:px-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Feed */}
          <div>
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
              <div className="relative bg-gradient-to-r from-[#FFF9E6] to-white px-6 py-7">
                <h1 className="text-[30px] font-black leading-none text-slate-900">Travel Stories</h1>
                <p className="mt-2 text-[13.5px] text-slate-600">
                  Real journeys. Real experiences. Real <span className="font-bold text-[#C79100]">inspiration</span>.
                </p>

                <div className="mt-5 flex gap-5 border-b border-slate-200">
                  {TABS.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setTab(item.key)}
                      className={`-mb-px border-b-2 pb-2.5 text-[13px] font-bold transition-colors ${
                        tab === item.key
                          ? 'border-[#F5B700] text-slate-900'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 px-6 py-4">
                <div className="relative mr-2">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search stories, places…"
                    className="w-60 rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-[13px] outline-none focus:border-[#F5B700]"
                  />
                </div>

                {chips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setCategory(chip)}
                    className={`rounded-xl border px-3 py-2 text-[12.5px] font-bold transition-colors ${
                      category === chip
                        ? 'border-[#F5B700] bg-[#FFF9E6] text-slate-900'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400" /></div>
            ) : stories.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 py-20 text-center text-[13.5px] text-slate-500">
                No stories here yet. Try another category.
              </p>
            ) : (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {stories.map((story) => (
                  <StoryCard
                    key={story._id}
                    story={story}
                    onOpen={(s) => navigate(`/taxi/user/stories/${s.slug}`)}
                    onLike={like}
                  />
                ))}
              </div>
            )}

            {/* Headline counts, aggregated from what is actually published */}
            {totals.stories > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-white p-5 sm:grid-cols-4">
                {[
                  { value: compact(totals.stories), label: 'Stories Shared' },
                  { value: compact(totals.travellers), label: 'Storytellers' },
                  { value: compact(totals.destinations), label: 'Destinations' },
                  { value: compact(totals.photos), label: 'Photos Shared' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-[20px] font-black text-slate-900">{stat.value}</p>
                    <p className="text-[11.5px] text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            {facets.destinations.length > 0 ? (
              <Panel title="Top Destinations">
                <div className="space-y-2.5">
                  {facets.destinations.map((place) => (
                    <button
                      key={place.label}
                      onClick={() => setSearch(place.label)}
                      className="flex w-full items-center gap-3 rounded-xl p-1.5 text-left hover:bg-slate-50"
                    >
                      {place.image ? (
                        <img src={place.image} alt="" loading="lazy" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                          <MapPin size={15} className="text-slate-400" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold text-slate-900">{place.label}</span>
                        <span className="block text-[11px] text-slate-500">
                          {place.count} {place.count === 1 ? 'story' : 'stories'}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </Panel>
            ) : null}

            {facets.hashtags.length > 0 ? (
              <Panel title="Trending Hashtags">
                <div className="space-y-1">
                  {facets.hashtags.map((tag) => (
                    <button
                      key={tag.tag}
                      onClick={() => setSearch(tag.tag)}
                      className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left hover:bg-slate-50"
                    >
                      <span className="text-[13px] font-bold text-slate-800">#{tag.tag}</span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <TrendingUp size={12} className="text-emerald-500" />
                        {tag.count}
                      </span>
                    </button>
                  ))}
                </div>
              </Panel>
            ) : null}

            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFD400] to-[#F5B700] p-5">
              <p className="flex items-center gap-2 text-[16px] font-black text-slate-900">
                <Sparkles size={17} /> Share Your Journey
              </p>
              <p className="mt-1 text-[12.5px] text-slate-800">
                Write up a trip and help other travellers plan theirs.
              </p>
              <button
                onClick={() => navigate('/taxi/user/stories/new')}
                className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] font-black text-white"
              >
                Create Story
              </button>
            </div>
          </aside>
        </div>
      </div>

      <AiChatBubble />
    </div>
  );
};

export default DesktopTravelStories;
