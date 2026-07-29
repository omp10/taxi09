import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock3,
  IndianRupee,
  Luggage,
  Mail,
  MapPin,
  Phone,
  User2,
  Users,
  ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/60';

const statusClasses = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  reviewing: 'bg-sky-50 text-sky-700 border-sky-100',
  quoted: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-rose-50 text-rose-700 border-rose-100',
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : 'Not set');

const RentalQuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await adminService.getRentalQuoteRequest(id);
        if (!mounted) return;
        const data = response?.data?.data || response?.data || response;
        setItem(data);
      } catch (error) {
        if (mounted) {
          toast.error(error?.message || 'Could not load quote details.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchDetail();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleFieldChange = (key, value) => {
    setItem((current) => (current ? { ...current, [key]: value } : null));
  };

  const handleSave = async () => {
    if (!item) return;
    setSaving(true);
    try {
      const updated = await adminService.updateRentalQuoteRequest(id, {
        status: item.status,
        adminQuotedAmount: Number(item.adminQuotedAmount || 0),
        adminNote: item.adminNote || '',
      });
      const data = updated?.data?.data || updated?.data || updated;
      setItem(data);
      toast.success(item.status === 'quoted' ? 'Quote shared successfully' : 'Quote request updated');
      navigate('/admin/pricing/rental-quotes');
    } catch (error) {
      toast.error(error?.message || 'Could not save quote request.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7fb] p-6 lg:p-8 flex items-center justify-center">
        <div className="text-slate-500 font-medium">Loading quote details...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#f6f7fb] p-6 lg:p-8 flex flex-col items-center justify-center">
        <div className="text-slate-500 font-medium mb-4">Quote request not found.</div>
        <button
          onClick={() => navigate('/admin/pricing/rental-quotes')}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <ArrowLeft size={16} /> Back to Requests
        </button>
      </div>
    );
  }

  const status = String(item.status || 'pending').toLowerCase();
  const statusClass = statusClasses[status] || statusClasses.pending;

  return (
    <div className="min-h-screen bg-[#f6f7fb] p-6 lg:p-8 admin-theme">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <button onClick={() => navigate('/admin/pricing/rental-quotes')} className="hover:text-slate-600">
            Rental Quote Requests
          </button>
          <span>/</span>
          <span className="text-slate-700 font-medium">Details</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/pricing/rental-quotes')}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition hover:shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quote Request Details</h1>
            <p className="text-xs text-slate-400 mt-0.5">Request ID: {id}</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Columns - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Info */}
          <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{item.vehicleName || 'Rental Vehicle'}</h2>
                <p className="text-sm font-semibold text-slate-500 mt-1">
                  {item.vehicleCategory || item.vehicleTypeId?.vehicleCategory || 'Vehicle Category'}
                </p>
              </div>
              <span className={`rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider ${statusClass}`}>
                {status}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                  <User2 size={15} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Customer Name</span>
                </div>
                <p className="text-sm font-black text-slate-950">{item.userId?.name || item.contactName || 'Unknown user'}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                  <Phone size={15} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Phone Number</span>
                </div>
                <p className="text-sm font-black text-slate-950">{item.userId?.phone || item.contactPhone || 'No phone'}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                  <Mail size={15} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Email Address</span>
                </div>
                <p className="text-sm font-black text-slate-950 truncate">{item.userId?.email || item.contactEmail || 'No email'}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                  <Clock3 size={15} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Requested Hours</span>
                </div>
                <p className="text-sm font-black text-slate-950">
                  {Number(item.requestedHours || 0) > 0 ? `${item.requestedHours} hr` : 'Not specified'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                  <Users size={15} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Seats Requested</span>
                </div>
                <p className="text-sm font-black text-slate-950">
                  {Number(item.seatsNeeded || 0) > 0 ? item.seatsNeeded : 'Not specified'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                  <Luggage size={15} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Luggage Bags Needed</span>
                </div>
                <p className="text-sm font-black text-slate-950">{Number(item.luggageNeeded || 0)}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                  <CalendarDays size={15} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Pickup Date & Time</span>
                </div>
                <p className="text-sm font-black text-slate-950">{formatDateTime(item.pickupDateTime)}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                  <CalendarDays size={15} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Return Date & Time</span>
                </div>
                <p className="text-sm font-black text-slate-950">{formatDateTime(item.returnDateTime)}</p>
              </div>
            </div>
          </div>

          {/* Locations & Requirements */}
          <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              Route & Special Instructions
            </h3>
            <div className="space-y-4 text-sm font-semibold text-slate-700">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 mt-0.5">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-xs uppercase tracking-wide">Pickup Location</p>
                  <p className="text-slate-600 mt-1">{item.pickupLocation || 'Not shared yet'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 mt-0.5">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-xs uppercase tracking-wide">Drop Location</p>
                  <p className="text-slate-600 mt-1">{item.dropLocation || 'Not shared yet'}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-50">
                <p className="font-black text-slate-900 text-xs uppercase tracking-wide">Special Requirements / Notes</p>
                <p className="mt-1 text-slate-600 font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-line leading-relaxed">
                  {item.specialRequirements || 'No extra requirements specified.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Action Panel */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              Quote Assignment
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Update Status
                </label>
                <select
                  value={item.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  className={inputClass}
                >
                  <option value="pending">Pending</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="quoted">Quoted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Quoted Amount (Rs)
                </label>
                <div className="relative">
                  <IndianRupee size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    value={item.adminQuotedAmount || ''}
                    onChange={(e) => handleFieldChange('adminQuotedAmount', e.target.value)}
                    className={`${inputClass} pl-10`}
                    placeholder="Enter quoted amount"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Admin Notes / Rejection Reason
                </label>
                <textarea
                  rows="6"
                  value={item.adminNote || ''}
                  onChange={(e) => handleFieldChange('adminNote', e.target.value)}
                  className={inputClass}
                  placeholder="Enter custom quote details, instructions, or rejection reasons here..."
                />
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full py-4 bg-[#2e3c78] hover:bg-[#24305f] text-white rounded-xl text-sm font-semibold transition disabled:opacity-60 uppercase tracking-wider shadow-lg shadow-indigo-100"
              >
                {saving ? 'Saving Changes...' : 'Save and Send Quote'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalQuoteDetail;
