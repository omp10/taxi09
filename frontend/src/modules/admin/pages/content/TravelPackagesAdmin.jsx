import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Globe2, Loader2, MapPin, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import contentApi from '../../services/contentApi';
import { FormWizard, Field, ImageField, GalleryField, inputClass } from '../../components/FormWizard';

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
  gallery: [],
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
  gallery: pkg.gallery || [],
});

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

  const set = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));

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
        <FormWizard
          title={`${editing === 'new' ? 'Add' : 'Edit'} ${isInternational ? 'international' : 'tour'} package`}
          saving={saving}
          onClose={() => setEditing(null)}
          onSubmit={submit}
          submitLabel={editing === 'new' ? 'Create package' : 'Save changes'}
          steps={[
            {
              title: 'Basics',
              hint: 'What the trip is and where it goes.',
              isComplete: () => Boolean(String(form.title).trim()),
              incompleteMessage: 'A title is required.',
              render: () => (
                <>
                  <Field label="Title *" span={2}>
                    <input className={inputClass} value={form.title} onChange={set('title')} required />
                  </Field>
                  <Field label={isInternational ? 'Country' : 'State'}>
                    <input
                      className={inputClass}
                      value={isInternational ? form.country : form.state}
                      onChange={set(isInternational ? 'country' : 'state')}
                    />
                  </Field>
                  <Field label="Category" hint="Honeymoon, Family, Adventure...">
                    <input className={inputClass} value={form.category} onChange={set('category')} />
                  </Field>
                  <Field label="Badge" hint="Bestseller, New...">
                    <input className={inputClass} value={form.badge} onChange={set('badge')} />
                  </Field>
                  <Field label="Sort order" hint="Lower shows first">
                    <input type="number" className={inputClass} value={form.sortOrder} onChange={set('sortOrder')} />
                  </Field>
                  <Field label="Stops" hint="Comma separated, in order" span={3}>
                    <input className={inputClass} value={form.stops} onChange={set('stops')} />
                  </Field>
                </>
              ),
            },
            {
              title: 'Itinerary',
              hint: 'How long it runs, and when it leaves.',
              render: () => (
                <>
                  <Field label="Duration (days)">
                    <input type="number" min="1" className={inputClass} value={form.durationDays} onChange={set('durationDays')} />
                  </Field>
                  <Field label="Duration label" hint="e.g. 5 Days / 4 Nights" span={2}>
                    <input className={inputClass} value={form.durationLabel} onChange={set('durationLabel')} />
                  </Field>
                  <Field label="Departure date">
                    <input className={inputClass} value={form.departureDate} onChange={set('departureDate')} />
                  </Field>
                  <Field label="Guest rating" hint="0 - 5">
                    <input type="number" step="0.1" min="0" max="5" className={inputClass} value={form.rating} onChange={set('rating')} />
                  </Field>
                  <Field label="Review count">
                    <input className={inputClass} value={form.reviews} onChange={set('reviews')} />
                  </Field>
                  <Field label="Highlights" hint="Comma separated" span={3}>
                    <input className={inputClass} value={form.highlights} onChange={set('highlights')} />
                  </Field>
                </>
              ),
            },
            {
              title: 'Photos',
              hint: 'Upload from your computer, or paste a URL if the image is already hosted.',
              render: () => (
                <>
                  <ImageField
                    label="Cover image"
                    hint="Shown on the package card and at the top of the detail page"
                    span={3}
                    value={form.image}
                    onChange={(url) => setForm((f) => ({ ...f, image: url }))}
                  />
                  <GalleryField
                    label="Gallery"
                    hint="Extra photos on the detail page"
                    value={form.gallery}
                    onChange={(list) => setForm((f) => ({ ...f, gallery: list }))}
                  />
                </>
              ),
            },
            {
              title: "What's included",
              hint: 'Shown as the inclusions and perks on the detail page.',
              render: () => (
                <>
                  <Field label="Includes" hint="Comma separated - meals, stay, sightseeing..." span={3}>
                    <input className={inputClass} value={form.includes} onChange={set('includes')} />
                  </Field>
                  <Field label="Perks" hint="Comma separated" span={3}>
                    <input className={inputClass} value={form.perks} onChange={set('perks')} />
                  </Field>
                </>
              ),
            },
            {
              title: 'Pricing',
              hint: 'Per person. Tax is added by the server at booking time.',
              isComplete: () => String(form.price).trim() !== '',
              incompleteMessage: 'A price is required.',
              render: () => (
                <>
                  <Field label="Price per person (Rs) *">
                    <input type="number" min="0" className={inputClass} value={form.price} onChange={set('price')} required />
                  </Field>
                  <Field label="Strike-through price (Rs)">
                    <input type="number" min="0" className={inputClass} value={form.oldPrice} onChange={set('oldPrice')} />
                  </Field>
                  <label className="col-span-3 flex items-center gap-2">
                    <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                    <span className="text-[12.5px] font-bold text-slate-800">Show this package to travellers</span>
                  </label>
                  {error ? <p className="col-span-3 text-[12.5px] font-semibold text-red-600">{error}</p> : null}
                </>
              ),
            },
          ]}
        />
      ) : null}
    </div>
  );
};

export default TravelPackagesAdmin;
