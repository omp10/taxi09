import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, Eye, Heart, IndianRupee, Loader2, MapPin, Route } from 'lucide-react';
import { userService } from '../../services/userService';

/** A single travel story. Views are counted server-side on read. */
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const TravelStoryDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    userService
      .getTravelStory(slug)
      .then((response) => !cancelled && setStory(response?.data || null))
      .catch(() => !cancelled && setStory(null))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [slug]);

  const like = async () => {
    if (!story) return;
    const previous = story;
    setStory((s) => ({ ...s, liked: !s.liked, likes: s.likes + (s.liked ? -1 : 1) }));
    try {
      await userService.likeTravelStory(story.slug);
    } catch (error) {
      setStory(previous);
      toast.error(error.message || 'Sign in to like a story');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffdf8]">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#fffdf8] px-6 text-center">
        <p className="text-[15px] font-black text-slate-900">That story is no longer available.</p>
        <button onClick={() => navigate('/taxi/user/stories')} className="rounded-xl bg-[#F5B700] px-4 py-2.5 text-[13px] font-black text-slate-900">
          Back to stories
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffdf8] pb-16">
      <div className="relative h-[46vh] min-h-[280px] w-full bg-slate-200">
        {story.coverImage ? (
          <img src={story.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />

        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/90"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-3xl px-6 pb-6">
          <span className="rounded-lg bg-[#F5B700] px-2 py-1 text-[11px] font-black text-slate-900">
            {story.category}
          </span>
          <h1 className="mt-3 text-[28px] font-black leading-tight text-white">{story.title}</h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-white/85">
            <MapPin size={13} /> {story.location}{story.state ? `, ${story.state}` : ''} · by {story.authorName}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6">
        <div className="-mt-6 flex flex-wrap gap-5 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
          {story.days > 0 ? (
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-700">
              <Clock size={14} className="text-[#C79100]" /> {story.days} Days
            </span>
          ) : null}
          {story.distanceKm > 0 ? (
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-700">
              <Route size={14} className="text-[#C79100]" /> {story.distanceKm} km
            </span>
          ) : null}
          {story.cost > 0 ? (
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-700">
              <IndianRupee size={14} className="text-[#C79100]" /> {money(story.cost).slice(1)}
            </span>
          ) : null}
          <span className="ml-auto flex items-center gap-4 text-[12.5px] text-slate-500">
            <button onClick={like} className={`flex items-center gap-1 ${story.liked ? 'text-red-500' : ''}`}>
              <Heart size={14} fill={story.liked ? 'currentColor' : 'none'} /> {story.likes}
            </button>
            <span className="flex items-center gap-1"><Eye size={14} /> {story.views}</span>
          </span>
        </div>

        {story.excerpt ? (
          <p className="mt-6 text-[15px] font-semibold leading-relaxed text-slate-800">{story.excerpt}</p>
        ) : null}

        {story.body
          ? story.body.split('\n').filter(Boolean).map((paragraph, index) => (
              // Paragraphs have no ids of their own, so position is the key.
              <p key={index} className="mt-4 text-[14.5px] leading-relaxed text-slate-700">
                {paragraph}
              </p>
            ))
          : null}

        {(story.hashtags || []).length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {story.hashtags.map((tag) => (
              <span key={tag} className="rounded-lg bg-[#FFF9E6] px-2.5 py-1 text-[12px] font-bold text-[#9A6B00]">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        {(story.gallery || []).length > 1 ? (
          <div className="mt-7 grid grid-cols-2 gap-3">
            {story.gallery.map((image) => (
              <img key={image} src={image} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TravelStoryDetail;
