import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Loader2, Pencil, Plus, Save, Star, Trash2, X } from 'lucide-react';
import contentApi from '../../services/contentApi';

const HIRE_TYPES = ['permanent', 'monthly', 'outstation', 'hourly'];

const emptyForm = () => ({
  name: '',
  photo: '',
  badge: '',
  rating: 4.5,
  trips: '0',
  experience: '',
  about: '',
  languages: '',
  vehicleName: '',
  vehiclePlate: '',
  city: '',
  etaMinutes: 15,
  distanceKm: 5,
  hireTypes: ['permanent'],
  monthlySalary: '',
  dailyRate: '',
  hourlyRate: '',
  verified: true,
  available: true,
  sortOrder: 0,
  active: true,
});

const toForm = (driver) => ({
  ...emptyForm(),
  ...driver,
  languages: (driver.languages || []).join(', '),
  hireTypes: driver.hireTypes || ['permanent'],
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

const HireDriversAdmin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await contentApi.listHireDrivers();
      setItems(data?.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing === 'new') await contentApi.createHireDriver(form);
      else await contentApi.updateHireDriver(editing, form);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (driver) => {
    if (!window.confirm(`Remove ${driver.name} from the hire list?`)) return;
    try {
      await contentApi.deleteHireDriver(driver._id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggle = async (driver) => {
    try {
      await contentApi.toggleHireDriver(driver._id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleHireType = (type) =>
    setForm((current) => ({
      ...current,
      hireTypes: current.hireTypes.includes(type)
        ? current.hireTypes.filter((item) => item !== type)
        : [...current.hireTypes, type],
    }));

  const activeCount = useMemo(() => items.filter((item) => item.active).length, [items]);

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">Drivers for Hire</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            {activeCount} listed of {items.length} · shown on the Hire a Driver flow
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing('new');
            setForm(emptyForm());
          }}
          className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-[13px] font-bold text-slate-900"
        >
          <Plus size={16} /> Add driver
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="animate-spin" size={26} />
          <p className="text-[13px] font-semibold">Loading drivers…</p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Hire types</th>
                <th className="px-4 py-3">Monthly</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {items.map((driver) => (
                <tr key={driver._id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {driver.photo ? (
                        <img src={driver.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-100" />
                      )}
                      <div className="min-w-0">
                        <p className="flex items-center gap-1 font-semibold text-slate-800">
                          {driver.name}
                          {driver.verified ? <BadgeCheck size={13} className="text-emerald-500" /> : null}
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          {driver.rating} · {driver.experience}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{driver.city}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <p>{driver.vehicleName}</p>
                    <p className="text-[11px] text-slate-400">{driver.vehiclePlate}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(driver.hireTypes || []).map((type) => (
                        <span key={type} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          {type}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {driver.monthlySalary ? `₹${Number(driver.monthlySalary).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggle(driver)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        driver.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {driver.active ? 'Listed' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(driver._id);
                          setForm(toForm(driver));
                        }}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600"
                        aria-label="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(driver)}
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
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    No drivers listed yet.
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
                {editing === 'new' ? 'Add driver' : 'Edit driver'}
              </h2>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-2 text-slate-500">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <Field label="Name *">
                <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </Field>
              <Field label="City">
                <input className={input} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
              <Field label="Badge" hint="Top Rated, Experienced…">
                <input className={input} value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
              </Field>
              <Field label="Photo URL">
                <input className={input} value={form.photo} onChange={(e) => setForm({ ...form, photo: e.target.value })} />
              </Field>
              <Field label="Experience" hint="e.g. 6+ Years">
                <input className={input} value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
              </Field>
              <Field label="Trips" hint="e.g. 3200+">
                <input className={input} value={form.trips} onChange={(e) => setForm({ ...form, trips: e.target.value })} />
              </Field>
              <Field label="Languages" hint="Comma separated">
                <input className={input} value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} />
              </Field>
              <Field label="Vehicle">
                <input className={input} value={form.vehicleName} onChange={(e) => setForm({ ...form, vehicleName: e.target.value })} />
              </Field>
              <Field label="Plate number">
                <input className={input} value={form.vehiclePlate} onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })} />
              </Field>
              <Field label="Rating" hint="0 – 5">
                <input type="number" step="0.1" min="0" max="5" className={input} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
              </Field>
              <Field label="ETA (minutes)">
                <input type="number" min="0" className={input} value={form.etaMinutes} onChange={(e) => setForm({ ...form, etaMinutes: e.target.value })} />
              </Field>
              <Field label="Distance (km)">
                <input type="number" step="0.1" min="0" className={input} value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} />
              </Field>
              <Field label="Monthly salary (₹)">
                <input type="number" min="0" className={input} value={form.monthlySalary} onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })} />
              </Field>
              <Field label="Daily rate (₹)">
                <input type="number" min="0" className={input} value={form.dailyRate} onChange={(e) => setForm({ ...form, dailyRate: e.target.value })} />
              </Field>
              <Field label="Hourly rate (₹)">
                <input type="number" min="0" className={input} value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} />
              </Field>
            </div>

            <div className="mt-4">
              <span className="text-[11px] font-semibold text-slate-600">Accepts hire types</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {HIRE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleHireType(type)}
                    className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold capitalize ${
                      form.hireTypes.includes(type)
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-5">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} />
                <span className="text-[13px] font-semibold text-slate-700">Documents verified</span>
              </label>
              <label className="block lg:col-span-2">
                <span className={label}>In their words</span>
                <textarea
                  rows={2}
                  className={input}
                  value={form.about}
                  onChange={(e) => setForm({ ...form, about: e.target.value })}
                  placeholder="I have driven in Indore for eight years and I know every shortcut."
                />
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
                <span className="text-[13px] font-semibold text-slate-700">Currently available</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                <span className="text-[13px] font-semibold text-slate-700">Listed in the app</span>
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-600">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2 text-[13px] font-bold text-slate-900 disabled:opacity-60">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {editing === 'new' ? 'Add driver' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};

export default HireDriversAdmin;
