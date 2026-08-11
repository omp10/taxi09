import React, { useCallback, useEffect, useState } from 'react';
import { ChevronRight, Image as ImageIcon, Plus, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';

/**
 * Write and publish blog posts.
 *
 * These are editorial pieces written by the business and shown in the
 * "Read about us" row on the customer homepage. Distinct from Travel Stories,
 * which are user-submitted trip posts with a location and likes.
 *
 * Drafts are invisible to customers: the public feed returns published only,
 * so a half-written post can be saved safely.
 */

const unwrap = (response) =>
  response?.data?.data?.results || response?.data?.results || response?.results || [];

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/60';
const labelClass = 'mb-1.5 block text-[12px] font-bold text-slate-700';

const emptyPost = {
  title: '', excerpt: '', content: '', coverImage: '', author: '',
  category: '', tags: '', status: 'draft', featured: false,
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const BlogsAdmin = () => {
  const [posts, setPosts] = useState([]);
  const [draft, setDraft] = useState(emptyPost);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPosts(unwrap(await adminService.getBlogs()));
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Could not load posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (key) => (event) =>
    setDraft((current) => ({
      ...current,
      [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    }));

  const pickCover = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Pick an image under 5MB');
    try {
      const dataUrl = await fileToDataUrl(file);
      setDraft((current) => ({ ...current, coverImage: dataUrl }));
    } catch {
      toast.error('Could not read that image');
    }
  };

  const startEdit = (post) => {
    setEditingId(post.id);
    setDraft({
      title: post.title || '', excerpt: post.excerpt || '', content: post.content || '',
      coverImage: post.coverImage || '', author: post.author || '', category: post.category || '',
      tags: (post.tags || []).join(', '), status: post.status || 'draft', featured: !!post.featured,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancel = () => { setEditingId(''); setDraft(emptyPost); };

  const save = async () => {
    if (!draft.title.trim()) return toast.error('Give the post a title');
    if (draft.status === 'published' && !draft.coverImage.trim()) {
      return toast.error('A published post needs a cover image - the homepage card is mostly its image');
    }

    setSaving(true);
    try {
      const payload = { ...draft, tags: draft.tags.split(',').map((t) => t.trim()).filter(Boolean) };
      if (editingId) {
        await adminService.updateBlog(editingId, payload);
        toast.success('Post updated');
      } else {
        await adminService.createBlog(payload);
        toast.success(draft.status === 'published' ? 'Post published' : 'Draft saved');
      }
      cancel();
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (post) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await adminService.deleteBlog(post.id);
      toast.success('Post deleted');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Could not delete.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] p-6 lg:p-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
          <span>App Content</span><ChevronRight size={12} /><span className="text-slate-700">Blog</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Blog</h1>
        <p className="mt-1 text-sm text-slate-500">
          Posts shown in the &ldquo;Read about us&rdquo; row on the customer homepage. Drafts stay private until published.
        </p>
      </div>

      <div className="mb-6 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Edit post' : 'Write a post'}</h2>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className={labelClass}>Title *</label>
            <input value={draft.title} onChange={set('title')} className={inputClass} placeholder="Weekend getaways near Indore you can drive to" />
          </div>
          <div>
            <label className={labelClass}>Author</label>
            <input value={draft.author} onChange={set('author')} className={inputClass} placeholder="Taxi09 Team" />
          </div>

          <div className="lg:col-span-3">
            <label className={labelClass}>Excerpt</label>
            <input value={draft.excerpt} onChange={set('excerpt')} className={inputClass} placeholder="One line shown under the headline" />
          </div>

          <div className="lg:col-span-3">
            <label className={labelClass}>Content</label>
            <textarea rows={10} value={draft.content} onChange={set('content')} className={inputClass}
              placeholder="Write the post here. Reading time is worked out from the length." />
            <p className="mt-1 text-[12px] text-slate-400">
              {draft.content.split(/\s+/).filter(Boolean).length} words &middot; about{' '}
              {Math.max(1, Math.round(draft.content.split(/\s+/).filter(Boolean).length / 200))} min read
            </p>
          </div>

          <div className="lg:col-span-2">
            <label className={labelClass}>Cover image</label>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                <ImageIcon size={16} />
                {draft.coverImage ? 'Replace image' : 'Upload image'}
                <input type="file" accept="image/*" onChange={pickCover} className="hidden" />
              </label>
              <input value={draft.coverImage.startsWith('data:') ? '' : draft.coverImage}
                onChange={set('coverImage')} className={inputClass} placeholder="or paste an image URL" />
            </div>
            {draft.coverImage ? (
              <img src={draft.coverImage} alt="" className="mt-3 h-32 w-full rounded-xl object-cover" />
            ) : null}
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Category</label>
              <input value={draft.category} onChange={set('category')} className={inputClass} placeholder="Travel" />
            </div>
            <div>
              <label className={labelClass}>Tags (comma separated)</label>
              <input value={draft.tags} onChange={set('tags')} className={inputClass} placeholder="indore, weekend, road trip" />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={draft.status} onChange={set('status')} className={inputClass}>
                <option value="draft">Draft (hidden)</option>
                <option value="published">Published (live)</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={draft.featured} onChange={set('featured')} className="h-4 w-4 rounded border-slate-300" />
              Feature at the front of the row
            </label>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button type="button" onClick={save} disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2e3c78] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#24305f] disabled:opacity-60">
            <Plus size={16} />
            {saving ? 'Saving...' : editingId ? 'Save changes' : 'Save post'}
          </button>
          {editingId ? (
            <button type="button" onClick={cancel} className="text-sm font-medium text-slate-500 hover:text-slate-700">Cancel</button>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[80px_minmax(0,1fr)_130px_120px_140px] gap-4 border-b border-slate-100 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
          <span>Cover</span><span>Title</span><span>Status</span><span>Published</span><span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="p-8 text-sm text-slate-400">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-sm text-slate-400">No posts yet. Write the first one above.</div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="grid grid-cols-[80px_minmax(0,1fr)_130px_120px_140px] items-center gap-4 border-b border-slate-100 px-6 py-4 last:border-b-0">
              <span className="h-12 w-16 overflow-hidden rounded-lg bg-slate-100">
                {post.coverImage ? <img src={post.coverImage} alt="" className="h-full w-full object-cover" /> : null}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 truncate text-sm font-bold text-slate-900">
                  {post.featured ? <Star size={13} className="shrink-0 text-[#F5B700]" fill="#F5B700" strokeWidth={0} /> : null}
                  {post.title}
                </span>
                <span className="block truncate text-xs text-slate-500">{post.excerpt || `${post.readMinutes} min read`}</span>
              </span>
              <span>
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  post.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {post.status}
                </span>
              </span>
              <span className="text-xs text-slate-500">
                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '-'}
              </span>
              <span className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => startEdit(post)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Edit</button>
                <button type="button" onClick={() => remove(post)}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" title="Delete"><Trash2 size={15} /></button>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BlogsAdmin;
