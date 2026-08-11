import React, { useCallback, useEffect, useState } from 'react';
import { ChevronRight, GripVertical, Plus, Star, Trash2, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { contentApi } from '../../services/contentApi';

/**
 * Homepage sections: customer reviews and video stories.
 *
 * These ride on the existing keyed ContentBlock collection rather than new
 * models - `items` is Mixed, so a section's shape lives here and adding one
 * needs no migration. The customer site reads the same blocks from the public
 * /users/content-blocks feed.
 *
 * Two homepage sections are deliberately NOT here because they already have
 * their own admin screens, and duplicating them would let the two disagree:
 *   - "Meet our drivers"  -> Driver Management > Hire Drivers
 *   - Blog / travel stories -> App Content > Travel Stories
 */

const SECTIONS = [
  {
    key: 'home.testimonials',
    title: 'Customer Reviews',
    blurb: 'Shown as a review carousel on the customer homepage.',
    icon: Star,
    fields: [
      { name: 'name', label: 'Customer name', placeholder: 'Rahul Sharma', required: true },
      { name: 'city', label: 'City', placeholder: 'Indore' },
      { name: 'rating', label: 'Rating (1-5)', placeholder: '5', type: 'number' },
      { name: 'quote', label: 'What they said', placeholder: 'Clean car, smooth pickup...', textarea: true, required: true },
      { name: 'image', label: 'Photo URL', placeholder: 'https://...' },
    ],
  },
  {
    key: 'home.videos',
    title: 'Videos',
    blurb: 'YouTube videos featured on the homepage.',
    icon: Video,
    fields: [
      { name: 'title', label: 'Title', placeholder: 'How self drive works', required: true },
      { name: 'youtubeUrl', label: 'YouTube URL or ID', placeholder: 'https://youtu.be/xxxxxxxxxxx', required: true },
      { name: 'caption', label: 'Caption', placeholder: 'A two minute walkthrough' },
    ],
  },
];

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/60';

/** Accepts a full URL or a bare id and returns the 11-character video id. */
const youtubeIdOf = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^[\w-]{11}$/.test(raw)) return raw;
  const match = raw.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return match ? match[1] : '';
};

const HomepageSections = () => {
  const [blocks, setBlocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await contentApi.listBlocks();
      const rows = response?.results || response?.data?.results || response || [];
      const byKey = {};
      (Array.isArray(rows) ? rows : []).forEach((row) => { byKey[row.key] = row; });
      setBlocks(byKey);
    } catch (error) {
      toast.error(error?.message || 'Could not load homepage sections.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const itemsOf = (key) => (Array.isArray(blocks[key]?.items) ? blocks[key].items : []);

  const setItems = (key, items) =>
    setBlocks((current) => ({ ...current, [key]: { ...(current[key] || { key }), items } }));

  const addItem = (section) => setItems(section.key, [...itemsOf(section.key), {}]);

  const removeItem = (section, index) =>
    setItems(section.key, itemsOf(section.key).filter((_, i) => i !== index));

  const editItem = (section, index, field, value) =>
    setItems(section.key, itemsOf(section.key).map((item, i) => (i === index ? { ...item, [field]: value } : item)));

  const move = (section, index, delta) => {
    const items = [...itemsOf(section.key)];
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    setItems(section.key, items);
  };

  const saveSection = async (section) => {
    const items = itemsOf(section.key);
    const required = section.fields.filter((f) => f.required);

    for (const [index, item] of items.entries()) {
      const missing = required.find((f) => !String(item[f.name] || '').trim());
      if (missing) return toast.error(`Row ${index + 1}: ${missing.label} is required`);
      if (section.key === 'home.videos' && !youtubeIdOf(item.youtubeUrl)) {
        return toast.error(`Row ${index + 1}: that does not look like a YouTube link`);
      }
    }

    setSavingKey(section.key);
    try {
      await contentApi.saveBlock({ key: section.key, label: section.title, items, active: true });
      toast.success(`${section.title} saved`);
      await load();
    } catch (error) {
      toast.error(error?.message || 'Could not save.');
    } finally {
      setSavingKey('');
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] p-6 lg:p-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
          <span>App Content</span>
          <ChevronRight size={12} />
          <span className="text-slate-700">Homepage Sections</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Homepage Sections</h1>
        <p className="mt-1 text-sm text-slate-500">
          Reviews and videos shown on the customer homepage. Each section saves on its own.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        Two more homepage sections are managed elsewhere, so they are not duplicated here:{' '}
        <strong className="text-slate-800">Meet our drivers</strong> lives under Driver Management &rarr; Hire Drivers, and{' '}
        <strong className="text-slate-800">blog posts</strong> under App Content &rarr; Travel Stories.
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-400">Loading...</div>
      ) : (
        SECTIONS.map((section) => {
          const items = itemsOf(section.key);
          const Icon = section.icon;

          return (
            <div key={section.key} className="mb-6 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
                    <p className="text-sm text-slate-500">{section.blurb}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {items.length} item{items.length === 1 ? '' : 's'} &middot; shows on the homepage when at least one is saved
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => saveSection(section)}
                  disabled={savingKey === section.key}
                  className="shrink-0 rounded-xl bg-[#2e3c78] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#24305f] disabled:opacity-60"
                >
                  {savingKey === section.key ? 'Saving...' : 'Save section'}
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                        <GripVertical size={14} />
                        Item {index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => move(section, index, -1)} disabled={index === 0}
                          className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-white disabled:opacity-30">Up</button>
                        <button type="button" onClick={() => move(section, index, 1)} disabled={index === items.length - 1}
                          className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-white disabled:opacity-30">Down</button>
                        <button type="button" onClick={() => removeItem(section, index)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" title="Remove">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {section.fields.map((field) => (
                        <div key={field.name} className={field.textarea ? 'md:col-span-2' : ''}>
                          <label className="mb-1.5 block text-[12px] font-bold text-slate-700">
                            {field.label}{field.required ? ' *' : ''}
                          </label>
                          {field.textarea ? (
                            <textarea rows={3} value={item[field.name] || ''} placeholder={field.placeholder}
                              onChange={(e) => editItem(section, index, field.name, e.target.value)} className={inputClass} />
                          ) : (
                            <input type={field.type || 'text'} value={item[field.name] || ''} placeholder={field.placeholder}
                              onChange={(e) => editItem(section, index, field.name, e.target.value)} className={inputClass} />
                          )}
                          {field.name === 'youtubeUrl' && item.youtubeUrl ? (
                            <p className={`mt-1 text-[12px] font-semibold ${youtubeIdOf(item.youtubeUrl) ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {youtubeIdOf(item.youtubeUrl) ? `Video id: ${youtubeIdOf(item.youtubeUrl)}` : 'Not a recognisable YouTube link'}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <button type="button" onClick={() => addItem(section)}
                  className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                  <Plus size={16} />
                  Add {section.title.replace(/s$/, '').toLowerCase()}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default HomepageSections;
