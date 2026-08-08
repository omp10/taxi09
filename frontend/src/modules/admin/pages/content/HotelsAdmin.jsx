import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BedDouble, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import contentApi from '../../services/contentApi';
import LocationPicker from '../../components/LocationPicker';
import { FormWizard, Field, ImageField, GalleryField, inputClass } from '../../components/FormWizard';

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
  gallery: [],
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
  gallery: hotel.gallery || [],
  amenities: (hotel.amenities || []).join(', '),
  facilities: (hotel.facilities || []).join(', '),
  rooms: (hotel.rooms || []).map((room) => ({ ...emptyRoom(), ...room, perks: (room.perks || []).join(', ') })),
});

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

  const set = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));

  const addRoom = () => setForm((current) => ({ ...current, rooms: [...current.rooms, emptyRoom()] }));

  const removeRoom = (index) =>
    setForm((current) => ({ ...current, rooms: current.rooms.filter((_, i) => i !== index) }));

  const patchRoom = (index, patch) =>
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
        <FormWizard
          title={editing === 'new' ? 'Add hotel' : 'Edit hotel'}
          saving={saving}
          onClose={() => setEditing(null)}
          onSubmit={submit}
          submitLabel={editing === 'new' ? 'Create hotel' : 'Save changes'}
          steps={[
            {
              title: 'Basics',
              hint: 'What the property is, and how it sits in the list.',
              isComplete: () => Boolean(String(form.name).trim() && String(form.city).trim()),
              incompleteMessage: 'A name and a city are required.',
              render: () => (
                <>
                  <Field label="Name *" span={2}>
                    <input className={inputClass} value={form.name} onChange={set('name')} required />
                  </Field>
                  <Field label="City *">
                    <input className={inputClass} value={form.city} onChange={set('city')} required />
                  </Field>
                  <Field label="Property type">
                    <select className={inputClass} value={form.propertyType} onChange={set('propertyType')}>
                      <option value="">Unclassified</option>
                      {['Hotel', 'Resort', 'Apartment', 'Guest House', 'Villa', 'Homestay', 'Hostel'].map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Star class" hint="Official 1 - 5 rating; 0 hides it">
                    <select
                      className={inputClass}
                      value={form.starRating}
                      onChange={(e) => setForm((f) => ({ ...f, starRating: Number(e.target.value) }))}
                    >
                      <option value={0}>Unclassified</option>
                      {[1, 2, 3, 4, 5].map((star) => <option key={star} value={star}>{star} Star</option>)}
                    </select>
                  </Field>
                  <Field label="Badge" hint="Popular, Best Value...">
                    <input className={inputClass} value={form.badge} onChange={set('badge')} />
                  </Field>
                  <Field label="Guest rating" hint="0 - 5">
                    <input type="number" step="0.1" min="0" max="5" className={inputClass} value={form.rating} onChange={set('rating')} />
                  </Field>
                  <Field label="Review count">
                    <input className={inputClass} value={form.reviews} onChange={set('reviews')} />
                  </Field>
                  <Field label="Sort order" hint="Lower shows first">
                    <input type="number" className={inputClass} value={form.sortOrder} onChange={set('sortOrder')} />
                  </Field>
                </>
              ),
            },
            {
              title: 'Location',
              hint: 'The pin drives nearby search. Without it this hotel is left out of it.',
              render: () => (
                <>
                  <Field label="Area">
                    <input className={inputClass} value={form.area} onChange={set('area')} />
                  </Field>
                  <Field label="Distance line" hint="e.g. 2.3 km from City Centre" span={2}>
                    <input className={inputClass} value={form.distance} onChange={set('distance')} />
                  </Field>
                  <Field label="Latitude">
                    <input type="number" step="0.000001" className={inputClass} value={form.latitude} onChange={set('latitude')} />
                  </Field>
                  <Field label="Longitude">
                    <input type="number" step="0.000001" className={inputClass} value={form.longitude} onChange={set('longitude')} />
                  </Field>
                  <div className="col-span-3">
                    <LocationPicker
                      latitude={form.latitude}
                      longitude={form.longitude}
                      onPick={({ latitude, longitude }) => setForm((f) => ({ ...f, latitude, longitude }))}
                    />
                  </div>
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
                    hint="Shown on the list card and at the top of the detail page"
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
              title: 'Rooms',
              hint: 'Each room type is priced as a multiple of the nightly rate on the next step.',
              isComplete: () => form.rooms.length > 0 && form.rooms.every((room) => String(room.name).trim()),
              incompleteMessage: 'Every room needs a name.',
              render: () => (
                <div className="col-span-3 space-y-3">
                  {form.rooms.map((room, index) => (
                    <div key={index} className="rounded-xl border border-slate-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[13px] font-bold text-slate-800">Room {index + 1}</p>
                        {form.rooms.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeRoom(index)}
                            className="rounded-lg bg-red-50 px-2 py-1 text-[11.5px] font-bold text-red-600"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <Field label="Room name *" span={2}>
                          <input className={inputClass} value={room.name} onChange={(e) => patchRoom(index, { name: e.target.value })} required />
                        </Field>
                        <Field label="Category">
                          <input className={inputClass} value={room.category} onChange={(e) => patchRoom(index, { category: e.target.value })} />
                        </Field>
                        <Field label="Rate multiplier" hint="1 = the nightly rate">
                          <input type="number" step="0.01" min="0" className={inputClass} value={room.priceMultiplier} onChange={(e) => patchRoom(index, { priceMultiplier: e.target.value })} />
                        </Field>
                        <Field label="Adults">
                          <input type="number" min="1" className={inputClass} value={room.adults} onChange={(e) => patchRoom(index, { adults: e.target.value })} />
                        </Field>
                        <Field label="Children">
                          <input type="number" min="0" className={inputClass} value={room.children} onChange={(e) => patchRoom(index, { children: e.target.value })} />
                        </Field>
                        <Field label="Bed">
                          <input className={inputClass} value={room.bed} onChange={(e) => patchRoom(index, { bed: e.target.value })} />
                        </Field>
                        <Field label="Size (sqft)">
                          <input type="number" min="0" className={inputClass} value={room.sqft} onChange={(e) => patchRoom(index, { sqft: e.target.value })} />
                        </Field>
                        <Field label="Rooms left">
                          <input type="number" min="0" className={inputClass} value={room.roomsLeft} onChange={(e) => patchRoom(index, { roomsLeft: e.target.value })} />
                        </Field>
                        <Field label="Perks" hint="Comma separated" span={3}>
                          <input className={inputClass} value={room.perks} onChange={(e) => patchRoom(index, { perks: e.target.value })} />
                        </Field>
                        <ImageField
                          label="Room photo"
                          span={3}
                          value={room.image}
                          onChange={(url) => patchRoom(index, { image: url })}
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addRoom}
                    className="rounded-lg border border-dashed border-slate-300 px-4 py-2 text-[13px] font-bold text-slate-600"
                  >
                    + Add room type
                  </button>
                </div>
              ),
            },
            {
              title: 'Rates & details',
              hint: 'The nightly rate every room multiplies, plus what guests see listed.',
              isComplete: () => String(form.price).trim() !== '',
              incompleteMessage: 'A nightly rate is required.',
              render: () => (
                <>
                  <Field label="Rate / night (Rs) *">
                    <input type="number" min="0" className={inputClass} value={form.price} onChange={set('price')} required />
                  </Field>
                  <Field label="Strike-through rate (Rs)">
                    <input type="number" min="0" className={inputClass} value={form.oldPrice} onChange={set('oldPrice')} />
                  </Field>
                  <Field label="Check-in">
                    <input className={inputClass} value={form.checkInTime} onChange={set('checkInTime')} />
                  </Field>
                  <Field label="Check-out">
                    <input className={inputClass} value={form.checkOutTime} onChange={set('checkOutTime')} />
                  </Field>
                  <Field label="Amenities" hint="Comma separated - shown on the list card" span={3}>
                    <input className={inputClass} value={form.amenities} onChange={set('amenities')} />
                  </Field>
                  <Field label="Facilities" hint="Comma separated - shown on the detail page" span={3}>
                    <input className={inputClass} value={form.facilities} onChange={set('facilities')} />
                  </Field>
                  <label className="col-span-3 flex items-center gap-2">
                    <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                    <span className="text-[12.5px] font-bold text-slate-800">Show this hotel to guests</span>
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

export default HotelsAdmin;
