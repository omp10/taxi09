import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BookOpen, ExternalLink, Loader2, Star, Trash2 } from 'lucide-react';
import contentApi from '../../services/contentApi';

/**
 * Travel stories: the curated feed plus the moderation queue for anything a
 * reader has submitted.
 */

const input = 'rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-amber-400';

const TONE = {
  published: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  rejected: 'bg-red-50 text-red-600',
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const TravelStoriesAdmin = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search.trim()) params.set('search', search.trim());
    const query = params.toString();

    setLoading(true);
    contentApi
      .listTravelStories(query ? `?${query}` : '')
      .then((data) => setRows(data?.results || []))
      .catch((error) => toast.error(error.message || 'Could not load stories'))
      .finally(() => setLoading(false));
  }, [status, search]);

  useEffect(() => {
    const handle = setTimeout(load, 250);
    return () => clearTimeout(handle);
  }, [load]);

  const patch = async (row, body, message) => {
    try {
      await contentApi.updateTravelStory(row._id, body);
      toast.success(message);
      load();
    } catch (error) {
      toast.error(error.message || 'Could not update the story');
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete "${row.title}"? This cannot be undone.`)) return;
    try {
      await contentApi.deleteTravelStory(row._id);
      toast.success('Story deleted');
      load();
    } catch (error) {
      toast.error(error.message || 'Could not delete the story');
    }
  };

  const pending = rows.filter((row) => row.status === 'pending').length;

  return (
    <div className="p-6">
      <div>
        <h1 className="flex items-center gap-2 text-[20px] font-black text-slate-900">
          <BookOpen size={20} className="text-amber-500" /> Travel Stories
        </h1>
        <p className="text-[13px] text-slate-500">
          The feed, and anything readers have submitted
          {pending > 0 ? ` · ${pending} waiting for review` : ''}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Title, place, author…"
          className={`${input} w-64`}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={input}>
          <option value="">All statuses</option>
          {['published', 'pending', 'rejected'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                {['Story', 'Author', 'Category', 'Trip', 'Engagement', 'Status', 'Added', ''].map((head) => (
                  <th key={head} className="px-4 py-3 font-bold">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {row.coverImage ? (
                        <img src={row.coverImage} alt="" className="h-10 w-14 rounded-lg object-cover" />
                      ) : null}
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-slate-900">{row.title}</p>
                        <p className="truncate text-[11.5px] text-slate-500">
                          {row.location}{row.state ? `, ${row.state}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12.5px] text-slate-700">{row.authorName || '—'}</td>
                  <td className="px-4 py-3 text-[12.5px] text-slate-700">{row.category}</td>
                  <td className="px-4 py-3 text-[11.5px] text-slate-600">
                    {row.days ? `${row.days}d` : '—'} · {row.distanceKm ? `${row.distanceKm}km` : '—'}
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-slate-600">
                    {row.likes} likes · {row.views} views
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold capitalize ${TONE[row.status] || ''}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">{formatDate(row.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {row.status !== 'published' ? (
                        <button
                          onClick={() => patch(row, { status: 'published' }, 'Story published')}
                          className="rounded-lg bg-emerald-50 px-2 py-1 text-[11.5px] font-bold text-emerald-700"
                        >
                          Publish
                        </button>
                      ) : (
                        <button
                          onClick={() => patch(row, { status: 'pending' }, 'Story unpublished')}
                          className="rounded-lg bg-slate-100 px-2 py-1 text-[11.5px] font-bold text-slate-600"
                        >
                          Unpublish
                        </button>
                      )}
                      <button
                        onClick={() => patch(row, { featured: !row.featured }, row.featured ? 'Unfeatured' : 'Featured')}
                        title={row.featured ? 'Featured' : 'Not featured'}
                        className={`rounded-lg px-2 py-1 ${row.featured ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}
                      >
                        <Star size={13} fill={row.featured ? 'currentColor' : 'none'} />
                      </button>
                      <a
                        href={`/taxi/user/stories/${row.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600"
                      >
                        <ExternalLink size={13} />
                      </a>
                      <button
                        onClick={() => remove(row)}
                        className="rounded-lg bg-red-50 px-2 py-1 text-red-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400">No stories yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TravelStoriesAdmin;
