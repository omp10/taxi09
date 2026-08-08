import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ImagePlus, Loader2, Send } from 'lucide-react';
import { userService } from '../../services/userService';

/**
 * Write up a trip.
 *
 * Submissions are held as `pending` by the server until a moderator publishes
 * them, so nothing a reader writes appears in the feed unreviewed.
 */

const CATEGORIES = [
  'Road Trip', 'Bike Ride', 'Adventure', 'Mountains', 'Beach',
  'Pilgrimage', 'Food Journey', 'Camping', 'Photography', 'Weekend',
];

const field =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13.5px] outline-none focus:border-[#F5B700]';

const empty = {
  title: '', category: 'Road Trip', location: '', state: '',
  days: '', distanceKm: '', cost: '', hashtags: '', body: '',
};

const CreateTravelStory = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [form, setForm] = useState(empty);
  const [cover, setCover] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const pickCover = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('That image is over 5MB. Please pick a smaller one.');
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const response = await userService.uploadImage(dataUrl, 'travel-stories');
      const url = response?.data?.url || response?.url;
      if (!url) throw new Error('Upload failed');
      setCover(url);
    } catch (error) {
      toast.error(error.message || 'Could not upload that image');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userService.createTravelStory({ ...form, coverImage: cover });
      toast.success('Story submitted — it will appear once reviewed');
      navigate('/taxi/user/stories');
    } catch (error) {
      toast.error(error.message || 'Could not submit your story');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdf8] pb-16">
      <div className="bg-gradient-to-b from-[#FFD400] to-[#F5B700] px-6 pb-8 pt-5">
        <div className="mx-auto flex max-w-2xl items-start gap-3">
          <button onClick={() => navigate(-1)} aria-label="Back" className="mt-1 active:scale-95">
            <ArrowLeft size={22} strokeWidth={2.6} />
          </button>
          <div>
            <h1 className="text-[22px] font-black leading-tight text-slate-900">Share Your Journey</h1>
            <p className="text-[12.5px] font-semibold text-slate-700">
              Tell other travellers how the trip went
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="mx-auto -mt-4 max-w-2xl px-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50"
          >
            {cover ? (
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1.5 text-slate-500">
                {uploading ? <Loader2 size={22} className="animate-spin" /> : <ImagePlus size={22} />}
                <span className="text-[12.5px] font-bold">{uploading ? 'Uploading…' : 'Add a cover photo'}</span>
              </span>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickCover} className="hidden" />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-[12.5px] font-bold text-slate-800">Title *</span>
              <input className={field} value={form.title} onChange={set('title')} required placeholder="Manali to Leh – The Road of Dreams" />
            </label>

            <label>
              <span className="mb-1.5 block text-[12.5px] font-bold text-slate-800">Category</span>
              <select className={field} value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-[12.5px] font-bold text-slate-800">Place</span>
              <input className={field} value={form.location} onChange={set('location')} placeholder="Manali" />
            </label>
            <label>
              <span className="mb-1.5 block text-[12.5px] font-bold text-slate-800">State</span>
              <input className={field} value={form.state} onChange={set('state')} placeholder="Himachal Pradesh" />
            </label>
            <label>
              <span className="mb-1.5 block text-[12.5px] font-bold text-slate-800">Days</span>
              <input type="number" min="0" className={field} value={form.days} onChange={set('days')} />
            </label>
            <label>
              <span className="mb-1.5 block text-[12.5px] font-bold text-slate-800">Distance (km)</span>
              <input type="number" min="0" className={field} value={form.distanceKm} onChange={set('distanceKm')} />
            </label>
            <label>
              <span className="mb-1.5 block text-[12.5px] font-bold text-slate-800">Trip cost (₹)</span>
              <input type="number" min="0" className={field} value={form.cost} onChange={set('cost')} />
            </label>

            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-[12.5px] font-bold text-slate-800">Hashtags</span>
              <input className={field} value={form.hashtags} onChange={set('hashtags')} placeholder="RoadTrip, HimalayanDiaries" />
            </label>

            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-[12.5px] font-bold text-slate-800">Your story *</span>
              <textarea rows={10} className={field} value={form.body} onChange={set('body')} required placeholder="How did the trip go?" />
            </label>
          </div>

          <p className="mt-3 rounded-xl bg-[#FFF9E6] px-3 py-2.5 text-[11.5px] text-slate-700">
            Your story is reviewed before it appears in the feed.
          </p>

          <button
            type="submit"
            disabled={saving || uploading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5B700] py-3 text-[14px] font-black text-slate-900 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Submit Story
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTravelStory;
