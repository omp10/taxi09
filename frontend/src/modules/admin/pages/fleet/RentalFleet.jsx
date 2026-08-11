import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Car, ChevronRight, Plus, Trash2, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';

/**
 * The fleet: one row per physical car.
 *
 * A rental vehicle type is a model line ("Maruti Baleno 2024-25") and holds the
 * photos, pricing and description a customer sees. This page manages the actual
 * cars behind it, which is what availability counts - five Balenos can take
 * five overlapping bookings, where before any one booking blocked the model.
 *
 * A model with no cars registered is treated as having exactly one, so the
 * catalogue keeps working while the fleet is still being entered.
 */

const unwrap = (response) =>
  response?.data?.data?.results ||
  response?.data?.results ||
  response?.results ||
  [];

const STATUSES = [
  { value: 'available', label: 'Available', tone: 'bg-emerald-50 text-emerald-700' },
  { value: 'maintenance', label: 'Maintenance', tone: 'bg-amber-50 text-amber-700' },
  { value: 'retired', label: 'Retired', tone: 'bg-slate-100 text-slate-500' },
];

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/60';
const labelClass = 'mb-1.5 block text-[12px] font-bold text-slate-700';

const emptyDraft = {
  registrationNumber: '',
  vehicleTypeId: '',
  serviceStoreId: '',
  status: 'available',
  odometerKm: '',
  colour: '',
  notes: '',
};

