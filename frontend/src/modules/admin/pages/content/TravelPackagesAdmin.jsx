import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Globe2, Loader2, MapPin, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import contentApi from '../../services/contentApi';

const SCOPES = [
  { id: 'domestic', label: 'Domestic Tours', icon: MapPin },
  { id: 'international', label: 'International Trips', icon: Globe2 },
];

const emptyForm = (scope) => ({
  scope,
  title: '',
  state: '',
  country: '',
  category: '',
  badge: '',
  stops: '',
  includes: '',
  perks: '',
  highlights: '',
  image: '',
  gallery: '',
  durationDays: 3,
  durationLabel: '',
  departureDate: '',
  rating: 4.5,
  reviews: '0',
  price: '',
  oldPrice: '',
  sortOrder: 0,
  active: true,
});

const toForm = (pkg) => ({
  ...emptyForm(pkg.scope),
  ...pkg,
  stops: (pkg.stops || []).join(', '),
  includes: (pkg.includes || []).join(', '),
  perks: (pkg.perks || []).join(', '),
  highlights: (pkg.highlights || []).join(', '),
  gallery: (pkg.gallery || []).join(', '),
});

const Field = ({ label, children, hint }) => (
  <label className="block">
    <span className="text-[11px] font-semibold text-slate-600">{label}</span>
    <div className="mt-1">{children}</div>
    {hint ? <span className="mt-1 block text-[10px] text-slate-400">{hint}</span> : null}
  </label>
);

const input =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-amber-400';

const TravelPackagesAdmin = () => {
  const [scope, setScope] = useState('domestic');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(() => emptyForm('domestic'));

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await contentApi.listPackages(scope);
      setItems(data?.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    load();
  }, [load]);

  const isInternational = scope === 'international';

  const openCreate = () => {
    setEditing('new');
    setForm(emptyForm(scope));
  };

  const openEdit = (pkg) => {
    setEditing(pkg._id);
    setForm(toForm(pkg));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = { ...form, scope };
      if (editing === 'new') await contentApi.createPackage(body);
      else await contentApi.updatePackage(editing, body);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (pkg) => {
    if (!window.confirm(`Delete "${pkg.title}"? This cannot be undone.`)) return;
    try {
      await contentApi.deletePackage(pkg._id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggle = async (pkg) => {
    try {
      await contentApi.togglePackage(pkg._id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const activeCount = useMemo(() => items.filter((item) => item.active).length, [items]);

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">Travel Packages</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            {activeCount} active of {items.length} · shown on the Tours and International screens
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-[13px] font-bold text-slate-900"
        >
          <Plus size={16} /> Add package
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        {SCOPES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setScope(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors ${
              scope === id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="animate-spin" size={26} />
          <p className="text-[13px] font-semibold">Loading packages…</p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Package</th>
                <th className="px-4 py-3">{isInternational ? 'Country' : 'State'}</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {items.map((pkg) => (
                <tr key={pkg._id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {pkg.image ? (
                        <img src={pkg.image} alt="" className="h-10 w-14 rounded-md object-cover" />
                      ) : (
                        <div className="h-10 w-14 rounded-md bg-slate-100" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">{pkg.title}</p>
                        <p className="truncate text-[11px] text-slate-400">{(pkg.stops || []).join(' • ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{isInternational ? pkg.country : pkg.state}</td>
                  <td className="px-4 py-3 text-slate-600">{pkg.durationLabel || `${pkg.durationDays} days`}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    ₹{Number(pkg.price).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggle(pkg)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        pkg.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {pkg.active ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(pkg)}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600"
                        aria-label="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(pkg)}
                        className="rounded-lg border border-rose-200 p-2 text-rose-600"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    No packages yet. Add the first one.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
          <form onSubmit={submit} className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-slate-900">
                {editing === 'new' ? 'Add' : 'Edit'} {isInternational ? 'international trip' : 'tour package'}
              </h2>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-2 text-slate-500">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <Field label="Title *">
                <input className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </Field>
              <Field label={isInternational ? 'Country' : 'State'}>
                <input
                  className={input}
                  value={isInternational ? form.country : form.state}
                  onChange={(e) => setForm({ ...form, [isInternational ? 'country' : 'state']: e.target.value })}
                />
              </Field>
              <Field label="Category" hint={isInternational ? 'beach, city, honeymoon, luxury, family' : 'Adventure, Beach, Honeymoon, Pilgrimage, Luxury'}>
                <input className={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </Field>
              <Field label="Badge" hint="Bestseller, New, Luxury…">
                <input className={input} value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
              </Field>
              <Field label="Stops" hint="Comma separated">
                <input className={input} value={form.stops} onChange={(e) => setForm({ ...form, stops: e.target.value })} />
              </Field>
              <Field label={isInternational ? 'Perks' : 'Includes'} hint="Comma separated">
                <input
                  className={input}
                  value={isInternational ? form.perks : form.includes}
                  onChange={(e) => setForm({ ...form, [isInternational ? 'perks' : 'includes']: e.target.value })}
                />
              </Field>
              <Field label="Cover image URL">
                <input className={input} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
              </Field>
              <Field label="Gallery" hint="Comma separated image URLs">
                <input className={input} value={form.gallery} onChange={(e) => setForm({ ...form, gallery: e.target.value })} />
              </Field>
              <Field label="Duration (days) *">
                <input type="number" min="1" className={input} value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} required />
              </Field>
              <Field label="Duration label" hint="e.g. 5 Days / 4 Nights">
                <input className={input} value={form.durationLabel} onChange={(e) => setForm({ ...form, durationLabel: e.target.value })} />
              </Field>
              {isInternational ? (
                <Field label="Next departure" hint="e.g. 18 Jun 2026">
                  <input className={input} value={form.departureDate} onChange={(e) => setForm({ ...form, departureDate: e.target.value })} />
                </Field>
              ) : null}
              <Field label="Rating" hint="0 – 5">
                <input type="number" step="0.1" min="0" max="5" className={input} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
              </Field>
              <Field label="Reviews label" hint="e.g. 1.2K">
                <input className={input} value={form.reviews} onChange={(e) => setForm({ ...form, reviews: e.target.value })} />
              </Field>
              <Field label="Price (₹) *">
                <input type="number" min="0" className={input} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </Field>
              <Field label="Strike-through price (₹)">
                <input type="number" min="0" className={input} value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} />
              </Field>
              <Field label="Sort order" hint="Lower shows first">
                <input type="number" className={input} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
              </Field>
            </div>

            <label className="mt-4 flex items-center gap-2">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              <span className="text-[13px] font-semibold text-slate-700">Visible in the app</span>
            </label>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-600">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2 text-[13px] font-bold text-slate-900 disabled:opacity-60">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {editing === 'new' ? 'Create' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};

export default TravelPackagesAdmin;
