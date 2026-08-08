import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BedDouble, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import contentApi from '../../services/contentApi';
import LocationPicker from '../../components/LocationPicker';

const emptyRoom = () => ({
  key: '',
  name: '',
  category: 'Deluxe',
  sqft: 300,
  adults: 2,
  children: 1,
  bed: '1 King Bed',
  priceMultiplier: 1,
  perks: '',
  image: '',
  roomsLeft: 3,
  active: true,
});

const emptyForm = () => ({
  name: '',
  city: '',
  area: '',
  distance: '',
  badge: '',
  image: '',
  gallery: '',
  amenities: '',
  facilities: '',
  rating: 4.5,
  reviews: '0',
  propertyType: '',
  starRating: 0,
  latitude: '',
  longitude: '',
  price: '',
  oldPrice: '',
  checkInTime: '2:00 PM',
  checkOutTime: '11:00 AM',
  sortOrder: 0,
  active: true,
  rooms: [emptyRoom()],
});

const toForm = (hotel) => ({
  ...emptyForm(),
  ...hotel,
  gallery: (hotel.gallery || []).join(', '),
  amenities: (hotel.amenities || []).join(', '),
  facilities: (hotel.facilities || []).join(', '),
  rooms: (hotel.rooms || []).map((room) => ({ ...emptyRoom(), ...room, perks: (room.perks || []).join(', ') })),
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

const HotelsAdmin = () => {
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
      const data = await contentApi.listHotels();
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
      if (editing === 'new') await contentApi.createHotel(form);
      else await contentApi.updateHotel(editing, form);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (hotel) => {
    if (!window.confirm(`Delete "${hotel.name}"? This cannot be undone.`)) return;
    try {
      await contentApi.deleteHotel(hotel._id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggle = async (hotel) => {
    try {
      await contentApi.toggleHotel(hotel._id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateRoom = (index, patch) =>
    setForm((current) => ({
      ...current,
      rooms: current.rooms.map((room, idx) => (idx === index ? { ...room, ...patch } : room)),
    }));

  const activeCount = useMemo(() => items.filter((item) => item.active).length, [items]);

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">Hotels</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            {activeCount} active of {items.length} · room rates scale from each hotel&apos;s nightly price
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
          <Plus size={16} /> Add hotel
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
          <p className="text-[13px] font-semibold">Loading hotels…</p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Hotel</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Rooms</th>
                <th className="px-4 py-3">Rate / night</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {items.map((hotel) => (
                <tr key={hotel._id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {hotel.image ? (
                        <img src={hotel.image} alt="" className="h-10 w-14 rounded-md object-cover" />
                      ) : (
                        <div className="h-10 w-14 rounded-md bg-slate-100" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">{hotel.name}</p>
                        <p className="truncate text-[11px] text-slate-400">{hotel.area}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{hotel.city}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="flex items-center gap-1">
                      <BedDouble size={13} /> {(hotel.rooms || []).length}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    ₹{Number(hotel.price).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggle(hotel)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        hotel.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {hotel.active ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(hotel._id);
                          setForm(toForm(hotel));
                        }}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600"
                        aria-label="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(hotel)}
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
                    No hotels yet. Add the first one.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
          <form onSubmit={submit} className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-slate-900">
                {editing === 'new' ? 'Add hotel' : 'Edit hotel'}
              </h2>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-2 text-slate-500">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <Field label="Name *">
                <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </Field>
              <Field label="City *">
                <input className={input} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
              </Field>
              <Field label="Badge" hint="Popular, Best Value…">
                <input className={input} value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
              </Field>
              <Field label="Area">
                <input className={input} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
              </Field>
              <Field label="Distance line" hint="e.g. 2.3 km from City Centre">
                <input className={input} value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} />
              </Field>
              <Field label="Cover image URL">
                <input className={input} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
              </Field>
              <Field label="Amenities" hint="Comma separated · shown on the list card">
                <input className={input} value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
              </Field>
              <Field label="Facilities" hint="Comma separated · shown on the detail page">
                <input className={input} value={form.facilities} onChange={(e) => setForm({ ...form, facilities: e.target.value })} />
              </Field>
              <Field label="Gallery" hint="Comma separated image URLs">
                <input className={input} value={form.gallery} onChange={(e) => setForm({ ...form, gallery: e.target.value })} />
              </Field>
              <Field label="Rate / night (₹) *">
                <input type="number" min="0" className={input} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </Field>
              <Field label="Strike-through rate (₹)">
                <input type="number" min="0" className={input} value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} />
              </Field>
              <Field label="Latitude" hint="Map position; enables nearby search">
                <input type="number" step="0.0001" className={input} value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
              </Field>
              <Field label="Longitude">
                <input type="number" step="0.0001" className={input} value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
              </Field>
              <div className="col-span-3">
                <LocationPicker
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onPick={({ latitude, longitude }) => setForm((prev) => ({ ...prev, latitude, longitude }))}
                />
              </div>
              <Field label="Property type">
                <select className={input} value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })}>
                  <option value="">Unclassified</option>
                  {['Hotel', 'Resort', 'Apartment', 'Guest House', 'Villa', 'Homestay', 'Hostel'].map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </Field>
              <Field label="Star class" hint="Official 1 – 5 rating; 0 hides it">
                <select className={input} value={form.starRating} onChange={(e) => setForm({ ...form, starRating: Number(e.target.value) })}>
                  <option value={0}>Unclassified</option>
                  {[1, 2, 3, 4, 5].map((star) => <option key={star} value={star}>{star} Star</option>)}
                </select>
              </Field>
              <Field label="Guest rating" hint="0 – 5 review score">
                <input type="number" step="0.1" min="0" max="5" className={input} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
              </Field>
              <Field label="Reviews label">
                <input className={input} value={form.reviews} onChange={(e) => setForm({ ...form, reviews: e.target.value })} />
              </Field>
              <Field label="Check-in">
                <input className={input} value={form.checkInTime} onChange={(e) => setForm({ ...form, checkInTime: e.target.value })} />
              </Field>
              <Field label="Check-out">
                <input className={input} value={form.checkOutTime} onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })} />
              </Field>
            </div>

            {/* Room types */}
            <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-slate-900">Room types</h3>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, rooms: [...form.rooms, emptyRoom()] })}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-semibold text-slate-700"
                >
                  <Plus size={13} /> Add room type
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {form.rooms.map((room, index) => (
                  <div key={index} className="rounded-xl border border-slate-200 p-3">
                    <div className="grid grid-cols-4 gap-3">
                      <Field label="Room name">
                        <input className={input} value={room.name} onChange={(e) => updateRoom(index, { name: e.target.value })} />
                      </Field>
                      <Field label="Category" hint="Deluxe / Suite / Family / Premium">
                        <input className={input} value={room.category} onChange={(e) => updateRoom(index, { category: e.target.value })} />
                      </Field>
                      <Field label="Price multiplier" hint="× the hotel rate">
                        <input type="number" step="0.01" min="0" className={input} value={room.priceMultiplier} onChange={(e) => updateRoom(index, { priceMultiplier: e.target.value })} />
                      </Field>
                      <Field label="Rooms left">
                        <input type="number" min="0" className={input} value={room.roomsLeft} onChange={(e) => updateRoom(index, { roomsLeft: e.target.value })} />
                      </Field>
                      <Field label="Sq. ft.">
                        <input type="number" min="0" className={input} value={room.sqft} onChange={(e) => updateRoom(index, { sqft: e.target.value })} />
                      </Field>
                      <Field label="Adults">
                        <input type="number" min="1" className={input} value={room.adults} onChange={(e) => updateRoom(index, { adults: e.target.value })} />
                      </Field>
                      <Field label="Children">
                        <input type="number" min="0" className={input} value={room.children} onChange={(e) => updateRoom(index, { children: e.target.value })} />
                      </Field>
                      <Field label="Bed">
                        <input className={input} value={room.bed} onChange={(e) => updateRoom(index, { bed: e.target.value })} />
                      </Field>
                      <div className="col-span-2">
                        <Field label="Perks" hint="Comma separated">
                          <input className={input} value={room.perks} onChange={(e) => updateRoom(index, { perks: e.target.value })} />
                        </Field>
                      </div>
                      <div className="col-span-2">
                        <Field label="Room image URL">
                          <input className={input} value={room.image} onChange={(e) => updateRoom(index, { image: e.target.value })} />
                        </Field>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={room.active !== false} onChange={(e) => updateRoom(index, { active: e.target.checked })} />
                        <span className="text-[12px] font-semibold text-slate-600">Bookable</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, rooms: form.rooms.filter((_, idx) => idx !== index) })}
                        className="flex items-center gap-1.5 text-[12px] font-semibold text-rose-600"
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
                {editing === 'new' ? 'Create hotel' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};

export default HotelsAdmin;