const RentalFleet = () => {
  const [units, setUnits] = useState([]);
  const [summary, setSummary] = useState([]);
  const [models, setModels] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState('');
  const [filter, setFilter] = useState({ vehicleTypeId: '', status: '', search: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fleetRes, summaryRes, modelRes, storeRes] = await Promise.all([
        adminService.getRentalFleet(
          Object.fromEntries(Object.entries(filter).filter(([, value]) => String(value || '').trim())),
        ),
        adminService.getRentalFleetSummary(),
        adminService.getRentalVehicleTypes(),
        adminService.getServiceStores(),
      ]);
      setUnits(unwrap(fleetRes));
      setSummary(unwrap(summaryRes));
      setModels(unwrap(modelRes));
      setStores(unwrap(storeRes));
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Could not load the fleet.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(
    () => summary.reduce(
      (acc, row) => ({
        cars: acc.cars + Number(row.total || 0),
        available: acc.available + Number(row.available || 0),
        maintenance: acc.maintenance + Number(row.maintenance || 0),
        modelsWithNone: acc.modelsWithNone + (Number(row.total || 0) === 0 ? 1 : 0),
      }),
      { cars: 0, available: 0, maintenance: 0, modelsWithNone: 0 },
    ),
    [summary],
  );

  const startEdit = (unit) => {
    setEditingId(unit.id);
    setDraft({
      registrationNumber: unit.registrationNumber || '',
      vehicleTypeId: unit.vehicleTypeId || '',
      serviceStoreId: unit.serviceStoreId || '',
      status: unit.status || 'available',
      odometerKm: unit.odometerKm ?? '',
      colour: unit.colour || '',
      notes: unit.notes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId('');
    setDraft(emptyDraft);
  };

  const save = async () => {
    if (!draft.registrationNumber.trim()) return toast.error('Registration number is required');
    if (!draft.vehicleTypeId) return toast.error('Pick which model this car is');

    setSaving(true);
    try {
      const payload = { ...draft, odometerKm: Number(draft.odometerKm || 0) };
      if (editingId) {
        await adminService.updateRentalVehicleUnit(editingId, payload);
        toast.success('Vehicle updated');
      } else {
        await adminService.createRentalVehicleUnit(payload);
        toast.success('Vehicle added to the fleet');
      }
      cancelEdit();
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Could not save the vehicle.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (unit) => {
    if (!window.confirm(`Remove ${unit.registrationNumber} from the fleet?`)) return;
    try {
      await adminService.deleteRentalVehicleUnit(unit.id);
      toast.success('Vehicle removed');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Could not remove the vehicle.');
    }
  };

  const update = (key) => (event) => setDraft((current) => ({ ...current, [key]: event.target.value }));

  return (
    <div className="min-h-screen bg-[#f6f7fb] p-6 lg:p-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
          <span>Fleet</span>
          <ChevronRight size={12} />
          <span className="text-slate-700">Rental Vehicles</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Fleet</h1>
        <p className="mt-1 text-sm text-slate-500">
          The individual cars behind each rental model. Availability counts these, so registering
          five Balenos lets five customers book a Baleno for the same weekend.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-4">
        {[
          { label: 'Cars in fleet', value: totals.cars, icon: Car, tone: 'bg-indigo-50 text-indigo-600' },
          { label: 'Available', value: totals.available, icon: Car, tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'In maintenance', value: totals.maintenance, icon: Wrench, tone: 'bg-amber-50 text-amber-600' },
          { label: 'Models with no cars', value: totals.modelsWithNone, icon: Car, tone: 'bg-rose-50 text-rose-600' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totals.modelsWithNone > 0 ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>{totals.modelsWithNone}</strong> rental model
          {totals.modelsWithNone === 1 ? ' has' : 's have'} no cars registered yet. Those are treated as
          having one car each, so a single booking still blocks them. Add their real cars below to fix that.
        </div>
      ) : null}

      {/* ------------------------------------------------------------ Editor */}
      <div className="mb-6 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          {editingId ? 'Edit vehicle' : 'Add a vehicle to the fleet'}
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className={labelClass}>Registration number *</label>
            <input
              value={draft.registrationNumber}
              onChange={update('registrationNumber')}
              className={inputClass}
              placeholder="MP09 AB 1234"
            />
          </div>
          <div>
            <label className={labelClass}>Model *</label>
            <select value={draft.vehicleTypeId} onChange={update('vehicleTypeId')} className={inputClass}>
              <option value="">Select a rental model</option>
              {models.map((model) => (
                <option key={model.id || model._id} value={model.id || model._id}>{model.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Branch</label>
            <select value={draft.serviceStoreId} onChange={update('serviceStoreId')} className={inputClass}>
              <option value="">Not assigned</option>
              {stores.map((store) => (
                <option key={store.id || store._id} value={store.id || store._id}>{store.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={draft.status} onChange={update('status')} className={inputClass}>
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Odometer (km)</label>
            <input type="number" min="0" value={draft.odometerKm} onChange={update('odometerKm')} className={inputClass} placeholder="41250" />
          </div>
          <div>
            <label className={labelClass}>Colour</label>
            <input value={draft.colour} onChange={update('colour')} className={inputClass} placeholder="White" />
          </div>
          <div className="md:col-span-3">
            <label className={labelClass}>Notes</label>
            <input value={draft.notes} onChange={update('notes')} className={inputClass} placeholder="Anything staff should know about this car" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2e3c78] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#24305f] disabled:opacity-60"
          >
            <Plus size={16} />
            {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add vehicle'}
          </button>
          {editingId ? (
            <button type="button" onClick={cancelEdit} className="text-sm font-medium text-slate-500 hover:text-slate-700">
              Cancel
            </button>
          ) : null}
        </div>
      </div>

      {/* -------------------------------------------------------------- List */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={filter.search}
          onChange={(event) => setFilter((current) => ({ ...current, search: event.target.value }))}
          placeholder="Search registration"
          className={`${inputClass} max-w-[240px]`}
        />
        <select
          value={filter.vehicleTypeId}
          onChange={(event) => setFilter((current) => ({ ...current, vehicleTypeId: event.target.value }))}
          className={`${inputClass} max-w-[220px]`}
        >
          <option value="">All models</option>
          {models.map((model) => (
            <option key={model.id || model._id} value={model.id || model._id}>{model.name}</option>
          ))}
        </select>
        <select
          value={filter.status}
          onChange={(event) => setFilter((current) => ({ ...current, status: event.target.value }))}
          className={`${inputClass} max-w-[180px]`}
        >
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[160px_minmax(0,1fr)_180px_130px_110px_140px] gap-4 border-b border-slate-100 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
          <span>Registration</span>
          <span>Model</span>
          <span>Branch</span>
          <span>Status</span>
          <span>Odometer</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="p-8 text-sm text-slate-400">Loading the fleet...</div>
        ) : units.length === 0 ? (
          <div className="p-8 text-sm text-slate-400">
            No cars registered yet. Until they are, every model is treated as having a single car.
          </div>
        ) : (
          units.map((unit) => {
            const status = STATUSES.find((item) => item.value === unit.status) || STATUSES[0];
            return (
              <div
                key={unit.id}
                className="grid grid-cols-[160px_minmax(0,1fr)_180px_130px_110px_140px] items-center gap-4 border-b border-slate-100 px-6 py-4 last:border-b-0"
              >
                <span className="font-mono text-sm font-bold text-slate-900">{unit.registrationNumber}</span>
                <span className="truncate text-sm text-slate-700">{unit.vehicleTypeName || '-'}</span>
                <span className="truncate text-sm text-slate-500">{unit.serviceStoreName || 'Not assigned'}</span>
                <span>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${status.tone}`}>
                    {status.label}
                  </span>
                </span>
                <span className="text-sm text-slate-600">{Number(unit.odometerKm || 0).toLocaleString('en-IN')}</span>
                <span className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(unit)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(unit)}
                    className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    title="Remove from fleet"
                  >
                    <Trash2 size={15} />
                  </button>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RentalFleet;
