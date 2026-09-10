import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Armchair, Loader2, Pencil, Plus, Save, Trash2, Users, X } from 'lucide-react';
import contentApi from '../../services/contentApi';

/**
 * Shared taxi departures. Unlike the other content screens this is inventory:
 * riders buy individual seats against these rows, so a trip that already has
 * bookings must be edited carefully.
 *
 * Hence the one rule enforced here: seats are generated once, when a trip is
 * created, and are never regenerated on edit. Rewriting the seat array of a
 * trip someone has already booked would silently free their seat.
 */

const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** A1, A2, B1, B2 ... matching the labels the rider-facing seat map renders. */
const buildSeats = (count) =>
  Array.from({ length: Math.max(0, Math.min(Number(count) || 0, 12)) }, (_, index) => ({
    label: `${SEAT_ROWS[Math.floor(index / 2)] || 'X'}${(index % 2) + 1}`,
    status: 'available',
    bookingReference: '',
  }));

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const emptyForm = () => ({
  fromLabel: '',
  toLabel: '',
  travelDate: todayKey(),
  departure: '',
  duration: '',
  pricePerSeat: '',
  vehicleName: '',
  vehiclePlate: '',
  driverName: '',
  rating: 4.5,
  seatCount: 8,
  active: true,
});

const toForm = (trip) => ({
  ...emptyForm(),
  ...trip,
  seatCount: (trip.seats || []).length || 8,
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

const seatCounts = (trip) => {
  const seats = trip.seats || [];
  return {
    total: seats.length,
    booked: seats.filter((seat) => seat.status === 'booked').length,
  };
};

const SharedTaxiAdmin = () => {
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
      const data = await contentApi.listSharedTaxiTrips();
      setItems(data?.results || data?.data?.results || []);
    } catch (loadError) {
      setError(loadError?.message || 'Could not load shared taxi trips');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key) => (event) => {
    const value =
      event?.target?.type === 'checkbox' ? event.target.checked : event?.target?.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const startCreate = () => {
    setEditing('new');
    setForm(emptyForm());
  };

  const startEdit = (trip) => {
    setEditing(trip._id);
    setForm(toForm(trip));
  };

  const close = () => {
    setEditing(null);
    setError('');
  };

  const save = async () => {
    setSaving(true);
    setError('');

    const { seatCount, seats, _id, __v, createdAt, updatedAt, seatsAvailable, id, ...rest } = form;

    const body = {
      ...rest,
      pricePerSeat: Number(form.pricePerSeat) || 0,
      rating: Number(form.rating) || 0,
    };

    try {
      if (editing === 'new') {
        // Seats exist only from creation onward - see the note at the top.
        await contentApi.createSharedTaxiTrip({ ...body, seats: buildSeats(seatCount) });
      } else {
        await contentApi.updateSharedTaxiTrip(editing, body);
      }
      close();
      await load();
    } catch (saveError) {
      setError(saveError?.message || 'Could not save this trip');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (trip) => {
    const { booked } = seatCounts(trip);
    const warning = booked
      ? `${trip.fromLabel} to ${trip.toLabel} has ${booked} booked seat(s). Deleting it will not refund or notify those riders. Delete anyway?`
      : `Delete ${trip.fromLabel} to ${trip.toLabel}?`;

    if (!window.confirm(warning)) return;

    try {
      await contentApi.deleteSharedTaxiTrip(trip._id);
      await load();
    } catch (deleteError) {
      setError(deleteError?.message || 'Could not delete this trip');
    }
  };

  const upcoming = useMemo(() => {
    const today = todayKey();
    return items.filter((trip) => String(trip.travelDate || '') >= today).length;
  }, [items]);

  return (
    <div className="p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[19px] font-bold text-slate-900">Shared Taxi Departures</h1>
          <p className="mt-0.5 text-[12px] text-slate-500">
            Riders book individual seats on these. {upcoming} upcoming of {items.length} total.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white"
        >
          <Plus size={15} /> Add departure
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-[12.5px] font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Loader2 size={15} className="animate-spin" /> Loading departures...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center">
          <Armchair size={22} className="mx-auto text-slate-300" />
          <p className="mt-2 text-[14px] font-semibold text-slate-700">No departures yet</p>
          <p className="mt-1 text-[12px] text-slate-500">
            The rider-facing Shared Taxi screen stays empty until a departure is added here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Departs</th>
                <th className="px-4 py-3">Fare</th>
                <th className="px-4 py-3">Seats</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((trip) => {
                const { total, booked } = seatCounts(trip);
                return (
                  <tr key={trip._id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{trip.fromLabel}</p>
                      <p className="text-[11.5px] text-slate-500">to {trip.toLabel}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{trip.travelDate}</td>
                    <td className="px-4 py-3 text-slate-700">{trip.departure || '--'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      ₹{Number(trip.pricePerSeat || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Users size={13} className="text-slate-400" />
                        {total - booked} free / {total}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{trip.vehicleName || '--'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                          trip.active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {trip.active ? 'Live' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(trip)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600"
                          aria-label="Edit departure"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(trip)}
                          className="rounded-lg border border-red-100 p-1.5 text-red-600"
                          aria-label="Delete departure"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4">
          <div className="mt-10 w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-slate-900">
                {editing === 'new' ? 'Add departure' : 'Edit departure'}
              </h2>
              <button type="button" onClick={close} className="p-1 text-slate-400" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="From">
                <input className={input} value={form.fromLabel} onChange={set('fromLabel')} placeholder="Indore (Vijay Nagar)" />
              </Field>
              <Field label="To">
                <input className={input} value={form.toLabel} onChange={set('toLabel')} placeholder="Bhopal (MP Nagar)" />
              </Field>
              <Field label="Travel date" hint="YYYY-MM-DD. Past dates are hidden from riders.">
                <input type="date" className={input} value={form.travelDate} onChange={set('travelDate')} />
              </Field>
              <Field label="Departure time">
                <input className={input} value={form.departure} onChange={set('departure')} placeholder="07:30 AM" />
              </Field>
              <Field label="Duration">
                <input className={input} value={form.duration} onChange={set('duration')} placeholder="3h 15m" />
              </Field>
              <Field label="Fare per seat">
                <input type="number" className={input} value={form.pricePerSeat} onChange={set('pricePerSeat')} placeholder="249" />
              </Field>
              <Field label="Vehicle">
                <input className={input} value={form.vehicleName} onChange={set('vehicleName')} placeholder="Toyota Innova" />
              </Field>
              <Field label="Plate">
                <input className={input} value={form.vehiclePlate} onChange={set('vehiclePlate')} placeholder="MP09 AB 1234" />
              </Field>
              <Field label="Driver">
                <input className={input} value={form.driverName} onChange={set('driverName')} placeholder="Rahul Patel" />
              </Field>
              <Field label="Rating">
                <input type="number" step="0.1" max="5" className={input} value={form.rating} onChange={set('rating')} />
              </Field>

              {editing === 'new' ? (
                <Field label="Seats" hint="Max 12. Labelled A1, A2, B1, B2 and so on.">
                  <input type="number" min="1" max="12" className={input} value={form.seatCount} onChange={set('seatCount')} />
                </Field>
              ) : (
                <Field label="Seats" hint="Fixed after creation, so a booked seat is never freed by an edit.">
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-[12.5px] text-slate-600">
                    {form.seats?.length || 0} seats ·{' '}
                    {(form.seats || []).filter((seat) => seat.status === 'booked').length} booked
                  </p>
                </Field>
              )}

              <Field label="Visible to riders">
                <label className="flex items-center gap-2 py-2 text-[13px] text-slate-700">
                  <input type="checkbox" checked={Boolean(form.active)} onChange={set('active')} />
                  Live
                </label>
              </Field>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button type="button" onClick={close} className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-600">
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SharedTaxiAdmin;
