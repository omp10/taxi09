import React, { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Filter,
  ChevronRight,
  Trash2,
  Ticket,
  Zap,
  Percent,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  Hash,
  Pencil,
  IndianRupee,
  Car,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const BASE = globalThis.__LEGACY_BACKEND_ORIGIN__ + '/api/v1/admin/rental-coupons';
const LIST_PATH = '/admin/pricing/rental-coupons';
const CREATE_PATH = '/admin/pricing/rental-coupons/create';
const Motion = motion;

const inputClass =
  'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed';
const labelClass = 'block text-xs font-semibold text-gray-500 mb-1.5';

const createInitialFormData = () => ({
  code: '',
  description: '',
  type: 'flat',
  amount: '',
  cap: '0',
  min_booking_amount: '0',
  expiry_date: '',
  active: true,
  vehicle_ids: [],
});

const HeaderBlock = ({ isCreateRoute, isEditRoute, onBack }) => {
  const title = isEditRoute ? 'Edit Rental Coupon' : isCreateRoute ? 'Create Rental Coupon' : 'Rental Coupons';
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
        <span>Rental</span>
        <ChevronRight size={12} />
        <span className="text-gray-700">{title}</span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {isCreateRoute || isEditRoute ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
        ) : null}
      </div>
    </div>
  );
};

const SectionCard = ({ icon: Icon, title, description, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
        <Icon size={18} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

const FieldLabel = ({ icon: Icon, children, required = false }) => (
  <label className={labelClass}>
    <Icon size={12} className="inline mr-1 text-gray-400" />
    {children}
    {required ? ' *' : ''}
  </label>
);

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (err) {
    return dateString;
  }
};

const getStatusInfo = (coupon) => {
  if (!coupon.active) return { label: 'Disabled', color: 'bg-rose-50 text-rose-700' };
  const now = new Date();
  const expiry = new Date(coupon.expiry_date);
  if (now > expiry) return { label: 'Expired', color: 'bg-amber-50 text-amber-700' };
  return { label: 'Active', color: 'bg-emerald-50 text-emerald-700' };
};

const RentalCoupons = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isCreateRoute = location.pathname.includes('/create');
  const isEditRoute = location.pathname.includes('/edit/');
  const isFormView = isCreateRoute || isEditRoute;

  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(createInitialFormData);
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles, setVehicles] = useState([]);

  const token = localStorage.getItem('adminToken') || '';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(BASE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCoupons(data.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch(globalThis.__LEGACY_BACKEND_ORIGIN__ + '/api/v1/admin/types/rental-vehicles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const results = data.data?.results || data.data || data.results || [];
        setVehicles(results);
      }
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isEditRoute && id && coupons.length > 0) {
      const coupon = coupons.find((c) => String(c._id) === String(id));
      if (coupon) {
        setFormData({
          code: coupon.code || '',
          description: coupon.description || '',
          type: coupon.type || 'flat',
          amount: coupon.amount || '',
          cap: coupon.cap !== undefined ? coupon.cap : '0',
          min_booking_amount: coupon.min_booking_amount !== undefined ? coupon.min_booking_amount : '0',
          expiry_date: coupon.expiry_date ? new Date(coupon.expiry_date).toISOString().split('T')[0] : '',
          active: coupon.active !== false,
          vehicle_ids: Array.isArray(coupon.vehicle_ids)
            ? coupon.vehicle_ids.map(v => typeof v === 'object' && v !== null ? v._id || v.id : v)
            : [],
        });
      }
    } else if (!isFormView) {
      setFormData(createInitialFormData());
    }
  }, [isEditRoute, isFormView, id, coupons]);

  const handleFieldChange = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        cap: Number(formData.cap),
        min_booking_amount: Number(formData.min_booking_amount),
      };

      const url = isEditRoute ? `${BASE}/${id}` : BASE;
      const method = isEditRoute ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setFormData(createInitialFormData());
        await fetchData();
        navigate(LIST_PATH);
      } else {
        alert(data.message || `Failed to ${isEditRoute ? 'update' : 'create'} coupon`);
      }
    } catch (error) {
      console.error(error);
      alert('Network Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await fetch(`${BASE}/${couponId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      } else {
        alert(data.message || 'Failed to delete coupon');
      }
    } catch (err) {
      console.error(err);
      alert('Network Error');
    }
  };

  const handleToggleStatus = async (couponId) => {
    try {
      const res = await fetch(`${BASE}/${couponId}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      } else {
        alert(data.message || 'Failed to toggle status');
      }
    } catch (err) {
      console.error(err);
      alert('Network Error');
    }
  };

  const filteredCoupons = coupons.filter((coupon) => {
    if (!searchQuery.trim()) return true;
    return coupon.code.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  return (
    <div className="min-h-full bg-gray-50 text-gray-900 p-6">
      <HeaderBlock
        isCreateRoute={isCreateRoute}
        isEditRoute={isEditRoute}
        onBack={() => navigate(LIST_PATH)}
      />

      <AnimatePresence mode="wait">
        {!isFormView ? (
          <Motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span className="font-medium text-gray-600">Rental coupons management</span>
                  <span className="hidden sm:inline text-gray-300">|</span>
                  <span>Total: {filteredCoupons.length}</span>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search coupon code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-indigo-500 w-full sm:w-64"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(CREATE_PATH)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus size={16} /> Add Coupon
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50">
                    <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Code</th>
                      <th className="px-6 py-4">Discount Details</th>
                      <th className="px-6 py-4">Min Booking Amount</th>
                      <th className="px-6 py-4">Expiry Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-16 text-center text-sm text-gray-400">
                          Fetching coupons...
                        </td>
                      </tr>
                    ) : filteredCoupons.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-3 text-gray-400">
                            <Ticket size={44} strokeWidth={1.5} />
                            <p className="text-sm font-medium">No rental coupons found.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCoupons.map((coupon) => (
                        <tr key={coupon._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="inline-flex rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
                              {coupon.code}
                            </span>
                            {coupon.description && (
                              <p className="text-xs text-gray-400 mt-1 max-w-[200px] truncate">{coupon.description}</p>
                            )}
                            {coupon.vehicle_ids && coupon.vehicle_ids.length > 0 ? (
                              <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                                  Restricted
                                </span>
                                <span className="text-[10px] text-gray-500 font-semibold truncate max-w-[160px]" title={coupon.vehicle_ids.map(v => v.name).join(', ')}>
                                  {coupon.vehicle_ids.map(v => v.name).join(', ')}
                                </span>
                              </div>
                            ) : (
                              <p className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full w-fit border border-gray-200/50 mt-1.5">
                                All Vehicles
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {coupon.type === 'percent' ? (
                              <span>{coupon.amount}% off {coupon.cap > 0 ? `(Max Rs. ${coupon.cap})` : ''}</span>
                            ) : (
                              <span>Rs. {coupon.amount} off</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">Rs. {coupon.min_booking_amount}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDate(coupon.expiry_date)}
                          </td>
                          <td className="px-6 py-4">
                            {(() => {
                              const status = getStatusInfo(coupon);
                              return (
                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}>
                                  {status.label}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(coupon._id)}
                                className={`inline-flex rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                                  coupon.active !== false
                                    ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                }`}
                              >
                                {coupon.active !== false ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate(`${LIST_PATH}/edit/${coupon._id}`)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(coupon._id)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Motion.div>
        ) : (
          <Motion.form
            key="form"
            onSubmit={handleSave}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6"
          >
            <div className="space-y-6 max-w-4xl">
              <SectionCard
                icon={Ticket}
                title={isEditRoute ? 'Edit Coupon Settings' : 'New Coupon Configuration'}
                description="Create or modify a coupon code configuration valid for rental vehicle bookings."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <FieldLabel icon={Ticket} required>
                      Coupon Code
                    </FieldLabel>
                    <input
                      type="text"
                      placeholder="e.g. RENTAL500"
                      required
                      value={formData.code}
                      onChange={(e) => handleFieldChange('code', e.target.value.toUpperCase())}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <FieldLabel icon={Zap} required>
                      Discount Type
                    </FieldLabel>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => handleFieldChange('type', e.target.value)}
                      className={inputClass}
                    >
                      <option value="flat">Flat Discount (Rs.)</option>
                      <option value="percent">Percentage (%)</option>
                    </select>
                  </div>

                  <div>
                    <FieldLabel icon={IndianRupee} required>
                      Discount Amount / %
                    </FieldLabel>
                    <input
                      type="number"
                      min="1"
                      placeholder={formData.type === 'percent' ? 'Discount Percentage (e.g. 10)' : 'Discount Amount (e.g. 500)'}
                      required
                      value={formData.amount}
                      onChange={(e) => handleFieldChange('amount', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  {formData.type === 'percent' && (
                    <div>
                      <FieldLabel icon={IndianRupee}>
                        Max Discount Cap (Rs.)
                      </FieldLabel>
                      <input
                        type="number"
                        min="0"
                        placeholder="Max limit for percentage discount (0 for no limit)"
                        value={formData.cap}
                        onChange={(e) => handleFieldChange('cap', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  )}

                  <div>
                    <FieldLabel icon={IndianRupee}>
                      Minimum Booking Amount (Rs.)
                    </FieldLabel>
                    <input
                      type="number"
                      min="0"
                      placeholder="Minimum booking charges required to apply this coupon"
                      value={formData.min_booking_amount}
                      onChange={(e) => handleFieldChange('min_booking_amount', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <FieldLabel icon={Calendar} required>
                      Expiry Date
                    </FieldLabel>
                    <input
                      type="date"
                      required
                      value={formData.expiry_date}
                      onChange={(e) => handleFieldChange('expiry_date', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FieldLabel icon={Hash}>
                      Description
                    </FieldLabel>
                    <textarea
                      placeholder="Enter description/terms for the coupon"
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      className={`${inputClass} h-20 resize-none`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FieldLabel icon={Car}>Restricted to Specific Vehicles</FieldLabel>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">
                          Select vehicles this coupon is applicable to (leave empty for All Vehicles)
                        </span>
                        {formData.vehicle_ids && formData.vehicle_ids.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleFieldChange('vehicle_ids', [])}
                            className="text-xs text-rose-600 font-semibold hover:underline"
                          >
                            Clear Selection
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {vehicles.map((vehicle) => {
                          const isChecked = formData.vehicle_ids && formData.vehicle_ids.includes(vehicle._id || vehicle.id);
                          return (
                            <label
                              key={vehicle._id || vehicle.id}
                              className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                                isChecked
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium font-semibold'
                                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const id = vehicle._id || vehicle.id;
                                  let newIds = [...(formData.vehicle_ids || [])];
                                  if (e.target.checked) {
                                    if (!newIds.includes(id)) newIds.push(id);
                                  } else {
                                    newIds = newIds.filter((x) => x !== id);
                                  }
                                  handleFieldChange('vehicle_ids', newIds);
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-xs truncate">{vehicle.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <FieldLabel icon={ShieldCheck}>Active Status</FieldLabel>
                    <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => handleFieldChange('active', e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">Available for Use</p>
                        <p className="text-xs text-gray-400">If unchecked, users cannot use this coupon code.</p>
                      </div>
                    </label>
                  </div>
                </div>
              </SectionCard>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate(LIST_PATH)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Coupon'}
                </button>
              </div>
            </div>
          </Motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RentalCoupons;
